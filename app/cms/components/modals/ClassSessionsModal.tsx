"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Calendar, MapPin, Trash2, Loader2 } from "lucide-react";
import { CustomSelect } from "@/app/cms/components/ui/custom-select";
import { cmsApi } from "@/lib/api-client";
import { NotificationModal } from "./NotificationModal";

interface ClassSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: any | null;
  teachers: any[];
  mode: "ADMIN" | "TEACHER";
  onTakeAttendance: (session: any) => void;
}

export function ClassSessionsModal({
  isOpen,
  onClose,
  selectedClass,
  teachers,
  mode,
  onTakeAttendance
}: ClassSessionsModalProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info" | "confirm";
    onCloseCallback?: () => void;
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
    onCloseCallback?: () => void,
    onConfirm?: () => void
  ) => {
    setNotification({
      isOpen: true,
      title,
      message,
      type,
      onCloseCallback,
      onConfirm
    });
  };

  // Form states for creating a single session
  const [showSingleSessionForm, setShowSingleSessionForm] = useState(false);
  const [singleSessionForm, setSingleSessionForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    teacherId: "",
    room: "",
    isMakeup: false,
    description: ""
  });

  // Form states for generating recurring sessions
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [recurringForm, setRecurringForm] = useState({
    dayOfWeek: 1, // Monday
    startTime: "",
    endTime: "",
    startDate: "",
    endDate: "",
    teacherId: "",
    room: ""
  });

  useEffect(() => {
    if (isOpen && selectedClass?.id) {
      fetchSessions();
      setShowSingleSessionForm(false);
      setShowRecurringForm(false);
    }
  }, [isOpen, selectedClass]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await cmsApi.sessions.list({ classId: selectedClass.id });
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSingleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass?.id) return;
    setError("");
    setSubmitting(true);

    const { date, startTime, endTime, teacherId, room, isMakeup, description } = singleSessionForm;
    if (!date || !startTime || !endTime) {
      setError("Vui lòng điền ngày, giờ bắt đầu và kết thúc");
      setSubmitting(false);
      return;
    }

    try {
      await cmsApi.sessions.create({
        classId: selectedClass.id,
        date,
        startTime,
        endTime,
        teacherId: teacherId || null,
        room: room || null,
        isMakeup,
        description
      });
      setShowSingleSessionForm(false);
      setSingleSessionForm({
        date: "",
        startTime: "",
        endTime: "",
        teacherId: "",
        room: "",
        isMakeup: false,
        description: ""
      });
      await fetchSessions();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tạo buổi học");
      showNotification("Lỗi tạo buổi học", err.message || "Có lỗi xảy ra khi tạo buổi học", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRecurringSessions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass?.id) return;
    setError("");
    setSubmitting(true);

    const { dayOfWeek, startTime, endTime, startDate, endDate, teacherId, room } = recurringForm;
    if (!startTime || !endTime || !startDate || !endDate) {
      setError("Vui lòng điền đầy đủ các thông tin lập lịch");
      setSubmitting(false);
      return;
    }

    try {
      const res = await cmsApi.sessions.create({
        classId: selectedClass.id,
        isRecurring: true,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        startDate,
        endDate,
        teacherId: teacherId || null,
        room: room || null
      });
      showNotification("Thành công", res.message || "Tạo lịch học hàng tuần thành công", "success");
      setShowRecurringForm(false);
      setRecurringForm({
        dayOfWeek: 1,
        startTime: "",
        endTime: "",
        startDate: "",
        endDate: "",
        teacherId: "",
        room: ""
      });
      await fetchSessions();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tạo lịch học");
      showNotification("Lỗi lập lịch", err.message || "Có lỗi xảy ra khi tạo lịch học", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSessionStatus = async (sessionId: string, status: string) => {
    try {
      await cmsApi.sessions.update({ id: sessionId, status });
      await fetchSessions();
    } catch (err: any) {
      showNotification("Lỗi cập nhật", err.message || "Không thể cập nhật trạng thái", "error");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    showNotification(
      "Xác nhận xóa buổi học",
      "Bạn có chắc chắn muốn xóa buổi học này?",
      "confirm",
      undefined,
      async () => {
        try {
          await cmsApi.sessions.delete(sessionId);
          await fetchSessions();
        } catch (err: any) {
          showNotification("Lỗi xóa", err.message || "Không thể xóa buổi học", "error");
        }
      }
    );
  };

  if (!isOpen || !selectedClass) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white border-4 border-black rounded-[35px_15px_30px_10px/10px_30px_15px_35px] max-w-5xl w-full p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative my-8">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <span className="text-sm bg-amber-100 border-2 border-black rounded-lg px-2.5 py-0.5 font-bold text-amber-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase">
            Lớp học: {selectedClass.name}
          </span>
          <h3 className="text-2xl font-black text-black mt-2 flex items-center gap-2">
            📅 Quản lý Lịch học & Buổi học ({sessions.length})
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Lịch học gốc: {selectedClass.schedule || "Chưa thiết lập"} | Giáo viên mặc định: {selectedClass.teacher?.user?.name || "Chưa phân công"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Sessions List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b-2 border-black pb-2 gap-2">
              <h4 className="font-extrabold text-lg text-black">Danh sách các buổi học</h4>
              {mode === "ADMIN" && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setError("");
                      setShowRecurringForm(false);
                      setShowSingleSessionForm(!showSingleSessionForm);
                      setSingleSessionForm({
                        date: "",
                        startTime: "",
                        endTime: "",
                        teacherId: selectedClass.teacherId || "",
                        room: selectedClass.room || "",
                        isMakeup: false,
                        description: ""
                      });
                    }}
                    className="bg-[#bae1ff] hover:bg-[#a2d4fc] border-2 border-black rounded-lg px-2.5 py-1 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    + Thêm buổi lẻ / Học bù
                  </button>
                  <button
                    onClick={() => {
                      setError("");
                      setShowSingleSessionForm(false);
                      setShowRecurringForm(!showRecurringForm);
                      setRecurringForm({
                        dayOfWeek: 1,
                        startTime: "",
                        endTime: "",
                        startDate: "",
                        endDate: "",
                        teacherId: selectedClass.teacherId || "",
                        room: selectedClass.room || ""
                      });
                    }}
                    className="bg-[#baffc9] hover:bg-[#a3e9b3] border-2 border-black rounded-lg px-2.5 py-1 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    + Lập lịch hàng tuần
                  </button>
                </div>
              )}
            </div>
            
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <p className="mt-2 text-sm text-gray-500 font-bold">Đang tải danh sách buổi học...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="border-3 border-dashed border-gray-300 rounded-2xl p-8 text-center bg-gray-50">
                <p className="font-bold text-gray-400">Lớp học này chưa có buổi học nào được lên lịch 📅</p>
                <p className="text-gray-400 text-xs mt-1">Sử dụng nút ở trên để thêm buổi lẻ hoặc lập lịch hàng tuần.</p>
              </div>
            ) : (
              <div className="max-h-[450px] overflow-y-auto pr-2 border-2 border-black/10 rounded-2xl p-2 space-y-2.5">
                {sessions.map((session) => {
                  const sessionDate = new Date(session.date);
                  const formattedDate = sessionDate.toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  });
                  
                  let statusBg = "bg-sky-100 text-sky-800 border-sky-300";
                  let statusText = "Đang lên lịch";
                  if (session.status === "COMPLETED") {
                    statusBg = "bg-emerald-100 text-emerald-800 border-emerald-300";
                    statusText = mode === "ADMIN" ? "Đã hoàn thành" : "Đã học";
                  } else if (session.status === "CANCELLED") {
                    statusBg = "bg-rose-100 text-rose-800 border-rose-300";
                    statusText = "Đã hủy";
                  }

                  return (
                    <div key={session.id} className="border-2 border-black bg-white rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-gray-900 text-sm md:text-base">{formattedDate}</span>
                          <span className="bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5 font-bold text-amber-800 text-xs whitespace-nowrap">
                            ⏰ {session.startTime} - {session.endTime}
                          </span>
                          {session.isMakeup && (
                            <span className="bg-purple-100 border border-purple-300 rounded px-1.5 py-0.5 font-bold text-purple-800 text-xs whitespace-nowrap">
                              Học bù 🔄
                            </span>
                          )}
                          <span className={`border rounded px-1.5 py-0.5 font-bold text-xs whitespace-nowrap ${statusBg}`}>
                            {statusText}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-600 font-semibold space-y-0.5">
                          <div>👩‍🏫 Giáo viên: <span className="text-gray-900">{session.teacher?.user?.name || "Chưa phân công"}</span></div>
                          <div>📍 Phòng học: <span className="text-gray-900">{session.room || "Tại trung tâm"}</span></div>
                          {session.description && (
                            <div className="text-gray-500 italic mt-0.5">📝 Ghi chú: {session.description}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-1.5 shrink-0 flex-wrap w-full sm:w-auto justify-end">
                        <button
                          onClick={() => {
                            router.push(`/cms/sessions/${session.id}`);
                            onClose();
                          }}
                          className="bg-indigo-100 hover:bg-indigo-200 border border-indigo-400 text-indigo-800 rounded px-2 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                          title="Điểm danh & Nhận xét tác phẩm"
                        >
                          📝 Điểm danh & Nhận xét
                        </button>
                        {session.status !== "COMPLETED" && (
                          <button
                            onClick={() => handleUpdateSessionStatus(session.id, "COMPLETED")}
                            className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded px-2 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                            title="Đánh dấu đã học"
                          >
                            ✓ Đã học
                          </button>
                        )}
                        {session.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleUpdateSessionStatus(session.id, "CANCELLED")}
                            className="bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 rounded px-2 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                            title="Hủy buổi học này"
                          >
                            ✕ Hủy
                          </button>
                        )}
                        {mode === "ADMIN" && session.status !== "SCHEDULED" && (
                          <button
                            onClick={() => handleUpdateSessionStatus(session.id, "SCHEDULED")}
                            className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                            title="Đặt lại về chưa học"
                          >
                            ↺ Lên lịch
                          </button>
                        )}
                        {mode === "ADMIN" && (
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="p-1 bg-red-100 hover:bg-red-200 border border-red-400 rounded transition-all text-red-700 cursor-pointer inline-flex items-center justify-center shrink-0"
                            title="Xóa buổi học"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Forms Panel (ADMIN mode only) */}
          <div className="space-y-4">
            {mode === "ADMIN" && showSingleSessionForm && (
              <div className="border-3 border-black bg-[#fff9ed] rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-right duration-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-black text-base text-gray-900 flex items-center gap-1.5">
                    ➕ Thêm buổi lẻ / học bù
                  </h4>
                  <button 
                    onClick={() => setShowSingleSessionForm(false)} 
                    className="text-gray-500 hover:text-black font-black"
                  >
                    ✕
                  </button>
                </div>

                {error && (
                  <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-lg p-2 mb-3 font-bold text-xs">
                    {error}
                  </div>
                )}

                <form onSubmit={handleAddSingleSession} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">Ngày diễn ra *</label>
                    <input
                      type="date"
                      required
                      className="w-full border-2 border-black rounded-lg p-2 bg-white text-sm font-medium"
                      value={singleSessionForm.date}
                      onChange={(e) => setSingleSessionForm({ ...singleSessionForm, date: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">Giờ bắt đầu *</label>
                      <input
                        type="time"
                        required
                        className="w-full border-2 border-black rounded-lg p-2 bg-white text-sm font-medium"
                        value={singleSessionForm.startTime}
                        onChange={(e) => setSingleSessionForm({ ...singleSessionForm, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">Giờ kết thúc *</label>
                      <input
                        type="time"
                        required
                        className="w-full border-2 border-black rounded-lg p-2 bg-white text-sm font-medium"
                        value={singleSessionForm.endTime}
                        onChange={(e) => setSingleSessionForm({ ...singleSessionForm, endTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">Giáo viên phụ trách</label>
                    <CustomSelect
                      value={singleSessionForm.teacherId}
                      onChange={(val) => setSingleSessionForm({ ...singleSessionForm, teacherId: val })}
                      placeholder="-- Chọn giáo viên phụ trách --"
                      options={[
                        { value: "", label: "-- Mặc định lớp học --" },
                        ...teachers.map((t) => ({
                          value: t.id,
                          label: `${t.user.name || t.user.username} (${t.specialties.map((s: any) => s.name).join(", ")})`
                        }))
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">Phòng / Link học</label>
                    <input
                      type="text"
                      placeholder="Mặc định lớp học"
                      className="w-full border-2 border-black rounded-lg p-2 bg-white text-sm font-medium"
                      value={singleSessionForm.room}
                      onChange={(e) => setSingleSessionForm({ ...singleSessionForm, room: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id="isMakeup"
                      className="w-4 h-4 border-2 border-black rounded accent-emerald-400"
                      checked={singleSessionForm.isMakeup}
                      onChange={(e) => setSingleSessionForm({ ...singleSessionForm, isMakeup: e.target.checked })}
                    />
                    <label htmlFor="isMakeup" className="text-xs font-bold text-purple-900 cursor-pointer">
                      Đây là buổi học bù (Học bù 🔄)
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">Ghi chú / Mô tả</label>
                    <textarea
                      placeholder="Lý do học bù, nội dung học..."
                      className="w-full border-2 border-black rounded-lg p-2 bg-white text-sm font-medium"
                      value={singleSessionForm.description}
                      onChange={(e) => setSingleSessionForm({ ...singleSessionForm, description: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#bae1ff] hover:bg-[#a2d4fc] border-2 border-black rounded-lg py-2 font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Lưu buổi học
                  </button>
                </form>
              </div>
            )}

            {mode === "ADMIN" && showRecurringForm && (
              <div className="border-3 border-black bg-[#fff9ed] rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-right duration-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-black text-base text-gray-900 flex items-center gap-1.5">
                    🗓️ Lập lịch hàng tuần
                  </h4>
                  <button 
                    onClick={() => setShowRecurringForm(false)} 
                    className="text-gray-500 hover:text-black font-black"
                  >
                    ✕
                  </button>
                </div>

                {error && (
                  <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-lg p-2 mb-3 font-bold text-xs">
                    {error}
                  </div>
                )}

                <form onSubmit={handleAddRecurringSessions} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">Thứ trong tuần *</label>
                    <CustomSelect
                      value={String(recurringForm.dayOfWeek)}
                      onChange={(val) => setRecurringForm({ ...recurringForm, dayOfWeek: Number(val) })}
                      placeholder="Chọn thứ"
                      options={[
                        { value: "1", label: "Thứ Hai" },
                        { value: "2", label: "Thứ Ba" },
                        { value: "3", label: "Thứ Tư" },
                        { value: "4", label: "Thứ Năm" },
                        { value: "5", label: "Thứ Sáu" },
                        { value: "6", label: "Thứ Bảy" },
                        { value: "0", label: "Chủ Nhật" }
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">Giờ bắt đầu *</label>
                      <input
                        type="time"
                        required
                        className="w-full border-2 border-black rounded-lg p-2 bg-white text-sm font-medium"
                        value={recurringForm.startTime}
                        onChange={(e) => setRecurringForm({ ...recurringForm, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">Giờ kết thúc *</label>
                      <input
                        type="time"
                        required
                        className="w-full border-2 border-black rounded-lg p-2 bg-white text-sm font-medium"
                        value={recurringForm.endTime}
                        onChange={(e) => setRecurringForm({ ...recurringForm, endTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">Từ ngày *</label>
                      <input
                        type="date"
                        required
                        className="w-full border-2 border-black rounded-lg p-2 bg-white text-sm font-medium"
                        value={recurringForm.startDate}
                        onChange={(e) => setRecurringForm({ ...recurringForm, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">Đến ngày *</label>
                      <input
                        type="date"
                        required
                        className="w-full border-2 border-black rounded-lg p-2 bg-white text-sm font-medium"
                        value={recurringForm.endDate}
                        onChange={(e) => setRecurringForm({ ...recurringForm, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">Giáo viên phụ trách</label>
                    <CustomSelect
                      value={recurringForm.teacherId}
                      onChange={(val) => setRecurringForm({ ...recurringForm, teacherId: val })}
                      placeholder="-- Chọn giáo viên phụ trách --"
                      options={[
                        { value: "", label: "-- Mặc định lớp học --" },
                        ...teachers.map((t) => ({
                          value: t.id,
                          label: `${t.user.name || t.user.username} (${t.specialties.map((s: any) => s.name).join(", ")})`
                        }))
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">Phòng / Link học</label>
                    <input
                      type="text"
                      placeholder="Mặc định lớp học"
                      className="w-full border-2 border-black rounded-lg p-2 bg-white text-sm font-medium"
                      value={recurringForm.room}
                      onChange={(e) => setRecurringForm({ ...recurringForm, room: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#baffc9] hover:bg-[#a3e9b3] border-2 border-black rounded-lg py-2 font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Tạo lịch hàng loạt
                  </button>
                </form>
              </div>
            )}

            {/* Info guide card */}
            {(!showSingleSessionForm && !showRecurringForm) && (
              <div className="border-3 border-black bg-[#fafafa] rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xs text-gray-600 font-semibold space-y-2">
                <h5 className="font-black text-sm text-gray-900">💡 Mẹo quản lý lịch:</h5>
                <p>• Trạng thái buổi học sẽ trực tiếp cập nhật lên thời khóa biểu và dùng để thống kê buổi dạy của giáo viên.</p>
                {mode === "ADMIN" && (
                  <>
                    <p>• Sử dụng nút <strong className="text-[#6c5b7b]">Thêm buổi lẻ / Học bù</strong> để thiết lập các buổi học bù phát sinh cho lớp.</p>
                    <p>• Sử dụng nút <strong className="text-emerald-600">Lập lịch hàng tuần</strong> để lên lịch hàng loạt (ví dụ: tạo 12 buổi học vào các ngày thứ 7 hàng tuần).</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 border-t-2 border-black/10 pt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl px-6 py-2.5 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>

    <NotificationModal
      isOpen={notification.isOpen}
      onClose={() => {
        setNotification(prev => ({ ...prev, isOpen: false }));
        if (notification.onCloseCallback) notification.onCloseCallback();
      }}
      title={notification.title}
      message={notification.message}
      type={notification.type}
      onConfirm={notification.onConfirm}
    />
  </>
);
}
