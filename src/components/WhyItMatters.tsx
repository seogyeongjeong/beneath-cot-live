// The files were saved under each other's names: method/method.png holds the motivation figure.
const MOTIVATION = `${import.meta.env.BASE_URL}images/method/method.png`;

const OUTCOMES = [
  { title: "Measure reasoning", text: "Quantify how different reasoning operations are represented internally." },
  { title: "Monitor internal signals", text: "Track and interpret model behavior through measurable representations." },
  {
    title: "Diagnose reasoning behavior",
    text: "Enable more reliable evaluation and provide groundwork for future interventions.",
  },
];

export function WhyItMatters() {
  return (
    <section className="section wrap" id="why" aria-labelledby="why-title">
      <h2 id="why-title" className="section-heading">
        Why it matters
      </h2>
      <p className="section-intro">We are teaching models to reason. But what are they learning internally?</p>

      <div className="prose">
        <p>
          Modern language models are increasingly trained not just to produce correct answers, but to improve the
          reasoning processes that lead to them. Yet, while we can read their step-by-step reasoning traces, we still
          know surprisingly little about how these processes are represented inside the model.
        </p>
        <p>
          A reasoning trace may involve breaking down a problem, recalling knowledge, performing calculations, and
          drawing conclusions.{" "}
          <strong>
            But do these distinct reasoning operations leave corresponding signatures in the model's hidden
            representations—or are they merely patterns in the generated text?
          </strong>
        </p>
        <p>
          Understanding this distinction matters. If reasoning operations have identifiable internal structure that
          generalizes across different tokens and problems, we can begin to study reasoning beyond its surface-level
          expressions.
        </p>
        <p>
          <strong>
            By making the internal structure of reasoning measurable, we take a step toward understanding, monitoring,
            and eventually intervening in how language models reason.
          </strong>
        </p>
      </div>

      <figure className="figure motivation-figure">
        <img
          src={MOTIVATION}
          alt="Left: a reasoning trace read as a sequence of operations (break down the problem, recall a formula, compute, draw a conclusion, give the final answer). Right: the question of whether these operations form distinct clusters in the model's hidden space."
        />
      </figure>

      <div className="outcomes" aria-labelledby="outcomes-title">
        <p id="outcomes-title" className="outcomes-title">Key outcomes</p>
        <ul>
          {OUTCOMES.map((o) => (
            <li key={o.title}>
              <p className="outcome-name">{o.title}</p>
              <p className="outcome-text">{o.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
