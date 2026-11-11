import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { FTCViz } from "@/components/viz/FTCViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.6.3",
  minutes: 90,
  links: {
    revisits: ["m2.5.1"],
  },

  puzzle: (
    <>
      <p>
        Finding <M>{"\\int_0^1 x^2\\,dx"}</M> took a formula for sums of squares and a limit. Finding{" "}
        <M>{"\\int_0^\\pi \\sin x\\,dx"}</M> the same way would need a formula for sums of sines. Every new function seems
        to need a new trick.
      </p>
      <p>
        Derivatives, by contrast, are routine: a handful of rules handle everything. Two questions that look unrelated,
        the slope of a curve and the area under it, turn out to be one question asked forwards and backwards. Why?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Fix a starting point and let A(x) be the area under f from there to x. Push x a little to the right, by h. The area
        grows by a thin strip of width h and height about <M>{"f(x)"}</M>, so <M>{"A(x + h) - A(x) \\approx f(x)\\,h"}</M>.
        Divide by h and let h shrink: the rate at which area grows is the height of the curve. So A is a function whose
        derivative is f.
      </p>
      <FTCViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the fundamental theorem of calculus, part 1">
        <p>
          Let f be continuous on <M>{"[a, b]"}</M>, and define <M>{"A(x) = \\int_a^x f(t)\\,dt"}</M>. Then A is
          differentiable on <M>{"(a, b)"}</M> and <M>{"A'(x) = f(x)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>For <M>{"h > 0"}</M>, by additivity,</p>
        <MD>{"\\frac{A(x + h) - A(x)}{h} = \\frac{1}{h} \\int_x^{x+h} f(t)\\,dt."}</MD>
        <p>
          If m and M are the minimum and maximum of f on <M>{"[x, x + h]"}</M>, the integral lies between <M>{"mh"}</M> and{" "}
          <M>{"Mh"}</M>, so the quotient lies between m and M. As <M>{"h \\to 0"}</M>, both m and M tend to{" "}
          <M>{"f(x)"}</M>, because f is continuous at x. By the squeeze theorem the quotient tends to <M>{"f(x)"}</M>. The
          case <M>{"h < 0"}</M> is the same.
        </p>
      </Proof>

      <Definition title="antiderivative">
        <p>
          F is an <strong>antiderivative</strong> of f on an interval if <M>{"F' = f"}</M> there. Part 1 says that every
          continuous function has one, namely its area function.
        </p>
      </Definition>

      <Theorem title="the fundamental theorem of calculus, part 2">
        <p>If f is continuous on <M>{"[a, b]"}</M> and F is any antiderivative of f there, then</p>
        <MD>{"\\int_a^b f(x)\\,dx = F(b) - F(a), \\qquad \\text{written } \\big[F(x)\\big]_a^b."}</MD>
      </Theorem>
      <Proof>
        <p>
          A and F have the same derivative, f, so by a consequence of the mean value theorem they differ by a constant:{" "}
          <M>{"A(x) = F(x) + C"}</M>. Putting <M>{"x = a"}</M> gives <M>{"0 = F(a) + C"}</M>. So{" "}
          <M>{"\\int_a^b f = A(b) = F(b) - F(a)"}</M>.
        </p>
      </Proof>

      <Example title="areas without limits">
        <ul>
          <li>
            <M>{"\\int_0^1 x^2\\,dx = \\left[\\tfrac{x^3}{3}\\right]_0^1 = \\tfrac{1}{3}"}</M>, in one line.
          </li>
          <li>
            <M>{"\\int_0^\\pi \\sin x\\,dx = \\big[-\\cos x\\big]_0^\\pi = 1 - (-1) = 2"}</M>.
          </li>
          <li>
            <M>{"\\int_1^4 \\sqrt{x}\\,dx = \\left[\\tfrac{2}{3}x^{3/2}\\right]_1^4 = \\tfrac{2}{3}(8 - 1) = \\tfrac{14}{3}"}</M>.
          </li>
        </ul>
      </Example>

      <Example title="differentiating an integral">
        <p>
          Part 1, with the chain rule, differentiates integrals whose upper limit moves: if{" "}
          <M>{"G(x) = \\int_0^{x^2} \\cos t\\,dt"}</M>, then G is A composed with <M>{"x^2"}</M>, so{" "}
          <M>{"G'(x) = \\cos(x^2) \\cdot 2x"}</M>. Here no formula for G is needed.
        </p>
      </Example>

      <Remark title="indefinite integrals">
        <p>
          An antiderivative is written <M>{"\\int f(x)\\,dx"}</M>, with no limits, as in{" "}
          <M>{"\\int x^2\\,dx = \\tfrac{x^3}{3} + C"}</M>. The constant C is there because antiderivatives on an interval
          are determined only up to a constant. It cancels in <M>{"F(b) - F(a)"}</M>, which is why any antiderivative will
          do. Leibniz&rsquo;s notation shows the whole story: the long s, ∫, is a summa, a sum, and dx is the width of a
          very thin strip.
        </p>
      </Remark>

      <Remark title="the hypotheses matter">
        <p>
          Blind use of part 2 gives <M>{"\\int_{-1}^{1} \\frac{1}{x^2}\\,dx = \\left[-\\tfrac{1}{x}\\right]_{-1}^{1} = -2"}</M>,
          a negative area under a positive function. The error: <M>{"1/x^2"}</M> is not continuous on{" "}
          <M>{"[-1, 1]"}</M>, nor even bounded, so the theorem does not apply.
        </p>
      </Remark>

      <Remark title="who discovered it">
        <p>
          Newton and Leibniz each found the theorem independently, in the 1660s and 1670s, and each saw that it turned the
          solution of area problems into the reversal of differentiation. Isaac Barrow, Newton&rsquo;s teacher, had stated
          a geometric form of it a little earlier. Calculus, as a single subject, begins here.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cube",
      rung: "check",
      prompt: (
        <p>
          Find <M>{"\\int_0^2 x^3\\,dx"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "part1",
      rung: "check",
      prompt: (
        <p>
          Find <M>{"\\dfrac{d}{dx}\\displaystyle\\int_0^x \\sin(t^2)\\,dt"}</M>.
        </p>
      ),
      answer: { kind: "expression", value: "sin(x^2)", variables: ["x"] },
    },
    {
      key: "root",
      rung: "apply",
      prompt: (
        <p>
          Find <M>{"\\int_1^9 \\sqrt{x}\\,dx"}</M>. (Give a decimal or a fraction.)
        </p>
      ),
      answer: { kind: "numeric", value: 52 / 3, tolerance: 0.001 },
    },
    {
      key: "cos",
      rung: "apply",
      prompt: (
        <p>
          Find <M>{"\\int_0^{\\pi/2} \\cos x\\,dx"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "chain",
      rung: "apply",
      prompt: (
        <p>
          Find <M>{"\\dfrac{d}{dx}\\displaystyle\\int_0^{x^3} \\cos t\\,dt"}</M>.
        </p>
      ),
      answer: { kind: "expression", value: "3x^2 cos(x^3)", variables: ["x"] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
F = lambda x: -math.cos(x)
print(round(F(math.pi) - F(0), 6))`}</Code>
          <p>The fundamental theorem evaluates the integral of sin from 0 to π. What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 2.0, tolerance: 1e-06 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
def F(x, n=2000):
    h = x / n
    return h * sum(math.cos((i + 0.5) * h) for i in range(n))
h = 1e-4
print(round(F(1.0), 6), round(math.sin(1.0), 6), round((F(1.0 + h) - F(1.0 - h)) / (2 * h), 6))`}</Code>
          <p>F(x) is the integral of cos from 0 to x. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.841471 0.841471 0.540302", "0.841471 0.841471 0.841471", "0.540302 0.841471 0.540302", "0.841471 0.540302 0.540302"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>accumulate(f, a, xs)</C>, which returns a list of the integrals of f from a to each x in xs, using a midpoint sum with 10 000 strips each. Then the slope of the result should equal f.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def accumulate(f, a, xs):
    return [0.0 for x in xs]
`,
        solution: `def accumulate(f, a, xs):
    out = []
    for x in xs:
        n = 10000
        dx = (x - a) / n
        out.append(sum(f(a + (k + 0.5) * dx) for k in range(n)) * dx)
    return out
`,
        tests: [
          { name: "cosine", code: `import math
v = accumulate(math.cos, 0, [0.5, 1.0])
assert abs(v[0] - math.sin(0.5)) < 1e-8 and abs(v[1] - math.sin(1.0)) < 1e-8, 'The integral of cos from 0 to x is sin x.'` },
          { name: "derivative", code: `import math
h = 1e-3
v = accumulate(lambda t: t * t, 0, [2 - h, 2 + h])
assert abs((v[1] - v[0]) / (2 * h) - 4) < 1e-5, 'The slope of the accumulated area at 2 should be f(2) = 4.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>cumulative(ys, h)</C>, the running integral of equally spaced samples by the trapezoid rule (a list starting with 0, the same length as ys), and <C>differentiate(ys, h)</C>, the derivative of samples by central differences inside and one-sided second-order differences (−3y₀ + 4y₁ − y₂)/2h at the ends. The fundamental theorem says these undo each other; the tests check that differentiating the running integral of cos gives cos back to about h².
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def cumulative(ys, h):
    return [0.0] * len(ys)

def differentiate(ys, h):
    return [0.0] * len(ys)
`,
        solution: `def cumulative(ys, h):
    out = [0.0]
    for i in range(1, len(ys)):
        out.append(out[-1] + h * (ys[i - 1] + ys[i]) / 2)
    return out

def differentiate(ys, h):
    n = len(ys)
    d = [0.0] * n
    d[0] = (-3 * ys[0] + 4 * ys[1] - ys[2]) / (2 * h)
    d[-1] = (3 * ys[-1] - 4 * ys[-2] + ys[-3]) / (2 * h)
    for i in range(1, n - 1):
        d[i] = (ys[i + 1] - ys[i - 1]) / (2 * h)
    return d
`,
        tests: [
          { name: "integral", code: `import math
h = 0.001
xs = [i * h for i in range(1001)]
F = cumulative([math.cos(x) for x in xs], h)
assert max(abs(a - math.sin(x)) for a, x in zip(F, xs)) < 1e-6, 'The running integral of cos is sin.'` },
          { name: "derivative", code: `import math
h = 0.01
xs = [i * h for i in range(301)]
d = differentiate([x ** 3 for x in xs], h)
assert max(abs(a - 3 * x * x) for a, x in zip(d, xs)) < 1e-3 and abs(d[0]) < 1e-3, 'Second-order at the ends too.'` },
          { name: "round trip", code: `import math
h = 0.005
xs = [i * h for i in range(801)]
ys = [math.cos(x) for x in xs]
back = differentiate(cumulative(ys, h), h)
assert max(abs(a - b) for a, b in zip(back, ys)) < 1e-4, 'Differentiating the integral returns the function.'` },
        ],
      },
    },
    {
      key: "proof1",
      rung: "prove",
      prompt: (
        <p>
          Prove part 1 of the fundamental theorem: if f is continuous and <M>{"A(x) = \\int_a^x f"}</M>, then{" "}
          <M>{"A'(x) = f(x)"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes the difference quotient of A as (1/h) times the integral of f from x to x + h.",
          "Bounds this between the minimum and maximum of f on the small interval.",
          "Uses continuity of f to show both bounds tend to f(x), and concludes by squeezing.",
        ],
      },
    },
    {
      key: "average",
      rung: "stretch",
      prompt: (
        <p>
          The average value of f on <M>{"[a, b]"}</M> is <M>{"\\frac{1}{b - a}\\int_a^b f"}</M>. Prove that a continuous f
          actually takes its average value somewhere in <M>{"[a, b]"}</M>. Then find the average of <M>{"\\sin x"}</M> on{" "}
          <M>{"[0, \\pi]"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Applies the mean value theorem to the area function A, or uses the bounds m(b − a) ≤ ∫f ≤ M(b − a) with the intermediate value theorem.",
          "Concludes there is c with f(c) equal to the average.",
          "Computes the average of sin on [0, π] as 2/π.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why the rate at which the area under a curve grows is the height of the curve, and how that turns finding areas into undoing derivatives.",

  glimpse: (
    <p>
      Next, substitution, the chain rule run backwards, the first technique for finding antiderivatives. The fundamental theorem has grand generalisations: in Multivariable and Matrix Calculus integrals over regions are computed one variable at a time, and in Probability a density is the derivative of a distribution function, so probabilities of intervals are differences of one function at two points.
    </p>
  ),
};
