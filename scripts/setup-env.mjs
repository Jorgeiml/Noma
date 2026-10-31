import { constants, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
for (const [example, target] of [
  [".env.example", ".env"],
  ["apps/api/.env.example", "apps/api/.env"],
  ["apps/api/.env.test.example", "apps/api/.env.test"],
  ["apps/web/.env.example", "apps/web/.env"],
]) {
  try {
    copyFileSync(
      new URL(example, root),
      new URL(target, root),
      constants.COPYFILE_EXCL,
    );
    console.log(`Creado: ${target}`);
  } catch (error) {
    if (error.code === "EEXIST") {
      console.log(`Conservado: ${target}`);
    } else {
      console.error(`No se pudo preparar ${target} en ${fileURLToPath(root)}.`);
      process.exitCode = 1;
      break;
    }
  }
}
