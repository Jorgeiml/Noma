import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import CommercialAccess from "./CommercialAccess";
import PrivateEntry from "./PrivateEntry";
import { commercialApi, type CommercialAccount } from "./api/commercial";
import { ApiError } from "./api/platform";
import { replacePage } from "./navigation";
vi.mock("./api/commercial", () => ({
  commercialApi: {
    configuration: vi.fn(),
    account: vi.fn(),
    start: vi.fn(),
    resend: vi.fn(),
    selectPlan: vi.fn(),
    requestActivation: vi.fn(),
    selectMembership: vi.fn(),
    logout: vi.fn(),
  },
}));
vi.mock("./navigation", async (original) => ({
  ...(await original<typeof import("./navigation")>()),
  replacePage: vi.fn(),
}));
const account = (
  state:
    | "IDENTITY_VERIFIED"
    | "PLAN_SELECTED"
    | "ACTIVATION_PENDING" = "IDENTITY_VERIFIED",
): CommercialAccount => ({
  user: { id: "synthetic-user", email: "fixture@example.test", verified: true },
  application: {
    state,
    selectedPlan: state === "IDENTITY_VERIFIED" ? null : "GROW",
  },
  memberships: [],
  selectedMembershipId: null,
});
beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/login");
  vi.mocked(commercialApi.configuration).mockResolvedValue({
    enabled: true,
    localEnabled: false,
  });
  vi.mocked(commercialApi.account).mockResolvedValue(account());
  vi.mocked(commercialApi.start).mockResolvedValue({
    authorizationUrl: "https://idp.example.test/authorize",
  });
  vi.mocked(commercialApi.selectPlan).mockResolvedValue();
  vi.mocked(commercialApi.requestActivation).mockResolvedValue();
  vi.mocked(commercialApi.selectMembership).mockResolvedValue();
});
it("no finge registro si falta el proveedor y no expone el mecanismo local fuera de desarrollo", async () => {
  vi.mocked(commercialApi.configuration).mockResolvedValue({
    enabled: false,
    localEnabled: false,
  });
  render(<CommercialAccess page="signup" />);
  expect(
    await screen.findByText("El acceso comercial aún no está habilitado."),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Continuar con el registro/ }),
  ).toBeDisabled();
  expect(screen.queryByText(/Acceso local con código/)).not.toBeInTheDocument();
  expect(commercialApi.start).not.toHaveBeenCalled();
});
it("registra con proveedor, sin contraseña propia ni retorno externo", async () => {
  window.history.replaceState(
    null,
    "",
    "/registro?next=https://attacker.example.test",
  );
  render(<CommercialAccess page="signup" />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: /Continuar con el registro/ }),
    ).toBeEnabled(),
  );
  fireEvent.change(screen.getByLabelText("Correo electrónico"), {
    target: { value: "fixture@example.test" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: /Continuar con el registro/ }),
  );
  await waitFor(() =>
    expect(commercialApi.start).toHaveBeenCalledWith(
      "signup",
      "fixture@example.test",
      "/app/establecimiento",
    ),
  );
  expect(replacePage).toHaveBeenCalledWith(
    "https://idp.example.test/authorize",
  );
  expect(screen.queryByLabelText(/contraseña/i)).not.toBeInTheDocument();
});
it("recuperación delegada no anuncia un correo enviado ni consulta si la cuenta existe", async () => {
  render(<CommercialAccess page="recover" />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: /Continuar con el proveedor/ }),
    ).toBeEnabled(),
  );
  fireEvent.change(screen.getByLabelText("Correo electrónico"), {
    target: { value: "fixture@example.test" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: /Continuar con el proveedor/ }),
  );
  await waitFor(() =>
    expect(commercialApi.start).toHaveBeenCalledWith(
      "recover",
      "fixture@example.test",
      "/app/establecimiento",
    ),
  );
  expect(screen.queryByText(/correo enviado/i)).not.toBeInTheDocument();
});
it("reenvía solo para la identidad autenticada y pide validación fresca al verificar", async () => {
  vi.mocked(commercialApi.account).mockResolvedValue({
    ...account(),
    user: { ...account().user, verified: false },
  });
  vi.mocked(commercialApi.resend).mockResolvedValue({
    message: "Solicitud de verificación recibida por el proveedor.",
  });
  render(<CommercialAccess page="verify" />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Reenviar verificación" }),
  );
  expect(
    await screen.findByText(
      "Solicitud de verificación recibida por el proveedor.",
    ),
  ).toBeInTheDocument();
  expect(commercialApi.resend).toHaveBeenCalledWith();
  fireEvent.click(
    screen.getByRole("button", { name: "Ya verifiqué mi correo" }),
  );
  await waitFor(() =>
    expect(commercialApi.start).toHaveBeenCalledWith(
      "login",
      undefined,
      "/app/establecimiento",
    ),
  );
});
it("separa guardar preferencia de solicitar activación y no crea un negocio", async () => {
  render(<CommercialAccess page="activation" />);
  await screen.findByRole("button", { name: "Guardar preferencia" });
  vi.mocked(commercialApi.account).mockResolvedValue(account("PLAN_SELECTED"));
  fireEvent.click(screen.getByRole("button", { name: "Guardar preferencia" }));
  const activation = await screen.findByRole("button", {
    name: "Registrar solicitud de activación",
  });
  expect(commercialApi.selectPlan).toHaveBeenCalledWith("GROW");
  expect(commercialApi.requestActivation).not.toHaveBeenCalled();
  vi.mocked(commercialApi.account).mockResolvedValue(
    account("ACTIVATION_PENDING"),
  );
  fireEvent.click(activation);
  expect(
    await screen.findByText(
      /Solicitud registrada. La activación sigue pendiente/,
    ),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Entrar" }),
  ).not.toBeInTheDocument();
});
it("exige selección explícita de membresía y bloquea las suspendidas", async () => {
  vi.mocked(commercialApi.account).mockResolvedValue({
    ...account(),
    memberships: [
      {
        id: "member-A",
        name: "Negocio sintético A",
        establishmentStatus: "ACTIVE",
        subscriptionState: "ACTIVE",
      },
      {
        id: "member-B",
        name: "Negocio sintético B",
        establishmentStatus: "ACTIVE",
        subscriptionState: "SUSPENDED",
      },
    ],
  });
  render(<CommercialAccess page="activation" />);
  await screen.findByText("Negocio sintético A");
  expect(commercialApi.selectMembership).not.toHaveBeenCalled();
  const buttons = screen.getAllByRole("button", { name: "Entrar" });
  expect(buttons[1]).toBeDisabled();
  fireEvent.click(buttons[0]!);
  await waitFor(() =>
    expect(commercialApi.selectMembership).toHaveBeenCalledWith("member-A"),
  );
  expect(replacePage).toHaveBeenCalledWith("/app/establecimiento");
});
it("expone sesión vencida sin mostrar datos del negocio", async () => {
  vi.mocked(commercialApi.account).mockRejectedValue(
    new ApiError(401, "Sesión vencida"),
  );
  render(<CommercialAccess page="activation" />);
  expect(
    await screen.findByText("Tu sesión venció o no está autorizada."),
  ).toBeInTheDocument();
  expect(screen.queryByText("fixture@example.test")).not.toBeInTheDocument();
});
it("cierra sesión incluso si el proveedor no devuelve una URL de logout", async () => {
  vi.mocked(commercialApi.logout).mockResolvedValue({ logoutUrl: null });
  render(<CommercialAccess page="activation" />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Cerrar sesión de Noma" }),
  );
  await waitFor(() =>
    expect(replacePage).toHaveBeenCalledWith("/login?loggedOut=1"),
  );
});
it("oculta el formulario local cuando el servidor no autoriza ese entorno", async () => {
  render(<PrivateEntry mode="login" />);
  expect(await screen.findByText("Acceso no disponible.")).toBeInTheDocument();
  expect(
    screen.queryByLabelText("Código local de desarrollo"),
  ).not.toBeInTheDocument();
});
