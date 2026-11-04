import { request } from "./platform";
import type { PlanId } from "../../../api/src/commercial/plan.contract";
export type IdentityPage =
  "login" | "signup" | "verify" | "recover" | "activation" | "denied";
export interface CommercialAccount {
  manualActivation?: {
    source?: "MANUAL";
    mode?: "TEST" | "PILOT" | "COURTESY";
    startsAt?: string;
    kind: "MANUAL_PILOT";
    state: "ACTIVE" | "EXPIRED" | "SUSPENDED" | "REVOKED" | "SCHEDULED";
    plan: PlanId;
    expiresAt: string;
    accessAuthorized: boolean;
    onboardingAuthorized: boolean;
  } | null;
  user: { id: string; email: string; verified: boolean };
  application: {
    state:
      | "REGISTRATION_STARTED"
      | "IDENTITY_VERIFIED"
      | "PLAN_SELECTED"
      | "ACTIVATION_PENDING";
    selectedPlan: PlanId | null;
    review?: "APPROVED" | "REJECTED" | null;
  } | null;
  memberships: {
    id: string;
    name: string;
    establishmentStatus: string;
    subscriptionState:
      "ACTIVATION_PENDING" | "ACTIVE" | "SUSPENDED" | "CANCELLED";
    manualActivation?: CommercialAccount["manualActivation"];
  }[];
  selectedMembershipId: string | null;
}
const post = <T = void>(path: string, body: object = {}) =>
  request<T>(`/auth/${path}`, { method: "POST", body: JSON.stringify(body) });
export const commercialApi = {
  configuration: () =>
    request<{ enabled: boolean; localEnabled: boolean }>("/auth/configuration"),
  account: () => request<CommercialAccount>("/auth/session"),
  start: (
    mode: "login" | "signup" | "recover",
    email: string | undefined,
    next: string,
  ) =>
    post<{ authorizationUrl: string }>("start", {
      mode,
      ...(email ? { email } : {}),
      next,
    }),
  resend: () => post<{ message: string }>("verification/resend"),
  selectPlan: (plan: PlanId) => post("plan", { plan }),
  requestActivation: () => post("activation-request"),
  selectMembership: (membershipId: string) =>
    post("membership", { membershipId }),
  logout: () => post<{ logoutUrl: string | null }>("logout"),
};
