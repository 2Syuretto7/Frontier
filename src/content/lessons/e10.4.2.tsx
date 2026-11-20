import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SeqParallelViz } from "@/components/viz/SeqParallelViz";
import type { LessonContent } from "@/lib/types";

const BLOCK = `import numpy as np

def reduce_scatter_seq(partials, t):
    return np.split(sum(partials), t, axis=0)     # sum the ranks' partial outputs, keep one block of rows each

def all_gather_seq(shards):
    return np.concatenate(shards, axis=0)         # rows are tokens

def sp_block(X_shards, W1, W2, g):
    t = len(X_shards)
    normed = [x / np.sqrt((x * x).mean(axis=1, keepdims=True) + 1e-6) * g for x in X_shards]   # per token
    X = all_gather_seq(normed)                    # replaces the identity before the column-parallel layer
    Hs = [np.maximum(X @ W, 0.0) for W in np.split(W1, t, axis=1)]
    partials = [H @ W for H, W in zip(Hs, np.split(W2, t, axis=0))]
    return [x + y for x, y in zip(X_shards, reduce_scatter_seq(partials, t))]   # residual on each shard`;

const MEMORY = `def act_bytes(s, b, d, a, t, sp):
    split = 34 / t if sp else 10 + 24 / t         # sequence parallelism splits the 10sbd outside the blocks
    return s * b * d * (split + 5 * a * s / (d * t))

def max_seq(budget, b, d, a, t, sp, layers):
    lo, hi = 0, 1
    while layers * act_bytes(hi, b, d, a, t, sp) <= budget:
        hi *= 2
    while hi - lo > 1:                            # largest s that fits
        mid = (lo + hi) // 2
        if layers * act_bytes(mid, b, d, a, t, sp) <= budget:
            lo = mid
        else:
            hi = mid
    return lo

def layer_comm(b, s, d, t, sp):
    n = 2 * b * s * d                             # bf16 activation
    if sp:
        return 4 * (t - 1) / t * n                # two all-gathers and two reduce-scatters
    return 2 * 2 * (t - 1) / t * n                # two all-reduces`;

export const lesson: LessonContent = {
  id: "e10.4.2",
  minutes: 45,
  links: {
    requires: ["e10.4.1", "e7.6.2"],
    revisits: ["e8.2.2", "e6.4.3"],
    foreshadows: ["e10.4.3", "e10.7.3"],
  },

  puzzle: (
    <>
      <p>
        With 8-way tensor parallelism the matrices inside attention and the MLP are split 8 ways, yet the activation memory per GPU
        falls by far less than 8. The layer norms, dropouts and residual additions between the blocks still hold the full activation
        on every GPU. Splitting them seems to need more communication. Can it be done for free?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The operations between the blocks act on each token separately, so they can be split along the sequence instead of the hidden
        dimension. The all-reduce that ends a tensor-parallel block is a reduce-scatter followed by an all-gather. Stop after the
        reduce-scatter and each rank holds the summed output for its own slice of tokens, exactly what the token-wise operations need.
        Do the all-gather just before the next block, which needs the full sequence. The bytes moved are unchanged.
      </p>
      <SeqParallelViz />
    </>
  ),

  theory: (
    <>
      <Definition title="sequence parallelism">
        <p>
          Outside the tensor-parallel blocks, rank i holds rows <M>{"[is/t, (i+1)s/t)"}</M> of the activation. Before a
          column-parallel layer the ranks all-gather along the sequence (<C>all_gather_seq</C>); after a row-parallel layer they
          reduce-scatter the partial outputs along the sequence (<C>reduce_scatter_seq</C>). Norms, dropout and residual additions run
          on the local rows (<C>sp_block</C>).
        </p>
        <Code>{BLOCK}</Code>
      </Definition>

      <Theorem title="same communication, less memory">
        <p>
          Per layer and direction, sequence parallelism replaces two all-reduces with two all-gathers and two reduce-scatters, moving
          the same number of bytes. In the accounting of e7.6.2 the stored activations per layer fall from{" "}
          <M>{"sbd\\,(10 + 24/t + 5as/(dt))"}</M> to
        </p>
        <MD>{"sbd\\left(\\frac{34}{t} + \\frac{5as}{dt}\\right)."}</MD>
      </Theorem>
      <Proof>
        <p>
          A ring all-reduce of n bytes sends <M>{"2(t-1)n/t"}</M> per rank, a reduce-scatter and an all-gather{" "}
          <M>{"(t-1)n/t"}</M> each (e8.2.2), so the totals agree (<C>layer_comm</C>). The 10sbd term counts what the norms, dropout
          masks and residual inputs store outside the blocks; split along the sequence it becomes 10sbd/t, and 10/t + 24/t = 34/t (
          <C>act_bytes</C>).
        </p>
        <Code>{MEMORY}</Code>
      </Proof>

      <Remark title="details that matter">
        <p>
          A norm&apos;s gain and bias are replicated, but each rank now sees only its tokens, so their gradients are partial sums and
          need an all-reduce across the tensor-parallel group; forgetting it lets the replicas drift. Dropout must draw different masks
          for different token slices, so each rank seeds its generator by its rank. The column-parallel layer&apos;s backward pass now
          needs the gathered input, which is either kept or re-gathered, and the latter is usually cheaper than storing it. With
          fused attention kernels the 5as/(dt) term disappears (e9.4.2), leaving 34/t: sequence parallelism then completes the 1/t
          scaling that tensor parallelism started.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The memory left behind by tensor parallelism is the 10sbd of token-wise work, and splitting it along the sequence costs
          nothing extra, because the collectives already in place, the all-reduces, are each split into their two halves and the halves
          moved to where the layout changes. Only the small parameter gradients of the norms add an all-reduce.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "saved",
      rung: "check",
      prompt: (
        <p>
          With s = 4096, b = 1, d = 8192, a = 64 heads and t = 8, how many gigabytes of activations per GPU does sequence parallelism
          save over 80 layers? Use the accounting above and give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 23.49, tolerance: 0.01 },
    },
    {
      key: "longest",
      rung: "check",
      prompt: (
        <p>
          With b = 1, d = 8192, a = 64, t = 8, 80 layers and sequence parallelism, what is the longest sequence whose activations fit
          in 40 GB (10<sup>9</sup> bytes)?
        </p>
      ),
      answer: { kind: "numeric", value: 3127, tolerance: 0 },
    },
    {
      key: "ln",
      rung: "apply",
      prompt: <p>Which gradient needs an extra all-reduce across the tensor-parallel group once sequence parallelism is on?</p>,
      answer: {
        kind: "choice",
        options: [
          "The layer norm's gain and bias, since each rank sees only its own tokens",
          "The column-parallel weight, since its input is gathered",
          "The row-parallel weight, since its output is scattered",
          "None; the gradients are unchanged",
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

def reduce_scatter_seq(partials, t):
    return np.split(sum(partials), t, axis=0)     # sum the ranks' partial outputs, keep one block of rows each

def all_gather_seq(shards):
    return np.concatenate(shards, axis=0)         # rows are tokens

def sp_block(X_shards, W1, W2, g):
    t = len(X_shards)
    normed = [x / np.sqrt((x * x).mean(axis=1, keepdims=True) + 1e-6) * g for x in X_shards]   # per token
    X = all_gather_seq(normed)                    # replaces the identity before the column-parallel layer
    Hs = [np.maximum(X @ W, 0.0) for W in np.split(W1, t, axis=1)]
    partials = [H @ W for H, W in zip(Hs, np.split(W2, t, axis=0))]
    return [x + y for x, y in zip(X_shards, reduce_scatter_seq(partials, t))]   # residual on each shard

partials = [np.ones((4, 1)), np.arange(4.0).reshape(4, 1)]
print([s.ravel().tolist() for s in reduce_scatter_seq(partials, 2)], all_gather_seq([np.array([[1.0]]), np.array([[2.0], [3.0]])]).ravel().tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1.0, 2.0], [3.0, 4.0]] [1.0, 2.0, 3.0]",
          "[[1.0, 3.0], [2.0, 4.0]] [1.0, 2.0, 3.0]",
          "[[2.0, 4.0], [6.0, 8.0]] [1.0, 2.0, 3.0]",
          "[[1.0, 2.0], [3.0, 4.0]] [1.0, 2.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def act_bytes(s, b, d, a, t, sp):
    split = 34 / t if sp else 10 + 24 / t         # sequence parallelism splits the 10sbd outside the blocks
    return s * b * d * (split + 5 * a * s / (d * t))

def max_seq(budget, b, d, a, t, sp, layers):
    lo, hi = 0, 1
    while layers * act_bytes(hi, b, d, a, t, sp) <= budget:
        hi *= 2
    while hi - lo > 1:                            # largest s that fits
        mid = (lo + hi) // 2
        if layers * act_bytes(mid, b, d, a, t, sp) <= budget:
            lo = mid
        else:
            hi = mid
    return lo

def layer_comm(b, s, d, t, sp):
    n = 2 * b * s * d                             # bf16 activation
    if sp:
        return 4 * (t - 1) / t * n                # two all-gathers and two reduce-scatters
    return 2 * 2 * (t - 1) / t * n                # two all-reduces

x = (act_bytes(64, 1, 32, 2, 4, False), act_bytes(64, 1, 32, 2, 4, True))
print(x, layer_comm(1, 8, 4, 4, False), layer_comm(1, 8, 4, 4, True), max_seq(100000, 1, 32, 2, 4, True, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(43008.0, 27648.0) 192.0 192.0 97",
          "(43008.0, 27648.0) 192.0 384.0 97",
          "(43008.0, 43008.0) 192.0 192.0 97",
          "(32768.0, 27648.0) 192.0 192.0 97",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>reduce_scatter_seq(partials, t)</C>, summing the partial outputs and returning t equal row blocks;{" "}
          <C>all_gather_seq(shards)</C>; and <C>sp_block(X_shards, W1, W2, g)</C>, which RMS-normalises each token (mean square plus
          10<sup>−6</sup>) with gain g, gathers, runs a tensor-parallel ReLU MLP, reduce-scatters and adds the residual on each shard.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def reduce_scatter_seq(partials, t):
    return partials

def all_gather_seq(shards):
    return shards[0]

def sp_block(X_shards, W1, W2, g):
    return X_shards
`,
        solution: BLOCK,
        tests: [
          { name: "collect", code: `out = reduce_scatter_seq([np.eye(4), np.eye(4)], 2)\nassert len(out) == 2 and np.allclose(out[1], 2 * np.eye(4)[2:])\nassert all_gather_seq([np.ones((1, 3)), np.zeros((2, 3))]).shape == (3, 3)` },
          { name: "block", code: `rng = np.random.default_rng(3)\nX, W1, W2, g = rng.normal(size=(8, 4)), rng.normal(size=(4, 8)), rng.normal(size=(8, 4)), rng.normal(size=4)\nn = X / np.sqrt((X * X).mean(axis=1, keepdims=True) + 1e-6) * g\nref = X + np.maximum(n @ W1, 0.0) @ W2\nassert all(np.allclose(np.concatenate(sp_block(np.split(X, t), W1, W2, g)), ref) for t in (1, 2, 4))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>act_bytes(s, b, d, a, t, sp)</C>, stored activation bytes per layer; <C>max_seq(budget, b, d, a, t, sp,
          layers)</C>, the longest sequence that fits; and <C>layer_comm(b, s, d, t, sp)</C>, bytes each rank sends per layer in one
          direction with bf16 activations.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def act_bytes(s, b, d, a, t, sp):
    return s * b * d * 34

def max_seq(budget, b, d, a, t, sp, layers):
    return 0

def layer_comm(b, s, d, t, sp):
    return 0.0
`,
        solution: MEMORY,
        tests: [
          { name: "memory", code: `assert act_bytes(8, 2, 4, 1, 2, False) == 1728.0 and act_bytes(8, 2, 4, 1, 2, True) == 1408.0\nassert act_bytes(10, 1, 5, 1, 2, True) == 1100.0` },
          { name: "fit", code: `assert max_seq(1000, 1, 4, 1, 2, True, 1) == 10 and max_seq(1000, 1, 4, 1, 2, False, 1) == 9\nassert layer_comm(1, 2, 3, 3, True) == 32.0 == layer_comm(1, 2, 3, 3, False)` },
        ],
      },
    },
    {
      key: "longer",
      rung: "stretch",
      prompt: (
        <p>
          With the same model but a 20 GB activation budget, how many more tokens per sequence does sequence parallelism allow than
          tensor parallelism alone?
        </p>
      ),
      answer: { kind: "numeric", value: 601, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Sequence parallelism splits the sequence only between the blocks; attention itself still sees every token on every rank. The
        next lesson splits attention along the sequence too, passing keys and values around a ring.
      </p>
    </>
  ),
};
