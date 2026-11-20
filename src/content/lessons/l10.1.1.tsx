import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TestInformationViz } from "@/components/viz/TestInformationViz";
import type { LessonContent } from "@/lib/types";

const IRT = `import math

def irt_prob(theta, a, b):
    return 1 / (1 + math.exp(-a * (theta - b)))

def item_information(theta, a, b):
    p = irt_prob(theta, a, b)
    return a * a * p * (1 - p)

def expected_score(theta, items):
    return sum(irt_prob(theta, a, b) for a, b in items) / len(items)`;

const ITEMS = `import math

def difficulty(item_correct):
    return sum(item_correct) / len(item_correct)

def point_biserial(item_correct, total_scores):
    n = len(item_correct)
    mx, my = sum(item_correct) / n, sum(total_scores) / n
    cov = sum((x - mx) * (y - my) for x, y in zip(item_correct, total_scores)) / n
    sx = math.sqrt(sum((x - mx) ** 2 for x in item_correct) / n)
    sy = math.sqrt(sum((y - my) ** 2 for y in total_scores) / n)
    return cov / (sx * sy)

def spearman_brown(r, k):
    return k * r / (1 + (k - 1) * r)`;

export const lesson: LessonContent = {
  id: "l10.1.1",
  minutes: 50,
  links: {
    requires: ["l1.3.1", "m7.5.2"],
    revisits: ["m9.3.3", "l8.4.5"],
    foreshadows: ["l10.1.2", "l10.2.1", "l10.1.4"],
  },

  puzzle: (
    <>
      <p>
        MMLU, a 14,000-question exam across 57 subjects, was the standard yardstick for language models for four years. Then a
        careful audit found that several per cent of its questions had wrong answer keys or were ambiguous, a few subjects far
        worse. GPQA, by contrast, has only 448 questions, written by domain PhDs so that skilled non-experts with web access
        score barely above chance. Which is the better benchmark? Size, difficulty, label quality and what the questions
        actually test all matter, and they can be made precise.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A benchmark is a measuring instrument. It is <em>valid</em> if its score reflects the capability it claims to measure, and{" "}
        <em>reliable</em> if it gives similar scores on repeated or parallel measurements. It discriminates between models only
        through questions they find differently hard: an item every model answers correctly, or none does, says nothing about
        which is better. Psychometrics, the science of exams, has tools for all of this, and item response theory in particular
        models each question&apos;s difficulty and how sharply it separates weaker from stronger takers.
      </p>
      <TestInformationViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the two-parameter logistic model">
        <p>
          A model of ability <M>{"\\theta"}</M> answers item j correctly with probability
        </p>
        <MD>{"P_j(\\theta) = \\sigma(a_j(\\theta - b_j))"}</MD>
        <p>
          where <M>{"b_j"}</M> is the item&apos;s difficulty, the ability at which the chance is one half, and <M>{"a_j"}</M> its
          discrimination, how steeply the chance rises (<C>irt_prob</C>). The expected benchmark score is the mean of{" "}
          <M>{"P_j(\\theta)"}</M> over items (<C>expected_score</C>). Fitted to many models&apos; answers, this is logistic regression with
          an unknown ability per model and unknown parameters per item.
        </p>
      </Definition>

      <Theorem title="item information">
        <p>
          The Fisher information an item&apos;s outcome carries about <M>{"\\theta"}</M> is{" "}
          <M>{"I_j(\\theta) = a_j^2 P_j(\\theta)(1 - P_j(\\theta))"}</M>, largest at <M>{"\\theta = b_j"}</M> where it equals <M>{"a_j^2/4"}</M>. For
          independent items the informations add, and the maximum-likelihood ability has standard error about{" "}
          <M>{"1/\\sqrt{\\sum_j I_j(\\theta)}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For a Bernoulli outcome y with success probability P, the log-likelihood is <M>{"y\\log P + (1-y)\\log(1-P)"}</M>, whose score in{" "}
          <M>{"\\theta"}</M> is <M>{"(y - P)P'/(P(1-P))"}</M>. Its variance, the Fisher information (m9.3.3), is{" "}
          <M>{"P'^2/(P(1-P))"}</M>. With <M>{"P = \\sigma(a(\\theta - b))"}</M>, <M>{"P' = aP(1-P)"}</M>, giving <M>{"a^2P(1-P)"}</M>, maximised
          where P = 1/2. Information is additive over independent observations, and the asymptotic variance of the maximum-likelihood
          estimate is its inverse (<C>item_information</C>).
        </p>
        <Code>{IRT}</Code>
      </Proof>

      <Definition title="classical item statistics">
        <p>
          Without fitting a model, an item&apos;s difficulty is the share of takers who get it right (<C>difficulty</C>), and its
          discrimination is the correlation between getting it right and the total score, the point-biserial correlation
          (<C>point_biserial</C>). An item with negative discrimination, which strong models fail more often than weak ones, usually has
          a wrong key or an ambiguous question. Reliability grows with the number of items: if a test has reliability r, one k times as
          long made of similar items has reliability <M>{"kr/(1 + (k-1)r)"}</M>, the Spearman–Brown formula (<C>spearman_brown</C>).
        </p>
        <Code>{ITEMS}</Code>
      </Definition>

      <Remark title="design principles">
        <p>
          Good benchmarks have answers that can be graded cheaply and unambiguously; items reviewed by several experts; difficulty
          spread around the abilities of the models to be compared, with headroom above the best; a private held-out portion
          (l10.1.3); and a clear statement of what capability the score stands for. Validity is the hardest part: a coding benchmark of
          short self-contained functions may not predict usefulness on large codebases. IRT also allows tiny benchmarks: Polo et al.
          (2024) estimated full-benchmark scores from about 100 well-chosen items.
        </p>
      </Remark>

      <Example title="information in practice">
        <p>
          An item with discrimination 2 placed exactly at a model&apos;s ability gives information 1. An item the model gets right 99% of
          the time gives <M>{"4 \\times 0.99 \\times 0.01 \\approx 0.04"}</M>, a twenty-fifth as much: such items cost evaluation time and say
          almost nothing about that model.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "p",
      rung: "check",
      prompt: (
        <p>
          An item has discrimination 1.5 and difficulty 0.5. What is the probability that a model of ability 1.2 answers it correctly?
          Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.741, tolerance: 0.001 },
    },
    {
      key: "sb",
      rung: "check",
      prompt: (
        <p>
          A 100-item benchmark has reliability 0.6. What reliability does the Spearman–Brown formula predict for 400 similar items?
          Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.857, tolerance: 0.001 },
    },
    {
      key: "neg",
      rung: "apply",
      prompt: <p>An item has a clearly negative point-biserial correlation across 40 models. What is the most likely explanation?</p>,
      answer: {
        kind: "choice",
        options: [
          "The answer key is wrong or the question is ambiguous, so stronger models, which give the defensible answer, are marked wrong",
          "The item is simply very hard",
          "The item is simply very easy",
          "Negative correlation means the item is highly discriminating",
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

def irt_prob(theta, a, b):
    return 1 / (1 + math.exp(-a * (theta - b)))

def item_information(theta, a, b):
    p = irt_prob(theta, a, b)
    return a * a * p * (1 - p)

def expected_score(theta, items):
    return sum(irt_prob(theta, a, b) for a, b in items) / len(items)

print(irt_prob(0.0, 1.0, 0.0), round(irt_prob(2.0, 1.0, 0.0), 3), item_information(0.0, 2.0, 0.0))
print(round(expected_score(0.0, [(1.0, 0.0), (1.0, 100.0)]), 3), round(item_information(5.0, 1.0, 5.0), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.881 1.0\n0.25 0.25",
          "0.5 0.881 4.0\n0.25 0.25",
          "0.5 0.119 1.0\n0.25 0.25",
          "0.5 0.881 1.0\n0.5 0.25",
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

def difficulty(item_correct):
    return sum(item_correct) / len(item_correct)

def point_biserial(item_correct, total_scores):
    n = len(item_correct)
    mx, my = sum(item_correct) / n, sum(total_scores) / n
    cov = sum((x - mx) * (y - my) for x, y in zip(item_correct, total_scores)) / n
    sx = math.sqrt(sum((x - mx) ** 2 for x in item_correct) / n)
    sy = math.sqrt(sum((y - my) ** 2 for y in total_scores) / n)
    return cov / (sx * sy)

def spearman_brown(r, k):
    return k * r / (1 + (k - 1) * r)

print(difficulty([1, 0, 1, 1]), round(spearman_brown(0.5, 2), 3))
print(round(point_biserial([1, 1, 0, 0], [9, 7, 3, 1]), 3), spearman_brown(1.0, 10))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.75 0.667\n0.949 1.0",
          "0.75 1.0\n0.949 1.0",
          "0.25 0.667\n0.949 1.0",
          "0.75 0.667\n0.949 10.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>irt_prob(theta, a, b)</C>, <C>item_information(theta, a, b)</C> and <C>expected_score(theta, items)</C> for a list of (a, b)
          pairs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def irt_prob(theta, a, b):
    return 1 / (1 + math.exp(-(theta - b)))

def item_information(theta, a, b):
    return a * a / 4

def expected_score(theta, items):
    return irt_prob(theta, *items[0])
`,
        solution: IRT,
        tests: [
          { name: "prob", code: `assert abs(irt_prob(1.0, 2.0, 0.5) - 1 / (1 + math.exp(-1))) < 1e-12 and abs(item_information(1.0, 2.0, 0.5) - 4 * math.exp(-1) / (1 + math.exp(-1)) ** 2) < 1e-12` },
          { name: "score", code: `assert abs(expected_score(0.0, [(1.0, 0.0), (3.0, 0.0), (1.0, math.log(3))]) - (0.5 + 0.5 + 0.25) / 3) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>difficulty(item_correct)</C>, <C>point_biserial(item_correct, total_scores)</C> using population standard deviations, and{" "}
          <C>spearman_brown(r, k)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def difficulty(item_correct):
    return 1 - sum(item_correct) / len(item_correct)

def point_biserial(item_correct, total_scores):
    return 0.0

def spearman_brown(r, k):
    return k * r
`,
        solution: ITEMS,
        tests: [
          { name: "diff", code: `assert difficulty([0, 0, 1, 0]) == 0.25 and abs(spearman_brown(0.25, 3) - 0.5) < 1e-12` },
          { name: "pb", code: `assert abs(point_biserial([1, 0, 1, 0], [4, 2, 4, 2]) - 1.0) < 1e-12 and abs(point_biserial([0, 1, 0, 1], [4, 2, 4, 2]) + 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "se",
      rung: "stretch",
      prompt: (
        <p>
          A benchmark has 50 items, each with discrimination 1.2 and difficulty exactly equal to a model&apos;s ability. What is the
          approximate standard error of that model&apos;s estimated ability? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.236, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Items matched to today&apos;s models stop discriminating as models improve. The next lesson looks at how fast benchmarks
        saturate and what that does to the scores reported on them.
      </p>
    </>
  ),
};
