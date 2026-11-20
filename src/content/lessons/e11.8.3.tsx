import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ContaminationViz } from "@/components/viz/ContaminationViz";
import type { LessonContent } from "@/lib/types";

const DETECT = `def ngrams(tokens, n):
    return {tuple(tokens[i:i + n]) for i in range(len(tokens) - n + 1)}

def benchmark_index(items, n):
    index = {}
    for item_id, tokens in items.items():
        for g in ngrams(tokens, n):
            index.setdefault(g, set()).add(item_id)   # n-gram -> benchmark items containing it
    return index

def contaminated(doc_tokens, index, n, min_hits):
    hits = {}
    for g in ngrams(doc_tokens, n):
        for item_id in index.get(g, ()):
            hits[item_id] = hits.get(item_id, 0) + 1
    return sorted(i for i, h in hits.items() if h >= min_hits)`;

const MEASURE = `def overlap_ratio(item_tokens, doc_tokens, n):
    item = [tuple(item_tokens[i:i + n]) for i in range(len(item_tokens) - n + 1)]
    doc = {tuple(doc_tokens[i:i + n]) for i in range(len(doc_tokens) - n + 1)}
    return sum(g in doc for g in item) / len(item)  # share of the item's n-grams found in the document

def remove_spans(tokens, bad, n):
    drop = set()
    for i in range(len(tokens) - n + 1):
        if tuple(tokens[i:i + n]) in bad:
            drop.update(range(i, i + n))            # remove every token covered by a flagged n-gram
    return [t for i, t in enumerate(tokens) if i not in drop]

def clean_vs_dirty(scores, flags):
    clean = [s for s, f in zip(scores, flags) if not f]
    dirty = [s for s, f in zip(scores, flags) if f]
    return sum(clean) / len(clean), sum(dirty) / len(dirty)`;

export const lesson: LessonContent = {
  id: "e11.8.3",
  minutes: 50,
  links: {
    requires: ["e11.4.1", "l10.1.3"],
    revisits: ["e11.4.2", "e11.6.3"],
    foreshadows: ["e11.8.4"],
  },

  puzzle: (
    <>
      <p>
        A new model scores ten points above its predecessor on a well-known mathematics benchmark, but only two points higher on a
        fresh set of similar problems written after its data was collected. Searching the training corpus finds the benchmark&apos;s
        questions on dozens of web pages, some copied exactly, some reformatted, some with the numbers changed. How do you find
        benchmark text in trillions of tokens, remove it, and estimate how much it inflated a score?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Contamination (l10.1.3) is evaluation data present in training data. Detection uses the same tools as deduplication (e11.4.1):
        index every n-gram of every benchmark item, stream the corpus, and flag documents that share enough n-grams with an item.
        Flagged spans, or whole documents, are removed before training. Because exact n-gram matching misses paraphrases and
        translations, teams also report scores separately on items found to be contaminated and on clean items, which bounds the
        effect that remains.
      </p>
      <ContaminationViz />
    </>
  ),

  theory: (
    <>
      <Definition title="finding contamination">
        <p>
          <C>ngrams</C> returns the set of n-token windows. <C>benchmark_index</C> maps each n-gram to the benchmark items that contain
          it. <C>contaminated</C> counts, for one document, the distinct n-grams it shares with each item, and returns the sorted ids of
          items with at least <C>min_hits</C>.
        </p>
        <Code>{DETECT}</Code>
      </Definition>

      <Theorem title="how many edits hide a copy">
        <p>
          An item of L tokens has <M>{"L - n + 1"}</M> n-gram positions. If a copy changes k tokens by substitution, at least{" "}
          <M>{"L - n + 1 - kn"}</M> of those n-grams still occur in the copy.
        </p>
      </Theorem>
      <Proof>
        <p>
          A substituted token at position p lies in the windows starting at <M>{"p - n + 1, \\dots, p"}</M>, at most n of them. Every
          window containing no substituted token appears unchanged in the copy. So at most kn windows are broken, and the rest survive.
          The bound can reach zero once <M>{"k \\ge (L - n + 1)/n"}</M>: roughly one edit every n tokens hides a copy entirely, which is
          why long n-grams such as 13-grams have high precision but miss paraphrased copies, and why some pipelines also use shorter
          n-grams, or embeddings as in semantic deduplication (e11.4.2).
        </p>
      </Proof>

      <Definition title="removing it and measuring the effect">
        <p>
          <C>overlap_ratio</C> is the share of an item&apos;s n-gram positions whose n-gram appears in a document. <C>remove_spans</C>{" "}
          deletes every token covered by a flagged n-gram. <C>clean_vs_dirty</C> returns the mean score on items not flagged and on items
          flagged.
        </p>
        <Code>{MEASURE}</Code>
      </Definition>

      <Theorem title="how contamination shifts a score">
        <p>
          If a fraction c of items are contaminated, and a model&apos;s accuracy is <M>{"a_d"}</M> on those and <M>{"a_c"}</M> on the
          rest, its reported accuracy exceeds the clean accuracy by <M>{"c(a_d - a_c)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The reported accuracy is the item-weighted average <M>{"(1 - c)a_c + c\\,a_d = a_c + c(a_d - a_c)"}</M>. The clean subset
          estimates what the model would score had no item leaked, if contaminated and clean items are equally hard; that assumption
          should be checked, for example by comparing an older model&apos;s accuracy on the two subsets. With few contaminated items,
          the difference is noisy, as in small ablations (e11.6.3).
        </p>
      </Proof>

      <Remark title="decontamination in practice">
        <p>
          Published pipelines have used 13-gram overlap against all evaluation sets, removing any training document or span that shares
          an n-gram with a test item, or flagging items whose n-grams overlap a document beyond a threshold. Very common n-grams are
          excluded from the index, since boilerplate would otherwise flag everything. Model reports then give results on clean and
          contaminated subsets. Benchmarks released after a model&apos;s data cut-off, or held privately, avoid the problem altogether,
          and canary strings placed in benchmark files let anyone check whether a corpus contains them.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The exact copies are found by n-gram matching; the reformatted ones mostly too; those with changed numbers may escape 13-gram
          matching, since every changed number breaks thirteen windows, and need shorter n-grams or embedding similarity. With the
          flagged items known, the gap between clean and contaminated accuracy, scaled by the contaminated share, estimates how much of
          the ten points came from memorisation; the fresh problem set gives an independent check.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "bound",
      rung: "check",
      prompt: (
        <p>
          A benchmark item has 60 tokens. A copy in the training data changes 2 tokens. Using 13-grams, at least how many of the
          item&apos;s 13-gram positions still match?
        </p>
      ),
      answer: { kind: "numeric", value: 22, tolerance: 0 },
    },
    {
      key: "inflation",
      rung: "check",
      prompt: (
        <p>
          20% of a benchmark&apos;s items are contaminated. A model scores 90% on those and 60% on the rest. What is its reported
          accuracy, as a fraction? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.66, tolerance: 0.001 },
    },
    {
      key: "subsets",
      rung: "apply",
      prompt: <p>Why do reports give scores separately on clean and contaminated items?</p>,
      answer: {
        kind: "choice",
        options: [
          "Detection is imperfect and removal may be incomplete, so the gap estimates how much contamination still affects the score",
          "Contaminated items are always easier",
          "Clean items cannot be scored automatically",
          "It removes the need to decontaminate the training data",
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

def benchmark_index(items, n):
    index = {}
    for item_id, tokens in items.items():
        for g in ngrams(tokens, n):
            index.setdefault(g, set()).add(item_id)   # n-gram -> benchmark items containing it
    return index

def contaminated(doc_tokens, index, n, min_hits):
    hits = {}
    for g in ngrams(doc_tokens, n):
        for item_id in index.get(g, ()):
            hits[item_id] = hits.get(item_id, 0) + 1
    return sorted(i for i, h in hits.items() if h >= min_hits)

idx = benchmark_index({"q1": "the cat sat on the mat".split(), "q2": "a dog ran".split()}, 3)
print(len(idx), contaminated("we saw the cat sat on it".split(), idx, 3, 1), contaminated("a dog ran on the mat".split(), idx, 3, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["5 ['q1'] []", "5 ['q1'] ['q1', 'q2']", "4 ['q1'] []", "5 [] []"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def overlap_ratio(item_tokens, doc_tokens, n):
    item = [tuple(item_tokens[i:i + n]) for i in range(len(item_tokens) - n + 1)]
    doc = {tuple(doc_tokens[i:i + n]) for i in range(len(doc_tokens) - n + 1)}
    return sum(g in doc for g in item) / len(item)  # share of the item's n-grams found in the document

def remove_spans(tokens, bad, n):
    drop = set()
    for i in range(len(tokens) - n + 1):
        if tuple(tokens[i:i + n]) in bad:
            drop.update(range(i, i + n))            # remove every token covered by a flagged n-gram
    return [t for i, t in enumerate(tokens) if i not in drop]

def clean_vs_dirty(scores, flags):
    clean = [s for s, f in zip(scores, flags) if not f]
    dirty = [s for s, f in zip(scores, flags) if f]
    return sum(clean) / len(clean), sum(dirty) / len(dirty)

t = "x a b c y a b".split()
print(round(overlap_ratio("a b c d".split(), t, 2), 2), remove_spans(t, {("a", "b")}, 2), clean_vs_dirty([1, 0, 1, 1], [False, False, True, True]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.67 ['x', 'c', 'y'] (0.5, 1.0)",
          "0.67 ['x', 'b', 'c', 'y', 'b'] (0.5, 1.0)",
          "0.5 ['x', 'c', 'y'] (0.5, 1.0)",
          "0.67 ['x', 'c', 'y'] (1.0, 0.5)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ngrams(tokens, n)</C>, returning a set of tuples; <C>benchmark_index(items, n)</C>, where <C>items</C> maps ids to
          token lists; and <C>contaminated(doc_tokens, index, n, min_hits)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ngrams(tokens, n):
    return set()

def benchmark_index(items, n):
    return {}

def contaminated(doc_tokens, index, n, min_hits):
    return []
`,
        solution: DETECT,
        tests: [
          { name: "index", code: `assert ngrams([1, 2, 1, 2], 2) == {(1, 2), (2, 1)} and ngrams([1], 2) == set()\nix = benchmark_index({"a": [1, 2, 3], "b": [2, 3, 4]}, 2)\nassert ix == {(1, 2): {"a"}, (2, 3): {"a", "b"}, (3, 4): {"b"}}` },
          { name: "flag", code: `ix = benchmark_index({"a": [1, 2, 3], "b": [2, 3, 4]}, 2)\nassert contaminated([0, 2, 3, 4], ix, 2, 1) == ["a", "b"] and contaminated([0, 2, 3, 4], ix, 2, 2) == ["b"]\nassert contaminated([2, 3, 2, 3], ix, 2, 2) == []` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>overlap_ratio(item_tokens, doc_tokens, n)</C>, counting the item&apos;s n-gram positions; <C>remove_spans(tokens, bad,
          n)</C>; and <C>clean_vs_dirty(scores, flags)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def overlap_ratio(item_tokens, doc_tokens, n):
    return 0.0

def remove_spans(tokens, bad, n):
    return list(tokens)

def clean_vs_dirty(scores, flags):
    return 0.0, 0.0
`,
        solution: MEASURE,
        tests: [
          { name: "overlap", code: `assert overlap_ratio([1, 1, 1], [1, 1], 2) == 1.0 and overlap_ratio([1, 2, 3, 4, 5], [9, 3, 4], 2) == 0.25\nassert remove_spans([5, 6, 7, 6, 7, 8], {(6, 7)}, 2) == [5, 8] and remove_spans([1, 2], set(), 2) == [1, 2]` },
          { name: "subsets", code: `assert clean_vs_dirty([0.0, 1.0, 1.0, 0.0, 1.0], [True, False, True, False, False]) == (2 / 3, 0.5)` },
        ],
      },
    },
    {
      key: "longest",
      rung: "stretch",
      prompt: (
        <p>
          A 40-token item is copied with 3 substitutions. What is the largest n for which the bound above still guarantees at least one
          matching n-gram?
        </p>
      ),
      answer: { kind: "numeric", value: 10, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every step of this course is a decision about data that someone downstream needs to know about. The final lesson records them:
        data cards that document sources, filters, mixtures, decontamination and known gaps.
      </p>
    </>
  ),
};
