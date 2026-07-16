import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkAndGenerateRecurring } from "../expenses/recurring/helper";

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
    // Auto-generate recurring transactions
    await checkAndGenerateRecurring();

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

    // Fetch all general expenses
    const generalExpenses = await prisma.expense.findMany({
      include: {
        category: true
      },
      orderBy: {
        date: "desc"
      }
    });

    const syncedTransactionIds = generalExpenses
      .map(e => e.supplyTransactionId)
      .filter(Boolean) as string[];

    // Fetch all supply import transactions that cost money and are not yet synced/copied
    const supplyTransactions = await prisma.supplyTransaction.findMany({
      where: {
        type: "IMPORT",
        totalCost: { gt: 0 },
        id: { notIn: syncedTransactionIds }
      },
      include: {
        item: true
      },
      orderBy: {
        date: "desc"
      }
    });

    // Map general expenses
    const mappedGeneralExpenses = generalExpenses.map(e => ({
      id: e.id,
      title: e.title,
      amount: e.amount,
      type: e.type, // "EXPENSE" or "REVENUE"
      category: e.category?.name || "Khác",
      categoryId: e.categoryId,
      date: e.date,
      description: e.description,
      invoices: e.invoices || [],
      isReadOnly: !!e.supplyTransactionId
    }));

    // Map supply transactions
    const mappedSupplyExpenses = supplyTransactions.map(tx => ({
      id: tx.id,
      title: `Nhập họa cụ: ${tx.item?.name || "Họa cụ"} (x${tx.quantity} ${tx.item?.unit || "cái"})`,
      amount: tx.totalCost || 0,
      type: "EXPENSE",
      category: "Họa cụ",
      date: tx.date,
      description: tx.purpose || "Tự động ghi nhận từ Quản lý Kho họa cụ",
      invoices: tx.invoices || [],
      isReadOnly: true
    }));

    // Combine all expenses/revenues
    const allExpenses = [...mappedGeneralExpenses, ...mappedSupplyExpenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Calculate general stats
    let totalRevenue = 0;
    let totalExpense = 0;
    const courseBreakdown: Record<string, { title: string; count: number; revenue: number }> = {};
    const expenseCategoryBreakdown: Record<string, { category: string; revenue: number }> = {};
    const monthlyBreakdown: Record<string, { label: string; revenue: number; expense: number; profit: number }> = {};

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
          expense: 0,
          profit: 0
        };
      }
      monthlyBreakdown[monthKey].revenue += amount;
    });

    allExpenses.forEach((exp) => {
      const amount = exp.amount || 0;
      const isRevenue = exp.type === "REVENUE";
      
      if (isRevenue) {
        totalRevenue += amount;
      } else {
        totalExpense += amount;
      }

      // Expense category breakdown (only for actual expenses)
      if (!isRevenue) {
        const cat = exp.category || "Khác";
        if (!expenseCategoryBreakdown[cat]) {
          expenseCategoryBreakdown[cat] = {
            category: cat,
            revenue: 0
          };
        }
        expenseCategoryBreakdown[cat].revenue += amount;
      }

      // Monthly breakdown
      const expDate = exp.date ? new Date(exp.date) : new Date();
      const monthKey = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = `Tháng ${expDate.getMonth() + 1}/${expDate.getFullYear()}`;

      if (!monthlyBreakdown[monthKey]) {
        monthlyBreakdown[monthKey] = {
          label: monthLabel,
          revenue: 0,
          expense: 0,
          profit: 0
        };
      }
      
      if (isRevenue) {
        monthlyBreakdown[monthKey].revenue += amount;
      } else {
        monthlyBreakdown[monthKey].expense += amount;
      }
    });

    // Compute monthly profits
    Object.keys(monthlyBreakdown).forEach((monthKey) => {
      monthlyBreakdown[monthKey].profit =
        monthlyBreakdown[monthKey].revenue - monthlyBreakdown[monthKey].expense;
    });

    // Convert breakdowns to sorted arrays
    const courses = Object.values(courseBreakdown).sort((a, b) => b.revenue - a.revenue);
    const expenseCategories = Object.values(expenseCategoryBreakdown).sort((a, b) => b.revenue - a.revenue);
    const months = Object.entries(monthlyBreakdown)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => ({
        key,
        ...value,
      }));

    return NextResponse.json({
      invoices: paidStudents.map((s) => {
        const sessions = s.customDuration !== null && s.customDuration !== undefined
          ? Number(s.customDuration)
          : (parseInt(s.class?.course?.duration || "0", 10) || 0);
        const feePerSession = s.class?.course?.fee || 0;
        const originalFee = sessions * feePerSession;
        const amountPaid = s.amountPaid || 0;
        const discountAmount = Math.max(0, originalFee - amountPaid);
        const discountPercent = originalFee > 0 ? Math.round((discountAmount / originalFee) * 100 * 10) / 10 : 0;

        return {
          id: s.id,
          studentName: s.studentName,
          studentCode: s.studentCode,
          parentName: s.parentName,
          parentPhone: s.parentPhone,
          className: s.class?.name,
          courseTitle: s.class?.course?.title || "Không có liên kết",
          originalFee,
          discountAmount,
          discountPercent,
          amountPaid: s.amountPaid,
          discountCode: s.discountCode,
          paymentDate: s.paymentDate,
          paymentMethod: s.paymentMethod,
          paymentProof: s.paymentProof,
        };
      }),
      expenses: allExpenses,
      stats: {
        totalRevenue,
        totalExpense,
        netProfit: totalRevenue - totalExpense,
        totalInvoices: paidStudents.length,
        courses,
        expenseCategories,
        months,
      },
    });
  } catch (error) {
    console.error("Error fetching invoices stats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
