import { BadRequestException } from "@nestjs/common";
import { object, uuid, versionOf } from "../staff/staff.dto";
export const fail = (message: string): never => {
  throw new BadRequestException(message);
};
export function text(
  value: unknown,
  max: number,
  required = false,
): string | null {
  if (value === undefined || value === null || value === "")
    return required ? fail("Completa los datos obligatorios.") : null;
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    return fail("Texto vacío o demasiado largo.");
  return value.trim();
}
export function dateOf(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value + "T00:00:00Z")) ||
    new Date(value + "T00:00:00Z").toISOString().slice(0, 10) !== value
  )
    return fail("Fecha inválida: usa YYYY-MM-DD.");
  return value;
}
export function instant(value: unknown): Date {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00(?:\.000)?Z$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 19) !== value.slice(0, 19)
  )
    return fail("Elige un instante UTC válido con precisión de minutos.");
  return new Date(value);
}
export function customerOf(value: unknown) {
  const b = object(value, ["name", "phone", "email", "note"]);
  const raw = text(b.phone, 32),
    phone = raw ? raw.replace(/[\s().-]/g, "") : null;
  if (phone && !/^\+?\d{7,15}$/.test(phone))
    fail("Teléfono inválido. Usa dígitos y, si corresponde, código de país.");
  const email = text(b.email, 320)?.toLowerCase() ?? null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    fail("Correo inválido.");
  return {
    name: text(b.name, 120, true)!,
    phone,
    email,
    note: text(b.note, 500),
  };
}
export function availabilityOf(value: unknown) {
  const b = object(value, [
    "branchId",
    "serviceId",
    "professionalId",
    "date",
    "step",
    "excludeId",
  ]);
  const step = b.step === undefined ? 15 : Number(b.step);
  if (![5, 10, 15, 20, 30, 60].includes(step)) fail("Granularidad inválida.");
  return {
    branchId: uuid(b.branchId),
    serviceId: uuid(b.serviceId),
    professionalId: b.professionalId ? uuid(b.professionalId) : null,
    date: dateOf(b.date),
    step,
    excludeId: b.excludeId ? uuid(b.excludeId) : null,
  };
}
export function bookingOf(value: unknown, reschedule = false) {
  const b = object(value, [
    "requestId",
    "branchId",
    "serviceId",
    "professionalId",
    "startsAt",
    "customerId",
    "customer",
    "channel",
    "note",
    ...(reschedule ? ["version", "reason"] : []),
  ]);
  if (!reschedule && !b.customerId === !b.customer)
    fail("Selecciona un cliente o crea uno nuevo.");
  if (
    !reschedule &&
    !["PHONE", "IN_PERSON", "INTERNAL"].includes(b.channel as string)
  )
    fail("Canal no habilitado para reservas manuales.");
  if (
    reschedule &&
    ["customerId", "customer", "channel", "note"].some(
      (k) => b[k] !== undefined,
    )
  )
    fail("Reagendar conserva el cliente, canal y notas.");
  return {
    requestId: uuid(b.requestId),
    branchId: uuid(b.branchId),
    serviceId: uuid(b.serviceId),
    professionalId: b.professionalId ? uuid(b.professionalId) : null,
    startsAt: instant(b.startsAt),
    customerId: b.customerId ? uuid(b.customerId) : null,
    customer: b.customer ? customerOf(b.customer) : null,
    channel: b.channel as "PHONE" | "IN_PERSON" | "INTERNAL",
    note: text(b.note, 1000),
    version: reschedule ? versionOf(b.version) : undefined,
    reason: reschedule ? text(b.reason, 500, true) : null,
  };
}
export function stateOf(value: unknown) {
  const b = object(value, ["requestId", "version", "state", "reason"]);
  if (
    !["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"].includes(
      b.state as string,
    )
  )
    fail("Estado inválido.");
  return {
    requestId: uuid(b.requestId),
    version: versionOf(b.version),
    state: b.state as "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW",
    reason: text(b.reason, 500, b.state === "CANCELLED"),
  };
}
export function pageOf(value: unknown) {
  const page = value === undefined ? 1 : Number(value);
  if (!Number.isInteger(page) || page < 1 || page > 10000)
    fail("Página inválida.");
  return page;
}
export type BookingInput = ReturnType<typeof bookingOf>;
