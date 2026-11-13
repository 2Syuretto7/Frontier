import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DampedNewtonViz } from "@/components/viz/DampedNewtonViz";
import type { LessonContent } from "@/lib/types";

const NT = `import numpy as np

def newton(grad, hess, x0, iters, tol=1e-12):
    x = np.array(x0, dtype=float)
    path = [x.copy()]
    for _ in range(iters):
        g = grad(x)
        dx = np.linalg.solve(hess(x), -g)
        if -(g @ dx) / 2 <= tol:
            break
        x = x + dx
        path.append(x.copy())
    return np.array(path)

def decrement(grad, hess, x):
    g = grad(x)
    return float(np.sqrt(g @ np.linalg.solve(hess(x), g)))`;

const DN = `import numpy as np

def damped_newton(f, grad, hess, x0, iters, alpha=0.25, beta=0.5):
    x = np.array(x0, dtype=float)
    steps = []
    for _ in range(iters):
        g = grad(x)
        dx = np.linalg.solve(hess(x), -g)
        t = 1.0
        while f(x + t * dx) > f(x) + alpha * t * (g @ dx):
            t *= beta
        steps.append(t)
        x = x + t * dx
    return x, steps`;

export const lesson: LessonContent = {
  id: "m10.6.3",
  minutes: 50,
  links: {
    requires: ["m10.5.4", "m10.5.2"],
    revisits: ["m10.2.2"],
    foreshadows: ["m10.6.4"],
  },

  puzzle: (
    <>
      <p>
        Gradient descent on a valley with condition number a million needs millions of steps, and even Nesterov needs
        thousands. Yet there is a method that solves any strictly convex quadratic, however badly conditioned, in exactly one
        step, and that gains about twice as many correct digits with every step near the solution of a general smooth
        problem. What does it know that gradient methods do not, and why can it still fly off to infinity on a function as
        tame as √(1 + x²)?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Gradient descent uses a linear model of f and a step size to keep it honest. Newton&apos;s method uses the
        quadratic model, the second-order Taylor expansion, and jumps straight to its minimum. The Hessian in that model
        rescales every direction by its own curvature, which is exactly the change of coordinates that turns narrow valleys
        round. Close to the minimum the quadratic model is nearly exact, so the step is nearly perfect; far from it the model
        can be wildly wrong, and a line search is needed to stop overshooting.
      </p>
      <DampedNewtonViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Newton step and decrement">
        <p>For twice differentiable f with positive definite Hessian at x, the Newton step is</p>
        <MD>{"\\Delta x = -\\nabla^2 f(x)^{-1}\\nabla f(x),"}</MD>
        <p>
          the minimiser of the model <M>{"\\hat f(x + v) = f(x) + \\nabla f(x)^\\top v + \\frac12 v^\\top\\nabla^2 f(x)v"}</M>.
          The Newton decrement is <M>{"\\lambda(x) = (\\nabla f(x)^\\top\\nabla^2 f(x)^{-1}\\nabla f(x))^{1/2}"}</M>, and{" "}
          <M>{"f(x) - \\inf_v \\hat f(x + v) = \\lambda(x)^2/2"}</M>, the predicted decrease, which makes{" "}
          <M>{"\\lambda^2/2 \\leq \\varepsilon"}</M> a natural stopping rule. Pure Newton takes{" "}
          <M>{"x^+ = x + \\Delta x"}</M>; damped Newton takes <M>{"x^+ = x + t\\Delta x"}</M> with t from backtracking.
        </p>
      </Definition>

      <Theorem title="affine invariance">
        <p>
          If A is invertible and g(y) = f(Ay), then Newton&apos;s method on g from <M>{"y_0"}</M> produces iterates with{" "}
          <M>{"Ay_k = x_k"}</M>, the iterates of Newton on f from <M>{"x_0 = Ay_0"}</M>. So the condition number of the
          problem does not affect it.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\nabla g(y) = A^\\top\\nabla f(Ay)"}</M> and <M>{"\\nabla^2 g(y) = A^\\top\\nabla^2 f(Ay)A"}</M>, so the step
          for g is <M>{"-A^{-1}\\nabla^2 f(Ay)^{-1}A^{-\\top}A^\\top\\nabla f(Ay) = A^{-1}\\Delta x"}</M>. Induct on k.
        </p>
      </Proof>

      <Theorem title="local quadratic convergence">
        <p>
          Suppose <M>{"\\nabla f(x^*) = 0"}</M>, <M>{"\\nabla^2 f \\succeq \\mu I"}</M> near x*, and the Hessian is
          M-Lipschitz: <M>{"\\|\\nabla^2 f(x) - \\nabla^2 f(y)\\| \\leq M\\|x - y\\|"}</M>. Then a pure Newton step satisfies
        </p>
        <MD>{"\\|x^+ - x^*\\| \\leq \\frac{M}{2\\mu}\\|x - x^*\\|^2."}</MD>
      </Theorem>
      <Proof>
        <p>Write H = ∇²f(x) and e = x − x*. Since ∇f(x*) = 0,</p>
        <MD>{"x^+ - x^* = e - H^{-1}\\nabla f(x) = H^{-1}\\int_0^1 \\big(H - \\nabla^2 f(x^* + se)\\big)e\\,ds,"}</MD>
        <p>
          using <M>{"\\nabla f(x) - \\nabla f(x^*) = \\int_0^1 \\nabla^2 f(x^* + se)e\\,ds"}</M>. The integrand has norm at most{" "}
          <M>{"M(1 - s)\\|e\\|^2"}</M>, which integrates to <M>{"M\\|e\\|^2/2"}</M>, and{" "}
          <M>{"\\|H^{-1}\\| \\leq 1/\\mu"}</M>. Once <M>{"\\|e\\| < \\mu/M"}</M>, the error at least halves and then squares
          each step: the number of correct digits roughly doubles.
        </p>
        <Code>{NT}</Code>
      </Proof>

      <Remark title="two phases and the cost">
        <p>
          With backtracking along the Newton direction, a strongly convex f with Lipschitz Hessian is minimised in two
          phases: a damped phase in which f decreases by a fixed amount per step, and then a quadratically convergent phase in
          which t = 1 is always accepted. The total count is a constant plus about log log(1/ε), in practice rarely more than
          a few dozen. The price is forming the Hessian and solving an n × n system per step, O(n³) work with dense linear
          algebra. In the code, a sum of three exponentials is minimised in 4 steps, with decrements 0.7, 0.1, 6 × 10⁻³,
          10⁻⁵, 4 × 10⁻¹¹. For √(1 + x²), pure Newton maps x to −x³, converging from 0.5 and exploding from 2; with
          backtracking, the first step from 2 is cut to t = 0.25, landing at −0.5, after which full steps are accepted.
        </p>
        <Code>{DN}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "step",
      rung: "check",
      prompt: <p>Minimise f(x) = x⁴/4. Starting from x = 2, where does one pure Newton step land?</p>,
      answer: { kind: "numeric", value: 1.333333, tolerance: 0.0001 },
    },
    {
      key: "dec",
      rung: "check",
      prompt: <p>f(x) = ½xᵀQx with Q = diag(1, 4), at x = (2, 1). What is the squared Newton decrement λ(x)²?</p>,
      answer: { kind: "numeric", value: 8, tolerance: 0.0001 },
    },
    {
      key: "affine",
      rung: "apply",
      prompt: <p>Why is Newton&apos;s method unaffected by the condition number, unlike gradient descent?</p>,
      answer: {
        kind: "choice",
        options: [
          "It is affine invariant: after any invertible change of variables its iterates map exactly to those on the original problem",
          "Its step size is chosen by exact line search",
          "It uses momentum to damp oscillations across the valley",
          "The Hessian of every convex function has condition number 1",
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

def newton(grad, hess, x0, iters, tol=1e-12):
    x = np.array(x0, dtype=float)
    path = [x.copy()]
    for _ in range(iters):
        g = grad(x)
        dx = np.linalg.solve(hess(x), -g)
        if -(g @ dx) / 2 <= tol:
            break
        x = x + dx
        path.append(x.copy())
    return np.array(path)

def decrement(grad, hess, x):
    g = grad(x)
    return float(np.sqrt(g @ np.linalg.solve(hess(x), g)))

M = np.array([[1.0, 3.0], [1.0, -3.0], [-1.0, 0.0]]); c = lambda x: np.exp(M @ x - 0.1)
grad = lambda x: M.T @ c(x); hess = lambda x: M.T @ np.diag(c(x)) @ M
p = newton(grad, hess, [-0.5, 0.2], 20)
print(len(p) - 1, (np.round(p[-1], 4) + 0.0).tolist())
print([f"{decrement(grad, hess, x):.0e}" for x in p[:5]])
f = lambda x: float(np.sqrt(1 + x @ x)); grad = lambda x: x / np.sqrt(1 + x @ x)
hess = lambda x: (np.eye(len(x)) * (1 + x @ x) - np.outer(x, x)) / (1 + x @ x) ** 1.5
print([f"{v:.3g}" for v in newton(grad, hess, [0.5], 3)[:, 0]], [f"{v:.3g}" for v in newton(grad, hess, [2.0], 3)[:, 0]])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["4 [-0.3466, 0.0]\n['7e-01', '1e-01', '6e-03', '1e-05', '4e-11']\n['0.5', '-0.125', '0.00195', '-7.45e-09'] ['2', '-8', '512', '-1.34e+08']", "20 [-0.3466, 0.0]\n['7e-01', '1e-01', '6e-03', '1e-05', '4e-11']\n['0.5', '-0.125', '0.00195', '-7.45e-09'] ['2', '-8', '512', '-1.34e+08']", "4 [-0.3466, 0.0]\n['7e-01', '4e-01', '2e-01', '1e-01', '5e-02']\n['0.5', '-0.125', '0.00195', '-7.45e-09'] ['2', '-8', '512', '-1.34e+08']", "4 [-0.3466, 0.0]\n['7e-01', '1e-01', '6e-03', '1e-05', '4e-11']\n['0.5', '0.125', '0.00195', '7.45e-09'] ['2', '8', '512', '1.34e+08']"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def damped_newton(f, grad, hess, x0, iters, alpha=0.25, beta=0.5):
    x = np.array(x0, dtype=float)
    steps = []
    for _ in range(iters):
        g = grad(x)
        dx = np.linalg.solve(hess(x), -g)
        t = 1.0
        while f(x + t * dx) > f(x) + alpha * t * (g @ dx):
            t *= beta
        steps.append(t)
        x = x + t * dx
    return x, steps

f = lambda x: float(np.sqrt(1 + x @ x)); grad = lambda x: x / np.sqrt(1 + x @ x)
hess = lambda x: (np.eye(len(x)) * (1 + x @ x) - np.outer(x, x)) / (1 + x @ x) ** 1.5
x, steps = damped_newton(f, grad, hess, [2.0], 6)
print(steps, round(float(x[0]), 6) + 0.0)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.25, 1.0, 1.0, 1.0, 1.0, 1.0] 0.0", "[1.0, 1.0, 1.0, 1.0, 1.0, 1.0] 0.0", "[0.5, 0.5, 1.0, 1.0, 1.0, 1.0] 0.0", "[0.25, 1.0, 1.0, 1.0, 1.0, 1.0] -0.5"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>newton(grad, hess, x0, iters, tol=1e-12)</C>, returning the array of iterates of pure Newton and stopping
          once λ²/2 ≤ tol, and <C>decrement(grad, hess, x)</C>, the Newton decrement λ(x).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def newton(grad, hess, x0, iters, tol=1e-12):
    return np.array([x0], dtype=float)

def decrement(grad, hess, x):
    return 0.0
`,
        solution: NT,
        tests: [
          { name: "quad", code: `Q = np.array([[1000.0, 1.0], [1.0, 0.001 + 1 / 1000.0]]); b = np.array([1.0, 2.0])
p = newton(lambda x: Q @ x - b, lambda x: Q, [5.0, -5.0], 10)
assert len(p) == 2 and np.allclose(Q @ p[1], b)
assert abs(decrement(lambda x: np.diag([1.0, 4.0]) @ x, lambda x: np.diag([1.0, 4.0]), np.array([2.0, 1.0])) ** 2 - 8.0) < 1e-12` },
          { name: "quadconv", code: `p = newton(lambda x: np.exp(x) - 2, lambda x: np.diag(np.exp(x)), [0.0], 10)
e = np.abs(p[:, 0] - np.log(2))
assert 4 <= len(p) <= 7 and e[-1] < 1e-6 and e[3] < e[2] ** 2 and e[2] < 0.5 * e[1] ** 2 + 1e-15` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>damped_newton(f, grad, hess, x0, iters, alpha=0.25, beta=0.5)</C>: at each step compute the Newton
          direction, backtrack from t = 1 until f(x + tΔx) ≤ f(x) + αt∇f(x)ᵀΔx, and return the final x and the list of
          accepted t.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def damped_newton(f, grad, hess, x0, iters, alpha=0.25, beta=0.5):
    return np.array(x0, dtype=float), []
`,
        solution: DN,
        tests: [
          { name: "huber", code: `f = lambda x: float(np.sqrt(1 + x @ x)); g = lambda x: x / np.sqrt(1 + x @ x)
h = lambda x: (np.eye(len(x)) * (1 + x @ x) - np.outer(x, x)) / (1 + x @ x) ** 1.5
x, ts = damped_newton(f, g, h, [3.0, -4.0], 12)
assert np.linalg.norm(x) < 1e-8 and ts[0] < 1 and ts[-1] == 1.0 and len(ts) == 12` },
          { name: "quad", code: `Q = np.diag([1.0, 100.0]); x, ts = damped_newton(lambda x: 0.5 * float(x @ Q @ x), lambda x: Q @ x, lambda x: Q, [1.0, 1.0], 2)
assert ts == [1.0, 1.0] and np.allclose(x, 0.0)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Suppose ∇f(x*) = 0, ∇²f(x) ⪰ μI, and ∇²f is M-Lipschitz. Prove that a pure Newton step from x satisfies ‖x⁺ − x*‖ ≤
          (M/(2μ))‖x − x*‖².
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes x⁺ − x* = H⁻¹(H e − (∇f(x) − ∇f(x*))) with H = ∇²f(x) and e = x − x*.",
          "Expresses ∇f(x) − ∇f(x*) as ∫₀¹ ∇²f(x* + se)e ds and bounds ‖H − ∇²f(x* + se)‖ ≤ M(1 − s)‖e‖.",
          "Integrates to get M‖e‖²/2 and uses ‖H⁻¹‖ ≤ 1/μ to conclude.",
        ],
      },
    },
    {
      key: "cube",
      rung: "stretch",
      prompt: <p>Pure Newton on f(x) = √(1 + x²) from x₀ = 0.9. What is x₃?</p>,
      answer: { kind: "numeric", value: -0.05815, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how a Newton step minimises the local quadratic model, why it is unaffected by changes of coordinates, why the error squares near the minimum, why pure Newton can diverge far away, and how backtracking fixes that at the cost of an extra phase.",

  glimpse: (
    <>
      <p>
        Newton&apos;s per-step cost, a Hessian and a linear solve, is prohibitive for large n. Quasi-Newton methods build an
        approximation to the inverse Hessian from gradient differences alone, keeping much of Newton&apos;s speed at the
        cost of gradient descent.
      </p>
    </>
  ),
};
