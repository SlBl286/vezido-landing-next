"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { 
  Baby, Star, Award, Calendar, PaintBucket, Send, CheckCircle2, RefreshCw, Landmark 
} from "lucide-react";

export function EnrollFormClient() {
  const searchParams = useSearchParams();
  const classParam = searchParams.get("class");

  const [formData, setFormData] = useState({
    studentName: "",
    studentAge: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    classId: "mam-non",
    schedulePreference: "Sáng Thứ 7 (8:00 - 10:00)",
    notes: ""
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Auto select class if passed via query parameter
  useEffect(() => {
    if (classParam === "mam-non" || classParam === "nang-khieu" || classParam === "nghe-si") {
      setFormData(prev => ({ ...prev, classId: classParam }));
    }
  }, [classParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate database submission
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  const resetForm = () => {
    setSuccess(false);
    setFormData({
      studentName: "",
      studentAge: "",
      parentName: "",
      parentPhone: "",
      parentEmail: "",
      classId: "mam-non",
      schedulePreference: "Sáng Thứ 7 (8:00 - 10:00)",
      notes: ""
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      {success ? (
        <div className="border-4 border-black bg-white rounded-3xl p-8 md:p-12 shadow-[10px_10px_0px_rgba(0,0,0,1)] text-center space-y-6">
          <div className="w-20 h-20 bg-[#baffc9] border-4 border-black rounded-full flex items-center justify-center shadow-[6px_6px_0px_rgba(0,0,0,1)] mx-auto animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-emerald-800" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 leading-tight">Đăng Ký Thành Công!</h2>
          <div className="max-w-md mx-auto space-y-4 font-bold text-sm text-gray-600 leading-relaxed">
            <p>
              Chúc mừng bé <span className="text-rose-500 font-extrabold">{formData.studentName}</span> đã ghi danh thành công vào lớp vẽ <span className="text-sky-500 font-extrabold">{formData.classId === "mam-non" ? "Mầm Non Sáng Tạo" : formData.classId === "nang-khieu" ? "Màu Nước Nâng Cao" : "Hội Họa Nghệ Sĩ Nhí"}</span>!
            </p>
            <div className="bg-amber-50 border-2 border-black rounded-2xl p-4 text-left space-y-2 text-xs text-amber-900 shadow-[3px_3px_0px_rgba(0,0,0,1)]">
              <p className="font-black">🎁 Quà tặng chào mừng khóa mới:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Bộ họa cụ vẽ màu cao cấp trị giá <strong>250.000đ</strong> miễn phí.</li>
                <li>Lịch kiểm tra trình độ & xếp lớp vẽ thử miễn phí.</li>
              </ul>
            </div>
            <p>
              Các cô tại trung tâm sẽ liên hệ với ba mẹ qua số điện thoại <strong>{formData.parentPhone}</strong> trong vòng 24h tới để xếp lịch học thử cho bé.
            </p>
          </div>
          <div className="pt-4">
            <button 
              onClick={resetForm}
              className="bg-sky-300 hover:bg-sky-400 border-3 border-black px-8 py-3 rounded-xl font-black text-sm shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
            >
              🔄 Đăng ký cho bé tiếp theo
            </button>
          </div>
        </div>
      ) : (
        <div className="border-4 border-black bg-white rounded-3xl p-6 md:p-10 shadow-[10px_10px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          
          {/* Top Stamp decoration */}
          <div className="absolute -top-4 -right-4 bg-rose-400 border-2 border-black text-black px-6 py-3 rounded-full rotate-12 shadow-md font-black text-xs uppercase z-10">
            🎨 Tặng Họa Cụ
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 text-left">
            
            {/* Section 1: Kid details */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-l-4 border-sky-500 pl-4">
                <h2 className="font-black text-xl text-sky-600 uppercase tracking-tight">
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
                    className="w-full border-3 border-black rounded-xl p-3 font-semibold bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-700 uppercase">Tuổi Của Bé *</label>
                  <Input
                    required
                    type="number"
                    min={4}
                    max={15}
                    value={formData.studentAge}
                    onChange={(e) => setFormData({...formData, studentAge: e.target.value})}
                    placeholder="Ví dụ: 7"
                    className="w-full border-3 border-black rounded-xl p-3 font-semibold bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Parent details */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-l-4 border-emerald-500 pl-4">
                <h2 className="font-black text-xl text-emerald-600 uppercase tracking-tight">
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
                    className="w-full border-3 border-black rounded-xl p-3 font-semibold bg-white"
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
                    className="w-full border-3 border-black rounded-xl p-3 font-semibold bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-700 uppercase">Email</label>
                  <Input
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) => setFormData({...formData, parentEmail: e.target.value})}
                    placeholder="example@mail.com"
                    className="w-full border-3 border-black rounded-xl p-3 font-semibold bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Course Selection */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-l-4 border-amber-500 pl-4">
                <h2 className="font-black text-xl text-amber-600 uppercase tracking-tight">
                  3. Chọn khóa học & Lịch mong muốn
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Course Radio Grid */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-700 uppercase block mb-1">Chọn Khóa Học Vẽ:</label>
                  
                  {/* Option 1 */}
                  <label className={`flex items-center gap-3 p-3.5 border-3 rounded-2xl cursor-pointer transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] ${
                    formData.classId === "mam-non" 
                      ? "bg-[#bae1ff]/30 border-sky-500 translate-x-0.5 translate-y-0.5 shadow-none" 
                      : "bg-white border-black hover:bg-gray-50"
                  }`}>
                    <input 
                      type="radio" 
                      name="classId" 
                      checked={formData.classId === "mam-non"}
                      onChange={() => setFormData({...formData, classId: "mam-non"})}
                      className="w-4 h-4 text-sky-600 focus:ring-0 focus:ring-offset-0 border-2 border-black" 
                    />
                    <Baby className="w-5 h-5 text-sky-600 shrink-0" />
                    <div>
                      <h4 className="font-black text-xs text-gray-800">Lớp Mầm Non Sáng Tạo</h4>
                      <p className="text-[10px] text-gray-400 font-semibold">Cho bé 4 - 6 tuổi</p>
                    </div>
                  </label>

                  {/* Option 2 */}
                  <label className={`flex items-center gap-3 p-3.5 border-3 rounded-2xl cursor-pointer transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] ${
                    formData.classId === "nang-khieu" 
                      ? "bg-[#baffc9]/30 border-emerald-500 translate-x-0.5 translate-y-0.5 shadow-none" 
                      : "bg-white border-black hover:bg-gray-50"
                  }`}>
                    <input 
                      type="radio" 
                      name="classId" 
                      checked={formData.classId === "nang-khieu"}
                      onChange={() => setFormData({...formData, classId: "nang-khieu"})}
                      className="w-4 h-4 text-emerald-600 focus:ring-0 focus:ring-offset-0 border-2 border-black" 
                    />
                    <Star className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="font-black text-xs text-gray-800">Lớp Màu Nước Nâng Cao</h4>
                      <p className="text-[10px] text-gray-400 font-semibold">Cho bé 7 - 9 tuổi</p>
                    </div>
                  </label>

                  {/* Option 3 */}
                  <label className={`flex items-center gap-3 p-3.5 border-3 rounded-2xl cursor-pointer transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] ${
                    formData.classId === "nghe-si" 
                      ? "bg-[#ffaaa6]/30 border-rose-500 translate-x-0.5 translate-y-0.5 shadow-none" 
                      : "bg-white border-black hover:bg-gray-50"
                  }`}>
                    <input 
                      type="radio" 
                      name="classId" 
                      checked={formData.classId === "nghe-si"}
                      onChange={() => setFormData({...formData, classId: "nghe-si"})}
                      className="w-4 h-4 text-rose-600 focus:ring-0 focus:ring-offset-0 border-2 border-black" 
                    />
                    <Award className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <h4 className="font-black text-xs text-gray-800">Lớp Hội Họa Nghệ Sĩ Nhí</h4>
                      <p className="text-[10px] text-gray-400 font-semibold">Cho bé 10 - 12 tuổi</p>
                    </div>
                  </label>
                </div>

                {/* Schedule & Notes */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-700 uppercase block mb-1">Thời Gian Học Mong Muốn:</label>
                    <select 
                      value={formData.schedulePreference}
                      onChange={(e) => setFormData({...formData, schedulePreference: e.target.value})}
                      className="w-full border-3 border-black bg-white rounded-xl p-3.5 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer text-xs"
                    >
                      <option>Sáng Thứ 7 (8:00 - 10:00)</option>
                      <option>Chiều Thứ 7 (14:00 - 16:00)</option>
                      <option>Sáng Chủ Nhật (8:00 - 10:00)</option>
                      <option>Chiều Chủ Nhật (14:00 - 16:00)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-700 uppercase block">Lời nhắn hoặc ghi chú học tập:</label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Ghi chú sở thích vẽ tranh của con hoặc lịch học bù mong muốn..."
                      className="w-full border-3 border-black rounded-xl p-3 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white resize-none text-xs"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Form Submit Action */}
            <div className="pt-6 border-t-2 border-black/10">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ff8b94] hover:bg-[#ff7b85] text-black font-black text-lg py-4 border-4 border-black rounded-2xl shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Đang gửi thông tin đăng ký...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 shrink-0" />
                    <span>Gửi Đăng Ký Ghi Danh</span>
                  </>
                )}
              </button>
              <p className="text-center text-xs font-bold text-gray-400 italic mt-3.5">
                * Sau khi đăng ký, các cô sẽ chủ động gọi điện xếp lịch lớp và chuẩn bị họa cụ sẵn sàng cho bé.
              </p>
            </div>

          </form>
        </div>
      )}
    </div>
  );
}
