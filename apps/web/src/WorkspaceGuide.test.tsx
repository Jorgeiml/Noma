import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { WorkspaceGuide } from "./WorkspaceGuide";
beforeEach(() => localStorage.clear());

it("se muestra la primera vez, explica los espacios y permite finalizar", async () => {
  render(<WorkspaceGuide identityKey="user-a:business-a" disabled={false} />);
  expect(screen.getByRole("dialog")).toHaveAttribute("open");
  expect(screen.getByRole("heading")).toHaveTextContent("Tu negocio");
  for (let i = 0; i < 3; i++)
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(screen.getByRole("heading")).toHaveTextContent(
    "Espacios y equipos, en su lugar.",
  );
  expect(screen.getByText(/Qué usa cada servicio/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Empezar a trabajar" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(localStorage.getItem("noma.guide.v1:user-a:business-a")).toBe("seen");
  expect(screen.getByRole("button", { name: "Guía rápida" })).toHaveFocus();
});
it("recuerda la visita por usuario y negocio, y permite volver a abrirla", () => {
  localStorage.setItem("noma.guide.v1:user-a:business-a", "seen");
  const { unmount } = render(
    <WorkspaceGuide identityKey="user-a:business-a" disabled={false} />,
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Guía rápida" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Omitir guía" }));
  unmount();
  render(<WorkspaceGuide identityKey="user-a:business-b" disabled={false} />);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});
it("se puede omitir incluso si el navegador bloquea el almacenamiento", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  render(<WorkspaceGuide identityKey="blocked" disabled={false} />);
  fireEvent(
    screen.getByRole("dialog"),
    new Event("cancel", { bubbles: false, cancelable: true }),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
