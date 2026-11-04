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
import { assertTestDatabaseUrl } from "./test-database";
import {
  createControlFixture,
  cleanControlFixture,
  assertControlTestDatabase,
  CONTROL_TEST_ISSUER,
  type ControlFixture,
} from "./control-fixtures";
import { dayPlus } from "../src/appointments/appointment-time";
const root = resolve(__dirname, "..");
config({ path: resolve(root, ".env.test"), quiet: true });
const origin = "http://localhost:5173";
describe("Appointments Beauty: dos instancias NestJS y PostgreSQL real", () => {
  let prisma: PrismaService,
    second: PrismaService,
    app: INestApplication,
    app2: INestApplication,
    f: ControlFixture;
  const old = { ...process.env };
  let day: string;
  type Context = {
    tenant: string;
    branch: string;
    service: string;
    people: string[];
    resource: string;
  };
  const contexts: Context[] = [];
  const http = (
    method: "get" | "post" | "patch",
    path: string,
    index = 4,
    other = false,
  ) => {
    const agent = request((other ? app2 : app).getHttpServer() as Server);
    return agent[method]("/api/appointments" + path)
      .set("Cookie", commercialCookie() + "=" + f.tokens[index])
      .set("Origin", origin);
  };
  const at = (h: number, m = 0) =>
    `${day}T${String(h + 5).padStart(2, "0")}:${String(m).padStart(2, "0")}:00.000Z`;
  const body = (extra: Record<string, unknown> = {}, ctx = 0) => ({
    requestId: randomUUID(),
    branchId: contexts[ctx]!.branch,
    serviceId: contexts[ctx]!.service,
    professionalId: contexts[ctx]!.people[0],
    startsAt: at(9),
    customer: { name: "APPOINTMENTS TEST persona", phone: "0990001111" },
    channel: "PHONE",
    ...extra,
  });
  const create = (
    extra: Record<string, unknown> = {},
    index = 4,
    other = false,
  ) => http("post", "", index, other).send(body(extra, index === 7 ? 1 : 0));
  const availability = (extra: Record<string, string> = {}) =>
    http("get", "/availability").query({
      branchId: contexts[0]!.branch,
      serviceId: contexts[0]!.service,
      date: day,
      step: 15,
      ...extra,
    });
  function change(
    id: string,
    version: number,
    state: string,
    extra: Record<string, unknown> = {},
  ) {
    return http("patch", `/${id}/state`).send({
      requestId: randomUUID(),
      version,
      state,
      reason: "APPOINTMENTS TEST operación",
      ...extra,
    });
  }
  function reschedule(
    id: string,
    version: number,
    extra: Record<string, unknown> = {},
    other = false,
  ) {
    const b = body(extra);
    delete (b as Record<string, unknown>).customer;
    delete (b as Record<string, unknown>).channel;
    return http("patch", `/${id}/reschedule`, 4, other).send({
      ...b,
      version,
      reason: "APPOINTMENTS TEST cambio de horario",
    });
  }
  async function cleanAppointments() {
    if (!f) return;
    const where = { establishmentId: { in: f.tenants } };
    await prisma.client.appointmentEvent.deleteMany({ where });
    await prisma.client.appointmentResource.deleteMany({ where });
    await prisma.client.appointment.deleteMany({ where });
    await prisma.client.appointmentCustomer.deleteMany({ where });
    await prisma.client.appointmentRequest.deleteMany({ where });
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
      OIDC_CLIENT_ID: "appointments-test",
      OIDC_CLIENT_SECRET: "fixture-only",
      OIDC_REDIRECT_URI: origin + "/api/auth/callback",
      COMMERCIAL_STATE_KEY: "a".repeat(64),
    });
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
    prisma = new PrismaService();
    second = new PrismaService();
    await assertControlTestDatabase(prisma);
    f = await createControlFixture(prisma);
    day = dayPlus(new Date().toISOString().slice(0, 10), 3);
    await prisma.client.commercialSubscription.deleteMany({
      where: { applicationId: { in: f.applications } },
    });
    for (let i = 0; i < 2; i++) {
      const tenant = f.tenants[i]!,
        user = i === 0 ? 4 : 7;
      await prisma.client.manualActivation.create({
        data: {
          applicationId: f.applications[user]!,
          membershipId: f.memberships[i]!,
          actorUserId: f.users[0]!,
          plan: "START",
          mode: "COURTESY",
          authorizationBasis: "DIRECT_GRANT",
          reason: "APPOINTMENTS TEST acceso gratuito",
          expiresAt: new Date(Date.now() + 86400000 * 30),
        },
      });
      await prisma.client.commercialSession.update({
        where: { id: f.sessions[user]! },
        data: { membershipId: f.memberships[i]! },
      });
      const branch = (
          await prisma.client.branch.findFirstOrThrow({
            where: { establishmentId: tenant },
          })
        ).id,
        service = (
          await prisma.client.serviceOffering.findFirstOrThrow({
            where: { establishmentId: tenant },
          })
        ).id;
      const person = await prisma.client.professional.findFirstOrThrow({
          where: { establishmentId: tenant },
        }),
        person2 = await prisma.client.professional.create({
          data: {
            establishmentId: tenant,
            displayName: "APPOINTMENTS TEST profesional 2",
          },
        }),
        people = [person.id, person2.id];
      for (const p of people) {
        await prisma.client.professionalBranch.create({
          data: {
            establishmentId: tenant,
            professionalId: p,
            branchId: branch,
          },
        });
        await prisma.client.professionalService.create({
          data: {
            establishmentId: tenant,
            professionalId: p,
            serviceId: service,
          },
        });
      }
      const week = Array.from({ length: 7 }, (_, n) => ({
        weekday: n + 1,
        closed: false,
        intervals: [{ start: "08:00", end: "18:00" }],
      }));
      for (const professionalId of [null, ...people])
        await prisma.client.workSchedule.create({
          data: {
            establishmentId: tenant,
            branchId: branch,
            professionalId,
            timeZone: "America/Guayaquil",
            week,
          },
        });
      const resource = await prisma.client.physicalResource.create({
        data: {
          establishmentId: tenant,
          branchId: branch,
          name: "APPOINTMENTS TEST cabina",
          capacity: 1,
        },
      });
      contexts.push({ tenant, branch, service, people, resource: resource.id });
    }
    const build = async (p: PrismaService) => {
      const m = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(PrismaService)
        .useValue(p)
        .compile();
      const a = m.createNestApplication();
      configureApp(a, loadConfig(process.env));
      await a.listen(0, "127.0.0.1");
      return a;
    };
    app = await build(prisma);
    app2 = await build(second);
  }, 60000);
  beforeEach(async () => {
    await cleanAppointments();
    const c = contexts[0]!;
    await prisma.client.serviceResourceRequirement.deleteMany({
      where: { establishmentId: c.tenant },
    });
    await prisma.client.serviceResourceSet.deleteMany({
      where: { establishmentId: c.tenant },
    });
    await prisma.client.scheduleException.deleteMany({
      where: { establishmentId: c.tenant },
    });
    await prisma.client.serviceOffering.update({
      where: { id: c.service },
      data: { active: true, durationMinutes: 30, bookingMode: "PROFESSIONAL" },
    });
    await prisma.client.branch.update({
      where: { id: c.branch },
      data: { active: true },
    });
    await prisma.client.physicalResource.update({
      where: { id: c.resource },
      data: { capacity: 1, active: true },
    });
    await prisma.client.professional.updateMany({
      where: { establishmentId: c.tenant },
      data: { active: true },
    });
    await prisma.client.manualActivation.updateMany({
      where: { applicationId: f.applications[4]! },
      data: { state: "ACTIVE", expiresAt: new Date(Date.now() + 86400000) },
    });
  });
  afterAll(async () => {
    try {
      await cleanAppointments();
      if (f) await cleanControlFixture(prisma, f);
    } finally {
      await app?.close();
      await app2?.close();
      for (const key of Object.keys(process.env))
        if (!(key in old)) delete process.env[key];
      Object.assign(process.env, old);
    }
  });
  async function requireResource(units = 1) {
    const c = contexts[0]!;
    await prisma.client.serviceResourceSet.create({
      data: {
        establishmentId: c.tenant,
        branchId: c.branch,
        serviceId: c.service,
        resources: { create: { resourceId: c.resource, units } },
      },
    });
  }
  it("ofrece horarios reales, excluye horas fuera de jornada y conserva zona", async () => {
    const r = await availability().expect(200);
    expect(r.body.timeZone).toBe("America/Guayaquil");
    expect(
      r.body.slots.some((s: { startsAt: string }) => s.startsAt === at(8)),
    ).toBe(true);
    expect(
      r.body.slots.some((s: { startsAt: string }) => s.startsAt === at(17, 45)),
    ).toBe(false);
    await create({ startsAt: at(7) }).expect(409);
  });
  it.each([15, 20, 30, 45, 60, 90, 125])(
    "conserva %s minutos exactos sin redondear",
    async (duration) => {
      await prisma.client.serviceOffering.update({
        where: { id: contexts[0]!.service },
        data: { durationMinutes: duration },
      });
      const r = await create().expect(201);
      expect(Date.parse(r.body.endsAt) - Date.parse(r.body.startsAt)).toBe(
        duration * 60000,
      );
      expect(r.body.durationMinutes).toBe(duration);
    },
  );
  it("crea cliente sin correo, normaliza teléfono y permite duplicados explícitos", async () => {
    const a = await http("post", "/customers")
      .send({
        requestId: randomUUID(),
        customer: { name: "APPOINTMENTS TEST uno", phone: "+593 99-222-3333" },
      })
      .expect(201);
    const b = await http("post", "/customers")
      .send({
        requestId: randomUUID(),
        customer: { name: "APPOINTMENTS TEST dos", phone: "+593992223333" },
      })
      .expect(201);
    expect(a.body.id).not.toBe(b.body.id);
    expect(b.body.possibleDuplicates).toBe(1);
    const r = await http("get", "/customers")
      .query({ q: "2223333" })
      .expect(200);
    expect(r.body.items).toHaveLength(2);
    await create({ customer: undefined, customerId: a.body.id }).expect(201);
  });
  it("rechaza servicio inactivo y asignaciones inválidas", async () => {
    await prisma.client.serviceOffering.update({
      where: { id: contexts[0]!.service },
      data: { active: false },
    });
    await create().expect(409);
    await create({ branchId: contexts[1]!.branch }).expect(404);
  });
  it("informa configuración faltante si no hay profesional elegible", async () => {
    await prisma.client.professional.updateMany({
      where: { establishmentId: contexts[0]!.tenant },
      data: { active: false },
    });
    const r = await availability().expect(200);
    expect(r.body.slots).toHaveLength(0);
    expect(r.body.problems.join()).toContain("Asocia un profesional");
  });
  it.each(["CLOSURE", "ABSENCE", "MODIFIED"] as const)(
    "respeta excepción %s",
    async (kind) => {
      const schedule = await prisma.client.workSchedule.findFirstOrThrow({
        where: {
          branchId: contexts[0]!.branch,
          professionalId: kind === "CLOSURE" ? null : contexts[0]!.people[0],
        },
      });
      await prisma.client.scheduleException.create({
        data: {
          establishmentId: contexts[0]!.tenant,
          scheduleId: schedule.id,
          date: new Date(day + "T00:00Z"),
          kind,
          intervals:
            kind === "MODIFIED" ? [{ start: "12:00", end: "14:00" }] : [],
        },
      });
      await create().expect(409);
    },
  );
  it("una sucursal inactiva no ofrece disponibilidad", async () => {
    await prisma.client.branch.update({
      where: { id: contexts[0]!.branch },
      data: { active: false },
    });
    expect((await availability()).body.slots).toHaveLength(0);
    await create().expect(409);
  });
  it.each(["SUSPENDED", "EXPIRED"])(
    "rechaza activación %s incluso con sesión válida",
    async (state) => {
      await prisma.client.manualActivation.updateMany({
        where: { applicationId: f.applications[4]! },
        data:
          state === "SUSPENDED"
            ? { state: "SUSPENDED" }
            : { expiresAt: new Date(Date.now() - 1) },
      });
      await create().expect(403);
      await availability().expect(403);
    },
  );
  it("mantiene aislamiento, origen y denegación por defecto", async () => {
    await request(app.getHttpServer() as Server)
      .get("/api/appointments/configuration")
      .expect(401);
    await http("get", "/configuration", 0).expect(403);
    const a = await create().expect(201);
    await http("get", "/" + a.body.id, 7).expect(404);
    await http("patch", "/" + a.body.id + "/state", 7)
      .send({ requestId: randomUUID(), version: 0, state: "CONFIRMED" })
      .expect(404);
    await http("post", "")
      .set("Origin", "https://other.example")
      .send(body())
      .expect(403);
    await create({ channel: "WHATSAPP" }).expect(400);
    await create({ establishmentId: contexts[1]!.tenant }).expect(400);
  });
  it.each([0, 15])(
    "dos servidores no reservan solapamientos desplazados %s minutos",
    async (offset) => {
      const results = await Promise.all([
        create(),
        create({ startsAt: at(9, offset) }, 4, true),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
      expect(
        await prisma.client.appointment.count({
          where: { establishmentId: contexts[0]!.tenant },
        }),
      ).toBe(1);
    },
  );
  it("permite citas consecutivas y profesionales independientes", async () => {
    await Promise.all([
      create(),
      create({ professionalId: contexts[0]!.people[1] }, 4, true),
    ]).then((rs) => expect(rs.map((r) => r.status)).toEqual([201, 201]));
    await create({ startsAt: at(9, 30) }).expect(201);
  });
  it("recurso de capacidad uno protege dos profesionales diferentes", async () => {
    await requireResource();
    const rs = await Promise.all([
      create(),
      create({ professionalId: contexts[0]!.people[1] }, 4, true),
    ]);
    expect(rs.map((r) => r.status).sort()).toEqual([201, 409]);
  });
  it("recurso sin profesional respeta dos unidades y rechaza la tercera simultánea", async () => {
    await requireResource();
    await prisma.client.physicalResource.update({
      where: { id: contexts[0]!.resource },
      data: { capacity: 2 },
    });
    await prisma.client.serviceOffering.update({
      where: { id: contexts[0]!.service },
      data: { bookingMode: "RESOURCE_ONLY" },
    });
    const rs = await Promise.all([
      create({ professionalId: null }),
      create({ professionalId: null }, 4, true),
      create({ professionalId: null }),
    ]);
    expect(rs.map((r) => r.status).sort()).toEqual([201, 201, 409]);
  });
  it("un recurso insuficiente no genera cita ni cliente huérfano", async () => {
    await requireResource(2);
    await create().expect(409);
    expect(
      await prisma.client.appointmentCustomer.count({
        where: { establishmentId: contexts[0]!.tenant },
      }),
    ).toBe(0);
  });
  it("reintentos concurrentes no duplican cita, cliente ni auditoría", async () => {
    const b = body();
    const rs = await Promise.all([
      http("post", "").send(b),
      http("post", "", 4, true).send(b),
    ]);
    expect(rs.map((r) => r.status)).toEqual([201, 201]);
    expect(rs[0]!.body.id).toBe(rs[1]!.body.id);
    expect(
      await prisma.client.appointmentEvent.count({
        where: { establishmentId: contexts[0]!.tenant },
      }),
    ).toBe(1);
    await http("post", "")
      .send({ ...b, startsAt: at(11) })
      .expect(409);
  });
  it("reagenda sin duplicar identidad, conserva instantánea y revierte conflictos", async () => {
    const a = (await create().expect(201)).body;
    await change(a.id, 0, "CONFIRMED").expect(200);
    await create({ startsAt: at(10) }).expect(201);
    await reschedule(a.id, 1, { startsAt: at(10) }).expect(409);
    expect((await http("get", "/" + a.id)).body.startsAt).toBe(at(9));
    await prisma.client.serviceOffering.update({
      where: { id: contexts[0]!.service },
      data: { durationMinutes: 90, priceMin: "99" },
    });
    const r = await reschedule(a.id, 1, { startsAt: at(11) }).expect(200);
    expect(r.body.id).toBe(a.id);
    expect(r.body.durationMinutes).toBe(30);
    expect(r.body.snapshot.priceMin).toBe(a.snapshot.priceMin);
  });
  it("reagendamientos concurrentes al mismo destino conservan ambas reservas originales", async () => {
    const a = (await create().expect(201)).body,
      b = (await create({ startsAt: at(10) }).expect(201)).body;
    const rs = await Promise.all([
      reschedule(a.id, 0, { startsAt: at(12) }),
      reschedule(b.id, 0, { startsAt: at(12) }, true),
    ]);
    expect(rs.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(
      await prisma.client.appointment.count({
        where: { establishmentId: contexts[0]!.tenant },
      }),
    ).toBe(2);
  });
  it("cancelación simultánea con nueva reserva no genera conflictos incompatibles", async () => {
    const a = (await create().expect(201)).body;
    const rs = await Promise.all([
      change(a.id, 0, "CANCELLED"),
      create({}, 4, true),
    ]);
    expect(rs[0]!.status).toBe(200);
    expect([201, 409]).toContain(rs[1]!.status);
    if (rs[1]!.status === 409) await create().expect(201);
    const r = await availability().expect(200);
    expect(
      r.body.slots.filter(
        (s: { startsAt: string; professionalId: string }) =>
          s.startsAt === at(9) && s.professionalId === contexts[0]!.people[0],
      ),
    ).toHaveLength(0);
  });
  it("cancelar libera el horario y deja trazabilidad separada de Control", async () => {
    const a = (await create().expect(201)).body;
    await change(a.id, 0, "CANCELLED").expect(200);
    await create().expect(201);
    await change(a.id, 1, "CONFIRMED").expect(409);
    const r = await http("get", "/" + a.id);
    expect(r.body.events.map((e: { type: string }) => e.type)).toEqual([
      "CREATED",
      "CANCELLED",
    ]);
  });
  it.each(["COMPLETED", "NO_SHOW"])(
    "finaliza como %s solo cuando corresponde y no reabre",
    async (state) => {
      const a = (await create().expect(201)).body;
      await change(a.id, 0, "CONFIRMED").expect(200);
      await change(a.id, 1, state).expect(409);
      await prisma.client.appointment.update({
        where: { id: a.id },
        data: {
          startsAt: new Date(Date.now() - 7200000),
          endsAt: new Date(Date.now() - 5400000),
        },
      });
      await change(a.id, 1, state).expect(200);
      await change(a.id, 2, "CONFIRMED").expect(409);
      expect((await http("get", "/" + a.id)).body.state).toBe(state);
    },
  );
  it("dos tenants operan simultáneamente y paginan la agenda", async () => {
    const rs = await Promise.all([create(), create({}, 7, true)]);
    expect(rs.map((r) => r.status)).toEqual([201, 201]);
    const r = await http("get", "/agenda")
      .query({ date: day, days: 7 })
      .expect(200);
    expect(r.body.items).toHaveLength(1);
    expect(r.body.total).toBe(1);
    await http("get", "/agenda").query({ date: day, days: 30 }).expect(400);
  });
  it("rechaza fechas pasadas y no registra pagos ni ingresos", async () => {
    await create({ startsAt: "2020-01-01T14:00:00.000Z" }).expect(400);
    await availability({ date: "2020-01-01" }).expect(400);
    expect(await prisma.client.billingPayment.count()).toBe(0);
  });
  it("la restricción PostgreSQL rechaza solapamientos incluso fuera del servicio Nest", async () => {
    const a = (await create().expect(201)).body;
    await expect(
      prisma.client
        .$executeRaw`INSERT INTO "Appointment" (id,"establishmentId","branchId","serviceId","professionalId","customerId","startsAt","endsAt","timeZone","durationMinutes",snapshot,state,channel,"actorUserId","updatedAt") SELECT gen_random_uuid(),"establishmentId","branchId","serviceId","professionalId","customerId","startsAt","endsAt","timeZone","durationMinutes",snapshot,state,channel,"actorUserId","updatedAt" FROM "Appointment" WHERE id=${a.id}::uuid`,
    ).rejects.toThrow();
  });
  it("Staff no reduce la capacidad por debajo de citas simultáneas existentes", async () => {
    const c = contexts[0]!;
    await requireResource();
    await prisma.client.physicalResource.update({
      where: { id: c.resource },
      data: { capacity: 2 },
    });
    await create().expect(201);
    await create({ professionalId: c.people[1] }).expect(201);
    await request(app.getHttpServer() as Server)
      .patch("/api/staff/resources/" + c.resource)
      .set("Cookie", commercialCookie() + "=" + f.tokens[4])
      .set("Origin", origin)
      .send({
        name: "APPOINTMENTS TEST cabina",
        branchId: c.branch,
        typeDescription: null,
        capacity: 1,
        version: 0,
      })
      .expect(409);
  });
  it("la disponibilidad omite la hora inexistente durante DST", async () => {
    const c = contexts[0]!;
    const schedules = await prisma.client.workSchedule.findMany({
      where: { branchId: c.branch },
    });
    try {
      await prisma.client.branch.update({
        where: { id: c.branch },
        data: { timeZone: "America/New_York" },
      });
      await prisma.client.workSchedule.updateMany({
        where: { branchId: c.branch },
        data: {
          timeZone: "America/New_York",
          week: [
            {
              weekday: 7,
              closed: false,
              intervals: [{ start: "01:00", end: "04:00" }],
            },
          ],
        },
      });
      const r = await availability({ date: "2027-03-14", step: "30" }).expect(
        200,
      );
      expect(r.body.slots).toHaveLength(8);
      expect(
        r.body.slots.some((s: { label: string }) => s.label.startsWith("02:")),
      ).toBe(false);
      expect(
        r.body.slots.map((s: { startsAt: string }) => s.startsAt),
      ).toContain("2027-03-14T07:00:00.000Z");
    } finally {
      await prisma.client.branch.update({
        where: { id: c.branch },
        data: { timeZone: "America/Guayaquil" },
      });
      for (const s of schedules)
        await prisma.client.workSchedule.update({
          where: { id: s.id },
          data: {
            timeZone: s.timeZone,
            week: s.week as import("../src/generated/prisma/client").Prisma.InputJsonValue,
          },
        });
    }
  });
  it.each(["DENTAL", "FITNESS", "AUTOMOTIVE"] as const)(
    "bloquea reservas en la vertical %s",
    async (vertical) => {
      const c = contexts[0]!;
      try {
        await prisma.client.establishment.update({
          where: { id: c.tenant },
          data: { vertical },
        });
        await http("get", "/configuration").expect(403);
        await create().expect(403);
      } finally {
        await prisma.client.establishment.update({
          where: { id: c.tenant },
          data: { vertical: "BEAUTY" },
        });
      }
    },
  );
});
