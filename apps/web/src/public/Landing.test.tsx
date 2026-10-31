import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Landing } from "./Landing";
import LandingBody from "./LandingBody";
import { PublicHeader } from "./PublicChrome";
import { publicContactUrl, sectorWhatsAppUrl } from "./demo-scenarios";
afterEach(() => vi.unstubAllEnvs());
beforeEach(() => {
  vi.stubEnv("VITE_PUBLIC_CONTACT_URL", "");
  window.history.replaceState(null, "", "/");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new Error("Public UI must not call APIs")),
  );
});

it("ofrece WhatsApp para otro giro, con mensaje preparado y sin enviar nada", async () => {
  vi.stubEnv("VITE_PUBLIC_CONTACT_URL", "https://wa.me/593990000000");
  window.history.replaceState(null, "", "/#sectores");
  render(<LandingBody />);
  expect(
    await screen.findByRole("heading", {
      name: "¿Tu giro de negocio no se encuentra aquí?",
    }),
  ).toBeInTheDocument();
  const link = screen.getByRole("link", { name: "Escríbenos por WhatsApp" });
  const url = new URL(link.getAttribute("href")!);
  expect(url.origin).toBe("https://wa.me");
  expect(url.pathname).toBe("/593990000000");
  expect(url.searchParams.get("text")).toContain(
    "Mi giro de negocio no aparece",
  );
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
  expect(fetch).not.toHaveBeenCalled();
});

it("no muestra un WhatsApp inventado si falta un destino válido", async () => {
  vi.stubEnv("VITE_PUBLIC_CONTACT_URL", "");
  window.history.replaceState(null, "", "/#sectores");
  render(<LandingBody />);
  await screen.findByRole("group", { name: "Explorar las cuatro verticales" });
  expect(
    screen.queryByRole("link", { name: "Escríbenos por WhatsApp" }),
  ).not.toBeInTheDocument();
  for (const value of [
    undefined,
    "https://example.test/contact",
    "https://wa.me.example.test/593990000000",
    "https://wa.me/not-a-number",
    "https://wa.me:444/593990000000",
    "https://user:password@wa.me/593990000000",
  ])
    expect(sectorWhatsAppUrl(value)).toBeNull();
});
it("se puede visitar sin sesión, sin consultar APIs ni mostrar datos o navegación privada", () => {
  render(<Landing />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Que atender bien",
  );
  expect(
    screen.queryByLabelText("Navegación principal"),
  ).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Nombre comercial")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Acceder" })).toHaveAttribute(
    "href",
    "/login",
  );
  expect(fetch).not.toHaveBeenCalled();
});
it("explora las verticales sin convertirlas en configuración comercial", async () => {
  window.history.replaceState(null, "", "/#sectores");
  render(<Landing />);
  fireEvent.click(await screen.findByRole("button", { name: /Odontología/ }));
  expect(
    screen.getByRole("heading", { name: "Odontología" }),
  ).toBeInTheDocument();
  expect(screen.getByText(/Sin historias clínicas/)).toBeInTheDocument();
  expect(screen.getByText("Planificada")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /Ver un ejemplo ilustrativo/ }),
  ).toHaveAttribute("href", "/demo#dental");
  expect(fetch).not.toHaveBeenCalled();
});
it("da distintos gestos al personaje y enlaza la demo sin alargar el recorrido", async () => {
  render(<Landing />);
  fireEvent.click(screen.getByRole("button", { name: /Personaje Nomi/ }));
  expect(screen.getByText("Te escucho.")).toBeInTheDocument();
  expect(
    screen.queryByLabelText("Demostración conceptual interactiva"),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Explorar Noma" }));
  expect(
    await screen.findByRole("link", { name: /Probar la demo interactiva/ }),
  ).toHaveAttribute("href", "/demo");
  fireEvent.click(screen.getByRole("button", { name: "Ver adelanto" }));
  expect(
    screen.getByRole("heading", { name: "Todo empieza con un hola." }),
  ).toBeInTheDocument();
  expect(
    screen.queryByLabelText("Demostración conceptual interactiva"),
  ).not.toBeInTheDocument();
  await waitFor(() => expect(fetch).not.toHaveBeenCalled());
});

it("muestra un capítulo a la vez, sigue hashes y permite volver al anterior", async () => {
  window.history.replaceState(null, "", "/#planes");
  render(<Landing />);
  expect(
    await screen.findByRole("heading", { name: "Claro desde el principio." }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Hablemos claro." }),
  ).not.toBeInTheDocument();
  const pricing = screen.getByRole("navigation", { name: "Secciones de Noma" });
  expect(pricing.querySelector('[aria-current="location"]')).toHaveAttribute(
    "href",
    "#planes",
  );
  window.history.replaceState(null, "", "/#preguntas");
  fireEvent(window, new HashChangeEvent("hashchange"));
  expect(
    await screen.findByRole("heading", { name: "Hablemos claro." }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Claro desde el principio." }),
  ).not.toBeInTheDocument();
  window.history.replaceState(null, "", "/#planes");
  fireEvent(window, new HashChangeEvent("hashchange"));
  expect(
    await screen.findByRole("heading", { name: "Claro desde el principio." }),
  ).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});

it("identifica las marcas de muestra y acredita Ecuador en un pie compacto", async () => {
  render(<Landing />);
  fireEvent.click(screen.getByRole("button", { name: "Explorar Noma" }));
  expect(
    await screen.findByRole("heading", { name: "¿Con quiénes trabajamos?" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/marcas ficticias, sin relación comercial/),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Hecho en Ecuador por VérticeEC"),
  ).toBeInTheDocument();
  expect(screen.queryByText(/Google|Facebook/)).not.toBeInTheDocument();
});
it("el menú móvil funciona con botón y Escape, devolviendo el foco", () => {
  render(<PublicHeader />);
  const button = screen.getByRole("button", { name: "Menú" });
  fireEvent.click(button);
  expect(button).toHaveAttribute("aria-expanded", "true");
  fireEvent.keyDown(screen.getByRole("link", { name: "Cómo funciona" }), {
    key: "Escape",
  });
  expect(button).toHaveAttribute("aria-expanded", "false");
  expect(button).toHaveFocus();
  fireEvent.click(button);
  fireEvent.click(screen.getByRole("link", { name: "Cómo funciona" }));
  expect(button).toHaveAttribute("aria-expanded", "false");
});
it("no inventa un canal comercial y valida el destino configurado", () => {
  expect(publicContactUrl(undefined)).toBeNull();
  expect(publicContactUrl("javascript:alert(1)")).toBeNull();
  expect(publicContactUrl("https://user:password@example.test")).toBeNull();
  expect(publicContactUrl("https://example.test/contacto")).toBe(
    "https://example.test/contacto",
  );
  render(<Landing />);
  expect(screen.queryByRole("form")).not.toBeInTheDocument();
  expect(screen.queryByText("Conversar sobre Noma")).not.toBeInTheDocument();
});

it("un enlace directo a los sectores carga el contenido sin depender del scroll", async () => {
  window.history.replaceState(null, "", "/#sectores");
  render(<Landing />);
  expect(
    await screen.findByRole("group", {
      name: "Explorar las cuatro verticales",
    }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Explorar Noma" }),
  ).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
