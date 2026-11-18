import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RooflineViz } from "@/components/viz/RooflineViz";
import type { LessonContent } from "@/lib/types";

const TORCH = `import torch
from torch.profiler import profile, schedule, ProfilerActivity, record_function

with profile(
    activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA],
    schedule=schedule(wait=1, warmup=2, active=3),   # skip start-up and compile steps
    on_trace_ready=torch.profiler.tensorboard_trace_handler("./trace"),
    record_shapes=True, profile_memory=True, with_stack=True,
) as prof:
    for step, batch in enumerate(loader):
        with record_function("forward"):             # a named range in the trace
            loss = model(batch)
        loss.backward()
        opt.step(); opt.zero_grad()
        prof.step()
        if step == 6:
            break

print(prof.key_averages().table(sort_by="self_cuda_time_total", row_limit=10))
# open the JSON trace in Perfetto (ui.perfetto.dev): CPU threads above, CUDA streams below`;

const TRACE = `def self_times(events):
    cpu = sorted((e for e in events if e['cat'] == 'cpu_op'), key=lambda e: (e['ts'], -e['dur']))
    selfs, stack = [e['dur'] for e in cpu], []
    for i, e in enumerate(cpu):
        while stack and cpu[stack[-1]]['ts'] + cpu[stack[-1]]['dur'] <= e['ts']:
            stack.pop()
        if stack:
            selfs[stack[-1]] -= e['dur']
        stack.append(i)
    return [(e['name'], s) for e, s in zip(cpu, selfs)]

def top_ops(events, k=3):
    total = {}
    for name, s in self_times(events):
        total[name] = total.get(name, 0) + s
    return sorted(total.items(), key=lambda t: -t[1])[:k]

def gpu_busy(events):
    ks = sorted((e['ts'], e['ts'] + e['dur']) for e in events if e['cat'] == 'kernel')
    busy, end = 0, ks[0][0]
    for s, t in ks:
        busy += max(0, t - max(s, end))
        end = max(end, t)
    return busy, end - ks[0][0] - busy`;

const ROOF = `def model_flops(P, tokens):
    return 6 * P * tokens

def mfu(P, tokens, step_time, peak_flops, gpus=1):
    return model_flops(P, tokens) / step_time / (peak_flops * gpus)

def roofline(flops, nbytes, peak_flops, bandwidth):
    t_compute, t_memory = flops / peak_flops, nbytes / bandwidth
    return max(t_compute, t_memory), 'compute' if t_compute >= t_memory else 'memory'`;

export const lesson: LessonContent = {
  id: "e6.4.5",
  minutes: 50,
  links: {
    requires: ["e6.4.4"],
    revisits: ["e6.1.1", "e6.4.2"],
    foreshadows: ["e6.6.3"],
  },

  puzzle: (
    <>
      <p>
        A training step takes 410 ms. The model does 2.1 × 10¹⁴ floating-point operations per step on a GPU rated at 10¹⁵
        per second, so the arithmetic alone should take 210 ms. Somewhere 200 ms disappears. It might be a slow kernel, the
        GPU waiting for the CPU, a hidden synchronisation, the data loader, or memory-bound operations that no amount of
        FLOPs will speed up. Guessing wastes days. What does a profile of the step show, and how do you read it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A profiler records timed events: every PyTorch operator on the CPU, nested inside the ones that called it, and every
        kernel and copy on the GPU, linked to the operator that launched it. Three readings answer most questions. Which
        operators have the most self time, meaning time not spent in their children? Where are the gaps in the GPU timeline,
        and what was the CPU doing then? And for the kernels that dominate, are they limited by arithmetic or by memory
        traffic? The last is the roofline: compare a kernel&apos;s FLOPs per byte with the GPU&apos;s ratio of compute to
        bandwidth.
      </p>
      <RooflineViz />
    </>
  ),

  theory: (
    <>
      <Definition title="torch.profiler">
        <p>
          The profiler records CPU operator ranges and, through CUPTI, GPU kernels and memory copies, and writes a Chrome
          trace. <C>key_averages()</C> aggregates by operator name, reporting total time (including children) and self
          time. A schedule skips the first steps, which include compilation and allocator warm-up, and records only a few,
          since tracing slows the program down.
        </p>
        <Code>{TORCH}</Code>
      </Definition>

      <Theorem title="self time and GPU idle time">
        <p>
          For properly nested CPU ranges, the self time of a range is its duration minus the durations of its direct
          children, and the self times of all ranges sum to the total duration of the top-level ranges. GPU busy time is the
          length of the union of kernel intervals, and idle time is the span from the first kernel&apos;s start to the last
          one&apos;s end minus busy time.
        </p>
      </Theorem>
      <Proof>
        <p>
          Nesting means each instant inside a top-level range lies in a chain of ranges, and is counted in the self time of
          exactly the innermost one; summing gives the top-level durations. A stack processes ranges in start order: pop
          those that have ended before the current one starts; the top is then its parent, from whose self time its
          duration is subtracted. For the GPU, overlapping kernels on different streams would be double counted by summing
          durations, so sort by start and add only the part of each interval past the furthest end seen so far.
        </p>
        <Code>{TRACE}</Code>
      </Proof>

      <Example title="model FLOPs utilisation and the roofline">
        <p>
          A dense transformer&apos;s training step costs about 6 FLOPs per parameter per token: 2 for the forward pass and
          4 for the backward. Model FLOPs utilisation is those FLOPs divided by step time and peak throughput; 40 to 60% is
          good for large models. For a single kernel, the roofline compares time at peak compute with time at peak
          bandwidth; the larger is a lower bound, and which one it is says what to optimise.
        </p>
        <Code>{ROOF}</Code>
      </Example>

      <Remark title="common signatures">
        <p>
          Gaps in the GPU stream while the CPU is busy in Python: launch-bound, so use larger batches, fusion or CUDA graphs.
          A long <C>cudaStreamSynchronize</C> or <C>aten::item</C> on the CPU: the CPU is waiting on the GPU, and the call
          that triggered it is the problem, not its own cost. Large self time in elementwise kernels: memory-bound work
          that compilation can fuse. Gaps at the start of each step with the loader active: an input pipeline problem. NCCL
          kernels not overlapping compute: communication exposed.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "mfu",
      rung: "check",
      prompt: (
        <p>
          A 1-billion-parameter model processes 500,000 tokens per step in 1.5 s on 8 GPUs of 312 TFLOP/s each. What is its
          model FLOPs utilisation? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.8, tolerance: 0.006 },
    },
    {
      key: "ridge",
      rung: "check",
      prompt: <p>At what arithmetic intensity, in FLOPs per byte, is the ridge of a GPU with 989 TFLOP/s and 3.35 TB/s? Round to a whole number.</p>,
      answer: { kind: "numeric", value: 295, tolerance: 0.6 },
    },
    {
      key: "sync",
      rung: "apply",
      prompt: <p>The profiler table puts <C>cudaStreamSynchronize</C> at the top of CPU self time, called from <C>aten::item</C>. What does that mean?</p>,
      answer: {
        kind: "choice",
        options: [
          "The CPU spends that time waiting for queued GPU work to finish so it can read a value; the cost belongs to the kernels before it and to the fact that the CPU cannot launch ahead, not to item itself",
          "Reading a scalar from the GPU is intrinsically slow",
          "The GPU is idle during that time",
          "The data loader is the bottleneck",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def self_times(events):
    cpu = sorted((e for e in events if e['cat'] == 'cpu_op'), key=lambda e: (e['ts'], -e['dur']))
    selfs, stack = [e['dur'] for e in cpu], []
    for i, e in enumerate(cpu):
        while stack and cpu[stack[-1]]['ts'] + cpu[stack[-1]]['dur'] <= e['ts']:
            stack.pop()
        if stack:
            selfs[stack[-1]] -= e['dur']
        stack.append(i)
    return [(e['name'], s) for e, s in zip(cpu, selfs)]

def top_ops(events, k=3):
    total = {}
    for name, s in self_times(events):
        total[name] = total.get(name, 0) + s
    return sorted(total.items(), key=lambda t: -t[1])[:k]

def gpu_busy(events):
    ks = sorted((e['ts'], e['ts'] + e['dur']) for e in events if e['cat'] == 'kernel')
    busy, end = 0, ks[0][0]
    for s, t in ks:
        busy += max(0, t - max(s, end))
        end = max(end, t)
    return busy, end - ks[0][0] - busy

ev = [dict(name='step', cat='cpu_op', ts=0, dur=100), dict(name='linear', cat='cpu_op', ts=5, dur=30), dict(name='matmul', cat='cpu_op', ts=10, dur=20), dict(name='linear', cat='cpu_op', ts=40, dur=30), dict(name='matmul', cat='cpu_op', ts=45, dur=20), dict(name='item', cat='cpu_op', ts=75, dur=20)]
ev += [dict(name='gemm', cat='kernel', ts=12, dur=40), dict(name='gemm', cat='kernel', ts=50, dur=40), dict(name='relu', cat='kernel', ts=95, dur=5)]
print([s for _, s in self_times(ev)], top_ops(ev), gpu_busy(ev))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[20, 10, 20, 10, 20, 20] [('matmul', 40), ('step', 20), ('linear', 20)] (83, 5)",
          "[100, 30, 20, 30, 20, 20] [('step', 100), ('linear', 60), ('matmul', 40)] (85, 3)",
          "[20, 10, 20, 10, 20, 20] [('matmul', 40), ('step', 20), ('linear', 20)] (85, 3)",
          "[20, 10, 20, 10, 20, 20] [('matmul', 40), ('linear', 20), ('item', 20)] (83, 5)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def model_flops(P, tokens):
    return 6 * P * tokens

def mfu(P, tokens, step_time, peak_flops, gpus=1):
    return model_flops(P, tokens) / step_time / (peak_flops * gpus)

def roofline(flops, nbytes, peak_flops, bandwidth):
    t_compute, t_memory = flops / peak_flops, nbytes / bandwidth
    return max(t_compute, t_memory), 'compute' if t_compute >= t_memory else 'memory'

print(model_flops(1e9, 1e6) / 1e15, round(mfu(7e9, 4e6, 40.0, 1e15, 8), 3))
n = 4096; t, b = roofline(2 * n ** 3, 3 * n * n * 2, 1e15, 3e12); print(round(t * 1e6, 1), b, roofline(n * n, 2 * n * n * 2, 1e15, 3e12)[1])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["6.0 0.525\n137.4 compute memory", "2.0 0.175\n137.4 compute memory", "6.0 0.525\n33.6 memory memory", "6.0 4.2\n137.4 compute memory"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Events are dicts with name, cat (&apos;cpu_op&apos; or &apos;kernel&apos;), ts and dur. Write{" "}
          <C>self_times(events)</C>, returning (name, self time) for the CPU ops in start order (longer first on ties),{" "}
          <C>top_ops(events, k=3)</C>, the k names with the largest summed self time, and <C>gpu_busy(events)</C>, returning
          busy and idle time of the kernel timeline.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def self_times(events):
    return [(e['name'], e['dur']) for e in events if e['cat'] == 'cpu_op']

def top_ops(events, k=3):
    return []

def gpu_busy(events):
    return 0, 0
`,
        solution: TRACE,
        tests: [
          { name: "self", code: `ev = [dict(name='a', cat='cpu_op', ts=0, dur=50), dict(name='b', cat='cpu_op', ts=0, dur=20), dict(name='c', cat='cpu_op', ts=5, dur=10), dict(name='b', cat='cpu_op', ts=30, dur=15), dict(name='d', cat='cpu_op', ts=60, dur=7)]
assert self_times(ev) == [('a', 15), ('b', 10), ('c', 10), ('b', 15), ('d', 7)] and top_ops(ev, 2) == [('b', 25), ('a', 15)]
assert sum(s for _, s in self_times(ev)) == 57` },
          { name: "gpu", code: `ev = [dict(name='k', cat='kernel', ts=t, dur=d) for t, d in [(10, 5), (12, 10), (30, 4), (31, 1), (40, 2)]] + [dict(name='x', cat='cpu_op', ts=0, dur=100)]
assert gpu_busy(ev) == (18, 14) and gpu_busy([dict(name='k', cat='kernel', ts=3, dur=4)]) == (4, 0)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>model_flops(P, tokens)</C>, the 6PT training estimate, <C>mfu(P, tokens, step_time, peak_flops, gpus=1)</C>,
          and <C>roofline(flops, nbytes, peak_flops, bandwidth)</C>, returning the lower-bound time and &apos;compute&apos; or
          &apos;memory&apos; for the larger term (&apos;compute&apos; on a tie).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def model_flops(P, tokens):
    return 0

def mfu(P, tokens, step_time, peak_flops, gpus=1):
    return 0.0

def roofline(flops, nbytes, peak_flops, bandwidth):
    return 0.0, 'compute'
`,
        solution: ROOF,
        tests: [
          { name: "mfu", code: `assert model_flops(2, 5) == 60 and abs(mfu(1e9, 5e5, 1.5, 312e12, 8) - 3e15 / 1.5 / (8 * 312e12)) < 1e-12 and mfu(10, 10, 1.0, 600) == 1.0` },
          { name: "roof", code: `assert roofline(100, 10, 10, 1) == (10.0, 'compute') and roofline(100, 1000, 10, 1) == (1000.0, 'memory') and roofline(10, 20, 1, 1) == (20.0, 'memory') and roofline(6, 3, 2, 1)[1] == 'compute'` },
        ],
      },
    },
    {
      key: "decode",
      rung: "stretch",
      prompt: (
        <p>
          Generating one token with a 7-billion-parameter bfloat16 model at batch size 1 reads every weight once. On a GPU
          with 3.35 TB/s of bandwidth, what is the most tokens per second it can produce? Round to a whole number.
        </p>
      ),
      answer: { kind: "numeric", value: 239, tolerance: 0.6 },
    },
  ],

  glimpse: (
    <>
      <p>
        That completes PyTorch&apos;s side of the engine room. JAX makes different choices: functions that are pure by
        construction, transformed by <C>jit</C>, <C>grad</C> and <C>vmap</C>. The next lesson starts with the functional style
        it requires.
      </p>
    </>
  ),
};
