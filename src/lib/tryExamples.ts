// Example inputs for "Try it yourself". All text is taken verbatim from Qwen3-8B reasoning traces and
// questions in latent_reasoning_pattern/reasoning_windows/examples.json (ids noted); trace excerpts are
// cut at a sentence end. Choosing an example only fills the input; it never starts a GPU job.

export const TRACE_EXAMPLES: { title: string; source: string; text: string }[] = [
  { title: "Shading a 2×4 grid", source: "01_understanding_5_dapo17k_q374_t0", text: "Okay, so I need to figure out how many ways I can shade at least one square in a 2x4 grid, making sure that no two shaded squares are adjacent. Hmm, let me start by understanding the problem better. \n\nFirst, the grid is 2 rows by 4 columns. So there are 8 squares in total. The question is about shading at least one square, but with the condition that no two shaded squares share an edge. That means if I shade a square, I can't shade any square that's directly next to it horizontally or vertically. Diagonally is okay, right? Because diagonally adjacent squares don't share an edge." },
  { title: "Hensel's lemma", source: "02_working_3_dapo17k_q202_t0", text: "So perhaps we need to use Hensel's lemma?\n\nWait, Hensel's lemma says that if f(a) ≡ 0 mod p and f'(a) ≡/ 0 mod p, then there's a unique lift mod p². But if f'(a) ≡ 0 mod p, then there might be multiple solutions or none.\n\nSo let me check the derivative. f'(x) = 3x² + 6x - 2. For x=2, f'(2) = 3*(4) + 6*(2) - 2 = 12 + 12 - 2 = 22 ≡ 2 mod 5. Which is not zero mod 5. Therefore, by Hensel's lemma, there is a unique lift of x=2 mod 5 to a solution mod 25." },
  { title: "Reaching an answer", source: "04_final_2_dapo17k_q138_t0", text: "sum_{k=1}^{89} sin(2° * k) = [sin(89 * 2° / 2) * sin((89 + 1) * 2° / 2)] / sin(2° / 2)\n\nCompute that:\n\nFirst, compute the numerator:\n\nsin(89 * 2° / 2) = sin(89°)\n\nsin((89 + 1) * 2° / 2) = sin(90°)\n\nDenominator: sin(2° / 2) = sin(1°)\n\nTherefore, the sum is [sin(89°) * sin(90°)] / sin(1°) = [sin(89°) * 1] / sin(1°) = sin(89°)/sin(1°)\n\nBut sin(89°) = cos(1°), so this is cos(1°)/sin(1°) = cot(1°). \n\nWhich matches the previous result. Therefore, this formula gives the same answer. Therefore, S = cot(1°)." },
];

export const QUESTION_EXAMPLES: { title: string; source: string; text: string }[] = [
  { title: "Shading a 2×4 grid", source: "01_understanding_5_dapo17k_q374_t0", text: "I have a $2 \\times 4$ grid of squares. How many ways can I shade at least one of the squares such that no two shaded squares share an edge?" },
  { title: "Order of S₃ × ℤ₂", source: "03_revisiting_1_TheoremQA_q287_t0", text: "What is the order of the group S_3 * Z_2?" },
  { title: "A cubic modulo 25", source: "02_working_3_dapo17k_q202_t0", text: "Find the sum of integers $0 \\leq x < 25$ such that $x^3 + 3x^2 - 2x + 4 \\equiv 0 \\pmod{25}$. What is this sum congruent to modulo 25?" },
];
