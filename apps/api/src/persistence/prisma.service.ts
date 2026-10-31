import { Injectable, type OnApplicationShutdown } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { databaseUrl } from "./database.config";

@Injectable()
export class PrismaService implements OnApplicationShutdown {
  readonly client: PrismaClient;

  constructor() {
    const adapter = new PrismaPg({
      connectionString: databaseUrl(process.env),
      max: 5,
      connectionTimeoutMillis: 1500,
      idleTimeoutMillis: 10000,
      query_timeout: 1500,
      statement_timeout: 1500,
    });
    this.client = new PrismaClient({ adapter, log: [] });
  }

  // Conexión perezosa: DB caída no impide el health del proceso.
  async checkConnection(): Promise<void> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        this.client.$queryRaw`SELECT 1`,
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => reject(new Error("DB timeout")), 2000);
        }),
      ]);
    } finally {
      clearTimeout(timeout);
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.$disconnect();
  }
}
