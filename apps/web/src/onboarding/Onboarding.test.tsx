import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import Onboarding from "./Onboarding";
import { OnboardingInvitation } from "./OnboardingInvitation";
import {
  onboardingApi,
  type OnboardingSnapshot,
  type SaveResult,
} from "./onboarding-api";
import { commercialApi, type CommercialAccount } from "../api/commercial";
import { replacePage } from "../navigation";
vi.mock("./onboarding-api", () => ({
  onboardingApi: { load: vi.fn(), save: vi.fn() },
}));
vi.mock("../api/commercial", () => ({
  commercialApi: { selectMembership: vi.fn() },
}));
vi.mock("../navigation", () => ({ replacePage: vi.fn() }));
const stamp = "2026-10-31T12:00:00.000Z";
const ids = {
  business: "b0000000-0000-4000-8000-000000000001",
  branch: "b0000000-0000-4000-8000-000000000002",
  member: "b0000000-0000-4000-8000-000000000003",
  service: "b0000000-0000-4000-8000-000000000004",
  person: "b0000000-0000-4000-8000-000000000005",
};
function state(step = 0): OnboardingSnapshot {
  const base = {
    establishmentId: ids.business,
    active: true,
    version: 0,
    createdAt: stamp,
    updatedAt: stamp,
  };
  return {
    status: "IN_PROGRESS",
    message: null,
    progress: {
      id: "fixture-progress",
      step,
      version: 3,
      createdBusiness: true,
      selectedVertical: step ? "BEAUTY" : null,
      completedAt: null,
      updatedAt: stamp,
    },
    configuration:
      step < 2
        ? null
        : {
            business: {
              id: ids.business,
              commercialName: "UI TEST barbería",
              countryCode: "EC",
              city: "Quito",
              address: null,
              businessPhone: "0993020091",
              businessEmail: "fixture@example.test",
              timeZone: "America/Guayaquil",
              description: null,
              beautySubtype: "BARBERSHOP",
              currency: "USD",
              version: 0,
            },
            branches: [
              {
                ...base,
                id: ids.branch,
                name: "Principal",
                address: null,
                timeZone: "America/Guayaquil",
                isDefault: true,
              },
            ],
            services: [
              {
                ...base,
                id: ids.service,
                name: "Corte de prueba",
                category: null,
                description: "",
                durationMinutes: 30,
                priceMode: "FIXED",
                priceMin: "12.50",
                priceMax: null,
                hasPriorAssessment: false,
                assessmentDescription: null,
                currency: "USD",
              },
            ],
            professionals: [
              {
                ...base,
                id: ids.person,
                displayName: "UI TEST profesional",
                specialty: null,
                branchIds: [ids.branch],
                serviceIds: [ids.service],
              },
            ],
            resources: [],
            schedules: [],
          },
    entitlement: {
      kind: "MANUAL_PILOT",
      plan: "START",
      expiresAt: "2026-12-01T12:00:00Z",
      membershipId: step >= 2 ? ids.member : null,
      establishmentId: null,
      limits: { branches: 1, professionals: 2, users: 2 },
    },
    memberships:
      step >= 2
        ? [
            {
              id: ids.member,
              establishment: {
                id: ids.business,
                commercialName: "UI TEST barbería",
                vertical: "BEAUTY",
                status: "ACTIVE",
              },
            },
          ]
        : [],
    missing: [],
  };
}
const result = (snapshot: OnboardingSnapshot): SaveResult => ({
  id: "fixture-result",
  replayed: false,
  snapshot,
});
beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/onboarding");
  vi.mocked(onboardingApi.load).mockResolvedValue(state());
  vi.mocked(onboardingApi.save).mockResolvedValue(result(state(1)));
  vi.mocked(commercialApi.selectMembership).mockResolvedValue();
});
it("carga el progreso sin mostrar un formulario operativo prematuramente", () => {
  vi.mocked(onboardingApi.load).mockReturnValue(new Promise(() => {}));
  render(<Onboarding />);
  expect(screen.getByRole("status")).toHaveTextContent(
    "Recuperando tu configuración",
  );
  expect(screen.queryByLabelText("Nombre comercial")).not.toBeInTheDocument();
});
it.each(["PENDING", "EXPIRED", "SUSPENDED", "REVOKED"])(
  "el estado %s no deja crear negocios ni muestra datos operativos",
  async (status) => {
    vi.mocked(onboardingApi.load).mockResolvedValue({
      ...state(),
      status,
      message: "Estado comercial de prueba",
      configuration: null,
      entitlement: null,
    });
    render(<Onboarding />);
    expect(
      await screen.findByText("Estado comercial de prueba"),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Nombre comercial")).not.toBeInTheDocument();
    expect(onboardingApi.save).not.toHaveBeenCalled();
    expect(
      screen.getByRole("link", { name: "Revisar estado de mi cuenta" }),
    ).toHaveAttribute("href", "/activacion");
  },
);
it("una bienvenida con piloto propone empezar sin inventar un pago", async () => {
  vi.mocked(onboardingApi.load).mockResolvedValue({
    ...state(),
    status: "WELCOME",
    progress: null,
  });
  render(<Onboarding />);
  await screen.findByRole("button", { name: /Preparar mi negocio/ });
  expect(screen.getByText(/No representa un pago/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Preparar mi negocio/ }));
  await waitFor(() =>
    expect(onboardingApi.save).toHaveBeenCalledWith(
      "start",
      expect.objectContaining({ version: 0, requestId: expect.any(String) }),
    ),
  );
});
it("muestra los cuatro sectores, bloquea los tres pendientes y guarda Beauty", async () => {
  render(<Onboarding />);
  const dental = await screen.findByRole("button", { name: /Odontología/ });
  expect(dental).toHaveAttribute("aria-disabled", "true");
  fireEvent.click(dental);
  expect(
    screen.getByText(/Odontología está en desarrollo/),
  ).toBeInTheDocument();
  expect(onboardingApi.save).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: /Belleza y bienestar.*Disponible/ }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: /Continuar con belleza y bienestar/ }),
  );
  await waitFor(() =>
    expect(onboardingApi.save).toHaveBeenCalledWith(
      "sector",
      expect.objectContaining({ vertical: "BEAUTY", version: 3 }),
    ),
  );
});
it("recupera la etapa guardada al recargar, con progreso accesible", async () => {
  vi.mocked(onboardingApi.load).mockResolvedValue(state(4));
  render(<Onboarding />);
  expect(
    await screen.findByRole("heading", { level: 1, name: "Tu equipo" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("navigation", { name: "Progreso de configuración" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Paso 5: Tu equipo/ }),
  ).toHaveAttribute("aria-current", "step");
  expect(onboardingApi.save).not.toHaveBeenCalled();
});
it("exige campos comprensibles y guarda el negocio con la identidad resuelta en backend", async () => {
  vi.mocked(onboardingApi.load).mockResolvedValue(state(1));
  vi.mocked(onboardingApi.save).mockResolvedValue(result(state(2)));
  render(<Onboarding />);
  const name = await screen.findByLabelText("Nombre comercial");
  expect(name).toBeRequired();
  expect(screen.getByLabelText("Correo comercial")).toBeRequired();
  expect(screen.getByLabelText(/Dirección/)).not.toBeRequired();
  expect(screen.queryByLabelText(/contraseña/i)).not.toBeInTheDocument();
  fireEvent.change(name, { target: { value: "UI TEST nueva barbería" } });
  fireEvent.change(screen.getByLabelText("Ciudad"), {
    target: { value: "Quito" },
  });
  fireEvent.change(screen.getByLabelText("Teléfono comercial"), {
    target: { value: "0993020091" },
  });
  fireEvent.change(screen.getByLabelText("Correo comercial"), {
    target: { value: "fixture@example.test" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar y continuar" }));
  await waitFor(() => expect(onboardingApi.save).toHaveBeenCalledOnce());
  const payload = vi.mocked(onboardingApi.save).mock.calls[0]![1] as Record<
    string,
    unknown
  >;
  expect(payload).not.toHaveProperty("ownerUserId");
  expect(payload.business).toMatchObject({
    commercialName: "UI TEST nueva barbería",
    countryCode: "EC",
  });
  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: "Tu espacio y horarios",
    }),
  ).toBeInTheDocument();
});
it("evita doble ejecución y conserva la edición y la clave de reintento tras error", async () => {
  vi.mocked(onboardingApi.load).mockResolvedValue(state(1));
  vi.mocked(onboardingApi.save).mockRejectedValueOnce(
    new Error("No pudimos confirmar el guardado"),
  );
  render(<Onboarding />);
  fireEvent.change(await screen.findByLabelText("Nombre comercial"), {
    target: { value: "Edición conservada" },
  });
  const form = screen.getByLabelText("Nombre comercial").closest("form")!;
  fireEvent.submit(form);
  await screen.findByText("No pudimos confirmar el guardado");
  expect(screen.getByLabelText("Nombre comercial")).toHaveValue(
    "Edición conservada",
  );
  const first = vi.mocked(onboardingApi.save).mock.calls[0]![1];
  let resolve!: (value: SaveResult) => void;
  vi.mocked(onboardingApi.save).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  fireEvent.submit(form);
  fireEvent.submit(form);
  await waitFor(() => expect(onboardingApi.save).toHaveBeenCalledTimes(2));
  expect(vi.mocked(onboardingApi.save).mock.calls[1]![1]).toEqual(first);
  resolve(result(state(2)));
  await screen.findByRole("heading", {
    level: 1,
    name: "Tu espacio y horarios",
  });
});
it("avisa antes de descartar cambios al volver de etapa", async () => {
  vi.mocked(onboardingApi.load).mockResolvedValue(state(1));
  vi.spyOn(window, "confirm").mockReturnValue(false);
  render(<Onboarding />);
  fireEvent.change(await screen.findByLabelText("Nombre comercial"), {
    target: { value: "Sin guardar" },
  });
  fireEvent.click(screen.getByRole("button", { name: "← Volver" }));
  expect(window.confirm).toHaveBeenCalled();
  expect(onboardingApi.save).not.toHaveBeenCalled();
});
it("los horarios sugeridos requieren guardado explícito y usan los días de Staff 1–7", async () => {
  vi.mocked(onboardingApi.load).mockResolvedValue(state(2));
  render(<Onboarding />);
  fireEvent.click(
    await screen.findByRole("button", {
      name: "Usar lunes a viernes, de 09:00 a 18:00",
    }),
  );
  expect(onboardingApi.save).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Guardar horario" }));
  await waitFor(() =>
    expect(onboardingApi.save).toHaveBeenCalledWith(
      "schedules",
      expect.objectContaining({
        data: expect.objectContaining({
          week: expect.arrayContaining([
            expect.objectContaining({ weekday: 1, closed: false }),
            expect.objectContaining({ weekday: 7, closed: true }),
          ]),
        }),
      }),
    ),
  );
});
it("recupera servicios existentes y mantiene importes como texto decimal", async () => {
  vi.mocked(onboardingApi.load).mockResolvedValue(state(3));
  render(<Onboarding />);
  expect(
    await screen.findByRole("button", { name: /Corte de prueba/ }),
  ).toBeInTheDocument();
  expect(onboardingApi.save).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: /Corte de prueba/ }));
  const price = screen.getByLabelText("Precio · USD");
  expect(price).toHaveValue("12.50");
  fireEvent.change(price, { target: { value: "15.25" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar servicio" }));
  await waitFor(() =>
    expect(onboardingApi.save).toHaveBeenCalledWith(
      "services",
      expect.objectContaining({
        id: ids.service,
        data: expect.objectContaining({ priceMin: "15.25" }),
      }),
    ),
  );
});
it("distingue profesionales de cuentas y deja los recursos como opcionales", async () => {
  vi.mocked(onboardingApi.load).mockResolvedValue(state(4));
  render(<Onboarding />);
  expect(
    await screen.findByText(/Esto no crea una cuenta de usuario/),
  ).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Espacios y equipos · opcional" }),
  );
  expect(
    screen.getByText(/Si no los utilizas, puedes continuar sin añadirlos/),
  ).toBeInTheDocument();
  expect(onboardingApi.save).not.toHaveBeenCalled();
});
it("la revisión bloquea finalizar cuando falta configuración indispensable", async () => {
  vi.mocked(onboardingApi.load).mockResolvedValue({
    ...state(5),
    missing: [{ step: 2, message: "Guarda un horario de atención." }],
  });
  render(<Onboarding />);
  expect(
    await screen.findByText("Guarda un horario de atención."),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Terminar y entrar/ }),
  ).toBeDisabled();
  expect(
    screen.getByText(
      /El motor de reservas y el asistente IA todavía no están disponibles/,
    ),
  ).toBeInTheDocument();
});
it("la finalización confirmada usa la selección comercial existente para entrar al negocio", async () => {
  vi.mocked(onboardingApi.load).mockResolvedValue(state(5));
  const completed = {
    ...state(6),
    status: "COMPLETE",
    progress: { ...state(6).progress!, completedAt: stamp },
  };
  vi.mocked(onboardingApi.save).mockResolvedValue(result(completed));
  render(<Onboarding />);
  fireEvent.click(
    await screen.findByRole("button", { name: /Terminar y entrar/ }),
  );
  await waitFor(() =>
    expect(commercialApi.selectMembership).toHaveBeenCalledWith(ids.member),
  );
  expect(replacePage).toHaveBeenCalledWith("/app/establecimiento?bienvenida=1");
});
it("no invita a configurar sin autorización y sí ofrece el recorrido a un piloto vigente", () => {
  const account: CommercialAccount = {
    user: { id: "fixture", email: "fixture@example.test", verified: true },
    application: { state: "ACTIVATION_PENDING", selectedPlan: "START" },
    memberships: [],
    selectedMembershipId: null,
  };
  const view = render(<OnboardingInvitation account={account} />);
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  view.rerender(
    <OnboardingInvitation
      account={{
        ...account,
        manualActivation: {
          kind: "MANUAL_PILOT",
          state: "ACTIVE",
          plan: "START",
          expiresAt: stamp,
          accessAuthorized: true,
          onboardingAuthorized: true,
        },
      }}
    />,
  );
  expect(
    screen.getByRole("link", { name: /Configurar mi negocio/ }),
  ).toHaveAttribute("href", "/onboarding");
});
