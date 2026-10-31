import { useEffect, useState } from "react";
import { offeringApi, type ServiceOffering } from "./api/offering";
import {
  staffApi,
  type Configuration,
  type EntityKind,
  type Mutation,
} from "./api/staff";
import {
  BranchEditor,
  ProfessionalEditor,
  ResourceEditor,
  RequirementsEditor,
} from "./operations/EntityEditors";
import { SchedulesPanel } from "./operations/SchedulesPanel";
import { ProductNavigation, type ProductArea } from "./ProductNavigation";
import { WorkspaceEmpty } from "./WorkspaceEmpty";
import type { SectorTerminology } from "./api/platform";

export type Perform = (
  action: () => Promise<Mutation>,
  select?: boolean,
  message?: string,
) => Promise<void>;
type Area = EntityKind | "schedules";
const areas: { key: Area; label: string; question: string }[] = [
  {
    key: "professionals",
    label: "Profesionales",
    question: "Quién presta tus servicios",
  },
  { key: "branches", label: "Sucursales", question: "Dónde trabaja tu equipo" },
  { key: "schedules", label: "Horarios", question: "Cuándo trabaja" },
  {
    key: "resources",
    label: "Espacios y equipos",
    question: "Sillas, cabinas y salas",
  },
];
export function Operations({
  timeZone,
  onLeave,
  onNavigate,
  sectorTerms,
  enabledAreas,
  onEditingChange,
}: {
  timeZone: string;
  onLeave: () => void;
  onNavigate?: (area: ProductArea) => void;
  sectorTerms?: SectorTerminology;
  enabledAreas?: ProductArea[];
  onEditingChange?: (state: { busy: boolean; dirty: boolean }) => void;
}) {
  const [configuration, setConfiguration] = useState<Configuration | null>(
      null,
    ),
    [services, setServices] = useState<ServiceOffering[]>([]);
  const sectorAreas = areas.map((item) =>
    item.key === "professionals"
      ? { ...item, label: sectorTerms?.professionals ?? item.label }
      : item,
  );
  const [area, setArea] = useState<Area>("professionals"),
    [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editorOpen, setEditorOpen] = useState(false);
  const [resourceMode, setResourceMode] = useState<
    "directory" | "requirements"
  >("directory");
  const [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [revision, setRevision] = useState(0),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void Promise.all([staffApi.configuration(), offeringApi.list()])
      .then(([cfg, list]) => {
        if (active) {
          setConfiguration(cfg);
          setServices(list);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(
            e instanceof Error ? e.message : "No se pudo cargar la operación",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    onEditingChange?.({ busy, dirty });
    return () => onEditingChange?.({ busy: false, dirty: false });
  }, [busy, dirty, onEditingChange]);
  function choose(action: () => void) {
    if (
      busy ||
      (dirty &&
        !window.confirm("Hay cambios operativos sin guardar. ¿Descartarlos?"))
    )
      return;
    setDirty(false);
    setError("");
    setNotice("");
    setRevision((value) => value + 1);
    action();
  }
  const perform: Perform = async (action, select = false, message) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await action();
      setConfiguration(result.configuration);
      if (select) setSelected(result.id);
      setDirty(false);
      setRevision((v) => v + 1);
      setNotice(
        message ?? "Configuración guardada. Puedes recargar para comprobarla.",
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No pudimos guardar. Tu edición se conserva.",
      );
    } finally {
      setBusy(false);
    }
  };
  async function reload() {
    setBusy(true);
    setError("");
    try {
      const [cfg, list] = await Promise.all([
        staffApi.configuration(),
        offeringApi.list(),
      ]);
      setConfiguration(cfg);
      setServices(list);
      setRevision((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos cargar");
    } finally {
      setBusy(false);
    }
  }
  const cfg = configuration;
  const entries = cfg && area !== "schedules" ? cfg[area] : [];
  const filtered = entries.filter((entry) =>
    ("displayName" in entry ? entry.displayName : entry.name)
      .toLocaleLowerCase("es")
      .includes(search.trim().toLocaleLowerCase("es")),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, pages);
  const professional = cfg?.professionals.find(
    (person) => area === "professionals" && person.id === selected,
  );
  const resource = cfg?.resources.find(
    (item) => area === "resources" && item.id === selected,
  );
  const relatedBranches =
    cfg?.branches.filter(
      (branch) =>
        professional?.branchIds.includes(branch.id) ||
        resource?.branchId === branch.id,
    ) ?? [];
  const editorProps = {
    cfg: cfg!,
    services,
    busy,
    perform,
    dirty,
    onProfessionalRemoved: () => {
      setSelected(null);
      setEditorOpen(false);
      requestAnimationFrame(() =>
        document.getElementById("team-search")?.focus(),
      );
    },
  };
  return (
    <section
      className="operations"
      data-area={area}
      aria-labelledby="operations-title"
    >
      <ProductNavigation
        active="operations"
        disabled={busy}
        enabledAreas={enabledAreas}
        onSelect={(area) =>
          choose(() => {
            if (onNavigate) onNavigate(area);
            else onLeave();
          })
        }
      />
      <div className="operations-heading">
        <div>
          <p className="eyebrow">Configuración operativa</p>
          <h1 id="operations-title">Equipo y sucursales</h1>
          <p>
            Define quién presta cada servicio, dónde trabaja y sus horarios
            locales.
          </p>
        </div>
        <button
          type="button"
          className="text-button"
          disabled={busy}
          onClick={() => choose(onLeave)}
        >
          Volver al establecimiento
        </button>
      </div>
      <nav className="operations-tabs" aria-label="Configuración operativa">
        {sectorAreas.map((item) => (
          <button
            key={item.key}
            type="button"
            disabled={busy}
            aria-current={area === item.key ? "page" : undefined}
            onClick={() =>
              choose(() => {
                setArea(item.key);
                setSearch("");
                setPage(1);
                setEditorOpen(false);
                setSelected(null);
              })
            }
          >
            {item.label}
            <small>{item.question}</small>
          </button>
        ))}
      </nav>
      {area === "resources" && (
        <details className="resource-explainer">
          <summary>Ver un ejemplo</summary>
          <p>
            En «Lo que tienes» puedes registrar dos sillones iguales. En «Qué
            usa cada servicio» puedes indicar que un corte usa uno de esos
            sillones.
          </p>
          <p>Si cada silla o equipo es diferente, regístralo por separado.</p>
        </details>
      )}
      <div className="operations-feedback" aria-live="polite">
        {loading && (
          <p role="status" className="loading-message">
            Cargando configuración operativa…
          </p>
        )}
        {notice && (
          <p role="status" className="success-message">
            {notice}
          </p>
        )}
        {busy && <p role="status">Guardando o cargando configuración…</p>}
      </div>
      {error && (
        <div role="alert" className="error-message">
          <p>{error}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => choose(() => void reload())}
          >
            Cargar datos actuales
          </button>
        </div>
      )}
      {cfg && (
        <>
          {area === "resources" && (
            <div className="save-row">
              <button
                type="button"
                disabled={busy}
                aria-pressed={resourceMode === "directory"}
                onClick={() => choose(() => setResourceMode("directory"))}
              >
                Lo que tienes
              </button>
              <button
                type="button"
                disabled={busy}
                aria-pressed={resourceMode === "requirements"}
                onClick={() => choose(() => setResourceMode("requirements"))}
              >
                Qué usa cada servicio
              </button>
            </div>
          )}
          {area !== "schedules" &&
          (area !== "resources" || resourceMode === "directory") ? (
            <div className="operations-workbench" data-editing={editorOpen}>
              <section
                className="operations-directory"
                aria-label="Directorio operativo"
              >
                <div className="operations-directory-heading">
                  <h2>{sectorAreas.find((a) => a.key === area)!.label}</h2>
                  <button
                    disabled={busy}
                    onClick={() =>
                      choose(() => {
                        setSelected(null);
                        setEditorOpen(true);
                        setRevision((v) => v + 1);
                        requestAnimationFrame(() =>
                          document
                            .querySelector<HTMLElement>(
                              ".operations-editor input",
                            )
                            ?.focus(),
                        );
                      })
                    }
                  >
                    {area === "resources" ? (
                      "Añadir espacio o equipo"
                    ) : (
                      <>
                        Crear{" "}
                        {area === "professionals" ? "profesional" : "sucursal"}
                      </>
                    )}
                  </button>
                </div>
                <label htmlFor="team-search">Buscar en este directorio</label>
                <input
                  id="team-search"
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
                {!!entries.length && !filtered.length && (
                  <p role="status">No hay resultados para esta búsqueda.</p>
                )}
                {!entries.length && (
                  <WorkspaceEmpty title="Construye tu operación">
                    {area === "branches"
                      ? "Aún no tienes sucursales. Crea la primera con los datos de tu negocio."
                      : area === "professionals"
                        ? "Aún no tienes profesionales. Regístralos sin crear cuentas de acceso."
                        : "Aún no tienes espacios o equipos registrados."}
                  </WorkspaceEmpty>
                )}
                <ul className="operations-list">
                  {filtered
                    .slice((currentPage - 1) * 20, currentPage * 20)
                    .map((entry) => (
                      <li key={entry.id}>
                        <button
                          disabled={busy}
                          aria-pressed={selected === entry.id}
                          aria-label={`${"displayName" in entry ? entry.displayName : entry.name} · ${entry.active ? "Activo" : "Inactivo"}`}
                          onClick={() =>
                            choose(() => {
                              setSelected(entry.id);
                              setEditorOpen(true);
                              requestAnimationFrame(() =>
                                document
                                  .querySelector<HTMLElement>(
                                    ".operations-editor input",
                                  )
                                  ?.focus(),
                              );
                            })
                          }
                        >
                          <div className="os-entity-mark" aria-hidden="true">
                            {"displayName" in entry
                              ? entry.displayName
                                  .slice(0, 2)
                                  .toLocaleUpperCase("es")
                              : area === "branches"
                                ? "⌂"
                                : "▦"}
                          </div>
                          <strong>
                            {"displayName" in entry
                              ? entry.displayName
                              : entry.name}
                          </strong>
                          <span>
                            {entry.active ? "Activo" : "Inactivo"}
                            {"isDefault" in entry && entry.isDefault
                              ? " · Principal"
                              : ""}
                          </span>
                          {"address" in entry && (
                            <small>
                              {entry.address || "Sin dirección registrada"} ·{" "}
                              {entry.timeZone}
                            </small>
                          )}
                          {"capacity" in entry && (
                            <small>
                              Cantidad total: {entry.capacity} ·{" "}
                              {
                                cfg.branches.find(
                                  (branch) => branch.id === entry.branchId,
                                )?.name
                              }
                            </small>
                          )}
                          {"branchIds" in entry && (
                            <small>
                              {entry.serviceIds.length} servicios ·{" "}
                              {entry.branchIds.length} sucursales
                            </small>
                          )}
                        </button>
                      </li>
                    ))}
                </ul>
                {pages > 1 && (
                  <nav
                    className="os-pagination"
                    aria-label="Páginas del directorio"
                  >
                    <button
                      className="text-button"
                      disabled={currentPage === 1}
                      onClick={() => setPage(currentPage - 1)}
                    >
                      Anterior
                    </button>
                    <span>
                      {currentPage} de {pages}
                    </span>
                    <button
                      className="text-button"
                      disabled={currentPage === pages}
                      onClick={() => setPage(currentPage + 1)}
                    >
                      Siguiente
                    </button>
                  </nav>
                )}
              </section>
              <section
                className="workspace-editor operations-editor"
                aria-label="Ficha operativa"
                onChange={() => {
                  setDirty(true);
                  setNotice("");
                }}
              >
                {!editorOpen ? (
                  <WorkspaceEmpty title="Todo tu equipo, conectado">
                    Elige una ficha o crea una nueva. Cada persona, sucursal y
                    espacio o equipo conserva su propio contexto.
                  </WorkspaceEmpty>
                ) : (
                  <>
                    <button
                      type="button"
                      className="text-button os-panel-close"
                      disabled={busy}
                      onClick={() =>
                        choose(() => {
                          setEditorOpen(false);
                          requestAnimationFrame(() =>
                            document.getElementById("team-search")?.focus(),
                          );
                        })
                      }
                    >
                      ← Volver al directorio
                    </button>
                    {area === "branches" && (
                      <BranchEditor
                        key={`${selected}-${revision}`}
                        {...editorProps}
                        initial={cfg.branches.find((b) => b.id === selected)}
                        timeZone={timeZone}
                      />
                    )}
                    {area === "professionals" && (
                      <ProfessionalEditor
                        key={`${selected}-${revision}`}
                        {...editorProps}
                        initial={cfg.professionals.find(
                          (p) => p.id === selected,
                        )}
                      />
                    )}
                    {area === "resources" && (
                      <ResourceEditor
                        key={`${selected}-${revision}`}
                        {...editorProps}
                        initial={cfg.resources.find((r) => r.id === selected)}
                      />
                    )}
                    {relatedBranches.length > 0 && (
                      <div className="os-relations">
                        <p>Sucursales relacionadas</p>
                        {relatedBranches.map((branch) => (
                          <button
                            key={branch.id}
                            className="text-button"
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              choose(() => {
                                setArea("branches");
                                setSelected(branch.id);
                                setEditorOpen(true);
                                setSearch("");
                                setPage(1);
                                requestAnimationFrame(() =>
                                  document
                                    .querySelector<HTMLElement>(
                                      ".operations-editor input",
                                    )
                                    ?.focus(),
                                );
                              })
                            }
                          >
                            ⌂ {branch.name} ↗
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          ) : area === "schedules" ? (
            <SchedulesPanel
              {...editorProps}
              choose={choose}
              onDirty={() => {
                setDirty(true);
                setNotice("");
              }}
              revision={revision}
            />
          ) : null}
          {area === "resources" && resourceMode === "requirements" && (
            <RequirementsEditor
              {...editorProps}
              revision={revision}
              choose={choose}
              onDirty={() => {
                setDirty(true);
                setNotice("");
              }}
            />
          )}
          <p className="field-help">
            {dirty ? "Cambios sin guardar. " : ""}Esta configuración describe la
            operación; aún no calcula citas disponibles.
          </p>
        </>
      )}
    </section>
  );
}
