import { randomUUID, createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";
import { config } from "dotenv";
import { assertTestDatabaseUrl } from "./test-database";
const root = resolve(__dirname, "..");
config({ path: resolve(root, ".env.test"), quiet: true });
it("migra el esquema M1.6 con datos y todas sus asociaciones sin reclasificar ni perder filas", async () => {
  const url = assertTestDatabaseUrl(process.env.TEST_DATABASE_URL);
  const client = new Client({ connectionString: url });
  const schema = `m161_migration_${randomUUID().replaceAll("-", "")}`;
  let created = false;
  await client.connect();
  try {
    const identity = await client.query<{ database: string; username: string }>(
      "SELECT current_database() AS database,current_user AS username",
    );
    if (
      identity.rows[0]?.database !== "beauty_wellness_test" ||
      identity.rows[0]?.username !== "bw_test"
    )
      throw new Error("Destino de pruebas no autorizado");
    await client.query(`CREATE SCHEMA "${schema}"`);
    created = true;
    await client.query(`SET search_path TO "${schema}"`);
    for (const migration of [
      "20261027000100_persistence_probe",
      "20261027000200_local_establishment",
      "20261027000300_service_catalog",
      "20261027000400_staff_operations",
    ])
      await client.query(
        readFileSync(
          resolve(root, "prisma/migrations", migration, "migration.sql"),
          "utf8",
        ),
      );
    async function insert(table: string, row: Record<string, unknown>) {
      const keys = Object.keys(row);
      await client.query(
        `INSERT INTO "${table}" (${keys.map((k) => `"${k}"`).join(",")}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(",")})`,
        Object.values(row),
      );
    }
    const tenant = randomUUID(),
      user = randomUUID(),
      membership = randomUUID(),
      branch = randomUUID(),
      professional = randomUUID(),
      resource = randomUUID(),
      schedule = randomUUID();
    const now = new Date();
    await insert("Establishment", {
      id: tenant,
      commercialName: "Origen no clasificado sintético",
      updatedAt: now,
    });
    await insert("InternalUser", {
      id: user,
      displayName: "Prueba de migración",
    });
    await insert("Membership", {
      id: membership,
      userId: user,
      establishmentId: tenant,
      role: "OWNER",
    });
    await insert("LocalCredential", {
      id: randomUUID(),
      digest: createHash("sha256").update(randomUUID()).digest("hex"),
      kind: "SESSION",
      membershipId: membership,
      expiresAt: new Date(Date.now() + 600000),
    });
    const services: string[] = [];
    for (const priceMode of ["FIXED", "FROM", "RANGE", "ASSESSMENT_REQUIRED"]) {
      const id = randomUUID();
      services.push(id);
      await insert("ServiceOffering", {
        id,
        establishmentId: tenant,
        name: `Servicio ${priceMode}`,
        description: "Sintético",
        durationMinutes: 30,
        priceMode,
        priceMin: priceMode === "ASSESSMENT_REQUIRED" ? null : "10",
        priceMax: priceMode === "RANGE" ? "20" : null,
        currency: "USD",
        updatedAt: now,
      });
    }
    await insert("Branch", {
      id: branch,
      establishmentId: tenant,
      name: "Sucursal sintética",
      timeZone: "America/Guayaquil",
      updatedAt: now,
    });
    await insert("Professional", {
      id: professional,
      establishmentId: tenant,
      displayName: "Profesional sintético",
      updatedAt: now,
    });
    await insert("ProfessionalBranch", {
      establishmentId: tenant,
      professionalId: professional,
      branchId: branch,
    });
    await insert("ProfessionalService", {
      establishmentId: tenant,
      professionalId: professional,
      serviceId: services[0],
    });
    await insert("PhysicalResource", {
      id: resource,
      establishmentId: tenant,
      branchId: branch,
      name: "Recurso sintético",
      capacity: 1,
      updatedAt: now,
    });
    await insert("WorkSchedule", {
      id: schedule,
      establishmentId: tenant,
      branchId: branch,
      professionalId: professional,
      timeZone: "America/Guayaquil",
      week: JSON.stringify([{ weekday: 1, closed: true, intervals: [] }]),
      updatedAt: now,
    });
    await insert("ScheduleException", {
      id: randomUUID(),
      establishmentId: tenant,
      scheduleId: schedule,
      date: "2026-10-29",
      kind: "CLOSURE",
      intervals: "[]",
      updatedAt: now,
    });
    await insert("ServiceResourceSet", {
      establishmentId: tenant,
      branchId: branch,
      serviceId: services[0],
      updatedAt: now,
    });
    await insert("ServiceResourceRequirement", {
      establishmentId: tenant,
      branchId: branch,
      serviceId: services[0],
      resourceId: resource,
      units: 1,
    });
    const tables = [
      "Establishment",
      "InternalUser",
      "Membership",
      "LocalCredential",
      "ServiceOffering",
      "Branch",
      "Professional",
      "ProfessionalBranch",
      "ProfessionalService",
      "PhysicalResource",
      "WorkSchedule",
      "ScheduleException",
      "ServiceResourceSet",
      "ServiceResourceRequirement",
    ];
    async function snapshot() {
      const result: Record<string, unknown> = {};
      for (const table of tables) {
        const rows = await client.query(
          `SELECT (to_jsonb(t)-'vertical'-'verticalConfiguredAt'-'verticalConfigurationReason') AS row FROM "${table}" t ORDER BY (to_jsonb(t)-'vertical'-'verticalConfiguredAt'-'verticalConfigurationReason')::text`,
        );
        result[table] = rows.rows;
      }
      return result;
    }
    const before = await snapshot();
    await client.query(
      readFileSync(
        resolve(
          root,
          "prisma/migrations/20261029000100_appointments_verticals/migration.sql",
        ),
        "utf8",
      ),
    );
    expect(await snapshot()).toEqual(before);
    const classified = await client.query(
      'SELECT vertical,"verticalConfiguredAt" FROM "Establishment"',
    );
    expect(classified.rows).toEqual([
      { vertical: null, verticalConfiguredAt: null },
    ]);
    expect(
      (await client.query('SELECT count(*) FROM "ServiceOffering"')).rows[0]
        ?.count,
    ).toBe("4");
  } finally {
    // Only this test's newly created, random schema. Never public or a pre-existing schema.
    if (created && /^m161_migration_[a-f0-9]{32}$/.test(schema))
      await client.query(`DROP SCHEMA "${schema}" CASCADE`);
    await client.end();
  }
});
