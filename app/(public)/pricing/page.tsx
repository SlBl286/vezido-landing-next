import { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PricingClient from "./PricingClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vẽ zì đó - Bảng giá khóa học vẽ 🎨",
  description: "Chi tiết học phí các lớp vẽ sáng tạo mầm non, màu nước nâng cao và nghệ sĩ nhí chuyên nghiệp. Đăng ký học thử miễn phí cho bé.",
};

export default async function PricingPage() {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    include: { classCategory: true },
    orderBy: { createdAt: "asc" }
  });

  const categories = await prisma.classCategory.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <main className="min-h-screen bg-[#fefaf0] py-12 px-4 md:px-8 bg-[radial-gradient(circle_at_2px_2px,#bec7d1_1px,transparent_0)] bg-[size:24px_24px]">
      <div className="max-w-6xl mx-auto space-y-12">
        
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

        {/* Pricing Client-side interactive section */}
        <PricingClient courses={courses} categories={categories} />

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
