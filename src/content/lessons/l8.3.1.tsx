import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RouterMapViz } from "@/components/viz/RouterMapViz";
import type { LessonContent } from "@/lib/types";

const GATES = `import math

def top_k(logits, k):
    return sorted(range(len(logits)), key=lambda i: -logits[i])[:k]

def softmax_topk_gates(logits, k, renorm=True):
    m = max(logits)
    e = [math.exp(v - m) for v in logits]
    s = sum(e)
    p = [v / s for v in e]
    idx = top_k(logits, k)
    t = sum(p[i] for i in idx) if renorm else 1.0
    return {i: p[i] / t for i in idx}

def sigmoid_topk_gates(logits, k):
    a = [1 / (1 + math.exp(-v)) for v in logits]
    idx = top_k(a, k)
    t = sum(a[i] for i in idx)
    return {i: a[i] / t for i in idx}`;

const LAYER = `def matvec(W, x):
    return [sum(w * v for w, v in zip(row, x)) for row in W]

def moe_forward(x, Wr, experts, gate_fn, k):
    gates = gate_fn(matvec(Wr, x), k)
    y = [0.0] * len(x)
    for i, g in gates.items():
        out = matvec(experts[i], x)
        y = [a + g * b for a, b in zip(y, out)]
    return y

def param_counts(d, h, n_experts, k):
    expert = 3 * d * h
    return n_experts * expert + d * n_experts, k * expert + d * n_experts`;

export const lesson: LessonContent = {
  id: "l8.3.1",
  minutes: 50,
  links: {
    requires: ["l8.2.1", "l5.2.4"],
    revisits: ["l3.3.2", "l5.3.3"],
    foreshadows: ["l8.3.2", "l8.3.3", "e10.6.1"],
  },

  puzzle: (
    <>
      <p>
        DeepSeek-V3 has 671 billion parameters but spends the compute of a 37-billion-parameter model on each token. Most of its
        weights sit in 256 feed-forward experts, and each token is sent to only eight of them. A small linear layer makes that
        choice, token by token, and is trained by the same loss as everything else. How does a discrete choice of experts get
        a gradient, and how should the chosen experts&apos; outputs be combined?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The feed-forward layer holds much of a transformer&apos;s knowledge, and not every token needs all of it. A mixture of
        experts replaces the one large layer by many smaller ones and a router that scores each expert for each token. The
        token goes to the top few, and their outputs are added with weights given by the router&apos;s scores. The choice of
        experts is discrete and gets no gradient, but the weights are smooth functions of the scores, so the router learns
        through them which experts serve which tokens best.
      </p>
      <RouterMapViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a mixture-of-experts layer">
        <p>
          With experts <M>{"E_1, \\dots, E_n"}</M>, router weights <M>{"W_r"}</M> and logits <M>{"z = W_r x"}</M>, the layer computes
        </p>
        <MD>{"y = \\sum_{i \\in \\mathcal{T}_k(z)} g_i(z)\\, E_i(x)"}</MD>
        <p>
          where <M>{"\\mathcal{T}_k"}</M> is the set of the k largest scores (<C>top_k</C>) and g are the gates (<C>moe_forward</C>). Common gate rules are
          softmax over all experts, kept unnormalised as in the Switch Transformer or renormalised over the chosen k as in
          Mixtral (<C>softmax_topk_gates</C>), and sigmoid affinities renormalised over the chosen k, as in DeepSeek-V3
          (<C>sigmoid_topk_gates</C>). Only the chosen experts run, so the compute per token is that of k experts, while the
          parameter count is that of all n (<C>param_counts</C>).
        </p>
        <Code>{GATES}</Code>
        <Code>{LAYER}</Code>
      </Definition>

      <Theorem title="renormalised softmax is softmax over the chosen logits">
        <p>
          For any set S of experts,
        </p>
        <MD>{"\\frac{\\mathrm{softmax}(z)_i}{\\sum_{j \\in S} \\mathrm{softmax}(z)_j} = \\frac{e^{z_i}}{\\sum_{j \\in S} e^{z_j}} \\qquad (i \\in S)"}</MD>
        <p>
          so taking the top k and then a softmax over their logits, as Mixtral describes it, is the same as a full softmax
          renormalised over the top k.
        </p>
      </Theorem>
      <Proof>
        <p>
          Both numerator and denominator on the left carry the factor <M>{"1/\\sum_{j=1}^n e^{z_j}"}</M>, which cancels.
        </p>
      </Proof>

      <Remark title="where the router's gradient comes from">
        <p>
          The set <M>{"\\mathcal{T}_k"}</M> is piecewise constant in z, so the loss reaches the router only through the gates of the chosen
          experts: <M>{"\\partial y/\\partial z"}</M> involves <M>{"\\partial g_i/\\partial z"}</M> for <M>{"i \\in \\mathcal{T}_k"}</M>. The router learns to raise the
          gate of a chosen expert whose output helped and lower it otherwise, which indirectly reorders the experts. It never
          learns directly about experts it did not choose. With k = 1 and renormalisation the single gate is always 1 and no
          gradient flows at all, which is why the Switch Transformer kept the unnormalised probability as its gate.
        </p>
      </Remark>

      <Example title="routing in published models">
        <p>
          Mixtral 8×7B routes each token to 2 of 8 experts per layer, about 13 billion active parameters out of 47 billion.
          DeepSeek-V3 routes to 8 of 256 fine-grained experts plus one shared expert that every token uses, a design l8.3.4
          examines. An alternative, expert-choice routing, lets each expert pick its top tokens from a batch, which balances
          load perfectly but lets a token&apos;s treatment depend on other tokens in the batch, awkward for autoregressive
          generation. Token-choice top-k with a balancing mechanism, the subject of the next lesson, is the standard.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "active",
      rung: "check",
      prompt: (
        <p>
          A layer has 8 SwiGLU experts with d = 4096 and hidden width 14336, top-2 routing and a router with no bias. How many
          parameters are active per token in this layer, in millions, counting the router? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 352.35, tolerance: 0.01 },
    },
    {
      key: "gate",
      rung: "check",
      prompt: <p>Router logits are (2, 1, 0, −1). With top-2 softmax gates renormalised over the chosen two, what is the larger gate? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.7311, tolerance: 0.0002 },
    },
    {
      key: "grad",
      rung: "apply",
      prompt: <p>Why does top-1 routing with gates renormalised over the chosen expert leave the router untrained by the language-modelling loss?</p>,
      answer: {
        kind: "choice",
        options: [
          "The single renormalised gate is always exactly 1, so the output does not depend smoothly on the router logits",
          "Top-1 routing sends every token to the same expert",
          "The router's logits are detached from the graph by the top-k operation in every framework",
          "Softmax gradients vanish when there is only one expert",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def top_k(logits, k):
    return sorted(range(len(logits)), key=lambda i: -logits[i])[:k]

def softmax_topk_gates(logits, k, renorm=True):
    m = max(logits)
    e = [math.exp(v - m) for v in logits]
    s = sum(e)
    p = [v / s for v in e]
    idx = top_k(logits, k)
    t = sum(p[i] for i in idx) if renorm else 1.0
    return {i: p[i] / t for i in idx}

def sigmoid_topk_gates(logits, k):
    a = [1 / (1 + math.exp(-v)) for v in logits]
    idx = top_k(a, k)
    t = sum(a[i] for i in idx)
    return {i: a[i] / t for i in idx}

print(top_k([0.1, 3.0, -1.0, 2.0], 2), {i: round(g, 4) for i, g in softmax_topk_gates([0.0, math.log(3), -5.0], 2).items()})
print({i: round(g, 4) for i, g in softmax_topk_gates([0.0, 0.0, 0.0, 0.0], 1, False).items()}, sigmoid_topk_gates([0.0, 0.0, 9.0], 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 3] {1: 0.75, 0: 0.25}\n{0: 0.25} {2: 1.0}",
          "[1, 3] {1: 0.75, 0: 0.25}\n{0: 1.0} {2: 1.0}",
          "[3, 1] {1: 0.75, 0: 0.25}\n{0: 0.25} {2: 1.0}",
          "[1, 3] {1: 0.6, 0: 0.2}\n{0: 0.25} {2: 0.9999}",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def matvec(W, x):
    return [sum(w * v for w, v in zip(row, x)) for row in W]

def moe_forward(x, Wr, experts, gate_fn, k):
    gates = gate_fn(matvec(Wr, x), k)
    y = [0.0] * len(x)
    for i, g in gates.items():
        out = matvec(experts[i], x)
        y = [a + g * b for a, b in zip(y, out)]
    return y

def param_counts(d, h, n_experts, k):
    expert = 3 * d * h
    return n_experts * expert + d * n_experts, k * expert + d * n_experts

E = [[[1.0, 0.0], [0.0, 1.0]], [[0.0, 2.0], [2.0, 0.0]]]; one = lambda z, k: {z.index(max(z)): 1.0}
print(moe_forward([1.0, 3.0], [[1.0, 0.0], [0.0, 1.0]], E, one, 1), param_counts(2, 4, 8, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[6.0, 2.0] (208, 64)",
          "[1.0, 3.0] (208, 64)",
          "[6.0, 2.0] (192, 48)",
          "[3.5, 2.5] (208, 64)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>top_k(logits, k)</C>, returning indices from largest to smallest, <C>softmax_topk_gates(logits, k, renorm)</C> and{" "}
          <C>sigmoid_topk_gates(logits, k)</C>, each returning a dict from expert index to gate.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def top_k(logits, k):
    return list(range(k))

def softmax_topk_gates(logits, k, renorm=True):
    return {i: 1.0 / k for i in top_k(logits, k)}

def sigmoid_topk_gates(logits, k):
    return {i: 1.0 / k for i in top_k(logits, k)}
`,
        solution: GATES,
        tests: [
          { name: "softmax", code: `g = softmax_topk_gates([2.0, 1.0, 0.0, -1.0], 2)\nassert top_k([0.5, -1.0, 4.0], 2) == [2, 0] and abs(g[0] - 1 / (1 + math.exp(-1))) < 1e-12 and abs(softmax_topk_gates([0.0, 0.0], 1, False)[0] - 0.5) < 1e-12` },
          { name: "sigmoid", code: `g = sigmoid_topk_gates([1.0, 0.0, -0.5, 2.0], 2)\ns = lambda v: 1 / (1 + math.exp(-v))\nassert set(g) == {3, 0} and abs(g[3] - s(2.0) / (s(2.0) + s(1.0))) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>matvec(W, x)</C>, <C>moe_forward(x, Wr, experts, gate_fn, k)</C>, which mixes the outputs of linear experts using the gates
          that <C>gate_fn(logits, k)</C> returns, and <C>param_counts(d, h, n_experts, k)</C>, returning (total, active) for SwiGLU experts
          plus the router.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def matvec(W, x):
    return [sum(w * v for w, v in zip(row, x)) for row in W]

def moe_forward(x, Wr, experts, gate_fn, k):
    return matvec(experts[0], x)

def param_counts(d, h, n_experts, k):
    return n_experts * 2 * d * h, k * 2 * d * h
`,
        solution: LAYER,
        tests: [
          { name: "forward", code: `E = [[[1.0, 0.0], [0.0, 1.0]], [[0.0, 2.0], [2.0, 0.0]], [[1.0, 1.0], [1.0, 1.0]]]\nhalf = lambda z, k: {1: 0.25, 2: 0.75}\ny = moe_forward([1.0, 2.0], [[0.0, 0.0]] * 3, E, half, 2)\nassert abs(y[0] - 3.25) < 1e-12 and abs(y[1] - 2.75) < 1e-12` },
          { name: "params", code: `assert param_counts(2, 4, 8, 2) == (208, 64) and param_counts(10, 30, 4, 1) == (3640, 940)` },
        ],
      },
    },
    {
      key: "distinct",
      rung: "stretch",
      prompt: (
        <p>
          A decoding batch of 32 tokens is routed top-1 among 64 experts, each token choosing uniformly and independently. What
          is the expected number of distinct experts whose weights must be loaded? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 25.33, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        Nothing in the routing rule stops every token from choosing the same few experts, leaving the rest idle. The next
        lesson is about keeping the load balanced, with and without an extra loss.
      </p>
    </>
  ),
};
