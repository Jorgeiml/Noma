import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { BusinessLogo, prepareLogo } from "./BusinessLogo";
import { platformApi, type Establishment } from "./api/platform";
import { sectorConfiguration } from "../../api/src/sector/sector.contract";
vi.mock("./api/platform", async (original) => ({
  ...(await original<typeof import("./api/platform")>()),
  platformApi: { logo: vi.fn() },
}));
const png =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aPrsAAAAASUVORK5CYII=";
const saved: Establishment = {
  id: "business",
  commercialName: "Negocio de prueba",
  status: "ACTIVE",
  timeZone: "America/Guayaquil",
  currency: "USD",
  businessPhone: null,
  websiteUrl: null,
  version: 4,
  updatedAt: "2026-10-30T12:00:00Z",
  sectorConfiguration: sectorConfiguration("BEAUTY"),
};
beforeEach(() => {
  vi.mocked(platformApi.logo).mockReset();
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn().mockResolvedValue({ width: 600, height: 300, close: vi.fn() }),
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(png);
});
it("adapta el archivo y guarda el logo con versión, sin editar otros campos", async () => {
  const onSaved = vi.fn(),
    onBusyChange = vi.fn();
  vi.mocked(platformApi.logo).mockResolvedValue({
    ...saved,
    logoDataUrl: png,
    version: 5,
  });
  render(
    <BusinessLogo
      saved={saved}
      disabled={false}
      onSaved={onSaved}
      onBusyChange={onBusyChange}
    />,
  );
  fireEvent.change(screen.getByLabelText("Seleccionar logo del negocio"), {
    target: { files: [new File(["image"], "logo.png", { type: "image/png" })] },
  });
  await screen.findByText("Logo guardado.");
  expect(platformApi.logo).toHaveBeenCalledWith(saved.id, png, 4);
  expect(onSaved).toHaveBeenCalledWith(
    expect.objectContaining({ logoDataUrl: png, version: 5 }),
  );
  expect(onBusyChange).toHaveBeenLastCalledWith(false);
});
it("rechaza SVG y archivos excesivos antes de enviarlos", async () => {
  await expect(
    prepareLogo(new File(["<svg/>"], "logo.svg", { type: "image/svg+xml" })),
  ).rejects.toThrow("PNG, JPG o WebP");
  expect(createImageBitmap).not.toHaveBeenCalled();
  expect(platformApi.logo).not.toHaveBeenCalled();
});
it("mantiene el logo guardado ante errores y bloquea cambios con un borrador pendiente", async () => {
  vi.mocked(platformApi.logo).mockRejectedValue(new Error("La versión cambió"));
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const onSaved = vi.fn(),
    { rerender } = render(
      <BusinessLogo
        saved={{ ...saved, logoDataUrl: png }}
        disabled={false}
        onSaved={onSaved}
        onBusyChange={vi.fn()}
      />,
    );
  fireEvent.click(screen.getByRole("button", { name: "Quitar logo" }));
  await screen.findByRole("alert");
  expect(screen.getByRole("img")).toHaveAttribute("src", png);
  expect(onSaved).not.toHaveBeenCalled();
  rerender(
    <BusinessLogo
      saved={saved}
      disabled
      onSaved={onSaved}
      onBusyChange={vi.fn()}
    />,
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Añadir logo" })).toBeDisabled(),
  );
});
