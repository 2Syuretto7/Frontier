import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DiagNetBiasViz } from "@/components/viz/DiagNetBiasViz";
import type { LessonContent } from "@/lib/types";

const POTENTIAL = `import math

def q_fun(z):
    return 2 - math.sqrt(4 + z * z) + z * math.asinh(z / 2)

def Q_alpha(w, alpha):
    return alpha ** 2 * sum(q_fun(wi / alpha ** 2) for wi in w)

def lp_norm(w, p):
    return sum(abs(x) ** p for x in w) ** (1 / p)`;

const DIAGNET = `def predict(u, v, x):
    return sum((a * a - b * b) * xi for a, b, xi in zip(u, v, x))

def diag_step(u, v, X, y, lr):
    n = len(X)
    r = [predict(u, v, x) - t for x, t in zip(X, y)]
    g = [sum(r[i] * X[i][j] for i in range(n)) / n for j in range(len(u))]
    return [a - lr * 2 * a * gj for a, gj in zip(u, g)], [b + lr * 2 * b * gj for b, gj in zip(v, g)]

def train_diag(alpha, X, y, lr, steps):
    u = [alpha] * len(X[0])
    v = [alpha] * len(X[0])
    for _ in range(steps):
        u, v = diag_step(u, v, X, y, lr)
    return [a * a - b * b for a, b in zip(u, v)]`;

export const lesson: LessonContent = {
  id: "m17.6.4",
  minutes: 55,
  links: {
    requires: ["m17.6.1", "m16.7.3"],
    revisits: ["m17.3.3", "m15.5.1"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        An overparametrised network has infinitely many settings that fit the training data perfectly, and they generalise
        very differently. The loss cannot tell them apart, yet gradient descent reliably picks good ones. For linear models
        the answer was the minimum-norm solution. Add a single layer of depth, so that each weight is a product of two
        parameters, and the answer changes completely. Which interpolant does a deep network choose, and what controls it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Writing a weight as a product makes gradient descent multiplicative: a coordinate&apos;s growth rate is proportional to
        its current size. From a tiny initialisation, the few coordinates that matter most grow exponentially while the rest
        stay near zero, so the solution comes out sparse, as with the rich-get-richer stages of m17.6.1. From a large
        initialisation the coordinates barely change relative to their size, the model is effectively linear, and the
        answer is the familiar minimum ℓ2 interpolant.
      </p>
      <DiagNetBiasViz />
    </>
  ),

  theory: (
    <>
      <Definition title="diagonal linear networks">
        <p>
          Parametrise a linear predictor as <M>{"w = u \\odot u - v \\odot v"}</M>, coordinatewise, and run gradient descent on{" "}
          <M>{"\\frac{1}{2n}\\|Xw - y\\|^2"}</M> from <M>{"u = v = \\alpha\\mathbf 1"}</M>, so that <M>{"w(0) = 0"}</M> (<C>predict</C>, <C>diag_step</C>,{" "}
          <C>train_diag</C>). The coordinate gradients are <M>{"\\pm 2u_j g_j"}</M> and <M>{"\\mp 2 v_j g_j"}</M>, with g the gradient with respect to w,
          proportional to the current parameters.
        </p>
        <Code>{DIAGNET}</Code>
      </Definition>

      <Theorem title="initialisation scale interpolates between ℓ1 and ℓ2 (Woodworth and colleagues)">
        <p>
          If gradient flow converges to an interpolant, it converges to
        </p>
        <MD>{"w_\\alpha = \\arg\\min_{Xw = y} Q_\\alpha(w), \\qquad Q_\\alpha(w) = \\alpha^2\\sum_j q\\big(w_j/\\alpha^2\\big), \\qquad q(z) = 2 - \\sqrt{4 + z^2} + z\\,\\operatorname{arcsinh}(z/2)"}</MD>
        <p>
          (<C>q_fun</C>, <C>Q_alpha</C>). As <M>{"\\alpha \\to \\infty"}</M>, <M>{"Q_\\alpha(w) \\approx \\|w\\|_2^2/(4\\alpha^2)"}</M> and <M>{"w_\\alpha"}</M> tends to
          the minimum ℓ2 interpolant; as <M>{"\\alpha \\to 0"}</M>, <M>{"Q_\\alpha(w)/\\ln(1/\\alpha^2) \\to \\|w\\|_1"}</M> and{" "}
          <M>{"w_\\alpha"}</M> tends to the minimum ℓ1 interpolant (<C>lp_norm</C>).
        </p>
        <Code>{POTENTIAL}</Code>
      </Theorem>
      <Proof>
        <p>
          Under gradient flow, <M>{"\\dot u_j = -2u_j g_j"}</M> and <M>{"\\dot v_j = 2v_j g_j"}</M>, so{" "}
          <M>{"u_j(t) = \\alpha e^{-2\\int_0^t g_j}"}</M> and <M>{"v_j(t) = \\alpha e^{2\\int_0^t g_j}"}</M>. With{" "}
          <M>{"g = X^\\top r/n"}</M>, the integral is <M>{"\\int g = X^\\top s"}</M> for some vector s, so{" "}
          <M>{"w(t) = \\alpha^2\\big(e^{-4(X^\\top s)_j} - e^{4(X^\\top s)_j}\\big) = -2\\alpha^2\\sinh\\big(4(X^\\top s)_j\\big)"}</M>. At the limit,{" "}
          <M>{"\\operatorname{arcsinh}(w_j/(2\\alpha^2)) = (X^\\top\\lambda)_j"}</M> for <M>{"\\lambda = -4s"}</M>. Since <M>{"q'(z) = \\operatorname{arcsinh}(z/2)"}</M>,
          this says <M>{"\\nabla Q_\\alpha(w) = X^\\top\\lambda"}</M>, which together with <M>{"Xw = y"}</M> are the optimality conditions of the convex
          problem. The limits follow from <M>{"q(z) = z^2/4 + O(z^4)"}</M> near 0 and <M>{"q(z) = |z|\\ln|z| - |z| + O(1)"}</M> for large |z|.
        </p>
      </Proof>

      <Example title="two measurements of a line">
        <p>
          For one equation <M>{"w_1 + 2w_2 = 2"}</M>, the minimum ℓ2 solution is (0.4, 0.8) and the minimum ℓ1 solution is (0, 1).
          Gradient descent from <M>{"\\alpha = 1"}</M> lands near the first and from <M>{"\\alpha = 0.01"}</M> near the second; in between, the
          optimality condition <M>{"w_j = 2\\alpha^2\\sinh(\\lambda x_j)"}</M> fixes the answer through one scalar λ.
        </p>
      </Example>

      <Remark title="the wider picture">
        <p>
          The same theme runs through deep networks. For matrix factorisation <M>{"W = UV^\\top"}</M>, small initialisation biases gradient
          descent towards low rank, through the saddle-to-saddle stages of m17.6.1; it is not exactly minimum nuclear norm,
          and the precise characterisation is still open. For homogeneous networks trained on separable data with the
          logistic loss, the parameters diverge in a direction that satisfies the optimality conditions of a maximum-margin
          problem in parameter space, the deep analogue of the maximum-margin result of m16.7.3. The step size matters too:
          at large learning rates training drives the sharpness, the top Hessian eigenvalue, to about 2/η and holds it there,
          the edge of stability, which biases training towards flat regions. And the scale of initialisation, which decides
          between lazy and rich training in m17.3.3, decides here between ℓ2 and ℓ1. Which of these biases explains
          generalisation in large models is one of the main open problems of the theory.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "lazy",
      rung: "check",
      prompt: <p>For large α, Q_α(w) ≈ ‖w‖²/(4α²). Evaluate this for w = (1, 2) and α = 100.</p>,
      answer: { kind: "numeric", value: 0.000125, tolerance: 0.000001 },
    },
    {
      key: "qbig",
      rung: "check",
      prompt: <p>Compute q(100) exactly from its definition. Give two decimals.</p>,
      answer: { kind: "numeric", value: 362.51, tolerance: 0.01 },
    },
    {
      key: "mult",
      rung: "apply",
      prompt: <p>Why does a small initialisation make the diagonal network&apos;s solution sparse?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each coordinate grows at a rate proportional to its own size, so the most useful few grow exponentially while the others stay near zero",
          "Small initialisation adds an explicit ℓ1 penalty to the loss",
          "The learning rate is automatically reduced for small weights",
          "With small weights the network cannot fit the data, so it keeps only a few coordinates",
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

def q_fun(z):
    return 2 - math.sqrt(4 + z * z) + z * math.asinh(z / 2)

def Q_alpha(w, alpha):
    return alpha ** 2 * sum(q_fun(wi / alpha ** 2) for wi in w)

def lp_norm(w, p):
    return sum(abs(x) ** p for x in w) ** (1 / p)

print(q_fun(0.0), round(q_fun(2.0), 4), round(Q_alpha([2.0, 0.0], 1.0), 4))
print(lp_norm([3, -4], 1), lp_norm([3, -4], 2), round(Q_alpha([0.02, 0.0], 10.0) / 0.02 ** 2, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 0.9343 0.9343\n7.0 5.0 0.0025",
          "0.0 0.9343 1.8686\n7.0 5.0 0.0025",
          "2.0 0.9343 0.9343\n7.0 5.0 0.25",
          "0.0 0.9343 0.9343\n5.0 7.0 0.0025",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def predict(u, v, x):
    return sum((a * a - b * b) * xi for a, b, xi in zip(u, v, x))

def diag_step(u, v, X, y, lr):
    n = len(X)
    r = [predict(u, v, x) - t for x, t in zip(X, y)]
    g = [sum(r[i] * X[i][j] for i in range(n)) / n for j in range(len(u))]
    return [a - lr * 2 * a * gj for a, gj in zip(u, g)], [b + lr * 2 * b * gj for b, gj in zip(v, g)]

def train_diag(alpha, X, y, lr, steps):
    u = [alpha] * len(X[0])
    v = [alpha] * len(X[0])
    for _ in range(steps):
        u, v = diag_step(u, v, X, y, lr)
    return [a * a - b * b for a, b in zip(u, v)]

print(predict([1.0, 2.0], [0.0, 1.0], [3.0, 1.0]), diag_step([1.0], [1.0], [[1.0]], [2.0], 0.25))
print(train_diag(1.0, [[1.0]], [2.0], 0.25, 1), train_diag(0.5, [[1.0]], [0.0], 0.1, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "6.0 ([2.0], [0.0])\n[4.0] [0.0]",
          "6.0 ([0.0], [2.0])\n[-4.0] [0.0]",
          "5.0 ([2.0], [0.0])\n[4.0] [0.0]",
          "6.0 ([2.0], [0.0])\n[2.0] [0.25]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>q_fun(z)</C>, <C>Q_alpha(w, alpha)</C> and <C>lp_norm(w, p)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def q_fun(z):
    return z * z / 4

def Q_alpha(w, alpha):
    return sum(q_fun(wi) for wi in w)

def lp_norm(w, p):
    return sum(abs(x) for x in w)
`,
        solution: POTENTIAL,
        tests: [
          { name: "potential", code: `assert abs(q_fun(4.0) - (2 - math.sqrt(20) + 4 * math.asinh(2))) < 1e-12 and abs(Q_alpha([1.0, -1.0], 0.5) - 0.5 * q_fun(4.0)) < 1e-12` },
          { name: "norms", code: `assert abs(lp_norm([1, -2, 2], 2) - 3) < 1e-12 and abs(lp_norm([1, -2, 2], 1) - 5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>predict(u, v, x)</C>, <C>diag_step(u, v, X, y, lr)</C>, one gradient step on <M>{"\\frac1{2n}\\|Xw - y\\|^2"}</M> returning the new
          (u, v), and <C>train_diag(alpha, X, y, lr, steps)</C> returning w.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def predict(u, v, x):
    return sum((a - b) * xi for a, b, xi in zip(u, v, x))

def diag_step(u, v, X, y, lr):
    return u, v

def train_diag(alpha, X, y, lr, steps):
    return [0.0] * len(X[0])
`,
        solution: DIAGNET,
        tests: [
          { name: "step", code: `u, v = diag_step([1.0, 1.0], [1.0, 0.5], [[1.0, 0.0], [0.0, 1.0]], [1.0, 0.0], 0.5)\nassert abs(u[0] - 1.5) < 1e-12 and abs(v[0] - 0.5) < 1e-12 and abs(u[1] - 0.625) < 1e-12 and abs(v[1] - 0.6875) < 1e-12` },
          { name: "train", code: `w = train_diag(0.1, [[1.0, 1.0]], [1.0], 0.05, 4000)\nassert abs(w[0] + w[1] - 1) < 1e-6 and abs(w[0] - w[1]) < 1e-9` },
        ],
      },
    },
    {
      key: "kkt",
      rung: "stretch",
      prompt: (
        <p>
          For the single equation <M>{"w_1 + 2w_2 = 2"}</M> and <M>{"\\alpha = 0.1"}</M>, solve the optimality condition{" "}
          <M>{"w_j = 2\\alpha^2\\sinh(\\lambda x_j)"}</M> for λ and report the gradient flow limit&apos;s first coordinate <M>{"w_1"}</M>. Give four
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0965, tolerance: 0.0003 },
    },
  ],

  glimpse: (
    <>
      <p>
        This completes the course: how expressive networks are, how signals pass through them, when they are kernels and
        when they learn features, how to scale them, how their loss scales, and what their training dynamics prefer. The
        open problems at the end of each part are where current research lives.
      </p>
    </>
  ),
};
