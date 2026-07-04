"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { cmsApi } from "@/lib/api-client";
import { NotificationModal } from "./NotificationModal";

interface StudentAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any | null;
  onSaveSuccess?: () => void;
}

export function StudentAttendanceModal({
  isOpen,
  onClose,
  session,
  onSaveSuccess
}: StudentAttendanceModalProps) {
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
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

  useEffect(() => {
    if (isOpen && session?.id) {
      loadAttendance();
    }
  }, [isOpen, session]);

  const loadAttendance = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await cmsApi.attendance.get(session.id);
      setAttendanceList(data.attendance || []);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách điểm danh");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.id) return;
    setError("");
    setSubmitting(true);
    try {
      await cmsApi.attendance.save({
        sessionId: session.id,
        records: attendanceList.map((item) => ({
          studentClassId: item.studentClassId,
          status: item.status || "PRESENT",
          notes: item.notes,
        })),
      });
      showNotification("Thành công", "Lưu điểm danh thành công!", "success", () => {
        if (onSaveSuccess) {
          onSaveSuccess();
        }
        onClose();
      });
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi lưu điểm danh");
      showNotification("Thành công thất bại", err.message || "Có lỗi xảy ra khi lưu điểm danh", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !session) return null;

  return (
    <>
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 z-[60] overflow-y-auto"
      >
      <div className="bg-white border-4 border-black rounded-[35px_15px_30px_10px/10px_30px_15px_35px] max-w-2xl w-full p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative my-8">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <span className="text-sm bg-[#bae1ff] border-2 border-black rounded-lg px-2.5 py-0.5 font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase">
            Điểm danh: {session.class?.name || "Lớp học"}
          </span>
          <h3 className="text-2xl font-black text-black mt-2 flex items-center gap-2">
            📝 Điểm danh buổi học
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Ngày học: {new Date(session.date).toLocaleDateString("vi-VN")} | Giờ: {session.startTime} - {session.endTime}
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-xl p-3 mb-4 font-bold text-sm">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="mt-2 text-sm text-gray-500 font-bold">Đang tải danh sách điểm danh...</p>
          </div>
        ) : attendanceList.length === 0 ? (
          <div className="border-3 border-dashed border-gray-300 rounded-2xl p-8 text-center bg-gray-50">
            <p className="font-bold text-gray-400">Lớp học này chưa có học sinh nào 🎒</p>
            <p className="text-gray-400 text-xs mt-1">Vui lòng đăng ký học sinh cho lớp học trước.</p>
          </div>
        ) : (
          <form onSubmit={handleSaveAttendance} className="space-y-4">
            <div className="max-h-[350px] overflow-y-auto pr-2 border-2 border-black/10 rounded-2xl p-2 space-y-3">
              {attendanceList.map((student, idx) => {
                const currentStatus = student.status || "PRESENT";
                return (
                  <div key={student.studentClassId} className="border-2 border-black bg-[#fafafa] rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div>
                        <span className="font-black text-gray-900 text-base">{student.studentName}</span>
                        <span className="ml-2 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5 font-bold text-amber-800 text-xs">
                          {student.studentAge} tuổi
                        </span>
                      </div>
                      
                      {/* Visual Radio Select */}
                      <div className="flex gap-1.5 flex-wrap">
                        {[
                          { val: "PRESENT", label: "Có mặt", color: "bg-[#baffc9]" },
                          { val: "ABSENT", label: "Vắng", color: "bg-[#ffaaa6]" },
                          { val: "LATE", label: "Đi muộn", color: "bg-[#ffd275]" }
                        ].map((opt) => {
                          const isActive = currentStatus === opt.val;
                          return (
                            <button
                              type="button"
                              key={opt.val}
                              onClick={() => {
                                setAttendanceList(prev => prev.map((s, i) => i === idx ? { ...s, status: opt.val } : s));
                              }}
                              className={`px-2 py-1 border-2 border-black rounded-lg text-xs font-black transition-all cursor-pointer shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 ${
                                isActive ? `${opt.color} text-black scale-105` : "bg-white text-gray-500 hover:bg-gray-100"
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notes Input */}
                    <div>
                      <input
                        type="text"
                        placeholder="Ghi chú chi tiết (ví dụ: Nghỉ có phép, đi muộn 15p...)"
                        className="w-full border-2 border-black rounded-lg p-2 bg-white text-xs font-medium"
                        value={student.notes || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAttendanceList(prev => prev.map((s, i) => i === idx ? { ...s, notes: val } : s));
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t-2 border-black/10 flex justify-end gap-3">
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
                className="bg-[#a8e6cf] hover:bg-[#96d8c0] border-3 border-black rounded-xl px-5 py-2.5 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-2 disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu điểm danh
              </button>
            </div>
          </form>
        )}
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
