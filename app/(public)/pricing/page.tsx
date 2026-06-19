import { Metadata } from "next";
import { 
  Baby, Calendar, PaintBucket, Star, Award, ShieldCheck, CheckCircle2, BookOpen, Layers, Gift
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Vẽ zì đó - Bảng giá khóa học vẽ 🎨",
  description: "Chi tiết học phí các lớp vẽ sáng tạo mầm non, màu nước nâng cao và nghệ sĩ nhí chuyên nghiệp. Đăng ký học thử miễn phí cho bé.",
};

export default async function PricingPage() {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" }
  });

  const ageBasedCourses = courses.filter(c => c.type === "AGE_BASED");
  const specializedCourses = courses.filter(c => c.type === "SPECIALIZED");

  const getCourseStyle = (idx: number) => {
    const styles = [
      { color: "bg-[#bae1ff]", textColor: "text-sky-800", icon: Baby, border: "border-sky-500" },
      { color: "bg-[#baffc9]", textColor: "text-emerald-800", icon: Star, border: "border-emerald-500" },
      { color: "bg-[#ffaaa6]", textColor: "text-rose-800", icon: Award, border: "border-rose-500" },
      { color: "bg-[#ffffba]", textColor: "text-amber-800", icon: PaintBucket, border: "border-amber-500" }
    ];
    return styles[idx % styles.length];
  };

  return (
    <main className="min-h-screen bg-[#fefaf0] py-12 px-4 md:px-8 bg-[radial-gradient(circle_at_2px_2px,#bec7d1_1px,transparent_0)] bg-[size:24px_24px]">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Title Header */}
        <header className="text-center max-w-2xl mx-auto space-y-3">
          <span className="inline-block text-sm bg-purple-100 border-2 border-black rounded-lg px-3 py-1 font-black text-purple-800 shadow-[2px_2px_0px_rgba(0,0,0,1)] uppercase tracking-wider">
            Biểu phí & Khóa học
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">
            Khóa Học & Học Phí
          </h1>
          <p className="text-gray-500 font-semibold text-sm">
            Học phí đã bao gồm toàn bộ họa cụ cao cấp tại lớp. Trung tâm cam kết không phát sinh bất kỳ khoản chi phí nào khác trong suốt quá trình học tập.
          </p>
        </header>

        {/* SECTION 1: LỘ TRÌNH THEO ĐỘ TUỔI */}
        <div className="space-y-8">
          <div className="text-left space-y-2 border-l-4 border-black pl-4">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">
              🌱 Lộ trình học tập theo độ tuổi
            </h2>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Phát triển tư duy mỹ thuật toàn diện cho bé từ 4-15 tuổi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            {ageBasedCourses.map((course, idx) => {
              const style = getCourseStyle(idx);
              const Icon = style.icon;
              return (
                <div 
                  key={course.id}
                  className={`border-4 border-black bg-white rounded-3xl p-6 md:p-8 flex flex-col justify-between relative shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-1.5 transition-all duration-200`}
                >
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <span className={`inline-block text-[10px] ${style.color} ${style.textColor} border-2 border-black px-2.5 py-1 rounded font-black uppercase tracking-wide`}>
                        {course.title}
                      </span>
                      <Icon className="w-6 h-6 text-gray-400 shrink-0" />
                    </div>

                    {/* Age & Price */}
                    <div className="space-y-2">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-wide">🎯 {course.audience}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-gray-900">
                          {course.fee?.toLocaleString("vi-VN")} đ
                        </span>
                        <span className="text-xs font-bold text-gray-400">/{course.feeUnit}</span>
                        {course.feeNote && (
                          <span className="text-[10px] text-gray-500 font-extrabold italic ml-1">({course.feeNote})</span>
                        )}
                      </div>
                    </div>

                    {/* Details Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-gray-700 pt-2 border-t border-black/10">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-sky-500 shrink-0" />
                        <span>Thời lượng: {course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <PaintBucket className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Họa cụ: Miễn phí 100% tại lớp</span>
                      </div>
                    </div>

                    {/* Objectives / Goals */}
                    {course.objectives?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Mục tiêu phát triển:</p>
                        <ul className="space-y-2 text-xs font-bold text-gray-600">
                          {course.objectives.map((obj: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Content / Curriculum */}
                    {course.content?.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-black/10">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Lộ trình học tập mẫu:</p>
                        <div className="grid grid-cols-1 gap-1.5">
                          {course.content.map((lesson: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 bg-gray-50 border-2 border-black rounded-lg p-2 text-xs font-semibold text-gray-700">
                              <span className="bg-[#ffd275] border border-black rounded px-1 text-[9px] font-black text-black shrink-0 mt-0.5">Lộ trình {i+1}</span>
                              <span>{lesson}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Benefits / Promotions */}
                    {course.benefits?.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-black/10">
                        <p className="text-[10px] font-black text-purple-700 uppercase tracking-wider">🎁 Ưu đãi & Khuyến mại:</p>
                        <ul className="space-y-1 text-xs font-bold text-purple-900">
                          {course.benefits.map((ben: string, i: number) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <span className="text-purple-600">✨</span>
                              <span>{ben}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Button Action */}
                  <div className="pt-6">
                    <Link 
                      href={`/enroll?course=${encodeURIComponent(course.title)}`}
                      className={`block w-full py-3.5 text-center font-black rounded-xl border-3 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-[#ffc342] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_rgba(0,0,0,1)] bg-[#ffd275] text-black text-sm`}
                    >
                      Đăng Ký Học Thử Miễn Phí
                    </Link>
                  </div>

                </div>
              );
            })}
            {ageBasedCourses.length === 0 && (
              <p className="col-span-2 text-center text-gray-400 italic">Chưa có khóa học theo tuổi nào được tạo.</p>
            )}
          </div>
        </div>

        {/* SECTION 2: CHUYÊN ĐỀ NGHỆ THUẬT */}
        <div className="space-y-8">
          <div className="text-left space-y-2 border-l-4 border-black pl-4">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">
              🎨 Chuyên đề nghệ thuật chuyên sâu
            </h2>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Lớp chuyên đề giúp học viên từng bước tiếp xúc bài bản với các chất liệu chuyên sâu
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            {specializedCourses.map((course, idx) => {
              const style = getCourseStyle(idx + 2);
              const Icon = style.icon;
              return (
                <div 
                  key={course.id}
                  className={`border-4 border-black bg-white rounded-3xl p-6 md:p-8 flex flex-col justify-between relative shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-1.5 transition-all duration-200`}
                >
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <span className={`inline-block text-[10px] ${style.color} ${style.textColor} border-2 border-black px-2.5 py-1 rounded font-black uppercase tracking-wide`}>
                        {course.title}
                      </span>
                      <Icon className="w-6 h-6 text-gray-400 shrink-0" />
                    </div>

                    {/* Age & Price */}
                    <div className="space-y-2">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-wide">🎯 {course.audience}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-gray-900">
                          {course.fee?.toLocaleString("vi-VN")} đ
                        </span>
                        <span className="text-xs font-bold text-gray-400">/{course.feeUnit}</span>
                        {course.feeNote && (
                          <span className="text-[10px] text-gray-500 font-extrabold italic ml-1">({course.feeNote})</span>
                        )}
                      </div>
                    </div>

                    {/* Details Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-gray-700 pt-2 border-t border-black/10">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-sky-500 shrink-0" />
                        <span>Thời lượng: {course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <PaintBucket className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Họa cụ: Miễn phí 100% tại lớp</span>
                      </div>
                    </div>

                    {/* Objectives / Goals */}
                    {course.objectives?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Mục tiêu phát triển:</p>
                        <ul className="space-y-2 text-xs font-bold text-gray-600">
                          {course.objectives.map((obj: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Content / Curriculum */}
                    {course.content?.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-black/10">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Lộ trình học tập chuyên đề:</p>
                        <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
                          {course.content.map((lesson: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 bg-gray-50 border-2 border-black rounded-lg p-2 text-xs font-semibold text-gray-700">
                              <span className="bg-[#ffd275] border border-black rounded px-1 text-[9px] font-black text-black shrink-0 mt-0.5">Buổi {i+1}</span>
                              <span>{lesson}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Benefits / Promotions */}
                    {course.benefits?.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-black/10">
                        <p className="text-[10px] font-black text-purple-700 uppercase tracking-wider">🎁 Ưu đãi đính kèm:</p>
                        <ul className="space-y-1 text-xs font-bold text-purple-900">
                          {course.benefits.map((ben: string, i: number) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <span className="text-purple-600">✨</span>
                              <span>{ben}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Button Action */}
                  <div className="pt-6">
                    <Link 
                      href={`/enroll?course=${encodeURIComponent(course.title)}`}
                      className={`block w-full py-3.5 text-center font-black rounded-xl border-3 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-[#a2d4fc] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_rgba(0,0,0,1)] bg-[#bae1ff] text-black text-sm`}
                    >
                      Đăng Ký Khóa Học Máy/Màu
                    </Link>
                  </div>

                </div>
              );
            })}
            {specializedCourses.length === 0 && (
              <p className="col-span-2 text-center text-gray-400 italic">Chưa có khóa học chuyên đề nào được tạo.</p>
            )}
          </div>
        </div>

        {/* FAQ Commitment Banner */}
        <div className="max-w-4xl mx-auto border-4 border-black bg-amber-50 rounded-3xl p-6 md:p-8 shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-left space-y-2">
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-sky-500" /> Cam Kết Chất Lượng
            </h3>
            <p className="text-xs font-semibold text-gray-500 leading-relaxed max-w-xl">
              Học viên được hoàn trả 100% học phí buổi học nếu bé không hào hứng hoặc ba mẹ không hài lòng với phương pháp giảng dạy trong 2 buổi đầu tiên.
            </p>
          </div>
          <Link 
            href="/contact"
            className="shrink-0 bg-white border-3 border-black font-black text-xs px-6 py-3 rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:bg-gray-50 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
          >
            💬 Nhận Tư Vấn Thêm
          </Link>
        </div>

      </div>
    </main>
  );
}
