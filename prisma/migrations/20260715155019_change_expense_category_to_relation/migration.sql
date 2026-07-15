-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_name_key" ON "ExpenseCategory"("name");

-- Insert default categories
INSERT INTO "ExpenseCategory" ("id", "name") VALUES
('ec-van-hanh', 'Vận hành'),
('ec-mat-bang', 'Mặt bằng'),
('ec-luong', 'Lương'),
('ec-marketing', 'Marketing'),
('ec-hoa-cu', 'Họa cụ'),
('ec-khac', 'Khác')
ON CONFLICT ("name") DO NOTHING;

-- Safely insert any other unique categories already in production Expense table
INSERT INTO "ExpenseCategory" ("id", "name")
SELECT 'ec-custom-' || substr(md5(category), 1, 10), category
FROM (SELECT DISTINCT category FROM "Expense" WHERE category IS NOT NULL AND category NOT IN ('Vận hành', 'Mặt bằng', 'Lương', 'Marketing', 'Họa cụ', 'Khác')) AS temp
ON CONFLICT ("name") DO NOTHING;

-- Map existing relationships
UPDATE "Expense" SET "categoryId" = c.id FROM "ExpenseCategory" c WHERE "Expense".category = c.name;
UPDATE "Expense" SET "categoryId" = 'ec-khac' WHERE "categoryId" IS NULL;

-- Drop the old category column
ALTER TABLE "Expense" DROP COLUMN "category";

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

