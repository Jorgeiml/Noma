import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const envPath = fileURLToPath(new URL("../apps/api/.env", import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);
const rawPort = process.env.API_PORT ?? "3000";
const port = Number(rawPort);
if (
  !/^\d+$/.test(rawPort) ||
  !Number.isInteger(port) ||
  port < 1 ||
  port > 65535
) {
  console.error("API_PORT debe ser un entero entre 1 y 65535.");
  process.exitCode = 1;
} else {
  for (const [path, service] of [
    ["/api/health", "api"],
    ["/api/health/db", "database"],
  ]) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        signal: AbortSignal.timeout(4000),
      });
      const body = await response.json();
      if (
        response.status !== 200 ||
        body?.status !== "ok" ||
        body?.service !== service
      ) {
        throw new Error();
      }
      console.log(`${path}: HTTP 200, contrato válido`);
    } catch {
      console.error(
        `${path}: no disponible o respuesta inválida. Inicia la API y PostgreSQL.`,
      );
      process.exitCode = 1;
    }
  }
}
