"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, ChevronDown, ChevronUp } from "lucide-react";

interface SidebarProps {
  role: string;
}

export const Sidebar = ({ role }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const menuItems = role === "ADMIN" ? [
    { id: "overview", href: "/cms", label: "Tổng quan", icon: "📊", color: "bg-[#bae1ff]" },
    { id: "schedule", href: "/cms/schedule", label: "Lịch học & Giảng dạy", icon: "📅", color: "bg-[#ffd3b6]" },
    { id: "teachers", href: "/cms/teachers", label: "Quản lý Giáo viên", icon: "👩‍🏫", color: "bg-[#ffd275]" },
    { id: "classes", href: "/cms/classes", label: "Quản lý Lớp học", icon: "🏫", color: "bg-[#ff8b94]" },
    { id: "specialties", href: "/cms/specialties", label: "Quản lý Chuyên môn", icon: "🎨", color: "bg-[#ffffba]" },
    { id: "my-classes", href: "/cms/my-classes", label: "Lớp học của tôi", icon: "🎨", color: "bg-[#baffc9]" },
    { id: "artworks", href: "/cms/artworks", label: "Góc Triển Lãm & Nhận Xét", icon: "🎨", color: "bg-[#ffc6ff]" },
    { id: "faqs", href: "/cms/faqs", label: "Hỏi đáp & Trả lời nhanh", icon: "💬", color: "bg-[#e8dff5]" },
    { id: "contacts", href: "/cms/contacts", label: "Liên hệ từ website", icon: "📬", color: "bg-[#baffc9]" },
    { id: "profile", href: "/cms/profile", label: "Hồ sơ cá nhân", icon: "⚙️", color: "bg-[#dcd6f7]" }
  ] : [
    { id: "overview", href: "/cms", label: "Tổng quan", icon: "📊", color: "bg-[#bae1ff]" },
    { id: "schedule", href: "/cms/schedule", label: "Lịch học & Giảng dạy", icon: "📅", color: "bg-[#ffd3b6]" },
    { id: "my-classes", href: "/cms/my-classes", label: "Lớp học của tôi", icon: "🎨", color: "bg-[#ffd275]" },
    { id: "artworks", href: "/cms/artworks", label: "Góc Triển Lãm & Nhận Xét", icon: "🎨", color: "bg-[#ffc6ff]" },
    { id: "faqs", href: "/cms/faqs", label: "Hỏi đáp & Trả lời nhanh", icon: "💬", color: "bg-[#e8dff5]" },
    { id: "profile", href: "/cms/profile", label: "Hồ sơ cá nhân", icon: "⚙️", color: "bg-[#dcd6f7]" }
  ];

  return (
    <div className="w-full lg:w-64 shrink-0">
      {/* Mobile Toggle Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          className="w-full flex items-center justify-between p-4 bg-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] font-black text-gray-800 cursor-pointer active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] transition-all"
        >
          <span className="flex items-center gap-2 text-sm">
            <Menu className="w-5 h-5 text-amber-500" />
            Danh mục quản lý
          </span>
          {isOpenMobile ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </button>
      </div>

      {/* Sidebar Content Panel */}
      <div className={cn(
        "border-4 border-black bg-white rounded-3xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-2.5 transition-all duration-300",
        isOpenMobile ? "block" : "hidden lg:flex"
      )}>
        <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider px-2 mb-1 hidden lg:block">Danh mục quản lý</p>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.id}
              onClick={() => {
                router.push(item.href);
                setIsOpenMobile(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 p-3.5 rounded-2xl font-black text-left border-3 transition-all cursor-pointer",
                isActive
                  ? `${item.color} border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]`
                  : "bg-white border-transparent text-gray-700 hover:bg-gray-50 hover:border-black hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
