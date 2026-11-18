import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LoaderTimelineViz } from "@/components/viz/LoaderTimelineViz";
import type { LessonContent } from "@/lib/types";

const TORCH = `import torch
from torch.utils.data import DataLoader, DistributedSampler

sampler = DistributedSampler(dataset, num_replicas=world, rank=rank, shuffle=True, seed=0)
loader = DataLoader(
    dataset, batch_size=256, sampler=sampler,
    num_workers=8,            # worker processes, each builds whole batches
    prefetch_factor=2,        # batches each worker may hold ready ahead of the GPU
    pin_memory=True,          # page-locked host buffers: faster, asynchronous copies
    persistent_workers=True,  # keep workers between epochs instead of re-forking
)
for epoch in range(epochs):
    sampler.set_epoch(epoch)  # otherwise every epoch repeats the same order
    for x, y in loader:
        x = x.cuda(non_blocking=True)   # overlaps with work already queued on the GPU
        y = y.cuda(non_blocking=True)
        ...`;

const SIM = `import math

def simulate(n, load, step, workers, prefetch=2):
    if workers == 0:
        return n * (load + step), n * load
    free = [0.0] * workers
    taken = []
    gpu = idle = 0.0
    for i in range(n):
        w = i % workers
        slot = taken[i - workers * prefetch] if i >= workers * prefetch else 0.0
        begin = max(free[w], slot)
        free[w] = begin + load
        start = max(free[w], gpu)
        idle += start - gpu
        taken.append(start)
        gpu = start + step
    return gpu, idle

def steady_step(load, step, workers):
    return load + step if workers == 0 else max(step, load / workers)

def min_workers(load, step):
    return math.ceil(load / step - 1e-9)`;

const SHARD = `import numpy as np

def sampler_indices(n, rank, world, seed=0, epoch=0, shuffle=True):
    order = np.random.default_rng(seed + epoch).permutation(n) if shuffle else np.arange(n)
    total = -(-n // world) * world
    order = np.concatenate([order, order[:total - n]])
    return order[rank::world].tolist()

def worker_split(indices, worker, num_workers):
    return indices[worker::num_workers]

def coverage(n, world, num_workers, shard_workers=True):
    seen = []
    for r in range(world):
        idx = sampler_indices(n, r, world, shuffle=False)
        for w in range(num_workers):
            seen += worker_split(idx, w, num_workers) if shard_workers else idx
    return len(seen), len(set(seen))`;

export const lesson: LessonContent = {
  id: "e6.3.2",
  minutes: 45,
  links: {
    requires: ["e6.3.1"],
    revisits: ["e5.3.3", "e3.5.1"],
    foreshadows: ["e6.4.5", "e6.3.3"],
  },

  puzzle: (
    <>
      <p>
        A vision model trains at 40% GPU utilisation. Doubling the batch size changes nothing, buying a faster GPU changes
        nothing, and the profiler shows the GPU idle between steps. On another project, moving from one GPU to eight makes
        validation accuracy look suspiciously good, and a check reveals that each image appears four times per epoch. Both
        problems live in the input pipeline. How fast must it be, and how is the work divided?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Training is a producer and a consumer. Worker processes read, decode and augment samples into batches; the GPU
        consumes one batch per step. The GPU can never run faster than batches arrive, so if one worker takes three step
        times to build a batch, you need three workers in parallel, and a small queue between them absorbs the variation.
        Separately, every sample must go to exactly one consumer: a distributed sampler splits indices across GPUs, and
        anything that splits again inside workers must do so on disjoint pieces.
      </p>
      <LoaderTimelineViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the DataLoader pipeline">
        <p>
          With <C>num_workers = 0</C> the main process loads each batch and then runs the step. With W workers, batch i is
          built by worker i mod W, each worker keeps up to <C>prefetch_factor</C> finished batches waiting, and the main
          process takes them in order. <C>pin_memory</C> copies batches into page-locked memory so that{" "}
          <C>.cuda(non_blocking=True)</C> can transfer them by DMA while the GPU computes.
        </p>
        <Code>{TORCH}</Code>
      </Definition>

      <Theorem title="steady-state step time">
        <p>
          If each batch takes time ℓ to load in one worker and time s to compute, with W ≥ 1 workers and a queue of at least
          one batch per worker, the time per step tends to <C>max(s, ℓ/W)</C>. With no workers it is <C>ℓ + s</C>. The
          GPU is fully used once <C>W ≥ ⌈ℓ/s⌉</C>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Over a long run of n steps, the workers together finish at most W batches per ℓ, so the n-th batch is ready no
          earlier than about nℓ/W, and the GPU needs ns of compute; the total is at least the larger of the two. Conversely,
          if ℓ/W ≤ s, each worker finishes batch i + W within ℓ ≤ Ws of finishing batch i, which is no later than the GPU
          needs it, so after the first batch the GPU never waits; if ℓ/W &gt; s, the workers are never blocked by a full
          queue and deliver one batch per ℓ/W. The simulation below implements exactly the rule of the figure.
        </p>
        <Code>{SIM}</Code>
      </Proof>

      <Example title="dividing the data">
        <p>
          A <C>DistributedSampler</C> permutes indices with seed plus epoch, pads the list to a multiple of the world size by
          repeating its start, and gives rank r every world-th index from r. With a map-style dataset the DataLoader then
          sends whole batches to workers, so nothing is duplicated. With an <C>IterableDataset</C> each worker runs the
          iterator itself, so it must take its own slice using <C>get_worker_info()</C>, or every worker yields every sample.
        </p>
        <Code>{SHARD}</Code>
      </Example>

      <Remark title="where the time actually goes">
        <p>
          Measure before tuning: time a loop over the loader alone, and a loop over a fixed batch alone. Typical fixes are
          more workers (bounded by CPU cores and memory, since each worker is a copy of the process), faster decoding, moving
          augmentation to the GPU, storing data in large sequential shards instead of millions of small files, and{" "}
          <C>persistent_workers</C> so each epoch does not pay the start-up cost again. A larger prefetch only helps when load
          times vary; it cannot fix a pipeline that is slower on average.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "workers",
      rung: "check",
      prompt: <p>A batch takes 120 ms to load in one worker and the training step takes 45 ms. How many workers keep the GPU busy?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.1 },
    },
    {
      key: "util",
      rung: "check",
      prompt: <p>With those times and only 2 workers, what fraction of the time is the GPU busy in steady state? Give two decimals.</p>,
      answer: { kind: "numeric", value: 0.75, tolerance: 0.006 },
    },
    {
      key: "dup",
      rung: "apply",
      prompt: (
        <p>
          On 2 GPUs with 4 workers each, an <C>IterableDataset</C> reads its whole shard in every worker and ignores{" "}
          <C>get_worker_info()</C>. What happens in one epoch?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Each sample of a rank's shard is yielded 4 times, once per worker, so the model sees every sample 4 times per epoch",
          "The DataLoader detects the duplicates and drops them",
          "Each sample is yielded 8 times, once per worker across both GPUs, regardless of the sampler",
          "Training is unaffected because workers share a single iterator",
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

def simulate(n, load, step, workers, prefetch=2):
    if workers == 0:
        return n * (load + step), n * load
    free = [0.0] * workers
    taken = []
    gpu = idle = 0.0
    for i in range(n):
        w = i % workers
        slot = taken[i - workers * prefetch] if i >= workers * prefetch else 0.0
        begin = max(free[w], slot)
        free[w] = begin + load
        start = max(free[w], gpu)
        idle += start - gpu
        taken.append(start)
        gpu = start + step
    return gpu, idle

def steady_step(load, step, workers):
    return load + step if workers == 0 else max(step, load / workers)

def min_workers(load, step):
    return math.ceil(load / step - 1e-9)

print(simulate(4, 3.0, 1.0, 0), simulate(4, 3.0, 1.0, 1), simulate(8, 3.0, 1.0, 3))
print(steady_step(3.0, 1.0, 2), min_workers(3.0, 1.0), min_workers(2.5, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(16.0, 12.0) (13.0, 9.0) (11.0, 3.0)\n1.5 3 3",
          "(16.0, 12.0) (16.0, 12.0) (11.0, 3.0)\n1.5 3 3",
          "(16.0, 12.0) (13.0, 9.0) (8.0, 0.0)\n1.5 3 3",
          "(16.0, 12.0) (13.0, 9.0) (11.0, 3.0)\n1.5 3 2",
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

def sampler_indices(n, rank, world, seed=0, epoch=0, shuffle=True):
    order = np.random.default_rng(seed + epoch).permutation(n) if shuffle else np.arange(n)
    total = -(-n // world) * world
    order = np.concatenate([order, order[:total - n]])
    return order[rank::world].tolist()

def worker_split(indices, worker, num_workers):
    return indices[worker::num_workers]

def coverage(n, world, num_workers, shard_workers=True):
    seen = []
    for r in range(world):
        idx = sampler_indices(n, r, world, shuffle=False)
        for w in range(num_workers):
            seen += worker_split(idx, w, num_workers) if shard_workers else idx
    return len(seen), len(set(seen))

print(sampler_indices(5, 0, 2, shuffle=False), sampler_indices(5, 1, 2, shuffle=False))
print(worker_split([0, 2, 4, 6, 8], 1, 2), coverage(10, 2, 2), coverage(10, 2, 2, shard_workers=False))
print(sampler_indices(6, 0, 2, epoch=0) == sampler_indices(6, 0, 2, epoch=1), sampler_indices(6, 0, 2) == sampler_indices(6, 0, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0, 2, 4] [1, 3, 0]\n[2, 6] (10, 10) (20, 10)\nFalse True",
          "[0, 2, 4] [1, 3]\n[2, 6] (10, 10) (20, 10)\nFalse True",
          "[0, 2, 4] [1, 3, 0]\n[2, 6] (10, 10) (20, 20)\nFalse True",
          "[0, 2, 4] [1, 3, 0]\n[2, 6] (10, 10) (20, 10)\nTrue True",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>simulate(n, load, step, workers, prefetch=2)</C>, returning the finishing time of the last step and the
          total GPU idle time under the rule above (with no workers, n(load + step) and n·load),{" "}
          <C>steady_step(load, step, workers)</C> and <C>min_workers(load, step)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def simulate(n, load, step, workers, prefetch=2):
    return n * step, 0.0

def steady_step(load, step, workers):
    return step

def min_workers(load, step):
    return 1
`,
        solution: SIM,
        tests: [
          { name: "simulate", code: `assert simulate(20, 3.0, 1.0, 0) == (80.0, 60.0) and simulate(20, 3.0, 1.0, 2) == (32.0, 12.0) and simulate(20, 3.0, 1.0, 4) == (23.0, 3.0)
assert simulate(10, 1.5, 1.0, 1) == (16.0, 6.0) and simulate(5, 1.0, 2.0, 2, 1) == (11.0, 1.0)` },
          { name: "steady", code: `assert steady_step(3.0, 1.0, 0) == 4.0 and steady_step(3.0, 1.0, 2) == 1.5 and steady_step(3.0, 1.0, 5) == 1.0
assert min_workers(120, 45) == 3 and min_workers(2.0, 1.0) == 2 and min_workers(0.6, 0.2) == 3` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sampler_indices(n, rank, world, seed=0, epoch=0, shuffle=True)</C> as described, using{" "}
          <C>np.random.default_rng(seed + epoch).permutation(n)</C>, <C>worker_split(indices, worker, num_workers)</C>, and{" "}
          <C>coverage(n, world, num_workers, shard_workers=True)</C>, returning the number of samples yielded across all ranks
          and workers in an unshuffled epoch and the number of distinct ones.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sampler_indices(n, rank, world, seed=0, epoch=0, shuffle=True):
    return list(range(n))

def worker_split(indices, worker, num_workers):
    return indices

def coverage(n, world, num_workers, shard_workers=True):
    return 0, 0
`,
        solution: SHARD,
        tests: [
          { name: "sampler", code: `parts = [sampler_indices(10, r, 4, seed=3, epoch=1) for r in range(4)]
p = np.random.default_rng(4).permutation(10).tolist(); assert parts[0] == [p[0], p[4], p[8]] and parts[2] == [p[2], p[6], p[0]] and all(len(x) == 3 for x in parts)
assert sampler_indices(7, 2, 3, shuffle=False) == [2, 5, 1] and sampler_indices(10, 0, 2, epoch=1) != sampler_indices(10, 0, 2, epoch=2)` },
          { name: "coverage", code: `assert worker_split(list(range(7)), 2, 3) == [2, 5] and coverage(12, 2, 3) == (12, 12) and coverage(12, 2, 3, False) == (36, 12) and coverage(10, 4, 1) == (12, 10)` },
        ],
      },
    },
    {
      key: "hours",
      rung: "stretch",
      prompt: (
        <p>
          An epoch has 10,000 steps of 0.2 s each. Loading takes 1.0 s per batch per worker, and the machine gives you 4
          workers. How many hours does one epoch take in steady state?
        </p>
      ),
      answer: { kind: "numeric", value: 0.6944, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        A pipeline that feeds the GPU is also part of the training state: its order, its random seeds and its position in the
        epoch. The next lesson asks what a checkpoint must contain so that a resumed run continues exactly as if it had never
        stopped.
      </p>
    </>
  ),
};
