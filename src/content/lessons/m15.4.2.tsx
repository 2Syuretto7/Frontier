import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DyadicChainViz } from "@/components/viz/DyadicChainViz";
import type { LessonContent } from "@/lib/types";

const CHAIN = `import math

def max_bound(sigma, N):
    return sigma * math.sqrt(2 * math.log(N))

def bm_cover(eps):
    return math.ceil(1 / (2 * eps * eps))

def dudley_sum(D, covers):
    return sum(6 * 2 ** -k * D * math.sqrt(math.log(N)) for k, N in enumerate(covers, start=1))`;

const BM = `import math

def brownian_path(n, rng):
    path, x = [0.0], 0.0
    for _ in range(n):
        x += rng.gauss(0, 1) / math.sqrt(n)
        path.append(x)
    return path

def running_max(path):
    out, best = [], -math.inf
    for x in path:
        best = max(best, x)
        out.append(best)
    return out

def mean_max(n, trials, rng):
    return sum(max(brownian_path(n, rng)) for _ in range(trials)) / trials`;

export const lesson: LessonContent = {
  id: "m15.4.2",
  minutes: 60,
  links: {
    requires: ["m15.4.1", "m13.5.2"],
    revisits: ["m15.1.3"],
    foreshadows: ["m15.4.3"],
  },

  puzzle: (
    <>
      <p>
        Observe a Brownian motion on [0, 1] at N equally spaced times and take the largest value. Each observation is
        Gaussian with variance at most 1, so the union bound says the expected maximum is at most{" "}
        <M>{"\\sqrt{2\\log N}"}</M>, which grows without limit as the grid gets finer. Yet the maximum over a finer grid can
        only exceed the maximum over a coarser one by a little, since the path is continuous. Its expectation is in fact
        always below 0.8. What is the union bound wasting?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The union bound treats the N values as unrelated, but neighbouring values are almost equal. Chaining reaches each
        point in stages: first a coarse approximation, then a correction to a finer grid, then a smaller correction to a
        finer one still. At fine levels there are many corrections, but each is tiny; at coarse levels the corrections are
        large, but there are few. A union bound at each level separately, summed over levels, converges.
      </p>
      <DyadicChainViz />
    </>
  ),

  theory: (
    <>
      <Definition title="sub-Gaussian process">
        <p>
          A family of mean-zero random variables <M>{"(X_t)_{t \\in T}"}</M> on a metric space (T, d) has{" "}
          <em>sub-Gaussian increments</em> if each <M>{"X_t - X_s"}</M> is sub-Gaussian with variance proxy{" "}
          <M>{"d(s, t)^2"}</M>. A Gaussian process with <M>{"d(s, t) = \\sqrt{\\mathbb{E}(X_t - X_s)^2}"}</M> is the main example;
          for Brownian motion, <M>{"d(s, t) = \\sqrt{|s - t|}"}</M>.
        </p>
      </Definition>

      <Theorem title="maximum of finitely many">
        <p>
          If <M>{"X_1, \\dots, X_N"}</M> are each sub-Gaussian with variance proxy <M>{"\\sigma^2"}</M>, independent or not, then{" "}
          <M>{"\\mathbb{E}\\max_i X_i \\le \\sigma\\sqrt{2\\log N}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For λ &gt; 0, by Jensen&apos;s inequality and then bounding a maximum by a sum,{" "}
          <M>{"e^{\\lambda\\mathbb{E}\\max X_i} \\le \\mathbb{E}e^{\\lambda\\max X_i} \\le \\sum_i\\mathbb{E}e^{\\lambda X_i} \\le Ne^{\\lambda^2\\sigma^2/2}"}</M>.
          So <M>{"\\mathbb{E}\\max X_i \\le \\log N/\\lambda + \\lambda\\sigma^2/2"}</M>, and{" "}
          <M>{"\\lambda = \\sqrt{2\\log N}/\\sigma"}</M> gives the bound. This is <C>max_bound</C>.
        </p>
        <Code>{CHAIN}</Code>
      </Proof>

      <Theorem title="Dudley’s chaining bound">
        <p>
          Let <M>{"(X_t)"}</M> have sub-Gaussian increments on a finite metric space T of diameter D. Then
        </p>
        <MD>{"\\mathbb{E}\\sup_{t \\in T}X_t \\le \\sum_{k \\ge 1}6 \\cdot 2^{-k}D\\sqrt{\\log\\mathcal{N}(T, 2^{-k}D)}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Fix <M>{"t_0 \\in T"}</M>, let <M>{"T_0 = \\{t_0\\}"}</M> and, for k ≥ 1, let <M>{"T_k"}</M> be a smallest{" "}
          <M>{"2^{-k}D"}</M>-net of T; let <M>{"\\pi_k(t)"}</M> be a point of <M>{"T_k"}</M> nearest to t, so{" "}
          <M>{"d(t, \\pi_k(t)) \\le 2^{-k}D"}</M>. Since T is finite, <M>{"\\pi_k(t) = t"}</M> once <M>{"2^{-k}D"}</M> is below the
          smallest distance in T, and <M>{"X_t - X_{t_0} = \\sum_{k \\ge 1}(X_{\\pi_k(t)} - X_{\\pi_{k-1}(t)})"}</M>, a finite sum.
          Each link has <M>{"d(\\pi_k(t), \\pi_{k-1}(t)) \\le 2^{-k}D + 2^{-k+1}D = 3 \\cdot 2^{-k}D"}</M>, and as t varies the k-th
          link takes at most <M>{"|T_k||T_{k-1}| \\le |T_k|^2"}</M> distinct values. Taking the supremum term by term and applying
          the previous theorem at each level,{" "}
          <M>{"\\mathbb{E}\\sup_t(X_t - X_{t_0}) \\le \\sum_k 3 \\cdot 2^{-k}D\\sqrt{2\\log|T_k|^2}"}</M>, which is the bound, and{" "}
          <M>{"\\mathbb{E}X_{t_0} = 0"}</M>.
        </p>
      </Proof>

      <Remark title="the entropy integral">
        <p>
          Since the covering number decreases in its scale, the sum is at most a constant times{" "}
          <M>{"\\int_0^{D}\\sqrt{\\log\\mathcal{N}(T, \\varepsilon)}\\,d\\varepsilon"}</M>, the form in which Dudley&apos;s bound is
          usually quoted. The bound depends on the size of T only through its covering numbers at every scale, and for an
          infinite T it continues to hold when the integral is finite, which is how one proves that sample paths are
          continuous. <C>dudley_sum</C> evaluates the sum from a list of covering numbers.
        </p>
      </Remark>

      <Example title="Brownian motion">
        <p>
          For Brownian motion on any finite set of times in [0, 1], d is <M>{"\\sqrt{|s - t|}"}</M> and D ≤ 1. A ball of radius ε is
          an interval of length <M>{"2\\varepsilon^2"}</M>, so{" "}
          <M>{"\\mathcal{N}([0, 1], \\varepsilon) \\le \\lceil 1/(2\\varepsilon^2)\\rceil"}</M> (<C>bm_cover</C>), whose logarithm grows
          only like <M>{"\\log(1/\\varepsilon)"}</M>. The chaining sum converges to about 7.9 whatever the grid. The true value of{" "}
          <M>{"\\mathbb{E}\\sup B_t"}</M> is <M>{"\\sqrt{2/\\pi} \\approx 0.80"}</M>, as the simulation confirms: chaining loses a
          constant factor, but the union bound over N points loses a factor that grows with N.
        </p>
        <Code>{BM}</Code>
      </Example>

      <Remark title="sharper chaining">
        <p>
          The constant can be improved, but the shape of Dudley&apos;s bound cannot always: for some sets it is off by a factor
          like <M>{"\\sqrt{\\log\\log}"}</M> of the size, because one net per scale is not adapted to sets that are large in some
          regions and small in others. Talagrand&apos;s generic chaining chooses the nets adaptively, and his majorising
          measure theorem says that for Gaussian processes the resulting quantity matches <M>{"\\mathbb{E}\\sup X_t"}</M> up to
          universal constants. The same chaining with Bernstein-type increments gives the bound promised in m15.1.3: the
          expected Kolmogorov-Smirnov statistic is at most a constant over √n.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "max",
      rung: "check",
      prompt: <p>Bound the expected maximum of 1000 standard Gaussians, dependent or not. Give four decimals.</p>,
      answer: { kind: "numeric", value: 3.7169, tolerance: 0.00006 },
    },
    {
      key: "cover",
      rung: "check",
      prompt: <p>How many balls of radius 0.1 in the metric <M>{"\\sqrt{|s - t|}"}</M> suffice to cover [0, 1], by the bound in the lesson?</p>,
      answer: { kind: "numeric", value: 50, tolerance: 0.5 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does the chaining bound for Brownian motion stay finite however fine the grid, when the plain union bound does not?</p>,
      answer: {
        kind: "choice",
        options: [
          "At level k there are about 4^k links but each has size about 2^-k, and 2^-k times √(log 4^k) is summable",
          "The values at different times are independent",
          "Brownian motion is bounded by 1",
          "The union bound is applied only once, at the coarsest level",
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

def max_bound(sigma, N):
    return sigma * math.sqrt(2 * math.log(N))

def bm_cover(eps):
    return math.ceil(1 / (2 * eps * eps))

def dudley_sum(D, covers):
    return sum(6 * 2 ** -k * D * math.sqrt(math.log(N)) for k, N in enumerate(covers, start=1))

print(round(max_bound(2, math.e ** 2), 4), max_bound(1, 1), bm_cover(0.5), bm_cover(0.05))
print(round(dudley_sum(1, [bm_cover(2 ** -k) for k in range(1, 4)]), 4), dudley_sum(2, [1, 1, 1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4.0 0.0 2 200\n6.0569 0.0",
          "4.0 0.0 2 200\n6.0569 12.0",
          "2.0 0.0 2 200\n6.0569 0.0",
          "4.0 0.0 1 200\n6.0569 0.0",
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

def brownian_path(n, rng):
    path, x = [0.0], 0.0
    for _ in range(n):
        x += rng.gauss(0, 1) / math.sqrt(n)
        path.append(x)
    return path

def running_max(path):
    out, best = [], -math.inf
    for x in path:
        best = max(best, x)
        out.append(best)
    return out

def mean_max(n, trials, rng):
    return sum(max(brownian_path(n, rng)) for _ in range(trials)) / trials

print(running_max([0, 2, -1, 3, 1]), len(brownian_path(10, __import__('random').Random(0))))
import random; print(round(mean_max(1000, 400, random.Random(1)), 1), round(math.sqrt(2 / math.pi), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0, 2, 2, 3, 3] 11\n0.8 0.7979",
          "[0, 2, 2, 3, 3] 10\n0.8 0.7979",
          "[0, 2, -1, 3, 1] 11\n0.8 0.7979",
          "[0, 2, 2, 3, 3] 11\n0.0 0.7979",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>max_bound(sigma, N)</C>; <C>bm_cover(eps)</C>, the covering number <M>{"\\lceil 1/(2\\varepsilon^2)\\rceil"}</M>;
          and <C>dudley_sum(D, covers)</C>, where <C>covers[k - 1]</C> is the covering number at scale <M>{"2^{-k}D"}</M> for
          k = 1, 2, ….
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def max_bound(sigma, N):
    return 0.0

def bm_cover(eps):
    return 0

def dudley_sum(D, covers):
    return 0.0
`,
        solution: CHAIN,
        tests: [
          { name: "max", code: `import math
assert abs(max_bound(2, math.e ** 2) - 4) < 1e-12 and max_bound(1, 1) == 0 and abs(max_bound(1, 1000) - math.sqrt(2 * math.log(1000))) < 1e-15
assert bm_cover(0.5) == 2 and bm_cover(0.1) == 50 and bm_cover(0.05) == 200 and bm_cover(1) == 1 and bm_cover(0.3) == 6` },
          { name: "dudley", code: `import math
assert dudley_sum(2, [1, 1, 1]) == 0 and abs(dudley_sum(1, [math.e]) - 3) < 1e-12 and abs(dudley_sum(4, [math.e, math.e ** 4]) - (12 + 12)) < 1e-12
assert abs(dudley_sum(1, [bm_cover(2 ** -k) for k in range(1, 21)]) - 7.911245301750911) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>brownian_path(n, rng)</C>, the n + 1 values at times 0, 1/n, …, 1 starting from 0, adding{" "}
          <C>rng.gauss(0, 1) / math.sqrt(n)</C> at each step; <C>running_max(path)</C>; and{" "}
          <C>mean_max(n, trials, rng)</C>, the average over trials of the path maximum.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def brownian_path(n, rng):
    return []

def running_max(path):
    return []

def mean_max(n, trials, rng):
    return 0.0
`,
        solution: BM,
        tests: [
          { name: "path", code: `import math, random
p = brownian_path(4, random.Random(6)); r = random.Random(6); x, q = 0.0, [0.0]
for _ in range(4):
    x += r.gauss(0, 1) / 2; q.append(x)
assert p == q and brownian_path(0, r) == [0.0]
assert running_max([0, 2, -1, 3, 1]) == [0, 2, 2, 3, 3] and running_max([]) == [] and running_max([-2, -3]) == [-2, -2]` },
          { name: "mean", code: `import math, random
m = mean_max(500, 400, random.Random(2)); assert 0.68 < m < math.sqrt(2 / math.pi)
assert mean_max(1, 1, random.Random(0)) >= 0` },
        ],
      },
    },
    {
      key: "dud",
      rung: "stretch",
      prompt: (
        <p>
          Evaluate Dudley&apos;s chaining sum for Brownian motion on [0, 1], with D = 1, the covering bound of the lesson, and
          levels k = 1 to 20. Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 7.9112, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        For a Gaussian process indexed by a set of vectors, <M>{"X_t = \\langle g, t\\rangle"}</M>, the expected supremum is a
        geometric quantity of the set alone: its Gaussian width. The next lesson shows that this width governs random
        projections of infinite sets and the number of measurements needed to recover structured signals.
      </p>
    </>
  ),
};
