import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { HarnessSpreadViz } from "@/components/viz/HarnessSpreadViz";
import type { LessonContent } from "@/lib/types";

const SCORE = `import math

def pick_choice(logprobs, lengths, normalise):
    scores = [lp / n if normalise else lp for lp, n in zip(logprobs, lengths)]
    return max(range(len(scores)), key=lambda i: scores[i])   # the first index wins ties

def accuracy_se(correct):
    n = len(correct)
    p = sum(correct) / n
    return round(p, 4), round(math.sqrt(p * (1 - p) / n), 4)

def exact_match(pred, gold):
    norm = lambda s: " ".join(s.lower().strip().rstrip(".").split())
    return norm(pred) == norm(gold)`;

const PLAN = `import math

def build_prompt(shots, question):
    return "".join(f"Q: {q}\\nA: {a}\\n\\n" for q, a in shots) + f"Q: {question}\\nA:"

def items_needed(p, se):
    return math.ceil(p * (1 - p) / se ** 2)

def min_detectable(p, n, z):
    return round(z * math.sqrt(2 * p * (1 - p) / n), 4)   # smallest gap two independent scores resolve`;

export const lesson: LessonContent = {
  id: "e13.5.1",
  minutes: 40,
  links: {
    requires: ["e13.4.3"],
    revisits: ["e2.1.3", "e11.8.3", "l8.7.3"],
    foreshadows: ["e13.5.2"],
  },

  puzzle: (
    <>
      <p>
        Two teams report the same open model&apos;s score on the same multiple-choice benchmark and get numbers six
        points apart. Neither made an arithmetic error. One put the answer options in the prompt and compared the
        probabilities of the letters; the other compared the probabilities of the full answer texts. Which number is
        right, and what does a training team need so that its own numbers can be compared from week to week?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A benchmark score is not a property of a model alone. It depends on the prompt template, the number and choice
        of few-shot examples, how answers are scored, and how many items there are. An evaluation harness fixes all of
        these in code, versions them, and reports each score with its uncertainty. Its job is not to find the true
        score, which does not exist, but to make every comparison between checkpoints like for like.
      </p>
      <HarnessSpreadViz />
    </>
  ),

  theory: (
    <>
      <Definition title="an evaluation harness">
        <p>
          A task in a harness is a fixed set of items, a prompt template, a deterministic choice of few-shot examples{" "}
          (<C>build_prompt</C>), and a scoring rule. Multiple-choice items are usually scored by the log-probability of
          each answer under the model, either summed or divided by its length in tokens or characters{" "}
          (<C>pick_choice</C>). Generated answers are compared with the reference after a fixed normalisation of case,
          spacing and punctuation (<C>exact_match</C>). Accuracy is reported with its standard error{" "}
          (<C>accuracy_se</C>).
        </p>
        <Code>{SCORE}</Code>
      </Definition>

      <Theorem title="uncertainty of an accuracy">
        <p>
          If n items are drawn independently from a population on which the model is correct with probability p, the
          accuracy has standard error <M>{"\\sqrt{p(1-p)/n}"}</M>. If two checkpoints are scored on the same items, the
          standard error of the difference in accuracy is <M>{"\\sigma_d/\\sqrt{n}"}</M>, where{" "}
          <M>{"\\sigma_d^2"}</M> is the variance of the per-item difference, which is smaller than the sum of the two
          variances whenever the checkpoints tend to get the same items right.
        </p>
      </Theorem>
      <Proof>
        <p>
          Accuracy is the mean of n independent Bernoulli variables with variance <M>{"p(1-p)"}</M>, so its variance is{" "}
          <M>{"p(1-p)/n"}</M>. For two checkpoints, the difference in accuracy is the mean of the per-item differences{" "}
          <M>{"d_i = a_i - b_i"}</M>, each in <M>{"\\{-1, 0, 1\\}"}</M>, so its variance is <M>{"\\sigma_d^2/n"}</M>.
          Since <M>{"\\sigma_d^2 = \\sigma_a^2 + \\sigma_b^2 - 2\\,\\mathrm{Cov}(a, b)"}</M>, positive covariance, which
          is typical for nearby checkpoints, shrinks it. Items agreed on contribute zero difference, so only the items on
          which the checkpoints disagree carry information.
        </p>
      </Proof>

      <Example title="one benchmark, three numbers">
        <p>
          In 2023 the maintainers of a public leaderboard found that three widely used implementations of the same
          multiple-choice benchmark gave the same models noticeably different scores, and even ranked some models
          differently. The implementations differed in the prompt wording, in whether the answer letters or the answer
          texts were scored, and in how the answer was extracted. None was wrong; each measured a slightly different
          thing. A team&apos;s harness should pin one, and the score should never be compared with numbers from another
          harness.
        </p>
      </Example>

      <Remark title="engineering the harness">
        <p>
          Evaluations run on many checkpoints, so the harness is built like production code: greedy decoding or fixed
          seeds, results keyed by checkpoint, task version and harness version, cached so that nothing is recomputed,
          and checked for contamination against the training data (e11.8.3). Plan the size of each task before trusting
          it: the items needed for a target standard error, and the smallest difference between two independent scores
          that a test at a given z can resolve (<C>items_needed</C>, <C>min_detectable</C>). Many small benchmarks
          cannot separate checkpoints a few hundred steps apart, however good the model.
        </p>
        <Code>{PLAN}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ci",
      rung: "check",
      prompt: (
        <p>
          A checkpoint scores 0.62 on a 500-item benchmark. What is the half-width of the 95% normal interval, using
          z = 1.96, to four decimals?
        </p>
      ),
      answer: { kind: "numeric", value: 0.0425, tolerance: 0.005 },
    },
    {
      key: "items",
      rung: "check",
      prompt: (
        <p>
          A task is expected to score about 0.7. How many items are needed for a standard error of at most 0.005?
        </p>
      ),
      answer: { kind: "numeric", value: 8400, tolerance: 0.001 },
    },
    {
      key: "norm",
      rung: "apply",
      prompt: (
        <p>
          Answers to a multiple-choice question differ greatly in length. Why does summing token log-probabilities
          bias the choice?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Every token adds a negative log-probability, so longer answers score lower regardless of correctness",
          "Longer answers always have higher probability",
          "Log-probabilities cannot be added",
          "The sum ignores the prompt",
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

def pick_choice(logprobs, lengths, normalise):
    scores = [lp / n if normalise else lp for lp, n in zip(logprobs, lengths)]
    return max(range(len(scores)), key=lambda i: scores[i])   # the first index wins ties

def accuracy_se(correct):
    n = len(correct)
    p = sum(correct) / n
    return round(p, 4), round(math.sqrt(p * (1 - p) / n), 4)

def exact_match(pred, gold):
    norm = lambda s: " ".join(s.lower().strip().rstrip(".").split())
    return norm(pred) == norm(gold)

print(pick_choice([-4.0, -6.0, -5.0], [2, 6, 2], False), pick_choice([-4.0, -6.0, -5.0], [2, 6, 2], True), accuracy_se([1, 0, 1, 1]))
print(exact_match(" Paris. ", "paris"), exact_match("New  York", "new york city"))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0 1 (0.75, 0.2165)\nTrue False",
          "0 0 (0.75, 0.2165)\nTrue False",
          "0 1 (0.75, 0.1875)\nTrue False",
          "0 1 (0.75, 0.2165)\nFalse False",
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

def build_prompt(shots, question):
    return "".join(f"Q: {q}\\nA: {a}\\n\\n" for q, a in shots) + f"Q: {question}\\nA:"

def items_needed(p, se):
    return math.ceil(p * (1 - p) / se ** 2)

def min_detectable(p, n, z):
    return round(z * math.sqrt(2 * p * (1 - p) / n), 4)   # smallest gap two independent scores resolve

print(build_prompt([("2+2", "4")], "3+3"))
print(items_needed(0.5, 0.01), min_detectable(0.5, 2500, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "Q: 2+2\nA: 4\n\nQ: 3+3\nA:\n2500 0.0283",
          "Q: 2+2\nA: 4\nQ: 3+3\nA:\n2500 0.0283",
          "Q: 2+2\nA: 4\n\nQ: 3+3\nA:\n50 0.0283",
          "Q: 2+2\nA: 4\n\nQ: 3+3\nA:\n2500 0.02",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pick_choice(logprobs, lengths, normalise)</C>, the index of the best answer, dividing each
          log-probability by its length when normalise is true and taking the first on ties;{" "}
          <C>accuracy_se(correct)</C>, accuracy and standard error rounded to four decimals; and{" "}
          <C>exact_match(pred, gold)</C>, comparing after lower-casing, stripping, removing a final full stop and
          collapsing spaces.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def pick_choice(logprobs, lengths, normalise):
    return 0

def accuracy_se(correct):
    return 0.0, 0.0

def exact_match(pred, gold):
    return pred == gold
`,
        solution: SCORE,
        tests: [
          { name: "pick", code: `assert pick_choice([-3.0, -3.0], [1, 1], False) == 0 and pick_choice([-9.0, -4.0, -6.0], [9, 2, 3], True) == 0 and pick_choice([-9.0, -4.0, -6.0], [9, 2, 3], False) == 1` },
          { name: "score", code: `assert accuracy_se([1, 1, 0, 0, 0]) == (0.4, 0.2191) and accuracy_se([1]) == (1.0, 0.0) and exact_match("The  Cat", "the cat.") and not exact_match("cat", "cats")` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>build_prompt(shots, question)</C>, each shot as &quot;Q: q&quot;, a newline, &quot;A: a&quot; and a
          blank line, then &quot;Q: question&quot;, a newline and &quot;A:&quot;; <C>items_needed(p, se)</C>; and{" "}
          <C>min_detectable(p, n, z)</C> for two independent scores, rounded to four decimals.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def build_prompt(shots, question):
    return question

def items_needed(p, se):
    return 0

def min_detectable(p, n, z):
    return 0.0
`,
        solution: PLAN,
        tests: [
          { name: "prompt", code: `assert build_prompt([], "x") == "Q: x\\nA:" and build_prompt([("a", "b"), ("c", "d")], "e") == "Q: a\\nA: b\\n\\nQ: c\\nA: d\\n\\nQ: e\\nA:"` },
          { name: "budget", code: `assert items_needed(0.25, 0.03) == 209 and items_needed(0.4, 0.03) == 267 and min_detectable(0.8, 800, 1.96) == 0.0392` },
        ],
      },
    },
    {
      key: "paired",
      rung: "stretch",
      prompt: (
        <p>
          Two checkpoints are scored on the same 1000 items. The first is right and the second wrong on 70 items, the
          reverse on 50, and they agree on the rest. Using the paired standard error with the population variance of the
          per-item differences, what is the z-statistic for the difference in accuracy?
        </p>
      ),
      answer: { kind: "numeric", value: 1.829, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        A harness scores one checkpoint. The next lesson runs it continuously beside training, and asks what the
        resulting curves can and cannot tell you before the run ends.
      </p>
    </>
  ),
};
