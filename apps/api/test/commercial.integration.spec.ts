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
import { PrismaService } from "../src/persistence/prisma.service";
import { configureApp } from "../src/app.setup";
import { loadConfig } from "../src/config";
import { OidcProvider } from "../src/commercial/oidc.provider";
import { CommercialService } from "../src/commercial/commercial.service";
import { commercialCookie } from "../src/commercial/commercial.config";
import { digestToken, newToken } from "../src/platform/local-identity.service";
import { assertTestDatabaseUrl } from "./test-database";

const root = resolve(__dirname, "..");
config({ path: resolve(root, ".env.test"), quiet: true });
const origin = "http://localhost:5173";
const issuer = "https://commercial-fixture.example.test/";
describe("Identidad comercial: PostgreSQL real, transporte del proveedor simulado explícitamente", () => {
  let prisma: PrismaService, app: INestApplication, service: CommercialService;
  const previous = { ...process.env };
  const states: string[] = [],
    users: string[] = [],
    tenants: string[] = [];
  const subject = `${randomUUID()}-`;
  let memberA: string, memberB: string, applicationA: string;
  let agentA: ReturnType<typeof request.agent>,
    agentB: ReturnType<typeof request.agent>;
  let safe = false;
  const provider = {
    begin: jest.fn(
      async (_mode: string, state: string) =>
        `${issuer}authorize?state=${state}`,
    ),
    exchange: jest.fn(async (url: URL) => {
      const code = url.searchParams.get("code")!;
      if (code === "forged") throw new Error("Synthetic invalid token");
      return {
        issuer,
        subject: subject + code.replace(/^pending-/, ""),
        email: "shared-synthetic@example.test",
        verified: !code.startsWith("pending-"),
        expiresAt: new Date(Date.now() + 3600_000),
      };
    }),
    resend: jest.fn(async () => undefined),
    logoutUrl: jest.fn(async () => `${issuer}oidc/logout`),
  };
  const api = () => request(app.getHttpServer() as Server);
  async function begin(agent: ReturnType<typeof request.agent>, code: string) {
    const started = await agent
      .post("/api/auth/start")
      .set("Origin", origin)
      .send({
        mode: "signup",
        next: "/app/servicios",
        email: "shared-synthetic@example.test",
      })
      .expect(200);
    const state = new URL(
      (started.body as { authorizationUrl: string }).authorizationUrl,
    ).searchParams.get("state")!;
    states.push(state);
    const result = await agent
      .get(`/api/auth/callback?state=${state}&code=${code}`)
      .expect(303);
    return { state, result };
  }
  beforeAll(async () => {
    const url = assertTestDatabaseUrl(process.env.TEST_DATABASE_URL);
    Object.assign(process.env, {
      DATABASE_URL: url,
      NODE_ENV: "development",
      APP_ENV: "local",
      LOCAL_ACCESS_ENABLED: "true",
      WEB_ORIGIN: origin,
      COMMERCIAL_AUTH_ENABLED: "true",
      OIDC_ISSUER: issuer,
      OIDC_CLIENT_ID: "synthetic-client",
      OIDC_CLIENT_SECRET: "synthetic-secret",
      OIDC_REDIRECT_URI: `${origin}/api/auth/callback`,
      COMMERCIAL_STATE_KEY: "b".repeat(64),
    });
    prisma = new PrismaService();
    const identity = await prisma.client.$queryRaw<
      { database: string; username: string }[]
    >`SELECT current_database() AS database, current_user AS username`;
    if (
      identity[0]?.database !== "beauty_wellness_test" ||
      identity[0]?.username !== "bw_test"
    )
      throw new Error("Destino de integración no autorizado.");
    safe = true;
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
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(OidcProvider)
      .useValue(provider)
      .compile();
    app = module.createNestApplication();
    configureApp(app, loadConfig(process.env));
    await app.init();
    service = app.get(CommercialService);
    agentA = request.agent(app.getHttpServer() as Server);
    agentB = request.agent(app.getHttpServer() as Server);
  });
  afterAll(async () => {
    if (safe) {
      const identities = await prisma.client.externalIdentity.findMany({
        where: { issuer },
      });
      const ids = identities.map((i) => i.userId);
      await prisma.client.commercialSession.deleteMany({
        where: { identityId: { in: identities.map((i) => i.id) } },
      });
      await prisma.client.commercialSubscription.deleteMany({
        where: { establishmentId: { in: tenants } },
      });
      await prisma.client.localCredential.deleteMany({
        where: { membership: { userId: { in: ids } } },
      });
      await prisma.client.membership.deleteMany({
        where: { userId: { in: ids } },
      });
      await prisma.client.establishment.deleteMany({
        where: { id: { in: tenants } },
      });
      await prisma.client.commercialApplication.deleteMany({
        where: { userId: { in: ids } },
      });
      await prisma.client.externalIdentity.deleteMany({ where: { issuer } });
      await prisma.client.internalUser.deleteMany({
        where: { id: { in: ids } },
      });
      await prisma.client.oidcAttempt.deleteMany({
        where: { stateDigest: { in: states.map(digestToken) } },
      });
      await prisma.client.identityRateLimit.deleteMany();
    }
    await app?.close();
    await prisma?.client.$disconnect();
    process.env = previous;
  });
  it("cierra comercial sin configuración, conserva el indicador local y no expone secretos", async () => {
    process.env.COMMERCIAL_AUTH_ENABLED = "false";
    try {
      const response = await api().get("/api/auth/configuration").expect(200);
      expect(response.body).toMatchObject({
        enabled: false,
        localEnabled: true,
      });
      expect(JSON.stringify(response.body)).not.toContain("synthetic-secret");
      await api()
        .post("/api/auth/start")
        .set("Origin", origin)
        .send({ mode: "signup" })
        .expect(503);
    } finally {
      process.env.COMMERCIAL_AUTH_ENABLED = "true";
    }
  });
  it("rechaza CSRF, campos de privilegios y clientes sin una sesión válida", async () => {
    await api()
      .post("/api/auth/start")
      .set("Origin", "https://attacker.example.test")
      .send({ mode: "signup" })
      .expect(403);
    await api()
      .post("/api/auth/start")
      .set("Origin", origin)
      .send({ mode: "signup", role: "OWNER" })
      .expect(400);
    await api().get("/api/auth/session").expect(401);
    await api().get("/api/platform/context").expect(401);
  });
  it("almacena PKCE cifrado, vincula al navegador y consume el retorno una sola vez", async () => {
    const started = await agentA
      .post("/api/auth/start")
      .set("Origin", origin)
      .send({ mode: "signup" })
      .expect(200);
    const state = new URL(
      (started.body as { authorizationUrl: string }).authorizationUrl,
    ).searchParams.get("state")!;
    states.push(state);
    const row = await prisma.client.oidcAttempt.findUniqueOrThrow({
      where: { stateDigest: digestToken(state) },
    });
    expect(row.encryptedPayload).not.toContain("verifier");
    const unsolicited = await agentA
      .get(`/api/auth/callback?code=pending-A&state=${newToken()}`)
      .expect(303);
    expect(unsolicited.headers.location).toContain("error=identity");
    expect(unsolicited.headers["set-cookie"]).toBeUndefined();
    const changed = await agentB
      .get(`/api/auth/callback?code=pending-A&state=${state}`)
      .expect(303);
    expect(changed.headers.location).toContain("error=identity");
    expect(
      await prisma.client.oidcAttempt.count({
        where: { stateDigest: row.stateDigest },
      }),
    ).toBe(1);
    const consumed = await agentA
      .get(`/api/auth/callback?code=pending-A&state=${state}`)
      .expect(303);
    expect(consumed.headers.location).toContain("/verificar-correo");
    const replay = await agentA
      .get(`/api/auth/callback?code=pending-A&state=${state}`)
      .expect(303);
    expect(replay.headers.location).toContain("error=identity");
  });
  it("una identidad sin verificar no crea negocios, membresías ni suscripciones", async () => {
    const result = await agentA.get("/api/auth/session").expect(200);
    const user = result.body as {
      user: { id: string; verified: boolean };
      memberships: unknown[];
      application: { state: string };
    };
    users.push(user.user.id);
    expect(user.user.verified).toBe(false);
    expect(user.memberships).toEqual([]);
    expect(user.application.state).toBe("REGISTRATION_STARTED");
    expect(
      await prisma.client.membership.count({ where: { userId: user.user.id } }),
    ).toBe(0);
    await agentA
      .post("/api/auth/plan")
      .set("Origin", origin)
      .send({ plan: "START" })
      .expect(403);
    await agentA
      .post("/api/auth/verification/resend")
      .set("Origin", origin)
      .send({})
      .expect(202);
    expect(provider.resend).toHaveBeenCalledWith(subject + "A");
    await agentA
      .post("/api/auth/verification/resend")
      .set("Origin", origin)
      .send({ email: "another@example.test" })
      .expect(400);
  });
  it("un login verificado reutiliza issuer+subject, nunca vincula por correo", async () => {
    const before = await prisma.client.internalUser.count();
    await begin(agentA, "A");
    const verified = await agentA.get("/api/auth/session").expect(200);
    expect(
      (verified.body as { user: { id: string; verified: boolean } }).user,
    ).toMatchObject({ id: users[0], verified: true });
    await begin(agentA, "A");
    expect(await prisma.client.internalUser.count()).toBe(before);
    await begin(agentB, "B");
    const other = await agentB.get("/api/auth/session").expect(200);
    const userB = (other.body as { user: { id: string; email: string } }).user;
    users.push(userB.id);
    expect(userB.id).not.toBe(users[0]);
    expect(userB.email).toBe("shared-synthetic@example.test");
  });
  it("seleccionar plan y solicitar activación persiste estados sin cobrar ni crear un tenant", async () => {
    const before = await prisma.client.establishment.count();
    await agentA
      .post("/api/auth/plan")
      .set("Origin", origin)
      .send({ plan: "GROW", paid: true })
      .expect(400);
    await agentA
      .post("/api/auth/plan")
      .set("Origin", origin)
      .send({ plan: "GROW" })
      .expect(204);
    expect(
      (
        await prisma.client.commercialApplication.findUniqueOrThrow({
          where: { userId: users[0]! },
        })
      ).state,
    ).toBe("PLAN_SELECTED");
    await agentA
      .post("/api/auth/activation-request")
      .set("Origin", origin)
      .send({ state: "ACTIVE" })
      .expect(400);
    await agentA
      .post("/api/auth/activation-request")
      .set("Origin", origin)
      .send({})
      .expect(204);
    const application =
      await prisma.client.commercialApplication.findUniqueOrThrow({
        where: { userId: users[0]! },
      });
    applicationA = application.id;
    expect(application.state).toBe("ACTIVATION_PENDING");
    expect(await prisma.client.establishment.count()).toBe(before);
    expect(
      await prisma.client.commercialSubscription.count({
        where: { applicationId: application.id },
      }),
    ).toBe(0);
    await agentA.get("/api/offering/services").expect(403);
  });
  it("no permite activar ni elegir un establecimiento ajeno por parámetros", async () => {
    for (let i = 0; i < users.length; i++) {
      const tenant = await prisma.client.establishment.create({
        data: {
          commercialName: `Sintético identidad ${randomUUID()}`,
          vertical: "BEAUTY",
        },
      });
      tenants.push(tenant.id);
      const member = await prisma.client.membership.create({
        data: { userId: users[i]!, establishmentId: tenant.id, role: "OWNER" },
      });
      if (i === 0) memberA = member.id;
      else memberB = member.id;
      const application =
        await prisma.client.commercialApplication.findUniqueOrThrow({
          where: { userId: users[i]! },
        });
      await prisma.client.commercialSubscription.create({
        data: {
          applicationId: application.id,
          establishmentId: tenant.id,
          plan: "GROW",
          state: "ACTIVE",
          evidenceSource: "LOCAL_SYNTHETIC",
          activatedAt: new Date(),
        },
      });
    }
    await agentA
      .post("/api/auth/membership")
      .set("Origin", origin)
      .send({ establishmentId: tenants[0], role: "OWNER" })
      .expect(400);
    await agentA
      .post("/api/auth/membership")
      .set("Origin", origin)
      .send({ membershipId: memberB })
      .expect(403);
    await agentA
      .post("/api/auth/membership")
      .set("Origin", origin)
      .send({ membershipId: memberA })
      .expect(204);
    const context = await agentA.get("/api/platform/context").expect(200);
    expect(context.body).toMatchObject({
      establishmentId: tenants[0],
      userId: users[0],
      identityMode: "commercial",
    });
    await agentA.get(`/api/platform/establishments/${tenants[1]}`).expect(403);
    await agentA
      .patch(`/api/platform/establishments/${tenants[1]}`)
      .set("Origin", origin)
      .send({
        commercialName: "No debe cambiar",
        version: 0,
        timeZone: "America/Guayaquil",
        currency: "USD",
        businessPhone: null,
        websiteUrl: null,
      })
      .expect(403);
  });
  it("un usuario puede cambiar entre dos membresías propias; rota la sesión y no conserva el tenant anterior", async () => {
    const extra = await prisma.client.membership.create({
      data: { userId: users[0]!, establishmentId: tenants[1]!, role: "OWNER" },
    });
    const first = await agentA
      .post("/api/auth/membership")
      .set("Origin", origin)
      .send({ membershipId: memberA })
      .expect(204);
    const oldCookie = (first.headers["set-cookie"] as unknown as string[])
      .find((value) => value.startsWith(`${commercialCookie()}=`))!
      .split(";")[0]!;
    await agentA
      .post("/api/auth/membership")
      .set("Origin", origin)
      .send({ membershipId: extra.id })
      .expect(204);
    const current = await agentA.get("/api/platform/context").expect(200);
    expect(current.body).toMatchObject({
      establishmentId: tenants[1],
      userId: users[0],
    });
    await api()
      .get("/api/platform/context")
      .set("Cookie", oldCookie)
      .expect(401);
    await agentA.get(`/api/platform/establishments/${tenants[0]}`).expect(403);
    await agentA
      .post("/api/auth/membership")
      .set("Origin", origin)
      .send({ membershipId: memberA })
      .expect(204);
  });
  it("revalida suspensión, cancelación y revocación de membresía en cada solicitud", async () => {
    for (const state of ["SUSPENDED", "CANCELLED"] as const) {
      await prisma.client.commercialSubscription.update({
        where: { applicationId: applicationA },
        data: { state },
      });
      await agentA.get("/api/platform/context").expect(403);
    }
    await prisma.client.commercialSubscription.update({
      where: { applicationId: applicationA },
      data: { state: "ACTIVE" },
    });
    await prisma.client.membership.update({
      where: { id: memberA },
      data: { status: "REVOKED" },
    });
    await agentA.get("/api/platform/context").expect(403);
    await prisma.client.membership.update({
      where: { id: memberA },
      data: { status: "ACTIVE" },
    });
  });
  it("la evidencia local no habilita operación comercial en producción", async () => {
    const identity = await prisma.client.externalIdentity.findUniqueOrThrow({
      where: { issuer_subject: { issuer, subject: subject + "A" } },
    });
    const token = newToken();
    await prisma.client.commercialSession.create({
      data: {
        identityId: identity.id,
        membershipId: memberA,
        digest: digestToken(token),
        expiresAt: new Date(Date.now() + 600_000),
      },
    });
    Object.assign(process.env, {
      NODE_ENV: "production",
      WEB_ORIGIN: "https://noma.example.test",
      OIDC_REDIRECT_URI: "https://noma.example.test/api/auth/callback",
    });
    try {
      await api()
        .get("/api/platform/context")
        .set("Cookie", `${commercialCookie()}=${token}`)
        .expect(403);
      await api()
        .post("/api/local-access/session")
        .set("Origin", "https://noma.example.test")
        .send({ code: newToken() })
        .expect(404);
    } finally {
      Object.assign(process.env, {
        NODE_ENV: "development",
        WEB_ORIGIN: origin,
        OIDC_REDIRECT_URI: `${origin}/api/auth/callback`,
      });
    }
  });
  it("cierra sesión sin conservar el token; rechaza sesiones vencidas, incluso con cookie local", async () => {
    await agentA
      .post("/api/auth/logout")
      .set("Origin", origin)
      .send({})
      .expect(200);
    await agentA.get("/api/auth/session").expect(401);
    const identity = await prisma.client.externalIdentity.findUniqueOrThrow({
      where: { issuer_subject: { issuer, subject: subject + "A" } },
    });
    const token = newToken();
    await prisma.client.commercialSession.create({
      data: {
        identityId: identity.id,
        digest: digestToken(token),
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    await api()
      .get("/api/platform/context")
      .set(
        "Cookie",
        `${commercialCookie()}=${token}; bw_local_session=${newToken()}`,
      )
      .expect(401);
    const idleToken = newToken();
    await prisma.client.commercialSession.create({
      data: {
        identityId: identity.id,
        digest: digestToken(idleToken),
        expiresAt: new Date(Date.now() + 600_000),
        lastSeenAt: new Date(Date.now() - 31 * 60_000),
      },
    });
    await api()
      .get("/api/auth/session")
      .set("Cookie", `${commercialCookie()}=${idleToken}`)
      .expect(401);
  });
  it("un retorno inválido no crea cuenta y la limitación persiste en PostgreSQL", async () => {
    const count = await prisma.client.externalIdentity.count({
      where: { issuer },
    });
    const rejected = await begin(agentB, "forged");
    expect(rejected.result.headers.location).toContain("error=identity");
    expect(
      await prisma.client.externalIdentity.count({ where: { issuer } }),
    ).toBe(count);
    const key = randomUUID();
    await service.rate("synthetic-rate", key, 1);
    await expect(service.rate("synthetic-rate", key, 1)).rejects.toMatchObject({
      status: 429,
    });
  });
  it("callbacks concurrentes de la misma identidad no crean usuarios ni solicitudes duplicadas", async () => {
    const claims = {
      issuer,
      subject: subject + "concurrent",
      email: "concurrent@example.test",
      verified: true,
      expiresAt: new Date(Date.now() + 600_000),
    };
    await Promise.all([
      service.createSession(claims),
      service.createSession(claims),
    ]);
    const rows = await prisma.client.externalIdentity.findMany({
      where: { issuer, subject: claims.subject },
      include: { user: { include: { commercialApplication: true } } },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.user.commercialApplication?.state).toBe(
      "IDENTITY_VERIFIED",
    );
    expect(
      await prisma.client.commercialApplication.count({
        where: { userId: rows[0]!.userId },
      }),
    ).toBe(1);
  });
});
