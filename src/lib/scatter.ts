// Shared-token scatter data exported by scripts/export_common_token_scatter.py from
// latent_reasoning_pattern/08_token_label_separability.py (viz_data_sep.json).

import { OPERATIONS } from "./operations";

export interface PairMeta {
  id: string;
  y: string;
  x: string;
  group: "paper" | "other";
  paperRow: number | null;
  counts: Record<string, number>;
}

export interface ScatterIndex {
  model: string;
  layers: string[]; // "embed", "0", ..., "35"
  pairs: PairMeta[];
}

export interface LayerPoints {
  x: number[];
  y: number[];
  /** 0: occurrence inside a span of the Y operation, 1: of the X operation. */
  c: number[];
  /** Index into PairData.tokens. */
  t: number[];
}

export interface PairData {
  id: string;
  y: string;
  x: string;
  tokens: string[];
  layers: Record<string, LayerPoints>;
}

const BASE = `${import.meta.env.BASE_URL}data/common-token-scatter/Qwen3-8B/`;

export async function loadIndex(): Promise<ScatterIndex> {
  const r = await fetch(`${BASE}index.json`);
  if (!r.ok) throw new Error(`index.json: HTTP ${r.status}`);
  return r.json();
}

const cache = new Map<string, Promise<PairData>>();
export function loadPair(id: string): Promise<PairData> {
  let p = cache.get(id);
  if (!p) {
    p = fetch(`${BASE}${encodeURIComponent(id)}.json`).then((r) => {
      if (!r.ok) throw new Error(`${id}.json: HTTP ${r.status}`);
      return r.json();
    });
    p.catch(() => cache.delete(id));
    cache.set(id, p);
  }
  return p;
}

/** Layer key → label used in the paper's figure: "Emb. layer", then 1-based "Layer 1" … "Layer 36". */
export function layerLabel(key: string): string {
  return key === "embed" ? "Embedding layer" : `Layer ${Number(key) + 1}`;
}

export function layerShort(key: string): string {
  return key === "embed" ? "Emb." : String(Number(key) + 1);
}

export function opOf(label: string) {
  const op = OPERATIONS.find((o) => o.label === label);
  if (!op) throw new Error(`unknown operation ${label}`);
  return op;
}
