import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SwapLimitViz } from "@/components/viz/SwapLimitViz";
import type { LessonContent } from "@/lib/types";

const SPIKE = `def spike(n):
    def f(x):
        if 0 <= x <= 1 / n:
            return n * n * x
        if 1 / n < x <= 2 / n:
            return n * n * (2 / n - x)
        return 0.0
    return f

def trap(f, a, b, m):
    h = (b - a) / m
    return h * (sum(f(a + i * h) for i in range(1, m)) + (f(a) + f(b)) / 2)`;

const WIGGLE = `import math

def wiggle(n):
    return lambda x: math.sin(n * n * x) / n

def wiggle_prime(n):
    return lambda x: n * math.cos(n * n * x)`;

export const lesson: LessonContent = {
  id: "m8.8.2",
  minutes: 60,
  links: {
    requires: ["m8.8.1", "m8.7.3"],
    revisits: ["m8.6.2"],
    foreshadows: ["m8.8.3", "m8.8.4"],
  },

  puzzle: (
    <>
      <p>
        Machine learning swaps limits constantly: the gradient of an expected loss is computed as the expected gradient,
        derivative inside integral; a series is differentiated term by term. Each swap is a theorem with hypotheses. A spike
        of area 1 that narrows to nothing has integral 1 for every n but tends to 0 at every point. So when may a limit pass
        through an integral, and when through a derivative?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An integral is a weighted sum of values, so if the values are uniformly close, the integrals are close. A derivative is
        a limit of difference quotients, and functions can be uniformly close while their slopes differ wildly, as a tiny,
        rapid wiggle shows. So integrals behave under uniform convergence, and derivatives need the derivatives themselves
        to converge uniformly.
      </p>
      <SwapLimitViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="integrals and uniform limits">
        <p>
          If each <M>{"f_n"}</M> is integrable on [a, b] and <M>{"f_n \\to f"}</M> uniformly, then f is integrable and{" "}
          <M>{"\\int_a^b f_n \\to \\int_a^b f"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"\\varepsilon_n = \\|f_n - f\\|_\\infty"}</M>. On every cell, the supremum and infimum of f are within{" "}
          <M>{"\\varepsilon_n"}</M> of those of <M>{"f_n"}</M>, so for every partition
        </p>
        <MD>{"U(f, P) - L(f, P) \\leq U(f_n, P) - L(f_n, P) + 2\\varepsilon_n(b - a)."}</MD>
        <p>
          Choose n with <M>{"\\varepsilon_n"}</M> small, then P making the first term small: f is integrable. Finally{" "}
          <M>{"|\\int f_n - \\int f| \\leq \\int |f_n - f| \\leq \\varepsilon_n (b - a) \\to 0"}</M>.
        </p>
      </Proof>

      <Example title="the spike">
        <p>
          The triangle of height n on [0, 2/n] has area 1 and tends to 0 at every point (for x &gt; 0 it is 0 once 2/n &lt; x),
          but its sup distance from 0 is n. So the limit of the integrals is 1 and the integral of the limit is 0. A narrowing
          spike is the standard way pointwise convergence goes wrong.
        </p>
        <Code>{SPIKE}</Code>
      </Example>

      <Theorem title="derivatives and uniform limits">
        <p>
          Let <M>{"f_n"}</M> be continuously differentiable on [a, b], with <M>{"f_n' \\to g"}</M> uniformly and{" "}
          <M>{"f_n(x_0)"}</M> convergent for some <M>{"x_0"}</M>. Then <M>{"f_n"}</M> converges uniformly to a differentiable f
          with f′ = g.
        </p>
      </Theorem>
      <Proof>
        <p>
          g is continuous as a uniform limit of continuous functions. By the fundamental theorem,{" "}
          <M>{"f_n(x) = f_n(x_0) + \\int_{x_0}^x f_n'"}</M>. Let <M>{"f(x) = \\lim f_n(x_0) + \\int_{x_0}^x g"}</M>. Then
        </p>
        <MD>{"|f_n(x) - f(x)| \\leq |f_n(x_0) - \\lim_m f_m(x_0)| + (b - a)\\|f_n' - g\\|_\\infty \\to 0"}</MD>
        <p>
          uniformly in x, and f′ = g by the accumulation form of the fundamental theorem. (The theorem holds without continuity
          of the derivatives, with a proof by the mean value theorem.)
        </p>
      </Proof>

      <Example title="the wiggle">
        <p>
          <M>{"\\sin(n^2 x)/n \\to 0"}</M> uniformly, with sup distance 1/n, but its derivative <M>{"n\\cos(n^2x)"}</M> equals n at
          0. Uniform convergence of the functions says nothing about their slopes; the theorem needs the derivatives to
          converge uniformly.
        </p>
        <Code>{WIGGLE}</Code>
      </Example>

      <Remark title="double limits">
        <p>
          All of these are cases of swapping two limits. For <M>{"x^n"}</M> at x → 1,{" "}
          <M>{"\\lim_n \\lim_{x \\to 1^-} x^n = 1"}</M> but <M>{"\\lim_{x \\to 1^-} \\lim_n x^n = 0"}</M>. Uniformity in one variable
          is what licenses the swap. In probability and machine learning the workhorse is the dominated convergence theorem
          of Lebesgue integration, which allows <M>{"\\nabla \\mathbb{E}[\\ell] = \\mathbb{E}[\\nabla \\ell]"}</M> when the
          gradients are bounded by one integrable function; the uniform theorems here are its simplest cases.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "area",
      rung: "check",
      prompt: <p>The triangle of height n on [0, 2/n] with n = 5: what is its integral over [0, 1]?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "slope",
      rung: "check",
      prompt: <p>What is the derivative of sin(n²x)/n at x = 0 when n = 7?</p>,
      answer: { kind: "numeric", value: 7, tolerance: 0.0001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Continuous fₙ converge uniformly to f on [a, b]. Which must be true?</p>,
      answer: {
        kind: "choice",
        options: ["∫fₙ → ∫f", "fₙ′ → f′ wherever these exist", "f is differentiable", "∫|fₙ′| → ∫|f′|"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def spike(n):
    def f(x):
        if 0 <= x <= 1 / n:
            return n * n * x
        if 1 / n < x <= 2 / n:
            return n * n * (2 / n - x)
        return 0.0
    return f

def trap(f, a, b, m):
    h = (b - a) / m
    return h * (sum(f(a + i * h) for i in range(1, m)) + (f(a) + f(b)) / 2)

print([round(trap(spike(n), 0, 1, 10000), 4) for n in (2, 10, 100)], [spike(n)(0.5) for n in (2, 10, 100)])
print(round(trap(lambda x: (1 + x / 50) ** 50, 0, 1, 1000), 4), round(math.e - 1, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[1.0, 1.0, 1.0] [2.0, 0.0, 0.0]\n1.7112 1.7183", "[1.0, 0.1, 0.01] [2.0, 0.0, 0.0]\n1.7112 1.7183", "[0.5, 1.0, 1.0] [2.0, 0.0, 0.0]\n1.7112 1.7183", "[1.0, 1.0, 1.0] [2.0, 10.0, 100.0]\n1.7183 1.7183"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def wiggle(n):
    return lambda x: math.sin(n * n * x) / n

def wiggle_prime(n):
    return lambda x: n * math.cos(n * n * x)

print([round(max(abs(wiggle(n)(i / 1000)) for i in range(1001)), 4) for n in (1, 10, 100)])
print([wiggle_prime(n)(0) for n in (1, 10, 100)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.8415, 0.1, 0.01]\n[1.0, 10.0, 100.0]", "[0.8415, 0.1, 0.01]\n[1.0, 1.0, 1.0]", "[1.0, 0.1, 0.01]\n[1.0, 10.0, 100.0]", "[0.8415, 1.0, 1.0]\n[1.0, 100.0, 10000.0]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>spike(n)</C>, returning the function equal to n²x on [0, 1/n], n²(2/n − x) on (1/n, 2/n], and 0.0
          elsewhere, and <C>trap(f, a, b, m)</C>, the trapezoid rule with m equal cells.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def spike(n):
    return lambda x: 0.0

def trap(f, a, b, m):
    return 0.0
`,
        solution: SPIKE,
        tests: [
          { name: "spike", code: `assert spike(4)(0.25) == 4.0 and spike(4)(0.6) == 0.0 and spike(4)(0.375) == 2.0` },
          { name: "trap", code: `assert abs(trap(spike(4), 0, 1, 1000) - 1) < 1e-9 and abs(trap(lambda x: x, 0, 2, 3) - 2) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>wiggle(n)</C>, returning the function sin(n²x)/n, and <C>wiggle_prime(n)</C>, returning its derivative
          n cos(n²x).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def wiggle(n):
    return lambda x: 0.0

def wiggle_prime(n):
    return lambda x: 0.0
`,
        solution: WIGGLE,
        tests: [
          { name: "wiggle", code: `import math
assert abs(wiggle(3)(0.5) - math.sin(4.5) / 3) < 1e-12` },
          { name: "prime", code: `h = 1e-6
assert wiggle_prime(5)(0) == 5.0 and abs((wiggle(4)(0.3 + h) - wiggle(4)(0.3 - h)) / (2 * h) - wiggle_prime(4)(0.3)) < 1e-4` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Suppose fₙ and f are integrable on [a, b] and fₙ → f uniformly. Prove that <M>{"\\int_a^b f_n \\to \\int_a^b f"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses linearity and monotonicity of the integral to bound |∫fₙ − ∫f| by ∫|fₙ − f|.",
          "Bounds ∫|fₙ − f| by (b − a) sup|fₙ − f|.",
          "Concludes from uniform convergence that this bound tends to 0.",
        ],
      },
    },
    {
      key: "n2",
      rung: "stretch",
      prompt: <p>Compute ∫₀¹ (1 + x/2)² dx. Give four decimal places.</p>,
      answer: { kind: "numeric", value: 1.5833, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why uniform convergence lets a limit pass through an integral but not through a derivative, using the narrowing spike and the fast wiggle, and what extra hypothesis makes term-by-term differentiation valid.",

  glimpse: (
    <>
      <p>
        Power series are where these theorems pay off: inside the radius of convergence they converge uniformly, together with
        their derivatives, so they can be integrated and differentiated term by term.
      </p>
    </>
  ),
};
