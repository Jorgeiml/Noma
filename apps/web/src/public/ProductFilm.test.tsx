import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ProductFilm, publicVideoUrl } from "./ProductFilm";
afterEach(() => vi.unstubAllEnvs());
it("ofrece un adelanto manual honesto sin descargar video ni llamar APIs", () => {
  vi.stubEnv("VITE_PUBLIC_VIDEO_URL", "");
  vi.stubGlobal("fetch", vi.fn());
  const { container } = render(<ProductFilm />);
  expect(screen.getByText(/Video real próximamente/)).toBeInTheDocument();
  expect(container.querySelector("video")).toBeNull();
  const start = screen.getByRole("button", { name: "Ver adelanto" });
  start.focus();
  fireEvent.click(start);
  expect(
    screen.getByRole("button", { name: "Reiniciar adelanto" }),
  ).toHaveFocus();
  expect(
    screen.getByRole("heading", { name: "Todo empieza con un hola." }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Escena 03/ }));
  expect(
    screen.getByRole("heading", { name: "Una posibilidad. Tú decides." }),
  ).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
it("solo admite destinos HTTPS de archivos MP4 o WebM sin credenciales", () => {
  for (const value of [
    undefined,
    "javascript:alert(1)",
    "http://example.test/a.mp4",
    "https://u:p@example.test/a.mp4",
    "https://youtube.com/watch?v=1",
  ])
    expect(publicVideoUrl(value)).toBeNull();
  expect(publicVideoUrl("https://example.test/a.webm")).toBe(
    "https://example.test/a.webm",
  );
});
it("carga el video configurado solo al solicitarlo y recupera errores", () => {
  vi.stubEnv("VITE_PUBLIC_VIDEO_URL", "https://example.test/presentacion.mp4");
  const { container } = render(<ProductFilm />);
  expect(container.querySelector("video")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Ver video" }));
  const video = screen.getByLabelText("Video de presentación de Noma");
  expect(video).toHaveAttribute("preload", "none");
  expect(video).not.toHaveAttribute("autoplay");
  expect(video.querySelector("source")).toHaveAttribute(
    "src",
    "https://example.test/presentacion.mp4",
  );
  fireEvent.error(video.querySelector("source")!);
  expect(
    screen.getByText(/No se pudo reproducir el video/),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Ver adelanto" }),
  ).toBeInTheDocument();
});
