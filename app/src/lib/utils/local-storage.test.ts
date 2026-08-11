import { describe, it, expect, beforeEach } from "vitest";
import { getStored, setStored } from "./local-storage";

beforeEach(() => {
  localStorage.clear();
});

describe("getStored", () => {
  it("returns the stored value when the key exists", () => {
    localStorage.setItem("key", "value");
    expect(getStored("key", "fallback")).toBe("value");
  });

  it("returns the fallback when the key is absent", () => {
    expect(getStored("missing", "fallback")).toBe("fallback");
  });

  it("returns the fallback when localStorage throws", () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("storage unavailable");
      },
      configurable: true,
    });
    expect(getStored("key", "safe")).toBe("safe");
    if (original) Object.defineProperty(window, "localStorage", original);
  });
});

describe("setStored", () => {
  it("writes the value to localStorage", () => {
    setStored("key", "hello");
    expect(localStorage.getItem("key")).toBe("hello");
  });

  it("overwrites an existing value", () => {
    localStorage.setItem("key", "old");
    setStored("key", "new");
    expect(localStorage.getItem("key")).toBe("new");
  });

  it("does not throw when localStorage is unavailable", () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("storage unavailable");
      },
      configurable: true,
    });
    expect(() => setStored("key", "value")).not.toThrow();
    if (original) Object.defineProperty(window, "localStorage", original);
  });
});
