import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AccumViz } from "@/components/viz/AccumViz";
import type { LessonContent } from "@/lib/types";

const CUM = `def cumulative(f, a, b, n):
    h = (b - a) / n
    xs = [a + h * i for i in range(n + 1)]
    F = [0.0]
    for u, v in zip(xs, xs[1:]):
        F.append(F[-1] + (f(u) + f(v)) * h / 2)
    return xs, F

def diff_table(F, h):
    return [(F[i + 1] - F[i - 1]) / (2 * h) for i in range(1, len(F) - 1)]`;

const TAGS = `def riemann(f, P, tags):
    return sum(f(t) * (v - u) for t, u, v in zip(tags, P, P[1:]))

def midpoints(P):
    return [(u + v) / 2 for u, v in zip(P, P[1:])]`;

export const lesson: LessonContent = {
  id: "m8.7.3",
  minutes: 60,
  links: {
    requires: ["m8.7.2", "m8.6.2"],
    revisits: ["m2.6.3"],
    foreshadows: ["m8.8.2", "m8.8.3"],
  },

  puzzle: (
    <>
      <p>
        Integrate Thomae&apos;s function from 0 to x: every integral is 0, so F(x) = 0 and F′(x) = 0 everywhere. But the
        fundamental theorem of calculus is supposed to say F′ = f, and f(1/2) = 1/2. Which part of the theorem fails, and what
        exactly are its hypotheses? The proof answers both questions, and it is short, because the mean value theorem does all
        the work.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two statements share the name. Integrating a derivative gives the total change: on each small cell the change of F is
        exactly F′ at some point times the width, by the mean value theorem, so the total change is a Riemann sum. And
        differentiating an accumulated area gives back the height, wherever the height is continuous.
      </p>
      <AccumViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="fundamental theorem, evaluation form">
        <p>
          Let f be integrable on [a, b], and let F be continuous on [a, b] and differentiable on (a, b) with F′ = f there. Then
        </p>
        <MD>{"\\int_a^b f = F(b) - F(a)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Take any partition P. On each cell the mean value theorem gives <M>{"t_k \\in (x_{k-1}, x_k)"}</M> with{" "}
          <M>{"F(x_k) - F(x_{k-1}) = f(t_k)(x_k - x_{k-1})"}</M>. Summing, the left side telescopes:
        </p>
        <MD>{"F(b) - F(a) = \\sum_k f(t_k)(x_k - x_{k-1})."}</MD>
        <p>
          Since <M>{"m_k \\leq f(t_k) \\leq M_k"}</M>, this gives L(f, P) ≤ F(b) − F(a) ≤ U(f, P) for every P, hence L(f) ≤ F(b) −
          F(a) ≤ U(f). f is integrable, so both equal the integral. For F = x² the tags <M>{"t_k"}</M> are exactly the cell
          midpoints, so the midpoint sum of 2x is exact on any partition.
        </p>
        <Code>{TAGS}</Code>
      </Proof>

      <Theorem title="fundamental theorem, accumulation form">
        <p>
          Let f be integrable on [a, b] and <M>{"F(x) = \\int_a^x f"}</M>. Then F is Lipschitz, hence continuous, and if f is
          continuous at c ∈ (a, b), F is differentiable at c with F′(c) = f(c).
        </p>
      </Theorem>
      <Proof>
        <p>
          If |f| ≤ B then <M>{"|F(y) - F(x)| = |\\int_x^y f| \\leq B|y - x|"}</M>. For the derivative, given ε choose δ with
          |f(t) − f(c)| &lt; ε when |t − c| &lt; δ. For 0 &lt; |h| &lt; δ,
        </p>
        <MD>{"\\left|\\frac{F(c + h) - F(c)}{h} - f(c)\\right| = \\left|\\frac1h \\int_c^{c+h} \\big(f(t) - f(c)\\big)\\,dt\\right| \\leq \\varepsilon."}</MD>
        <p>
          Numerically, accumulating trapezoids gives a table of F, and differencing that table recovers f up to a small error.
        </p>
        <Code>{CUM}</Code>
      </Proof>

      <Example title="where continuity fails">
        <p>
          For a jump from 0.4 to 1.2 at x = 1, F has slopes 0.4 and 1.2 from the left and right at 1: it is continuous with a
          corner, and not differentiable there. For Thomae&apos;s function F = 0, so F′(c) = f(c) exactly at the irrationals, the
          points of continuity, and fails at every rational. Nothing in the theorem is contradicted.
        </p>
      </Example>

      <Theorem title="consequences">
        <ol>
          <li>Every continuous f on [a, b] has an antiderivative, namely <M>{"\\int_a^x f"}</M>.</li>
          <li>
            Integration by parts: for continuously differentiable u, v,{" "}
            <M>{"\\int_a^b u v' = u(b)v(b) - u(a)v(a) - \\int_a^b u' v"}</M>, from the evaluation form applied to (uv)′.
          </li>
          <li>
            Substitution: <M>{"\\int_a^b f(g(t))g'(t)\\,dt = \\int_{g(a)}^{g(b)} f"}</M> for continuous f and continuously
            differentiable g, from the chain rule applied to F ∘ g.
          </li>
        </ol>
      </Theorem>

      <Remark title="the integrability hypothesis is needed">
        <p>
          The evaluation form assumes f = F′ is integrable, and that is not automatic: Volterra constructed a differentiable F
          whose derivative is bounded but discontinuous on a set too large for Riemann integration. The Lebesgue integral
          removes this gap for bounded derivatives, one of the reasons it replaced the Riemann integral in analysis and
          probability.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "jump",
      rung: "check",
      prompt: <p>f is 0.4 on [0, 1) and 1.2 on [1, 2], and F(x) = ∫₀ˣ f. What is F(2)?</p>,
      answer: { kind: "numeric", value: 1.6, tolerance: 0.0001 },
    },
    {
      key: "chain",
      rung: "check",
      prompt: <p>Let G(x) = ∫₀^(x²) cos t dt. What is G′(1)? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 1.0806, tolerance: 0.0001 },
    },
    {
      key: "thomae",
      rung: "apply",
      prompt: <p>Let F(x) be the integral of Thomae&apos;s function from 0 to x. Which statement is true?</p>,
      answer: {
        kind: "choice",
        options: [
          "F′(x) = 0 for every x, which differs from the function at every rational",
          "F is not differentiable at the rationals",
          "F′(x) equals Thomae's function at every x",
          "F is not defined because the function has infinitely many discontinuities",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def cumulative(f, a, b, n):
    h = (b - a) / n
    xs = [a + h * i for i in range(n + 1)]
    F = [0.0]
    for u, v in zip(xs, xs[1:]):
        F.append(F[-1] + (f(u) + f(v)) * h / 2)
    return xs, F

def diff_table(F, h):
    return [(F[i + 1] - F[i - 1]) / (2 * h) for i in range(1, len(F) - 1)]

xs, F = cumulative(lambda x: 2 * x, 0, 1, 4)
print(F, diff_table(F, 0.25))
xs, F = cumulative(math.cos, 0, math.pi / 2, 100)
print(round(F[-1], 6), round(max(abs(d - math.cos(x)) for d, x in zip(diff_table(F, xs[1]), xs[1:-1])), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 0.0625, 0.25, 0.5625, 1.0] [0.5, 1.0, 1.5]\n0.999979 6.2e-05",
          "[0.0, 0.0625, 0.25, 0.5625, 1.0] [0.25, 0.5, 0.75]\n0.999979 6.2e-05",
          "[0.0, 0.25, 0.5, 0.75, 1.0] [0.5, 1.0, 1.5]\n0.999979 6.2e-05",
          "[0.0, 0.0625, 0.25, 0.5625, 1.0] [0.5, 1.0, 1.5]\n1.0 0.0",
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

def riemann(f, P, tags):
    return sum(f(t) * (v - u) for t, u, v in zip(tags, P, P[1:]))

def midpoints(P):
    return [(u + v) / 2 for u, v in zip(P, P[1:])]

P = [0, 0.25, 0.5, 1]
print(riemann(lambda x: 2 * x, P, midpoints(P)), riemann(lambda x: 2 * x, P, P[:-1]))
Q = [i * math.pi / 200 for i in range(101)]
print(round(riemann(math.cos, Q, midpoints(Q)), 6), round(riemann(math.cos, Q, Q[:-1]), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1.0 0.625\n1.00001 1.007833", "1.0 1.0\n1.00001 1.007833", "0.625 1.0\n1.007833 1.00001", "1.0 0.625\n1.0 1.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cumulative(f, a, b, n)</C>, returning the grid xs of n equal cells and the list F of accumulated trapezoid
          areas (F[0] = 0.0, each step adding (f(u) + f(v))h/2). Then write <C>diff_table(F, h)</C>, the central differences
          (F[i + 1] − F[i − 1])/(2h) at the interior indices.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def cumulative(f, a, b, n):
    return [], []

def diff_table(F, h):
    return []
`,
        solution: CUM,
        tests: [
          { name: "cumulative", code: `xs, F = cumulative(lambda x: 1, 0, 2, 4)
assert xs == [0, 0.5, 1, 1.5, 2] and F == [0, 0.5, 1, 1.5, 2]
assert cumulative(lambda x: x * x, 0, 1, 2)[1] == [0, 0.0625, 0.375]` },
          { name: "diff", code: `assert diff_table([0, 1, 4, 9], 1) == [2.0, 4.0]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>riemann(f, P, tags)</C>, the sum of f(t_k)(x_k − x_(k−1)) for tags t_k in each cell of the partition P, and{" "}
          <C>midpoints(P)</C>, the list of cell midpoints.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def riemann(f, P, tags):
    return 0

def midpoints(P):
    return []
`,
        solution: TAGS,
        tests: [
          { name: "mid", code: `assert midpoints([0, 1, 3]) == [0.5, 2.0]` },
          { name: "riemann", code: `assert riemann(lambda x: x, [0, 1, 3], [1, 3]) == 7
P = [0, 0.3, 0.7, 2]
assert abs(riemann(lambda x: 2 * x, P, midpoints(P)) - 4) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let f be integrable on [a, b], continuous at c ∈ (a, b), and <M>{"F(x) = \\int_a^x f"}</M>. Prove F′(c) = f(c).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes (F(c + h) − F(c))/h − f(c) as (1/h)∫ from c to c + h of (f(t) − f(c)) dt, using additivity of the integral.",
          "Uses continuity at c to choose δ with |f(t) − f(c)| < ε for |t − c| < δ.",
          "Bounds the integral by ε|h| for 0 < |h| < δ, so the quotient is within ε of f(c).",
        ],
      },
    },
    {
      key: "tag",
      rung: "stretch",
      prompt: <p>For F(x) = x³ on the cell [0, 1], find the tag t with 3t² equal to the change F(1) − F(0). Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.5774, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend the two forms of the fundamental theorem of calculus, how the mean value theorem turns F(b) − F(a) into a Riemann sum, why continuity of f at c is needed for F′(c) = f(c), and what Thomae's function shows.",

  glimpse: (
    <>
      <p>
        The next chapter asks what happens to continuity, derivatives and integrals under limits of functions. Pointwise
        limits can destroy all three; uniform limits preserve the first and third, and the second with care.
      </p>
    </>
  ),
};
