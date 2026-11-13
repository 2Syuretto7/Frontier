import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MirrorSimplexViz } from "@/components/viz/MirrorSimplexViz";
import type { LessonContent } from "@/lib/types";

const BR = `import numpy as np

def kl(x, y):
    m = x > 0
    return float(np.sum(x[m] * np.log(x[m] / y[m])))

def eg_step(x, g, t):
    w = x * np.exp(-t * (g - g.min()))
    return w / w.sum()

def project_simplex(v):
    u = np.sort(v)[::-1]
    css = np.cumsum(u)
    k = np.nonzero(u - (css - 1) / np.arange(1, len(v) + 1) > 0)[0][-1]
    tau = (css[k] - 1) / (k + 1)
    return np.maximum(v - tau, 0.0)`;

const MD_ = `import numpy as np

def mirror_descent(grad, x0, t, iters):
    x = np.array(x0, dtype=float)
    avg = np.zeros_like(x)
    for _ in range(iters):
        avg += x / iters
        g = grad(x)
        w = x * np.exp(-t * (g - g.min()))
        x = w / w.sum()
    return x, avg

def md_bound(n, G, k):
    return G * np.sqrt(2 * np.log(n) / k)`;

export const lesson: LessonContent = {
  id: "m10.7.4",
  minutes: 50,
  links: {
    requires: ["m10.7.1", "m10.7.2"],
    revisits: ["m10.2.4"],
    foreshadows: ["m10.8.1", "m10.8.2"],
  },

  puzzle: (
    <>
      <p>
        You spread a budget over a million options and learn their losses as you go. The subgradient method&apos;s
        guarantee depends on the Euclidean size of the gradients, which for a million coordinates each up to 1 is a
        thousand. Yet a simple rule, multiply each weight by e to the minus its loss and renormalise, has a guarantee that
        grows only like the square root of log(million), about 3.7. Where does the difference come from?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Gradient steps are tied to Euclidean distance: the step minimises a linear model plus ½‖x − x_k‖². On the
        probability simplex, Euclidean distance is the wrong ruler. Measuring closeness by relative entropy instead turns
        the additive update into a multiplicative one, which keeps weights positive automatically and pays for gradients
        in the max norm rather than the Euclidean norm. Mirror descent is the general recipe: choose a distance-generating
        function matched to the constraint set, and step in its geometry.
      </p>
      <MirrorSimplexViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Bregman divergence and mirror descent">
        <p>For a differentiable, strictly convex φ, the Bregman divergence is</p>
        <MD>{"D_\\varphi(x, y) = \\varphi(x) - \\varphi(y) - \\nabla\\varphi(y)^\\top(x - y) \\geq 0."}</MD>
        <p>
          For <M>{"\\varphi = \\frac12\\|x\\|^2"}</M> it is <M>{"\\frac12\\|x - y\\|^2"}</M>; for the negative entropy{" "}
          <M>{"\\varphi(x) = \\sum x_i\\log x_i"}</M> on the simplex it is the relative entropy{" "}
          <M>{"\\mathrm{KL}(x\\|y) = \\sum x_i\\log(x_i/y_i)"}</M>. Mirror descent on a convex set C takes
        </p>
        <MD>{"x_{k+1} = \\arg\\min_{x \\in C}\\big(t\\,g_k^\\top x + D_\\varphi(x, x_k)\\big), \\qquad g_k \\in \\partial f(x_k)."}</MD>
      </Definition>

      <Theorem title="exponentiated gradient">
        <p>
          On the simplex with the negative entropy, the mirror step is{" "}
          <M>{"x_{k+1,i} = x_{k,i}e^{-tg_{k,i}}\\big/\\sum_j x_{k,j}e^{-tg_{k,j}}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Introduce a multiplier ν for <M>{"\\sum x_i = 1"}</M>. Stationarity of{" "}
          <M>{"t\\,g^\\top x + \\sum x_i\\log(x_i/y_i) + \\nu(\\sum x_i - 1)"}</M> gives{" "}
          <M>{"tg_i + \\log(x_i/y_i) + 1 + \\nu = 0"}</M>, so <M>{"x_i = y_ie^{-tg_i}e^{-1-\\nu}"}</M>, which is positive, so the
          constraint <M>{"x \\geq 0"}</M> is inactive; ν is fixed by normalisation. The objective is strictly convex, so this
          stationary point is the minimiser.
        </p>
        <Code>{BR}</Code>
      </Proof>

      <Theorem title="convergence">
        <p>
          Let φ be 1-strongly convex on C with respect to a norm ‖·‖, let <M>{"\\|g_k\\|_* \\leq G"}</M> in the dual norm, and
          let x* minimise f over C. With constant step t,
        </p>
        <MD>{"\\frac1k\\sum_{i<k}f(x_i) - f^* \\leq \\frac{D_\\varphi(x^*, x_0)}{tk} + \\frac{tG^2}{2}."}</MD>
        <p>
          On the simplex from the uniform point, <M>{"D \\leq \\log n"}</M> and the entropy is 1-strongly convex for ‖·‖₁
          (Pinsker&apos;s inequality), so the optimal t gives <M>{"G_\\infty\\sqrt{2\\log n/k}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Optimality of <M>{"x^+"}</M> gives <M>{"(tg + \\nabla\\varphi(x^+) - \\nabla\\varphi(x))^\\top(u - x^+) \\geq 0"}</M>{" "}
          for u ∈ C. The three-point identity{" "}
          <M>{"(\\nabla\\varphi(x) - \\nabla\\varphi(x^+))^\\top(u - x^+) = D(u, x^+) + D(x^+, x) - D(u, x)"}</M>, checked by
          expanding the definitions, turns this into{" "}
          <M>{"tg^\\top(x^+ - u) \\leq D(u, x) - D(u, x^+) - D(x^+, x)"}</M>. Add{" "}
          <M>{"tg^\\top(x - x^+) \\leq t\\|g\\|_*\\|x - x^+\\| \\leq \\frac{t^2G^2}{2} + \\frac12\\|x - x^+\\|^2"}</M> and use{" "}
          <M>{"D(x^+, x) \\geq \\frac12\\|x^+ - x\\|^2"}</M>:{" "}
          <M>{"t(f(x) - f(u)) \\leq tg^\\top(x - u) \\leq D(u, x) - D(u, x^+) + t^2G^2/2"}</M>. With u = x*, sum over k steps;
          the divergences telescope.
        </p>
      </Proof>

      <Remark title="why the geometry matters">
        <p>
          For losses in [0, 1]ⁿ, <M>{"G_\\infty \\leq 1"}</M> but the Euclidean <M>{"G_2"}</M> can be √n, while the Euclidean
          diameter of the simplex is √2. Projected subgradient therefore guarantees about √(n/k) where mirror descent
          guarantees √(log n / k): an exponential improvement in the dimension dependence. The exponentiated gradient update
          is the multiplicative weights or Hedge algorithm of online learning. In the code,{" "}
          <M>{"\\mathrm{KL}((0.5, 0.25, 0.25)\\|\\text{uniform}) \\approx 0.0589"}</M>; a step with t = log 2 halves the
          weight of the expert with loss 1; and on five experts with fixed losses, 400 steps with the tuned t put the most
          weight on the best one and have average excess loss 0.0227, inside the guarantee 0.0449.
        </p>
        <Code>{MD_}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "kl",
      rung: "check",
      prompt: <p>Compute KL(x‖y) for x = (1, 0) and y = (0.5, 0.5), using natural logarithms and 0 log 0 = 0.</p>,
      answer: { kind: "numeric", value: 0.693147, tolerance: 0.0001 },
    },
    {
      key: "eg",
      rung: "check",
      prompt: <p>Two experts with weights (0.5, 0.5) receive losses g = (0, 1). After one exponentiated gradient step with t = log 3, what is the first weight?</p>,
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0001 },
    },
    {
      key: "dim",
      rung: "apply",
      prompt: <p>Minimising over the simplex in ℝⁿ with gradients whose entries lie in [0, 1], how do the guarantees after k steps scale with n?</p>,
      answer: {
        kind: "choice",
        options: [
          "Mirror descent with entropy like √(log n / k); projected subgradient like √(n / k)",
          "Both like √(log n / k)",
          "Both like √(n / k)",
          "Mirror descent like √(n / k); projected subgradient like √(log n / k)",
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

def kl(x, y):
    m = x > 0
    return float(np.sum(x[m] * np.log(x[m] / y[m])))

def eg_step(x, g, t):
    w = x * np.exp(-t * (g - g.min()))
    return w / w.sum()

def project_simplex(v):
    u = np.sort(v)[::-1]
    css = np.cumsum(u)
    k = np.nonzero(u - (css - 1) / np.arange(1, len(v) + 1) > 0)[0][-1]
    tau = (css[k] - 1) / (k + 1)
    return np.maximum(v - tau, 0.0)

x = np.array([0.5, 0.25, 0.25]); y = np.ones(3) / 3
print(round(kl(x, y), 4), kl(y, y), np.round(eg_step(y, np.array([1.0, 0.0, 0.0]), np.log(2)), 4).tolist())
print(np.round(project_simplex(np.array([0.9, 0.6, -0.3])), 4).tolist(), np.round(project_simplex(np.array([0.2, 0.3, 0.5])), 4).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.0589 0.0 [0.2, 0.4, 0.4]\n[0.65, 0.35, 0.0] [0.2, 0.3, 0.5]", "0.0589 0.0 [0.1667, 0.4167, 0.4167]\n[0.65, 0.35, 0.0] [0.2, 0.3, 0.5]", "0.0589 0.0 [0.2, 0.4, 0.4]\n[0.6, 0.4, 0.0] [0.2, 0.3, 0.5]", "-0.0589 0.0 [0.2, 0.4, 0.4]\n[0.65, 0.35, 0.0] [0.2, 0.3, 0.5]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def mirror_descent(grad, x0, t, iters):
    x = np.array(x0, dtype=float)
    avg = np.zeros_like(x)
    for _ in range(iters):
        avg += x / iters
        g = grad(x)
        w = x * np.exp(-t * (g - g.min()))
        x = w / w.sum()
    return x, avg

def md_bound(n, G, k):
    return G * np.sqrt(2 * np.log(n) / k)

c = np.array([0.3, 0.1, 0.5, 0.2, 0.4]); k = 400; t = np.sqrt(2 * np.log(5) / k) / 0.5
x, avg = mirror_descent(lambda x: c, np.ones(5) / 5, t, k)
print(int(np.argmax(x)), round(float(c @ avg) - 0.1, 4), round(float(md_bound(5, 0.5, k)), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1 0.0227 0.0449", "2 0.0227 0.0449", "1 0.0449 0.0227", "1 0.0 0.0449"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kl(x, y)</C> (with 0 log 0 = 0), <C>eg_step(x, g, t)</C>, the exponentiated gradient update (subtract
          min g before exponentiating, for stability), and <C>project_simplex(v)</C>, the Euclidean projection onto the
          simplex by sorting.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def kl(x, y):
    return 0.0

def eg_step(x, g, t):
    return x

def project_simplex(v):
    return v
`,
        solution: BR,
        tests: [
          { name: "kl_eg", code: `assert abs(kl(np.array([1.0, 0.0]), np.array([0.5, 0.5])) - np.log(2)) < 1e-12
x = eg_step(np.array([0.5, 0.5]), np.array([0.0, 1.0]), np.log(3))
assert np.allclose(x, [0.75, 0.25]) and np.allclose(eg_step(np.array([0.2, 0.8]), np.array([1000.0, 1001.0]), 0.0), [0.2, 0.8])` },
          { name: "proj", code: `rng = np.random.default_rng(4)
for _ in range(20):
    v = rng.normal(size=5) * 2; p = project_simplex(v)
    assert abs(p.sum() - 1) < 1e-12 and p.min() >= 0
    for _ in range(20):
        q = rng.dirichlet(np.ones(5))
        assert (v - p) @ (q - p) <= 1e-10` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mirror_descent(grad, x0, t, iters)</C>, returning the final iterate and the average of the iterates x₀, …,
          x_(iters−1), and <C>md_bound(n, G, k)</C>, the guarantee G√(2 log n / k).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def mirror_descent(grad, x0, t, iters):
    return np.array(x0, dtype=float), np.array(x0, dtype=float)

def md_bound(n, G, k):
    return 0.0
`,
        solution: MD_,
        tests: [
          { name: "avg", code: `x, avg = mirror_descent(lambda x: np.array([0.0, 1.0]), np.array([0.5, 0.5]), np.log(3), 2)
assert np.allclose(x, [0.9, 0.1]) and np.allclose(avg, [0.625, 0.375])` },
          { name: "bound", code: `rng = np.random.default_rng(5); n = 50; c = rng.uniform(size=n); k = 500
t = np.sqrt(2 * np.log(n) / k)
x, avg = mirror_descent(lambda x: c, np.ones(n) / n, t, k)
assert c @ avg - c.min() <= md_bound(n, 1.0, k) and abs(md_bound(np.e ** 2, 1.0, 4) - 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that on the probability simplex, the minimiser of t gᵀx + KL(x‖y) (with y in the interior) is x_i = y_i
          e^(−t g_i) / Σ_j y_j e^(−t g_j).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Forms the Lagrangian with a multiplier for Σx_i = 1 and differentiates: t g_i + log(x_i/y_i) + 1 + ν = 0.",
          "Solves to x_i = y_i e^(−t g_i) times a common constant, notes x_i > 0 so the nonnegativity constraints are inactive, and normalises.",
          "Justifies that the stationary point is the minimiser, by strict convexity of the objective on the simplex.",
        ],
      },
    },
    {
      key: "steps",
      rung: "stretch",
      prompt: <p>With n = 100 options and G = 1, what is the smallest k for which the guarantee G√(2 log n / k) is at most 0.1?</p>,
      answer: { kind: "numeric", value: 922, tolerance: 0.5 },
    },
  ],

  teachBack:
    "Explain to a friend what a Bregman divergence is, how mirror descent with the entropy becomes a multiplicative update on the simplex, how the three-point identity gives its convergence bound, and why it beats projected subgradient by a dimension factor.",

  glimpse: (
    <>
      <p>
        Mirror descent handles the simplex through its geometry. The last chapter treats general constraints directly:
        projecting after each step, replacing projection by a linear minimisation, and splitting a problem into pieces that
        are each easy.
      </p>
    </>
  ),
};
