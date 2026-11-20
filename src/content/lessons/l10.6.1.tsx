import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LongTailViz } from "@/components/viz/LongTailViz";
import type { LessonContent } from "@/lib/types";

const MEMO = `def mem_score(in_runs, out_runs):
    return sum(in_runs) / len(in_runs) - sum(out_runs) / len(out_runs)

def mem_from_subsets(subsets, correct, i):
    inside = [c for s, c in zip(subsets, correct) if i in s]
    outside = [c for s, c in zip(subsets, correct) if i not in s]
    return mem_score(inside, outside)

def top_memorised(scores, threshold):
    return [i for i, s in enumerate(scores) if s >= threshold]`;

const EXTRACT = `import math

def is_extracted(generated, target):
    return generated[:len(target)] == target

def extraction_by_dup(records):
    tot, hit = {}, {}
    for dup, extracted in records:
        tot[dup] = tot.get(dup, 0) + 1
        hit[dup] = hit.get(dup, 0) + (1 if extracted else 0)
    return {d: hit[d] / tot[d] for d in sorted(tot)}

def log_slope(xs, ys):
    lx = [math.log10(x) for x in xs]
    mx, my = sum(lx) / len(lx), sum(ys) / len(ys)
    return sum((a - mx) * (b - my) for a, b in zip(lx, ys)) / sum((a - mx) ** 2 for a in lx)`;

export const lesson: LessonContent = {
  id: "l10.6.1",
  minutes: 50,
  links: {
    requires: ["l10.5.3", "l0.1.3"],
    revisits: ["l1.5.1", "e11.4.1", "l10.1.3"],
    foreshadows: ["l10.6.2", "l10.6.3", "l11.1.1"],
  },

  puzzle: (
    <>
      <p>
        Zhang et al. (2017) trained standard image classifiers on CIFAR-10 with the labels replaced by random ones. The networks still
        reached 100% training accuracy, at chance on test data, of course. The same architectures, on the true labels, generalise well.
        So the networks are capable of pure memorisation, and classical capacity arguments, which bound generalisation by what a
        model class can fit, say nothing useful about them. What, then, decides whether a network memorises or generalises, and is
        memorising always bad?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Networks trained on real data learn shared patterns first, because a pattern that explains many examples reduces the loss on
        all of them at once; isolated examples are fitted later, one by one. Memorisation and generalisation therefore coexist in one
        model. On natural data with a long tail of rare cases, some memorisation is not a failure but a necessity, because a rare case
        seen once in training may appear again at test time.
      </p>
      <LongTailViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a memorisation score">
        <p>
          Feldman (2020) defined the memorisation of training example i by an algorithm as the drop in the chance of predicting its
          label correctly when it is removed from the training set:
        </p>
        <MD>{"\\mathrm{mem}(i) = \\Pr[f_S(x_i) = y_i] - \\Pr[f_{S \\setminus i}(x_i) = y_i],"}</MD>
        <p>
          with probability over the randomness of training (<C>mem_score</C>). Feldman and Zhang (2020) estimated it cheaply: train many
          models on random subsets, and for each example compare the models whose subset contained it with those whose did not
          (<C>mem_from_subsets</C>). Examples with high scores (<C>top_memorised</C>) were mostly atypical, ambiguous or mislabelled, and
          removing them hurt test accuracy on similar rare examples.
        </p>
        <Code>{MEMO}</Code>
      </Definition>

      <Theorem title="memorisation pays on long tails">
        <p>
          Suppose test inputs come from subpopulations with frequencies <M>{"q_j"}</M> and each subpopulation has a single label. A learner
          that labels correctly every subpopulation seen at least once in n training draws, and guesses with accuracy g otherwise, has
          test accuracy <M>{"\\sum_j q_j[1 - (1-g)(1-q_j)^n]"}</M>. Compared with a learner that needs t ≥ 2 examples, it gains{" "}
          <M>{"(1-g)\\sum_j q_j\\,P(1 \\le N_j < t)"}</M>, where <M>{"N_j"}</M> is the training count of subpopulation j.
        </p>
      </Theorem>
      <Proof>
        <p>
          A test input from subpopulation j is answered correctly with probability 1 if j was seen and g if not. The chance that j was
          not seen in n independent draws is <M>{"(1-q_j)^n"}</M>; average over j with weights <M>{"q_j"}</M>. The second learner is wrong
          beyond chance exactly when <M>{"1 \\le N_j < t"}</M>. When frequencies follow a heavy-tailed law, many subpopulations have{" "}
          <M>{"q_j \\approx 1/n"}</M>, so <M>{"P(N_j = 1)"}</M> is substantial for a large share of test mass and the gain is large. The
          figure computes these expressions exactly.
        </p>
      </Proof>

      <Definition title="memorisation in language models">
        <p>
          For a language model, a training string is extractable if, given its prefix, the model reproduces the continuation exactly
          (<C>is_extracted</C>). Carlini et al. (2023) found the extractable fraction grows roughly linearly in the logarithm of model
          size, of the number of times a string is duplicated in the training data, and of the prompt length. Grouping strings by
          duplicate count (<C>extraction_by_dup</C>) and fitting the rate against log count (<C>log_slope</C>) measures the duplication
          effect. Deduplication (e11.4.1) reduces both memorisation and contamination (l10.1.3), and memorised personal data is a privacy
          risk in its own right.
        </p>
        <Code>{EXTRACT}</Code>
      </Definition>

      <Remark title="what decides which happens">
        <p>
          Arpit et al. (2017) found that networks fit real labels faster than random ones and fit easy, typical examples before hard
          ones; regularisation such as dropout slowed the memorisation of noise much more than the learning of patterns. The training
          dynamics, not the capacity of the model class, decide what is learnt first, and early stopping, data augmentation and weight
          decay tilt the balance towards shared structure. The next lessons show training dynamics in which memorisation is later
          replaced by a general rule.
        </p>
      </Remark>

      <Example title="estimating one score">
        <p>
          Of 20 models trained on random halves of the data, 10 contained example i. Of those, 9 classify it correctly; of the 10 that
          did not see it, 4 do. The estimated memorisation is 0.9 − 0.4 = 0.5: the example is predicted correctly mostly because it was
          seen.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "mem",
      rung: "check",
      prompt: (
        <p>
          Ten models trained with an example classify it correctly 9 times; ten models trained without it classify it correctly 3 times.
          What is its estimated memorisation score? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 0.6, tolerance: 0.001 },
    },
    {
      key: "tail",
      rung: "check",
      prompt: (
        <p>
          In a 10-class problem, 20% of test inputs belong to rare kinds seen exactly once in training. A model that memorises those
          single examples gets them right; one that does not guesses at chance on them. How much test accuracy does memorisation add?
          Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.18, tolerance: 0.001 },
    },
    {
      key: "random",
      rung: "apply",
      prompt: (
        <p>
          A network reaches 100% training accuracy on data with random labels. What does this imply about the same network on the true
          labels?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "That its capacity alone cannot explain how well it generalises; something about training on real data favours shared structure",
          "That it will also only memorise the true labels and generalise poorly",
          "That its test accuracy on the true labels will be at chance",
          "That it has too few parameters for the task",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def mem_score(in_runs, out_runs):
    return sum(in_runs) / len(in_runs) - sum(out_runs) / len(out_runs)

def mem_from_subsets(subsets, correct, i):
    inside = [c for s, c in zip(subsets, correct) if i in s]
    outside = [c for s, c in zip(subsets, correct) if i not in s]
    return mem_score(inside, outside)

def top_memorised(scores, threshold):
    return [i for i, s in enumerate(scores) if s >= threshold]

print(mem_score([1, 1, 0, 1], [0, 1]), mem_from_subsets([{0, 1}, {1}, {0}], [1, 0, 1], 0))
print(top_memorised([0.1, 0.9, 0.5, 0.6], 0.5), mem_from_subsets([{0, 1}, {1}, {0}], [1, 0, 1], 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.25 1.0\n[1, 2, 3] -0.5",
          "0.25 0.5\n[1, 2, 3] -0.5",
          "0.25 1.0\n[1, 3] -0.5",
          "0.25 1.0\n[1, 2, 3] 0.5",
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

def is_extracted(generated, target):
    return generated[:len(target)] == target

def extraction_by_dup(records):
    tot, hit = {}, {}
    for dup, extracted in records:
        tot[dup] = tot.get(dup, 0) + 1
        hit[dup] = hit.get(dup, 0) + (1 if extracted else 0)
    return {d: hit[d] / tot[d] for d in sorted(tot)}

def log_slope(xs, ys):
    lx = [math.log10(x) for x in xs]
    mx, my = sum(lx) / len(lx), sum(ys) / len(ys)
    return sum((a - mx) * (b - my) for a, b in zip(lx, ys)) / sum((a - mx) ** 2 for a in lx)

print(is_extracted("abcdef", "abc"), is_extracted("ab", "abc"), extraction_by_dup([(2, True), (1, False), (2, False)]))
print(log_slope([1, 10, 100], [0.0, 0.5, 1.0]), log_slope([1, 100], [0.2, 0.2]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True False {1: 0.0, 2: 0.5}\n0.5 0.0",
          "True True {1: 0.0, 2: 0.5}\n0.5 0.0",
          "True False {2: 0.5, 1: 0.0}\n0.5 0.0",
          "True False {1: 0.0, 2: 0.5}\n0.25 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mem_score(in_runs, out_runs)</C> from lists of 0 or 1 correctness, <C>mem_from_subsets(subsets, correct, i)</C>, where
          run r trained on the set <C>subsets[r]</C> and <C>correct[r]</C> says whether it got example i right, and{" "}
          <C>top_memorised(scores, threshold)</C>, the indices with score at least the threshold.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def mem_score(in_runs, out_runs):
    return 0.0

def mem_from_subsets(subsets, correct, i):
    return 0.0

def top_memorised(scores, threshold):
    return []
`,
        solution: MEMO,
        tests: [
          { name: "score", code: `assert abs(mem_score([1, 0], [0, 0]) - 0.5) < 1e-12 and abs(mem_from_subsets([{0, 2}, {1, 2}, {0, 1}, {2}], [1, 1, 0, 0], 2) - 2 / 3) < 1e-12` },
          { name: "top", code: `assert top_memorised([0.3, 0.7, 0.7], 0.7) == [1, 2] and top_memorised([0.1], 0.5) == []\nassert abs(mem_from_subsets([{0}, {1}], [1, 0], 0) - 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>is_extracted(generated, target)</C>, true when the generation begins with the target,{" "}
          <C>extraction_by_dup(records)</C> for (duplicate count, extracted) pairs, returning rates keyed by count in increasing order,
          and <C>log_slope(xs, ys)</C>, the least-squares slope of y against <M>{"\\log_{10} x"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def is_extracted(generated, target):
    return generated == target

def extraction_by_dup(records):
    return {}

def log_slope(xs, ys):
    return 0.0
`,
        solution: EXTRACT,
        tests: [
          { name: "extract", code: `assert is_extracted("hello world", "hello") and not is_extracted("hel", "hello")\nr = extraction_by_dup([(1, False), (5, True), (5, True), (1, True), (5, False)])\nassert list(r) == [1, 5] and r[1] == 0.5 and abs(r[5] - 2 / 3) < 1e-12` },
          { name: "slope", code: `assert abs(log_slope([10, 1000], [0.1, 0.5]) - 0.2) < 1e-12 and log_slope([1, 100], [0.2, 0.2]) == 0.0` },
        ],
      },
    },
    {
      key: "dup",
      rung: "stretch",
      prompt: (
        <p>
          Strings duplicated 1, 10, 100 and 1,000 times in training are extracted at rates 0.01, 0.05, 0.12 and 0.30. What is the
          least-squares slope of the rate against <M>{"\\log_{10}"}</M> of the duplicate count? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.094, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Memorisation and generalisation can also follow one another in time. The next lesson studies networks that first memorise their
        training set perfectly and then, long afterwards, suddenly generalise.
      </p>
    </>
  ),
};
