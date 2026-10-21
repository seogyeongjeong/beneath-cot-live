// Figure 2: lexical, positional and methodological controls, drawn from the paper's tables
// (arXiv 2609.04753 source): tables/surface_controls.tex for the comparison table, and
// compete_operation_vocab, digit_check, position-stratified, pca_results, llama_generalization and
// dataset_generalization for the boxes. Every pair is macro AUROC / AUPRC.

type Pair = [number, number];

const ROWS: { model: string; position: Pair; text: Pair; hidden: Pair }[] = [
  { model: "Qwen3-8B", position: [0.718, 0.279], text: [0.849, 0.549], hidden: [0.937, 0.742] },
  { model: "Qwen2.5-7B", position: [0.708, 0.269], text: [0.854, 0.562], hidden: [0.895, 0.646] },
  { model: "Gemma4-31B", position: [0.751, 0.311], text: [0.802, 0.466], hidden: [0.899, 0.641] },
];

const COLUMNS = [
  { key: "position", label: "Position-only", hint: "logistic regression on relative trace position" },
  { key: "text", label: "Text-only", hint: "stronger of bag-of-words and TF–IDF" },
  { key: "hidden", label: "Hidden (ours)", hint: "mean-pooled hidden-state probe" },
] as const;

interface Control {
  title: string;
  /** One AUROC / AUPRC pair, or several labelled pairs (task transfer). */
  values: { label?: string; auroc: string; auprc: string }[];
  text: string;
  source: string;
}

const CONTROLS: Control[] = [
  {
    title: "Competing-op vocabulary",
    values: [{ auroc: "0.919", auprc: "0.848" }],
    text: "spans holding another operation’s cue words",
    source: "Qwen3-8B",
  },
  {
    title: "Digit & formula density",
    values: [{ auroc: "0.917", auprc: "0.789" }],
    text: "spans with 50–75% digit or math tokens",
    source: "49 test spans, 5 operations",
  },
  {
    title: "Position-matched",
    values: [{ auroc: "≥ 0.916", auprc: "≥ 0.769" }],
    text: "within each of 5 relative-position bins",
    source: "Qwen3-8B",
  },
  {
    title: "No supervised LDA",
    values: [{ auroc: "0.938", auprc: "0.716" }],
    text: "PCA-only class-mean directions",
    source: "Qwen3-8B",
  },
];

// Grouped under "Additional models & datasets" (tables/llama_generalization, dataset_generalization).
const GENERALIZATION: Control[] = [
  {
    title: "New model",
    values: [{ auroc: "0.958", auprc: "0.840" }],
    text: "same probing procedure, mean-pooled",
    source: "Llama-3-8B",
  },
  {
    title: "New tasks",
    values: [
      { label: "GPQA-Diamond", auroc: "0.938", auprc: "0.764" },
      { label: "MATH-500", auroc: "0.948", auprc: "0.799" },
    ],
    text: "transfer without task-specific retraining",
    source: "Qwen3-8B probes",
  },
];

function ControlBox({ c }: { c: Control }) {
  const multi = c.values.length > 1;
  return (
    <li>
      <p className="ctrl-box-title">{c.title}</p>
      {c.values.map((v) => (
        <p key={v.label ?? "v"} className={multi ? "ctrl-box-value is-small" : "ctrl-box-value"}>
          {v.label && <span className="ctrl-box-label">{v.label}</span>}
          {v.auroc}
          <span className="ctrl-box-auprc"> / {v.auprc}</span>
        </p>
      ))}
      <p className="ctrl-box-text">{c.text}</p>
      <p className="ctrl-box-model">{c.source}</p>
    </li>
  );
}

const fmt = ([a, b]: Pair) => `${a.toFixed(3)} / ${b.toFixed(3)}`;

export function ControlsFigure() {
  return (
    <figure className="figure ctrl-figure">
      <p className="ctrl-title">
        Not a lexical or positional shortcut <span className="ctrl-metric">macro AUROC / AUPRC</span>
      </p>

      <div className="ctrl-left">
      <table className="ctrl-table">
        <thead>
          <tr>
            <th scope="col">Model</th>
            {COLUMNS.map((c) => (
              <th scope="col" key={c.key} className={c.key === "hidden" ? "is-ours" : undefined}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.model}>
              <th scope="row">{r.model}</th>
              {COLUMNS.map((c) => (
                <td key={c.key} className={c.key === "hidden" ? "is-ours" : undefined}>
                  {fmt(r[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="ctrl-scale">
        Macro AUROC / AUPRC.{" "}
        {COLUMNS.map((c) => (
          <span key={c.key}>
            <strong>{c.label}</strong>: {c.hint}.{" "}
          </span>
        ))}
      </p>
      </div>

      <ul className="ctrl-boxes">
        {CONTROLS.map((c) => (
          <ControlBox key={c.title} c={c} />
        ))}
        <li className="ctrl-group">
          <p className="ctrl-group-title">Additional models &amp; datasets</p>
          <ul>
            {GENERALIZATION.map((c) => (
              <ControlBox key={c.title} c={c} />
            ))}
          </ul>
        </li>
      </ul>
    </figure>
  );
}
