import { databaseUrl } from "./database.config";

describe("configuración PostgreSQL", () => {
  it.each([undefined, "", "https://example.com/db", "postgresql://localhost"])(
    "rechaza una URL inválida sin exponerla",
    (value) => {
      expect(() => databaseUrl({ DATABASE_URL: value })).toThrow(
        "DATABASE_URL debe configurar una conexión PostgreSQL válida.",
      );
    },
  );
  it("admite una URL PostgreSQL explícita", () => {
    const value = "postgresql://127.0.0.1/technical";
    expect(databaseUrl({ DATABASE_URL: value })).toBe(value);
  });
});
