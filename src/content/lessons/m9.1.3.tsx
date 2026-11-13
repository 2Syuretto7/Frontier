import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OrderStatViz } from "@/components/viz/OrderStatViz";
import type { LessonContent } from "@/lib/types";

const RANKS = `def kth_smallest(xs, k):
    pivot = xs[len(xs) // 2]
    lo = [x for x in xs if x < pivot]
    eq = [x for x in xs if x == pivot]
    if k <= len(lo):
        return kth_smallest(lo, k)
    if k <= len(lo) + len(eq):
        return pivot
    return kth_smallest([x for x in xs if x > pivot], k - len(lo) - len(eq))

def sample_quantile(xs, p):
    s = sorted(xs)
    h = (len(s) - 1) * p
    i = int(h)
    return s[i] if i + 1 >= len(s) else s[i] + (h - i) * (s[i + 1] - s[i])`;

const EXTREMES = `import numpy as np

def max_cdf(F, n):
    return lambda x: F(x) ** n

def sim_order_means(n, reps, seed=0):
    U = np.sort(np.random.default_rng(seed).random((reps, n)), axis=1)
    return U.mean(axis=0)`;

export const lesson: LessonContent = {
  id: "m9.1.3",
  minutes: 55,
  links: {
    requires: ["m9.1.1", "m7.3.4"],
    revisits: ["m7.7.1", "m7.2.2"],
    foreshadows: ["m9.2.2", "m9.5.2"],
  },

  puzzle: (
    <>
      <p>
        During the Second World War, Allied statisticians estimated German tank production from the serial numbers on
        captured tanks. If five captured tanks have serial numbers whose largest is 60, how many tanks were made? The largest
        serial seen is an underestimate, since the true largest is unlikely to have been captured. How much should it be
        inflated? The answer comes from the distribution of the sample maximum.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Sort the sample: the smallest, the second smallest, up to the largest are the order statistics. Each is a random
        variable. For uniform data, n points cut [0, 1] into n + 1 pieces of the same average length, so the k-th smallest
        sits at k/(n + 1) on average, and the maximum falls short of the end by about 1/(n + 1).
      </p>
      <OrderStatViz />
    </>
  ),

  theory: (
    <>
      <Definition title="order statistics">
        <p>
          The order statistics of a sample are its values sorted, <M>{"X_{(1)} \\leq X_{(2)} \\leq \\dots \\leq X_{(n)}"}</M>. The
          minimum is <M>{"X_{(1)}"}</M>, the maximum <M>{"X_{(n)}"}</M>, and the sample median is the middle one (or the average
          of the two middle ones). A sample p-quantile interpolates between the order statistics at position (n − 1)p, as
          numpy does by default. The k-th smallest can be found without sorting, by quickselect, in expected linear time.
        </p>
        <Code>{RANKS}</Code>
      </Definition>

      <Theorem title="the maximum and the minimum">
        <p>For an iid sample with CDF F,</p>
        <MD>{"P(X_{(n)} \\leq x) = F(x)^n, \\qquad P(X_{(1)} \\leq x) = 1 - (1 - F(x))^n."}</MD>
      </Theorem>
      <Proof>
        <p>
          The maximum is at most x exactly when every <M>{"X_i \\leq x"}</M>, which by independence has probability{" "}
          <M>{"F(x)^n"}</M>. The minimum exceeds x exactly when every <M>{"X_i > x"}</M>, with probability{" "}
          <M>{"(1 - F(x))^n"}</M>.
        </p>
      </Proof>

      <Theorem title="the k-th order statistic">
        <p>If the <M>{"X_i"}</M> have density f, then <M>{"X_{(k)}"}</M> has density</p>
        <MD>{"f_{(k)}(x) = \\frac{n!}{(k-1)!\\,(n-k)!}\\, F(x)^{k-1}\\,(1 - F(x))^{n-k}\\, f(x)."}</MD>
        <p>For uniforms this is the Beta(k, n − k + 1) density, with mean k/(n + 1).</p>
      </Theorem>
      <Proof>
        <p>
          For <M>{"X_{(k)}"}</M> to lie in [x, x + dx], one observation must fall in that interval (n choices, probability f(x)dx),
          k − 1 of the others below x and n − k above, in <M>{"\\binom{n-1}{k-1}"}</M> ways with probability{" "}
          <M>{"F^{k-1}(1-F)^{n-k}"}</M>. Multiplying gives the density. For uniforms the integral{" "}
          <M>{"\\int_0^1 x \\cdot f_{(k)}(x)\\,dx"}</M> is a Beta integral equal to k/(n + 1).
        </p>
        <Code>{EXTREMES}</Code>
      </Proof>

      <Example title="the tank problem">
        <p>
          Serial numbers 1, …, N, with k captured at random. The maximum m falls short of N by about N/k on average, by the
          same gap argument, and the estimator <M>{"m(1 + 1/k) - 1"}</M> is exactly unbiased. With k = 5 and m = 60 it gives 71.
          Wartime estimates of this kind matched production records far better than intelligence reports did.
        </p>
      </Example>

      <Remark title="robustness">
        <p>
          The median is unaffected if a few observations are moved arbitrarily far: up to half the data can be corrupted
          before it can be dragged anywhere, while one wild value moves the mean without limit. That is why medians and
          trimmed means are reported for latencies and other heavy-tailed measurements, and why the maximum over many runs,
          an extreme order statistic, is a biased summary of a typical run.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "max",
      rung: "check",
      prompt: <p>What is the probability that the maximum of 10 independent uniforms on [0, 1] is at most 0.9? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.3487, tolerance: 0.0001 },
    },
    {
      key: "mean",
      rung: "check",
      prompt: <p>What is the expected value of the 3rd smallest of 9 independent uniforms on [0, 1]?</p>,
      answer: { kind: "numeric", value: 0.3, tolerance: 0.0001 },
    },
    {
      key: "min",
      rung: "apply",
      prompt: <p>What is the CDF of the minimum of n iid observations with CDF F?</p>,
      answer: { kind: "choice", options: ["1 − (1 − F(x))ⁿ", "F(x)ⁿ", "1 − F(x)ⁿ", "nF(x)"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def kth_smallest(xs, k):
    pivot = xs[len(xs) // 2]
    lo = [x for x in xs if x < pivot]
    eq = [x for x in xs if x == pivot]
    if k <= len(lo):
        return kth_smallest(lo, k)
    if k <= len(lo) + len(eq):
        return pivot
    return kth_smallest([x for x in xs if x > pivot], k - len(lo) - len(eq))

def sample_quantile(xs, p):
    s = sorted(xs)
    h = (len(s) - 1) * p
    i = int(h)
    return s[i] if i + 1 >= len(s) else s[i] + (h - i) * (s[i + 1] - s[i])

xs = [7, 1, 5, 3, 9, 2]
print([kth_smallest(xs, k) for k in (1, 3, 6)], sample_quantile(xs, 0.5), sample_quantile(xs, 0.25))
print(sample_quantile([4], 0.3), sample_quantile(xs, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1, 3, 9] 4.0 2.25\n4 9", "[1, 3, 9] 4 2\n4 9", "[1, 5, 9] 4.0 2.25\n4 9", "[1, 3, 9] 5.0 2.25\n4 9"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def max_cdf(F, n):
    return lambda x: F(x) ** n

def sim_order_means(n, reps, seed=0):
    U = np.sort(np.random.default_rng(seed).random((reps, n)), axis=1)
    return U.mean(axis=0)

print(round(max_cdf(lambda x: x, 10)(0.9), 4), round(1 - max_cdf(lambda x: x, 10)(0.5), 4))
print(np.round(sim_order_means(4, 200000), 2))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.3487 0.999\n[0.2 0.4 0.6 0.8]", "0.3487 0.5\n[0.2 0.4 0.6 0.8]", "0.9 0.999\n[0.25 0.5 0.75 1. ]", "0.3487 0.999\n[0.25 0.5 0.75 1. ]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kth_smallest(xs, k)</C> by quickselect (k = 1 is the minimum), partitioning around the middle element into
          smaller, equal and larger parts, and <C>sample_quantile(xs, p)</C>, interpolating linearly at position (n − 1)p in
          the sorted data.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def kth_smallest(xs, k):
    return sorted(xs)[0]

def sample_quantile(xs, p):
    return 0
`,
        solution: RANKS,
        tests: [
          { name: "select", code: `assert kth_smallest([5, 5, 1, 5], 2) == 5 and kth_smallest([3, 1, 2], 1) == 1 and kth_smallest([3, 1, 2], 3) == 3` },
          { name: "quantile", code: `assert sample_quantile([1, 2, 3, 4], 0.5) == 2.5 and sample_quantile([10, 0], 0.1) == 1.0 and sample_quantile([4], 0.3) == 4` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>max_cdf(F, n)</C>, returning the CDF of the maximum of n iid draws with CDF F, and{" "}
          <C>sim_order_means(n, reps, seed=0)</C>: draw a reps × n array of uniforms with numpy&apos;s default_rng(seed), sort
          each row, and return the column means.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def max_cdf(F, n):
    return F

def sim_order_means(n, reps, seed=0):
    return np.zeros(n)
`,
        solution: EXTREMES,
        tests: [
          { name: "cdf", code: `assert max_cdf(lambda x: x, 3)(0.5) == 0.125` },
          { name: "means", code: `m = sim_order_means(3, 100000)
assert abs(m[0] - 0.25) < 0.01 and abs(m[2] - 0.75) < 0.01` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that the maximum of n iid observations with CDF F has CDF F(x)ⁿ, and deduce the density of the maximum of n uniforms on [0, 1].</p>,
      answer: {
        kind: "written",
        rubric: [
          "Notes that the maximum is at most x if and only if every observation is at most x.",
          "Uses independence to write that probability as the product F(x)ⁿ.",
          "For uniforms, F(x) = x on [0, 1], so the CDF is xⁿ and the density is nxⁿ⁻¹ on [0, 1].",
        ],
      },
    },
    {
      key: "tank",
      rung: "stretch",
      prompt: <p>Five tanks are captured and the largest serial number is 60. What does the unbiased estimator m(1 + 1/k) − 1 give for the number of tanks?</p>,
      answer: { kind: "numeric", value: 71, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what order statistics are, how to get the distributions of the maximum and minimum from independence, why the k-th smallest of n uniforms has mean k/(n + 1), and how this solves the tank problem.",

  glimpse: (
    <>
      <p>
        That completes the study of statistics as random variables. The next chapter turns the question round: given a
        sample, how should a parameter be estimated? The oldest answer matches moments.
      </p>
    </>
  ),
};
