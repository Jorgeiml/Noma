import { subscriptionIsEffective } from "./effective-access";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  HttpException,
} from "@nestjs/common";
import { PrismaService } from "../persistence/prisma.service";
import { digestToken, newToken } from "../platform/local-identity.service";
import { requireCommercialConfig, safeNext } from "./commercial.config";
import {
  OidcProvider,
  type OidcSecrets,
  type VerifiedIdentity,
} from "./oidc.provider";
import { isPlanId } from "./plan.contract";
import { localAccessAllowed } from "../platform/local-policy";
import { manualAccessForUser } from "../control/manual-access";

const tokenValid = (value: string | undefined): value is string =>
  !!value && /^[A-Za-z0-9_-]{43}$/.test(value);
@Injectable()
export class CommercialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: OidcProvider,
  ) {}
  async rate(action: string, key: string, limit: number) {
    const digest = digestToken(`${action}:${key}`);
    const now = new Date();
    const expiry = new Date(Date.now() + 15 * 60_000);
    const rows = await this.prisma.client.$queryRaw<{ hits: number }[]>`
      INSERT INTO "IdentityRateLimit" ("key", "hits", "expiresAt") VALUES (${digest}, 1, ${expiry})
      ON CONFLICT ("key") DO UPDATE SET "hits" = CASE WHEN "IdentityRateLimit"."expiresAt" <= ${now} THEN 1 ELSE "IdentityRateLimit"."hits" + 1 END,
      "expiresAt" = CASE WHEN "IdentityRateLimit"."expiresAt" <= ${now} THEN ${expiry} ELSE "IdentityRateLimit"."expiresAt" END
      RETURNING "hits"`;
    if ((rows[0]?.hits ?? limit + 1) > limit)
      throw new HttpException("Demasiados intentos. Intenta más tarde.", 429);
  }
  private seal(data: OidcSecrets) {
    const iv = randomBytes(12);
    const cipher = createCipheriv(
      "aes-256-gcm",
      requireCommercialConfig().key,
      iv,
    );
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(data), "utf8"),
      cipher.final(),
    ]);
    return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString(
      "base64url",
    );
  }
  private unseal(value: string): OidcSecrets {
    const buffer = Buffer.from(value, "base64url");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      requireCommercialConfig().key,
      buffer.subarray(0, 12),
    );
    decipher.setAuthTag(buffer.subarray(12, 28));
    return JSON.parse(
      Buffer.concat([
        decipher.update(buffer.subarray(28)),
        decipher.final(),
      ]).toString("utf8"),
    ) as OidcSecrets;
  }
  async begin(
    mode: "login" | "signup" | "recover",
    next: unknown,
    email?: string,
    previousBrowser?: string,
  ) {
    requireCommercialConfig();
    const state = newToken(),
      browser = newToken();
    const secrets = {
      verifier: newToken(),
      nonce: newToken(),
      next: safeNext(next),
    };
    const url = await this.provider.begin(mode, state, secrets, email);
    await this.prisma.client.$transaction(async (tx) => {
      await tx.oidcAttempt.deleteMany({
        where: {
          OR: [
            { expiresAt: { lte: new Date() } },
            ...(tokenValid(previousBrowser)
              ? [{ browserDigest: digestToken(previousBrowser) }]
              : []),
          ],
        },
      });
      await tx.oidcAttempt.create({
        data: {
          stateDigest: digestToken(state),
          browserDigest: digestToken(browser),
          encryptedPayload: this.seal(secrets),
          expiresAt: new Date(Date.now() + 600_000),
        },
      });
    });
    return { url, browser };
  }
  async callback(url: URL, browser: string | undefined, oldSession?: string) {
    const state = url.searchParams.get("state");
    if (
      !state ||
      !tokenValid(state) ||
      !tokenValid(browser) ||
      url.searchParams.getAll("state").length !== 1
    )
      throw new UnauthorizedException("Retorno de identidad no autorizado.");
    const attempt = await this.prisma.client.oidcAttempt.findUnique({
      where: { stateDigest: digestToken(state) },
    });
    if (
      !attempt ||
      attempt.expiresAt <= new Date() ||
      attempt.browserDigest !== digestToken(browser)
    )
      throw new UnauthorizedException("Retorno vencido o no autorizado.");
    const consumed = await this.prisma.client.oidcAttempt.deleteMany({
      where: {
        stateDigest: attempt.stateDigest,
        browserDigest: attempt.browserDigest,
        expiresAt: { gt: new Date() },
      },
    });
    if (consumed.count !== 1)
      throw new UnauthorizedException("Retorno ya utilizado.");
    const secrets = this.unseal(attempt.encryptedPayload);
    const identity = await this.provider.exchange(url, state, secrets);
    const token = await this.createSession(identity, oldSession);
    return {
      token,
      next: identity.verified ? "/activacion" : "/verificar-correo",
      returnTo: secrets.next,
    };
  }
  async createSession(claims: VerifiedIdentity, oldSession?: string) {
    if (
      claims.issuer !== requireCommercialConfig().issuer ||
      claims.expiresAt <= new Date()
    )
      throw new UnauthorizedException("Identidad vencida.");
    const token = newToken();
    // Unique issuer+subject and the nested transaction prevent duplicate/orphan accounts under concurrent callbacks.
    for (let attempt = 0; ; attempt++) {
      try {
        await this.prisma.client.$transaction(async (tx) => {
          let identity = await tx.externalIdentity.findUnique({
            where: {
              issuer_subject: {
                issuer: claims.issuer,
                subject: claims.subject,
              },
            },
          });
          if (!identity)
            identity = await tx.externalIdentity.create({
              data: {
                issuer: claims.issuer,
                subject: claims.subject,
                email: claims.email,
                verifiedAt: claims.verified ? new Date() : null,
                user: { create: { displayName: "Cuenta Noma" } },
              },
            });
          else {
            if (identity.synthetic)
              throw new UnauthorizedException(
                "Identidad sintética no válida para OIDC.",
              );
            identity = await tx.externalIdentity.update({
              where: { id: identity.id },
              data: {
                email: claims.email,
                verifiedAt: claims.verified ? new Date() : null,
              },
            });
          }
          await tx.commercialApplication.upsert({
            where: { userId: identity.userId },
            create: {
              userId: identity.userId,
              state: claims.verified
                ? "IDENTITY_VERIFIED"
                : "REGISTRATION_STARTED",
            },
            update: !claims.verified
              ? { state: "REGISTRATION_STARTED", selectedPlan: null }
              : {},
          });
          if (claims.verified)
            await tx.commercialApplication.updateMany({
              where: { userId: identity.userId, state: "REGISTRATION_STARTED" },
              data: { state: "IDENTITY_VERIFIED" },
            });
          if (tokenValid(oldSession))
            await tx.commercialSession.deleteMany({
              where: { digest: digestToken(oldSession) },
            });
          await tx.commercialSession.create({
            data: {
              identityId: identity.id,
              digest: digestToken(token),
              expiresAt: new Date(
                Math.min(claims.expiresAt.getTime(), Date.now() + 8 * 3600_000),
              ),
            },
          });
        });
        break;
      } catch (error) {
        if (
          attempt < 2 &&
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "P2002"
        )
          continue;
        throw error;
      }
    }
    return token;
  }
  async session(token: string | undefined) {
    requireCommercialConfig();
    if (!tokenValid(token))
      throw new UnauthorizedException(
        "Sesión comercial vencida o no autorizada.",
      );
    const session = await this.prisma.client.commercialSession.findUnique({
      where: { digest: digestToken(token) },
      include: {
        identity: {
          include: { user: { include: { commercialApplication: true } } },
        },
      },
    });
    if (
      !session ||
      session.expiresAt <= new Date() ||
      session.lastSeenAt.getTime() <= Date.now() - 30 * 60_000 ||
      (session.identity.synthetic && !localAccessAllowed(process.env))
    )
      throw new UnauthorizedException(
        "Sesión comercial vencida o no autorizada.",
      );
    await this.prisma.client.commercialSession.updateMany({
      where: { id: session.id, expiresAt: { gt: new Date() } },
      data: { lastSeenAt: new Date() },
    });
    return session;
  }
  async account(token: string | undefined) {
    const session = await this.session(token);
    const manual = session.identity.verifiedAt
      ? await manualAccessForUser(this.prisma, session.identity.userId)
      : null;
    const authorization = session.identity.verifiedAt
      ? await this.prisma.client.commercialApplication.findUnique({
          where: { userId: session.identity.userId },
          select: {
            platformReview: { select: { decision: true } },
            manualActivation: {
              select: {
                id: true,
                state: true,
                plan: true,
                expiresAt: true,
                startsAt: true,
                mode: true,
                membershipId: true,
              },
            },
          },
        })
      : null;
    const pilot = authorization?.manualActivation;
    const pilotSummary = pilot
      ? {
          kind: "MANUAL_PILOT" as const,
          source: "MANUAL" as const,
          mode: pilot.mode,
          startsAt: pilot.startsAt,
          state:
            pilot.state === "ACTIVE" && pilot.expiresAt <= new Date()
              ? "EXPIRED"
              : pilot.state === "ACTIVE" && pilot.startsAt > new Date()
                ? "SCHEDULED"
                : pilot.state,
          plan: pilot.plan,
          expiresAt: pilot.expiresAt,
          accessAuthorized: manual?.id === pilot.id,
          onboardingAuthorized:
            manual?.id === pilot.id && pilot.membershipId === null,
        }
      : null;
    const memberships = session.identity.verifiedAt
      ? await this.prisma.client.membership.findMany({
          where: {
            userId: session.identity.userId,
            status: "ACTIVE",
            role: "OWNER",
          },
          select: {
            id: true,
            establishment: {
              select: {
                commercialName: true,
                status: true,
                commercialSubscription: true,
              },
            },
          },
        })
      : [];
    return {
      user: {
        id: session.identity.userId,
        email: session.identity.email,
        verified: !!session.identity.verifiedAt,
      },
      application: session.identity.user.commercialApplication && {
        state: session.identity.user.commercialApplication.state,
        selectedPlan: session.identity.user.commercialApplication.selectedPlan,
        review: authorization?.platformReview?.decision ?? null,
      },
      memberships: memberships.map((m) => ({
        id: m.id,
        name: m.establishment.commercialName,
        establishmentStatus: m.establishment.status,
        subscriptionState:
          manual?.membershipId === m.id
            ? "ACTIVE"
            : m.establishment.commercialSubscription?.state === "ACTIVE" &&
                !subscriptionIsEffective(m.establishment.commercialSubscription)
              ? "SUSPENDED"
              : (m.establishment.commercialSubscription?.state ??
                "ACTIVATION_PENDING"),
        manualActivation:
          pilot?.membershipId === m.id &&
          (!m.establishment.commercialSubscription ||
            m.establishment.commercialSubscription.state ===
              "ACTIVATION_PENDING")
            ? pilotSummary
            : null,
      })),
      selectedMembershipId: session.membershipId,
      manualActivation: pilotSummary,
    };
  }
  async owner(token: string | undefined) {
    const session = await this.session(token);
    if (!session.identity.verifiedAt || !session.membershipId)
      throw new ForbiddenException(
        "Acceso comercial: verifica tu identidad y selecciona un establecimiento en activación.",
      );
    const member = await this.authorizedMembership(
      session.identity.userId,
      session.membershipId,
    );
    return {
      userId: session.identity.userId,
      displayName: session.identity.user.displayName,
      establishmentId: member.establishmentId,
      membershipId: member.id,
      currency: member.establishment.currency,
      vertical: member.establishment.vertical,
      role: "OWNER" as const,
      identityMode: "commercial" as const,
    };
  }
  private async authorizedMembership(userId: string, membershipId: string) {
    const member = await this.prisma.client.membership.findFirst({
      where: {
        id: membershipId,
        userId,
        status: "ACTIVE",
        role: "OWNER",
        establishment: { status: "ACTIVE" },
      },
      include: { establishment: { include: { commercialSubscription: true } } },
    });
    const subscription = member?.establishment.commercialSubscription;
    const existingAccess = !!member && subscriptionIsEffective(subscription);
    const manual =
      member && !existingAccess
        ? await manualAccessForUser(this.prisma, userId)
        : null;
    if (!member || (!existingAccess && manual?.membershipId !== membershipId))
      throw new ForbiddenException(
        "Acceso comercial: membresía o activación no autorizada.",
      );
    return member;
  }
  async selectMembership(token: string | undefined, membershipId: string) {
    const session = await this.session(token);
    if (!session.identity.verifiedAt)
      throw new ForbiddenException("Verifica tu identidad.");
    await this.authorizedMembership(session.identity.userId, membershipId);
    // Rotate the opaque session when changing tenant; concurrent requests with the old token lose access.
    const next = newToken();
    const changed = await this.prisma.client.commercialSession.updateMany({
      where: { id: session.id, digest: session.digest },
      data: { membershipId, digest: digestToken(next) },
    });
    if (changed.count !== 1)
      throw new UnauthorizedException(
        "La sesión cambió. Inicia sesión otra vez.",
      );
    return next;
  }
  async selectPlan(token: string | undefined, plan: unknown) {
    if (!isPlanId(plan)) throw new BadRequestException("Plan no válido.");
    const session = await this.session(token);
    if (!session.identity.verifiedAt)
      throw new ForbiddenException(
        "Verifica tu identidad antes de seleccionar una propuesta.",
      );
    const changed = await this.prisma.client.commercialApplication.updateMany({
      where: {
        userId: session.identity.userId,
        state: { in: ["IDENTITY_VERIFIED", "PLAN_SELECTED"] },
        subscription: { is: null },
      },
      data: { selectedPlan: plan, state: "PLAN_SELECTED" },
    });
    if (changed.count !== 1)
      throw new ForbiddenException("La solicitud ya no admite ese cambio.");
  }
  async requestActivation(token: string | undefined) {
    const session = await this.session(token);
    if (!session.identity.verifiedAt)
      throw new ForbiddenException("Verifica tu identidad.");
    const changed = await this.prisma.client.commercialApplication.updateMany({
      where: {
        userId: session.identity.userId,
        state: "PLAN_SELECTED",
        selectedPlan: { not: null },
      },
      data: { state: "ACTIVATION_PENDING" },
    });
    if (changed.count !== 1)
      throw new BadRequestException(
        "Primero selecciona una propuesta de plan.",
      );
  }
  async resend(token: string | undefined) {
    const session = await this.session(token);
    await this.rate("resend", session.identityId, 3);
    if (!session.identity.verifiedAt && !session.identity.synthetic)
      await this.provider.resend(session.identity.subject);
  }
  async revoke(token: string | undefined) {
    if (tokenValid(token))
      await this.prisma.client.commercialSession.deleteMany({
        where: { digest: digestToken(token) },
      });
  }
  async cancelAttempt(browser: string | undefined) {
    if (tokenValid(browser))
      await this.prisma.client.oidcAttempt.deleteMany({
        where: { browserDigest: digestToken(browser) },
      });
  }
}
