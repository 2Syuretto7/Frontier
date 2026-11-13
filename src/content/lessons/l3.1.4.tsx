import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { UniversalApproxViz } from "@/components/viz/UniversalApproxViz";
import type { LessonContent } from "@/lib/types";

const INTERP = `import numpy as np

def relu_interpolant(f, a, b, n):
    knots = np.linspace(a, b, n + 1)
    vals = f(knots)
    slopes = np.diff(vals) / np.diff(knots)
    coef = np.concatenate([[slopes[0]], np.diff(slopes)])
    return knots, vals[0], coef

def evaluate(x, knots, c0, coef):
    return c0 + np.maximum(x[:, None] - knots[None, :-1], 0) @ coef
`;

const ERR = `def max_error(f, a, b, n):
    knots, c0, coef = relu_interpolant(f, a, b, n)
    x = np.linspace(a, b, 10001)
    return float(np.max(np.abs(evaluate(x, knots, c0, coef) - f(x))))

def units_needed(f2max, a, b, eps):
    n = 1
    while ((b - a) / n) ** 2 * f2max / 8 > eps:
        n += 1
    return n
`;

export const lesson: LessonContent = {
  id: "l3.1.4",
  minutes: 45,
  links: {
    requires: ["l3.1.3", "m2.4.1"],
    revisits: ["l3.1.2"],
    foreshadows: ["l3.5.3", "m17.3.2"],
  },

  puzzle: (
    <>
      <p>
        A famous theorem says a network with a single hidden layer can approximate any continuous function as closely as you
        like. If one layer is enough, why does anyone build networks with a hundred? What exactly does the theorem promise,
        and what does it leave out?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In one dimension the idea is concrete. Each ReLU unit <M>{"\\operatorname{relu}(x - t)"}</M> adds a bend at{" "}
        <M>{"t"}</M>. Summing bends with the right weights draws any polygonal line, and a polygonal line through enough points
        of a continuous curve is as close to it as you like.
      </p>
      <UniversalApproxViz />
      <p>
        The theorem is about existence: it says such weights exist, not that gradient descent finds them, not how many units
        are needed in many dimensions, and not that the network will be right on inputs it was not trained on.
      </p>
    </>
  ),

  theory: (
    <>
      <Theorem title="polygonal lines are one-layer ReLU networks">
        <p>
          Let <M>{"g"}</M> be the piecewise-linear function through <M>{"(x_i, y_i)"}</M>, <M>{"x_0 < x_1 < \\dots < x_n"}</M>,
          with slope <M>{"s_i"}</M> on <M>{"[x_i, x_{i+1}]"}</M>. Then on <M>{"[x_0, x_n]"}</M>
        </p>
        <MD>{"g(x) = y_0 + s_0\\,\\operatorname{relu}(x - x_0) + \\sum_{i=1}^{n-1} (s_i - s_{i-1})\\,\\operatorname{relu}(x - x_i),"}</MD>
        <p>a network with n hidden ReLU units.</p>
      </Theorem>
      <Proof>
        <p>
          Call the right side <M>{"h"}</M>. At <M>{"x_0"}</M> every ReLU is 0, so <M>{"h(x_0) = y_0"}</M>. On the open interval{" "}
          <M>{"(x_k, x_{k+1})"}</M>, the units with <M>{"i \\le k"}</M> are active with slope 1 and the rest are 0, so the slope
          of <M>{"h"}</M> is <M>{"s_0 + \\sum_{i=1}^{k}(s_i - s_{i-1}) = s_k"}</M>, which telescopes. Both <M>{"g"}</M> and{" "}
          <M>{"h"}</M> are continuous, agree at <M>{"x_0"}</M> and have the same slope on every piece, so they are equal.
        </p>
      </Proof>

      <Definition title="the interpolant in code">
        <Code>{INTERP}</Code>
      </Definition>

      <Theorem title="universal approximation (Cybenko, Hornik, Leshno and others)">
        <p>
          For any continuous <M>{"f"}</M> on a compact set in <M>{"\\mathbb{R}^d"}</M>, any non-polynomial continuous
          activation and any <M>{"\\varepsilon > 0"}</M>, some network with one hidden layer satisfies{" "}
          <M>{"|f(x) - \\hat f(x)| < \\varepsilon"}</M> on the whole set.
        </p>
      </Theorem>

      <Example title="how many units, in one dimension">
        <p>
          For a twice differentiable f on <M>{"[a, b]"}</M> with <M>{"|f''| \\le K"}</M>, interpolating at n equal intervals of
          width <M>{"h = (b - a)/n"}</M> gives error at most <M>{"Kh^2/8"}</M>. Halving h quarters the error.
        </p>
        <Code>{ERR}</Code>
      </Example>

      <Remark title="what the theorem leaves out">
        <p>
          A grid in d dimensions with k points per axis has <M>{"k^d"}</M> cells, so a construction like this one needs
          exponentially many units as the dimension grows. Deep networks can represent some functions with exponentially fewer
          units than shallow ones, by composing features. And none of this says anything about finding the weights by training,
          or about generalising from finitely many examples; later courses take those up.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "promise",
      rung: "check",
      prompt: <p>What does the universal approximation theorem guarantee?</p>,
      answer: {
        kind: "choice",
        options: [
          "That suitable weights exist for a wide enough single hidden layer",
          "That gradient descent will find a good approximation",
          "That the network will generalise to new inputs",
          "That a small number of hidden units always suffices",
        ],
        correct: [0],
      },
    },
    {
      key: "bound",
      rung: "check",
      prompt: <p>f(x) = x² on [0, 1] is interpolated at 10 equal intervals. What is the error bound Kh²/8?</p>,
      answer: { kind: "numeric", value: 0.0025 },
    },
    {
      key: "units",
      rung: "apply",
      prompt: <p>A polygonal line on an interval has 7 linear pieces. How many hidden ReLU units does the construction in this lesson use?</p>,
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

x = np.array([-2.0, -0.5, 0.0, 1.5])
relu = lambda z: np.maximum(z, 0)
print((relu(x) + relu(-x)).tolist(), (relu(x) - relu(x - 1)).tolist())`}</Code>
          <p>Two small ReLU networks. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[2.0, 0.5, 0.0, 1.5] [0.0, 0.0, 0.0, 1.0]", "[2.0, 0.5, 0.0, 1.5] [0.0, 0.0, 0.0, 1.5]", "[0.0, 0.0, 0.0, 1.5] [0.0, 0.0, 0.0, 1.0]", "[-2.0, -0.5, 0.0, 1.5] [0.0, 0.0, 0.0, 1.0]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def relu_interpolant(f, a, b, n):
    knots = np.linspace(a, b, n + 1)
    vals = f(knots)
    slopes = np.diff(vals) / np.diff(knots)
    coef = np.concatenate([[slopes[0]], np.diff(slopes)])
    return knots, vals[0], coef

def evaluate(x, knots, c0, coef):
    return c0 + np.maximum(x[:, None] - knots[None, :-1], 0) @ coef

def max_error(f, a, b, n):
    knots, c0, coef = relu_interpolant(f, a, b, n)
    x = np.linspace(a, b, 10001)
    return float(np.max(np.abs(evaluate(x, knots, c0, coef) - f(x))))

def units_needed(f2max, a, b, eps):
    n = 1
    while ((b - a) / n) ** 2 * f2max / 8 > eps:
        n += 1
    return n

sq = lambda t: t ** 2
e4, e8 = max_error(sq, 0, 1, 4), max_error(sq, 0, 1, 8)
print(round(e4, 6), round(e8, 6), round(e4 / e8, 2), units_needed(2.0, 0, 1, 0.003))`}</Code>
          <p>Interpolating x² with 4 and 8 pieces. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.015625 0.003906 4.0 10", "0.015625 0.007812 2.0 10", "0.0625 0.015625 4.0 10", "0.015625 0.003906 4.0 11"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>relu_interpolant(f, a, b, n)</C>, returning (knots, c0, coef): the n + 1 equally spaced knots, the value at{" "}
          <M>{"a"}</M>, and the n output weights <M>{"s_0, s_1 - s_0, \\dots"}</M>; and <C>evaluate(x, knots, c0, coef)</C>{" "}
          for a 1-D array x, computing <M>{"c_0 + \\sum_i \\text{coef}_i\\,\\operatorname{relu}(x - x_i)"}</M> over the first n
          knots.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def relu_interpolant(f, a, b, n):
    return np.linspace(a, b, n + 1), 0.0, np.zeros(n)

def evaluate(x, knots, c0, coef):
    return np.zeros_like(x)
`,
        solution: INTERP,
        tests: [
          { name: "passes through the knots", code: `f = lambda t: np.sin(3 * t) + t
knots, c0, coef = relu_interpolant(f, -1.0, 2.0, 7)
assert len(knots) == 8 and len(coef) == 7 and abs(c0 - f(-1.0)) < 1e-12
assert np.allclose(evaluate(knots, knots, c0, coef), f(knots))` },
          { name: "linear between knots", code: `knots, c0, coef = relu_interpolant(np.abs, -1.0, 1.0, 2)
x = np.array([-1.0, -0.5, 0.0, 0.25, 1.0])
assert np.allclose(evaluate(x, knots, c0, coef), np.abs(x)) and np.allclose(coef, [-1.0, 2.0])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With the interpolant defined, write <C>max_error(f, a, b, n)</C>, the largest absolute error on 10 001 evenly
          spaced points of [a, b], and <C>units_needed(f2max, a, b, eps)</C>, the smallest n for which the bound{" "}
          <M>{"((b - a)/n)^2 K/8"}</M> is at most eps.
        </p>
      ),
      answer: {
        kind: "code",
        setup: INTERP,
        starter: `# relu_interpolant and evaluate are already defined.

def max_error(f, a, b, n):
    return 0.0

def units_needed(f2max, a, b, eps):
    return 1
`,
        solution: ERR,
        tests: [
          { name: "error halves twice", code: `sq = lambda t: t ** 2
assert abs(max_error(sq, 0, 1, 4) - 1 / 64) < 1e-9
assert abs(max_error(sq, 0, 1, 8) - 1 / 256) < 1e-9
assert max_error(np.sin, 0, 3, 20) <= (3 / 20) ** 2 / 8 + 1e-12` },
          { name: "units", code: `assert units_needed(2.0, 0, 1, 0.003) == 10
assert units_needed(1.0, 0, 2, 0.5) == 1 and units_needed(8.0, 0, 1, 1e-4) == 100` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that the piecewise-linear function through <M>{"(x_0, y_0), \\dots, (x_n, y_n)"}</M> equals{" "}
          <M>{"y_0 + s_0\\,\\operatorname{relu}(x - x_0) + \\sum_{i=1}^{n-1}(s_i - s_{i-1})\\,\\operatorname{relu}(x - x_i)"}</M>{" "}
          on <M>{"[x_0, x_n]"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Checks the value at x₀: every ReLU term is 0, giving y₀.",
          "Computes the slope on (x_k, x_{k+1}): exactly the units with i ≤ k are active, and the coefficients telescope to s_k.",
          "Concludes equality from continuity, equal starting value and equal slope on every piece (for example by integrating the slope).",
        ],
      },
    },
    {
      key: "grid",
      rung: "stretch",
      prompt: <p>A grid with 10 points per axis covers the unit cube in d = 10 dimensions. How many grid points is that?</p>,
      answer: { kind: "numeric", value: 10000000000 },
    },
  ],

  teachBack:
    "Explain to a friend how a single hidden layer of ReLUs can draw any polygonal line, what the universal approximation theorem promises, and three things it does not promise.",

  glimpse: (
    <p>
      Representing a function is half the story; the other half is finding the weights. Next chapter: backpropagation,
      starting from the computational graph.
    </p>
  ),
};
