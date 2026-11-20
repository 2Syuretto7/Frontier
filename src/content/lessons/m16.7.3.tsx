import { M, MD } from "@/components/Math";
import { Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MaxMarginDriftViz } from "@/components/viz/MaxMarginDriftViz";
import type { LessonContent } from "@/lib/types";

const SQUARES = `def gd_least_squares(X, y, eta, steps, w0=None):
    w = [0.0] * len(X[0]) if w0 is None else w0[:]
    for _ in range(steps):
        r = [sum(a * b for a, b in zip(row, w)) - v for row, v in zip(X, y)]
        g = [sum(row[j] * ri for row, ri in zip(X, r)) for j in range(len(w))]
        w = [wj - eta * gj for wj, gj in zip(w, g)]
    return w

def sq_norm(w):
    return sum(v * v for v in w)

def null_component(w, v):
    return sum(a * b for a, b in zip(w, v)) / sq_norm(v)`;

const LOGISTIC = `import math

def logistic_grad(X, y, w):
    g = [0.0] * len(w)
    for row, yi in zip(X, y):
        z = yi * sum(a * b for a, b in zip(row, w))
        s = -yi / (1 + math.exp(z)) / len(y)
        g = [gj + s * a for gj, a in zip(g, row)]
    return g

def gd_logistic(X, y, eta, steps):
    w = [0.0] * len(X[0])
    for _ in range(steps):
        w = [wj - eta * gj for wj, gj in zip(w, logistic_grad(X, y, w))]
    return w

def normalised_margin(X, y, w):
    nw = math.sqrt(sum(v * v for v in w))
    return min(yi * sum(a * b for a, b in zip(row, w)) for row, yi in zip(X, y)) / nw`;

export const lesson: LessonContent = {
  id: "m16.7.3",
  minutes: 45,
  links: {
    requires: ["m16.7.2", "m10.5.1"],
    revisits: ["m16.3.2", "m10.7.4"],
    foreshadows: ["m17.6.4", "m16.7.4"],
  },

  puzzle: (
    <>
      <p>
        An overparameterised model has a whole manifold of parameter settings with zero training loss, and they predict very
        differently off the data. Nobody tells gradient descent which one to pick: there is no penalty in the objective.
        Yet the networks it finds generalise. Does the algorithm itself carry a preference, and if so, for what?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Gradients of a linear model always lie in the span of the inputs. Starting from zero, gradient descent can never
        move in a direction the data cannot see, so of all the solutions it reaches the one with the smallest norm. On
        separable classification data the logistic loss is never zero, the weights grow for ever, and the only question is
        the direction: it turns out to be the maximum-margin direction, which is exactly what the margin bounds of m16.3.2
        reward.
      </p>
      <MaxMarginDriftViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="least squares: gradient descent finds the minimum-norm solution">
        <p>
          Let <M>{"Xw = y"}</M> be solvable, and run gradient descent on <M>{"\\tfrac12\\|Xw - y\\|^2"}</M> from <M>{"w_0"}</M> with a step{" "}
          <M>{"\\eta < 2/\\sigma_{\\max}(X)^2"}</M>. Then <M>{"w_t \\to X^+y + (I - X^+X)w_0"}</M>. In particular, from <M>{"w_0 = 0"}</M> it
          converges to the minimum-norm solution.
        </p>
      </Theorem>
      <Proof>
        <p>
          Every gradient <M>{"X^\\top(Xw - y)"}</M> lies in the row space of X, so the component of <M>{"w_t"}</M> in the null space of X
          never changes (<C>null_component</C>). Within the row space the loss is strongly convex and the iteration contracts
          to the unique solution there, which is <M>{"X^+ y"}</M>. The limit is that solution plus the untouched null-space part
          of the start (<C>gd_least_squares</C>). Since <M>{"X^+y"}</M> is orthogonal to the null space, adding anything to it only
          increases the norm (<C>sq_norm</C>).
        </p>
        <Code>{SQUARES}</Code>
      </Proof>

      <Theorem title="logistic regression: gradient descent finds the maximum margin (Soudry and coauthors)">
        <p>
          Let the data be linearly separable through the origin and run gradient descent with a small enough fixed step on
          the logistic loss <M>{"\\tfrac1m\\sum_i \\log(1 + e^{-y_i w^\\top x_i})"}</M>. Then <M>{"\\|w_t\\| \\to \\infty"}</M> like{" "}
          <M>{"\\log t"}</M>, and
        </p>
        <MD>{"\\frac{w_t}{\\|w_t\\|} \\to \\hat w = \\arg\\max_{\\|w\\| = 1} \\min_i y_i w^\\top x_i,"}</MD>
        <p>the hard-margin support vector machine direction, with the angle shrinking like <M>{"1/\\log t"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          A sketch. The loss is convex with infimum 0 that is not attained, so the iterates diverge while the loss tends to
          0. Once the norm is large, the gradient <M>{"-\\tfrac1m\\sum_i y_i x_i / (1 + e^{y_i w^\\top x_i})"}</M> is dominated by the points
          with the smallest margins <M>{"y_i w^\\top x_i"}</M>, since their weights are exponentially larger (<C>logistic_grad</C>).
          So gradient descent keeps adding non-negative combinations of the hardest examples: in the limit the direction is
          a non-negative combination of the points achieving the minimum margin. These are exactly the KKT conditions of the
          hard-margin problem, whose solution is unique. Writing <M>{"w_t = \\hat w \\log t + \\rho_t"}</M> and showing{" "}
          <M>{"\\rho_t"}</M> stays bounded gives the rate.
        </p>
        <Code>{LOGISTIC}</Code>
      </Proof>

      <Remark title="why this matters for generalisation">
        <p>
          The margin bound of m16.3.2 controls test error by <M>{"R/(\\gamma\\sqrt m)"}</M>, where γ is the normalised margin (
          <C>normalised_margin</C>). Unregularised gradient descent on separable data maximises γ in the limit, so it inherits
          that bound with no penalty term in sight. The logarithmic rate is a warning, though: early stopping leaves the
          direction noticeably off, as in the figure.
        </p>
      </Remark>

      <Theorem title="the bias depends on the geometry">
        <p>
          Steepest descent with respect to a norm ‖·‖ on separable data converges in direction to the maximum-margin
          classifier for that norm. Mirror descent with potential ψ on underdetermined least squares converges to the
          solution minimising the Bregman divergence from the start, <M>{"D_\\psi(w, w_0)"}</M> (m10.7.4).
        </p>
      </Theorem>
      <Proof>
        <p>
          For mirror descent the dual iterates <M>{"\\nabla\\psi(w_t)"}</M> move only along the row space of X, exactly as w did in
          the Euclidean case. The limit therefore satisfies <M>{"\\nabla\\psi(w_\\infty) - \\nabla\\psi(w_0) \\in \\operatorname{row}(X)"}</M> and{" "}
          <M>{"Xw_\\infty = y"}</M>, which are the optimality conditions for minimising <M>{"D_\\psi(w, w_0)"}</M> subject to{" "}
          <M>{"Xw = y"}</M>. The steepest-descent statement follows from the same KKT argument with the dual norm in place of
          the Euclidean one.
        </p>
      </Proof>

      <Remark title="beyond linear models">
        <p>
          Reparameterising changes the bias. Writing a linear predictor as <M>{"w = u \\odot u - v \\odot v"}</M> and running gradient
          descent on (u, v) from a small initialisation scale α finds an approximately minimal <M>{"\\ell_1"}</M> solution as α → 0
          and the minimum <M>{"\\ell_2"}</M> solution as α → ∞, so the scale of the start decides between sparse and dense fits.
          For deep homogeneous networks gradient descent converges in direction to a KKT point of a margin maximisation
          problem in parameter space (m17.6.4). In each case the generalisation of the trained model is decided by the
          optimiser as much as by the model class.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "minnorm",
      rung: "check",
      prompt: <p>Gradient descent from zero is run on least squares for the single equation w₁ + 2w₂ = 5. What is ‖w‖² at the limit?</p>,
      answer: { kind: "numeric", value: 5, tolerance: 0.0001 },
    },
    {
      key: "margin",
      rung: "check",
      prompt: <p>The points are (2, 1) with label +1 and (−1, 1) with label −1. What is the normalised margin of w = (1, −1)? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.7071, tolerance: 0.0001 },
    },
    {
      key: "direction",
      rung: "apply",
      prompt: <p>On linearly separable data, unregularised gradient descent on the logistic loss converges to what?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its norm diverges and its direction converges to the hard-margin support vector machine direction",
          "A finite minimiser of the logistic loss",
          "The least-squares solution",
          "The direction of the mean difference between the two classes",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def gd_least_squares(X, y, eta, steps, w0=None):
    w = [0.0] * len(X[0]) if w0 is None else w0[:]
    for _ in range(steps):
        r = [sum(a * b for a, b in zip(row, w)) - v for row, v in zip(X, y)]
        g = [sum(row[j] * ri for row, ri in zip(X, r)) for j in range(len(w))]
        w = [wj - eta * gj for wj, gj in zip(w, g)]
    return w

def sq_norm(w):
    return sum(v * v for v in w)

def null_component(w, v):
    return sum(a * b for a, b in zip(w, v)) / sq_norm(v)

print(gd_least_squares([[1.0, 1.0]], [2.0], 0.25, 2), [round(v, 6) for v in gd_least_squares([[1.0, 1.0]], [2.0], 0.25, 50)])
print(sq_norm([3.0, 4.0]), null_component([3.0, 1.0], [1.0, -1.0]), null_component(gd_least_squares([[1.0, 2.0]], [5.0], 0.1, 30), [2.0, -1.0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.75, 0.75] [1.0, 1.0]\n25.0 1.0 0.0",
          "[0.75, 0.75] [2.0, 0.0]\n25.0 1.0 0.0",
          "[1.0, 1.0] [1.0, 1.0]\n25.0 2.0 0.0",
          "[0.75, 0.75] [1.0, 1.0]\n5.0 1.0 1.0",
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

def logistic_grad(X, y, w):
    g = [0.0] * len(w)
    for row, yi in zip(X, y):
        z = yi * sum(a * b for a, b in zip(row, w))
        s = -yi / (1 + math.exp(z)) / len(y)
        g = [gj + s * a for gj, a in zip(g, row)]
    return g

def gd_logistic(X, y, eta, steps):
    w = [0.0] * len(X[0])
    for _ in range(steps):
        w = [wj - eta * gj for wj, gj in zip(w, logistic_grad(X, y, w))]
    return w

def normalised_margin(X, y, w):
    nw = math.sqrt(sum(v * v for v in w))
    return min(yi * sum(a * b for a, b in zip(row, w)) for row, yi in zip(X, y)) / nw

print(logistic_grad([[1.0, 0.0]], [1], [0.0, 0.0]), normalised_margin([[1.0, 0.0], [0.0, -1.0]], [1, -1], [3.0, 4.0]))
w = gd_logistic([[2.0, 0.0], [-1.0, 0.0]], [1, -1], 1.0, 100); print(w[1], w[0] > 3, normalised_margin([[2.0, 0.0], [-1.0, 0.0]], [1, -1], w))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[-0.5, 0.0] 0.6\n0.0 True 1.0",
          "[0.5, 0.0] 0.6\n0.0 True 1.0",
          "[-0.5, 0.0] 0.8\n0.0 True 2.0",
          "[-0.5, 0.0] 0.6\n0.0 False 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gd_least_squares(X, y, eta, steps, w0=None)</C> on <M>{"\\tfrac12\\|Xw - y\\|^2"}</M>, starting from zero when{" "}
          <C>w0</C> is None, <C>sq_norm(w)</C>, and <C>null_component(w, v)</C>, the coefficient of the projection of w on v.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def gd_least_squares(X, y, eta, steps, w0=None):
    return [0.0] * len(X[0])

def sq_norm(w):
    return 0.0

def null_component(w, v):
    return 0.0
`,
        solution: SQUARES,
        tests: [
          { name: "descent", code: `w = gd_least_squares([[2.0, 0.0]], [4.0], 0.125, 1)
assert all(abs(a - b) < 1e-12 for a, b in zip(w, [1.0, 0.0])) and all(abs(a - b) < 1e-9 for a, b in zip(gd_least_squares([[1.0, 0.0, 1.0]], [4.0], 0.2, 200), [2.0, 0.0, 2.0]))
u = gd_least_squares([[1.0, 0.0, 1.0]], [4.0], 0.2, 200, [0.0, 3.0, 0.0])
assert all(abs(a - b) < 1e-9 for a, b in zip(u, [2.0, 3.0, 2.0]))` },
          { name: "norms", code: `assert sq_norm([1.0, -2.0, 2.0]) == 9.0 and abs(null_component([1.0, 4.0], [0.0, 2.0]) - 2.0) < 1e-12 and null_component([5.0, 0.0], [0.0, 1.0]) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>logistic_grad(X, y, w)</C> for the mean logistic loss with labels ±1, <C>gd_logistic(X, y, eta, steps)</C>{" "}
          starting from zero, and <C>normalised_margin(X, y, w)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def logistic_grad(X, y, w):
    return [0.0] * len(w)

def gd_logistic(X, y, eta, steps):
    return [0.0] * len(X[0])

def normalised_margin(X, y, w):
    return 0.0
`,
        solution: LOGISTIC,
        tests: [
          { name: "gradient", code: `g = logistic_grad([[1.0, 2.0], [3.0, 0.0]], [1, -1], [0.0, 0.0])
assert all(abs(a - b) < 1e-12 for a, b in zip(g, [0.5, -0.5])) and abs(normalised_margin([[1.0, 2.0], [3.0, 0.0]], [1, -1], [-3.0, 4.0]) - 1.0) < 1e-12` },
          { name: "descent", code: `X, y = [[1.0, 1.0], [-1.0, 1.0], [2.0, 2.0]], [1, -1, 1]
w1 = gd_logistic(X, y, 1.0, 1)
assert all(abs(a - b) < 1e-12 for a, b in zip(w1, [2 / 3, 1 / 3])) and normalised_margin(X, y, gd_logistic(X, y, 1.0, 2000)) > 0.6` },
        ],
      },
    },
    {
      key: "start",
      rung: "stretch",
      prompt: (
        <p>
          Gradient descent with a small step solves <M>{"Xw = y"}</M> for{" "}
          <M>{"X = \\begin{pmatrix} 1 & 2 & 2 \\\\ 0 & 1 & 1 \\end{pmatrix}"}</M> and y = (3, 1), starting from <M>{"w_0 = (1, 1, -1)"}</M>. What
          is the squared norm of the limit?
        </p>
      ),
      answer: { kind: "numeric", value: 3.5, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Margins, norms and flat minima all say that some solutions are simpler than others. The last lesson turns that idea
        into a bound for a whole distribution over hypotheses, centred on a prior: the PAC-Bayes theorem, which gives
        non-vacuous guarantees for real networks.
      </p>
    </>
  ),
};
