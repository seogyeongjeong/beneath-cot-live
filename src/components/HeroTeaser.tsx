import { Fragment, useEffect, useMemo, useState } from "react";
import { OPERATIONS } from "../lib/operations";
import { blendWhite, normalise, textOn } from "../lib/windows";
import { splitToken } from "./TokenText";

// The paper's teaser figure (arXiv 2609.04753, Figure 1): Qwen3-8B's trace for the even-perfect-number
// problem (dapo17k q85), Layer 21, shaded for Extraction / Recall / Decomposition, and the held-out spans
// projected on the Decomposition (x) and Recall (y) vectors with three chunks of the trace as stars.
//
// Interactive replica, drawn from the same data as the paper's plot when these two files exist:
//   data/teaser/even-perfect-tokens.json   latent_reasoning_pattern/12_export_web_lda.py --from-start
//   data/teaser/even-perfect-scatter.json  scripts/export_teaser_scatter.py (11_chunk_viz.py data)
// Until then the paper's own figure image is shown.
const BASE = `${import.meta.env.BASE_URL}`;
const TOKENS_URL = `${BASE}data/teaser/even-perfect-tokens.json`;
const SCATTER_URL = `${BASE}data/teaser/even-perfect-scatter.json`;
const PAPER_FIGURE = `${BASE}images/teaser/paper_teaser.png`;

const BANDS = ["[EXTRACTION]", "[RETRIEVAL.RECALL]", "[STRUCTURAL-ANALYSIS.DECOMPOSITION]"];
const X_LABEL = "[STRUCTURAL-ANALYSIS.DECOMPOSITION]";
const Y_LABEL = "[RETRIEVAL.RECALL]";
const SHADE_MAX = 0.8;

interface TokenDoc {
  labels: string[];
  tokens: { i: number; seq_idx: number; display: string }[];
  scores: Record<string, number[]>;
}
interface ScatterDoc {
  labels: string[];
  test: { label: number[]; own: number[]; scores: number[][] };
  chunks: { seq_start: number; seq_end: number; scores: number[] }[];
}

const op = (label: string) => OPERATIONS.find((o) => o.label === label)!;

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url);
    if (!r.ok || !(r.headers.get("content-type") ?? "").includes("json")) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export function HeroTeaser() {
  const [docs, setDocs] = useState<{ tok: TokenDoc; sc: ScatterDoc } | null | undefined>(undefined);
  useEffect(() => {
    Promise.all([getJson<TokenDoc>(TOKENS_URL), getJson<ScatterDoc>(SCATTER_URL)]).then(([tok, sc]) =>
      setDocs(tok && sc ? { tok, sc } : null),
    );
  }, []);

  if (docs === undefined) return <div className="teaser teaser-loading" aria-hidden="true" />;
  if (docs === null) {
    return (
      <figure className="teaser teaser-image">
        <img
          src={PAPER_FIGURE}
          alt="Paper teaser: Qwen3-8B's reasoning trace shaded by Extraction, Recall and Decomposition scores, and held-out spans projected onto the Decomposition and Recall vectors with three chunks of the trace marked as stars."
        />
      </figure>
    );
  }
  return <TeaserReplica tok={docs.tok} sc={docs.sc} />;
}

const W = 560;
const H = 470;
const M = { l: 48, r: 12, t: 12, b: 46 };

function TeaserReplica({ tok, sc }: { tok: TokenDoc; sc: ScatterDoc }) {
  const [hoverChunk, setHoverChunk] = useState<number | null>(null);

  const view = useMemo(() => {
    // The paper shows the model's response from "Okay", without the chat prompt before it.
    const start = Math.max(0, tok.tokens.findIndex((t) => t.display.trim() === "Okay"));
    const toks = tok.tokens.slice(start);
    const shade = Object.fromEntries(BANDS.map((l) => [l, normalise(tok.scores[l]).slice(start)]));
    const xi = sc.labels.indexOf(X_LABEL);
    const yi = sc.labels.indexOf(Y_LABEL);
    const xs = sc.test.scores.map((s) => s[xi]);
    const ys = sc.test.scores.map((s) => s[yi]);
    const pad = (a: number[]): [number, number] => {
      const lo = Math.min(...a);
      const hi = Math.max(...a);
      const p = (hi - lo) * 0.05;
      return [lo - p, hi + p];
    };
    const [x0, x1] = pad([...xs, ...sc.chunks.map((c) => c.scores[xi])]);
    const [y0, y1] = pad([...ys, ...sc.chunks.map((c) => c.scores[yi])]);
    const sx = (v: number) => M.l + ((v - x0) / (x1 - x0)) * (W - M.l - M.r);
    const sy = (v: number) => H - M.b - ((v - y0) / (y1 - y0)) * (H - M.t - M.b);
    const ticks = (lo: number, hi: number) => {
      const out: number[] = [];
      for (let v = Math.ceil(lo / 2) * 2; v <= hi; v += 2) out.push(v);
      return out;
    };
    // Each chunk: a short quote (first and last words, as in the paper) and its star colour (the highest of
    // the three shown operations, as in 11_chunk_viz._plot_pair).
    const chunks = sc.chunks.map((c) => {
      const words = tok.tokens
        .filter((t) => t.seq_idx >= c.seq_start && t.seq_idx < c.seq_end)
        .map((t) => t.display)
        .join("")
        .trim()
        .split(/\s+/);
      const quote = words.length > 9 ? `${words.slice(0, 4).join(" ")} … ${words.slice(-4).join(" ")}` : words.join(" ");
      const best = BANDS.reduce((a, b) => (c.scores[sc.labels.indexOf(b)] > c.scores[sc.labels.indexOf(a)] ? b : a));
      return { ...c, quote, best };
    });
    return { toks, shade, xi, yi, sx, sy, x0, x1, y0, y1, xt: ticks(x0, x1), yt: ticks(y0, y1), chunks };
  }, [tok, sc]);

  const { toks, shade, xi, yi, sx, sy, x0, x1, y0, y1, xt, yt, chunks } = view;
  const chunkOf = (seq: number) => chunks.findIndex((c) => seq >= c.seq_start && seq < c.seq_end);
  const star = (cx: number, cy: number, r: number) =>
    Array.from({ length: 10 }, (_, k) => {
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      const rr = k % 2 === 0 ? r : r * 0.45;
      return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
    }).join(" ");
  const order = sc.test.label.map((_, i) => i).sort((a, b) => sc.test.label[a] - sc.test.label[b]);
  const fmt = (v: number) => v.toFixed(2).replace("-", "−");

  return (
    <figure className="teaser teaser-replica">
      <div className="teaser-text" onPointerLeave={() => setHoverChunk(null)}>
        {BANDS.map((label) => (
          <div className="teaser-band" key={label}>
            <span className="teaser-label" style={{ color: op(label).color }}>
              {op(label).name}
            </span>
            <p>
              {toks.map((t, k) => {
                const { lead, core, trail } = splitToken(t.display);
                const v = shade[label][k];
                const bg = v >= 0.02 ? blendWhite(op(label).color, v * SHADE_MAX) : undefined;
                const ci = chunkOf(t.seq_idx);
                return (
                  <Fragment key={k}>
                    {lead && <> </>}
                    {core && (
                      <span
                        className={ci >= 0 && ci === hoverChunk ? "teaser-tok in-chunk" : "teaser-tok"}
                        style={{ background: bg, color: bg ? textOn(op(label).color, v * SHADE_MAX) : undefined }}
                        onPointerEnter={() => setHoverChunk(ci >= 0 ? ci : null)}
                      >
                        {core}
                      </span>
                    )}
                    {trail && <> </>}
                  </Fragment>
                );
              })}
            </p>
          </div>
        ))}
      </div>

      <div className="teaser-plot">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Held-out spans projected on the Decomposition and Recall vectors, with three chunks of the trace as stars">
          <rect x={M.l} y={M.t} width={W - M.l - M.r} height={H - M.t - M.b} className="sv-frame" />
          {x0 < 0 && x1 > 0 && <line className="sv-zero" x1={sx(0)} x2={sx(0)} y1={M.t} y2={H - M.b} />}
          {y0 < 0 && y1 > 0 && <line className="sv-zero" x1={M.l} x2={W - M.r} y1={sy(0)} y2={sy(0)} />}
          {xt.map((v) => (
            <g key={`x${v}`} className="sv-tick">
              <line x1={sx(v)} x2={sx(v)} y1={H - M.b} y2={H - M.b + 4} />
              <text x={sx(v)} y={H - M.b + 18} textAnchor="middle">{String(v).replace("-", "−")}</text>
            </g>
          ))}
          {yt.map((v) => (
            <g key={`y${v}`} className="sv-tick">
              <line x1={M.l - 4} x2={M.l} y1={sy(v)} y2={sy(v)} />
              <text x={M.l - 8} y={sy(v) + 4} textAnchor="end">{String(v).replace("-", "−")}</text>
            </g>
          ))}
          {/* 11_chunk_viz._plot_pair: alpha 0.20 + 0.70·own, size 10 + 55·own (matplotlib points²; drawn as radius). */}
          {order.map((i) => {
            const own = sc.test.own[i];
            return (
              <circle
                key={i}
                cx={sx(sc.test.scores[i][xi])}
                cy={sy(sc.test.scores[i][yi])}
                r={Math.sqrt(10 + 55 * own) * 0.62}
                fill={OPERATIONS[sc.test.label[i]].color}
                fillOpacity={Math.min(0.95, Math.max(0.05, 0.2 + 0.7 * own))}
              />
            );
          })}
          {chunks.map((c, k) => (
            <polygon
              key={k}
              points={star(sx(c.scores[xi]), sy(c.scores[yi]), hoverChunk === k ? 16 : 13)}
              fill={op(c.best).color}
              stroke="#111"
              strokeWidth={1.4}
              onPointerEnter={() => setHoverChunk(k)}
              onPointerLeave={() => setHoverChunk(null)}
              style={{ cursor: "pointer" }}
            />
          ))}
          <text className="teaser-axis" x={(M.l + W - M.r) / 2} y={H - 8} textAnchor="middle">
            <tspan fill={op(X_LABEL).color}>Decomposition</tspan> score
          </text>
          <text className="teaser-axis" transform={`translate(15 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle">
            <tspan fill={op(Y_LABEL).color}>Recall</tspan> score
          </text>
        </svg>
        <ul className="teaser-chunks">
          {chunks.map((c, k) => (
            <li
              key={k}
              className={hoverChunk === k ? "on" : ""}
              style={{ borderColor: op(c.best).color }}
              onPointerEnter={() => setHoverChunk(k)}
              onPointerLeave={() => setHoverChunk(null)}
            >
              <p className="teaser-quote" style={{ color: op(c.best).color }}>
                ★ {c.quote}
              </p>
              <p className="teaser-scores">
                {BANDS.map((l) => (
                  <span key={l}>
                    <span style={{ color: op(l).color }}>{op(l).name}</span> {fmt(c.scores[sc.labels.indexOf(l)])}
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}
