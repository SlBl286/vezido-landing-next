"use client";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";

const MENU_ITEMS = [
  { label: "🏠 Trang chủ", href: "/" },
  { label: "📅 Lịch học", href: "/schedule" },
  { label: "💰 Bảng giá", href: "/pricing" },
  { label: "🎨 Kết quả học tập", href: "/portfolio" },
  { label: "📞 Liên hệ", href: "/contact" },
];

export const MenuDrawer = () => {
  const pathname = usePathname();
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="outline" className="mr-2 md:hidden border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <Menu />
          </Button>
        }
      />
      <SheetContent side="left" className="border-r-4 border-black p-0 w-72">
        <SheetHeader className="px-5 py-4 border-b-3 border-black bg-amber-50">
          <SheetTitle className="w-full flex items-center gap-3 font-black text-left text-base">
            <Image
              src="/logo.png"
              alt="logo"
              width={50}
              height={50}
              loading="eager"
              className="object-contain"
            />
            Vẽ zì đó
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col px-4 py-5 gap-y-1.5">
          {MENU_ITEMS.map((m) => (
            <Link
              key={m.label}
              href={m.href}
              className={cn(
                "px-4 py-3 rounded-xl text-sm font-black transition-all border-2",
                pathname === m.href
                  ? "text-sky-700 bg-sky-50 border-sky-400 shadow-[2px_2px_0px_rgba(0,0,0,0.15)]"
                  : "text-gray-700 border-transparent hover:bg-gray-50 hover:border-black/10"
              )}
            >
              {m.label}
            </Link>
          ))}
        </nav>

        {/* CTA inside drawer */}
        <div className="px-4 mt-2 border-t-2 border-black/10 pt-5">
          <Link
            href="/enroll"
            className="w-full block text-center bg-amber-300 hover:bg-amber-400 text-black font-black text-sm py-3 border-3 border-black rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all"
          >
            ✏️ Đăng ký học ngay
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
};
