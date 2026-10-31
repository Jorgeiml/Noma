import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { sectorConfiguration } from "../../api/src/sector/sector.contract";
import { SectorSummary } from "./SectorSummary";
it("muestra la clasificación persistida y diferencia capacidad real y planificada", () => {
  render(<SectorSummary configuration={sectorConfiguration("BEAUTY")} />);
  expect(screen.queryByText("BEAUTY")).not.toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: sectorConfiguration("BEAUTY").label }),
  ).toBeInTheDocument();
  expect(document.querySelectorAll(".sector-capabilities li")).toHaveLength(7);
  expect(
    screen.queryByText(/Verticales y orden de desarrollo/),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
});
it("explica la transición explícita para filas sin clasificar", () => {
  render(<SectorSummary configuration={sectorConfiguration(null)} />);
  expect(screen.getByText(sectorConfiguration(null).label)).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(
    "Se conservan tus datos",
  );
  expect(screen.queryByText("Implementada")).not.toBeInTheDocument();
});
it.each(["DENTAL", "FITNESS", "AUTOMOTIVE"] as const)(
  "no anuncia %s como operativo",
  (code) => {
    render(<SectorSummary configuration={sectorConfiguration(code)} />);
    expect(
      screen.getByText(/La operación de este sector aún no está habilitada/),
    ).toBeInTheDocument();
    expect(screen.queryByText("Implementada")).not.toBeInTheDocument();
  },
);
