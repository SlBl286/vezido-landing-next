"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cmsApi } from "@/lib/api-client";
import { AuthSession } from "@/lib/types/api";
import { 
  Plus, Users, BookOpen, Award, CheckSquare, ChevronRight, Loader2
} from "lucide-react";

export default function CMSDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  
  // Data counts
  const [stats, setStats] = useState({
    classesCount: 0,
    teachersCount: 0,
    studentsCount: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch session on load
  useEffect(() => {
    async function getSession() {
      try {
        const data = await cmsApi.auth.getSession();
        setSession(data);
      } catch (err) {
        console.error("Failed to load session", err);
      } finally {
        setLoadingSession(false);
      }
    }
    getSession();
  }, []);

  // Fetch statistics based on user role
  useEffect(() => {
    async function fetchStats() {
      if (!session || !session.user) return;
      setLoadingStats(true);
      try {
        const role = session.user.role;
        let classesCount = 0;
        let teachersCount = 0;
        let studentsCount = 0;

        if (role === "ADMIN") {
          // Fetch teachers count
          const teachersData = await cmsApi.teachers.list();
          teachersCount = teachersData.teachers.length;

          // Fetch classes and calculate student count
          const classesData = await cmsApi.classes.list();
          classesCount = classesData.classes.length;
          studentsCount = classesData.classes.reduce((sum, c) => sum + (c._count?.students || 0), 0);
        } else if (role === "TEACHER") {
          // Fetch teacher classes and calculate student count
          const classesData = await cmsApi.classes.listForTeacher();
          classesCount = classesData.classes.length;
          studentsCount = classesData.classes.reduce((sum, c) => sum + (c._count?.students || 0), 0);
        }

        setStats({ classesCount, teachersCount, studentsCount });
      } catch (err) {
        console.error("Failed to load stats:", err);
      } finally {
        setLoadingStats(false);
      }
    }

    if (!loadingSession && session) {
      fetchStats();
    }
  }, [loadingSession, session]);

  if (loadingSession) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
        <p className="mt-4 font-bold text-gray-600">Đang tải trang tổng quan...</p>
      </div>
    );
  }

  const user = session?.user;
  if (!user) return null;

  const role = user.role;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Welcome Card */}
      <div className="border-4 border-black bg-[#ffffba] rounded-[30px_10px_25px_15px/15px_25px_10px_30px] p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="absolute right-4 bottom-0 opacity-10 select-none">
          <span className="text-9xl">🎨</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
          Chào mừng trở lại, {user.name || user.username}! ✨
        </h2>
        <p className="text-gray-800 font-bold max-w-2xl leading-relaxed">
          Hôm nay bạn muốn vẽ nên những điều tuyệt vời gì? Hãy dùng thanh điều hướng bên trái để quản lý các chức năng tương ứng nhé!
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {role === "ADMIN" ? (
            <>
              <button
                onClick={() => router.push("/cms/teachers")}
                className="bg-white hover:bg-gray-50 border-3 border-black rounded-xl px-4 py-2.5 font-black text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                Quản lý Giáo viên <ChevronRight className="w-4 h-4 text-emerald-500" />
              </button>
              <button
                onClick={() => router.push("/cms/classes")}
                className="bg-white hover:bg-gray-50 border-3 border-black rounded-xl px-4 py-2.5 font-black text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                Quản lý Lớp học <ChevronRight className="w-4 h-4 text-sky-500" />
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push("/cms/my-classes")}
              className="bg-white hover:bg-gray-50 border-3 border-black rounded-xl px-4 py-2.5 font-black text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              Xem lớp học của tôi <ChevronRight className="w-4 h-4 text-amber-500" />
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {loadingStats ? (
        <div className="py-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="mt-2 text-sm text-gray-500 font-bold">Đang tính toán sĩ số...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="border-4 border-black bg-[#bae1ff] rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
            <div>
              <p className="text-gray-800 font-extrabold uppercase text-xs tracking-wider">Tổng Lớp học</p>
              <h3 className="text-4xl font-black text-black mt-1">{stats.classesCount}</h3>
            </div>
            <BookOpen className="w-12 h-12 text-black/20" />
          </div>

          {role === "ADMIN" ? (
            <div className="border-4 border-black bg-[#ffffba] rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
              <div>
                <p className="text-gray-800 font-extrabold uppercase text-xs tracking-wider">Tổng Giáo viên</p>
                <h3 className="text-4xl font-black text-black mt-1">{stats.teachersCount}</h3>
              </div>
              <Award className="w-12 h-12 text-black/20" />
            </div>
          ) : (
            <div className="border-4 border-black bg-[#ffffba] rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
              <div>
                <p className="text-gray-800 font-extrabold uppercase text-xs tracking-wider">Vai Trò</p>
                <h3 className="text-2xl font-black text-black mt-2">Giáo Viên 👩‍🏫</h3>
              </div>
              <Award className="w-12 h-12 text-black/20" />
            </div>
          )}

          <div className="border-4 border-black bg-[#baffc9] rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
            <div>
              <p className="text-gray-800 font-extrabold uppercase text-xs tracking-wider">Tổng Học sinh</p>
              <h3 className="text-4xl font-black text-black mt-1">{stats.studentsCount}</h3>
            </div>
            <Users className="w-12 h-12 text-black/20" />
          </div>
        </div>
      )}

      {/* Recommended tasks list */}
      <div className="border-4 border-black bg-white rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-lg font-black text-black mb-4 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-amber-500" /> Hướng dẫn công việc hôm nay
        </h3>
        <ul className="space-y-3 font-medium text-sm text-gray-700">
          <li className="flex items-start gap-2.5">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>Kiểm tra danh sách lớp học và sĩ số các học viên.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>Phân công các giáo viên phụ trách cho lớp vẽ mới (dành cho Admin).</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>Kiểm tra giáo án vẽ và chuẩn bị họa cụ dạy học đầy đủ trước buổi học.</span>
          </li>
        </ul>
      </div>

    </div>
  );
}
