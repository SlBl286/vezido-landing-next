import { Input } from "@/components/ui/input";
import { Droplet, PencilLine, Send, Shapes } from "lucide-react";
import { Metadata } from "next";
import Image from "next/image";
export const metadata: Metadata = {
  title: "Vẽ zì đó - Đăng ký",
  description: "Đăng ký các lớp học vẽ",
};
export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden p-4 mb-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-16 mt-6">
          <h1 className="mb-4 text-4xl lg:text-6xl font-bold ">
            Tham gia{" "}
            <img
              src="/logo.png"
              alt="logo"
              width={100}
              className="inline-block"
            />
            ngay!
          </h1>
        </header>
        <div className="bg-white rounded-[40px_25px_35px_20px] border-sky-300/50 shadow-[10px_10px_0px_0px_rgba(45,156,219,0.1)] border-4  p-8 md:p-12 relative">
          <div className="absolute -top-6 -right-6 bg-red-500 text-white p-4 rounded-full -rotate-12 shadow-lg z-10 font-bold border-2 border-white">
            Sáng tạo
          </div>
          <form className="space-y-10">
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-l-4 border-sky-500 pl-4">
                <h2 className="font-bold text-2xl text-sky-600">
                  Thông tin của bé
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative">
                  <label className="font-bold mb-1 block">Tên của bé</label>
                  <Input
                    className="w-full bg-transparent border-0 border-b-2 border-stone-300 focus-visible:ring-0  focus-visible:border-sky-500  transition-colors py-2 rounded-none font-medium text-lg tracking-wide"
                    placeholder="Nhập tên đầy đủ"
                    type="text"
                  />
                </div>
                <div className="relative">
                  <label className="font-bold mb-1 block">
                    Tuổi của bé
                  </label>
                  <Input
                    className="w-full bg-transparent border-0 border-b-2 border-stone-300 focus-visible:ring-0  focus-visible:border-sky-500  transition-colors py-2 rounded-none font-medium text-lg tracking-wide"
                    placeholder="Ví dụ: 7"
                    type="number"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-l-4 border-red-400 pl-4">
                <h2 className="font-bold text-2xl text-red-500">
                  Thông tin phụ huynh
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                  <label className="font-bold mb-1 block">
                    Họ và tên
                  </label>
                  <Input
                    className="w-full bg-transparent border-0 border-b-2 border-stone-300 focus-visible:ring-0  focus-visible:border-red-500  transition-colors py-2 rounded-none font-medium text-lg tracking-wide"
                    placeholder="Tên phụ huynh"
                    type="text"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="font-bold mb-1 block">
                    Số điện thoại
                  </label>
                  <Input
                    className="w-full bg-transparent border-0 border-b-2 border-stone-300 focus-visible:ring-0  focus-visible:border-red-500  transition-colors py-2 rounded-none font-medium text-lg tracking-wide"
                    placeholder="090..."
                    type="tel"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="font-bold mb-1 block">
                    Email
                  </label>
                  <Input
                    className="w-full bg-transparent border-0 border-b-2 border-stone-300 focus-visible:ring-0  focus-visible:border-red-500  transition-colors py-2 rounded-none font-medium text-lg tracking-wide"
                    placeholder="example@mail.com"
                    type="email"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-l-4 border-amber-400 pl-4">
                <h2 className="font-bold text-2xl text-amber-500">
                  Đăng ký khóa học
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="font-bold mb-3 block">
                    Chọn lớp học
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    <label className="flex items-center p-3 rounded-xl border-2 border-stone-100 hover:border-sky-500 cursor-pointer transition-all has-checked:bg-sky-500/5 has-checked:border-sky-500 gap-x-3">
                      <Input className="sr-only" name="class" type="radio"/>
                      <PencilLine className="text-sky-600" />
                      <span className="font-semibold">Vẽ Cơ Bản</span>
                    </label>
                    <label className="flex items-center p-3 rounded-xl border-2 border-stone-100 hover:border-sky-500 cursor-pointer transition-all has-checked:bg-sky-500/5 has-checked:border-sky-500 gap-x-3">
                      <Input className="sr-only" name="class" type="radio" />
                      <Droplet className="text-sky-600" />
                      <span className="font-semibold">Màu Nước Thần Kỳ</span>
                    </label>
                    <label className="flex items-center p-3 rounded-xl border-2 border-stone-100 hover:border-sky-500 cursor-pointer transition-all has-checked:bg-sky-500/5 has-checked:border-sky-500 gap-x-3">
                      <Input className="sr-only" name="class" type="radio" />
                      <Shapes className="text-sky-600" />

                      <span className="font-semibold">Tạo Hình Đất Sét</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="font-bold mb-3 block">
                    Thời gian học mong muốn
                  </label>
                  <select className="w-full bg-gray-100 rounded-xl border-2 border-transparent focus-visible:border-sky-500 focus-visible:ring-0 p-3 font-semibold">
                    <option>Sáng Thứ 7 (8:00 - 10:00)</option>
                    <option>Chiều Thứ 7 (14:00 - 16:00)</option>
                    <option>Sáng Chủ Nhật (8:00 - 10:00)</option>
                    <option>Chiều Chủ Nhật (14:00 - 16:00)</option>
                  </select>
                  <div className="mt-8">
                    <label className="font-bold mb-1 block">
                      Ghi chú thêm
                    </label>
                    <textarea
                      className="w-full bg-transparent border-0 border-b-2 border-stone-300  focus:border-sky-500 focus:ring-0 focus:ring-transparent  transition-colors py-2 font-medium resize-none"
                      placeholder="Nhắn nhủ gì đó với chúng mình..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-8">
              <button
                className="w-full bg-sky-500 text-white font-bold text-3xl py-5 rounded-2xl shadow-[0_8px_0_0_#1b6fa2] active:shadow-none active:translate-y-2 transition-all flex items-center justify-center gap-3 hover:cursor-pointer"
                type="button"
              >
                <span>Gửi Đăng Ký</span>
                <Send />
              </button>
              <p className="text-center mt-4 text-gray-600 font-semibold italic">
                Chúng mình sẽ liên hệ với bạn trong vòng 24h nhé!
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
