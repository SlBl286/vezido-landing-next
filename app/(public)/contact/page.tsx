import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col items-center  flex-1 text-center">
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
