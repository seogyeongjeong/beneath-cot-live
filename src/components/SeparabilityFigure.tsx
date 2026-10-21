import { OPERATIONS } from "../lib/operations";

// The paper's Figure "overall-separability" (figures/main_result_auroc.tex): two subfigures supplied
// as images, with the legends that the paper draws in TikZ above each panel rebuilt here.
const DIR = `${import.meta.env.BASE_URL}images/discoveries/figure1/`;
const PANEL_A = `${DIR}fig1c_peak_clean_auroc.png`;
const PANEL_B = `${DIR}fig3c_stage_clean_auroc.png`;

// \definecolor qwenThree / qwenTwoFive / gemmaFour in the paper source; line styles from the TikZ legend.
const MODELS = [
  { name: "Qwen3-8B", color: "#1B7837", dash: undefined, width: 3 },
  { name: "Qwen2.5-7B", color: "#762A83", dash: "5 3", width: 3 },
  { name: "Gemma4-31B", color: "#D6604D", dash: "7 3 2 3", width: 3 },
  { name: "Random", color: "#000000", dash: "1.5 2.5", width: 2.2 },
];

function LineSwatch({ color, dash, width = 3, length = 22 }: { color: string; dash?: string; width?: number; length?: number }) {
  return (
    <svg width={length} height="10" aria-hidden="true">
      <line x1="0" y1="5" x2={length} y2="5" stroke={color} strokeWidth={width} strokeDasharray={dash} />
    </svg>
  );
}

export function SeparabilityFigure() {
  return (
    <figure className="figure sep-figure">
      <ul className="sep-legend sep-legend-a" aria-label="Reasoning operations">
        {OPERATIONS.map((op) => (
          <li key={op.label}>
            <LineSwatch color={op.color} length={16} />
            {op.name}
          </li>
        ))}
      </ul>
      <ul className="sep-legend sep-legend-b" aria-label="Models">
        {MODELS.map((m) => (
          <li key={m.name}>
            <LineSwatch color={m.color} dash={m.dash} width={m.width} />
            {m.name}
          </li>
        ))}
      </ul>

      <div className="sep-panel sep-panel-a">
        <span className="sep-ylabel" aria-hidden="true">
          AUROC
        </span>
        <a href={PANEL_A} target="_blank" rel="noreferrer" title="Open full-resolution image">
          <img
            src={PANEL_A}
            width={1280}
            height={740}
            alt="Peak-layer one-vs-rest AUROC with 95% confidence intervals for each reasoning operation in Qwen3-8B, Qwen2.5-7B and Gemma4-31B; all values lie well above the random level of 0.5."
          />
        </a>
      </div>
      <div className="sep-panel sep-panel-b">
        <a href={PANEL_B} target="_blank" rel="noreferrer" title="Open full-resolution image">
          <img
            src={PANEL_B}
            width={778}
            height={736}
            alt="AUROC averaged across reasoning operations at the embedding, early, middle and late layers for three models, highest in the middle layers, with random baselines near 0.5."
          />
        </a>
      </div>

      <p className="sep-sub sep-sub-a">(A) Peak-layer AUROC (95% CI)</p>
      <p className="sep-sub sep-sub-b">(B) Stage-wise mean AUROC</p>
    </figure>
  );
}
