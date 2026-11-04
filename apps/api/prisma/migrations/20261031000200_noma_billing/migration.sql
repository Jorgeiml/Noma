-- CreateEnum
CREATE TYPE "FreeAccessMode" AS ENUM ('TEST', 'PILOT', 'COURTESY');

-- CreateEnum
CREATE TYPE "ManualAuthorizationBasis" AS ENUM ('LEGACY_REVIEWED', 'DIRECT_GRANT');

-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "BillingPhase" AS ENUM ('INITIAL_PENDING', 'ACTIVE', 'RENEWAL_PENDING', 'PAYMENT_FAILED', 'GRACE', 'SUSPENDED', 'CANCEL_SCHEDULED', 'CANCELLED', 'ENDED');

-- CreateEnum
CREATE TYPE "BillingOrderState" AS ENUM ('QUOTED', 'CHECKOUT_PENDING', 'PAYMENT_PENDING', 'PAID', 'FAILED', 'CANCELLED', 'RECONCILIATION_REQUIRED');

-- AlterEnum
ALTER TYPE "CommercialEvidenceSource" ADD VALUE 'KUSHKI_SANDBOX';

-- AlterTable
ALTER TABLE "CommercialSubscription" ADD COLUMN     "billingManaged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "billingPhase" "BillingPhase" NOT NULL DEFAULT 'INITIAL_PENDING',
ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "currentPeriodEnd" TIMESTAMPTZ(3),
ADD COLUMN     "currentPeriodStart" TIMESTAMPTZ(3),
ADD COLUMN     "nextChargeAt" TIMESTAMPTZ(3),
ADD COLUMN     "providerSubscriptionId" VARCHAR(250),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "establishmentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ManualActivation" ADD COLUMN     "aiSessionLimit" INTEGER,
ADD COLUMN     "authorizationBasis" "ManualAuthorizationBasis" NOT NULL DEFAULT 'LEGACY_REVIEWED',
ADD COLUMN     "branchLimit" INTEGER,
ADD COLUMN     "mode" "FreeAccessMode" NOT NULL DEFAULT 'PILOT',
ADD COLUMN     "professionalLimit" INTEGER,
ADD COLUMN     "startsAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userLimit" INTEGER,
ADD COLUMN     "whatsappLimit" INTEGER;

-- CreateTable
CREATE TABLE "BillingOrder" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "inputHash" CHAR(64) NOT NULL,
    "plan" "CommercialPlan" NOT NULL,
    "period" "BillingPeriod" NOT NULL,
    "state" "BillingOrderState" NOT NULL DEFAULT 'QUOTED',
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "baseMinor" INTEGER NOT NULL,
    "discountMinor" INTEGER NOT NULL DEFAULT 0,
    "taxBasisPoints" INTEGER NOT NULL,
    "taxMinor" INTEGER NOT NULL,
    "totalMinor" INTEGER NOT NULL,
    "taxPolicyRef" VARCHAR(250) NOT NULL,
    "termsVersion" VARCHAR(100) NOT NULL,
    "termsUrl" VARCHAR(500) NOT NULL,
    "cancellationText" VARCHAR(1000) NOT NULL,
    "consentAt" TIMESTAMPTZ(3),
    "renewalConsent" BOOLEAN NOT NULL DEFAULT false,
    "sandbox" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "providerLinkRef" VARCHAR(250),
    "checkoutUrl" VARCHAR(500),
    "providerSubscriptionId" VARCHAR(250),
    "providerRequestStartedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "BillingOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingPayment" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "providerReference" VARCHAR(250) NOT NULL,
    "merchantId" VARCHAR(250) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "totalMinor" INTEGER NOT NULL,
    "sandbox" BOOLEAN NOT NULL,
    "confirmedAt" TIMESTAMPTZ(3) NOT NULL,
    "periodStart" TIMESTAMPTZ(3) NOT NULL,
    "periodEnd" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingEvent" (
    "id" UUID NOT NULL,
    "fingerprint" CHAR(64) NOT NULL,
    "providerReference" VARCHAR(250),
    "kind" VARCHAR(80) NOT NULL,
    "outcome" VARCHAR(40) NOT NULL,
    "receivedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingRequest" (
    "id" UUID NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "kind" VARCHAR(32) NOT NULL,
    "requestedPlan" "CommercialPlan",
    "state" VARCHAR(32) NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingOrder_providerLinkRef_key" ON "BillingOrder"("providerLinkRef");

-- CreateIndex
CREATE UNIQUE INDEX "BillingOrder_providerSubscriptionId_key" ON "BillingOrder"("providerSubscriptionId");

-- CreateIndex
CREATE INDEX "BillingOrder_applicationId_createdAt_idx" ON "BillingOrder"("applicationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BillingOrder_applicationId_requestId_key" ON "BillingOrder"("applicationId", "requestId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingPayment_providerReference_key" ON "BillingPayment"("providerReference");

-- CreateIndex
CREATE UNIQUE INDEX "BillingEvent_fingerprint_key" ON "BillingEvent"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "BillingRequest_subscriptionId_requestId_key" ON "BillingRequest"("subscriptionId", "requestId");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialSubscription_providerSubscriptionId_key" ON "CommercialSubscription"("providerSubscriptionId");

-- AddForeignKey
ALTER TABLE "BillingOrder" ADD CONSTRAINT "BillingOrder_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CommercialApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingPayment" ADD CONSTRAINT "BillingPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "BillingOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingPayment" ADD CONSTRAINT "BillingPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "CommercialSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingRequest" ADD CONSTRAINT "BillingRequest_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "CommercialSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "ManualActivation" ADD CONSTRAINT "ManualActivation_enterprise_limits" CHECK ("authorizationBasis" <> 'DIRECT_GRANT' OR "plan" <> 'ENTERPRISE' OR ("branchLimit" BETWEEN 1 AND 100 AND "professionalLimit" BETWEEN 1 AND 1000 AND "userLimit" BETWEEN 1 AND 1000 AND "whatsappLimit" BETWEEN 1 AND 100 AND "aiSessionLimit" BETWEEN 1 AND 1000000 AND "branchLimit" IS NOT NULL AND "professionalLimit" IS NOT NULL AND "userLimit" IS NOT NULL AND "whatsappLimit" IS NOT NULL AND "aiSessionLimit" IS NOT NULL));
ALTER TABLE "BillingOrder" ADD CONSTRAINT "BillingOrder_amounts" CHECK ("baseMinor">0 AND "discountMinor"=0 AND "taxBasisPoints" BETWEEN 0 AND 10000 AND "taxMinor">=0 AND "totalMinor"="baseMinor"+"taxMinor");
ALTER TABLE "BillingPayment" ADD CONSTRAINT "BillingPayment_period" CHECK ("totalMinor">0 AND "periodEnd">"periodStart");
