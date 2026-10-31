import "../env";
import { parseArgs } from "node:util";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaService } from "../persistence/prisma.service";
import { requireLocalAccess } from "./local-policy";
import { newToken } from "./local-identity.service";
import {
  initialVertical,
  SectorSelectionError,
} from "../sector/sector-administration";
import {
  renewBootstrap,
  renewExistingBootstrap,
  LocalAccessSelectionError,
} from "./local-access-code";

async function bootstrap(): Promise<void> {
  requireLocalAccess();
  const { values } = parseArgs({
    options: {
      name: { type: "string" },
      owner: { type: "string" },
      membership: { type: "string" },
      "existing-only": { type: "boolean" },
      vertical: { type: "string" },
    },
  });
  const name = values.name?.trim();
  const owner = values.owner?.trim();
  if (
    (values["existing-only"] &&
      (values.name !== undefined ||
        values.owner !== undefined ||
        values.vertical !== undefined)) ||
    (!values["existing-only"] &&
      !values.membership &&
      (!name || name.length > 120 || !owner || owner.length > 80)) ||
    (values.membership && (name || owner || values.vertical !== undefined))
  ) {
    throw new Error(
      "Usa --name y --owner para crear, o --membership UUID para emitir otro código.",
    );
  }
  const vertical =
    !values["existing-only"] && !values.membership
      ? initialVertical(values.vertical)
      : undefined;
  const prisma = new PrismaService();
  try {
    const identity = await prisma.client.$queryRaw<
      Array<{ database: string; username: string }>
    >`SELECT current_database() AS database, current_user AS username`;
    if (
      identity[0]?.database !== "beauty_wellness_dev" ||
      identity[0]?.username !== "bw_local"
    )
      throw new Error(
        "La CLI requiere la base y el usuario locales de desarrollo.",
      );
    const code = newToken();
    const membership = await prisma.client.$transaction(async (tx) => {
      if (values["existing-only"])
        return renewExistingBootstrap(tx, code, values.membership);
      let membershipId = values.membership;
      if (!membershipId) {
        const establishment = await tx.establishment.create({
          data: {
            commercialName: name!,
            vertical,
            verticalConfiguredAt: new Date(),
            verticalConfigurationReason:
              "Selección explícita del desarrollador durante el alta local.",
          },
        });
        const user = await tx.internalUser.create({
          data: { displayName: owner! },
        });
        const created = await tx.membership.create({
          data: {
            userId: user.id,
            establishmentId: establishment.id,
            role: "OWNER",
          },
        });
        membershipId = created.id;
      }
      return renewBootstrap(tx, membershipId, code);
    });
    const directory = resolve(__dirname, "../../../../.local");
    mkdirSync(directory, { recursive: true });
    writeFileSync(resolve(directory, "owner-access.txt"), code, {
      mode: 0o600,
    });
    console.log(`Membresía: ${membership.id}`);
    console.log(`Establecimiento: ${membership.establishmentId}`);
    console.log(
      "Código de un solo uso escrito en .local/owner-access.txt; vence en 10 minutos. No compartir ni versionar.",
    );
  } finally {
    await prisma.onApplicationShutdown();
  }
}

void bootstrap().catch((error: unknown) => {
  console.error(
    error instanceof LocalAccessSelectionError ||
      error instanceof SectorSelectionError
      ? error.message
      : "No se pudo emitir el acceso local. Revisa modo local, base, migraciones y argumentos (--name/--owner solo en dev:owner, o --membership). No se imprimen credenciales.",
  );
  process.exitCode = 1;
});
