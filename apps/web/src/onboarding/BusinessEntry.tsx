import { useEffect, useState, type ReactNode } from "react";
import { ApiError, request } from "../api/platform";
import { replacePage } from "../navigation";
export function BusinessEntry({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    void request<{ needsOnboarding: boolean }>("/onboarding/entry")
      .then((value) => {
        if (active) {
          if (value.needsOnboarding) replacePage("/onboarding");
          else setReady(true);
        }
      })
      .catch((failure) => {
        if (active) {
          if (
            failure instanceof ApiError &&
            [401, 403].includes(failure.status)
          )
            setReady(true);
          else
            setError(
              "No pudimos comprobar tu configuración. Tu progreso guardado se conserva.",
            );
        }
      });
    return () => {
      active = false;
    };
  }, [revision]);
  if (ready) return children;
  return (
    <main className="private-loading" role={error ? "alert" : "status"}>
      <p>{error || "Recuperando tu espacio de trabajo…"}</p>
      {error && (
        <button
          onClick={() => {
            setError("");
            setRevision((v) => v + 1);
          }}
        >
          Reintentar
        </button>
      )}
    </main>
  );
}
