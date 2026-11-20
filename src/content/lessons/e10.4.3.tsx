import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RingAttentionViz } from "@/components/viz/RingAttentionViz";
import type { LessonContent } from "@/lib/types";

const RING = `import numpy as np

def attn_block(q, K, V, mask=None):
    z = q @ K.T / np.sqrt(q.shape[1])
    if mask is not None:
        z = np.where(mask, z, -np.inf)
    m = z.max(axis=1, keepdims=True)
    p = np.exp(z - m)
    return m, p.sum(axis=1, keepdims=True), p @ V   # running max, normaliser, unnormalised output

def merge(a, b):
    (ma, la, oa), (mb, lb, ob) = a, b
    m = np.maximum(ma, mb)
    fa, fb = np.exp(ma - m), np.exp(mb - m)
    return m, la * fa + lb * fb, oa * fa + ob * fb

def ring_attention(Qs, Ks, Vs, causal):
    c, out = len(Qs), []
    for i in range(c):                            # rank i keeps its own queries
        st = None
        for step in range(c):                     # and receives one key-value block per step
            j = (i - step) % c
            if causal and j > i:
                continue                          # every key in block j is in the future
            n = len(Qs[i])
            mask = np.tril(np.ones((n, n), bool)) if causal and j == i else None
            blk = attn_block(Qs[i], Ks[j], Vs[j], mask)
            st = blk if st is None else merge(st, blk)
        out.append(st[2] / st[1])
    return out`;

const BALANCE = `def causal_work(c, zigzag):
    chunks = [(i, 2 * c - 1 - i) if zigzag else (2 * i, 2 * i + 1) for i in range(c)]
    return [sum(q + 0.5 for q in pair) for pair in chunks]   # chunk q sees q earlier chunks and half of itself

def imbalance(c, zigzag):
    w = causal_work(c, zigzag)
    return max(w) / (sum(w) / len(w))

def ring_hidden(s, c, d, d_kv, F, B):
    n = s / c                                     # tokens per rank
    compute = 4 * n * n * d / F                   # QK^T and PV for one pair of blocks
    comm = 2 * 2 * n * d_kv / B                   # the next bf16 K and V blocks
    return compute >= comm`;

export const lesson: LessonContent = {
  id: "e10.4.3",
  minutes: 50,
  links: {
    requires: ["e10.4.2", "e9.4.1"],
    revisits: ["e7.5.3", "e8.2.4"],
    foreshadows: ["e10.7.1", "e10.7.2"],
  },

  puzzle: (
    <>
      <p>
        Training on sequences of a million tokens, a single layer&apos;s activations no longer fit on a GPU even with tensor and sequence
        parallelism, because attention needs every token&apos;s keys and values. Split the sequence across GPUs and each one holds only
        its own keys. How can a GPU attend to keys it does not hold, without ever gathering them all, and why does the obvious split of
        a causal sequence leave most GPUs idle?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each GPU keeps its queries and passes its key and value block to the next GPU in a ring. After c steps every query block has
        met every key block, one block at a time, and the online softmax (e9.4.1) merges the partial results exactly. While a GPU
        computes with the block it holds, the next block is already on its way, so the transfers hide behind the arithmetic when blocks
        are long enough. With a causal mask, though, early tokens have little to attend to, so the GPU holding the end of the sequence
        has the most work.
      </p>
      <RingAttentionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="ring attention">
        <p>
          With context-parallel degree c, rank i holds query, key and value blocks <M>{"Q_i, K_i, V_i"}</M> for a slice of the
          sequence. At step j it computes the attention state of <M>{"Q_i"}</M> against the block that started on rank{" "}
          <M>{"(i - j) \\bmod c"}</M> (<C>attn_block</C>), merges it into its running state (<C>merge</C>), and sends that block on to
          rank i + 1. Under a causal mask, blocks from later in the sequence are skipped and the diagonal block is masked (
          <C>ring_attention</C>). Every other layer is token-wise or tensor-parallel and needs no change.
        </p>
        <Code>{RING}</Code>
      </Definition>

      <Theorem title="exactness">
        <p>
          The output of ring attention equals full attention, causal or not, for any order of the blocks.
        </p>
      </Theorem>
      <Proof>
        <p>
          A state (m, l, o) records the maximum score, the sum of <M>{"e^{z - m}"}</M> and the sum of <M>{"e^{z - m}v"}</M> over the
          keys seen so far. Merging rescales both to the larger maximum and adds, which gives the state of the union of the key sets,
          and the operation is associative and commutative (e9.4.1). After all blocks the state covers every allowed key, and{" "}
          <M>{"o/l"}</M> is the softmax-weighted average of their values. Skipping a block whose keys are all masked leaves the union
          unchanged.
        </p>
      </Proof>

      <Theorem title="when the ring is hidden">
        <p>
          With n = s/c tokens per rank, one step computes <M>{"QK^\\top"}</M> and PV for an n by n block, about{" "}
          <M>{"4n^2 d"}</M> FLOPs, and receives K and V blocks of <M>{"4n\\,d_{kv}"}</M> bytes in bf16. At throughput F and link
          bandwidth B the transfer hides behind the compute exactly when
        </p>
        <MD>{"n \\ge \\frac{F}{B}\\cdot\\frac{d_{kv}}{d}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Compute takes <M>{"4n^2 d/F"}</M> and the transfer <M>{"4n\\,d_{kv}/B"}</M>, and the next block can be received while the
          current one is used, so the step costs the larger of the two; dividing gives the condition (<C>ring_hidden</C>). Grouped-query
          attention, with fewer key-value heads, lowers <M>{"d_{kv}"}</M> and so the threshold.
        </p>
      </Proof>

      <Theorem title="balancing a causal mask">
        <p>
          Cut the sequence into 2c chunks. Chunk q attends to q earlier chunks and half of itself, q + ½ chunk-blocks of work. Giving
          rank i chunks 2i and 2i + 1 gives it 4i + 2, so the slowest rank does <M>{"(4c-2)/(2c)"}</M> times the mean. Giving rank i
          chunks i and 2c − 1 − i gives every rank exactly 2c.
        </p>
      </Theorem>
      <Proof>
        <p>
          Contiguous: <M>{"(2i + \\tfrac12) + (2i + 1 + \\tfrac12) = 4i + 2"}</M>, largest at i = c − 1, while the total{" "}
          <M>{"\\sum_q (q + \\tfrac12) = 2c^2"}</M> gives a mean of 2c. Zig-zag:{" "}
          <M>{"(i + \\tfrac12) + (2c - 1 - i + \\tfrac12) = 2c"}</M> for every i (<C>causal_work</C>, <C>imbalance</C>).
        </p>
        <Code>{BALANCE}</Code>
      </Proof>

      <Remark title="variants">
        <p>
          Instead of a ring, the ranks can all-gather the keys and values for each layer and compute locally; this moves the same bytes
          in one collective, is simpler, and suits grouped-query attention where the keys and values are small, at the cost of holding
          them all at once. Ring and all-gather variants are both called context parallelism. The zig-zag layout changes which tokens
          each rank owns, so position ids and the loss must follow the same permutation.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          A rank attends to keys it does not hold by receiving them one block at a time and folding each into an online-softmax state;
          nothing is gathered in full and the result is exact. A contiguous split of a causal sequence gives the last rank nearly twice
          the mean work, so the others wait; pairing each early chunk with a late one balances the ranks exactly.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "slowest",
      rung: "check",
      prompt: <p>With c = 8 and contiguous chunks, how many times the mean work does the slowest rank do under a causal mask?</p>,
      answer: { kind: "numeric", value: 1.875, tolerance: 0.001 },
    },
    {
      key: "threshold",
      rung: "check",
      prompt: (
        <p>
          With 400 TFLOP/s, 50 GB/s between ranks, d = 8192 and grouped-query attention with <M>{"d_{kv}"}</M> = 1024, what is the
          smallest number of tokens per rank for which the ring transfers are hidden?
        </p>
      ),
      answer: { kind: "numeric", value: 1000, tolerance: 0 },
    },
    {
      key: "order",
      rung: "apply",
      prompt: <p>Why can the key-value blocks arrive in a different order on every rank without changing the output?</p>,
      answer: {
        kind: "choice",
        options: [
          "Merging online-softmax states is associative and commutative",
          "Attention ignores the order of keys only when there is no mask",
          "Each rank sorts the blocks before merging",
          "The order changes the output, but only within rounding",
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

def attn_block(q, K, V, mask=None):
    z = q @ K.T / np.sqrt(q.shape[1])
    if mask is not None:
        z = np.where(mask, z, -np.inf)
    m = z.max(axis=1, keepdims=True)
    p = np.exp(z - m)
    return m, p.sum(axis=1, keepdims=True), p @ V   # running max, normaliser, unnormalised output

def merge(a, b):
    (ma, la, oa), (mb, lb, ob) = a, b
    m = np.maximum(ma, mb)
    fa, fb = np.exp(ma - m), np.exp(mb - m)
    return m, la * fa + lb * fb, oa * fa + ob * fb

def ring_attention(Qs, Ks, Vs, causal):
    c, out = len(Qs), []
    for i in range(c):                            # rank i keeps its own queries
        st = None
        for step in range(c):                     # and receives one key-value block per step
            j = (i - step) % c
            if causal and j > i:
                continue                          # every key in block j is in the future
            n = len(Qs[i])
            mask = np.tril(np.ones((n, n), bool)) if causal and j == i else None
            blk = attn_block(Qs[i], Ks[j], Vs[j], mask)
            st = blk if st is None else merge(st, blk)
        out.append(st[2] / st[1])
    return out

Qs, Ks, Vs = [np.array([[0.0]]), np.array([[1.0]])], [np.array([[0.0]]), np.array([[1.0]])], [np.array([[1.0]]), np.array([[3.0]])]
print([round(float(o[0, 0]), 4) for o in ring_attention(Qs, Ks, Vs, False)], [round(float(o[0, 0]), 4) for o in ring_attention(Qs, Ks, Vs, True)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[2.0, 2.4621] [1.0, 2.4621]", "[2.0, 2.4621] [2.0, 2.4621]", "[2.0, 2.0] [1.0, 3.0]", "[2.0, 2.4621] [1.0, 3.0]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def causal_work(c, zigzag):
    chunks = [(i, 2 * c - 1 - i) if zigzag else (2 * i, 2 * i + 1) for i in range(c)]
    return [sum(q + 0.5 for q in pair) for pair in chunks]   # chunk q sees q earlier chunks and half of itself

def imbalance(c, zigzag):
    w = causal_work(c, zigzag)
    return max(w) / (sum(w) / len(w))

def ring_hidden(s, c, d, d_kv, F, B):
    n = s / c                                     # tokens per rank
    compute = 4 * n * n * d / F                   # QK^T and PV for one pair of blocks
    comm = 2 * 2 * n * d_kv / B                   # the next bf16 K and V blocks
    return compute >= comm

w = causal_work(2, False)
print(w, causal_work(2, True), imbalance(4, False), ring_hidden(4096, 4, 64, 64, 100.0, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.0, 6.0] [4.0, 4.0] 1.75 True",
          "[2.0, 6.0] [4.0, 4.0] 1.75 False",
          "[1.0, 3.0] [2.0, 2.0] 1.75 True",
          "[2.0, 6.0] [4.0, 4.0] 2.0 True",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>attn_block(q, K, V, mask=None)</C>, the state (m, l, o) of scaled dot-product attention with masked scores set to
          −∞; <C>merge(a, b)</C>; and <C>ring_attention(Qs, Ks, Vs, causal)</C>, returning each rank&apos;s output, with blocks of equal
          length and the diagonal block masked when causal.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def attn_block(q, K, V, mask=None):
    return q @ K.T @ V

def merge(a, b):
    return a

def ring_attention(Qs, Ks, Vs, causal):
    return Qs
`,
        solution: RING,
        tests: [
          { name: "merge", code: `rng = np.random.default_rng(4)\nq, K, V = rng.normal(size=(2, 3)), rng.normal(size=(4, 3)), rng.normal(size=(4, 2))\nz = q @ K.T / np.sqrt(3)\np = np.exp(z - z.max(axis=1, keepdims=True))\nref = p @ V / p.sum(axis=1, keepdims=True)\nm, l, o = merge(attn_block(q, K[:1], V[:1]), attn_block(q, K[1:], V[1:]))\nassert np.allclose(o / l, ref)` },
          { name: "ring", code: `rng = np.random.default_rng(5)\nQ, K, V = rng.normal(size=(8, 4)), rng.normal(size=(8, 4)), rng.normal(size=(8, 3))\nz = Q @ K.T / 2.0\nfor causal in (False, True):\n    zz = np.where(np.tril(np.ones((8, 8), bool)), z, -np.inf) if causal else z\n    p = np.exp(zz - zz.max(axis=1, keepdims=True))\n    ref = p @ V / p.sum(axis=1, keepdims=True)\n    out = ring_attention(np.split(Q, 4), np.split(K, 4), np.split(V, 4), causal)\n    assert np.allclose(np.concatenate(out), ref)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>causal_work(c, zigzag)</C>, each rank&apos;s chunk-blocks of causal attention with 2c chunks;{" "}
          <C>imbalance(c, zigzag)</C>, the slowest rank&apos;s work over the mean; and <C>ring_hidden(s, c, d, d_kv, F, B)</C>, whether
          one step&apos;s compute is at least its transfer.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def causal_work(c, zigzag):
    return [2.0 * c] * c

def imbalance(c, zigzag):
    return 1.0

def ring_hidden(s, c, d, d_kv, F, B):
    return True
`,
        solution: BALANCE,
        tests: [
          { name: "work", code: `assert causal_work(3, False) == [2.0, 6.0, 10.0] and causal_work(3, True) == [6.0, 6.0, 6.0]\nassert abs(imbalance(3, False) - 5 / 3) < 1e-12 and imbalance(5, True) == 1.0` },
          { name: "hidden", code: `assert ring_hidden(100, 1, 1, 1, 10.0, 1.0) and not ring_hidden(100, 20, 1, 1, 10.0, 1.0)\nassert ring_hidden(100, 20, 1, 1, 10.0, 4.0)` },
        ],
      },
    },
    {
      key: "idle",
      rung: "stretch",
      prompt: (
        <p>
          With c = 8 and contiguous chunks under a causal mask, if every rank waits for the slowest one, what fraction of the total
          rank-time is spent idle? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.467, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Tensor, sequence and context parallelism all split work within a layer and communicate in every layer. The next section splits
        the model between layers instead, which sends far less data but makes GPUs wait for one another.
      </p>
    </>
  ),
};
