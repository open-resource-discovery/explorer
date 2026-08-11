import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "./useTheme";

// Expose the context value in the DOM for assertion.
function ThemeDisplay() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme("dark")}>dark</button>
      <button onClick={() => setTheme("light")}>light</button>
      <button onClick={() => setTheme("system")}>system</button>
    </div>
  );
}

function renderProvider() {
  render(
    <ThemeProvider>
      <ThemeDisplay />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe("ThemeProvider — initial state", () => {
  it("defaults to light when localStorage is empty", () => {
    renderProvider();
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });

  it("resolvedTheme defaults to light (matchMedia mock returns false for dark)", () => {
    renderProvider();
    expect(screen.getByTestId("resolved").textContent).toBe("light");
  });

  it("reads stored theme from localStorage on mount", () => {
    localStorage.setItem("ord-theme", "dark");
    renderProvider();
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
  });

  it("falls back to light for an unrecognised stored value", () => {
    localStorage.setItem("ord-theme", "invalid-value");
    renderProvider();
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });
});

// ---------------------------------------------------------------------------
// setTheme
// ---------------------------------------------------------------------------

describe("ThemeProvider — setTheme", () => {
  it("setTheme('dark') updates theme and resolvedTheme", async () => {
    const user = userEvent.setup();
    renderProvider();
    await user.click(screen.getByText("dark"));
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
  });

  it("setTheme('light') updates theme and resolvedTheme", async () => {
    const user = userEvent.setup();
    localStorage.setItem("ord-theme", "dark");
    renderProvider();
    await user.click(screen.getByText("light"));
    expect(screen.getByTestId("theme").textContent).toBe("light");
    expect(screen.getByTestId("resolved").textContent).toBe("light");
  });

  it("setTheme writes the new value to localStorage", async () => {
    const user = userEvent.setup();
    renderProvider();
    await user.click(screen.getByText("dark"));
    expect(localStorage.getItem("ord-theme")).toBe("dark");
  });
});

// ---------------------------------------------------------------------------
// system theme
// ---------------------------------------------------------------------------

describe("ThemeProvider — system theme", () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("setTheme('system') with matchMedia dark resolves to dark", async () => {
    window.matchMedia = (query: string) =>
      ({
        matches: query.includes("dark"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;

    const user = userEvent.setup();
    renderProvider();
    await user.click(screen.getByText("system"));
    expect(screen.getByTestId("theme").textContent).toBe("system");
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
  });

  it("setTheme('system') with matchMedia light resolves to light", async () => {
    // The global stub already returns matches: false (light), so no override needed.
    const user = userEvent.setup();
    renderProvider();
    await user.click(screen.getByText("system"));
    expect(screen.getByTestId("theme").textContent).toBe("system");
    expect(screen.getByTestId("resolved").textContent).toBe("light");
  });

  it("system theme listener fires on matchMedia change", async () => {
    let storedHandler: (() => void) | null = null;
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: (_: string, fn: () => void) => {
          storedHandler = fn;
        },
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList;

    const user = userEvent.setup();
    renderProvider();
    await user.click(screen.getByText("system"));

    // Simulate the OS switching to dark mode.
    window.matchMedia = (query: string) =>
      ({
        matches: query.includes("dark"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;

    act(() => {
      storedHandler?.();
    });

    expect(screen.getByTestId("resolved").textContent).toBe("dark");
  });
});

// ---------------------------------------------------------------------------
// Error boundary: useTheme outside provider
// ---------------------------------------------------------------------------

describe("useTheme — outside provider", () => {
  it("throws when used outside ThemeProvider", () => {
    // Suppress the React error boundary console output.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    function Bare() {
      useTheme();
      return null;
    }
    expect(() => render(<Bare />)).toThrow(
      "useTheme must be used inside ThemeProvider",
    );
    spy.mockRestore();
  });
});
