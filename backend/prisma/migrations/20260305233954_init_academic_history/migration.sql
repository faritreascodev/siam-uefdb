-- CreateEnum
CREATE TYPE "EnrollmentType" AS ENUM ('NEW_STUDENT', 'RETURNING_STUDENT');

-- CreateEnum
CREATE TYPE "AcademicStatus" AS ENUM ('PASSED', 'SUPLETORIO_PENDING', 'SUPLETORIO_PASSED', 'SUPLETORIO_FAILED', 'REMEDIAL_PENDING', 'REMEDIAL_PASSED', 'REMEDIAL_FAILED', 'GRACIA_PENDING', 'GRACIA_PASSED', 'FAILED_YEAR');

-- AlterEnum
ALTER TYPE "Gender" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "cursilloSessionId" TEXT,
ADD COLUMN     "enrollmentType" "EnrollmentType" NOT NULL DEFAULT 'NEW_STUDENT',
ADD COLUMN     "paymentRejectionReason" TEXT,
ADD COLUMN     "paymentValidatedAt" TIMESTAMP(3),
ADD COLUMN     "paymentValidatedBy" TEXT;

-- CreateTable
CREATE TABLE "cursillo_sessions" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "subjectCode" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "specialty" TEXT,
    "teacherName" TEXT,
    "teacherEmail" TEXT,
    "teamsLink" TEXT NOT NULL DEFAULT 'https://teams.microsoft.com/meet/24893552174366?p=sbOFw5Mv0IROZbyY0H',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "totalSessions" INTEGER NOT NULL DEFAULT 4,
    "sessionSchedule" TEXT,
    "academicYear" TEXT NOT NULL DEFAULT '2026-2027',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cursillo_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursillo_enrollments" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "attendedSessions" INTEGER NOT NULL DEFAULT 0,
    "score" DECIMAL(65,30),
    "passed" BOOLEAN,
    "notes" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cursillo_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_records" (
    "id" TEXT NOT NULL,
    "studentCedula" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "finalAverage" DECIMAL(65,30),
    "status" "AcademicStatus" NOT NULL DEFAULT 'PASSED',
    "supletorioGrade" DECIMAL(65,30),
    "remedialGrade" DECIMAL(65,30),
    "graciaGrade" DECIMAL(65,30),
    "failedSubjectsCount" INTEGER NOT NULL DEFAULT 0,
    "behaviorGrade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cursillo_sessions_gradeLevel_idx" ON "cursillo_sessions"("gradeLevel");

-- CreateIndex
CREATE INDEX "cursillo_sessions_academicYear_idx" ON "cursillo_sessions"("academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "cursillo_sessions_subjectCode_gradeLevel_specialty_academic_key" ON "cursillo_sessions"("subjectCode", "gradeLevel", "specialty", "academicYear");

-- CreateIndex
CREATE INDEX "cursillo_enrollments_applicationId_idx" ON "cursillo_enrollments"("applicationId");

-- CreateIndex
CREATE INDEX "cursillo_enrollments_sessionId_idx" ON "cursillo_enrollments"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "cursillo_enrollments_applicationId_sessionId_key" ON "cursillo_enrollments"("applicationId", "sessionId");

-- CreateIndex
CREATE INDEX "academic_records_studentCedula_idx" ON "academic_records"("studentCedula");

-- CreateIndex
CREATE UNIQUE INDEX "academic_records_studentCedula_academicYear_key" ON "academic_records"("studentCedula", "academicYear");

-- AddForeignKey
ALTER TABLE "cursillo_enrollments" ADD CONSTRAINT "cursillo_enrollments_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursillo_enrollments" ADD CONSTRAINT "cursillo_enrollments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "cursillo_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
