import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Browser APIs jsdom doesn't implement.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (!Element.prototype.scrollTo) Element.prototype.scrollTo = () => {};

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
});
