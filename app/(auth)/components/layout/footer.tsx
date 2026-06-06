export const Footer = () => {
  return (
    <footer className="w-full border-t-4 border-black bg-[#1a1a2e] text-white py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Vẽ zì đó"
            width={50}
            className="object-contain invert"
          />
          <p className="text-xs text-gray-400 font-semibold max-w-xs leading-relaxed">
            Nuôi dưỡng năng khiếu hội họa và phát triển tư duy sáng tạo toàn diện.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
          <img src="/nhan_vat.png" alt="mascot" width={32} className="object-contain opacity-50" />
          <span>&copy; {new Date().getFullYear()} Vẽ zì đó. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};
