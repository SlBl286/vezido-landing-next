import { prisma } from "@/lib/prisma";

export async function checkAndGenerateRecurring() {
  try {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentYear = today.getFullYear();

    // Fetch all active templates
    const templates = await prisma.recurringTemplate.findMany({
      where: { isActive: true }
    });

    for (const template of templates) {
      // If we are at or past the day of month for this template
      if (currentDay >= template.dayOfMonth) {
        // Check if already generated for this month & year
        const existing = await prisma.recurringHistory.findFirst({
          where: {
            templateId: template.id,
            month: currentMonth,
            year: currentYear
          }
        });

        if (!existing) {
          // Generate transaction
          // Set date to the designated day of the current month
          const txnDate = new Date(currentYear, currentMonth - 1, template.dayOfMonth, 7, 0, 0);

          await prisma.$transaction(async (tx) => {
            const exp = await tx.expense.create({
              data: {
                title: `${template.title} (Tháng ${currentMonth}/${currentYear})`,
                amount: template.amount,
                type: template.type,
                categoryId: template.categoryId,
                description: template.description || `Tự động tạo từ cấu hình chi phí cố định (Ngày ${template.dayOfMonth} hàng tháng)`,
                date: txnDate
              }
            });

            await tx.recurringHistory.create({
              data: {
                templateId: template.id,
                month: currentMonth,
                year: currentYear,
                expenseId: exp.id
              }
            });
          });
          
          console.log(`Successfully generated recurring transaction: "${template.title}" for ${currentMonth}/${currentYear}`);
        }
      }
    }
  } catch (error) {
    console.error("Error checking/generating recurring transactions:", error);
  }
}
