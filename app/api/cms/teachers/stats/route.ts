import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const whereClause: any = { teacherId };
    if (startDate || endDate) {
      whereClause.date = dateFilter;
    }

    const allSessions = await prisma.classSession.findMany({
      where: whereClause,
      select: {
        isMakeup: true,
        status: true,
      },
    });

    const totalSessions = allSessions.length;
    const regularSessions = allSessions.filter((s) => !s.isMakeup).length;
    const makeupSessions = allSessions.filter((s) => s.isMakeup).length;
    const completedSessions = allSessions.filter((s) => s.status === "COMPLETED").length;
    const cancelledSessions = allSessions.filter((s) => s.status === "CANCELLED").length;

    return NextResponse.json({
      totalSessions,
      regularSessions,
      makeupSessions,
      completedSessions,
      cancelledSessions,
    });
  } catch (error) {
    console.error("Error fetching teacher stats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
