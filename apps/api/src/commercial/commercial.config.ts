import { ServiceUnavailableException } from "@nestjs/common";
import { loadConfig } from "../config";
export interface CommercialConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  key: Buffer;
  webOrigin: string;
  production: boolean;
}
export function commercialConfig(env = process.env): CommercialConfig | null {
  if (env.COMMERCIAL_AUTH_ENABLED !== "true") return null;
  const app = loadConfig(env);
  try {
    const issuer = new URL(env.OIDC_ISSUER ?? "");
    const callback = new URL(env.OIDC_REDIRECT_URI ?? "");
    const web = new URL(app.webOrigin);
    if (
      issuer.protocol !== "https:" ||
      issuer.username ||
      issuer.password ||
      issuer.search ||
      issuer.hash ||
      issuer.pathname !== "/" ||
      !env.OIDC_CLIENT_ID ||
      !env.OIDC_CLIENT_SECRET ||
      !/^[a-fA-F0-9]{64}$/.test(env.COMMERCIAL_STATE_KEY ?? "") ||
      callback.origin !== web.origin ||
      callback.pathname !== "/api/auth/callback" ||
      callback.search ||
      callback.hash ||
      callback.username ||
      callback.password ||
      (app.environment === "production" && web.protocol !== "https:") ||
      (web.protocol !== "https:" &&
        !["localhost", "127.0.0.1", "[::1]"].includes(web.hostname))
    )
      throw new Error();
    return {
      issuer: issuer.href,
      clientId: env.OIDC_CLIENT_ID,
      clientSecret: env.OIDC_CLIENT_SECRET,
      redirectUri: callback.href,
      key: Buffer.from(env.COMMERCIAL_STATE_KEY!, "hex"),
      webOrigin: app.webOrigin,
      production: app.environment === "production",
    };
  } catch {
    throw new Error(
      "Configuración OIDC incompleta o insegura; revisar variables comerciales sin imprimir secretos.",
    );
  }
}
export function requireCommercialConfig(): CommercialConfig {
  const config = commercialConfig();
  if (!config)
    throw new ServiceUnavailableException(
      "El acceso comercial todavía no está configurado.",
    );
  return config;
}
export const commercialCookie = (env = process.env) =>
  env.NODE_ENV === "production"
    ? "__Host-noma_session"
    : "noma_commercial_session";
export const attemptCookie = (env = process.env) =>
  env.NODE_ENV === "production" ? "__Host-noma_oidc" : "noma_oidc";
export function readCookie(header: string | undefined, name: string) {
  const matches = header
    ?.split(";")
    .map((v) => v.trim())
    .filter((v) => v.startsWith(`${name}=`));
  return matches?.length === 1 ? matches[0]!.slice(name.length + 1) : undefined;
}
export function commercialCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}
export const safeNext = (value: unknown): string =>
  typeof value === "string" &&
  ["/app/establecimiento", "/app/servicios", "/app/equipo"].includes(value)
    ? value
    : "/app/establecimiento";
