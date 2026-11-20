import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { QuestionsNeededViz } from "@/components/viz/QuestionsNeededViz";
import type { LessonContent } from "@/lib/types";

const PLAN = `import math

def paired_var(f_disc, gap):
    return f_disc - gap * gap

def questions_needed(f_disc, gap, de=1.0, za=1.96, zb=0.8416):
    return math.ceil(de * (za + zb) ** 2 * paired_var(f_disc, gap) / gap ** 2)

def mde(n, f_disc, de=1.0, za=1.96, zb=0.8416):
    return (za + zb) * math.sqrt(de * f_disc / n)`;

const SIM = `import math
import random

def norm_cdf(x):
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))

def power_normal(gap, se, z=1.96):
    return norm_cdf(gap / se - z) + norm_cdf(-gap / se - z)

def simulate_power(p10, p01, n, reps, seed):
    rng = random.Random(seed)
    hits = 0
    for _ in range(reps):
        a = b = 0
        for _ in range(n):
            u = rng.random()
            if u < p10:
                a += 1
            elif u < p10 + p01:
                b += 1
        if a + b and (a - b) ** 2 / (a + b) > 3.841:
            hits += 1
    return hits / reps`;

export const lesson: LessonContent = {
  id: "l10.2.4",
  minutes: 45,
  links: {
    requires: ["l10.2.3", "m9.8.4"],
    revisits: ["l10.2.2", "m9.4.1", "l10.1.4"],
    foreshadows: ["l10.3.4", "l10.7.1", "l10.7.4"],
  },

  puzzle: (
    <>
      <p>
        A team tries a new data mixture and evaluates on a 300-question benchmark. The result is not significant, and the idea is
        dropped. Was the idea bad, or was the benchmark simply too small to see an improvement of the size the idea could plausibly
        deliver? Without a power calculation done beforehand, there is no way to tell.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Power is the chance an evaluation detects a real difference of a given size. It depends on the size of the difference, the
        noise in the measurement, and the number of questions. For evaluations, the noise is set by how often the two models
        disagree, by clustering, and by sampling. Plan the evaluation for the smallest difference you would act on, not for the one
        you hope to see.
      </p>
      <QuestionsNeededViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="questions needed for a paired comparison">
        <p>
          Two models are compared on the same right-or-wrong questions; they disagree on a fraction f, and the true gap is g. A
          two-sided test at level α has power <M>{"1 - \\beta"}</M> against g when the number of questions is about
        </p>
        <MD>{"n = \\mathrm{DE}\\,(z_{\\alpha/2} + z_\\beta)^2\\,\\frac{f - g^2}{g^2},"}</MD>
        <p>where DE is the design effect from clustering, 1 for independent questions.</p>
      </Theorem>
      <Proof>
        <p>
          The per-question difference has variance <M>{"f - g^2"}</M> (l10.2.2), inflated by DE under clustering (l10.2.3), so the
          estimated gap has standard error <M>{"\\sqrt{\\mathrm{DE}(f - g^2)/n}"}</M>. A z-test rejects when the estimate exceeds{" "}
          <M>{"z_{\\alpha/2}"}</M> standard errors. If the true gap is g, the estimate is approximately normal around g, and it exceeds the
          threshold with probability <M>{"1-\\beta"}</M> when <M>{"g = (z_{\\alpha/2} + z_\\beta)\\,\\mathrm{se}"}</M>, ignoring the tiny chance
          of rejecting in the wrong direction. Square and solve for n (<C>questions_needed</C>, with <C>paired_var</C>). For α = 0.05 and
          80% power, <M>{"(1.96 + 0.8416)^2 \\approx 7.85"}</M>.
        </p>
      </Proof>

      <Definition title="minimum detectable effect">
        <p>
          Turned round, a benchmark of n questions has minimum detectable effect{" "}
          <M>{"\\mathrm{MDE} \\approx (z_{\\alpha/2} + z_\\beta)\\sqrt{\\mathrm{DE}\\, f / n}"}</M>, dropping the small <M>{"g^2"}</M> term
          (<C>mde</C>). Every benchmark should come with this number: a 500-question benchmark on which models disagree 20% of the time
          cannot reliably detect gaps under about 5.6 points.
        </p>
        <Code>{PLAN}</Code>
      </Definition>

      <Remark title="checking by simulation">
        <p>
          The normal formula gives power directly as{" "}
          <M>{"\\Phi(g/\\mathrm{se} - z_{\\alpha/2}) + \\Phi(-g/\\mathrm{se} - z_{\\alpha/2})"}</M> (<C>power_normal</C>, with{" "}
          <C>norm_cdf</C>). When the setting is awkward, with few tasks, clusters of unequal size or a statistic that is not a mean,
          simulate: draw many evaluations from a model of the outcomes, run the planned test on each, and count rejections
          (<C>simulate_power</C>). Simulation also checks that the test keeps its false-positive rate when the true gap is zero.
        </p>
        <Code>{SIM}</Code>
      </Remark>

      <Example title="planning an ablation">
        <p>
          You expect a change to add 2 points and the models will disagree on about 15% of questions. The formula gives{" "}
          <M>{"7.85 \\times (0.15 - 0.0004)/0.0004 \\approx 2{,}936"}</M> questions for 80% power. If the only benchmark has 800, either
          pool several benchmarks, sample several answers per question to cut the within-question part of the disagreement, or accept
          that a null result will be uninformative and say so.
        </p>
      </Example>

      <Remark title="why underpowered evaluations mislead">
        <p>
          When power is low, the results that do reach significance are those where noise happened to inflate the gap, so published
          improvements from small evaluations are exaggerated on average (m9.8.4); selecting the best of many runs compounds this
          (l10.1.4). Non-significant results from underpowered evaluations are not evidence of no effect. Both problems are cured the
          same way: compute power before running, and report the minimum detectable effect with the result.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "need",
      rung: "check",
      prompt: (
        <p>
          Two models disagree on 20% of questions and you want 80% power at the 5% level to detect a 3-point gap. Using z values 1.96
          and 0.8416, how many independent questions do you need? Round up.
        </p>
      ),
      answer: { kind: "numeric", value: 1737, tolerance: 0 },
    },
    {
      key: "mde",
      rung: "check",
      prompt: (
        <p>
          A benchmark has 1,000 independent questions and model pairs typically disagree on 15% of them. What is its minimum detectable
          effect at 80% power and the 5% level, in percentage points, dropping the <M>{"g^2"}</M> term? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 3.43, tolerance: 0.01 },
    },
    {
      key: "null",
      rung: "apply",
      prompt: (
        <p>
          An idea is tested on 300 questions and gives a non-significant gain of 1.5 points. The benchmark&apos;s minimum detectable effect
          is 7 points. What should be reported?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "That the test could only have detected gains of about 7 points or more, so the result neither supports nor rules out a gain of a few points",
          "That the idea does not work",
          "That the idea improves the model by 1.5 points",
          "Nothing, since non-significant results carry no information",
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

def paired_var(f_disc, gap):
    return f_disc - gap * gap

def questions_needed(f_disc, gap, de=1.0, za=1.96, zb=0.8416):
    return math.ceil(de * (za + zb) ** 2 * paired_var(f_disc, gap) / gap ** 2)

def mde(n, f_disc, de=1.0, za=1.96, zb=0.8416):
    return (za + zb) * math.sqrt(de * f_disc / n)

print(paired_var(0.3, 0.1), questions_needed(0.5, 0.5, za=1.0, zb=1.0))
print(round(mde(400, 0.25, za=1.0, zb=1.0), 3), round(mde(400, 0.25, de=4, za=1.0, zb=1.0), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.29 4\n0.05 0.1",
          "0.29 2\n0.05 0.1",
          "0.29 4\n0.05 0.2",
          "0.2 4\n0.05 0.1",
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
import random

def norm_cdf(x):
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))

def power_normal(gap, se, z=1.96):
    return norm_cdf(gap / se - z) + norm_cdf(-gap / se - z)

def simulate_power(p10, p01, n, reps, seed):
    rng = random.Random(seed)
    hits = 0
    for _ in range(reps):
        a = b = 0
        for _ in range(n):
            u = rng.random()
            if u < p10:
                a += 1
            elif u < p10 + p01:
                b += 1
        if a + b and (a - b) ** 2 / (a + b) > 3.841:
            hits += 1
    return hits / reps

print(norm_cdf(0), round(power_normal(0, 1), 3))
print(simulate_power(0.0, 0.0, 10, 5, 0), simulate_power(1.0, 0.0, 10, 5, 0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.05\n0.0 1.0",
          "0.5 0.025\n0.0 1.0",
          "0.5 0.05\n0.05 1.0",
          "0.0 0.05\n0.0 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>paired_var(f_disc, gap)</C>, <C>questions_needed(f_disc, gap, de=1.0, za=1.96, zb=0.8416)</C>, rounded up, and{" "}
          <C>mde(n, f_disc, de=1.0, za=1.96, zb=0.8416)</C>, dropping the squared-gap term.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def paired_var(f_disc, gap):
    return f_disc

def questions_needed(f_disc, gap, de=1.0, za=1.96, zb=0.8416):
    return 0

def mde(n, f_disc, de=1.0, za=1.96, zb=0.8416):
    return 0.0
`,
        solution: PLAN,
        tests: [
          { name: "need", code: `assert questions_needed(0.3, 0.05) == 935 and questions_needed(0.1, 0.02, de=2) == 3909 and abs(paired_var(0.2, 0.1) - 0.19) < 1e-12` },
          { name: "mde", code: `assert abs(mde(2500, 0.2) - 0.0250582722) < 1e-9 and abs(mde(100, 0.25, de=4, za=1.0, zb=1.0) - 0.2) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>norm_cdf(x)</C> with <C>math.erf</C>, <C>power_normal(gap, se, z=1.96)</C> counting both rejection directions, and{" "}
          <C>simulate_power(p10, p01, n, reps, seed)</C>: for each of <C>reps</C> evaluations, draw n questions that are only-A-right with
          probability p10 and only-B-right with probability p01, and count a rejection when the McNemar statistic exceeds 3.841.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math
import random

def norm_cdf(x):
    return 0.5

def power_normal(gap, se, z=1.96):
    return 0.05

def simulate_power(p10, p01, n, reps, seed):
    return 0.0
`,
        solution: SIM,
        tests: [
          { name: "normal", code: `assert abs(norm_cdf(1.96) - 0.9750021) < 1e-6 and abs(power_normal(0.03, 0.01) - 0.8508304) < 1e-6` },
          { name: "sim", code: `assert simulate_power(0.0, 0.0, 10, 5, 0) == 0.0 and simulate_power(0.6, 0.0, 20, 50, 3) == 1.0\nassert 0.45 < simulate_power(0.15, 0.10, 500, 200, 1) < 0.77` },
        ],
      },
    },
    {
      key: "power",
      rung: "stretch",
      prompt: (
        <p>
          A paired evaluation uses 500 independent questions. The models disagree on 25% of them and the true gap is 4 points. What is the
          power of a two-sided test at the 5% level, by the normal approximation? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.434, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        So far every question had a single right answer. The next module turns to open-ended generation, where scoring is itself
        uncertain: code that may or may not pass tests, and answers that need a judge.
      </p>
    </>
  ),
};
