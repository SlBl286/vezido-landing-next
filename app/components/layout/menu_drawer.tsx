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
import { Menu } from "lucide-react";
const MENU_ITEMS = [
  { label: "Trang chủ", href: "/" },
  { label: "Lịch học", href: "/schedule" },
  { label: "Bảng giá", href: "/pricing" },
  { label: "Liên hệ", href: "/contact" },
];

export const MenuDrawer = () => {
  return (
    <Sheet>
      <SheetTrigger>
        <Button variant="outline" className="mr-2 md:hidden" >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
            <SheetTitle className="w-full items-center justify-center flex">Menu</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col px-4 py-2 gap-y-2">

          {
            MENU_ITEMS.map(m => (
              <div>{m.label}</div>
            ))
          }
          </div>

      </SheetContent>
    </Sheet>
  );
};
