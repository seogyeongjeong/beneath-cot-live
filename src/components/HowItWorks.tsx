import { useState } from "react";

// Supplied by the authors. Until the file exists the image request fails and a labelled
// placeholder naming the expected path is shown; adding the file is enough to publish it.
const METHOD_FIGURE = "images/method/method_overview.png";

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
            <img src={src} alt="Method overview" onError={() => setMissing(true)} />
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
    </section>
  );
}
