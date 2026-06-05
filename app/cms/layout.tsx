import { Header } from "./components/layout/header";
import { Footer } from "./components/layout/footer";
import { Sidebar } from "./components/layout/sidebar";
import { auth } from "@/auth";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vẽ zì đó - CMS Dashboard",
  description: "Lớp học vẽ online và offline dành cho trẻ em",
};

export default async function CMSLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session || !session.user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fefaf0]">
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="border-4 border-black bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-6xl mb-4 block">🔒</span>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Đăng nhập yêu cầu</h1>
            <p className="text-gray-600 mb-6">Bạn cần đăng nhập với tài khoản quản trị viên hoặc giáo viên để truy cập trang này.</p>
            <a href="/login" className="inline-block bg-[#ffd275] border-3 border-black rounded-xl px-6 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffc342] transition-colors">
              Đi đến Trang Đăng Nhập
            </a>
          </div>
        </main>
      </div>
    );
  }

  const role = (session.user as any).role || "USER";

  return (
    <div className="min-h-screen flex flex-col bg-[#fefaf0]">
      <Header />
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar Menu */}
        <Sidebar role={role} />

        {/* Right Workspace Children */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}
