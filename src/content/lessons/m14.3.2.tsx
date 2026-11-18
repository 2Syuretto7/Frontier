import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PowerPrecondViz } from "@/components/viz/PowerPrecondViz";
import type { LessonContent } from "@/lib/types";

const POWER = `import numpy as np

def mat_power(H, alpha):
    lam, V = np.linalg.eigh(np.asarray(H, float))
    return (V * lam ** alpha) @ V.T

def effective_cond(H, P):
    R = mat_power(P, -0.5)
    lam = np.linalg.eigvalsh(R @ H @ R)
    return float(lam[-1] / lam[0])

def precond_gd(H, x0, P, steps):
    R = mat_power(P, -0.5)
    lam = np.linalg.eigvalsh(R @ H @ R)
    lr, Pinv, x = 2 / (lam[0] + lam[-1]), np.linalg.inv(P), np.asarray(x0, float)
    out = []
    for _ in range(steps):
        x = x - lr * Pinv @ (H @ x)
        out.append(0.5 * float(x @ H @ x))
    return out`;

const FISHER = `import numpy as np

def per_example_grads(X, y, w):
    X = np.asarray(X, float)
    return (X @ w - y)[:, None] * X

def second_moment(G):
    G = np.asarray(G, float)
    return G.T @ G / len(G)

def preconditioner_sizes(shapes):
    diag = sum(m * n for m, n in shapes)
    kron = sum(m * m + n * n for m, n in shapes)
    full = sum((m * n) ** 2 for m, n in shapes)
    return diag, kron, full`;

export const lesson: LessonContent = {
  id: "m14.3.2",
  minutes: 45,
  links: {
    requires: ["m14.3.1", "m11.5.3"],
    revisits: ["m11.7.2", "m10.6.3"],
    foreshadows: ["m14.3.3", "m14.3.4"],
  },

  puzzle: (
    <>
      <p>
        Newton&apos;s method preconditions by the Hessian and needs one step on a quadratic. Adam preconditions by the
        square root of a second moment of gradients, and full-matrix AdaGrad by the square root of a sum of outer products.
        Why a square root, when the Hessian itself is the ideal? And why does nobody run full-matrix AdaGrad on a network
        with a billion parameters?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A preconditioner P reshapes the landscape: gradient descent with steps <M>{"P^{-1}g"}</M> is plain gradient descent
        in coordinates where the loss looks like <M>{"P^{-1/2}HP^{-1/2}"}</M>. If P is a power of H, each eigenvalue λ
        becomes <M>{"\\lambda^{1-\\alpha}"}</M>, so the condition number κ becomes <M>{"\\kappa^{1-\\alpha}"}</M>: halfway
        to Newton in the exponent is halfway in the logarithm of κ. The square root also arises naturally, because near a
        good fit the covariance of the gradients is proportional to the Hessian, and the root of that covariance is{" "}
        <M>{"H^{1/2}"}</M>. What stops anyone using the full matrix is size: for a 1000 × 1000 weight matrix it has a
        trillion entries.
      </p>
      <PowerPrecondViz />
    </>
  ),

  theory: (
    <>
      <Definition title="preconditioned gradient descent">
        <p>
          For a symmetric positive definite P, <M>{"x_{t+1} = x_t - \\eta P^{-1}\\nabla f(x_t)"}</M>. On{" "}
          <M>{"f = \\tfrac12 x^\\top Hx"}</M>, the variables <M>{"y = P^{1/2}x"}</M> follow plain gradient descent on{" "}
          <M>{"\\tfrac12 y^\\top \\tilde Hy"}</M> with <M>{"\\tilde H = P^{-1/2}HP^{-1/2}"}</M>, and the best fixed step{" "}
          <M>{"\\eta = 2/(\\tilde\\lambda_{\\min} + \\tilde\\lambda_{\\max})"}</M> contracts the error by{" "}
          <M>{"(\\tilde\\kappa - 1)/(\\tilde\\kappa + 1)"}</M> per step.
        </p>
      </Definition>

      <Theorem title="power preconditioners">
        <p>
          If <M>{"P = H^\\alpha"}</M> with 0 ≤ α ≤ 1, then <M>{"\\tilde H = H^{1-\\alpha}"}</M> and{" "}
          <M>{"\\tilde\\kappa = \\kappa(H)^{1-\\alpha}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          With <M>{"H = V\\Lambda V^\\top"}</M>, every power is <M>{"V\\Lambda^\\alpha V^\\top"}</M>, so all of them commute
          and <M>{"P^{-1/2}HP^{-1/2} = V\\Lambda^{-\\alpha/2}\\Lambda\\Lambda^{-\\alpha/2}V^\\top = V\\Lambda^{1-\\alpha}V^\\top"}</M>.
          Its extreme eigenvalues are <M>{"\\lambda_{\\max}^{1-\\alpha}"}</M> and <M>{"\\lambda_{\\min}^{1-\\alpha}"}</M>,
          whose ratio is <M>{"\\kappa^{1-\\alpha}"}</M>.
        </p>
        <Code>{POWER}</Code>
      </Proof>

      <Theorem title="gradient covariance at the optimum">
        <p>
          Let <M>{"y = x^\\top w^* + \\varepsilon"}</M> with ε independent of x, mean 0 and variance <M>{"\\sigma^2"}</M>, and
          let the loss be <M>{"\\tfrac12E(x^\\top w - y)^2"}</M>, whose Hessian is <M>{"H = E[xx^\\top]"}</M>. The
          per-example gradients at <M>{"w^*"}</M> satisfy <M>{"E[gg^\\top] = \\sigma^2H"}</M>, so{" "}
          <M>{"(E[gg^\\top])^{1/2} = \\sigma H^{1/2}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The per-example gradient is <M>{"g = (x^\\top w - y)x"}</M>, which at <M>{"w^*"}</M> is <M>{"-\\varepsilon x"}</M>.
          Then <M>{"gg^\\top = \\varepsilon^2xx^\\top"}</M> and, by independence,{" "}
          <M>{"E[gg^\\top] = E[\\varepsilon^2]E[xx^\\top] = \\sigma^2H"}</M>. A positive scalar multiple passes through the
          square root. More generally, for a well-specified likelihood the expected outer product of the score at the true
          parameters is the Fisher information, which equals the expected Hessian of the negative log-likelihood. So
          methods that take the square root of a gradient second moment are, near a good fit, approximating{" "}
          <M>{"H^{1/2}"}</M>, the halfway preconditioner.
        </p>
      </Proof>

      <Theorem title="what the full matrix costs">
        <p>
          For an m × n weight matrix, a full preconditioner has <M>{"(mn)^2"}</M> entries and its inverse root costs{" "}
          <M>{"O((mn)^3)"}</M>. A diagonal one has mn entries. A Kronecker-factored one,{" "}
          <M>{"L \\otimes R"}</M> with L of size m × m and R of size n × n, has <M>{"m^2 + n^2"}</M> entries, and its inverse
          root costs <M>{"O(m^3 + n^3)"}</M> because <M>{"(L\\otimes R)^{-1/2} = L^{-1/2}\\otimes R^{-1/2}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The parameter vector has mn entries, so a full symmetric matrix on it has <M>{"(mn)^2"}</M>, and an
          eigendecomposition is cubic in its size. For the Kronecker product, if <M>{"L = U\\Lambda U^\\top"}</M> and{" "}
          <M>{"R = W\\Sigma W^\\top"}</M>, then{" "}
          <M>{"L\\otimes R = (U\\otimes W)(\\Lambda\\otimes\\Sigma)(U\\otimes W)^\\top"}</M> with{" "}
          <M>{"U\\otimes W"}</M> orthogonal, so any power acts factor by factor and needs only the two small
          eigendecompositions. The code below checks the covariance identity on data and counts entries for two layers
          of a transformer block.
        </p>
        <Code>{FISHER}</Code>
      </Proof>

      <Remark title="caveats">
        <p>
          Away from the optimum, <M>{"E[gg^\\top]"}</M> also contains the outer product of the mean gradient, and for a
          misspecified model the &quot;empirical Fisher&quot; can differ badly from the Hessian; it is a heuristic, not an
          identity. Diagonal methods such as Adam keep only <M>{"\\operatorname{diag}(E[gg^\\top])^{1/2}"}</M>, which fixes
          badly scaled coordinates but not correlated ones. Kronecker factorisation is the middle road the next lesson
          takes.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "kappa",
      rung: "check",
      prompt: <p>A quadratic has κ(H) = 10,000. What is the condition number after preconditioning with H^(1/2)?</p>,
      answer: { kind: "numeric", value: 100, tolerance: 0.0001 },
    },
    {
      key: "size",
      rung: "check",
      prompt: <p>For a 1000 × 1000 weight matrix, by what factor does a full-matrix preconditioner have more entries than a Kronecker-factored one?</p>,
      answer: { kind: "numeric", value: 500000, tolerance: 0.5 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why is full-matrix AdaGrad not used to train large networks?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its preconditioner has (number of parameters)² entries and needs a cubic-cost inverse square root, which is impossible at that scale",
          "Its theory only applies to convex problems, so it diverges on networks",
          "It is identical to Adam, so there is no reason to",
          "It cannot be combined with momentum",
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

def mat_power(H, alpha):
    lam, V = np.linalg.eigh(np.asarray(H, float))
    return (V * lam ** alpha) @ V.T

def effective_cond(H, P):
    R = mat_power(P, -0.5)
    lam = np.linalg.eigvalsh(R @ H @ R)
    return float(lam[-1] / lam[0])

def precond_gd(H, x0, P, steps):
    R = mat_power(P, -0.5)
    lam = np.linalg.eigvalsh(R @ H @ R)
    lr, Pinv, x = 2 / (lam[0] + lam[-1]), np.linalg.inv(P), np.asarray(x0, float)
    out = []
    for _ in range(steps):
        x = x - lr * Pinv @ (H @ x)
        out.append(0.5 * float(x @ H @ x))
    return out

H = np.diag([100.0, 1.0])
print(mat_power(H, 0.5).diagonal(), [round(effective_cond(H, mat_power(H, a)), 2) for a in (0, 0.5, 1)])
print([round(v, 4) for v in precond_gd(H, [1.0, 1.0], np.eye(2), 2)], round(precond_gd(H, [1.0, 1.0], H, 1)[0], 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[10.  1.] [100.0, 10.0, 1.0]\n[48.5198, 46.6173] 0.0",
          "[10.  1.] [100.0, 50.0, 1.0]\n[48.5198, 46.6173] 0.0",
          "[50.   0.5] [100.0, 10.0, 1.0]\n[48.5198, 46.6173] 0.0",
          "[10.  1.] [100.0, 10.0, 1.0]\n[48.5198, 46.6173] 0.5",
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

def per_example_grads(X, y, w):
    X = np.asarray(X, float)
    return (X @ w - y)[:, None] * X

def second_moment(G):
    G = np.asarray(G, float)
    return G.T @ G / len(G)

def preconditioner_sizes(shapes):
    diag = sum(m * n for m, n in shapes)
    kron = sum(m * m + n * n for m, n in shapes)
    full = sum((m * n) ** 2 for m, n in shapes)
    return diag, kron, full

X = np.array([[1.0, 0.0], [0.0, 2.0], [1.0, 1.0]]); y = np.array([0.0, 1.0, 1.0])
print(per_example_grads(X, y, np.ones(2)).tolist(), second_moment([[1.0, 2.0], [3.0, 0.0]]).tolist())
print(preconditioner_sizes([(1024, 4096), (4096, 1024)]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1.0, 0.0], [0.0, 2.0], [1.0, 1.0]] [[5.0, 1.0], [1.0, 2.0]]\n(8388608, 35651584, 35184372088832)",
          "[[1.0, 0.0], [0.0, 2.0], [1.0, 1.0]] [[10.0, 2.0], [2.0, 4.0]]\n(8388608, 35651584, 35184372088832)",
          "[[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]] [[5.0, 1.0], [1.0, 2.0]]\n(8388608, 35651584, 35184372088832)",
          "[[1.0, 0.0], [0.0, 2.0], [1.0, 1.0]] [[5.0, 1.0], [1.0, 2.0]]\n(8388608, 52428800, 35184372088832)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mat_power(H, alpha)</C> for symmetric positive definite H; <C>effective_cond(H, P)</C>, the condition
          number of <C>P^(−1/2) H P^(−1/2)</C>; and <C>precond_gd(H, x0, P, steps)</C>, running{" "}
          <C>x ← x − η P⁻¹Hx</C> with the best fixed η and returning the loss ½xᵀHx after each step.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def mat_power(H, alpha):
    return np.asarray(H, float) ** alpha

def effective_cond(H, P):
    lam = np.linalg.eigvalsh(H)
    return float(lam[-1] / lam[0])

def precond_gd(H, x0, P, steps):
    return []
`,
        solution: POWER,
        tests: [
          { name: "power", code: `H = np.array([[5.0, 3.0], [3.0, 5.0]]); R = mat_power(H, 0.5); assert np.allclose(R @ R, H) and np.allclose(R, [[2.12132034, 0.70710678], [0.70710678, 2.12132034]])
assert np.allclose(mat_power(H, -1) @ H, np.eye(2))
for a in [0, 0.25, 0.5, 0.75]:
    assert abs(effective_cond(H, mat_power(H, a)) - 4 ** (1 - a)) < 1e-9` },
          { name: "run", code: `H = np.array([[4.0, 1.0], [1.0, 3.0]]); f = precond_gd(H, [1.0, -1.0], np.diag([4.0, 3.0]), 3)
assert np.allclose(f, [0.20833333333333337, 0.01736111111111112, 0.00144675925925926])
assert abs(precond_gd(H, [1.0, 2.0], H, 1)[0]) < 1e-20 + 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For least squares, write <C>per_example_grads(X, y, w)</C>, the rows <C>(xᵢ·w − yᵢ)xᵢ</C>;{" "}
          <C>second_moment(G)</C>, the average outer product of the rows; and <C>preconditioner_sizes(shapes)</C>, returning
          the total entries (diagonal, Kronecker, full) over a list of (m, n) weight shapes.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def per_example_grads(X, y, w):
    return np.zeros_like(np.asarray(X, float))

def second_moment(G):
    G = np.asarray(G, float)
    return np.eye(G.shape[1])

def preconditioner_sizes(shapes):
    return 0, 0, 0
`,
        solution: FISHER,
        tests: [
          { name: "grads", code: `X = np.array([[1.0, 0.0], [0.0, 2.0], [1.0, 1.0]]); y = np.array([0.0, 1.0, 1.0])
assert np.allclose(per_example_grads(X, y, np.ones(2)), X) and np.allclose(second_moment([[1.0, 2.0], [3.0, 0.0]]), [[5, 1], [1, 2]])
assert preconditioner_sizes([(2, 3)]) == (6, 13, 36) and preconditioner_sizes([(1000, 1000), (10, 1)]) == (1000010, 2000101, 1000000000100)` },
          { name: "fisher", code: `rng = np.random.default_rng(4); S = np.array([[2.0, 0.6], [0.6, 1.0]]); w = np.array([1.0, -2.0])
X = rng.multivariate_normal(np.zeros(2), S, size=100000); y = X @ w + 0.5 * rng.standard_normal(100000)
assert np.allclose(second_moment(per_example_grads(X, y, w)), 0.25 * S, atol=0.02)` },
        ],
      },
    },
    {
      key: "root",
      rung: "stretch",
      prompt: (
        <p>
          At the optimum of a least-squares problem with noise variance σ² = 1 and Hessian H = [[5, 3], [3, 5]], what is the
          (1, 1) entry of the square-root preconditioner (E[ggᵀ])^(1/2)? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.12, tolerance: 0.006 },
    },
  ],

  glimpse: (
    <>
      <p>
        A full preconditioner is too big and a diagonal one too crude. Shampoo keeps one small matrix for the rows of a
        weight matrix and one for its columns, and its successor SOAP runs Adam inside the eigenbasis those matrices define.
      </p>
    </>
  ),
};
