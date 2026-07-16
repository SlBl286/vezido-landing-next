import { Metadata } from "next";
import { 
  Palette, Sparkles, BookOpen, Heart, ArrowRight, Star, Award, ShieldCheck, CheckCircle2, UserCheck, Image as ImageIcon
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface Teacher {
  name: string;
  role: string;
  avatar: string;
  achievements?: string[];
}

export const metadata: Metadata = {
  title: "Vẽ zì đó - Lớp học vẽ sáng tạo cho trẻ em 🎨",
  description: "Nuôi dưỡng đam mê nghệ thuật và kích hoạt tư duy sáng tạo của bé với giáo trình chuẩn, lớp học sinh động và cổng theo dõi kết quả trực quan.",
};

export default async function Home() {
  // Fetch site settings
  const dbSettings = await prisma.siteSetting.findMany();
  const settings = dbSettings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  // Fetch active courses
  const dbCourses = await prisma.course.findMany({
    where: { isActive: true },
    include: { classCategory: true },
    orderBy: { createdAt: "asc" }
  });

  // Parse JSON configs with fallbacks
  const heroTitle = settings.hero_title || "Đánh thức sáng tạo cùng Vẽ zì đó!";
  const heroDescription = settings.hero_description || "Khám phá thế giới màu sắc đầy niềm vui và nuôi dưỡng năng khiếu hội họa cho bé từ 4-15 tuổi. Phương pháp giáo dục hiện đại giúp bé tự tin thể hiện cá tính riêng.";
  const aboutText = settings.about_text || "“VẼ ZÌ ĐÓ” là một dự nơi đặc biệt dành cho các bạn nhỏ yêu thích sáng tạo nghệ thuật...";
  const aboutImage = settings.about_image || "/info/726336653_1665133681457496_715771583886802936_n.jpg";

  let stats = [
    { count: "150+", label: "HỌC VIÊN ĐANG THEO HỌC" },
    { count: "12+", label: "LỚP HỌC MỞ HÀNG TUẦN" },
    { count: "5+", label: "CHUYÊN ĐỀ HỘI HỌA ĐA DẠNG" },
    { count: "100%", label: "BÉ PHÁT TRIỂN SÁNG TẠO" }
  ];
  if (settings.stats) {
    try { stats = JSON.parse(settings.stats); } catch (_) {}
  }

  let benefits = [
    { title: "Giáo Trình Sáng Tạo Độc Quyền", description: "Mỗi bài học được thiết kế phù hợp với từng độ tuổi, kết hợp kể chuyện, trò chơi và các hoạt động trải nghiệm nhằm khơi gợi tư duy sáng tạo, giúp bé học vẽ bằng cảm hứng thay vì sao chép theo mẫu.", color: "bg-sky-200" },
    { title: "Đội Ngũ Giáo Viên Chuyên Môn Cao", description: "Giáo viên tốt nghiệp từ các trường Đại học Mỹ thuật uy tín, giàu kinh nghiệm giảng dạy trẻ em, luôn tận tâm, kiên nhẫn và đồng hành cùng mỗi bé trên hành trình phát triển khả năng nghệ thuật.", color: "bg-amber-200" },
    { title: "Đồng Hành Cùng Ba Mẹ Trên Mỗi Bước Tiến", description: "Phụ huynh dễ dàng theo dõi quá trình học của con thông qua cổng thông tin trực tuyến với đầy đủ lịch sử học tập, tình hình chuyên cần, bộ sưu tập tác phẩm và nhận xét chi tiết từ giáo viên theo từng giai đoạn.", color: "bg-purple-200" }
  ];
  if (settings.benefits) {
    try { benefits = JSON.parse(settings.benefits); } catch (_) {}
  }

  let teachers = [];
  if (settings.teachers) {
    try { teachers = JSON.parse(settings.teachers); } catch (_) {}
  }

  let galleryImages = [];
  if (settings.gallery_images) {
    try { galleryImages = JSON.parse(settings.gallery_images); } catch (_) {}
  }

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
              {heroTitle.split(" cùng ")[0]} <br className="hidden md:inline"/>
              <span className="bg-amber-300 border-4 border-black px-3 py-1 inline-block rounded-xl shadow-[5px_5px_0px_rgba(0,0,0,1)] rotate-1 mt-2">
                cùng {heroTitle.split(" cùng ")[1] || "Vẽ zì đó!"}
              </span>
            </h1>

            <p className="text-gray-600 font-bold text-base md:text-lg max-w-xl leading-relaxed">
              {heroDescription}
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
                src="/info/727158076_1436957738241623_3992754550351923949_n.jpg" 
                loading="eager"
                alt="Kid painting happily" 
                width={500}
                height={500}
                className="w-full h-auto object-cover rounded-[30px_15px_25px_10px] border-2 border-black aspect-square"
              />
              <div className="absolute -bottom-2 -left-2 bg-sky-200 border-3 border-black px-4 py-2 font-black rounded-xl text-xs rotate-6 shadow-[3px_3px_0px_rgba(0,0,0,1)] text-black">
                🎨 Thỏa sức sáng tạo!
              </div>
              <div className="absolute top-4 -right-2 bg-yellow-300 border-3 border-black px-3 py-1 font-black rounded-lg text-xs -rotate-12 shadow-[3px_3px_0px_rgba(0,0,0,1)] text-black">
                🌟 Bé 4-15 tuổi
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ABOUT US DETAIL SECTION */}
      <section className="py-16 px-4 md:px-8 border-b-4 border-black bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 relative flex justify-center order-2 lg:order-1">
            <div className="relative border-4 border-black bg-white rounded-[40px_20px_35px_15px] p-4 shadow-[12px_12px_0px_rgba(0,0,0,1)] rotate-1 max-w-sm w-full overflow-hidden">
              <Image 
                src={aboutImage} 
                alt="Vẽ zì đó classroom" 
                width={500}
                height={500}
                className="w-full h-auto object-cover rounded-[30px_15px_25px_10px] border-2 border-black aspect-[4/3]"
              />
            </div>
          </div>
          <div className="lg:col-span-7 space-y-6 text-left order-1 lg:order-2">
            <span className="inline-block text-xs bg-amber-100 border-2 border-black rounded-lg px-3 py-1 font-black text-amber-800 shadow-[2px_2px_0px_rgba(0,0,0,1)] uppercase tracking-wider">
              Về chúng tôi
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
              Giới thiệu dự án nghệ thuật <span className="text-sky-500">VẼ ZÌ ĐÓ</span>
            </h2>
            <p className="text-gray-700 font-bold text-sm md:text-base leading-relaxed whitespace-pre-wrap">
              {aboutText}
            </p>
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
Tại Vẽ Zì Đó, mỗi bức tranh đều mang dấu ấn riêng của từng bé. Chúng tôi tạo môi trường để trẻ tự do khám phá, phát huy trí tưởng tượng, rèn luyện khả năng quan sát và sự khéo léo qua từng nét vẽ.          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          {benefits.map((benefit, i) => (
            <div 
              key={i} 
              className={`border-4 border-black bg-white rounded-3xl p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all space-y-4 ${
                i % 2 === 0 ? "rotate-1" : "-rotate-1"
              }`}
            >
              <div className={`w-12 h-12 ${benefit.color || "bg-sky-200"} border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)]`}>
                {i === 0 ? (
                  <Palette className="w-6 h-6 text-black" />
                ) : i === 1 ? (
                  <Award className="w-6 h-6 text-black" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-black" />
                )}
              </div>
              <h3 className="text-xl font-black text-gray-900">{benefit.title}</h3>
              <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* TEACHERS TEAM SECTION */}
      {teachers.length > 0 && (
        <section className="py-16 px-4 md:px-8 bg-[#fdf5e6] border-t-4 border-black">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <span className="inline-block text-xs bg-purple-100 border-2 border-black rounded-lg px-3 py-1 font-black text-purple-800 shadow-[2px_2px_0px_rgba(0,0,0,1)] uppercase tracking-wider">
                Đội ngũ chuyên môn
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">
                Đội ngũ sáng lập & Giảng viên
              </h2>
              <p className="text-gray-500 font-bold text-sm">
                Giàu chuyên môn, tận tâm và thấu hiểu tâm lý trẻ.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              {teachers.map((teacher: Teacher, i: number) => (
                <div 
                  key={i} 
                  className={`border-4 border-black bg-white rounded-3xl p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-6 items-start transition-all ${
                    i % 2 === 0 ? "rotate-1" : "-rotate-1"
                  }`}
                >
                  <div className="relative border-3 border-black bg-white rounded-2xl p-1.5 shadow-[3px_3px_0px_rgba(0,0,0,1)] max-w-[150px] w-full shrink-0 mx-auto md:mx-0">
                    <Image 
                      src={teacher.avatar || "/logo.png"} 
                      alt={teacher.name} 
                      width={150} 
                      height={150} 
                      className="w-full h-auto object-cover rounded-xl border-2 border-black aspect-square"
                    />
                  </div>
                  <div className="space-y-3 flex-1">
                    <div>
                      <h3 className="text-xl font-black text-gray-900">{teacher.name}</h3>
                      <p className="text-xs font-black text-sky-600 uppercase mt-0.5">{teacher.role}</p>
                    </div>
                    <ul className="space-y-1.5">
                      {teacher.achievements?.map((ach, idx) => (
                        <li key={idx} className="text-[11px] font-semibold text-gray-600 flex items-start gap-1.5 leading-relaxed">
                          <span className="text-sky-500 mt-1 shrink-0">✨</span>
                          <span>{ach}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GALLERY PHOTOS SECTION */}
      {galleryImages.length > 0 && (
        <section className="py-16 px-4 md:px-8 bg-white border-t-4 border-black">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <span className="inline-block text-xs bg-sky-100 border-2 border-black rounded-lg px-3 py-1 font-black text-sky-800 shadow-[2px_2px_0px_rgba(0,0,0,1)] uppercase tracking-wider">
                Thư viện hình ảnh
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">
                Không gian lớp học & Tác phẩm
              </h2>
              <p className="text-gray-500 font-bold text-sm">
                Một vài khoảnh khắc đáng yêu tại các lớp học vẽ máy và vẽ màu truyền thống của các bé.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4">
              {galleryImages.map((imgUrl: string, idx: number) => (
                <div 
                  key={idx} 
                  className={`border-3 border-black bg-white rounded-2xl p-1.5 shadow-[3px_3px_0px_rgba(0,0,0,1)] overflow-hidden hover:scale-105 transition-all cursor-pointer ${
                    idx % 2 === 0 ? "rotate-2" : "-rotate-2"
                  }`}
                >
                  <Image 
                    src={imgUrl} 
                    alt={`Classroom photo ${idx + 1}`} 
                    width={300} 
                    height={300} 
                    className="w-full h-auto object-cover rounded-xl border-2 border-black aspect-square"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
            {dbCourses.slice(0, 3).map((course, i) => (
              <div 
                key={course.id} 
                className={`border-4 border-black bg-white rounded-3xl overflow-hidden shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col justify-between ${
                  i === 1 ? "md:scale-105 border-sky-500 shadow-sky-500/10" : ""
                }`}
              >
                <div className="p-6 space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {course.classCategory && (
                      <span className="inline-block text-[9px] border-2 border-black px-2 py-0.5 rounded font-black uppercase tracking-wide bg-blue-100 text-blue-800">
                        🏷️ {course.classCategory.name}
                      </span>
                    )}
                    {course.level && (
                      <span className="inline-block text-[9px] border-2 border-black px-2 py-0.5 rounded font-black uppercase tracking-wide bg-[#ffd275] text-amber-950">
                        ⚡ {course.level}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 leading-snug">{course.title}</h3>
                  <p className="text-xs font-semibold text-gray-500 leading-relaxed line-clamp-3">
                    {course.audience}
                  </p>
                </div>
                <div className="p-6 border-t-2 border-black bg-amber-50/10 flex items-center justify-between">
                  <span className="font-black text-lg text-gray-900">
                    {course.fee?.toLocaleString("vi-VN")}đ
                    <span className="text-xs font-bold text-gray-400">/{course.feeUnit}</span>
                  </span>
                  <Link 
                    href="/enroll" 
                    className={`border-2 border-black px-3.5 py-1.5 rounded-xl text-xs font-black shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all text-center ${
                      i === 1 ? "bg-amber-300 hover:bg-amber-400" : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    Đăng ký học
                  </Link>
                </div>
              </div>
            ))}
            {dbCourses.length === 0 && (
              <p className="col-span-3 text-center font-bold text-gray-400 italic">Chưa có khóa học động nào được tạo trong DB.</p>
            )}
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
          Đăng ký nhận lịch học thử miễn phí cho bé để trải nghiệm không gian học tập sáng tạo ngay.
        </p>
        <div className="pt-4">
          <Link 
            href="/enroll"
            className="inline-flex items-center gap-2 bg-amber-300 hover:bg-amber-400 text-black font-black text-xl px-10 py-5 border-4 border-black rounded-2xl shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-all"
          >
            ✏️ Nhận Lịch Học Thử Cho Bé
          </Link>
        </div>
      </section>

    </main>
  );
}
