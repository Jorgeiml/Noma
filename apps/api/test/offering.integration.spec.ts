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
import { assertTestDatabaseUrl } from "./test-database";
import type { OfferingDto } from "../src/offering/offering.dto";

const apiRoot = resolve(__dirname, "..");
config({ path: resolve(apiRoot, ".env.test"), quiet: true });
const origin = "http://localhost:5173";
const base: OfferingDto = {
  name: "Servicio sintético",
  category: "Categoría sintética",
  description: "Solo pruebas",
  durationMinutes: 45,
  priceMode: "FIXED",
  priceMin: "25.10",
  priceMax: null,
  hasPriorAssessment: false,
  assessmentDescription: null,
};
describe("Oferta: CRUD y aislamiento PostgreSQL REAL", () => {
  let prisma: PrismaService;
  let app: INestApplication | undefined;
  let safe = false;
  let ownId: string;
  let foreignId: string;
  const tenants = [randomUUID(), randomUUID()];
  const users = [randomUUID(), randomUUID()];
  const memberships = [randomUUID(), randomUUID()];
  const tokens = [newToken(), newToken()];
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    APP_ENV: process.env.APP_ENV,
    LOCAL_ACCESS_ENABLED: process.env.LOCAL_ACCESS_ENABLED,
    DATABASE_URL: process.env.DATABASE_URL,
    WEB_ORIGIN: process.env.WEB_ORIGIN,
  };
  const api = (
    method: "get" | "post" | "patch" | "delete",
    path = "",
    index = 0,
  ) => {
    const client = request(app!.getHttpServer() as Server);
    return client[method](`/api/offering/services${path}`)
      .set("Cookie", `bw_local_session=${tokens[index]}`)
      .set("Origin", origin)
      .set("X-Catalog-Currency", "USD");
  };
  beforeAll(async () => {
    const testUrl = assertTestDatabaseUrl(process.env.TEST_DATABASE_URL);
    process.env.DATABASE_URL = testUrl;
    prisma = new PrismaService();
    const identity = await prisma.client.$queryRaw<
      Array<{ database: string; username: string }>
    >`SELECT current_database() AS database, current_user AS username`;
    if (
      identity[0]?.database !== "beauty_wellness_test" ||
      identity[0]?.username !== "bw_test"
    )
      throw new Error("Destino de pruebas no autorizado");
    safe = true;
    execFileSync(
      process.execPath,
      [
        resolve(apiRoot, "node_modules/prisma/build/index.js"),
        "migrate",
        "deploy",
      ],
      {
        cwd: apiRoot,
        env: { ...process.env, DATABASE_URL: testUrl },
        stdio: "pipe",
        timeout: 25000,
      },
    );
    process.env.NODE_ENV = "development";
    process.env.APP_ENV = "local";
    process.env.LOCAL_ACCESS_ENABLED = "true";
    process.env.WEB_ORIGIN = origin;
    await prisma.client.$transaction(async (tx) => {
      for (let i = 0; i < 2; i++) {
        await tx.establishment.create({
          data: {
            id: tenants[i]!,
            commercialName: `Catálogo sintético ${i}`,
            vertical: "BEAUTY",
          },
        });
        await tx.internalUser.create({
          data: { id: users[i]!, displayName: `Propietario sintético ${i}` },
        });
        await tx.membership.create({
          data: {
            id: memberships[i]!,
            establishmentId: tenants[i]!,
            userId: users[i]!,
            role: "OWNER",
          },
        });
        await tx.localCredential.create({
          data: {
            digest: digestToken(tokens[i]!),
            kind: "SESSION",
            membershipId: memberships[i]!,
            expiresAt: new Date(Date.now() + 600000),
          },
        });
      }
    });
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication();
    configureApp(app, loadConfig({ NODE_ENV: "test" }));
    await app.init();
    foreignId = (
      await api("post", "", 1)
        .send({ ...base, name: "Servicio exclusivo de B" })
        .expect(201)
    ).body.id as string;
  });
  afterAll(async () => {
    try {
      if (safe) {
        await prisma.client.serviceOffering.deleteMany({
          where: { establishmentId: { in: tenants } },
        });
        await prisma.client.membership.deleteMany({
          where: { id: { in: memberships }, userId: { in: users } },
        });
        await prisma.client.internalUser.deleteMany({
          where: { id: { in: users } },
        });
        await prisma.client.establishment.deleteMany({
          where: { id: { in: tenants } },
        });
      }
    } finally {
      if (app) await app.close();
      else if (prisma) await prisma.onApplicationShutdown();
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
  it("crea y consulta un servicio asignando el tenant desde la sesión", async () => {
    const created = await api("post").send(base).expect(201);
    ownId = created.body.id as string;
    expect(created.body.establishmentId).toBe(tenants[0]);
    expect(created.body.currency).toBe("USD");
    expect(created.body.priceMin).toBe("25.1");
    const read = await api("get", `/${ownId}`).expect(200);
    expect(read.body.name).toBe(base.name);
    const list = await api("get").expect(200);
    expect(list.body.map((value: { id: string }) => value.id)).toEqual([ownId]);
  });
  it.each<Partial<OfferingDto>>([
    { priceMode: "FIXED", priceMin: "0" },
    { priceMode: "FROM", priceMin: "25" },
    { priceMode: "RANGE", priceMin: "25", priceMax: "45" },
    {
      priceMode: "ASSESSMENT_REQUIRED",
      priceMin: null,
      hasPriorAssessment: true,
      assessmentDescription: "Evaluación comercial descrita",
    },
  ])("persiste la modalidad $priceMode correctamente", async (change) => {
    const response = await api("post")
      .send({ ...base, ...change })
      .expect(201);
    const stored = await prisma.client.serviceOffering.findFirstOrThrow({
      where: { id: response.body.id as string, establishmentId: tenants[0]! },
    });
    expect(stored.priceMode).toBe(change.priceMode);
    if (change.priceMode === "ASSESSMENT_REQUIRED") {
      expect(stored.priceMin).toBeNull();
      expect(stored.priceMax).toBeNull();
    }
  });
  it("conserva importes grandes sin perder centavos", async () => {
    const response = await api("post")
      .send({ ...base, priceMin: "99999999999999.99" })
      .expect(201);
    expect(response.body.priceMin).toBe("99999999999999.99");
    expect(
      (
        await prisma.client.serviceOffering.findUniqueOrThrow({
          where: { id: response.body.id as string },
        })
      ).priceMin?.toFixed(2),
    ).toBe("99999999999999.99");
  });
  it("edita y recupera desde otra petición y PostgreSQL", async () => {
    const response = await api("patch", `/${ownId}`)
      .send({ ...base, name: "Edición persistida", version: 0 })
      .expect(200);
    expect(response.body.version).toBe(1);
    expect((await api("get", `/${ownId}`).expect(200)).body.name).toBe(
      "Edición persistida",
    );
    expect(
      (
        await prisma.client.serviceOffering.findUniqueOrThrow({
          where: { id: ownId },
        })
      ).name,
    ).toBe("Edición persistida");
    await api("patch", `/${ownId}`)
      .send({ ...base, version: 0 })
      .expect(409);
  });
  it("no reinterpreta un precio si cambió la moneda del establecimiento", async () => {
    await api("post").unset("X-Catalog-Currency").send(base).expect(400);
    await prisma.client.establishment.update({
      where: { id: tenants[0]! },
      data: { currency: "EUR" },
    });
    try {
      await api("post").send(base).expect(409);
      const created = await api("post")
        .set("X-Catalog-Currency", "EUR")
        .send(base)
        .expect(201);
      expect(created.body.currency).toBe("EUR");
      expect((await api("get", `/${ownId}`).expect(200)).body.currency).toBe(
        "USD",
      );
    } finally {
      await prisma.client.establishment.update({
        where: { id: tenants[0]! },
        data: { currency: "USD" },
      });
    }
  });
  it("desactiva y reactiva sin borrar el servicio", async () => {
    const off = await api("patch", `/${ownId}/status`)
      .send({ active: false, version: 1 })
      .expect(200);
    expect(off.body.active).toBe(false);
    expect((await api("get", `/${ownId}`).expect(200)).body.active).toBe(false);
    const on = await api("patch", `/${ownId}/status`)
      .send({ active: true, version: 2 })
      .expect(200);
    expect(on.body.active).toBe(true);
    expect(
      await prisma.client.serviceOffering.count({ where: { id: ownId } }),
    ).toBe(1);
    await api("delete", `/${ownId}`).expect(400);
  });
  it("A no puede leer, editar ni cambiar el estado de B", async () => {
    await api("get", `/${foreignId}`).expect(404);
    await api("patch", `/${foreignId}`)
      .send({ ...base, version: 0 })
      .expect(404);
    await api("patch", `/${foreignId}/status`)
      .send({ active: false, version: 0 })
      .expect(404);
    expect(
      (
        await prisma.client.serviceOffering.findUniqueOrThrow({
          where: { id: foreignId },
        })
      ).active,
    ).toBe(true);
  });
  it("B no consulta ni modifica el catálogo de A", async () => {
    const list = await api("get", "", 1).expect(200);
    expect(list.body.map((value: { id: string }) => value.id)).toEqual([
      foreignId,
    ]);
    await api("get", `/${ownId}`, 1).expect(404);
    await api("patch", `/${ownId}`, 1)
      .send({ ...base, version: 3 })
      .expect(404);
  });
  it("rechaza tenant, moneda y estado inyectados por el cliente", async () => {
    for (const field of ["establishmentId", "tenantId", "currency", "active"]) {
      await api("post")
        .send({ ...base, [field]: tenants[1] })
        .expect(400);
    }
    await api("get", `?establishmentId=${tenants[1]}`).expect(400);
  });
  it("rechaza importes numéricos, rangos invertidos y duración inválida", async () => {
    for (const change of [
      { priceMin: 25.1 },
      { priceMode: "RANGE", priceMax: "2" },
      { durationMinutes: 0 },
      { priceMode: "ASSESSMENT_REQUIRED" },
    ]) {
      await api("post")
        .send({ ...base, ...change })
        .expect(400);
    }
    await api("post")
      .send({ ...base, priceMin: "0.001" })
      .expect(400);
  });
  it("PostgreSQL también impide importes negativos saltándose el DTO", async () => {
    await expect(
      prisma.client.serviceOffering.create({
        data: {
          ...base,
          priceMin: "-1",
          currency: "USD",
          establishmentId: tenants[0]!,
        },
      }),
    ).rejects.toThrow();
  });
  it("no expone operaciones sin identidad válida ni admite origen externo", async () => {
    for (const method of ["get", "post"] as const) {
      const client = request(app!.getHttpServer() as Server);
      await client[method]("/api/offering/services")
        .set("Origin", origin)
        .send(base)
        .expect(401);
    }
    await api("patch", `/${ownId}`)
      .set("Origin", "https://other.example")
      .send({ ...base, version: 3 })
      .expect(403);
    await request(app!.getHttpServer() as Server)
      .get("/api/offering/services")
      .set("Cookie", `bw_local_session=${newToken()}`)
      .expect(401);
  });
  it("mantiene el bloqueo comercial en producción y staging", async () => {
    try {
      process.env.NODE_ENV = "production";
      await api("get").expect(404);
      await api("post").send(base).expect(404);
      process.env.NODE_ENV = "development";
      process.env.APP_ENV = "staging";
      await api("get").expect(404);
    } finally {
      process.env.NODE_ENV = "development";
      process.env.APP_ENV = "local";
    }
  });
  it("elimina solo con versión, pertenencia y origen válidos", async () => {
    const created = (await api("post").send(base).expect(201)).body as {
      id: string;
      version: number;
    };
    await api("delete", "/" + created.id, 1)
      .send({ version: 0 })
      .expect(404);
    await api("delete", "/" + created.id)
      .set("Origin", "https://other.example")
      .send({ version: 0 })
      .expect(403);
    await api("delete", "/" + created.id)
      .send({ version: 99 })
      .expect(409);
    await api("delete", "/" + created.id)
      .send({ version: 0, establishmentId: tenants[1] })
      .expect(400);
    expect(
      await prisma.client.serviceOffering.count({ where: { id: created.id } }),
    ).toBe(1);
    await api("delete", "/" + created.id)
      .send({ version: 0 })
      .expect(200);
    await api("get", "/" + created.id).expect(404);
    expect(
      await prisma.client.serviceOffering.count({ where: { id: foreignId } }),
    ).toBe(1);
  });
});
