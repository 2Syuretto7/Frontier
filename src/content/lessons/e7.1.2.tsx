import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ParallelSpeedupViz } from "@/components/viz/ParallelSpeedupViz";
import type { LessonContent } from "@/lib/types";

const LAWS = `def amdahl(p, n):
    return 1 / ((1 - p) + p / n)

def gustafson(serial_frac, n):
    return serial_frac + (1 - serial_frac) * n

def karp_flatt(speedup, n):
    return (1 / speedup - 1 / n) / (1 - 1 / n)`;

const OVERHEAD = `def parallel_time(p, n, c):
    return (1 - p) + p / n + c * (n - 1)

def best_workers(p, c, n_max):
    return min(range(1, n_max + 1), key=lambda n: parallel_time(p, n, c))

def efficiency(speedup, n):
    return speedup / n`;

export const lesson: LessonContent = {
  id: "e7.1.2",
  minutes: 40,
  links: {
    requires: ["e7.1.1", "e4.5.1"],
    revisits: ["e3.5.1"],
    foreshadows: ["e7.3.4", "e7.4.4"],
  },

  puzzle: (
    <>
      <p>
        A data-processing job is 99% parallel. On 10 cores it runs nearly 10 times faster, on 100 cores about 50 times, and
        on 1000 cores barely faster than on 100; with the cost of coordinating the cores it may even slow down. Yet
        supercomputers with millions of cores are kept busy. How can the same arithmetic make parallelism look both hopeless
        and wildly successful?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        You met Amdahl&apos;s law for speeding up one part of a program. Applied to N workers, it says the serial part, however
        small, sets a ceiling: with 1% serial work no number of workers gives more than a hundredfold speed-up. Coordination
        costs that grow with N make things worse, so there is a best number of workers. Gustafson pointed out that people
        with bigger machines usually solve bigger problems in the same time, and then the serial part shrinks in relative
        terms and the speed-up keeps growing.
      </p>
      <ParallelSpeedupViz />
    </>
  ),

  theory: (
    <>
      <Definition title="speed-up and efficiency">
        <p>
          If a program takes time <M>{"T_1"}</M> on one worker and <M>{"T_N"}</M> on N, its speed-up is{" "}
          <M>{"S(N) = T_1/T_N"}</M> and its efficiency <M>{"S(N)/N"}</M>. A fraction p of <M>{"T_1"}</M> can be divided among
          workers; the rest is serial.
        </p>
        <Code>{LAWS}</Code>
      </Definition>

      <Theorem title="Amdahl for N workers">
        <p>
          With perfect division of the parallel part, <M>{"S(N) = 1/((1 - p) + p/N)"}</M>, which increases towards{" "}
          <M>{"1/(1 - p)"}</M> and reaches half of that limit at <M>{"N = p/(1 - p)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Normalise <M>{"T_1 = 1"}</M>; then <M>{"T_N = (1 - p) + p/N"}</M>, which decreases to 1 − p. Half the limit means{" "}
          <M>{"T_N = 2(1 - p)"}</M>, so <M>{"p/N = 1 - p"}</M>. For p = 0.99, 99 workers already give half the possible speed-up,
          and the next 900 add less than the first 99 did.
        </p>
      </Proof>

      <Theorem title="Gustafson’s scaled speed-up">
        <p>
          Suppose a run on N workers spends a fraction s of its time in serial work and the rest in parallel work that one
          worker would need N times as long to do. Then the scaled speed-up is <M>{"s + (1 - s)N"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Normalise the N-worker time to 1. One worker would need s for the serial part and <M>{"(1 - s)N"}</M> for the
          parallel part. The two laws do not contradict each other: Amdahl fixes the problem and asks how fast it can go;
          Gustafson fixes the time and asks how large a problem fits, which is how simulations and model training usually
          scale.
        </p>
      </Proof>

      <Theorem title="the Karp-Flatt serial fraction">
        <p>
          If a measured speed-up S on N workers is explained by Amdahl&apos;s law, the serial fraction is{" "}
          <M>{"e = (1/S - 1/N)/(1 - 1/N)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Solve <M>{"1/S = e + (1 - e)/N"}</M> for e. Computed from experiments at several N, e should be constant if the
          serial fraction is the only limit. If it grows with N, some overhead grows with the number of workers, such as
          communication or contention for a shared lock.
        </p>
      </Proof>

      <Theorem title="the best number of workers">
        <p>
          If coordination adds <M>{"c(N - 1)"}</M> to the run time, <M>{"T_N = (1 - p) + p/N + c(N - 1)"}</M> is smallest near{" "}
          <M>{"N^* = \\sqrt{p/c}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Treat N as continuous: <M>{"dT/dN = -p/N^2 + c"}</M> vanishes at <M>{"N^2 = p/c"}</M>, and <M>{"T"}</M> is convex for
          N &gt; 0, so this is the minimum; the best whole number is one of its two neighbours. Beyond <M>{"N^*"}</M>, adding
          workers makes the job slower.
        </p>
        <Code>{OVERHEAD}</Code>
      </Proof>

      <Remark title="the serial parts of real systems">
        <p>
          In a training step the serial parts include launching kernels from one CPU thread, the slowest worker in a
          synchronised step, and gradient communication that does not overlap with computation. The GPU itself is the
          extreme case of this lesson: thousands of lanes that pay off only when almost everything is parallel, as later
          lessons on occupancy and utilisation show.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "amdahl",
      rung: "check",
      prompt: <p>A program is 95% parallel. What speed-up do 8 workers give by Amdahl&apos;s law? Give four decimals.</p>,
      answer: { kind: "numeric", value: 5.9259, tolerance: 0.00006 },
    },
    {
      key: "half",
      rung: "check",
      prompt: <p>For p = 0.999, how many workers give half of the limiting speed-up?</p>,
      answer: { kind: "numeric", value: 999, tolerance: 1e-6 },
    },
    {
      key: "kf",
      rung: "apply",
      prompt: <p>The Karp-Flatt serial fraction computed from experiments is 0.02 at 4 workers, 0.05 at 16 and 0.12 at 64. What does this suggest?</p>,
      answer: {
        kind: "choice",
        options: [
          "An overhead that grows with the number of workers, such as communication, limits scaling, not a fixed serial part",
          "The program has a fixed serial fraction of about 0.06",
          "The measurements must be wrong, since the fraction is constant by definition",
          "The program shows superlinear speed-up",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def amdahl(p, n):
    return 1 / ((1 - p) + p / n)

def gustafson(serial_frac, n):
    return serial_frac + (1 - serial_frac) * n

def karp_flatt(speedup, n):
    return (1 / speedup - 1 / n) / (1 - 1 / n)

print(round(amdahl(0.95, 8), 4), round(amdahl(0.95, 10 ** 6), 4), round(gustafson(0.05, 8), 4))
print(round(karp_flatt(amdahl(0.9, 16), 16), 6), round(karp_flatt(4.0, 8), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "5.9259 19.9996 7.65\n0.1 0.1429",
          "5.9259 20.0 7.65\n0.1 0.1429",
          "5.9259 19.9996 7.6\n0.1 0.125",
          "7.6 19.9996 5.9259\n0.1 0.1429",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def parallel_time(p, n, c):
    return (1 - p) + p / n + c * (n - 1)

def best_workers(p, c, n_max):
    return min(range(1, n_max + 1), key=lambda n: parallel_time(p, n, c))

def efficiency(speedup, n):
    return speedup / n

print(round(parallel_time(0.99, 10, 0.001), 4), best_workers(0.99, 0.001, 100), round(efficiency(6.0, 8), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.118 31 0.75", "0.109 31 0.75", "0.118 100 0.75", "0.118 32 0.75"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>amdahl(p, n)</C>, <C>gustafson(serial_frac, n)</C> and <C>karp_flatt(speedup, n)</C> as in the theorems.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def amdahl(p, n):
    return n

def gustafson(serial_frac, n):
    return n

def karp_flatt(speedup, n):
    return 0.0
`,
        solution: LAWS,
        tests: [
          { name: "laws", code: `assert abs(amdahl(0.95, 8) - 1 / (0.05 + 0.95 / 8)) < 1e-12 and amdahl(0.5, 1) == 1 and abs(amdahl(0.0, 100) - 1) < 1e-12
assert abs(gustafson(0.05, 8) - 7.65) < 1e-12 and gustafson(1.0, 50) == 1 and gustafson(0.0, 50) == 50` },
          { name: "karp-flatt", code: `for p in [0.5, 0.9, 0.999]:
    for n in [2, 16, 1000]:
        assert abs(karp_flatt(amdahl(p, n), n) - (1 - p)) < 1e-9
assert abs(karp_flatt(4.0, 8) - 1 / 7) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>parallel_time(p, n, c)</C>, the overhead model with <C>T_1 = 1</C>; <C>best_workers(p, c, n_max)</C>, the
          whole number of workers from 1 to n_max with the smallest time, the smallest such number on ties; and{" "}
          <C>efficiency(speedup, n)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def parallel_time(p, n, c):
    return 1 / n

def best_workers(p, c, n_max):
    return n_max

def efficiency(speedup, n):
    return speedup
`,
        solution: OVERHEAD,
        tests: [
          { name: "time", code: `assert abs(parallel_time(0.99, 10, 0.001) - 0.118) < 1e-12 and parallel_time(0.7, 1, 5.0) == 1.0 and efficiency(6.0, 8) == 0.75` },
          { name: "best", code: `assert best_workers(0.99, 0.001, 100) == 31 and best_workers(0.99, 0.001, 10) == 10 and best_workers(0.5, 1.0, 50) == 1
for p, c in [(0.9, 1e-4), (0.99, 1e-5)]:
    n = best_workers(p, c, 10000); assert abs(n - (p / c) ** 0.5) <= 1` },
        ],
      },
    },
    {
      key: "nstar",
      rung: "stretch",
      prompt: <p>With p = 0.99 and overhead c = 10⁻⁴ per extra worker, where is the continuous optimum √(p/c)? Give two decimals.</p>,
      answer: { kind: "numeric", value: 99.5, tolerance: 0.006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every number in this lesson came from a measurement, and measuring time well is harder than it looks. Next:
        benchmarking.
      </p>
    </>
  ),
};
