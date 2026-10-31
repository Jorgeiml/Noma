import { ConflictException, ForbiddenException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { PrismaService } from "../persistence/prisma.service";
import { idOf, reasonOf } from "./control.dto";
export async function bootstrapFirstOwner(
  prisma: PrismaService,
  input: {
    userId: string;
    confirmUserId: string;
    reason: string;
    evidence: string;
  },
) {
  const userId = idOf(input.userId),
    confirmed = idOf(input.confirmUserId),
    reason = reasonOf(input.reason),
    evidence = reasonOf(input.evidence);
  if (userId !== confirmed)
    throw new ForbiddenException(
      "La confirmación debe repetir el identificador interno exacto.",
    );
  return prisma.client.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('noma-control-writes',0))`;
    const user = await tx.internalUser.findUnique({
      where: { id: userId },
      include: {
        externalIdentities: { select: { verifiedAt: true, synthetic: true } },
        platformAccess: true,
      },
    });
    if (
      !user ||
      !user.externalIdentities.some(
        (identity) => identity.verifiedAt && !identity.synthetic,
      )
    )
      throw new ForbiddenException(
        "Se requiere un usuario existente con una identidad real vinculada y verificada.",
      );
    const owner = await tx.platformAccess.findFirst({
      where: { role: "PLATFORM_OWNER", revokedAt: null },
    });
    if (owner) {
      if (owner.userId !== userId)
        throw new ConflictException(
          "Ya existe un propietario de plataforma. No se autorizará otro por bootstrap.",
        );
      return { userId, alreadyAuthorized: true };
    }
    if (user.platformAccess)
      throw new ConflictException(
        "El usuario ya tiene un registro de permisos. Su transición exige una revisión explícita fuera del bootstrap.",
      );
    await tx.platformAccess.create({
      data: { userId, role: "PLATFORM_OWNER" },
    });
    const audit = await tx.platformAudit.create({
      data: {
        actorUserId: userId,
        requestId: randomUUID(),
        action: "platformOwner.bootstrapped",
        resourceType: "user",
        resourceId: userId,
        reason,
        outcome: "SUCCESS",
        changes: {
          before: { role: null },
          after: { role: "PLATFORM_OWNER" },
          evidence,
          method: "trusted-local-cli",
        },
      },
    });
    return { userId, alreadyAuthorized: false, auditId: audit.id };
  });
}
