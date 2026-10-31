import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const result = spawnSync(
  "docker",
  [
    "compose",
    "exec",
    "-T",
    "postgres",
    "sh",
    "-c",
    'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"',
  ],
  { cwd: fileURLToPath(new URL("../", import.meta.url)), stdio: "inherit" },
);
if (result.error)
  console.error("No se pudo ejecutar Docker. Revisa Docker Desktop y el PATH.");
process.exitCode = result.status ?? 1;
