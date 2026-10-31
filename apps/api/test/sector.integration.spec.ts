import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import type { Server } from "node:http";
import { config } from "dotenv";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { PrismaService } from "../src/persistence/prisma.service";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { loadConfig } from "../src/config";
import { digestToken, newToken } from "../src/platform/local-identity.service";
import { assignInitialVertical } from "../src/sector/sector-administration";
import type { SectorConfiguration } from "../src/sector/sector.contract";
import { assertTestDatabaseUrl } from "./test-database";
const root = resolve(__dirname, "..");
config({ path: resolve(root, ".env.test"), quiet: true });
const origin = "http://localhost:5173";
describe("Appointments: clasificación y autorización en PostgreSQL real", () => {
  let prisma: PrismaService,
    app: INestApplication | undefined,
    safe = false;
  const tenants = [randomUUID(), randomUUID()],
    users = [randomUUID(), randomUUID()],
    memberships = [randomUUID(), randomUUID()],
    codes = [newToken(), newToken()];
  const agents: Array<ReturnType<typeof request.agent>> = [];
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    APP_ENV: process.env.APP_ENV,
    LOCAL_ACCESS_ENABLED: process.env.LOCAL_ACCESS_ENABLED,
    DATABASE_URL: process.env.DATABASE_URL,
    WEB_ORIGIN: process.env.WEB_ORIGIN,
  };
  const api = (index = 0) => agents[index]!;
  beforeAll(async () => {
    const url = assertTestDatabaseUrl(process.env.TEST_DATABASE_URL);
    process.env.DATABASE_URL = url;
    prisma = new PrismaService();
    const [identity] = await prisma.client.$queryRaw<
      Array<{ database: string; username: string }>
    >`SELECT current_database() AS database,current_user AS username`;
    if (
      identity?.database !== "beauty_wellness_test" ||
      identity.username !== "bw_test"
    )
      throw new Error("Destino de pruebas no autorizado");
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
    process.env.NODE_ENV = "development";
    process.env.APP_ENV = "local";
    process.env.LOCAL_ACCESS_ENABLED = "true";
    process.env.WEB_ORIGIN = origin;
    for (let i = 0; i < 2; i++) {
      await prisma.client.establishment.create({
        data: { id: tenants[i]!, commercialName: `Sector sintético ${i}` },
      });
      await prisma.client.internalUser.create({
        data: { id: users[i]!, displayName: "Propietario sintético" },
      });
      await prisma.client.membership.create({
        data: {
          id: memberships[i]!,
          establishmentId: tenants[i]!,
          userId: users[i]!,
          role: "OWNER",
        },
      });
      await prisma.client.localCredential.create({
        data: {
          digest: digestToken(codes[i]!),
          kind: "BOOTSTRAP",
          membershipId: memberships[i]!,
          expiresAt: new Date(Date.now() + 600000),
        },
      });
    }
    await prisma.client.serviceOffering.create({
      data: {
        establishmentId: tenants[0]!,
        name: "Servicio preexistente",
        description: "No perder",
        durationMinutes: 30,
        priceMode: "FROM",
        priceMin: "10",
        currency: "USD",
      },
    });
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication();
    configureApp(app, loadConfig({ NODE_ENV: "test" }));
    await app.init();
    for (let i = 0; i < 2; i++) {
      agents.push(request.agent(app.getHttpServer() as Server));
      await api(i)
        .post("/api/local-access/session")
        .set("Origin", origin)
        .send({ code: codes[i] })
        .expect(204);
    }
  });
  afterAll(async () => {
    if (safe) {
      await prisma.client.localCredential.deleteMany({
        where: { membershipId: { in: memberships } },
      });
      await prisma.client.membership.deleteMany({
        where: { id: { in: memberships } },
      });
      await prisma.client.serviceOffering.deleteMany({
        where: { establishmentId: { in: tenants } },
      });
      await prisma.client.establishment.deleteMany({
        where: { id: { in: tenants } },
      });
      await prisma.client.internalUser.deleteMany({
        where: { id: { in: users } },
      });
    }
    await app?.close();
    await prisma?.onApplicationShutdown();
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  it("mantiene accesible la identidad sin inventar la clasificación del legado", async () => {
    const response = await api()
      .get("/api/platform/sector-configuration")
      .expect(200);
    expect((response.body as SectorConfiguration).vertical).toBeNull();
    await api().get("/api/offering/services").expect(403);
    await api().get("/api/staff/configuration").expect(403);
  });
  it("persiste la clasificación inicial con evidencia, sin duplicados ni pérdida de credenciales o servicios", async () => {
    const services = await prisma.client.serviceOffering.findMany({
        where: { establishmentId: tenants[0] },
      }),
      credentials = await prisma.client.localCredential.findMany({
        where: { membershipId: memberships[0] },
      });
    await prisma.client.$transaction((tx) =>
      assignInitialVertical(tx, {
        establishment: tenants[0]!,
        vertical: "BEAUTY",
        version: 0,
        reason: "Fixture de validación de compatibilidad BEAUTY M1.4–M1.6.",
      }),
    );
    for (let n = 0; n < 2; n++) {
      const config = (
        await api().get("/api/platform/sector-configuration").expect(200)
      ).body as SectorConfiguration;
      expect(config.vertical).toBe("BEAUTY");
      expect(config.capabilities.individualServices).toBe("IMPLEMENTED");
      expect(config.verticals.map((v) => v.code)).toEqual([
        "BEAUTY",
        "DENTAL",
        "FITNESS",
        "AUTOMOTIVE",
      ]);
    }
    expect(
      await prisma.client.serviceOffering.findMany({
        where: { establishmentId: tenants[0] },
      }),
    ).toEqual(services);
    expect(
      await prisma.client.localCredential.findMany({
        where: { membershipId: memberships[0] },
      }),
    ).toEqual(credentials);
    await api().get("/api/offering/services").expect(200);
    await api().get("/api/staff/configuration").expect(200);
    await expect(
      prisma.client.$transaction((tx) =>
        assignInitialVertical(tx, {
          establishment: tenants[0]!,
          vertical: "BEAUTY",
          version: 1,
          reason: "No debe permitir una segunda asignación administrada.",
        }),
      ),
    ).rejects.toThrow("ya clasificado");
  });
  it("rechaza versión obsoleta, sector futuro y evidencia insuficiente sin escribir", async () => {
    for (const input of [
      {
        vertical: "BEAUTY",
        version: 5,
        reason: "Evidencia válida pero versión obsoleta.",
      },
      {
        vertical: "DENTAL",
        version: 0,
        reason: "Sector todavía no preparado para operación.",
      },
      { vertical: "BEAUTY", version: 0, reason: "No" },
    ])
      await expect(
        prisma.client.$transaction((tx) =>
          assignInitialVertical(tx, { establishment: tenants[1]!, ...input }),
        ),
      ).rejects.toThrow();
    expect(
      (
        await prisma.client.establishment.findUniqueOrThrow({
          where: { id: tenants[1] },
        })
      ).vertical,
    ).toBeNull();
  });
  it("no acepta un tenant arbitrario ni un cambio sectorial enviado desde React", async () => {
    await api()
      .get(`/api/platform/sector-configuration?establishmentId=${tenants[1]}`)
      .expect(400);
    await api().get(`/api/platform/establishments/${tenants[1]}`).expect(403);
    await api()
      .patch(`/api/platform/establishments/${tenants[0]}`)
      .set("Origin", origin)
      .send({ vertical: "AUTOMOTIVE" })
      .expect(400);
    await api()
      .patch("/api/platform/sector-configuration")
      .set("Origin", origin)
      .send({ vertical: "DENTAL" })
      .expect(404);
    expect(
      (
        await prisma.client.establishment.findUniqueOrThrow({
          where: { id: tenants[0] },
        })
      ).vertical,
    ).toBe("BEAUTY");
  });
  it.each(["DENTAL", "FITNESS", "AUTOMOTIVE"] as const)(
    "reconoce %s pero impide lectura y mutaciones operativas directas",
    async (vertical) => {
      await prisma.client.establishment.update({
        where: { id: tenants[1] },
        data: { vertical },
      });
      const cfg = (
        await api(1).get("/api/platform/sector-configuration").expect(200)
      ).body as SectorConfiguration;
      expect(cfg.vertical).toBe(vertical);
      expect(cfg.status).toBe("PLANNED");
      expect(Object.values(cfg.capabilities)).not.toContain("IMPLEMENTED");
      await api(1).get("/api/offering/services").expect(403);
      await api(1)
        .post("/api/offering/services")
        .set("Origin", origin)
        .send({})
        .expect(403);
      await api(1).get("/api/staff/configuration").expect(403);
      await api(1)
        .post("/api/staff/professionals")
        .set("Origin", origin)
        .send({})
        .expect(403);
      await api(1)
        .put("/api/staff/schedules")
        .set("Origin", origin)
        .send({})
        .expect(403);
    },
  );
  it("conserva consumo único, revocación y bloqueo de producción de la sesión local", async () => {
    await api()
      .post("/api/local-access/session")
      .set("Origin", origin)
      .send({ code: codes[0] })
      .expect(401);
    process.env.NODE_ENV = "production";
    try {
      await api().get("/api/platform/sector-configuration").expect(404);
    } finally {
      process.env.NODE_ENV = "development";
    }
    await prisma.client.membership.update({
      where: { id: memberships[0] },
      data: { status: "REVOKED" },
    });
    await api().get("/api/platform/sector-configuration").expect(403);
  });
});
