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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Check if session exists
    const classSession = await prisma.classSession.findUnique({
      where: { id: sessionId },
      select: { classId: true },
    });

    if (!classSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get all students enrolled in this class
    const students = await prisma.studentClass.findMany({
      where: { classId: classSession.classId },
      orderBy: { studentName: "asc" },
    });

    // Get all existing attendance records for this session
    const existingRecords = await prisma.attendance.findMany({
      where: { sessionId },
    });

    // Map students with their attendance status
    const attendance = students.map((student) => {
      const record = existingRecords.find((r) => r.studentClassId === student.id);
      return {
        studentClassId: student.id,
        studentName: student.studentName,
        studentAge: student.studentAge,
        status: record ? record.status : null,
        notes: record ? record.notes : null,
      };
    });

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { sessionId, records } = body;

    if (!sessionId || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "Session ID and records array are required" },
        { status: 400 }
      );
    }

    // Upsert all attendance records in a transaction
    await prisma.$transaction(
      records.map((rec: any) =>
        prisma.attendance.upsert({
          where: {
            sessionId_studentClassId: {
              sessionId,
              studentClassId: rec.studentClassId,
            },
          },
          update: {
            status: rec.status,
            notes: rec.notes || null,
          },
          create: {
            sessionId,
            studentClassId: rec.studentClassId,
            status: rec.status,
            notes: rec.notes || null,
          },
        })
      )
    );

    return NextResponse.json({ message: "Lưu điểm danh thành công" });
  } catch (error) {
    console.error("Error saving attendance:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
