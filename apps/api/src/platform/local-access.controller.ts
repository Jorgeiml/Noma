import {
  Body,
  Controller,
  Delete,
  Post,
  Req,
  Res,
  BadRequestException,
  HttpCode,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { LocalIdentityService, localCookie } from "./local-identity.service";
import { cookieToken } from "./local.guard";
import { CommercialService } from "../commercial/commercial.service";
import {
  commercialCookie,
  commercialCookieOptions,
  readCookie,
} from "../commercial/commercial.config";
import {
  requireLocalAccess,
  requireLocalRequest,
  requireOrigin,
} from "./local-policy";

@Controller("local-access/session")
export class LocalAccessController {
  constructor(
    private readonly identity: LocalIdentityService,
    private readonly commercial: CommercialService,
  ) {}
  private check(request: Request): void {
    requireLocalAccess();
    requireLocalRequest(request.socket.remoteAddress);
    requireOrigin(request.headers.origin);
  }
  @Post()
  @HttpCode(204)
  async login(
    @Req() request: Request,
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    this.check(request);
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).some((key) => key !== "code")
    )
      throw new BadRequestException("Solicitud de acceso inválida");
    const token = await this.identity.exchange(
      (body as { code?: unknown }).code,
    );
    await this.commercial.revoke(
      readCookie(request.headers.cookie, commercialCookie()),
    );
    response.clearCookie(commercialCookie(), commercialCookieOptions());
    response.cookie(localCookie, token, {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      path: "/api",
      maxAge: 8 * 60 * 60 * 1000,
    });
    response.setHeader("Cache-Control", "no-store");
  }
  @Delete()
  @HttpCode(204)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    this.check(request);
    await this.identity.logout(cookieToken(request));
    response.clearCookie(localCookie, {
      httpOnly: true,
      sameSite: "strict",
      path: "/api",
    });
  }
}
