-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "monthlyAllowance" DOUBLE PRECISION,
ADD COLUMN     "ratePerSession" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "PayrollRecord" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "bonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "penalty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "advance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRecord_teacherId_month_year_key" ON "PayrollRecord"("teacherId", "month", "year");

-- AddForeignKey
ALTER TABLE "PayrollRecord" ADD CONSTRAINT "PayrollRecord_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
