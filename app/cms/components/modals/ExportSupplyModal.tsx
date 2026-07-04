"use client";

import React, { useState, useEffect } from "react";
import { X, ArrowRight, Loader2 } from "lucide-react";
import { NotificationModal } from "./NotificationModal";

interface ExportSupplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplies: any[];
  onSuccess: () => void;
  initialItemId?: string; // allow prepopulating item if triggered from quick actions
}

export function ExportSupplyModal({ isOpen, onClose, supplies, onSuccess, initialItemId }: ExportSupplyModalProps) {
  const [form, setForm] = useState({
    itemId: "",
    quantity: "",
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

  // Prepopulate form state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialItemId) {
        setForm(prev => ({ ...prev, itemId: initialItemId }));
      } else if (supplies.length > 0 && !form.itemId) {
        setForm(prev => ({ ...prev, itemId: supplies[0].id }));
      }
    }
  }, [isOpen, supplies, initialItemId]);

  if (!isOpen) return null;

  const selectedItem = supplies.find(s => s.id === form.itemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedItem) {
      setError("Vui lòng chọn vật phẩm hợp lệ.");
      return;
    }

    const qtyVal = Number(form.quantity);
    if (qtyVal > selectedItem.quantity) {
      setError(`Số lượng yêu cầu (${qtyVal} ${selectedItem.unit}) vượt quá lượng tồn kho hiện có (${selectedItem.quantity} ${selectedItem.unit}).`);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/cms/supplies/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: form.itemId,
          type: "EXPORT",
          quantity: qtyVal,
          purpose: form.purpose.trim()
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Có lỗi xảy ra khi xuất dùng");
      }

      setNotification({
        isOpen: true,
        title: "Thành công!",
        message: `Đã xuất sử dụng thành công ${qtyVal} ${selectedItem.unit} "${selectedItem.name}".`,
        type: "success"
      });

      setForm({
        itemId: supplies[0]?.id || "",
        quantity: "",
        purpose: ""
      });
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

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
            📤 Xuất dùng & Tiêu hao
          </h3>
          <p className="text-gray-500 text-sm mb-6">Trừ lượng tồn kho của vật phẩm khi phân phát cho lớp học hoặc báo hết.</p>

          {error && (
            <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-xl p-3 mb-4 font-bold text-sm leading-relaxed">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Chọn vật phẩm xuất dùng *</label>
              <select
                required
                className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none"
                value={form.itemId}
                onChange={(e) => {
                  setForm({ ...form, itemId: e.target.value });
                  setError("");
                }}
              >
                {supplies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Còn lại: {s.quantity} {s.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Số lượng xuất dùng *</label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Số lượng..."
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none pr-12"
                  value={form.quantity}
                  onChange={(e) => {
                    setForm({ ...form, quantity: e.target.value });
                    setError("");
                  }}
                />
                {selectedItem && (
                  <span className="absolute right-3.5 text-xs text-gray-500 font-extrabold">{selectedItem.unit}</span>
                )}
              </div>
              {selectedItem && (
                <p className="text-[10px] text-gray-400 font-bold mt-1 px-1">
                  * Tồn kho tối đa khả dụng: {selectedItem.quantity} {selectedItem.unit}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Mục đích sử dụng *</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Cấp cho lớp vẽ K1 ngày 06/06, hao phí..."
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
                disabled={submitting || !selectedItem || selectedItem.quantity === 0}
                className="bg-[#ffaaa6] hover:bg-[#ff8b94] disabled:bg-gray-200 border-3 border-black rounded-xl px-5 py-3 font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang trừ kho...
                  </>
                ) : (
                  <>
                    <span>Xuất dùng</span>
                    <ArrowRight className="w-4 h-4" />
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
