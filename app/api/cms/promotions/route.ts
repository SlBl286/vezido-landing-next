import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const promotions = await prisma.promotion.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ promotions });
  } catch (error) {
    console.error("Error fetching promotions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      startDate,
      endDate,
      isActive,
      maxUses,
    } = body;

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json(
        { error: "Mã giảm giá, loại giảm giá và giá trị không được để trống" },
        { status: 400 }
      );
    }

    const uppercaseCode = code.trim().toUpperCase();

    // Check unique code
    const existing = await prisma.promotion.findUnique({
      where: { code: uppercaseCode },
    });

    if (existing) {
      return NextResponse.json({ error: "Mã giảm giá này đã tồn tại" }, { status: 400 });
    }

    const promotion = await prisma.promotion.create({
      data: {
        code: uppercaseCode,
        description: description || null,
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: minOrderValue ? Number(minOrderValue) : null,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        maxUses: maxUses !== undefined && maxUses !== null && maxUses !== "" ? parseInt(maxUses, 10) : null,
      },
    });

    return NextResponse.json({ promotion }, { status: 201 });
  } catch (error) {
    console.error("Error creating promotion:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Promotion ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      startDate,
      endDate,
      isActive,
      maxUses,
    } = body;

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json(
        { error: "Mã giảm giá, loại giảm giá và giá trị không được để trống" },
        { status: 400 }
      );
    }

    const uppercaseCode = code.trim().toUpperCase();

    // Check unique code excluding this promotion
    const existing = await prisma.promotion.findFirst({
      where: {
        code: uppercaseCode,
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Mã giảm giá đã bị trùng" }, { status: 400 });
    }

    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        code: uppercaseCode,
        description: description || null,
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: minOrderValue ? Number(minOrderValue) : null,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        maxUses: maxUses !== undefined && maxUses !== null && maxUses !== "" ? parseInt(maxUses, 10) : null,
      },
    });

    return NextResponse.json({ promotion });
  } catch (error) {
    console.error("Error updating promotion:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Promotion ID is required" }, { status: 400 });
    }

    await prisma.promotion.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Promotion deleted successfully" });
  } catch (error) {
    console.error("Error deleting promotion:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
