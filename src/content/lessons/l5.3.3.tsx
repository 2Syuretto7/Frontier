import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ParamFlopViz } from "@/components/viz/ParamFlopViz";
import type { LessonContent } from "@/lib/types";

const PARAMS = `import numpy as np

def block_params(d, ff=4):
    return 4 * d * d + 2 * ff * d * d

def gpt_params(V, d, L, ctx, ff=4, tied=True):
    embed = V * d * (1 if tied else 2) + ctx * d
    return embed + L * block_params(d, ff)

def count_params(tree):
    if isinstance(tree, dict):
        return sum(count_params(v) for v in tree.values())
    if isinstance(tree, (list, tuple)):
        return sum(count_params(v) for v in tree)
    return int(np.size(tree))`;

const FLOPS = `def matmul_flops(m, k, n):
    return 2 * m * k * n

def forward_flops_per_token(n_matmul, L, T, d):
    return 2 * n_matmul + 4 * L * T * d

def train_flops(n_matmul, L, T, d, tokens):
    return 3 * forward_flops_per_token(n_matmul, L, T, d) * tokens`;

export const lesson: LessonContent = {
  id: "l5.3.3",
  minutes: 45,
  links: {
    requires: ["l5.3.2", "m5.4.5"],
    revisits: ["l5.2.4"],
    foreshadows: ["e7.4.1", "e7.6.1"],
  },

  puzzle: (
    <>
      <p>
        People quote the cost of training a language model with a one-line formula: about 6 floating-point operations per
        parameter per training token. A 7-billion-parameter model on 2 trillion tokens is then about{" "}
        <M>{"8.4 \\times 10^{22}"}</M> FLOPs. Where does the 6 come from, which parameters does it count, and when does it
        stop being accurate?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Almost all of a transformer&apos;s work is matrix products with its weights. In the forward pass each weight is used
        once per token, as one multiply and one add: 2 FLOPs. The backward pass needs two products of the same size, one for
        the gradient with respect to the input and one for the weight, so 4 more. The parts that escape this rule are the
        embedding lookup, which costs nothing, and the attention scores, which multiply activations with activations and
        grow with the context length.
      </p>
      <ParamFlopViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the parameters of a GPT">
        <p>
          Ignoring biases and norm gains, which add a few d per block, a block has <M>{"4d^2"}</M> attention parameters (
          <M>{"W_Q, W_K, W_V, W_O"}</M>) and <M>{"2\\,\\text{ff}\\,d^2"}</M> MLP parameters, <M>{"12d^2"}</M> for ff = 4. With
          vocabulary V, context T and L blocks, a GPT with a tied unembedding has
        </p>
        <MD>{"N = Vd + Td + 12Ld^2"}</MD>
        <p>
          parameters, and Vd more if the unembedding is separate. In practice one counts the arrays themselves.
        </p>
        <Code>{PARAMS}</Code>
      </Definition>

      <Theorem title="FLOPs of a forward pass">
        <p>
          Let <M>{"N_{\\text{mm}}"}</M> be the number of weights used in matrix products: the blocks&apos; matrices and the
          unembedding, but not the lookup tables. A forward pass over a context of T tokens costs, per token,
        </p>
        <MD>{"2N_{\\text{mm}} + 4LTd"}</MD>
        <p>
          FLOPs, when the attention scores are computed for all T keys.
        </p>
      </Theorem>
      <Proof>
        <p>
          A product of an m × k and a k × n matrix costs mkn multiplications and as many additions, 2mkn. Per token, a weight
          matrix of k × n entries is applied to one k-vector: 2kn FLOPs, twice its size. Summing over matrices gives{" "}
          <M>{"2N_{\\text{mm}}"}</M>; lookups are free. In each layer, the token&apos;s query takes a dot product with T keys,
          2Td FLOPs, and its output is a weighted sum of T values, 2Td more, so 4Td per layer. Norms, softmaxes and activations
          cost O(d) or O(T) per token and are left out. A kernel that skips masked scores does about half the attention work.
        </p>
      </Proof>

      <Theorem title="the 6N rule">
        <p>
          Training on D tokens costs about <M>{"3(2N_{\\text{mm}} + 4LTd)D"}</M> FLOPs. When{" "}
          <M>{"T \\ll 6d"}</M> and the embedding is a small part of the model, this is close to <M>{"6ND"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For a product <M>{"Y = XW"}</M>, the backward pass computes <M>{"\\partial L/\\partial X = G W^\\top"}</M> and{" "}
          <M>{"\\partial L/\\partial W = X^\\top G"}</M>, two products of the same cost as the forward one. The attention
          products are of the same kind. So the backward pass costs twice the forward, and a step three times. The ratio of
          attention-score FLOPs to block weight FLOPs is <M>{"4LTd / (24Ld^2) = T/(6d)"}</M>, small when{" "}
          <M>{"T \\ll 6d"}</M>. Finally <M>{"N_{\\text{mm}}"}</M> differs from N only by the lookup tables: the position
          table Td and, without tying, the input embedding Vd. With tying the shared matrix is counted once in N and used once
          in the products, as the unembedding.
        </p>
      </Proof>

      <Code>{FLOPS}</Code>

      <Remark title="what the count leaves out">
        <p>
          Recomputing activations to save memory adds another forward pass for the recomputed layers, about 8N instead of 6N
          with full recomputation. Mixture-of-experts models use only the active experts&apos; weights per token, so N
          becomes the active parameter count. Measured time also depends on how close the hardware gets to its peak FLOP rate,
          which later courses on systems take up.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "medium",
      rung: "check",
      prompt: <p>With V = 50257, T = 1024, d = 1024 and L = 24, how many million parameters does a tied GPT have, by the formula? Give three decimals.</p>,
      answer: { kind: "numeric", value: 354.502, tolerance: 0.0006 },
    },
    {
      key: "budget",
      rung: "check",
      prompt: <p>By the 6N rule, how many FLOPs does training a 7 × 10⁹-parameter model on 2 × 10¹² tokens cost, in units of 10²²?</p>,
      answer: { kind: "numeric", value: 8.4, tolerance: 1e-9 },
    },
    {
      key: "backward",
      rung: "apply",
      prompt: <p>Why does the backward pass through a linear layer cost about twice its forward pass?</p>,
      answer: {
        kind: "choice",
        options: [
          "It needs the gradient with respect to the input and with respect to the weights, each a matrix product of the same size as the forward one",
          "It must recompute the forward pass first",
          "Derivatives of products need the product rule, which doubles every term",
          "Gradients are stored in higher precision",
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

def block_params(d, ff=4):
    return 4 * d * d + 2 * ff * d * d

def gpt_params(V, d, L, ctx, ff=4, tied=True):
    embed = V * d * (1 if tied else 2) + ctx * d
    return embed + L * block_params(d, ff)

def count_params(tree):
    if isinstance(tree, dict):
        return sum(count_params(v) for v in tree.values())
    if isinstance(tree, (list, tuple)):
        return sum(count_params(v) for v in tree)
    return int(np.size(tree))

print(block_params(768), gpt_params(50257, 768, 12, 1024), gpt_params(50257, 768, 12, 1024, tied=False) - gpt_params(50257, 768, 12, 1024))
P = {"E": np.zeros((10, 4)), "blocks": [{"W": np.zeros((4, 4)), "b": 0.0}] * 3}; print(count_params(P))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "7077888 124318464 38597376\n91",
          "7077888 124318464 38597376\n58",
          "7077888 123532032 38597376\n91",
          "4718592 95999232 38597376\n91",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def matmul_flops(m, k, n):
    return 2 * m * k * n

def forward_flops_per_token(n_matmul, L, T, d):
    return 2 * n_matmul + 4 * L * T * d

def train_flops(n_matmul, L, T, d, tokens):
    return 3 * forward_flops_per_token(n_matmul, L, T, d) * tokens

print(matmul_flops(2, 3, 4), forward_flops_per_token(1000, 2, 8, 4), train_flops(1000, 2, 8, 4, 10))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["48 2256 67680", "24 2256 67680", "48 2064 61920", "48 2256 22560"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>block_params(d, ff=4)</C>; <C>gpt_params(V, d, L, ctx, ff=4, tied=True)</C>, following the formula; and{" "}
          <C>count_params(tree)</C>, which adds up the sizes of all arrays and numbers in nested dicts, lists and tuples.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def block_params(d, ff=4):
    return 0

def gpt_params(V, d, L, ctx, ff=4, tied=True):
    return 0

def count_params(tree):
    return 0
`,
        solution: PARAMS,
        tests: [
          { name: "formula", code: `assert block_params(768) == 7077888 and block_params(10, ff=8) == 2000
assert gpt_params(50257, 768, 12, 1024) == 124318464 and gpt_params(100, 8, 2, 16, tied=False) == 1600 + 128 + 2 * 768
assert gpt_params(100, 8, 2, 16, ff=2) == 800 + 128 + 2 * 512` },
          { name: "count", code: `rng = np.random.default_rng(0); d, V, L, T = 8, 20, 3, 5
P = dict(E=np.zeros((V, d)), pos=np.zeros((T, d)), blocks=[dict(Wq=np.zeros((d, d)), Wk=np.zeros((d, d)), Wv=np.zeros((d, d)), Wo=np.zeros((d, d)), W1=np.zeros((d, 4 * d)), W2=np.zeros((4 * d, d))) for _ in range(L)])
assert count_params(P) == gpt_params(V, d, L, T) and count_params([np.ones(3), (np.ones((2, 2)), 1.5)]) == 8 and count_params({}) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>matmul_flops(m, k, n)</C>; <C>forward_flops_per_token(n_matmul, L, T, d)</C>, as in the theorem; and{" "}
          <C>train_flops(n_matmul, L, T, d, tokens)</C>, three times the forward cost of all tokens.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def matmul_flops(m, k, n):
    return m * k * n

def forward_flops_per_token(n_matmul, L, T, d):
    return n_matmul

def train_flops(n_matmul, L, T, d, tokens):
    return 6 * n_matmul * tokens
`,
        solution: FLOPS,
        tests: [
          { name: "matmul", code: `assert matmul_flops(2, 3, 4) == 48 and matmul_flops(1, 768, 3072) == 2 * 768 * 3072
assert forward_flops_per_token(1000, 2, 8, 4) == 2256 and forward_flops_per_token(10, 0, 100, 100) == 20` },
          { name: "train", code: `assert train_flops(1000, 2, 8, 4, 10) == 67680 and train_flops(7e9, 0, 1, 1, 2e12) == 6 * 7e9 * 2e12
d, L, T = 768, 12, 1024; nm = 12 * L * d * d + 50257 * d; r = train_flops(nm, L, T, d, 1) / (6 * nm); assert 1.14 < r < 1.16` },
        ],
      },
    },
    {
      key: "crossover",
      rung: "stretch",
      prompt: <p>For d = 4096, at what context length T do the attention-score FLOPs equal the FLOPs of the block weight matrices?</p>,
      answer: { kind: "numeric", value: 24576, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        During generation the model runs one new token at a time, and recomputing the keys and values of the whole prefix at
        every step would waste almost all of that work. Next: the KV cache, which stores them instead.
      </p>
    </>
  ),
};
