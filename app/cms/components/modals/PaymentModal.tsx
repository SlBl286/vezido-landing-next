"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Check, Percent, CreditCard, Tag, Upload } from "lucide-react";
import { cmsApi } from "@/lib/api-client";
import { NotificationModal } from "./NotificationModal";
import { CustomSelect } from "../ui/custom-select";

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
  const [appliedPromotions, setAppliedPromotions] = useState<any[]>([]);
  const [promoMessage, setPromoMessage] = useState("");
  const [promoError, setPromoError] = useState("");
  
  const [originalFee, setOriginalFee] = useState(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER">("TRANSFER");
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [promotions, setPromotions] = useState<any[]>([]);
  
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

  const fetchPromotions = async () => {
    try {
      const res = await cmsApi.promotions.list();
      const activePromos = (res.promotions || []).filter((p: any) => {
        const now = new Date();
        const isStarted = !p.startDate || new Date(p.startDate) <= now;
        const isNotExpired = !p.endDate || new Date(p.endDate) >= now;
        const hasUsesLeft = p.maxUses === null || p.usedCount < p.maxUses;
        return p.isActive && isStarted && isNotExpired && hasUsesLeft;
      });
      setPromotions(activePromos);
    } catch (err) {
      console.error("Failed to load promotions:", err);
    }
  };

  useEffect(() => {
    if (isOpen && student) {
      const sessions = student.customDuration !== null && student.customDuration !== undefined
        ? Number(student.customDuration)
        : (parseInt(student.class?.course?.duration || "0", 10) || 0);
      const feePerSession = student.class?.course?.fee || 0;
      const totalFee = sessions * feePerSession;
      setOriginalFee(totalFee);
      setAmountPaid(totalFee);
      setPromoCode("");
      setAppliedPromotions([]);
      setPromoMessage("");
      setPromoError("");
      setError("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setPaymentMethod("TRANSFER");
      setPaymentProof(null);
      fetchPromotions();
    }
  }, [isOpen, student]);

  // Recalculate amount paid when applied promotions change
  useEffect(() => {
    const totalDiscount = appliedPromotions.reduce((sum, p) => sum + p.calculatedDiscount, 0);
    setAmountPaid(Math.max(0, originalFee - totalDiscount));
  }, [appliedPromotions, originalFee]);

  const applyPromoWithCode = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    if (appliedPromotions.some(p => p.code === cleanCode)) {
      setPromoError("Mã giảm giá này đã được áp dụng");
      return;
    }

    setVerifying(true);
    setPromoError("");
    setPromoMessage("");

    try {
      const result = await cmsApi.promotions.verify(cleanCode, originalFee);
      if (!result.valid) {
        setPromoError(result.message || "Mã giảm giá không hợp lệ");
        return;
      }

      // Fetch promotions to check isStackable
      const allPromos = await cmsApi.promotions.list();
      const promoDetails = allPromos.promotions?.find((p: any) => p.code === cleanCode);

      if (!promoDetails) {
        setPromoError("Không tìm thấy thông tin chi tiết khuyến mãi");
        return;
      }

      const newPromo = {
        code: cleanCode,
        discountType: promoDetails.discountType,
        discountValue: promoDetails.discountValue,
        minOrderValue: promoDetails.minOrderValue,
        maxDiscount: promoDetails.maxDiscount,
        isStackable: promoDetails.isStackable,
        calculatedDiscount: result.discountAmount
      };

      if (!newPromo.isStackable) {
        // Exclusive: clear all other promotions and apply only this one
        setAppliedPromotions([newPromo]);
        setPromoMessage(`Đã áp dụng mã độc quyền ${cleanCode} (-${newPromo.calculatedDiscount.toLocaleString("vi-VN")} đ)`);
      } else {
        // Stackable: check if there are exclusive codes applied
        const hasExclusive = appliedPromotions.some(p => !p.isStackable);
        if (hasExclusive) {
          setAppliedPromotions([newPromo]);
          setPromoMessage(`Đã áp dụng mã ${cleanCode}. Mã độc quyền trước đó đã bị xóa.`);
        } else {
          setAppliedPromotions([...appliedPromotions, newPromo]);
          setPromoMessage(`Đã áp dụng mã ${cleanCode} thành công!`);
        }
      }
      setPromoCode("");
    } catch (err: any) {
      setPromoError(err.message || "Lỗi khi kiểm tra mã giảm giá");
    } finally {
      setVerifying(false);
    }
  };

  const handleApplyPromo = async () => {
    applyPromoWithCode(promoCode);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student?.id) return;
    
    setError("");
    setSubmitting(true);

    try {
      const discountCodesStr = appliedPromotions.map(p => p.code).join(",");
      await cmsApi.students.updatePayment(student.id, {
        isPaid: true,
        amountPaid: Number(amountPaid),
        discountCode: discountCodesStr || null,
        paymentDate: paymentDate ? new Date(paymentDate).toISOString() : null,
        paymentMethod,
        paymentProof
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
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto"
      >
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
                    ({student.customDuration !== null && student.customDuration !== undefined 
                      ? `${student.customDuration} buổi tùy chỉnh` 
                      : `${parseInt(student.class?.course?.duration || "0", 10) || 0} buổi`} x {(student.class?.course?.fee || 0).toLocaleString("vi-VN")} đ)
                  </span>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleConfirmPayment} className="space-y-4">
            {/* Promo input */}
            {originalFee > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-800 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-purple-600" />
                  Mã giảm giá (Khuyến mãi)
                </label>
                
                {/* List of currently applied promotions */}
                {appliedPromotions.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap pb-1.5">
                    {appliedPromotions.map((p) => (
                      <div 
                        key={p.code} 
                        className={`border-2 border-black rounded-lg px-2 py-0.5 flex items-center gap-1 shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] text-[9px] font-black ${
                          p.isStackable ? "bg-[#bae1ff]" : "bg-[#ffd275]"
                        }`}
                      >
                        <span>
                          {p.code} (
                          {p.discountType === "PERCENTAGE" 
                            ? `-${p.discountValue}% ~ -${p.calculatedDiscount.toLocaleString("vi-VN")} đ` 
                            : `-${p.calculatedDiscount.toLocaleString("vi-VN")} đ`}
                          )
                        </span>
                        {!p.isStackable && <span className="bg-black text-white text-[7px] px-1 rounded scale-90">Độc quyền</span>}
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedPromotions(appliedPromotions.filter(item => item.code !== p.code));
                            setPromoMessage("");
                            setPromoError("");
                          }}
                          className="text-rose-700 hover:text-rose-950 font-black cursor-pointer ml-1 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  {promotions.length > 0 && (
                    <CustomSelect
                      value=""
                      onChange={(val) => {
                        if (val) {
                          applyPromoWithCode(val);
                        }
                      }}
                      options={[
                        { value: "", label: "-- Chọn mã ưu đãi từ danh sách --" },
                        ...promotions.map(p => ({
                          value: p.code,
                          label: `[${p.isStackable ? "Cộng dồn" : "Độc quyền"}] ${p.code} (${p.description || `${p.discountType === "PERCENTAGE" ? `${p.discountValue}%` : `${p.discountValue.toLocaleString("vi-VN")} đ`}`})`
                        }))
                      ]}
                      placeholder="Chọn mã ưu đãi..."
                    />
                  )}
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Hoặc nhập mã giảm giá khác..."
                      className="flex-1 border-3 border-black rounded-xl p-2 bg-gray-50 font-black text-black text-xs uppercase focus:outline-none"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value.toUpperCase())}
                    />
                    <button
                      type="button"
                      disabled={verifying}
                      onClick={() => applyPromoWithCode(promoCode)}
                      className="bg-[#bae1ff] hover:bg-[#a2d4fc] border-2 border-black text-black font-black text-xs px-3.5 rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      {verifying && <Loader2 className="w-3 h-3 animate-spin" />}
                      Áp dụng
                    </button>
                  </div>
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
              
              {appliedPromotions.length > 0 && (
                <div className="border-t border-black/10 pt-2 space-y-1.5">
                  <div className="text-[10px] font-black text-purple-800 flex items-center gap-1">
                    <Percent className="w-3 h-3" /> Chi tiết giảm giá:
                  </div>
                  {appliedPromotions.map((p) => (
                    <div key={p.code} className="flex justify-between text-xs font-semibold text-purple-700 pl-2">
                      <span>🏷️ {p.code}:</span>
                      <span>
                        - {p.discountType === "PERCENTAGE" 
                          ? `${p.discountValue}% (-${p.calculatedDiscount.toLocaleString("vi-VN")} đ)` 
                          : `${p.calculatedDiscount.toLocaleString("vi-VN")} đ`}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-black text-purple-800 pt-1.5 border-t border-dashed border-purple-300 mt-1">
                    <span>Tổng giảm giá:</span>
                    <span>- {appliedPromotions.reduce((sum, p) => sum + p.calculatedDiscount, 0).toLocaleString("vi-VN")} đ</span>
                  </div>
                </div>
              )}
              
              <div className="border-t border-black/10 pt-2 flex justify-between font-black text-sm text-black">
                <span>Thành tiền:</span>
                <span className="text-amber-700">
                  {(originalFee - appliedPromotions.reduce((sum, p) => sum + p.calculatedDiscount, 0)).toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            {/* Paid Input */}
            <div>
              <label className="block text-xs font-black text-gray-800 mb-1">Số tiền thực tế thanh toán (VNĐ) *</label>
              <input
                type="text"
                required
                className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-black text-black focus:outline-none text-sm"
                value={amountPaid === 0 ? "" : amountPaid.toLocaleString("vi-VN")}
                onChange={e => {
                  const rawValue = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
                  setAmountPaid(rawValue ? parseInt(rawValue, 10) : 0);
                }}
              />
              {amountPaid > 0 && (
                <p className="text-xs text-amber-700 font-extrabold mt-1.5 italic bg-amber-50 border border-amber-200 rounded-lg p-2 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  ✍️ Bằng chữ: {spellNumberVietnamese(amountPaid)}
                </p>
              )}
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

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-black text-gray-800 mb-1">Phương thức thanh toán *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`flex-1 py-2.5 text-xs font-black border-2 border-black rounded-xl transition-all cursor-pointer ${
                    paymentMethod === "CASH" 
                      ? "bg-[#a8e6cf] text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] translate-x-[0.5px] translate-y-[0.5px]" 
                      : "bg-white text-gray-700 hover:bg-stone-50"
                  }`}
                >
                  💵 Tiền mặt
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("TRANSFER")}
                  className={`flex-1 py-2.5 text-xs font-black border-2 border-black rounded-xl transition-all cursor-pointer ${
                    paymentMethod === "TRANSFER" 
                      ? "bg-[#bae1ff] text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] translate-x-[0.5px] translate-y-[0.5px]" 
                      : "bg-white text-gray-700 hover:bg-stone-50"
                  }`}
                >
                  🏦 Chuyển khoản
                </button>
              </div>
            </div>

            {/* Payment Proof */}
            {paymentMethod === "TRANSFER" && (
              <div>
                <label className="block text-xs font-black text-gray-800 mb-1">Biên lai chuyển khoản / Minh chứng</label>
                <div className="border-3 border-dashed border-black rounded-xl p-4 bg-gray-50 flex flex-col items-center justify-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setPaymentProof(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                    id="payment-proof-file-input"
                  />
                  <label
                    htmlFor="payment-proof-file-input"
                    className="bg-[#ffd275] hover:bg-[#ffc342] border-2 border-black rounded-lg px-4 py-2 font-black text-xs shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    Tải ảnh biên lai lên
                  </label>
                  <p className="text-[9px] text-gray-400 font-bold">Hỗ trợ các định dạng ảnh chụp màn hình</p>
                  
                  {paymentProof ? (
                    <div className="relative w-28 h-28 border-2 border-black rounded-lg overflow-hidden mt-1 shadow-md">
                      <img src={paymentProof} alt="Receipt proof" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPaymentProof(null)}
                        className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 border border-black hover:bg-rose-600 transition-colors shadow-sm"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-[9px] text-gray-400 font-bold">Chưa tải biên lai lên</p>
                  )}
                </div>
              </div>
            )}

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

function spellNumberVietnamese(num: number): string {
  if (num === 0) return "Không đồng";
  
  const units = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  
  let words: string[] = [];
  let chunkCount = 0;
  let temp = num;
  
  while (temp > 0) {
    const chunk = temp % 1000;
    if (chunk > 0) {
      const chunkWords = readThreeDigits(chunk, temp >= 1000);
      const unit = units[chunkCount];
      if (unit) {
        chunkWords.push(unit);
      }
      words = [...chunkWords, ...words];
    }
    temp = Math.floor(temp / 1000);
    chunkCount++;
  }
  
  function readThreeDigits(n: number, hasHigher: boolean): string[] {
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const one = n % 10;
    
    const chunkWords: string[] = [];
    
    if (hundred > 0 || hasHigher) {
      chunkWords.push(digits[hundred], "trăm");
    }
    
    if (ten > 0) {
      if (ten === 1) {
        chunkWords.push("mười");
      } else {
        chunkWords.push(digits[ten], "mươi");
      }
    } else if (one > 0 && (hundred > 0 || hasHigher)) {
      chunkWords.push("lẻ");
    }
    
    if (one > 0) {
      if (one === 1 && ten > 1) {
        chunkWords.push("mốt");
      } else if (one === 5 && ten > 0) {
        chunkWords.push("lăm");
      } else if (one === 4 && ten > 1) {
        chunkWords.push("tư");
      } else {
        chunkWords.push(digits[one]);
      }
    }
    
    return chunkWords;
  }
  
  const result = words.join(" ").trim();
  if (!result) return "";
  
  return result.charAt(0).toUpperCase() + result.slice(1) + " đồng";
}
