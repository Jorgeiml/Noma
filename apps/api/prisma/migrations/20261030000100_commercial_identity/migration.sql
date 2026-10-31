-- Additive migration; no backfill, credential rotation or business data changes.
BEGIN;
-- CreateEnum
CREATE TYPE "CommercialPlan" AS ENUM ('START', 'GROW', 'SCALE', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "CommercialApplicationState" AS ENUM ('REGISTRATION_STARTED', 'IDENTITY_VERIFIED', 'PLAN_SELECTED', 'ACTIVATION_PENDING');

-- CreateEnum
CREATE TYPE "CommercialSubscriptionState" AS ENUM ('ACTIVATION_PENDING', 'ACTIVE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CommercialEvidenceSource" AS ENUM ('LOCAL_SYNTHETIC', 'VERIFIED_EXTERNAL');

-- CreateTable
CREATE TABLE "ExternalIdentity" (
    "id" UUID NOT NULL,
    "issuer" VARCHAR(500) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "userId" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "verifiedAt" TIMESTAMPTZ(3),
    "synthetic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialSession" (
    "id" UUID NOT NULL,
    "digest" CHAR(64) NOT NULL,
    "identityId" UUID NOT NULL,
    "membershipId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "lastSeenAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommercialSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OidcAttempt" (
    "stateDigest" CHAR(64) NOT NULL,
    "browserDigest" CHAR(64) NOT NULL,
    "encryptedPayload" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "OidcAttempt_pkey" PRIMARY KEY ("stateDigest")
);

-- CreateTable
CREATE TABLE "IdentityRateLimit" (
    "key" CHAR(64) NOT NULL,
    "hits" INTEGER NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "IdentityRateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "CommercialApplication" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "state" "CommercialApplicationState" NOT NULL DEFAULT 'REGISTRATION_STARTED',
    "selectedPlan" "CommercialPlan",
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "CommercialApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialSubscription" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "establishmentId" UUID NOT NULL,
    "plan" "CommercialPlan" NOT NULL,
    "state" "CommercialSubscriptionState" NOT NULL DEFAULT 'ACTIVATION_PENDING',
    "evidenceSource" "CommercialEvidenceSource" NOT NULL,
    "evidenceRef" VARCHAR(250),
    "activatedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "CommercialSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalIdentity_userId_idx" ON "ExternalIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalIdentity_issuer_subject_key" ON "ExternalIdentity"("issuer", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialSession_digest_key" ON "CommercialSession"("digest");

-- CreateIndex
CREATE INDEX "CommercialSession_identityId_idx" ON "CommercialSession"("identityId");

-- CreateIndex
CREATE INDEX "OidcAttempt_expiresAt_idx" ON "OidcAttempt"("expiresAt");

-- CreateIndex
CREATE INDEX "IdentityRateLimit_expiresAt_idx" ON "IdentityRateLimit"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialApplication_userId_key" ON "CommercialApplication"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialSubscription_applicationId_key" ON "CommercialSubscription"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialSubscription_establishmentId_key" ON "CommercialSubscription"("establishmentId");

-- AddForeignKey
ALTER TABLE "ExternalIdentity" ADD CONSTRAINT "ExternalIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "InternalUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialSession" ADD CONSTRAINT "CommercialSession_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "ExternalIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialSession" ADD CONSTRAINT "CommercialSession_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialApplication" ADD CONSTRAINT "CommercialApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "InternalUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialSubscription" ADD CONSTRAINT "CommercialSubscription_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CommercialApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialSubscription" ADD CONSTRAINT "CommercialSubscription_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CommercialApplication" ADD CONSTRAINT "CommercialApplication_plan_state_check" CHECK ("state" NOT IN ('PLAN_SELECTED', 'ACTIVATION_PENDING') OR "selectedPlan" IS NOT NULL);
ALTER TABLE "CommercialSubscription" ADD CONSTRAINT "CommercialSubscription_evidence_check" CHECK ("evidenceSource" = 'LOCAL_SYNTHETIC' OR length(trim("evidenceRef")) > 0 AND "evidenceRef" IS NOT NULL);
ALTER TABLE "CommercialSubscription" ADD CONSTRAINT "CommercialSubscription_active_check" CHECK ("state" <> 'ACTIVE' OR "activatedAt" IS NOT NULL);
ALTER TABLE "IdentityRateLimit" ADD CONSTRAINT "IdentityRateLimit_positive_check" CHECK ("hits" > 0);
COMMIT;
