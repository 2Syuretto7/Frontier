import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WeightNormEqViz } from "@/components/viz/WeightNormEqViz";
import type { LessonContent } from "@/lib/types";

const SHRINK = `import numpy as np

def ridge_shrink(H, w_ml, lam):
    return np.linalg.solve(H + lam * np.eye(len(H)), H @ w_ml)

def shrink_factors(H, lam):
    ev = np.linalg.eigvalsh(H)
    return ev / (ev + lam)`;

const EQ = `def norm_dynamics(w0, c, lr, wd, steps, rng):
    w = np.array(w0, dtype=float)
    for _ in range(steps):
        r = rng.normal(size=w.shape)
        r -= (r @ w) / (w @ w) * w
        g = c / np.linalg.norm(w) * r / np.linalg.norm(r)
        w = w - lr * (g + wd * w)
    return float(np.linalg.norm(w))

def equilibrium_norm(c, lr, wd):
    return (lr * c ** 2 / (2 * wd)) ** 0.25`;

export const lesson: LessonContent = {
  id: "l3.7.1",
  minutes: 45,
  links: {
    requires: ["l3.6.4", "l1.5.3"],
    revisits: ["l3.6.2", "l3.5.2"],
    foreshadows: ["l3.7.2", "l2.1.3", "m9.6.4"],
  },

  puzzle: (
    <>
      <p>
        Weight decay is usually explained as a penalty that keeps weights small, so the model is simpler. But in a network
        with BatchNorm, multiplying a layer's weights by any positive number changes nothing at all about what the network
        computes. Weight decay still makes such networks train noticeably better. What is it doing, if not making the function
        simpler?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Weight decay has two faces. On a plain model it shrinks the weights towards 0, most strongly in the directions the
        data says least about: the classic regulariser. On weights that feed a normalisation layer, size does not matter to
        the output, but it matters to the optimiser: the gradient shrinks as the weights grow, so the effective step size is
        η/‖w‖². Decay keeps ‖w‖ in check, and so it quietly sets the effective learning rate.
      </p>
      <WeightNormEqViz />
    </>
  ),

  theory: (
    <>
      <Definition title="weight decay">
        <p>
          SGD with weight decay λ uses <M>{"w \\leftarrow w - \\eta(\\nabla L + \\lambda w) = (1 - \\eta\\lambda)w - \\eta\\nabla L"}</M>:
          each step shrinks the weights by a factor <M>{"1 - \\eta\\lambda"}</M> before the gradient step. For SGD this is
          exactly gradient descent on <M>{"L + \\tfrac{\\lambda}{2}\\|w\\|^2"}</M>, and in Bayesian terms a Gaussian prior on
          the weights. (For Adam the two differ, which is why AdamW exists.)
        </p>
      </Definition>

      <Theorem title="shrinkage along curvature directions">
        <p>
          Near a minimum <M>{"w^*"}</M> of the data loss, let <M>{"L \\approx \\tfrac12(w - w^*)^\\top H (w - w^*)"}</M> with
          H symmetric positive semi-definite. The minimiser of{" "}
          <M>{"L + \\tfrac\\lambda2\\|w\\|^2"}</M> is <M>{"(H + \\lambda I)^{-1}Hw^*"}</M>: along each eigenvector of H with
          eigenvalue <M>{"h_i"}</M>, the component of <M>{"w^*"}</M> is multiplied by <M>{"h_i/(h_i + \\lambda)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The gradient is <M>{"H(w - w^*) + \\lambda w"}</M>; setting it to 0 gives <M>{"(H + \\lambda I)w = Hw^*"}</M>, and{" "}
          <M>{"H + \\lambda I"}</M> is invertible for λ &gt; 0. In H's eigenbasis both matrices are diagonal, with entries{" "}
          <M>{"h_i + \\lambda"}</M> and <M>{"h_i"}</M>, giving the factors. Directions of high curvature, where the data pins the
          weights down, keep almost all of their value; flat directions, where the data is indifferent, are pulled to 0.
        </p>
        <Code>{SHRINK}</Code>
      </Proof>

      <Theorem title="decay sets the effective learning rate">
        <p>
          Suppose L is scale-invariant in w, so <M>{"\\nabla L \\perp w"}</M> and <M>{"\\|\\nabla L\\| = c/\\|w\\|"}</M> for
          some c. Under SGD with weight decay, <M>{"\\|w\\|"}</M> settles near <M>{"(\\eta c^2/2\\lambda)^{1/4}"}</M>, where each
          step rotates w by about <M>{"\\sqrt{2\\eta\\lambda}"}</M> radians.
        </p>
      </Theorem>
      <Proof>
        <p>
          The two parts of the update are orthogonal, so{" "}
          <M>{"\\|w'\\|^2 = (1 - \\eta\\lambda)^2\\|w\\|^2 + \\eta^2c^2/\\|w\\|^2"}</M>. To first order in ηλ, the norm is
          steady when <M>{"2\\eta\\lambda\\|w\\|^2 = \\eta^2c^2/\\|w\\|^2"}</M>, i.e.{" "}
          <M>{"\\|w\\|^4 = \\eta c^2/(2\\lambda)"}</M>. The angle turned is about{" "}
          <M>{"\\eta\\|\\nabla L\\|/\\|w\\| = \\eta c/\\|w\\|^2 = \\eta c\\sqrt{2\\lambda/(\\eta c^2)} = \\sqrt{2\\eta\\lambda}"}</M>.
        </p>
        <Code>{EQ}</Code>
      </Proof>

      <Remark title="practical consequences">
        <p>
          Without decay, normalised weights only grow, the effective learning rate keeps falling, and training can stall
          early. With decay, η and λ act together through ηλ. Biases and normalisation gains are usually excluded from decay,
          since shrinking them has no regularising or rate-setting benefit. Typical values: λ = 5 × 10⁻⁴ for SGD on images,
          0.01 to 0.1 for AdamW on transformers.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "factor",
      rung: "check",
      prompt: <p>Along an eigenvector of H with eigenvalue 4, weight decay λ = 1 multiplies the optimum's component by what factor?</p>,
      answer: { kind: "numeric", value: 0.8, tolerance: 1e-9 },
    },
    {
      key: "angle",
      rung: "check",
      prompt: <p>A normalised layer trained with η = 0.1 and λ = 5 × 10⁻⁴. About how many radians does each step rotate its weights at equilibrium?</p>,
      answer: { kind: "numeric", value: 0.01, tolerance: 1e-6 },
    },
    {
      key: "bn",
      rung: "apply",
      prompt: <p>For weights feeding into a BatchNorm layer, what does weight decay mainly change?</p>,
      answer: {
        kind: "choice",
        options: [
          "The effective learning rate, by keeping the weight norm from growing",
          "The function the network computes, by making it smoother",
          "Nothing at all",
          "The BatchNorm running statistics",
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

def ridge_shrink(H, w_ml, lam):
    return np.linalg.solve(H + lam * np.eye(len(H)), H @ w_ml)

def shrink_factors(H, lam):
    ev = np.linalg.eigvalsh(H)
    return ev / (ev + lam)

H = np.diag([4.0, 0.25])
print(ridge_shrink(H, np.array([1.0, 1.0]), 1.0), shrink_factors(H, 1.0))
w = np.array([2.0, -1.0]); g = np.array([0.5, 0.5]); lr, wd = 0.1, 0.01
print(np.allclose(w - lr * (g + wd * w), (1 - lr * wd) * w - lr * g))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0.8 0.2] [0.2 0.8]\nTrue", "[0.2 0.8] [0.2 0.8]\nTrue", "[0.8 0.2] [0.8 0.2]\nFalse", "[0.5 0.5] [0.2 0.8]\nTrue"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def norm_dynamics(w0, c, lr, wd, steps, rng):
    w = np.array(w0, dtype=float)
    for _ in range(steps):
        r = rng.normal(size=w.shape)
        r -= (r @ w) / (w @ w) * w
        g = c / np.linalg.norm(w) * r / np.linalg.norm(r)
        w = w - lr * (g + wd * w)
    return float(np.linalg.norm(w))

def equilibrium_norm(c, lr, wd):
    return (lr * c ** 2 / (2 * wd)) ** 0.25

rng = np.random.default_rng(0)
for w0 in [0.1, 1.0, 10.0]:
    print(round(norm_dynamics(np.full(50, w0 / np.sqrt(50)), 1.0, 0.1, 0.01, 3000, rng), 2))
print(round(equilibrium_norm(1.0, 0.1, 0.01), 2))`}</Code>
          <p>Three starting norms, 3000 steps. Which output is closest to what this prints?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.5\n1.5\n1.5\n1.5", "0.1\n1.0\n10.0\n1.5", "0.0\n0.0\n0.0\n1.5", "1.5\n1.5\n1.5\n2.24"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ridge_shrink(H, w_ml, lam)</C>, the minimiser of{" "}
          <M>{"\\tfrac12(w - w_{ml})^\\top H(w - w_{ml}) + \\tfrac{\\lambda}{2}\\|w\\|^2"}</M> (solve a linear system), and{" "}
          <C>shrink_factors(H, lam)</C>, the factors <M>{"h_i/(h_i + \\lambda)"}</M> for the eigenvalues of the symmetric H in
          ascending order.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ridge_shrink(H, w_ml, lam):
    return w_ml / (1 + lam)

def shrink_factors(H, lam):
    return np.ones(len(H))
`,
        solution: SHRINK,
        tests: [
          { name: "diagonal", code: `H = np.diag([4.0, 0.25])
assert np.allclose(ridge_shrink(H, np.array([1.0, 1.0]), 1.0), [0.8, 0.2])
assert np.allclose(shrink_factors(H, 1.0), [0.2, 0.8])
assert np.allclose(ridge_shrink(H, np.array([3.0, -2.0]), 0.0), [3.0, -2.0])` },
          { name: "rotated", code: `th = 0.6
Q = np.array([[np.cos(th), -np.sin(th)], [np.sin(th), np.cos(th)]])
H = Q @ np.diag([9.0, 1.0]) @ Q.T
w_ml = Q @ np.array([2.0, 2.0])
assert np.allclose(ridge_shrink(H, w_ml, 1.0), Q @ np.array([1.8, 1.0]))
w = ridge_shrink(H, w_ml, 1.0)
assert np.allclose(H @ (w - w_ml) + w, 0)
assert np.allclose(shrink_factors(H, 3.0), [0.25, 0.75])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>norm_dynamics(w0, c, lr, wd, steps, rng)</C>: at each step draw a random direction with{" "}
          <C>rng.normal</C>, remove its component along w, scale it to length <C>c / ‖w‖</C> to get g, and update{" "}
          <C>w = w − lr·(g + wd·w)</C>; return the final norm as a float. Also write <C>equilibrium_norm(c, lr, wd)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def norm_dynamics(w0, c, lr, wd, steps, rng):
    return float(np.linalg.norm(w0))

def equilibrium_norm(c, lr, wd):
    return 1.0
`,
        solution: `import numpy as np

${EQ}`,
        tests: [
          { name: "equilibrium", code: `assert abs(equilibrium_norm(1.0, 0.1, 0.01) - 5 ** 0.25) < 1e-12
assert abs(equilibrium_norm(2.0, 0.05, 0.001) - (0.05 * 4 / 0.002) ** 0.25) < 1e-12
rng = np.random.default_rng(1)
for n0 in [0.1, 10.0]:
    n = norm_dynamics(np.full(40, n0 / np.sqrt(40)), 1.0, 0.1, 0.01, 3000, rng)
    assert abs(n - equilibrium_norm(1.0, 0.1, 0.01)) < 0.05 and isinstance(n, float)` },
          { name: "pieces", code: `rng = np.random.default_rng(2)
assert abs(norm_dynamics(np.array([3.0, 4.0]), 0.0, 0.1, 0.5, 2, rng) - 5 * 0.95 ** 2) < 1e-12
n = norm_dynamics(np.array([3.0, 4.0]), 2.0, 0.5, 0.0, 1, rng)
assert abs(n - np.sqrt(25 + (0.5 * 2.0 / 5) ** 2)) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that the minimiser of ½(w − w*)ᵀH(w − w*) + (λ/2)‖w‖², for symmetric positive semi-definite H and λ &gt; 0, multiplies the component of w* along each eigenvector of H with eigenvalue h by h/(h + λ).</p>,
      answer: {
        kind: "written",
        rubric: [
          "Sets the gradient H(w − w*) + λw to zero to get (H + λI)w = Hw*, noting H + λI is invertible (and the objective strictly convex) for λ > 0.",
          "Writes H = QΛQᵀ with orthonormal eigenvectors and transforms to that basis, where both sides are diagonal.",
          "Concludes each coordinate satisfies (h + λ)wᵢ = h wᵢ*, so wᵢ = h/(h + λ) · wᵢ*.",
        ],
      },
    },
    {
      key: "eqn",
      rung: "stretch",
      prompt: <p>With c = 1, η = 0.1 and λ = 0.001, what is the equilibrium weight norm (ηc²/2λ)^¼? Give 4 decimal places.</p>,
      answer: { kind: "numeric", value: 2.65914795, tolerance: 1e-4 },
    },
  ],

  teachBack:
    "Explain to a friend the two things weight decay does: shrink weakly determined directions, and, for normalised layers, set the effective learning rate.",

  glimpse: (
    <p>
      Weight decay regularises the weights. Next: dropout, which regularises by randomly removing units during training.
    </p>
  ),
};
