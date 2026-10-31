import "../env";
import { parseArgs } from "node:util";
import { PrismaService } from "../persistence/prisma.service";
import { requireLocalAccess } from "../platform/local-policy";
import {
  assignInitialVertical,
  SectorSelectionError,
  sectorTargetId,
} from "./sector-administration";
async function main() {
  requireLocalAccess();
  const { values } = parseArgs({
    options: {
      establishment: { type: "string" },
      vertical: { type: "string" },
      reason: { type: "string" },
      version: { type: "string" },
      inspect: { type: "boolean" },
    },
  });
  const prisma = new PrismaService();
  try {
    const [identity] = await prisma.client.$queryRaw<
      Array<{ database: string; username: string }>
    >`SELECT current_database() AS database, current_user AS username`;
    if (
      identity?.database !== "beauty_wellness_dev" ||
      identity.username !== "bw_local"
    )
      throw new SectorSelectionError(
        "Este comando requiere exclusivamente la base local de desarrollo.",
      );
    const establishment = sectorTargetId(values.establishment ?? "");
    if (values.inspect) {
      if (
        values.vertical !== undefined ||
        values.reason !== undefined ||
        values.version !== undefined
      )
        throw new SectorSelectionError(
          "--inspect solo admite --establishment y no realiza escrituras.",
        );
      const current = await prisma.client.establishment.findUnique({
        where: { id: establishment },
        select: { id: true, vertical: true, version: true, status: true },
      });
      if (!current)
        throw new SectorSelectionError(
          "Establecimiento no encontrado; no se realizaron cambios.",
        );
      console.log(JSON.stringify(current));
      return;
    }
    if (!values.version || !/^\d+$/.test(values.version))
      throw new SectorSelectionError(
        "Indica --version con la versión actual del establecimiento.",
      );
    await prisma.client.$transaction((tx) =>
      assignInitialVertical(tx, {
        establishment: values.establishment ?? "",
        vertical: values.vertical,
        reason: values.reason ?? "",
        version: Number(values.version),
      }),
    );
    console.log(
      "Clasificación inicial guardada. Identidad, credenciales y datos comerciales conservados.",
    );
  } finally {
    await prisma.onApplicationShutdown();
  }
}
void main().catch((error: unknown) => {
  console.error(
    error instanceof SectorSelectionError
      ? error.message
      : "No se pudo clasificar. Comprueba entorno local, migraciones y argumentos. No se imprimen credenciales.",
  );
  process.exitCode = 1;
});
