import { applicationEmails } from "./application-identity";
it("identifica todas las direcciones vinculadas y distingue cuáles están verificadas", () => {
  expect(
    applicationEmails([
      { email: "unverified@example.test", verifiedAt: null },
      { email: "verified@example.test", verifiedAt: new Date() },
    ]),
  ).toEqual([
    { email: "verified@example.test", verified: true },
    { email: "unverified@example.test", verified: false },
  ]);
});
it("no duplica una dirección por mayúsculas y conserva evidencia de verificación", () => {
  expect(
    applicationEmails([
      { email: "Same@example.test", verifiedAt: null },
      { email: "same@example.test", verifiedAt: new Date() },
    ]),
  ).toEqual([{ email: "Same@example.test", verified: true }]);
});
