import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { EigenSearchViz } from "@/components/viz/EigenSearchViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.7.1",
  minutes: 65,
  links: {
    requires: ["m3.6.1", "m3.3.1"],
    revisits: ["m0.2.6"],
    foreshadows: ["m3.7.2", "m11.4.1", "m6.3.1"],
  },

  puzzle: (
    <>
      <p>
        Apply the matrix A = [[4, 1], [2, 3]] to a vector, then again to the result, a hundred times. Most vectors swing round
        and grow enormously. Is there any vector that never swings round at all, only grows? Is there one that grows more slowly
        than all the others?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Most vectors change direction when a matrix acts on them. A few special ones, the <strong>eigenvectors</strong>, keep
        their direction and are only stretched, by a factor called the <strong>eigenvalue</strong>. Turn x round the circle
        below and watch Ax. Twice in half a turn, Ax lines up with x.
      </p>
      <EigenSearchViz />
    </>
  ),

  theory: (
    <>
      <Definition title="eigenvalues and eigenvectors">
        <p>
          A number λ is an <strong>eigenvalue</strong> of a square matrix A, with <strong>eigenvector</strong> x ≠ 0, if
        </p>
        <MD>{"A\\mathbf x = \\lambda\\mathbf x."}</MD>
      </Definition>

      <Theorem title="the characteristic equation">
        <p>λ is an eigenvalue of A exactly when</p>
        <MD>{"\\det(A - \\lambda I) = 0."}</MD>
        <p>
          The left side is a polynomial of degree n in λ, so an n × n matrix has n eigenvalues, counted with multiplicity,
          possibly complex.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"A\\mathbf x = \\lambda\\mathbf x"}</M> with x ≠ 0 says <M>{"(A - \\lambda I)\\mathbf x = \\mathbf 0"}</M> has a
          non-zero solution, which is exactly when <M>{"A - \\lambda I"}</M> is singular.
        </p>
      </Proof>

      <Example title="the puzzle">
        <MD>{"\\det\\begin{bmatrix} 4 - \\lambda & 1 \\\\ 2 & 3 - \\lambda \\end{bmatrix} = \\lambda^2 - 7\\lambda + 10 = (\\lambda - 5)(\\lambda - 2)."}</MD>
        <p>
          For λ = 5, (A − 5I)x = 0 gives x = (1, 1). For λ = 2, x = (1, −2). Applying A a hundred times multiplies (1, 1) by{" "}
          <M>{"5^{100}"}</M> and (1, −2) by <M>{"2^{100}"}</M>, without turning either. Every other vector is a combination of
          the two, and the <M>{"5^{100}"}</M> part swamps the rest, which is why they all swing towards the direction (1, 1).
        </p>
      </Example>

      <Theorem title="trace and determinant">
        <p>
          The sum of the eigenvalues is the trace (the sum of the diagonal entries), and their product is the determinant. For
          a triangular matrix, the eigenvalues are the diagonal entries.
        </p>
      </Theorem>

      <Theorem title="eigenvalues of related matrices">
        <p>
          If <M>{"A\\mathbf x = \\lambda\\mathbf x"}</M>, then <M>{"A^k\\mathbf x = \\lambda^k\\mathbf x"}</M>,{" "}
          <M>{"(A + cI)\\mathbf x = (\\lambda + c)\\mathbf x"}</M>, and, if A is invertible,{" "}
          <M>{"A^{-1}\\mathbf x = \\lambda^{-1}\\mathbf x"}</M>.
        </p>
      </Theorem>

      <Example title="no real eigenvectors">
        <p>
          A rotation by 90° turns every vector, so it has no real eigenvectors. Its characteristic equation is{" "}
          <M>{"\\lambda^2 + 1 = 0"}</M>, with eigenvalues ±i. Complex eigenvalues signal rotation.
        </p>
      </Example>

      <Remark title="computing eigenvalues">
        <p>
          No formula exists for the roots of a general polynomial of degree 5 or more, so eigenvalues of large matrices are
          always computed iteratively. The simplest method is the puzzle itself: multiply by A again and again, and the vector
          lines up with the eigenvector of largest |λ|. This is power iteration.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "def",
      rung: "check",
      prompt: <p>A x = 3x for some x ≠ 0. What can you conclude?</p>,
      answer: { kind: "choice", options: ["3 is an eigenvalue of A and x is an eigenvector", "A = 3I", "det A = 3", "x = 0"], correct: [0] },
    },
    {
      key: "tri",
      rung: "check",
      prompt: <p>Find the larger eigenvalue of the triangular matrix with rows (2, 5) and (0, 7).</p>,
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "sym",
      rung: "apply",
      prompt: <p>Find the larger eigenvalue of the matrix with rows (2, 1) and (1, 2).</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "trdet",
      rung: "apply",
      prompt: <p>Find the smaller eigenvalue of the matrix with rows (5, 2) and (2, 2), using the trace and determinant.</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "vec",
      rung: "apply",
      prompt: <p>Which vector is an eigenvector of A = [[4, 1], [2, 3]] with eigenvalue 2?</p>,
      answer: { kind: "choice", options: ["(1, −2)", "(1, 1)", "(2, 1)", "(1, 2)"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[4.0, 1.0], [2.0, 3.0]])
x = np.array([1.0, 0.0])
for _ in range(50):
    x = A @ x
    x = x / np.linalg.norm(x)
print(x @ A @ x)`}</Code>
          <p>What does this print, to the nearest whole number?</p>
        </>
      ),
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[2.0, 1.0], [1.0, 2.0]])
vals, vecs = np.linalg.eigh(A)
print(vals, np.trace(A), round(np.linalg.det(A), 6))`}</Code>
          <p>Eigenvalues, trace and determinant of a symmetric 2 × 2 matrix. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1. 3.] 4.0 3.0", "[3. 1.] 4.0 3.0", "[1. 3.] 4.0 4.0", "[2. 2.] 4.0 3.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>power_iteration(A, steps)</C>: start from x = (1, 1, …, 1), repeatedly set x to Ax divided by its length,
            and return (λ, x) with λ = xᵀAx.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def power_iteration(A, steps=100):
    A = np.asarray(A, float)
    x = np.ones(len(A)) / np.sqrt(len(A))
    return 0.0, x
`,
        solution: `import numpy as np

def power_iteration(A, steps=100):
    A = np.asarray(A, float)
    x = np.ones(len(A)) / np.sqrt(len(A))
    for _ in range(steps):
        x = A @ x
        x = x / np.linalg.norm(x)
    return float(x @ A @ x), x
`,
        tests: [
          { name: "lesson matrix", code: `import numpy as np
lam, x = power_iteration([[4, 1], [2, 3]])
assert abs(lam - 5) < 1e-6, 'The largest eigenvalue of [[4, 1], [2, 3]] is 5.'
assert abs(abs(x @ np.array([1, 1])) / np.sqrt(2) - 1) < 1e-6, 'x should line up with (1, 1).'` },
          { name: "unit length", code: `import numpy as np
lam, x = power_iteration([[2, 1], [1, 3]], 50)
assert abs(np.linalg.norm(x) - 1) < 1e-9, 'Normalise x at every step.'` },
          { name: "symmetric", code: `import numpy as np
S = np.array([[2, -1, 0], [-1, 2, -1], [0, -1, 2]], float)
lam, x = power_iteration(S, 500)
assert abs(lam - (2 + np.sqrt(2))) < 1e-6, 'For this matrix the top eigenvalue is 2 + √2.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>inverse_iteration(A, mu, steps)</C>, which finds the eigenvalue of A closest to a shift μ: factor A − μI once with <C>scipy.linalg.lu_factor</C>, repeatedly solve (A − μI)y = x and normalise, and return (λ, x) with λ the Rayleigh quotient xᵀAx/xᵀx. Then write <C>rayleigh_iteration(A, x0, steps)</C> for symmetric A, which updates the shift to the current Rayleigh quotient at every step (solving with <C>np.linalg.solve</C>) and stops early when the residual ‖Ax − λx‖ is below 1e−12; return (λ, x, steps used).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def inverse_iteration(A, mu, steps):
    return (mu, np.ones(len(A)))

def rayleigh_iteration(A, x0, steps):
    return (0.0, np.asarray(x0, float), 0)
`,
        solution: `import numpy as np

from scipy.linalg import lu_factor, lu_solve

def inverse_iteration(A, mu, steps):
    A = np.asarray(A, float)
    n = len(A)
    lu = lu_factor(A - mu * np.eye(n))
    x = np.ones(n) / np.sqrt(n)
    for _ in range(steps):
        y = lu_solve(lu, x)
        x = y / np.linalg.norm(y)
    return (float(x @ A @ x), x)

def rayleigh_iteration(A, x0, steps):
    A = np.asarray(A, float)
    x = np.asarray(x0, float)
    x = x / np.linalg.norm(x)
    lam = float(x @ A @ x)
    for k in range(1, steps + 1):
        if np.linalg.norm(A @ x - lam * x) < 1e-12:
            return (lam, x, k - 1)
        try:
            y = np.linalg.solve(A - lam * np.eye(len(A)), x)
        except np.linalg.LinAlgError:
            return (lam, x, k - 1)
        x = y / np.linalg.norm(y)
        lam = float(x @ A @ x)
    return (lam, x, steps)
`,
        tests: [
          { name: "closest", code: `import numpy as np
A = np.diag([1.0, 4.0, 9.0]) + 0.1 * np.ones((3, 3))
vals = np.linalg.eigvalsh(A)
for mu in (0, 3.5, 10):
    lam, x = inverse_iteration(A, mu, 50)
    assert abs(lam - vals[np.argmin(abs(vals - mu))]) < 1e-10 and np.allclose(A @ x, lam * x, atol=1e-8), mu` },
          { name: "vector", code: `import numpy as np
lam, x = inverse_iteration([[2.0, 1.0], [1.0, 2.0]], 0.9, 30)
assert abs(lam - 1) < 1e-12 and np.allclose(abs(x), [2 ** -0.5, 2 ** -0.5]), 'λ = 1 with eigenvector (1, −1).'` },
          { name: "rayleigh", code: `import numpy as np
rng = np.random.default_rng(19)
B = rng.normal(size=(8, 8))
A = B + B.T
lam, x, k = rayleigh_iteration(A, rng.normal(size=8), 50)
assert np.min(abs(np.linalg.eigvalsh(A) - lam)) < 1e-10 and k <= 10, f'Cubic convergence: done in {k} steps.'` },
          { name: "one lu", code: `import inspect
src = inspect.getsource(inverse_iteration)
assert src.count('lu_factor(') == 1 and 'for' in src.split('lu_factor(')[1], 'Factor once, outside the loop.'` },
        ],
      },
    },
    {
      key: "indep",
      rung: "prove",
      prompt: (
        <p>
          Prove that eigenvectors <M>{"\\mathbf x_1, \\mathbf x_2"}</M> belonging to different eigenvalues{" "}
          <M>{"\\lambda_1 \\ne \\lambda_2"}</M> are linearly independent.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Supposes c₁x₁ + c₂x₂ = 0.",
          "Applies A to get c₁λ₁x₁ + c₂λ₂x₂ = 0, and subtracts λ₂ times the original equation.",
          "Obtains c₁(λ₁ − λ₂)x₁ = 0, so c₁ = 0 since λ₁ ≠ λ₂ and x₁ ≠ 0; then c₂ = 0 similarly.",
        ],
      },
    },
    {
      key: "rot",
      rung: "stretch",
      prompt: <p>How many real eigenvalues does the 90° rotation matrix with rows (0, −1) and (1, 0) have?</p>,
      answer: { kind: "numeric", value: 0 },
    },
  ],

  teachBack:
    "Explain to a friend what an eigenvector and eigenvalue are, how det(A − λI) = 0 finds them, and why repeatedly applying a matrix turns almost every vector towards the eigenvector with the largest eigenvalue.",

  glimpse: (
    <p>
      Next, diagonalisation: using a basis of eigenvectors, a matrix becomes a list of independent stretches. Numerical Linear
      Algebra and Scientific Computing develops power iteration and the QR algorithm, and Linear Algebra II studies eigenvalues
      through invariant subspaces.
    </p>
  ),
};
