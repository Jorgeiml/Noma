import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import ControlPanel from "./ControlPanel";
import { ControlAction } from "./ControlAction";
import {
  controlApi,
  ControlError,
  type Application,
  type Context,
} from "./control-api";
import {
  COMMERCIAL_PLANS,
  PLAN_TERMS,
} from "../../../api/src/commercial/plan.contract";
vi.mock("./control-api", async (original) => ({
  ...(await original<typeof import("./control-api")>()),
  controlApi: {
    context: vi.fn(),
    dashboard: vi.fn(),
    list: vi.fn(),
    application: vi.fn(),
    business: vi.fn(),
    write: vi.fn(),
  },
}));
const id = "b5560632-af48-4d0a-8fb6-d56a8279d60c";
const context: Context = {
  user: { id: "fixture-operator", name: "Operador de prueba" },
  role: "PLATFORM_OWNER",
  permissions: [
    "dashboard.read",
    "applications.read",
    "applications.decide",
    "subscriptions.read",
    "subscriptions.manage",
    "businesses.read",
    "users.read",
    "roles.manage",
    "audit.read",
  ],
  sensitiveOperationsAvailable: true,
  mfaEvidenceAvailable: false,
  plans: COMMERCIAL_PLANS,
  planTerms: PLAN_TERMS,
};
const application: Application = {
  id,
  state: "ACTIVATION_PENDING",
  selectedPlan: "GROW",
  createdAt: new Date().toISOString(),
  user: {
    id: "fixture-applicant",
    name: "Solicitud de prueba",
    verified: true,
  },
  platformReview: null,
  manualActivation: null,
};
beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/control/solicitudes");
  vi.mocked(controlApi.context).mockResolvedValue(context);
  vi.mocked(controlApi.list).mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    size: 25,
  });
  vi.mocked(controlApi.write).mockResolvedValue({
    auditId: "fixture-audit",
    replayed: false,
  });
});
it("muestra loading antes de resolver permisos sin solicitar datos internos", () => {
  vi.mocked(controlApi.context).mockReturnValue(new Promise(() => {}));
  render(<ControlPanel />);
  expect(screen.getByRole("status")).toHaveTextContent("Comprobando acceso");
  expect(controlApi.list).not.toHaveBeenCalled();
});
it("deniega la ruta a un usuario sin permiso y no carga registros", async () => {
  vi.mocked(controlApi.context).mockRejectedValue(
    new ControlError(403, "Acceso no autorizado"),
  );
  render(<ControlPanel />);
  expect(
    await screen.findByRole("heading", {
      name: "Esta cuenta no tiene acceso interno.",
    }),
  ).toBeInTheDocument();
  expect(controlApi.list).not.toHaveBeenCalled();
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
});
it("no presenta enlaces ni consulta listas fuera del rol de soporte", async () => {
  window.history.replaceState(null, "", "/control/usuarios");
  vi.mocked(controlApi.context).mockResolvedValue({
    ...context,
    role: "SUPPORT_AGENT",
    permissions: ["dashboard.read", "applications.read", "businesses.read"],
  });
  render(<ControlPanel />);
  expect(
    await screen.findByText("Esta consulta no está habilitada para tu permiso"),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Usuarios y permisos" }),
  ).not.toBeInTheDocument();
  expect(controlApi.list).not.toHaveBeenCalled();
});
it("ofrece navegación etiquetada, estado vacío y búsqueda paginada en servidor", async () => {
  render(<ControlPanel />);
  expect(
    await screen.findByText("No hay registros para esta consulta"),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("navigation", { name: "Navegación de Noma Control" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Solicitudes" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  fireEvent.change(screen.getByLabelText("Buscar por inicio del nombre o ID"), {
    target: { value: "Noma" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
  await waitFor(() =>
    expect(controlApi.list).toHaveBeenLastCalledWith(
      "solicitudes",
      expect.any(URLSearchParams),
    ),
  );
  const query = vi.mocked(controlApi.list).mock.lastCall![1];
  expect(query.get("q")).toBe("Noma");
  expect(query.get("size")).toBe("25");
  expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
});
it("presenta errores reales sin sustituirlos por datos de ejemplo", async () => {
  vi.mocked(controlApi.list).mockRejectedValue(
    new ControlError(503, "Consulta temporalmente no disponible"),
  );
  render(<ControlPanel />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Consulta temporalmente no disponible",
  );
  expect(screen.queryByText("Solicitud de prueba")).not.toBeInTheDocument();
});
it("exige confirmación del recurso y preserva el ID de reintento tras un fallo", async () => {
  const done = vi.fn();
  vi.mocked(controlApi.write).mockRejectedValueOnce(
    new ControlError(0, "No se pudo confirmar"),
  );
  render(
    <ControlAction context={context} application={application} onDone={done} />,
  );
  fireEvent.change(screen.getByLabelText(/Operación sobre/), {
    target: { value: "APPROVED" },
  });
  fireEvent.change(screen.getByLabelText("Motivo administrativo"), {
    target: { value: "Revisión administrativa de prueba" },
  });
  fireEvent.change(
    screen.getByLabelText("Escribe el ID del registro para confirmar"),
    { target: { value: "otro-id" } },
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Confirmar: aprobar solicitud" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("no coincide");
  expect(controlApi.write).not.toHaveBeenCalled();
  fireEvent.change(
    screen.getByLabelText("Escribe el ID del registro para confirmar"),
    { target: { value: id } },
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Confirmar: aprobar solicitud" }),
  );
  await waitFor(() => expect(controlApi.write).toHaveBeenCalledTimes(1));
  await screen.findByText("No se pudo confirmar");
  const first = vi.mocked(controlApi.write).mock.calls[0]![2];
  fireEvent.click(
    screen.getByRole("button", { name: "Confirmar: aprobar solicitud" }),
  );
  await waitFor(() => expect(done).toHaveBeenCalledOnce());
  expect(vi.mocked(controlApi.write).mock.calls[1]![2]).toEqual(first);
});
it("bloquea los formularios sensibles cuando falta MFA verificable", () => {
  render(
    <ControlAction
      context={{ ...context, sensitiveOperationsAvailable: false }}
      application={application}
      onDone={vi.fn()}
    />,
  );
  expect(screen.getByText(/requieren MFA verificable/)).toBeInTheDocument();
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
});
it("un piloto requiere vencimiento y separa el alta futura de un negocio existente", () => {
  render(
    <ControlAction
      context={context}
      application={{
        ...application,
        platformReview: {
          decision: "APPROVED",
          version: 1,
          reason: "Prueba autorizada",
          decidedAt: new Date().toISOString(),
        },
        memberships: [],
      }}
      onDone={vi.fn()}
    />,
  );
  fireEvent.change(screen.getByLabelText(/Operación sobre/), {
    target: { value: "ACTIVATE" },
  });
  expect(
    screen.getByLabelText("Vencimiento del piloto · hora local"),
  ).toBeRequired();
  expect(
    screen.getByRole("option", { name: /Sin negocio asociado/ }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/el onboarding aún no está implementado/),
  ).toBeInTheDocument();
});
it("no permite que el propietario modifique su propio rol desde React", () => {
  render(
    <ControlAction
      context={context}
      user={{
        id: context.user.id,
        displayName: "Yo",
        createdAt: new Date().toISOString(),
        externalIdentities: [],
        memberships: [],
        platformAccess: { role: "PLATFORM_OWNER", version: 1, revokedAt: null },
      }}
      onDone={vi.fn()}
    />,
  );
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
});
