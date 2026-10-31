import { HealthService } from "./health.service";

describe("HealthService", () => {
  it("informa únicamente disponibilidad del proceso API", () => {
    expect(new HealthService().getHealth()).toEqual({
      status: "ok",
      service: "api",
    });
  });
});
