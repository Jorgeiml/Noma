import { BadRequestException } from "@nestjs/common";
import { object, versionOf } from "../staff/staff.dto";
import { idOf, reasonOf } from "./control.dto";
import { isPlanId } from "../commercial/plan.contract";
export function enterpriseLimits(input: unknown) {
  const value = object(input, [
    "branches",
    "professionals",
    "users",
    "whatsapp",
    "aiSessions",
  ]);
  const maxima = {
    branches: 100,
    professionals: 1000,
    users: 1000,
    whatsapp: 100,
    aiSessions: 1000000,
  };
  for (const [key, max] of Object.entries(maxima))
    if (
      !Number.isInteger(value[key]) ||
      Number(value[key]) < 1 ||
      Number(value[key]) > max
    )
      throw new BadRequestException(
        `El límite ${key} debe estar entre 1 y ${max}.`,
      );
  return value as Record<keyof typeof maxima, number>;
}
export function utcDate(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 19) !== value.slice(0, 19)
  )
    throw new BadRequestException("Indica una fecha UTC válida.");
  return new Date(value);
}
export function freeAccessOf(input: unknown) {
  const b = object(input, [
    "requestId",
    "confirmId",
    "reason",
    "plan",
    "mode",
    "startsAt",
    "expiresAt",
    "membershipId",
    "limits",
  ]);
  if (
    !isPlanId(b.plan) ||
    !["TEST", "PILOT", "COURTESY"].includes(b.mode as string)
  )
    throw new BadRequestException(
      "Selecciona un plan y una modalidad válidos.",
    );
  if (b.plan !== "ENTERPRISE" && b.limits !== undefined)
    throw new BadRequestException(
      "Los límites estándar proceden del contrato del plan.",
    );
  return {
    requestId: idOf(b.requestId),
    confirmId: idOf(b.confirmId),
    reason: reasonOf(b.reason),
    plan: b.plan as "START" | "GROW" | "SCALE" | "ENTERPRISE",
    mode: b.mode as "TEST" | "PILOT" | "COURTESY",
    startsAt: b.startsAt === undefined ? undefined : utcDate(b.startsAt),
    expiresAt: utcDate(b.expiresAt),
    membershipId: b.membershipId == null ? null : idOf(b.membershipId),
    limits: b.plan === "ENTERPRISE" ? enterpriseLimits(b.limits) : null,
  };
}
export function freeChangeOf(input: unknown) {
  const b = object(input, [
    "requestId",
    "confirmId",
    "reason",
    "action",
    "version",
    "expiresAt",
  ]);
  if (!["EXTEND", "SUSPEND", "RESUME", "REVOKE"].includes(b.action as string))
    throw new BadRequestException("Acción no válida.");
  if (b.action !== "EXTEND" && b.expiresAt !== undefined)
    throw new BadRequestException("Vencimiento no válido para esta acción.");
  return {
    requestId: idOf(b.requestId),
    confirmId: idOf(b.confirmId),
    reason: reasonOf(b.reason),
    action: b.action as "EXTEND" | "SUSPEND" | "RESUME" | "REVOKE",
    version: versionOf(b.version),
    expiresAt: b.action === "EXTEND" ? utcDate(b.expiresAt) : undefined,
  };
}
