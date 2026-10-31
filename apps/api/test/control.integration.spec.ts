import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { config } from "dotenv";
import type { Server } from "node:http";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { PrismaService } from "../src/persistence/prisma.service";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { loadConfig } from "../src/config";
import { commercialCookie } from "../src/commercial/commercial.config";
import { digestToken, newToken } from "../src/platform/local-identity.service";
import { assertTestDatabaseUrl } from "./test-database";
import { bootstrapFirstOwner } from "../src/control/owner-bootstrap";
import { manualAccessForUser } from "../src/control/manual-access";
import {
  CONTROL_TEST_ISSUER,
  assertControlTestDatabase,
  cleanControlFixture,
  createControlFixture,
  type ControlFixture,
} from "./control-fixtures";
const root = resolve(__dirname, "..");
config({ path: resolve(root, ".env.test"), quiet: true });
const origin = "http://localhost:5173";
const reason = "CONTROL TEST revisión autorizada con evidencia";
describe("Noma Control: permisos, transiciones y auditoría en PostgreSQL real", () => {
  let prisma: PrismaService,
    app: INestApplication | undefined,
    fixture: ControlFixture | undefined;
  const previous = { ...process.env };
  const f = () => fixture!;
  const api = (
    method: "get" | "post" | "put" | "patch" | "delete",
    path: string,
    index = 0,
  ) => {
    const agent = request(app!.getHttpServer() as Server);
    return agent[method]("/api/control" + path)
      .set("Cookie", `${commercialCookie()}=${f().tokens[index]}`)
      .set("Origin", process.env.WEB_ORIGIN ?? origin);
  };
  const command = (id: string, extra: object = {}) => ({
    requestId: randomUUID(),
    confirmId: id,
    reason,
    ...extra,
  });
  const decision = (
    index: number,
    result: "APPROVED" | "REJECTED" = "APPROVED",
    actor = 0,
  ) =>
    api(
      "post",
      `/applications/${f().applications[index]}/decision`,
      actor,
    ).send(command(f().applications[index]!, { decision: result, version: 0 }));
  const pilot = (index: number, extra: object = {}, actor = 0) =>
    api(
      "post",
      `/applications/${f().applications[index]}/manual-activation`,
      actor,
    ).send(
      command(f().applications[index]!, {
        plan: "START",
        membershipId: null,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        ...extra,
      }),
    );
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
      OIDC_CLIENT_ID: "control-test-client",
      OIDC_CLIENT_SECRET: "control-test-secret",
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
        timeout: 25000,
      },
    );
    fixture = await createControlFixture(prisma);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication();
    configureApp(app, loadConfig(process.env));
    await app.init();
  });
  afterAll(async () => {
    try {
      if (fixture) await cleanControlFixture(prisma, fixture);
    } finally {
      if (app) await app.close();
      else if (prisma) await prisma.onApplicationShutdown();
      for (const key of Object.keys(process.env))
        if (!(key in previous)) delete process.env[key];
      Object.assign(process.env, previous);
    }
  });
  it("bootstrap exige identidad verificada, confirmación y no concede por email", async () => {
    await expect(
      bootstrapFirstOwner(prisma, {
        userId: f().users[5]!,
        confirmUserId: f().users[5]!,
        reason,
        evidence: reason,
      }),
    ).rejects.toThrow("verificada");
    await expect(
      bootstrapFirstOwner(prisma, {
        userId: f().users[0]!,
        confirmUserId: f().users[1]!,
        reason,
        evidence: reason,
      }),
    ).rejects.toThrow("confirmación");
    expect(
      await prisma.client.platformAccess.count({
        where: { role: "PLATFORM_OWNER", revokedAt: null },
      }),
    ).toBe(0);
    const first = await bootstrapFirstOwner(prisma, {
      userId: f().users[0]!,
      confirmUserId: f().users[0]!,
      reason,
      evidence: reason,
    });
    expect(first.alreadyAuthorized).toBe(false);
    const replay = await bootstrapFirstOwner(prisma, {
      userId: f().users[0]!,
      confirmUserId: f().users[0]!,
      reason,
      evidence: reason,
    });
    expect(replay.alreadyAuthorized).toBe(true);
    expect(
      await prisma.client.platformAudit.count({
        where: {
          action: "platformOwner.bootstrapped",
          actorUserId: f().users[0],
        },
      }),
    ).toBe(1);
    await expect(
      bootstrapFirstOwner(prisma, {
        userId: f().users[12]!,
        confirmUserId: f().users[12]!,
        reason,
        evidence: reason,
      }),
    ).rejects.toThrow("Ya existe");
    expect(
      await prisma.client.platformAccess.findUnique({
        where: { userId: f().users[6]! },
      }),
    ).toBeNull();
  });
  it("deniega anónimos, credenciales locales, identidades sin verificar y OWNER de negocio", async () => {
    await request(app!.getHttpServer() as Server)
      .get("/api/control/context")
      .expect(401);
    await request(app!.getHttpServer() as Server)
      .get("/api/control/context")
      .set("Cookie", `bw_local_session=${newToken()}`)
      .expect(401);
    await api("get", "/context", 5).expect(403);
    await api("get", "/context", 4).expect(403);
    await api("get", "/context", 6).expect(403);
    await request(app!.getHttpServer() as Server)
      .get("/api/platform/context")
      .set("Cookie", commercialCookie() + "=" + f().tokens[4])
      .expect(200);
    const owner = await request(app!.getHttpServer() as Server)
      .get("/api/platform/context")
      .set("Cookie", `${commercialCookie()}=${f().tokens[0]}`)
      .expect(403);
    expect(!!owner.body.establishmentId).toBe(false);
  });
  it.each([
    [0, 200, 200, 200, 200],
    [1, 200, 200, 200, 200],
    [2, 403, 200, 403, 403],
    [3, 200, 403, 403, 403],
  ])(
    "aplica matriz de consultas del rol %i en llamadas directas",
    async (index, applications, subscriptions, users, audit) => {
      await api("get", "/context", index).expect(200);
      await api("get", "/applications", index).expect(applications);
      await api("get", "/subscriptions", index).expect(subscriptions);
      await api("get", "/users", index).expect(users);
      await api("get", "/audit", index).expect(audit);
    },
  );
  it("contexto y dashboard no devuelven tokens ni métricas inventadas", async () => {
    const context = await api("get", "/context").expect(200);
    expect(context.body.sensitiveOperationsAvailable).toBe(true);
    expect(context.body.mfaEvidenceAvailable).toBe(false);
    const dashboard = await api("get", "/dashboard").expect(200);
    expect(dashboard.body.pendingReviews).toBeGreaterThanOrEqual(1);
    for (const key of ["mrr", "arr", "revenue", "bookings", "aiUsage"])
      expect(dashboard.body[key]).toBeUndefined();
    const json = JSON.stringify(context.body);
    expect(json.includes(f().tokens[0]!)).toBe(false);
    expect(json.includes(digestToken(f().tokens[0]!))).toBe(false);
  });
  it("filtra solicitudes y busca por nombre sin cambiar el alcance desde React", async () => {
    const response = await api(
      "get",
      `/applications?q=${encodeURIComponent(f().tag.toLowerCase())}&state=ACTIVATION_PENDING&decision=PENDING&size=2&page=2`,
    ).expect(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.total).toBe(12);
    expect(response.body.page).toBe(2);
    await api("get", "/applications?size=999").expect(400);
    await api("get", "/applications?role=PLATFORM_OWNER").expect(400);
    const detail = await api(
      "get",
      `/applications/${f().applications[7]}`,
    ).expect(200);
    expect(detail.body.user.verified).toBe(true);
    expect(detail.body.user.id).toBe(f().users[7]);
  });
  it("soporte y gestión comercial no aprueban, activan ni se elevan privilegios", async () => {
    for (const index of [2, 3]) {
      await decision(7, "APPROVED", index).expect(403);
      await pilot(7, {}, index).expect(403);
      await api("put", `/users/${f().users[index]}/platform-access`, index)
        .send(
          command(f().users[index]!, { role: "PLATFORM_OWNER", version: 0 }),
        )
        .expect(403);
    }
    await api("put", `/users/${f().users[11]}/platform-access`, 1)
      .send(command(f().users[11]!, { role: "SUPPORT_AGENT", version: null }))
      .expect(403);
    expect(
      await prisma.client.applicationReview.findUnique({
        where: { applicationId: f().applications[7]! },
      }),
    ).toBeNull();
  });
  it("aprobar es idempotente, auditable y no crea negocio, membresía, suscripción ni pago", async () => {
    const before = await Promise.all([
      prisma.client.establishment.count(),
      prisma.client.membership.count(),
      prisma.client.commercialSubscription.count(),
    ]);
    const body = command(f().applications[7]!, {
      decision: "APPROVED",
      version: 0,
    });
    await api("post", `/applications/${f().applications[7]}/decision`)
      .send(body)
      .expect(201);
    const replay = await api(
      "post",
      `/applications/${f().applications[7]}/decision`,
    )
      .send(body)
      .expect(201);
    expect(replay.body.replayed).toBe(true);
    expect(
      await Promise.all([
        prisma.client.establishment.count(),
        prisma.client.membership.count(),
        prisma.client.commercialSubscription.count(),
      ]),
    ).toEqual(before);
    expect(
      await prisma.client.platformAudit.count({
        where: {
          requestId: body.requestId,
          actorUserId: f().users[0],
          outcome: "SUCCESS",
        },
      }),
    ).toBe(1);
    await api("post", `/applications/${f().applications[7]}/decision`)
      .send({ ...body, decision: "REJECTED" })
      .expect(409);
    await decision(7, "REJECTED").expect(409);
  });
  it("rechaza decisiones contradictorias concurrentes de forma atómica", async () => {
    const responses = await Promise.all([
      decision(8, "APPROVED"),
      decision(8, "REJECTED", 1),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(
      await prisma.client.applicationReview.count({
        where: { applicationId: f().applications[8] },
      }),
    ).toBe(1);
    expect(
      await prisma.client.platformAudit.count({
        where: { resourceId: f().applications[8], outcome: "SUCCESS" },
      }),
    ).toBe(1);
  });
  it("registra rechazo final y no permite activar una solicitud rechazada", async () => {
    await decision(9, "REJECTED").expect(201);
    await decision(9).expect(409);
    await pilot(9).expect(409);
  });
  it("bloquea autoaprobación, autoactivación e identidades sin verificar", async () => {
    await decision(0).expect(403);
    await pilot(0).expect(403);
    await decision(5).expect(409);
    await pilot(10).expect(409);
  });
  it("un piloto exige aprobación, vencimiento y membresía del solicitante", async () => {
    await pilot(7, {
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    }).expect(400);
    await pilot(7, {
      expiresAt: new Date(Date.now() + 91 * 86400000).toISOString(),
    }).expect(400);
    await pilot(7, { membershipId: f().memberships[0] }).expect(404);
    await pilot(7, { membershipId: f().memberships[1] }).expect(201);
    const current = await prisma.client.manualActivation.findUniqueOrThrow({
      where: { applicationId: f().applications[7]! },
    });
    expect(current.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(
      await prisma.client.commercialSubscription.count({
        where: { applicationId: f().applications[7] },
      }),
    ).toBe(0);
    const access = await request(app!.getHttpServer() as Server)
      .get("/api/auth/session")
      .set("Cookie", `${commercialCookie()}=${f().tokens[7]}`)
      .expect(200);
    expect(access.body.manualActivation.kind).toBe("MANUAL_PILOT");
    expect(
      access.body.memberships.find(
        (m: { id: string }) => m.id === f().memberships[1],
      ).subscriptionState,
    ).toBe("ACTIVE");
    await pilot(7).expect(409);
  });
  it("membresía y datos privados siguen separados de permisos de plataforma", async () => {
    const response = await request(app!.getHttpServer() as Server)
      .post("/api/auth/membership")
      .set("Cookie", `${commercialCookie()}=${f().tokens[7]}`)
      .set("Origin", origin)
      .send({ membershipId: f().memberships[1] });
    expect(response.status).toBe(204);
    const cookies = response.headers["set-cookie"] as unknown as string[];
    const updated = cookies
      .find((cookie) => cookie.startsWith(commercialCookie() + "="))
      ?.split(";")[0]
      ?.slice(commercialCookie().length + 1);
    expect(!!updated).toBe(true);
    f().tokens[7] = updated!;
    await request(app!.getHttpServer() as Server)
      .get("/api/platform/context")
      .set("Cookie", commercialCookie() + "=" + f().tokens[7])
      .expect(200);
    const business = await api("get", `/businesses/${f().tenants[1]}`).expect(
      200,
    );
    const json = JSON.stringify(business.body);
    expect(json.includes("PRIVATE-")).toBe(false);
    for (const field of [
      "services",
      "professionals",
      "conversations",
      "businessPhone",
      "logoDataUrl",
    ])
      expect(business.body[field]).toBeUndefined();
    await api("get", `/businesses/${randomUUID()}`).expect(404);
  });
  it("cambia plan, suspende, reanuda y finaliza un piloto con versión y auditoría", async () => {
    const id = f().applications[7]!;
    await api("put", `/applications/${id}/manual-activation`)
      .send(command(id, { action: "CHANGE_PLAN", plan: "GROW", version: 0 }))
      .expect(200);
    await api("put", `/applications/${id}/manual-activation`)
      .send(command(id, { action: "SUSPEND", version: 0 }))
      .expect(409);
    await api("put", `/applications/${id}/manual-activation`)
      .send(command(id, { action: "SUSPEND", version: 1 }))
      .expect(200);
    expect(await manualAccessForUser(prisma, f().users[7]!)).toBeNull();
    await api("put", `/applications/${id}/manual-activation`)
      .send(command(id, { action: "RESUME", version: 2 }))
      .expect(200);
    expect((await manualAccessForUser(prisma, f().users[7]!))?.plan).toBe(
      "GROW",
    );
    const before = await prisma.client.manualActivation.findUniqueOrThrow({
      where: { applicationId: id },
    });
    await prisma.client.manualActivation.update({
      where: { applicationId: id },
      data: {
        createdAt: new Date(Date.now() - 2 * 86400000),
        expiresAt: new Date(Date.now() - 86400000),
      },
    });
    expect(await manualAccessForUser(prisma, f().users[7]!)).toBeNull();
    const list = await api(
      "get",
      `/subscriptions?state=EXPIRED&q=${encodeURIComponent(f().tag)}`,
    ).expect(200);
    expect(
      list.body.items.some((item: { id: string }) => item.id === before.id),
    ).toBe(true);
    await api("put", `/applications/${id}/manual-activation`)
      .send(command(id, { action: "RESUME", version: 3 }))
      .expect(409);
    await api("put", `/applications/${id}/manual-activation`)
      .send(command(id, { action: "REVOKE", version: 3 }))
      .expect(200);
    await api("put", `/applications/${id}/manual-activation`)
      .send(command(id, { action: "RESUME", version: 4 }))
      .expect(409);
    expect(
      await prisma.client.commercialSubscription.count({
        where: { applicationId: id },
      }),
    ).toBe(0);
  });
  it("autoriza alta futura sin crear cuentas ni negocios y no reemplaza relaciones comerciales", async () => {
    await decision(10).expect(201);
    const before = await prisma.client.establishment.count();
    await pilot(10).expect(201);
    expect(await prisma.client.establishment.count()).toBe(before);
    const account = await request(app!.getHttpServer() as Server)
      .get("/api/auth/session")
      .set("Cookie", `${commercialCookie()}=${f().tokens[10]}`)
      .expect(200);
    expect(account.body.manualActivation.onboardingAuthorized).toBe(true);
    await pilot(4, { membershipId: f().memberships[0] }).expect(409);
  });
  it("pagina negocios en servidor, filtra sector y no expone operación privada", async () => {
    for (let index = 0; index < 26; index++) {
      const id = randomUUID();
      f().tenants.push(id);
      await prisma.client.establishment.create({
        data: {
          id,
          commercialName: `${f().tag} paginado ${index}`,
          vertical: "BEAUTY",
        },
      });
    }
    const response = await api(
      "get",
      `/businesses?q=${encodeURIComponent(f().tag.toLowerCase())}&size=10&page=2&vertical=BEAUTY`,
    ).expect(200);
    expect(response.body.items).toHaveLength(10);
    expect(response.body.total).toBe(28);
    expect(response.body.page).toBe(2);
    expect(JSON.stringify(response.body).includes("PRIVATE-")).toBe(false);
    await api("get", "/businesses?vertical=WRONG").expect(400);
    await api("get", "/businesses?establishmentId=other").expect(400);
  });
  it("solo el propietario asigna permisos limitados y la revocación es inmediata", async () => {
    const id = f().users[11]!,
      body = command(id, { role: "SUPPORT_AGENT", version: null });
    await api("put", `/users/${id}/platform-access`)
      .send({ ...body, role: "PLATFORM_OWNER" })
      .expect(400);
    await api("put", `/users/${id}/platform-access`).send(body).expect(200);
    await api("get", "/businesses", 11).expect(200);
    await api("put", `/users/${id}/platform-access`)
      .send(command(id, { role: null, version: 0 }))
      .expect(200);
    await api("get", "/businesses", 11).expect(403);
    await api("put", `/users/${f().users[0]}/platform-access`)
      .send(command(f().users[0]!, { role: null, version: 0 }))
      .expect(403);
    expect(
      await prisma.client.membership.count({ where: { userId: id } }),
    ).toBe(0);
    const users = await api(
      "get",
      `/users?q=${encodeURIComponent(f().tag)}`,
    ).expect(200);
    expect(
      users.body.items.some(
        (user: { id: string; externalIdentities: unknown[] }) =>
          user.id === id && user.externalIdentities.length === 1,
      ),
    ).toBe(true);
    expect(JSON.stringify(users.body).includes("digest")).toBe(false);
  });
  it("no permite editar auditoría y oculta el historial a soporte", async () => {
    await api("delete", "/audit").expect(404);
    await api("patch", "/audit").send({ changes: {} }).expect(404);
    const support = await api(
      "get",
      `/applications/${f().applications[7]}`,
      3,
    ).expect(200);
    expect(support.body.history).toEqual([]);
    const audit = await api("get", `/audit?q=${f().applications[7]}`).expect(
      200,
    );
    expect(audit.body.items.length).toBeGreaterThan(0);
    expect(
      audit.body.items.every(
        (item: { reason: string; actor: { id: string } }) =>
          !!item.reason && !!item.actor.id,
      ),
    ).toBe(true);
    expect(JSON.stringify(audit.body).includes("inputHash")).toBe(false);
  });
  it("exige origen administrativo, confirmación y evidencia MFA fuera de local", async () => {
    await api("post", `/applications/${f().applications[12]}/decision`)
      .set("Origin", "https://other.example")
      .send(
        command(f().applications[12]!, { decision: "APPROVED", version: 0 }),
      )
      .expect(403);
    await api("post", `/applications/${f().applications[12]}/decision`)
      .send(command(randomUUID(), { decision: "APPROVED", version: 0 }))
      .expect(400);
    const old = {
      NODE_ENV: process.env.NODE_ENV,
      WEB_ORIGIN: process.env.WEB_ORIGIN,
      OIDC_REDIRECT_URI: process.env.OIDC_REDIRECT_URI,
    };
    try {
      Object.assign(process.env, {
        NODE_ENV: "production",
        WEB_ORIGIN: "https://control.example.test",
        OIDC_REDIRECT_URI: "https://control.example.test/api/auth/callback",
      });
      const response = await api(
        "post",
        `/applications/${f().applications[12]}/decision`,
      )
        .set("X-MFA", "true")
        .send(
          command(f().applications[12]!, { decision: "APPROVED", version: 0 }),
        )
        .expect(403);
      expect(response.body.message).toContain("MFA_REQUIRED");
    } finally {
      Object.assign(process.env, old);
    }
    expect(
      await prisma.client.applicationReview.findUnique({
        where: { applicationId: f().applications[12]! },
      }),
    ).toBeNull();
  });
});
