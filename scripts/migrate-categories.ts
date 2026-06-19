import { prisma } from "../lib/prisma";

async function main() {
  console.log("Starting category migration...");

  // 1. Fetch all unique category strings from SupplyItem
  const items = await prisma.supplyItem.findMany({
    select: {
      id: true,
      category: {
        select: {
          name: true
        }
      },
      name: true
    }
  });

  const uniqueCategories = Array.from(
    new Set(items.map(item => item.category?.name).filter((c): c is string => typeof c === "string"))
  );
  console.log(`Found unique categories in database:`, uniqueCategories);

  // 2. Ensure each unique category exists in SupplyCategory
  const categoryMap: Record<string, string> = {};
  
  for (const catName of uniqueCategories) {
    const category = await prisma.supplyCategory.upsert({
      where: { name: catName },
      update: {},
      create: { name: catName }
    });
    categoryMap[catName] = category.id;
    console.log(`Category verified/created: "${catName}" -> ID: ${category.id}`);
  }

  // 3. Update each SupplyItem with correct categoryId
  let updatedCount = 0;
  for (const item of items) {
    const catName = item.category?.name;
    if (catName && categoryMap[catName]) {
      const catId = categoryMap[catName];
      await prisma.supplyItem.update({
        where: { id: item.id },
        data: { categoryId: catId }
      });
      updatedCount++;
    }
  }

  console.log(`Migration finished! Updated categoryId for ${updatedCount} items.`);
}

main()
  .catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    // Wait for prisma connection to close
  });
