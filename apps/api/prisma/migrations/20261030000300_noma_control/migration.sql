CREATE TYPE "PlatformRole" AS ENUM ('PLATFORM_OWNER','PLATFORM_ADMIN','BILLING_MANAGER','SUPPORT_AGENT');
CREATE TYPE "ApplicationDecision" AS ENUM ('APPROVED','REJECTED');
CREATE TYPE "ManualActivationState" AS ENUM ('ACTIVE','SUSPENDED','REVOKED');
CREATE TABLE "PlatformAccess" (
  "userId" UUID PRIMARY KEY REFERENCES "InternalUser"("id") ON DELETE RESTRICT,
  "role" "PlatformRole" NOT NULL, "version" INTEGER NOT NULL DEFAULT 0,
  "revokedAt" TIMESTAMPTZ(3), "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL
);
CREATE UNIQUE INDEX "PlatformAccess_one_owner" ON "PlatformAccess" ("role") WHERE "role"='PLATFORM_OWNER' AND "revokedAt" IS NULL;
CREATE TABLE "ApplicationReview" (
  "applicationId" UUID PRIMARY KEY REFERENCES "CommercialApplication"("id") ON DELETE RESTRICT,
  "decision" "ApplicationDecision" NOT NULL, "version" INTEGER NOT NULL DEFAULT 1,
  "decidedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "actorUserId" UUID NOT NULL,
  "reason" VARCHAR(500) NOT NULL
);
CREATE INDEX "ApplicationReview_decision_decidedAt_idx" ON "ApplicationReview"("decision","decidedAt");
CREATE TABLE "ManualActivation" (
  "id" UUID PRIMARY KEY, "applicationId" UUID NOT NULL UNIQUE REFERENCES "CommercialApplication"("id") ON DELETE RESTRICT,
  "membershipId" UUID UNIQUE REFERENCES "Membership"("id") ON DELETE RESTRICT,
  "plan" "CommercialPlan" NOT NULL, "state" "ManualActivationState" NOT NULL DEFAULT 'ACTIVE',
  "expiresAt" TIMESTAMPTZ(3) NOT NULL, "actorUserId" UUID NOT NULL, "reason" VARCHAR(500) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "ManualActivation_positive_term" CHECK ("expiresAt">"createdAt"),
  CONSTRAINT "ManualActivation_max_term" CHECK ("expiresAt"<="createdAt" + INTERVAL '90 days')
);
CREATE INDEX "ManualActivation_state_expiresAt_idx" ON "ManualActivation"("state","expiresAt");
CREATE TABLE "PlatformAudit" (
  "id" UUID PRIMARY KEY, "actorUserId" UUID NOT NULL REFERENCES "InternalUser"("id") ON DELETE RESTRICT,
  "requestId" UUID NOT NULL, "action" VARCHAR(80) NOT NULL, "resourceType" VARCHAR(32) NOT NULL,
  "resourceId" UUID, "reason" VARCHAR(500) NOT NULL, "outcome" VARCHAR(16) NOT NULL,
  "inputHash" CHAR(64), "changes" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformAudit_outcome" CHECK ("outcome" IN ('SUCCESS','DENIED','REJECTED'))
);
CREATE UNIQUE INDEX "PlatformAudit_actorUserId_requestId_key" ON "PlatformAudit"("actorUserId","requestId");
CREATE INDEX "PlatformAudit_createdAt_id_idx" ON "PlatformAudit"("createdAt","id");
CREATE INDEX "PlatformAudit_resourceType_resourceId_createdAt_idx" ON "PlatformAudit"("resourceType","resourceId","createdAt");
CREATE INDEX "CommercialApplication_createdAt_id_idx" ON "CommercialApplication"("createdAt","id");
CREATE INDEX "CommercialApplication_state_createdAt_idx" ON "CommercialApplication"("state","createdAt");
CREATE INDEX "CommercialSubscription_createdAt_id_idx" ON "CommercialSubscription"("createdAt","id");
CREATE INDEX "Establishment_createdAt_id_idx" ON "Establishment"("createdAt","id");
CREATE INDEX "InternalUser_createdAt_id_idx" ON "InternalUser"("createdAt","id");
-- Prefix search uses lower(column) LIKE 'text%' with a matching pattern_ops index.
CREATE INDEX "InternalUser_control_name_prefix" ON "InternalUser" (lower("displayName") text_pattern_ops);
CREATE INDEX "Establishment_control_name_prefix" ON "Establishment" (lower("commercialName") text_pattern_ops);
