"use client";
import { Button } from "@/components/ui/button";

import { MenuDrawer } from "./menu_drawer";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";

const MENU_ITEMS = [
  { label: "Trang chủ", href: "/" },
  { label: "Lịch học", href: "/schedule" },
  { label: "Bảng giá", href: "/pricing" },
  { label: "Liên hệ", href: "/contact" },
];

export const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <header className="w-full h-16 flex items-center justify-between px-4 bg-white shadow-sm">
      <div className="  flex items-center">
        <MenuDrawer />
        <img
          src="/logo.png"
          alt="logo"
          width={80}
          className="dark:invert object-contain"
        />
      </div>{" "}
      <nav className="hidden md:flex">
        <ul className="flex space-x-4">
          {MENU_ITEMS.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className={cn(
                  "text-gray-700 font-semibold tracking-tight hover:text-sky-500 hover:scale-95 hover:rotate-1 transition-colors duration-200",
                  pathname === item.href
                    ? "text-sky-500 underline decoration-wavy underline-offset-4"
                    : "",
                )}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div>
        <Button className="px-4 py-2 bg-blue-400 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] hover:bg-blue-500 font-semibold shadow-md shadow-black/90"
        onClick={()=>{
          router.push("/enroll");
        }}>
          Đăng ký học
        </Button>
      </div>
    </header>
  );
};
