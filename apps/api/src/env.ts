import { resolve } from "node:path";
import { config } from "dotenv";

// Funciona desde src/ y dist/, sin depender del directorio de ejecución.
config({ path: resolve(__dirname, "../.env"), quiet: true });
