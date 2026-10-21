import { PAPER } from "../lib/paper";

// Only sections that exist are listed; add each one here as it is built.
const SECTIONS: { href: string; label: string }[] = [
  { href: "#why", label: "Motivation" },
  { href: "#method", label: "Method" },
  { href: "#examples", label: "Examples" },
  { href: "#findings", label: "Findings" },
  { href: "#try", label: "Try it" },
  { href: "#citation", label: "Citation" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrap site-header-inner">
        <a className="wordmark" href="#top">
          {PAPER.shortTitle}
        </a>
        <nav aria-label="Page">
          <ul>
            {SECTIONS.map((s) => (
              <li key={s.href}>
                <a href={s.href}>{s.label}</a>
              </li>
            ))}
            <li className="nav-sep" aria-hidden="true" />
            <li>
              <a href={PAPER.links.paper} target="_blank" rel="noreferrer">
                Paper
              </a>
            </li>
            <li>
              <a href={PAPER.links.code} target="_blank" rel="noreferrer">
                Code
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
