import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DescentLemmaViz } from "@/components/viz/DescentLemmaViz";
import type { LessonContent } from "@/lib/types";

const GD = `import numpy as np

def gd(grad, x0, t, iters):
    x = np.array(x0, dtype=float)
    path = [x.copy()]
    for _ in range(iters):
        x = x - t * grad(x)
        path.append(x.copy())
    return np.array(path)

def lemma_bound(fx, g, t, L):
    return fx - t * (1 - L * t / 2) * float(g @ g)`;

const BT = `import numpy as np

def backtrack(f, grad, x, t0=1.0, beta=0.5, alpha=0.3):
    g = grad(x)
    t = t0
    while f(x - t * g) > f(x) - alpha * t * float(g @ g):
        t *= beta
    return t

def gd_backtrack(f, grad, x0, iters):
    x = np.array(x0, dtype=float)
    steps = []
    for _ in range(iters):
        t = backtrack(f, grad, x)
        steps.append(t)
        x = x - t * grad(x)
    return x, steps`;

export const lesson: LessonContent = {
  id: "m10.5.1",
  minutes: 45,
  links: {
    requires: ["m10.2.2"],
    revisits: ["m10.2.3"],
    foreshadows: ["m10.5.2", "m10.5.3"],
  },

  puzzle: (
    <>
      <p>
        Gradient descent says: step against the gradient. But how far? Too short and you crawl; too long and you can jump
        past the minimum and land higher than you started. Is there a step size that is guaranteed to make progress, and how
        much progress, without knowing where the minimum is?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If the gradient cannot change too quickly, the function cannot curve upward faster than some parabola. That
        parabola, built at the current point, is an upper bound on the function everywhere. Minimising the parabola is
        easy, and since the function sits below it, the function goes down at least as much as the parabola does. This is
        the descent lemma, and it turns a vague hope into a concrete amount of guaranteed progress per step.
      </p>
      <DescentLemmaViz />
    </>
  ),

  theory: (
    <>
      <Definition title="L-smooth function and gradient descent">
        <p>
          A differentiable function f is L-smooth if its gradient is L-Lipschitz:{" "}
          <M>{"\\|\\nabla f(x) - \\nabla f(y)\\| \\leq L\\|x - y\\|"}</M> for all x, y. For twice differentiable f this holds
          exactly when every eigenvalue of the Hessian has absolute value at most L. Gradient descent with step size t
          &gt; 0 is the iteration
        </p>
        <MD>{"x_{k+1} = x_k - t\\nabla f(x_k)."}</MD>
      </Definition>

      <Theorem title="descent lemma">
        <p>If f is L-smooth, then for all x and y,</p>
        <MD>{"f(y) \\leq f(x) + \\nabla f(x)^\\top(y - x) + \\frac{L}{2}\\|y - x\\|^2."}</MD>
      </Theorem>
      <Proof>
        <p>By the fundamental theorem of calculus along the segment from x to y,</p>
        <MD>{"f(y) - f(x) - \\nabla f(x)^\\top(y - x) = \\int_0^1 \\big(\\nabla f(x + s(y - x)) - \\nabla f(x)\\big)^\\top(y - x)\\,ds."}</MD>
        <p>
          By Cauchy–Schwarz and the Lipschitz bound, the integrand is at most{" "}
          <M>{"Ls\\|y - x\\|^2"}</M>, and <M>{"\\int_0^1 Ls\\,ds = L/2"}</M>. Convexity is not used.
        </p>
      </Proof>

      <Theorem title="guaranteed decrease">
        <p>
          Put <M>{"y = x - t\\nabla f(x)"}</M>. Then{" "}
          <M>{"f(y) \\leq f(x) - t(1 - Lt/2)\\|\\nabla f(x)\\|^2"}</M>. For <M>{"0 < t < 2/L"}</M> this is a strict decrease
          unless <M>{"\\nabla f(x) = 0"}</M>; the bound is best at t = 1/L, giving{" "}
          <M>{"f(y) \\leq f(x) - \\|\\nabla f(x)\\|^2/(2L)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Substitute into the descent lemma: the linear term is <M>{"-t\\|\\nabla f(x)\\|^2"}</M> and the quadratic term is{" "}
          <M>{"\\frac{L}{2}t^2\\|\\nabla f(x)\\|^2"}</M>. The coefficient <M>{"t - Lt^2/2"}</M> is a downward parabola in t,
          positive on (0, 2/L) and largest at t = 1/L, where it equals 1/(2L).
        </p>
        <Code>{GD}</Code>
      </Proof>

      <Theorem title="stationarity after k steps">
        <p>
          If f is L-smooth and bounded below by <M>{"f^*"}</M>, gradient descent with t = 1/L satisfies{" "}
          <M>{"\\min_{i < k}\\|\\nabla f(x_i)\\|^2 \\leq 2L(f(x_0) - f^*)/k"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Sum the guaranteed decrease over i = 0, …, k − 1. The left side telescopes to{" "}
          <M>{"f(x_0) - f(x_k) \\leq f(x_0) - f^*"}</M>, and the right side is at least k/(2L) times the smallest squared
          gradient norm. This needs no convexity; for convex f, a small gradient means near-optimal, which the next
          lessons make quantitative.
        </p>
      </Proof>

      <Remark title="backtracking when L is unknown">
        <p>
          Backtracking line search starts from a trial step <M>{"t_0"}</M> and multiplies it by β ∈ (0, 1) until the
          sufficient decrease condition <M>{"f(x - t\\nabla f(x)) \\leq f(x) - \\alpha t\\|\\nabla f(x)\\|^2"}</M> holds, with
          α ≤ 1/2. Any t ≤ 1/L passes, since then <M>{"t(1 - Lt/2) \\geq t/2 \\geq \\alpha t"}</M>, so the search stops
          with <M>{"t \\geq \\min(t_0, \\beta/L)"}</M> and the same rate holds with L replaced by{" "}
          <M>{"\\max(1/t_0, L/\\beta)"}</M>. In the code, f(x) = ½xᵀQx with Q = diag(1, 4) is 4-smooth; from (1, 1) the
          step t = 1/4 gives value 0.28125, below the promised 0.375. The step t = 1/2 = 2/L carries no guarantee, and
          the value 2.125 is only slightly below the starting 2.5. On log cosh x₁ + x₂² from (2, 1), backtracking halves the
          first step to 0.5 (the full step only flips the sign of x₂) and then accepts t = 1.
        </p>
        <Code>{BT}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dec",
      rung: "check",
      prompt: <p>f is 4-smooth and ‖∇f(x)‖ = 2. With step t = 1/L, how much does the descent lemma guarantee f decreases?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "tmax",
      rung: "check",
      prompt: <p>f is 5-smooth. Below what step size does the descent lemma guarantee a strict decrease whenever ∇f(x) ≠ 0?</p>,
      answer: { kind: "numeric", value: 0.4, tolerance: 0.0001 },
    },
    {
      key: "nonconvex",
      rung: "apply",
      prompt: <p>f is L-smooth and bounded below but not convex. What does gradient descent with t = 1/L guarantee?</p>,
      answer: {
        kind: "choice",
        options: [
          "The smallest gradient norm among the first k iterates is O(1/√k)",
          "The iterates converge to a global minimiser",
          "f(x_k) − f* is O(1/k)",
          "Nothing, since the descent lemma needs convexity",
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

def gd(grad, x0, t, iters):
    x = np.array(x0, dtype=float)
    path = [x.copy()]
    for _ in range(iters):
        x = x - t * grad(x)
        path.append(x.copy())
    return np.array(path)

def lemma_bound(fx, g, t, L):
    return fx - t * (1 - L * t / 2) * float(g @ g)

Q = np.diag([1.0, 4.0]); f = lambda x: 0.5 * x @ Q @ x; grad = lambda x: Q @ x
p = gd(grad, [1.0, 1.0], 0.25, 3)
print(p[-1].tolist(), f(p[1]))
b = lemma_bound(f(p[0]), grad(p[0]), 0.25, 4.0)
print(b, f(p[1]) <= b, f(gd(grad, [1.0, 1.0], 0.5, 1)[-1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.421875, 0.0] 0.28125\n0.375 True 2.125", "[0.421875, 0.0] 0.28125\n0.375 False 2.125", "[0.421875, 0.421875] 0.28125\n0.375 True 2.125", "[0.421875, 0.0] 0.375\n0.28125 True 2.5"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def backtrack(f, grad, x, t0=1.0, beta=0.5, alpha=0.3):
    g = grad(x)
    t = t0
    while f(x - t * g) > f(x) - alpha * t * float(g @ g):
        t *= beta
    return t

def gd_backtrack(f, grad, x0, iters):
    x = np.array(x0, dtype=float)
    steps = []
    for _ in range(iters):
        t = backtrack(f, grad, x)
        steps.append(t)
        x = x - t * grad(x)
    return x, steps

f2 = lambda x: float(np.log(np.exp(x[0]) + np.exp(-x[0])) + x[1] ** 2)
g2 = lambda x: np.array([np.tanh(x[0]), 2 * x[1]])
x, steps = gd_backtrack(f2, g2, [2.0, 1.0], 4)
print(steps, np.round(x, 4).tolist())
print(backtrack(f2, g2, np.array([0.0, 1.0])), backtrack(f2, g2, np.array([1.0, 0.0])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.5, 1.0, 1.0, 1.0] [0.0001, 0.0]\n0.5 1.0", "[1.0, 1.0, 1.0, 1.0] [0.0001, 0.0]\n0.5 1.0", "[0.5, 1.0, 1.0, 1.0] [0.0001, 0.0]\n1.0 1.0", "[0.5, 0.5, 0.5, 0.5] [0.1196, 0.0]\n0.5 0.5"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gd(grad, x0, t, iters)</C>, returning the array of all iterates including x₀, and{" "}
          <C>lemma_bound(fx, g, t, L)</C>, the descent lemma&apos;s upper bound on f after one step of size t from a point
          with value fx and gradient g.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gd(grad, x0, t, iters):
    return np.array([x0])

def lemma_bound(fx, g, t, L):
    return fx
`,
        solution: GD,
        tests: [
          { name: "path", code: `p = gd(lambda x: 2 * x, [1.0], 0.25, 2)
assert p.shape == (3, 1) and np.allclose(p[:, 0], [1.0, 0.5, 0.25])` },
          { name: "bound", code: `Q = np.diag([2.0, 6.0]); f = lambda x: 0.5 * x @ Q @ x
x = np.array([1.0, -1.0]); g = Q @ x
for t in [0.05, 1 / 6, 0.3]:
    y = gd(lambda z: Q @ z, x, t, 1)[-1]
    assert f(y) <= lemma_bound(f(x), g, t, 6.0) + 1e-12
assert abs(lemma_bound(4.0, g, 1 / 6, 6.0) - (4.0 - 40 / 12)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>backtrack(f, grad, x, t0=1.0, beta=0.5, alpha=0.3)</C>, which shrinks t by β until the sufficient decrease
          condition holds, and <C>gd_backtrack(f, grad, x0, iters)</C>, returning the final iterate and the list of steps
          used.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def backtrack(f, grad, x, t0=1.0, beta=0.5, alpha=0.3):
    return t0

def gd_backtrack(f, grad, x0, iters):
    return np.array(x0, dtype=float), []
`,
        solution: BT,
        tests: [
          { name: "step", code: `f = lambda x: 5.0 * float(x @ x); g = lambda x: 10.0 * x
t = backtrack(f, g, np.array([1.0, 2.0]))
assert abs(t - 0.125) < 1e-12` },
          { name: "run", code: `Q = np.diag([1.0, 9.0]); f = lambda x: 0.5 * float(x @ Q @ x); g = lambda x: Q @ x
x, steps = gd_backtrack(f, g, [1.0, 1.0], 60)
assert len(steps) == 60 and min(steps) >= 0.5 / 9 and f(x) < 1e-6` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove the descent lemma: if ∇f is L-Lipschitz, then f(y) ≤ f(x) + ∇f(x)ᵀ(y − x) + (L/2)‖y − x‖² for all x, y.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes f(y) − f(x) as the integral of ∇f(x + s(y − x))ᵀ(y − x) over s ∈ [0, 1] and subtracts ∇f(x)ᵀ(y − x).",
          "Bounds the integrand (∇f(x + s(y − x)) − ∇f(x))ᵀ(y − x) by Ls‖y − x‖² using Cauchy–Schwarz and the Lipschitz condition.",
          "Integrates Ls from 0 to 1 to get the factor L/2, giving the stated inequality.",
        ],
      },
    },
    {
      key: "osc",
      rung: "stretch",
      prompt: <p>Run gradient descent on f(x) = 2x² from x₀ = 1 with step t = 0.4. What is x₃?</p>,
      answer: { kind: "numeric", value: -0.216, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what L-smoothness means, why it puts a parabola above the function at every point, how that gives a guaranteed decrease for each gradient step, why t = 1/L is the natural step, and how backtracking finds a good step without knowing L.",

  glimpse: (
    <>
      <p>
        Smoothness bounds the curvature from above. The next lesson adds the matching bound from below, strong convexity,
        and shows how the two together pin a function between two parabolas.
      </p>
    </>
  ),
};
