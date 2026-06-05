import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const classes = await prisma.class.findMany({
      include: {
        teacher: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        specialties: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ classes });
  } catch (error) {
    console.error("Error fetching classes:", error);
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
    const { name, schedule, room, teacherId, specialtyIds, autoSchedule, startDate, weeksCount, dayOfWeek, startTime, endTime } = body;

    const dayOfWeekNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    let finalSchedule = schedule;
    if (!finalSchedule && dayOfWeek !== undefined && startTime && endTime) {
      finalSchedule = `${dayOfWeekNames[Number(dayOfWeek)]} ${startTime} - ${endTime}`;
    }

    if (!name || !finalSchedule) {
      return NextResponse.json(
        { error: "Class name and schedule/time selection are required" },
        { status: 400 }
      );
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        schedule: finalSchedule,
        room: room || null,
        teacherId: teacherId || null,
        specialties: {
          connect: (specialtyIds || []).map((id: string) => ({ id })),
        },
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        specialties: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (autoSchedule && startDate && weeksCount && dayOfWeek !== undefined && startTime && endTime) {
      const start = new Date(startDate);
      const end = new Date(start);
      // Generate sessions covering the number of weeks requested
      end.setDate(start.getDate() + (Number(weeksCount) * 7));

      const sessionsToCreate = [];
      const current = new Date(start);
      
      while (current <= end && sessionsToCreate.length < Number(weeksCount)) {
        if (current.getDay() === Number(dayOfWeek)) {
          sessionsToCreate.push({
            classId: newClass.id,
            teacherId: teacherId || null,
            date: new Date(current),
            startTime,
            endTime,
            room: room || null,
            isMakeup: false,
            status: "SCHEDULED",
          });
        }
        current.setDate(current.getDate() + 1);
      }

      if (sessionsToCreate.length > 0) {
        await prisma.classSession.createMany({
          data: sessionsToCreate,
        });
      }
    }

    return NextResponse.json({ class: newClass }, { status: 201 });
  } catch (error) {
    console.error("Error creating class:", error);
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
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
    }

    await prisma.class.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Class deleted successfully" });
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
