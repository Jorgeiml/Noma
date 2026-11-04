import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import { PrismaService } from "../persistence/prisma.service";
import { Prisma, type Appointment } from "../generated/prisma/client";
import type { OwnerContext } from "../platform/local.guard";
import { businessAuthorization } from "../commercial/business-authorization";
import {
  availabilityOf,
  bookingOf,
  stateOf,
  customerOf,
  dateOf,
  pageOf,
  fail,
  type BookingInput,
} from "./appointment.dto";
import {
  capacityFits,
  clock,
  dayPlus,
  dayWindow,
  localParts,
  scheduleMask,
} from "./appointment-time";
type Tx = Prisma.TransactionClient;
function missing(): never {
  throw new NotFoundException("Registro no disponible en tu negocio.");
}
function conflict(
  message = "Ese horario acaba de ocuparse. Consulta otras horas; conservamos tus datos.",
): never {
  throw new ConflictException(message);
}
const active = { not: "CANCELLED" as const };
const include = { customer: true, allocations: true } as const;
@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}
  private async authorize(tx: Tx, owner: OwnerContext) {
    const member = await tx.membership.findFirst({
      where: {
        id: owner.membershipId,
        userId: owner.userId,
        establishmentId: owner.establishmentId,
        status: "ACTIVE",
        role: "OWNER",
        establishment: { status: "ACTIVE", vertical: "BEAUTY" },
      },
    });
    if (!member)
      throw new ForbiddenException(
        "Se necesita una membresía activa de un negocio Beauty.",
      );
    await businessAuthorization(tx, owner);
  }
  private async write<T>(
    owner: OwnerContext,
    requestId: string,
    input: unknown,
    action: (tx: Tx) => Promise<T>,
  ) {
    try {
      return await this.prisma.client.$transaction(
        async (tx) => {
          // Shared configuration locks allow independent bookings concurrently and coordinate with Staff/Control writes.
          await tx.$executeRaw`SELECT pg_advisory_xact_lock_shared(hashtextextended('noma-control-writes',0))`;
          await tx.$executeRaw`SELECT pg_advisory_xact_lock_shared(hashtextextended(${owner.establishmentId},0))`;
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${owner.establishmentId + ":appointment-request:" + requestId},0))`;
          await this.authorize(tx, owner);
          const inputHash = createHash("sha256")
            .update(JSON.stringify({ actor: owner.userId, input }))
            .digest("hex");
          const replay = await tx.appointmentRequest.findUnique({
            where: {
              establishmentId_requestId: {
                establishmentId: owner.establishmentId,
                requestId,
              },
            },
          });
          if (replay) {
            if (replay.inputHash !== inputHash)
              conflict(
                "Este identificador de operación ya se usó con otros datos.",
              );
            return replay.result as T;
          }
          const result = await action(tx);
          await tx.appointmentRequest.create({
            data: {
              establishmentId: owner.establishmentId,
              requestId,
              actorUserId: owner.userId,
              inputHash,
              result: JSON.parse(
                JSON.stringify(result),
              ) as Prisma.InputJsonValue,
            },
          });
          return result;
        },
        { timeout: 20000, maxWait: 10000 },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2002", "P2004", "P2034", "P2010"].includes(error.code)
      )
        conflict(
          "La agenda cambió mientras guardabas. Actualiza la disponibilidad y vuelve a intentarlo.",
        );
      throw error;
    }
  }
  private async context(
    tx: Tx,
    owner: OwnerContext,
    branchId: string,
    serviceId: string,
    professionalId: string | null,
  ) {
    const establishmentId = owner.establishmentId;
    const [branch, service, schedules, requirements, professionals] =
      await Promise.all([
        tx.branch.findFirst({ where: { id: branchId, establishmentId } }),
        tx.serviceOffering.findFirst({
          where: { id: serviceId, establishmentId },
        }),
        tx.workSchedule.findMany({
          where: { establishmentId, branchId },
          include: { exceptions: { where: { active: true } } },
        }),
        tx.serviceResourceRequirement.findMany({
          where: { establishmentId, branchId, serviceId, active: true },
          include: { resource: true },
        }),
        tx.professional.findMany({
          where: {
            establishmentId,
            active: true,
            ...(professionalId ? { id: professionalId } : {}),
            branches: { some: { branchId, active: true } },
            services: { some: { serviceId, active: true } },
          },
          orderBy: { id: "asc" },
        }),
      ]);
    if (!branch || !service) missing();
    const problems: string[] = [];
    if (!branch.active) problems.push("La sucursal está inactiva.");
    if (!service.active) problems.push("El servicio está inactivo.");
    if (!schedules.some((s) => s.professionalId === null))
      problems.push(
        "Configura el horario de atención de esta sucursal en Equipo → Horarios.",
      );
    if (service.bookingMode === "PROFESSIONAL" && !professionals.length)
      problems.push(
        "Asocia un profesional activo a este servicio y sucursal en Equipo.",
      );
    if (service.bookingMode === "RESOURCE_ONLY" && professionalId)
      problems.push("Este servicio se reserva por recurso, sin profesional.");
    if (service.bookingMode === "RESOURCE_ONLY" && !requirements.length)
      problems.push(
        "Asigna el espacio o equipo que necesita este servicio en Equipo → Espacios y equipos.",
      );
    if (
      requirements.some(
        (r) => !r.resource.active || r.units > r.resource.capacity,
      )
    )
      problems.push(
        "Un espacio o equipo requerido está inactivo o no tiene capacidad suficiente.",
      );
    if (
      service.bookingMode === "PROFESSIONAL" &&
      professionals.length &&
      !professionals.some((p) =>
        schedules.some((s) => s.professionalId === p.id),
      )
    )
      problems.push("Configura el horario del profesional en esta sucursal.");
    return {
      branch,
      service,
      schedules,
      requirements,
      professionals:
        service.bookingMode === "RESOURCE_ONLY" ? [] : professionals,
      problems,
    };
  }
  private async occupied(
    tx: Tx,
    tenant: string,
    start: number,
    end: number,
    excludeId?: string | null,
  ) {
    return tx.appointment.findMany({
      where: {
        establishmentId: tenant,
        state: active,
        startsAt: { lt: new Date(end) },
        endsAt: { gt: new Date(start) },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      include: { allocations: true },
    });
  }
  private evaluator(
    context: Awaited<ReturnType<AppointmentsService["context"]>>,
    occupied: Awaited<ReturnType<AppointmentsService["occupied"]>>,
    start: number,
    end: number,
  ) {
    const branchOpen = scheduleMask(
      context.schedules.find((s) => s.professionalId === null),
      start,
      end,
    );
    const masks = new Map(
      context.professionals.map((p) => [
        p.id,
        scheduleMask(
          context.schedules.find((s) => s.professionalId === p.id),
          start,
          end,
        ),
      ]),
    );
    return (a: number, b: number) => {
      if (context.problems.length || !branchOpen(a, b)) return [];
      if (
        context.requirements.some(
          (r) =>
            !capacityFits(
              a,
              b,
              r.units,
              r.resource.capacity,
              occupied.flatMap((o) =>
                o.allocations
                  .filter((x) => x.resourceId === r.resourceId)
                  .map((x) => ({
                    startsAt: o.startsAt,
                    endsAt: o.endsAt,
                    units: x.units,
                  })),
              ),
            ),
        )
      )
        return [];
      if (context.service.bookingMode === "RESOURCE_ONLY") return [null];
      return context.professionals
        .filter(
          (p) =>
            masks.get(p.id)!(a, b) &&
            !occupied.some(
              (o) =>
                o.professionalId === p.id &&
                o.startsAt.getTime() < b &&
                o.endsAt.getTime() > a,
            ),
        )
        .map((p) => p.id);
    };
  }
  async availability(
    owner: OwnerContext,
    q: ReturnType<typeof availabilityOf>,
  ) {
    return this.prisma.client.$transaction(
      async (tx) => {
        await this.authorize(tx, owner);
        const c = await this.context(
          tx,
          owner,
          q.branchId,
          q.serviceId,
          q.professionalId,
        );
        const today = localParts(clock(c.branch.timeZone), Date.now()).date;
        if (q.date < today || q.date > dayPlus(today, 366))
          fail("Consulta fechas entre hoy y los próximos 366 días.");
        const original = q.excludeId
          ? await tx.appointment.findFirst({
              where: {
                id: q.excludeId,
                establishmentId: owner.establishmentId,
              },
            })
          : null;
        if (q.excludeId && !original) missing();
        if (original && original.serviceId !== q.serviceId)
          fail("Reagendar conserva el servicio original.");
        const duration = original?.durationMinutes ?? c.service.durationMinutes;
        if (duration > 10080)
          fail(
            "La agenda admite servicios de hasta siete días. Ajusta la duración antes de reservar.",
          );
        const window = dayWindow(q.date, c.branch.timeZone);
        if (!Number.isFinite(window.start))
          return {
            slots: [],
            problems: ["La fecha no existe en esta zona horaria."],
            timeZone: c.branch.timeZone,
            durationMinutes: duration,
          };
        const end = window.end + duration * 60000,
          occupied = await this.occupied(
            tx,
            owner.establishmentId,
            window.start,
            end,
            q.excludeId,
          );
        const resolve = this.evaluator(c, occupied, window.start, end),
          f = clock(c.branch.timeZone);
        const slots: Array<{
          startsAt: string;
          endsAt: string;
          professionalId: string | null;
          label: string;
        }> = [];
        for (let a = window.start; a < window.end; a += 60000) {
          if (a <= Date.now() || localParts(f, a).minute % q.step !== 0)
            continue;
          const b = a + duration * 60000;
          for (const professionalId of resolve(a, b))
            slots.push({
              startsAt: new Date(a).toISOString(),
              endsAt: new Date(b).toISOString(),
              professionalId,
              label: new Intl.DateTimeFormat("es-EC", {
                timeZone: c.branch.timeZone,
                hour: "2-digit",
                minute: "2-digit",
                hourCycle: "h23",
                timeZoneName: "shortOffset",
              }).format(a),
            });
          if (slots.length >= 2000) break;
        }
        return {
          slots,
          problems: c.problems,
          timeZone: c.branch.timeZone,
          durationMinutes: duration,
          granularityMinutes: q.step,
          truncated: slots.length >= 2000,
        };
      },
      { isolationLevel: "RepeatableRead", timeout: 20000 },
    );
  }
  async configuration(owner: OwnerContext) {
    return this.prisma.client.$transaction(async (tx) => {
      await this.authorize(tx, owner);
      const where = { establishmentId: owner.establishmentId, active: true };
      const [branches, services, professionals] = await Promise.all([
        tx.branch.findMany({ where, orderBy: { name: "asc" }, take: 100 }),
        tx.serviceOffering.findMany({
          where,
          orderBy: { name: "asc" },
          take: 1000,
        }),
        tx.professional.findMany({
          where,
          include: {
            branches: { where: { active: true } },
            services: { where: { active: true } },
          },
          orderBy: { displayName: "asc" },
          take: 1000,
        }),
      ]);
      return { branches, services, professionals };
    });
  }
  private async lockSubjects(tx: Tx, tenant: string, ids: string[]) {
    for (const id of [...new Set(ids)].sort())
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${tenant + ":appointment-subject:" + id},0))`;
  }
  private async assignment(
    tx: Tx,
    owner: OwnerContext,
    b: BookingInput,
    original?: Appointment,
  ) {
    if (original && original.serviceId !== b.serviceId)
      fail("Reagendar conserva el servicio y su duración original.");
    const c = await this.context(
      tx,
      owner,
      b.branchId,
      b.serviceId,
      b.professionalId,
    );
    if (c.problems.length) conflict(c.problems.join(" "));
    const duration = original?.durationMinutes ?? c.service.durationMinutes;
    const today = localParts(clock(c.branch.timeZone), Date.now()).date;
    if (
      b.startsAt.getTime() <= Date.now() ||
      localParts(clock(c.branch.timeZone), b.startsAt.getTime()).date >
        dayPlus(today, 366) ||
      duration > 10080
    )
      fail(
        "Elige una fecha futura dentro del horizonte de 366 días y una duración de hasta siete días.",
      );
    const endsAt = new Date(b.startsAt.getTime() + duration * 60000);
    const oldResources = original
      ? await tx.appointmentResource.findMany({
          where: { appointmentId: original.id },
        })
      : [];
    await this.lockSubjects(tx, owner.establishmentId, [
      ...c.professionals.map((p) => "professional:" + p.id),
      ...c.requirements.map((r) => "resource:" + r.resourceId),
      ...(original?.professionalId
        ? ["professional:" + original.professionalId]
        : []),
      ...oldResources.map((r) => "resource:" + r.resourceId),
    ]);
    const occupied = await this.occupied(
      tx,
      owner.establishmentId,
      b.startsAt.getTime(),
      endsAt.getTime(),
      original?.id,
    );
    const possible = this.evaluator(
      c,
      occupied,
      b.startsAt.getTime(),
      endsAt.getTime(),
    )(b.startsAt.getTime(), endsAt.getTime());
    if (!possible.length) conflict();
    const professionalId = possible[0]!;
    return { context: c, professionalId, endsAt, duration };
  }
  create(owner: OwnerContext, b: ReturnType<typeof bookingOf>) {
    return this.write(
      owner,
      b.requestId,
      { action: "create", ...b },
      async (tx) => {
        const a = await this.assignment(tx, owner, b);
        let customerId = b.customerId;
        if (customerId) {
          if (
            !(await tx.appointmentCustomer.findFirst({
              where: { id: customerId, establishmentId: owner.establishmentId },
            }))
          )
            missing();
        } else
          customerId = (
            await tx.appointmentCustomer.create({
              data: { ...b.customer!, establishmentId: owner.establishmentId },
            })
          ).id;
        const c = a.context;
        const result = await tx.appointment.create({
          data: {
            id: randomUUID(),
            establishmentId: owner.establishmentId,
            branchId: b.branchId,
            serviceId: b.serviceId,
            professionalId: a.professionalId,
            customerId,
            startsAt: b.startsAt,
            endsAt: a.endsAt,
            timeZone: c.branch.timeZone,
            durationMinutes: a.duration,
            channel: b.channel,
            note: b.note,
            actorUserId: owner.userId,
            snapshot: {
              serviceName: c.service.name,
              branchName: c.branch.name,
              professionalName:
                c.professionals.find((p) => p.id === a.professionalId)
                  ?.displayName ?? null,
              bookingMode: c.service.bookingMode,
              priceMode: c.service.priceMode,
              priceMin: c.service.priceMin?.toString() ?? null,
              priceMax: c.service.priceMax?.toString() ?? null,
              currency: c.service.currency,
            },
          },
          include,
        });
        await tx.appointmentResource.createMany({
          data: c.requirements.map((r) => ({
            appointmentId: result.id,
            establishmentId: owner.establishmentId,
            resourceId: r.resourceId,
            units: r.units,
          })),
        });
        const created = await tx.appointment.findUniqueOrThrow({
          where: { id: result.id },
          include,
        });
        await this.event(tx, owner, result.id, "CREATED", null, created, null);
        return created;
      },
    );
  }
  private async locked(
    tx: Tx,
    owner: OwnerContext,
    id: string,
    version: number,
  ) {
    await tx.$queryRaw`SELECT id FROM "Appointment" WHERE id=${id}::uuid AND "establishmentId"=${owner.establishmentId}::uuid FOR UPDATE`;
    const current = await tx.appointment.findFirst({
      where: { id, establishmentId: owner.establishmentId },
      include,
    });
    if (!current) missing();
    if (current.version !== version)
      conflict(
        "La cita cambió en otra ventana. Recarga el detalle antes de continuar.",
      );
    return current;
  }
  reschedule(owner: OwnerContext, id: string, b: BookingInput) {
    return this.write(
      owner,
      b.requestId,
      { action: "reschedule", id, ...b },
      async (tx) => {
        const current = await this.locked(tx, owner, id, b.version!);
        if (!["CONFIRMED", "PENDING_CONFIRMATION"].includes(current.state))
          conflict("Una cita finalizada no puede reagendarse.");
        const a = await this.assignment(tx, owner, b, current);
        await tx.appointmentResource.deleteMany({
          where: { appointmentId: id, establishmentId: owner.establishmentId },
        });
        await tx.appointment.update({
          where: { id },
          data: {
            branchId: b.branchId,
            professionalId: a.professionalId,
            startsAt: b.startsAt,
            endsAt: a.endsAt,
            timeZone: a.context.branch.timeZone,
            snapshot: {
              ...(current.snapshot as Prisma.JsonObject),
              branchName: a.context.branch.name,
              professionalName:
                a.context.professionals.find((p) => p.id === a.professionalId)
                  ?.displayName ?? null,
            } as Prisma.InputJsonObject,
            version: { increment: 1 },
            actorUserId: owner.userId,
          },
          include,
        });
        await tx.appointmentResource.createMany({
          data: a.context.requirements.map((r) => ({
            appointmentId: id,
            establishmentId: owner.establishmentId,
            resourceId: r.resourceId,
            units: r.units,
          })),
        });
        const changed = await tx.appointment.findUniqueOrThrow({
          where: { id },
          include,
        });
        await this.event(
          tx,
          owner,
          id,
          "RESCHEDULED",
          current,
          changed,
          b.reason,
        );
        return changed;
      },
    );
  }
  changeState(owner: OwnerContext, id: string, b: ReturnType<typeof stateOf>) {
    return this.write(
      owner,
      b.requestId,
      { action: "state", id, ...b },
      async (tx) => {
        const current = await this.locked(tx, owner, id, b.version);
        const transitions: Record<string, string[]> = {
          PENDING_CONFIRMATION: ["CONFIRMED", "CANCELLED"],
          CONFIRMED: ["COMPLETED", "CANCELLED", "NO_SHOW"],
        };
        if (!transitions[current.state]?.includes(b.state))
          conflict(
            "Esta transición no está permitida. Las citas finalizadas conservan su historial.",
          );
        if (b.state === "COMPLETED" && current.endsAt > new Date())
          conflict("La cita todavía no termina.");
        if (b.state === "NO_SHOW" && current.startsAt > new Date())
          conflict("La cita todavía no comienza.");
        await this.lockSubjects(tx, owner.establishmentId, [
          ...(current.professionalId
            ? ["professional:" + current.professionalId]
            : []),
          ...current.allocations.map((r) => "resource:" + r.resourceId),
        ]);
        const result = await tx.appointment.update({
          where: { id },
          data: {
            state: b.state,
            version: { increment: 1 },
            actorUserId: owner.userId,
          },
          include,
        });
        await this.event(tx, owner, id, b.state, current, result, b.reason);
        return result;
      },
    );
  }
  private event(
    tx: Tx,
    owner: OwnerContext,
    id: string,
    type: string,
    before: unknown,
    after: Appointment,
    reason: string | null,
  ) {
    const summary = (
      a: Appointment & {
        allocations?: Array<{ resourceId: string; units: number }>;
      },
    ) => ({
      startsAt: a.startsAt.toISOString(),
      endsAt: a.endsAt.toISOString(),
      state: a.state,
      branchId: a.branchId,
      professionalId: a.professionalId,
      version: a.version,
      resources:
        a.allocations?.map((r) => ({
          resourceId: r.resourceId,
          units: r.units,
        })) ?? [],
    });
    return tx.appointmentEvent.create({
      data: {
        establishmentId: owner.establishmentId,
        appointmentId: id,
        actorUserId: owner.userId,
        type,
        reason,
        before: before ? summary(before as Appointment) : Prisma.DbNull,
        after: summary(after),
      },
    });
  }
  async detail(owner: OwnerContext, id: string) {
    return this.prisma.client.$transaction(async (tx) => {
      await this.authorize(tx, owner);
      const value = await tx.appointment.findFirst({
        where: { id, establishmentId: owner.establishmentId },
        include: {
          ...include,
          events: { orderBy: { createdAt: "asc" }, take: 200 },
        },
      });
      return value
        ? { ...value, serverNow: new Date().toISOString() }
        : missing();
    });
  }
  async agenda(
    owner: OwnerContext,
    q: {
      date: string;
      days: number;
      branchId?: string;
      professionalId?: string;
      page?: unknown;
    },
  ) {
    const date = dateOf(q.date);
    if (![1, 7].includes(q.days)) fail("La agenda admite uno o siete días.");
    const page = pageOf(q.page);
    return this.prisma.client.$transaction(
      async (tx) => {
        await this.authorize(tx, owner);
        const tenant = await tx.establishment.findUniqueOrThrow({
          where: { id: owner.establishmentId },
        });
        const branch = q.branchId
          ? await tx.branch.findFirst({
              where: { id: q.branchId, establishmentId: owner.establishmentId },
            })
          : null;
        if (q.branchId && !branch) missing();
        const zone = branch?.timeZone ?? tenant.timeZone;
        const from = dayWindow(date, zone),
          to = dayWindow(dayPlus(date, q.days - 1), zone);
        if (!Number.isFinite(from.start) || !Number.isFinite(to.end))
          fail("Fecha inexistente en esta zona horaria.");
        const where = {
          establishmentId: owner.establishmentId,
          startsAt: { lt: new Date(to.end) },
          endsAt: { gt: new Date(from.start) },
          ...(q.branchId ? { branchId: q.branchId } : {}),
          ...(q.professionalId ? { professionalId: q.professionalId } : {}),
        };
        const [items, total] = await Promise.all([
          tx.appointment.findMany({
            where,
            include,
            orderBy: [{ startsAt: "asc" }, { id: "asc" }],
            skip: (page - 1) * 200,
            take: 200,
          }),
          tx.appointment.count({ where }),
        ]);
        return {
          items,
          total,
          page,
          pageSize: 200,
          timeZone: zone,
          date,
          days: q.days,
        };
      },
      { isolationLevel: "RepeatableRead" },
    );
  }
  async customers(owner: OwnerContext, q: string, page = 1) {
    if (q.length > 120) fail("Búsqueda demasiado larga.");
    return this.prisma.client.$transaction(async (tx) => {
      await this.authorize(tx, owner);
      const where = {
        establishmentId: owner.establishmentId,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" as const } },
                { phone: { contains: q.replace(/[\s().-]/g, "") } },
              ],
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        tx.appointmentCustomer.findMany({
          where,
          orderBy: [{ name: "asc" }, { id: "asc" }],
          take: 30,
          skip: (page - 1) * 30,
        }),
        tx.appointmentCustomer.count({ where }),
      ]);
      return { items, total, page, pageSize: 30 };
    });
  }
  createCustomer(
    owner: OwnerContext,
    requestId: string,
    customer: ReturnType<typeof customerOf>,
  ) {
    return this.write(
      owner,
      requestId,
      { action: "customer", customer },
      async (tx) => {
        const value = await tx.appointmentCustomer.create({
          data: { ...customer, establishmentId: owner.establishmentId },
        });
        const possibleDuplicates = customer.phone
          ? await tx.appointmentCustomer.count({
              where: {
                establishmentId: owner.establishmentId,
                phone: customer.phone,
                id: { not: value.id },
              },
            })
          : 0;
        return { ...value, possibleDuplicates };
      },
    );
  }
}
