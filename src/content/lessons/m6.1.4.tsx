import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DualBasisViz } from "@/components/viz/DualBasisViz";
import type { LessonContent } from "@/lib/types";

const DUAL = `import numpy as np

def dual_basis(basis):
    return list(np.linalg.inv(np.column_stack(basis)))

def coords_via_dual(basis, v):
    return np.array([phi @ v for phi in dual_basis(basis)])`;

const QUOT = `def same_coset(u, v, U_basis, tol=1e-9):
    if len(U_basis) == 0:
        return bool(np.linalg.norm(u - v) <= tol)
    A = np.column_stack(U_basis)
    c = np.linalg.lstsq(A, u - v, rcond=None)[0]
    return bool(np.linalg.norm(A @ c - (u - v)) <= tol * max(1.0, np.linalg.norm(u - v)))

def quotient_dim(dim_v, U_basis):
    return dim_v - (np.linalg.matrix_rank(np.column_stack(U_basis)) if len(U_basis) else 0)`;

export const lesson: LessonContent = {
  id: "m6.1.4",
  minutes: 55,
  links: {
    requires: ["m6.1.3"],
    revisits: ["m3.8.2", "m3.3.5"],
    foreshadows: ["m6.2.2", "m6.3.2"],
  },

  puzzle: (
    <>
      <p>
        The gradient of a loss is usually drawn as an arrow in parameter space. But change the units of one parameter,
        measuring it in thousandths, and the &ldquo;arrow&rdquo; changes direction in a way no ordinary vector does. A
        gradient is really a different kind of object: a rule that takes a direction and returns a rate of change. What
        kind of space do such rules live in?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A linear functional eats a vector and returns a number. Functionals form their own vector space, the dual. Given a
        basis, the dual basis consists of the functionals that read off each coordinate. They are not the basis vectors
        themselves: reading off the first coordinate means ignoring the other basis directions, so the functional must
        vanish along them.
      </p>
      <DualBasisViz />
    </>
  ),

  theory: (
    <>
      <Definition title="dual space and dual basis">
        <p>
          The dual of V is <M>{"V' = \\mathcal{L}(V, F)"}</M>, the space of linear functionals. If{" "}
          <M>{"v_1, \\dots, v_n"}</M> is a basis of V, the dual basis <M>{"\\varphi_1, \\dots, \\varphi_n"}</M> is defined by{" "}
          <M>{"\\varphi_j(v_k) = 1"}</M> if j = k and 0 otherwise. In <M>{"F^n"}</M>, with the basis as columns of a matrix B,
          the <M>{"\\varphi_j"}</M> are the rows of <M>{"B^{-1}"}</M>.
        </p>
        <Code>{DUAL}</Code>
      </Definition>

      <Theorem title="the dual basis is a basis">
        <p>
          The dual basis is a basis of V′, every v satisfies <M>{"v = \\sum_j \\varphi_j(v)\\, v_j"}</M>, and so{" "}
          <M>{"\\dim V' = \\dim V"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"v = \\sum_k c_k v_k"}</M>; applying <M>{"\\varphi_j"}</M> gives <M>{"\\varphi_j(v) = c_j"}</M>, which is
          the expansion. If <M>{"\\sum a_j\\varphi_j = 0"}</M>, evaluating at <M>{"v_k"}</M> gives <M>{"a_k = 0"}</M>, so the{" "}
          <M>{"\\varphi_j"}</M> are independent. Any <M>{"\\psi \\in V'"}</M> equals{" "}
          <M>{"\\sum_j \\psi(v_j)\\varphi_j"}</M>, because both sides agree on every basis vector, and a linear map is fixed by
          its values on a basis. So they span.
        </p>
      </Proof>

      <Remark title="dual maps and gradients">
        <p>
          A map <M>{"T: V \\to W"}</M> induces <M>{"T': W' \\to V'"}</M>, <M>{"T'(\\psi) = \\psi \\circ T"}</M>; in dual bases
          its matrix is the transpose of T&rsquo;s. This is backpropagation in one line: the derivative of the loss with
          respect to a layer&rsquo;s output is a functional on that space, and composing it with the layer pulls it back to a
          functional on the input, by the transpose. Turning a functional into an arrow needs extra structure, an inner
          product, which is the subject of the next chapter.
        </p>
      </Remark>

      <Definition title="quotient space">
        <p>
          For a subspace U of V, the coset of v is <M>{"v + U = \\{v + u : u \\in U\\}"}</M>, and <M>{"v + U = w + U"}</M>{" "}
          exactly when <M>{"v - w \\in U"}</M>. The quotient <M>{"V/U"}</M> is the set of cosets with{" "}
          <M>{"(v + U) + (w + U) = (v + w) + U"}</M> and <M>{"a(v + U) = av + U"}</M>, which are well defined because U is a
          subspace. Think of it as V with the directions in U ignored.
        </p>
        <Code>{QUOT}</Code>
      </Definition>

      <Theorem title="dimension of a quotient">
        <p>If V is finite-dimensional, <M>{"\\dim V/U = \\dim V - \\dim U"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          The quotient map <M>{"\\pi(v) = v + U"}</M> is linear and surjective, and <M>{"\\pi(v) = 0 + U"}</M> exactly when{" "}
          <M>{"v \\in U"}</M>, so null π = U. The fundamental theorem of linear maps gives{" "}
          <M>{"\\dim V = \\dim U + \\dim V/U"}</M>. The same reasoning shows that every T induces an isomorphism from{" "}
          <M>{"V/\\operatorname{null} T"}</M> onto range T: a map is an injective map after forgetting what it kills.
        </p>
      </Proof>

      <Example title="a quotient in practice">
        <p>
          The weights of a network with a ReLU layer can be rescaled, multiplying a unit&rsquo;s incoming weights by c &gt; 0
          and its outgoing ones by 1/c, without changing the function. Parameter settings that differ by such moves compute the
          same thing; the space of functions is, near a point, a quotient of the space of parameters.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "qdim",
      rung: "check",
      prompt: <p>V has dimension 7 and U is a subspace of dimension 3. What is the dimension of V/U?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "phi",
      rung: "check",
      prompt: <p>In ℝ² with basis v₁ = (1, 0), v₂ = (1, 1), what is φ₁(3, 2), where φ₁ is the first dual basis functional?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "grad",
      rung: "apply",
      prompt: <p>Without an inner product, what kind of object is the derivative of a loss L: V → ℝ at a point?</p>,
      answer: {
        kind: "choice",
        options: ["A linear functional, an element of V′", "A vector in V", "An element of V/ℝ", "A scalar"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def dual_basis(basis):
    return list(np.linalg.inv(np.column_stack(basis)))

def coords_via_dual(basis, v):
    return np.array([phi @ v for phi in dual_basis(basis)])

B = [np.array([1.0, 0.0]), np.array([1.0, 1.0])]
print([phi.tolist() for phi in dual_basis(B)])
print(coords_via_dual(B, np.array([3.0, 2.0])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[[1.0, -1.0], [0.0, 1.0]]\n[1. 2.]", "[[1.0, 0.0], [1.0, 1.0]]\n[3. 2.]", "[[1.0, -1.0], [0.0, 1.0]]\n[3. 2.]", "[[1.0, 0.0], [-1.0, 1.0]]\n[3. -1.]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def same_coset(u, v, U_basis, tol=1e-9):
    if len(U_basis) == 0:
        return bool(np.linalg.norm(u - v) <= tol)
    A = np.column_stack(U_basis)
    c = np.linalg.lstsq(A, u - v, rcond=None)[0]
    return bool(np.linalg.norm(A @ c - (u - v)) <= tol * max(1.0, np.linalg.norm(u - v)))

def quotient_dim(dim_v, U_basis):
    return dim_v - (np.linalg.matrix_rank(np.column_stack(U_basis)) if len(U_basis) else 0)

U = [np.array([1.0, 1.0, 0.0])]
print(same_coset(np.array([2.0, 3.0, 5.0]), np.array([0.0, 1.0, 5.0]), U), same_coset(np.array([2.0, 3.0, 5.0]), np.array([0.0, 1.0, 4.0]), U))
print(quotient_dim(3, U), quotient_dim(3, U + [np.array([2.0, 2.0, 0.0])]), quotient_dim(3, []))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True False\n2 2 3", "True True\n2 1 3", "False False\n2 2 3", "True False\n1 1 0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dual_basis(basis)</C>, returning the dual functionals of a basis of <M>{"F^n"}</M> as a list of row
          vectors (so <C>phi @ v</C> evaluates a functional), and <C>coords_via_dual(basis, v)</C>, the coordinates of v
          obtained by applying each dual functional.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def dual_basis(basis):
    return list(basis)

def coords_via_dual(basis, v):
    return np.array([b @ v for b in basis])
`,
        solution: DUAL,
        tests: [
          { name: "dual", code: `B = [np.array([1.0, 0.0]), np.array([1.0, 1.0])]
D = dual_basis(B)
assert np.allclose(np.array([[phi @ b for b in B] for phi in D]), np.eye(2))
assert np.allclose(D[0], [1, -1]) and np.allclose(D[1], [0, 1])` },
          { name: "coordinates", code: `rng = np.random.default_rng(0)
B = [rng.normal(size=4) for _ in range(4)]
v = rng.normal(size=4)
c = coords_via_dual(B, v)
assert np.allclose(sum(ci * bi for ci, bi in zip(c, B)), v)
assert np.allclose(coords_via_dual(B, B[2]), np.eye(4)[2])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>same_coset(u, v, U_basis, tol=1e-9)</C>, True when u + U = v + U for the subspace U spanned by the list
          U_basis (possibly empty), and <C>quotient_dim(dim_v, U_basis)</C>, the dimension of V/U (the spanning list may be
          dependent).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def same_coset(u, v, U_basis, tol=1e-9):
    return np.allclose(u, v)

def quotient_dim(dim_v, U_basis):
    return dim_v - len(U_basis)
`,
        solution: `import numpy as np

${QUOT}`,
        tests: [
          { name: "cosets", code: `U = [np.array([1.0, 1.0, 0.0])]
assert same_coset(np.array([2.0, 3.0, 5.0]), np.array([0.0, 1.0, 5.0]), U) is True
assert same_coset(np.array([2.0, 3.0, 5.0]), np.array([0.0, 1.0, 4.0]), U) is False
assert same_coset(np.array([1.0, 2.0]), np.array([1.0, 2.0]), []) and not same_coset(np.array([1.0, 2.0]), np.array([1.0, 3.0]), [])` },
          { name: "dimension", code: `U = [np.array([1.0, 1.0, 0.0])]
assert quotient_dim(3, U) == 2 and quotient_dim(3, U + [np.array([2.0, 2.0, 0.0])]) == 2
assert quotient_dim(3, []) == 3 and quotient_dim(2, [np.array([1.0, 0.0]), np.array([0.0, 1.0])]) == 0` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that if v₁, …, vₙ is a basis of V, the dual basis φ₁, …, φₙ (with φⱼ(vₖ) = 1 if j = k, else 0) is a basis of V′.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Independence: if Σaⱼφⱼ = 0, evaluating at vₖ gives aₖ = 0 for each k.",
          "Spanning: for any ψ in V′, ψ and Σψ(vⱼ)φⱼ agree on every basis vector, hence are equal because a linear map is determined by its values on a basis.",
          "Concludes the φⱼ form a basis (and so dim V′ = dim V).",
        ],
      },
    },
    {
      key: "transpose",
      rung: "stretch",
      prompt: <p>T: ℝ⁵ → ℝ³ has rank 2. What is the rank of its dual map T′: (ℝ³)′ → (ℝ⁵)′?</p>,
      answer: { kind: "numeric", value: 2 },
    },
  ],

  teachBack:
    "Explain to a friend what the dual space and the dual basis are, why a gradient is naturally a dual vector, and what a quotient space throws away.",

  glimpse: (
    <p>
      To turn functionals into arrows, and to talk about lengths and angles at all, a space needs an inner product. Next
      chapter: inner products and norms in general spaces.
    </p>
  ),
};
