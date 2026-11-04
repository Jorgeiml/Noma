import type { Prisma } from "../generated/prisma/client";
import { entitlementFor } from "./onboarding.authorization";
export async function configurationFor(
  tx: Prisma.TransactionClient,
  establishmentId: string,
) {
  const business = await tx.establishment.findUniqueOrThrow({
    where: { id: establishmentId },
    select: {
      id: true,
      commercialName: true,
      countryCode: true,
      city: true,
      address: true,
      businessPhone: true,
      businessEmail: true,
      timeZone: true,
      currency: true,
      description: true,
      beautySubtype: true,
      vertical: true,
      status: true,
      version: true,
    },
  });
  const branches = await tx.branch.findMany({
    where: { establishmentId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }, { id: "asc" }],
  });
  const services = await tx.serviceOffering.findMany({
    where: { establishmentId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 100,
  });
  const professionals = await tx.professional.findMany({
    where: { establishmentId },
    include: {
      branches: { where: { active: true } },
      services: { where: { active: true } },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const resources = await tx.physicalResource.findMany({
    where: { establishmentId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const schedules = await tx.workSchedule.findMany({
    where: { establishmentId },
    orderBy: { id: "asc" },
  });
  return {
    business,
    branches,
    services,
    professionals: professionals.map(({ branches, services, ...person }) => ({
      ...person,
      branchIds: branches.map((b) => b.branchId),
      serviceIds: services.map((s) => s.serviceId),
    })),
    resources,
    schedules,
  };
}
export type OnboardingConfiguration = Awaited<
  ReturnType<typeof configurationFor>
>;
export function missingFor(
  config: OnboardingConfiguration | null,
  createdBusiness: boolean,
) {
  const missing: Array<{ step: number; message: string }> = [];
  if (!config) return [{ step: 1, message: "Guarda los datos de tu negocio." }];
  const b = config.business;
  if (
    !b.commercialName ||
    !b.businessPhone ||
    !b.timeZone ||
    (createdBusiness && (!b.countryCode || !b.city || !b.businessEmail))
  )
    missing.push({
      step: 1,
      message: "Completa los datos de contacto y ubicación del negocio.",
    });
  const branch =
    config.branches.find((b) => b.active && b.isDefault) ??
    config.branches.find((b) => b.active);
  const schedule =
    branch &&
    config.schedules.find(
      (s) => s.branchId === branch.id && s.professionalId === null,
    );
  const week = schedule?.week as
    Array<{ closed: boolean; intervals: unknown[] }> | undefined;
  if (!branch || !week?.some((day) => !day.closed && day.intervals.length))
    missing.push({
      step: 2,
      message:
        "Guarda una sucursal activa y al menos un día con horario de atención.",
    });
  const services = config.services.filter((s) => s.active);
  if (!services.length)
    missing.push({ step: 3, message: "Añade al menos un servicio activo." });
  const people = config.professionals.filter(
    (p) =>
      p.active &&
      p.branchIds.some((id) =>
        config.branches.some((b) => b.id === id && b.active),
      ) &&
      p.serviceIds.some((id) => services.some((s) => s.id === id)),
  );
  if (!people.length)
    missing.push({
      step: 4,
      message:
        "Añade al menos un profesional activo, asociado a una sucursal y a un servicio.",
    });
  return missing;
}
export async function snapshotFor(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const application = await tx.commercialApplication.findUnique({
    where: { userId },
    include: { onboarding: true, manualActivation: true, platformReview: true },
  });
  const memberships = await tx.membership.findMany({
    where: { userId, status: "ACTIVE", role: "OWNER" },
    select: {
      id: true,
      establishment: {
        select: {
          id: true,
          commercialName: true,
          vertical: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  let entitlement: Awaited<ReturnType<typeof entitlementFor>>;
  try {
    entitlement = await entitlementFor(tx, userId);
  } catch {
    return {
      status: "CONTRACT_REQUIRED",
      message:
        "Tu plan necesita condiciones y límites autorizados. Contacta con el equipo de Noma.",
      progress: null,
      configuration: null,
      entitlement: null,
      memberships,
      missing: [],
    };
  }
  if (!entitlement) {
    const pilot = application?.manualActivation;
    const status =
      pilot?.state === "SUSPENDED"
        ? "SUSPENDED"
        : pilot?.state === "REVOKED"
          ? "REVOKED"
          : pilot && pilot.expiresAt <= new Date()
            ? "EXPIRED"
            : "PENDING";
    return {
      status,
      message:
        status === "PENDING"
          ? "Tu habilitación comercial está pendiente. Elegir un plan no concede acceso."
          : "Tu piloto no está vigente. Tu configuración se conserva; contacta con Noma para revisar la autorización.",
      progress: application?.onboarding
        ? {
            id: application.onboarding.id,
            step: application.onboarding.step,
            version: application.onboarding.version,
            completedAt: application.onboarding.completedAt,
          }
        : null,
      configuration: null,
      entitlement: null,
      memberships,
      missing: [],
    };
  }
  const record = application?.onboarding;
  let configuration: OnboardingConfiguration | null = null;
  if (record?.establishmentId) {
    const membership = await tx.membership.findFirst({
      where: {
        userId,
        establishmentId: record.establishmentId,
        role: "OWNER",
        status: "ACTIVE",
        establishment: { status: "ACTIVE", vertical: "BEAUTY" },
      },
    });
    if (
      !membership ||
      (entitlement.kind === "MANUAL_PILOT" &&
        entitlement.membershipId !== membership.id) ||
      (entitlement.establishmentId &&
        entitlement.establishmentId !== record.establishmentId)
    )
      return {
        status: "UNAVAILABLE",
        message:
          "El negocio ya no está autorizado para esta configuración. Tus datos se conservan.",
        progress: null,
        configuration: null,
        entitlement: null,
        memberships,
        missing: [],
      };
    configuration = await configurationFor(tx, record.establishmentId);
  }
  return {
    status: record?.completedAt
      ? "COMPLETE"
      : record
        ? "IN_PROGRESS"
        : memberships.length
          ? "EXISTING_MEMBERSHIPS"
          : "WELCOME",
    message: null,
    progress: record ?? null,
    configuration,
    entitlement,
    memberships,
    missing: missingFor(configuration, record?.createdBusiness ?? false),
  };
}
