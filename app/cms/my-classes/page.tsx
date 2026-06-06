"use client";

import { useEffect, useState } from "react";
import { cmsApi } from "@/lib/api-client";
import { ClassWithTeachersAndCount, AuthSession } from "@/lib/types/api";
import { Calendar, MapPin, Users, Loader2 } from "lucide-react";
import { StudentRosterModal } from "@/app/cms/components/modals/StudentRosterModal";
import { ClassSessionsModal } from "@/app/cms/components/modals/ClassSessionsModal";
import { StudentAttendanceModal } from "@/app/cms/components/modals/StudentAttendanceModal";

export default function MyClassesPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Data lists
  const [classes, setClasses] = useState<ClassWithTeachersAndCount[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modals & selected states
  const [selectedClass, setSelectedClass] = useState<ClassWithTeachersAndCount | null>(null);
  const [selectedClassForSessions, setSelectedClassForSessions] = useState<ClassWithTeachersAndCount | null>(null);
  const [selectedSessionForAttendance, setSelectedSessionForAttendance] = useState<any | null>(null);

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

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedClass(cls);
                  }}
                  className="flex items-center gap-2 bg-[#ffd275] hover:bg-[#ffc342] border-3 border-black rounded-xl px-4 py-2 text-sm font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  <Users className="w-4 h-4 shrink-0" /> Học sinh
                </button>
                <button
                  onClick={() => {
                    setSelectedClassForSessions(cls);
                  }}
                  className="flex items-center gap-2 bg-amber-100 hover:bg-amber-200 border-3 border-amber-400 rounded-xl px-4 py-2 text-sm font-black shadow-[3px_3px_0px_0px_rgba(251,191,36,0.4)] transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4 shrink-0 text-amber-600" /> Buổi học
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: STUDENT ROSTER (TEACHER VIEW) */}
      <StudentRosterModal
        isOpen={selectedClass !== null}
        onClose={() => setSelectedClass(null)}
        selectedClass={selectedClass}
        onRosterChange={fetchTeacherClasses}
      />

      {/* MODAL: CLASS SESSIONS (TEACHER VIEW) */}
      <ClassSessionsModal
        isOpen={selectedClassForSessions !== null}
        onClose={() => setSelectedClassForSessions(null)}
        selectedClass={selectedClassForSessions}
        teachers={[]} // Teachers list not needed for teacher mode (no form inputs)
        mode="TEACHER"
        onTakeAttendance={(session) => setSelectedSessionForAttendance(session)}
      />

      {/* MODAL: STUDENT ATTENDANCE (TEACHER VIEW) */}
      <StudentAttendanceModal
        isOpen={selectedSessionForAttendance !== null}
        onClose={() => setSelectedSessionForAttendance(null)}
        session={selectedSessionForAttendance}
        onSaveSuccess={fetchTeacherClasses}
      />

    </div>
  );
}
