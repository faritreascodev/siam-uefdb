/*
  Warnings:

  - A unique constraint covering the columns `[cedula]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDIENTE_APROBACION', 'ACTIVO', 'BLOQUEADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "Parentesco" AS ENUM ('PADRE', 'MADRE', 'ABUELO_ABUELA', 'TIO_TIA', 'TUTOR_LEGAL');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CURSILLO_SCHEDULED', 'CURSILLO_APPROVED', 'CURSILLO_REJECTED', 'REQUIRES_CORRECTION', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CursilloResult" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('M', 'F');

-- CreateEnum
CREATE TYPE "Shift" AS ENUM ('MORNING', 'AFTERNOON');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('STUDENT_ID', 'REPRESENTATIVE_ID', 'STUDENT_PHOTO', 'GRADE_CERTIFICATE', 'UTILITY_BILL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPLICATION_SUBMITTED', 'APPLICATION_DRAFT_SAVED', 'CORRECTION_REQUIRED', 'APPLICATION_APPROVED', 'APPLICATION_REJECTED', 'APPLICATION_UNDER_REVIEW', 'DOCUMENT_REQUIRED');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "cedula" TEXT,
ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentesco" "Parentesco",
ADD COLUMN     "rejectionNote" TEXT,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'PENDIENTE_APROBACION',
ADD COLUMN     "telefono" TEXT,
ADD COLUMN     "tempPassword" TEXT;

-- CreateTable
CREATE TABLE "password_recovery_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motivo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_recovery_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "studentFirstName" TEXT,
    "studentLastName" TEXT,
    "studentCedula" TEXT,
    "studentBirthDate" TIMESTAMP(3),
    "studentBirthPlace" JSONB,
    "studentGender" "Gender",
    "studentNationality" TEXT,
    "studentAddress" TEXT,
    "studentSector" TEXT,
    "studentPhone" TEXT,
    "studentEmail" TEXT,
    "bloodType" TEXT,
    "hasDisability" BOOLEAN NOT NULL DEFAULT false,
    "disabilityDetail" TEXT,
    "needsSpecialCare" BOOLEAN NOT NULL DEFAULT false,
    "specialCareDetail" TEXT,
    "gradeLevel" TEXT,
    "shift" "Shift",
    "specialty" TEXT,
    "previousSchool" TEXT,
    "lastYearAverage" DECIMAL(65,30),
    "hasRepeatedYear" BOOLEAN NOT NULL DEFAULT false,
    "repeatedYearDetail" TEXT,
    "fatherData" JSONB,
    "motherData" JSONB,
    "representativeData" JSONB,
    "userId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "processedById" TEXT,
    "processedAt" TIMESTAMP(3),
    "cursilloScheduled" BOOLEAN NOT NULL DEFAULT false,
    "cursilloDate" TIMESTAMP(3),
    "cursilloResult" "CursilloResult" NOT NULL DEFAULT 'PENDING',
    "cursilloNotes" TEXT,
    "acceptedIdeario" BOOLEAN NOT NULL DEFAULT false,
    "acceptedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "rejectionReason" TEXT,
    "correctionRequest" TEXT,
    "internalComments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_documents" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "applicationId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "password_recovery_requests_userId_idx" ON "password_recovery_requests"("userId");

-- CreateIndex
CREATE INDEX "password_recovery_requests_status_idx" ON "password_recovery_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "applications_studentCedula_key" ON "applications"("studentCedula");

-- CreateIndex
CREATE INDEX "applications_userId_idx" ON "applications"("userId");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- CreateIndex
CREATE INDEX "applications_assignedToId_idx" ON "applications"("assignedToId");

-- CreateIndex
CREATE INDEX "application_documents_applicationId_idx" ON "application_documents"("applicationId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE UNIQUE INDEX "users_cedula_key" ON "users"("cedula");

-- AddForeignKey
ALTER TABLE "password_recovery_requests" ADD CONSTRAINT "password_recovery_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
