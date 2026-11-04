import {
  BadRequestException,
  Injectable,
  type PipeTransform,
} from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";

export const priceModes = [
  "FIXED",
  "FROM",
  "RANGE",
  "ASSESSMENT_REQUIRED",
] as const;
export class OfferingDto {
  bookingMode?: "PROFESSIONAL" | "RESOURCE_ONLY";
  name!: string;
  category!: string | null;
  description!: string;
  durationMinutes!: number;
  priceMode!: (typeof priceModes)[number];
  priceMin!: string | null;
  priceMax!: string | null;
  hasPriorAssessment!: boolean;
  assessmentDescription!: string | null;
}
export class UpdateOfferingDto extends OfferingDto {
  version!: number;
}
export class OfferingStatusDto {
  active!: boolean;
  version!: number;
}

const fail = (message: string): never => {
  throw new BadRequestException(message);
};
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return fail("Formulario de servicio inválido");
  return value as Record<string, unknown>;
}
function keys(input: Record<string, unknown>, allowed: string[]): void {
  if (Object.keys(input).some((key) => !allowed.includes(key)))
    fail("Hay campos no editables en el servicio");
}
export function validateVersion(value: unknown): number {
  if (
    !Number.isInteger(value) ||
    (value as number) < 0 ||
    (value as number) > 2147483647
  )
    return fail("Versión de servicio inválida");
  return value as number;
}
export function validateOffering(
  value: unknown,
  update = false,
): OfferingDto | UpdateOfferingDto {
  const input = object(value);
  keys(input, [
    "name",
    "category",
    "description",
    "durationMinutes",
    "priceMode",
    "priceMin",
    "priceMax",
    "hasPriorAssessment",
    "assessmentDescription",
    "bookingMode",
    ...(update ? ["version"] : []),
  ]);
  const text = (key: string, max: number, required = false): string | null => {
    const raw = input[key];
    if (!required && (raw === undefined || raw === null || raw === ""))
      return null;
    if (
      typeof raw !== "string" ||
      raw.trim().length > max ||
      (required && !raw.trim())
    )
      return fail(`El campo ${key} no es válido`);
    return raw.trim() || null;
  };
  const name = text("name", 120, true)!;
  const category = text("category", 80);
  const description = input.description ?? "";
  if (typeof description !== "string" || description.length > 2000)
    return fail("La descripción admite hasta 2000 caracteres");
  if (
    !Number.isInteger(input.durationMinutes) ||
    (input.durationMinutes as number) < 1 ||
    (input.durationMinutes as number) > 2147483647
  )
    return fail("La duración debe ser un número entero positivo de minutos");
  if (!priceModes.includes(input.priceMode as OfferingDto["priceMode"]))
    return fail("Modalidad de precio inválida");
  const mode = input.priceMode as OfferingDto["priceMode"];
  const amount = (key: "priceMin" | "priceMax"): string | null => {
    const raw = input[key];
    if (raw === undefined || raw === null) return null;
    if (typeof raw !== "string" || !/^\d{1,14}(\.\d{1,4})?$/.test(raw))
      return fail(
        "Los importes deben ser cadenas decimales no negativas, sin exponentes y con hasta 4 decimales",
      );
    return raw;
  };
  const priceMin = amount("priceMin"),
    priceMax = amount("priceMax");
  if (mode === "ASSESSMENT_REQUIRED") {
    if (priceMin !== null || priceMax !== null)
      return fail("Un servicio sujeto a valoración no tiene precio definitivo");
  } else if (priceMin === null || (mode !== "RANGE" && priceMax !== null))
    return fail("Configura únicamente los importes de la modalidad elegida");
  if (
    mode === "RANGE" &&
    (priceMin === null ||
      priceMax === null ||
      new Prisma.Decimal(priceMax).lt(priceMin))
  )
    return fail("El máximo del rango debe ser mayor o igual al mínimo");
  const hasPriorAssessment =
    input.hasPriorAssessment === undefined ? false : input.hasPriorAssessment;
  if (typeof hasPriorAssessment !== "boolean")
    return fail("Indica si la evaluación previa está descrita");
  const assessmentDescription = text("assessmentDescription", 1000);
  if (
    mode !== "ASSESSMENT_REQUIRED" &&
    (hasPriorAssessment || assessmentDescription)
  )
    return fail(
      "La evaluación previa se describe en servicios sujetos a valoración",
    );
  if (
    (hasPriorAssessment && !assessmentDescription) ||
    (!hasPriorAssessment && assessmentDescription)
  )
    return fail(
      "La descripción de evaluación debe coincidir con su configuración",
    );
  const result: OfferingDto = {
    ...(input.bookingMode === undefined
      ? {}
      : { bookingMode: input.bookingMode as "PROFESSIONAL" | "RESOURCE_ONLY" }),
    name,
    category,
    description: description.trim(),
    durationMinutes: input.durationMinutes as number,
    priceMode: mode,
    priceMin,
    priceMax,
    hasPriorAssessment,
    assessmentDescription,
  };
  if (
    input.bookingMode !== undefined &&
    !["PROFESSIONAL", "RESOURCE_ONLY"].includes(input.bookingMode as string)
  )
    fail(
      "Indica si el servicio necesita un profesional o solo un espacio o equipo.",
    );
  return update
    ? { ...result, version: validateVersion(input.version) }
    : result;
}
export function validateStatus(value: unknown): OfferingStatusDto {
  const input = object(value);
  keys(input, ["active", "version"]);
  if (typeof input.active !== "boolean")
    return fail("Estado de servicio inválido");
  return { active: input.active, version: validateVersion(input.version) };
}
export function validateCurrencyPrecision(
  value: OfferingDto,
  currency: string,
): void {
  const digits = new Intl.NumberFormat("es", {
    style: "currency",
    currency,
  }).resolvedOptions().maximumFractionDigits!;
  for (const amount of [value.priceMin, value.priceMax]) {
    if (amount !== null && (amount.split(".")[1]?.length ?? 0) > digits)
      fail(`La moneda ${currency} admite hasta ${digits} decimales`);
  }
}
@Injectable()
export class CreateOfferingPipe implements PipeTransform {
  transform(value: unknown): OfferingDto {
    return validateOffering(value);
  }
}
@Injectable()
export class UpdateOfferingPipe implements PipeTransform {
  transform(value: unknown): UpdateOfferingDto {
    return validateOffering(value, true) as UpdateOfferingDto;
  }
}
@Injectable()
export class OfferingStatusPipe implements PipeTransform {
  transform(value: unknown): OfferingStatusDto {
    return validateStatus(value);
  }
}
