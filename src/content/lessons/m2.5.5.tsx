import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { LHopitalViz } from "@/components/viz/LHopitalViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.5.5",
  minutes: 80,
  links: {
    revisits: ["m2.2.3", "m2.5.1"],
    foreshadows: ["m2.8.5", "m8.6.3"],
  },

  puzzle: (
    <>
      <p>
        What happens to <M>{"\\dfrac{\\sin 3x}{\\sin 5x}"}</M> as x approaches 0? Top and bottom both approach 0, and 0/0
        tells you nothing: a quotient of two small numbers can be anything at all.
      </p>
      <p>
        The limit laws give up here, because the limit of the bottom is 0. Yet the answer is surely decided by how fast
        each part approaches 0. How can that race be measured?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Near 0, a differentiable function that vanishes at 0 looks like a straight line through the origin, with slope its
        derivative. So near 0, <M>{"\\sin 3x \\approx 3x"}</M> and <M>{"\\sin 5x \\approx 5x"}</M>, and their quotient is
        about <M>{"3x/5x = 3/5"}</M>. The ratio of two vanishing functions is governed by the ratio of their slopes.
      </p>
      <LHopitalViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="L'Hôpital's rule, 0/0 form">
        <p>
          Let f and g be differentiable on an open interval around a, except perhaps at a, with{" "}
          <M>{"f(x) \\to 0"}</M> and <M>{"g(x) \\to 0"}</M> as <M>{"x \\to a"}</M>, and <M>{"g'(x) \\ne 0"}</M> near a
          (except perhaps at a). If
        </p>
        <MD>{"\\lim_{x \\to a} \\frac{f'(x)}{g'(x)} = L, \\qquad \\text{then} \\qquad \\lim_{x \\to a} \\frac{f(x)}{g(x)} = L."}</MD>
        <p>The same holds for one-sided limits, for limits as <M>{"x \\to \\pm\\infty"}</M>, and for L infinite.</p>
      </Theorem>

      <Proof>
        <p>
          Define <M>{"f(a) = g(a) = 0"}</M>, which makes both continuous at a. Take x close to a, say <M>{"x > a"}</M>. By
          Cauchy&rsquo;s mean value theorem (the stretch exercise of the mean value theorem lesson) on{" "}
          <M>{"[a, x]"}</M>, there is a c between a and x with
        </p>
        <MD>{"\\frac{f(x)}{g(x)} = \\frac{f(x) - f(a)}{g(x) - g(a)} = \\frac{f'(c)}{g'(c)}."}</MD>
        <p>
          (Here <M>{"g(x) \\ne 0"}</M>, since otherwise Rolle&rsquo;s theorem would give a zero of g&prime; between a and
          x.) As <M>{"x \\to a"}</M>, c is squeezed towards a, so <M>{"f'(c)/g'(c) \\to L"}</M>. The case{" "}
          <M>{"x < a"}</M> is the same.
        </p>
      </Proof>

      <Theorem title="the ∞/∞ form">
        <p>
          If instead <M>{"|g(x)| \\to \\infty"}</M>, with the other hypotheses as before, the same conclusion holds. The proof
          is longer, and is given in Real Analysis.
        </p>
      </Theorem>

      <Example title="using the rule">
        <ul>
          <li>
            <M>{"\\displaystyle \\lim_{x \\to 0} \\frac{\\sin 3x}{\\sin 5x} = \\lim_{x \\to 0} \\frac{3\\cos 3x}{5 \\cos 5x} = \\frac{3}{5}"}</M>.
          </li>
          <li>
            Sometimes the rule must be applied more than once:{" "}
            <M>{"\\displaystyle \\lim_{x \\to 0} \\frac{x - \\sin x}{x^3} = \\lim \\frac{1 - \\cos x}{3x^2} = \\lim \\frac{\\sin x}{6x} = \\frac{1}{6}"}</M>.
            Each step is again of the form 0/0, until the last, where a known limit finishes the job.
          </li>
          <li>
            Other indeterminate forms can be rewritten as quotients:{" "}
            <M>{"x \\cdot \\cot x = \\dfrac{x}{\\tan x}"}</M>, a 0/0 form at 0, with limit{" "}
            <M>{"\\lim 1/(1 + \\tan^2 x) = 1"}</M>.
          </li>
        </ul>
      </Example>

      <Remark title="three warnings">
        <ol>
          <li>
            Check the form first. <M>{"\\dfrac{x + 1}{x}"}</M> as <M>{"x \\to 0^+"}</M> is not indeterminate; it tends to{" "}
            <M>{"\\infty"}</M>. Applying the rule anyway gives the false answer <M>{"1/1 = 1"}</M>.
          </li>
          <li>
            The rule differentiates top and bottom separately. It is not the quotient rule.
          </li>
          <li>
            Beware of circles. Using the rule to find <M>{"\\lim \\sin x / x"}</M> needs the derivative of sin at 0, but
            that derivative was computed from this very limit. The rule cannot prove what it presupposes.
          </li>
        </ol>
      </Remark>

      <Remark title="whose rule?">
        <p>
          The rule appeared in the first calculus textbook, <cite>Analyse des infiniment petits</cite> (1696), by the
          Marquis de l&rsquo;Hôpital. It was discovered by Johann Bernoulli, whom l&rsquo;Hôpital paid for lessons and for
          the right to use his results. Their correspondence, published long afterwards, showed whose the rule was. The name
          has stuck anyway.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "quadratic",
      rung: "check",
      prompt: (
        <p>
          Find <M>{"\\displaystyle \\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2}"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "form",
      rung: "check",
      prompt: <p>For which of these limit forms may L&rsquo;Hôpital&rsquo;s rule be applied directly?</p>,
      answer: { kind: "choice", options: ["0/0", "1/0", "0/1", "∞/1"], correct: [0] },
    },
    {
      key: "cos",
      rung: "apply",
      prompt: (
        <p>
          Find <M>{"\\displaystyle \\lim_{x \\to 0} \\frac{1 - \\cos x}{x^2}"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 0.5 },
    },
    {
      key: "cubic",
      rung: "apply",
      prompt: (
        <p>
          Find <M>{"\\displaystyle \\lim_{x \\to 0} \\frac{x - \\sin x}{x^3}"}</M>. (Give a decimal or a fraction.)
        </p>
      ),
      answer: { kind: "numeric", value: 1 / 6, tolerance: 0.001 },
    },
    {
      key: "sqrt",
      rung: "apply",
      prompt: (
        <p>
          Find <M>{"\\displaystyle \\lim_{x \\to 0} \\frac{\\sqrt{1 + x} - 1}{x}"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 0.5 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
x = 1e-4
print(round((1 - math.cos(x)) / x ** 2, 4))`}</Code>
          <p>L'Hôpital twice gives the limit of (1 − cos x)/x² at 0. What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
f = lambda x: (math.exp(x) - 1 - x) / x ** 2
for x in (1e-1, 1e-3, 1e-7):
    print(round(f(x), 4))`}</Code>
          <p>L'Hôpital twice gives the limit ½ at 0, but floating point disagrees for tiny x. What is the last value printed?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.4943", "0.5", "0.5002", "0.5171"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>lhopital(df, dg, a)</C>, which returns f′(a)/g′(a), the limit of f/g at a when f(a) = g(a) = 0 and g′(a) ≠ 0.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def lhopital(df, dg, a):
    return 0.0
`,
        solution: `def lhopital(df, dg, a):
    return df(a) / dg(a)
`,
        tests: [
          { name: "sine", code: `import math
assert abs(lhopital(math.cos, lambda x: 1.0, 0) - 1) < 1e-12, 'sin x / x at 0: cos 0 / 1 = 1.'` },
          { name: "exp", code: `import math
assert abs(lhopital(math.exp, lambda x: 2.0, 0) - 0.5) < 1e-12, '(eˣ − 1)/(2x) at 0: e⁰/2 = 1/2.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>lhopital_limit(fs, gs, a)</C>, where <C>fs</C> = [f, f′, f″, …] and <C>gs</C> = [g, g′, g″, …] are lists of the same length: apply L&rsquo;Hôpital&rsquo;s rule repeatedly, moving to the next derivatives while both values at a are 0 (to within 1e−12), and return fₖ(a)/gₖ(a) at the first k where gₖ(a) ≠ 0. Return <C>None</C> if fₖ(a) ≠ 0 = gₖ(a) (an infinite limit) or the lists run out. Then write <C>expm1_over(x)</C>, an accurate value of (eˣ − 1 − x)/x² for any x, switching to its Taylor series Σ xᵏ/(k + 2)! for |x| &lt; 1.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def lhopital_limit(fs, gs, a):
    return fs[0](a) / gs[0](a)

def expm1_over(x):
    return (math.exp(x) - 1 - x) / x ** 2
`,
        solution: `import math

def lhopital_limit(fs, gs, a):
    for f, g in zip(fs, gs):
        fa, ga = f(a), g(a)
        if abs(ga) > 1e-12:
            return fa / ga
        if abs(fa) > 1e-12:
            return None
    return None

def expm1_over(x):
    if abs(x) < 1:
        term, s, k = 0.5, 0.0, 0
        while abs(term) > 1e-18:
            s += term
            k += 1
            term *= x / (k + 2)
        return s
    return (math.expm1(x) - x) / x ** 2
`,
        tests: [
          { name: "once", code: `import math
assert abs(lhopital_limit([math.sin, math.cos], [lambda x: x, lambda x: 1], 0) - 1) < 1e-15, 'sin x / x → 1.'` },
          { name: "twice", code: `import math
fs = [lambda x: math.exp(x) - 1 - x, lambda x: math.exp(x) - 1, math.exp]
gs = [lambda x: x * x, lambda x: 2 * x, lambda x: 2]
assert abs(lhopital_limit(fs, gs, 0) - 0.5) < 1e-15, 'Differentiate until the denominator is non-zero.'` },
          { name: "infinite", code: `import math
assert lhopital_limit([math.cos, lambda x: -math.sin(x)], [lambda x: x, lambda x: 1], 0) is None, 'cos x / x has no finite limit.'` },
          { name: "accurate", code: `from fractions import Fraction
import math
for x in [1e-9, -1e-6, 1e-4, 0.01, 0.5, -2, 10]:
    exact = sum(Fraction(x) ** k / math.factorial(k + 2) for k in range(60))
    assert abs(expm1_over(x) - float(exact)) < 1e-14 * abs(float(exact)), x` },
        ],
      },
    },
    {
      key: "proof",
      rung: "prove",
      prompt: (
        <p>
          Assume Cauchy&rsquo;s mean value theorem. Prove the 0/0 form of L&rsquo;Hôpital&rsquo;s rule for the limit as{" "}
          <M>{"x \\to a^+"}</M>, in the case where f and g are continuous at a with <M>{"f(a) = g(a) = 0"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Applies Cauchy's mean value theorem on [a, x] to write f(x)/g(x) = f′(c)/g′(c) for some c in (a, x).",
          "Notes that g(x) ≠ 0 (by Rolle's theorem, since g′ ≠ 0), so the quotient makes sense.",
          "Argues that c → a as x → a⁺, so the quotient tends to L.",
        ],
      },
    },
    {
      key: "fails",
      rung: "stretch",
      prompt: (
        <p>
          Show that <M>{"\\dfrac{x + \\sin x}{x} \\to 1"}</M> as <M>{"x \\to \\infty"}</M>, but that the quotient of
          derivatives <M>{"1 + \\cos x"}</M> has no limit. Does this contradict L&rsquo;Hôpital&rsquo;s rule?
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes the quotient as 1 + (sin x)/x and uses |sin x| ≤ 1 to show it tends to 1.",
          "Notes that 1 + cos x oscillates between 0 and 2, so has no limit.",
          "Explains there is no contradiction: the rule says that if f′/g′ has a limit then so does f/g, not the converse.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why the limit of a quotient of two vanishing functions is decided by their derivatives, using the picture of two graphs that look like straight lines when you zoom in.",

  glimpse: (
    <p>
      This completes the uses of derivatives. Next, integrals: area under a curve, built from thin strips. Applying L&rsquo;Hôpital&rsquo;s rule again and again is a clumsy way of comparing the polynomials that best approximate f and g. Taylor series, later in this course, make that comparison directly.
    </p>
  ),
};
