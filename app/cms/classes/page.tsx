"use client";

import { useEffect, useState } from "react";
import { cmsApi } from "@/lib/api-client";
import { ClassWithTeachersAndCount, TeacherWithUserAndClasses, AuthSession } from "@/lib/types/api";
import { Specialty } from "@/lib/generated/prisma/client";
import { Plus, Edit, Trash2, Calendar, MapPin, Users, Loader2 } from "lucide-react";
import { AddClassModal } from "@/app/cms/components/modals/AddClassModal";
import { EditClassModal } from "@/app/cms/components/modals/EditClassModal";
import { StudentRosterModal } from "@/app/cms/components/modals/StudentRosterModal";
import { ClassSessionsModal } from "@/app/cms/components/modals/ClassSessionsModal";
import { StudentAttendanceModal } from "@/app/cms/components/modals/StudentAttendanceModal";
import { NotificationModal } from "@/app/cms/components/modals/NotificationModal";

export default function ClassesPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Data lists
  const [classes, setClasses] = useState<ClassWithTeachersAndCount[]>([]);
  const [teachers, setTeachers] = useState<TeacherWithUserAndClasses[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modals & selected state
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [classToEdit, setClassToEdit] = useState<ClassWithTeachersAndCount | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassWithTeachersAndCount | null>(null);
  const [selectedClassForSessions, setSelectedClassForSessions] = useState<ClassWithTeachersAndCount | null>(null);
  const [selectedSessionForAttendance, setSelectedSessionForAttendance] = useState<any | null>(null);

  // Notification State
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

      const coursesData = await cmsApi.courses.list();
      setCourses(coursesData.courses || []);
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

  // Delete Class Handler
  const handleDeleteClass = async (id: string, name: string) => {
    showNotification(
      "Xác nhận xóa lớp học",
      `Bạn có chắc chắn muốn xóa lớp học "${name}"?`,
      "confirm",
      undefined,
      async () => {
        try {
          await cmsApi.classes.delete(id);
          fetchAllData();
        } catch (err: any) {
          showNotification("Lỗi xóa lớp học", err.message || "Không thể xóa lớp học", "error");
        }
      }
    );
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
                    <div className="flex flex-col">
                      <span>{cls.name}</span>
                      {(cls as any).course && (
                        <span className="text-[10px] text-amber-600 font-extrabold mt-0.5 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 w-fit">
                          📖 {(cls as any).course.title}
                        </span>
                      )}
                    </div>
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
                    {cls.teachers && cls.teachers.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {cls.teachers.map((t) => (
                          <span key={t.id} className="bg-[#e8d7ff] border-2 border-black rounded-lg px-2 py-0.5 font-bold text-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1">
                            👩‍🏫 {t.user.name || "Giáo viên"}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-rose-500 italic">Chưa phân công 🎨</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => {
                          setSelectedClass(cls);
                        }}
                        className="flex items-center justify-center gap-1 bg-sky-100 hover:bg-sky-200 border-2 border-sky-400 rounded-lg px-2.5 py-1 font-bold text-sky-800 transition-all shadow-[2px_2px_0px_0px_rgba(56,189,248,0.4)] cursor-pointer"
                      >
                        <Users className="w-4 h-4 shrink-0" />
                        <span>{cls._count?.students || 0} học sinh</span>
                      </button>
                      <button
                        onClick={() => {
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
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => {
                          setClassToEdit(cls);
                          setShowEditClassModal(true);
                        }}
                        className="p-2 bg-[#bae1ff] hover:bg-[#a2d4fc] border-2 border-black rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-black hover:text-black cursor-pointer inline-flex items-center justify-center"
                        title="Sửa lớp học"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(cls.id, cls.name)}
                        className="p-2 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-black hover:text-black cursor-pointer inline-flex items-center justify-center"
                        title="Xóa lớp học"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: ADD CLASS */}
      <AddClassModal
        isOpen={showAddClassModal}
        onClose={() => setShowAddClassModal(false)}
        teachers={teachers}
        specialties={specialties}
        courses={courses}
        onSuccess={fetchAllData}
      />

      {/* MODAL: EDIT CLASS */}
      <EditClassModal
        isOpen={showEditClassModal}
        onClose={() => {
          setShowEditClassModal(false);
          setClassToEdit(null);
        }}
        classData={classToEdit}
        teachers={teachers}
        specialties={specialties}
        courses={courses}
        onSuccess={fetchAllData}
      />

      {/* MODAL: STUDENT ROSTER */}
      <StudentRosterModal
        isOpen={selectedClass !== null}
        onClose={() => setSelectedClass(null)}
        selectedClass={selectedClass}
        onRosterChange={fetchAllData}
      />

      {/* MODAL: CLASS SESSIONS */}
      <ClassSessionsModal
        isOpen={selectedClassForSessions !== null}
        onClose={() => setSelectedClassForSessions(null)}
        selectedClass={selectedClassForSessions}
        teachers={teachers}
        mode="ADMIN"
        onTakeAttendance={(session) => setSelectedSessionForAttendance(session)}
      />

      {/* MODAL: STUDENT ATTENDANCE */}
      <StudentAttendanceModal
        isOpen={selectedSessionForAttendance !== null}
        onClose={() => setSelectedSessionForAttendance(null)}
        session={selectedSessionForAttendance}
        onSaveSuccess={fetchAllData}
      />

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
    </div>
  );
}
