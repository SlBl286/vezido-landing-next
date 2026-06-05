import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const teacherId = searchParams.get("teacherId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};
    if (classId) where.classId = classId;
    if (teacherId) where.teacherId = teacherId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const sessions = await prisma.classSession.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            specialties: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Error fetching sessions:", error);
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
    const {
      classId,
      teacherId,
      date,
      startTime,
      endTime,
      room,
      isMakeup,
      description,
      isRecurring,
      dayOfWeek,
      startDate,
      endDate,
    } = body;

    if (!classId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "ClassId, startTime, and endTime are required" },
        { status: 400 }
      );
    }

    // Fetch the target class to obtain default teacher/room if not provided
    const targetClass = await prisma.class.findUnique({
      where: { id: classId },
      select: { teacherId: true, room: true },
    });

    if (!targetClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const defaultTeacherId = targetClass.teacherId;
    const defaultRoom = targetClass.room;

    if (isRecurring) {
      if (dayOfWeek === undefined || !startDate || !endDate) {
        return NextResponse.json(
          { error: "dayOfWeek, startDate, and endDate are required for recurring schedules" },
          { status: 400 }
        );
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const sessionsToCreate = [];

      const current = new Date(start);
      // Ensure we set time components of the search cursor to avoid date boundary issues
      while (current <= end) {
        if (current.getDay() === Number(dayOfWeek)) {
          sessionsToCreate.push({
            classId,
            teacherId: teacherId || defaultTeacherId || null,
            date: new Date(current),
            startTime,
            endTime,
            room: room !== undefined ? room : (defaultRoom || null),
            isMakeup: isMakeup || false,
            description: description || null,
            status: "SCHEDULED",
          });
        }
        current.setDate(current.getDate() + 1);
      }

      if (sessionsToCreate.length === 0) {
        return NextResponse.json(
          { error: "Không tìm thấy ngày nào khớp trong khoảng thời gian đã chọn" },
          { status: 400 }
        );
      }

      await prisma.classSession.createMany({
        data: sessionsToCreate,
      });

      return NextResponse.json(
        { message: `Đã tạo thành công ${sessionsToCreate.length} buổi học` },
        { status: 201 }
      );
    } else {
      if (!date) {
        return NextResponse.json({ error: "Date is required for a single session" }, { status: 400 });
      }

      const newSession = await prisma.classSession.create({
        data: {
          classId,
          teacherId: teacherId || defaultTeacherId || null,
          date: new Date(date),
          startTime,
          endTime,
          room: room !== undefined ? room : (defaultRoom || null),
          isMakeup: isMakeup || false,
          description: description || null,
          status: "SCHEDULED",
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              specialties: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          teacher: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({ session: newSession }, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, date, startTime, endTime, room, teacherId, isMakeup, status, description } = body;

    if (!id) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const updatedSession = await prisma.classSession.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        startTime,
        endTime,
        room,
        teacherId,
        isMakeup,
        status,
        description,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            specialties: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ message: "Cập nhật buổi học thành công", session: updatedSession });
  } catch (error) {
    console.error("Error updating session:", error);
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
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    await prisma.classSession.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Xóa buổi học thành công" });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
