import { Header } from "./components/layout/header";
import { Footer } from "./components/layout/footer";


export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <div className="min-h-full flex flex-col">
        <Header />
        {children}
        <Footer />
      </div>
  );
}
