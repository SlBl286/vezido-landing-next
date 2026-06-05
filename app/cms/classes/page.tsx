"use client";

import { useEffect, useState } from "react";
import { CustomSelect } from "@/app/cms/components/ui/custom-select";
import { cmsApi } from "@/lib/api-client";
import { ClassWithTeacherAndCount, TeacherWithUserAndClasses, StudentRoster, AuthSession } from "@/lib/types/api";
import { Specialty } from "@/lib/generated/prisma/client";
import { Plus, Trash2, Calendar, MapPin, Users, X, Loader2 } from "lucide-react";

export default function ClassesPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Data lists
  const [classes, setClasses] = useState<ClassWithTeacherAndCount[]>([]);
  const [teachers, setTeachers] = useState<TeacherWithUserAndClasses[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modals & submission states
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassWithTeacherAndCount | null>(null);
  
  // Student list within selected class
  const [students, setStudents] = useState<StudentRoster[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Sessions list & modal state
  const [selectedClassForSessions, setSelectedClassForSessions] = useState<ClassWithTeacherAndCount | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

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

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [classForm, setClassForm] = useState({
    name: "",
    schedule: "",
    room: "",
    teacherId: "",
    specialtyIds: [] as string[],
    dayOfWeek: 6 as number, // default Saturday
    startTime: "08:00",
    endTime: "10:00",
    autoSchedule: true,
    startDate: new Date().toISOString().split("T")[0],
    weeksCount: "12"
  });

  const DAY_OPTIONS = [
    { value: 1, label: "T2", full: "Thứ Hai" },
    { value: 2, label: "T3", full: "Thứ Ba" },
    { value: 3, label: "T4", full: "Thứ Tư" },
    { value: 4, label: "T5", full: "Thứ Năm" },
    { value: 5, label: "T6", full: "Thứ Sáu" },
    { value: 6, label: "T7", full: "Thứ Bảy" },
    { value: 0, label: "CN", full: "Chủ Nhật" }
  ];

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

  // Fetch classes, teachers, & specialties (Admin only)
  const fetchAllData = async () => {
    setLoadingData(true);
    try {
      const classesData = await cmsApi.classes.list();
      setClasses(classesData.classes || []);

      const teachersData = await cmsApi.teachers.list();
      setTeachers(teachersData.teachers || []);

      const specsData = await cmsApi.specialties.list();
      setSpecialties(specsData.specialties || []);
    } catch (err) {
      console.error("Failed to load classes and teachers:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!loadingSession && session && session.user?.role === "ADMIN") {
      fetchAllData();
    }
  }, [loadingSession, session]);

  // Fetch students when a class is selected
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

  // Fetch sessions when a class is selected for sessions
  const fetchSessions = async (classId: string) => {
    setLoadingSessions(true);
    try {
      const data = await cmsApi.sessions.list({ classId });
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (selectedClassForSessions) {
      fetchSessions(selectedClassForSessions.id);
    }
  }, [selectedClassForSessions]);

  // Add Class Handler
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    if (!classForm.name || !classForm.startTime || !classForm.endTime) {
      setFormError("Vui lòng điền các trường bắt buộc (Tên lớp học, Giờ học)");
      setSubmitting(false);
      return;
    }

    try {
      const payload: any = {
        name: classForm.name,
        room: classForm.room,
        teacherId: classForm.teacherId,
        specialtyIds: classForm.specialtyIds,
        dayOfWeek: classForm.dayOfWeek,
        startTime: classForm.startTime,
        endTime: classForm.endTime,
        autoSchedule: classForm.autoSchedule,
        startDate: classForm.startDate,
        weeksCount: classForm.weeksCount,
      };
      await cmsApi.classes.create(payload);
      setShowAddClassModal(false);
      setClassForm({
        name: "",
        schedule: "",
        room: "",
        teacherId: "",
        specialtyIds: [],
        dayOfWeek: 6,
        startTime: "08:00",
        endTime: "10:00",
        autoSchedule: true,
        startDate: new Date().toISOString().split("T")[0],
        weeksCount: "12"
      });
      fetchAllData();
    } catch (err: any) {
      setFormError(err.message || "Có lỗi xảy ra khi tạo lớp học");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Class Handler
  const handleDeleteClass = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa lớp học "${name}"?`)) {
      return;
    }

    try {
      await cmsApi.classes.delete(id);
      fetchAllData();
    } catch (err: any) {
      alert(err.message || "Không thể xóa lớp học");
    }
  };

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
      fetchAllData(); // Refresh counts
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
      fetchAllData(); // Refresh counts
    } catch (err: any) {
      alert(err.message || "Không thể xóa học sinh");
    }
  };

  // Add Single Session
  const handleAddSingleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassForSessions) return;
    setFormError("");
    setSubmitting(true);

    const { date, startTime, endTime, teacherId, room, isMakeup, description } = singleSessionForm;
    if (!date || !startTime || !endTime) {
      setFormError("Vui lòng điền ngày, giờ bắt đầu và kết thúc");
      setSubmitting(false);
      return;
    }

    try {
      await cmsApi.sessions.create({
        classId: selectedClassForSessions.id,
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
      fetchSessions(selectedClassForSessions.id);
    } catch (err: any) {
      setFormError(err.message || "Có lỗi xảy ra khi tạo buổi học");
    } finally {
      setSubmitting(false);
    }
  };

  // Add Recurring Sessions
  const handleAddRecurringSessions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassForSessions) return;
    setFormError("");
    setSubmitting(true);

    const { dayOfWeek, startTime, endTime, startDate, endDate, teacherId, room } = recurringForm;
    if (!startTime || !endTime || !startDate || !endDate) {
      setFormError("Vui lòng điền đầy đủ các thông tin lập lịch");
      setSubmitting(false);
      return;
    }

    try {
      const res = await cmsApi.sessions.create({
        classId: selectedClassForSessions.id,
        isRecurring: true,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        startDate,
        endDate,
        teacherId: teacherId || null,
        room: room || null
      });
      alert(res.message || "Tạo lịch học hàng tuần thành công");
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
      fetchSessions(selectedClassForSessions.id);
    } catch (err: any) {
      setFormError(err.message || "Có lỗi xảy ra khi tạo lịch học");
    } finally {
      setSubmitting(false);
    }
  };

  // Update Session Status
  const handleUpdateSessionStatus = async (sessionId: string, status: string) => {
    if (!selectedClassForSessions) return;
    try {
      await cmsApi.sessions.update({ id: sessionId, status });
      fetchSessions(selectedClassForSessions.id);
    } catch (err: any) {
      alert(err.message || "Không thể cập nhật trạng thái");
    }
  };

  // Delete Session
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa buổi học này?")) {
      return;
    }
    if (!selectedClassForSessions) return;
    try {
      await cmsApi.sessions.delete(sessionId);
      fetchSessions(selectedClassForSessions.id);
    } catch (err: any) {
      alert(err.message || "Không thể xóa buổi học");
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
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="border-4 border-black bg-white rounded-3xl p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto my-12">
        <span className="text-6xl mb-4 block">🚫</span>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h1>
        <p className="text-gray-600">Trang này chỉ dành riêng cho Quản trị viên (Super Admin).</p>
      </div>
    );
  }

  // Teacher Specialties Overlap Helper
  const hasOverlap = (teacher: TeacherWithUserAndClasses) => {
    if (!classForm.specialtyIds.length) return false;
    return teacher.specialties.some((tSpec) =>
      classForm.specialtyIds.includes(tSpec.id)
    );
  };

  const getOverlapCount = (teacher: TeacherWithUserAndClasses) => {
    return teacher.specialties.filter((s) => classForm.specialtyIds.includes(s.id)).length;
  };

  return (
    <div className="border-4 border-black bg-white rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-200">
      
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-black">Quản lý Lớp học 🏫</h2>
          <p className="text-gray-500 text-sm">Quản lý các lớp học vẽ zì đó và phân công giáo viên</p>
        </div>
        <button
          onClick={() => {
            setFormError("");
            setShowAddClassModal(true);
          }}
          className="flex items-center gap-2 bg-[#a8e6cf] hover:bg-[#96d8c0] border-3 border-black rounded-xl px-5 py-3 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer text-sm"
        >
          <Plus className="w-5 h-5 shrink-0" /> Thêm Lớp học
        </button>
      </div>

      {/* Table section */}
      {loadingData ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
          <p className="mt-4 font-bold text-gray-600">Đang tải dữ liệu lớp học...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="border-4 border-dashed border-gray-300 rounded-3xl p-12 text-center bg-gray-50">
          <p className="text-xl font-bold text-gray-400">Chưa có lớp học nào được tạo 🏫</p>
          <p className="text-gray-400 mt-2">Hãy nhấn nút "Thêm Lớp học" để bắt đầu.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-4 border-black">
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Tên lớp học</th>
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Chuyên môn</th>
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Lịch học</th>
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Phòng/Link học</th>
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Giáo viên phụ trách</th>
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Học sinh</th>
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls.id} className="border-b-2 border-gray-200 hover:bg-[#fff9ed] transition-colors">
                  <td className="py-4 px-4 font-bold text-gray-950">
                    {cls.name}
                  </td>
                  <td className="py-4 px-4 text-sm font-bold">
                    {cls.specialties && cls.specialties.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {cls.specialties.map((spec) => (
                          <span key={spec.id} className="bg-[#bae1ff] border-2 border-black rounded-lg px-2 py-0.5 font-bold text-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {spec.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 font-medium">Chưa chọn</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-gray-700">
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      <Calendar className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>{cls.schedule}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-600 text-sm">
                    {cls.room ? (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 shrink-0 text-sky-500" />
                        <span>{cls.room}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Trực tiếp tại trung tâm</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm font-bold">
                    {cls.teacher?.user.name ? (
                      <span className="text-[#6c5b7b]">
                        👩‍🏫 {cls.teacher.user.name}
                      </span>
                    ) : (
                      <span className="text-rose-500 italic">Chưa phân công 🎨</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => {
                          setFormError("");
                          setSelectedClass(cls);
                        }}
                        className="flex items-center justify-center gap-1 bg-sky-100 hover:bg-sky-200 border-2 border-sky-400 rounded-lg px-2.5 py-1 font-bold text-sky-800 transition-all shadow-[2px_2px_0px_0px_rgba(56,189,248,0.4)] cursor-pointer"
                      >
                        <Users className="w-4 h-4 shrink-0" />
                        <span>{cls._count?.students || 0} học sinh</span>
                      </button>
                      <button
                        onClick={() => {
                          setFormError("");
                          setSelectedClassForSessions(cls);
                        }}
                        className="flex items-center justify-center gap-1 bg-amber-100 hover:bg-amber-200 border-2 border-amber-400 rounded-lg px-2.5 py-1 font-bold text-amber-800 transition-all shadow-[2px_2px_0px_0px_rgba(251,191,36,0.4)] cursor-pointer"
                      >
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>Buổi học</span>
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => handleDeleteClass(cls.id, cls.name)}
                      className="p-2 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-black hover:text-black cursor-pointer inline-flex items-center justify-center"
                      title="Xóa lớp học"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: ADD CLASS */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border-4 border-black rounded-[35px_15px_30px_10px/10px_30px_15px_35px] max-w-md w-full p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative">
            <button 
              onClick={() => setShowAddClassModal(false)}
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

              {/* Visual Day Picker */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">📅 Ngày học trong tuần *</label>
                <div className="flex gap-2 flex-wrap">
                  {DAY_OPTIONS.map((day) => {
                    const isSelected = classForm.dayOfWeek === day.value;
                    return (
                      <button
                        type="button"
                        key={day.value}
                        onClick={() => setClassForm({ ...classForm, dayOfWeek: day.value })}
                        className={`w-12 h-12 rounded-xl border-3 font-black text-sm transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ${
                          isSelected
                            ? "bg-amber-300 border-black text-black scale-110"
                            : "bg-white border-black text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 font-semibold mt-1.5">
                  Đã chọn: <span className="text-black font-black">{DAY_OPTIONS.find(d => d.value === classForm.dayOfWeek)?.full}</span>
                </p>
              </div>

              {/* Time Picker */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">⏰ Giờ học *</label>
                <div className="flex items-center gap-3 bg-gray-50 border-3 border-black rounded-xl p-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Bắt đầu</label>
                    <input
                      type="time"
                      required
                      className="w-full border-2 border-black rounded-lg p-2 bg-white text-base font-black text-center"
                      value={classForm.startTime}
                      onChange={(e) => setClassForm({ ...classForm, startTime: e.target.value })}
                    />
                  </div>
                  <span className="text-2xl font-black text-gray-400 pt-4">→</span>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Kết thúc</label>
                    <input
                      type="time"
                      required
                      className="w-full border-2 border-black rounded-lg p-2 bg-white text-base font-black text-center"
                      value={classForm.endTime}
                      onChange={(e) => setClassForm({ ...classForm, endTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Auto Schedule Toggle */}
              <div className="border-3 border-black rounded-2xl bg-[#fff9ed] p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-black text-gray-900 flex items-center gap-1.5 cursor-pointer">
                      🗓️ Tự động lên lịch buổi học
                    </label>
                    <p className="text-[11px] text-gray-500 font-semibold mt-0.5">Tự động tạo các buổi học hàng tuần khi tạo lớp</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setClassForm({ ...classForm, autoSchedule: !classForm.autoSchedule })}
                    className={`relative w-14 h-7 rounded-full border-2 border-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${
                      classForm.autoSchedule ? "bg-emerald-400" : "bg-gray-300"
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white border-2 border-black transition-all ${
                      classForm.autoSchedule ? "left-7" : "left-0.5"
                    }`} />
                  </button>
                </div>

                {classForm.autoSchedule && (
                  <div className="mt-4 grid grid-cols-2 gap-3 animate-in slide-in-from-top duration-200">
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">Bắt đầu từ ngày</label>
                      <input
                        type="date"
                        className="w-full border-2 border-black rounded-lg p-2 bg-white text-sm font-medium"
                        value={classForm.startDate}
                        onChange={(e) => setClassForm({ ...classForm, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">Số tuần học</label>
                      <input
                        type="number"
                        min={1}
                        max={52}
                        className="w-full border-2 border-black rounded-lg p-2 bg-white text-sm font-medium"
                        value={classForm.weeksCount}
                        onChange={(e) => setClassForm({ ...classForm, weeksCount: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2 text-xs text-gray-500 font-semibold bg-white border-2 border-black/10 rounded-lg p-2">
                      💡 Sẽ tự động tạo <span className="font-black text-black">{classForm.weeksCount || 0} buổi học</span> vào các ngày <span className="font-black text-black">{DAY_OPTIONS.find(d => d.value === classForm.dayOfWeek)?.full}</span> hàng tuần, từ <span className="font-black text-black">{classForm.startTime}</span> đến <span className="font-black text-black">{classForm.endTime}</span>.
                    </div>
                  </div>
                )}
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
                <label className="block text-sm font-bold text-gray-800 mb-1">Giáo viên phụ trách</label>
                <CustomSelect
                  value={classForm.teacherId}
                  onChange={(val) => setClassForm({ ...classForm, teacherId: val })}
                  placeholder="-- Chọn giáo viên phụ trách (Nếu có) --"
                  options={[
                    { value: "", label: "-- Chọn giáo viên phụ trách (Nếu có) --" },
                    ...[...teachers]
                      .sort((a, b) => {
                        const aMatch = hasOverlap(a) ? 1 : 0;
                        const bMatch = hasOverlap(b) ? 1 : 0;
                        return bMatch - aMatch;
                      })
                      .map((t) => {
                        const isMatch = hasOverlap(t);
                        const matchCount = getOverlapCount(t);
                        const specNames = t.specialties.map((s) => s.name).join(", ");
                        return {
                          value: t.id,
                          label: `${isMatch ? `✨ [Gợi ý: Trùng ${matchCount} chuyên môn] ` : ""}${t.user.name || t.user.username} ${specNames ? `(${specNames})` : ""}`
                        };
                      })
                  ]}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
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
                  Lưu lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STUDENT ROSTER */}
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

      {/* MODAL: CLASS SESSIONS */}
      {selectedClassForSessions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border-4 border-black rounded-[35px_15px_30px_10px/10px_30px_15px_35px] max-w-5xl w-full p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative my-8">
            <button 
              onClick={() => {
                setSelectedClassForSessions(null);
                setShowSingleSessionForm(false);
                setShowRecurringForm(false);
              }}
              className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-sm bg-amber-100 border-2 border-black rounded-lg px-2.5 py-0.5 font-bold text-amber-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase">
                Lớp học: {selectedClassForSessions.name}
              </span>
              <h3 className="text-2xl font-black text-black mt-2 flex items-center gap-2">
                📅 Quản lý Lịch học & Buổi học ({sessions.length})
              </h3>
              <p className="text-gray-500 text-sm mt-1">Lịch học gốc: {selectedClassForSessions.schedule || "Chưa thiết lập"} | Giáo viên mặc định: {selectedClassForSessions.teacher?.user?.name || "Chưa phân công"}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Sessions List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center border-b-2 border-black pb-1">
                  <h4 className="font-extrabold text-lg text-black">Danh sách các buổi học</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setFormError("");
                        setShowRecurringForm(false);
                        setShowSingleSessionForm(!showSingleSessionForm);
                        setSingleSessionForm({
                          date: "",
                          startTime: "",
                          endTime: "",
                          teacherId: selectedClassForSessions.teacherId || "",
                          room: selectedClassForSessions.room || "",
                          isMakeup: false,
                          description: ""
                        });
                      }}
                      className="bg-[#bae1ff] hover:bg-[#a2d4fc] border-2 border-black rounded-lg px-2.5 py-1 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                    >
                      + Thêm buổi lẻ / Học bù
                    </button>
                    <button
                      onClick={() => {
                        setFormError("");
                        setShowSingleSessionForm(false);
                        setShowRecurringForm(!showRecurringForm);
                        setRecurringForm({
                          dayOfWeek: 1,
                          startTime: "",
                          endTime: "",
                          startDate: "",
                          endDate: "",
                          teacherId: selectedClassForSessions.teacherId || "",
                          room: selectedClassForSessions.room || ""
                        });
                      }}
                      className="bg-[#baffc9] hover:bg-[#a3e9b3] border-2 border-black rounded-lg px-2.5 py-1 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                    >
                      + Lập lịch hàng tuần
                    </button>
                  </div>
                </div>
                
                {loadingSessions ? (
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
                        statusText = "Đã hoàn thành";
                      } else if (session.status === "CANCELLED") {
                        statusBg = "bg-rose-100 text-rose-800 border-rose-300";
                        statusText = "Đã hủy";
                      }

                      return (
                        <div key={session.id} className="border-2 border-black bg-white rounded-xl p-3 flex justify-between items-start gap-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-gray-900 text-base">{formattedDate}</span>
                              <span className="bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5 font-bold text-amber-800 text-xs">
                                ⏰ {session.startTime} - {session.endTime}
                              </span>
                              {session.isMakeup && (
                                <span className="bg-purple-100 border border-purple-300 rounded px-1.5 py-0.5 font-bold text-purple-800 text-xs shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                                  Học bù 🔄
                                </span>
                              )}
                              <span className={`border rounded px-1.5 py-0.5 font-bold text-xs ${statusBg}`}>
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

                          <div className="flex flex-col sm:flex-row gap-1 shrink-0">
                            {session.status !== "COMPLETED" && (
                              <button
                                onClick={() => handleUpdateSessionStatus(session.id, "COMPLETED")}
                                className="bg-emerald-100 hover:bg-emerald-200 border border-emerald-400 text-emerald-800 rounded px-2 py-1 text-xs font-bold transition-all cursor-pointer"
                                title="Đánh dấu đã hoàn thành"
                              >
                                ✓ Đã học
                              </button>
                            )}
                            {session.status !== "CANCELLED" && (
                              <button
                                onClick={() => handleUpdateSessionStatus(session.id, "CANCELLED")}
                                className="bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 rounded px-2 py-1 text-xs font-bold transition-all cursor-pointer"
                                title="Hủy buổi học này"
                              >
                                ✕ Hủy buổi
                              </button>
                            )}
                            {session.status !== "SCHEDULED" && (
                              <button
                                onClick={() => handleUpdateSessionStatus(session.id, "SCHEDULED")}
                                className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs font-bold transition-all cursor-pointer"
                                title="Đặt lại về chưa học"
                              >
                                ↺ Lên lịch
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteSession(session.id)}
                              className="p-1 bg-red-100 hover:bg-red-200 border border-red-400 rounded transition-all text-red-700 cursor-pointer inline-flex items-center justify-center"
                              title="Xóa buổi học"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Forms Panel */}
              <div className="space-y-4">
                {/* Single / Makeup Session Form */}
                {showSingleSessionForm && (
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

                    {formError && (
                      <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-lg p-2 mb-3 font-bold text-xs">
                        {formError}
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
                            placeholder="e.g. 08:00"
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
                            placeholder="e.g. 10:00"
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
                              label: `${t.user.name || t.user.username} (${t.specialties.map(s => s.name).join(", ")})`
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
                        className="w-full bg-[#bae1ff] hover:bg-[#a2d4fc] border-2 border-black rounded-lg py-2 font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Lưu buổi học
                      </button>
                    </form>
                  </div>
                )}

                {/* Recurring Generation Form */}
                {showRecurringForm && (
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

                    {formError && (
                      <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-lg p-2 mb-3 font-bold text-xs">
                        {formError}
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
                              label: `${t.user.name || t.user.username} (${t.specialties.map(s => s.name).join(", ")})`
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
                        className="w-full bg-[#baffc9] hover:bg-[#a3e9b3] border-2 border-black rounded-lg py-2 font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Tạo lịch hàng loạt
                      </button>
                    </form>
                  </div>
                )}

                {/* Info guide card */}
                {!showSingleSessionForm && !showRecurringForm && (
                  <div className="border-3 border-black bg-[#fafafa] rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xs text-gray-600 font-semibold space-y-2">
                    <h5 className="font-black text-sm text-gray-900">💡 Mẹo quản lý lịch:</h5>
                    <p>• Sử dụng nút <strong className="text-[#6c5b7b]">Thêm buổi lẻ / Học bù</strong> để thiết lập các buổi học bù phát sinh cho lớp.</p>
                    <p>• Sử dụng nút <strong className="text-emerald-600">Lập lịch hàng tuần</strong> để lên lịch hàng loạt (ví dụ: tạo 12 buổi học vào các ngày thứ 7 hàng tuần).</p>
                    <p>• Trạng thái buổi học sẽ trực tiếp cập nhật lên thời khóa biểu và dùng để thống kê buổi dạy của giáo viên.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 border-t-2 border-black/10 pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedClassForSessions(null);
                  setShowSingleSessionForm(false);
                  setShowRecurringForm(false);
                }}
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
