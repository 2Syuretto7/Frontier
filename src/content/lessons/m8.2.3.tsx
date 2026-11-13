import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PeakSubseqViz } from "@/components/viz/PeakSubseqViz";
import type { LessonContent } from "@/lib/types";

const PEAKS = `import math

def peaks(xs):
    out, best = [], -math.inf
    for i in range(len(xs) - 1, -1, -1):
        if xs[i] >= best:
            out.append(i)
            best = xs[i]
    return out[::-1]

def peak_values(xs):
    return [xs[i] for i in peaks(xs)]`;

const BISECT = `def subseq_in(xs, a, b):
    return [i for i, x in enumerate(xs) if a <= x <= b]

def bw_bisect(xs, a, b, steps):
    for _ in range(steps):
        m = (a + b) / 2
        if len(subseq_in(xs, a, m)) >= len(subseq_in(xs, m, b)):
            b = m
        else:
            a = m
    return a, b`;

export const lesson: LessonContent = {
  id: "m8.2.3",
  minutes: 55,
  links: {
    requires: ["m8.2.2"],
    revisits: ["m8.1.2", "m2.3.3"],
    foreshadows: ["m8.2.5", "m8.4.2", "m8.5.2"],
  },

  puzzle: (
    <>
      <p>
        The sequence sin 1, sin 2, sin 3, … never settles down. Yet it is trapped in [−1, 1]. Must some part of it, a
        subsequence, converge? This is the question behind every existence proof in analysis: why does a continuous function
        on [a, b] attain its maximum, and why does a bounded sequence of approximate solutions contain a convergent one?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Infinitely many points in a bounded interval must pile up somewhere. Halve the interval: one half still holds
        infinitely many terms. Keep halving and you trap a point that terms keep returning to. Alternatively, look for
        &quot;peaks&quot;, terms higher than everything after them: they always give a monotone subsequence, and bounded
        monotone sequences converge.
      </p>
      <PeakSubseqViz />
    </>
  ),

  theory: (
    <>
      <Definition title="subsequence">
        <p>
          Given (aₙ) and indices <M>{"n_1 < n_2 < n_3 < \\cdots"}</M>, the sequence <M>{"(a_{n_k})_{k \\ge 1}"}</M> is a
          subsequence. A number L is a subsequential limit of (aₙ) if some subsequence converges to L.
        </p>
      </Definition>
      <Theorem title="subsequences inherit limits">
        <p>If aₙ → a, every subsequence converges to a.</p>
      </Theorem>
      <Proof>
        <p>
          Since <M>{"n_k \\ge k"}</M> (by induction), if <M>{"|a_n - a| < \\varepsilon"}</M> for n ≥ N, then{" "}
          <M>{"|a_{n_k} - a| < \\varepsilon"}</M> for k ≥ N.
        </p>
      </Proof>
      <p>
        Contrapositively, two subsequences with different limits prove divergence: <M>{"(-1)^n(1 + 1/n)"}</M> has even terms
        tending to 1 and odd terms to −1.
      </p>

      <Theorem title="monotone subsequence theorem">
        <p>Every sequence of reals has a monotone subsequence.</p>
      </Theorem>
      <Proof>
        <p>
          Call m a peak if <M>{"a_m \\ge a_n"}</M> for every n &gt; m. If there are infinitely many peaks{" "}
          <M>{"m_1 < m_2 < \\cdots"}</M>, then <M>{"a_{m_1} \\ge a_{m_2} \\ge \\cdots"}</M> is decreasing. Otherwise, let{" "}
          <M>{"n_1"}</M> be beyond the last peak. Since <M>{"n_1"}</M> is not a peak, some <M>{"n_2 > n_1"}</M> has{" "}
          <M>{"a_{n_2} > a_{n_1}"}</M>; since <M>{"n_2"}</M> is not a peak either, some <M>{"n_3 > n_2"}</M> has{" "}
          <M>{"a_{n_3} > a_{n_2}"}</M>, and so on: an increasing subsequence.
        </p>
        <Code>{PEAKS}</Code>
      </Proof>

      <Theorem title="Bolzano–Weierstrass">
        <p>Every bounded sequence of real numbers has a convergent subsequence.</p>
      </Theorem>
      <Proof>
        <p>
          By the previous theorem it has a monotone subsequence, which is bounded, so it converges by the monotone convergence
          theorem.
        </p>
      </Proof>
      <Remark title="the bisection proof">
        <p>
          If |aₙ| ≤ M, one of [−M, 0] and [0, M] contains <M>{"a_n"}</M> for infinitely many n; call it I₁ and pick{" "}
          <M>{"n_1"}</M> with <M>{"a_{n_1} \\in I_1"}</M>. Halve I₁, keep a half I₂ with infinitely many terms, and pick{" "}
          <M>{"n_2 > n_1"}</M> with <M>{"a_{n_2} \\in I_2"}</M>. The nested intervals shrink to a point x, and{" "}
          <M>{"|a_{n_k} - x| \\le M/2^{k-1}"}</M>. This version generalises to ℝᵈ by bisecting each coordinate. With finitely
          many terms we can only keep the half holding more of them:
        </p>
        <Code>{BISECT}</Code>
      </Remark>

      <Example title="many subsequential limits">
        <p>
          Every number in [−1, 1] is a subsequential limit of sin n. This uses that π is irrational: the points n mod 2π are
          dense in [0, 2π], so for any target angle some subsequence of angles approaches it. Bolzano–Weierstrass alone
          only promises one limit, not which.
        </p>
      </Example>

      <Theorem title="convergence through subsequences">
        <p>
          A bounded sequence converges if and only if all its convergent subsequences have the same limit.
        </p>
      </Theorem>
      <Proof>
        <p>
          One direction is inheritance. Conversely, suppose every convergent subsequence tends to a, but aₙ does not. Then for
          some ε &gt; 0, infinitely many terms satisfy <M>{"|a_n - a| \\ge \\varepsilon"}</M>. They form a bounded subsequence,
          which by Bolzano–Weierstrass has a convergent sub-subsequence; its limit b satisfies <M>{"|b - a| \\ge \\varepsilon"}</M>{" "}
          by the order limit theorem, a contradiction.
        </p>
      </Proof>
    </>
  ),

  practice: [
    {
      key: "limits",
      rung: "check",
      prompt: <p>How many different subsequential limits does (−1)ⁿ(1 + 1/n) have?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "peaks",
      rung: "check",
      prompt: <p>In the finite list 3, 1, 2, 2, 0, how many positions are peaks (at least as large as every later entry)?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0.0001 },
    },
    {
      key: "dense",
      rung: "apply",
      prompt: <p>For which bounded sequence is every number in [−1, 1] a subsequential limit?</p>,
      answer: { kind: "choice", options: ["sin n", "(−1)ⁿ", "1/n", "(−1)ⁿ/n"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def peaks(xs):
    out, best = [], -math.inf
    for i in range(len(xs) - 1, -1, -1):
        if xs[i] >= best:
            out.append(i)
            best = xs[i]
    return out[::-1]

def peak_values(xs):
    return [xs[i] for i in peaks(xs)]

xs = [(-1) ** n * (1 + 1 / n) for n in range(1, 11)]
print(peaks(xs), [round(v, 3) for v in peak_values(xs)])
print(peaks([3, 1, 2, 2, 0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 3, 5, 7, 9] [1.5, 1.25, 1.167, 1.125, 1.1]\n[0, 2, 3, 4]",
          "[0, 2, 4, 6, 8] [1.5, 1.25, 1.167, 1.125, 1.1]\n[0, 2, 3, 4]",
          "[1, 3, 5, 7, 9] [1.5, 1.25, 1.167, 1.125, 1.1]\n[0, 2, 4]",
          "[9] [1.1]\n[0, 2, 3, 4]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def subseq_in(xs, a, b):
    return [i for i, x in enumerate(xs) if a <= x <= b]

def bw_bisect(xs, a, b, steps):
    for _ in range(steps):
        m = (a + b) / 2
        if len(subseq_in(xs, a, m)) >= len(subseq_in(xs, m, b)):
            b = m
        else:
            a = m
    return a, b

ys = [(-1) ** n * (1 + 1 / n) for n in range(1, 101)]
a, b = bw_bisect(ys, -2, 2, 8)
print(a, b, subseq_in(ys, a, b)[:4])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-1.015625 -1.0 [64, 66, 68, 70]",
          "1.0 1.015625 [65, 67, 69, 71]",
          "-1.015625 -1.0 [65, 67, 69, 71]",
          "-2 2 [0, 1, 2, 3]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>peaks(xs)</C>, returning in increasing order the indices i of a finite list with xs[i] ≥ xs[j] for every j
          &gt; i (one backward pass), and <C>peak_values(xs)</C>, the values at those indices.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def peaks(xs):
    return []

def peak_values(xs):
    return []
`,
        solution: PEAKS,
        tests: [
          { name: "peaks", code: `assert peaks([3, 1, 2, 2, 0]) == [0, 2, 3, 4] and peaks([1, 2, 3]) == [2] and peaks([5]) == [0]
assert peaks([2, 2, 2]) == [0, 1, 2]` },
          { name: "monotone", code: `import random
random.seed(1)
xs = [random.random() for _ in range(300)]
v = peak_values(xs)
assert all(a >= b for a, b in zip(v, v[1:])) and v[-1] == xs[-1] and v[0] == max(xs)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>subseq_in(xs, a, b)</C>, the indices of terms in the closed interval [a, b], and{" "}
          <C>bw_bisect(xs, a, b, steps)</C>, which repeatedly halves [a, b] at its midpoint m and keeps [a, m] if it contains at
          least as many terms as [m, b], else [m, b]; return the final (a, b).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def subseq_in(xs, a, b):
    return []

def bw_bisect(xs, a, b, steps):
    return a, b
`,
        solution: BISECT,
        tests: [
          { name: "indices", code: `assert subseq_in([0.5, 2, -1, 1, 0.9], 0, 1) == [0, 3, 4] and subseq_in([], 0, 1) == []` },
          { name: "bisect", code: `xs = [0.7 + 1 / n for n in range(1, 400)] + [0.1, 0.2]
a, b = bw_bisect(xs, 0, 2, 12)
assert abs(a - 0.7) < 0.01 and b - a == 2 / 2 ** 12
assert bw_bisect([1.0, 1.0, -1.0], -2, 2, 1) == (0.0, 2)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that every sequence has a monotone subsequence, and deduce the Bolzano–Weierstrass theorem.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Defines peaks and, if there are infinitely many, takes them in order to get a decreasing subsequence.",
          "If there are finitely many, starts beyond the last peak and repeatedly uses that a non-peak has a later strictly larger term to build an increasing subsequence.",
          "Notes a bounded sequence's monotone subsequence is bounded and so converges by the monotone convergence theorem.",
        ],
      },
    },
    {
      key: "steps",
      rung: "stretch",
      prompt: <p>The bisection proof starts with [−2, 2]. After how many halvings is the interval narrower than 0.01?</p>,
      answer: { kind: "numeric", value: 9, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what a subsequence is, the peak argument that every sequence has a monotone subsequence, why this gives Bolzano–Weierstrass, and how subsequences can prove a sequence diverges.",

  glimpse: (
    <>
      <p>
        Bolzano–Weierstrass finds a convergent subsequence without naming its limit. The next lesson gives a test for
        convergence of the whole sequence that also avoids naming the limit: the terms must get close to each other.
      </p>
    </>
  ),
};
