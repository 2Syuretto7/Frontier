import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PlasticityViz } from "@/components/viz/PlasticityViz";
import type { LessonContent } from "@/lib/types";

const MEASURE = `import numpy as np

def dead_fraction(X, W, b):
    Z = np.asarray(X, float) @ W + b
    return float(np.mean((Z <= 0).all(axis=0)))

def effective_rank(F):
    s = np.linalg.svd(np.asarray(F, float), compute_uv=False)
    if s.sum() == 0:
        return 0.0
    p = s[s > 0] / s.sum()
    return float(np.exp(-(p * np.log(p)).sum()))

def relu_grads(X, y, W, b, v):
    Z = X @ W + b
    F = np.maximum(Z, 0.0)
    r = (F @ v - y) / len(y)
    gZ = np.outer(r, v) * (Z > 0)
    return X.T @ gZ, gZ.sum(axis=0), F.T @ r`;

const REMEDY = `import numpy as np

def shrink_perturb(W, lam, sigma, rng):
    W = np.asarray(W, float)
    return lam * W + sigma * rng.standard_normal(W.shape)

def l2_init_step(W, W0, g, lr, c):
    return W - lr * (g + c * (W - W0))

def reset_dead(X, W, b, v, W_new):
    dead = (X @ W + b <= 0).all(axis=0)
    W, b, v = W.copy(), b.copy(), v.copy()
    W[:, dead] = W_new[:, dead]
    b[dead] = 0.0
    v[dead] = 0.0
    return W, b, v`;

export const lesson: LessonContent = {
  id: "m14.5.4",
  minutes: 45,
  links: {
    requires: ["m14.5.3", "m14.2.4"],
    revisits: ["l3.4.3"],
    foreshadows: ["m14.6.4"],
  },

  puzzle: (
    <>
      <p>
        Train a network on one task, then another, then another, each time starting from where the last one left off.
        You might expect the network to get better at learning, or at worst to stay the same: it has seen more data, and a
        freshly initialised network is always available as a fallback. In practice, after enough tasks, the network
        learns each new one worse than a fresh network would, and in reinforcement learning, where the targets keep
        moving, this is a routine failure. What has the network lost, and how can training keep it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A network&apos;s ability to fit new targets depends on its features being varied and responsive. Each task leaves
        traces that do not go away when the task ends: some ReLU units are pushed to where they are off on every input,
        the weights grow, and the surviving features line up with each other. A dead unit receives no gradient, so no
        later task can bring it back; collapsed features span fewer directions, so fewer targets are reachable. The
        remedies all restore something of the initial state: shrink the weights and add noise, pull them towards their
        initial values, or replace dead units with fresh ones.
      </p>
      <PlasticityViz />
    </>
  ),

  theory: (
    <>
      <Definition title="plasticity and its measures">
        <p>
          <em>Plasticity</em> is a network&apos;s ability to reduce the loss on a new task from its current weights.{" "}
          <em>Loss of plasticity</em> is a decline in that ability over a sequence of tasks, measured against a freshly
          initialised network. Two internal measures track it. A hidden unit is <em>dead</em> on inputs{" "}
          <M>{"x_1, \\dots, x_n"}</M> when its pre-activation <M>{"w_j^\\top x_i + b_j"}</M> is at most zero for every i. The{" "}
          <em>effective rank</em> of a feature matrix F with singular values <M>{"\\sigma_k"}</M> is{" "}
          <M>{"\\exp(-\\sum_k p_k\\log p_k)"}</M>, where <M>{"p_k = \\sigma_k/\\sum_l\\sigma_l"}</M>, with terms where{" "}
          <M>{"p_k = 0"}</M> omitted.
        </p>
        <Code>{MEASURE}</Code>
      </Definition>

      <Theorem title="effective rank lies between 1 and the rank">
        <p>
          If F ≠ 0 has rank r, then <M>{"1 \\le \\mathrm{erank}(F) \\le r"}</M>, with equality on the right if and only if
          the r nonzero singular values are equal, and on the left if and only if r = 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          The <M>{"p_k"}</M> form a probability distribution on the r nonzero singular values, so its entropy H lies
          between 0 and log r. H = 0 exactly when one <M>{"p_k"}</M> is 1, that is when r = 1, and H = log r exactly when
          the distribution is uniform. Exponentiating gives the claim. Effective rank therefore counts directions weighted
          by how much they matter, unlike the rank, which a tiny singular value can raise by one.
        </p>
      </Proof>

      <Theorem title="weight decay cannot revive a dead unit; pulling towards initialisation can">
        <p>
          Let unit j be dead on the training inputs, so its loss gradients vanish, as in the earlier lesson on dead units.
          Under gradient descent with weight decay, <M>{"(w_j, b_j) \\leftarrow (1 - \\eta\\lambda)(w_j, b_j)"}</M> with{" "}
          <M>{"0 < \\eta\\lambda < 1"}</M>, the unit stays dead forever. Under the penalty{" "}
          <M>{"\\tfrac c2\\|\\theta - \\theta_0\\|^2"}</M> with <M>{"0 < \\eta c < 1"}</M>, its parameters converge to their
          initial values, so if the unit was active on some input at initialisation, it becomes active again after
          finitely many steps.
        </p>
      </Theorem>
      <Proof>
        <p>
          With weight decay every pre-activation of unit j is multiplied by the positive number{" "}
          <M>{"1 - \\eta\\lambda"}</M> each step, so a value at most zero stays at most zero. With the penalty the update
          for unit j is <M>{"\\theta_j \\leftarrow \\theta_j - \\eta c(\\theta_j - \\theta_{j,0})"}</M>, so{" "}
          <M>{"\\theta_j - \\theta_{j,0}"}</M> shrinks by the factor <M>{"1 - \\eta c"}</M> each step and tends to zero.
          Pre-activations are continuous in <M>{"\\theta_j"}</M>, so one that was strictly positive at initialisation is
          strictly positive again once <M>{"\\theta_j"}</M> is close enough to <M>{"\\theta_{j,0}"}</M>. More generally, at
          any stationary point of <M>{"L(\\theta) + \\tfrac c2\\|\\theta - \\theta_0\\|^2"}</M> we have{" "}
          <M>{"\\|\\theta - \\theta_0\\| = \\|\\nabla L(\\theta)\\|/c"}</M>, so the weights cannot drift further from
          their starting point than the gradients justify.
        </p>
      </Proof>

      <Definition title="three remedies">
        <p>
          <em>Shrink and perturb</em>: between tasks, replace W by <M>{"\\lambda W + \\sigma\\xi"}</M> with ξ standard
          normal. <em>L2 towards initialisation</em> (also called regenerative regularisation): add{" "}
          <M>{"c(\\theta - \\theta_0)"}</M> to every gradient. <em>Resetting</em> (a simplified form of continual
          backpropagation): give each dead unit fresh incoming weights, zero bias and zero outgoing weight, which leaves
          the network&apos;s outputs unchanged while making the unit trainable again.
        </p>
        <Code>{REMEDY}</Code>
      </Definition>

      <Remark title="other causes, and normalisation">
        <p>
          Dead units are the easiest cause to see, not the only one. Weights also grow from task to task under plain
          training, and in layers followed by normalisation a larger
          weight norm means a smaller effective learning rate, a link made precise later in this course. Adam adds its own
          version: after a long run its second-moment estimates are small, so a sudden new gradient produces a huge
          step. Methods that work in practice usually combine a bound on weight growth with a way to refresh units.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "erank",
      rung: "check",
      prompt: <p>A feature matrix has singular values 2, 1 and 1. What is its effective rank? Give two decimals.</p>,
      answer: { kind: "numeric", value: 2.83, tolerance: 0.006 },
    },
    {
      key: "bound",
      rung: "check",
      prompt: (
        <p>
          With the penalty <M>{"\\tfrac c2\\|\\theta - \\theta_0\\|^2"}</M> and c = 0.01, every loss gradient has norm at
          most 4. How far from <M>{"\\theta_0"}</M> can a stationary point be, at most?
        </p>
      ),
      answer: { kind: "numeric", value: 400, tolerance: 0.001 },
    },
    {
      key: "revive",
      rung: "apply",
      prompt: <p>In a long continual-learning run, 70% of the hidden units are dead. Which change can bring them back?</p>,
      answer: {
        kind: "choice",
        options: [
          "Adding a penalty that pulls the weights towards their initial values",
          "Raising the learning rate, so that the dead units move faster",
          "Adding ordinary weight decay towards zero",
          "Training for longer on the current task",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def dead_fraction(X, W, b):
    Z = np.asarray(X, float) @ W + b
    return float(np.mean((Z <= 0).all(axis=0)))

def effective_rank(F):
    s = np.linalg.svd(np.asarray(F, float), compute_uv=False)
    if s.sum() == 0:
        return 0.0
    p = s[s > 0] / s.sum()
    return float(np.exp(-(p * np.log(p)).sum()))

def relu_grads(X, y, W, b, v):
    Z = X @ W + b
    F = np.maximum(Z, 0.0)
    r = (F @ v - y) / len(y)
    gZ = np.outer(r, v) * (Z > 0)
    return X.T @ gZ, gZ.sum(axis=0), F.T @ r

X = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])
W = np.array([[1.0, -1.0, 0.5], [1.0, -1.0, -2.0]]); b = np.array([0.0, -0.5, 0.0])
print(round(dead_fraction(X, W, b), 3), round(effective_rank(np.maximum(X @ W + b, 0)), 3))
gW, gb, gv = relu_grads(X, np.zeros(3), W, b, np.ones(3)); print(gW[:, 1].tolist(), gb.round(3).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.333 1.542\n[0.0, 0.0] [1.5, 0.0, 0.5]",
          "0.333 2.0\n[0.0, 0.0] [1.5, 0.0, 0.5]",
          "0.667 1.542\n[0.0, 0.0] [1.5, 0.0, 0.5]",
          "0.333 1.542\n[0.5, 0.5] [1.5, 0.833, 0.5]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def shrink_perturb(W, lam, sigma, rng):
    W = np.asarray(W, float)
    return lam * W + sigma * rng.standard_normal(W.shape)

def l2_init_step(W, W0, g, lr, c):
    return W - lr * (g + c * (W - W0))

def reset_dead(X, W, b, v, W_new):
    dead = (X @ W + b <= 0).all(axis=0)
    W, b, v = W.copy(), b.copy(), v.copy()
    W[:, dead] = W_new[:, dead]
    b[dead] = 0.0
    v[dead] = 0.0
    return W, b, v

W = np.ones((2, 2)); print(l2_init_step(W, np.zeros((2, 2)), np.ones((2, 2)), 0.1, 0.5)[0].tolist(), shrink_perturb(W, 0.5, 0.0, np.random.default_rng(0)).sum())
X = np.array([[1.0, 1.0]]); W2 = np.array([[1.0, -1.0], [0.0, -1.0]])
W3, b3, v3 = reset_dead(X, W2, np.zeros(2), np.array([2.0, 3.0]), np.full((2, 2), 7.0)); print(W3.tolist(), v3.tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.85, 0.85] 2.0\n[[1.0, 7.0], [0.0, 7.0]] [2.0, 0.0]",
          "[0.9, 0.9] 2.0\n[[1.0, 7.0], [0.0, 7.0]] [2.0, 0.0]",
          "[0.85, 0.85] 4.0\n[[1.0, 7.0], [0.0, 7.0]] [2.0, 0.0]",
          "[0.85, 0.85] 2.0\n[[1.0, 7.0], [0.0, 7.0]] [2.0, 3.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dead_fraction(X, W, b)</C>, the fraction of hidden units dead on the rows of X;{" "}
          <C>effective_rank(F)</C>, returning 0.0 for a zero matrix; and <C>relu_grads(X, y, W, b, v)</C>, the gradients
          (gW, gb, gv) of the mean of ½(v·ReLU(xW + b) − y)² over the rows of X.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def dead_fraction(X, W, b):
    return 0.0

def effective_rank(F):
    return float(np.linalg.matrix_rank(F))

def relu_grads(X, y, W, b, v):
    return np.zeros_like(W), np.zeros_like(b), np.zeros_like(v)
`,
        solution: MEASURE,
        tests: [
          { name: "measures", code: `X = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]]); W = np.array([[1.0, -1.0, 0.5], [1.0, -1.0, -2.0]]); b = np.array([0.0, -0.5, 0.0])
assert abs(dead_fraction(X, W, b) - 1 / 3) < 1e-12 and dead_fraction(X, W, b + 10) == 0.0
assert abs(effective_rank(np.eye(3)) - 3) < 1e-9 and abs(effective_rank(np.outer([1, 2], [3, 4])) - 1) < 1e-6 and abs(effective_rank(np.diag([2.0, 1.0, 1.0])) - 2 ** 1.5) < 1e-9 and effective_rank(np.zeros((2, 2))) == 0.0` },
          { name: "grads", code: `rng = np.random.default_rng(1); X = rng.standard_normal((5, 3)); y = rng.standard_normal(5); W = rng.standard_normal((3, 4)); b = rng.standard_normal(4); v = rng.standard_normal(4)
L = lambda W, b, v: 0.5 * np.mean((np.maximum(X @ W + b, 0) @ v - y) ** 2)
gW, gb, gv = relu_grads(X, y, W, b, v); e = 1e-6
E = np.zeros_like(W); E[1, 2] = e; assert abs((L(W + E, b, v) - L(W - E, b, v)) / (2 * e) - gW[1, 2]) < 1e-6
E = np.zeros(4); E[0] = e; assert abs((L(W, b + E, v) - L(W, b - E, v)) / (2 * e) - gb[0]) < 1e-6 and abs((L(W, b, v + E) - L(W, b, v - E)) / (2 * e) - gv[0]) < 1e-6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>shrink_perturb(W, lam, sigma, rng)</C>, drawing the noise with <C>rng.standard_normal(W.shape)</C>;{" "}
          <C>l2_init_step(W, W0, g, lr, c)</C>, one gradient step with the pull towards W0 added; and{" "}
          <C>reset_dead(X, W, b, v, W_new)</C>, returning copies of (W, b, v) in which every unit dead on the rows of X
          takes its column from W_new, a zero bias and a zero outgoing weight.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def shrink_perturb(W, lam, sigma, rng):
    return lam * np.asarray(W, float)

def l2_init_step(W, W0, g, lr, c):
    return W - lr * g

def reset_dead(X, W, b, v, W_new):
    return W, b, v
`,
        solution: REMEDY,
        tests: [
          { name: "steps", code: `a = shrink_perturb(np.ones((2, 3)), 0.8, 0.1, np.random.default_rng(3)); n = np.random.default_rng(3).standard_normal((2, 3)); assert np.allclose(a, 0.8 + 0.1 * n)
assert np.allclose(l2_init_step(np.array([2.0, -1.0]), np.array([1.0, 1.0]), np.array([0.5, 0.0]), 0.1, 0.2), [1.93, -0.96])` },
          { name: "reset", code: `rng = np.random.default_rng(2); X = rng.standard_normal((6, 3)); W = rng.standard_normal((3, 5)); b = np.array([0.0, -50.0, 0.0, -50.0, 0.0]); v = rng.standard_normal(5)
W2, b2, v2 = reset_dead(X, W, b, v, rng.standard_normal((3, 5))); f = lambda W, b, v: np.maximum(X @ W + b, 0) @ v
assert np.allclose(f(W2, b2, v2), f(W, b, v)) and np.allclose(W2[:, [0, 2, 4]], W[:, [0, 2, 4]]) and not np.allclose(W2[:, 1], W[:, 1])
assert b2[1] == 0 and b2[3] == 0 and v2[1] == 0 and v2[3] == 0 and v[1] != 0 and np.allclose(b, [0, -50, 0, -50, 0])` },
        ],
      },
    },
    {
      key: "spnorm",
      rung: "stretch",
      prompt: (
        <p>
          Ignore training and apply only <M>{"W \\leftarrow 0.8W + 0.1\\xi"}</M> repeatedly to a matrix with 100 entries,
          each step drawing fresh standard normal noise ξ. What does the expected squared norm{" "}
          <M>{"\\mathbb E\\|W\\|^2"}</M> tend to? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.78, tolerance: 0.006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Loss of plasticity is a slow failure. The next part turns to fast ones: single steps that send the loss up by
        orders of magnitude, and gradient clipping, the oldest guard against them.
      </p>
    </>
  ),
};
