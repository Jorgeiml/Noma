import type {
  Prisma,
  CommercialSubscription,
} from "../generated/prisma/client";
import { localAccessAllowed } from "../platform/local-policy";
export function subscriptionIsEffective(
  s: CommercialSubscription | null | undefined,
) {
  if (!s || s.state !== "ACTIVE" || !s.activatedAt) return false;
  if (s.evidenceSource === "LOCAL_SYNTHETIC")
    return localAccessAllowed(process.env);
  return s.evidenceSource === "VERIFIED_EXTERNAL" && !!s.evidenceRef;
}
export function manualWhere(userId: string): Prisma.ManualActivationWhereInput {
  return {
    state: "ACTIVE",
    startsAt: { lte: new Date() },
    expiresAt: { gt: new Date() },
    application: {
      userId,
      OR: [
        { subscription: { is: null } },
        { subscription: { state: "ACTIVATION_PENDING" } },
      ],
    },
    AND: [
      {
        OR: [
          { authorizationBasis: "DIRECT_GRANT" },
          {
            application: {
              state: "ACTIVATION_PENDING",
              platformReview: { decision: "APPROVED" },
            },
          },
        ],
      },
      {
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
    ],
  };
}
