import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LipConeViz } from "@/components/viz/LipConeViz";
import type { LessonContent } from "@/lib/types";

const SLOPES = `def lip_estimate(f, xs):
    ys = [f(x) for x in xs]
    return max(abs(ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]) for i in range(len(xs) - 1))

def secant_max(f, xs):
    ys = [f(x) for x in xs]
    return max(abs(ys[j] - ys[i]) / (xs[j] - xs[i])
               for i in range(len(xs)) for j in range(i + 1, len(xs)))`;

const NET = `def net(ws, x):
    for w in ws[:-1]:
        x = max(0.0, w * x)
    return ws[-1] * x

def lip_bound(ws):
    p = 1.0
    for w in ws:
        p *= abs(w)
    return p`;

export const lesson: LessonContent = {
  id: "m8.5.4",
  minutes: 55,
  links: {
    requires: ["m8.5.3"],
    revisits: ["m2.5.1", "m6.5.2"],
    foreshadows: ["m8.6.2", "m8.9.3"],
  },

  puzzle: (
    <>
      <p>
        Change one input of a trained network by a tiny amount. How much can the output change? If every layer can stretch
        distances by at most some factor, the whole network stretches them by at most the product, and you get a guarantee
        that holds for every input at once. The property behind this is stronger than uniform continuity and much easier to
        compute with.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A Lipschitz function has a speed limit: its secant slopes are bounded by a constant K. Picture a double cone of slopes
        ±K with its apex on the graph; the function is K-Lipschitz when the graph stays inside the cone wherever the apex is
        placed. A vertical tangent, as √x has at 0, breaks every cone.
      </p>
      <LipConeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Lipschitz continuity">
        <p>f: A → ℝ is Lipschitz with constant K if</p>
        <MD>{"|f(x) - f(y)| \\leq K\\,|x - y| \\quad \\text{for all } x, y \\in A."}</MD>
        <p>The smallest such K, the supremum of the secant slopes, is the Lipschitz constant of f.</p>
      </Definition>

      <Theorem title="Lipschitz implies uniformly continuous">
        <p>A Lipschitz function is uniformly continuous; the converse is false.</p>
      </Theorem>
      <Proof>
        <p>
          Given ε take δ = ε/K (any δ if K = 0). For the converse, √x on [0, 1] is uniformly continuous by the last lesson,
          but <M>{"(\\sqrt x - \\sqrt 0)/(x - 0) = 1/\\sqrt x"}</M> is unbounded as <M>{"x \\to 0"}</M>.
        </p>
      </Proof>

      <Theorem title="bounded derivative">
        <p>
          If f is differentiable on an interval with <M>{"|f'(x)| \\leq K"}</M>, then f is K-Lipschitz, and K = sup |f′| is the
          Lipschitz constant.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the mean value theorem <M>{"f(x) - f(y) = f'(\\xi)(x - y)"}</M> for some ξ between x and y, so{" "}
          <M>{"|f(x) - f(y)| \\leq K|x - y|"}</M>. Conversely every derivative is a limit of secant slopes, so it is bounded by
          the Lipschitz constant. (The mean value theorem is proved carefully in the next chapter.)
        </p>
      </Proof>

      <Theorem title="secants are averages of neighbouring slopes">
        <p>
          For points <M>{"x_0 < x_1 < \\dots < x_n"}</M>, the largest secant slope over all pairs equals the largest slope over
          consecutive pairs.
        </p>
      </Theorem>
      <Proof>
        <p>For i &lt; j the secant slope is a weighted average of the consecutive slopes between them:</p>
        <MD>{"\\frac{f(x_j) - f(x_i)}{x_j - x_i} = \\sum_{m=i}^{j-1} \\frac{x_{m+1} - x_m}{x_j - x_i} \\cdot \\frac{f(x_{m+1}) - f(x_m)}{x_{m+1} - x_m},"}</MD>
        <p>
          with non-negative weights summing to 1, so its absolute value is at most the largest consecutive one. This makes a
          grid estimate of the Lipschitz constant cost n steps rather than n².
        </p>
        <Code>{SLOPES}</Code>
      </Proof>

      <Theorem title="composition">
        <p>If f is <M>{"K_1"}</M>-Lipschitz and g is <M>{"K_2"}</M>-Lipschitz, then g ∘ f is <M>{"K_1 K_2"}</M>-Lipschitz.</p>
      </Theorem>
      <Proof>
        <p>
          <M>{"|g(f(x)) - g(f(y))| \\leq K_2 |f(x) - f(y)| \\leq K_2 K_1 |x - y|"}</M>.
        </p>
      </Proof>

      <Example title="a one-dimensional network">
        <p>
          ReLU is 1-Lipschitz and x ↦ wx is |w|-Lipschitz, so a chain of scalings and ReLUs is Lipschitz with constant at most
          the product of the |w|. The bound can be far from tight: ReLU can zero out a whole branch, as the second network
          below does. In higher dimensions |w| becomes the operator norm of each weight matrix, and spectral normalisation keeps
          each one at most 1.
        </p>
        <Code>{NET}</Code>
      </Example>

      <Remark title="where Lipschitz constants appear">
        <p>
          A gradient that is L-Lipschitz (an L-smooth loss) is what guarantees gradient descent with step 1/L decreases the
          loss. A map that is Lipschitz with constant below 1 is a contraction, which is the hypothesis of the fixed-point
          theorem at the end of this course. And robustness certificates bound how far a small perturbation of the input can
          move the output.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sq",
      rung: "check",
      prompt: <p>What is the Lipschitz constant of x² on [−2, 3]?</p>,
      answer: { kind: "numeric", value: 6, tolerance: 0.0001 },
    },
    {
      key: "sum",
      rung: "check",
      prompt: <p>What is the Lipschitz constant of sin 2x + x/2 on ℝ?</p>,
      answer: { kind: "numeric", value: 2.5, tolerance: 0.0001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which of these functions is Lipschitz on [0, 1]?</p>,
      answer: { kind: "choice", options: ["sin 5x", "√x", "the cube root of x", "x sin(1/x), with value 0 at 0"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def lip_estimate(f, xs):
    ys = [f(x) for x in xs]
    return max(abs(ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]) for i in range(len(xs) - 1))

def secant_max(f, xs):
    ys = [f(x) for x in xs]
    return max(abs(ys[j] - ys[i]) / (xs[j] - xs[i])
               for i in range(len(xs)) for j in range(i + 1, len(xs)))

xs = [i / 100 for i in range(101)]
print(round(lip_estimate(lambda x: math.sin(2 * x), xs), 4), round(secant_max(lambda x: math.sin(2 * x), xs), 4))
print(round(lip_estimate(math.sqrt, xs), 2), lip_estimate(abs, [-1, -0.5, 0.5, 1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1.9999 1.9999\n10.0 1.0", "1.9999 2.0\n10.0 1.0", "1.9999 1.9999\n0.5 1.0", "1.9999 1.9999\n10.0 0.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def net(ws, x):
    for w in ws[:-1]:
        x = max(0.0, w * x)
    return ws[-1] * x

def lip_bound(ws):
    p = 1.0
    for w in ws:
        p *= abs(w)
    return p

ws = [2, 1.5, -0.5]
print(net(ws, 1), net(ws, 0.5), lip_bound(ws))
print(net([2, -1.5, 0.5], 1), net([2, -1.5, 0.5], -1), lip_bound([2, -1.5, 0.5]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["-1.5 -0.75 1.5\n0.0 0.0 1.5", "1.5 0.75 1.5\n0.0 0.0 1.5", "-1.5 -0.75 1.5\n-1.5 0.0 1.5", "-1.5 -0.75 -1.5\n0.0 0.0 -1.5"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For sorted points xs, write <C>lip_estimate(f, xs)</C>, the largest |f(x_(i+1)) − f(x_i)| / (x_(i+1) − x_i) over
          consecutive points, and <C>secant_max(f, xs)</C>, the largest absolute secant slope over all pairs i &lt; j.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def lip_estimate(f, xs):
    return 0

def secant_max(f, xs):
    return 0
`,
        solution: SLOPES,
        tests: [
          { name: "estimate", code: `assert abs(lip_estimate(lambda x: 3 * x, [0, 0.5, 2]) - 3) < 1e-12
assert lip_estimate(lambda x: x * x, [0, 1, 2, 3]) == 5` },
          { name: "secant", code: `assert secant_max(lambda x: x * x, [0, 1, 3]) == 4
assert secant_max(lambda x: -x * x, [0, 1, 3]) == lip_estimate(lambda x: -x * x, [0, 1, 3])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          A one-dimensional network has weights ws: each weight except the last scales the current value and then applies
          ReLU (max(0, ·)); the last weight only scales. Write <C>net(ws, x)</C> and <C>lip_bound(ws)</C>, the product of the
          absolute values of the weights as a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def net(ws, x):
    return x

def lip_bound(ws):
    return 1.0
`,
        solution: NET,
        tests: [
          { name: "net", code: `assert net([1, 1], -2) == 0 and net([2, 3], 1) == 6 and net([-1, 2], -3) == 6` },
          { name: "bound", code: `assert lip_bound([2, -3, 0.5]) == 3.0 and lip_bound([]) == 1.0` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that if f is <M>{"K_1"}</M>-Lipschitz and g is <M>{"K_2"}</M>-Lipschitz then g ∘ f is{" "}
          <M>{"K_1 K_2"}</M>-Lipschitz, and that √x is not Lipschitz on [0, 1].
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Applies the Lipschitz bound for g to the points f(x), f(y), then the bound for f, to get |g(f(x)) − g(f(y))| ≤ K₁K₂|x − y|.",
          "For √x, computes the secant slope from 0 to x as 1/√x.",
          "Concludes that 1/√x is unbounded as x → 0, so no constant K works.",
        ],
      },
    },
    {
      key: "grid",
      rung: "stretch",
      prompt: <p>What does lip_estimate(math.sqrt, [i / 1000 for i in range(1001)]) return? Give two decimal places.</p>,
      answer: { kind: "numeric", value: 31.62, tolerance: 0.01 },
    },
  ],

  teachBack:
    "Explain to a friend what a Lipschitz constant is, why Lipschitz functions are uniformly continuous but not conversely, how a derivative bound gives a Lipschitz bound, and why a network's Lipschitz constant is at most the product of its layers' constants.",

  glimpse: (
    <>
      <p>
        The next chapter makes the derivative precise as a limit of difference quotients and proves the mean value theorem
        used above, along with the rules that let you compute derivatives.
      </p>
    </>
  ),
};
