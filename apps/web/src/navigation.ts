import type { ProductArea } from "./ProductNavigation";
export const APP_PATHS: Record<ProductArea, string> = {
  establishment: "/app/establecimiento",
  services: "/app/servicios",
  operations: "/app/equipo",
};
export function safeAppNext(value: string | null) {
  return Object.values(APP_PATHS).includes(value ?? "")
    ? value!
    : APP_PATHS.establishment;
}
export function replacePage(path: string) {
  window.location.replace(path);
}
export function resolveRoute(
  path: string,
  hash = "",
): {
  kind: "landing" | "demo" | "login" | "identity" | "local" | "app" | "missing";
  identityPage?: "signup" | "verify" | "recover" | "activation" | "denied";
  area?: ProductArea;
  redirect?: string;
} {
  if (
    path === "/" &&
    ["#servicios", "#operacion", "#workspace-content"].includes(hash)
  ) {
    const area =
      hash === "#servicios"
        ? "services"
        : hash === "#operacion"
          ? "operations"
          : "establishment";
    return { kind: "app", area, redirect: `${APP_PATHS[area]}?legacy=1` };
  }
  if (path === "/design-lab.html")
    return {
      kind: "login",
      redirect: "/login?next=/app/establecimiento&legacy=1",
    };
  if (path === "/") return { kind: "landing" };
  if (path === "/demo") return { kind: "demo" };
  if (path === "/login") return { kind: "login" };
  const identityRoutes = {
    "/registro": "signup",
    "/verificar-correo": "verify",
    "/recuperar-acceso": "recover",
    "/activacion": "activation",
    "/acceso-no-autorizado": "denied",
  } as const;
  if (path in identityRoutes)
    return {
      kind: "identity",
      identityPage: identityRoutes[path as keyof typeof identityRoutes],
    };
  if (path === "/dev/login") return { kind: "local" };
  if (path === "/app" || path === "/app/")
    return {
      kind: "app",
      area: "establishment",
      redirect: APP_PATHS.establishment,
    };
  const area = (Object.keys(APP_PATHS) as ProductArea[]).find(
    (key) => APP_PATHS[key] === path,
  );
  return area ? { kind: "app", area } : { kind: "missing" };
}
