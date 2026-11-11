import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem } from "@/components/lesson/Blocks";
import { ImproperViz } from "@/components/viz/ImproperViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.7.3",
  minutes: 60,
  links: {
    requires: ["m2.6.3", "m2.2.4"],
    revisits: ["m2.7.1"],
    foreshadows: ["m7.3.1", "m2.8.2"],
  },

  puzzle: (
    <>
      <p>
        The region under <M>{"y = 1/x^2"}</M> to the right of <M>{"x = 1"}</M> stretches out for ever. The region under{" "}
        <M>{"y = 1/x"}</M> does too, and the two curves look almost the same: both fall towards 0.
      </p>
      <p>
        Can a region of infinite length have a finite area? And if one of these does, why not the other?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An integral over an infinite interval is not something you can compute in one go. Instead, compute the area up to a
        finite right end R, then let R grow and see whether the areas settle. Try the three curves below, and push R as far as
        it goes.
      </p>
      <ImproperViz />
      <p>
        Everything depends on how fast the curve falls. <M>{"1/x^2"}</M> falls fast enough for the tail to add only a finite
        amount; <M>{"1/x"}</M> does not, though it fails only just.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="improper integrals">
        <p>If f is continuous on <M>{"[a, \\infty)"}</M>, define</p>
        <MD>{"\\int_a^\\infty f(x)\\,dx = \\lim_{R \\to \\infty} \\int_a^R f(x)\\,dx"}</MD>
        <p>
          when the limit exists; the integral then <strong>converges</strong>, and otherwise it <strong>diverges</strong>.
          Likewise, if f is continuous on <M>{"(a, b]"}</M> but unbounded near a, define{" "}
          <M>{"\\int_a^b f = \\lim_{t \\to a^+} \\int_t^b f"}</M>. An integral over the whole line is split at a point, and both
          halves must converge.
        </p>
      </Definition>

      <Theorem title="p-integrals">
        <p>
          <M>{"\\int_1^\\infty \\frac{dx}{x^p}"}</M> converges exactly when <M>{"p > 1"}</M>, to <M>{"\\frac{1}{p - 1}"}</M>.{" "}
          <M>{"\\int_0^1 \\frac{dx}{x^p}"}</M> converges exactly when <M>{"p < 1"}</M>, to <M>{"\\frac{1}{1 - p}"}</M>.
        </p>
      </Theorem>
      <Remark title="why">
        <p>
          For <M>{"p \\ne 1"}</M>, <M>{"\\int_1^R x^{-p}\\,dx = \\frac{R^{1-p} - 1}{1 - p}"}</M>, which has a limit exactly when
          the power <M>{"1 - p"}</M> is negative. For <M>{"p = 1"}</M> the integral is <M>{"\\ln R"}</M>, which grows without
          bound. Near 0 the roles reverse: there, larger p means a steeper blow-up.
        </p>
      </Remark>

      <Theorem title="comparison">
        <p>
          If <M>{"0 \\le f(x) \\le g(x)"}</M> for <M>{"x \\ge a"}</M> and <M>{"\\int_a^\\infty g"}</M> converges, so does{" "}
          <M>{"\\int_a^\\infty f"}</M>. If <M>{"\\int_a^\\infty f"}</M> diverges, so does <M>{"\\int_a^\\infty g"}</M>.
        </p>
      </Theorem>
      <Remark title="why comparison works">
        <p>
          For non-negative f, the area up to R only grows with R, and it is bounded by the total area under g. A growing,
          bounded quantity has a limit: this is the completeness of the reals at work. For example,{" "}
          <M>{"e^{-x^2} \\le e^{-x}"}</M> for <M>{"x \\ge 1"}</M>, so <M>{"\\int_1^\\infty e^{-x^2}\\,dx"}</M> converges,
          although no formula gives its value.
        </p>
      </Remark>

      <Example title="the Gamma function">
        <p>
          For <M>{"s > 0"}</M>, the integral <M>{"\\Gamma(s) = \\int_0^\\infty x^{s-1} e^{-x}\\,dx"}</M> converges, because the
          exponential beats any power. <M>{"\\Gamma(1) = 1"}</M>, and integration by parts gives{" "}
          <M>{"\\Gamma(s + 1) = s\\,\\Gamma(s)"}</M>. So <M>{"\\Gamma(n + 1) = n!"}</M> for whole numbers n: the factorial,
          extended to every positive real.
        </p>
      </Example>

      <Remark title="probability">
        <p>
          A probability density is a non-negative function with total integral 1, usually over an infinite interval. The
          waiting time until a radioactive atom decays has density <M>{"\\lambda e^{-\\lambda x}"}</M> on{" "}
          <M>{"[0, \\infty)"}</M>, and its average value, <M>{"\\int_0^\\infty x \\lambda e^{-\\lambda x}\\,dx = 1/\\lambda"}</M>,
          is an improper integral. Some densities, such as <M>{"1/(\\pi(1 + x^2))"}</M>, have no average at all, because{" "}
          <M>{"\\int x/(1 + x^2)"}</M> diverges.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "pinf",
      rung: "check",
      prompt: <p>For which p does <M>{"\\int_1^\\infty x^{-p}\\,dx"}</M> converge?</p>,
      answer: { kind: "choice", options: ["p > 1", "p ≥ 1", "p < 1", "every p > 0"], correct: [0] },
    },
    {
      key: "pzero",
      rung: "check",
      prompt: <p>Which of these converge? Select all that apply.</p>,
      answer: {
        kind: "choice",
        options: ["∫₀¹ 1/√x dx", "∫₀¹ 1/x dx", "∫₀¹ 1/x² dx", "∫₁^∞ 1/x² dx"],
        correct: [0, 3],
      },
    },
    {
      key: "cube",
      rung: "apply",
      prompt: <p>Evaluate <M>{"\\int_1^\\infty x^{-3}\\,dx"}</M>.</p>,
      answer: { kind: "numeric", value: 0.5 },
    },
    {
      key: "sqrt",
      rung: "apply",
      prompt: <p>Evaluate <M>{"\\int_0^1 x^{-1/2}\\,dx"}</M>.</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "xex",
      rung: "apply",
      prompt: <p>Evaluate <M>{"\\int_0^\\infty x e^{-x}\\,dx"}</M>.</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`for b in [10, 100, 1000]:
    print(1 - 1 / b)`}</Code>
          <p>These are the integrals of 1/x² from 1 to b. What is the improper integral from 1 to ∞?</p>
        </>
      ),
      answer: { kind: "numeric", value: 1.0 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
for p in (0.5, 2):
    print(p, [round((b ** (1 - p) - 1) / (1 - p), 3) for b in (10, 1e4, 1e8)])`}</Code>
          <p>The integral of 1/xᵖ from 1 to b for growing b: which p converges? What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.5 [4.325, 198.0, 19998.0] / 2 [0.9, 1.0, 1.0]", "0.5 [4.325, 198.0, 19998.0] / 2 [0.9, 0.9999, 1.0]", "0.5 [0.9, 1.0, 1.0] / 2 [4.325, 198.0, 19998.0]", "0.5 [4.325, 198.0, 19998.0] / 2 [1.1, 1.0, 1.0]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>tail(p, b)</C>, the integral of 1/xᵖ from 1 to b for p ≠ 1, from the antiderivative x^(1−p)/(1−p). Then <C>converges(p)</C> should return whether the integral to ∞ is finite.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def tail(p, b):
    return 0.0

def converges(p):
    return True
`,
        solution: `def tail(p, b):
    return (b ** (1 - p) - 1) / (1 - p)

def converges(p):
    return p > 1
`,
        tests: [
          { name: "square", code: `assert abs(tail(2, 1000) - 0.999) < 1e-12, 'The integral of 1/x² from 1 to 1000 is 1 − 1/1000.'` },
          { name: "root", code: `assert abs(tail(0.5, 100) - 18) < 1e-9, 'The integral of 1/√x from 1 to 100 is 2(10 − 1) = 18.'` },
          { name: "which", code: `assert converges(2) and converges(1.01) and not converges(0.5), 'It converges exactly when p > 1.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>improper(f, a, tol)</C>, the integral of f over [a, ∞) for a decaying f, computed by integrating over the blocks [a, a + 1], [a + 1, a + 3], [a + 3, a + 7], … (doubling lengths) with Simpson&rsquo;s rule on 1000 strips each, stopping when a block contributes less than tol in absolute value, and returning (value, number of blocks). Also write <C>diverges(f, a)</C>, which returns <C>True</C> if 30 blocks have not met the stopping rule for tol = 1e−10.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def improper(f, a, tol):
    return (0.0, 0)

def diverges(f, a):
    return False
`,
        solution: `def simpson(f, a, b, n=1000):
    h = (b - a) / n
    s = f(a) + f(b)
    for i in range(1, n):
        s += (4 if i % 2 else 2) * f(a + i * h)
    return s * h / 3

def improper(f, a, tol, max_blocks=60):
    total, lo, length, k = 0.0, a, 1.0, 0
    while k < max_blocks:
        piece = simpson(f, lo, lo + length)
        total += piece
        k += 1
        if abs(piece) < tol:
            break
        lo += length
        length *= 2
    return (total, k)

def diverges(f, a):
    v, k = improper(f, a, 1e-10, 30)
    return k >= 30
`,
        tests: [
          { name: "power", code: `v, k = improper(lambda x: 1 / x ** 2, 1, 1e-12)
assert abs(v - 1) < 1e-9, 'The integral of 1/x² from 1 is 1.'` },
          { name: "exp", code: `import math
v, k = improper(lambda x: math.exp(-x), 0, 1e-14)
assert abs(v - 1) < 1e-12 and k < 10, 'e⁻ˣ decays fast: few blocks.'` },
          { name: "gauss", code: `import math
v, k = improper(lambda x: math.exp(-x * x / 2), 0, 1e-15)
assert abs(v - math.sqrt(math.pi / 2)) < 1e-12, 'Half the Gaussian integral.'` },
          { name: "diverges", code: `import math
assert diverges(lambda x: 1 / x, 1) and diverges(lambda x: 1 / math.sqrt(x), 1) and not diverges(lambda x: x ** -3, 1), '1/x has a divergent tail; 1/x³ does not.'` },
        ],
      },
    },
    {
      key: "gamma",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"\\Gamma(s + 1) = s\\,\\Gamma(s)"}</M> for <M>{"s > 0"}</M>, where{" "}
          <M>{"\\Gamma(s) = \\int_0^\\infty x^{s-1}e^{-x}\\,dx"}</M>. Deduce that <M>{"\\Gamma(n + 1) = n!"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Applies integration by parts on [0, R] with u = xˢ and dv = e⁻ˣ dx.",
          "Shows the boundary term Rˢe⁻ᴿ − 0 tends to 0 as R → ∞ (exponential beats power), and is 0 at x = 0 since s > 0.",
          "Obtains Γ(s + 1) = s ∫₀^∞ xˢ⁻¹ e⁻ˣ dx = s Γ(s).",
          "Computes Γ(1) = 1 and uses induction to get Γ(n + 1) = n!.",
        ],
      },
    },
    {
      key: "mean",
      rung: "stretch",
      prompt: (
        <p>
          A waiting time has density <M>{"4e^{-4x}"}</M> for <M>{"x \\ge 0"}</M>. What is its mean,{" "}
          <M>{"\\int_0^\\infty x \\cdot 4e^{-4x}\\,dx"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.25 },
    },
  ],

  teachBack:
    "Explain to a friend how an area that stretches to infinity can be finite, why ∫ 1/x² converges while ∫ 1/x does not, and how comparison decides harder cases.",

  glimpse: (
    <p>
      Next, the most important improper integral of all: the area under the bell curve <M>{"e^{-x^2}"}</M>, which has no
      antiderivative in familiar functions, yet equals exactly √π. The integral test, later in this course, uses p-integrals
      to decide which infinite sums converge, and Probability builds the theory of densities on them.
    </p>
  ),
};
