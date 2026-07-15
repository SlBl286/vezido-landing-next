import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { saveBase64File } from "@/lib/image-upload";

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
          include: {
            class: {
              include: {
                course: true
              }
            }
          },
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
          include: {
            class: {
              include: {
                course: true
              }
            }
          },
          orderBy: { createdAt: "desc" },
        });
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Filter uniquely by studentCode in memory and group enrollments
      const uniqueStudentsMap = new Map();
      for (const s of studentClasses) {
        const key = s.studentCode?.trim() || `NO-CODE-${s.id}`;
        if (!uniqueStudentsMap.has(key)) {
          uniqueStudentsMap.set(key, {
            id: s.id,
            studentCode: s.studentCode,
            studentName: s.studentName,
            studentAge: s.studentAge,
            parentName: s.parentName,
            parentPhone: s.parentPhone,
            createdAt: s.createdAt,
            classId: s.classId,
            class: s.class,
            customDuration: s.customDuration,
            enrollments: [
              {
                id: s.id,
                classId: s.classId,
                class: s.class,
                isPaid: s.isPaid,
                amountPaid: s.amountPaid,
                discountCode: s.discountCode,
                paymentDate: s.paymentDate,
                customDuration: s.customDuration,
              }
            ]
          });
        } else {
          const existing = uniqueStudentsMap.get(key);
          existing.enrollments.push({
            id: s.id,
            classId: s.classId,
            class: s.class,
            isPaid: s.isPaid,
            amountPaid: s.amountPaid,
            discountCode: s.discountCode,
            paymentDate: s.paymentDate,
            customDuration: s.customDuration,
          });
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
      include: {
        class: {
          include: {
            course: true,
          },
        },
      },
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
    const { studentName, studentAge, parentName, parentPhone, classId, studentCode, customDuration } = body;

    if (!studentName) {
      return NextResponse.json({ error: "Missing required fields: studentName is required." }, { status: 400 });
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
        studentAge: studentAge ? parseInt(studentAge, 10) : null,
        parentName: parentName || null,
        parentPhone: parentPhone || null,
        classId: classId || null,
        studentCode: finalStudentCode,
        customDuration: customDuration !== undefined && customDuration !== null && customDuration !== "" ? parseInt(customDuration, 10) : null,
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

      const isTeacherAssigned = student.class?.teachers.some(t => t.id === teacherProfile?.id) || false;
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

export async function PUT(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    const currentStudent = await prisma.studentClass.findUnique({
      where: { id },
      include: {
        class: {
          select: {
            teachers: {
              select: { id: true }
            }
          }
        }
      }
    });

    if (!currentStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check permissions
    if (role === "TEACHER" || role === "ASSISTANT") {
      const teacherProfile = await prisma.teacher.findUnique({
        where: { userId },
      });
      const isTeacherAssigned = currentStudent.class?.teachers.some(t => t.id === teacherProfile?.id) || false;
      if (!teacherProfile || !isTeacherAssigned) {
        return NextResponse.json({ error: "Forbidden - You do not teach this class" }, { status: 403 });
      }
    } else if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { 
      isPaid, amountPaid, discountCode, paymentDate, paymentMethod, paymentProof,
      studentName, studentAge, parentName, parentPhone, studentCode, classId, customDuration 
    } = body;

    // Teachers/Assistants cannot update payment info - only ADMIN can
    if (role !== "ADMIN" && (isPaid !== undefined || amountPaid !== undefined || discountCode !== undefined || paymentDate !== undefined || paymentMethod !== undefined || paymentProof !== undefined)) {
      return NextResponse.json({ error: "Forbidden - Only admin can update payment details" }, { status: 403 });
    }

    const oldCode = currentStudent.studentCode;

    // Build update payload
    const dataToUpdate: any = {};
    if (isPaid !== undefined) dataToUpdate.isPaid = Boolean(isPaid);
    if (amountPaid !== undefined) dataToUpdate.amountPaid = amountPaid !== null ? Number(amountPaid) : null;
    if (discountCode !== undefined) dataToUpdate.discountCode = discountCode || null;
    if (paymentDate !== undefined) dataToUpdate.paymentDate = paymentDate ? new Date(paymentDate) : null;
    if (paymentMethod !== undefined) dataToUpdate.paymentMethod = paymentMethod || null;
    if (paymentProof !== undefined) {
      if (paymentProof && paymentProof.startsWith("data:")) {
        try {
          const savedPath = await saveBase64File(paymentProof, `payment-proof-${id}-${Date.now()}`);
          dataToUpdate.paymentProof = savedPath;
        } catch (uploadError) {
          console.error("Error saving payment proof image:", uploadError);
        }
      } else {
        dataToUpdate.paymentProof = paymentProof || null;
      }
    }
    
    if (studentName !== undefined) dataToUpdate.studentName = studentName;
    if (studentAge !== undefined) dataToUpdate.studentAge = studentAge !== null ? Number(studentAge) : undefined;
    if (parentName !== undefined) dataToUpdate.parentName = parentName;
    if (parentPhone !== undefined) dataToUpdate.parentPhone = parentPhone;
    if (studentCode !== undefined) dataToUpdate.studentCode = studentCode || null;
    if (classId !== undefined) dataToUpdate.classId = classId || null;
    if (customDuration !== undefined) {
      dataToUpdate.customDuration = customDuration !== null && customDuration !== "" ? Number(customDuration) : null;
    }

    const student = await prisma.studentClass.update({
      where: { id },
      data: dataToUpdate,
    });

    // Sync profile info for all classes of the same student if they have a studentCode
    const codeToSync = studentCode !== undefined ? (studentCode || null) : oldCode;
    if (codeToSync) {
      const syncData: any = {};
      if (studentName !== undefined) syncData.studentName = studentName;
      if (studentAge !== undefined) syncData.studentAge = studentAge !== null ? Number(studentAge) : undefined;
      if (parentName !== undefined) syncData.parentName = parentName;
      if (parentPhone !== undefined) syncData.parentPhone = parentPhone;
      if (studentCode !== undefined) syncData.studentCode = studentCode || null;

      if (Object.keys(syncData).length > 0) {
        // Update other classes with the same code
        await prisma.studentClass.updateMany({
          where: {
            OR: [
              { studentCode: codeToSync },
              oldCode ? { studentCode: oldCode } : {}
            ]
          },
          data: syncData,
        });

        // Also update the studentCode in StudentArtwork if it changed
        if (studentCode !== undefined && oldCode && oldCode !== studentCode) {
          await prisma.studentArtwork.updateMany({
            where: { studentCode: oldCode },
            data: { studentCode: studentCode || "" },
          });
        }
      }
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
