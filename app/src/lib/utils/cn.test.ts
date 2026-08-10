import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("returns a single class unchanged", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("joins multiple classes", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("filters out falsy values", () => {
    expect(cn("foo", false, undefined, null, "bar")).toBe("foo bar");
  });

  it("deduplicates conflicting Tailwind utilities (last wins)", () => {
    // tailwind-merge resolves conflicts: p-4 overrides p-2
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("preserves non-conflicting utilities", () => {
    expect(cn("p-2", "m-4")).toBe("p-2 m-4");
  });

  it("handles conditional object syntax from clsx", () => {
    expect(cn({ foo: true, bar: false })).toBe("foo");
  });

  it("handles array syntax from clsx", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("returns empty string when all inputs are falsy", () => {
    expect(cn(false, undefined, null)).toBe("");
  });
});
