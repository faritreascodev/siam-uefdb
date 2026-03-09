/*
  Warnings:

  - The `shift` column on the `applications` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "applications" DROP COLUMN "shift",
ADD COLUMN     "shift" TEXT;

-- DropEnum
DROP TYPE "Shift";
