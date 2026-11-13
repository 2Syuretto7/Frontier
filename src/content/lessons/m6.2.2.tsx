import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OrthoExpandViz } from "@/components/viz/OrthoExpandViz";
import type { LessonContent } from "@/lib/types";

const GS = `import numpy as np

def gram_schmidt(vs, inner, tol=1e-10):
    es = []
    for v in vs:
        w = np.asarray(v, dtype=float)
        for e in es:
            w = w - inner(w, e) * e
        n = np.sqrt(inner(w, w))
        if n > tol:
            es.append(w / n)
    return es`;

const COORD = `def coords(v, es, inner):
    return np.array([inner(v, e) for e in es])

def riesz_vector(phi, es):
    return sum(phi(e) * e for e in es)`;

export const lesson: LessonContent = {
  id: "m6.2.2",
  minutes: 55,
  links: {
    requires: ["m6.2.1", "m3.5.4"],
    revisits: ["m6.1.4"],
    foreshadows: ["m6.2.3", "m6.3.3"],
  },

  puzzle: (
    <>
      <p>
        To find the coordinates of a vector in an arbitrary basis you must solve a linear system. In some bases you need only
        n inner products, one per coordinate, and the length of the vector can be read straight off the coordinates. Which
        bases are these, does every inner product space have one, even a space of functions, and what else do they buy?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An orthonormal basis is a set of mutually perpendicular unit rulers. Measuring v against each ruler, by an inner
        product, gives its coordinate, and Pythagoras says the squared length is the sum of the squared coordinates. In a
        function space the rulers can be sines and cosines or polynomials, and the coordinates are what engineers call
        Fourier or Legendre coefficients.
      </p>
      <OrthoExpandViz />
    </>
  ),

  theory: (
    <>
      <Definition title="orthonormal list">
        <p>
          A list <M>{"e_1, \\dots, e_m"}</M> is orthonormal when <M>{"\\langle e_j, e_k\\rangle"}</M> is 1 for j = k and 0
          otherwise. An orthonormal basis is an orthonormal list that is also a basis.
        </p>
      </Definition>

      <Theorem title="Pythagoras for orthonormal lists">
        <p>
          If <M>{"e_1, \\dots, e_m"}</M> is orthonormal, then{" "}
          <M>{"\\|a_1 e_1 + \\dots + a_m e_m\\|^2 = |a_1|^2 + \\dots + |a_m|^2"}</M> for all scalars. In particular every
          orthonormal list is linearly independent.
        </p>
      </Theorem>
      <Proof>
        <p>
          Expand <M>{"\\langle \\sum_j a_j e_j, \\sum_k a_k e_k\\rangle = \\sum_{j,k} a_j\\overline{a_k}\\langle e_j, e_k\\rangle"}</M>.
          Only the terms with j = k survive, each <M>{"|a_j|^2"}</M>. If the combination is 0, the sum of the{" "}
          <M>{"|a_j|^2"}</M> is 0, so every <M>{"a_j = 0"}</M>.
        </p>
      </Proof>

      <Theorem title="coordinates are inner products">
        <p>
          If <M>{"e_1, \\dots, e_n"}</M> is an orthonormal basis of V, then for every v,
        </p>
        <MD>{"v = \\sum_{j=1}^n \\langle v, e_j\\rangle e_j, \\qquad \\|v\\|^2 = \\sum_{j=1}^n |\\langle v, e_j\\rangle|^2."}</MD>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"v = \\sum_k a_k e_k"}</M>, which is possible since the list is a basis. Taking the inner product with{" "}
          <M>{"e_j"}</M> gives <M>{"\\langle v, e_j\\rangle = \\sum_k a_k\\langle e_k, e_j\\rangle = a_j"}</M>. The norm
          formula is then the previous theorem.
        </p>
      </Proof>

      <Theorem title="Gram–Schmidt">
        <p>
          If <M>{"v_1, \\dots, v_m"}</M> is linearly independent, set <M>{"e_1 = v_1/\\|v_1\\|"}</M> and, for k ≥ 2,
        </p>
        <MD>{"e_k = \\frac{w_k}{\\|w_k\\|}, \\qquad w_k = v_k - \\sum_{j<k}\\langle v_k, e_j\\rangle e_j."}</MD>
        <p>
          Then <M>{"e_1, \\dots, e_m"}</M> is orthonormal and{" "}
          <M>{"\\operatorname{span}(e_1, \\dots, e_k) = \\operatorname{span}(v_1, \\dots, v_k)"}</M> for every k.
        </p>
      </Theorem>
      <Proof>
        <p>
          Induction on k; the case k = 1 is clear. Suppose <M>{"e_1, \\dots, e_{k-1}"}</M> are orthonormal with the same span
          as <M>{"v_1, \\dots, v_{k-1}"}</M>. Then <M>{"w_k \\ne 0"}</M>, since otherwise <M>{"v_k"}</M> would lie in the span
          of the earlier v&apos;s, contradicting independence. For i &lt; k,{" "}
          <M>{"\\langle w_k, e_i\\rangle = \\langle v_k, e_i\\rangle - \\langle v_k, e_i\\rangle = 0"}</M>, so{" "}
          <M>{"e_k"}</M> is a unit vector orthogonal to the earlier ones. Finally <M>{"e_k"}</M> is a combination of{" "}
          <M>{"v_1, \\dots, v_k"}</M> and <M>{"v_k"}</M> is a combination of <M>{"e_1, \\dots, e_k"}</M>, so the spans agree.
        </p>
      </Proof>
      <p>
        Two consequences follow at once. Every finite-dimensional inner product space has an orthonormal basis (apply
        Gram–Schmidt to any basis), and every orthonormal list extends to an orthonormal basis (extend it to a basis, then
        apply Gram–Schmidt, which leaves the first vectors unchanged). The code below works for any inner product passed in
        as a function, and uses the &ldquo;modified&rdquo; update, subtracting each projection from the running w, which is
        the same in exact arithmetic and loses less to rounding.
      </p>
      <Code>{GS}</Code>

      <Example title="Legendre polynomials on [0, 1]">
        <p>
          With <M>{"\\langle f, g\\rangle = \\int_0^1 fg"}</M>, Gram–Schmidt applied to 1, x, x² gives{" "}
          <M>{"1,\\ \\sqrt{3}(2x - 1),\\ \\sqrt{5}(6x^2 - 6x + 1)"}</M>. For instance{" "}
          <M>{"w_2 = x - \\langle x, 1\\rangle 1 = x - \\tfrac12"}</M> and <M>{"\\|x - \\tfrac12\\|^2 = \\tfrac1{12}"}</M>. These
          are the shifted Legendre polynomials; the best polynomial approximation of degree at most 2 is the expansion in them.
        </p>
      </Example>

      <Theorem title="Riesz representation">
        <p>
          If V is finite-dimensional and φ is a linear functional on V, there is exactly one u in V with{" "}
          <M>{"\\varphi(v) = \\langle v, u\\rangle"}</M> for all v, namely{" "}
          <M>{"u = \\sum_j \\overline{\\varphi(e_j)}\\, e_j"}</M> for any orthonormal basis.
        </p>
      </Theorem>
      <Proof>
        <p>
          Existence: <M>{"\\varphi(v) = \\varphi(\\sum_j\\langle v, e_j\\rangle e_j) = \\sum_j \\langle v, e_j\\rangle\\varphi(e_j) = \\langle v, \\sum_j \\overline{\\varphi(e_j)} e_j\\rangle"}</M>,
          using conjugate-linearity in the second slot. Uniqueness: if <M>{"\\langle v, u_1\\rangle = \\langle v, u_2\\rangle"}</M>{" "}
          for all v, take <M>{"v = u_1 - u_2"}</M> to get <M>{"\\|u_1 - u_2\\|^2 = 0"}</M>.
        </p>
      </Proof>

      <Remark title="why it matters">
        <p>
          Riesz identifies V with its dual space <M>{"V'"}</M>, which is how a derivative (a linear functional) becomes a
          gradient (a vector). The identification depends on the inner product: change the inner product and the gradient
          changes, which is the whole idea of preconditioning and natural gradients. For an orthonormal list that is not a
          basis, the coordinate formula becomes Bessel&apos;s inequality{" "}
          <M>{"\\sum_j |\\langle v, e_j\\rangle|^2 \\le \\|v\\|^2"}</M>, with the gap equal to the squared distance from v to
          the span.
        </p>
        <Code>{COORD}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "coord",
      rung: "check",
      prompt: <p>e₁ = (3/5, 4/5) and e₂ = (−4/5, 3/5) form an orthonormal basis of ℝ². What is the coordinate of v = (2, 1) along e₁?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 1e-9 },
    },
    {
      key: "norm",
      rung: "check",
      prompt: <p>A vector has coordinates (1, 2, 2) in some orthonormal basis. What is its norm?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 1e-9 },
    },
    {
      key: "facts",
      rung: "apply",
      prompt: <p>Which statement is true for every finite-dimensional inner product space V?</p>,
      answer: {
        kind: "choice",
        options: [
          "Every orthonormal list in V can be extended to an orthonormal basis of V.",
          "An orthonormal list in V can be longer than dim V.",
          "Gram–Schmidt applied to v₁, v₂ can change the span of v₁.",
          "Finding coordinates in an orthonormal basis requires solving a linear system.",
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

def gram_schmidt(vs, inner, tol=1e-10):
    es = []
    for v in vs:
        w = np.asarray(v, dtype=float)
        for e in es:
            w = w - inner(w, e) * e
        n = np.sqrt(inner(w, w))
        if n > tol:
            es.append(w / n)
    return es

M = np.array([[2.0, 0.0], [0.0, 1.0]])
ip = lambda x, y: float(x @ M @ y)
E = gram_schmidt([np.array([1.0, 0.0]), np.array([1.0, 1.0]), np.array([3.0, -2.0])], ip)
print(len(E), np.round(E[0], 4), np.round(E[1], 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["2 [0.7071 0.    ] [0. 1.]", "2 [1. 0.] [0. 1.]", "3 [0.7071 0.    ] [0. 1.]", "2 [0.7071 0.    ] [0.7071 0.7071]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def gram_schmidt(vs, inner, tol=1e-10):
    es = []
    for v in vs:
        w = np.asarray(v, dtype=float)
        for e in es:
            w = w - inner(w, e) * e
        n = np.sqrt(inner(w, w))
        if n > tol:
            es.append(w / n)
    return es

def coords(v, es, inner):
    return np.array([inner(v, e) for e in es])

def riesz_vector(phi, es):
    return sum(phi(e) * e for e in es)

M = np.array([[2.0, 0.0], [0.0, 1.0]])
ip = lambda x, y: float(x @ M @ y)
E = gram_schmidt([np.array([1.0, 0.0]), np.array([1.0, 1.0]), np.array([3.0, -2.0])], ip)
v = np.array([1.0, 2.0])
c = coords(v, E, ip)
print(np.round(c, 4), round(c @ c, 4), ip(v, v))
phi = lambda x: x[0] + x[1]
u = riesz_vector(phi, E)
print(np.round(u, 4), round(ip(np.array([5.0, 7.0]), u), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.4142 2.    ] 6.0 6.0\n[0.5 1. ] 12.0",
          "[1. 2.] 5.0 6.0\n[1. 1.] 12.0",
          "[1.4142 2.    ] 6.0 6.0\n[1. 1.] 17.0",
          "[1.4142 2.    ] 6.0 5.0\n[0.5 1. ] 9.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gram_schmidt(vs, inner, tol=1e-10)</C>. It takes a list of NumPy vectors and an inner product function and
          returns the list of orthonormal vectors that Gram–Schmidt produces, skipping any vector whose remainder has norm at
          most tol (so dependent vectors are dropped).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gram_schmidt(vs, inner, tol=1e-10):
    return [np.asarray(v, dtype=float) for v in vs]
`,
        solution: GS,
        tests: [
          { name: "dot product", code: `rng = np.random.default_rng(0)
vs = list(rng.normal(size=(3, 4)))
E = gram_schmidt(vs, lambda x, y: float(x @ y))
G = np.array([[e @ f for f in E] for e in E])
assert len(E) == 3 and np.allclose(G, np.eye(3))
assert np.allclose(E[0], vs[0] / np.linalg.norm(vs[0]))
Q = np.array(E).T
assert np.allclose(Q @ (Q.T @ vs[2]), vs[2])` },
          { name: "dependent and weighted", code: `M = np.array([[2.0, 0.0], [0.0, 1.0]])
ip = lambda x, y: float(x @ M @ y)
E = gram_schmidt([np.array([1.0, 0.0]), np.array([2.0, 0.0]), np.array([1.0, 1.0])], ip)
assert len(E) == 2
assert np.allclose(E[0], [2 ** -0.5, 0.0]) and np.allclose(E[1], [0.0, 1.0])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>coords(v, es, inner)</C>, the array of inner products of v with each vector of an orthonormal list, and{" "}
          <C>riesz_vector(phi, es)</C>, the real Riesz vector <M>{"\\sum_j \\varphi(e_j)e_j"}</M> of a linear functional phi,
          for an orthonormal basis es.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def coords(v, es, inner):
    return np.zeros(len(es))

def riesz_vector(phi, es):
    return es[0]
`,
        solution: `import numpy as np

${COORD}`,
        tests: [
          { name: "parseval", code: `Q, _ = np.linalg.qr(np.random.default_rng(1).normal(size=(4, 4)))
es = list(Q.T)
dot = lambda x, y: float(x @ y)
v = np.array([1.0, -2.0, 0.5, 3.0])
c = coords(v, es, dot)
assert c.shape == (4,) and np.isclose(c @ c, v @ v)
assert np.allclose(sum(ci * e for ci, e in zip(c, es)), v)` },
          { name: "riesz", code: `M = np.array([[2.0, 0.0], [0.0, 1.0]])
ip = lambda x, y: float(x @ M @ y)
es = [np.array([2 ** -0.5, 0.0]), np.array([0.0, 1.0])]
phi = lambda x: 3 * x[0] - x[1]
u = riesz_vector(phi, es)
for x in (np.array([1.0, 0.0]), np.array([0.3, -2.0]), np.array([5.0, 7.0])):
    assert np.isclose(ip(x, u), phi(x))` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that if e₁, …, eₙ is an orthonormal basis of V, then every v satisfies v = Σⱼ ⟨v, eⱼ⟩eⱼ and ‖v‖² = Σⱼ
          |⟨v, eⱼ⟩|².
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes v = Σ aₖeₖ (possible because the list is a basis) and takes the inner product with eⱼ, using orthonormality to get aⱼ = ⟨v, eⱼ⟩.",
          "For the norm, expands ⟨Σ aⱼeⱼ, Σ aₖeₖ⟩ and uses ⟨eⱼ, eₖ⟩ = 0 for j ≠ k and 1 for j = k to get Σ|aⱼ|².",
        ],
      },
    },
    {
      key: "legendre",
      rung: "stretch",
      prompt: (
        <p>
          With ⟨f, g⟩ = ∫₀¹ fg, Gram–Schmidt on 1, x, x² produces, before normalising, w₃ = x² − x + 1/6. What is ‖w₃‖²?
          Give 6 decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.00555556, tolerance: 1e-4 },
    },
  ],

  teachBack:
    "Explain to a friend why coordinates in an orthonormal basis are just inner products, how Gram–Schmidt builds such a basis in any inner product space, and how the Riesz theorem turns a linear functional into a vector.",

  glimpse: (
    <>
      <p>
        An orthonormal basis of a subspace U gives the closest point of U to any v, in one line: the sum of{" "}
        <M>{"\\langle v, e_j\\rangle e_j"}</M> over the basis of U. Next comes the orthogonal complement of U, everything
        perpendicular to it, and the decomposition of V as U plus its complement.
      </p>
      <p>
        Later, the spectral theorem will say that a self-adjoint operator has an orthonormal basis of eigenvectors, which is
        the strongest form of &ldquo;nice coordinates&rdquo; there is, and the reason that PCA, the SVD and much of numerical
        linear algebra work as well as they do.
      </p>
    </>
  ),
};
