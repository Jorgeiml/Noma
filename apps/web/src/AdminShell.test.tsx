import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AdminShell } from "./AdminShell";
const props = {
  authorized: true,
  businessName: "Negocio de prueba",
  userName: "Persona autorizada",
  busy: false,
  canSwitch: true,
  onLogout: vi.fn(),
};
it("es una capa de presentación y no muestra contexto privado antes de autorizar", () => {
  render(
    <AdminShell {...props} authorized={false}>
      <p>Comprobando acceso</p>
    </AdminShell>,
  );
  expect(screen.getByText("Comprobando acceso")).toBeInTheDocument();
  expect(screen.queryByText(props.businessName)).not.toBeInTheDocument();
  expect(
    screen.queryByLabelText("Cuenta y establecimiento"),
  ).not.toBeInTheDocument();
});
it("abre la cuenta con un control nativo y cierra con Escape devolviendo el foco", () => {
  render(
    <AdminShell {...props}>
      <main>Negocio</main>
    </AdminShell>,
  );
  const control = screen.getByLabelText("Cuenta y establecimiento");
  fireEvent.click(control);
  expect(control.closest("details")).toHaveAttribute("open");
  fireEvent.keyDown(control, { key: "Escape" });
  expect(control.closest("details")).not.toHaveAttribute("open");
  expect(control).toHaveFocus();
});
it("no ofrece cambio de establecimiento para acceso local y bloquea salir al guardar", () => {
  render(
    <AdminShell {...props} busy canSwitch={false}>
      <main>Negocio</main>
    </AdminShell>,
  );
  fireEvent.click(screen.getByLabelText("Cuenta y establecimiento"));
  expect(
    screen.queryByRole("link", { name: "Cambiar establecimiento" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeDisabled();
});
