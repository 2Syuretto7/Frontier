import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { GaussianViz } from "@/components/viz/GaussianViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.7.4",
  minutes: 60,
  links: {
    requires: ["m2.7.3", "m2.6.4"],
    foreshadows: ["m5.7.3", "m7.3.2", "m7.5.4"],
  },

  puzzle: (
    <>
      <p>
        The normal distribution, the bell curve, is everywhere: in measurement errors, in heights, in the initial weights of a
        neural network. Its shape is <M>{"e^{-x^2}"}</M>, and to make it a probability density you must divide by its total
        area.
      </p>
      <p>
        But <M>{"e^{-x^2}"}</M> has no antiderivative that can be written with the usual functions. This was proved in the
        nineteenth century. So how can anyone know the total area exactly?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The trick, due to Poisson, is to compute the square of the area instead. The square of a one-dimensional integral is
        a two-dimensional one, over the whole plane, of <M>{"e^{-(x^2 + y^2)}"}</M>. That function depends only on the
        distance from the origin, so add it up in rings instead of strips, and the hard integral becomes an easy one. Watch the
        two quantities in the table trap each other as R grows.
      </p>
      <GaussianViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the Gaussian integral">
        <MD>{"\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}."}</MD>
      </Theorem>
      <Proof>
        <p>
          The integral converges, by comparison with <M>{"e^{-|x|}"}</M> for <M>{"|x| \\ge 1"}</M>. Call it I. Then
        </p>
        <MD>{"I^2 = \\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx \\int_{-\\infty}^{\\infty} e^{-y^2}\\,dy = \\iint_{\\mathbb{R}^2} e^{-(x^2 + y^2)}\\,dx\\,dy."}</MD>
        <p>
          Now add up the plane in thin rings. The ring between radius r and <M>{"r + dr"}</M> has area about{" "}
          <M>{"2\\pi r\\,dr"}</M>, and on it the integrand is <M>{"e^{-r^2}"}</M>. So
        </p>
        <MD>{"I^2 = \\int_0^\\infty e^{-r^2}\\, 2\\pi r\\,dr = \\pi \\Bigl[-e^{-r^2}\\Bigr]_0^\\infty = \\pi."}</MD>
        <p>
          The factor r is what makes the second integral easy, by the substitution <M>{"u = r^2"}</M>. Multivariable and
          Matrix Calculus justifies the two steps used here, writing a double integral as repeated single ones and changing to
          polar coordinates.
        </p>
      </Proof>

      <Example title="the normal density">
        <p>
          The substitution <M>{"x = (t - \\mu)/(\\sigma\\sqrt2)"}</M> gives
        </p>
        <MD>{"\\int_{-\\infty}^{\\infty} e^{-(t - \\mu)^2/(2\\sigma^2)}\\,dt = \\sigma\\sqrt{2\\pi},"}</MD>
        <p>
          so <M>{"\\dfrac{1}{\\sigma\\sqrt{2\\pi}} e^{-(t - \\mu)^2/(2\\sigma^2)}"}</M> has total area 1: this is the normal
          density with mean μ and standard deviation σ, and the strange constant in front is explained.
        </p>
      </Example>

      <Example title="Gamma of a half">
        <p>
          With <M>{"x = u^2"}</M>, <M>{"\\Gamma(\\tfrac12) = \\int_0^\\infty x^{-1/2} e^{-x}\\,dx = 2\\int_0^\\infty e^{-u^2}\\,du = \\sqrt{\\pi}"}</M>.
          Then <M>{"\\Gamma(s + 1) = s\\Gamma(s)"}</M> gives <M>{"\\Gamma(\\tfrac32) = \\tfrac12\\sqrt\\pi"}</M> and so on: the
          factorial of a half is <M>{"\\tfrac12\\sqrt\\pi"}</M>.
        </p>
      </Example>

      <Remark title="why it matters">
        <p>
          The Gaussian integral is the normalising constant behind the normal distribution, and so behind the central limit
          theorem, Gaussian noise in diffusion models, and the standard way of initialising network weights. The volume of a
          ball in n dimensions, which shrinks towards zero as n grows, comes from the same trick applied in n dimensions at
          once.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "value",
      rung: "check",
      prompt: <p>What is <M>{"\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx"}</M>?</p>,
      answer: { kind: "choice", options: ["√π", "π", "1", "√(2π)"], correct: [0] },
    },
    {
      key: "why",
      rung: "check",
      prompt: <p>Why does the change to rings (polar coordinates) make the integral computable?</p>,
      answer: {
        kind: "choice",
        options: ["The extra factor r makes e^(−r²)·r have an antiderivative", "It removes the exponential", "It turns the integral into a sum"],
        correct: [0],
      },
    },
    {
      key: "half",
      rung: "apply",
      prompt: <p>What is <M>{"\\int_{-\\infty}^{\\infty} e^{-x^2/2}\\,dx"}</M>? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 2.5066, tolerance: 0.0001 },
    },
    {
      key: "pos",
      rung: "apply",
      prompt: <p>What is <M>{"\\int_0^{\\infty} e^{-x^2}\\,dx"}</M>? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.8862, tolerance: 0.0002 },
    },
    {
      key: "shift",
      rung: "apply",
      prompt: <p>What is <M>{"\\int_{-\\infty}^{\\infty} e^{-(x - 3)^2/8}\\,dx"}</M>? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 5.0133, tolerance: 0.0001 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
x = np.linspace(-10, 10, 200001)
print(round(np.trapezoid(np.exp(-x ** 2), x) ** 2, 4))`}</Code>
          <p>The square of the Gaussian integral. What does this print, to four decimal places?</p>
        </>
      ),
      answer: { kind: "numeric", value: 3.1416, tolerance: 0.0002 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>normal_mass(k)</C>, the probability that a standard normal lies within k of 0: the integral of e^(−x²/2)/√(2π) from −k to k, by a midpoint sum with 100 000 strips.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def normal_mass(k):
    return 1.0
`,
        solution: `import math

def normal_mass(k):
    n = 100000
    dx = 2 * k / n
    c = 1 / math.sqrt(2 * math.pi)
    return sum(c * math.exp(-((-k + (j + 0.5) * dx) ** 2) / 2) for j in range(n)) * dx
`,
        tests: [
          { name: "one", code: `assert abs(normal_mass(1) - 0.682689) < 1e-5, 'About 68.3% lies within one standard deviation.'` },
          { name: "two", code: `assert abs(normal_mass(2) - 0.954500) < 1e-5, 'About 95.4% lies within two.'` },
          { name: "far", code: `assert abs(normal_mass(8) - 1) < 1e-9, 'Almost everything lies within 8.'` },
        ],
      },
    },
    {
      key: "variance",
      rung: "prove",
      prompt: (
        <p>
          Use integration by parts, with <M>{"u = x"}</M> and <M>{"dv = x e^{-x^2/2}\\,dx"}</M>, to show that{" "}
          <M>{"\\int_{-\\infty}^{\\infty} x^2 e^{-x^2/2}\\,dx = \\sqrt{2\\pi}"}</M>. Conclude that the standard normal
          distribution has variance 1.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Finds v = −e^(−x²/2) by substitution.",
          "Shows the boundary term −x e^(−x²/2) vanishes at ±∞.",
          "Reduces the integral to ∫ e^(−x²/2) dx = √(2π).",
          "Divides by √(2π) to get E[X²] = 1, and with mean 0 by symmetry, variance 1.",
        ],
      },
    },
    {
      key: "gamma",
      rung: "stretch",
      prompt: <p>Using <M>{"\\Gamma(\\tfrac12) = \\sqrt\\pi"}</M> and <M>{"\\Gamma(s + 1) = s\\Gamma(s)"}</M>, find <M>{"\\Gamma(\\tfrac52)"}</M>. Give four decimal places.</p>,
      answer: { kind: "numeric", value: 1.3293, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how the area under e^(−x²) can be found exactly although it has no antiderivative, and why that gives the constant in the normal density.",

  glimpse: (
    <p>
      Most integrals have no formula at all, Gaussian or not. Next, numerical integration: how to compute them to any
      accuracy you need. Probability builds the normal distribution on this lesson, and Multivariable and Matrix Calculus
      proves the change to polar coordinates with the Jacobian determinant.
    </p>
  ),
};
