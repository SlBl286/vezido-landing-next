"use client";

import Image from "next/image";

export const Header = () => {
  return (
    <header className="w-full h-16 flex items-center justify-between px-4 bg-white shadow-sm">
      <div className="  flex items-center">
        <Image
          src="/logo.png"
          alt="logo"
          width={80}
          height={80}
          className="dark:invert object-contain"
        />
      </div>
    </header>
  );
};
