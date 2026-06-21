import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "TEACHER" && role !== "ASSISTANT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let categories = await prisma.classCategory.findMany({
      orderBy: { name: "asc" }
    });

    if (categories.length === 0) {
      const defaults = ["LỚP MẦM", "LỚP CHỒI", "LỚP LÁ", "DIGITAL ART"];
      await prisma.classCategory.createMany({
        data: defaults.map(name => ({ name }))
      });
      categories = await prisma.classCategory.findMany({
        orderBy: { name: "asc" }
      });
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching class categories:", error);
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
      return NextResponse.json({ error: "Tên phân loại không được để trống" }, { status: 400 });
    }

    const trimmedName = name.trim().toUpperCase();

    const existing = await prisma.classCategory.findUnique({
      where: { name: trimmedName }
    });

    if (existing) {
      return NextResponse.json({ error: "Phân loại này đã tồn tại" }, { status: 400 });
    }

    const category = await prisma.classCategory.create({
      data: { name: trimmedName }
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error creating class category:", error);
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

    const category = await prisma.classCategory.findUnique({
      where: { id }
    });

    if (!category) {
      return NextResponse.json({ error: "Không tìm thấy phân loại" }, { status: 404 });
    }

    await prisma.classCategory.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Xóa phân loại thành công" });
  } catch (error) {
    console.error("Error deleting class category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
