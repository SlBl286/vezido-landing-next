"use client";

import React, { useEffect, useState, useMemo } from "react";
import { CustomPagination } from "../components/ui/custom-pagination";
import { Plus, Edit2, Trash2, Loader2, X, AlertTriangle, Calendar, Ticket } from "lucide-react";
import { CustomSelect } from "@/app/cms/components/ui/custom-select";
import { CustomCheckbox } from "@/app/cms/components/ui/custom-checkbox";
import { NotificationModal } from "@/app/cms/components/modals/NotificationModal";
import { cmsApi } from "@/lib/api-client";

export default function PromotionsManagerPage() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [promotions.length]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(promotions.length / itemsPerPage);
  const paginatedPromotions = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return promotions.slice(startIdx, startIdx + itemsPerPage);
  }, [promotions, currentPage]);
  const [session, setSession] = useState<any>(null);

  // Modal control states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null);

  // Form states
  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minOrderValue: "",
    maxDiscount: "",
    startDate: "",
    endDate: "",
    isActive: true,
    maxUses: "",
    isStackable: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Notification State
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info" | "confirm";
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showNotification = (
    title: string,
    message: string,
    type: "success" | "error" | "info" | "confirm",
    onConfirm?: () => void
  ) => {
    setNotification({ isOpen: true, title, message, type, onConfirm });
  };

  const fetchSession = async () => {
    try {
      const data = await cmsApi.auth.getSession();
      setSession(data);
    } catch (err) {
      console.error("Failed to load session:", err);
    }
  };

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const data = await cmsApi.promotions.list();
      setPromotions(data.promotions || []);
    } catch (err: any) {
      showNotification("Lỗi tải danh sách", err.message || "Không thể tải danh sách khuyến mãi.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchPromotions();
  }, []);

  const isAdmin = session?.user?.role === "ADMIN";

  const handleOpenAdd = () => {
    setSelectedPromotion(null);
    setForm({
      code: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: "",
      minOrderValue: "",
      maxDiscount: "",
      startDate: "",
      endDate: "",
      isActive: true,
      maxUses: "",
      isStackable: false,
    });
    setError("");
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (promo: any) => {
    setSelectedPromotion(promo);
    setForm({
      code: promo.code,
      description: promo.description || "",
      discountType: promo.discountType,
      discountValue: String(promo.discountValue),
      minOrderValue: promo.minOrderValue ? String(promo.minOrderValue) : "",
      maxDiscount: promo.maxDiscount ? String(promo.maxDiscount) : "",
      startDate: promo.startDate ? promo.startDate.split("T")[0] : "",
      endDate: promo.endDate ? promo.endDate.split("T")[0] : "",
      isActive: promo.isActive,
      maxUses: promo.maxUses ? String(promo.maxUses) : "",
      isStackable: promo.isStackable || false,
    });
    setError("");
    setShowAddEditModal(true);
  };

  const handleDeletePromotion = (id: string, code: string) => {
    showNotification(
      "Xác nhận xóa khuyến mãi",
      `Bạn có chắc chắn muốn xóa mã giảm giá "${code}"? Hành động này không thể hoàn tác.`,
      "confirm",
      async () => {
        try {
          await cmsApi.promotions.delete(id);
          showNotification("Thành công", "Đã xóa mã giảm giá thành công", "success");
          fetchPromotions();
        } catch (err: any) {
          showNotification("Lỗi", err.message || "Không thể xóa khuyến mãi", "error");
        }
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (!form.code.trim()) {
      setError("Vui lòng nhập mã giảm giá");
      setSubmitting(false);
      return;
    }

    if (!form.discountValue || Number(form.discountValue) <= 0) {
      setError("Vui lòng nhập giá trị giảm giá hợp lệ");
      setSubmitting(false);
      return;
    }

    if (form.discountType === "PERCENTAGE" && Number(form.discountValue) > 100) {
      setError("Giá trị giảm giá phần trăm không được vượt quá 100%");
      setSubmitting(false);
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      isActive: form.isActive,
      maxUses: form.maxUses ? parseInt(form.maxUses, 10) : null,
      isStackable: form.isStackable,
    };

    try {
      if (selectedPromotion) {
        await cmsApi.promotions.update(selectedPromotion.id, payload);
        showNotification("Thành công", "Cập nhật mã giảm giá thành công", "success");
      } else {
        await cmsApi.promotions.create(payload);
        showNotification("Thành công", "Tạo mã giảm giá mới thành công", "success");
      }
      setShowAddEditModal(false);
      fetchPromotions();
    } catch (err: any) {
      setError(err.message || "Lỗi khi xử lý");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="border-4 border-black bg-white rounded-3xl p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto my-12">
        <span className="text-6xl mb-4 block">🚫</span>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h1>
        <p className="text-gray-600">Trang này chỉ dành riêng cho Quản trị viên (Super Admin).</p>
      </div>
    );
  }

  if (loading && promotions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
          <p className="font-extrabold text-black">Đang tải danh sách khuyến mãi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Neobrutalism Header */}
      <div className="bg-[#bae1ff] border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-black tracking-tight flex items-center gap-2.5">
            🎟️ QUẢN LÝ MÃ KHUYẾN MÃI
          </h2>
          <p className="text-gray-800 font-bold text-sm mt-1">
            Thiết lập và quản lý các chương trình ưu đãi, mã giảm giá áp dụng khi học viên đóng học phí.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-white hover:bg-stone-50 text-black border-3 border-black font-black text-sm px-5 py-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Thêm mã mới</span>
        </button>
      </div>

      {/* Promotions Table / Grid */}
      <div className="border-4 border-black bg-white rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {promotions.length === 0 ? (
          <div className="border-4 border-dashed border-black/10 bg-white rounded-3xl p-12 text-center">
            <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-black text-lg">Chưa có mã giảm giá nào được tạo</p>
            <p className="text-gray-400 text-sm mt-1">Vui lòng nhấp nút "Thêm mã mới" để khởi tạo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-4 border-black">
                  <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Mã code</th>
                  <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Mô tả</th>
                  <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Loại giảm</th>
                  <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Giá trị</th>
                  <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Điều kiện</th>
                  <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Lượt dùng</th>
                  <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Thời hạn</th>
                  <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Trạng thái</th>
                  <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPromotions.map((promo) => {
                  const now = new Date();
                  const isExpired = promo.endDate && now > new Date(promo.endDate);
                  const isNotStarted = promo.startDate && now < new Date(promo.startDate);
                  let dateStatus = "Đang áp dụng";
                  if (isExpired) dateStatus = "Hết hạn";
                  if (isNotStarted) dateStatus = "Chưa hiệu lực";

                  return (
                    <tr key={promo.id} className="border-b-2 border-gray-200 hover:bg-[#fff9ed] transition-colors">
                      <td className="py-4 px-4 font-black">
                        <span className="bg-purple-100 border-2 border-black rounded-lg px-2.5 py-1 text-purple-800 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider whitespace-nowrap">
                          {promo.code}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-gray-700 text-sm">
                        {promo.description || <span className="text-gray-400 font-medium italic">Không có</span>}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <span className={`w-fit whitespace-nowrap border-2 border-black px-2 py-0.5 rounded font-black text-[9px] uppercase shadow-[1px_1px_0px_rgba(0,0,0,1)] ${
                            promo.discountType === "PERCENTAGE" ? "bg-[#bae1ff]" : "bg-[#a8e6cf]"
                          }`}>
                            {promo.discountType === "PERCENTAGE" ? "% Phần trăm" : "đ Cố định"}
                          </span>
                          <span className={`w-fit whitespace-nowrap border border-black px-1.5 py-0.5 rounded font-bold text-[8px] uppercase ${
                            promo.isStackable ? "bg-[#bae1ff] text-black" : "bg-[#ffd275] text-black"
                          }`}>
                            {promo.isStackable ? "⚡ Cộng dồn" : "🔒 Độc quyền"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-black text-black text-sm">
                        {promo.discountType === "PERCENTAGE" 
                          ? `${promo.discountValue}%` 
                          : `${promo.discountValue.toLocaleString("vi-VN")} đ`}
                      </td>
                      <td className="py-4 px-4 text-xs font-bold text-gray-600 space-y-1">
                        {promo.minOrderValue && (
                          <div>• Đơn từ: <span className="font-extrabold text-black">{promo.minOrderValue.toLocaleString("vi-VN")} đ</span></div>
                        )}
                        {promo.maxDiscount && (
                          <div>• Giảm tối đa: <span className="font-extrabold text-black">{promo.maxDiscount.toLocaleString("vi-VN")} đ</span></div>
                        )}
                        {!promo.minOrderValue && !promo.maxDiscount && (
                          <span className="text-gray-400 font-medium italic">Không có điều kiện</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs font-bold text-gray-600">
                        <span className="font-extrabold text-black">{promo.usedCount}</span> / {promo.maxUses !== null ? <span className="text-gray-950 font-extrabold">{promo.maxUses}</span> : "∞"}
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-gray-500">
                        <div className="flex flex-col gap-0.5">
                          {promo.startDate && (
                            <div>Từ: {new Date(promo.startDate).toLocaleDateString("vi-VN")}</div>
                          )}
                          {promo.endDate && (
                            <div>Đến: {new Date(promo.endDate).toLocaleDateString("vi-VN")}</div>
                          )}
                          {!promo.startDate && !promo.endDate && (
                            <span className="text-gray-400 italic font-medium">Vô thời hạn</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs">
                        <div className="flex flex-col gap-1">
                          <span className={`w-fit whitespace-nowrap border-2 border-black px-2 py-0.5 rounded font-black text-[9px] uppercase shadow-[1px_1px_0px_rgba(0,0,0,1)] ${
                            promo.isActive && !isExpired && !isNotStarted ? "bg-emerald-100 text-emerald-800 border-emerald-400" : "bg-rose-100 text-rose-800 border-rose-400"
                          }`}>
                            {promo.isActive ? "Hoạt động" : "Tạm ngưng"}
                          </span>
                          {(isExpired || isNotStarted) && (
                            <span className="text-[10px] text-rose-500 font-bold whitespace-nowrap">
                              ({dateStatus})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleOpenEdit(promo)}
                            className="p-2 border-2 border-black bg-amber-100 hover:bg-amber-200 rounded-lg text-black transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer inline-flex items-center justify-center"
                            title="Sửa mã giảm giá"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePromotion(promo.id, promo.code)}
                            className="p-2 border-2 border-black bg-rose-100 hover:bg-rose-200 rounded-lg text-rose-700 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer inline-flex items-center justify-center"
                            title="Xóa mã giảm giá"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT PROMOTION */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border-4 border-black rounded-[35px_15px_30px_10px/10px_30px_15px_35px] max-w-lg w-full p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative my-8 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddEditModal(false)}
              className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer z-10"
            >
              <X className="w-5 h-5 text-black" />
            </button>

            <h3 className="text-2xl font-black text-black mb-1 flex items-center gap-2">
              {selectedPromotion ? "✏️ Chỉnh Sửa Mã Khuyến Mãi" : "🎟️ Tạo Mã Khuyến Mãi Mới"}
            </h3>
            <p className="text-gray-500 text-sm mb-6">Thiết lập thông tin mã giảm giá, trị giá chiết khấu và điều kiện đi kèm.</p>

            {error && (
              <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-xl p-3 mb-4 font-bold text-sm animate-shake">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-800 mb-1">Mã giảm giá (Code) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: VEZIDO100K"
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-black text-black focus:outline-none text-sm uppercase"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-800 mb-1">Mô tả chương trình</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Giảm giá ngày hè cho học sinh đăng ký sớm"
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1">Loại chiết khấu *</label>
                  <CustomSelect
                    value={form.discountType}
                    onChange={val => setForm({ ...form, discountType: val })}
                    options={[
                      { value: "PERCENTAGE", label: "Phần trăm (%)" },
                      { value: "FIXED_AMOUNT", label: "Số tiền cố định (đ)" },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1">Giá trị giảm giá *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder={form.discountType === "PERCENTAGE" ? "Ví dụ: 10 (%)" : "Ví dụ: 100000 (đ)"}
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-black text-black focus:outline-none text-sm"
                    value={form.discountValue}
                    onChange={e => setForm({ ...form, discountValue: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1">Tổng tiền đơn tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Không bắt buộc"
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-black text-black focus:outline-none text-xs"
                    value={form.minOrderValue}
                    onChange={e => setForm({ ...form, minOrderValue: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1">Số tiền giảm tối đa (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder={form.discountType === "PERCENTAGE" ? "Không bắt buộc" : "Không áp dụng"}
                    disabled={form.discountType !== "PERCENTAGE"}
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-black text-black focus:outline-none text-xs disabled:opacity-50 disabled:bg-gray-200"
                    value={form.maxDiscount}
                    onChange={e => setForm({ ...form, maxDiscount: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1">Ngày kết thúc (Hết hạn)</label>
                  <input
                    type="date"
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs"
                    value={form.endDate}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1">Số lần sử dụng tối đa</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Không giới hạn"
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-black text-black focus:outline-none text-xs"
                    value={form.maxUses}
                    onChange={e => setForm({ ...form, maxUses: e.target.value })}
                  />
                </div>
                <div className="flex items-end pb-3.5 text-xs font-bold text-gray-500">
                  {selectedPromotion && (
                    <div>• Đã dùng: <span className="font-black text-purple-700 text-sm">{selectedPromotion.usedCount}</span> lần</div>
                  )}
                </div>
              </div>

              <div className="border-t border-black/15 pt-4 flex flex-col gap-3">
                <CustomCheckbox
                  checked={form.isActive}
                  onChange={checked => setForm({ ...form, isActive: checked })}
                  label="Mã giảm giá đang kích hoạt"
                />
                <CustomCheckbox
                  checked={form.isStackable}
                  onChange={checked => setForm({ ...form, isStackable: checked })}
                  label="Cho phép cộng dồn với mã giảm giá khác (Stackable)"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-black/15">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="bg-white hover:bg-gray-50 border-3 border-black rounded-xl px-5 py-2.5 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#a8e6cf] hover:bg-[#8fd4ba] disabled:bg-gray-200 border-3 border-black rounded-xl px-5 py-2.5 font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer text-xs"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Lưu lại"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTIFICATION MODAL */}
      <NotificationModal
        isOpen={notification.isOpen}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        onConfirm={notification.onConfirm}
      />
    </div>
  );
}
