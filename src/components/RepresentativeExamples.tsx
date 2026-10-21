import { useState } from "react";
import { ReasoningWindowViewer } from "./ReasoningWindowViewer";

// One block per reasoning pattern, in the order of the curated groups (reasoning_windows/build_and_score.py).
const PATTERNS = [
  {
    group: "01_understanding",
    title: "Understanding the Problem",
    sequence: "Extraction → Direct Mapping → Decomposition",
    text: "At the beginning of a solution, the model often **extracts relevant information**, **translates it into a workable form**, and **breaks the problem into smaller parts**.",
  },
  {
    group: "02_working",
    title: "Working Through the Solution",
    sequence: "Recall → Algebraic Manipulation → Arithmetic Computation → Deduction",
    text: "As the solution progresses, the model **draws on relevant knowledge**, **manipulates equations**, **performs calculations**, and **derives intermediate conclusions**.",
  },
  {
    group: "03_revisiting",
    title: "Revisiting an Earlier Step",
    sequence: "Arithmetic Computation → Recall → Deduction",
    text: "Reasoning **does not always follow a straight path**. While working through calculations, the model may **return to previously learned rules or relevant information** before continuing its deductions.",
  },
  {
    group: "04_final",
    title: "Reaching the Final Answer",
    sequence: "Deduction → Final Answer",
    text: "Toward the end of a reasoning trace, the model often moves **from deriving conclusions to explicitly presenting its final answer**.",
  },
];

/** "**phrase**" → bold phrase. */
const emphasis = (t: string) =>
  t.split(/\*\*(.+?)\*\*/).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));

export function RepresentativeExamples() {
  const [group, setGroup] = useState(PATTERNS[0].group);
  const p = PATTERNS.find((x) => x.group === group)!;
  return (
    <section className="section wrap" id="examples" aria-labelledby="examples-title">
      <h2 id="examples-title" className="section-heading">
        Representative examples
      </h2>
      <p className="section-intro">Explore how reasoning operations appear throughout a model's solution.</p>

      <div className="rw-shell">
        <div className="rw-patterns" role="tablist" aria-label="Reasoning pattern">
          {PATTERNS.map((x) => (
            <button
              key={x.group}
              type="button"
              role="tab"
              aria-selected={x.group === group}
              className={x.group === group ? "on" : ""}
              onClick={() => setGroup(x.group)}
            >
              <span className="rw-pattern-name">{x.title}</span>
              <span className="rw-pattern-seq">{x.sequence}</span>
            </button>
          ))}
        </div>
        <p className="rw-pattern-text" role="tabpanel" aria-label={p.title}>
          {emphasis(p.text)}
        </p>
        <div className="rw-figure">
          <ReasoningWindowViewer key={p.group} group={p.group} />
        </div>
      </div>
    </section>
  );
}
