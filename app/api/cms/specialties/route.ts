import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const specialties = await prisma.specialty.findMany({
      include: {
        _count: {
          select: {
            teachers: true,
            classes: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ specialties });
  } catch (error) {
    console.error("Error fetching specialties:", error);
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
      return NextResponse.json({ error: "Specialty name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check if duplicate exists
    const existing = await prisma.specialty.findUnique({
      where: { name: trimmedName },
    });

    if (existing) {
      return NextResponse.json({ error: "Specialty already exists" }, { status: 400 });
    }

    const specialty = await prisma.specialty.create({
      data: { name: trimmedName },
    });

    return NextResponse.json({ specialty }, { status: 201 });
  } catch (error) {
    console.error("Error creating specialty:", error);
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
      return NextResponse.json({ error: "Specialty ID is required" }, { status: 400 });
    }

    // Delete specialty (many-to-many references will be cleaned up in join tables automatically)
    await prisma.specialty.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Specialty deleted successfully" });
  } catch (error) {
    console.error("Error deleting specialty:", error);
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
      return NextResponse.json({ error: "ID chuyên môn là bắt buộc" }, { status: 400 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Tên chuyên môn là bắt buộc" }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check if duplicate exists with different ID
    const existing = await prisma.specialty.findFirst({
      where: {
        name: trimmedName,
        id: { not: id }
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Chuyên môn này đã tồn tại" }, { status: 400 });
    }

    const specialty = await prisma.specialty.update({
      where: { id },
      data: { name: trimmedName },
    });

    return NextResponse.json({ specialty });
  } catch (error) {
    console.error("Error updating specialty:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
