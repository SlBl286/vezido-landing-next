"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { NotificationModal } from "./NotificationModal";
import { CustomSelect } from "@/app/cms/components/ui/custom-select";

interface AddSupplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddSupplyModal({ isOpen, onClose, onSuccess }: AddSupplyModalProps) {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    unit: "Cái",
    minQuantity: "5",
    initialQuantity: "0",
    purchaseLink: ""
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

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      setLoadingCategories(true);
      try {
        const res = await fetch("/api/cms/supplies/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
          if (data.categories && data.categories.length > 0) {
            setForm(prev => ({ ...prev, categoryId: data.categories[0].id }));
          }
        }
      } catch (err) {
        console.error("Error loading categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    }
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/cms/supplies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          categoryId: form.categoryId,
          unit: form.unit.trim(),
          minQuantity: Number(form.minQuantity),
          initialQuantity: Number(form.initialQuantity),
          purchaseLink: form.purchaseLink.trim() || undefined
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Có lỗi xảy ra khi tạo vật dụng mới");
      }

      setNotification({
        isOpen: true,
        title: "Thành công!",
        message: `Đã thêm thành công vật phẩm "${form.name}" vào danh sách kho.`,
        type: "success"
      });

      setForm({
        name: "",
        categoryId: categories.length > 0 ? categories[0].id : "",
        unit: "Cái",
        minQuantity: "5",
        initialQuantity: "0",
        purchaseLink: ""
      });
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

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
            📦 Thêm Vật phẩm Kho
          </h3>
          <p className="text-gray-500 text-sm mb-6">Đăng ký mới họa cụ, đồ dùng dạy học vào danh sách kho.</p>

          {error && (
            <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-xl p-3 mb-4 font-bold text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Tên vật phẩm *</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Giấy vẽ A3 Canson 250gsm"
                className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Link mua hàng (Tùy chọn)</label>
              <input
                type="url"
                placeholder="Ví dụ: https://shopee.vn/..."
                className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none"
                value={form.purchaseLink}
                onChange={(e) => setForm({ ...form, purchaseLink: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Phân loại *</label>
                <CustomSelect
                  value={form.categoryId}
                  onChange={(val) => setForm({ ...form, categoryId: val })}
                  options={categories.map((cat) => ({
                    value: cat.id,
                    label: cat.name
                  }))}
                  placeholder={loadingCategories ? "Đang tải..." : "Chọn danh mục..."}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Đơn vị tính *</label>
                <input
                  type="text"
                  required
                  placeholder="Cái, Hộp, Tờ, Chai..."
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Tồn kho ban đầu</label>
                <input
                  type="number"
                  min="0"
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none"
                  value={form.initialQuantity}
                  onChange={(e) => setForm({ ...form, initialQuantity: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Ngưỡng báo hết *</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none"
                  value={form.minQuantity}
                  onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                />
              </div>
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
                className="bg-[#ffd275] hover:bg-[#ffc342] disabled:bg-gray-200 border-3 border-black rounded-xl px-5 py-3 font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Thêm mới
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

