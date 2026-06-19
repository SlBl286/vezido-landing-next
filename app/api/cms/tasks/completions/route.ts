import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET completions history / reports
export async function GET(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "TEACHER" && role !== "ASSISTANT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId");
    const taskId = searchParams.get("taskId");
    const frequency = searchParams.get("frequency");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    let whereClause: any = {};

    // 1. Role checks
    if (role === "TEACHER" || role === "ASSISTANT") {
      const teacherProfile = await prisma.teacher.findUnique({
        where: { userId: session.user.id }
      });
      if (!teacherProfile) {
        return NextResponse.json({ completions: [] });
      }
      whereClause.teacherId = teacherProfile.id;
    } else if (role === "ADMIN" && teacherId) {
      whereClause.teacherId = teacherId;
    }

    if (taskId) {
      whereClause.taskId = taskId;
    }

    if (frequency) {
      whereClause.task = { frequency };
    }

    if (startDateStr || endDateStr) {
      whereClause.completedAt = {};
      if (startDateStr) {
        whereClause.completedAt.gte = new Date(startDateStr);
      }
      if (endDateStr) {
        // Set end date to end of day
        const endDate = new Date(endDateStr);
        endDate.setHours(23, 59, 59, 999);
        whereClause.completedAt.lte = endDate;
      }
    }

    const completions = await prisma.taskCompletion.findMany({
      where: whereClause,
      include: {
        task: true,
        teacher: {
          include: {
            user: {
              select: { name: true }
            }
          }
        },
        session: {
          include: {
            class: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: {
        completedAt: "desc"
      }
    });

    // Format output for reports
    const formatted = completions.map(c => ({
      id: c.id,
      taskId: c.taskId,
      taskTitle: c.task.title,
      frequency: c.task.frequency,
      teacherId: c.teacherId,
      teacherName: c.teacher.user.name || "Giáo viên",
      sessionId: c.sessionId,
      className: c.session?.class.name || null,
      sessionDate: c.session?.date || null,
      completedAt: c.completedAt,
      notes: c.notes || "",
      status: c.status,
      reward: c.task.reward,
      penalty: c.task.penalty
    }));

    return NextResponse.json({ completions: formatted });
  } catch (error) {
    console.error("Error fetching completions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST toggle completion
export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "TEACHER" && role !== "ASSISTANT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const teacherProfile = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacherProfile) {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ giáo viên" }, { status: 404 });
    }

    const body = await req.json();
    const { taskId, isCompleted, notes, sessionId } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return NextResponse.json({ error: "Không tìm thấy công việc tương ứng" }, { status: 404 });
    }

    // Verify teacher assignment
    if (task.assignedTeacherId && task.assignedTeacherId !== teacherProfile.id && role !== "ADMIN") {
      return NextResponse.json({ error: "Bạn không được phân công làm việc này" }, { status: 403 });
    }

    // Determine target date range if periodic
    const now = new Date();
    let startOfPeriod = new Date(0); // Epoch
    let endOfPeriod = new Date();

    if (task.frequency === "WEEKLY") {
      // Current week: Monday to Sunday
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      startOfPeriod = new Date(now.setDate(diff));
      startOfPeriod.setHours(0, 0, 0, 0);
      endOfPeriod = new Date(startOfPeriod);
      endOfPeriod.setDate(startOfPeriod.getDate() + 7);
    } else if (task.frequency === "MONTHLY") {
      // Current month
      startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
      endOfPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    if (isCompleted) {
      // Complete the task:
      // If it is session-specific, check if it's already completed for this session
      let existingCompletion = null;

      if (task.frequency === "SESSION_START" || task.frequency === "SESSION_END") {
        if (!sessionId) {
          return NextResponse.json({ error: "Session ID is required for session tasks" }, { status: 400 });
        }
        existingCompletion = await prisma.taskCompletion.findFirst({
          where: {
            taskId,
            sessionId,
            teacherId: teacherProfile.id
          }
        });
      } else if (task.frequency === "WEEKLY" || task.frequency === "MONTHLY") {
        existingCompletion = await prisma.taskCompletion.findFirst({
          where: {
            taskId,
            teacherId: teacherProfile.id,
            completedAt: {
              gte: startOfPeriod,
              lte: endOfPeriod
            }
          }
        });
      } else if (task.frequency === "ONCE") {
        existingCompletion = await prisma.taskCompletion.findFirst({
          where: {
            taskId,
            teacherId: teacherProfile.id
          }
        });
      }

      if (existingCompletion) {
        // Already completed, just update notes if provided
        const updated = await prisma.taskCompletion.update({
          where: { id: existingCompletion.id },
          data: { notes: notes || existingCompletion.notes }
        });
        return NextResponse.json({ completion: updated, message: "Cập nhật thành công" });
      }

      // Create new completion
      const created = await prisma.taskCompletion.create({
        data: {
          taskId,
          teacherId: teacherProfile.id,
          sessionId: sessionId || null,
          notes: notes || null,
          completedAt: new Date(),
          status: "COMPLETED"
        }
      });

      return NextResponse.json({ completion: created, message: "Hoàn thành công việc thành công" });

    } else {
      // Uncomplete/remove completion
      if (task.frequency === "SESSION_START" || task.frequency === "SESSION_END") {
        if (!sessionId) {
          return NextResponse.json({ error: "Session ID is required for session tasks" }, { status: 400 });
        }
        await prisma.taskCompletion.deleteMany({
          where: {
            taskId,
            sessionId,
            teacherId: teacherProfile.id
          }
        });
      } else if (task.frequency === "WEEKLY" || task.frequency === "MONTHLY") {
        await prisma.taskCompletion.deleteMany({
          where: {
            taskId,
            teacherId: teacherProfile.id,
            completedAt: {
              gte: startOfPeriod,
              lte: endOfPeriod
            }
          }
        });
      } else if (task.frequency === "ONCE") {
        await prisma.taskCompletion.deleteMany({
          where: {
            taskId,
            teacherId: teacherProfile.id
          }
        });
      }

      return NextResponse.json({ message: "Đã hủy đánh dấu hoàn thành công việc" });
    }

  } catch (error) {
    console.error("Error toggling task completion:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
