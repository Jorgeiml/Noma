import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { SiteRouter } from "./SiteRouter";
import { replacePage } from "./navigation";
vi.mock("./navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./navigation")>()),
  replacePage: vi.fn(),
}));
beforeEach(() => {
  window.history.replaceState(null, "", "/");
  vi.mocked(replacePage).mockClear();
  vi.stubGlobal("fetch", vi.fn());
});
it("la ruta raíz muestra la landing sin comprobar identidad ni cargar la aplicación privada", () => {
  render(<SiteRouter />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Que atender bien",
  );
  expect(
    screen.queryByLabelText("Código local de desarrollo"),
  ).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
it("también migra un marcador antiguo cuando cambia solo el hash sobre la landing abierta", () => {
  render(<SiteRouter />);
  window.history.replaceState(null, "", "/#servicios");
  fireEvent(window, new HashChangeEvent("hashchange"));
  expect(replacePage).toHaveBeenCalledWith("/app/servicios?legacy=1");
});
it("una dirección desconocida muestra recuperación explícita en lugar de otra pantalla", () => {
  window.history.replaceState(null, "", "/enlace-roto");
  render(<SiteRouter />);
  expect(screen.getByText("404 · ESTE ENLACE NO EXISTE")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /Volver al inicio/ }),
  ).toHaveAttribute("href", "/");
  expect(fetch).not.toHaveBeenCalled();
});
