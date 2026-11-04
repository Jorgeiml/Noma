import { manualWhere } from "../commercial/effective-access";
import type { PrismaService } from "../persistence/prisma.service";
export async function manualAccessForUser(
  prisma: PrismaService,
  userId: string,
) {
  return prisma.client.manualActivation.findFirst({
    where: manualWhere(userId),
    select: {
      id: true,
      membershipId: true,
      plan: true,
      expiresAt: true,
      mode: true,
      startsAt: true,
    },
  });
}
