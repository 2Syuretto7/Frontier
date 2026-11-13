import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AdjointWeightViz } from "@/components/viz/AdjointWeightViz";
import type { LessonContent } from "@/lib/types";

const ADJ = `import numpy as np

def adjoint_M(T, M):
    return np.linalg.solve(M, T.T @ M)

def is_self_adjoint(T, M, tol=1e-9):
    MT = M @ T
    return bool(np.allclose(MT, MT.T, atol=tol))`;

const TEST = `def conv1d(x, k):
    n = len(x) - len(k) + 1
    return np.array([x[i:i + len(k)] @ k for i in range(n)])

def conv1d_adjoint(y, k, n):
    x = np.zeros(n)
    for i, yi in enumerate(y):
        x[i:i + len(k)] += yi * k
    return x

def adjoint_test(f, fT, n, m, trials=5, seed=0):
    rng = np.random.default_rng(seed)
    for _ in range(trials):
        x, y = rng.normal(size=n), rng.normal(size=m)
        lhs, rhs = f(x) @ y, x @ fT(y)
        if abs(lhs - rhs) > 1e-9 * (1 + abs(lhs)):
            return False
    return True`;

export const lesson: LessonContent = {
  id: "m6.3.2",
  minutes: 55,
  links: {
    requires: ["m6.2.2", "m6.2.3"],
    revisits: ["m6.1.4", "m3.5.1"],
    foreshadows: ["m6.3.3", "m6.6.2"],
  },

  puzzle: (
    <>
      <p>
        Backpropagation through a linear layer y = Wx multiplies the incoming gradient by Wᵀ. Through a convolution it uses a
        &ldquo;transposed convolution&rdquo;. Why the transpose, and what is the transpose of an operator that is not
        stored as a matrix at all? And is the transpose really the right object when the inner product is not the dot
        product?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The adjoint T* is the operator that lets T jump across an inner product: <M>{"\\langle Tv, w\\rangle = \\langle v, T^*w\\rangle"}</M>.
        It always exists in finite dimensions, it is unique, and in an orthonormal basis its matrix is the conjugate
        transpose. In any other basis, or with any other inner product, it is something else, and a gradient computed with
        the plain transpose is then simply wrong.
      </p>
      <AdjointWeightViz />
    </>
  ),

  theory: (
    <>
      <Definition title="adjoint">
        <p>
          Let V and W be finite-dimensional inner product spaces and T: V → W linear. The adjoint{" "}
          <M>{"T^*: W \\to V"}</M> is the map with <M>{"\\langle Tv, w\\rangle = \\langle v, T^* w\\rangle"}</M> for all v in
          V and w in W.
        </p>
      </Definition>
      <p>
        It exists and is unique: for fixed w, <M>{"v \\mapsto \\langle Tv, w\\rangle"}</M> is a linear functional on V, so
        by the Riesz representation theorem there is exactly one vector, called <M>{"T^*w"}</M>, that represents it. Checking
        linearity of <M>{"T^*"}</M> is a one-line computation from the uniqueness.
      </p>

      <Theorem title="properties">
        <p>
          <M>{"(S + T)^* = S^* + T^*"}</M>, <M>{"(\\lambda T)^* = \\overline{\\lambda}T^*"}</M>,{" "}
          <M>{"(T^*)^* = T"}</M>, <M>{"I^* = I"}</M>, and <M>{"(ST)^* = T^*S^*"}</M>. Moreover
        </p>
        <MD>{"\\operatorname{null} T^* = (\\operatorname{range} T)^\\perp, \\qquad \\operatorname{range} T^* = (\\operatorname{null} T)^\\perp."}</MD>
      </Theorem>
      <Proof>
        <p>
          For the product: <M>{"\\langle STv, w\\rangle = \\langle Tv, S^*w\\rangle = \\langle v, T^*S^*w\\rangle"}</M>, and
          uniqueness gives <M>{"(ST)^* = T^*S^*"}</M>; the others are similar. For the null space,{" "}
          <M>{"w \\in \\operatorname{null}T^*"}</M> iff <M>{"\\langle v, T^*w\\rangle = 0"}</M> for all v iff{" "}
          <M>{"\\langle Tv, w\\rangle = 0"}</M> for all v iff <M>{"w \\perp \\operatorname{range}T"}</M>. Apply this to{" "}
          <M>{"T^*"}</M> in place of T and take complements, using <M>{"(U^\\perp)^\\perp = U"}</M>, for the range.
        </p>
      </Proof>

      <Theorem title="matrix of the adjoint">
        <p>
          If <M>{"e_1, \\dots, e_n"}</M> and <M>{"f_1, \\dots, f_m"}</M> are orthonormal bases of V and W, the matrix of{" "}
          <M>{"T^*"}</M> is the conjugate transpose of the matrix of T.
        </p>
      </Theorem>
      <Proof>
        <p>
          In an orthonormal basis, coordinates are inner products, so the (k, j) entry of the matrix of T is{" "}
          <M>{"\\langle Te_j, f_k\\rangle"}</M>. The (j, k) entry of the matrix of <M>{"T^*"}</M> is{" "}
          <M>{"\\langle T^*f_k, e_j\\rangle = \\overline{\\langle e_j, T^*f_k\\rangle} = \\overline{\\langle Te_j, f_k\\rangle}"}</M>.
        </p>
      </Proof>

      <Example title="a weighted inner product">
        <p>
          On <M>{"\\mathbb{R}^n"}</M> with <M>{"\\langle x, y\\rangle_M = x^\\top M y"}</M>, the condition{" "}
          <M>{"x^\\top T^\\top M y = x^\\top M T^* y"}</M> for all x, y gives <M>{"T^* = M^{-1}T^\\top M"}</M>. So T is
          self-adjoint for this inner product when MT is symmetric, which does not require T to be.
        </p>
        <Code>{ADJ}</Code>
      </Example>

      <Definition title="self-adjoint and normal">
        <p>
          T on V is self-adjoint if <M>{"T^* = T"}</M>, and normal if <M>{"TT^* = T^*T"}</M>. Self-adjoint operators are
          normal; so are unitary ones (<M>{"T^*T = I"}</M>) and, as matrices, all real skew-symmetric ones.
        </p>
      </Definition>

      <Theorem title="self-adjoint operators have real eigenvalues">
        <p>Every eigenvalue of a self-adjoint operator is real.</p>
      </Theorem>
      <Proof>
        <p>
          If <M>{"Tv = \\lambda v"}</M> with v ≠ 0, then{" "}
          <M>{"\\lambda\\|v\\|^2 = \\langle Tv, v\\rangle = \\langle v, Tv\\rangle = \\overline{\\lambda}\\|v\\|^2"}</M>, so{" "}
          <M>{"\\lambda = \\overline{\\lambda}"}</M>.
        </p>
      </Proof>

      <Remark title="adjoints are what backpropagation computes">
        <p>
          The derivative of a layer at a point is a linear map J from inputs to outputs. Backpropagation takes the gradient g
          of the loss with respect to the output and returns <M>{"J^*g"}</M>, since{" "}
          <M>{"\\langle Jv, g\\rangle = \\langle v, J^*g\\rangle"}</M> says that <M>{"J^*g"}</M> is exactly the vector whose
          inner product with an input change v gives the change in the loss. For a convolution, the adjoint is the
          &ldquo;transposed convolution&rdquo;. When writing such an operator by hand, the standard check is the adjoint
          (dot-product) test: compare <M>{"\\langle Ax, y\\rangle"}</M> and <M>{"\\langle x, A^*y\\rangle"}</M> on random
          vectors.
        </p>
        <Code>{TEST}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "functional",
      rung: "check",
      prompt: <p>T: ℝ³ → ℝ is T(x) = x₁ + 2x₂ + 3x₃, with the dot products. What is ‖T*(1)‖²?</p>,
      answer: { kind: "numeric", value: 14 },
    },
    {
      key: "weighted",
      rung: "check",
      prompt: (
        <p>
          On ℝ² with ⟨x, y⟩ = xᵀMy, M = diag(1, 2), let T = [[0, 1], [1, 0]]. What is the entry in row 1, column 2 of the
          matrix of T*?
        </p>
      ),
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "facts",
      rung: "apply",
      prompt: <p>T is a linear map between finite-dimensional inner product spaces. Which statement is always true?</p>,
      answer: {
        kind: "choice",
        options: [
          "null T* = (range T)⊥",
          "range T* = range T",
          "(ST)* = S*T*",
          "In every basis, the matrix of T* is the conjugate transpose of the matrix of T",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def adjoint_M(T, M):
    return np.linalg.solve(M, T.T @ M)

def is_self_adjoint(T, M, tol=1e-9):
    MT = M @ T
    return bool(np.allclose(MT, MT.T, atol=tol))

M = np.diag([1.0, 2.0])
T = np.array([[0.0, 1.0], [1.0, 0.0]])
print(adjoint_M(T, M))
print(is_self_adjoint(T, np.eye(2)), is_self_adjoint(T, M))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.  2. ]\n [0.5 0. ]]\nTrue False",
          "[[0. 1.]\n [1. 0.]]\nTrue True",
          "[[0.  0.5]\n [2.  0. ]]\nTrue False",
          "[[0.  2. ]\n [0.5 0. ]]\nTrue True",
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

def conv1d(x, k):
    n = len(x) - len(k) + 1
    return np.array([x[i:i + len(k)] @ k for i in range(n)])

def conv1d_adjoint(y, k, n):
    x = np.zeros(n)
    for i, yi in enumerate(y):
        x[i:i + len(k)] += yi * k
    return x

def adjoint_test(f, fT, n, m, trials=5, seed=0):
    rng = np.random.default_rng(seed)
    for _ in range(trials):
        x, y = rng.normal(size=n), rng.normal(size=m)
        lhs, rhs = f(x) @ y, x @ fT(y)
        if abs(lhs - rhs) > 1e-9 * (1 + abs(lhs)):
            return False
    return True

k = np.array([1.0, -1.0])
print(conv1d(np.array([1.0, 4.0, 9.0, 16.0]), k), conv1d_adjoint(np.ones(3), k, 4))
f, good, bad = lambda x: conv1d(x, k), lambda y: conv1d_adjoint(y, k, 4), lambda y: conv1d_adjoint(y, k[::-1], 4)
print(adjoint_test(f, good, 4, 3), adjoint_test(f, bad, 4, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[-3. -5. -7.] [ 1.  0.  0. -1.]\nTrue False",
          "[3. 5. 7.] [ 1.  0.  0. -1.]\nTrue False",
          "[-3. -5. -7.] [-1.  0.  0.  1.]\nTrue False",
          "[-3. -5. -7.] [ 1.  0.  0. -1.]\nTrue True",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For the inner product xᵀMy on ℝⁿ (M positive definite), write <C>adjoint_M(T, M)</C>, the matrix of the adjoint
          of T, and <C>is_self_adjoint(T, M, tol=1e-9)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def adjoint_M(T, M):
    return T.T

def is_self_adjoint(T, M, tol=1e-9):
    return bool(np.allclose(T, T.T, atol=tol))
`,
        solution: ADJ,
        tests: [
          { name: "defining identity", code: `rng = np.random.default_rng(0)
A = rng.normal(size=(3, 3)); M = A @ A.T + np.eye(3); T = rng.normal(size=(3, 3))
S = adjoint_M(T, M)
for _ in range(3):
    x, y = rng.normal(size=3), rng.normal(size=3)
    assert np.isclose((T @ x) @ M @ y, x @ M @ (S @ y))
assert np.allclose(adjoint_M(T, np.eye(3)), T.T)` },
          { name: "self-adjoint", code: `M = np.diag([1.0, 2.0])
assert is_self_adjoint(np.array([[0.0, 1.0], [1.0, 0.0]]), np.eye(2)) is True
assert is_self_adjoint(np.array([[0.0, 1.0], [1.0, 0.0]]), M) is False
assert is_self_adjoint(np.array([[0.0, 2.0], [1.0, 0.0]]), M) is True` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>conv1d(x, k)</C>, the &ldquo;valid&rdquo; correlation with output i equal to x[i:i+len(k)] @ k;{" "}
          <C>conv1d_adjoint(y, k, n)</C>, its adjoint, returning a vector of length n; and{" "}
          <C>adjoint_test(f, fT, n, m, trials=5, seed=0)</C>, which draws random x ∈ ℝⁿ, y ∈ ℝᵐ and returns False if
          ever |⟨f(x), y⟩ − ⟨x, fT(y)⟩| &gt; 1e-9·(1 + |⟨f(x), y⟩|), else True.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def conv1d(x, k):
    return np.convolve(x, k, mode="valid")

def conv1d_adjoint(y, k, n):
    return np.zeros(n)

def adjoint_test(f, fT, n, m, trials=5, seed=0):
    return True
`,
        solution: `import numpy as np

${TEST}`,
        tests: [
          { name: "conv and adjoint", code: `k = np.array([1.0, -1.0])
assert np.allclose(conv1d(np.array([1.0, 4.0, 9.0, 16.0]), k), [-3.0, -5.0, -7.0])
assert np.allclose(conv1d_adjoint(np.ones(3), k, 4), [1.0, 0.0, 0.0, -1.0])
k3 = np.array([0.5, 2.0, -1.0])
A = np.array([conv1d(e, k3) for e in np.eye(6)]).T
assert np.allclose(np.array([conv1d_adjoint(e, k3, 6) for e in np.eye(4)]).T, A.T)` },
          { name: "test", code: `k = np.array([1.0, 2.0, 3.0])
f = lambda x: conv1d(x, k)
assert adjoint_test(f, lambda y: conv1d_adjoint(y, k, 7), 7, 5) is True
assert adjoint_test(f, lambda y: conv1d_adjoint(y, k[::-1], 7), 7, 5) is False
W = np.random.default_rng(3).normal(size=(4, 6))
assert adjoint_test(lambda x: W @ x, lambda y: W.T @ y, 6, 4) is True
assert adjoint_test(lambda x: W @ x, lambda y: 1.001 * (W.T @ y), 6, 4) is False` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that null T* = (range T)⊥ for a linear map T: V → W between finite-dimensional inner product spaces.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Shows both inclusions (or a chain of equivalences): w ∈ null T* iff ⟨v, T*w⟩ = 0 for all v ∈ V.",
          "Uses the defining identity ⟨v, T*w⟩ = ⟨Tv, w⟩ to translate this into ⟨Tv, w⟩ = 0 for all v, i.e. w ⊥ range T.",
          "Justifies that ⟨v, T*w⟩ = 0 for all v forces T*w = 0 (take v = T*w).",
        ],
      },
    },
    {
      key: "deriv",
      rung: "stretch",
      prompt: (
        <p>
          On polynomials of degree at most 1 with ⟨p, q⟩ = ∫₀¹ pq, let D be differentiation. Then D*(1) = a + bx for some a,
          b. What is b?
        </p>
      ),
      answer: { kind: "numeric", value: 12 },
    },
  ],

  teachBack:
    "Explain to a friend what the adjoint of a linear map is, why its matrix is the conjugate transpose only in orthonormal bases, and why backpropagation through a linear layer uses the adjoint.",

  glimpse: (
    <>
      <p>
        Self-adjoint operators have real eigenvalues; they also have enough eigenvectors to make an orthonormal basis. That
        is the spectral theorem, next, and it is the reason a symmetric matrix can always be written as{" "}
        <M>{"Q\\Lambda Q^\\top"}</M>.
      </p>
      <p>
        Operators with <M>{"T^*T = I"}</M>, the isometries, get their own lesson later: they preserve lengths and angles, and
        orthogonal weight matrices built from them keep signals from exploding or vanishing in deep networks.
      </p>
    </>
  ),
};
