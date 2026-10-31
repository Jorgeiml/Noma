import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Catalog } from "./Catalog";
import { ApiError } from "./api/platform";
import { offeringApi, type ServiceOffering } from "./api/offering";

vi.mock("./api/offering", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api/offering")>();
  return {
    ...actual,
    offeringApi: {
      list: vi.fn(),
      remove: vi.fn(),
      read: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      status: vi.fn(),
    },
  };
});
const fixed: ServiceOffering = {
  id: "service-synthetic",
  establishmentId: "tenant-synthetic",
  name: "Servicio fijo sintético",
  category: "Categoría sintética",
  description: "Solo prueba",
  durationMinutes: 45,
  priceMode: "FIXED",
  priceMin: "25",
  priceMax: null,
  currency: "USD",
  active: true,
  version: 0,
  hasPriorAssessment: false,
  assessmentDescription: null,
};
beforeEach(() => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.mocked(offeringApi.list).mockReset().mockResolvedValue([fixed]);
  vi.mocked(offeringApi.create).mockReset();
  vi.mocked(offeringApi.update).mockReset();
  vi.mocked(offeringApi.status).mockReset();
  vi.mocked(offeringApi.remove).mockReset();
});
const mount = () => render(<Catalog currency="USD" onLeave={vi.fn()} />);
async function edit() {
  fireEvent.click(
    await screen.findByRole("button", { name: /Servicio fijo sintético/ }),
  );
}
describe("catálogo orientado a explorar y editar", () => {
  it("muestra carga inicial", () => {
    vi.mocked(offeringApi.list).mockReturnValue(new Promise(() => {}));
    mount();
    expect(screen.getByRole("status")).toHaveTextContent("Cargando catálogo");
  });
  it("no inventa registros en un catálogo vacío", async () => {
    vi.mocked(offeringApi.list).mockResolvedValue([]);
    mount();
    expect(await screen.findByText(/Aún no hay servicios/)).toBeInTheDocument();
  });
  it("muestra modalidades y permite buscar por categoría", async () => {
    vi.mocked(offeringApi.list).mockResolvedValue([
      fixed,
      { ...fixed, id: "from", name: "Servicio desde", priceMode: "FROM" },
      {
        ...fixed,
        id: "range",
        name: "Servicio rango",
        priceMode: "RANGE",
        priceMax: "45",
      },
      {
        ...fixed,
        id: "assessment",
        name: "Servicio valoración",
        priceMode: "ASSESSMENT_REQUIRED",
        priceMin: null,
      },
    ]);
    mount();
    expect(await screen.findByText("$25")).toBeInTheDocument();
    expect(screen.getByText("Desde $25")).toBeInTheDocument();
    expect(screen.getByText("$25–$45")).toBeInTheDocument();
    expect(screen.getByText("Precio sujeto a valoración")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Buscar por nombre o categoría"), {
      target: { value: "inexistente" },
    });
    expect(
      screen.getByText(/No hay servicios que coincidan/),
    ).toBeInTheDocument();
  });
  it("crea sin enviar un tenant ni convertir el precio en número", async () => {
    vi.mocked(offeringApi.list).mockResolvedValue([]);
    vi.mocked(offeringApi.create).mockResolvedValue({
      ...fixed,
      name: "Creado",
    });
    mount();
    await screen.findByText(/Aún no hay servicios/);
    fireEvent.click(screen.getByRole("button", { name: "Crear servicio" }));
    fireEvent.change(screen.getByLabelText("Nombre del servicio"), {
      target: { value: "Creado" },
    });
    fireEvent.change(screen.getByLabelText("Duración en minutos"), {
      target: { value: "45" },
    });
    fireEvent.change(screen.getByLabelText("Precio exacto (USD)"), {
      target: { value: "25,10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar servicio" }));
    expect(await screen.findByText(/Servicio guardado/)).toBeInTheDocument();
    expect(offeringApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Creado",
        priceMin: "25.10",
        durationMinutes: 45,
      }),
      "USD",
    );
    expect(vi.mocked(offeringApi.create).mock.calls[0]![0]).not.toHaveProperty(
      "establishmentId",
    );
  });
  it("edita y conserva la versión", async () => {
    vi.mocked(offeringApi.update).mockResolvedValue({
      ...fixed,
      name: "Editado",
      version: 1,
    });
    mount();
    await edit();
    fireEvent.change(screen.getByLabelText("Nombre del servicio"), {
      target: { value: "Editado" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar servicio" }));
    expect(await screen.findByText(/Servicio guardado/)).toBeInTheDocument();
    expect(offeringApi.update).toHaveBeenCalledWith(
      fixed.id,
      expect.objectContaining({ name: "Editado" }),
      0,
    );
  });
  it("muestra guardado en progreso sin doble envío", async () => {
    vi.mocked(offeringApi.update).mockReturnValue(new Promise(() => {}));
    mount();
    await edit();
    fireEvent.change(screen.getByLabelText("Nombre del servicio"), {
      target: { value: "Editando" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar servicio" }));
    expect(
      screen.getByRole("button", { name: "Guardando servicio…" }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Nombre del servicio")).toBeDisabled();
  });
  it.each([
    new ApiError(400, "Rango inválido"),
    new ApiError(0, "Error de red"),
    new ApiError(401, "Sin sesión"),
    new ApiError(409, "Versión antigua"),
  ])("conserva borrador ante un error de guardado", async (error) => {
    vi.mocked(offeringApi.update).mockRejectedValue(error);
    mount();
    await edit();
    fireEvent.change(screen.getByLabelText("Nombre del servicio"), {
      target: { value: "No perder" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar servicio" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre del servicio")).toHaveValue(
      "No perder",
    );
  });
  it("valoración no presenta campos con un precio definitivo", async () => {
    mount();
    await edit();
    fireEvent.change(screen.getByLabelText("Modalidad de precio"), {
      target: { value: "ASSESSMENT_REQUIRED" },
    });
    expect(
      screen.queryByLabelText("Precio exacto (USD)"),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "El negocio tiene una evaluación previa descrita",
      }),
    );
    expect(
      screen.getByLabelText("Descripción de la evaluación previa"),
    ).toBeRequired();
  });
  it("desactiva y activa sin eliminación", async () => {
    vi.mocked(offeringApi.status)
      .mockResolvedValueOnce({ ...fixed, active: false, version: 1 })
      .mockResolvedValueOnce({ ...fixed, active: true, version: 2 });
    mount();
    await edit();
    fireEvent.click(
      screen.getByRole("button", { name: "Desactivar servicio" }),
    );
    expect(await screen.findByText(/Servicio desactivado/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Activar servicio" }));
    expect(await screen.findByText("Servicio activado.")).toBeInTheDocument();
    expect(offeringApi.status).toHaveBeenLastCalledWith(fixed.id, true, 1);
  });
  it("advierte antes de abandonar un borrador", async () => {
    const leave = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<Catalog currency="USD" onLeave={leave} />);
    await edit();
    fireEvent.change(screen.getByLabelText("Nombre del servicio"), {
      target: { value: "Pendiente" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Volver al establecimiento" }),
    );
    expect(leave).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Nombre del servicio")).toHaveValue(
      "Pendiente",
    );
  });
  it("informa una carga fallida y permite reintentar", async () => {
    vi.mocked(offeringApi.list).mockRejectedValueOnce(
      new ApiError(0, "Error de conexión"),
    );
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Error de conexión",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Actualizar catálogo" }),
    );
    await waitFor(() => expect(offeringApi.list).toHaveBeenCalledTimes(2));
  });
});

it("protege el borrador al cambiar de área desde la navegación principal", async () => {
  const onNavigate = vi.fn();
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  render(<Catalog currency="USD" onLeave={vi.fn()} onNavigate={onNavigate} />);
  await edit();
  fireEvent.change(screen.getByLabelText("Nombre del servicio"), {
    target: { value: "Borrador pendiente" },
  });
  fireEvent.click(screen.getByRole("button", { name: /^Equipo$/ }));
  expect(onNavigate).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Nombre del servicio")).toHaveValue(
    "Borrador pendiente",
  );
  confirm.mockReturnValue(true);
  fireEvent.click(screen.getByRole("button", { name: /^Equipo$/ }));
  expect(onNavigate).toHaveBeenCalledWith("operations");
});

it("combina categoría y estado, cambia densidad y pagina sin perder filtros al editar", async () => {
  const list = Array.from({ length: 55 }, (_, i) => ({
    ...fixed,
    id: "large-" + i,
    name: "Servicio " + String(i).padStart(2, "0"),
    category: i < 50 ? "Grupo A" : "Grupo B",
    active: i !== 0,
  }));
  vi.mocked(offeringApi.list).mockResolvedValue(list);
  mount();
  await screen.findByText("55 servicios");
  expect(document.querySelectorAll(".offering-row")).toHaveLength(24);
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Categoría", { exact: true }), {
    target: { value: "cat:Grupo A" },
  });
  fireEvent.change(screen.getByLabelText("Mostrar servicios"), {
    target: { value: "active" },
  });
  expect(screen.getByText("49 servicios")).toBeInTheDocument();
  expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Densidad de lista"), {
    target: { value: "compact" },
  });
  expect(document.querySelector(".catalog-layout")).toHaveAttribute(
    "data-density",
    "compact",
  );
  fireEvent.click(screen.getByRole("button", { name: /^Servicio 01 / }));
  expect(screen.getByLabelText("Nombre del servicio")).toHaveValue(
    "Servicio 01",
  );
  fireEvent.click(screen.getByRole("button", { name: /Volver al catálogo/ }));
  expect(screen.getByLabelText("Categoría", { exact: true })).toHaveValue(
    "cat:Grupo A",
  );
  expect(screen.getByLabelText("Mostrar servicios")).toHaveValue("active");
  expect(offeringApi.list).toHaveBeenCalledTimes(1);
});
it("permite cancelar la desactivación sin enviar una mutación", async () => {
  mount();
  await edit();
  vi.mocked(window.confirm).mockReturnValue(false);
  fireEvent.click(screen.getByRole("button", { name: "Desactivar servicio" }));
  expect(offeringApi.status).not.toHaveBeenCalled();
});
it("conserva precisión de cuatro decimales al editar y guardar", async () => {
  vi.mocked(offeringApi.list).mockResolvedValue([
    { ...fixed, priceMin: "99999999999999.9999" },
  ]);
  vi.mocked(offeringApi.update).mockResolvedValue({
    ...fixed,
    priceMin: "99999999999999.9998",
    version: 1,
  });
  mount();
  await edit();
  fireEvent.change(screen.getByLabelText("Precio exacto (USD)"), {
    target: { value: "99999999999999.9998" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar servicio" }));
  await waitFor(() =>
    expect(offeringApi.update).toHaveBeenCalledWith(
      fixed.id,
      expect.objectContaining({ priceMin: "99999999999999.9998" }),
      0,
    ),
  );
});

it("elimina tras confirmar y actualiza la lista solo cuando la API confirma", async () => {
  let resolve!: (value: { id: string }) => void;
  vi.mocked(offeringApi.remove).mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  mount();
  await edit();
  fireEvent.click(screen.getByRole("button", { name: "Eliminar servicio" }));
  expect(window.confirm).toHaveBeenCalledWith(
    expect.stringContaining(fixed.name),
  );
  expect(offeringApi.remove).toHaveBeenCalledWith(fixed.id, fixed.version);
  expect(screen.getByLabelText("Nombre del servicio")).toHaveValue(fixed.name);
  expect(
    screen.getByRole("button", { name: "Eliminar servicio" }),
  ).toBeDisabled();
  resolve({ id: fixed.id });
  expect(
    await screen.findByText("Servicio eliminado del catálogo."),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Servicio fijo sintético/ }),
  ).not.toBeInTheDocument();
});
it("cancelar o fallar al eliminar conserva el registro", async () => {
  mount();
  await edit();
  vi.mocked(window.confirm).mockReturnValue(false);
  fireEvent.click(screen.getByRole("button", { name: "Eliminar servicio" }));
  expect(offeringApi.remove).not.toHaveBeenCalled();
  vi.mocked(window.confirm).mockReturnValue(true);
  vi.mocked(offeringApi.remove).mockRejectedValue(
    new ApiError(409, "El servicio cambió"),
  );
  fireEvent.click(screen.getByRole("button", { name: "Eliminar servicio" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "El servicio cambió",
  );
  expect(screen.getByLabelText("Nombre del servicio")).toHaveValue(fixed.name);
});
