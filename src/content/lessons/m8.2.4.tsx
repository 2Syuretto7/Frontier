import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CauchyTailViz } from "@/components/viz/CauchyTailViz";
import type { LessonContent } from "@/lib/types";

const TAIL = `def tail_diameter(xs, N):
    tail = xs[N:]
    return max(tail) - min(tail)

def cauchy_N(xs, eps):
    hi = lo = xs[-1]
    N = len(xs)
    for i in range(len(xs) - 1, -1, -1):
        hi, lo = max(hi, xs[i]), min(lo, xs[i])
        if hi - lo >= eps:
            break
        N = i
    return N`;

const CONTRACT = `def iterate_until(f, x0, tol, max_iter):
    x = x0
    for k in range(1, max_iter + 1):
        y = f(x)
        if abs(y - x) < tol:
            return y, k
        x = y
    return x, max_iter

def contraction_bound(d1, c, n):
    return c ** (n - 1) * d1 / (1 - c)`;

export const lesson: LessonContent = {
  id: "m8.2.4",
  minutes: 60,
  links: {
    requires: ["m8.2.3"],
    revisits: ["m8.1.1", "m2.8.2"],
    foreshadows: ["m8.3.1", "m8.9.2", "m8.9.3"],
  },

  puzzle: (
    <>
      <p>
        An iterative algorithm stops when successive iterates agree to ten digits. It never sees the true answer, only its
        own outputs. When does &quot;the terms are getting close to each other&quot; guarantee that they are getting close to
        something? And why is &quot;consecutive terms get close&quot; not enough?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A sequence converges if its terms eventually crowd around a target. Cauchy&apos;s condition removes the target:
        eventually all the terms crowd around each other. In the rationals that is not enough, because the target may be a
        hole. In the reals it is, and this internal test is how convergence is proved for series and iterations whose
        limits have no formula.
      </p>
      <CauchyTailViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Cauchy sequence">
        <p>
          (aₙ) is Cauchy if for every ε &gt; 0 there is N such that <M>{"|a_m - a_n| < \\varepsilon"}</M> for all m, n ≥ N.
        </p>
      </Definition>
      <Theorem title="convergent sequences are Cauchy, and Cauchy sequences are bounded">
        <p>Every convergent sequence is Cauchy, and every Cauchy sequence is bounded.</p>
      </Theorem>
      <Proof>
        <p>
          If aₙ → a, choose N with <M>{"|a_n - a| < \\varepsilon/2"}</M> for n ≥ N; then{" "}
          <M>{"|a_m - a_n| \\le |a_m - a| + |a - a_n| < \\varepsilon"}</M>. If (aₙ) is Cauchy, take ε = 1: for n ≥ N,{" "}
          <M>{"|a_n| \\le |a_N| + 1"}</M>, and the finitely many earlier terms are bounded too.
        </p>
      </Proof>

      <Theorem title="Cauchy criterion">
        <p>A sequence of real numbers converges if and only if it is Cauchy.</p>
      </Theorem>
      <Proof>
        <p>
          Let (aₙ) be Cauchy. It is bounded, so by Bolzano–Weierstrass a subsequence <M>{"a_{n_k} \\to a"}</M>. Given ε, choose
          N with <M>{"|a_m - a_n| < \\varepsilon/2"}</M> for m, n ≥ N, and then k with <M>{"n_k \\ge N"}</M> and{" "}
          <M>{"|a_{n_k} - a| < \\varepsilon/2"}</M>. For n ≥ N,{" "}
          <M>{"|a_n - a| \\le |a_n - a_{n_k}| + |a_{n_k} - a| < \\varepsilon"}</M>.
        </p>
      </Proof>
      <Remark title="where completeness enters">
        <p>
          The proof used Bolzano–Weierstrass, hence completeness. In ℚ the Newton iterates 1, 3/2, 17/12, 577/408, … are
          Cauchy but have no rational limit. Conversely, an Archimedean ordered field in which every Cauchy sequence converges
          has the least upper bound property (bisect as before; the endpoints form Cauchy sequences). So Cauchy completeness
          is one more equivalent form, and it is the one that makes sense without an order: in metric spaces, the last
          chapter.
        </p>
      </Remark>
      <Code>{TAIL}</Code>

      <Example title="consecutive closeness is not enough">
        <p>
          The harmonic partial sums have <M>{"S_{n+1} - S_n = 1/(n + 1) \\to 0"}</M>, yet{" "}
          <M>{"S_{2n} - S_n \\ge n \\cdot \\frac1{2n} = \\frac12"}</M> for every n, so they are not Cauchy and diverge. Similarly{" "}
          <M>{"\\sqrt{n + 1} - \\sqrt n \\to 0"}</M> while √n → ∞. A stopping rule based only on the last step can stop on a
          divergent sequence.
        </p>
      </Example>

      <Theorem title="contractive sequences">
        <p>
          If there is c ∈ [0, 1) with <M>{"|a_{n+2} - a_{n+1}| \\le c\\,|a_{n+1} - a_n|"}</M> for all n, then (aₙ) is Cauchy,
          so it converges to some L, and <M>{"|a_n - L| \\le c^{n-1}|a_2 - a_1|/(1 - c)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction <M>{"|a_{k+1} - a_k| \\le c^{k-1}d"}</M> with <M>{"d = |a_2 - a_1|"}</M>. For m &gt; n, the triangle
          inequality and the geometric series give
        </p>
        <MD>{"|a_m - a_n| \\le \\sum_{k=n}^{m-1} c^{k-1}d < \\frac{c^{n-1}d}{1 - c},"}</MD>
        <p>
          which tends to 0 as n → ∞, so the sequence is Cauchy. Letting m → ∞ gives the error bound.
        </p>
      </Proof>
      <Example title="a continued fraction">
        <p>
          <M>{"x_{n+1} = 1/(1 + x_n)"}</M>, x₁ = 1. All terms lie in [1/2, 1], and{" "}
          <M>{"|x_{n+2} - x_{n+1}| = \\frac{|x_{n+1} - x_n|}{(1 + x_{n+1})(1 + x_n)} \\le \\tfrac49|x_{n+1} - x_n|"}</M>. So it
          converges, to the positive root of L² + L = 1, namely (√5 − 1)/2 ≈ 0.618034. The sequence is not monotone, so the
          previous lesson&apos;s theorem would not apply directly.
        </p>
        <Code>{CONTRACT}</Code>
      </Example>
    </>
  ),

  practice: [
    {
      key: "diam",
      rung: "check",
      prompt: <p>For aₙ = 1/n, what is the supremum of |aₘ − aₙ| over all m, n ≥ 10?</p>,
      answer: { kind: "numeric", value: 0.1, tolerance: 0.0001 },
    },
    {
      key: "bound",
      rung: "check",
      prompt: <p>A contractive sequence has c = 0.5 and |a₂ − a₁| = 1. What bound does the theorem give for |a₅ − L|?</p>,
      answer: { kind: "numeric", value: 0.125, tolerance: 0.0001 },
    },
    {
      key: "notcauchy",
      rung: "apply",
      prompt: <p>Which of these sequences is not Cauchy?</p>,
      answer: {
        kind: "choice",
        options: ["The partial sums of 1 + 1/2 + 1/3 + …", "The partial sums of 1 − 1/2 + 1/3 − …", "(1 + 1/n)ⁿ", "The Newton iterates for √2 in ℝ"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import itertools

def tail_diameter(xs, N):
    tail = xs[N:]
    return max(tail) - min(tail)

def cauchy_N(xs, eps):
    hi = lo = xs[-1]
    N = len(xs)
    for i in range(len(xs) - 1, -1, -1):
        hi, lo = max(hi, xs[i]), min(lo, xs[i])
        if hi - lo >= eps:
            break
        N = i
    return N

alt = list(itertools.accumulate((-1) ** (k + 1) / k for k in range(1, 2001)))
harm = list(itertools.accumulate(1 / k for k in range(1, 2001)))
print(round(tail_diameter(alt, 100), 5), cauchy_N(alt, 0.01), round(tail_diameter(harm, 100), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.0098 99 2.981", "0.0098 100 2.981", "0.0098 99 0.0", "0.01 99 7.485"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def iterate_until(f, x0, tol, max_iter):
    x = x0
    for k in range(1, max_iter + 1):
        y = f(x)
        if abs(y - x) < tol:
            return y, k
        x = y
    return x, max_iter

def contraction_bound(d1, c, n):
    return c ** (n - 1) * d1 / (1 - c)

x, k = iterate_until(lambda x: 1 / (1 + x), 1.0, 1e-10, 100)
print(round(x, 6), k, round(contraction_bound(0.5, 0.4, 10), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.618034 25 0.000218", "1.618034 25 0.000218", "0.618034 25 0.000105", "0.618034 100 0.000218"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>tail_diameter(xs, N)</C>, the difference between the largest and smallest of xs[N:], and{" "}
          <C>cauchy_N(xs, eps)</C>, the smallest N with tail_diameter(xs, N) &lt; eps (len(xs) if none), in one backward pass.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def tail_diameter(xs, N):
    return 0.0

def cauchy_N(xs, eps):
    return 0
`,
        solution: TAIL,
        tests: [
          { name: "diameter", code: `assert tail_diameter([5, 1, 3, 2, 2.5], 1) == 2 and tail_diameter([5, 1, 3], 2) == 0` },
          { name: "cauchy N", code: `xs = [1 / n for n in range(1, 101)]
N = cauchy_N(xs, 0.05)
assert tail_diameter(xs, N) < 0.05 and tail_diameter(xs, N - 1) >= 0.05
assert cauchy_N([0, 10, 0, 10], 1) == 3 and cauchy_N([1, 1, 1], 0.5) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>iterate_until(f, x0, tol, max_iter)</C>, applying f until two successive values differ by less than tol and
          returning (the last value, the number of applications), or (current value, max_iter) if that never happens; and{" "}
          <C>contraction_bound(d1, c, n)</C>, the error bound <M>{"c^{n-1}d_1/(1 - c)"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def iterate_until(f, x0, tol, max_iter):
    return x0, 0

def contraction_bound(d1, c, n):
    return d1
`,
        solution: CONTRACT,
        tests: [
          { name: "iterate", code: `x, k = iterate_until(lambda x: x / 2 + 1, 0.0, 1e-9, 200)
assert abs(x - 2) < 1e-8 and 25 < k < 40
x, k = iterate_until(lambda x: x + 1, 0.0, 0.5, 10)
assert (x, k) == (10.0, 10)
assert iterate_until(lambda x: x, 3.0, 1e-6, 5) == (3.0, 1)` },
          { name: "bound", code: `assert abs(contraction_bound(1, 0.5, 5) - 0.125) < 1e-12 and abs(contraction_bound(2, 0.0, 1) - 2) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that every Cauchy sequence of real numbers converges.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Shows a Cauchy sequence is bounded (ε = 1 beyond some N, plus finitely many earlier terms).",
          "Applies Bolzano–Weierstrass to get a subsequence converging to some a.",
          "Uses the Cauchy condition and the subsequence with ε/2 each and the triangle inequality to show aₙ → a.",
        ],
      },
    },
    {
      key: "golden",
      rung: "stretch",
      prompt: <p>What is the limit of xₙ₊₁ = 1/(1 + xₙ) from x₁ = 1? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.618, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what a Cauchy sequence is, why it converges in ℝ but not always in ℚ, why consecutive terms getting close is not enough, and how a contraction factor c < 1 proves convergence with an error bar.",

  glimpse: (
    <>
      <p>
        For a sequence that is not convergent we can still ask where it eventually lives. The next lesson defines the
        largest and smallest subsequential limits, limsup and liminf, which exist for every bounded sequence.
      </p>
    </>
  ),
};
