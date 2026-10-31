import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import type { Configuration } from "openid-client";
import { requireCommercialConfig, commercialConfig } from "./commercial.config";
export interface VerifiedIdentity {
  issuer: string;
  subject: string;
  email: string;
  verified: boolean;
  expiresAt: Date;
}
export interface OidcSecrets {
  verifier: string;
  nonce: string;
  next: string;
}
@Injectable()
export class OidcProvider {
  constructor() {
    commercialConfig();
  }
  private async configuration(): Promise<Configuration> {
    const config = requireCommercialConfig();
    const client = await import("openid-client");
    return client.discovery(
      new URL(config.issuer),
      config.clientId,
      {
        client_secret: config.clientSecret,
        id_token_signed_response_alg: "RS256",
      },
      client.ClientSecretPost(config.clientSecret),
      { timeout: 5, execute: [client.enableNonRepudiationChecks] },
    );
  }
  async begin(
    mode: "login" | "signup" | "recover",
    state: string,
    secrets: OidcSecrets,
    email?: string,
  ) {
    const oidc = await import("openid-client");
    const config = requireCommercialConfig();
    return oidc.buildAuthorizationUrl(await this.configuration(), {
      redirect_uri: config.redirectUri,
      scope: "openid email profile",
      response_type: "code",
      response_mode: "query",
      state,
      nonce: secrets.nonce,
      code_challenge_method: "S256",
      code_challenge: await oidc.calculatePKCECodeChallenge(secrets.verifier),
      prompt: "login",
      ...(mode === "signup" ? { screen_hint: "signup" } : {}),
      ...(email ? { login_hint: email } : {}),
    }).href;
  }
  async exchange(
    callback: URL,
    state: string,
    secrets: OidcSecrets,
  ): Promise<VerifiedIdentity> {
    const oidc = await import("openid-client");
    const config = requireCommercialConfig();
    const tokens = await oidc.authorizationCodeGrant(
      await this.configuration(),
      callback,
      {
        expectedState: state,
        expectedNonce: secrets.nonce,
        pkceCodeVerifier: secrets.verifier,
        idTokenExpected: true,
      },
    );
    const claims = tokens.claims();
    if (
      !claims ||
      claims.iss !== config.issuer ||
      typeof claims.sub !== "string" ||
      !claims.sub ||
      claims.sub.length > 255 ||
      typeof claims.email !== "string" ||
      claims.email.length > 320 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claims.email) ||
      typeof claims.exp !== "number"
    )
      throw new UnauthorizedException("Identidad no válida.");
    // Neither provider access/refresh tokens nor ID tokens leave this adapter or enter DB/logs.
    return {
      issuer: config.issuer,
      subject: claims.sub,
      email: claims.email,
      verified: claims.email_verified === true,
      expiresAt: new Date(claims.exp * 1000),
    };
  }
  async resend(subject: string): Promise<void> {
    const config = requireCommercialConfig();
    if (
      !process.env.AUTH0_MANAGEMENT_CLIENT_ID ||
      !process.env.AUTH0_MANAGEMENT_CLIENT_SECRET
    )
      throw new ServiceUnavailableException(
        "El reenvío de verificación todavía no está configurado.",
      );
    const tokenResponse = await fetch(new URL("oauth/token", config.issuer), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
        client_secret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
        audience: `${config.issuer}api/v2/`,
      }),
    });
    if (!tokenResponse.ok)
      throw new ServiceUnavailableException(
        "No se pudo solicitar la verificación. Intenta más tarde.",
      );
    const token = (await tokenResponse.json()) as { access_token?: unknown };
    if (typeof token.access_token !== "string")
      throw new ServiceUnavailableException("Verificación no disponible.");
    const result = await fetch(
      new URL("api/v2/jobs/verification-email", config.issuer),
      {
        method: "POST",
        signal: AbortSignal.timeout(5000),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.access_token}`,
        },
        body: JSON.stringify({ user_id: subject, client_id: config.clientId }),
      },
    );
    if (!result.ok)
      throw new ServiceUnavailableException(
        "No se pudo solicitar la verificación. Intenta más tarde.",
      );
  }
  async logoutUrl() {
    const oidc = await import("openid-client");
    const config = requireCommercialConfig();
    return oidc.buildEndSessionUrl(await this.configuration(), {
      client_id: config.clientId,
      post_logout_redirect_uri: `${config.webOrigin}/login`,
    }).href;
  }
}
