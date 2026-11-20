import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PingPongViz } from "@/components/viz/PingPongViz";
import type { LessonContent } from "@/lib/types";

const PIPE = `import math

def stages_needed(latency, compute):
    return 1 + math.ceil(latency / compute - 1e-9)   # smallest s with (s - 1) * compute >= latency

def smem_stages(smem, BM, BN, BK, bytes_per, reserved):
    per_stage = (BM * BK + BK * BN) * bytes_per    # one A tile and one B tile
    return (smem - reserved) // per_stage

def pipeline_time(n_steps, latency, compute, stages):
    issue, end = [], []
    for i in range(n_steps):
        free = end[i - stages] if i >= stages else 0.0     # the slot this load reuses
        issue.append(max(issue[-1] if issue else 0.0, free))
        start = max(issue[i] + latency, end[-1] if end else 0.0)
        end.append(start + compute)
    return end[-1]`;

const SCHED = `def exp_fraction(d, mma_tflops, exp_tops):
    gemm = 4 * d / mma_tflops                     # two GEMMs per score: 4d FLOPs
    exp = 1 / exp_tops                            # one exponential per score
    return exp / (gemm + exp)

def group_ops(tiles, gemm, exp):
    return [("tc", gemm), ("exp", exp), ("tc", gemm)] * tiles   # S = QK^T, softmax, PV

def schedule(n_groups, ops):
    ready, nxt = [0.0] * n_groups, [0] * n_groups
    tc_free, busy = 0.0, 0.0
    while any(i < len(ops) for i in nxt):
        best = None
        for g in range(n_groups):                 # the op that can start soonest goes next
            if nxt[g] < len(ops):
                kind, dur = ops[nxt[g]]
                start = max(ready[g], tc_free) if kind == "tc" else ready[g]
                if best is None or start < best[0]:
                    best = (start, g)
        start, g = best
        kind, dur = ops[nxt[g]]
        ready[g] = start + dur
        if kind == "tc":                          # tensor cores are shared by all groups
            tc_free, busy = start + dur, busy + dur
        nxt[g] += 1
    return max(ready), busy`;

const PRODUCER = `// One thread block: a producer warp and two consumer warp groups (pseudo-CUDA).
// full[s] and empty[s] are barriers for shared-memory slot s, one per pipeline stage.
if (is_producer_warp) {
    for (int k = 0; k < K_TILES; ++k) {
        int s = k % STAGES;
        wait(empty[s]);                                   // a consumer has released the slot
        if (lane == 0) tma_load(smem_a[s], desc_a, k);    // one thread issues each tile copy,
        if (lane == 0) tma_load(smem_b[s], desc_b, k);    // completion is counted on full[s]
    }
} else {                                                  // consumer warp group 0 or 1
    for (int k = 0; k < K_TILES; ++k) {
        int s = k % STAGES;
        wait(full[s]);                                    // both tiles have landed
        wgmma_async(acc, smem_a[s], smem_b[s]);           // 128 threads, operands from shared memory
        wgmma_wait();
        arrive(empty[s]);                                 // hand the slot back to the producer
    }
}`;

export const lesson: LessonContent = {
  id: "e9.4.4",
  minutes: 55,
  links: {
    requires: ["e9.4.2", "e9.2.2"],
    revisits: ["e9.2.3", "e9.3.3"],
    foreshadows: ["e9.5.1"],
  },

  puzzle: (
    <>
      <p>
        FlashAttention-2 reached about 35% of an H100&apos;s peak, though it had reached 70% of an A100&apos;s. Nothing was wrong
        with its algorithm. FlashAttention-3, with the same arithmetic, reached about 75%. What did the newer GPU need that the older
        code did not do?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each GPU generation makes tensor cores much faster, while memory latency, the exponential unit and ordinary instruction issue
        improve far less. On an H100 a kernel that loads a tile, waits, multiplies, waits, then computes a softmax keeps its tensor cores
        idle most of the time. The new hardware features all exist to keep them busy: copy engines that move whole tiles without
        occupying threads, matrix instructions that run asynchronously, and barriers that let some warps fetch data while others
        compute. The figure shows the last step: two groups of warps taking turns so that one&apos;s softmax hides behind the
        other&apos;s matrix multiplications.
      </p>
      <PingPongViz />
    </>
  ),

  theory: (
    <>
      <Definition title="asynchronous copies and the Tensor Memory Accelerator">
        <p>
          On Ampere, <C>cp.async</C> lets threads copy global memory to shared memory without passing through registers. Hopper adds
          the Tensor Memory Accelerator (TMA): a single thread hands it a tensor descriptor (base address, shape, strides, tile size and
          shared-memory swizzle) and a tile coordinate, and the unit copies the whole tile, handling bounds and swizzling, and reports
          completion on a barrier in shared memory. Within a cluster of thread blocks, one TMA load can be multicast to several blocks
          that need the same tile.
        </p>
      </Definition>

      <Definition title="software pipelining">
        <p>
          A pipeline with s stages keeps s shared-memory slots. The producer waits until a slot is empty and starts loading the tile for
          step k into slot k mod s; the consumer waits until the slot is full, computes, and releases it. While the consumer works on
          step k, the loads for up to s - 1 later steps are in flight. In Triton this is the <C>num_stages</C> setting of e9.3.3; in
          CUDA it is written with barriers, as below, often with the producer as a separate warp (warp specialisation).
        </p>
        <Code>{PRODUCER}</Code>
        <Code>{PIPE}</Code>
      </Definition>

      <Theorem title="how many stages hide the latency">
        <p>
          Let every load take latency <M>{"\\lambda"}</M> and every step of computation take c, with loads issued as soon as a slot is
          free. In steady state the time per step is <M>{"\\max\\bigl(c, (c + \\lambda)/s\\bigr)"}</M>. Hence the latency is completely
          hidden, with time c per step, exactly when <M>{"(s - 1)c \\ge \\lambda"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"t_k"}</M> be the start of step k. Steps are sequential, so <M>{"t_{k+1} \\ge t_k + c"}</M>. Step k + s reuses step
          k&apos;s slot, which frees at <M>{"t_k + c"}</M>; its tile is loaded only then, so{" "}
          <M>{"t_{k+s} \\ge t_k + c + \\lambda"}</M>. Over many steps the average period T therefore satisfies <M>{"T \\ge c"}</M> and{" "}
          <M>{"sT \\ge c + \\lambda"}</M>. Conversely, the schedule{" "}
          <M>{"t_k = \\lambda + kT"}</M> with <M>{"T = \\max(c, (c+\\lambda)/s)"}</M> satisfies both constraints, and every load
          (started at <M>{"t_{k-s} + c"}</M>, finished by <M>{"t_{k-s} + c + \\lambda \\le t_k"}</M>) is ready in time. The period equals
          c exactly when <M>{"sc \\ge c + \\lambda"}</M>.
        </p>
      </Proof>

      <Definition title="asynchronous matrix instructions">
        <p>
          Hopper&apos;s <C>wgmma</C> is issued by a warp group of four warps, reads its B operand (and optionally A) directly from
          swizzled shared memory, accumulates in registers, and runs asynchronously: the warp group can issue other instructions and
          wait for completion later. Blackwell&apos;s <C>tcgen05</C> instructions are issued by a single thread, keep the accumulator
          in a dedicated on-chip tensor memory instead of registers, and let a pair of SMs share one larger multiplication. These are
          architecture-specific: <C>wgmma</C> code for Hopper does not run on Blackwell, which is one reason libraries such as CUTLASS
          and compilers such as Triton carry separate code paths per generation.
        </p>
      </Definition>

      <Definition title="warp specialisation and ping-pong scheduling">
        <p>
          Warps in a block can take different roles: producer warps that only issue TMA loads (and give up most of their registers to the
          consumers), and consumer warp groups that only compute. With two consumer groups working on different tiles, barriers can
          order them so that one group&apos;s matrix multiplications run while the other group computes its softmax. The model below
          schedules operations greedily on shared tensor cores and per-group exponential units, as in the figure.
        </p>
        <Code>{SCHED}</Code>
      </Definition>

      <Remark title="why the exponential matters">
        <p>
          An H100 SXM performs about 989 TFLOP/s of dense 16-bit matrix arithmetic but only about 3.9 trillion exponentials per second.
          Attention needs 4d matrix FLOPs and one exponential per score, so for d = 128 the exponentials alone take about half as long as
          the matrix multiplications. Run back to back, the tensor cores idle a third of the time; overlapped, the softmax is almost
          free. The ratio worsens as tensor cores speed up faster than the special function units.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          FlashAttention-2 used neither TMA nor <C>wgmma</C> nor warp specialisation, so on an H100 its warps spent much of their time
          issuing loads, waiting on synchronous multiplications and computing exponentials while the tensor cores idled.
          FlashAttention-3 moved loads to a producer warp using TMA, used asynchronous <C>wgmma</C>, and ping-ponged two consumer
          groups so that softmax overlapped matrix multiplication; it also added an FP8 path, the subject of the next chapter.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "smem",
      rung: "check",
      prompt: (
        <p>
          A Hopper GEMM uses 128 by 256 output tiles with BK = 64 in bfloat16, and 32 KB of the block&apos;s 227 KB of shared memory is
          reserved for the epilogue. Each stage holds one A tile and one B tile. How many pipeline stages fit?
        </p>
      ),
      answer: { kind: "numeric", value: 4, tolerance: 0 },
    },
    {
      key: "period",
      rung: "check",
      prompt: (
        <p>
          Loads take 1.5 µs and each step of computation 0.4 µs. With 3 stages, what is the steady-state time per step, in microseconds?
          Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.633, tolerance: 0.001 },
    },
    {
      key: "tma",
      rung: "apply",
      prompt: <p>Which statement about the Tensor Memory Accelerator is correct?</p>,
      answer: {
        kind: "choice",
        options: [
          "One thread can start the copy of a whole tile, described by a tensor descriptor, and wait on a barrier for it",
          "It replaces shared memory, so tiles go straight from global memory into tensor cores",
          "Every thread of the block must issue its own part of the copy, as with ordinary loads",
          "It is available on every GPU since Volta and is used automatically by any CUDA load",
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

def stages_needed(latency, compute):
    return 1 + math.ceil(latency / compute - 1e-9)   # smallest s with (s - 1) * compute >= latency

def smem_stages(smem, BM, BN, BK, bytes_per, reserved):
    per_stage = (BM * BK + BK * BN) * bytes_per    # one A tile and one B tile
    return (smem - reserved) // per_stage

def pipeline_time(n_steps, latency, compute, stages):
    issue, end = [], []
    for i in range(n_steps):
        free = end[i - stages] if i >= stages else 0.0     # the slot this load reuses
        issue.append(max(issue[-1] if issue else 0.0, free))
        start = max(issue[i] + latency, end[-1] if end else 0.0)
        end.append(start + compute)
    return end[-1]

t = [pipeline_time(4, 3.0, 1.0, s) for s in (1, 2, 4)]
print(stages_needed(3.0, 1.0), stages_needed(2.5, 1.0), smem_stages(227 * 1024, 128, 128, 64, 2, 35 * 1024), t)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4 4 6 [16.0, 9.0, 7.0]",
          "4 3 6 [16.0, 9.0, 7.0]",
          "4 4 6 [16.0, 10.0, 7.0]",
          "4 4 7 [16.0, 9.0, 7.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def exp_fraction(d, mma_tflops, exp_tops):
    gemm = 4 * d / mma_tflops                     # two GEMMs per score: 4d FLOPs
    exp = 1 / exp_tops                            # one exponential per score
    return exp / (gemm + exp)

def group_ops(tiles, gemm, exp):
    return [("tc", gemm), ("exp", exp), ("tc", gemm)] * tiles   # S = QK^T, softmax, PV

def schedule(n_groups, ops):
    ready, nxt = [0.0] * n_groups, [0] * n_groups
    tc_free, busy = 0.0, 0.0
    while any(i < len(ops) for i in nxt):
        best = None
        for g in range(n_groups):                 # the op that can start soonest goes next
            if nxt[g] < len(ops):
                kind, dur = ops[nxt[g]]
                start = max(ready[g], tc_free) if kind == "tc" else ready[g]
                if best is None or start < best[0]:
                    best = (start, g)
        start, g = best
        kind, dur = ops[nxt[g]]
        ready[g] = start + dur
        if kind == "tc":                          # tensor cores are shared by all groups
            tc_free, busy = start + dur, busy + dur
        nxt[g] += 1
    return max(ready), busy

ops = group_ops(2, 1.0, 1.0)
print(round(exp_fraction(128, 989.0, 3.9), 3), ops[:3], schedule(1, ops), schedule(2, ops))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.331 [('tc', 1.0), ('exp', 1.0), ('tc', 1.0)] (6.0, 4.0) (9.0, 8.0)",
          "0.331 [('tc', 1.0), ('exp', 1.0), ('tc', 1.0)] (6.0, 4.0) (12.0, 8.0)",
          "0.331 [('tc', 1.0), ('exp', 1.0), ('tc', 1.0)] (6.0, 6.0) (9.0, 8.0)",
          "0.495 [('tc', 1.0), ('exp', 1.0), ('tc', 1.0)] (6.0, 4.0) (9.0, 8.0)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>stages_needed(latency, compute)</C>, the smallest s with (s - 1) compute &#8805; latency;{" "}
          <C>smem_stages(smem, BM, BN, BK, bytes_per, reserved)</C>; and <C>pipeline_time(n_steps, latency, compute, stages)</C>, the
          finishing time when step i&apos;s load is issued once the slot it reuses (that of step i - stages) has been consumed, and no
          earlier than the previous load.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def stages_needed(latency, compute):
    return 1

def smem_stages(smem, BM, BN, BK, bytes_per, reserved):
    return 0

def pipeline_time(n_steps, latency, compute, stages):
    return n_steps * compute
`,
        solution: PIPE,
        tests: [
          { name: "stages", code: `assert stages_needed(2.0, 0.5) == 5 and stages_needed(0.3, 1.0) == 2\nassert smem_stages(100, 2, 2, 2, 1, 4) == 12` },
          { name: "time", code: `assert pipeline_time(1, 2.0, 0.5, 3) == 2.5\nassert pipeline_time(10, 2.0, 0.5, 5) == 7.0 and pipeline_time(10, 3.0, 1.0, 1) == 40.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>exp_fraction(d, mma_tflops, exp_tops)</C>, the fraction of time spent on exponentials when they do not overlap the two
          GEMMs; <C>group_ops(tiles, gemm, exp)</C>; and <C>schedule(n_groups, ops)</C>, the greedy scheduler of the definition, returning
          (makespan, tensor-core busy time) and breaking ties in favour of the lower group.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def exp_fraction(d, mma_tflops, exp_tops):
    return 0.0

def group_ops(tiles, gemm, exp):
    return []

def schedule(n_groups, ops):
    return (0.0, 0.0)
`,
        solution: SCHED,
        tests: [
          { name: "ops", code: `assert abs(exp_fraction(64, 1000.0, 4.0) - 0.25 / 0.506) < 1e-12\nassert group_ops(1, 2.0, 3.0) == [("tc", 2.0), ("exp", 3.0), ("tc", 2.0)]` },
          { name: "schedule", code: `assert schedule(1, [("tc", 1.0), ("exp", 2.0), ("tc", 1.0)] * 3) == (12.0, 6.0)\nassert schedule(2, [("tc", 1.0), ("exp", 1.0), ("tc", 1.0)]) == (4.0, 4.0)` },
        ],
      },
    },
    {
      key: "d96",
      rung: "stretch",
      prompt: (
        <p>
          With 989 TFLOP/s of matrix arithmetic and 3.9 trillion exponentials per second, what fraction of an attention tile&apos;s time
          goes to exponentials for head dimension 96 if softmax does not overlap the matrix multiplications? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.398, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The tensor cores of recent GPUs run twice as fast again on 8-bit floating point. The next chapter writes FP8 matrix
        multiplications, where the hard part is not the instruction but keeping the scales right.
      </p>
    </>
  ),
};
