"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Home } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AuthSession } from "@/lib/types/api";

export const Header = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function getSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          setSession(data);

          // Retrieve latest profile info
          const profRes = await fetch("/api/cms/profile");
          if (profRes.ok) {
            const profData = await profRes.json();
            setProfile(profData.user);
          }
        }
      } catch (err) {
        console.error("Failed to load session:", err);
      }
    }
    getSession();
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/sign-in" });
  };

  const role = profile?.role || session?.user?.role;

  return (
    <header className="bg-[#a8e6cf] border-b-4 border-black py-4 px-6 shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/cms" className="bg-white p-2 border-3 border-black rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:scale-95 transition-transform shrink-0 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Vẽ zì đó"
              loading="eager"
              width={60}
              height={60}
              className="object-contain"
            />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight drop-shadow-sm flex items-center gap-2">
              VẼ ZÌ ĐÓ - CMS
            </h1>
            <p className="text-xs sm:text-sm text-gray-800 font-bold">
              {role === "ADMIN" ? "Hệ thống quản trị Super Admin 👑" : role === "TEACHER" ? "Góc quản lý của Giáo viên 🖌️" : role === "ASSISTANT" ? "Góc quản lý của Trợ giảng 📋" : "Hệ thống quản lý giáo vụ"}
            </p>
          </div>
        </div>
        
        {session?.user && (
          <div className="flex items-center gap-3 bg-white border-3 border-black rounded-2xl p-2.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {(profile?.image || session.user.image) ? (
              <Image
                width={40}
                height={40}
                src={profile?.image || session.user.image!}
                alt={profile?.name || session.user.name || ""}
                className="w-10 h-10 rounded-full border-2 border-black object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-black bg-amber-100 flex items-center justify-center font-black text-black shrink-0 text-sm">
                {(profile?.name || session.user.name || profile?.username || session.user.username || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">Tài khoản</p>
              <p className="font-extrabold text-sm text-gray-900 leading-tight">{profile?.name || session.user.name || profile?.username || session.user.username}</p>
            </div>
            
            <Link 
              href="/" 
              className="bg-sky-100 hover:bg-sky-200 border-2 border-black rounded-xl p-2 font-bold transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-0 active:translate-y-0 text-black inline-flex items-center justify-center"
              title="Trang chủ Website"
            >
              <Home className="w-4 h-4" />
            </Link>

            <button 
              onClick={handleSignOut}
              className="bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-xl p-2 font-bold transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-0 active:translate-y-0 text-black inline-flex items-center justify-center cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
