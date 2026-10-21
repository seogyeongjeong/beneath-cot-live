import { CommonTokenScatter } from "./CommonTokenScatter";
import { ControlsFigure } from "./ControlsFigure";
import { SeparabilityFigure } from "./SeparabilityFigure";


export function KeyDiscoveries() {
  return (
    <section className="section wrap" id="findings" aria-labelledby="findings-title">
      <h2 id="findings-title" className="section-heading">
        Key discoveries
      </h2>
      <p className="section-intro">Two findings about how reasoning operations live in hidden states.</p>

      <article className="discovery" aria-labelledby="d1-title">
        <h3 id="d1-title" className="discovery-title">
          1. Distinct reasoning operations leave distinct internal signatures.
        </h3>
        <div className="prose">
          <p>
            Different reasoning operations are distinguishable in the model's hidden representations, with
            particularly strong separability in intermediate layers. Importantly, these signals cannot be fully
            explained by surface-level lexical or positional cues.
          </p>
        </div>

        <SeparabilityFigure />

        <div className="prose">
          <p>
            Could these results simply reflect differences in vocabulary or token position? We examine this
            possibility through a series of controlled analyses: text-only and position-only classifiers, spans
            containing vocabulary of a competing operation, position-matched evaluation, a PCA-only probe without
            supervised LDA, and transfer to an additional model and to new tasks.
          </p>
        </div>

        <ControlsFigure />

        {/* <p className="takeaway">
          Words and positions carry signal, but hidden states carry more.
        </p> */}
      </article>

      <article className="discovery" aria-labelledby="d2-title">
        <h3 id="d2-title" className="discovery-title">
          2. Same words. Different reasoning roles.
        </h3>
        <div className="prose">
          <p>
            Even identical tokens can exhibit different operation-aligned representations depending on the
            reasoning context in which they appear. This suggests that the model's internal representations capture
            information beyond the identity of individual words.
          </p>
          <p>
            For a pair of operations, we take the tokens that are among the ten most frequent in both, such as
            “the”, “is” or “so”, and place every occurrence by its alignment with the two operation vectors. In the
            paper, these occurrences are largely intermixed in early layers, gradually separate along the
            operation directions in middle-to-late layers, and become more mixed again in the final layer.
          </p>
        </div>

        <figure className="figure sv-figure">
          <CommonTokenScatter />
        </figure>
      </article>

      <div className="discovery-more">
        <h3 className="discovery-more-title">There's more beneath the surface.</h3>
        <p>
          Beyond these two findings, our study also explores how reasoning signals evolve across model layers and how
          preceding reasoning context contributes to the representations of subsequent operations.
        </p>
        <a className="more-link" href="https://arxiv.org/html/2609.04753v1" target="_blank" rel="noreferrer">
          Explore more findings in the full paper →
        </a>
      </div>
    </section>
  );
}
