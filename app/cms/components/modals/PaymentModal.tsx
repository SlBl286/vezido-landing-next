"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Check, Percent, CreditCard, Tag } from "lucide-react";
import { cmsApi } from "@/lib/api-client";
import { NotificationModal } from "./NotificationModal";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any | null;
  onSuccess: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  student,
  onSuccess
}: PaymentModalProps) {
  const [promoCode, setPromoCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [promoMessage, setPromoMessage] = useState("");
  const [promoError, setPromoError] = useState("");
  
  const [originalFee, setOriginalFee] = useState(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info" | "confirm";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info"
  });

  const showNotification = (title: string, message: string, type: "success" | "error" | "info" | "confirm") => {
    setNotification({ isOpen: true, title, message, type });
  };

  useEffect(() => {
    if (isOpen && student) {
      const sessions = parseInt(student.class?.course?.duration || "0", 10) || 0;
      const feePerSession = student.class?.course?.fee || 0;
      const totalFee = sessions * feePerSession;
      setOriginalFee(totalFee);
      setAmountPaid(totalFee);
      setPromoCode("");
      setDiscountAmount(0);
      setIsPromoApplied(false);
      setPromoMessage("");
      setPromoError("");
      setError("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
    }
  }, [isOpen, student]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError("Vui lòng nhập mã giảm giá");
      return;
    }
    
    setVerifying(true);
    setPromoError("");
    setPromoMessage("");
    
    try {
      const result = await cmsApi.promotions.verify(promoCode.trim().toUpperCase(), originalFee);
      if (result.valid) {
        setDiscountAmount(result.discountAmount);
        setIsPromoApplied(true);
        setPromoMessage(result.message || "Áp dụng mã giảm giá thành công!");
        setAmountPaid(originalFee - result.discountAmount);
      } else {
        setPromoError(result.message || "Mã giảm giá không hợp lệ");
        setIsPromoApplied(false);
        setDiscountAmount(0);
        setAmountPaid(originalFee);
      }
    } catch (err: any) {
      setPromoError(err.message || "Lỗi khi kiểm tra mã giảm giá");
      setIsPromoApplied(false);
      setDiscountAmount(0);
      setAmountPaid(originalFee);
    } finally {
      setVerifying(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode("");
    setIsPromoApplied(false);
    setDiscountAmount(0);
    setPromoMessage("");
    setPromoError("");
    setAmountPaid(originalFee);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student?.id) return;
    
    setError("");
    setSubmitting(true);

    try {
      await cmsApi.students.updatePayment(student.id, {
        isPaid: true,
        amountPaid: Number(amountPaid),
        discountCode: isPromoApplied ? promoCode.trim().toUpperCase() : null,
        paymentDate: paymentDate ? new Date(paymentDate).toISOString() : null
      });
      
      showNotification("Thành công 💰", "Ghi nhận thanh toán học phí thành công!", "success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi cập nhật thanh toán");
      showNotification("Lỗi thanh toán", err.message || "Ghi nhận thanh toán thất bại.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !student) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white border-4 border-black rounded-[35px_15px_30px_10px/10px_30px_15px_35px] max-w-md w-full p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative my-8 animate-in zoom-in-95 duration-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer z-10"
          >
            <X className="w-5 h-5 text-black" />
          </button>

          <h3 className="text-2xl font-black text-black mb-1 flex items-center gap-2">
            💰 Thanh Toán Học Phí
          </h3>
          <p className="text-gray-500 text-sm mb-6">Ghi nhận học phí và áp mã ưu đãi cho học viên.</p>

          {error && (
            <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-xl p-3 mb-4 font-bold text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Student & Class Info */}
          <div className="border-3 border-black rounded-2xl p-4 bg-gray-50 mb-4 space-y-2.5 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-extrabold text-sm text-gray-900">{student.studentName}</h4>
                <p className="text-[10px] text-gray-500 font-bold">Mã HS: {student.studentCode || "Chưa có"}</p>
              </div>
              <span className="text-[10px] bg-[#bae1ff] border border-black rounded px-1.5 py-0.5 font-bold">
                Lớp: {student.class?.name}
              </span>
            </div>
            
            <div className="border-t border-dashed border-gray-300 pt-2 flex justify-between text-xs font-bold text-gray-600">
              <span>Khóa học:</span>
              <span className="text-gray-900">{student.class?.course?.title || "Không có liên kết"}</span>
            </div>
            
            <div className="flex justify-between items-start text-xs font-bold text-gray-600">
              <span>Học phí gốc:</span>
              <div className="text-right">
                <span className="text-gray-900 font-extrabold block">
                  {originalFee > 0 ? `${originalFee.toLocaleString("vi-VN")} đ` : "Chưa thiết lập"}
                </span>
                {originalFee > 0 && (
                  <span className="text-[9px] text-gray-400 font-bold block">
                    ({parseInt(student.class?.course?.duration || "0", 10) || 0} buổi x {(student.class?.course?.fee || 0).toLocaleString("vi-VN")} đ)
                  </span>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleConfirmPayment} className="space-y-4">
            {/* Promo input */}
            {originalFee > 0 && (
              <div>
                <label className="block text-xs font-black text-gray-800 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-purple-600" />
                  Mã giảm giá (Khuyến mãi)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled={isPromoApplied}
                    placeholder="Ví dụ: GIAM20"
                    className="flex-1 border-3 border-black rounded-xl p-2 bg-gray-50 font-black text-black text-xs uppercase focus:outline-none disabled:opacity-50 disabled:bg-gray-100"
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  />
                  {isPromoApplied ? (
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="bg-rose-100 hover:bg-rose-200 border-2 border-black text-rose-700 font-black text-xs px-3.5 rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={verifying}
                      onClick={handleApplyPromo}
                      className="bg-[#bae1ff] hover:bg-[#a2d4fc] border-2 border-black text-black font-black text-xs px-3.5 rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center gap-1"
                    >
                      {verifying && <Loader2 className="w-3 h-3 animate-spin" />}
                      Áp dụng
                    </button>
                  )}
                </div>
                {promoError && (
                  <p className="text-[10px] text-rose-600 font-bold mt-1">⚠️ {promoError}</p>
                )}
                {promoMessage && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ {promoMessage}</p>
                )}
              </div>
            )}

            {/* Calculations Breakdown */}
            <div className="border-2 border-black rounded-xl p-3 bg-[#fff9ed] space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>Học phí gốc:</span>
                <span>{originalFee.toLocaleString("vi-VN")} đ</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs font-bold text-purple-700">
                  <span className="flex items-center gap-0.5"><Percent className="w-3 h-3" /> Giảm giá:</span>
                  <span>- {discountAmount.toLocaleString("vi-VN")} đ</span>
                </div>
              )}
              
              <div className="border-t border-black/10 pt-2 flex justify-between font-black text-sm text-black">
                <span>Thành tiền:</span>
                <span className="text-amber-700">{(originalFee - discountAmount).toLocaleString("vi-VN")} đ</span>
              </div>
            </div>

            {/* Paid Input */}
            <div>
              <label className="block text-xs font-black text-gray-800 mb-1">Số tiền thực tế thanh toán (VNĐ) *</label>
              <input
                type="number"
                required
                min="0"
                className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-black text-black focus:outline-none text-sm"
                value={amountPaid}
                onChange={e => setAmountPaid(Number(e.target.value))}
              />
              <p className="text-[9px] text-gray-400 font-semibold mt-0.5">Mặc định tính theo thành tiền sau khi áp mã giảm giá.</p>
            </div>

            {/* Date Input */}
            <div>
              <label className="block text-xs font-black text-gray-800 mb-1">Ngày đóng học phí *</label>
              <input
                type="date"
                required
                className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-black/15">
              <button
                type="button"
                onClick={onClose}
                className="bg-white hover:bg-gray-50 border-3 border-black rounded-xl px-5 py-2.5 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#a8e6cf] hover:bg-[#8fd4ba] disabled:bg-gray-200 border-3 border-black rounded-xl px-5 py-2.5 font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer text-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Xác nhận thanh toán
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <NotificationModal
        isOpen={notification.isOpen}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}
