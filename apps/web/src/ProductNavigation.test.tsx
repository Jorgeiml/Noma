import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ProductNavigation } from "./ProductNavigation";
it("identifica el espacio actual y permite cambiar con controles nativos", () => {
  const select = vi.fn();
  render(<ProductNavigation active="services" onSelect={select} />);
  expect(screen.getByRole("button", { name: "Servicios" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  fireEvent.click(screen.getByRole("button", { name: "Servicios" }));
  expect(select).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Equipo" }));
  expect(select).toHaveBeenCalledWith("operations");
  expect(screen.getAllByRole("button")).toHaveLength(3);
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});
it("bloquea los botones y atajos al guardar", () => {
  const select = vi.fn();
  render(
    <ProductNavigation active="establishment" disabled onSelect={select} />,
  );
  screen
    .getAllByRole("button")
    .forEach((button) => expect(button).toBeDisabled());
  fireEvent.keyDown(window, { key: "2", altKey: true });
  expect(select).not.toHaveBeenCalled();
});
it("solo habilita capacidades autorizadas", () => {
  const select = vi.fn();
  render(
    <ProductNavigation
      active="establishment"
      enabledAreas={["establishment"]}
      onSelect={select}
    />,
  );
  expect(screen.getByRole("button", { name: "Servicios" })).toBeDisabled();
  fireEvent.keyDown(window, { key: "2", altKey: true });
  expect(select).not.toHaveBeenCalled();
});
it("permite Alt+1/2/3 sin interceptar los campos de edición", () => {
  const select = vi.fn();
  render(
    <>
      <ProductNavigation active="establishment" onSelect={select} />
      <input aria-label="Edición" />
    </>,
  );
  fireEvent.keyDown(window, { key: "3", altKey: true });
  expect(select).toHaveBeenLastCalledWith("operations");
  select.mockClear();
  fireEvent.keyDown(screen.getByLabelText("Edición"), {
    key: "2",
    altKey: true,
  });
  expect(select).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Servicios" })).toHaveAttribute(
    "aria-keyshortcuts",
    "Alt+2",
  );
});

it("mueve el foco al contenido solo después de un cambio de espacio aceptado", async () => {
  const select = vi.fn();
  const { rerender } = render(
    <>
      <ProductNavigation active="establishment" onSelect={select} />
      <main id="workspace-content" tabIndex={-1}>
        Contenido
      </main>
    </>,
  );
  const services = screen.getByRole("button", { name: "Servicios" });
  services.focus();
  fireEvent.click(services);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  expect(services).toHaveFocus();
  rerender(
    <>
      <ProductNavigation active="services" onSelect={select} />
      <main id="workspace-content" tabIndex={-1}>
        Contenido
      </main>
    </>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Negocio" }));
  rerender(
    <>
      <ProductNavigation active="establishment" onSelect={select} />
      <main id="workspace-content" tabIndex={-1}>
        Contenido
      </main>
    </>,
  );
  await waitFor(() => expect(screen.getByRole("main")).toHaveFocus());
});
