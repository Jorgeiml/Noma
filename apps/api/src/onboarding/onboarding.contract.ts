// Shared presentation vocabulary. Authorization is always resolved by NestJS.
export const BUSINESS_COUNTRIES = [
  ["EC", "Ecuador"],
  ["CO", "Colombia"],
  ["PE", "Perú"],
  ["CL", "Chile"],
  ["AR", "Argentina"],
  ["BO", "Bolivia"],
  ["BR", "Brasil"],
  ["UY", "Uruguay"],
  ["PY", "Paraguay"],
  ["VE", "Venezuela"],
  ["MX", "México"],
  ["PA", "Panamá"],
  ["CR", "Costa Rica"],
  ["US", "Estados Unidos"],
  ["ES", "España"],
] as const;
export const ONBOARDING_STEPS = [
  "Tu sector",
  "Tu negocio",
  "Tu espacio y horarios",
  "Tus servicios",
  "Tu equipo",
  "Revisión",
] as const;
export const BEAUTY_SUBTYPES = {
  BARBERSHOP: "Barbería",
  HAIR_SALON: "Peluquería",
  SPA: "Spa",
  AESTHETICS: "Centro de estética no médica",
  NAILS: "Uñas y pestañas",
  MIXED: "Centro de belleza mixto",
} as const;
export const ONBOARDING_SECTORS = [
  {
    id: "BEAUTY",
    name: "Belleza y bienestar",
    description: "Barberías, peluquerías, spas y centros de belleza.",
    symbol: "✳",
    available: true,
  },
  {
    id: "DENTAL",
    name: "Odontología",
    description: "Consultorios y atención odontológica.",
    symbol: "◇",
    available: false,
  },
  {
    id: "FITNESS",
    name: "Fitness",
    description: "Entrenamiento y actividad física.",
    symbol: "↗",
    available: false,
  },
  {
    id: "AUTOMOTIVE",
    name: "Servicios automotrices",
    description: "Talleres y cuidado de vehículos.",
    symbol: "⊙",
    available: false,
  },
] as const;
