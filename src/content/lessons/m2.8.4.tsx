import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem } from "@/components/lesson/Blocks";
import { PowerSeriesViz } from "@/components/viz/PowerSeriesViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.8.4",
  minutes: 65,
  links: {
    requires: ["m2.8.2", "m2.8.3"],
    revisits: ["m2.4.5"],
    foreshadows: ["m8.8.3", "m4.2.3"],
  },

  puzzle: (
    <>
      <p>
        The geometric series says <M>{"\\dfrac{1}{1 - x} = 1 + x + x^2 + x^3 + \\cdots"}</M>, an infinite polynomial. Put{" "}
        <M>{"x = 1/2"}</M> and both sides are 2. Put <M>{"x = -1"}</M>: the left side is a perfectly good 1/2, but the right
        side is <M>{"1 - 1 + 1 - 1 + \\dots"}</M>, which goes nowhere.
      </p>
      <p>
        Why does the formula fail at <M>{"x = -1"}</M>, where nothing is wrong with the function? Can you predict, for an
        infinite polynomial, the x where it works?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A power series is a polynomial that never ends. For each x it is a series of numbers, which may converge or not.
        Raise the number of terms below and watch where the partial sums settle onto the function and where they fly apart.
        The region of agreement is always an interval centred at the series&rsquo; centre.
      </p>
      <PowerSeriesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="power series">
        <p>
          A <strong>power series</strong> about a is <M>{"\\sum_{n=0}^\\infty c_n (x - a)^n"}</M>. For each x it is a series
          of numbers, and its sum, where it converges, is a function of x.
        </p>
      </Definition>

      <Theorem title="radius of convergence">
        <p>
          For every power series there is an R with <M>{"0 \\le R \\le \\infty"}</M>, its <strong>radius of convergence</strong>,
          such that the series converges absolutely when <M>{"|x - a| < R"}</M> and diverges when <M>{"|x - a| > R"}</M>. At{" "}
          <M>{"|x - a| = R"}</M> anything can happen. If <M>{"|c_{n}/c_{n+1}|"}</M> has a limit, that limit is R.
        </p>
      </Theorem>
      <Remark title="why an interval">
        <p>
          If the series converges at some <M>{"x_1"}</M>, its terms are bounded there, and at any x closer to a the terms are
          smaller by a factor <M>{"r^n"}</M> with <M>{"r < 1"}</M>, so they are beaten by a geometric series. The ratio test
          applied to <M>{"c_n(x - a)^n"}</M> gives the formula for R.
        </p>
      </Remark>

      <Theorem title="calculus term by term">
        <p>
          Inside the radius of convergence, a power series can be differentiated and integrated term by term, and the new
          series have the same radius:
        </p>
        <MD>{"\\frac{d}{dx}\\sum c_n x^n = \\sum n c_n x^{n-1}, \\qquad \\int_0^x \\sum c_n t^n\\,dt = \\sum \\frac{c_n}{n + 1}x^{n+1}."}</MD>
        <p>Real Analysis proves this, using uniform convergence.</p>
      </Theorem>

      <Example title="new series from old">
        <ul>
          <li>
            Integrate <M>{"\\frac{1}{1 + t} = 1 - t + t^2 - \\dots"}</M> from 0 to x:{" "}
            <M>{"\\ln(1 + x) = x - \\frac{x^2}{2} + \\frac{x^3}{3} - \\dots"}</M> for <M>{"|x| < 1"}</M>.
          </li>
          <li>
            Integrate <M>{"\\frac{1}{1 + t^2} = 1 - t^2 + t^4 - \\dots"}</M>:{" "}
            <M>{"\\arctan x = x - \\frac{x^3}{3} + \\frac{x^5}{5} - \\dots"}</M>.
          </li>
          <li>
            Differentiate the geometric series: <M>{"\\frac{1}{(1 - x)^2} = \\sum_{n \\ge 1} n x^{n-1}"}</M>.
          </li>
        </ul>
      </Example>

      <Example title="defining functions">
        <p>
          The series <M>{"E(x) = \\sum_{n \\ge 0} x^n/n!"}</M> has infinite radius (the ratio test gives{" "}
          <M>{"|x|/(n + 1) \\to 0"}</M>), and differentiating term by term gives <M>{"E' = E"}</M> with{" "}
          <M>{"E(0) = 1"}</M>. So <M>{"E(x) = e^x"}</M>, and this series can serve as the definition of the exponential. In
          the same way the series for sin and cos can define them without any triangles.
        </p>
      </Example>

      <Remark title="the puzzle explained">
        <p>
          The radius is a property of the series about its centre, and it reaches as far as the nearest trouble. For{" "}
          <M>{"1/(1 - x)"}</M> about 0 the trouble is at <M>{"x = 1"}</M>, distance 1, so the series fails for every{" "}
          <M>{"|x| \\ge 1"}</M>, including <M>{"x = -1"}</M>. For <M>{"1/(1 + x^2)"}</M> the radius is also 1, though the
          function is smooth on the whole real line; the trouble is at <M>{"x = \\pm i"}</M>, in the complex numbers.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "geom",
      rung: "check",
      prompt: <p>For which x does <M>{"\\sum_{n \\ge 0} x^n"}</M> converge?</p>,
      answer: { kind: "choice", options: ["|x| < 1", "|x| ≤ 1", "every x", "x < 1"], correct: [0] },
    },
    {
      key: "shape",
      rung: "check",
      prompt: <p>What shape is the set of x where a power series about a converges absolutely?</p>,
      answer: { kind: "choice", options: ["An interval centred at a (perhaps just a, or the whole line)", "Any set at all", "Always the whole line"], correct: [0] },
    },
    {
      key: "r3",
      rung: "apply",
      prompt: <p>What is the radius of convergence of <M>{"\\sum_{n \\ge 0} x^n/3^n"}</M>?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "rfact",
      rung: "apply",
      prompt: <p>What is the radius of convergence of <M>{"\\sum_{n \\ge 0} n!\\,x^n"}</M>?</p>,
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "deriv",
      rung: "apply",
      prompt: <p>Find <M>{"\\sum_{n \\ge 1} n (1/2)^{n-1}"}</M>.</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
x = 0.5
print(round(sum(x ** n / math.factorial(n) for n in range(12)), 6), round(math.exp(x), 6))`}</Code>
          <p>Twelve terms of the power series for eˣ at 0.5. What is the value?</p>
        </>
      ),
      answer: { kind: "numeric", value: 1.648721, tolerance: 1e-06 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>geometric_partial(x, n)</C>, the sum 1 + x + … + xⁿ⁻¹, and <C>radius()</C>, the radius of convergence of Σ xⁿ.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def geometric_partial(x, n):
    return 1 / (1 - x)

def radius():
    return 0
`,
        solution: `def geometric_partial(x, n):
    return sum(x ** k for k in range(n))

def radius():
    return 1
`,
        tests: [
          { name: "inside", code: `assert abs(geometric_partial(0.5, 60) - 2) < 1e-12, 'At x = 1/2 the series sums to 2.'` },
          { name: "outside", code: `assert geometric_partial(2, 20) == 2 ** 20 - 1, 'At x = 2 the partial sums blow up: compute the actual partial sum.'` },
          { name: "radius", code: `assert radius() == 1, 'Σ xⁿ converges for |x| < 1.'` },
        ],
      },
    },
    {
      key: "leibniz",
      rung: "prove",
      prompt: (
        <p>
          Derive the power series of <M>{"\\arctan x"}</M> about 0 by integrating a geometric series term by term, and state
          its radius. The series also converges at <M>{"x = 1"}</M>, to arctan 1 (a fact proved in Real Analysis). Use it to
          write π as an infinite series, and explain why that series is a poor way to compute π.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes 1/(1 + t²) = Σ (−1)ⁿ t²ⁿ for |t| < 1 as a geometric series with ratio −t².",
          "Integrates from 0 to x to get arctan x = Σ (−1)ⁿ x^(2n+1)/(2n + 1), with radius 1.",
          "Puts x = 1 and uses arctan 1 = π/4 to get π = 4(1 − 1/3 + 1/5 − …).",
          "Notes by the alternating series bound that the error after N terms is about 4/(2N + 3), so a million terms give only about six digits.",
        ],
      },
    },
    {
      key: "ln2",
      rung: "stretch",
      prompt: (
        <p>
          Find <M>{"\\sum_{n \\ge 1} \\dfrac{1}{n\\,2^n}"}</M>. (Hint: integrate the geometric series to find{" "}
          <M>{"\\sum x^n/n"}</M>.) Give four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.6931, tolerance: 0.0002 },
    },
  ],

  teachBack:
    "Explain to a friend what a power series is, why it converges on an interval about its centre, and how term-by-term integration gives the series for ln(1 + x).",

  glimpse: (
    <p>
      Next, Taylor series: the power series of a given function, with coefficients read off from its derivatives, and the
      remainder that says how good a finite piece of it is. Discrete Mathematics treats power series as formal objects,
      generating functions, that encode a whole sequence of numbers in one function.
    </p>
  ),
};
