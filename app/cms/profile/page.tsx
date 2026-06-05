"use client";

import { useEffect, useState } from "react";
import { cmsApi } from "@/lib/api-client";
import { AuthSession } from "@/lib/types/api";
import { Specialty } from "@/lib/generated/prisma/client";
import { Loader2, Save, User as UserIcon } from "lucide-react";

export default function ProfilePage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Specialties list
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  // Profile data
  const [profileForm, setProfileForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    image: "",
    phone: "",
    bio: "",
    specialtyIds: [] as string[]
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  const loadProfileData = async () => {
    setLoadingProfile(true);
    setError("");
    try {
      // Load specialties
      const specsData = await cmsApi.specialties.list();
      setSpecialties(specsData.specialties || []);

      // Load user details
      const profileData = await cmsApi.profile.get();
      const u = profileData.user;
      
      const teacher = u.teacherProfile;

      setProfileForm({
        name: u.name || "",
        username: u.username || "",
        email: u.email || "",
        password: "", // Keep password blank
        image: u.image || "",
        phone: teacher?.phone || "",
        bio: teacher?.bio || "",
        specialtyIds: teacher?.specialties?.map((s: any) => s.id) || []
      });
    } catch (err: any) {
      setError(err.message || "Không thể tải thông tin hồ sơ");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (!loadingSession && session) {
      loadProfileData();
    }
  }, [loadingSession, session]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Kích thước ảnh đại diện không được vượt quá 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileForm((prev) => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSpecialtyToggle = (specId: string, checked: boolean) => {
    setProfileForm((prev) => {
      const current = prev.specialtyIds;
      const updated = checked
        ? [...current, specId]
        : current.filter((id) => id !== specId);
      return { ...prev, specialtyIds: updated };
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    if (!profileForm.username || !profileForm.name) {
      setError("Họ tên và Tên đăng nhập là bắt buộc");
      setSubmitting(false);
      return;
    }

    try {
      const payload: any = {
        name: profileForm.name,
        username: profileForm.username,
        email: profileForm.email,
        image: profileForm.image,
      };

      if (profileForm.password) {
        payload.password = profileForm.password;
      }

      // Add teacher profile fields if they have a teacher profile
      const user = session?.user;
      if (user) {
        payload.phone = profileForm.phone;
        payload.bio = profileForm.bio;
      }

      await cmsApi.profile.update({
        ...payload,
        specialtyIds: profileForm.specialtyIds
      });
      setMessage("Cập nhật thông tin cá nhân thành công! Đang tải lại...");
      
      // Update session by refreshing
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Lỗi khi cập nhật hồ sơ");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingSession || loadingProfile) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
        <p className="mt-4 font-bold text-gray-600">Đang tải thông tin hồ sơ...</p>
      </div>
    );
  }

  // A user is a teacher if they have a TeacherProfile record linked
  const hasTeacherProfile = specialties.length > 0 && profileForm.specialtyIds !== undefined;

  return (
    <div className="border-4 border-black bg-white rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-200 max-w-3xl mx-auto">
      <div className="mb-6 border-b-4 border-black pb-4">
        <h2 className="text-2xl font-black text-black">Hồ sơ cá nhân ⚙️</h2>
        <p className="text-gray-500 text-sm">Chỉnh sửa thông tin tài khoản và cấu hình hồ sơ giảng dạy của bạn</p>
      </div>

      {message && (
        <div className="bg-emerald-50 border-2 border-emerald-400 text-emerald-700 rounded-xl p-3 mb-6 font-bold text-sm">
          ✅ {message}
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-xl p-3 mb-6 font-bold text-sm">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleUpdateProfile} className="space-y-6">
        {/* Avatar Upload Container */}
        <div className="flex flex-col sm:flex-row items-center gap-6 bg-gray-50 border-3 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="relative shrink-0">
            {profileForm.image ? (
              <img
                src={profileForm.image}
                alt={profileForm.name}
                className="w-24 h-24 rounded-full border-4 border-black object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-black bg-amber-100 flex items-center justify-center font-black text-black text-4xl">
                {profileForm.name.charAt(0).toUpperCase() || <UserIcon className="w-12 h-12" />}
              </div>
            )}
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <h4 className="font-extrabold text-gray-900 text-base">Ảnh đại diện tài khoản</h4>
            <p className="text-xs text-gray-500">Tải lên ảnh PNG, JPG (tối đa 2MB)</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-2 file:border-black file:text-xs file:font-black file:bg-[#bae1ff] file:cursor-pointer hover:file:bg-sky-200"
            />
          </div>
        </div>

        {/* Basic Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">Họ và Tên *</label>
            <input
              type="text"
              required
              placeholder="Nguyễn Văn A"
              className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-medium"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">Tên đăng nhập *</label>
            <input
              type="text"
              required
              placeholder="username"
              className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-mono text-sm font-medium"
              value={profileForm.username}
              onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value.toLowerCase().trim() })}
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
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">Mật khẩu mới (Để trống nếu không đổi)</label>
            <input
              type="password"
              placeholder="Mật khẩu mới"
              className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-mono text-sm font-medium"
              value={profileForm.password}
              onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
            />
          </div>
        </div>

        {/* Teacher profile section (if they have a teacher profile in the form state) */}
        {hasTeacherProfile && (
          <div className="border-3 border-black rounded-2xl p-5 bg-[#fff9ed] space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-gray-900 text-lg border-b-2 border-black/10 pb-1.5 flex items-center gap-1.5">
              👩‍🏫 Thông tin hồ sơ Giáo viên
            </h3>
            
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Số điện thoại liên hệ</label>
              <input
                type="tel"
                placeholder="Số điện thoại liên lạc"
                className="w-full border-3 border-black rounded-xl p-2.5 bg-white font-medium"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Chuyên môn giảng dạy (Chọn nhiều)</label>
              <div className="grid grid-cols-2 gap-2 bg-white border-2 border-black rounded-xl p-3.5">
                {specialties.map((spec) => {
                  const isChecked = profileForm.specialtyIds.includes(spec.id);
                  return (
                    <label key={spec.id} className="flex items-center gap-2 font-bold text-xs text-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 border-2 border-black rounded accent-emerald-400"
                        checked={isChecked}
                        onChange={(e) => handleSpecialtyToggle(spec.id, e.target.checked)}
                      />
                      <span>{spec.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Giới thiệu ngắn (Bio)</label>
              <textarea
                placeholder="Giới thiệu kinh nghiệm dạy vẽ và phong cách của bản thân..."
                rows={3}
                className="w-full border-3 border-black rounded-xl p-2.5 bg-white font-medium"
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              />
            </div>
          </div>
        )}

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-[#a8e6cf] hover:bg-[#96d8c0] border-3 border-black rounded-xl px-6 py-3 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer text-sm disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5 shrink-0" />
            )}
            Lưu thay đổi
          </button>
        </div>
      </form>
    </div>
  );
}
