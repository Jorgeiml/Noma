import { useEffect } from "react";
export type ProductArea =
  "establishment" | "services" | "operations" | "agenda";
const areas: { id: ProductArea; label: string; hint: string; path: string }[] =
  [
    {
      id: "agenda",
      label: "Agenda",
      hint: "Tu día, organizado",
      path: "M4 5h16v16H4zM8 3v4M16 3v4M4 10h16M8 14h2M14 14h2M8 18h2",
    },
    {
      id: "establishment",
      label: "Negocio",
      hint: "Identidad y preferencias",
      path: "M3 21V8l9-5 9 5v13M9 21v-7h6v7M7 9h1m8 0h1",
    },
    {
      id: "services",
      label: "Servicios",
      hint: "Tu oferta, en orden",
      path: "M8 5h12M8 12h12M8 19h12M3 5h.01M3 12h.01M3 19h.01",
    },
    {
      id: "operations",
      label: "Equipo",
      hint: "Personas, lugares y tiempos",
      path: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 4a4 4 0 0 1 0 8m6 9v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    },
  ];
function focusSelectedSpace(id: ProductArea) {
  window.requestAnimationFrame(() => {
    const selected = document.querySelector(
      '.product-navigation [aria-current="page"]',
    );
    if (
      selected?.getAttribute("aria-label") ===
      areas.find((area) => area.id === id)?.label
    )
      document.getElementById("workspace-content")?.focus();
  });
}
export function ProductNavigation({
  active,
  disabled = false,
  onSelect,
  enabledAreas,
}: {
  active: ProductArea;
  disabled?: boolean;
  onSelect: (area: ProductArea) => void;
  enabledAreas?: ProductArea[];
}) {
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      const target = event.target;
      if (
        !event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.repeat ||
        disabled ||
        (target instanceof HTMLElement &&
          (target.isContentEditable ||
            target.closest("input, textarea, select")))
      )
        return;
      const area = areas[Number(event.key) - 1];
      if (!area || (enabledAreas && !enabledAreas.includes(area.id))) return;
      event.preventDefault();
      if (area.id !== active) {
        onSelect(area.id);
        focusSelectedSpace(area.id);
      }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [active, disabled, enabledAreas, onSelect]);
  return (
    <nav className="product-navigation" aria-label="Navegación principal">
      <div className="navigation-items">
        {areas.map((area, index) => (
          <button
            key={area.id}
            type="button"
            aria-label={area.label}
            aria-keyshortcuts={"Alt+" + (index + 1)}
            title={area.label + " · Alt+" + (index + 1)}
            aria-current={active === area.id ? "page" : undefined}
            disabled={
              disabled ||
              (enabledAreas !== undefined && !enabledAreas.includes(area.id))
            }
            onClick={() => {
              if (active !== area.id) {
                onSelect(area.id);
                focusSelectedSpace(area.id);
              }
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={area.path} />
            </svg>
            <span className="navigation-label">
              {area.label}
              <small>{area.hint}</small>
            </span>
            <span className="space-index" aria-hidden="true">
              0{index + 1}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
