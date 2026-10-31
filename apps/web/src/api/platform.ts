import type { SectorConfiguration } from "../../../api/src/sector/sector.contract";
export type {
  SectorConfiguration,
  SectorTerminology,
} from "../../../api/src/sector/sector.contract";
export interface OwnerContext {
  identityMode?: "commercial" | "local";
  userId: string;
  displayName: string;
  establishmentId: string;
  role: "OWNER";
}
export interface Establishment {
  id: string;
  commercialName: string;
  status: "ACTIVE" | "SUSPENDED";
  timeZone: string;
  currency: string;
  businessPhone: string | null;
  websiteUrl: string | null;
  logoDataUrl?: string | null;
  version: number;
  updatedAt: string;
  sectorConfiguration: SectorConfiguration;
}
export type EstablishmentDraft = Pick<
  Establishment,
  | "commercialName"
  | "timeZone"
  | "currency"
  | "businessPhone"
  | "websiteUrl"
  | "version"
>;
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(
    /\/+$/,
    "",
  );
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...init,
      credentials: "same-origin",
      signal: AbortSignal.timeout(5000),
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(
      0,
      "No pudimos conectar. Tu edición se conserva; comprueba la conexión e intenta otra vez.",
    );
  }
  if (!response.ok) {
    let message =
      "Servicio temporalmente no disponible. Tu edición se conserva.";
    if (response.status < 500) {
      const body = (await response.json().catch(() => null)) as {
        message?: unknown;
      } | null;
      if (typeof body?.message === "string") message = body.message;
    }
    throw new ApiError(response.status, message);
  }
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}
export const platformApi = {
  logo: (id: string, logoDataUrl: string | null, version: number) =>
    request<Establishment>(
      `/platform/establishments/${encodeURIComponent(id)}/logo`,
      { method: "PUT", body: JSON.stringify({ logoDataUrl, version }) },
    ),
  context: () => request<OwnerContext>("/platform/context"),
  read: (id: string) =>
    request<Establishment>(
      `/platform/establishments/${encodeURIComponent(id)}`,
    ),
  update: (id: string, draft: EstablishmentDraft) =>
    request<Establishment>(
      `/platform/establishments/${encodeURIComponent(id)}`,
      { method: "PATCH", body: JSON.stringify(draft) },
    ),
  login: (code: string) =>
    request<void>("/local-access/session", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  logout: () => request<void>("/local-access/session", { method: "DELETE" }),
};
export function draftOf(value: Establishment): EstablishmentDraft {
  return {
    commercialName: value.commercialName,
    timeZone: value.timeZone,
    currency: value.currency,
    businessPhone: value.businessPhone,
    websiteUrl: value.websiteUrl,
    version: value.version,
  };
}
