"use client";

import React from "react";
import { X, CheckCircle, AlertTriangle, CreditCard, Copy, Link } from "lucide-react";

interface StudentClassesPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any | null;
  userRole?: string;
  onOpenPayment: (enrollment: any) => void;
  onNotification: (title: string, message: string, type: "success" | "error" | "info" | "confirm") => void;
}

export function StudentClassesPaymentModal({
  isOpen,
  onClose,
  student,
  userRole,
  onOpenPayment,
  onNotification
}: StudentClassesPaymentModalProps) {
  if (!isOpen || !student) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 z-40 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-[#fefaf0] border-4 border-black rounded-[25px_10px_20px_10px/10px_20px_10px_25px] max-w-md w-full p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative my-8 animate-in zoom-in-95 duration-150">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <span className="text-xs bg-[#bae1ff] border-2 border-black rounded-lg px-2.5 py-0.5 font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase">
            Mã HS: {student.studentCode || "Chưa có mã"}
          </span>
          <h3 className="text-xl font-black text-black mt-2">
            📚 Lớp học & Học phí của {student.studentName}
          </h3>
          <p className="text-gray-500 text-xs mt-1 font-bold">
            Quản lý chi tiết các lớp đang tham gia và tình trạng đóng học phí
          </p>
        </div>

        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
          {(!student.enrollments || student.enrollments.length === 0) ? (
            <p className="text-center font-bold text-gray-400 italic py-4">Chưa đăng ký lớp học nào</p>
          ) : (
            student.enrollments.map((enrollment: any) => (
              <div 
                key={enrollment.id} 
                className="border-3 border-black bg-white rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-black text-gray-900 text-sm">{enrollment.class?.name || "Lớp học"}</h4>
                    <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                      Lịch học: {enrollment.class?.schedule || "Chưa xếp lịch"}
                    </p>
                  </div>
                  {enrollment.isPaid ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 border-2 border-emerald-400 rounded-lg px-2 py-0.5 font-black whitespace-nowrap">
                      ✓ Đã đóng
                    </span>
                  ) : (
                    <span className="text-[10px] bg-rose-100 text-rose-800 border-2 border-rose-400 rounded-lg px-2 py-0.5 font-black whitespace-nowrap">
                      ✗ Chưa đóng
                    </span>
                  )}
                </div>

                {!enrollment.isPaid && (
                  <div className="flex gap-2 pt-1.5 border-t border-dashed border-gray-200 justify-end">
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/pay/${enrollment.id}`;
                        navigator.clipboard.writeText(url);
                        onNotification(
                          "Đã sao chép 🔗",
                          `Đã sao chép liên kết thanh toán lớp ${enrollment.class?.name} của bé ${student.studentName}: \n${url}`,
                          "success"
                        );
                      }}
                      className="inline-flex items-center gap-1 text-[10px] bg-white hover:bg-gray-50 text-sky-700 border-2 border-black rounded-lg px-2.5 py-1 font-black transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Sao chép link HP
                    </button>
                    {userRole === "ADMIN" && (
                      <button
                        onClick={() => {
                          onOpenPayment(enrollment);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 text-[10px] bg-[#ffd275] hover:bg-[#ffc342] text-black border-2 border-black rounded-lg px-2.5 py-1 font-black transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Đóng học phí
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4 mt-2 border-t-2 border-black/10">
          <button
            onClick={onClose}
            className="px-5 py-2 border-3 border-black bg-white hover:bg-gray-100 rounded-xl text-xs font-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
