import { Metadata } from "next";
import { 
  Palette, Sparkles, BookOpen, Heart, ArrowRight, Star, Award, ShieldCheck, CheckCircle2 
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Vẽ zì đó - Lớp học vẽ sáng tạo cho trẻ em 🎨",
  description: "Nuôi dưỡng đam mê nghệ thuật và kích hoạt tư duy sáng tạo của bé với giáo trình chuẩn, lớp học sinh động và cổng theo dõi kết quả trực quan.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fefaf0] overflow-hidden">
      
      {/* HERO SECTION */}
      <section className="relative py-12 md:py-20 px-4 md:px-8 border-b-4 border-black bg-[radial-gradient(circle_at_2px_2px,#bec7d1_1px,transparent_0)] bg-[size:24px_24px]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 bg-purple-100 border-3 border-black px-4 py-1.5 rounded-full shadow-[3px_3px_0px_rgba(0,0,0,1)] -rotate-1">
              <Sparkles className="w-4 h-4 text-purple-700 animate-spin" />
              <span className="text-xs font-black text-purple-800 uppercase tracking-wide">
                Nơi Ươm Mầm Nghệ Thuật Nhí
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight">
              Đánh thức sáng tạo <br className="hidden md:inline"/>
              <span className="bg-amber-300 border-4 border-black px-3 py-1 inline-block rounded-xl shadow-[5px_5px_0px_rgba(0,0,0,1)] rotate-1 mt-2">
                cùng Vẽ zì đó!
              </span>
            </h1>

            <p className="text-gray-600 font-bold text-base md:text-lg max-w-xl leading-relaxed">
              Khám phá thế giới màu sắc đầy niềm vui và nuôi dưỡng năng khiếu hội họa cho bé từ 4-12 tuổi. Phương pháp giáo dục hiện đại giúp bé tự tin thể hiện cá tính riêng.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link 
                href="/enroll"
                className="inline-flex items-center justify-center gap-2 bg-[#ff8b94] hover:bg-[#ff7b85] text-black font-black text-lg px-8 py-4 border-4 border-black rounded-2xl shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all text-center"
              >
                ✏️ Đăng ký học ngay
                <ArrowRight className="w-5 h-5 shrink-0" />
              </Link>
              
              <Link 
                href="/schedule"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-black font-black text-lg px-8 py-4 border-4 border-black rounded-2xl shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all text-center"
              >
                📅 Xem lịch học tuần này
              </Link>
            </div>

            {/* Quick trust badges */}
            <div className="flex flex-wrap gap-4 pt-4 text-xs font-black text-gray-700">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Dụng cụ chuẩn bị sẵn
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Báo cáo học tập online
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Giáo viên mỹ thuật chuyên nghiệp
              </div>
            </div>
          </div>

          {/* Hero Illustration */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative border-4 border-black bg-white rounded-[40px_20px_35px_15px] p-4 shadow-[12px_12px_0px_rgba(0,0,0,1)] -rotate-1 max-w-sm sm:max-w-md w-full overflow-hidden">
              <Image 
                src="/logo.png" 
                loading="eager"
                alt="Kid painting happily" 
                width={500}
                height={500}
                className="w-full h-auto object-cover rounded-[30px_15px_25px_10px] border-2 border-black"
              />
              <div className="absolute -bottom-2 -left-2 bg-sky-200 border-3 border-black px-4 py-2 font-black rounded-xl text-xs rotate-6 shadow-[3px_3px_0px_rgba(0,0,0,1)] text-black">
                🎨 Thỏa sức sáng tạo!
              </div>
              <div className="absolute top-4 -right-2 bg-yellow-300 border-3 border-black px-3 py-1 font-black rounded-lg text-xs -rotate-12 shadow-[3px_3px_0px_rgba(0,0,0,1)] text-black">
                🌟 Bé 4-12 tuổi
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* STATISTICS & TRUST ELEMENTS */}
      <section className="py-8 bg-sky-100 border-b-4 border-black">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-3 border-2 border-black bg-white rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,1)] rotate-1">
              <p className="text-3xl md:text-4xl font-black text-sky-600"></p>
              <p className="text-xs font-bold text-gray-500 mt-1 uppercase"></p>
            </div>
            <div className="p-3 border-2 border-black bg-white rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,1)] -rotate-1">
              <p className="text-3xl md:text-4xl font-black text-amber-500"></p>
              <p className="text-xs font-bold text-gray-500 mt-1 uppercase"></p>
            </div>
            <div className="p-3 border-2 border-black bg-white rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,1)] rotate-2">
              <p className="text-3xl md:text-4xl font-black text-rose-500"></p>
              <p className="text-xs font-bold text-gray-500 mt-1 uppercase"></p>
            </div>
            <div className="p-3 border-2 border-black bg-white rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,1)] -rotate-2">
              <p className="text-3xl md:text-4xl font-black text-purple-600"></p>
              <p className="text-xs font-bold text-gray-500 mt-1 uppercase"></p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE VALUE & METHOD SECTION */}
      <section className="py-16 px-4 md:px-8 max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">
            Tại sao ba mẹ tin tưởng lựa chọn <br/>
            <span className="text-sky-500">Vẽ zì đó?</span>
          </h2>
          <p className="text-gray-500 font-bold text-sm">
            Chúng tôi không dạy bé rập khuôn theo mẫu, mà tạo không gian khuyến khích trí tưởng tượng, rèn luyện kỹ năng quan sát và đôi tay khéo léo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          {/* Benefit 1 */}
          <div className="border-4 border-black bg-white rounded-3xl p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all space-y-4">
            <div className="w-12 h-12 bg-sky-200 border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              <Palette className="w-6 h-6 text-sky-700" />
            </div>
            <h3 className="text-xl font-black text-gray-900">Giáo Trình Sáng Tạo Tự Do</h3>
            <p className="text-sm font-semibold text-gray-500 leading-relaxed">
              Các bài học được nghiên cứu chuyên sâu, lồng ghép kể chuyện, trò chơi kích thích óc sáng tạo thay vì rập khuôn sao chép mẫu vẽ.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="border-4 border-black bg-white rounded-3xl p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all space-y-4 rotate-1">
            <div className="w-12 h-12 bg-amber-200 border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              <Award className="w-6 h-6 text-amber-700" />
            </div>
            <h3 className="text-xl font-black text-gray-900">Giáo Viên Chuẩn Mỹ Thuật</h3>
            <p className="text-sm font-semibold text-gray-500 leading-relaxed">
              Đội ngũ thầy cô tốt nghiệp các trường Đại học Mỹ thuật uy tín, có kỹ năng sư phạm mầm non và tràn đầy kiên nhẫn, tình yêu trẻ nhỏ.
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="border-4 border-black bg-white rounded-3xl p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all space-y-4 -rotate-1">
            <div className="w-12 h-12 bg-purple-200 border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              <ShieldCheck className="w-6 h-6 text-purple-700" />
            </div>
            <h3 className="text-xl font-black text-gray-900">Theo Dõi Kết Quả Trực Quan</h3>
            <p className="text-sm font-semibold text-gray-500 leading-relaxed">
              Cổng thông tin phụ huynh tích hợp xem chi tiết số buổi học, chuyên cần và triển lãm các tác phẩm tranh vẽ kèm nhận xét từ giáo viên qua Mã học viên.
            </p>
          </div>
        </div>
      </section>

      {/* HIGHLIGHT COURSES PREVIEW */}
      <section className="py-16 px-4 md:px-8 bg-amber-50/50 border-t-4 border-b-4 border-black">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="text-left space-y-3">
              <span className="inline-block text-xs bg-rose-100 border-2 border-black rounded-lg px-3 py-1 mb-4 font-black text-rose-800 shadow-[2px_2px_0px_rgba(0,0,0,1)] uppercase tracking-wider">
                Khóa học tiêu biểu
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900">
                Lộ trình học tập phù hợp độ tuổi
              </h2>
            </div>
            <Link 
              href="/pricing"
              className="inline-flex items-center gap-1.5 font-black text-sky-600 text-sm hover:underline hover:scale-105 transition-all self-start md:self-auto"
            >
              Xem tất cả bảng giá & khóa học <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Course 1 */}
            <div className="border-4 border-black bg-white rounded-3xl overflow-hidden shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
              <div className="p-6 space-y-4">
                <span className="inline-block text-[10px] bg-blue-100 border-2 border-black px-2 py-0.5 rounded font-black text-blue-800 uppercase tracking-wide">
                  Mầm Non (4-6 tuổi)
                </span>
                <h3 className="text-2xl font-black text-gray-900">Khóa Vẽ Sáng Tạo Mầm Non</h3>
                <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                  Làm quen với chất liệu màu cơ bản, học cách nhận diện hình khối thông qua các câu chuyện kể, bồi đắp hứng thú hội họa tự nhiên cho bé.
                </p>
              </div>
              <div className="p-6 border-t-2 border-black bg-blue-50/20 flex items-center justify-between">
                <span className="font-black text-lg text-gray-900">1.200.000đ<span className="text-xs font-bold text-gray-400">/tháng</span></span>
                <Link 
                  href="/enroll" 
                  className="bg-white border-2 border-black px-3.5 py-1.5 rounded-xl text-xs font-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-gray-50 transition-all text-center"
                >
                  Đăng ký ngay
                </Link>
              </div>
            </div>

            {/* Course 2 */}
            <div className="border-4 border-black bg-white rounded-3xl overflow-hidden shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col justify-between md:scale-105 border-sky-500 shadow-sky-500/10">
              <div className="p-6 space-y-4">
                <span className="inline-block text-[10px] bg-emerald-100 border-2 border-black px-2 py-0.5 rounded font-black text-emerald-800 uppercase tracking-wide">
                  Thiếu Nhi (7-9 tuổi)
                </span>
                <h3 className="text-2xl font-black text-gray-900">Khóa Màu Nước Nâng Cao</h3>
                <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                  Phát triển chuyên sâu kỹ năng phối màu, kỹ thuật dựng hình nâng cao với bột màu, acrylic, màu nước và các dự án thiết kế sáng tạo.
                </p>
              </div>
              <div className="p-6 border-t-2 border-black bg-emerald-50/20 flex items-center justify-between">
                <span className="font-black text-lg text-gray-900">2.000.000đ<span className="text-xs font-bold text-gray-400">/tháng</span></span>
                <Link 
                  href="/enroll" 
                  className="bg-amber-300 hover:bg-amber-400 border-2 border-black px-3.5 py-1.5 rounded-xl text-xs font-black shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all text-center"
                >
                  Đăng ký học
                </Link>
              </div>
            </div>

            {/* Course 3 */}
            <div className="border-4 border-black bg-white rounded-3xl overflow-hidden shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
              <div className="p-6 space-y-4">
                <span className="inline-block text-[10px] bg-purple-100 border-2 border-black px-2 py-0.5 rounded font-black text-purple-800 uppercase tracking-wide">
                  Thiếu Niên (10-12 tuổi)
                </span>
                <h3 className="text-2xl font-black text-gray-900">Hội Họa Nghệ Sĩ Nhí</h3>
                <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                  Trải nghiệm vẽ tranh sơn dầu nghệ thuật, kỹ thuật bố cục nâng cao, thiết kế nhân vật truyện tranh và xây dựng tác phẩm triển lãm cá nhân.
                </p>
              </div>
              <div className="p-6 border-t-2 border-black bg-purple-50/20 flex items-center justify-between">
                <span className="font-black text-lg text-gray-900">2.800.000đ<span className="text-xs font-bold text-gray-400">/tháng</span></span>
                <Link 
                  href="/enroll" 
                  className="bg-white border-2 border-black px-3.5 py-1.5 rounded-xl text-xs font-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-gray-50 transition-all text-center"
                >
                  Đăng ký ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION BLOCK */}
      <section className="py-16 px-4 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">
          Cùng con khám phá tiềm năng hội họa <br/>
          ngay hôm nay!
        </h2>
        <p className="text-gray-500 font-bold text-sm max-w-lg mx-auto">
          Các bé đăng ký học thử sẽ được tặng bộ họa cụ vẽ cơ bản trị giá 250.000đ. Đăng ký nhận lịch học thử miễn phí ngay.
        </p>
        <div className="pt-4">
          <Link 
            href="/enroll"
            className="inline-flex items-center gap-2 bg-amber-300 hover:bg-amber-400 text-black font-black text-xl px-10 py-5 border-4 border-black rounded-2xl shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-all"
          >
            ✏️ Nhận Lịch Học Thử Cho Bé
          </Link>
        </div>
        <p className="text-[11px] font-bold text-gray-400 italic">
          * Áp dụng cho học viên đăng ký mới tại trung tâm
        </p>
      </section>

    </main>
  );
}
