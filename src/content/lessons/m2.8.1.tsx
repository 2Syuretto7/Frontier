import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { SequenceViz } from "@/components/viz/SequenceViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.8.1",
  minutes: 60,
  links: {
    requires: ["m2.2.2", "m2.1.2"],
    revisits: ["m0.7.1"],
    foreshadows: ["m8.2.2", "m8.2.4"],
  },

  puzzle: (
    <>
      <p>
        Put ₹1 in a bank that pays 100% interest a year. Compounded once, you have ₹2 after a year. Compounded twice, at 50%
        each half-year, <M>{"(1.5)^2 = 2.25"}</M>. Monthly, <M>{"(1 + 1/12)^{12} \\approx 2.613"}</M>. Daily, about 2.7146.
      </p>
      <p>
        The amounts keep growing as you compound more often. Do they grow without bound, or close in on some fixed amount? And
        what would it even mean to say they close in, when the sequence never stops?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A limit of a function asked what f(x) does as x approaches a point. A sequence <M>{"a_1, a_2, a_3, \\ldots"}</M> has
        only one direction to go, towards infinity. Its limit is L if, however narrow a band you draw round L, the terms
        eventually enter the band and never leave. Choose a sequence and a band width below, and see where the terms settle in.
      </p>
      <SequenceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="convergence">
        <p>
          A sequence <M>{"(a_n)"}</M> <strong>converges</strong> to L, written <M>{"a_n \\to L"}</M> or{" "}
          <M>{"\\lim_{n \\to \\infty} a_n = L"}</M>, if for every <M>{"\\varepsilon > 0"}</M> there is an N such that
        </p>
        <MD>{"|a_n - L| < \\varepsilon \\quad \\text{for every } n \\ge N."}</MD>
        <p>A sequence that converges to no L <strong>diverges</strong>.</p>
      </Definition>

      <Example title="playing the game">
        <p>
          For <M>{"a_n = 1/n"}</M> and a given ε, choose any whole number <M>{"N > 1/\\varepsilon"}</M>; then for{" "}
          <M>{"n \\ge N"}</M>, <M>{"|1/n - 0| \\le 1/N < \\varepsilon"}</M>. The sequence <M>{"(-1)^n"}</M> diverges: with{" "}
          <M>{"\\varepsilon = 1"}</M>, no band of width 2 can contain both 1 and <M>{"-1"}</M>, yet both values keep coming.
        </p>
      </Example>

      <Theorem title="basic facts">
        <ol>
          <li>A sequence has at most one limit.</li>
          <li>A convergent sequence is bounded.</li>
          <li>The limit laws for functions hold for sequences: sums, products and quotients (with non-zero limit below).</li>
          <li>(Squeeze) If <M>{"a_n \\le b_n \\le c_n"}</M> and <M>{"a_n, c_n \\to L"}</M>, then <M>{"b_n \\to L"}</M>.</li>
        </ol>
      </Theorem>

      <Theorem title="monotone convergence">
        <p>A sequence that is increasing and bounded above converges, to the supremum of its terms.</p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"L = \\sup_n a_n"}</M>, which exists by completeness. Given ε, <M>{"L - \\varepsilon"}</M> is not an upper
          bound, so some <M>{"a_N > L - \\varepsilon"}</M>. Since the sequence increases, every later term lies between{" "}
          <M>{"a_N"}</M> and L, so within ε of L.
        </p>
      </Proof>

      <Example title="the number e">
        <p>
          The compound-interest sequence <M>{"(1 + 1/n)^n"}</M> is increasing and bounded above by 3 (both facts follow from
          the binomial theorem), so it converges. Its limit is e = 2.71828…, the same e whose exponential is its own
          derivative. More generally <M>{"(1 + x/n)^n \\to e^x"}</M>.
        </p>
      </Example>

      <Remark title="recursive sequences">
        <p>
          Many algorithms produce a sequence by repeating a step, <M>{"a_{n+1} = g(a_n)"}</M>, as Newton&rsquo;s method does.
          If such a sequence converges to L and g is continuous, taking limits of both sides gives <M>{"L = g(L)"}</M>: the
          limit is a fixed point. Proving that the sequence converges at all is the harder part, and monotone convergence is
          often the tool.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "alt",
      rung: "check",
      prompt: <p>Does the sequence <M>{"(-1)^n"}</M> converge?</p>,
      answer: { kind: "choice", options: ["No", "Yes, to 0", "Yes, to 1"], correct: [0] },
    },
    {
      key: "mono",
      rung: "check",
      prompt: <p>Which property of the real numbers guarantees that a bounded increasing sequence converges?</p>,
      answer: { kind: "choice", options: ["Completeness", "Trichotomy", "Commutativity", "The Archimedean property alone"], correct: [0] },
    },
    {
      key: "N",
      rung: "apply",
      prompt: (
        <p>
          For <M>{"a_n = 1/n"}</M>, what is the smallest N such that <M>{"|a_n| < 0.01"}</M> for every <M>{"n \\ge N"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 101 },
    },
    {
      key: "ratio",
      rung: "apply",
      prompt: <p>Find <M>{"\\lim_{n \\to \\infty} \\dfrac{3n^2 + n}{n^2 + 5}"}</M>.</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "fixed",
      rung: "apply",
      prompt: (
        <p>
          The sequence <M>{"a_1 = \\sqrt2"}</M>, <M>{"a_{n+1} = \\sqrt{2 + a_n}"}</M> is increasing and bounded above by 2.
          What is its limit?
        </p>
      ),
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "unique",
      rung: "prove",
      prompt: <p>Prove that a sequence cannot converge to two different limits.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Supposes a_n → L and a_n → M with L ≠ M, and takes ε = |L − M|/2.",
          "Finds N₁ and N₂ from the two definitions and takes n ≥ max(N₁, N₂).",
          "Uses the triangle inequality: |L − M| ≤ |L − a_n| + |a_n − M| < 2ε = |L − M|.",
          "Concludes this is a contradiction, so L = M.",
        ],
      },
    },
    {
      key: "e2",
      rung: "stretch",
      prompt: <p>Find <M>{"\\lim_{n \\to \\infty} (1 + 2/n)^n"}</M>. Give three decimal places.</p>,
      answer: { kind: "numeric", value: 7.389, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what it means for a sequence to converge, using the band of width ε, and why an increasing sequence that is bounded above must converge.",

  glimpse: (
    <p>
      Next, series: adding up infinitely many terms by taking the limit of the partial sums. Real Analysis proves the
      monotone convergence theorem&rsquo;s equivalence with completeness, and meets Cauchy sequences, which converge without
      anyone needing to know the limit in advance.
    </p>
  ),
};
