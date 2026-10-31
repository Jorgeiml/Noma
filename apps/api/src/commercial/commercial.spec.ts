import {
  commercialConfig,
  commercialCookieOptions,
  readCookie,
  safeNext,
} from "./commercial.config";
import { strictBody } from "./commercial.controller";
import { PLAN_IDS, COMMERCIAL_PLANS, PLAN_TERMS } from "./plan.contract";
import {
  assertLocalCommercialDatabase,
  activateSyntheticApplication,
} from "./local-activation";
import type { PrismaService } from "../persistence/prisma.service";
const valid: NodeJS.ProcessEnv = {
  NODE_ENV: "development",
  WEB_ORIGIN: "http://localhost:5173",
  COMMERCIAL_AUTH_ENABLED: "true",
  OIDC_ISSUER: "https://idp.example.test/",
  OIDC_CLIENT_ID: "synthetic-client",
  OIDC_CLIENT_SECRET: "synthetic-secret",
  COMMERCIAL_STATE_KEY: "a".repeat(64),
  OIDC_REDIRECT_URI: "http://localhost:5173/api/auth/callback",
};
describe("Política comercial y contrato", () => {
  it("cierra por defecto y rechaza configuración incompleta", () => {
    expect(commercialConfig({})).toBeNull();
    expect(() =>
      commercialConfig({ COMMERCIAL_AUTH_ENABLED: "true" }),
    ).toThrow();
    expect(commercialConfig(valid)?.issuer).toBe(valid.OIDC_ISSUER);
  });
  it.each([
    { OIDC_ISSUER: "http://idp.example.test/" },
    { OIDC_ISSUER: "https://u:p@idp.example.test/" },
    { OIDC_REDIRECT_URI: "https://evil.example.test/api/auth/callback" },
    { COMMERCIAL_STATE_KEY: "weak" },
    { NODE_ENV: "production" },
    {
      WEB_ORIGIN: "http://public.example.test",
      OIDC_REDIRECT_URI: "http://public.example.test/api/auth/callback",
    },
  ])("rechaza configuración insegura %j", (change) =>
    expect(() => commercialConfig({ ...valid, ...change })).toThrow(),
  );
  it("permite solo retornos privados explícitos y cookies únicas", () => {
    for (const value of [
      "//evil.test",
      "https://evil.test",
      "/app/servicios?paid=true",
      "javascript:alert(1)",
    ])
      expect(safeNext(value)).toBe("/app/establecimiento");
    expect(safeNext("/app/equipo")).toBe("/app/equipo");
    expect(readCookie("session=a; session=b", "session")).toBeUndefined();
    expect(readCookie("other=a; session=abc", "session")).toBe("abc");
    expect(commercialCookieOptions().httpOnly).toBe(true);
  });
  it.each([
    { plan: "GROW", paid: true },
    { role: "OWNER" },
    { establishmentId: "arbitrary" },
    { verified: true },
    { state: "ACTIVE" },
  ])("rechaza parámetros que pretendan elevar permisos o activar %j", (body) =>
    expect(() => strictBody(body, ["plan"])).toThrow(),
  );
  it("centraliza identificadores y propuestas sin checkout", () => {
    expect(PLAN_IDS).toEqual(["START", "GROW", "SCALE", "ENTERPRISE"]);
    expect(COMMERCIAL_PLANS.map((p) => p.monthly)).toEqual([29, 59, 99]);
    expect(PLAN_TERMS.checkoutEnabled).toBe(false);
  });
});
describe("Activación exclusivamente sintética", () => {
  const old = { ...process.env };
  afterEach(() => {
    process.env = { ...old };
  });
  it("rechaza producción antes de consultar o mutar", async () => {
    process.env.NODE_ENV = "production";
    const query = jest.fn();
    const prisma = { client: { $queryRaw: query } } as unknown as PrismaService;
    await expect(
      activateSyntheticApplication(prisma, "synthetic", "synthetic"),
    ).rejects.toThrow();
    expect(query).not.toHaveBeenCalled();
  });
  it("rechaza una base distinta, aunque sea loopback", async () => {
    Object.assign(process.env, {
      NODE_ENV: "development",
      APP_ENV: "local",
      LOCAL_ACCESS_ENABLED: "true",
      DATABASE_URL:
        "postgresql://bw_test:test@localhost:55433/beauty_wellness_test",
    });
    const prisma = {
      client: {
        $queryRaw: jest
          .fn()
          .mockResolvedValue([
            { database: "beauty_wellness_test", username: "bw_test" },
          ]),
      },
    } as unknown as PrismaService;
    await expect(assertLocalCommercialDatabase(prisma)).rejects.toThrow(
      "base y usuario",
    );
  });
  it("no activa cuentas ni negocios existentes que no sean fixtures", async () => {
    Object.assign(process.env, {
      NODE_ENV: "development",
      APP_ENV: "local",
      LOCAL_ACCESS_ENABLED: "true",
      DATABASE_URL:
        "postgresql://bw_local:test@localhost:55432/beauty_wellness_dev",
    });
    const create = jest.fn();
    const tx = {
      commercialApplication: {
        findUnique: jest.fn().mockResolvedValue({
          state: "ACTIVATION_PENDING",
          selectedPlan: "GROW",
          userId: "A",
          user: {
            externalIdentities: [
              { synthetic: false, issuer: valid.OIDC_ISSUER },
            ],
          },
        }),
      },
      membership: {
        findUnique: jest.fn().mockResolvedValue({
          userId: "A",
          role: "OWNER",
          status: "ACTIVE",
          establishment: {
            status: "ACTIVE",
            commercialName: "Negocio existente",
          },
        }),
      },
      commercialSubscription: { create },
    };
    const prisma = {
      client: {
        $queryRaw: jest
          .fn()
          .mockResolvedValue([
            { database: "beauty_wellness_dev", username: "bw_local" },
          ]),
        $transaction: (fn: (value: typeof tx) => unknown) => fn(tx),
      },
    } as unknown as PrismaService;
    await expect(
      activateSyntheticApplication(prisma, "application", "membership"),
    ).rejects.toThrow("Solo se pueden activar fixtures");
    expect(create).not.toHaveBeenCalled();
  });
});
