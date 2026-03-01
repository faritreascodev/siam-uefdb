-- AlterEnum
ALTER TYPE "ApplicationStatus" ADD VALUE 'PAYMENT_UPLOADED';

-- AlterEnum
ALTER TYPE "DocumentType" ADD VALUE 'PAYMENT_RECEIPT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_UPLOADED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_VALIDATED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_REJECTED';

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "paymentAmount" DECIMAL(65,30),
ADD COLUMN     "paymentDate" TIMESTAMP(3),
ADD COLUMN     "paymentReference" TEXT;
