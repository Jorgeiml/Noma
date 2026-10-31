import {
  ForbiddenException,
  Injectable,
  SetMetadata,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { OwnerRequest } from "../platform/local.guard";
import { sectorConfiguration, type Capability } from "./sector.contract";
const metadata = "appointments:capabilities";
export const RequireCapabilities = (...capabilities: Capability[]) =>
  SetMetadata(metadata, capabilities);
@Injectable()
export class SectorCapabilityGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const owner = context.switchToHttp().getRequest<OwnerRequest>().owner;
    if (!owner) throw new ForbiddenException("Sesión autorizada requerida");
    const config = sectorConfiguration(owner.vertical);
    const required = this.reflector.getAllAndOverride<Capability[]>(metadata, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (
      !required?.length ||
      required.some(
        (capability) => config.capabilities[capability] !== "IMPLEMENTED",
      )
    )
      throw new ForbiddenException(
        owner.vertical === null
          ? "El establecimiento requiere clasificación sectorial administrada. Sus datos se conservan."
          : "Esta capacidad todavía no está disponible para el sector configurado.",
      );
    return true;
  }
}
