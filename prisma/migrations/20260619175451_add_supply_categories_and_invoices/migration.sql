-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ASSISTANT';

-- AlterTable
ALTER TABLE "SupplyTransaction" ADD COLUMN     "invoices" TEXT[];

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "penalty" TEXT,
ADD COLUMN     "reward" TEXT;

-- CreateTable
CREATE TABLE "FaqCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplyCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FaqCategory_name_key" ON "FaqCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SupplyCategory_name_key" ON "SupplyCategory"("name");

-- AlterTable (Add categoryId and purchaseLink without dropping category)
ALTER TABLE "SupplyItem" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "purchaseLink" TEXT;

-- Data Migration: Insert unique categories from SupplyItem into SupplyCategory
INSERT INTO "SupplyCategory" ("id", "name", "createdAt", "updatedAt")
SELECT 
  'cat_' || substring(md5(category) from 1 for 20),
  category,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "SupplyItem"
WHERE category IS NOT NULL AND category <> ''
ON CONFLICT ("name") DO NOTHING;

-- Data Migration: Update categoryId in SupplyItem
UPDATE "SupplyItem"
SET "categoryId" = (
  SELECT "id" FROM "SupplyCategory"
  WHERE "SupplyCategory"."name" = "SupplyItem"."category"
)
WHERE category IS NOT NULL AND category <> '';

-- AlterTable (Drop the old category column)
ALTER TABLE "SupplyItem" DROP COLUMN "category";

-- AddForeignKey
ALTER TABLE "SupplyItem" ADD CONSTRAINT "SupplyItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SupplyCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
