import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import ScenarioDemo from "./ScenarioDemo";
beforeEach(() => {
  window.history.replaceState(null, "", "/demo");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new Error("No APIs in simulation")),
  );
});
it("completa un recorrido explícito sin crear reservas ni realizar peticiones", () => {
  render(<ScenarioDemo />);
  expect(screen.getByText(/Datos y horarios ficticios/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Interpretar mensaje/ }));
  expect(
    screen.getByRole("heading", { name: "Entender antes de proponer." }),
  ).toHaveFocus();
  fireEvent.click(
    screen.getByRole("button", { name: /Ver alternativas ficticias/ }),
  );
  expect(
    screen.getByRole("button", { name: /Ver resultado ilustrativo/ }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("radio", { name: /10:00/ }));
  fireEvent.click(
    screen.getByRole("button", { name: /Ver resultado ilustrativo/ }),
  );
  expect(screen.getByText("No se creó ninguna reserva.")).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: /Repetir recorrido/ }));
  expect(
    screen.getByRole("button", { name: /Interpretar mensaje/ }),
  ).toBeInTheDocument();
});
it.each(["Beauty", "Dental", "Fitness", "Automotive"])(
  "cambia el contexto de %s y reinicia el recorrido de forma segura",
  (sector) => {
    render(<ScenarioDemo />);
    fireEvent.click(screen.getByRole("button", { name: sector }));
    expect(screen.getByRole("button", { name: sector })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Interpretar mensaje/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: sector }));
    expect(screen.getByRole("status")).toHaveTextContent("PASO 1 DE 4");
    expect(fetch).not.toHaveBeenCalled();
  },
);
it("respeta el enlace al ejemplo dental sin pedir datos personales", () => {
  window.history.replaceState(null, "", "/demo#dental");
  render(<ScenarioDemo />);
  expect(screen.getByRole("button", { name: "Dental" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByText(/consultorio/)).toBeInTheDocument();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
});
