import {
  BadRequestException,
  Injectable,
  type PipeTransform,
} from "@nestjs/common";
import { businessFields } from "../onboarding/onboarding.dto";

export class EstablishmentUpdateDto {
  commercialName!: string;
  timeZone!: string;
  currency!: string;
  businessPhone!: string | null;
  websiteUrl!: string | null;
  version!: number;
  countryCode?: string | null;
  city?: string | null;
  address?: string | null;
  businessEmail?: string | null;
  description?: string | null;
  beautySubtype?: string | null;
}

export function validateEstablishment(value: unknown): EstablishmentUpdateDto {
  const fail = (message: string): never => {
    throw new BadRequestException(message);
  };
  if (!value || typeof value !== "object" || Array.isArray(value))
    return fail("Formulario inválido");
  const input = value as Record<string, unknown>;
  const fields = [
    "commercialName",
    "timeZone",
    "currency",
    "businessPhone",
    "websiteUrl",
    "version",
    "countryCode",
    "city",
    "address",
    "businessEmail",
    "description",
    "beautySubtype",
  ];
  if (Object.keys(input).some((key) => !fields.includes(key)))
    return fail("El formulario contiene campos no editables");
  if (
    typeof input.commercialName !== "string" ||
    !input.commercialName.trim() ||
    input.commercialName.trim().length > 120
  )
    return fail("El nombre comercial debe tener entre 1 y 120 caracteres");
  if (
    typeof input.timeZone !== "string" ||
    input.timeZone.length > 64 ||
    !input.timeZone.includes("/")
  )
    return fail("Zona horaria IANA inválida");
  try {
    new Intl.DateTimeFormat("es", { timeZone: input.timeZone }).format();
  } catch {
    return fail("Zona horaria IANA inválida");
  }
  if (
    typeof input.currency !== "string" ||
    !Intl.supportedValuesOf("currency").includes(input.currency)
  )
    return fail("Moneda ISO 4217 inválida");
  if (
    !Number.isSafeInteger(input.version) ||
    (input.version as number) < 0 ||
    (input.version as number) > 2147483647
  )
    return fail("Versión de edición inválida");
  const optional = (
    key: "businessPhone" | "websiteUrl",
    max: number,
  ): string | null => {
    const field = input[key];
    if (field === null || field === "") return null;
    if (typeof field !== "string" || field.length > max)
      return fail(`El campo ${key} no es válido`);
    return field.trim() || null;
  };
  const businessPhone = optional("businessPhone", 32);
  if (businessPhone && !/^[+\d\s().-]{5,32}$/.test(businessPhone))
    return fail("Teléfono comercial inválido");
  const websiteUrl = optional("websiteUrl", 250);
  if (websiteUrl) {
    try {
      const url = new URL(websiteUrl);
      if (
        !["https:", "http:"].includes(url.protocol) ||
        url.username ||
        url.password
      )
        throw new Error();
    } catch {
      return fail(
        "El sitio web debe ser una URL HTTP o HTTPS sin credenciales",
      );
    }
  }
  const extras: Partial<EstablishmentUpdateDto> = {};
  if (
    [
      "countryCode",
      "city",
      "address",
      "businessEmail",
      "description",
      "beautySubtype",
    ].some((key) => key in input)
  ) {
    const detail = businessFields(
      Object.fromEntries(
        [
          "commercialName",
          "timeZone",
          "businessPhone",
          "countryCode",
          "city",
          "address",
          "businessEmail",
          "description",
          "beautySubtype",
        ].map((key) => [key, input[key]]),
      ),
      false,
    );
    for (const key of [
      "countryCode",
      "city",
      "address",
      "businessEmail",
      "description",
      "beautySubtype",
    ] as const)
      if (key in input) extras[key] = detail[key];
  }
  return {
    commercialName: input.commercialName.trim(),
    timeZone: input.timeZone,
    currency: input.currency,
    businessPhone,
    websiteUrl,
    version: input.version as number,
    ...extras,
  };
}

@Injectable()
export class EstablishmentValidationPipe implements PipeTransform {
  transform(value: unknown): EstablishmentUpdateDto {
    return validateEstablishment(value);
  }
}
