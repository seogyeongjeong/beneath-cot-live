import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { OPERATIONS } from "../lib/operations";
import {
  blendWhite,
  defaultAxes,
  loadWindow,
  loadWindowIndex,
  normalise,
  textOn,
  type WindowData,
  type WindowIndex,
} from "../lib/windows";
import { MathText } from "./MathText";
import { splitToken, Whitespace } from "./TokenText";

const OTHER_COLOR = "#9aa3ad"; // annotated with an operation outside the eight
const NONE_COLOR = "#c3cad3"; // outside annotated spans
const MIN_SHADE = 0.02;
// Colour ramp: normalised score t in [0, 1] (unchanged) maps to a blend of up to SHADE_MAX of the
// operation colour, so the strongest tokens read as a deep tint rather than a solid block.
const SHADE_MAX = 0.72;
const QUESTION_PREVIEW = 180; // characters; longer questions start collapsed to two lines

// Scatter geometry (SVG user units).
const W = 520;
const H = 480;
const M = { l: 50, r: 12, t: 12, b: 48 };

const opByLabel = (label: string) => OPERATIONS.find((o) => o.label === label);
const shortName = (label: string) => opByLabel(label)?.name ?? label.replace(/^\[|\]$/g, "").split(".").pop()!.toLowerCase().replace(/-/g, " ");
const layerName = (l: number) => `Layer ${l + 1}`;
const datasetName = (d: string) => (d === "dapo17k" ? "DAPO-Math-17K" : d);
/** "A → A → B" → "A → B": repeated adjacent spans of one operation read as one step. */
const collapseRepeats = (xs: string[]) => xs.filter((x, i) => i === 0 || x !== xs[i - 1]);
const fmt = (v: number) => v.toFixed(2).replace("-", "−");

function niceTicks(lo: number, hi: number, target = 5): number[] {
  const span = hi - lo || 1;
  const mag = 10 ** Math.floor(Math.log10(span / target));
  const step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => span / s <= target) ?? 10 * mag;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Math.abs(v) < 1e-9 ? 0 : v);
  return out;
}

/** Interactive viewer for the curated windows of one reasoning pattern (group). */
export function ReasoningWindowViewer({ group }: { group: string }) {
  const [index, setIndex] = useState<WindowIndex | null>(null);
  const [exampleId, setExampleId] = useState<string | null>(null);
  const [data, setData] = useState<WindowData | null>(null);
  const [layer, setLayer] = useState<number | null>(null);
  const [axes, setAxes] = useState<[number, number] | null>(null); // [Y, X] operation indices
  const [range, setRange] = useState<[number, number] | null>(null); // selected window-token range
  const [hover, setHover] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawQuestion, setRawQuestion] = useState(false);
  const [questionOpen, setQuestionOpen] = useState(false);
  const drag = useRef<number | null>(null);
  const tokenRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    loadWindowIndex()
      .then((ix) => {
        setIndex(ix);
        setLayer(ix.defaultLayer);
        const first = ix.examples.find((e) => e.group === group);
        if (!first) throw new Error(`no examples for ${group}`);
        setExampleId(first.id);
      })
      .catch((e) => setError(String(e)));
  }, [group]);

  useEffect(() => {
    if (!exampleId) return;
    let live = true;
    setRange(null);
    setHover(null);
    setError(null);
    setQuestionOpen(false);
    loadWindow(exampleId)
      .then((d) => {
        if (!live) return;
        setData(d);
        const ax = defaultAxes(d);
        setAxes(ax);
      })
      .catch((e) => live && setError(String(e)));
    return () => {
      live = false;
    };
  }, [exampleId]);

  useEffect(() => {
    const up = () => (drag.current = null);
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  const S = data && layer !== null ? data.scores[String(layer)] : null;

  // One heatmap band per operation annotated in this window (the paper's teaser layout),
  // in order of first appearance; spans with labels outside the eight get no band.
  const bandOps = useMemo(() => {
    if (!data) return [];
    const seen: number[] = [];
    for (const sp of data.spans) {
      const li = data.labels.indexOf(sp.label);
      if (li >= 0 && !seen.includes(li)) seen.push(li);
    }
    return seen;
  }, [data]);

  // Shading per band: 10_main_figure normalisation (negatives → 0, divide by the window maximum).
  const shading = useMemo(() => {
    if (!S) return null;
    return new Map(bandOps.map((li) => [li, normalise(S.map((tok) => tok[li]))]));
  }, [S, bandOps]);

  const selectionMean = useMemo(() => {
    if (!S || !axes || !range || range[0] === range[1]) return null;
    let x = 0;
    let y = 0;
    for (let i = range[0]; i <= range[1]; i++) {
      x += S[i][axes[1]];
      y += S[i][axes[0]];
    }
    const n = range[1] - range[0] + 1;
    return { x: x / n, y: y / n, n };
  }, [S, axes, range]);

  const scale = useMemo(() => {
    if (!S || !axes) return null;
    const xs = S.map((t) => t[axes[1]]);
    const ys = S.map((t) => t[axes[0]]);
    const pad = (lo: number, hi: number): [number, number] => {
      const p = (hi - lo || 1) * 0.06;
      return [lo - p, hi + p];
    };
    const [x0, x1] = pad(Math.min(...xs), Math.max(...xs));
    const [y0, y1] = pad(Math.min(...ys), Math.max(...ys));
    return {
      x0, x1, y0, y1,
      sx: (v: number) => M.l + ((v - x0) / (x1 - x0)) * (W - M.l - M.r),
      sy: (v: number) => H - M.b - ((v - y0) / (y1 - y0)) * (H - M.t - M.b),
      xt: niceTicks(x0, x1),
      yt: niceTicks(y0, y1),
    };
  }, [S, axes]);

  if (error) return <p className="sv-error">Could not load the reasoning windows ({error}).</p>;
  if (!index || !data || !S || !axes || layer === null || !shading || !scale) {
    return <div className="sv-loading" aria-busy="true">Loading reasoning windows…</div>;
  }

  const { tokens, spanOf, spans } = data;
  // Axis choices: the operations annotated in this window (all eight if fewer than two are).
  const axisOps = bandOps.length >= 2 ? bandOps : OPERATIONS.map((_, li) => li);
  const inGroup = index.examples.filter((e) => e.group === group);
  const [yOp, xOp] = axes;
  const opText = (li: number) => OPERATIONS[li].textColor ?? OPERATIONS[li].color;
  const tokenColor = (i: number) => {
    const k = spanOf[i];
    if (k < 0) return NONE_COLOR;
    return opByLabel(spans[k].label)?.color ?? OTHER_COLOR;
  };
  const single = range && range[0] === range[1] ? range[0] : null;
  const inRange = (i: number) => range !== null && i >= range[0] && i <= range[1];
  const focus = hover ?? single;


  const setAxis = (which: 0 | 1, li: number) => {
    const next: [number, number] = [...axes];
    if (next[1 - which] === li) next[1 - which] = next[which]; // picking the other axis' operation swaps them
    next[which] = li;
    setAxes(next);
  };
  const selectToken = (i: number, scroll: boolean) => {
    setRange([i, i]);
    if (scroll) tokenRefs.current[i]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };
  /** One token: leading whitespace, the shaded box, trailing whitespace (edges can be left out). */
  const renderTok = (i: number, li: number, primary: boolean, edges: { lead?: boolean; trail?: boolean } = {}) => {
    const { lead, core, trail } = splitToken(tokens[i]);
    const t = shading.get(li)![i];
    const bg = t >= MIN_SHADE ? blendWhite(OPERATIONS[li].color, t * SHADE_MAX) : undefined;
    const cls = ["rw-tok"];
    if (hover === i) cls.push("hov");
    return (
      <Fragment key={i}>
        {edges.lead !== false && <Whitespace ws={lead} />}
        {core && (
          <span
            ref={primary ? (el) => void (tokenRefs.current[i] = el) : undefined}
            className={cls.join(" ")}
            style={{ background: bg, color: bg ? textOn(OPERATIONS[li].color, t * SHADE_MAX) : undefined }}
            onPointerDown={(e) => {
              e.preventDefault();
              drag.current = i;
              setRange([i, i]);
            }}
            onPointerEnter={() => {
              setHover(i);
              if (drag.current !== null) setRange([Math.min(drag.current, i), Math.max(drag.current, i)]);
            }}
          >
            {core}
          </span>
        )}
        {edges.trail !== false && <Whitespace ws={trail} />}
      </Fragment>
    );
  };

  /** A band of the whole window shaded by one operation; a selection is outlined as one run. */
  const renderBand = (li: number, primary: boolean) => {
    const out: ReactNode[] = [];
    for (let i = 0; i < tokens.length; i++) {
      if (range && i === range[0]) {
        const [a, b] = range;
        out.push(<Whitespace key="lead" ws={splitToken(tokens[a]).lead} />);
        out.push(
          <span className="rw-range" key="range">
            {Array.from({ length: b - a + 1 }, (_, k) =>
              renderTok(a + k, li, primary, { lead: k > 0, trail: a + k < b }),
            )}
          </span>,
        );
        out.push(<Whitespace key="trail" ws={splitToken(tokens[b]).trail} />);
        i = b;
      } else {
        out.push(renderTok(i, li, primary));
      }
    }
    return out;
  };

  const { sx, sy } = scale;
  const star = (cx: number, cy: number, r: number) => {
    const pts = Array.from({ length: 10 }, (_, k) => {
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      const rr = k % 2 === 0 ? r : r * 0.45;
      return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
    });
    return pts.join(" ");
  };
  // Draw points outside spans first, then annotated ones, so coloured points stay on top.
  const order = tokens.map((_, i) => i).sort((a, b) => Number(spanOf[a] >= 0) - Number(spanOf[b] >= 0));

  return (
    <div className="rw">
      <div className="rw-controls">
        <label className="rw-control">
          <span className="sv-label">Example</span>
          <select value={exampleId ?? ""} onChange={(e) => setExampleId(e.target.value)}>
            {inGroup.map((e) => (
              <option key={e.id} value={e.id}>
                {datasetName(e.domain)} #{e.queryIdx}
              </option>
            ))}
          </select>
        </label>
        <div className="rw-control">
          <span className="sv-label" id={`rw-layer-${group}`}>Layer</span>
          <div className="rw-layers" role="radiogroup" aria-labelledby={`rw-layer-${group}`}>
            {index.layers.map((l) => (
              <button key={l} type="button" role="radio" aria-checked={l === layer} className={l === layer ? "on" : ""} onClick={() => setLayer(l)}>
                {l + 1}
              </button>
            ))}
          </div>
        </div>
        <p className="rw-annotated">
          Annotated: {collapseRepeats(spans.map((sp) => shortName(sp.label))).join(" → ")}
        </p>
      </div>

      <div className={questionOpen ? "rw-question open" : "rw-question"}>
        <p className="rw-q-text">
          <span className="rw-q-label">Question</span>{" "}
          {rawQuestion ? <span className="rw-q-raw">{data.question}</span> : <MathText source={data.question} />}
        </p>
        <div className="rw-q-actions">
          {data.question.length > QUESTION_PREVIEW && (
            <button type="button" onClick={() => setQuestionOpen(!questionOpen)} aria-expanded={questionOpen}>
              {questionOpen ? "Show less" : "Show full question"}
            </button>
          )}
          <button type="button" onClick={() => setRawQuestion(!rawQuestion)}>
            {rawQuestion ? "Rendered" : "Source text"}
          </button>
        </div>
      </div>

      <div className="rw-body">
        <div className="rw-text-col">
          <div className="rw-col-head">
            <span className="rw-legend">
              <span className="rw-legend-bar" aria-hidden="true" />
              Score: white ≤ 0, deepest at the window's maximum
            </span>
          </div>
          <div className="rw-bands" onPointerLeave={() => setHover(null)}>
            {bandOps.map((li, bi) => (
              <div className="rw-band" key={li}>
                <span className="rw-band-label" style={{ color: opText(li) }}>
                  {OPERATIONS[li].name}
                </span>
                <div className="rw-band-text">{renderBand(li, bi === 0)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rw-plot-col">
          <div className="rw-col-head rw-axes">
            <label className="sv-field rw-inline">
              <span className="sv-label">Y axis</span>
              <select value={yOp} onChange={(e) => setAxis(0, Number(e.target.value))}>
                {axisOps.map((li) => (
                  <option key={li} value={li}>
                    {OPERATIONS[li].name}
                  </option>
                ))}
              </select>
            </label>
            <label className="sv-field rw-inline">
              <span className="sv-label">X axis</span>
              <select value={xOp} onChange={(e) => setAxis(1, Number(e.target.value))}>
                {axisOps.map((li) => (
                  <option key={li} value={li}>
                    {OPERATIONS[li].name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="sv-plot">
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Token scores on ${OPERATIONS[yOp].name} and ${OPERATIONS[xOp].name}, ${layerName(layer)}`}>
              <rect x={M.l} y={M.t} width={W - M.l - M.r} height={H - M.t - M.b} className="sv-frame" />
              {scale.x0 < 0 && scale.x1 > 0 && <line className="sv-zero" x1={sx(0)} x2={sx(0)} y1={M.t} y2={H - M.b} />}
              {scale.y0 < 0 && scale.y1 > 0 && <line className="sv-zero" x1={M.l} x2={W - M.r} y1={sy(0)} y2={sy(0)} />}
              {scale.xt.map((v) => (
                <g key={`x${v}`} className="sv-tick">
                  <line x1={sx(v)} x2={sx(v)} y1={H - M.b} y2={H - M.b + 4} />
                  <text x={sx(v)} y={H - M.b + 17} textAnchor="middle">{fmt(v).replace(/\.00$/, "")}</text>
                </g>
              ))}
              {scale.yt.map((v) => (
                <g key={`y${v}`} className="sv-tick">
                  <line x1={M.l - 4} x2={M.l} y1={sy(v)} y2={sy(v)} />
                  <text x={M.l - 8} y={sy(v) + 4} textAnchor="end">{fmt(v).replace(/\.00$/, "")}</text>
                </g>
              ))}
              <text className="sv-axis" x={(M.l + W - M.r) / 2} y={H - 8} textAnchor="middle">
                <tspan fill={opText(xOp)}>{OPERATIONS[xOp].name}</tspan> score
              </text>
              <text className="sv-axis" transform={`translate(13 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle">
                <tspan fill={opText(yOp)}>{OPERATIONS[yOp].name}</tspan> score
              </text>

              <g className={range ? "rw-points has-sel" : "rw-points"}>
                {order.map((i) => {
                  const ann = spanOf[i] >= 0;
                  return (
                    <circle
                      key={i}
                      cx={sx(S[i][xOp])}
                      cy={sy(S[i][yOp])}
                      r={ann ? 4.6 : 3.4}
                      fill={tokenColor(i)}
                      fillOpacity={ann ? 0.75 : 0.6}
                      className={inRange(i) ? "in" : undefined}
                      onPointerEnter={() => setHover(i)}
                      onPointerLeave={() => setHover(null)}
                      onClick={() => selectToken(i, true)}
                    />
                  );
                })}
              </g>
              {selectionMean && (
                <polygon className="rw-sel-star" points={star(sx(selectionMean.x), sy(selectionMean.y), 11)} />
              )}
              {focus !== null && <circle className="sv-hover-ring" cx={sx(S[focus][xOp])} cy={sy(S[focus][yOp])} r={8} />}
            </svg>
          </div>
        </div>
      </div>

      <div className="rw-readout" aria-live="polite">
        {focus !== null ? (
          <p>
            {tokens[focus].trim() ? <span className="sv-tok">“{tokens[focus].trim()}”</span> : <span className="rw-muted">line break</span>}{" "}
            {spanOf[focus] >= 0 ? <>in a {shortName(spans[spanOf[focus]].label)} span</> : <>outside annotated spans</>}
            {" · "}
            <span style={{ color: opText(yOp) }}>{OPERATIONS[yOp].name}</span> {fmt(S[focus][yOp])},{" "}
            <span style={{ color: opText(xOp) }}>{OPERATIONS[xOp].name}</span> {fmt(S[focus][xOp])}
          </p>
        ) : selectionMean ? (
          <p>
            {selectionMean.n} tokens selected · mean{" "}
            <span style={{ color: opText(yOp) }}>{OPERATIONS[yOp].name}</span> {fmt(selectionMean.y)},{" "}
            <span style={{ color: opText(xOp) }}>{OPERATIONS[xOp].name}</span> {fmt(selectionMean.x)} (★)
          </p>
        ) : (
          <p className="rw-muted">Click a token or a point to link them; drag across tokens to place the mean of a span (★).</p>
        )}
        {range && (
          <button type="button" className="rw-clear" onClick={() => setRange(null)}>
            Clear selection
          </button>
        )}
      </div>
    </div>
  );
}
