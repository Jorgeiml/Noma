ALTER TABLE "Establishment"
  ADD COLUMN "countryCode" CHAR(2), ADD COLUMN "city" VARCHAR(100),
  ADD COLUMN "address" VARCHAR(250), ADD COLUMN "businessEmail" VARCHAR(320),
  ADD COLUMN "description" VARCHAR(1000), ADD COLUMN "beautySubtype" VARCHAR(40);
CREATE TABLE "BusinessOnboarding" (
  "id" UUID NOT NULL PRIMARY KEY,
  "applicationId" UUID NOT NULL UNIQUE REFERENCES "CommercialApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "establishmentId" UUID UNIQUE REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "selectedVertical" "BusinessVertical", "step" INTEGER NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 0, "createdBusiness" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMPTZ(3), "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "BusinessOnboarding_step" CHECK ("step" BETWEEN 0 AND 6),
  CONSTRAINT "BusinessOnboarding_completion" CHECK ("completedAt" IS NULL OR ("establishmentId" IS NOT NULL AND "step"=6))
);
CREATE TABLE "OnboardingOperation" (
  "id" UUID NOT NULL PRIMARY KEY,
  "applicationId" UUID NOT NULL REFERENCES "CommercialApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "requestId" UUID NOT NULL, "action" VARCHAR(40) NOT NULL, "inputHash" CHAR(64) NOT NULL,
  "resultId" UUID, "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("applicationId","requestId")
);
