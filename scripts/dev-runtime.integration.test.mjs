import test from "node:test";
import assert from "node:assert/strict";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { inspect, recordPath, root, owner } from "./dev-runtime.mjs";
const entry = fileURLToPath(
  new URL("./local-development.mjs", import.meta.url),
);
const exec = promisify(execFile);
const env = { ...process.env, NODE_ENV: "development", APP_ENV: "local" };
const cli = (args, extra = {}) =>
  exec(process.execPath, [entry, ...args], {
    cwd: root,
    env: { ...env, ...extra },
    windowsHide: true,
    timeout: 30000,
    maxBuffer: 2 * 1024 * 1024,
  });
const status = async () => JSON.parse((await cli(["status", "--json"])).stdout);
async function waitFor(check, timeout = 90000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await check()) return;
    await delay(300);
  }
  throw new Error("No se alcanzó el estado esperado del entorno.");
}
async function ready(ports) {
  await waitFor(async () => {
    try {
      const responses = await Promise.all([
        fetch(`http://127.0.0.1:${ports.web}/`, {
          signal: AbortSignal.timeout(600),
        }),
        fetch(`http://127.0.0.1:${ports.api}/api/health/db`, {
          signal: AbortSignal.timeout(600),
        }),
      ]);
      return (
        responses.every((r) => r.status === 200) &&
        (await responses[1].json()).service === "database"
      );
    } catch {
      return false;
    }
  });
}
async function free(ports) {
  await waitFor(async () => {
    try {
      await fetch(`http://127.0.0.1:${ports.web}/`, {
        signal: AbortSignal.timeout(500),
      });
      return false;
    } catch {
      try {
        await fetch(`http://127.0.0.1:${ports.api}/api/health`, {
          signal: AbortSignal.timeout(500),
        });
        return false;
      } catch {
        return true;
      }
    }
  }, 15000);
}

test(
  "ciclo real Windows: exclusión, propietarios, cierre y recuperación",
  { timeout: 300000, skip: process.platform !== "win32" },
  async (t) => {
    const before = await inspect();
    assert.equal(
      before.listeners.length,
      0,
      "Hay puertos ocupados. No se cerró ninguna sesión; coordina su propietario antes de esta prueba.",
    );
    assert.equal(
      before.candidates.length,
      0,
      "Hay procesos del proyecto previos; no se interrumpen para probar.",
    );
    assert.ok(
      !before.record?.live,
      "Hay un supervisor previo; no se interrumpe para probar.",
    );
    let launcher, foreign;
    const launch = () => {
      const child = spawn(process.execPath, [entry, "serve"], {
        cwd: root,
        env,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let output = "";
      child.stdout.on("data", (chunk) => {
        output = (output + chunk).slice(-15000);
      });
      child.stderr.on("data", (chunk) => {
        output = (output + chunk).slice(-15000);
      });
      child.on("error", () => {});
      child.diagnostic = () => output;
      return child;
    };
    try {
      await t.test(
        "un puerto ajeno bloquea el arranque y no puede cerrarse con recuperación",
        async () => {
          foreign = spawn(
            process.execPath,
            [
              "-e",
              `require('node:net').createServer().listen(${before.ports.web},'127.0.0.1',()=>console.log('ready'))`,
            ],
            { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
          );
          await once(foreign.stdout, "data");
          const active = await status(),
            listener = active.listeners.find(
              (l) => l.port === before.ports.web,
            );
          assert.equal(listener.project, false);
          await assert.rejects(
            cli(["serve"]),
            (e) => e.code === 1 && e.stderr.includes("puerto ocupado"),
          );
          await assert.rejects(
            cli([
              "stop",
              "--pid",
              String(listener.id),
              "--started",
              listener.started,
            ]),
            (e) => e.code === 1,
          );
          assert.equal(foreign.exitCode, null);
          foreign.kill();
          await once(foreign, "exit");
          foreign = null;
        },
      );
      await t.test(
        "un registro obsoleto se recupera sin confiar solo en PID",
        async () => {
          writeFileSync(
            recordPath,
            JSON.stringify({
              version: 1,
              root,
              pid: 2147483647,
              started: "2000-01-01T00:00:00.000000Z",
              instance: randomUUID(),
              owner: owner(),
            }),
            { mode: 0o600 },
          );
          launcher = launch();
          await ready(before.ports);
          assert.equal(launcher.exitCode, null, launcher.diagnostic());
          assert.equal((await status()).record.live, true);
        },
      );
      await t.test(
        "una segunda llamada reutiliza el mismo grupo y no duplica Vite",
        async () => {
          const first = await status();
          const response = await cli(["serve"]);
          assert.match(
            response.stdout,
            /ya está en ejecución|arranque en curso/,
          );
          const after = await status();
          assert.equal(after.runtime.instance, first.runtime.instance);
          assert.equal(
            after.listeners.find((l) => l.port === after.ports.web).id,
            first.listeners.find((l) => l.port === first.ports.web).id,
          );
        },
      );
      await t.test(
        "otra sesión Codex no puede interrumpir este grupo por defecto",
        async () => {
          await assert.rejects(
            cli(["stop"], { CODEX_THREAD_ID: "otra-sesion-sintetica" }),
            (e) => e.code === 1 && e.stderr.includes("pertenece"),
          );
          assert.equal(launcher.exitCode, null);
          await ready(before.ports);
        },
      );
      await t.test(
        "dev:stop libera ambos puertos y elimina los watchers",
        async () => {
          await cli(["stop"]);
          await free(before.ports);
          const after = await status();
          assert.equal(after.listeners.length, 0);
          assert.equal(after.candidates.length, 0);
          assert.equal(existsSync(recordPath), false);
          launcher = null;
        },
      );
      await t.test(
        "una caída abrupta del lanzador no deja procesos huérfanos",
        async () => {
          launcher = launch();
          await ready(before.ports);
          launcher.kill();
          await once(launcher, "exit");
          launcher = null;
          await free(before.ports);
          const after = await status();
          assert.equal(after.candidates.length, 0);
          assert.equal(after.record.live, false);
        },
      );
      await t.test(
        "reinicia tras la caída y repite el cierre normal",
        async () => {
          launcher = launch();
          await ready(before.ports);
          await cli(["stop"]);
          await free(before.ports);
          const after = await status();
          assert.equal(after.candidates.length, 0);
          assert.equal(after.listeners.length, 0);
          launcher = null;
        },
      );
    } finally {
      if (foreign?.exitCode === null) foreign.kill();
      // Only instances launched by this test may be cleaned here.
      if (launcher?.exitCode === null) {
        await cli(["stop"]).catch(() => launcher.kill());
        await free(before.ports).catch(() => {});
      }
    }
  },
);
