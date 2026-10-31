import { ForbiddenException } from "@nestjs/common";
import { loadConfig } from "../config";
import {
  ROLE_PERMISSIONS,
  type ControlPermission,
  type PlatformRoleName,
} from "./control.contract";
export type ControlPrincipal = {
  userId: string;
  identityId: string;
  sessionId: string;
  sessionDigest: string;
  name: string;
  mfaVerified: boolean;
  localDevelopment: boolean;
};
export function controlOrigin(env = process.env): string {
  const value = env.CONTROL_WEB_ORIGIN ?? loadConfig(env).webOrigin;
  const parsed = new URL(value);
  if (
    parsed.origin !== value ||
    parsed.username ||
    parsed.password ||
    !["https:", "http:"].includes(parsed.protocol) ||
    (parsed.protocol !== "https:" &&
      (env.NODE_ENV === "production" ||
        !["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)))
  )
    throw new Error(
      "CONTROL_WEB_ORIGIN debe ser un origen administrativo válido y seguro.",
    );
  return value;
}
export function trustedLocal(address: string | undefined, env = process.env) {
  return (
    env.NODE_ENV === "development" &&
    env.APP_ENV === "local" &&
    ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(address ?? "") &&
    ["localhost", "127.0.0.1", "[::1]"].includes(
      new URL(controlOrigin(env)).hostname,
    )
  );
}
export function assertPermission(
  role: PlatformRoleName | undefined,
  permission: ControlPermission,
) {
  if (!role || !ROLE_PERMISSIONS[role]?.includes(permission))
    throw new ForbiddenException(
      "Tu cuenta no tiene permiso para esta operación de Noma Control.",
    );
}
export function assertStrongAuthentication(
  principal: ControlPrincipal,
  env = process.env,
) {
  if (
    principal.mfaVerified ||
    (principal.localDevelopment &&
      env.NODE_ENV === "development" &&
      env.APP_ENV === "local")
  )
    return;
  throw new ForbiddenException(
    "MFA_REQUIRED: no hay evidencia verificable de MFA. Las operaciones administrativas sensibles están bloqueadas en este entorno.",
  );
}
