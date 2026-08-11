import { describe, it, expect } from "vitest";
import {
  getResourcesInPackage,
  getResourcesInBundle,
  getResourcesInProduct,
  getResourcesInGroup,
} from "./ResourceGroupList";
import type { OrdDocument } from "@open-resource-discovery/specification";

function doc(partial: Partial<OrdDocument>): OrdDocument {
  return { openResourceDiscovery: "1.9", ...partial } as OrdDocument;
}

describe("getResourcesInPackage", () => {
  it("returns empty array when no resource types are present", () => {
    const result = getResourcesInPackage(doc({}), "pkg:test:Foo");
    expect(result).toEqual([]);
  });

  it("returns groups for resources whose partOfPackage matches", () => {
    const d = doc({
      apiResources: [
        { ordId: "api:1", title: "API One", partOfPackage: "pkg:test:Foo" },
        { ordId: "api:2", title: "API Two", partOfPackage: "pkg:test:Other" },
      ] as OrdDocument["apiResources"],
    });
    const result = getResourcesInPackage(d, "pkg:test:Foo");
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("apiResources");
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0]).toMatchObject({
      ordId: "api:1",
      title: "API One",
    });
  });

  it("excludes resource entries that lack partOfPackage", () => {
    const d = doc({
      apiResources: [
        { ordId: "api:1", title: "API One" },
      ] as OrdDocument["apiResources"],
    });
    const result = getResourcesInPackage(d, "pkg:test:Foo");
    expect(result).toEqual([]);
  });

  it("returns multiple groups when multiple resource types match", () => {
    const d = doc({
      apiResources: [
        { ordId: "api:1", title: "API One", partOfPackage: "pkg:test:Foo" },
      ] as OrdDocument["apiResources"],
      eventResources: [
        { ordId: "evt:1", title: "Evt One", partOfPackage: "pkg:test:Foo" },
      ] as OrdDocument["eventResources"],
    });
    const result = getResourcesInPackage(d, "pkg:test:Foo");
    expect(result).toHaveLength(2);
    const types = result.map((g) => g.type);
    expect(types).toContain("apiResources");
    expect(types).toContain("eventResources");
  });
});

describe("getResourcesInProduct", () => {
  it("returns empty array when no resource types are present", () => {
    const result = getResourcesInProduct(doc({}), "ns:product:Foo:");
    expect(result).toEqual([]);
  });

  it("returns group for resources whose partOfProducts contains the productOrdId", () => {
    const d = doc({
      apiResources: [
        {
          ordId: "api:1",
          title: "API One",
          partOfPackage: "pkg:1",
          partOfProducts: ["ns:product:Foo:"],
        },
        {
          ordId: "api:2",
          title: "API Two",
          partOfPackage: "pkg:1",
          partOfProducts: ["ns:product:Other:"],
        },
      ] as OrdDocument["apiResources"],
    });
    const result = getResourcesInProduct(d, "ns:product:Foo:");
    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0]).toMatchObject({
      ordId: "api:1",
      title: "API One",
    });
  });

  it("excludes resources with no partOfProducts field", () => {
    const d = doc({
      apiResources: [
        { ordId: "api:1", title: "API One", partOfPackage: "pkg:1" },
      ] as OrdDocument["apiResources"],
    });
    expect(getResourcesInProduct(d, "ns:product:Foo:")).toEqual([]);
  });

  it("excludes resources with empty partOfProducts array", () => {
    const d = doc({
      apiResources: [
        {
          ordId: "api:1",
          title: "API One",
          partOfPackage: "pkg:1",
          partOfProducts: [] as string[],
        },
      ] as OrdDocument["apiResources"],
    });
    expect(getResourcesInProduct(d, "ns:product:Foo:")).toEqual([]);
  });

  it("returns multiple groups when multiple resource types match", () => {
    const d = doc({
      apiResources: [
        {
          ordId: "api:1",
          title: "API One",
          partOfPackage: "pkg:1",
          partOfProducts: ["ns:product:Foo:"],
        },
      ] as OrdDocument["apiResources"],
      entityTypes: [
        {
          ordId: "et:1",
          title: "ET One",
          partOfPackage: "pkg:1",
          partOfProducts: ["ns:product:Foo:"],
        },
      ] as OrdDocument["entityTypes"],
    });
    const result = getResourcesInProduct(d, "ns:product:Foo:");
    expect(result).toHaveLength(2);
  });
});

describe("getResourcesInGroup", () => {
  it("returns empty array when no resource types are present", () => {
    expect(getResourcesInGroup(doc({}), "ns.grptype:ns.grp")).toEqual([]);
  });

  it("returns group for resources whose partOfGroups contains the groupId", () => {
    const d = doc({
      apiResources: [
        {
          ordId: "api:1",
          title: "API One",
          partOfPackage: "pkg:1",
          partOfGroups: ["ns.grptype:ns.grp"],
        },
        {
          ordId: "api:2",
          title: "API Two",
          partOfPackage: "pkg:1",
          partOfGroups: ["ns.grptype:other.grp"],
        },
      ] as OrdDocument["apiResources"],
    });
    const result = getResourcesInGroup(d, "ns.grptype:ns.grp");
    expect(result).toHaveLength(1);
    expect(result[0].items[0]).toMatchObject({ ordId: "api:1" });
  });

  it("excludes resources with no partOfGroups field", () => {
    const d = doc({
      apiResources: [
        { ordId: "api:1", title: "API One", partOfPackage: "pkg:1" },
      ] as OrdDocument["apiResources"],
    });
    expect(getResourcesInGroup(d, "ns.grptype:ns.grp")).toEqual([]);
  });

  it("returns multiple groups when multiple resource types match", () => {
    const d = doc({
      apiResources: [
        {
          ordId: "api:1",
          title: "API One",
          partOfPackage: "pkg:1",
          partOfGroups: ["ns.grptype:ns.grp"],
        },
      ] as OrdDocument["apiResources"],
      dataProducts: [
        {
          ordId: "dp:1",
          title: "DP One",
          partOfPackage: "pkg:1",
          partOfGroups: ["ns.grptype:ns.grp"],
        },
      ] as OrdDocument["dataProducts"],
    });
    const result = getResourcesInGroup(d, "ns.grptype:ns.grp");
    expect(result).toHaveLength(2);
  });
});

describe("getResourcesInBundle", () => {
  it("returns empty array when no resource types are present", () => {
    const result = getResourcesInBundle(doc({}), "bundle:test:Foo");
    expect(result).toEqual([]);
  });

  it("returns group for resources whose partOfConsumptionBundles contains the bundleOrdId", () => {
    const d = doc({
      apiResources: [
        {
          ordId: "api:1",
          title: "API One",
          partOfConsumptionBundles: [{ ordId: "bundle:test:Foo" }],
        },
        {
          ordId: "api:2",
          title: "API Two",
          partOfConsumptionBundles: [{ ordId: "bundle:test:Other" }],
        },
      ] as OrdDocument["apiResources"],
    });
    const result = getResourcesInBundle(d, "bundle:test:Foo");
    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0]).toMatchObject({
      ordId: "api:1",
      title: "API One",
    });
  });

  it("excludes resources with no partOfConsumptionBundles field", () => {
    const d = doc({
      apiResources: [
        { ordId: "api:1", title: "API One" },
      ] as OrdDocument["apiResources"],
    });
    const result = getResourcesInBundle(d, "bundle:test:Foo");
    expect(result).toEqual([]);
  });

  it("excludes resources with empty partOfConsumptionBundles array", () => {
    const d = doc({
      apiResources: [
        {
          ordId: "api:1",
          title: "API One",
          partOfConsumptionBundles: [] as { ordId: string }[],
        },
      ] as OrdDocument["apiResources"],
    });
    const result = getResourcesInBundle(d, "bundle:test:Foo");
    expect(result).toEqual([]);
  });

  it("returns multiple groups when multiple resource types match", () => {
    const d = doc({
      apiResources: [
        {
          ordId: "api:1",
          title: "API One",
          partOfConsumptionBundles: [{ ordId: "bundle:test:Foo" }],
        },
      ] as OrdDocument["apiResources"],
      eventResources: [
        {
          ordId: "evt:1",
          title: "Evt One",
          partOfConsumptionBundles: [{ ordId: "bundle:test:Foo" }],
        },
      ] as OrdDocument["eventResources"],
    });
    const result = getResourcesInBundle(d, "bundle:test:Foo");
    expect(result).toHaveLength(2);
  });
});
