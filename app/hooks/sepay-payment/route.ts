import { prisma } from "@/lib/prisma";
import { sendPaymentNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";

function removeVietnameseAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .toUpperCase();
}

function getDiscount(amount: number, promo: { discountType: string; discountValue: number; maxDiscount: number | null }): number {
  let discount = 0;
  if (promo.discountType === "PERCENTAGE") {
    discount = (amount * promo.discountValue) / 100;
    if (promo.maxDiscount) {
      discount = Math.min(discount, promo.maxDiscount);
    }
  } else if (promo.discountType === "FIXED_AMOUNT") {
    discount = promo.discountValue;
  }
  return discount;
}

export async function POST(req: Request) {
  try {
    // 1. Verify API Key
    const authHeader = req.headers.get("Authorization");
    const expectedApiKey = process.env.PAY_API_KEY;

    if (!expectedApiKey) {
      console.error("[SePay Webhook] PAY_API_KEY is not defined in environment variables");
      return NextResponse.json({ error: "PAY_API_KEY is not configured" }, { status: 500 });
    }

    const cleanHeader = authHeader?.replace(/^(Apikey|Bearer)\s+/i, "").trim();
    if (cleanHeader !== expectedApiKey) {
      console.warn("[SePay Webhook] Unauthorized request received. Header:", authHeader);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse payload
    const body = await req.json();
    const {
      id,
      gateway,
      transactionDate,
      content,
      transferType,
      transferAmount,
    } = body;

    console.log(`[SePay Webhook] Processing transaction: ID=${id}, Gateway=${gateway}, Amount=${transferAmount}, Content="${content}"`);

    // 3. Skip outgoing transfers
    if (transferType !== "in") {
      return NextResponse.json({ success: true, message: "Skipped outgoing transaction" });
    }

    // 4. Idempotency Check
    const transactionIdStr = id.toString();
    const existingPayment = await prisma.studentClass.findUnique({
      where: { sepayTransactionId: transactionIdStr },
    });

    if (existingPayment) {
      console.log(`[SePay Webhook] Transaction ID=${id} already processed. Skipping.`);
      return NextResponse.json({ success: true, message: "Transaction already processed" });
    }

    // 5. Match candidate student class
    const normalizedContent = removeVietnameseAccents(content || "").replace(/\s+/g, "");

    // Load active promotions to calculate expected discounted fees
    const promotions = await prisma.promotion.findMany({
      where: { isActive: true },
    });

    // Find all student enrollments without an associated transaction ID
    const candidates = await prisma.studentClass.findMany({
      where: { sepayTransactionId: null },
      include: {
        class: {
          include: {
            course: true,
          },
        },
      },
    });

    interface ScoredCandidate {
      sc: typeof candidates[0];
      score: number;
      matchedPromoCode: string | null;
    }

    const scoredCandidates: ScoredCandidate[] = candidates.map((sc) => {
      let score = 0;
      let matchedPromoCode: string | null = null;

      // Primary check: cleanStudentCode in content (e.g. "HS1234")
      const cleanStudentCode = sc.studentCode
        ? removeVietnameseAccents(sc.studentCode).replace(/\s+/g, "")
        : "";
      
      // Fallback check: temporary CUID prefix (e.g. "HSCJLD" if CUID starts with "cjld")
      const fallbackCode = `HS${sc.id.substring(0, 4).toUpperCase()}`;

      if (cleanStudentCode && normalizedContent.includes(cleanStudentCode)) {
        score += 100;
      } else if (normalizedContent.includes(fallbackCode)) {
        score += 100;
      }

      // Secondary check: class name in content (e.g. "LOPMAM01")
      if (sc.class) {
        const cleanClassName = removeVietnameseAccents(sc.class.name).replace(/\s+/g, "");
        if (cleanClassName && normalizedContent.includes(cleanClassName)) {
          score += 20;
        }
      }

      // Tertiary check: parent phone last 9 digits
      if (sc.parentPhone) {
        const cleanPhone = sc.parentPhone.replace(/[^0-9]/g, "");
        if (cleanPhone.length >= 9 && normalizedContent.includes(cleanPhone.slice(-9))) {
          score += 10;
        }
      }

      // Quaternary check: transfer amount matches expected fee
      const sessions = sc.class ? (parseInt(sc.class.course?.duration || "0", 10) || 0) : 0;
      const feePerSession = sc.class ? (sc.class.course?.fee || 0) : 0;
      const fee = sessions * feePerSession;
      let amountMatches = false;

      if (transferAmount === fee) {
        amountMatches = true;
      } else {
        // Test against active promotions (single coupon)
        for (const promo of promotions) {
          const discount = getDiscount(fee, promo);
          const expected = Math.max(0, fee - discount);
          if (transferAmount === expected) {
            amountMatches = true;
            matchedPromoCode = promo.code;
            break;
          }
        }

        // Test against active promotions (double stacked coupon)
        if (!amountMatches) {
          for (let i = 0; i < promotions.length; i++) {
            for (let j = 0; j < promotions.length; j++) {
              if (i === j) continue;
              const d1 = getDiscount(fee, promotions[i]);
              const d2 = getDiscount(Math.max(0, fee - d1), promotions[j]);
              const expected = Math.max(0, fee - d1 - d2);
              if (transferAmount === expected) {
                amountMatches = true;
                matchedPromoCode = `${promotions[i].code}, ${promotions[j].code}`;
                break;
              }
            }
            if (amountMatches) break;
          }
        }
      }

      if (amountMatches) {
        score += 10;
      }

      return { sc, score, matchedPromoCode };
    });

    // We only consider a candidate a match if it scoring at least 100 (which guarantees a student code match)
    const validMatches = scoredCandidates
      .filter((c) => c.score >= 100)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // Tie-breaker: oldest enrollment first
        return new Date(a.sc.createdAt).getTime() - new Date(b.sc.createdAt).getTime();
      });

    if (validMatches.length > 0) {
      const bestMatch = validMatches[0];
      const matched = bestMatch.sc;

      console.log(`[SePay Webhook] Matched transaction to student class registration: ID=${matched.id}, Student=${matched.studentName}, Class=${matched.class?.name || "Chưa xếp lớp"}`);

      // 6. Update database record
      const finalPromoCode = bestMatch.matchedPromoCode || matched.discountCode || null;
      await prisma.studentClass.update({
        where: { id: matched.id },
        data: {
          isPaid: true,
          amountPaid: transferAmount,
          discountCode: finalPromoCode,
          paymentDate: transactionDate ? new Date(transactionDate) : new Date(),
          sepayTransactionId: transactionIdStr,
        },
      });

      // Increment usedCount for the matched coupon code(s)
      if (finalPromoCode) {
        const codes = finalPromoCode.split(",").map(c => c.trim().toUpperCase());
        await prisma.promotion.updateMany({
          where: { code: { in: codes } },
          data: { usedCount: { increment: 1 } },
        });
      }

      // 7. Fire notification async
      sendPaymentNotification({
        studentName: matched.studentName,
        studentCode: matched.studentCode || undefined,
        className: matched.class?.name || "Chưa xếp lớp",
        amount: transferAmount,
        gateway,
        content,
        transactionId: transactionIdStr,
        status: "SUCCESS",
      }).catch((err) => console.error("[SePay Webhook] Notification trigger error:", err));

      return NextResponse.json({ success: true, message: "Payment processed successfully" });
    } else {
      console.warn(`[SePay Webhook] No student matched for transaction ID=${id}, Content="${content}"`);

      // Send unmatched notification
      sendPaymentNotification({
        amount: transferAmount,
        gateway,
        content,
        transactionId: transactionIdStr,
        status: "UNMATCHED",
        errorDetails: "Nội dung chuyển khoản không khớp với bất kỳ học viên/lớp học nào chưa thanh toán.",
      }).catch((err) => console.error("[SePay Webhook] Notification trigger error:", err));

      // We still return success: true to SePay to acknowledge receipt and avoid retries
      return NextResponse.json({ success: true, message: "Transaction received but no match found" });
    }
  } catch (error) {
    console.error("[SePay Webhook] Unexpected internal error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
