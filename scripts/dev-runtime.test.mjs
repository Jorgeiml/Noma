import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  isAnchor,
  belongs,
  liveRecord,
  mayStop,
  owner,
  root,
} from "./dev-runtime.mjs";
const processRecord = (
  id,
  parent,
  command,
  started = "2026-10-28T12:00:00.000000Z",
) => ({ id, parent, command, started, name: "node.exe" });
const vite = processRecord(
  10,
  5,
  `node "${root}\\apps\\web\\node_modules\\vite\\bin\\vite.js"`,
);
test("reconoce Vite del checkout exacto, incluyendo espacios y mayúsculas", () => {
  assert.equal(isAnchor(vite), true);
  const spacedRoot = "C:\\Users\\Jorge\\Mi SaaS";
  assert.equal(
    isAnchor(
      processRecord(
        1,
        0,
        `node "${spacedRoot}\\apps\\web\\node_modules\\vite\\bin\\vite.js"`,
      ),
      spacedRoot,
    ),
    true,
  );
  assert.equal(
    isAnchor({ ...vite, command: vite.command.toUpperCase() }),
    true,
  );
  assert.equal(
    isAnchor(
      processRecord(
        1,
        0,
        'node "C:\\Otro proyecto\\node_modules\\vite\\bin\\vite.js"',
      ),
    ),
    false,
  );
  assert.equal(
    isAnchor(
      processRecord(
        1,
        0,
        `node "${root}-otro\\node_modules\\vite\\bin\\vite.js"`,
      ),
    ),
    false,
  );
});
test("no confunde Codex ni VS Code con el SaaS aunque mencionen el checkout", () => {
  assert.equal(
    isAnchor(
      processRecord(
        1,
        0,
        `node C:/otro/vite/bin/vite.js --checkout "${root}/data"`,
      ),
    ),
    false,
  );
  for (const command of [
    `node kernel.js --working-dir "${root}"`,
    `node trusted-worker.js "${root}"`,
    `node artifact-tool/server.mjs "${root}"`,
    `node "${root}\\otro-script.mjs"`,
  ])
    assert.equal(isAnchor(processRecord(1, 0, command)), false);
});
test("resuelve Nest con ruta relativa solo a través de ancestros verificados", () => {
  const parent = processRecord(
    20,
    5,
    `node "${root}\\node_modules\\concurrently\\dist\\bin\\index.js"`,
  );
  const api = processRecord(21, 20, "node --watch dist/main.js");
  assert.equal(belongs(api, [parent, api]), true);
  assert.equal(belongs(api, [api]), false);
  assert.equal(
    belongs(api, [{ ...parent, started: "2026-10-29T00:00:00.000000Z" }, api]),
    false,
  );
});
test("un ciclo de PID padre no se interpreta como pertenencia", () => {
  const a = processRecord(1, 2, "node other.mjs"),
    b = processRecord(2, 1, "node other.mjs");
  assert.equal(belongs(a, [a, b]), false);
});
test("un PID reutilizado, ruta o comando incorrectos invalidan un registro", () => {
  const p = processRecord(30, 1, "node scripts/local-development.mjs serve");
  const record = { version: 1, root, pid: 30, started: p.started };
  assert.equal(liveRecord(record, [p]), true);
  assert.equal(
    liveRecord(record, [{ ...p, started: "2026-10-29T00:00:00.000000Z" }]),
    false,
  );
  assert.equal(liveRecord({ ...record, root: root + "-otro" }, [p]), false);
  assert.equal(
    liveRecord(record, [{ ...p, command: "node kernel.js" }]),
    false,
  );
  assert.equal(liveRecord(record, []), false);
});
test("otra sesión Codex exige selección explícita de instancia", () => {
  const record = { instance: "instance-a", owner: "codex:a" };
  assert.equal(mayStop(record, "codex:a"), true);
  assert.equal(mayStop(record, "codex:b"), false);
  assert.equal(mayStop(record, "manual:person"), false);
  assert.equal(mayStop(record, "codex:b", "instance-a"), true);
  assert.equal(mayStop(record, "codex:a", "instance-b"), false);
  assert.equal(owner({ CODEX_THREAD_ID: "a" }), "codex:a");
});
test("el comando TypeScript mantiene argumentos separados", () => {
  const api = JSON.parse(
    readFileSync(new URL("../apps/api/package.json", import.meta.url), "utf8"),
  );
  assert.ok(
    api.scripts.dev.includes(
      "tsc -p tsconfig.build.json --watch --preserveWatchOutput",
    ),
  );
  assert.ok(!api.scripts.dev.includes("tsconfig.build.json--watch"));
});
