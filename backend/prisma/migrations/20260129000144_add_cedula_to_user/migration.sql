-- CreateTable
CREATE TABLE "admission_quotas" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "parallel" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "specialty" TEXT,
    "totalQuota" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL DEFAULT '2026-2027',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "admission_quotas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admission_quotas_level_parallel_shift_specialty_academicYea_key" ON "admission_quotas"("level", "parallel", "shift", "specialty", "academicYear");
