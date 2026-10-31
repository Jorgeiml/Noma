import "reflect-metadata";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Server } from "node:http";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { loadConfig } from "../src/config";
import { PrismaService } from "../src/persistence/prisma.service";

describe("HTTP health", () => {
  let app: INestApplication;
  const previousControlOrigin = process.env.CONTROL_WEB_ORIGIN;
  const checkConnection = jest
    .fn()
    .mockRejectedValue(new Error("Controlled DB failure"));

  beforeAll(async () => {
    process.env.CONTROL_WEB_ORIGIN = "https://control.example.test";
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        checkConnection,
      })
      .compile();
    app = module.createNestApplication();
    configureApp(app, loadConfig({ NODE_ENV: "test" }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    if (previousControlOrigin === undefined)
      delete process.env.CONTROL_WEB_ORIGIN;
    else process.env.CONTROL_WEB_ORIGIN = previousControlOrigin;
  });

  it("GET /api/health devuelve el contrato público", async () => {
    await request(app.getHttpServer() as Server)
      .get("/api/health")
      .expect(200)
      .expect({ status: "ok", service: "api" });
  });

  it("las rutas inexistentes conservan una respuesta HTTP 404", async () => {
    await request(app.getHttpServer() as Server)
      .get("/health")
      .expect(404);
  });

  it("DB devuelve 503 sin filtrar el error de conexión", async () => {
    const response = await request(app.getHttpServer() as Server)
      .get("/api/health/db")
      .expect(503);
    expect(response.body).toEqual({
      statusCode: 503,
      message: "Base de datos no disponible",
      error: "Service Unavailable",
    });
  });

  it("DB devuelve 200 cuando la comprobación simulada tiene éxito", async () => {
    checkConnection.mockResolvedValueOnce(undefined);
    await request(app.getHttpServer() as Server)
      .get("/api/health/db")
      .expect(200)
      .expect({ status: "ok", service: "database" });
  });

  it("no publica autorización CORS para un origen ajeno", async () => {
    const response = await request(app.getHttpServer() as Server)
      .get("/api/health")
      .set("Origin", "https://untrusted.example")
      .expect(200);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it.each(["http://localhost:5173", "https://control.example.test"])(
    "autoriza únicamente el origen exacto configurado %s",
    async (origin) => {
      await request(app.getHttpServer() as Server)
        .get("/api/health")
        .set("Origin", origin)
        .expect("Access-Control-Allow-Origin", origin)
        .expect("Access-Control-Allow-Credentials", "true");
    },
  );
});
