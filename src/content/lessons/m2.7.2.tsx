import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem } from "@/components/lesson/Blocks";
import { PartialFracViz } from "@/components/viz/PartialFracViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.7.2",
  minutes: 60,
  links: {
    requires: ["m2.6.4"],
    revisits: ["m0.2.6"],
    foreshadows: ["m4.2.3"],
  },

  puzzle: (
    <>
      <p>
        Adding fractions is routine: <M>{"\\frac{1}{x - 1} - \\frac{1}{x + 2} = \\frac{3}{(x - 1)(x + 2)}"}</M>. Each fraction
        on the left is easy to integrate, giving a logarithm. The one on the right is not obviously anything.
      </p>
      <p>
        So the hard direction is the useful one: given a fraction like <M>{"\\frac{3}{(x - 1)(x + 2)}"}</M>, how do you find
        the simple fractions that add up to it, and is there always a way?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A rational function blows up at each root of its denominator. Near each root, it behaves like a simple fraction with
        just that factor below. The idea is to write it as a sum of one such piece per factor. Toggle the pieces below and see
        how each one accounts for one blow-up.
      </p>
      <PartialFracViz />
    </>
  ),

  theory: (
    <>
      <Definition title="proper rational functions">
        <p>
          A rational function <M>{"p(x)/q(x)"}</M> is <strong>proper</strong> if the degree of p is less than the degree of q.
          If not, divide first: polynomial long division writes it as a polynomial plus a proper fraction.
        </p>
      </Definition>

      <Theorem title="partial fractions">
        <p>
          Every proper rational function whose denominator factors into real linear and irreducible quadratic factors is a sum
          of terms of these kinds:
        </p>
        <ul>
          <li>for each factor <M>{"(x - r)^k"}</M>: <M>{"\\dfrac{A_1}{x - r} + \\dfrac{A_2}{(x - r)^2} + \\dots + \\dfrac{A_k}{(x - r)^k}"}</M>;</li>
          <li>for each irreducible <M>{"x^2 + bx + c"}</M>: a term <M>{"\\dfrac{Bx + C}{x^2 + bx + c}"}</M>.</li>
        </ul>
        <p>The proof is a matter of algebra, given in courses on polynomials; here we use the result.</p>
      </Theorem>

      <Example title="the cover-up rule">
        <p>Write <M>{"\\dfrac{3}{(x - 1)(x + 2)} = \\dfrac{A}{x - 1} + \\dfrac{B}{x + 2}"}</M>. Multiply by <M>{"(x - 1)"}</M>:</p>
        <MD>{"\\frac{3}{x + 2} = A + \\frac{B(x - 1)}{x + 2}."}</MD>
        <p>
          Put <M>{"x = 1"}</M>: <M>{"A = 1"}</M>. Likewise <M>{"B = 3/(-2 - 1) = -1"}</M>. In effect, cover the factor and
          substitute its root into what remains. So
        </p>
        <MD>{"\\int \\frac{3\\,dx}{(x - 1)(x + 2)} = \\ln|x - 1| - \\ln|x + 2| + C = \\ln\\left|\\frac{x - 1}{x + 2}\\right| + C."}</MD>
      </Example>

      <Example title="an irreducible quadratic">
        <p>
          <M>{"\\int \\frac{dx}{x^2 + 1} = \\arctan x + C"}</M>, by the derivative of arctan. Completing the square reduces
          any irreducible quadratic to this form: <M>{"x^2 + 2x + 5 = (x + 1)^2 + 4"}</M>.
        </p>
      </Example>

      <Remark title="the logistic equation">
        <p>
          A population, or an epidemic, that grows in proportion both to its size y and to the room left, <M>{"1 - y"}</M>,
          obeys <M>{"y' = y(1 - y)"}</M>. Separating, <M>{"\\int \\frac{dy}{y(1 - y)} = \\int dt"}</M>, and partial fractions
          give <M>{"\\ln\\frac{y}{1 - y} = t + C"}</M>. Solving for y gives the sigmoid, shifted: the S-curve of growth that
          saturates. The function <M>{"\\ln\\frac{y}{1 - y}"}</M>, the <strong>logit</strong>, is the inverse of the sigmoid,
          and is where the word for a network&rsquo;s raw output scores comes from.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "form",
      rung: "check",
      prompt: <p>What is the right form for decomposing <M>{"\\dfrac{5x + 1}{(x - 1)(x + 2)}"}</M>?</p>,
      answer: { kind: "choice", options: ["A/(x − 1) + B/(x + 2)", "(Ax + B)/(x − 1)", "A/((x − 1)(x + 2))", "Ax + B/(x + 2)"], correct: [0] },
    },
    {
      key: "improper",
      rung: "check",
      prompt: <p>What must you do first with <M>{"\\dfrac{x^3}{x^2 - 1}"}</M>?</p>,
      answer: { kind: "choice", options: ["Divide, since the numerator's degree is not less than the denominator's", "Complete the square", "Nothing; decompose it directly"], correct: [0] },
    },
    {
      key: "coverB",
      rung: "apply",
      prompt: <p>Write <M>{"\\dfrac{1}{x(x + 1)} = \\dfrac{A}{x} + \\dfrac{B}{x + 1}"}</M>. What is B?</p>,
      answer: { kind: "numeric", value: -1 },
    },
    {
      key: "def",
      rung: "apply",
      prompt: <p>Evaluate <M>{"\\int_2^3 \\dfrac{dx}{x(x - 1)}"}</M>. Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.2877, tolerance: 0.0002 },
    },
    {
      key: "telescope",
      rung: "apply",
      prompt: (
        <p>
          Partial fractions also work on sums. Using <M>{"\\dfrac{1}{n(n + 1)} = \\dfrac1n - \\dfrac{1}{n + 1}"}</M>, find{" "}
          <M>{"\\sum_{n=1}^{99} \\dfrac{1}{n(n + 1)}"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 0.99, tolerance: 0.0001 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import sympy as sp
x = sp.symbols('x')
print(sp.apart(1 / (x ** 2 - 1)))`}</Code>
          <p>What does sympy's partial fraction decomposition give for 1/(x² − 1)?</p>
        </>
      ),
      answer: { kind: "choice", options: ["−1/(2(x + 1)) + 1/(2(x − 1))", "1/(x − 1) + 1/(x + 1)", "1/(x − 1) − 1/(x + 1)", "1/(2x)"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`roots = [1, 2, 4]
A = []
for i, r in enumerate(roots):
    prod = 1
    for j, s in enumerate(roots):
        if j != i:
            prod *= r - s
    A.append(1 / prod)
print(A, abs(sum(A)) < 1e-12)`}</Code>
          <p>Partial fraction coefficients of 1/((x − 1)(x − 2)(x − 4)), and whether they sum to zero. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.3333333333333333, -0.5, 0.16666666666666666] True", "[0.3333333333333333, -0.5, 0.16666666666666666] False", "[3.0, -2.0, 6.0] False", "[0.3333333333333333, 0.5, 0.16666666666666666] False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            For distinct roots r₁, …, rₖ, 1/((x − r₁)⋯(x − rₖ)) = Σ Aᵢ/(x − rᵢ) with Aᵢ = 1/∏ⱼ≠ᵢ(rᵢ − rⱼ) (the cover-up rule). Write <C>coefficients(roots)</C> returning the list of Aᵢ.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def coefficients(roots):
    return [1.0 for r in roots]
`,
        solution: `def coefficients(roots):
    out = []
    for i, r in enumerate(roots):
        p = 1.0
        for j, s in enumerate(roots):
            if j != i:
                p *= r - s
        out.append(1 / p)
    return out
`,
        tests: [
          { name: "two", code: `assert [round(a, 12) for a in coefficients([1, -1])] == [0.5, -0.5], '1/(x² − 1) = (1/2)/(x − 1) − (1/2)/(x + 1).'` },
          { name: "check at a point", code: `rs = [0, 1, 3]; A = coefficients(rs); x = 7.0
assert abs(sum(a / (x - r) for a, r in zip(A, rs)) - 1 / ((x - 0) * (x - 1) * (x - 3))) < 1e-12, 'The decomposition must agree with the original at any x.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>partial_fractions(num, roots)</C> for a proper rational function num(x)/∏(x − rᵢ) with distinct real roots and a numerator given as coefficients highest power first: return the list of coefficients Aᵢ = num(rᵢ)/∏ⱼ≠ᵢ(rᵢ − rⱼ). Then write <C>integrate_rational(num, roots, a, b)</C>, the integral over an interval [a, b] containing none of the roots, as Σ Aᵢ log|(b − rᵢ)/(a − rᵢ)|.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def partial_fractions(num, roots):
    return [1.0] * len(roots)

def integrate_rational(num, roots, a, b):
    return 0.0
`,
        solution: `import math

def ev(p, x):
    r = 0.0
    for c in p:
        r = r * x + c
    return r

def partial_fractions(num, roots):
    out = []
    for i, r in enumerate(roots):
        d = 1.0
        for j, s in enumerate(roots):
            if j != i:
                d *= r - s
        out.append(ev(num, r) / d)
    return out

def integrate_rational(num, roots, a, b):
    A = partial_fractions(num, roots)
    return sum(c * math.log(abs((b - r) / (a - r))) for c, r in zip(A, roots))
`,
        tests: [
          { name: "simple", code: `A = partial_fractions([1], [1, 2, 4])
assert all(abs(a - b) < 1e-15 for a, b in zip(A, [1 / 3, -1 / 2, 1 / 6])), '1/((x − 1)(x − 2)(x − 4)).'` },
          { name: "numerator", code: `A = partial_fractions([2, 3], [-1, 1])
assert all(abs(a - b) < 1e-15 for a, b in zip(A, [-0.5, 2.5])), '(2x + 3)/((x + 1)(x − 1)).'` },
          { name: "identity", code: `import random
random.seed(1)
num, roots = [3, -1, 2], [0.5, -2, 3, 7]
A = partial_fractions(num, roots)
for _ in range(20):
    x = random.uniform(-5, 10)
    if min(abs(x - r) for r in roots) > 0.1:
        lhs = (3 * x * x - x + 2) / ((x - 0.5) * (x + 2) * (x - 3) * (x - 7))
        assert abs(lhs - sum(a / (x - r) for a, r in zip(A, roots))) < 1e-9 * max(1, abs(lhs))` },
          { name: "integral", code: `import math
v = integrate_rational([1], [-1, 1], 2, 5)
assert abs(v - 0.5 * math.log((4 / 6) / (1 / 3))) < 1e-15, 'The integral of 1/(x² − 1) on [2, 5].'` },
        ],
      },
    },
    {
      key: "logistic",
      rung: "prove",
      prompt: (
        <p>
          Show that <M>{"\\dfrac{1}{y(1 - y)} = \\dfrac1y + \\dfrac{1}{1 - y}"}</M>, and use it to solve{" "}
          <M>{"y' = y(1 - y)"}</M> with <M>{"y(0) = \\tfrac12"}</M>, for <M>{"0 < y < 1"}</M>. Identify the solution.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Verifies the decomposition by putting the right side over the common denominator y(1 − y).",
          "Separates variables and integrates to get ln y − ln(1 − y) = t + C.",
          "Uses y(0) = ½ to find C = 0.",
          "Solves y/(1 − y) = eᵗ to get y = 1/(1 + e⁻ᵗ), the sigmoid.",
        ],
      },
    },
    {
      key: "two",
      rung: "stretch",
      prompt: <p>Evaluate <M>{"\\int_0^1 \\dfrac{x}{(x + 1)(x + 2)}\\,dx"}</M>. Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.1178, tolerance: 0.0003 },
    },
  ],

  teachBack:
    "Explain to a friend how to split a fraction like 3/((x − 1)(x + 2)) into simple pieces, why that makes it easy to integrate, and how it solves the logistic equation.",

  glimpse: (
    <p>
      Next, improper integrals, over infinite intervals or past points where the integrand blows up. Partial fractions return
      in Discrete Mathematics, where the generating function of a recurrence is split the same way to find an exact formula
      for its terms.
    </p>
  ),
};
