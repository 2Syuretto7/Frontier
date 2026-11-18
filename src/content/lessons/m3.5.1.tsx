import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { ComplementViz } from "@/components/viz/ComplementViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.5.1",
  minutes: 55,
  links: {
    requires: ["m3.4.5", "m3.1.2"],
    foreshadows: ["m6.2.3", "m3.5.2"],
  },

  puzzle: (
    <>
      <p>
        A sensor reports a single number, x₁ + x₂, about a two-dimensional state (x₁, x₂). Two states that differ by (1, −1)
        give the same reading.
      </p>
      <p>
        Which part of the state does the sensor see, and which part is invisible to it? Can every state be split cleanly into a
        visible part and an invisible part?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Ax = 0 says that x has dot product zero with every row of A: x is perpendicular to the row space. So the null space and
        the row space are perpendicular. Below, the solid line is the row space of a rank one matrix and the dashed line its
        null space. Turn the rows and move the point: every point splits into one piece along each line, and the pieces meet
        at a right angle.
      </p>
      <ComplementViz />
    </>
  ),

  theory: (
    <>
      <Definition title="orthogonal subspaces and complements">
        <p>
          Subspaces V and W are <strong>orthogonal</strong> if <M>{"\\mathbf v \\cdot \\mathbf w = 0"}</M> for every v in V
          and w in W. The <strong>orthogonal complement</strong> <M>{"V^\\perp"}</M> of V is the set of all vectors orthogonal
          to every vector in V; it is a subspace.
        </p>
      </Definition>

      <Theorem title="the fundamental theorem, part two">
        <p>For every m × n matrix A,</p>
        <MD>{"N(A) = C(A^{\\mathsf T})^\\perp \\text{ in } \\mathbb R^n, \\qquad N(A^{\\mathsf T}) = C(A)^\\perp \\text{ in } \\mathbb R^m."}</MD>
      </Theorem>
      <Proof>
        <p>
          The i-th entry of Ax is (row i) · x. So Ax = 0 exactly when x is orthogonal to every row, which is exactly when x is
          orthogonal to every combination of rows. The second statement is the first applied to <M>{"A^{\\mathsf T}"}</M>.
        </p>
      </Proof>

      <Theorem title="splitting a vector">
        <p>
          If V is a subspace of <M>{"\\mathbb R^n"}</M>, then <M>{"\\dim V + \\dim V^\\perp = n"}</M>, and every x can be
          written in exactly one way as x = v + w with v in V and w in <M>{"V^\\perp"}</M>. Then{" "}
          <M>{"\\|\\mathbf x\\|^2 = \\|\\mathbf v\\|^2 + \\|\\mathbf w\\|^2"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take V as the row space of a matrix A whose rows are a basis of V. Then <M>{"V^\\perp = N(A)"}</M> has dimension n − dim V.
          A basis of V together with a basis of <M>{"V^\\perp"}</M> gives n vectors; they are independent because a vector in
          both spaces is orthogonal to itself, so it is zero. Hence they form a basis of <M>{"\\mathbb R^n"}</M>, which gives the
          split. Pythagoras follows because v · w = 0.
        </p>
      </Proof>

      <Example title="the puzzle">
        <p>
          The sensor is A = [1 1]. Its row space is the line through (1, 1): this is what it sees. Its null space is the line
          through (1, −1): this is invisible. The state (3, 1) splits as (2, 2) + (1, −1). The reading depends only on the first
          piece.
        </p>
      </Example>

      <Remark title="every matrix, in one picture">
        <p>
          The input space splits into row space and null space, the output space into column space and left null space, at
          right angles. A kills the null space and maps the row space onto the column space, one to one.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "orth",
      rung: "check",
      prompt: <p>Are (1, 2, −1) and (3, −1, 1) orthogonal?</p>,
      answer: { kind: "choice", options: ["Yes", "No"], correct: [0] },
    },
    {
      key: "which",
      rung: "check",
      prompt: <p>The null space of A is the orthogonal complement of which subspace?</p>,
      answer: { kind: "choice", options: ["The row space of A", "The column space of A", "The left null space of A", "The null space of Aᵀ"], correct: [0] },
    },
    {
      key: "c",
      rung: "apply",
      prompt: <p>For which c is (1, c, 2) orthogonal to (3, 1, −2)?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "dim",
      rung: "apply",
      prompt: <p>What is the dimension of the orthogonal complement of the line through (1, 1, 1) in <M>{"\\mathbb R^3"}</M>?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "perp",
      rung: "apply",
      prompt: <p>Which vectors lie in the null space of A = [1 2 3]? Select all that apply.</p>,
      answer: { kind: "choice", options: ["(−2, 1, 0)", "(−3, 0, 1)", "(1, 1, −1)", "(1, 1, 1)"], correct: [0, 1, 2] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[1.0, 1.0]])
x = np.array([3.0, 1.0])
xr = A.T @ np.linalg.solve(A @ A.T, A @ x)
xn = x - xr
print(xr @ xn, xn[0])`}</Code>
          <p>This prints two numbers. What is the second?</p>
        </>
      ),
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[1.0, 1.0, 0.0], [0.0, 1.0, 1.0]])
x = np.array([1.0, -1.0, 1.0])
print(A @ x, np.cross(A[0], A[1]))`}</Code>
          <p>Is x orthogonal to the row space of A? The cross product of the rows gives the null direction. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0. 0.] [ 1. -1.  1.]", "[0. 0.] [-1.  1. -1.]", "[1. 0.] [ 1. -1.  1.]", "[0. 0.] [1. 1. 1.]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>split(A, x)</C>, which returns (xr, xn): the part of x in the row space of A and the part in its null space,
            with xr + xn = x, for A with independent rows. The row space part is a combination xr = Aᵀc of the rows, and
            A(x − xr) = 0 gives (AAᵀ)c = Ax: solve that for c.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def split(A, x):
    x = np.asarray(x, float)
    return x, np.zeros_like(x)
`,
        solution: `import numpy as np

def split(A, x):
    A, x = np.asarray(A, float), np.asarray(x, float)
    xr = A.T @ np.linalg.solve(A @ A.T, A @ x)
    return xr, x - xr
`,
        tests: [
          { name: "sensor", code: `import numpy as np
xr, xn = split([[1, 1]], [3, 1])
assert np.allclose(xr, [2, 2]) and np.allclose(xn, [1, -1]), '(3, 1) splits as (2, 2) + (1, −1).'` },
          { name: "perpendicular", code: `import numpy as np
rng = np.random.default_rng(4)
A = rng.standard_normal((2, 4)); x = rng.standard_normal(4)
xr, xn = split(A, x)
assert np.allclose(A @ xn, 0), 'The null space part must satisfy A xn = 0.'
assert abs(xr @ xn) < 1e-9 and np.allclose(xr + xn, x), 'The two parts must be perpendicular and add up to x.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            The starter gives <C>null_basis(M)</C>, the special solutions of Mx = 0 as the columns of a matrix. Write <C>orthogonal_complement(V)</C>, a basis (as columns) of the vectors perpendicular to every column of V, which is the null space of Vᵀ. Then write <C>decompose(V, x)</C> for V with independent columns, which splits x into (p, q) with p = Vc a combination of the columns and q = x − p perpendicular to every column: Vᵀ(x − Vc) = 0, so solve (VᵀV)c = Vᵀx. Finally write <C>are_complements(V, W, tol=1e-9)</C>, whether the spans of the columns of V and of W are orthogonal complements in ℝⁿ: every column of V is perpendicular to every column of W (to within tol), and their ranks add up to n.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def null_basis(M, tol=1e-10):
    R = np.array(M, float)
    m, n = R.shape
    tol = tol * (np.abs(R).max() if R.size else 0.0)
    piv = []
    for c in range(n):
        r = len(piv)
        if r == m:
            break
        p = r + int(np.argmax(np.abs(R[r:, c])))
        if abs(R[p, c]) <= tol:
            continue
        R[[r, p]] = R[[p, r]]
        R[r] /= R[r, c]
        for i in range(m):
            if i != r:
                R[i] -= R[i, c] * R[r]
        piv.append(c)
    free = [c for c in range(n) if c not in piv]
    N = np.zeros((n, len(free)))
    for k, f in enumerate(free):
        N[f, k] = 1.0
        for i, q in enumerate(piv):
            N[q, k] = -R[i, f]
    return N

def orthogonal_complement(V):
    return np.zeros((np.asarray(V).shape[0], 0))

def decompose(V, x):
    x = np.asarray(x, float)
    return (x, np.zeros_like(x))

def are_complements(V, W, tol=1e-9):
    return True
`,
        solution: `import numpy as np

def null_basis(M, tol=1e-10):
    R = np.array(M, float)
    m, n = R.shape
    tol = tol * (np.abs(R).max() if R.size else 0.0)
    piv = []
    for c in range(n):
        r = len(piv)
        if r == m:
            break
        p = r + int(np.argmax(np.abs(R[r:, c])))
        if abs(R[p, c]) <= tol:
            continue
        R[[r, p]] = R[[p, r]]
        R[r] /= R[r, c]
        for i in range(m):
            if i != r:
                R[i] -= R[i, c] * R[r]
        piv.append(c)
    free = [c for c in range(n) if c not in piv]
    N = np.zeros((n, len(free)))
    for k, f in enumerate(free):
        N[f, k] = 1.0
        for i, q in enumerate(piv):
            N[q, k] = -R[i, f]
    return N

def orthogonal_complement(V):
    return null_basis(np.asarray(V, float).T)

def decompose(V, x):
    V, x = np.asarray(V, float), np.asarray(x, float)
    p = V @ np.linalg.solve(V.T @ V, V.T @ x)
    return (p, x - p)

def are_complements(V, W, tol=1e-9):
    V, W = np.asarray(V, float), np.asarray(W, float)
    ranks = np.linalg.matrix_rank(V) + np.linalg.matrix_rank(W)
    return bool(np.abs(V.T @ W).max(initial=0.0) <= tol and ranks == V.shape[0])
`,
        tests: [
          { name: "complement", code: `import numpy as np
V = np.array([[1.0, 0.0], [1.0, 1.0], [0.0, 1.0]])
C = orthogonal_complement(V)
assert C.shape == (3, 1) and np.allclose(V.T @ C, 0) and np.allclose(abs(C[:, 0]) / np.linalg.norm(C[:, 0]), np.array([1, 1, 1]) / 3 ** 0.5), 'The complement of a plane in ℝ³ is a line.'` },
          { name: "decompose", code: `import numpy as np
V = np.array([[1.0], [1.0], [0.0]])
p, q = decompose(V, [3, 1, 4])
assert np.allclose(p, [2, 2, 0]) and np.allclose(q, [1, -1, 4]) and abs(p @ q) < 1e-12, 'Perpendicular pieces that add to x.'` },
          { name: "complements", code: `import numpy as np
V = np.array([[1.0, 0.0], [1.0, 1.0], [0.0, 1.0]])
assert are_complements(V, orthogonal_complement(V)), 'A plane and its normal line.'
assert not are_complements([[1], [0], [0]], [[0], [1], [0]]), 'Two perpendicular lines in ℝ³ leave a direction out.'
assert not are_complements([[1], [1], [0]], [[1, 0], [0, 0], [0, 1]]), 'Not perpendicular.'` },
        ],
      },
    },
    {
      key: "split",
      rung: "stretch",
      prompt: <p>Split x = (3, 1) into a part in the row space and a part in the null space of A = [1 1]. Give the first entry of the null space part.</p>,
      answer: { kind: "numeric", value: 1 },
    },
  ],

  glimpse: (
    <p>
      Next, projections: the formula for the piece of a vector that lies in a subspace, the closest point of the subspace.
      Linear Algebra II develops orthogonal complements in any inner product space.
    </p>
  ),
};
