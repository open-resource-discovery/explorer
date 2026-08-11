import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { XmlHighlight } from "./XmlHighlight";

function spans(xml: string) {
  const { container } = render(<XmlHighlight xml={xml} />);
  return Array.from(container.querySelectorAll("span")).map((s) => ({
    cls: s.className,
    text: s.textContent,
  }));
}

describe("XmlHighlight — token classification", () => {
  it("colours tag names with hljs-tag", () => {
    const result = spans("<root></root>");
    expect(
      result.some((s) => s.cls === "hljs-tag" && s.text?.includes("root")),
    ).toBe(true);
  });

  it("colours attribute names with hljs-attr", () => {
    const result = spans('<root id="1"></root>');
    expect(result.some((s) => s.cls === "hljs-attr" && s.text === "id")).toBe(
      true,
    );
  });

  it("colours attribute values with hljs-string", () => {
    const result = spans('<root id="1"></root>');
    expect(
      result.some((s) => s.cls === "hljs-string" && s.text === '"1"'),
    ).toBe(true);
  });

  it("colours comments with hljs-comment", () => {
    const result = spans("<!-- a comment -->");
    expect(
      result.some(
        (s) => s.cls === "hljs-comment" && s.text === "<!-- a comment -->",
      ),
    ).toBe(true);
  });

  it("colours CDATA sections with hljs-comment", () => {
    const result = spans("<![CDATA[raw data]]>");
    expect(
      result.some(
        (s) => s.cls === "hljs-comment" && s.text === "<![CDATA[raw data]]>",
      ),
    ).toBe(true);
  });

  it("colours processing instructions with hljs-keyword", () => {
    const result = spans('<?xml version="1.0"?>');
    expect(
      result.some(
        (s) => s.cls === "hljs-keyword" && s.text === '<?xml version="1.0"?>',
      ),
    ).toBe(true);
  });

  it("handles self-closing tags", () => {
    const result = spans("<br />");
    expect(result.some((s) => s.cls === "hljs-tag")).toBe(true);
  });

  it("preserves full text content", () => {
    const xml = "<root><child>text</child></root>";
    const { container } = render(<XmlHighlight xml={xml} />);
    expect(container.textContent).toBe(xml);
  });

  it("handles multiple attributes", () => {
    const result = spans('<el a="1" b="2" />');
    const attrs = result
      .filter((s) => s.cls === "hljs-attr")
      .map((s) => s.text);
    expect(attrs).toContain("a");
    expect(attrs).toContain("b");
  });

  it("handles closing tags", () => {
    const result = spans("</root>");
    expect(
      result.some((s) => s.cls === "hljs-tag" && s.text?.includes("/root")),
    ).toBe(true);
  });

  it("handles text nodes between tags", () => {
    const xml = "<p>hello world</p>";
    const { container } = render(<XmlHighlight xml={xml} />);
    expect(container.textContent).toBe(xml);
  });

  it("handles empty input", () => {
    const { container } = render(<XmlHighlight xml="" />);
    expect(container.textContent).toBe("");
  });

  it("handles nested elements", () => {
    const xml = "<a><b><c>deep</c></b></a>";
    const { container } = render(<XmlHighlight xml={xml} />);
    expect(container.textContent).toBe(xml);
  });
});
