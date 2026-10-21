// Data contract. Wire types mirror beneath-cot-backend/api/analyze.schema.json
// (schema 1.0 and 1.1); `Trace` is what every view renders, built by adapt.ts.

export const LABELS = [
  "[EXTRACTION]",
  "[SYMBOLIZATION.DIRECT-MAPPING]",
  "[STRUCTURAL-ANALYSIS.DECOMPOSITION]",
  "[RETRIEVAL.RECALL]",
  "[INFERENCE-FLOW.CHAINING.DEDUCTION]",
  "[EXECUTION.OPERATION.ALGEBRAIC-MANIPULATION]",
  "[EXECUTION.OPERATION.ARITHMETIC-COMPUTATION]",
  "[FINAL-ANSWER]",
] as const;
export type Label = (typeof LABELS)[number];

export type TokenKind = "normal" | "added" | "special";

export interface WireTokenInfo {
  i: number;
  id: number;
  raw: string;
  text: string;
  span: [number, number];
  bytes: string;
  kind: TokenKind;
}

export interface WireGeneration {
  question: string;
  prompt: string;
  n_prompt_tokens: number;
  generated_text: string;
  max_new_tokens: number;
  stop_reason: "eos" | "max_new_tokens";
  temperature: number;
  top_p: number;
  seed: number | null;
  chat_template: boolean;
  enable_thinking: boolean;
  train_style_prompt: boolean;
  scoring_context: string;
}

export interface WireResult {
  schema_version: string;
  mode?: "analyze" | "generate";
  model: { id: string; revision: string | null; source: string };
  probe_digest?: string | null;
  probe: string;
  score_definition: string;
  tokens: string[];
  token_ids: number[];
  n_input_tokens: number;
  truncated: boolean;
  token_info?: WireTokenInfo[];
  text_roundtrip_ok?: boolean;
  layers: number[];
  labels: string[];
  scores: Record<string, number[][]>;
  band: [number, number];
  band_mean: Record<string, number[]>;
  cosine?: Record<string, number[][]>;
  generation?: WireGeneration;
  timing_ms: { forward: number; total: number };
}

export interface PresetMeta {
  id: string;
  title: string;
  description: string;
  source_note: string;
  created_utc: string;
  scored_by: string;
  worker_schema_version: string;
  token_info_added_locally: boolean;
}

export interface PresetDoc {
  preset: PresetMeta;
  result: WireResult;
}

export interface TokenView {
  i: number;
  id: number;
  /** tokenizer.convert_ids_to_tokens; null when the server did not send it (schema 1.0) */
  raw: string | null;
  /** display piece from the server's incremental decode; "" = only part of a character */
  text: string;
  /** [start, end) in the joined text */
  span: [number, number];
  bytes: string | null;
  kind: TokenKind | "unknown";
}

export type TraceSource = "preset" | "analyze" | "generate";

export interface Trace {
  source: TraceSource;
  schemaVersion: string;
  model: WireResult["model"];
  probe: string;
  scoreDefinition: string;
  labels: Label[];
  layers: number[];
  tokens: TokenView[];
  /** scores[label][layerIndex][tokenIndex] — raw affine probe score, unchanged from the API */
  scores: Record<Label, number[][]>;
  band: [number, number];
  bandMean: Record<Label, number[]>;
  nInputTokens: number;
  truncated: boolean;
  /** true/false when verifiable, null when unknown */
  roundtripOk: boolean | null;
  generation?: WireGeneration;
  preset?: PresetMeta;
  timingMs?: { forward: number; total: number };
  job?: { id: string; queueMs: number | null; executionMs: number | null; deduplicated: boolean };
  probeDigest: string | null;
  /** the server's result exactly as received, for download / offline verification */
  raw: WireResult;
}
