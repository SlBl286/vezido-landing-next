"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { NotificationModal } from "./NotificationModal";
import { CustomSelect } from "@/app/cms/components/ui/custom-select";
import { cmsApi } from "@/lib/api-client";
import { StudentRoster } from "@/lib/types/api";

interface StudentRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: any | null;
  onRosterChange?: () => void;
}

export function StudentRosterModal({
  isOpen,
  onClose,
  selectedClass,
  onRosterChange
}: StudentRosterModalProps) {
  const [students, setStudents] = useState<StudentRoster[]>([]);
  const [systemStudents, setSystemStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [registerMode, setRegisterMode] = useState<"new" | "existing">("new");
  const [selectedExistingId, setSelectedExistingId] = useState("");

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

  const [studentForm, setStudentForm] = useState({
    studentName: "",
    studentAge: "",
    parentName: "",
    parentPhone: "",
    studentCode: ""
  });

  useEffect(() => {
    if (isOpen && selectedClass?.id) {
      fetchStudents();
      fetchSystemStudents();
      setRegisterMode("new");
      resetForm();
      setError("");
    }
  }, [isOpen, selectedClass]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await cmsApi.students.list(selectedClass.id);
      setStudents(data.students || []);
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStudents = async () => {
    try {
      const data = await cmsApi.students.listAllUnique();
      setSystemStudents(data.students || []);
    } catch (err) {
      console.error("Failed to load system students:", err);
    }
  };

  const resetForm = () => {
    setStudentForm({
      studentName: "",
      studentAge: "",
      parentName: "",
      parentPhone: "",
      studentCode: ""
    });
    setSelectedExistingId("");
  };

  const handleExistingStudentChange = (id: string) => {
    setSelectedExistingId(id);
    const student = systemStudents.find(s => s.id === id);
    if (student) {
      setStudentForm({
        studentName: student.studentName,
        studentAge: String(student.studentAge),
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        studentCode: student.studentCode || ""
      });
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass?.id) return;
    setError("");
    setSubmitting(true);

    const { studentName, studentAge, parentName, parentPhone } = studentForm;

    if (!studentName || !studentAge || !parentName || !parentPhone) {
      setError("Vui lòng điền đầy đủ thông tin học sinh");
      setSubmitting(false);
      return;
    }

    try {
      await cmsApi.students.enroll({
        ...studentForm,
        classId: selectedClass.id
      });
      
      resetForm();
      await Promise.all([fetchStudents(), fetchSystemStudents()]);
      if (onRosterChange) {
        onRosterChange();
      }
      showNotification("Thành công", "Đã thêm học sinh vào lớp thành công", "success");
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi thêm học sinh");
      showNotification("Lỗi thêm học sinh", err.message || "Có lỗi xảy ra khi thêm học sinh", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    showNotification(
      "Xác nhận xóa học sinh",
      `Bạn có chắc chắn muốn xóa học sinh "${name}" khỏi lớp học này?`,
      "confirm",
      undefined,
      async () => {
        try {
          await cmsApi.students.delete(id);
          await Promise.all([fetchStudents(), fetchSystemStudents()]);
          if (onRosterChange) {
            onRosterChange();
          }
        } catch (err: any) {
          showNotification("Lỗi xóa học sinh", err.message || "Không thể xóa học sinh", "error");
        }
      }
    );
  };

  if (!isOpen || !selectedClass) return null;

  // Filter existing system students options (excluding those already in class)
  const existingStudentOptions = systemStudents
    .filter(ss => !students.some(s => s.studentCode === ss.studentCode))
    .map(ss => ({
      value: ss.id,
      label: `${ss.studentName} (${ss.studentCode || "Chưa có mã"}) - ${ss.studentAge}t - SĐT: ${ss.parentPhone}`
    }));

  const isReadOnly = registerMode === "existing";

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-150">
        <div className="bg-white border-4 border-black rounded-[35px_15px_30px_10px/10px_30px_15px_35px] max-w-5xl w-full p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative my-8 animate-in zoom-in-95 duration-150">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-6">
            <span className="text-sm bg-[#bae1ff] border-2 border-black rounded-lg px-2.5 py-0.5 font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase">
              Lớp học: {selectedClass.name}
            </span>
            <h3 className="text-2xl font-black text-black mt-2 flex items-center gap-2">
              🎒 Quản lý Danh sách học sinh
            </h3>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              Lịch học: {selectedClass.schedule} | Phòng: {selectedClass.room || "Trực tiếp tại trung tâm"}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Column: Student List (Span 3) */}
            <div className="lg:col-span-3 space-y-4">
              <h4 className="font-extrabold text-lg text-black border-b-2 border-black pb-1">
                Danh sách học viên đang theo học ({students.length})
              </h4>
              
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  <p className="mt-2 text-sm text-gray-500 font-bold">Đang tải danh sách học sinh...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="border-3 border-dashed border-gray-300 rounded-2xl p-12 text-center bg-gray-50">
                  <p className="font-bold text-gray-400">Lớp học này chưa có học sinh nào 🎒</p>
                  <p className="text-gray-400 text-xs mt-1 font-medium">Sử dụng biểu mẫu bên phải để đăng ký học viên.</p>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto pr-2 border-2 border-black/10 rounded-2xl p-2 space-y-2.5">
                  {students.map((student) => (
                    <div key={student.id} className="border-2 border-black bg-[#fafafa] rounded-xl p-3 flex justify-between items-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-gray-900 text-base">{student.studentName}</span>
                          {student.studentCode && (
                            <span className="bg-purple-100 border border-purple-300 rounded px-1.5 py-0.5 font-black text-purple-800 text-xs">
                              {student.studentCode}
                            </span>
                          )}
                          <span className="bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5 font-bold text-amber-800 text-xs">
                            {student.studentAge} tuổi
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-600 font-medium">
                          Phụ huynh: <span className="font-bold text-gray-800">{student.parentName}</span> - SĐT: <span className="font-bold text-gray-800">{student.parentPhone}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteStudent(student.id, student.studentName)}
                        className="p-2 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-lg transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-black cursor-pointer"
                        title="Xóa học sinh khỏi lớp"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Register/Enroll Form (Span 2) */}
            <div className="lg:col-span-2 border-3 border-black bg-[#fff9ed] rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-fit space-y-4">
              <h4 className="font-black text-base text-gray-900 flex items-center gap-1.5 border-b-2 border-black pb-2">
                <Plus className="w-5 h-5 text-emerald-500" /> Đăng ký học viên
              </h4>

              {/* Mode switch */}
              <div className="flex gap-2 border-2 border-black rounded-xl p-1 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <button
                  type="button"
                  onClick={() => {
                    setRegisterMode("new");
                    resetForm();
                  }}
                  className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    registerMode === "new" ? "bg-[#ffd275] border border-black" : "bg-transparent text-gray-500"
                  }`}
                >
                  Đăng ký mới
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegisterMode("existing");
                    resetForm();
                  }}
                  className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    registerMode === "existing" ? "bg-[#ffd275] border border-black" : "bg-transparent text-gray-500"
                  }`}
                >
                  Chọn học sinh cũ
                </button>
              </div>
              
              {error && (
                <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-lg p-2.5 font-bold text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleAddStudent} className="space-y-3">
                {registerMode === "existing" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">Chọn học sinh cũ *</label>
                    <CustomSelect
                      value={selectedExistingId}
                      onChange={handleExistingStudentChange}
                      options={existingStudentOptions}
                      placeholder="Tìm và chọn học sinh..."
                    />
                    {existingStudentOptions.length === 0 && (
                      <p className="text-[10px] text-amber-600 font-bold mt-1">Tất cả học sinh cũ đều đã trong lớp học này.</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Tên học sinh *</label>
                  <input
                    type="text"
                    required
                    readOnly={isReadOnly}
                    placeholder="Tên đầy đủ của bé"
                    className={`w-full border-2 border-black rounded-lg p-2 text-sm font-medium focus:outline-none ${
                      isReadOnly ? "bg-gray-100 cursor-not-allowed text-gray-600" : "bg-white"
                    }`}
                    value={studentForm.studentName}
                    onChange={(e) => !isReadOnly && setStudentForm({ ...studentForm, studentName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Tuổi học sinh *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={18}
                    readOnly={isReadOnly}
                    placeholder="Ví dụ: 7"
                    className={`w-full border-2 border-black rounded-lg p-2 text-sm font-medium focus:outline-none ${
                      isReadOnly ? "bg-gray-100 cursor-not-allowed text-gray-600" : "bg-white"
                    }`}
                    value={studentForm.studentAge}
                    onChange={(e) => !isReadOnly && setStudentForm({ ...studentForm, studentAge: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Tên phụ huynh *</label>
                  <input
                    type="text"
                    required
                    readOnly={isReadOnly}
                    placeholder="Họ tên cha hoặc mẹ"
                    className={`w-full border-2 border-black rounded-lg p-2 text-sm font-medium focus:outline-none ${
                      isReadOnly ? "bg-gray-100 cursor-not-allowed text-gray-600" : "bg-white"
                    }`}
                    value={studentForm.parentName}
                    onChange={(e) => !isReadOnly && setStudentForm({ ...studentForm, parentName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Số điện thoại phụ huynh *</label>
                  <input
                    type="tel"
                    required
                    readOnly={isReadOnly}
                    placeholder="Số điện thoại liên lạc"
                    className={`w-full border-2 border-black rounded-lg p-2 text-sm font-medium focus:outline-none ${
                      isReadOnly ? "bg-gray-100 cursor-not-allowed text-gray-600" : "bg-white"
                    }`}
                    value={studentForm.parentPhone}
                    onChange={(e) => !isReadOnly && setStudentForm({ ...studentForm, parentPhone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Mã học viên</label>
                  <input
                    type="text"
                    readOnly={isReadOnly}
                    placeholder="Ví dụ: HS-1234"
                    className={`w-full border-2 border-black rounded-lg p-2 text-sm font-medium focus:outline-none ${
                      isReadOnly ? "bg-gray-100 cursor-not-allowed text-gray-600" : "bg-white"
                    }`}
                    value={studentForm.studentCode}
                    onChange={(e) => !isReadOnly && setStudentForm({ ...studentForm, studentCode: e.target.value })}
                  />
                  {!isReadOnly && (
                    <p className="text-[9px] text-gray-400 font-semibold mt-0.5">Để trống để hệ thống tự sinh mã HS mới.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 bg-[#baffc9] hover:bg-[#a3e9b3] border-2 border-black rounded-lg py-2 font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {registerMode === "new" ? "Thêm Học Viên Mới" : "Thêm Học Viên Có Sẵn"}
                </button>
              </form>
            </div>
          </div>

          <div className="mt-8 border-t-2 border-black/10 pt-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl px-6 py-2.5 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
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

