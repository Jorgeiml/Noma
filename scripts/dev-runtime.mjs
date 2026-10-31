import { execFile, spawn } from "node:child_process";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from "node:fs";
import net from "node:net";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import { setTimeout as delay } from "node:timers/promises";

const exec = promisify(execFile);
const webRequire = createRequire(
  new URL("../apps/web/package.json", import.meta.url),
);
const { loadEnv } = await import(
  pathToFileURL(webRequire.resolve("vite")).href
);
export const root = fileURLToPath(new URL("../", import.meta.url)).replace(
  /[\\/]$/,
  "",
);
export const recordPath = join(root, ".local", "dev-runtime.json");
const inspector = fileURLToPath(
  new URL("./dev-processes.ps1", import.meta.url),
);
const jobHost = fileURLToPath(new URL("./dev-job.ps1", import.meta.url));
const shell = join(
  process.env.SystemRoot ?? "C:\\Windows",
  "System32",
  "WindowsPowerShell",
  "v1.0",
  "powershell.exe",
);
const shellArgs = [
  "-NoProfile",
  "-NonInteractive",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
];
const normalize = (value) =>
  String(value ?? "")
    .replace(/\\+/g, "/")
    .replace(/\/+$/, "")
    .toLowerCase();
const internal =
  /kernel\.js|trusted-worker|cua-repl|artifact-tool|launch_codex|Microsoft VS Code|[\\/]Code\.exe/i;
export function owner(env = process.env) {
  const session = env.CODEX_THREAD_ID ?? env.CODEX_SESSION_ID;
  return session
    ? `codex:${session}`
    : `manual:${env.USERDOMAIN ?? "local"}\\${env.USERNAME ?? "user"}`;
}
export function isAnchor(process, projectRoot = root) {
  if (
    !process ||
    internal.test(process.command) ||
    !/[\\/]?(node|powershell|pwsh)\.exe$/i.test(process.name)
  )
    return false;
  const prefix = normalize(projectRoot) + "/";
  return [...String(process.command ?? "").matchAll(/"([^"]+)"|(\S+)/g)].some(
    (match) => {
      const token = normalize(match[1] ?? match[2]);
      return (
        token.startsWith(prefix) &&
        /\/(vite\/bin\/vite\.js|typescript\/bin\/tsc|concurrently\/dist\/bin\/index\.js|scripts\/dev-job\.ps1|apps\/api\/dist\/main\.js)$/.test(
          token,
        )
      );
    },
  );
}
export function belongs(process, processes, projectRoot = root) {
  const seen = new Set();
  let current = process;
  while (current && !seen.has(current.id)) {
    if (internal.test(current.command)) return false;
    if (isAnchor(current, projectRoot)) return true;
    seen.add(current.id);
    const parent = processes.find((p) => p.id === current.parent);
    if (!parent || parent.started > current.started) return false;
    current = parent;
  }
  return false;
}
export function liveRecord(record, processes, projectRoot = root) {
  return (
    record?.version === 1 &&
    normalize(record.root) === normalize(projectRoot) &&
    processes.some(
      (p) =>
        p.id === record.pid &&
        p.started === record.started &&
        p.name?.toLowerCase() === "node.exe" &&
        !internal.test(p.command) &&
        /local-development\.mjs.*\bserve\b/.test(p.command),
    )
  );
}
export function mayStop(record, requestOwner, instance) {
  return (
    instance === record.instance || (!instance && record.owner === requestOwner)
  );
}
function port(value, fallback) {
  const raw = value ?? fallback;
  if (!/^\d+$/.test(raw) || Number(raw) < 1 || Number(raw) > 65535)
    throw new Error("Puerto local inválido; no se inició ningún proceso.");
  return Number(raw);
}
export function configuration() {
  // Same precedence as API dotenv/Vite loadEnv; never log the full environment.
  const web = loadEnv("development", join(root, "apps", "web"), "");
  const ports = {
    web: port(process.env.WEB_PORT ?? web.WEB_PORT, "5173"),
    api: port(process.env.API_PORT, "3000"),
  };
  if (ports.web === ports.api)
    throw new Error("Frontend y backend no pueden compartir el mismo puerto.");
  return ports;
}
export async function snapshot(ports = configuration()) {
  if (process.platform !== "win32")
    throw new Error(
      "La inspección segura de este lanzador requiere Windows. No se inició ni detuvo ningún proceso.",
    );
  try {
    const { stdout } = await exec(
      shell,
      [
        ...shellArgs,
        inspector,
        "-Action",
        "inspect",
        "-Ports",
        `${ports.web},${ports.api}`,
      ],
      { windowsHide: true, timeout: 20000, maxBuffer: 8 * 1024 * 1024 },
    );
    const data = JSON.parse(stdout.replace(/^\uFEFF/, ""));
    if (!Array.isArray(data.processes) || !Array.isArray(data.listeners))
      throw new Error();
    return data;
  } catch {
    throw new Error(
      "No se pudieron inspeccionar procesos y puertos de Windows. Operación cancelada sin cerrar procesos.",
    );
  }
}
function readRecord() {
  try {
    return JSON.parse(readFileSync(recordPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw new Error(
      "Registro incompleto o ilegible. No se borró ni se cerró ningún proceso; vuelve a consultar dev:status.",
      { cause: error },
    );
  }
}
function removeRecord(instance) {
  try {
    if (readRecord()?.instance === instance) unlinkSync(recordPath);
  } catch {
    /* Never remove an unknown record. */
  }
}
const pipeFor = (projectRoot) =>
  `\\\\.\\pipe\\beauty-wellness-${createHash("sha256").update(normalize(projectRoot)).digest("hex").slice(0, 20)}`;
function control(record, operation) {
  return new Promise((resolveControl, reject) => {
    const socket = net.connect(record.pipe),
      timer = setTimeout(() => {
        socket.destroy();
        reject(new Error("Control local no disponible"));
      }, 2000);
    let output = "";
    socket.on("connect", () =>
      socket.write(
        JSON.stringify({
          token: record.token,
          instance: record.instance,
          operation,
        }) + "\n",
      ),
    );
    socket.on("data", (chunk) => {
      output += chunk;
      if (output.length > 65536) {
        socket.destroy();
        return;
      }
      if (output.includes("\n")) {
        clearTimeout(timer);
        socket.end();
        try {
          const result = JSON.parse(output.split("\n")[0]);
          if (
            result.instance !== record.instance ||
            normalize(result.root) !== normalize(root)
          )
            throw new Error();
          resolveControl(result);
        } catch {
          reject(new Error("Identidad del control local inválida"));
        }
      }
    });
    socket.on("error", () => {
      clearTimeout(timer);
      reject(new Error("Control local no disponible"));
    });
  });
}
async function health(ports) {
  const check = async (url, service) => {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(1800) });
      if (r.status !== 200) return false;
      if (service) {
        const body = await r.json();
        return body?.status === "ok" && body?.service === service;
      }
      return (await r.text()).includes("/src/main.tsx");
    } catch {
      return false;
    }
  };
  const [web, api, database] = await Promise.all([
    check(`http://127.0.0.1:${ports.web}/`),
    check(`http://127.0.0.1:${ports.api}/api/health`, "api"),
    check(`http://127.0.0.1:${ports.api}/api/health/db`, "database"),
  ]);
  return { web, api, database };
}
export async function inspect() {
  const ports = configuration(),
    data = await snapshot(ports),
    record = readRecord();
  const listeners = data.listeners.map((l) => {
    const p = data.processes.find((p) => p.id === l.id);
    return { ...l, started: p?.started, project: belongs(p, data.processes) };
  });
  const candidates = data.processes
    .filter(
      (p) =>
        isAnchor(p) &&
        !data.processes.some(
          (parent) => parent.id === p.parent && belongs(parent, data.processes),
        ),
    )
    .map(({ id, parent, name, started }) => ({ id, parent, name, started }));
  const trusted = record && liveRecord(record, data.processes);
  let runtime = null;
  if (trusted) {
    try {
      runtime = await control(record, "status");
    } catch {
      runtime = {
        instance: record.instance,
        owner: record.owner,
        state: "control-unavailable",
      };
    }
  }
  const healthy = await health(ports);
  return {
    ports,
    listeners,
    candidates,
    runtime,
    healthy,
    record: record
      ? {
          instance: record.instance,
          pid: record.pid,
          started: record.started,
          owner: record.owner,
          live: Boolean(trusted),
        }
      : null,
  };
}
function describe(status) {
  console.log(`Propietario de esta llamada: ${owner()}`);
  if (status.runtime)
    console.log(
      `Instancia ${status.runtime.instance} · ${status.runtime.owner} · ${status.runtime.state}`,
    );
  for (const [name, port] of Object.entries(status.ports)) {
    const listeners = status.listeners.filter((l) => l.port === port);
    console.log(
      `${name} ${port}: ${listeners.length ? listeners.map((l) => `PID ${l.id} (${l.project ? "este proyecto" : "ajeno o pertenencia no verificable"})`).join(", ") : "libre"}`,
    );
  }
  console.log(
    `Salud: frontend=${status.healthy.web}, API=${status.healthy.api}, PostgreSQL vía API=${status.healthy.database}`,
  );
  for (const p of !status.runtime ||
  status.runtime.state === "control-unavailable"
    ? status.candidates
    : [])
    console.log(
      `Instancia sin supervisor, propietario de sesión no verificable: PID ${p.id}. Solo tras confirmar quién la usa: pnpm dev:stop --pid ${p.id} --started ${p.started}`,
    );
}
export async function statusCommand(json = false) {
  const status = await inspect();
  if (json) console.log(JSON.stringify(status));
  else describe(status);
  return status;
}

export async function stopCommand(options = {}) {
  if (options.pid) {
    if (!/^\d+$/.test(options.pid) || !options.started)
      throw new Error(
        "La recuperación exige --pid y --started exactos de dev:status; confirma primero el propietario.",
      );
    // The helper rechecks creation time, executable, root and descendants immediately before termination.
    try {
      const { stdout } = await exec(
        shell,
        [
          ...shellArgs,
          inspector,
          "-Action",
          "stop",
          "-TargetPid",
          options.pid,
          "-Started",
          options.started,
          "-ProjectRoot",
          root,
        ],
        { windowsHide: true, timeout: 20000 },
      );
      console.log(stdout.trim());
    } catch {
      throw new Error(
        "No se pudo verificar o detener el proceso seleccionado; no se autoriza cerrar procesos ajenos.",
      );
    }
    return;
  }
  const status = await inspect(),
    record = readRecord();
  if (
    !record ||
    !liveRecord(record, (await snapshot(status.ports)).processes)
  ) {
    if (record) removeRecord(record.instance);
    describe(status);
    if (status.candidates.length || status.listeners.length)
      throw new Error(
        "Hay procesos sin control gestionado. No se cerraron: confirma su propietario y usa la recuperación explícita indicada.",
      );
    console.log("No hay instancias del SaaS en ejecución.");
    return;
  }
  if (!mayStop(record, owner(), options.instance))
    throw new Error(
      `La instancia pertenece a ${record.owner}. No se cerró. Si su propietario autoriza el cierre, usa pnpm dev:stop --instance ${record.instance}`,
    );
  console.log(
    `Solicitando cierre de instancia ${record.instance} · propietario ${record.owner}`,
  );
  const response = await control(record, "stop");
  if (!response.accepted) throw new Error("La instancia rechazó el cierre.");
  console.log("Cierre aceptado; esperando la liberación del grupo Windows.");
  for (let i = 0; i < 40; i++) {
    if (!existsSync(recordPath)) break;
    await delay(250);
  }
  const after = await inspect();
  if (after.record?.live || after.listeners.length || after.candidates.length) {
    describe(after);
    throw new Error(
      "Quedan procesos o puertos ocupados; no se cerró ninguna instancia adicional.",
    );
  }
  console.log(
    `Entorno detenido. Puertos ${after.ports.web} y ${after.ports.api} libres. PostgreSQL no se detuvo.`,
  );
}

export async function serve() {
  const ports = configuration();
  mkdirSync(join(root, ".local"), { recursive: true });
  const initial = await snapshot(ports),
    previous = readRecord();
  if (previous && liveRecord(previous, initial.processes)) {
    let current;
    try {
      current = await control(previous, "status");
    } catch {
      throw new Error(
        "Existe un supervisor activo sin control disponible. No se inició un duplicado. Consulta pnpm dev:status.",
      );
    }
    const status = await inspect();
    describe(status);
    if (current.state === "starting") {
      console.log(
        "Este proyecto ya tiene un arranque en curso. No se inició un duplicado.",
      );
      return;
    }
    if (
      current.state === "running" &&
      Object.values(status.healthy).every(Boolean)
    ) {
      console.log(
        "El entorno ya está en ejecución y saludable. No se inició un duplicado.",
      );
      return;
    }
    throw new Error(
      "Instancia incompleta o no saludable. Consulta pnpm dev:status y coordina su cierre con pnpm dev:stop.",
    );
  }
  if (previous) removeRecord(previous.instance);
  const self = initial.processes.find((p) => p.id === process.pid);
  if (!self) throw new Error("No se pudo comprobar la identidad del lanzador.");
  const record = {
    version: 1,
    root,
    pid: process.pid,
    started: self.started,
    instance: randomUUID(),
    owner: owner(),
    pipe: pipeFor(root),
    token: randomBytes(32).toString("hex"),
  };
  try {
    writeFileSync(recordPath, JSON.stringify(record), {
      flag: "wx",
      mode: 0o600,
    });
  } catch (error) {
    if (error.code === "EEXIST") {
      console.log(
        "Otro arranque adquirió el control de este proyecto. Consulta pnpm dev:status; no se inició un duplicado.",
      );
      return;
    }
    throw error;
  }
  let phase = "starting",
    host,
    stopping = false;
  const server = net.createServer((socket) => {
    let input = "";
    socket.setTimeout(2000, () => socket.destroy());
    socket.on("error", () => {});
    socket.on("data", (chunk) => {
      input += chunk;
      if (input.length > 4096) {
        socket.destroy();
        return;
      }
      if (!input.includes("\n")) return;
      try {
        const message = JSON.parse(input.split("\n")[0]);
        if (
          message.token !== record.token ||
          message.instance !== record.instance
        )
          throw new Error();
        const stop = message.operation === "stop";
        socket.end(
          JSON.stringify({
            instance: record.instance,
            root,
            owner: record.owner,
            state: phase,
            accepted: stop,
          }) + "\n",
        );
        if (stop) void shutdown();
      } catch {
        socket.destroy();
      }
    });
  });
  let finished;
  const done = new Promise((resolveDone) => {
    finished = resolveDone;
  });
  async function shutdown(code = 0) {
    if (stopping) return;
    stopping = true;
    phase = "stopping";
    if (host?.pid && host.exitCode === null && host.signalCode === null) {
      console.log("Cerrando el grupo Windows de esta instancia...");
      const exited = new Promise((resolveExit) =>
        host.once("exit", resolveExit),
      );
      // ChildProcess.kill uses the native child handle. Closing the private job
      // host releases its Job Object and every owned descendant, including watchers.
      host.kill();
      await exited;
      console.log("Host de procesos finalizado.");
    }
    // The job is closed first. A start cannot acquire the record until cleanup has finished.
    server.close();
    const remaining = await snapshot(ports).catch(() => null);
    if (host && remaining?.listeners.length) {
      console.error(
        "Tras el cierre hay puertos ocupados; consulta dev:status. No se cerraron procesos adicionales.",
      );
      code = 1;
    }
    removeRecord(record.instance);
    process.exitCode = code;
    finished();
  }
  const onSignal = () => void shutdown();
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);
  process.on("SIGBREAK", onSignal);
  try {
    await new Promise((resolveListen, reject) => {
      server.once("error", reject);
      server.listen(record.pipe, resolveListen);
    });
    const preflight = await inspect();
    // Ignore our own empty supervisor; every pre-existing runtime/port must be resolved first.
    if (preflight.listeners.length || preflight.candidates.length) {
      describe({ ...preflight, runtime: null });
      const owned = preflight.listeners.every((l) => l.project),
        both = [ports.web, ports.api].every((port) =>
          preflight.listeners.some((l) => l.port === port),
        );
      if (owned && both && Object.values(preflight.healthy).every(Boolean)) {
        console.log(
          "El proyecto ya funciona con un lanzador anterior. No se inició un duplicado.",
        );
        await shutdown();
        return;
      }
      throw new Error(
        "Entorno parcial o puerto ocupado. No se inició ni se cerró ningún servidor. Usa pnpm dev:status; confirma el propietario antes de pnpm dev:stop.",
      );
    }
    console.log(
      `Iniciando instancia ${record.instance} · propietario ${record.owner}`,
    );
    host = spawn(
      shell,
      [
        ...shellArgs,
        jobHost,
        "-LauncherPid",
        String(process.pid),
        "-LauncherStarted",
        record.started,
      ],
      {
        cwd: root,
        detached: false,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          ...process.env,
          BW_DEV_ROOT: root,
          BW_DEV_COMMAND: JSON.stringify([
            process.execPath,
            resolve(process.env.npm_execpath),
            "dev",
          ]),
        },
      },
    );
    host.stdout.on("data", (chunk) => process.stdout.write(chunk));
    host.stderr.on("data", (chunk) => process.stderr.write(chunk));
    host.on("error", () => void shutdown(1));
    host.on("exit", (code, signal) => {
      if (!stopping) {
        console.error(
          `El grupo de desarrollo terminó (${signal ?? code}). Cerrando sus procesos restantes.`,
        );
        void shutdown(code || 1);
      }
    });
    void (async () => {
      for (let i = 0; i < 180 && !stopping; i++) {
        const healthy = await health(ports);
        if (Object.values(healthy).every(Boolean)) {
          phase = "running";
          console.log(
            `Entorno listo: http://localhost:${ports.web} · API ${ports.api}. Ctrl+C o pnpm dev:stop para cerrar.`,
          );
          return;
        }
        await delay(500);
      }
      if (!stopping) {
        phase = "incomplete";
        console.error(
          "El entorno no completó sus healthchecks. Consulta dev:status o dev:stop; no se cambiarán los puertos.",
        );
      }
    })();
    await done;
  } catch (error) {
    await shutdown(1);
    throw error;
  } finally {
    process.off("SIGINT", onSignal);
    process.off("SIGTERM", onSignal);
    process.off("SIGBREAK", onSignal);
  }
}
