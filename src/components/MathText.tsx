import katex from "katex";
import "katex/dist/katex.min.css";
import { useMemo } from "react";

// $$…$$, \[…\] (display) and $…$, \(…\) (inline), in the order they appear.
const DELIMS = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$([^$]+?)\$|\\\(([\s\S]+?)\\\)/g;

type Part = { text: string } | { tex: string; display: boolean; raw: string };

function split(src: string): Part[] {
  const parts: Part[] = [];
  let last = 0;
  for (const m of src.matchAll(DELIMS)) {
    if (m.index! > last) parts.push({ text: src.slice(last, m.index) });
    const display = m[1] !== undefined || m[2] !== undefined;
    parts.push({ tex: (m[1] ?? m[2] ?? m[3] ?? m[4]).trim(), display, raw: m[0] });
    last = m.index! + m[0].length;
  }
  if (last < src.length) parts.push({ text: src.slice(last) });
  return parts;
}

/**
 * Text with LaTeX rendered by KaTeX. A formula KaTeX cannot parse is shown as its source
 * text unchanged, so nothing in the original is altered or dropped.
 */
export function MathText({ source }: { source: string }) {
  const html = useMemo(
    () =>
      split(source).map((p) => {
        if ("text" in p) return null;
        try {
          return katex.renderToString(p.tex, { displayMode: false, throwOnError: true, strict: "ignore" });
        } catch {
          return undefined;
        }
      }),
    [source],
  );
  return (
    <>
      {split(source).map((p, i) =>
        "text" in p ? (
          <span key={i}>{p.text}</span>
        ) : html[i] ? (
          <span key={i} className={p.display ? "math math-display" : "math"} dangerouslySetInnerHTML={{ __html: html[i]! }} />
        ) : (
          <code key={i} className="math-raw">
            {p.raw}
          </code>
        ),
      )}
    </>
  );
}
