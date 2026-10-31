import type { Prisma } from "../generated/prisma/client";
import { digestToken } from "./local-identity.service";

export class LocalAccessSelectionError extends Error {}

export async function existingMembershipId(
  tx: Prisma.TransactionClient,
  selected?: string,
): Promise<string> {
  if (selected !== undefined) {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        selected,
      )
    )
      throw new LocalAccessSelectionError(
        "Indica --membership con un UUID válido.",
      );
    return selected;
  }
  // Count all memberships, including inactive ones: never silently switch accounts.
  const memberships = await tx.membership.findMany({
    select: { id: true },
    take: 2,
  });
  if (!memberships.length)
    throw new LocalAccessSelectionError(
      "No existen membresías. dev:access no crea establecimientos, usuarios ni membresías.",
    );
  if (memberships.length !== 1)
    throw new LocalAccessSelectionError(
      "Hay varias membresías. Usa pnpm dev:access --membership UUID_DE_LA_MEMBRESIA; no se seleccionó ninguna cuenta.",
    );
  return memberships[0]!.id;
}

export async function renewBootstrap(
  tx: Prisma.TransactionClient,
  membershipId: string,
  code: string,
) {
  // Concurrent CLI issuances for one membership must leave only one bootstrap code.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${membershipId}, 0))`;
  const membership = await tx.membership.findUnique({
    where: { id: membershipId },
    include: { establishment: true },
  });
  if (
    !membership ||
    membership.status !== "ACTIVE" ||
    membership.role !== "OWNER" ||
    membership.establishment.status !== "ACTIVE"
  )
    throw new LocalAccessSelectionError(
      "La membresía seleccionada no es un propietario activo de un establecimiento activo.",
    );
  await tx.localCredential.deleteMany({
    where: { membershipId, kind: "BOOTSTRAP" },
  });
  await tx.localCredential.create({
    data: {
      digest: digestToken(code),
      kind: "BOOTSTRAP",
      membershipId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  return membership;
}

export async function renewExistingBootstrap(
  tx: Prisma.TransactionClient,
  code: string,
  selected?: string,
) {
  return renewBootstrap(tx, await existingMembershipId(tx, selected), code);
}
