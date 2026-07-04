"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { cmsApi } from "@/lib/api-client";
import { NotificationModal } from "./NotificationModal";
import { CustomSelect } from "@/app/cms/components/ui/custom-select";

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: any | null;
  teachers: any[];
  specialties: any[];
  courses: any[];
  onSuccess: () => void;
}

export function EditClassModal({
  isOpen,
  onClose,
  classData,
  teachers,
  specialties,
  courses,
  onSuccess
}: EditClassModalProps) {
  const [classForm, setClassForm] = useState({
    name: "",
    room: "",
    schedule: "",
    courseId: "",
    teacherIds: [] as string[],
    specialtyIds: [] as string[]
  });

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Notification modal state
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
    setNotification({
      isOpen: true,
      title,
      message,
      type,
      onConfirm
    });
  };

  useEffect(() => {
    if (isOpen && classData) {
      setClassForm({
        name: classData.name || "",
        room: classData.room || "",
        schedule: classData.schedule || "",
        courseId: classData.courseId || "",
        teacherIds: classData.teachers?.map((t: any) => t.id) || [],
        specialtyIds: classData.specialties?.map((s: any) => s.id) || []
      });
      setFormError("");
    }
  }, [isOpen, classData]);

  const hasOverlap = (teacher: any) => {
    if (!classForm.specialtyIds.length) return false;
    return teacher.specialties.some((tSpec: any) =>
      classForm.specialtyIds.includes(tSpec.id)
    );
  };

  const getOverlapCount = (teacher: any) => {
    return teacher.specialties.filter((s: any) => classForm.specialtyIds.includes(s.id)).length;
  };

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classData?.id) return;
    setFormError("");
    setSubmitting(true);

    if (!classForm.name) {
      setFormError("Tên lớp học không được để trống");
      setSubmitting(false);
      return;
    }

    try {
      await cmsApi.classes.update(classData.id, classForm);
      showNotification("Thành công 🏫", "Lớp học đã được cập nhật thông tin và giáo viên phụ trách mới.", "success", () => {
        onSuccess();
        onClose();
      });
    } catch (err: any) {
      setFormError(err.message || "Có lỗi xảy ra khi cập nhật lớp học");
      showNotification("Lỗi cập nhật lớp học", err.message || "Có lỗi xảy ra khi cập nhật lớp học", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !classData) return null;

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
            className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-2xl font-black text-black mb-1 flex items-center gap-2">
            🏫 Sửa thông tin Lớp học
          </h3>
          <p className="text-gray-500 text-sm mb-6">Chỉnh sửa thông tin lớp và phân công lại giáo viên giảng dạy</p>
          
          {formError && (
            <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-xl p-3 mb-4 font-bold text-sm">
              ⚠️ {formError}
            </div>
          )}

          <form onSubmit={handleEditClass} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Khóa học đào tạo liên kết</label>
              <CustomSelect
                value={classForm.courseId}
                onChange={(val) => setClassForm({ ...classForm, courseId: val })}
                options={courses.map(c => ({ value: c.id, label: c.title }))}
                placeholder="Chọn khóa học để liên kết..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Tên lớp học *</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Vẽ thiếu nhi K1"
                className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-medium"
                value={classForm.name}
                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Mô tả Lịch học</label>
              <input
                type="text"
                placeholder="Ví dụ: Thứ Bảy 08:00 - 10:00"
                className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-medium"
                value={classForm.schedule}
                onChange={(e) => setClassForm({ ...classForm, schedule: e.target.value })}
              />
              <p className="text-[10px] text-gray-400 font-bold mt-1">Thông tin này hiển thị trên danh sách lớp học của phụ huynh và quản trị viên.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Phòng học / Link học trực tuyến</label>
              <input
                type="text"
                placeholder="Ví dụ: Phòng 102 hoặc Zoom Link"
                className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-medium"
                value={classForm.room}
                onChange={(e) => setClassForm({ ...classForm, room: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Chuyên môn lớp học (Chọn nhiều)</label>
              <div className="grid grid-cols-2 gap-2 bg-gray-50 border-3 border-black rounded-2xl p-4">
                {specialties.map((spec) => {
                  const isChecked = classForm.specialtyIds.includes(spec.id);
                  return (
                    <label key={spec.id} className="flex items-center gap-2 font-bold text-xs text-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 border-2 border-black rounded accent-emerald-400"
                        checked={isChecked}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setClassForm((prev) => {
                            const current = prev.specialtyIds;
                            const updated = checked
                              ? [...current, spec.id]
                              : current.filter((id) => id !== spec.id);
                            return { ...prev, specialtyIds: updated };
                          });
                        }}
                      />
                      <span>{spec.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Giáo viên giảng dạy (Chọn nhiều) *</label>
              <div className="max-h-40 overflow-y-auto bg-gray-50 border-3 border-black rounded-2xl p-4 space-y-2.5 shadow-[inner_2px_2px_4px_rgba(0,0,0,0.1)]">
                {teachers.length === 0 ? (
                  <p className="text-xs text-gray-400 font-bold italic py-1 text-center">Chưa có giáo viên nào trong hệ thống.</p>
                ) : (
                  [...teachers]
                    .sort((a, b) => {
                      const aMatch = hasOverlap(a) ? 1 : 0;
                      const bMatch = hasOverlap(b) ? 1 : 0;
                      return bMatch - aMatch;
                    })
                    .map((t) => {
                      const isChecked = classForm.teacherIds.includes(t.id);
                      const isMatch = hasOverlap(t);
                      const matchCount = getOverlapCount(t);
                      const specNames = t.specialties.map((s: any) => s.name).join(", ");
                      return (
                        <label key={t.id} className="flex items-start gap-2.5 font-bold text-xs text-gray-800 cursor-pointer p-1.5 hover:bg-black/5 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            className="w-4.5 h-4.5 border-2 border-black rounded accent-amber-400 mt-0.5"
                            checked={isChecked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setClassForm((prev) => {
                                const current = prev.teacherIds;
                                const updated = checked
                                  ? [...current, t.id]
                                  : current.filter((id) => id !== t.id);
                                return { ...prev, teacherIds: updated };
                              });
                            }}
                          />
                          <div className="flex flex-col">
                            <span className="flex items-center gap-1 text-black font-extrabold">
                              {t.user.name || t.user.username}
                              {isMatch && (
                                <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[9px] px-1 py-0.5 rounded font-black">
                                  ✨ Gợi ý: Trùng {matchCount} chuyên môn
                                </span>
                              )}
                            </span>
                            {specNames && (
                              <span className="text-[10px] text-gray-500 font-medium mt-0.5">
                                Chuyên môn: {specNames}
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-200 border-3 border-black rounded-xl px-5 py-2.5 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#a8e6cf] hover:bg-[#96d8c0] border-3 border-black rounded-xl px-5 py-2.5 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu lại
              </button>
            </div>
          </form>
        </div>
      </div>

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onConfirm={notification.onConfirm}
      />
    </>
  );
}
