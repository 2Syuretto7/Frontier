import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { FourSubspacesViz } from "@/components/viz/FourSubspacesViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.4.5",
  minutes: 65,
  links: {
    requires: ["m3.4.4", "m3.3.5"],
    foreshadows: ["m3.5.1", "m6.4.4", "m3.8.3"],
  },

  puzzle: (
    <>
      <p>
        A 5 × 7 matrix A has rank 3. Without knowing a single entry, how many independent solutions does Ax = 0 have? How many
        independent conditions must b satisfy for Ax = b to be solvable?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every matrix comes with four subspaces: the column space and null space of A, and the same two for{" "}
        <M>{"A^{\\mathsf T}"}</M>. Their dimensions are fixed by just three numbers: m, n and the rank r. Choose a matrix below
        and compare the dimensions. Whatever the matrix, they fit together the same way.
      </p>
      <FourSubspacesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the four fundamental subspaces">
        <p>For an m × n matrix A:</p>
        <ul>
          <li>the column space C(A), in <M>{"\\mathbb R^m"}</M>;</li>
          <li>the null space N(A), in <M>{"\\mathbb R^n"}</M>;</li>
          <li>the row space <M>{"C(A^{\\mathsf T})"}</M>, the span of the rows, in <M>{"\\mathbb R^n"}</M>;</li>
          <li>the left null space <M>{"N(A^{\\mathsf T})"}</M>, the y with <M>{"A^{\\mathsf T}\\mathbf y = \\mathbf 0"}</M>, in <M>{"\\mathbb R^m"}</M>.</li>
        </ul>
      </Definition>

      <Theorem title="the dimensions">
        <p>If A has rank r, then</p>
        <MD>{"\\dim C(A) = \\dim C(A^{\\mathsf T}) = r, \\qquad \\dim N(A) = n - r, \\qquad \\dim N(A^{\\mathsf T}) = m - r."}</MD>
        <p>
          In particular, row rank equals column rank, and <M>{"\\dim C(A) + \\dim N(A) = n"}</M> (the rank-nullity theorem).
        </p>
      </Theorem>
      <Proof>
        <p>
          Row operations do not change the row space, and the r non-zero rows of the RREF R are independent (each has a 1 where
          the others have 0), so the row space has dimension r. The pivot columns of A are a basis of C(A): the pivot columns of
          R are independent, and row operations preserve which combinations of columns vanish. So C(A) has dimension r too. The
          null space has one special solution per free variable: n − r. Applying the same to{" "}
          <M>{"A^{\\mathsf T}"}</M>, which is n × m with rank r, gives m − r.
        </p>
      </Proof>

      <Theorem title="solvability">
        <p>
          Ax = b is solvable exactly when <M>{"\\mathbf y^{\\mathsf T}\\mathbf b = 0"}</M> for every y in{" "}
          <M>{"N(A^{\\mathsf T})"}</M>. There are m − r independent such conditions.
        </p>
      </Theorem>

      <Example title="the puzzle">
        <p>
          With m = 5, n = 7 and r = 3: N(A) has dimension 7 − 3 = 4, so four independent solutions of Ax = 0. The left null
          space has dimension 5 − 3 = 2, so b must satisfy two independent conditions.
        </p>
      </Example>

      <Example title="a rank one matrix">
        <p>
          A = [[1, 2, 3], [2, 4, 6]] has rank 1. Its column space is the line through (1, 2) in <M>{"\\mathbb R^2"}</M>, its
          row space the line through (1, 2, 3) in <M>{"\\mathbb R^3"}</M>, its null space the plane{" "}
          <M>{"x_1 + 2x_2 + 3x_3 = 0"}</M>, and its left null space the line through (2, −1). Notice that the null space is
          perpendicular to the row space, and the left null space to the column space. That is the subject of the next chapter.
        </p>
      </Example>

      <Remark title="the big picture">
        <p>
          A sends its row space onto its column space one to one, and sends the null space to zero. Every matrix, of any shape,
          is an invertible map between two r-dimensional spaces, with the rest of the input discarded. The singular value
          decomposition in Chapter 8 makes this picture exact.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "null",
      rung: "check",
      prompt: <p>A 5 × 7 matrix has rank 3. What is the dimension of its null space?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "left",
      rung: "check",
      prompt: <p>The same 5 × 7 matrix of rank 3: what is the dimension of its left null space?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "r1",
      rung: "apply",
      prompt: <p>For A with rows (1, 2, 3) and (2, 4, 6), what is the dimension of N(A)?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "lnull",
      rung: "apply",
      prompt: <p>Which vector spans the left null space of A with rows (1, 2, 3) and (2, 4, 6)?</p>,
      answer: { kind: "choice", options: ["(2, −1)", "(1, 2)", "(−2, 1, 0)", "(1, 2, 3)"], correct: [0] },
    },
    {
      key: "equal",
      rung: "apply",
      prompt: <p>For which sizes can an n × n matrix have its column space equal to its null space?</p>,
      answer: { kind: "choice", options: ["4 × 4 but not 3 × 3", "3 × 3 but not 4 × 4", "Both", "Neither"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.random.default_rng(0).standard_normal((5, 3)) @ np.random.default_rng(1).standard_normal((3, 7))
r = np.linalg.matrix_rank(A)
m, n = A.shape
print(n - r, m - r)`}</Code>
          <p>This prints two numbers. What is their sum?</p>
        </>
      ),
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[1.0, 2.0], [2.0, 4.0], [0.0, 0.0]])
r = np.linalg.matrix_rank(A)
m, n = A.shape
print(r, n - r, r, m - r)`}</Code>
          <p>Dimensions of the column space, null space, row space and left null space of a 3 × 2 matrix of rank 1. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1 1 1 2", "1 2 1 1", "2 0 2 1", "1 1 2 2"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>dims(A)</C>, which returns the dimensions of the four fundamental subspaces as a tuple (column space, null
            space, row space, left null space).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def dims(A):
    A = np.asarray(A, float)
    m, n = A.shape
    return (m, n, m, n)
`,
        solution: `import numpy as np

def dims(A):
    A = np.asarray(A, float)
    m, n = A.shape
    r = int(np.linalg.matrix_rank(A))
    return (r, n - r, r, m - r)
`,
        tests: [
          { name: "rank one", code: `assert tuple(dims([[1, 2, 3], [2, 4, 6]])) == (1, 2, 1, 1), 'A rank one 2 × 3 matrix has dimensions 1, 2, 1, 1.'` },
          { name: "tall", code: `assert tuple(dims([[1, 0], [1, 1], [1, 2]])) == (2, 0, 2, 1), 'A 3 × 2 matrix with independent columns.'` },
          { name: "five by seven", code: `import numpy as np
rng = np.random.default_rng(0)
A = rng.standard_normal((5, 3)) @ rng.standard_normal((3, 7))
assert tuple(dims(A)) == (3, 4, 3, 2), 'Use r, n − r, r and m − r.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>four_subspaces(A, tol=1e-10)</C>, which returns a dict of orthonormal bases (as matrices whose columns are the basis vectors) for <C>"col"</C>, <C>"null"</C>, <C>"row"</C> and <C>"left_null"</C>, all read off one SVD A = UΣVᵀ: the first r columns of U and V, and the remaining columns. Then write <C>check_orthogonality(A)</C>, the largest absolute entry of (row basis)ᵀ(null basis) and of (col basis)ᵀ(left-null basis), which should be about 1e−15.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def four_subspaces(A, tol=1e-10):
    A = np.asarray(A, float)
    m, n = A.shape
    return {'col': np.eye(m), 'null': np.zeros((n, 0)), 'row': np.eye(n), 'left_null': np.zeros((m, 0))}

def check_orthogonality(A):
    return 1.0
`,
        solution: `import numpy as np

def four_subspaces(A, tol=1e-10):
    A = np.asarray(A, float)
    U, s, Vt = np.linalg.svd(A)
    r = int(np.sum(s > tol * s[0])) if s.size and s[0] > 0 else 0
    V = Vt.T
    return {'col': U[:, :r], 'left_null': U[:, r:], 'row': V[:, :r], 'null': V[:, r:]}

def check_orthogonality(A):
    B = four_subspaces(A)
    a = np.abs(B['row'].T @ B['null']).max(initial=0.0)
    b = np.abs(B['col'].T @ B['left_null']).max(initial=0.0)
    return float(max(a, b))
`,
        tests: [
          { name: "dims", code: `B = four_subspaces([[1, 2], [2, 4], [0, 0]])
assert [B[k].shape[1] for k in ('col', 'null', 'row', 'left_null')] == [1, 1, 1, 2], 'Dimensions r, n − r, r, m − r.'` },
          { name: "null", code: `import numpy as np
rng = np.random.default_rng(13)
A = rng.normal(size=(4, 2)) @ rng.normal(size=(2, 6))
B = four_subspaces(A)
assert np.allclose(A @ B['null'], 0) and np.allclose(B['left_null'].T @ A, 0), 'Ax = 0 and yᵀA = 0.'` },
          { name: "orthogonal", code: `import numpy as np
rng = np.random.default_rng(14)
A = rng.normal(size=(5, 3)) @ rng.normal(size=(3, 4))
assert check_orthogonality(A) < 1e-12, 'The row space is orthogonal to the null space.'` },
          { name: "full", code: `import numpy as np
B = four_subspaces(np.eye(3))
assert B['null'].shape == (3, 0) and B['left_null'].shape == (3, 0) and np.allclose(abs(np.linalg.det(B['col'])), 1), 'An invertible matrix has trivial null spaces.'` },
        ],
      },
    },
    {
      key: "rn",
      rung: "prove",
      prompt: (
        <p>
          Prove the rank-nullity theorem, dim C(A) + dim N(A) = n, using the reduced row echelon form. Explain why the pivot
          columns of A (not of R) form a basis of C(A).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Counts r pivot columns and n − r free columns in R, and identifies the n − r special solutions as a basis of N(A).",
          "Argues that Ax = 0 and Rx = 0 have the same solutions, so the same combinations of columns vanish in A and in R.",
          "Concludes that the pivot columns of A are independent and every other column is a combination of them, as in R.",
          "Adds r + (n − r) = n.",
        ],
      },
    },
    {
      key: "tall",
      rung: "stretch",
      prompt: <p>A is 6 × 4 and its columns are independent. What is the dimension of its left null space?</p>,
      answer: { kind: "numeric", value: 2 },
    },
  ],

  teachBack:
    "Explain to a friend the four fundamental subspaces of a matrix, why their dimensions are r, r, n − r and m − r, and what the left null space says about which b make Ax = b solvable.",

  glimpse: (
    <p>
      Next chapter: orthogonality, which shows that the null space is perpendicular to the row space and leads to least
      squares. Linear Algebra II uses the four subspaces to build the pseudoinverse, which solves every system as well as it
      can be solved.
    </p>
  ),
};
