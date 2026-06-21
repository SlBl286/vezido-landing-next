"use client";

import { useEffect, useState } from "react";
import { cmsApi } from "@/lib/api-client";
import { AuthSession } from "@/lib/types/api";
import { 
  Search, Loader2, Users, Calendar, ArrowLeft
} from "lucide-react";

interface Student {
  id: string;
  studentCode: string | null;
  studentName: string;
  studentAge: number;
  parentName: string;
  parentPhone: string;
  createdAt: string;
}

export default function StudentsPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const data = await cmsApi.students.listAllUnique();
      setStudents(data.students || []);
    } catch (err) {
      console.error("Failed to load unique students:", err);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (!loadingSession && session) {
      fetchStudents();
    }
  }, [loadingSession, session]);

  if (loadingSession) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
        <p className="mt-4 font-bold text-gray-600">Đang tải trang học viên...</p>
      </div>
    );
  }

  const user = session?.user;
  // Block ASSISTANT and guest users
  if (!user || user.role === "ASSISTANT") {
    return (
      <div className="border-4 border-black bg-white rounded-3xl p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto my-12">
        <span className="text-6xl mb-4 block">🚫</span>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h1>
        <p className="text-gray-600">Trang này chỉ dành riêng cho Quản trị viên và Giáo viên.</p>
      </div>
    );
  }

  // Filter students based on search query
  const filteredStudents = students.filter((s) => {
    const term = searchQuery.toLowerCase();
    return (
      s.studentName.toLowerCase().includes(term) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(term)) ||
      s.parentPhone.includes(term) ||
      s.parentName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="border-4 border-black bg-white rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-200">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-black flex items-center gap-2">
            🎒 Danh sách Học sinh ({students.length})
          </h2>
          <p className="text-gray-500 text-sm mt-1">Danh sách tất cả các học sinh đã có mã định danh trên hệ thống</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, mã HS, hoặc số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-3 border-black rounded-xl p-3 pl-11 bg-white text-sm font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-[3px_3px_0px_rgba(0,0,0,0.15)]"
          />
          <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-gray-400" />
        </div>
      </div>

      {/* Roster / Directory view */}
      {loadingStudents ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
          <p className="mt-4 font-bold text-gray-600">Đang tải danh sách...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="border-4 border-dashed border-gray-300 rounded-3xl p-12 text-center bg-gray-50">
          <p className="text-xl font-bold text-gray-400">Không tìm thấy học sinh nào 🎒</p>
          <p className="text-gray-400 mt-2">Thử điều chỉnh từ khóa tìm kiếm của bạn.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-4 border-black">
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Mã học sinh</th>
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Tên học sinh</th>
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm text-center">Tuổi</th>
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Phụ huynh</th>
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Số điện thoại</th>
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Ngày đăng ký</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b-2 border-gray-200 hover:bg-[#fff9ed] transition-colors">
                  <td className="py-4 px-4 font-black">
                    {student.studentCode ? (
                      <span className="bg-purple-100 border-2 border-black rounded-lg px-2.5 py-1 text-purple-800 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
                        {student.studentCode}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Chưa có mã</span>
                    )}
                  </td>
                  <td className="py-4 px-4 font-bold text-gray-950 text-base">
                    {student.studentName}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="bg-amber-100 border-2 border-black rounded-lg px-2 py-0.5 font-bold text-amber-800 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
                      {student.studentAge} tuổi
                    </span>
                  </td>
                  <td className="py-4 px-4 font-bold text-gray-700">
                    {student.parentName}
                  </td>
                  <td className="py-4 px-4 font-bold text-gray-900">
                    {student.parentPhone}
                  </td>
                  <td className="py-4 px-4 text-gray-500 font-semibold text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>
                        {new Date(student.createdAt).toLocaleDateString("vi-VN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
