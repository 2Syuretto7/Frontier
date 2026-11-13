import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WeightedInnerViz } from "@/components/viz/WeightedInnerViz";
import type { LessonContent } from "@/lib/types";

const INNER = `import numpy as np

def inner_M(x, y, M):
    return float(x @ M @ y)

def is_inner_product_matrix(M, tol=1e-12):
    M = np.asarray(M, dtype=float)
    return bool(np.allclose(M, M.T) and np.linalg.eigvalsh(M).min() > tol)`;

const FUNC = `def func_inner(f, g, n=10000):
    x = (np.arange(n) + 0.5) / n
    return float(np.mean(f(x) * g(x)))

def gram_matrix(funcs, n=10000):
    return np.array([[func_inner(f, g, n) for g in funcs] for f in funcs])`;

export const lesson: LessonContent = {
  id: "m6.2.1",
  minutes: 55,
  links: {
    requires: ["m6.1.4", "m3.1.2", "m3.7.5"],
    revisits: ["m3.5.1"],
    foreshadows: ["m6.2.2", "m6.5.1"],
  },

  puzzle: (
    <>
      <p>
        Two functions on [0, 1] can be &ldquo;perpendicular&rdquo;: sin(2πx) and cos(2πx) are, in a precise sense. Two
        parameter updates can be perpendicular with respect to one geometry and not another, which is what natural-gradient
        methods exploit. What is the general recipe for length and angle, and which facts about them survive outside{" "}
        <M>{"\\mathbb{R}^n"}</M>?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An inner product is any rule for multiplying two vectors to a scalar that is linear, symmetric and positive. The dot
        product is one; <M>{"x^\\top M y"}</M> for a positive definite M is another, with ellipses as unit balls; the
        integral of a product is another, for functions. Each gives lengths and angles, and Cauchy–Schwarz and the triangle
        inequality hold for all of them, because their proofs use only the axioms.
      </p>
      <WeightedInnerViz />
    </>
  ),

  theory: (
    <>
      <Definition title="inner product">
        <p>
          An inner product on V over F assigns a scalar <M>{"\\langle u, v\\rangle"}</M> to each pair so that{" "}
          <M>{"\\langle v, v\\rangle \\ge 0"}</M> with equality only for v = 0; it is linear in the first slot; and{" "}
          <M>{"\\langle u, v\\rangle = \\overline{\\langle v, u\\rangle}"}</M>. Over ℝ the conjugate does nothing. The norm is{" "}
          <M>{"\\|v\\| = \\sqrt{\\langle v, v\\rangle}"}</M>.
        </p>
      </Definition>

      <Example title="three inner products">
        <p>
          On <M>{"\\mathbb{R}^n"}</M>, <M>{"\\langle x, y\\rangle_M = x^\\top M y"}</M> for any symmetric positive definite M
          (M = I is the dot product). On <M>{"\\mathbb{C}^n"}</M>, <M>{"\\sum x_i\\overline{y_i}"}</M>. On continuous functions
          on [0, 1], <M>{"\\langle f, g\\rangle = \\int_0^1 f g"}</M>.
        </p>
        <Code>{INNER}</Code>
      </Example>

      <Theorem title="Cauchy–Schwarz">
        <p>
          <M>{"|\\langle u, v\\rangle| \\le \\|u\\|\\,\\|v\\|"}</M>, with equality exactly when one vector is a multiple of the
          other.
        </p>
      </Theorem>
      <Proof>
        <p>
          If v = 0 both sides are 0. Otherwise write <M>{"u = cv + w"}</M> with{" "}
          <M>{"c = \\langle u, v\\rangle/\\|v\\|^2"}</M>, so that <M>{"\\langle w, v\\rangle = 0"}</M>. Then{" "}
          <M>{"\\|u\\|^2 = |c|^2\\|v\\|^2 + \\|w\\|^2 \\ge |c|^2\\|v\\|^2 = |\\langle u, v\\rangle|^2/\\|v\\|^2"}</M>, using the
          Pythagorean theorem for the orthogonal pair cv, w (expand <M>{"\\langle cv + w, cv + w\\rangle"}</M>; the cross
          terms vanish). Multiply by <M>{"\\|v\\|^2"}</M>. Equality holds iff w = 0, i.e. u is a multiple of v.
        </p>
      </Proof>

      <Theorem title="triangle inequality and parallelogram law">
        <p>
          <M>{"\\|u + v\\| \\le \\|u\\| + \\|v\\|"}</M>, and{" "}
          <M>{"\\|u + v\\|^2 + \\|u - v\\|^2 = 2\\|u\\|^2 + 2\\|v\\|^2"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\|u + v\\|^2 = \\|u\\|^2 + 2\\operatorname{Re}\\langle u, v\\rangle + \\|v\\|^2 \\le \\|u\\|^2 + 2\\|u\\|\\|v\\| + \\|v\\|^2"}</M>{" "}
          by Cauchy–Schwarz, which is <M>{"(\\|u\\| + \\|v\\|)^2"}</M>. For the parallelogram law, add the expansions of{" "}
          <M>{"\\|u + v\\|^2"}</M> and <M>{"\\|u - v\\|^2"}</M>: the cross terms cancel.
        </p>
      </Proof>

      <Remark title="norms that are not from inner products">
        <p>
          Every inner product gives a norm, but not every norm comes from an inner product: the parallelogram law is the
          test. The 1-norm fails it: for u = (1, 0), v = (0, 1), the left side is 8 and the right side 4. Such norms still
          measure size but have no notion of angle.
        </p>
        <Code>{FUNC}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "weighted",
      rung: "check",
      prompt: <p>With M = diag(1, 2), what is ⟨(1, 2), (3, 4)⟩_M = xᵀMy?</p>,
      answer: { kind: "numeric", value: 19 },
    },
    {
      key: "func",
      rung: "check",
      prompt: <p>With ⟨f, g⟩ = ∫₀¹ f(x)g(x) dx, what is ⟨x, x²⟩?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 1e-9 },
    },
    {
      key: "para",
      rung: "apply",
      prompt: <p>Which of these norms on ℝ² comes from an inner product?</p>,
      answer: {
        kind: "choice",
        options: ["√(2x₁² + x₂²)", "|x₁| + |x₂|", "max(|x₁|, |x₂|)", "(|x₁|³ + |x₂|³)^(1/3)"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def inner_M(x, y, M):
    return float(x @ M @ y)

def is_inner_product_matrix(M, tol=1e-12):
    M = np.asarray(M, dtype=float)
    return bool(np.allclose(M, M.T) and np.linalg.eigvalsh(M).min() > tol)

M = np.diag([1.0, 2.0])
x, y = np.array([1.0, 2.0]), np.array([3.0, 4.0])
print(inner_M(x, y, M), inner_M(x, y, M) ** 2 <= inner_M(x, x, M) * inner_M(y, y, M))
print(is_inner_product_matrix(M), is_inner_product_matrix([[1.0, 2.0], [2.0, 1.0]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["19.0 True\nTrue False", "11.0 True\nTrue False", "19.0 False\nTrue False", "19.0 True\nTrue True"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def func_inner(f, g, n=10000):
    x = (np.arange(n) + 0.5) / n
    return float(np.mean(f(x) * g(x)))

def gram_matrix(funcs, n=10000):
    return np.array([[func_inner(f, g, n) for g in funcs] for f in funcs])

n1 = lambda v: np.abs(v).sum()
n2 = lambda v: np.sqrt(v @ v)
u, v = np.array([1.0, 0.0]), np.array([0.0, 1.0])
for n in (n1, n2):
    print(round(n(u + v) ** 2 + n(u - v) ** 2, 6), round(2 * n(u) ** 2 + 2 * n(v) ** 2, 6))
print(np.round(gram_matrix([lambda t: np.ones_like(t), lambda t: t]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "8.0 4.0\n4.0 4.0\n[[1.     0.5   ]\n [0.5    0.3333]]",
          "4.0 4.0\n4.0 4.0\n[[1.     0.5   ]\n [0.5    0.3333]]",
          "8.0 4.0\n4.0 4.0\n[[1.  0.]\n [0.  1.]]",
          "8.0 8.0\n4.0 4.0\n[[1.     0.5   ]\n [0.5    0.3333]]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>inner_M(x, y, M)</C>, the real inner product xᵀMy as a float, and{" "}
          <C>is_inner_product_matrix(M, tol=1e-12)</C>, True when M is symmetric and all its eigenvalues exceed tol, so that
          xᵀMy is an inner product.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def inner_M(x, y, M):
    return float(x @ y)

def is_inner_product_matrix(M, tol=1e-12):
    return True
`,
        solution: INNER,
        tests: [
          { name: "value", code: `M = np.diag([1.0, 2.0])
assert inner_M(np.array([1.0, 2.0]), np.array([3.0, 4.0]), M) == 19.0
assert isinstance(inner_M(np.ones(2), np.ones(2), np.eye(2)), float)` },
          { name: "positive definite", code: `assert is_inner_product_matrix(np.diag([1.0, 2.0])) is True
assert is_inner_product_matrix([[1.0, 2.0], [2.0, 1.0]]) is False
assert is_inner_product_matrix([[1.0, 0.5], [0.0, 1.0]]) is False
assert is_inner_product_matrix([[2.0, 1.0], [1.0, 2.0]]) is True
assert is_inner_product_matrix(np.zeros((2, 2))) is False` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>func_inner(f, g, n=10000)</C>, approximating <M>{"\\int_0^1 f g"}</M> by the midpoint rule with n points
          (the functions accept NumPy arrays), and <C>gram_matrix(funcs, n=10000)</C>, the matrix of all pairwise inner
          products.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def func_inner(f, g, n=10000):
    return 0.0

def gram_matrix(funcs, n=10000):
    return np.eye(len(funcs))
`,
        solution: `import numpy as np

${FUNC}`,
        tests: [
          { name: "integrals", code: `assert abs(func_inner(lambda t: t, lambda t: t ** 2) - 0.25) < 1e-6
assert abs(func_inner(lambda t: np.sin(2 * np.pi * t), lambda t: np.cos(2 * np.pi * t))) < 1e-9
assert abs(func_inner(lambda t: np.sin(2 * np.pi * t), lambda t: np.sin(2 * np.pi * t)) - 0.5) < 1e-9` },
          { name: "hilbert", code: `G = gram_matrix([lambda t, k=k: t ** k for k in range(4)])
H = np.array([[1 / (i + j + 1) for j in range(4)] for i in range(4)])
assert G.shape == (4, 4) and np.allclose(G, H, atol=1e-6) and np.all(np.linalg.eigvalsh(G) > 0)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove the Cauchy–Schwarz inequality |⟨u, v⟩| ≤ ‖u‖‖v‖ in any inner product space, using only the inner product axioms.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Handles v = 0 separately, then decomposes u = cv + w with c = ⟨u, v⟩/‖v‖² so that ⟨w, v⟩ = 0 (or equivalently uses 0 ≤ ‖u − tv‖² with the optimal t).",
          "Uses the Pythagorean identity ‖cv + w‖² = |c|²‖v‖² + ‖w‖², from expanding and the vanishing cross terms.",
          "Concludes ‖u‖² ≥ |⟨u, v⟩|²/‖v‖² and multiplies through.",
        ],
      },
    },
    {
      key: "angle",
      rung: "stretch",
      prompt: <p>With ⟨f, g⟩ = ∫₀¹ fg, what is the cosine of the angle between f(x) = 1 and g(x) = x? Give 4 decimal places.</p>,
      answer: { kind: "numeric", value: 0.8660254, tolerance: 1e-4 },
    },
  ],

  teachBack:
    "Explain to a friend what an inner product is, give three examples, and show why Cauchy–Schwarz holds for every one of them.",

  glimpse: (
    <p>
      With an inner product, some bases are much better than others. Next: orthonormal bases, the Gram–Schmidt process in
      general spaces, and why coordinates become inner products.
    </p>
  ),
};
