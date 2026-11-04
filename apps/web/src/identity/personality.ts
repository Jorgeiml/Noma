import type { CSSProperties } from "react";
import type { SectorConfiguration } from "../api/platform";
export type Vertical = NonNullable<SectorConfiguration["vertical"]>;
type Personality = {
  label: string;
  accent: string;
  hover: string;
  surface: string;
  canvas: string;
  ink: string;
  motif: string;
  scene: "mirror" | "brush" | "weight" | "tool" | null;
  copy: string;
  vocabulary: string;
  empty: string;
  motion: number;
};
const neutral: Personality = {
  label: "Noma",
  accent: "#953a28",
  hover: "#762c20",
  surface: "#f2ede6",
  canvas: "#f8f7f3",
  ink: "#272823",
  motif: "M5 12h14M12 5v14",
  scene: null,
  copy: "Un espacio para organizar tu negocio.",
  vocabulary: "Equipo · Servicios · Agenda",
  empty: "Tu próxima cita empieza aquí.",
  motion: 450,
};
export const personalities = {
  BEAUTY: {
    label: "Beauty",
    accent: "#963e32",
    hover: "#763026",
    surface: "#f4e6e0",
    canvas: "#fbf7f2",
    ink: "#302622",
    motif: "M12 2v20M2 12h20M5 5l14 14M19 5 5 19",
    scene: "mirror",
    copy: "El tiempo y el espacio para cuidar cada detalle.",
    vocabulary: "Profesional · Tratamiento · Cabina · Cita",
    empty: "Un espacio listo para tu próxima cita.",
    motion: 650,
  },
  DENTAL: {
    label: "Dental",
    accent: "#235e52",
    hover: "#19483f",
    surface: "#dfefe8",
    canvas: "#f5faf7",
    ink: "#21332e",
    motif: "M12 4v16M4 12h16M7 7h10v10H7z",
    scene: "brush",
    copy: "Una consulta organizada transmite calma desde el primer contacto.",
    vocabulary: "Odontólogo · Consulta · Consultorio · Paciente",
    empty: "Cada consulta, en su lugar.",
    motion: 520,
  },
  FITNESS: {
    label: "Fitness",
    accent: "#a03b23",
    hover: "#7b2b19",
    surface: "#f7e6cf",
    canvas: "#fcf7ee",
    ink: "#352921",
    motif: "M3 17l5-7 5 4 8-10M15 4h6v6",
    scene: "weight",
    copy: "Un espacio con ritmo propio, de la primera sesión a la última.",
    vocabulary: "Instructor · Entrenamiento · Participante · Cupo",
    empty: "Haz espacio para la próxima sesión.",
    motion: 380,
  },
  AUTOMOTIVE: {
    label: "Automotive",
    accent: "#365a76",
    hover: "#29455c",
    surface: "#e2eaf0",
    canvas: "#f4f7f9",
    ink: "#23303a",
    motif: "M8 3h8l5 5v8l-5 5H8l-5-5V8zM8 12h8",
    scene: "tool",
    copy: "Orden y precisión desde la recepción hasta la entrega.",
    vocabulary: "Técnico · Bahía · Vehículo · Turno",
    empty: "Un turno claro para el próximo trabajo.",
    motion: 430,
  },
} satisfies Record<Vertical, Personality>;
export function personality(vertical?: string | null): Personality {
  const key = vertical?.toUpperCase();
  return key && Object.hasOwn(personalities, key)
    ? personalities[key as Vertical]
    : neutral;
}
export function identityTokens(theme: Personality): CSSProperties {
  return {
    "--identity-accent": theme.accent,
    "--identity-hover": theme.hover,
    "--identity-surface": theme.surface,
    "--identity-canvas": theme.canvas,
    "--identity-ink": theme.ink,
    "--identity-motion": theme.motion + "ms",
  } as CSSProperties;
}
