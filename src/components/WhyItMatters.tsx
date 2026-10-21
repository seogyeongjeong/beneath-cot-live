export function WhyItMatters() {
  return (
    <section className="section wrap" id="why" aria-labelledby="why-title">
      <h2 id="why-title" className="section-heading">
        Why it matters
      </h2>
      <p className="section-intro">Reasoning is more than what we read.</p>

      <div className="prose">
        <p>
          Large language models write out detailed reasoning traces: they break a problem down, recall what they know,
          and derive an answer step by step. In the text, these steps play visibly different roles.
        </p>
        <p className="question">
          Do these reasoning operations also have distinct representations inside the model, or are they only
          patterns in the generated text?
        </p>
        <p>
          If the operations we read in a trace have counterparts in the model's hidden representations, the internal
          structure of reasoning becomes something we can measure, laying groundwork for monitoring, diagnosing, and
          eventually improving how language models reason.
        </p>
      </div>
    </section>
  );
}
