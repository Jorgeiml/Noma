import { act, fireEvent, render } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Nomi } from "./Nomi";
it("no activa animación con movimiento reducido y pausa al ocultarse", () => {
  let notify: () => void = () => {};
  let reduced = true;
  const media = {
    get matches() {
      return reduced;
    },
    addEventListener: (_name: string, listener: () => void) => {
      notify = listener;
    },
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", () => media);
  const disconnect = vi.fn();
  let visibility: (visible: boolean) => void = () => {};
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        visibility = (visible) => callback([{ isIntersecting: visible }]);
      }
      observe() {
        visibility(true);
      }
      disconnect = disconnect;
    },
  );
  const { container, unmount } = render(<Nomi />);
  expect(container.querySelector("svg")).toHaveAttribute(
    "data-active",
    "false",
  );
  reduced = false;
  act(() => notify());
  expect(container.querySelector("svg")).toHaveAttribute("data-active", "true");
  act(() => visibility(false));
  expect(container.querySelector("svg")).toHaveAttribute(
    "data-active",
    "false",
  );
  act(() => visibility(true));
  vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  fireEvent(document, new Event("visibilitychange"));
  expect(container.querySelector("svg")).toHaveAttribute(
    "data-active",
    "false",
  );
  unmount();
  expect(disconnect).toHaveBeenCalled();
  expect(media.removeEventListener).toHaveBeenCalled();
});
