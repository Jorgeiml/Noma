// Provider-independent, static policy shared with the internal interface.
export const PLATFORM_ROLES = [
  "PLATFORM_OWNER",
  "PLATFORM_ADMIN",
  "BILLING_MANAGER",
  "SUPPORT_AGENT",
] as const;
export type PlatformRoleName = (typeof PLATFORM_ROLES)[number];
export const CONTROL_PERMISSIONS = [
  "dashboard.read",
  "applications.read",
  "applications.decide",
  "businesses.read",
  "subscriptions.read",
  "subscriptions.manage",
  "users.read",
  "audit.read",
  "roles.manage",
] as const;
export type ControlPermission = (typeof CONTROL_PERMISSIONS)[number];
export const ROLE_PERMISSIONS: Record<
  PlatformRoleName,
  readonly ControlPermission[]
> = {
  PLATFORM_OWNER: CONTROL_PERMISSIONS,
  PLATFORM_ADMIN: CONTROL_PERMISSIONS.filter(
    (value) => value !== "roles.manage",
  ),
  BILLING_MANAGER: ["dashboard.read", "subscriptions.read"],
  SUPPORT_AGENT: ["dashboard.read", "applications.read", "businesses.read"],
};
export const ROLE_LABELS: Record<PlatformRoleName, string> = {
  PLATFORM_OWNER: "Propietario de plataforma",
  PLATFORM_ADMIN: "Administrador de plataforma",
  BILLING_MANAGER: "Gestión comercial",
  SUPPORT_AGENT: "Soporte",
};
export const CONTROL_PAGES = [
  "solicitudes",
  "negocios",
  "suscripciones",
  "usuarios",
  "auditoria",
] as const;
export type ControlPage = "inicio" | (typeof CONTROL_PAGES)[number];
export const PAGE_PERMISSIONS: Record<ControlPage, ControlPermission> = {
  inicio: "dashboard.read",
  solicitudes: "applications.read",
  negocios: "businesses.read",
  suscripciones: "subscriptions.read",
  usuarios: "users.read",
  auditoria: "audit.read",
};
