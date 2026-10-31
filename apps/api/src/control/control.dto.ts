import { BadRequestException } from "@nestjs/common";
import { object, versionOf } from "../staff/staff.dto";
import { isPlanId } from "../commercial/plan.contract";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const invalid = (text: string): never => {
  throw new BadRequestException(text);
};
export function idOf(value: unknown): string {
  return typeof value === "string" && uuid.test(value)
    ? value.toLowerCase()
    : invalid("Identificador no válido.");
}
export function reasonOf(value: unknown) {
  if (
    typeof value === "string" &&
    /bearer\s|-----BEGIN|(?:password|client_secret|authorization)\s*[:=]|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\./i.test(
      value,
    )
  )
    invalid("No incluyas tokens, contraseñas ni secretos en el motivo.");
  return typeof value === "string" &&
    value.trim().length >= 10 &&
    value.trim().length <= 500
    ? value.trim()
    : invalid(
        "Escribe un motivo de entre 10 y 500 caracteres, sin secretos ni información sensible.",
      );
}
export function pageOf(input: unknown) {
  const raw = object(input, [
    "page",
    "size",
    "q",
    "state",
    "decision",
    "vertical",
  ]);
  const integer = (value: unknown, fallback: number, max: number) =>
    value === undefined
      ? fallback
      : typeof value === "string" &&
          /^\d+$/.test(value) &&
          Number(value) >= 1 &&
          Number(value) <= max
        ? Number(value)
        : invalid("Paginación no válida.");
  if (
    raw.q !== undefined &&
    (typeof raw.q !== "string" || raw.q.trim().length > 80)
  )
    invalid("Búsqueda demasiado larga.");
  for (const key of ["state", "decision", "vertical"])
    if (raw[key] !== undefined && typeof raw[key] !== "string")
      invalid("Filtro no válido.");
  return {
    page: integer(raw.page, 1, 10000),
    size: integer(raw.size, 25, 50),
    q: (raw.q as string | undefined)?.trim() ?? "",
    state: raw.state as string | undefined,
    decision: raw.decision as string | undefined,
    vertical: raw.vertical as string | undefined,
  };
}
export type ControlPageQuery = ReturnType<typeof pageOf>;
function base(body: Record<string, unknown>) {
  return {
    requestId: idOf(body.requestId),
    confirmId: idOf(body.confirmId),
    reason: reasonOf(body.reason),
  };
}
export function decisionOf(input: unknown) {
  const body = object(input, [
    "requestId",
    "confirmId",
    "reason",
    "decision",
    "version",
  ]);
  if (body.decision !== "APPROVED" && body.decision !== "REJECTED")
    invalid("Decisión no válida.");
  return {
    ...base(body),
    decision: body.decision as "APPROVED" | "REJECTED",
    version: versionOf(body.version),
  };
}
export function activationOf(input: unknown) {
  const body = object(input, [
    "requestId",
    "confirmId",
    "reason",
    "plan",
    "membershipId",
    "expiresAt",
  ]);
  if (!isPlanId(body.plan)) invalid("Selecciona una propuesta de plan válida.");
  if (
    typeof body.expiresAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(
      body.expiresAt,
    ) ||
    !Number.isFinite(Date.parse(body.expiresAt))
  )
    invalid("Indica una fecha y hora UTC válidas de vencimiento.");
  return {
    ...base(body),
    plan: body.plan as "START" | "GROW" | "SCALE" | "ENTERPRISE",
    membershipId: body.membershipId === null ? null : idOf(body.membershipId),
    expiresAt: body.expiresAt as string,
  };
}
export function activationChangeOf(input: unknown) {
  const body = object(input, [
    "requestId",
    "confirmId",
    "reason",
    "action",
    "version",
    "plan",
  ]);
  if (
    !["SUSPEND", "REVOKE", "RESUME", "CHANGE_PLAN"].includes(
      body.action as string,
    )
  )
    invalid("Acción no válida.");
  if (
    body.action === "CHANGE_PLAN"
      ? !isPlanId(body.plan)
      : body.plan !== undefined
  )
    invalid("Plan no válido para esta acción.");
  return {
    ...base(body),
    action: body.action as "SUSPEND" | "REVOKE" | "RESUME" | "CHANGE_PLAN",
    version: versionOf(body.version),
    plan: body.plan as "START" | "GROW" | "SCALE" | "ENTERPRISE" | undefined,
  };
}
export function roleOf(input: unknown) {
  const body = object(input, [
    "requestId",
    "confirmId",
    "reason",
    "role",
    "version",
  ]);
  if (
    !["PLATFORM_ADMIN", "BILLING_MANAGER", "SUPPORT_AGENT", null].includes(
      body.role as string | null,
    )
  )
    invalid(
      "Solo se pueden asignar o revocar roles internos limitados. El propietario no se asigna por la web.",
    );
  return {
    ...base(body),
    role: body.role as
      "PLATFORM_ADMIN" | "BILLING_MANAGER" | "SUPPORT_AGENT" | null,
    version: body.version === null ? null : versionOf(body.version),
  };
}
