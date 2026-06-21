"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Save, X, PlusCircle, MinusCircle, Layout, TrendingUp, Users, Image as ImageIcon } from "lucide-react";
import { NotificationModal } from "@/app/cms/components/modals/NotificationModal";
import { cmsApi } from "@/lib/api-client";

interface Teacher {
  name: string;
  role: string;
  avatar: string;
  achievements: string[];
}

interface Stat {
  count: string;
  label: string;
}

interface Benefit {
  title: string;
  description: string;
  color: string;
}

export default function SettingsManagerPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"hero" | "stats" | "teachers" | "gallery">("hero");

  // Form states
  const [heroTitle, setHeroTitle] = useState("");
  const [heroDescription, setHeroDescription] = useState("");
  const [aboutText, setAboutText] = useState("");
  const [aboutImage, setAboutImage] = useState("");

  const [stats, setStats] = useState<Stat[]>([
    { count: "", label: "" },
    { count: "", label: "" },
    { count: "", label: "" },
    { count: "", label: "" }
  ]);

  const [benefits, setBenefits] = useState<Benefit[]>([
    { title: "", description: "", color: "bg-sky-200" },
    { title: "", description: "", color: "bg-amber-200" },
    { title: "", description: "", color: "bg-purple-200" }
  ]);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // Notification State
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
    type: "info"
  });

  const showNotification = (
    title: string,
    message: string,
    type: "success" | "error" | "info" | "confirm",
    onConfirm?: () => void
  ) => {
    setNotification({ isOpen: true, title, message, type, onConfirm });
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await cmsApi.settings.get();
      const s = data.settings || {};

      setHeroTitle(s.hero_title || "");
      setHeroDescription(s.hero_description || "");
      setAboutText(s.about_text || "");
      setAboutImage(s.about_image || "");

      if (s.stats) {
        try {
          setStats(JSON.parse(s.stats));
        } catch (_) {}
      }

      if (s.benefits) {
        try {
          setBenefits(JSON.parse(s.benefits));
        } catch (_) {}
      }

      if (s.teachers) {
        try {
          setTeachers(JSON.parse(s.teachers));
        } catch (_) {}
      }

      if (s.gallery_images) {
        try {
          setGalleryImages(JSON.parse(s.gallery_images));
        } catch (_) {}
      }

    } catch (err: any) {
      showNotification("Lỗi tải cấu hình", err.message || "Không thể tải cấu hình website.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload: Record<string, string> = {
      hero_title: heroTitle.trim(),
      hero_description: heroDescription.trim(),
      about_text: aboutText.trim(),
      about_image: aboutImage.trim(),
      stats: JSON.stringify(stats),
      benefits: JSON.stringify(benefits),
      teachers: JSON.stringify(teachers),
      gallery_images: JSON.stringify(galleryImages.filter(img => img.trim().length > 0))
    };

    try {
      await cmsApi.settings.save(payload);
      showNotification("Thành công", "Đã cập nhật toàn bộ cấu hình trang chủ thành công!", "success");
      loadSettings();
    } catch (err: any) {
      showNotification("Lỗi lưu cấu hình", err.message || "Không thể lưu cấu hình website.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper arrays update
  const handleUpdateStat = (idx: number, key: keyof Stat, val: string) => {
    setStats(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [key]: val };
      return copy;
    });
  };

  const handleUpdateBenefit = (idx: number, key: keyof Benefit, val: string) => {
    setBenefits(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [key]: val };
      return copy;
    });
  };

  const handleUpdateTeacher = (idx: number, key: keyof Teacher, val: any) => {
    setTeachers(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [key]: val };
      return copy;
    });
  };

  const handleUpdateTeacherAchievement = (tIdx: number, aIdx: number, val: string) => {
    setTeachers(prev => {
      const copy = [...prev];
      const achievements = [...copy[tIdx].achievements];
      achievements[aIdx] = val;
      copy[tIdx] = { ...copy[tIdx], achievements };
      return copy;
    });
  };

  const handleAddTeacherAchievement = (tIdx: number) => {
    setTeachers(prev => {
      const copy = [...prev];
      copy[tIdx] = { ...copy[tIdx], achievements: [...copy[tIdx].achievements, ""] };
      return copy;
    });
  };

  const handleRemoveTeacherAchievement = (tIdx: number, aIdx: number) => {
    setTeachers(prev => {
      const copy = [...prev];
      copy[tIdx] = {
        ...copy[tIdx],
        achievements: copy[tIdx].achievements.filter((_, i) => i !== aIdx)
      };
      return copy;
    });
  };

  const handleAddTeacher = () => {
    setTeachers(prev => [...prev, { name: "", role: "", avatar: "", achievements: [] }]);
  };

  const handleRemoveTeacher = (idx: number) => {
    setTeachers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateGalleryImage = (idx: number, val: string) => {
    setGalleryImages(prev => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const handleAddGalleryImage = () => {
    setGalleryImages(prev => [...prev, ""]);
  };

  const handleRemoveGalleryImage = (idx: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
          <p className="font-extrabold text-black">Đang tải cấu hình trang chủ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Title Neobrutalism Header */}
      <div className="bg-[#ffc6ff] border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-black tracking-tight flex items-center gap-2.5">
            🌐 CẤU HÌNH WEBSITE & TRANG CHỦ
          </h2>
          <p className="text-gray-800 font-bold text-sm mt-1">
            Chỉnh sửa toàn bộ các câu chữ hiển thị ngoài trang chủ, thống kê, đội ngũ giáo viên và thư viện hình ảnh lớp học.
          </p>
        </div>
      </div>

      {/* Tabs Selector Neobrutalism Navigation */}
      <div className="flex border-b-4 border-black gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("hero")}
          className={`px-5 py-3 font-black text-xs border-t-4 border-x-4 border-black rounded-t-2xl shadow-[0_4px_0_0_#fff] relative z-10 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "hero"
              ? "bg-white text-black translate-y-[4px] border-b-0"
              : "bg-stone-100 text-gray-500 hover:bg-stone-50 border-b-4 border-black"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Layout className="w-3.5 h-3.5" />
            Hero & Giới thiệu
          </span>
        </button>

        <button
          onClick={() => setActiveTab("stats")}
          className={`px-5 py-3 font-black text-xs border-t-4 border-x-4 border-black rounded-t-2xl shadow-[0_4px_0_0_#fff] relative z-10 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "stats"
              ? "bg-white text-black translate-y-[4px] border-b-0"
              : "bg-stone-100 text-gray-500 hover:bg-stone-50 border-b-4 border-black"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Lợi ích cốt lõi
          </span>
        </button>

        <button
          onClick={() => setActiveTab("teachers")}
          className={`px-5 py-3 font-black text-xs border-t-4 border-x-4 border-black rounded-t-2xl shadow-[0_4px_0_0_#fff] relative z-10 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "teachers"
              ? "bg-white text-black translate-y-[4px] border-b-0"
              : "bg-stone-100 text-gray-500 hover:bg-stone-50 border-b-4 border-black"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Đội ngũ giáo viên
          </span>
        </button>

        <button
          onClick={() => setActiveTab("gallery")}
          className={`px-5 py-3 font-black text-xs border-t-4 border-x-4 border-black rounded-t-2xl shadow-[0_4px_0_0_#fff] relative z-10 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "gallery"
              ? "bg-white text-black translate-y-[4px] border-b-0"
              : "bg-stone-100 text-gray-500 hover:bg-stone-50 border-b-4 border-black"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            Thư viện ảnh
          </span>
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
        
        {/* Tab 1: Hero & Introduction */}
        {activeTab === "hero" && (
          <div className="space-y-4 animate-in fade-in duration-100">
            <h3 className="text-lg font-black text-black">🏠 CẤU HÌNH HERO BANNER & GIỚI THIỆU</h3>
            
            <div>
              <label className="block text-xs font-black text-gray-800 mb-1">Tiêu đề lớn Hero (Hero Title) *</label>
              <input
                type="text"
                required
                className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs"
                value={heroTitle}
                onChange={e => setHeroTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-800 mb-1">Mô tả ngắn Hero (Hero Description) *</label>
              <textarea
                required
                rows={3}
                className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs"
                value={heroDescription}
                onChange={e => setHeroDescription(e.target.value)}
              />
            </div>

            <hr className="border-t-2 border-black/10 border-dashed my-4" />

            <div>
              <label className="block text-xs font-black text-gray-800 mb-1">Đoạn văn giới thiệu chi tiết (Giới thiệu bản thân / word.md) *</label>
              <textarea
                required
                rows={5}
                className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs"
                value={aboutText}
                onChange={e => setAboutText(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-800 mb-1">Đường dẫn ảnh Giới thiệu (About Image URL)</label>
              <input
                type="text"
                className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs"
                value={aboutImage}
                onChange={e => setAboutImage(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Core Values */}
        {activeTab === "stats" && (
          <div className="space-y-6 animate-in fade-in duration-100">
            <div>
              <h3 className="text-lg font-black text-black mb-4">🎨 3 LỢI ÍCH CỐT LÕI (Core Benefits)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="border-2 border-black rounded-xl p-4 bg-gray-50 space-y-2">
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase">Tiêu đề thẻ *</label>
                      <input
                        type="text"
                        required
                        className="w-full border-2 border-black rounded-lg p-1.5 bg-white font-bold text-black focus:outline-none text-xs"
                        value={benefit.title}
                        onChange={e => handleUpdateBenefit(idx, "title", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase">Mô tả chi tiết *</label>
                      <textarea
                        required
                        rows={3}
                        className="w-full border-2 border-black rounded-lg p-1.5 bg-white font-bold text-black focus:outline-none text-xs"
                        value={benefit.description}
                        onChange={e => handleUpdateBenefit(idx, "description", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase">Màu nền thẻ (CSS class)</label>
                      <input
                        type="text"
                        className="w-full border-2 border-black rounded-lg p-1.5 bg-white font-bold text-black focus:outline-none text-xs"
                        value={benefit.color}
                        onChange={e => handleUpdateBenefit(idx, "color", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Teachers Team */}
        {activeTab === "teachers" && (
          <div className="space-y-6 animate-in fade-in duration-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-black">👩‍🏫 ĐỘI NGŨ SÁNG LẬP & GIÁO VIÊN (Landing page)</h3>
              <button
                type="button"
                onClick={handleAddTeacher}
                className="text-xs font-black text-sky-600 hover:text-sky-700 flex items-center gap-0.5 cursor-pointer bg-white border-2 border-black rounded-lg px-2.5 py-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px]"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Thêm giáo viên hiển thị
              </button>
            </div>
            
            {teachers.length === 0 ? (
              <p className="text-center font-bold text-gray-400 italic py-6">Chưa có giáo viên nào được cấu hình hiển thị ngoài trang chủ.</p>
            ) : (
              teachers.map((teacher, tIdx) => (
                <div key={tIdx} className="border-3 border-black rounded-2xl p-4 bg-stone-50 space-y-4 shadow-[3px_3px_0px_rgba(0,0,0,1)] relative">
                  <div className="flex justify-between items-center border-b border-black/10 pb-2">
                    <span className="text-xs font-black text-gray-500">Giáo viên #{tIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTeacher(tIdx)}
                      className="text-xs font-black text-rose-600 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer"
                    >
                      <MinusCircle className="w-4.5 h-4.5" /> Xóa giáo viên này
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-black text-gray-800 mb-1">Tên giáo viên *</label>
                      <input
                        type="text"
                        required
                        className="w-full border-2 border-black rounded-lg p-2 bg-white font-bold text-black focus:outline-none text-xs"
                        value={teacher.name}
                        onChange={e => handleUpdateTeacher(tIdx, "name", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-800 mb-1">Vai trò hiển thị *</label>
                      <input
                        type="text"
                        required
                        className="w-full border-2 border-black rounded-lg p-2 bg-white font-bold text-black focus:outline-none text-xs"
                        value={teacher.role}
                        onChange={e => handleUpdateTeacher(tIdx, "role", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-800 mb-1">Đường dẫn ảnh chân dung (Avatar URL) *</label>
                      <input
                        type="text"
                        required
                        className="w-full border-2 border-black rounded-lg p-2 bg-white font-bold text-black focus:outline-none text-xs"
                        value={teacher.avatar}
                        onChange={e => handleUpdateTeacher(tIdx, "avatar", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Achievements List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-gray-800">📋 Thành tựu & Kinh nghiệm (Gạch đầu dòng)</label>
                      <button
                        type="button"
                        onClick={() => handleAddTeacherAchievement(tIdx)}
                        className="text-xs font-black text-sky-600 hover:text-sky-700 flex items-center gap-0.5 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Thêm gạch đầu dòng
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {teacher.achievements?.map((ach, aIdx) => (
                        <div key={aIdx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            required
                            placeholder="Mô tả thành tựu / kinh nghiệm..."
                            className="flex-1 border-2 border-black rounded-lg p-2 bg-white font-medium text-black focus:outline-none text-xs"
                            value={ach}
                            onChange={e => handleUpdateTeacherAchievement(tIdx, aIdx, e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveTeacherAchievement(tIdx, aIdx)}
                            className="text-rose-500 hover:text-rose-600 cursor-pointer p-1"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Photos Gallery */}
        {activeTab === "gallery" && (
          <div className="space-y-4 animate-in fade-in duration-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-black">🖼️ THƯ VIỆN ẢNH LỚP HỌC (Slideshow / Grid)</h3>
              <button
                type="button"
                onClick={handleAddGalleryImage}
                className="text-xs font-black text-sky-600 hover:text-sky-700 flex items-center gap-0.5 cursor-pointer bg-white border-2 border-black rounded-lg px-2.5 py-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px]"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Thêm ảnh vào thư viện
              </button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {galleryImages.map((imgUrl, idx) => (
                <div key={idx} className="flex gap-2 items-center border-2 border-black rounded-xl p-2.5 bg-gray-50 shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                  <span className="text-[10px] font-black text-stone-400 w-6">#{idx + 1}</span>
                  <input
                    type="text"
                    required
                    placeholder="/info/ảnh lớp học/... hoặc đường dẫn URL ảnh khác"
                    className="flex-1 border-2 border-black rounded-lg p-2 bg-white font-medium text-black focus:outline-none text-xs"
                    value={imgUrl}
                    onChange={e => handleUpdateGalleryImage(idx, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveGalleryImage(idx)}
                    className="text-rose-500 hover:text-rose-600 cursor-pointer p-1"
                  >
                    <MinusCircle className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))}
              {galleryImages.length === 0 && (
                <p className="text-center font-bold text-gray-400 italic py-6">Chưa có ảnh nào được thêm vào thư viện hiển thị.</p>
              )}
            </div>
          </div>
        )}

        {/* Form Action Buttons */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t-2 border-black">
          <button
            type="button"
            onClick={loadSettings}
            className="bg-white hover:bg-gray-50 border-3 border-black rounded-xl px-6 py-3 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-xs"
          >
            Hủy thay đổi
          </button>
          
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#ffd275] hover:bg-[#ffc342] disabled:bg-gray-200 border-3 border-black rounded-xl px-6 py-3 font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer text-xs"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Lưu cấu hình website
              </>
            )}
          </button>
        </div>

      </form>

      {/* NOTIFICATION MODAL */}
      <NotificationModal
        isOpen={notification.isOpen}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        onConfirm={notification.onConfirm}
      />
    </div>
  );
}
