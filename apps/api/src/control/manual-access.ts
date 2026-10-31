import type { PrismaService } from "../persistence/prisma.service";
export async function manualAccessForUser(
  prisma: PrismaService,
  userId: string,
) {
  return prisma.client.manualActivation.findFirst({
    where: {
      state: "ACTIVE",
      expiresAt: { gt: new Date() },
      application: {
        userId,
        state: "ACTIVATION_PENDING",
        platformReview: { decision: "APPROVED" },
        OR: [
          { subscription: { is: null } },
          { subscription: { state: "ACTIVATION_PENDING" } },
        ],
      },
      OR: [
        { membershipId: null },
        {
          membership: {
            userId,
            status: "ACTIVE",
            role: "OWNER",
            establishment: { status: "ACTIVE" },
          },
        },
      ],
    },
    select: { id: true, membershipId: true, plan: true, expiresAt: true },
  });
}
