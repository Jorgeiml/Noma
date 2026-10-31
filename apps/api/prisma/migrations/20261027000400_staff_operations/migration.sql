BEGIN;

-- CreateEnum
CREATE TYPE "ScheduleExceptionKind" AS ENUM ('ABSENCE', 'CLOSURE', 'MODIFIED');

-- CreateTable
CREATE TABLE "Branch" (
    "id" UUID NOT NULL,
    "establishmentId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "address" VARCHAR(250),
    "timeZone" VARCHAR(64) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Professional" (
    "id" UUID NOT NULL,
    "establishmentId" UUID NOT NULL,
    "displayName" VARCHAR(120) NOT NULL,
    "specialty" VARCHAR(500),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalBranch" (
    "establishmentId" UUID NOT NULL,
    "professionalId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProfessionalBranch_pkey" PRIMARY KEY ("establishmentId","professionalId","branchId")
);

-- CreateTable
CREATE TABLE "ProfessionalService" (
    "establishmentId" UUID NOT NULL,
    "professionalId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProfessionalService_pkey" PRIMARY KEY ("establishmentId","professionalId","serviceId")
);

-- CreateTable
CREATE TABLE "PhysicalResource" (
    "id" UUID NOT NULL,
    "establishmentId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "typeDescription" VARCHAR(500),
    "capacity" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PhysicalResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkSchedule" (
    "id" UUID NOT NULL,
    "establishmentId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "professionalId" UUID,
    "timeZone" VARCHAR(64) NOT NULL,
    "week" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WorkSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleException" (
    "id" UUID NOT NULL,
    "establishmentId" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "kind" "ScheduleExceptionKind" NOT NULL,
    "intervals" JSONB NOT NULL,
    "note" VARCHAR(1000),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ScheduleException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceResourceSet" (
    "establishmentId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ServiceResourceSet_pkey" PRIMARY KEY ("establishmentId","branchId","serviceId")
);

-- CreateTable
CREATE TABLE "ServiceResourceRequirement" (
    "establishmentId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "units" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ServiceResourceRequirement_pkey" PRIMARY KEY ("establishmentId","branchId","serviceId","resourceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Branch_establishmentId_id_key" ON "Branch"("establishmentId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_establishmentId_id_key" ON "Professional"("establishmentId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalResource_establishmentId_branchId_id_key" ON "PhysicalResource"("establishmentId", "branchId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkSchedule_establishmentId_id_key" ON "WorkSchedule"("establishmentId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkSchedule_establishmentId_branchId_professionalId_key" ON "WorkSchedule"("establishmentId", "branchId", "professionalId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleException_scheduleId_date_key" ON "ScheduleException"("scheduleId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceOffering_establishmentId_id_key" ON "ServiceOffering"("establishmentId", "id");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalBranch" ADD CONSTRAINT "ProfessionalBranch_establishmentId_professionalId_fkey" FOREIGN KEY ("establishmentId", "professionalId") REFERENCES "Professional"("establishmentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalBranch" ADD CONSTRAINT "ProfessionalBranch_establishmentId_branchId_fkey" FOREIGN KEY ("establishmentId", "branchId") REFERENCES "Branch"("establishmentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalService" ADD CONSTRAINT "ProfessionalService_establishmentId_professionalId_fkey" FOREIGN KEY ("establishmentId", "professionalId") REFERENCES "Professional"("establishmentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalService" ADD CONSTRAINT "ProfessionalService_establishmentId_serviceId_fkey" FOREIGN KEY ("establishmentId", "serviceId") REFERENCES "ServiceOffering"("establishmentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalResource" ADD CONSTRAINT "PhysicalResource_establishmentId_branchId_fkey" FOREIGN KEY ("establishmentId", "branchId") REFERENCES "Branch"("establishmentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSchedule" ADD CONSTRAINT "WorkSchedule_establishmentId_branchId_fkey" FOREIGN KEY ("establishmentId", "branchId") REFERENCES "Branch"("establishmentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSchedule" ADD CONSTRAINT "WorkSchedule_establishmentId_professionalId_fkey" FOREIGN KEY ("establishmentId", "professionalId") REFERENCES "Professional"("establishmentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleException" ADD CONSTRAINT "ScheduleException_establishmentId_scheduleId_fkey" FOREIGN KEY ("establishmentId", "scheduleId") REFERENCES "WorkSchedule"("establishmentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceResourceSet" ADD CONSTRAINT "ServiceResourceSet_establishmentId_branchId_fkey" FOREIGN KEY ("establishmentId", "branchId") REFERENCES "Branch"("establishmentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceResourceSet" ADD CONSTRAINT "ServiceResourceSet_establishmentId_serviceId_fkey" FOREIGN KEY ("establishmentId", "serviceId") REFERENCES "ServiceOffering"("establishmentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceResourceRequirement" ADD CONSTRAINT "ServiceResourceRequirement_establishmentId_branchId_servic_fkey" FOREIGN KEY ("establishmentId", "branchId", "serviceId") REFERENCES "ServiceResourceSet"("establishmentId", "branchId", "serviceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceResourceRequirement" ADD CONSTRAINT "ServiceResourceRequirement_establishmentId_branchId_resour_fkey" FOREIGN KEY ("establishmentId", "branchId", "resourceId") REFERENCES "PhysicalResource"("establishmentId", "branchId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- SQL constraints intentionally supplement Prisma's schema.
CREATE UNIQUE INDEX "Branch_one_default_per_establishment" ON "Branch" ("establishmentId") WHERE "isDefault";
CREATE UNIQUE INDEX "WorkSchedule_branch_only_unique" ON "WorkSchedule" ("establishmentId", "branchId") WHERE "professionalId" IS NULL;
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_default_active" CHECK (NOT "isDefault" OR "active"), ADD CONSTRAINT "Branch_name_nonempty" CHECK (length(btrim("name")) > 0);
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_name_nonempty" CHECK (length(btrim("displayName")) > 0);
ALTER TABLE "PhysicalResource" ADD CONSTRAINT "PhysicalResource_positive_capacity" CHECK ("capacity" > 0), ADD CONSTRAINT "PhysicalResource_name_nonempty" CHECK (length(btrim("name")) > 0);
ALTER TABLE "ServiceResourceRequirement" ADD CONSTRAINT "ServiceResourceRequirement_positive_units" CHECK ("units" > 0);
ALTER TABLE "WorkSchedule" ADD CONSTRAINT "WorkSchedule_structured_week" CHECK (jsonb_typeof("week") = 'array');
ALTER TABLE "ScheduleException" ADD CONSTRAINT "ScheduleException_structured_intervals" CHECK (jsonb_typeof("intervals") = 'array'), ADD CONSTRAINT "ScheduleException_interval_kind" CHECK (("kind" = 'MODIFIED' AND jsonb_array_length("intervals") > 0) OR ("kind" <> 'MODIFIED' AND jsonb_array_length("intervals") = 0));

COMMIT;
