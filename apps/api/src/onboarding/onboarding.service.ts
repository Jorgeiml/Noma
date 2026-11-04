import { createHash, randomUUID } from "node:crypto";
import {
  Injectable,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import type { Prisma, BusinessOnboarding } from "../generated/prisma/client";
import { PrismaService } from "../persistence/prisma.service";
import { OfferingService } from "../offering/offering.service";
import {
  validateOffering,
  type OfferingDto,
  type UpdateOfferingDto,
} from "../offering/offering.dto";
import { StaffService } from "../staff/staff.service";
import {
  branchDto,
  professionalDto,
  resourceDto,
  scheduleDto,
  uuid,
  versionOf,
} from "../staff/staff.dto";
import type { OwnerContext } from "../platform/local.guard";
import {
  entitlementFor,
  type OnboardingPrincipal,
} from "./onboarding.authorization";
import { businessFields, commandOf } from "./onboarding.dto";
import { transactionScope } from "./transaction-scope";
import {
  configurationFor,
  missingFor,
  snapshotFor,
} from "./onboarding.snapshot";
type Tx = Prisma.TransactionClient;
type Grant = NonNullable<Awaited<ReturnType<typeof entitlementFor>>>;
@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}
  snapshot(principal: OnboardingPrincipal) {
    return this.prisma.client.$transaction(
      (tx) => snapshotFor(tx, principal.userId),
      { isolationLevel: "RepeatableRead" },
    );
  }
  async entry(p: OnboardingPrincipal) {
    const record = await this.prisma.client.businessOnboarding.findFirst({
      where: { application: { userId: p.userId } },
      select: { establishmentId: true, completedAt: true },
    });
    if (record) {
      const sameContext =
        !p.selectedMembershipId ||
        !!(
          record.establishmentId &&
          (await this.prisma.client.membership.findFirst({
            where: {
              id: p.selectedMembershipId,
              userId: p.userId,
              establishmentId: record.establishmentId,
            },
          }))
        );
      if (!sameContext) return { needsOnboarding: false };
      if (!record.completedAt) return { needsOnboarding: true };
      try {
        return {
          needsOnboarding: !(await entitlementFor(
            this.prisma.client,
            p.userId,
          )),
        };
      } catch {
        return { needsOnboarding: true };
      }
    }
    if (p.selectedMembershipId) return { needsOnboarding: false };
    const grant = await entitlementFor(this.prisma.client, p.userId);
    return { needsOnboarding: !!grant };
  }
  private async actor(tx: Tx, p: OnboardingPrincipal) {
    const session = await tx.commercialSession.findFirst({
      where: {
        id: p.sessionId,
        digest: p.sessionDigest,
        identityId: p.identityId,
        expiresAt: { gt: new Date() },
        lastSeenAt: { gt: new Date(Date.now() - 30 * 60000) },
        identity: { userId: p.userId, verifiedAt: { not: null } },
      },
    });
    if (!session)
      throw new ForbiddenException(
        "Tu sesión cambió o venció. Inicia sesión para recuperar el progreso guardado.",
      );
  }
  private async owner(
    tx: Tx,
    p: OnboardingPrincipal,
    record: BusinessOnboarding | null,
    grant: Grant,
  ): Promise<OwnerContext> {
    if (!record?.establishmentId)
      throw new ConflictException("Guarda primero el negocio.");
    const m = await tx.membership.findFirst({
      where: {
        userId: p.userId,
        establishmentId: record.establishmentId,
        status: "ACTIVE",
        role: "OWNER",
        establishment: { status: "ACTIVE", vertical: "BEAUTY" },
      },
      include: { establishment: true },
    });
    if (
      !m ||
      (grant.kind === "MANUAL_PILOT" && grant.membershipId !== m.id) ||
      (grant.establishmentId && grant.establishmentId !== m.establishmentId)
    )
      throw new ForbiddenException(
        "La autorización no corresponde a este negocio.",
      );
    return {
      userId: p.userId,
      displayName: p.name,
      membershipId: m.id,
      establishmentId: m.establishmentId,
      currency: m.establishment.currency,
      vertical: m.establishment.vertical,
      role: "OWNER",
      identityMode: "commercial",
    };
  }
  private audit(
    tx: Tx,
    p: OnboardingPrincipal,
    action: string,
    recordId: string,
    changes: Prisma.InputJsonValue,
  ) {
    return tx.platformAudit.create({
      data: {
        actorUserId: p.userId,
        requestId: randomUUID(),
        action,
        resourceType: "onboarding",
        resourceId: recordId,
        reason:
          "Configuración inicial autorizada por la identidad propietaria. Sin registro de pago.",
        outcome: "SUCCESS",
        changes,
      },
    });
  }
  private async write(
    p: OnboardingPrincipal,
    action: string,
    input: unknown,
    extra: string[],
    operation: (
      tx: Tx,
      record: BusinessOnboarding | null,
      grant: Grant,
      body: Record<string, unknown>,
    ) => Promise<{ id: string; unchanged?: boolean }>,
  ) {
    const { body, requestId, version } = commandOf(input, extra);
    const hash = createHash("sha256")
      .update(JSON.stringify({ action, body }))
      .digest("hex");
    const result = await this.prisma.client.$transaction(
      async (tx) => {
        // Same ordering as Control: no pilot suspension/revocation can interleave a protected write.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('noma-control-writes',0))`;
        await this.actor(tx, p);
        const grant = await entitlementFor(tx, p.userId);
        if (!grant)
          throw new ForbiddenException(
            "Necesitas una habilitación comercial vigente. Tu progreso se conserva.",
          );
        const replay = await tx.onboardingOperation.findUnique({
          where: {
            applicationId_requestId: {
              applicationId: grant.applicationId,
              requestId,
            },
          },
        });
        if (replay) {
          if (replay.action !== action || replay.inputHash !== hash)
            throw new ConflictException(
              "Este intento ya se utilizó con otros datos. Recarga el progreso antes de cambiar la operación.",
            );
          return { replayed: true, id: replay.resultId };
        }
        const record = await tx.businessOnboarding.findUnique({
          where: { applicationId: grant.applicationId },
        });
        if ((record?.version ?? 0) !== version)
          throw new ConflictException(
            "La configuración cambió en otra ventana. Tu edición se conserva; carga el progreso actualizado antes de guardar.",
          );
        if (record?.completedAt && !["complete", "start"].includes(action))
          throw new ConflictException(
            "La preparación ya terminó. Edita el negocio, los servicios y el equipo desde Noma Business.",
          );
        if (record?.establishmentId)
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${record.establishmentId},0))`;
        const outcome = await operation(tx, record, grant, body);
        // The clock and the session can change while a stage is being saved.
        // Recheck before commit so a slow write cannot outlive its authorization.
        await this.actor(tx, p);
        if (!(await entitlementFor(tx, p.userId)))
          throw new ForbiddenException(
            "La habilitación venció durante el guardado. No se aplicaron cambios; el progreso anterior se conserva.",
          );
        if (!outcome.unchanged) {
          const current = await tx.businessOnboarding.findUniqueOrThrow({
            where: { applicationId: grant.applicationId },
          });
          await tx.businessOnboarding.update({
            where: { id: current.id },
            data: { version: { increment: 1 } },
          });
        }
        await tx.onboardingOperation.create({
          data: {
            applicationId: grant.applicationId,
            requestId,
            action,
            inputHash: hash,
            resultId: outcome.id,
          },
        });
        return { replayed: false, id: outcome.id };
      },
      { timeout: 20000 },
    );
    return { ...result, snapshot: await this.snapshot(p) };
  }
  start(p: OnboardingPrincipal, input: unknown) {
    return this.write(
      p,
      "start",
      input,
      ["membershipId"],
      async (tx, record, grant, body) => {
        if (record) return { id: record.id, unchanged: true };
        const candidates = await tx.membership.findMany({
          where: {
            userId: p.userId,
            role: "OWNER",
            status: "ACTIVE",
            establishment: { status: "ACTIVE" },
          },
          include: { establishment: true },
        });
        const explicit =
          body.membershipId === undefined || body.membershipId === null
            ? null
            : uuid(body.membershipId);
        const selectedId = grant.membershipId ?? explicit;
        if (grant.membershipId && explicit && explicit !== grant.membershipId)
          throw new ForbiddenException(
            "El piloto ya está asociado a otro contexto.",
          );
        const selected = selectedId
          ? candidates.find((m) => m.id === selectedId)
          : grant.establishmentId
            ? candidates.find(
                (m) => m.establishmentId === grant.establishmentId,
              )
            : null;
        if ((selectedId || grant.establishmentId) && !selected)
          throw new ForbiddenException(
            "Selecciona una membresía propia, activa y autorizada.",
          );
        if (!selected && candidates.length)
          throw new ConflictException(
            "Ya tienes negocios. Selecciona explícitamente el contexto existente; no crearemos un duplicado.",
          );
        if (selected && selected.establishment.vertical !== "BEAUTY")
          throw new ConflictException(
            "La preparación de este sector todavía está en desarrollo. No se reclasifica tu negocio.",
          );
        const newRecord = await tx.businessOnboarding.create({
          data: {
            applicationId: grant.applicationId,
            establishmentId: selected?.establishmentId,
            selectedVertical: selected ? "BEAUTY" : undefined,
            step: selected ? 1 : 0,
          },
        });
        if (selected) {
          if (grant.pilotId && !grant.membershipId)
            await tx.manualActivation.update({
              where: { id: grant.pilotId },
              data: { membershipId: selected.id, version: { increment: 1 } },
            });
          const missing = missingFor(
            await configurationFor(tx, selected.establishmentId),
            false,
          );
          await tx.businessOnboarding.update({
            where: { id: newRecord.id },
            data: { step: missing[0]?.step ?? 5 },
          });
        }
        await this.audit(tx, p, "onboarding.started", newRecord.id, {
          existingBusiness: !!selected,
          paymentCreated: false,
        });
        return { id: newRecord.id };
      },
    );
  }
  sector(p: OnboardingPrincipal, input: unknown) {
    return this.write(
      p,
      "sector",
      input,
      ["vertical"],
      async (tx, record, _grant, body) => {
        if (!record)
          throw new ConflictException("Inicia primero la preparación.");
        if (record.establishmentId)
          throw new ConflictException(
            "El sector pertenece al negocio existente y no puede reclasificarse aquí.",
          );
        if (body.vertical !== "BEAUTY")
          throw new BadRequestException(
            "Este sector está en desarrollo. Por ahora solo puedes preparar un negocio de belleza y bienestar.",
          );
        await tx.businessOnboarding.update({
          where: { id: record.id },
          data: { selectedVertical: "BEAUTY", step: 1 },
        });
        return { id: record.id };
      },
    );
  }
  business(p: OnboardingPrincipal, input: unknown) {
    return this.write(
      p,
      "business",
      input,
      ["business", "entityVersion"],
      async (tx, record, grant, body) => {
        if (!record || record.selectedVertical !== "BEAUTY")
          throw new ConflictException(
            "Selecciona primero belleza y bienestar.",
          );
        const fields = businessFields(
          body.business,
          record.establishmentId ? record.createdBusiness : true,
        );
        if (record.establishmentId) {
          const owner = await this.owner(tx, p, record, grant);
          const current = await tx.establishment.findUniqueOrThrow({
            where: { id: owner.establishmentId },
          });
          if (current.version !== versionOf(body.entityVersion))
            throw new ConflictException(
              "El perfil cambió. Carga los datos actuales antes de guardar.",
            );
          if (
            current.timeZone !== fields.timeZone &&
            (await tx.workSchedule.count({
              where: { establishmentId: current.id },
            }))
          )
            throw new ConflictException(
              "La zona horaria tiene horarios vinculados. Conserva la zona actual.",
            );
          await tx.establishment.update({
            where: { id: current.id },
            data: { ...fields, version: { increment: 1 } },
          });
        } else {
          if (grant.membershipId || grant.establishmentId)
            throw new ConflictException(
              "Tu autorización ya tiene un negocio asociado.",
            );
          if (await tx.membership.count({ where: { userId: p.userId } }))
            throw new ConflictException(
              "Ya tienes una membresía. Recupera el contexto existente antes de crear otro negocio.",
            );
          if (!grant.pilotId)
            throw new ForbiddenException(
              "No existe una autorización de alta sin negocio.",
            );
          const business = await tx.establishment.create({
            data: {
              ...fields,
              vertical: "BEAUTY",
              verticalConfiguredAt: new Date(),
              verticalConfigurationReason:
                "Selección explícita del propietario durante onboarding autorizado.",
              currency: "USD",
            },
          });
          const member = await tx.membership.create({
            data: {
              userId: p.userId,
              establishmentId: business.id,
              role: "OWNER",
            },
          });
          if (grant.pilotId)
            await tx.manualActivation.update({
              where: { id: grant.pilotId },
              data: { membershipId: member.id, version: { increment: 1 } },
            });
          await tx.businessOnboarding.update({
            where: { id: record.id },
            data: { establishmentId: business.id, createdBusiness: true },
          });
          await this.audit(tx, p, "onboarding.business_created", record.id, {
            establishmentId: business.id,
            membershipId: member.id,
            vertical: "BEAUTY",
            paymentCreated: false,
          });
        }
        await tx.businessOnboarding.update({
          where: { id: record.id },
          data: { step: 2 },
        });
        return { id: record.id };
      },
    );
  }
  entity(
    p: OnboardingPrincipal,
    kind: "branch" | "service" | "professional" | "resource" | "schedule",
    input: unknown,
  ) {
    return this.write(
      p,
      kind,
      input,
      ["data", "id", "entityVersion", "active"],
      async (tx, record, grant, body) => {
        const owner = await this.owner(tx, p, record, grant),
          scoped = transactionScope(tx),
          staff = new StaffService(scoped),
          offering = new OfferingService(scoped);
        const id =
          body.id === undefined || body.id === null ? undefined : uuid(body.id);
        const version = id ? versionOf(body.entityVersion) : undefined;
        let resultId: string;
        if (kind === "branch")
          resultId = (
            await staff.saveBranch(owner, branchDto(body.data), id, version)
          ).id;
        else if (kind === "professional")
          resultId = (
            await staff.saveProfessional(
              owner,
              professionalDto(body.data),
              id,
              version,
            )
          ).id;
        else if (kind === "resource")
          resultId = (
            await staff.saveResource(owner, resourceDto(body.data), id, version)
          ).id;
        else if (kind === "schedule") {
          if (id)
            throw new BadRequestException(
              "Los horarios usan su contexto, no un identificador arbitrario.",
            );
          resultId = (await staff.saveSchedule(owner, scheduleDto(body.data)))
            .id;
        } else {
          const parsed = validateOffering(body.data) as OfferingDto;
          const result = id
            ? await offering.update(owner, id, {
                ...parsed,
                version: version!,
              } as UpdateOfferingDto)
            : await offering.create(owner, parsed, owner.currency);
          if (body.active !== undefined) {
            if (typeof body.active !== "boolean")
              throw new BadRequestException(
                "Selecciona un estado válido para el servicio.",
              );
            if (result.active !== body.active)
              await offering.update(owner, result.id, {
                active: body.active,
                version: result.version,
              });
          }
          resultId = result.id;
        }
        return { id: resultId };
      },
    );
  }
  step(p: OnboardingPrincipal, input: unknown) {
    return this.write(
      p,
      "step",
      input,
      ["step"],
      async (tx, record, grant, body) => {
        if (!record)
          throw new ConflictException("Inicia primero la preparación.");
        if (
          !Number.isInteger(body.step) ||
          (body.step as number) < 0 ||
          (body.step as number) > 5
        )
          throw new BadRequestException("Etapa no válida.");
        const next = body.step as number;
        if (next > 0 && !record.selectedVertical)
          throw new ConflictException("Selecciona tu sector.");
        if (next > 1) {
          await this.owner(tx, p, record, grant);
          const missing = missingFor(
            await configurationFor(tx, record.establishmentId!),
            record.createdBusiness,
          );
          const first = missing.find((item) => item.step < next);
          if (first) throw new ConflictException(first.message);
        }
        if (record.establishmentId && next === 0)
          throw new ConflictException(
            "El sector del negocio ya está definido.",
          );
        await tx.businessOnboarding.update({
          where: { id: record.id },
          data: { step: next },
        });
        return { id: record.id };
      },
    );
  }
  complete(p: OnboardingPrincipal, input: unknown) {
    return this.write(p, "complete", input, [], async (tx, record, grant) => {
      const owner = await this.owner(tx, p, record, grant);
      if (record!.completedAt) return { id: record!.id, unchanged: true };
      const config = await configurationFor(tx, owner.establishmentId),
        missing = missingFor(config, record!.createdBusiness);
      if (missing.length)
        throw new ConflictException(
          missing.map((item) => item.message).join(" "),
        );
      if (
        config.branches.length > grant.limits.branches ||
        config.professionals.length > grant.limits.professionals ||
        (await tx.membership.count({
          where: { establishmentId: owner.establishmentId, status: "ACTIVE" },
        })) > grant.limits.users
      )
        throw new ConflictException(
          "La configuración supera los límites autorizados del plan. Revisa el equipo o la habilitación comercial.",
        );
      await tx.businessOnboarding.update({
        where: { id: record!.id },
        data: { step: 6, completedAt: new Date() },
      });
      await this.audit(tx, p, "onboarding.completed", record!.id, {
        establishmentId: owner.establishmentId,
        configured: true,
        bookingsAvailable: false,
        aiAvailable: false,
        paymentCreated: false,
      });
      return { id: record!.id };
    });
  }
}
