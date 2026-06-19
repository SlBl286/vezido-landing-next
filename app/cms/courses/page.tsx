"use client";

import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Loader2, X, PlusCircle, MinusCircle, BookOpen, AlertTriangle } from "lucide-react";
import { CustomSelect } from "@/app/cms/components/ui/custom-select";
import { CustomCheckbox } from "@/app/cms/components/ui/custom-checkbox";
import { NotificationModal } from "@/app/cms/components/modals/NotificationModal";
import { cmsApi } from "@/lib/api-client";

export default function CoursesManagerPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  // Modal control states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  
  // Form states
  const [form, setForm] = useState({
    title: "",
    type: "AGE_BASED",
    audience: "",
    duration: "12 buổi / khóa",
    fee: "",
    feeUnit: "buổi",
    feeNote: "đã bao gồm họa cụ",
    objectives: [""] as string[],
    content: [""] as string[],
    benefits: [""] as string[],
    isActive: true
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
    type: "info"
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

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await cmsApi.courses.list();
      setCourses(data.courses || []);
    } catch (err: any) {
      showNotification("Lỗi tải danh sách", err.message || "Không thể tải danh sách khóa học.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchCourses();
  }, []);

  const isAdmin = session?.user?.role === "ADMIN";

  const handleOpenAdd = () => {
    setSelectedCourse(null);
    setForm({
      title: "",
      type: "AGE_BASED",
      audience: "",
      duration: "12 buổi / khóa",
      fee: "",
      feeUnit: "buổi",
      feeNote: "đã bao gồm họa cụ",
      objectives: [""],
      content: [""],
      benefits: [""],
      isActive: true
    });
    setError("");
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (course: any) => {
    setSelectedCourse(course);
    setForm({
      title: course.title,
      type: course.type,
      audience: course.audience,
      duration: course.duration,
      fee: String(course.fee),
      feeUnit: course.feeUnit || "buổi",
      feeNote: course.feeNote || "",
      objectives: course.objectives?.length > 0 ? [...course.objectives] : [""],
      content: course.content?.length > 0 ? [...course.content] : [""],
      benefits: course.benefits?.length > 0 ? [...course.benefits] : [""],
      isActive: course.isActive
    });
    setError("");
    setShowAddEditModal(true);
  };

  const handleDeleteCourse = (id: string, title: string) => {
    showNotification(
      "Xác nhận xóa khóa học",
      `Bạn có chắc chắn muốn xóa khóa học "${title}"? Tất cả thông tin học phí và lộ trình liên quan cũng sẽ bị xóa.`,
      "confirm",
      async () => {
        try {
          await cmsApi.courses.delete(id);
          showNotification("Thành công", "Đã xóa khóa học thành công", "success");
          fetchCourses();
        } catch (err: any) {
          showNotification("Lỗi", err.message || "Không thể xóa khóa học", "error");
        }
      }
    );
  };

  // Dynamic Array Fields Helpers
  const handleAddArrayItem = (field: "objectives" | "content" | "benefits") => {
    setForm(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }));
  };

  const handleRemoveArrayItem = (field: "objectives" | "content" | "benefits", index: number) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleUpdateArrayItem = (field: "objectives" | "content" | "benefits", index: number, value: string) => {
    setForm(prev => {
      const copy = [...prev[field]];
      copy[index] = value;
      return {
        ...prev,
        [field]: copy
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const payload = {
      ...form,
      fee: Number(form.fee),
      objectives: form.objectives.filter(o => o.trim().length > 0),
      content: form.content.filter(c => c.trim().length > 0),
      benefits: form.benefits.filter(b => b.trim().length > 0)
    };

    try {
      if (selectedCourse) {
        await cmsApi.courses.update(selectedCourse.id, payload);
        showNotification("Thành công", "Cập nhật khóa học thành công", "success");
      } else {
        await cmsApi.courses.create(payload);
        showNotification("Thành công", "Tạo khóa học mới thành công", "success");
      }
      setShowAddEditModal(false);
      fetchCourses();
    } catch (err: any) {
      setError(err.message || "Lỗi khi xử lý");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
          <p className="font-extrabold text-black">Đang tải danh sách khóa học...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Title Neobrutalism Header */}
      <div className="bg-[#a8e6cf] border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-black tracking-tight flex items-center gap-2.5">
            📖 QUẢN LÝ KHÓA HỌC & ĐÀO TẠO
          </h2>
          <p className="text-gray-800 font-bold text-sm mt-1">
            Thiết lập danh mục các lớp vẽ theo độ tuổi, các chuyên đề nâng cao, học phí và lộ trình đào tạo chi tiết.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="bg-white hover:bg-stone-50 text-black border-3 border-black font-black text-sm px-5 py-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Thêm khóa học mới</span>
          </button>
        )}
      </div>

      {/* Courses List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.length === 0 ? (
          <div className="col-span-2 border-4 border-dashed border-black/10 bg-white rounded-3xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-black text-lg">Chưa có khóa học nào được đăng ký</p>
            <p className="text-gray-400 text-sm mt-1">Vui lòng nhấp nút "Thêm khóa học mới" để khởi tạo.</p>
          </div>
        ) : (
          courses.map(course => (
            <div
              key={course.id}
              className={`border-4 border-black bg-white rounded-[30px_10px_25px_10px/10px_25px_10px_30px] p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between transition-all ${
                !course.isActive ? "opacity-60 bg-gray-50" : ""
              }`}
            >
              <div className="space-y-3">
                {/* Course Header */}
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] border-2 border-black px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                    course.type === "AGE_BASED" ? "bg-[#bae1ff]" : "bg-[#ffc6ff]"
                  }`}>
                    {course.type === "AGE_BASED" ? "👶 Theo độ tuổi" : "🎨 Chuyên đề"}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <span className={`w-2.5 h-2.5 rounded-full border border-black ${course.isActive ? "bg-emerald-400" : "bg-stone-300"}`} />
                    <span className="text-[10px] font-black text-gray-500">{course.isActive ? "Hoạt động" : "Ẩn"}</span>
                  </div>
                </div>

                <h3 className="text-xl font-black text-black leading-snug">
                  {course.title}
                </h3>

                <p className="text-xs font-semibold text-gray-600">
                  <strong className="font-extrabold text-black">Đối tượng:</strong> {course.audience}
                </p>

                <p className="text-xs font-semibold text-gray-600">
                  <strong className="font-extrabold text-black">Thời lượng:</strong> {course.duration}
                </p>

                <p className="text-xs font-semibold text-gray-600">
                  <strong className="font-extrabold text-black">Học phí:</strong> {course.fee?.toLocaleString("vi-VN")} đ / {course.feeUnit} {course.feeNote && `(${course.feeNote})`}
                </p>

                <div className="border-t border-dashed border-stone-200 pt-2 space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Mục tiêu mẫu:</p>
                  <ul className="list-disc pl-4 text-[11px] text-gray-500 font-semibold space-y-0.5">
                    {course.objectives?.slice(0, 2).map((obj: string, i: number) => (
                      <li key={i}>{obj}</li>
                    ))}
                    {course.objectives?.length > 2 && <li>... và {course.objectives.length - 2} mục tiêu khác</li>}
                  </ul>
                </div>
              </div>

              {/* Actions row */}
              <div className="border-t-2 border-black pt-4 mt-5 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-bold italic">
                  Cập nhật: {new Date(course.updatedAt).toLocaleDateString("vi-VN")}
                </span>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(course)}
                      className="p-2 border-2 border-black bg-amber-100 hover:bg-amber-200 rounded-lg text-black transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                      title="Chỉnh sửa khóa học"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id, course.title)}
                      className="p-2 border-2 border-black bg-rose-100 hover:bg-rose-200 rounded-lg text-rose-700 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                      title="Xóa khóa học"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: ADD / EDIT COURSE */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border-4 border-black rounded-[35px_15px_30px_10px/10px_30px_15px_35px] max-w-2xl w-full p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative my-8 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddEditModal(false)}
              className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer z-10"
            >
              <X className="w-5 h-5 text-black" />
            </button>

            <h3 className="text-2xl font-black text-black mb-1 flex items-center gap-2">
              {selectedCourse ? "✏️ Chỉnh Sửa Khóa Học" : "📦 Đăng Ký Khóa Học Mới"}
            </h3>
            <p className="text-gray-500 text-sm mb-6">Thiết lập học phí, đối tượng và bài học chi tiết cho khóa học.</p>

            {error && (
              <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-xl p-3 mb-4 font-bold text-sm">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1">Tên khóa học *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 🌱 LỚP MẦM [4-7 TUỔI]"
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1">Dạng lớp học *</label>
                  <CustomSelect
                    value={form.type}
                    onChange={val => setForm({ ...form, type: val })}
                    options={[
                      { value: "AGE_BASED", label: "Theo độ tuổi" },
                      { value: "SPECIALIZED", label: "Chuyên đề nghệ thuật" }
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-800 mb-1">Đối tượng tuyển sinh *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Dành cho các bạn từ 4-7 tuổi học vẽ sáng tạo..."
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs"
                  value={form.audience}
                  onChange={e => setForm({ ...form, audience: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-800 mb-1">Học phí (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Ví dụ: 160000"
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs"
                    value={form.fee}
                    onChange={e => setForm({ ...form, fee: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1">Đơn vị tính *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: buổi, khóa"
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs"
                    value={form.feeUnit}
                    onChange={e => setForm({ ...form, feeUnit: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1">Thời lượng *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 12 buổi / khóa"
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs"
                    value={form.duration}
                    onChange={e => setForm({ ...form, duration: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-800 mb-1">Ghi chú học phí (Tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: đã bao gồm họa cụ và nước uống tại lớp..."
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs"
                  value={form.feeNote}
                  onChange={e => setForm({ ...form, feeNote: e.target.value })}
                />
              </div>

              {/* Dynamic array inputs for objectives, content, benefits */}
              <div className="space-y-4 border-t border-black/15 pt-4 max-h-[300px] overflow-y-auto pr-2">
                
                {/* 1. Objectives list */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-gray-800">🎯 Mục tiêu khóa học (Nêu các gạch đầu dòng)</label>
                    <button
                      type="button"
                      onClick={() => handleAddArrayItem("objectives")}
                      className="text-xs font-black text-sky-600 hover:text-sky-700 flex items-center gap-0.5 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Thêm gạch đầu dòng
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {form.objectives.map((obj, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Mục tiêu hoặc đầu ra sau khóa học..."
                          className="flex-1 border-2 border-black rounded-lg p-2 bg-gray-50 font-medium text-black focus:outline-none text-xs"
                          value={obj}
                          onChange={e => handleUpdateArrayItem("objectives", idx, e.target.value)}
                        />
                        {form.objectives.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveArrayItem("objectives", idx)}
                            className="text-rose-500 hover:text-rose-600 cursor-pointer p-1"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Content/Curriculum list */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-gray-800">📋 Lộ trình các buổi học (Ví dụ: Buổi 1-3:...)</label>
                    <button
                      type="button"
                      onClick={() => handleAddArrayItem("content")}
                      className="text-xs font-black text-sky-600 hover:text-sky-700 flex items-center gap-0.5 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Thêm buổi học
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {form.content.map((cont, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Mô tả lộ trình buổi học..."
                          className="flex-1 border-2 border-black rounded-lg p-2 bg-gray-50 font-medium text-black focus:outline-none text-xs"
                          value={cont}
                          onChange={e => handleUpdateArrayItem("content", idx, e.target.value)}
                        />
                        {form.content.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveArrayItem("content", idx)}
                            className="text-rose-500 hover:text-rose-600 cursor-pointer p-1"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Benefits list */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-gray-800">🎁 Ưu đãi tuyển sinh (Ví dụ: Giảm học phí...)</label>
                    <button
                      type="button"
                      onClick={() => handleAddArrayItem("benefits")}
                      className="text-xs font-black text-sky-600 hover:text-sky-700 flex items-center gap-0.5 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Thêm ưu đãi
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {form.benefits.map((ben, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Ưu đãi đính kèm..."
                          className="flex-1 border-2 border-black rounded-lg p-2 bg-gray-50 font-medium text-black focus:outline-none text-xs"
                          value={ben}
                          onChange={e => handleUpdateArrayItem("benefits", idx, e.target.value)}
                        />
                        {form.benefits.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveArrayItem("benefits", idx)}
                            className="text-rose-500 hover:text-rose-600 cursor-pointer p-1"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              <div className="border-t border-black/15 pt-4">
                <CustomCheckbox
                  checked={form.isActive}
                  onChange={checked => setForm({ ...form, isActive: checked })}
                  label="Hiển thị khóa học ngoài trang chủ & trang học phí công khai"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-black/15">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="bg-white hover:bg-gray-50 border-3 border-black rounded-xl px-5 py-3 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#a8e6cf] hover:bg-[#8fd4ba] disabled:bg-gray-200 border-3 border-black rounded-xl px-5 py-3 font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer text-xs"
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
