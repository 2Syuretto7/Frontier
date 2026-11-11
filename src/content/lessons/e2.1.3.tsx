import { M } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BenchNoiseViz } from "@/components/viz/BenchNoiseViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.1.3",
  minutes: 55,
  links: {
    requires: ["e2.1.1"],
    revisits: ["e1.5.2"],
    parallels: ["m9.8.1"],
    foreshadows: ["e4.5.1", "e7.1.3", "e9.2.4"],
  },

  puzzle: (
    <>
      <p>A colleague reports that their new tokeniser is 30 per cent faster. Their evidence:</p>
      <Code>{`import time
t0 = time.time(); old = list(map(old_tokenise, docs)); t1 = time.time()
t2 = time.time(); new = map(new_tokenise, docs); t3 = time.time()
print(t1 - t0, t3 - t2)`}</Code>
      <p>The second number is far smaller than the first. How many separate problems can you find with this measurement?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        At least four. <C>map</C> is lazy, so the new tokeniser never ran at all. Each version was timed once, and a single run
        is at the mercy of whatever else the machine was doing. The old version ran first, paying for cold caches. And{" "}
        <C>time.time()</C> is a wall clock that can jump. Asymptotics tell you how cost grows; a benchmark tells you the
        constant, and it is an experiment like any other, needing repeats, controls and a clear view of the noise.
      </p>
      <p>
        Timing noise is lopsided: interruptions only ever add time. Below, version B really is 5 per cent faster than A. See
        how often a single run gets the answer wrong, and which summary statistics settle first.
      </p>
      <BenchNoiseViz />
    </>
  ),

  theory: (
    <>
      <Definition title="clocks">
        <p>
          <C>time.perf_counter()</C> is a monotonic, high-resolution clock for measuring intervals; use it for benchmarks.{" "}
          <C>time.time()</C> is the calendar clock, which can be adjusted while you measure. <C>time.process_time()</C> counts
          only CPU time used by this process, so it ignores time spent waiting for disk, network or other programs. Measure what
          the user will wait for, usually wall time with <C>perf_counter</C>.
        </p>
      </Definition>

      <Definition title="the anatomy of a measurement">
        <ul>
          <li><strong>Warm-up:</strong> discard the first run or two, which pay for imports, cold caches and memory allocation.</li>
          <li><strong>Isolation:</strong> keep set-up (building inputs, copying data) outside the timed region.</li>
          <li>
            <strong>Repetition:</strong> repeat the measurement and report a robust summary (median or minimum) with its spread
            (interquartile range), never one number.
          </li>
          <li>
            <strong>Granularity:</strong> if one call takes microseconds, time a loop of many calls and divide, so the clock&rsquo;s
            resolution and the timer&rsquo;s own overhead do not dominate.
          </li>
          <li><strong>Fairness:</strong> same inputs, same machine, and interleave the versions (A B A B …) so slow drift hits both.</li>
        </ul>
      </Definition>

      <Example title="timeit does most of this">
        <Code>{`import timeit
t = timeit.repeat("sorted(xs)", setup="import random; xs = random.sample(range(10**6), 10**5)",
                  repeat=7, number=10)
print(min(t) / 10)   # seconds per call, best of 7 batches of 10`}</Code>
        <p>
          <C>timeit</C> runs the setup outside the timing, turns off garbage collection during it, and repeats. The minimum is
          the right summary for deterministic, CPU-bound code: noise only adds time, so the fastest run is the closest to the
          true cost. For code whose behaviour varies from run to run (network calls, garbage collection, caches warming), the
          median describes what users will see, and the tail (95th or 99th percentile) describes their worst experiences.
        </p>
      </Example>

      <Remark title="make sure the work happens">
        <p>
          Lazy objects (<C>map</C>, <C>filter</C>, generators, <C>range</C>) do nothing until consumed: wrap them in{" "}
          <C>list</C> or <C>sum</C>. Results cached from a previous call (<C>functools.cache</C>, a warm disk cache) make the
          second run unrealistically fast. On a GPU, kernels launch asynchronously, so timing without a synchronisation measures
          only the launch; the same trap appears whenever work is handed to another thread or device.
        </p>
      </Remark>

      <Definition title="is the difference real?">
        <p>
          Two sets of timings overlap. To decide whether B is faster, estimate the ratio of medians and its uncertainty. The{" "}
          <strong>bootstrap</strong> does this without assumptions about the noise: resample each set of timings with
          replacement many times, compute the ratio for each resample, and take the 2.5th and 97.5th percentiles as a 95 per cent
          interval. If the interval excludes 1, the difference is unlikely to be noise.
        </p>
      </Definition>

      <Remark title="benchmark the scaling, profile the cause">
        <p>
          One input size tells you little. Time a sweep of sizes, plot on log-log axes, and the slope gives the exponent you
          predicted in the first lesson of this chapter; a kink shows where the data stops fitting in a cache. When something is
          slow, a profiler (<C>cProfile</C>, <C>py-spy</C>) tells you where the time goes, which is usually not where you guessed.
          Optimise only what the profile and the benchmark say matters: Amdahl&rsquo;s law says that speeding up a part taking a
          fraction p of the time by a factor s gives an overall speed-up of <M>{"1 / ((1 - p) + p/s)"}</M>.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "clock",
      rung: "check",
      prompt: <p>Which clock should you use to time a piece of Python code?</p>,
      answer: { kind: "choice", options: ["time.perf_counter()", "time.time()", "datetime.now()", "time.process_time(), always"], correct: [0] },
    },
    {
      key: "lazy",
      rung: "check",
      prompt: <p>Why does timing <C>r = map(f, xs)</C> measure almost nothing?</p>,
      answer: { kind: "choice", options: ["map is lazy: f runs only when r is consumed", "map runs f in parallel", "Python caches the result of f", "perf_counter cannot time built-in functions"], correct: [0] },
    },
    {
      key: "median",
      rung: "apply",
      prompt: <p>Five runs take 12.1, 11.8, 30.5, 11.9 and 12.0 ms. What is the median, in ms?</p>,
      answer: { kind: "numeric", value: 12.0 },
    },
    {
      key: "amdahl",
      rung: "apply",
      prompt: <p>Tokenising takes 40 per cent of a pipeline&rsquo;s time. You make it 4 times faster. What is the overall speed-up? Give two decimal places.</p>,
      answer: { kind: "numeric", value: 1.43, tolerance: 0.005 },
    },
    {
      key: "slope",
      rung: "apply",
      prompt: <p>A sweep times a function at n = 10⁴, 10⁵ and 10⁶ and gets 2 ms, 20 ms and 200 ms. On a log-log plot, what is the slope?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import statistics as st
runs = {"A": [10.2, 10.4, 10.1, 25.0, 10.3], "B": [9.9, 10.0, 9.8, 9.9, 30.1]}
out = []
for name, t in runs.items():
    out.append(f"{name} {round(st.mean(t), 2)} {st.median(t)} {min(t)}")
print(" | ".join(out))`}</Code>
          <p>What does this print? Does the mean agree with the median about which version is faster?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["A 13.2 10.3 10.1 | B 13.94 9.9 9.8", "A 13.2 10.2 10.1 | B 13.94 9.9 9.8", "A 10.25 10.3 10.1 | B 9.9 9.9 9.8", "A 13.2 10.3 10.1 | B 13.94 10.0 9.8"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`calls = 0

def f(x):
    global calls
    calls += 1
    return x * x

r = map(f, range(10**6))
before = calls
total = sum(r)
print(before, calls, type(r).__name__)`}</Code>
          <p>When does the work happen? What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0 1000000 map", "1000000 1000000 map", "0 1000000 list", "1000000 2000000 map"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>bench(f, make_args, repeat=5, number=1, warmup=1, clock=time.perf_counter)</C>. Before every single call,
            call <C>make_args()</C> outside the timed region to get a fresh tuple of arguments (so in-place functions such as{" "}
            <C>list.sort</C> always see unsorted data). First make <C>warmup</C> calls that are not recorded. Then, for each of{" "}
            <C>repeat</C> rounds, time <C>number</C> calls, adding up only the time inside <C>f</C>, and record the average per
            call. Return a dict with keys <C>"times"</C> (the per-round averages, in order), <C>"min"</C>, <C>"median"</C> and{" "}
            <C>"iqr"</C> (the difference of the 75th and 25th percentiles from <C>statistics.quantiles(times, n=4)</C>).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import time

def bench(f, make_args, repeat=5, number=1, warmup=1, clock=time.perf_counter):
    t0 = clock()
    for _ in range(repeat * number):
        f(*make_args())
    t = (clock() - t0) / (repeat * number)
    return {"times": [t] * repeat, "min": t, "median": t, "iqr": 0.0}
`,
        solution: `import time
import statistics

def bench(f, make_args, repeat=5, number=1, warmup=1, clock=time.perf_counter):
    for _ in range(warmup):
        f(*make_args())
    times = []
    for _ in range(repeat):
        total = 0.0
        for _ in range(number):
            args = make_args()
            t0 = clock()
            f(*args)
            total += clock() - t0
        times.append(total / number)
    q = statistics.quantiles(times, n=4)
    return {"times": times, "min": min(times), "median": statistics.median(times), "iqr": q[2] - q[0]}
`,
        tests: [
          { name: "setup excluded", code: `class Clock:
    t = 0.0
    def __call__(self):
        return self.t
clk = Clock()
costs = iter([50, 5, 7, 6, 100, 5])
def make():
    clk.t += 1000
    return ([3, 1, 2],)
def f(xs):
    clk.t += next(costs)
r = bench(f, make, repeat=5, number=1, warmup=1, clock=clk)
assert r["times"] == [5, 7, 6, 100, 5], 'Exclude set-up and warm-up from the timings.'
assert r["min"] == 5 and r["median"] == 6` },
          { name: "per call", code: `class Clock:
    t = 0.0
    def __call__(self):
        return self.t
clk = Clock()
costs = iter([9, 9, 2, 4, 3, 3, 10, 20])
def f():
    clk.t += next(costs)
r = bench(f, lambda: (), repeat=3, number=2, warmup=2, clock=clk)
assert r["times"] == [3, 3, 15], 'Each round reports the average time per call.'
import statistics
q = statistics.quantiles([3, 3, 15], n=4)
assert abs(r["iqr"] - (q[2] - q[0])) < 1e-12` },
          { name: "fresh arguments", code: `import random
seen = []
def check(xs):
    seen.append(xs == sorted(xs))
    xs.sort()
r = bench(check, lambda: (random.sample(range(1000), 1000),), repeat=4, number=3, warmup=1)
assert len(seen) == 13 and not any(seen), 'Every call gets fresh, unsorted data.'
assert all(t > 0 for t in r["times"])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>compare(a, b, n_boot=2000, seed=0)</C> for two lists of timings. Return{" "}
            <C>(ratio, lo, hi, verdict)</C>, where ratio is median(b) / median(a), and lo and hi bound a 95 per cent bootstrap
            interval for it: with <C>random.Random(seed)</C>, draw <C>n_boot</C> resamples of each list (same length, with
            replacement), compute the ratio of medians for each, sort them, and take the values at indices{" "}
            <C>int(0.025 * n_boot)</C> and <C>int(0.975 * n_boot) - 1</C>. The verdict is <C>"B faster"</C> if hi &lt; 1,{" "}
            <C>"A faster"</C> if lo &gt; 1, and <C>"no clear difference"</C> otherwise.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import statistics

def compare(a, b, n_boot=2000, seed=0):
    ratio = statistics.mean(b) / statistics.mean(a)
    return (ratio, ratio, ratio, "B faster" if ratio < 1 else "A faster")
`,
        solution: `import random
import statistics

def compare(a, b, n_boot=2000, seed=0):
    rng = random.Random(seed)
    ratio = statistics.median(b) / statistics.median(a)
    boots = []
    for _ in range(n_boot):
        ra = [rng.choice(a) for _ in a]
        rb = [rng.choice(b) for _ in b]
        boots.append(statistics.median(rb) / statistics.median(ra))
    boots.sort()
    lo, hi = boots[int(0.025 * n_boot)], boots[int(0.975 * n_boot) - 1]
    if hi < 1:
        verdict = "B faster"
    elif lo > 1:
        verdict = "A faster"
    else:
        verdict = "no clear difference"
    return (ratio, lo, hi, verdict)
`,
        tests: [
          { name: "medians", code: `a = [10.2, 10.4, 10.1, 25.0, 10.3]
b = [9.9, 10.0, 9.8, 9.9, 30.1]
ratio, lo, hi, v = compare(a, b, 500, 1)
assert abs(ratio - 9.9 / 10.3) < 1e-12, 'Use the ratio of medians, not of means.'
assert lo <= ratio <= hi` },
          { name: "verdicts", code: `import random
rng = random.Random(3)
def timings(base, n):
    return [base * (1 + 0.02 * rng.random()) + (base * rng.random() if rng.random() < 0.1 else 0) for _ in range(n)]
A, B = timings(10, 40), timings(9, 40)
assert compare(A, B, 2000, 0)[3] == "B faster", 'A clear 10 per cent improvement.'
assert compare(B, A, 2000, 0)[3] == "A faster"
C, D = timings(10, 40), timings(10, 40)
assert compare(C, D, 2000, 0)[3] == "no clear difference", 'Same true cost.'` },
          { name: "deterministic", code: `a = [1.0, 1.1, 0.9, 1.2, 1.0, 1.05]
b = [0.95, 1.0, 1.1, 0.9, 1.0, 0.97]
assert compare(a, b, 1000, 5) == compare(a, b, 1000, 5), 'The same seed gives the same interval.'
r, lo, hi, v = compare(a, b, 1000, 5)
assert lo < hi and v == "no clear difference"` },
        ],
      },
    },
    {
      key: "minimum",
      rung: "prove",
      prompt: (
        <p>
          Suppose each measured time is <M>{"T = c + E"}</M>, where c is the true cost and the noise E ≥ 0 has a positive
          probability of being below any ε &gt; 0. Argue that the minimum of n independent measurements converges to c as n
          grows, and that the mean does not unless E has mean 0. When is the minimum the wrong statistic to report?
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "The minimum is always at least c, since E ≥ 0.",
          "P(min > c + ε) = P(E > ε)ⁿ, which tends to 0 because P(E > ε) < 1, so the minimum converges to c.",
          "The mean converges to c + E[E] by the law of large numbers, which exceeds c whenever the noise has positive mean.",
          "The minimum is wrong when variation is part of the behaviour users experience (caching, garbage collection, network), where the median or tail percentiles matter.",
        ],
      },
    },
    {
      key: "design",
      rung: "stretch",
      prompt: (
        <p>
          Design a benchmark to decide whether a new tokeniser is faster than the old one on your training corpus. Say what you
          time, on what data, how you control for warm-up, caching and machine noise, how many runs you take, what you report,
          and how you decide.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses a representative sample of real documents, the same for both, loaded before timing, and forces full evaluation of the output.",
          "Warms up, interleaves the two versions and repeats each many times, on an otherwise idle machine.",
          "Checks that both produce the same tokens, so the comparison is of equal work.",
          "Reports a robust summary with spread or a bootstrap interval for the ratio, and decides only if the interval excludes 1.",
          "Sweeps document sizes or batch sizes to see whether the difference holds at scale.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend the four mistakes in timing a lazy map once with time.time(), and how you would decide whether one version of a function is really faster than another.",

  glimpse: (
    <p>
      Software engineering for ML research returns to profiling CPU and memory, and the accelerator courses benchmark GPU kernels,
      where asynchronous launches, clock boosting and caches make honest measurement harder still. In every later lesson of this
      course, claims about speed are checked with a sweep of sizes on a log-log plot.
    </p>
  ),
};
