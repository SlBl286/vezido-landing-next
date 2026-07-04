"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Loader2, Upload, Trash2 } from "lucide-react";
import { NotificationModal } from "./NotificationModal";
import { CustomSelect } from "@/app/cms/components/ui/custom-select";

interface ImportSupplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplies: any[];
  onSuccess: () => void;
}

export function ImportSupplyModal({ isOpen, onClose, supplies, onSuccess }: ImportSupplyModalProps) {
  const [form, setForm] = useState({
    itemId: "",
    quantity: "",
    pricePerUnit: "",
    purpose: ""
  });

  const [selectedFiles, setSelectedFiles] = useState<{ name: string; base64: string }[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "success"
  });

  // Set default selected item
  useEffect(() => {
    if (isOpen && supplies.length > 0 && !form.itemId) {
      setForm(prev => ({ ...prev, itemId: supplies[0].id }));
    }
  }, [isOpen, supplies]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        setError("Kích thước file không được vượt quá 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setSelectedFiles((prev) => [...prev, { name: file.name, base64: reader.result as string }]);
        }
      };
      reader.readAsDataURL(file);
    });
    // Clear value to allow choosing the same file again
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/cms/supplies/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: form.itemId,
          type: "IMPORT",
          quantity: Number(form.quantity),
          pricePerUnit: Number(form.pricePerUnit),
          purpose: form.purpose.trim(),
          invoices: selectedFiles.map(f => f.base64)
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Có lỗi xảy ra khi nhập hàng");
      }

      setNotification({
        isOpen: true,
        title: "Thành công!",
        message: "Nhập kho vật phẩm thành công.",
        type: "success"
      });

      setForm({
        itemId: supplies[0]?.id || "",
        quantity: "",
        pricePerUnit: "",
        purpose: ""
      });
      setSelectedFiles([]);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedItem = supplies.find(s => s.id === form.itemId);
  const totalCost = Number(form.quantity) * Number(form.pricePerUnit);

  const supplyOptions = supplies.map(s => ({
    value: s.id,
    label: `${s.name} (${s.quantity} ${s.unit} hiện tại)`
  }));

  return (
    <>
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto"
      >
        <div className="bg-white border-4 border-black rounded-[35px_15px_30px_10px/10px_30px_15px_35px] max-w-md w-full p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative my-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            <X className="w-5 h-5 text-black" />
          </button>

          <h3 className="text-2xl font-black text-black mb-1 flex items-center gap-2">
            📥 Nhập Kho Hàng Hóa
          </h3>
          <p className="text-gray-500 text-sm mb-6">Thực hiện nhập bổ sung số lượng và ghi nhận hóa đơn chi phí.</p>

          {error && (
            <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-xl p-3 mb-4 font-bold text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Chọn vật phẩm *</label>
              <CustomSelect
                value={form.itemId}
                onChange={(val) => setForm({ ...form, itemId: val })}
                options={supplyOptions}
                placeholder="Chọn vật phẩm..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Số lượng nhập *</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Số lượng..."
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none pr-12 text-sm"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                  {selectedItem && (
                    <span className="absolute right-3.5 text-xs text-gray-500 font-extrabold">{selectedItem.unit}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Đơn giá mua (VNĐ) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="Ví dụ: 15000"
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-sm"
                  value={form.pricePerUnit}
                  onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })}
                />
              </div>
            </div>

            {totalCost > 0 && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3 text-sm font-bold text-amber-800 flex justify-between">
                <span>Tổng chi phí dự kiến:</span>
                <span className="font-black text-black">{totalCost.toLocaleString("vi-VN")} đ</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Tải lên hóa đơn (Tùy chọn - PDF hoặc Ảnh)</label>
              <div className="border-3 border-dashed border-black rounded-xl p-4 bg-gray-50 flex flex-col items-center justify-center hover:bg-stone-50 cursor-pointer relative">
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-8 h-8 text-stone-500 mb-2" />
                <span className="text-xs font-bold text-stone-600">Click hoặc kéo thả tệp tại đây</span>
                <span className="text-[10px] text-stone-400 font-medium mt-1">Hỗ trợ nhiều tệp PDF, JPG, PNG (tối đa 5MB)</span>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-1.5 max-h-32 overflow-y-auto">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between border-2 border-black rounded-lg p-2 bg-white text-xs font-bold shadow-[1px_1px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-top-1 duration-100">
                      <span className="truncate flex-1 pr-2 text-stone-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Ghi chú / Nhà cung cấp</label>
              <textarea
                placeholder="Ví dụ: Nhập thêm từ hiệu sách Tiền Phong làm họa cụ vẽ cho tháng mới..."
                rows={2}
                className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-medium text-black focus:outline-none text-sm"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-white hover:bg-gray-50 border-3 border-black rounded-xl px-5 py-3 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#a8e6cf] hover:bg-[#8fd4ba] disabled:bg-gray-200 border-3 border-black rounded-xl px-5 py-3 font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Xác nhận nhập
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <NotificationModal
        isOpen={notification.isOpen}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={() => {
          setNotification(prev => ({ ...prev, isOpen: false }));
          if (notification.type === "success") {
            onSuccess();
            onClose();
          }
        }}
      />
    </>
  );
}
