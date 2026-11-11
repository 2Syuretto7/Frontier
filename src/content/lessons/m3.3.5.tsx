import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { PermViz } from "@/components/viz/PermViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.3.5",
  minutes: 50,
  links: {
    requires: ["m3.3.2"],
    parallels: ["e1.5.6"],
    foreshadows: ["m3.7.4", "m5.4.1", "m3.5.3"],
  },

  puzzle: (
    <>
      <p>
        A dataset is stored as a matrix X with one row per example and one column per feature. A colleague shuffles the
        examples before training. Another colleague wants the matrix the other way round, one row per feature.
      </p>
      <p>Both operations just move numbers around. Can each be written as a matrix multiplication, and how do you undo them?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Shuffling rows is multiplying on the left by a <strong>permutation matrix</strong>: the identity with its rows in a
        new order. Turning rows into columns is the <strong>transpose</strong>. Choose an order below to see PA, then notice that
        the transpose of P puts everything back.
      </p>
      <PermViz />
    </>
  ),

  theory: (
    <>
      <Definition title="transpose">
        <p>
          The transpose <M>{"A^{\\mathsf T}"}</M> of an m × n matrix is the n × m matrix with{" "}
          <M>{"(A^{\\mathsf T})_{ij} = a_{ji}"}</M>. A matrix is <strong>symmetric</strong> if{" "}
          <M>{"A^{\\mathsf T} = A"}</M>.
        </p>
      </Definition>

      <Theorem title="rules for transposes">
        <MD>{"(A + B)^{\\mathsf T} = A^{\\mathsf T} + B^{\\mathsf T}, \\qquad (AB)^{\\mathsf T} = B^{\\mathsf T}A^{\\mathsf T}, \\qquad (A^{-1})^{\\mathsf T} = (A^{\\mathsf T})^{-1}."}</MD>
      </Theorem>
      <Proof>
        <p>
          For the product, <M>{"((AB)^{\\mathsf T})_{ij} = (AB)_{ji} = \\sum_k a_{jk}b_{ki} = \\sum_k (B^{\\mathsf T})_{ik}(A^{\\mathsf T})_{kj}"}</M>.
          For the inverse, transpose <M>{"AA^{-1} = I"}</M> to get <M>{"(A^{-1})^{\\mathsf T}A^{\\mathsf T} = I"}</M>.
        </p>
      </Proof>

      <Theorem title="the dot product as a matrix product">
        <p>
          For column vectors, <M>{"\\mathbf x \\cdot \\mathbf y = \\mathbf x^{\\mathsf T}\\mathbf y"}</M>, and{" "}
          <M>{"(A\\mathbf x)\\cdot\\mathbf y = \\mathbf x \\cdot (A^{\\mathsf T}\\mathbf y)"}</M>. This identity is really what
          the transpose is for: it moves a matrix from one side of a dot product to the other.
        </p>
      </Theorem>

      <Definition title="permutation matrix">
        <p>
          A permutation matrix is the identity with its rows reordered. PA reorders the rows of A in the same way, and AP
          reorders the columns. There are n! permutation matrices of size n.
        </p>
      </Definition>

      <Theorem title="permutations are orthogonal">
        <p>For every permutation matrix, <M>{"P^{\\mathsf T}P = I"}</M>, so <M>{"P^{-1} = P^{\\mathsf T}"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          The (i, j) entry of <M>{"P^{\\mathsf T}P"}</M> is the dot product of columns i and j of P. The columns are distinct
          standard basis vectors, so the dot product is 1 if i = j and 0 otherwise.
        </p>
      </Proof>

      <Example title="a symmetric matrix from any matrix">
        <p>
          For any A, <M>{"A^{\\mathsf T}A"}</M> is square and symmetric:{" "}
          <M>{"(A^{\\mathsf T}A)^{\\mathsf T} = A^{\\mathsf T}(A^{\\mathsf T})^{\\mathsf T} = A^{\\mathsf T}A"}</M>. If the
          columns of X are features with mean zero, <M>{"X^{\\mathsf T}X"}</M> is (up to a factor) their covariance matrix. It
          appears in least squares, PCA and the SVD.
        </p>
      </Example>

      <Remark title="in memory">
        <p>
          NumPy&rsquo;s transpose usually copies nothing: it swaps the strides, so the same memory is read in a different order.
          The cost appears later, when code walks the transposed array in an order that jumps around memory.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "shape",
      rung: "check",
      prompt: <p>A is 2 × 3. What shape is <M>{"A^{\\mathsf T}"}</M>?</p>,
      answer: { kind: "choice", options: ["3 × 2", "2 × 3", "3 × 3", "2 × 2"], correct: [0] },
    },
    {
      key: "rule",
      rung: "check",
      prompt: <p>What is <M>{"(AB)^{\\mathsf T}"}</M>?</p>,
      answer: { kind: "choice", options: ["BᵀAᵀ", "AᵀBᵀ", "BA", "AB"], correct: [0] },
    },
    {
      key: "xty",
      rung: "apply",
      prompt: <p>Compute <M>{"\\mathbf x^{\\mathsf T}\\mathbf y"}</M> for x = (1, 2, 3) and y = (4, 5, 6).</p>,
      answer: { kind: "numeric", value: 32 },
    },
    {
      key: "count",
      rung: "apply",
      prompt: <p>How many 4 × 4 permutation matrices are there?</p>,
      answer: { kind: "numeric", value: 24 },
    },
    {
      key: "self",
      rung: "apply",
      prompt: <p>How many of the six 3 × 3 permutation matrices are their own inverses?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
P = np.eye(3)[[2, 0, 1]]
A = np.arange(9).reshape(3, 3)
print((P @ A)[0, 0], (P.T @ P)[1, 1])`}</Code>
          <p>This prints two numbers. What is their sum?</p>
        </>
      ),
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>perm_matrix(order)</C>, which returns the permutation matrix P such that row i of PA is row
            <C>order[i]</C> of A.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def perm_matrix(order):
    return np.eye(len(order))
`,
        solution: `import numpy as np

def perm_matrix(order):
    return np.eye(len(order))[list(order)]
`,
        tests: [
          { name: "reorders rows", code: `import numpy as np
A = np.arange(9).reshape(3, 3)
assert np.allclose(perm_matrix([2, 0, 1]) @ A, A[[2, 0, 1]]), 'Row 0 of PA should be row 2 of A.'` },
          { name: "transpose undoes it", code: `import numpy as np
P = perm_matrix([3, 1, 0, 2])
assert np.allclose(P.T @ P, np.eye(4)), 'Pᵀ P should be the identity.'` },
          { name: "identity", code: `import numpy as np
assert np.allclose(perm_matrix([0, 1]), np.eye(2)), 'The order 0, 1 gives the identity.'` },
        ],
      },
    },
    {
      key: "sym",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"(A\\mathbf x)\\cdot\\mathbf y = \\mathbf x\\cdot(A^{\\mathsf T}\\mathbf y)"}</M> for every m × n
          matrix A, x in <M>{"\\mathbb R^n"}</M> and y in <M>{"\\mathbb R^m"}</M>. Deduce that{" "}
          <M>{"A^{\\mathsf T}A"}</M> is symmetric.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes (Ax)·y = (Ax)ᵀy = xᵀAᵀy = x·(Aᵀy), using (AB)ᵀ = BᵀAᵀ; or expands both as Σ_i Σ_j a_ij x_j y_i.",
          "For symmetry, computes (AᵀA)ᵀ = Aᵀ(Aᵀ)ᵀ = AᵀA.",
          "Notes that AᵀA is n × n, so symmetry makes sense.",
        ],
      },
    },
    {
      key: "ata",
      rung: "stretch",
      prompt: <p>A has rows (1, 2), (3, 4) and (5, 6). Find the entry in row 1, column 2 of <M>{"A^{\\mathsf T}A"}</M>.</p>,
      answer: { kind: "numeric", value: 44 },
    },
  ],

  teachBack:
    "Explain to a friend what the transpose does, why (AB)ᵀ = BᵀAᵀ, how a permutation matrix shuffles rows, and why its inverse is its transpose.",

  glimpse: (
    <p>
      Next chapter: vector spaces, the setting in which column spaces and null spaces live. Symmetric matrices like AᵀA return
      in Chapter 7, where they turn out to have the best possible eigenvectors. Multivariable and Matrix Calculus needs
      transposes everywhere when it takes gradients of matrix expressions.
    </p>
  ),
};
