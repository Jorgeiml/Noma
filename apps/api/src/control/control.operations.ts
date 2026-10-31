import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { createHash } from "node:crypto";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../persistence/prisma.service";
import type { ControlPermission } from "./control.contract";
import {
  assertPermission,
  assertStrongAuthentication,
  type ControlPrincipal,
} from "./control.policy";
import type {
  activationOf,
  activationChangeOf,
  decisionOf,
  roleOf,
} from "./control.dto";
type Tx = Prisma.TransactionClient;
type Command = { requestId: string; confirmId: string; reason: string };
type Change = { before: Prisma.InputJsonValue; after: Prisma.InputJsonValue };
@Injectable()
export class ControlOperations {
  constructor(private readonly prisma: PrismaService) {}
  private async write(
    principal: ControlPrincipal,
    permission: ControlPermission,
    action: string,
    resourceType: string,
    id: string,
    input: Command,
    change: (tx: Tx) => Promise<Change>,
  ) {
    if (input.confirmId !== id)
      throw new BadRequestException(
        "Confirma el identificador exacto del registro afectado.",
      );
    assertStrongAuthentication(principal);
    const inputHash = createHash("sha256")
      .update(JSON.stringify({ action, resourceType, id, input }))
      .digest("hex");
    return this.prisma.client.$transaction(async (tx) => {
      // One low-volume administrative write lock serializes revocations, role changes and decisions.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('noma-control-writes',0))`;
      const session = await tx.commercialSession.findFirst({
        where: {
          id: principal.sessionId,
          digest: principal.sessionDigest,
          identityId: principal.identityId,
          expiresAt: { gt: new Date() },
          lastSeenAt: { gt: new Date(Date.now() - 30 * 60_000) },
          identity: { userId: principal.userId, verifiedAt: { not: null } },
        },
      });
      if (!session)
        throw new ForbiddenException(
          "La sesión administrativa dejó de estar autorizada.",
        );
      const access = await tx.platformAccess.findUnique({
        where: { userId: principal.userId },
      });
      assertPermission(
        access && !access.revokedAt ? access.role : undefined,
        permission,
      );
      const replay = await tx.platformAudit.findUnique({
        where: {
          actorUserId_requestId: {
            actorUserId: principal.userId,
            requestId: input.requestId,
          },
        },
      });
      if (replay) {
        if (replay.inputHash !== inputHash || replay.outcome !== "SUCCESS")
          throw new ConflictException(
            "Este identificador de operación ya fue utilizado con otros datos.",
          );
        return { auditId: replay.id, replayed: true };
      }
      const changes = await change(tx);
      const event = await tx.platformAudit.create({
        data: {
          actorUserId: principal.userId,
          requestId: input.requestId,
          action,
          resourceType,
          resourceId: id,
          reason: input.reason,
          outcome: "SUCCESS",
          inputHash,
          changes,
        },
      });
      return { auditId: event.id, replayed: false };
    });
  }
  private async application(tx: Tx, id: string, principal: ControlPrincipal) {
    const app = await tx.commercialApplication.findUnique({
      where: { id },
      include: {
        platformReview: true,
        subscription: true,
        user: {
          select: {
            externalIdentities: {
              select: { verifiedAt: true, synthetic: true },
            },
          },
        },
      },
    });
    if (!app) throw new NotFoundException("Solicitud no disponible.");
    if (app.userId === principal.userId)
      throw new ForbiddenException(
        "No puedes aprobar ni activar tu propia cuenta.",
      );
    return app;
  }
  decide(
    principal: ControlPrincipal,
    id: string,
    input: ReturnType<typeof decisionOf>,
  ) {
    return this.write(
      principal,
      "applications.decide",
      "application." + input.decision.toLowerCase(),
      "application",
      id,
      input,
      async (tx) => {
        const app = await this.application(tx, id, principal);
        if (
          app.state !== "ACTIVATION_PENDING" ||
          app.platformReview ||
          input.version !== 0 ||
          app.subscription?.state === "ACTIVE"
        )
          throw new ConflictException(
            "Esta solicitud ya fue decidida o no está pendiente de revisión.",
          );
        if (
          input.decision === "APPROVED" &&
          !app.user.externalIdentities.some(
            (identity) =>
              identity.verifiedAt &&
              (!identity.synthetic || principal.localDevelopment),
          )
        )
          throw new ConflictException(
            "La identidad vinculada todavía no está verificada.",
          );
        await tx.applicationReview.create({
          data: {
            applicationId: id,
            decision: input.decision,
            actorUserId: principal.userId,
            reason: input.reason,
          },
        });
        return {
          before: { decision: "PENDING", applicationState: app.state },
          after: {
            decision: input.decision,
            applicationState: app.state,
            paymentCreated: false,
            businessCreated: false,
          },
        };
      },
    );
  }
  activate(
    principal: ControlPrincipal,
    id: string,
    input: ReturnType<typeof activationOf>,
  ) {
    return this.write(
      principal,
      "subscriptions.manage",
      "manualActivation.created",
      "manualActivation",
      id,
      input,
      async (tx) => {
        const app = await this.application(tx, id, principal);
        if (
          app.state !== "ACTIVATION_PENDING" ||
          app.platformReview?.decision !== "APPROVED" ||
          !app.selectedPlan
        )
          throw new ConflictException(
            "Primero aprueba una solicitud verificada con preferencia de plan.",
          );
        if (
          !app.user.externalIdentities.some(
            (x) => x.verifiedAt && (!x.synthetic || principal.localDevelopment),
          )
        )
          throw new ConflictException(
            "La identidad vinculada no está verificada.",
          );
        if (app.subscription && app.subscription.state !== "ACTIVATION_PENDING")
          throw new ConflictException(
            "No se puede sustituir ni eludir una suscripción comercial existente mediante un piloto.",
          );
        const expiresAt = new Date(input.expiresAt),
          now = new Date();
        if (
          expiresAt <= now ||
          expiresAt.getTime() > now.getTime() + 90 * 24 * 60 * 60_000
        )
          throw new BadRequestException(
            "El piloto debe vencer en el futuro, como máximo dentro de 90 días.",
          );
        if (
          await tx.manualActivation.findUnique({ where: { applicationId: id } })
        )
          throw new ConflictException(
            "Esta solicitud ya tiene un piloto registrado. Revisa su historial.",
          );
        if (input.membershipId) {
          const member = await tx.membership.findFirst({
            where: {
              id: input.membershipId,
              userId: app.userId,
              status: "ACTIVE",
              role: "OWNER",
              establishment: { status: "ACTIVE" },
            },
          });
          if (!member)
            throw new NotFoundException(
              "La membresía no pertenece al solicitante o no está activa.",
            );
          if (
            app.subscription &&
            app.subscription.establishmentId !== member.establishmentId
          )
            throw new ConflictException(
              "La solicitud ya está asociada a otro negocio.",
            );
          const existing = await tx.commercialSubscription.findUnique({
            where: { establishmentId: member.establishmentId },
          });
          if (
            existing &&
            (existing.applicationId !== id ||
              existing.state !== "ACTIVATION_PENDING")
          )
            throw new ConflictException(
              "Ese negocio ya tiene otra relación comercial. No puede reemplazarse con un piloto.",
            );
        }
        const activation = await tx.manualActivation.create({
          data: {
            applicationId: id,
            membershipId: input.membershipId,
            plan: input.plan,
            expiresAt,
            actorUserId: principal.userId,
            reason: input.reason,
            createdAt: now,
          },
        });
        return {
          before: { manualActivation: null },
          after: {
            id: activation.id,
            kind: "MANUAL_PILOT",
            state: activation.state,
            plan: activation.plan,
            membershipId: activation.membershipId,
            expiresAt: activation.expiresAt.toISOString(),
            paymentCreated: false,
            onboardingAuthorized: !activation.membershipId,
          },
        };
      },
    );
  }
  changeActivation(
    principal: ControlPrincipal,
    id: string,
    input: ReturnType<typeof activationChangeOf>,
  ) {
    return this.write(
      principal,
      "subscriptions.manage",
      "manualActivation." + input.action.toLowerCase(),
      "manualActivation",
      id,
      input,
      async (tx) => {
        const app = await this.application(tx, id, principal);
        const value = await tx.manualActivation.findUnique({
          where: { applicationId: id },
        });
        if (!value) throw new NotFoundException("Piloto no disponible.");
        if (value.version !== input.version)
          throw new ConflictException(
            "El piloto cambió. Carga sus datos actuales antes de continuar.",
          );
        if (value.state === "REVOKED")
          throw new ConflictException(
            "Un piloto finalizado no puede reactivarse ni modificarse.",
          );
        if (
          input.action !== "REVOKE" &&
          (value.expiresAt <= new Date() ||
            app.platformReview?.decision !== "APPROVED" ||
            (app.subscription &&
              app.subscription.state !== "ACTIVATION_PENDING"))
        )
          throw new ConflictException(
            "Este piloto venció o su relación comercial ya no admite cambios.",
          );
        if (
          (input.action === "SUSPEND" && value.state !== "ACTIVE") ||
          (input.action === "RESUME" && value.state !== "SUSPENDED")
        )
          throw new ConflictException(
            "La transición solicitada no corresponde al estado actual.",
          );
        if (input.action === "CHANGE_PLAN" && input.plan === value.plan)
          throw new ConflictException("Ese ya es el plan del piloto.");
        const next = await tx.manualActivation.update({
          where: { id: value.id },
          data: {
            state:
              input.action === "SUSPEND"
                ? "SUSPENDED"
                : input.action === "REVOKE"
                  ? "REVOKED"
                  : input.action === "RESUME"
                    ? "ACTIVE"
                    : value.state,
            ...(input.action === "CHANGE_PLAN" ? { plan: input.plan } : {}),
            version: { increment: 1 },
            reason: input.reason,
            actorUserId: principal.userId,
          },
        });
        return {
          before: {
            state: value.state,
            plan: value.plan,
            expiresAt: value.expiresAt.toISOString(),
          },
          after: {
            state: next.state,
            plan: next.plan,
            expiresAt: next.expiresAt.toISOString(),
            paymentCreated: false,
          },
        };
      },
    );
  }
  changeRole(
    principal: ControlPrincipal,
    id: string,
    input: ReturnType<typeof roleOf>,
  ) {
    return this.write(
      principal,
      "roles.manage",
      input.role ? "platformAccess.granted" : "platformAccess.revoked",
      "user",
      id,
      input,
      async (tx) => {
        if (id === principal.userId)
          throw new ForbiddenException(
            "No puedes cambiar tus propios permisos.",
          );
        const user = await tx.internalUser.findUnique({
          where: { id },
          include: {
            platformAccess: true,
            externalIdentities: {
              select: { verifiedAt: true, synthetic: true },
            },
          },
        });
        if (!user) throw new NotFoundException("Usuario no disponible.");
        const old = user.platformAccess;
        if (old?.role === "PLATFORM_OWNER")
          throw new ForbiddenException(
            "El propietario de plataforma no se cambia ni revoca por esta interfaz.",
          );
        if ((old?.version ?? null) !== input.version)
          throw new ConflictException(
            "Los permisos cambiaron. Carga los datos actuales.",
          );
        if (
          input.role &&
          !user.externalIdentities.some(
            (x) => x.verifiedAt && (!x.synthetic || principal.localDevelopment),
          )
        )
          throw new ConflictException(
            "El usuario necesita una identidad vinculada y verificada.",
          );
        if (
          (!input.role && (!old || old.revokedAt)) ||
          (input.role && old?.role === input.role && !old.revokedAt)
        )
          throw new ConflictException(
            "La cuenta ya tiene ese estado de permisos.",
          );
        const next = old
          ? await tx.platformAccess.update({
              where: { userId: id },
              data: {
                ...(input.role ? { role: input.role } : {}),
                revokedAt: input.role ? null : new Date(),
                version: { increment: 1 },
              },
            })
          : await tx.platformAccess.create({
              data: { userId: id, role: input.role! },
            });
        return {
          before: { role: old?.role ?? null, revoked: !!old?.revokedAt },
          after: {
            role: next.role,
            revoked: !!next.revokedAt,
            version: next.version,
          },
        };
      },
    );
  }
}
