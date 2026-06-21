import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const courses = await prisma.course.findMany({
      include: { classCategory: true },
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Error fetching courses in CMS:", error);
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
    const { title, type, audience, duration, fee, feeUnit, feeNote, objectives, content, benefits, isActive, classCategoryId, level } = body;

    if (!title || !title.trim() || !audience || !duration || fee === undefined) {
      return NextResponse.json({ error: "Vui lòng nhập các trường bắt buộc: Tên, đối tượng, thời lượng và học phí" }, { status: 400 });
    }

    const trimmedTitle = title.trim();

    // Check unique title
    const existing = await prisma.course.findUnique({
      where: { title: trimmedTitle }
    });

    if (existing) {
      return NextResponse.json({ error: "Khóa học này đã tồn tại" }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        title: trimmedTitle,
        type: type || null,
        audience: audience.trim(),
        duration: duration.trim(),
        fee: Number(fee),
        feeUnit: feeUnit?.trim() || "buổi",
        feeNote: feeNote?.trim() || "",
        objectives: Array.isArray(objectives) ? objectives.map((o: string) => o.trim()).filter(Boolean) : [],
        content: Array.isArray(content) ? content.map((c: string) => c.trim()).filter(Boolean) : [],
        benefits: Array.isArray(benefits) ? benefits.map((b: string) => b.trim()).filter(Boolean) : [],
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        classCategoryId: classCategoryId || null,
        level: level?.trim() || null
      },
      include: { classCategory: true }
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
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
      return NextResponse.json({ error: "ID khóa học là bắt buộc" }, { status: 400 });
    }

    const body = await req.json();
    const { title, type, audience, duration, fee, feeUnit, feeNote, objectives, content, benefits, isActive, classCategoryId, level } = body;

    if (!title || !title.trim() || !audience || !duration || fee === undefined) {
      return NextResponse.json({ error: "Vui lòng nhập các trường bắt buộc" }, { status: 400 });
    }

    const trimmedTitle = title.trim();

    // Check unique title excluding this course
    const existing = await prisma.course.findFirst({
      where: {
        title: trimmedTitle,
        NOT: { id }
      }
    });

    if (existing) {
      return NextResponse.json({ error: "Tên khóa học đã bị trùng" }, { status: 400 });
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        title: trimmedTitle,
        type: type || null,
        audience: audience.trim(),
        duration: duration.trim(),
        fee: Number(fee),
        feeUnit: feeUnit?.trim() || "buổi",
        feeNote: feeNote?.trim() || "",
        objectives: Array.isArray(objectives) ? objectives.map((o: string) => o.trim()).filter(Boolean) : [],
        content: Array.isArray(content) ? content.map((c: string) => c.trim()).filter(Boolean) : [],
        benefits: Array.isArray(benefits) ? benefits.map((b: string) => b.trim()).filter(Boolean) : [],
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        classCategoryId: classCategoryId || null,
        level: level?.trim() || null
      },
      include: { classCategory: true }
    });

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Error updating course:", error);
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
      return NextResponse.json({ error: "ID khóa học là bắt buộc" }, { status: 400 });
    }

    await prisma.course.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Khóa học đã được xóa thành công" });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
