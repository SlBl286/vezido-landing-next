"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Palette, Sparkles, Home, Undo2, Heart } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#fefaf0] bg-[radial-gradient(circle_at_2px_2px,#bec7d1_1px,transparent_0)] bg-[size:24px_24px] flex items-center justify-center p-4">
      <div className="relative border-4 border-black bg-white rounded-[40px_20px_35px_15px] p-8 md:p-12 shadow-[12px_12px_0px_rgba(0,0,0,1)] -rotate-1 max-w-lg w-full text-center overflow-hidden">
        
        {/* Decorative corner stickers */}
        <div className="absolute top-4 -right-2 bg-[#ffd275] border-3 border-black px-3 py-1 font-black rounded-lg text-xs -rotate-12 shadow-[3px_3px_0px_rgba(0,0,0,1)] text-black select-none">
          🎨 Lạc đường rồi!
        </div>

        {/* Art Palette & Sparkles Icon Container */}
        <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center bg-[#a8e6cf] border-4 border-black rounded-full shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <Palette className="w-12 h-12 text-black" />
          <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-purple-700 animate-bounce" />
        </div>

        {/* 404 Sticker */}
        <div className="inline-block bg-[#ff8b94] border-3 border-black px-6 py-2 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] rotate-2 mb-6">
          <h1 className="text-5xl font-black text-black tracking-tight select-none">
            404
          </h1>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-3">
          Bức tranh này chưa được vẽ!
        </h2>

        <p className="text-gray-600 font-bold text-sm md:text-base leading-relaxed mb-8">
          Có vẻ như trang bạn đang tìm kiếm không tồn tại hoặc đã di chuyển sang một nét vẽ khác. Ba mẹ và các bé hãy quay lại trang chủ nhé!
        </p>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-black font-black text-base px-6 py-3 border-3 border-black rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all text-center w-full sm:w-auto cursor-pointer"
          >
            <Undo2 className="w-5 h-5 shrink-0" />
            Quay lại trang trước
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-[#bae1ff] hover:bg-[#a5d4fc] text-black font-black text-base px-6 py-3 border-3 border-black rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all text-center w-full sm:w-auto"
          >
            <Home className="w-5 h-5 shrink-0" />
            Về trang chủ
          </Link>
        </div>

        {/* Extra decorative footer note */}
        <div className="mt-8 flex items-center justify-center gap-1.5 text-xs font-black text-gray-500">
          <Heart className="w-4 h-4 text-[#ff8b94] fill-[#ff8b94]" /> Vẽ zì đó Studio
        </div>
      </div>
    </main>
  );
}
