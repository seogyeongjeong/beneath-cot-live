// Turn an API / preset result (schema 1.0 or 1.1) into a validated Trace.
// Never re-tokenizes: token order, ids and display pieces come from the server.
import { LABELS, type Label, type Trace, type TokenView, type TraceSource, type WireResult } from "./trace-types";

export class ContractError extends Error {}

function fail(msg: string): never {
  throw new ContractError(msg);
}

export function adaptResult(
  w: WireResult,
  source: TraceSource,
  extra: Partial<Pick<Trace, "preset" | "job">> & { inputText?: string } = {},
): Trace {
  if (!w || typeof w !== "object") fail("result is not an object");
  const T = w.token_ids?.length ?? fail("token_ids missing");
  if (!Array.isArray(w.tokens) || w.tokens.length !== T) fail("tokens and token_ids differ in length");
  const L = w.layers?.length ?? fail("layers missing");

  for (const l of LABELS) {
    if (!w.labels.includes(l)) fail(`label ${l} missing`);
    const m = w.scores?.[l];
    if (!Array.isArray(m) || m.length !== L) fail(`scores[${l}] must have ${L} layer rows`);
    m.forEach((row, li) => {
      if (!Array.isArray(row) || row.length !== T) fail(`scores[${l}][${li}] must have ${T} tokens`);
    });
    if (w.band_mean?.[l]?.length !== T) fail(`band_mean[${l}] must have ${T} tokens`);
  }

  let tokens: TokenView[];
  if (w.token_info) {
    if (w.token_info.length !== T) fail("token_info length differs from token_ids");
    tokens = w.token_info.map((t, i) => {
      if (t.i !== i || t.id !== w.token_ids[i] || t.text !== w.tokens[i]) fail(`token_info[${i}] is not aligned`);
      return { i, id: t.id, raw: t.raw, text: t.text, span: t.span, bytes: t.bytes, kind: t.kind };
    });
  } else {
    // schema 1.0: spans follow from the server's display pieces, which concatenate
    // to the decoded sequence; raw form / bytes / kind are unknown.
    let pos = 0;
    tokens = w.tokens.map((text, i) => {
      const span: [number, number] = [pos, pos + text.length];
      pos += text.length;
      return { i, id: w.token_ids[i], raw: null, text, span, bytes: null, kind: "unknown" };
    });
  }

  let roundtripOk: boolean | null = w.text_roundtrip_ok ?? null;
  if (roundtripOk === null && extra.inputText !== undefined) {
    const joined = w.tokens.join("");
    roundtripOk = w.truncated ? extra.inputText.startsWith(joined) : joined === extra.inputText;
  }

  const pick = <V,>(rec: Record<string, V>) =>
    Object.fromEntries(LABELS.map((l) => [l, rec[l]])) as Record<Label, V>;

  return {
    source,
    schemaVersion: w.schema_version,
    model: w.model,
    probe: w.probe,
    scoreDefinition: w.score_definition,
    labels: [...LABELS],
    layers: w.layers,
    tokens,
    scores: pick(w.scores),
    band: w.band,
    bandMean: pick(w.band_mean),
    nInputTokens: w.n_input_tokens,
    truncated: w.truncated,
    roundtripOk,
    generation: w.generation,
    timingMs: w.timing_ms,
    preset: extra.preset,
    job: extra.job,
    probeDigest: w.probe_digest ?? null,
    raw: w,
  };
}
