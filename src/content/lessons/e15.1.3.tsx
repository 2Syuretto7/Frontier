import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EvalPowerViz } from "@/components/viz/EvalPowerViz";
import type { LessonContent } from "@/lib/types";

const STATS = `import math

def stderr(p, n):
    return math.sqrt(p * (1 - p) / n)

def n_needed(p1, p2, z=2.8):
    # z = 1.96 + 0.84: a two-sided 5% test with 80% power
    return math.ceil(z ** 2 * (p1 * (1 - p1) + p2 * (1 - p2)) / (p2 - p1) ** 2)

def above_chance(acc, chance, n, z=2):
    return acc - chance > z * stderr(chance, n)            # noise is measured at chance, the null`;

const DECON = `def ngrams(tokens, n):
    return {tuple(tokens[i:i + n]) for i in range(len(tokens) - n + 1)}

def contaminated(example, train, n, frac):
    grams = ngrams(example, n)
    if not grams:
        return False                                       # too short to judge
    return len(grams & train) / len(grams) > frac

def decontaminate(examples, docs, n, frac):
    train = set().union(*(ngrams(d, n) for d in docs))
    keep = [e for e in examples if not contaminated(e, train, n, frac)]
    return keep, 1 - len(keep) / len(examples)`;

export const lesson: LessonContent = {
  id: "e15.1.3",
  minutes: 40,
  links: {
    requires: ["e15.1.2"],
    revisits: ["e13.5.1", "e13.5.2", "l8.4.5", "l8.6.3"],
    foreshadows: ["e15.5.2"],
  },

  puzzle: (
    <>
      <p>
        A 200-million-parameter model scores 26% on a four-choice benchmark where guessing gives 25%. A new data mixture
        raises it to 27.5%. Is that progress? On a benchmark of 500 questions, the answer is that nobody can tell. Worse,
        if the benchmark&apos;s questions leaked into the training corpus, a higher score may only mean the model has
        seen the answers. Which evaluations can a small model&apos;s plan rely on, and how many questions do they need?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An evaluation plan names, before training, the tasks the model will be judged on, the size each needs to detect
        the differences that matter, and the thresholds that count as success. It prefers tasks where a small model is
        clearly above chance, so that changes register: loss on held-out text, cloze-style multiple choice scored by
        likelihood, simple arithmetic. It removes from the test sets anything that overlaps the training data. And it is
        written down first, so that the results cannot choose the questions.
      </p>
      <EvalPowerViz />
    </>
  ),

  theory: (
    <>
      <Definition title="measurement noise">
        <p>
          An accuracy p measured on n independent items has standard error <M>{"\\sqrt{p(1-p)/n}"}</M> (<C>stderr</C>).
          A score is credibly above chance c only if it exceeds c by a few standard errors computed at c, the value it
          would have if the model were guessing (<C>above_chance</C>). For a four-choice benchmark of 1000 items, that
          margin at two standard errors is almost three points.
        </p>
      </Definition>

      <Theorem title="items needed to detect a difference">
        <p>
          To detect a true difference between accuracies <M>{"p_1"}</M> and <M>{"p_2"}</M> with a two-sided test at
          level α and power 1 − β, each model needs about
        </p>
        <MD>{"n = \\frac{(z_{1-\\alpha/2} + z_{1-\\beta})^2\\,\\left(p_1(1-p_1) + p_2(1-p_2)\\right)}{(p_2 - p_1)^2}"}</MD>
        <p>
          independent items (<C>n_needed</C>, with 1.96 + 0.84 = 2.8 for 5% and 80%).
        </p>
        <Code>{STATS}</Code>
      </Theorem>
      <Proof>
        <p>
          The observed difference is approximately normal with mean <M>{"\\delta = p_2 - p_1"}</M> and standard
          deviation <M>{"\\sigma = \\sqrt{(p_1(1-p_1) + p_2(1-p_2))/n}"}</M>. The test declares a difference when the
          observed value exceeds <M>{"z_{1-\\alpha/2}\\sigma"}</M>, ignoring the negligible chance of a large difference
          in the wrong direction. This happens with probability 1 − β when{" "}
          <M>{"\\delta - z_{1-\\alpha/2}\\sigma = z_{1-\\beta}\\sigma"}</M>, so{" "}
          <M>{"\\delta = (z_{1-\\alpha/2} + z_{1-\\beta})\\sigma"}</M>. Squaring and solving for n gives the formula.
          When both models answer the same items, their errors are correlated and a paired test needs fewer items, so
          this is a conservative estimate.
        </p>
      </Proof>

      <Definition title="decontamination">
        <p>
          A test item is contaminated if a large fraction of its n-grams (<C>ngrams</C>) occur in the training corpus{" "}
          (<C>contaminated</C>). The plan removes such items and reports the fraction removed (<C>decontaminate</C>).
          Thirteen-token n-grams were the choice in the GPT-3 report, eight in some later ones; shorter n-grams flag
          more innocent overlap, such as common phrases, and longer ones miss paraphrases.
        </p>
        <Code>{DECON}</Code>
      </Definition>

      <Example title="the capstone evaluation suite">
        <p>
          Held-out loss on each part of the corpus, in bits per byte, which is sensitive at every scale and is what the
          ladder fits. Multiple-choice tasks scored by comparing the model&apos;s likelihood of each answer, such as
          HellaSwag, ARC-Easy and PIQA, on which models of this size are clearly above chance. Grade-school arithmetic
          with exact-match scoring after post-training. A small set of held-out prompts for comparing chat behaviour by
          judgement, as in l9.6.3. Each with its size, its decontamination check against the final corpus and its
          threshold, fixed now.
        </p>
      </Example>

      <Remark title="why first">
        <p>
          With many checkpoints, mixtures and tasks, some comparison will look good by chance. Fixing the tasks, sample
          sizes and success criteria in advance keeps the evaluation report of e15.5.2 honest, in the same way that
          the continuous evaluation of e13.5.2 fixes its schedule before the run. Metrics that jump suddenly with scale
          are also less likely to mislead, since l8.6.3 showed that many such jumps come from the scoring rule rather
          than the model.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "items",
      rung: "check",
      prompt: (
        <p>
          How many items per model does the formula of this lesson require to detect an improvement from 30% to 36% at
          the 5% level with 80% power?
        </p>
      ),
      answer: { kind: "numeric", value: 960, tolerance: 0 },
    },
    {
      key: "chance",
      rung: "check",
      prompt: (
        <p>
          On a four-choice benchmark of 1000 items, what accuracy must be exceeded to be two standard errors above
          chance, with the standard error computed at chance? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.2774, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why is held-out loss part of the plan even though it is not a task anyone cares about directly?</p>,
      answer: {
        kind: "choice",
        options: [
          "It changes smoothly and measurably at every scale, so it can compare small runs that task accuracies cannot separate",
          "It is the only metric that cannot be contaminated",
          "It is identical to downstream accuracy",
          "It needs no held-out data",
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

def stderr(p, n):
    return math.sqrt(p * (1 - p) / n)

def n_needed(p1, p2, z=2.8):
    # z = 1.96 + 0.84: a two-sided 5% test with 80% power
    return math.ceil(z ** 2 * (p1 * (1 - p1) + p2 * (1 - p2)) / (p2 - p1) ** 2)

def above_chance(acc, chance, n, z=2):
    return acc - chance > z * stderr(chance, n)            # noise is measured at chance, the null

print(stderr(0.5, 100), n_needed(0.5, 0.6))
print(above_chance(0.3, 0.25, 200), above_chance(0.3, 0.25, 400))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.05 385\nFalse True", "0.05 384\nFalse True", "0.025 385\nFalse True", "0.05 385\nTrue True"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ngrams(tokens, n):
    return {tuple(tokens[i:i + n]) for i in range(len(tokens) - n + 1)}

def contaminated(example, train, n, frac):
    grams = ngrams(example, n)
    if not grams:
        return False                                       # too short to judge
    return len(grams & train) / len(grams) > frac

def decontaminate(examples, docs, n, frac):
    train = set().union(*(ngrams(d, n) for d in docs))
    keep = [e for e in examples if not contaminated(e, train, n, frac)]
    return keep, 1 - len(keep) / len(examples)

print(sorted(ngrams("abcab", 2)), contaminated("abcd", ngrams("xbcdy", 2), 2, 0.5))
print(decontaminate(["abc", "xyz", "ab"], ["zabq"], 2, 0.4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[('a', 'b'), ('b', 'c'), ('c', 'a')] True\n(['xyz'], 0.6666666666666667)",
          "[('a', 'b'), ('a', 'b'), ('b', 'c'), ('c', 'a')] True\n(['xyz'], 0.6666666666666667)",
          "[('a', 'b'), ('b', 'c'), ('c', 'a')] False\n(['xyz'], 0.6666666666666667)",
          "[('a', 'b'), ('b', 'c'), ('c', 'a')] True\n(['xyz', 'ab'], 0.33333333333333337)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>stderr(p, n)</C>; <C>n_needed(p1, p2, z=2.8)</C>, rounded up; and{" "}
          <C>above_chance(acc, chance, n, z=2)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def stderr(p, n):
    return p / n

def n_needed(p1, p2, z=2.8):
    return 100

def above_chance(acc, chance, n, z=2):
    return acc > chance
`,
        solution: STATS,
        tests: [
          { name: "se", code: `assert abs(stderr(0.2, 400) - 0.02) < 1e-12 and n_needed(0.2, 0.3, 1.5) == 84 and n_needed(0.1, 0.5) == 17` },
          { name: "chance", code: `assert not above_chance(0.55, 0.5, 100) and above_chance(0.55, 0.5, 900) and not above_chance(0.4, 0.5, 10 ** 6)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ngrams(tokens, n)</C>, the set of n-gram tuples; <C>contaminated(example, train, n, frac)</C>, True if
          more than frac of its n-grams are in the set train, and False if it has none; and{" "}
          <C>decontaminate(examples, docs, n, frac)</C>, returning the kept examples and the fraction removed.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ngrams(tokens, n):
    return set()

def contaminated(example, train, n, frac):
    return False

def decontaminate(examples, docs, n, frac):
    return examples, 0.0
`,
        solution: DECON,
        tests: [
          { name: "grams", code: `assert ngrams([1, 2, 3], 3) == {(1, 2, 3)} and ngrams([1, 2], 3) == set() and contaminated([1, 2, 3], {(2, 3)}, 2, 0.4) and not contaminated([1, 2, 3], {(2, 3)}, 2, 0.5)` },
          { name: "filter", code: `kept, f = decontaminate([[1, 2], [3, 4], [5, 6, 7, 8]], [[0, 1, 2], [6, 7]], 2, 0.3); assert kept == [[3, 4]] and abs(f - 2 / 3) < 1e-12 and contaminated([9], {(9,)}, 2, 0) is False` },
        ],
      },
    },
    {
      key: "half",
      rung: "stretch",
      prompt: (
        <p>
          A model is expected to score about 40% on a task. What is the smallest number of items for which the 95%
          interval, 1.96 standard errors either side, is at most one percentage point wide on each side?
        </p>
      ),
      answer: { kind: "numeric", value: 9220, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        The plan is complete: shape, budget and evaluation. The next chapter builds the data the model will learn from,
        starting with the corpus.
      </p>
    </>
  ),
};
