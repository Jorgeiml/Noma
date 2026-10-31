import "../env";
import { parseArgs } from "node:util";
import { PrismaService } from "../persistence/prisma.service";
import { requireLocalAccess } from "../platform/local-policy";
import {
  createSyntheticApplication,
  activateSyntheticApplication,
} from "./local-activation";
async function run() {
  requireLocalAccess();
  const { values } = parseArgs({
    options: {
      fixture: { type: "boolean" },
      plan: { type: "string" },
      application: { type: "string" },
      membership: { type: "string" },
    },
  });
  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (
    values.fixture
      ? !!values.application || !!values.membership
      : !!values.plan ||
        !values.application ||
        !values.membership ||
        !uuid.test(values.application) ||
        !uuid.test(values.membership)
  )
    throw new Error(
      "Usa --fixture --plan START, o --application UUID --membership UUID para una fixture existente.",
    );
  const prisma = new PrismaService();
  try {
    if (values.fixture)
      console.log(await createSyntheticApplication(prisma, values.plan));
    else
      console.log({
        subscriptionId: await activateSyntheticApplication(
          prisma,
          values.application!,
          values.membership!,
        ),
      });
    console.log(
      "Solo datos sintéticos locales. No genera sesión OIDC, pago ni activación comercial real.",
    );
  } finally {
    await prisma.client.$disconnect();
  }
}
void run().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Operación sintética no disponible.",
  );
  process.exitCode = 1;
});
