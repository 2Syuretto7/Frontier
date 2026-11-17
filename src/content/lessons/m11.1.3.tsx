import { M, MD } from "@/components/Math";
import { Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CancelQuadViz } from "@/components/viz/CancelQuadViz";
import type { LessonContent } from "@/lib/types";

const QR = `import numpy as np

def roots_naive(b, c):
    d = np.sqrt(b * b - c)
    return b - d, b + d

def roots_stable(b, c):
    d = np.sqrt(b * b - c)
    big = b + d if b >= 0 else b - d
    return c / big, big`;

const RW = `import math

def one_minus_cos(x):
    return 2 * math.sin(x / 2) ** 2

def sqrt_diff(x):
    return 1 / (math.sqrt(x + 1) + math.sqrt(x))

def cancel_factor(x, y):
    return (abs(x) + abs(y)) / abs(x - y)`;

export const lesson: LessonContent = {
  id: "m11.1.3",
  minutes: 45,
  links: {
    requires: ["m11.1.2"],
    revisits: ["m2.5.5"],
    foreshadows: ["m11.2.1", "m11.2.3"],
  },

  puzzle: (
    <>
      <p>
        In double precision, <C>1 - math.cos(1e-8)</C> is exactly 0, though the true value is 5 × 10⁻¹⁷. The quadratic
        formula from school, run in single precision on x² − 2000x + 1, gets the small root wrong in the third digit. Each
        operation involved is correctly rounded, with relative error below 10⁻¹⁶ or 10⁻⁷. How can a handful of nearly
        perfect operations produce an answer with no correct digits at all?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Subtracting two nearly equal numbers cancels their leading digits, which agree, and leaves the trailing digits,
        which are where the earlier rounding errors live. The subtraction itself is exact; it merely promotes old, tiny
        absolute errors into a result that is itself tiny, so the relative error explodes. The cure is almost never more
        precision. It is algebra: rewrite the formula so the subtraction happens before any rounding, or not at all.
      </p>
      <CancelQuadViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="error amplification in subtraction">
        <p>
          If <M>{"\\hat x = x(1 + \\delta_1)"}</M> and <M>{"\\hat y = y(1 + \\delta_2)"}</M> with{" "}
          <M>{"|\\delta_i| \\leq u"}</M>, then
        </p>
        <MD>{"\\frac{|(\\hat x - \\hat y) - (x - y)|}{|x - y|} \\leq u\\,\\frac{|x| + |y|}{|x - y|}."}</MD>
        <p>The factor (|x| + |y|)/|x − y| is huge exactly when x ≈ y.</p>
      </Theorem>
      <Proof>
        <p>
          <M>{"(\\hat x - \\hat y) - (x - y) = x\\delta_1 - y\\delta_2"}</M>, whose absolute value is at most{" "}
          <M>{"u(|x| + |y|)"}</M>. Divide by |x − y|.
        </p>
      </Proof>

      <Theorem title="Sterbenz lemma">
        <p>
          If x and y are floats with <M>{"y/2 \\leq x \\leq 2y"}</M>, then x − y is a float, so it is computed exactly.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take 0 &lt; y ≤ x ≤ 2y (the other case is symmetric). Write <M>{"y = m\\,2^{e-p}"}</M> with integer m and e the
          exponent of y (the subnormal exponent if y is subnormal). Since x ≥ y, the exponent of x is at least e, so x is also
          an integer multiple of <M>{"2^{e-p}"}</M>, and so is x − y. Moreover <M>{"0 \\leq x - y \\leq y"}</M>, so x − y is a
          multiple of <M>{"2^{e-p}"}</M> no larger than y, with at most p + 1 significant bits at that scale: a float.
        </p>
        <Code>{QR}</Code>
      </Proof>

      <Remark title="rewriting to avoid cancellation">
        <p>
          Together, the two results say the damage is done before the subtraction: it only exposes errors already in its
          inputs. Standard repairs: for the roots of <M>{"x^2 - 2bx + c"}</M>, compute the large root{" "}
          <M>{"b + \\mathrm{sign}(b)\\sqrt{b^2 - c}"}</M>, which adds numbers of the same sign, and get the small one from the
          product of the roots, c divided by the large one; <M>{"1 - \\cos x = 2\\sin^2(x/2)"}</M>;{" "}
          <M>{"\\sqrt{x + 1} - \\sqrt x = 1/(\\sqrt{x + 1} + \\sqrt x)"}</M>; and library functions <C>log1p</C> and{" "}
          <C>expm1</C> for log(1 + x) and eˣ − 1 with small x. In the code, single precision gives the small root 0.00048828125
          by the textbook formula against 0.00050000014 by the stable one, true value 0.000500000125; 1 − cos(10⁻⁸) is 0
          naively and 5 × 10⁻¹⁷ rewritten; and √(10¹² + 1) − √(10¹²) has an amplification factor of 2 × 10¹², costing about
          five of its sixteen digits.
        </p>
        <Code>{RW}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "factor",
      rung: "check",
      prompt: <p>What is the amplification factor (|x| + |y|)/|x − y| for x = 1.0001 and y = 1?</p>,
      answer: { kind: "numeric", value: 20001, tolerance: 0.5 },
    },
    {
      key: "cos",
      rung: "check",
      prompt: <p>In double precision 1 − cos(10⁻⁸) evaluates to 0. What is the relative error of that result?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "culprit",
      rung: "apply",
      prompt: <p>In catastrophic cancellation, what role does the subtraction itself play?</p>,
      answer: {
        kind: "choice",
        options: [
          "It is usually exact; it exposes rounding errors already present in its inputs",
          "It introduces a large rounding error of its own because the result is small",
          "It overflows when the inputs are close",
          "It rounds the result to zero whenever the inputs share their leading digits",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def roots_naive(b, c):
    d = np.sqrt(b * b - c)
    return b - d, b + d

def roots_stable(b, c):
    d = np.sqrt(b * b - c)
    big = b + d if b >= 0 else b - d
    return c / big, big

b, c = np.float32(1000.0), np.float32(1.0)
print(roots_naive(b, c)[0], roots_stable(b, c)[0], 1 / (1000 + (1000 ** 2 - 1) ** 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.00048828125 0.00050000014 0.0005000001250000625", "0.00050000014 0.00048828125 0.0005000001250000625", "0.0 0.00050000014 0.0005000001250000625", "0.00048828125 0.00048828125 0.0005000001250000625"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def one_minus_cos(x):
    return 2 * math.sin(x / 2) ** 2

def sqrt_diff(x):
    return 1 / (math.sqrt(x + 1) + math.sqrt(x))

def cancel_factor(x, y):
    return (abs(x) + abs(y)) / abs(x - y)

x = 1e-8
print(1 - math.cos(x), one_minus_cos(x), x * x / 2)
print(math.sqrt(1e12 + 1) - math.sqrt(1e12), sqrt_diff(1e12), f"{cancel_factor(1e12 + 1, 1e12):.1e}")`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.0 5.0000000000000005e-17 5.0000000000000005e-17\n5.00003807246685e-07 4.999999999998749e-07 2.0e+12", "5.0000000000000005e-17 5.0000000000000005e-17 5.0000000000000005e-17\n5.00003807246685e-07 4.999999999998749e-07 2.0e+12", "0.0 0.0 5.0000000000000005e-17\n5.00003807246685e-07 4.999999999998749e-07 2.0e+12", "0.0 5.0000000000000005e-17 5.0000000000000005e-17\n4.999999999998749e-07 4.999999999998749e-07 1.0e+12"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>roots_naive(b, c)</C> and <C>roots_stable(b, c)</C>, each returning (small root, large root) of x² − 2bx +
          c = 0 for b² &gt; c &gt; 0; the stable version forms the root of larger magnitude by adding numbers of the same sign
          and divides c by it.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def roots_naive(b, c):
    return 0.0, 0.0

def roots_stable(b, c):
    return 0.0, 0.0
`,
        solution: QR,
        tests: [
          { name: "exact", code: `s, l = roots_stable(3.0, 5.0)
assert abs(s - 1.0) < 1e-12 and abs(l - 5.0) < 1e-12 and np.allclose(roots_naive(3.0, 5.0), (1.0, 5.0))
s, l = roots_stable(-3.0, 5.0)
assert abs(s * l - 5.0) < 1e-12 and abs(s + l + 6.0) < 1e-12` },
          { name: "f32", code: `for bv in [100.0, 1000.0, 3000.0]:
    b, c = np.float32(bv), np.float32(1.0)
    true = 1 / (bv + (bv * bv - 1) ** 0.5)
    assert abs(float(roots_stable(b, c)[0]) - true) / true < 4e-7
assert abs(float(roots_naive(np.float32(3000.0), np.float32(1.0))[0]) - 1 / 6000) * 6000 > 0.01` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>one_minus_cos(x)</C> and <C>sqrt_diff(x)</C>, cancellation-free versions of 1 − cos x and √(x + 1) − √x,
          and <C>cancel_factor(x, y)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def one_minus_cos(x):
    return 1 - math.cos(x)

def sqrt_diff(x):
    return math.sqrt(x + 1) - math.sqrt(x)

def cancel_factor(x, y):
    return 0.0
`,
        solution: RW,
        tests: [
          { name: "small", code: `for x in [1e-3, 1e-6, 1e-9, 1e-12]:
    assert abs(one_minus_cos(x) / (x * x / 2) - 1) < 1e-6
assert abs(one_minus_cos(math.pi) - 2.0) < 1e-15` },
          { name: "big", code: `from fractions import Fraction
for x in [1e6, 1e12, 1e15]:
    v = sqrt_diff(x); t = 1 / (2 * math.sqrt(x)) * (1 - 1 / (4 * x))
    assert abs(v - t) / t < 1e-12
assert cancel_factor(1.0001, 1.0) > 20000 and cancel_factor(3.0, -1.0) == 1.0` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove the Sterbenz lemma: if x and y are positive floats with y/2 ≤ x ≤ 2y, then x − y is exactly representable.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Reduces to y ≤ x ≤ 2y by symmetry and writes y as an integer multiple of 2^(e−p), where e is the exponent of y.",
          "Argues that x, having exponent at least e, is also a multiple of 2^(e−p), so x − y is too.",
          "Uses 0 ≤ x − y ≤ y to conclude x − y fits in p + 1 significant bits at that scale, so it is a float.",
        ],
      },
    },
    {
      key: "rel",
      rung: "stretch",
      prompt: (
        <p>
          In double precision, √(10¹² + 1) − √(10¹²) computes to 5.00003807246685 × 10⁻⁷ and the accurate value is
          4.999999999998749 × 10⁻⁷. What is the relative error, in units of 10⁻⁶?
        </p>
      ),
      answer: { kind: "numeric", value: 7.6145, tolerance: 0.001 },
    },
  ],

  teachBack:
    "Explain to a friend why subtracting nearly equal numbers destroys relative accuracy even though the subtraction is exact, how the amplification factor (|x| + |y|)/|x − y| measures the damage, and how algebraic rewriting such as the stable quadratic formula avoids it.",

  glimpse: (
    <>
      <p>
        Cancellation is one instance of a general idea: some problems amplify small changes in their input, whatever the
        algorithm. The next chapter separates that sensitivity of the problem, its condition number, from the quality of the
        algorithm, its stability.
      </p>
    </>
  ),
};
