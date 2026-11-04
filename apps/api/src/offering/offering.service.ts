import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../persistence/prisma.service";
import type { OwnerContext } from "../platform/local.guard";
import { businessAuthorization } from "../commercial/business-authorization";
import {
  validateCurrencyPrecision,
  type OfferingDto,
  type UpdateOfferingDto,
  type OfferingStatusDto,
} from "./offering.dto";

@Injectable()
export class OfferingService {
  constructor(private readonly prisma: PrismaService) {}
  private scope(owner: OwnerContext) {
    return {
      establishmentId: owner.establishmentId,
      establishment: {
        status: "ACTIVE" as const,
        memberships: {
          some: {
            id: owner.membershipId,
            userId: owner.userId,
            status: "ACTIVE" as const,
            role: "OWNER" as const,
          },
        },
      },
    };
  }
  async list(owner: OwnerContext) {
    return this.prisma.client.serviceOffering.findMany({
      where: this.scope(owner),
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
  }
  async remove(owner: OwnerContext, id: string, version: number) {
    return this.prisma.client.$transaction(async (tx) => {
      if (owner.identityMode === "commercial")
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('noma-control-writes',0))`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${owner.establishmentId}, 0))`;
      await businessAuthorization(tx, owner);
      const current = await tx.serviceOffering.findFirst({
        where: { id, ...this.scope(owner) },
      });
      if (!current)
        throw new NotFoundException(
          "Servicio no disponible en tu establecimiento",
        );
      if (current.version !== version)
        throw new ConflictException(
          "El servicio cambió. Actualiza el catálogo antes de eliminarlo.",
        );
      if (
        await tx.appointment.count({
          where: { establishmentId: owner.establishmentId, serviceId: id },
        })
      )
        throw new ConflictException(
          "Este servicio tiene citas. Desactívalo para conservar su historial.",
        );
      const where = { establishmentId: owner.establishmentId, serviceId: id };
      await tx.professionalService.deleteMany({ where });
      await tx.serviceResourceRequirement.deleteMany({ where });
      await tx.serviceResourceSet.deleteMany({ where });
      const deleted = await tx.serviceOffering.deleteMany({
        where: { id, version, ...this.scope(owner) },
      });
      if (deleted.count !== 1)
        throw new ConflictException(
          "El servicio cambió. Actualiza el catálogo antes de eliminarlo.",
        );
      return { id };
    });
  }
  async read(owner: OwnerContext, id: string) {
    const service = await this.prisma.client.serviceOffering.findFirst({
      where: { id, ...this.scope(owner) },
    });
    if (!service)
      throw new NotFoundException(
        "Servicio no disponible en tu establecimiento",
      );
    return service;
  }
  async create(
    owner: OwnerContext,
    data: OfferingDto,
    expectedCurrency: string | undefined,
  ) {
    if (!expectedCurrency)
      throw new BadRequestException(
        "Indica la moneda mostrada mediante X-Catalog-Currency",
      );
    if (expectedCurrency !== owner.currency)
      throw new ConflictException(
        "La moneda del establecimiento cambió. Conservamos tu edición; vuelve al establecimiento para cargar su configuración actual.",
      );
    validateCurrencyPrecision(data, owner.currency);
    if (owner.identityMode === "commercial")
      return this.prisma.client.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('noma-control-writes',0))`;
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${owner.establishmentId},0))`;
        await businessAuthorization(tx, owner);
        return tx.serviceOffering.create({
          data: {
            ...data,
            currency: owner.currency,
            establishmentId: owner.establishmentId,
          },
        });
      });
    return this.prisma.client.serviceOffering.create({
      data: {
        ...data,
        currency: owner.currency,
        establishmentId: owner.establishmentId,
      },
    });
  }
  async update(
    owner: OwnerContext,
    id: string,
    input: UpdateOfferingDto | OfferingStatusDto,
  ) {
    const current = await this.read(owner, id);
    if ("priceMode" in input)
      validateCurrencyPrecision(input, current.currency);
    const { version, ...data } = input;
    return this.prisma.client.$transaction(async (tx) => {
      if (owner.identityMode === "commercial") {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('noma-control-writes',0))`;
      }
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${owner.establishmentId},0))`;
      await businessAuthorization(tx, owner);
      const result = await tx.serviceOffering.updateMany({
        where: { id, ...this.scope(owner), version },
        data: { ...data, version: { increment: 1 } },
      });
      if (result.count !== 1)
        throw new ConflictException(
          "El servicio cambió en otra ventana. Conservamos tu edición; vuelve a cargar antes de guardar.",
        );
      return tx.serviceOffering.findFirstOrThrow({
        where: { id, establishmentId: owner.establishmentId },
      });
    });
  }
}
