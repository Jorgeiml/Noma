import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { FreeAccess } from "./FreeAccess";
import { controlApi, type Context } from "./control-api";
import {
  COMMERCIAL_PLANS,
  PLAN_TERMS,
} from "../../../api/src/commercial/plan.contract";
vi.mock("./control-api", async (original) => ({
  ...(await original<typeof import("./control-api")>()),
  controlApi: { write: vi.fn() },
}));
const userId = "9baa7539-94ef-47b7-9101-ff61cd79f3da";
const context: Context = {
  user: { id: "operator", name: "Operador" },
  role: "PLATFORM_OWNER",
  permissions: ["subscriptions.manage"],
  sensitiveOperationsAvailable: true,
  mfaEvidenceAvailable: false,
  plans: COMMERCIAL_PLANS,
  planTerms: PLAN_TERMS,
};
const props = {
  context,
  userId,
  emails: [{ email: "recipient@example.test", verified: true }],
  memberships: [],
  onDone: vi.fn(),
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(controlApi.write).mockResolvedValue({
    auditId: "fixture",
    replayed: false,
  });
});
it("oculta la concesión a soporte y bloquea identidades no verificadas", () => {
  const { rerender } = render(
    <FreeAccess
      {...props}
      context={{ ...context, role: "SUPPORT_AGENT", permissions: [] }}
    />,
  );
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  rerender(
    <FreeAccess
      {...props}
      emails={[{ email: "unverified@example.test", verified: false }]}
    />,
  );
  expect(
    screen.getByRole("button", { name: "Conceder acceso gratuito" }),
  ).toBeDisabled();
});
it("no permite autoactivación ni operaciones sensibles sin MFA fuera de la excepción local", () => {
  const { rerender } = render(
    <FreeAccess {...props} userId={context.user.id} />,
  );
  expect(screen.getByRole("button")).toBeDisabled();
  rerender(
    <FreeAccess
      {...props}
      context={{ ...context, sensitiveOperationsAvailable: false }}
    />,
  );
  expect(screen.getByRole("button")).toBeDisabled();
});
it("confirma cuenta y plan explícitamente sin pagar ni aprobar otra solicitud", async () => {
  render(<FreeAccess {...props} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Conceder acceso gratuito" }),
  );
  const dialog = within(
    screen.getByRole("dialog", { name: "Conceder acceso gratuito" }),
  );
  expect(dialog.getByText("recipient@example.test")).toBeInTheDocument();
  fireEvent.change(dialog.getByLabelText("Modalidad"), {
    target: { value: "COURTESY" },
  });
  fireEvent.change(dialog.getByLabelText("Motivo administrativo"), {
    target: { value: "Cortesía de validación autorizada" },
  });
  fireEvent.change(
    dialog.getByLabelText("Confirma el identificador de la cuenta"),
    { target: { value: userId } },
  );
  fireEvent.click(dialog.getByRole("checkbox"));
  fireEvent.click(
    dialog.getByRole("button", { name: "Conceder acceso gratuito" }),
  );
  await waitFor(() => expect(controlApi.write).toHaveBeenCalledTimes(1));
  expect(controlApi.write).toHaveBeenCalledWith(
    `/users/${userId}/free-access`,
    "POST",
    expect.objectContaining({
      confirmId: userId,
      plan: "GROW",
      mode: "COURTESY",
      membershipId: null,
    }),
  );
  expect(vi.mocked(controlApi.write).mock.calls[0]![2]).not.toHaveProperty(
    "email",
  );
  expect(vi.mocked(controlApi.write).mock.calls[0]![2]).not.toHaveProperty(
    "payment",
  );
});
it("mantiene la clave de idempotencia si la respuesta es incierta", async () => {
  vi.mocked(controlApi.write).mockRejectedValueOnce(
    new Error("Respuesta incierta"),
  );
  render(<FreeAccess {...props} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Conceder acceso gratuito" }),
  );
  const d = within(screen.getByRole("dialog"));
  fireEvent.change(d.getByLabelText("Motivo administrativo"), {
    target: { value: "Reintento de cortesía autorizada" },
  });
  fireEvent.change(d.getByLabelText("Confirma el identificador de la cuenta"), {
    target: { value: userId },
  });
  fireEvent.click(d.getByRole("checkbox"));
  fireEvent.click(d.getByRole("button", { name: "Conceder acceso gratuito" }));
  await screen.findByRole("alert");
  fireEvent.click(d.getByRole("button", { name: "Conceder acceso gratuito" }));
  await waitFor(() => expect(controlApi.write).toHaveBeenCalledTimes(2));
  expect(vi.mocked(controlApi.write).mock.calls[0]![2]).toEqual(
    vi.mocked(controlApi.write).mock.calls[1]![2],
  );
});
