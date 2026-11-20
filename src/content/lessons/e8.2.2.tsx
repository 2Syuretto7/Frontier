import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CollectiveOpsViz } from "@/components/viz/CollectiveOpsViz";
import type { LessonContent } from "@/lib/types";

const SEMANTICS = `def all_gather(chunks):
    full = [x for c in chunks for x in c]
    return [list(full) for _ in chunks]

def reduce_scatter(vectors):
    p, n = len(vectors), len(vectors[0])
    c = n // p
    return [[sum(v[i] for v in vectors) for i in range(r * c, (r + 1) * c)] for r in range(p)]

def all_reduce(vectors):
    return all_gather(reduce_scatter(vectors))`;

const ZERO = `def comm_volume(op, n, p):
    factor = 2 if op == 'all_reduce' else 1
    return factor * (p - 1) * n / p

def zero_memory(psi, p, stage):
    params, grads, opt = 2 * psi, 2 * psi, 12 * psi
    if stage >= 1:
        opt /= p
    if stage >= 2:
        grads /= p
    if stage >= 3:
        params /= p
    return params + grads + opt

def step_volume(psi, p, stage):
    return (3 if stage == 3 else 2) * (p - 1) / p * psi`;

export const lesson: LessonContent = {
  id: "e8.2.2",
  minutes: 50,
  links: {
    requires: ["e8.2.1"],
    revisits: ["e6.4.4", "e8.1.3"],
    foreshadows: ["e8.2.4", "e8.2.5"],
  },

  puzzle: (
    <>
      <p>
        In data-parallel training every rank computes a gradient on its own part of the batch, and every rank needs the
        average of all of them before it can take a step. A reduce to rank 0 followed by a broadcast would work, but it routes
        every byte through one rank. Is there a way to give everyone the sum in which all ranks share the work equally, and
        does it ever pay to stop halfway?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Cut each rank&apos;s vector into p chunks and make rank i responsible for chunk i. First, every rank sends each chunk to
        the rank responsible for it, which adds them up: now rank i holds the finished sum of chunk i. This is a{" "}
        <em>reduce-scatter</em>. Then every rank sends its finished chunk to all the others, an <em>all-gather</em>, and everyone
        has the whole sum. Together they make an <em>all-reduce</em>, with every rank doing the same amount of work. Sharded
        training stops halfway on purpose: if each rank only ever updates its own chunk of the parameters, the reduce-scatter
        alone is enough.
      </p>
      <CollectiveOpsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="three collectives">
        <p>
          Let p ranks each hold a vector <M>{"v_r"}</M> of length n, divided into p chunks <M>{"v_r^{(0)}, \\dots, v_r^{(p-1)}"}</M>.
        </p>
        <ul>
          <li><em>All-gather</em>: rank r starts with one chunk <M>{"c_r"}</M>, and every rank ends with the concatenation <M>{"(c_0, \\dots, c_{p-1})"}</M>.</li>
          <li><em>Reduce-scatter</em>: rank r ends with <M>{"\\sum_s v_s^{(r)}"}</M>, the reduced chunk r.</li>
          <li><em>All-reduce</em>: every rank ends with <M>{"\\sum_s v_s"}</M>.</li>
        </ul>
        <p>
          The code gives their meaning, not an algorithm: it computes the result centrally. How to compute it with messages is
          the subject of e8.2.4.
        </p>
        <Code>{SEMANTICS}</Code>
      </Definition>

      <Theorem title="all-reduce is reduce-scatter then all-gather">
        <p>
          For any vectors whose length is a multiple of p, <C>all_reduce(vs) == all_gather(reduce_scatter(vs))</C>. Moreover,
          if messages carry vector elements and an element can combine only contributions to the same index, each rank must send
          at least <M>{"\\frac{p-1}{p}n"}</M> elements in a reduce-scatter and receive at least as many in an all-gather, so an
          all-reduce built from the two, sending <M>{"2\\frac{p-1}{p}n"}</M> per rank, is optimal within a factor that tends
          to 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first claim is the definition read chunk by chunk: reduce-scatter gives rank i the sum of chunk i, and gathering
          the p summed chunks in order gives the summed vector on every rank. For reduce-scatter, rank r&apos;s data for each of
          the p − 1 chunks it does not own affects another rank&apos;s result, so information about each of those{" "}
          <M>{"\\frac{p-1}{p}n"}</M> elements must leave rank r, and by the assumption each sent element covers one index. For
          all-gather, rank r ends with <M>{"\\frac{p-1}{p}n"}</M> elements it did not have, each of which must arrive in a
          message. A full lower bound for all-reduce, in the same model, is also <M>{"2\\frac{p-1}{p}n"}</M> (Patarasuk and Yuan,
          2009).
        </p>
      </Proof>

      <Definition title="data parallelism and sharding">
        <p>
          In plain data parallelism every rank keeps the full model and optimiser and all-reduces the gradients each step. With
          mixed-precision Adam that costs 16 bytes per parameter on every rank: 2 for bf16 weights, 2 for bf16 gradients and 12
          for the fp32 master weights and two moments (e6.4.4). ZeRO (Rajbhandari et al., 2020) shards these across the p ranks
          in three stages: the optimiser state, then also the gradients (each rank needs only its own chunk, so the all-reduce
          becomes a reduce-scatter), then also the weights, which are all-gathered layer by layer when needed. Stage 3, also
          called fully sharded data parallelism (FSDP), all-gathers the weights twice per step, once for the forward and once for
          the backward pass, and reduce-scatters the gradients once, so it sends 1.5 times the bytes of plain data parallelism.
        </p>
        <Code>{ZERO}</Code>
      </Definition>

      <Remark title="in practice">
        <p>
          <C>torch.distributed</C> provides <C>all_reduce</C>, <C>all_gather_into_tensor</C> and <C>reduce_scatter_tensor</C>,
          and PyTorch&apos;s <C>DistributedDataParallel</C> and <C>FullyShardedDataParallel</C> are built on them. In JAX the same
          collectives appear as <C>psum</C>, <C>all_gather</C> and <C>psum_scatter</C>, and the compiler inserts them
          automatically when arrays are sharded over a mesh (e6.5.4).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bytes",
      rung: "check",
      prompt: (
        <p>
          A gradient of 10⁹ parameters in bf16 (2 bytes each) is all-reduced among 8 ranks by a bandwidth-optimal algorithm. How
          many gigabytes (10⁹ bytes) does each rank send?
        </p>
      ),
      answer: { kind: "numeric", value: 3.5, tolerance: 0.0001 },
    },
    {
      key: "mem",
      rung: "check",
      prompt: <p>A model of 10⁹ parameters is trained with mixed-precision Adam on 8 ranks using ZeRO stage 1. How many gigabytes of model state does each rank hold?</p>,
      answer: { kind: "numeric", value: 5.5, tolerance: 0.0001 },
    },
    {
      key: "fsdp",
      rung: "apply",
      prompt: <p>In fully sharded data parallelism, which collective collects a layer&apos;s complete weights on every rank just before that layer is computed?</p>,
      answer: {
        kind: "choice",
        options: ["All-gather", "Reduce-scatter", "All-reduce", "Broadcast from rank 0"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def all_gather(chunks):
    full = [x for c in chunks for x in c]
    return [list(full) for _ in chunks]

def reduce_scatter(vectors):
    p, n = len(vectors), len(vectors[0])
    c = n // p
    return [[sum(v[i] for v in vectors) for i in range(r * c, (r + 1) * c)] for r in range(p)]

def all_reduce(vectors):
    return all_gather(reduce_scatter(vectors))

print(all_gather([[1], [2, 3], [4]]), reduce_scatter([[1, 2, 3, 4], [10, 20, 30, 40]]))
print(all_reduce([[1, 2], [3, 4]]), all_reduce([[1, 0, 0], [0, 2, 0], [0, 0, 3]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]] [[11, 22], [33, 44]]\n[[4, 6], [4, 6]] [[1, 2, 3], [1, 2, 3], [1, 2, 3]]",
          "[[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]] [[11, 22], [33, 44]]\n[[4, 6], [4, 6]] [[6], [6], [6]]",
          "[[1], [2, 3], [4]] [[11, 22], [33, 44]]\n[[4, 6], [4, 6]] [[1, 2, 3], [1, 2, 3], [1, 2, 3]]",
          "[[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]] [[11, 33], [22, 44]]\n[[3, 7], [3, 7]] [[1, 2, 3], [1, 2, 3], [1, 2, 3]]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def comm_volume(op, n, p):
    factor = 2 if op == 'all_reduce' else 1
    return factor * (p - 1) * n / p

def zero_memory(psi, p, stage):
    params, grads, opt = 2 * psi, 2 * psi, 12 * psi
    if stage >= 1:
        opt /= p
    if stage >= 2:
        grads /= p
    if stage >= 3:
        params /= p
    return params + grads + opt

def step_volume(psi, p, stage):
    return (3 if stage == 3 else 2) * (p - 1) / p * psi

print(comm_volume('all_gather', 1000, 4), comm_volume('all_reduce', 1000, 4), comm_volume('reduce_scatter', 1000, 1))
print([zero_memory(1, 4, s) for s in range(4)], step_volume(8, 4, 2), step_volume(8, 4, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "750.0 1500.0 0.0\n[16, 7.0, 5.5, 4.0] 12.0 18.0",
          "750.0 1500.0 0.0\n[16, 7.0, 5.5, 4.0] 12.0 12.0",
          "750.0 1500.0 1000.0\n[16, 7.0, 5.5, 4.0] 12.0 18.0",
          "750.0 1500.0 0.0\n[16, 4.0, 2.5, 1.0] 12.0 18.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write the reference semantics <C>all_gather(chunks)</C>, <C>reduce_scatter(vectors)</C> (the vector length is a
          multiple of the number of ranks) and <C>all_reduce(vectors)</C>, each returning one list per rank.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def all_gather(chunks):
    return chunks

def reduce_scatter(vectors):
    return vectors

def all_reduce(vectors):
    return vectors
`,
        solution: SEMANTICS,
        tests: [
          { name: "gather and scatter", code: `assert all_gather([[7]]) == [[7]] and all_gather([[], [1], [2, 3]]) == [[1, 2, 3]] * 3
assert reduce_scatter([[1, 2, 3], [4, 5, 6], [7, 8, 9]]) == [[12], [15], [18]] and reduce_scatter([[5, 6]]) == [[5, 6]]
out = all_gather([[1], [2]])
out[0].append(9)
assert out[1] == [1, 2]` },
          { name: "all-reduce", code: `assert all_reduce([[1, 2, 3, 4], [1, 1, 1, 1]]) == [[2, 3, 4, 5]] * 2
import random
r = random.Random(0)
vs = [[r.randint(-9, 9) for _ in range(12)] for _ in range(4)]
assert all_reduce(vs) == [[sum(v[i] for v in vs) for i in range(12)]] * 4` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>comm_volume(op, n, p)</C>, the elements each rank sends in a bandwidth-optimal <C>&apos;all_reduce&apos;</C>,{" "}
          <C>&apos;all_gather&apos;</C> or <C>&apos;reduce_scatter&apos;</C> of a length-n vector; <C>zero_memory(psi, p, stage)</C>{" "}
          in bytes per rank for psi parameters; and <C>step_volume(psi, p, stage)</C>, the elements each rank sends per step.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def comm_volume(op, n, p):
    return n

def zero_memory(psi, p, stage):
    return 16 * psi

def step_volume(psi, p, stage):
    return 2 * psi
`,
        solution: ZERO,
        tests: [
          { name: "volume", code: `assert comm_volume('all_reduce', 8, 2) == 8 and comm_volume('all_gather', 9, 3) == 6 and comm_volume('reduce_scatter', 5, 1) == 0
assert step_volume(10, 5, 0) == 16 and step_volume(10, 5, 2) == 16 and step_volume(10, 5, 3) == 24 and step_volume(10, 1, 3) == 0` },
          { name: "memory", code: `assert [zero_memory(10, 5, s) for s in range(4)] == [160, 64, 48, 32] and zero_memory(3, 1, 3) == 48` },
        ],
      },
    },
    {
      key: "zero",
      rung: "stretch",
      prompt: (
        <p>
          A model of 7.5 × 10⁹ parameters is trained with mixed-precision Adam on 64 ranks using ZeRO stage 2. How many
          gigabytes of model state does each rank hold? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 16.64, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        One more collective completes the set: all-to-all, in which every rank sends a different piece to every other rank.
        It is the communication pattern of a distributed transpose and of mixture-of-experts layers, and the subject of the
        next lesson.
      </p>
    </>
  ),
};
