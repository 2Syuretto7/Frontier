import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SpectralStepViz } from "@/components/viz/SpectralStepViz";
import type { LessonContent } from "@/lib/types";

const NS = `import numpy as np

ABC = (3.4445, -4.7750, 2.0315)

def ns5(G, steps=5, abc=ABC):
    a, b, c = abc
    X = np.asarray(G, float)
    tall = X.shape[0] > X.shape[1]
    X = X.T if tall else X
    X = X / (np.linalg.norm(X) + 1e-7)
    for _ in range(steps):
        A = X @ X.T
        X = a * X + (b * A + c * A @ A) @ X
    return X.T if tall else X

def ns_scalar(s, steps=5, abc=ABC):
    a, b, c = abc
    s = np.asarray(s, float)
    for _ in range(steps):
        s = a * s + b * s ** 3 + c * s ** 5
    return s

def singular_band(G, steps=5):
    s = np.linalg.svd(ns5(G, steps), compute_uv=False)
    return float(s.min()), float(s.max())`;

const MUON = `import numpy as np

def msign(G):
    U, s, Vt = np.linalg.svd(np.asarray(G, float), full_matrices=False)
    return U @ Vt

def gain(G, D):
    return float(np.sum(G * D) / np.linalg.norm(D, 2))

def muon_step(W, G, M, lr, beta=0.95):
    M = beta * M + G
    scale = max(1.0, W.shape[0] / W.shape[1]) ** 0.5
    return W - lr * scale * msign(M), M`;

export const lesson: LessonContent = {
  id: "m14.3.4",
  minutes: 45,
  links: {
    requires: ["m14.3.1", "m14.3.3", "m11.7.3"],
    revisits: ["m6.3.4"],
    foreshadows: ["m14.3.5"],
  },

  puzzle: (
    <>
      <p>
        Muon trains the hidden weight matrices of a transformer with an update that throws away every singular value of
        the momentum and keeps only its singular vectors. It has set speed records for training small language models.
        Throwing away magnitudes sounds reckless: why should the update for a direction with a large gradient be no larger
        than for one with a tiny gradient? The answer is a choice of norm, and it says something specific about linear
        layers.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A weight matrix W acts on inputs, and what matters is how much a change ΔW can alter the layer&apos;s outputs. The
        worst case over unit inputs is the spectral norm of ΔW. So ask for the update that lowers the loss most, to first
        order, among all ΔW of spectral norm at most η. Writing the gradient as <M>{"U\\Sigma V^\\top"}</M>, the answer is{" "}
        <M>{"-\\eta UV^\\top"}</M>: every singular direction of the gradient is used to the full, since leaving any of them
        below the limit wastes budget the norm allows. Following the raw gradient puts most of its length into the top
        direction, which the spectral norm then caps, so the rest is used timidly. Newton–Schulz iterations compute{" "}
        <M>{"UV^\\top"}</M> approximately with a few matrix products, which is what makes the idea cheap.
      </p>
      <SpectralStepViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Muon">
        <p>
          For a hidden weight matrix W of size m × n with gradient G, keep a momentum <M>{"M \\leftarrow \\beta M + G"}</M>,
          compute <M>{"O \\approx \\operatorname{msign}(M) = UV^\\top"}</M> for <M>{"M = U\\Sigma V^\\top"}</M> (thin SVD) by
          five quintic Newton–Schulz steps, and set{" "}
          <M>{"W \\leftarrow W - \\eta\\sqrt{\\max(1, m/n)}\\,O"}</M>. Embeddings, the output layer and vector parameters
          are usually left to AdamW.
        </p>
      </Definition>

      <Theorem title="steepest descent under the spectral norm">
        <p>
          For G = UΣVᵀ, <M>{"\\min_{\\|D\\|_2\\le 1}\\langle G, D\\rangle = -\\|G\\|_*"}</M>, the nuclear norm{" "}
          <M>{"\\sum_i\\sigma_i"}</M>, and the minimum is attained at <M>{"D = -UV^\\top"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\langle G, D\\rangle = \\operatorname{tr}(V\\Sigma U^\\top D) = \\sum_i\\sigma_i\\,u_i^\\top Dv_i"}</M>, and each{" "}
          <M>{"|u_i^\\top Dv_i| \\le \\|D\\|_2 \\le 1"}</M> because <M>{"u_i"}</M> and <M>{"v_i"}</M> are unit vectors. So{" "}
          <M>{"\\langle G, D\\rangle \\ge -\\sum\\sigma_i"}</M>. For <M>{"D = -UV^\\top"}</M>, which has spectral norm 1,{" "}
          <M>{"u_i^\\top Dv_i = -1"}</M> for every i, so the bound is attained. By comparison, D = −G/σ₁ achieves only{" "}
          <M>{"\\sum\\sigma_i^2/\\sigma_1"}</M>, which equals the nuclear norm only when all the nonzero σᵢ are equal.
        </p>
      </Proof>

      <Theorem title="why the spectral norm suits a linear layer">
        <p>
          For every input x, <M>{"\\|(W + \\Delta W)x - Wx\\| \\le \\|\\Delta W\\|_2\\,\\|x\\|"}</M>, with equality for x along the
          top right singular vector of ΔW. If inputs have entries of size about 1 (RMS norm 1, so ‖x‖ ≈ √n) and outputs are
          measured the same way, the induced norm is <M>{"\\sqrt{n/m}\\,\\|\\Delta W\\|_2"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first statement is the definition of the operator norm. For the second,{" "}
          <M>{"\\|\\Delta Wx\\|_{\\text{RMS}} = \\|\\Delta Wx\\|/\\sqrt m \\le \\|\\Delta W\\|_2\\|x\\|/\\sqrt m = \\sqrt{n/m}\\,\\|\\Delta W\\|_2\\|x\\|_{\\text{RMS}}"}</M>.
          So a fixed change in RMS outputs allows a spectral norm proportional to <M>{"\\sqrt{m/n}"}</M>, which is where
          Muon&apos;s factor comes from (implementations clip it below at 1). The steepest-descent update is therefore
          &quot;change every output direction by the same bounded amount&quot;, a statement about the layer&apos;s function
          rather than about its individual entries.
        </p>
        <Code>{MUON}</Code>
      </Proof>

      <Theorem title="Newton–Schulz computes msign approximately">
        <p>
          The iteration <M>{"X \\leftarrow aX + (bXX^\\top + c(XX^\\top)^2)X"}</M>, started from <M>{"G/\\|G\\|_F"}</M>, maps
          each singular value σ of the current X to <M>{"p(\\sigma) = a\\sigma + b\\sigma^3 + c\\sigma^5"}</M> and leaves the
          singular vectors unchanged. With Muon&apos;s coefficients (3.4445, −4.7750, 2.0315) five steps send every singular
          value from about <M>{"10^{-3}"}</M> to 1 into a band around [0.7, 1.2].
        </p>
      </Theorem>
      <Proof>
        <p>
          If X = UΣVᵀ then <M>{"XX^\\top = U\\Sigma^2U^\\top"}</M> and the update is{" "}
          <M>{"U(a\\Sigma + b\\Sigma^3 + c\\Sigma^5)V^\\top"}</M>. Dividing by the Frobenius norm puts every σ in (0, 1]. The
          coefficients are chosen for a steep slope at zero (a ≈ 3.4, so a small σ grows more than threefold per step) at
          the cost of not converging exactly to 1; the band is accurate enough for an update direction, and only matrix
          products are needed, which run well in bfloat16 on accelerators.
        </p>
        <Code>{NS}</Code>
      </Proof>

      <Remark title="where Muon sits">
        <p>
          Muon is Shampoo with its statistics replaced by the current momentum, and it is steepest descent in the spectral
          norm just as sign descent is steepest descent in the max norm. Neither ignores magnitude entirely: the step
          length η, and the momentum averaging, carry it. Its successes are on hidden matrices, where the spectral norm is
          the natural measure; for embeddings, whose inputs are one-hot, the right norm is different, which is the subject
          of the next lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "gd",
      rung: "check",
      prompt: <p>A gradient has singular values 5, 3 and 1. What first-order decrease per unit of spectral norm does the direction D = G give, Σσᵢ²/σ₁?</p>,
      answer: { kind: "numeric", value: 7, tolerance: 0.0001 },
    },
    {
      key: "scale",
      rung: "check",
      prompt: <p>Muon updates a 4096 × 1024 weight matrix. By what factor √max(1, m/n) does it scale the orthogonalised update?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "norm",
      rung: "apply",
      prompt: <p>Why is the spectral norm a natural way to measure an update to a linear layer&apos;s weight matrix?</p>,
      answer: {
        kind: "choice",
        options: [
          "It is the largest factor by which the update can change the layer's output, over all inputs of a given size",
          "It is the cheapest matrix norm to compute",
          "It equals the sum of the absolute values of the entries",
          "It is the only norm under which gradient descent converges",
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

ABC = (3.4445, -4.7750, 2.0315)

def ns5(G, steps=5, abc=ABC):
    a, b, c = abc
    X = np.asarray(G, float)
    tall = X.shape[0] > X.shape[1]
    X = X.T if tall else X
    X = X / (np.linalg.norm(X) + 1e-7)
    for _ in range(steps):
        A = X @ X.T
        X = a * X + (b * A + c * A @ A) @ X
    return X.T if tall else X

def ns_scalar(s, steps=5, abc=ABC):
    a, b, c = abc
    s = np.asarray(s, float)
    for _ in range(steps):
        s = a * s + b * s ** 3 + c * s ** 5
    return s

def singular_band(G, steps=5):
    s = np.linalg.svd(ns5(G, steps), compute_uv=False)
    return float(s.min()), float(s.max())

print(ns_scalar([0.01, 0.1, 1.0], 1).round(4), ns_scalar([0.01, 0.1, 1.0]).round(2))
G = np.diag([3.0, 1.0, 0.1])
print([round(v, 2) for v in singular_band(G)], np.allclose(ns5(G), np.diag(ns_scalar(np.diag(G) / np.linalg.norm(G)))))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0344 0.3397 0.701 ] [0.7  0.71 0.7 ]\n[0.75, 1.13] True",
          "[0.0344 0.3397 0.701 ] [1. 1. 1.]\n[1.0, 1.0] True",
          "[0.0344 0.3397 1.    ] [0.7  0.71 0.7 ]\n[0.75, 1.13] True",
          "[0.0344 0.3397 0.701 ] [0.7  0.71 0.7 ]\n[0.75, 1.13] False",
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

def msign(G):
    U, s, Vt = np.linalg.svd(np.asarray(G, float), full_matrices=False)
    return U @ Vt

def gain(G, D):
    return float(np.sum(G * D) / np.linalg.norm(D, 2))

def muon_step(W, G, M, lr, beta=0.95):
    M = beta * M + G
    scale = max(1.0, W.shape[0] / W.shape[1]) ** 0.5
    return W - lr * scale * msign(M), M

H = np.diag([3.0, 1.0, 0.1])
print(round(gain(H, H), 3), round(gain(H, np.sign(H)), 3), round(gain(H, msign(H)), 3))
W, M = muon_step(np.zeros((4, 2)), np.array([[2.0, 0.0], [0.0, 1.0], [0.0, 0.0], [0.0, 0.0]]), np.zeros((4, 2)), 0.1)
print(W.round(4).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3.337 4.1 4.1\n[[-0.1414, 0.0], [0.0, -0.1414], [0.0, 0.0], [0.0, 0.0]]",
          "4.1 3.337 4.1\n[[-0.1414, 0.0], [0.0, -0.1414], [0.0, 0.0], [0.0, 0.0]]",
          "3.337 4.1 4.1\n[[-0.1, 0.0], [0.0, -0.1], [0.0, 0.0], [0.0, 0.0]]",
          "3.337 3.337 4.1\n[[-0.2, 0.0], [0.0, -0.1], [0.0, 0.0], [0.0, 0.0]]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ns5(G, steps=5, abc=ABC)</C>: transpose a tall G, divide by its Frobenius norm plus 1e-7, apply the
          quintic iteration, and transpose back; <C>ns_scalar(s, steps=5, abc=ABC)</C>, the same map applied to scalars; and{" "}
          <C>singular_band(G, steps=5)</C>, the smallest and largest singular values of <C>ns5(G, steps)</C>. Here{" "}
          <C>ABC = (3.4445, -4.7750, 2.0315)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

ABC = (3.4445, -4.7750, 2.0315)

def ns5(G, steps=5, abc=ABC):
    return np.asarray(G, float) / np.linalg.norm(G)

def ns_scalar(s, steps=5, abc=ABC):
    return np.asarray(s, float)

def singular_band(G, steps=5):
    return 0.0, 0.0
`,
        solution: NS,
        tests: [
          { name: "scalar", code: `assert abs(float(ns_scalar(0.5, 1)) - 1.188859375) < 1e-12 and np.allclose(ns_scalar([0.01, 0.1, 1.0], 1), [0.0344, 0.3397, 0.701], atol=1e-4)
G = np.diag([3.0, 1.0, 0.1]); assert np.allclose(ns5(G), np.diag(ns_scalar(np.diag(G) / np.linalg.norm(G))), atol=1e-6)` },
          { name: "matrix", code: `rng = np.random.default_rng(0); G = rng.standard_normal((6, 4)); X = ns5(G); assert X.shape == (6, 4)
lo, hi = singular_band(G); assert abs(lo - 0.6840471785669842) < 1e-6 and abs(hi - 1.1249280494811498) < 1e-6 and np.allclose(singular_band(G.T), (lo, hi))
U, s, Vt = np.linalg.svd(G, full_matrices=False); assert np.all(np.diag(U.T @ X @ Vt.T) > 0.6)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>msign(G)</C>, the exact <C>UVᵀ</C> from a thin SVD; <C>gain(G, D)</C>, equal to{" "}
          <C>⟨G, D⟩/‖D‖₂</C>; and{" "}
          <C>muon_step(W, G, M, lr, beta=0.95)</C>, returning the new W and M.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def msign(G):
    return np.sign(G)

def gain(G, D):
    return float(np.sum(G * D))

def muon_step(W, G, M, lr, beta=0.95):
    return W - lr * G, M
`,
        solution: MUON,
        tests: [
          { name: "gain", code: `rng = np.random.default_rng(0); G = rng.standard_normal((6, 4)); s = np.linalg.svd(G, compute_uv=False)
assert abs(gain(G, msign(G)) - s.sum()) < 1e-9 and abs(gain(G, G) - np.sum(s ** 2) / s[0]) < 1e-9
for _ in range(20):
    assert gain(G, rng.standard_normal((6, 4))) <= s.sum() + 1e-9` },
          { name: "step", code: `W, M = muon_step(np.ones((2, 3)), np.array([[1.0, 0.0, 0.0], [0.0, 2.0, 0.0]]), np.zeros((2, 3)), 0.5, 0.9)
assert np.allclose(W, [[0.5, 1, 1], [1, 0.5, 1]]) and np.allclose(M, [[1, 0, 0], [0, 2, 0]])
W, M = muon_step(np.zeros((4, 2)), np.array([[2.0, 0.0], [0.0, 1.0], [0.0, 0.0], [0.0, 0.0]]), np.ones((4, 2)) * 0.0, 0.1); assert np.allclose(W, [[-0.2 / np.sqrt(2), 0], [0, -0.2 / np.sqrt(2)], [0, 0], [0, 0]])` },
        ],
      },
    },
    {
      key: "quintic",
      rung: "stretch",
      prompt: <p>One step of Muon&apos;s quintic p(σ) = 3.4445σ − 4.7750σ³ + 2.0315σ⁵ is applied to a singular value σ = 0.5. What is the result? Give two decimals.</p>,
      answer: { kind: "numeric", value: 1.19, tolerance: 0.006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Sign descent for some parameters, spectral steepest descent for others, AdamW for the rest: each layer gets its
        own norm. The last lesson of this chapter asks how to combine them into one norm on the whole network, so that a
        single learning rate means the same thing for every layer and transfers across widths.
      </p>
    </>
  ),
};
