import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";

describe("conexión con la API", () => {
  it("muestra carga mientras espera", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    render(<App />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Comprobando conexión",
    );
  });

  it("muestra API conectada únicamente con una respuesta válida", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok", service: "api" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    expect(await screen.findByText("API conectada")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/health",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("muestra API no disponible ante un fallo de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    render(<App />);
    expect(await screen.findByText("API no disponible")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Volver a comprobar" }),
    ).toBeEnabled();
  });

  it("rechaza una respuesta exitosa que no cumple el contrato health", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "ok", service: "otro-servicio" }),
      }),
    );
    render(<App />);
    expect(await screen.findByText("API no disponible")).toBeInTheDocument();
  });

  it("muestra fallo ante un error HTTP aunque haya respuesta", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    render(<App />);
    expect(await screen.findByText("API no disponible")).toBeInTheDocument();
  });
});
