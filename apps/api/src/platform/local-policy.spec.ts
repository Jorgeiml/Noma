import {
  localAccessAllowed,
  requireLocalRequest,
  requireOrigin,
} from "./local-policy";
const enabled = {
  NODE_ENV: "development",
  APP_ENV: "local",
  LOCAL_ACCESS_ENABLED: "true",
  DATABASE_URL: "postgresql://127.0.0.1/local?schema=public",
};
describe("acceso exclusivamente local", () => {
  it("queda cerrado por defecto", () =>
    expect(localAccessAllowed({})).toBe(false));
  it("requiere habilitación expresa", () =>
    expect(
      localAccessAllowed({ ...enabled, LOCAL_ACCESS_ENABLED: "false" }),
    ).toBe(false));
  it.each(["production", "staging", "test"])(
    "no se habilita con NODE_ENV=%s aunque se fuerce el flag",
    (NODE_ENV) =>
      expect(localAccessAllowed({ ...enabled, NODE_ENV })).toBe(false),
  );
  it.each(["production", "staging", "preview"])(
    "rechaza despliegue %s",
    (APP_ENV) =>
      expect(localAccessAllowed({ ...enabled, APP_ENV })).toBe(false),
  );
  it("admite solo entorno local explícito", () =>
    expect(localAccessAllowed(enabled)).toBe(true));
  it.each([
    "postgresql://remote.example/local",
    "postgresql://127.0.0.1/local?host=remote.example",
  ])("rechaza DB remota o parámetros de red alternativos", (DATABASE_URL) =>
    expect(localAccessAllowed({ ...enabled, DATABASE_URL })).toBe(false),
  );
  it("rechaza dirección remota", () =>
    expect(() => requireLocalRequest("192.168.1.2")).toThrow());
  it("admite loopback IPv6", () =>
    expect(() => requireLocalRequest("::1")).not.toThrow());
  it("rechaza escrituras desde un origen no autorizado", () =>
    expect(() => requireOrigin("https://other.example")).toThrow());
});
