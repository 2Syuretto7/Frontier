import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { MatMulViz } from "@/components/viz/MatMulViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.3.2",
  minutes: 65,
  links: {
    requires: ["m3.3.1"],
    parallels: ["e1.5.3", "e1.5.5"],
    foreshadows: ["l5.3.3", "m6.7.3", "m3.8.3"],
  },

  puzzle: (
    <>
      <p>
        You must compute ABC, where A is 10 × 1000, B is 1000 × 10 and C is 10 × 1000. Matrix multiplication is associative,
        so (AB)C and A(BC) give the same answer.
      </p>
      <p>Do they take the same amount of work? If not, by how much do they differ?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        The product AB can be computed four ways, and each tells a different story. Entry by entry: dot products of rows of A
        with columns of B. Column by column: A acting on each column of B. Row by row: each row of A combining the rows of B.
        And as a sum of outer products: column k of A times row k of B, added over k. Switch between them below; the answer
        never changes.
      </p>
      <MatMulViz />
    </>
  ),

  theory: (
    <>
      <Definition title="matrix product">
        <p>If A is m × n and B is n × p, then AB is the m × p matrix with</p>
        <MD>{"(AB)_{ij} = \\sum_{k=1}^n a_{ik}b_{kj} = (\\text{row } i \\text{ of } A) \\cdot (\\text{column } j \\text{ of } B)."}</MD>
        <p>The inner dimensions must agree; the outer ones give the shape of the result.</p>
      </Definition>

      <Theorem title="four ways to multiply">
        <ul>
          <li><strong>Entries</strong>: as in the definition.</li>
          <li><strong>Columns</strong>: column j of AB is A times column j of B.</li>
          <li><strong>Rows</strong>: row i of AB is row i of A times B, a combination of the rows of B.</li>
          <li>
            <strong>Outer products</strong>: <M>{"AB = \\sum_k \\mathbf a_k \\mathbf b_k^{\\mathsf T}"}</M>, where{" "}
            <M>{"\\mathbf a_k"}</M> is column k of A and <M>{"\\mathbf b_k^{\\mathsf T}"}</M> is row k of B.
          </li>
        </ul>
      </Theorem>
      <Proof>
        <p>
          Each is the same double sum <M>{"\\sum_k a_{ik}b_{kj}"}</M>, grouped differently. For the last, the (i, j) entry of
          the outer product <M>{"\\mathbf a_k\\mathbf b_k^{\\mathsf T}"}</M> is <M>{"a_{ik}b_{kj}"}</M>; summing over k gives
          the definition.
        </p>
      </Proof>

      <Theorem title="the laws, and the missing one">
        <p>
          Matrix multiplication is associative, (AB)C = A(BC), and distributes over addition. It is <strong>not</strong>{" "}
          commutative: usually AB ≠ BA, even when both are defined.
        </p>
      </Theorem>

      <Example title="not commutative">
        <MD>{"\\begin{bmatrix} 0 & 1 \\\\ 0 & 0 \\end{bmatrix}\\begin{bmatrix} 0 & 0 \\\\ 1 & 0 \\end{bmatrix} = \\begin{bmatrix} 1 & 0 \\\\ 0 & 0 \\end{bmatrix}, \\qquad \\begin{bmatrix} 0 & 0 \\\\ 1 & 0 \\end{bmatrix}\\begin{bmatrix} 0 & 1 \\\\ 0 & 0 \\end{bmatrix} = \\begin{bmatrix} 0 & 0 \\\\ 0 & 1 \\end{bmatrix}."}</MD>
      </Example>

      <Theorem title="the cost">
        <p>
          Multiplying an m × n matrix by an n × p matrix takes mnp multiplications (and about as many additions, so about 2mnp
          floating-point operations).
        </p>
      </Theorem>

      <Example title="the puzzle">
        <p>
          (AB)C: AB costs 10 · 1000 · 10 = 100 000 and is 10 × 10; times C costs 10 · 10 · 1000 = 100 000. Total 200 000. A(BC):
          BC is 1000 × 1000 and costs 1000 · 10 · 1000 = 10 000 000; then A(BC) costs another 10 000 000. The second order is a
          hundred times more work for the same answer.
        </p>
      </Example>

      <Remark title="why this matters">
        <p>
          Counting mnp is how the cost of training and running language models is estimated: almost all the arithmetic is
          matrix products. The outer-product view also explains low-rank matrices: a sum of a few outer products is cheap to
          store and to multiply.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "shape",
      rung: "check",
      prompt: <p>A is 3 × 4 and B is 4 × 2. What shape is AB?</p>,
      answer: { kind: "choice", options: ["3 × 2", "4 × 4", "2 × 3", "AB is not defined"], correct: [0] },
    },
    {
      key: "comm",
      rung: "check",
      prompt: <p>For square matrices A and B of the same size, is AB = BA always true?</p>,
      answer: { kind: "choice", options: ["No", "Yes", "Only for 2 × 2 matrices"], correct: [0] },
    },
    {
      key: "entry",
      rung: "apply",
      prompt: <p>A has rows (1, 2), (3, 4) and B has rows (5, 6), (7, 8). Find the entry of AB in row 2, column 1.</p>,
      answer: { kind: "numeric", value: 43 },
    },
    {
      key: "outer",
      rung: "apply",
      prompt: <p>Let u = (1, 2, 3) and v = (4, 5). Find the entry in row 3, column 2 of the outer product <M>{"\\mathbf u\\mathbf v^{\\mathsf T}"}</M>.</p>,
      answer: { kind: "numeric", value: 15 },
    },
    {
      key: "flops",
      rung: "apply",
      prompt: <p>How many multiplications, in billions, does a 1024 × 4096 matrix times a 4096 × 4096 matrix take? Give two decimal places.</p>,
      answer: { kind: "numeric", value: 17.18, tolerance: 0.0005 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[1, 2, 0], [3, -1, 1]])
B = np.array([[2, 1], [0, 1], [4, -2]])
C = sum(np.outer(A[:, k], B[k]) for k in range(3))
print(C[1, 0])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 10 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])
outer = sum(np.outer(A[:, k], B[k]) for k in range(2))
print(outer[1], (A @ B)[:, 0], A[1] @ B[:, 1])`}</Code>
          <p>Columns times rows, columns of the product, and one entry as a row times a column. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[43 50] [19 43] 50", "[19 22] [19 43] 50", "[43 50] [19 22] 50", "[43 50] [19 43] 46"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>matmul(A, B)</C> as a sum of outer products: column k of A times row k of B, added over k. Use
            <C>np.outer</C> but not <C>@</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def matmul(A, B):
    A, B = np.asarray(A, float), np.asarray(B, float)
    C = np.zeros((A.shape[0], B.shape[1]))
    return C
`,
        solution: `import numpy as np

def matmul(A, B):
    A, B = np.asarray(A, float), np.asarray(B, float)
    C = np.zeros((A.shape[0], B.shape[1]))
    for k in range(A.shape[1]):
        C += np.outer(A[:, k], B[k])
    return C
`,
        tests: [
          { name: "lesson example", code: `import numpy as np
assert np.allclose(matmul([[1, 2, 0], [3, -1, 1]], [[2, 1], [0, 1], [4, -2]]), [[2, 3], [10, 0]]), 'The lesson’s A times B is [[2, 3], [10, 0]].'` },
          { name: "shapes", code: `import numpy as np
rng = np.random.default_rng(0)
A = rng.standard_normal((3, 5)); B = rng.standard_normal((5, 2))
assert np.allclose(matmul(A, B), A @ B), 'A 3 × 5 times a 5 × 2 should be 3 × 2 and match A @ B.'` },
          { name: "not commutative", code: `import numpy as np
a = [[0, 1], [0, 0]]; b = [[0, 0], [1, 0]]
assert np.allclose(matmul(a, b), [[1, 0], [0, 0]]), 'Check the order: column k of the first, row k of the second.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>strassen(A, B)</C>, Strassen&rsquo;s algorithm for n × n matrices with n a power of 2: split each into 2 × 2 blocks, form the seven products M₁ … M₇ recursively, and combine them; below n = 32 fall back to <C>A @ B</C>. Also write <C>count_mults(n)</C>, the number of scalar multiplications Strassen uses for n = 2ᵏ if it recursed all the way to 1 × 1 (that is 7ᵏ), and <C>block_multiply(A, B, b)</C>, ordinary multiplication done block by block with b × b blocks (n divisible by b).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def strassen(A, B):
    return A @ B

def count_mults(n):
    return n ** 3

def block_multiply(A, B, b):
    return A @ B
`,
        solution: `import numpy as np

def strassen(A, B):
    n = len(A)
    if n <= 32:
        return A @ B
    m = n // 2
    A11, A12, A21, A22 = A[:m, :m], A[:m, m:], A[m:, :m], A[m:, m:]
    B11, B12, B21, B22 = B[:m, :m], B[:m, m:], B[m:, :m], B[m:, m:]
    M1 = strassen(A11 + A22, B11 + B22)
    M2 = strassen(A21 + A22, B11)
    M3 = strassen(A11, B12 - B22)
    M4 = strassen(A22, B21 - B11)
    M5 = strassen(A11 + A12, B22)
    M6 = strassen(A21 - A11, B11 + B12)
    M7 = strassen(A12 - A22, B21 + B22)
    C = np.empty((n, n), dtype=np.result_type(A, B))
    C[:m, :m] = M1 + M4 - M5 + M7
    C[:m, m:] = M3 + M5
    C[m:, :m] = M2 + M4
    C[m:, m:] = M1 - M2 + M3 + M6
    return C

def count_mults(n):
    k = n.bit_length() - 1
    return 7 ** k

def block_multiply(A, B, b):
    n = len(A)
    C = np.zeros((n, n), dtype=np.result_type(A, B))
    for i in range(0, n, b):
        for j in range(0, n, b):
            for k in range(0, n, b):
                C[i:i + b, j:j + b] += A[i:i + b, k:k + b] @ B[k:k + b, j:j + b]
    return C
`,
        tests: [
          { name: "integers", code: `import numpy as np
rng = np.random.default_rng(4)
A, B = rng.integers(-5, 6, size=(128, 128)), rng.integers(-5, 6, size=(128, 128))
assert np.array_equal(strassen(A, B), A @ B), 'Exact for integers.'` },
          { name: "floats", code: `import numpy as np
rng = np.random.default_rng(5)
A, B = rng.normal(size=(64, 64)), rng.normal(size=(64, 64))
assert np.allclose(strassen(A, B), A @ B), 'Close for floats.'` },
          { name: "recursion", code: `import inspect
src = inspect.getsource(strassen)
assert src.count('strassen(') >= 8, 'Seven recursive products.'` },
          { name: "count", code: `assert count_mults(1) == 1 and count_mults(2) == 7 and count_mults(1024) == 7 ** 10, '7ᵏ instead of 8ᵏ.'` },
          { name: "blocks", code: `import numpy as np
rng = np.random.default_rng(6)
A, B = rng.normal(size=(12, 12)), rng.normal(size=(12, 12))
assert np.allclose(block_multiply(A, B, 4), A @ B) and np.allclose(block_multiply(A, B, 3), A @ B), 'Sum of block products.'` },
        ],
      },
    },
    {
      key: "assoc",
      rung: "prove",
      prompt: <p>Prove that (AB)C = A(BC) whenever the shapes allow, by comparing the (i, j) entries of the two sides.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes ((AB)C)_ij = Σ_l (AB)_il c_lj = Σ_l Σ_k a_ik b_kl c_lj.",
          "Writes (A(BC))_ij = Σ_k a_ik (BC)_kj = Σ_k Σ_l a_ik b_kl c_lj.",
          "Notes that finite sums can be reordered, so the two double sums are equal.",
        ],
      },
    },
    {
      key: "chain",
      rung: "stretch",
      prompt: (
        <p>
          A is 20 × 500, B is 500 × 20 and x is a 20-vector. How many multiplications does the cheaper of (AB)x and A(Bx)
          take?
        </p>
      ),
      answer: { kind: "numeric", value: 20000 },
    },
  ],

  teachBack:
    "Explain to a friend the four ways to compute AB, why AB and BA usually differ, and why the order of multiplying a chain of matrices can change the cost enormously.",

  glimpse: (
    <p>
      Next, inverse matrices, which undo a multiplication when that is possible. Transformers and Language Models counts the
      mnp of every matrix product to estimate the cost of training, and Linear Algebra II writes products of many indices
      with einsum notation.
    </p>
  ),
};
