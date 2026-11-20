import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FsdpPrefetchViz } from "@/components/viz/FsdpPrefetchViz";
import type { LessonContent } from "@/lib/types";

const UNITS = `def group_units(sizes, min_size):
    units, cur = [], []
    for i, s in enumerate(sizes):                 # consecutive layers, in forward order
        cur.append(i)
        if sum(sizes[j] for j in cur) >= min_size:
            units.append(cur)
            cur = []
    if cur:
        units.append(cur)                         # a short tail becomes its own unit
    return units

def gathered_peak(units, n, prefetch):
    sharded = sum(units) / n                      # every rank's own shards
    w = prefetch + 1                              # the unit computing plus those fetched ahead
    return sharded + max(sum(units[i:i + w]) for i in range(len(units)))

def forward_time(compute, gather, prefetch):
    g_end, c_end = [], []
    for i in range(len(compute)):
        start = g_end[-1] if g_end else 0.0       # one all-gather at a time
        if i - prefetch - 1 >= 0:
            start = max(start, c_end[i - prefetch - 1])   # wait for a buffer to be freed
        g_end.append(start + gather[i])
        c_end.append(max(c_end[-1] if c_end else 0.0, g_end[-1]) + compute[i])
    return c_end[-1]`;

const HYBRID = `def ring_time(nbytes, n, bw):
    return (n - 1) / n * nbytes / bw              # one ring reduce-scatter or all-gather

def fsdp_comm(nbytes, nodes, g, bw_in, bw_out):
    return 3 * ring_time(nbytes, nodes * g, bw_out)   # rings span nodes, so the slow link sets the pace

def hsdp_comm(nbytes, nodes, g, bw_in, bw_out):
    inside = 3 * ring_time(nbytes, g, bw_in)      # shard within a node
    across = 2 * ring_time(nbytes / g, nodes, bw_out)  # all-reduce each shard across node replicas
    return inside + across`;

const TORCH = `from torch.distributed.fsdp import fully_shard, MixedPrecisionPolicy
from torch.distributed.device_mesh import init_device_mesh

mesh = init_device_mesh("cuda", (8, 8), mesh_dim_names=("replicate", "shard"))   # 8 nodes of 8 GPUs
mp = MixedPrecisionPolicy(param_dtype=torch.bfloat16, reduce_dtype=torch.float32)
for block in model.blocks:                     # one unit per transformer block
    fully_shard(block, mesh=mesh, mp_policy=mp)
fully_shard(model, mesh=mesh, mp_policy=mp)    # the root unit: embeddings, final norm, head
# A 2-D mesh gives hybrid sharding: shard within a node, replicate across nodes.`;

export const lesson: LessonContent = {
  id: "e10.3.2",
  minutes: 50,
  links: {
    requires: ["e10.3.1", "e8.2.4"],
    revisits: ["e10.2.2", "e6.4.1"],
    foreshadows: ["e10.7.2", "e10.8.1"],
  },

  puzzle: (
    <>
      <p>
        Wrapping a model with fully sharded data parallel as one unit uses as much memory at its peak as DDP, since the whole model is
        gathered at once. Wrapping every linear layer separately saves memory but makes training slower. And on 64 GPUs across 8 nodes,
        sharding over all 64 can be slower than sharding over each node&apos;s 8 and keeping 8 copies. What should a unit be, and
        across how many GPUs should it be sharded?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        FSDP is ZeRO stage 3 with the weights grouped into units, usually one transformer block each. A unit&apos;s weights are
        all-gathered just before it runs and freed right after, so peak memory is the shards plus a few full units. Communication is
        hidden by prefetching: while one unit computes, the next one&apos;s all-gather is already in flight. Units that are too small
        pay a fixed cost per collective and leave little compute to hide behind; units that are too large raise the peak.
      </p>
      <FsdpPrefetchViz />
    </>
  ),

  theory: (
    <>
      <Definition title="units, prefetching and resharding">
        <p>
          Consecutive layers are grouped into units (<C>group_units</C>). In the forward pass each unit is all-gathered, run and, by
          default, resharded; in the backward pass it is gathered again, its gradients are reduce-scattered, and it is freed. With a
          prefetch depth of p, the gather for unit i may start once unit <M>{"i - p - 1"}</M> has finished and released its buffer,
          so at most p + 1 full units are held at once (<C>gathered_peak</C>).
        </p>
        <Code>{UNITS}</Code>
      </Definition>

      <Theorem title="when prefetching hides communication">
        <p>
          With one gather at a time and prefetch depth at least 1, the forward time is at least{" "}
          <M>{"\\max\\bigl(\\sum_i g_i + c_{\\text{last}},\; g_1 + \\sum_i c_i\\bigr)"}</M>, where <M>{"g_i"}</M> and <M>{"c_i"}</M>{" "}
          are unit i&apos;s gather and compute times. If every <M>{"g_{i+1} \\le c_i"}</M>, prefetch depth 1 achieves{" "}
          <M>{"g_1 + \\sum_i c_i"}</M>: only the first gather is exposed. Without prefetching the time is{" "}
          <M>{"\\sum_i (g_i + c_i)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The network runs gathers one after another, so the last gather ends no earlier than <M>{"\\sum g_i"}</M>, and the last
          compute follows it. The GPU runs units in order and the first cannot start before <M>{"g_1"}</M>. With depth 1 and{" "}
          <M>{"g_{i+1} \\le c_i"}</M>, induction shows that gather i + 1 starts when compute i starts and ends before compute i does,
          so compute never waits after the first unit. With depth 0 gather i + 1 cannot begin until compute i ends, so nothing
          overlaps (<C>forward_time</C>).
        </p>
      </Proof>

      <Remark title="mixed precision and the root unit">
        <p>
          FSDP keeps the sharded parameters in fp32 and casts them to bf16 before the all-gather, so the gather moves 2 bytes per
          parameter (e6.4.1); gradients can be reduce-scattered in fp32 for accuracy at twice the bytes. Parameters not inside any
          block, such as the embedding and output head, form the root unit, which stays gathered for the whole forward and backward
          pass. Setting <C>reshard_after_forward=False</C> on the last units skips their re-gather in the backward pass at the cost of
          holding them, and is the usual tweak when memory allows.
        </p>
        <Code>{TORCH}</Code>
      </Remark>

      <Theorem title="hybrid sharding">
        <p>
          Let the model&apos;s weights be S bytes, on <M>{"n_{\\text{node}}"}</M> nodes of g GPUs, with ring bandwidth{" "}
          <M>{"B_{\\text{in}}"}</M> inside a node and <M>{"B_{\\text{out}} < B_{\\text{in}}"}</M> across nodes. Sharding over all{" "}
          <M>{"N = g\\,n_{\\text{node}}"}</M> GPUs costs about <M>{"3\\frac{N-1}{N}\\frac{S}{B_{\\text{out}}}"}</M> per step. Sharding
          within each node and all-reducing each shard across nodes costs
        </p>
        <MD>{"3\\frac{g-1}{g}\\frac{S}{B_{\\text{in}}} + 2\\frac{n_{\\text{node}}-1}{n_{\\text{node}}}\\frac{S/g}{B_{\\text{out}}},"}</MD>
        <p>
          and holds <M>{"16P/g"}</M> bytes of model state instead of <M>{"16P/N"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          A ring reduce-scatter or all-gather over n members moves <M>{"(n-1)/n"}</M> of the buffer through each link (e8.2.4), and a
          ring spanning nodes is limited by its slowest link. Full sharding runs three such collectives over all N GPUs. Hybrid sharding
          runs the three over the g GPUs of a node at <M>{"B_{\\text{in}}"}</M>, then each GPU&apos;s gradient shard of S/g bytes is
          all-reduced with the GPUs holding the same shard on the other nodes, a reduce-scatter and an all-gather over{" "}
          <M>{"n_{\\text{node}}"}</M> members.
        </p>
        <Code>{HYBRID}</Code>
      </Proof>

      <Example title="the puzzle, resolved">
        <p>
          One unit gathers everything at once, so its peak is DDP&apos;s. Per-linear units are tiny: each collective pays its fixed
          cost, and a unit&apos;s compute is too short to hide the next gather. A transformer block is the usual unit, large enough to
          hide a gather and small enough that two or three gathered blocks are a small part of memory. Across nodes, full sharding
          sends all three collectives over the slow links, while hybrid sharding keeps them on the fast links and sends only one
          eighth of the weights across; it holds 8 times more model state, which is affordable whenever the model fits sharded over
          a node.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "peak",
      rung: "check",
      prompt: (
        <p>
          A model has 32 units of 0.5 GB of bf16 weights each, sharded over 64 GPUs with prefetch depth 1. Counting the shards plus the
          gathered units, how many gigabytes of weights does a GPU hold at the peak?
        </p>
      ),
      answer: { kind: "numeric", value: 1.25, tolerance: 0.001 },
    },
    {
      key: "hybrid",
      rung: "check",
      prompt: (
        <p>
          A model has 10 GB of bf16 weights, trained on 8 nodes of 8 GPUs with ring bandwidth 200 GB/s inside a node and 25 GB/s across
          nodes. How many seconds of communication per step does hybrid sharding take? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.219, tolerance: 0.001 },
    },
    {
      key: "tiny",
      rung: "apply",
      prompt: <p>Why is wrapping every linear layer as its own unit usually slower than one unit per transformer block?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each collective pays a fixed cost, and a small unit's compute is too short to hide the next gather",
          "Small units move more bytes in total",
          "Small units cannot be prefetched",
          "Small units must be all-reduced rather than reduce-scattered",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def group_units(sizes, min_size):
    units, cur = [], []
    for i, s in enumerate(sizes):                 # consecutive layers, in forward order
        cur.append(i)
        if sum(sizes[j] for j in cur) >= min_size:
            units.append(cur)
            cur = []
    if cur:
        units.append(cur)                         # a short tail becomes its own unit
    return units

def gathered_peak(units, n, prefetch):
    sharded = sum(units) / n                      # every rank's own shards
    w = prefetch + 1                              # the unit computing plus those fetched ahead
    return sharded + max(sum(units[i:i + w]) for i in range(len(units)))

def forward_time(compute, gather, prefetch):
    g_end, c_end = [], []
    for i in range(len(compute)):
        start = g_end[-1] if g_end else 0.0       # one all-gather at a time
        if i - prefetch - 1 >= 0:
            start = max(start, c_end[i - prefetch - 1])   # wait for a buffer to be freed
        g_end.append(start + gather[i])
        c_end.append(max(c_end[-1] if c_end else 0.0, g_end[-1]) + compute[i])
    return c_end[-1]

units = group_units([1, 2, 1, 3, 1, 1], 3)
print(units, gathered_peak([2, 4, 2, 4], 2, 1), forward_time([3.0, 3.0, 3.0], [2.0, 2.0, 2.0], 0), forward_time([3.0, 3.0, 3.0], [2.0, 2.0, 2.0], 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0, 1], [2, 3], [4, 5]] 12.0 15.0 11.0",
          "[[0, 1], [2, 3], [4, 5]] 12.0 15.0 9.0",
          "[[0, 1], [2], [3], [4, 5]] 12.0 15.0 11.0",
          "[[0, 1], [2, 3], [4, 5]] 10.0 15.0 11.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ring_time(nbytes, n, bw):
    return (n - 1) / n * nbytes / bw              # one ring reduce-scatter or all-gather

def fsdp_comm(nbytes, nodes, g, bw_in, bw_out):
    return 3 * ring_time(nbytes, nodes * g, bw_out)   # rings span nodes, so the slow link sets the pace

def hsdp_comm(nbytes, nodes, g, bw_in, bw_out):
    inside = 3 * ring_time(nbytes, g, bw_in)      # shard within a node
    across = 2 * ring_time(nbytes / g, nodes, bw_out)  # all-reduce each shard across node replicas
    return inside + across

t = ring_time(8, 4, 2.0)
print(t, fsdp_comm(16, 2, 4, 8.0, 1.0), hsdp_comm(16, 2, 4, 8.0, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["3.0 42.0 8.5", "4.0 48.0 8.5", "3.0 5.25 8.5", "3.0 42.0 4.5"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>group_units(sizes, min_size)</C>, closing a unit of consecutive layers as soon as it reaches min_size, with any short
          tail as its own unit; <C>gathered_peak(units, n, prefetch)</C>, the shards plus the largest run of prefetch + 1 consecutive
          full units; and <C>forward_time(compute, gather, prefetch)</C>, simulating one gather at a time with that prefetch depth.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def group_units(sizes, min_size):
    return [[i] for i in range(len(sizes))]

def gathered_peak(units, n, prefetch):
    return sum(units)

def forward_time(compute, gather, prefetch):
    return sum(compute)
`,
        solution: UNITS,
        tests: [
          { name: "units", code: `assert group_units([5, 1, 1, 1, 5], 2) == [[0], [1, 2], [3, 4]] and group_units([1], 5) == [[0]]\nassert gathered_peak([1, 1, 1, 1], 4, 0) == 2.0 and gathered_peak([3, 1, 1, 3], 2, 2) == 9.0` },
          { name: "forward", code: `assert forward_time([1.0, 1.0], [2.0, 2.0], 0) == 6.0 and forward_time([1.0, 1.0], [2.0, 2.0], 1) == 5.0\nassert forward_time([4.0, 4.0, 4.0], [1.0, 1.0, 1.0], 1) == 13.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ring_time(nbytes, n, bw)</C> for one ring reduce-scatter or all-gather; <C>fsdp_comm(nbytes, nodes, g, bw_in,
          bw_out)</C>, three collectives over every GPU at the cross-node bandwidth; and <C>hsdp_comm(nbytes, nodes, g, bw_in,
          bw_out)</C>, three inside each node plus an all-reduce of each shard across nodes.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ring_time(nbytes, n, bw):
    return nbytes / bw

def fsdp_comm(nbytes, nodes, g, bw_in, bw_out):
    return 0.0

def hsdp_comm(nbytes, nodes, g, bw_in, bw_out):
    return 0.0
`,
        solution: HYBRID,
        tests: [
          { name: "ring", code: `assert ring_time(10, 5, 4.0) == 2.0 and fsdp_comm(12, 2, 2, 6.0, 1.0) == 27.0` },
          { name: "hybrid", code: `assert hsdp_comm(12, 2, 2, 6.0, 1.0) == 9.0 and hsdp_comm(8, 4, 2, 4.0, 2.0) == 6.0` },
        ],
      },
    },
    {
      key: "deep",
      rung: "stretch",
      prompt: (
        <p>
          Eight units each compute for 2 ms; their all-gathers take 3, 1, 3, 1, 3, 1, 3 and 1 ms. With one gather at a time and
          prefetch depth 1, how many milliseconds does the forward pass take?
        </p>
      ),
      answer: { kind: "numeric", value: 22, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Sharding the batch and the model state still leaves each GPU computing whole layers. The next section splits the layers
        themselves, starting with Megatron&apos;s tensor parallelism for the matrix multiplications of a transformer block.
      </p>
    </>
  ),
};
