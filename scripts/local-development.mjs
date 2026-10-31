import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { serve, stopCommand, statusCommand } from "./dev-runtime.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const apiEnv = fileURLToPath(new URL("../apps/api/.env", import.meta.url));
if (existsSync(apiEnv)) process.loadEnvFile(apiEnv);
const [mode, ...args] = process.argv.slice(2);
if (
  ![
    "serve",
    "stop",
    "status",
    "owner",
    "access",
    "sector",
    "commercial",
  ].includes(mode) ||
  (process.env.NODE_ENV && process.env.NODE_ENV !== "development") ||
  (process.env.APP_ENV && process.env.APP_ENV !== "local")
) {
  console.error(
    "Este comando es exclusivamente local; no puede ejecutarse en producción, staging ni test.",
  );
  process.exitCode = 1;
} else if (!process.env.npm_execpath) {
  console.error("Ejecuta este comando mediante pnpm.");
  process.exitCode = 1;
} else if (["serve", "stop", "status"].includes(mode)) {
  try {
    if (mode === "serve") {
      if (args.length)
        throw new Error(
          "dev:local no admite argumentos; usa dev:status o dev:stop.",
        );
      process.env.NODE_ENV = "development";
      process.env.APP_ENV = "local";
      process.env.LOCAL_ACCESS_ENABLED = "true";
      await serve();
    } else if (mode === "status") {
      const { values } = parseArgs({
        args,
        options: { json: { type: "boolean" } },
      });
      await statusCommand(values.json);
    } else {
      const { values } = parseArgs({
        args,
        options: {
          instance: { type: "string" },
          pid: { type: "string" },
          started: { type: "string" },
        },
      });
      if (
        (values.pid && !values.started) ||
        (!values.pid && values.started) ||
        (values.pid && values.instance)
      )
        throw new Error(
          "Usa dev:stop, --instance ID, o --pid PID --started FECHA después de comprobar el propietario.",
        );
      await stopCommand(values);
    }
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "No se pudo gestionar el entorno local.",
    );
    process.exitCode = 1;
  }
} else {
  const command =
    mode === "serve"
      ? ["dev"]
      : [
          "--filter",
          "@beauty-wellness/api",
          mode === "access"
            ? "dev:access"
            : mode === "commercial"
              ? "dev:commercial"
              : mode === "sector"
                ? "dev:sector"
                : "dev:owner",
          ...args,
        ];
  const child = spawn(
    process.execPath,
    [process.env.npm_execpath, ...command],
    {
      cwd: root,
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "development",
        APP_ENV: "local",
        LOCAL_ACCESS_ENABLED: "true",
      },
    },
  );
  child.on("error", () => {
    console.error("No se pudo ejecutar el comando local.");
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    process.exitCode = code ?? 1;
  });
}
