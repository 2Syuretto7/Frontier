import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { BasisViz } from "@/components/viz/BasisViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.4.4",
  minutes: 55,
  links: {
    requires: ["m3.4.3"],
    foreshadows: ["m3.8.2", "m6.2.2", "m3.4.5"],
  },

  puzzle: (
    <>
      <p>
        The plane x + y + z = 0 in space is a subspace. One student describes it with the vectors (1, −1, 0) and (0, 1, −1).
        Another uses (1, 0, −1), (1, −2, 1) and (2, −2, 0).
      </p>
      <p>
        Both sets span the plane. Is one of them wasteful? Could a third student describe the plane with just one vector, or
        must every good description use the same number?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A <strong>basis</strong> is a set of vectors that reaches everything in a space with no redundancy. Each vector then
        has exactly one set of coordinates. Below, the same point is described in three bases. The grid changes and the
        coordinates change, but the number of coordinates needed never does.
      </p>
      <BasisViz />
    </>
  ),

  theory: (
    <>
      <Definition title="basis">
        <p>
          A <strong>basis</strong> of a vector space V is a set of vectors that is linearly independent and spans V.
        </p>
      </Definition>

      <Theorem title="unique coordinates">
        <p>
          If <M>{"\\mathbf v_1, \\dots, \\mathbf v_n"}</M> is a basis of V, every v in V can be written as{" "}
          <M>{"c_1\\mathbf v_1 + \\dots + c_n\\mathbf v_n"}</M> in exactly one way. The numbers <M>{"c_i"}</M> are the
          coordinates of v in this basis.
        </p>
      </Theorem>
      <Proof>
        <p>
          Spanning gives at least one way. If there were two, subtract them: <M>{"\\sum (c_i - d_i)\\mathbf v_i = \\mathbf 0"}</M>,
          and independence forces <M>{"c_i = d_i"}</M>.
        </p>
      </Proof>

      <Theorem title="dimension">
        <p>
          Every basis of V has the same number of vectors. That number is the <strong>dimension</strong> of V.
        </p>
      </Theorem>
      <Proof>
        <p>
          Suppose <M>{"\\mathbf v_1, \\dots, \\mathbf v_m"}</M> and <M>{"\\mathbf w_1, \\dots, \\mathbf w_n"}</M> are bases
          with n &gt; m. Each w is a combination of the v&rsquo;s: W = VA for an m × n matrix A. Since n &gt; m, Ac = 0 has a
          non-zero solution, and then Wc = VAc = 0, contradicting the independence of the w&rsquo;s.
        </p>
      </Proof>

      <Theorem title="useful facts">
        <ul>
          <li>In a space of dimension n, any n independent vectors form a basis, and so do any n vectors that span.</li>
          <li>Any independent set can be extended to a basis; any spanning set can be cut down to one.</li>
          <li>The pivot columns of A form a basis of C(A); the special solutions form a basis of N(A).</li>
        </ul>
      </Theorem>

      <Example title="the puzzle">
        <p>
          The plane has dimension 2. The first student&rsquo;s two vectors are independent, so they form a basis. The second
          student&rsquo;s three vectors are dependent ((2, −2, 0) is the sum of the other two), so one can be dropped. One
          vector spans only a line, so it cannot describe the plane.
        </p>
      </Example>

      <Example title="spaces that are not columns">
        <p>
          The polynomials of degree at most 3 have basis 1, x, x², x³ and dimension 4. The 2 × 2 matrices have dimension 4, and
          the symmetric ones dimension 3, with basis [[1, 0], [0, 0]], [[0, 0], [0, 1]], [[0, 1], [1, 0]].
        </p>
      </Example>

      <Remark title="choosing a basis">
        <p>
          A good basis can turn a hard problem into an easy one. The rest of this course is largely the search for the right
          basis: orthonormal bases in Chapter 5, eigenvector bases in Chapter 7, and singular vector bases in Chapter 8.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dim",
      rung: "check",
      prompt: <p>What is the dimension of <M>{"\\mathbb R^5"}</M>?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "def",
      rung: "check",
      prompt: <p>A basis of a vector space is a set of vectors that:</p>,
      answer: {
        kind: "choice",
        options: ["Is independent and spans the space", "Spans the space", "Is independent", "Is perpendicular and has length 1"],
        correct: [0],
      },
    },
    {
      key: "coords",
      rung: "apply",
      prompt: <p>Find the coordinates of (3, 3) in the basis (2, 1), (−1, 1). Give the first coordinate.</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "plane",
      rung: "apply",
      prompt: <p>What is the dimension of the plane x + y + z = 0 in <M>{"\\mathbb R^3"}</M>?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "sym",
      rung: "apply",
      prompt: <p>What is the dimension of the space of symmetric 3 × 3 matrices?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
B = np.array([[2.0, -1.0], [1.0, 1.0]])
c = np.linalg.solve(B, np.array([3.0, 3.0]))
print(c)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[2. 1.]", "[1. 2.]", "[3. 3.]", "[1. 1.]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>coordinates(basis, v)</C>, which returns the coordinates of v in the given basis of ℝⁿ (a list of n
            vectors).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def coordinates(basis, v):
    return np.asarray(v, float)
`,
        solution: `import numpy as np

def coordinates(basis, v):
    B = np.column_stack([np.asarray(b, float) for b in basis])
    return np.linalg.solve(B, v)
`,
        tests: [
          { name: "skewed basis", code: `import numpy as np
assert np.allclose(coordinates([[2, 1], [-1, 1]], [3, 3]), [2, 1]), '(3, 3) = 2(2, 1) + 1(−1, 1).'` },
          { name: "rebuilds v", code: `import numpy as np
rng = np.random.default_rng(3)
B = list(rng.standard_normal((4, 4))); v = rng.standard_normal(4)
c = coordinates(B, v)
assert np.allclose(sum(ci * bi for ci, bi in zip(c, B)), v), 'Combining the basis vectors with your coordinates should give v back.'` },
        ],
      },
    },
    {
      key: "extend",
      rung: "prove",
      prompt: (
        <p>
          Let V have dimension n. Prove that any n independent vectors in V span V, so they form a basis. You may use that every
          basis has n vectors and that n + 1 vectors in V are always dependent.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Supposes some v in V is not in the span of the n independent vectors.",
          "Shows the n + 1 vectors, including v, are then independent: in a dependency, the coefficient of v must be 0, and then the original n force the rest to 0.",
          "Contradicts the fact that n + 1 vectors in an n-dimensional space are dependent.",
        ],
      },
    },
    {
      key: "poly",
      rung: "stretch",
      prompt: <p>What is the dimension of the space of polynomials p of degree at most 4 with p(0) = 0 and p(1) = 0?</p>,
      answer: { kind: "numeric", value: 3 },
    },
  ],

  teachBack:
    "Explain to a friend what a basis is, why coordinates in a basis are unique, why every basis of a space has the same size, and how to find bases for the column space and null space.",

  glimpse: (
    <p>
      Next, the four fundamental subspaces of a matrix and how their dimensions fit together. Chapter 8 changes basis on
      purpose, and Linear Algebra II builds orthonormal bases in any inner product space.
    </p>
  ),
};
