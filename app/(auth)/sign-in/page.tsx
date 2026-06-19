"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Lock, User, Paintbrush, Sparkles, Smile, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
export default function SignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
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

  // Load remembered username on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem("remembered_username");
    const rememberMe = localStorage.getItem("remember_me") === "true";
    if (rememberMe && savedUsername) {
      setUsername(savedUsername);
      setRemember(true);
    }
  }, []);

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

      // Handle remember me state in localStorage
      if (remember) {
        localStorage.setItem("remembered_username", username);
        localStorage.setItem("remember_me", "true");
      } else {
        localStorage.removeItem("remembered_username");
        localStorage.removeItem("remember_me");
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#fefaf0] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-10 left-10 text-amber-500 opacity-20 animate-bounce duration-1000">
        <Paintbrush size={48} className="-rotate-45" />
      </div>
      <div className="absolute bottom-12 right-12 text-[#ff8b94] opacity-20 animate-pulse">
        <Sparkles size={56} />
      </div>
      <div className="absolute top-1/4 right-20 text-[#a8e6cf] opacity-30 rotate-12">
        <Smile size={44} />
      </div>

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="bg-white rounded-[35px_15px_30px_10px/10px_30px_15px_35px] border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] p-8 md:p-10 relative">
          {/* Top banner tag */}
          <div className="absolute -top-5 -right-2 bg-[#ffd275] text-black py-1.5 px-4 rounded-xl -rotate-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] z-10 font-black tracking-wider text-xs flex items-center gap-1.5 border-3 border-black">
            <ShieldCheck size={16} />
            <span>NỘI BỘ CMS 🎨</span>
          </div>

          <div className="flex flex-col items-center mb-8">
            <div className="bg-[#a8e6cf] border-3 border-black p-3 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-3 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Vẽ zì đó Logo"
                width={80}
                height={80}
                priority
                className="object-contain"
              />
            </div>
            <h2 className="text-2xl font-black text-black mt-2">
              ĐĂNG NHẬP HỆ THỐNG
            </h2>
            <p className="text-xs text-stone-500 text-center font-bold mt-1">
              Bộ phận Quản lý giáo vụ & Điều phối lớp học Vẽ zì đó
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {errorMessage && (
              <div className="bg-[#ffaaa6] border-3 border-black text-black px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-shake">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-black text-black mb-1.5">
                  👤 Tên đăng nhập
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập..."
                  className="w-full border-3 border-black rounded-xl p-3 bg-stone-50 focus:bg-white focus:outline-none font-bold text-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-0.5 focus:-translate-y-0.5"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-black mb-1.5">
                  🔒 Mật khẩu
                </label>
                <div className="relative flex items-center">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full border-3 border-black rounded-xl p-3 bg-stone-50 focus:bg-white focus:outline-none font-bold text-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-0.5 focus:-translate-y-0.5 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black hover:text-stone-700 bg-transparent border-0 p-1 flex items-center justify-center hover:cursor-pointer transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff size={20} className="stroke-[2.5]" />
                    ) : (
                      <Eye size={20} className="stroke-[2.5]" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <label className="flex items-center text-black font-extrabold cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="mr-2 rounded border-2 border-black text-amber-500 focus:ring-0 cursor-pointer h-4 w-4"
                />
                Ghi nhớ đăng nhập
              </label>
              <span className="font-extrabold text-[#ff8b94] hover:text-[#ff6b76] transition-colors cursor-pointer decoration-2 underline">
                Quên mật khẩu?
              </span>
            </div>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-[#ffd275] hover:bg-[#ffc342] disabled:bg-[#ffeaa7] text-black border-3 border-black font-black text-lg py-3.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 hover:cursor-pointer"
              >
                {isPending ? (
                  <>
                    <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>ĐANG XÁC THỰC...</span>
                  </>
                ) : (
                  <>
                    <span>ĐĂNG NHẬP</span>
                    <ArrowRight size={20} className="stroke-[3]" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center text-stone-500 text-xs font-bold mt-4 leading-relaxed">
              Không có tài khoản? Vui lòng liên hệ với bộ phận Quản trị viên (Admin) để được cấp quyền truy cập.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}