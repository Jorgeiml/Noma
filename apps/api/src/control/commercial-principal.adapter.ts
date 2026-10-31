import { Injectable, ForbiddenException } from "@nestjs/common";
import type { Request } from "express";
import { CommercialService } from "../commercial/commercial.service";
import { commercialCookie, readCookie } from "../commercial/commercial.config";
import { trustedLocal, type ControlPrincipal } from "./control.policy";
@Injectable()
export class CommercialPrincipalAdapter {
  constructor(private readonly commercial: CommercialService) {}
  async resolve(request: Request): Promise<ControlPrincipal> {
    // Reuses the existing opaque session. No tenant selection, local credential fallback or provider SDK.
    const session = await this.commercial.session(
      readCookie(request.headers.cookie, commercialCookie()),
    );
    if (!session.identity.verifiedAt)
      throw new ForbiddenException(
        "Verifica tu identidad antes de acceder a Noma Control.",
      );
    await this.commercial.rate(
      "control.requests",
      session.identity.userId,
      300,
    );
    return {
      userId: session.identity.userId,
      identityId: session.identityId,
      sessionId: session.id,
      sessionDigest: session.digest,
      name: session.identity.user.displayName,
      mfaVerified: false,
      localDevelopment: trustedLocal(request.socket.remoteAddress),
    };
  }
}
