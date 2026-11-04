// Public, framework-independent contract. React imports types only; values come from the API.
export const VERTICAL_CODES = [
  "BEAUTY",
  "DENTAL",
  "FITNESS",
  "AUTOMOTIVE",
] as const;
export type VerticalCode = (typeof VERTICAL_CODES)[number];
export type CapabilityState = "IMPLEMENTED" | "PLANNED" | "UNAVAILABLE";
export const CAPABILITY_LABELS = {
  individualServices: "Catálogo de servicios individuales",
  flexiblePricing: "Precios fijos, desde, rango y sujetos a valoración",
  professionals: "Directorio de profesionales",
  branches: "Sucursales",
  resources: "Recursos físicos y requisitos por servicio",
  workSchedules: "Horarios y excepciones",
  assessmentConfiguration: "Configuración de valoración previa en el catálogo",
  individualBookings: "Reservas individuales",
  groupBookings: "Reservas grupales",
  sharedCapacity: "Cupos compartidos para reservas",
  sessionPackages: "Paquetes de sesiones",
  vehicles: "Vehículos",
  scheduledDiagnostics: "Diagnósticos programados",
  assessments: "Gestión de valoraciones realizadas",
  deposits: "Anticipos",
  whatsapp: "Conversaciones WhatsApp",
  invoicing: "Facturación",
} as const;
export type Capability = keyof typeof CAPABILITY_LABELS;
export type Capabilities = Record<Capability, CapabilityState>;
export interface SectorTerminology {
  professionals: string;
  services: string;
  resources: string;
  bookings: string;
  assessment: string;
}
const terms: Record<VerticalCode, SectorTerminology> = {
  BEAUTY: {
    professionals: "Profesionales",
    services: "Servicios",
    resources: "Cabinas, estaciones y sillas",
    bookings: "Citas",
    assessment: "Valoración previa",
  },
  DENTAL: {
    professionals: "Odontólogos y profesionales",
    services: "Consultas y procedimientos",
    resources: "Consultorios y sillones",
    bookings: "Citas",
    assessment: "Evaluación",
  },
  FITNESS: {
    professionals: "Entrenadores e instructores",
    services: "Clases y sesiones",
    resources: "Salas y estaciones",
    bookings: "Reservas",
    assessment: "Evaluación inicial",
  },
  AUTOMOTIVE: {
    professionals: "Técnicos",
    services: "Servicios",
    resources: "Bahías y equipos",
    bookings: "Citas y turnos",
    assessment: "Diagnóstico",
  },
};
const common: Capability[] = [
  "individualServices",
  "flexiblePricing",
  "professionals",
  "branches",
  "resources",
  "workSchedules",
  "assessmentConfiguration",
];
function capabilities(code: VerticalCode): Capabilities {
  const result = Object.fromEntries(
    Object.keys(CAPABILITY_LABELS).map((key) => [key, "UNAVAILABLE"]),
  ) as Capabilities;
  for (const key of common)
    result[key] = code === "BEAUTY" ? "IMPLEMENTED" : "PLANNED";
  for (const key of [
    "individualBookings",
    "assessments",
    "deposits",
    "whatsapp",
    "invoicing",
  ] as const)
    result[key] = "PLANNED";
  if (code === "BEAUTY") result.individualBookings = "IMPLEMENTED";
  if (code === "FITNESS")
    for (const key of [
      "groupBookings",
      "sharedCapacity",
      "sessionPackages",
    ] as const)
      result[key] = "PLANNED";
  if (code === "AUTOMOTIVE")
    for (const key of ["vehicles", "scheduledDiagnostics"] as const)
      result[key] = "PLANNED";
  return result;
}
const labels: Record<VerticalCode, string> = {
  BEAUTY: "Belleza y bienestar",
  DENTAL: "Odontología",
  FITNESS: "Fitness y entrenamiento",
  AUTOMOTIVE: "Servicios automotrices",
};
export const VERTICAL_REGISTRY = VERTICAL_CODES.map((code) => ({
  code,
  label: labels[code],
  status:
    code === "BEAUTY" ? ("IN_DEVELOPMENT" as const) : ("PLANNED" as const),
  commerciallyAvailable: false as const,
  terminology: terms[code],
  capabilities: capabilities(code),
}));
export function isVertical(value: unknown): value is VerticalCode {
  return VERTICAL_CODES.some((code) => code === value);
}
export function sectorConfiguration(vertical: VerticalCode | null) {
  const entry = VERTICAL_REGISTRY.find((item) => item.code === vertical);
  return {
    product: "Appointments" as const,
    vertical,
    status: entry?.status ?? ("UNCLASSIFIED" as const),
    label: entry?.label ?? "Pendiente de clasificación",
    commerciallyAvailable: false as const,
    terminology: entry?.terminology ?? {
      professionals: "Profesionales",
      services: "Servicios",
      resources: "Recursos físicos",
      bookings: "Reservas",
      assessment: "Evaluación previa",
    },
    capabilities:
      entry?.capabilities ??
      (Object.fromEntries(
        Object.keys(CAPABILITY_LABELS).map((key) => [key, "UNAVAILABLE"]),
      ) as Capabilities),
    capabilityLabels: CAPABILITY_LABELS,
    verticals: VERTICAL_REGISTRY,
    developmentOrder: VERTICAL_CODES,
    launchPolicy: "ALL_FOUR_VALIDATED" as const,
  };
}
export type SectorConfiguration = ReturnType<typeof sectorConfiguration>;
