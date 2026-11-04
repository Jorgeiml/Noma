import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { CommercialAuthorizationNotice } from "./CommercialAuthorizationNotice";
import type { CommercialAccount } from "./api/commercial";
const account: CommercialAccount = {
  user: { id: "fixture-user", email: "fixture@example.test", verified: true },
  application: {
    state: "ACTIVATION_PENDING",
    selectedPlan: "START",
    review: "APPROVED",
  },
  memberships: [],
  selectedMembershipId: null,
};
it("distingue aprobación de acceso y pago", () => {
  render(<CommercialAuthorizationNotice account={account} />);
  expect(screen.getByRole("status")).toHaveTextContent(
    "La aprobación no registra un pago ni crea un negocio",
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "El equipo de Noma todavía debe habilitar tu acceso",
  );
});
it("expresa un rechazo sin fingir eliminación de la identidad", () => {
  render(
    <CommercialAuthorizationNotice
      account={{
        ...account,
        application: { ...account.application!, review: "REJECTED" },
      }}
    />,
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "Tu solicitud no fue aprobada",
  );
});
it("un piloto sin negocio permite prepararlo sin creación automática ni pago", () => {
  render(
    <CommercialAuthorizationNotice
      account={{
        ...account,
        manualActivation: {
          kind: "MANUAL_PILOT",
          state: "ACTIVE",
          plan: "START",
          expiresAt: "2026-12-01T00:00:00Z",
          accessAuthorized: true,
          onboardingAuthorized: true,
        },
      }}
    />,
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "Puedes preparar tu negocio paso a paso",
  );
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});
it.each(["EXPIRED", "SUSPENDED", "REVOKED", "SCHEDULED"] as const)(
  "informa que un piloto %s no concede acceso",
  (state) => {
    render(
      <CommercialAuthorizationNotice
        account={{
          ...account,
          manualActivation: {
            kind: "MANUAL_PILOT",
            state,
            plan: "START",
            expiresAt: "2026-12-01T00:00:00Z",
            accessAuthorized: false,
            onboardingAuthorized: false,
          },
        }}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Tus datos se conservan",
    );
    expect(screen.getByRole("status")).not.toHaveTextContent(
      "Piloto manual autorizado",
    );
  },
);
it.each([
  ["TEST", "Prueba gratuita"],
  ["PILOT", "Piloto gratuito"],
  ["COURTESY", "Cortesía gratuita"],
] as const)("muestra la modalidad %s concedida", (mode, label) => {
  render(
    <CommercialAuthorizationNotice
      account={{
        ...account,
        manualActivation: {
          kind: "MANUAL_PILOT",
          state: "ACTIVE",
          mode,
          plan: "GROW",
          expiresAt: "2026-12-01T00:00:00Z",
          accessAuthorized: true,
          onboardingAuthorized: true,
        },
      }}
    />,
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    `${label} · vigente hasta`,
  );
});
