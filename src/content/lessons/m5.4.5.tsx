import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ShapeMatchViz } from "@/components/viz/ShapeMatchViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.4.5",
  minutes: 65,
  links: {
    requires: ["m5.4.1", "m5.4.4", "m5.3.4"],
    revisits: ["m5.3.5"],
    foreshadows: ["l3.2.3", "e5.1.1"],
  },

  puzzle: (
    <>
      <p>
        A linear layer computes Y = XW for a whole batch at once: X has one row per example. The loss is a single number. You
        need its gradient with respect to W, to update the weights, and with respect to X, to keep backpropagating.
      </p>
      <p>Both are matrix products. Which ones, and can you find them without ever writing an index?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        The gradient with respect to a matrix has the same shape as that matrix, and it is linear in the upstream gradient dY.
        For a product, that pins the answer down: there is usually only one way to multiply dY by the other factor, perhaps
        transposed, that produces the right shape.
      </p>
      <ShapeMatchViz />
      <p>
        Shape matching is a mnemonic, not a proof. The proof is two lines with the trace trick, and it also shows that a
        backward pass through a matrix product costs two matrix products, twice the forward pass.
      </p>
    </>
  ),

  theory: (
    <>
      <Theorem title="backpropagation through a matrix product">
        <p>
          Let Y = XW with <M>{"X \\in \\mathbb R^{B \\times n}"}</M>, <M>{"W \\in \\mathbb R^{n \\times m}"}</M>, and let L be a
          scalar with <M>{"\\bar Y = \\nabla_Y L"}</M>. Then
        </p>
        <MD>{"\\nabla_W L = X^\\top \\bar Y, \\qquad \\nabla_X L = \\bar Y W^\\top."}</MD>
        <p>
          For Y = XW + <M>{"\\mathbf 1 b^\\top"}</M> (a bias added to every row),{" "}
          <M>{"\\nabla_b L = \\bar Y^\\top \\mathbf 1"}</M>, the column sums of <M>{"\\bar Y"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"dL = \\mathrm{tr}(\\bar Y^\\top dY)"}</M> and <M>{"dY = dX\\,W + X\\,dW"}</M>. So
        </p>
        <MD>{"dL = \\mathrm{tr}(\\bar Y^\\top dX\\, W) + \\mathrm{tr}(\\bar Y^\\top X\\, dW) = \\mathrm{tr}\\big((\\bar Y W^\\top)^\\top dX\\big) + \\mathrm{tr}\\big((X^\\top \\bar Y)^\\top dW\\big),"}</MD>
        <p>
          using <M>{"\\mathrm{tr}(AB) = \\mathrm{tr}(BA)"}</M> to move W to the front of the first trace. Read off the
          gradients. For the bias, <M>{"dY = \\mathbf 1\\, db^\\top"}</M> gives{" "}
          <M>{"dL = \\mathrm{tr}(\\bar Y^\\top \\mathbf 1\\, db^\\top) = (\\bar Y^\\top \\mathbf 1)^\\top db"}</M>.
        </p>
      </Proof>

      <Example title="a two-layer classifier">
        <p>
          <M>{"H = \\mathrm{relu}(XW_1)"}</M>, <M>{"Z = HW_2"}</M>, mean cross-entropy L. Backwards:{" "}
          <M>{"\\bar Z = (P - Y)/B"}</M>; <M>{"\\nabla_{W_2} L = H^\\top \\bar Z"}</M>; <M>{"\\bar H = \\bar Z W_2^\\top"}</M>;
          relu passes the gradient where its input was positive, <M>{"\\bar A = \\bar H \\odot [XW_1 > 0]"}</M>; and{" "}
          <M>{"\\nabla_{W_1} L = X^\\top \\bar A"}</M>. Every step is a rule from this chapter.
        </p>
      </Example>

      <Example title="attention scores">
        <p>
          For <M>{"S = QK^\\top"}</M>, the same argument gives <M>{"\\nabla_Q L = \\bar S K"}</M> and{" "}
          <M>{"\\nabla_K L = \\bar S^\\top Q"}</M>.
        </p>
      </Example>

      <Remark title="cost">
        <p>
          The forward product costs about 2Bnm floating-point operations. The backward pass computes two products of the same
          size, so about 4Bnm. That is the source of the rule of thumb that training costs about three times the forward pass.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "shape",
      rung: "check",
      prompt: <p>Y = XW with X of shape 32 × 100 and W of shape 100 × 10. What shape is <M>{"\\nabla_W L"}</M>?</p>,
      answer: { kind: "choice", options: ["100 × 10", "32 × 10", "10 × 100", "32 × 100"], correct: [0] },
    },
    {
      key: "dx",
      rung: "check",
      prompt: <p>For Y = XW, which expression is <M>{"\\nabla_X L"}</M>, writing dY for <M>{"\\nabla_Y L"}</M>?</p>,
      answer: { kind: "choice", options: ["dY Wᵀ", "Wᵀ dY", "dY W", "Xᵀ dY"], correct: [0] },
    },
    {
      key: "bias",
      rung: "apply",
      prompt: (
        <p>
          A bias b is added to every row of a batch output. If <M>{"\\nabla_Y L = \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}"}</M>,
          what is the first entry of <M>{"\\nabla_b L"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "dw",
      rung: "apply",
      prompt: (
        <p>
          A batch of one: X = (1, 2) as a 1 × 2 matrix, and <M>{"\\nabla_Y L"}</M> = (1, 1, 1) as a 1 × 3 matrix. What is the
          (2, 1) entry of <M>{"\\nabla_W L"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
X = np.array([[1.0, 0.0, 2.0], [0.0, 1.0, 1.0]])
W = np.ones((3, 2))
dY = np.array([[1.0, -1.0], [2.0, 0.0]])
dW = X.T @ dY
dX = dY @ W.T
print(dW.shape, dW[2], dX[0])`}</Code>
          <p>The backward pass of a linear layer. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["(3, 2) [ 4. -2.] [0. 0. 0.]", "(3, 2) [ 4. -2.] [1. 1. 1.]", "(2, 3) [ 4. -2.] [0. 0. 0.]", "(3, 2) [2. 0.] [0. 0. 0.]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
Q = np.ones((4, 8))
K = np.ones((6, 8))
dS = np.ones((4, 6))
dQ = dS @ K
dK = dS.T @ Q
print(dQ.shape, dK.shape, dQ[0, 0], dK[0, 0])`}</Code>
          <p>Gradients of attention scores S = QKᵀ. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["(4, 8) (6, 8) 6.0 4.0", "(4, 8) (6, 8) 4.0 6.0", "(8, 4) (8, 6) 6.0 4.0", "(4, 8) (6, 8) 8.0 8.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>linear_forward(X, W, b)</C>, returning XW + b with b added to every row, and{" "}
          <C>linear_backward(X, W, dY)</C>, returning the triple (dX, dW, db) of gradients of the loss, given dY.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def linear_forward(X, W, b):
    return X @ W

def linear_backward(X, W, dY):
    return dY, dY, dY
`,
        solution: `import numpy as np

def linear_forward(X, W, b):
    return np.asarray(X, float) @ np.asarray(W, float) + np.asarray(b, float)

def linear_backward(X, W, dY):
    X, W, dY = np.asarray(X, float), np.asarray(W, float), np.asarray(dY, float)
    return dY @ W.T, X.T @ dY, dY.sum(axis=0)
`,
        tests: [
          { name: "shapes", code: `import numpy as np
X, W, b = np.ones((5, 3)), np.ones((3, 2)), np.array([1.0, -1.0])
Y = linear_forward(X, W, b)
assert Y.shape == (5, 2) and np.allclose(Y[0], [4.0, 2.0])
dX, dW, db = linear_backward(X, W, np.ones((5, 2)))
assert dX.shape == (5, 3) and dW.shape == (3, 2) and db.shape == (2,)
assert np.allclose(db, [5.0, 5.0]), 'The bias gradient sums over the batch.'` },
          { name: "finite differences", code: `import numpy as np
rng = np.random.default_rng(0)
X, W, b, T = rng.standard_normal((4, 3)), rng.standard_normal((3, 2)), rng.standard_normal(2), rng.standard_normal((4, 2))
L = lambda X, W, b: 0.5 * np.sum((linear_forward(X, W, b) - T) ** 2)
dX, dW, db = linear_backward(X, W, linear_forward(X, W, b) - T)
E = np.zeros((3, 2)); E[1, 0] = 1e-6
assert abs(dW[1, 0] - (L(X, W + E, b) - L(X, W - E, b)) / 2e-6) < 1e-6
F = np.zeros((4, 3)); F[2, 2] = 1e-6
assert abs(dX[2, 2] - (L(X + F, W, b) - L(X - F, W, b)) / 2e-6) < 1e-6
e = np.array([0.0, 1e-6])
assert abs(db[1] - (L(X, W, b + e) - L(X, W, b - e)) / 2e-6) < 1e-6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>train_step(X, ys, W1, W2, lr)</C> for the two-layer classifier <M>{"H = \\mathrm{relu}(XW_1)"}</M>,{" "}
          <M>{"Z = HW_2"}</M>, with mean softmax cross-entropy over the batch and integer labels ys. Do the forward pass, the
          backward pass from the lesson, and one gradient-descent step. Return (loss before the step, new W1, new W2).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def train_step(X, ys, W1, W2, lr):
    return 0.0, W1, W2
`,
        solution: `import numpy as np

def train_step(X, ys, W1, W2, lr):
    B = X.shape[0]
    A = X @ W1
    H = np.maximum(A, 0)
    Z = H @ W2
    S = Z - Z.max(axis=1, keepdims=True)
    logp = S - np.log(np.exp(S).sum(axis=1, keepdims=True))
    loss = -logp[np.arange(B), ys].mean()
    dZ = np.exp(logp)
    dZ[np.arange(B), ys] -= 1
    dZ /= B
    dW2 = H.T @ dZ
    dA = (dZ @ W2.T) * (A > 0)
    dW1 = X.T @ dA
    return loss, W1 - lr * dW1, W2 - lr * dW2
`,
        tests: [
          { name: "gradient is correct", code: `import numpy as np
rng = np.random.default_rng(0)
X, ys = rng.standard_normal((6, 3)), np.array([0, 1, 2, 1, 0, 2])
W1, W2 = rng.standard_normal((3, 5)), rng.standard_normal((5, 3))
def loss(W1, W2):
    return train_step(X, ys, W1, W2, 0.0)[0]
_, V1, V2 = train_step(X, ys, W1, W2, 1.0)
E = np.zeros((3, 5)); E[1, 2] = 1e-6
assert abs((W1 - V1)[1, 2] - (loss(W1 + E, W2) - loss(W1 - E, W2)) / 2e-6) < 1e-6
F = np.zeros((5, 3)); F[4, 0] = 1e-6
assert abs((W2 - V2)[4, 0] - (loss(W1, W2 + F) - loss(W1, W2 - F)) / 2e-6) < 1e-6` },
          { name: "training lowers the loss", code: `import numpy as np
rng = np.random.default_rng(1)
X = rng.standard_normal((40, 2))
ys = (X[:, 0] + X[:, 1] > 0).astype(int)
W1, W2 = 0.5 * rng.standard_normal((2, 16)), 0.5 * rng.standard_normal((16, 2))
first = None
for _ in range(200):
    L, W1, W2 = train_step(X, ys, W1, W2, 0.5)
    first = L if first is None else first
assert L < 0.5 * first, (first, L)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that for Y = XW and a scalar loss L with <M>{"\\bar Y = \\nabla_Y L"}</M>,{" "}
          <M>{"\\nabla_W L = X^\\top \\bar Y"}</M> and <M>{"\\nabla_X L = \\bar Y W^\\top"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes dL = tr(Ȳᵀ dY) and dY = dX W + X dW by the product rule.",
          "For W: rewrites tr(Ȳᵀ X dW) = tr((XᵀȲ)ᵀ dW) and reads off XᵀȲ.",
          "For X: cycles tr(Ȳᵀ dX W) = tr(W Ȳᵀ dX) = tr((ȲWᵀ)ᵀ dX) and reads off ȲWᵀ.",
          "(Alternatively, an index computation ∂L/∂W_jk = Σ_b X_bj Ȳ_bk is complete.)",
        ],
      },
    },
    {
      key: "flops",
      rung: "stretch",
      prompt: (
        <p>
          The forward product XW of a layer costs 1 GFLOP. How many GFLOP does its backward pass cost, computing both{" "}
          <M>{"\\nabla_X L"}</M> and <M>{"\\nabla_W L"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 2 },
    },
  ],

  teachBack:
    "Explain to a friend how to get the gradients of Y = XW with respect to X and W, both by matching shapes and by the trace trick, and why the backward pass costs twice the forward.",

  glimpse: (
    <p>
      Gradients describe slopes. To tell a minimum from a saddle, and to understand how fast optimisers converge, we need
      curvature: second derivatives and the Hessian, in chapter 5.
    </p>
  ),
};
