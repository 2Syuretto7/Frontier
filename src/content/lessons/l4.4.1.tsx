import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { KernelAttentionViz } from "@/components/viz/KernelAttentionViz";
import type { LessonContent } from "@/lib/types";

const ATTEND = `import numpy as np

def softmax(Z, axis=-1):
    E = np.exp(Z - Z.max(axis=axis, keepdims=True))
    return E / E.sum(axis=axis, keepdims=True)

def attend(Q, K, V):
    A = softmax(Q @ K.T / np.sqrt(K.shape[1]), axis=1)
    return A @ V, A

def hard_lookup(q, K, V):
    return V[np.argmax(K @ q)]`;

const KERNEL = `import numpy as np

def nw_regress(xq, xs, ys, h):
    S = -(xq[:, None] - xs[None, :]) ** 2 / (2 * h * h)
    A = np.exp(S - S.max(axis=1, keepdims=True))
    A /= A.sum(axis=1, keepdims=True)
    return A @ ys

def weight_entropy(A):
    with np.errstate(divide="ignore", invalid="ignore"):
        return -np.where(A > 0, A * np.log(A), 0.0).sum(axis=1) + 0.0`;

export const lesson: LessonContent = {
  id: "l4.4.1",
  minutes: 45,
  links: {
    requires: ["l4.3.5", "l3.3.2"],
    revisits: ["l1.4.1", "m11.2.3"],
    foreshadows: ["l4.4.2", "l4.4.3"],
  },

  puzzle: (
    <>
      <p>
        A Python dictionary answers a query by finding the key equal to it and returning that key&apos;s value. Nothing about
        this can be learned by gradient descent: change the query slightly and the answer either stays the same or jumps to
        another value, so the derivative is zero or undefined. Yet the operation at the heart of every transformer is a
        lookup. How can a lookup be made smooth enough to train?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Instead of returning the value of the single best-matching key, return an average of all the values, weighted by how
        well each key matches the query. Scoring with a dot product and normalising with a softmax gives weights that are
        positive, sum to one and change smoothly with the query, keys and values. A sharp softmax approaches the hard lookup; a
        flat one approaches a plain average. Statisticians met this in the 1960s as kernel regression, where the keys are
        positions, the values are observations and the weight is a Gaussian bump.
      </p>
      <KernelAttentionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="attention">
        <p>
          Given queries <M>{"Q \\in \\mathbb R^{m \\times d}"}</M>, keys <M>{"K \\in \\mathbb R^{n \\times d}"}</M> and values{" "}
          <M>{"V \\in \\mathbb R^{n \\times d_v}"}</M>, scaled dot-product attention is
        </p>
        <MD>{"\\operatorname{Attention}(Q, K, V) = A V, \\qquad A = \\operatorname{softmax}_{\\text{rows}}\\!\\Bigl(\\frac{QK^\\top}{\\sqrt d}\\Bigr)."}</MD>
        <p>
          Row i of A is a probability distribution over the n keys, and row i of the output is the corresponding mixture of
          values. The cost is <M>{"O(mnd)"}</M> time and <M>{"O(mn)"}</M> memory for the weights. The softmax is computed stably by
          subtracting the row maximum.
        </p>
        <Code>{ATTEND}</Code>
      </Definition>

      <Theorem title="temperature interpolates between lookup and average">
        <p>
          For scores s and weights <M>{"\\alpha(\\tau) = \\operatorname{softmax}(s/\\tau)"}</M>: as τ → 0, α tends to the
          uniform distribution on the keys of maximal score, and as τ → ∞ it tends to the uniform distribution on all keys.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"s^* = \\max_j s_j"}</M>. Then <M>{"\\alpha_i = e^{(s_i - s^*)/\\tau}/\\sum_j e^{(s_j - s^*)/\\tau}"}</M>. As τ → 0,
          each term with <M>{"s_i < s^*"}</M> tends to 0 and each with <M>{"s_i = s^*"}</M> equals 1, which gives the first limit.
          As τ → ∞, every exponent tends to 0 and every term to 1, which gives the second.
        </p>
      </Proof>

      <Theorem title="Gaussian kernels are dot-product attention">
        <p>
          Softmax weights with scores <M>{"-\\|q - k_i\\|^2/2"}</M> equal those with scores{" "}
          <M>{"q^\\top k_i - \\|k_i\\|^2/2"}</M>. If all keys have the same norm, they equal plain dot-product attention.
        </p>
      </Theorem>
      <Proof>
        <p>
          Expand <M>{"-\\tfrac12\\|q - k_i\\|^2 = q^\\top k_i - \\tfrac12\\|k_i\\|^2 - \\tfrac12\\|q\\|^2"}</M>. The last term is the same for
          every key, and adding a constant to all scores leaves a softmax unchanged. With equal key norms the middle term is
          constant too. So Nadaraya-Watson kernel regression, <M>{"\\hat f(x) = \\sum_i \\alpha_i(x) y_i"}</M> with Gaussian weights
          of width h, is attention with query x/h, keys <M>{"x_i/h"}</M> and values <M>{"y_i"}</M>.
        </p>
        <Code>{KERNEL}</Code>
      </Proof>

      <Theorem title="why divide by the square root of d">
        <p>
          If q and k have independent entries with mean 0 and variance 1, then <M>{"q^\\top k"}</M> has mean 0 and variance d.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"q^\\top k = \\sum_{j=1}^d q_j k_j"}</M> is a sum of d independent terms, each with mean{" "}
          <M>{"\\mathbb E q_j\\,\\mathbb E k_j = 0"}</M> and variance <M>{"\\mathbb E q_j^2\\,\\mathbb E k_j^2 = 1"}</M>. Variances of
          independent terms add. Without scaling, scores grow like <M>{"\\sqrt d"}</M>, so for d = 512 typical score gaps are
          around 20 and the softmax is nearly one-hot from the first step, with tiny gradients for every non-maximal key.
          Dividing by <M>{"\\sqrt d"}</M> keeps the temperature independent of the width.
        </p>
      </Proof>

      <Example title="choosing the width">
        <p>
          In the figure, 25 noisy samples of a sine wave serve as keys and values. With width 0.01 the query at 0.5 attends to
          about 2.2 points and the curve copies the noise, with mean squared error 0.085 against the true curve. Width 0.05
          averages about 5 points and gives the lowest error, 0.051. Width 0.15 attends to 16 points (0.092) and width 0.5 to
          nearly all 25, flattening the sine wave (0.365). The width is a temperature, and choosing it is the bias-variance
          trade-off of the nearest-neighbour lesson.
        </p>
      </Example>

      <Remark title="what is learned">
        <p>
          In kernel regression the keys, values and width are fixed. In a neural network the queries, keys and values are
          learned linear maps of the inputs, so the model learns what to compare and what to return, and the effective
          temperature is absorbed into the size of those maps. Because the output is a weighted average, attention cannot
          extrapolate beyond its values: a query far from every key still returns a mixture of existing values.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "w",
      rung: "check",
      prompt: <p>A query scores three keys 2, 1 and 0. What attention weight does the first key receive?</p>,
      answer: { kind: "numeric", value: 0.6652, tolerance: 0.0005 },
    },
    {
      key: "std",
      rung: "check",
      prompt: (
        <p>
          Query and key vectors of dimension 64 have independent standard normal entries. What is the standard deviation of their
          unscaled dot product?
        </p>
      ),
      answer: { kind: "numeric", value: 8, tolerance: 0.001 },
    },
    {
      key: "cold",
      rung: "apply",
      prompt: <p>All attention scores are multiplied by 1000 before the softmax. What does attention compute, and what happens to training?</p>,
      answer: {
        kind: "choice",
        options: [
          "A plain average of the values; gradients become large",
          "Effectively the value of the best-matching key; gradients to the other keys nearly vanish",
          "The same output as before, since softmax is scale invariant",
          "The sum of all the values, without normalisation",
        ],
        correct: [1],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def softmax(Z, axis=-1):
    E = np.exp(Z - Z.max(axis=axis, keepdims=True))
    return E / E.sum(axis=axis, keepdims=True)

def attend(Q, K, V):
    A = softmax(Q @ K.T / np.sqrt(K.shape[1]), axis=1)
    return A @ V, A

def hard_lookup(q, K, V):
    return V[np.argmax(K @ q)]

K = np.array([[1.0, 0], [0, 1], [-1, 0]]); V = np.array([[10.0], [20], [30]])
out, A = attend(np.array([[0.0, 0]]), K, V); print(out.round(3).tolist(), A.round(3).tolist())
out, A = attend(np.array([[100.0, 0]]), K, V); print(out.round(3).tolist(), hard_lookup(np.array([100.0, 0]), K, V).tolist(), A.shape)
print(softmax(np.array([1000.0, 1000.0])).tolist(), softmax(np.array([[0.0, 0.0], [0.0, np.log(3)]]), axis=1).round(2).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[20.0]] [[0.333, 0.333, 0.333]]\n[[10.0]] [10.0] (1, 3)\n[0.5, 0.5] [[0.5, 0.5], [0.25, 0.75]]",
          "[[20.0]] [[0.333, 0.333, 0.333]]\n[[20.0]] [10.0] (1, 3)\n[0.5, 0.5] [[0.5, 0.5], [0.25, 0.75]]",
          "[[0.0]] [[0.333, 0.333, 0.333]]\n[[10.0]] [10.0] (1, 3)\n[0.5, 0.5] [[0.5, 0.5], [0.25, 0.75]]",
          "[[20.0]] [[0.333, 0.333, 0.333]]\n[[10.0]] [10.0] (3, 1)\n[nan, nan] [[0.5, 0.5], [0.25, 0.75]]",
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

def nw_regress(xq, xs, ys, h):
    S = -(xq[:, None] - xs[None, :]) ** 2 / (2 * h * h)
    A = np.exp(S - S.max(axis=1, keepdims=True))
    A /= A.sum(axis=1, keepdims=True)
    return A @ ys

def weight_entropy(A):
    with np.errstate(divide="ignore", invalid="ignore"):
        return -np.where(A > 0, A * np.log(A), 0.0).sum(axis=1) + 0.0

xs, ys = np.array([0.0, 1.0, 2.0]), np.array([0.0, 3.0, 6.0])
print(nw_regress(np.array([1.0]), xs, ys, 0.01).round(3).tolist(), nw_regress(np.array([1.0]), xs, ys, 100.0).round(3).tolist(), nw_regress(np.array([5.0]), xs, ys, 1.0).round(2).tolist())
print(weight_entropy(np.array([[1.0, 0, 0], [0.5, 0.5, 0]])).round(4).tolist(), bool(weight_entropy(np.full((1, 4), 0.25))[0] > 1.38))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[3.0] [3.0] [5.91]\n[0.0, 0.6931] True",
          "[3.0] [3.0] [15.0]\n[0.0, 0.6931] True",
          "[3.0] [0.0] [5.91]\n[0.0, 0.6931] True",
          "[3.0] [3.0] [5.91]\n[0.0, 1.0] False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write a stable <C>softmax(Z, axis)</C>, <C>attend(Q, K, V)</C> returning the scaled dot-product attention output and the
          weight matrix, and <C>hard_lookup(q, K, V)</C> returning the value of the key with the largest dot product.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def softmax(Z, axis=-1):
    return Z

def attend(Q, K, V):
    return None, None

def hard_lookup(q, K, V):
    return V[0]
`,
        solution: ATTEND,
        tests: [
          { name: "attention", code: `rng = np.random.default_rng(0); Q, K, V = rng.normal(size=(3, 4)), rng.normal(size=(5, 4)), rng.normal(size=(5, 2)); out, A = attend(Q, K, V)
S = Q @ K.T / 2; E = np.exp(S); assert A.shape == (3, 5) and np.allclose(A, E / E.sum(1, keepdims=True)) and np.allclose(out, A @ V)
assert np.allclose(softmax(np.array([[1000.0, 999.0]]), axis=1), [[1 / (1 + np.exp(-1)), 1 / (1 + np.e)]])` },
          { name: "limits", code: `K = np.array([[1.0, 0], [0, 1], [-1, 0]]); V = np.array([[1.0, 0], [0, 1], [5, 5]])
assert np.allclose(hard_lookup(np.array([-2.0, 0.5]), K, V), [5, 5]) and np.allclose(attend(np.array([[-500.0, 0]]), K, V)[0], [[5, 5]]) and np.allclose(attend(np.zeros((1, 2)), K, V)[0], [[2, 2]])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>nw_regress(xq, xs, ys, h)</C>, Nadaraya-Watson regression with Gaussian weights of width h at each query, and{" "}
          <C>weight_entropy(A)</C>, the entropy in nats of each row of a weight matrix, treating 0 log 0 as 0.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def nw_regress(xq, xs, ys, h):
    return np.zeros(len(xq))

def weight_entropy(A):
    return np.zeros(len(A))
`,
        solution: KERNEL,
        tests: [
          { name: "regression", code: `xs, ys = np.array([0.0, 1, 2, 3]), np.array([1.0, -1, 4, 0]); out = nw_regress(np.array([0.5, 1.0, 50.0]), xs, ys, 0.2)
w = np.exp(-(0.5 - xs) ** 2 / 0.08); assert np.allclose(out[0], w @ ys / w.sum()) and np.allclose(out[2], 0.0) and abs(out[1] + 1) < 0.01 and np.allclose(nw_regress(xs, xs, ys, 1e3), ys.mean())` },
          { name: "entropy", code: `e = weight_entropy(np.array([[0.25, 0.25, 0.25, 0.25], [1.0, 0, 0, 0], [0.5, 0.5, 0, 0]])); assert np.allclose(e, [np.log(4), 0, np.log(2)]) and not np.isnan(e).any()` },
        ],
      },
    },
    {
      key: "far",
      rung: "stretch",
      prompt: (
        <p>
          Keys at positions 0, 1 and 2 hold values 0, 3 and 6. With Gaussian weights of width 1, what does kernel attention return
          for a query at 5, where the linear trend would predict 15?
        </p>
      ),
      answer: { kind: "numeric", value: 5.9101, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Plugging this soft lookup into the encoder-decoder of the last lesson lets the decoder query every encoder state at
        every step, removing the single-vector bottleneck. That is the next lesson.
      </p>
    </>
  ),
};
