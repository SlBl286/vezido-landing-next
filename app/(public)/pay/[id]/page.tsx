"use client";

import React, { useEffect, useState, use } from "react";
import { Loader2, CheckCircle2, CreditCard, Tag, RefreshCw, Landmark, ArrowLeft, Percent, AlertCircle, ArrowRight } from "lucide-react";

interface PaymentDetails {
  id: string;
  studentName: string;
  studentCode: string | null;
  parentName: string;
  className: string;
  courseTitle: string | null;
  courseFee: number;
  isPaid: boolean;
  amountPaid: number | null;
  discountCode: string | null;
  paymentDate: string | null;
  sepayTransactionId: string | null;
}

type Step = "setup" | "checkout" | "card_pending";

function removeVietnameseAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export default function PublicPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<PaymentDetails | null>(null);
  const [error, setError] = useState("");

  const [step, setStep] = useState<Step>("setup");
  const [paymentMethod, setPaymentMethod] = useState<"TRANSFER" | "CASH" | "CARD">("TRANSFER");
  const [completedMethod, setCompletedMethod] = useState<"TRANSFER" | "CASH" | "CARD" | null>(null);

  const [promoCode, setPromoCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");
  const [promoError, setPromoError] = useState("");
  const [appliedPromos, setAppliedPromos] = useState<Array<{ code: string; discountAmount: number; description: string }>>([]);
  
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchPaymentDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/public/pay/${id}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Không tìm thấy thông tin đăng ký học");
      }
      const data = await res.json();
      setDetails(data);
      if (data.isPaid) {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "Không thể tải thông tin thanh toán");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentDetails();
  }, [id]);

  // Polling payment status every 3 seconds to auto-update UI when webhook hits
  useEffect(() => {
    if (success) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/public/pay/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.isPaid) {
            setDetails(data);
            setSuccess(true);
          }
        }
      } catch (err) {
        console.error("Error polling payment status:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id, success]);

  const handleApplyPromo = async () => {
    const codeToApply = promoCode.trim().toUpperCase();
    if (!codeToApply || !details) {
      setPromoError("Vui lòng nhập mã giảm giá");
      return;
    }

    if (appliedPromos.some(p => p.code === codeToApply)) {
      setPromoError("Mã giảm giá này đã được áp dụng");
      return;
    }

    setVerifying(true);
    setPromoError("");
    setPromoMessage("");

    try {
      const remainingAmount = Math.max(0, details.courseFee - discountAmount);
      if (remainingAmount <= 0) {
        setPromoError("Học phí đã được giảm về 0 đ, không thể áp dụng thêm mã");
        setVerifying(false);
        return;
      }

      const res = await fetch(
        `/api/public/promotions/verify?code=${encodeURIComponent(codeToApply)}&amount=${remainingAmount}`
      );
      const result = await res.json();
      if (res.ok && result.valid) {
        const newPromo = {
          code: codeToApply,
          discountAmount: result.discountAmount,
          description: result.description || "Giảm giá",
        };
        const updated = [...appliedPromos, newPromo];
        setAppliedPromos(updated);
        setDiscountAmount(discountAmount + result.discountAmount);
        setPromoMessage(`Áp dụng mã ${codeToApply} thành công!`);
        setPromoCode("");
      } else {
        setPromoError(result.message || "Mã giảm giá không hợp lệ");
      }
    } catch (err: any) {
      setPromoError("Lỗi khi kiểm tra mã giảm giá");
    } finally {
      setVerifying(false);
    }
  };

  const handleRemovePromo = async (codeToRemove: string) => {
    const remainingPromos = appliedPromos.filter(p => p.code !== codeToRemove);
    setPromoMessage("");
    setPromoError("");

    if (!details) return;

    setVerifying(true);
    let tempTotalDiscount = 0;
    const updatedPromos = [];

    try {
      for (const promo of remainingPromos) {
        const remaining = details.courseFee - tempTotalDiscount;
        if (remaining <= 0) break;

        const res = await fetch(
          `/api/public/promotions/verify?code=${encodeURIComponent(promo.code)}&amount=${remaining}`
        );
        const result = await res.json();
        if (res.ok && result.valid) {
          tempTotalDiscount += result.discountAmount;
          updatedPromos.push({
            code: promo.code,
            discountAmount: result.discountAmount,
            description: result.description || "Giảm giá",
          });
        }
      }
      setAppliedPromos(updatedPromos);
      setDiscountAmount(tempTotalDiscount);
    } catch (err) {
      console.error("Error recalculating promotions:", err);
      setPromoError("Có lỗi xảy ra khi cập nhật mã giảm giá");
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirmPayment = async (method: "TRANSFER" | "CASH") => {
    if (!details) return;

    setSubmitting(true);
    setError("");

    const finalAmount = Math.max(0, details.courseFee - discountAmount);
    const discountCodesString = appliedPromos.map(p => p.code).join(", ");

    try {
      const res = await fetch(`/api/public/pay/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaid: finalAmount,
          discountCode: discountCodesString || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gửi xác nhận thanh toán thất bại.");
      }

      setCompletedMethod(method);
      setSuccess(true);
      fetchPaymentDetails();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = async () => {
    if (paymentMethod === "TRANSFER") {
      setStep("checkout");
    } else if (paymentMethod === "CARD") {
      setStep("card_pending");
    } else if (paymentMethod === "CASH") {
      await handleConfirmPayment("CASH");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fefaf0] py-20 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-12 h-12 animate-spin text-amber-500" />
        <p className="font-black text-gray-700 text-sm">Đang tải thông tin hóa đơn...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-[#fefaf0] py-20 px-4">
        <div className="border-4 border-black bg-white rounded-3xl p-8 max-w-md mx-auto text-center shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <span className="text-6xl mb-4 block">⚠️</span>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Đã xảy ra lỗi</h1>
          <p className="text-gray-600 mb-6">{error || "Hóa đơn thanh toán không tồn tại hoặc đã bị xóa."}</p>
          <a
            href="/"
            className="inline-block bg-[#ffd275] border-3 border-black rounded-xl px-6 py-3 font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-[#ffc342] transition-colors"
          >
            Quay lại trang chủ
          </a>
        </div>
      </div>
    );
  }

  const finalAmount = Math.max(0, details.courseFee - discountAmount);
  
  // Build clean alphanumeric transfer description
  const cleanStudentCode = details.studentCode ? removeVietnameseAccents(details.studentCode) : `HS${id.substring(0, 4).toUpperCase()}`;
  const cleanClassName = removeVietnameseAccents(details.className);
  const transferDescription = `VEZIDO DONG HP ${cleanStudentCode} LOP ${cleanClassName}`.substring(0, 50).trim();

  // Sepay QR Endpoint
  const sepayQrUrl = `https://qr.sepay.vn/img?bank=MBBank&acc=VQRQAJVMU5026&template=compact&amount=${finalAmount}&des=${encodeURIComponent(
    transferDescription
  )}&showinfo=true&fullacc=true&holder=DOAN%20DUY%20QUY&store=V%E1%BA%BD%20z%C3%AC%20%C4%91%C3%B3`;

  // Display method resolver
  const displayMethod = completedMethod || (details.sepayTransactionId ? "TRANSFER" : (details.isPaid ? "CASH" : null));

  return (
    <main className="min-h-screen bg-[#fefaf0] py-12 px-4 md:px-8 bg-[radial-gradient(circle_at_2px_2px,#bec7d1_1px,transparent_0)] bg-[size:24px_24px]">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Title */}
        <header className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-sm bg-amber-100 border-2 border-black rounded-lg px-3 py-1 font-black text-amber-800 shadow-[2px_2px_0px_rgba(0,0,0,1)] uppercase tracking-wider">
            🏛️ TRUNG TÂM MỸ THUẬT VẼ ZÌ ĐÓ
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">
            Thanh Toán Học Phí
          </h1>
          <p className="text-gray-500 font-semibold text-sm">
            Ba mẹ vui lòng chọn phương thức thanh toán và hoàn tất các thủ tục đóng học phí cho bé.
          </p>
        </header>

        {success ? (
          <div className="border-4 border-black bg-white rounded-3xl p-8 md:p-12 shadow-[10px_10px_0px_rgba(0,0,0,1)] text-center space-y-6 max-w-2xl mx-auto animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-[#baffc9] border-4 border-black rounded-full flex items-center justify-center shadow-[6px_6px_0px_rgba(0,0,0,1)] mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-emerald-800" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 leading-tight">Ghi Nhận Thành Công!</h2>
            <div className="max-w-md mx-auto space-y-4 font-bold text-sm text-gray-600 leading-relaxed text-left bg-gray-50 border-3 border-black p-6 rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <p className="border-b border-dashed border-gray-300 pb-2 flex justify-between">
                <span>Học viên nhí:</span>
                <span className="text-gray-900 font-extrabold">{details.studentName}</span>
              </p>
              <p className="border-b border-dashed border-gray-300 pb-2 flex justify-between">
                <span>Lớp học:</span>
                <span className="text-gray-900 font-extrabold">{details.className}</span>
              </p>
              <p className="border-b border-dashed border-gray-300 pb-2 flex justify-between">
                <span>Số tiền ghi nhận:</span>
                <span className="text-emerald-700 font-extrabold">{(details.amountPaid || finalAmount).toLocaleString("vi-VN")} đ</span>
              </p>
              <p className="border-b border-dashed border-gray-300 pb-2 flex justify-between">
                <span>Hình thức:</span>
                <span className="text-blue-800 font-extrabold">
                  {displayMethod === "CASH" ? "💵 Tiền mặt tại quầy" : "🏛️ Chuyển khoản ngân hàng"}
                </span>
              </p>
              {details.discountCode && (
                <p className="border-b border-dashed border-gray-300 pb-2 flex justify-between">
                  <span>Mã ưu đãi:</span>
                  <span className="text-purple-700 font-extrabold">{details.discountCode}</span>
                </p>
              )}
              <p className="flex justify-between">
                <span>Thời gian:</span>
                <span className="text-gray-950 font-extrabold">
                  {new Date(details.paymentDate || new Date()).toLocaleString("vi-VN")}
                </span>
              </p>
            </div>
            <p className="text-xs text-gray-400 font-semibold italic">
              * Hệ thống đã lưu trữ giao dịch đóng học phí. Ban quản trị trung tâm sẽ liên hệ hoặc gửi thông báo qua App đến ba mẹ sớm nhất.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* STEP 1: SETUP (Promo & Choose Payment Method) */}
            {step === "setup" && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in duration-200">
                
                {/* Left Side: Student Info & Payment Breakdown */}
                <div className="lg:col-span-3 space-y-6">
                  
                  {/* Roster Information Card */}
                  <div className="border-4 border-black bg-white rounded-3xl p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] space-y-4">
                    <h3 className="text-xl font-black text-black border-b-2 border-black pb-2 flex items-center gap-2">
                      👶 Thông tin học phí của bé
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-bold text-xs">
                      <div className="space-y-1 bg-gray-50 border-2 border-black/10 rounded-xl p-3">
                        <span className="text-gray-400 block font-extrabold text-[9px] uppercase">Học sinh</span>
                        <span className="text-gray-900 text-sm font-black">{details.studentName}</span>
                      </div>
                      <div className="space-y-1 bg-gray-50 border-2 border-black/10 rounded-xl p-3">
                        <span className="text-gray-400 block font-extrabold text-[9px] uppercase">Mã học viên</span>
                        <span className="text-purple-800 text-sm font-black">{details.studentCode || "Chưa cấp mã"}</span>
                      </div>
                      <div className="space-y-1 bg-gray-50 border-2 border-black/10 rounded-xl p-3">
                        <span className="text-gray-400 block font-extrabold text-[9px] uppercase">Lớp học đăng ký</span>
                        <span className="text-gray-900 text-sm font-black">{details.className}</span>
                      </div>
                      <div className="space-y-1 bg-gray-50 border-2 border-black/10 rounded-xl p-3">
                        <span className="text-gray-400 block font-extrabold text-[9px] uppercase">Khóa học</span>
                        <span className="text-amber-800 text-sm font-black">{details.courseTitle || "Lớp chuyên đề vẽ tự do"}</span>
                      </div>
                    </div>

                    <div className="border-t-2 border-dashed border-gray-200 pt-4 font-bold text-xs space-y-2">
                      <div className="flex justify-between text-gray-600">
                        <span>Học phí gốc khóa học:</span>
                        <span className="text-gray-950 font-extrabold">{details.courseFee.toLocaleString("vi-VN")} đ</span>
                      </div>
                      
                      {appliedPromos.length > 0 && (
                        <div className="space-y-1.5 border-t border-black/10 pt-2 pb-1">
                          <span className="text-[10px] text-gray-400 block font-black uppercase">Chi tiết ưu đãi đã áp dụng:</span>
                          {appliedPromos.map((promo) => (
                            <div key={promo.code} className="flex justify-between text-purple-700 font-bold text-xs">
                              <span className="flex items-center gap-1">
                                <Percent className="w-3 h-3" />
                                <strong>{promo.code}</strong>: {promo.description}
                              </span>
                              <span className="font-extrabold">- {promo.discountAmount.toLocaleString("vi-VN")} đ</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="border-t border-black/10 pt-2 flex justify-between font-black text-base text-gray-950">
                        <span>Tổng tiền cần thanh toán:</span>
                        <span className="text-rose-600 text-lg">{finalAmount.toLocaleString("vi-VN")} đ</span>
                      </div>
                    </div>
                  </div>

                  {/* Promo Coupon Application Box */}
                  <div className="border-4 border-black bg-[#fff9ed] rounded-3xl p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] space-y-4">
                    <h3 className="text-xl font-black text-black flex items-center gap-1.5">
                      <Tag className="w-5 h-5 text-purple-600" /> Nhập mã ưu đãi giảm giá
                    </h3>
                    <p className="text-xs text-gray-500 font-semibold">Ba mẹ nhập các mã khuyến mãi, voucher do trung tâm cấp để được chiết khấu học phí.</p>
                    
                    <div className="flex gap-3">
                      <input
                        type="text"
                        disabled={verifying}
                        placeholder="Ví dụ: HE2026, VEZIDOMAM"
                        className="flex-1 border-3 border-black rounded-xl p-3.5 bg-white font-black text-black text-sm uppercase focus:outline-none disabled:opacity-50 disabled:bg-gray-100 placeholder-gray-400"
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value.toUpperCase())}
                      />
                      <button
                        type="button"
                        disabled={verifying || !promoCode.trim()}
                        onClick={handleApplyPromo}
                        className="bg-[#bae1ff] hover:bg-[#a2d4fc] border-3 border-black text-black font-black text-sm px-6 rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all flex items-center gap-1 disabled:opacity-50"
                      >
                        {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
                        Áp dụng
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-xs text-rose-600 font-bold">⚠️ {promoError}</p>
                    )}
                    {promoMessage && (
                      <p className="text-xs text-emerald-600 font-bold">✓ {promoMessage}</p>
                    )}

                    {appliedPromos.length > 0 && (
                      <div className="space-y-2 border-t border-black/10 pt-3">
                        <p className="text-xs font-black text-gray-700">Mã đã áp dụng:</p>
                        <div className="flex flex-wrap gap-2">
                          {appliedPromos.map((promo) => (
                            <div
                              key={promo.code}
                              className="flex items-center gap-1.5 bg-purple-50 border-2 border-black rounded-lg px-2.5 py-1 text-xs font-bold text-purple-900 shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                            >
                              <span>{promo.code}</span>
                              <button
                                type="button"
                                onClick={() => handleRemovePromo(promo.code)}
                                className="text-rose-600 hover:text-rose-800 font-black cursor-pointer ml-1"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Choose Payment Method & Actions */}
                <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
                  
                  {/* Payment Method Cards Stack */}
                  <div className="border-4 border-black bg-white rounded-3xl p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] space-y-5">
                    <h3 className="text-xl font-black text-black border-b-2 border-black pb-2">
                      💳 Phương thức thanh toán
                    </h3>
                    
                    <div className="space-y-3.5">
                      
                      {/* Bank Transfer (TRANSFER) Option */}
                      <div
                        onClick={() => setPaymentMethod("TRANSFER")}
                        className={`border-3 border-black rounded-2xl p-4 cursor-pointer transition-all flex items-start gap-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none ${
                          paymentMethod === "TRANSFER"
                            ? "bg-[#bae1ff] translate-x-0.5 translate-y-0.5 shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                            : "bg-white hover:bg-stone-50"
                        }`}
                      >
                        <div className="w-10 h-10 bg-white border-2 border-black rounded-xl flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]">
                          <span className="text-xl">🏛️</span>
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-gray-900 flex items-center gap-1.5">
                            Chuyển Khoản 
                            <span className="text-[9px] bg-sky-100 text-sky-800 border border-black rounded px-1 font-bold uppercase py-0.5">Tự động</span>
                          </h4>
                          <p className="text-[10px] text-gray-500 font-semibold mt-1 leading-relaxed">
                            Chuyển khoản VietQR MBBank. Hệ thống nhận diện giao dịch tự động.
                          </p>
                        </div>
                      </div>

                      {/* Cash Payment (CASH) Option */}
                      <div
                        onClick={() => setPaymentMethod("CASH")}
                        className={`border-3 border-black rounded-2xl p-4 cursor-pointer transition-all flex items-start gap-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none ${
                          paymentMethod === "CASH"
                            ? "bg-[#baffc9] translate-x-0.5 translate-y-0.5 shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                            : "bg-white hover:bg-stone-50"
                        }`}
                      >
                        <div className="w-10 h-10 bg-white border-2 border-black rounded-xl flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]">
                          <span className="text-xl">💵</span>
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-gray-900">
                            Đóng Tiền Mặt
                          </h4>
                          <p className="text-[10px] text-gray-500 font-semibold mt-1 leading-relaxed">
                            Hoàn thành đăng ký học lập tức. Ba mẹ đóng tiền mặt trực tiếp tại quầy sau.
                          </p>
                        </div>
                      </div>

                      {/* Card Swipe POS (CARD) Option */}
                      <div
                        onClick={() => setPaymentMethod("CARD")}
                        className={`border-3 border-black rounded-2xl p-4 cursor-pointer transition-all flex items-start gap-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none ${
                          paymentMethod === "CARD"
                            ? "bg-[#ffffba] translate-x-0.5 translate-y-0.5 shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                            : "bg-white hover:bg-stone-50"
                        }`}
                      >
                        <div className="w-10 h-10 bg-white border-2 border-black rounded-xl flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]">
                          <span className="text-xl">💳</span>
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-gray-900 flex items-center gap-1.5">
                            Quẹt Thẻ POS
                            <span className="text-[9px] bg-amber-100 text-amber-800 border border-black rounded px-1 font-bold uppercase py-0.5">Tích hợp</span>
                          </h4>
                          <p className="text-[10px] text-gray-500 font-semibold mt-1 leading-relaxed">
                            Quẹt thẻ ATM, Visa, Mastercard qua máy POS tại trung tâm.
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Submit/Next Trigger Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleContinue}
                      disabled={submitting}
                      className="w-full bg-[#ff8b94] hover:bg-[#ff7b85] disabled:bg-stone-100 disabled:opacity-50 text-black border-4 border-black font-black text-base py-4 rounded-2xl shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Đang xác nhận...</span>
                        </>
                      ) : (
                        <>
                          <span>
                            {paymentMethod === "CASH" 
                              ? "Xác Nhận Đăng Ký Học Thử Bằng Tiền Mặt"
                              : paymentMethod === "CARD" 
                                ? "Tiếp Tục Để Quẹt Thẻ POS" 
                                : "Tiếp Tục Thanh Toán Chuyển Khoản"}
                          </span>
                          <ArrowRight className="w-4 h-4 shrink-0" />
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* STEP 2: CHECKOUT (Sepay QR & MBBank details) */}
            {step === "checkout" && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in duration-200">
                
                {/* Left Side: Summary & Back option */}
                <div className="lg:col-span-3 space-y-6">
                  
                  {/* Back button */}
                  <button
                    onClick={() => setStep("setup")}
                    className="flex items-center gap-1.5 font-black text-xs text-gray-500 hover:text-black transition-colors cursor-pointer bg-white border-2 border-black rounded-xl px-4 py-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none"
                  >
                    <ArrowLeft className="w-4 h-4" /> Thay đổi phương thức / mã giảm giá
                  </button>

                  <div className="border-4 border-black bg-white rounded-3xl p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] space-y-4">
                    <h3 className="text-xl font-black text-black border-b-2 border-black pb-2 flex items-center gap-2">
                      👶 Thông tin học phí của bé
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-bold text-xs">
                      <div className="space-y-1 bg-gray-50 border-2 border-black/10 rounded-xl p-3">
                        <span className="text-gray-400 block font-extrabold text-[9px] uppercase">Học sinh</span>
                        <span className="text-gray-900 text-sm font-black">{details.studentName}</span>
                      </div>
                      <div className="space-y-1 bg-gray-50 border-2 border-black/10 rounded-xl p-3">
                        <span className="text-gray-400 block font-extrabold text-[9px] uppercase">Mã học viên</span>
                        <span className="text-purple-800 text-sm font-black">{details.studentCode || "Chưa cấp mã"}</span>
                      </div>
                      <div className="space-y-1 bg-gray-50 border-2 border-black/10 rounded-xl p-3">
                        <span className="text-gray-400 block font-extrabold text-[9px] uppercase">Lớp học đăng ký</span>
                        <span className="text-gray-900 text-sm font-black">{details.className}</span>
                      </div>
                      <div className="space-y-1 bg-gray-50 border-2 border-black/10 rounded-xl p-3">
                        <span className="text-gray-400 block font-extrabold text-[9px] uppercase">Khóa học</span>
                        <span className="text-amber-800 text-sm font-black">{details.courseTitle || "Lớp chuyên đề vẽ tự do"}</span>
                      </div>
                    </div>

                    <div className="border-t-2 border-dashed border-gray-200 pt-4 font-bold text-xs space-y-2">
                      <div className="flex justify-between text-gray-600">
                        <span>Học phí gốc khóa học:</span>
                        <span className="text-gray-950 font-extrabold">{details.courseFee.toLocaleString("vi-VN")} đ</span>
                      </div>

                      {appliedPromos.length > 0 && (
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[10px] text-gray-400 block font-black uppercase">Ưu đãi áp dụng:</span>
                          {appliedPromos.map((p) => (
                            <div key={p.code} className="flex justify-between text-purple-700 text-xs">
                              <span>✨ {p.code}</span>
                              <span>- {p.discountAmount.toLocaleString("vi-VN")} đ</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="border-t border-black/10 pt-2 flex justify-between font-black text-base text-gray-950">
                        <span>Tổng tiền cần thanh toán:</span>
                        <span className="text-rose-600 text-lg">{finalAmount.toLocaleString("vi-VN")} đ</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: QR Scan Image & Transfer validations */}
                <div className="lg:col-span-2 border-4 border-black bg-white rounded-3xl p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-between text-center gap-6">
                  <div className="w-full">
                    <h3 className="text-lg font-black text-black flex items-center justify-center gap-1.5">
                      <Landmark className="w-5 h-5 text-sky-600" /> Quét mã QR chuyển khoản
                    </h3>
                    <p className="text-[10px] text-gray-400 font-semibold mt-1">Mở ứng dụng ngân hàng và chọn quét mã VietQR để thanh toán tự động.</p>
                  </div>

                  {/* QR Image Frame */}
                  <div className="border-4 border-black rounded-2xl p-2 bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] relative group">
                    <img
                      src={sepayQrUrl}
                      alt="Mã QR VietQR đóng học phí Sepay"
                      className="w-56 h-56 md:w-64 md:h-64 object-contain"
                    />
                  </div>

                  {/* Transfer Details Card */}
                  <div className="bg-gray-50 border-2 border-black rounded-xl p-3 w-full text-left text-xs font-semibold space-y-1.5 text-gray-700 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    <p className="flex justify-between">
                      <span>Ngân hàng:</span>
                      <span className="text-gray-900 font-black">MBBank</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Số tài khoản:</span>
                      <span className="text-gray-900 font-black">VQRQAJVMU5026</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Chủ tài khoản:</span>
                      <span className="text-gray-900 font-black">DOAN DUY QUY</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Số tiền:</span>
                      <span className="text-rose-600 font-extrabold">{finalAmount.toLocaleString("vi-VN")} đ</span>
                    </p>
                    <div className="border-t border-dashed border-gray-300 pt-1.5 mt-1 bg-yellow-50/50 p-1.5 rounded">
                      <span className="text-[9px] font-black text-amber-700 block uppercase mb-0.5">Nội dung chuyển khoản chính xác:</span>
                      <span className="text-xs font-black text-gray-900 select-all font-mono tracking-wider">{transferDescription}</span>
                    </div>
                  </div>

                  {/* Submit Confirmation Button */}
                  <div className="w-full pt-2">
                    <button
                      onClick={() => handleConfirmPayment("TRANSFER")}
                      disabled={submitting}
                      className="w-full bg-[#baffc9] hover:bg-[#a3e9b3] border-3 border-black rounded-xl py-3 font-black text-sm text-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang gửi xác nhận...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          Xác nhận tôi đã chuyển khoản
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* STEP 3: CARD_PENDING (Card maintenance notice) */}
            {step === "card_pending" && (
              <div className="max-w-xl mx-auto border-4 border-black bg-white rounded-3xl p-8 text-center space-y-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-[#ffffba] border-4 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)] mx-auto">
                  <AlertCircle className="w-8 h-8 text-amber-800 animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 leading-tight">Đang Tích Hợp Quẹt Thẻ POS</h3>
                
                <p className="text-xs font-semibold text-gray-600 leading-relaxed max-w-sm mx-auto">
                  Hệ thống thanh toán bằng quẹt thẻ ATM, tín dụng POS đang được nâng cấp cổng giao dịch mới. 
                  Ba mẹ vui lòng chọn phương thức <strong>Chuyển khoản MBBank</strong> hoặc <strong>Tiền mặt tại quầy</strong> để thực hiện đóng phí ngay.
                </p>

                <div className="pt-4 border-t border-dashed border-gray-300">
                  <button
                    onClick={() => setStep("setup")}
                    className="bg-[#ffd275] border-3 border-black text-black font-black text-xs px-6 py-3 rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:bg-[#ffc342] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all flex items-center gap-1.5 mx-auto"
                  >
                    <ArrowLeft className="w-4 h-4" /> Quay lại chọn phương thức khác
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </main>
  );
}
