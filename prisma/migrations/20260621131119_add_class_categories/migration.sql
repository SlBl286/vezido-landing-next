-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "classCategoryId" TEXT,
ADD COLUMN     "level" TEXT,
ALTER COLUMN "type" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "maxUses" INTEGER,
ADD COLUMN     "usedCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ClassCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClassCategory_name_key" ON "ClassCategory"("name");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_classCategoryId_fkey" FOREIGN KEY ("classCategoryId") REFERENCES "ClassCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
