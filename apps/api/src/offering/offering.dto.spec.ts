import {
  validateOffering,
  validateStatus,
  validateCurrencyPrecision,
  type OfferingDto,
} from "./offering.dto";
const base = {
  name: "Servicio sintético",
  description: "Descripción de prueba",
  category: null,
  durationMinutes: 30,
  priceMode: "FIXED",
  priceMin: "25.00",
  priceMax: null,
  hasPriorAssessment: false,
  assessmentDescription: null,
};
describe("reglas del catálogo", () => {
  it.each([
    { priceMode: "FIXED", priceMin: "0", priceMax: null },
    { priceMode: "FROM", priceMin: "25.10", priceMax: null },
    { priceMode: "RANGE", priceMin: "25", priceMax: "45" },
    { priceMode: "RANGE", priceMin: "25", priceMax: "25" },
    { priceMode: "ASSESSMENT_REQUIRED", priceMin: null, priceMax: null },
  ])(
    "acepta la modalidad $priceMode y conserva importes textuales",
    (change) => {
      expect(validateOffering({ ...base, ...change })).toEqual({
        ...base,
        ...change,
      });
    },
  );
  it.each([
    { priceMin: -1 },
    { priceMin: 25.1 },
    { priceMin: "-1" },
    { priceMin: "1e3" },
    { priceMin: "1,5" },
    { priceMin: "123456789012345.00" },
    { priceMin: "1.12345" },
    { priceMin: null },
    { priceMax: "30" },
    { priceMode: "RANGE", priceMax: "24.99" },
    { priceMode: "RANGE", priceMax: null },
    { priceMode: "ASSESSMENT_REQUIRED", priceMin: "0" },
    { durationMinutes: 0 },
    { durationMinutes: -5 },
    { durationMinutes: 1.5 },
    { durationMinutes: "30" },
    { durationMinutes: 2147483648 },
    { name: " " },
    { name: "x".repeat(121) },
    { priceMode: "FREE" },
    { category: "x".repeat(81) },
    { description: "x".repeat(2001) },
    { hasPriorAssessment: true, assessmentDescription: "Texto" },
    { hasPriorAssessment: "true" },
    { hasPriorAssessment: null },
  ])("rechaza datos incoherentes o importes inseguros", (change) => {
    expect(() => validateOffering({ ...base, ...change })).toThrow();
  });
  it.each([
    "id",
    "establishmentId",
    "tenantId",
    "currency",
    "active",
    "version",
  ])("no permite inyectar %s al crear", (field) => {
    expect(() => validateOffering({ ...base, [field]: "valor" })).toThrow(
      "no editables",
    );
  });
  it("evalúa rangos exactamente en importes grandes", () => {
    expect(() =>
      validateOffering({
        ...base,
        priceMode: "RANGE",
        priceMin: "99999999999999.99",
        priceMax: "99999999999999.98",
      }),
    ).toThrow();
  });
  it("permite describir una evaluación sin convertirla en un cobro", () => {
    const value = {
      ...base,
      priceMode: "ASSESSMENT_REQUIRED",
      priceMin: null,
      hasPriorAssessment: true,
      assessmentDescription: "Evaluación comercial previa",
    };
    expect(validateOffering(value)).toEqual(value);
    expect(() =>
      validateOffering({ ...value, assessmentDescription: " " }),
    ).toThrow();
    expect(() =>
      validateOffering({ ...value, hasPriorAssessment: false }),
    ).toThrow();
  });
  it("requiere versión al editar y limita los campos de estado", () => {
    expect(() => validateOffering(base, true)).toThrow("Versión");
    expect(validateOffering({ ...base, version: 0 }, true)).toHaveProperty(
      "version",
      0,
    );
    expect(validateStatus({ active: false, version: 1 })).toEqual({
      active: false,
      version: 1,
    });
    expect(() => validateStatus({ active: "false", version: 0 })).toThrow();
    expect(() => validateStatus({ active: false, version: -1 })).toThrow();
    expect(() =>
      validateStatus({ active: false, version: 0, establishmentId: "otro" }),
    ).toThrow();
  });
  it("aplica la escala de la moneda sin redondeos silenciosos", () => {
    const value = validateOffering({
      ...base,
      priceMin: "0.001",
    }) as OfferingDto;
    expect(() => validateCurrencyPrecision(value, "USD")).toThrow();
    expect(() => validateCurrencyPrecision(value, "BHD")).not.toThrow();
    expect(() => validateCurrencyPrecision(value, "JPY")).toThrow();
  });
});
