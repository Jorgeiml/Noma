import {
  Injectable,
  SetMetadata,
  ForbiddenException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { PrismaService } from "../persistence/prisma.service";
import { CommercialPrincipalAdapter } from "./commercial-principal.adapter";
import {
  assertPermission,
  assertStrongAuthentication,
  controlOrigin,
  type ControlPrincipal,
} from "./control.policy";
import type { ControlPermission, PlatformRoleName } from "./control.contract";
export const NeedsControl = (permission: ControlPermission) =>
  SetMetadata("control.permission", permission);
export type ControlRequest = Request & {
  control: ControlPrincipal;
  platformRole: PlatformRoleName;
};
@Injectable()
export class ControlGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly principal: CommercialPrincipalAdapter,
    private readonly prisma: PrismaService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<ControlRequest>();
    context
      .switchToHttp()
      .getResponse<{ setHeader: (key: string, value: string) => void }>()
      .setHeader("Cache-Control", "no-store");
    const permission = this.reflector.getAllAndOverride<
      ControlPermission | undefined
    >("control.permission", [context.getHandler(), context.getClass()]);
    if (!permission)
      throw new ForbiddenException("Operación de Control no habilitada.");
    req.control = await this.principal.resolve(req);
    const access = await this.prisma.client.platformAccess.findUnique({
      where: { userId: req.control.userId },
    });
    assertPermission(
      access && !access.revokedAt ? access.role : undefined,
      permission,
    );
    req.platformRole = access!.role;
    if (!["GET", "HEAD"].includes(req.method)) {
      if (req.headers.origin !== controlOrigin())
        throw new ForbiddenException("Origen administrativo no autorizado.");
      assertStrongAuthentication(req.control);
    }
    return true;
  }
}
