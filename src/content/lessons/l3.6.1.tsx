import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MomentumRateViz } from "@/components/viz/MomentumRateViz";
import type { LessonContent } from "@/lib/types";

const QUAD = `import numpy as np

def gd_quadratic(lams, x0, lr, steps):
    x = np.array(x0, dtype=float)
    for _ in range(steps):
        x = x - lr * lams * x
    return x

def momentum_quadratic(lams, x0, lr, beta, steps):
    x = np.array(x0, dtype=float)
    v = np.zeros_like(x)
    for _ in range(steps):
        v = beta * v + lams * x
        x = x - lr * v
    return x`;

const RATE = `def conv_factor(lam, lr, beta):
    roots = np.roots([1.0, -(1 + beta - lr * lam), beta])
    return float(np.max(np.abs(roots)))

def best_lr_gd(lmin, lmax):
    return 2 / (lmin + lmax)`;

export const lesson: LessonContent = {
  id: "l3.6.1",
  minutes: 50,
  links: {
    requires: ["l3.5.3", "l1.2.4"],
    revisits: ["e5.3.2"],
    foreshadows: ["l3.6.2", "m10.6.1", "m14.2.3"],
  },

  puzzle: (
    <>
      <p>
        A loss surface is a hundred times steeper in one direction than in another. Gradient descent with learning rate 0.019
        converges; with 0.021 it explodes. At 0.019 it still needs hundreds of steps, because the shallow direction barely
        moves. Raising the learning rate would fix the shallow direction but wreck the steep one. Adding a running average of
        past gradients, momentum, escapes the dilemma. How much faster can it be, and why?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Near a minimum, a loss looks like a quadratic, and gradient descent acts on each curvature direction separately. The
        steepest direction sets the largest stable step; the flattest direction then crawls. Momentum accumulates gradients
        that keep pointing the same way, so it speeds up along the flat direction, while gradients that alternate in sign
        cancel, damping the zigzag along the steep one.
      </p>
      <MomentumRateViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="gradient descent on a quadratic">
        <p>
          For <M>{"L(x) = \\tfrac12 \\sum_i \\lambda_i x_i^2"}</M> with <M>{"0 < \\lambda_{\\min} \\le \\lambda_i \\le \\lambda_{\\max}"}</M>,
          the update <M>{"x \\leftarrow x - \\eta \\nabla L"}</M> multiplies each coordinate by <M>{"1 - \\eta\\lambda_i"}</M>.
          It converges if and only if <M>{"\\eta < 2/\\lambda_{\\max}"}</M>, and the best worst-case factor, reached at{" "}
          <M>{"\\eta = 2/(\\lambda_{\\min} + \\lambda_{\\max})"}</M>, is <M>{"(\\kappa - 1)/(\\kappa + 1)"}</M> with{" "}
          <M>{"\\kappa = \\lambda_{\\max}/\\lambda_{\\min}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\partial L/\\partial x_i = \\lambda_i x_i"}</M>, so <M>{"x_i \\leftarrow (1 - \\eta\\lambda_i) x_i"}</M> and after t
          steps <M>{"x_i = (1 - \\eta\\lambda_i)^t x_i^{(0)}"}</M>. This tends to 0 iff <M>{"|1 - \\eta\\lambda_i| < 1"}</M>, i.e.{" "}
          <M>{"0 < \\eta\\lambda_i < 2"}</M>, for every i. The worst factor is{" "}
          <M>{"\\max(|1 - \\eta\\lambda_{\\min}|, |1 - \\eta\\lambda_{\\max}|)"}</M>, which is smallest when the two are equal:{" "}
          <M>{"1 - \\eta\\lambda_{\\min} = \\eta\\lambda_{\\max} - 1"}</M>. Substituting this η gives{" "}
          <M>{"(\\lambda_{\\max} - \\lambda_{\\min})/(\\lambda_{\\max} + \\lambda_{\\min})"}</M>.
        </p>
      </Proof>

      <Definition title="momentum">
        <MD>{"v \\leftarrow \\beta v + \\nabla L(x), \\qquad x \\leftarrow x - \\eta v."}</MD>
        <p>
          If the gradient were constant, v would settle at <M>{"g/(1 - \\beta)"}</M>, so along a consistent direction the
          effective learning rate is <M>{"\\eta/(1 - \\beta)"}</M>: ten times larger for β = 0.9.
        </p>
        <Code>{QUAD}</Code>
      </Definition>

      <Theorem title="momentum's convergence factor">
        <p>
          On one coordinate with curvature λ, momentum is the linear recurrence{" "}
          <M>{"x_{t+1} = (1 + \\beta - \\eta\\lambda)x_t - \\beta x_{t-1}"}</M>, whose factor per step is the largest
          modulus of a root of <M>{"r^2 - (1 + \\beta - \\eta\\lambda)r + \\beta"}</M>. With{" "}
          <M>{"\\eta = 4/(\\sqrt{\\lambda_{\\max}} + \\sqrt{\\lambda_{\\min}})^2"}</M> and{" "}
          <M>{"\\beta = \\big((\\sqrt\\kappa - 1)/(\\sqrt\\kappa + 1)\\big)^2"}</M>, every direction converges with factor{" "}
          <M>{"(\\sqrt\\kappa - 1)/(\\sqrt\\kappa + 1)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          From <M>{"x_{t+1} = x_t - \\eta v_{t+1}"}</M> and <M>{"v_{t+1} = \\beta v_t + \\lambda x_t"}</M>, with{" "}
          <M>{"\\eta v_t = x_{t-1} - x_t"}</M>, we get the recurrence. When the discriminant{" "}
          <M>{"(1 + \\beta - \\eta\\lambda)^2 - 4\\beta"}</M> is negative the roots are complex conjugates with product β, so
          both have modulus <M>{"\\sqrt\\beta"}</M>. The given η and β make the discriminant ≤ 0 for every λ in{" "}
          <M>{"[\\lambda_{\\min}, \\lambda_{\\max}]"}</M> (it is exactly 0 at the two ends), so every factor is{" "}
          <M>{"\\sqrt\\beta = (\\sqrt\\kappa - 1)/(\\sqrt\\kappa + 1)"}</M>.
        </p>
        <Code>{RATE}</Code>
      </Proof>

      <Remark title="what carries over to networks">
        <p>
          A network's loss is not a quadratic and its gradient is noisy, so the optimal formulas are not used directly. The
          lessons survive: the largest stable learning rate is set by the sharpest curvature, flat directions are slow, and
          momentum around 0.9 buys a large speed-up on ill-conditioned problems. Noise adds a further effect: v averages the
          last <M>{"1/(1 - \\beta)"}</M> or so gradients, smoothing minibatch noise.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "maxlr",
      rung: "check",
      prompt: <p>The largest curvature of a quadratic loss is 50. Above what learning rate does gradient descent diverge?</p>,
      answer: { kind: "numeric", value: 0.04, tolerance: 1e-9 },
    },
    {
      key: "eff",
      rung: "check",
      prompt: <p>With momentum β = 0.9 and a constant gradient, the steady-state step is how many times the plain gradient step?</p>,
      answer: { kind: "numeric", value: 10, tolerance: 1e-9 },
    },
    {
      key: "kappa",
      rung: "apply",
      prompt: <p>For κ = 100, what is the best worst-case factor per step for plain gradient descent on a quadratic? Give it to 4 decimal places.</p>,
      answer: { kind: "numeric", value: 0.98019802, tolerance: 1e-4 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def gd_quadratic(lams, x0, lr, steps):
    x = np.array(x0, dtype=float)
    for _ in range(steps):
        x = x - lr * lams * x
    return x

def momentum_quadratic(lams, x0, lr, beta, steps):
    x = np.array(x0, dtype=float)
    v = np.zeros_like(x)
    for _ in range(steps):
        v = beta * v + lams * x
        x = x - lr * v
    return x

lams = np.array([1.0, 100.0])
print(gd_quadratic(lams, [1.0, 1.0], 0.019, 100).round(3))
print(abs(gd_quadratic(lams, [1.0, 1.0], 0.021, 100)[1]) > 1000)
print(np.abs(momentum_quadratic(lams, [1.0, 1.0], 0.033, 0.67, 100)).max() < 1e-6)`}</Code>
          <p>Curvatures 1 and 100. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0.147 0.   ]\nTrue\nTrue", "[0.147 0.   ]\nFalse\nTrue", "[0.    0.   ]\nTrue\nTrue", "[0.147 0.   ]\nTrue\nFalse"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def conv_factor(lam, lr, beta):
    roots = np.roots([1.0, -(1 + beta - lr * lam), beta])
    return float(np.max(np.abs(roots)))

def best_lr_gd(lmin, lmax):
    return 2 / (lmin + lmax)

print(round(conv_factor(1.0, 0.5, 0.0), 2), round(conv_factor(1.0, 0.5, 0.81), 2))
print(round(conv_factor(100.0, 0.021, 0.0), 2), round(conv_factor(100.0, 0.021, 0.5), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.5 0.9\n1.1 0.71", "0.5 0.5\n1.1 1.1", "0.5 0.9\n1.1 1.1", "0.5 0.81\n1.1 0.5"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          The loss is <M>{"\\tfrac12\\sum_i \\lambda_i x_i^2"}</M> with curvatures in the array <C>lams</C>. Write{" "}
          <C>gd_quadratic(lams, x0, lr, steps)</C> and <C>momentum_quadratic(lams, x0, lr, beta, steps)</C> (v starts at 0,
          then <C>v = beta·v + grad</C>, <C>x = x − lr·v</C>), each returning the final x as a float array.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gd_quadratic(lams, x0, lr, steps):
    return np.array(x0, dtype=float)

def momentum_quadratic(lams, x0, lr, beta, steps):
    return np.array(x0, dtype=float)
`,
        solution: QUAD,
        tests: [
          { name: "gd", code: `lams = np.array([1.0, 100.0])
assert np.allclose(gd_quadratic(lams, [1.0, 1.0], 0.019, 1), [0.981, -0.9])
assert np.allclose(gd_quadratic(lams, [2.0, 1.0], 0.019, 100), [2 * 0.981 ** 100, (-0.9) ** 100])
assert gd_quadratic(lams, [1, 1], 0.1, 0).dtype == float` },
          { name: "momentum", code: `lams = np.array([2.0])
assert np.allclose(momentum_quadratic(lams, [1.0], 0.1, 0.5, 1), [0.8])
assert np.allclose(momentum_quadratic(lams, [1.0], 0.1, 0.5, 2), [0.8 - 0.1 * (0.5 * 2 + 1.6)])
lams = np.array([1.0, 100.0])
assert np.abs(momentum_quadratic(lams, [1.0, 1.0], 0.033, 0.67, 100)).max() < 1e-6
assert np.allclose(momentum_quadratic(lams, [1.0, 1.0], 0.01, 0.0, 30), gd_quadratic(lams, [1.0, 1.0], 0.01, 30))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>conv_factor(lam, lr, beta)</C>, the largest modulus of a root of{" "}
          <M>{"r^2 - (1 + \\beta - \\eta\\lambda)r + \\beta"}</M> as a float (<C>np.roots</C> helps), and{" "}
          <C>best_lr_gd(lmin, lmax)</C>, the learning rate that minimises plain gradient descent's worst-case factor.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def conv_factor(lam, lr, beta):
    return abs(1 - lr * lam)

def best_lr_gd(lmin, lmax):
    return 1 / lmax
`,
        solution: `import numpy as np

${RATE}`,
        tests: [
          { name: "factor", code: `assert abs(conv_factor(1.0, 0.5, 0.0) - 0.5) < 1e-12
assert abs(conv_factor(100.0, 0.021, 0.5) - np.sqrt(0.5)) < 1e-9
assert abs(conv_factor(1.0, 0.1, 0.25) - (1.15 + np.sqrt(1.15 ** 2 - 1)) / 2) < 1e-9
assert isinstance(conv_factor(1.0, 0.1, 0.9), float)` },
          { name: "best lr", code: `eta = best_lr_gd(1.0, 100.0)
assert abs(eta - 2 / 101) < 1e-12
assert abs(conv_factor(1.0, eta, 0.0) - 99 / 101) < 1e-9 and abs(conv_factor(100.0, eta, 0.0) - 99 / 101) < 1e-9` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that gradient descent with learning rate η on L(x) = ½Σλᵢxᵢ² (all λᵢ &gt; 0) converges from every starting point if and only if η &lt; 2/λ_max.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Derives the per-coordinate update xᵢ ← (1 − ηλᵢ)xᵢ, so xᵢ after t steps is (1 − ηλᵢ)ᵗ times its start.",
          "States convergence for every start requires and is implied by |1 − ηλᵢ| < 1 for all i, i.e. 0 < ηλᵢ < 2.",
          "Concludes the binding condition is the largest curvature: η < 2/λ_max (with η > 0).",
        ],
      },
    },
    {
      key: "mom100",
      rung: "stretch",
      prompt: <p>For κ = 100, what is the optimal heavy-ball momentum β = ((√κ − 1)/(√κ + 1))²? Give 4 decimal places.</p>,
      answer: { kind: "numeric", value: 0.66942149, tolerance: 1e-4 },
    },
  ],

  teachBack:
    "Explain to a friend why the sharpest direction limits the learning rate, how momentum speeds up the flat directions, and how much faster it can be.",

  glimpse: (
    <p>
      Momentum uses one learning rate for every parameter. Next: Adam, which rescales each parameter by its own gradient
      history, and AdamW, which fixes how it handles weight decay.
    </p>
  ),
};
