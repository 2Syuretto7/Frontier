import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ProxMapViz } from "@/components/viz/ProxMapViz";
import type { LessonContent } from "@/lib/types";

const PX = `import numpy as np

def prox_l1(v, lam):
    return np.sign(v) * np.maximum(np.abs(v) - lam, 0.0) + 0.0

def prox_box(v, lo, hi):
    return np.clip(v, lo, hi)

def prox_sq(v, lam):
    return v / (1 + lam)`;

const PG = `import numpy as np

def prox_grad(grad_g, prox_h, x0, t, iters):
    x = np.array(x0, dtype=float)
    for _ in range(iters):
        x = prox_h(x - t * grad_g(x), t)
    return x

def fista(grad_g, prox_h, x0, t, iters):
    x = np.array(x0, dtype=float)
    y, s = x.copy(), 1.0
    for _ in range(iters):
        xn = prox_h(y - t * grad_g(y), t)
        sn = (1 + np.sqrt(1 + 4 * s * s)) / 2
        y = xn + (s - 1) / sn * (xn - x)
        x, s = xn, sn
    return x`;

export const lesson: LessonContent = {
  id: "m10.7.2",
  minutes: 50,
  links: {
    requires: ["m10.7.1", "m10.5.3"],
    revisits: ["m10.6.2"],
    foreshadows: ["m10.7.3", "m10.8.1", "m10.8.3"],
  },

  puzzle: (
    <>
      <p>
        Least squares plus an ℓ₁ penalty is not differentiable, so the subgradient method applies, at its slow 1/√k rate.
        But the nonsmooth part is so simple, a sum of absolute values, that minimising it plus a quadratic has a closed
        form. Can a method treat the smooth part with gradient steps and the simple nonsmooth part exactly, and so recover
        the rate of gradient descent, or even of Nesterov?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A gradient step on a smooth g minimises a quadratic model: linear approximation plus a proximity term. Keep the
        nonsmooth h exactly in that model instead of linearising it, and the step becomes: take a gradient step on g, then
        solve a small problem that balances h against staying close. That small problem is the proximal operator. For the
        absolute value it shrinks every coordinate towards 0 and sets small ones exactly to 0; for an indicator function it
        is projection.
      </p>
      <ProxMapViz />
    </>
  ),

  theory: (
    <>
      <Definition title="proximal operator and Moreau envelope">
        <p>For a closed convex h and λ &gt; 0,</p>
        <MD>{"\\mathrm{prox}_{\\lambda h}(v) = \\arg\\min_x \\Big(h(x) + \\frac{1}{2\\lambda}\\|x - v\\|^2\\Big),"}</MD>
        <p>
          which exists and is unique because the objective is strongly convex. The minimum value is the Moreau envelope{" "}
          <M>{"M_{\\lambda h}(v)"}</M>, a differentiable lower approximation of h. Examples: for <M>{"h = \\|x\\|_1"}</M>,
          coordinatewise soft thresholding <M>{"\\mathrm{sign}(v_i)\\max(|v_i| - \\lambda, 0)"}</M>; for the indicator of a
          closed convex set C, the projection onto C; for <M>{"h = \\frac12\\|x\\|^2"}</M>, <M>{"v/(1 + \\lambda)"}</M>.
        </p>
      </Definition>

      <Theorem title="characterisation and nonexpansiveness">
        <p>
          <M>{"p = \\mathrm{prox}_{\\lambda h}(v)"}</M> if and only if <M>{"(v - p)/\\lambda \\in \\partial h(p)"}</M>. Moreover{" "}
          <M>{"\\|\\mathrm{prox}_{\\lambda h}(u) - \\mathrm{prox}_{\\lambda h}(v)\\| \\leq \\|u - v\\|"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The objective is h plus a differentiable convex function, so p minimises it exactly when{" "}
          <M>{"0 \\in \\partial h(p) + (p - v)/\\lambda"}</M>. For the second claim, let p and q be the proxes of u and v. The
          subdifferential is monotone: adding the subgradient inequalities{" "}
          <M>{"h(q) \\geq h(p) + a^\\top(q - p)"}</M> and <M>{"h(p) \\geq h(q) + b^\\top(p - q)"}</M> for a ∈ ∂h(p), b ∈ ∂h(q)
          gives <M>{"(a - b)^\\top(p - q) \\geq 0"}</M>. With <M>{"a = (u - p)/\\lambda"}</M> and{" "}
          <M>{"b = (v - q)/\\lambda"}</M> this says <M>{"\\|p - q\\|^2 \\leq (u - v)^\\top(p - q) \\leq \\|u - v\\|\\,\\|p - q\\|"}</M>.
        </p>
        <Code>{PX}</Code>
      </Proof>

      <Theorem title="proximal gradient method">
        <p>
          Let f = g + h with g convex and L-smooth and h closed convex. The iteration{" "}
          <M>{"x_{k+1} = \\mathrm{prox}_{th}(x_k - t\\nabla g(x_k))"}</M> with t = 1/L satisfies{" "}
          <M>{"f(x_k) - f^* \\leq L\\|x_0 - x^*\\|^2/(2k)"}</M>, and its fixed points are exactly the minimisers of f. The
          accelerated version (FISTA), with the Nesterov extrapolation of the previous chapter, achieves{" "}
          <M>{"2L\\|x_0 - x^*\\|^2/(k + 1)^2"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Fixed points: <M>{"x = \\mathrm{prox}_{th}(x - t\\nabla g(x))"}</M> if and only if{" "}
          <M>{"-\\nabla g(x) \\in \\partial h(x)"}</M>, that is, <M>{"0 \\in \\partial f(x)"}</M>. For the rate, the
          characterisation gives, with <M>{"x^+ = x - tG"}</M> where G is the gradient mapping{" "}
          <M>{"(x - x^+)/t"}</M>, the inequality <M>{"f(x^+) \\leq f(z) + G^\\top(x - z) - \\frac t2\\|G\\|^2"}</M> for all z.
          This is the key inequality of the gradient descent and Nesterov proofs with G in place of ∇f, so both proofs go
          through unchanged.
        </p>
      </Proof>

      <Remark title="when the prox is cheap">
        <p>
          The method is useful exactly when the prox of h is cheap: norms, indicators of boxes, balls and simplices,
          nuclear norms (by thresholding singular values), and separable sums of these. In the code, soft thresholding by 1
          twice equals soft thresholding by 2, and on a small ℓ₁-penalised least-squares problem 500 proximal gradient steps
          and 100 FISTA steps both reach (0.5, 0.3333), a fixed point of the update.
        </p>
        <Code>{PG}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "soft",
      rung: "check",
      prompt: <p>Compute prox_λh(v) for h(x) = |x|, λ = 1.2, v = −3.5.</p>,
      answer: { kind: "numeric", value: -2.3, tolerance: 0.0001 },
    },
    {
      key: "sq",
      rung: "check",
      prompt: <p>Compute prox_λh(v) for h(x) = x²/2, λ = 3, v = 8.</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "fix",
      rung: "apply",
      prompt: <p>For f = g + h with g smooth, when is x a fixed point of x ↦ prox_th(x − t∇g(x)), for t &gt; 0?</p>,
      answer: {
        kind: "choice",
        options: [
          "Exactly when x minimises g + h",
          "Exactly when ∇g(x) = 0",
          "Exactly when x minimises h",
          "Only when t = 1/L",
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

def prox_l1(v, lam):
    return np.sign(v) * np.maximum(np.abs(v) - lam, 0.0) + 0.0

def prox_box(v, lo, hi):
    return np.clip(v, lo, hi)

def prox_sq(v, lam):
    return v / (1 + lam)

v = np.array([3.0, -0.5, 1.25, -2.0])
print(prox_l1(v, 1.0).tolist(), prox_box(v, -1.0, 1.0).tolist(), prox_sq(v, 1.0).tolist())
p = prox_l1(v, 1.0)
print(bool(np.all(np.abs(v - p) <= 1.0)), prox_l1(p, 1.0).tolist(), prox_l1(v, 2.0).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[2.0, 0.0, 0.25, -1.0] [1.0, -0.5, 1.0, -1.0] [1.5, -0.25, 0.625, -1.0]\nTrue [1.0, 0.0, 0.0, 0.0] [1.0, 0.0, 0.0, 0.0]", "[2.0, -0.5, 0.25, -1.0] [1.0, -0.5, 1.0, -1.0] [1.5, -0.25, 0.625, -1.0]\nTrue [1.0, 0.0, 0.0, 0.0] [1.0, 0.0, 0.0, 0.0]", "[2.0, 0.0, 0.25, -1.0] [1.0, -0.5, 1.0, -1.0] [1.5, -0.25, 0.625, -1.0]\nTrue [2.0, 0.0, 0.25, -1.0] [1.0, 0.0, 0.0, 0.0]", "[2.0, 0.0, 0.25, -1.0] [1.0, -1.0, 1.0, -1.0] [1.5, -0.25, 0.625, -1.0]\nFalse [1.0, 0.0, 0.0, 0.0] [1.0, 0.0, 0.0, 0.0]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def prox_grad(grad_g, prox_h, x0, t, iters):
    x = np.array(x0, dtype=float)
    for _ in range(iters):
        x = prox_h(x - t * grad_g(x), t)
    return x

def fista(grad_g, prox_h, x0, t, iters):
    x = np.array(x0, dtype=float)
    y, s = x.copy(), 1.0
    for _ in range(iters):
        xn = prox_h(y - t * grad_g(y), t)
        sn = (1 + np.sqrt(1 + 4 * s * s)) / 2
        y = xn + (s - 1) / sn * (xn - x)
        x, s = xn, sn
    return x

A = np.array([[1.0, 0.5], [0.0, 2.0], [1.0, 1.0]]); b = np.array([2.0, 1.0, 0.0]); lam = 0.5
gg = lambda x: A.T @ (A @ x - b); ph = lambda v, t: np.sign(v) * np.maximum(np.abs(v) - lam * t, 0.0) + 0.0
t = 1 / np.linalg.norm(A, 2) ** 2
x1 = prox_grad(gg, ph, np.zeros(2), t, 500); x2 = fista(gg, ph, np.zeros(2), t, 100)
print(np.round(x1, 4).tolist(), np.round(x2, 4).tolist())
print(np.allclose(ph(x1 - t * gg(x1), t), x1), np.round(prox_grad(gg, ph, np.zeros(2), t, 3), 4).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.5, 0.3333] [0.5, 0.3333]\nTrue [0.3605, 0.3879]", "[0.5, 0.3333] [0.5, 0.3333]\nFalse [0.3605, 0.3879]", "[0.5, 0.3333] [0.4818, 0.3457]\nTrue [0.3605, 0.3879]", "[0.6, 0.3] [0.5, 0.3333]\nTrue [0.5, 0.3333]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>prox_l1(v, lam)</C> (soft thresholding, with no negative zeros), <C>prox_box(v, lo, hi)</C> and{" "}
          <C>prox_sq(v, lam)</C>, the proximal operators of λ‖x‖₁, the indicator of a box and (λ/2)‖x‖² respectively.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def prox_l1(v, lam):
    return v

def prox_box(v, lo, hi):
    return v

def prox_sq(v, lam):
    return v
`,
        solution: PX,
        tests: [
          { name: "l1", code: `p = prox_l1(np.array([-3.5, 0.4, -0.4, 2.0]), 1.2)
assert np.allclose(p, [-2.3, 0.0, 0.0, 0.8]) and not np.signbit(p[2])` },
          { name: "box", code: `assert np.allclose(prox_box(np.array([-2.0, 0.3, 5.0]), np.array([-1.0, 0.0, 0.0]), np.array([1.0, 1.0, 4.0])), [-1.0, 0.3, 4.0])
v = np.array([1.0, -4.0]); p = prox_sq(v, 3.0)
assert np.allclose(p, [0.25, -1.0]) and np.allclose(3.0 * p + (p - v), 0.0)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>prox_grad(grad_g, prox_h, x0, t, iters)</C> and <C>fista(grad_g, prox_h, x0, t, iters)</C>, where{" "}
          <C>prox_h(v, t)</C> computes prox_th(v); FISTA uses s₀ = 1, s⁺ = (1 + √(1 + 4s²))/2 and y = x⁺ + ((s − 1)/s⁺)(x⁺ − x).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def prox_grad(grad_g, prox_h, x0, t, iters):
    return np.array(x0, dtype=float)

def fista(grad_g, prox_h, x0, t, iters):
    return np.array(x0, dtype=float)
`,
        solution: PG,
        tests: [
          { name: "box", code: `c = np.array([2.0, -0.3, -5.0]); gg = lambda x: x - c; ph = lambda v, t: np.clip(v, -1.0, 1.0)
assert np.allclose(prox_grad(gg, ph, np.zeros(3), 0.5, 60), [1.0, -0.3, -1.0]) and np.allclose(fista(gg, ph, np.zeros(3), 0.5, 60), [1.0, -0.3, -1.0])` },
          { name: "lasso", code: `rng = np.random.default_rng(1); A = rng.normal(size=(20, 8)); b = rng.normal(size=20); lam = 2.0
gg = lambda x: A.T @ (A @ x - b); ph = lambda v, t: np.sign(v) * np.maximum(np.abs(v) - lam * t, 0.0)
t = 1 / np.linalg.norm(A, 2) ** 2; F = lambda x: 0.5 * np.sum((A @ x - b) ** 2) + lam * np.abs(x).sum()
x1 = prox_grad(gg, ph, np.zeros(8), t, 3000); x2 = fista(gg, ph, np.zeros(8), t, 300)
assert np.allclose(ph(x1 - t * gg(x1), t), x1, atol=1e-8) and abs(F(x2) - F(x1)) < 1e-6` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let h be closed and convex. Using p = prox_λh(u) ⇔ (u − p)/λ ∈ ∂h(p), prove that ‖prox_λh(u) − prox_λh(v)‖ ≤ ‖u − v‖.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Proves monotonicity of ∂h: (a − b)ᵀ(p − q) ≥ 0 for a ∈ ∂h(p), b ∈ ∂h(q), by adding the two subgradient inequalities.",
          "Applies it with a = (u − p)/λ and b = (v − q)/λ to get ‖p − q‖² ≤ (u − v)ᵀ(p − q).",
          "Uses Cauchy–Schwarz and divides by ‖p − q‖ (handling the case p = q) to conclude.",
        ],
      },
    },
    {
      key: "env",
      rung: "stretch",
      prompt: <p>The Moreau envelope of h(x) = |x| with λ = 1, evaluated at v = 3, is min over x of |x| + (x − 3)²/2. What is it?</p>,
      answer: { kind: "numeric", value: 2.5, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what the proximal operator is, why it generalises projection, what it does for the absolute value, how proximal gradient splits a smooth plus simple objective, and why it keeps the rates of gradient descent and Nesterov.",

  glimpse: (
    <>
      <p>
        The soft-thresholding prox sets small coordinates exactly to zero. The next lesson asks why ℓ₁ penalties produce
        sparse solutions at all, through geometry, through optimality conditions, and through the lasso path.
      </p>
    </>
  ),
};
