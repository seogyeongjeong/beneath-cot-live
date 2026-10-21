// Bibliographic facts, from the arXiv record of 2609.04753.
// Fields set to `null` are not public yet; the page renders them as labelled placeholders.

export const PAPER = {
  // Short form for the header, taken from the paper title itself.
  shortTitle: "Beneath the Surface of Chains-of-Thought",
  title: "Beneath the Surface of Chains-of-Thought: A Mechanistic Interpretation of Reasoning Operations in LLMs",
  venue: "EMNLP 2026 · Main Conference",
  // aff: indices into `institutions` (1-based, as printed). corresponding: †. intern: work done during
  // an internship at NAVER AI Lab.
  authors: [
    { name: "Seogyeong Jeong", url: "https://seogyeongjeong.github.io/", aff: [1, 2], intern: true },
    { name: "Jaehui Hwang", url: "https://j-h-hwang.github.io/", aff: [2] },
    { name: "Dongyoon Han", url: "https://sites.google.com/site/dyhan0920/", aff: [2] },
    { name: "Geonmo Gu", url: "https://geonm.github.io/", aff: [2] },
    { name: "Alice Oh", url: "https://aliceoh9.github.io/", aff: [1], corresponding: true },
    { name: "Taekyung Kim", url: "https://taekyungkim918.github.io", aff: [2], corresponding: true },
  ] as { name: string; url: string; aff: number[]; corresponding?: boolean; intern?: boolean }[],
  institutions: [
    { name: "KAIST", url: null as string | null, logo: "web/kaist.png", height: 34 },
    { name: "NAVER AI Lab", url: "https://naver-career.gitbook.io/en/teams/clova-cic/ai-lab" as string | null, logo: "web/naver-ai-lab.png", height: 25 },
  ],
  links: {
    paper: "https://arxiv.org/abs/2609.04753",
    code: "https://github.com/naver-ai/beneath-cot",
    huggingface: null as string | null,
  },
};
