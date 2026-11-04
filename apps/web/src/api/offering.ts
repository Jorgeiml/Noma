import { request } from "./platform";
export type PriceMode = "FIXED" | "FROM" | "RANGE" | "ASSESSMENT_REQUIRED";
export interface OfferingDraft {
  bookingMode?: "PROFESSIONAL" | "RESOURCE_ONLY";
  name: string;
  category: string | null;
  description: string;
  durationMinutes: number;
  priceMode: PriceMode;
  priceMin: string | null;
  priceMax: string | null;
  hasPriorAssessment: boolean;
  assessmentDescription: string | null;
}
export interface ServiceOffering extends OfferingDraft {
  id: string;
  establishmentId: string;
  currency: string;
  active: boolean;
  version: number;
}
export const offeringApi = {
  remove: (id: string, version: number) =>
    request<{ id: string }>(`/offering/services/${encodeURIComponent(id)}`, {
      method: "DELETE",
      body: JSON.stringify({ version }),
    }),
  list: () => request<ServiceOffering[]>("/offering/services"),
  read: (id: string) =>
    request<ServiceOffering>(`/offering/services/${encodeURIComponent(id)}`),
  create: (draft: OfferingDraft, currency: string) =>
    request<ServiceOffering>("/offering/services", {
      method: "POST",
      headers: { "X-Catalog-Currency": currency },
      body: JSON.stringify(draft),
    }),
  update: (id: string, draft: OfferingDraft, version: number) =>
    request<ServiceOffering>(`/offering/services/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ ...draft, version }),
    }),
  status: (id: string, active: boolean, version: number) =>
    request<ServiceOffering>(
      `/offering/services/${encodeURIComponent(id)}/status`,
      { method: "PATCH", body: JSON.stringify({ active, version }) },
    ),
};
export const blankOffering = (): OfferingDraft => ({
  name: "",
  category: null,
  description: "",
  durationMinutes: Number.NaN,
  priceMode: "FIXED",
  priceMin: "",
  priceMax: null,
  hasPriorAssessment: false,
  assessmentDescription: null,
});
export function offeringDraft(value: OfferingDraft): OfferingDraft {
  return {
    bookingMode: value.bookingMode,
    name: value.name,
    category: value.category,
    description: value.description,
    durationMinutes: value.durationMinutes,
    priceMode: value.priceMode,
    priceMin: value.priceMin,
    priceMax: value.priceMax,
    hasPriorAssessment: value.hasPriorAssessment,
    assessmentDescription: value.assessmentDescription,
  };
}

// BigInt para la parte entera y texto para la fracción: nunca Number(importe).
export function moneyLabel(amount: string, currency: string): string {
  const [integer, fraction = ""] = amount.split(".");
  const formatter = new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency,
  });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  const decimals = fraction.padEnd(digits, "0").slice(0, digits);
  const showFraction = /[1-9]/.test(decimals);
  return formatter
    .formatToParts(BigInt(integer!))
    .map((part) => {
      if (part.type === "fraction") return showFraction ? decimals : "";
      if (part.type === "decimal") return showFraction ? part.value : "";
      return part.value;
    })
    .join("");
}
export function priceLabel(
  value: Pick<
    ServiceOffering,
    "priceMode" | "priceMin" | "priceMax" | "currency"
  >,
): string {
  if (value.priceMode === "ASSESSMENT_REQUIRED")
    return "Precio sujeto a valoración";
  if (value.priceMin === null) return "Precio no disponible";
  const minimum = moneyLabel(value.priceMin, value.currency);
  if (value.priceMode === "FROM") return `Desde ${minimum}`;
  if (value.priceMode === "RANGE")
    return value.priceMax === null
      ? "Precio no disponible"
      : `${minimum}–${moneyLabel(value.priceMax, value.currency)}`;
  return minimum;
}
