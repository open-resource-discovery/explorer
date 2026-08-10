import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { JsonHighlight } from "./JsonHighlight";

function spans(json: string) {
  const { container } = render(<JsonHighlight json={json} />);
  return Array.from(container.querySelectorAll("span")).map((s) => ({
    cls: s.className,
    text: s.textContent,
  }));
}

describe("JsonHighlight — token classification", () => {
  it("colours object keys with hljs-attr", () => {
    const result = spans('{"name": "Alice"}');
    expect(
      result.some((s) => s.cls === "hljs-attr" && s.text === '"name"'),
    ).toBe(true);
  });

  it("colours string values with hljs-string", () => {
    const result = spans('{"name": "Alice"}');
    expect(
      result.some((s) => s.cls === "hljs-string" && s.text === '"Alice"'),
    ).toBe(true);
  });

  it("colours integer numbers with hljs-number", () => {
    const result = spans('{"count": 42}');
    expect(result.some((s) => s.cls === "hljs-number" && s.text === "42")).toBe(
      true,
    );
  });

  it("colours float numbers with hljs-number", () => {
    const result = spans('{"ratio": 3.14}');
    expect(
      result.some((s) => s.cls === "hljs-number" && s.text === "3.14"),
    ).toBe(true);
  });

  it("colours negative numbers with hljs-number", () => {
    const result = spans('{"temp": -5}');
    expect(result.some((s) => s.cls === "hljs-number" && s.text === "-5")).toBe(
      true,
    );
  });

  it("colours true with hljs-literal", () => {
    const result = spans('{"active": true}');
    expect(
      result.some((s) => s.cls === "hljs-literal" && s.text === "true"),
    ).toBe(true);
  });

  it("colours false with hljs-literal", () => {
    const result = spans('{"active": false}');
    expect(
      result.some((s) => s.cls === "hljs-literal" && s.text === "false"),
    ).toBe(true);
  });

  it("colours null with hljs-literal", () => {
    const result = spans('{"value": null}');
    expect(
      result.some((s) => s.cls === "hljs-literal" && s.text === "null"),
    ).toBe(true);
  });

  it("colours punctuation with hljs-punctuation", () => {
    const result = spans('{"a": 1}');
    const puncs = result
      .filter((s) => s.cls === "hljs-punctuation")
      .map((s) => s.text);
    expect(puncs).toContain("{");
    expect(puncs).toContain("}");
    expect(puncs).toContain(":");
  });

  it("renders array brackets as punctuation", () => {
    const result = spans('{"arr": [1, 2]}');
    const puncs = result
      .filter((s) => s.cls === "hljs-punctuation")
      .map((s) => s.text);
    expect(puncs).toContain("[");
    expect(puncs).toContain("]");
  });

  it("does not wrap whitespace in spans", () => {
    const { container } = render(
      <JsonHighlight json={"{\n  " + '"a": 1\n}'} />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("\n");
  });

  it("handles escaped quotes inside strings without dropping tokens", () => {
    const result = spans('{"msg": "say \\"hi\\""}');
    expect(result.some((s) => s.cls === "hljs-string")).toBe(true);
  });

  it("preserves full JSON text content", () => {
    const json = JSON.stringify(
      { a: 1, b: "hello", c: true, d: null },
      null,
      2,
    );
    const { container } = render(<JsonHighlight json={json} />);
    expect(container.textContent).toBe(json);
  });

  it("handles empty object", () => {
    const { container } = render(<JsonHighlight json="{}" />);
    expect(container.textContent).toBe("{}");
  });

  it("handles empty array", () => {
    const { container } = render(<JsonHighlight json="[]" />);
    expect(container.textContent).toBe("[]");
  });

  it("handles deeply nested objects", () => {
    const json = JSON.stringify({ a: { b: { c: 42 } } }, null, 2);
    const { container } = render(<JsonHighlight json={json} />);
    expect(container.textContent).toBe(json);
  });
});
