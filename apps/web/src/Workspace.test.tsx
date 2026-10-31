import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Workspace } from "./Workspace";
import { ApiError, platformApi, type Establishment } from "./api/platform";
import { sectorConfiguration } from "../../api/src/sector/sector.contract";
import { replacePage } from "./navigation";
vi.mock("./navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./navigation")>()),
  replacePage: vi.fn(),
}));

vi.mock("./App", () => ({ App: () => <span>API conectada</span> }));
vi.mock("./api/platform", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api/platform")>();
  return {
    ...actual,
    platformApi: {
      context: vi.fn(),
      read: vi.fn(),
      update: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
    },
  };
});
const establishment: Establishment = {
  id: "local-test-id",
  commercialName: "Negocio sintético",
  status: "ACTIVE",
  timeZone: "America/Guayaquil",
  currency: "USD",
  businessPhone: null,
  websiteUrl: null,
  version: 0,
  updatedAt: "2026-10-27T12:00:00Z",
  sectorConfiguration: sectorConfiguration("BEAUTY"),
};
beforeEach(() => {
  vi.mocked(replacePage).mockClear();
  vi.mocked(platformApi.context).mockReset().mockResolvedValue({
    userId: "owner",
    displayName: "Propietario sintético",
    establishmentId: establishment.id,
    role: "OWNER",
  });
  vi.mocked(platformApi.read).mockReset().mockResolvedValue(establishment);
  vi.mocked(platformApi.update).mockReset();
  vi.mocked(platformApi.login).mockReset();
  vi.mocked(platformApi.logout).mockReset();
});
describe("configuración del establecimiento", () => {
  it("muestra carga inicial", () => {
    vi.mocked(platformApi.context).mockReturnValue(new Promise(() => {}));
    render(<Workspace />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando");
  });
  it("carga datos reales del contrato y evita guardar sin cambios", async () => {
    render(<Workspace />);
    expect(await screen.findByLabelText("Nombre comercial")).toHaveValue(
      establishment.commercialName,
    );
    expect(
      screen.getByRole("button", { name: "Guardar cambios" }),
    ).toBeDisabled();
  });
  it("edita, guarda y confirma persistencia", async () => {
    vi.mocked(platformApi.update).mockResolvedValue({
      ...establishment,
      commercialName: "Nombre editado",
      version: 1,
    });
    render(<Workspace />);
    fireEvent.change(await screen.findByLabelText("Nombre comercial"), {
      target: { value: "Nombre editado" },
    });
    expect(screen.getByText("Cambios pendientes")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText(/Cambios guardados/)).toBeInTheDocument();
    expect(platformApi.update).toHaveBeenCalledWith(
      establishment.id,
      expect.objectContaining({ commercialName: "Nombre editado", version: 0 }),
    );
  });
  it("muestra guardado en progreso y bloquea doble envío", async () => {
    vi.mocked(platformApi.update).mockReturnValue(new Promise(() => {}));
    render(<Workspace />);
    fireEvent.change(await screen.findByLabelText("Nombre comercial"), {
      target: { value: "Pendiente" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(
      screen.getByRole("button", { name: "Guardando cambios…" }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Nombre comercial")).toBeDisabled();
  });
  it.each([
    new ApiError(400, "Nombre comercial inválido"),
    new ApiError(0, "Error de red"),
    new ApiError(409, "Versión cambió"),
    new ApiError(401, "Sesión vencida"),
  ])("conserva la edición cuando guardar falla", async (failure) => {
    vi.mocked(platformApi.update).mockRejectedValue(failure);
    render(<Workspace />);
    fireEvent.change(await screen.findByLabelText("Nombre comercial"), {
      target: { value: "Edición conservada" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre comercial")).toHaveValue(
      "Edición conservada",
    );
  });
  it("permite acceso solo tras enviar un código local", async () => {
    vi.mocked(platformApi.context).mockRejectedValueOnce(
      new ApiError(401, "Sin sesión"),
    );
    vi.mocked(platformApi.login).mockResolvedValue();
    render(<Workspace />);
    fireEvent.change(
      await screen.findByLabelText("Código local de desarrollo"),
      { target: { value: "codigo-local" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Acceder al establecimiento" }),
    );
    expect(
      await screen.findByLabelText("Nombre comercial"),
    ).toBeInTheDocument();
    expect(platformApi.login).toHaveBeenCalledWith("codigo-local");
  });
  it("muestra rechazo de una sesión local", async () => {
    vi.mocked(platformApi.context).mockRejectedValue(
      new ApiError(401, "Sin sesión"),
    );
    vi.mocked(platformApi.login).mockRejectedValue(
      new ApiError(401, "Código inválido"),
    );
    render(<Workspace />);
    fireEvent.change(
      await screen.findByLabelText("Código local de desarrollo"),
      { target: { value: "incorrecto" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Acceder al establecimiento" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Código inválido",
    );
  });
  it("muestra acceso deshabilitado sin atribuir permisos", async () => {
    vi.mocked(platformApi.context).mockRejectedValue(
      new ApiError(404, "Acceso local deshabilitado"),
    );
    render(<Workspace />);
    expect(
      await screen.findByText("El acceso local está cerrado"),
    ).toBeInTheDocument();
  });
  it("muestra establecimiento no disponible", async () => {
    vi.mocked(platformApi.read).mockRejectedValue(
      new ApiError(404, "Establecimiento no disponible"),
    );
    render(<Workspace />);
    expect(
      await screen.findByRole("heading", {
        name: "Establecimiento no disponible",
      }),
    ).toBeInTheDocument();
  });
  it("avisa antes de descartar cambios", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<Workspace />);
    fireEvent.change(await screen.findByLabelText("Nombre comercial"), {
      target: { value: "Sin guardar" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Cargar datos actuales" }),
    );
    await waitFor(() => expect(confirm).toHaveBeenCalled());
    expect(screen.getByLabelText("Nombre comercial")).toHaveValue(
      "Sin guardar",
    );
  });
});

it("carga el sector desde PostgreSQL a través del contrato y lo conserva al recargar", async () => {
  const { unmount } = render(<Workspace />);
  expect(
    await screen.findByText(sectorConfiguration("BEAUTY").label),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText(/Cambiar sector/)).not.toBeInTheDocument();
  unmount();
  render(<Workspace />);
  expect(
    await screen.findByText(sectorConfiguration("BEAUTY").label),
  ).toBeInTheDocument();
  expect(platformApi.read).toHaveBeenCalledTimes(2);
});

it("deja la configuración accesible pero bloquea módulos para un tenant sin clasificar", async () => {
  vi.mocked(platformApi.read).mockResolvedValue({
    ...establishment,
    sectorConfiguration: sectorConfiguration(null),
  });
  window.history.replaceState(null, "", "/#servicios");
  render(<Workspace />);
  expect(
    await screen.findByText(sectorConfiguration(null).label),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Servicios" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Equipo" })).toBeDisabled();
  expect(screen.getByLabelText("Nombre comercial")).toHaveValue(
    establishment.commercialName,
  );
  window.history.replaceState(null, "", "/");
});

it("protege /app y conserva el destino al solicitar acceso", async () => {
  vi.mocked(platformApi.context).mockRejectedValue(
    new ApiError(401, "Sin sesión"),
  );
  window.history.replaceState(null, "", "/app/servicios");
  render(<Workspace routeMode="app" initialArea="services" />);
  await waitFor(() =>
    expect(replacePage).toHaveBeenCalledWith("/login?next=%2Fapp%2Fservicios"),
  );
  expect(screen.queryByLabelText("Nombre comercial")).not.toBeInTheDocument();
  window.history.replaceState(null, "", "/");
});

it("retoma una ruta privada autorizada al entrar desde /login", async () => {
  window.history.replaceState(null, "", "/login?next=/app/equipo");
  render(<Workspace routeMode="login" />);
  await waitFor(() => expect(replacePage).toHaveBeenCalledWith("/app/equipo"));
  expect(screen.queryByLabelText("Nombre comercial")).not.toBeInTheDocument();
  window.history.replaceState(null, "", "/");
});

it("separa preferencias y protege cambios al cambiar el propósito de edición", async () => {
  render(<Workspace />);
  fireEvent.change(await screen.findByLabelText("Nombre comercial"), {
    target: { value: "Sin guardar" },
  });
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  fireEvent.click(screen.getByRole("button", { name: "Preferencias" }));
  expect(screen.getByLabelText("Nombre comercial")).toHaveValue("Sin guardar");
  confirm.mockReturnValue(true);
  fireEvent.click(screen.getByRole("button", { name: "Preferencias" }));
  expect(screen.getByLabelText("Zona horaria")).toHaveValue(
    establishment.timeZone,
  );
  expect(screen.getByLabelText("Moneda operativa")).toHaveValue(
    establishment.currency,
  );
  expect(platformApi.update).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Perfil comercial" }));
  expect(screen.getByLabelText("Nombre comercial")).toHaveValue(
    establishment.commercialName,
  );
});
it("usa el selector autorizado existente para un contexto comercial sin depender del proveedor", async () => {
  vi.mocked(platformApi.context).mockResolvedValue({
    identityMode: "commercial",
    userId: "commercial-owner",
    displayName: "Propietario autorizado",
    establishmentId: establishment.id,
    role: "OWNER",
  });
  render(<Workspace />);
  await screen.findByLabelText("Nombre comercial");
  fireEvent.click(screen.getByLabelText("Cuenta y establecimiento"));
  expect(
    screen.getByRole("link", { name: "Cambiar establecimiento" }),
  ).toHaveAttribute("href", "/activacion");
  expect(platformApi.context).toHaveBeenCalledTimes(1);
  expect(platformApi.read).toHaveBeenCalledWith(establishment.id);
});
