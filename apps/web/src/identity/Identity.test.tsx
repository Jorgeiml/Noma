import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { AdminShell } from "../AdminShell";
import { ContextualNomi, IdentityScope } from "./Identity";
import { personalities, personality } from "./personality";

function luminance(hex: string) {
  const channels = [1, 3, 5].map((start) => {
    const n = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  });
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}
it.each(Object.entries(personalities))(
  "aplica %s, conserva la silueta y presenta su accesorio",
  (vertical, theme) => {
    const { container } = render(
      <IdentityScope vertical={vertical}>
        <ContextualNomi />
      </IdentityScope>,
    );
    expect(container.firstElementChild).toHaveAttribute(
      "data-personality",
      theme.label,
    );
    const character = container.querySelector(".nomi");
    expect(character).toHaveAttribute("viewBox", "0 0 500 560");
    expect(character).toHaveAttribute("aria-hidden", "true");
    expect(character).toHaveAttribute("data-scene", theme.scene);
    expect(character?.querySelector(".nomi-body")).not.toBeNull();
    expect(character?.querySelector(".nomi-accessory")).not.toBeNull();
    expect(contrast(theme.ink, theme.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#ffffff", theme.accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.accent, theme.canvas)).toBeGreaterThanOrEqual(3);
  },
);
it("utiliza neutral sin contexto y para códigos desconocidos", () => {
  expect(personality()).toBe(personality("desconocido"));
  const { container } = render(<ContextualNomi />);
  expect(container.querySelector(".nomi")).not.toHaveAttribute("data-scene");
});
it("reacciona al contexto autorizado sin depender de la ubicación", () => {
  const props = {
    authorized: true,
    busy: false,
    canSwitch: false,
    onLogout: () => {},
  };
  const { container, rerender } = render(
    <AdminShell {...props} vertical="BEAUTY">
      Agenda
    </AdminShell>,
  );
  expect(container.firstElementChild).toHaveAttribute(
    "data-personality",
    "Beauty",
  );
  rerender(
    <AdminShell {...props} vertical="DENTAL">
      Negocio
    </AdminShell>,
  );
  expect(container.firstElementChild).toHaveAttribute(
    "data-personality",
    "Dental",
  );
  rerender(
    <AdminShell {...props} authorized={false}>
      Acceso
    </AdminShell>,
  );
  expect(container.querySelector(".identity-scope")).toBeNull();
});
