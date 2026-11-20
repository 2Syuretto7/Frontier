import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { NeedleGridViz } from "@/components/viz/NeedleGridViz";
import type { LessonContent } from "@/lib/types";

const RETRIEVAL = `def accuracy_by_length(results):
    totals = {}
    for (length, depth), ok in results.items():
        n, k = totals.get(length, (0, 0))
        totals[length] = (n + 1, k + ok)
    return {length: k / n for length, (n, k) in sorted(totals.items())}

def effective_length(scores, threshold):
    best = 0
    for length in sorted(scores):
        if scores[length] < threshold:
            break
        best = length
    return best

def middle_gap(accs):
    return (accs[0] + accs[-1]) / 2 - min(accs[1:-1])`;

const POSITIONS = `def loss_by_position(seqs, bucket):
    n = len(seqs[0]) // bucket
    out = []
    for b in range(n):
        vals = [x for s in seqs for x in s[b * bucket:(b + 1) * bucket]]
        out.append(sum(vals) / len(vals))
    return out

def context_gain(bucket_losses):
    return bucket_losses[0] - bucket_losses[-1]

def weighted_score(task_scores, weights):
    total = sum(weights[t] for t in task_scores)
    return sum(task_scores[t] * weights[t] for t in task_scores) / total`;

export const lesson: LessonContent = {
  id: "l8.7.3",
  minutes: 45,
  links: {
    requires: ["l8.7.2", "l8.6.3"],
    revisits: ["l8.6.1", "m9.8.1"],
    foreshadows: ["l10.1.1", "l8.8.1"],
  },

  puzzle: (
    <>
      <p>
        Model cards in 2024 often claimed a context of 128 thousand tokens or more. When the RULER benchmark tested those models
        on tasks only slightly harder than finding a single planted sentence, many fell below a modest bar well before their
        advertised length; only about half held up at 32 thousand. The models accepted long inputs. What does it take to show
        that a model actually uses them?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Average loss is a poor guide, because most tokens are predictable from nearby text and the few that need distant context
        barely move the mean. So long-context evaluation asks targeted questions. Can the model find one planted fact at every
        length and depth? Several at once? Can it follow a chain of references, count across the whole input, answer questions
        that need a whole book? Each harder task lowers the length at which the model still works.
      </p>
      <NeedleGridViz />
    </>
  ),

  theory: (
    <>
      <Definition title="needles, grids and effective length">
        <p>
          In a needle-in-a-haystack test a fact is planted at a chosen depth of a long distractor text, and the model is asked
          for it. Results form a grid over length and depth, summarised by the accuracy at each length (<C>accuracy_by_length</C>).
          RULER widens the tests to multiple keys, multiple values, variable tracking across hops, aggregation of frequent words
          and question answering, and defines the effective length as the longest tested length up to which every score stays
          above a threshold, set to Llama 2 7B&apos;s score at 4 thousand tokens (<C>effective_length</C>). Liu and colleagues found that
          accuracy in multi-document question answering is highest when the relevant document is at the start or end and lowest
          in the middle, a gap measured by <C>middle_gap</C>.
        </p>
        <Code>{RETRIEVAL}</Code>
      </Definition>

      <Definition title="loss by position">
        <p>
          Averaging per-token loss over many long documents in buckets of positions (<C>loss_by_position</C>) shows whether later
          tokens benefit from more context: a curve still falling at position t means the model uses what came before t. The
          drop from the first bucket to the last summarises it (<C>context_gain</C>). Benchmark suites then combine task scores with
          weights (<C>weighted_score</C>). The Gemini 1.5 report found that the loss falls as a power law in position up to millions
          of tokens, <M>{"L(t) \\approx L_\\infty + B\\,t^{-\\gamma}"}</M>.
        </p>
        <Code>{POSITIONS}</Code>
      </Definition>

      <Theorem title="averages hide the tail">
        <p>
          If <M>{"L(t) = L_\\infty + B\\,t^{-\\gamma}"}</M> with <M>{"0 < \\gamma < 1"}</M>, then the mean loss over positions 1 to n is approximately{" "}
          <M>{"L_\\infty + \\frac{B}{1-\\gamma}\\,n^{-\\gamma}"}</M>, and the extra improvement from doubling n shrinks by a factor of{" "}
          <M>{"2^{-\\gamma}"}</M> with each doubling.
        </p>
      </Theorem>
      <Proof>
        <p>
          Approximating the sum by an integral, <M>{"\\frac1n\\int_1^n B t^{-\\gamma}\\,dt = \\frac{B}{n(1-\\gamma)}(n^{1-\\gamma} - 1) \\approx \\frac{B}{1-\\gamma}n^{-\\gamma}"}</M>.
          Doubling n multiplies this term by <M>{"2^{-\\gamma}"}</M>, so successive gains form a geometric sequence. With <M>{"\\gamma"}</M> near 0.5, the
          gain from 64 to 128 thousand tokens is a small fraction of that from 1 to 2 thousand, though for the tokens that need
          distant context it is everything.
        </p>
      </Proof>

      <Remark title="synthetic and realistic tests">
        <p>
          Synthetic tests are cheap, controllable and free of contamination, but HELMET found that they predict performance on
          real long-context applications poorly. It combines retrieval-augmented question answering, re-ranking, in-context
          learning with hundreds of examples, question answering over books, summarisation and answering with citations, and
          reports them separately rather than as one number. Llama 3 checked short-context benchmarks after every extension
          stage as well, since long training can quietly damage them.
        </p>
      </Remark>

      <Example title="reading a RULER table">
        <p>
          A model scoring 92 at 8 thousand tokens, 88 at 32 thousand, 80 at 64 thousand and 87 at 128 thousand has an effective
          length of 32 thousand by RULER&apos;s rule with a threshold of 85.6, even though it passes again at 128 thousand: once a
          model fails at some length, longer lengths are not trusted. Non-monotone rows like this one are common and often reflect
          the noise of a small number of samples per cell.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "eff",
      rung: "check",
      prompt: (
        <p>
          A model&apos;s scores at 4, 8, 16, 32, 64 and 128 thousand tokens are 0.95, 0.93, 0.90, 0.84, 0.86 and 0.70. With a threshold of
          0.856 and RULER&apos;s rule, what is its effective length, in thousands of tokens?
        </p>
      ),
      answer: { kind: "numeric", value: 16, tolerance: 0.5 },
    },
    {
      key: "middle",
      rung: "check",
      prompt: <p>Accuracy with the relevant document in positions 1 to 5 of 5 is 0.76, 0.62, 0.55, 0.58 and 0.71. What is the middle gap? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.185, tolerance: 0.001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why is a single needle-in-a-haystack test, passed at every length and depth, weak evidence that a model uses long context well?</p>,
      answer: {
        kind: "choice",
        options: [
          "Finding one distinctive planted sentence needs only matching, not combining or reasoning over information spread across the input, so models that pass it can still fail harder long-context tasks",
          "Needle tests can only be run up to 8 thousand tokens",
          "Passing a needle test proves the model has memorised the haystack",
          "Needle tests measure loss rather than accuracy",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def accuracy_by_length(results):
    totals = {}
    for (length, depth), ok in results.items():
        n, k = totals.get(length, (0, 0))
        totals[length] = (n + 1, k + ok)
    return {length: k / n for length, (n, k) in sorted(totals.items())}

def effective_length(scores, threshold):
    best = 0
    for length in sorted(scores):
        if scores[length] < threshold:
            break
        best = length
    return best

def middle_gap(accs):
    return (accs[0] + accs[-1]) / 2 - min(accs[1:-1])

print(accuracy_by_length({(8, 0): True, (8, 50): False, (4, 0): True, (4, 50): True}))
print(effective_length({4: 0.9, 8: 0.7, 16: 0.95}, 0.8), effective_length({4: 0.5}, 0.8), round(middle_gap([0.8, 0.5, 0.6, 0.9]), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{4: 1.0, 8: 0.5}\n4 0 0.35",
          "{8: 0.5, 4: 1.0}\n4 0 0.35",
          "{4: 1.0, 8: 0.5}\n16 0 0.35",
          "{4: 1.0, 8: 0.5}\n4 4 0.4",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def loss_by_position(seqs, bucket):
    n = len(seqs[0]) // bucket
    out = []
    for b in range(n):
        vals = [x for s in seqs for x in s[b * bucket:(b + 1) * bucket]]
        out.append(sum(vals) / len(vals))
    return out

def context_gain(bucket_losses):
    return bucket_losses[0] - bucket_losses[-1]

def weighted_score(task_scores, weights):
    total = sum(weights[t] for t in task_scores)
    return sum(task_scores[t] * weights[t] for t in task_scores) / total

print(loss_by_position([[4.0, 2.0, 1.0, 1.0], [2.0, 2.0, 1.0, 3.0]], 2), context_gain([3.0, 2.5, 2.25]))
print(weighted_score({"a": 1.0, "b": 0.0}, {"a": 3, "b": 1, "c": 5}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.5, 1.5] 0.75\n0.75",
          "[3.0, 1.0] 0.75\n0.75",
          "[2.5, 1.5] -0.75\n0.75",
          "[2.5, 1.5] 0.75\n0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>accuracy_by_length(results)</C>, which maps a dictionary keyed by (length, depth) to accuracy per length in
          increasing order of length, <C>effective_length(scores, threshold)</C>, returning 0 if the shortest length fails, and{" "}
          <C>middle_gap(accs)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def accuracy_by_length(results):
    return {}

def effective_length(scores, threshold):
    return max(l for l in scores if scores[l] >= threshold)

def middle_gap(accs):
    return max(accs) - min(accs)
`,
        solution: RETRIEVAL,
        tests: [
          { name: "acc", code: `r = {(16, 0): True, (16, 25): True, (16, 50): False, (16, 75): True, (2, 0): False, (2, 50): True}\nassert accuracy_by_length(r) == {2: 0.5, 16: 0.75} and list(accuracy_by_length(r)) == [2, 16]` },
          { name: "eff", code: `assert effective_length({1: 0.9, 2: 0.9, 4: 0.6, 8: 0.95}, 0.8) == 2 and effective_length({2: 0.1, 4: 0.9}, 0.5) == 0\nassert abs(middle_gap([0.9, 0.4, 0.7]) - 0.4) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>loss_by_position(seqs, bucket)</C>, the mean loss in each full bucket of positions across all sequences of equal
          length, <C>context_gain(bucket_losses)</C> and <C>weighted_score(task_scores, weights)</C>, which uses only the weights of
          tasks that were scored.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def loss_by_position(seqs, bucket):
    return [sum(s) / len(s) for s in seqs]

def context_gain(bucket_losses):
    return bucket_losses[-1] - bucket_losses[0]

def weighted_score(task_scores, weights):
    return sum(task_scores.values()) / len(task_scores)
`,
        solution: POSITIONS,
        tests: [
          { name: "pos", code: `out = loss_by_position([[6.0, 4.0, 2.0, 2.0, 1.0, 1.0, 9.0], [4.0, 2.0, 2.0, 4.0, 1.0, 3.0, 9.0]], 2)\nassert out == [4.0, 2.5, 1.5] and context_gain(out) == 2.5` },
          { name: "weighted", code: `assert abs(weighted_score({"x": 0.5, "y": 1.0}, {"x": 1, "y": 3, "z": 10}) - 0.875) < 1e-12` },
        ],
      },
    },
    {
      key: "tail",
      rung: "stretch",
      prompt: (
        <p>
          Suppose the loss at position t is <M>{"1.7 + 3\\,t^{-0.5}"}</M> nats. By how much is the loss at position 131,072 lower than at
          position 65,536? Give the answer in thousandths of a nat, to two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 3.43, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        Full attention makes every one of those long-context tokens cost more than the last. The final module of this course
        looks at architectures that change that: linear attention, state space models, hybrids and sparse attention.
      </p>
    </>
  ),
};
