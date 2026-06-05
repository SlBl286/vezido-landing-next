"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { signIn } from "next-auth/react";
import { Lock, User, Paintbrush, Sparkles, Smile, ArrowRight, ShieldCheck } from "lucide-react";
import Image from "next/image";

export default function SignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data && data.user) {
            router.push("/cms");
          }
        }
      } catch (err) {
        console.error("Error checking session:", err);
      }
    }
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsPending(true);

    try {
      // Use next-auth/react client-side signIn method (the standard NextAuth way)
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false, // prevent next-auth from auto-redirecting
      });

      if (res?.error) {
        // Handle error responses from credentials provider
        setErrorMessage("Tài khoản hoặc mật khẩu không chính xác.");
        setIsPending(false);
        return;
      }

      // Success, route client to internal CMS
      router.push("/cms");
      router.refresh();
    } catch (err) {
      setErrorMessage("Đã xảy ra lỗi kết nối.");
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-amber-50/40 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-10 left-10 text-amber-300 opacity-30 animate-bounce duration-1000">
        <Paintbrush size={48} className="-rotate-45" />
      </div>
      <div className="absolute bottom-12 right-12 text-rose-300 opacity-30 animate-pulse">
        <Sparkles size={56} />
      </div>
      <div className="absolute top-1/4 right-20 text-sky-300 opacity-20 rotate-12">
        <Smile size={44} />
      </div>

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="bg-white rounded-[30px_15px_40px_20px] border-4 border-amber-400 shadow-[10px_10px_0px_0px_rgba(245,158,11,0.15)] p-8 md:p-10 relative">
          {/* Top banner tag */}
          <div className="absolute -top-6 -right-4 bg-amber-500 text-white py-2 px-5 rounded-full -rotate-12 shadow-lg z-10 font-bold border-2 border-white tracking-wider text-sm flex items-center gap-1.5">
            <ShieldCheck size={16} />
            <span>Nội bộ CMS 🎨</span>
          </div>

          <div className="flex flex-col items-center mb-8">
            <Image
              src="/logo.png"
              alt="Vẽ zì đó Logo"
              width={140}
              height={35}
              priority
              className="object-contain mb-3"
            />
            <h2 className="text-2xl font-bold tracking-tight text-stone-700 mt-2">
              Đăng Nhập Hệ Thống
            </h2>
            <p className="text-sm text-stone-500 text-center mt-1">
              Hệ thống quản lý giáo vụ & điều phối lớp học Vẽ zì đó
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {errorMessage && (
              <div className="bg-rose-50 border-2 border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 animate-shake">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-5">
              <div className="relative">
                <label className="font-bold text-stone-600 mb-1 block text-sm">
                  Tên đăng nhập
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-1 text-stone-400" size={20} />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="superadmin"
                    className="w-full bg-transparent border-0 border-b-2 border-stone-300 focus-visible:ring-0 focus-visible:border-amber-500 transition-colors py-2 rounded-none font-medium text-lg tracking-wide pl-8"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="font-bold text-stone-600 mb-1 block text-sm">
                  Mật khẩu
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-1 text-stone-400" size={20} />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent border-0 border-b-2 border-stone-300 focus-visible:ring-0 focus-visible:border-amber-500 transition-colors py-2 rounded-none font-medium text-lg tracking-wide pl-8"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-stone-600 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="mr-2 rounded border-stone-300 text-amber-500 focus:ring-amber-400 cursor-pointer h-4 w-4"
                />
                Ghi nhớ phiên làm việc
              </label>
              <span className="font-semibold text-amber-500 hover:text-amber-600 transition-colors cursor-pointer">
                Quên mật khẩu?
              </span>
            </div>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-amber-300 text-white font-bold text-xl py-4 rounded-2xl shadow-[0_6px_0_0_#d97706] disabled:shadow-none disabled:translate-y-1.5 active:shadow-none active:translate-y-1.5 transition-all flex items-center justify-center gap-2 hover:cursor-pointer"
              >
                {isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng Nhập</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>

            <div className="text-center text-stone-500 text-xs mt-4">
              Không có tài khoản? Vui lòng liên hệ với bộ phận Quản trị viên (Admin) để được cấp quyền truy cập.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}