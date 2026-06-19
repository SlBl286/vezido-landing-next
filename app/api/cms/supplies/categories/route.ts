import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let categories = await prisma.supplyCategory.findMany({
      orderBy: { name: "asc" }
    });

    // If categories table is completely empty, seed default categories
    if (categories.length === 0) {
      const defaults = ["Họa cụ", "Văn phòng phẩm", "Dọn dẹp & Vệ sinh", "Thiết bị & CSVC", "Khác"];
      for (const name of defaults) {
        await prisma.supplyCategory.upsert({
          where: { name },
          update: {},
          create: { name }
        });
      }
      categories = await prisma.supplyCategory.findMany({
        orderBy: { name: "asc" }
      });
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
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
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Tên danh mục không được để trống" }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check uniqueness
    const existing = await prisma.supplyCategory.findUnique({
      where: { name: trimmedName }
    });

    if (existing) {
      return NextResponse.json({ error: "Danh mục này đã tồn tại" }, { status: 400 });
    }

    const category = await prisma.supplyCategory.create({
      data: { name: trimmedName }
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
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
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Tên danh mục không được để trống" }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check unique name excluding this item
    const existing = await prisma.supplyCategory.findFirst({
      where: {
        name: trimmedName,
        NOT: { id }
      }
    });

    if (existing) {
      return NextResponse.json({ error: "Tên danh mục này đã trùng với danh mục khác" }, { status: 400 });
    }

    const category = await prisma.supplyCategory.update({
      where: { id },
      data: { name: trimmedName }
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error updating category:", error);
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
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    // SetNull relation is handled automatically by Prisma
    await prisma.supplyCategory.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
