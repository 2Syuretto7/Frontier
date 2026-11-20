import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LazyTrainingViz } from "@/components/viz/LazyTrainingViz";
import type { LessonContent } from "@/lib/types";

const EMPIRICAL = `import math

def net(p, x):
    v, w, b = p
    return sum(vj * max(0.0, wj * x + bj) for vj, wj, bj in zip(v, w, b)) / math.sqrt(len(v))

def grad(p, x):
    v, w, b = p
    s = 1 / math.sqrt(len(v))
    on = [1.0 if wj * x + bj > 0 else 0.0 for wj, bj in zip(w, b)]
    return [max(0.0, wj * x + bj) * s for wj, bj in zip(w, b)] + [vj * o * x * s for vj, o in zip(v, on)] + [vj * o * s for vj, o in zip(v, on)]

def ntk(p, x, xp):
    return sum(g * h for g, h in zip(grad(p, x), grad(p, xp)))`;

const LIMIT = `import math

def arc(x, xp):
    k11, k12, k22 = x * x + 1, x * xp + 1, xp * xp + 1
    r = math.sqrt(k11 * k22)
    t = math.acos(max(-1.0, min(1.0, k12 / r)))
    return r * (math.sin(t) + (math.pi - t) * math.cos(t)) / (2 * math.pi), (math.pi - t) / (2 * math.pi)

def ntk_limit(x, xp):
    K, S = arc(x, xp)
    return K + (x * xp + 1) * S

def gd_residual(theta, r0, eta, k):
    return r0 * (1 - eta * theta) ** k`;

export const lesson: LessonContent = {
  id: "m17.3.2",
  minutes: 55,
  links: {
    requires: ["m17.3.1"],
    revisits: ["m16.5.1", "l3.4.1"],
    foreshadows: ["m17.3.3", "m17.4.1"],
  },

  puzzle: (
    <>
      <p>
        Training a neural network is a non-convex optimisation over millions of parameters, and there is no general reason
        for gradient descent to reach zero training loss. Yet very wide networks reliably do, and the function they end up
        computing can be predicted in advance by solving a linear system. How can a non-convex problem become, in a limit,
        as simple as kernel regression?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In a wide network each weight has a tiny influence on the output, so fitting the data needs each weight to move only
        a tiny amount. Over such small moves the network is indistinguishable from its first-order Taylor expansion in the
        parameters, a linear model with fixed features: the gradients at initialisation. Gradient descent on a linear model
        with squared loss is kernel regression, with the kernel built from those gradients.
      </p>
      <LazyTrainingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the neural tangent kernel">
        <p>
          For a network <M>{"f_\\theta"}</M>, the neural tangent kernel at parameters θ is
        </p>
        <MD>{"\\Theta_\\theta(x, x') = \\nabla_\\theta f_\\theta(x) \\cdot \\nabla_\\theta f_\\theta(x')."}</MD>
        <p>
          A gradient step <M>{"\\theta \\leftarrow \\theta - \\eta \\sum_i r_i \\nabla_\\theta f(x_i)"}</M> on the loss <M>{"\\tfrac12 \\sum_i r_i^2"}</M>, with
          residuals <M>{"r_i = f(x_i) - y_i"}</M>, changes the output at any input by, to first order,
        </p>
        <MD>{"f(x) \\leftarrow f(x) - \\eta \\sum_i \\Theta_\\theta(x, x_i)\\, r_i."}</MD>
        <p>
          The kernel says how much a step taken to fix the output at <M>{"x_i"}</M> also moves the output at x. For the one-hidden-layer
          network <M>{"f(x) = n^{-1/2}\\sum_j v_j\\, \\mathrm{relu}(w_j x + b_j)"}</M> the gradient has three blocks, for v, w and b (<C>net</C>,{" "}
          <C>grad</C>, <C>ntk</C>).
        </p>
        <Code>{EMPIRICAL}</Code>
      </Definition>

      <Theorem title="the kernel at initialisation (Jacot, Gabriel and Hongler)">
        <p>
          With all weights N(0, 1) and the <M>{"n^{-1/2}"}</M> factor in front (the NTK parametrisation), as <M>{"n \\to \\infty"}</M>,
        </p>
        <MD>{"\\Theta_{\\theta_0}(x, x') \\to \\Theta_\\infty(x, x') = K(x, x') + (xx' + 1)\\, \\frac{\\pi - \\vartheta}{2\\pi}"}</MD>
        <p>
          almost surely, where K is the NNGP kernel of m17.3.1 and <M>{"\\cos\\vartheta = (xx'+1)/\\sqrt{(x^2+1)(x'^2+1)}"}</M> (<C>arc</C>,{" "}
          <C>ntk_limit</C>).
        </p>
        <Code>{LIMIT}</Code>
      </Theorem>
      <Proof>
        <p>
          Summing the products of the three gradient blocks,
        </p>
        <MD>{"\\Theta_{\\theta_0}(x, x') = \\frac1n \\sum_{j=1}^n \\Big( \\mathrm{relu}(u_j)\\,\\mathrm{relu}(u_j') + v_j^2\\, \\mathbb 1[u_j > 0]\\, \\mathbb 1[u_j' > 0]\\,(xx' + 1) \\Big),"}</MD>
        <p>
          with <M>{"u_j = w_j x + b_j"}</M>. This is an average of n independent terms, so by the strong law it converges to its mean. The first
          term&apos;s mean is K. In the second, <M>{"\\mathbb E v^2 = 1"}</M> and <M>{"\\mathbb P(u > 0, u' > 0) = (\\pi - \\vartheta)/(2\\pi)"}</M> for a centred
          Gaussian pair at angle ϑ, the fraction of directions lying within a right angle of both.
        </p>
      </Proof>

      <Theorem title="the kernel stays put">
        <p>
          For a fixed number of gradient steps with fixed η, <M>{"\\sup_k |\\Theta_{\\theta_k} - \\Theta_{\\theta_0}| \\to 0"}</M> as{" "}
          <M>{"n \\to \\infty"}</M>, and the relative change of the parameters, <M>{"\\|\\theta_k - \\theta_0\\|/\\|\\theta_0\\|"}</M>, is{" "}
          <M>{"O(n^{-1/2})"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each coordinate of <M>{"\\nabla_\\theta f"}</M> is <M>{"O(n^{-1/2})"}</M>. While the residuals stay bounded, every step moves each weight by{" "}
          <M>{"O(\\eta n^{-1/2})"}</M>, so after k steps each weight has moved <M>{"O(k\\eta n^{-1/2})"}</M>: the total displacement{" "}
          <M>{"\\|\\theta_k - \\theta_0\\|"}</M> is O(1) while <M>{"\\|\\theta_0\\|"}</M> is of order <M>{"\\sqrt n"}</M>. Each term of the kernel sum depends
          on one unit&apos;s weights, and smoothly except where a unit switches; a move of <M>{"O(n^{-1/2})"}</M> changes each term by{" "}
          <M>{"O(n^{-1/2})"}</M> and switches only a fraction <M>{"O(n^{-1/2})"}</M> of units, so the average changes by <M>{"O(n^{-1/2})"}</M>. A
          Grönwall argument keeps the residuals bounded, closing the loop.
        </p>
      </Proof>

      <Theorem title="training is kernel regression">
        <p>
          In the limit, on the training inputs X the residuals evolve linearly, <M>{"r_k = (I - \\eta\\, \\Theta_\\infty(X, X))^k r_0"}</M>
          (<C>gd_residual</C> for one point), so training converges when <M>{"\\eta < 2/\\lambda_{\\max}"}</M>, and the trained network is
        </p>
        <MD>{"f_\\infty(x) = f_0(x) + \\Theta_\\infty(x, X)\\, \\Theta_\\infty(X, X)^{-1} \\big(y - f_0(X)\\big),"}</MD>
        <p>
          the minimum-norm interpolant in the RKHS of <M>{"\\Theta_\\infty"}</M> (m16.5.1), shifted by the random initial function.
        </p>
      </Theorem>
      <Proof>
        <p>
          With a constant kernel the first-order update is exact for the linearised model, and on the training points it reads{" "}
          <M>{"r_{k+1} = r_k - \\eta\\,\\Theta(X, X) r_k"}</M>. Diagonalise Θ(X, X): each eigencomponent is multiplied by <M>{"1 - \\eta\\lambda"}</M>, which has
          modulus below 1 for every positive λ exactly when <M>{"\\eta < 2/\\lambda_{\\max}"}</M>. Summing the updates at a test input,{" "}
          <M>{"f_k(x) - f_0(x) = -\\eta\\,\\Theta(x, X) \\sum_{s < k} r_s"}</M>, and the geometric series of matrices sums to{" "}
          <M>{"-\\Theta(X,X)^{-1} r_0"}</M> as <M>{"k \\to \\infty"}</M>.
        </p>
      </Proof>

      <Example title="reading the viz">
        <p>
          The viz subtracts the initial function, so the dashed curve is <M>{"\\Theta_\\infty(x, X)\\Theta_\\infty(X, X)^{-1}(I - (I - \\eta\\Theta_\\infty)^{400}) y"}</M>.
          At width 3000 the trained network is within about 0.08 of it everywhere, its weights having moved by a few per cent;
          at width 5 the network does something visibly different.
        </p>
      </Example>

      <Remark title="deep networks and the meaning of lazy">
        <p>
          For deep networks the limit kernel obeys a recursion alongside the NNGP one,{" "}
          <M>{"\\Theta^{l+1} = K^{l+1} + \\sigma_w^2\\, \\Theta^l\\, \\mathbb E[\\phi'(u)\\phi'(u')]"}</M>, with the same kind of Gaussian expectations.
          Chizat and Bach observed that nothing here is special to width: any model multiplied by a large output scale trains
          in this lazy way, because a small parameter move already changes the output a lot. Lazy training is guaranteed and
          analysable, but it learns no features, which is the subject of the next lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "diag",
      rung: "check",
      prompt: <p>For the network in the viz, compute the limiting tangent kernel <M>{"\\Theta_\\infty(3, 3)"}</M>.</p>,
      answer: { kind: "numeric", value: 10, tolerance: 0.0001 },
    },
    {
      key: "eta",
      rung: "check",
      prompt: <p>The largest eigenvalue of <M>{"\\Theta_\\infty(X, X)"}</M> on a training set is 8. Above what step size does gradient descent on the linearised model diverge?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
    {
      key: "lazy",
      rung: "apply",
      prompt: <p>Why does the tangent kernel of a very wide network barely change during training?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each weight needs to move only O(1/√n) to fit the data, and the kernel is an average over units, each changed by about that much",
          "The learning rate is automatically scaled to zero as the width grows",
          "The loss is convex in the parameters for wide networks",
          "The kernel is computed only once and then frozen by the training algorithm",
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

def net(p, x):
    v, w, b = p
    return sum(vj * max(0.0, wj * x + bj) for vj, wj, bj in zip(v, w, b)) / math.sqrt(len(v))

def grad(p, x):
    v, w, b = p
    s = 1 / math.sqrt(len(v))
    on = [1.0 if wj * x + bj > 0 else 0.0 for wj, bj in zip(w, b)]
    return [max(0.0, wj * x + bj) * s for wj, bj in zip(w, b)] + [vj * o * x * s for vj, o in zip(v, on)] + [vj * o * s for vj, o in zip(v, on)]

def ntk(p, x, xp):
    return sum(g * h for g, h in zip(grad(p, x), grad(p, xp)))

p = ([1.0, 2.0], [1.0, -1.0], [0.0, 1.0]); print(round(net(p, 2.0), 4), round(net(p, 0.5), 4), [round(g, 4) for g in grad(p, 0.5)])
print(round(ntk(p, 2.0, 2.0), 4), round(ntk(p, 2.0, 0.5), 4), round(ntk(p, 0.5, 0.5), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.4142 1.0607 [0.3536, 0.3536, 0.3536, 0.7071, 0.7071, 1.4142]\n4.5 1.5 3.375",
          "1.4142 1.0607 [0.3536, 0.3536, 0.7071, 0.3536, 0.7071, 1.4142]\n4.5 1.5 3.375",
          "2.0 1.5 [0.5, 0.5, 0.5, 1.0, 1.0, 2.0]\n9.0 3.0 6.75",
          "1.4142 1.0607 [0.3536, 0.3536, 0.3536, 0.7071, 0.7071, 1.4142]\n4.5 3.0 3.375",
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

def arc(x, xp):
    k11, k12, k22 = x * x + 1, x * xp + 1, xp * xp + 1
    r = math.sqrt(k11 * k22)
    t = math.acos(max(-1.0, min(1.0, k12 / r)))
    return r * (math.sin(t) + (math.pi - t) * math.cos(t)) / (2 * math.pi), (math.pi - t) / (2 * math.pi)

def ntk_limit(x, xp):
    K, S = arc(x, xp)
    return K + (x * xp + 1) * S

def gd_residual(theta, r0, eta, k):
    return r0 * (1 - eta * theta) ** k

print(arc(0, 0), round(ntk_limit(0, 0), 4), round(ntk_limit(1, -1), 4))
print(gd_residual(2.0, 1.0, 0.25, 3), gd_residual(2.0, 1.0, 1.0, 3), gd_residual(0.5, 4.0, 1.0, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0.5, 0.5) 1.0 0.3183\n0.125 -1.0 1.0",
          "(0.5, 0.5) 1.0 0.0\n0.125 -1.0 1.0",
          "(0.5, 0.25) 0.75 0.3183\n0.125 -1.0 1.0",
          "(0.5, 0.5) 1.0 0.3183\n0.125 1.0 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For parameters <C>p = (v, w, b)</C>, write <C>net(p, x)</C>, <C>grad(p, x)</C> returning the v block, then the w block, then the b
          block, and the empirical kernel <C>ntk(p, x, xp)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def net(p, x):
    return 0.0

def grad(p, x):
    v, w, b = p
    return [0.0] * (3 * len(v))

def ntk(p, x, xp):
    return 0.0
`,
        solution: EMPIRICAL,
        tests: [
          { name: "forward", code: `p = ([2.0, 1.0, -1.0, 3.0], [1.0, 2.0, -1.0, 0.5], [0.0, -1.0, 1.0, 0.0])\nassert abs(net(p, 1.0) - 2.25) < 1e-12 and grad(p, 1.0)[4:8] == [1.0, 0.5, 0.0, 1.5]` },
          { name: "kernel", code: `p = ([2.0, 1.0, -1.0, 3.0], [1.0, 2.0, -1.0, 0.5], [0.0, -1.0, 1.0, 0.0])\nassert abs(ntk(p, 1.0, 1.0) - 7.5625) < 1e-12 and abs(ntk(p, 1.0, -2.0) - ntk(p, -2.0, 1.0)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>arc(x, xp)</C> returning the pair (K, P), the NNGP kernel and <M>{"\\mathbb P(u > 0, u' > 0)"}</M> for the viz&apos;s
          network; <C>ntk_limit(x, xp)</C>; and <C>gd_residual(theta, r0, eta, k)</C> for one training point.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def arc(x, xp):
    return 0.0, 0.0

def ntk_limit(x, xp):
    return 0.0

def gd_residual(theta, r0, eta, k):
    return r0
`,
        solution: LIMIT,
        tests: [
          { name: "kernel", code: `K, P = arc(1, -1)\nassert abs(K - 1 / math.pi) < 1e-12 and abs(P - 0.25) < 1e-12 and abs(ntk_limit(2, 2) - 5) < 1e-12` },
          { name: "dynamics", code: `assert abs(gd_residual(3.0, 2.0, 0.5, 4) - 0.125) < 1e-12` },
        ],
      },
    },
    {
      key: "predict",
      rung: "stretch",
      prompt: (
        <p>
          Train the viz&apos;s network, with its initial function subtracted, to convergence in the infinite-width limit on two points:
          y = 1 at x = −1 and y = −1 at x = 1. What does it predict at x = 0.5? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: -0.527, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        A kernel fixed at initialisation cannot adapt to the data. Real networks do learn features, and the next lesson asks
        where the lazy picture breaks: at finite width, at large learning rate, and under other parametrisations.
      </p>
    </>
  ),
};
