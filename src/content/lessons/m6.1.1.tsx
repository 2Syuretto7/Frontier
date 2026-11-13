import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RotationEigenViz } from "@/components/viz/RotationEigenViz";
import type { LessonContent } from "@/lib/types";

const REAL = `import numpy as np

def realify(A):
    A = np.asarray(A, dtype=complex)
    return np.block([[A.real, -A.imag], [A.imag, A.real]])

def realify_vec(v):
    v = np.asarray(v, dtype=complex)
    return np.concatenate([v.real, v.imag])`;

const SPAN = `def in_span(vectors, v, tol=1e-9):
    A = np.column_stack(vectors)
    c = np.linalg.lstsq(A, v, rcond=None)[0]
    return bool(np.linalg.norm(A @ c - v) <= tol * max(1.0, np.linalg.norm(v)))

def coords_in_basis(basis, v):
    return np.linalg.solve(np.column_stack(basis), v)`;

export const lesson: LessonContent = {
  id: "m6.1.1",
  minutes: 50,
  links: {
    requires: ["m3.4.1", "m0.6.4"],
    revisits: ["m3.4.4", "m3.7.1"],
    foreshadows: ["m6.1.2", "m6.3.3"],
  },

  puzzle: (
    <>
      <p>
        Polynomials can be added and scaled. So can functions, matrices, sequences and random variables. Every fact proved
        about vectors in <M>{"\\mathbb{R}^n"}</M> that used only adding and scaling holds for all of them at once, if the
        proof is written carefully. And one more surprise: the rotation of the plane by 90° has no eigenvector at all, yet
        allowing complex scalars gives it two. Which scalars should linear algebra use?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A vector space is anything with an addition and a scaling that obey the familiar rules. The rules, not the arrows,
        are what the theorems need. The scalars come from a field F, either ℝ or ℂ in this course. Real scalars match
        geometry; complex scalars make algebra complete, because every polynomial over ℂ has a root, so every operator has
        an eigenvalue.
      </p>
      <RotationEigenViz />
    </>
  ),

  theory: (
    <>
      <Definition title="vector space">
        <p>
          A vector space over F (ℝ or ℂ) is a set V with an addition <M>{"V \\times V \\to V"}</M> and a scalar
          multiplication <M>{"F \\times V \\to V"}</M> such that addition is commutative and associative, there is an
          additive identity 0, every v has an additive inverse, <M>{"1v = v"}</M>, <M>{"(ab)v = a(bv)"}</M>, and both
          distributive laws <M>{"a(u + v) = au + av"}</M>, <M>{"(a + b)v = av + bv"}</M> hold.
        </p>
      </Definition>

      <Example title="spaces that are not arrows">
        <p>
          <M>{"F^n"}</M>; the matrices <M>{"F^{m \\times n}"}</M>; the polynomials <M>{"\\mathcal{P}_m(F)"}</M> of degree at
          most m, of dimension m + 1; the functions <M>{"F^S"}</M> from any set S to F, added and scaled pointwise. A polynomial
          is determined by its coefficient vector, which is why code stores it as an array.
        </p>
      </Example>

      <Theorem title="consequences of the axioms">
        <p>In every vector space, the additive identity is unique, and <M>{"0v = 0"}</M> and <M>{"(-1)v = -v"}</M> for every v.</p>
      </Theorem>
      <Proof>
        <p>
          If 0 and 0′ are both identities, <M>{"0 = 0 + 0' = 0'"}</M>. Next, <M>{"0v = (0 + 0)v = 0v + 0v"}</M>; adding the
          inverse of 0v to both sides gives <M>{"0 = 0v"}</M>. Finally{" "}
          <M>{"v + (-1)v = 1v + (-1)v = (1 + (-1))v = 0v = 0"}</M>, so <M>{"(-1)v"}</M> is an additive inverse of v, and
          inverses are unique by the same argument as identities.
        </p>
      </Proof>

      <Definition title="subspaces">
        <p>
          A subset U of V is a subspace if it contains 0 and is closed under addition and scalar multiplication. Then U is a
          vector space in its own right. The polynomials with <M>{"p(0) = 0"}</M> form a subspace; those with{" "}
          <M>{"p(0) = 1"}</M> do not, since they miss 0.
        </p>
        <Code>{SPAN}</Code>
      </Definition>

      <Theorem title="complex operators have eigenvalues">
        <p>
          Every linear map T from a finite-dimensional complex vector space <M>{"V \\ne \\{0\\}"}</M> to itself has an
          eigenvalue.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let n = dim V and pick <M>{"v \\ne 0"}</M>. The n + 1 vectors <M>{"v, Tv, \\dots, T^n v"}</M> are linearly
          dependent, so <M>{"a_0 v + a_1 Tv + \\dots + a_n T^n v = 0"}</M> with not all <M>{"a_j"}</M> zero. Not all of{" "}
          <M>{"a_1, \\dots, a_n"}</M> are zero either, otherwise <M>{"a_0 v = 0"}</M> with <M>{"a_0 \\ne 0"}</M>. By the
          fundamental theorem of algebra the polynomial <M>{"\\sum a_j z^j"}</M> factors over ℂ as{" "}
          <M>{"c(z - \\lambda_1)\\cdots(z - \\lambda_m)"}</M> with c ≠ 0 and m ≥ 1, so{" "}
          <M>{"c(T - \\lambda_1 I)\\cdots(T - \\lambda_m I)v = 0"}</M>. A product of maps sends the nonzero v to 0, so one of
          the factors <M>{"T - \\lambda_j I"}</M> is not injective: <M>{"\\lambda_j"}</M> is an eigenvalue.
        </p>
      </Proof>

      <Remark title="moving between ℝ and ℂ">
        <p>
          A complex space of dimension n is also a real space of dimension 2n: identify <M>{"x + iy \\in \\mathbb{C}^n"}</M>{" "}
          with <M>{"(x, y) \\in \\mathbb{R}^{2n}"}</M>. Multiplying by a complex matrix A = B + iC becomes multiplying by the
          real block matrix <M>{"\\begin{pmatrix} B & -C \\\\ C & B \\end{pmatrix}"}</M>. This is how complex arithmetic is
          implemented on real hardware, and how complex-valued networks are often built.
        </p>
        <Code>{REAL}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dimp",
      rung: "check",
      prompt: <p>What is the dimension of the space of real polynomials of degree at most 3?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "dimc",
      rung: "check",
      prompt: <p>What is the dimension of ℂ³ when it is regarded as a vector space over ℝ?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "sub",
      rung: "apply",
      prompt: <p>Which of these is not a subspace of the real polynomials of degree at most 2?</p>,
      answer: {
        kind: "choice",
        options: ["Polynomials with p(0) = 1", "Polynomials with p(1) = 0", "Polynomials with p′(0) = 0", "Polynomials with p(0) = p(2)"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def realify(A):
    A = np.asarray(A, dtype=complex)
    return np.block([[A.real, -A.imag], [A.imag, A.real]])

def realify_vec(v):
    v = np.asarray(v, dtype=complex)
    return np.concatenate([v.real, v.imag])

R = np.array([[0.0, -1.0], [1.0, 0.0]])
print(np.linalg.eigvals(R))
print(realify(np.array([[2 + 3j]])))
print(realify(np.array([[1j]])) @ realify_vec([1 + 0j]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.+1.j 0.-1.j]\n[[ 2. -3.]\n [ 3.  2.]]\n[0. 1.]",
          "[]\n[[ 2. -3.]\n [ 3.  2.]]\n[0. 1.]",
          "[0.+1.j 0.-1.j]\n[[ 2.  3.]\n [-3.  2.]]\n[0. 1.]",
          "[0.+1.j 0.-1.j]\n[[ 2. -3.]\n [ 3.  2.]]\n[1. 0.]",
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

def in_span(vectors, v, tol=1e-9):
    A = np.column_stack(vectors)
    c = np.linalg.lstsq(A, v, rcond=None)[0]
    return bool(np.linalg.norm(A @ c - v) <= tol * max(1.0, np.linalg.norm(v)))

def coords_in_basis(basis, v):
    return np.linalg.solve(np.column_stack(basis), v)

p, q = np.array([1.0, 0.0, 2.0]), np.array([0.0, 3.0, -2.0])
print(p + q, 2 * p)
print(in_span([p, q], np.array([2.0, 3.0, 2.0])), in_span([p, q], np.array([0.0, 0.0, 1.0])))
print(coords_in_basis([np.array([1.0, 1.0]), np.array([1.0, -1.0])], np.array([3.0, 1.0])))`}</Code>
          <p>Polynomials 1 + 2x² and 3x − 2x² as coefficient vectors. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1. 3. 0.] [2. 0. 4.]\nTrue False\n[2. 1.]",
          "[1. 3. 0.] [2. 0. 4.]\nTrue True\n[2. 1.]",
          "[1. 3. 0.] [2. 0. 4.]\nFalse False\n[1. 2.]",
          "[1. 3. 4.] [2. 0. 4.]\nTrue False\n[2. 1.]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>realify(A)</C>, mapping a complex n × n matrix B + iC to the real 2n × 2n block matrix [[B, −C], [C, B]],
          and <C>realify_vec(v)</C>, mapping x + iy to the real vector (x, y) of length 2n. Then{" "}
          <C>realify(A) @ realify_vec(v)</C> equals <C>realify_vec(A @ v)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def realify(A):
    return np.real(A)

def realify_vec(v):
    return np.real(v)
`,
        solution: REAL,
        tests: [
          { name: "small", code: `assert np.allclose(realify(np.array([[2 + 3j]])), [[2, -3], [3, 2]])
assert np.allclose(realify_vec([1 + 2j, 3 - 1j]), [1, 3, 2, -1])` },
          { name: "homomorphism", code: `rng = np.random.default_rng(0)
A = rng.normal(size=(3, 3)) + 1j * rng.normal(size=(3, 3))
B = rng.normal(size=(3, 3)) + 1j * rng.normal(size=(3, 3))
v = rng.normal(size=3) + 1j * rng.normal(size=3)
assert np.allclose(realify(A) @ realify_vec(v), realify_vec(A @ v))
assert np.allclose(realify(A) @ realify(B), realify(A @ B))
assert realify(A).dtype == float` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>in_span(vectors, v, tol=1e-9)</C>, True when v is a linear combination of the given vectors (fit by least
          squares and check the residual, relative to max(1, ‖v‖)), and <C>coords_in_basis(basis, v)</C>, the coordinates of
          v in a basis of <M>{"F^n"}</M>. Both should work for real and complex vectors.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def in_span(vectors, v, tol=1e-9):
    return True

def coords_in_basis(basis, v):
    return np.asarray(v)
`,
        solution: `import numpy as np

${SPAN}`,
        tests: [
          { name: "span", code: `p, q = np.array([1.0, 0.0, 2.0]), np.array([0.0, 3.0, -2.0])
assert in_span([p, q], np.array([2.0, 3.0, 2.0])) is True
assert in_span([p, q], np.array([0.0, 0.0, 1.0])) is False
u = np.array([1.0, 1j])
assert in_span([u], (2 - 3j) * u) and not in_span([u], np.array([1.0, -1j]))` },
          { name: "coordinates", code: `assert np.allclose(coords_in_basis([np.array([1.0, 1.0]), np.array([1.0, -1.0])], np.array([3.0, 1.0])), [2, 1])
b = [np.array([1.0, 1j]), np.array([1.0, -1j])]
c = coords_in_basis(b, np.array([2.0, 0.0]))
assert np.allclose(c, [1, 1])` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Using only the vector space axioms, prove that 0v = 0 and (−1)v = −v for every vector v.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes 0v = (0 + 0)v = 0v + 0v by distributivity.",
          "Adds the additive inverse of 0v to both sides (using associativity) to conclude 0v = 0.",
          "Shows v + (−1)v = (1 + (−1))v = 0v = 0, so (−1)v is the additive inverse of v (and notes inverses are unique, or equivalently that this is what −v denotes).",
        ],
      },
    },
    {
      key: "rotev",
      rung: "stretch",
      prompt: <p>The rotation of ℝ² by 90° has complex eigenvalues ±i. What is the sum of the squares of its two eigenvalues?</p>,
      answer: { kind: "numeric", value: -2, tolerance: 1e-9 },
    },
  ],

  teachBack:
    "Explain to a friend what makes something a vector space, give three examples that are not arrows, and say why complex scalars guarantee eigenvalues.",

  glimpse: (
    <p>
      Spaces matter because of the maps between them. Next: linear maps, why they are determined by what they do to a
      basis, and why the linear maps from one space to another form a vector space of their own.
    </p>
  ),
};
