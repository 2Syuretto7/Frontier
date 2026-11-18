import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { SolutionsViz } from "@/components/viz/SolutionsViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.2.3",
  minutes: 55,
  links: {
    requires: ["m3.2.2", "m3.1.4"],
    revisits: ["m0.2.3"],
    foreshadows: ["m3.4.5", "m6.4.4", "m3.5.3"],
  },

  puzzle: (
    <>
      <p>
        A linear system has exactly two solutions, (1, 0, 0) and (0, 1, 0). Your colleague claims to have found them both and
        checked them carefully.
      </p>
      <p>Without seeing the equations, can you say for certain that the colleague is wrong, or has missed something?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two equations in two unknowns are two lines. Lines can cross once, be parallel and never meet, or be the same line and
        share every point. There is no way for two straight lines to meet in exactly two points. Tilt and shift the dashed
        line below and look for any other outcome.
      </p>
      <SolutionsViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="zero, one or infinitely many">
        <p>Every linear system Ax = b has no solution, exactly one solution, or infinitely many solutions.</p>
      </Theorem>
      <Proof>
        <p>
          Suppose x and y are two different solutions. Then for every t,{" "}
          <M>{"A(\\mathbf x + t(\\mathbf y - \\mathbf x)) = \\mathbf b + t(\\mathbf b - \\mathbf b) = \\mathbf b"}</M>, so every
          point on the line through x and y is a solution. That is infinitely many.
        </p>
      </Proof>

      <Theorem title="existence">
        <p>
          Ax = b has a solution exactly when the RREF of [A | b] has no row of the form [0 0 … 0 | d] with d ≠ 0. Equivalently,
          when b is a combination of the columns of A.
        </p>
      </Theorem>

      <Theorem title="the structure of the solutions">
        <p>
          If <M>{"\\mathbf x_p"}</M> is one solution of Ax = b, then the solutions are exactly the vectors{" "}
          <M>{"\\mathbf x_p + \\mathbf x_n"}</M>, where <M>{"A\\mathbf x_n = \\mathbf 0"}</M>. So a consistent system has a
          unique solution exactly when Ax = 0 has only the solution 0, which happens when there are no free variables.
        </p>
      </Theorem>

      <Definition title="rank and the four cases">
        <p>For an m × n matrix of rank r:</p>
        <ul>
          <li>r = m = n: exactly one solution for every b;</li>
          <li>r = n &lt; m: zero or one solution;</li>
          <li>r = m &lt; n: infinitely many solutions for every b;</li>
          <li>r &lt; m and r &lt; n: zero or infinitely many.</li>
        </ul>
      </Definition>

      <Example title="a parameter that decides">
        <p>
          Take x + ky = 1 and kx + 4y = 2. Eliminating gives the second pivot <M>{"4 - k^2"}</M>. If k ≠ ±2 there is one
          solution. If k = 2, the second equation is twice the first: infinitely many. If k = −2, eliminating gives{" "}
          <M>{"0 = 4"}</M>: none.
        </p>
      </Example>

      <Remark title="the puzzle">
        <p>
          The colleague is wrong: a linear system with two solutions has infinitely many, including every point (t, 1 − t, 0)
          on the line through the two.
        </p>
      </Remark>

      <Remark title="too many equations">
        <p>
          With more equations than unknowns, as when fitting a line through hundreds of data points, there is usually no exact
          solution. Chapter 5 asks for the closest thing instead: least squares.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "unique",
      rung: "check",
      prompt: <p>Can a system of two equations in three unknowns have exactly one solution?</p>,
      answer: { kind: "choice", options: ["No", "Yes", "Only if the right-hand side is zero"], correct: [0] },
    },
    {
      key: "counts",
      rung: "check",
      prompt: <p>Which numbers of solutions are possible for a linear system? Select all that apply.</p>,
      answer: { kind: "choice", options: ["0", "1", "2", "Infinitely many"], correct: [0, 1, 3] },
    },
    {
      key: "consistent",
      rung: "apply",
      prompt: <p>For which value of c does x + y = 2, 2x + 2y = c have a solution?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "none",
      rung: "apply",
      prompt: <p>For which value of k does x + ky = 1, kx + 4y = 2 have no solution?</p>,
      answer: { kind: "numeric", value: -2 },
    },
    {
      key: "row",
      rung: "apply",
      prompt: <p>The RREF of [A | b] has a row [0 0 0 | 5]. How many solutions does Ax = b have?</p>,
      answer: { kind: "choice", options: ["None", "Exactly one", "Infinitely many", "It depends on the other rows"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[1.0, 2.0], [2.0, 4.0]])
Ab = np.column_stack([A, [3.0, 7.0]])
print(np.linalg.matrix_rank(A), np.linalg.matrix_rank(Ab))`}</Code>
          <p>This prints two numbers. What does their difference tell you about Ax = b with b = (3, 7)?</p>
        </>
      ),
      answer: { kind: "choice", options: ["It has no solution", "It has exactly one solution", "It has infinitely many solutions"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[1, 2], [2, 4], [3, 6]])
for b in ([1, 2, 3], [1, 2, 4]):
    Ab = np.column_stack([A, b])
    print(np.linalg.matrix_rank(A), np.linalg.matrix_rank(Ab))`}</Code>
          <p>Rank of A and of the augmented matrix for two right sides. What does this print, line by line?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1 1 / 1 2", "1 1 / 1 1", "2 2 / 2 3", "1 2 / 1 2"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>count_solutions(A, b)</C>, returning the string <C>"none"</C>, <C>"one"</C> or <C>"infinite"</C>. Compare
            the rank of A, the rank of [A | b] and the number of columns. <C>np.linalg.matrix_rank</C> is allowed.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def count_solutions(A, b):
    return "one"
`,
        solution: `import numpy as np

def count_solutions(A, b):
    A = np.asarray(A, float)
    r = np.linalg.matrix_rank(A)
    rb = np.linalg.matrix_rank(np.column_stack([A, b]))
    if rb > r:
        return "none"
    return "one" if r == A.shape[1] else "infinite"
`,
        tests: [
          { name: "parallel", code: `assert count_solutions([[1, -2], [-2, 4]], [1, 2]) == 'none', 'Parallel distinct lines never meet.'` },
          { name: "same line", code: `assert count_solutions([[1, 2], [2, 4]], [1, 2]) == 'infinite', 'The same line twice has infinitely many solutions.'` },
          { name: "crossing", code: `assert count_solutions([[1, 1], [1, -1]], [2, 0]) == 'one', 'Two crossing lines meet once.'` },
          { name: "wide", code: `assert count_solutions([[1, 2, 2], [2, 4, 6]], [2, 8]) == 'infinite', 'Two equations in three unknowns with a solution have infinitely many.'` },
          { name: "tall", code: `assert count_solutions([[1, 0], [1, 1], [1, 2]], [6, 0, 0]) == 'none', 'Three equations in two unknowns usually have no exact solution.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            The starter gives <C>rank(M, tol)</C>, which row-reduces M with partial pivoting and counts the pivots larger than tol times the largest entry of M. Write <C>classify_system(A, b, tol=1e-10)</C>, which uses the ranks of A and of [A | b] to return <C>("none", r)</C>, <C>("one", r)</C> or <C>("infinite", r)</C> where r is the rank of A. Then write <C>free_variables(A, tol=1e-10)</C>, the number of free variables in the solutions of Ax = b whenever there are any, and <C>fragile(A, b, eps=1e-6)</C> for a square invertible A: how far the solution moves when the first entry of b grows by eps, as the length of the change in x (both solutions from <C>np.linalg.solve</C>) divided by eps.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rank(M, tol):
    M = np.array(M, float)
    scale = np.abs(M).max() if M.size else 0.0
    r = 0
    for c in range(M.shape[1]):
        if r == M.shape[0]:
            break
        p = r + int(np.argmax(np.abs(M[r:, c])))
        if abs(M[p, c]) <= tol * scale:
            continue
        M[[r, p]] = M[[p, r]]
        for i in range(r + 1, M.shape[0]):
            M[i] -= M[i, c] / M[r, c] * M[r]
        r += 1
    return r

def classify_system(A, b, tol=1e-10):
    return ('one', np.asarray(A).shape[1])

def free_variables(A, tol=1e-10):
    return 0

def fragile(A, b, eps=1e-6):
    return 1.0
`,
        solution: `import numpy as np

def rank(M, tol):
    M = np.array(M, float)
    scale = np.abs(M).max() if M.size else 0.0
    r = 0
    for c in range(M.shape[1]):
        if r == M.shape[0]:
            break
        p = r + int(np.argmax(np.abs(M[r:, c])))
        if abs(M[p, c]) <= tol * scale:
            continue
        M[[r, p]] = M[[p, r]]
        for i in range(r + 1, M.shape[0]):
            M[i] -= M[i, c] / M[r, c] * M[r]
        r += 1
    return r

def classify_system(A, b, tol=1e-10):
    A = np.asarray(A, float)
    r = rank(A, tol)
    rb = rank(np.column_stack([A, b]), tol)
    if rb > r:
        return ('none', r)
    return ('one', r) if r == A.shape[1] else ('infinite', r)

def free_variables(A, tol=1e-10):
    A = np.asarray(A, float)
    return A.shape[1] - rank(A, tol)

def fragile(A, b, eps=1e-6):
    b = np.asarray(b, float)
    x = np.linalg.solve(A, b)
    db = np.zeros_like(b)
    db[0] = eps
    return float(np.linalg.norm(np.linalg.solve(A, b + db) - x) / eps)
`,
        tests: [
          { name: "cases", code: `A = [[1, 2], [2, 4], [3, 6]]
assert classify_system(A, [1, 2, 3]) == ('infinite', 1) and classify_system(A, [1, 2, 4]) == ('none', 1) and classify_system([[1, 0], [0, 1], [1, 1]], [1, 2, 3]) == ('one', 2), 'Compare ranks.'` },
          { name: "free", code: `assert free_variables([[1, 2], [2, 4], [3, 6]]) == 1 and free_variables([[1, 0, 2], [0, 1, 3]]) == 1 and free_variables([[1, 0], [0, 1]]) == 0, 'Columns minus pivots.'` },
          { name: "fragile", code: `assert abs(fragile([[2, 0], [0, 0.5]], [1, 1]) - 0.5) < 1e-6 and 14000 < fragile([[1, 1], [1, 1.0001]], [2, 2.0001]) < 14300, 'Nearly parallel rows make the solution jump.'` },
          { name: "hilbert", code: `import numpy as np
H = 1 / (np.arange(8)[:, None] + np.arange(8) + 1)
assert 4e5 < fragile(H, np.ones(8)) < 4.5e5, 'The 8 × 8 Hilbert matrix moves its solution about 425 000 times as far as b moved.'` },
        ],
      },
    },
    {
      key: "rank",
      rung: "stretch",
      prompt: <p>An m × n matrix A has rank r. Which statements are always true? Select all that apply.</p>,
      answer: {
        kind: "choice",
        options: [
          "If r = m, Ax = b has a solution for every b.",
          "If r = n, Ax = b has at most one solution.",
          "If r < n, Ax = 0 has infinitely many solutions.",
          "If m < n, Ax = b has a solution for every b.",
        ],
        correct: [0, 1, 2],
      },
    },
  ],

  glimpse: (
    <p>
      Next chapter: matrices as objects in their own right, which can be added, multiplied and inverted. Linear Algebra II
      returns to systems with no solution or many through the pseudoinverse, which picks the best answer in either case.
    </p>
  ),
};
