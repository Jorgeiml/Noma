-- CreateEnum
CREATE TYPE "EstablishmentStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER');

-- CreateEnum
CREATE TYPE "LocalCredentialKind" AS ENUM ('BOOTSTRAP', 'SESSION');

-- CreateTable
CREATE TABLE "Establishment" (
    "id" UUID NOT NULL,
    "commercialName" VARCHAR(120) NOT NULL,
    "status" "EstablishmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "timeZone" VARCHAR(64) NOT NULL DEFAULT 'America/Guayaquil',
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "businessPhone" VARCHAR(32),
    "websiteUrl" VARCHAR(250),
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Establishment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalUser" (
    "id" UUID NOT NULL,
    "displayName" VARCHAR(80) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "establishmentId" UUID NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "role" "MembershipRole" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalCredential" (
    "id" UUID NOT NULL,
    "digest" CHAR(64) NOT NULL,
    "kind" "LocalCredentialKind" NOT NULL,
    "membershipId" UUID NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocalCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Membership_establishmentId_idx" ON "Membership"("establishmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_establishmentId_key" ON "Membership"("userId", "establishmentId");

-- CreateIndex
CREATE UNIQUE INDEX "LocalCredential_digest_key" ON "LocalCredential"("digest");

-- CreateIndex
CREATE INDEX "LocalCredential_membershipId_idx" ON "LocalCredential"("membershipId");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "InternalUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalCredential" ADD CONSTRAINT "LocalCredential_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
