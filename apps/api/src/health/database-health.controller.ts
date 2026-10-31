import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../persistence/prisma.service";

@Controller("health/db")
export class DatabaseHealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth(): Promise<{ status: "ok"; service: "database" }> {
    try {
      await this.prisma.checkConnection();
      return { status: "ok", service: "database" };
    } catch {
      throw new ServiceUnavailableException("Base de datos no disponible");
    }
  }
}
