import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { KroneckerViz } from "@/components/viz/KroneckerViz";
import type { LessonContent } from "@/lib/types";

const KRON = `import numpy as np

def kron(A, B):
    m, n = A.shape
    p, q = B.shape
    K = np.zeros((m * p, n * q))
    for i in range(m):
        for j in range(n):
            K[i * p:(i + 1) * p, j * q:(j + 1) * q] = A[i, j] * B
    return K

def kron_matvec(A, B, x):
    X = x.reshape(A.shape[1], B.shape[1])
    return (A @ X @ B.T).ravel()`;

const KSOLVE = `def kron_solve(A, B, y):
    Y = y.reshape(A.shape[0], B.shape[0])
    Z = np.linalg.solve(A, Y)
    return np.linalg.solve(B, Z.T).T.ravel()

def kron_eigvals(A, B):
    return np.sort(np.outer(np.linalg.eigvals(A), np.linalg.eigvals(B)).ravel().real)`;

export const lesson: LessonContent = {
  id: "m6.6.5",
  minutes: 55,
  links: {
    requires: ["m6.6.3", "m6.4.1"],
    revisits: ["m6.3.3"],
    foreshadows: ["m6.7.2"],
  },

  puzzle: (
    <>
      <p>
        The curvature matrix of a layer with a 1000×1000 weight matrix is 10⁶×10⁶, far too big to store, let alone invert.
        K-FAC and Shampoo approximate it by a &ldquo;product&rdquo; of a 1000×1000 matrix for the inputs and one for the
        outputs, and invert only those. What is this product, and why do inverses, eigenvalues and SVDs pass through it so
        easily?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The Kronecker product A ⊗ B puts a scaled copy of B in each position of A. It is the matrix of the linear map that
        acts by A on one index of a two-index array and by B on the other. Acting on two indices separately means everything
        factorises: inverses, eigenvectors and singular vectors of the big matrix are built from those of the small ones.
      </p>
      <KroneckerViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Kronecker product">
        <p>
          For A (m×n) and B (p×q), <M>{"A \\otimes B"}</M> is the mp×nq block matrix whose (i, j) block is{" "}
          <M>{"a_{ij}B"}</M>. Equivalently, indexing rows by pairs (i, k) and columns by pairs (j, l) in row-major order,{" "}
          <M>{"(A \\otimes B)_{(i,k),(j,l)} = a_{ij}b_{kl}"}</M>. It is bilinear and associative, and{" "}
          <M>{"(A \\otimes B)^\\top = A^\\top \\otimes B^\\top"}</M>.
        </p>
      </Definition>

      <Theorem title="mixed-product property">
        <p>
          When the products are defined, <M>{"(A \\otimes B)(C \\otimes D) = (AC) \\otimes (BD)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The (i, j) block of the left side is{" "}
          <M>{"\\sum_l (a_{il}B)(c_{lj}D) = \\left(\\sum_l a_{il}c_{lj}\\right)BD = (AC)_{ij}\\,BD"}</M>, which is the (i, j)
          block of <M>{"(AC) \\otimes (BD)"}</M>.
        </p>
      </Proof>

      <Theorem title="consequences">
        <p>
          (1) <M>{"(A \\otimes B)^{-1} = A^{-1} \\otimes B^{-1}"}</M>. (2) If <M>{"Au = \\lambda u"}</M> and{" "}
          <M>{"Bv = \\mu v"}</M> then <M>{"(A \\otimes B)(u \\otimes v) = \\lambda\\mu\\,(u \\otimes v)"}</M>; for
          diagonalisable A, B this gives all eigenvalues. (3) If <M>{"A = U_1\\Sigma_1V_1^\\top"}</M> and{" "}
          <M>{"B = U_2\\Sigma_2V_2^\\top"}</M> then{" "}
          <M>{"A \\otimes B = (U_1 \\otimes U_2)(\\Sigma_1 \\otimes \\Sigma_2)(V_1 \\otimes V_2)^\\top"}</M> is an SVD up to
          ordering, so singular values multiply, rank(A ⊗ B) = rank A · rank B and κ(A ⊗ B) = κ(A)κ(B). (4) For A m×m and B
          n×n, <M>{"\\det(A \\otimes B) = \\det(A)^n\\det(B)^m"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          (1) <M>{"(A \\otimes B)(A^{-1} \\otimes B^{-1}) = I \\otimes I = I"}</M>. (2) is the mixed product with C = u and D
          = v. (3) Kronecker products of matrices with orthonormal columns have orthonormal columns, since{" "}
          <M>{"(U_1 \\otimes U_2)^\\top(U_1 \\otimes U_2) = U_1^\\top U_1 \\otimes U_2^\\top U_2 = I"}</M>, and a Kronecker
          product of diagonal matrices is diagonal. (4) Over ℂ, triangularise A and B; the product of the eigenvalues{" "}
          <M>{"\\lambda_i\\mu_j"}</M> over all pairs is <M>{"(\\prod\\lambda_i)^n(\\prod\\mu_j)^m"}</M>.
        </p>
      </Proof>

      <Theorem title="the vec trick">
        <p>
          Flatten an n×q matrix X row by row into x. Then <M>{"(A \\otimes B)x"}</M> is the row-by-row flattening of{" "}
          <M>{"AXB^\\top"}</M>. (With column stacking the same fact reads{" "}
          <M>{"\\operatorname{vec}(AXB) = (B^\\top \\otimes A)\\operatorname{vec}(X)"}</M>.)
        </p>
      </Theorem>
      <Proof>
        <p>
          Entry (i, k) of the product is{" "}
          <M>{"\\sum_{j,l} a_{ij}b_{kl}x_{jl} = \\sum_j a_{ij}\\sum_l x_{jl}b_{kl} = (AXB^\\top)_{ik}"}</M>.
        </p>
      </Proof>
      <p>
        So multiplying by an mp×nq Kronecker product costs two ordinary matrix products, O(mnq + mpq) instead of O(mnpq),
        and solving costs two small solves.
      </p>
      <Code>{KRON}</Code>

      <Example title="Kronecker sums and grids">
        <p>
          The Kronecker sum <M>{"A \\oplus B = A \\otimes I + I \\otimes B"}</M> has eigenvalues <M>{"\\lambda_i + \\mu_j"}</M>{" "}
          with the same eigenvectors <M>{"u_i \\otimes v_j"}</M>. The discrete Laplacian on an m×n grid is the Kronecker sum
          of two 1-D Laplacians, and a Gaussian process with a product kernel on a grid has covariance{" "}
          <M>{"K_1 \\otimes K_2"}</M>, whose solves and log-determinants need only the eigendecompositions of the two factors.
          The 2-D DFT is <M>{"F_m \\otimes F_n"}</M>.
        </p>
        <Code>{KSOLVE}</Code>
      </Example>

      <Remark title="K-FAC and Shampoo">
        <p>
          For a linear layer with input a and output gradient g, the weight gradient is <M>{"ga^\\top"}</M>, and its
          flattening, stacking columns, is <M>{"a \\otimes g"}</M>. The curvature <M>{"\\mathbb{E}[(a \\otimes g)(a \\otimes g)^\\top] = \\mathbb{E}[aa^\\top \\otimes gg^\\top]"}</M>{" "}
          is approximated by <M>{"\\mathbb{E}[aa^\\top] \\otimes \\mathbb{E}[gg^\\top]"}</M>, which is cheap to invert by
          property (1). Applying the inverse to the gradient matrix G is then, by the column-stacking form of the vec trick,{" "}
          <M>{"\\mathbb{E}[gg^\\top]^{-1}G\\,\\mathbb{E}[aa^\\top]^{-1}"}</M>: two small solves.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "shape",
      rung: "check",
      prompt: <p>A is 3×4 and B is 2×5. How many rows does A ⊗ B have?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "det",
      rung: "check",
      prompt: <p>A and B are 2×2 with det A = 3 and det B = 2. What is det(A ⊗ B)?</p>,
      answer: { kind: "numeric", value: 36 },
    },
    {
      key: "mixed",
      rung: "apply",
      prompt: <p>For compatible matrices, which identity always holds?</p>,
      answer: { kind: "choice", options: ["(A ⊗ B)(C ⊗ D) = (AC) ⊗ (BD)", "(A ⊗ B)(C ⊗ D) = (AC) ⊗ (DB)", "(A ⊗ B)(C ⊗ D) = (CA) ⊗ (BD)", "(A ⊗ B) + (C ⊗ D) = (A + C) ⊗ (B + D)"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def kron(A, B):
    m, n = A.shape
    p, q = B.shape
    K = np.zeros((m * p, n * q))
    for i in range(m):
        for j in range(n):
            K[i * p:(i + 1) * p, j * q:(j + 1) * q] = A[i, j] * B
    return K

def kron_matvec(A, B, x):
    X = x.reshape(A.shape[1], B.shape[1])
    return (A @ X @ B.T).ravel()

A = np.array([[1.0, 2.0], [0.0, 1.0]])
B = np.array([[0.0, 1.0], [1.0, 0.0]])
print(kron(A, B))
x = np.arange(4.0)
print(kron_matvec(A, B, x), kron(A, B) @ x)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0. 1. 0. 2.]\n [1. 0. 2. 0.]\n [0. 0. 0. 1.]\n [0. 0. 1. 0.]]\n[7. 4. 3. 2.] [7. 4. 3. 2.]",
          "[[0. 1. 0. 2.]\n [1. 0. 2. 0.]\n [0. 0. 0. 1.]\n [0. 0. 1. 0.]]\n[4. 7. 2. 3.] [7. 4. 3. 2.]",
          "[[0. 0. 1. 2.]\n [0. 0. 0. 1.]\n [1. 2. 0. 0.]\n [0. 1. 0. 0.]]\n[7. 4. 3. 2.] [7. 4. 3. 2.]",
          "[[0. 1. 0. 2.]\n [1. 0. 2. 0.]\n [0. 0. 0. 1.]\n [0. 0. 1. 0.]]\n[7. 4. 3. 2.] [5. 4. 3. 2.]",
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

def kron_solve(A, B, y):
    Y = y.reshape(A.shape[0], B.shape[0])
    Z = np.linalg.solve(A, Y)
    return np.linalg.solve(B, Z.T).T.ravel()

def kron_eigvals(A, B):
    return np.sort(np.outer(np.linalg.eigvals(A), np.linalg.eigvals(B)).ravel().real)

A2 = np.array([[2.0, 0.0], [1.0, 3.0]])
B2 = np.array([[1.0, 1.0], [0.0, 2.0]])
x2 = kron_solve(A2, B2, np.array([1.0, 2.0, 3.0, 4.0]))
print(np.round(x2, 4), np.allclose(np.kron(A2, B2) @ x2, [1.0, 2.0, 3.0, 4.0]))
print(kron_eigvals(A2, B2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0.     0.5    0.3333 0.5   ] True\n[2. 3. 4. 6.]", "[0.     0.5    0.3333 0.5   ] True\n[3. 4. 5. 5.]", "[0.5    0.     0.5    0.3333] True\n[2. 3. 4. 6.]", "[0.     0.5    0.3333 0.5   ] False\n[2. 3. 4. 6.]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kron(A, B)</C> without <C>np.kron</C>, filling the (i, j) block with A[i, j]·B, and{" "}
          <C>kron_matvec(A, B, x)</C>, computing (A ⊗ B)x by the vec trick without forming A ⊗ B (reshape x row by row).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def kron(A, B):
    return np.outer(A, B)

def kron_matvec(A, B, x):
    return x
`,
        solution: KRON,
        tests: [
          { name: "kron", code: `rng = np.random.default_rng(0)
A, B = rng.normal(size=(2, 3)), rng.normal(size=(4, 2))
assert np.allclose(kron(A, B), np.kron(A, B)) and kron(A, B).shape == (8, 6)
C, D = rng.normal(size=(3, 2)), rng.normal(size=(2, 3))
assert np.allclose(kron(A, B) @ kron(C, D), kron(A @ C, B @ D))` },
          { name: "matvec", code: `rng = np.random.default_rng(1)
A, B = rng.normal(size=(3, 4)), rng.normal(size=(5, 2))
x = rng.normal(size=8)
assert np.allclose(kron_matvec(A, B, x), np.kron(A, B) @ x)
assert kron_matvec(A, B, x).shape == (15,)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For square invertible A and B, write <C>kron_solve(A, B, y)</C>, solving (A ⊗ B)x = y with two small solves, and{" "}
          <C>kron_eigvals(A, B)</C>, the sorted real parts of all products of an eigenvalue of A with one of B.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def kron_solve(A, B, y):
    return y

def kron_eigvals(A, B):
    return np.sort(np.concatenate([np.linalg.eigvals(A), np.linalg.eigvals(B)]).real)
`,
        solution: `import numpy as np

${KSOLVE}`,
        tests: [
          { name: "solve", code: `rng = np.random.default_rng(2)
A, B = rng.normal(size=(3, 3)) + 3 * np.eye(3), rng.normal(size=(4, 4)) + 3 * np.eye(4)
y = rng.normal(size=12)
x = kron_solve(A, B, y)
assert np.allclose(np.kron(A, B) @ x, y)` },
          { name: "eigs", code: `rng = np.random.default_rng(3)
X, Y = rng.normal(size=(3, 3)), rng.normal(size=(2, 2))
A, B = X + X.T, Y + Y.T
assert np.allclose(kron_eigvals(A, B), np.sort(np.linalg.eigvalsh(np.kron(A, B))))
assert np.allclose(kron_eigvals(np.diag([2.0, 3.0]), np.diag([1.0, 2.0])), [2.0, 3.0, 4.0, 6.0])` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove the mixed-product property (A ⊗ B)(C ⊗ D) = (AC) ⊗ (BD), and deduce (A ⊗ B)⁻¹ = A⁻¹ ⊗ B⁻¹ for invertible A, B.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Computes the (i, j) block of the product as Σₗ (aᵢₗB)(cₗⱼD) = (Σₗ aᵢₗcₗⱼ)BD = (AC)ᵢⱼBD.",
          "Recognises this as the (i, j) block of (AC) ⊗ (BD).",
          "Deduces (A ⊗ B)(A⁻¹ ⊗ B⁻¹) = I ⊗ I = I (and similarly on the other side), so the inverse is A⁻¹ ⊗ B⁻¹.",
        ],
      },
    },
    {
      key: "ksum",
      rung: "stretch",
      prompt: <p>A has eigenvalues 1 and 3, B has eigenvalues 2 and 5. What is the largest eigenvalue of A ⊗ I + I ⊗ B?</p>,
      answer: { kind: "numeric", value: 8 },
    },
  ],

  teachBack:
    "Explain to a friend what a Kronecker product is, why the mixed-product property makes its inverse, eigenvalues and SVD come from the factors, and how the vec trick lets you multiply by it cheaply.",

  glimpse: (
    <>
      <p>
        The Kronecker product is the matrix form of a tensor product of linear maps. The last chapter makes that precise:
        bilinear and quadratic forms first, then tensors and tensor products as spaces in their own right.
      </p>
      <p>
        After that, einsum notation expresses every contraction in this chapter (matrix products, traces, the vec trick,
        Kronecker products) in one uniform language, and tensor decompositions generalise the SVD to arrays with three or more
        indices.
      </p>
    </>
  ),
};
