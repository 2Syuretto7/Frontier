import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EmergenceViz } from "@/components/viz/EmergenceViz";
import type { LessonContent } from "@/lib/types";

const METRICS = `def exact_match(p, length):
    return p ** length

def expected_wrong_tokens(p, length):
    return length * (1 - p)

def mc_correct(q, k):
    return q > (1 - q) / (k - 1)`;

const RESOLUTION = `import math

def prob_all_zero(acc, n):
    return (1 - acc) ** n

def min_items(acc, conf):
    return math.ceil(math.log(1 - conf) / math.log(1 - acc))

def pass_until_estimate(attempts):
    return len(attempts) / sum(attempts)`;

export const lesson: LessonContent = {
  id: "l8.6.3",
  minutes: 45,
  links: {
    requires: ["l8.4.5", "l8.6.1"],
    revisits: ["m12.1.1", "m9.8.1", "l8.2.4"],
    foreshadows: ["l10.1.1", "l8.7.3"],
  },

  puzzle: (
    <>
      <p>
        In 2022 a survey listed more than a hundred tasks on which language models scored at chance up to some size and then
        well above it, with nothing in the smaller models to warn of the change. A year later another paper re-scored many of the
        same models and found smooth, predictable curves. Both used real measurements. How can the same models show a sudden
        ability and a gradual one?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A benchmark score is a function of the model and of the scoring rule. If the rule demands that every token of a long
        answer be right, or that the correct option beat every other option, it turns a smoothly improving probability into
        a quantity that sits at zero and then rises steeply. If the benchmark is small, a rate of one in a thousand cannot be
        told apart from zero. Some jumps are made by the ruler. Others survive any ruler, and those are the interesting ones.
      </p>
      <EmergenceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="emergent ability">
        <p>
          Wei and colleagues called an ability emergent if it is not present in smaller models but is present in larger ones,
          so that it cannot be predicted by extrapolating the performance of smaller models. The definition refers to a
          metric: the same models can be emergent under one and smooth under another.
        </p>
      </Definition>

      <Definition title="discontinuous and continuous metrics">
        <p>
          With per-token probability p of the right token, exact match on an answer of ℓ tokens scores <M>{"p^{\\ell}"}</M> (<C>exact_match</C>),
          while the expected number of wrong tokens, a stand-in for token edit distance, is <M>{"\\ell(1 - p)"}</M> (<C>expected_wrong_tokens</C>), linear in p.
          Multiple-choice accuracy is an argmax: with probability q on the right option of k and the rest spread evenly, the
          answer is scored correct only when <M>{"q > (1 - q)/(k - 1)"}</M> (<C>mc_correct</C>). Schaeffer and colleagues re-scored
          tasks from BIG-Bench with continuous metrics such as edit distance and the Brier score, and most of the jumps became
          smooth curves.
        </p>
        <Code>{METRICS}</Code>
      </Definition>

      <Theorem title="the argmax threshold">
        <p>
          With probability q on the right option and <M>{"(1-q)/(k-1)"}</M> on each of the others, the argmax is the right option exactly when{" "}
          <M>{"q > 1/k"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"q > (1-q)/(k-1)"}</M> is equivalent to <M>{"q(k-1) > 1 - q"}</M>, that is <M>{"qk > 1"}</M>. So accuracy on such an item is 0 below{" "}
          <M>{"q = 1/k"}</M> and 1 above, however smoothly q itself changes with scale. Averaged over items whose q differ, the jump is
          blurred but can remain steep.
        </p>
      </Proof>

      <Definition title="resolution">
        <p>
          A benchmark of n items with true accuracy a shows zero correct with probability <M>{"(1 - a)^n"}</M> (<C>prob_all_zero</C>). To see at
          least one success with confidence c needs <M>{"n \\ge \\ln(1-c)/\\ln(1-a)"}</M> items (<C>min_items</C>). Hu and colleagues&apos; PassUntil
          method instead samples each item until it is first solved; the number of attempts is geometric, and the maximum
          likelihood estimate of the pass rate is the number of items over the total attempts (<C>pass_until_estimate</C>). With it,
          they measured pass rates far below one in a hundred and found them improving smoothly and predictably long before
          the usual accuracy left zero.
        </p>
        <Code>{RESOLUTION}</Code>
      </Definition>

      <Remark title="what remains">
        <p>
          Not every jump is an artefact. Du and colleagues found that several abilities appear once pretraining loss falls below
          a threshold, regardless of model size, and stay at chance above it even under continuous metrics. Within one training
          run, Olsson and colleagues saw induction heads, the circuit behind copying from context, form within a short window,
          with a visible bump in the loss. A sharp change that survives a continuous metric and a large benchmark is evidence of
          a real transition in what the model computes.
        </p>
      </Remark>

      <Example title="a protocol for claims of emergence">
        <p>
          Before believing a sudden ability: re-score with a continuous metric such as the log-probability of the correct answer;
          check whether the benchmark is large enough to resolve small rates, or estimate them with repeated sampling; plot
          against pretraining loss as well as against parameters; and compare with the seed-to-seed spread of l8.2.4. A jump that
          survives all four is worth a paper. One that does not is a statement about the metric.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "em",
      rung: "check",
      prompt: <p>A model gets each token of a five-token answer right with probability 0.8, independently. What is its expected exact-match score? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.328, tolerance: 0.001 },
    },
    {
      key: "zero",
      rung: "check",
      prompt: <p>A model&apos;s true accuracy on a task is 0.002. On a benchmark of 500 independent items, what is the probability it scores exactly zero? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.368, tolerance: 0.001 },
    },
    {
      key: "real",
      rung: "apply",
      prompt: <p>Which observation is the strongest evidence that a jump in an ability is real rather than an artefact of measurement?</p>,
      answer: {
        kind: "choice",
        options: [
          "The jump remains when the task is re-scored with the log-probability of the correct answer on a large benchmark",
          "The jump appears in exact-match accuracy on a 100-item benchmark",
          "The jump appears only for models above 100 billion parameters",
          "The jump appears in multiple-choice accuracy with four options",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def exact_match(p, length):
    return p ** length

def expected_wrong_tokens(p, length):
    return length * (1 - p)

def mc_correct(q, k):
    return q > (1 - q) / (k - 1)

print(exact_match(0.5, 3), round(expected_wrong_tokens(0.75, 8), 2))
print(mc_correct(0.3, 4), mc_correct(0.25, 4), mc_correct(0.4, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.125 2.0\nTrue False False",
          "0.125 6.0\nTrue False False",
          "0.125 2.0\nTrue True False",
          "1.5 2.0\nTrue False True",
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

def prob_all_zero(acc, n):
    return (1 - acc) ** n

def min_items(acc, conf):
    return math.ceil(math.log(1 - conf) / math.log(1 - acc))

def pass_until_estimate(attempts):
    return len(attempts) / sum(attempts)

print(prob_all_zero(0.5, 3), min_items(0.5, 0.9))
print(pass_until_estimate([1, 3, 6]), pass_until_estimate([4]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.125 4\n0.3 0.25",
          "0.125 3\n0.3 0.25",
          "0.875 4\n0.3 0.25",
          "0.125 4\n3.333 4.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>exact_match(p, length)</C>, <C>expected_wrong_tokens(p, length)</C> and <C>mc_correct(q, k)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def exact_match(p, length):
    return p * length

def expected_wrong_tokens(p, length):
    return 1 - p

def mc_correct(q, k):
    return q > 0.5
`,
        solution: METRICS,
        tests: [
          { name: "em", code: `assert abs(exact_match(0.9, 2) - 0.81) < 1e-12 and abs(expected_wrong_tokens(0.6, 10) - 4.0) < 1e-12` },
          { name: "mc", code: `assert mc_correct(0.3, 5) and not mc_correct(0.15, 5) and mc_correct(0.35, 3) and not mc_correct(0.45, 2)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>prob_all_zero(acc, n)</C>, <C>min_items(acc, conf)</C> and <C>pass_until_estimate(attempts)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def prob_all_zero(acc, n):
    return 1 - acc

def min_items(acc, conf):
    return round(1 / acc)

def pass_until_estimate(attempts):
    return 1 / max(attempts)
`,
        solution: RESOLUTION,
        tests: [
          { name: "zero", code: `assert abs(prob_all_zero(0.1, 2) - 0.81) < 1e-12 and min_items(0.2, 0.5) == 4 and min_items(0.01, 0.99) == 459` },
          { name: "until", code: `assert abs(pass_until_estimate([2, 2, 4]) - 0.375) < 1e-12 and abs(pass_until_estimate([10, 30]) - 0.05) < 1e-12` },
        ],
      },
    },
    {
      key: "items",
      rung: "stretch",
      prompt: (
        <p>
          A model solves a task with probability 0.001 per independent item. How many items must a benchmark have for the chance of
          at least one correct answer to be at least 95%?
        </p>
      ),
      answer: { kind: "numeric", value: 2995, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        That completes the tools for watching a run. The next module turns to the end of pretraining: what changes when the
        learning rate decays on carefully chosen data, and how the context window is stretched after the main run.
      </p>
    </>
  ),
};
