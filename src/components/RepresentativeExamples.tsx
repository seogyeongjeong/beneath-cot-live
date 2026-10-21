import { ReasoningWindowViewer } from "./ReasoningWindowViewer";

// One block per reasoning pattern, in the order of the curated groups (reasoning_windows/build_and_score.py).
const PATTERNS = [
  {
    group: "01_understanding",
    title: "Understanding the Problem",
    sequence: "Extraction → Direct Mapping → Decomposition",
    text: "At the beginning of a solution, the model often extracts relevant information, translates it into a workable form, and breaks the problem into smaller parts.",
  },
  {
    group: "02_working",
    title: "Working Through the Solution",
    sequence: "Recall → Algebraic Manipulation → Arithmetic Computation → Deduction",
    text: "As the solution progresses, the model draws on relevant knowledge, manipulates equations, performs calculations, and derives intermediate conclusions.",
  },
  {
    group: "03_revisiting",
    title: "Revisiting an Earlier Step",
    sequence: "Arithmetic Computation → Recall → Deduction",
    text: "Reasoning does not always follow a straight path. While working through calculations, the model may return to previously learned rules or relevant information before continuing its deductions.",
  },
  {
    group: "04_final",
    title: "Reaching the Final Answer",
    sequence: "Deduction → Final Answer",
    text: "Toward the end of a reasoning trace, the model often moves from deriving conclusions to explicitly presenting its final answer.",
  },
];

export function RepresentativeExamples() {
  return (
    <section className="section section-plain wrap" id="examples" aria-labelledby="examples-title">
      <h2 id="examples-title" className="section-heading">
        Representative examples
      </h2>
      <p className="section-intro">Explore how reasoning operations appear throughout a model's solution.</p>

      {PATTERNS.map((p) => (
        <article className="rw-pattern" key={p.group} aria-labelledby={`rw-${p.group}`}>
          <h3 id={`rw-${p.group}`} className="rw-pattern-title">
            {p.title}
          </h3>
          <p className="rw-sequence">{p.sequence}</p>
          <p className="rw-pattern-text">{p.text}</p>
          <div className="figure rw-figure">
            <ReasoningWindowViewer group={p.group} />
          </div>
        </article>
      ))}
    </section>
  );
}
