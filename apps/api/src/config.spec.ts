import { loadConfig } from "./config";

describe("configuración", () => {
  it("aplica valores de desarrollo sin requerir secretos", () => {
    expect(loadConfig({})).toEqual({
      port: 3000,
      webOrigin: "http://localhost:5173",
      environment: "development",
    });
  });

  it.each(["0", "65536", "abc", "3000.5"])(
    "rechaza el puerto inválido %s",
    (port) => {
      expect(() => loadConfig({ API_PORT: port })).toThrow("API_PORT");
    },
  );

  it.each(["*", "https://example.com/path", "https://user:pass@example.com"])(
    "rechaza un origen CORS inválido %s",
    (origin) => {
      expect(() => loadConfig({ WEB_ORIGIN: origin })).toThrow("WEB_ORIGIN");
    },
  );

  it("exige un origen explícito fuera de desarrollo", () => {
    expect(() => loadConfig({ NODE_ENV: "production" })).toThrow("WEB_ORIGIN");
  });
});
