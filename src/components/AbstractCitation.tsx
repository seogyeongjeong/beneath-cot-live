import { useState } from "react";

const ABSTRACT =
  "Reasoning in large language models unfolds through diverse functional operations, such as problem formulation, goal decomposition, and deduction. Although these operations are explicitly distinguished in text, little is known about how they are geometrically organized in representation spaces. To this end, we investigate whether distinct reasoning operations exhibit corresponding geometric structure in hidden representations. We find that operations are separable in held-out representations, with separability peaking in middle layers, and verify that this structure is not explained by lexical or positional confounds. Across layers, token-wise operation-alignment becomes more distributed over spans, while identical surface tokens are represented differently depending on the operation of its surrounding chunk. Attention-masking interventions further show that operation-aligned representations at chunk onset depend on preceding reasoning context. Consequently, our work demonstrates that language models maintain representational correspondence between linguistic reasoning expressions and their internal geometric structures.";

const BIBTEX = `@inproceedings{
Jeong2026beneath,
title={Beneath the Surface of Chains-of-Thought: A Mechanistic Interpretation of Reasoning Operations in {LLM}s},
author={Jeong, Seogyeong and Hwang, Jaehui and Han, Dongyoon and Gu, Geonmo and Oh, Alice and Kim, Taekyung},
booktitle={The 2026 Conference on Empirical Methods in Natural Language Processing},
year={2026},
}`;

export function AbstractCitation() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(BIBTEX);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="section section-plain wrap" id="abstract" aria-labelledby="abstract-title">
      <h2 id="abstract-title" className="section-heading">
        Abstract
      </h2>
      <div className="prose abstract">
        <p>{ABSTRACT}</p>
      </div>

      <h2 id="citation" className="section-heading citation-heading">
        Citation
      </h2>
      <div className="bibtex">
        <button type="button" className="bibtex-copy" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
        <pre>
          <code>{BIBTEX}</code>
        </pre>
      </div>
    </section>
  );
}
