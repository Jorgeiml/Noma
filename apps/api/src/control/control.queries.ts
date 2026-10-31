import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../persistence/prisma.service";
import type { ControlPageQuery } from "./control.dto";
import { idOf } from "./control.dto";
const slice = (q: ControlPageQuery) => ({
  skip: (q.page - 1) * q.size,
  take: q.size,
});
const order = [{ createdAt: "desc" as const }, { id: "desc" as const }];
const wrap = <T>(items: T[], total: number, q: ControlPageQuery) => ({
  items,
  total,
  page: q.page,
  size: q.size,
});
const prefix = (text: string) =>
  text.toLocaleLowerCase("es").replace(/[\\%_]/g, "\\$&") + "%";
export const effectiveManualState = (value: {
  state: string;
  expiresAt: Date;
}) =>
  value.state === "ACTIVE" && value.expiresAt <= new Date()
    ? "EXPIRED"
    : value.state;
function filter<T extends string>(
  value: string | undefined,
  values: readonly T[],
): T | undefined {
  if (!value) return undefined;
  if (!values.includes(value as T))
    throw new BadRequestException("Filtro no válido.");
  return value as T;
}
@Injectable()
export class ControlQueries {
  constructor(private readonly prisma: PrismaService) {}
  private async usersMatching(q: string) {
    if (!q) return undefined;
    return (
      await this.prisma.client.$queryRaw<
        { id: string }[]
      >`SELECT "id" FROM "InternalUser" WHERE lower("displayName") LIKE ${prefix(q)} OR "id"::text=${q}`
    ).map((row) => row.id);
  }
  private async businessesMatching(q: string) {
    if (!q) return undefined;
    return (
      await this.prisma.client.$queryRaw<
        { id: string }[]
      >`SELECT "id" FROM "Establishment" WHERE lower("commercialName") LIKE ${prefix(q)} OR "id"::text=${q}`
    ).map((row) => row.id);
  }
  async dashboard(permissions: readonly string[]) {
    const [applications, decisions, businesses, subscriptions, manual] =
      await Promise.all([
        permissions.includes("applications.read")
          ? this.prisma.client.commercialApplication.groupBy({
              by: ["state"],
              _count: true,
            })
          : [],
        permissions.includes("applications.read")
          ? this.prisma.client.applicationReview.groupBy({
              by: ["decision"],
              _count: true,
            })
          : [],
        permissions.includes("businesses.read")
          ? this.prisma.client.establishment.groupBy({
              by: ["vertical"],
              _count: true,
            })
          : [],
        permissions.includes("subscriptions.read")
          ? this.prisma.client.commercialSubscription.groupBy({
              by: ["state"],
              _count: true,
            })
          : [],
        permissions.includes("subscriptions.read")
          ? Promise.all([
              this.prisma.client.manualActivation.count({
                where: { state: "ACTIVE", expiresAt: { gt: new Date() } },
              }),
              this.prisma.client.manualActivation.count({
                where: { state: "ACTIVE", expiresAt: { lte: new Date() } },
              }),
            ])
          : null,
      ]);
    const pending = permissions.includes("applications.read")
      ? await this.prisma.client.commercialApplication.count({
          where: { state: "ACTIVATION_PENDING", platformReview: { is: null } },
        })
      : null;
    return {
      applications,
      decisions,
      businesses,
      subscriptions,
      pendingReviews: pending,
      manual: manual && { active: manual[0], expired: manual[1] },
    };
  }
  async applications(q: ControlPageQuery) {
    const users = await this.usersMatching(q.q);
    const state = filter(q.state, [
      "REGISTRATION_STARTED",
      "IDENTITY_VERIFIED",
      "PLAN_SELECTED",
      "ACTIVATION_PENDING",
    ] as const);
    const decision = filter(q.decision, [
      "PENDING",
      "APPROVED",
      "REJECTED",
    ] as const);
    const where: Prisma.CommercialApplicationWhereInput = {
      ...(users ? { userId: { in: users } } : {}),
      ...(state ? { state } : {}),
      ...(decision
        ? {
            platformReview:
              decision === "PENDING" ? { is: null } : { decision },
          }
        : {}),
    };
    const [items, total] = await this.prisma.client.$transaction([
      this.prisma.client.commercialApplication.findMany({
        where,
        ...slice(q),
        orderBy: order,
        select: {
          id: true,
          state: true,
          selectedPlan: true,
          createdAt: true,
          platformReview: true,
          user: {
            select: {
              id: true,
              displayName: true,
              externalIdentities: { select: { verifiedAt: true } },
            },
          },
          manualActivation: {
            select: {
              id: true,
              state: true,
              expiresAt: true,
              plan: true,
              membershipId: true,
              version: true,
            },
          },
        },
      }),
      this.prisma.client.commercialApplication.count({ where }),
    ]);
    return wrap(
      items.map(({ user, ...item }) => ({
        ...item,
        user: {
          id: user.id,
          name: user.displayName,
          verified: user.externalIdentities.some(
            (identity) => identity.verifiedAt !== null,
          ),
        },
        manualActivation: item.manualActivation && {
          ...item.manualActivation,
          effectiveState: effectiveManualState(item.manualActivation),
        },
      })),
      total,
      q,
    );
  }
  async application(id: string, historyAllowed: boolean) {
    const item = await this.prisma.client.commercialApplication.findUnique({
      where: { id },
      select: {
        id: true,
        state: true,
        selectedPlan: true,
        createdAt: true,
        platformReview: true,
        manualActivation: true,
        subscription: {
          select: {
            id: true,
            state: true,
            plan: true,
            activatedAt: true,
            evidenceSource: true,
          },
        },
        user: {
          select: {
            id: true,
            displayName: true,
            externalIdentities: {
              select: { verifiedAt: true, synthetic: true },
            },
            memberships: {
              select: {
                id: true,
                role: true,
                status: true,
                establishment: {
                  select: { id: true, commercialName: true, status: true },
                },
              },
            },
          },
        },
      },
    });
    if (!item) throw new NotFoundException("Solicitud no disponible.");
    const history = historyAllowed
      ? await this.prisma.client.platformAudit.findMany({
          where: { resourceId: id },
          take: 50,
          orderBy: order,
          select: {
            id: true,
            action: true,
            reason: true,
            outcome: true,
            createdAt: true,
            changes: true,
            actor: { select: { id: true, displayName: true } },
          },
        })
      : [];
    const { user, ...data } = item;
    return {
      ...data,
      user: {
        id: user.id,
        name: user.displayName,
        verified: user.externalIdentities.some((x) => x.verifiedAt),
        synthetic:
          user.externalIdentities.length > 0 &&
          user.externalIdentities.every((x) => x.synthetic),
      },
      memberships: user.memberships,
      history,
      manualActivation: item.manualActivation && {
        ...item.manualActivation,
        effectiveState: effectiveManualState(item.manualActivation),
      },
    };
  }
  async businesses(q: ControlPageQuery) {
    const ids = await this.businessesMatching(q.q);
    const state = filter(q.state, ["ACTIVE", "SUSPENDED"] as const);
    const vertical = filter(q.vertical, [
      "BEAUTY",
      "DENTAL",
      "FITNESS",
      "AUTOMOTIVE",
      "UNCLASSIFIED",
    ] as const);
    const where: Prisma.EstablishmentWhereInput = {
      ...(ids ? { id: { in: ids } } : {}),
      ...(state ? { status: state } : {}),
      ...(vertical
        ? { vertical: vertical === "UNCLASSIFIED" ? null : vertical }
        : {}),
    };
    const [items, total] = await this.prisma.client.$transaction([
      this.prisma.client.establishment.findMany({
        where,
        ...slice(q),
        orderBy: order,
        select: {
          id: true,
          commercialName: true,
          vertical: true,
          status: true,
          createdAt: true,
          commercialSubscription: {
            select: { id: true, plan: true, state: true, evidenceSource: true },
          },
          memberships: {
            where: { role: "OWNER", status: "ACTIVE" },
            select: {
              id: true,
              user: { select: { id: true, displayName: true } },
              manualActivation: {
                select: { id: true, state: true, expiresAt: true, plan: true },
              },
            },
          },
          _count: { select: { branches: true } },
        },
      }),
      this.prisma.client.establishment.count({ where }),
    ]);
    return wrap(
      items.map((item) => ({
        ...item,
        memberships: item.memberships.map((m) => ({
          ...m,
          manualActivation: m.manualActivation && {
            ...m.manualActivation,
            effectiveState: effectiveManualState(m.manualActivation),
          },
        })),
      })),
      total,
      q,
    );
  }
  async business(id: string) {
    const item = await this.prisma.client.establishment.findUnique({
      where: { id },
      select: {
        id: true,
        commercialName: true,
        vertical: true,
        status: true,
        createdAt: true,
        commercialSubscription: {
          select: {
            id: true,
            plan: true,
            state: true,
            activatedAt: true,
            evidenceSource: true,
          },
        },
        branches: {
          select: { id: true, name: true, timeZone: true, active: true },
        },
        memberships: {
          select: {
            id: true,
            role: true,
            status: true,
            user: { select: { id: true, displayName: true } },
            manualActivation: {
              select: { id: true, state: true, expiresAt: true, plan: true },
            },
          },
        },
      },
    });
    if (!item) throw new NotFoundException("Negocio no disponible.");
    return {
      ...item,
      memberships: item.memberships.map((m) => ({
        ...m,
        manualActivation: m.manualActivation && {
          ...m.manualActivation,
          effectiveState: effectiveManualState(m.manualActivation),
        },
      })),
    };
  }
  async subscriptions(q: ControlPageQuery) {
    const state = filter(q.state, [
      "ACTIVATION_PENDING",
      "ACTIVE",
      "SUSPENDED",
      "CANCELLED",
      "REVOKED",
      "EXPIRED",
    ] as const);

    const query = q.q.toLocaleLowerCase("es"),
      starts = prefix(q.q),
      stateFilter = state ?? null,
      now = new Date();
    const sources = Prisma.sql`
      SELECT s."id",s."createdAt",'commercial' AS "kind" FROM "CommercialSubscription" s
      WHERE (${stateFilter}::text IS NULL OR s."state"::text=${stateFilter})
        AND (${query}='' OR EXISTS (SELECT 1 FROM "Establishment" e WHERE e."id"=s."establishmentId" AND (lower(e."commercialName") LIKE ${starts} OR e."id"::text=${query})))
      UNION ALL
      SELECT m."id",m."createdAt",'manual' AS "kind" FROM "ManualActivation" m
      WHERE (${stateFilter}::text IS NULL OR (CASE WHEN m."state"='ACTIVE' AND m."expiresAt"<=${now} THEN 'EXPIRED' ELSE m."state"::text END)=${stateFilter})
        AND (${query}='' OR EXISTS (SELECT 1 FROM "CommercialApplication" a JOIN "InternalUser" u ON u."id"=a."userId" WHERE a."id"=m."applicationId" AND (lower(u."displayName") LIKE ${starts} OR u."id"::text=${query}))
        OR EXISTS (SELECT 1 FROM "Membership" mm JOIN "Establishment" e ON e."id"=mm."establishmentId" WHERE mm."id"=m."membershipId" AND (lower(e."commercialName") LIKE ${starts} OR e."id"::text=${query})))`;
    const [rows, count] = await this.prisma.client.$transaction(
      [
        this.prisma.client.$queryRaw<{ id: string; kind: string }[]>(
          Prisma.sql`SELECT "id","kind" FROM (${sources}) entries ORDER BY "createdAt" DESC,"id" DESC LIMIT ${q.size} OFFSET ${(q.page - 1) * q.size}`,
        ),
        this.prisma.client.$queryRaw<{ total: bigint }[]>(
          Prisma.sql`SELECT count(*) AS total FROM (${sources}) entries`,
        ),
      ],
      { isolationLevel: "RepeatableRead" },
    );
    const commercial = await this.prisma.client.commercialSubscription.findMany(
      {
        where: {
          id: {
            in: rows.filter((x) => x.kind === "commercial").map((x) => x.id),
          },
        },
        select: {
          id: true,
          plan: true,
          state: true,
          evidenceSource: true,
          activatedAt: true,
          createdAt: true,
          establishment: { select: { id: true, commercialName: true } },
          applicationId: true,
        },
      },
    );
    const manual = await this.prisma.client.manualActivation.findMany({
      where: {
        id: { in: rows.filter((x) => x.kind === "manual").map((x) => x.id) },
      },
      select: {
        id: true,
        plan: true,
        state: true,
        expiresAt: true,
        createdAt: true,
        applicationId: true,
        version: true,
        reason: true,
        membership: {
          select: {
            establishment: { select: { id: true, commercialName: true } },
          },
        },
        application: {
          select: { user: { select: { id: true, displayName: true } } },
        },
      },
    });
    const items = rows.map((row) =>
      row.kind === "commercial"
        ? {
            ...commercial.find((x) => x.id === row.id)!,
            kind: "commercial" as const,
          }
        : (() => {
            const item = manual.find((x) => x.id === row.id)!;
            return {
              ...item,
              kind: "manual" as const,
              effectiveState: effectiveManualState(item),
            };
          })(),
    );
    return wrap(items, Number(count[0]!.total), q);
  }
  async users(q: ControlPageQuery) {
    const ids = await this.usersMatching(q.q);
    const where: Prisma.InternalUserWhereInput = ids ? { id: { in: ids } } : {};
    const [items, total] = await this.prisma.client.$transaction([
      this.prisma.client.internalUser.findMany({
        where,
        ...slice(q),
        orderBy: order,
        select: {
          id: true,
          displayName: true,
          createdAt: true,
          platformAccess: {
            select: { role: true, version: true, revokedAt: true },
          },
          externalIdentities: {
            select: {
              id: true,
              issuer: true,
              email: true,
              verifiedAt: true,
              synthetic: true,
            },
          },
          memberships: {
            select: {
              id: true,
              role: true,
              status: true,
              establishment: {
                select: { id: true, commercialName: true, status: true },
              },
            },
          },
        },
      }),
      this.prisma.client.internalUser.count({ where }),
    ]);
    return wrap(items, total, q);
  }
  async audit(q: ControlPageQuery) {
    if (q.q) idOf(q.q);
    const state = filter(q.state, ["SUCCESS", "DENIED", "REJECTED"] as const);
    const where: Prisma.PlatformAuditWhereInput = {
      ...(state ? { outcome: state } : {}),
      ...(q.q ? { OR: [{ actorUserId: q.q }, { resourceId: q.q }] } : {}),
    };
    const [items, total] = await this.prisma.client.$transaction([
      this.prisma.client.platformAudit.findMany({
        where,
        ...slice(q),
        orderBy: order,
        select: {
          id: true,
          action: true,
          resourceType: true,
          resourceId: true,
          reason: true,
          outcome: true,
          changes: true,
          createdAt: true,
          actor: { select: { id: true, displayName: true } },
        },
      }),
      this.prisma.client.platformAudit.count({ where }),
    ]);
    return wrap(items, total, q);
  }
}
