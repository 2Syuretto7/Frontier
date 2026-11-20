import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TensorParallelViz } from "@/components/viz/TensorParallelViz";
import type { LessonContent } from "@/lib/types";

const LAYERS = `import numpy as np

def column_parallel(X, W, t):
    return [X @ Wi for Wi in np.split(W, t, axis=1)]   # rank i holds columns i of W and the full X

def row_parallel(Hs, W, t):
    parts = [Hi @ Wi for Hi, Wi in zip(Hs, np.split(W, t, axis=0))]
    return sum(parts)                             # all-reduce of the partial outputs

def tp_mlp(X, W1, W2, t):
    Hs = [np.maximum(H, 0.0) for H in column_parallel(X, W1, t)]   # element-wise, so no communication
    return row_parallel(Hs, W2, t)`;

const VOCAB = `import numpy as np

def vocab_ce(shards, target):
    m = max(float(s.max()) for s in shards)      # all-reduce max
    z = sum(float(np.exp(s - m).sum()) for s in shards)   # all-reduce sum
    off, tl = 0, 0.0
    for s in shards:                              # only the owner contributes the target logit
        if off <= target < off + len(s):
            tl = float(s[target - off])
        off += len(s)
    return np.log(z) + m - tl

def tp_bytes(b, s, d, t, layers):
    per = 2 * (t - 1) / t * 2 * b * s * d         # one ring all-reduce of bf16 activations
    return 4 * layers * per                       # two forward and two backward per layer

def tp_comm_share(b, s, d, t, layers, flops, bw):
    comm = tp_bytes(b, s, d, t, layers) / bw
    compute = 72 * b * s * d * d * layers / (t * flops)
    return comm / (comm + compute)`;

const AUTOGRAD = `class CopyToTP(torch.autograd.Function):          # "f": before a column-parallel layer
    @staticmethod
    def forward(ctx, x):
        return x                                      # every rank already has the full input
    @staticmethod
    def backward(ctx, g):
        dist.all_reduce(g, group=tp_group)            # each rank's input gradient is partial
        return g

class ReduceFromTP(torch.autograd.Function):      # "g": after a row-parallel layer
    @staticmethod
    def forward(ctx, y):
        dist.all_reduce(y, group=tp_group)            # sum the partial outputs
        return y
    @staticmethod
    def backward(ctx, g):
        return g                                      # the gradient of a sum is copied to each term`;

export const lesson: LessonContent = {
  id: "e10.4.1",
  minutes: 50,
  links: {
    requires: ["e10.1.2", "e6.5.4", "e8.2.2"],
    revisits: ["e7.6.2", "l5.3.1"],
    foreshadows: ["e10.4.2", "e10.7.1"],
  },

  puzzle: (
    <>
      <p>
        A 70-billion-parameter model on 8 GPUs per node: data parallelism with FSDP shards the weights but still has each GPU run
        whole layers on its own sequences. Tensor parallelism splits each matrix multiplication across the 8 GPUs of a node, at the
        price of communicating activations inside every layer. Why is this practical inside a node and rarely across nodes, and how
        does one split a transformer block so that the communication is as small as possible?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Split the first MLP weight by columns: each rank computes its own slice of the hidden layer from the full input, and the
        activation function acts on each slice separately. Split the second weight by rows: each rank multiplies its hidden slice by
        its rows and gets a partial sum of the output. One all-reduce adds the partial sums. Attention splits the same way by heads.
        The communicated tensors are activations of size tokens by d, every layer, so the link must be fast.
      </p>
      <TensorParallelViz />
    </>
  ),

  theory: (
    <>
      <Definition title="column- and row-parallel layers">
        <p>
          With t ranks, a column-parallel layer gives rank i the column block <M>{"W_i"}</M> and computes <M>{"XW_i"}</M> from a
          replicated X (<C>column_parallel</C>). A row-parallel layer gives rank i the row block <M>{"W^{(i)}"}</M>, takes the input
          already split by columns, and sums <M>{"H_i W^{(i)}"}</M> with an all-reduce (<C>row_parallel</C>). Megatron&apos;s MLP is a
          column-parallel layer, an element-wise nonlinearity, and a row-parallel layer (<C>tp_mlp</C>).
        </p>
        <Code>{LAYERS}</Code>
      </Definition>

      <Theorem title="one all-reduce per block in each direction">
        <p>
          For the MLP <M>{"Y = \\phi(XW_1)W_2"}</M> with <M>{"W_1"}</M> split by columns and <M>{"W_2"}</M> by the matching rows,
        </p>
        <MD>{"Y = \\sum_{i=1}^{t} \\phi(XW_{1,i})\\,W_2^{(i)}."}</MD>
        <p>
          The forward pass needs one all-reduce, after <M>{"W_2"}</M>, and the backward pass one, for the gradient with respect to X.
          The same holds for attention with heads split across ranks: the query, key and value projections are column-parallel by
          head and the output projection is row-parallel.
        </p>
      </Theorem>
      <Proof>
        <p>
          Column blocks give <M>{"XW_1 = [XW_{1,1} \\mid \\cdots \\mid XW_{1,t}]"}</M>, and φ acts element-wise, so{" "}
          <M>{"\\phi(XW_1)"}</M> is the concatenation of the <M>{"\\phi(XW_{1,i})"}</M>. A block product of a row-partitioned matrix
          with a column-partitioned one is the sum of the block products. In the backward pass each rank computes{" "}
          <M>{"\\partial L/\\partial X"}</M> through its own <M>{"W_{1,i}"}</M> only, a partial sum, so the input gradient needs an
          all-reduce. Attention heads are independent until the output projection, which plays the role of <M>{"W_2"}</M>.
        </p>
        <Code>{AUTOGRAD}</Code>
      </Proof>

      <Theorem title="communication against compute">
        <p>
          A transformer layer does about <M>{"72bsd^2"}</M> FLOPs of training work, split t ways, and makes four all-reduces of{" "}
          <M>{"2bsd"}</M> bytes (two forward, two backward). With per-GPU throughput F and ring bandwidth B, the ratio of
          communication time to compute time is
        </p>
        <MD>{"\\frac{2(t-1)F}{9\\,d\\,B},"}</MD>
        <p>independent of batch and sequence length.</p>
      </Theorem>
      <Proof>
        <p>
          A ring all-reduce sends <M>{"2(t-1)/t"}</M> times the buffer per rank (e8.2.2), so communication takes{" "}
          <M>{"16(t-1)bsd/(tB)"}</M> per layer, while compute takes <M>{"72bsd^2/(tF)"}</M> (e10.1.2). Dividing, b, s and t cancel
          except in t − 1 (<C>tp_comm_share</C>).
        </p>
      </Proof>

      <Remark title="the vocabulary">
        <p>
          The output layer has a d by V matrix with V often above 100,000. Split by columns, each rank holds logits for a slice of the
          vocabulary. Gathering them would materialise the whole logit tensor on every rank; instead the cross-entropy is computed from
          two scalar all-reduces per token, the maximum and the sum of exponentials, and one more for the target&apos;s logit, which only
          its owner has (<C>vocab_ce</C>). The input embedding is split by rows of the vocabulary the same way, each rank looking up
          the tokens it owns and contributing zeros otherwise, followed by an all-reduce.
        </p>
        <Code>{VOCAB}</Code>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The ratio grows with t − 1 and falls with link bandwidth. Inside a node, links of several hundred gigabytes per second keep
          it well below one at t = 8 for large d; across nodes the bandwidth is roughly ten times lower and the ratio exceeds one, so
          communication would dominate. The split that minimises communication is the column-then-row pairing, which needs one
          all-reduce per attention block and one per MLP block in each direction.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "ratio",
      rung: "check",
      prompt: (
        <p>
          With d = 8192, t = 8, 400 TFLOP/s per GPU and 450 GB/s of all-reduce bandwidth, what is the ratio of tensor-parallel
          communication time to compute time? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.169, tolerance: 0.001 },
    },
    {
      key: "logits",
      rung: "check",
      prompt: (
        <p>
          A micro-batch has 8192 tokens and a vocabulary of 128,000, with fp32 logits. How many gigabytes per rank does a
          vocabulary-parallel cross-entropy on 8 ranks save compared with gathering the full logits? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 3.67, tolerance: 0.01 },
    },
    {
      key: "wrong",
      rung: "apply",
      prompt: <p>What goes wrong if both MLP weights are split by columns?</p>,
      answer: {
        kind: "choice",
        options: [
          "The second layer needs the full hidden activation, so it must be all-gathered between the layers as well",
          "The nonlinearity can no longer be applied on each rank",
          "Nothing; the communication is the same",
          "The output would be wrong even with extra communication",
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

def column_parallel(X, W, t):
    return [X @ Wi for Wi in np.split(W, t, axis=1)]   # rank i holds columns i of W and the full X

def row_parallel(Hs, W, t):
    parts = [Hi @ Wi for Hi, Wi in zip(Hs, np.split(W, t, axis=0))]
    return sum(parts)                             # all-reduce of the partial outputs

def tp_mlp(X, W1, W2, t):
    Hs = [np.maximum(H, 0.0) for H in column_parallel(X, W1, t)]   # element-wise, so no communication
    return row_parallel(Hs, W2, t)

X, W1 = np.array([[1.0, -2.0]]), np.array([[1.0, -1.0, 2.0, -2.0], [0.0, 1.0, -1.0, 3.0]])
print([h.tolist() for h in column_parallel(X, W1, 2)], tp_mlp(X, W1, np.ones((4, 1)), 2).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[[1.0, -3.0]], [[4.0, -8.0]]] [[5.0]]",
          "[[[1.0, 4.0]], [[-3.0, -8.0]]] [[5.0]]",
          "[[[1.0, -3.0]], [[4.0, -8.0]]] [[-6.0]]",
          "[[[1.0, -3.0]], [[4.0, -8.0]]] [[1.0]]",
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

def vocab_ce(shards, target):
    m = max(float(s.max()) for s in shards)      # all-reduce max
    z = sum(float(np.exp(s - m).sum()) for s in shards)   # all-reduce sum
    off, tl = 0, 0.0
    for s in shards:                              # only the owner contributes the target logit
        if off <= target < off + len(s):
            tl = float(s[target - off])
        off += len(s)
    return np.log(z) + m - tl

def tp_bytes(b, s, d, t, layers):
    per = 2 * (t - 1) / t * 2 * b * s * d         # one ring all-reduce of bf16 activations
    return 4 * layers * per                       # two forward and two backward per layer

def tp_comm_share(b, s, d, t, layers, flops, bw):
    comm = tp_bytes(b, s, d, t, layers) / bw
    compute = 72 * b * s * d * d * layers / (t * flops)
    return comm / (comm + compute)

loss = vocab_ce([np.array([1.0, 2.0]), np.array([0.0, 3.0])], 3)
print(round(loss, 4), tp_bytes(1, 4, 8, 2, 1), tp_comm_share(1, 4, 8, 2, 1, 9.0, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.4402 256.0 0.2", "0.4402 512.0 0.2", "3.4402 256.0 0.2", "0.4402 256.0 0.25"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>column_parallel(X, W, t)</C>, the list of each rank&apos;s <M>{"XW_i"}</M>; <C>row_parallel(Hs, W, t)</C>, the
          all-reduced sum of <M>{"H_i W^{(i)}"}</M>; and <C>tp_mlp(X, W1, W2, t)</C> with ReLU between them. Use equal splits.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def column_parallel(X, W, t):
    return [X @ W]

def row_parallel(Hs, W, t):
    return Hs[0]

def tp_mlp(X, W1, W2, t):
    return X @ W1 @ W2
`,
        solution: LAYERS,
        tests: [
          { name: "split", code: `X, W = np.arange(6.0).reshape(2, 3), np.arange(12.0).reshape(3, 4)\nhs = column_parallel(X, W, 2)\nassert len(hs) == 2 and hs[0].shape == (2, 2) and np.allclose(np.concatenate(hs, axis=1), X @ W)\nassert np.allclose(row_parallel([X[:, i:i + 1] for i in range(3)], W, 3), X @ W)` },
          { name: "mlp", code: `rng = np.random.default_rng(1)\nX, W1, W2 = rng.normal(size=(3, 4)), rng.normal(size=(4, 8)), rng.normal(size=(8, 5))\nref = np.maximum(X @ W1, 0.0) @ W2\nassert all(np.allclose(tp_mlp(X, W1, W2, t), ref) for t in (1, 2, 4))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>vocab_ce(shards, target)</C>, the cross-entropy of a token from logits split into consecutive vocabulary shards,
          stable for large logits; <C>tp_bytes(b, s, d, t, layers)</C>, bytes each rank sends in a training step; and{" "}
          <C>tp_comm_share(b, s, d, t, layers, flops, bw)</C>, communication&apos;s share of the step with no overlap.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def vocab_ce(shards, target):
    return 0.0

def tp_bytes(b, s, d, t, layers):
    return 2 * b * s * d * layers

def tp_comm_share(b, s, d, t, layers, flops, bw):
    return 0.0
`,
        solution: VOCAB,
        tests: [
          { name: "ce", code: `rng = np.random.default_rng(2)\nl = rng.normal(size=9)\nassert abs(vocab_ce(np.split(l, 3), 5) - (np.log(np.exp(l).sum()) - l[5])) < 1e-9\nassert abs(vocab_ce([np.array([1000.0]), np.array([1000.0])], 0) - np.log(2)) < 1e-9` },
          { name: "comm", code: `assert tp_bytes(2, 3, 4, 4, 2) == 576.0\nassert abs(tp_comm_share(1, 1, 9, 3, 1, 1.0, 1.0) - 4 / 85) < 1e-12` },
        ],
      },
    },
    {
      key: "share",
      rung: "stretch",
      prompt: (
        <p>
          With d = 4096, t = 8, 400 TFLOP/s and 450 GB/s, and no overlap, what fraction of a training step does tensor-parallel
          communication take? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.252, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Between the blocks, layer norms and dropout still run on the full activation on every rank, duplicating their work and their
        memory. The next lesson splits those along the sequence and turns each all-reduce into a reduce-scatter and an all-gather.
      </p>
    </>
  ),
};
