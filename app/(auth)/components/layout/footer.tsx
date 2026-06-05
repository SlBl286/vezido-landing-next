import { Button } from "@/components/ui/button";
import { SeparatorVerticalIcon } from "lucide-react";
import Image from "next/image";

export const Footer = () => {
  return (
    <footer className="w-full flex flex-col items-center justify-between px-4 bg-gray-100 shadow-sm pt-4">
      <div className="flex justify-between w-full">
        <div className=" flex items-center">
            <img
              src="/nhan_vat.png"
              alt="logo"
              width={100}
              className="dark:invert object-contain -scale-x-100"
            />
          </div>
        <div className="flex gap-x-2">
          <div className=" flex items-center">
            <img
              src="/logo.png"
              alt="logo"
              width={80}
              className="dark:invert object-contain"
            />
          </div>
          <div className="flex flex-col font-semibold justify-center gap-y-1">
              <div className="flex">
            </div>
          </div>
        </div>
        
          <div className=" flex items-center">
            <img
              src="/nhan_vat.png"
              alt="logo"
              width={100}
              className="dark:invert object-contain"
            />
          </div>
      
      </div>
      <div className="py-4 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Vẽ Zì Đó. All rights reserved.</p>
      </div>
    </footer>
  );
};
