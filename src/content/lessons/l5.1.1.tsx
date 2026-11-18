import { M } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BpeMergeViz } from "@/components/viz/BpeMergeViz";
import type { LessonContent } from "@/lib/types";

const TRAIN = `from collections import Counter

def pair_counts(words):
    counts = Counter()
    for word, freq in words.items():
        for pair in zip(word, word[1:]):
            counts[pair] += freq
    return counts

def merge_word(word, pair, new):
    out, i = [], 0
    while i < len(word):
        if i + 1 < len(word) and (word[i], word[i + 1]) == pair:
            out.append(new)
            i += 2
        else:
            out.append(word[i])
            i += 1
    return tuple(out)

def train_bpe(word_freqs, k):
    words = {tuple(w): f for w, f in word_freqs.items()}
    merges = []
    for _ in range(k):
        counts = pair_counts(words)
        if not counts:
            break
        pair = min(counts, key=lambda p: (-counts[p], p))
        merges.append(pair)
        words = {merge_word(w, pair, pair[0] + pair[1]): f for w, f in words.items()}
    return merges`;

const ENCODE = `def encode(word, merges):
    rank = {pair: r for r, pair in enumerate(merges)}
    tokens = list(word)
    while len(tokens) > 1:
        pairs = [(rank.get(p, len(rank)), i) for i, p in enumerate(zip(tokens, tokens[1:]))]
        r, i = min(pairs)
        if r == len(rank):
            break
        tokens[i:i + 2] = [tokens[i] + tokens[i + 1]]
    return tokens

def count_tokens(word_freqs, merges):
    return sum(f * len(encode(w, merges)) for w, f in word_freqs.items())

def chars_per_token(word_freqs, merges):
    chars = sum(f * len(w) for w, f in word_freqs.items())
    return chars / count_tokens(word_freqs, merges)`;

export const lesson: LessonContent = {
  id: "l5.1.1",
  minutes: 45,
  links: {
    requires: ["l4.3.1"],
    revisits: ["e2.4.4"],
    foreshadows: ["l5.1.2"],
  },

  puzzle: (
    <>
      <p>
        A language model predicts the next symbol. If the symbols are words, a vocabulary of a million entries still meets
        names, typos and new words it has never seen. If the symbols are characters, nothing is ever unseen, but a page of
        text becomes thousands of steps and the model must relearn spelling before meaning. Modern models settle on
        something in between, found by a greedy algorithm from data compression that knows nothing about language. How does
        it decide what the units are, and why is it guaranteed never to meet an unknown word?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Start with the smallest units, single bytes or characters, so that every text can be written down. Then look for
        the pair of adjacent units that occurs most often in the training text and make it a new unit. Repeat. Frequent
        endings, frequent short words and eventually frequent long words each become one token, while rare words stay split
        into pieces. The result is a vocabulary whose size you choose, which compresses common text well and still spells
        out anything new, one piece at a time.
      </p>
      <BpeMergeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="tokeniser and byte-pair encoding">
        <p>
          A <em>tokeniser</em> maps a string to a sequence of tokens from a finite vocabulary V, with a decoder that maps it
          back. <em>Byte-pair encoding</em> (BPE) starts from a base vocabulary, the 256 byte values or the characters of the
          corpus, and a corpus first split into words, each with a count. It then repeats k times: count every adjacent pair
          of tokens over all words, weighted by word counts; pick the most frequent pair (a, b), breaking ties by a fixed
          order; record the merge; and rewrite every word, scanning left to right and replacing each occurrence of a followed
          by b with the new token ab.
        </p>
        <Code>{TRAIN}</Code>
      </Definition>

      <Theorem title="what one merge does">
        <p>
          A merge adds exactly one token to the vocabulary and lowers the total number of tokens in the corpus by exactly
          the number of replacements it makes. That number equals the pair&apos;s count unless occurrences overlap, which can
          only happen when a = b.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each replacement turns two tokens into one, and tokens not involved are copied, so the length of each word drops by
          its number of replacements; summing with the word counts as weights gives the corpus total. Two counted occurrences
          of (a, b) can share a token only if one occurrence&apos;s b is the other&apos;s a, which needs a = b, as in
          &quot;aaa&quot;, where the pair is counted twice but the scan replaces it once. Otherwise every counted occurrence
          is disjoint from the others and is replaced.
        </p>
      </Proof>

      <Definition title="encoding new text">
        <p>
          To encode a word, split it into base tokens and repeatedly merge the adjacent pair whose merge was learned
          earliest (lowest rank), until no adjacent pair has a learned merge. Base tokens are always available, so encoding
          never fails; decoding concatenates the tokens&apos; strings.
        </p>
        <Code>{ENCODE}</Code>
      </Definition>

      <Theorem title="greedy by rank replays the merges in order">
        <p>
          Encoding a word by lowest-rank merges gives the same tokens as applying the learned merges one after another, in
          training order, each to the whole word with a left-to-right scan. In particular a word of the training corpus is
          encoded exactly as training segmented it.
        </p>
      </Theorem>
      <Proof>
        <p>
          Suppose the merges with rank below r have all been applied, so no pair with rank below r is present, and apply
          merge r. It replaces some (a, b) by the new token ab. Any pair that is new afterwards contains ab, and ab was
          created by merge r, so every merge involving it has rank above r. Pairs not touching the replaced tokens are
          unchanged. So merge r never creates a pair of rank r or less except further copies of (a, b) itself, which the same
          step absorbs; the lowest-rank pair present is therefore always the next merge in training order, and the two
          procedures make the same replacements. Training rewrote each corpus word by exactly this sequence of merges.
        </p>
      </Proof>

      <Remark title="details that matter in practice">
        <p>
          Byte-level BPE, used by GPT-2 and most models since, starts from the 256 byte values of UTF-8, so every string
          has an encoding: 50,000 merges give a vocabulary of 50,256 plus special tokens. Text is first split by a regular
          expression into words, numbers and punctuation, with the preceding space attached to a word, so merges never cross
          word boundaries. Other tokenisers make different choices: WordPiece merges the pair that most increases the
          likelihood of a unigram model, and the Unigram method starts from a large vocabulary and prunes it. All of them
          inherit the corpus&apos;s biases: a tokeniser trained mostly on English cuts Hindi or Tamil text into many more
          tokens per character, which costs speakers of those languages more compute and more of the context window.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "count",
      rung: "check",
      prompt: (
        <p>
          A corpus has the words hug ×10, pug ×5, pun ×12, bun ×4 and hugs ×5, split into characters. What is the count of
          the most frequent adjacent pair?
        </p>
      ),
      answer: { kind: "numeric", value: 20, tolerance: 0 },
    },
    {
      key: "vocab",
      rung: "check",
      prompt: <p>A byte-level BPE tokeniser learns 50,000 merges. How many tokens are in its vocabulary, not counting special tokens?</p>,
      answer: { kind: "numeric", value: 50256, tolerance: 0 },
    },
    {
      key: "unseen",
      rung: "apply",
      prompt: <p>Why does a byte-level BPE tokeniser never produce an unknown-word token?</p>,
      answer: {
        kind: "choice",
        options: [
          "Every string is a sequence of bytes, all 256 bytes are in the vocabulary, and encoding only ever merges tokens, never removes them",
          "Its vocabulary contains every word that appeared in the training corpus",
          "It maps any word it does not know to the nearest known word",
          "It learns enough merges to cover every possible word",
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
    counts = Counter()
    for word, freq in words.items():
        for pair in zip(word, word[1:]):
            counts[pair] += freq
    return counts

def merge_word(word, pair, new):
    out, i = [], 0
    while i < len(word):
        if i + 1 < len(word) and (word[i], word[i + 1]) == pair:
            out.append(new)
            i += 2
        else:
            out.append(word[i])
            i += 1
    return tuple(out)

def train_bpe(word_freqs, k):
    words = {tuple(w): f for w, f in word_freqs.items()}
    merges = []
    for _ in range(k):
        counts = pair_counts(words)
        if not counts:
            break
        pair = min(counts, key=lambda p: (-counts[p], p))
        merges.append(pair)
        words = {merge_word(w, pair, pair[0] + pair[1]): f for w, f in words.items()}
    return merges

W = {"hug": 10, "pug": 5, "pun": 12, "bun": 4, "hugs": 5}
c = pair_counts({tuple(w): f for w, f in W.items()}); print(c[("u", "g")], c[("u", "n")], merge_word(tuple("aaaaa"), ("a", "a"), "aa"))
print(train_bpe(W, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "20 16 ('aa', 'aa', 'a')\n[('u', 'g'), ('u', 'n'), ('h', 'ug')]",
          "20 16 ('aa', 'aa', 'aa', 'aa')\n[('u', 'g'), ('u', 'n'), ('h', 'ug')]",
          "20 16 ('aa', 'aa', 'a')\n[('u', 'g'), ('u', 'n'), ('h', 'u')]",
          "15 16 ('aa', 'aa', 'a')\n[('u', 'n'), ('u', 'g'), ('h', 'ug')]",
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
    rank = {pair: r for r, pair in enumerate(merges)}
    tokens = list(word)
    while len(tokens) > 1:
        pairs = [(rank.get(p, len(rank)), i) for i, p in enumerate(zip(tokens, tokens[1:]))]
        r, i = min(pairs)
        if r == len(rank):
            break
        tokens[i:i + 2] = [tokens[i] + tokens[i + 1]]
    return tokens

def count_tokens(word_freqs, merges):
    return sum(f * len(encode(w, merges)) for w, f in word_freqs.items())

def chars_per_token(word_freqs, merges):
    chars = sum(f * len(w) for w, f in word_freqs.items())
    return chars / count_tokens(word_freqs, merges)

W = {"hug": 10, "pug": 5, "pun": 12, "bun": 4, "hugs": 5}; m = [("u", "g"), ("u", "n"), ("h", "ug")]
print(encode("hugs", m), encode("bug", m), encode("mug", []), count_tokens(W, []), count_tokens(W, m), round(chars_per_token(W, m), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['hug', 's'] ['b', 'ug'] ['m', 'u', 'g'] 113 62 1.823",
          "['hugs'] ['b', 'ug'] ['m', 'u', 'g'] 113 62 1.823",
          "['hug', 's'] ['bug'] ['m', 'u', 'g'] 113 62 1.823",
          "['hug', 's'] ['b', 'ug'] ['m', 'u', 'g'] 113 77 1.468",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pair_counts(words)</C> for a dict from token tuples to counts, returning a Counter of adjacent pairs;{" "}
          <C>merge_word(word, pair, new)</C>, the left-to-right replacement; and <C>train_bpe(word_freqs, k)</C>, taking a
          dict from strings to counts and returning up to k merges as pairs, breaking ties by the smallest pair and naming
          each new token by concatenation.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from collections import Counter

def pair_counts(words):
    return Counter()

def merge_word(word, pair, new):
    return word

def train_bpe(word_freqs, k):
    return []
`,
        solution: TRAIN,
        tests: [
          { name: "pieces", code: `c = pair_counts({("a", "b", "a", "b"): 3, ("b", "a"): 2}); assert c[("a", "b")] == 6 and c[("b", "a")] == 5
assert merge_word(tuple("aaaaa"), ("a", "a"), "aa") == ("aa", "aa", "a") and merge_word(("x", "ab", "c"), ("ab", "c"), "abc") == ("x", "abc")` },
          { name: "train", code: `assert train_bpe({"hug": 10, "pug": 5, "pun": 12, "bun": 4, "hugs": 5}, 3) == [("u", "g"), ("u", "n"), ("h", "ug")]
assert train_bpe({"ab": 1, "ba": 1}, 2) == [("a", "b"), ("b", "a")] and train_bpe({"a": 4}, 5) == []
m = train_bpe({"low": 5, "lower": 2, "newest": 6, "widest": 3, "lowest": 1}, 4); assert m == [("e", "s"), ("es", "t"), ("l", "o"), ("lo", "w")]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>encode(word, merges)</C>, repeatedly merging the lowest-rank adjacent pair (leftmost on ties) and returning
          a list of tokens; <C>count_tokens(word_freqs, merges)</C>, the corpus token total; and{" "}
          <C>chars_per_token(word_freqs, merges)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def encode(word, merges):
    return list(word)

def count_tokens(word_freqs, merges):
    return sum(f * len(w) for w, f in word_freqs.items())

def chars_per_token(word_freqs, merges):
    return 1.0
`,
        solution: ENCODE,
        tests: [
          { name: "encode", code: `m = [("u", "g"), ("u", "n"), ("h", "ug")]; assert encode("hugs", m) == ["hug", "s"] and encode("bunug", m) == ["b", "un", "ug"]
assert encode("aaaa", [("a", "a"), ("aa", "aa")]) == ["aaaa"] and encode("", m) == [] and encode("x", m) == ["x"]
assert encode("abc", [("b", "c"), ("a", "b")]) == ["a", "bc"]` },
          { name: "corpus", code: `W = {"hug": 10, "pug": 5, "pun": 12, "bun": 4, "hugs": 5}; m = [("u", "g"), ("u", "n"), ("h", "ug")]
assert count_tokens(W, []) == 113 and count_tokens(W, m) == 62 and abs(chars_per_token(W, m) - 113 / 62) < 1e-12` },
        ],
      },
    },
    {
      key: "overlap",
      rung: "stretch",
      prompt: (
        <p>
          The pair (a, a) is counted over the word &quot;aaaaaaa&quot; (seven letters) and then merged with a left-to-right
          scan. By how much does the pair count exceed the number of replacements?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        The number of merges is a free choice. More merges mean shorter sequences but a larger embedding table and rarer
        tokens; the next lesson weighs that trade-off.
      </p>
    </>
  ),
};
