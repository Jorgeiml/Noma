import { businessFields, commandOf } from "./onboarding.dto";
import { limitsFor } from "../commercial/business-authorization";
const profile = {
  commercialName: "Negocio de prueba",
  countryCode: "EC",
  city: "Quito",
  businessPhone: "0993020091",
  businessEmail: "fixture@example.test",
  timeZone: "America/Guayaquil",
};
it("valida la identidad comercial sin exigir contraseña ni RUC", () => {
  expect(businessFields(profile)).toMatchObject(profile);
  expect(
    businessFields({ ...profile, beautySubtype: "BARBERSHOP" }).beautySubtype,
  ).toBe("BARBERSHOP");
});
it.each([
  { countryCode: "ZZ" },
  { businessEmail: "no válido" },
  { businessPhone: "abc" },
  { timeZone: "invalid-zone" },
  { beautySubtype: "MEDICAL_DIAGNOSIS" },
  { city: "a".repeat(101) },
  { ownerUserId: "injected" },
])("rechaza un perfil no válido %p", (change) => {
  expect(() => businessFields({ ...profile, ...change })).toThrow();
});
it("los perfiles históricos pueden conservar campos opcionales ausentes", () => {
  expect(
    businessFields(
      { commercialName: "Negocio existente", timeZone: "America/Guayaquil" },
      false,
    ),
  ).toMatchObject({ countryCode: null, city: null, businessEmail: null });
});
it("no acepta límites ni identidades arbitrarias en el comando", () => {
  expect(() =>
    commandOf(
      {
        requestId: "00000000-0000-4000-8000-000000000001",
        version: 0,
        limits: { people: 100 },
      },
      ["data"],
    ),
  ).toThrow();
});
it("resuelve límites desde el contrato de plan y no inventa un Enterprise ilimitado", () => {
  expect(limitsFor("START")).toEqual({
    branches: 1,
    professionals: 2,
    users: 2,
  });
  expect(limitsFor("GROW").professionals).toBe(6);
  expect(limitsFor("SCALE").branches).toBe(3);
  expect(() => limitsFor("ENTERPRISE")).toThrow();
});
