import {
  manualWhere,
  subscriptionIsEffective,
} from "../commercial/effective-access";
import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import type { Request, Response } from "express";
import type { Prisma } from "../generated/prisma/client";
import { CommercialService } from "../commercial/commercial.service";
import { commercialCookie, readCookie } from "../commercial/commercial.config";
import { requireOrigin } from "../platform/local-policy";
import { limitsFor } from "../commercial/business-authorization";
export type OnboardingPrincipal = {
  userId: string;
  identityId: string;
  sessionId: string;
  sessionDigest: string;
  name: string;
  selectedMembershipId?: string | null;
};
export type OnboardingRequest = Request & {
  onboardingPrincipal: OnboardingPrincipal;
};
export async function entitlementFor(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const application = await tx.commercialApplication.findUnique({
    where: { userId },
    include: {
      platformReview: true,
      manualActivation: true,
      subscription: true,
    },
  });
  if (!application) return null;
  const pilot = application.manualActivation,
    subscription = application.subscription;
  if (
    pilot &&
    (await tx.manualActivation.findFirst({
      where: { ...manualWhere(userId), id: pilot.id },
    }))
  )
    return {
      applicationId: application.id,
      plan: pilot.plan,
      limits: limitsFor(pilot.plan, pilot),
      kind: "MANUAL_PILOT" as const,
      expiresAt: pilot.expiresAt,
      membershipId: pilot.membershipId,
      establishmentId: null as string | null,
      pilotId: pilot.id,
    };
  if (
    subscriptionIsEffective(subscription) &&
    subscription?.evidenceSource === "VERIFIED_EXTERNAL" &&
    application.platformReview?.decision !== "REJECTED"
  )
    return {
      applicationId: application.id,
      plan: subscription!.plan,
      limits: limitsFor(subscription!.plan),
      kind: "VERIFIED_SUBSCRIPTION" as const,
      expiresAt: null,
      membershipId: null,
      establishmentId: subscription!.establishmentId,
      pilotId: null,
    };
  return null;
}
@Injectable()
export class OnboardingGuard implements CanActivate {
  constructor(private readonly commercial: CommercialService) {}
  async canActivate(host: ExecutionContext) {
    const request = host.switchToHttp().getRequest<OnboardingRequest>();
    host
      .switchToHttp()
      .getResponse<Response>()
      .setHeader("Cache-Control", "no-store");
    if (!["GET", "HEAD"].includes(request.method)) {
      requireOrigin(request.headers.origin);
      if (!request.is("application/json"))
        throw new ForbiddenException(
          "Se requiere una solicitud JSON del origen autorizado.",
        );
    }
    const session = await this.commercial.session(
      readCookie(request.headers.cookie, commercialCookie()),
    );
    if (!session.identity.verifiedAt)
      throw new ForbiddenException(
        "Verifica tu identidad antes de configurar un negocio.",
      );
    await this.commercial.rate(
      "onboarding.requests",
      session.identity.userId,
      300,
    );
    request.onboardingPrincipal = {
      userId: session.identity.userId,
      identityId: session.identityId,
      sessionId: session.id,
      sessionDigest: session.digest,
      name: session.identity.user.displayName,
      selectedMembershipId: session.membershipId,
    };
    return true;
  }
}
