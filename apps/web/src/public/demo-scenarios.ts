// Fictional public examples. Never tenant configuration, inventory or availability.
export const DEMO_SCENARIOS = [
  {
    id: "beauty",
    number: "01",
    label: "Belleza y bienestar",
    short: "Beauty",
    service: "Corte de cabello",
    message: "Hola, ¿tienen un espacio para un corte el viernes por la mañana?",
    context:
      "Barberías, salones y centros de bienestar. Cada servicio, profesional y espacio tiene su propio contexto.",
    check: "Servicio, profesional, sucursal y recursos necesarios.",
    status: "Operación inicial en desarrollo",
    terms: "Servicios · profesionales · espacios",
  },
  {
    id: "dental",
    number: "02",
    label: "Odontología",
    short: "Dental",
    service: "Consulta de recepción",
    message: "Quisiera consultar opciones para una cita en el consultorio.",
    context:
      "Recepción y reservas administrativas para consultorios. Sin historias clínicas ni atención médica en este alcance.",
    check: "Tipo de cita administrativa, profesional y consultorio.",
    status: "Planificada",
    terms: "Consultas · profesionales · consultorios",
  },
  {
    id: "fitness",
    number: "03",
    label: "Fitness y entrenamiento",
    short: "Fitness",
    service: "Sesión de entrenamiento",
    message: "Me gustaría conocer opciones para una sesión con un entrenador.",
    context:
      "Entrenadores, sesiones y, más adelante, clases con cupos. La capacidad grupal todavía está planificada.",
    check: "Sesión, entrenador, sala y capacidad cuando esté implementada.",
    status: "Planificada",
    terms: "Sesiones · entrenadores · salas",
  },
  {
    id: "automotive",
    number: "04",
    label: "Servicios automotrices",
    short: "Automotive",
    service: "Servicio automotriz programado",
    message:
      "¿Qué opciones habría para programar un servicio de mantenimiento?",
    context:
      "Servicios programables para talleres. Técnicos, bahías y equipos; sin órdenes de trabajo ni inventarios por ahora.",
    check: "Servicio, técnico y bahía. La gestión de vehículos está pendiente.",
    status: "Planificada",
    terms: "Servicios · técnicos · bahías",
  },
] as const;
export type DemoSector = (typeof DEMO_SCENARIOS)[number]["id"];
export function publicContactUrl(value: string | undefined) {
  try {
    if (!value) return null;
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function sectorWhatsAppUrl(value: string | undefined) {
  const contact = publicContactUrl(value);
  if (!contact) return null;
  const url = new URL(contact);
  if (
    url.hostname !== "wa.me" ||
    url.port ||
    !/^\/[1-9]\d{7,14}\/?$/.test(url.pathname)
  )
    return null;
  const destination = new URL(
    `https://wa.me/${url.pathname.replaceAll("/", "")}`,
  );
  destination.searchParams.set(
    "text",
    "Hola, me interesa Noma. Mi giro de negocio no aparece entre los sectores. ¿Podemos conversar?",
  );
  return destination.href;
}
