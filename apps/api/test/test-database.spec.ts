import { assertTestDatabaseUrl } from "./test-database";

describe("protección de la base de pruebas", () => {
  it.each([
    undefined,
    "postgresql://bw_test@remote.example/beauty_wellness_test",
    "postgresql://bw_local@127.0.0.1/beauty_wellness_dev",
    "postgresql://bw_local@127.0.0.1/beauty_wellness_test",
    "postgresql://bw_test@127.0.0.1/beauty_wellness_test?schema=other",
    "postgresql://bw_test@127.0.0.1/beauty_wellness_test?host=remote.example",
  ])("rechaza un destino desconocido", (value) => {
    expect(() => assertTestDatabaseUrl(value)).toThrow("Tests requieren");
  });

  it("acepta el destino local de tests identificado", () => {
    const value =
      "postgresql://bw_test@127.0.0.1:55433/beauty_wellness_test?schema=public";
    expect(assertTestDatabaseUrl(value)).toBe(value);
  });
});
