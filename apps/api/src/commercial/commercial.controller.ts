import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { CommercialService } from "./commercial.service";
import { OidcProvider } from "./oidc.provider";
import {
  attemptCookie,
  commercialCookie,
  commercialCookieOptions,
  commercialConfig,
  readCookie,
  requireCommercialConfig,
  safeNext,
} from "./commercial.config";
import { localAccessAllowed, requireOrigin } from "../platform/local-policy";
import { localCookie } from "../platform/local-identity.service";
import { COMMERCIAL_PLANS, PLAN_IDS, PLAN_TERMS } from "./plan.contract";

export function strictBody(
  value: unknown,
  allowed: string[],
): Record<string, unknown> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => !allowed.includes(key))
  )
    throw new BadRequestException("Solicitud no válida.");
  return value as Record<string, unknown>;
}
@Controller("auth")
export class CommercialController {
  constructor(
    private readonly service: CommercialService,
    private readonly provider: OidcProvider,
  ) {}
  private protect(request: Request, response: Response) {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("X-Content-Type-Options", "nosniff");
    if (!["GET", "HEAD"].includes(request.method)) {
      requireOrigin(request.headers.origin);
      if (!request.is("application/json"))
        throw new BadRequestException("Se requiere JSON.");
    }
    return readCookie(request.headers.cookie, commercialCookie());
  }
  @Get("configuration")
  configuration(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.protect(request, response);
    return {
      enabled: !!commercialConfig(),
      localEnabled: localAccessAllowed(process.env),
      plans: COMMERCIAL_PLANS,
      planIds: PLAN_IDS,
      terms: PLAN_TERMS,
    };
  }
  @Post("start")
  @HttpCode(200)
  async start(
    @Req() request: Request,
    @Body() input: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.protect(request, response);
    requireCommercialConfig();
    const body = strictBody(input, ["mode", "email", "next"]);
    if (
      !["login", "signup", "recover"].includes(String(body.mode)) ||
      (body.email !== undefined &&
        (typeof body.email !== "string" ||
          body.email.length > 320 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))) ||
      (body.next !== undefined && typeof body.next !== "string")
    )
      throw new BadRequestException("Solicitud de identidad no válida.");
    await this.service.rate(
      "start",
      request.socket.remoteAddress ?? "unknown",
      30,
    );
    try {
      const result = await this.service.begin(
        body.mode as "login" | "signup" | "recover",
        body.next,
        body.email as string | undefined,
        readCookie(request.headers.cookie, attemptCookie()),
      );
      response.cookie(attemptCookie(), result.browser, {
        ...commercialCookieOptions(),
        maxAge: 600_000,
      });
      return { authorizationUrl: result.url };
    } catch {
      throw new ServiceUnavailableException(
        "No se pudo conectar con el proveedor de identidad. Intenta más tarde.",
      );
    }
  }
  @Get("callback")
  async callback(@Req() request: Request, @Res() response: Response) {
    const old = this.protect(request, response);
    const config = commercialConfig();
    const origin =
      config?.webOrigin ?? process.env.WEB_ORIGIN ?? "http://localhost:5173";
    if (!config)
      return response.redirect(303, `${origin}/login?error=configuration`);
    try {
      await this.service.rate(
        "callback",
        request.socket.remoteAddress ?? "unknown",
        60,
      );
      const callback = new URL(config.redirectUri);
      callback.search = new URL(request.originalUrl, config.webOrigin).search;
      const result = await this.service.callback(
        callback,
        readCookie(request.headers.cookie, attemptCookie()),
        old,
      );
      // An unsolicited invalid callback must not erase a different, valid browser attempt.
      response.clearCookie(attemptCookie(), commercialCookieOptions());
      response.clearCookie(localCookie, {
        httpOnly: true,
        sameSite: "strict",
        path: "/api",
      });
      response.cookie(commercialCookie(), result.token, {
        ...commercialCookieOptions(),
        maxAge: 8 * 3600_000,
      });
      return response.redirect(
        303,
        `${origin}${result.next}?next=${encodeURIComponent(safeNext(result.returnTo))}`,
      );
    } catch {
      return response.redirect(303, `${origin}/login?error=identity`);
    }
  }
  @Get("session")
  account(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.service.account(this.protect(request, response));
  }
  @Post("logout")
  @HttpCode(200)
  async logout(
    @Req() request: Request,
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = this.protect(request, response);
    strictBody(body, []);
    await this.service.revoke(token);
    await this.service.cancelAttempt(
      readCookie(request.headers.cookie, attemptCookie()),
    );
    response.clearCookie(commercialCookie(), commercialCookieOptions());
    response.clearCookie(attemptCookie(), commercialCookieOptions());
    let logoutUrl: string | null = null;
    if (commercialConfig()) {
      try {
        logoutUrl = await this.provider.logoutUrl();
      } catch {
        /* Local revocation succeeds even when the IdP is unavailable. */
      }
    }
    return { logoutUrl };
  }
  @Post("verification/resend")
  @HttpCode(202)
  async resend(
    @Req() request: Request,
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = this.protect(request, response);
    strictBody(body, []);
    try {
      await this.service.resend(token);
    } catch (error) {
      if (error instanceof Error && "getStatus" in error) throw error;
      throw new ServiceUnavailableException(
        "No se pudo solicitar la verificación. Intenta más tarde.",
      );
    }
    return {
      message:
        "Si corresponde, el proveedor procesará la verificación de esta identidad.",
    };
  }
  @Post("plan")
  @HttpCode(204)
  async plan(
    @Req() request: Request,
    @Body() input: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = this.protect(request, response);
    const body = strictBody(input, ["plan"]);
    await this.service.selectPlan(token, body.plan);
  }
  @Post("activation-request")
  @HttpCode(204)
  async activate(
    @Req() request: Request,
    @Body() input: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = this.protect(request, response);
    strictBody(input, []);
    await this.service.requestActivation(token);
  }
  @Post("membership")
  @HttpCode(204)
  async membership(
    @Req() request: Request,
    @Body() input: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = this.protect(request, response);
    const body = strictBody(input, ["membershipId"]);
    if (
      typeof body.membershipId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        body.membershipId,
      )
    )
      throw new BadRequestException("Selecciona una membresía válida.");
    const next = await this.service.selectMembership(token, body.membershipId);
    response.cookie(commercialCookie(), next, {
      ...commercialCookieOptions(),
      maxAge: 8 * 3600_000,
    });
  }
}
