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
import type { StaffService } from "../src/staff/staff.service";
type Configuration = Awaited<ReturnType<StaffService["configuration"]>>;
type Mutation = { id: string; configuration: Configuration };
const apiRoot = resolve(__dirname, "..");
config({ path: resolve(apiRoot, ".env.test"), quiet: true });
const origin = "http://localhost:5173";
const branch = {
  name: "Sucursal sintética",
  address: null,
  timeZone: "America/Guayaquil",
  isDefault: false,
};
const professional = {
  displayName: "Profesional sintético",
  specialty: null,
  branchIds: [] as string[],
  serviceIds: [] as string[],
};
const resource = {
  name: "Cabina sintética",
  typeDescription: "Solo test",
  capacity: 2,
};
const week = [
  {
    weekday: 1,
    closed: false,
    intervals: [
      { start: "09:00", end: "12:00" },
      { start: "14:00", end: "18:00" },
    ],
  },
  { weekday: 7, closed: true, intervals: [] },
];
describe("Staff: operaciones HTTP y PostgreSQL real", () => {
  let prisma: PrismaService,
    app: INestApplication | undefined,
    safe = false;
  const tenants = [randomUUID(), randomUUID()],
    users = [randomUUID(), randomUUID()],
    memberships = [randomUUID(), randomUUID()],
    tokens = [newToken(), newToken()];
  const serviceIds = [randomUUID(), randomUUID()];
  let a: string,
    b: string,
    second: string,
    p: string,
    r: string,
    scheduleId: string,
    exceptionId: string;
  let cfg: Configuration;
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    APP_ENV: process.env.APP_ENV,
    LOCAL_ACCESS_ENABLED: process.env.LOCAL_ACCESS_ENABLED,
    DATABASE_URL: process.env.DATABASE_URL,
    WEB_ORIGIN: process.env.WEB_ORIGIN,
  };
  function api(
    method: "get" | "post" | "patch" | "put" | "delete",
    path: string,
    index = 0,
  ) {
    const client = request(app!.getHttpServer() as Server);
    return client[method](`/api/staff/${path}`)
      .set("Cookie", `bw_local_session=${tokens[index]}`)
      .set("Origin", origin);
  }
  async function mutation(
    method: "post" | "patch" | "put",
    path: string,
    body: object,
    index = 0,
  ) {
    const response = await api(method, path, index)
      .send(body)
      .expect(method === "post" ? 201 : 200);
    const result = response.body as Mutation;
    cfg = result.configuration;
    return result.id;
  }
  const scheduleBody = () => ({
    branchId: a,
    professionalId: p,
    timeZone: branch.timeZone,
    week,
    version: null,
  });
  beforeAll(async () => {
    const url = assertTestDatabaseUrl(process.env.TEST_DATABASE_URL);
    process.env.DATABASE_URL = url;
    prisma = new PrismaService();
    const identity = await prisma.client.$queryRaw<
      Array<{ database: string; username: string }>
    >`SELECT current_database() AS database,current_user AS username`;
    if (
      identity[0]?.database !== "beauty_wellness_test" ||
      identity[0]?.username !== "bw_test"
    )
      throw new Error("Destino no autorizado");
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
        data: {
          id: tenants[i]!,
          commercialName: `Staff sintético ${i}`,
          vertical: "BEAUTY",
        },
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
          digest: digestToken(tokens[i]!),
          kind: "SESSION",
          membershipId: memberships[i]!,
          expiresAt: new Date(Date.now() + 600000),
        },
      });
      await prisma.client.serviceOffering.create({
        data: {
          id: serviceIds[i]!,
          establishmentId: tenants[i]!,
          name: `Servicio sintético ${i}`,
          description: "Test",
          durationMinutes: 30,
          priceMode: "FIXED",
          priceMin: "10",
          currency: "USD",
        },
      });
    }
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication();
    configureApp(app, loadConfig({ NODE_ENV: "test" }));
    await app.init();
    b = await mutation(
      "post",
      "branches",
      { ...branch, name: "Sucursal B" },
      1,
    );
  });
  afterAll(async () => {
    try {
      if (safe) {
        const where = { establishmentId: { in: tenants } };
        await prisma.client.$transaction(async (tx) => {
          await tx.serviceResourceRequirement.deleteMany({ where });
          await tx.serviceResourceSet.deleteMany({ where });
          await tx.scheduleException.deleteMany({ where });
          await tx.workSchedule.deleteMany({ where });
          await tx.professionalBranch.deleteMany({ where });
          await tx.professionalService.deleteMany({ where });
          await tx.physicalResource.deleteMany({ where });
          await tx.professional.deleteMany({ where });
          await tx.branch.deleteMany({ where });
          await tx.serviceOffering.deleteMany({ where });
          await tx.membership.deleteMany({
            where: { id: { in: memberships }, userId: { in: users } },
          });
          await tx.internalUser.deleteMany({ where: { id: { in: users } } });
          await tx.establishment.deleteMany({ where: { id: { in: tenants } } });
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
  it("empieza sin sucursales ni profesionales ficticios", async () => {
    const res = await api("get", "configuration").expect(200);
    expect(res.body.branches).toEqual([]);
    expect(res.body.professionals).toEqual([]);
  });
  it("crea y edita sucursales; principal explícita, única y versionada", async () => {
    a = await mutation("post", "branches", { ...branch, isDefault: true });
    second = await mutation("post", "branches", {
      ...branch,
      name: "Segunda sucursal",
      isDefault: true,
    });
    expect(cfg.branches.find((v) => v.id === a)).toMatchObject({
      isDefault: false,
      version: 1,
    });
    expect(cfg.branches.filter((v) => v.isDefault)).toHaveLength(1);
    await api("patch", `branches/${a}`)
      .send({ ...branch, version: 0 })
      .expect(409);
    await mutation("patch", `branches/${a}`, {
      ...branch,
      name: "Sucursal editada",
      version: 1,
    });
    expect(
      (await prisma.client.branch.findUniqueOrThrow({ where: { id: a } })).name,
    ).toBe("Sucursal editada");
    await api("patch", `branches/${second}/status`)
      .send({ active: false, version: 0 })
      .expect(409);
  });
  it("desactiva y reactiva una sucursal sin borrarla", async () => {
    await mutation("patch", `branches/${a}/status`, {
      active: false,
      version: 2,
    });
    expect(cfg.branches.find((v) => v.id === a)?.active).toBe(false);
    await mutation("patch", `branches/${a}/status`, {
      active: true,
      version: 3,
    });
    expect(cfg.branches.find((v) => v.id === a)?.active).toBe(true);
    await api("delete", `branches/${a}`).expect(404);
  });
  it("crea profesional sin cuenta y asigna varios lugares y servicios", async () => {
    const before = await prisma.client.internalUser.count({
      where: { id: { in: users } },
    });
    p = await mutation("post", "professionals", {
      ...professional,
      branchIds: [a, second],
      serviceIds: [serviceIds[0]],
    });
    expect(cfg.professionals[0]).toMatchObject({
      id: p,
      branchIds: expect.arrayContaining([a, second]),
      serviceIds: [serviceIds[0]],
    });
    expect(
      await prisma.client.internalUser.count({ where: { id: { in: users } } }),
    ).toBe(before);
    await mutation("patch", `professionals/${p}`, {
      ...professional,
      displayName: "Editado",
      branchIds: [a],
      serviceIds: [serviceIds[0]],
      version: 0,
    });
    expect(
      await prisma.client.professionalBranch.count({
        where: { professionalId: p, active: false },
      }),
    ).toBe(1);
  });
  it("rechaza asociaciones de A con B y hace rollback completo", async () => {
    await api("patch", `professionals/${p}`)
      .send({
        ...professional,
        branchIds: [a, b],
        serviceIds: [serviceIds[0]],
        version: 1,
      })
      .expect(404);
    await api("patch", `professionals/${p}`)
      .send({
        ...professional,
        branchIds: [a],
        serviceIds: [serviceIds[1]],
        version: 1,
      })
      .expect(404);
    expect(
      (await prisma.client.professional.findUniqueOrThrow({ where: { id: p } }))
        .version,
    ).toBe(1);
    expect(
      await prisma.client.professionalService.count({
        where: { professionalId: p, active: true },
      }),
    ).toBe(1);
  });
  it("no permite nuevas asociaciones inactivas", async () => {
    await mutation("patch", `branches/${a}/status`, {
      active: false,
      version: 4,
    });
    await api("post", "professionals")
      .send({ ...professional, branchIds: [a] })
      .expect(409);
    await mutation("patch", `branches/${a}/status`, {
      active: true,
      version: 5,
    });
    await prisma.client.serviceOffering.update({
      where: { id: serviceIds[0]! },
      data: { active: false },
    });
    await api("post", "professionals")
      .send({ ...professional, serviceIds: [serviceIds[0]] })
      .expect(409);
    await prisma.client.serviceOffering.update({
      where: { id: serviceIds[0]! },
      data: { active: true },
    });
  });
  it("desactiva y reactiva profesional preservando asociaciones", async () => {
    await mutation("patch", `professionals/${p}/status`, {
      active: false,
      version: 1,
    });
    await api("put", "schedules").send(scheduleBody()).expect(409);
    await mutation("patch", `professionals/${p}/status`, {
      active: true,
      version: 2,
    });
    expect(cfg.professionals.find((v) => v.id === p)?.serviceIds).toEqual([
      serviceIds[0],
    ]);
  });
  it("persiste semana con pausas, cerrado y días sin configurar", async () => {
    scheduleId = await mutation("put", "schedules", scheduleBody());
    const saved = await prisma.client.workSchedule.findUniqueOrThrow({
      where: { id: scheduleId },
    });
    expect(saved.week).toEqual(week);
    expect(saved.timeZone).toBe("America/Guayaquil");
    const res = await api("get", "configuration").expect(200);
    expect(res.body.schedules[0].week).toEqual(week);
    await api("put", "schedules").send(scheduleBody()).expect(409);
    await mutation("put", "schedules", { ...scheduleBody(), version: 0 });
  });
  it("no admite solapamientos, medianoche ni ámbito externo o sin asignación", async () => {
    await api("put", "schedules")
      .send({
        ...scheduleBody(),
        version: 1,
        week: [
          {
            weekday: 1,
            closed: false,
            intervals: [
              { start: "09:00", end: "12:00" },
              { start: "11:00", end: "13:00" },
            ],
          },
        ],
      })
      .expect(400);
    await api("put", "schedules")
      .send({
        ...scheduleBody(),
        week: [
          {
            weekday: 1,
            closed: false,
            intervals: [{ start: "23:00", end: "01:00" }],
          },
        ],
      })
      .expect(400);
    await api("put", "schedules")
      .send({ ...scheduleBody(), branchId: b })
      .expect(404);
    await api("put", "schedules")
      .send({ ...scheduleBody(), branchId: second })
      .expect(409);
    await api("patch", `branches/${a}`)
      .send({ ...branch, timeZone: "America/Lima", version: 6 })
      .expect(409);
  });
  it("crea horario de sucursal independiente del profesional", async () => {
    await mutation("put", "schedules", {
      ...scheduleBody(),
      professionalId: null,
      week: [],
    });
    expect(cfg.schedules).toHaveLength(2);
    await api("put", "schedules")
      .send({ ...scheduleBody(), professionalId: null, week: [] })
      .expect(409);
  });
  it("crea, modifica, desactiva y reactiva excepciones por fecha", async () => {
    const exception = {
      date: "2026-11-10",
      kind: "ABSENCE",
      intervals: [],
      note: "Solo prueba",
    };
    exceptionId = await mutation(
      "post",
      `schedules/${scheduleId}/exceptions`,
      exception,
    );
    expect(cfg.exceptions[0]?.date).toBe("2026-11-10");
    await api("post", `schedules/${scheduleId}/exceptions`)
      .send(exception)
      .expect(409);
    await mutation("patch", `exceptions/${exceptionId}`, {
      ...exception,
      kind: "MODIFIED",
      intervals: [{ start: "10:00", end: "12:00" }],
      version: 0,
    });
    await mutation("patch", `exceptions/${exceptionId}/status`, {
      active: false,
      version: 1,
    });
    expect(cfg.exceptions[0]?.active).toBe(false);
    await mutation("patch", `exceptions/${exceptionId}/status`, {
      active: true,
      version: 2,
    });
    await api("patch", `exceptions/${exceptionId}`)
      .send({ ...exception, date: "2026-02-30", version: 3 })
      .expect(400);
  });
  it("crea y edita recursos con capacidad positiva y sucursal fija", async () => {
    r = await mutation("post", "resources", { ...resource, branchId: a });
    await mutation("patch", `resources/${r}`, {
      ...resource,
      name: "Recurso editado",
      branchId: a,
      version: 0,
    });
    await api("patch", `resources/${r}`)
      .send({ ...resource, branchId: second, version: 1 })
      .expect(409);
    await api("post", "resources")
      .send({ ...resource, branchId: a, capacity: 0 })
      .expect(400);
    await api("post", "resources")
      .send({ ...resource, branchId: b })
      .expect(404);
  });
  it("requerimientos respetan capacidad, tenant y sucursal; conserva historial", async () => {
    const path = `branches/${a}/services/${serviceIds[0]}/resources`;
    await mutation("put", path, {
      resources: [{ resourceId: r, units: 2 }],
      version: null,
    });
    await api("put", path)
      .send({ resources: [{ resourceId: r, units: 3 }], version: 0 })
      .expect(409);
    await api("put", `branches/${second}/services/${serviceIds[0]}/resources`)
      .send({ resources: [{ resourceId: r, units: 1 }], version: null })
      .expect(404);
    await api("put", `branches/${a}/services/${serviceIds[1]}/resources`)
      .send({ resources: [{ resourceId: r, units: 1 }], version: null })
      .expect(404);
    await api("patch", `resources/${r}/status`)
      .send({ active: false, version: 1 })
      .expect(409);
    await api("patch", `resources/${r}`)
      .send({ ...resource, branchId: a, capacity: 1, version: 1 })
      .expect(409);
    await mutation("put", path, { resources: [], version: 0 });
    expect(
      await prisma.client.serviceResourceRequirement.count({
        where: { resourceId: r, active: false },
      }),
    ).toBe(1);
    await mutation("patch", `resources/${r}/status`, {
      active: false,
      version: 1,
    });
    await api("put", path)
      .send({ resources: [{ resourceId: r, units: 1 }], version: 1 })
      .expect(409);
    await mutation("patch", `resources/${r}/status`, {
      active: true,
      version: 2,
    });
  });
  it("permite varios servicios por persona y varias personas por servicio", async () => {
    const extra = await prisma.client.serviceOffering.create({
      data: {
        establishmentId: tenants[0]!,
        name: "Segundo servicio de A",
        description: "Test",
        durationMinutes: 20,
        priceMode: "FIXED",
        priceMin: "5",
        currency: "USD",
      },
    });
    const another = await mutation("post", "professionals", {
      ...professional,
      displayName: "Otra persona de prueba",
      branchIds: [a, second],
      serviceIds: [serviceIds[0], extra.id],
    });
    expect(cfg.professionals.find((v) => v.id === another)?.serviceIds).toEqual(
      expect.arrayContaining([serviceIds[0], extra.id]),
    );
    expect(
      await prisma.client.professionalService.count({
        where: {
          establishmentId: tenants[0]!,
          serviceId: serviceIds[0]!,
          active: true,
        },
      }),
    ).toBe(2);
  });
  it("serializa dos guardados simultáneos de la misma semana sin sobrescritura", async () => {
    const draft = {
      ...scheduleBody(),
      professionalId: null,
      branchId: second,
      week: [],
    };
    const responses = await Promise.all([
      api("put", "schedules").send(draft),
      api("put", "schedules").send(draft),
    ]);
    expect(responses.map((res) => res.status).sort()).toEqual([200, 409]);
    expect(
      await prisma.client.workSchedule.count({
        where: {
          establishmentId: tenants[0]!,
          branchId: second,
          professionalId: null,
        },
      }),
    ).toBe(1);
  });
  it("PostgreSQL impide FKs entre tenants y capacidades no positivas", async () => {
    await expect(
      prisma.client.professionalBranch.create({
        data: { establishmentId: tenants[0]!, professionalId: p, branchId: b },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.client.professionalService.create({
        data: {
          establishmentId: tenants[0]!,
          professionalId: p,
          serviceId: serviceIds[1]!,
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.client.physicalResource.create({
        data: {
          ...resource,
          branchId: a,
          establishmentId: tenants[0]!,
          capacity: -1,
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.client.branch.create({
        data: { ...branch, isDefault: true, establishmentId: tenants[0]! },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.client.workSchedule.create({
        data: {
          establishmentId: tenants[0]!,
          branchId: a,
          professionalId: null,
          timeZone: branch.timeZone,
          week: [],
        },
      }),
    ).rejects.toThrow();
  });
  it("B no consulta ni cambia entidades de A; A no cambia sucursal de B", async () => {
    const res = await api("get", "configuration", 1).expect(200);
    expect(res.body.branches.map((v: { id: string }) => v.id)).toEqual([b]);
    expect(res.body.professionals).toEqual([]);
    for (const [kind, id] of [
      ["branches", a],
      ["professionals", p],
      ["resources", r],
      ["exceptions", exceptionId],
    ])
      await api("patch", `${kind}/${id}/status`, 1)
        .send({ active: false, version: 0 })
        .expect(404);
    await api("patch", `branches/${b}`)
      .send({ ...branch, version: 0 })
      .expect(404);
    await api("post", `schedules/${scheduleId}/exceptions`, 1)
      .send({ date: "2026-11-11", kind: "CLOSURE", intervals: [] })
      .expect(404);
  });
  it("rechaza tenant, privilegios, identificadores y credenciales no autorizados", async () => {
    await api("get", `configuration?establishmentId=${tenants[1]}`).expect(400);
    await api("post", "branches")
      .send({ ...branch, establishmentId: tenants[1] })
      .expect(400);
    await api("post", "professionals")
      .send({ ...professional, active: false })
      .expect(400);
    await api("post", "resources")
      .send({ ...resource, branchId: a, status: "ACTIVE" })
      .expect(400);
    await api("patch", "branches/bad/status")
      .send({ active: true, version: 0 })
      .expect(400);
    await request(app!.getHttpServer() as Server)
      .get("/api/staff/configuration")
      .expect(401);
    await api("post", "branches")
      .set("Origin", "https://other.example")
      .send(branch)
      .expect(403);
  });
  it("sigue cerrado en producción, staging y pertenencia revocada", async () => {
    try {
      process.env.NODE_ENV = "production";
      await api("get", "configuration").expect(404);
      process.env.NODE_ENV = "development";
      process.env.APP_ENV = "staging";
      await api("get", "configuration").expect(404);
      process.env.APP_ENV = "local";
      await prisma.client.membership.update({
        where: { id: memberships[0]! },
        data: { status: "REVOKED" },
      });
      await api("get", "configuration").expect(403);
    } finally {
      process.env.NODE_ENV = "development";
      process.env.APP_ENV = "local";
      await prisma.client.membership.update({
        where: { id: memberships[0]! },
        data: { status: "ACTIVE" },
      });
    }
  });
  it("elimina profesional con relaciones y horarios, sin borrar servicios ni sucursales", async () => {
    const location = await prisma.client.branch.create({
      data: { ...branch, establishmentId: tenants[0]! },
    });
    const person = await prisma.client.professional.create({
      data: {
        displayName: "Eliminar solo en test",
        establishmentId: tenants[0]!,
      },
    });
    const where = { establishmentId: tenants[0]!, professionalId: person.id };
    await prisma.client.professionalBranch.create({
      data: { ...where, branchId: location.id },
    });
    await prisma.client.professionalService.create({
      data: { ...where, serviceId: serviceIds[0]! },
    });
    const schedule = await prisma.client.workSchedule.create({
      data: {
        ...where,
        branchId: location.id,
        timeZone: branch.timeZone,
        week,
      },
    });
    await prisma.client.scheduleException.create({
      data: {
        establishmentId: tenants[0]!,
        scheduleId: schedule.id,
        date: new Date("2026-12-01"),
        kind: "CLOSURE",
        intervals: [],
      },
    });
    await api("delete", "professionals/" + person.id, 1)
      .send({ version: 0 })
      .expect(404);
    await api("delete", "professionals/" + person.id)
      .send({ version: 9 })
      .expect(409);
    expect(await prisma.client.workSchedule.count({ where })).toBe(1);
    const result = await api("delete", "professionals/" + person.id)
      .send({ version: 0 })
      .expect(200);
    expect(
      (result.body as Mutation).configuration.professionals.some(
        (item) => item.id === person.id,
      ),
    ).toBe(false);
    expect(
      await prisma.client.professional.count({ where: { id: person.id } }),
    ).toBe(0);
    expect(await prisma.client.professionalBranch.count({ where })).toBe(0);
    expect(await prisma.client.professionalService.count({ where })).toBe(0);
    expect(await prisma.client.workSchedule.count({ where })).toBe(0);
    expect(
      await prisma.client.scheduleException.count({
        where: { scheduleId: schedule.id },
      }),
    ).toBe(0);
    expect(
      await prisma.client.branch.count({ where: { id: location.id } }),
    ).toBe(1);
    expect(
      await prisma.client.serviceOffering.count({
        where: { id: serviceIds[0] },
      }),
    ).toBe(1);
  });
  it("elimina servicio y solo sus asignaciones y requisitos físicos", async () => {
    const tenant = tenants[0]!;
    const service = await prisma.client.serviceOffering.create({
      data: {
        establishmentId: tenant,
        name: "Eliminar en test",
        description: "Test",
        durationMinutes: 30,
        priceMode: "FIXED",
        priceMin: "10",
        currency: "USD",
      },
    });
    const location = await prisma.client.branch.create({
      data: { ...branch, establishmentId: tenant },
    });
    const person = await prisma.client.professional.create({
      data: { displayName: "Conservar profesional", establishmentId: tenant },
    });
    const equipment = await prisma.client.physicalResource.create({
      data: { ...resource, branchId: location.id, establishmentId: tenant },
    });
    await prisma.client.professionalService.create({
      data: {
        establishmentId: tenant,
        professionalId: person.id,
        serviceId: service.id,
      },
    });
    await prisma.client.serviceResourceSet.create({
      data: {
        establishmentId: tenant,
        branchId: location.id,
        serviceId: service.id,
      },
    });
    await prisma.client.serviceResourceRequirement.create({
      data: {
        establishmentId: tenant,
        branchId: location.id,
        serviceId: service.id,
        resourceId: equipment.id,
        units: 1,
      },
    });
    await request(app!.getHttpServer() as Server)
      .delete("/api/offering/services/" + service.id)
      .set("Cookie", "bw_local_session=" + tokens[0])
      .set("Origin", origin)
      .send({ version: 0 })
      .expect(200);
    const where = { establishmentId: tenant, serviceId: service.id };
    expect(
      await prisma.client.serviceOffering.count({ where: { id: service.id } }),
    ).toBe(0);
    expect(await prisma.client.professionalService.count({ where })).toBe(0);
    expect(await prisma.client.serviceResourceSet.count({ where })).toBe(0);
    expect(
      await prisma.client.serviceResourceRequirement.count({ where }),
    ).toBe(0);
    expect(
      await prisma.client.professional.count({ where: { id: person.id } }),
    ).toBe(1);
    expect(
      await prisma.client.physicalResource.count({
        where: { id: equipment.id },
      }),
    ).toBe(1);
  });
});
