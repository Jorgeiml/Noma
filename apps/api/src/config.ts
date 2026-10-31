export interface ApiConfig {
  port: number;
  webOrigin: string;
  environment: "development" | "test" | "production";
}

export function loadConfig(env: NodeJS.ProcessEnv): ApiConfig {
  const environment = env.NODE_ENV ?? "development";
  if (!["development", "test", "production"].includes(environment)) {
    throw new Error("NODE_ENV debe ser development, test o production.");
  }

  const rawPort = env.API_PORT ?? "3000";
  const port = Number(rawPort);
  if (
    !/^\d+$/.test(rawPort) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error("API_PORT debe ser un entero entre 1 y 65535.");
  }

  if (environment === "production" && !env.WEB_ORIGIN) {
    throw new Error("WEB_ORIGIN es obligatorio en production.");
  }
  const webOrigin = env.WEB_ORIGIN ?? "http://localhost:5173";
  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(webOrigin);
  } catch {
    throw new Error("WEB_ORIGIN debe ser un origen HTTP o HTTPS válido.");
  }
  if (
    !["http:", "https:"].includes(parsedOrigin.protocol) ||
    parsedOrigin.origin !== webOrigin ||
    parsedOrigin.username ||
    parsedOrigin.password
  ) {
    throw new Error(
      "WEB_ORIGIN debe indicar un único origen, sin ruta ni credenciales.",
    );
  }

  return {
    port,
    webOrigin,
    environment: environment as ApiConfig["environment"],
  };
}
