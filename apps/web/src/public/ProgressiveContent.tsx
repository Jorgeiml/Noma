import {
  Component,
  lazy,
  memo,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
const LandingBody = lazy(() => import("./LandingBody"));
const anchors = ["#recorrido", "#sectores", "#planes", "#estado", "#preguntas"];
class ContentBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <section className="noma-content-placeholder" role="alert">
        <h2>No pudimos cargar el recorrido.</h2>
        <p>
          El producto sigue en desarrollo. No hay contratación automática.
          Puedes reintentar o visitar la demo pública.
        </p>
        <button
          className="noma-button"
          onClick={() => window.location.reload()}
        >
          Volver a cargar
        </button>
        <a className="noma-text-link" href="/demo">
          Ir a la demo
        </a>
      </section>
    ) : (
      this.props.children
    );
  }
}
export const ProgressiveContent = memo(function ProgressiveContent() {
  const [requested, setRequested] = useState(() =>
    anchors.includes(window.location.hash),
  );
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onHash = () => {
      if (anchors.includes(window.location.hash)) setRequested(true);
    };
    window.addEventListener("hashchange", onHash);
    const observer =
      !requested && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              if (entries.some((entry) => entry.isIntersecting))
                setRequested(true);
            },
            { rootMargin: "0px 0px 100px 0px" },
          )
        : null;
    if (sentinel.current) observer?.observe(sentinel.current);
    return () => {
      window.removeEventListener("hashchange", onHash);
      observer?.disconnect();
    };
  }, [requested]);
  const placeholder = (
    <section className="noma-content-placeholder">
      {anchors.map((hash) => (
        <span id={hash.slice(1)} key={hash} />
      ))}
      <p className="noma-kicker">SIN UN RECORRIDO INTERMINABLE</p>
      <h2>Ve directo a lo que te interesa.</h2>
      <p>
        Cómo funciona, tu sector, precios y respuestas. Tú eliges qué explorar.
      </p>
      {requested ? (
        <p role="status">Cargando el recorrido…</p>
      ) : (
        <button className="noma-button" onClick={() => setRequested(true)}>
          Explorar Noma<span aria-hidden="true">↓</span>
        </button>
      )}
      <a className="noma-text-link" href="/demo">
        Ir directamente a la demo
      </a>
    </section>
  );
  return (
    <div ref={sentinel}>
      {requested ? (
        <ContentBoundary>
          <Suspense fallback={placeholder}>
            <LandingBody />
          </Suspense>
        </ContentBoundary>
      ) : (
        placeholder
      )}
    </div>
  );
});
