import { Button } from "@/components/ui/button";

import { MenuDrawer } from "./menu_drawer";

const MENU_ITEMS = [
  { label: "Trang chủ", href: "/" },
  { label: "Lịch học", href: "/schedule" },
  { label: "Bảng giá", href: "/pricing" },
  { label: "Liên hệ", href: "/contact" },
];

export const Header = () => {
  return (
    <header className="w-full h-16 flex items-center justify-between px-4 bg-white shadow-sm">
      <div className="  flex items-center">
        <MenuDrawer/>
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
                className="text-gray-700 font-semibold hover:text-blue-500 hover:underline transition-colors duration-200"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div>
        <Button className="px-4 py-2 bg-blue-400 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] hover:bg-blue-500 font-semibold shadow-md shadow-black/90">
          Đăng ký học
        </Button>
      </div>
    </header>
  );
};
