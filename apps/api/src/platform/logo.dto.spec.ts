import { LogoValidationPipe } from "./logo.dto";
const png =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aPrsAAAAASUVORK5CYII=";
const pipe = new LogoValidationPipe();
it("admite PNG pequeño y eliminación explícita, conservando versión", () => {
  expect(pipe.transform({ logoDataUrl: png, version: 3 })).toEqual({
    logoDataUrl: png,
    version: 3,
  });
  expect(pipe.transform({ logoDataUrl: null, version: 3 })).toEqual({
    logoDataUrl: null,
    version: 3,
  });
});
it.each([
  undefined,
  {},
  { logoDataUrl: png },
  { logoDataUrl: png, version: -1 },
  { logoDataUrl: png, version: 0, establishmentId: "another" },
  { logoDataUrl: "https://example.test/a.png", version: 0 },
  { logoDataUrl: "data:image/svg+xml;base64,PHN2Zy8+", version: 0 },
  { logoDataUrl: "data:image/png;base64," + "A".repeat(90001), version: 0 },
])("rechaza formato, tamaño y campos no autorizados: %p", (input) => {
  expect(() => pipe.transform(input)).toThrow();
});
it("rechaza un PNG que declara dimensiones excesivas o está truncado", () => {
  const bytes = Buffer.from(png.split(",")[1]!, "base64");
  bytes.writeUInt32BE(10000, 16);
  expect(() =>
    pipe.transform({
      logoDataUrl: "data:image/png;base64," + bytes.toString("base64"),
      version: 0,
    }),
  ).toThrow();
  expect(() =>
    pipe.transform({ logoDataUrl: png.slice(0, -8), version: 0 }),
  ).toThrow();
});
