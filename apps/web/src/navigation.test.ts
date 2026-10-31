import { expect, it } from "vitest";
import { APP_PATHS, resolveRoute, safeAppNext } from "./navigation";
it("separa identidad comercial, activación y desarrollo local", () => {
  for (const [path, page] of [
    ["/registro", "signup"],
    ["/verificar-correo", "verify"],
    ["/recuperar-acceso", "recover"],
    ["/activacion", "activation"],
    ["/acceso-no-autorizado", "denied"],
  ])
    expect(resolveRoute(path!)).toMatchObject({
      kind: "identity",
      identityPage: page,
    });
  expect(resolveRoute("/dev/login").kind).toBe("local");
});
it("separa landing, demo, acceso y las tres áreas privadas", () => {
  expect(resolveRoute("/").kind).toBe("landing");
  expect(resolveRoute("/demo").kind).toBe("demo");
  expect(resolveRoute("/login").kind).toBe("login");
  for (const [area, path] of Object.entries(APP_PATHS))
    expect(resolveRoute(path)).toEqual({ kind: "app", area });
  expect(resolveRoute("/app/desconocido").kind).toBe("missing");
});
it("migra los marcadores antiguos hacia el área correspondiente con aviso", () => {
  expect(resolveRoute("/", "#servicios").redirect).toBe(
    "/app/servicios?legacy=1",
  );
  expect(resolveRoute("/", "#operacion").redirect).toBe("/app/equipo?legacy=1");
  expect(resolveRoute("/design-lab.html").redirect).toContain("legacy=1");
  expect(resolveRoute("/app").redirect).toBe(APP_PATHS.establishment);
  expect(resolveRoute("/", "#sectores").kind).toBe("landing");
});
it.each([
  null,
  "https://example.test",
  "//example.test",
  "javascript:alert(1)",
  "/app/desconocido",
  "%2F%2Fevil.test",
  "/app/servicios?next=//example.test",
])("no permite redirecciones de login externas o desconocidas: %s", (value) => {
  expect(safeAppNext(value)).toBe(APP_PATHS.establishment);
});
it("permite regresar solo a una pantalla privada conocida", () => {
  expect(safeAppNext("/app/equipo")).toBe(APP_PATHS.operations);
});
