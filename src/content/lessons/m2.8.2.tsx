import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { PartialSumViz } from "@/components/viz/PartialSumViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.8.2",
  minutes: 70,
  links: {
    requires: ["m2.8.1", "m2.7.3"],
    revisits: ["m0.7.1", "m0.7.2"],
    foreshadows: ["m8.3.1", "m7.2.3"],
  },

  puzzle: (
    <>
      <p>
        Stack identical books at the edge of a table, each overhanging the one below. With the best arrangement, the overhangs
        are 1/2, 1/4, 1/6, 1/8, … of a book length: half the terms of 1 + 1/2 + 1/3 + 1/4 + …. The terms shrink towards zero.
      </p>
      <p>
        With enough books, can the top book lie entirely beyond the table&rsquo;s edge? Can it lie ten book lengths beyond?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An infinite sum means the limit of its partial sums <M>{"S_N = a_1 + \\dots + a_N"}</M>. Below are four series. Some
        partial sums settle on a value; the harmonic series, <M>{"\\sum 1/n"}</M>, keeps creeping upward, slower and slower,
        but never stops. Its terms shrink to zero, yet the sum is infinite.
      </p>
      <PartialSumViz />
    </>
  ),

  theory: (
    <>
      <Definition title="series">
        <p>
          The series <M>{"\\sum_{n=1}^\\infty a_n"}</M> <strong>converges</strong> to S if its partial sums{" "}
          <M>{"S_N = \\sum_{n=1}^N a_n"}</M> converge to S. Otherwise it diverges.
        </p>
      </Definition>

      <Theorem title="geometric series">
        <p>
          <M>{"\\sum_{n=0}^\\infty r^n = \\dfrac{1}{1 - r}"}</M> if <M>{"|r| < 1"}</M>, and the series diverges if{" "}
          <M>{"|r| \\ge 1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"S_N = 1 + r + \\dots + r^N = \\dfrac{1 - r^{N+1}}{1 - r}"}</M> for <M>{"r \\ne 1"}</M>, and{" "}
          <M>{"r^{N+1} \\to 0"}</M> exactly when <M>{"|r| < 1"}</M>.
        </p>
      </Proof>

      <Theorem title="the term test">
        <p>
          If <M>{"\\sum a_n"}</M> converges, then <M>{"a_n \\to 0"}</M>. Equivalently, if the terms do not tend to 0, the series
          diverges. The converse is false.
        </p>
      </Theorem>

      <Example title="the harmonic series diverges">
        <p>Group the terms in blocks that end at powers of 2:</p>
        <MD>{"1 + \\tfrac12 + \\bigl(\\tfrac13 + \\tfrac14\\bigr) + \\bigl(\\tfrac15 + \\dots + \\tfrac18\\bigr) + \\dots \\ \\ge\\ 1 + \\tfrac12 + \\tfrac12 + \\tfrac12 + \\dots"}</MD>
        <p>
          Each block is at least 1/2, so <M>{"S_{2^k} \\ge 1 + k/2"}</M>, which grows without bound. The book stack can
          therefore overhang as far as you like, though ten book lengths needs about 270 million books.
        </p>
      </Example>

      <Theorem title="tests for series with positive terms">
        <ul>
          <li>
            <strong>Comparison</strong>: if <M>{"0 \\le a_n \\le b_n"}</M> and <M>{"\\sum b_n"}</M> converges, so does{" "}
            <M>{"\\sum a_n"}</M>.
          </li>
          <li>
            <strong>Integral test</strong>: if f is positive and decreasing with <M>{"f(n) = a_n"}</M>, then{" "}
            <M>{"\\sum a_n"}</M> and <M>{"\\int_1^\\infty f"}</M> converge or diverge together. So{" "}
            <M>{"\\sum 1/n^p"}</M> converges exactly when <M>{"p > 1"}</M>.
          </li>
          <li>
            <strong>Ratio test</strong>: if <M>{"a_{n+1}/a_n \\to \\rho"}</M>, the series converges when{" "}
            <M>{"\\rho < 1"}</M> and diverges when <M>{"\\rho > 1"}</M>. When <M>{"\\rho = 1"}</M> the test says nothing.
          </li>
        </ul>
      </Theorem>
      <Remark title="why the tests work">
        <p>
          For positive terms the partial sums increase, so they converge exactly when they are bounded: monotone convergence
          again. Comparison bounds them by another series; the integral test bounds them by areas, between the curve and
          rectangles; the ratio test compares with a geometric series.
        </p>
      </Remark>

      <Remark title="a famous sum">
        <p>
          Euler showed in 1734 that <M>{"\\sum 1/n^2 = \\pi^2/6"}</M>, solving the Basel problem. The integral test only proves
          that the sum is finite; finding its value needed a new idea.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "harmonic",
      rung: "check",
      prompt: <p>Does <M>{"\\sum_{n=1}^\\infty 1/n"}</M> converge?</p>,
      answer: { kind: "choice", options: ["No", "Yes, to ln 2", "Yes, to π²/6"], correct: [0] },
    },
    {
      key: "converse",
      rung: "check",
      prompt: <p>If <M>{"a_n \\to 0"}</M>, must <M>{"\\sum a_n"}</M> converge?</p>,
      answer: { kind: "choice", options: ["No; the harmonic series is a counterexample", "Yes, always", "Only if the terms are positive"], correct: [0] },
    },
    {
      key: "geom",
      rung: "apply",
      prompt: <p>Find <M>{"\\sum_{n=0}^\\infty (2/3)^n"}</M>.</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "geom2",
      rung: "apply",
      prompt: <p>Find <M>{"\\sum_{n=2}^\\infty (1/3)^n"}</M>. Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.1667, tolerance: 0.0002 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which of these series converge? Select all that apply.</p>,
      answer: { kind: "choice", options: ["Σ 1/n²", "Σ 1/√n", "Σ n/2ⁿ", "Σ n!/nⁿ"], correct: [0, 2, 3] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`s = sum(1 / n for n in range(1, 10 ** 6 + 1))
print(round(s, 2))`}</Code>
          <p>The harmonic partial sum S₁₀₀₀₀₀₀ grows like ln N plus 0.577. What does it print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 14.39, tolerance: 0.0005 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
s = 0
for k in range(1, 1001):
    s += 1 / k ** 2
print(round(s, 6), round(math.pi ** 2 / 6 - s, 6), round(1 / 1000, 6))`}</Code>
          <p>Partial sum of Σ 1/k² to 1000 terms and its gap to π²/6, compared with the integral-test bound 1/N. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1.643935 0.001 0.001", "1.644934 0.0 0.001", "1.643935 0.0010005 0.001", "1.643935 0.0 0.001"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>terms_needed(target)</C>, which returns the smallest N with 1 + 1/2 + … + 1/N ≥ target.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def terms_needed(target):
    return 1
`,
        solution: `def terms_needed(target):
    s, n = 0.0, 0
    while s < target:
        n += 1
        s += 1 / n
    return n
`,
        tests: [
          { name: "three", code: `assert terms_needed(3) == 11, 'The harmonic sum first reaches 3 at N = 11.'` },
          { name: "ten", code: `assert terms_needed(10) == 12367, 'It first reaches 10 at N = 12367.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>zeta_sum(s, N)</C>, Σₖ₌₁ᴺ 1/kˢ for s &gt; 1, and <C>zeta_tail_corrected(s, N)</C>, the same sum plus an Euler–Maclaurin estimate of the tail: N^(1−s)/(s − 1) − N^(−s)/2 + s·N^(−s−1)/12. Also write <C>ratio_test(a, n)</C>, |a(n + 1)/a(n)| for a term function a, and <C>root_test(a, n)</C>, |a(n)|^(1/n), computed through logarithms so that terms like n!/nⁿ do not overflow (a returns the logarithm of |aₙ|: the argument is <C>log_a</C>).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def zeta_sum(s, N):
    return 1.0

def zeta_tail_corrected(s, N):
    return zeta_sum(s, N)

def ratio_test(log_a, n):
    return 1.0

def root_test(log_a, n):
    return 1.0
`,
        solution: `import math

def zeta_sum(s, N):
    return math.fsum(1 / k ** s for k in range(1, N + 1))

def zeta_tail_corrected(s, N):
    return zeta_sum(s, N) + N ** (1 - s) / (s - 1) - N ** (-s) / 2 + s * N ** (-s - 1) / 12

def ratio_test(log_a, n):
    return math.exp(log_a(n + 1) - log_a(n))

def root_test(log_a, n):
    return math.exp(log_a(n) / n)
`,
        tests: [
          { name: "basel", code: `import math
assert abs(zeta_sum(2, 1000) - 1.6439345666815615) < 1e-14, 'Sum 1/k² to 1000.'` },
          { name: "corrected", code: `import math
assert abs(zeta_tail_corrected(2, 100) - math.pi ** 2 / 6) < 1e-9 and abs(zeta_tail_corrected(4, 20) - math.pi ** 4 / 90) < 1e-9, 'The tail estimate gains many digits.'` },
          { name: "factorial", code: `import math
la = lambda n: math.lgamma(n + 1) - n * math.log(n)
assert abs(ratio_test(la, 10 ** 6) - 1 / math.e) < 1e-6 and abs(root_test(la, 10 ** 6) - 1 / math.e) < 1e-4, 'n!/nⁿ has ratio and root limits 1/e.'` },
          { name: "inconclusive", code: `import math
la = lambda n: -2 * math.log(n)
assert abs(ratio_test(la, 10 ** 6) - 1) < 1e-5, 'For 1/n² the ratio test gives 1: no conclusion.'` },
        ],
      },
    },
    {
      key: "grouping",
      rung: "prove",
      prompt: (
        <p>
          Prove that the harmonic series diverges by showing that <M>{"S_{2^k} \\ge 1 + k/2"}</M> for every k. Then use the
          integral test to show the same, and to show that <M>{"S_N"}</M> grows roughly like <M>{"\\ln N"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Groups the terms from 1/(2^(j−1) + 1) to 1/2^j, a block of 2^(j−1) terms each at least 1/2^j.",
          "Concludes each block sums to at least 1/2, and sums k blocks plus the first term.",
          "Compares with rectangles under 1/x to show S_N ≥ ∫₁^(N+1) dx/x = ln(N + 1), which is unbounded.",
          "Notes the upper bound S_N ≤ 1 + ln N from rectangles above the curve, so S_N is close to ln N.",
        ],
      },
    },
    {
      key: "nhalf",
      rung: "stretch",
      prompt: (
        <p>
          Find <M>{"\\sum_{n=1}^\\infty n/2^n"}</M>. (Hint: write <M>{"S - S/2"}</M> and recognise a geometric series.)
        </p>
      ),
      answer: { kind: "numeric", value: 2 },
    },
  ],

  teachBack:
    "Explain to a friend what it means for an infinite sum to converge, why the harmonic series diverges although its terms shrink to zero, and how comparison with integrals decides series like Σ 1/n².",

  glimpse: (
    <p>
      Next, series whose terms change sign, where a sum can converge only because of cancellation, and where changing the
      order of the terms can change the answer. Real Analysis proves the convergence tests in full, and Probability needs
      convergent series for the expected value of any random variable with infinitely many possible values.
    </p>
  ),
};
