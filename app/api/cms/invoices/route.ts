import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Fetch all student enrollments that have been paid
    const paidStudents = await prisma.studentClass.findMany({
      where: {
        isPaid: true,
      },
      include: {
        class: {
          include: {
            course: true,
          },
        },
      },
      orderBy: {
        paymentDate: "desc",
      },
    });

    // 1. Calculate general stats
    let totalRevenue = 0;
    const courseBreakdown: Record<string, { title: string; count: number; revenue: number }> = {};
    const monthlyBreakdown: Record<string, { label: string; revenue: number }> = {};

    paidStudents.forEach((student) => {
      const amount = student.amountPaid || 0;
      totalRevenue += amount;

      // Course breakdown
      const courseTitle = student.class?.course?.title || "Không có liên kết";
      const courseId = student.class?.course?.id || "unlinked";
      if (!courseBreakdown[courseId]) {
        courseBreakdown[courseId] = {
          title: courseTitle,
          count: 0,
          revenue: 0,
        };
      }
      courseBreakdown[courseId].count += 1;
      courseBreakdown[courseId].revenue += amount;

      // Monthly breakdown
      const payDate = student.paymentDate ? new Date(student.paymentDate) : new Date(student.createdAt);
      const monthKey = `${payDate.getFullYear()}-${String(payDate.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = `Tháng ${payDate.getMonth() + 1}/${payDate.getFullYear()}`;
      
      if (!monthlyBreakdown[monthKey]) {
        monthlyBreakdown[monthKey] = {
          label: monthLabel,
          revenue: 0,
        };
      }
      monthlyBreakdown[monthKey].revenue += amount;
    });

    // Convert breakdowns to sorted arrays
    const courses = Object.values(courseBreakdown).sort((a, b) => b.revenue - a.revenue);
    const months = Object.entries(monthlyBreakdown)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => ({
        key,
        ...value,
      }));

    return NextResponse.json({
      invoices: paidStudents.map((s) => ({
        id: s.id,
        studentName: s.studentName,
        studentCode: s.studentCode,
        parentName: s.parentName,
        parentPhone: s.parentPhone,
        className: s.class?.name,
        courseTitle: s.class?.course?.title || "Không có liên kết",
        amountPaid: s.amountPaid,
        discountCode: s.discountCode,
        paymentDate: s.paymentDate,
      })),
      stats: {
        totalRevenue,
        totalInvoices: paidStudents.length,
        courses,
        months,
      },
    });
  } catch (error) {
    console.error("Error fetching invoices stats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
