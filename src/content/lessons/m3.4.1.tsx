import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { SubspaceTestViz } from "@/components/viz/SubspaceTestViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.4.1",
  minutes: 55,
  links: {
    requires: ["m3.1.1"],
    revisits: ["m1.4.2"],
    foreshadows: ["m6.1.1", "m3.4.2"],
  },

  puzzle: (
    <>
      <p>
        You have a set of vectors, and you are allowed to add any two of them and to stretch any one of them by any number,
        including negative numbers and zero. You keep doing this.
      </p>
      <p>
        Which sets are already &ldquo;complete&rdquo;, in the sense that nothing you do can ever take you outside? Is the line
        y = x + 1 such a set? Is the first quadrant?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A <strong>subspace</strong> is a set that is closed under the two operations of linear algebra: sums and multiples
        stay inside. Choose a set below and look at the two test vectors u and v, their sum and a multiple. Only one of the
        four sets survives both tests.
      </p>
      <SubspaceTestViz />
    </>
  ),

  theory: (
    <>
      <Definition title="vector space">
        <p>
          A <strong>vector space</strong> is a set V with an addition and a multiplication by real numbers that obey the
          familiar rules: addition is commutative and associative, there is a zero vector, every vector has a negative, and
          multiplication distributes over addition. <M>{"\\mathbb R^n"}</M> is the main example, but so are the 2 × 2 matrices,
          the polynomials, and the functions from <M>{"\\mathbb R"}</M> to <M>{"\\mathbb R"}</M>.
        </p>
      </Definition>

      <Definition title="subspace">
        <p>A subset S of a vector space is a <strong>subspace</strong> if</p>
        <ul>
          <li>0 is in S;</li>
          <li>u + v is in S whenever u and v are; and</li>
          <li>cu is in S whenever u is in S and c is a real number.</li>
        </ul>
        <p>A subspace is a vector space in its own right.</p>
      </Definition>

      <Theorem title="the subspaces of the plane and of space">
        <p>
          The subspaces of <M>{"\\mathbb R^2"}</M> are {"{0}"}, the lines through 0, and <M>{"\\mathbb R^2"}</M> itself. The
          subspaces of <M>{"\\mathbb R^3"}</M> are {"{0}"}, lines through 0, planes through 0, and <M>{"\\mathbb R^3"}</M>.
        </p>
      </Theorem>

      <Theorem title="spans are subspaces">
        <p>
          The span of any set of vectors is a subspace, and it is the smallest subspace containing them.
        </p>
      </Theorem>
      <Proof>
        <p>
          0 is the combination with all coefficients 0. A sum or multiple of combinations is again a combination. Any subspace
          that contains the vectors contains all their combinations, by repeated use of the closure rules.
        </p>
      </Proof>

      <Example title="subspaces that are not arrows">
        <p>
          The polynomials p of degree at most 2 with p(1) = 0 form a subspace: if p(1) = q(1) = 0 then (p + q)(1) = 0 and
          (cp)(1) = 0. The solutions of the differential equation f″ + f = 0 form a subspace of the functions, which is why every
          solution is a combination of sin and cos.
        </p>
      </Example>

      <Remark title="the quick test">
        <p>
          The fastest way to rule a set out is to check 0. The line y = x + 1 fails at once. The first quadrant contains 0 but
          fails under multiplication by −1. The union of two lines fails under addition.
        </p>
      </Remark>

      <Remark title="why this matters">
        <p>
          Subspaces are the shapes linear maps produce and preserve. Everything Ax can be is a subspace; everything that Ax
          sends to 0 is a subspace. Later lessons measure their size with dimension and compute bases for them.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "plane",
      rung: "check",
      prompt: <p>Which of these are subspaces of <M>{"\\mathbb R^2"}</M>? Select all that apply.</p>,
      answer: { kind: "choice", options: ["The line y = 2x", "The line y = 2x + 1", "The set {0}", "The first quadrant", "All of ℝ²"], correct: [0, 2, 4] },
    },
    {
      key: "zero",
      rung: "check",
      prompt: <p>Which vector must every subspace contain?</p>,
      answer: { kind: "choice", options: ["The zero vector", "(1, 1, …, 1)", "Every standard basis vector", "None in particular"], correct: [0] },
    },
    {
      key: "space",
      rung: "apply",
      prompt: <p>Which of these are subspaces of <M>{"\\mathbb R^3"}</M>? Select all that apply.</p>,
      answer: { kind: "choice", options: ["The plane x + y + z = 0", "The plane x + y + z = 1", "The points (t, t², 0)", "The points (a, b, 0)"], correct: [0, 3] },
    },
    {
      key: "funcs",
      rung: "apply",
      prompt: <p>Which of these sets of functions are vector spaces? Select all that apply.</p>,
      answer: {
        kind: "choice",
        options: ["Functions f with f(0) = 0", "Functions f with f(0) = 1", "Polynomials of degree exactly 2", "Solutions of f″ + f = 0"],
        correct: [0, 3],
      },
    },
    {
      key: "c",
      rung: "apply",
      prompt: <p>For which value of c is the set of (x, y, z) with x + 2y − z = c a subspace?</p>,
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
u = np.array([2.0, 2.0])
v = np.array([-2.0, 0.0])
on_line = lambda p: np.isclose(p[1], 0.5 * p[0] + 1)
print(on_line(u), on_line(v), on_line(u + v))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True True False", "True True True", "False False False", "True False True"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
rng = np.random.default_rng(0)
in_plane = lambda v: abs(v[0] + v[1] - 2 * v[2]) < 1e-9
u, v = np.array([1.0, 1.0, 1.0]), np.array([2.0, 0.0, 1.0])
print(in_plane(u), in_plane(v), in_plane(3 * u - 5 * v), in_plane(u + np.array([0, 0, 1])))`}</Code>
          <p>Is the plane x + y = 2z closed under combinations? What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True True True False", "True True False False", "True False True False", "True True True True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>in_span(vectors, b)</C>, which returns <C>True</C> when b is a linear combination of the given vectors. Compare
            ranks with <C>np.linalg.matrix_rank</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def in_span(vectors, b):
    return True
`,
        solution: `import numpy as np

def in_span(vectors, b):
    V = np.column_stack([np.asarray(v, float) for v in vectors])
    return bool(np.linalg.matrix_rank(np.column_stack([V, b])) == np.linalg.matrix_rank(V))
`,
        tests: [
          { name: "in the plane", code: `assert in_span([[1, 0, 1], [0, 1, 1]], [2, 3, 5]), '(2, 3, 5) = 2(1, 0, 1) + 3(0, 1, 1).'` },
          { name: "off the plane", code: `assert not in_span([[1, 0, 1], [0, 1, 1]], [1, 1, 1]), '(1, 1, 1) is not in the plane: its third entry is not the sum of the first two.'` },
          { name: "zero", code: `assert in_span([[1, 2]], [0, 0]), 'Every span contains the zero vector.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>is_subspace(member, sample, trials, seed)</C>, a randomised test of the subspace conditions for a set described by a predicate <C>member</C>: seed NumPy&rsquo;s generator, draw pairs of members by calling <C>sample(rng)</C> (which returns a member), and check that 0 is a member and that a·u + b·v is a member for random reals a, b. Return <C>False</C> as soon as a check fails. The tests try planes through the origin, shifted planes, the union of two lines and the set of symmetric matrices.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def is_subspace(member, sample, trials, seed):
    return True
`,
        solution: `import numpy as np

def is_subspace(member, sample, trials, seed):
    rng = np.random.default_rng(seed)
    first = sample(rng)
    if not member(np.zeros_like(np.asarray(first, float))):
        return False
    for _ in range(trials):
        u, v = np.asarray(sample(rng), float), np.asarray(sample(rng), float)
        a, b = rng.normal(), rng.normal()
        if not member(a * u + b * v):
            return False
    return True
`,
        tests: [
          { name: "plane", code: `import numpy as np
member = lambda v: abs(v[0] + v[1] - 2 * v[2]) < 1e-9
def sample(rng):
    x, y = rng.normal(size=2)
    return np.array([x, y, (x + y) / 2])
assert is_subspace(member, sample, 100, 0), 'A plane through 0 is a subspace.'` },
          { name: "shifted", code: `import numpy as np
member = lambda v: abs(v[0] + v[1] - 2 * v[2] - 1) < 1e-9
def sample(rng):
    x, y = rng.normal(size=2)
    return np.array([x, y, (x + y - 1) / 2])
assert not is_subspace(member, sample, 100, 0), 'It misses the origin.'` },
          { name: "two lines", code: `import numpy as np
member = lambda v: abs(v[1]) < 1e-9 or abs(v[0]) < 1e-9
def sample(rng):
    t = rng.normal()
    return np.array([t, 0.0]) if rng.random() < 0.5 else np.array([0.0, t])
assert not is_subspace(member, sample, 200, 1), 'The union of the axes is not closed under addition.'` },
          { name: "symmetric", code: `import numpy as np
member = lambda M: np.allclose(M, M.T)
def sample(rng):
    A = rng.normal(size=(3, 3))
    return A + A.T
assert is_subspace(member, sample, 50, 2), 'Symmetric matrices form a subspace.'` },
        ],
      },
    },
    {
      key: "intersect",
      rung: "prove",
      prompt: (
        <p>
          Prove that the intersection of two subspaces S and T is a subspace. Then give an example showing that their union need
          not be.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that 0 is in both S and T, so in the intersection.",
          "If u and v are in both, u + v and cu are in both by closure of each, so in the intersection.",
          "Gives an example such as the x-axis and y-axis in ℝ², where (1, 0) + (0, 1) = (1, 1) is in neither.",
        ],
      },
    },
    {
      key: "sym",
      rung: "stretch",
      prompt: <p>Which of these are subspaces of the space of 2 × 2 matrices? Select all that apply.</p>,
      answer: {
        kind: "choice",
        options: ["The symmetric matrices", "The invertible matrices", "The matrices with trace 0", "The matrices with determinant 0"],
        correct: [0, 2],
      },
    },
  ],

  teachBack:
    "Explain to a friend what a subspace is, the quickest ways to show a set is not one, and why the span of any vectors is always a subspace.",

  glimpse: (
    <p>
      Next, the two subspaces every matrix carries: the column space, everything Ax can reach, and the null space, everything
      Ax sends to zero. Linear Algebra II develops abstract vector spaces, where the vectors are functions or matrices as often
      as arrows.
    </p>
  ),
};
