import { BadRequestException } from "@nestjs/common";
import { object, uuid, versionOf } from "../staff/staff.dto";
import { BEAUTY_SUBTYPES, BUSINESS_COUNTRIES } from "./onboarding.contract";
export function textOf(
  value: unknown,
  label: string,
  max: number,
  required = false,
): string | null {
  if (!required && (value === undefined || value === null || value === ""))
    return null;
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new BadRequestException(
      `${label}: escribe un valor válido de hasta ${max} caracteres.`,
    );
  return value.trim();
}
export function businessFields(value: unknown, required = true) {
  const b = object(value, [
    "commercialName",
    "countryCode",
    "city",
    "address",
    "businessPhone",
    "businessEmail",
    "timeZone",
    "description",
    "beautySubtype",
    "version",
  ]);
  const commercialName = textOf(
    b.commercialName,
    "Nombre del negocio",
    120,
    true,
  )!;
  const countryCode =
    textOf(b.countryCode, "País", 2, required)?.toUpperCase() ?? null;
  if (countryCode && !/^[A-Z]{2}$/.test(countryCode))
    throw new BadRequestException("Selecciona un país válido.");
  if (countryCode && !BUSINESS_COUNTRIES.some(([code]) => code === countryCode))
    throw new BadRequestException(
      "Selecciona un país disponible en el formulario.",
    );
  const businessPhone = textOf(
    b.businessPhone,
    "Teléfono comercial",
    32,
    required,
  );
  if (businessPhone && !/^\+?[\d\s().-]{6,32}$/.test(businessPhone))
    throw new BadRequestException("Revisa el formato del teléfono comercial.");
  const businessEmail = textOf(
    b.businessEmail,
    "Correo comercial",
    320,
    required,
  );
  if (businessEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail))
    throw new BadRequestException("Revisa el correo comercial.");
  const timeZone = textOf(b.timeZone, "Zona horaria", 64, true)!;
  try {
    new Intl.DateTimeFormat("es", { timeZone }).format();
    if (timeZone !== "UTC" && !timeZone.includes("/")) throw new Error();
  } catch {
    throw new BadRequestException("Selecciona una zona horaria IANA válida.");
  }
  const beautySubtype = textOf(b.beautySubtype, "Tipo de negocio", 40);
  if (beautySubtype && !(beautySubtype in BEAUTY_SUBTYPES))
    throw new BadRequestException("Selecciona un tipo de negocio disponible.");
  return {
    commercialName,
    countryCode,
    city: textOf(b.city, "Ciudad", 100, required),
    address: textOf(b.address, "Dirección", 250),
    businessPhone,
    businessEmail,
    timeZone,
    description: textOf(b.description, "Descripción", 1000),
    beautySubtype,
  };
}
export function commandOf(value: unknown, extra: string[]) {
  const body = object(value, ["requestId", "version", ...extra]);
  return {
    body,
    requestId: uuid(body.requestId),
    version: versionOf(body.version),
  };
}
