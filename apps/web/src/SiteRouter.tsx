import { lazy, Suspense, useEffect } from "react";
import { resolveRoute, replacePage } from "./navigation";
import { Landing } from "./public/Landing";
import { PublicHeader, PublicFooter } from "./public/PublicChrome";
const PrivateEntry = lazy(() => import("./PrivateEntry"));
const DemoPage = lazy(() => import("./public/DemoPage"));
const CommercialAccess = lazy(() => import("./CommercialAccess"));
const ControlPanel = lazy(() => import("./control/ControlPanel"));
export function SiteRouter() {
  const route = resolveRoute(window.location.pathname, window.location.hash);
  useEffect(() => {
    if (route.redirect) window.history.replaceState(null, "", route.redirect);
    const handleLegacyHash = () => {
      const next = resolveRoute(window.location.pathname, window.location.hash);
      if (next.redirect) replacePage(next.redirect);
    };
    window.addEventListener("hashchange", handleLegacyHash);
    return () => window.removeEventListener("hashchange", handleLegacyHash);
  }, [route.redirect]);
  if (
    window.location.pathname === "/control" ||
    window.location.pathname.startsWith("/control/")
  )
    return (
      <Suspense
        fallback={
          <main className="private-loading" role="status">
            Preparando Noma Control…
          </main>
        }
      >
        <ControlPanel />
      </Suspense>
    );
  if (route.kind === "landing") return <Landing />;
  if (route.kind === "demo")
    return (
      <Suspense
        fallback={
          <div className="noma-site">
            <PublicHeader />
            <main className="noma-route-loading" role="status">
              Preparando la demostración ilustrativa…
            </main>
          </div>
        }
      >
        <DemoPage />
      </Suspense>
    );
  if (route.kind === "login" || route.kind === "identity")
    return (
      <Suspense
        fallback={
          <main className="private-loading" role="status">
            Preparando tu acceso…
          </main>
        }
      >
        <CommercialAccess
          page={
            route.kind === "login" ? "login" : (route.identityPage ?? "login")
          }
        />
      </Suspense>
    );
  if (route.kind === "app" || route.kind === "local")
    return (
      <Suspense
        fallback={
          <main className="private-loading" role="status">
            Comprobando acceso autorizado…
          </main>
        }
      >
        <PrivateEntry
          mode={route.kind === "local" ? "login" : "app"}
          area={route.area}
        />
      </Suspense>
    );
  return (
    <div className="noma-site">
      <PublicHeader />
      <main className="noma-missing">
        <p className="noma-kicker">404 · ESTE ENLACE NO EXISTE</p>
        <h1>Vamos a un lugar conocido.</h1>
        <p>Esta dirección no corresponde a una pantalla de Noma.</p>
        <a className="noma-button" href="/">
          Volver al inicio <span aria-hidden="true">↗</span>
        </a>
        <a className="noma-text-link" href="/login">
          Acceder a mi establecimiento
        </a>
      </main>
      <PublicFooter />
    </div>
  );
}
