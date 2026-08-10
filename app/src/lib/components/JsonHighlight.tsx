import { useMemo } from "react";

type Token =
  | { type: "key"; value: string }
  | { type: "string"; value: string }
  | { type: "number"; value: string }
  | { type: "literal"; value: string }
  | { type: "punctuation"; value: string }
  | { type: "whitespace"; value: string }
  | { type: "fallback"; value: string };

function tokenize(json: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < json.length) {
    // Whitespace
    const wsMatch = json.slice(i).match(/^\s+/);
    if (wsMatch) {
      tokens.push({ type: "whitespace", value: wsMatch[0] });
      i += wsMatch[0].length;
      continue;
    }

    // String (key or value — we'll determine key vs string by context)
    if (json[i] === '"') {
      let end = i + 1;
      while (end < json.length) {
        if (json[end] === "\\") {
          end += 2;
          continue;
        }
        if (json[end] === '"') {
          end++;
          break;
        }
        end++;
      }
      const raw = json.slice(i, end);
      // Look ahead past whitespace for a colon — if found, it's a key
      let peek = end;
      while (peek < json.length && /\s/.test(json[peek])) peek++;
      const isKey = json[peek] === ":";
      tokens.push({ type: isKey ? "key" : "string", value: raw });
      i = end;
      continue;
    }

    // Number
    const numMatch = json.slice(i).match(/^-?\d+(\.\d+)?([eE][+-]?\d+)?/);
    if (numMatch) {
      tokens.push({ type: "number", value: numMatch[0] });
      i += numMatch[0].length;
      continue;
    }

    // Literals: true, false, null
    const litMatch = json.slice(i).match(/^(true|false|null)/);
    if (litMatch) {
      tokens.push({ type: "literal", value: litMatch[0] });
      i += litMatch[0].length;
      continue;
    }

    // Punctuation: { } [ ] , :
    if ("{}[],:".includes(json[i])) {
      tokens.push({ type: "punctuation", value: json[i] });
      i++;
      continue;
    }

    // Fallback: emit as-is
    tokens.push({ type: "fallback", value: json[i] });
    i++;
  }

  return tokens;
}

const CLASS: Record<Token["type"], string> = {
  key: "hljs-attr",
  string: "hljs-string",
  number: "hljs-number",
  literal: "hljs-literal",
  punctuation: "hljs-punctuation",
  whitespace: "",
  fallback: "",
};

export function JsonHighlight({ json }: { json: string }) {
  const tokens = useMemo(() => tokenize(json), [json]);
  return (
    <>
      {tokens.map((tok, idx) =>
        tok.type === "whitespace" || tok.type === "fallback" ? (
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
