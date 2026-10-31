import { BadRequestException } from "@nestjs/common";

export type Interval = { start: string; end: string };
export type WeekDay = {
  weekday: number;
  closed: boolean;
  intervals: Interval[];
};
export type BranchDto = {
  name: string;
  address: string | null;
  timeZone: string;
  isDefault: boolean;
};
export type ProfessionalDto = {
  displayName: string;
  specialty: string | null;
  branchIds: string[];
  serviceIds: string[];
};
export type ResourceDto = {
  name: string;
  typeDescription: string | null;
  capacity: number;
  branchId: string;
};
export type ScheduleDto = {
  branchId: string;
  professionalId: string | null;
  timeZone: string;
  week: WeekDay[];
  version: number | null;
};
export type ExceptionDto = {
  date: string;
  kind: "ABSENCE" | "CLOSURE" | "MODIFIED";
  intervals: Interval[];
  note: string | null;
};
export type RequirementsDto = {
  resources: { resourceId: string; units: number }[];
  version: number | null;
};
export type StatusDto = { active: boolean; version: number };
export const invalid = (message: string): never => {
  throw new BadRequestException(message);
};
export function object(
  value: unknown,
  allowed: string[],
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return invalid("Formulario inválido");
  const result = value as Record<string, unknown>;
  if (Object.keys(result).some((key) => !allowed.includes(key)))
    invalid("El formulario contiene campos no editables");
  return result;
}
function text(value: unknown, max: number, required = false): string | null {
  if (!required && (value === undefined || value === null || value === ""))
    return null;
  if (typeof value !== "string" || value.trim().length > max || !value.trim())
    return invalid("Texto vacío o demasiado largo");
  return value.trim();
}
export function uuid(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    return invalid("Referencia inválida");
  return value.toLowerCase();
}
function integer(value: unknown, min = 0): number {
  if (
    !Number.isInteger(value) ||
    (value as number) < min ||
    (value as number) > 2147483647
  )
    return invalid("Número entero fuera de rango");
  return value as number;
}
function bool(value: unknown): boolean {
  if (typeof value !== "boolean") return invalid("Estado inválido");
  return value;
}
function zone(value: unknown): string {
  const result = text(value, 64, true)!;
  if (!result.includes("/") && result !== "UTC")
    invalid("Usa una zona horaria IANA");
  try {
    new Intl.DateTimeFormat("es", { timeZone: result }).format();
  } catch {
    invalid("Zona horaria IANA inválida");
  }
  return result;
}
function ids(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 500)
    return invalid("Lista de asociaciones inválida (máximo 500)");
  const result = value.map(uuid);
  if (new Set(result).size !== result.length)
    invalid("No se admiten referencias duplicadas");
  return result;
}
export function versionOf(value: unknown): number {
  return integer(value);
}
export function branchDto(value: unknown): BranchDto {
  const v = object(value, [
    "name",
    "address",
    "timeZone",
    "isDefault",
    "version",
  ]);
  return {
    name: text(v.name, 120, true)!,
    address: text(v.address, 250),
    timeZone: zone(v.timeZone),
    isDefault: bool(v.isDefault),
  };
}
export function professionalDto(value: unknown): ProfessionalDto {
  const v = object(value, [
    "displayName",
    "specialty",
    "branchIds",
    "serviceIds",
    "version",
  ]);
  return {
    displayName: text(v.displayName, 120, true)!,
    specialty: text(v.specialty, 500),
    branchIds: ids(v.branchIds),
    serviceIds: ids(v.serviceIds),
  };
}
export function resourceDto(value: unknown): ResourceDto {
  const v = object(value, [
    "name",
    "typeDescription",
    "capacity",
    "branchId",
    "version",
  ]);
  return {
    name: text(v.name, 120, true)!,
    typeDescription: text(v.typeDescription, 500),
    capacity: integer(v.capacity, 1),
    branchId: uuid(v.branchId),
  };
}
export function statusDto(value: unknown): StatusDto {
  const v = object(value, ["active", "version"]);
  return { active: bool(v.active), version: versionOf(v.version) };
}
export function intervalsDto(value: unknown): Interval[] {
  if (!Array.isArray(value) || value.length > 24)
    return invalid("Admite hasta 24 intervalos por día");
  const result = value
    .map((raw) => {
      const v = object(raw, ["start", "end"]);
      if (
        typeof v.start !== "string" ||
        typeof v.end !== "string" ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(v.start) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(v.end)
      )
        return invalid("Usa horas locales HH:mm entre 00:00 y 23:59");
      if (v.start >= v.end)
        invalid("El inicio debe ser anterior al fin, dentro del mismo día");
      return { start: v.start, end: v.end };
    })
    .sort((a, b) => a.start.localeCompare(b.start));
  for (let i = 1; i < result.length; i++)
    if (result[i]!.start < result[i - 1]!.end)
      invalid("Los intervalos del día se superponen");
  return result;
}
export function scheduleDto(value: unknown): ScheduleDto {
  const v = object(value, [
    "branchId",
    "professionalId",
    "timeZone",
    "week",
    "version",
  ]);
  if (!Array.isArray(v.week) || v.week.length > 7)
    return invalid("Semana inválida");
  const week = v.week
    .map((raw) => {
      const day = object(raw, ["weekday", "closed", "intervals"]);
      const weekday = integer(day.weekday, 1),
        closed = bool(day.closed),
        intervals = intervalsDto(day.intervals);
      if (
        weekday > 7 ||
        (closed ? intervals.length !== 0 : intervals.length === 0)
      )
        invalid(
          "Un día abierto requiere intervalos; un día cerrado no los admite",
        );
      return { weekday, closed, intervals };
    })
    .sort((a, b) => a.weekday - b.weekday);
  if (new Set(week.map((d) => d.weekday)).size !== week.length)
    invalid("Día duplicado");
  return {
    branchId: uuid(v.branchId),
    professionalId: v.professionalId === null ? null : uuid(v.professionalId),
    timeZone: zone(v.timeZone),
    week,
    version: v.version === null ? null : versionOf(v.version),
  };
}
export function exceptionDto(value: unknown): ExceptionDto {
  const v = object(value, ["date", "kind", "intervals", "note", "version"]);
  if (typeof v.date !== "string" || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(v.date))
    return invalid("Fecha local inválida: usa YYYY-MM-DD");
  const date = new Date(`${v.date}T00:00:00.000Z`);
  if (
    Number.isNaN(date.valueOf()) ||
    date.toISOString().slice(0, 10) !== v.date
  )
    invalid("La fecha no existe");
  if (!["ABSENCE", "CLOSURE", "MODIFIED"].includes(v.kind as string))
    return invalid("Tipo de excepción inválido");
  const intervals = intervalsDto(v.intervals);
  if (v.kind === "MODIFIED" ? !intervals.length : intervals.length)
    invalid("Solo un horario modificado requiere intervalos");
  return {
    date: v.date,
    kind: v.kind as ExceptionDto["kind"],
    intervals,
    note: text(v.note, 1000),
  };
}
export function requirementsDto(value: unknown): RequirementsDto {
  const v = object(value, ["resources", "version"]);
  if (!Array.isArray(v.resources) || v.resources.length > 500)
    return invalid("Lista de recursos inválida");
  const resources = v.resources.map((raw) => {
    const r = object(raw, ["resourceId", "units"]);
    return { resourceId: uuid(r.resourceId), units: integer(r.units, 1) };
  });
  if (new Set(resources.map((r) => r.resourceId)).size !== resources.length)
    invalid("Recurso duplicado");
  return {
    resources,
    version: v.version === null ? null : versionOf(v.version),
  };
}
