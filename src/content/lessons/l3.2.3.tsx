import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LayerShapesViz } from "@/components/viz/LayerShapesViz";
import type { LessonContent } from "@/lib/types";

const LAYER = `import numpy as np

def layer_forward(X, W, b, relu=True):
    Z = X @ W + b
    H = np.maximum(Z, 0) if relu else Z
    return H, (X, W, Z, relu)

def layer_backward(G, cache):
    X, W, Z, relu = cache
    D = G * (Z > 0) if relu else G
    return D @ W.T, X.T @ D, D.sum(axis=0)
`;

const MLP = `def mlp_grads(X, y, params):
    (W1, b1), (W2, b2) = params
    H, c1 = layer_forward(X, W1, b1)
    Z, c2 = layer_forward(H, W2, b2, relu=False)
    Z = Z - Z.max(axis=1, keepdims=True)
    logP = Z - np.log(np.exp(Z).sum(axis=1, keepdims=True))
    P = np.exp(logP)
    n = len(y)
    loss = -logP[np.arange(n), y].mean()
    G = P.copy()
    G[np.arange(n), y] -= 1
    dH, dW2, db2 = layer_backward(G / n, c2)
    _, dW1, db1 = layer_backward(dH, c1)
    return loss, [(dW1, db1), (dW2, db2)]
`;

export const lesson: LessonContent = {
  id: "l3.2.3",
  minutes: 55,
  links: {
    requires: ["l3.2.2", "m5.4.5"],
    revisits: ["m3.3.2"],
    parallels: ["e5.2.3"],
    foreshadows: ["l3.2.4", "l3.3.2"],
  },

  puzzle: (
    <>
      <p>
        The delta equations work unit by unit and example by example. A real layer has a thousand units and sees a batch of a
        hundred examples, and loops over them in Python would be hopelessly slow. Can the whole backward pass of a layer, for
        the whole batch, be written as a few matrix products, and which ones?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Stack the examples as rows. The deltas of a layer then form a matrix Δ with one row per example and one column per
        unit. Each weight&rsquo;s gradient sums input times delta over the batch, which is exactly a matrix product with the
        inputs transposed. Sending deltas back through the weights is a product with the weights transposed. Matching shapes
        leaves only one way to write each.
      </p>
      <LayerShapesViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="backpropagation through a dense layer">
        <p>
          Let <M>{"Z = XW + \\mathbf{1}b^\\top"}</M> and <M>{"H = \\sigma(Z)"}</M> for a batch <M>{"X"}</M> of shape{" "}
          <M>{"(N, d_{\\text{in}})"}</M>, and let <M>{"G = \\partial L/\\partial H"}</M>. Then
        </p>
        <MD>{"\\Delta = G \\odot \\sigma'(Z), \\qquad \\frac{\\partial L}{\\partial W} = X^\\top \\Delta, \\qquad \\frac{\\partial L}{\\partial b} = \\Delta^\\top \\mathbf{1}, \\qquad \\frac{\\partial L}{\\partial X} = \\Delta W^\\top."}</MD>
      </Theorem>
      <Proof>
        <p>
          Entrywise, <M>{"Z_{nj} = \\sum_i X_{ni}W_{ij} + b_j"}</M>, and <M>{"H_{nj}"}</M> depends only on{" "}
          <M>{"Z_{nj}"}</M>, so <M>{"\\Delta_{nj} = G_{nj}\\,\\sigma'(Z_{nj})"}</M>. A weight <M>{"W_{ij}"}</M> appears in{" "}
          <M>{"Z_{nj}"}</M> for every example n, with coefficient <M>{"X_{ni}"}</M>, so{" "}
          <M>{"\\partial L/\\partial W_{ij} = \\sum_n X_{ni}\\Delta_{nj} = (X^\\top\\Delta)_{ij}"}</M>. Likewise{" "}
          <M>{"\\partial L/\\partial b_j = \\sum_n \\Delta_{nj}"}</M>, and <M>{"X_{ni}"}</M> appears in every{" "}
          <M>{"Z_{nj}"}</M> with coefficient <M>{"W_{ij}"}</M>, giving{" "}
          <M>{"\\sum_j \\Delta_{nj}W_{ij} = (\\Delta W^\\top)_{ni}"}</M>.
        </p>
      </Proof>

      <Definition title="a layer in code">
        <p>The forward pass returns its output and a cache of what the backward pass will need.</p>
        <Code>{LAYER}</Code>
      </Definition>

      <Example title="a two-layer classifier">
        <p>
          With softmax cross-entropy averaged over the batch, the output delta is <M>{"(P - Y)/N"}</M>, where P holds the
          predicted probabilities and Y the one-hot targets. Two calls to the layer backward give everything else.
        </p>
        <Code>{MLP}</Code>
      </Example>

      <Remark title="sum or mean">
        <p>
          With a mean loss, every gradient is 1/N times the summed one. Using the mean keeps the gradient&rsquo;s scale, and so
          a good learning rate, roughly independent of the batch size.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "shape",
      rung: "check",
      prompt: <p>X has shape (N, d_in) and W shape (d_in, d_out). What is the shape of ∂L/∂W?</p>,
      answer: { kind: "choice", options: ["(d_in, d_out)", "(N, d_out)", "(N, d_in)", "(d_out, d_in)"], correct: [0] },
    },
    {
      key: "bias",
      rung: "check",
      prompt: <p>How is ∂L/∂b computed from Δ?</p>,
      answer: { kind: "choice", options: ["Sum Δ over the batch (its rows)", "Sum Δ over the units (its columns)", "Take Δ's first row", "Multiply Δ by W"], correct: [0] },
    },
    {
      key: "flops",
      rung: "apply",
      prompt: <p>A layer has N = 32, d_in = 64, d_out = 10. Each of the two backward matrix products costs 2·N·d_in·d_out floating-point operations. How many in total?</p>,
      answer: { kind: "numeric", value: 81920 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def layer_forward(X, W, b, relu=True):
    Z = X @ W + b
    H = np.maximum(Z, 0) if relu else Z
    return H, (X, W, Z, relu)

def layer_backward(G, cache):
    X, W, Z, relu = cache
    D = G * (Z > 0) if relu else G
    return D @ W.T, X.T @ D, D.sum(axis=0)

X = np.array([[1.0, -1.0], [2.0, 0.5]])
W = np.array([[1.0, -1.0, 0.5], [0.5, 2.0, -1.0]])
b = np.array([0.0, 0.5, 0.0])
H, cache = layer_forward(X, W, b)
dX, dW, db = layer_backward(np.ones_like(H), cache)
print(H.tolist(), dW.tolist(), db.tolist())`}</Code>
          <p>A ReLU layer with an incoming gradient of ones. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.5, 0.0, 1.5], [2.25, 0.0, 0.5]] [[3.0, 0.0, 3.0], [-0.5, 0.0, -0.5]] [2.0, 0.0, 2.0]",
          "[[0.5, -2.5, 1.5], [2.25, -0.5, 0.5]] [[3.0, 3.0, 3.0], [-0.5, -0.5, -0.5]] [2.0, 2.0, 2.0]",
          "[[0.5, 0.0, 1.5], [2.25, 0.0, 0.5]] [[3.0, -0.5], [0.0, 0.0], [3.0, -0.5]] [2.0, 0.0, 2.0]",
          "[[0.5, 0.0, 1.5], [2.25, 0.0, 0.5]] [[3.0, 0.0, 3.0], [-0.5, 0.0, -0.5]] [1.0, 0.0, 1.0]",
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

def layer_forward(X, W, b, relu=True):
    Z = X @ W + b
    H = np.maximum(Z, 0) if relu else Z
    return H, (X, W, Z, relu)

def layer_backward(G, cache):
    X, W, Z, relu = cache
    D = G * (Z > 0) if relu else G
    return D @ W.T, X.T @ D, D.sum(axis=0)

rng = np.random.default_rng(0)
X = rng.normal(size=(8, 3)); W = rng.normal(size=(3, 2)); b = np.zeros(2)
H, cache = layer_forward(X, W, b, relu=False)
G = rng.normal(size=(8, 2))
_, dW_sum, _ = layer_backward(G, cache)
_, dW_mean, _ = layer_backward(G / 8, cache)
print(np.allclose(dW_sum, 8 * dW_mean), dW_sum.shape)`}</Code>
          <p>A summed and an averaged gradient. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True (3, 2)", "False (3, 2)", "True (8, 2)", "True (2, 3)"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>layer_forward(X, W, b, relu=True)</C>, returning H and a cache (X, W, Z, relu), and{" "}
          <C>layer_backward(G, cache)</C>, returning (∂L/∂X, ∂L/∂W, ∂L/∂b) for the incoming gradient G = ∂L/∂H. Use 0 as
          ReLU&rsquo;s derivative at 0.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def layer_forward(X, W, b, relu=True):
    return X @ W + b, None

def layer_backward(G, cache):
    return None, None, None
`,
        solution: LAYER,
        tests: [
          { name: "shapes and values", code: `X = np.array([[1.0, -1.0], [2.0, 0.5]])
W = np.array([[1.0, -1.0, 0.5], [0.5, 2.0, -1.0]])
H, c = layer_forward(X, W, np.array([0.0, 0.5, 0.0]))
dX, dW, db = layer_backward(np.ones_like(H), c)
assert dX.shape == (2, 2) and dW.shape == (2, 3) and db.shape == (3,)
assert dW.tolist() == [[3.0, 0.0, 3.0], [-0.5, 0.0, -0.5]] and dX.tolist() == [[1.5, -0.5], [1.5, -0.5]]` },
          { name: "finite differences", code: `rng = np.random.default_rng(1)
X, W, b, R = rng.normal(size=(5, 4)), rng.normal(size=(4, 3)), rng.normal(size=3), rng.normal(size=(5, 3))
for relu in (True, False):
    f = lambda X, W, b: (layer_forward(X, W, b, relu)[0] * R).sum()
    H, c = layer_forward(X, W, b, relu)
    dX, dW, db = layer_backward(R, c)
    h = 1e-6
    E = np.zeros_like(W); E[2, 1] = h
    assert abs((f(X, W + E, b) - f(X, W - E, b)) / (2 * h) - dW[2, 1]) < 1e-6
    E = np.zeros_like(X); E[3, 0] = h
    assert abs((f(X + E, W, b) - f(X - E, W, b)) / (2 * h) - dX[3, 0]) < 1e-6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With the layer functions defined, write <C>mlp_grads(X, y, params)</C> for params [(W1, b1), (W2, b2)]: a ReLU hidden
          layer, a linear output layer, and stable softmax cross-entropy averaged over the batch with integer targets y.
          Return (loss, [(dW1, db1), (dW2, db2)]).
        </p>
      ),
      answer: {
        kind: "code",
        setup: LAYER,
        starter: `# layer_forward and layer_backward are already defined.

def mlp_grads(X, y, params):
    return 0.0, params
`,
        solution: MLP,
        tests: [
          { name: "against finite differences", code: `rng = np.random.default_rng(2)
X = rng.normal(size=(6, 4)); y = np.array([0, 2, 1, 2, 0, 1])
params = [(rng.normal(size=(4, 5)), rng.normal(size=5)), (rng.normal(size=(5, 3)), rng.normal(size=3))]
loss, grads = mlp_grads(X, y, params)
def L(ps):
    H = np.maximum(X @ ps[0][0] + ps[0][1], 0)
    Z = H @ ps[1][0] + ps[1][1]
    Z = Z - Z.max(axis=1, keepdims=True)
    return np.mean(np.log(np.exp(Z).sum(axis=1)) - Z[np.arange(6), y])
assert abs(loss - L(params)) < 1e-12
h = 1e-6
for li in range(2):
    for pi in range(2):
        p = params[li][pi]
        idx = tuple(0 for _ in p.shape)
        up = [[a.copy() for a in q] for q in params]; up[li][pi][idx] += h
        dn = [[a.copy() for a in q] for q in params]; dn[li][pi][idx] -= h
        assert abs((L(up) - L(dn)) / (2 * h) - grads[li][pi][idx]) < 1e-6, (li, pi)` },
          { name: "large logits", code: `X = np.array([[100.0, -100.0]])
params = [(np.eye(2) * 10, np.zeros(2)), (np.array([[1.0, -1.0], [0.0, 0.0]]), np.zeros(2))]
loss, grads = mlp_grads(X, np.array([1]), params)
assert np.isfinite(loss) and abs(loss - 2000.0) < 1e-6
assert all(np.all(np.isfinite(g)) for pair in grads for g in pair)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>For Z = XW + 1bᵀ and Δ = ∂L/∂Z, prove that ∂L/∂W = XᵀΔ and ∂L/∂X = ΔWᵀ.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes Z_nj = Σ_i X_ni W_ij + b_j and the partial derivatives ∂Z_nj/∂W_ij = X_ni and ∂Z_nj/∂X_ni = W_ij.",
          "Applies the chain rule summing over all entries of Z that depend on the variable: ∂L/∂W_ij = Σ_n X_ni Δ_nj and ∂L/∂X_ni = Σ_j Δ_nj W_ij.",
          "Recognises these sums as entries of XᵀΔ and ΔWᵀ.",
        ],
      },
    },
    {
      key: "memory",
      rung: "stretch",
      prompt: <p>A batch of 64 passes through 4 layers of width 1024, and every layer&rsquo;s float32 activations are kept for the backward pass. How many bytes is that?</p>,
      answer: { kind: "numeric", value: 1048576 },
    },
  ],

  teachBack:
    "Explain to a friend how the backward pass of a dense layer becomes three matrix products, and how the shapes tell you which ones.",

  glimpse: (
    <p>
      Hand-derived gradients are easy to get subtly wrong. Next: checking them against finite differences, and reading what
      the check says.
    </p>
  ),
};
