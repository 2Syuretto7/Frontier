import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PassAtKViz } from "@/components/viz/PassAtKViz";
import type { LessonContent } from "@/lib/types";

const ESTIMATE = `import math

def pass_at_k(n, c, k):
    if n - c < k:
        return 1.0
    prod = 1.0
    for i in range(n - c + 1, n + 1):
        prod *= 1 - k / i
    return 1 - prod

def naive_pass_at_k(n, c, k):
    return 1 - (1 - c / n) ** k

def benchmark_pass_at_k(counts, n, k):
    return sum(pass_at_k(n, c, k) for c in counts) / len(counts)`;

const RATES = `import math

def pass_hat_k(n, c, k):
    return math.comb(c, k) / math.comb(n, k)

def expected_pass_at_k(rates, k):
    return sum(1 - (1 - p) ** k for p in rates) / len(rates)

def homogeneous_pass_at_k(rates, k):
    p = sum(rates) / len(rates)
    return 1 - (1 - p) ** k`;

export const lesson: LessonContent = {
  id: "l10.3.1",
  minutes: 50,
  links: {
    requires: ["l10.2.4", "l9.7.1"],
    revisits: ["l9.7.4", "m9.2.4", "l10.2.1"],
    foreshadows: ["l10.3.2", "l10.4.1", "l13.1.5"],
  },

  puzzle: (
    <>
      <p>
        Brown and colleagues (2024) let a code model attempt each SWE-bench Lite issue many times. With one sample it solved 15.9% of
        the issues; with 250 samples, at least one attempt succeeded on 56%. Which number describes the model? Both do, for
        different uses: one for a user who gets a single answer, the other for a system that can check answers and keep a good one.
        Reporting sampled performance well means knowing exactly what each number estimates.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        pass@k is the chance that at least one of k samples is correct; it measures coverage, and it is what matters when a verifier
        can pick the winner. pass^k, all k correct, measures reliability, what matters when every answer is used. Both are averages
        over problems of a function of each problem&apos;s success rate, and how those rates are spread across problems shapes the curve
        far more than their average does.
      </p>
      <PassAtKViz />
    </>
  ),

  theory: (
    <>
      <Definition title="estimating pass@k">
        <p>
          For one problem with n samples of which c pass, the unbiased estimator (l9.7.1) is{" "}
          <M>{"1 - \\binom{n-c}{k}/\\binom{n}{k}"}</M>. The binomial coefficients overflow floating point for large n, so Chen et al.
          (2021) write the ratio as a product,
        </p>
        <MD>{"\\frac{\\binom{n-c}{k}}{\\binom{n}{k}} = \\prod_{i=n-c+1}^{n}\\left(1 - \\frac{k}{i}\\right),"}</MD>
        <p>
          (<C>pass_at_k</C>), and the benchmark score is the mean over problems (<C>benchmark_pass_at_k</C>). The tempting plug-in{" "}
          <M>{"1 - (1 - c/n)^k"}</M> (<C>naive_pass_at_k</C>) is biased low.
        </p>
        <Code>{ESTIMATE}</Code>
      </Definition>

      <Theorem title="the plug-in estimator underestimates">
        <p>
          For a problem with success rate p and <M>{"\\hat p = c/n"}</M>,{" "}
          <M>{"\\mathbb{E}[1 - (1-\\hat p)^k] \\le 1 - (1-p)^k"}</M>, with strict inequality when <M>{"0 < p < 1"}</M> and k ≥ 2.
        </p>
      </Theorem>
      <Proof>
        <p>
          The function <M>{"g(x) = 1 - (1-x)^k"}</M> has <M>{"g''(x) = -k(k-1)(1-x)^{k-2} \\le 0"}</M>, so it is concave on [0, 1]. Jensen&apos;s
          inequality gives <M>{"\\mathbb{E}[g(\\hat p)] \\le g(\\mathbb{E}[\\hat p]) = g(p)"}</M>, strictly when <M>{"\\hat p"}</M> is not
          constant and g is strictly concave, which holds for k ≥ 2. The product form avoids this because it counts, among all
          k-subsets of the n samples, the fraction containing a success, which has expectation exactly pass@k.
        </p>
      </Proof>

      <Theorem title="heterogeneity flattens the curve">
        <p>
          If problems have rates <M>{"p_j"}</M> with mean <M>{"\\bar p"}</M>, the benchmark pass@k{" "}
          <M>{"\\frac{1}{m}\\sum_j \\bigl(1 - (1-p_j)^k\\bigr)"}</M> (<C>expected_pass_at_k</C>) is at most{" "}
          <M>{"1 - (1-\\bar p)^k"}</M> (<C>homogeneous_pass_at_k</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          The same concave g, averaged over problems instead of over sampling noise. Problems with <M>{"p_j = 0"}</M> contribute zero for
          every k, so pass@k can never exceed the fraction of solvable problems. Two models with equal pass@1 can therefore have very
          different pass@100, and the gap reveals how their success is spread, not how good they are on average.
        </p>
      </Proof>

      <Definition title="pass^k, reliability">
        <p>
          The τ-bench agent benchmark (Yao et al., 2024) reports pass^k, the chance that all k independent trials of a task succeed. Its
          unbiased estimator from n trials with c successes is <M>{"\\binom{c}{k}/\\binom{n}{k}"}</M> (<C>pass_hat_k</C>), by the same
          counting of k-subsets. For a problem with rate p it equals <M>{"p^k"}</M>, so it punishes inconsistency hard: a 90% success rate
          gives pass^8 of only 0.43.
        </p>
        <Code>{RATES}</Code>
      </Definition>

      <Remark title="reporting sampled evaluations">
        <p>
          State n, k, the temperature and the estimator. Use n much larger than k so the estimate is stable, and compute error bars over
          problems, since per-problem estimates are the units being averaged (l10.2.1). pass@k at large k is meaningful only if a
          verifier exists that could actually select the right sample; without one, the relevant figure is accuracy after the selection
          rule you would deploy, such as majority voting (l9.7.4).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bias",
      rung: "check",
      prompt: (
        <p>
          A problem has 20 samples, 5 of them correct. By how much does the unbiased pass@5 estimate exceed the plug-in estimate{" "}
          <M>{"1 - (1 - c/n)^k"}</M>? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.044, tolerance: 0.001 },
    },
    {
      key: "hat",
      rung: "check",
      prompt: (
        <p>An agent succeeds in 8 of 10 trials on a task. What is the unbiased estimate of pass^3? Give three decimals.</p>
      ),
      answer: { kind: "numeric", value: 0.467, tolerance: 0.001 },
    },
    {
      key: "ceiling",
      rung: "apply",
      prompt: (
        <p>
          Model A and model B both have pass@1 of 30%. A&apos;s pass@100 is 95% and B&apos;s is 45%. What best explains the difference?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "B's successes are concentrated on fewer problems, with many problems it essentially never solves; A succeeds occasionally on almost every problem",
          "B is sampled at a lower temperature, so it must be the better model",
          "A's pass@100 was computed with the biased plug-in estimator",
          "The two models have different average success rates",
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

def pass_at_k(n, c, k):
    if n - c < k:
        return 1.0
    prod = 1.0
    for i in range(n - c + 1, n + 1):
        prod *= 1 - k / i
    return 1 - prod

def naive_pass_at_k(n, c, k):
    return 1 - (1 - c / n) ** k

def benchmark_pass_at_k(counts, n, k):
    return sum(pass_at_k(n, c, k) for c in counts) / len(counts)

print(pass_at_k(4, 2, 3), round(pass_at_k(4, 1, 2), 3), naive_pass_at_k(4, 2, 2))
print(benchmark_pass_at_k([0, 4], 4, 2), benchmark_pass_at_k([2, 2], 4, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 0.5 0.75\n0.5 0.5",
          "0.0 0.5 0.75\n0.5 0.5",
          "1.0 0.5 0.75\n1.0 0.5",
          "1.0 0.438 0.75\n0.5 0.5",
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

def pass_hat_k(n, c, k):
    return math.comb(c, k) / math.comb(n, k)

def expected_pass_at_k(rates, k):
    return sum(1 - (1 - p) ** k for p in rates) / len(rates)

def homogeneous_pass_at_k(rates, k):
    p = sum(rates) / len(rates)
    return 1 - (1 - p) ** k

print(pass_hat_k(4, 2, 3), pass_hat_k(5, 5, 2), round(pass_hat_k(4, 2, 2), 3))
print(expected_pass_at_k([0.0, 1.0], 3), homogeneous_pass_at_k([0.0, 1.0], 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 1.0 0.167\n0.5 0.875",
          "0.25 1.0 0.167\n0.5 0.875",
          "0.0 1.0 0.25\n0.5 0.875",
          "0.0 1.0 0.167\n0.875 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pass_at_k(n, c, k)</C> with the product form, returning 1.0 when fewer than k samples fail,{" "}
          <C>naive_pass_at_k(n, c, k)</C>, and <C>benchmark_pass_at_k(counts, n, k)</C>, averaging over problems that each have n samples.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def pass_at_k(n, c, k):
    return c / n

def naive_pass_at_k(n, c, k):
    return c / n

def benchmark_pass_at_k(counts, n, k):
    return 0.0
`,
        solution: ESTIMATE,
        tests: [
          { name: "single", code: `assert abs(pass_at_k(200, 1, 100) - 0.5) < 1e-9 and abs(pass_at_k(12, 3, 2) - 30 / 66) < 1e-12\nassert abs(naive_pass_at_k(10, 5, 2) - 0.75) < 1e-12` },
          { name: "bench", code: `assert abs(benchmark_pass_at_k([1, 3, 0], 5, 2) - 0.4333333333) < 1e-9 and benchmark_pass_at_k([5, 5], 5, 3) == 1.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pass_hat_k(n, c, k)</C>, <C>expected_pass_at_k(rates, k)</C> from true per-problem rates, and{" "}
          <C>homogeneous_pass_at_k(rates, k)</C>, the pass@k if every problem had the mean rate.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def pass_hat_k(n, c, k):
    return c / n

def expected_pass_at_k(rates, k):
    return sum(rates) / len(rates)

def homogeneous_pass_at_k(rates, k):
    return sum(rates) / len(rates)
`,
        solution: RATES,
        tests: [
          { name: "hat", code: `assert abs(pass_hat_k(6, 4, 2) - 0.4) < 1e-12 and pass_hat_k(5, 2, 3) == 0.0` },
          { name: "rates", code: `assert abs(expected_pass_at_k([0.2, 0.4, 0.0], 2) - 1 / 3) < 1e-12 and abs(homogeneous_pass_at_k([0.2, 0.4, 0.0], 2) - 0.36) < 1e-12` },
        ],
      },
    },
    {
      key: "mix",
      rung: "stretch",
      prompt: (
        <p>
          A benchmark has two kinds of problem in equal numbers, with success rates 0.1 and 0.5. What is its expected pass@5? Give three
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.689, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        pass@k needs a test that says whether an answer is right. For essays, summaries and conversations no such test exists, and
        the next lesson examines the common substitute: asking another model to judge.
      </p>
    </>
  ),
};
