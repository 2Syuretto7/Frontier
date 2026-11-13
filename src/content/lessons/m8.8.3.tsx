import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RadiusViz } from "@/components/viz/RadiusViz";
import type { LessonContent } from "@/lib/types";

const RAD = `def radius_ratio(a, k):
    return abs(a(k) / a(k + 1))

def partial_sum(a, x, N):
    total, p = 0.0, 1.0
    for k in range(N + 1):
        total += a(k) * p
        p *= x
    return total`;

const TERMS = `def deriv_coeffs(c):
    return [k * c[k] for k in range(1, len(c))]

def integ_coeffs(c):
    return [0.0] + [c[k] / (k + 1) for k in range(len(c))]

def poly_eval(c, x):
    total = 0.0
    for coef in reversed(c):
        total = total * x + coef
    return total`;

export const lesson: LessonContent = {
  id: "m8.8.3",
  minutes: 65,
  links: {
    requires: ["m8.8.2", "m8.3.1", "m8.2.5"],
    revisits: ["m2.8.5", "m8.6.3"],
    foreshadows: ["m8.8.4"],
  },

  puzzle: (
    <>
      <p>
        1/(1 + x²) is smooth on the whole real line, with no blow-up anywhere. Yet its Taylor series 1 − x² + x⁴ − … converges
        only for |x| &lt; 1. What stops it at 1, when nothing visible happens to the function there? And inside that interval,
        why may the series be differentiated and integrated term by term, when the last lesson showed such swaps can fail?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A power series converges on an interval centred at 0 whose radius is set by how fast the coefficients grow: the root
        test compares the terms with a geometric series. Inside a slightly smaller interval the comparison is uniform, so the
        theorems of the last lesson apply. The radius for 1/(1 + x²) is fixed by the complex points ±i, where the function does
        blow up.
      </p>
      <RadiusViz />
    </>
  ),

  theory: (
    <>
      <Definition title="power series and radius of convergence">
        <p>
          A power series is <M>{"\\sum_{k \\geq 0} a_k x^k"}</M>. Its radius of convergence is
        </p>
        <MD>{"R = \\frac{1}{\\limsup_k |a_k|^{1/k}},"}</MD>
        <p>with R = ∞ if the limsup is 0 and R = 0 if it is ∞.</p>
      </Definition>

      <Theorem title="Cauchy–Hadamard">
        <p>The series converges absolutely for |x| &lt; R and diverges for |x| &gt; R.</p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\limsup |a_k x^k|^{1/k} = |x| \\limsup |a_k|^{1/k} = |x|/R"}</M>. The root test gives absolute convergence when this
          is below 1 and divergence (terms not tending to 0) when it is above 1. When <M>{"|a_k / a_{k+1}|"}</M> has a limit, that
          limit is R, which is often easier to compute. At |x| = R anything can happen: Σ xᵏ/k converges at −1 and diverges at 1.
        </p>
        <Code>{RAD}</Code>
      </Proof>

      <Theorem title="uniform convergence inside the radius">
        <p>For every r &lt; R the series converges uniformly on [−r, r].</p>
      </Theorem>
      <Proof>
        <p>
          On [−r, r], <M>{"|a_k x^k| \\leq |a_k| r^k = M_k"}</M>, and <M>{"\\sum M_k"}</M> converges by Cauchy–Hadamard at x = r.
          Apply the M-test. In particular the sum is continuous on (−R, R).
        </p>
      </Proof>

      <Theorem title="term-by-term differentiation and integration">
        <p>
          <M>{"f(x) = \\sum a_k x^k"}</M> is differentiable on (−R, R) with <M>{"f'(x) = \\sum k a_k x^{k-1}"}</M>, a series with
          the same radius, and <M>{"\\int_0^x f = \\sum a_k x^{k+1}/(k+1)"}</M>. Hence f has derivatives of all orders and{" "}
          <M>{"a_k = f^{(k)}(0)/k!"}</M>: a power series is the Taylor series of its sum.
        </p>
      </Theorem>
      <Proof>
        <p>
          Since <M>{"k^{1/k} \\to 1"}</M>, <M>{"\\limsup |k a_k|^{1/k} = \\limsup |a_k|^{1/k}"}</M>, so the derived series has
          radius R and converges uniformly on each [−r, r]. Its partial sums are the derivatives of those of f, so the
          derivative theorem of the last lesson gives f′ as claimed. Repeat for higher derivatives, and set x = 0 to read off{" "}
          <M>{"a_k"}</M>. Integration is the integral theorem applied on [0, x].
        </p>
      </Proof>

      <Example title="logarithm and arctangent">
        <p>
          Integrating <M>{"1/(1 + t) = \\sum (-t)^k"}</M> from 0 to x gives <M>{"\\ln(1 + x) = x - x^2/2 + x^3/3 - \\dots"}</M>, and
          integrating <M>{"1/(1 + t^2)"}</M> gives <M>{"\\arctan x = x - x^3/3 + x^5/5 - \\dots"}</M>, both for |x| &lt; 1. On
          coefficient lists, differentiation and integration are simple maps.
        </p>
        <Code>{TERMS}</Code>
      </Example>

      <Remark title="endpoints and Abel's theorem">
        <p>
          If the series converges at x = R, Abel&apos;s theorem says the sum is continuous from the left there. That is how{" "}
          <M>{"1 - 1/2 + 1/3 - \\dots = \\ln 2"}</M> and <M>{"1 - 1/3 + 1/5 - \\dots = \\pi/4"}</M> follow from the series above.
          Generating functions in combinatorics and moment generating functions in probability rely on these same facts.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "r1",
      rung: "check",
      prompt: <p>What is the radius of convergence of Σ k² xᵏ / 3ᵏ?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
    {
      key: "r2",
      rung: "check",
      prompt: <p>What is the radius of convergence of Σ (2ᵏ/k) xᵏ?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "ends",
      rung: "apply",
      prompt: <p>How does Σ_(k≥1) xᵏ/k behave at the endpoints of its interval of convergence?</p>,
      answer: {
        kind: "choice",
        options: ["It converges at x = −1 and diverges at x = 1", "It converges at both endpoints", "It diverges at both endpoints", "It converges at x = 1 and diverges at x = −1"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def radius_ratio(a, k):
    return abs(a(k) / a(k + 1))

def partial_sum(a, x, N):
    total, p = 0.0, 1.0
    for k in range(N + 1):
        total += a(k) * p
        p *= x
    return total

a_geo = lambda k: 1.0
a_exp = lambda k: 1 / math.factorial(k)
a_log = lambda k: (-1) ** (k + 1) / k if k else 0.0
print(radius_ratio(a_geo, 50), radius_ratio(a_exp, 50), round(radius_ratio(a_log, 1000), 3))
print(round(partial_sum(a_geo, 0.5, 30), 6), round(partial_sum(a_exp, 1, 15), 6), round(partial_sum(a_log, 0.5, 40), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.0 51.0 1.001\n2.0 2.718282 0.405465", "1.0 51.0 0.999\n2.0 2.718282 0.405465", "1.0 50.0 1.001\n2.0 2.718282 0.405465", "1.0 51.0 1.001\n2.0 2.718282 0.693147"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def deriv_coeffs(c):
    return [k * c[k] for k in range(1, len(c))]

def integ_coeffs(c):
    return [0.0] + [c[k] / (k + 1) for k in range(len(c))]

def poly_eval(c, x):
    total = 0.0
    for coef in reversed(c):
        total = total * x + coef
    return total

c = [1.0] * 6
print(deriv_coeffs(c), integ_coeffs([2, -2, 3, 4]))
L = integ_coeffs([(-1) ** k for k in range(60)])
print(round(poly_eval(L, 0.5), 6), poly_eval(deriv_coeffs(c), 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 2.0, 3.0, 4.0, 5.0] [0.0, 2.0, -1.0, 1.0, 1.0]\n0.405465 3.5625",
          "[0.0, 1.0, 2.0, 3.0, 4.0, 5.0] [0.0, 2.0, -1.0, 1.0, 1.0]\n0.405465 3.5625",
          "[1.0, 2.0, 3.0, 4.0, 5.0] [2.0, -1.0, 1.0, 1.0]\n0.405465 3.5625",
          "[1.0, 2.0, 3.0, 4.0, 5.0] [0.0, 2.0, -1.0, 1.0, 1.0]\n0.693147 3.5625",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          A coefficient function a gives the series Σ a(k)xᵏ. Write <C>radius_ratio(a, k)</C>, returning |a(k)/a(k + 1)|, and{" "}
          <C>partial_sum(a, x, N)</C>, the sum of a(k)xᵏ for k = 0, …, N, building the powers by repeated multiplication.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def radius_ratio(a, k):
    return 0

def partial_sum(a, x, N):
    return 0.0
`,
        solution: RAD,
        tests: [
          { name: "ratio", code: `assert radius_ratio(lambda k: 2.0 ** k, 10) == 0.5 and abs(radius_ratio(lambda k: (k + 1) / 3 ** k, 5) - 18 / 7) < 1e-12` },
          { name: "partial", code: `assert partial_sum(lambda k: 1.0, 2, 3) == 15.0 and partial_sum(lambda k: k, 1, 4) == 10` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          A coefficient list c represents Σ c[k]xᵏ. Write <C>deriv_coeffs(c)</C> and <C>integ_coeffs(c)</C> (with constant term
          0.0) for the derivative and the integral from 0, and <C>poly_eval(c, x)</C> by Horner&apos;s rule, returning 0.0 for an
          empty list.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def deriv_coeffs(c):
    return []

def integ_coeffs(c):
    return []

def poly_eval(c, x):
    return 0.0
`,
        solution: TERMS,
        tests: [
          { name: "maps", code: `assert deriv_coeffs([5, 3, 2]) == [3, 4] and integ_coeffs([2, 2]) == [0.0, 2.0, 1.0]` },
          { name: "eval", code: `assert poly_eval([1, 2, 3], 2) == 17 and poly_eval([], 3) == 0.0
c = [1, -3, 0, 2]
assert poly_eval(deriv_coeffs(integ_coeffs(c)), 0.7) == poly_eval(c, 0.7)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove: if <M>{"\\sum a_k x_0^k"}</M> converges for some <M>{"x_0 \\neq 0"}</M>, then <M>{"\\sum a_k x^k"}</M> converges
          absolutely for every |x| &lt; |x₀|.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes the terms a_k x₀ᵏ tend to 0, so they are bounded by some B.",
          "Bounds |a_k xᵏ| ≤ B (|x|/|x₀|)ᵏ.",
          "Concludes by comparison with a convergent geometric series, since |x|/|x₀| < 1.",
        ],
      },
    },
    {
      key: "sum",
      rung: "stretch",
      prompt: <p>Differentiate the geometric series to evaluate Σ_(k≥1) k/2ᵏ.</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how the radius of convergence comes from the root test, why a power series converges uniformly on smaller closed intervals, why it can be differentiated and integrated term by term, and why 1/(1 + x²) has radius 1.",

  glimpse: (
    <>
      <p>
        Power series approximate only very special functions. Weierstrass showed that polynomials nevertheless approximate
        every continuous function on a closed interval uniformly, and the next lesson proves it with a probabilistic
        construction.
      </p>
    </>
  ),
};
