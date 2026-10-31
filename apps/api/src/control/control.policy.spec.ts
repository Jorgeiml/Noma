import {
  assertPermission,
  assertStrongAuthentication,
  controlOrigin,
  trustedLocal,
  type ControlPrincipal,
} from "./control.policy";
import { CONTROL_PERMISSIONS, PLATFORM_ROLES } from "./control.contract";
import {
  activationOf,
  decisionOf,
  pageOf,
  roleOf,
  reasonOf,
} from "./control.dto";
const id = "1d89ee3e-1afd-42cf-a6d9-9947aa4fdf3f";
const base = {
  requestId: id,
  confirmId: id,
  reason: "Revisión administrativa documentada",
};
const principal: ControlPrincipal = {
  userId: id,
  identityId: id,
  sessionId: id,
  sessionDigest: "a".repeat(64),
  name: "Fixture",
  mfaVerified: false,
  localDevelopment: true,
};
it.each(PLATFORM_ROLES)(
  "%s tiene consultas explícitas y no hereda un rol de negocio",
  (role) => {
    expect(() => assertPermission(role, "dashboard.read")).not.toThrow();
    expect(() => assertPermission(undefined, "dashboard.read")).toThrow();
  },
);
it("solo el propietario puede gestionar roles; facturación y soporte no pueden activar", () => {
  for (const role of [
    "PLATFORM_ADMIN",
    "BILLING_MANAGER",
    "SUPPORT_AGENT",
  ] as const)
    expect(() => assertPermission(role, "roles.manage")).toThrow();
  for (const role of ["BILLING_MANAGER", "SUPPORT_AGENT"] as const)
    expect(() => assertPermission(role, "subscriptions.manage")).toThrow();
  CONTROL_PERMISSIONS.forEach((permission) =>
    expect(() => assertPermission("PLATFORM_OWNER", permission)).not.toThrow(),
  );
});
it("sin evidencia MFA no permite mutaciones fuera del entorno local", () => {
  expect(() =>
    assertStrongAuthentication(principal, {
      NODE_ENV: "development",
      APP_ENV: "local",
    }),
  ).not.toThrow();
  expect(() =>
    assertStrongAuthentication(principal, {
      NODE_ENV: "production",
      APP_ENV: "local",
    }),
  ).toThrow("MFA_REQUIRED");
  expect(() =>
    assertStrongAuthentication(
      { ...principal, localDevelopment: false },
      { NODE_ENV: "development", APP_ENV: "local" },
    ),
  ).toThrow();
  expect(() =>
    assertStrongAuthentication(principal, {
      NODE_ENV: "development",
      APP_ENV: "staging",
    }),
  ).toThrow();
});
it("no confía en direcciones externas ni en orígenes administrativos inseguros", () => {
  const env = {
    NODE_ENV: "development",
    APP_ENV: "local",
    WEB_ORIGIN: "http://localhost:5173",
  };
  expect(trustedLocal("127.0.0.1", env)).toBe(true);
  expect(trustedLocal("192.0.2.4", env)).toBe(false);
  expect(() =>
    controlOrigin({
      ...env,
      NODE_ENV: "production",
      CONTROL_WEB_ORIGIN: "http://localhost:5173",
    }),
  ).toThrow();
  expect(() =>
    controlOrigin({
      ...env,
      CONTROL_WEB_ORIGIN: "https://control.example/path",
    }),
  ).toThrow();
});
it("limita paginación y rechaza parámetros de privilegios o tenant", () => {
  expect(pageOf({ page: "2", size: "25", q: "Noma" })).toMatchObject({
    page: 2,
    size: 25,
    q: "Noma",
  });
  for (const value of [
    { size: "1000" },
    { page: "0" },
    { page: "2.1" },
    { tenantId: id },
    { role: "PLATFORM_OWNER" },
  ])
    expect(() => pageOf(value)).toThrow();
});
it("valida decisiones, planes y roles sin admitir propietario desde la web", () => {
  expect(
    decisionOf({ ...base, decision: "APPROVED", version: 0 }).decision,
  ).toBe("APPROVED");
  expect(() => decisionOf({ ...base, decision: "PAID", version: 0 })).toThrow();
  expect(() =>
    activationOf({
      ...base,
      plan: "START",
      membershipId: null,
      expiresAt: "sin límite",
    }),
  ).toThrow();
  expect(() =>
    activationOf({
      ...base,
      plan: "FREE",
      membershipId: null,
      expiresAt: "2027-01-01T12:00:00Z",
    }),
  ).toThrow();
  expect(() =>
    roleOf({ ...base, role: "PLATFORM_OWNER", version: null }),
  ).toThrow();
  expect(() =>
    roleOf({
      ...base,
      role: "SUPPORT_AGENT",
      version: null,
      email: "admin@example.test",
    }),
  ).toThrow();
});
it("no acepta motivos vacíos o credenciales en la auditoría", () => {
  for (const reason of [
    "",
    "corto",
    "Bearer secret-token-value",
    "password=secret123456",
  ])
    expect(() => reasonOf(reason)).toThrow();
});
