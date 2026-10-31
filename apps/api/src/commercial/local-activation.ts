import { randomUUID } from "node:crypto";
import { PrismaService } from "../persistence/prisma.service";
import { requireLocalAccess } from "../platform/local-policy";
import { isPlanId } from "./plan.contract";

export const syntheticIssuer = "https://synthetic.noma.invalid/";
export async function assertLocalCommercialDatabase(prisma: PrismaService) {
  requireLocalAccess();
  const identity = await prisma.client.$queryRaw<
    { database: string; username: string }[]
  >`SELECT current_database() AS database, current_user AS username`;
  if (
    identity[0]?.database !== "beauty_wellness_dev" ||
    identity[0]?.username !== "bw_local"
  )
    throw new Error(
      "Activación sintética requiere la base y usuario locales de desarrollo.",
    );
}
export async function createSyntheticApplication(
  prisma: PrismaService,
  plan: unknown,
) {
  await assertLocalCommercialDatabase(prisma);
  if (!isPlanId(plan))
    throw new Error(
      "Selecciona explícitamente START, GROW, SCALE o ENTERPRISE.",
    );
  return prisma.client.$transaction(async (tx) => {
    const fixture = randomUUID();
    const identity = await tx.externalIdentity.create({
      data: {
        issuer: syntheticIssuer,
        subject: fixture,
        email: `fixture-${fixture}@example.test`,
        synthetic: true,
        verifiedAt: new Date(),
        user: { create: { displayName: "Persona sintética Noma" } },
      },
    });
    const establishment = await tx.establishment.create({
      data: {
        commercialName: `Sintético Noma ${fixture.slice(0, 8)}`,
        vertical: "BEAUTY",
        verticalConfiguredAt: new Date(),
        verticalConfigurationReason:
          "Fixture sintética explícita de identidad comercial local.",
      },
    });
    const membership = await tx.membership.create({
      data: {
        userId: identity.userId,
        establishmentId: establishment.id,
        role: "OWNER",
      },
    });
    const application = await tx.commercialApplication.create({
      data: {
        userId: identity.userId,
        state: "ACTIVATION_PENDING",
        selectedPlan: plan,
      },
    });
    return { applicationId: application.id, membershipId: membership.id };
  });
}
export async function activateSyntheticApplication(
  prisma: PrismaService,
  applicationId: string,
  membershipId: string,
) {
  await assertLocalCommercialDatabase(prisma);
  return prisma.client.$transaction(async (tx) => {
    const application = await tx.commercialApplication.findUnique({
      where: { id: applicationId },
      include: { user: { include: { externalIdentities: true } } },
    });
    const membership = await tx.membership.findUnique({
      where: { id: membershipId },
      include: { establishment: true },
    });
    if (
      !application ||
      application.state !== "ACTIVATION_PENDING" ||
      !application.selectedPlan ||
      !application.user.externalIdentities.some(
        (i) => i.synthetic && i.issuer === syntheticIssuer && i.verifiedAt,
      ) ||
      !membership ||
      membership.userId !== application.userId ||
      membership.role !== "OWNER" ||
      membership.status !== "ACTIVE" ||
      membership.establishment.status !== "ACTIVE" ||
      !membership.establishment.commercialName.startsWith("Sintético Noma ")
    )
      throw new Error(
        "Solo se pueden activar fixtures sintéticas explícitas, con su propia membresía. No se modificaron datos.",
      );
    const existing = await tx.commercialSubscription.findUnique({
      where: { establishmentId: membership.establishmentId },
    });
    if (existing) {
      if (
        existing.applicationId === application.id &&
        existing.evidenceSource === "LOCAL_SYNTHETIC" &&
        existing.state === "ACTIVE" &&
        existing.plan === application.selectedPlan
      )
        return existing.id;
      throw new Error(
        "La fixture ya tiene un estado comercial; no se sustituye ni reactiva automáticamente.",
      );
    }
    const subscription = await tx.commercialSubscription.create({
      data: {
        applicationId: application.id,
        establishmentId: membership.establishmentId,
        plan: application.selectedPlan,
        state: "ACTIVE",
        evidenceSource: "LOCAL_SYNTHETIC",
        activatedAt: new Date(),
      },
    });
    return subscription.id;
  });
}
