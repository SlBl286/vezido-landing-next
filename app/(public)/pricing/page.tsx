import { Metadata } from "next";
import { 
  Baby, Calendar, PaintBucket, Star, Award, ShieldCheck, CheckCircle2
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Vẽ zì đó - Bảng giá khóa học vẽ 🎨",
  description: "Chi tiết học phí các lớp vẽ sáng tạo mầm non, màu nước nâng cao và nghệ sĩ nhí chuyên nghiệp. Đăng ký học thử miễn phí cho bé.",
};

const PLANS = [
  {
    id: "mam-non",
    title: "Lớp Mầm Non",
    age: "Dành cho bé 4 - 6 tuổi",
    price: "1.200.000đ",
    frequency: "4 buổi / tháng",
    color: "bg-[#bae1ff]",
    borderColor: "border-sky-500",
    textColor: "text-sky-800",
    icon: Baby,
    features: [
      "Làm quen với hình khối, màu vẽ cơ bản",
      "Kể chuyện bằng tranh vẽ",
      "Học phẩm chuẩn bị sẵn tại lớp",
      "Trưng bày tranh online & offline",
    ],
  },
  {
    id: "nang-khieu",
    title: "Lớp Năng Khiếu",
    age: "Dành cho bé 7 - 9 tuổi",
    price: "2.000.000đ",
    frequency: "8 buổi / tháng",
    color: "bg-[#baffc9]",
    borderColor: "border-emerald-500",
    textColor: "text-emerald-800",
    icon: Star,
    popular: true,
    features: [
      "Kỹ thuật phối màu nước, acrylic nâng cao",
      "Học vẽ dựng hình & bố cục nâng cao",
      "Tự chọn đề tài theo sở thích bé",
      "Có chứng chỉ kết thúc khóa học",
    ],
  },
  {
    id: "nghe-si",
    title: "Lớp Nghệ Sĩ Nhí",
    age: "Dành cho bé 10 - 12 tuổi",
    price: "2.800.000đ",
    frequency: "12 buổi / tháng",
    color: "bg-[#ffaaa6]",
    borderColor: "border-rose-500",
    textColor: "text-rose-800",
    icon: Award,
    features: [
      "Vẽ tranh sơn dầu & chất liệu chuyên sâu",
      "Học vẽ chân dung & giải phẫu học cơ bản",
      "Triển lãm cá nhân cuối khóa học",
      "Định hướng phong cách nghệ thuật riêng",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#fefaf0] py-12 px-4 md:px-8 bg-[radial-gradient(circle_at_2px_2px,#bec7d1_1px,transparent_0)] bg-[size:24px_24px]">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Title Header */}
        <header className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-sm bg-purple-100 border-2 border-black rounded-lg px-3 py-1 font-black text-purple-800 shadow-[2px_2px_0px_rgba(0,0,0,1)] uppercase tracking-wider">
            Biểu phí & Khóa học
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">
            Các Khóa Học & Học Phí
          </h1>
          <p className="text-gray-500 font-semibold text-sm">
            Học phí đã bao gồm toàn bộ họa cụ cao cấp tại lớp. Trung tâm cam kết không phát sinh bất kỳ khoản chi phí nào khác trong suốt quá trình bé học tập.
          </p>
        </header>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <div 
                key={plan.id}
                className={`border-4 border-black bg-white rounded-3xl p-6 md:p-8 flex flex-col justify-between relative shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-1.5 transition-all duration-200 ${
                  plan.popular ? "scale-105 md:-translate-y-2 border-sky-500 shadow-sky-500/10" : ""
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 border-2 border-black text-black px-4 py-1 rounded-full font-black text-[11px] shadow-[2px_2px_0px_rgba(0,0,0,1)] uppercase tracking-wider whitespace-nowrap">
                    ⭐ Được chọn nhiều nhất
                  </div>
                )}

                <div className="space-y-6">
                  {/* Category Header */}
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] ${plan.color} ${plan.textColor} border-2 border-black px-2.5 py-1 rounded font-black uppercase tracking-wide`}>
                      {plan.title}
                    </span>
                    <Icon className="w-6 h-6 text-gray-400 shrink-0" />
                  </div>

                  {/* Age & Price */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{plan.age}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl md:text-4xl font-black text-gray-900">{plan.price}</span>
                      <span className="text-xs font-bold text-gray-400">/tháng</span>
                    </div>
                  </div>

                  {/* Course Details */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-xs font-black text-gray-700">
                      <Calendar className="w-4 h-4 text-sky-500" />
                      <span>Tần suất: {plan.frequency}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-black text-gray-700">
                      <PaintBucket className="w-4 h-4 text-emerald-500" />
                      <span>Họa cụ: Miễn phí 100% tại lớp</span>
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2.5 pt-4 border-t border-black/10 text-xs font-bold text-gray-500">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Button Action */}
                <div className="pt-8">
                  <Link 
                    href={`/enroll?class=${plan.id}`}
                    className={`block w-full py-4 text-center font-black rounded-2xl border-3 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all ${
                      plan.popular 
                        ? "bg-amber-300 hover:bg-amber-400 text-black" 
                        : "bg-white hover:bg-gray-50 text-gray-800"
                    }`}
                  >
                    Đăng Ký Khóa Học
                  </Link>
                </div>

              </div>
            );
          })}
        </div>

        {/* FAQ Preview Banner */}
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
