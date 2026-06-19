import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import Image from "next/image";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t-4 border-black bg-[#1a1a2e] text-white">
      {/* Main Footer Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-5">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Vẽ zì đó logo"
                width={70}
                height={70}
                loading="eager"
                className="object-contain invert"
              />
            </div>
            <p className="text-xs text-gray-400 font-semibold leading-relaxed">
              Lớp học vẽ sáng tạo dành cho trẻ em từ 4-12 tuổi. Nuôi dưỡng năng
              khiếu hội họa và phát triển tư duy sáng tạo toàn diện.
            </p>
            {/* Social */}
            <div className="flex gap-3 pt-2">
              <a
                href="https://www.facebook.com/vezido"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/10 hover:bg-blue-600 border border-white/20 rounded-lg flex items-center justify-center transition-all"
              >
                <Image
                  src="/facebook.png"
                  alt="Facebook"
                  width={18}
                  height={18}
                  loading="eager"
                  className="invert"
                />
              </a>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-4">
            <h4 className="font-black text-sm uppercase tracking-wider text-white border-b border-white/10 pb-2">
              Khám Phá
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-gray-400">
              {[
                { label: "Trang chủ", href: "/" },
                { label: "Bảng giá các khóa học", href: "/pricing" },
                { label: "Lịch học tuần này", href: "/schedule" },
                { label: "Kết quả học tập", href: "/portfolio" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="hover:text-amber-300 hover:translate-x-1 inline-block transition-all duration-150"
                  >
                    → {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Courses */}
          <div className="space-y-4">
            <h4 className="font-black text-sm uppercase tracking-wider text-white border-b border-white/10 pb-2">
              Khóa Học
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-gray-400">
              {[
                { label: "Lớp Mầm Non (4-6 tuổi)", href: "/pricing" },
                { label: "Lớp Năng Khiếu (7-9 tuổi)", href: "/pricing" },
                { label: "Lớp Nghệ Sĩ Nhí (10-12 tuổi)", href: "/pricing" },
                { label: "Đăng ký học thử miễn phí", href: "/enroll" },
              ].map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={item.href}
                    className="hover:text-amber-300 hover:translate-x-1 inline-block transition-all duration-150"
                  >
                    → {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-black text-sm uppercase tracking-wider text-white border-b border-white/10 pb-2">
              Liên Hệ
            </h4>
            <ul className="space-y-3 text-xs font-semibold text-gray-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <span>108c Vương Thừa Vũ, Thanh Xuân, Hà Nội</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 shrink-0 text-emerald-400" />
                <a
                  href="tel:0348823095"
                  className="hover:text-white transition-colors"
                >
                  0348.823.095 (Cô Phụng)
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 shrink-0 text-sky-400" />
                <a
                  href="mailto:lienhe@vezido.edu.vn"
                  className="hover:text-white transition-colors"
                >
                  lienhe@vezido.edu.vn
                </a>
              </li>
            </ul>
            {/* CTA */}
            <Link
              href="/contact"
              className="inline-block mt-4 bg-amber-300 hover:bg-amber-400 text-black font-black text-xs px-4 py-2 border-2 border-amber-300 rounded-lg shadow-[3px_3px_0px_rgba(255,200,0,0.4)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_rgba(255,200,0,0.4)] transition-all"
            >
              💬 Nhắn tin tư vấn
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] font-semibold text-gray-500">
          <p>© {currentYear} Vẽ zì đó. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <Image
              src="/nhan_vat.png"
              alt="mascot"
              width={28}
              height={28}
              className="object-contain  opacity-50"
            />
            <span>Nuôi dưỡng đam mê nghệ thuật ❤️</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
