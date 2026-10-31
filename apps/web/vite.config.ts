import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.API_PROXY_TARGET ?? "http://localhost:3000";
  const rawPort = env.WEB_PORT ?? "5173";
  const port = Number(rawPort);
  if (
    !/^\d+$/.test(rawPort) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error("WEB_PORT debe ser un entero entre 1 y 65535.");
  }
  const parsedTarget = new URL(target);
  if (
    !["http:", "https:"].includes(parsedTarget.protocol) ||
    parsedTarget.origin !== target
  ) {
    throw new Error("API_PROXY_TARGET debe indicar un origen HTTP o HTTPS.");
  }

  return {
    plugins: [react()],
    build: { manifest: true },
    server: { port, proxy: { "/api": { target, changeOrigin: true } } },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      clearMocks: true,
      restoreMocks: true,
    },
  };
});
