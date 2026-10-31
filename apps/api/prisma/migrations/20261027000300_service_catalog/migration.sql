-- CreateEnum
CREATE TYPE "ServicePriceMode" AS ENUM ('FIXED', 'FROM', 'RANGE', 'ASSESSMENT_REQUIRED');

-- CreateTable
CREATE TABLE "ServiceOffering" (
    "id" UUID NOT NULL,
    "establishmentId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "category" VARCHAR(80),
    "description" VARCHAR(2000) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "priceMode" "ServicePriceMode" NOT NULL,
    "priceMin" DECIMAL(18,4),
    "priceMax" DECIMAL(18,4),
    "currency" CHAR(3) NOT NULL,
    "hasPriorAssessment" BOOLEAN NOT NULL DEFAULT false,
    "assessmentDescription" VARCHAR(1000),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ServiceOffering_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceOffering_establishmentId_active_category_idx" ON "ServiceOffering"("establishmentId", "active", "category");

-- AddForeignKey
ALTER TABLE "ServiceOffering" ADD CONSTRAINT "ServiceOffering_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Invariantes SQL conservadas como parte de la migración versionada.
ALTER TABLE "ServiceOffering" ADD CONSTRAINT "ServiceOffering_duration_positive" CHECK ("durationMinutes" > 0);
ALTER TABLE "ServiceOffering" ADD CONSTRAINT "ServiceOffering_name_nonempty" CHECK (length(trim("name")) > 0);
ALTER TABLE "ServiceOffering" ADD CONSTRAINT "ServiceOffering_price_shape" CHECK (
  ("priceMode" IN ('FIXED', 'FROM') AND "priceMin" IS NOT NULL AND "priceMin" >= 0 AND "priceMax" IS NULL)
  OR ("priceMode" = 'RANGE' AND "priceMin" IS NOT NULL AND "priceMax" IS NOT NULL AND "priceMin" >= 0 AND "priceMax" >= "priceMin")
  OR ("priceMode" = 'ASSESSMENT_REQUIRED' AND "priceMin" IS NULL AND "priceMax" IS NULL)
);
ALTER TABLE "ServiceOffering" ADD CONSTRAINT "ServiceOffering_assessment_shape" CHECK (
  ("priceMode" <> 'ASSESSMENT_REQUIRED' AND NOT "hasPriorAssessment" AND "assessmentDescription" IS NULL)
  OR ("priceMode" = 'ASSESSMENT_REQUIRED' AND (
    (NOT "hasPriorAssessment" AND "assessmentDescription" IS NULL)
    OR ("hasPriorAssessment" AND "assessmentDescription" IS NOT NULL AND length(trim("assessmentDescription")) > 0)
  ))
);
