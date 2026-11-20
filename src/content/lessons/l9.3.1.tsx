import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AnnotatorAgreementViz } from "@/components/viz/AnnotatorAgreementViz";
import type { LessonContent } from "@/lib/types";

const PAIRS = `def rank_to_pairs(ranking):
    return [(ranking[i], ranking[j]) for i in range(len(ranking)) for j in range(i + 1, len(ranking))]

def n_pairs(k):
    return k * (k - 1) // 2

def agreement(labels_a, labels_b):
    return sum(a == b for a, b in zip(labels_a, labels_b)) / len(labels_a)`;

const NOISE = `import math

def majority(votes):
    counts = {}
    for v in votes:
        counts[v] = counts.get(v, 0) + 1
    best = max(counts.values())
    winners = [v for v, c in counts.items() if c == best]
    return winners[0] if len(winners) == 1 else None

def flip_rate(agree):
    return (1 - math.sqrt(2 * agree - 1)) / 2

def ceiling_accuracy(agree):
    return 1 - flip_rate(agree)`;

export const lesson: LessonContent = {
  id: "l9.3.1",
  minutes: 40,
  links: {
    requires: ["l9.2.3", "l9.1.1"],
    revisits: ["m9.8.1"],
    foreshadows: ["l9.3.2", "l9.6.2", "l10.3.3"],
  },

  puzzle: (
    <>
      <p>
        Asked to score a response from 1 to 10, two people give a 6 and a 9 for reasons that have nothing to do with the
        response. Asked which of two responses is better, they agree far more often, yet in InstructGPT&apos;s data trained labellers
        still agreed with each other only about 73% of the time. If the people providing the signal disagree a quarter of the
        time, how good can a model trained on their judgements become, and how should the judgements be collected?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Comparisons are easier and more consistent than absolute scores, because each person&apos;s private scale cancels out.
        So preference data is collected as pairs, or as rankings that expand into pairs, along with a prompt. Even so, many
        pairs are close calls, and annotators differ in taste and attention. That noise is not a nuisance to be removed
        entirely: it sets a ceiling on how often any model can agree with a single annotator, and it tells the reward model
        which comparisons are uncertain.
      </p>
      <AnnotatorAgreementViz />
    </>
  ),

  theory: (
    <>
      <Definition title="comparisons from rankings">
        <p>
          A ranking of K responses implies <M>{"K(K-1)/2"}</M> ordered pairs (<C>rank_to_pairs</C>, <C>n_pairs</C>). InstructGPT had labellers rank
          between 4 and 9 responses per prompt, then trained on all implied pairs of a prompt together in one batch element,
          because treating highly correlated pairs as independent examples made the reward model overfit. Agreement between two
          annotators is the fraction of shared items on which they chose the same response (<C>agreement</C>).
        </p>
        <Code>{PAIRS}</Code>
      </Definition>

      <Theorem title="agreement and the ceiling on accuracy">
        <p>
          Suppose each annotator independently reports the truly better response except with probability f &lt; 1/2. Then two
          annotators agree with probability <M>{"a = 1 - 2f(1-f)"}</M>, so <M>{"f = \\tfrac12\\big(1 - \\sqrt{2a - 1}\\big)"}</M>, and a model that always picks the
          truly better response agrees with a single annotator with probability <M>{"1 - f"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          They agree if both are right, probability <M>{"(1-f)^2"}</M>, or both wrong, <M>{"f^2"}</M>; the sum is <M>{"1 - 2f + 2f^2 = 1 - 2f(1-f)"}</M>. Solving{" "}
          <M>{"2f^2 - 2f + (1 - a) = 0"}</M> and taking the root below 1/2 gives the formula (<C>flip_rate</C>). The perfect model is right whenever the
          annotator is, so its measured accuracy is <M>{"1 - f"}</M> (<C>ceiling_accuracy</C>), above the agreement a. Real noise is not
          independent of the item, since close pairs are harder for everyone, so this is a rough guide rather than a bound.
        </p>
      </Proof>

      <Definition title="aggregating labels">
        <p>
          Several annotators per pair can be combined by majority vote (<C>majority</C>), returning no label on ties, which reduces
          label noise when errors are independent. Many datasets instead record one label per pair and accept the noise, since
          more distinct pairs often help more than repeated labels on the same pair.
        </p>
        <Code>{NOISE}</Code>
      </Definition>

      <Remark title="what goes into a preference dataset">
        <p>
          Anthropic&apos;s HH-RLHF data has about 170 thousand comparisons, collected separately for helpfulness and for harmlessness,
          since the two can conflict. Llama 2 collected over a million comparisons with a four-level strength (&quot;significantly
          better&quot; to &quot;negligibly better&quot;) used as a margin in training. UltraFeedback rated four responses from different models to
          each of 64 thousand prompts with a strong model as the judge (l9.6.2). Responses are sampled from current models so that
          comparisons lie where the policy actually is, and refreshed as it improves.
        </p>
      </Remark>

      <Example title="biases annotators bring">
        <p>
          People prefer longer, more confident and better-formatted answers, sometimes over more accurate ones, and favour the
          first or second position slightly. A reward model learns these preferences faithfully, so length and confidence become
          things the policy can exploit later (l9.3.3). Guidelines, attention checks and randomising positions reduce, but do not
          remove, these effects.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "pairs",
      rung: "check",
      prompt: <p>Labellers rank 4 responses for each of 300 prompts and 9 responses for each of 200 prompts. How many pairwise comparisons does this imply?</p>,
      answer: { kind: "numeric", value: 9000, tolerance: 0.5 },
    },
    {
      key: "ceiling",
      rung: "check",
      prompt: (
        <p>
          Two annotators agree on 73% of pairs. Under the independent-flip model, how often does a model that always picks the truly
          better response agree with one annotator? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.839, tolerance: 0.001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why is preference data usually collected as comparisons rather than as absolute scores?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each annotator's personal scale cancels in a comparison, so judgements are more consistent across people and over time",
          "Comparisons need no annotators",
          "Absolute scores cannot be used to train any model",
          "Comparisons always produce perfect agreement",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def rank_to_pairs(ranking):
    return [(ranking[i], ranking[j]) for i in range(len(ranking)) for j in range(i + 1, len(ranking))]

def n_pairs(k):
    return k * (k - 1) // 2

def agreement(labels_a, labels_b):
    return sum(a == b for a, b in zip(labels_a, labels_b)) / len(labels_a)

print(rank_to_pairs(["B", "A", "C"]), n_pairs(5))
print(agreement(["A", "B", "A", "A"], ["A", "A", "A", "B"]), n_pairs(1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[('B', 'A'), ('B', 'C'), ('A', 'C')] 10\n0.5 0",
          "[('A', 'B'), ('A', 'C'), ('B', 'C')] 10\n0.5 0",
          "[('B', 'A'), ('B', 'C'), ('A', 'C')] 20\n0.5 0",
          "[('B', 'A'), ('B', 'C'), ('A', 'C')] 10\n0.75 1",
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

def majority(votes):
    counts = {}
    for v in votes:
        counts[v] = counts.get(v, 0) + 1
    best = max(counts.values())
    winners = [v for v, c in counts.items() if c == best]
    return winners[0] if len(winners) == 1 else None

def flip_rate(agree):
    return (1 - math.sqrt(2 * agree - 1)) / 2

def ceiling_accuracy(agree):
    return 1 - flip_rate(agree)

print(majority(["A", "B", "A"]), majority(["A", "B"]), flip_rate(1.0))
print(round(ceiling_accuracy(0.82), 2), flip_rate(0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "A None 0.0\n0.9 0.5",
          "A A 0.0\n0.9 0.5",
          "A None 0.5\n0.82 0.5",
          "A None 0.0\n0.9 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rank_to_pairs(ranking)</C>, listing (better, worse) pairs in order, <C>n_pairs(k)</C> and <C>agreement(labels_a, labels_b)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def rank_to_pairs(ranking):
    return [(ranking[i], ranking[i + 1]) for i in range(len(ranking) - 1)]

def n_pairs(k):
    return k - 1

def agreement(labels_a, labels_b):
    return 1.0
`,
        solution: PAIRS,
        tests: [
          { name: "pairs", code: `assert rank_to_pairs([3, 1, 2, 0]) == [(3, 1), (3, 2), (3, 0), (1, 2), (1, 0), (2, 0)] and n_pairs(9) == 36 and n_pairs(2) == 1` },
          { name: "agree", code: `assert agreement([0, 1, 1, 0, 1], [0, 1, 0, 0, 0]) == 0.6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>majority(votes)</C>, returning None on a tie for the most votes, <C>flip_rate(agree)</C> and <C>ceiling_accuracy(agree)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def majority(votes):
    return votes[0]

def flip_rate(agree):
    return 1 - agree

def ceiling_accuracy(agree):
    return agree
`,
        solution: NOISE,
        tests: [
          { name: "vote", code: `assert majority(["x", "y", "y", "x", "y"]) == "y" and majority(["x", "y", "z"]) is None and majority(["q"]) == "q"` },
          { name: "flip", code: `assert abs(flip_rate(0.625) - 0.25) < 1e-12 and abs(ceiling_accuracy(0.745) - 0.85) < 1e-12` },
        ],
      },
    },
    {
      key: "majority",
      rung: "stretch",
      prompt: (
        <p>
          Annotators agree with each other on 68% of pairs, and each pair is labelled by three annotators with errors independent
          under the flip model. How often does the majority label pick the truly better response? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.896, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Comparisons are the data. The next lesson turns them into a number for every response, with the model of choice
        that has underpinned ratings from chess to chatbots: Bradley and Terry&apos;s.
      </p>
    </>
  ),
};
