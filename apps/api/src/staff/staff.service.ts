import {
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../persistence/prisma.service";
import { Prisma } from "../generated/prisma/client";
import type { OwnerContext } from "../platform/local.guard";
import type {
  BranchDto,
  ProfessionalDto,
  ResourceDto,
  ScheduleDto,
  ExceptionDto,
  RequirementsDto,
  StatusDto,
} from "./staff.dto";

type Tx = Prisma.TransactionClient;
function missing(): never {
  throw new NotFoundException("Referencia no disponible en tu establecimiento");
}
function conflict(
  message = "La configuración cambió en otra ventana. Tu edición se conserva; carga los datos actuales antes de guardar.",
): never {
  throw new ConflictException(message);
}
function sameVersion(actual: number | undefined, expected: number | null) {
  if ((actual ?? null) !== expected) conflict();
}

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}
  async configuration(owner: OwnerContext) {
    const where = { establishmentId: owner.establishmentId };
    // One consistent read snapshot; association lists only expose this tenant.
    return this.prisma.client.$transaction(
      async (tx) => {
        const [
          branches,
          professionals,
          resources,
          schedules,
          exceptions,
          requirements,
        ] = await Promise.all([
          tx.branch.findMany({
            where,
            orderBy: [{ isDefault: "desc" }, { name: "asc" }, { id: "asc" }],
          }),
          tx.professional.findMany({
            where,
            orderBy: [{ displayName: "asc" }, { id: "asc" }],
            include: {
              branches: { where: { active: true } },
              services: { where: { active: true } },
            },
          }),
          tx.physicalResource.findMany({
            where,
            orderBy: [{ name: "asc" }, { id: "asc" }],
          }),
          tx.workSchedule.findMany({ where, orderBy: { id: "asc" } }),
          tx.scheduleException.findMany({
            where,
            orderBy: [{ date: "asc" }, { id: "asc" }],
          }),
          tx.serviceResourceSet.findMany({
            where,
            include: {
              resources: {
                where: { active: true },
                orderBy: { resourceId: "asc" },
              },
            },
          }),
        ]);
        return {
          branches,
          professionals: professionals.map(
            ({ branches: bs, services, ...p }) => ({
              ...p,
              branchIds: bs.map((b) => b.branchId),
              serviceIds: services.map((s) => s.serviceId),
            }),
          ),
          resources,
          schedules,
          exceptions: exceptions.map((e) => ({
            ...e,
            date: e.date.toISOString().slice(0, 10),
          })),
          requirements,
        };
      },
      { isolationLevel: "RepeatableRead" },
    );
  }
  private async write(
    owner: OwnerContext,
    action: (tx: Tx, tenant: string) => Promise<string>,
  ) {
    const id = await this.prisma.client.$transaction(async (tx) => {
      const tenant = owner.establishmentId;
      // Serializes configuration changes within one tenant, never appointment locks.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${tenant}, 0))`;
      const membership = await tx.membership.findFirst({
        where: {
          id: owner.membershipId,
          userId: owner.userId,
          establishmentId: tenant,
          status: "ACTIVE",
          role: "OWNER",
          establishment: { status: "ACTIVE" },
        },
      });
      if (!membership)
        throw new ForbiddenException("Pertenencia no autorizada");
      return action(tx, tenant);
    });
    return { id, configuration: await this.configuration(owner) };
  }
  private async branch(tx: Tx, tenant: string, id: string, active = false) {
    const value = await tx.branch.findFirst({
      where: { id, establishmentId: tenant },
    });
    if (!value) missing();
    if (active && !value.active)
      conflict("Activa la sucursal antes de configurar su operación");
    return value;
  }
  removeProfessional(owner: OwnerContext, id: string, version: number) {
    return this.write(owner, async (tx, tenant) => {
      const current = await tx.professional.findFirst({
        where: { id, establishmentId: tenant },
      });
      if (!current) missing();
      sameVersion(current.version, version);
      const where = { establishmentId: tenant, professionalId: id };
      await tx.scheduleException.deleteMany({
        where: { establishmentId: tenant, schedule: { professionalId: id } },
      });
      await tx.workSchedule.deleteMany({ where });
      await tx.professionalBranch.deleteMany({ where });
      await tx.professionalService.deleteMany({ where });
      await tx.professional.delete({ where: { id } });
      return id;
    });
  }
  private async scheduleContext(
    tx: Tx,
    tenant: string,
    branchId: string,
    professionalId: string | null,
  ) {
    const branch = await this.branch(tx, tenant, branchId, true);
    if (professionalId) {
      const professional = await tx.professional.findFirst({
        where: { id: professionalId, establishmentId: tenant },
      });
      if (!professional) missing();
      const assignment = await tx.professionalBranch.findFirst({
        where: {
          establishmentId: tenant,
          professionalId,
          branchId,
          active: true,
        },
      });
      if (!professional.active || !assignment)
        conflict("El profesional debe estar activo y asignado a la sucursal");
    }
    return branch;
  }
  saveBranch(
    owner: OwnerContext,
    data: BranchDto,
    id?: string,
    version?: number,
  ) {
    return this.write(owner, async (tx, tenant) => {
      if (id) {
        const current = await this.branch(tx, tenant, id);
        sameVersion(current.version, version!);
        if (data.isDefault && !current.active)
          conflict("La sucursal principal debe estar activa");
        if (
          current.timeZone !== data.timeZone &&
          (await tx.workSchedule.count({
            where: { establishmentId: tenant, branchId: id },
          }))
        )
          conflict(
            "La zona tiene horarios vinculados. Su reinterpretación requiere una política futura; conserva la zona actual.",
          );
      }
      if (data.isDefault)
        await tx.branch.updateMany({
          where: {
            establishmentId: tenant,
            isDefault: true,
            ...(id ? { id: { not: id } } : {}),
          },
          data: { isDefault: false, version: { increment: 1 } },
        });
      const result = id
        ? await tx.branch.update({
            where: { id },
            data: { ...data, version: { increment: 1 } },
          })
        : await tx.branch.create({
            data: { ...data, establishmentId: tenant },
          });
      return result.id;
    });
  }
  branchStatus(owner: OwnerContext, id: string, data: StatusDto) {
    return this.write(owner, async (tx, tenant) => {
      const current = await this.branch(tx, tenant, id);
      sameVersion(current.version, data.version);
      if (!data.active && current.isDefault)
        conflict(
          "Retira primero la marca principal o elige otra sucursal principal",
        );
      await tx.branch.update({
        where: { id },
        data: { active: data.active, version: { increment: 1 } },
      });
      return id;
    });
  }
  saveProfessional(
    owner: OwnerContext,
    data: ProfessionalDto,
    id?: string,
    version?: number,
  ) {
    return this.write(owner, async (tx, tenant) => {
      const current = id
        ? await tx.professional.findFirst({
            where: { id, establishmentId: tenant },
            include: {
              branches: { where: { active: true } },
              services: { where: { active: true } },
            },
          })
        : null;
      if (id && !current) missing();
      if (current) sameVersion(current.version, version!);
      for (const branchId of data.branchIds) {
        const branch = await this.branch(tx, tenant, branchId);
        if (
          !branch.active &&
          !current?.branches.some((b) => b.branchId === branchId)
        )
          conflict("No se puede asignar una sucursal inactiva");
      }
      for (const serviceId of data.serviceIds) {
        const service = await tx.serviceOffering.findFirst({
          where: { id: serviceId, establishmentId: tenant },
        });
        if (!service) missing();
        if (
          !service.active &&
          !current?.services.some((s) => s.serviceId === serviceId)
        )
          conflict("No se puede asignar un servicio inactivo");
      }
      const { branchIds, serviceIds, ...fields } = data;
      const p = id
        ? await tx.professional.update({
            where: { id },
            data: { ...fields, version: { increment: 1 } },
          })
        : await tx.professional.create({
            data: { ...fields, establishmentId: tenant },
          });
      await tx.professionalBranch.updateMany({
        where: { establishmentId: tenant, professionalId: p.id, active: true },
        data: { active: false },
      });
      await tx.professionalService.updateMany({
        where: { establishmentId: tenant, professionalId: p.id, active: true },
        data: { active: false },
      });
      for (const branchId of branchIds) {
        const key = { establishmentId: tenant, professionalId: p.id, branchId };
        await tx.professionalBranch.upsert({
          where: { establishmentId_professionalId_branchId: key },
          create: key,
          update: { active: true },
        });
      }
      for (const serviceId of serviceIds) {
        const key = {
          establishmentId: tenant,
          professionalId: p.id,
          serviceId,
        };
        await tx.professionalService.upsert({
          where: { establishmentId_professionalId_serviceId: key },
          create: key,
          update: { active: true },
        });
      }
      return p.id;
    });
  }
  professionalStatus(owner: OwnerContext, id: string, data: StatusDto) {
    return this.write(owner, async (tx, tenant) => {
      const p = await tx.professional.findFirst({
        where: { id, establishmentId: tenant },
      });
      if (!p) missing();
      sameVersion(p.version, data.version);
      await tx.professional.update({
        where: { id },
        data: { active: data.active, version: { increment: 1 } },
      });
      return id;
    });
  }
  saveResource(
    owner: OwnerContext,
    data: ResourceDto,
    id?: string,
    version?: number,
  ) {
    return this.write(owner, async (tx, tenant) => {
      if (id) {
        const current = await tx.physicalResource.findFirst({
          where: { id, establishmentId: tenant },
        });
        if (!current) missing();
        sameVersion(current.version, version!);
        if (current.branchId !== data.branchId)
          conflict("La sucursal de un recurso existente no se puede cambiar");
        if (
          await tx.serviceResourceRequirement.count({
            where: {
              establishmentId: tenant,
              resourceId: id,
              active: true,
              units: { gt: data.capacity },
            },
          })
        )
          conflict("La capacidad es menor que un requerimiento vigente");
        // Existing records remain editable while inactive; new attachments require active branches.
        await this.branch(tx, tenant, data.branchId);
      } else await this.branch(tx, tenant, data.branchId, true);
      const resource = id
        ? await tx.physicalResource.update({
            where: { id },
            data: { ...data, version: { increment: 1 } },
          })
        : await tx.physicalResource.create({
            data: { ...data, establishmentId: tenant },
          });
      return resource.id;
    });
  }
  resourceStatus(owner: OwnerContext, id: string, data: StatusDto) {
    return this.write(owner, async (tx, tenant) => {
      const r = await tx.physicalResource.findFirst({
        where: { id, establishmentId: tenant },
      });
      if (!r) missing();
      sameVersion(r.version, data.version);
      if (data.active) await this.branch(tx, tenant, r.branchId, true);
      if (
        !data.active &&
        (await tx.serviceResourceRequirement.count({
          where: { establishmentId: tenant, resourceId: id, active: true },
        }))
      )
        conflict(
          "Retira primero el recurso de los requerimientos de servicios",
        );
      await tx.physicalResource.update({
        where: { id },
        data: { active: data.active, version: { increment: 1 } },
      });
      return id;
    });
  }
  saveSchedule(owner: OwnerContext, data: ScheduleDto) {
    return this.write(owner, async (tx, tenant) => {
      const branch = await this.scheduleContext(
        tx,
        tenant,
        data.branchId,
        data.professionalId,
      );
      if (branch.timeZone !== data.timeZone)
        conflict("La zona horaria cambió; carga la configuración actual");
      const current = await tx.workSchedule.findFirst({
        where: {
          establishmentId: tenant,
          branchId: data.branchId,
          professionalId: data.professionalId,
        },
      });
      sameVersion(current?.version, data.version);
      const fields = {
        branchId: data.branchId,
        professionalId: data.professionalId,
        timeZone: data.timeZone,
        week: data.week,
      };
      const result = current
        ? await tx.workSchedule.update({
            where: { id: current.id },
            data: { week: fields.week, version: { increment: 1 } },
          })
        : await tx.workSchedule.create({
            data: { ...fields, establishmentId: tenant },
          });
      return result.id;
    });
  }
  saveException(
    owner: OwnerContext,
    scheduleId: string | undefined,
    data: ExceptionDto,
    id?: string,
    version?: number,
  ) {
    return this.write(owner, async (tx, tenant) => {
      const current = id
        ? await tx.scheduleException.findFirst({
            where: { id, establishmentId: tenant },
          })
        : null;
      if (id && !current) missing();
      if (current) sameVersion(current.version, version!);
      const schedule = await tx.workSchedule.findFirst({
        where: {
          id: current?.scheduleId ?? scheduleId,
          establishmentId: tenant,
        },
      });
      if (!schedule) missing();
      await this.scheduleContext(
        tx,
        tenant,
        schedule.branchId,
        schedule.professionalId,
      );
      const date = new Date(`${data.date}T00:00:00.000Z`);
      if (
        await tx.scheduleException.count({
          where: {
            scheduleId: schedule.id,
            date,
            ...(id ? { id: { not: id } } : {}),
          },
        })
      )
        conflict(
          "Ya existe una excepción para esa fecha. Edita o reactiva la existente.",
        );
      const fields = { ...data, date };
      const result = current
        ? await tx.scheduleException.update({
            where: { id },
            data: { ...fields, version: { increment: 1 } },
          })
        : await tx.scheduleException.create({
            data: {
              ...fields,
              scheduleId: schedule.id,
              establishmentId: tenant,
            },
          });
      return result.id;
    });
  }
  exceptionStatus(owner: OwnerContext, id: string, data: StatusDto) {
    return this.write(owner, async (tx, tenant) => {
      const e = await tx.scheduleException.findFirst({
        where: { id, establishmentId: tenant },
        include: { schedule: true },
      });
      if (!e) missing();
      sameVersion(e.version, data.version);
      if (data.active)
        await this.scheduleContext(
          tx,
          tenant,
          e.schedule.branchId,
          e.schedule.professionalId,
        );
      await tx.scheduleException.update({
        where: { id },
        data: { active: data.active, version: { increment: 1 } },
      });
      return id;
    });
  }
  saveRequirements(
    owner: OwnerContext,
    branchId: string,
    serviceId: string,
    data: RequirementsDto,
  ) {
    return this.write(owner, async (tx, tenant) => {
      await this.branch(tx, tenant, branchId, data.resources.length > 0);
      const service = await tx.serviceOffering.findFirst({
        where: { id: serviceId, establishmentId: tenant },
      });
      if (!service) missing();
      if (data.resources.length && !service.active)
        conflict("Activa el servicio antes de añadir recursos");
      const key = { establishmentId: tenant, branchId, serviceId };
      const current = await tx.serviceResourceSet.findUnique({
        where: { establishmentId_branchId_serviceId: key },
      });
      sameVersion(current?.version, data.version);
      for (const item of data.resources) {
        const r = await tx.physicalResource.findFirst({
          where: { id: item.resourceId, establishmentId: tenant, branchId },
        });
        if (!r) missing();
        if (!r.active || r.capacity < item.units)
          conflict("El recurso debe estar activo y tener capacidad suficiente");
      }
      await tx.serviceResourceSet.upsert({
        where: { establishmentId_branchId_serviceId: key },
        create: key,
        update: { version: { increment: 1 } },
      });
      await tx.serviceResourceRequirement.updateMany({
        where: { ...key, active: true },
        data: { active: false },
      });
      for (const item of data.resources) {
        const relation = { ...key, resourceId: item.resourceId };
        await tx.serviceResourceRequirement.upsert({
          where: { establishmentId_branchId_serviceId_resourceId: relation },
          create: { ...relation, units: item.units },
          update: { units: item.units, active: true },
        });
      }
      return serviceId;
    });
  }
}
