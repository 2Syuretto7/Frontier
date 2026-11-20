import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MeanPathsViz } from "@/components/viz/MeanPathsViz";
import type { LessonContent } from "@/lib/types";

const MEANS = `def running_means(xs):
    out, s = [], 0.0
    for n, x in enumerate(xs, start=1):
        s += x
        out.append(s / n)
    return out

def harmonic_series(xs):
    out, s = [], 0.0
    for k, x in enumerate(xs, start=1):
        s += x / k
        out.append(s)
    return out

def truncate(xs):
    return [x if abs(x) <= k else 0 for k, x in enumerate(xs, start=1)]`;

const MOMENTS = `def fourth_moment(n, m2, m4):
    return n * m4 + 3 * n * (n - 1) * m2 ** 2

def tail_bound(n, eps, m2, m4):
    return fourth_moment(n, m2, m4) / (n * eps) ** 4

def bound_sum(n0, N, eps, m2, m4):
    return sum(tail_bound(n, eps, m2, m4) for n in range(n0, N + 1))`;

export const lesson: LessonContent = {
  id: "m18.6.1",
  minutes: 50,
  links: {
    requires: ["m18.3.3", "m18.5.4"],
    revisits: ["m7.7.1", "m18.3.4"],
    foreshadows: ["m18.6.3"],
  },

  puzzle: (
    <>
      <p>
        The weak law of large numbers says that for each large n the sample mean is probably near μ. That still allows
        every single sequence of coin tosses to stray far from 1/2 again and again, at rarer and rarer times. Does the
        running mean of one infinite sequence actually converge? And what is the least you must assume about the
        distribution: a variance, or merely a mean?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Convergence along a path means that after some time the path never leaves the band again. The probabilities of
        being outside the band at each time must therefore shrink fast enough to add up, or be tied together by a
        martingale. A finite mean is exactly enough: without it, single huge observations keep arriving and drag the
        average around for ever.
      </p>
      <MeanPathsViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="strong law of large numbers">
        <p>
          Let <M>{"X_1, X_2, \\dots"}</M> be i.i.d. with <M>{"\\mathbb E|X_1| < \\infty"}</M> and mean μ. Then
        </p>
        <MD>{"\\bar X_n = \\frac{X_1 + \\cdots + X_n}{n} \\to \\mu \\quad \\text{almost surely.}"}</MD>
        <p>
          Conversely, if <M>{"\\mathbb E|X_1| = \\infty"}</M>, then <M>{"\\bar X_n"}</M> diverges almost surely.
        </p>
      </Theorem>

      <Proof>
        <p>
          <strong>With a fourth moment.</strong> Take μ = 0 and <M>{"\\mathbb E X^4 < \\infty"}</M>. Expanding <M>{"S_n^4"}</M>, every term containing some{" "}
          <M>{"X_i"}</M> exactly once has mean 0, which leaves
        </p>
        <MD>{"\\mathbb E S_n^4 = n\\, \\mathbb E X^4 + 3n(n - 1) (\\mathbb E X^2)^2 \\le C n^2."}</MD>
        <p>
          Markov&apos;s inequality gives <M>{"P(|\\bar X_n| > \\varepsilon) \\le C/(\\varepsilon^4 n^2)"}</M>, which is summable (<C>fourth_moment</C>,{" "}
          <C>tail_bound</C>, <C>bound_sum</C>). By the first Borel-Cantelli lemma (m18.3.3), <M>{"|\\bar X_n| \\le \\varepsilon"}</M> eventually, almost
          surely, and ε = 1/k over all k finishes it.
        </p>
        <Code>{MOMENTS}</Code>
        <p>
          <strong>With a first moment only.</strong> Truncate: <M>{"Y_k = X_k \\mathbb 1[|X_k| \\le k]"}</M> (<C>truncate</C>). Since{" "}
          <M>{"\\sum_k P(|X_1| > k) \\le \\mathbb E|X_1| < \\infty"}</M>, Borel-Cantelli says <M>{"X_k = Y_k"}</M> for all but finitely many k, so it is enough
          to treat the Y. Their means tend to μ by dominated convergence, and a calculation with Fubini gives{" "}
          <M>{"\\sum_k \\mathrm{Var}(Y_k)/k^2 \\le 2\\,\\mathbb E|X_1| < \\infty"}</M>. So <M>{"\\sum_k (Y_k - \\mathbb E Y_k)/k"}</M> is a martingale bounded in{" "}
          <M>{"L^2"}</M>, which converges almost surely (m18.5.4, <C>harmonic_series</C>). Kronecker&apos;s lemma below turns convergence of{" "}
          <M>{"\\sum x_k/k"}</M> into <M>{"\\frac1n \\sum_{k \\le n} x_k \\to 0"}</M> (<C>running_means</C>).
        </p>
        <Code>{MEANS}</Code>
        <p>
          <strong>Converse.</strong> If <M>{"\\mathbb E|X_1| = \\infty"}</M> then <M>{"\\sum_n P(|X_n| > n) = \\infty"}</M>, and the events are independent, so the
          second Borel-Cantelli lemma gives <M>{"|X_n| > n"}</M> infinitely often. But if <M>{"\\bar X_n"}</M> converged, <M>{"X_n/n = \\bar X_n - \\frac{n-1}{n}\\bar X_{n-1} \\to 0"}</M>.
        </p>
      </Proof>

      <Theorem title="Kronecker's lemma">
        <p>
          If <M>{"\\sum_k x_k / k"}</M> converges, then <M>{"\\frac1n \\sum_{k=1}^{n} x_k \\to 0"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"s_k = \\sum_{j \\le k} x_j / j"}</M>, <M>{"s_0 = 0"}</M>, with limit s. Summation by parts gives{" "}
          <M>{"\\sum_{k \\le n} x_k = \\sum_{k \\le n} k(s_k - s_{k-1}) = n s_n - \\sum_{k < n} s_k"}</M>, so{" "}
          <M>{"\\frac1n \\sum_{k \\le n} x_k = s_n - \\frac1n \\sum_{k < n} s_k \\to s - s = 0"}</M>, since Cesàro averages of a convergent sequence share its limit.
        </p>
      </Proof>

      <Example title="Cauchy samples">
        <p>
          The standard Cauchy law has density <M>{"1/(\\pi(1 + x^2))"}</M> and no mean. Its characteristic function{" "}
          <M>{"e^{-|t|}"}</M> (m18.6.2) shows that <M>{"\\bar X_n"}</M> is again standard Cauchy for every n. The running mean has the same spread
          at time 10 000 as at time 1, as the figure shows.
        </p>
      </Example>

      <Remark title="what the strong law buys">
        <p>
          Monte Carlo estimates converge along the one run you actually perform, not just on average over hypothetical runs.
          Applied to indicators <M>{"\\mathbb 1[X_k \\le x]"}</M> at countably many x, it gives the Glivenko-Cantelli theorem: the empirical
          distribution function converges to F uniformly, almost surely. And a gambler betting a fixed fraction of wealth grows
          at the almost sure rate <M>{"\\mathbb E \\log(\\text{factor})"}</M>, the Kelly criterion, as in the product martingale of m18.5.4.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "fourth",
      rung: "check",
      prompt: <p>Sₙ is a sum of n independent fair ±1 signs. Compute E[S₁₀⁴].</p>,
      answer: { kind: "numeric", value: 280, tolerance: 0.0001 },
    },
    {
      key: "cauchy",
      rung: "check",
      prompt: <p>X̄₁₀₀ is the mean of 100 independent standard Cauchy variables. Compute P(|X̄₁₀₀| &gt; √3). Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.3333, tolerance: 0.0001 },
    },
    {
      key: "weak",
      rung: "apply",
      prompt: <p>What does the strong law give that the weak law does not?</p>,
      answer: {
        kind: "choice",
        options: [
          "Almost every sequence eventually stays within ε of μ, for every ε > 0",
          "P(|X̄ₙ − μ| > ε) → 0 for every ε > 0",
          "The error of X̄ₙ is roughly normal with spread σ/√n",
          "X̄ₙ = μ for all large n",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def running_means(xs):
    out, s = [], 0.0
    for n, x in enumerate(xs, start=1):
        s += x
        out.append(s / n)
    return out

def harmonic_series(xs):
    out, s = [], 0.0
    for k, x in enumerate(xs, start=1):
        s += x / k
        out.append(s)
    return out

def truncate(xs):
    return [x if abs(x) <= k else 0 for k, x in enumerate(xs, start=1)]

xs = [2, 0, 4, -2]; print(running_means(xs), [round(v, 4) for v in harmonic_series(xs)], truncate(xs), truncate([5, -1, 3, 9, 4]))
print(running_means([1] * 3 + [5]), [round(v, 4) for v in harmonic_series([1, 2, 3])], truncate([0.5, -3, 2.5]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.0, 1.0, 2.0, 1.0] [2.0, 2.0, 3.3333, 2.8333] [0, 0, 0, -2] [0, -1, 3, 0, 4]\n[1.0, 1.0, 1.0, 2.0] [1.0, 2.0, 3.0] [0.5, 0, 2.5]",
          "[2.0, 1.0, 2.0, 1.0] [2.0, 2.0, 3.3333, 2.8333] [2, 0, 4, -2] [5, -1, 3, 9, 4]\n[1.0, 1.0, 1.0, 2.0] [1.0, 2.0, 3.0] [0.5, -3, 2.5]",
          "[2.0, 1.0, 2.0, 1.0] [2.0, 2.0, 3.3333, 2.8333] [0, 0, 0, -2] [0, -1, 3, 0, 4]\n[1.0, 1.0, 1.0, 2.0] [1.0, 1.0, 1.0] [0.5, 0, 0]",
          "[2.0, 2.0, 6.0, 4.0] [2.0, 0.0, 1.3333, -0.5] [0, 0, 0, -2] [0, -1, 3, 0, 4]\n[1.0, 1.0, 1.0, 1.0] [1.0, 2.0, 3.0] [0.5, 0, 2.5]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def fourth_moment(n, m2, m4):
    return n * m4 + 3 * n * (n - 1) * m2 ** 2

def tail_bound(n, eps, m2, m4):
    return fourth_moment(n, m2, m4) / (n * eps) ** 4

def bound_sum(n0, N, eps, m2, m4):
    return sum(tail_bound(n, eps, m2, m4) for n in range(n0, N + 1))

print(fourth_moment(1, 1, 1), fourth_moment(2, 1, 1), fourth_moment(3, 2, 10), tail_bound(2, 1, 1, 1))
print(tail_bound(10, 0.5, 1, 1), round(bound_sum(1, 3, 1, 1, 1), 4), round(tail_bound(100, 0.1, 1, 3), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1 8 102 0.5\n0.448 1.7593 3.0",
          "1 6 102 0.5\n0.448 1.7593 3.0",
          "1 8 90 0.5\n0.448 1.7593 0.3",
          "1 8 102 0.125\n4.48 1.5 3.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>running_means(xs)</C>, <C>harmonic_series(xs)</C> (the partial sums of x_k/k with k from 1), and{" "}
          <C>truncate(xs)</C>, which keeps x_k when |x_k| ≤ k and replaces it by 0 otherwise.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def running_means(xs):
    return []

def harmonic_series(xs):
    return []

def truncate(xs):
    return xs
`,
        solution: MEANS,
        tests: [
          { name: "means", code: `assert running_means([3, 1, 2]) == [3.0, 2.0, 2.0] and harmonic_series([2, 2]) == [2.0, 3.0]` },
          { name: "truncate", code: `assert truncate([1, 5, -2, 4]) == [1, 0, -2, 4] and truncate([-1.5, 2]) == [0, 2]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For i.i.d. mean-zero steps with second and fourth moments m2 and m4, write <C>fourth_moment(n, m2, m4)</C> = E Sₙ⁴,{" "}
          <C>tail_bound(n, eps, m2, m4)</C>, the Markov bound on P(|Sₙ/n| &gt; eps) from it, and <C>bound_sum(n0, N, eps, m2, m4)</C>{" "}
          summing the bounds for n0 ≤ n ≤ N.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def fourth_moment(n, m2, m4):
    return 0

def tail_bound(n, eps, m2, m4):
    return 0.0

def bound_sum(n0, N, eps, m2, m4):
    return 0.0
`,
        solution: MOMENTS,
        tests: [
          { name: "moment", code: `assert fourth_moment(4, 1, 1) == 40 and abs(tail_bound(4, 0.5, 1, 1) - 2.5) < 1e-12` },
          { name: "sum", code: `assert abs(bound_sum(2, 3, 1, 1, 1) - 0.7592592593) < 1e-9 and bound_sum(5, 4, 1, 1, 1) == 0` },
        ],
      },
    },
    {
      key: "geo",
      rung: "stretch",
      prompt: (
        <p>
          <M>{"X_k"}</M> are independent and uniform on [1, 2]. Find the almost sure limit of the geometric mean{" "}
          <M>{"(X_1 X_2 \\cdots X_n)^{1/n}"}</M>. Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.4715, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The strong law says <M>{"\\bar X_n - \\mu \\to 0"}</M>; the central limit theorem says how fast and with what shape. The cleanest route to
        it goes through characteristic functions, which turn sums of independent variables into products.
      </p>
    </>
  ),
};
