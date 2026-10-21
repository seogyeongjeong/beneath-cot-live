// Curated reasoning windows exported by scripts/export_reasoning_windows.py from
// latent_reasoning_pattern/reasoning_windows (build_and_score.py).

export interface WindowMeta {
  id: string;
  group: string;
  groupName: string;
  rank: number;
  domain: string;
  queryIdx: number;
  tryIdx: number;
  question: string;
  nTokens: number;
  labelSequence: string[];
}

export interface WindowIndex {
  model: string;
  labels: string[]; // the 8 operations, in score order
  layers: number[]; // 0-based decoder layers
  defaultLayer: number;
  examples: WindowMeta[];
}

export interface WindowSpan {
  label: string; // may be outside the 8 operations, e.g. "[PATTERN-MATCHING]"
  start: number; // window-token index, inclusive
  end: number;
  text: string;
}

export interface WindowData extends Omit<WindowMeta, "nTokens" | "labelSequence"> {
  labels: string[];
  tokens: string[];
  /** Index into spans for each token, -1 outside annotated spans. */
  spanOf: number[];
  spans: WindowSpan[];
  /** scores[layer][token][operation]: operation-alignment score at that decoder layer. */
  scores: Record<string, number[][]>;
}

const BASE = `${import.meta.env.BASE_URL}data/reasoning-windows/Qwen3-8B/`;

let indexPromise: Promise<WindowIndex> | null = null;
export function loadWindowIndex(): Promise<WindowIndex> {
  if (!indexPromise) {
    indexPromise = fetch(`${BASE}index.json`).then((r) => {
      if (!r.ok) throw new Error(`index.json: HTTP ${r.status}`);
      return r.json();
    });
    indexPromise.catch(() => (indexPromise = null));
  }
  return indexPromise;
}

const cache = new Map<string, Promise<WindowData>>();
export function loadWindow(id: string): Promise<WindowData> {
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

/**
 * Default axes: the two operations covering the most annotated tokens in the window
 * (first → Y, second → X). Falls back to the label order if fewer than two are present.
 */
export function defaultAxes(d: WindowData): [number, number] {
  const count = new Map<number, number>();
  d.spanOf.forEach((k) => {
    if (k < 0) return;
    const li = d.labels.indexOf(d.spans[k].label);
    if (li >= 0) count.set(li, (count.get(li) ?? 0) + 1);
  });
  const ranked = [...count.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).map(([li]) => li);
  for (let li = 0; ranked.length < 2 && li < d.labels.length; li++) if (!ranked.includes(li)) ranked.push(li);
  return [ranked[0], ranked[1]];
}

/** 10_main_figure._norm_scores: negative scores → 0, then divide by the window maximum. */
export function normalise(values: number[]): number[] {
  let m = 0;
  for (const v of values) if (v > m) m = v;
  return values.map((v) => (m < 1e-8 || v <= 0 ? 0 : v / m));
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((k) => parseInt(h.slice(k, k + 2), 16)) as [number, number, number];
}

/** White at t = 0, full operation colour at t = 1 (10_main_figure._blend_white). */
export function blendWhite(hex: string, t: number): string {
  const [r, g, b] = hexToRgb(hex).map((c) => Math.round(255 + (c - 255) * t));
  return `rgb(${r}, ${g}, ${b})`;
}

/** Dark or white text, whichever contrasts more with the blended background. */
export function textOn(hex: string, t: number): string {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = hexToRgb(hex).map((c) => 255 + (c - 255) * t);
  const Y = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return 1.05 / (Y + 0.05) > (Y + 0.05) / 0.05 ? "#ffffff" : "#202938";
}
