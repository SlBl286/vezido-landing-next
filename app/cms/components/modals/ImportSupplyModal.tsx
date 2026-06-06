"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { NotificationModal } from "./NotificationModal";

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
          purpose: form.purpose.trim()
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
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedItem = supplies.find(s => s.id === form.itemId);
  const totalCost = Number(form.quantity) * Number(form.pricePerUnit);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
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
              <select
                required
                className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none"
                value={form.itemId}
                onChange={(e) => setForm({ ...form, itemId: e.target.value })}
              >
                {supplies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.quantity} {s.unit} hiện tại)
                  </option>
                ))}
              </select>
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
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none pr-12"
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
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none"
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
              <label className="block text-sm font-bold text-gray-800 mb-1">Ghi chú / Nhà cung cấp</label>
              <textarea
                placeholder="Ví dụ: Nhập thêm từ hiệu sách Tiền Phong làm họa cụ vẽ cho tháng mới..."
                rows={2}
                className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-medium text-black focus:outline-none"
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
