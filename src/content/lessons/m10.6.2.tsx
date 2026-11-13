import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { NesterovViz } from "@/components/viz/NesterovViz";
import type { LessonContent } from "@/lib/types";

const NV = `import numpy as np

def nesterov(grad, x0, L, iters):
    x = np.array(x0, dtype=float)
    prev = x.copy()
    path = [x.copy()]
    for k in range(iters):
        y = x + (k - 1) / (k + 2) * (x - prev)
        prev, x = x, y - grad(y) / L
        path.append(x.copy())
    return np.array(path)

def nesterov_sc(grad, x0, L, mu, iters):
    q = np.sqrt(L / mu)
    beta = (q - 1) / (q + 1)
    x = np.array(x0, dtype=float)
    prev = x.copy()
    for _ in range(iters):
        y = x + beta * (x - prev)
        prev, x = x, y - grad(y) / L
    return x`;

const HQ = `import numpy as np

def hard_quadratic(n):
    A = 2 * np.eye(n) - np.eye(n, k=1) - np.eye(n, k=-1)
    b = np.zeros(n)
    b[0] = 1.0
    xs = 1 - np.arange(1, n + 1) / (n + 1)
    return A, b, xs

def bounds(L, r2, k):
    return L * r2 / (2 * k), 2 * L * r2 / (k + 1) ** 2`;

export const lesson: LessonContent = {
  id: "m10.6.2",
  minutes: 50,
  links: {
    requires: ["m10.6.1", "m10.5.3"],
    revisits: ["m10.5.1"],
    foreshadows: ["m10.7.2"],
  },

  puzzle: (
    <>
      <p>
        Gradient descent on a smooth convex function needs about 1/ε steps to reach accuracy ε: a million steps for six
        digits. Is that the best any method can do using only gradients? Nesterov showed that a small change, computing the
        gradient at a point slightly ahead of where you are, brings it down to about 1/√ε, a thousand steps. And no
        gradient method can do better than that.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Heavy ball takes the gradient at the current point and then adds momentum. Nesterov first moves by the momentum to
        a look-ahead point and takes the gradient there, so the correction already accounts for where the momentum is
        carrying it. The momentum coefficient also grows with time, like (k − 1)/(k + 2), so early steps are cautious and
        later ones are bold. The analysis tracks a combination of the error and a distance that can only decrease.
      </p>
      <NesterovViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Nesterov's accelerated gradient method">
        <p>For a convex L-smooth f, start with <M>{"x_0 = x_{-1}"}</M> and for k = 0, 1, 2, … set</p>
        <MD>{"y_k = x_k + \\frac{k - 1}{k + 2}(x_k - x_{k-1}), \\qquad x_{k+1} = y_k - \\frac{1}{L}\\nabla f(y_k)."}</MD>
        <p>
          The first two coefficients multiply zero or are zero, so momentum starts at step 2. An equivalent form, used in
          the proof, keeps a third sequence: with <M>{"\\theta_k = 2/(k + 2)"}</M> and <M>{"z_0 = x_0"}</M>,
        </p>
        <MD>{"y_k = (1 - \\theta_k)x_k + \\theta_k z_k, \\quad x_{k+1} = y_k - \\tfrac1L\\nabla f(y_k), \\quad z_{k+1} = z_k - \\tfrac{1}{\\theta_k L}\\nabla f(y_k)."}</MD>
      </Definition>

      <Theorem title="key inequality">
        <p>
          If f is convex and L-smooth, <M>{"g = \\nabla f(y)"}</M> and <M>{"x^+ = y - g/L"}</M>, then for every u,{" "}
          <M>{"f(x^+) \\leq f(u) + g^\\top(y - u) - \\|g\\|^2/(2L)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The descent lemma gives <M>{"f(x^+) \\leq f(y) - \\|g\\|^2/(2L)"}</M>, and convexity gives{" "}
          <M>{"f(y) \\leq f(u) + g^\\top(y - u)"}</M>.
        </p>
      </Proof>

      <Theorem title="accelerated rate">
        <p>For convex L-smooth f with minimiser x*, Nesterov&apos;s method satisfies</p>
        <MD>{"f(x_k) - f^* \\leq \\frac{2L\\|x_0 - x^*\\|^2}{(k + 1)^2}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Apply the key inequality at <M>{"y = y_k"}</M> with <M>{"u = (1 - \\theta_k)x_k + \\theta_k x^*"}</M>. Convexity
          gives <M>{"f(u) \\leq (1 - \\theta_k)f(x_k) + \\theta_k f^*"}</M>, and <M>{"y_k - u = \\theta_k(z_k - x^*)"}</M>.
          Expanding <M>{"\\|z_{k+1} - x^*\\|^2"}</M> shows{" "}
          <M>{"\\theta_k g^\\top(z_k - x^*) - \\frac{\\|g\\|^2}{2L} = \\frac{\\theta_k^2 L}{2}\\left(\\|z_k - x^*\\|^2 - \\|z_{k+1} - x^*\\|^2\\right)"}</M>.
          So, writing <M>{"\\delta_k = f(x_k) - f^*"}</M> and <M>{"r_k = \\|z_k - x^*\\|^2"}</M>,
        </p>
        <MD>{"\\frac{\\delta_{k+1}}{\\theta_k^2} + \\frac L2 r_{k+1} \\leq \\frac{1 - \\theta_k}{\\theta_k^2}\\delta_k + \\frac L2 r_k \\leq \\frac{\\delta_k}{\\theta_{k-1}^2} + \\frac L2 r_k,"}</MD>
        <p>
          because <M>{"(1 - \\theta_k)/\\theta_k^2 = k(k + 2)/4 \\leq (k + 1)^2/4 = 1/\\theta_{k-1}^2"}</M>. At k = 0 the
          coefficient <M>{"1 - \\theta_0"}</M> is 0, so by induction{" "}
          <M>{"\\delta_{k+1}/\\theta_k^2 \\leq \\frac L2 r_0"}</M>, that is,{" "}
          <M>{"\\delta_{k+1} \\leq 2L\\|x_0 - x^*\\|^2/(k + 2)^2"}</M>. Eliminating z shows the momentum coefficient is
          (k − 1)/(k + 2) in the indexing of the definition.
        </p>
        <Code>{NV}</Code>
      </Proof>

      <Remark title="optimality and the strongly convex case">
        <p>
          Nesterov also proved a lower bound: for any method whose iterates lie in{" "}
          <M>{"x_0 + \\mathrm{span}\\{\\nabla f(x_0), \\dots, \\nabla f(x_{k-1})\\}"}</M>, there is an L-smooth convex
          quadratic in dimension 2k + 1 with <M>{"f(x_k) - f^* \\geq 3L\\|x_0 - x^*\\|^2/(32(k + 1)^2)"}</M>. The
          tridiagonal quadratic in the viz and the code is that example; its minimiser has coordinates 1 − i/(n + 1). So
          1/k² is the best possible rate up to a constant. For μ-strongly convex f, constant momentum{" "}
          <M>{"(\\sqrt\\kappa - 1)/(\\sqrt\\kappa + 1)"}</M> gives{" "}
          <M>{"f(x_k) - f^* \\leq (1 - 1/\\sqrt\\kappa)^k\\big(f(x_0) - f^* + \\tfrac{\\mu}{2}\\|x_0 - x^*\\|^2\\big)"}</M>, the
          heavy-ball rate but now for every such f. In the code, Nesterov on diag(0.01, 1) reaches 5.2 × 10⁻⁵ in 50 steps,
          but the values do not decrease at every step; the strongly convex version brings the slow coordinate to 0.0309.
        </p>
        <Code>{HQ}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "kneed",
      rung: "check",
      prompt: <p>With L = 1 and ‖x₀ − x*‖² = 8, what is the smallest k for which the bound 2L‖x₀ − x*‖²/(k + 1)² is at most 0.01?</p>,
      answer: { kind: "numeric", value: 39, tolerance: 0.5 },
    },
    {
      key: "coef",
      rung: "check",
      prompt: <p>In the form y_k = x_k + ((k − 1)/(k + 2))(x_k − x_{"{k−1}"}), what is the momentum coefficient at k = 4?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "eps",
      rung: "apply",
      prompt: <p>For a smooth convex problem, about how many times fewer steps does Nesterov&apos;s bound need than gradient descent&apos;s to guarantee accuracy 10⁻⁶, with the same L and starting distance?</p>,
      answer: {
        kind: "choice",
        options: ["About 1000 times fewer, up to a constant", "About 10⁶ times fewer", "About 6 times fewer", "About 2 times fewer"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def nesterov(grad, x0, L, iters):
    x = np.array(x0, dtype=float)
    prev = x.copy()
    path = [x.copy()]
    for k in range(iters):
        y = x + (k - 1) / (k + 2) * (x - prev)
        prev, x = x, y - grad(y) / L
        path.append(x.copy())
    return np.array(path)

def nesterov_sc(grad, x0, L, mu, iters):
    q = np.sqrt(L / mu)
    beta = (q - 1) / (q + 1)
    x = np.array(x0, dtype=float)
    prev = x.copy()
    for _ in range(iters):
        y = x + beta * (x - prev)
        prev, x = x, y - grad(y) / L
    return x

Q = np.diag([0.01, 1.0]); grad = lambda x: Q @ x; f = lambda x: 0.5 * float(x @ Q @ x)
p = nesterov(grad, [1.0, 1.0], 1.0, 50)
vals = [f(x) for x in p]
print(round(vals[50], 6), all(vals[i + 1] <= vals[i] for i in range(50)))
print(np.round(nesterov_sc(grad, [1.0, 1.0], 1.0, 0.01, 50), 4).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["5.2e-05 False\n[0.0309, 0.0]", "5.2e-05 True\n[0.0309, 0.0]", "5.2e-05 False\n[0.6050, 0.0]", "0.3025 True\n[0.0309, 0.0]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def hard_quadratic(n):
    A = 2 * np.eye(n) - np.eye(n, k=1) - np.eye(n, k=-1)
    b = np.zeros(n)
    b[0] = 1.0
    xs = 1 - np.arange(1, n + 1) / (n + 1)
    return A, b, xs

def bounds(L, r2, k):
    return L * r2 / (2 * k), 2 * L * r2 / (k + 1) ** 2

A, b, xs = hard_quadratic(5)
print(np.round(xs, 4).tolist(), np.allclose(A @ xs, b))
lo, hi = bounds(4.0, 2.0, 9)
print(bool(np.linalg.eigvalsh(A).max() < 4), round(lo, 4), round(hi, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.8333, 0.6667, 0.5, 0.3333, 0.1667] True\nTrue 0.4444 0.16", "[0.1667, 0.3333, 0.5, 0.6667, 0.8333] False\nTrue 0.4444 0.16", "[0.8333, 0.6667, 0.5, 0.3333, 0.1667] True\nFalse 0.4444 0.16", "[0.8333, 0.6667, 0.5, 0.3333, 0.1667] True\nTrue 0.16 0.4444"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>nesterov(grad, x0, L, iters)</C>, returning all iterates x₀, …, x_iters with momentum (k − 1)/(k + 2) when
          forming y_k for k = 0, 1, …, and <C>nesterov_sc(grad, x0, L, mu, iters)</C>, returning the final iterate of the constant
          momentum version.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def nesterov(grad, x0, L, iters):
    return np.array([x0], dtype=float)

def nesterov_sc(grad, x0, L, mu, iters):
    return np.array(x0, dtype=float)
`,
        solution: NV,
        tests: [
          { name: "steps", code: `p = nesterov(lambda x: x, [1.0], 2.0, 3)
assert p.shape == (4, 1) and np.allclose(p[:, 0], [1.0, 0.5, 0.25, 0.09375])` },
          { name: "rate", code: `Q = np.diag([1e-3, 0.3, 1.0]); f = lambda x: 0.5 * float(x @ Q @ x); x0 = np.ones(3)
p = nesterov(lambda x: Q @ x, x0, 1.0, 100)
assert all(f(p[k]) <= 2 * 3.0 / (k + 1) ** 2 + 1e-12 for k in range(1, 101))
assert np.linalg.norm(nesterov_sc(lambda x: Q @ x, x0, 1.0, 1e-3, 600)) < 1e-4` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>hard_quadratic(n)</C>, returning the tridiagonal matrix A, the vector b = e₁ and the minimiser of
          ½xᵀAx − bᵀx, and <C>bounds(L, r2, k)</C>, returning the gradient descent and Nesterov bounds L·r2/(2k) and
          2L·r2/(k + 1)².
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def hard_quadratic(n):
    return np.eye(n), np.zeros(n), np.zeros(n)

def bounds(L, r2, k):
    return 0.0, 0.0
`,
        solution: HQ,
        tests: [
          { name: "hq", code: `A, b, xs = hard_quadratic(7)
assert A.shape == (7, 7) and A[2, 3] == -1 and A[3, 3] == 2 and A[0, 2] == 0 and b[0] == 1 and b[1:].sum() == 0
assert np.allclose(A @ xs, b) and abs(xs[0] - 7 / 8) < 1e-12` },
          { name: "bd", code: `g, n = bounds(4.0, 2.0, 9)
assert abs(g - 4 / 9) < 1e-12 and abs(n - 0.16) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let f be convex and L-smooth, g = ∇f(y) and x⁺ = y − g/L. Prove that for every u, f(x⁺) ≤ f(u) + gᵀ(y − u) −
          ‖g‖²/(2L).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Applies the descent lemma with step 1/L to get f(x⁺) ≤ f(y) − ‖g‖²/(2L).",
          "Applies the first-order convexity condition at y: f(u) ≥ f(y) + gᵀ(u − y), so f(y) ≤ f(u) + gᵀ(y − u).",
          "Combines the two inequalities to obtain the claim for arbitrary u.",
        ],
      },
    },
    {
      key: "x3",
      rung: "stretch",
      prompt: <p>Run Nesterov&apos;s method on f(x) = x²/2 with the (over-cautious) constant L = 2, from x₀ = 1. What is x₃?</p>,
      answer: { kind: "numeric", value: 0.09375, tolerance: 0.00001 },
    },
  ],

  teachBack:
    "Explain to a friend how Nesterov's method differs from heavy ball, why taking the gradient at a look-ahead point allows a proof for all smooth convex functions, how the Lyapunov argument gives the 1/k² rate, and why no gradient method can beat that rate in general.",

  glimpse: (
    <>
      <p>
        Every method so far uses only first derivatives. The next lesson uses the Hessian too: Newton&apos;s method, which
        is immune to the condition number and converges quadratically near the solution, at the price of solving a linear
        system per step.
      </p>
    </>
  ),
};
