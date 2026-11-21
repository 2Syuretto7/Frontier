import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CoverageLawViz } from "@/components/viz/CoverageLawViz";
import type { LessonContent } from "@/lib/types";

const LAW = `import math

def beta_fail(a, b, k):
    f = 1.0
    for i in range(k):
        f *= (b + i) / (a + b + i)                        # E[(1-p)^k] for p ~ Beta(a, b)
    return f

def mean_coverage(ps, k):
    return sum(1 - (1 - p) ** k for p in ps) / len(ps)

def fit_power(ks, fails):
    x = [math.log(k) for k in ks]; y = [math.log(f) for f in fails]
    mx, my = sum(x) / len(x), sum(y) / len(y)
    slope = sum((a - mx) * (b - my) for a, b in zip(x, y)) / sum((a - mx) ** 2 for a in x)
    return -slope                                          # the exponent of k^(-a)`;

const ALLOC = `def flops(N, tokens, k):
    return 2 * N * tokens * k                              # about 2N FLOPs per generated token

def samples_for_budget(budget, N, tokens):
    return int(budget // (2 * N * tokens))

def best_allocation(models, budget, tokens):
    best = None
    for name, N, p in models:
        k = int(budget // (2 * N * tokens))
        cov = 1 - (1 - p) ** k
        if best is None or cov > best[0]:
            best = (cov, name, k)
    return best[1], best[2]`;

export const lesson: LessonContent = {
  id: "l13.1.3",
  minutes: 50,
  links: {
    requires: ["l13.1.2", "l9.7.4"],
    revisits: ["l8.4.4", "l8.4.1"],
    foreshadows: ["l13.1.4", "l13.1.5"],
  },

  puzzle: (
    <>
      <p>
        Draw one more sample per problem and some unsolved problems get solved. Experiments drawing up to ten thousand
        samples found that the fraction solved kept rising, with no plateau in sight, and that the unsolved fraction fell
        roughly as a power of the number of samples. If each problem were solved with some fixed probability, failures would
        vanish exponentially fast. Where does the power law come from, and with a fixed budget of inference compute, is it
        better to sample a small model many times or a large one a few times?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A benchmark mixes easy problems, solved within a few samples, with hard ones that a model solves once in thousands
        of tries. After many samples only the hard problems remain unsolved, and how fast they fall depends on how many
        problems sit near zero success rate. A thick tail of nearly impossible problems turns exponential decay on each
        problem into a slow power law for the benchmark. Compute spent on samples then competes with compute spent on a
        bigger model, whose samples cost more but succeed more often.
      </p>
      <CoverageLawViz />
    </>
  ),

  theory: (
    <>
      <Definition title="inference compute">
        <p>
          A model with N parameters spends about 2N FLOPs per generated token, so k samples of T tokens cost{" "}
          <M>{"2NTk"}</M> FLOPs (<C>flops</C>), and a budget buys <M>{"\\lfloor B / 2NT \\rfloor"}</M> samples{" "}
          (<C>samples_for_budget</C>). Compute can also go into longer chains, which raise T, or into search, which the last
          lesson of this chapter takes up. Across a benchmark, coverage after k samples is the average of{" "}
          <M>{"1 - (1 - p_i)^k"}</M> over problems with success rates <M>{"p_i"}</M> (<C>mean_coverage</C>).
        </p>
      </Definition>

      <Theorem title="heterogeneous difficulty gives a power law">
        <p>
          If problems&apos; success rates follow a Beta(a, b) distribution, the expected failure rate after k independent
          samples is
        </p>
        <MD>{"\\mathbb{E}\\big[(1-p)^k\\big] = \\prod_{i=0}^{k-1} \\frac{b + i}{a + b + i} \\sim \\frac{\\Gamma(a + b)}{\\Gamma(b)}\\, k^{-a} \\quad (k \\to \\infty)"}</MD>
        <p>
          (<C>beta_fail</C>). The exponent is the shape a of the distribution near p = 0, which measures how many problems
          are nearly unsolvable.
        </p>
      </Theorem>
      <Proof>
        <p>
          With density <M>{"p^{a-1}(1-p)^{b-1}/B(a, b)"}</M>,{" "}
          <M>{"\\mathbb{E}[(1-p)^k] = B(a, b + k)/B(a, b) = \\frac{\\Gamma(b + k)\\,\\Gamma(a + b)}{\\Gamma(b)\\,\\Gamma(a + b + k)}"}</M>,
          and the recurrence <M>{"\\Gamma(x + 1) = x\\Gamma(x)"}</M> turns the ratio <M>{"\\Gamma(b+k)/\\Gamma(a+b+k)"}</M>{" "}
          into the product shown times <M>{"\\Gamma(b)/\\Gamma(a+b)"}</M>. For large x,{" "}
          <M>{"\\Gamma(x)/\\Gamma(x + a) \\sim x^{-a}"}</M>, by Stirling&apos;s formula, which gives the power law. Any
          distribution whose density behaves like <M>{"p^{a-1}"}</M> near 0 gives the same exponent, since only problems with
          p of order 1/k are still unsolved after k samples.
        </p>
        <Code>{LAW}</Code>
      </Proof>

      <Remark title="using the law">
        <p>
          On log-log axes the failure rate is a straight line of slope −a, so the exponent can be fitted from a few sample
          counts (<C>fit_power</C>) and used to forecast. Doubling the samples multiplies failures by <M>{"2^{-a}"}</M>: with
          a = 0.5, halving the failures needs four times the samples. The same reasoning explains why single-problem
          exponential behaviour and benchmark power laws coexist, and why the hardest problems decide the cost.
        </p>
      </Remark>

      <Definition title="compute-optimal inference">
        <p>
          Given models of different sizes and a budget, choose the model and the number of samples that maximise the target
          metric (<C>best_allocation</C>). Studies of this trade-off on mathematics found that a smaller model sampled more
          often, with a good way of choosing among samples, often matched or beat a larger model at equal inference FLOPs,
          until the small model&apos;s coverage saturated on problems it essentially never solves. Problems with p = 0 for a
          model are untouched by any number of its samples; only a stronger model helps there.
        </p>
        <Code>{ALLOC}</Code>
      </Definition>

      <Example title="sequential compute">
        <p>
          Reasoning models trained with reinforcement learning spend compute by thinking longer rather than sampling more.
          Reported accuracy on competition mathematics rose roughly linearly in the logarithm of thinking tokens over more
          than an order of magnitude, the same shape as coverage against samples. Each kind of scaling has a selection
          problem behind it: parallel samples need a judge, and long chains need the model to notice and fix its own errors,
          which is why the next lesson trains judges that score individual steps.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "beta",
      rung: "check",
      prompt: (
        <p>
          Success rates across problems follow a Beta(2, 3) distribution. What fraction of problems is solved, in expectation,
          by at least one of 4 samples?
        </p>
      ),
      answer: { kind: "numeric", value: 0.7857, tolerance: 0.001 },
    },
    {
      key: "budget",
      rung: "check",
      prompt: (
        <p>
          A model with 70 billion parameters writes 2000 tokens per sample. How many whole samples does a budget of{" "}
          <M>{"10^{18}"}</M> FLOPs buy?
        </p>
      ),
      answer: { kind: "numeric", value: 3571, tolerance: 0 },
    },
    {
      key: "tail",
      rung: "apply",
      prompt: <p>Why does the benchmark failure rate fall as a power law rather than exponentially in the number of samples?</p>,
      answer: {
        kind: "choice",
        options: [
          "Problems differ in difficulty, and after many samples only those with success rates near zero remain, of which there are many",
          "Samples from the same model are correlated, so each new sample adds less",
          "The model forgets earlier samples",
          "Exponential decay holds only for binary answers",
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

def beta_fail(a, b, k):
    f = 1.0
    for i in range(k):
        f *= (b + i) / (a + b + i)                        # E[(1-p)^k] for p ~ Beta(a, b)
    return f

def mean_coverage(ps, k):
    return sum(1 - (1 - p) ** k for p in ps) / len(ps)

def fit_power(ks, fails):
    x = [math.log(k) for k in ks]; y = [math.log(f) for f in fails]
    mx, my = sum(x) / len(x), sum(y) / len(y)
    slope = sum((a - mx) * (b - my) for a, b in zip(x, y)) / sum((a - mx) ** 2 for a in x)
    return -slope                                          # the exponent of k^(-a)

print(round(beta_fail(1, 1, 3), 4), round(mean_coverage([0.5, 0.1, 0.0], 2), 4))
print(round(fit_power([1, 10, 100], [0.5, 0.05, 0.005]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.25 0.3133\n1.0",
          "0.125 0.3133\n1.0",
          "0.25 0.2\n1.0",
          "0.25 0.3133\n-1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def flops(N, tokens, k):
    return 2 * N * tokens * k                              # about 2N FLOPs per generated token

def samples_for_budget(budget, N, tokens):
    return int(budget // (2 * N * tokens))

def best_allocation(models, budget, tokens):
    best = None
    for name, N, p in models:
        k = int(budget // (2 * N * tokens))
        cov = 1 - (1 - p) ** k
        if best is None or cov > best[0]:
            best = (cov, name, k)
    return best[1], best[2]

print(flops(1e9, 1000, 4), samples_for_budget(1e15, 7e9, 500))
print(best_allocation([("small", 1e9, 0.1), ("big", 1e10, 0.5)], 2e14, 1000))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "8000000000000.0 142\n('small', 100)",
          "8000000000000.0 142\n('big', 10)",
          "4000000000000.0 285\n('small', 100)",
          "8000000000000.0 285\n('small', 200)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>beta_fail(a, b, k)</C>, <C>mean_coverage(ps, k)</C>, and <C>fit_power(ks, fails)</C>, which fits a line
          to log failure against log k by least squares and returns minus its slope.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def beta_fail(a, b, k):
    return 1.0

def mean_coverage(ps, k):
    return 1.0

def fit_power(ks, fails):
    return 0.0
`,
        solution: LAW,
        tests: [
          { name: "beta", code: `assert abs(beta_fail(2, 2, 2) - 0.3) < 1e-12 and mean_coverage([1.0, 0.0], 5) == 0.5` },
          { name: "fit", code: `assert abs(fit_power([1, 4, 16], [1.0, 0.5, 0.25]) - 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>flops(N, tokens, k)</C>, <C>samples_for_budget(budget, N, tokens)</C>, and{" "}
          <C>best_allocation(models, budget, tokens)</C> for models given as (name, N, p), returning the name and sample
          count with the highest coverage, the first model winning ties.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def flops(N, tokens, k):
    return N * tokens * k

def samples_for_budget(budget, N, tokens):
    return budget

def best_allocation(models, budget, tokens):
    return models[0][0], 1
`,
        solution: ALLOC,
        tests: [
          { name: "flops", code: `assert flops(2, 3, 4) == 48 and samples_for_budget(100, 2, 5) == 5` },
          { name: "alloc", code: `assert best_allocation([("a", 1, 0.5), ("b", 4, 0.9)], 80, 1) == ("a", 40)` },
        ],
      },
    },
    {
      key: "halve",
      rung: "stretch",
      prompt: (
        <p>
          Success rates follow a Beta(0.5, 2) distribution. For large k, by what factor must the number of samples grow to
          halve the failure rate?
        </p>
      ),
      answer: { kind: "numeric", value: 4, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Coverage grows, but turning it into accuracy needs a judge that can tell good reasoning from bad. Outcome checks
        work when answers can be verified; when they cannot, a model that scores each step of a chain can guide both the
        choice among samples and the search for better ones.
      </p>
    </>
  ),
};
