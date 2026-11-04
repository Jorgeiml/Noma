import { request } from "../api/platform";
import type { ServiceOffering } from "../api/offering";
import type { Branch, Professional, Resource, Schedule } from "../api/staff";
export type BusinessProfile = {
  id?: string;
  commercialName: string;
  countryCode: string | null;
  city: string | null;
  address: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  timeZone: string;
  description: string | null;
  beautySubtype: string | null;
  currency?: string;
  version?: number;
};
export type OnboardingSnapshot = {
  status: string;
  message: string | null;
  progress: {
    id: string;
    step: number;
    version: number;
    createdBusiness?: boolean;
    selectedVertical?: string | null;
    completedAt: string | null;
    updatedAt?: string;
  } | null;
  configuration: {
    business: BusinessProfile & {
      id: string;
      currency: string;
      version: number;
    };
    branches: Branch[];
    services: ServiceOffering[];
    professionals: Professional[];
    resources: Resource[];
    schedules: Schedule[];
  } | null;
  entitlement: {
    kind: "MANUAL_PILOT" | "VERIFIED_SUBSCRIPTION";
    plan: string;
    expiresAt: string | null;
    membershipId: string | null;
    establishmentId: string | null;
    limits: { branches: number; professionals: number; users: number };
  } | null;
  memberships: Array<{
    id: string;
    establishment: {
      id: string;
      commercialName: string;
      vertical: string | null;
      status: string;
    };
  }>;
  missing: Array<{ step: number; message: string }>;
};
export type SaveResult = {
  id: string | null;
  replayed: boolean;
  snapshot: OnboardingSnapshot;
};
export const onboardingApi = {
  load: () => request<OnboardingSnapshot>("/onboarding"),
  save: (path: string, body: unknown) =>
    request<SaveResult>(`/onboarding/${path}`, {
      method: [
        "start",
        "complete",
        "branches",
        "services",
        "professionals",
        "resources",
        "schedules",
      ].includes(path)
        ? "POST"
        : "PUT",
      body: JSON.stringify(body),
    }),
};
