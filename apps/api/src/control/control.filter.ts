import {
  Catch,
  HttpException,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Response } from "express";
import { PrismaService } from "../persistence/prisma.service";
import type { ControlRequest } from "./control.guard";
@Catch()
export class ControlFilter implements ExceptionFilter {
  constructor(private readonly prisma: PrismaService) {}
  async catch(error: unknown, host: ArgumentsHost) {
    const req = host.switchToHttp().getRequest<Partial<ControlRequest>>();
    const response = host.switchToHttp().getResponse<Response>();
    const status = error instanceof HttpException ? error.getStatus() : 500;
    if (req.control) {
      try {
        await this.prisma.client.platformAudit.create({
          data: {
            actorUserId: req.control.userId,
            requestId: randomUUID(),
            action: "control.request.rejected",
            resourceType: "control",
            outcome: status === 401 || status === 403 ? "DENIED" : "REJECTED",
            reason: "Solicitud rechazada por las reglas de Noma Control.",
            changes: { status },
          },
        });
      } catch {
        response.status(503).json({
          message:
            "No pudimos registrar la operación. No se ha autorizado el cambio.",
        });
        return;
      }
    }
    response.status(status).json(
      status < 500 && error instanceof HttpException
        ? error.getResponse()
        : {
            message:
              "No pudimos completar esta operación de Control. Intenta otra vez.",
          },
    );
  }
}
