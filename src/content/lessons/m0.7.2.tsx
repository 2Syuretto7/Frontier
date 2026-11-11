import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark } from "@/components/lesson/Blocks";
import { GnomonViz } from "@/components/viz/GnomonViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.7.2",
  minutes: 60,
  links: {
    revisits: ["m0.2.1"],
    foreshadows: ["m1.5.1", "m2.6.1"],
  },

  puzzle: (
    <>
      <p>Add up the first few odd numbers:</p>
      <MD>{"1, \\quad 1 + 3, \\quad 1 + 3 + 5, \\quad 1 + 3 + 5 + 7, \\quad \\ldots"}</MD>
      <p>
        What do you notice about the answers? Will it always happen? And how could you write &ldquo;the sum of the first
        thousand odd numbers&rdquo; without writing a thousand numbers?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The sums are 1, 4, 9, 16: the square numbers. The picture explains why: each odd number is an L-shaped layer that
        wraps round a square to make the next square up. The Greeks called such an L a <em>gnomon</em>, after the upright
        of a sundial.
      </p>
      <p>
        For the writing problem, mathematicians use a capital Greek sigma, <M>{"\\Sigma"}</M>, for &ldquo;sum&rdquo;. The
        sum of the first thousand odd numbers is <M>{"\\sum_{k=1}^{1000} (2k - 1)"}</M>: let <M>k</M> run from 1 to 1000, work
        out <M>{"2k - 1"}</M> each time, and add.
      </p>
      <GnomonViz />
    </>
  ),

  theory: (
    <>
      <Definition title="sigma notation">
        <p>For whole numbers <M>{"m \\le n"}</M> and an expression <M>{"a_k"}</M> depending on <M>k</M>,</p>
        <MD>{"\\sum_{k=m}^{n} a_k = a_m + a_{m+1} + \\cdots + a_n."}</MD>
        <p>
          The letter <M>k</M> is the <strong>index</strong>. It is a placeholder, like the <M>x</M> in a function: any other
          letter not already in use would do.
        </p>
      </Definition>

      <Proposition title="rules for sums">
        <p>For numbers <M>c</M> and sequences <M>{"a_k"}</M>, <M>{"b_k"}</M>:</p>
        <MD>{"\\sum_{k=1}^{n} (a_k + b_k) = \\sum_{k=1}^{n} a_k + \\sum_{k=1}^{n} b_k, \\qquad \\sum_{k=1}^{n} c\\,a_k = c\\sum_{k=1}^{n} a_k, \\qquad \\sum_{k=1}^{n} c = nc."}</MD>
      </Proposition>
      <Proof>
        <p>
          Write each side out in full. The first rule rearranges the terms, the second takes out a common factor, and the
          third adds <M>n</M> copies of <M>c</M>. Nothing more than the laws of arithmetic from the first chapter.
        </p>
      </Proof>

      <Proposition title="standard sums">
        <MD>{"\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}, \\qquad \\sum_{k=1}^{n} (2k - 1) = n^2, \\qquad \\sum_{k=1}^{n} k^2 = \\frac{n(n+1)(2n+1)}{6}."}</MD>
      </Proposition>
      <Proof>
        <p>
          The first is the arithmetic sum of the last lesson. The second follows from the rules:{" "}
          <M>{"\\sum (2k - 1) = 2\\sum k - \\sum 1 = n(n+1) - n = n^2"}</M>. The third is harder to discover; checking it for{" "}
          <M>{"n = 1, 2, 3"}</M> gives 1, 5, 14, which match, but checking is not proving. The next lesson gives a method,
          induction, that proves it for every <M>n</M>.
        </p>
      </Proof>

      <Definition title="telescoping sums">
        <p>If each term is a difference <M>{"a_k = b_{k+1} - b_k"}</M>, nearly everything cancels:</p>
        <MD>{"\\sum_{k=1}^{n} (b_{k+1} - b_k) = (b_2 - b_1) + (b_3 - b_2) + \\cdots + (b_{n+1} - b_n) = b_{n+1} - b_1."}</MD>
        <p>The sum collapses like a telescope.</p>
      </Definition>

      <Example title="a telescope">
        <p>
          Since <M>{"\\tfrac{1}{k(k+1)} = \\tfrac1k - \\tfrac{1}{k+1}"}</M>,
        </p>
        <MD>{"\\sum_{k=1}^{n} \\frac{1}{k(k+1)} = \\left(1 - \\tfrac12\\right) + \\left(\\tfrac12 - \\tfrac13\\right) + \\cdots + \\left(\\tfrac1n - \\tfrac{1}{n+1}\\right) = 1 - \\frac{1}{n+1}."}</MD>
      </Example>

      <Remark title="Aryabhata’s sums">
        <p>
          The formulas for the sum of the squares and the sum of the cubes appear in the <em>Āryabhaṭīya</em>, written by
          Aryabhata in 499 CE, alongside a rule for the number of balls in a pile stacked as a triangular pyramid. The sigma itself
          is much younger: Leonhard Euler introduced it in 1755. Good notation is an invention too, and often an underrated
          one.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "squares",
      rung: "check",
      prompt: <p>Evaluate <M>{"\\sum_{k=1}^{4} k^2"}</M>.</p>,
      answer: { kind: "numeric", value: 30 },
    },
    {
      key: "constant",
      rung: "check",
      prompt: <p>Evaluate <M>{"\\sum_{k=1}^{10} 5"}</M>.</p>,
      answer: { kind: "numeric", value: 50 },
    },
    {
      key: "linear",
      rung: "apply",
      prompt: <p>Evaluate <M>{"\\sum_{k=1}^{20} (2k + 1)"}</M>, using the rules rather than adding twenty numbers.</p>,
      answer: { kind: "numeric", value: 440 },
    },
    {
      key: "telescope",
      rung: "apply",
      prompt: <p>Evaluate <M>{"\\sum_{k=1}^{99} \\frac{1}{k(k+1)}"}</M>.</p>,
      answer: { kind: "numeric", value: 0.99 },
    },
    {
      key: "squares-ten",
      rung: "apply",
      prompt: <p>Use the formula to find <M>{"1^2 + 2^2 + \\cdots + 10^2"}</M>.</p>,
      answer: { kind: "numeric", value: 385 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`print(sum(k * k for k in range(1, 11)), sum(2 * k - 1 for k in range(1, 8)))`}</Code>
          <p>Two sums in sigma notation. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["385 49", "385 64", "55 49", "100 49"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`s1 = sum(k * k for k in range(1, 11))
s2 = sum(range(1, 11)) ** 2
s3 = sum(1 / (k * (k + 1)) for k in range(1, 100))
print(s1, s2, round(s3, 2))`}</Code>
          <p>Three sums: of squares, the square of a sum, and a telescoping sum. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["385 3025 0.99", "385 385 0.99", "3025 385 0.99", "385 3025 1.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>sigma(f, lo, hi)</C>, which computes the sum of f(k) for k from lo to hi inclusive, and returns 0 when hi &lt; lo (the empty sum).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def sigma(f, lo, hi):
    return sum(f(k) for k in range(lo, hi))
`,
        solution: `def sigma(f, lo, hi):
    return sum(f(k) for k in range(lo, hi + 1))
`,
        tests: [
          { name: "inclusive", code: `assert sigma(lambda k: k, 1, 100) == 5050 and sigma(lambda k: k * k, 1, 10) == 385, 'Both limits are included.'` },
          { name: "empty", code: `assert sigma(lambda k: k, 5, 4) == 0, 'An empty sum is 0.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>power_sum(p, n)</C>, the exact value of 1ᵖ + 2ᵖ + … + nᵖ for p ≥ 0 and n up to 10¹², without looping to n. Use the recurrence from the binomial theorem: (n+1)^(p+1) − 1 = Σⱼ₌₀ᵖ C(p+1, j)·S_j(n), so S_p(n) = ((n+1)^(p+1) − 1 − Σⱼ&lt;ₚ C(p+1, j)·S_j(n)) / (p + 1). Work in integers (the division is exact).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def power_sum(p, n):
    return n ** (p + 1) // (p + 1)
`,
        solution: `from math import comb

def power_sum(p, n):
    S = []
    for q in range(p + 1):
        t = (n + 1) ** (q + 1) - 1 - sum(comb(q + 1, j) * S[j] for j in range(q))
        S.append(t // (q + 1))
    return S[p]
`,
        tests: [
          { name: "known", code: `assert power_sum(0, 10) == 10 and power_sum(1, 10) == 55 and power_sum(2, 10) == 385 and power_sum(3, 10) == 3025, 'Sums of 1, k, k², k³ up to 10.'` },
          { name: "brute", code: `assert all(power_sum(p, n) == sum(k ** p for k in range(1, n + 1)) for p in range(8) for n in range(0, 30)), 'Check against direct sums.'` },
          { name: "huge", code: `n = 10 ** 12
assert power_sum(1, n) == n * (n + 1) // 2 and power_sum(3, n) == (n * (n + 1) // 2) ** 2, 'The sum of cubes is the square of the sum.'` },
          { name: "fast", code: `import time
t = time.time()
power_sum(10, 10 ** 15)
assert time.time() - t < 1, 'Do not loop to n.'` },
        ],
      },
    },
    {
      key: "odd-proof",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"\\sum_{k=1}^{n} (2k - 1) = n^2"}</M> using the rules for sums and the formula for{" "}
          <M>{"\\sum_{k=1}^{n} k"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Splits the sum as 2 times the sum of k, minus the sum of 1.",
          "Substitutes n(n + 1)/2 for the sum of k.",
          "Uses the sum of n ones being n.",
          "Simplifies n(n + 1) − n to n².",
        ],
      },
    },
    {
      key: "cubes",
      rung: "stretch",
      prompt: (
        <p>
          Work out <M>{"1^3"}</M>, <M>{"1^3 + 2^3"}</M> and <M>{"1^3 + 2^3 + 3^3"}</M>, and compare them with the squares of{" "}
          <M>{"1"}</M>, <M>{"1 + 2"}</M> and <M>{"1 + 2 + 3"}</M>. Guess the pattern and use it to find{" "}
          <M>{"\\sum_{k=1}^{10} k^3"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 3025 },
    },
  ],

  teachBack:
    "Explain to a friend why the first n odd numbers add up to n squared, using the picture of L-shaped layers.",

  glimpse: (
    <p>
      Next, induction, the method for proving a formula like the sum of squares for every <M>n</M> at once. In Calculus, the
      area under a curve is first approximated by a sum of thin rectangles, written in exactly this notation, and the sum of
      squares is what lets you compute the area under a parabola by hand.
    </p>
  ),
};
