import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ZLossViz } from "@/components/viz/ZLossViz";
import type { LessonContent } from "@/lib/types";

const ZLOSS = `import numpy as np

def logsumexp(z):
    z = np.asarray(z, float)
    m = z.max()
    return float(m + np.log(np.exp(z - m).sum()))

def ce_zloss(z, y, alpha):
    lse = logsumexp(z)
    return lse - float(z[y]) + alpha * lse * lse

def ce_zloss_grad(z, y, alpha):
    z = np.asarray(z, float)
    lse = logsumexp(z)
    p = np.exp(z - lse)
    g = p.copy()
    g[y] -= 1.0
    return g + 2 * alpha * lse * p`;

const ATTN = `import numpy as np

def softmax_jac(z):
    z = np.asarray(z, float)
    p = np.exp(z - z.max())
    p /= p.sum()
    return np.diag(p) - np.outer(p, p)

def attn_logits(Q, K):
    Q, K = np.asarray(Q, float), np.asarray(K, float)
    return Q @ K.T / np.sqrt(Q.shape[1])

def rms_norm(X, g):
    X = np.asarray(X, float)
    return g * X / np.sqrt(np.mean(X * X, axis=1, keepdims=True))`;

export const lesson: LessonContent = {
  id: "m14.6.3",
  minutes: 40,
  links: {
    requires: ["m14.6.2", "m5.4.4", "l5.2.1"],
    revisits: ["m11.2.3"],
    foreshadows: ["m14.6.4"],
  },

  puzzle: (
    <>
      <p>
        The PaLM language models were trained with an extra loss term, <M>{"10^{-4}(\\log Z)^2"}</M>, where Z is the
        softmax normaliser of the output layer. Adding the same constant to every logit changes neither the
        probabilities nor the cross-entropy, so this term seems to constrain something the model does not care about.
        Yet removing it made large runs less stable. What does it pin down, and why does that matter?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Softmax ignores the common level of the logits, so the cross-entropy gives no gradient along that direction. Any
        force that pushes the level, such as Adam&apos;s per-coordinate rescaling, the bias of the output layer or noise,
        meets no resistance, and the logits can drift to large values. On separable data the cross-entropy also keeps
        asking for larger margins, so the logits spread out as well. Large logits are harmful in two ways. In low-precision
        arithmetic their differences lose resolution. And a softmax whose logits are far apart is nearly one-hot, where its
        gradient almost vanishes, so a unit that saturates stops learning. z-loss uses the free direction to hold log Z at
        zero, costing nothing in cross-entropy. In attention the same saturation happens when query–key products grow,
        and normalising queries and keys bounds them.
      </p>
      <ZLossViz />
    </>
  ),

  theory: (
    <>
      <Definition title="log-partition and z-loss">
        <p>
          For logits <M>{"z \\in \\mathbb R^C"}</M> let <M>{"\\log Z(z) = \\log\\sum_ce^{z_c}"}</M>, so the softmax is{" "}
          <M>{"p_c = e^{z_c - \\log Z}"}</M> and the cross-entropy for label y is <M>{"\\log Z - z_y"}</M>. The{" "}
          <em>z-loss</em> with weight α adds <M>{"\\alpha(\\log Z)^2"}</M>. Its gradient with respect to z is{" "}
          <M>{"p - e_y + 2\\alpha\\log Z\\cdot p"}</M>.
        </p>
        <Code>{ZLOSS}</Code>
      </Definition>

      <Theorem title="z-loss acts only along the free direction">
        <p>
          Cross-entropy is unchanged by <M>{"z \\mapsto z + c\\mathbf 1"}</M>, and its gradient has components summing to
          zero. For fixed z, the total loss <M>{"\\mathrm{CE}(z + c\\mathbf 1) + \\alpha(\\log Z(z + c\\mathbf 1))^2"}</M> is
          minimised over c at <M>{"c = -\\log Z(z)"}</M>, where it equals <M>{"\\mathrm{CE}(z)"}</M>. The components of the
          z-loss gradient sum to <M>{"2\\alpha\\log Z"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\log Z(z + c\\mathbf 1) = \\log Z(z) + c"}</M> and <M>{"(z + c\\mathbf 1)_y = z_y + c"}</M>, so the
          cross-entropy is unchanged. Its gradient <M>{"p - e_y"}</M> sums to 1 − 1 = 0. The total is therefore{" "}
          <M>{"\\mathrm{CE}(z) + \\alpha(\\log Z(z) + c)^2"}</M>, minimised where the square vanishes. The z-loss gradient{" "}
          <M>{"2\\alpha\\log Z\\cdot p"}</M> sums to <M>{"2\\alpha\\log Z"}</M> because p sums to 1. So the z-loss is the
          only force along <M>{"\\mathbf 1"}</M>, and it pushes log Z towards zero.
        </p>
      </Proof>

      <Theorem title="separable data asks for unbounded logits">
        <p>
          Suppose a linear classifier <M>{"z = Wx"}</M> can classify every training point correctly with positive margin.
          Then the mean cross-entropy is positive for every W but has infimum 0, so every sequence of weights whose loss
          tends to 0 has <M>{"\\|W\\| \\to \\infty"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each term <M>{"\\log Z - z_y = -\\log p_y"}</M> is positive because <M>{"p_y < 1"}</M> for finite logits. If U
          classifies every point with margin at least γ &gt; 0, meaning <M>{"z_y - z_c \\ge \\gamma"}</M> for every wrong
          class c, then with W = sU each term is at most <M>{"\\log(1 + (C-1)e^{-s\\gamma})"}</M>, which tends to 0 as
          s → ∞. On any bounded set of W the loss is continuous and positive, so it has a positive minimum there; hence a
          sequence with loss tending to 0 must leave every bounded set.
        </p>
      </Proof>

      <Theorem title="saturated softmaxes pass almost no gradient">
        <p>
          The Jacobian of the softmax is <M>{"J = \\mathrm{diag}(p) - pp^\\top"}</M>. It is positive semidefinite, and its
          largest eigenvalue is at most <M>{"\\mathrm{tr}\\,J = 1 - \\sum_cp_c^2 \\le 2(1 - p_{\\max})"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Differentiating <M>{"p_c = e^{z_c}/Z"}</M> gives <M>{"\\partial p_c/\\partial z_d = p_c(\\delta_{cd} - p_d)"}</M>.
          For any u, <M>{"u^\\top Ju = \\sum_cp_cu_c^2 - (\\sum_cp_cu_c)^2"}</M>, a variance under p, hence non-negative.
          A positive semidefinite matrix has eigenvalues at most its trace, <M>{"\\sum_c p_c - \\sum_c p_c^2"}</M>. Finally{" "}
          <M>{"\\sum_cp_c^2 \\ge p_{\\max}^2"}</M> and <M>{"1 - p_{\\max}^2 = (1-p_{\\max})(1+p_{\\max}) \\le 2(1-p_{\\max})"}</M>.
          So as one probability approaches 1, every gradient that flows through the softmax shrinks to zero.
        </p>
      </Proof>

      <Remark title="attention logit growth">
        <p>
          An attention weight is a softmax over <M>{"q^\\top k_j/\\sqrt d"}</M>. If the query and key projections grow
          during training, these logits grow with the product of their norms, the attention becomes nearly one-hot, its
          entropy collapses, and by the theorem above the gradients that could undo this vanish. Wortsman and co-authors
          reproduced this instability in small models by raising the learning rate, and found it is removed by{" "}
          <em>QK-layernorm</em>: normalise q and k before the dot product.
        </p>
      </Remark>

      <Theorem title="normalised queries and keys bound the logits">
        <p>
          If <M>{"q, k \\in \\mathbb R^d"}</M> are scaled to root-mean-square <M>{"g_q"}</M> and <M>{"g_k"}</M>, then{" "}
          <M>{"|q^\\top k|/\\sqrt d \\le \\sqrt d\\,g_qg_k"}</M>, whatever the weights that produced them.
        </p>
      </Theorem>
      <Proof>
        <p>
          Root-mean-square g means <M>{"\\|q\\| = \\sqrt d\\,g_q"}</M>, and likewise for k. By the Cauchy–Schwarz inequality{" "}
          <M>{"|q^\\top k| \\le \\|q\\|\\|k\\| = d\\,g_qg_k"}</M>; divide by <M>{"\\sqrt d"}</M>. The logits can still grow
          through the learned gains, but only as fast as those few parameters are allowed to move.
        </p>
        <Code>{ATTN}</Code>
      </Proof>
    </>
  ),

  practice: [
    {
      key: "zl",
      rung: "check",
      prompt: <p>The logits of one example are (3, 1, 1). What is <M>{"\\log Z"}</M>? Give three decimals.</p>,
      answer: { kind: "numeric", value: 3.240, tolerance: 0.0006 },
    },
    {
      key: "trace",
      rung: "check",
      prompt: <p>A softmax outputs probabilities (0.9, 0.05, 0.05). What is the trace of its Jacobian?</p>,
      answer: { kind: "numeric", value: 0.185, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why can z-loss be added to a language model without changing which predictions minimise the cross-entropy?</p>,
      answer: {
        kind: "choice",
        options: [
          "Adding a constant to all logits leaves the cross-entropy unchanged, and that constant can always be chosen to make log Z zero",
          "z-loss is so small that it never affects the gradients",
          "z-loss is applied only at evaluation time",
          "z-loss rescales all logits by the same factor, which does not change the argmax",
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

def logsumexp(z):
    z = np.asarray(z, float)
    m = z.max()
    return float(m + np.log(np.exp(z - m).sum()))

def ce_zloss(z, y, alpha):
    lse = logsumexp(z)
    return lse - float(z[y]) + alpha * lse * lse

def ce_zloss_grad(z, y, alpha):
    z = np.asarray(z, float)
    lse = logsumexp(z)
    p = np.exp(z - lse)
    g = p.copy()
    g[y] -= 1.0
    return g + 2 * alpha * lse * p

z = np.array([2.0, 1.0, 0.0]); print(round(logsumexp(z), 4), round(logsumexp(z + 100), 4))
print(round(ce_zloss(z, 0, 0.0), 4), round(ce_zloss(z - logsumexp(z), 0, 0.1), 4), round(float(ce_zloss_grad(z, 0, 0.1).sum()), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.4076 102.4076\n0.4076 0.4076 0.4815",
          "2.4076 inf\n0.4076 0.4076 0.4815",
          "2.4076 102.4076\n0.4076 0.9873 0.4815",
          "2.4076 102.4076\n0.4076 0.4076 0.0",
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

def softmax_jac(z):
    z = np.asarray(z, float)
    p = np.exp(z - z.max())
    p /= p.sum()
    return np.diag(p) - np.outer(p, p)

def attn_logits(Q, K):
    Q, K = np.asarray(Q, float), np.asarray(K, float)
    return Q @ K.T / np.sqrt(Q.shape[1])

def rms_norm(X, g):
    X = np.asarray(X, float)
    return g * X / np.sqrt(np.mean(X * X, axis=1, keepdims=True))

J = softmax_jac(np.array([0.0, 0.0])); print(J.round(3).tolist(), round(float(np.trace(softmax_jac(np.array([10.0, 0.0, 0.0])))), 5))
Q = np.array([[3.0, 4.0]]); K = np.array([[6.0, 8.0], [1.0, 0.0]]); print(attn_logits(Q, K).round(3).tolist(), attn_logits(rms_norm(Q, 1.0), rms_norm(K, 1.0)).round(3).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.25, -0.25], [-0.25, 0.25]] 0.00018\n[[35.355, 2.121]] [[1.414, 0.849]]",
          "[[0.5, 0.0], [0.0, 0.5]] 0.00018\n[[35.355, 2.121]] [[1.414, 0.849]]",
          "[[0.25, -0.25], [-0.25, 0.25]] 0.66667\n[[35.355, 2.121]] [[1.414, 0.849]]",
          "[[0.25, -0.25], [-0.25, 0.25]] 0.00018\n[[50.0, 3.0]] [[2.0, 1.2]]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>logsumexp(z)</C>, stable for large logits; <C>ce_zloss(z, y, alpha)</C>, the cross-entropy plus z-loss
          for one example; and <C>ce_zloss_grad(z, y, alpha)</C>, its gradient with respect to z.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def logsumexp(z):
    return float(np.log(np.sum(np.exp(z))))

def ce_zloss(z, y, alpha):
    return logsumexp(z) - float(z[y])

def ce_zloss_grad(z, y, alpha):
    return np.zeros(len(z))
`,
        solution: ZLOSS,
        tests: [
          { name: "values", code: `assert abs(logsumexp([1000.0, 1000.0]) - (1000 + np.log(2))) < 1e-9 and abs(logsumexp([0.0, 0.0, 0.0]) - np.log(3)) < 1e-12
z = np.array([2.0, 1.0, 0.0]); assert abs(ce_zloss(z, 1, 0.5) - (1.4076059644 + 0.5 * 2.4076059644 ** 2)) < 1e-8 and abs(ce_zloss(z + 5, 1, 0.0) - ce_zloss(z, 1, 0.0)) < 1e-9` },
          { name: "grad", code: `rng = np.random.default_rng(0); z = rng.standard_normal(5) * 3; g = ce_zloss_grad(z, 2, 0.1); e = 1e-6
num = [(ce_zloss(z + e * np.eye(5)[i], 2, 0.1) - ce_zloss(z - e * np.eye(5)[i], 2, 0.1)) / (2 * e) for i in range(5)]
assert np.allclose(g, num, atol=1e-6) and abs(g.sum() - 0.2 * logsumexp(z)) < 1e-9 and abs(ce_zloss_grad(z, 2, 0.0).sum()) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>softmax_jac(z)</C>, the Jacobian of the softmax; <C>attn_logits(Q, K)</C>, the matrix of scaled
          dot products between rows of Q and rows of K; and <C>rms_norm(X, g)</C>, each row of X scaled to root-mean-square
          g.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def softmax_jac(z):
    return np.eye(len(z))

def attn_logits(Q, K):
    return np.asarray(Q) @ np.asarray(K).T

def rms_norm(X, g):
    return g * np.asarray(X, float)
`,
        solution: ATTN,
        tests: [
          { name: "jac", code: `assert np.allclose(softmax_jac([0.0, 0.0]), [[0.25, -0.25], [-0.25, 0.25]]) and np.allclose(softmax_jac([1000.0, 0.0]), 0, atol=1e-12)
z = np.array([0.3, -1.2, 2.0]); p = np.exp(z) / np.exp(z).sum(); J = softmax_jac(z); assert np.allclose(J, np.diag(p) - np.outer(p, p)) and np.allclose(J.sum(axis=1), 0)` },
          { name: "attn", code: `Q = np.array([[3.0, 4.0]]); K = np.array([[6.0, 8.0], [1.0, 0.0]]); assert np.allclose(attn_logits(Q, K), [[50 / np.sqrt(2), 3 / np.sqrt(2)]])
X = np.random.default_rng(1).standard_normal((4, 8)) * 50; Y = rms_norm(X, 2.0); assert np.allclose(np.sqrt(np.mean(Y ** 2, axis=1)), 2.0) and np.allclose(Y / np.linalg.norm(Y, axis=1, keepdims=True), X / np.linalg.norm(X, axis=1, keepdims=True))
assert np.abs(attn_logits(rms_norm(X, 1.5), rms_norm(X[::-1], 2.0))).max() <= np.sqrt(8) * 3.0 + 1e-9` },
        ],
      },
    },
    {
      key: "bound",
      rung: "stretch",
      prompt: (
        <p>
          A model normalises queries and keys of dimension 64 to root-mean-square 1, then multiplies them by learned
          scalar gains <M>{"g_q = g_k = 1.5"}</M>. What is the largest possible attention logit <M>{"q^\\top k/\\sqrt d"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 18, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        QK-layernorm works because a normalised vector does not care how large the weights before it are. The last
        lesson of this course turns that observation into a general principle: normalisation makes the loss scale
        invariant, and scale invariance changes how learning rates and weight decay act.
      </p>
    </>
  ),
};
