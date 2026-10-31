import { Workspace } from "./Workspace";
import type { ProductArea } from "./ProductNavigation";
import "./styles.css";
import { useEffect, useState } from "react";
import { commercialApi } from "./api/commercial";
function LocalEntry({ area }: { area?: ProductArea }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    void commercialApi
      .configuration()
      .then((config) => {
        if (active) setAllowed(config.localEnabled);
      })
      .catch(() => {
        if (active) setAllowed(false);
      });
    return () => {
      active = false;
    };
  }, []);
  if (allowed === null)
    return (
      <main className="private-loading" role="status">
        Comprobando el entorno local…
      </main>
    );
  if (!allowed)
    return (
      <main className="private-loading">
        <h1>Acceso no disponible.</h1>
        <a href="/login">Ir al acceso comercial</a>
      </main>
    );
  return <Workspace routeMode="login" initialArea={area} />;
}
export default function PrivateEntry({
  mode,
  area,
}: {
  mode: "app" | "login";
  area?: ProductArea;
}) {
  return mode === "login" ? (
    <LocalEntry area={area} />
  ) : (
    <Workspace routeMode="app" initialArea={area} />
  );
}
