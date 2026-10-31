import { useState, type FormEvent } from "react";
import type { Establishment, EstablishmentDraft } from "./api/platform";
import { SectorSummary } from "./SectorSummary";
import { BusinessLogo } from "./BusinessLogo";
const currencyNames = new Intl.DisplayNames("es", { type: "currency" });
export function BusinessProfile({
  saved,
  draft,
  busy,
  dirty,
  notice,
  change,
  onSave,
  onReload,
  onDiscard,
  onLogoSaved,
  onLogoBusy,
}: {
  saved: Establishment;
  draft: EstablishmentDraft;
  busy: boolean;
  dirty: boolean;
  notice: string;
  change: (key: keyof EstablishmentDraft, value: string) => void;
  onSave: (event: FormEvent) => void;
  onReload: () => void;
  onDiscard: () => void;
  onLogoSaved: (value: Establishment) => void;
  onLogoBusy: (value: boolean) => void;
}) {
  const [section, setSection] = useState<"profile" | "preferences">("profile");
  function select(next: typeof section) {
    if (next === section || busy) return;
    if (dirty) {
      if (
        !window.confirm("Hay cambios del negocio sin guardar. ¿Descartarlos?")
      )
        return;
      onDiscard();
    }
    setSection(next);
  }
  return (
    <div className="business-space">
      <div className="os-space-heading">
        <div>
          <p className="eyebrow">Tu base de operaciones</p>
          <h1>Negocio</h1>
          <p>Un lugar para tu identidad y las preferencias de tu operación.</p>
        </div>
        <span className="os-live-status">
          {saved.status === "ACTIVE"
            ? "Establecimiento activo"
            : "Establecimiento inactivo"}
        </span>
      </div>
      <div className="business-layout">
        <aside className="business-context">
          <BusinessLogo
            saved={saved}
            disabled={busy || dirty}
            onSaved={onLogoSaved}
            onBusyChange={onLogoBusy}
          />
          <h2>{saved.commercialName}</h2>
          <SectorSummary configuration={saved.sectorConfiguration} />
        </aside>
        <div className="business-detail">
          <nav className="os-segments" aria-label="Información del negocio">
            <button
              type="button"
              disabled={busy}
              aria-pressed={section === "profile"}
              onClick={() => select("profile")}
            >
              Perfil comercial
            </button>
            <button
              type="button"
              disabled={busy}
              aria-pressed={section === "preferences"}
              onClick={() => select("preferences")}
            >
              Preferencias
            </button>
          </nav>

          <form onSubmit={onSave}>
            <div className="editor-heading">
              <div>
                <p className="eyebrow">
                  {section === "profile"
                    ? "Identidad comercial"
                    : "Preferencias operativas"}
                </p>
                <h2>
                  {section === "profile"
                    ? "Los datos que te representan."
                    : "A tu hora. En tu moneda."}
                </h2>
              </div>
              <span className="state-label">
                {busy
                  ? "Guardando…"
                  : dirty
                    ? "Cambios pendientes"
                    : "Sin cambios pendientes"}
              </span>
            </div>
            <fieldset disabled={busy}>
              <legend className="sr-only">
                Datos editables del establecimiento
              </legend>
              {section === "profile" && (
                <>
                  <label htmlFor="commercial-name">Nombre comercial</label>
                  <input
                    id="commercial-name"
                    required
                    maxLength={120}
                    value={draft.commercialName}
                    onChange={(event) =>
                      change("commercialName", event.target.value)
                    }
                  />
                  <div className="form-pair">
                    <div>
                      <label htmlFor="business-phone">
                        Teléfono comercial <small>Opcional</small>
                      </label>
                      <input
                        id="business-phone"
                        type="tel"
                        maxLength={32}
                        value={draft.businessPhone ?? ""}
                        onChange={(event) =>
                          change("businessPhone", event.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="website-url">
                        Sitio web <small>Opcional</small>
                      </label>
                      <input
                        id="website-url"
                        type="url"
                        maxLength={250}
                        placeholder="https://"
                        value={draft.websiteUrl ?? ""}
                        onChange={(event) =>
                          change("websiteUrl", event.target.value)
                        }
                      />
                    </div>
                  </div>
                </>
              )}
              {section === "preferences" && (
                <>
                  <div className="form-pair">
                    <div>
                      <label htmlFor="time-zone">Zona horaria</label>
                      <select
                        id="time-zone"
                        value={draft.timeZone}
                        onChange={(event) =>
                          change("timeZone", event.target.value)
                        }
                      >
                        {Array.from(
                          new Set([
                            draft.timeZone,
                            ...Intl.supportedValuesOf("timeZone"),
                          ]),
                        )
                          .sort()
                          .map((zone) => (
                            <option key={zone} value={zone}>
                              {zone.replaceAll("_", " ")}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="currency">Moneda operativa</label>
                      <select
                        id="currency"
                        value={draft.currency}
                        onChange={(event) =>
                          change("currency", event.target.value)
                        }
                      >
                        {Intl.supportedValuesOf("currency").map((currency) => (
                          <option key={currency} value={currency}>
                            {currency} · {currencyNames.of(currency)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="field-help">
                    Zona horaria y moneda del establecimiento. No limitan el
                    negocio a una ciudad ni configuran sucursales.
                  </p>
                </>
              )}
            </fieldset>
            <div className="save-row">
              <button disabled={busy || !dirty}>
                {busy ? "Guardando cambios…" : "Guardar cambios"}
              </button>
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={onReload}
              >
                Cargar datos actuales
              </button>
            </div>
            {notice && (
              <p role="status" className="success-message">
                {notice}
              </p>
            )}
            <p className="last-saved">
              Último guardado:{" "}
              {new Intl.DateTimeFormat("es-EC", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: saved.timeZone,
              }).format(new Date(saved.updatedAt))}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
