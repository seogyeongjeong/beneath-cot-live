// The eight reasoning operations analysed in the paper (LABEL_CONFIG order in
// latent_reasoning_pattern/03_lda_dynamic.py). Colours are LABEL_COLOR from
// 10_main_figure.py (ColorBrewer Set1), identical to the \definecolor values in the
// paper source, so the page matches the paper figures.
// Stages and examples follow the paper's Table 1 (arXiv 2609.04753 source,
// tables/major-reasoning-ops.tex). Definitions come from the span-annotation guideline
// (latent_reasoning_pattern/prompt.py), which follows Pólya's four stages.

export type Stage = "understand" | "plan" | "carry-out" | "look-back";

export const STAGES: Stage[] = ["understand", "plan", "carry-out", "look-back"];

export const STAGE_NAME: Record<Stage, string> = {
  understand: "Understanding the problem",
  plan: "Planning the solution",
  "carry-out": "Carrying out the plan",
  "look-back": "Looking back and final answer",
};

/**
 * One piece of an example. `hl` marks the part Table 1 sets in the operation's
 * colour and bold (\textcolor{op}{\textbf{...}}); `math` marks LaTeX math, whose
 * single-letter variables are set in italics.
 */
export interface Segment {
  t: string;
  hl?: boolean;
  math?: boolean;
}

export interface Operation {
  label: string;
  name: string;
  /** Colour in figures and heatmaps (10_main_figure.py). */
  color: string;
  /**
   * Colour of the highlighted example text, when Table 1 uses a different one:
   * Final answer is \textcolor{gray} there, since #333 would not stand out from body text.
   */
  textColor?: string;
  stage: Stage;
  definition: string;
  example: Segment[];
}

export const OPERATIONS: Operation[] = [
  {
    label: "[EXTRACTION]",
    name: "Extraction",
    color: "#e41a1c",
    stage: "understand",
    definition: "Directly retrieving the given information from the problem statement without modification.",
    example: [{ t: "The problem says that " }, { t: "two numbers add up to 10.", hl: true }],
  },
  {
    label: "[SYMBOLIZATION.DIRECT-MAPPING]",
    name: "Direct mapping",
    color: "#377eb8",
    stage: "understand",
    definition:
      "Directly converting the given statement into a formal representation without changing its structure or interpretation.",
    example: [{ t: "x is greater than 3 → " }, { t: "x > 3", hl: true, math: true }],
  },
  {
    label: "[STRUCTURAL-ANALYSIS.DECOMPOSITION]",
    name: "Decomposition",
    color: "#4daf4a",
    stage: "plan",
    definition: "Breaking a complex problem into simpler or independent subproblems.",
    example: [
      { t: "Get the area of Heptagon → " },
      { t: "Divide it into triangles", hl: true },
      { t: " → " },
      { t: "Solve each triangle", hl: true },
      { t: " → Combine results" },
    ],
  },
  {
    label: "[RETRIEVAL.RECALL]",
    name: "Recall",
    color: "#984ea3",
    stage: "carry-out",
    definition: "Recalling relevant concepts, definitions, rules, or formulas from prior knowledge.",
    example: [
      { t: "Area of a circle is needed → " },
      { t: "Recall ", hl: true },
      { t: "A = πr²", hl: true, math: true },
      { t: " → apply to problem" },
    ],
  },
  {
    label: "[INFERENCE-FLOW.CHAINING.DEDUCTION]",
    name: "Deduction",
    color: "#ff7f00",
    stage: "carry-out",
    definition: "Constructing a sequence of logical steps, from the general to the specific.",
    example: [
      { t: "x", math: true },
      { t: " is greater than 3 and " },
      { t: "x", math: true },
      { t: " is an integer → " },
      { t: "x ≥ 4", hl: true, math: true },
    ],
  },
  {
    label: "[EXECUTION.OPERATION.ALGEBRAIC-MANIPULATION]",
    name: "Algebraic manipulation",
    color: "#a65628",
    stage: "carry-out",
    definition: "Transforming the structure of expressions or equations.",
    example: [{ t: "x + y = 10", math: true }, { t: " → " }, { t: "y = 10 − x", hl: true, math: true }],
  },
  {
    label: "[EXECUTION.OPERATION.ARITHMETIC-COMPUTATION]",
    name: "Arithmetic computation",
    color: "#f781bf",
    stage: "carry-out",
    definition: "Performing numerical calculations.",
    example: [{ t: "10 − 3 ", math: true }, { t: "= 7", hl: true, math: true }],
  },
  {
    label: "[FINAL-ANSWER]",
    name: "Final answer",
    color: "#333333",
    textColor: "#808080",
    stage: "look-back",
    definition: "Clearly presenting the final result derived from the problem-solving process in the required format.",
    example: [
      { t: "Therefore, the values are " },
      { t: "x = 3", hl: true, math: true },
      { t: " and ", hl: true },
      { t: "y = 7", hl: true, math: true },
      { t: "." },
    ],
  },
];
