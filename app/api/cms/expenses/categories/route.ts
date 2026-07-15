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
    let categories = await prisma.expenseCategory.findMany({
      orderBy: { name: "asc" }
    });

    if (categories.length === 0) {
      const defaults = ["Vận hành", "Mặt bằng", "Lương", "Marketing", "Họa cụ", "Khác"];
      await prisma.expenseCategory.createMany({
        data: defaults.map(name => ({ name }))
      });
      categories = await prisma.expenseCategory.findMany({
        orderBy: { name: "asc" }
      });
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching expense categories:", error);
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

    const existing = await prisma.expenseCategory.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: "insensitive"
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: "Danh mục này đã tồn tại" }, { status: 400 });
    }

    const category = await prisma.expenseCategory.create({
      data: { name: trimmedName }
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error creating expense category:", error);
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

    const defaultIds = ['ec-van-hanh', 'ec-mat-bang', 'ec-luong', 'ec-marketing', 'ec-hoa-cu', 'ec-khac'];
    if (defaultIds.includes(id)) {
      return NextResponse.json({ error: "Không thể xóa các danh mục hệ thống mặc định" }, { status: 400 });
    }

    const category = await prisma.expenseCategory.findUnique({
      where: { id }
    });

    if (!category) {
      return NextResponse.json({ error: "Không tìm thấy danh mục" }, { status: 404 });
    }

    // Check if the category is being used by any expense
    const count = await prisma.expense.count({
      where: { categoryId: id }
    });

    if (count > 0) {
      return NextResponse.json({ error: "Không thể xóa danh mục này vì đang có khoản chi tiêu sử dụng nó" }, { status: 400 });
    }

    await prisma.expenseCategory.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Xóa danh mục thành công" });
  } catch (error) {
    console.error("Error deleting expense category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
