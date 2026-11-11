import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { DiagonaliseViz } from "@/components/viz/DiagonaliseViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.7.2",
  minutes: 60,
  links: {
    requires: ["m3.7.1", "m3.4.4"],
    foreshadows: ["m3.7.3", "m11.7.1", "m3.8.2"],
  },

  puzzle: (
    <>
      <p>
        The Fibonacci numbers 0, 1, 1, 2, 3, 5, 8, … satisfy <M>{"F_{k+2} = F_{k+1} + F_k"}</M>. Computing <M>{"F_{1000}"}</M>{" "}
        by the rule takes a thousand steps.
      </p>
      <p>
        Is there a formula for <M>{"F_k"}</M> that jumps straight to the answer? And why does the ratio{" "}
        <M>{"F_{k+1}/F_k"}</M> settle down to 1.618…?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In the basis of its eigenvectors, a matrix does the simplest possible thing: it stretches each coordinate by its own
        eigenvalue, with no mixing. So to apply A, change to eigenvector coordinates, stretch, and change back. Step through
        the three moves below for A = [[4, 1], [2, 3]].
      </p>
      <DiagonaliseViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="diagonalisation">
        <p>
          If an n × n matrix A has n independent eigenvectors <M>{"\\mathbf x_1, \\dots, \\mathbf x_n"}</M>, put them as the
          columns of X and the eigenvalues on the diagonal of Λ. Then
        </p>
        <MD>{"AX = X\\Lambda, \\qquad A = X\\Lambda X^{-1}, \\qquad \\Lambda = X^{-1}AX."}</MD>
      </Theorem>
      <Proof>
        <p>
          Column j of AX is <M>{"A\\mathbf x_j = \\lambda_j\\mathbf x_j"}</M>, which is column j of XΛ. X is invertible because
          its columns are independent.
        </p>
      </Proof>

      <Theorem title="when it works">
        <p>
          If the n eigenvalues are distinct, the eigenvectors are independent and A is diagonalisable. With repeated eigenvalues
          it may fail: [[1, 1], [0, 1]] has eigenvalue 1 twice but only one independent eigenvector.
        </p>
      </Theorem>

      <Theorem title="powers">
        <p>
          <M>{"A^k = X\\Lambda^kX^{-1}"}</M>. Equivalently, if <M>{"\\mathbf u_0 = c_1\\mathbf x_1 + \\dots + c_n\\mathbf x_n"}</M>, then
        </p>
        <MD>{"A^k\\mathbf u_0 = c_1\\lambda_1^k\\mathbf x_1 + \\dots + c_n\\lambda_n^k\\mathbf x_n."}</MD>
      </Theorem>
      <Proof>
        <p>
          <M>{"A^2 = X\\Lambda X^{-1}X\\Lambda X^{-1} = X\\Lambda^2X^{-1}"}</M>; the inner X⁻¹X cancels every time.
        </p>
      </Proof>

      <Example title="the puzzle">
        <p>
          With <M>{"\\mathbf u_k = (F_{k+1}, F_k)"}</M>, the rule is <M>{"\\mathbf u_{k+1} = A\\mathbf u_k"}</M> with A = [[1, 1], [1,
          0]]. Its eigenvalues solve <M>{"\\lambda^2 - \\lambda - 1 = 0"}</M>:{" "}
          <M>{"\\lambda_1 = (1 + \\sqrt5)/2 \\approx 1.618"}</M> and <M>{"\\lambda_2 = (1 - \\sqrt5)/2 \\approx -0.618"}</M>.
          Writing <M>{"\\mathbf u_0 = (1, 0)"}</M> in the eigenvector basis gives
        </p>
        <MD>{"F_k = \\frac{\\lambda_1^k - \\lambda_2^k}{\\sqrt5}."}</MD>
        <p>
          Since <M>{"|\\lambda_2| < 1"}</M>, its term dies away, and <M>{"F_{k+1}/F_k \\to \\lambda_1"}</M>, the golden ratio.
        </p>
      </Example>

      <Remark title="similar matrices">
        <p>
          Matrices <M>{"A"}</M> and <M>{"B^{-1}AB"}</M> are called similar: they are the same map described in two bases, and
          they have the same eigenvalues. Diagonalising is choosing the basis in which the description is simplest.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cols",
      rung: "check",
      prompt: <p>In A = XΛX⁻¹, what are the columns of X?</p>,
      answer: { kind: "choice", options: ["Eigenvectors of A", "Eigenvalues of A", "Columns of A", "Rows of A"], correct: [0] },
    },
    {
      key: "distinct",
      rung: "check",
      prompt: <p>A 3 × 3 matrix has eigenvalues 1, 2 and 5. Is it diagonalisable?</p>,
      answer: { kind: "choice", options: ["Yes, always", "No, never", "Only if it is symmetric"], correct: [0] },
    },
    {
      key: "power",
      rung: "apply",
      prompt: <p>For A = [[4, 1], [2, 3]], compute <M>{"A^3"}</M>(1, 1). Give the first entry.</p>,
      answer: { kind: "numeric", value: 125 },
    },
    {
      key: "square",
      rung: "apply",
      prompt: (
        <p>
          For the same A, write x = (2, 0.5) as 1.5(1, 1) + 0.5(1, −2) and compute <M>{"A^2\\mathbf x"}</M>. Give the first
          entry.
        </p>
      ),
      answer: { kind: "numeric", value: 39.5 },
    },
    {
      key: "fail",
      rung: "apply",
      prompt: <p>Which matrices cannot be diagonalised? Rows are separated by semicolons. Select all that apply.</p>,
      answer: { kind: "choice", options: ["[1 1; 0 1]", "[2 0; 0 3]", "[1 2; 2 1]", "[0 1; 0 0]"], correct: [0, 3] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[4.0, 1.0], [2.0, 3.0]])
lam, X = np.linalg.eig(A)
lam, X = lam.real, X.real
A5 = X @ np.diag(lam ** 5) @ np.linalg.inv(X)
print(round(np.trace(A5)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 3157 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[4.0, 1.0], [2.0, 3.0]])
vals, X = np.linalg.eig(A)
print(np.sort(vals.real), np.allclose(X @ np.diag(vals) @ np.linalg.inv(X), A))`}</Code>
          <p>Eigenvalues of [[4, 1], [2, 3]] and the check A = XΛX⁻¹. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[2. 5.] True", "[3. 4.] True", "[2. 5.] False", "[1. 6.] True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>power_by_eig(A, k)</C>, which returns Aᵏ computed as XΛᵏX⁻¹ from <C>np.linalg.eig</C>. Return the real part,
            since the inputs here have real eigenvalues.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def power_by_eig(A, k):
    return np.asarray(A, float)
`,
        solution: `import numpy as np

def power_by_eig(A, k):
    lam, X = np.linalg.eig(np.asarray(A, float))
    return np.real(X @ np.diag(lam ** k) @ np.linalg.inv(X))
`,
        tests: [
          { name: "cube", code: `import numpy as np
assert np.allclose(power_by_eig([[4, 1], [2, 3]], 3), np.linalg.matrix_power(np.array([[4, 1], [2, 3]]), 3)), 'Compare with multiplying A by itself three times.'` },
          { name: "Fibonacci", code: `F = power_by_eig([[1, 1], [1, 0]], 30)
assert round(F[0, 1]) == 832040, 'The off-diagonal entry of the 30th power is F₃₀ = 832040.'` },
          { name: "zero power", code: `import numpy as np
assert np.allclose(power_by_eig([[2, 1], [1, 2]], 0), np.eye(2)), 'A to the power 0 is the identity.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>matrix_function(A, f)</C>, f(A) = X f(Λ) X⁻¹ for a diagonalisable matrix and a scalar function f applied to the eigenvalues (allow complex eigenvalues and return the real part when the imaginary part is below 1e−10, raising <C>ValueError</C> if X is too ill-conditioned: condition number above 1e12). Use it in <C>expm(A)</C> and <C>sqrtm(A)</C>. Then write <C>is_diagonalisable(A)</C>, true when the eigenvector matrix has condition number below 1e8.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def matrix_function(A, f):
    return f(np.asarray(A, float))

def expm(A):
    return matrix_function(A, np.exp)

def sqrtm(A):
    return matrix_function(A, np.sqrt)

def is_diagonalisable(A):
    return True
`,
        solution: `import numpy as np

def matrix_function(A, f):
    A = np.asarray(A, float)
    vals, X = np.linalg.eig(A)
    if np.linalg.cond(X) > 1e12:
        raise ValueError('not diagonalisable')
    F = X @ np.diag(f(vals.astype(complex))) @ np.linalg.inv(X)
    if np.abs(F.imag).max() < 1e-10:
        return F.real
    return F

def expm(A):
    return matrix_function(A, np.exp)

def sqrtm(A):
    return matrix_function(A, np.sqrt)

def is_diagonalisable(A):
    vals, X = np.linalg.eig(np.asarray(A, float))
    return bool(np.linalg.cond(X) < 1e8)
`,
        tests: [
          { name: "exp", code: `import numpy as np
from scipy.linalg import expm as ref
A = np.array([[4.0, 1.0], [2.0, 3.0]])
assert np.allclose(expm(A), ref(A)), 'Agree with SciPy.'` },
          { name: "rotation", code: `import numpy as np
t = 0.7
A = np.array([[0.0, -t], [t, 0.0]])
assert np.allclose(expm(A), [[np.cos(t), -np.sin(t)], [np.sin(t), np.cos(t)]]), 'Complex eigenvalues ±it give a rotation.'` },
          { name: "sqrt", code: `import numpy as np
rng = np.random.default_rng(20)
B = rng.normal(size=(4, 4))
S = B @ B.T + np.eye(4)
Rt = sqrtm(S)
assert np.allclose(Rt @ Rt, S) and np.allclose(Rt, Rt.T), 'The square root of a positive definite matrix.'` },
          { name: "defective", code: `assert not is_diagonalisable([[1.0, 1.0], [0.0, 1.0]]) and is_diagonalisable([[2.0, 0.0], [0.0, 2.0]])
try:
    expm([[1.0, 1.0], [0.0, 1.0]])
    ok = False
except ValueError:
    ok = True
assert ok, 'A Jordan block cannot be diagonalised.'` },
        ],
      },
    },
    {
      key: "powers",
      rung: "prove",
      prompt: (
        <p>
          Prove that if <M>{"A = X\\Lambda X^{-1}"}</M>, then <M>{"A^k = X\\Lambda^kX^{-1}"}</M> for every positive integer k,
          and that if every |λ| &lt; 1 then <M>{"A^k \\to 0"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses induction: A^(k+1) = A^k A = XΛ^kX⁻¹XΛX⁻¹ = XΛ^(k+1)X⁻¹.",
          "Notes Λ^k is diagonal with entries λ_i^k.",
          "If every |λ_i| < 1, each λ_i^k → 0, so Λ^k → 0 and A^k = XΛ^kX⁻¹ → 0, X and X⁻¹ being fixed.",
        ],
      },
    },
    {
      key: "golden",
      rung: "stretch",
      prompt: <p>Find the larger eigenvalue of [[1, 1], [1, 0]] to three decimal places.</p>,
      answer: { kind: "numeric", value: 1.618, tolerance: 0.0005 },
    },
  ],

  teachBack:
    "Explain to a friend how a basis of eigenvectors turns a matrix into separate stretches, why that makes powers of the matrix easy, and how it gives a formula for the Fibonacci numbers.",

  glimpse: (
    <p>
      Next, powers of matrices in action: Markov chains, where repeated multiplication settles to a steady state. Numerical
      Linear Algebra and Scientific Computing uses the same idea to define the matrix exponential.
    </p>
  ),
};
