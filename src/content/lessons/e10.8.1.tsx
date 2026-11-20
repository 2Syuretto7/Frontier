import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CheckpointReshardViz } from "@/components/viz/CheckpointReshardViz";
import type { LessonContent } from "@/lib/types";

const RESHARD = `import numpy as np

def shard_ranges(n, k):
    q, r = divmod(n, k)
    out, lo = [], 0
    for i in range(k):                              # the first r shards get one extra element
        hi = lo + q + (1 if i < r else 0)
        out.append((lo, hi))
        lo = hi
    return out

def load_plan(meta, n, k_new):
    plan = []
    for lo, hi in shard_ranges(n, k_new):           # the range each new rank owns
        reads = []
        for s, (a, b) in enumerate(meta):
            x, y = max(lo, a), min(hi, b)
            if x < y:                               # saved shard, its local slice, destination offset
                reads.append((s, x - a, y - a, x - lo))
        plan.append(reads)
    return plan

def reshard_load(shards, meta, n, k_new):
    out = []
    for (lo, hi), reads in zip(shard_ranges(n, k_new), load_plan(meta, n, k_new)):
        buf = np.empty(hi - lo, dtype=shards[0].dtype)
        for s, a, b, d in reads:
            buf[d:d + b - a] = shards[s][a:b]
        out.append(buf)
    return out`;

const TIMING = `def ckpt_bytes(P):
    return 2 * P + 12 * P                           # bf16 weights, fp32 master weights and two Adam moments

def write_time(nbytes, writers, per_writer_bw, storage_bw):
    return nbytes / min(writers * per_writer_bw, storage_bw)   # data-parallel copies are written once

def stall(nbytes, gpus, pcie_bw, writers, per_writer_bw, storage_bw, async_):
    if async_:
        return nbytes / gpus / pcie_bw              # training waits only for the copy to host memory
    return write_time(nbytes, writers, per_writer_bw, storage_bw)`;

const DCP = `import torch.distributed.checkpoint as dcp
from torch.distributed.checkpoint.state_dict import get_state_dict, set_state_dict

model_sd, optim_sd = get_state_dict(model, optimizer)         # sharded DTensors, no gathering
dcp.save({"model": model_sd, "optim": optim_sd}, checkpoint_id="ckpt/step_12000")
# Every rank writes its own shards in parallel; rank 0 also writes .metadata,
# which records each tensor's global shape and where every shard lives.

fut = dcp.async_save(state, checkpoint_id="ckpt/step_13000")  # copy to host memory, then write in the background

dcp.load(state, checkpoint_id="ckpt/step_12000")              # works on a different mesh: each rank reads the pieces it needs`;

export const lesson: LessonContent = {
  id: "e10.8.1",
  minutes: 45,
  links: {
    requires: ["e10.3.2", "e10.7.3"],
    revisits: ["e10.1.1", "e6.4.4"],
    foreshadows: ["e10.8.2"],
  },

  puzzle: (
    <>
      <p>
        A 70-billion-parameter run holds about a terabyte of weights and optimiser state, sharded over a thousand GPUs. Gathering it to
        one process to save would take minutes and would not fit in that process&apos;s memory. After a failure the job may restart on a
        different number of GPUs. How are such checkpoints written quickly, and how is a checkpoint saved on one mesh loaded on
        another?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every rank writes its own shards at the same time, and a small metadata file records, for every tensor, its global shape and
        which byte range of which file holds each piece. Data-parallel replicas hold identical shards, so only one of each set writes.
        Loading on a new mesh is then a planning problem: each new rank works out which global range it owns, finds every saved piece
        that overlaps it, and reads just those slices.
      </p>
      <CheckpointReshardViz />
    </>
  ),

  theory: (
    <>
      <Definition title="sharded checkpoints">
        <p>
          A tensor of n elements saved by k ranks is stored as k contiguous ranges (<C>shard_ranges</C>), recorded in the metadata.
          To load it on k′ ranks, each new rank intersects its own range with every saved range and reads the non-empty
          intersections (<C>load_plan</C>), copying each into place (<C>reshard_load</C>). Real checkpoints do this per tensor and per
          dimension with multi-dimensional boxes, but the one-dimensional case shows the whole idea.
        </p>
        <Code>{RESHARD}</Code>
      </Definition>

      <Theorem title="how many reads">
        <p>
          Loading a range split into k contiguous pieces onto k′ contiguous pieces takes exactly <M>{"k + k' - 1 - c"}</M> reads, where
          c is the number of interior cut points the two splits share.
        </p>
      </Theorem>
      <Proof>
        <p>
          A read is a pair of overlapping pieces, and the non-empty overlaps are exactly the pieces of the common refinement, the split
          by the union of both sets of cut points. That union has <M>{"(k - 1) + (k' - 1) - c"}</M> distinct interior points, so the
          refinement has one more piece than that.
        </p>
      </Proof>

      <Theorem title="how long training stops">
        <p>
          With w writers of bandwidth b each and storage that accepts at most B in total, writing S bytes takes{" "}
          <M>{"S / \\min(wb, B)"}</M>. An asynchronous checkpoint stops training only while each of g GPUs copies its{" "}
          <M>{"S/g"}</M> bytes to host memory over a link of bandwidth p, <M>{"S/(gp)"}</M>, and writes in the background.
        </p>
      </Theorem>
      <Proof>
        <p>
          The writers share the storage system, so their total rate is capped by both their own links and the storage&apos;s
          throughput (<C>write_time</C>). Asynchronously, the GPU copies are taken at one step boundary and training resumes; the
          host-memory copy is consistent and can be written while the next steps run (<C>stall</C>). The state itself is the bf16
          weights plus fp32 master weights and two Adam moments, 14 bytes per parameter (<C>ckpt_bytes</C>, e6.4.4).
        </p>
        <Code>{TIMING}</Code>
      </Proof>

      <Remark title="what else must be saved">
        <p>
          Resuming exactly also needs the step count, learning-rate schedule state, the data loader&apos;s position in each shard of the
          dataset, and the random number generator states of every rank. Missing any of these changes the run after a restart, which
          is the subject of e10.8.4. An asynchronous checkpoint must finish writing before the next one starts, and before it is
          trusted: a checkpoint is complete only when its metadata is written, last.
        </p>
        <Code>{DCP}</Code>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Nothing is gathered: each rank writes its own shards, one replica per data-parallel group, at the storage system&apos;s full
          bandwidth, and asynchronous saving reduces the pause to a copy into host memory. The metadata makes the checkpoint
          independent of the mesh: on restart each rank intersects its new range with the saved ones and reads only what it needs.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "save",
      rung: "check",
      prompt: (
        <p>
          A 70-billion-parameter model saves 14 bytes per parameter. One rank from each of 64 data-parallel groups writes at 2 GB/s, and
          storage accepts 100 GB/s in total. How many seconds does a synchronous checkpoint take?
        </p>
      ),
      answer: { kind: "numeric", value: 9.8, tolerance: 0.01 },
    },
    {
      key: "pieces",
      rung: "check",
      prompt: <p>A tensor of 10 elements saved by 4 ranks is loaded on 3, both split as evenly as possible with the larger pieces first. How many reads are needed in total?</p>,
      answer: { kind: "numeric", value: 6, tolerance: 0 },
    },
    {
      key: "meta",
      rung: "apply",
      prompt: <p>Why is the metadata file written last?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its presence marks the checkpoint as complete, so a crash during writing leaves no checkpoint that looks valid",
          "It is the largest file",
          "Rank 0 must wait for the other ranks' data to compute it",
          "Storage systems require metadata to be written after data",
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

def shard_ranges(n, k):
    q, r = divmod(n, k)
    out, lo = [], 0
    for i in range(k):                              # the first r shards get one extra element
        hi = lo + q + (1 if i < r else 0)
        out.append((lo, hi))
        lo = hi
    return out

def load_plan(meta, n, k_new):
    plan = []
    for lo, hi in shard_ranges(n, k_new):           # the range each new rank owns
        reads = []
        for s, (a, b) in enumerate(meta):
            x, y = max(lo, a), min(hi, b)
            if x < y:                               # saved shard, its local slice, destination offset
                reads.append((s, x - a, y - a, x - lo))
        plan.append(reads)
    return plan

def reshard_load(shards, meta, n, k_new):
    out = []
    for (lo, hi), reads in zip(shard_ranges(n, k_new), load_plan(meta, n, k_new)):
        buf = np.empty(hi - lo, dtype=shards[0].dtype)
        for s, a, b, d in reads:
            buf[d:d + b - a] = shards[s][a:b]
        out.append(buf)
    return out

meta = shard_ranges(10, 4)
print(meta, load_plan(meta, 10, 3)[1], reshard_load([np.arange(10.0)[a:b] for a, b in meta], meta, 10, 3)[2].tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(0, 3), (3, 6), (6, 8), (8, 10)] [(1, 1, 3, 0), (2, 0, 1, 2)] [7.0, 8.0, 9.0]",
          "[(0, 2), (2, 4), (4, 7), (7, 10)] [(1, 1, 3, 0), (2, 0, 1, 2)] [7.0, 8.0, 9.0]",
          "[(0, 3), (3, 6), (6, 8), (8, 10)] [(1, 4, 6, 0), (2, 6, 7, 2)] [7.0, 8.0, 9.0]",
          "[(0, 3), (3, 6), (6, 8), (8, 10)] [(1, 1, 3, 0), (2, 0, 1, 2)] [6.0, 7.0, 8.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ckpt_bytes(P):
    return 2 * P + 12 * P                           # bf16 weights, fp32 master weights and two Adam moments

def write_time(nbytes, writers, per_writer_bw, storage_bw):
    return nbytes / min(writers * per_writer_bw, storage_bw)   # data-parallel copies are written once

def stall(nbytes, gpus, pcie_bw, writers, per_writer_bw, storage_bw, async_):
    if async_:
        return nbytes / gpus / pcie_bw              # training waits only for the copy to host memory
    return write_time(nbytes, writers, per_writer_bw, storage_bw)

x = ckpt_bytes(1e9) / 1e9
print(x, write_time(14e9, 4, 1e9, 2e9), stall(14e9, 8, 7e9, 4, 1e9, 2e9, True), stall(14e9, 8, 7e9, 4, 1e9, 2e9, False))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["14.0 7.0 0.25 7.0", "14.0 3.5 0.25 3.5", "16.0 7.0 0.25 7.0", "14.0 7.0 2.0 7.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>shard_ranges(n, k)</C>, k contiguous ranges with the first n mod k one element longer; <C>load_plan(meta, n,
          k_new)</C>, each new rank&apos;s list of (saved shard, start and end within it, offset in the new shard); and{" "}
          <C>reshard_load(shards, meta, n, k_new)</C>, building the new shards.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def shard_ranges(n, k):
    return [(0, n)] * k

def load_plan(meta, n, k_new):
    return []

def reshard_load(shards, meta, n, k_new):
    return shards
`,
        solution: RESHARD,
        tests: [
          { name: "ranges", code: `assert shard_ranges(7, 3) == [(0, 3), (3, 5), (5, 7)] and shard_ranges(4, 4) == [(0, 1), (1, 2), (2, 3), (3, 4)]\nassert load_plan(shard_ranges(6, 2), 6, 3) == [[(0, 0, 2, 0)], [(0, 2, 3, 0), (1, 0, 1, 1)], [(1, 1, 3, 0)]]` },
          { name: "load", code: `x = np.random.default_rng(0).normal(size=23)\nm = shard_ranges(23, 5)\ns = [x[a:b] for a, b in m]\nfor k in (1, 2, 7, 23):\n    out = reshard_load(s, m, 23, k)\n    assert len(out) == k and np.allclose(np.concatenate(out), x)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ckpt_bytes(P)</C>; <C>write_time(nbytes, writers, per_writer_bw, storage_bw)</C>; and{" "}
          <C>stall(nbytes, gpus, pcie_bw, writers, per_writer_bw, storage_bw, async_)</C>, how long training stops for a checkpoint
          of fully sharded state.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ckpt_bytes(P):
    return 2 * P

def write_time(nbytes, writers, per_writer_bw, storage_bw):
    return nbytes / storage_bw

def stall(nbytes, gpus, pcie_bw, writers, per_writer_bw, storage_bw, async_):
    return 0.0
`,
        solution: TIMING,
        tests: [
          { name: "size", code: `assert ckpt_bytes(10) == 140 and write_time(100, 10, 2.0, 50.0) == 5.0 and write_time(100, 10, 2.0, 10.0) == 10.0` },
          { name: "stall", code: `assert stall(80, 4, 10.0, 2, 1.0, 5.0, True) == 2.0 and stall(80, 4, 10.0, 2, 1.0, 5.0, False) == 40.0` },
        ],
      },
    },
    {
      key: "refine",
      rung: "stretch",
      prompt: (
        <p>
          A tensor of 4800 elements was saved in 12 equal shards and is loaded onto 16 ranks in equal shards. How many reads does the
          load plan contain?
        </p>
      ),
      answer: { kind: "numeric", value: 24, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Checkpoints bound how much work a failure can destroy. The next lesson asks how often failures happen at scale, how often to
        checkpoint in response, and how a job can continue on fewer GPUs instead of waiting for repairs.
      </p>
    </>
  ),
};
