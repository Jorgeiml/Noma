import { lazy, Suspense, useEffect, useState, type FormEvent } from "react";
import { App } from "./App";
const Catalog = lazy(() =>
  import("./Catalog").then((module) => ({ default: module.Catalog })),
);
const Operations = lazy(() =>
  import("./Operations").then((module) => ({ default: module.Operations })),
);
import { ProductNavigation, type ProductArea } from "./ProductNavigation";
import { StudioMark, StudioCompanion } from "./StudioBrand";
import { AdminShell } from "./AdminShell";
import { BusinessProfile } from "./BusinessProfile";
import { commercialApi } from "./api/commercial";
import { APP_PATHS, safeAppNext, replacePage } from "./navigation";
import {
  ApiError,
  platformApi,
  draftOf,
  type Establishment,
  type EstablishmentDraft,
  type OwnerContext,
} from "./api/platform";

type Stage = "loading" | "access" | "disabled" | "unavailable" | "ready";

async function fetchWorkspace() {
  const owner = await platformApi.context();
  const establishment = await platformApi.read(owner.establishmentId);
  return { owner, establishment };
}

export function Workspace({
  initialArea,
  routeMode,
}: { initialArea?: ProductArea; routeMode?: "app" | "login" } = {}) {
  const [childEditing, setChildEditing] = useState({
    busy: false,
    dirty: false,
  });
  const [stage, setStage] = useState<Stage>("loading");
  const [context, setContext] = useState<OwnerContext | null>(null);
  const [saved, setSaved] = useState<Establishment | null>(null);
  const [draft, setDraft] = useState<EstablishmentDraft | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [catalog, setCatalog] = useState(() =>
    initialArea
      ? initialArea === "services"
      : window.location.hash === "#servicios",
  );
  const [operations, setOperations] = useState(() =>
    initialArea
      ? initialArea === "operations"
      : window.location.hash === "#operacion",
  );
  const dirty = Boolean(
    draft && saved && JSON.stringify(draft) !== JSON.stringify(draftOf(saved)),
  );
  useEffect(() => {
    if (routeMode === "app" && stage === "access")
      replacePage(
        `/login?next=${encodeURIComponent(window.location.pathname)}${new URLSearchParams(window.location.search).has("legacy") ? "&legacy=1" : ""}`,
      );
    if (routeMode === "login" && stage === "ready")
      replacePage(
        safeAppNext(new URLSearchParams(window.location.search).get("next")),
      );
  }, [routeMode, stage]);
  const availableAreas: ProductArea[] = ["establishment"];
  const capabilities = saved?.sectorConfiguration?.capabilities;
  if (
    capabilities?.individualServices === "IMPLEMENTED" &&
    capabilities.flexiblePricing === "IMPLEMENTED"
  )
    availableAreas.push("services");
  if (
    capabilities &&
    (
      ["professionals", "branches", "resources", "workSchedules"] as const
    ).every((key) => capabilities[key] === "IMPLEMENTED")
  )
    availableAreas.push("operations");

  async function load(): Promise<void> {
    try {
      const { owner, establishment } = await fetchWorkspace();
      setContext(owner);
      setSaved(establishment);
      setDraft(draftOf(establishment));
      setStage("ready");
      setError("");
    } catch (failure) {
      if (
        routeMode === "app" &&
        failure instanceof ApiError &&
        failure.status === 403 &&
        failure.message.startsWith("Acceso comercial:")
      ) {
        replacePage("/activacion");
        return;
      }
      if (failure instanceof ApiError && failure.status === 401) {
        setStage("access");
        setError("");
      } else if (
        failure instanceof ApiError &&
        failure.status === 404 &&
        failure.message.includes("deshabilitado")
      ) {
        setStage("disabled");
        setError("");
      } else {
        setStage("unavailable");
        setError(
          failure instanceof Error
            ? failure.message
            : "Establecimiento no disponible",
        );
      }
    }
  }
  useEffect(() => {
    let active = true;
    void fetchWorkspace()
      .then(({ owner, establishment }) => {
        if (!active) return;
        setContext(owner);
        setSaved(establishment);
        setDraft(draftOf(establishment));
        setStage("ready");
        setError("");
      })
      .catch((failure) => {
        if (!active) return;
        if (
          routeMode === "app" &&
          failure instanceof ApiError &&
          failure.status === 403 &&
          failure.message.startsWith("Acceso comercial:")
        ) {
          replacePage("/activacion");
          return;
        }
        if (failure instanceof ApiError && failure.status === 401) {
          setStage("access");
          setError("");
        } else if (
          failure instanceof ApiError &&
          failure.status === 404 &&
          failure.message.includes("deshabilitado")
        ) {
          setStage("disabled");
          setError("");
        } else {
          setStage("unavailable");
          setError(
            failure instanceof Error
              ? failure.message
              : "Establecimiento no disponible",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [routeMode]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function login(event: FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await platformApi.login(code.trim());
      setCode("");
      await load();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Sesión local no autorizada",
      );
    } finally {
      setBusy(false);
    }
  }
  async function save(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!saved || !draft || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await platformApi.update(saved.id, draft);
      setSaved(updated);
      setDraft(draftOf(updated));
      setNotice(
        "Cambios guardados. La información de tu negocio está actualizada.",
      );
    } catch (failure) {
      setError(
        failure instanceof ApiError && failure.status === 401
          ? "Tu sesión venció. Conservamos tu edición. Copia tus cambios antes de volver a acceder."
          : failure instanceof Error
            ? failure.message
            : "No pudimos guardar. Tu edición se conserva.",
      );
    } finally {
      setBusy(false);
    }
  }
  function change(key: keyof EstablishmentDraft, value: string): void {
    setDraft((previous) =>
      previous ? { ...previous, [key]: value } : previous,
    );
    setNotice("");
  }
  async function logout(): Promise<void> {
    if (
      dirty &&
      !window.confirm("Hay cambios sin guardar. ¿Salir y descartarlos?")
    )
      return;
    try {
      if (context?.identityMode === "commercial") {
        const result = await commercialApi.logout();
        replacePage(result.logoutUrl ?? "/login?loggedOut=1");
        return;
      }
      await platformApi.logout();
      setSaved(null);
      setDraft(null);
      setContext(null);
      setNotice("");
      setError("");
      setStage("access");
    } catch {
      setError("No se pudo cerrar la sesión. Vuelve a intentarlo.");
    }
  }
  function reload(): void {
    if (
      dirty &&
      !window.confirm(
        "Hay cambios sin guardar. ¿Descartarlos y cargar los datos actuales?",
      )
    )
      return;
    setStage("loading");
    setNotice("");
    void load();
  }

  function navigate(area: ProductArea): void {
    if (!availableAreas.includes(area)) {
      setError(
        "Esta área requiere una clasificación sectorial con capacidades implementadas.",
      );
      return;
    }
    if (
      dirty &&
      !window.confirm(
        "Hay cambios del establecimiento sin guardar. ¿Descartarlos y cambiar de área?",
      )
    )
      return;
    if (saved) setDraft(draftOf(saved));
    window.history.replaceState(
      null,
      "",
      routeMode
        ? APP_PATHS[area]
        : area === "services"
          ? "#servicios"
          : area === "operations"
            ? "#operacion"
            : window.location.pathname + window.location.search,
    );
    setCatalog(area === "services");
    setOperations(area === "operations");
  }

  if (
    (routeMode === "app" && stage === "access") ||
    (routeMode === "login" && stage === "ready")
  )
    return (
      <main className="private-loading" role="status">
        Comprobando acceso autorizado…
      </main>
    );
  return (
    <AdminShell
      authorized={stage === "ready"}
      businessName={saved?.commercialName}
      businessLogo={saved?.logoDataUrl}
      guideKey={context && saved ? `${context.userId}:${saved.id}` : undefined}
      userName={context?.displayName}
      canSwitch={context?.identityMode === "commercial"}
      busy={busy || childEditing.busy}
      onLogout={() => {
        if (
          !childEditing.dirty ||
          window.confirm(
            "Hay cambios sin guardar. ¿Cerrar sesión y descartarlos?",
          )
        )
          void logout();
      }}
    >
      <div
        className={`workspace-shell ${stage === "ready" ? "workspace-authorized" : "workspace-access"}`}
      >
        <a href="#workspace-content" className="skip-link">
          Saltar al contenido
        </a>
        <header className="workspace-header" hidden={stage === "ready"}>
          <a
            className="studio-brand"
            href="/"
            aria-label="Noma · Inicio público"
          >
            <span className="studio-mark">
              <StudioMark />
            </span>
            <span>
              Noma<small>Appointments · Tu operación</small>
            </span>
          </a>
          <div className="header-context">
            {saved && <strong>{saved.commercialName}</strong>}
            <span>
              <i aria-hidden="true" />
              {context?.identityMode === "commercial"
                ? "Acceso comercial autorizado"
                : "Solo desarrollo local"}
            </span>
          </div>
        </header>
        {routeMode &&
          new URLSearchParams(window.location.search).has("legacy") && (
            <p className="legacy-route-note">
              Actualizamos las direcciones: el acceso está en /login y tu
              establecimiento en /app. Tus datos y permisos se conservan.
            </p>
          )}
        {stage === "ready" &&
          !(
            (catalog && availableAreas.includes("services")) ||
            (operations && availableAreas.includes("operations"))
          ) && (
            <ProductNavigation
              active="establishment"
              disabled={busy}
              onSelect={navigate}
              enabledAreas={availableAreas}
            />
          )}
        {stage === "ready" && error && (catalog || operations) && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        {operations &&
        saved &&
        availableAreas.includes("operations") &&
        stage === "ready" ? (
          <main
            id="workspace-content"
            className="catalog-main view-enter"
            tabIndex={-1}
            key="operations"
          >
            <Suspense
              fallback={
                <>
                  <ProductNavigation
                    active="operations"
                    disabled
                    onSelect={navigate}
                  />
                  <p className="os-loading-space" role="status">
                    Cargando espacio Equipo…
                  </p>
                </>
              }
            >
              <Operations
                enabledAreas={availableAreas}
                onEditingChange={setChildEditing}
                timeZone={saved.timeZone}
                sectorTerms={saved.sectorConfiguration.terminology}
                onNavigate={navigate}
                onLeave={() => navigate("establishment")}
              />
            </Suspense>
          </main>
        ) : catalog &&
          saved &&
          availableAreas.includes("services") &&
          stage === "ready" ? (
          <main
            id="workspace-content"
            className="catalog-main view-enter"
            tabIndex={-1}
            key="catalog"
          >
            <Suspense
              fallback={
                <>
                  <ProductNavigation
                    active="services"
                    disabled
                    onSelect={navigate}
                  />
                  <p className="os-loading-space" role="status">
                    Cargando espacio Servicios…
                  </p>
                </>
              }
            >
              <Catalog
                enabledAreas={availableAreas}
                onEditingChange={setChildEditing}
                currency={saved.currency}
                sectorTerms={saved.sectorConfiguration.terminology}
                onNavigate={navigate}
                onLeave={() => navigate("establishment")}
              />
            </Suspense>
          </main>
        ) : (
          <main
            id="workspace-content"
            className="workspace-main view-enter"
            tabIndex={-1}
            key={stage === "ready" ? "establishment" : "access"}
          >
            <section
              className="workspace-intro"
              hidden={stage === "ready"}
              aria-labelledby="workspace-title"
            >
              <p className="eyebrow">
                {stage === "ready"
                  ? "Configuración general"
                  : "Tu espacio de trabajo"}
              </p>
              <h1 id="workspace-title">
                {stage === "ready"
                  ? "Establecimiento"
                  : "Tu negocio, en un solo lugar."}
              </h1>
              <p>
                {stage === "ready"
                  ? "Administra la información y las preferencias de tu negocio."
                  : "Organiza los servicios y el equipo de tu negocio. Producto en desarrollo."}
              </p>
              {context && saved && (
                <div className="identity-note">
                  <strong>{saved.commercialName}</strong>
                  <span>{context.displayName} · Propietario</span>
                  <span>Establecimiento activo · No es una sucursal</span>
                </div>
              )}
              <p className="scope-note">
                {stage === "ready"
                  ? "Tu configuración acompaña cada área del establecimiento."
                  : "Acceso de desarrollo, exclusivo de este equipo. La autenticación comercial definitiva está pendiente."}
              </p>
              {stage !== "ready" && (
                <div className="access-companion">
                  <StudioCompanion
                    mood={stage === "loading" ? "waiting" : "welcome"}
                  />
                  <span>
                    Tu espacio está listo.
                    <br />
                    Accede para continuar.
                  </span>
                </div>
              )}
            </section>
            <section
              className="workspace-editor"
              aria-label="Configuración del establecimiento"
            >
              {stage === "loading" && (
                <p role="status">Cargando tu establecimiento…</p>
              )}
              {stage === "disabled" && (
                <>
                  <h2>El acceso local está cerrado</h2>
                  <p>
                    Inicia el entorno con <code>pnpm dev:local</code>. No se
                    concede acceso automáticamente.
                  </p>
                  <button onClick={reload}>Volver a comprobar acceso</button>
                </>
              )}
              {stage === "access" && (
                <form onSubmit={(event) => void login(event)}>
                  <p className="eyebrow">Acceso autorizado</p>
                  <p className="access-step">
                    01 <span>Identifica tu acceso</span>
                  </p>
                  <h2>Accede a tu espacio.</h2>
                  <p>
                    Genera tu código con <code>pnpm dev:access</code> y cópialo
                    aquí. Es de un solo uso y vence en 10 minutos.
                  </p>
                  <label htmlFor="access-code">
                    Código local de desarrollo
                  </label>
                  <input
                    id="access-code"
                    type="password"
                    autoComplete="off"
                    required
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                  />
                  <button disabled={busy}>
                    {busy
                      ? "Comprobando acceso…"
                      : "Acceder al establecimiento"}
                  </button>
                  <p className="field-help">
                    El código no se guarda en el navegador. La sesión usa una
                    cookie HttpOnly y vence en 8 horas.
                  </p>
                </form>
              )}
              {stage === "unavailable" && (
                <>
                  <h2>Establecimiento no disponible</h2>
                  <p>
                    Comprueba que tu pertenencia siga autorizada y que la API y
                    PostgreSQL estén disponibles.
                  </p>
                  <button onClick={reload}>Reintentar carga</button>
                </>
              )}
              {stage === "ready" && saved && draft && (
                <BusinessProfile
                  saved={saved}
                  draft={draft}
                  busy={busy}
                  dirty={dirty}
                  notice={notice}
                  change={change}
                  onSave={(event) => void save(event)}
                  onReload={reload}
                  onDiscard={() => setDraft(draftOf(saved))}
                  onLogoSaved={(value) => {
                    setSaved(value);
                    setDraft(draftOf(value));
                  }}
                  onLogoBusy={setBusy}
                />
              )}
              {error && (
                <p role="alert" className="error-message">
                  {error}
                </p>
              )}
            </section>
          </main>
        )}
        <footer className="workspace-footer">
          <span>
            Appointments · Operación de negocios de servicios · En desarrollo
          </span>
          <App compact />
        </footer>
      </div>
    </AdminShell>
  );
}
