import { Reflector } from "@nestjs/core";
import type { ExecutionContext } from "@nestjs/common";
import { SectorCapabilityGuard } from "./sector.guard";
import type { Capability, VerticalCode } from "./sector.contract";
function context(vertical: VerticalCode | null) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ owner: { vertical } }) }),
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
  } as unknown as ExecutionContext;
}
describe("Guard de capacidades después de autorización", () => {
  const reflector = new Reflector();
  const guard = new SectorCapabilityGuard(reflector);
  beforeEach(() => jest.restoreAllMocks());
  it.each(["DENTAL", "FITNESS", "AUTOMOTIVE", null] as const)(
    "rechaza invocaciones directas para %s",
    (vertical) => {
      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue(["individualServices"]);
      expect(() => guard.canActivate(context(vertical))).toThrow();
    },
  );
  it("rechaza reservas aunque el sector sea BEAUTY", () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue(["individualBookings"] satisfies Capability[]);
    expect(() => guard.canActivate(context("BEAUTY"))).toThrow("todavía");
  });
  it("autoriza solo capacidades implementadas", () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue(["resources", "workSchedules"] satisfies Capability[]);
    expect(guard.canActivate(context("BEAUTY"))).toBe(true);
  });
});
