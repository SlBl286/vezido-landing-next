"use client";

import React, { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { CustomSelect } from "@/app/cms/components/ui/custom-select";
import { cmsApi } from "@/lib/api-client";
import { NotificationModal } from "./NotificationModal";

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: any[];
  specialties: any[];
  courses: any[];
  onSuccess: () => void;
}

export function AddClassModal({
  isOpen,
  onClose,
  teachers,
  specialties,
  courses,
  onSuccess
}: AddClassModalProps) {
  const [classForm, setClassForm] = useState({
    name: "",
    room: "",
    courseId: "",
    teacherIds: [] as string[],
    specialtyIds: [] as string[],
    autoSchedule: true,
    startDate: new Date().toISOString().split("T")[0],
    weeksCount: "12",
    schedules: [] as {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      startDate?: string;
      weeksCount?: string | number;
      frequency?: "weekly" | "biweekly";
    }[]
  });

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // State for the new slot form inputs
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: 6,
    startTime: "08:00",
    endTime: "10:00",
    customRepeat: false,
    startDate: new Date().toISOString().split("T")[0],
    weeksCount: "12",
    frequency: "weekly" as "weekly" | "biweekly"
  });

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

  const DAY_OPTIONS = [
    { value: 1, label: "T2", full: "Thứ Hai" },
    { value: 2, label: "T3", full: "Thứ Ba" },
    { value: 3, label: "T4", full: "Thứ Tư" },
    { value: 4, label: "T5", full: "Thứ Năm" },
    { value: 5, label: "T6", full: "Thứ Sáu" },
    { value: 6, label: "T7", full: "Thứ Bảy" },
    { value: 0, label: "CN", full: "Chủ Nhật" }
  ];

  const hasOverlap = (teacher: any) => {
    if (!classForm.specialtyIds.length) return false;
    return teacher.specialties.some((tSpec: any) =>
      classForm.specialtyIds.includes(tSpec.id)
    );
  };

  const getOverlapCount = (teacher: any) => {
    return teacher.specialties.filter((s: any) => classForm.specialtyIds.includes(s.id)).length;
  };

  const checkLocalOverlap = (dayOfWeek: number, startTime: string, endTime: string) => {
    const timeToMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    return classForm.schedules.some((slot) => {
      if (slot.dayOfWeek !== dayOfWeek) return false;
      const existStart = timeToMinutes(slot.startTime);
      const existEnd = timeToMinutes(slot.endTime);
      return newStart < existEnd && newEnd > existStart;
    });
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    if ((!classForm.name && !classForm.courseId) || !classForm.schedules || classForm.schedules.length === 0) {
      setFormError("Vui lòng điền các trường bắt buộc (Khóa học/Tên lớp, Lịch học)");
      showNotification("Lỗi tạo lớp học", "Vui lòng chọn Khóa học hoặc nhập Tên lớp và thêm ít nhất một Lịch học.", "error");
      setSubmitting(false);
      return;
    }

    try {
      await cmsApi.classes.create(classForm);
      onSuccess();
      setClassForm({
        name: "",
        room: "",
        courseId: "",
        teacherIds: [],
        specialtyIds: [],
        autoSchedule: true,
        startDate: new Date().toISOString().split("T")[0],
        weeksCount: "12",
        schedules: []
      });
      onClose();
    } catch (err: any) {
      setFormError(err.message || "Có lỗi xảy ra khi tạo lớp học");
      showNotification("Lỗi tạo lớp học", err.message || "Có lỗi xảy ra khi tạo lớp học", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
          🏫 Thêm Lớp vẽ mới
        </h3>
        <p className="text-gray-500 text-sm mb-6">Tạo lớp học vẽ mới và phân công giáo viên giảng dạy</p>
        
        {formError && (
          <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-xl p-3 mb-4 font-bold text-sm">
            ⚠️ {formError}
          </div>
        )}

        <form onSubmit={handleAddClass} className="space-y-4">
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
              required={!classForm.courseId}
              disabled={!!classForm.courseId}
              placeholder={classForm.courseId ? "Tên lớp học tự động tạo theo khóa học" : "Ví dụ: Vẽ thiếu nhi K1"}
              className={`w-full border-3 border-black rounded-xl p-2.5 font-medium ${
                classForm.courseId ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-gray-50"
              }`}
              value={classForm.courseId ? "" : classForm.name}
              onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
            />
          </div>

          {/* Weekly Slots Builder */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">📅 Lịch học trong tuần (Có thể thêm nhiều buổi) *</label>
            <div className="space-y-2 mb-3">
              {classForm.schedules.length === 0 ? (
                <p className="text-xs text-gray-400 font-bold italic py-1 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">Chưa có lịch học nào. Vui lòng thêm lịch học bên dưới.</p>
              ) : (
                classForm.schedules.map((slot, index) => (
                  <div key={index} className="flex flex-col border-2 border-black rounded-xl p-3 bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] gap-1">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-black">
                        <span>{DAY_OPTIONS.find(d => d.value === slot.dayOfWeek)?.full}</span>
                        <span className="mx-2 text-gray-400">|</span>
                        <span>⏰ {slot.startTime} - {slot.endTime}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setClassForm(prev => ({
                            ...prev,
                            schedules: prev.schedules.filter((_, idx) => idx !== index)
                          }));
                        }}
                        className="text-rose-500 hover:text-rose-700 font-bold text-xs bg-rose-50 border border-rose-300 rounded px-1.5 py-0.5 cursor-pointer transition-all"
                      >
                        Xóa
                      </button>
                    </div>
                    {slot.weeksCount !== undefined && (
                      <div className="text-[10px] text-amber-600 font-black flex items-center gap-1 mt-0.5">
                        🔁 Lặp lại: {slot.weeksCount} tuần ({slot.frequency === "biweekly" ? "2 tuần/lần" : "hàng tuần"}) | Từ: {slot.startDate}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Inline form to add a slot - Vertically structured to avoid overflow */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-amber-50/20 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-0.5 uppercase">Thứ</label>
                <CustomSelect
                  value={String(newSlot.dayOfWeek)}
                  onChange={(val) => setNewSlot(prev => ({ ...prev, dayOfWeek: Number(val) }))}
                  options={DAY_OPTIONS.map(d => ({ value: String(d.value), label: d.full }))}
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-0.5 uppercase">Giờ học (Bắt đầu → Kết thúc)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
                    className="flex-1 border-2 border-black rounded-lg p-2 bg-white text-xs font-bold text-center"
                  />
                  <span className="text-gray-400 font-bold">→</span>
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot(prev => ({ ...prev, endTime: e.target.value }))}
                    className="flex-1 border-2 border-black rounded-lg p-2 bg-white text-xs font-bold text-center"
                  />
                </div>
              </div>

              {/* Custom Repeat Toggle for this specific slot */}
              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSlot.customRepeat}
                    onChange={(e) => setNewSlot(prev => ({ ...prev, customRepeat: e.target.checked }))}
                    className="w-4 h-4 border-2 border-black rounded accent-amber-400"
                  />
                  <span>🗓️ Tự động lên lịch lặp lại cho buổi này</span>
                </label>
              </div>

              {newSlot.customRepeat && (
                <div className="border border-black/10 rounded-lg p-3 bg-white space-y-3 animate-in slide-in-from-top duration-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 mb-0.5 uppercase">Bắt đầu từ ngày</label>
                      <input
                        type="date"
                        value={newSlot.startDate}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full border-2 border-black rounded-lg p-1.5 bg-white text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 mb-0.5 uppercase">Số tuần học</label>
                      <input
                        type="number"
                        min={1}
                        max={52}
                        value={newSlot.weeksCount}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, weeksCount: e.target.value }))}
                        className="w-full border-2 border-black rounded-lg p-1.5 bg-white text-xs font-semibold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 mb-1 uppercase">Tần suất học</label>
                    <CustomSelect
                      value={newSlot.frequency}
                      onChange={(val) => setNewSlot(prev => ({ ...prev, frequency: val as "weekly" | "biweekly" }))}
                      options={[
                        { value: "weekly", label: "Hàng tuần" },
                        { value: "biweekly", label: "2 tuần một lần" }
                      ]}
                      placeholder="Chọn tần suất"
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  const { dayOfWeek, startTime, endTime, customRepeat, startDate, weeksCount, frequency } = newSlot;

                  if (!startTime || !endTime) {
                    showNotification("Lỗi giờ học", "Vui lòng chọn đầy đủ giờ học bắt đầu và kết thúc.", "error");
                    return;
                  }

                  const timeToMinutes = (t: string) => {
                    const [h, m] = t.split(":").map(Number);
                    return h * 60 + m;
                  };

                  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
                    showNotification("Giờ học không hợp lệ", "Giờ kết thúc phải sau giờ bắt đầu.", "error");
                    return;
                  }

                  if (checkLocalOverlap(dayOfWeek, startTime, endTime)) {
                    const dayName = DAY_OPTIONS.find(d => d.value === dayOfWeek)?.full;
                    showNotification(
                      "Trùng lịch học",
                      `Lịch học bạn muốn thêm bị trùng với một lịch học khác cùng ngày ${dayName} đã được thêm vào danh sách.`,
                      "error"
                    );
                    return;
                  }

                  setClassForm(prev => ({
                    ...prev,
                    schedules: [
                      ...prev.schedules,
                      {
                        dayOfWeek,
                        startTime,
                        endTime,
                        ...(customRepeat ? { startDate, weeksCount: Number(weeksCount), frequency } : {})
                      }
                    ]
                  }));
                }}
                className="w-full bg-sky-100 hover:bg-sky-200 border-2 border-sky-400 text-sky-800 rounded-lg py-2.5 font-black text-xs shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
              >
                + Thêm lịch học vào tuần
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">Phòng học / Link học trực tuyến</label>
            <input
              type="text"
              placeholder="Ví dụ: Phòng 102 hoặc Zoom Link"
              className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-medium"
              value={classForm.room || ""}
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
            <label className="block text-sm font-bold text-gray-800 mb-2">Giáo viên giảng dạy (Chọn nhiều)</label>
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
