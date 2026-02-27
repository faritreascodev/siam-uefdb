-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ApplicationStatus" ADD VALUE 'PAYMENT_VALIDATED';
ALTER TYPE "ApplicationStatus" ADD VALUE 'MATRICULATED';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'MATRICULATED';

-- CreateTable
CREATE TABLE "extra_contacts" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extra_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "extra_contacts_applicationId_idx" ON "extra_contacts"("applicationId");

-- AddForeignKey
ALTER TABLE "extra_contacts" ADD CONSTRAINT "extra_contacts_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
