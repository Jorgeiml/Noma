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
import { renewExistingBootstrap } from "../src/platform/local-access-code";

const apiRoot = resolve(__dirname, "..");
config({ path: resolve(apiRoot, ".env.test"), quiet: true });
const origin = "http://localhost:5173";
const draft = {
  commercialName: "Nombre sintético editado",
  timeZone: "Pacific/Galapagos",
  currency: "USD",
  businessPhone: null,
  websiteUrl: "https://example.test",
  version: 0,
};

describe("Plataforma: aislamiento y persistencia REAL", () => {
  let prisma: PrismaService;
  let app: INestApplication | undefined;
  let safe = false;
  let ownerA: ReturnType<typeof request.agent>;
  let ownerB: ReturnType<typeof request.agent>;
  const tenants = [randomUUID(), randomUUID()];
  const users = [randomUUID(), randomUUID()];
  const memberships = [randomUUID(), randomUUID(), randomUUID()];
  const codeA = newToken();
  const codeB = newToken();
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    APP_ENV: process.env.APP_ENV,
    LOCAL_ACCESS_ENABLED: process.env.LOCAL_ACCESS_ENABLED,
    DATABASE_URL: process.env.DATABASE_URL,
    WEB_ORIGIN: process.env.WEB_ORIGIN,
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
      throw new Error("Destino de tests no autorizado");
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
      for (let index = 0; index < 2; index++) {
        await tx.establishment.create({
          data: {
            id: tenants[index]!,
            commercialName: `Sintético tenant ${index}`,
          },
        });
        await tx.internalUser.create({
          data: {
            id: users[index]!,
            displayName: `Identidad sintética ${index}`,
          },
        });
        await tx.membership.create({
          data: {
            id: memberships[index]!,
            establishmentId: tenants[index]!,
            userId: users[index]!,
            role: "OWNER",
          },
        });
        await tx.localCredential.create({
          data: {
            digest: digestToken(index === 0 ? codeA : codeB),
            kind: "BOOTSTRAP",
            membershipId: memberships[index]!,
            expiresAt: new Date(Date.now() + 600000),
          },
        });
      }
      // Un usuario puede pertenecer a varios tenants; la sesión sigue ligada a una membresía.
      await tx.membership.create({
        data: {
          id: memberships[2]!,
          establishmentId: tenants[1]!,
          userId: users[0]!,
          role: "OWNER",
        },
      });
    });
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication();
    configureApp(app, loadConfig({ NODE_ENV: "test" }));
    await app.init();
    ownerA = request.agent(app.getHttpServer() as Server);
    ownerB = request.agent(app.getHttpServer() as Server);
    const login = await ownerA
      .post("/api/local-access/session")
      .set("Origin", origin)
      .send({ code: codeA })
      .expect(204);
    expect(login.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("HttpOnly")]),
    );
    expect(login.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("SameSite=Strict")]),
    );
    await ownerB
      .post("/api/local-access/session")
      .set("Origin", origin)
      .send({ code: codeB })
      .expect(204);
  });

  afterAll(async () => {
    try {
      if (safe) {
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

  it("rechaza identidad ausente o cookie inventada", async () => {
    await request(app!.getHttpServer() as Server)
      .get("/api/platform/context")
      .expect(401);
    await request(app!.getHttpServer() as Server)
      .get("/api/platform/context")
      .set("Cookie", `bw_local_session=${newToken()}`)
      .expect(401);
  });
  it("resuelve identidad y tenant desde la sesión", async () => {
    const response = await ownerA.get("/api/platform/context").expect(200);
    expect(response.body.establishmentId).toBe(tenants[0]);
    expect(response.body.userId).toBe(users[0]);
    expect(response.body.role).toBe("OWNER");
    expect(response.body).not.toHaveProperty("digest");
  });
  it("un código consumido no puede iniciar otra sesión", async () => {
    await request(app!.getHttpServer() as Server)
      .post("/api/local-access/session")
      .set("Origin", origin)
      .send({ code: codeA })
      .expect(401);
  });
  it("dev:access renueva códigos sin duplicar entidades, preservando hash, caducidad y consumo único", async () => {
    const snapshot = () =>
      Promise.all([
        prisma.client.establishment.findMany({
          where: { id: { in: tenants } },
          orderBy: { id: "asc" },
        }),
        prisma.client.internalUser.findMany({
          where: { id: { in: users } },
          orderBy: { id: "asc" },
        }),
        prisma.client.membership.findMany({
          where: { id: { in: memberships } },
          orderBy: { id: "asc" },
        }),
      ]);
    const before = await snapshot(),
      first = newToken(),
      second = newToken(),
      started = Date.now();
    for (const code of [first, second])
      await prisma.client.$transaction((tx) =>
        renewExistingBootstrap(tx, code, memberships[2]!),
      );
    expect(await snapshot()).toEqual(before);
    const stored = await prisma.client.localCredential.findMany({
      where: { membershipId: memberships[2]!, kind: "BOOTSTRAP" },
    });
    expect(stored).toHaveLength(1);
    expect(stored[0]!.digest).toBe(digestToken(second));
    expect(stored[0]!.digest).not.toBe(second);
    expect(stored[0]!.expiresAt.valueOf()).toBeGreaterThanOrEqual(
      started + 600000,
    );
    expect(stored[0]!.expiresAt.valueOf()).toBeLessThanOrEqual(
      Date.now() + 600000,
    );
    for (const code of [first])
      await request(app!.getHttpServer() as Server)
        .post("/api/local-access/session")
        .set("Origin", origin)
        .send({ code })
        .expect(401);
    await request(app!.getHttpServer() as Server)
      .post("/api/local-access/session")
      .set("Origin", origin)
      .send({ code: second })
      .expect(204);
    await request(app!.getHttpServer() as Server)
      .post("/api/local-access/session")
      .set("Origin", origin)
      .send({ code: second })
      .expect(401);
    await ownerA.get("/api/platform/context").expect(200);
  });
  it("dev:access no emite códigos para selección inexistente, revocada o establecimiento suspendido", async () => {
    const id = memberships[2]!;
    await expect(
      prisma.client.$transaction((tx) =>
        renewExistingBootstrap(tx, newToken(), randomUUID()),
      ),
    ).rejects.toThrow("propietario activo");
    try {
      await prisma.client.membership.update({
        where: { id },
        data: { status: "REVOKED" },
      });
      await expect(
        prisma.client.$transaction((tx) =>
          renewExistingBootstrap(tx, newToken(), id),
        ),
      ).rejects.toThrow("propietario activo");
      await prisma.client.membership.update({
        where: { id },
        data: { status: "ACTIVE" },
      });
      await prisma.client.establishment.update({
        where: { id: tenants[1]! },
        data: { status: "SUSPENDED" },
      });
      await expect(
        prisma.client.$transaction((tx) =>
          renewExistingBootstrap(tx, newToken(), id),
        ),
      ).rejects.toThrow("propietario activo");
    } finally {
      await prisma.client.membership.update({
        where: { id },
        data: { status: "ACTIVE" },
      });
      await prisma.client.establishment.update({
        where: { id: tenants[1]! },
        data: { status: "ACTIVE" },
      });
    }
  });
  it("dev:access rechaza selección ambigua sin modificar las credenciales", async () => {
    const before = await prisma.client.localCredential.findMany({
      where: { membershipId: { in: memberships } },
      orderBy: { id: "asc" },
    });
    await expect(
      prisma.client.$transaction((tx) =>
        renewExistingBootstrap(tx, newToken()),
      ),
    ).rejects.toThrow("varias membresías");
    expect(
      await prisma.client.localCredential.findMany({
        where: { membershipId: { in: memberships } },
        orderBy: { id: "asc" },
      }),
    ).toEqual(before);
  });
  it("credenciales vencidas no conceden acceso", async () => {
    const expired = newToken();
    await prisma.client.localCredential.create({
      data: {
        digest: digestToken(expired),
        kind: "SESSION",
        membershipId: memberships[0]!,
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    await request(app!.getHttpServer() as Server)
      .get("/api/platform/context")
      .set("Cookie", `bw_local_session=${expired}`)
      .expect(401);
  });
  it("un código no puede consumirse dos veces en paralelo", async () => {
    const code = newToken();
    await prisma.client.localCredential.create({
      data: {
        digest: digestToken(code),
        kind: "BOOTSTRAP",
        membershipId: memberships[0]!,
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    const responses = await Promise.all(
      [1, 2].map(() =>
        request(app!.getHttpServer() as Server)
          .post("/api/local-access/session")
          .set("Origin", origin)
          .send({ code }),
      ),
    );
    expect(responses.map((response) => response.status).sort()).toEqual([
      204, 401,
    ]);
  });
  it("A no puede leer ni editar B, aunque otra membresía del usuario exista en B", async () => {
    await ownerA.get(`/api/platform/establishments/${tenants[1]}`).expect(403);
    await ownerA
      .patch(`/api/platform/establishments/${tenants[1]}`)
      .set("Origin", origin)
      .send(draft)
      .expect(403);
    expect(
      (
        await prisma.client.establishment.findUniqueOrThrow({
          where: { id: tenants[1]! },
        })
      ).commercialName,
    ).toBe("Sintético tenant 1");
  });
  it("B no puede leer ni editar A", async () => {
    await ownerB.get(`/api/platform/establishments/${tenants[0]}`).expect(403);
    await ownerB
      .patch(`/api/platform/establishments/${tenants[0]}`)
      .set("Origin", origin)
      .send(draft)
      .expect(403);
  });
  it("rechaza cambios administrativos e intentos de sustituir el tenant", async () => {
    for (const field of ["id", "status", "role", "tenantId", "subscription"]) {
      await ownerA
        .patch(`/api/platform/establishments/${tenants[0]}`)
        .set("Origin", origin)
        .send({ ...draft, [field]: tenants[1] })
        .expect(400);
    }
  });
  it("rechaza escrituras sin origen o desde otro origen", async () => {
    await ownerA
      .patch(`/api/platform/establishments/${tenants[0]}`)
      .send(draft)
      .expect(403);
    await ownerA
      .patch(`/api/platform/establishments/${tenants[0]}`)
      .set("Origin", "https://untrusted.example")
      .send(draft)
      .expect(403);
  });
  it("guarda y recupera los cambios con otra petición y desde PostgreSQL", async () => {
    const updated = await ownerA
      .patch(`/api/platform/establishments/${tenants[0]}`)
      .set("Origin", origin)
      .send(draft)
      .expect(200);
    expect(updated.body.commercialName).toBe(draft.commercialName);
    expect(updated.body.version).toBe(1);
    const reload = await ownerA
      .get(`/api/platform/establishments/${tenants[0]}`)
      .expect(200);
    expect(reload.body.commercialName).toBe(draft.commercialName);
    const row = await prisma.client.establishment.findUniqueOrThrow({
      where: { id: tenants[0]! },
    });
    expect(row.commercialName).toBe(draft.commercialName);
    expect(row.timeZone).toBe("Pacific/Galapagos");
  });
  it("no sobrescribe una edición basada en una versión vieja", async () => {
    await ownerA
      .patch(`/api/platform/establishments/${tenants[0]}`)
      .set("Origin", origin)
      .send({ ...draft, commercialName: "Cambio obsoleto" })
      .expect(409);
  });
  it("una membresía revocada pierde acceso", async () => {
    await prisma.client.membership.update({
      where: { id: memberships[1]! },
      data: { status: "REVOKED" },
    });
    await ownerB.get("/api/platform/context").expect(403);
    await prisma.client.membership.update({
      where: { id: memberships[1]! },
      data: { status: "ACTIVE" },
    });
  });
  it("un establecimiento suspendido no queda disponible", async () => {
    await prisma.client.establishment.update({
      where: { id: tenants[1]! },
      data: { status: "SUSPENDED" },
    });
    await ownerB.get("/api/platform/context").expect(404);
    await prisma.client.establishment.update({
      where: { id: tenants[1]! },
      data: { status: "ACTIVE" },
    });
  });
  it("producción y staging no habilitan rutas locales aunque el flag sea true", async () => {
    try {
      process.env.NODE_ENV = "production";
      await ownerA.get("/api/platform/context").expect(404);
      await ownerA
        .post("/api/local-access/session")
        .set("Origin", origin)
        .send({ code: newToken() })
        .expect(404);
      process.env.NODE_ENV = "development";
      process.env.APP_ENV = "staging";
      await ownerA.get("/api/platform/context").expect(404);
    } finally {
      process.env.NODE_ENV = "development";
      process.env.APP_ENV = "local";
    }
  });

  it("guarda, consulta y retira un logo con aislamiento y versión", async () => {
    const endpoint = "/api/platform/establishments/" + tenants[0] + "/logo";
    const current = (
      await ownerA.get("/api/platform/establishments/" + tenants[0]).expect(200)
    ).body as { version: number };
    await ownerB
      .put(endpoint)
      .set("Origin", origin)
      .send({
        logoDataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aPrsAAAAASUVORK5CYII=",
        version: current.version,
      })
      .expect(403);
    await ownerA
      .put(endpoint)
      .set("Origin", origin)
      .send({
        logoDataUrl: "data:image/svg+xml;base64,PHN2Zy8+",
        version: current.version,
      })
      .expect(400);
    const stored = (
      await ownerA
        .put(endpoint)
        .set("Origin", origin)
        .send({
          logoDataUrl:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aPrsAAAAASUVORK5CYII=",
          version: current.version,
        })
        .expect(200)
    ).body as { version: number; logoDataUrl: string };
    expect(stored.logoDataUrl).toBe(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aPrsAAAAASUVORK5CYII=",
    );
    expect(
      (
        await ownerA
          .get("/api/platform/establishments/" + tenants[0])
          .expect(200)
      ).body.logoDataUrl,
    ).toBe(stored.logoDataUrl);
    await ownerA
      .put(endpoint)
      .set("Origin", origin)
      .send({ logoDataUrl: null, version: current.version })
      .expect(409);
    const cleared = await ownerA
      .put(endpoint)
      .set("Origin", origin)
      .send({ logoDataUrl: null, version: stored.version })
      .expect(200);
    expect(cleared.body.logoDataUrl).toBeNull();
    expect(
      await prisma.client.establishment.count({
        where: { id: { in: tenants } },
      }),
    ).toBe(2);
  });
  it("cerrar sesión revoca el acceso", async () => {
    await ownerA
      .delete("/api/local-access/session")
      .set("Origin", origin)
      .expect(204);
    await ownerA.get("/api/platform/context").expect(401);
  });
});
