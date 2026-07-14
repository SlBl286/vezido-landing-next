"use client";

import React, { useState } from "react";
import { 
  MapPin, Phone, Mail, Clock, Send, Sparkles, CheckCircle2, RefreshCw 
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Có lỗi xảy ra, vui lòng thử lại sau.");
        return;
      }

      setSuccess(true);
      setFormData({ name: "", phone: "", email: "", message: "" });
    } catch (err) {
      alert("Không thể kết nối server, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fefaf0] py-12 px-4 md:px-8 bg-[radial-gradient(circle_at_2px_2px,#bec7d1_1px,transparent_0)] bg-[size:24px_24px]">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Title Header */}
        <header className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-sm bg-amber-100 border-2 border-black rounded-lg px-3 py-1 font-black text-amber-800 shadow-[2px_2px_0px_rgba(0,0,0,1)] uppercase tracking-wider">
            Liên hệ với chúng tôi
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">
            Kết Nối Với Vẽ zì đó
          </h1>
          <p className="text-gray-500 font-semibold text-sm">
            Ba mẹ có thắc mắc về chương trình học, học phí, lịch học thử? Hãy nhắn gửi thông tin, các cô sẽ liên hệ tư vấn chi tiết trong vòng 24 giờ làm việc.
          </p>
        </header>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Contact info cards */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Info Cards */}
            <div className="border-4 border-black bg-white rounded-3xl p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] space-y-6">
              <h2 className="text-2xl font-black text-gray-900 border-b-2 border-black pb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" /> Thông Tin Trụ Sở
              </h2>

              <div className="space-y-5">
                {/* Location */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-sky-200 border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)] shrink-0">
                    <MapPin className="w-5 h-5 text-sky-800" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-gray-800">Địa chỉ trung tâm:</h4>
                    <p className="text-xs font-semibold text-gray-500 mt-0.5">108c Vương Thừa Vũ, Thanh Xuân, Hà Nội</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-emerald-200 border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)] shrink-0">
                    <Phone className="w-5 h-5 text-emerald-800" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-gray-800">Điện thoại hotline:</h4>
                    <p className="text-xs font-semibold text-gray-500 mt-0.5">0348.823.095 (Cô Phụng)</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-purple-200 border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)] shrink-0">
                    <Mail className="w-5 h-5 text-purple-800" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-gray-800">Hòm thư điện tử:</h4>
                    <p className="text-xs font-semibold text-gray-500 mt-0.5">lienhe@vezido.ink</p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-amber-200 border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)] shrink-0">
                    <Clock className="w-5 h-5 text-amber-800" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-gray-800">Giờ làm việc:</h4>
                    <p className="text-xs font-semibold text-gray-500 mt-0.5">08:00 - 20:30 (Tất cả các ngày trong tuần)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Maps Embed */}
            <div className="border-4 border-black bg-white rounded-3xl p-4 shadow-[6px_6px_0px_rgba(0,0,0,1)] overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d670.6393499094531!2d105.82160983429013!3d20.998527895696505!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ac8f606efb77%3A0x2168cabca42e3d5e!2zMTA4YyBQLiBWxrDGoW5nIFRo4burYSBWxaksIFThu5UgMTUsIEtoxrDGoW5nIMSQw6xuaCwgSMOgIE7hu5lpLCBWaWV0bmFt!5e0!3m2!1sen!2s!4v1780731494669!5m2!1sen!2s"
                width="100%"
                height="220"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-2xl border-2 border-black w-full"
                title="Bản đồ vị trí Vẽ zì đó - 108c Vương Thừa Vũ, Thanh Xuân"
              />
            </div>

          </div>

          {/* Right Column: Contact Message Form */}
          <div className="lg:col-span-7">
            <div className="border-4 border-black bg-white rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
              {success ? (
                <div className="py-12 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-[#baffc9] border-4 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                    <CheckCircle2 className="w-8 h-8 text-emerald-800" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900">Gửi Tin Nhắn Thành Công!</h3>
                  <p className="text-gray-500 font-bold text-sm max-w-sm">
                    Cảm ơn ba mẹ đã kết nối. Các cô tại trung tâm Vẽ zì đó sẽ phản hồi hoặc liên hệ lại với ba mẹ qua số điện thoại/email sớm nhất nhé!
                  </p>
                  <button 
                    onClick={() => setSuccess(false)}
                    className="mt-4 border-2 border-black bg-white hover:bg-gray-50 px-5 py-2 rounded-xl text-xs font-black shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                  >
                    Gửi tin nhắn khác
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 text-left">
                  <h3 className="text-xl font-black text-gray-900 border-b-2 border-black pb-2">
                    💬 Gửi Yêu Cầu Tư Vấn
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-gray-700 uppercase">Họ & Tên Ba Mẹ *</label>
                        <Input 
                          type="text" 
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="Ví dụ: Nguyễn Văn A"
                          className="w-full border-3 border-black rounded-xl p-3 font-semibold bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-gray-700 uppercase">Số Điện Thoại Liên Hệ *</label>
                        <Input 
                          type="tel" 
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          placeholder="Ví dụ: 0987654321"
                          className="w-full border-3 border-black rounded-xl p-3 font-semibold bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-700 uppercase">Địa Chỉ Email</label>
                      <Input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="example@gmail.com"
                        className="w-full border-3 border-black rounded-xl p-3 font-semibold bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-700 uppercase">Lời Nhắn / Nội Dung Thắc Mắc *</label>
                      <textarea
                        required
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        placeholder="Ba mẹ muốn tìm hiểu lớp vẽ cho bé mấy tuổi, lịch học thử ra sao..."
                        className="w-full border-3 border-black rounded-xl p-3 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-amber-300 hover:bg-amber-400 border-4 border-black font-black text-base py-4 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Đang gửi thông tin...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 shrink-0" />
                          <span>Gửi Tin Nhắn Cho Các Cô</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
