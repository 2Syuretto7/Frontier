import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { KernelTimingViz } from "@/components/viz/KernelTimingViz";
import type { LessonContent } from "@/lib/types";

const RATES = `def tflops(M, N, K, ms):
    return 2 * M * N * K / (ms * 1e-3) / 1e12

def bandwidth_gbs(bytes_moved, ms):
    return bytes_moved / (ms * 1e-3) / 1e9

def pct_of_roofline(achieved, peak, bw, ai):
    return achieved / min(peak, bw * ai)`;

const STATS = `import math

def quantile(xs, p):
    s = sorted(xs)
    pos = p * (len(s) - 1)
    lo, hi = math.floor(pos), math.ceil(pos)
    return s[lo] + (pos - lo) * (s[hi] - s[lo])

def summarize(times, warmup):
    t = times[warmup:]
    return quantile(t, 0.5), quantile(t, 0.75) - quantile(t, 0.25)

def clearly_faster(a, b):
    return quantile(a, 0.75) < quantile(b, 0.25)`;

const HARNESS = `import torch

def bench(fn, *args, warmup=5, reps=50, flush_mb=256):
    flush = torch.empty(flush_mb * 2**20, dtype=torch.uint8, device="cuda")
    for _ in range(warmup):                 # compilation, autotuning, clock ramp-up
        fn(*args)
    times = []
    for _ in range(reps):
        flush.zero_()                       # evict the inputs from L2
        start = torch.cuda.Event(enable_timing=True)
        end = torch.cuda.Event(enable_timing=True)
        start.record()                      # recorded on the GPU's stream, in order
        fn(*args)
        end.record()
        end.synchronize()                   # wait for the GPU before reading the timer
        times.append(start.elapsed_time(end))   # milliseconds
    return times`;

export const lesson: LessonContent = {
  id: "e9.2.4",
  minutes: 50,
  links: {
    requires: ["e9.2.1", "e7.1.3"],
    revisits: ["l10.2.1", "e7.4.3"],
    foreshadows: ["e9.3.3", "e9.6.2"],
  },

  puzzle: (
    <>
      <p>
        You time a new kernel in Python with <C>time.perf_counter()</C> around the call and get 8 microseconds for a matrix
        multiplication that should take milliseconds. You add a synchronisation, run it once, and get 40 milliseconds. You run it a
        hundred times and the fastest run implies a memory bandwidth above the GPU&apos;s specification. Which of these numbers, if any,
        should you report?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A GPU runs asynchronously from the program that launches it, keeps recently used data in a large cache, compiles and tunes some
        kernels on first use, and changes its clock speed with temperature and load. Each of these can make a measurement wrong by more
        than the improvement being measured. A sound benchmark times on the GPU itself, warms up first, clears the cache between runs,
        repeats, summarises with a robust statistic, and converts the result into a rate that can be compared with the hardware&apos;s
        limits.
      </p>
      <KernelTimingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="timing on the GPU">
        <p>
          A kernel launch returns to the host as soon as the work is queued, so a host clock around the call measures the launch. CUDA
          events are markers recorded into the GPU&apos;s stream; the time between two events is measured by the GPU as it reaches them.
          A harness warms up, flushes L2 by writing a buffer larger than it, records events around each run, and waits for the end
          event before reading the time.
        </p>
        <Code>{HARNESS}</Code>
      </Definition>

      <Definition title="rates and the roofline">
        <p>
          A time means little alone. Convert it to a rate: <M>{"2MNK/t"}</M> for a matrix multiplication (<C>tflops</C>), bytes moved over
          time for a memory-bound kernel (<C>bandwidth_gbs</C>), counting each input read once and each output written once. Then compare
          with the roofline (e7.4.3): achieved rate over <M>{"\\min(P, B \\cdot I)"}</M> for peak P, bandwidth B and intensity I
          (<C>pct_of_roofline</C>). A rate above the roofline means the measurement is wrong, often because the data came from cache.
        </p>
        <Code>{RATES}</Code>
      </Definition>

      <Theorem title="the median ignores a minority of bad runs">
        <p>
          Let n runs be sorted, and suppose fewer than n/2 of them are corrupted arbitrarily (made slower or faster by any amount). Then
          the median of the corrupted list lies between the smallest and the largest uncorrupted value. The mean has no such bound: one
          corrupted run can move it by any amount.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let u be the smallest uncorrupted value. Every value below u is corrupted, so fewer than n/2 values are below u, and the element
          at the median position, which has at least half the values at or below it, is at least u. Symmetrically it is at most the
          largest uncorrupted value. For the mean, changing one run by <M>{"\\Delta"}</M> changes the mean by <M>{"\\Delta/n"}</M>, which
          is unbounded as <M>{"\\Delta"}</M> is. The minimum is no better: one run that was fast for a spurious reason, such as data left
          in cache, becomes the result.
        </p>
      </Proof>

      <Remark title="summaries and comparisons">
        <p>
          Report the median after warm-up with a measure of spread such as the interquartile range (<C>quantile</C>,{" "}
          <C>summarize</C>), and say how many runs and which GPU. When comparing two kernels, interleave their runs so that throttling
          affects both, and claim a difference only when it is clear of the noise; a crude but useful rule is that the slower
          kernel&apos;s first quartile lies above the faster one&apos;s third (<C>clearly_faster</C>). The error bar methods of l10.2.1
          apply to a mean over many independent runs. Finally, benchmark the shapes the application uses: a kernel tuned for square
          matrices can be slow on the skinny ones that inference produces.
        </p>
        <Code>{STATS}</Code>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The 8 microseconds is the launch, the 40 milliseconds includes compilation on the first call, and the fastest of a hundred runs
          with a warm cache read some of its inputs from L2, which is why it beat the memory&apos;s specification. Report the median of
          event-timed runs after warm-up with L2 flushed, converted to TFLOP/s or GB/s and set against the roofline.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "rate",
      rung: "check",
      prompt: (
        <p>
          A multiplication of two 8192 by 8192 matrices takes 70 ms. What throughput does it achieve, in TFLOP/s? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 15.707, tolerance: 0.01 },
    },
    {
      key: "bw",
      rung: "check",
      prompt: (
        <p>
          A kernel adds two float32 vectors of <M>{"2^{28}"}</M> elements into a third in 1.6 ms. What bandwidth does it achieve in GB/s
          (<M>{"10^9"}</M> bytes per second)?
        </p>
      ),
      answer: { kind: "numeric", value: 2013.3, tolerance: 1 },
    },
    {
      key: "async",
      rung: "apply",
      prompt: <p>What does a host timer around a kernel launch measure when there is no synchronisation?</p>,
      answer: {
        kind: "choice",
        options: [
          "Mostly the time to queue the launch, since the call returns before the kernel runs",
          "The kernel's execution time, since launches block until completion",
          "The time of the previous kernel",
          "The kernel's execution time plus the time to copy results to the host",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def tflops(M, N, K, ms):
    return 2 * M * N * K / (ms * 1e-3) / 1e12

def bandwidth_gbs(bytes_moved, ms):
    return bytes_moved / (ms * 1e-3) / 1e9

def pct_of_roofline(achieved, peak, bw, ai):
    return achieved / min(peak, bw * ai)

t = tflops(1024, 1024, 1024, 0.5)
print(round(t, 3), bandwidth_gbs(3e9, 2.0), pct_of_roofline(10, 100, 2, 25))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4.295 1500.0 0.2",
          "2.147 1500.0 0.2",
          "4.295 1.5 0.2",
          "4.295 1500.0 0.1",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def quantile(xs, p):
    s = sorted(xs)
    pos = p * (len(s) - 1)
    lo, hi = math.floor(pos), math.ceil(pos)
    return s[lo] + (pos - lo) * (s[hi] - s[lo])

def summarize(times, warmup):
    t = times[warmup:]
    return quantile(t, 0.5), quantile(t, 0.75) - quantile(t, 0.25)

def clearly_faster(a, b):
    return quantile(a, 0.75) < quantile(b, 0.25)

xs = [5, 1, 4, 2, 3]
print(quantile(xs, 0.5), quantile(xs, 0.25), summarize([90, 10, 11, 12, 13], 1), clearly_faster([1, 2, 3, 4], [5, 6, 7, 8]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3.0 2.0 (11.5, 1.5) True",
          "3.0 2.0 (12, 1.5) True",
          "3.0 1.5 (11.5, 1.5) True",
          "3.0 2.0 (11.5, 1.5) False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>tflops(M, N, K, ms)</C>, <C>bandwidth_gbs(bytes_moved, ms)</C> and <C>pct_of_roofline(achieved, peak, bw, ai)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def tflops(M, N, K, ms):
    return 0.0

def bandwidth_gbs(bytes_moved, ms):
    return 0.0

def pct_of_roofline(achieved, peak, bw, ai):
    return 1.0
`,
        solution: RATES,
        tests: [
          { name: "throughput", code: `assert abs(tflops(1000, 1000, 1000, 2.0) - 1.0) < 1e-9\nassert abs(bandwidth_gbs(1e9, 1.0) - 1000) < 1e-9` },
          { name: "roofline", code: `assert abs(pct_of_roofline(30, 50, 1, 100) - 0.6) < 1e-12 and abs(pct_of_roofline(5, 50, 1, 10) - 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>quantile(xs, p)</C> by linear interpolation between sorted values at position p(n - 1); <C>summarize(times, warmup)</C>,
          the median and interquartile range after dropping the first warmup runs; and <C>clearly_faster(a, b)</C>, true when the third
          quartile of a is below the first quartile of b.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def quantile(xs, p):
    return xs[0]

def summarize(times, warmup):
    return 0.0, 0.0

def clearly_faster(a, b):
    return True
`,
        solution: STATS,
        tests: [
          { name: "quantile", code: `assert quantile([4, 1, 3, 2], 0) == 1 and quantile([4, 1, 3, 2], 1) == 4\nassert abs(quantile([4, 1, 3, 2], 0.5) - 2.5) < 1e-12 and quantile([7], 0.3) == 7` },
          { name: "compare", code: `assert summarize([100, 5, 5, 5, 5], 1) == (5.0, 0.0)\nassert not clearly_faster([1, 5], [2, 6]) and clearly_faster([1, 1], [2, 2])` },
        ],
      },
    },
    {
      key: "pct",
      rung: "stretch",
      prompt: (
        <p>
          A 4096 by 4096 by 4096 matrix multiplication in 16-bit precision takes 1.6 ms on a GPU with a 16-bit peak of 400 TFLOP/s and 3
          TB/s of memory bandwidth. Taking the minimum traffic (each input read once, the output written once, 2 bytes per element), what
          fraction of its roofline bound does it achieve? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.215, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Writing kernels in CUDA means managing threads, shared memory and synchronisation by hand. Triton, the subject of the next
        chapter, lets you write a kernel as operations on blocks of data and leaves much of that to the compiler.
      </p>
    </>
  ),
};
