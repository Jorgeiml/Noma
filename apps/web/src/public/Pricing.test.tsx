import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Pricing } from "./Pricing";
beforeEach(() => {
  vi.stubEnv("VITE_PUBLIC_CONTACT_URL", "");
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => vi.unstubAllEnvs());
it("presenta los importes, límites y disponibilidad como propuesta, sin compra", () => {
  render(<Pricing />);
  const grow = screen.getByRole("article", { name: "Grow" });
  expect(within(grow).getByText("$59")).toBeInTheDocument();
  expect(within(grow).getByText("350")).toBeInTheDocument();
  expect(
    within(grow).getByText("6", { selector: "li:nth-child(2) strong" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/Aún no contratables ni económicamente validados/),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Contratar|Comprar|Empezar prueba/ }),
  ).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
it("cambia a totales anuales anticipados, conserva cuotas mensuales y vuelve", () => {
  render(<Pricing />);
  fireEvent.click(screen.getByRole("button", { name: /Anual/ }));
  for (const total of ["$290", "$590", "$990"])
    expect(screen.getByText(total)).toBeInTheDocument();
  expect(
    screen.getByText(/Un pago de \$590 por adelantado. No son 12 cuotas./),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/Se renueva cada ciclo mensual y no se acumula/),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Mensual" }));
  expect(screen.getByText("$59")).toBeInTheDocument();
  expect(screen.queryByText("$590")).not.toBeInTheDocument();
});
it("explica la sesión de 24 horas, las cuotas y los cargos externos sin tarifas inventadas", () => {
  render(<Pricing />);
  const toggle = screen.getByRole("button", {
    name: "¿Qué es una sesión IA?",
  });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(screen.getByText(/24 horas desde su inicio/)).not.toBeVisible();
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText(/24 horas desde su inicio/)).toBeVisible();
  expect(screen.getByText(/24 horas desde su inicio/)).toBeInTheDocument();
  expect(screen.getByText(/Ana pregunta a las 10:00/)).toBeInTheDocument();
  expect(screen.getByText(/Avisos al 80 % y 100 %/)).toBeInTheDocument();
  expect(screen.getByText("Sin excedentes automáticos.")).toBeInTheDocument();
  expect(
    screen.getByText(/Una sesión IA no equivale a un mensaje facturable/),
  ).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(toggle);
  expect(screen.getByText(/24 horas desde su inicio/)).not.toBeVisible();
  fireEvent.click(
    screen.getByRole("button", {
      name: "¿Qué es una sesión IA? Información para Grow",
    }),
  );
  expect(screen.getByText(/24 horas desde su inicio/)).toBeVisible();
});
it("permite elegir cada plan en el selector móvil y expone el estado seleccionado", () => {
  render(<Pricing />);
  const picker = screen.getByRole("group", {
    name: "Plan que quieres consultar",
  });
  for (const name of ["Start", "Scale", "Grow"]) {
    fireEvent.click(within(picker).getByRole("button", { name }));
    expect(within(picker).getByRole("button", { name })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("article", { name })).toHaveAttribute(
      "data-mobile-selected",
      "true",
    );
  }
});
it("mantiene comparación y condiciones bajo controles nativos, con CTA real", () => {
  render(<Pricing />);
  expect(
    screen.getByText(/Comparar todo lo previsto/).closest("details"),
  ).not.toHaveAttribute("open");
  expect(
    screen.getByRole("link", { name: /Mientras tanto, explora la demo/ }),
  ).toHaveAttribute("href", "/demo");
  expect(screen.queryByRole("form")).not.toBeInTheDocument();
});
