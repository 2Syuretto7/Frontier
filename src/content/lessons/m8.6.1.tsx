import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DiffQuotientViz } from "@/components/viz/DiffQuotientViz";
import type { LessonContent } from "@/lib/types";

const DIFF = `def forward(f, x, h):
    return (f(x + h) - f(x)) / h

def central(f, x, h):
    return (f(x + h) - f(x - h)) / (2 * h)

def errors(f, df, x, hs, rule):
    return [abs(rule(f, x, h) - df(x)) for h in hs]`;

const WILD = `import math

def g(x):
    return x * x * math.sin(1 / x) if x != 0 else 0.0

def g_prime(x):
    if x == 0:
        return 0.0
    return 2 * x * math.sin(1 / x) - math.cos(1 / x)`;

export const lesson: LessonContent = {
  id: "m8.6.1",
  minutes: 60,
  links: {
    requires: ["m8.5.1", "m8.5.2"],
    revisits: ["m2.4.1", "m2.4.3"],
    foreshadows: ["m8.6.2", "m8.6.3", "m8.8.2"],
  },

  puzzle: (
    <>
      <p>
        The function x² sin(1/x), with value 0 at 0, wiggles infinitely often near 0. Is it differentiable there? It is, with
        derivative 0. Yet its derivative, computed by the usual rules away from 0, does not tend to 0; it keeps swinging
        between about −1 and 1. So a function can be differentiable everywhere with a derivative that is not continuous.
        Settling questions like this needs the definition, not the rules.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The derivative at c is the limit of the difference quotient (f(c + h) − f(c))/h as h → 0. Plot that quotient as a
        function of h and ask whether it has a limit at 0, exactly as in the functional-limits lesson. Squeezing, oscillation
        and jumps all show up in the plot.
      </p>
      <DiffQuotientViz />
    </>
  ),

  theory: (
    <>
      <Definition title="derivative">
        <p>Let f be defined on an interval A containing c. f is differentiable at c if the limit</p>
        <MD>{"f'(c) = \\lim_{x \\to c} \\frac{f(x) - f(c)}{x - c}"}</MD>
        <p>exists. If c is an endpoint of A, the limit is one-sided.</p>
      </Definition>

      <Theorem title="differentiable implies continuous">
        <p>If f is differentiable at c, then f is continuous at c.</p>
      </Theorem>
      <Proof>
        <p>
          For x ≠ c, <M>{"f(x) - f(c) = \\frac{f(x) - f(c)}{x - c} \\cdot (x - c) \\to f'(c) \\cdot 0 = 0"}</M> by the algebraic
          limit theorem. The converse fails: |x| is continuous but not differentiable at 0.
        </p>
      </Proof>

      <Theorem title="Carathéodory's form">
        <p>
          f is differentiable at c if and only if there is a function φ, continuous at c, with{" "}
          <M>{"f(x) - f(c) = \\varphi(x)(x - c)"}</M> for all x in A. Then φ(c) = f′(c).
        </p>
      </Theorem>
      <Proof>
        <p>
          Given f′(c), let φ be the difference quotient for x ≠ c and φ(c) = f′(c); it is continuous at c by definition of the
          limit. Conversely, for x ≠ c the quotient equals φ(x), which tends to φ(c).
        </p>
      </Proof>

      <Theorem title="chain rule">
        <p>If f is differentiable at c and g at f(c), then g ∘ f is differentiable at c with derivative g′(f(c)) f′(c).</p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"f(x) - f(c) = \\varphi(x)(x - c)"}</M> and <M>{"g(y) - g(f(c)) = \\psi(y)(y - f(c))"}</M> with φ continuous at
          c and ψ continuous at f(c). Substituting y = f(x),
        </p>
        <MD>{"g(f(x)) - g(f(c)) = \\psi(f(x))\\,\\varphi(x)\\,(x - c)."}</MD>
        <p>
          ψ ∘ f is continuous at c because f is, so the product ψ(f(x))φ(x) is continuous at c with value g′(f(c)) f′(c). By
          Carathéodory's form this is the derivative. The usual proof, dividing by f(x) − f(c), breaks when that is 0 for x
          near c; this one does not.
        </p>
      </Proof>

      <Example title="a discontinuous derivative">
        <p>
          For g(x) = x² sin(1/x), g(0) = 0: the quotient g(h)/h = h sin(1/h) is squeezed to 0, so g′(0) = 0. For x ≠ 0 the
          rules give <M>{"g'(x) = 2x \\sin(1/x) - \\cos(1/x)"}</M>, which takes the values −1 and 1 at the points{" "}
          <M>{"1/(k\\pi)"}</M> for even and odd k, arbitrarily close to 0. So g′ exists everywhere and is not continuous at 0.
        </p>
        <Code>{WILD}</Code>
      </Example>

      <Remark title="derivatives cannot jump">
        <p>
          Darboux's theorem says a derivative, continuous or not, has the intermediate value property: if g′(a) &lt; y &lt; g′(b)
          then g′(c) = y for some c between. So a derivative can oscillate, as above, but it can never have a simple jump like
          the sign function's. In particular the sign function is not the derivative of anything on an interval containing 0.
        </p>
      </Remark>

      <Example title="numerical derivatives">
        <p>
          Replacing the limit by a small h gives the forward difference, with error proportional to h, and the central
          difference, with error proportional to h², as Taylor's theorem in two lessons' time will show. Shrinking h
          indefinitely does not help in floating point: f(x + h) − f(x) loses digits to cancellation, so the error eventually
          grows again. Automatic differentiation avoids the trade-off by applying the chain rule exactly.
        </p>
        <Code>{DIFF}</Code>
      </Example>
    </>
  ),

  practice: [
    {
      key: "fwd",
      rung: "check",
      prompt: <p>What is the forward difference (e^0.1 − e^0)/0.1? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 1.0517, tolerance: 0.0001 },
    },
    {
      key: "phi",
      rung: "check",
      prompt: <p>For f(x) = x³ + 2x, write f(x) − f(1) = φ(x)(x − 1) with φ continuous at 1. What is φ(1)?</p>,
      answer: { kind: "numeric", value: 5, tolerance: 0.0001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which of these functions is differentiable at 0?</p>,
      answer: { kind: "choice", options: ["x|x|", "|x|", "x sin(1/x), with value 0 at 0", "√|x|"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def forward(f, x, h):
    return (f(x + h) - f(x)) / h

def central(f, x, h):
    return (f(x + h) - f(x - h)) / (2 * h)

def errors(f, df, x, hs, rule):
    return [abs(rule(f, x, h) - df(x)) for h in hs]

print(round(forward(math.exp, 0, 0.1), 4), round(central(math.exp, 0, 0.1), 4))
print([f"{e:.1e}" for e in errors(math.exp, math.exp, 0, [0.1, 0.01], forward)], [f"{e:.1e}" for e in errors(math.exp, math.exp, 0, [0.1, 0.01], central)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0517 1.0017\n['5.2e-02', '5.0e-03'] ['1.7e-03', '1.7e-05']",
          "1.0517 1.0017\n['5.2e-02', '5.0e-03'] ['1.7e-03', '1.7e-04']",
          "1.0517 1.0517\n['5.2e-02', '5.0e-03'] ['5.2e-02', '5.0e-03']",
          "1.0017 1.0517\n['1.7e-03', '1.7e-05'] ['5.2e-02', '5.0e-03']",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def g(x):
    return x * x * math.sin(1 / x) if x != 0 else 0.0

def g_prime(x):
    if x == 0:
        return 0.0
    return 2 * x * math.sin(1 / x) - math.cos(1 / x)

print(g(0), round(g(0.001) / 0.001, 6))
print([round(g_prime(1 / (k * math.pi)), 4) for k in (100, 101, 102)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.0 0.000827\n[-1.0, 1.0, -1.0]", "0.0 0.000827\n[1.0, -1.0, 1.0]", "0.0 0.0\n[-1.0, 1.0, -1.0]", "0.0 0.000827\n[0.0, 0.0, 0.0]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>forward(f, x, h)</C> and <C>central(f, x, h)</C>, the forward and central difference quotients, and{" "}
          <C>errors(f, df, x, hs, rule)</C>, the list of |rule(f, x, h) − df(x)| for h in hs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def forward(f, x, h):
    return 0

def central(f, x, h):
    return 0

def errors(f, df, x, hs, rule):
    return []
`,
        solution: DIFF,
        tests: [
          { name: "rules", code: `assert forward(lambda x: x * x, 1, 0.5) == 2.5 and central(lambda x: x * x, 1, 0.5) == 2.0` },
          { name: "errors", code: `e = errors(lambda x: x ** 3, lambda x: 3 * x * x, 1, [0.1, 0.05], central)
assert len(e) == 2 and abs(e[0] - 0.01) < 1e-9 and abs(e[1] - 0.0025) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>g(x)</C>, equal to x² sin(1/x) for x ≠ 0 and 0.0 at 0, and <C>g_prime(x)</C>, its derivative: 0.0 at 0 and
          2x sin(1/x) − cos(1/x) elsewhere.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def g(x):
    return 0.0

def g_prime(x):
    return 0.0
`,
        solution: WILD,
        tests: [
          { name: "g", code: `import math
assert g(0) == 0 and abs(g(0.5) - 0.25 * math.sin(2)) < 1e-12` },
          { name: "prime", code: `import math
h = 1e-6
assert abs((g(0.3 + h) - g(0.3 - h)) / (2 * h) - g_prime(0.3)) < 1e-5
assert g_prime(0) == 0 and abs(g_prime(1 / (100 * math.pi)) + 1) < 1e-9` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove the chain rule: if f is differentiable at c and g at f(c), then (g ∘ f)′(c) = g′(f(c)) f′(c).</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes f(x) − f(c) = φ(x)(x − c) and g(y) − g(f(c)) = ψ(y)(y − f(c)) with φ, ψ continuous at c, f(c) (or handles the case f(x) = f(c) another valid way).",
          "Substitutes y = f(x) to get g(f(x)) − g(f(c)) = ψ(f(x))φ(x)(x − c).",
          "Uses continuity of f at c to conclude ψ(f(x))φ(x) → ψ(f(c))φ(c) = g′(f(c))f′(c), so this is the derivative.",
        ],
      },
    },
    {
      key: "cent",
      rung: "stretch",
      prompt: <p>The central difference of x³ at 1 has error exactly h². What is the error for h = 0.05?</p>,
      answer: { kind: "numeric", value: 0.0025, tolerance: 0.000001 },
    },
  ],

  teachBack:
    "Explain to a friend the definition of the derivative as a limit, why differentiable implies continuous, Carathéodory's form and how it gives a clean proof of the chain rule, and the example of a derivative that exists everywhere but is not continuous.",

  glimpse: (
    <>
      <p>
        The derivative is defined at a point, but its power comes from global statements: zero derivative means constant,
        positive derivative means increasing. All of these follow from the mean value theorem, proved next from Rolle's
        theorem and the extreme value theorem.
      </p>
    </>
  ),
};
