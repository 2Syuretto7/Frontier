import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DiffErrorViz } from "@/components/viz/DiffErrorViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.9.2",
  minutes: 60,
  links: {
    requires: ["m2.9.1"],
    revisits: ["m2.4.1"],
    foreshadows: ["l3.2.4", "e5.4.1", "m11.1.2"],
  },

  puzzle: (
    <>
      <p>
        You have written the backward pass of a new neural network layer by hand, and want to check it. The definition of the
        derivative suggests computing <M>{"(f(x + h) - f(x))/h"}</M> for a small h and comparing.
      </p>
      <p>
        So you try <M>{"h = 10^{-4}"}</M>, then <M>{"10^{-8}"}</M>, then <M>{"10^{-12}"}</M>, expecting ever better estimates.
        The second is better than the first. The third is no better than the first, and often worse. Smaller h should be closer to the limit. What went wrong?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two errors pull in opposite directions. The formula is only an approximation, and Taylor&rsquo;s theorem says its
        error shrinks with h. But a computer stores numbers to about 16 significant digits, and subtracting two nearly equal
        values of f, then dividing by a tiny h, magnifies the rounding. The plot shows both, on log scales.
      </p>
      <DiffErrorViz />
    </>
  ),

  theory: (
    <>
      <Definition title="finite differences">
        <p>
          The <strong>forward difference</strong> is <M>{"D_+(h) = \\dfrac{f(x + h) - f(x)}{h}"}</M> and the{" "}
          <strong>central difference</strong> is <M>{"D_0(h) = \\dfrac{f(x + h) - f(x - h)}{2h}"}</M>.
        </p>
      </Definition>

      <Theorem title="truncation errors">
        <p>If f is smooth enough near x, then as <M>{"h \\to 0"}</M>,</p>
        <MD>{"D_+(h) = f'(x) + \\tfrac12 f''(x)\\,h + O(h^2), \\qquad D_0(h) = f'(x) + \\tfrac16 f'''(x)\\,h^2 + O(h^4)."}</MD>
      </Theorem>
      <Remark title="where they come from">
        <p>
          Expand <M>{"f(x \\pm h) = f(x) \\pm f'(x)h + \\tfrac12 f''(x)h^2 \\pm \\tfrac16 f'''(x)h^3 + \\dots"}</M>. The forward
          difference keeps the <M>{"h^2"}</M> term, which becomes an error of order h after dividing. In the central difference
          the even powers cancel in the subtraction, leaving an error of order <M>{"h^2"}</M>, for one extra evaluation of f.
        </p>
      </Remark>

      <Theorem title="the rounding trade-off">
        <p>
          If each value of f is computed with relative error about ε (around <M>{"10^{-16}"}</M> in double precision), the
          difference quotient carries a rounding error of about <M>{"\\varepsilon|f|/h"}</M>. The total error of the forward
          difference is roughly
        </p>
        <MD>{"\\tfrac12|f''|\\,h + \\frac{\\varepsilon|f|}{h},"}</MD>
        <p>
          which is smallest near <M>{"h \\approx \\sqrt{\\varepsilon} \\approx 10^{-8}"}</M>, giving about 8 correct digits.
          For the central difference the best h is near <M>{"\\varepsilon^{1/3} \\approx 10^{-5}"}</M>, giving about 10 or 11
          digits.
        </p>
      </Theorem>

      <Example title="gradient checking">
        <p>
          Deep learning frameworks compute exact derivatives by the chain rule, but hand-written backward passes still need
          testing. The standard check compares them with central differences at <M>{"h \\approx 10^{-5}"}</M> in double
          precision, and reports the relative difference. In 32-bit floats, ε is about <M>{"10^{-7}"}</M>, the best attainable
          accuracy is far worse, and gradient checks done in low precision give misleading failures.
        </p>
      </Example>

      <Remark title="other everyday approximations">
        <p>
          <M>{"\\ln(1 + x) \\approx x"}</M> and <M>{"e^x - 1 \\approx x"}</M> for small x are first-order Taylor
          approximations. Computing <M>{"\\ln(1 + x)"}</M> naively for <M>{"x = 10^{-17}"}</M> gives 0, because{" "}
          <M>{"1 + x"}</M> rounds to 1; library functions <C>log1p</C> and <C>expm1</C> exist to avoid exactly this loss.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "order",
      rung: "check",
      prompt: <p>How does the truncation error of the central difference scale with h?</p>,
      answer: { kind: "choice", options: ["Like h²", "Like h", "Like h⁴", "It does not depend on h"], correct: [0] },
    },
    {
      key: "why",
      rung: "check",
      prompt: <p>Why does the error grow again when h becomes very small?</p>,
      answer: {
        kind: "choice",
        options: ["Rounding: the difference of two nearly equal values is dominated by rounding error, then divided by a tiny h", "The Taylor series stops converging", "The derivative changes"],
        correct: [0],
      },
    },
    {
      key: "fwd",
      rung: "apply",
      prompt: <p>Compute the forward difference of <M>{"f(x) = x^2"}</M> at <M>{"x = 3"}</M> with <M>{"h = 0.1"}</M>.</p>,
      answer: { kind: "numeric", value: 6.1, tolerance: 0.0001 },
    },
    {
      key: "ctr",
      rung: "apply",
      prompt: <p>Compute the central difference of <M>{"f(x) = x^3"}</M> at <M>{"x = 1"}</M> with <M>{"h = 0.1"}</M>.</p>,
      answer: { kind: "numeric", value: 3.01, tolerance: 0.0001 },
    },
    {
      key: "besth",
      rung: "apply",
      prompt: (
        <p>
          With <M>{"\\varepsilon = 10^{-16}"}</M>, the best step for a forward difference is about <M>{"\\sqrt\\varepsilon = 10^k"}</M>.
          What is k?
        </p>
      ),
      answer: { kind: "numeric", value: -8 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
x = 0.1
print(math.sin(x) - x, -x ** 3 / 6)`}</Code>
          <p>These two numbers agree to about four significant figures. Roughly what is the first?</p>
        </>
      ),
      answer: { kind: "choice", options: ["−0.000166", "0.1", "−0.1", "0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
x = 1e-8
a = math.sqrt(1 + x) - 1
b = x / (math.sqrt(1 + x) + 1)
c = x / 2 - x * x / 8
print(a, b, c)`}</Code>
          <p>√(1 + x) − 1 for tiny x, computed three ways. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["4.999999969612645e-09 4.99999998750000e-09 4.9999999875e-09", "5e-09 5e-09 5e-09", "0.0 4.9999999875e-09 4.9999999875e-09", "4.999999969612645e-09 4.9999999875e-09 4.9999999875e-09"], correct: [3] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            For tiny x, <C>1 - math.cos(x)</C> loses all its digits to cancellation. Write <C>one_minus_cos(x)</C> that uses the Taylor approximation x²/2 − x⁴/24 when |x| &lt; 10⁻³ and the direct formula otherwise.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def one_minus_cos(x):
    return 1 - math.cos(x)
`,
        solution: `import math

def one_minus_cos(x):
    if abs(x) < 1e-3:
        return x * x / 2 - x ** 4 / 24
    return 1 - math.cos(x)
`,
        tests: [
          { name: "tiny", code: `assert abs(one_minus_cos(1e-9) / 5e-19 - 1) < 1e-9, 'For x = 10⁻⁹ the answer is about 5 × 10⁻¹⁹, but the direct formula gives 0.'` },
          { name: "ordinary", code: `import math
assert abs(one_minus_cos(0.5) - (1 - math.cos(0.5))) < 1e-15, 'For ordinary x use the direct formula.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write accurate versions of three formulas that lose digits to cancellation: <C>log1p_series(x)</C>, log(1 + x) for |x| &lt; 0.5, using the series in u = x/(2 + x): log(1 + x) = 2(u + u³/3 + u⁵/5 + …); <C>sqrt1pm1(x)</C>, √(1 + x) − 1 written as x/(√(1 + x) + 1); and <C>cosm1(x)</C>, cos x − 1 written as −2 sin²(x/2). Each must agree with an exact reference to within a few ulps for x = 10⁻¹² as well as x = 0.4.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def log1p_series(x):
    return math.log(1 + x)

def sqrt1pm1(x):
    return math.sqrt(1 + x) - 1

def cosm1(x):
    return math.cos(x) - 1
`,
        solution: `import math

def log1p_series(x):
    u = x / (2 + x)
    term, s, k = u, 0.0, 1
    while abs(term) > 1e-18 * max(abs(s), 1e-300):
        s += term / k
        term *= u * u
        k += 2
        if k > 400:
            break
    return 2 * s

def sqrt1pm1(x):
    return x / (math.sqrt(1 + x) + 1)

def cosm1(x):
    return -2 * math.sin(x / 2) ** 2
`,
        tests: [
          { name: "log1p", code: `import math
for x in [1e-12, -3e-9, 1e-4, 0.4, -0.4]:
    assert abs(log1p_series(x) - math.log1p(x)) <= 1e-15 * abs(math.log1p(x)), x` },
          { name: "sqrt", code: `from decimal import Decimal, getcontext
getcontext().prec = 50
for x in [1e-12, 2.5e-7, 0.4]:
    ref = float((1 + Decimal(x)).sqrt() - 1)
    assert abs(sqrt1pm1(x) - ref) <= 4e-16 * abs(ref), x` },
          { name: "cos", code: `from decimal import Decimal, getcontext
getcontext().prec = 50
for x in [1e-6, 1e-3, 0.4]:
    X = Decimal(x)
    ref = float(sum((-1) ** k * X ** (2 * k) / __import__('math').factorial(2 * k) for k in range(1, 20)))
    assert abs(cosm1(x) - ref) <= 4e-16 * abs(ref), x` },
        ],
      },
    },
    {
      key: "derive",
      rung: "prove",
      prompt: (
        <p>
          Using Taylor expansions of <M>{"f(x + h)"}</M> and <M>{"f(x - h)"}</M>, show that{" "}
          <M>{"D_0(h) = f'(x) + \\tfrac16 f'''(x)h^2 + O(h^4)"}</M> for a smooth f. Then explain why the error of{" "}
          <M>{"D_0"}</M> applied to any quadratic is exactly 0.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes both expansions up to the h⁵ term (or with an O(h⁵) remainder).",
          "Subtracts: the even-power terms cancel, leaving 2f′h + (1/3)f‴h³ + O(h⁵).",
          "Divides by 2h to get the stated formula.",
          "Notes a quadratic has f‴ = 0 and all higher derivatives zero, so every error term vanishes.",
        ],
      },
    },
    {
      key: "richardson",
      rung: "stretch",
      prompt: (
        <p>
          Since <M>{"D_+(h) = f' + Ch + O(h^2)"}</M>, the combination <M>{"2D_+(h/2) - D_+(h)"}</M> cancels the error of order
          h. Compute it for <M>{"f(x) = x^2"}</M> at <M>{"x = 3"}</M> with <M>{"h = 0.1"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 6, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why a smaller step does not always give a better numerical derivative, and why the central difference is more accurate than the forward one.",

  glimpse: (
    <p>
      Next, Stirling&rsquo;s formula, an asymptotic approximation to n! that turns counting problems into calculus. Neural
      Networks from Scratch and Build a Deep Learning Framework use central differences to check every backward pass, and
      Numerical Linear Algebra and Scientific Computing explains floating-point rounding in full.
    </p>
  ),
};
