import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkSessionsConflictBatch } from "@/lib/conflict-checker";

export async function GET() {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const classes = await prisma.class.findMany({
      include: {
        teachers: {
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
    const {
      name,
      schedule,
      room,
      teacherId,
      teacherIds,
      specialtyIds,
      autoSchedule,
      startDate,
      weeksCount,
      dayOfWeek,
      startTime,
      endTime,
      schedules,
    } = body;

    const dayOfWeekNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    
    let schedulesToProcess = schedules;
    if (!schedulesToProcess && dayOfWeek !== undefined && startTime && endTime) {
      schedulesToProcess = [{ dayOfWeek: Number(dayOfWeek), startTime, endTime }];
    }

    let finalSchedule = schedule;
    if (!finalSchedule && schedulesToProcess && schedulesToProcess.length > 0) {
      finalSchedule = schedulesToProcess
        .map((s: any) => `${dayOfWeekNames[Number(s.dayOfWeek)]} ${s.startTime} - ${s.endTime}`)
        .join(", ");
    }

    if (!name || !finalSchedule) {
      return NextResponse.json(
        { error: "Tên lớp học và lịch học không được để trống" },
        { status: 400 }
      );
    }

    // 1. Prepare sessions in memory first to check conflicts
    const sessionsToCreate: any[] = [];
    if (autoSchedule && schedulesToProcess && schedulesToProcess.length > 0) {
      for (const sched of schedulesToProcess) {
        const {
          dayOfWeek: sDay,
          startTime: sStart,
          endTime: sEnd,
          startDate: sStartDate,
          weeksCount: sWeeksCount,
          frequency: sFrequency
        } = sched;

        const finalStartDate = sStartDate || startDate;
        const finalWeeksCount = sWeeksCount !== undefined ? sWeeksCount : weeksCount;
        const finalFrequency = sFrequency || "weekly";

        if (sDay === undefined || !sStart || !sEnd || !finalStartDate || !finalWeeksCount) continue;

        const start = new Date(finalStartDate);
        const current = new Date(start);
        let count = 0;
        const stepWeeks = finalFrequency === "biweekly" ? 2 : 1;

        const defaultTeacherId = teacherId || (teacherIds && teacherIds.length > 0 ? teacherIds[0] : null);

        while (count < Number(finalWeeksCount)) {
          if (current.getDay() === Number(sDay)) {
            sessionsToCreate.push({
              date: new Date(current),
              startTime: sStart,
              endTime: sEnd,
              teacherId: defaultTeacherId,
              room: room || null,
            });
            count++;
            current.setDate(current.getDate() + (stepWeeks * 7));
          } else {
            current.setDate(current.getDate() + 1);
          }
        }
      }

      // Check conflicts for all proposed sessions
      const conflictResult = await checkSessionsConflictBatch(sessionsToCreate);
      if (conflictResult.conflict) {
        return NextResponse.json({ error: conflictResult.message }, { status: 400 });
      }
    }

    // 2. No conflict or no auto-schedule, proceed with Class creation
    const newClass = await prisma.class.create({
      data: {
        name,
        schedule: finalSchedule,
        room: room || null,
        teachers: {
          connect: (teacherIds || []).map((id: string) => ({ id })),
        },
        specialties: {
          connect: (specialtyIds || []).map((id: string) => ({ id })),
        },
      },
      include: {
        teachers: {
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

    // 3. Create sessions referencing the new class
    if (sessionsToCreate.length > 0) {
      const finalSessions = sessionsToCreate.map((s) => ({
        ...s,
        classId: newClass.id,
        status: "SCHEDULED",
      }));
      await prisma.classSession.createMany({
        data: finalSessions,
      });
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

export async function PUT(req: Request) {
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

    const body = await req.json();
    const {
      name,
      schedule,
      room,
      teacherIds,
      specialtyIds,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Tên lớp học không được để trống" },
        { status: 400 }
      );
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        name,
        room: room || null,
        schedule: schedule || null,
        teachers: {
          set: (teacherIds || []).map((tId: string) => ({ id: tId })),
        },
        specialties: {
          set: (specialtyIds || []).map((sId: string) => ({ id: sId })),
        },
      },
      include: {
        teachers: {
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

    return NextResponse.json({ class: updatedClass });
  } catch (error) {
    console.error("Error updating class:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
