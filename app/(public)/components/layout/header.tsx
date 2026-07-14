"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MenuDrawer } from "./menu_drawer";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Image from "next/image";

const MENU_ITEMS = [
  { label: "Trang chủ", href: "/" },
  { label: "Lịch học", href: "/schedule" },
  { label: "Khóa học", href: "/pricing" },
  { label: "Kết quả học tập", href: "/portfolio" },
  { label: "Liên hệ", href: "/contact" },
];

export const Header = () => {
  const pathname = usePathname();

  return (
    <header className="w-full h-16 flex items-center justify-between px-4 md:px-8 bg-white border-b-4 border-black shadow-[0_4px_0px_rgba(0,0,0,1)] sticky top-0 z-50">
      {/* Left: Hamburger + Logo */}
      <div className="flex items-center gap-2">
        <MenuDrawer />
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Vẽ zì đó"
            width={100}
            height={100}
            loading="eager"
            className="object-contain h-15 w-auto"
          />
        </Link>
      </div>

      {/* Center: Nav Links (desktop) */}
      <nav className="hidden md:flex">
        <ul className="flex gap-1">
          {MENU_ITEMS.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-black transition-all duration-150 hover:bg-gray-100",
                  pathname === item.href
                    ? "text-sky-600 underline decoration-wavy underline-offset-4 bg-sky-50"
                    : "text-gray-700 hover:text-sky-500"
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Right: CTA */}
      <div>
        <Link
          href="/enroll"
          className="px-4 py-2 bg-amber-300 hover:bg-amber-400 border-2 border-black rounded-xl text-sm font-black shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all text-black hidden sm:inline-flex items-center gap-1.5"
        >
          ✏️ Đăng ký học
        </Link>
      </div>
    </header>
  );
};
