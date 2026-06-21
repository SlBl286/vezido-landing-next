import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim().toUpperCase();
    const amountStr = searchParams.get("amount");

    if (!code) {
      return NextResponse.json({ error: "Vui lòng nhập mã giảm giá" }, { status: 400 });
    }

    const amount = amountStr ? parseFloat(amountStr) : 0;

    const promotion = await prisma.promotion.findUnique({
      where: { code },
    });

    if (!promotion) {
      return NextResponse.json({ valid: false, message: "Mã giảm giá không tồn tại" });
    }

    if (!promotion.isActive) {
      return NextResponse.json({ valid: false, message: "Mã giảm giá đã bị vô hiệu hóa" });
    }

    if (promotion.maxUses !== null && promotion.usedCount >= promotion.maxUses) {
      return NextResponse.json({ valid: false, message: "Mã giảm giá đã đạt giới hạn số lần sử dụng" });
    }

    const now = new Date();
    if (promotion.startDate && now < new Date(promotion.startDate)) {
      return NextResponse.json({ valid: false, message: "Mã giảm giá chưa bắt đầu hiệu lực" });
    }

    if (promotion.endDate && now > new Date(promotion.endDate)) {
      return NextResponse.json({ valid: false, message: "Mã giảm giá đã hết hạn sử dụng" });
    }

    if (promotion.minOrderValue && amount < promotion.minOrderValue) {
      return NextResponse.json({
        valid: false,
        message: `Mã chỉ áp dụng cho đơn hàng tối thiểu từ ${promotion.minOrderValue.toLocaleString("vi-VN")} đ`,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promotion.discountType === "PERCENTAGE") {
      discountAmount = amount * (promotion.discountValue / 100);
      if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) {
        discountAmount = promotion.maxDiscount;
      }
    } else if (promotion.discountType === "FIXED_AMOUNT") {
      discountAmount = promotion.discountValue;
    }

    if (discountAmount > amount) {
      discountAmount = amount;
    }

    return NextResponse.json({
      valid: true,
      discountAmount,
      code: promotion.code,
      description: promotion.description || `Giảm ${promotion.discountType === "PERCENTAGE" ? `${promotion.discountValue}%` : `${promotion.discountValue.toLocaleString("vi-VN")} đ`}`,
      message: "Áp dụng mã giảm giá thành công",
    });
  } catch (error) {
    console.error("Error verifying promotion publicly:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
