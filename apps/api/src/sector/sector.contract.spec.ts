import { BusinessVertical } from "../generated/prisma/client";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import {
  CAPABILITY_LABELS,
  VERTICAL_CODES,
  VERTICAL_REGISTRY,
  sectorConfiguration,
} from "./sector.contract";
import { initialVertical } from "./sector-administration";
describe("Appointments: registro y contratos sectoriales", () => {
  it("reconoce exactamente las cuatro verticales y conserva su orden", () => {
    expect(VERTICAL_CODES).toEqual([
      "BEAUTY",
      "DENTAL",
      "FITNESS",
      "AUTOMOTIVE",
    ]);
    expect(Object.values(BusinessVertical)).toEqual([...VERTICAL_CODES]);
  });
  it.each(VERTICAL_CODES)(
    "publica terminología y estados completos para %s",
    (code) => {
      const config = sectorConfiguration(code);
      expect(Object.keys(config.capabilities)).toEqual(
        Object.keys(CAPABILITY_LABELS),
      );
      expect(
        Object.values(config.capabilities).every((state) =>
          ["IMPLEMENTED", "PLANNED", "UNAVAILABLE"].includes(state),
        ),
      ).toBe(true);
      expect(config.terminology.professionals).toBeTruthy();
      expect(config.commerciallyAvailable).toBe(false);
      expect(config.capabilities.individualBookings).toBe(
        code === "BEAUTY" ? "IMPLEMENTED" : "PLANNED",
      );
    },
  );
  it("distingue evidencia de código existente de reservas o valoraciones futuras", () => {
    const config = sectorConfiguration("BEAUTY");
    expect(config.capabilities.individualServices).toBe("IMPLEMENTED");
    expect(config.capabilities.workSchedules).toBe("IMPLEMENTED");
    expect(config.capabilities.assessmentConfiguration).toBe("IMPLEMENTED");
    expect(config.capabilities.assessments).toBe("PLANNED");
    expect(config.capabilities.vehicles).toBe("UNAVAILABLE");
  });
  it("no habilita operaciones por reconocer una vertical futura", () => {
    for (const entry of VERTICAL_REGISTRY.filter((v) => v.code !== "BEAUTY")) {
      expect(Object.values(entry.capabilities)).not.toContain("IMPLEMENTED");
      expect(entry.status).toBe("PLANNED");
    }
    expect(sectorConfiguration("FITNESS").capabilities.groupBookings).toBe(
      "PLANNED",
    );
    expect(sectorConfiguration("AUTOMOTIVE").terminology.professionals).toBe(
      "Técnicos",
    );
    expect(sectorConfiguration("DENTAL").terminology.services).toBe(
      "Consultas y procedimientos",
    );
  });
  it("no adivina el sector de filas antiguas", () => {
    const config = sectorConfiguration(null);
    expect(config.status).toBe("UNCLASSIFIED");
    expect(Object.values(config.capabilities)).not.toContain("IMPLEMENTED");
  });
  it("el alta exige selección explícita y rechaza sectores no preparados", () => {
    expect(() => initialVertical(undefined)).toThrow("explícita");
    expect(() => initialVertical("DENTAL")).toThrow("planificada");
    expect(initialVertical("BEAUTY")).toBe("BEAUTY");
  });
  it("la CLI administrativa se rechaza antes de abrir la base en producción", () => {
    const result = spawnSync(
      process.execPath,
      [
        resolve(__dirname, "../../../../scripts/local-development.mjs"),
        "sector",
      ],
      {
        env: { ...process.env, NODE_ENV: "production" },
        encoding: "utf8",
        timeout: 10000,
      },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("producción");
  });
});
