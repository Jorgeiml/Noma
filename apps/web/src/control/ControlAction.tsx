import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Application, Context, User } from "./control-api";
import { controlApi, stateLabel } from "./control-api";
import { ROLE_LABELS } from "../../../api/src/control/control.contract";
import { applicantLabel } from "./application-presentation";
type Action =
  | "APPROVED"
  | "REJECTED"
  | "ACTIVATE"
  | "SUSPEND"
  | "REVOKE"
  | "RESUME"
  | "CHANGE_PLAN"
  | "ROLE";
const descriptions: Record<Action, { label: string; effect: string }> = {
  APPROVED: {
    label: "Aprobar solicitud",
    effect:
      "Registra la aprobación. No crea un negocio, no activa acceso ni registra un pago.",
  },
  REJECTED: {
    label: "Rechazar solicitud",
    effect:
      "Registra una decisión final de rechazo. No se podrá aprobar la misma solicitud desde este panel.",
  },
  ACTIVATE: {
    label: "Autorizar piloto",
    effect:
      "Autoriza acceso temporal sin pago. Si asocias una membresía existente, su propietario podrá preparar ese negocio hasta el vencimiento. Sin membresía, permite crear un único negocio mediante la preparación guiada de belleza y bienestar.",
  },
  SUSPEND: {
    label: "Suspender piloto",
    effect:
      "Interrumpe el acceso autorizado por este piloto. No borra datos ni cambia permisos de otro negocio.",
  },
  REVOKE: {
    label: "Finalizar piloto",
    effect:
      "Finaliza esta autorización de forma definitiva. No se podrá reactivar este piloto. Los datos del negocio se conservan.",
  },
  RESUME: {
    label: "Reanudar piloto",
    effect:
      "Restablece el piloto hasta su vencimiento original. No amplía su duración ni registra un pago.",
  },
  CHANGE_PLAN: {
    label: "Cambiar plan del piloto",
    effect:
      "Cambia la propuesta asociada al piloto. No registra un cobro, no amplía el vencimiento ni impone cuotas de IA todavía inexistentes.",
  },
  ROLE: {
    label: "Administrar permisos internos",
    effect:
      "Cambia el acceso del usuario a Noma Control. No cambia sus membresías de negocio. Los permisos del propietario de plataforma están protegidos.",
  },
};
function localTime(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function ControlAction({
  context,
  application,
  user,
  onDone,
}: {
  context: Context;
  application?: Application;
  user?: User;
  onDone: () => void;
}) {
  const [action, setAction] = useState<Action | "">(""),
    [reason, setReason] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [plan, setPlan] = useState(application?.selectedPlan ?? "START"),
    [membership, setMembership] = useState(""),
    [expires, setExpires] = useState(""),
    [role, setRole] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const requestId = useRef(crypto.randomUUID()),
    inFlight = useRef(false);
  const target = application?.id ?? user!.id;
  const [openedAt] = useState(() => Date.now());
  const dirty = !!(reason || confirmation || expires);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const actions: Action[] = [];
  const pilot = application?.manualActivation;
  if (application) {
    if (
      context.permissions.includes("applications.decide") &&
      application.state === "ACTIVATION_PENDING" &&
      !application.manualActivation &&
      !application.platformReview
    )
      actions.push("APPROVED", "REJECTED");
    if (
      context.permissions.includes("subscriptions.manage") &&
      application.platformReview?.decision === "APPROVED" &&
      application.manualActivation?.authorizationBasis !== "DIRECT_GRANT"
    ) {
      if (!pilot) actions.push("ACTIVATE");
      else if (pilot.state !== "REVOKED") {
        if (pilot.effectiveState !== "EXPIRED") {
          actions.push(
            pilot.state === "SUSPENDED" ? "RESUME" : "SUSPEND",
            "CHANGE_PLAN",
          );
        }
        actions.push("REVOKE");
      }
    }
  } else if (
    context.permissions.includes("roles.manage") &&
    user!.platformAccess?.role !== "PLATFORM_OWNER" &&
    user!.id !== context.user.id
  )
    actions.push("ROLE");
  if (!actions.length) return null;
  if (!context.sensitiveOperationsAvailable)
    return (
      <p className="control-warning">
        Las operaciones sensibles requieren MFA verificable en este entorno.
        Puedes consultar los registros.
      </p>
    );
  function select(next: Action | "") {
    if (
      dirty &&
      !window.confirm("Hay una operación sin registrar. ¿Descartar su edición?")
    )
      return;
    setAction(next);
    setReason("");
    setConfirmation("");
    setExpires("");
    setError("");
    requestId.current = crypto.randomUUID();
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!action || inFlight.current) return;
    if (confirmation.trim().toLowerCase() !== target) {
      setError("El identificador de confirmación no coincide.");
      return;
    }
    if (action === "ROLE" && !role) {
      setError("Selecciona explícitamente el permiso interno.");
      return;
    }
    if (action === "ACTIVATE" && !Number.isFinite(Date.parse(expires))) {
      setError("Indica un vencimiento válido.");
      return;
    }
    if (action === "CHANGE_PLAN" && plan === pilot?.plan) {
      setError("Selecciona un plan diferente al actual.");
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const base = { requestId: requestId.current, confirmId: target, reason };
      const path = user
        ? `/users/${target}/platform-access`
        : `/applications/${target}/${action === "APPROVED" || action === "REJECTED" ? "decision" : "manual-activation"}`;
      const payload =
        action === "ROLE"
          ? {
              ...base,
              role: role === "REVOKE" ? null : role,
              version: user!.platformAccess?.version ?? null,
            }
          : action === "APPROVED" || action === "REJECTED"
            ? {
                ...base,
                decision: action,
                version: application!.platformReview?.version ?? 0,
              }
            : action === "ACTIVATE"
              ? {
                  ...base,
                  plan,
                  membershipId: membership || null,
                  expiresAt: new Date(expires).toISOString(),
                }
              : {
                  ...base,
                  action,
                  version: pilot!.version,
                  ...(action === "CHANGE_PLAN" ? { plan } : {}),
                };
      await controlApi.write(
        path,
        action === "ROLE" ||
          ["SUSPEND", "REVOKE", "RESUME", "CHANGE_PLAN"].includes(action)
          ? "PUT"
          : "POST",
        payload,
      );
      setReason("");
      setConfirmation("");
      setAction("");
      requestId.current = crypto.randomUUID();
      onDone();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "No pudimos registrar la operación.",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="control-actions" aria-label="Operación administrativa">
      <label htmlFor="control-action">
        Operación sobre{" "}
        {application ? applicantLabel(application) : user?.displayName}
      </label>
      <select
        id="control-action"
        value={action}
        disabled={busy}
        onChange={(event) => select(event.target.value as Action | "")}
      >
        <option value="">Elige una operación</option>
        {actions.map((value) => (
          <option key={value} value={value}>
            {descriptions[value].label}
          </option>
        ))}
      </select>
      {action && (
        <form onSubmit={(event) => void submit(event)}>
          <fieldset disabled={busy}>
            <legend>{descriptions[action].label}</legend>
            <p className="control-warning">{descriptions[action].effect}</p>
            <p className="control-id">
              Registro afectado: <strong>{target}</strong>
            </p>
            {!!application?.user.emails?.length && (
              <p>
                Cuenta afectada:{" "}
                <strong>
                  {application.user.emails
                    .map((identity) => identity.email)
                    .join(" · ")}
                </strong>
              </p>
            )}
            {(action === "ACTIVATE" || action === "CHANGE_PLAN") && (
              <>
                <label htmlFor="control-plan">Propuesta de plan</label>
                <select
                  id="control-plan"
                  value={plan}
                  onChange={(event) => setPlan(event.target.value)}
                >
                  {context.plans.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · USD {item.monthly}/mes propuestos
                    </option>
                  ))}
                  <option value="ENTERPRISE">
                    Enterprise · condiciones personalizadas propuestas
                  </option>
                </select>
                <small>
                  El piloto no registra pagos ni mide consumo de IA.
                </small>
              </>
            )}
            {action === "ACTIVATE" && (
              <>
                <label htmlFor="control-membership">
                  Negocio al que se autoriza acceso
                </label>
                <select
                  id="control-membership"
                  value={membership}
                  onChange={(event) => setMembership(event.target.value)}
                >
                  <option value="">
                    Sin negocio asociado · preparar un nuevo negocio
                  </option>
                  {application!.memberships
                    ?.filter(
                      (item) =>
                        item.role === "OWNER" &&
                        item.status === "ACTIVE" &&
                        item.establishment.status === "ACTIVE",
                    )
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.establishment.commercialName} · {item.id}
                      </option>
                    ))}
                </select>
                <label htmlFor="control-expiry">
                  Vencimiento del piloto · hora local
                </label>
                <input
                  id="control-expiry"
                  type="datetime-local"
                  required
                  min={localTime(new Date(openedAt + 60000))}
                  max={localTime(new Date(openedAt + 90 * 86400000))}
                  value={expires}
                  onChange={(event) => setExpires(event.target.value)}
                />
                <small>
                  Fecha obligatoria. Duración máxima: 90 días; el vencimiento no
                  se extiende desde este panel.
                </small>
              </>
            )}
            {action === "ROLE" && (
              <>
                <label htmlFor="control-role">
                  Permiso interno de Vértice EC
                </label>
                <select
                  id="control-role"
                  required
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                >
                  <option value="">Elige un permiso</option>
                  <option value="PLATFORM_ADMIN">
                    Administrador de plataforma
                  </option>
                  <option value="BILLING_MANAGER">Gestión comercial</option>
                  <option value="SUPPORT_AGENT">Soporte</option>
                  {user?.platformAccess && !user.platformAccess.revokedAt && (
                    <option value="REVOKE">
                      Revocar acceso a Noma Control
                    </option>
                  )}
                </select>
                <p>
                  Rol actual:{" "}
                  {user?.platformAccess?.revokedAt
                    ? "Revocado"
                    : user?.platformAccess
                      ? ROLE_LABELS[user.platformAccess.role]
                      : "Sin permiso de plataforma"}
                  . Las membresías del negocio se conservan.
                </p>
              </>
            )}
            <label htmlFor="control-reason">Motivo administrativo</label>
            <textarea
              id="control-reason"
              required
              minLength={10}
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explica la autorización o el cambio. No incluyas contraseñas, tokens ni datos sensibles."
            />
            <label htmlFor="control-confirm">
              Escribe el ID del registro para confirmar
            </label>
            <input
              id="control-confirm"
              required
              autoComplete="off"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
            <button disabled={busy}>
              {busy
                ? "Registrando operación…"
                : `Confirmar: ${descriptions[action].label.toLocaleLowerCase("es")}`}
            </button>
          </fieldset>
          {error && (
            <p role="alert" className="control-error">
              {error}
            </p>
          )}
        </form>
      )}
      {!action && pilot && (
        <p>Estado actual del piloto: {stateLabel(pilot.effectiveState)}.</p>
      )}
    </section>
  );
}
