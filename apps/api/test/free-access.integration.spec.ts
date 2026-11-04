import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { config } from "dotenv";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import type { Server } from "node:http";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { loadConfig } from "../src/config";
import { PrismaService } from "../src/persistence/prisma.service";
import { commercialCookie } from "../src/commercial/commercial.config";
import { bootstrapFirstOwner } from "../src/control/owner-bootstrap";
import { assertTestDatabaseUrl } from "./test-database";
import {
  createControlFixture,
  cleanControlFixture,
  assertControlTestDatabase,
  CONTROL_TEST_ISSUER,
  type ControlFixture,
} from "./control-fixtures";
const root = resolve(__dirname, "..");
config({ path: resolve(root, ".env.test"), quiet: true });
const origin = "http://localhost:5173";
describe("Accesos gratuitos: PostgreSQL real, sin pasarela ni pagos", () => {
  let prisma: PrismaService, app: INestApplication, fixture: ControlFixture;
  const original = { ...process.env };
  const f = () => fixture;
  const http = (method: "get" | "post" | "put", path: string, index = 0) => {
    const agent = request(app.getHttpServer() as Server);
    return agent[method]("/api" + path)
      .set("Cookie", commercialCookie() + "=" + f().tokens[index])
      .set("Origin", origin);
  };
  const grant = (index: number, extra: Record<string, unknown> = {}) => ({
    requestId: randomUUID(),
    confirmId: f().users[index],
    reason: "FREE ACCESS TEST concesión de acceso sin pago",
    plan: "GROW",
    mode: "COURTESY",
    startsAt: new Date(Date.now() - 1000).toISOString(),
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    membershipId: null,
    ...extra,
  });
  const free = (index: number, body = grant(index), actor = 0) =>
    http("post", `/control/users/${f().users[index]}/free-access`, actor).send(
      body,
    );
  const current = (index: number) =>
    http("get", "/onboarding", index).expect(200);
  async function stage(
    index: number,
    path: string,
    extra: Record<string, unknown> = {},
  ) {
    const s = await current(index);
    return http(
      ["business", "sector"].includes(path) ? "put" : "post",
      "/onboarding/" + path,
      index,
    ).send({
      requestId: randomUUID(),
      version: s.body.progress?.version ?? 0,
      ...extra,
    });
  }
  async function createBusiness(index: number) {
    await stage(index, "start").then((r) => expect(r.status).toBe(201));
    await stage(index, "sector", { vertical: "BEAUTY" }).then((r) =>
      expect(r.status).toBe(200),
    );
    const r = await stage(index, "business", {
      business: {
        commercialName: "FREE ACCESS TEST negocio",
        countryCode: "EC",
        city: "Quito",
        address: null,
        businessPhone: "0990000000",
        businessEmail: "billing@example.test",
        timeZone: "America/Guayaquil",
        description: null,
        beautySubtype: "BARBERSHOP",
      },
    });
    expect(r.status).toBe(200);
    const id = r.body.snapshot.configuration.business.id;
    f().tenants.push(id);
    return id;
  }
  beforeAll(async () => {
    const url = assertTestDatabaseUrl(process.env.TEST_DATABASE_URL);
    Object.assign(process.env, {
      DATABASE_URL: url,
      NODE_ENV: "development",
      APP_ENV: "local",
      LOCAL_ACCESS_ENABLED: "true",
      COMMERCIAL_AUTH_ENABLED: "true",
      WEB_ORIGIN: origin,
      OIDC_ISSUER: CONTROL_TEST_ISSUER,
      OIDC_CLIENT_ID: "billing-test",
      OIDC_CLIENT_SECRET: "billing-test-only",
      OIDC_REDIRECT_URI: origin + "/api/auth/callback",
      COMMERCIAL_STATE_KEY: "d".repeat(64),
    });
    delete process.env.CONTROL_WEB_ORIGIN;
    prisma = new PrismaService();
    await assertControlTestDatabase(prisma);
    execFileSync(
      process.execPath,
      [
        resolve(root, "node_modules/prisma/build/index.js"),
        "migrate",
        "deploy",
      ],
      {
        cwd: root,
        env: { ...process.env, DATABASE_URL: url },
        stdio: "pipe",
        timeout: 30000,
      },
    );
    fixture = await createControlFixture(prisma);
    await bootstrapFirstOwner(prisma, {
      userId: f().users[0]!,
      confirmUserId: f().users[0]!,
      reason: "FREE ACCESS TEST propietario",
      evidence: "Fixture aislada sin dinero real",
    });
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication();
    configureApp(app, loadConfig(process.env));
    await app.listen(0, "127.0.0.1");
  });
  afterAll(async () => {
    try {
      if (fixture) {
        const ids = f().applications;
        await prisma.client.onboardingOperation.deleteMany({
          where: { applicationId: { in: ids } },
        });
        await prisma.client.businessOnboarding.deleteMany({
          where: { applicationId: { in: ids } },
        });
        await cleanControlFixture(prisma, f());
      }
    } finally {
      await app?.close();
      jest.restoreAllMocks();
      for (const key of Object.keys(process.env))
        if (!(key in original)) delete process.env[key];
      Object.assign(process.env, original);
    }
  });
  it.each([
    [8, "START", "TEST"],
    [9, "GROW", "COURTESY"],
    [10, "SCALE", "PILOT"],
    [11, "ENTERPRISE", "COURTESY"],
  ])(
    "concede %s/%s sin revisión, checkout, ingreso ni negocio duplicado",
    async (index, plan, mode) => {
      const i = Number(index),
        before = await prisma.client.establishment.count();
      await prisma.client.commercialApplication.update({
        where: { id: f().applications[i]! },
        data: { state: "IDENTITY_VERIFIED", selectedPlan: null },
      });
      const body = grant(i, {
        plan,
        mode,
        ...(plan === "ENTERPRISE"
          ? {
              limits: {
                branches: 2,
                professionals: 3,
                users: 4,
                whatsapp: 1,
                aiSessions: 200,
              },
            }
          : {}),
      });
      const responses = await Promise.all([free(i, body), free(i, body)]);
      expect(responses.map((r) => r.status)).toEqual([201, 201]);
      expect(responses.some((r) => r.body.replayed)).toBe(true);
      const snap = await current(i);
      expect(snap.body.status).toBe("WELCOME");
      expect(snap.body.entitlement.plan).toBe(plan);
      expect(
        await prisma.client.applicationReview.count({
          where: { applicationId: f().applications[i] },
        }),
      ).toBe(0);
      expect(await prisma.client.establishment.count()).toBe(before);
      expect(await prisma.client.billingPayment.count()).toBe(0);
      expect(
        await prisma.client.commercialSubscription.count({
          where: { applicationId: f().applications[i] },
        }),
      ).toBe(0);
      expect(
        await prisma.client.platformAudit.count({
          where: { resourceId: f().users[i], action: "freeAccess.granted" },
        }),
      ).toBe(1);
      await free(i, {
        ...body,
        reason: "Motivo diferente para el mismo intento",
      }).expect(409);
    },
  );
  it("exige límites Enterprise, fechas, identidad verificada y permisos internos", async () => {
    await free(12, grant(12, { plan: "ENTERPRISE" })).expect(400);
    await free(
      12,
      grant(12, {
        plan: "ENTERPRISE",
        limits: {
          branches: 0,
          professionals: 3,
          users: 4,
          whatsapp: 1,
          aiSessions: 100,
        },
      }),
    ).expect(400);
    await free(12, grant(12), 3).expect(403);
    await free(12, grant(12), 2).expect(403);
    await free(12, grant(12), 12).expect(403);
    await free(5).expect(409);
    await free(0).expect(403);
    await free(
      12,
      grant(12, { expiresAt: new Date(Date.now() - 86400000).toISOString() }),
    ).expect(400);
    await free(
      12,
      grant(12, {
        mode: "COURTESY",
        expiresAt: new Date(Date.now() + 200 * 86400000).toISOString(),
      }),
      1,
    ).expect(403);
    await http("post", `/control/users/${f().users[12]}/free-access`)
      .set("Origin", "https://attacker.example.test")
      .send(grant(12))
      .expect(403);
    await free(12, grant(12, { membershipId: f().memberships[0] })).expect(404);
  });
  it.each([
    [8, 1, 2],
    [9, 1, 6],
    [10, 3, 15],
    [11, 2, 3],
  ])(
    "onboarding y límites reales de sucursales/profesionales para %s",
    async (index, branches, people) => {
      await createBusiness(index);
      for (let n = 0; n < branches; n++) {
        const response = await stage(index, "branches", {
          data: {
            name: "FREE ACCESS TEST sucursal " + n,
            address: null,
            timeZone: "America/Guayaquil",
            isDefault: n === 0,
          },
        });
        expect(response.status).toBe(201);
      }
      expect(
        (
          await stage(index, "branches", {
            data: {
              name: "Exceso",
              address: null,
              timeZone: "America/Guayaquil",
              isDefault: false,
            },
          })
        ).status,
      ).toBe(409);
      const snap = await current(index),
        branchId = snap.body.configuration.branches[0].id;
      for (let n = 0; n < people; n++) {
        const response = await stage(index, "professionals", {
          data: {
            displayName: "FREE ACCESS TEST profesional " + n,
            specialty: null,
            branchIds: [branchId],
            serviceIds: [],
          },
        });
        expect(response.status).toBe(201);
      }
      expect(
        (
          await stage(index, "professionals", {
            data: {
              displayName: "Exceso",
              specialty: null,
              branchIds: [branchId],
              serviceIds: [],
            },
          })
        ).status,
      ).toBe(409);
    },
  );
  it("suspende, reactiva, vence y extiende con versión y auditoría sin borrar datos", async () => {
    const change = async (action: string, extra: object = {}) => {
      const g = await prisma.client.manualActivation.findUniqueOrThrow({
        where: { applicationId: f().applications[9]! },
      });
      return http("put", `/control/users/${f().users[9]}/free-access`).send({
        requestId: randomUUID(),
        confirmId: f().users[9],
        reason: "FREE ACCESS TEST cambio autorizado",
        action,
        version: g.version,
        ...extra,
      });
    };
    await change("SUSPEND").then((r) => expect(r.status).toBe(200));
    expect((await current(9)).body.status).toBe("SUSPENDED");
    await change("RESUME").then((r) => expect(r.status).toBe(200));
    expect((await current(9)).body.entitlement.plan).toBe("GROW");
    await prisma.client.manualActivation.update({
      where: { applicationId: f().applications[9]! },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect((await current(9)).body.status).toBe("EXPIRED");
    await change("EXTEND", {
      expiresAt: new Date(Date.now() + 35 * 86400000).toISOString(),
    }).then((r) => expect(r.status).toBe(200));
    expect((await current(9)).body.entitlement.plan).toBe("GROW");
    expect(await prisma.client.billingPayment.count()).toBe(0);
  });
  it("no reemplaza una suscripción existente ni selecciona arbitrariamente otro negocio", async () => {
    await free(4, grant(4, { membershipId: f().memberships[0] })).expect(409);
    await free(7).expect(409);
  });
  it("busca destinatarios por correo verificado y conserva su historial de concesiones", async () => {
    const result = await http(
      "get",
      "/control/users?q=" +
        encodeURIComponent((f().subjectPrefix + "-8@").toUpperCase()),
    ).expect(200);
    expect(result.body.items.map((u: { id: string }) => u.id)).toEqual([
      f().users[8],
    ]);
    const detail = await http(
      "get",
      `/control/applications/${f().applications[9]}`,
    ).expect(200);
    expect(
      detail.body.history.some(
        (a: { action: string }) => a.action === "freeAccess.granted",
      ),
    ).toBe(true);
  });
  it("serializa concesiones simultáneas con distintos identificadores", async () => {
    const results = await Promise.all([
      free(12, grant(12, { plan: "START" })),
      free(12, grant(12, { plan: "SCALE" })),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(
      await prisma.client.manualActivation.count({
        where: { applicationId: f().applications[12] },
      }),
    ).toBe(1);
  });
  it("entra a Noma Business después de completar la configuración con acceso gratuito", async () => {
    const index = 10;
    expect(
      (
        await stage(index, "services", {
          data: {
            name: "Servicio de validación gratuita",
            category: "Barbería",
            description: "",
            durationMinutes: 30,
            priceMode: "FIXED",
            priceMin: "12.50",
            priceMax: null,
            hasPriorAssessment: false,
            assessmentDescription: null,
          },
        })
      ).status,
    ).toBe(201);
    const snapshot = await current(index),
      c = snapshot.body.configuration,
      branch = c.branches.find((b: { isDefault: boolean }) => b.isDefault),
      professional = c.professionals[0];
    expect(
      (
        await stage(index, "professionals", {
          id: professional.id,
          entityVersion: professional.version,
          data: {
            displayName: professional.displayName,
            specialty: null,
            branchIds: [branch.id],
            serviceIds: [c.services[0].id],
          },
        })
      ).status,
    ).toBe(201);
    const week = Array.from({ length: 7 }, (_, day) => ({
      weekday: day + 1,
      closed: day > 4,
      intervals: day > 4 ? [] : [{ start: "09:00", end: "17:00" }],
    }));
    expect(
      (
        await stage(index, "schedules", {
          data: {
            branchId: branch.id,
            professionalId: null,
            timeZone: "America/Guayaquil",
            week,
            version: null,
          },
        })
      ).status,
    ).toBe(201);
    const complete = await stage(index, "complete");
    expect(complete.status).toBe(201);
    expect(complete.body.snapshot.status).toBe("COMPLETE");
    const membership = await prisma.client.membership.findFirstOrThrow({
      where: { userId: f().users[index], establishmentId: c.business.id },
    });
    const selected = await http("post", "/auth/membership", index)
      .send({ membershipId: membership.id })
      .expect(204);
    const cookie = (selected.headers["set-cookie"] as unknown as string[])
      .find((v) => v.startsWith(commercialCookie() + "="))!
      .split(";")[0]!;
    f().tokens[index] = cookie.slice(commercialCookie().length + 1);
    expect(
      (await http("get", "/onboarding/entry", index).expect(200)).body
        .needsOnboarding,
    ).toBe(false);
    const context = await http("get", "/platform/context", index).expect(200);
    expect(context.body.establishmentId).toBe(c.business.id);
    await http(
      "get",
      `/platform/establishments/${c.business.id}`,
      index,
    ).expect(200);
  });
  it("finaliza una cortesía sin borrar su negocio y rechaza reactivaciones del registro finalizado", async () => {
    const g = await prisma.client.manualActivation.findUniqueOrThrow({
        where: { applicationId: f().applications[9]! },
      }),
      before = await prisma.client.professional.count();
    const body = {
      requestId: randomUUID(),
      confirmId: f().users[9],
      reason: "Finalización de cortesía de pruebas",
      action: "REVOKE",
      version: g.version,
    };
    await http("put", `/control/users/${f().users[9]}/free-access`)
      .send(body)
      .expect(200);
    expect((await current(9)).body.status).toBe("REVOKED");
    expect(await prisma.client.professional.count()).toBe(before);
    await http("put", `/control/users/${f().users[9]}/free-access`)
      .send({
        ...body,
        requestId: randomUUID(),
        action: "RESUME",
        version: g.version + 1,
      })
      .expect(409);
  });
});
