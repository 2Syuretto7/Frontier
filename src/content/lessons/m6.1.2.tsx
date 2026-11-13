import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PolyDerivViz } from "@/components/viz/PolyDerivViz";
import type { LessonContent } from "@/lib/types";

const MAT = `import numpy as np

def deriv_matrix(m):
    D = np.zeros((m + 1, m + 1))
    for k in range(1, m + 1):
        D[k - 1, k] = k
    return D

def matrix_of(T, basis_in, basis_out):
    Bout = np.column_stack(basis_out)
    return np.column_stack([np.linalg.solve(Bout, T(b)) for b in basis_in]) + 0.0`;

const LIN = `def is_linear(T, dim, rng, trials=20, tol=1e-9):
    for _ in range(trials):
        u, v = rng.normal(size=dim), rng.normal(size=dim)
        a = rng.normal()
        if np.linalg.norm(T(u + v) - T(u) - T(v)) > tol or np.linalg.norm(T(a * u) - a * T(u)) > tol:
            return False
    return True

def integration_matrix(m):
    J = np.zeros((m + 2, m + 1))
    for k in range(m + 1):
        J[k + 1, k] = 1 / (k + 1)
    return J`;

export const lesson: LessonContent = {
  id: "m6.1.2",
  minutes: 50,
  links: {
    requires: ["m6.1.1", "m3.8.1"],
    revisits: ["m3.8.2", "m3.3.2"],
    foreshadows: ["m6.1.3", "m6.3.2"],
  },

  puzzle: (
    <>
      <p>
        Differentiation takes a polynomial to a polynomial, and the derivative of a sum is the sum of the derivatives. So
        differentiation is linear, and on cubics it must be a 4 × 4 matrix. Which matrix? And in what sense is a layer of a
        neural network, a Fourier transform or an expectation &ldquo;a matrix&rdquo; too?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A linear map is completely determined by what it does to a basis: everything else is a combination of basis
        vectors, and linearity carries the combination through. Record the images of the basis vectors, in coordinates, as
        the columns of a matrix, and the map has become a matrix.
      </p>
      <PolyDerivViz />
    </>
  ),

  theory: (
    <>
      <Definition title="linear map">
        <p>
          A map <M>{"T: V \\to W"}</M> between vector spaces over F is linear if <M>{"T(u + v) = Tu + Tv"}</M> and{" "}
          <M>{"T(av) = aTv"}</M> for all u, v and scalars a. The set of all linear maps from V to W is written{" "}
          <M>{"\\mathcal{L}(V, W)"}</M>.
        </p>
      </Definition>

      <Theorem title="a basis determines the map">
        <p>
          Let <M>{"v_1, \\dots, v_n"}</M> be a basis of V and <M>{"w_1, \\dots, w_n"}</M> any vectors in W. There is exactly
          one linear map T with <M>{"Tv_j = w_j"}</M> for every j.
        </p>
      </Theorem>
      <Proof>
        <p>
          Every v is uniquely <M>{"\\sum c_j v_j"}</M>. Define <M>{"Tv = \\sum c_j w_j"}</M>; uniqueness of the coordinates
          makes this well defined, and since the coordinates of u + v and av are <M>{"c + d"}</M> and <M>{"ac"}</M>, T is
          linear. Any linear S with <M>{"Sv_j = w_j"}</M> satisfies{" "}
          <M>{"S(\\sum c_j v_j) = \\sum c_j Sv_j = \\sum c_j w_j = Tv"}</M>, so S = T.
        </p>
      </Proof>

      <Definition title="the matrix of a map">
        <p>
          Given bases <M>{"(v_j)"}</M> of V and <M>{"(w_i)"}</M> of W, the matrix <M>{"\\mathcal{M}(T)"}</M> has as column j
          the coordinates of <M>{"Tv_j"}</M>: <M>{"Tv_j = \\sum_i \\mathcal{M}(T)_{ij} w_i"}</M>. Then coordinates of Tv are{" "}
          <M>{"\\mathcal{M}(T)"}</M> times coordinates of v, and <M>{"\\mathcal{M}(ST) = \\mathcal{M}(S)\\mathcal{M}(T)"}</M>:
          matrix multiplication is defined the way it is precisely so that it represents composition.
        </p>
        <Code>{MAT}</Code>
      </Definition>

      <Theorem title="L(V, W) is a vector space">
        <p>
          With <M>{"(S + T)v = Sv + Tv"}</M> and <M>{"(aT)v = a(Tv)"}</M>, <M>{"\\mathcal{L}(V, W)"}</M> is a vector space, and
          if dim V = n and dim W = m then <M>{"\\dim \\mathcal{L}(V, W) = mn"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The axioms hold pointwise because they hold in W. Fixing bases, <M>{"T \\mapsto \\mathcal{M}(T)"}</M> is linear,
          injective (a map with zero matrix sends every basis vector to 0, so it is 0 by the previous theorem) and surjective
          (any matrix defines images of the basis vectors, and the previous theorem gives a map). So it is an isomorphism onto{" "}
          <M>{"F^{m \\times n}"}</M>, which has dimension mn.
        </p>
      </Proof>

      <Example title="linear maps that are not written as matrices">
        <p>
          Differentiation and integration on polynomials, evaluation <M>{"p \\mapsto p(2)"}</M>, expectation of a random
          variable, the shift on sequences. A quick numerical check of linearity tries random u, v and a and compares both
          sides; it cannot prove linearity, but it catches non-linear maps immediately.
        </p>
        <Code>{LIN}</Code>
      </Example>

      <Remark title="why bother with the abstract view">
        <p>
          The same map has different matrices in different bases. Statements about T itself, such as its rank or its
          eigenvalues, cannot depend on that choice, and stating them for maps rather than matrices makes this obvious. The
          next chapters choose bases cleverly, orthonormal or made of eigenvectors, to make the matrix as simple as possible.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dim",
      rung: "check",
      prompt: <p>What is the dimension of the space of linear maps from ℝ³ to ℝ²?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "rank",
      rung: "check",
      prompt: <p>What is the rank of the matrix of differentiation on polynomials of degree at most 3?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "notlin",
      rung: "apply",
      prompt: <p>Which map on real polynomials is not linear?</p>,
      answer: { kind: "choice", options: ["p ↦ p²", "p ↦ p(2)", "p ↦ x·p", "p ↦ p′ + p"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def deriv_matrix(m):
    D = np.zeros((m + 1, m + 1))
    for k in range(1, m + 1):
        D[k - 1, k] = k
    return D

def matrix_of(T, basis_in, basis_out):
    Bout = np.column_stack(basis_out)
    return np.column_stack([np.linalg.solve(Bout, T(b)) for b in basis_in]) + 0.0

D = deriv_matrix(3)
print(D @ np.array([5.0, 1.0, 2.0, 1.0]))
print(np.linalg.matrix_rank(D), np.allclose(np.linalg.matrix_power(D, 4), 0))
E = [np.array([1.0, 1.0]), np.array([1.0, -1.0])]
print(matrix_of(lambda v: np.array([v[1], v[0]]), E, E))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1. 4. 3. 0.]\n3 True\n[[ 1.  0.]\n [ 0. -1.]]",
          "[0. 1. 4. 3.]\n3 True\n[[ 1.  0.]\n [ 0. -1.]]",
          "[1. 4. 3. 0.]\n4 False\n[[ 1.  0.]\n [ 0. -1.]]",
          "[1. 4. 3. 0.]\n3 True\n[[0. 1.]\n [1. 0.]]",
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

def deriv_matrix(m):
    D = np.zeros((m + 1, m + 1))
    for k in range(1, m + 1):
        D[k - 1, k] = k
    return D

def is_linear(T, dim, rng, trials=20, tol=1e-9):
    for _ in range(trials):
        u, v = rng.normal(size=dim), rng.normal(size=dim)
        a = rng.normal()
        if np.linalg.norm(T(u + v) - T(u) - T(v)) > tol or np.linalg.norm(T(a * u) - a * T(u)) > tol:
            return False
    return True

def integration_matrix(m):
    J = np.zeros((m + 2, m + 1))
    for k in range(m + 1):
        J[k + 1, k] = 1 / (k + 1)
    return J

rng = np.random.default_rng(0)
print(is_linear(lambda v: 3 * v[::-1], 3, rng), is_linear(lambda v: v + 1, 3, rng), is_linear(lambda v: v * v, 3, rng))
print(deriv_matrix(4) @ integration_matrix(3) @ np.array([1.0, 2.0, 3.0, 4.0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["True False False\n[1. 2. 3. 4. 0.]", "True False True\n[1. 2. 3. 4. 0.]", "True False False\n[0. 1. 2. 3. 4.]", "False False False\n[1. 2. 3. 4. 0.]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>deriv_matrix(m)</C>, the (m + 1) × (m + 1) matrix of d/dx on polynomials of degree at most m in the basis
          1, x, …, x^m, and <C>matrix_of(T, basis_in, basis_out)</C>, the matrix of a linear function T (given as a Python
          function on arrays) with respect to the two bases, each a list of vectors.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def deriv_matrix(m):
    return np.eye(m + 1)

def matrix_of(T, basis_in, basis_out):
    return np.column_stack([T(b) for b in basis_in])
`,
        solution: MAT,
        tests: [
          { name: "derivative", code: `D = deriv_matrix(3)
assert np.allclose(D @ [5.0, 1.0, 2.0, 1.0], [1, 4, 3, 0])
assert np.allclose(deriv_matrix(1), [[0, 1], [0, 0]]) and deriv_matrix(5).shape == (6, 6)
assert np.allclose(np.linalg.matrix_power(deriv_matrix(4), 5), 0)` },
          { name: "change of basis", code: `E = [np.array([1.0, 1.0]), np.array([1.0, -1.0])]
assert np.allclose(matrix_of(lambda v: np.array([v[1], v[0]]), E, E), [[1, 0], [0, -1]])
I = [np.eye(2)[0], np.eye(2)[1]]
A = np.array([[2.0, 1.0], [0.0, 3.0]])
assert np.allclose(matrix_of(lambda v: A @ v, I, I), A)
Bm = np.column_stack(E)
assert np.allclose(matrix_of(lambda v: A @ v, E, E), np.linalg.inv(Bm) @ A @ Bm)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>is_linear(T, dim, rng, trials=20, tol=1e-9)</C>, which tests additivity and homogeneity on random vectors
          of length dim and random scalars, and <C>integration_matrix(m)</C>, the (m + 2) × (m + 1) matrix of{" "}
          <M>{"p \\mapsto \\int_0^x p(t)\\,dt"}</M> from degree ≤ m to degree ≤ m + 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def is_linear(T, dim, rng, trials=20, tol=1e-9):
    return True

def integration_matrix(m):
    return np.zeros((m + 2, m + 1))
`,
        solution: `import numpy as np

${LIN}`,
        tests: [
          { name: "linearity test", code: `rng = np.random.default_rng(0)
assert is_linear(lambda v: 3 * v[::-1], 3, rng) is True
assert is_linear(lambda v: v + 1, 3, rng) is False
assert is_linear(lambda v: v * v, 3, rng) is False
assert is_linear(lambda v: np.array([v.sum(), v[0] - 2 * v[1]]), 4, rng) is True
assert is_linear(lambda v: np.abs(v), 2, rng) is False` },
          { name: "integration", code: `J = integration_matrix(2)
assert J.shape == (4, 3) and np.allclose(J @ [3.0, 2.0, 3.0], [0, 3, 1, 1])
D = np.zeros((5, 5)); D[0, 1], D[1, 2], D[2, 3], D[3, 4] = 1, 2, 3, 4
assert np.allclose(D @ integration_matrix(3), np.vstack([np.eye(4), np.zeros((1, 4))]))` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that if v₁, …, vₙ is a basis of V and w₁, …, wₙ are any vectors of W, there is exactly one linear map T: V → W with Tvⱼ = wⱼ for all j.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Defines T(Σcⱼvⱼ) = Σcⱼwⱼ and notes it is well defined because coordinates in a basis are unique.",
          "Checks T is linear, using that the coordinates of u + v and av are c + d and ac.",
          "Shows uniqueness: any linear S with Svⱼ = wⱼ agrees with T on every Σcⱼvⱼ by linearity.",
        ],
      },
    },
    {
      key: "dimpoly",
      rung: "stretch",
      prompt: <p>What is the dimension of the space of linear maps from the polynomials of degree at most 3 to those of degree at most 2?</p>,
      answer: { kind: "numeric", value: 12 },
    },
  ],

  teachBack:
    "Explain to a friend why a linear map is fixed by what it does to a basis, how that gives its matrix, and why composing maps means multiplying matrices.",

  glimpse: (
    <p>
      Every linear map has two subspaces attached to it: what it sends to zero, and what it can reach. Next: null spaces and
      ranges, and the fundamental theorem that ties their dimensions together.
    </p>
  ),
};
