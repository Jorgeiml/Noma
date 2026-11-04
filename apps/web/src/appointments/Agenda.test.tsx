import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import Agenda from "./Agenda";
import { BookingForm } from "./BookingForm";
import {
  appointmentsApi,
  localDate,
  type Appointment,
  type Configuration,
} from "./appointments-api";
vi.mock("./appointments-api", async (original) => ({
  ...(await original<typeof import("./appointments-api")>()),
  appointmentsApi: {
    configuration: vi.fn(),
    agenda: vi.fn(),
    availability: vi.fn(),
    customers: vi.fn(),
    create: vi.fn(),
    reschedule: vi.fn(),
    detail: vi.fn(),
    state: vi.fn(),
  },
}));
const date = localDate(new Date(), "UTC");
const configuration: Configuration = {
  branches: [{ id: "b1", name: "Centro", timeZone: "UTC" }],
  services: [
    {
      id: "s1",
      establishmentId: "t1",
      name: "Corte",
      category: null,
      description: "",
      durationMinutes: 30,
      priceMode: "FIXED",
      priceMin: "10",
      priceMax: null,
      currency: "USD",
      active: true,
      version: 0,
      hasPriorAssessment: false,
      assessmentDescription: null,
    },
  ],
  professionals: [
    {
      id: "p1",
      displayName: "Alex",
      branches: [{ branchId: "b1" }],
      services: [{ serviceId: "s1" }],
    },
  ],
};
const appointment: Appointment = {
  id: "a1",
  branchId: "b1",
  serviceId: "s1",
  professionalId: "p1",
  customerId: "c1",
  customer: {
    id: "c1",
    name: "Cliente de prueba",
    phone: "0991234567",
    email: null,
    note: null,
  },
  startsAt: date + "T09:00:00.000Z",
  endsAt: date + "T09:30:00.000Z",
  timeZone: "UTC",
  durationMinutes: 30,
  state: "PENDING_CONFIRMATION",
  channel: "PHONE",
  version: 0,
  note: null,
  snapshot: {
    serviceName: "Corte",
    branchName: "Centro",
    professionalName: "Alex",
    priceMode: "FIXED",
    priceMin: "10",
    priceMax: null,
    currency: "USD",
  },
  allocations: [],
  events: [
    { id: "e1", type: "CREATED", createdAt: date + "T08:00:00Z", reason: null },
  ],
};
const slot = {
  startsAt: date + "T10:00:00.000Z",
  endsAt: date + "T10:30:00.000Z",
  professionalId: "p1",
  label: "10:00 GMT",
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(Date, "now").mockReturnValue(Date.parse(date + "T20:00:00Z"));
  vi.mocked(appointmentsApi.configuration).mockResolvedValue(configuration);
  vi.mocked(appointmentsApi.agenda).mockResolvedValue({
    items: [appointment],
    total: 1,
    page: 1,
    pageSize: 200,
    timeZone: "UTC",
    date,
    days: 1,
  });
  vi.mocked(appointmentsApi.detail).mockResolvedValue(appointment);
  vi.mocked(appointmentsApi.availability).mockResolvedValue({
    slots: [slot],
    problems: [],
    timeZone: "UTC",
    durationMinutes: 30,
  });
  vi.mocked(appointmentsApi.customers).mockResolvedValue({
    items: [appointment.customer],
    total: 1,
    page: 1,
    pageSize: 30,
  });
  vi.mocked(appointmentsApi.create).mockResolvedValue(appointment);
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
afterEach(() => vi.restoreAllMocks());
function renderAgenda() {
  return render(
    <Agenda
      timeZone="UTC"
      onNavigate={vi.fn()}
      enabledAreas={["agenda", "establishment", "services", "operations"]}
      onEditingChange={vi.fn()}
    />,
  );
}
const row = () =>
  screen.findByRole("button", { name: /Cliente de prueba.*Corte/ });
it("carga una agenda real, expone duración y detalle sin citas inventadas", async () => {
  renderAgenda();
  expect(screen.getByRole("status")).toHaveTextContent("Preparando");
  fireEvent.click(await row());
  expect(
    await screen.findByRole("dialog", { name: "Detalle de la cita" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Corte · 30 min")).toBeInTheDocument();
  expect(screen.getByText("Por teléfono")).toBeInTheDocument();
  expect(screen.getByText("Creada")).toBeInTheDocument();
});
it("consulta semana, filtros, fechas y actualización explícita", async () => {
  renderAgenda();
  await row();
  fireEvent.click(screen.getByRole("button", { name: "Semana" }));
  await waitFor(() =>
    expect(appointmentsApi.agenda).toHaveBeenLastCalledWith(
      expect.objectContaining({ days: 7 }),
    ),
  );
  fireEvent.change(screen.getByLabelText("Fecha de agenda"), {
    target: { value: "2027-03-20" },
  });
  fireEvent.change(screen.getByLabelText("Profesional de agenda"), {
    target: { value: "p1" },
  });
  await waitFor(() =>
    expect(appointmentsApi.agenda).toHaveBeenLastCalledWith(
      expect.objectContaining({ date: "2027-03-20", professionalId: "p1" }),
    ),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Actualizar agenda" }),
    ).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Actualizar agenda" }));
  expect(screen.getByText(/No es una transmisión en vivo/)).toBeInTheDocument();
});
it("estado vacío útil y configuración faltante no inventan citas", async () => {
  vi.mocked(appointmentsApi.agenda).mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    pageSize: 200,
    timeZone: "UTC",
    date,
    days: 1,
  });
  renderAgenda();
  expect(
    await screen.findByRole("heading", {
      name: "Hay espacio para tu próxima cita.",
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Revisar equipo y horarios" }),
  ).toBeInTheDocument();
});
it("abre crear con el contexto de sucursal y fecha", async () => {
  renderAgenda();
  await row();
  fireEvent.click(screen.getByRole("button", { name: /Nueva cita/ }));
  const modal = screen.getByRole("dialog", { name: "Una nueva cita" });
  expect(within(modal).getByLabelText("Sucursal")).toHaveValue("b1");
  expect(within(modal).getByLabelText("Fecha de la cita")).toHaveValue(date);
  fireEvent.click(screen.getByRole("button", { name: "Cerrar panel" }));
  expect(screen.getByRole("alert")).toHaveTextContent("¿Cerrar sin guardar?");
  fireEvent.click(screen.getByRole("button", { name: "Descartar y cerrar" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it.each(["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"] as const)(
  "opera estado %s con versión y clave idempotente",
  async (state) => {
    const a = {
      ...appointment,
      state:
        state === "CONFIRMED" || state === "CANCELLED"
          ? ("PENDING_CONFIRMATION" as const)
          : ("CONFIRMED" as const),
    };
    vi.mocked(appointmentsApi.agenda).mockResolvedValue({
      items: [a],
      total: 1,
      page: 1,
      pageSize: 200,
      timeZone: "UTC",
      date,
      days: 1,
    });
    vi.mocked(appointmentsApi.detail).mockResolvedValue(a);
    vi.mocked(appointmentsApi.state).mockResolvedValue({
      ...a,
      state,
      version: 1,
    });
    renderAgenda();
    fireEvent.click(await row());
    await screen.findByText("Historial de la cita");
    if (state === "CANCELLED")
      fireEvent.change(screen.getByLabelText("Motivo de cancelación"), {
        target: { value: "Cliente solicitó cancelar" },
      });
    const labels = {
      CONFIRMED: "Confirmar cita",
      CANCELLED: "Cancelar cita",
      COMPLETED: "Marcar completada",
      NO_SHOW: "Marcar no asistió",
    };
    fireEvent.click(screen.getByRole("button", { name: labels[state] }));
    await waitFor(() =>
      expect(appointmentsApi.state).toHaveBeenCalledWith(
        "a1",
        expect.objectContaining({
          state,
          version: 0,
          requestId: expect.any(String),
        }),
      ),
    );
  },
);
it("reagendar conserva cliente, servicio y fecha original", async () => {
  renderAgenda();
  fireEvent.click(await row());
  await screen.findByText("Historial de la cita");
  fireEvent.click(screen.getByRole("button", { name: "Reagendar" }));
  const modal = screen.getByRole("dialog", { name: "Cambiar el horario" });
  expect(within(modal).getByLabelText("Servicio")).toBeDisabled();
  expect(within(modal).getByLabelText("Fecha de la cita")).toHaveValue(date);
  expect(within(modal).getByText(/Se conservan cliente/)).toBeInTheDocument();
});
function form(original: Appointment | null = null) {
  return render(
    <BookingForm
      configuration={configuration}
      branchId="b1"
      professionalId="p1"
      date={date}
      original={original}
      onDone={vi.fn()}
    />,
  );
}
async function selectSlot() {
  if (screen.getByLabelText("Servicio").getAttribute("disabled") === null)
    fireEvent.change(screen.getByLabelText("Servicio"), {
      target: { value: "s1" },
    });
  fireEvent.click(
    screen.getByRole("button", { name: "Buscar horarios disponibles" }),
  );
  fireEvent.click(await screen.findByRole("button", { name: /10:00 GMT/ }));
}
it("crea un cliente desde una cita telefónica, sin exigir cuenta ni correo", async () => {
  form();
  await selectSlot();
  fireEvent.click(screen.getByRole("button", { name: "Nuevo cliente" }));
  fireEvent.change(screen.getByLabelText("Nombre del cliente"), {
    target: { value: "Persona sintética" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Crear cita" }));
  await waitFor(() =>
    expect(appointmentsApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: expect.objectContaining({
          name: "Persona sintética",
          email: null,
        }),
        channel: "PHONE",
        startsAt: slot.startsAt,
      }),
    ),
  );
});
it("busca cliente con Enter y conserva todos los datos si ocurre un conflicto", async () => {
  vi.mocked(appointmentsApi.create).mockRejectedValue(
    new Error("Ese horario acaba de ocuparse."),
  );
  form();
  await selectSlot();
  fireEvent.change(
    screen.getByLabelText("Buscar cliente por nombre o teléfono"),
    { target: { value: "Cliente" } },
  );
  fireEvent.keyDown(
    screen.getByLabelText("Buscar cliente por nombre o teléfono"),
    { key: "Enter" },
  );
  fireEvent.click(
    await screen.findByRole("button", {
      name: /Cliente de prueba.*0991234567/,
    }),
  );
  fireEvent.change(screen.getByLabelText("Notas de la cita · opcional"), {
    target: { value: "Llegará puntual" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Crear cita" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Ese horario acaba de ocuparse",
  );
  expect(screen.getByLabelText("Notas de la cita · opcional")).toHaveValue(
    "Llegará puntual",
  );
  expect(
    screen.getByText("Cliente seleccionado: Cliente de prueba"),
  ).toBeInTheDocument();
});
it("envía un reagendamiento con identidad y versión original", async () => {
  vi.mocked(appointmentsApi.reschedule).mockResolvedValue({
    ...appointment,
    startsAt: slot.startsAt,
  });
  form(appointment);
  await selectSlot();
  fireEvent.change(screen.getByLabelText("Motivo del cambio"), {
    target: { value: "Otro horario solicitado" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Guardar nuevo horario" }),
  );
  await waitFor(() =>
    expect(appointmentsApi.reschedule).toHaveBeenCalledWith(
      "a1",
      expect.objectContaining({
        version: 0,
        reason: "Otro horario solicitado",
        startsAt: slot.startsAt,
      }),
    ),
  );
});
it("muestra el motivo de configuración faltante sin habilitar guardar", async () => {
  vi.mocked(appointmentsApi.availability).mockResolvedValue({
    slots: [],
    problems: ["Configura el horario del profesional."],
    timeZone: "UTC",
    durationMinutes: 30,
  });
  form();
  fireEvent.change(screen.getByLabelText("Servicio"), {
    target: { value: "s1" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Buscar horarios disponibles" }),
  );
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Configura el horario",
  );
  expect(screen.getByRole("button", { name: "Crear cita" })).toBeDisabled();
});
