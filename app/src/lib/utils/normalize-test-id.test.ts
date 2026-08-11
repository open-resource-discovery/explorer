import { describe, it, expect } from "vitest";
import { normalizeTestId } from "./normalize-test-id";

describe("normalizeTestId", () => {
  it("lowercases the input", () => {
    expect(normalizeTestId("Hello")).toBe("hello");
  });

  it("replaces spaces with hyphens", () => {
    expect(normalizeTestId("hello world")).toBe("hello-world");
  });

  it("collapses multiple spaces into a single hyphen", () => {
    expect(normalizeTestId("hello   world")).toBe("hello-world");
  });

  it("returns an empty string unchanged", () => {
    expect(normalizeTestId("")).toBe("");
  });

  it("handles a string with no spaces", () => {
    expect(normalizeTestId("dataProducts")).toBe("dataproducts");
  });

  it("handles leading and trailing spaces", () => {
    expect(normalizeTestId("  hello  ")).toBe("hello");
  });
});
