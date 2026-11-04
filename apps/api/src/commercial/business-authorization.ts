import { ForbiddenException, ConflictException } from "@nestjs/common";
import type { Prisma, CommercialPlan } from "../generated/prisma/client";
import type { OwnerContext } from "../platform/local.guard";
import { COMMERCIAL_PLANS } from "./plan.contract";
import { manualWhere, subscriptionIsEffective } from "./effective-access";
import type { ManualActivation } from "../generated/prisma/client";
export function limitsFor(
  plan: CommercialPlan,
  grant?: Pick<
    ManualActivation,
    "branchLimit" | "professionalLimit" | "userLimit"
  >,
) {
  if (
    plan === "ENTERPRISE" &&
    grant?.branchLimit &&
    grant.professionalLimit &&
    grant.userLimit
  )
    return {
      branches: grant.branchLimit,
      professionals: grant.professionalLimit,
      users: grant.userLimit,
    };
  const contract = COMMERCIAL_PLANS.find((value) => value.id === plan);
  if (!contract)
    throw new ForbiddenException(
      "Enterprise requiere condiciones y límites autorizados antes de configurar el negocio.",
    );
  return {
    branches: contract.branches,
    professionals: contract.people,
    users: contract.users,
  };
}
export async function businessAuthorization(
  tx: Prisma.TransactionClient,
  owner: OwnerContext,
) {
  if (owner.identityMode !== "commercial") return null;
  const subscription = await tx.commercialSubscription.findUnique({
    where: { establishmentId: owner.establishmentId },
  });
  if (subscriptionIsEffective(subscription))
    return { plan: subscription!.plan, limits: limitsFor(subscription!.plan) };
  const pilot = await tx.manualActivation.findFirst({
    where: {
      ...manualWhere(owner.userId),
      membershipId: owner.membershipId,
      membership: {
        userId: owner.userId,
        status: "ACTIVE",
        role: "OWNER",
        establishmentId: owner.establishmentId,
        establishment: { status: "ACTIVE" },
      },
    },
  });
  if (!pilot)
    throw new ForbiddenException(
      "La autorización comercial venció, está suspendida o no corresponde a este negocio. Tus datos se conservan.",
    );
  return { plan: pilot.plan, limits: limitsFor(pilot.plan, pilot) };
}
export async function assertBusinessLimit(
  tx: Prisma.TransactionClient,
  owner: OwnerContext,
  kind: "branches" | "professionals",
) {
  const authorization = await businessAuthorization(tx, owner);
  if (!authorization) return;
  const where = { establishmentId: owner.establishmentId };
  const count =
    kind === "branches"
      ? await tx.branch.count({ where })
      : await tx.professional.count({ where });
  if (count >= authorization.limits[kind])
    throw new ConflictException(
      `Tu autorización ${authorization.plan} admite ${authorization.limits[kind]} ${kind === "branches" ? "sucursal(es)" : "profesional(es)"} registrados. Revisa el plan antes de añadir otro.`,
    );
}
