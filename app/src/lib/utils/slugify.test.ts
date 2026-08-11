import { describe, it, expect } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("API Resources")).toBe("api-resources");
  });

  it("trims leading and trailing whitespace", () => {
    expect(slugify("  hello world  ")).toBe("hello-world");
  });

  it("collapses multiple spaces into a single hyphen", () => {
    expect(slugify("a  b")).toBe("a-b");
  });

  it("returns an already-lowercase no-space string unchanged", () => {
    expect(slugify("apis")).toBe("apis");
  });
});
