import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { saveBase64File } from "@/lib/image-upload";

export async function GET() {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" }
    });
    return NextResponse.json({ expenses });
  } catch (error) {
    console.error("Error fetching expenses:", error);
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
    const { title, amount, category, date, description, invoices } = body;

    if (!title || !title.trim() || amount === undefined || !category) {
      return NextResponse.json({ error: "Vui lòng điền đầy đủ các trường bắt buộc" }, { status: 400 });
    }

    // Save invoices if provided
    const savedInvoices: string[] = [];
    if (invoices && Array.isArray(invoices)) {
      for (let i = 0; i < invoices.length; i++) {
        const fileData = invoices[i];
        if (fileData.startsWith("data:")) {
          try {
            const savedPath = await saveBase64File(fileData, `expense-invoice-${Date.now()}-${i}`);
            savedInvoices.push(savedPath);
          } catch (uploadError) {
            console.error("Error saving expense invoice upload:", uploadError);
          }
        } else {
          savedInvoices.push(fileData);
        }
      }
    }

    const expense = await prisma.expense.create({
      data: {
        title: title.trim(),
        amount: Number(amount),
        category: category.trim(),
        date: date ? new Date(date) : new Date(),
        description: description?.trim() || null,
        invoices: savedInvoices
      }
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
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
      return NextResponse.json({ error: "ID chi tiêu là bắt buộc" }, { status: 400 });
    }

    const body = await req.json();
    const { title, amount, category, date, description, invoices } = body;

    if (!title || !title.trim() || amount === undefined || !category) {
      return NextResponse.json({ error: "Vui lòng điền đầy đủ các trường bắt buộc" }, { status: 400 });
    }

    // Save invoices if provided
    const savedInvoices: string[] = [];
    if (invoices && Array.isArray(invoices)) {
      for (let i = 0; i < invoices.length; i++) {
        const fileData = invoices[i];
        if (fileData.startsWith("data:")) {
          try {
            const savedPath = await saveBase64File(fileData, `expense-invoice-${Date.now()}-${i}`);
            savedInvoices.push(savedPath);
          } catch (uploadError) {
            console.error("Error saving expense invoice upload:", uploadError);
          }
        } else {
          savedInvoices.push(fileData);
        }
      }
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        title: title.trim(),
        amount: Number(amount),
        category: category.trim(),
        date: date ? new Date(date) : new Date(),
        description: description?.trim() || null,
        invoices: savedInvoices
      }
    });

    return NextResponse.json({ expense });
  } catch (error) {
    console.error("Error updating expense:", error);
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
      return NextResponse.json({ error: "ID chi tiêu là bắt buộc" }, { status: 400 });
    }

    await prisma.expense.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Xóa khoản chi tiêu thành công" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
