import { randomUUID } from "node:crypto";
import { PrismaService } from "../src/persistence/prisma.service";
import { digestToken, newToken } from "../src/platform/local-identity.service";
import { assertTestDatabaseUrl } from "./test-database";
export const CONTROL_TEST_ISSUER = "https://control-fixture.example.test/";
export async function assertControlTestDatabase(prisma: PrismaService) {
  assertTestDatabaseUrl(process.env.DATABASE_URL);
  const rows = await prisma.client.$queryRaw<
    { database: string; username: string }[]
  >`SELECT current_database() AS database,current_user AS username`;
  if (
    rows[0]?.database !== "beauty_wellness_test" ||
    rows[0]?.username !== "bw_test"
  )
    throw new Error("Control fixtures require the isolated test database.");
}
export async function createControlFixture(prisma: PrismaService) {
  await assertControlTestDatabase(prisma);
  const tag = "CONTROL TEST " + randomUUID().slice(0, 8);
  const users = Array.from({ length: 13 }, () => randomUUID()),
    identities = users.map(() => randomUUID()),
    applications = users.map(() => randomUUID()),
    tokens = users.map(() => newToken()),
    sessions = users.map(() => randomUUID());
  const tenants = [randomUUID(), randomUUID()],
    memberships = [randomUUID(), randomUUID()];
  const subjectPrefix = randomUUID();
  await prisma.client.$transaction(async (tx) => {
    for (let index = 0; index < users.length; index++) {
      await tx.internalUser.create({
        data: { id: users[index]!, displayName: `${tag} usuario ${index}` },
      });
      await tx.externalIdentity.create({
        data: {
          id: identities[index]!,
          userId: users[index]!,
          issuer: CONTROL_TEST_ISSUER,
          subject: subjectPrefix + "-" + index,
          email:
            index === 6
              ? `${subjectPrefix}-0@example.test`
              : `${subjectPrefix}-${index}@example.test`,
          verifiedAt: index === 5 ? null : new Date(),
          synthetic: false,
        },
      });
      await tx.commercialSession.create({
        data: {
          id: sessions[index]!,
          identityId: identities[index]!,
          digest: digestToken(tokens[index]!),
          expiresAt: new Date(Date.now() + 8 * 3600000),
        },
      });
      await tx.commercialApplication.create({
        data: {
          id: applications[index]!,
          userId: users[index]!,
          state: index === 5 ? "REGISTRATION_STARTED" : "ACTIVATION_PENDING",
          selectedPlan: "START",
        },
      });
      const role = (
        {
          1: "PLATFORM_ADMIN",
          2: "BILLING_MANAGER",
          3: "SUPPORT_AGENT",
        } as const
      )[index as 1 | 2 | 3];
      if (role)
        await tx.platformAccess.create({
          data: { userId: users[index]!, role },
        });
    }
    for (let index = 0; index < tenants.length; index++) {
      const userIndex = index === 0 ? 4 : 7;
      await tx.establishment.create({
        data: {
          id: tenants[index]!,
          commercialName: `${tag} negocio ${index}`,
          vertical: "BEAUTY",
          businessPhone: "PRIVATE-CONTACT",
        },
      });
      await tx.membership.create({
        data: {
          id: memberships[index]!,
          establishmentId: tenants[index]!,
          userId: users[userIndex]!,
          role: "OWNER",
        },
      });
      await tx.branch.create({
        data: {
          establishmentId: tenants[index]!,
          name: `${tag} sucursal ${index}`,
          address: "PRIVATE-ADDRESS",
          timeZone: "America/Guayaquil",
        },
      });
      await tx.serviceOffering.create({
        data: {
          establishmentId: tenants[index]!,
          name: "PRIVATE-SERVICE",
          description: "PRIVATE-DESCRIPTION",
          durationMinutes: 30,
          priceMode: "FIXED",
          priceMin: "9.50",
          currency: "USD",
        },
      });
      await tx.professional.create({
        data: {
          establishmentId: tenants[index]!,
          displayName: "PRIVATE-PROFESSIONAL",
        },
      });
    }
    await tx.commercialSession.update({
      where: { id: sessions[4]! },
      data: { membershipId: memberships[0]! },
    });
    await tx.commercialSubscription.create({
      data: {
        applicationId: applications[4]!,
        establishmentId: tenants[0]!,
        plan: "START",
        state: "ACTIVE",
        evidenceSource: "VERIFIED_EXTERNAL",
        evidenceRef: "CONTROL TEST external evidence",
        activatedAt: new Date(),
      },
    });
  });
  return {
    tag,
    users,
    identities,
    applications,
    tokens,
    sessions,
    tenants,
    memberships,
    subjectPrefix,
  };
}
export type ControlFixture = Awaited<ReturnType<typeof createControlFixture>>;
export async function cleanControlFixture(
  prisma: PrismaService,
  fixture: ControlFixture,
) {
  await assertControlTestDatabase(prisma);
  const tenantWhere = { establishmentId: { in: fixture.tenants } };
  await prisma.client.$transaction(async (tx) => {
    await tx.platformAudit.deleteMany({
      where: { actorUserId: { in: fixture.users } },
    });
    await tx.manualActivation.deleteMany({
      where: { applicationId: { in: fixture.applications } },
    });
    await tx.applicationReview.deleteMany({
      where: { applicationId: { in: fixture.applications } },
    });
    await tx.platformAccess.deleteMany({
      where: { userId: { in: fixture.users } },
    });
    await tx.serviceResourceRequirement.deleteMany({ where: tenantWhere });
    await tx.serviceResourceSet.deleteMany({ where: tenantWhere });
    await tx.scheduleException.deleteMany({ where: tenantWhere });
    await tx.workSchedule.deleteMany({ where: tenantWhere });
    await tx.professionalBranch.deleteMany({ where: tenantWhere });
    await tx.professionalService.deleteMany({ where: tenantWhere });
    await tx.physicalResource.deleteMany({ where: tenantWhere });
    await tx.professional.deleteMany({ where: tenantWhere });
    await tx.branch.deleteMany({ where: tenantWhere });
    await tx.serviceOffering.deleteMany({ where: tenantWhere });
    await tx.commercialSubscription.deleteMany({
      where: { applicationId: { in: fixture.applications } },
    });
    await tx.commercialSession.deleteMany({
      where: { identityId: { in: fixture.identities } },
    });
    await tx.localCredential.deleteMany({
      where: { membership: { userId: { in: fixture.users } } },
    });
    await tx.membership.deleteMany({
      where: { userId: { in: fixture.users } },
    });
    await tx.externalIdentity.deleteMany({
      where: { id: { in: fixture.identities } },
    });
    await tx.commercialApplication.deleteMany({
      where: { id: { in: fixture.applications } },
    });
    await tx.internalUser.deleteMany({ where: { id: { in: fixture.users } } });
    await tx.establishment.deleteMany({
      where: { id: { in: fixture.tenants } },
    });
    await tx.identityRateLimit.deleteMany({
      where: {
        key: {
          in: fixture.users.map((id) => digestToken(`control.requests:${id}`)),
        },
      },
    });
  });
}
