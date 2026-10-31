import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Operations } from "./Operations";
import {
  staffApi,
  type Configuration,
  type Branch,
  type Professional,
  type Resource,
  type Schedule,
  type ScheduleException,
} from "./api/staff";
import { offeringApi, type ServiceOffering } from "./api/offering";
import { ApiError } from "./api/platform";
vi.mock("./api/staff", () => ({
  staffApi: {
    configuration: vi.fn(),
    removeProfessional: vi.fn(),
    branch: vi.fn(),
    professional: vi.fn(),
    resource: vi.fn(),
    status: vi.fn(),
    schedule: vi.fn(),
    exception: vi.fn(),
    requirements: vi.fn(),
  },
}));
vi.mock("./api/offering", () => ({ offeringApi: { list: vi.fn() } }));
const record = {
  establishmentId: "tenant-test",
  active: true,
  version: 0,
  createdAt: "2026-10-27T00:00:00Z",
  updatedAt: "2026-10-27T00:00:00Z",
};
const branch: Branch = {
  ...record,
  id: "branch-test",
  name: "Sucursal sintética",
  address: null,
  timeZone: "America/Guayaquil",
  isDefault: true,
};
const professional: Professional = {
  ...record,
  id: "professional-test",
  displayName: "Profesional sintético",
  specialty: null,
  branchIds: [branch.id],
  serviceIds: ["service-test"],
};
const resource: Resource = {
  ...record,
  id: "resource-test",
  branchId: branch.id,
  name: "Cabina sintética",
  typeDescription: null,
  capacity: 2,
};
const service: ServiceOffering = {
  ...record,
  id: "service-test",
  name: "Servicio sintético",
  category: null,
  description: "Test",
  durationMinutes: 30,
  priceMode: "FIXED",
  priceMin: "10",
  priceMax: null,
  currency: "USD",
  hasPriorAssessment: false,
  assessmentDescription: null,
};
const schedule: Schedule = {
  ...record,
  id: "schedule-test",
  branchId: branch.id,
  professionalId: professional.id,
  timeZone: branch.timeZone,
  week: [{ weekday: 7, closed: true, intervals: [] }],
};
const exception: ScheduleException = {
  ...record,
  id: "exception-test",
  scheduleId: schedule.id,
  date: "2026-11-01",
  kind: "CLOSURE",
  intervals: [],
  note: null,
};
let cfg: Configuration;
beforeEach(() => {
  vi.resetAllMocks();
  cfg = {
    branches: [branch],
    professionals: [professional],
    resources: [resource],
    schedules: [schedule],
    exceptions: [exception],
    requirements: [],
  };
  vi.mocked(staffApi.configuration).mockResolvedValue(cfg);
  vi.mocked(offeringApi.list).mockResolvedValue([service]);
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
const mount = (leave = vi.fn()) =>
  render(<Operations timeZone="America/Guayaquil" onLeave={leave} />);
async function ready() {
  await screen.findByRole("button", { name: "Crear profesional" });
  if (!screen.queryByLabelText("Nombre visible"))
    fireEvent.click(screen.getByRole("button", { name: "Crear profesional" }));
}
async function tab(name: string) {
  await ready();
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${name}`) }));
  const create = screen.queryByRole("button", {
    name:
      name === "Sucursales"
        ? "Crear sucursal"
        : name === "Espacios y equipos"
          ? "Añadir espacio o equipo"
          : "Crear profesional",
  });
  if (name !== "Horarios" && create) fireEvent.click(create);
}
async function scope() {
  await tab("Horarios");
  fireEvent.change(screen.getByLabelText("Sucursal del horario"), {
    target: { value: branch.id },
  });
  fireEvent.change(screen.getByLabelText("Horario de"), {
    target: { value: professional.id },
  });
}
describe("operación orientada a quién, dónde y cuándo", () => {
  it("presenta carga sin datos ficticios automáticos", async () => {
    vi.mocked(staffApi.configuration).mockReturnValue(new Promise(() => {}));
    mount();
    expect(screen.getByRole("status")).toHaveTextContent("Cargando");
    expect(staffApi.branch).not.toHaveBeenCalled();
  });
  it("ofrece crear explícitamente la primera sucursal", async () => {
    vi.mocked(staffApi.configuration).mockResolvedValue({
      ...cfg,
      branches: [],
      professionals: [],
    });
    mount();
    await tab("Sucursales");
    expect(screen.getByText(/Aún no tienes sucursales/)).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre de sucursal")).toHaveValue("");
    expect(staffApi.branch).not.toHaveBeenCalled();
  });
  it("crea sucursal con zona y principal explícitas", async () => {
    vi.mocked(staffApi.branch).mockResolvedValue({
      id: branch.id,
      configuration: cfg,
    });
    mount();
    await tab("Sucursales");
    fireEvent.change(screen.getByLabelText("Nombre de sucursal"), {
      target: { value: "Primera sucursal" },
    });
    fireEvent.click(screen.getByLabelText("Sucursal principal"));
    fireEvent.click(screen.getByRole("button", { name: "Guardar ficha" }));
    await waitFor(() =>
      expect(staffApi.branch).toHaveBeenCalledWith(
        {
          name: "Primera sucursal",
          address: null,
          timeZone: "America/Guayaquil",
          isDefault: true,
        },
        undefined,
        undefined,
      ),
    );
  });
  it("asocia profesional con servicios y sucursales sin correo ni tenant externo", async () => {
    vi.mocked(staffApi.professional).mockResolvedValue({
      id: professional.id,
      configuration: cfg,
    });
    mount();
    await ready();
    fireEvent.change(screen.getByLabelText("Nombre visible"), {
      target: { value: "Profesional nuevo" },
    });
    fireEvent.click(screen.getByLabelText(branch.name));
    fireEvent.click(screen.getByLabelText(service.name));
    fireEvent.click(screen.getByRole("button", { name: "Guardar ficha" }));
    await waitFor(() =>
      expect(staffApi.professional).toHaveBeenCalledWith(
        {
          displayName: "Profesional nuevo",
          specialty: null,
          branchIds: [branch.id],
          serviceIds: [service.id],
        },
        undefined,
        undefined,
      ),
    );
    expect(screen.queryByLabelText(/correo/i)).not.toBeInTheDocument();
  });
  it("edita y cambia estado con versión; no descarta un borrador al desactivar", async () => {
    vi.mocked(staffApi.professional).mockResolvedValue({
      id: professional.id,
      configuration: {
        ...cfg,
        professionals: [
          { ...professional, displayName: "Editado", version: 1 },
        ],
      },
    });
    mount();
    await ready();
    fireEvent.click(
      screen.getByRole("button", { name: /Profesional sintético.*Activo/ }),
    );
    fireEvent.change(screen.getByLabelText("Nombre visible"), {
      target: { value: "Editado" },
    });
    expect(screen.getByRole("button", { name: "Desactivar" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Guardar ficha" }));
    await screen.findByText(/Configuración guardada/);
    expect(staffApi.professional).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: "Editado" }),
      professional.id,
      0,
    );
    vi.mocked(staffApi.status).mockResolvedValue({
      id: professional.id,
      configuration: cfg,
    });
    fireEvent.click(screen.getByRole("button", { name: "Desactivar" }));
    await waitFor(() =>
      expect(staffApi.status).toHaveBeenCalledWith(
        "professionals",
        professional.id,
        false,
        1,
      ),
    );
  });
  it("conserva el borrador ante conflicto y permite cargar datos actuales", async () => {
    vi.mocked(staffApi.professional).mockRejectedValue(
      new ApiError(
        409,
        "La configuración cambió en otra ventana. Tu edición se conserva.",
      ),
    );
    mount();
    await ready();
    fireEvent.change(screen.getByLabelText("Nombre visible"), {
      target: { value: "Edición pendiente" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar ficha" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/otra ventana/);
    expect(screen.getByLabelText("Nombre visible")).toHaveValue(
      "Edición pendiente",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Cargar datos actuales" }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Nombre visible")).toHaveValue(""),
    );
  });
  it("protege borradores al cambiar de área o salir", async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    const leave = vi.fn();
    mount(leave);
    await ready();
    fireEvent.change(screen.getByLabelText("Nombre visible"), {
      target: { value: "Pendiente" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Sucursales/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "Volver al establecimiento" }),
    );
    expect(screen.getByLabelText("Nombre visible")).toHaveValue("Pendiente");
    expect(leave).not.toHaveBeenCalled();
  });
  it("edita días sin configurar, cerrados e intervalos con pausas", async () => {
    vi.mocked(staffApi.schedule).mockResolvedValue({
      id: schedule.id,
      configuration: cfg,
    });
    mount();
    await scope();
    expect(screen.getByLabelText("Lunes")).toHaveValue("unset");
    expect(screen.getByLabelText("Domingo")).toHaveValue("closed");
    fireEvent.change(screen.getByLabelText("Lunes"), {
      target: { value: "open" },
    });
    fireEvent.change(screen.getByLabelText("Lunes · inicio 1"), {
      target: { value: "09:00" },
    });
    fireEvent.change(screen.getByLabelText("Lunes · fin 1"), {
      target: { value: "12:00" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Añadir intervalo · Lunes" }),
    );
    fireEvent.change(screen.getByLabelText("Lunes · inicio 2"), {
      target: { value: "14:00" },
    });
    fireEvent.change(screen.getByLabelText("Lunes · fin 2"), {
      target: { value: "18:00" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Guardar horario semanal" }),
    );
    await waitFor(() =>
      expect(staffApi.schedule).toHaveBeenCalledWith({
        branchId: branch.id,
        professionalId: professional.id,
        timeZone: branch.timeZone,
        version: 0,
        week: [
          {
            weekday: 1,
            closed: false,
            intervals: [
              { start: "09:00", end: "12:00" },
              { start: "14:00", end: "18:00" },
            ],
          },
          { weekday: 7, closed: true, intervals: [] },
        ],
      }),
    );
  });
  it("registra excepción por fecha y desactiva la existente", async () => {
    vi.mocked(staffApi.exception).mockResolvedValue({
      id: exception.id,
      configuration: cfg,
    });
    mount();
    await scope();
    fireEvent.click(
      screen.getByRole("button", { name: "Excepciones por fecha" }),
    );
    fireEvent.change(screen.getByLabelText("Fecha de excepción"), {
      target: { value: "2026-11-02" },
    });
    fireEvent.change(screen.getByLabelText("Tipo de excepción"), {
      target: { value: "ABSENCE" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar excepción" }));
    await waitFor(() =>
      expect(staffApi.exception).toHaveBeenCalledWith(
        schedule.id,
        { date: "2026-11-02", kind: "ABSENCE", intervals: [], note: null },
        undefined,
        undefined,
      ),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /2026-11-01 · Cierre/ }),
    );
    vi.mocked(staffApi.status).mockResolvedValue({
      id: exception.id,
      configuration: cfg,
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Desactivar excepción" }),
    );
    await waitFor(() =>
      expect(staffApi.status).toHaveBeenCalledWith(
        "exceptions",
        exception.id,
        false,
        0,
      ),
    );
  });
  it("crea recurso con capacidad numérica y requerimientos por sucursal", async () => {
    vi.mocked(staffApi.resource).mockResolvedValue({
      id: resource.id,
      configuration: cfg,
    });
    vi.mocked(staffApi.requirements).mockResolvedValue({
      id: service.id,
      configuration: cfg,
    });
    mount();
    await tab("Espacios y equipos");
    fireEvent.change(screen.getByLabelText("Sucursal"), {
      target: { value: branch.id },
    });
    fireEvent.change(screen.getByLabelText("Nombre del espacio o equipo"), {
      target: { value: "Cabina nueva" },
    });
    fireEvent.change(screen.getByLabelText("Cantidad que tienes"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar ficha" }));
    await waitFor(() =>
      expect(staffApi.resource).toHaveBeenCalledWith(
        {
          branchId: branch.id,
          name: "Cabina nueva",
          typeDescription: null,
          capacity: 2,
        },
        undefined,
        undefined,
      ),
    );
    await screen.findByText(/Configuración guardada/);
    fireEvent.click(
      screen.getByRole("button", { name: "Qué usa cada servicio" }),
    );
    fireEvent.change(screen.getByLabelText("Sucursal"), {
      target: { value: branch.id },
    });
    fireEvent.change(screen.getByLabelText("Servicio"), {
      target: { value: service.id },
    });
    fireEvent.click(
      screen.getByLabelText(/Cabina sintética · cantidad total: 2/),
    );
    fireEvent.change(
      screen.getByLabelText("Cantidad para este servicio · Cabina sintética"),
      {
        target: { value: "2" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar selección" }));
    await waitFor(() =>
      expect(staffApi.requirements).toHaveBeenCalledWith(
        branch.id,
        service.id,
        [{ resourceId: resource.id, units: 2 }],
        null,
      ),
    );
  });
  it("muestra fallos de carga y recupera el contexto", async () => {
    vi.mocked(staffApi.configuration).mockRejectedValueOnce(
      new Error("API no disponible"),
    );
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "API no disponible",
    );
    vi.mocked(staffApi.configuration).mockResolvedValue(cfg);
    fireEvent.click(
      screen.getByRole("button", { name: "Cargar datos actuales" }),
    );
    await ready();
    expect(screen.getByLabelText("Nombre visible")).toBeInTheDocument();
  });
  it("descarta realmente un borrador al volver a la misma área", async () => {
    mount();
    await ready();
    fireEvent.change(screen.getByLabelText("Nombre visible"), {
      target: { value: "Descartar este borrador" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Profesionales/ }));
    expect(window.confirm).toHaveBeenCalled();
    expect(screen.queryByLabelText("Nombre visible")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Crear profesional" }));
    expect(screen.getByLabelText("Nombre visible")).toHaveValue("");
  });
});

it("protege los cambios del equipo antes de salir por la navegación principal", async () => {
  const onNavigate = vi.fn();
  render(
    <Operations
      timeZone="America/Guayaquil"
      onLeave={vi.fn()}
      onNavigate={onNavigate}
    />,
  );
  await ready();
  fireEvent.change(screen.getByLabelText("Nombre visible"), {
    target: { value: "Borrador pendiente" },
  });
  vi.mocked(window.confirm).mockReturnValue(false);
  fireEvent.click(screen.getByRole("button", { name: /Servicios/ }));
  expect(onNavigate).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Nombre visible")).toHaveValue(
    "Borrador pendiente",
  );
  vi.mocked(window.confirm).mockReturnValue(true);
  fireEvent.click(screen.getByRole("button", { name: /Servicios/ }));
  expect(onNavigate).toHaveBeenCalledWith("services");
});

it("navega a una sucursal relacionada sin perder autorización ni consultar de nuevo", async () => {
  mount();
  await screen.findByRole("button", { name: /Profesional sintético.*Activo/ });
  fireEvent.click(
    screen.getByRole("button", { name: /Profesional sintético.*Activo/ }),
  );
  fireEvent.click(screen.getByRole("button", { name: /⌂ Sucursal sintética/ }));
  expect(screen.getByLabelText("Nombre de sucursal")).toHaveValue(branch.name);
  expect(staffApi.configuration).toHaveBeenCalledTimes(1);
  expect(staffApi.branch).not.toHaveBeenCalled();
});
it("filtra el directorio y limita los registros renderizados", async () => {
  vi.mocked(staffApi.configuration).mockResolvedValue({
    ...cfg,
    professionals: Array.from({ length: 45 }, (_, i) => ({
      ...professional,
      id: "person-" + i,
      displayName: "Persona " + i,
    })),
  });
  mount();
  await screen.findByRole("button", { name: /Persona 0.*Activo/ });
  expect(document.querySelectorAll(".operations-list > li")).toHaveLength(20);
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(screen.getByText("2 de 3")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Buscar en este directorio"), {
    target: { value: "Persona 44" },
  });
  expect(document.querySelectorAll(".operations-list > li")).toHaveLength(1);
  expect(
    screen.getByRole("button", { name: /Persona 44.*Activo/ }),
  ).toBeInTheDocument();
});
it("pide confirmación antes de desactivar una ficha", async () => {
  mount();
  await screen.findByRole("button", { name: /Profesional sintético.*Activo/ });
  fireEvent.click(
    screen.getByRole("button", { name: /Profesional sintético.*Activo/ }),
  );
  vi.mocked(window.confirm).mockReturnValue(false);
  fireEvent.click(screen.getByRole("button", { name: "Desactivar" }));
  expect(staffApi.status).not.toHaveBeenCalled();
});

it("elimina un profesional tras confirmar y cierra la ficha al recibir la respuesta", async () => {
  vi.mocked(staffApi.removeProfessional).mockResolvedValue({
    id: professional.id,
    configuration: { ...cfg, professionals: [] },
  });
  mount();
  await screen.findByRole("button", { name: /Profesional sintético.*Activo/ });
  fireEvent.click(
    screen.getByRole("button", { name: /Profesional sintético.*Activo/ }),
  );
  vi.mocked(window.confirm).mockReturnValue(false);
  fireEvent.click(screen.getByRole("button", { name: "Eliminar profesional" }));
  expect(staffApi.removeProfessional).not.toHaveBeenCalled();
  vi.mocked(window.confirm).mockReturnValue(true);
  fireEvent.click(screen.getByRole("button", { name: "Eliminar profesional" }));
  expect(
    await screen.findByText("Profesional eliminado del equipo."),
  ).toBeInTheDocument();
  expect(staffApi.removeProfessional).toHaveBeenCalledWith(professional.id, 0);
  expect(screen.queryByLabelText("Nombre visible")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Profesional sintético.*Activo/ }),
  ).not.toBeInTheDocument();
});
it("explica recursos y capacidad con ejemplos sin crear registros", async () => {
  mount();
  await tab("Espacios y equipos");
  expect(
    screen.getByRole("button", { name: "Qué usa cada servicio" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByText("Ver un ejemplo"));
  expect(screen.getByText(/dos sillones iguales/)).toBeInTheDocument();
  expect(staffApi.resource).not.toHaveBeenCalled();
});
