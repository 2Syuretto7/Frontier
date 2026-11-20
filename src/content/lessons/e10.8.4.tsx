import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ReductionOrderViz } from "@/components/viz/ReductionOrderViz";
import type { LessonContent } from "@/lib/types";

const REDUCE = `import numpy as np

def pairwise(x):
    x = np.asarray(x, dtype=np.float32)
    while len(x) > 1:                             # add neighbours level by level: a fixed binary tree
        if len(x) % 2:
            x = np.append(x, np.float32(0))
        x = x[0::2] + x[1::2]
    return x[0]

def dp_sum(samples, N):
    blocks = np.split(np.asarray(samples, dtype=np.float32), N)
    local = [sum(b, np.float32(0)) for b in blocks]   # each rank adds its samples in order
    total = np.float32(0)
    for v in local:                               # then the ranks' sums in rank order
        total = np.float32(total + v)
    return total

def tree_dp_sum(samples, N):
    blocks = np.split(np.asarray(samples, dtype=np.float32), N)
    return pairwise([pairwise(b) for b in blocks])   # the same tree as pairwise(samples) for powers of two`;

const SAMPLES = `import numpy as np

def shard_samples(G, N, r):
    k = G // N
    return list(range(r * k, (r + 1) * k))       # contiguous global sample indices

def stream_masks(seed, N, G, size, p):
    out = []
    for r in range(N):                            # one generator per rank: masks depend on N
        rng = np.random.default_rng(seed + r)
        out += [rng.random(size) >= p for _ in shard_samples(G, N, r)]
    return out

def keyed_masks(seed, G, N, size, p):
    out = []
    for r in range(N):                            # one generator per sample: masks do not depend on N
        out += [np.random.default_rng([seed, i]).random(size) >= p for i in shard_samples(G, N, r)]
    return out`;

export const lesson: LessonContent = {
  id: "e10.8.4",
  minutes: 45,
  links: {
    requires: ["e10.8.2", "e5.4.2"],
    revisits: ["e10.2.1", "e10.8.1"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        A run on 64 GPUs loses a node and continues elastically on 56. Later the team replays the same steps on 64 GPUs to debug a loss
        spike, from the same checkpoint, data and seed, and the losses differ from the original run in the fifth significant digit after
        a few hundred steps. Nothing is broken. Where did the difference come from, and what would it take to make the replay exact?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Floating-point addition rounds after every step, so the order of additions changes the last bits of a sum. Data parallelism
        decides that order: each rank adds its own samples, and then the ranks&apos; sums are combined. A different number of ranks
        groups the samples differently and gives a slightly different gradient; training then amplifies the difference. Fixing the
        grouping to depend only on the global sample index, not on the number of ranks, removes it.
      </p>
      <ReductionOrderViz />
    </>
  ),

  theory: (
    <>
      <Definition title="where the bits come from">
        <p>
          Rounded addition <M>{"a \\oplus b = \\mathrm{fl}(a + b)"}</M> is commutative but not associative (e5.4.2). A data-parallel
          gradient over global batch indices <M>{"0, \\dots, G - 1"}</M> on N ranks is a particular bracketing of the G terms:{" "}
          <C>dp_sum</C> adds each rank&apos;s contiguous block in order and then the ranks in rank order, so its bracketing depends on N.
          The function <C>pairwise</C> instead adds neighbours level by level, padding with zero, which fixes one bracketing for a given
          G; <C>tree_dp_sum</C> applies it within each block and then across the blocks.
        </p>
        <Code>{REDUCE}</Code>
      </Definition>

      <Theorem title="a reduction that ignores the world size">
        <p>
          If G/N is a power of two, <C>tree_dp_sum(x, N)</C> equals <C>pairwise(x)</C> bit for bit, for every input.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"b = G/N = 2^k"}</M>. The first k levels of the global tree only add neighbours inside aligned groups of size{" "}
          <M>{"2^k"}</M>, and these groups are exactly the blocks, with no padding since every level has even length. So after k levels
          the global tree holds the N values <M>{"\\texttt{pairwise}(\\text{block}_r)"}</M>, computed by identical operations. From there
          both computations run <C>pairwise</C> on the same N values. Equal operations on equal operands round equally, so the results
          agree in every bit.
        </p>
      </Proof>

      <Definition title="randomness keyed by sample">
        <p>
          Dropout masks and data augmentation draw random numbers. A generator per rank, seeded by seed + r (<C>stream_masks</C>), hands
          sample i whatever comes next in its rank&apos;s stream, which changes with N. Seeding a generator by the pair (seed, i) (
          <C>keyed_masks</C>) makes the draw a function of the global sample index alone. The same applies to the data order itself:
          the shuffled sequence of global indices depends only on the seed and epoch, and each rank takes its contiguous share (
          <C>shard_samples</C>), as in e10.2.1.
        </p>
        <Code>{SAMPLES}</Code>
      </Definition>

      <Remark title="two levels of determinism">
        <p>
          Run-to-run determinism, on a fixed configuration, needs kernels without floating-point atomics (whose order depends on thread
          timing), collectives whose algorithm and chunking do not change between runs, and a fixed data order and seed; frameworks
          expose switches for the deterministic kernels. Invariance across world sizes, needed to compare runs before and after an
          elastic restart or a resharded checkpoint (e10.8.1), additionally needs reductions and randomness defined over global
          indices, as above. Both cost speed: deterministic kernels give up atomics and some fused paths, and a fixed tree constrains
          which collective algorithm may run. Batch-invariant kernels, whose result for one row does not depend on the other rows in
          the batch, extend the same idea to inference. Many teams accept nondeterminism in production and keep a deterministic mode for
          debugging.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The 56-GPU segment grouped the gradient sums differently from the 64-GPU replay, and per-rank random streams gave different
          dropout masks to the same samples. Each difference was a rounding error at first, but training compounds them. With a fixed
          reduction tree over global indices, masks keyed by sample, and deterministic kernels, the replay matches exactly whenever both
          world sizes are powers of two that divide the batch.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "order",
      rung: "check",
      prompt: (
        <p>
          In float32, rank 0 holds 1e8, ranks 1 to 22 each hold 1.0, and rank 23 holds −1e8. Summing in rank order gives 0. What does
          the sum give if ranks 1 to 22 are added first, then rank 0, then rank 23?
        </p>
      ),
      answer: { kind: "numeric", value: 24, tolerance: 0 },
    },
    {
      key: "spacing",
      rung: "check",
      prompt: <p>What is the gap between consecutive float32 numbers near 5 million?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why can the same data, seed and checkpoint give different bits on 56 GPUs and on 64?</p>,
      answer: {
        kind: "choice",
        options: [
          "Rounded addition is not associative, and the number of ranks decides how the gradient terms are grouped",
          "Some GPUs compute multiplication less accurately than others",
          "The learning rate is scaled with the number of GPUs",
          "Collectives drop small values when more ranks take part",
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

def pairwise(x):
    x = np.asarray(x, dtype=np.float32)
    while len(x) > 1:                             # add neighbours level by level: a fixed binary tree
        if len(x) % 2:
            x = np.append(x, np.float32(0))
        x = x[0::2] + x[1::2]
    return x[0]

def dp_sum(samples, N):
    blocks = np.split(np.asarray(samples, dtype=np.float32), N)
    local = [sum(b, np.float32(0)) for b in blocks]   # each rank adds its samples in order
    total = np.float32(0)
    for v in local:                               # then the ranks' sums in rank order
        total = np.float32(total + v)
    return total

def tree_dp_sum(samples, N):
    blocks = np.split(np.asarray(samples, dtype=np.float32), N)
    return pairwise([pairwise(b) for b in blocks])   # the same tree as pairwise(samples) for powers of two

s = [1.0, 1.0, 1.0, 1.0, 1e8, -1e8, 1.0, 1.0]
print(float(dp_sum(s, 1)), float(dp_sum(s, 2)), float(pairwise(s)), float(tree_dp_sum(s, 4)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["2.0 6.0 6.0 6.0", "6.0 6.0 6.0 6.0", "2.0 2.0 6.0 6.0", "2.0 6.0 6.0 2.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def shard_samples(G, N, r):
    k = G // N
    return list(range(r * k, (r + 1) * k))       # contiguous global sample indices

def stream_masks(seed, N, G, size, p):
    out = []
    for r in range(N):                            # one generator per rank: masks depend on N
        rng = np.random.default_rng(seed + r)
        out += [rng.random(size) >= p for _ in shard_samples(G, N, r)]
    return out

def keyed_masks(seed, G, N, size, p):
    out = []
    for r in range(N):                            # one generator per sample: masks do not depend on N
        out += [np.random.default_rng([seed, i]).random(size) >= p for i in shard_samples(G, N, r)]
    return out

k, m = [keyed_masks(0, 12, n, 6, 0.3) for n in (2, 4)], [stream_masks(0, n, 12, 6, 0.3) for n in (2, 4)]
print(shard_samples(12, 4, 1), all((a == b).all() for a, b in zip(*k)), all((a == b).all() for a, b in zip(*m)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[3, 4, 5] True False", "[3, 4, 5] True True", "[6, 7, 8] True False", "[3, 4, 5] False False"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pairwise(x)</C>, the level-by-level float32 tree sum padding odd levels with zero; <C>dp_sum(samples, N)</C>, in-order
          sums per contiguous block combined in rank order; and <C>tree_dp_sum(samples, N)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def pairwise(x):
    return float(sum(x))

def dp_sum(samples, N):
    return sum(samples)

def tree_dp_sum(samples, N):
    return 0.0
`,
        solution: REDUCE,
        tests: [
          { name: "pairwise", code: `v = [16777216.0, 1.0, 1.0, 1.0]\nassert pairwise([1.0, 2.0, 3.0]) == 6.0 and pairwise(v) == 16777218.0\nassert dp_sum(v, 1) == 16777216.0 and dp_sum(v, 2) == 16777218.0` },
          { name: "tree", code: `x = (np.random.default_rng(1).normal(size=64) * 1e3).astype(np.float32)\nassert all(tree_dp_sum(x, n) == pairwise(x) for n in (1, 2, 4, 8, 16, 32, 64))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>shard_samples(G, N, r)</C>; <C>stream_masks(seed, N, G, size, p)</C>, with generator <C>default_rng(seed + r)</C> on
          rank r; and <C>keyed_masks(seed, G, N, size, p)</C>, with generator <C>default_rng([seed, i])</C> for sample i. A mask keeps
          entries whose uniform draw is at least p.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def shard_samples(G, N, r):
    return list(range(G))

def stream_masks(seed, N, G, size, p):
    return []

def keyed_masks(seed, G, N, size, p):
    return []
`,
        solution: SAMPLES,
        tests: [
          { name: "shard", code: `assert shard_samples(12, 3, 1) == [4, 5, 6, 7] and shard_samples(4, 4, 3) == [3]` },
          { name: "masks", code: `a, b = keyed_masks(5, 12, 1, 4, 0.3), keyed_masks(5, 12, 3, 4, 0.3)\nassert len(a) == 12 and all((u == v).all() for u, v in zip(a, b))\nassert all((u == (np.random.default_rng([5, i]).random(4) >= 0.3)).all() for i, u in enumerate(a))\nrng = np.random.default_rng(5)\nref = [rng.random(4) >= 0.3 for _ in range(4)]\ns = stream_masks(5, 1, 4, 4, 0.3)\nassert len(s) == 4 and all((u == v).all() for u, v in zip(s, ref))` },
        ],
      },
    },
    {
      key: "divisors",
      rung: "stretch",
      prompt: (
        <p>
          A global batch of 96 samples is split into N equal contiguous blocks, for each N that divides 96. For how many of these N does{" "}
          <C>tree_dp_sum(x, N)</C> equal <C>pairwise(x)</C> for every input x?
        </p>
      ),
      answer: { kind: "numeric", value: 7, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        This closes the course. A large run is now a mesh of data, tensor, pipeline and expert groups, sharded state that survives
        failures and resharding, and arithmetic whose order is a design choice rather than an accident.
      </p>
    </>
  ),
};
