"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { CustomSelect } from "@/app/cms/components/ui/custom-select";
import { cmsApi } from "@/lib/api-client";
import { NotificationModal } from "./NotificationModal";

interface ManageStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any | null; // null for add mode, object for edit mode
  onSuccess: () => void;
}

export function ManageStudentModal({
  isOpen,
  onClose,
  student,
  onSuccess
}: ManageStudentModalProps) {
  const [classes, setClasses] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [form, setForm] = useState({
    studentName: "",
    studentAge: "",
    parentName: "",
    parentPhone: "",
    studentCode: "",
    classId: "",
    customDuration: ""
  });

  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showNotification = (title: string, message: string, type: "success" | "error" | "info") => {
    setNotification({
      isOpen: true,
      title,
      message,
      type
    });
  };

  useEffect(() => {
    if (isOpen) {
      fetchClasses();
      setError("");
      
      if (student) {
        setForm({
          studentName: student.studentName,
          studentAge: String(student.studentAge),
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          studentCode: student.studentCode || "",
          classId: student.classId || "",
          customDuration: student.customDuration ? String(student.customDuration) : ""
        });
      } else {
        setForm({
          studentName: "",
          studentAge: "",
          parentName: "",
          parentPhone: "",
          studentCode: "",
          classId: "",
          customDuration: ""
        });
      }
    }
  }, [isOpen, student]);

  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const data = await cmsApi.classes.list();
      setClasses(data.classes || []);
    } catch (err) {
      console.error("Failed to load classes:", err);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { studentName, studentAge, parentName, parentPhone, classId } = form;

    if (!studentName) {
      setError("Vui lòng nhập Tên học sinh");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...form,
        studentAge: studentAge ? parseInt(studentAge, 10) : null,
        parentName: parentName || null,
        parentPhone: parentPhone || null,
        customDuration: form.customDuration ? parseInt(form.customDuration, 10) : null
      };

      if (student) {
        // Edit mode
        await cmsApi.students.update(student.id, payload);
        showNotification("Thành công", "Đã cập nhật thông tin học sinh thành công", "success");
      } else {
        // Add mode
        await cmsApi.students.enroll(payload);
        showNotification("Thành công", "Đã thêm học sinh mới thành công", "success");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi lưu thông tin");
      showNotification("Lỗi", err.message || "Không thể lưu thông tin học sinh", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const classOptions = [
    { value: "", label: "-- Chưa xếp lớp --" },
    ...classes.map((c) => ({
      value: c.id,
      label: `${c.name} (${c.schedule || "Chưa có lịch"})`
    }))
  ];

  return (
    <>
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-150"
      >
        <div className="bg-[#fefaf0] border-4 border-black rounded-[30px_15px_25px_10px/10px_25px_15px_30px] max-w-lg w-full p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative my-8 animate-in zoom-in-95 duration-150">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-6">
            <h3 className="text-2xl font-black text-black flex items-center gap-2">
              🎒 {student ? "Chỉnh sửa học sinh" : "Thêm mới học sinh"}
            </h3>
            <p className="text-gray-500 text-sm mt-1 font-bold">
              {student ? "Cập nhật thông tin chi tiết và lớp học của học sinh" : "Tạo mã định danh học sinh mới và xếp lớp"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="border-3 border-black bg-rose-100 p-3 rounded-xl font-bold text-rose-800 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                ⚠️ {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-black text-black uppercase">Tên học sinh *</label>
              <input
                type="text"
                value={form.studentName}
                onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                placeholder="Ví dụ: Nguyễn Văn An"
                className="w-full border-3 border-black rounded-xl p-2.5 bg-white text-sm font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-black text-black uppercase">Tuổi</label>
                <input
                  type="number"
                  value={form.studentAge}
                  onChange={(e) => setForm({ ...form, studentAge: e.target.value })}
                  placeholder="Ví dụ: 8"
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-white text-sm font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-black text-black uppercase">
                  Mã học sinh {student ? "" : "(Tùy chọn)"}
                </label>
                <input
                  type="text"
                  value={form.studentCode}
                  onChange={(e) => setForm({ ...form, studentCode: e.target.value })}
                  placeholder={student ? "Không thể thay đổi" : "Hệ thống sẽ tự tạo nếu để trống"}
                  disabled={!!student}
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed text-sm font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-black text-black uppercase">Tên phụ huynh</label>
                <input
                  type="text"
                  value={form.parentName}
                  onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn B"
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-white text-sm font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-black text-black uppercase">Số điện thoại</label>
                <input
                  type="tel"
                  value={form.parentPhone}
                  onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                  placeholder="Ví dụ: 0912345678"
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-white text-sm font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-black text-black uppercase">Xếp lớp học</label>
              {loadingClasses ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 font-bold p-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  Đang tải danh sách lớp học...
                </div>
              ) : (
                <CustomSelect
                  value={form.classId}
                  onChange={(val) => setForm({ ...form, classId: val })}
                  options={classOptions}
                  placeholder="Chọn lớp học..."
                />
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-black text-black uppercase">
                Số buổi học tùy chỉnh (Nếu học nửa khóa / khác mặc định)
              </label>
              <input
                type="number"
                min="1"
                value={form.customDuration}
                onChange={(e) => setForm({ ...form, customDuration: e.target.value })}
                placeholder="Để trống để học số buổi mặc định của khóa"
                className="w-full border-3 border-black rounded-xl p-2.5 bg-white text-sm font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border-3 border-black bg-white hover:bg-gray-100 rounded-xl text-sm font-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 border-3 border-black bg-[#ffd275] hover:bg-[#ffc342] disabled:opacity-50 rounded-xl text-sm font-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none cursor-pointer flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {student ? "Cập nhật" : "Lưu lại"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </>
  );
}
