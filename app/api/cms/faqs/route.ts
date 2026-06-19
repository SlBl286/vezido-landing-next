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
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const faqs = await prisma.faq.findMany({
      where: search ? {
        OR: [
          { question: { contains: search, mode: "insensitive" } },
          { answer: { contains: search, mode: "insensitive" } },
          { category: { contains: search, mode: "insensitive" } }
        ]
      } : {},
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({ faqs });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
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
    const { question, answer, category } = body;

    if (!question || !answer) {
      return NextResponse.json({ error: "Câu hỏi và câu trả lời không được để trống" }, { status: 400 });
    }

    const faq = await prisma.faq.create({
      data: {
        question,
        answer,
        category: category || "Chung"
      }
    });

    return NextResponse.json({ faq }, { status: 201 });
  } catch (error) {
    console.error("Error creating FAQ:", error);
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
      return NextResponse.json({ error: "FAQ ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const { question, answer, category } = body;

    if (!question || !answer) {
      return NextResponse.json({ error: "Câu hỏi và câu trả lời không được để trống" }, { status: 400 });
    }

    const faq = await prisma.faq.update({
      where: { id },
      data: {
        question,
        answer,
        category: category || "Chung"
      }
    });

    return NextResponse.json({ faq });
  } catch (error) {
    console.error("Error updating FAQ:", error);
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
      return NextResponse.json({ error: "FAQ ID is required" }, { status: 400 });
    }

    await prisma.faq.delete({
      where: { id }
    });

    return NextResponse.json({ message: "FAQ deleted successfully" });
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
