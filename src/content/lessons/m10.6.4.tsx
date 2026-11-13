import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BfgsPathViz } from "@/components/viz/BfgsPathViz";
import type { LessonContent } from "@/lib/types";

const BF = `import numpy as np

def bfgs_update(H, s, y):
    rho = 1.0 / float(y @ s)
    V = np.eye(len(s)) - rho * np.outer(y, s)
    return V.T @ H @ V + rho * np.outer(s, s)

def bfgs(f, grad, x0, iters, tol=1e-10):
    x = np.array(x0, dtype=float)
    H, g, k = np.eye(len(x)), grad(x), 0
    while k < iters and np.linalg.norm(g) > tol:
        d = -H @ g
        t = 1.0
        while f(x + t * d) > f(x) + 1e-4 * t * float(g @ d):
            t *= 0.5
        s = t * d
        x = x + s
        g_new = grad(x)
        y = g_new - g
        if float(s @ y) > 1e-12:
            H = bfgs_update(H, s, y)
        g, k = g_new, k + 1
    return x, k`;

const TL = `import numpy as np

def two_loop(g, S, Y):
    q = np.array(g, dtype=float)
    alphas = []
    for s, y in reversed(list(zip(S, Y))):
        a = float(s @ q) / float(y @ s)
        alphas.append(a)
        q = q - a * y
    gamma = float(S[-1] @ Y[-1]) / float(Y[-1] @ Y[-1]) if S else 1.0
    r = gamma * q
    for (s, y), a in zip(zip(S, Y), reversed(alphas)):
        b = float(y @ r) / float(y @ s)
        r = r + (a - b) * s
    return r

def dense_from_pairs(S, Y, gamma):
    n = len(S[0])
    H = gamma * np.eye(n)
    for s, y in zip(S, Y):
        rho = 1.0 / float(y @ s)
        V = np.eye(n) - rho * np.outer(y, s)
        H = V.T @ H @ V + rho * np.outer(s, s)
    return H`;

export const lesson: LessonContent = {
  id: "m10.6.4",
  minutes: 50,
  links: {
    requires: ["m10.6.3"],
    revisits: ["m10.5.4"],
    foreshadows: ["m10.8.1"],
  },

  puzzle: (
    <>
      <p>
        Fitting a model with a million parameters, Newton&apos;s method would need a Hessian with 10¹² entries and a linear
        solve to match. Gradient descent needs only the gradient but crawls through narrow valleys. Every step, though,
        tells you something about curvature for free: how much the gradient changed when you moved. Can a method collect
        those clues into a usable picture of the Hessian, while storing only a handful of vectors?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In one variable, the change in slope divided by the change in position estimates the second derivative: that is
        the secant method. Quasi-Newton methods do the same in many dimensions. After each step they adjust a matrix so it
        maps the latest gradient change to the latest step, changing it as little as possible otherwise. BFGS is the most
        successful such update; its limited-memory version keeps only the last few step and gradient pairs and applies the
        updates on the fly.
      </p>
      <BfgsPathViz />
    </>
  ),

  theory: (
    <>
      <Definition title="quasi-Newton methods and the secant equation">
        <p>
          A quasi-Newton method takes <M>{"x_{k+1} = x_k - t_kH_k\\nabla f(x_k)"}</M>, where <M>{"H_k"}</M> is a symmetric
          positive definite approximation to the inverse Hessian. With <M>{"s_k = x_{k+1} - x_k"}</M> and{" "}
          <M>{"y_k = \\nabla f(x_{k+1}) - \\nabla f(x_k)"}</M>, the next matrix is required to satisfy the secant equation
        </p>
        <MD>{"H_{k+1}y_k = s_k,"}</MD>
        <p>
          which holds exactly for the true inverse Hessian of a quadratic, since then <M>{"y_k = Qs_k"}</M>. It needs the
          curvature condition <M>{"s_k^\\top y_k > 0"}</M>, which holds for strictly convex f, or is enforced by a line search
          satisfying the Wolfe conditions.
        </p>
      </Definition>

      <Theorem title="the BFGS update">
        <p>With <M>{"\\rho = 1/(y^\\top s)"}</M> and <M>{"V = I - \\rho ys^\\top"}</M>, the BFGS update is</p>
        <MD>{"H^+ = V^\\top HV + \\rho ss^\\top = (I - \\rho sy^\\top)H(I - \\rho ys^\\top) + \\rho ss^\\top."}</MD>
        <p>
          It satisfies <M>{"H^+y = s"}</M>, and if H is symmetric positive definite and <M>{"s^\\top y > 0"}</M>, so is{" "}
          <M>{"H^+"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"Vy = y - \\rho y(s^\\top y) = 0"}</M>, so <M>{"H^+y = \\rho s(s^\\top y) = s"}</M>. Symmetry is clear. For any z,{" "}
          <M>{"z^\\top H^+z = (Vz)^\\top H(Vz) + \\rho(s^\\top z)^2 \\geq 0"}</M>, since ρ &gt; 0. If this is 0, then{" "}
          <M>{"s^\\top z = 0"}</M>, so <M>{"Vz = z - \\rho y(s^\\top z) = z"}</M>, and <M>{"z^\\top Hz = 0"}</M> forces z = 0.
        </p>
        <Code>{BF}</Code>
      </Proof>

      <Remark title="properties">
        <p>
          BFGS is the symmetric matrix satisfying the secant equation that is closest to H in a weighted Frobenius norm,
          so it changes H only as much as the new information demands. On a strictly convex quadratic with exact line
          searches, it finds the minimiser in at most n steps and ends with the exact inverse Hessian. On smooth strongly
          convex functions it converges superlinearly: the ratio of successive errors tends to 0. Each step costs{" "}
          <M>{"O(n^2)"}</M>, against <M>{"O(n^3)"}</M> for Newton. In the code, one update from H = I with a step along e₁ on
          the quadratic with rows (4, 1) and (1, 2) maps y back to s exactly and stays positive definite, and BFGS reaches
          the Rosenbrock minimum (1, 1) from (−1.2, 1) in 36 steps.
        </p>
      </Remark>

      <Theorem title="L-BFGS two-loop recursion">
        <p>
          Given the m most recent pairs <M>{"(s_i, y_i)"}</M> and the initial matrix <M>{"H^0 = \\gamma I"}</M> with{" "}
          <M>{"\\gamma = s^\\top y / y^\\top y"}</M> from the latest pair, the product of the m-times updated matrix with a
          vector g can be computed in O(mn) operations, without forming any matrix: a backward loop computes{" "}
          <M>{"\\alpha_i = \\rho_i s_i^\\top q"}</M> and <M>{"q \\leftarrow q - \\alpha_i y_i"}</M>, and a forward loop applies{" "}
          <M>{"r \\leftarrow r + (\\alpha_i - \\rho_i y_i^\\top r)s_i"}</M> starting from r = γq.
        </p>
      </Theorem>
      <Proof>
        <p>
          Unroll <M>{"H_{i+1} = V_i^\\top H_iV_i + \\rho_is_is_i^\\top"}</M>. Applying it to g, the backward loop computes the
          products <M>{"V_i \\cdots V_{m-1}g"}</M> and records the scalars <M>{"\\rho_is_i^\\top(\\cdot)"}</M> that the rank-one
          terms need. The forward loop then applies the <M>{"V_i^\\top"}</M> factors in the opposite order and adds back each
          rank-one term, since <M>{"V_i^\\top r + \\rho_is_i\\alpha_i = r + (\\alpha_i - \\rho_iy_i^\\top r)s_i"}</M>. In the
          code it agrees with the dense matrix built by m updates. That matrix satisfies the secant equation for the last
          pair but not, in general, for older ones, which later updates overwrite.
        </p>
        <Code>{TL}</Code>
      </Proof>
    </>
  ),

  practice: [
    {
      key: "sec",
      rung: "check",
      prompt: <p>In one variable, a step s = 0.5 changes the derivative by y = 2. What second derivative does the secant equation assign?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0.0001 },
    },
    {
      key: "mem",
      rung: "check",
      prompt: <p>L-BFGS with memory m = 10 in n = 10⁶ dimensions stores the pairs (sᵢ, yᵢ). How many floating-point numbers is that?</p>,
      answer: { kind: "numeric", value: 20000000, tolerance: 0.5 },
    },
    {
      key: "curv",
      rung: "apply",
      prompt: <p>Why do BFGS implementations insist on sᵀy &gt; 0, skipping or repairing the update otherwise?</p>,
      answer: {
        kind: "choice",
        options: [
          "Without it the update can lose positive definiteness, and −H∇f may stop being a descent direction",
          "Without it the secant equation has no solution with a symmetric matrix",
          "It guarantees the step size 1 is always accepted",
          "It is needed for the two-loop recursion to run in O(mn) time",
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

def bfgs_update(H, s, y):
    rho = 1.0 / float(y @ s)
    V = np.eye(len(s)) - rho * np.outer(y, s)
    return V.T @ H @ V + rho * np.outer(s, s)

def bfgs(f, grad, x0, iters, tol=1e-10):
    x = np.array(x0, dtype=float)
    H, g, k = np.eye(len(x)), grad(x), 0
    while k < iters and np.linalg.norm(g) > tol:
        d = -H @ g
        t = 1.0
        while f(x + t * d) > f(x) + 1e-4 * t * float(g @ d):
            t *= 0.5
        s = t * d
        x = x + s
        g_new = grad(x)
        y = g_new - g
        if float(s @ y) > 1e-12:
            H = bfgs_update(H, s, y)
        g, k = g_new, k + 1
    return x, k

Q = np.array([[4.0, 1.0], [1.0, 2.0]]); s = np.array([1.0, 0.0]); H = bfgs_update(np.eye(2), s, Q @ s)
print(np.round(H @ (Q @ s), 6).tolist(), bool(np.all(np.linalg.eigvalsh(H) > 0)))
rosen = lambda x: float((1 - x[0]) ** 2 + 100 * (x[1] - x[0] ** 2) ** 2)
rgrad = lambda x: np.array([-2 * (1 - x[0]) - 400 * x[0] * (x[1] - x[0] ** 2), 200 * (x[1] - x[0] ** 2)])
x, k = bfgs(rosen, rgrad, [-1.2, 1.0], 200)
print(np.round(x, 6).tolist(), k)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1.0, 0.0] True\n[1.0, 1.0] 36", "[4.0, 1.0] True\n[1.0, 1.0] 36", "[1.0, 0.0] False\n[1.0, 1.0] 36", "[1.0, 0.0] True\n[-1.2, 1.0] 200"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def two_loop(g, S, Y):
    q = np.array(g, dtype=float)
    alphas = []
    for s, y in reversed(list(zip(S, Y))):
        a = float(s @ q) / float(y @ s)
        alphas.append(a)
        q = q - a * y
    gamma = float(S[-1] @ Y[-1]) / float(Y[-1] @ Y[-1]) if S else 1.0
    r = gamma * q
    for (s, y), a in zip(zip(S, Y), reversed(alphas)):
        b = float(y @ r) / float(y @ s)
        r = r + (a - b) * s
    return r

def dense_from_pairs(S, Y, gamma):
    n = len(S[0])
    H = gamma * np.eye(n)
    for s, y in zip(S, Y):
        rho = 1.0 / float(y @ s)
        V = np.eye(n) - rho * np.outer(y, s)
        H = V.T @ H @ V + rho * np.outer(s, s)
    return H

rng = np.random.default_rng(0); A = rng.normal(size=(5, 5)); Q = A @ A.T + np.eye(5)
S = [rng.normal(size=5) for _ in range(3)]; Y = [Q @ s for s in S]; g = rng.normal(size=5)
gamma = float(S[-1] @ Y[-1]) / float(Y[-1] @ Y[-1]); D = dense_from_pairs(S, Y, gamma)
print(np.allclose(two_loop(g, S, Y), D @ g), np.allclose(D @ Y[-1], S[-1]), np.allclose(D @ Y[0], S[0]))
print(two_loop(np.array([3.0]), [np.array([1.0])], [np.array([4.0])]).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True True False\n[0.75]", "True True True\n[0.75]", "True True False\n[0.25]", "False True False\n[0.75]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bfgs_update(H, s, y)</C> and <C>bfgs(f, grad, x0, iters, tol=1e-10)</C>: start from H = I, take{" "}
          d = −H∇f, backtrack from t = 1 with sufficient decrease constant 10⁻⁴, update H only when sᵀy &gt; 10⁻¹², and
          return the final x and the number of steps taken.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def bfgs_update(H, s, y):
    return H

def bfgs(f, grad, x0, iters, tol=1e-10):
    return np.array(x0, dtype=float), 0
`,
        solution: BF,
        tests: [
          { name: "update", code: `H = np.array([[2.0, 0.5], [0.5, 1.0]]); s = np.array([1.0, 2.0]); y = np.array([3.0, 1.0])
Hp = bfgs_update(H, s, y)
assert np.allclose(Hp @ y, s) and np.allclose(Hp, Hp.T) and np.all(np.linalg.eigvalsh(Hp) > 0)
assert np.allclose(bfgs_update(np.eye(2), np.array([1.0, 0.0]), np.array([2.0, 0.0])), np.diag([0.5, 1.0]))` },
          { name: "min", code: `Q = np.diag([1.0, 10.0, 100.0]); b = np.array([1.0, 2.0, 3.0])
x, k = bfgs(lambda x: 0.5 * float(x @ Q @ x) - float(b @ x), lambda x: Q @ x - b, np.zeros(3), 200)
assert np.allclose(Q @ x, b, atol=1e-8) and k < 60` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>two_loop(g, S, Y)</C>, the L-BFGS product with γ from the last pair (γ = 1 if there are no pairs), and{" "}
          <C>dense_from_pairs(S, Y, gamma)</C>, the matrix obtained by applying the BFGS updates for the pairs in order to γI.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def two_loop(g, S, Y):
    return np.array(g, dtype=float)

def dense_from_pairs(S, Y, gamma):
    return gamma * np.eye(len(S[0]))
`,
        solution: TL,
        tests: [
          { name: "agree", code: `rng = np.random.default_rng(3); A = rng.normal(size=(6, 6)); Q = A @ A.T + np.eye(6)
S = [rng.normal(size=6) for _ in range(4)]; Y = [Q @ s for s in S]; g = rng.normal(size=6)
gm = float(S[-1] @ Y[-1]) / float(Y[-1] @ Y[-1])
assert np.allclose(two_loop(g, S, Y), dense_from_pairs(S, Y, gm) @ g)` },
          { name: "small", code: `assert np.allclose(two_loop(np.array([3.0]), [np.array([1.0])], [np.array([4.0])]), [0.75])
assert np.allclose(two_loop(np.array([1.0, -2.0]), [], []), [1.0, -2.0])` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let H be symmetric positive definite and sᵀy &gt; 0. Prove that the BFGS update H⁺ = VᵀHV + ρssᵀ, with ρ = 1/(yᵀs) and
          V = I − ρysᵀ, satisfies H⁺y = s and is positive definite.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes Vy = y − ρy(sᵀy) = 0 and hence H⁺y = ρs(sᵀy) = s.",
          "Writes zᵀH⁺z = (Vz)ᵀH(Vz) + ρ(sᵀz)² ≥ 0 using H positive definite and ρ > 0.",
          "Shows equality forces sᵀz = 0, hence Vz = z and zᵀHz = 0, so z = 0.",
        ],
      },
    },
    {
      key: "trace",
      rung: "stretch",
      prompt: <p>Apply one BFGS update to H = I in two dimensions with s = (1, 0) and y = (2, 0). What is the trace of H⁺?</p>,
      answer: { kind: "numeric", value: 1.5, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what the secant equation says, how the BFGS update satisfies it while staying positive definite, why L-BFGS needs only a few vectors and O(mn) work per step, and why BFGS behaves almost like Newton's method near the solution.",

  glimpse: (
    <>
      <p>
        Every method so far needs a gradient. Many useful objectives, like the absolute value and the ℓ₁ norm, have kinks
        where no gradient exists. The next chapter replaces gradients with subgradients and asks what survives.
      </p>
    </>
  ),
};
