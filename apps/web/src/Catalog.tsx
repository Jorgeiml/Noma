import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ApiError } from "./api/platform";
import type { SectorTerminology } from "./api/platform";
import { ProductNavigation, type ProductArea } from "./ProductNavigation";
import { WorkspaceEmpty } from "./WorkspaceEmpty";
import {
  offeringApi,
  blankOffering,
  offeringDraft,
  priceLabel,
  type OfferingDraft,
  type ServiceOffering,
  type PriceMode,
} from "./api/offering";

export function Catalog({
  currency,
  onLeave,
  onNavigate,
  sectorTerms,
  enabledAreas,
  onEditingChange,
}: {
  currency: string;
  onLeave: () => void;
  onNavigate?: (area: ProductArea) => void;
  sectorTerms?: SectorTerminology;
  enabledAreas?: ProductArea[];
  onEditingChange?: (state: { busy: boolean; dirty: boolean }) => void;
}) {
  const [items, setItems] = useState<ServiceOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<ServiceOffering | null>(null);
  const [draft, setDraft] = useState<OfferingDraft | null>(null);
  const [baseline, setBaseline] = useState<OfferingDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [density, setDensity] = useState("comfortable");
  const [page, setPage] = useState(1);
  const nameInput = useRef<HTMLInputElement>(null);
  const dirty = Boolean(
    draft && JSON.stringify(draft) !== JSON.stringify(baseline),
  );
  const editableCurrency = selected?.currency ?? currency;

  useEffect(() => {
    onEditingChange?.({ busy, dirty });
    return () => onEditingChange?.({ busy: false, dirty: false });
  }, [busy, dirty, onEditingChange]);
  function failure(error: unknown): string {
    if (error instanceof ApiError && error.status === 401)
      return "Tu sesión no está autorizada o ha vencido. Conservamos tu edición; copia tus cambios antes de volver a acceder.";
    if (error instanceof ApiError && error.status === 404)
      return "Servicio no disponible en este establecimiento.";
    return error instanceof Error
      ? error.message
      : "No pudimos conectar con el catálogo. Tu edición se conserva.";
  }
  useEffect(() => {
    let active = true;
    void offeringApi
      .list()
      .then((result) => {
        if (active) {
          setItems(result);
          setLoaded(true);
          setLoading(false);
        }
      })
      .catch((error) => {
        if (active) {
          setError(failure(error));
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function allowDiscard(): boolean {
    return (
      !dirty ||
      window.confirm("Hay cambios del servicio sin guardar. ¿Descartarlos?")
    );
  }
  function open(value: ServiceOffering | null): void {
    if (busy || !allowDiscard()) return;
    const next = value ? offeringDraft(value) : blankOffering();
    setSelected(value);
    setDraft(next);
    setBaseline(next);
    setError("");
    setNotice("");
    window.requestAnimationFrame(() => nameInput.current?.focus());
  }
  function leave(): void {
    if (!busy && allowDiscard()) onLeave();
  }
  function change<K extends keyof OfferingDraft>(
    key: K,
    value: OfferingDraft[K],
  ): void {
    setDraft((previous) =>
      previous ? { ...previous, [key]: value } : previous,
    );
    setNotice("");
    setError("");
  }
  function mode(value: PriceMode): void {
    setDraft((previous) =>
      previous
        ? {
            ...previous,
            priceMode: value,
            priceMin:
              value === "ASSESSMENT_REQUIRED"
                ? null
                : (previous.priceMin ?? ""),
            priceMax: value === "RANGE" ? (previous.priceMax ?? "") : null,
            hasPriorAssessment: false,
            assessmentDescription: null,
          }
        : previous,
    );
    setNotice("");
    setError("");
  }
  async function reload(): Promise<void> {
    if (!allowDiscard()) return;
    setLoading(true);
    setError("");
    try {
      setItems(await offeringApi.list());
      setLoaded(true);
      setSelected(null);
      setDraft(null);
      setBaseline(null);
      setNotice("");
    } catch (error) {
      setError(failure(error));
    } finally {
      setLoading(false);
    }
  }
  function remember(value: ServiceOffering): void {
    setItems((previous) =>
      [...previous.filter((item) => item.id !== value.id), value].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    );
    setSelected(value);
    setDraft(offeringDraft(value));
    setBaseline(offeringDraft(value));
  }
  async function save(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!draft || busy) return;
    const data = {
      ...draft,
      category: draft.category?.trim() || null,
      priceMin:
        draft.priceMin === null
          ? null
          : draft.priceMin.trim().replace(",", "."),
      priceMax:
        draft.priceMax === null
          ? null
          : draft.priceMax.trim().replace(",", "."),
    };
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = selected
        ? await offeringApi.update(selected.id, data, selected.version)
        : await offeringApi.create(data, currency);
      remember(result);
      setNotice("Servicio guardado. Tu catálogo está actualizado.");
    } catch (error) {
      setError(failure(error));
    } finally {
      setBusy(false);
    }
  }
  async function toggle(): Promise<void> {
    if (!selected || busy || !allowDiscard()) return;
    if (
      selected.active &&
      !window.confirm("¿Desactivar este servicio? Se conservarán sus datos.")
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await offeringApi.status(
        selected.id,
        !selected.active,
        selected.version,
      );
      remember(result);
      setNotice(
        result.active
          ? "Servicio activado."
          : "Servicio desactivado. Se conserva en tu catálogo.",
      );
    } catch (error) {
      setError(failure(error));
    } finally {
      setBusy(false);
    }
  }
  async function remove(): Promise<void> {
    if (
      !selected ||
      busy ||
      dirty ||
      !window.confirm(
        `¿Eliminar permanentemente «${selected.name}»? También se quitarán sus asignaciones a profesionales y sus requisitos de recursos. Esta acción no se puede deshacer.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await offeringApi.remove(selected.id, selected.version);
      setItems((previous) =>
        previous.filter((item) => item.id !== selected.id),
      );
      setSelected(null);
      setDraft(null);
      setBaseline(null);
      setCategory("all");
      setNotice("Servicio eliminado del catálogo.");
      requestAnimationFrame(() =>
        document.getElementById("catalog-search")?.focus(),
      );
    } catch (error) {
      setError(failure(error));
    } finally {
      setBusy(false);
    }
  }
  const categories = useMemo(
    () =>
      [
        ...new Set(
          items
            .map((item) => item.category)
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort((a, b) => a.localeCompare(b, "es")),
    [items],
  );
  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    return items.filter(
      (item) =>
        (status === "all" || (status === "active") === item.active) &&
        (category === "all" ||
          (category === "uncategorized"
            ? !item.category
            : item.category === category.slice(4))) &&
        (item.name + " " + (item.category ?? ""))
          .toLocaleLowerCase("es")
          .includes(query),
    );
  }, [items, search, status, category]);
  const pages = Math.max(1, Math.ceil(visible.length / 24));
  const currentPage = Math.min(page, pages);
  const paged = visible.slice((currentPage - 1) * 24, currentPage * 24);
  function closeEditor() {
    if (busy || !allowDiscard()) return;
    setDraft(null);
    setSelected(null);
    setBaseline(null);
    setNotice("");
    setError("");
    requestAnimationFrame(() =>
      document.getElementById("catalog-search")?.focus(),
    );
  }
  return (
    <div className="catalog-shell">
      <ProductNavigation
        active="services"
        disabled={busy}
        enabledAreas={enabledAreas}
        onSelect={(area) => {
          if (!busy && allowDiscard()) {
            if (onNavigate) onNavigate(area);
            else onLeave();
          }
        }}
      />
      <div className="catalog-heading">
        <div>
          <p className="eyebrow">Catálogo comercial</p>
          <h1>{sectorTerms?.services ?? "Servicios"}</h1>
        </div>
        <button className="text-button" disabled={busy} onClick={leave}>
          Volver al establecimiento
        </button>
      </div>
      <p className="catalog-caption">
        Precios del catálogo: un importe orientativo no es una cotización
        aceptada ni un pago.
      </p>
      {notice && (
        <p role="status" className="success-message">
          {notice}
        </p>
      )}
      <div
        className="catalog-layout"
        data-editing={Boolean(draft)}
        data-density={density}
      >
        <section className="catalog-index" aria-label="Explorar servicios">
          <div className="catalog-index-heading">
            <h2>Catálogo de servicios</h2>
            <button
              disabled={busy || loading || !loaded}
              onClick={() => open(null)}
            >
              Crear servicio
            </button>
          </div>
          <div className="catalog-filters">
            <div>
              <label htmlFor="catalog-search">
                Buscar por nombre o categoría
              </label>
              <input
                id="catalog-search"
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div>
              <label htmlFor="catalog-filter">Mostrar servicios</label>
              <select
                id="catalog-filter"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
          </div>
          <div className="catalog-filters">
            <div>
              <label htmlFor="catalog-category">Categoría</label>
              <select
                id="catalog-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">Todas las categorías</option>
                <option value="uncategorized">Sin categoría</option>
                {categories.map((value) => (
                  <option key={value} value={"cat:" + value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="catalog-density">Densidad de lista</label>
              <select
                id="catalog-density"
                value={density}
                onChange={(e) => setDensity(e.target.value)}
              >
                <option value="comfortable">Cómoda</option>
                <option value="compact">Compacta</option>
              </select>
            </div>
          </div>
          {loading ? (
            <p role="status" className="loading-message">
              Cargando catálogo…
            </p>
          ) : loaded ? (
            <>
              <p className="catalog-count">
                {visible.length}{" "}
                {visible.length === 1 ? "servicio" : "servicios"}
              </p>
              {!items.length && (
                <WorkspaceEmpty title="Tu próximo servicio empieza aquí">
                  Aún no hay servicios. Crea el primero con los datos de tu
                  establecimiento.
                </WorkspaceEmpty>
              )}
              {!!items.length && !visible.length && (
                <p>No hay servicios que coincidan con esta búsqueda.</p>
              )}
              <ul className="offering-list">
                {paged.map((item) => (
                  <li key={item.id}>
                    <button
                      className="offering-row"
                      aria-label={`${item.name} · ${priceLabel(item)} · ${item.category ?? "Sin categoría"} · ${item.durationMinutes} min · ${item.active ? "Activo" : "Inactivo"}`}
                      aria-pressed={selected?.id === item.id}
                      disabled={busy}
                      onClick={() => open(item)}
                    >
                      <span className="offering-name">{item.name}</span>
                      <span className="offering-price">{priceLabel(item)}</span>
                      <span className="offering-meta">
                        {item.category ?? "Sin categoría"} ·{" "}
                        {item.durationMinutes} min ·{" "}
                        {item.active ? "Activo" : "Inactivo"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {pages > 1 && (
                <nav
                  className="os-pagination"
                  aria-label="Páginas del catálogo"
                >
                  <button
                    className="text-button"
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Anterior
                  </button>
                  <span>
                    Página {currentPage} de {pages}
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
            </>
          ) : (
            <p>No se pudo consultar el catálogo. Puedes volver a intentarlo.</p>
          )}
          <button
            className="text-button"
            disabled={busy || loading}
            onClick={() => void reload()}
          >
            Actualizar catálogo
          </button>
        </section>
        <section
          className="catalog-editor workspace-editor"
          aria-label="Editor de servicio"
        >
          {!draft ? (
            <WorkspaceEmpty title="Selecciona un servicio">
              Elige uno del catálogo para ajustar sus detalles, o crea el
              primero. Conservaremos tu búsqueda mientras editas.
            </WorkspaceEmpty>
          ) : (
            <form onSubmit={(event) => void save(event)}>
              <button
                type="button"
                className="text-button os-panel-close"
                disabled={busy}
                onClick={closeEditor}
              >
                ← Volver al catálogo
              </button>
              <div className="editor-heading">
                <h2>{selected ? "Editar servicio" : "Crear servicio"}</h2>
                <span className="state-label">
                  {busy
                    ? "Guardando…"
                    : dirty
                      ? "Cambios pendientes"
                      : selected
                        ? "Guardado"
                        : "Nuevo servicio"}
                </span>
              </div>
              <fieldset disabled={busy}>
                <legend className="sr-only">Datos del servicio</legend>
                <label htmlFor="service-name">Nombre del servicio</label>
                <input
                  ref={nameInput}
                  id="service-name"
                  maxLength={120}
                  required
                  value={draft.name}
                  onChange={(event) => change("name", event.target.value)}
                />
                <div className="form-pair">
                  <div>
                    <label htmlFor="service-category">
                      Categoría <small>Opcional</small>
                    </label>
                    <input
                      id="service-category"
                      maxLength={80}
                      value={draft.category ?? ""}
                      onChange={(event) =>
                        change("category", event.target.value || null)
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor="service-duration">
                      Duración en minutos
                    </label>
                    <input
                      id="service-duration"
                      type="number"
                      min={1}
                      max={2147483647}
                      step={1}
                      required
                      value={
                        Number.isNaN(draft.durationMinutes)
                          ? ""
                          : draft.durationMinutes
                      }
                      onChange={(event) =>
                        change("durationMinutes", event.target.valueAsNumber)
                      }
                    />
                  </div>
                </div>
                <label htmlFor="service-description">Descripción</label>
                <textarea
                  id="service-description"
                  rows={3}
                  maxLength={2000}
                  value={draft.description}
                  onChange={(event) =>
                    change("description", event.target.value)
                  }
                />
                <label htmlFor="service-price-mode">Modalidad de precio</label>
                <select
                  id="service-price-mode"
                  value={draft.priceMode}
                  onChange={(event) => mode(event.target.value as PriceMode)}
                >
                  <option value="FIXED">Precio fijo</option>
                  <option value="FROM">Desde un precio mínimo</option>
                  <option value="RANGE">Rango de precios</option>
                  <option value="ASSESSMENT_REQUIRED">
                    Precio sujeto a valoración
                  </option>
                </select>
                {draft.priceMode !== "ASSESSMENT_REQUIRED" ? (
                  <div className="form-pair">
                    <div>
                      <label htmlFor="service-price-min">
                        {draft.priceMode === "FIXED"
                          ? "Precio exacto"
                          : "Precio mínimo"}{" "}
                        ({editableCurrency})
                      </label>
                      <input
                        id="service-price-min"
                        type="text"
                        inputMode="decimal"
                        required
                        value={draft.priceMin ?? ""}
                        onChange={(event) =>
                          change("priceMin", event.target.value)
                        }
                      />
                    </div>
                    {draft.priceMode === "RANGE" && (
                      <div>
                        <label htmlFor="service-price-max">
                          Precio máximo ({editableCurrency})
                        </label>
                        <input
                          id="service-price-max"
                          type="text"
                          inputMode="decimal"
                          required
                          value={draft.priceMax ?? ""}
                          onChange={(event) =>
                            change("priceMax", event.target.value)
                          }
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="assessment-note">
                    <p>
                      Precio sujeto a valoración. No se registra un precio
                      definitivo ni un importe cero.
                    </p>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={draft.hasPriorAssessment}
                        onChange={(event) => {
                          change("hasPriorAssessment", event.target.checked);
                          if (!event.target.checked)
                            change("assessmentDescription", null);
                        }}
                      />
                      El negocio tiene una evaluación previa descrita
                    </label>
                    {draft.hasPriorAssessment && (
                      <>
                        <label htmlFor="service-assessment">
                          Descripción de la evaluación previa
                        </label>
                        <textarea
                          id="service-assessment"
                          rows={3}
                          maxLength={1000}
                          required
                          value={draft.assessmentDescription ?? ""}
                          onChange={(event) =>
                            change(
                              "assessmentDescription",
                              event.target.value || null,
                            )
                          }
                        />
                      </>
                    )}
                    <p className="field-help">
                      Si aún no se describe, la necesidad de valoración
                      continúa. No se crean citas, presupuestos ni cobros.
                    </p>
                  </div>
                )}
              </fieldset>
              <div className="save-row">
                <button disabled={busy || (!!selected && !dirty)}>
                  {busy ? "Guardando servicio…" : "Guardar servicio"}
                </button>
                {selected && (
                  <button
                    type="button"
                    className="text-button"
                    disabled={busy}
                    onClick={() => void toggle()}
                  >
                    {selected.active
                      ? "Desactivar servicio"
                      : "Activar servicio"}
                  </button>
                )}
                {selected && (
                  <button
                    type="button"
                    className="text-button danger-button"
                    disabled={busy || dirty}
                    onClick={() => void remove()}
                  >
                    Eliminar servicio
                  </button>
                )}
              </div>
            </form>
          )}
          {error && (
            <p role="alert" className="error-message">
              {error}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
