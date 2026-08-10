import { useMemo } from "react";

type Token =
  | { type: "tag"; value: string }
  | { type: "attr"; value: string }
  | { type: "string"; value: string }
  | { type: "comment"; value: string }
  | { type: "cdata"; value: string }
  | { type: "pi"; value: string }
  | { type: "text"; value: string };

function tokenize(xml: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < xml.length) {
    if (xml.startsWith("<!--", i)) {
      const end = xml.indexOf("-->", i + 4);
      const close = end === -1 ? xml.length : end + 3;
      tokens.push({ type: "comment", value: xml.slice(i, close) });
      i = close;
      continue;
    }

    if (xml.startsWith("<![CDATA[", i)) {
      const end = xml.indexOf("]]>", i + 9);
      const close = end === -1 ? xml.length : end + 3;
      tokens.push({ type: "cdata", value: xml.slice(i, close) });
      i = close;
      continue;
    }

    if (xml.startsWith("<?", i)) {
      const end = xml.indexOf("?>", i + 2);
      const close = end === -1 ? xml.length : end + 2;
      tokens.push({ type: "pi", value: xml.slice(i, close) });
      i = close;
      continue;
    }

    if (xml[i] === "<") {
      // Tag — parse tag name, attributes, closing bracket
      let j = i + 1;
      // Consume optional / for closing tags
      if (xml[j] === "/") j++;

      // Tag name
      while (j < xml.length && !/[\s>/]/.test(xml[j])) j++;
      const tagName = xml.slice(i, j); // includes the leading <[/]

      tokens.push({ type: "tag", value: tagName });

      // Attributes until > or />
      while (
        j < xml.length &&
        xml[j] !== ">" &&
        !(xml[j] === "/" && xml[j + 1] === ">")
      ) {
        // Whitespace
        const wsMatch = xml.slice(j).match(/^\s+/);
        if (wsMatch) {
          tokens.push({ type: "text", value: wsMatch[0] });
          j += wsMatch[0].length;
          continue;
        }

        // Attribute name
        const attrMatch = xml.slice(j).match(/^[^\s=>"'/]+/);
        if (attrMatch) {
          tokens.push({ type: "attr", value: attrMatch[0] });
          j += attrMatch[0].length;
          continue;
        }

        // = sign
        if (xml[j] === "=") {
          tokens.push({ type: "text", value: "=" });
          j++;
          // Quoted attribute value
          if (xml[j] === '"' || xml[j] === "'") {
            const quote = xml[j];
            let end = j + 1;
            while (end < xml.length && xml[end] !== quote) end++;
            end++;
            tokens.push({ type: "string", value: xml.slice(j, end) });
            j = end;
          }
          continue;
        }

        // Anything else — emit as text to avoid infinite loop
        tokens.push({ type: "text", value: xml[j] });
        j++;
      }

      // Closing bracket(s)
      if (j < xml.length) {
        if (xml[j] === "/" && xml[j + 1] === ">") {
          tokens.push({ type: "tag", value: "/>" });
          j += 2;
        } else if (xml[j] === ">") {
          tokens.push({ type: "tag", value: ">" });
          j++;
        }
      }

      i = j;
      continue;
    }

    // Text node — consume until next <
    const nextTag = xml.indexOf("<", i);
    const end = nextTag === -1 ? xml.length : nextTag;
    tokens.push({ type: "text", value: xml.slice(i, end) });
    i = end;
  }

  return tokens;
}

const CLASS: Record<Token["type"], string> = {
  tag: "hljs-tag",
  attr: "hljs-attr",
  string: "hljs-string",
  comment: "hljs-comment",
  cdata: "hljs-comment",
  pi: "hljs-keyword",
  text: "",
};

export function XmlHighlight({ xml }: { xml: string }) {
  const tokens = useMemo(() => tokenize(xml), [xml]);
  return (
    <>
      {tokens.map((tok, idx) =>
        tok.type === "text" ? (
          tok.value
        ) : (
          <span key={idx} className={CLASS[tok.type]}>
            {tok.value}
          </span>
        ),
      )}
    </>
  );
}
