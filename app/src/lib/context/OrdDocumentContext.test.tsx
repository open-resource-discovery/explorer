import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrdDocumentContext, useOrdDocument } from "./OrdDocumentContext";
import type { OrdDocument } from "@open-resource-discovery/specification";

const minimalDoc: OrdDocument = {
  openResourceDiscovery: "1.14",
  policyLevels: ["sap:core:v1"],
};

function Consumer() {
  const doc = useOrdDocument();
  return <span data-testid="ord-version">{doc.openResourceDiscovery}</span>;
}

describe("useOrdDocument", () => {
  it("returns the document from context", () => {
    render(
      <OrdDocumentContext.Provider value={minimalDoc}>
        <Consumer />
      </OrdDocumentContext.Provider>,
    );
    expect(screen.getByTestId("ord-version").textContent).toBe("1.14");
  });

  it("throws when used outside a provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow(
      "useOrdDocument must be used inside ORDExplorer",
    );
    spy.mockRestore();
  });
});
