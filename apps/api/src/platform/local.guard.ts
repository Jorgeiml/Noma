import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { LocalIdentityService, localCookie } from "./local-identity.service";
import { CommercialService } from "../commercial/commercial.service";
import {
  commercialCookie,
  commercialConfig,
  readCookie,
} from "../commercial/commercial.config";
import {
  requireLocalAccess,
  requireLocalRequest,
  requireOrigin,
} from "./local-policy";

export type OwnerContext = Awaited<
  ReturnType<LocalIdentityService["context"]>
> & { identityMode?: "commercial" | "local" };
export type OwnerRequest = Request & { owner: OwnerContext };
export function cookieToken(req: Request): string | undefined {
  return req.headers.cookie
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${localCookie}=`))
    ?.slice(localCookie.length + 1);
}

@Injectable()
export class LocalOwnerGuard implements CanActivate {
  constructor(
    private readonly identity: LocalIdentityService,
    private readonly commercial: CommercialService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    context
      .switchToHttp()
      .getResponse<Response>()
      .setHeader("Cache-Control", "no-store");
    const request = context.switchToHttp().getRequest<OwnerRequest>();
    // Commercial cookies take precedence; invalid commercial sessions never downgrade to local credentials.
    const commercial = readCookie(request.headers.cookie, commercialCookie());
    const hasCommercialCookie = request.headers.cookie
      ?.split(";")
      .some((value) => value.trim().startsWith(`${commercialCookie()}=`));
    if (hasCommercialCookie || (commercialConfig() && !cookieToken(request))) {
      if (!["GET", "HEAD"].includes(request.method))
        requireOrigin(request.headers.origin);
      request.owner = await this.commercial.owner(commercial);
      return true;
    }
    requireLocalAccess();
    requireLocalRequest(request.socket.remoteAddress);
    if (!["GET", "HEAD"].includes(request.method))
      requireOrigin(request.headers.origin);
    request.owner = await this.identity.context(cookieToken(request));
    return true;
  }
}
