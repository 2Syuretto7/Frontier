import { M, MD } from "@/components/Math";
import { Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RateCompareViz } from "@/components/viz/RateCompareViz";
import type { LessonContent } from "@/lib/types";

const GAPS = `import numpy as np

def gaps(f, grad, x0, t, iters, fstar):
    x = np.array(x0, dtype=float)
    out = [f(x) - fstar]
    for _ in range(iters):
        x = x - t * grad(x)
        out.append(f(x) - fstar)
    return np.array(out)

def sublinear_bound(L, r0, k):
    return L * r0 ** 2 / (2 * k)

def linear_bound(kappa, gap0, k):
    return (1 - 1 / kappa) ** k * gap0`;

const ITERS = `import math

def iters_sublinear(L, r0, eps):
    return math.ceil(L * r0 ** 2 / (2 * eps))

def iters_linear(kappa, gap0, eps):
    return math.ceil(math.log(gap0 / eps) / -math.log(1 - 1 / kappa))`;

export const lesson: LessonContent = {
  id: "m10.5.3",
  minutes: 45,
  links: {
    requires: ["m10.5.1", "m10.5.2"],
    revisits: ["m10.2.2"],
    foreshadows: ["m10.5.4", "m10.6.2"],
  },

  puzzle: (
    <>
      <p>
        You need the optimal value to within 10⁻⁶. One method promises an error of at most 1/k after k steps; another
        promises 0.9ᵏ. The first needs a million steps. How many does the second need, and why should the same algorithm,
        gradient descent, obey one promise on some functions and the other on others?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each gradient step removes a fixed fraction of the squared gradient. If the function is merely smooth and convex,
        the gradient can shrink as you approach the minimum, so the steps get less and less productive: the error falls
        like 1/k. If the function is also strongly convex, the gradient can never be small while the error is large, so
        every step removes a fixed fraction of the error itself, and the error falls geometrically.
      </p>
      <RateCompareViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="smooth convex: rate 1/k">
        <p>
          Let f be convex and L-smooth with a minimiser x*. Gradient descent with t = 1/L satisfies
        </p>
        <MD>{"f(x_k) - f^* \\leq \\frac{L\\|x_0 - x^*\\|^2}{2k}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Write g = ∇f(x) and <M>{"x^+ = x - g/L"}</M>. The descent lemma gives{" "}
          <M>{"f(x^+) \\leq f(x) - \\|g\\|^2/(2L)"}</M>, and convexity gives{" "}
          <M>{"f(x) \\leq f^* + g^\\top(x - x^*)"}</M>. Adding,
        </p>
        <MD>{"f(x^+) - f^* \\leq g^\\top(x - x^*) - \\frac{\\|g\\|^2}{2L} = \\frac{L}{2}\\left(\\|x - x^*\\|^2 - \\|x^+ - x^*\\|^2\\right),"}</MD>
        <p>
          by expanding <M>{"\\|x - x^* - g/L\\|^2"}</M>. Summing over the first k steps telescopes to at most{" "}
          <M>{"\\frac{L}{2}\\|x_0 - x^*\\|^2"}</M>. The values <M>{"f(x_i)"}</M> decrease, so k times the last gap is at most
          the sum of the gaps.
        </p>
        <Code>{GAPS}</Code>
      </Proof>

      <Theorem title="smooth and strongly convex: linear rate">
        <p>If f is also μ-strongly convex, gradient descent with t = 1/L satisfies</p>
        <MD>{"f(x_k) - f^* \\leq \\left(1 - \\frac{1}{\\kappa}\\right)^k (f(x_0) - f^*), \\qquad \\kappa = L/\\mu."}</MD>
      </Theorem>
      <Proof>
        <p>
          The descent lemma and the PL inequality <M>{"\\|g\\|^2 \\geq 2\\mu(f(x) - f^*)"}</M> give
        </p>
        <MD>{"f(x^+) - f^* \\leq f(x) - f^* - \\frac{\\|g\\|^2}{2L} \\leq \\left(1 - \\frac{\\mu}{L}\\right)(f(x) - f^*)."}</MD>
        <p>Apply this k times. Only the PL inequality was used, so the rate holds for any L-smooth f satisfying it.</p>
      </Proof>

      <Remark title="iteration counts">
        <p>
          To reach accuracy ε, the first bound needs about <M>{"LR^2/(2\\varepsilon)"}</M> steps, where{" "}
          <M>{"R = \\|x_0 - x^*\\|"}</M>; halving ε doubles the work. The second needs about{" "}
          <M>{"\\kappa\\log((f(x_0) - f^*)/\\varepsilon)"}</M> steps, since <M>{"-\\log(1 - 1/\\kappa) \\geq 1/\\kappa"}</M>; each
          extra digit of accuracy costs the same fixed number of steps, about κ log 10. This is called linear convergence,
          because the log of the error falls linearly. In the code, diag(1, 10) with t = 1/10 stays under its (0.9)ᵏ
          bound, and in fact gains the factor 0.81 per step because the starting point lies along an eigenvector after one
          step. On x⁴/4, which is not strongly convex, 40 steps leave a gap of 0.000285, inside the 1/k bound of 0.0375 but
          far from geometric. With κ = 10, going from 10⁻³ to 10⁻⁶ costs another 66 steps, the same as the first three
          digits did.
        </p>
        <Code>{ITERS}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sub",
      rung: "check",
      prompt: <p>f is convex and 2-smooth, and ‖x₀ − x*‖ = 3. How many steps of gradient descent with t = 1/L does the 1/k bound require to guarantee f(x_k) − f* ≤ 0.01?</p>,
      answer: { kind: "numeric", value: 900, tolerance: 0.5 },
    },
    {
      key: "lin",
      rung: "check",
      prompt: <p>f has κ = 4 and f(x₀) − f* = 8. What is the linear-rate bound on f(x₂) − f* for gradient descent with t = 1/L?</p>,
      answer: { kind: "numeric", value: 4.5, tolerance: 0.0001 },
    },
    {
      key: "double",
      rung: "apply",
      prompt: <p>For smooth strongly convex problems, roughly what happens to the number of gradient descent steps needed for a fixed accuracy when κ doubles?</p>,
      answer: {
        kind: "choice",
        options: ["It roughly doubles", "It roughly squares", "It increases by about log 2", "It does not change"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def gaps(f, grad, x0, t, iters, fstar):
    x = np.array(x0, dtype=float)
    out = [f(x) - fstar]
    for _ in range(iters):
        x = x - t * grad(x)
        out.append(f(x) - fstar)
    return np.array(out)

def sublinear_bound(L, r0, k):
    return L * r0 ** 2 / (2 * k)

def linear_bound(kappa, gap0, k):
    return (1 - 1 / kappa) ** k * gap0

Q = np.diag([1.0, 10.0]); f = lambda x: 0.5 * float(x @ Q @ x); grad = lambda x: Q @ x
g = gaps(f, grad, [1.0, 1.0], 0.1, 20, 0.0)
print(g[0], round(g[10], 4), bool(np.all(g[1:] <= linear_bound(10.0, g[0], np.arange(1, 21)))))
h = gaps(lambda x: float(x[0] ** 4) / 4, lambda x: x ** 3, [1.0], 1 / 3, 40, 0.0)
print(round(h[40], 6), round(sublinear_bound(3.0, 1.0, 40), 4), round(g[11] / g[10], 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["5.5 0.0608 True\n0.000285 0.0375 0.81", "5.5 0.0608 False\n0.000285 0.0375 0.81", "5.5 0.0608 True\n0.000285 0.0375 0.9", "5.5 1.9175 True\n0.0375 0.000285 0.81"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def iters_sublinear(L, r0, eps):
    return math.ceil(L * r0 ** 2 / (2 * eps))

def iters_linear(kappa, gap0, eps):
    return math.ceil(math.log(gap0 / eps) / -math.log(1 - 1 / kappa))

print(iters_sublinear(1.0, 1.0, 1e-3), iters_linear(10.0, 1.0, 1e-3), iters_linear(100.0, 1.0, 1e-3))
print(iters_linear(10.0, 1.0, 1e-6) - iters_linear(10.0, 1.0, 1e-3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["500 66 688\n66", "500 66 688\n132", "1000 66 688\n66", "500 69 691\n66"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gaps(f, grad, x0, t, iters, fstar)</C>, returning the array of iters + 1 gaps f(x_k) − f* along the
          gradient descent path, <C>sublinear_bound(L, r0, k)</C>, and <C>linear_bound(kappa, gap0, k)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gaps(f, grad, x0, t, iters, fstar):
    return np.zeros(iters + 1)

def sublinear_bound(L, r0, k):
    return 0.0

def linear_bound(kappa, gap0, k):
    return 0.0
`,
        solution: GAPS,
        tests: [
          { name: "lin", code: `Q = np.diag([2.0, 6.0]); f = lambda x: 0.5 * float(x @ Q @ x)
g = gaps(f, lambda x: Q @ x, [1.0, -2.0], 1 / 6, 30, 0.0)
assert len(g) == 31 and abs(g[0] - 13.0) < 1e-12 and np.all(g <= linear_bound(3.0, g[0], np.arange(31)) + 1e-12)` },
          { name: "sub", code: `h = gaps(lambda x: float(x[0] ** 4) / 4, lambda x: x ** 3, [1.0], 1 / 3, 100, 0.0)
assert all(h[k] <= sublinear_bound(3.0, 1.0, k) for k in range(1, 101)) and abs(sublinear_bound(2.0, 3.0, 900) - 0.01) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>iters_sublinear(L, r0, eps)</C> and <C>iters_linear(kappa, gap0, eps)</C>, the smallest whole number of
          steps for which the corresponding bound is at most eps.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def iters_sublinear(L, r0, eps):
    return 0

def iters_linear(kappa, gap0, eps):
    return 0
`,
        solution: ITERS,
        tests: [
          { name: "sub", code: `assert iters_sublinear(2.0, 3.0, 0.01) == 900 and iters_sublinear(1.0, 1.0, 0.3) == 2` },
          { name: "lin", code: `k = iters_linear(4.0, 8.0, 0.01)
assert 0.75 ** k * 8.0 <= 0.01 < 0.75 ** (k - 1) * 8.0` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let f be L-smooth and μ-strongly convex. Prove that gradient descent with t = 1/L satisfies f(x_k) − f* ≤ (1 −
          μ/L)ᵏ(f(x₀) − f*).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses the descent lemma at t = 1/L to get f(x_{k+1}) ≤ f(x_k) − ‖∇f(x_k)‖²/(2L).",
          "Uses the PL inequality ‖∇f(x)‖² ≥ 2μ(f(x) − f*) from strong convexity to replace the gradient term.",
          "Concludes f(x_{k+1}) − f* ≤ (1 − μ/L)(f(x_k) − f*) and iterates by induction.",
        ],
      },
    },
    {
      key: "run5",
      rung: "stretch",
      prompt: <p>Gradient descent on f(x, y) = (x² + 4y²)/2 with t = 1/4, starting from (1, 0). What is f after 5 steps?</p>,
      answer: { kind: "numeric", value: 0.028157, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why gradient descent on a smooth convex function has error O(1/k), why adding strong convexity makes the error fall geometrically like (1 − 1/κ)ᵏ, and what each rate means for the cost of one more digit of accuracy.",

  glimpse: (
    <>
      <p>
        The linear rate degrades as κ grows. The next lesson looks at what a large condition number does geometrically:
        long narrow valleys, and a gradient that points across them instead of along them.
      </p>
    </>
  ),
};
