import { PAPER } from "../lib/paper";
import { HeroTeaser } from "./HeroTeaser";

/** Stops the browser from breaking inside "Chains-of-Thought" at a hyphen. */
function keepHyphenatedWords(text: string) {
  return text.split(/(\S*-\S*)/).map((part, i) =>
    part.includes("-") ? (
      <span className="nowrap" key={i}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

const EXTERNAL = { target: "_blank", rel: "noreferrer" } as const;

const ICONS = `${import.meta.env.BASE_URL}icons/`;

// Icons (public/icons) sit in a small white circle so their own colours stay legible on the coloured pill.
const LINKS: {
  kind: "paper" | "code" | "hf" | "demo";
  label: string;
  href: string | null;
  external: boolean;
  pending?: string;
  icon: string;
}[] = [
  { kind: "paper", label: "arXiv", href: PAPER.links.paper, external: true, icon: "ArXiv-colored.png" },
  { kind: "code", label: "GitHub", href: PAPER.links.code, external: true, icon: "github.png" },
  {
    kind: "hf",
    label: "Hugging Face",
    href: PAPER.links.huggingface,
    external: true,
    pending: "Placeholder: Hugging Face URL to be provided",
    icon: "huggingface.png",
  },
  { kind: "demo", label: "Demo", href: "#try", external: false, icon: "demo-typing.png" },
];

const Icon = ({ file }: { file: string }) => (
  <span className="link-ico" aria-hidden="true">
    <img src={`${ICONS}${file}`} alt="" />
  </span>
);


export function Hero() {
  return (
    <section className="hero wrap" id="top">
      <p className="venue">{PAPER.venue}</p>
      <h1 className="headline">What happens beneath the surface of reasoning?</h1>
      <p className="paper-title">{keepHyphenatedWords(PAPER.title)}</p>
      <p className="hero-lede">
        We identify distinct reasoning operations in LLM hidden representations, revealing structure beyond words and
        token positions.
      </p>

      <div className="byline">
        <p className="authors">
          {PAPER.authors.map((a) => (
            <span key={a.name}>
              <a href={a.url} {...EXTERNAL}>
                {a.name}
              </a>
              <sup>
                {a.aff.join(",")}
                {a.corresponding && "†"}
                {a.intern && "*"}
              </sup>
            </span>
          ))}
        </p>
        <ul className="institutions" aria-label="Affiliations">
          {PAPER.institutions.map((inst, k) => {
            const logo = <img src={`${ICONS}${inst.logo}`} alt={inst.name} style={{ height: inst.height }} />;
            return (
              <li key={inst.name}>
                <sup>{k + 1}</sup>
                {inst.url ? (
                  <a href={inst.url} {...EXTERNAL} title={inst.name}>
                    {logo}
                  </a>
                ) : (
                  logo
                )}
              </li>
            );
          })}
        </ul>
        <p className="author-notes">
          <span>† Corresponding authors</span>
          <span>* Work done during an internship at NAVER AI Lab</span>
        </p>
      </div>

      <ul className="actions">
        {LINKS.map((l) => (
          <li key={l.label}>
            {l.href ? (
              <a className={`link-btn link-btn-${l.kind}`} href={l.href} {...(l.external && EXTERNAL)}>
                <Icon file={l.icon} />
                <span>{l.label}</span>
              </a>
            ) : (
              <span className={`link-btn link-btn-${l.kind} is-pending`} title={l.pending} aria-disabled="true">
                <Icon file={l.icon} />
                <span>{l.label}</span>
              </span>
            )}
          </li>
        ))}
      </ul>

      <HeroTeaser />
      <a className="explore-link" href="#examples">
        Explore examples →
      </a>
    </section>
  );
}
