import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TangentBelowViz } from "@/components/viz/TangentBelowViz";
import type { LessonContent } from "@/lib/types";

const DIFF = `import numpy as np

def num_grad(f, x, h=1e-6):
    E = np.eye(len(x))
    return np.array([(f(x + h * e) - f(x - h * e)) / (2 * h) for e in E])

def num_hess(f, x, h=1e-4):
    E = np.eye(len(x))
    def d2(a, b):
        return f(x + h * (a + b)) - f(x + h * (a - b)) - f(x - h * (a - b)) + f(x - h * (a + b))
    H = np.array([[d2(a, b) / (4 * h * h) for b in E] for a in E])
    return (H + H.T) / 2

def tangent_gap(f, grad, x, y):
    return float(f(y) - f(x) - grad(x) @ (y - x))`;

const HESS = `import numpy as np

def lse_hessian(x):
    p = np.exp(x - x.max())
    p /= p.sum()
    return np.diag(p) - np.outer(p, p)

def min_curvature(hess, dim, trials=500, scale=3.0, seed=0):
    rng = np.random.default_rng(seed)
    return float(min(np.linalg.eigvalsh(hess(scale * rng.normal(size=dim))).min() for _ in range(trials)))`;

export const lesson: LessonContent = {
  id: "m10.2.2",
  minutes: 50,
  links: {
    requires: ["m10.2.1", "m5.5.1", "m5.5.2", "m3.7.5"],
    revisits: ["m5.4.4"],
    foreshadows: ["m10.5.1", "m10.5.2", "m10.6.3"],
  },

  puzzle: (
    <>
      <p>
        Logistic regression minimises the average of log(1 + exp(−y wᵀx)) over the data. Is that function of w convex, so
        that gradient descent cannot get stuck? Checking chords between all pairs of weight vectors is hopeless. Is there a
        test you can carry out with a pencil, using derivatives?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A tangent line of a convex function never cuts above the graph: the linear approximation at any point is an
        under-estimate everywhere, not just nearby. That is what makes a zero gradient decisive, since the tangent plane is
        then flat and the whole function sits above it. Curving upwards at every point, a nonnegative second derivative or
        a positive semidefinite Hessian, is the infinitesimal version of the same fact.
      </p>
      <TangentBelowViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the first-order condition">
        <p>A differentiable f on an open convex set is convex exactly when, for all x and y,</p>
        <MD>{"f(y) \\geq f(x) + \\nabla f(x)^\\top(y - x)."}</MD>
      </Theorem>
      <Proof>
        <p>
          If f is convex, then for θ in (0, 1],{" "}
          <M>{"f(x + \\theta(y - x)) \\leq f(x) + \\theta(f(y) - f(x))"}</M>. Rearranging,{" "}
          <M>{"\\frac{f(x + \\theta(y - x)) - f(x)}{\\theta} \\leq f(y) - f(x)"}</M>, and letting θ → 0 the left side tends to
          the directional derivative <M>{"\\nabla f(x)^\\top(y - x)"}</M>. Conversely, given x, y and θ, let{" "}
          <M>{"z = \\theta x + (1 - \\theta)y"}</M>. Apply the inequality at z towards x and towards y, multiply by θ and
          1 − θ and add: the gradient terms cancel because{" "}
          <M>{"\\theta(x - z) + (1 - \\theta)(y - z) = 0"}</M>, leaving{" "}
          <M>{"\\theta f(x) + (1 - \\theta)f(y) \\geq f(z)"}</M>.
        </p>
      </Proof>
      <p>
        Two consequences. If <M>{"\\nabla f(x) = 0"}</M>, the inequality says <M>{"f(y) \\geq f(x)"}</M> for all y, so x is a
        global minimiser. Adding the inequality to the same one with x and y swapped gives monotonicity of the gradient:{" "}
        <M>{"(\\nabla f(x) - \\nabla f(y))^\\top(x - y) \\geq 0"}</M>.
      </p>

      <Theorem title="the second-order condition">
        <p>
          A twice differentiable f on an open convex set is convex exactly when <M>{"\\nabla^2 f(x) \\succeq 0"}</M> for every
          x, and m-strongly convex exactly when <M>{"\\nabla^2 f(x) \\succeq mI"}</M> for every x.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the theorem on lines, f is convex exactly when every restriction <M>{"g(t) = f(x + tv)"}</M> is, and{" "}
          <M>{"g''(t) = v^\\top\\nabla^2f(x + tv)v"}</M>. So it suffices to show that a twice differentiable g of one
          variable is convex exactly when <M>{"g'' \\geq 0"}</M>. If <M>{"g'' \\geq 0"}</M>, Taylor&apos;s theorem with
          remainder gives <M>{"g(s) = g(t) + g'(t)(s - t) + \\frac12g''(\\xi)(s - t)^2 \\geq g(t) + g'(t)(s - t)"}</M>, the
          first-order condition. Conversely, if g is convex, the first-order condition at t and s, added, gives{" "}
          <M>{"(g'(s) - g'(t))(s - t) \\geq 0"}</M>, so g′ is nondecreasing and <M>{"g'' \\geq 0"}</M>. For strong
          convexity apply this to <M>{"f - \\frac m2\\lVert x\\rVert^2"}</M>, whose Hessian is <M>{"\\nabla^2f - mI"}</M>.
        </p>
        <Code>{DIFF}</Code>
      </Proof>

      <Theorem title="log-sum-exp is convex">
        <p>
          For <M>{"f(x) = \\log\\sum_i e^{x_i}"}</M> and <M>{"p = \\mathrm{softmax}(x)"}</M>,{" "}
          <M>{"\\nabla^2f(x) = \\mathrm{diag}(p) - pp^\\top \\succeq 0"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The gradient is p, and differentiating <M>{"p_i = e^{x_i}/\\sum_k e^{x_k}"}</M> gives{" "}
          <M>{"\\partial p_i/\\partial x_j = p_i\\mathbb 1[i = j] - p_ip_j"}</M>. For any v,{" "}
          <M>{"v^\\top(\\mathrm{diag}(p) - pp^\\top)v = \\sum_ip_iv_i^2 - (\\sum_ip_iv_i)^2"}</M>, the variance of a random
          variable taking value <M>{"v_i"}</M> with probability <M>{"p_i"}</M>, which is nonnegative. It is zero along{" "}
          <M>{"v = \\mathbf 1"}</M>, so log-sum-exp is convex but not strictly convex.
        </p>
        <Code>{HESS}</Code>
      </Proof>

      <Remark title="using the conditions">
        <p>
          The logistic loss of the puzzle is log-sum-exp of (0, −y wᵀx), a convex function of an affine map of w, so it is
          convex; its one-variable form log(1 + eᵗ) has second derivative σ(t)(1 − σ(t)) &gt; 0. In the code, the quadratic{" "}
          <M>{"x_1^2 + 3x_2^2 + x_1x_2"}</M> has constant Hessian [[2, 1], [1, 6]], with smallest eigenvalue{" "}
          <M>{"4 - \\sqrt5 \\approx 1.7639"}</M>, so it is 1.7639-strongly convex, and its tangent gaps are positive; for{" "}
          <M>{"x^3"}</M> the tangent at 1 lies 16 above the graph at −3. The Hessian of log-sum-exp at (0, log 3), where p =
          (0.25, 0.75), has entries ±0.1875 and rows summing to 0. Numerical Hessians by finite differences are a cheap
          check on a derivation, never a proof of convexity.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "fdd",
      rung: "check",
      prompt: <p>For f(x) = x⁴ − 2x², what is f″(0.5)?</p>,
      answer: { kind: "numeric", value: -1, tolerance: 0.0001 },
    },
    {
      key: "eig",
      rung: "check",
      prompt: <p>f(x) = 2x₁² + 2x₁x₂ + 2x₂². What is the largest m for which f is m-strongly convex?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "zero",
      rung: "apply",
      prompt: <p>f is convex and differentiable on ℝⁿ and ∇f(x*) = 0. What follows from the first-order condition?</p>,
      answer: {
        kind: "choice",
        options: [
          "x* is a global minimiser of f",
          "x* is a local minimiser but maybe not a global one",
          "x* is the unique minimiser of f",
          "Nothing, without knowing the Hessian at x*",
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

def num_grad(f, x, h=1e-6):
    E = np.eye(len(x))
    return np.array([(f(x + h * e) - f(x - h * e)) / (2 * h) for e in E])

def num_hess(f, x, h=1e-4):
    E = np.eye(len(x))
    def d2(a, b):
        return f(x + h * (a + b)) - f(x + h * (a - b)) - f(x - h * (a - b)) + f(x - h * (a + b))
    H = np.array([[d2(a, b) / (4 * h * h) for b in E] for a in E])
    return (H + H.T) / 2

def tangent_gap(f, grad, x, y):
    return float(f(y) - f(x) - grad(x) @ (y - x))

f = lambda x: float(x[0] ** 2 + 3 * x[1] ** 2 + x[0] * x[1]); x = np.array([1.0, -1.0])
print(np.round(num_grad(f, x), 4) + 0.0, np.round(num_hess(f, x), 3) + 0.0)
g = lambda x: np.array([2 * x[0] + x[1], 6 * x[1] + x[0]])
print(round(tangent_gap(f, g, x, np.array([0.0, 0.0])), 4), round(tangent_gap(f, g, x, np.array([3.0, 2.0])), 4))
cube = lambda x: float(x[0] ** 3)
print(round(tangent_gap(cube, lambda x: np.array([3 * x[0] ** 2]), np.array([1.0]), np.array([-3.0])), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[ 1. -5.] [[2. 1.]\n [1. 6.]]\n3.0 37.0\n-16.0", "[ 1. -5.] [[2. 1.]\n [1. 6.]]\n3.0 37.0\n16.0", "[ 1. -5.] [[1. 1.]\n [1. 3.]]\n3.0 37.0\n-16.0", "[ 2. -6.] [[2. 1.]\n [1. 6.]]\n3.0 37.0\n-16.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def lse_hessian(x):
    p = np.exp(x - x.max())
    p /= p.sum()
    return np.diag(p) - np.outer(p, p)

def min_curvature(hess, dim, trials=500, scale=3.0, seed=0):
    rng = np.random.default_rng(seed)
    return float(min(np.linalg.eigvalsh(hess(scale * rng.normal(size=dim))).min() for _ in range(trials)))

H = lse_hessian(np.array([0.0, np.log(3.0)]))
print(np.round(H, 4) + 0.0, np.round(H.sum(axis=1), 12) + 0.0)
print(min_curvature(lse_hessian, 3) >= -1e-12, round(min_curvature(lambda x: np.array([[2.0, 1.0], [1.0, 6.0]]), 2), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[[ 0.1875 -0.1875]\n [-0.1875  0.1875]] [0. 0.]\nTrue 1.7639", "[[ 0.25  -0.1875]\n [-0.1875  0.75 ]] [0. 0.]\nTrue 1.7639", "[[ 0.1875 -0.1875]\n [-0.1875  0.1875]] [0. 0.]\nFalse 1.7639", "[[ 0.1875 -0.1875]\n [-0.1875  0.1875]] [0. 0.]\nTrue 2.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>num_grad(f, x, h=1e-6)</C> by central differences, <C>num_hess(f, x, h=1e-4)</C> by the four-point
          mixed central difference (symmetrised), and <C>tangent_gap(f, grad, x, y)</C>, returning f(y) − f(x) −
          grad(x)ᵀ(y − x).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def num_grad(f, x, h=1e-6):
    return np.zeros(len(x))

def num_hess(f, x, h=1e-4):
    return np.zeros((len(x), len(x)))

def tangent_gap(f, grad, x, y):
    return 0.0
`,
        solution: DIFF,
        tests: [
          { name: "derivs", code: `f = lambda x: float(np.exp(x[0]) + x[0] * x[1] ** 2)
x = np.array([0.5, 2.0])
assert np.allclose(num_grad(f, x), [np.exp(0.5) + 4, 2.0], atol=1e-5) and np.allclose(num_hess(f, x), [[np.exp(0.5), 4], [4, 1.0]], atol=1e-4)` },
          { name: "tangent", code: `f = lambda x: float(x @ x); g = lambda x: 2 * x
assert abs(tangent_gap(f, g, np.array([1.0, 2.0]), np.array([-1.0, 0.0])) - 8.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lse_hessian(x)</C>, the Hessian diag(p) − ppᵀ of log-sum-exp computed stably, and{" "}
          <C>min_curvature(hess, dim, trials=500, scale=3.0, seed=0)</C>, the smallest Hessian eigenvalue over random points
          scale·N(0, I).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def lse_hessian(x):
    return np.zeros((len(x), len(x)))

def min_curvature(hess, dim, trials=500, scale=3.0, seed=0):
    return 0.0
`,
        solution: HESS,
        tests: [
          { name: "lse", code: `H = lse_hessian(np.array([1000.0, 1000.0, 1000.0]))
assert np.allclose(H, np.eye(3) / 3 - 1 / 9) and np.allclose(lse_hessian(np.array([0.0, 0.0])), [[0.25, -0.25], [-0.25, 0.25]])` },
          { name: "curv", code: `assert min_curvature(lambda x: np.diag([2.0 + x[0] ** 2, 1.0]), 2) == 1.0 and min_curvature(lambda x: np.array([[6 * x[0]]]), 1) < -5` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let f be differentiable on ℝⁿ. Prove that if f(y) ≥ f(x) + ∇f(x)ᵀ(y − x) for all x and y, then f is convex.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Fixes x, y, θ and sets z = θx + (1 − θ)y.",
          "Applies the inequality at z towards x and towards y, multiplies by θ and 1 − θ, and adds.",
          "Notes the gradient terms cancel since θ(x − z) + (1 − θ)(y − z) = 0, leaving θf(x) + (1 − θ)f(y) ≥ f(z).",
        ],
      },
    },
    {
      key: "lg",
      rung: "stretch",
      prompt: <p>What is the largest value of the second derivative of log(1 + eᵗ) over all real t?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why a differentiable function is convex exactly when its tangent planes lie below its graph, why a zero gradient then means a global minimum, how the Hessian test follows by restricting to lines, and why log-sum-exp is convex.",

  glimpse: (
    <>
      <p>
        Derivative tests settle simple cases. For a function like the largest eigenvalue of a matrix, or a sum of norms, it
        is easier to recognise how the function is assembled from convex pieces, using rules that preserve convexity.
      </p>
    </>
  ),
};
