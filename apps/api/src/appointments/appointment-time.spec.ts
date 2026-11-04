import { capacityFits, dayWindow, scheduleMask } from "./appointment-time";
import {
  bookingOf,
  customerOf,
  availabilityOf,
  instant,
} from "./appointment.dto";
describe("Appointments: tiempo real, capacidad y contrato", () => {
  it("un día de Ecuador conserva 24 horas y cambia de fecha en UTC", () => {
    const w = dayWindow("2027-01-03", "America/Guayaquil");
    expect(new Date(w.start).toISOString()).toBe("2027-01-03T05:00:00.000Z");
    expect(w.end - w.start).toBe(86400000);
  });
  it.each([
    ["2027-03-14", 23],
    ["2027-11-07", 25],
  ])("DST %s contiene %s horas reales", (date, hours) => {
    const w = dayWindow(date as string, "America/New_York");
    expect((w.end - w.start) / 3600000).toBe(hours);
  });
  it("incluye las dos ocurrencias de una hora repetida, sin crear horas inexistentes", () => {
    const w = dayWindow("2027-11-07", "America/New_York");
    const mask = scheduleMask(
      {
        timeZone: "America/New_York",
        week: [
          {
            weekday: 7,
            closed: false,
            intervals: [{ start: "01:00", end: "02:00" }],
          },
        ],
        exceptions: [],
      },
      w.start,
      w.end,
    );
    expect(
      mask(Date.parse("2027-11-07T05:30Z"), Date.parse("2027-11-07T05:45Z")),
    ).toBe(true);
    expect(
      mask(Date.parse("2027-11-07T06:30Z"), Date.parse("2027-11-07T06:45Z")),
    ).toBe(true);
  });
  it("continúa entre dos días configurados hasta y desde medianoche", () => {
    const a = Date.parse("2027-01-04T04:30Z"),
      b = a + 3600000;
    const mask = scheduleMask(
      {
        timeZone: "America/Guayaquil",
        week: [
          {
            weekday: 7,
            closed: false,
            intervals: [{ start: "23:00", end: "24:00" }],
          },
          {
            weekday: 1,
            closed: false,
            intervals: [{ start: "00:00", end: "01:00" }],
          },
        ],
        exceptions: [],
      },
      a,
      b,
    );
    expect(mask(a, b)).toBe(true);
  });
  it("no suma dos ocupaciones consecutivas como si se solaparan", () => {
    const a = Date.parse("2027-01-01T00:00Z");
    expect(
      capacityFits(a, a + 120000, 1, 2, [
        { startsAt: new Date(a), endsAt: new Date(a + 60000), units: 1 },
        {
          startsAt: new Date(a + 60000),
          endsAt: new Date(a + 120000),
          units: 1,
        },
      ]),
    ).toBe(true);
  });
  it("no excede el pico real de unidades", () => {
    const a = Date.now();
    expect(
      capacityFits(a, a + 60000, 2, 2, [
        { startsAt: new Date(a), endsAt: new Date(a + 60000), units: 1 },
      ]),
    ).toBe(false);
  });
  it("normaliza contacto sin inventar una identidad ni exigir correo", () => {
    expect(
      customerOf({ name: "  Ana  ", phone: "+593 (99) 111-2233" }),
    ).toMatchObject({ name: "Ana", phone: "+593991112233", email: null });
  });
  it.each(["2027-02-30", "ayer"])("rechaza fechas inválidas %s", (date) =>
    expect(() =>
      availabilityOf({ branchId: "abc", serviceId: "abc", date }),
    ).toThrow(),
  );
  it("rechaza instantes ambiguos y fechas inexistentes", () => {
    expect(() => instant("2027-03-14T02:30")).toThrow();
    expect(() => instant("2027-02-30T00:00:00Z")).toThrow();
  });
  it("no acepta tenant, canales futuros ni clientes ambiguos", () => {
    expect(() => bookingOf({ tenantId: "otro" })).toThrow();
    expect(() => customerOf({ name: "a", email: "no" })).toThrow();
  });
});
