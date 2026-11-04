import type { Prisma } from "../generated/prisma/client";
import type { PrismaService } from "../persistence/prisma.service";
// Offering/Staff keep their existing rules. Their nested callbacks join this transaction;
// no extra connection or commit is opened. The adapter is confined to onboarding.
export function transactionScope(tx: Prisma.TransactionClient): PrismaService {
  const client = new Proxy(tx, {
    get(target, key) {
      if (key === "$transaction")
        return <T>(
          callback: (client: Prisma.TransactionClient) => Promise<T>,
        ) => {
          if (typeof callback !== "function")
            throw new Error(
              "Only transaction callbacks are supported in this scope.",
            );
          return callback(tx);
        };
      return Reflect.get(target, key);
    },
  });
  return { client } as unknown as PrismaService;
}
