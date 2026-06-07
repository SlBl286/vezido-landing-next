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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const frequency = searchParams.get("frequency");
    const teacherFilterId = searchParams.get("teacherId");

    // 1. If role is ADMIN, they can list everything or filter
    if (role === "ADMIN") {
      const whereClause: any = {};
      if (frequency) whereClause.frequency = frequency;
      if (teacherFilterId) whereClause.assignedTeacherId = teacherFilterId;

      const tasks = await prisma.task.findMany({
        where: whereClause,
        include: {
          assignedTeacher: {
            include: {
              user: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      });

      return NextResponse.json({ tasks });
    }

    // 2. If role is TEACHER, get tasks assigned to this teacher or general tasks
    const teacherProfile = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacherProfile) {
      return NextResponse.json({ tasks: [] });
    }

    const whereClause: any = {
      OR: [
        { assignedTeacherId: null },
        { assignedTeacherId: teacherProfile.id }
      ]
    };
    if (frequency) {
      whereClause.frequency = frequency;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({ tasks, teacherId: teacherProfile.id });
  } catch (error) {
    console.error("Error fetching tasks:", error);
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
    const { title, description, frequency, assignedTeacherId } = body;

    if (!title || !frequency) {
      return NextResponse.json({ error: "Tên công việc và tần suất là bắt buộc" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        frequency,
        assignedTeacherId: assignedTeacherId || null
      }
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
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
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const { title, description, frequency, assignedTeacherId } = body;

    if (!title || !frequency) {
      return NextResponse.json({ error: "Tên công việc và tần suất là bắt buộc" }, { status: 400 });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        description: description || null,
        frequency,
        assignedTeacherId: assignedTeacherId || null
      }
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error updating task:", error);
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
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    await prisma.task.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
