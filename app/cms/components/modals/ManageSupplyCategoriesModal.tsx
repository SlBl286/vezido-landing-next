"use client";

import React, { useEffect, useState } from "react";
import { X, Plus, Edit2, Trash2, Check, Loader2 } from "lucide-react";

interface ManageSupplyCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManageSupplyCategoriesModal({ isOpen, onClose, onSuccess }: ManageSupplyCategoriesModalProps) {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Adding state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [adding, setAdding] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [updating, setUpdating] = useState(false);

  // Deleting state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/cms/supplies/categories");
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
      setEditingId(null);
      setDeletingId(null);
    }
  }, [isOpen]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setAdding(true);
    setError("");

    try {
      const res = await fetch("/api/cms/supplies/categories", {
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
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setAdding(false);
    }
  };

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;
    setUpdating(true);
    setError("");

    try {
      const res = await fetch(`/api/cms/supplies/categories?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Có lỗi xảy ra khi cập nhật");
      }

      setEditingId(null);
      setEditingName("");
      fetchCategories();
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/cms/supplies/categories?id=${id}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Có lỗi xảy ra khi xóa");
      }

      setDeletingId(null);
      fetchCategories();
      onSuccess();
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
          📁 Quản lý Danh mục Kho
        </h3>
        <p className="text-gray-700 font-bold text-sm mb-6">Thêm mới, sửa đổi hoặc xóa các phân loại hàng hóa.</p>

        {error && (
          <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-xl p-3 mb-4 font-bold text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Add new Category */}
        <form onSubmit={handleAdd} className="mb-6">
          <label className="block text-sm font-bold text-gray-800 mb-1">Thêm danh mục mới</label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Tên danh mục (ví dụ: Màu vẽ, Cọ vẽ...)"
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

        {/* Categories List */}
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
                {editingId === cat.id ? (
                  /* Edit Mode */
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="text"
                      className="flex-1 border-2 border-black rounded-lg px-2 py-1 bg-gray-50 font-bold text-black focus:outline-none text-xs"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdate(cat.id)}
                      disabled={updating || !editingName.trim()}
                      className="bg-[#a8e6cf] hover:bg-[#8fd4ba] border-2 border-black rounded-lg p-1.5 shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none cursor-pointer"
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-black" />}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-lg p-1.5 shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none cursor-pointer"
                    >
                      <X className="w-4 h-4 text-black" />
                    </button>
                  </div>
                ) : deletingId === cat.id ? (
                  /* Delete Confirmation Mode */
                  <div className="flex flex-col gap-2 w-full">
                    <p className="text-xs font-bold text-rose-600">
                      ⚠️ Các đồ dùng thuộc danh mục này sẽ bị đổi sang "Chưa phân loại". Xác nhận xóa?
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
                  /* Normal View Mode */
                  <>
                    <span className="font-extrabold text-sm text-black truncate mr-2">{cat.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleStartEdit(cat.id, cat.name)}
                        className="bg-[#ffffba] hover:bg-[#ffea75] border-2 border-black rounded-lg p-1.5 shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                        title="Đổi tên"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-black" />
                      </button>
                      <button
                        onClick={() => setDeletingId(cat.id)}
                        className="bg-rose-100 hover:bg-rose-200 border-2 border-black rounded-lg p-1.5 shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                        title="Xóa danh mục"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      </button>
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
