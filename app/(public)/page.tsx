import { Metadata } from "next";
import Image from "next/image";
export const metadata: Metadata = {
  title: "Vẽ zì đó - Trang chủ",
  description: "Lớp học vẽ online và offline dành cho trẻ em",
};
export default function Home() {
  return (
    <main className="flex flex-col items-center  flex-1 text-center min-h-screen">
      <div className="flex w-full items-center justify-center bg-zinc-50 font-sans dark:bg-black">
     <Image
          className="dark:invert"
          src="/logo.png"
          alt="logo"
          width={100}
          height={20}
          priority
        />
    </div>
    </main>
  );
}
