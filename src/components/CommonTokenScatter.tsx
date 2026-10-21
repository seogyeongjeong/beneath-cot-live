import { useEffect, useMemo, useState } from "react";
import { layerLabel, layerShort, loadIndex, loadPair, opOf, type PairData, type ScatterIndex } from "../lib/scatter";

// Only the panels of the paper's figure (fig:common-word-scatter) are offered, in this order.
const PAPER_LAYERS = ["embed", "0", "10", "20", "26", "35"];
const DEFAULT_PAIR = "DECOMPOSITION_vs_DEDUCTION";
const DEFAULT_LAYER = "20"; // "Layer 21", the middle panel of the paper's figure

// Plot geometry (SVG user units).
const W = 520;
const H = 480;
const M = { l: 52, r: 14, t: 14, b: 50 };

function niceTicks(lo: number, hi: number, target = 6): number[] {
  const span = hi - lo || 1;
  const raw = span / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => span / s <= target) ?? 10 * mag;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Math.abs(v) < 1e-9 ? 0 : v);
  return out;
}

function extent(vals: number[]): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of vals) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const pad = (hi - lo || 1) * 0.06;
  return [lo - pad, hi + pad];
}

/** "a" or "an" before an operation name (Extraction, Algebraic manipulation, Arithmetic computation). */
const article = (name: string) => (/^[aeiou]/i.test(name) ? "an" : "a");

const fmt = (v: number) => (Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(Number.isInteger(v) ? 0 : 1)).replace("-", "−");

export function CommonTokenScatter() {
  const [index, setIndex] = useState<ScatterIndex | null>(null);
  const [pairId, setPairId] = useState(DEFAULT_PAIR);
  const [layerIdx, setLayerIdx] = useState<number | null>(null);
  const [data, setData] = useState<PairData | null>(null);
  const [token, setToken] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIndex()
      .then((ix) => {
        setIndex(ix);
        setLayerIdx(Math.max(0, PAPER_LAYERS.filter((k) => ix.layers.includes(k)).indexOf(DEFAULT_LAYER)));
        if (!ix.pairs.some((p) => p.id === DEFAULT_PAIR)) setPairId(ix.pairs[0].id);
      })
      .catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    let live = true;
    setToken(null);
    setHover(null);
    setError(null);
    loadPair(pairId)
      .then((d) => live && setData(d))
      .catch((e) => live && setError(String(e)));
    return () => {
      live = false;
    };
  }, [pairId]);

  const layers = index ? PAPER_LAYERS.filter((k) => index.layers.includes(k)) : [];
  const layerKey = layerIdx !== null ? layers[layerIdx] ?? null : null;
  const pts = data && layerKey ? data.layers[layerKey] : null;
  const opY = data ? opOf(data.y) : null;
  const opX = data ? opOf(data.x) : null;

  const scale = useMemo(() => {
    if (!pts || pts.x.length === 0) return null;
    const [x0, x1] = extent(pts.x);
    const [y0, y1] = extent(pts.y);
    const sx = (v: number) => M.l + ((v - x0) / (x1 - x0)) * (W - M.l - M.r);
    const sy = (v: number) => H - M.b - ((v - y0) / (y1 - y0)) * (H - M.t - M.b);
    return { x0, x1, y0, y1, sx, sy, xt: niceTicks(x0, x1), yt: niceTicks(y0, y1) };
  }, [pts]);

  if (error) {
    return <p className="sv-error">Could not load the scatter data ({error}).</p>;
  }
  if (!index || !data || !pts || !scale || !opX || !opY || layerIdx === null || !layerKey) {
    return <div className="sv-loading" aria-busy="true">Loading precomputed scatter data…</div>;
  }

  const { sx, sy } = scale;
  const n = pts.x.length;
  const order = [...Array(n).keys()].sort((a, b) => pts.c[a] - pts.c[b]); // Y-operation circles first, × on top
  const lastLayer = layers.length - 1;
  const paperPairs = index.pairs.filter((p) => p.group === "paper");
  const otherPairs = index.pairs.filter((p) => p.group === "other");
  const pairLabel = (p: { y: string; x: string }) => `${opOf(p.y).name} vs ${opOf(p.x).name}`;
  const tokensHere = [...new Set(pts.t)].sort((a, b) => data.tokens[a].localeCompare(data.tokens[b]));
  const hv = hover !== null && hover < n ? hover : null;

  return (
    <div className="sv">
      <div className="sv-controls">
        <label className="sv-field">
          <span className="sv-label">Operation pair</span>
          <select value={pairId} onChange={(e) => setPairId(e.target.value)}>
            <optgroup label="Shown in the paper">
              {paperPairs.map((p) => (
                <option key={p.id} value={p.id}>
                  {pairLabel(p)}
                </option>
              ))}
            </optgroup>
            <optgroup label="More operation pairs">
              {otherPairs.map((p) => (
                <option key={p.id} value={p.id}>
                  {pairLabel(p)}
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        <div className="sv-field sv-layer">
          <span className="sv-label" id="sv-layer-label">
            Layer <strong>{layerLabel(layerKey)}</strong>
          </span>
          <div className="sv-layer-row">
            <button
              type="button"
              className="sv-step"
              onClick={() => setLayerIdx(Math.max(0, layerIdx - 1))}
              disabled={layerIdx === 0}
              aria-label="Previous layer"
            >
              ‹
            </button>
            <div className="sv-slider">
              <input
                type="range"
                min={0}
                max={lastLayer}
                step={1}
                value={layerIdx}
                onChange={(e) => setLayerIdx(Number(e.target.value))}
                aria-labelledby="sv-layer-label"
                aria-valuetext={layerLabel(layerKey)}
              />
              <div className="sv-ticks" aria-hidden="true">
                {layers.map((k, i) => (
                  <button
                    type="button"
                    key={k}
                    tabIndex={-1}
                    title={layerLabel(k)}
                    className={i === layerIdx ? "on" : ""}
                    style={{ left: `${(i / lastLayer) * 100}%` }}
                    onClick={() => setLayerIdx(i)}
                  >
                    <span className="sv-tick-mark" />
                    {layerShort(k)}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="sv-step"
              onClick={() => setLayerIdx(Math.min(lastLayer, layerIdx + 1))}
              disabled={layerIdx === lastLayer}
              aria-label="Next layer"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="sv-body">
        <div className="sv-plot">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${pairLabel(data)}, ${layerLabel(layerKey)}: ${n} shared-token occurrences`}>
            <rect x={M.l} y={M.t} width={W - M.l - M.r} height={H - M.t - M.b} className="sv-frame" />
            {scale.x0 < 0 && scale.x1 > 0 && <line className="sv-zero" x1={sx(0)} x2={sx(0)} y1={M.t} y2={H - M.b} />}
            {scale.y0 < 0 && scale.y1 > 0 && <line className="sv-zero" x1={M.l} x2={W - M.r} y1={sy(0)} y2={sy(0)} />}
            {scale.xt.map((v) => (
              <g key={`x${v}`} className="sv-tick">
                <line x1={sx(v)} x2={sx(v)} y1={H - M.b} y2={H - M.b + 4} />
                <text x={sx(v)} y={H - M.b + 17} textAnchor="middle">
                  {fmt(v)}
                </text>
              </g>
            ))}
            {scale.yt.map((v) => (
              <g key={`y${v}`} className="sv-tick">
                <line x1={M.l - 4} x2={M.l} y1={sy(v)} y2={sy(v)} />
                <text x={M.l - 8} y={sy(v) + 4} textAnchor="end">
                  {fmt(v)}
                </text>
              </g>
            ))}
            <text className="sv-axis" x={(M.l + W - M.r) / 2} y={H - 8} textAnchor="middle">
              Alignment with <tspan fill={opX.textColor ?? opX.color}>{opX.name}</tspan> vector
            </text>
            <text
              className="sv-axis"
              transform={`translate(13 ${(M.t + H - M.b) / 2}) rotate(-90)`}
              textAnchor="middle"
            >
              Alignment with <tspan fill={opY.textColor ?? opY.color}>{opY.name}</tspan> vector
            </text>

            <g className={token !== null ? "sv-points filtered" : "sv-points"}>
              {order.map((i) => {
                const cx = sx(pts.x[i]);
                const cy = sy(pts.y[i]);
                const dim = token !== null && pts.t[i] !== token;
                const common = {
                  key: i,
                  className: dim ? "dim" : undefined,
                  onMouseEnter: () => setHover(i),
                  onMouseLeave: () => setHover(null),
                  onClick: () => setHover(i),
                };
                return pts.c[i] === 0 ? (
                  <circle {...common} cx={cx} cy={cy} r={6} fill={opY.color} fillOpacity={0.62} />
                ) : (
                  <path
                    {...common}
                    d={`M${cx - 5} ${cy - 5}L${cx + 5} ${cy + 5}M${cx - 5} ${cy + 5}L${cx + 5} ${cy - 5}`}
                    stroke={opX.color}
                    strokeOpacity={0.8}
                    strokeWidth={1.8}
                  />
                );
              })}
            </g>
            {hv !== null && (
              <circle className="sv-hover-ring" cx={sx(pts.x[hv])} cy={sy(pts.y[hv])} r={9.5} />
            )}
          </svg>
          {hv !== null && (
            <div
              className="sv-tooltip"
              style={{ left: `${(sx(pts.x[hv]) / W) * 100}%`, top: `${(sy(pts.y[hv]) / H) * 100}%` }}
            >
              <span className="sv-tok">“{data.tokens[pts.t[hv]]}”</span> in {article((pts.c[hv] === 0 ? opY : opX).name)}{" "}
              <span style={{ color: (pts.c[hv] === 0 ? opY : opX).textColor ?? (pts.c[hv] === 0 ? opY : opX).color }}>
                {(pts.c[hv] === 0 ? opY : opX).name}
              </span>{" "}
              span
              <span className="sv-coords">
                x {pts.x[hv].toFixed(2)} · y {pts.y[hv].toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <aside className="sv-side">
          <ul className="sv-legend">
            <li>
              <svg width="14" height="14" aria-hidden="true">
                <circle cx="7" cy="7" r="5.5" fill={opY.color} fillOpacity={0.62} />
              </svg>
              token inside {article(opY.name)} <span style={{ color: opY.textColor ?? opY.color }}>{opY.name}</span> span
            </li>
            <li>
              <svg width="14" height="14" aria-hidden="true">
                <path d="M2.5 2.5L11.5 11.5M2.5 11.5L11.5 2.5" stroke={opX.color} strokeWidth="1.8" />
              </svg>
              token inside {article(opX.name)} <span style={{ color: opX.textColor ?? opX.color }}>{opX.name}</span> span
            </li>
          </ul>

          <p className="sv-side-label">Shared tokens</p>
          <div className="sv-tokens" role="group" aria-label="Highlight one shared token">
            <button type="button" className={token === null ? "on" : ""} onClick={() => setToken(null)}>
              all
            </button>
            {tokensHere.map((t) => (
              <button
                type="button"
                key={t}
                className={token === t ? "on" : ""}
                onClick={() => setToken(token === t ? null : t)}
              >
                {data.tokens[t]}
              </button>
            ))}
          </div>

          <p className="sv-note">Hover or tap a point to see its token. Layers are those shown in the paper.</p>
          <p className="sv-note">
            {n} occurrences{token !== null && <> ({pts.t.filter((t) => t === token).length} of “{data.tokens[token]}”)</>}.
            Axes are rescaled for each layer.
          </p>
          {layerKey === "embed" && (
            <p className="sv-note">
              Embedding vectors do not depend on context, so all occurrences of the same token id fall on one point.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
