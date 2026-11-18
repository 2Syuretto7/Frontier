import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ScaleSaturationViz } from "@/components/viz/ScaleSaturationViz";
import type { LessonContent } from "@/lib/types";

const ATTN = `import numpy as np

def softmax_rows(S):
    S = np.asarray(S, float)
    E = np.exp(S - S.max(axis=-1, keepdims=True))
    return E / E.sum(axis=-1, keepdims=True)

def sdpa(Q, K, V, mask=None):
    S = np.asarray(Q, float) @ np.asarray(K, float).T / np.sqrt(np.shape(K)[1])
    if mask is not None:
        S = np.where(mask, S, -np.inf)
    A = softmax_rows(S)
    return A @ np.asarray(V, float), A

def score_var(d, n, seed):
    rng = np.random.default_rng(seed)
    q, k = rng.standard_normal((n, d)), rng.standard_normal((n, d))
    return float(np.var((q * k).sum(axis=1)))`;

const SAT = `import numpy as np

def entropy(p):
    p = np.asarray(p, float)
    p = p[p > 0]
    return float(0.0 - (p * np.log(p)).sum())

def jac_trace(z):
    z = np.asarray(z, float)
    p = np.exp(z - z.max())
    p /= p.sum()
    return float(1 - (p * p).sum())

def mean_trace(d, n, scaled, trials, seed):
    rng = np.random.default_rng(seed)
    out = []
    for _ in range(trials):
        q, K = rng.standard_normal(d), rng.standard_normal((n, d))
        z = K @ q / (np.sqrt(d) if scaled else 1.0)
        out.append(jac_trace(z))
    return float(np.mean(out))`;

export const lesson: LessonContent = {
  id: "l5.2.1",
  minutes: 40,
  links: {
    requires: ["l5.1.4", "l4.4.3"],
    revisits: ["l4.4.1"],
    foreshadows: ["l5.2.2"],
  },

  puzzle: (
    <>
      <p>
        Attention divides its query–key dot products by <M>{"\\sqrt{d_k}"}</M> before the softmax. Leave the factor out
        and nothing breaks at d = 4, but at d = 256 training is noticeably worse, and at d = 1024 attention barely learns.
        The factor is not about the size of the output, since the softmax normalises the weights anyway. What goes wrong
        without it, and why the square root rather than d itself?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A dot product of two random vectors adds d terms, each with mean zero, so it grows like the square root of d:
        the spread of the scores in a wide head is many times larger than in a narrow one. A softmax of widely spread
        scores is nearly one-hot. That would be fine if it were the right answer, but at initialisation it is an arbitrary
        choice, and a nearly one-hot softmax passes almost no gradient back to the scores, so it is hard to change.
        Dividing by <M>{"\\sqrt d"}</M> keeps the spread of the scores at about 1 whatever the width, so attention starts
        soft and stays trainable.
      </p>
      <ScaleSaturationViz />
    </>
  ),

  theory: (
    <>
      <Definition title="scaled dot-product attention">
        <p>
          For queries <M>{"Q \\in \\mathbb R^{n \\times d_k}"}</M>, keys <M>{"K \\in \\mathbb R^{m \\times d_k}"}</M>, values{" "}
          <M>{"V \\in \\mathbb R^{m \\times d_v}"}</M> and a boolean mask allowing some query–key pairs,
        </p>
        <MD>{"\\operatorname{Attention}(Q, K, V) = \\operatorname{softmax}\\Bigl(\\frac{QK^\\top}{\\sqrt{d_k}}\\Bigr)V,"}</MD>
        <p>
          where disallowed scores are set to −∞ before the row-wise softmax, so they receive weight 0.
        </p>
        <Code>{ATTN}</Code>
      </Definition>

      <Theorem title="dot products grow like the square root of the dimension">
        <p>
          If q and k are independent with independent entries of mean 0 and variance 1, then{" "}
          <M>{"\\mathbb E[q^\\top k] = 0"}</M> and <M>{"\\operatorname{Var}(q^\\top k) = d_k"}</M>. So{" "}
          <M>{"q^\\top k/\\sqrt{d_k}"}</M> has variance 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each term <M>{"q_ik_i"}</M> has mean <M>{"\\mathbb E[q_i]\\mathbb E[k_i] = 0"}</M> and variance{" "}
          <M>{"\\mathbb E[q_i^2]\\mathbb E[k_i^2] = 1"}</M>. The terms are independent across i, so their variances add to{" "}
          <M>{"d_k"}</M>. Dividing by <M>{"\\sqrt{d_k}"}</M> divides the variance by <M>{"d_k"}</M>.
        </p>
      </Proof>

      <Theorem title="a spread-out softmax passes exponentially little gradient">
        <p>
          Let <M>{"z \\in \\mathbb R^n"}</M> have a unique maximum, larger than every other entry by at least Δ &gt; 0, and
          let <M>{"p = \\operatorname{softmax}(\\beta z)"}</M>. Then{" "}
          <M>{"1 - p_{\\max} \\le (n-1)e^{-\\beta\\Delta}"}</M>, and the trace of the softmax Jacobian,{" "}
          <M>{"1 - \\sum_ip_i^2"}</M>, is at most <M>{"2(n-1)e^{-\\beta\\Delta}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For every non-maximal i, <M>{"p_i/p_{\\max} = e^{-\\beta(z_{\\max} - z_i)} \\le e^{-\\beta\\Delta}"}</M>, so{" "}
          <M>{"1 - p_{\\max} = \\sum_{i \\ne \\max}p_i \\le (n-1)e^{-\\beta\\Delta}p_{\\max} \\le (n-1)e^{-\\beta\\Delta}"}</M>.
          Then <M>{"1 - \\sum_ip_i^2 \\le 1 - p_{\\max}^2 = (1-p_{\\max})(1+p_{\\max}) \\le 2(1-p_{\\max})"}</M>. The Jacobian{" "}
          <M>{"\\mathrm{diag}(p) - pp^\\top"}</M> is positive semidefinite, so its trace bounds every eigenvalue: all gradients
          through the softmax shrink exponentially as the scores spread. Without scaling, β is effectively{" "}
          <M>{"\\sqrt{d_k}"}</M> times larger.
        </p>
        <Code>{SAT}</Code>
      </Proof>

      <Remark title="why the square root">
        <p>
          The factor is chosen so that scores have unit variance when queries and keys have unit-variance entries, as they do
          at initialisation with standard schemes. Dividing by <M>{"d_k"}</M> instead would make the scores shrink like{" "}
          <M>{"1/\\sqrt{d_k}"}</M>, so wide heads would start almost uniform and learn slowly. Training changes the
          picture: once queries and keys become correlated, <M>{"q^\\top k"}</M> can grow like <M>{"d_k"}</M>, which is why
          some parametrisations designed for transferring hyperparameters across widths use <M>{"1/d_k"}</M>, and why
          normalising queries and keys is used to stop attention logits growing during long runs.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sd",
      rung: "check",
      prompt: <p>Queries and keys have 128 independent standard normal entries. What is the standard deviation of an unscaled score <M>{"q^\\top k"}</M>? Give two decimals.</p>,
      answer: { kind: "numeric", value: 11.31, tolerance: 0.006 },
    },
    {
      key: "pmax",
      rung: "check",
      prompt: <p>Four scores after scaling are (2, 0, 0, 0). What weight does the softmax give the first key? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.711, tolerance: 0.0006 },
    },
    {
      key: "byd",
      rung: "apply",
      prompt: <p>What would happen at initialisation if attention divided scores by <M>{"d_k"}</M> instead of <M>{"\\sqrt{d_k}"}</M>, for wide heads?</p>,
      answer: {
        kind: "choice",
        options: [
          "Scores would have standard deviation about 1/√d_k, so attention would start close to uniform",
          "Attention would become one-hot immediately",
          "Nothing, because the softmax normalises the weights",
          "The values would be scaled down by d_k",
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

def softmax_rows(S):
    S = np.asarray(S, float)
    E = np.exp(S - S.max(axis=-1, keepdims=True))
    return E / E.sum(axis=-1, keepdims=True)

def sdpa(Q, K, V, mask=None):
    S = np.asarray(Q, float) @ np.asarray(K, float).T / np.sqrt(np.shape(K)[1])
    if mask is not None:
        S = np.where(mask, S, -np.inf)
    A = softmax_rows(S)
    return A @ np.asarray(V, float), A

def score_var(d, n, seed):
    rng = np.random.default_rng(seed)
    q, k = rng.standard_normal((n, d)), rng.standard_normal((n, d))
    return float(np.var((q * k).sum(axis=1)))

Q = np.array([[1.0, 0.0]]); K = np.array([[2.0, 0.0], [0.0, 2.0]]); V = np.array([[10.0], [20.0]])
out, A = sdpa(Q, K, V); print(np.round(A, 3).tolist(), np.round(out, 2).tolist())
print(sdpa(Q, K, V, mask=np.array([[False, True]]))[0].tolist(), round(score_var(64, 200000, 0) / 64, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.804, 0.196]] [[11.96]]\n[[20.0]] 1.0",
          "[[0.881, 0.119]] [[11.19]]\n[[20.0]] 1.0",
          "[[0.804, 0.196]] [[11.96]]\n[[10.0]] 1.0",
          "[[0.804, 0.196]] [[11.96]]\n[[20.0]] 64.0",
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

def entropy(p):
    p = np.asarray(p, float)
    p = p[p > 0]
    return float(0.0 - (p * np.log(p)).sum())

def jac_trace(z):
    z = np.asarray(z, float)
    p = np.exp(z - z.max())
    p /= p.sum()
    return float(1 - (p * p).sum())

def mean_trace(d, n, scaled, trials, seed):
    rng = np.random.default_rng(seed)
    out = []
    for _ in range(trials):
        q, K = rng.standard_normal(d), rng.standard_normal((n, d))
        z = K @ q / (np.sqrt(d) if scaled else 1.0)
        out.append(jac_trace(z))
    return float(np.mean(out))

print(round(entropy([0.5, 0.5]), 4), round(entropy([1.0, 0.0]), 4), round(jac_trace([0.0, 0.0, 0.0, 0.0]), 3))
print(round(mean_trace(256, 16, True, 400, 0), 2), round(mean_trace(256, 16, False, 400, 0), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.6931 0.0 0.75\n0.87 0.1",
          "0.6931 0.0 0.0\n0.87 0.1",
          "1.0 0.0 0.75\n0.87 0.1",
          "0.6931 0.0 0.75\n0.1 0.87",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>softmax_rows(S)</C>, stable along the last axis; <C>sdpa(Q, K, V, mask=None)</C>, returning the output and
          the weights, where mask is a boolean array that is True where attention is allowed; and{" "}
          <C>score_var(d, n, seed)</C>, the sample variance of n unscaled dot products of independent standard normal
          vectors, drawing all queries then all keys as (n, d) arrays.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def softmax_rows(S):
    return np.exp(S) / np.exp(S).sum()

def sdpa(Q, K, V, mask=None):
    A = softmax_rows(np.asarray(Q) @ np.asarray(K).T)
    return A @ np.asarray(V), A

def score_var(d, n, seed):
    return 1.0
`,
        solution: ATTN,
        tests: [
          { name: "attention", code: `Q = np.array([[1.0, 0.0]]); K = np.array([[2.0, 0.0], [0.0, 2.0]]); V = np.array([[10.0], [20.0]]); out, A = sdpa(Q, K, V)
assert np.allclose(A, [[1 / (1 + np.exp(-np.sqrt(2))), 1 - 1 / (1 + np.exp(-np.sqrt(2)))]]) and np.allclose(sdpa(Q, K, V, mask=np.array([[False, True]]))[0], [[20]])
assert np.allclose(softmax_rows([[1000.0, 1000.0]]), [[0.5, 0.5]])` },
          { name: "variance", code: `rng = np.random.default_rng(0); q, k = rng.standard_normal((5000, 32)), rng.standard_normal((5000, 32)); assert abs(score_var(32, 5000, 0) - np.var((q * k).sum(axis=1))) < 1e-9
assert abs(score_var(64, 200000, 1) / 64 - 1) < 0.02` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>entropy(p)</C> in nats, ignoring zero entries; <C>jac_trace(z)</C>, the trace of the softmax Jacobian at
          logits z; and <C>mean_trace(d, n, scaled, trials, seed)</C>: in each trial draw a query of length d and then an
          (n, d) key matrix of standard normals, form the n scores (divided by √d if scaled), and average the Jacobian traces.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def entropy(p):
    return 0.0

def jac_trace(z):
    return 1.0

def mean_trace(d, n, scaled, trials, seed):
    return 1.0
`,
        solution: SAT,
        tests: [
          { name: "basics", code: `assert abs(entropy([0.5, 0.5]) - np.log(2)) < 1e-12 and entropy([1.0, 0.0]) == 0.0 and abs(entropy([0.25] * 4) - np.log(4)) < 1e-12
assert abs(jac_trace([0.0] * 4) - 0.75) < 1e-12 and jac_trace([1000.0, 0.0]) < 1e-12` },
          { name: "saturation", code: `a, b = mean_trace(256, 16, True, 400, 0), mean_trace(256, 16, False, 400, 0); assert abs(a - 0.87) < 0.02 and b < 0.15
rng = np.random.default_rng(3); q, K = rng.standard_normal(8), rng.standard_normal((5, 8)); assert abs(mean_trace(8, 5, True, 1, 3) - jac_trace(K @ q / np.sqrt(8))) < 1e-12` },
        ],
      },
    },
    {
      key: "bound",
      rung: "stretch",
      prompt: (
        <p>
          A softmax over 1000 keys has its top score larger than every other by at least 1, and the scores are multiplied by
          β = 10. What is the upper bound on <M>{"1 - p_{\\max}"}</M> from the theorem? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0454, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        A language model must not let a position attend to the tokens it is trying to predict. The mask argument in the
        code above is how that is enforced, and the next lesson shows how one masked pass trains on every position at once.
      </p>
    </>
  ),
};
