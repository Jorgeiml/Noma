import { randomUUID } from "node:crypto";
import {
  branchDto,
  professionalDto,
  resourceDto,
  scheduleDto,
  exceptionDto,
  requirementsDto,
  statusDto,
  intervalsDto,
} from "./staff.dto";
const branchId = randomUUID();
const interval = { start: "09:00", end: "12:00" };
const schedule = {
  branchId,
  professionalId: null,
  timeZone: "America/Guayaquil",
  week: [{ weekday: 1, closed: false, intervals: [interval] }],
  version: null,
};
describe("Staff: DTOs estrictos y tiempos locales", () => {
  it("conserva días ausentes, cierre explícito y pausas", () => {
    const value = scheduleDto({
      ...schedule,
      week: [
        {
          weekday: 1,
          closed: false,
          intervals: [interval, { start: "14:00", end: "18:00" }],
        },
        { weekday: 7, closed: true, intervals: [] },
      ],
    });
    expect(value.week).toHaveLength(2);
    expect(value.week[1]!.closed).toBe(true);
    expect(value.week.find((d) => d.weekday === 2)).toBeUndefined();
  });
  it.each([
    [{ start: "12:00", end: "09:00" }],
    [{ start: "09:00", end: "09:00" }],
    [{ start: "23:00", end: "01:00" }],
    [{ start: "24:00", end: "25:00" }],
    [{ start: "9:00", end: "12:00" }],
    [{ start: "09:00Z", end: "12:00Z" }],
    [interval, { start: "11:59", end: "14:00" }],
    [interval, interval],
  ])("rechaza intervalos inválidos %j", (...raw) =>
    expect(() => intervalsDto(raw)).toThrow(),
  );
  it("acepta intervalos contiguos y los ordena", () =>
    expect(intervalsDto([{ start: "12:00", end: "14:00" }, interval])).toEqual([
      interval,
      { start: "12:00", end: "14:00" },
    ]));
  it.each([
    { week: [{ weekday: 1, closed: true, intervals: [interval] }] },
    { week: [{ weekday: 1, closed: false, intervals: [] }] },
    { week: [{ weekday: 8, closed: true, intervals: [] }] },
    {
      week: [
        { weekday: 1, closed: true, intervals: [] },
        { weekday: 1, closed: true, intervals: [] },
      ],
    },
    { timeZone: "Invalid/Zone" },
    { timeZone: "-05:00" },
    { version: -1 },
    { professionalId: "bad" },
    { establishmentId: branchId },
  ])("rechaza semana, zona, versión o privilegios inválidos %j", (change) =>
    expect(() => scheduleDto({ ...schedule, ...change })).toThrow(),
  );
  it.each([
    "2026-02-29",
    "2026-04-31",
    "2026-13-01",
    "0000-01-01",
    "27/10/2026",
    "2026-10-27T00:00:00Z",
  ])("rechaza fecha inexistente o timestamp %s", (date) =>
    expect(() =>
      exceptionDto({ date, kind: "CLOSURE", intervals: [] }),
    ).toThrow(),
  );
  it("acepta fecha bisiesta y modificación con intervalos", () =>
    expect(
      exceptionDto({
        date: "2028-02-29",
        kind: "MODIFIED",
        intervals: [interval],
      }).date,
    ).toBe("2028-02-29"));
  it.each([
    { kind: "ABSENCE", intervals: [interval] },
    { kind: "MODIFIED", intervals: [] },
    { kind: "UNKNOWN", intervals: [] },
  ])("valida tipo e intervalos de excepción %j", (v) =>
    expect(() => exceptionDto({ date: "2026-10-27", ...v })).toThrow(),
  );
  it.each([0, -1, 1.5, "2", 2147483648])("rechaza capacidad %s", (capacity) =>
    expect(() => resourceDto({ branchId, name: "Cabina", capacity })).toThrow(),
  );
  it("rechaza asociaciones duplicadas y campos de cuentas", () => {
    expect(() =>
      professionalDto({
        displayName: "Ana",
        branchIds: [branchId, branchId],
        serviceIds: [],
      }),
    ).toThrow();
    expect(() =>
      professionalDto({
        displayName: "Ana",
        branchIds: [],
        serviceIds: [],
        email: "a@example.com",
      }),
    ).toThrow();
    expect(() =>
      branchDto({
        name: "S",
        timeZone: "America/Guayaquil",
        isDefault: false,
        status: "ACTIVE",
      }),
    ).toThrow();
    expect(() =>
      statusDto({ active: true, version: 0, role: "OWNER" }),
    ).toThrow();
  });
  it("valida unidades y duplicados en requerimientos", () => {
    expect(() =>
      requirementsDto({
        resources: [{ resourceId: branchId, units: 0 }],
        version: null,
      }),
    ).toThrow();
    expect(() =>
      requirementsDto({
        resources: [
          { resourceId: branchId, units: 1 },
          { resourceId: branchId, units: 1 },
        ],
        version: null,
      }),
    ).toThrow();
    expect(requirementsDto({ resources: [], version: null }).resources).toEqual(
      [],
    );
  });
});
