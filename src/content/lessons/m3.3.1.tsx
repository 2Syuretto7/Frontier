import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { ColumnCombViz } from "@/components/viz/ColumnCombViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.3.1",
  minutes: 55,
  links: {
    requires: ["m3.1.1", "m3.2.1"],
    parallels: ["e1.5.1"],
    foreshadows: ["m5.2.2", "l3.1.2", "m3.8.1"],
  },

  puzzle: (
    <>
      <p>
        A layer of a neural network takes 4096 numbers in and puts 4096 numbers out. Each output is a weighted sum of all the
        inputs, with its own weights.
      </p>
      <p>
        How many weights does the layer have, and what is the cleanest way to write down what it does? Is there a way to see
        the output as something built from pieces you can picture?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A matrix is a table of numbers, and multiplying it by a vector can be read in two ways. Row by row: each output entry
        is the dot product of a row with x. Column by column: the output is a combination of the columns, with the entries of
        x as the weights. Below, move x and watch both readings give the same answer.
      </p>
      <ColumnCombViz />
    </>
  ),

  theory: (
    <>
      <Definition title="matrices">
        <p>
          An m × n matrix A has m rows and n columns; <M>{"a_{ij}"}</M> is the entry in row i, column j. Matrices of the same
          shape are added entry by entry, and multiplied by a scalar entry by entry.
        </p>
      </Definition>

      <Definition title="matrix times vector">
        <p>For an m × n matrix A and x in <M>{"\\mathbb R^n"}</M>, Ax is the vector in <M>{"\\mathbb R^m"}</M> with</p>
        <MD>{"(A\\mathbf x)_i = a_{i1}x_1 + a_{i2}x_2 + \\dots + a_{in}x_n = (\\text{row } i) \\cdot \\mathbf x."}</MD>
      </Definition>

      <Theorem title="the column picture">
        <p>If <M>{"\\mathbf a_1, \\dots, \\mathbf a_n"}</M> are the columns of A, then</p>
        <MD>{"A\\mathbf x = x_1\\mathbf a_1 + x_2\\mathbf a_2 + \\dots + x_n\\mathbf a_n."}</MD>
        <p>So Ax = b has a solution exactly when b is a combination of the columns of A.</p>
      </Theorem>
      <Proof>
        <p>
          The i-th entry of the right side is <M>{"x_1a_{i1} + \\dots + x_na_{in}"}</M>, which is the i-th entry of the left.
        </p>
      </Proof>

      <Theorem title="linearity">
        <p>
          <M>{"A(c\\mathbf x + d\\mathbf y) = cA\\mathbf x + dA\\mathbf y"}</M> for all vectors x, y and numbers c, d. Also{" "}
          <M>{"(A + B)\\mathbf x = A\\mathbf x + B\\mathbf x"}</M>.
        </p>
      </Theorem>

      <Example title="the identity">
        <p>
          The n × n identity matrix I has ones on the diagonal and zeros elsewhere. Its columns are the standard basis vectors{" "}
          <M>{"\\mathbf e_1, \\dots, \\mathbf e_n"}</M>, so Ix = x. And <M>{"A\\mathbf e_j"}</M> is column j of A: a matrix is
          completely described by what it does to the standard basis vectors.
        </p>
      </Example>

      <Example title="the puzzle">
        <p>
          The layer is y = Wx with W a 4096 × 4096 matrix: 16 777 216 weights. In the column picture, each input coordinate{" "}
          <M>{"x_j"}</M> chooses how much of column <M>{"\\mathbf w_j"}</M> to add to the output. Each column is the pattern
          that one input feature writes into the output.
        </p>
      </Example>

      <Remark title="shapes first">
        <p>
          Before computing any product, check the shapes: an (m × n) matrix times an n-vector gives an m-vector. Most bugs in
          numerical code are shape bugs, and NumPy will broadcast happily over a shape you did not intend.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "shape",
      rung: "check",
      prompt: <p>A is 3 × 2 and x has 2 entries. How many entries does Ax have?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "small",
      rung: "check",
      prompt: <p>For A with rows (2, −1) and (1, 2), compute A times (1, 1). Give the first entry.</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "three",
      rung: "apply",
      prompt: <p>A has rows (1, 2, 0), (0, 1, −1) and (3, 0, 1). Compute Ax for x = (2, 1, 3). Give the third entry.</p>,
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "combo",
      rung: "apply",
      prompt: <p>For A with rows (2, −1) and (1, 2), find x with Ax = (0, 5). Give its second entry.</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "rules",
      rung: "apply",
      prompt: <p>For m × n matrices A and B, vectors x and y in ℝⁿ and a number c, which are always true? Select all that apply.</p>,
      answer: { kind: "choice", options: ["(A + B)x = Ax + Bx", "A(x + y) = Ax + Ay", "A(cx) = c(Ax)", "Ax = Ay implies x = y"], correct: [0, 1, 2] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[2, -1], [1, 2]])
x = np.array([3, 1])
print((x[0] * A[:, 0] + x[1] * A[:, 1] == A @ x).all(), (A @ x)[1])`}</Code>
          <p>This prints True and a number. What is the number?</p>
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
A = np.array([[1, 2], [3, 4]])
B = np.array([[0, 1], [1, 0]])
print(A @ B, (A * B).sum(), np.array_equal(A @ B, B @ A))`}</Code>
          <p>A matrix product, an entrywise product summed, and a commutativity check. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[[2 1]\n [4 3]] 5 False", "[[3 4]\n [1 2]] 5 False", "[[2 1]\n [4 3]] 10 False", "[[2 1]\n [4 3]] 5 True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>matvec(A, x)</C>, which computes Ax as a combination of the columns of A: x₁ times column 1, plus x₂ times
            column 2, and so on. Do not use <C>@</C> or <C>np.dot</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def matvec(A, x):
    A = np.asarray(A, float)
    out = np.zeros(A.shape[0])
    return out
`,
        solution: `import numpy as np

def matvec(A, x):
    A = np.asarray(A, float)
    out = np.zeros(A.shape[0])
    for j, xj in enumerate(x):
        out += xj * A[:, j]
    return out
`,
        tests: [
          { name: "square", code: `import numpy as np
assert np.allclose(matvec([[2, -1], [1, 2]], [3, 1]), [5, 5]), 'A = [[2, −1], [1, 2]] times (3, 1) is (5, 5).'` },
          { name: "rectangular", code: `import numpy as np
assert np.allclose(matvec([[1, 2, 0], [0, 1, -1], [3, 0, 1], [1, 1, 1]], [2, 1, 3]), [4, -2, 9, 6]), 'The output has one entry per row of A.'` },
          { name: "columns", code: `import numpy as np
assert np.allclose(matvec([[1, 2], [3, 4]], [0, 1]), [2, 4]), 'A times e₂ should be column 2 of A.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>matrix_power(A, k)</C> for a square NumPy matrix and integer k ≥ 0 by repeated squaring (at most about 2 log₂ k products), and <C>fib_matrix(n)</C>, the n-th Fibonacci number as the top-right entry of [[1, 1], [1, 0]]ⁿ computed with Python integers (use <C>dtype=object</C>) so that n = 500 is exact. Do not use <C>np.linalg.matrix_power</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def matrix_power(A, k):
    A = np.asarray(A)
    R = np.eye(len(A), dtype=A.dtype)
    for _ in range(k):
        R = R @ A
    return R

def fib_matrix(n):
    return int(matrix_power(np.array([[1, 1], [1, 0]]), n)[0, 1])
`,
        solution: `import numpy as np

def matrix_power(A, k):
    A = np.asarray(A)
    R = np.eye(len(A), dtype=A.dtype)
    if A.dtype == object:
        R = np.array([[1 if i == j else 0 for j in range(len(A))] for i in range(len(A))], dtype=object)
    while k:
        if k & 1:
            R = R @ A
        A = A @ A
        k >>= 1
    return R

def fib_matrix(n):
    return int(matrix_power(np.array([[1, 1], [1, 0]], dtype=object), n)[0, 1])
`,
        tests: [
          { name: "powers", code: `import numpy as np
A = np.array([[1, 1], [0, 1]])
assert np.array_equal(matrix_power(A, 0), np.eye(2)) and np.array_equal(matrix_power(A, 7), [[1, 7], [0, 1]]), 'Shears add up.'` },
          { name: "random", code: `import numpy as np
rng = np.random.default_rng(3)
A = rng.integers(-2, 3, size=(4, 4))
assert np.array_equal(matrix_power(A, 13), np.linalg.matrix_power(A, 13)), 'Agree with NumPy.'` },
          { name: "fib", code: `assert [fib_matrix(n) for n in range(10)] == [0, 1, 1, 2, 3, 5, 8, 13, 21, 34] and fib_matrix(500) == 139423224561697880139724382870407283950070256587697307264108962948325571622863290691557658876222521294125, 'Exact big integers.'` },
          { name: "few products", code: `import numpy as np
class Counted(np.ndarray):
    pass
count = [0]
real = np.ndarray.__matmul__
A = np.array([[1.0, 1.0], [1.0, 0.0]])
import inspect
src = inspect.getsource(matrix_power)
assert 'linalg' not in src and ('>>' in src or '// 2' in src or '%' in src or '&' in src), 'Square the matrix and halve k.'` },
        ],
      },
    },
    {
      key: "pictures",
      rung: "prove",
      prompt: (
        <p>
          Prove that the row picture and the column picture of Ax agree: the vector whose i-th entry is (row i) · x equals{" "}
          <M>{"x_1\\mathbf a_1 + \\dots + x_n\\mathbf a_n"}</M>. Then use it to show that <M>{"A\\mathbf e_j"}</M> is column j.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes the i-th entry of the column combination as x₁a_i1 + … + xₙa_in.",
          "Recognises this as the dot product of row i with x, for every i.",
          "Applies the column picture to x = e_j, where only x_j = 1 is non-zero, giving a_j.",
        ],
      },
    },
    {
      key: "cost",
      rung: "stretch",
      prompt: <p>How many multiplications does it take to compute Wx for a 4096 × 4096 matrix W?</p>,
      answer: { kind: "numeric", value: 16777216 },
    },
  ],

  teachBack:
    "Explain to a friend the two ways to read a matrix times a vector, why Ax = b asks whether b is a combination of the columns, and why a matrix is determined by what it does to e₁, …, eₙ.",

  glimpse: (
    <p>
      Next, multiplying two matrices, which can be seen in four different ways, each useful somewhere. Multivariable and
      Matrix Calculus treats the derivative of any function as a matrix acting on small changes, and Neural Networks from
      Scratch stacks layers of y = Wx with non-linearities in between.
    </p>
  ),
};
