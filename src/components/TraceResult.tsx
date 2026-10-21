import { Fragment, useMemo, useState } from "react";
import { OPERATIONS } from "../lib/operations";
import type { Trace } from "../lib/trace-types";
import { blendWhite, normalise, textOn } from "../lib/windows";
import { splitToken, Whitespace } from "./TokenText";

// Same colour treatment as the representative examples: per operation, scores ≤ 0 are white and the
// rest are scaled by the operation's largest score in this text, drawn with up to 72% of its colour.
const SHADE_MAX = 0.72;
const MIN_SHADE = 0.02;
const DEFAULT_LAYER = 20; // the layer of the paper's token figures (10_main_figure.py), "Layer 21"
const DEFAULT_BANDS = 3;

const fmt = (v: number) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(2);

/** Token-level result of one hosted analysis: one heatmap band per chosen operation, plus a token readout. */
export function TraceResult({ trace }: { trace: Trace }) {
  const L = trace.layers.length;
  const [layerIdx, setLayerIdx] = useState(() => Math.max(0, trace.layers.indexOf(DEFAULT_LAYER)));
  // scores[op][token] at the chosen layer (operation order as in OPERATIONS / LABELS).
  const S = useMemo(() => trace.labels.map((l) => trace.scores[l][layerIdx]), [trace, layerIdx]);
  const [ops, setOps] = useState<number[]>(() => {
    // Start with the operations with the largest mean positive score at the default layer.
    const li = Math.max(0, trace.layers.indexOf(DEFAULT_LAYER));
    const mean = trace.labels.map((l, k) => {
      const row = trace.scores[l][li];
      return [k, row.reduce((a, v) => a + Math.max(v, 0), 0) / row.length] as const;
    });
    return mean.sort((a, b) => b[1] - a[1]).slice(0, DEFAULT_BANDS).map(([k]) => k).sort((a, b) => a - b);
  });
  const [selected, setSelected] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const shade = useMemo(() => S.map((row) => normalise(row)), [S]);
  const focus = hover ?? selected;

  const toggle = (k: number) =>
    setOps((cur) => (cur.includes(k) ? (cur.length > 1 ? cur.filter((x) => x !== k) : cur) : [...cur, k].sort((a, b) => a - b)));

  const band = (k: number) =>
    trace.tokens.map((tok) => {
      const { lead, core, trail } = splitToken(tok.text);
      const t = shade[k][tok.i];
      const bg = t >= MIN_SHADE ? blendWhite(OPERATIONS[k].color, t * SHADE_MAX) : undefined;
      const cls = ["rw-tok"];
      if (selected === tok.i) cls.push("pick");
      if (hover === tok.i) cls.push("hov");
      return (
        <Fragment key={tok.i}>
          <Whitespace ws={lead} />
          {(core || !tok.text) && (
            <span
              className={cls.join(" ")}
              style={{ background: bg, color: bg ? textOn(OPERATIONS[k].color, t * SHADE_MAX) : undefined }}
              title={tok.text ? undefined : "part of a multi-byte character"}
              onPointerEnter={() => setHover(tok.i)}
              onClick={() => setSelected(selected === tok.i ? null : tok.i)}
            >
              {core || "◌"}
            </span>
          )}
          <Whitespace ws={trail} />
        </Fragment>
      );
    });

  return (
    <div className="tr">
      <div className="tr-controls">
        <div className="rw-control">
          <span className="sv-label">Operations shown</span>
          <div className="tr-ops" role="group" aria-label="Operations shown">
            {OPERATIONS.map((op, k) => (
              <button
                key={op.label}
                type="button"
                aria-pressed={ops.includes(k)}
                className={ops.includes(k) ? "on" : ""}
                onClick={() => toggle(k)}
              >
                <span className="tr-dot" style={{ background: op.color }} />
                {op.name}
              </button>
            ))}
          </div>
        </div>
        <label className="rw-control tr-layer">
          <span className="sv-label">
            Layer <strong>{trace.layers[layerIdx] + 1}</strong> <span className="rw-muted">of {L}</span>
          </span>
          <input type="range" min={0} max={L - 1} value={layerIdx} onChange={(e) => setLayerIdx(Number(e.target.value))} />
        </label>
      </div>

      <div className="tr-body">
        <div className="rw-bands" onPointerLeave={() => setHover(null)}>
          {ops.map((k) => (
            <div className="rw-band" key={k}>
              <span className="rw-band-label" style={{ color: OPERATIONS[k].textColor ?? OPERATIONS[k].color }}>
                {OPERATIONS[k].name}
              </span>
              <div className="rw-band-text">{band(k)}</div>
            </div>
          ))}
        </div>

        <aside className="tr-detail" aria-live="polite">
          {focus === null ? (
            <p className="rw-muted">Hover or click a token to see its score for every operation at this layer.</p>
          ) : (
            <>
              <p className="tr-detail-tok">
                <span className="sv-tok">{JSON.stringify(trace.tokens[focus].text)}</span>{" "}
                <span className="rw-muted">token {focus + 1} of {trace.tokens.length}</span>
              </p>
              <table className="tr-scores">
                <tbody>
                  {OPERATIONS.map((op, k) => {
                    const v = S[k][focus];
                    const m = Math.max(...S.map((row) => Math.abs(row[focus]))) || 1;
                    return (
                      <tr key={op.label}>
                        <th scope="row" style={{ color: op.textColor ?? op.color }}>{op.name}</th>
                        <td className="tr-num">{fmt(v)}</td>
                        <td className="tr-bar">
                          <span className="tr-axis" />
                          <span
                            className="tr-fill"
                            style={{
                              background: op.color,
                              left: v >= 0 ? "50%" : `${50 - (Math.abs(v) / m) * 50}%`,
                              width: `${(Math.abs(v) / m) * 50}%`,
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="tr-note">Alignment scores along each operation vector; not probabilities.</p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
