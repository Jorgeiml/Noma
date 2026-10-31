// Public, dependency-free contract. Proposals only: no checkout or published tariff.
export const COMMERCIAL_PLANS = [
  {
    id: "START",
    name: "Start",
    scene: "shop",
    monthly: 29,
    annual: 290,
    branches: 1,
    people: 2,
    users: 2,
    numbers: 1,
    sessions: 100,
    line: "Un equipo pequeño. Un buen comienzo.",
  },
  {
    id: "GROW",
    name: "Grow",
    scene: "beach",
    monthly: 59,
    annual: 590,
    branches: 1,
    people: 6,
    users: 6,
    numbers: 1,
    sessions: 350,
    line: "Más equipo. Más conversaciones.",
  },
  {
    id: "SCALE",
    name: "Scale",
    scene: "space",
    monthly: 99,
    annual: 990,
    branches: 3,
    people: 15,
    users: 15,
    numbers: 2,
    sessions: 900,
    line: "Varios espacios. Una misma operación.",
  },
] as const;
export const PLAN_IDS = ["START", "GROW", "SCALE", "ENTERPRISE"] as const;
export type PlanId = (typeof PLAN_IDS)[number];
export const PLAN_TERMS = {
  status: "UNPUBLISHED_PROPOSAL",
  currency: "USD",
  taxIncluded: false,
  checkoutEnabled: false,
} as const;
export const isPlanId = (value: unknown): value is PlanId =>
  typeof value === "string" && PLAN_IDS.some((id) => id === value);
