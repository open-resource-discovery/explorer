import { describe, it, expect } from "vitest";
import { ordIdToResourceTypeGroup } from "./ordIdUtils";

describe("ordIdToResourceTypeGroup", () => {
  it("returns null for an empty string", () => {
    expect(ordIdToResourceTypeGroup("")).toBeNull();
  });

  it("returns null when segment is not a known resource type", () => {
    expect(ordIdToResourceTypeGroup("ns:unknownType:foo:v1")).toBeNull();
  });

  it("returns null when ordId has only one segment", () => {
    expect(ordIdToResourceTypeGroup("onlyone")).toBeNull();
  });

  it("maps apiResource to apiResources", () => {
    expect(ordIdToResourceTypeGroup("ns:apiResource:foo:v1")).toBe(
      "apiResources",
    );
  });

  it("maps eventResource to eventResources", () => {
    expect(ordIdToResourceTypeGroup("ns:eventResource:foo:v1")).toBe(
      "eventResources",
    );
  });

  it("maps entityType to entityTypes", () => {
    expect(ordIdToResourceTypeGroup("ns:entityType:foo:v1")).toBe(
      "entityTypes",
    );
  });

  it("maps dataProduct to dataProducts", () => {
    expect(ordIdToResourceTypeGroup("ns:dataProduct:foo:v1")).toBe(
      "dataProducts",
    );
  });

  it("maps capability to capabilities", () => {
    expect(ordIdToResourceTypeGroup("ns:capability:foo:v1")).toBe(
      "capabilities",
    );
  });

  it("maps agent to agents", () => {
    expect(ordIdToResourceTypeGroup("ns:agent:foo:v1")).toBe("agents");
  });

  it("maps integrationDependency to integrationDependencies", () => {
    expect(ordIdToResourceTypeGroup("ns:integrationDependency:foo:v1")).toBe(
      "integrationDependencies",
    );
  });
});
