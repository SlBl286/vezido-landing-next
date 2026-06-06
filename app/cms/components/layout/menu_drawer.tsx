"use client";
import { Button } from "@/components/ui/button";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
const MENU_ITEMS = [
  { label: "Trang chủ", href: "/" },
  { label: "Lịch học", href: "/schedule" },
  { label: "Bảng giá", href: "/pricing" },
  { label: "Liên hệ", href: "/contact" },
];

export const MenuDrawer = () => {
    const pathname = usePathname();
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="outline" className="mr-2 md:hidden">
            <Menu />
          </Button>
        }
      />
      <SheetContent side="left">
        <SheetHeader>
            <SheetTitle className="w-full items-center justify-center flex">Menu</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col px-4 py-2 gap-y-2">

          {
            MENU_ITEMS.map(m => (
              <div
                onClick={() => window.location.href = m.href}
                key={m.label}
                className={cn(
                  "text-gray-700 font-semibold tracking-tight hover:text-sky-500 hover:scale-95  transition-colors duration-200",
                  pathname === m.href
                    ? "text-sky-500 underline decoration-wavy underline-offset-4"
                    : ""
                )}
              >
                {m.label}
              </div>
            ))
          }
          </div>

      </SheetContent>
    </Sheet>
  );
};
