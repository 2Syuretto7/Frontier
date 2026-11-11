import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { RearrangeViz } from "@/components/viz/RearrangeViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.8.3",
  minutes: 60,
  links: {
    requires: ["m2.8.2"],
    foreshadows: ["m8.3.2", "m7.2.3", "m11.1.2"],
  },

  puzzle: (
    <>
      <p>The alternating harmonic series converges to ln 2:</p>
      <MD>{"1 - \\tfrac12 + \\tfrac13 - \\tfrac14 + \\tfrac15 - \\dots = \\ln 2 \\approx 0.693."}</MD>
      <p>Now write the same terms in a different order: one positive term, then two negative ones.</p>
      <MD>{"1 - \\tfrac12 - \\tfrac14 + \\tfrac13 - \\tfrac16 - \\tfrac18 + \\tfrac15 - \\tfrac1{10} - \\tfrac1{12} + \\dots"}</MD>
      <p>
        Every term appears exactly once. Addition does not care about order, so surely the sum is still ln 2? It is not: it
        is half of ln 2. What has gone wrong?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Finite sums can be reordered freely. Infinite ones are limits, and a limit depends on the order in which terms
        arrive. In the alternating harmonic series, the positive terms alone add up to infinity, and so do the negative ones.
        The finite answer, ln 2, comes from a delicate balance between two infinities, and reordering can tip it any way you
        like. Choose a target below and watch the same terms, reordered, close in on it.
      </p>
      <RearrangeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="absolute and conditional convergence">
        <p>
          <M>{"\\sum a_n"}</M> <strong>converges absolutely</strong> if <M>{"\\sum |a_n|"}</M> converges. It{" "}
          <strong>converges conditionally</strong> if it converges but not absolutely.
        </p>
      </Definition>

      <Theorem title="absolute convergence implies convergence">
        <p>If <M>{"\\sum |a_n|"}</M> converges, so does <M>{"\\sum a_n"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          <M>{"0 \\le a_n + |a_n| \\le 2|a_n|"}</M>, so <M>{"\\sum (a_n + |a_n|)"}</M> converges by comparison. Then{" "}
          <M>{"\\sum a_n = \\sum (a_n + |a_n|) - \\sum |a_n|"}</M> is a difference of two convergent series.
        </p>
      </Proof>

      <Theorem title="the alternating series test">
        <p>
          If <M>{"b_n"}</M> decreases to 0, then <M>{"\\sum (-1)^{n+1} b_n"}</M> converges, and the error after N terms is at
          most the next term: <M>{"|S - S_N| \\le b_{N+1}"}</M>.
        </p>
      </Theorem>
      <Remark title="why">
        <p>
          The partial sums step down, up, down, by ever smaller amounts. The even-numbered ones increase, the odd-numbered ones
          decrease, and each odd one lies above each even one. Both halves converge by monotone convergence, and to the same
          limit, since their difference is a term that tends to 0. The limit is always trapped between consecutive partial
          sums, which gives the error bound.
        </p>
      </Remark>

      <Theorem title="rearrangements (Riemann, Dirichlet)">
        <ul>
          <li>Every rearrangement of an absolutely convergent series converges, to the same sum.</li>
          <li>
            A conditionally convergent series can be rearranged to converge to any real number you choose, or to diverge.
          </li>
        </ul>
      </Theorem>
      <Remark title="the recipe behind the second part">
        <p>
          For a conditionally convergent series, the positive terms and the negative terms each sum to infinity, while the
          terms themselves tend to 0. To reach a target T, add positive terms until you pass T, then negative terms until you
          fall below it, and repeat. You never run out, and the overshoots shrink to 0. This is what the visualisation does.
        </p>
      </Remark>

      <Example title="why this matters in practice">
        <p>
          The expected value of a random variable with infinitely many values is defined as a series, and the definition
          requires absolute convergence, so that the answer does not depend on how the values are listed. And on a computer,
          even finite sums are not order-independent: floating-point addition rounds at each step, so summing a million
          numbers in a different order, as parallel hardware does, gives a slightly different total.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "kind",
      rung: "check",
      prompt: <p>How does <M>{"\\sum (-1)^{n+1}/n"}</M> converge?</p>,
      answer: { kind: "choice", options: ["Conditionally", "Absolutely", "It diverges"], correct: [0] },
    },
    {
      key: "rearr",
      rung: "check",
      prompt: <p>If a series converges absolutely, what happens when its terms are rearranged?</p>,
      answer: { kind: "choice", options: ["It still converges, to the same sum", "It may converge to a different sum", "It may diverge"], correct: [0] },
    },
    {
      key: "terms",
      rung: "apply",
      prompt: (
        <p>
          Using the alternating series error bound, how many terms of <M>{"1 - \\tfrac12 + \\tfrac13 - \\dots"}</M> guarantee an
          error of at most 0.001 in the estimate of ln 2?
        </p>
      ),
      answer: { kind: "numeric", value: 999 },
    },
    {
      key: "altgeom",
      rung: "apply",
      prompt: <p>Find <M>{"\\sum_{n=0}^\\infty (-1)^n/2^n"}</M>. Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.6667, tolerance: 0.0002 },
    },
    {
      key: "abs",
      rung: "apply",
      prompt: <p>Which of these converge absolutely? Select all that apply.</p>,
      answer: { kind: "choice", options: ["Σ (−1)ⁿ/n²", "Σ (−1)ⁿ/√n", "Σ sin(n)/n²", "Σ (−1)ⁿ/n"], correct: [0, 2] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
s = sum((-1) ** (n + 1) / n for n in range(1, 100001))
print(round(s, 4), round(math.log(2), 4))`}</Code>
          <p>The alternating harmonic series converges conditionally. To what?</p>
        </>
      ),
      answer: { kind: "numeric", value: 0.6931, tolerance: 0.0002 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>rearranged(target, n_terms)</C>, which adds terms of the alternating harmonic series in a new order to steer towards target: take unused positive terms 1, 1/3, 1/5, … while the sum is at most target, otherwise unused negative terms −1/2, −1/4, …. Return the sum after n_terms terms.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def rearranged(target, n_terms):
    return 0.0
`,
        solution: `def rearranged(target, n_terms):
    s, p, q = 0.0, 1, 2
    for _ in range(n_terms):
        if s <= target:
            s += 1 / p
            p += 2
        else:
            s -= 1 / q
            q += 2
    return s
`,
        tests: [
          { name: "one and a half", code: `assert abs(rearranged(1.5, 200000) - 1.5) < 1e-3, 'The same terms can be rearranged to sum to 1.5.'` },
          { name: "zero", code: `assert abs(rearranged(0.0, 200000)) < 1e-3, 'Or to 0.'` },
        ],
      },
    },
    {
      key: "proof",
      rung: "prove",
      prompt: (
        <p>
          Show that the positive terms of <M>{"1 - \\tfrac12 + \\tfrac13 - \\dots"}</M> have an infinite sum, and so do the
          negative terms. Explain why this is exactly what allows the series to be rearranged to sum to 10.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Compares 1 + 1/3 + 1/5 + … with ½(1/1 + 1/2 + 1/3 + …), or with ∫ dx/(2x − 1), to show it diverges.",
          "Notes the negative terms are ½ of the harmonic series, which diverges.",
          "Describes adding positive terms until the partial sum exceeds 10, then negative ones until below 10, and repeating; this never stops because both supplies are infinite.",
          "Notes the overshoots are at most the size of the last term used, which tends to 0, so the partial sums converge to 10.",
        ],
      },
    },
    {
      key: "half",
      rung: "stretch",
      prompt: (
        <p>
          The rearrangement in the puzzle groups the terms as <M>{"(1 - \\tfrac12) - \\tfrac14 + (\\tfrac13 - \\tfrac16) - \\tfrac18 + \\dots"}</M>.
          What is its sum? Give four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.3466, tolerance: 0.0002 },
    },
  ],

  teachBack:
    "Explain to a friend the difference between absolute and conditional convergence, and why reordering the terms of 1 − 1/2 + 1/3 − … can change its sum.",

  glimpse: (
    <p>
      Next, power series: series whose terms are powers of x, which define functions such as eˣ and sin x by infinite
      polynomials. Real Analysis proves the rearrangement theorem, Probability requires absolute convergence for expected
      values, and Numerical Linear Algebra and Scientific Computing studies how the order of a floating-point sum changes its
      error.
    </p>
  ),
};
