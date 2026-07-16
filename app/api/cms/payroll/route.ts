import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Fetch all teachers with session counts + payroll records for a given month/year
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month"); // "ALL" or "1"-"12"
    const yearParam = searchParams.get("year");   // "ALL" or "2024"

    const month = monthParam && monthParam !== "ALL" ? parseInt(monthParam, 10) : null;
    const year = yearParam && yearParam !== "ALL" ? parseInt(yearParam, 10) : null;

    // Build date filter for ClassSession
    const dateFilter: any = {};
    if (year && month) {
      dateFilter.gte = new Date(year, month - 1, 1);
      dateFilter.lt = new Date(year, month, 1);
    } else if (year) {
      dateFilter.gte = new Date(year, 0, 1);
      dateFilter.lt = new Date(year + 1, 0, 1);
    } else if (month) {
      // Filter by month across all years
      // We'll filter in memory below
    }

    // Fetch all teachers with their sessions count and payroll records
    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
        sessions: {
          where: {
            status: { not: "CANCELLED" },
            ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
          },
          select: {
            id: true,
            date: true,
            class: { select: { name: true } },
          },
        },
        payrollRecords: {
          where: {
            ...(month ? { month } : {}),
            ...(year ? { year } : {}),
          },
        },
      },
      orderBy: { user: { createdAt: "asc" } },
    });

    // If filtering by month only (no year), filter sessions in memory
    const processedTeachers = teachers.map((t) => {
      let sessions = t.sessions;

      // If month-only filter (no year), we need JS-level filtering
      if (month && !year) {
        sessions = sessions.filter(
          (s) => new Date(s.date).getMonth() + 1 === month
        );
      }

      const payroll = t.payrollRecords[0] || null;

      return {
        id: t.id,
        name: t.user.name || t.user.username,
        role: t.user.role, // TEACHER or ASSISTANT
        ratePerSession: t.ratePerSession || 0,
        monthlyAllowance: t.monthlyAllowance || 0,
        sessionCount: sessions.length,
        sessions: sessions.map((s) => ({
          id: s.id,
          date: s.date,
          className: s.class?.name || "",
        })),
        payroll: payroll
          ? {
              id: payroll.id,
              month: payroll.month,
              year: payroll.year,
              bonus: payroll.bonus,
              penalty: payroll.penalty,
              advance: payroll.advance,
              note: payroll.note,
            }
          : null,
      };
    });

    return NextResponse.json({ teachers: processedTeachers });
  } catch (error) {
    console.error("Error fetching payroll:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT: Upsert a PayrollRecord (bonus/penalty/advance for a teacher in a specific month/year)
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { teacherId, month, year, bonus, penalty, advance, note } = body;

    if (!teacherId || !month || !year) {
      return NextResponse.json(
        { error: "teacherId, month and year are required" },
        { status: 400 }
      );
    }

    const record = await prisma.payrollRecord.upsert({
      where: { teacherId_month_year: { teacherId, month, year } },
      create: {
        teacherId,
        month,
        year,
        bonus: bonus ?? 0,
        penalty: penalty ?? 0,
        advance: advance ?? 0,
        note: note || null,
      },
      update: {
        bonus: bonus ?? 0,
        penalty: penalty ?? 0,
        advance: advance ?? 0,
        note: note || null,
      },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Error upserting payroll record:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
