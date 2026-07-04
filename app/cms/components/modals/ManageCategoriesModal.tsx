"use client";

import React, { useEffect, useState } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChange: () => void;
}

export function ManageCategoriesModal({ isOpen, onClose, onCategoriesChange }: ManageCategoriesModalProps) {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/cms/faqs/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      } else {
        throw new Error("Không thể tải danh sách danh mục");
      }
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setNewCategoryName("");
      setDeletingId(null);
    }
  }, [isOpen]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setAdding(true);
    setError("");

    try {
      const res = await fetch("/api/cms/faqs/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Có lỗi xảy ra khi tạo danh mục");
      }

      setNewCategoryName("");
      fetchCategories();
      onCategoriesChange();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/cms/faqs/categories?id=${id}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Có lỗi xảy ra khi xóa");
      }

      setDeletingId(null);
      fetchCategories();
      onCategoriesChange();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto"
    >
      <div className="bg-[#fefaf0] border-4 border-black rounded-[35px_15px_30px_10px/10px_30px_15px_35px] max-w-md w-full p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
        >
          <X className="w-5 h-5 text-black" />
        </button>

        <h3 className="text-2xl font-black text-black mb-1 flex items-center gap-2">
          📁 Quản lý Danh mục Hỏi đáp
        </h3>
        <p className="text-gray-700 font-bold text-sm mb-6">Thêm mới hoặc xóa các danh mục hỏi đáp.</p>

        {error && (
          <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-xl p-3 mb-4 font-bold text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleAdd} className="mb-6">
          <label className="block text-sm font-bold text-gray-800 mb-1">Thêm danh mục mới</label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Tên danh mục (ví dụ: Học phí, Lịch học...)"
              className="flex-1 border-3 border-black rounded-xl p-2.5 bg-white font-bold text-black focus:outline-none text-sm"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <button
              type="submit"
              disabled={adding || !newCategoryName.trim()}
              className="bg-[#a8e6cf] hover:bg-[#8fd4ba] disabled:bg-gray-200 border-3 border-black rounded-xl px-4 py-2.5 font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 stroke-[3]" />}
              <span className="text-sm">Thêm</span>
            </button>
          </div>
        </form>

        <div className="border-t-2 border-black my-4"></div>

        <h4 className="font-black text-sm text-black mb-3">Danh sách hiện tại:</h4>

        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {loading && categories.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-gray-400 font-bold italic text-center py-4">Chưa có danh mục nào.</p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="border-2 border-black rounded-xl p-3 bg-white flex items-center justify-between shadow-[2px_2px_0px_rgba(0,0,0,1)]"
              >
                {deletingId === cat.id ? (
                  <div className="flex flex-col gap-2 w-full">
                    <p className="text-xs font-bold text-rose-600">
                      ⚠️ Các câu hỏi thuộc danh mục này sẽ đổi sang "Chung". Xác nhận xóa?
                    </p>
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleDelete(cat.id)}
                        disabled={deleting}
                        className="bg-rose-500 hover:bg-rose-600 text-white font-black text-[10px] px-2.5 py-1.5 rounded-lg border-2 border-black shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                      >
                        {deleting ? "Đang xóa..." : "Đúng, xóa"}
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="bg-white hover:bg-gray-50 text-black font-bold text-[10px] px-2.5 py-1.5 rounded-lg border-2 border-black shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="font-extrabold text-sm text-black truncate mr-2">{cat.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {cat.name !== "Chung" && (
                        <button
                          onClick={() => setDeletingId(cat.id)}
                          className="bg-rose-100 hover:bg-rose-200 border-2 border-black rounded-lg p-1.5 shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                          title="Xóa danh mục"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
