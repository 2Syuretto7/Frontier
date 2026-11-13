import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DualNormViz } from "@/components/viz/DualNormViz";
import type { LessonContent } from "@/lib/types";

const NORMS = `import numpy as np

def pnorm(x, p):
    a = np.abs(np.asarray(x, dtype=float))
    return float(a.max()) if p == np.inf else float((a ** p).sum() ** (1 / p))

def dual_maximiser(y, p):
    y = np.asarray(y, dtype=float)
    if p == np.inf:
        return np.sign(y)
    if p == 1:
        x = np.zeros_like(y)
        i = np.argmax(np.abs(y))
        x[i] = np.sign(y[i])
        return x
    q = p / (p - 1)
    x = np.sign(y) * np.abs(y) ** (q - 1)
    return x / pnorm(x, p)`;

const STEEP = `def steepest_step(g, p, lr):
    g = np.asarray(g, dtype=float)
    if p == 2:
        return -lr * g
    if p == np.inf:
        return -lr * np.abs(g).sum() * np.sign(g)
    if p == 1:
        d = np.zeros_like(g)
        i = np.argmax(np.abs(g))
        d[i] = g[i]
        return -lr * d
    raise ValueError("p must be 1, 2 or inf")

def fgsm(x, grad, eps):
    return np.clip(x + eps * np.sign(grad), 0.0, 1.0)`;

export const lesson: LessonContent = {
  id: "m6.5.1",
  minutes: 55,
  links: {
    requires: ["m6.2.1", "m6.1.4"],
    revisits: ["m6.2.2"],
    foreshadows: ["m6.5.2"],
  },

  puzzle: (
    <>
      <p>
        The fast gradient sign attack perturbs an image by ε·sign(∇L), not by a multiple of the gradient. Sign-based
        optimisers do something similar to the weights. Both are &ldquo;steepest descent&rdquo;, but measured with a
        different ruler. What is the general rule that turns a choice of norm into a choice of step?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A norm decides which perturbations count as small: its unit ball. To make the inner product with a vector y as large
        as possible while staying in the ball, push to the edge of the ball in the direction y favours. How far you get is
        the dual norm of y. Round balls give back the Euclidean norm, but corners on the ball produce sparse or sign-like
        maximisers, and that is where the sign in the attack comes from.
      </p>
      <DualNormViz />
    </>
  ),

  theory: (
    <>
      <Definition title="norm">
        <p>
          A norm on a real or complex vector space V is a function <M>{"\\|\\cdot\\|: V \\to [0, \\infty)"}</M> with{" "}
          <M>{"\\|v\\| = 0"}</M> only for v = 0, <M>{"\\|\\lambda v\\| = |\\lambda|\\,\\|v\\|"}</M>, and{" "}
          <M>{"\\|u + v\\| \\le \\|u\\| + \\|v\\|"}</M>. On <M>{"\\mathbb{R}^n"}</M> the p-norms are{" "}
          <M>{"\\|x\\|_p = (\\sum_i |x_i|^p)^{1/p}"}</M> for 1 ≤ p &lt; ∞ and <M>{"\\|x\\|_\\infty = \\max_i |x_i|"}</M>.
        </p>
      </Definition>

      <Theorem title="equivalence of norms in finite dimensions">
        <p>
          On <M>{"\\mathbb{R}^n"}</M>,{" "}
          <M>{"\\|x\\|_\\infty \\le \\|x\\|_2 \\le \\|x\\|_1 \\le \\sqrt n\\,\\|x\\|_2 \\le n\\|x\\|_\\infty"}</M>. More
          generally any two norms on a finite-dimensional space are within constant factors of each other.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\max_i x_i^2 \\le \\sum_i x_i^2"}</M> gives the first. <M>{"(\\sum|x_i|)^2 = \\sum x_i^2 + \\sum_{i\\ne j}|x_i||x_j| \\ge \\sum x_i^2"}</M>{" "}
          gives the second. Cauchy–Schwarz with the all-ones vector gives{" "}
          <M>{"\\sum|x_i| \\le \\sqrt n\\,\\|x\\|_2"}</M>, and <M>{"\\|x\\|_2^2 \\le n\\max_i x_i^2"}</M> gives the last. (The
          general statement uses compactness of the unit sphere and continuity of the norm.) The constants depend on n,
          which is why the choice of norm matters in high dimensions.
        </p>
      </Proof>

      <Definition title="dual norm">
        <p>
          The dual norm of y is <M>{"\\|y\\|_* = \\max\\{\\langle x, y\\rangle : \\|x\\| \\le 1\\}"}</M>. By definition{" "}
          <M>{"\\langle x, y\\rangle \\le \\|x\\|\\,\\|y\\|_*"}</M> for all x, y, a generalised Cauchy–Schwarz inequality.
        </p>
      </Definition>

      <Theorem title="duals of the p-norms">
        <p>
          With the dot product, the dual of <M>{"\\|\\cdot\\|_p"}</M> is <M>{"\\|\\cdot\\|_q"}</M> where{" "}
          <M>{"1/p + 1/q = 1"}</M>; in particular ℓ₁ and ℓ∞ are dual to each other and ℓ₂ is self-dual.
        </p>
      </Theorem>
      <Proof>
        <p>
          For p = 1: <M>{"\\langle x, y\\rangle \\le \\sum|x_i||y_i| \\le \\|y\\|_\\infty\\sum|x_i| \\le \\|y\\|_\\infty"}</M>{" "}
          when <M>{"\\|x\\|_1 \\le 1"}</M>, and <M>{"x = \\operatorname{sign}(y_i)e_i"}</M> at an index i of largest{" "}
          <M>{"|y_i|"}</M> attains it. For p = ∞:{" "}
          <M>{"\\langle x, y\\rangle \\le \\sum|y_i| = \\|y\\|_1"}</M> when all <M>{"|x_i| \\le 1"}</M>, attained at{" "}
          <M>{"x = \\operatorname{sign}(y)"}</M>. For 1 &lt; p &lt; ∞, Hölder&apos;s inequality{" "}
          <M>{"\\sum|x_iy_i| \\le \\|x\\|_p\\|y\\|_q"}</M> gives the upper bound, and{" "}
          <M>{"x_i \\propto \\operatorname{sign}(y_i)|y_i|^{q-1}"}</M>, scaled to unit p-norm, attains it.
        </p>
      </Proof>
      <Code>{NORMS}</Code>

      <Example title="steepest descent in a norm">
        <p>
          To first order, a step d changes the loss by <M>{"\\langle g, d\\rangle"}</M>. The step of norm at most η that
          decreases it most is <M>{"d = -\\eta x^*"}</M>, where <M>{"x^*"}</M> maximises <M>{"\\langle x, g\\rangle"}</M>{" "}
          on the unit ball, and the decrease is <M>{"\\eta\\|g\\|_*"}</M>. In ℓ₂ this is the normalised gradient; in ℓ∞ it
          is <M>{"-\\eta\\operatorname{sign}(g)"}</M>, sign descent; in ℓ₁ it moves only the coordinate with the largest
          partial derivative, coordinate descent. Scaling by <M>{"\\|g\\|_*"}</M> instead of fixing the length gives the
          unnormalised versions used in practice. An adversarial attack is steepest ascent of the loss in the input, so an
          ℓ∞ budget gives FGSM.
        </p>
        <Code>{STEEP}</Code>
      </Example>

      <Remark title="duality is about the inner product">
        <p>
          The dual norm lives naturally on the dual space <M>{"V'"}</M>: <M>{"\\|\\varphi\\|_* = \\max_{\\|x\\|\\le 1}\\varphi(x)"}</M>.
          The Riesz map identifies <M>{"V'"}</M> with V using the inner product, which is why the formula uses{" "}
          <M>{"\\langle x, y\\rangle"}</M>. In finite dimensions the dual of the dual norm is the original norm.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "l1",
      rung: "check",
      prompt: <p>What is ‖(3, −4, 12)‖₁?</p>,
      answer: { kind: "numeric", value: 19 },
    },
    {
      key: "q",
      rung: "check",
      prompt: <p>The dual of the ℓ₃ norm is the ℓ_q norm. What is q?</p>,
      answer: { kind: "numeric", value: 1.5, tolerance: 1e-9 },
    },
    {
      key: "fgsm",
      rung: "apply",
      prompt: <p>An attacker may change each pixel by at most ε. To first order, which perturbation increases the loss L most?</p>,
      answer: {
        kind: "choice",
        options: ["ε·sign(∇ₓL)", "ε·∇ₓL / ‖∇ₓL‖₂", "ε times the basis vector of the largest |∂L/∂xᵢ|, with its sign", "−ε·sign(∇ₓL)"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def pnorm(x, p):
    a = np.abs(np.asarray(x, dtype=float))
    return float(a.max()) if p == np.inf else float((a ** p).sum() ** (1 / p))

def dual_maximiser(y, p):
    y = np.asarray(y, dtype=float)
    if p == np.inf:
        return np.sign(y)
    if p == 1:
        x = np.zeros_like(y)
        i = np.argmax(np.abs(y))
        x[i] = np.sign(y[i])
        return x
    q = p / (p - 1)
    x = np.sign(y) * np.abs(y) ** (q - 1)
    return x / pnorm(x, p)

x = np.array([3.0, -4.0])
print([pnorm(x, p) for p in (1, 2, np.inf)])
print(dual_maximiser(x, 1) + 0.0, dual_maximiser(x, np.inf), np.round(dual_maximiser(x, 2), 4))
print([round(float(x @ dual_maximiser(x, p)), 4) for p in (1, 2, np.inf)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[7.0, 5.0, 4.0]\n[ 0. -1.] [ 1. -1.] [ 0.6 -0.8]\n[4.0, 5.0, 7.0]",
          "[7.0, 5.0, 4.0]\n[1. 0.] [ 1. -1.] [ 0.6 -0.8]\n[3.0, 5.0, 7.0]",
          "[4.0, 5.0, 7.0]\n[ 0. -1.] [ 1. -1.] [ 0.6 -0.8]\n[7.0, 5.0, 4.0]",
          "[7.0, 5.0, 4.0]\n[ 0. -1.] [ 1. -1.] [ 0.6 -0.8]\n[7.0, 5.0, 4.0]",
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

def steepest_step(g, p, lr):
    g = np.asarray(g, dtype=float)
    if p == 2:
        return -lr * g
    if p == np.inf:
        return -lr * np.abs(g).sum() * np.sign(g)
    if p == 1:
        d = np.zeros_like(g)
        i = np.argmax(np.abs(g))
        d[i] = g[i]
        return -lr * d
    raise ValueError("p must be 1, 2 or inf")

def fgsm(x, grad, eps):
    return np.clip(x + eps * np.sign(grad), 0.0, 1.0)

g = np.array([0.5, -2.0, 1.0])
for p in (1, 2, np.inf):
    print(p, steepest_step(g, p, 0.1) + 0.0)
print(fgsm(np.array([0.2, 0.95, 0.5]), np.array([1.0, 2.0, -3.0]), 0.1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1 [0.  0.2 0. ]\n2 [-0.05  0.2  -0.1 ]\ninf [-0.35  0.35 -0.35]\n[0.3 1.  0.4]",
          "1 [-0.05  0.   0.  ]\n2 [-0.05  0.2  -0.1 ]\ninf [-0.35  0.35 -0.35]\n[0.3 1.  0.4]",
          "1 [0.  0.2 0. ]\n2 [-0.05  0.2  -0.1 ]\ninf [-0.1  0.1 -0.1]\n[0.3 1.  0.4]",
          "1 [0.  0.2 0. ]\n2 [-0.05  0.2  -0.1 ]\ninf [-0.35  0.35 -0.35]\n[0.3  1.05 0.4 ]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pnorm(x, p)</C> for p ≥ 1 or p = np.inf, and <C>dual_maximiser(y, p)</C>: a vector x of p-norm 1 that
          maximises ⟨x, y⟩ (for p = 1 use an index of largest |yᵢ|; for 1 &lt; p &lt; ∞ use xᵢ ∝ sign(yᵢ)|yᵢ|^(q−1)).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def pnorm(x, p):
    return float(np.linalg.norm(x))

def dual_maximiser(y, p):
    return y / np.linalg.norm(y)
`,
        solution: NORMS,
        tests: [
          { name: "norms", code: `x = np.array([3.0, -4.0])
assert [pnorm(x, p) for p in (1, 2, np.inf)] == [7.0, 5.0, 4.0]
assert abs(pnorm([1.0, 2.0, 3.0], 3) - 36 ** (1 / 3)) < 1e-12
assert isinstance(pnorm(x, 1), float)` },
          { name: "dual", code: `rng = np.random.default_rng(0)
y = rng.normal(size=5)
for p, q in [(1, np.inf), (2, 2), (np.inf, 1), (3, 1.5), (1.5, 3)]:
    x = dual_maximiser(y, p)
    assert abs(pnorm(x, p) - 1) < 1e-9
    assert abs(x @ y - pnorm(y, q)) < 1e-9
for _ in range(20):
    z = rng.normal(size=5); z = z / pnorm(z, 3)
    assert z @ y <= dual_maximiser(y, 3) @ y + 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>steepest_step(g, p, lr)</C>, the unnormalised steepest-descent step −lr·‖g‖_q·x* for p in {"{"}1, 2,
          np.inf{"}"} (x* the dual maximiser of g; raise ValueError otherwise), and <C>fgsm(x, grad, eps)</C>, the ℓ∞ attack
          x + ε·sign(grad) clipped to [0, 1].
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def steepest_step(g, p, lr):
    return -lr * np.asarray(g, dtype=float)

def fgsm(x, grad, eps):
    return x + eps * grad
`,
        solution: `import numpy as np

${STEEP}`,
        tests: [
          { name: "steps", code: `g = np.array([0.5, -2.0, 1.0])
assert np.allclose(steepest_step(g, 2, 0.1), -0.1 * g)
assert np.allclose(steepest_step(g, np.inf, 0.1), [-0.35, 0.35, -0.35])
assert np.allclose(steepest_step(g, 1, 0.1), [0.0, 0.2, 0.0])
try:
    steepest_step(g, 3, 0.1)
    assert False
except ValueError:
    pass` },
          { name: "fgsm", code: `out = fgsm(np.array([0.2, 0.95, 0.5, 0.0]), np.array([1.0, 2.0, -3.0, -1.0]), 0.1)
assert np.allclose(out, [0.3, 1.0, 0.4, 0.0])
assert np.allclose(fgsm(np.full(3, 0.5), np.zeros(3), 0.2), 0.5)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that the dual of the ℓ₁ norm on ℝⁿ (with the dot product) is the ℓ∞ norm.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Upper bound: for ‖x‖₁ ≤ 1, ⟨x, y⟩ ≤ Σ|xᵢ||yᵢ| ≤ maxᵢ|yᵢ| Σ|xᵢ| ≤ ‖y‖∞.",
          "Attainment: x = sign(yᵢ)eᵢ for an index i with |yᵢ| = ‖y‖∞ has ‖x‖₁ = 1 and ⟨x, y⟩ = ‖y‖∞.",
        ],
      },
    },
    {
      key: "holder",
      rung: "stretch",
      prompt: <p>What is the maximum of ⟨x, (1, 2, 3)⟩ over ‖x‖₃ ≤ 1? Give 4 decimal places.</p>,
      answer: { kind: "numeric", value: 4.3346229, tolerance: 1e-4 },
    },
  ],

  teachBack:
    "Explain to a friend what the dual of a norm is, why ℓ₁ and ℓ∞ are dual, and how the dual maximiser gives steepest descent and the FGSM attack.",

  glimpse: (
    <>
      <p>
        A norm on inputs and a norm on outputs together measure a matrix: the largest output norm over unit inputs. Next
        come these operator norms, the spectral norm among them, and two norms built from singular values, the Frobenius and
        nuclear norms. The nuclear norm is dual to the spectral norm just as ℓ₁ is dual to ℓ∞, and the Frobenius norm, like
        ℓ₂, is its own dual.
      </p>
      <p>
        Duality also explains why some recent optimisers pick a norm per layer (spectral for weight matrices) and step along
        its dual maximiser, which for the spectral norm is the polar factor from the SVD chapter.
      </p>
    </>
  ),
};
