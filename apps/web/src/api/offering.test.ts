import { describe, it, expect } from "vitest";
import { moneyLabel, priceLabel } from "./offering";
describe("precios sin conversión a float", () => {
  const value = { currency: "USD", priceMin: "25", priceMax: null };
  it("distingue fijo, desde, rango y valoración", () => {
    expect(priceLabel({ ...value, priceMode: "FIXED" })).toBe("$25");
    expect(priceLabel({ ...value, priceMode: "FROM" })).toBe("Desde $25");
    expect(priceLabel({ ...value, priceMode: "RANGE", priceMax: "45" })).toBe(
      "$25–$45",
    );
    expect(
      priceLabel({
        ...value,
        priceMode: "ASSESSMENT_REQUIRED",
        priceMin: null,
      }),
    ).toBe("Precio sujeto a valoración");
  });
  it("distingue gratuito de desconocido", () => {
    expect(moneyLabel("0", "USD")).toBe("$0");
    expect(
      priceLabel({
        ...value,
        priceMode: "ASSESSMENT_REQUIRED",
        priceMin: null,
      }),
    ).not.toContain("$0");
  });
  it("conserva centavos incluso fuera del rango seguro de unidades menores Number", () => {
    expect(moneyLabel("99999999999999.99", "USD").replace(/\D/g, "")).toBe(
      "9999999999999999",
    );
    expect(moneyLabel("0.001", "BHD")).toContain("001");
  });
});
