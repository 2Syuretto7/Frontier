import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SoftmaxCEViz } from "@/components/viz/SoftmaxCEViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.4.4",
  minutes: 60,
  links: {
    requires: ["m5.2.3", "m5.4.1"],
    revisits: ["m5.3.4"],
    foreshadows: ["m5.4.5", "l3.2.2"],
  },

  puzzle: (
    <>
      <p>
        A classifier outputs logits z, turns them into probabilities with softmax, and is trained with cross-entropy. The
        softmax Jacobian is a full matrix, and the logarithm has a derivative that blows up near 0.
      </p>
      <p>Yet the gradient of the loss with respect to the logits is simply &ldquo;predicted minus true&rdquo;. Why so clean?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Cross-entropy of a softmax is <M>{"\\log\\sum_k e^{z_k} - z_y"}</M>: a log-sum-exp minus one logit. The gradient of
        log-sum-exp is softmax, and the gradient of <M>{"z_y"}</M> is the one-hot vector. The difference is{" "}
        <M>{"p - e_y"}</M>. The awkward pieces cancel before they are ever computed.
      </p>
      <SoftmaxCEViz />
      <p>
        That cancellation is also why libraries fuse the two into one function: computed separately, the softmax can underflow
        to 0 and the logarithm then returns infinity.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="log-sum-exp, softmax, cross-entropy">
        <p>For logits <M>{"z \\in \\mathbb R^K"}</M> and a true class y:</p>
        <MD>{"\\mathrm{lse}(z) = \\log \\sum_{k} e^{z_k}, \\qquad p = \\mathrm{softmax}(z), \\; p_i = e^{z_i - \\mathrm{lse}(z)}, \\qquad \\ell(z, y) = -\\log p_y = \\mathrm{lse}(z) - z_y."}</MD>
      </Definition>

      <Theorem title="gradients">
        <p>
          <M>{"\\nabla \\mathrm{lse}(z) = \\mathrm{softmax}(z)"}</M>, the Hessian of lse is{" "}
          <M>{"\\mathrm{diag}(p) - pp^\\top"}</M>, and
        </p>
        <MD>{"\\nabla_z\\, \\ell(z, y) = p - e_y."}</MD>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\partial\\,\\mathrm{lse}/\\partial z_i = e^{z_i}/\\sum_k e^{z_k} = p_i"}</M>. The Hessian is the Jacobian of
          softmax, computed in the Jacobian lesson. For the loss, <M>{"\\nabla(\\mathrm{lse}(z) - z_y) = p - e_y"}</M>.
        </p>
      </Proof>

      <Theorem title="stability: shift invariance">
        <p>
          For any constant c, <M>{"\\mathrm{lse}(z) = c + \\mathrm{lse}(z - c\\mathbf 1)"}</M> and{" "}
          <M>{"\\mathrm{softmax}(z) = \\mathrm{softmax}(z - c\\mathbf 1)"}</M>. Taking <M>{"c = \\max_k z_k"}</M> makes every
          exponent at most 0, so nothing overflows, and the largest term is 1, so the sum is at least 1 and its log is safe.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\sum_k e^{z_k} = e^c \\sum_k e^{z_k - c}"}</M>; take logs. Softmax divides numerator and denominator by the same{" "}
          <M>{"e^c"}</M>.
        </p>
      </Proof>

      <Example title="a batch">
        <p>
          For a batch of B examples, logits <M>{"Z \\in \\mathbb R^{B \\times K}"}</M>, labels y and mean loss{" "}
          <M>{"L = \\frac1B \\sum_b \\ell(Z_b, y_b)"}</M>, the gradient is <M>{"\\nabla_Z L = (P - Y)/B"}</M>, where P holds the
          softmax rows and Y the one-hot rows. Each row sums to 0.
        </p>
      </Example>

      <Remark title="log-softmax and temperature">
        <p>
          Libraries return log-probabilities, <M>{"z - \\mathrm{lse}(z)"}</M>, which are exact even when{" "}
          <M>{"p_i"}</M> would underflow. Dividing logits by a temperature T before softmax sharpens (T &lt; 1) or flattens (T
          &gt; 1) the distribution; lse with temperature approaches max as T → 0, which is why it is called a soft maximum.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "lse",
      rung: "check",
      prompt: <p>What is the gradient of <M>{"\\mathrm{lse}(z) = \\log\\sum_k e^{z_k}"}</M>?</p>,
      answer: { kind: "choice", options: ["softmax(z)", "exp(z)", "1 / lse(z)", "The one-hot vector of argmax z"], correct: [0] },
    },
    {
      key: "grad",
      rung: "check",
      prompt: (
        <p>
          Logits z = (0, 0) and the true class is the first. What is the first entry of <M>{"\\nabla_z \\ell"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: -0.5, tolerance: 1e-12 },
    },
    {
      key: "big",
      rung: "apply",
      prompt: <p>Compute <M>{"\\mathrm{lse}(1000, 1000)"}</M> to four decimal places.</p>,
      answer: { kind: "numeric", value: 1000 + Math.LN2, tolerance: 1e-4 },
    },
    {
      key: "shift",
      rung: "apply",
      prompt: <p>Adding 5 to every logit changes which of these?</p>,
      answer: {
        kind: "choice",
        options: ["lse(z), by exactly 5", "softmax(z)", "The cross-entropy loss", "The gradient p − e_y"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
z = np.array([1000.0, 999.0])
with np.errstate(all="ignore"):
    naive = np.exp(z) / np.exp(z).sum()
e = np.exp(z - z.max())
stable = e / e.sum()
print(naive, np.round(stable, 4))`}</Code>
          <p>Softmax with large logits, two ways. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[nan nan] [0.7311 0.2689]", "[1. 0.] [0.7311 0.2689]", "[inf inf] [0.5 0.5]", "[0.7311 0.2689] [0.7311 0.2689]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
Z = np.array([[0.0, 0.0, 0.0], [2.0, 0.0, 0.0]])
y = np.array([2, 0])
P = np.exp(Z) / np.exp(Z).sum(axis=1, keepdims=True)
G = P.copy()
G[np.arange(2), y] -= 1
G /= 2
print(G.shape, np.round(G[0], 3), np.abs(G.sum(axis=1)).max() < 1e-12)`}</Code>
          <p>The batch gradient of the mean cross-entropy. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(2, 3) [ 0.167  0.167 -0.333] True",
          "(2, 3) [ 0.333  0.333 -0.667] True",
          "(3, 2) [ 0.167  0.167 -0.333] True",
          "(2, 3) [ 0.167  0.167 -0.333] False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>logsumexp(z)</C>, stable for large and very negative logits; <C>log_softmax(z)</C>, returning{" "}
          <M>{"z - \\mathrm{lse}(z)"}</M>; and <C>cross_entropy(z, y)</C>, the loss for true class index y, computed from{" "}
          <C>log_softmax</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def logsumexp(z):
    return np.log(np.sum(np.exp(z)))

def log_softmax(z):
    return z

def cross_entropy(z, y):
    return 0.0
`,
        solution: `import numpy as np

def logsumexp(z):
    z = np.asarray(z, float)
    m = z.max()
    return m + np.log(np.sum(np.exp(z - m)))

def log_softmax(z):
    z = np.asarray(z, float)
    return z - logsumexp(z)

def cross_entropy(z, y):
    return -log_softmax(z)[y]
`,
        tests: [
          { name: "stability", code: `import numpy as np
assert abs(logsumexp([1000.0, 1000.0]) - (1000 + np.log(2))) < 1e-9, 'Subtract the maximum first.'
assert abs(logsumexp([-1000.0, -1000.0]) - (-1000 + np.log(2))) < 1e-9
assert np.isfinite(cross_entropy([0.0, 800.0], 0)) and abs(cross_entropy([0.0, 800.0], 0) - 800) < 1e-9` },
          { name: "values", code: `import numpy as np
z = np.array([2.0, 1.0, -1.0])
p = np.exp(z) / np.exp(z).sum()
assert np.allclose(np.exp(log_softmax(z)), p)
assert abs(cross_entropy(z, 1) + np.log(p[1])) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ce_batch(Z, ys)</C> for a batch of logits Z (B × K) and integer labels ys. Return the pair (mean
          cross-entropy, gradient with respect to Z), using <M>{"(P - Y)/B"}</M>. Make it stable: subtract each row&rsquo;s
          maximum.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ce_batch(Z, ys):
    return 0.0, np.zeros_like(Z)
`,
        solution: `import numpy as np

def ce_batch(Z, ys):
    Z = np.asarray(Z, float)
    ys = np.asarray(ys)
    B = Z.shape[0]
    S = Z - Z.max(axis=1, keepdims=True)
    logp = S - np.log(np.exp(S).sum(axis=1, keepdims=True))
    loss = -logp[np.arange(B), ys].mean()
    G = np.exp(logp)
    G[np.arange(B), ys] -= 1
    return loss, G / B
`,
        tests: [
          { name: "small batch", code: `import numpy as np
L, G = ce_batch([[0.0, 0.0, 0.0], [2.0, 0.0, 0.0]], [2, 0])
p0 = np.exp(2) / (np.exp(2) + 2)
assert abs(L - (np.log(3) - np.log(p0)) / 2) < 1e-12
assert G.shape == (2, 3) and np.allclose(G.sum(axis=1), 0)` },
          { name: "finite differences and stability", code: `import numpy as np
rng = np.random.default_rng(0)
Z, ys = rng.standard_normal((4, 5)), np.array([0, 3, 3, 1])
L, G = ce_batch(Z, ys)
E = np.zeros((4, 5)); E[2, 3] = 1e-6
assert abs(G[2, 3] - (ce_batch(Z + E, ys)[0] - ce_batch(Z - E, ys)[0]) / 2e-6) < 1e-6
L, G = ce_batch([[1000.0, 0.0]], [1])
assert abs(L - 1000) < 1e-9 and np.allclose(G, [[1.0, -1.0]])` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that the gradient of <M>{"\\ell(z, y) = -\\log \\mathrm{softmax}(z)_y"}</M> with respect to z is{" "}
          <M>{"p - e_y"}</M>, and that its entries sum to 0.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Rewrites ℓ = −z_y + log Σ_k e^{z_k} = lse(z) − z_y.",
          "Computes ∂ lse/∂z_i = e^{z_i}/Σ_k e^{z_k} = p_i.",
          "Notes ∂z_y/∂z_i = 1 if i = y and 0 otherwise, so ∇ℓ = p − e_y.",
          "Sums: Σ_i p_i − 1 = 0.",
        ],
      },
    },
    {
      key: "hess",
      rung: "stretch",
      prompt: (
        <p>
          The Hessian of lse is <M>{"\\mathrm{diag}(p) - pp^\\top"}</M>. With three classes and z = (0, 0, 0), what is its (1, 1)
          entry?
        </p>
      ),
      answer: { kind: "numeric", value: 2 / 9, tolerance: 1e-6 },
    },
  ],

  teachBack:
    "Explain to a friend why the gradient of softmax cross-entropy is predicted minus true, and why libraries compute it with log-sum-exp rather than softmax followed by log.",

  glimpse: (
    <p>
      The logits come from a matrix product. The last lesson of this chapter pushes gradients back through matrix products,
      with whole batches at once.
    </p>
  ),
};
