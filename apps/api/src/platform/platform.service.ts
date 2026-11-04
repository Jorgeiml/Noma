import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../persistence/prisma.service";
import type { OwnerContext } from "./local.guard";
import type { EstablishmentUpdateDto } from "./establishment.dto";
import { sectorConfiguration } from "../sector/sector.contract";
import type { LogoDto } from "./logo.dto";
import { businessAuthorization } from "../commercial/business-authorization";

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}
  private authorize(owner: OwnerContext, id: string): void {
    if (id !== owner.establishmentId)
      throw new ForbiddenException("Establecimiento no autorizado");
  }
  async read(owner: OwnerContext, id: string) {
    this.authorize(owner, id);
    const establishment = await this.prisma.client.establishment.findFirst({
      where: {
        id: owner.establishmentId,
        status: "ACTIVE",
        memberships: {
          some: {
            id: owner.membershipId,
            userId: owner.userId,
            status: "ACTIVE",
          },
        },
      },
    });
    if (!establishment)
      throw new NotFoundException("Establecimiento no disponible");
    return {
      ...establishment,
      sectorConfiguration: sectorConfiguration(establishment.vertical),
    };
  }
  async update(owner: OwnerContext, id: string, dto: EstablishmentUpdateDto) {
    const { version, ...data } = dto;
    return this.updateFields(owner, id, data, version);
  }
  updateLogo(owner: OwnerContext, id: string, dto: LogoDto) {
    return this.updateFields(
      owner,
      id,
      { logoDataUrl: dto.logoDataUrl },
      dto.version,
    );
  }
  private async updateFields(
    owner: OwnerContext,
    id: string,
    data: Partial<Omit<EstablishmentUpdateDto, "version">> & {
      logoDataUrl?: string | null;
    },
    version: number,
  ) {
    this.authorize(owner, id);
    return this.prisma.client.$transaction(async (tx) => {
      if (owner.identityMode === "commercial") {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('noma-control-writes',0))`;
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${owner.establishmentId},0))`;
        await businessAuthorization(tx, owner);
      }
      const updated = await tx.establishment.updateMany({
        where: {
          id: owner.establishmentId,
          version,
          status: "ACTIVE",
          memberships: {
            some: {
              id: owner.membershipId,
              userId: owner.userId,
              status: "ACTIVE",
            },
          },
        },
        data: { ...data, version: { increment: 1 } },
      });
      if (updated.count !== 1)
        throw new ConflictException(
          "El establecimiento cambió. Conservamos tu edición; revisa los datos actuales antes de volver a guardar.",
        );
      const establishment = await tx.establishment.findUniqueOrThrow({
        where: { id: owner.establishmentId },
      });
      return {
        ...establishment,
        sectorConfiguration: sectorConfiguration(establishment.vertical),
      };
    });
  }
}
