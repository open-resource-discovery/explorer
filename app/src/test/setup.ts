import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(cleanup);

// Node.js 22+ adds its own `localStorage` global that is undefined without
// the --localstorage-file flag. Overwrite it with a working in-memory
// implementation so jsdom tests can use localStorage freely.
const _store: Record<string, string> = {};
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  writable: true,
  value: {
    getItem: (key: string) => _store[key] ?? null,
    setItem: (key: string, value: string) => {
      _store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete _store[key];
    },
    clear: () => {
      for (const k in _store) delete _store[k];
    },
    get length() {
      return Object.keys(_store).length;
    },
    key: (i: number) => Object.keys(_store)[i] ?? null,
  },
});

// jsdom does not implement window.matchMedia. This stub is the minimum needed
// for ThemeProvider: it returns a non-matching media query by default and
// exposes addEventListener/removeEventListener so the "system" theme path works.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
