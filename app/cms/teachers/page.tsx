"use client";

import { useEffect, useState } from "react";
import { CustomSelect } from "@/app/cms/components/ui/custom-select";
import { cmsApi } from "@/lib/api-client";
import { TeacherWithUserAndClasses, AuthSession } from "@/lib/types/api";
import { Specialty } from "@/lib/generated/prisma/client";
import { Plus, Trash2, Mail, Phone, X, Loader2 } from "lucide-react";
import { NotificationModal } from "@/app/cms/components/modals/NotificationModal";

function TeacherStatsCell({ teacherId }: { teacherId: string }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await cmsApi.teachers.getStats(teacherId);
        setStats(data);
      } catch (err) {
        console.error("Failed to load teacher stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [teacherId]);

  if (loading) {
    return <span className="text-xs text-gray-400 font-bold animate-pulse">Đang tải...</span>;
  }

  if (!stats) {
    return <span className="text-xs text-rose-500 font-bold">Lỗi tải</span>;
  }

  return (
    <div className="text-xs font-semibold text-gray-700 space-y-0.5 whitespace-nowrap">
      <div>📅 Tổng số: <span className="font-black text-gray-900">{stats.totalSessions} buổi</span></div>
      <div>✓ Đã dạy: <span className="font-black text-emerald-600">{stats.completedSessions}</span></div>
      <div>🔄 Dạy bù: <span className="font-black text-purple-600">{stats.makeupSessions}</span></div>
      {stats.cancelledSessions > 0 && (
        <div>✕ Đã hủy: <span className="font-black text-rose-600">{stats.cancelledSessions}</span></div>
      )}
    </div>
  );
}

export default function TeachersPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Data lists
  const [teachers, setTeachers] = useState<TeacherWithUserAndClasses[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modals & submission states
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showEditTeacherModal, setShowEditTeacherModal] = useState(false);
  const [formError, setFormError] = useState("");
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

  // Add Teacher Form
  const [teacherForm, setTeacherForm] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    phone: "",
    specialtyIds: [] as string[],
    bio: "",
    role: "TEACHER",
    image: ""
  });

  // Edit Teacher Form
  const [editTeacherForm, setEditTeacherForm] = useState({
    id: "",
    username: "",
    password: "",
    name: "",
    email: "",
    phone: "",
    specialtyIds: [] as string[],
    bio: "",
    role: "TEACHER",
    image: ""
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

  // Fetch teachers and specialties lists (Admin only)
  const fetchAllData = async () => {
    setLoadingData(true);
    try {
      const teachersData = await cmsApi.teachers.list();
      setTeachers(teachersData.teachers || []);

      const specsData = await cmsApi.specialties.list();
      setSpecialties(specsData.specialties || []);
    } catch (err) {
      console.error("Failed to load teachers/specialties data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!loadingSession && session && session.user?.role === "ADMIN") {
      fetchAllData();
    }
  }, [loadingSession, session]);

  // Handle specialties select checks for Add
  const handleSpecialtyChange = (specId: string, checked: boolean) => {
    setTeacherForm((prev) => {
      const current = prev.specialtyIds;
      const updated = checked
        ? [...current, specId]
        : current.filter((id) => id !== specId);
      return { ...prev, specialtyIds: updated };
    });
  };

  // Handle specialties select checks for Edit
  const handleEditSpecialtyChange = (specId: string, checked: boolean) => {
    setEditTeacherForm((prev) => {
      const current = prev.specialtyIds;
      const updated = checked
        ? [...current, specId]
        : current.filter((id) => id !== specId);
      return { ...prev, specialtyIds: updated };
    });
  };

  // Convert uploaded image to Base64 (Add form)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setFormError("Kích thước ảnh đại diện không được vượt quá 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setTeacherForm((prev) => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Convert uploaded image to Base64 (Edit form)
  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setFormError("Kích thước ảnh đại diện không được vượt quá 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditTeacherForm((prev) => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Add Teacher Handler
  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    if (!teacherForm.username || !teacherForm.password || !teacherForm.name) {
      setFormError("Vui lòng điền các trường bắt buộc (Tên, Tên đăng nhập, Mật khẩu)");
      setSubmitting(false);
      return;
    }

    try {
      await cmsApi.teachers.create(teacherForm);
      setShowAddTeacherModal(false);
      // Reset form
      setTeacherForm({
        username: "",
        password: "",
        name: "",
        email: "",
        phone: "",
        specialtyIds: [],
        bio: "",
        role: "TEACHER",
        image: ""
      });
      fetchAllData();
    } catch (err: any) {
      setFormError(err.message || "Có lỗi xảy ra khi tạo giáo viên");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Teacher Handler
  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    if (!editTeacherForm.username || !editTeacherForm.name) {
      setFormError("Vui lòng điền các trường bắt buộc (Họ và Tên, Tên đăng nhập)");
      setSubmitting(false);
      return;
    }

    try {
      const payload: any = { ...editTeacherForm };
      if (!payload.password) {
        delete payload.password; // Do not change password if empty
      }

      await cmsApi.teachers.update(payload);
      setShowEditTeacherModal(false);
      fetchAllData();
    } catch (err: any) {
      setFormError(err.message || "Có lỗi xảy ra khi cập nhật giáo viên");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Teacher Handler
  const handleDeleteTeacher = async (id: string, name: string) => {
    showNotification(
      "Xác nhận xóa giáo viên",
      `Bạn có chắc chắn muốn xóa giáo viên "${name}"? Thao tác này cũng sẽ xóa tài khoản đăng nhập của giáo viên.`,
      "confirm",
      undefined,
      async () => {
        try {
          await cmsApi.teachers.delete(id);
          fetchAllData();
        } catch (err: any) {
          showNotification("Lỗi xóa giáo viên", err.message || "Không thể xóa giáo viên", "error");
        }
      }
    );
  };

  if (loadingSession) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
        <p className="mt-4 font-bold text-gray-600">Đang tải trang giáo viên...</p>
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
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-black">Quản lý Giáo viên 👩‍🏫</h2>
          <p className="text-gray-500 text-sm">Tạo tài khoản và phân công chuyên môn cho đội ngũ giáo viên vẽ zì đó</p>
        </div>
        <button
          onClick={() => {
            setFormError("");
            setShowAddTeacherModal(true);
          }}
          className="flex items-center gap-2 bg-[#a8e6cf] hover:bg-[#96d8c0] border-3 border-black rounded-xl px-5 py-3 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer text-sm"
        >
          <Plus className="w-5 h-5 shrink-0" /> Thêm Giáo viên
        </button>
      </div>

      {/* Table section */}
      {loadingData ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
          <p className="mt-4 font-bold text-gray-600">Đang tải dữ liệu giáo viên...</p>
        </div>
      ) : teachers.length === 0 ? (
        <div className="border-4 border-dashed border-gray-300 rounded-3xl p-12 text-center bg-gray-50">
          <p className="text-xl font-bold text-gray-400">Chưa có giáo viên nào được tạo 🎨</p>
          <p className="text-gray-400 mt-2">Hãy nhấn nút "Thêm Giáo viên" để bắt đầu.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-4 border-black">
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Họ và Tên</th>
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Tên đăng nhập</th>
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Liên hệ</th>
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Chuyên môn</th>
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Lớp phụ trách</th>
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm">Thống kê dạy</th>
                <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-sm text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="border-b-2 border-gray-200 hover:bg-[#fff9ed] transition-colors">
                  <td className="py-4 px-4 font-bold text-gray-950 flex items-center gap-3">
                    {teacher.user.image ? (
                      <img
                        src={teacher.user.image}
                        alt={teacher.user.name || ""}
                        className="w-10 h-10 rounded-full border-2 border-black object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full border-2 border-black bg-amber-100 flex items-center justify-center font-black text-black shrink-0 text-sm">
                        {(teacher.user.name || teacher.user.username).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span>{teacher.user.name || "Chưa đặt tên"}</span>
                        {teacher.user.role === "ADMIN" && (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-300 rounded px-1.5 py-0.5 whitespace-nowrap">
                            Admin 👑
                          </span>
                        )}
                        {teacher.user.role === "ASSISTANT" && (
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-black border border-blue-300 rounded px-1.5 py-0.5 whitespace-nowrap">
                            Trợ giảng 📋
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-700 font-mono text-sm">
                    {teacher.user.username}
                  </td>
                  <td className="py-4 px-4 text-sm">
                    {teacher.user.email && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Mail className="w-4 h-4 shrink-0" />
                        <span>{teacher.user.email}</span>
                      </div>
                    )}
                    {teacher.phone && (
                      <div className="flex items-center gap-1.5 text-gray-600 mt-1">
                        <Phone className="w-4 h-4 shrink-0" />
                        <span>{teacher.phone}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm">
                    {teacher.specialties && teacher.specialties.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {teacher.specialties.map((spec) => (
                          <span key={spec.id} className="bg-[#dcd6f7] border-2 border-black rounded-lg px-2.5 py-0.5 font-bold text-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {spec.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 font-medium">Chưa cập nhật</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm">
                    {teacher.classes.length === 0 ? (
                      <span className="text-gray-400 font-medium">Chưa nhận lớp</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {teacher.classes.map((cls) => (
                          <span key={cls.id} className="bg-sky-100 border border-sky-300 rounded px-1.5 py-0.5 font-semibold text-sky-800 text-xs">
                            {cls.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <TeacherStatsCell teacherId={teacher.id} />
                  </td>
                  <td className="py-4 px-4 text-center space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setFormError("");
                        setEditTeacherForm({
                          id: teacher.id,
                          username: teacher.user.username,
                          password: "",
                          name: teacher.user.name || "",
                          email: teacher.user.email || "",
                          phone: teacher.phone || "",
                          specialtyIds: teacher.specialties?.map((s) => s.id) || [],
                          bio: teacher.bio || "",
                          role: teacher.user.role || "TEACHER",
                          image: teacher.user.image || ""
                        });
                        setShowEditTeacherModal(true);
                      }}
                      className="p-2 bg-[#ffd275] hover:bg-[#ffc342] border-2 border-black rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-black cursor-pointer inline-flex items-center justify-center"
                      title="Chỉnh sửa thông tin"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTeacher(teacher.id, teacher.user.name || teacher.user.username)}
                      className="p-2 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-black cursor-pointer inline-flex items-center justify-center"
                      title="Xóa giáo viên"
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

      {/* MODAL: ADD TEACHER */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border-4 border-black rounded-[35px_15px_30px_10px/10px_30px_15px_35px] max-w-lg w-full p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative my-8">
            <button 
              onClick={() => setShowAddTeacherModal(false)}
              className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-black text-black mb-1 flex items-center gap-2">
              👩‍🏫 Thêm Giáo viên mới
            </h3>
            <p className="text-gray-500 text-sm mb-6">Tạo tài khoản và hồ sơ thông tin cho giáo viên vẽ mới</p>
            
            {formError && (
              <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-xl p-3 mb-4 font-bold text-sm">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Họ và Tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-medium"
                    value={teacherForm.name}
                    onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Vai trò hệ thống *</label>
                  <CustomSelect
                    value={teacherForm.role}
                    onChange={(val) => setTeacherForm({ ...teacherForm, role: val })}
                    options={[
                      { value: "TEACHER", label: "Giáo viên 👩‍🏫" },
                      { value: "ASSISTANT", label: "Trợ giảng 📋" },
                      { value: "ADMIN", label: "Quản trị viên & Giáo viên 👑" }
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Ảnh đại diện (Avatar)</label>
                <div className="flex items-center gap-3 border-3 border-black rounded-xl p-2.5 bg-gray-50">
                  {teacherForm.image ? (
                    <img
                      src={teacherForm.image}
                      alt="Avatar Preview"
                      className="w-12 h-12 rounded-full border-2 border-black object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full border-2 border-black bg-amber-100 flex items-center justify-center font-black text-black shrink-0 text-xs">
                      Ảnh
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-2 file:border-black file:text-xs file:font-black file:bg-[#bae1ff] file:cursor-pointer hover:file:bg-sky-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Chuyên môn giảng dạy (Chọn nhiều)</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 border-3 border-black rounded-2xl p-4">
                  {specialties.map((spec) => {
                    const isChecked = teacherForm.specialtyIds.includes(spec.id);
                    return (
                      <label key={spec.id} className="flex items-center gap-2 font-bold text-sm text-gray-800 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 border-2 border-black rounded accent-emerald-400"
                          checked={isChecked}
                          onChange={(e) => handleSpecialtyChange(spec.id, e.target.checked)}
                        />
                        <span>{spec.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Tên đăng nhập *</label>
                  <input
                    type="text"
                    required
                    placeholder="Tên viết liền không dấu"
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-mono text-sm font-medium"
                    value={teacherForm.username}
                    onChange={(e) => setTeacherForm({ ...teacherForm, username: e.target.value.toLowerCase().trim() })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Mật khẩu *</label>
                  <input
                    type="password"
                    required
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-mono text-sm font-medium"
                    value={teacherForm.password}
                    onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@vezido.edu.vn"
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-medium"
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    placeholder="Số điện thoại liên hệ"
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-medium"
                    value={teacherForm.phone}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Giới thiệu ngắn (Bio)</label>
                <textarea
                  placeholder="Giới thiệu kinh nghiệm và phong cách vẽ giảng dạy..."
                  rows={2}
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-medium"
                  value={teacherForm.bio}
                  onChange={(e) => setTeacherForm({ ...teacherForm, bio: e.target.value })}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="bg-gray-200 border-3 border-black rounded-xl px-5 py-2.5 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#a8e6cf] hover:bg-[#96d8c0] border-3 border-black rounded-xl px-5 py-2.5 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Lưu lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TEACHER */}
      {showEditTeacherModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border-4 border-black rounded-[35px_15px_30px_10px/10px_30px_15px_35px] max-w-lg w-full p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative my-8">
            <button 
              onClick={() => setShowEditTeacherModal(false)}
              className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-black text-black mb-1 flex items-center gap-2">
              📝 Chỉnh sửa Giáo viên
            </h3>
            <p className="text-gray-500 text-sm mb-6">Cập nhật hồ sơ tài khoản và thông tin giảng dạy của giáo viên</p>
            
            {formError && (
              <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-xl p-3 mb-4 font-bold text-sm">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleEditTeacher} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Họ và Tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-medium"
                    value={editTeacherForm.name}
                    onChange={(e) => setEditTeacherForm({ ...editTeacherForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Vai trò hệ thống *</label>
                  <CustomSelect
                    value={editTeacherForm.role}
                    onChange={(val) => setEditTeacherForm({ ...editTeacherForm, role: val })}
                    options={[
                      { value: "TEACHER", label: "Giáo viên 👩‍🏫" },
                      { value: "ASSISTANT", label: "Trợ giảng 📋" },
                      { value: "ADMIN", label: "Quản trị viên & Giáo viên 👑" }
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Ảnh đại diện (Avatar)</label>
                <div className="flex items-center gap-3 border-3 border-black rounded-xl p-2.5 bg-gray-50">
                  {editTeacherForm.image ? (
                    <img
                      src={editTeacherForm.image}
                      alt="Avatar Preview"
                      className="w-12 h-12 rounded-full border-2 border-black object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full border-2 border-black bg-amber-100 flex items-center justify-center font-black text-black shrink-0 text-xs">
                      Ảnh
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-2 file:border-black file:text-xs file:font-black file:bg-[#bae1ff] file:cursor-pointer hover:file:bg-sky-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Chuyên môn giảng dạy (Chọn nhiều)</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 border-3 border-black rounded-2xl p-4">
                  {specialties.map((spec) => {
                    const isChecked = editTeacherForm.specialtyIds.includes(spec.id);
                    return (
                      <label key={spec.id} className="flex items-center gap-2 font-bold text-sm text-gray-800 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 border-2 border-black rounded accent-emerald-400"
                          checked={isChecked}
                          onChange={(e) => handleEditSpecialtyChange(spec.id, e.target.checked)}
                        />
                        <span>{spec.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Tên đăng nhập *</label>
                  <input
                    type="text"
                    required
                    placeholder="Tên viết liền không dấu"
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-mono text-sm font-medium"
                    value={editTeacherForm.username}
                    onChange={(e) => setEditTeacherForm({ ...editTeacherForm, username: e.target.value.toLowerCase().trim() })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Mật khẩu mới (Để trống nếu không đổi)</label>
                  <input
                    type="password"
                    placeholder="Mật khẩu mới"
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-mono text-sm font-medium"
                    value={editTeacherForm.password}
                    onChange={(e) => setEditTeacherForm({ ...editTeacherForm, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@vezido.edu.vn"
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-medium"
                    value={editTeacherForm.email}
                    onChange={(e) => setEditTeacherForm({ ...editTeacherForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    placeholder="Số điện thoại liên hệ"
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-medium"
                    value={editTeacherForm.phone}
                    onChange={(e) => setEditTeacherForm({ ...editTeacherForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Giới thiệu ngắn (Bio)</label>
                <textarea
                  placeholder="Giới thiệu kinh nghiệm và phong cách vẽ giảng dạy..."
                  rows={2}
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-medium"
                  value={editTeacherForm.bio}
                  onChange={(e) => setEditTeacherForm({ ...editTeacherForm, bio: e.target.value })}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditTeacherModal(false)}
                  className="bg-gray-200 border-3 border-black rounded-xl px-5 py-2.5 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#a8e6cf] hover:bg-[#96d8c0] border-3 border-black rounded-xl px-5 py-2.5 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Lưu thay đổi
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
