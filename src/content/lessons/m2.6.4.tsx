import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { SubstitutionViz } from "@/components/viz/SubstitutionViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.6.4",
  minutes: 60,
  links: {
    requires: ["m2.6.3", "m2.4.3"],
    foreshadows: ["m5.7.3", "m7.3.4"],
  },

  puzzle: (
    <>
      <p>
        The fundamental theorem turns an integral into a search for an antiderivative. For{" "}
        <M>{"\\int 2x \\cos(x^2)\\,dx"}</M>, no rule from the derivatives chapter seems to apply directly: it is a product,
        and the cosine has <M>{"x^2"}</M> inside it.
      </p>
      <p>
        Yet you have seen this shape before, on the other side of a derivative. Where, and how can that memory be turned into
        a method?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The chain rule says <M>{"\\frac{d}{dx}\\sin(x^2) = \\cos(x^2) \\cdot 2x"}</M>. So the integrand is a derivative of a
        composite function, and its antiderivative is <M>{"\\sin(x^2)"}</M>. Substitution is the chain rule read backwards:
        rename the inside function u, and the factor 2x dx becomes du. Geometrically, it changes the horizontal axis, and
        stretches each strip of area to compensate.
      </p>
      <SubstitutionViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="substitution">
        <p>
          Let g have a continuous derivative on <M>{"[a, b]"}</M>, and let f be continuous on the range of g. Then
        </p>
        <MD>{"\\int_a^b f\\bigl(g(x)\\bigr)\\, g'(x)\\,dx = \\int_{g(a)}^{g(b)} f(u)\\,du."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let F be an antiderivative of f, which exists by the fundamental theorem. By the chain rule,{" "}
          <M>{"\\frac{d}{dx} F(g(x)) = f(g(x))\\, g'(x)"}</M>, so the left side is{" "}
          <M>{"F(g(b)) - F(g(a))"}</M> by the fundamental theorem again. So is the right side.
        </p>
      </Proof>

      <Remark title="the bookkeeping">
        <p>
          In practice: choose u = g(x), write <M>{"du = g'(x)\\,dx"}</M>, replace everything in x by u, and change the limits
          from <M>{"a, b"}</M> to <M>{"g(a), g(b)"}</M>. Leibniz&rsquo;s notation makes this look like cancelling fractions;
          the theorem is what justifies it. For an indefinite integral, substitute back at the end.
        </p>
      </Remark>

      <Example title="three substitutions">
        <ul>
          <li>
            <M>{"\\int_0^1 x e^{-x^2}\\,dx"}</M>: put <M>{"u = x^2"}</M>, <M>{"du = 2x\\,dx"}</M>. It becomes{" "}
            <M>{"\\tfrac12\\int_0^1 e^{-u}\\,du = \\tfrac12(1 - e^{-1})"}</M>.
          </li>
          <li>
            <M>{"\\int \\tan x\\,dx = \\int \\frac{\\sin x}{\\cos x}\\,dx"}</M>: put <M>{"u = \\cos x"}</M>,{" "}
            <M>{"du = -\\sin x\\,dx"}</M>, giving <M>{"-\\ln|\\cos x| + C"}</M>.
          </li>
          <li>
            Linear substitutions: <M>{"\\int f(ax + b)\\,dx = \\tfrac1a F(ax + b) + C"}</M>. Shifting a graph does not change
            its area; squeezing it by a factor a divides the area by a.
          </li>
        </ul>
      </Example>

      <Remark title="where this leads">
        <p>
          The factor <M>{"g'(x)"}</M> measures how much the substitution stretches lengths. In several variables it becomes the
          absolute value of a determinant, the Jacobian, which says how much a change of variables stretches areas and volumes.
          The same factor tells you how a probability density changes when a random variable is transformed, which is how
          normalising flows, a family of generative models, compute exact likelihoods.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "reverse",
      rung: "check",
      prompt: <p>Substitution is which rule of differentiation run backwards?</p>,
      answer: { kind: "choice", options: ["The chain rule", "The product rule", "The quotient rule", "The power rule"], correct: [0] },
    },
    {
      key: "limits",
      rung: "check",
      prompt: (
        <p>
          In <M>{"\\int_0^1 2x(x^2 + 1)^3\\,dx"}</M> with <M>{"u = x^2 + 1"}</M>, what are the new limits?
        </p>
      ),
      answer: { kind: "choice", options: ["1 and 2", "0 and 1", "0 and 2", "1 and 4"], correct: [0] },
    },
    {
      key: "cube",
      rung: "apply",
      prompt: <p>Evaluate <M>{"\\int_0^1 2x(x^2 + 1)^3\\,dx"}</M>.</p>,
      answer: { kind: "numeric", value: 3.75 },
    },
    {
      key: "cos",
      rung: "apply",
      prompt: <p>Evaluate <M>{"\\int_0^{\\sqrt{\\pi/2}} 2x\\cos(x^2)\\,dx"}</M>.</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "gauss",
      rung: "apply",
      prompt: <p>Evaluate <M>{"\\int_0^1 x e^{-x^2}\\,dx"}</M>. Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.3161, tolerance: 0.0002 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
x = np.linspace(0, 1, 200001)
print(round(np.trapezoid(2 * x * np.cos(x ** 2), x), 4), round(np.sin(1), 4))`}</Code>
          <p>Substitution u = x² says these agree. What is the value?</p>
        </>
      ),
      answer: { kind: "numeric", value: 0.8415, tolerance: 0.0002 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
def mid(f, a, b, n=10000):
    h = (b - a) / n
    return h * sum(f(a + (i + 0.5) * h) for i in range(n))
lhs = mid(lambda x: 2 * x * math.cos(x * x), 0, 2)
rhs = mid(math.cos, 0, 4)
print(round(lhs, 6), round(rhs, 6), round(math.sin(4), 6))`}</Code>
          <p>Substituting u = x² turns one integral into another. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["-0.756803 -0.756803 -0.756802", "-0.756803 -0.378401 -0.756802", "0.756803 0.756803 0.756802", "-0.756803 -0.756803 0.909297"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>by_substitution(F, g, a, b)</C>: given an antiderivative F of f, return the integral of f(g(x))·g′(x) from a to b as F(g(b)) − F(g(a)).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def by_substitution(F, g, a, b):
    return F(b) - F(a)
`,
        solution: `def by_substitution(F, g, a, b):
    return F(g(b)) - F(g(a))
`,
        tests: [
          { name: "cos square", code: `import math
assert abs(by_substitution(math.sin, lambda x: x * x, 0, 1) - math.sin(1)) < 1e-12, 'With u = x², the limits become g(0) = 0 and g(1) = 1.'` },
          { name: "exp", code: `import math
assert abs(by_substitution(math.exp, lambda x: 3 * x, 0, 1) - (math.exp(3) - 1)) < 1e-9, 'Change the limits as well as the integrand.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Some integrals are hard numerically but easy after a substitution. Write <C>integrate_sub(f, a, b, phi, dphi, n)</C>, the integral of f from a to b computed as the integral of f(φ(t))·φ′(t) over [φ⁻¹(a), φ⁻¹(b)], where you are given φ, φ′ and the t-limits are passed as a pair <C>phi_limits</C> instead of b: so the signature is <C>integrate_sub(f, phi, dphi, t0, t1, n)</C>, using the midpoint rule with n strips. Use it to compute the integral of 1/√x on [0, 1] with x = t², and of 1/√(1 − x²) on [0, 1] with x = sin t, both far more accurately than the plain midpoint rule.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def integrate_sub(f, phi, dphi, t0, t1, n):
    h = (t1 - t0) / n
    return h * sum(f(t0 + (i + 0.5) * h) for i in range(n))
`,
        solution: `def integrate_sub(f, phi, dphi, t0, t1, n):
    h = (t1 - t0) / n
    total = 0.0
    for i in range(n):
        t = t0 + (i + 0.5) * h
        total += f(phi(t)) * dphi(t)
    return h * total
`,
        tests: [
          { name: "plain", code: `import math
v = integrate_sub(lambda x: math.cos(x), lambda t: t * t, lambda t: 2 * t, 0, 2, 2000)
assert abs(v - math.sin(4)) < 1e-5, 'The integral of cos over [0, 4] with x = t².'` },
          { name: "inverse sqrt", code: `import math
v = integrate_sub(lambda x: 1 / math.sqrt(x), lambda t: t * t, lambda t: 2 * t, 0, 1, 10)
assert abs(v - 2) < 1e-12, 'With x = t² the integrand becomes the constant 2.'` },
          { name: "arcsine", code: `import math
v = integrate_sub(lambda x: 1 / math.sqrt(1 - x * x) if x < 1 else 0.0, math.sin, math.cos, 0, math.pi / 2, 50)
assert abs(v - math.pi / 2) < 1e-6, 'x = sin t removes the singularity at 1.'` },
          { name: "gaussian", code: `import math
v = integrate_sub(lambda x: math.exp(-x * x), lambda t: t / (1 - t), lambda t: 1 / (1 - t) ** 2, 0, 1, 4000)
assert abs(v - math.sqrt(math.pi) / 2) < 1e-6, 'x = t/(1 − t) maps [0, 1) onto [0, ∞).'` },
        ],
      },
    },
    {
      key: "odd",
      rung: "prove",
      prompt: (
        <p>
          A function is odd if <M>{"f(-x) = -f(x)"}</M> for all x. Use the substitution <M>{"u = -x"}</M> to prove that{" "}
          <M>{"\\int_{-a}^a f(x)\\,dx = 0"}</M> for every continuous odd f. What does the analogous argument give for an even
          function, with <M>{"f(-x) = f(x)"}</M>?
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Splits the integral at 0 into the parts over [−a, 0] and [0, a].",
          "Substitutes u = −x in the first part, with du = −dx and limits a to 0, to get ∫₀ᵃ f(−u) du.",
          "Uses oddness to show this equals −∫₀ᵃ f(u) du, so the two parts cancel.",
          "States that for even f the integral over [−a, a] is twice the integral over [0, a].",
        ],
      },
    },
    {
      key: "linear",
      rung: "stretch",
      prompt: (
        <p>
          Given that <M>{"\\int_1^7 f(u)\\,du = 12"}</M>, what is <M>{"\\int_0^2 f(3x + 1)\\,dx"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 4 },
    },
  ],

  teachBack:
    "Explain to a friend why substitution is the chain rule backwards, how to change the limits, and what the factor g′(x) dx does to the area.",

  glimpse: (
    <p>
      This completes the chapter on integrals. Next, the techniques that substitution alone cannot handle, starting with
      integration by parts, the product rule run backwards. Multivariable and Matrix Calculus generalises substitution to
      change of variables with the Jacobian determinant, and Probability uses it to find the density of a transformed random
      variable.
    </p>
  ),
};
