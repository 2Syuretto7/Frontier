import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DeltaCurveViz } from "@/components/viz/DeltaCurveViz";
import type { LessonContent } from "@/lib/types";

const MOD = `def modulus(f, a, b, n, k):
    ys = [f(a + (b - a) * i / n) for i in range(n + 1)]
    best = 0
    for j in range(1, k + 1):
        for i in range(n + 1 - j):
            best = max(best, abs(ys[i + j] - ys[i]))
    return best`;

const DELTA = `def delta_at(f, finv, c, eps, lo, hi):
    y = f(c)
    left = c - finv(y - eps) if f(lo) < y - eps else float("inf")
    right = finv(y + eps) - c if f(hi) > y + eps else float("inf")
    return min(left, right)

def uniform_delta(f, finv, cs, eps, lo, hi):
    return min(delta_at(f, finv, c, eps, lo, hi) for c in cs)`;

export const lesson: LessonContent = {
  id: "m8.5.3",
  minutes: 60,
  links: {
    requires: ["m8.5.2"],
    revisits: ["m8.5.1"],
    foreshadows: ["m8.5.4", "m8.7.2", "m8.8.4"],
  },

  puzzle: (
    <>
      <p>
        1/x is continuous on (0, 1]: at each point c a small enough δ keeps 1/x within ε of 1/c. But the δ needed shrinks as c
        approaches 0, and no single δ works for every c at once. √x on [0, 1] has a vertical tangent at 0, which looks just
        as dangerous, yet one δ does serve every point. What separates the two, and why does it matter?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Ordinary continuity lets δ depend on the point; uniform continuity asks for one δ that works everywhere. On a compact
        set the two coincide, because a bad sequence of points needing ever smaller δ would have a convergent subsequence, and
        continuity at its limit gives a contradiction. On (0, 1] the bad points escape to the missing endpoint.
      </p>
      <DeltaCurveViz />
    </>
  ),

  theory: (
    <>
      <Definition title="uniform continuity">
        <p>f: A → ℝ is uniformly continuous if for every ε &gt; 0 there is δ &gt; 0 such that</p>
        <MD>{"x, y \\in A,\\ |x - y| < \\delta \\implies |f(x) - f(y)| < \\varepsilon."}</MD>
        <p>
          The difference from continuity is the order of the quantifiers: here δ is chosen before the points. The modulus of
          continuity <M>{"\\omega(h) = \\sup\\{|f(x) - f(y)| : |x - y| \\leq h\\}"}</M> packages this: f is uniformly continuous
          exactly when <M>{"\\omega(h) \\to 0"}</M> as <M>{"h \\to 0"}</M>.
        </p>
        <Code>{MOD}</Code>
      </Definition>

      <Theorem title="sequential criterion for failure">
        <p>
          f fails to be uniformly continuous on A if and only if there are ε₀ &gt; 0 and sequences{" "}
          <M>{"x_n, y_n \\in A"}</M> with <M>{"|x_n - y_n| \\to 0"}</M> but <M>{"|f(x_n) - f(y_n)| \\geq \\varepsilon_0"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Negating the definition: some ε₀ defeats every δ, in particular δ = 1/n, giving <M>{"x_n, y_n"}</M> with{" "}
          <M>{"|x_n - y_n| < 1/n"}</M> and <M>{"|f(x_n) - f(y_n)| \\geq \\varepsilon_0"}</M>. Conversely such sequences defeat any
          δ, since eventually <M>{"|x_n - y_n| < \\delta"}</M>.
        </p>
      </Proof>

      <Example title="two failures">
        <p>
          For 1/x on (0, 1] take <M>{"x_n = 1/n"}</M>, <M>{"y_n = 1/(n + 1)"}</M>: the gap tends to 0 and the values differ by 1.
          For x² on ℝ take <M>{"x_n = n + 1/n"}</M>, <M>{"y_n = n"}</M>: <M>{"x_n^2 - y_n^2 = 2 + 1/n^2 > 2"}</M>. In the first the
          domain is not closed, in the second it is not bounded.
        </p>
      </Example>

      <Theorem title="continuity on compact sets is uniform">
        <p>A continuous function on a compact set K is uniformly continuous.</p>
      </Theorem>
      <Proof>
        <p>
          If not, take ε₀, <M>{"x_n"}</M>, <M>{"y_n"}</M> as in the criterion. By compactness a subsequence{" "}
          <M>{"x_{n_k} \\to x \\in K"}</M>, and since <M>{"|x_{n_k} - y_{n_k}| \\to 0"}</M>, also <M>{"y_{n_k} \\to x"}</M>.
          Continuity at x gives <M>{"f(x_{n_k}) - f(y_{n_k}) \\to f(x) - f(x) = 0"}</M>, contradicting{" "}
          <M>{"|f(x_{n_k}) - f(y_{n_k})| \\geq \\varepsilon_0"}</M>.
        </p>
      </Proof>

      <Example title="√x on [0, 1]">
        <p>
          The theorem says √x is uniformly continuous; directly, <M>{"|\\sqrt x - \\sqrt y| \\leq \\sqrt{|x - y|}"}</M>, so δ = ε²
          works. For a monotone function with a known inverse, the largest δ at a point can be computed exactly by solving{" "}
          <M>{"f(x) = f(c) \\pm \\varepsilon"}</M> on each side.
        </p>
        <Code>{DELTA}</Code>
      </Example>

      <Remark title="why uniformity matters">
        <p>
          Uniform continuity is what makes approximation by a grid work: if <M>{"\\omega(h) < \\varepsilon"}</M>, then on every
          cell of width h the function varies by less than ε, everywhere at once. That is the step in proving continuous
          functions are Riemann integrable, and in approximating them by polynomials or by networks. It also sends Cauchy
          sequences to Cauchy sequences, which plain continuity does not (1/x sends 1/n to n).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "unif",
      rung: "check",
      prompt: <p>For √x on [0, 1] and ε = 0.1, what is the largest δ that works at every point at once?</p>,
      answer: { kind: "numeric", value: 0.01, tolerance: 0.0001 },
    },
    {
      key: "at10",
      rung: "check",
      prompt: <p>For x² at c = 10 with ε = 1, what is the largest δ that works at c? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.0499, tolerance: 0.0001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which of these is uniformly continuous on the given domain?</p>,
      answer: { kind: "choice", options: ["sin x on ℝ", "x² on ℝ", "1/x on (0, 1]", "sin(1/x) on (0, 1]"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def modulus(f, a, b, n, k):
    ys = [f(a + (b - a) * i / n) for i in range(n + 1)]
    best = 0
    for j in range(1, k + 1):
        for i in range(n + 1 - j):
            best = max(best, abs(ys[i + j] - ys[i]))
    return best

print([round(modulus(math.sqrt, 0, 1, 1000, k), 4) for k in (1, 10, 100)])
print(round(modulus(lambda x: 1 / x, 0.001, 1, 999, 1), 1), round(modulus(lambda x: x * x, 0, 4, 1000, 10), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0.0316, 0.1, 0.3162]\n500.0 0.3184", "[0.001, 0.01, 0.1]\n500.0 0.3184", "[0.0316, 0.1, 0.3162]\n1.0 0.3184", "[0.0316, 0.1, 0.3162]\n500.0 0.04"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def delta_at(f, finv, c, eps, lo, hi):
    y = f(c)
    left = c - finv(y - eps) if f(lo) < y - eps else float("inf")
    right = finv(y + eps) - c if f(hi) > y + eps else float("inf")
    return min(left, right)

def uniform_delta(f, finv, cs, eps, lo, hi):
    return min(delta_at(f, finv, c, eps, lo, hi) for c in cs)

sqi = lambda y: y * y
print(round(delta_at(math.sqrt, sqi, 0.25, 0.1, 0, 1), 4), delta_at(math.sqrt, sqi, 1, 0.5, 0, 1))
print(round(uniform_delta(math.sqrt, sqi, [i / 100 for i in range(101)], 0.1, 0, 1), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.09 0.75\n0.01", "0.11 0.75\n0.01", "0.09 inf\n0.01", "0.09 0.75\n0.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>modulus(f, a, b, n, k)</C>: evaluate f at the grid points <M>{"x_i = a + (b - a)i/n"}</M>, i = 0, …, n, and
          return the largest <M>{"|f(x_{i+j}) - f(x_i)|"}</M> over 1 ≤ j ≤ k, a grid estimate of ω(k(b − a)/n).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def modulus(f, a, b, n, k):
    return 0
`,
        solution: MOD,
        tests: [
          { name: "linear", code: `assert abs(modulus(lambda x: 2 * x, 0, 1, 10, 3) - 0.6) < 1e-12` },
          { name: "others", code: `assert modulus(lambda x: x * x, 0, 1, 4, 1) == 0.4375 and modulus(abs, -1, 1, 2, 1) == 1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          f is increasing on [lo, hi] with inverse finv. Write <C>delta_at(f, finv, c, eps, lo, hi)</C>: with y = f(c), the
          left distance is c − finv(y − eps) if f(lo) &lt; y − eps and infinite otherwise; the right distance is finv(y + eps) − c
          if f(hi) &gt; y + eps and infinite otherwise; return the smaller. Then write <C>uniform_delta(f, finv, cs, eps, lo, hi)</C>,
          the minimum over the points cs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def delta_at(f, finv, c, eps, lo, hi):
    return 0

def uniform_delta(f, finv, cs, eps, lo, hi):
    return 0
`,
        solution: DELTA,
        tests: [
          { name: "at", code: `assert abs(delta_at(lambda x: 2 * x, lambda y: y / 2, 0.5, 0.2, 0, 1) - 0.1) < 1e-12
assert abs(delta_at(lambda x: x * x * x, lambda y: y ** (1 / 3), 1, 1, 0, 2) - (2 ** (1 / 3) - 1)) < 1e-12` },
          { name: "uniform", code: `assert abs(uniform_delta(lambda x: 2 * x, lambda y: y / 2, [0, 0.5, 1], 0.2, 0, 1) - 0.1) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that a continuous function on [a, b] is uniformly continuous.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Assumes not, and obtains ε₀ and points x_n, y_n with |x_n − y_n| < 1/n and |f(x_n) − f(y_n)| ≥ ε₀.",
          "Uses Bolzano–Weierstrass (compactness of [a, b]) to get x_{n_k} → x ∈ [a, b], and deduces y_{n_k} → x.",
          "Uses continuity at x to get f(x_{n_k}) − f(y_{n_k}) → 0, contradicting the bound ε₀.",
        ],
      },
    },
    {
      key: "omega",
      rung: "stretch",
      prompt: <p>What is the modulus of continuity ω(0.04) of √x on [0, 1]?</p>,
      answer: { kind: "numeric", value: 0.2, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend the difference between continuity and uniform continuity as an order of quantifiers, the sequential test for failure, why continuity on a compact set is automatically uniform, and why 1/x on (0, 1] is not.",

  glimpse: (
    <>
      <p>
        A simple way to be uniformly continuous is to have a bounded slope: |f(x) − f(y)| ≤ K|x − y|. These Lipschitz
        functions, the subject of the next lesson, are the ones whose behaviour optimisation theory can control.
      </p>
    </>
  ),
};
