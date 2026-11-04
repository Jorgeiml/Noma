import { randomUUID } from "node:crypto";
import {
  enterpriseLimits,
  freeAccessOf,
  freeChangeOf,
} from "./free-access.dto";
const base = () => ({
  requestId: randomUUID(),
  confirmId: randomUUID(),
  reason: "Cortesía autorizada para validación",
  plan: "GROW",
  mode: "COURTESY",
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
});
it("permite inicio inmediato del servidor sin exigir preferencia ni revisión", () => {
  expect(freeAccessOf(base())).toMatchObject({
    plan: "GROW",
    mode: "COURTESY",
    membershipId: null,
  });
});
it.each(["START", "GROW", "SCALE"])(
  "no acepta límites manipulados para %s",
  (plan) =>
    expect(() =>
      freeAccessOf({ ...base(), plan, limits: { branches: 999 } }),
    ).toThrow(),
);
it("Enterprise requiere todos los límites positivos y acotados", () => {
  const limits = {
    branches: 2,
    professionals: 3,
    users: 4,
    whatsapp: 1,
    aiSessions: 100,
  };
  expect(enterpriseLimits(limits)).toEqual(limits);
  expect(() => enterpriseLimits({ ...limits, branches: 0 })).toThrow();
  expect(() => enterpriseLimits({ ...limits, professionals: 1001 })).toThrow();
  expect(() => freeAccessOf({ ...base(), plan: "ENTERPRISE" })).toThrow();
});
it("rechaza parámetros económicos y referencias externas añadidas por el cliente", () => {
  expect(() =>
    freeAccessOf({ ...base(), transactionId: "inventada" }),
  ).toThrow();
  expect(() => freeAccessOf({ ...base(), revenue: 59 })).toThrow();
  expect(() => freeAccessOf({ ...base(), mode: "PAID" })).toThrow();
});
it("rechaza fechas inexistentes, secretos en motivos y extensiones sin fecha", () => {
  expect(() =>
    freeAccessOf({ ...base(), startsAt: "2026-02-31T00:00:00Z" }),
  ).toThrow();
  expect(() =>
    freeAccessOf({ ...base(), reason: "authorization: Bearer secreto" }),
  ).toThrow();
  expect(() =>
    freeChangeOf({ ...base(), action: "EXTEND", version: 0 }),
  ).toThrow();
});
