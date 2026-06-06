import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { saveBase64Image } from "@/lib/image-upload";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const classSession = await prisma.classSession.findUnique({
      where: { id },
      include: {
        class: {
          include: {
            students: {
              orderBy: { studentName: "asc" }
            }
          }
        },
        teacher: {
          include: {
            user: {
              select: { name: true }
            }
          }
        },
        attendance: true,
        artworks: true
      }
    });

    if (!classSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // List of teachers for the parent Class (to allow changing instructor)
    const classWithTeachers = await prisma.class.findUnique({
      where: { id: classSession.classId },
      include: {
        teachers: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    });

    const teachersPool = classWithTeachers?.teachers.map(t => ({
      id: t.id,
      name: t.user.name || "Giáo viên"
    })) || [];

    // Map students with their attendance and artwork for this session
    const studentsData = classSession.class.students.map(student => {
      const att = classSession.attendance.find(a => a.studentClassId === student.id);
      const art = classSession.artworks.find(a => a.studentCode === student.studentCode);

      return {
        id: student.id,
        studentName: student.studentName,
        studentAge: student.studentAge,
        studentCode: student.studentCode,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        attendance: att ? {
          status: att.status,
          notes: att.notes || ""
        } : null,
        artwork: art ? {
          id: art.id,
          title: art.title || "",
          comment: art.comment || "",
          imageUrl: art.imageUrl
        } : null
      };
    });

    return NextResponse.json({
      session: {
        id: classSession.id,
        date: classSession.date,
        startTime: classSession.startTime,
        endTime: classSession.endTime,
        room: classSession.room || "",
        status: classSession.status,
        description: classSession.description || "",
        className: classSession.class.name,
        teacherId: classSession.teacherId || "",
        teacherName: classSession.teacher?.user.name || "Chưa phân công"
      },
      students: studentsData,
      teachersPool
    });
  } catch (error) {
    console.error("Error fetching session details:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const classSession = await prisma.classSession.findUnique({
      where: { id },
      include: {
        class: true
      }
    });

    if (!classSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const body = await req.json();
    const { teacherId, room, attendance, artworks } = body;

    // 1. Update session metadata if provided
    await prisma.classSession.update({
      where: { id },
      data: {
        teacherId: teacherId || null,
        room: room || classSession.room
      }
    });

    // 2. Save Attendance records
    if (attendance && Array.isArray(attendance)) {
      for (const att of attendance) {
        await prisma.attendance.upsert({
          where: {
            sessionId_studentClassId: {
              sessionId: id,
              studentClassId: att.studentClassId
            }
          },
          update: {
            status: att.status,
            notes: att.notes || ""
          },
          create: {
            sessionId: id,
            studentClassId: att.studentClassId,
            status: att.status,
            notes: att.notes || ""
          }
        });
      }
    }

    // 3. Save Artworks uploads
    if (artworks && Array.isArray(artworks)) {
      const defaultTeacherName = session.user.name || "Giáo viên";

      for (const art of artworks) {
        // Only process if there's an image to save or an existing record to update
        let finalImageUrl = art.imageUrl;
        if (art.imageUrl && art.imageUrl.startsWith("data:image/")) {
          try {
            finalImageUrl = await saveBase64Image(art.imageUrl, "artwork");
          } catch (uploadError) {
            console.error("Error saving session artwork base64 image:", uploadError);
            continue;
          }
        }

        const existingArt = await prisma.studentArtwork.findFirst({
          where: {
            sessionId: id,
            studentCode: art.studentCode
          }
        });

        if (existingArt) {
          // If deleted (imageUrl cleared)
          if (art.isDeleted) {
            await prisma.studentArtwork.delete({
              where: { id: existingArt.id }
            });
          } else {
            await prisma.studentArtwork.update({
              where: { id: existingArt.id },
              data: {
                title: art.title || existingArt.title,
                comment: art.comment || existingArt.comment,
                imageUrl: finalImageUrl || existingArt.imageUrl
              }
            });
          }
        } else if (finalImageUrl && !art.isDeleted) {
          await prisma.studentArtwork.create({
            data: {
              sessionId: id,
              studentCode: art.studentCode,
              imageUrl: finalImageUrl,
              title: art.title || `Tranh vẽ ngày ${new Date(classSession.date).toLocaleDateString("vi-VN")}`,
              comment: art.comment || "",
              teacherName: defaultTeacherName,
              className: classSession.class.name
            }
          });
        }
      }
    }

    // 4. Update status to COMPLETED if attendance was taken
    if (attendance && attendance.length > 0) {
      await prisma.classSession.update({
        where: { id },
        data: { status: "COMPLETED" }
      });
    }

    return NextResponse.json({ message: "Session detail saved successfully" });
  } catch (error) {
    console.error("Error saving session details:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
