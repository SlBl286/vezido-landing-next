"use client";

import Image from "next/image";
import Link from "next/link";

export const Header = () => {
  return (
    <header className="bg-[#a8e6cf] border-b-4 border-black py-4 px-6 shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="bg-white p-2 border-3 border-black rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:scale-95 transition-transform flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Vẽ zì đó"
            loading="eager"
            width={60}
            height={60}
            className="object-contain"
          />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight drop-shadow-sm">
            VẼ ZÌ ĐÓ - CMS
          </h1>
        </div>
      </div>
    </header>
  );
};
