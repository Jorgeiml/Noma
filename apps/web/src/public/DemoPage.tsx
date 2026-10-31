import { PublicHeader, PublicFooter } from "./PublicChrome";
import ScenarioDemo from "./ScenarioDemo";
import "./public.css";
export default function DemoPage() {
  return (
    <div className="noma-site">
      <PublicHeader />
      <main id="noma-content" className="noma-demo-page">
        <div className="noma-section-heading">
          <p className="noma-kicker">EL RECORRIDO, PASO A PASO</p>
          <h1>
            De una pregunta
            <br />a una posibilidad.
          </h1>
          <p>
            Explora la recepción que estamos construyendo. Una explicación
            interactiva, sin conexión a datos de establecimientos.
          </p>
        </div>
        <ScenarioDemo />
        <a className="noma-text-link" href="/#estado">
          Ver qué está implementado hoy <span aria-hidden="true">↗</span>
        </a>
      </main>
      <PublicFooter />
    </div>
  );
}
