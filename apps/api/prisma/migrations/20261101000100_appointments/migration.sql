-- CreateEnum
CREATE TYPE "BookingMode" AS ENUM ('PROFESSIONAL', 'RESOURCE_ONLY');

-- Database-level professional protection, across all branches of one tenant.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- CreateEnum
CREATE TYPE "AppointmentState" AS ENUM ('PENDING_CONFIRMATION', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AppointmentChannel" AS ENUM ('PHONE', 'IN_PERSON', 'INTERNAL', 'ONLINE', 'WHATSAPP');

-- AlterTable
ALTER TABLE "ServiceOffering" ADD COLUMN     "bookingMode" "BookingMode" NOT NULL DEFAULT 'PROFESSIONAL';

-- CreateTable
CREATE TABLE "AppointmentCustomer" (
    "id" UUID NOT NULL,
    "establishmentId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(32),
    "email" VARCHAR(320),
    "note" VARCHAR(500),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" UUID NOT NULL,
    "establishmentId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "professionalId" UUID,
    "customerId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "timeZone" VARCHAR(64) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "state" "AppointmentState" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "channel" "AppointmentChannel" NOT NULL,
    "note" VARCHAR(1000),
    "actorUserId" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentResource" (
    "appointmentId" UUID NOT NULL,
    "establishmentId" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "units" INTEGER NOT NULL,

    CONSTRAINT "AppointmentResource_pkey" PRIMARY KEY ("appointmentId","resourceId")
);

-- CreateTable
CREATE TABLE "AppointmentEvent" (
    "id" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "establishmentId" UUID NOT NULL,
    "actorUserId" UUID NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "before" JSONB,
    "after" JSONB NOT NULL,
    "reason" VARCHAR(500),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentRequest" (
    "establishmentId" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "actorUserId" UUID NOT NULL,
    "inputHash" CHAR(64) NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentRequest_pkey" PRIMARY KEY ("establishmentId","requestId")
);

-- CreateIndex
CREATE INDEX "AppointmentCustomer_establishmentId_name_id_idx" ON "AppointmentCustomer"("establishmentId", "name", "id");

-- CreateIndex
CREATE INDEX "AppointmentCustomer_establishmentId_phone_idx" ON "AppointmentCustomer"("establishmentId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentCustomer_establishmentId_id_key" ON "AppointmentCustomer"("establishmentId", "id");

-- CreateIndex
CREATE INDEX "Appointment_establishmentId_startsAt_id_idx" ON "Appointment"("establishmentId", "startsAt", "id");

-- CreateIndex
CREATE INDEX "Appointment_establishmentId_branchId_startsAt_idx" ON "Appointment"("establishmentId", "branchId", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_establishmentId_professionalId_startsAt_idx" ON "Appointment"("establishmentId", "professionalId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_establishmentId_id_key" ON "Appointment"("establishmentId", "id");

-- CreateIndex
CREATE INDEX "AppointmentResource_establishmentId_resourceId_idx" ON "AppointmentResource"("establishmentId", "resourceId");

-- CreateIndex
CREATE INDEX "AppointmentEvent_establishmentId_appointmentId_createdAt_idx" ON "AppointmentEvent"("establishmentId", "appointmentId", "createdAt");

ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_valid_interval" CHECK ("endsAt" > "startsAt" AND "durationMinutes" > 0 AND "endsAt" = "startsAt" + "durationMinutes" * interval '1 minute');
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_manual_channels" CHECK (channel IN ('PHONE','IN_PERSON','INTERNAL'));
ALTER TABLE "AppointmentResource" ADD CONSTRAINT "AppointmentResource_positive_units" CHECK (units > 0);
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_professional_no_overlap"
  EXCLUDE USING gist ("establishmentId" WITH =, "professionalId" WITH =, tstzrange("startsAt","endsAt",'[)') WITH &&)
  WHERE ("professionalId" IS NOT NULL AND state <> 'CANCELLED');

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalResource_establishmentId_id_key" ON "PhysicalResource"("establishmentId", "id");

-- AddForeignKey
ALTER TABLE "AppointmentCustomer" ADD CONSTRAINT "AppointmentCustomer_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_establishmentId_customerId_fkey" FOREIGN KEY ("establishmentId", "customerId") REFERENCES "AppointmentCustomer"("establishmentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_establishmentId_branchId_fkey" FOREIGN KEY ("establishmentId", "branchId") REFERENCES "Branch"("establishmentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_establishmentId_serviceId_fkey" FOREIGN KEY ("establishmentId", "serviceId") REFERENCES "ServiceOffering"("establishmentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_establishmentId_professionalId_fkey" FOREIGN KEY ("establishmentId", "professionalId") REFERENCES "Professional"("establishmentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "InternalUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentResource" ADD CONSTRAINT "AppointmentResource_establishmentId_appointmentId_fkey" FOREIGN KEY ("establishmentId", "appointmentId") REFERENCES "Appointment"("establishmentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentResource" ADD CONSTRAINT "AppointmentResource_establishmentId_resourceId_fkey" FOREIGN KEY ("establishmentId", "resourceId") REFERENCES "PhysicalResource"("establishmentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentEvent" ADD CONSTRAINT "AppointmentEvent_establishmentId_appointmentId_fkey" FOREIGN KEY ("establishmentId", "appointmentId") REFERENCES "Appointment"("establishmentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentEvent" ADD CONSTRAINT "AppointmentEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "InternalUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "InternalUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

