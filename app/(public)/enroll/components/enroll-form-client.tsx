"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/app/cms/components/ui/custom-select";
import { 
  Baby, Star, Award, Calendar, PaintBucket, Send, CheckCircle2, RefreshCw, AlertTriangle
} from "lucide-react";

interface CourseWithCategory {
  id: string;
  title: string;
  audience: string;
  level?: string | null;
  classCategory?: {
    id: string;
    name: string;
  } | null;
}

interface EnrollFormClientProps {
  courses: CourseWithCategory[];
}

const SCHEDULE_OPTIONS = [
  { value: "Sáng Thứ 7 (8:00 - 10:00)", label: "Sáng Thứ 7 (8:00 - 10:00)" },
  { value: "Chiều Thứ 7 (14:00 - 16:00)", label: "Chiều Thứ 7 (14:00 - 16:00)" },
  { value: "Sáng Chủ Nhật (8:00 - 10:00)", label: "Sáng Chủ Nhật (8:00 - 10:00)" },
  { value: "Chiều Chủ Nhật (14:00 - 16:00)", label: "Chiều Chủ Nhật (14:00 - 16:00)" },
];

export function EnrollFormClient({ courses }: EnrollFormClientProps) {
  const searchParams = useSearchParams();
  const classParam = searchParams.get("class");
  const courseTitleParam = searchParams.get("course");

  const [formData, setFormData] = useState({
    studentName: "",
    studentAge: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    courseId: "",
    schedulePreference: "Sáng Thứ 7 (8:00 - 10:00)",
    notes: ""
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Map courses to select options
  const courseOptions = useMemo(() => {
    return courses.map(c => ({
      value: c.id,
      label: `${c.title} (${c.classCategory?.name || "Chưa phân loại"}${c.level ? ` - ${c.level}` : ""})`
    }));
  }, [courses]);

  // Find currently selected course details
  const selectedCourse = useMemo(() => {
    return courses.find(c => c.id === formData.courseId);
  }, [courses, formData.courseId]);

  // Auto select class / course based on query parameters
  useEffect(() => {
    if (courses.length > 0) {
      if (courseTitleParam) {
        const decodedTitle = decodeURIComponent(courseTitleParam);
        const found = courses.find(
          c => c.title.toLowerCase() === decodedTitle.toLowerCase() || c.id === courseTitleParam
        );
        if (found) {
          setFormData(prev => ({ ...prev, courseId: found.id }));
          return;
        }
      }
      if (classParam) {
        let found;
        if (classParam === "mam-non") {
          found = courses.find(c => c.classCategory?.name.toLowerCase().includes("mầm") || c.title.toLowerCase().includes("mầm"));
        } else if (classParam === "nang-khieu" || classParam === "nghe-si") {
          found = courses.find(c => 
            c.classCategory?.name.toLowerCase().includes("lá") || 
            c.classCategory?.name.toLowerCase().includes("digital") || 
            c.title.toLowerCase().includes("màu nước") || 
            c.title.toLowerCase().includes("nghệ sĩ")
          );
        }
        if (found) {
          setFormData(prev => ({ ...prev, courseId: found.id }));
          return;
        }
      }
      // If we don't have a courseId selected yet, default to the first one
      if (!formData.courseId) {
        setFormData(prev => ({ ...prev, courseId: courses[0].id }));
      }
    }
  }, [classParam, courseTitleParam, courses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const courseText = selectedCourse 
      ? `${selectedCourse.title} (${selectedCourse.classCategory?.name || "Chưa phân loại"}${selectedCourse.level ? ` - ${selectedCourse.level}` : ""})`
      : "Không xác định";

    const emailText = formData.parentEmail ? `\n- Email: ${formData.parentEmail}` : "";

    const message = `ĐĂNG KÝ HỌC THỬ MIỄN PHÍ:
- Họ tên bé: ${formData.studentName}
- Tuổi bé: ${formData.studentAge} tuổi
- Họ tên phụ huynh: ${formData.parentName}${emailText}
- Số điện thoại: ${formData.parentPhone}
- Khóa học đăng ký: ${courseText}
- Lịch học mong muốn: ${formData.schedulePreference}
- Ghi chú thêm: ${formData.notes || "Không có"}`;

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.parentName,
          phone: formData.parentPhone,
          email: formData.parentEmail,
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Có lỗi xảy ra khi gửi thông tin đăng ký.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Gửi đăng ký thất bại. Ba mẹ vui lòng liên hệ trực tiếp hotline.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setError("");
    setFormData({
      studentName: "",
      studentAge: "",
      parentName: "",
      parentPhone: "",
      parentEmail: "",
      courseId: courses.length > 0 ? courses[0].id : "",
      schedulePreference: "Sáng Thứ 7 (8:00 - 10:00)",
      notes: ""
    });
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-200">
      {success ? (
        <div className="border-4 border-black bg-white rounded-3xl p-8 md:p-12 shadow-[10px_10px_0px_rgba(0,0,0,1)] text-center space-y-6">
          <div className="w-20 h-20 bg-[#baffc9] border-4 border-black rounded-full flex items-center justify-center shadow-[6px_6px_0px_rgba(0,0,0,1)] mx-auto animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-emerald-800" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 leading-tight">Đăng Ký Thành Công!</h2>
          <div className="max-w-md mx-auto space-y-4 font-bold text-sm text-gray-600 leading-relaxed">
            <p>
              Chúc mừng bé <span className="text-rose-500 font-extrabold">{formData.studentName}</span> đã ghi danh thành công vào lớp vẽ <span className="text-sky-500 font-extrabold">{selectedCourse?.title || "Chưa xác định"}</span>!
            </p>

            {/* Course Summary Badge */}
            {selectedCourse && (
              <div className="bg-sky-50 border-2 border-black rounded-2xl p-4 text-left space-y-1.5 shadow-[3px_3px_0px_rgba(0,0,0,1)] text-xs text-sky-950">
                <p><span className="font-black text-sky-900 uppercase">Khóa học:</span> {selectedCourse.title}</p>
                <p><span className="font-black text-sky-900 uppercase">Phân loại:</span> {selectedCourse.classCategory?.name || "Chưa phân loại"}</p>
                {selectedCourse.level && <p><span className="font-black text-sky-900 uppercase">Cấp độ:</span> {selectedCourse.level}</p>}
                <p><span className="font-black text-sky-900 uppercase">Lịch học:</span> {formData.schedulePreference}</p>
              </div>
            )}

            <div className="bg-amber-50 border-2 border-black rounded-2xl p-4 text-left space-y-2 text-xs text-amber-900 shadow-[3px_3px_0px_rgba(0,0,0,1)]">
              <p className="font-black">✨ Đặc quyền khi ghi danh:</p>
              <ul className="list-disc pl-4 space-y-1 font-semibold">
                <li>Kiểm tra trình độ & xếp lớp vẽ thử miễn phí 100%.</li>
                <li>Được cung cấp đầy đủ họa cụ & vật liệu học tập tại lớp học.</li>
              </ul>
            </div>
            <p>
              Các cô tại trung tâm sẽ liên hệ với ba mẹ qua số điện thoại <strong>{formData.parentPhone}</strong> trong vòng 24h tới để xếp lịch học thử cho bé.
            </p>
          </div>
          <div className="pt-4">
            <button 
              onClick={resetForm}
              className="bg-sky-300 hover:bg-sky-400 border-3 border-black px-8 py-3 rounded-xl font-black text-xs shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
            >
              🔄 Đăng ký cho bé tiếp theo
            </button>
          </div>
        </div>
      ) : (
        <div className="border-4 border-black bg-white rounded-3xl p-6 md:p-10 shadow-[10px_10px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          
          {/* Top Stamp decoration */}
          <div className="absolute -top-4 -right-4 bg-rose-400 border-2 border-black text-black px-6 py-3 rounded-full rotate-12 shadow-md font-black text-xs uppercase z-10">
            ✨ Học Thử Miễn Phí
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 text-left">
            
            {error && (
              <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-xl p-3.5 font-bold text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Kid details */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-l-4 border-sky-500 pl-4">
                <h2 className="font-black text-lg md:text-xl text-sky-600 uppercase tracking-tight">
                  1. Thông tin học viên nhí
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-700 uppercase">Tên Đầy Đủ Của Bé *</label>
                  <Input
                    required
                    type="text"
                    value={formData.studentName}
                    onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                    placeholder="Nhập họ và tên bé"
                    className="w-full border-3 border-black rounded-xl p-3 font-semibold bg-white focus-visible:ring-0 focus-visible:border-black"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-700 uppercase">Tuổi Của Bé *</label>
                  <Input
                    required
                    type="number"
                    min={3}
                    max={18}
                    value={formData.studentAge}
                    onChange={(e) => setFormData({...formData, studentAge: e.target.value})}
                    placeholder="Ví dụ: 7"
                    className="w-full border-3 border-black rounded-xl p-3 font-semibold bg-white focus-visible:ring-0 focus-visible:border-black"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Parent details */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-l-4 border-emerald-500 pl-4">
                <h2 className="font-black text-lg md:text-xl text-emerald-600 uppercase tracking-tight">
                  2. Thông tin phụ huynh liên hệ
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-700 uppercase">Họ Tên Ba / Mẹ *</label>
                  <Input
                    required
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                    placeholder="Tên phụ huynh liên hệ"
                    className="w-full border-3 border-black rounded-xl p-3 font-semibold bg-white focus-visible:ring-0 focus-visible:border-black"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-700 uppercase">Số Điện Thoại *</label>
                  <Input
                    required
                    type="tel"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({...formData, parentPhone: e.target.value})}
                    placeholder="090..."
                    className="w-full border-3 border-black rounded-xl p-3 font-semibold bg-white focus-visible:ring-0 focus-visible:border-black"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-700 uppercase">Email (Không bắt buộc)</label>
                  <Input
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) => setFormData({...formData, parentEmail: e.target.value})}
                    placeholder="example@mail.com"
                    className="w-full border-3 border-black rounded-xl p-3 font-semibold bg-white focus-visible:ring-0 focus-visible:border-black"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Course Selection */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-l-4 border-amber-500 pl-4">
                <h2 className="font-black text-lg md:text-xl text-amber-600 uppercase tracking-tight">
                  3. Chọn khóa học & Lịch mong muốn
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Course Select Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-700 uppercase block mb-1">Chọn Khóa Học Vẽ *</label>
                  {courses.length === 0 ? (
                    <div className="p-3 bg-stone-100 border-2 border-black rounded-xl font-bold text-xs text-gray-400">
                      Chưa có khóa học nào hoạt động
                    </div>
                  ) : (
                    <CustomSelect
                      value={formData.courseId}
                      onChange={(val) => setFormData({...formData, courseId: val})}
                      options={courseOptions}
                      placeholder="Chọn khóa học vẽ..."
                    />
                  )}
                  {selectedCourse && (
                    <p className="text-[10px] font-bold text-stone-400 mt-1 italic leading-relaxed">
                      💡 Đối tượng: {selectedCourse.audience}
                    </p>
                  )}
                </div>

                {/* Schedule Choice */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-700 uppercase block mb-1">Thời Gian Học Mong Muốn *</label>
                  <CustomSelect 
                    value={formData.schedulePreference}
                    onChange={(val) => setFormData({...formData, schedulePreference: val})}
                    options={SCHEDULE_OPTIONS}
                  />
                </div>

                {/* Notes Input */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-black text-gray-700 uppercase block">Lời nhắn hoặc ghi chú học tập:</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Ghi chú sở thích vẽ tranh của con, ngày giờ rảnh hoặc lịch mong muốn học thử..."
                    className="w-full border-3 border-black rounded-xl p-3 font-semibold focus:outline-none focus:ring-0 focus:border-black bg-white resize-none text-xs"
                  />
                </div>

              </div>
            </div>

            {/* Form Submit Action */}
            <div className="pt-6 border-t-2 border-black/10">
              <button
                type="submit"
                disabled={loading || courses.length === 0}
                className="w-full bg-[#ff8b94] hover:bg-[#ff7b85] disabled:bg-stone-100 disabled:opacity-50 text-black font-black text-sm md:text-base py-4 border-4 border-black rounded-2xl shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Đang gửi thông tin đăng ký...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 shrink-0" />
                    <span>Gửi Đăng Ký Ghi Danh Học Thử</span>
                  </>
                )}
              </button>
              <p className="text-center text-[10px] font-bold text-gray-400 italic mt-3">
                * Sau khi đăng ký, các cô sẽ chủ động gọi điện xếp lịch lớp và chuẩn bị họa cụ sẵn sàng cho bé.
              </p>
            </div>

          </form>
        </div>
      )}
    </div>
  );
}
