import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supplies = await prisma.supplyItem.findMany();
    const lowStockItems = supplies.filter(item => item.quantity <= item.minQuantity);
    const outOfStockItems = supplies.filter(item => item.quantity === 0);

    const importTransactions = await prisma.supplyTransaction.findMany({
      where: {
        type: "IMPORT"
      },
      include: {
        item: {
          select: {
            name: true,
            category: true
          }
        }
      }
    });

    let totalExpenditure = 0;
    const monthlyStats: Record<string, number> = {};
    const categoryStats: Record<string, number> = {};
    const itemStats: Record<string, { name: string; cost: number; quantity: number }> = {};

    for (const tx of importTransactions) {
      const cost = tx.totalCost || 0;
      totalExpenditure += cost;

      const dateObj = new Date(tx.date);
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + cost;

      const category = tx.item?.category || "Chung";
      categoryStats[category] = (categoryStats[category] || 0) + cost;

      if (tx.itemId) {
        if (!itemStats[tx.itemId]) {
          itemStats[tx.itemId] = {
            name: tx.item?.name || "Vật phẩm không tên",
            cost: 0,
            quantity: 0
          };
        }
        itemStats[tx.itemId].cost += cost;
        itemStats[tx.itemId].quantity += tx.quantity;
      }
    }

    const monthlyData = Object.entries(monthlyStats)
      .map(([month, cost]) => ({ month, cost }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const categoryData = Object.entries(categoryStats)
      .map(([category, cost]) => ({ category, cost }))
      .sort((a, b) => b.cost - a.cost);

    const topItemsData = Object.values(itemStats)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    return NextResponse.json({
      summary: {
        totalItems: supplies.length,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        totalExpenditure
      },
      monthlyData,
      categoryData,
      topItemsData
    });
  } catch (error) {
    console.error("Error generating supply stats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
