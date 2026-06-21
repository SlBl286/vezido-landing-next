"use client";

import { useEffect } from "react";
import { Printer, X } from "lucide-react";

export function PrinterClient() {
  useEffect(() => {
    // Delay slightly to ensure fonts and layout render properly
    const timer = setTimeout(() => {
      window.print();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="no-print fixed top-4 right-4 z-50 flex gap-3">
      <button
        onClick={() => window.print()}
        className="bg-[#baffc9] hover:bg-[#a3e9b3] border-3 border-black text-black font-black text-xs px-5 py-2.5 rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
      >
        <Printer className="w-4 h-4" /> In biên lai (Print)
      </button>
      <button
        onClick={() => window.close()}
        className="bg-white hover:bg-stone-50 border-3 border-black text-black font-black text-xs px-5 py-2.5 rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
      >
        <X className="w-4 h-4" /> Đóng (Close)
      </button>
    </div>
  );
}
