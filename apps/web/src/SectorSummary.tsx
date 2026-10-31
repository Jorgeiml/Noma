import type { SectorConfiguration } from "./api/platform";
export function SectorSummary({
  configuration: config,
}: {
  configuration: SectorConfiguration | undefined;
}) {
  if (!config)
    return (
      <section
        className="sector-summary"
        aria-label="Sector del establecimiento"
      >
        <h2>Sector no disponible</h2>
        <p role="alert">
          No se pudo resolver la configuración sectorial. Las operaciones
          permanecen deshabilitadas.
        </p>
      </section>
    );
  return (
    <section className="sector-summary" aria-labelledby="sector-title">
      <p className="eyebrow">Sector del establecimiento</p>
      <h2 id="sector-title">{config.label}</h2>
      <p className="field-help">
        Clasificación administrada. Se utiliza para adaptar las herramientas de
        tu negocio.
      </p>
      {config.status === "UNCLASSIFIED" ? (
        <p role="status">
          La clasificación está pendiente. Solicítala al administrador del
          entorno. Se conservan tus datos; el catálogo y el equipo se
          habilitarán cuando corresponda.
        </p>
      ) : config.status === "PLANNED" ? (
        <p role="status">
          La operación de este sector aún no está habilitada. Tus datos se
          conservan.
        </p>
      ) : (
        <details>
          <summary>Herramientas de este negocio</summary>
          <ul className="sector-capabilities">
            {(
              Object.keys(config.capabilities) as Array<
                keyof typeof config.capabilities
              >
            )
              .filter((key) => config.capabilities[key] === "IMPLEMENTED")
              .map((key) => (
                <li key={key}>{config.capabilityLabels[key]}</li>
              ))}
          </ul>
        </details>
      )}
    </section>
  );
}
