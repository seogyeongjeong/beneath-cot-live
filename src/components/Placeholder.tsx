import type { ReactNode } from "react";

/** Marks content that is not available yet. Never stands in for data silently. */
export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <span className="placeholder" title="Placeholder: to be provided">
      {children}
    </span>
  );
}
