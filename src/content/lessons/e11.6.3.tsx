import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AblationSeedsViz } from "@/components/viz/AblationSeedsViz";
import type { LessonContent } from "@/lib/types";

const NOISE = `import math
from statistics import mean, stdev

def seed_noise(scores_by_seed):
    return mean(stdev(v) for v in scores_by_seed.values())   # typical spread of one setting across seeds

def snr(a, b):
    pooled = math.sqrt((stdev(a) ** 2 + stdev(b) ** 2) / 2)
    return abs(mean(a) - mean(b)) / pooled        # difference in units of seed noise

def monotonicity(scores):
    n = len(scores)
    pairs = [(i, j) for i in range(n) for j in range(i + 1, n)]
    return sum((scores[j] > scores[i]) - (scores[j] < scores[i]) for i, j in pairs) / len(pairs)   # +1: always improving`;

const RANKING = `def ranks(values):
    order = sorted(range(len(values)), key=lambda i: values[i])
    r, i = [0.0] * len(values), 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and values[order[j + 1]] == values[order[i]]:
            j += 1
        for k in range(i, j + 1):
            r[order[k]] = (i + j) / 2 + 1         # ties share the average rank
        i = j + 1
    return r

def spearman(x, y):
    rx, ry = ranks(x), ranks(y)
    mx, my = sum(rx) / len(rx), sum(ry) / len(ry)
    cov = sum((a - mx) * (b - my) for a, b in zip(rx, ry))
    return cov / (sum((a - mx) ** 2 for a in rx) * sum((b - my) ** 2 for b in ry)) ** 0.5

def decision_accuracy(small, large):
    n = len(small)
    pairs = [(i, j) for i in range(n) for j in range(i + 1, n) if large[i] != large[j]]
    return sum((small[i] - small[j]) * (large[i] - large[j]) > 0 for i, j in pairs) / len(pairs)`;

export const lesson: LessonContent = {
  id: "e11.6.3",
  minutes: 50,
  links: {
    requires: ["e11.6.2", "m9.1.2"],
    revisits: ["e11.3.2", "l8.4.1"],
    foreshadows: ["e11.6.4"],
  },

  puzzle: (
    <>
      <p>
        A team trains a 1B-parameter model for 25B tokens on each of two filtered corpora and finds that the second scores half a point
        higher on a reasoning benchmark. They adopt it for a 70B run costing millions. A colleague retrains the same two small models with
        a different random seed and the order flips. Was the first result real? How many seeds, which benchmarks, and how small a model
        can a data decision safely rest on?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A small ablation is a measurement with noise. Changing only the seed, which alters initialisation and data order, moves a
        benchmark score by some spread σ. If the true difference between two datasets is δ, a single pair of runs ranks them correctly
        only as often as a coin weighted by δ/σ. Averaging over seeds shrinks the noise; choosing benchmarks whose scores barely move
        between seeds, yet rise steadily during training, shrinks it further. Finally, the ranking must transfer: what matters is whether
        the small runs order datasets the same way large runs would.
      </p>
      <AblationSeedsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="measuring a benchmark's noise">
        <p>
          <C>seed_noise</C> averages, over settings, the sample standard deviation of a score across seeds. <C>snr</C> divides the
          difference of two settings&apos; means by their pooled seed standard deviation. <C>monotonicity</C> takes checkpoint scores
          from one run and averages the sign of every later-minus-earlier difference: +1 means the benchmark rises steadily with training,
          0 means it wanders.
        </p>
        <Code>{NOISE}</Code>
      </Definition>

      <Theorem title="probability of ranking correctly">
        <p>
          Suppose each run of dataset A scores <M>{"\\mu"}</M> plus independent noise <M>{"N(0, \\sigma^2)"}</M>, and dataset B scores{" "}
          <M>{"\\mu + \\delta"}</M> with <M>{"\\delta > 0"}</M> plus the same kind of noise. Averaging n seeds of each, the probability
          that B&apos;s mean is higher is <M>{"\\Phi\\big(\\delta \\sqrt{n} / (\\sigma \\sqrt 2)\\big)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The mean of n independent <M>{"N(0, \\sigma^2)"}</M> draws is <M>{"N(0, \\sigma^2/n)"}</M> (m9.1.2). The difference of the two
          means is therefore <M>{"N(\\delta, 2\\sigma^2/n)"}</M>, and it is positive with probability{" "}
          <M>{"\\Phi\\big(\\delta / \\sqrt{2\\sigma^2/n}\\big)"}</M>, which is the stated value. The required number of seeds grows as{" "}
          <M>{"(\\sigma/\\delta)^2"}</M>: halving the difference you want to detect quadruples the cost.
        </p>
      </Proof>

      <Definition title="does the ranking transfer?">
        <p>
          Given scores of several datasets at a small scale and at a large scale, <C>ranks</C> assigns ranks from 1, giving tied values
          the average of their ranks. <C>spearman</C> is the Pearson correlation of the two rank lists. <C>decision_accuracy</C> is the
          share of dataset pairs, ignoring pairs tied at the large scale, that the small scale orders the same way as the large scale.
        </p>
        <Code>{RANKING}</Code>
      </Definition>

      <Theorem title="decision accuracy and Kendall's tau">
        <p>
          If neither list has ties, decision accuracy equals <M>{"(1 + \\tau)/2"}</M>, where τ is Kendall&apos;s rank correlation.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let P be the number of pairs, C the concordant pairs (same order at both scales) and D the discordant ones. With no ties every
          pair is one or the other, so <M>{"C + D = P"}</M>. Kendall&apos;s τ is <M>{"(C - D)/P"}</M>, and decision accuracy is{" "}
          <M>{"C/P = (P + C - D)/(2P) = (1 + \\tau)/2"}</M>.
        </p>
      </Proof>

      <Remark title="designing ablations in practice">
        <p>
          Teams building open datasets such as FineWeb and DCLM train models of a few hundred million to about a billion parameters on
          tens of billions of tokens, and evaluate them on benchmarks chosen for low seed noise and steady improvement during training.
          Benchmarks that stay near chance at small scale, like many multiple-choice tests in their standard form, are rewritten as
          cloze-style tasks scored by the likelihood of the correct answer, which gives a usable signal much earlier. Several seeds are run
          for the decisions that matter, and a few choices are checked again at a larger scale to confirm that rankings transfer. Quality
          classifiers (e11.3.2) are themselves usually validated this way. Fitting how a gap changes with scale borrows the tools of
          scaling laws (l8.4.1).
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          On a benchmark whose seed noise is about one point, a half-point gap with one seed each is ranked correctly only about 64% of
          the time, little better than a coin. The team should either move to benchmarks with lower seed noise and higher monotonicity,
          or average enough seeds that <M>{"\\delta\\sqrt n/(\\sigma\\sqrt 2)"}</M> is comfortably above 1.6, and check on a held-out set
          of past decisions that the small scale orders datasets the way large runs did.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "seeds",
      rung: "check",
      prompt: (
        <p>
          Dataset B is truly better by δ = 0.5 points and seed noise is σ = 1 point. With 2 seeds for each dataset, what is the
          probability that B&apos;s average is higher? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.691, tolerance: 0.002 },
    },
    {
      key: "rho",
      rung: "check",
      prompt: (
        <p>
          Four datasets rank 1, 2, 3, 4 at small scale and 2, 1, 4, 3 at large scale. What is the Spearman correlation? Give one
          decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 0.6, tolerance: 0.001 },
    },
    {
      key: "choose",
      rung: "apply",
      prompt: <p>Which benchmark is best suited to small data ablations?</p>,
      answer: {
        kind: "choice",
        options: [
          "One whose score changes little between seeds and rises steadily during training",
          "The hardest benchmark available, since it will matter most for the final model",
          "One whose score stays near chance for small models, so differences are not exaggerated",
          "Whichever shows the largest gap between the two datasets on a single run",
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
from statistics import mean, stdev

def seed_noise(scores_by_seed):
    return mean(stdev(v) for v in scores_by_seed.values())   # typical spread of one setting across seeds

def snr(a, b):
    pooled = math.sqrt((stdev(a) ** 2 + stdev(b) ** 2) / 2)
    return abs(mean(a) - mean(b)) / pooled        # difference in units of seed noise

def monotonicity(scores):
    n = len(scores)
    pairs = [(i, j) for i in range(n) for j in range(i + 1, n)]
    return sum((scores[j] > scores[i]) - (scores[j] < scores[i]) for i, j in pairs) / len(pairs)   # +1: always improving

a, b = [50.0, 52.0, 51.0], [53.0, 54.0, 55.0]
print(seed_noise({"a": a, "b": b}), round(snr(a, b), 2), round(monotonicity([0.25, 0.3, 0.28, 0.35]), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.0 3.0 0.67", "1.0 1.5 0.67", "0.82 3.0 0.67", "1.0 3.0 0.83"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ranks(values):
    order = sorted(range(len(values)), key=lambda i: values[i])
    r, i = [0.0] * len(values), 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and values[order[j + 1]] == values[order[i]]:
            j += 1
        for k in range(i, j + 1):
            r[order[k]] = (i + j) / 2 + 1         # ties share the average rank
        i = j + 1
    return r

def spearman(x, y):
    rx, ry = ranks(x), ranks(y)
    mx, my = sum(rx) / len(rx), sum(ry) / len(ry)
    cov = sum((a - mx) * (b - my) for a, b in zip(rx, ry))
    return cov / (sum((a - mx) ** 2 for a in rx) * sum((b - my) ** 2 for b in ry)) ** 0.5

def decision_accuracy(small, large):
    n = len(small)
    pairs = [(i, j) for i in range(n) for j in range(i + 1, n) if large[i] != large[j]]
    return sum((small[i] - small[j]) * (large[i] - large[j]) > 0 for i, j in pairs) / len(pairs)

s, l = [0.40, 0.42, 0.41, 0.45], [0.50, 0.55, 0.57, 0.60]
print(ranks([3, 1, 3, 2]), spearman(s, l), round(decision_accuracy(s, l), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[3.5, 1.0, 3.5, 2.0] 0.8 0.83",
          "[3.0, 1.0, 4.0, 2.0] 0.8 0.83",
          "[3.5, 1.0, 3.5, 2.0] 0.8 0.67",
          "[3.5, 1.0, 3.5, 2.0] 1.0 0.83",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>seed_noise(scores_by_seed)</C>, taking a dict from setting to a list of per-seed scores; <C>snr(a, b)</C>; and{" "}
          <C>monotonicity(scores)</C>. Use the sample standard deviation.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math
from statistics import mean, stdev

def seed_noise(scores_by_seed):
    return 0.0

def snr(a, b):
    return abs(mean(a) - mean(b))

def monotonicity(scores):
    return 0.0
`,
        solution: NOISE,
        tests: [
          { name: "noise", code: `assert abs(seed_noise({"x": [1.0, 3.0], "y": [2.0, 2.0, 2.0]}) - math.sqrt(2) / 2) < 1e-9\nassert abs(snr([1.0, 3.0], [5.0, 7.0]) - 4 / math.sqrt(2)) < 1e-9 and abs(snr([7.0, 5.0], [1.0, 3.0]) - 4 / math.sqrt(2)) < 1e-9` },
          { name: "monotone", code: `assert monotonicity([1, 2, 3]) == 1 and monotonicity([3, 2, 1]) == -1\nassert monotonicity([1, 1]) == 0 and abs(monotonicity([1, 3, 2]) - 1 / 3) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ranks(values)</C>, giving ranks from 1 and averaging ties; <C>spearman(x, y)</C>; and{" "}
          <C>decision_accuracy(small, large)</C>, skipping pairs tied in <C>large</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ranks(values):
    return [float(i + 1) for i in range(len(values))]

def spearman(x, y):
    return 0.0

def decision_accuracy(small, large):
    return 0.0
`,
        solution: RANKING,
        tests: [
          { name: "ranks", code: `assert ranks([10, 20, 20, 20]) == [1.0, 3.0, 3.0, 3.0] and ranks([5, 4]) == [2.0, 1.0]\nassert abs(spearman([1, 2, 3, 4], [4, 3, 2, 1]) + 1) < 1e-9 and abs(spearman([1, 2, 3], [1, 3, 2]) - 0.5) < 1e-9` },
          { name: "accuracy", code: `assert abs(decision_accuracy([1, 2, 3], [1, 3, 2]) - 2 / 3) < 1e-9\nassert decision_accuracy([3, 2, 1], [1, 1, 2]) == 0` },
        ],
      },
    },
    {
      key: "budget",
      rung: "stretch",
      prompt: (
        <p>
          You need a 95% chance of ranking two datasets correctly when the true gap is δ = 0.3 and seed noise is σ = 1. Using the
          normal approximation with <M>{"\\Phi^{-1}(0.95) = 1.645"}</M>, what is the smallest number of seeds per dataset?
        </p>
      ),
      answer: { kind: "numeric", value: 61, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Ablations decide what goes into pre-training. Later in training the data changes character: the next lesson covers mid-training,
        where a smaller, higher-quality mixture with long documents, code and reasoning traces is introduced before the run ends.
      </p>
    </>
  ),
};
