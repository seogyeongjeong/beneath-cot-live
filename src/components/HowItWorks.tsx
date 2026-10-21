import { useState } from "react";
import { OperationTable } from "./OperationTable";

// Supplied by the authors. Until the file exists the image request fails and a labelled
// placeholder naming the expected path is shown; adding the file is enough to publish it.
// teaser/motivation.png holds the five-step method pipeline (the two files' names are swapped).
const METHOD_FIGURE = "images/teaser/motivation.png";

export function HowItWorks() {
  const [missing, setMissing] = useState(false);
  const src = `${import.meta.env.BASE_URL}${METHOD_FIGURE}`;
  return (
    <section className="section wrap" id="method" aria-labelledby="method-title">
      <h2 id="method-title" className="section-heading">
        How it works
      </h2>
      <p className="section-intro">From reasoning traces to operation-aligned representations.</p>

      <div className="prose">
        <p>
          We annotate reasoning traces with functional operation labels, extract their hidden representations, and
          identify directions associated with each reasoning operation.
        </p>
      </div>

      <figure className="figure method-figure">
        {missing ? (
          <div className="figure-placeholder" role="img" aria-label="Method overview figure (to be added)">
            <span className="figure-placeholder-title">Method overview figure to be added</span>
            <code>public/{METHOD_FIGURE}</code>
          </div>
        ) : (
          <a href={src} target="_blank" rel="noreferrer" title="Open full-resolution image">
            <img
              src={src}
              alt="Method overview: 1 collect reasoning traces, 2 annotate reasoning operations, 3 extract hidden representations, 4 construct reasoning vectors, 5 outputs (token-level operation signals and span-level geometry)."
              onError={() => setMissing(true)}
            />
          </a>
        )}
        <figcaption>Method overview.</figcaption>
      </figure>

      <div className="prose method-after">
        <p>
          These directions allow us to examine how different reasoning operations are reflected in the model's
          internal representations.
        </p>
      </div>

      <details className="taxonomy-details">
        <summary>The eight reasoning operations, with definitions and examples</summary>
        <OperationTable />
      </details>
    </section>
  );
}
