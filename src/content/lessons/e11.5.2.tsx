import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BpeStepsViz } from "@/components/viz/BpeStepsViz";
import type { LessonContent } from "@/lib/types";

const TRAIN = `import re
from collections import Counter

PAT = re.compile(r" ?[A-Za-z]+| ?[0-9]+| ?[^\\sA-Za-z0-9]+|\\s+")

def pretokenize(text):
    return Counter(tuple(bytes([b]) for b in w.encode()) for w in PAT.findall(text))   # words as byte tuples

def merge_word(word, pair):
    out, i = [], 0
    while i < len(word):
        if i + 1 < len(word) and (word[i], word[i + 1]) == pair:
            out.append(word[i] + word[i + 1]); i += 2   # left to right, without overlap
        else:
            out.append(word[i]); i += 1
    return tuple(out)

def train_bpe(word_counts, n_merges):
    words, merges = Counter(word_counts), []
    for _ in range(n_merges):
        pairs = Counter()
        for w, c in words.items():
            for p in zip(w, w[1:]):
                pairs[p] += c
        if not pairs:
            break
        best = min(pairs, key=lambda p: (-pairs[p], p))   # most frequent; ties to the smallest pair
        merges.append(best)
        new = Counter()
        for w, c in words.items():
            new[merge_word(w, best)] += c
        words = new
    return merges`;

const ENCODE = `def encode_word(word, ranks):
    parts = [bytes([b]) for b in word]
    while len(parts) > 1:
        pairs = [(ranks.get((a, b), float("inf")), i) for i, (a, b) in enumerate(zip(parts, parts[1:]))]
        r, i = min(pairs)
        if r == float("inf"):
            break                                 # no learned merge applies
        parts[i:i + 2] = [parts[i] + parts[i + 1]]   # apply the earliest-learned merge first
    return parts

def bytes_per_token(words, ranks):
    return sum(len(w) for w in words) / sum(len(encode_word(w, ranks)) for w in words)

def vocab_from(merges):
    return [bytes([i]) for i in range(256)] + [a + b for a, b in merges]`;

export const lesson: LessonContent = {
  id: "e11.5.2",
  minutes: 50,
  links: {
    requires: ["e11.5.1", "l5.1.1"],
    revisits: ["l8.1.1", "e2.3.1"],
    foreshadows: ["e11.5.3", "e11.5.4"],
  },

  puzzle: (
    <>
      <p>
        A team needs its own tokeniser: its corpus is heavy in code and Indian languages, and an off-the-shelf vocabulary splits both
        into many pieces. Byte-pair encoding is simple to state: start from bytes and repeatedly merge the most frequent adjacent pair.
        Run naively on a hundred gigabytes, each of fifty thousand merges rescans the whole corpus. What makes training practical, and
        how is a new string encoded once the merges are learned?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two observations make it fast. Text is first split into words, with spaces attached, and merges never cross word boundaries, so
        the corpus collapses into a table of distinct words and their counts, far smaller than the text. And a merge changes only the
        words that contain the merged pair, so pair counts can be updated incrementally. Encoding a new word replays the merges in the
        order they were learned, which reproduces the training segmentation.
      </p>
      <BpeStepsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="training">
        <p>
          <C>pretokenize</C> splits text into runs of letters, digits, other symbols and whitespace, each with an optional leading
          space, and counts each run as a tuple of single bytes. <C>merge_word</C> replaces non-overlapping occurrences of a pair, left
          to right. <C>train_bpe</C> repeatedly counts adjacent pairs weighted by word counts, records the most frequent, breaking
          ties by the smaller pair, and merges it everywhere.
        </p>
        <Code>{TRAIN}</Code>
      </Definition>

      <Theorem title="what one merge saves">
        <p>
          Merging a pair (a, b) with a ≠ b reduces the corpus&apos;s token count by exactly the pair&apos;s count. If a = b, a run of m
          copies of a contributes m − 1 to the count but saves only <M>{"\\lfloor m/2 \\rfloor"}</M> tokens.
        </p>
      </Theorem>
      <Proof>
        <p>
          With a ≠ b, two occurrences of ab cannot overlap, since an overlap would need b = a, so every occurrence is merged and each
          merge removes one token. In a run of m copies of a, the pairs overlap: left-to-right merging takes positions 1–2, 3–4 and so
          on, <M>{"\\lfloor m/2 \\rfloor"}</M> merges, while the run holds m − 1 adjacent pairs. So BPE greedily maximises the reduction
          at each step, up to such runs; it does not maximise compression over all merges together.
        </p>
      </Proof>

      <Definition title="encoding">
        <p>
          With ranks giving each merge its position in the learned order, <C>encode_word</C> starts from bytes and repeatedly applies the
          lowest-ranked pair present, leftmost first, until no learned pair remains. <C>bytes_per_token</C> measures compression on a list
          of words, and <C>vocab_from</C> lists the 256 byte tokens followed by one token per merge.
        </p>
        <Code>{ENCODE}</Code>
      </Definition>

      <Theorem title="encoding replays training">
        <p>
          On any word, <C>encode_word</C> gives the same tokens as applying the learned merges to it one after another, as training did.
        </p>
      </Theorem>
      <Proof>
        <p>
          A token created by merge k first exists after step k, so every pair containing it has a rank greater than k. Hence once no pair
          of rank at most k remains, none can reappear, and <C>encode_word</C> finishes all applications of merge k before any of
          merge k + 1. Within one rank, taking the leftmost occurrence each time is exactly the left-to-right pass of{" "}
          <C>merge_word</C>.
        </p>
      </Proof>

      <Remark title="training tokenisers in practice">
        <p>
          Production trainers keep, for every pair, its count and the words containing it, so each merge updates only those words, with a
          priority queue (e2.3.1 for the indexes) to find the next best pair. Pre-tokenisation patterns differ: GPT-style patterns treat
          contractions, digits and whitespace specially, and some tokenisers split numbers into single digits. Vocabulary sizes range
          from about 32,000 to over 200,000. Better compression means more text per token and so more text per unit of compute, which
          ties tokenisation to the view of training as compression (l8.1.1); the trade-offs are the next lesson.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Counting distinct words once shrinks a hundred gigabytes to a table of a few million entries, and incremental pair counts make
          each merge cost proportional to the words it touches. Training on a corpus rich in code and Indian languages learns merges for
          their common sequences, and encoding replays those merges on new text.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "pair",
      rung: "check",
      prompt: (
        <p>
          Words and counts: hug 10, pug 5, pun 12, bun 6, hugs 5. What is the count of the most frequent adjacent pair of characters?
        </p>
      ),
      answer: { kind: "numeric", value: 20, tolerance: 0 },
    },
    {
      key: "after",
      rung: "check",
      prompt: <p>In the same corpus, how many tokens are there in total after the first merge?</p>,
      answer: { kind: "numeric", value: 99, tolerance: 0 },
    },
    {
      key: "words",
      rung: "apply",
      prompt: <p>Why does pre-tokenising into words make BPE training much faster?</p>,
      answer: {
        kind: "choice",
        options: [
          "Merges stay inside words, so the corpus reduces to a table of distinct words with counts",
          "It removes rare words from the corpus",
          "Words are always shorter than eight bytes",
          "It allows merges across sentences",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import re
from collections import Counter

PAT = re.compile(r" ?[A-Za-z]+| ?[0-9]+| ?[^\\sA-Za-z0-9]+|\\s+")

def pretokenize(text):
    return Counter(tuple(bytes([b]) for b in w.encode()) for w in PAT.findall(text))   # words as byte tuples

def merge_word(word, pair):
    out, i = [], 0
    while i < len(word):
        if i + 1 < len(word) and (word[i], word[i + 1]) == pair:
            out.append(word[i] + word[i + 1]); i += 2   # left to right, without overlap
        else:
            out.append(word[i]); i += 1
    return tuple(out)

def train_bpe(word_counts, n_merges):
    words, merges = Counter(word_counts), []
    for _ in range(n_merges):
        pairs = Counter()
        for w, c in words.items():
            for p in zip(w, w[1:]):
                pairs[p] += c
        if not pairs:
            break
        best = min(pairs, key=lambda p: (-pairs[p], p))   # most frequent; ties to the smallest pair
        merges.append(best)
        new = Counter()
        for w, c in words.items():
            new[merge_word(w, best)] += c
        words = new
    return merges

wc = pretokenize("low lower lowest low")
print(len(wc), merge_word((b"a", b"a", b"a"), (b"a", b"a")), train_bpe(wc, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4 (b'aa', b'a') [(b'l', b'o'), (b'lo', b'w'), (b' ', b'low')]",
          "3 (b'aa', b'a') [(b'l', b'o'), (b'lo', b'w'), (b' ', b'low')]",
          "4 (b'a', b'aa') [(b'l', b'o'), (b'lo', b'w'), (b' ', b'low')]",
          "4 (b'aa', b'a') [(b'o', b'w'), (b'l', b'ow'), (b' ', b'low')]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def encode_word(word, ranks):
    parts = [bytes([b]) for b in word]
    while len(parts) > 1:
        pairs = [(ranks.get((a, b), float("inf")), i) for i, (a, b) in enumerate(zip(parts, parts[1:]))]
        r, i = min(pairs)
        if r == float("inf"):
            break                                 # no learned merge applies
        parts[i:i + 2] = [parts[i] + parts[i + 1]]   # apply the earliest-learned merge first
    return parts

def bytes_per_token(words, ranks):
    return sum(len(w) for w in words) / sum(len(encode_word(w, ranks)) for w in words)

def vocab_from(merges):
    return [bytes([i]) for i in range(256)] + [a + b for a, b in merges]

ranks = {(b"l", b"o"): 0, (b"lo", b"w"): 1, (b"e", b"r"): 2}
print(encode_word(b"lower", ranks), bytes_per_token([b"low", b"er"], ranks), len(vocab_from([(b"a", b"b")])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[b'low', b'er'] 2.5 257", "[b'lo', b'w', b'er'] 2.5 257", "[b'low', b'er'] 2.0 257", "[b'low', b'er'] 2.5 258"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pretokenize(text)</C>, a Counter of byte tuples using PAT; <C>merge_word(word, pair)</C>; and{" "}
          <C>train_bpe(word_counts, n_merges)</C>, returning the list of merged pairs and stopping early when no pairs remain.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import re
from collections import Counter

PAT = re.compile(r" ?[A-Za-z]+| ?[0-9]+| ?[^\\sA-Za-z0-9]+|\\s+")

def pretokenize(text):
    return Counter()

def merge_word(word, pair):
    return word

def train_bpe(word_counts, n_merges):
    return []
`,
        solution: TRAIN,
        tests: [
          { name: "words", code: `assert pretokenize("Hi, hi 42!") == Counter({(b"H", b"i"): 1, (b",",): 1, (b" ", b"h", b"i"): 1, (b" ", b"4", b"2"): 1, (b"!",): 1})\nassert merge_word((b"a", b"b", b"a", b"b", b"b"), (b"a", b"b")) == (b"ab", b"ab", b"b") and merge_word((b"x",), (b"x", b"x")) == (b"x",)` },
          { name: "train", code: `wc = Counter({(b"a", b"b", b"c"): 3, (b"b", b"c"): 2, (b"a", b"b"): 1})\nassert train_bpe(wc, 5) == [(b"b", b"c"), (b"a", b"bc"), (b"a", b"b")]\nassert train_bpe(Counter({(b"z", b"y"): 1, (b"y", b"x"): 1}), 1) == [(b"y", b"x")]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>encode_word(word, ranks)</C> for a bytes word and a dict from pair to rank, returning a list of bytes tokens;{" "}
          <C>bytes_per_token(words, ranks)</C>; and <C>vocab_from(merges)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def encode_word(word, ranks):
    return [bytes([b]) for b in word]

def bytes_per_token(words, ranks):
    return 1.0

def vocab_from(merges):
    return []
`,
        solution: ENCODE,
        tests: [
          { name: "encode", code: `r = {(b"b", b"c"): 0, (b"a", b"bc"): 1, (b"a", b"b"): 2}\nassert encode_word(b"abcab", r) == [b"abc", b"ab"] and encode_word(b"", r) == [] and encode_word(b"xy", r) == [b"x", b"y"]\nassert encode_word(b"aaaa", {(b"a", b"a"): 0, (b"aa", b"aa"): 1}) == [b"aaaa"]` },
          { name: "vocab", code: `assert bytes_per_token([b"abc", b"zz"], {(b"b", b"c"): 0}) == 5 / 4\nv = vocab_from([(b"a", b"b"), (b"ab", b"c")])\nassert len(v) == 258 and v[97] == b"a" and v[-1] == b"abc"` },
        ],
      },
    },
    {
      key: "run",
      rung: "stretch",
      prompt: (
        <p>
          A corpus holds the word aaaaaaaaa, nine copies of a, with count 3. The first merge is (a, a). How many tokens does the corpus
          hold after it?
        </p>
      ),
      answer: { kind: "numeric", value: 15, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        A tokeniser&apos;s vocabulary size, pre-tokenisation and training data decide how many tokens each language and domain costs, and
        what the model can see inside a token. The next lesson weighs those trade-offs.
      </p>
    </>
  ),
};
