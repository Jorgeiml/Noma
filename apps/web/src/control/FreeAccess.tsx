import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  controlApi,
  stateLabel,
  type Context,
  type Membership,
  type Pilot,
} from "./control-api";
const local = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
const modes = { TEST: "Prueba", PILOT: "Piloto", COURTESY: "Cortesía" };
export function FreeAccess({
  context,
  userId,
  emails,
  memberships,
  grant,
  onDone,
}: {
  context: Context;
  userId: string;
  emails: Array<{ email: string; verified: boolean }>;
  memberships: Membership[];
  grant?: Pilot | null;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false),
    [plan, setPlan] = useState("GROW"),
    [mode, setMode] = useState("TEST"),
    [expires, setExpires] = useState(() =>
      local(new Date(Date.now() + 30 * 86400000)),
    ),
    [membership, setMembership] = useState(grant?.membershipId ?? ""),
    [reason, setReason] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [confirmPlan, setConfirmPlan] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [action, setAction] = useState("EXTEND"),
    [limits, setLimits] = useState({
      branches: "",
      professionals: "",
      users: "",
      whatsapp: "",
      aiSessions: "",
    });
  const dialog = useRef<HTMLDialogElement>(null),
    request = useRef(crypto.randomUUID()),
    flight = useRef(false);
  useEffect(() => {
    if (open) {
      if (dialog.current?.showModal) dialog.current.showModal();
      else dialog.current?.setAttribute("open", "");
    } else dialog.current?.close?.();
  }, [open]);
  if (!context.permissions.includes("subscriptions.manage")) return null;
  const verified = emails.filter((e) => e.verified),
    canOperate =
      context.sensitiveOperationsAvailable &&
      verified.length > 0 &&
      grant?.state !== "REVOKED" &&
      userId !== context.user.id;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (flight.current) return;
    if (confirmation !== userId || !confirmPlan) {
      setError("Confirma la cuenta y el plan antes de guardar.");
      return;
    }
    flight.current = true;
    setBusy(true);
    setError("");
    try {
      const base = { requestId: request.current, confirmId: userId, reason };
      await controlApi.write(
        `/users/${userId}/free-access`,
        grant ? "PUT" : "POST",
        grant
          ? {
              ...base,
              action,
              version: grant.version,
              ...(action === "EXTEND"
                ? { expiresAt: new Date(expires).toISOString() }
                : {}),
            }
          : {
              ...base,
              plan,
              mode,
              expiresAt: new Date(expires).toISOString(),
              membershipId: membership || null,
              ...(plan === "ENTERPRISE"
                ? {
                    limits: Object.fromEntries(
                      Object.entries(limits).map(([k, v]) => [k, Number(v)]),
                    ),
                  }
                : {}),
            },
      );
      setOpen(false);
      onDone();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo confirmar el acceso.",
      );
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="control-free-access">
      <button
        className="control-button"
        disabled={!canOperate}
        onClick={() => {
          request.current = crypto.randomUUID();
          setError("");
          setConfirmation("");
          setConfirmPlan(false);
          setExpires(
            local(
              new Date(
                Math.max(
                  Date.now(),
                  grant ? Date.parse(grant.expiresAt) : Date.now(),
                ) +
                  30 * 86400000,
              ),
            ),
          );
          setOpen(true);
        }}
      >
        {grant ? "Gestionar acceso gratuito" : "Conceder acceso gratuito"}
      </button>
      {!canOperate && (
        <p className="control-muted">
          {grant?.state === "REVOKED"
            ? "El acceso finalizado conserva su historial y no se reactiva."
            : userId === context.user.id
              ? "Otro operador debe autorizar tu propio acceso."
              : !verified.length
                ? "Se necesita una identidad verificada."
                : "Se requiere MFA verificable para conceder accesos."}
        </p>
      )}
      {grant && (
        <p className="control-muted">
          GRATUITA · {modes[grant.mode ?? "PILOT"]} · {grant.plan} ·{" "}
          {stateLabel(grant.effectiveState ?? grant.state)}
        </p>
      )}
      <dialog
        ref={dialog}
        className="control-free-dialog"
        aria-labelledby="control-free-title"
        onCancel={(e) => {
          if (busy) e.preventDefault();
          else setOpen(false);
        }}
        onClose={() => setOpen(false)}
      >
        <div className="control-free-dialog-heading">
          <div>
            <p className="control-eyebrow">NOMA CONTROL · ACCESO SIN PAGO</p>
            <h2 id="control-free-title">
              {grant ? "Gestionar acceso gratuito" : "Conceder acceso gratuito"}
            </h2>
          </div>
          <button
            type="button"
            className="control-secondary"
            disabled={busy}
            onClick={() => setOpen(false)}
          >
            Cerrar
          </button>
        </div>
        <section className="control-free-recipient">
          <strong>{verified.map((e) => e.email).join(" · ")}</strong>
          <p className="control-id">Cuenta: {userId}</p>
          <p>
            {grant
              ? `${grant.plan} · ${modes[grant.mode ?? "PILOT"]} · vence ${new Date(grant.expiresAt).toLocaleString("es-EC")}`
              : "Sin acceso gratuito registrado. No se registrará un pago, ingreso ni factura pagada."}
          </p>
        </section>
        <form onSubmit={(e) => void submit(e)}>
          <fieldset disabled={busy}>
            <div className="control-free-fields">
              {grant ? (
                <label>
                  Acción
                  <select
                    value={action}
                    onChange={(e) => {
                      setAction(e.target.value);
                      request.current = crypto.randomUUID();
                    }}
                  >
                    <option value="EXTEND">Extender vigencia</option>
                    {grant.state === "ACTIVE" &&
                      grant.effectiveState !== "EXPIRED" && (
                        <option value="SUSPEND">Suspender acceso</option>
                      )}
                    {grant.state === "SUSPENDED" &&
                      grant.effectiveState !== "EXPIRED" && (
                        <option value="RESUME">Reactivar acceso</option>
                      )}
                    <option value="REVOKE">Finalizar acceso</option>
                  </select>
                </label>
              ) : (
                <>
                  <label>
                    Plan gratuito
                    <select
                      value={plan}
                      onChange={(e) => {
                        setPlan(e.target.value);
                        setConfirmPlan(false);
                        request.current = crypto.randomUUID();
                      }}
                    >
                      {context.plans.map((p) => (
                        <option value={p.id} key={p.id}>
                          {p.name}
                        </option>
                      ))}
                      <option value="ENTERPRISE">
                        Enterprise · límites explícitos
                      </option>
                    </select>
                  </label>
                  <label>
                    Modalidad
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                    >
                      {Object.entries(modes).map(([id, name]) => (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
              {(!grant || action === "EXTEND") && (
                <label>
                  Vencimiento
                  <input
                    required
                    type="datetime-local"
                    value={expires}
                    onChange={(e) => setExpires(e.target.value)}
                  />
                </label>
              )}
              {!grant && (
                <label className="control-free-wide">
                  Negocio al que tendrá acceso
                  <select
                    value={membership}
                    onChange={(e) => setMembership(e.target.value)}
                    required={
                      !!memberships.filter((m) => m.status === "ACTIVE").length
                    }
                  >
                    <option value="">Preparar un negocio nuevo</option>
                    {memberships
                      .filter((m) => m.status === "ACTIVE")
                      .map((m) => (
                        <option value={m.id} key={m.id}>
                          {m.establishment.commercialName}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              {!grant &&
                plan === "ENTERPRISE" &&
                Object.entries({
                  branches: "Sucursales",
                  professionals: "Profesionales",
                  users: "Usuarios del panel",
                  whatsapp: "Números WhatsApp previstos",
                  aiSessions: "Sesiones IA previstas por mes",
                }).map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      required
                      type="number"
                      min="1"
                      max={
                        key === "branches" || key === "whatsapp"
                          ? 100
                          : key === "aiSessions"
                            ? 1000000
                            : 1000
                      }
                      value={limits[key as keyof typeof limits]}
                      onChange={(e) =>
                        setLimits({ ...limits, [key]: e.target.value })
                      }
                    />
                  </label>
                ))}
            </div>
            <label>
              Motivo administrativo
              <textarea
                required
                minLength={10}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <label>
              Confirma el identificador de la cuenta
              <input
                required
                autoComplete="off"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </label>
            <label className="control-free-check">
              <input
                type="checkbox"
                required
                checked={confirmPlan}
                onChange={(e) => setConfirmPlan(e.target.checked)}
              />
              <span>
                Confirmo la cuenta {verified.map((e) => e.email).join(" · ")} y
                el plan {grant?.plan ?? plan}. Esta operación no acredita un
                pago.
              </span>
            </label>
            {error && (
              <p className="control-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy}>
              {busy
                ? "Guardando…"
                : grant
                  ? "Confirmar cambio"
                  : "Conceder acceso gratuito"}
            </button>
          </fieldset>
        </form>
      </dialog>
    </div>
  );
}
