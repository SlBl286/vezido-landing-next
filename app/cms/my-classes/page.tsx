"use client";

import { useEffect, useState } from "react";
import { cmsApi } from "@/lib/api-client";
import { ClassWithTeacherAndCount, StudentRoster, AuthSession } from "@/lib/types/api";
import { Calendar, MapPin, Users, X, Plus, Trash2, Loader2 } from "lucide-react";

export default function MyClassesPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Data lists
  const [classes, setClasses] = useState<ClassWithTeacherAndCount[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modals & roster states
  const [selectedClass, setSelectedClass] = useState<ClassWithTeacherAndCount | null>(null);
  const [students, setStudents] = useState<StudentRoster[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [studentForm, setStudentForm] = useState({
    studentName: "",
    studentAge: "",
    parentName: "",
    parentPhone: ""
  });

  // Fetch session on load
  useEffect(() => {
    async function getSession() {
      try {
        const data = await cmsApi.auth.getSession();
        setSession(data);
      } catch (err) {
        console.error("Failed to load session:", err);
      } finally {
        setLoadingSession(false);
      }
    }
    getSession();
  }, []);

  // Fetch teacher's classes (Teacher only)
  const fetchTeacherClasses = async () => {
    setLoadingData(true);
    try {
      const classesData = await cmsApi.classes.listForTeacher();
      setClasses(classesData.classes || []);
    } catch (err) {
      console.error("Failed to load classes:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!loadingSession && session && (session.user?.role === "TEACHER" || session.user?.role === "ADMIN")) {
      fetchTeacherClasses();
    }
  }, [loadingSession, session]);

  // Fetch students in selected class
  const fetchStudents = async (classId: string) => {
    setLoadingStudents(true);
    try {
      const data = await cmsApi.students.list(classId);
      setStudents(data.students || []);
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass.id);
    }
  }, [selectedClass]);

  // Enroll Student Handler
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    setFormError("");
    setSubmitting(true);

    const { studentName, studentAge, parentName, parentPhone } = studentForm;

    if (!studentName || !studentAge || !parentName || !parentPhone) {
      setFormError("Vui lòng điền đầy đủ thông tin học sinh");
      setSubmitting(false);
      return;
    }

    try {
      await cmsApi.students.enroll({
        ...studentForm,
        classId: selectedClass.id
      });
      setStudentForm({
        studentName: "",
        studentAge: "",
        parentName: "",
        parentPhone: ""
      });
      fetchStudents(selectedClass.id);
      fetchTeacherClasses(); // Refresh counts
    } catch (err: any) {
      setFormError(err.message || "Có lỗi xảy ra khi thêm học sinh");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Student Handler
  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa học sinh "${name}" khỏi lớp học này?`)) {
      return;
    }

    try {
      await cmsApi.students.delete(id);
      if (selectedClass) {
        fetchStudents(selectedClass.id);
      }
      fetchTeacherClasses(); // Refresh counts
    } catch (err: any) {
      alert(err.message || "Không thể xóa học sinh");
    }
  };

  if (loadingSession) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
        <p className="mt-4 font-bold text-gray-600">Đang tải trang lớp học...</p>
      </div>
    );
  }

  const user = session?.user;
  if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
    return (
      <div className="border-4 border-black bg-white rounded-3xl p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto my-12">
        <span className="text-6xl mb-4 block">🚫</span>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h1>
        <p className="text-gray-600">Trang này chỉ dành riêng cho Giáo viên (Teacher) và Quản trị viên (Admin).</p>
      </div>
    );
  }

  return (
    <div className="border-4 border-black bg-white rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-200">
      
      {/* Header section */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-black">Lớp học của tôi 🎨</h2>
        <p className="text-gray-500 text-sm">Danh sách các lớp học được phân công và học sinh do thầy/cô quản lý</p>
      </div>

      {/* Grid view */}
      {loadingData ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
          <p className="mt-4 font-bold text-gray-600">Đang tải lớp học...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="border-4 border-dashed border-gray-300 rounded-3xl p-12 text-center bg-gray-50">
          <p className="text-xl font-bold text-gray-400">Thầy/Cô chưa được phân công lớp học nào 🖌️</p>
          <p className="text-gray-400 mt-2">Vui lòng liên hệ với Super Admin để nhận lớp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="border-4 border-black bg-white rounded-[25px_10px_20px_10px/10px_20px_10px_25px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:scale-[1.01] transition-transform">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-xl font-black text-gray-900">{cls.name}</h3>
                  <span className="bg-[#baffc9] border-2 border-black rounded-lg px-2 py-0.5 font-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {cls._count?.students || 0} Học sinh
                  </span>
                </div>
                <hr className="my-3 border-t-2 border-black/10 border-dashed" />
                
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-semibold">{cls.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>{cls.room || "Trực tiếp tại trung tâm"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setFormError("");
                    setSelectedClass(cls);
                  }}
                  className="flex items-center gap-2 bg-[#ffd275] hover:bg-[#ffc342] border-3 border-black rounded-xl px-5 py-2.5 font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  <Users className="w-4 h-4" /> Danh sách Học sinh
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: STUDENT ROSTER (TEACHER VIEW) */}
      {selectedClass && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border-4 border-black rounded-[35px_15px_30px_10px/10px_30px_15px_35px] max-w-4xl w-full p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative my-8">
            <button 
              onClick={() => setSelectedClass(null)}
              className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-sm bg-[#bae1ff] border-2 border-black rounded-lg px-2.5 py-0.5 font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase">
                Lớp học: {selectedClass.name}
              </span>
              <h3 className="text-2xl font-black text-black mt-2 flex items-center gap-2">
                🎒 Quản lý Danh sách học sinh ({students.length})
              </h3>
              <p className="text-gray-500 text-sm mt-1">Lịch học: {selectedClass.schedule} | Phòng: {selectedClass.room || "Trực tiếp tại trung tâm"}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Student List */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-extrabold text-lg text-black border-b-2 border-black pb-1">Danh sách học viên đang theo học</h4>
                
                {loadingStudents ? (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    <p className="mt-2 text-sm text-gray-500 font-bold">Đang tải danh sách học sinh...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="border-3 border-dashed border-gray-300 rounded-2xl p-8 text-center bg-gray-50">
                    <p className="font-bold text-gray-400">Lớp học này chưa có học sinh nào 🎒</p>
                    <p className="text-gray-400 text-xs mt-1">Sử dụng biểu mẫu bên phải để đăng ký cho học viên.</p>
                  </div>
                ) : (
                  <div className="max-h-[350px] overflow-y-auto pr-2 border-2 border-black/10 rounded-2xl p-2 space-y-2.5">
                    {students.map((student) => (
                      <div key={student.id} className="border-2 border-black bg-[#fafafa] rounded-xl p-3 flex justify-between items-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-gray-900 text-base">{student.studentName}</span>
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

              {/* Right Column: Register Student Form */}
              <div className="border-3 border-black bg-[#fff9ed] rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-fit">
                <h4 className="font-black text-base text-gray-900 mb-3 flex items-center gap-1.5">
                  <Plus className="w-5 h-5 text-emerald-500" /> Đăng ký học viên mới
                </h4>
                
                {formError && (
                  <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-lg p-2.5 mb-3 font-bold text-xs">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleAddStudent} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">Tên học sinh *</label>
                    <input
                      type="text"
                      required
                      placeholder="Tên đầy đủ của bé"
                      className="w-full border-2 border-black rounded-lg p-2 bg-white text-sm font-medium"
                      value={studentForm.studentName}
                      onChange={(e) => setStudentForm({ ...studentForm, studentName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">Tuổi học sinh *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={18}
                      placeholder="Ví dụ: 7"
                      className="w-full border-2 border-black rounded-lg p-2 bg-white text-sm font-medium"
                      value={studentForm.studentAge}
                      onChange={(e) => setStudentForm({ ...studentForm, studentAge: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">Tên phụ huynh *</label>
                    <input
                      type="text"
                      required
                      placeholder="Họ tên cha hoặc mẹ"
                      className="w-full border-2 border-black rounded-lg p-2 bg-white text-sm font-medium"
                      value={studentForm.parentName}
                      onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">Số điện thoại phụ huynh *</label>
                    <input
                      type="tel"
                      required
                      placeholder="Số điện thoại liên lạc"
                      className="w-full border-2 border-black rounded-lg p-2 bg-white text-sm font-medium"
                      value={studentForm.parentPhone}
                      onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-2 bg-[#baffc9] hover:bg-[#a3e9b3] border-2 border-black rounded-lg py-2 font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Thêm Học Viên
                  </button>
                </form>
              </div>
            </div>

            <div className="mt-8 border-t-2 border-black/10 pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedClass(null)}
                className="bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl px-6 py-2.5 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
