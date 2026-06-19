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
  const allUnique = searchParams.get("allUnique") === "true";

  if (!classId && !allUnique) {
    return NextResponse.json({ error: "classId or allUnique is required" }, { status: 400 });
  }

  try {
    if (allUnique) {
      let studentClasses = [];
      if (role === "ADMIN") {
        studentClasses = await prisma.studentClass.findMany({
          orderBy: { createdAt: "desc" },
        });
      } else if (role === "TEACHER" || role === "ASSISTANT") {
        const teacherProfile = await prisma.teacher.findUnique({
          where: { userId },
        });
        if (!teacherProfile) {
          return NextResponse.json({ error: "Teacher profile not found" }, { status: 403 });
        }
        const teacherClasses = await prisma.class.findMany({
          where: {
            teachers: {
              some: { id: teacherProfile.id }
            }
          },
          select: { id: true }
        });
        const classIds = teacherClasses.map(c => c.id);
        studentClasses = await prisma.studentClass.findMany({
          where: {
            classId: { in: classIds }
          },
          orderBy: { createdAt: "desc" },
        });
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Filter uniquely by studentCode in memory
      const uniqueStudentsMap = new Map();
      for (const s of studentClasses) {
        const key = s.studentCode?.trim() || `NO-CODE-${s.id}`;
        if (!uniqueStudentsMap.has(key)) {
          uniqueStudentsMap.set(key, s);
        }
      }
      const uniqueStudents = Array.from(uniqueStudentsMap.values());
      return NextResponse.json({ students: uniqueStudents });
    }

    // Original flow: check access permissions and return students of a specific class
    if (role === "TEACHER" || role === "ASSISTANT") {
      const teacherProfile = await prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacherProfile) {
        return NextResponse.json({ error: "Teacher profile not found" }, { status: 403 });
      }

      const classRecord = await prisma.class.findUnique({
        where: { id: classId! },
        select: {
          teachers: {
            select: { id: true }
          }
        },
      });

      const isTeacherAssigned = classRecord?.teachers.some(t => t.id === teacherProfile.id);
      if (!classRecord || !isTeacherAssigned) {
        return NextResponse.json({ error: "Forbidden - You do not teach this class" }, { status: 403 });
      }
    } else if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const students = await prisma.studentClass.findMany({
      where: { classId: classId! },
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
    const { studentName, studentAge, parentName, parentPhone, classId, studentCode } = body;

    if (!studentName || !studentAge || !parentName || !parentPhone || !classId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check permissions
    if (role === "TEACHER" || role === "ASSISTANT") {
      const teacherProfile = await prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacherProfile) {
        return NextResponse.json({ error: "Teacher profile not found" }, { status: 403 });
      }

      const classRecord = await prisma.class.findUnique({
        where: { id: classId },
        select: {
          teachers: {
            select: { id: true }
          }
        },
      });

      const isTeacherAssigned = classRecord?.teachers.some(t => t.id === teacherProfile.id);
      if (!classRecord || !isTeacherAssigned) {
        return NextResponse.json({ error: "Forbidden - You do not teach this class" }, { status: 403 });
      }
    } else if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let finalStudentCode = studentCode?.trim();

    if (!finalStudentCode) {
      // 1. Search if this student already has an enrollment in another class (same name and parent phone)
      const existingStudent = await prisma.studentClass.findFirst({
        where: {
          studentName,
          parentPhone,
          studentCode: { not: "" },
          NOT: { studentCode: null }
        },
        select: {
          studentCode: true
        }
      });

      if (existingStudent && existingStudent.studentCode) {
        finalStudentCode = existingStudent.studentCode;
      } else {
        // 2. Generate a new unique code HS-XXXX (4 random digits)
        let isUnique = false;
        let generatedCode = "";
        const digits = "0123456789";

        while (!isUnique) {
          const randDigits = Array.from({ length: 4 }, () => digits[Math.floor(Math.random() * 10)]).join("");
          generatedCode = `HS-${randDigits}`;
          
          const conflict = await prisma.studentClass.findFirst({
            where: { studentCode: generatedCode }
          });
          if (!conflict) {
            isUnique = true;
          }
        }
        finalStudentCode = generatedCode;
      }
    }

    const student = await prisma.studentClass.create({
      data: {
        studentName,
        studentAge: parseInt(studentAge, 10),
        parentName,
        parentPhone,
        classId,
        studentCode: finalStudentCode,
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
            teachers: {
              select: { id: true }
            }
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check permissions
    if (role === "TEACHER" || role === "ASSISTANT") {
      const teacherProfile = await prisma.teacher.findUnique({
        where: { userId },
      });

      const isTeacherAssigned = student.class.teachers.some(t => t.id === teacherProfile?.id);
      if (!teacherProfile || !isTeacherAssigned) {
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
