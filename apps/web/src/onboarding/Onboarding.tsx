import { useEffect, useRef, useState } from "react";
import { NomaWordmark } from "../public/PublicChrome";
import { Nomi } from "../public/Nomi";
import {
  IdentityIcon,
  IdentityScope,
  ContextualNomi,
} from "../identity/Identity";
import { identityTokens, personality } from "../identity/personality";
import { commercialApi } from "../api/commercial";
import { replacePage } from "../navigation";
import {
  ONBOARDING_STEPS,
  ONBOARDING_SECTORS,
} from "../../../api/src/onboarding/onboarding.contract";
import {
  onboardingApi,
  type OnboardingSnapshot,
  type SaveResult,
} from "./onboarding-api";
import {
  BusinessStep,
  BranchStep,
  ServicesStep,
  TeamStep,
  ReviewStep,
} from "./OnboardingForms";
import "./onboarding.css";
const descriptions = [
  "Elige el sector que mejor describe tu negocio.",
  "La identidad y los datos de contacto de tu negocio.",
  "Dale un lugar y un ritmo a tu operación.",
  "Lo que ofreces, con sus tiempos y precios claros.",
  "Las personas y los medios que hacen posible tu trabajo.",
  "Todo en su lugar. Revisa lo esencial antes de entrar.",
];
export default function Onboarding() {
  const [snapshot, setSnapshot] = useState<OnboardingSnapshot | null>(null),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [preview, setPreview] = useState<(typeof ONBOARDING_SECTORS)[number]>(
      ONBOARDING_SECTORS[0],
    ),
    [membership, setMembership] = useState("");
  const pending = useRef<{ fingerprint: string; requestId: string } | null>(
      null,
    ),
    inFlight = useRef(false),
    heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    let active = true;
    void onboardingApi
      .load()
      .then((value) => {
        if (active) {
          setSnapshot(value);
          setLoading(false);
        }
      })
      .catch((failure) => {
        if (active) {
          setError(
            failure instanceof Error
              ? failure.message
              : "No pudimos recuperar tu configuración.",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [revision]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const step = snapshot?.progress?.step ?? 0;
  useEffect(() => {
    heading.current?.focus();
  }, [
    step,
    snapshot?.status,
    snapshot?.progress?.id,
    snapshot?.progress?.version,
  ]);
  function discard() {
    if (
      dirty &&
      !window.confirm(
        "Hay cambios sin guardar. ¿Quieres descartarlos y continuar?",
      )
    )
      return false;
    setDirty(false);
    return true;
  }
  async function mutate(
    path: string,
    data: Record<string, unknown> = {},
  ): Promise<SaveResult | null> {
    if (inFlight.current) return null;
    const version = snapshot?.progress?.version ?? 0,
      fingerprint = JSON.stringify({ path, data, version });
    if (pending.current?.fingerprint !== fingerprint)
      pending.current = { fingerprint, requestId: crypto.randomUUID() };
    inFlight.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await onboardingApi.save(path, {
        ...data,
        version,
        requestId: pending.current.requestId,
      });
      setSnapshot(result.snapshot);
      setDirty(false);
      setNotice(
        result.replayed
          ? "El guardado ya estaba confirmado. Recuperamos tu progreso."
          : "Guardado en tu espacio. Puedes retomarlo desde otro dispositivo.",
      );
      pending.current = null;
      return result;
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "No pudimos confirmar el guardado. Tu edición se conserva.",
      );
      return null;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  const save = async (path: string, data: Record<string, unknown>) =>
    !!(await mutate(path, data));
  async function enter(value = snapshot) {
    const businessId = value?.configuration?.business.id;
    const member = value?.memberships.find(
      (item) => item.establishment.id === businessId,
    );
    if (!member) {
      setError(
        "No encontramos una membresía autorizada. Vuelve a Activación para seleccionar tu negocio.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      await commercialApi.selectMembership(member.id);
      replacePage("/app/establecimiento?bienvenida=1");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "No pudimos entrar al negocio. Tu preparación está guardada.",
      );
      setBusy(false);
    }
  }
  const editable = !!snapshot && ["IN_PROGRESS"].includes(snapshot.status);
  const firstMissing = snapshot?.missing[0]?.step ?? 5;
  return (
    <div className="noma-onboarding">
      <a className="onboard-skip" href="#onboard-content">
        Saltar al contenido
      </a>
      <header className="onboard-header">
        <a href="/" aria-label="Noma · Inicio">
          <NomaWordmark />
        </a>
        <span>Prepara tu espacio</span>
        <a
          href="/activacion"
          onClick={(e) => {
            if (busy || !discard()) e.preventDefault();
          }}
        >
          Volver a mi cuenta ↗
        </a>
      </header>
      {editable && (
        <nav
          className="onboard-progress"
          aria-label="Progreso de configuración"
        >
          <ol>
            {ONBOARDING_STEPS.map((label, index) => (
              <li key={label}>
                <button
                  type="button"
                  disabled={
                    busy ||
                    (!!snapshot.configuration && index === 0) ||
                    index > firstMissing ||
                    (!snapshot.progress?.selectedVertical && index > 0) ||
                    (!snapshot.configuration && index > 1)
                  }
                  data-complete={index < firstMissing && index !== step}
                  aria-current={step === index ? "step" : undefined}
                  aria-label={`Paso ${index + 1}: ${label}`}
                  aria-description={index < firstMissing && index !== step ? "Completado" : undefined}
                  onClick={() => {
                    if (index !== step && discard())
                      void mutate("step", { step: index });
                  }}
                >
                  <span className="onboard-step-marker" aria-hidden="true">
                    {index < firstMissing && index !== step
                      ? "✓"
                      : String(index + 1).padStart(2, "0")}
                  </span>
                  <strong>{label}</strong>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <main
        id="onboard-content"
        className={`onboard-content${editable ? " onboard-content--workspace" : ""}`}
        aria-busy={busy || loading}
      >
        {loading ? (
          <div className="onboard-state" role="status">
            <Nomi mood="listening" />
            <h1>Estamos preparando tu espacio.</h1>
            <p>Recuperando tu configuración guardada…</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="onboard-error" role="alert">
                <p>{error}</p>
                <button
                  type="button"
                  disabled={busy}
                  className="onboard-text"
                  onClick={() => {
                    if (discard()) {
                      setError("");
                      setLoading(true);
                      setRevision((v) => v + 1);
                    }
                  }}
                >
                  Cargar progreso guardado
                </button>
                <a href="/login">Revisar mi sesión</a>
              </div>
            )}
            {notice && (
              <p className="onboard-saved" role="status">
                ✓ {notice}
              </p>
            )}
            {snapshot &&
              ["WELCOME", "EXISTING_MEMBERSHIPS"].includes(snapshot.status) && (
                <section className="onboard-welcome">
                  <div>
                    <p className="onboard-eyebrow">Tu próximo comienzo</p>
                    <h1 ref={heading} tabIndex={-1}>
                      {snapshot.status === "WELCOME"
                        ? "Un buen negocio empieza por sentirse tuyo."
                        : "Tu negocio ya tiene un lugar."}
                    </h1>
                    <p>
                      {snapshot.status === "WELCOME"
                        ? "Vamos a preparar tu negocio, sus servicios y las personas que lo hacen posible. Paso a paso, sin empezar de cero cada vez."
                        : "Recupera tu configuración existente. Revisaremos qué está listo y qué falta, sin duplicar tu negocio."}
                    </p>
                    <p className="onboard-note">
                      {snapshot.entitlement?.kind === "MANUAL_PILOT"
                        ? `Tienes acceso gratuito al plan ${snapshot.entitlement.plan}. No representa un pago ni una contratación de producción.`
                        : "Tu cuenta tiene una habilitación respaldada por evidencia externa."}
                    </p>
                    {snapshot.memberships.length > 0 && (
                      <label>
                        Negocio que quieres preparar
                        <select
                          required
                          value={membership}
                          onChange={(e) => setMembership(e.target.value)}
                        >
                          <option value="">Selecciona tu negocio</option>
                          {snapshot.memberships.map((item) => (
                            <option
                              key={item.id}
                              value={item.id}
                              disabled={
                                item.establishment.status !== "ACTIVE" ||
                                item.establishment.vertical !== "BEAUTY" ||
                                (!!snapshot.entitlement?.membershipId &&
                                  snapshot.entitlement.membershipId !==
                                    item.id) ||
                                (!!snapshot.entitlement?.establishmentId &&
                                  snapshot.entitlement.establishmentId !==
                                    item.establishment.id)
                              }
                            >
                              {item.establishment.commercialName}
                              {item.establishment.vertical !== "BEAUTY"
                                ? " · configuración del sector en desarrollo"
                                : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <button
                      className="onboard-primary"
                      disabled={
                        busy || (snapshot.memberships.length > 0 && !membership)
                      }
                      onClick={() =>
                        void mutate(
                          "start",
                          membership ? { membershipId: membership } : {},
                        )
                      }
                    >
                      {busy
                        ? "Preparando…"
                        : snapshot.memberships.length
                          ? "Retomar mi negocio"
                          : "Preparar mi negocio"}{" "}
                      <span aria-hidden="true">↗</span>
                    </button>
                  </div>
                  <div className="onboard-welcome-nomi">
                    <Nomi mood="welcome" />
                    <p>
                      Un paso a la vez.
                      <br />
                      Lo que guardes, se queda contigo.
                    </p>
                  </div>
                </section>
              )}
            {snapshot && editable && (
              <>
                <div className="onboard-heading">
                  <div>
                    <p className="onboard-eyebrow">
                      {String(step + 1).padStart(2, "0")} / 06 ·{" "}
                      {snapshot.progress?.createdBusiness === false &&
                      snapshot.configuration
                        ? "Tu configuración existente"
                        : "Tu espacio, a tu manera"}
                    </p>
                    <h1 ref={heading} tabIndex={-1}>
                      {ONBOARDING_STEPS[Math.min(step, 5)]}
                    </h1>
                    <p>{descriptions[Math.min(step, 5)]}</p>
                  </div>
                  <span
                    className={`onboard-save-state ${dirty ? "is-dirty" : ""}`}
                    role="status"
                  >
                    {busy
                      ? "Guardando…"
                      : dirty
                        ? "Cambios sin guardar"
                        : "Progreso guardado"}
                  </span>
                </div>
                <section
                  className="onboard-stage"
                  inert={busy}
                  key={
                    step + ":" + (snapshot.configuration?.business.id ?? "new")
                  }
                  onChangeCapture={() => setDirty(true)}
                >
                  {step === 0 && (
                    <div className="onboard-sector-layout">
                      <div className="onboard-sectors" role="group" aria-label="Explorar sectores">
                        {ONBOARDING_SECTORS.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="onboard-sector"
                            style={identityTokens(personality(item.id))}
                            aria-pressed={preview.id === item.id}
                            onClick={() => setPreview(item)}
                          >
                            <span className="onboard-sector-symbol">
                              <IdentityIcon vertical={item.id} />
                            </span>
                            <span className="onboard-sector-name">
                              <strong>{item.name}</strong>
                              <span>{item.description}</span>
                            </span>
                            <small>{item.available ? "Disponible" : "Próximamente"}</small>
                          </button>
                        ))}
                      </div>
                      <IdentityScope vertical={preview.id} className="onboard-sector-scene">
                        <div className="onboard-sector-art">
                          <span aria-hidden="true">NOMI / EN EL NEGOCIO</span>
                          <ContextualNomi key={preview.id} uniform />
                        </div>
                        <div className="onboard-sector-caption" aria-live="polite">
                          <h2>{preview.name}</h2>
                          <p>{personality(preview.id).copy}</p>
                        </div>
                      </IdentityScope>
                      <div className="onboard-sector-action">
                        {preview.available ? (
                          <button
                            className="onboard-primary"
                            disabled={busy}
                            onClick={() => void mutate("sector", { vertical: preview.id })}
                          >
                            Continuar con belleza y bienestar <span aria-hidden="true">↗</span>
                          </button>
                        ) : (
                          <p role="status">{preview.name} está en desarrollo.</p>
                        )}
                      </div>
                    </div>
                  )}
                  {step === 1 && (
                    <BusinessStep
                      snapshot={snapshot}
                      busy={busy}
                      save={save}
                      confirmDiscard={discard}
                    />
                  )}
                  {step === 2 && snapshot.configuration && (
                    <BranchStep
                      snapshot={snapshot}
                      busy={busy}
                      save={save}
                      confirmDiscard={discard}
                    />
                  )}
                  {step === 3 && snapshot.configuration && (
                    <ServicesStep
                      snapshot={snapshot}
                      busy={busy}
                      save={save}
                      confirmDiscard={discard}
                    />
                  )}
                  {step === 4 && snapshot.configuration && (
                    <TeamStep
                      snapshot={snapshot}
                      busy={busy}
                      save={save}
                      confirmDiscard={discard}
                    />
                  )}
                  {step === 5 && snapshot.configuration && (
                    <ReviewStep snapshot={snapshot} />
                  )}
                </section>
                <footer className="onboard-stage-footer">
                  {step > 0 && !(step === 1 && snapshot.configuration) && (
                    <button
                      type="button"
                      className="onboard-text"
                      disabled={busy}
                      onClick={() => {
                        if (discard()) void mutate("step", { step: step - 1 });
                      }}
                    >
                      ← Volver
                    </button>
                  )}
                  {step >= 2 && step < 5 && (
                    <button
                      className="onboard-primary"
                      disabled={busy}
                      onClick={() => {
                        if (discard()) void mutate("step", { step: step + 1 });
                      }}
                    >
                      Continuar a {ONBOARDING_STEPS[step + 1]?.toLowerCase()} ↗
                    </button>
                  )}
                  {step === 5 && (
                    <button
                      className="onboard-primary"
                      disabled={busy || snapshot.missing.length > 0}
                      onClick={() => {
                        if (discard())
                          void mutate("complete").then((result) => {
                            if (result) void enter(result.snapshot);
                          });
                      }}
                    >
                      Terminar y entrar a mi negocio ↗
                    </button>
                  )}
                </footer>
              </>
            )}
            {snapshot?.status === "COMPLETE" && (
              <section className="onboard-state">
                <Nomi mood="celebrate" />
                <p className="onboard-eyebrow">Todo en su lugar</p>
                <h1 ref={heading} tabIndex={-1}>
                  Tu espacio ya está preparado.
                </h1>
                <p>
                  Tu negocio, catálogo y equipo están guardados. Puedes seguir
                  editándolos desde Noma Business.
                </p>
                <p className="onboard-note">
                  Reservas y asistente IA todavía no están disponibles.
                </p>
                <button
                  className="onboard-primary"
                  disabled={busy}
                  onClick={() => void enter()}
                >
                  Entrar a mi negocio ↗
                </button>
              </section>
            )}
            {snapshot &&
              ![
                "WELCOME",
                "EXISTING_MEMBERSHIPS",
                "IN_PROGRESS",
                "COMPLETE",
              ].includes(snapshot.status) && (
                <section className="onboard-state">
                  <Nomi mood="listening" />
                  <p className="onboard-eyebrow">Tu cuenta, con claridad</p>
                  <h1 ref={heading} tabIndex={-1}>
                    {snapshot.status === "EXPIRED"
                      ? "Tu acceso gratuito ha vencido."
                      : snapshot.status === "SUSPENDED"
                        ? "Tu acceso gratuito está suspendido."
                        : snapshot.status === "REVOKED"
                          ? "Tu acceso gratuito ha finalizado."
                          : "Todavía falta una autorización."}
                  </h1>
                  <p>{snapshot.message}</p>
                  <a className="onboard-primary" href="/activacion">
                    Revisar estado de mi cuenta
                  </a>
                  <p className="onboard-muted">
                    No creamos negocios ni registramos pagos sin una
                    habilitación válida.
                  </p>
                </section>
              )}
          </>
        )}
      </main>
      <footer className="onboard-footer">
        <span>Noma · Tu operación empieza aquí.</span>
        <span>Preparación de negocios · Producto en desarrollo</span>
      </footer>
    </div>
  );
}
