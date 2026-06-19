"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, ChevronDown, ChevronUp } from "lucide-react";

interface SidebarProps {
  role: string;
}

interface MenuItem {
  id: string;
  href: string;
  label: string;
  icon: string;
  color: string;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: string;
  items: MenuItem[];
}

export const Sidebar = ({ role }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Group definitions
  const groups: MenuGroup[] = [
    {
      id: "general",
      label: "Chung",
      icon: "🏠",
      items: [
        ...(role !== "ASSISTANT" ? [
          { id: "overview", href: "/cms", label: "Tổng quan", icon: "📊", color: "bg-[#bae1ff]" }
        ] : []),
        { id: "profile", href: "/cms/profile", label: "Hồ sơ cá nhân", icon: "⚙️", color: "bg-[#dcd6f7]" },
        { id: "tasks", href: "/cms/tasks", label: "Nhiệm vụ & Công việc", icon: "📋", color: "bg-[#a8e6cf]" }
      ]
    },
    {
      id: "academic",
      label: "Đào tạo & Lớp học",
      icon: "📚",
      items: [
        ...(role === "ADMIN" ? [
          { id: "teachers", href: "/cms/teachers", label: "Quản lý Giáo viên", icon: "👩‍🏫", color: "bg-[#ffd275]" },
          { id: "classes", href: "/cms/classes", label: "Quản lý Lớp học", icon: "🏫", color: "bg-[#ff8b94]" },
          { id: "courses", href: "/cms/courses", label: "Quản lý Khóa học", icon: "📖", color: "bg-[#a8e6cf]" },
          { id: "specialties", href: "/cms/specialties", label: "Quản lý Chuyên môn", icon: "🎨", color: "bg-[#ffffba]" }
        ] : []),
        ...(role !== "ASSISTANT" ? [
          { id: "schedule", href: "/cms/schedule", label: "Lịch học & Giảng dạy", icon: "📅", color: "bg-[#ffd3b6]" }
        ] : []),
        { id: "my-classes", href: "/cms/my-classes", label: "Lớp học của tôi", icon: "🎨", color: "bg-[#baffc9]" }
      ]
    },
    {
      id: "artwork",
      label: "Triển lãm & Học sinh",
      icon: "🎨",
      items: [
        ...(role !== "ASSISTANT" ? [
          { id: "artworks", href: "/cms/artworks", label: "Góc Triển Lãm & Nhận Xét", icon: "🖼️", color: "bg-[#ffc6ff]" },
          { id: "students", href: "/cms/students", label: "Danh sách Học sinh", icon: "🎒", color: "bg-[#ffd275]" }
        ] : [])
      ]
    },
    {
      id: "system",
      label: "Hệ thống & Công cụ",
      icon: "🛠️",
      items: [
        ...(role === "ADMIN" ? [
          { id: "settings", href: "/cms/settings", label: "Cấu hình Website", icon: "🌐", color: "bg-[#ffc6ff]" },
          { id: "contacts", href: "/cms/contacts", label: "Liên hệ từ website", icon: "📬", color: "bg-[#baffc9]" }
        ] : []),
        ...(role !== "ASSISTANT" ? [
          { id: "supplies", href: "/cms/supplies", label: "Quản lý Kho hàng", icon: "📦", color: "bg-[#ffffba]" }
        ] : []),
        { id: "faqs", href: "/cms/faqs", label: "Hỏi đáp & Trả lời nhanh", icon: "💬", color: "bg-[#e8dff5]" }
      ]
    }
  ];

  // Collapse/Expand state for each group
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    general: true,
    academic: true,
    artwork: true,
    system: true
  });

  // Auto-expand group containing the active page on mount/navigation
  useEffect(() => {
    groups.forEach((group) => {
      const hasActiveItem = group.items.some((item) => pathname === item.href);
      if (hasActiveItem) {
        setExpandedGroups((prev) => ({ ...prev, [group.id]: true }));
      }
    });
  }, [pathname]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

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
        "border-4 border-black bg-white rounded-3xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-2 transition-all duration-300",
        isOpenMobile ? "block" : "hidden lg:flex"
      )}>
        <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider px-2 mb-1 hidden lg:block">Danh mục quản lý</p>
        
        <div className="flex flex-col gap-1">
          {groups.map((group) => {
            const isExpanded = expandedGroups[group.id];
            // If group has no items (e.g. filtered by role), don't render it
            if (group.items.length === 0) return null;

            return (
              <div key={group.id} className="flex flex-col gap-1.5">
                {/* Group Header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between py-2 px-2 mt-2 font-black text-xs uppercase tracking-wider text-stone-500 hover:text-black transition-colors border-b-2 border-dashed border-stone-200 cursor-pointer text-left focus:outline-none"
                >
                  <span className="flex items-center gap-1.5">
                    <span>{group.icon}</span>
                    <span>{group.label}</span>
                  </span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* Group Items */}
                {isExpanded && (
                  <div className="flex flex-col gap-1.5 pl-1 transition-all">
                    {group.items.map((item) => {
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
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
