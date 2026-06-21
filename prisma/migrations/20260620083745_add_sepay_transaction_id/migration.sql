-- AlterTable
ALTER TABLE "StudentClass" ADD COLUMN     "sepayTransactionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "StudentClass_sepayTransactionId_key" ON "StudentClass"("sepayTransactionId");

