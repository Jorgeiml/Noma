import "../env";
import { parseArgs } from "node:util";
import { HttpException } from "@nestjs/common";
import { PrismaService } from "../persistence/prisma.service";
import { bootstrapFirstOwner } from "./owner-bootstrap";
class BootstrapUsageError extends Error {}
async function main() {
  const { values } = parseArgs({
    options: {
      user: { type: "string" },
      "confirm-user": { type: "string" },
      reason: { type: "string" },
      evidence: { type: "string" },
    },
  });
  if (process.env.NODE_ENV !== "development" || process.env.APP_ENV !== "local")
    throw new BootstrapUsageError(
      "El bootstrap está limitado al desarrollo local. La autorización operativa de producción requiere un procedimiento con MFA verificada.",
    );
  if (
    !values.user ||
    !values["confirm-user"] ||
    !values.reason ||
    !values.evidence
  )
    throw new BootstrapUsageError(
      "Usa --user UUID --confirm-user EL_MISMO_UUID --reason MOTIVO --evidence REFERENCIA. Nunca uses correos ni secretos como identificadores o evidencia.",
    );
  const prisma = new PrismaService();
  try {
    const rows = await prisma.client.$queryRaw<
      { database: string; username: string }[]
    >`SELECT current_database() AS database,current_user AS username`;
    const url = new URL(process.env.DATABASE_URL ?? "");
    if (
      rows[0]?.database !== "beauty_wellness_dev" ||
      rows[0]?.username !== "bw_local" ||
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    )
      throw new BootstrapUsageError(
        "El bootstrap requiere la base y el usuario locales previstos.",
      );
    const result = await bootstrapFirstOwner(prisma, {
      userId: values.user,
      confirmUserId: values["confirm-user"],
      reason: values.reason,
      evidence: values.evidence,
    });
    console.log(
      result.alreadyAuthorized
        ? "El usuario confirmado ya es propietario de plataforma; no se duplicaron permisos."
        : "Propietario de plataforma autorizado y auditado. No se crearon usuarios, membresías ni sesiones.",
    );
    console.log(`Usuario interno confirmado: ${result.userId}`);
  } finally {
    await prisma.onApplicationShutdown();
  }
}
void main().catch((error: unknown) => {
  console.error(
    error instanceof HttpException || error instanceof BootstrapUsageError
      ? error.message
      : "No se pudo autorizar al propietario. Revisa las condiciones locales y la identidad verificada; no se imprimen secretos.",
  );
  process.exitCode = 1;
});
