"use client";

import { useEffect, useState, useMemo } from "react";
import { CustomPagination } from "../components/ui/custom-pagination";
import { cmsApi } from "@/lib/api-client";
import { AuthSession } from "@/lib/types/api";
import { 
  Search, Loader2, Users, Calendar, ArrowLeft, Plus, Edit, Trash2
} from "lucide-react";
import { ManageStudentModal } from "../components/modals/ManageStudentModal";
import { NotificationModal } from "../components/modals/NotificationModal";
import { PaymentModal } from "../components/modals/PaymentModal";
import { StudentClassesPaymentModal } from "../components/modals/StudentClassesPaymentModal";

interface Student {
  id: string;
  studentCode: string | null;
  studentName: string;
  studentAge: number | null;
  parentName: string | null;
  parentPhone: string | null;
  classId?: string | null;
  class?: any;
  enrollments?: any[];
  createdAt: string;
}

export default function StudentsPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "unpaid" | "paid">("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, paymentFilter]);
  
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Student | null>(null);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<any | null>(null);
  const [selectedStudentForClassesPayment, setSelectedStudentForClassesPayment] = useState<Student | null>(null);
  
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info" | "confirm";
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
    onConfirm?: () => void
  ) => {
    setNotification({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
    });
  };

  // Filter students based on search query and payment filter
  const filteredStudents = students.filter((s) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = (
      s.studentName.toLowerCase().includes(term) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(term)) ||
      (s.parentPhone && s.parentPhone.includes(term)) ||
      (s.parentName && s.parentName.toLowerCase().includes(term))
    );

    if (!matchesSearch) return false;

    if (paymentFilter === "unpaid") {
      // Check if at least one enrollment is unpaid
      return s.enrollments?.some((e: any) => !e.isPaid);
    } else if (paymentFilter === "paid") {
      // Check if all enrollments are paid
      return s.enrollments?.every((e: any) => e.isPaid);
    }

    return true;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredStudents, currentPage]);

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
      
      // If we are currently showing details of a student in the payment classes popup,
      // refresh that student object in state as well.
      if (selectedStudentForClassesPayment) {
        const updatedStudent = data.students.find((s: Student) => s.id === selectedStudentForClassesPayment.id);
        if (updatedStudent) {
          setSelectedStudentForClassesPayment(updatedStudent);
        }
      }
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

  const handleDeleteStudent = (id: string, name: string) => {
    showNotification(
      "Xác nhận xóa học sinh",
      `Bạn có chắc chắn muốn xóa học sinh "${name}" khỏi hệ thống?`,
      "confirm",
      async () => {
        try {
          await cmsApi.students.delete(id);
          fetchStudents();
          showNotification("Thành công", "Đã xóa học sinh thành công", "success");
        } catch (err: any) {
          showNotification("Thất bại", err.message || "Không thể xóa học sinh", "error");
        }
      }
    );
  };

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
        <button
          onClick={() => {
            setSelectedStudentForEdit(null);
            setIsManageModalOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-[#a8e6cf] hover:bg-[#96d8c0] text-black font-black text-sm px-4 py-2 border-3 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Thêm học sinh
        </button>
      </div>

      {/* Search and Filters Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, mã HS, hoặc số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-3 border-black rounded-xl p-3 pl-11 bg-white text-sm font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-[3px_3px_0px_rgba(0,0,0,0.15)]"
          />
          <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-gray-400" />
        </div>

        {/* Payment Filter Tabs */}
        <div className="flex border-3 border-black rounded-xl overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-white shrink-0">
          <button
            onClick={() => setPaymentFilter("all")}
            className={`px-4 py-2 text-xs font-black transition-colors ${
              paymentFilter === "all" ? "bg-[#ffd275] text-black border-r-3 border-black" : "bg-white text-gray-700 border-r-3 border-black hover:bg-amber-50"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setPaymentFilter("unpaid")}
            className={`px-4 py-2 text-xs font-black transition-colors ${
              paymentFilter === "unpaid" ? "bg-[#ffaaa6] text-black border-r-3 border-black" : "bg-white text-gray-700 border-r-3 border-black hover:bg-rose-50"
            }`}
          >
            Chưa đóng học phí
          </button>
          <button
            onClick={() => setPaymentFilter("paid")}
            className={`px-4 py-2 text-xs font-black transition-colors ${
              paymentFilter === "paid" ? "bg-[#a8e6cf] text-black" : "bg-white text-gray-700 hover:bg-emerald-50"
            }`}
          >
            Đã đóng học phí
          </button>
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
          <p className="text-gray-400 mt-2">Thử điều chỉnh từ khóa tìm kiếm của bạn hoặc thêm mới học sinh.</p>
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
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Lớp học & Học phí</th>
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Ngày đăng ký</th>
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map((student) => {
                const enrollmentsCount = student.enrollments?.length || 0;
                const hasUnpaid = enrollmentsCount > 0 && student.enrollments?.some((e: any) => !e.isPaid);
                const unpaidCount = student.enrollments?.filter((e: any) => !e.isPaid).length || 0;
                
                return (
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
                      {student.studentAge ? (
                        <span className="bg-amber-100 border-2 border-black rounded-lg px-2 py-0.5 font-bold text-amber-800 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
                          {student.studentAge} tuổi
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">N/A</span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-bold text-gray-700">
                      {student.parentName || <span className="text-gray-400 font-normal italic">Chưa nhập</span>}
                    </td>
                    <td className="py-4 px-4 font-bold text-gray-900">
                      {student.parentPhone || <span className="text-gray-400 font-normal italic">Chưa nhập</span>}
                    </td>
                    <td className="py-4 px-4">
                      {enrollmentsCount === 0 ? (
                        <span className="inline-flex items-center gap-1.5 border-2 border-black rounded-lg px-2.5 py-1 text-xs font-black bg-stone-100 text-stone-500 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
                          Chưa xếp lớp
                        </span>
                      ) : (
                        <button
                          onClick={() => setSelectedStudentForClassesPayment(student)}
                          className={`inline-flex items-center gap-1.5 border-2 border-black rounded-lg px-3 py-1.5 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer ${
                            hasUnpaid 
                              ? "bg-[#ffaaa6] hover:bg-[#ff8b94] text-rose-950" 
                              : "bg-[#a8e6cf] hover:bg-[#96d8c0] text-emerald-950"
                          }`}
                        >
                          {hasUnpaid ? (
                            <span>⚠️ Chưa đóng ({unpaidCount})</span>
                          ) : (
                            <span>✓ Đã đóng đủ</span>
                          )}
                        </button>
                      )}
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
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedStudentForEdit(student);
                            setIsManageModalOpen(true);
                          }}
                          className="bg-[#bae1ff] hover:bg-[#a6d4ff] border-2 border-black rounded-lg p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none cursor-pointer"
                          title="Sửa thông tin"
                        >
                          <Edit className="w-4 h-4 text-black" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.id, student.studentName)}
                          className="bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-lg p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none cursor-pointer"
                          title="Xóa học sinh"
                        >
                          <Trash2 className="w-4 h-4 text-black" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <ManageStudentModal
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
          setSelectedStudentForEdit(null);
        }}
        student={selectedStudentForEdit}
        onSuccess={fetchStudents}
      />

      <StudentClassesPaymentModal
        isOpen={selectedStudentForClassesPayment !== null}
        onClose={() => setSelectedStudentForClassesPayment(null)}
        student={selectedStudentForClassesPayment}
        userRole={user?.role}
        onOpenPayment={(enrollment) => {
          setSelectedStudentForPayment(enrollment);
        }}
        onNotification={(title, msg, type) => {
          showNotification(title, msg, type);
        }}
      />

      <PaymentModal
        isOpen={selectedStudentForPayment !== null}
        onClose={() => setSelectedStudentForPayment(null)}
        student={selectedStudentForPayment}
        onSuccess={fetchStudents}
      />

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onConfirm={notification.onConfirm}
      />
    </div>
  );
}
