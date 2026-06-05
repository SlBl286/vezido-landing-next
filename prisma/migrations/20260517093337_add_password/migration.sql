-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hassedPassword" TEXT,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
