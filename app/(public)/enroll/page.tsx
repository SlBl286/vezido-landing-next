import { Metadata } from "next";
import { Suspense } from "react";
import { RefreshCw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { EnrollFormClient } from "./components/enroll-form-client";

export const metadata: Metadata = {
  title: "Vẽ zì đó - Đăng ký học vẽ",
  description: "Đăng ký lớp học vẽ sáng tạo cho bé từ 4-12 tuổi. Nhận tặng bộ họa cụ trị giá 250.000đ khi ghi danh.",
};

export default async function EnrollPage() {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      audience: true,
      level: true,
      classCategory: {
        select: {
          id: true,
          name: true,
        }
      }
    },
    orderBy: { createdAt: "asc" }
  });

  return (
    <main className="min-h-screen bg-[#fefaf0] py-12 px-4 md:px-8 bg-[radial-gradient(circle_at_2px_2px,#bec7d1_1px,transparent_0)] bg-[size:24px_24px]">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Title Header */}
        <header className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-sm bg-rose-100 border-2 border-black rounded-lg px-3 py-1 font-black text-rose-800 shadow-[2px_2px_0px_rgba(0,0,0,1)] uppercase tracking-wider">
            🎁 Tặng Họa Cụ Khi Đăng Ký
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">
            Ghi Danh Cho Bé Yêu!
          </h1>
          <p className="text-gray-500 font-semibold text-sm">
            Điền thông tin bên dưới, các cô tại trung tâm sẽ liên hệ với ba mẹ để xếp lớp và chuẩn bị buổi học thử miễn phí cho bé.
          </p>
        </header>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-3 text-xs font-black">
          <div className="flex items-center gap-1.5 bg-[#baffc9] border-2 border-black px-3 py-1.5 rounded-full shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            ✅ Học thử miễn phí
          </div>
          <div className="flex items-center gap-1.5 bg-[#bae1ff] border-2 border-black px-3 py-1.5 rounded-full shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            🎨 Tặng bộ họa cụ 250K
          </div>
          <div className="flex items-center gap-1.5 bg-[#ffd3b6] border-2 border-black px-3 py-1.5 rounded-full shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            🔄 Hoàn tiền 100% nếu không hài lòng
          </div>
          <div className="flex items-center gap-1.5 bg-[#ffaaa6] border-2 border-black px-3 py-1.5 rounded-full shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            📱 Theo dõi kết quả học tập qua App
          </div>
        </div>

        {/* The Form */}
        <Suspense fallback={
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-10 h-10 animate-spin text-amber-500" />
            <p className="font-bold text-gray-500 text-sm">Đang tải form đăng ký...</p>
          </div>
        }>
          <EnrollFormClient courses={courses} />
        </Suspense>

      </div>
    </main>
  );
}

