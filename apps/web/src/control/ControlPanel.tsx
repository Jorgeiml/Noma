import {
  useEffect,
  useState,
  type ReactNode,
  type SetStateAction,
} from "react";
import { NomaWordmark } from "../public/PublicChrome";
import { Nomi } from "../public/Nomi";
import { commercialApi } from "../api/commercial";
import { sectorConfiguration } from "../../../api/src/sector/sector.contract";
import {
  CONTROL_PAGES,
  PAGE_PERMISSIONS,
  ROLE_LABELS,
  type ControlPage,
} from "../../../api/src/control/control.contract";
import { ControlAction } from "./ControlAction";
import {
  controlApi,
  ControlError,
  dateLabel,
  stateLabel,
  type Application,
  type Audit,
  type Business,
  type Context,
  type Dashboard,
  type PageData,
  type RecordItem,
  type Subscription,
  type User,
} from "./control-api";
import "./control.css";
const pageNames: Record<ControlPage, string> = {
  inicio: "Pendientes de hoy",
  solicitudes: "Solicitudes",
  negocios: "Negocios",
  suscripciones: "Planes y pilotos",
  usuarios: "Usuarios y permisos",
  auditoria: "Auditoría",
};
const descriptions: Record<ControlPage, string> = {
  inicio:
    "Prioriza las revisiones y las autorizaciones que necesitan atención.",
  solicitudes:
    "Revisa la identidad, la propuesta elegida y las decisiones de cada solicitud.",
  negocios:
    "Información administrativa de los establecimientos, sin entrar en su operación privada.",
  suscripciones:
    "Distingue las relaciones comerciales de los pilotos manuales, con su origen y vencimiento.",
  usuarios:
    "Identidades vinculadas y accesos. Los permisos de Vértice EC son independientes de los roles de cada negocio.",
  auditoria:
    "Quién autorizó cada cambio, cuándo lo hizo y por qué. Este registro es de consulta.",
};
const actions: Record<string, string> = {
  "application.approved": "Solicitud aprobada",
  "application.rejected": "Solicitud rechazada",
  "manualActivation.created": "Piloto autorizado",
  "manualActivation.suspend": "Piloto suspendido",
  "manualActivation.revoke": "Piloto finalizado",
  "manualActivation.resume": "Piloto reanudado",
  "manualActivation.change_plan": "Plan del piloto cambiado",
  "platformAccess.granted": "Permiso interno asignado",
  "platformAccess.revoked": "Permiso interno revocado",
  "platformOwner.bootstrapped": "Propietario de plataforma autorizado",
  "control.request.rejected": "Solicitud de Control rechazada",
};
const statusOptions: Partial<Record<ControlPage, string[]>> = {
  solicitudes: [
    "REGISTRATION_STARTED",
    "IDENTITY_VERIFIED",
    "PLAN_SELECTED",
    "ACTIVATION_PENDING",
  ],
  negocios: ["ACTIVE", "SUSPENDED"],
  suscripciones: [
    "ACTIVATION_PENDING",
    "ACTIVE",
    "SUSPENDED",
    "REVOKED",
    "EXPIRED",
    "CANCELLED",
  ],
  auditoria: ["SUCCESS", "DENIED", "REJECTED"],
};
function Badge({ value }: { value: string | null | undefined }) {
  return (
    <span className="control-state" data-state={value}>
      {stateLabel(value)}
    </span>
  );
}
function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="control-empty">
      <Nomi mood="listening" />
      <div>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
    </div>
  );
}
function Pairs({ values }: { values: Array<[string, ReactNode]> }) {
  return (
    <dl className="control-pairs">
      {values.map(([name, value]) => (
        <div key={name}>
          <dt>{name}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
function AuditChanges({ changes }: { changes: Record<string, unknown> }) {
  const readable = (value: unknown): ReactNode =>
    value === null ? (
      "Sin registrar"
    ) : typeof value === "boolean" ? (
      value ? (
        "Sí"
      ) : (
        "No"
      )
    ) : typeof value === "string" ? (
      (ROLE_LABELS[value as keyof typeof ROLE_LABELS] ?? stateLabel(value))
    ) : typeof value === "number" ? (
      String(value)
    ) : value && typeof value === "object" ? (
      <Pairs
        values={Object.entries(value).map(([key, item]) => [
          (
            {
              state: "Estado",
              decision: "Decisión",
              role: "Permiso",
              plan: "Plan",
              expiresAt: "Vencimiento",
              membershipId: "Membresía",
              paymentCreated: "Pago registrado",
              businessCreated: "Negocio creado",
              onboardingAuthorized: "Alta futura autorizada",
              version: "Versión",
              revoked: "Revocado",
              applicationState: "Estado de solicitud",
              kind: "Tipo",
              id: "ID",
              status: "Código de respuesta",
            } as Record<string, string>
          )[key] ?? key,
          readable(item),
        ])}
      />
    ) : (
      "Sin registrar"
    );
  return (
    <details className="control-audit-changes">
      <summary>Ver cambios registrados</summary>
      <Pairs
        values={Object.entries(changes).map(([key, value]) => [
          (
            {
              before: "Antes",
              after: "Después",
              evidence: "Evidencia administrativa",
              method: "Procedimiento",
              status: "Código de respuesta",
            } as Record<string, string>
          )[key] ?? key,
          readable(value),
        ])}
      />
    </details>
  );
}
function DashboardView({ data }: { data: Dashboard }) {
  return (
    <div className="control-home">
      {data.pendingReviews !== null && (
        <section className="control-priority">
          <p className="control-eyebrow">Por revisar</p>
          <strong>{data.pendingReviews}</strong>
          <h2>Solicitudes esperan una decisión</h2>
          <p>
            Una aprobación autoriza el siguiente paso administrativo. El acceso
            y los pagos se gestionan por separado.
          </p>
          <a
            className="control-button"
            href="/control/solicitudes?state=ACTIVATION_PENDING&decision=PENDING"
          >
            Revisar solicitudes
          </a>
        </section>
      )}
      <div className="control-summary-sections">
        {!!data.applications.length && (
          <section>
            <h2>Solicitudes registradas</h2>
            <Pairs
              values={data.applications.map((item) => [
                stateLabel(item.state),
                item._count,
              ])}
            />
            <Pairs
              values={data.decisions.map((item) => [
                stateLabel(item.decision),
                item._count,
              ])}
            />
          </section>
        )}
        {!!data.businesses.length && (
          <section>
            <h2>Negocios por sector</h2>
            <Pairs
              values={data.businesses.map((item) => [
                sectorConfiguration(
                  item.vertical as Parameters<typeof sectorConfiguration>[0],
                ).label,
                item._count,
              ])}
            />
          </section>
        )}
        {(data.subscriptions.length > 0 || data.manual) && (
          <section>
            <h2>Relaciones comerciales</h2>
            <Pairs
              values={[
                ...data.subscriptions.map((item): [string, ReactNode] => [
                  stateLabel(item.state),
                  item._count,
                ]),
                ...(data.manual
                  ? ([
                      ["Pilotos vigentes", data.manual.active],
                      ["Pilotos vencidos", data.manual.expired],
                    ] as Array<[string, ReactNode]>)
                  : []),
              ]}
            />
            <p className="control-muted">
              Una autorización manual no acredita un pago.
            </p>
          </section>
        )}
      </div>
      {data.pendingReviews === null &&
        !data.manual &&
        data.businesses.length === 0 && (
          <Empty title="Sin operaciones visibles">
            Tu permiso actual no incluye estas consultas.
          </Empty>
        )}
    </div>
  );
}
export default function ControlPanel() {
  const segment = window.location.pathname.replace(/^\/control\/?/, "");
  const page: ControlPage | "missing" =
    segment === ""
      ? "inicio"
      : CONTROL_PAGES.includes(segment as (typeof CONTROL_PAGES)[number])
        ? (segment as ControlPage)
        : "missing";
  const initial = new URLSearchParams(window.location.search);
  const [context, setContext] = useState<Context | null>(null),
    [contextError, setContextError] = useState<ControlError | null>(null),
    [checking, setChecking] = useState(true),
    [accessRevision, setAccessRevision] = useState(0);
  const [filters, updateFilters] = useState({
      q: initial.get("q") ?? "",
      state: initial.get("state") ?? "",
      decision: initial.get("decision") ?? "",
      vertical: initial.get("vertical") ?? "",
      page: Math.max(1, Number(initial.get("page")) || 1),
    }),
    [search, setSearch] = useState(filters.q),
    [revision, setRevision] = useState(0);
  const [data, setData] = useState<PageData | null>(null),
    [dashboard, setDashboard] = useState<Dashboard | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [selected, updateSelected] = useState<{
      kind: "application" | "business" | "user";
      id: string;
      user?: User;
    } | null>(null),
    [detail, setDetail] = useState<Application | Business | User | null>(null),
    [detailLoading, setDetailLoading] = useState(false),
    [detailError, setDetailError] = useState("");
  function setFilters(value: SetStateAction<typeof filters>) {
    setLoading(true);
    setError("");
    updateFilters(value);
  }
  function setSelected(value: typeof selected) {
    setDetailLoading(!!value);
    setDetailError("");
    setDetail(null);
    updateSelected(value);
  }
  function refresh() {
    setLoading(true);
    setError("");
    setRevision((value) => value + 1);
  }
  useEffect(() => {
    let active = true;
    void controlApi
      .context()
      .then((value) => {
        if (active) {
          setContext(value);
          setContextError(null);
        }
      })
      .catch((failure) => {
        if (active) {
          setContext(null);
          setContextError(
            failure instanceof ControlError
              ? failure
              : new ControlError(0, "No pudimos comprobar tu acceso."),
          );
        }
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [accessRevision]);
  const allowed =
    context &&
    page !== "missing" &&
    context.permissions.includes(PAGE_PERMISSIONS[page]);
  useEffect(() => {
    if (!allowed || !context) return;
    let active = true;
    const query = new URLSearchParams({
      page: String(filters.page),
      size: "25",
    });
    for (const key of ["q", "state", "decision", "vertical"] as const)
      if (filters[key]) query.set(key, filters[key]);
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (page === "inicio" ? "" : "?" + query),
    );
    const request =
      page === "inicio" ? controlApi.dashboard() : controlApi.list(page, query);
    void request
      .then((value) => {
        if (active) {
          if (page === "inicio") setDashboard(value as Dashboard);
          else setData(value as PageData);
        }
      })
      .catch((failure) => {
        if (active)
          setError(
            failure instanceof Error
              ? failure.message
              : "No pudimos cargar los registros.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [allowed, context, page, filters, revision]);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    const request =
      selected.kind === "application"
        ? controlApi.application(selected.id)
        : selected.kind === "business"
          ? controlApi.business(selected.id)
          : Promise.resolve(selected.user!);
    void request
      .then((value) => {
        if (active) setDetail(value);
      })
      .catch((failure) => {
        if (active)
          setDetailError(
            failure instanceof Error
              ? failure.message
              : "No pudimos cargar el detalle.",
          );
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selected]);
  function done() {
    setSelected(null);
    setDetail(null);
    setNotice("Operación confirmada y registrada en auditoría.");
    refresh();
  }
  function row(item: RecordItem) {
    let title: string,
      subtitle: string,
      fields: Array<[string, ReactNode]>,
      open: (() => void) | undefined;
    if (page === "solicitudes") {
      const value = item as Application;
      title = value.user.name;
      subtitle = value.user.verified
        ? "Identidad vinculada y verificada"
        : "Identidad sin verificar";
      fields = [
        ["Solicitud", <Badge value={value.state} />],
        [
          "Revisión",
          <Badge value={value.platformReview?.decision ?? "PENDING"} />,
        ],
        ["Preferencia", value.selectedPlan ?? "Sin elegir"],
        ["Registro", dateLabel(value.createdAt)],
      ];
      open = () => setSelected({ kind: "application", id: value.id });
    } else if (page === "negocios") {
      const value = item as Business;
      title = value.commercialName;
      subtitle = sectorConfiguration(
        value.vertical as Parameters<typeof sectorConfiguration>[0],
      ).label;
      fields = [
        ["Estado", <Badge value={value.status} />],
        [
          "Propietario",
          value.memberships.map((m) => m.user.displayName).join(", ") ||
            "Sin propietario activo",
        ],
        ["Sucursales", value._count?.branches ?? 0],
        ["Registro", dateLabel(value.createdAt)],
      ];
      open = () => setSelected({ kind: "business", id: value.id });
    } else if (page === "suscripciones") {
      const value = item as Subscription;
      title =
        value.establishment?.commercialName ??
        value.membership?.establishment.commercialName ??
        value.application?.user.displayName ??
        "Relación comercial";
      subtitle =
        value.kind === "manual"
          ? "Piloto manual · sin pago registrado"
          : stateLabel(value.evidenceSource);
      fields = [
        ["Plan", value.plan],
        ["Estado", <Badge value={value.effectiveState ?? value.state} />],
        [
          value.kind === "manual" ? "Vence" : "Activación",
          dateLabel(
            value.kind === "manual" ? value.expiresAt : value.activatedAt,
          ),
        ],
      ];
      if (context!.permissions.includes("applications.read"))
        open = () =>
          setSelected({ kind: "application", id: value.applicationId });
    } else if (page === "usuarios") {
      const value = item as User;
      title = value.displayName;
      subtitle = value.externalIdentities.some(
        (identity) => identity.verifiedAt,
      )
        ? "Identidad verificada"
        : "Sin identidad verificada";
      fields = [
        [
          "Permiso de plataforma",
          value.platformAccess && !value.platformAccess.revokedAt
            ? ROLE_LABELS[value.platformAccess.role]
            : "Sin acceso a Control",
        ],
        ["Membresías", value.memberships.length],
        ["Registro", dateLabel(value.createdAt)],
      ];
      open = () => setSelected({ kind: "user", id: value.id, user: value });
    } else {
      const value = item as Audit;
      title = actions[value.action] ?? value.action;
      subtitle = value.actor.displayName;
      fields = [
        ["Resultado", <Badge value={value.outcome} />],
        ["Fecha", dateLabel(value.createdAt)],
        ["Recurso", value.resourceId ?? "Acceso a Control"],
      ];
    }
    return (
      <li key={item.id} className="control-record">
        <div className="control-record-title">
          {open ? (
            <button className="control-link" disabled={loading} onClick={open}>
              {title}
            </button>
          ) : (
            <strong>{title}</strong>
          )}
          <p>{subtitle}</p>
          <small className="control-id">{item.id}</small>
        </div>
        <Pairs values={fields} />
        {page === "auditoria" && (
          <div className="control-record-audit">
            <p>{(item as Audit).reason}</p>
            <AuditChanges changes={(item as Audit).changes} />
          </div>
        )}
      </li>
    );
  }
  async function logout() {
    try {
      const result = await commercialApi.logout();
      window.location.assign(result.logoutUrl ?? "/login");
    } catch {
      setError("No pudimos cerrar la sesión. Intenta otra vez.");
    }
  }
  return (
    <div className="noma-control">
      <a className="control-skip" href="#control-content">
        Saltar al contenido
      </a>
      <header className="control-header">
        <a href="/" aria-label="Noma · Inicio público">
          <NomaWordmark />
        </a>
        <div className="control-brand">
          <strong>Control</strong>
          <span>Vértice EC · Operación interna</span>
        </div>
        {context && (
          <div className="control-account">
            <span>
              {context.user.name}
              <small>{ROLE_LABELS[context.role]}</small>
            </span>
            <button className="control-secondary" onClick={() => void logout()}>
              Cerrar sesión
            </button>
          </div>
        )}
      </header>
      {checking ? (
        <main className="control-access" role="status">
          Comprobando acceso interno…
        </main>
      ) : !context ? (
        <main className="control-access">
          <p className="control-eyebrow">Acceso de Vértice EC</p>
          <h1>
            {contextError?.status === 403
              ? "Esta cuenta no tiene acceso interno."
              : "Comprueba tu acceso a Noma Control."}
          </h1>
          <p>{contextError?.message}</p>
          <p>
            Utiliza una identidad comercial verificada y un permiso de
            plataforma autorizado. Ser propietario de un negocio no concede
            acceso a Control.
          </p>
          <div className="control-buttons">
            <a className="control-button" href="/login">
              Iniciar sesión con mi cuenta
            </a>
            <button
              className="control-secondary"
              onClick={() => {
                setChecking(true);
                setAccessRevision((value) => value + 1);
              }}
            >
              Comprobar acceso
            </button>
            <a href="/app/establecimiento">Ir a mi negocio</a>
          </div>
          <p className="control-muted">
            Después de iniciar sesión, vuelve a esta dirección. El primer
            propietario se autoriza mediante el procedimiento administrativo
            local.
          </p>
        </main>
      ) : (
        <div className="control-shell">
          <nav className="control-nav" aria-label="Navegación de Noma Control">
            <p className="control-eyebrow">Operación</p>
            {(["inicio", ...CONTROL_PAGES] as ControlPage[])
              .filter((value) =>
                context.permissions.includes(PAGE_PERMISSIONS[value]),
              )
              .map((value) => (
                <a
                  key={value}
                  href={value === "inicio" ? "/control" : `/control/${value}`}
                  aria-current={page === value ? "page" : undefined}
                >
                  {pageNames[value]}
                </a>
              ))}
            <p className="control-nav-foot">
              Permisos de plataforma.
              <br />
              Sin acceso a la operación privada de los negocios.
            </p>
          </nav>
          <main id="control-content" className="control-content" tabIndex={-1}>
            {page === "missing" ? (
              <Empty title="Esta dirección de Control no existe">
                <a href="/control">Volver a pendientes</a>
              </Empty>
            ) : !allowed ? (
              <Empty title="Esta consulta no está habilitada para tu permiso">
                <a href="/control">Volver a pendientes</a>
              </Empty>
            ) : (
              <>
                <div className="control-page-heading">
                  <div>
                    <p className="control-eyebrow">Noma Control</p>
                    <h1>{pageNames[page]}</h1>
                    <p>{descriptions[page]}</p>
                  </div>
                  <button
                    className="control-secondary"
                    disabled={loading}
                    onClick={refresh}
                  >
                    Actualizar
                  </button>
                </div>
                {!context.sensitiveOperationsAvailable && (
                  <p className="control-warning">
                    Consulta disponible. Las operaciones sensibles están
                    bloqueadas hasta disponer de evidencia verificable de MFA.
                  </p>
                )}
                {notice && (
                  <p role="status" className="control-success">
                    {notice}
                  </p>
                )}
                {error && (
                  <p role="alert" className="control-error">
                    {error}
                  </p>
                )}
                {page !== "inicio" && (
                  <form
                    className="control-filters"
                    onSubmit={(event) => {
                      event.preventDefault();
                      setFilters((value) => ({ ...value, q: search, page: 1 }));
                      setSelected(null);
                    }}
                  >
                    <div>
                      <label htmlFor="control-search">
                        {page === "auditoria"
                          ? "ID de actor o recurso"
                          : "Buscar por inicio del nombre o ID"}
                      </label>
                      <input
                        id="control-search"
                        type="search"
                        value={search}
                        maxLength={80}
                        onChange={(event) => setSearch(event.target.value)}
                      />
                    </div>
                    {statusOptions[page] && (
                      <div>
                        <label htmlFor="control-state">Estado</label>
                        <select
                          id="control-state"
                          value={filters.state}
                          onChange={(event) => {
                            setFilters((value) => ({
                              ...value,
                              state: event.target.value,
                              page: 1,
                            }));
                            setSelected(null);
                          }}
                        >
                          <option value="">Todos</option>
                          {statusOptions[page]!.map((value) => (
                            <option key={value} value={value}>
                              {stateLabel(value)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {page === "solicitudes" && (
                      <div>
                        <label htmlFor="control-decision">Revisión</label>
                        <select
                          id="control-decision"
                          value={filters.decision}
                          onChange={(event) =>
                            setFilters((value) => ({
                              ...value,
                              decision: event.target.value,
                              page: 1,
                            }))
                          }
                        >
                          <option value="">Todas</option>
                          {["PENDING", "APPROVED", "REJECTED"].map((value) => (
                            <option key={value} value={value}>
                              {stateLabel(value)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {page === "negocios" && (
                      <div>
                        <label htmlFor="control-vertical">Sector</label>
                        <select
                          id="control-vertical"
                          value={filters.vertical}
                          onChange={(event) =>
                            setFilters((value) => ({
                              ...value,
                              vertical: event.target.value,
                              page: 1,
                            }))
                          }
                        >
                          <option value="">Todos</option>
                          {[
                            "BEAUTY",
                            "DENTAL",
                            "FITNESS",
                            "AUTOMOTIVE",
                            "UNCLASSIFIED",
                          ].map((value) => (
                            <option key={value} value={value}>
                              {
                                sectorConfiguration(
                                  value === "UNCLASSIFIED"
                                    ? null
                                    : (value as Parameters<
                                        typeof sectorConfiguration
                                      >[0]),
                                ).label
                              }
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <button disabled={loading}>Buscar</button>
                  </form>
                )}
                {loading && (
                  <p role="status" className="control-loading">
                    Cargando registros…
                  </p>
                )}
                {page === "inicio"
                  ? dashboard && <DashboardView data={dashboard} />
                  : data && (
                      <div
                        className={`control-workbench ${selected ? "has-detail" : ""}`}
                        aria-busy={loading}
                      >
                        <section aria-label="Registros administrativos">
                          <p className="control-result-count">
                            {data.total}{" "}
                            {data.total === 1 ? "registro" : "registros"} ·
                            página {data.page}
                          </p>
                          {!data.items.length ? (
                            <Empty title="No hay registros para esta consulta">
                              Ajusta la búsqueda o los filtros. Aquí solo
                              aparecen datos registrados.
                            </Empty>
                          ) : (
                            <ul className="control-records">
                              {data.items.map(row)}
                            </ul>
                          )}
                          <nav
                            className="control-pagination"
                            aria-label="Páginas de resultados"
                          >
                            <button
                              className="control-secondary"
                              disabled={loading || data.page <= 1}
                              onClick={() => {
                                setFilters((value) => ({
                                  ...value,
                                  page: value.page - 1,
                                }));
                                setSelected(null);
                              }}
                            >
                              Anterior
                            </button>
                            <span>
                              {data.page} de{" "}
                              {Math.max(1, Math.ceil(data.total / data.size))}
                            </span>
                            <button
                              className="control-secondary"
                              disabled={
                                loading || data.page * data.size >= data.total
                              }
                              onClick={() => {
                                setFilters((value) => ({
                                  ...value,
                                  page: value.page + 1,
                                }));
                                setSelected(null);
                              }}
                            >
                              Siguiente
                            </button>
                          </nav>
                        </section>
                        {selected && (
                          <aside
                            className="control-detail"
                            aria-label="Detalle administrativo"
                          >
                            <button
                              className="control-secondary"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "¿Cerrar el detalle? Descarta cualquier operación que no hayas registrado.",
                                  )
                                )
                                  setSelected(null);
                              }}
                            >
                              Cerrar detalle
                            </button>
                            {detailLoading && (
                              <p role="status">Cargando detalle…</p>
                            )}
                            {detailError && (
                              <p role="alert" className="control-error">
                                {detailError}
                              </p>
                            )}
                            {detail &&
                              selected.kind === "application" &&
                              (() => {
                                const app = detail as Application;
                                return (
                                  <>
                                    <h2>{app.user.name}</h2>
                                    <p className="control-id">{app.id}</p>
                                    <Pairs
                                      values={[
                                        [
                                          "Identidad",
                                          app.user.verified
                                            ? "Verificada"
                                            : "Sin verificar",
                                        ],
                                        ["Solicitud", stateLabel(app.state)],
                                        [
                                          "Preferencia",
                                          app.selectedPlan ?? "Sin elegir",
                                        ],
                                        [
                                          "Revisión",
                                          stateLabel(
                                            app.platformReview?.decision ??
                                              "PENDING",
                                          ),
                                        ],
                                        ["Registro", dateLabel(app.createdAt)],
                                        [
                                          "Piloto",
                                          app.manualActivation
                                            ? `${stateLabel(app.manualActivation.effectiveState)} · vence ${dateLabel(app.manualActivation.expiresAt)}`
                                            : "Sin autorización manual",
                                        ],
                                      ]}
                                    />
                                    {app.user.synthetic && (
                                      <p className="control-warning">
                                        Identidad sintética de pruebas locales.
                                      </p>
                                    )}
                                    <ControlAction
                                      key={app.id}
                                      context={context}
                                      application={app}
                                      onDone={done}
                                    />
                                    <h3>Historial disponible</h3>
                                    {app.history?.length ? (
                                      <ul className="control-history">
                                        {app.history.map((event) => (
                                          <li key={event.id}>
                                            <strong>
                                              {actions[event.action] ??
                                                event.action}
                                            </strong>
                                            <small>
                                              {dateLabel(event.createdAt)} ·{" "}
                                              {event.actor.displayName}
                                            </small>
                                            <p>{event.reason}</p>
                                            <AuditChanges
                                              changes={event.changes}
                                            />
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="control-muted">
                                        Sin registros visibles de historial.
                                      </p>
                                    )}
                                  </>
                                );
                              })()}
                            {detail &&
                              selected.kind === "business" &&
                              (() => {
                                const business = detail as Business;
                                return (
                                  <>
                                    <h2>{business.commercialName}</h2>
                                    <p className="control-id">{business.id}</p>
                                    <Pairs
                                      values={[
                                        [
                                          "Sector",
                                          sectorConfiguration(
                                            business.vertical as Parameters<
                                              typeof sectorConfiguration
                                            >[0],
                                          ).label,
                                        ],
                                        ["Estado", stateLabel(business.status)],
                                        [
                                          "Registro",
                                          dateLabel(business.createdAt),
                                        ],
                                      ]}
                                    />
                                    <h3>Propietarios y acceso</h3>
                                    <ul className="control-plain-list">
                                      {business.memberships.map((item) => (
                                        <li key={item.id}>
                                          {item.user.displayName} ·{" "}
                                          {stateLabel(item.status)}
                                          <small>
                                            {stateLabel(item.role)}
                                            {item.manualActivation
                                              ? ` · piloto ${stateLabel(item.manualActivation.effectiveState)}`
                                              : ""}
                                          </small>
                                        </li>
                                      ))}
                                    </ul>
                                    <h3>Sucursales registradas</h3>
                                    <ul className="control-plain-list">
                                      {business.branches?.map((item) => (
                                        <li key={item.id}>
                                          {item.name}
                                          <small>
                                            {item.timeZone} ·{" "}
                                            {item.active
                                              ? "Activa"
                                              : "Inactiva"}
                                          </small>
                                        </li>
                                      ))}
                                    </ul>
                                    <p className="control-muted">
                                      Esta vista no permite entrar como
                                      propietario ni consultar sus servicios,
                                      clientes o conversaciones.
                                    </p>
                                  </>
                                );
                              })()}
                            {detail &&
                              selected.kind === "user" &&
                              (() => {
                                const user = detail as User;
                                return (
                                  <>
                                    <h2>{user.displayName}</h2>
                                    <p className="control-id">{user.id}</p>
                                    <h3>Identidades vinculadas</h3>
                                    <ul className="control-plain-list">
                                      {user.externalIdentities.map(
                                        (identity) => (
                                          <li key={identity.id}>
                                            {identity.email}
                                            <small>
                                              {identity.verifiedAt
                                                ? "Verificada"
                                                : "Sin verificar"}{" "}
                                              ·{" "}
                                              {identity.synthetic
                                                ? "Prueba sintética"
                                                : "Identidad comercial"}
                                            </small>
                                            <small>{identity.issuer}</small>
                                          </li>
                                        ),
                                      )}
                                    </ul>
                                    <h3>Membresías de negocio</h3>
                                    <ul className="control-plain-list">
                                      {user.memberships.map((item) => (
                                        <li key={item.id}>
                                          {item.establishment.commercialName}
                                          <small>
                                            {stateLabel(item.role)} ·{" "}
                                            {stateLabel(item.status)}
                                          </small>
                                        </li>
                                      ))}
                                    </ul>
                                    <ControlAction
                                      key={user.id}
                                      context={context}
                                      user={user}
                                      onDone={done}
                                    />
                                  </>
                                );
                              })()}
                          </aside>
                        )}
                      </div>
                    )}
              </>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
