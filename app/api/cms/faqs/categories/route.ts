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
    let categories = await prisma.faqCategory.findMany({
      orderBy: { name: "asc" }
    });

    if (categories.length === 0) {
      const defaults = ["Chung", "Học phí", "Lịch học", "Đăng ký", "Khác"];
      await prisma.faqCategory.createMany({
        data: defaults.map(name => ({ name }))
      });
      categories = await prisma.faqCategory.findMany({
        orderBy: { name: "asc" }
      });
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching FAQ categories:", error);
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

    // Check if duplicate
    const existing = await prisma.faqCategory.findUnique({
      where: { name: trimmedName }
    });

    if (existing) {
      return NextResponse.json({ error: "Danh mục này đã tồn tại" }, { status: 400 });
    }

    const category = await prisma.faqCategory.create({
      data: { name: trimmedName }
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error creating FAQ category:", error);
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
      return NextResponse.json({ error: "FAQ Category ID is required" }, { status: 400 });
    }

    const category = await prisma.faqCategory.findUnique({
      where: { id }
    });

    if (!category) {
      return NextResponse.json({ error: "Danh mục không tìm thấy" }, { status: 404 });
    }

    if (category.name === "Chung") {
      return NextResponse.json({ error: "Không thể xóa danh mục mặc định 'Chung'" }, { status: 400 });
    }

    // Update matching FAQs to "Chung"
    await prisma.faq.updateMany({
      where: { category: category.name },
      data: { category: "Chung" }
    });

    await prisma.faqCategory.delete({
      where: { id }
    });

    return NextResponse.json({ message: "FAQ Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting FAQ category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
