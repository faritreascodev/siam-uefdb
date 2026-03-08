-- CreateTable
CREATE TABLE "form_field_configs" (
    "id" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL DEFAULT 'select',
    "label" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "options" JSONB,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "placeholder" TEXT,
    "helpText" TEXT,
    "validationRules" JSONB,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "form_field_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "form_field_configs_fieldKey_key" ON "form_field_configs"("fieldKey");

-- CreateIndex
CREATE INDEX "form_field_configs_section_idx" ON "form_field_configs"("section");

-- CreateIndex
CREATE INDEX "form_field_configs_isEnabled_idx" ON "form_field_configs"("isEnabled");
