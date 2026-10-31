export interface ApiHealth {
  status: "ok";
  service: "api";
}

export async function getApiHealth(signal: AbortSignal): Promise<ApiHealth> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/health`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("La API no está disponible.");

  const body: unknown = await response.json();
  if (
    typeof body !== "object" ||
    body === null ||
    !("status" in body) ||
    body.status !== "ok" ||
    !("service" in body) ||
    body.service !== "api"
  ) {
    throw new Error("La respuesta de la API no es válida.");
  }
  return { status: "ok", service: "api" };
}
