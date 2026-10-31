import type {
  ControlPage,
  ControlPermission,
  PlatformRoleName,
} from "../../../api/src/control/control.contract";
import type { COMMERCIAL_PLANS } from "../../../api/src/commercial/plan.contract";
export type Context = {
  user: { id: string; name: string };
  role: PlatformRoleName;
  permissions: ControlPermission[];
  sensitiveOperationsAvailable: boolean;
  mfaEvidenceAvailable: boolean;
  plans: typeof COMMERCIAL_PLANS;
  planTerms: { status: string; currency: string; checkoutEnabled: boolean };
};
export type Review = {
  decision: "APPROVED" | "REJECTED";
  version: number;
  reason: string;
  decidedAt: string;
};
export type Pilot = {
  id: string;
  plan: string;
  state: string;
  effectiveState: string;
  expiresAt: string;
  membershipId: string | null;
  version: number;
  reason?: string;
};
export type Membership = {
  id: string;
  role: string;
  status: string;
  establishment: { id: string; commercialName: string; status: string };
};
export type Application = {
  id: string;
  state: string;
  selectedPlan: string | null;
  createdAt: string;
  user: { id: string; name: string; verified: boolean; synthetic?: boolean };
  platformReview: Review | null;
  manualActivation: Pilot | null;
  subscription?: {
    id: string;
    state: string;
    plan: string;
    evidenceSource: string;
  } | null;
  memberships?: Membership[];
  history?: Audit[];
};
export type Business = {
  id: string;
  commercialName: string;
  vertical: string | null;
  status: string;
  createdAt: string;
  memberships: Array<{
    id: string;
    role?: string;
    status?: string;
    user: { id: string; displayName: string };
    manualActivation: Pilot | null;
  }>;
  commercialSubscription: {
    id: string;
    plan: string;
    state: string;
    evidenceSource: string;
  } | null;
  branches?: Array<{
    id: string;
    name: string;
    timeZone: string;
    active: boolean;
  }>;
  _count?: { branches: number };
};
export type User = {
  id: string;
  displayName: string;
  createdAt: string;
  platformAccess: {
    role: PlatformRoleName;
    version: number;
    revokedAt: string | null;
  } | null;
  externalIdentities: Array<{
    id: string;
    issuer: string;
    email: string;
    verifiedAt: string | null;
    synthetic: boolean;
  }>;
  memberships: Membership[];
};
export type Subscription = {
  id: string;
  kind: "manual" | "commercial";
  plan: string;
  state: string;
  effectiveState?: string;
  expiresAt?: string;
  activatedAt?: string;
  createdAt: string;
  applicationId: string;
  evidenceSource?: string;
  establishment?: { id: string; commercialName: string };
  membership?: { establishment: { id: string; commercialName: string } } | null;
  application?: { user: { id: string; displayName: string } };
};
export type Audit = {
  id: string;
  action: string;
  resourceType?: string;
  resourceId?: string | null;
  reason: string;
  outcome: string;
  changes: Record<string, unknown>;
  createdAt: string;
  actor: { id: string; displayName: string };
};
export type Dashboard = {
  pendingReviews: number | null;
  applications: Array<{ state: string; _count: number }>;
  decisions: Array<{ decision: string; _count: number }>;
  businesses: Array<{ vertical: string | null; _count: number }>;
  subscriptions: Array<{ state: string; _count: number }>;
  manual: { active: number; expired: number } | null;
};
export type RecordItem = Application | Business | User | Subscription | Audit;
export type PageData = {
  items: RecordItem[];
  total: number;
  page: number;
  size: number;
};
export class ControlError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const base = (
    import.meta.env.VITE_CONTROL_API_BASE_URL ?? "/api/control"
  ).replace(/\/+$/, "");
  let response: Response;
  try {
    response = await fetch(base + path, {
      method,
      credentials: "include",
      signal: AbortSignal.timeout(10000),
      headers: { "Content-Type": "application/json" },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new ControlError(
      0,
      "No pudimos confirmar la respuesta. Conserva la operación y vuelve a comprobar su resultado antes de cambiar los datos.",
    );
  }
  const data = (await response.json().catch(() => null)) as {
    message?: unknown;
  } | null;
  if (!response.ok)
    throw new ControlError(
      response.status,
      typeof data?.message === "string"
        ? data.message
        : "No pudimos completar la operación de Control.",
    );
  return data as T;
}
const endpoints: Record<Exclude<ControlPage, "inicio">, string> = {
  solicitudes: "applications",
  negocios: "businesses",
  suscripciones: "subscriptions",
  usuarios: "users",
  auditoria: "audit",
};
export const controlApi = {
  context: () => request<Context>("/context"),
  dashboard: () => request<Dashboard>("/dashboard"),
  list: (page: Exclude<ControlPage, "inicio">, query: URLSearchParams) =>
    request<PageData>(`/${endpoints[page]}?${query}`),
  application: (id: string) =>
    request<Application>(`/applications/${encodeURIComponent(id)}`),
  business: (id: string) =>
    request<Business>(`/businesses/${encodeURIComponent(id)}`),
  write: (path: string, method: "POST" | "PUT", body: unknown) =>
    request<{ auditId: string; replayed: boolean }>(path, method, body),
};
export const stateLabel = (value: string | null | undefined) =>
  (
    ({
      REGISTRATION_STARTED: "Registro iniciado",
      IDENTITY_VERIFIED: "Identidad verificada",
      PLAN_SELECTED: "Preferencia de plan elegida",
      ACTIVATION_PENDING: "Activación pendiente",
      PENDING: "Sin revisar",
      APPROVED: "Aprobada",
      REJECTED: "Rechazada",
      ACTIVE: "Activo",
      SUSPENDED: "Suspendido",
      REVOKED: "Finalizado",
      EXPIRED: "Vencido",
      CANCELLED: "Cancelado",
      SUCCESS: "Registrado",
      DENIED: "Acceso denegado",
      LOCAL_SYNTHETIC: "Prueba sintética local",
      VERIFIED_EXTERNAL: "Evidencia externa",
      OWNER: "Propietario del negocio",
    }) as Record<string, string>
  )[value ?? ""] ??
  value ??
  "Sin registrar";
export const dateLabel = (value: string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("es-EC", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Sin fecha registrada";
