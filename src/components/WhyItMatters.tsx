import { OperationTable } from "./OperationTable";

export function WhyItMatters() {
  return (
    <section className="section wrap" id="why" aria-labelledby="why-title">
      <h2 id="why-title" className="section-heading">
        Why it matters
      </h2>
      <p className="section-intro">Reasoning is more than what we read.</p>

      <div className="prose">
        <p>
          Large language models can generate detailed reasoning traces: they break a problem down, recall what they
          know, and derive an answer step by step. In the text, these steps play visibly different roles.
        </p>
        <p className="question">
          Do these reasoning operations also have distinct representations inside the model, or are they only
          patterns in the generated text?
        </p>

        <h3>Why the distinction matters</h3>
        <p>
          A reasoning trace is the model's own account of what it is doing. If the operations we read in that
          account have counterparts in the model's hidden representations, the internal structure of reasoning
          becomes something we can measure, laying groundwork for monitoring, diagnosing, and eventually improving
          how language models reason.
        </p>

        <h3>Our approach: from text to hidden representations</h3>
        <p>
          We segment reasoning traces into spans, label each span with the operation it performs, and ask whether
          the hidden states behind those spans carry a corresponding geometric structure. The eight operations below
          are the ones we analyse; each keeps the same colour throughout this page.
        </p>
      </div>

      <OperationTable />
    </section>
  );
}
