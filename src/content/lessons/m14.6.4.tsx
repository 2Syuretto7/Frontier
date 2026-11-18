import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ScaleInvariantViz } from "@/components/viz/ScaleInvariantViz";
import type { LessonContent } from "@/lib/types";

const INVARIANT = `import numpy as np

def rq_loss(M, w):
    w = np.asarray(w, float)
    return float(-(w @ M @ w) / (w @ w))

def rq_grad(M, w):
    w = np.asarray(w, float)
    s = w @ w
    return -2 * (M @ w - (w @ M @ w) / s * w) / s

def sphere_sgd(w, lr, wd, G, steps, seed):
    rng = np.random.default_rng(seed)
    w, norms = np.asarray(w, float).copy(), []
    for _ in range(steps):
        z = rng.standard_normal(len(w))
        z -= (z @ w) / (w @ w) * w
        g = G / np.linalg.norm(w) * z / np.linalg.norm(z)
        w = (1 - lr * wd) * w - lr * g
        norms.append(float(np.linalg.norm(w)))
    return norms`;

const EQUILIBRIUM = `import numpy as np

def equilibrium_norm(lr, wd, G):
    return (lr * G * G / (wd * (2 - lr * wd))) ** 0.25

def equilibrium_angle(lr, wd):
    return float(np.arccos(1 - lr * wd))

def angle_between(a, b):
    a, b = np.asarray(a, float), np.asarray(b, float)
    c = a @ b / (np.linalg.norm(a) * np.linalg.norm(b))
    return float(np.arccos(np.clip(c, -1.0, 1.0)))`;

export const lesson: LessonContent = {
  id: "m14.6.4",
  minutes: 45,
  links: {
    requires: ["m14.6.3", "m14.2.4"],
    revisits: ["l3.5.2"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        In a network where every linear layer is followed by batch or layer normalisation, multiplying a layer&apos;s
        weights by 10 changes nothing the network computes. So weight decay, which only shrinks weights, cannot be acting
        as a regulariser on those layers in the usual sense: a smaller copy of the same function is no simpler. Yet
        removing weight decay from such networks still hurts, and tuning it interacts strongly with the learning rate.
        What is weight decay doing to weights whose size does not matter?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If the loss ignores the length of w, only its direction is being learned, and what matters is how far each step
        turns that direction. A gradient step on such a loss is always perpendicular to w, so by Pythagoras it makes w
        longer. A longer w means the same step turns it through a smaller angle, and the gradients themselves get smaller
        as w grows. So without weight decay, normalised layers quietly lower their own learning rate. Weight decay pulls
        the other way. The two balance at a norm where the angle turned per step depends only on the product ηλ. Weight
        decay is a learning-rate controller.
      </p>
      <ScaleInvariantViz />
    </>
  ),

  theory: (
    <>
      <Definition title="scale invariance">
        <p>
          A loss L is <em>scale invariant</em> in w if <M>{"L(\\alpha w) = L(w)"}</M> for every α &gt; 0. Weights
          followed by batch, layer or RMS normalisation have this property, ignoring the small ε inside the normaliser.
          A simple example is the negative Rayleigh quotient <M>{"L(w) = -w^\\top Mw/w^\\top w"}</M>.
        </p>
        <Code>{INVARIANT}</Code>
      </Definition>

      <Theorem title="gradients of scale-invariant losses">
        <p>
          If L is scale invariant and differentiable at w ≠ 0, then <M>{"w^\\top\\nabla L(w) = 0"}</M> and{" "}
          <M>{"\\nabla L(\\alpha w) = \\nabla L(w)/\\alpha"}</M> for α &gt; 0.
        </p>
      </Theorem>
      <Proof>
        <p>
          Differentiate <M>{"L(\\alpha w) = L(w)"}</M> with respect to α at α = 1: the chain rule gives{" "}
          <M>{"\\nabla L(w)^\\top w = 0"}</M>. Differentiate it with respect to w instead:{" "}
          <M>{"\\alpha\\nabla L(\\alpha w) = \\nabla L(w)"}</M>.
        </p>
      </Proof>

      <Theorem title="without decay the norm only grows">
        <p>
          Gradient descent <M>{"w_{t+1} = w_t - \\eta g_t"}</M> on a scale-invariant loss satisfies{" "}
          <M>{"\\|w_{t+1}\\|^2 = \\|w_t\\|^2 + \\eta^2\\|g_t\\|^2"}</M>. If <M>{"\\|g_t\\| = G/\\|w_t\\|"}</M>, the angle
          turned in one step is <M>{"\\arctan(\\eta G/\\|w_t\\|^2)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The gradient is orthogonal to <M>{"w_t"}</M> by the previous theorem, so Pythagoras gives the norm. The new
          vector has component <M>{"\\|w_t\\|"}</M> along <M>{"w_t"}</M> and <M>{"\\eta\\|g_t\\| = \\eta G/\\|w_t\\|"}</M>{" "}
          perpendicular to it, so the tangent of the angle between them is <M>{"\\eta G/\\|w_t\\|^2"}</M>. The effective
          learning rate on the sphere is therefore <M>{"\\eta/\\|w\\|^2"}</M>, and it falls as the norm grows: squaring
          the norm recursion gives <M>{"\\|w_{t+1}\\|^4 \\approx \\|w_t\\|^4 + 2\\eta^2G^2"}</M>, so{" "}
          <M>{"\\|w_t\\|^2"}</M> grows like <M>{"\\sqrt t"}</M> and the effective rate decays like{" "}
          <M>{"1/\\sqrt t"}</M>.
        </p>
      </Proof>

      <Theorem title="rotational equilibrium">
        <p>
          Run <M>{"w_{t+1} = (1-\\eta\\lambda)w_t - \\eta g_t"}</M> with <M>{"0 < \\eta\\lambda \\le 1/2"}</M> on a
          scale-invariant loss whose gradients satisfy <M>{"\\|g_t\\| = G/\\|w_t\\|"}</M>. Then <M>{"\\|w_t\\|"}</M>{" "}
          converges to <M>{"r^* = (\\eta G^2/(\\lambda(2-\\eta\\lambda)))^{1/4}"}</M>, and at that norm every step turns w
          through exactly <M>{"\\arccos(1-\\eta\\lambda) \\approx \\sqrt{2\\eta\\lambda}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          With <M>{"x_t = \\|w_t\\|^2"}</M> and <M>{"a = (1-\\eta\\lambda)^2"}</M>, orthogonality gives{" "}
          <M>{"x_{t+1} = ax_t + \\eta^2G^2/x_t =: \\phi(x_t)"}</M>. The fixed point solves{" "}
          <M>{"(1-a)x^2 = \\eta^2G^2"}</M>, and <M>{"1 - a = \\eta\\lambda(2-\\eta\\lambda)"}</M> gives{" "}
          <M>{"x^* = (r^*)^2"}</M>. By the AM–GM inequality <M>{"\\phi(x) \\ge 2\\sqrt a\\,\\eta G"}</M>, so after one step every iterate lies in{" "}
          <M>{"[2\\sqrt a\\,\\eta G, \\infty)"}</M>, which <M>{"\\phi"}</M> maps into itself. There{" "}
          <M>{"\\phi'(x) = a - \\eta^2G^2/x^2"}</M> is below a &lt; 1 and at least <M>{"a - 1/(4a)"}</M>, which is at
          least −3/4 because <M>{"\\eta\\lambda \\le 1/2"}</M> makes <M>{"a \\ge 1/4"}</M>. So <M>{"\\phi"}</M> is a
          contraction on that interval, and by the mean value theorem the iterates converge to <M>{"x^*"}</M>.{" "}
          At the fixed point the new vector has the same norm as
          the old, and its component along <M>{"w_t"}</M> is <M>{"(1-\\eta\\lambda)\\|w_t\\|"}</M>, so the cosine of the
          angle between them is <M>{"1-\\eta\\lambda"}</M>.
        </p>
        <Code>{EQUILIBRIUM}</Code>
      </Proof>

      <Remark title="what this means for tuning">
        <p>
          At equilibrium the rate at which a normalised layer&apos;s direction moves depends on ηλ alone, not on η, λ or the
          gradient scale separately; doubling η and halving λ leaves it unchanged once the norm has re-equilibrated, which
          takes on the order of <M>{"1/(\\eta\\lambda)"}</M> steps. This is why the two hyperparameters are tuned
          together, and why in normalised networks a learning-rate schedule acts partly through the weight norm: cutting η
          reduces the angular update at once, then the norm slowly shrinks and gives some of it back. For Adam the
          gradient scale is normalised away and the equilibrium norm follows the earlier AdamW lesson instead, but the
          conclusion is the same: η and λ act as a pair. Layers that are not scale invariant, such as embeddings, gains
          and biases, see weight decay as an ordinary pull towards zero, which is why many recipes exclude them from it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "angle",
      rung: "check",
      prompt: <p>A normalised layer is at rotational equilibrium with ηλ = 0.02. Through what angle, in radians, does each step turn its weights? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.2, tolerance: 0.0006 },
    },
    {
      key: "scale",
      rung: "check",
      prompt: <p>A scale-invariant loss has gradient norm 6 at w. What is its gradient norm at 3w?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "pair",
      rung: "apply",
      prompt: <p>A layer followed by layer normalisation is trained with SGD at equilibrium. Which change leaves its angular update per step unchanged once the norm re-equilibrates?</p>,
      answer: {
        kind: "choice",
        options: [
          "Doubling η and halving λ",
          "Doubling η and keeping λ",
          "Doubling both η and λ",
          "Removing weight decay and doubling η",
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

def rq_loss(M, w):
    w = np.asarray(w, float)
    return float(-(w @ M @ w) / (w @ w))

def rq_grad(M, w):
    w = np.asarray(w, float)
    s = w @ w
    return -2 * (M @ w - (w @ M @ w) / s * w) / s

def sphere_sgd(w, lr, wd, G, steps, seed):
    rng = np.random.default_rng(seed)
    w, norms = np.asarray(w, float).copy(), []
    for _ in range(steps):
        z = rng.standard_normal(len(w))
        z -= (z @ w) / (w @ w) * w
        g = G / np.linalg.norm(w) * z / np.linalg.norm(z)
        w = (1 - lr * wd) * w - lr * g
        norms.append(float(np.linalg.norm(w)))
    return norms

M = np.diag([3.0, 1.0]); w = np.array([1.0, 1.0])
print(rq_loss(M, w), rq_loss(M, 5 * w), rq_grad(M, w).tolist(), np.round(5 * rq_grad(M, 5 * w), 6).tolist())
print(float(w @ rq_grad(M, w)), [round(n, 3) for n in sphere_sgd(np.array([1.0, 0.0, 0.0]), 0.1, 0.0, 1.0, 2, 0)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-2.0 -2.0 [-1.0, 1.0] [-1.0, 1.0]\n0.0 [1.005, 1.01]",
          "-2.0 -2.0 [-1.0, 1.0] [-5.0, 5.0]\n0.0 [1.005, 1.01]",
          "-2.0 -50.0 [-1.0, 1.0] [-1.0, 1.0]\n0.0 [1.005, 1.01]",
          "-2.0 -2.0 [-1.0, 1.0] [-1.0, 1.0]\n0.0 [0.995, 0.99]",
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

def equilibrium_norm(lr, wd, G):
    return (lr * G * G / (wd * (2 - lr * wd))) ** 0.25

def equilibrium_angle(lr, wd):
    return float(np.arccos(1 - lr * wd))

def angle_between(a, b):
    a, b = np.asarray(a, float), np.asarray(b, float)
    c = a @ b / (np.linalg.norm(a) * np.linalg.norm(b))
    return float(np.arccos(np.clip(c, -1.0, 1.0)))

print(round(equilibrium_norm(0.1, 0.1, 1.0), 4), round(equilibrium_angle(0.1, 0.1), 4), round(float(np.sqrt(2 * 0.1 * 0.1)), 4))
print(round(angle_between([1.0, 0.0], [1.0, 1.0]), 4), round(angle_between([2.0, 0.0], [-3.0, 0.0]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.842 0.1415 0.1414\n0.7854 3.1416",
          "0.7089 0.1415 0.1414\n0.7854 3.1416",
          "0.842 0.01 0.1414\n0.7854 3.1416",
          "0.842 0.1415 0.1414\n0.7854 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rq_loss(M, w)</C> and <C>rq_grad(M, w)</C> for <M>{"L(w) = -w^\\top Mw/w^\\top w"}</M> with M symmetric,
          and <C>sphere_sgd(w, lr, wd, G, steps, seed)</C>: each step draws <C>z = rng.standard_normal(len(w))</C> from{" "}
          <C>np.random.default_rng(seed)</C>, removes its component along w, rescales it to norm G/‖w‖ to get g, sets{" "}
          <C>w = (1 − lr·wd)w − lr·g</C>, and records ‖w‖.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rq_loss(M, w):
    return float(-np.asarray(w) @ M @ np.asarray(w))

def rq_grad(M, w):
    return -2 * M @ np.asarray(w, float)

def sphere_sgd(w, lr, wd, G, steps, seed):
    return [float(np.linalg.norm(w))] * steps
`,
        solution: INVARIANT,
        tests: [
          { name: "rayleigh", code: `rng = np.random.default_rng(0); A = rng.standard_normal((4, 4)); M = A + A.T; w = rng.standard_normal(4)
assert abs(rq_loss(M, 3 * w) - rq_loss(M, w)) < 1e-12 and abs(w @ rq_grad(M, w)) < 1e-12 and np.allclose(rq_grad(M, 2 * w), rq_grad(M, w) / 2)
e = 1e-6; num = [(rq_loss(M, w + e * np.eye(4)[i]) - rq_loss(M, w - e * np.eye(4)[i])) / (2 * e) for i in range(4)]; assert np.allclose(rq_grad(M, w), num, atol=1e-6)` },
          { name: "sgd", code: `assert np.allclose(sphere_sgd(np.array([1.0, 0.0, 0.0]), 0.1, 0.0, 1.0, 2, 0), [np.sqrt(1.01), np.sqrt(1.01 + 0.01 / 1.01)])
n = sphere_sgd(np.ones(50) / np.sqrt(50), 0.1, 0.1, 1.0, 3000, 0); assert abs(n[-1] - (0.1 / (0.1 * 1.99)) ** 0.25) < 1e-6
n = sphere_sgd(np.ones(50) / np.sqrt(50), 0.1, 0.0, 1.0, 3000, 1); assert all(b > a for a, b in zip(n, n[1:])) and abs(n[-1] - 61 ** 0.25) < 0.01` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>equilibrium_norm(lr, wd, G)</C>, the norm <M>{"r^*"}</M> from the theorem;{" "}
          <C>equilibrium_angle(lr, wd)</C>, the angle per step there; and <C>angle_between(a, b)</C>, the angle between two
          nonzero vectors, safe against rounding just outside [−1, 1].
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def equilibrium_norm(lr, wd, G):
    return 1.0

def equilibrium_angle(lr, wd):
    return float(np.sqrt(2 * lr * wd))

def angle_between(a, b):
    return float(np.arccos(np.dot(a, b)))
`,
        solution: EQUILIBRIUM,
        tests: [
          { name: "equilibrium", code: `assert abs(equilibrium_norm(0.1, 0.1, 1.0) - (0.1 / 0.199) ** 0.25) < 1e-12 and abs(equilibrium_norm(0.2, 0.01, 3.0) - (0.2 * 9 / (0.01 * 1.998)) ** 0.25) < 1e-12
assert abs(equilibrium_angle(0.1, 0.1) - np.arccos(0.99)) < 1e-12 and abs(equilibrium_angle(0.01, 0.5) - np.arccos(0.995)) < 1e-12` },
          { name: "angles", code: `assert abs(angle_between([1.0, 0.0], [1.0, 1.0]) - np.pi / 4) < 1e-12 and abs(angle_between([2.0, 0.0], [-3.0, 0.0]) - np.pi) < 1e-12
v = np.array([0.1, 0.2, 0.3]); assert angle_between(v, 7 * v) == 0.0 or angle_between(v, 7 * v) < 1e-7` },
        ],
      },
    },
    {
      key: "grow",
      rung: "stretch",
      prompt: (
        <p>
          SGD without weight decay runs on a scale-invariant loss with <M>{"\\|g\\| = 1/\\|w\\|"}</M>, η = 0.1 and{" "}
          <M>{"\\|w_0\\| = 1"}</M>. Using <M>{"\\|w_{t+1}\\|^4 \\approx \\|w_t\\|^4 + 2\\eta^2"}</M>, estimate{" "}
          <M>{"\\|w\\|"}</M> after 3000 steps. Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.79, tolerance: 0.011 },
    },
  ],

  glimpse: (
    <>
      <p>
        This completes the course. Its thread has been that optimisers are judged in practice by how they behave on
        landscapes no convergence theorem fully describes: noisy, badly conditioned, scale invariant and sometimes
        unstable, and that each practical trick, from warmup to z-loss, answers one identifiable failure.
      </p>
    </>
  ),
};
