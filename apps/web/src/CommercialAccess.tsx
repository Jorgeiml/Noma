import { useEffect, useState, type FormEvent } from "react";
import {
  commercialApi,
  type CommercialAccount,
  type IdentityPage,
} from "./api/commercial";
import { ApiError } from "./api/platform";
import { Nomi } from "./public/Nomi";
import {
  NomaWordmark,
  PublicHeader,
  PublicFooter,
} from "./public/PublicChrome";
import { replacePage, safeAppNext } from "./navigation";
import "./public/public.css";
import "./commercial-access.css";
import { CommercialAuthorizationNotice } from "./CommercialAuthorizationNotice";
import { AccountWelcome, hasReadyBusiness } from "./AccountWelcome";
import { OnboardingInvitation } from "./onboarding/OnboardingInvitation";
const titles: Record<IdentityPage, string> = {
  login: "Qué bueno verte de nuevo.",
  signup: "Tu cuenta. El primer paso.",
  verify: "Un correo, una identidad.",
  recover: "Volvamos a encontrarte.",
  activation: "Tu cuenta tiene su lugar.",
  denied: "Este espacio necesita autorización.",
};
export default function CommercialAccess({ page }: { page: IdentityPage }) {
  const [config, setConfig] = useState<{
    enabled: boolean;
    localEnabled: boolean;
  } | null>(null);
  const [account, setAccount] = useState<CommercialAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const next = safeAppNext(
    new URLSearchParams(window.location.search).get("next"),
  );
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const configuration = await commercialApi.configuration();
        if (!active) return;
        setConfig(configuration);
        if (["verify", "activation"].includes(page) && configuration.enabled) {
          const current = await commercialApi.account();
          if (!active) return;
          setAccount(current);
        }
      } catch (failure) {
        if (!active) return;
        if (failure instanceof ApiError && failure.status === 401)
          setUnauthorized(true);
        else
          setError(
            failure instanceof Error
              ? failure.message
              : "No pudimos comprobar tu acceso.",
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [page]);
  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 401) {
        setAccount(null);
        setUnauthorized(true);
      }
      setError(
        failure instanceof Error
          ? failure.message
          : "No se pudo completar. Intenta otra vez.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function begin(mode: "login" | "signup" | "recover") {
    await run(async () => {
      const result = await commercialApi.start(
        mode,
        email.trim() || undefined,
        next,
      );
      const destination = new URL(result.authorizationUrl);
      if (
        destination.protocol !== "https:" ||
        destination.username ||
        destination.password
      )
        throw new Error("No se recibió un destino de identidad seguro.");
      replacePage(destination.href);
    });
  }
  const identityForm = ["login", "signup", "recover"].includes(page);
  const readyBusiness = !!account && hasReadyBusiness(account);
  const compact =
    page === "activation" &&
    account?.user.verified &&
    (readyBusiness || account.manualActivation?.accessAuthorized);
  return (
    <div className="noma-site">
      {compact ? (
        <header className="noma-activation-header">
          <a href="/" aria-label="Noma · Inicio">
            <NomaWordmark />
          </a>
        </header>
      ) : (
        <PublicHeader />
      )}
      <main
        id="noma-content"
        className={`noma-access ${page === "activation" && account ? "noma-account-page" : ""} ${compact ? "noma-activation-compact" : ""}`}
      >
        {!(page === "activation" && account) && (
          <div className="noma-access-intro">
            <p className="noma-kicker">NOMA · TU IDENTIDAD, CON CUIDADO</p>
            <h1>{titles[page]}</h1>
            <p>
              Tu cuenta para organizar tu negocio, conectar a tu equipo y seguir
              creciendo.
            </p>
            <Nomi mood={page === "verify" ? "listening" : "welcome"} />
          </div>
        )}
        <section className="noma-access-panel" aria-label="Acceso comercial">
          {loading && (
            <p role="status">Comprobando la configuración de acceso…</p>
          )}
          {error && (
            <p className="noma-access-error" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="noma-access-notice" role="status">
              {notice}
            </p>
          )}
          {new URLSearchParams(window.location.search).has("error") && (
            <p role="alert">
              No pudimos completar el retorno de identidad. El intento puede
              haber vencido o sido cancelado. Inicia de nuevo.
            </p>
          )}
          {new URLSearchParams(window.location.search).has("loggedOut") && (
            <p role="status">
              Tu sesión de Noma quedó cerrada. Si el proveedor no estuvo
              disponible, su sesión puede seguir abierta; cierra también esa
              sesión en el proveedor.
            </p>
          )}
          {!loading && config && !config.enabled && (
            <div className="noma-access-notice">
              <h2>El acceso comercial aún no está habilitado.</h2>
              <p>
                Falta configurar y validar el proveedor de identidad. Esta
                pantalla no crea cuentas ni simula un inicio de sesión.
              </p>
            </div>
          )}
          {unauthorized && (
            <div>
              <h2>Tu sesión venció o no está autorizada.</h2>
              <p>
                Inicia sesión para comprobar tu identidad y tus permisos
                actuales.
              </p>
              <a
                className="noma-button"
                href={`/login?next=${encodeURIComponent(next)}`}
              >
                Iniciar sesión
              </a>
            </div>
          )}
          {identityForm && (
            <>
              <h2>
                {page === "signup"
                  ? "Crea tu identidad de Noma."
                  : page === "recover"
                    ? "Recupera el acceso con el proveedor."
                    : "Accede de forma segura."}
              </h2>
              <p>
                {page === "signup"
                  ? "Crea tu cuenta y verifica tu correo. Después podrás explorar los planes; los datos de tu negocio se completan en la preparación guiada, cuando tu acceso esté habilitado."
                  : page === "recover"
                    ? "Continuar abre el login seguro del proveedor. Allí elige «¿Olvidaste tu contraseña?». El proveedor gestiona la recuperación y sus correos; Noma no recibe tu contraseña."
                    : "La contraseña y los factores de acceso se gestionan en el proveedor de identidad, fuera de Noma."}
              </p>
              <form
                onSubmit={(event: FormEvent) => {
                  event.preventDefault();
                  void begin(
                    page === "signup"
                      ? "signup"
                      : page === "recover"
                        ? "recover"
                        : "login",
                  );
                }}
              >
                <label htmlFor="commercial-email">Correo electrónico</label>
                <input
                  id="commercial-email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={320}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={busy}
                />
                <button
                  className="noma-button"
                  disabled={busy || !config?.enabled}
                >
                  {busy
                    ? "Conectando…"
                    : page === "signup"
                      ? "Continuar con el registro"
                      : "Continuar con el proveedor"}
                  <span aria-hidden="true">↗</span>
                </button>
              </form>
              <nav
                className="noma-access-links"
                aria-label="Opciones de identidad"
              >
                <a href={page === "signup" ? "/login" : "/registro"}>
                  {page === "signup"
                    ? "Ya tengo una cuenta"
                    : "Crear una cuenta"}
                </a>
                {page !== "recover" && (
                  <a href="/recuperar-acceso">Recuperar acceso</a>
                )}
              </nav>
            </>
          )}
          {page === "verify" && account && (
            <>
              <h2>
                {account.user.verified
                  ? "Tu correo ya está verificado."
                  : "Revisa tu correo."}
              </h2>
              <p>{account.user.email}</p>
              {account.user.verified ? (
                <a href="/activacion" className="noma-button">
                  Continuar
                </a>
              ) : (
                <>
                  <p>
                    Usa el enlace enviado por el proveedor. Después, vuelve a
                    comprobar tu identidad; la verificación no se acepta como un
                    parámetro del navegador.
                  </p>
                  <button
                    className="noma-button"
                    disabled={busy}
                    onClick={() => void begin("login")}
                  >
                    Ya verifiqué mi correo
                  </button>
                  <button
                    className="noma-text-action"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const result = await commercialApi.resend();
                        setNotice(result.message);
                      })
                    }
                  >
                    Reenviar verificación
                  </button>
                </>
              )}
            </>
          )}
          {page === "activation" && account && (
            <>
              <AccountWelcome
                account={account}
                busy={busy}
                run={run}
                onAccount={setAccount}
                onNotice={setNotice}
              />
              {account.user.verified && (
                <>
                  {!readyBusiness && <OnboardingInvitation account={account} />}
                  {!!account.memberships.length && !readyBusiness && (
                    <h3>Tus negocios</h3>
                  )}
                  {!!account.memberships.length && (
                    <ul className="noma-membership-list">
                      {account.memberships.map((member) => (
                        <li key={member.id}>
                          <div>
                            <strong>{member.name}</strong>
                            <small>
                              {member.manualActivation
                                ? `Piloto manual ${member.manualActivation.accessAuthorized ? "autorizado" : "no vigente"} · sin pago registrado`
                                : member.establishmentStatus === "ACTIVE"
                                  ? {
                                      ACTIVE: "Suscripción activa",
                                      SUSPENDED: "Suscripción suspendida",
                                      CANCELLED: "Suscripción cancelada",
                                      ACTIVATION_PENDING:
                                        "Activación pendiente",
                                    }[member.subscriptionState]
                                  : "Establecimiento no disponible"}
                            </small>
                          </div>
                          <button
                            className="noma-button"
                            disabled={
                              busy ||
                              member.subscriptionState !== "ACTIVE" ||
                              member.establishmentStatus !== "ACTIVE"
                            }
                            onClick={() =>
                              void run(async () => {
                                await commercialApi.selectMembership(member.id);
                                replacePage(next);
                              })
                            }
                          >
                            Entrar
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </>
          )}
          {page === "denied" && (
            <>
              <h2>Tu identidad no concede acceso por sí sola.</h2>
              <p>
                La membresía y la activación del establecimiento deben estar
                vigentes. No se cambió ningún permiso.
              </p>
              <a className="noma-button" href="/activacion">
                Revisar mis accesos
              </a>
              <a className="noma-text-action" href="/login">
                Volver a iniciar sesión
              </a>
            </>
          )}
          {compact && account && (
            <details className="noma-activation-details">
              <summary>Detalles de mi cuenta</summary>
              <p>{account.user.email}</p>
              {account.manualActivation && (
                <>
                  <p>Plan {account.manualActivation.plan}</p>
                  <CommercialAuthorizationNotice account={account} />
                </>
              )}
              {readyBusiness && <a href="/onboarding">Retomar configuración</a>}
              {config?.localEnabled && (
                <p>
                  <a href={`/dev/login?next=${encodeURIComponent(next)}`}>
                    Acceso con código de desarrollo
                  </a>
                </p>
              )}
            </details>
          )}
          {account && (
            <button
              className="noma-text-action"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const result = await commercialApi.logout();
                  replacePage(result.logoutUrl ?? "/login?loggedOut=1");
                })
              }
            >
              Cerrar sesión de Noma
            </button>
          )}
          {!compact && config?.localEnabled && (
            <aside className="noma-local-entry">
              <p className="noma-kicker">SOLO DESARROLLO LOCAL</p>
              <a href={`/dev/login?next=${encodeURIComponent(next)}`}>
                Acceso local con código de un solo uso ↗
              </a>
            </aside>
          )}
        </section>
      </main>
      {!compact && <PublicFooter />}
    </div>
  );
}
