import { useEffect, useState } from "react";
import { getApiHealth } from "./api/health";

type Connection = "loading" | "connected" | "unavailable";

const statusLabels: Record<Connection, string> = {
  loading: "Comprobando conexión…",
  connected: "API conectada",
  unavailable: "API no disponible",
};

export function App({ compact = false }: { compact?: boolean } = {}) {
  const [connection, setConnection] = useState<Connection>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    void getApiHealth(controller.signal)
      .then(() => {
        if (active) setConnection("connected");
      })
      .catch(() => {
        if (active) setConnection("unavailable");
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);

  function retry(): void {
    setConnection("loading");
    setAttempt((value) => value + 1);
  }

  if (compact)
    return (
      <span className="api-status" data-state={connection}>
        <span className="status-dot" aria-hidden="true" />
        {statusLabels[connection]}
      </span>
    );
  return (
    <main>
      <section className="welcome" aria-labelledby="welcome-title">
        <p className="eyebrow">Belleza y bienestar · Nombre provisional</p>
        <h1 id="welcome-title">
          Plataforma de gestión comercial para belleza y bienestar
        </h1>
        <p className="intro">
          Una base para construir la próxima etapa de tu negocio.
        </p>
        <div className="connection" data-state={connection}>
          <p role="status" aria-live="polite" aria-atomic="true">
            <span className="status-dot" aria-hidden="true" />
            {statusLabels[connection]}
          </p>
          {connection === "unavailable" && (
            <p>Comprueba que la API esté en ejecución y vuelve a intentar.</p>
          )}
          <button
            type="button"
            onClick={retry}
            disabled={connection === "loading"}
          >
            Volver a comprobar
          </button>
        </div>
        <footer>
          <p>Esta aplicación está en fase de desarrollo.</p>
          <span>Entorno: {import.meta.env.MODE}</span>
        </footer>
      </section>
    </main>
  );
}
