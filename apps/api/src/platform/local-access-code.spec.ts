import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import type { Prisma } from "../generated/prisma/client";
import { existingMembershipId } from "./local-access-code";

describe("dev:access: selección inequívoca", () => {
  const id = randomUUID();
  const findMany = jest.fn();
  const tx = {
    membership: { findMany },
  } as unknown as Prisma.TransactionClient;
  beforeEach(() => findMany.mockReset());
  it("reutiliza la única membresía existente", async () => {
    findMany.mockResolvedValue([{ id }]);
    await expect(existingMembershipId(tx)).resolves.toBe(id);
  });
  it("exige selección si hay varias, aunque alguna esté inactiva", async () => {
    findMany.mockResolvedValue([{ id }, { id: randomUUID() }]);
    await expect(existingMembershipId(tx)).rejects.toThrow("--membership");
    expect(findMany).toHaveBeenCalledWith({ select: { id: true }, take: 2 });
  });
  it("no incorpora una cuenta si no existen membresías", async () => {
    findMany.mockResolvedValue([]);
    await expect(existingMembershipId(tx)).rejects.toThrow("no crea");
  });
  it("respeta la selección explícita sin elegir otra cuenta", async () => {
    await expect(existingMembershipId(tx, id)).resolves.toBe(id);
    expect(findMany).not.toHaveBeenCalled();
  });
  it.each(["", "invalid", "--name Otro", "postgresql://example.test"])(
    "rechaza selección inválida %s",
    async (selected) => {
      await expect(existingMembershipId(tx, selected)).rejects.toThrow(
        "UUID válido",
      );
      expect(findMany).not.toHaveBeenCalled();
    },
  );
});

describe("dev:access: lanzador cerrado fuera de desarrollo local", () => {
  it.each([
    { NODE_ENV: "production", APP_ENV: "local" },
    { NODE_ENV: "test", APP_ENV: "local" },
    { NODE_ENV: "development", APP_ENV: "production" },
    { NODE_ENV: "development", APP_ENV: "staging" },
  ])("rechaza $NODE_ENV/$APP_ENV antes de ejecutar la CLI", (env) => {
    const result = spawnSync(
      process.execPath,
      [
        resolve(__dirname, "../../../../scripts/local-development.mjs"),
        "access",
      ],
      {
        env: { ...process.env, ...env, LOCAL_ACCESS_ENABLED: "true" },
        encoding: "utf8",
        timeout: 10000,
      },
    );
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("exclusivamente local");
    expect(result.stderr).not.toMatch(/postgres(?:ql)?:\/\//);
  });
});
