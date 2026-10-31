import { NotFoundException, ForbiddenException } from "@nestjs/common";

export function localAccessAllowed(env: NodeJS.ProcessEnv): boolean {
  try {
    const url = new URL(env.DATABASE_URL ?? "");
    return (
      env.NODE_ENV === "development" &&
      env.APP_ENV === "local" &&
      env.LOCAL_ACCESS_ENABLED === "true" &&
      ["postgresql:", "postgres:"].includes(url.protocol) &&
      ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) &&
      [...url.searchParams.keys()].every((key) => key === "schema") &&
      (!url.searchParams.has("schema") ||
        url.searchParams.get("schema") === "public")
    );
  } catch {
    return false;
  }
}

export function requireLocalAccess(env = process.env): void {
  if (!localAccessAllowed(env))
    throw new NotFoundException("Acceso local deshabilitado");
}

export function requireLocalRequest(address: string | undefined): void {
  if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(address ?? "")) {
    throw new ForbiddenException("Acceso exclusivamente local");
  }
}

export function requireOrigin(origin: string | undefined): void {
  if (origin !== (process.env.WEB_ORIGIN ?? "http://localhost:5173")) {
    throw new ForbiddenException("Origen no autorizado");
  }
}
