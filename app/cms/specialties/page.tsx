"use client";

import { useEffect, useState } from "react";
import { cmsApi } from "@/lib/api-client";
import { AuthSession } from "@/lib/types/api";
import { Plus, Trash2, BookOpen, Users, X, Loader2, Award } from "lucide-react";
import { NotificationModal } from "@/app/cms/components/modals/NotificationModal";

interface SpecialtyWithCounts {
  id: string;
  name: string;
  _count: {
    teachers: number;
    classes: number;
  };
}

export default function SpecialtiesPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Specialties list
  const [specialties, setSpecialties] = useState<SpecialtyWithCounts[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modals & form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [specialtyName, setSpecialtyName] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  // Fetch specialties data
  const fetchSpecialties = async () => {
    setLoadingData(true);
    try {
      const data = await cmsApi.specialties.list();
      setSpecialties(data.specialties as SpecialtyWithCounts[] || []);
    } catch (err) {
      console.error("Failed to load specialties:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!loadingSession && session && session.user?.role === "ADMIN") {
      fetchSpecialties();
    }
  }, [loadingSession, session]);

  // Handle Add Specialty
  const handleAddSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    if (!specialtyName.trim()) {
      setFormError("Vui lòng nhập tên chuyên môn");
      setSubmitting(false);
      return;
    }

    try {
      await cmsApi.specialties.create({ name: specialtyName });
      setShowAddModal(false);
      setSpecialtyName("");
      fetchSpecialties();
    } catch (err: any) {
      setFormError(err.message || "Có lỗi xảy ra khi tạo chuyên môn");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Specialty
  const handleDeleteSpecialty = async (id: string, name: string, teachersCount: number, classesCount: number) => {
    let confirmMsg = `Bạn có chắc chắn muốn xóa chuyên môn "${name}"?`;
    if (teachersCount > 0 || classesCount > 0) {
      confirmMsg += `\n⚠️ CẢNH BÁO: Chuyên môn này đang được gán cho ${teachersCount} giáo viên và ${classesCount} lớp học. Khi xóa, liên kết chuyên môn của các giáo viên và lớp này sẽ bị gỡ bỏ!`;
    }

    showNotification(
      "Xác nhận xóa chuyên môn",
      confirmMsg,
      "confirm",
      undefined,
      async () => {
        try {
          await cmsApi.specialties.delete(id);
          fetchSpecialties();
        } catch (err: any) {
          showNotification("Lỗi xóa chuyên môn", err.message || "Không thể xóa chuyên môn", "error");
        }
      }
    );
  };

  if (loadingSession) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
        <p className="mt-4 font-bold text-gray-600">Đang tải trang chuyên môn...</p>
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
          <h2 className="text-2xl font-black text-black">Quản lý Chuyên môn 🎨</h2>
          <p className="text-gray-500 text-sm">Quản lý danh mục các bộ môn vẽ và theo dõi thống kê gán lớp/giáo viên</p>
        </div>
        <button
          onClick={() => {
            setFormError("");
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-[#a8e6cf] hover:bg-[#96d8c0] border-3 border-black rounded-xl px-5 py-3 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer text-sm"
        >
          <Plus className="w-5 h-5 shrink-0" /> Thêm Chuyên môn
        </button>
      </div>

      {/* Specialties List */}
      {loadingData ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
          <p className="mt-4 font-bold text-gray-600">Đang tải dữ liệu chuyên môn...</p>
        </div>
      ) : specialties.length === 0 ? (
        <div className="border-4 border-dashed border-gray-300 rounded-3xl p-12 text-center bg-gray-50">
          <p className="text-xl font-bold text-gray-400">Chưa có chuyên môn nào được tạo 🎨</p>
          <p className="text-gray-400 mt-2">Hãy nhấn nút "Thêm Chuyên môn" để bắt đầu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialties.map((spec) => (
            <div 
              key={spec.id} 
              className="border-4 border-black bg-white rounded-[25px_10px_20px_10px/10px_20px_10px_25px] p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:scale-[1.02] transition-transform"
            >
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  🎨 {spec.name}
                </h3>
                
                <hr className="my-3 border-t-2 border-black/10 border-dashed" />
                
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <Award className="w-4 h-4 text-amber-500" /> Giáo viên:
                    </span>
                    <span className="bg-amber-100 border border-amber-300 rounded px-2 py-0.5 text-amber-800 text-xs">
                      {spec._count.teachers} người
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <BookOpen className="w-4 h-4 text-sky-500" /> Lớp học:
                    </span>
                    <span className="bg-sky-100 border border-sky-300 rounded px-2 py-0.5 text-sky-800 text-xs">
                      {spec._count.classes} lớp
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => handleDeleteSpecialty(spec.id, spec.name, spec._count.teachers, spec._count.classes)}
                  className="p-2 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-black cursor-pointer inline-flex items-center justify-center"
                  title="Xóa chuyên môn"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD SPECIALTY */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border-4 border-black rounded-[35px_15px_30px_10px/10px_30px_15px_35px] max-w-sm w-full p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-black mb-1 flex items-center gap-2">
              🎨 Thêm Chuyên môn mới
            </h3>
            <p className="text-gray-500 text-sm mb-6">Tạo một môn vẽ mới vào danh mục hệ thống</p>
            
            {formError && (
              <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-xl p-3 mb-4 font-bold text-sm">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleAddSpecialty} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Tên chuyên môn *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Vẽ Sơn dầu"
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold"
                  value={specialtyName}
                  onChange={(e) => setSpecialtyName(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
