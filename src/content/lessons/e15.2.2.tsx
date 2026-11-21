import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BpeMergeViz } from "@/components/viz/BpeMergeViz";
import type { LessonContent } from "@/lib/types";

const TRAIN = `from collections import Counter

def pair_counts(words):
    c = Counter()
    for w, f in words.items():
        for p in zip(w, w[1:]):
            c[p] += f                                      # each word counts as often as it occurs
    return c

def merge(word, pair):
    out, i = [], 0
    while i < len(word):
        if word[i:i + 2] == pair:
            out.append(pair[0] + pair[1])
            i += 2
        else:
            out.append(word[i])
            i += 1
    return tuple(out)

def train_bpe(words, n):
    words, merges = {tuple(w): f for w, f in words.items()}, []
    for _ in range(n):
        c = pair_counts(words)
        if not c:
            break
        best = min(c, key=lambda p: (-c[p], p))            # most frequent; ties go to the smallest pair
        merges.append(best)
        words = {merge(w, best): f for w, f in words.items()}
    return merges, words`;

const MEASURE = `def encode(word, merges):
    toks = list(word)
    for a, b in merges:                                    # apply merges in the order they were learned
        i, out = 0, []
        while i < len(toks):
            if i + 1 < len(toks) and toks[i] == a and toks[i + 1] == b:
                out.append(a + b)
                i += 2
            else:
                out.append(toks[i])
                i += 1
        toks = out
    return toks

def bytes_per_token(texts, tokenize):
    return sum(len(t.encode()) for t in texts) / sum(len(tokenize(t)) for t in texts)

def flops_per_byte(V, d, body, bpt):
    return 6 * (body + V * d) / bpt                        # per-token training cost spread over its bytes`;

export const lesson: LessonContent = {
  id: "e15.2.2",
  minutes: 45,
  links: {
    requires: ["e15.2.1"],
    revisits: ["e11.5.2", "e11.5.3", "l8.1.1"],
    foreshadows: ["e15.3.1"],
  },

  puzzle: (
    <>
      <p>
        The corpus is fixed; the tokeniser decides how the model sees it. A 32k vocabulary trained only on English web
        text may spend twice as many tokens on Python as on prose, and four times as many on Hindi, which means fewer
        bytes of those sources fit in the context and each costs more compute. A larger vocabulary shortens sequences
        but adds embedding parameters and output-layer compute to every token. How should the capstone train and size
        its tokeniser?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Train byte-pair encoding on a sample drawn with the same mixture as the corpus, so that every source gets merges
        in proportion to its share. Then measure compression, in bytes per token, on held-out text from each source.
        Choose the vocabulary size by its effect on cost per byte: the per-token cost grows with the vocabulary through
        the embedding and output layers, while the number of tokens per byte shrinks, and the best size balances them.
      </p>
      <BpeMergeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="training BPE">
        <p>
          Start from each word as a sequence of symbols, with its frequency. Count adjacent pairs over the corpus,
          weighting each by its word&apos;s frequency (<C>pair_counts</C>), merge the most frequent pair everywhere it
          occurs (<C>merge</C>), and repeat until the vocabulary reaches its target size (<C>train_bpe</C>), as in
          e11.5.2. Production tokenisers work on bytes rather than characters, so any string can be encoded, and split
          text into words with a regular expression before counting, so that merges never cross spaces or join digits
          with letters.
        </p>
        <Code>{TRAIN}</Code>
      </Definition>

      <Theorem title="what one merge saves">
        <p>
          Merging a pair (a, b) with a ≠ b reduces the total number of tokens in the training corpus by exactly that
          pair&apos;s count. BPE is therefore the greedy algorithm that shortens the training corpus as much as possible
          with each new vocabulary entry.
        </p>
      </Theorem>
      <Proof>
        <p>
          Two occurrences of (a, b) at positions i and i + 1 would require the symbol at i + 1 to be both b and a, which
          is impossible when a ≠ b. So the occurrences do not overlap, the merge replaces every one of them, and each
          replacement turns two tokens into one. The count of the pair is the number of occurrences weighted by word
          frequency, which is therefore the reduction in corpus length. Choosing the most frequent pair maximises the
          reduction at each step, though not necessarily after several steps, since an early merge can break up pairs
          that later merges would have used. When a = b, runs such as aaa contain overlapping occurrences and the
          saving can be smaller than the count.
        </p>
      </Proof>

      <Definition title="measuring a tokeniser">
        <p>
          Encoding applies the learned merges in order (<C>encode</C>). Compression is measured in UTF-8 bytes per token
          on held-out text from each source (<C>bytes_per_token</C>). The vocabulary&apos;s cost is its embedding and
          output layers: with V tokens of width d, each training token costs about <M>{"6(N_{\\text{body}} + Vd)"}</M>{" "}
          FLOPs, so the cost per byte divides that by the bytes per token (<C>flops_per_byte</C>).
        </p>
        <Code>{MEASURE}</Code>
      </Definition>

      <Example title="the capstone vocabulary">
        <p>
          For a model of about 180 million body parameters and width 1024, a byte-level BPE trained on a 2-gigabyte
          sample of the mixture gives roughly 3.9, 4.3, 4.6 and 4.8 bytes per token at vocabularies of 16k, 32k, 64k
          and 128k. Cost per byte is lowest near 32k: below it the sequences are longer, above it the output layer
          grows faster than compression improves. Larger models move the optimum up, because the vocabulary&apos;s
          share of their cost is smaller, which is one reason frontier models use vocabularies of 100k to 250k.
        </p>
      </Example>

      <Remark title="consequences for the rest of the course">
        <p>
          Losses measured in nats per token cannot be compared across tokenisers; bits per byte can, as l8.1.1
          explained, so the ladder and the evaluation report use bits per byte. Digits should be split individually or
          in small groups so that arithmetic is learnable, and special tokens for the chat template of chapter 4 should
          be reserved now, since adding tokens later means resizing the embeddings of a trained model.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "tokens",
      rung: "check",
      prompt: (
        <p>
          Train BPE, ties broken by the smaller pair in string order, on the words low (5 times), lower (2), newest (6)
          and widest (3). After four merges, how many tokens does the corpus contain, counting each word as often as it
          occurs?
        </p>
      ),
      answer: { kind: "numeric", value: 47, tolerance: 0 },
    },
    {
      key: "cost",
      rung: "check",
      prompt: (
        <p>
          A model has 1.8 × 10⁸ body parameters and width 1024. With a 65536-token vocabulary giving 4.6 bytes per token,
          how many million training FLOPs does each byte cost, to one decimal?
        </p>
      ),
      answer: { kind: "numeric", value: 322.3, tolerance: 0.05 },
    },
    {
      key: "mix",
      rung: "apply",
      prompt: <p>Why is the tokeniser trained on a sample drawn with the corpus mixture rather than on web text alone?</p>,
      answer: {
        kind: "choice",
        options: [
          "So that code, mathematics and other sources get merges in proportion to their share and compress well",
          "Because BPE cannot be trained on web text",
          "So that the vocabulary is smaller",
          "Because the mixture contains no duplicates",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from collections import Counter

def pair_counts(words):
    c = Counter()
    for w, f in words.items():
        for p in zip(w, w[1:]):
            c[p] += f                                      # each word counts as often as it occurs
    return c

def merge(word, pair):
    out, i = [], 0
    while i < len(word):
        if word[i:i + 2] == pair:
            out.append(pair[0] + pair[1])
            i += 2
        else:
            out.append(word[i])
            i += 1
    return tuple(out)

def train_bpe(words, n):
    words, merges = {tuple(w): f for w, f in words.items()}, []
    for _ in range(n):
        c = pair_counts(words)
        if not c:
            break
        best = min(c, key=lambda p: (-c[p], p))            # most frequent; ties go to the smallest pair
        merges.append(best)
        words = {merge(w, best): f for w, f in words.items()}
    return merges, words

w = {"aab": 2, "ab": 3}; print(sorted(pair_counts({tuple(k): v for k, v in w.items()}).items()), merge(tuple("abab"), ("a", "b")))
print(train_bpe(w, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(('a', 'a'), 2), (('a', 'b'), 5)] ('ab', 'ab')\n([('a', 'b'), ('a', 'ab')], {('aab',): 2, ('ab',): 3})",
          "[(('a', 'a'), 2), (('a', 'b'), 5)] ('ab', 'ab')\n([('a', 'b'), ('aa', 'b')], {('aab',): 2, ('ab',): 3})",
          "[(('a', 'a'), 1), (('a', 'b'), 2)] ('ab', 'ab')\n([('a', 'b'), ('a', 'ab')], {('aab',): 2, ('ab',): 3})",
          "[(('a', 'a'), 2), (('a', 'b'), 5)] ('ab', 'a', 'b')\n([('a', 'b'), ('a', 'ab')], {('aab',): 2, ('ab',): 3})",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def encode(word, merges):
    toks = list(word)
    for a, b in merges:                                    # apply merges in the order they were learned
        i, out = 0, []
        while i < len(toks):
            if i + 1 < len(toks) and toks[i] == a and toks[i + 1] == b:
                out.append(a + b)
                i += 2
            else:
                out.append(toks[i])
                i += 1
        toks = out
    return toks

def bytes_per_token(texts, tokenize):
    return sum(len(t.encode()) for t in texts) / sum(len(tokenize(t)) for t in texts)

def flops_per_byte(V, d, body, bpt):
    return 6 * (body + V * d) / bpt                        # per-token training cost spread over its bytes

m = [("a", "b"), ("ab", "c")]; print(encode("abcab", m), encode("aabc", m))
print(bytes_per_token(["abcab", "é"], lambda t: encode(t, m)), flops_per_byte(10, 2, 30, 5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['abc', 'ab'] ['a', 'abc']\n2.3333333333333335 60.0",
          "['abc', 'ab'] ['aabc']\n2.3333333333333335 60.0",
          "['abc', 'ab'] ['a', 'abc']\n2.0 60.0",
          "['ab', 'c', 'ab'] ['a', 'abc']\n2.3333333333333335 60.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pair_counts(words)</C> for a dict from symbol tuples to frequencies; <C>merge(word, pair)</C>, merging
          non-overlapping occurrences from the left; and <C>train_bpe(words, n)</C>, taking a dict from strings to
          frequencies and returning the merges and the final dict of symbol tuples.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from collections import Counter

def pair_counts(words):
    return Counter()

def merge(word, pair):
    return word

def train_bpe(words, n):
    return [], {tuple(w): f for w, f in words.items()}
`,
        solution: TRAIN,
        tests: [
          { name: "merge", code: `assert merge(("a", "a", "a"), ("a", "a")) == ("aa", "a") and pair_counts({("x", "y", "x"): 3}) == Counter({("x", "y"): 3, ("y", "x"): 3})` },
          { name: "train", code: `m, w = train_bpe({"xyx": 3, "yx": 1}, 2); assert m == [("y", "x"), ("x", "yx")] and w == {("xyx",): 3, ("yx",): 1} and train_bpe({"q": 4}, 3) == ([], {("q",): 4})` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>encode(word, merges)</C>, applying merges in order; <C>bytes_per_token(texts, tokenize)</C>, counting
          UTF-8 bytes; and <C>flops_per_byte(V, d, body, bpt)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def encode(word, merges):
    return [word]

def bytes_per_token(texts, tokenize):
    return 1.0

def flops_per_byte(V, d, body, bpt):
    return 6 * body
`,
        solution: MEASURE,
        tests: [
          { name: "enc", code: `assert encode("xyxy", [("y", "x"), ("x", "yx")]) == ["xyx", "y"] and encode("", [("a", "b")]) == [] and encode("ba", [("a", "b")]) == ["b", "a"]` },
          { name: "rates", code: `assert bytes_per_token(["ab", "cd"], list) == 1.0 and bytes_per_token(["été"], lambda t: [t]) == 5.0 and flops_per_byte(4, 3, 8, 2) == 60` },
        ],
      },
    },
    {
      key: "best",
      rung: "stretch",
      prompt: (
        <p>
          For the model of the second check, the vocabularies 16384, 32768, 65536 and 131072 give 3.9, 4.3, 4.6 and 4.8
          bytes per token. What is the lowest training cost per byte among them, in millions of FLOPs to one decimal?
        </p>
      ),
      answer: { kind: "numeric", value: 298.0, tolerance: 0.05 },
    },
  ],

  glimpse: (
    <>
      <p>
        Data and tokeniser are ready. The next chapter starts training, beginning with a ladder of small runs that fits
        the scaling law and the hyperparameters for the main run.
      </p>
    </>
  ),
};
