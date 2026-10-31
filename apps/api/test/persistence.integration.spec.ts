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
import { assertTestDatabaseUrl } from "./test-database";

const apiRoot = resolve(__dirname, "..");
config({ path: resolve(apiRoot, ".env.test"), quiet: true });

describe("persistencia PostgreSQL REAL (requiere postgres-test)", () => {
  let prisma: PrismaService | undefined;
  let app: INestApplication | undefined;

  beforeAll(async () => {
    const testUrl = assertTestDatabaseUrl(process.env.TEST_DATABASE_URL);
    process.env.DATABASE_URL = testUrl;
    prisma = new PrismaService();
    // Verificar identidad efectiva ANTES de migrar o escribir, además de validar la URL.
    const identity = await prisma.client.$queryRaw<
      Array<{ database: string; username: string }>
    >`
      SELECT current_database() AS database, current_user AS username
    `;
    if (
      identity[0]?.database !== "beauty_wellness_test" ||
      identity[0]?.username !== "bw_test"
    ) {
      throw new Error(
        "Identidad PostgreSQL de tests inesperada; sin migraciones ni escrituras.",
      );
    }
    try {
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
    } catch {
      throw new Error(
        "No se pudieron aplicar las migraciones en la base aislada de tests.",
      );
    }
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication();
    configureApp(app, loadConfig({ NODE_ENV: "test" }));
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
    else if (prisma) await prisma.onApplicationShutdown();
  });

  it("conecta con PostgreSQL", async () => {
    await prisma!.checkConnection();
  });

  it("crea, recupera y elimina exclusivamente su propio registro técnico", async () => {
    const id = randomUUID();
    const message = `m1.2-${randomUUID()}`;
    try {
      const created = await prisma!.client.persistenceProbe.create({
        data: { id, message },
      });
      const found = await prisma!.client.persistenceProbe.findUniqueOrThrow({
        where: { id },
      });
      expect(found.id).toBe(id);
      expect(found.message).toBe(message);
      expect(found.createdAt).toEqual(created.createdAt);
    } finally {
      await prisma!.client.persistenceProbe.deleteMany({
        where: { id, message },
      });
    }
    expect(
      await prisma!.client.persistenceProbe.findUnique({ where: { id } }),
    ).toBeNull();
  });

  it("health DB devuelve éxito con PostgreSQL real", async () => {
    await request(app!.getHttpServer() as Server)
      .get("/api/health/db")
      .expect(200)
      .expect({ status: "ok", service: "database" });
  });

  it("health de proceso sigue funcionando", async () => {
    await request(app!.getHttpServer() as Server)
      .get("/api/health")
      .expect(200)
      .expect({ status: "ok", service: "api" });
  });
});
