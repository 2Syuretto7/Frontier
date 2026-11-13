import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { InvariantLineViz } from "@/components/viz/InvariantLineViz";
import type { LessonContent } from "@/lib/types";

const INV = `import numpy as np

def is_invariant(T, B, tol=1e-9):
    B = np.asarray(B, dtype=float).reshape(len(B), -1)
    TB = T @ B
    C = np.linalg.lstsq(B, TB, rcond=None)[0]
    return bool(np.allclose(B @ C, TB, atol=tol))

def restrict(T, B):
    return np.linalg.lstsq(B, T @ B, rcond=None)[0]`;

const POLY = `def annihilating_poly(T, v, tol=1e-9):
    K = [np.asarray(v, dtype=float)]
    while True:
        Kmat = np.column_stack(K)
        nxt = T @ K[-1]
        a = np.linalg.lstsq(Kmat, nxt, rcond=None)[0]
        if np.allclose(Kmat @ a, nxt, atol=tol):
            return np.append(-a, 1.0)
        K.append(nxt)`;

export const lesson: LessonContent = {
  id: "m6.3.1",
  minutes: 60,
  links: {
    requires: ["m6.1.3", "m3.7.1"],
    revisits: ["m6.1.1", "m3.7.2"],
    foreshadows: ["m6.3.3"],
  },

  puzzle: (
    <>
      <p>
        A rotation of the plane has no real eigenvector, yet every complex square matrix has an eigenvalue. Why is that
        guaranteed, without computing a determinant? And when an operator cannot be diagonalised, as a shear cannot, what
        is the best shape its matrix can be put into?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A subspace U is invariant under T when T never pushes a vector of U out of U. Then T can be studied on U alone. The
        smallest interesting invariant subspaces are lines, and an invariant line is exactly an eigenvector direction. Over ℂ
        one always exists, and peeling them off one at a time builds a chain of nested invariant subspaces, which is the same
        thing as an upper-triangular matrix.
      </p>
      <InvariantLineViz />
    </>
  ),

  theory: (
    <>
      <Definition title="invariant subspace">
        <p>
          For an operator T on V (a linear map from V to itself), a subspace U is invariant under T if{" "}
          <M>{"Tu \\in U"}</M> for every u in U. Then the restriction <M>{"T|_U"}</M> is an operator on U.
        </p>
      </Definition>
      <p>
        Examples: <M>{"\\{0\\}"}</M> and V; null T (if Tu = 0 then T(Tu) = 0); range T; and, for any polynomial p,{" "}
        <M>{"\\operatorname{null} p(T)"}</M> and <M>{"\\operatorname{range} p(T)"}</M>, because p(T) commutes with T. A
        one-dimensional subspace span(v) is invariant exactly when <M>{"Tv = \\lambda v"}</M>, that is when v is an
        eigenvector.
      </p>

      <Theorem title="eigenvectors for distinct eigenvalues are independent">
        <p>
          If <M>{"v_1, \\dots, v_m"}</M> are eigenvectors with distinct eigenvalues <M>{"\\lambda_1, \\dots, \\lambda_m"}</M>,
          they are linearly independent. Hence T has at most dim V distinct eigenvalues.
        </p>
      </Theorem>
      <Proof>
        <p>
          Otherwise take the smallest k with <M>{"v_k \\in \\operatorname{span}(v_1, \\dots, v_{k-1})"}</M>, say{" "}
          <M>{"v_k = \\sum_{j<k} a_j v_j"}</M>. Apply T: <M>{"\\lambda_k v_k = \\sum_{j<k} a_j\\lambda_j v_j"}</M>. Subtract{" "}
          <M>{"\\lambda_k"}</M> times the first equation: <M>{"0 = \\sum_{j<k} a_j(\\lambda_j - \\lambda_k)v_j"}</M>. By
          minimality <M>{"v_1, \\dots, v_{k-1}"}</M> are independent, so every{" "}
          <M>{"a_j(\\lambda_j - \\lambda_k) = 0"}</M>, and as the eigenvalues are distinct every <M>{"a_j = 0"}</M>. Then{" "}
          <M>{"v_k = 0"}</M>, which an eigenvector is not.
        </p>
      </Proof>

      <Theorem title="existence of eigenvalues over ℂ">
        <p>Every operator on a nonzero finite-dimensional complex vector space has an eigenvalue.</p>
      </Theorem>
      <Proof>
        <p>
          Let n = dim V and v ≠ 0. The n + 1 vectors <M>{"v, Tv, \\dots, T^n v"}</M> are dependent, so some nonzero
          polynomial p of degree at most n has <M>{"p(T)v = 0"}</M>; p is not constant, since v ≠ 0. Over ℂ it factors as{" "}
          <M>{"p(z) = c(z - \\lambda_1)\\cdots(z - \\lambda_m)"}</M>, so{" "}
          <M>{"0 = c(T - \\lambda_1 I)\\cdots(T - \\lambda_m I)v"}</M>. Since v ≠ 0, at least one factor{" "}
          <M>{"T - \\lambda_j I"}</M> is not injective, and that <M>{"\\lambda_j"}</M> is an eigenvalue.
        </p>
      </Proof>
      <p>
        The proof is an algorithm: grow the Krylov list <M>{"v, Tv, T^2v, \\dots"}</M> until it becomes dependent, read off
        the polynomial, and find its roots. Some root is always an eigenvalue; in fact all of them are, since the list was
        stopped at the first dependence.
      </p>
      <Code>{POLY}</Code>

      <Theorem title="upper-triangular form over ℂ">
        <p>
          If V is a finite-dimensional complex vector space, it has a basis <M>{"v_1, \\dots, v_n"}</M> in which the matrix of
          T is upper triangular. Equivalently, each <M>{"\\operatorname{span}(v_1, \\dots, v_k)"}</M> is invariant under T.
          The diagonal entries are then exactly the eigenvalues of T.
        </p>
      </Theorem>
      <Proof>
        <p>
          The matrix is upper triangular iff each <M>{"Tv_k"}</M> lies in <M>{"\\operatorname{span}(v_1, \\dots, v_k)"}</M>,
          which is the stated chain of invariant subspaces. Induct on n. Take an eigenvalue λ; then{" "}
          <M>{"U = \\operatorname{range}(T - \\lambda I)"}</M> is invariant and has dimension less than n, since{" "}
          <M>{"T - \\lambda I"}</M> is not injective. By induction U has a basis <M>{"u_1, \\dots, u_m"}</M> making{" "}
          <M>{"T|_U"}</M> upper triangular. Extend it to a basis <M>{"u_1, \\dots, u_m, w_1, \\dots, w_r"}</M> of V. Then{" "}
          <M>{"Tw_k = (T - \\lambda I)w_k + \\lambda w_k \\in U + \\operatorname{span}(w_k)"}</M>, so each new{" "}
          <M>{"Tw_k"}</M> lies in the span of the vectors up to <M>{"w_k"}</M>. For the diagonal: the matrix of T − λI is upper
          triangular with diagonal entries <M>{"a_{kk} - \\lambda"}</M>, and an upper-triangular matrix is invertible exactly
          when no diagonal entry is 0. So λ is an eigenvalue exactly when it equals some <M>{"a_{kk}"}</M>.
        </p>
      </Proof>

      <Example title="block form">
        <p>
          If U is invariant and a basis of V starts with a basis of U, the matrix of T is block upper triangular,{" "}
          <M>{"\\begin{pmatrix} A & B \\\\ 0 & D\\end{pmatrix}"}</M>, with A the matrix of <M>{"T|_U"}</M>. Testing
          invariance in coordinates means checking that TB lies in the column space of B, and the restriction is the matrix C
          solving BC = TB.
        </p>
        <Code>{INV}</Code>
      </Example>

      <Remark title="over the reals">
        <p>
          Over ℝ a polynomial may not split into linear factors, but it splits into linear and quadratic ones. The same proof
          then shows that every operator on a nonzero finite-dimensional real space has an invariant subspace of dimension 1
          or 2: a rotation has the whole plane. In the next lessons an inner product sharpens this: a self-adjoint operator
          has an orthonormal basis of eigenvectors, so its upper-triangular form is actually diagonal.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rot",
      rung: "check",
      prompt: <p>How many subspaces of ℝ² are invariant under the rotation by 90°?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "tri",
      rung: "check",
      prompt: <p>T has matrix [[1, 4, 7], [0, 2, 5], [0, 0, 3]] in some basis. What is the product of its eigenvalues?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "always",
      rung: "apply",
      prompt: <p>Which subspace is invariant under every operator T on V?</p>,
      answer: {
        kind: "choice",
        options: [
          "null T",
          "the span of any single nonzero vector",
          "the orthogonal complement of any invariant subspace",
          "the set of vectors v with ‖Tv‖ = ‖v‖",
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

def is_invariant(T, B, tol=1e-9):
    B = np.asarray(B, dtype=float).reshape(len(B), -1)
    TB = T @ B
    C = np.linalg.lstsq(B, TB, rcond=None)[0]
    return bool(np.allclose(B @ C, TB, atol=tol))

def restrict(T, B):
    return np.linalg.lstsq(B, T @ B, rcond=None)[0]

T = np.array([[2.0, 1.0, 0.0], [0.0, 2.0, 0.0], [0.0, 0.0, 5.0]])
B = np.array([[1.0, 0.0], [0.0, 1.0], [0.0, 0.0]])
print(is_invariant(T, B), is_invariant(T, np.array([0.0, 1.0, 0.0])), is_invariant(T, np.array([1.0, 0.0, 0.0])))
print(np.round(restrict(T, B), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True False True\n[[2. 1.]\n [0. 2.]]",
          "True True True\n[[2. 1.]\n [0. 2.]]",
          "True False False\n[[2. 1.]\n [0. 2.]]",
          "True False True\n[[2. 0.]\n [1. 2.]]",
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

def annihilating_poly(T, v, tol=1e-9):
    K = [np.asarray(v, dtype=float)]
    while True:
        Kmat = np.column_stack(K)
        nxt = T @ K[-1]
        a = np.linalg.lstsq(Kmat, nxt, rcond=None)[0]
        if np.allclose(Kmat @ a, nxt, atol=tol):
            return np.append(-a, 1.0)
        K.append(nxt)

T = np.array([[2.0, 1.0, 0.0], [0.0, 2.0, 0.0], [0.0, 0.0, 5.0]])
p = annihilating_poly(T, np.array([1.0, 0.0, 1.0]))
print(np.round(p, 6), np.round(np.sort(np.roots(p[::-1]).real), 6))
print(len(annihilating_poly(T, np.array([0.0, 1.0, 0.0]))) - 1)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[10. -7.  1.] [2. 5.]\n2", "[10. -7.  1.] [2. 5.]\n1", "[-20.  24.  -9.   1.] [2. 2. 5.]\n2", "[ 2. -5.  1.] [2. 5.]\n2"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>is_invariant(T, B, tol=1e-9)</C>, True when the column space of B (a 1-D array is one column) is invariant
          under the matrix T, and <C>restrict(T, B)</C>, the matrix of T restricted to that space in the basis given by the
          independent columns of B.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def is_invariant(T, B, tol=1e-9):
    return True

def restrict(T, B):
    return B.T @ T @ B
`,
        solution: INV,
        tests: [
          { name: "invariance", code: `T = np.array([[2.0, 1.0, 0.0], [0.0, 2.0, 0.0], [0.0, 0.0, 5.0]])
assert is_invariant(T, np.array([[1.0, 0.0], [0.0, 1.0], [0.0, 0.0]])) is True
assert is_invariant(T, np.array([0.0, 1.0, 0.0])) is False
assert is_invariant(T, np.array([1.0, 0.0, 0.0])) is True
assert is_invariant(T, np.array([[1.0], [0.0], [1.0]])) is False` },
          { name: "restriction", code: `T = np.array([[2.0, 1.0, 0.0], [0.0, 2.0, 0.0], [0.0, 0.0, 5.0]])
B = np.array([[1.0, 0.0], [0.0, 0.0], [0.0, 1.0]])
assert np.allclose(restrict(T, B), [[2.0, 0.0], [0.0, 5.0]])
B2 = np.array([[2.0, 1.0], [0.0, 1.0], [0.0, 0.0]])
C = restrict(T, B2)
assert np.allclose(B2 @ C, T @ B2) and np.allclose(sorted(np.linalg.eigvals(C).real), [2.0, 2.0])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>annihilating_poly(T, v, tol=1e-9)</C>. Grow the list v, Tv, T²v, … until the next vector is a combination
          of the earlier ones, <M>{"T^k v = \\sum_{j<k} a_j T^j v"}</M>, and return the coefficients of the monic polynomial{" "}
          <M>{"z^k - \\sum_j a_j z^j"}</M>, constant term first.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def annihilating_poly(T, v, tol=1e-9):
    return np.array([0.0, 1.0])
`,
        solution: `import numpy as np

${POLY}`,
        tests: [
          { name: "diagonal", code: `T = np.diag([1.0, 2.0, 3.0])
p = annihilating_poly(T, np.ones(3))
assert np.allclose(p, [-6.0, 11.0, -6.0, 1.0])
assert np.allclose(annihilating_poly(T, np.array([0.0, 4.0, 0.0])), [-2.0, 1.0])` },
          { name: "roots are eigenvalues", code: `rng = np.random.default_rng(0)
T = rng.normal(size=(4, 4))
p = annihilating_poly(T, rng.normal(size=4))
assert len(p) == 5 and p[-1] == 1.0
r = np.roots(p[::-1])
for lam in r:
    assert abs(np.linalg.det(T - lam * np.eye(4))) < 1e-6` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that eigenvectors of an operator corresponding to distinct eigenvalues are linearly independent.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Supposes dependence and takes the smallest k with vₖ in the span of v₁, …, vₖ₋₁ (or argues by induction on m), writing vₖ = Σ aⱼvⱼ.",
          "Applies T and subtracts λₖ times the relation to get Σ aⱼ(λⱼ − λₖ)vⱼ = 0.",
          "Uses independence of the earlier vectors and distinctness of the eigenvalues to get all aⱼ = 0, hence vₖ = 0, a contradiction.",
        ],
      },
    },
    {
      key: "krylov",
      rung: "stretch",
      prompt: (
        <p>
          T = [[2, 1, 0], [0, 2, 0], [0, 0, 5]] and v = (1, 1, 1). What is the degree of the lowest-degree monic polynomial p
          with p(T)v = 0?
        </p>
      ),
      answer: { kind: "numeric", value: 3 },
    },
  ],

  teachBack:
    "Explain to a friend what an invariant subspace is, why every complex operator has an eigenvalue, and how a chain of invariant subspaces gives an upper-triangular matrix.",

  glimpse: (
    <>
      <p>
        With an inner product, there is a natural partner for every operator: the adjoint, which moves T from one side of the
        inner product to the other. Next comes the adjoint and its matrix, the conjugate transpose.
      </p>
      <p>
        Combining the adjoint with this lesson gives the spectral theorem: run the upper-triangular argument with an
        orthonormal basis (Gram–Schmidt keeps the chain of invariant subspaces), and for a self-adjoint operator the
        triangular matrix is forced to be diagonal.
      </p>
    </>
  ),
};
