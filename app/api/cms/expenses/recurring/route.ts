import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const templates = await prisma.recurringTemplate.findMany({
      include: {
        category: true
      },
      orderBy: { dayOfMonth: "asc" }
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching recurring templates:", error);
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
    const { title, amount, type, dayOfMonth, categoryId, description, isActive, spentBy } = body;

    if (!title || !title.trim() || amount === undefined || !dayOfMonth || !type) {
      return NextResponse.json({ error: "Vui lòng điền đầy đủ các trường bắt buộc" }, { status: 400 });
    }

    const day = Number(dayOfMonth);
    if (day < 1 || day > 31) {
      return NextResponse.json({ error: "Ngày trong tháng phải từ 1 đến 31" }, { status: 400 });
    }

    const template = await prisma.recurringTemplate.create({
      data: {
        title: title.trim(),
        amount: Number(amount),
        type,
        dayOfMonth: day,
        categoryId: categoryId || null,
        spentBy: spentBy || null,
        description: description?.trim() || null,
        isActive: isActive !== undefined ? !!isActive : true
      },
      include: {
        category: true
      }
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Error creating recurring template:", error);
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
      return NextResponse.json({ error: "ID cấu hình là bắt buộc" }, { status: 400 });
    }

    const body = await req.json();
    const { title, amount, type, dayOfMonth, categoryId, description, isActive, spentBy } = body;

    if (!title || !title.trim() || amount === undefined || !dayOfMonth || !type) {
      return NextResponse.json({ error: "Vui lòng điền đầy đủ các trường bắt buộc" }, { status: 400 });
    }

    const day = Number(dayOfMonth);
    if (day < 1 || day > 31) {
      return NextResponse.json({ error: "Ngày trong tháng phải từ 1 đến 31" }, { status: 400 });
    }

    const template = await prisma.recurringTemplate.update({
      where: { id },
      data: {
        title: title.trim(),
        amount: Number(amount),
        type,
        dayOfMonth: day,
        categoryId: categoryId || null,
        spentBy: spentBy || null,
        description: description?.trim() || null,
        isActive: isActive !== undefined ? !!isActive : true
      },
      include: {
        category: true
      }
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error updating recurring template:", error);
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
      return NextResponse.json({ error: "ID cấu hình là bắt buộc" }, { status: 400 });
    }

    await prisma.recurringTemplate.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Xóa cấu hình thành công" });
  } catch (error) {
    console.error("Error deleting recurring template:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
