import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PrinterClient } from "./PrinterClient";
import React from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

function numberToVietnameseWords(n: number): string {
  if (n === 0) return "Không đồng";
  
  const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const tens = ["", "mười", "hai mươi", "ba mươi", "bốn mươi", "năm mươi", "sáu mươi", "bảy mươi", "tám mươi", "chín mươi"];
  
  const readGroup = (group: number): string => {
    let s = "";
    const h = Math.floor(group / 100);
    const t = Math.floor((group % 100) / 10);
    const u = group % 10;
    
    if (h > 0) {
      s += units[h] + " trăm ";
    } else if (s !== "") {
      s += "không trăm ";
    }
    
    if (t > 0) {
      s += tens[t] + " ";
    } else if (h > 0 && u > 0) {
      s += "linh ";
    }
    
    if (u > 0) {
      if (u === 1 && t > 1) {
        s += "mốt";
      } else if (u === 5 && t > 0) {
        s += "lăm";
      } else {
        s += units[u];
      }
    }
    
    return s.trim();
  };

  let words = "";
  let temp = n;
  
  const billion = Math.floor(temp / 1000000000);
  temp %= 1000000000;
  const million = Math.floor(temp / 1000000);
  temp %= 1000000;
  const thousand = Math.floor(temp / 100); // Wait, this should be Math.floor(temp / 1000)! Let's check my previous code
  // Yes:
  // const thousand = Math.floor(temp / 1000);
  // Let's write the correct calculation below:
  const thousand_val = Math.floor(temp / 1000);
  const unit_val = temp % 1000;
  
  if (billion > 0) {
    words += readGroup(billion) + " tỷ ";
  }
  if (million > 0) {
    words += readGroup(million) + " triệu ";
  }
  if (thousand_val > 0) {
    words += readGroup(thousand_val) + " nghìn ";
  }
  if (unit_val > 0) {
    words += readGroup(unit_val);
  }
  
  const result = words.trim().replace(/\s+/g, " ") + " đồng";
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export default async function ReceiptPage({ params }: PageProps) {
  const { id } = await params;

  // Retrieve enrollment info with course details
  const student = await prisma.studentClass.findUnique({
    where: { id },
    include: {
      class: {
        include: {
          course: {
            include: {
              classCategory: true
            }
          }
        }
      }
    }
  });

  if (!student || !student.isPaid) {
    return notFound();
  }

  const course = student.class?.course || null;
  const courseFeeUnit = course?.feeUnit || "buổi";
  const courseFeePerSession = course?.fee || 0;
  const courseSessions = course?.duration ? (parseInt(course.duration, 10) || 0) : 0;
  const originalFee = courseSessions * courseFeePerSession;
  
  const amountPaid = student.amountPaid || 0;
  const discountAmount = Math.max(0, originalFee - amountPaid);
  const amountPaidInWords = numberToVietnameseWords(amountPaid);

  return (
    <div className="min-h-screen bg-white p-8 md:p-12 max-w-3xl mx-auto relative font-sans text-gray-900 leading-relaxed print:p-0">
      
      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .receipt-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Printer trigger controller */}
      <PrinterClient />

      {/* Main Receipt Content Frame */}
      <div className="receipt-container border-4 border-black p-8 md:p-10 rounded-3xl shadow-[8px_8px_0px_rgba(0,0,0,1)] bg-white space-y-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-black pb-6 gap-4">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">
              MỸ THUẬT SÁNG TẠO VẼ ZÌ ĐÓ
            </h1>
            <p className="text-xs font-bold text-gray-500">Khơi nguồn đam mê hội họa cho bé yêu</p>
            <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
              📍 Địa chỉ: 123 Đường Sáng Tạo, Quận Vẽ Vời, Hà Nội<br />
              📞 Hotline: 090-XXXX-XXX | 🌐 Website: vezido.edu.vn
            </p>
          </div>
          <div className="text-left md:text-right space-y-1 md:self-stretch flex flex-col justify-between">
            <span className="inline-block bg-[#ffd275] border-2 border-black rounded px-2.5 py-0.5 text-[9px] font-black text-black uppercase tracking-wider md:self-end">
              Mã biên lai / Slip ID
            </span>
            <span className="font-mono font-black text-sm block tracking-widest text-gray-800">
              #{student.id.substring(0, 12).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Title Block */}
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl font-black tracking-wide text-black uppercase">
            BIÊN LAI THU HỌC PHÍ
          </h2>
          <p className="text-[10px] font-extrabold text-gray-400 tracking-widest uppercase">
            Tuition Fee Receipt
          </p>
          <p className="text-xs font-bold text-gray-500 italic mt-1">
            Ngày lập / Date: {student.paymentDate ? new Date(student.paymentDate).toLocaleDateString("vi-VN", {
              day: "numeric",
              month: "long",
              year: "numeric"
            }) : new Date().toLocaleDateString("vi-VN")}
          </p>
        </div>

        {/* Student details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-2 border-black rounded-2xl p-4 bg-stone-50/50 text-xs font-bold">
          <div className="space-y-2">
            <p className="flex justify-between">
              <span className="text-gray-400 font-extrabold">Họ tên học viên:</span>
              <span className="text-black font-black">{student.studentName}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-400 font-extrabold">Mã học sinh:</span>
              <span className="text-purple-800 font-black">{student.studentCode || "Chưa có"}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-400 font-extrabold">Tuổi học viên:</span>
              <span className="text-black font-semibold">{student.studentAge ? `${student.studentAge} tuổi` : "N/A"}</span>
            </p>
          </div>
          <div className="space-y-2">
            <p className="flex justify-between">
              <span className="text-gray-400 font-extrabold">Lớp học đăng ký:</span>
              <span className="text-black font-black">{student.class?.name || "Chưa xếp lớp"}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-400 font-extrabold">Khóa học liên kết:</span>
              <span className="text-amber-800 font-black">{course?.title || "N/A"}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-400 font-extrabold">Người nộp tiền (Phụ huynh):</span>
              <span className="text-black font-semibold">
                {student.parentName || "N/A"} {student.parentPhone ? `(${student.parentPhone})` : ""}
              </span>
            </p>
          </div>
        </div>

        {/* Table list of receipt items */}
        <div className="overflow-hidden border-2 border-black rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th className="py-2.5 px-4 font-black text-[10px] uppercase">Nội dung thu / Details</th>
                <th className="py-2.5 px-4 font-black text-[10px] uppercase text-center w-20">Đơn vị</th>
                <th className="py-2.5 px-4 font-black text-[10px] uppercase text-center w-16">SL</th>
                <th className="py-2.5 px-4 font-black text-[10px] uppercase text-right w-28">Đơn giá</th>
                <th className="py-2.5 px-4 font-black text-[10px] uppercase text-right w-32">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              
              {/* Row 1: Course Fee */}
              <tr className="border-b border-black/10">
                <td className="py-3 px-4 font-bold">
                  Học phí khóa học {course?.title || student.class?.name || "Chưa xếp lớp"}
                  {course && (
                    <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">
                      Phân loại: {course.classCategory?.name || "Chưa phân loại"} {course.level ? `- Cấp độ ${course.level}` : ""}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-center text-gray-500 font-semibold">{courseFeeUnit}</td>
                <td className="py-3 px-4 text-center text-gray-800 font-black">{courseSessions}</td>
                <td className="py-3 px-4 text-right text-gray-600">{courseFeePerSession.toLocaleString("vi-VN")} đ</td>
                <td className="py-3 px-4 text-right font-black text-gray-900">{originalFee.toLocaleString("vi-VN")} đ</td>
              </tr>

              {/* Row 2: Discount if applicable */}
              {discountAmount > 0 && (
                <tr className="border-b border-black/10 text-purple-800 bg-purple-50/20">
                  <td className="py-3 px-4 font-bold">
                    Khấu trừ ưu đãi giảm giá
                    {student.discountCode && (
                      <span className="bg-purple-100 border border-purple-300 rounded px-1.5 py-0.5 text-[8px] font-black text-purple-800 uppercase inline-block ml-1">
                        {student.discountCode}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-purple-500 font-semibold">Khóa</td>
                  <td className="py-3 px-4 text-center font-black">1</td>
                  <td className="py-3 px-4 text-right text-purple-500">- {discountAmount.toLocaleString("vi-VN")} đ</td>
                  <td className="py-3 px-4 text-right font-black">- {discountAmount.toLocaleString("vi-VN")} đ</td>
                </tr>
              )}

              {/* Row 3: Totals */}
              <tr className="bg-stone-50 font-black text-sm">
                <td colSpan={4} className="py-3.5 px-4 text-right border-t border-black text-black">
                  Tổng tiền đã thanh toán / Net Total Paid:
                </td>
                <td className="py-3.5 px-4 text-right text-emerald-800 text-base border-t border-black">
                  {amountPaid.toLocaleString("vi-VN")} VNĐ
                </td>
              </tr>

            </tbody>
          </table>
        </div>

        {/* Amount in Words */}
        <div className="border-2 border-black rounded-2xl p-4 bg-[#fff9ed] text-xs font-bold text-gray-800">
          👉 <span className="font-extrabold text-stone-500">Bằng chữ / In words:</span>{" "}
          <span className="text-black font-black italic">{amountPaidInWords}</span>
        </div>

        {/* Signatures grid */}
        <div className="grid grid-cols-3 gap-4 pt-4 text-center text-xs font-bold">
          <div className="space-y-16">
            <div>
              <p className="text-gray-900">Người nộp tiền</p>
              <p className="text-[10px] text-gray-400 font-semibold italic">(Ký, ghi rõ họ tên)</p>
            </div>
            <p className="text-gray-400 font-semibold italic text-[11px] pt-2">................................</p>
          </div>
          
          <div className="space-y-16">
            <div>
              <p className="text-gray-900">Người lập biên lai</p>
              <p className="text-[10px] text-gray-400 font-semibold italic">(Ký, ghi rõ họ tên)</p>
            </div>
            <p className="text-gray-950 font-black text-[11px] pt-2">Đoàn Duy Quý</p>
          </div>
          
          <div className="space-y-16">
            <div>
              <p className="text-gray-900">Thủ trưởng trung tâm</p>
              <p className="text-[10px] text-gray-400 font-semibold italic">(Ký, đóng dấu)</p>
            </div>
            <div className="pt-2 flex flex-col items-center">
              <div className="w-14 h-14 border border-rose-400 rounded-full flex items-center justify-center text-rose-500 text-[8px] font-black uppercase rotate-6 scale-90 opacity-70">
                ĐÃ THU TIỀN
              </div>
            </div>
          </div>
        </div>

        {/* Footer info stamp */}
        <div className="border-t border-dashed border-gray-300 pt-6 text-center text-[10px] text-gray-400 font-bold space-y-1">
          <p>💖 Cảm ơn ba mẹ đã luôn tin tưởng và đồng hành cùng Mỹ thuật Sáng tạo Vẽ zì đó!</p>
          <p>Mọi thắc mắc về lớp học vui lòng phản hồi hotline hoặc gửi qua ứng dụng phụ huynh Vezido.</p>
        </div>

      </div>
    </div>
  );
}
