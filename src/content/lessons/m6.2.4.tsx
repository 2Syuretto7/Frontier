import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ProjVsTaylorViz } from "@/components/viz/ProjVsTaylorViz";
import type { LessonContent } from "@/lib/types";

const LSQ = `import numpy as np

def weighted_lstsq(A, b, M):
    return np.linalg.solve(A.T @ M @ A, A.T @ M @ b)

def min_norm_solution(A, b):
    return A.T @ np.linalg.solve(A @ A.T, b)`;

const FIT = `def poly_l2_fit(f, deg, n=2000):
    x = (np.arange(n) + 0.5) / n
    V = np.vander(x, deg + 1, increasing=True)
    return np.linalg.lstsq(V, f(x), rcond=None)[0]

def l2_error(f, c, n=2000):
    x = (np.arange(n) + 0.5) / n
    r = f(x) - np.vander(x, len(c), increasing=True) @ c
    return float(np.sqrt(np.mean(r * r)))`;

export const lesson: LessonContent = {
  id: "m6.2.4",
  minutes: 55,
  links: {
    requires: ["m6.2.3"],
    revisits: ["m3.5.3"],
    foreshadows: ["m6.4.4", "m6.6.1"],
  },

  puzzle: (
    <>
      <p>
        Fitting a line to points, approximating sin by a cubic over a whole interval, and picking the smallest weight vector
        that fits underdetermined data all look like separate optimisation problems. Each asks for the point of some subspace
        or affine set nearest to something. Is there one theorem that solves all three, with a formula?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The closest point of a subspace U to v is the orthogonal projection: drop a perpendicular. The error{" "}
        <M>{"v - P_U v"}</M> is orthogonal to U, and that orthogonality condition is a linear system, the normal equations,
        in whatever inner product measures the error. Change the inner product and you change what &ldquo;closest&rdquo;
        means: weighted least squares, or the L² distance between functions.
      </p>
      <ProjVsTaylorViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="closest point">
        <p>
          Let U be a finite-dimensional subspace of V and v in V. Then for every u in U,{" "}
          <M>{"\\|v - P_U v\\| \\le \\|v - u\\|"}</M>, with equality only when <M>{"u = P_U v"}</M>. A point{" "}
          <M>{"u^* \\in U"}</M> is the minimiser exactly when <M>{"v - u^* \\perp U"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"v - u = (v - P_U v) + (P_U v - u)"}</M>. The first piece is in <M>{"U^\\perp"}</M> and the second in U,
          so by Pythagoras <M>{"\\|v - u\\|^2 = \\|v - P_U v\\|^2 + \\|P_U v - u\\|^2"}</M>. The second term is at least 0,
          and 0 only when <M>{"u = P_U v"}</M>. For the characterisation: if <M>{"v - u^* \\perp U"}</M> then{" "}
          <M>{"v = u^* + (v - u^*)"}</M> is the decomposition of V = U ⊕ U⊥, so <M>{"u^* = P_U v"}</M> by uniqueness.
        </p>
      </Proof>

      <Example title="least squares, in any inner product">
        <p>
          Minimising <M>{"\\|b - Ax\\|_M"}</M> over x, with <M>{"\\|y\\|_M^2 = y^\\top M y"}</M>, means finding the point of
          the column space nearest to b. The condition <M>{"b - Ax \\perp_M \\text{columns of } A"}</M> reads{" "}
          <M>{"A^\\top M(b - Ax) = 0"}</M>, the weighted normal equations{" "}
          <M>{"A^\\top M A\\, x = A^\\top M b"}</M>. With M = I they are the ordinary ones. With M diagonal, a point with a
          larger weight pulls the fit harder towards itself.
        </p>
      </Example>

      <Theorem title="minimum-norm solution">
        <p>
          If A is m×n with independent rows and Ax = b, then among all solutions the one of smallest norm is{" "}
          <M>{"x^* = A^\\top(AA^\\top)^{-1}b"}</M>, the unique solution in the row space of A.
        </p>
      </Theorem>
      <Proof>
        <p>
          The solution set is <M>{"x_0 + \\operatorname{null} A"}</M> for any particular solution <M>{"x_0"}</M>. With the
          dot product, <M>{"(\\operatorname{null} A)^\\perp"}</M> is the row space. Split{" "}
          <M>{"x_0 = r + z"}</M> with r in the row space and z in the null space; then r is a solution too, and every solution
          is <M>{"r + z'"}</M> with <M>{"z' \\in \\operatorname{null}A"}</M>, of squared norm{" "}
          <M>{"\\|r\\|^2 + \\|z'\\|^2 \\ge \\|r\\|^2"}</M>. So r is the unique minimiser. Writing{" "}
          <M>{"r = A^\\top y"}</M> and solving <M>{"AA^\\top y = b"}</M> gives the formula; <M>{"AA^\\top"}</M> is invertible
          because the rows are independent.
        </p>
      </Proof>
      <Code>{LSQ}</Code>

      <Example title="best approximation of a function">
        <p>
          With <M>{"\\langle f, g\\rangle = \\int_0^1 fg"}</M>, the best approximation of f by polynomials of degree at most d
          is the projection onto that subspace. For <M>{"f(x) = x^2"}</M> and d = 1 it is{" "}
          <M>{"x - \\tfrac16"}</M>, and the error <M>{"x^2 - x + \\tfrac16"}</M> is the third Legendre direction, orthogonal
          to 1 and x. Replacing the integral by the midpoint rule turns the problem into ordinary least squares on a grid,
          which is how the code computes it.
        </p>
        <Code>{FIT}</Code>
      </Example>

      <Remark title="what is not a projection">
        <p>
          A Taylor polynomial matches f and its derivatives at one point. It is not the closest polynomial in any average
          sense, and for functions with nearby complex singularities it can diverge on most of the interval while the
          projections converge, as the picture shows. In machine learning, gradient descent from zero on an underdetermined
          least squares problem stays in the row space and so converges to the minimum-norm solution: an implicit bias that
          comes straight from this lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "const",
      rung: "check",
      prompt: <p>With ⟨f, g⟩ = ∫₀¹ fg, what constant c minimises ‖x² − c‖?</p>,
      answer: { kind: "numeric", value: 0.33333333, tolerance: 1e-4 },
    },
    {
      key: "minnorm",
      rung: "check",
      prompt: <p>Among all solutions of x₁ + x₂ = 2 in ℝ², what is the smallest possible value of x₁² + x₂²?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 1e-9 },
    },
    {
      key: "char",
      rung: "apply",
      prompt: <p>U is a finite-dimensional subspace and u* ∈ U. Which condition is equivalent to u* being the point of U closest to v?</p>,
      answer: {
        kind: "choice",
        options: ["v − u* is orthogonal to every vector of U", "u* is orthogonal to v", "‖u*‖ = ‖v‖", "v − u* is a multiple of u*"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def weighted_lstsq(A, b, M):
    return np.linalg.solve(A.T @ M @ A, A.T @ M @ b)

def min_norm_solution(A, b):
    return A.T @ np.linalg.solve(A @ A.T, b)

A = np.array([[1.0], [1.0]])
b = np.array([0.0, 3.0])
print(weighted_lstsq(A, b, np.eye(2)), weighted_lstsq(A, b, np.diag([2.0, 1.0])))
A = np.array([[1.0, 1.0, 0.0]])
x = min_norm_solution(A, np.array([2.0]))
print(x, A @ x, x @ np.array([1.0, -1.0, 0.0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.5] [1.]\n[1. 1. 0.] [2.] 0.0",
          "[1.5] [2.]\n[1. 1. 0.] [2.] 0.0",
          "[1.5] [1.5]\n[1. 1. 0.] [2.] 0.0",
          "[1.5] [1.]\n[2. 0. 0.] [2.] 2.0",
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

def poly_l2_fit(f, deg, n=2000):
    x = (np.arange(n) + 0.5) / n
    V = np.vander(x, deg + 1, increasing=True)
    return np.linalg.lstsq(V, f(x), rcond=None)[0]

def l2_error(f, c, n=2000):
    x = (np.arange(n) + 0.5) / n
    r = f(x) - np.vander(x, len(c), increasing=True) @ c
    return float(np.sqrt(np.mean(r * r)))

c = poly_l2_fit(lambda t: t ** 2, 1)
print(np.round(c, 4), round(l2_error(lambda t: t ** 2, c), 4))
print(l2_error(np.exp, poly_l2_fit(np.exp, 3)) < 1e-3, l2_error(np.exp, poly_l2_fit(np.exp, 1)) < 1e-3)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[-0.1667  1.    ] 0.0745\nTrue False",
          "[0. 1.] 0.0745\nTrue False",
          "[-0.1667  1.    ] 0.0745\nTrue True",
          "[ 0.3333  0.    ] 0.2981\nTrue False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>weighted_lstsq(A, b, M)</C>, the x minimising <M>{"(b - Ax)^\\top M (b - Ax)"}</M> (A has independent
          columns, M is positive definite), and <C>min_norm_solution(A, b)</C>, the smallest-norm solution of Ax = b for A
          with independent rows.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def weighted_lstsq(A, b, M):
    return np.linalg.lstsq(A, b, rcond=None)[0]

def min_norm_solution(A, b):
    return np.zeros(A.shape[1])
`,
        solution: LSQ,
        tests: [
          { name: "weighted", code: `A = np.array([[1.0], [1.0]])
b = np.array([0.0, 3.0])
assert np.allclose(weighted_lstsq(A, b, np.eye(2)), [1.5])
assert np.allclose(weighted_lstsq(A, b, np.diag([2.0, 1.0])), [1.0])
rng = np.random.default_rng(0)
A = rng.normal(size=(6, 2)); b = rng.normal(size=6); M = np.diag(rng.uniform(0.5, 2, size=6))
x = weighted_lstsq(A, b, M)
assert np.allclose(A.T @ M @ (b - A @ x), 0)` },
          { name: "min norm", code: `rng = np.random.default_rng(1)
A = rng.normal(size=(2, 5)); b = rng.normal(size=2)
x = min_norm_solution(A, b)
assert np.allclose(A @ x, b)
assert np.allclose(x, np.linalg.pinv(A) @ b)
z = np.linalg.svd(A)[2][-1]
assert np.isclose(x @ z, 0) and np.linalg.norm(x + 0.1 * z) > np.linalg.norm(x)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>poly_l2_fit(f, deg, n=2000)</C>, the coefficients (constant first) of the best approximation of f on [0, 1]
          by a polynomial of degree at most deg, using the midpoint rule with n points for the integral, and{" "}
          <C>l2_error(f, c, n=2000)</C>, the L² distance between f and that polynomial, by the same rule.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def poly_l2_fit(f, deg, n=2000):
    return np.zeros(deg + 1)

def l2_error(f, c, n=2000):
    return 0.0
`,
        solution: `import numpy as np

${FIT}`,
        tests: [
          { name: "fit", code: `c = poly_l2_fit(lambda t: t ** 2, 1)
assert c.shape == (2,) and np.allclose(c, [-1 / 6, 1.0], atol=1e-6)
c0 = poly_l2_fit(lambda t: t ** 2, 0)
assert np.allclose(c0, [1 / 3], atol=1e-6)
c3 = poly_l2_fit(lambda t: 2 - t ** 3, 3)
assert np.allclose(c3, [2.0, 0.0, 0.0, -1.0], atol=1e-6)` },
          { name: "error", code: `assert abs(l2_error(lambda t: t ** 2, np.array([-1 / 6, 1.0])) - (1 / 180) ** 0.5) < 1e-6
assert isinstance(l2_error(np.exp, poly_l2_fit(np.exp, 2)), float)
errs = [l2_error(np.cos, poly_l2_fit(np.cos, d)) for d in range(5)]
assert all(a >= b - 1e-12 for a, b in zip(errs, errs[1:]))` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that if U is a finite-dimensional subspace of V, then ‖v − P_U v‖ ≤ ‖v − u‖ for every u ∈ U, with equality
          only when u = P_U v.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes v − u = (v − P_U v) + (P_U v − u) and notes the first term lies in U⊥ and the second in U.",
          "Applies Pythagoras to get ‖v − u‖² = ‖v − P_U v‖² + ‖P_U v − u‖², and concludes the inequality with equality iff P_U v − u = 0.",
        ],
      },
    },
    {
      key: "linear",
      rung: "stretch",
      prompt: (
        <p>
          With ⟨f, g⟩ = ∫₀¹ fg, the best approximation of f(x) = x² by a function a + bx is found by making the error orthogonal
          to 1 and to x. What is a?
        </p>
      ),
      answer: { kind: "numeric", value: -0.16666667, tolerance: 1e-4 },
    },
  ],

  teachBack:
    "Explain to a friend why the closest point of a subspace is the orthogonal projection, and use it to derive the normal equations, the minimum-norm solution and the best polynomial approximation of a function.",

  glimpse: (
    <>
      <p>
        So far the inner product space has been the main character. The next chapter turns to operators on it: subspaces an
        operator maps into themselves, the adjoint that moves an operator across the inner product, and the spectral theorem
        that diagonalises self-adjoint operators in an orthonormal basis.
      </p>
      <p>
        The minimum-norm solution reappears with the pseudoinverse, which handles matrices whose rows or columns are
        dependent, and which the SVD computes in one line.
      </p>
    </>
  ),
};
