import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");

  if (!classId) {
    return NextResponse.json({ error: "classId is required" }, { status: 400 });
  }

  try {
    // Check access permissions
    if (role === "TEACHER") {
      const teacherProfile = await prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacherProfile) {
        return NextResponse.json({ error: "Teacher profile not found" }, { status: 403 });
      }

      const classRecord = await prisma.class.findUnique({
        where: { id: classId },
        select: { teacherId: true },
      });

      if (!classRecord || classRecord.teacherId !== teacherProfile.id) {
        return NextResponse.json({ error: "Forbidden - You do not teach this class" }, { status: 403 });
      }
    } else if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const students = await prisma.studentClass.findMany({
      where: { classId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  try {
    const body = await req.json();
    const { studentName, studentAge, parentName, parentPhone, classId } = body;

    if (!studentName || !studentAge || !parentName || !parentPhone || !classId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check permissions
    if (role === "TEACHER") {
      const teacherProfile = await prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacherProfile) {
        return NextResponse.json({ error: "Teacher profile not found" }, { status: 403 });
      }

      const classRecord = await prisma.class.findUnique({
        where: { id: classId },
        select: { teacherId: true },
      });

      if (!classRecord || classRecord.teacherId !== teacherProfile.id) {
        return NextResponse.json({ error: "Forbidden - You do not teach this class" }, { status: 403 });
      }
    } else if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const student = await prisma.studentClass.create({
      data: {
        studentName,
        studentAge: parseInt(studentAge, 10),
        parentName,
        parentPhone,
        classId,
      },
    });

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
  }

  try {
    const student = await prisma.studentClass.findUnique({
      where: { id },
      include: {
        class: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check permissions
    if (role === "TEACHER") {
      const teacherProfile = await prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacherProfile || student.class.teacherId !== teacherProfile.id) {
        return NextResponse.json({ error: "Forbidden - You do not teach this class" }, { status: 403 });
      }
    } else if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.studentClass.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
