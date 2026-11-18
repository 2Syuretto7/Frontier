import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem } from "@/components/lesson/Blocks";
import { NullColViz } from "@/components/viz/NullColViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.4.2",
  minutes: 60,
  links: {
    requires: ["m3.4.1", "m3.2.2"],
    revisits: ["m3.2.3"],
    foreshadows: ["m3.4.5", "m6.1.3"],
  },

  puzzle: (
    <>
      <p>
        A shop sells three gift boxes. Box 1 has 1 pen and 2 pencils, box 2 has 2 pens and 4 pencils, box 3 has 3 pens and 6
        pencils. A customer orders 1 pen and 2 pencils in boxes. Another orders 1 pen and 3 pencils.
      </p>
      <p>
        Which order can be packed exactly? For the one that can, how many different ways are there to pack it, if boxes may
        also be returned (negative numbers)?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every matrix A has two subspaces attached. The <strong>column space</strong> is every output Ax can produce: the span
        of the columns. The <strong>null space</strong> is every input that A sends to zero. Below, the left plane is the
        input and the right plane the output. While the columns point different ways, the column space is the whole plane and
        the null space is just 0. Make the columns parallel and both change at once.
      </p>
      <NullColViz />
    </>
  ),

  theory: (
    <>
      <Definition title="column space and null space">
        <p>For an m × n matrix A:</p>
        <ul>
          <li>
            the <strong>column space</strong> C(A) is the set of all Ax, the span of the columns, a subspace of{" "}
            <M>{"\\mathbb R^m"}</M>;
          </li>
          <li>
            the <strong>null space</strong> N(A) is the set of all x with Ax = 0, a subspace of <M>{"\\mathbb R^n"}</M>.
          </li>
        </ul>
      </Definition>

      <Theorem title="what they say about Ax = b">
        <p>
          Ax = b has a solution exactly when b is in C(A). When it does, the solutions are{" "}
          <M>{"\\mathbf x_p + \\mathbf x_n"}</M> with <M>{"\\mathbf x_n"}</M> in N(A), so the solution is unique exactly when
          N(A) = {"{0}"}.
        </p>
      </Theorem>

      <Theorem title="the null space is a subspace">
        <p>If Ax = 0 and Ay = 0, then A(cx + dy) = cAx + dAy = 0.</p>
      </Theorem>

      <Definition title="special solutions">
        <p>
          Reduce A to its RREF R; N(A) = N(R). For each free variable, set it to 1 and the other free variables to 0, and solve
          for the pivot variables. These <strong>special solutions</strong> span the null space, and there are n − r of them.
        </p>
      </Definition>

      <Example title="special solutions">
        <p>For the matrix with rows (1, 2, 2, 2), (2, 4, 6, 8), (3, 6, 8, 10),</p>
        <MD>{"R = \\begin{bmatrix} 1 & 2 & 0 & -2 \\\\ 0 & 0 & 1 & 2 \\\\ 0 & 0 & 0 & 0 \\end{bmatrix}."}</MD>
        <p>
          The free variables are <M>{"x_2"}</M> and <M>{"x_4"}</M>. Setting <M>{"x_2 = 1, x_4 = 0"}</M> gives (−2, 1, 0, 0);
          setting <M>{"x_2 = 0, x_4 = 1"}</M> gives (2, 0, −2, 1). Every solution of Ax = 0 is a combination of these two.
        </p>
      </Example>

      <Example title="the puzzle">
        <p>
          The columns are (1, 2), (2, 4) and (3, 6), all multiples of (1, 2). So C(A) is the line through (1, 2): the order (1,
          2) can be packed and (1, 3) cannot. N(A) is the plane <M>{"x_1 + 2x_2 + 3x_3 = 0"}</M>, so there are infinitely many
          packings of (1, 2): (1, 0, 0) plus anything in that plane.
        </p>
      </Example>

      <Remark title="information lost">
        <p>
          The null space is exactly the information a matrix throws away: inputs differing by a null space vector give the
          same output. A layer of a network with a large null space cannot tell those inputs apart, however it is trained
          afterwards.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "where",
      rung: "check",
      prompt: <p>A is 3 × 5. The null space of A is a subspace of <M>{"\\mathbb R^k"}</M> for which k?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "solvable",
      rung: "check",
      prompt: <p>Ax = b has a solution exactly when:</p>,
      answer: { kind: "choice", options: ["b is in the column space of A", "b is in the null space of A", "A is square", "b ≠ 0"], correct: [0] },
    },
    {
      key: "null2",
      rung: "apply",
      prompt: <p>Which vector spans the null space of the matrix with rows (1, 2) and (2, 4)?</p>,
      answer: { kind: "choice", options: ["(−2, 1)", "(1, 2)", "(2, 1)", "(0, 0)"], correct: [0] },
    },
    {
      key: "count",
      rung: "apply",
      prompt: <p>How many special solutions does the matrix with rows (1, 2, 3, 4) and (2, 4, 7, 9) have?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "incol",
      rung: "apply",
      prompt: <p>A has columns (1, 2, 3) and (2, 4, 6). For which c is (1, 2, c) in the column space of A?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[1.0, 2.0, 3.0], [2.0, 4.0, 6.0]])
for x in ([-2, 1, 0], [1, 1, -1], [3, 0, -1], [1, 1, 1]):
    print(np.allclose(A @ x, 0))`}</Code>
          <p>How many times does this print True?</p>
        </>
      ),
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[1.0, 2.0, 3.0], [2.0, 4.0, 6.0]])
x = np.array([1.0, 1.0, -1.0])
print(A @ x, np.linalg.matrix_rank(A), A.shape[1] - np.linalg.matrix_rank(A))`}</Code>
          <p>Is x in the null space, and what are the rank and the dimension of the null space? What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0. 0.] 1 2", "[0. 0.] 2 1", "[1. 2.] 1 2", "[0. 0.] 1 1"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>null_basis(A)</C>, which returns a matrix whose columns are a basis of the null space of A (with as many
            columns as there are free variables), made of the special solutions: row-reduce A, and for each free variable set
            it to 1 and the other free variables to 0, then read off the pivot variables.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def null_basis(A):
    A = np.asarray(A, float)
    return np.zeros((A.shape[1], 0))
`,
        solution: `import numpy as np

def null_basis(A, tol=1e-10):
    R = np.array(A, float)
    m, n = R.shape
    tol = tol * (np.abs(R).max() if R.size else 0.0)
    pivots = []
    r = 0
    for c in range(n):
        if r == m:
            break
        p = r + int(np.argmax(np.abs(R[r:, c])))
        if abs(R[p, c]) <= tol:
            R[r:, c] = 0.0
            continue
        R[[r, p]] = R[[p, r]]
        R[r] /= R[r, c]
        for i in range(m):
            if i != r:
                R[i] -= R[i, c] * R[r]
        pivots.append(c)
        r += 1
    free = [c for c in range(n) if c not in pivots]
    N = np.zeros((n, len(free)))
    for k, f in enumerate(free):
        N[f, k] = 1.0
        for i, p in enumerate(pivots):
            N[p, k] = -R[i, f]
    return N
`,
        tests: [
          { name: "solves Ax = 0", code: `import numpy as np
A = np.array([[1, 2, 2, 2], [2, 4, 6, 8], [3, 6, 8, 10]], float)
N = null_basis(A)
assert N.shape == (4, 2), 'This matrix has 4 columns and rank 2, so its null space has dimension 2.'
assert np.allclose(A @ N, 0), 'Every column must solve Ax = 0.'` },
          { name: "independent", code: `import numpy as np
N = null_basis([[1, 2, 3]])
assert np.linalg.matrix_rank(N) == 2, 'The basis vectors must be independent.'` },
          { name: "trivial", code: `assert null_basis([[1, 0], [0, 1]]).shape[1] == 0, 'An invertible matrix has only the zero vector in its null space.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>rref(A, tol=1e-10)</C>, which returns the reduced row echelon form of A and the list of its pivot columns, by Gauss-Jordan elimination with partial pivoting (treat entries no larger than tol times the largest entry of A as zero). Then write <C>col_space_basis(A)</C>, the pivot columns of A itself as the columns of a matrix, and <C>in_col_space(A, b)</C>, whether b lies in the column space of A, that is, whether [A | b] has no more pivots than A.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rref(A, tol=1e-10):
    return np.array(A, float), []

def col_space_basis(A):
    return np.asarray(A, float)

def in_col_space(A, b):
    return True
`,
        solution: `import numpy as np

def rref(A, tol=1e-10):
    R = np.array(A, float)
    m, n = R.shape
    tol = tol * (np.abs(R).max() if R.size else 0.0)
    pivots = []
    r = 0
    for c in range(n):
        if r == m:
            break
        p = r + int(np.argmax(np.abs(R[r:, c])))
        if abs(R[p, c]) <= tol:
            R[r:, c] = 0.0
            continue
        R[[r, p]] = R[[p, r]]
        R[r] /= R[r, c]
        for i in range(m):
            if i != r:
                R[i] -= R[i, c] * R[r]
        pivots.append(c)
        r += 1
    return R, pivots

def col_space_basis(A):
    A = np.asarray(A, float)
    return A[:, rref(A)[1]]

def in_col_space(A, b):
    A = np.asarray(A, float)
    return len(rref(np.column_stack([A, b]))[1]) == len(rref(A)[1])
`,
        tests: [
          { name: "rref", code: `import numpy as np
R, piv = rref([[1, 2, 2, 2], [2, 4, 6, 8], [3, 6, 8, 10]])
assert piv == [0, 2] and np.allclose(R, [[1, 2, 0, -2], [0, 0, 1, 2], [0, 0, 0, 0]]), 'Pivots in columns 0 and 2.'` },
          { name: "full rank", code: `import numpy as np
R, piv = rref(np.eye(3) * 4)
assert piv == [0, 1, 2] and np.allclose(R, np.eye(3)) and rref(np.zeros((2, 3)))[1] == [], 'Every column, or none.'` },
          { name: "columns", code: `import numpy as np
A = np.array([[1.0, 2.0], [2.0, 4.0], [3.0, 6.0]])
Q = col_space_basis(A)
assert Q.shape == (3, 1) and np.allclose(Q[:, 0], [1, 2, 3]), 'The column space is the line through (1, 2, 3).'` },
          { name: "membership", code: `import numpy as np
A = np.array([[1.0, 2.0], [2.0, 4.0], [3.0, 6.0]])
assert in_col_space(A, [2, 4, 6]) and not in_col_space(A, [1, 0, 0]) and in_col_space(np.eye(3), [5, -1, 2]), 'b must be a combination of the columns.'` },
          { name: "rank-nullity", code: `import numpy as np
rng = np.random.default_rng(11)
A = rng.normal(size=(5, 3)) @ rng.normal(size=(3, 7))
assert len(rref(A)[1]) == 3, 'A product through 3 dimensions has 3 pivots.'` },
        ],
      },
    },
    {
      key: "special",
      rung: "stretch",
      prompt: (
        <p>
          For the matrix with rows (1, 3, 0, 2), (0, 0, 1, 4) and (1, 3, 1, 6), find the special solution with{" "}
          <M>{"x_2 = 0"}</M> and <M>{"x_4 = 1"}</M>. Give its third entry.
        </p>
      ),
      answer: { kind: "numeric", value: -4 },
    },
  ],

  glimpse: (
    <p>
      Next, linear independence: when a set of vectors contains no redundancy, so that the null space of the matrix they form
      is just zero. Linear Algebra II calls these spaces the range and the null space of a linear map.
    </p>
  ),
};
