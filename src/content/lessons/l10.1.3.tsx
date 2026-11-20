import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MinKProbViz } from "@/components/viz/MinKProbViz";
import type { LessonContent } from "@/lib/types";

const OVERLAP = `def ngrams(tokens, n):
    return {tuple(tokens[i:i + n]) for i in range(len(tokens) - n + 1)}

def overlap_fraction(test_tokens, train_ngrams, n):
    grams = [tuple(test_tokens[i:i + n]) for i in range(len(test_tokens) - n + 1)]
    if not grams:
        return 0.0
    return sum(g in train_ngrams for g in grams) / len(grams)

def is_contaminated(test_tokens, train_ngrams, n, threshold):
    return overlap_fraction(test_tokens, train_ngrams, n) >= threshold`;

const DETECT = `def min_k_prob(token_logps, k):
    m = max(1, int(len(token_logps) * k))
    return sum(sorted(token_logps)[:m]) / m

def split_by_date(items, cutoff):
    before = [i for i, d in items if d < cutoff]
    after = [i for i, d in items if d >= cutoff]
    return before, after

def dirty_clean_effect(scores, dirty):
    d = [s for s, x in zip(scores, dirty) if x]
    c = [s for s, x in zip(scores, dirty) if not x]
    return sum(d) / len(d) - sum(c) / len(c)`;

export const lesson: LessonContent = {
  id: "l10.1.3",
  minutes: 50,
  links: {
    requires: ["l10.1.2", "l4.3.1"],
    revisits: ["l8.1.2", "l1.3.4", "l5.6.3"],
    foreshadows: ["l10.1.4", "l10.6.1", "e11.4.1"],
  },

  puzzle: (
    <>
      <p>
        Pretraining corpora are scraped from the web, and benchmarks live on the web: in papers, repositories, forum posts and
        solution blogs. When the test questions, or their answers, end up in the training data, a high score may measure recall
        rather than ability. Scale AI wrote GSM1k, a fresh set of grade-school maths problems matched in style and difficulty to
        GSM8K, and found some models scoring several points lower on it than on the original, while the strongest models showed
        little or no drop. How is contamination detected, and how much does it matter?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        There are three kinds of evidence. Direct: search the training data for the test items, usually by matching long runs of
        tokens. Behavioural: compare the model on the original items with fresh items of the same kind, written later or rephrased;
        a gap points to memorisation. Statistical: a model is unusually confident on text it was trained on, so its probabilities
        can hint at membership. The first needs access to the data; the others work with only the model, and are weaker.
      </p>
      <MinKProbViz />
    </>
  ),

  theory: (
    <>
      <Definition title="n-gram overlap">
        <p>
          The set of n-grams of a token sequence is the set of its windows of n consecutive tokens (<C>ngrams</C>). A test item&apos;s
          overlap is the share of its n-grams found in the training data&apos;s n-gram set (<C>overlap_fraction</C>), and an item is flagged
          dirty above a threshold (<C>is_contaminated</C>). GPT-3 used 13-grams; Llama 2 measured overlapping token spans. Exact
          matching misses paraphrases, translations and reformatted copies, and long-n matching flags only near-verbatim copies, so
          these are lower bounds on exposure.
        </p>
        <Code>{OVERLAP}</Code>
      </Definition>

      <Theorem title="the clean-subset estimate">
        <p>
          If a fraction f of items is dirty, with accuracy <M>{"a_d"}</M>, and the overall accuracy is a, the clean subset&apos;s accuracy is{" "}
          <M>{"a_c = (a - f a_d)/(1 - f)"}</M>, and <M>{"a_d - a_c"}</M> estimates the effect of contamination provided dirty and clean items
          are equally hard.
        </p>
      </Theorem>
      <Proof>
        <p>
          Overall accuracy is the item-weighted mean <M>{"a = f a_d + (1-f)a_c"}</M>; solve for <M>{"a_c"}</M>. The difference{" "}
          <M>{"a_d - a_c"}</M> mixes two things: the benefit of having seen the items, and any difference in difficulty between the
          subsets. Popular, easy items are more likely to be copied around the web, so dirty items tend to be easier, and the raw
          difference overstates contamination unless difficulty is controlled (<C>dirty_clean_effect</C>).
        </p>
      </Proof>

      <Definition title="detection from the model alone">
        <p>
          Min-K% Prob (Shi et al., 2023) scores a text by the mean of its lowest k% token log-probabilities (<C>min_k_prob</C>); a
          high score suggests the text was seen. Time-split evaluation compares items published before and after the training cutoff
          (<C>split_by_date</C>): LiveCodeBench found some models&apos; scores on competitive programming problems fell sharply for problems
          released after their cutoff. Canary strings, unique identifiers embedded in benchmark files, let data builders filter them
          and let anyone test whether a model has memorised them.
        </p>
        <Code>{DETECT}</Code>
      </Definition>

      <Remark title="prevention">
        <p>
          Keep a private held-out test set and release only part; refresh items after each model generation; decontaminate training
          data against all known benchmarks before training, at the n-gram and the semantic level (e11.4.1); and report scores on both
          the full set and the clean subset. Contamination also enters indirectly, through synthetic data from models that saw the
          benchmark and through fine-tuning on data built to resemble it.
        </p>
      </Remark>

      <Example title="reading a contamination report">
        <p>
          A model scores 70% on a benchmark; 20% of items are flagged dirty and it scores 85% on them. The clean accuracy is
          (0.70 − 0.2 × 0.85)/0.8 = 66.25%, a gap of almost 19 points. Before blaming contamination, check whether the flagged items are
          easier, for example by comparing another model trained without them.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "overlap",
      rung: "check",
      prompt: (
        <p>
          A 40-token test question is checked for 13-gram overlap. Nine of its 13-grams appear in the training data. What is its overlap
          fraction? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.321, tolerance: 0.001 },
    },
    {
      key: "mink",
      rung: "check",
      prompt: (
        <p>
          A ten-token text has log-probabilities −0.1, −0.2, −3.0, −0.5, −4.2, −0.05, −1.0, −2.4, −0.3 and −0.6. What is its Min-20% Prob
          score? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: -3.6, tolerance: 0.001 },
    },
    {
      key: "gap",
      rung: "apply",
      prompt: (
        <p>
          A model scores 12 points lower on newly written problems matched to an old benchmark than on the benchmark itself, while
          other models of similar overall ability show no gap. What is the best supported conclusion?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The model has probably seen the old benchmark or close copies of it, so its score there overstates its ability",
          "The new problems are harder for every model",
          "The model is better at old problems because they are more natural",
          "Benchmarks always lose 12 points when rewritten",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ngrams(tokens, n):
    return {tuple(tokens[i:i + n]) for i in range(len(tokens) - n + 1)}

def overlap_fraction(test_tokens, train_ngrams, n):
    grams = [tuple(test_tokens[i:i + n]) for i in range(len(test_tokens) - n + 1)]
    if not grams:
        return 0.0
    return sum(g in train_ngrams for g in grams) / len(grams)

def is_contaminated(test_tokens, train_ngrams, n, threshold):
    return overlap_fraction(test_tokens, train_ngrams, n) >= threshold

print(sorted(ngrams([1, 2, 1, 2], 2)), overlap_fraction([1, 2, 3], {(1, 2)}, 2))
print(overlap_fraction([1], {(1,)}, 2), is_contaminated([5, 6, 7], {(5, 6), (6, 7)}, 2, 0.8))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(1, 2), (2, 1)] 0.5\n0.0 True",
          "[(1, 2), (2, 1), (1, 2)] 0.5\n0.0 True",
          "[(1, 2), (2, 1)] 0.333\n0.0 True",
          "[(1, 2), (2, 1)] 0.5\n1.0 True",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def min_k_prob(token_logps, k):
    m = max(1, int(len(token_logps) * k))
    return sum(sorted(token_logps)[:m]) / m

def split_by_date(items, cutoff):
    before = [i for i, d in items if d < cutoff]
    after = [i for i, d in items if d >= cutoff]
    return before, after

def dirty_clean_effect(scores, dirty):
    d = [s for s, x in zip(scores, dirty) if x]
    c = [s for s, x in zip(scores, dirty) if not x]
    return sum(d) / len(d) - sum(c) / len(c)

print(min_k_prob([-1.0, -4.0, -2.0, -0.5], 0.5), min_k_prob([-3.0], 0.1))
print(split_by_date([("a", "2024-05-01"), ("b", "2023-12-31")], "2024-01-01"), dirty_clean_effect([1, 1, 0, 1], [True, False, False, True]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-3.0 -3.0\n(['b'], ['a']) 0.5",
          "-4.0 -3.0\n(['b'], ['a']) 0.5",
          "-3.0 -3.0\n(['a'], ['b']) 0.5",
          "-3.0 -3.0\n(['b'], ['a']) -0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ngrams(tokens, n)</C>, returning a set of tuples, <C>overlap_fraction(test_tokens, train_ngrams, n)</C>, counting every
          window of the test item and returning 0.0 when it has none, and <C>is_contaminated(test_tokens, train_ngrams, n, threshold)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ngrams(tokens, n):
    return set(tokens)

def overlap_fraction(test_tokens, train_ngrams, n):
    return 0.0

def is_contaminated(test_tokens, train_ngrams, n, threshold):
    return False
`,
        solution: OVERLAP,
        tests: [
          { name: "grams", code: `assert ngrams("abcab", 2) == {("a", "b"), ("b", "c"), ("c", "a")} and ngrams([1, 2], 3) == set()` },
          { name: "overlap", code: `train = ngrams([1, 2, 3, 4], 2)\nassert overlap_fraction([1, 2, 1, 2, 9], train, 2) == 0.5 and is_contaminated([2, 3, 4], train, 2, 1.0) and not is_contaminated([4, 3], train, 2, 0.1)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>min_k_prob(token_logps, k)</C>, averaging at least one of the lowest values, <C>split_by_date(items, cutoff)</C> for
          (id, ISO date) pairs with items on the cutoff date counted after it, and <C>dirty_clean_effect(scores, dirty)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def min_k_prob(token_logps, k):
    return sum(token_logps) / len(token_logps)

def split_by_date(items, cutoff):
    return [i for i, d in items], []

def dirty_clean_effect(scores, dirty):
    return 0.0
`,
        solution: DETECT,
        tests: [
          { name: "mink", code: `assert min_k_prob([-1.0, -5.0, -3.0, 0.0, -2.0], 0.4) == -4.0 and min_k_prob([-1.0, -2.0], 0.0) == -2.0` },
          { name: "split", code: `assert split_by_date([("x", "2025-01-01"), ("y", "2024-12-31"), ("z", "2025-06-30")], "2025-01-01") == (["y"], ["x", "z"])\nassert abs(dirty_clean_effect([0.9, 0.5, 0.7], [True, False, False]) - 0.3) < 1e-12` },
        ],
      },
    },
    {
      key: "clean",
      rung: "stretch",
      prompt: (
        <p>
          A model scores 78% overall on a benchmark. 30% of the items are flagged as contaminated, and on those it scores 90%. What is
          its accuracy on the clean items? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.729, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Contamination is one way a benchmark score drifts away from what it was meant to measure. The next lesson takes the general
        case: what happens to any measure once it becomes the target of optimisation.
      </p>
    </>
  ),
};
