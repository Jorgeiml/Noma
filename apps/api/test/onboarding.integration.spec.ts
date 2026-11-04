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
import { OfferingService } from "../src/offering/offering.service";
import { commercialCookie } from "../src/commercial/commercial.config";
import { bootstrapFirstOwner } from "../src/control/owner-bootstrap";
import { assertTestDatabaseUrl } from "./test-database";
import {
  CONTROL_TEST_ISSUER,
  assertControlTestDatabase,
  createControlFixture,
  cleanControlFixture,
  type ControlFixture,
} from "./control-fixtures";
const root = resolve(__dirname, "..");
config({ path: resolve(root, ".env.test"), quiet: true });
const origin = "http://localhost:5173";
const business = {
  commercialName: "ONBOARDING TEST barbería",
  countryCode: "EC",
  city: "Quito",
  address: null,
  businessPhone: "+593 993020091",
  businessEmail: "onboarding@example.test",
  timeZone: "America/Guayaquil",
  description: "Fixture de onboarding, no negocio real.",
  beautySubtype: "BARBERSHOP",
};
const service = {
  name: "ONBOARDING TEST corte",
  category: "Barbería",
  description: "",
  durationMinutes: 30,
  priceMode: "FIXED",
  priceMin: "12.50",
  priceMax: null,
  hasPriorAssessment: false,
  assessmentDescription: null,
};
const week = Array.from({ length: 7 }, (_, weekday) => ({
  weekday: weekday + 1,
  closed: weekday > 4,
  intervals:
    weekday > 4
      ? []
      : [
          { start: "09:00", end: "13:00" },
          { start: "14:00", end: "18:00" },
        ],
}));
describe("Beauty onboarding: autorización, entidades existentes y progreso en PostgreSQL real", () => {
  let prisma: PrismaService,
    app: INestApplication | undefined,
    fixture: ControlFixture | undefined;
  const previous = { ...process.env };
  const f = () => fixture!;
  const http = (method: "get" | "post" | "put", path: string, index = 8) => {
    const agent = request(app!.getHttpServer() as Server);
    return agent[method]("/api" + path)
      .set("Cookie", commercialCookie() + "=" + f().tokens[index])
      .set("Origin", origin);
  };
  const get = (index = 8) => http("get", "/onboarding", index).expect(200);
  async function body(extra: Record<string, unknown> = {}, index = 8) {
    const current = await get(index);
    return {
      requestId: randomUUID(),
      version: current.body.progress?.version ?? 0,
      ...extra,
    };
  }
  async function save(
    path: string,
    extra: Record<string, unknown> = {},
    index = 8,
  ) {
    const input = await body(extra, index);
    return http(
      ["sector", "business", "step"].includes(path) ? "put" : "post",
      "/onboarding/" + path,
      index,
    ).send(input);
  }
  async function authorize(index: number, membershipId: string | null = null) {
    await http(
      "post",
      `/control/applications/${f().applications[index]}/decision`,
      0,
    )
      .send({
        requestId: randomUUID(),
        confirmId: f().applications[index],
        reason: "ONBOARDING TEST decisión explícita del operador",
        version: 0,
        decision: "APPROVED",
      })
      .expect(201);
    await http(
      "post",
      `/control/applications/${f().applications[index]}/manual-activation`,
      0,
    )
      .send({
        requestId: randomUUID(),
        confirmId: f().applications[index],
        reason: "ONBOARDING TEST piloto temporal autorizado",
        plan: "START",
        membershipId,
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      })
      .expect(201);
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
      OIDC_CLIENT_ID: "onboarding-test",
      OIDC_CLIENT_SECRET: "onboarding-test-only",
      OIDC_REDIRECT_URI: origin + "/api/auth/callback",
      COMMERCIAL_STATE_KEY: "c".repeat(64),
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
      reason: "ONBOARDING TEST operador de plataforma",
      evidence: "Fixture aislada de pruebas de onboarding",
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
        const records = await prisma.client.businessOnboarding.findMany({
          where: { applicationId: { in: f().applications } },
          select: { establishmentId: true },
        });
        for (const record of records)
          if (record.establishmentId) {
            const id = record.establishmentId as ReturnType<typeof randomUUID>;
            if (!f().tenants.includes(id)) f().tenants.push(id);
          }
        await prisma.client.onboardingOperation.deleteMany({
          where: { applicationId: { in: f().applications } },
        });
        await prisma.client.businessOnboarding.deleteMany({
          where: { applicationId: { in: f().applications } },
        });
        await cleanControlFixture(prisma, f());
      }
    } finally {
      if (app) await app.close();
      else if (prisma) await prisma.onApplicationShutdown();
      for (const key of Object.keys(process.env))
        if (!(key in previous)) delete process.env[key];
      Object.assign(process.env, previous);
    }
  });
  it("rechaza anónimos, códigos locales e identidad no verificada", async () => {
    await request(app!.getHttpServer() as Server)
      .get("/api/onboarding")
      .expect(401);
    await request(app!.getHttpServer() as Server)
      .post("/api/onboarding/start")
      .set("Origin", origin)
      .set("Cookie", "bw_local_session=local-fixture")
      .send({ requestId: randomUUID(), version: 0 })
      .expect(401);
    await http("get", "/onboarding", 5).expect(403);
  });
  it("una preferencia GROW/START no concede permiso para crear un negocio", async () => {
    expect((await get()).body.status).toBe("PENDING");
    await save("start").then((result) => expect(result.status).toBe(403));
    expect(await prisma.client.businessOnboarding.count()).toBe(0);
  });
  it("una revisión aprobada sigue necesitando una habilitación comercial", async () => {
    await http(
      "post",
      `/control/applications/${f().applications[11]}/decision`,
      0,
    )
      .send({
        requestId: randomUUID(),
        confirmId: f().applications[11],
        reason: "ONBOARDING TEST revisión sin piloto",
        version: 0,
        decision: "APPROVED",
      })
      .expect(201);
    expect((await get(11)).body.status).toBe("PENDING");
    expect((await save("start", {}, 11)).status).toBe(403);
  });
  it("un piloto autorizado por Control habilita la bienvenida, sin pago ni establecimiento", async () => {
    const count = await prisma.client.establishment.count();
    await authorize(8);
    const response = await get();
    expect(response.body.status).toBe("WELCOME");
    expect(response.body.entitlement.limits).toEqual({
      branches: 1,
      professionals: 2,
      users: 2,
    });
    expect(await prisma.client.establishment.count()).toBe(count);
    expect(
      await prisma.client.commercialSubscription.count({
        where: { applicationId: f().applications[8] },
      }),
    ).toBe(0);
  });
  it("el inicio es idempotente incluso con dos solicitudes concurrentes", async () => {
    const input = await body();
    const responses = await Promise.all([
      http("post", "/onboarding/start").send(input),
      http("post", "/onboarding/start").send(input),
    ]);
    expect(responses.map((r) => r.status)).toEqual([201, 201]);
    expect(responses.some((r) => r.body.replayed)).toBe(true);
    expect(
      await prisma.client.businessOnboarding.count({
        where: { applicationId: f().applications[8] },
      }),
    ).toBe(1);
    await http("post", "/onboarding/start")
      .send({ ...input, membershipId: f().memberships[0] })
      .expect(409);
  });
  it.each(["DENTAL", "FITNESS", "AUTOMOTIVE"])(
    "no convierte %s en un negocio operativo ficticio",
    async (vertical) => {
      expect((await save("sector", { vertical })).status).toBe(400);
      expect((await get()).body.progress.selectedVertical).toBeNull();
    },
  );
  it("guarda Beauty y recupera su progreso sin depender del navegador", async () => {
    const response = await save("sector", { vertical: "BEAUTY" });
    expect(response.status).toBe(200);
    const reloaded = await get();
    expect(reloaded.body.progress.step).toBe(1);
    expect(reloaded.body.progress.selectedVertical).toBe("BEAUTY");
    expect(
      await prisma.client.businessOnboarding.findUnique({
        where: { applicationId: f().applications[8]! },
      }),
    ).toMatchObject({ step: 1, selectedVertical: "BEAUTY" });
  });
  it("valida datos del negocio y rechaza ownerUserId/control de identidad desde React", async () => {
    expect(
      (
        await save("business", {
          business: { ...business, businessEmail: "not-an-email" },
        })
      ).status,
    ).toBe(400);
    const invalid = await body({ business, ownerUserId: f().users[4] });
    await http("put", "/onboarding/business").send(invalid).expect(400);
    expect(
      (await save("business", { business: { ...business, countryCode: "ZZ" } }))
        .status,
    ).toBe(400);
  });
  it("crea negocio, propietario y consumo del piloto en una transacción, sin duplicar por doble clic", async () => {
    const before = await prisma.client.establishment.count(),
      input = await body({ business });
    const responses = await Promise.all([
      http("put", "/onboarding/business").send(input),
      http("put", "/onboarding/business").send(input),
    ]);
    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    const response = await get(),
      id = response.body.configuration.business.id;
    expect(await prisma.client.establishment.count()).toBe(before + 1);
    const members = await prisma.client.membership.findMany({
      where: { establishmentId: id },
    });
    expect(members).toHaveLength(1);
    expect(members[0]?.userId).toBe(f().users[8]);
    expect(
      await prisma.client.manualActivation.findUnique({
        where: { applicationId: f().applications[8]! },
      }),
    ).toMatchObject({ membershipId: members[0]!.id });
    expect(response.body.progress.step).toBe(2);
    expect(response.body.configuration.services).toEqual([]);
    expect(response.body.configuration.professionals).toEqual([]);
    expect((await http("get", "/onboarding/entry")).body.needsOnboarding).toBe(
      true,
    );
  });
  it("dos pestañas con versiones distintas no se pisan y el tenant ajeno no es editable", async () => {
    const current = await get(),
      input = await body({ step: 1 });
    await http("put", "/onboarding/step").send(input).expect(200);
    await http("put", "/onboarding/business")
      .send({
        requestId: randomUUID(),
        version: current.body.progress.version,
        business,
        entityVersion: 0,
      })
      .expect(409);
    expect(
      (
        await save("branches", {
          id: f().tenants[0],
          entityVersion: 0,
          data: {
            name: "Intrusión",
            address: null,
            timeZone: "America/Guayaquil",
            isDefault: true,
          },
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await prisma.client.establishment.findUnique({
          where: { id: f().tenants[0] },
        })
      )?.commercialName,
    ).toContain("CONTROL TEST");
    // A legitimately authorized second context must not be hijacked by this draft.
    const other = await prisma.client.membership.create({
      data: {
        userId: f().users[8]!,
        establishmentId: f().tenants[0]!,
        role: "OWNER",
      },
    });
    try {
      await prisma.client.commercialSession.update({
        where: { id: f().sessions[8]! },
        data: { membershipId: other.id },
      });
      expect(
        (await http("get", "/onboarding/entry")).body.needsOnboarding,
      ).toBe(false);
    } finally {
      await prisma.client.commercialSession.update({
        where: { id: f().sessions[8]! },
        data: { membershipId: null },
      });
      await prisma.client.membership.delete({ where: { id: other.id } });
    }
    expect((await save("step", { step: 2 })).status).toBe(200);
  });
  it("no permite saltar sucursal y horario ni completar una configuración vacía", async () => {
    expect((await save("step", { step: 3 })).status).toBe(409);
    expect((await save("complete")).status).toBe(409);
  });
  it("reutiliza Branch y exige horarios aprobados, con límite de sucursales", async () => {
    const response = await save("branches", {
      data: {
        name: "ONBOARDING TEST principal",
        address: null,
        timeZone: "America/Guayaquil",
        isDefault: true,
      },
    });
    expect(response.status).toBe(201);
    expect(response.body.snapshot.configuration.schedules).toEqual([]);
    expect(
      (
        await save("branches", {
          data: {
            name: "No permitida",
            address: null,
            timeZone: "America/Guayaquil",
            isDefault: false,
          },
        })
      ).status,
    ).toBe(409);
    const branchId = response.body.id;
    const invalidWeek = week.map((d) =>
      d.weekday === 1
        ? {
            ...d,
            intervals: [
              { start: "09:00", end: "15:00" },
              { start: "14:00", end: "18:00" },
            ],
          }
        : d,
    );
    expect(
      (
        await save("schedules", {
          data: {
            branchId,
            professionalId: null,
            timeZone: "America/Guayaquil",
            week: invalidWeek,
            version: null,
          },
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await save("schedules", {
          data: {
            branchId,
            professionalId: null,
            timeZone: "America/Guayaquil",
            week,
            version: null,
          },
        })
      ).status,
    ).toBe(201);
    expect((await save("step", { step: 3 })).status).toBe(200);
  });
  it("reutiliza precios exactos y hace rollback incluso si el error ocurre después de crear", async () => {
    expect(
      (await save("services", { data: { ...service, priceMin: 12.5 } })).status,
    ).toBe(400);
    expect(
      (await save("services", { data: { ...service, priceMin: "12.501" } }))
        .status,
    ).toBe(400);
    expect(
      (await save("services", { data: service, active: "yes" })).status,
    ).toBe(400);
    expect((await get()).body.configuration.services).toEqual([]);
    const input = await body({ data: service, active: true });
    const result = await http("post", "/onboarding/services")
      .send(input)
      .expect(201);
    await http("post", "/onboarding/services").send(input).expect(201);
    expect(result.body.snapshot.configuration.services).toHaveLength(1);
    expect(result.body.snapshot.configuration.services[0].priceMin).toBe(
      "12.5",
    );
    expect((await save("step", { step: 4 })).status).toBe(200);
  });
  it("conserva las cuatro modalidades de precio y las validaciones de valoración", async () => {
    for (const data of [
      { ...service, name: "Desde", priceMode: "FROM" },
      { ...service, name: "Rango", priceMode: "RANGE", priceMax: "20.00" },
      {
        ...service,
        name: "Valoración",
        priceMode: "ASSESSMENT_REQUIRED",
        priceMin: null,
        hasPriorAssessment: true,
        assessmentDescription: "Valoración previa del servicio.",
      },
    ])
      expect((await save("services", { data, active: true })).status).toBe(201);
    expect(
      (
        await save("services", {
          data: { ...service, priceMode: "RANGE", priceMax: "1.00" },
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await save("services", {
          id: (await get()).body.configuration.services[0].id,
          entityVersion: 0,
          data: { ...service, name: "Corte editado" },
          active: true,
        })
      ).status,
    ).toBe(201);
  });
  it("crea profesionales, no usuarios, con asignaciones propias y límites del contrato", async () => {
    const current = await get(),
      cfg = current.body.configuration,
      before = await prisma.client.internalUser.count();
    const data = {
      displayName: "ONBOARDING TEST profesional",
      specialty: null,
      branchIds: [cfg.branches[0].id],
      serviceIds: cfg.services.map((s: { id: string }) => s.id),
    };
    expect(
      (
        await save("professionals", {
          data: { ...data, branchIds: [f().tenants[0]] },
        })
      ).status,
    ).toBe(404);
    const first = await save("professionals", { data });
    expect(first.status).toBe(201);
    expect(await prisma.client.internalUser.count()).toBe(before);
    expect(
      (
        await save("professionals", {
          data: { ...data, displayName: "ONBOARDING TEST segunda persona" },
        })
      ).status,
    ).toBe(201);
    expect(
      (
        await save("professionals", {
          data: { ...data, displayName: "Tercera no autorizada" },
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await save("schedules", {
          data: {
            branchId: cfg.branches[0].id,
            professionalId: first.body.id,
            timeZone: "America/Guayaquil",
            week,
            version: null,
          },
        })
      ).status,
    ).toBe(201);
  });
  it("los recursos son opcionales pero los creados tienen capacidad y sucursal válidas", async () => {
    const cfg = (await get()).body.configuration;
    expect((await get()).body.missing).toEqual([]);
    const data = {
      name: "ONBOARDING TEST silla",
      typeDescription: "Silla individual",
      capacity: 1,
      branchId: cfg.branches[0].id,
    };
    expect(
      (await save("resources", { data: { ...data, capacity: 0 } })).status,
    ).toBe(400);
    const input = await body({ data });
    await http("post", "/onboarding/resources").send(input).expect(201);
    await http("post", "/onboarding/resources").send(input).expect(201);
    expect((await get()).body.configuration.resources).toHaveLength(1);
  });
  it("reconoce una membresía histórica sin duplicarla ni marcarla completa automáticamente", async () => {
    await authorize(7, f().memberships[1]!);
    const before = await prisma.client.establishment.count();
    const result = await save("start", { membershipId: f().memberships[1] }, 7);
    expect(result.status).toBe(201);
    expect(result.body.snapshot.configuration.business.id).toBe(f().tenants[1]);
    expect(result.body.snapshot.progress.createdBusiness).toBe(false);
    expect(result.body.snapshot.progress.completedAt).toBeNull();
    expect(await prisma.client.establishment.count()).toBe(before);
    expect((await save("sector", { vertical: "BEAUTY" }, 7)).status).toBe(409);
    expect(
      (await save("start", { membershipId: f().memberships[0] }, 10)).status,
    ).toBe(403);
  });
  it("reanuda desde otra sesión comercial del mismo usuario y bloquea CSRF", async () => {
    const original = f().tokens[8]!,
      newToken = "r".repeat(43);
    const { digestToken } =
      await import("../src/platform/local-identity.service");
    await prisma.client.commercialSession.create({
      data: {
        identityId: f().identities[8]!,
        digest: digestToken(newToken),
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    f().tokens[8] = newToken;
    expect((await get()).body.configuration.services).toHaveLength(4);
    f().tokens[8] = original;
    await http("put", "/onboarding/step")
      .set("Origin", "https://untrusted.example")
      .send(await body({ step: 5 }))
      .expect(403);
  });
  it("suspender o vencer el piloto bloquea las escrituras y conserva el progreso", async () => {
    const pilot = await prisma.client.manualActivation.findUniqueOrThrow({
      where: { applicationId: f().applications[8]! },
    });
    await http(
      "put",
      `/control/applications/${f().applications[8]}/manual-activation`,
      0,
    )
      .send({
        requestId: randomUUID(),
        confirmId: f().applications[8],
        reason: "ONBOARDING TEST suspensión comprobada",
        action: "SUSPEND",
        version: pilot.version,
      })
      .expect(200);
    expect((await get()).body.status).toBe("SUSPENDED");
    expect((await save("complete")).status).toBe(403);
    await http(
      "put",
      `/control/applications/${f().applications[8]}/manual-activation`,
      0,
    )
      .send({
        requestId: randomUUID(),
        confirmId: f().applications[8],
        reason: "ONBOARDING TEST reanudación comprobada",
        action: "RESUME",
        version: pilot.version + 1,
      })
      .expect(200);
    await prisma.client.manualActivation.update({
      where: { id: pilot.id },
      data: {
        createdAt: new Date(Date.now() - 2 * 86400000),
        expiresAt: new Date(Date.now() - 86400000),
      },
    });
    expect((await get()).body.status).toBe("EXPIRED");
    expect((await save("services", { data: service })).status).toBe(403);
    await prisma.client.manualActivation.update({
      where: { id: pilot.id },
      data: { createdAt: pilot.createdAt, expiresAt: pilot.expiresAt },
    });
    expect((await get()).body.configuration.services).toHaveLength(4);
  });
  it("revierte una escritura si la habilitación vence durante el guardado", async () => {
    const pilot = await prisma.client.manualActivation.findUniqueOrThrow({
        where: { applicationId: f().applications[8]! },
      }),
      before = (await get()).body.configuration.services.length;
    const original = OfferingService.prototype.create;
    const spy = jest
      .spyOn(OfferingService.prototype, "create")
      .mockImplementationOnce(async function (
        this: OfferingService,
        owner,
        data,
        currency,
      ) {
        const created = await original.call(this, owner, data, currency);
        await prisma.client.manualActivation.update({
          where: { id: pilot.id },
          data: {
            createdAt: new Date(Date.now() - 2 * 86400000),
            expiresAt: new Date(Date.now() - 86400000),
          },
        });
        return created;
      });
    try {
      expect(
        (
          await save("services", {
            data: { ...service, name: "No debe persistir al vencer" },
          })
        ).status,
      ).toBe(403);
    } finally {
      spy.mockRestore();
      await prisma.client.manualActivation.update({
        where: { id: pilot.id },
        data: { createdAt: pilot.createdAt, expiresAt: pilot.expiresAt },
      });
    }
    expect((await get()).body.configuration.services).toHaveLength(before);
  });
  it("finaliza con verificación real, idempotencia, fecha y auditoría", async () => {
    expect((await save("step", { step: 5 })).status).toBe(200);
    const input = await body();
    const result = await http("post", "/onboarding/complete")
      .send(input)
      .expect(201);
    await http("post", "/onboarding/complete").send(input).expect(201);
    expect(result.body.snapshot.status).toBe("COMPLETE");
    expect(result.body.snapshot.progress.completedAt).toBeTruthy();
    expect((await http("get", "/onboarding/entry")).body.needsOnboarding).toBe(
      false,
    );
    expect(
      await prisma.client.platformAudit.count({
        where: {
          action: "onboarding.completed",
          resourceId: result.body.snapshot.progress.id,
        },
      }),
    ).toBe(1);
    expect((await save("services", { data: service })).status).toBe(409);
  });
  it("entra por la selección de membresía existente y los límites siguen vigentes en Staff", async () => {
    const snapshot = (await get()).body,
      member = snapshot.memberships.find(
        (m: { establishment: { id: string } }) =>
          m.establishment.id === snapshot.configuration.business.id,
      );
    const selected = await http("post", "/auth/membership")
      .send({ membershipId: member.id })
      .expect(204);
    const cookies = selected.headers["set-cookie"] as unknown as string[];
    const cookie = cookies.find((value) =>
      value.startsWith(commercialCookie() + "="),
    );
    expect(cookie).toBeTruthy();
    f().tokens[8] = cookie!.split(";")[0]!.slice(commercialCookie().length + 1);
    await http("get", "/platform/context").expect(200);
    await http("post", "/staff/professionals")
      .send({
        displayName: "No permitido desde Business",
        specialty: null,
        branchIds: [snapshot.configuration.branches[0].id],
        serviceIds: [],
      })
      .expect(409);
    await http("post", "/staff/branches")
      .send({
        name: "No permitida desde Business",
        address: null,
        timeZone: "America/Guayaquil",
        isDefault: false,
      })
      .expect(409);
    const pilot = await prisma.client.manualActivation.findUniqueOrThrow({
      where: { applicationId: f().applications[8]! },
    });
    await prisma.client.manualActivation.update({
      where: { id: pilot.id },
      data: { state: "SUSPENDED" },
    });
    expect((await http("get", "/onboarding/entry")).body.needsOnboarding).toBe(
      true,
    );
    await http("post", "/staff/resources")
      .send({
        name: "No permitido",
        typeDescription: null,
        branchId: snapshot.configuration.branches[0].id,
        capacity: 1,
      })
      .expect(403);
    await prisma.client.manualActivation.update({
      where: { id: pilot.id },
      data: { state: "ACTIVE" },
    });
    expect((await http("get", "/onboarding/entry")).body.needsOnboarding).toBe(
      false,
    );
  });
  it("Control consulta progreso real sin exponer configuración privada", async () => {
    const id = (await get()).body.configuration.business.id;
    const result = await http("get", "/control/businesses/" + id, 0).expect(
      200,
    );
    expect(result.body.onboarding.completedAt).toBeTruthy();
    expect(JSON.stringify(result.body)).not.toContain(
      "onboarding@example.test",
    );
    const application = await http(
      "get",
      "/control/applications/" + f().applications[8],
      0,
    ).expect(200);
    expect(application.body.onboarding.step).toBe(6);
  });
});
