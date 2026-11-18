import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ZeroShardViz } from "@/components/viz/ZeroShardViz";
import type { LessonContent } from "@/lib/types";

const TORCH = `import torch

torch.cuda.reset_peak_memory_stats()
loss = model(batch).loss
loss.backward()
opt.step()
print(torch.cuda.max_memory_allocated() / 1e9)   # peak bytes in live tensors
print(torch.cuda.max_memory_reserved() / 1e9)    # peak bytes held by the caching allocator
print(torch.cuda.memory_summary())               # per-pool breakdown, fragmentation

torch.cuda.memory._record_memory_history()       # then dump a snapshot and open it in
torch.cuda.memory._dump_snapshot("mem.pickle")   # pytorch.org/memory_viz to see every allocation

# PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True   lets segments grow instead of fragmenting

from torch.distributed.fsdp import fully_shard   # ZeRO stage 3: shard weights, grads and optimiser state
for block in model.blocks:
    fully_shard(block)
fully_shard(model)`;

const BUDGET = `import math

def train_bytes(P, optimizer='adam', precision='mixed'):
    state = {'adam': 8, 'sgdm': 4, 'sgd': 0}[optimizer]
    if precision == 'mixed':
        return {'weights': 2 * P, 'grads': 2 * P, 'optimizer': (state + 4) * P}
    return {'weights': 4 * P, 'grads': 4 * P, 'optimizer': state * P}

def zero_bytes(P, gpus, stage, optimizer='adam'):
    b = train_bytes(P, optimizer)
    shard = lambda k, on: b[k] / gpus if on else b[k]
    return shard('weights', stage >= 3) + shard('grads', stage >= 2) + shard('optimizer', stage >= 1)

def min_gpus(P, stage, gpu_gb, activation_gb, optimizer='adam'):
    for n in range(1, 4097):
        if zero_bytes(P, n, stage, optimizer) / 1e9 + activation_gb <= gpu_gb:
            return n
    return None`;

const ALLOC = `def round_size(n):
    return max(512, -(-n // 512) * 512)

class Allocator:
    def __init__(self):
        self.cached, self.live = [], {}
        self.allocated = self.reserved = self.peak_allocated = self.peak_reserved = 0

    def malloc(self, name, n):
        size = round_size(n)
        fits = [b for b in self.cached if b >= size]
        if fits:
            block = min(fits)
            self.cached.remove(block)
        else:
            block = size
            self.reserved += block
        self.live[name] = (block, size)
        self.allocated += size
        self.peak_allocated = max(self.peak_allocated, self.allocated)
        self.peak_reserved = max(self.peak_reserved, self.reserved)

    def free(self, name):
        block, size = self.live.pop(name)
        self.allocated -= size
        self.cached.append(block)

def run(trace):
    a = Allocator()
    for op, name, *n in trace:
        a.malloc(name, n[0]) if op == 'a' else a.free(name)
    return a.peak_allocated, a.peak_reserved, a.allocated, a.reserved`;

export const lesson: LessonContent = {
  id: "e6.4.4",
  minutes: 50,
  links: {
    requires: ["e6.4.3"],
    revisits: ["e6.4.1"],
    foreshadows: ["e6.4.5", "e6.5.4"],
  },

  puzzle: (
    <>
      <p>
        A 7-billion-parameter model is 14 GB in bfloat16, so it should fit on an 80 GB GPU with room to spare. Training it
        runs out of memory before the first step finishes. On eight GPUs with plain data parallelism it still does not fit,
        yet with a different wrapper the same eight GPUs train it with 40 GB free each. And on a model that does fit, the
        out-of-memory message says 30 GB is reserved but unallocated. Where do the bytes go, and which of them can be
        shared, sharded or reclaimed?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Training memory has four parts: model state that scales with the parameter count (weights, gradients and optimiser
        state), activations that scale with batch and sequence length, temporary workspace, and allocator overhead.
        For Adam in mixed precision, model state is 16 bytes per parameter, of which only 2 are the weights you think of as
        the model. Data parallelism copies all 16 onto every GPU; sharding splits them, since each GPU only needs its slice of
        optimiser state to update its slice of parameters. Finally, PyTorch keeps freed blocks to reuse, which is fast but
        can leave memory reserved in pieces too small for the next request.
      </p>
      <ZeroShardViz />
    </>
  ),

  theory: (
    <>
      <Definition title="model state and ZeRO">
        <p>
          With P parameters, mixed-precision Adam holds bf16 weights (2P bytes), bf16 gradients (2P) and fp32 master
          weights and two moments (12P). ZeRO, the zero redundancy optimiser, shards this across N data-parallel GPUs: stage 1
          shards the optimiser state, stage 2 also the gradients (reduce-scatter instead of all-reduce), stage 3 also the
          weights, gathering each layer&apos;s weights just before use. PyTorch&apos;s FSDP implements stage 3.
        </p>
        <Code>{TORCH}</Code>
      </Definition>

      <Theorem title="per-GPU model state">
        <p>
          Under ZeRO with N GPUs, per-GPU model state is 16P bytes at stage 0, <C>4P + 12P/N</C> at stage 1,{" "}
          <C>2P + 14P/N</C> at stage 2 and <C>16P/N</C> at stage 3. Communication volume per step is the same at stages 0
          to 2 and 1.5 times that at stage 3.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each stage replaces a full copy of one component with a 1/N shard, which gives the formulas directly. For
          communication: plain data parallelism all-reduces the gradients, which a ring implements as a reduce-scatter and an
          all-gather, each moving about the size of the gradients. Stages 1 and 2 do the reduce-scatter on gradients, update
          the local shard, then all-gather the updated weights: the same two collectives. Stage 3 must also all-gather the
          weights for the backward pass, since they were freed after the forward, adding a third.
        </p>
        <Code>{BUDGET}</Code>
      </Proof>

      <Example title="the caching allocator">
        <p>
          <C>cudaMalloc</C> and <C>cudaFree</C> are slow and synchronise the device, so PyTorch rounds requests up, keeps
          freed blocks in a cache and hands them out again. <C>memory_allocated</C> counts live tensors; <C>memory_reserved</C>{" "}
          counts everything the cache holds. Requests that grow over time, such as varying sequence lengths, find no cached
          block large enough and reserve new memory while smaller blocks sit idle. The model below has no splitting or
          merging of blocks, which the real allocator does, but shows the same failure.
        </p>
        <Code>{ALLOC}</Code>
      </Example>

      <Remark title="what to try, in order">
        <p>
          Measure peak allocated and reserved first. Then: mixed precision; activation checkpointing; a smaller micro-batch
          with gradient accumulation; ZeRO or FSDP sharding; fused or memory-efficient attention; an 8-bit or factored
          optimiser state; CPU offload of optimiser state. For fragmentation, sort or bucket sequence lengths, warm up with
          the largest batch first, or set <C>expandable_segments:True</C>.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "state",
      rung: "check",
      prompt: <p>How many gigabytes of model state does mixed-precision Adam training of a 7-billion-parameter model need on one GPU?</p>,
      answer: { kind: "numeric", value: 112, tolerance: 0.01 },
    },
    {
      key: "z2",
      rung: "check",
      prompt: <p>With ZeRO stage 2 on 16 GPUs, how many gigabytes per GPU is that?</p>,
      answer: { kind: "numeric", value: 20.125, tolerance: 0.01 },
    },
    {
      key: "frag",
      rung: "apply",
      prompt: <p>An out-of-memory error reports 30 GB reserved but unallocated. What is the most likely cause?</p>,
      answer: {
        kind: "choice",
        options: [
          "Fragmentation: the caching allocator holds freed blocks that are each too small for the failing request, typically from tensor sizes that keep growing; bucketing shapes or expandable segments helps",
          "A memory leak in a Python list of tensors",
          "The optimiser state was allocated twice",
          "The GPU driver reserves 30 GB for itself",
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

def train_bytes(P, optimizer='adam', precision='mixed'):
    state = {'adam': 8, 'sgdm': 4, 'sgd': 0}[optimizer]
    if precision == 'mixed':
        return {'weights': 2 * P, 'grads': 2 * P, 'optimizer': (state + 4) * P}
    return {'weights': 4 * P, 'grads': 4 * P, 'optimizer': state * P}

def zero_bytes(P, gpus, stage, optimizer='adam'):
    b = train_bytes(P, optimizer)
    shard = lambda k, on: b[k] / gpus if on else b[k]
    return shard('weights', stage >= 3) + shard('grads', stage >= 2) + shard('optimizer', stage >= 1)

def min_gpus(P, stage, gpu_gb, activation_gb, optimizer='adam'):
    for n in range(1, 4097):
        if zero_bytes(P, n, stage, optimizer) / 1e9 + activation_gb <= gpu_gb:
            return n
    return None

print(train_bytes(1e9), train_bytes(1e9, 'sgd', 'fp32')['optimizer'])
print([round(zero_bytes(7e9, 8, s) / 1e9, 2) for s in range(4)], min_gpus(7e9, 0, 80, 20), min_gpus(7e9, 3, 80, 20), min_gpus(70e9, 3, 80, 20))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'weights': 2000000000.0, 'grads': 2000000000.0, 'optimizer': 12000000000.0} 0.0\n[112.0, 38.5, 26.25, 14.0] None 2 19",
          "{'weights': 2000000000.0, 'grads': 2000000000.0, 'optimizer': 8000000000.0} 0.0\n[112.0, 38.5, 26.25, 14.0] None 2 19",
          "{'weights': 2000000000.0, 'grads': 2000000000.0, 'optimizer': 12000000000.0} 0.0\n[112.0, 14.0, 14.0, 14.0] None 2 19",
          "{'weights': 2000000000.0, 'grads': 2000000000.0, 'optimizer': 12000000000.0} 0.0\n[112.0, 38.5, 26.25, 14.0] 2 2 19",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def round_size(n):
    return max(512, -(-n // 512) * 512)

class Allocator:
    def __init__(self):
        self.cached, self.live = [], {}
        self.allocated = self.reserved = self.peak_allocated = self.peak_reserved = 0

    def malloc(self, name, n):
        size = round_size(n)
        fits = [b for b in self.cached if b >= size]
        if fits:
            block = min(fits)
            self.cached.remove(block)
        else:
            block = size
            self.reserved += block
        self.live[name] = (block, size)
        self.allocated += size
        self.peak_allocated = max(self.peak_allocated, self.allocated)
        self.peak_reserved = max(self.peak_reserved, self.reserved)

    def free(self, name):
        block, size = self.live.pop(name)
        self.allocated -= size
        self.cached.append(block)

def run(trace):
    a = Allocator()
    for op, name, *n in trace:
        a.malloc(name, n[0]) if op == 'a' else a.free(name)
    return a.peak_allocated, a.peak_reserved, a.allocated, a.reserved

print(round_size(1), round_size(512), round_size(513), run([('a', 'x', 1000), ('f', 'x'), ('a', 'y', 2000), ('f', 'y'), ('a', 'z', 900)]))
print(run([('a', f't{i}', 1024 * (i + 1)) for i in range(3)] + [('f', f't{i}') for i in range(3)] + [('a', 'big', 4096)]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "512 512 1024 (2048, 3072, 1024, 3072)\n(6144, 10240, 4096, 10240)",
          "512 512 1024 (2048, 2048, 1024, 2048)\n(6144, 6144, 4096, 6144)",
          "1 512 513 (2000, 3000, 900, 3000)\n(6144, 10240, 4096, 10240)",
          "512 512 1024 (2048, 3072, 1024, 4096)\n(6144, 10240, 4096, 10240)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>train_bytes(P, optimizer=&apos;adam&apos;, precision=&apos;mixed&apos;)</C>, a dict of weights, grads and
          optimizer bytes (Adam 8, SGD with momentum 4, SGD 0 bytes of state per parameter, plus 4 for a master copy in mixed
          precision, where weights and grads take 2 bytes instead of 4), <C>zero_bytes(P, gpus, stage, optimizer=&apos;adam&apos;)</C>{" "}
          for mixed precision, and <C>min_gpus(P, stage, gpu_gb, activation_gb, optimizer=&apos;adam&apos;)</C>, the
          fewest GPUs (up to 4096) on which model state plus activations fit, or None.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def train_bytes(P, optimizer='adam', precision='mixed'):
    return {'weights': 2 * P, 'grads': 0, 'optimizer': 0}

def zero_bytes(P, gpus, stage, optimizer='adam'):
    return 2 * P

def min_gpus(P, stage, gpu_gb, activation_gb, optimizer='adam'):
    return 1
`,
        solution: BUDGET,
        tests: [
          { name: "bytes", code: `assert train_bytes(10) == {'weights': 20, 'grads': 20, 'optimizer': 120} and train_bytes(10, 'sgdm', 'fp32') == {'weights': 40, 'grads': 40, 'optimizer': 40}
assert train_bytes(10, 'sgd') == {'weights': 20, 'grads': 20, 'optimizer': 40} and [zero_bytes(16, 4, s) for s in range(4)] == [256, 112, 88, 64]` },
          { name: "gpus", code: `assert min_gpus(1e9, 0, 80, 20) == 1 and min_gpus(7e9, 1, 80, 20) == 3 and min_gpus(7e9, 2, 80, 20) == 3 and min_gpus(7e9, 3, 40, 20) == 6
assert min_gpus(7e9, 1, 40, 20) is None and min_gpus(1e9, 0, 80, 20, 'sgd') == 1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With the given <C>round_size</C>, write a class <C>Allocator</C> with <C>malloc(name, n)</C>, which reuses the
          smallest cached block at least as large as the rounded request or else reserves a new one, and{" "}
          <C>free(name)</C>, which returns the block to the cache, tracking allocated, reserved and their peaks, and{" "}
          <C>run(trace)</C>, which replays (&apos;a&apos;, name, n) and (&apos;f&apos;, name) events and returns peak
          allocated, peak reserved, allocated and reserved.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def round_size(n):
    return max(512, -(-n // 512) * 512)

class Allocator:
    def __init__(self):
        self.allocated = self.reserved = self.peak_allocated = self.peak_reserved = 0

    def malloc(self, name, n):
        pass

    def free(self, name):
        pass

def run(trace):
    return 0, 0, 0, 0
`,
        solution: ALLOC,
        tests: [
          { name: "reuse", code: `a = Allocator(); a.malloc('p', 3000); a.malloc('q', 600); a.free('p'); a.malloc('r', 1000)
assert (a.allocated, a.reserved) == (2048, 4096) and a.live['r'] == (3072, 1024) and a.cached == []
a.free('q'); a.malloc('s', 100); assert (a.allocated, a.reserved, a.peak_allocated) == (1536, 4096, 4096)` },
          { name: "grow", code: `t = []
for i in range(1, 5):
    t += [('a', 'x', 512 * i), ('f', 'x')]
assert run(t) == (2048, 5120, 0, 5120) and run([('a', 'a', 4000), ('a', 'b', 10), ('f', 'a'), ('a', 'c', 3000)]) == (4608, 4608, 3584, 4608)` },
        ],
      },
    },
    {
      key: "seventy",
      rung: "stretch",
      prompt: (
        <p>
          A 70-billion-parameter model is trained with ZeRO stage 3 on 80 GB GPUs, with 30 GB of activations per GPU. How many
          GPUs are needed at least?
        </p>
      ),
      answer: { kind: "numeric", value: 23, tolerance: 0.1 },
    },
  ],

  glimpse: (
    <>
      <p>
        Budgets on paper only go so far; the profiler shows where time and memory actually go in a running step. The next
        lesson reads its traces.
      </p>
    </>
  ),
};
