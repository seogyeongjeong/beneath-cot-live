/** Split a token's display piece into leading whitespace, visible text and trailing whitespace. */
export function splitToken(t: string) {
  const m = /^(\s*)(.*?)(\s*)$/s.exec(t)!;
  return { lead: m[1], core: m[2], trail: m[3] };
}

/** Whitespace between token boxes: a space, or one line break (paragraph breaks collapse to one). */
export function Whitespace({ ws }: { ws: string }) {
  if (!ws) return null;
  return /\n/.test(ws) ? <br /> : <> </>;
}
