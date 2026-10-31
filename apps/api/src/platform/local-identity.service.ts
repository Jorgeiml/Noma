import { createHash, randomBytes } from "node:crypto";
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../persistence/prisma.service";

export const digestToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");
export const newToken = (): string => randomBytes(32).toString("base64url");
export const localCookie = "bw_local_session";

@Injectable()
export class LocalIdentityService {
  constructor(private readonly prisma: PrismaService) {}

  async context(token: string | undefined) {
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token))
      throw new UnauthorizedException("Sesión local no autorizada");
    const credential = await this.prisma.client.localCredential.findUnique({
      where: { digest: digestToken(token) },
      include: { membership: { include: { user: true, establishment: true } } },
    });
    if (
      !credential ||
      credential.kind !== "SESSION" ||
      credential.expiresAt <= new Date()
    )
      throw new UnauthorizedException("Sesión local vencida o no autorizada");
    const membership = credential.membership;
    if (membership.status !== "ACTIVE" || membership.role !== "OWNER")
      throw new ForbiddenException("Pertenencia no autorizada");
    if (membership.establishment.status !== "ACTIVE")
      throw new NotFoundException("Establecimiento no disponible");
    return {
      userId: membership.userId,
      displayName: membership.user.displayName,
      establishmentId: membership.establishmentId,
      membershipId: membership.id,
      currency: membership.establishment.currency,
      vertical: membership.establishment.vertical,
      role: "OWNER" as const,
    };
  }

  async exchange(token: unknown): Promise<string> {
    if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token))
      throw new UnauthorizedException("Código local inválido o vencido");
    const session = newToken();
    await this.prisma.client.$transaction(async (tx) => {
      const credential = await tx.localCredential.findUnique({
        where: { digest: digestToken(token) },
        include: { membership: { include: { establishment: true } } },
      });
      if (
        !credential ||
        credential.kind !== "BOOTSTRAP" ||
        credential.expiresAt <= new Date() ||
        credential.membership.status !== "ACTIVE" ||
        credential.membership.role !== "OWNER" ||
        credential.membership.establishment.status !== "ACTIVE"
      )
        throw new UnauthorizedException("Código local inválido o vencido");
      const removed = await tx.localCredential.deleteMany({
        where: { id: credential.id, kind: "BOOTSTRAP" },
      });
      if (removed.count !== 1)
        throw new UnauthorizedException("Código local ya utilizado");
      await tx.localCredential.create({
        data: {
          digest: digestToken(session),
          kind: "SESSION",
          membershipId: credential.membershipId,
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
        },
      });
    });
    return session;
  }

  async logout(token: string | undefined): Promise<void> {
    if (token)
      await this.prisma.client.localCredential.deleteMany({
        where: { digest: digestToken(token), kind: "SESSION" },
      });
  }
}
