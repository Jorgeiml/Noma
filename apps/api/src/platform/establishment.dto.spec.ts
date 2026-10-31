import { validateEstablishment } from "./establishment.dto";

const valid = {
  commercialName: "Negocio sintético",
  timeZone: "America/Guayaquil",
  currency: "USD",
  businessPhone: null,
  websiteUrl: null,
  version: 0,
};
describe("validación comercial", () => {
  it("normaliza nombre y campos vacíos", () => {
    expect(
      validateEstablishment({
        ...valid,
        commercialName: " Nombre ",
        businessPhone: "",
      }),
    ).toEqual({ ...valid, commercialName: "Nombre" });
  });
  it.each(["id", "status", "tenantId", "role", "subscription", "memberships"])(
    "rechaza el campo administrativo %s",
    (field) => {
      expect(() =>
        validateEstablishment({ ...valid, [field]: "arbitrario" }),
      ).toThrow("no editables");
    },
  );
  it.each([
    { commercialName: " " },
    { commercialName: "x".repeat(121) },
    { timeZone: "Inventada/Ciudad" },
    { currency: "XXXINVALID" },
    { businessPhone: "<script>" },
    { websiteUrl: "javascript:alert(1)" },
    { websiteUrl: "https://user:password@example.com" },
    { version: -1 },
    { version: 2147483648 },
  ])("rechaza datos comerciales inválidos", (change) => {
    expect(() => validateEstablishment({ ...valid, ...change })).toThrow();
  });
  it("admite Galápagos y otra moneda válida sin imponer una ciudad", () => {
    expect(
      validateEstablishment({
        ...valid,
        timeZone: "Pacific/Galapagos",
        currency: "EUR",
      }).currency,
    ).toBe("EUR");
  });
});
