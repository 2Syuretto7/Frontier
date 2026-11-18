import { C, Code } from "@/components/lesson/Code";
import type { Drill } from "./types";

export const bpe: Drill = {
  id: "bpe",
  title: "Byte-level BPE tokeniser",
  summary: "Train byte-pair-encoding merges on a text, then encode and decode with them.",
  minutes: 25,
  skills: ["Tokenisation", "Algorithms", "Python data structures"],
  lessons: ["e0.4.2", "e0.4.3", "e2.7.2", "l5.1.1"],
  testLessons: {
    "decode handles partial UTF-8 sequences": ["e0.4.3"],
    "decode inverts encode on any text": ["e0.4.3", "l5.1.1"],
    "train_bpe returns merges as pairs of token ids": ["l5.1.1"],
    "train_bpe matches the reference on mixed-script text": ["l5.1.1", "e0.4.2"],
    "ties go to the pair that occurs first": ["e2.7.2"],
    "overlapping pairs are counted but merged without overlap": ["e0.4.2"],
    "training stops once no pair repeats": ["e2.7.2"],
    "encode applies merges in the order they were learned": ["l5.1.1"],
  },
  brief: (
    <>
      <p>Write a byte-level byte-pair-encoding tokeniser in plain Python. Token ids <C>0</C> to <C>255</C> are the raw bytes; the <C>i</C>-th merge creates token <C>256 + i</C>.</p>
      <ol>
        <li>
          <C>train_bpe(text, num_merges)</C> returns a list of merges, each a tuple <C>(a, b)</C> of two token ids.
          Start from <C>list(text.encode(&quot;utf-8&quot;))</C>. In each round, count every adjacent pair in the
          current sequence, overlaps included (<C>aaa</C> holds the pair <C>(a, a)</C> twice). Merge the most
          frequent pair; on a tie, take the pair whose first occurrence comes earliest in the sequence. Replace its
          occurrences left to right, without overlap, by the new token. Stop after <C>num_merges</C> rounds, or
          earlier once no pair occurs at least twice.
        </li>
        <li>
          <C>encode(text, merges)</C> returns a list of ids. Start from the UTF-8 bytes. Repeatedly find, among the
          adjacent pairs present, the one learned earliest in <C>merges</C>, and merge all its occurrences left to right.
          Stop when no adjacent pair is a merge.
        </li>
        <li>
          <C>decode(ids, merges)</C> returns the string: expand every id back into bytes and decode them as UTF-8 with{" "}
          <C>errors=&quot;replace&quot;</C>.
        </li>
      </ol>
      <p>The hidden tests train and encode on English, Hindi and emoji text, check round trips, merge order, tie-breaking and the early stop.</p>
      <Code>{`
merges = train_bpe("aaabdaaabac", 3)   # [(97, 97), (256, 97), (257, 98)]
encode("aaabdaaabac", merges)            # [258, 100, 258, 97, 99]
`}</Code>
    </>
  ),
  starter: `def train_bpe(text, num_merges):
    raise NotImplementedError


def encode(text, merges):
    raise NotImplementedError


def decode(ids, merges):
    raise NotImplementedError


if __name__ == "__main__":
    merges = train_bpe("aaabdaaabac", 3)
    print(merges)
    ids = encode("aaabdaaabac", merges)
    print(ids, decode(ids, merges))
`,
  solution: `def pair_counts(ids):
    counts = {}
    for pair in zip(ids, ids[1:]):
        counts[pair] = counts.get(pair, 0) + 1
    return counts


def merge(ids, pair, new_id):
    out = []
    i = 0
    while i < len(ids):
        if i + 1 < len(ids) and (ids[i], ids[i + 1]) == pair:
            out.append(new_id)
            i += 2
        else:
            out.append(ids[i])
            i += 1
    return out


def train_bpe(text, num_merges):
    ids = list(text.encode("utf-8"))
    merges = []
    for i in range(num_merges):
        counts = pair_counts(ids)
        if not counts:
            break
        pair = max(counts, key=counts.get)
        if counts[pair] < 2:
            break
        ids = merge(ids, pair, 256 + i)
        merges.append(pair)
    return merges


def encode(text, merges):
    rank = {pair: i for i, pair in enumerate(merges)}
    ids = list(text.encode("utf-8"))
    while len(ids) >= 2:
        present = [p for p in zip(ids, ids[1:]) if p in rank]
        if not present:
            break
        pair = min(present, key=rank.get)
        ids = merge(ids, pair, 256 + rank[pair])
    return ids


def decode(ids, merges):
    vocab = {i: bytes([i]) for i in range(256)}
    for i, (a, b) in enumerate(merges):
        vocab[256 + i] = vocab[a] + vocab[b]
    return b"".join(vocab[i] for i in ids).decode("utf-8", errors="replace")
`,
  prelude: `def _ref_merge(ids, pair, new):
    out, i = [], 0
    while i < len(ids):
        if i + 1 < len(ids) and ids[i] == pair[0] and ids[i + 1] == pair[1]:
            out.append(new)
            i += 2
        else:
            out.append(ids[i])
            i += 1
    return out


def _ref_train(text, n):
    ids, merges = list(text.encode("utf-8")), []
    for i in range(n):
        counts = {}
        for p in zip(ids, ids[1:]):
            counts[p] = counts.get(p, 0) + 1
        if not counts:
            break
        best = max(counts, key=counts.get)
        if counts[best] < 2:
            break
        ids = _ref_merge(ids, best, 256 + i)
        merges.append(best)
    return merges, ids


def _ref_encode(text, merges):
    rank = {p: i for i, p in enumerate(merges)}
    ids = list(text.encode("utf-8"))
    while True:
        cands = [p for p in zip(ids, ids[1:]) if p in rank]
        if not cands:
            return ids
        p = min(cands, key=rank.get)
        ids = _ref_merge(ids, p, 256 + rank[p])


def _ref_pairs(merges):
    return [tuple(int(x) for x in m) for m in merges]


_ref_corpus = (
    "the cat sat on the mat. the dog sat on the log. then the cat and the dog sat together on the mat. "
    "\\u0928\\u092e\\u0938\\u094d\\u0924\\u0947 \\u0926\\u0941\\u0928\\u093f\\u092f\\u093e, "
    "\\u0928\\u092e\\u0938\\u094d\\u0924\\u0947 \\u092d\\u093e\\u0930\\u0924! "
    "tokens tokens tokenisers \\U0001F600\\U0001F600 \\U0001F680 done."
)
`,
  tests: [
    {
      name: "train_bpe returns merges as pairs of token ids",
      code: `m = train_bpe("aaabdaaabac", 3)
assert isinstance(m, list), "train_bpe should return a list"
assert all(len(p) == 2 for p in m), "each merge should be a pair (a, b)"
assert _ref_pairs(m) == [(97, 97), (256, 97), (257, 98)], f"for 'aaabdaaabac' with 3 merges, got {_ref_pairs(m)}"`,
    },
    {
      name: "train_bpe matches the reference on mixed-script text",
      code: `want, _ = _ref_train(_ref_corpus, 40)
got = _ref_pairs(train_bpe(_ref_corpus, 40))
assert len(got) == len(want), f"expected {len(want)} merges, got {len(got)}"
first = next((i for i, (a, b) in enumerate(zip(got, want)) if a != b), None)
assert first is None, f"merge {first} differs from the reference: check how pairs are counted and how ties are broken"`,
    },
    {
      name: "ties go to the pair that occurs first",
      code: `got = _ref_pairs(train_bpe("xyab xyab abxy abxy", 1))
assert got == [_ref_train("xyab xyab abxy abxy", 1)[0][0]], f"(x, y) and (a, b) tie on count; the earlier one should win, got {got}"`,
    },
    {
      name: "overlapping pairs are counted but merged without overlap",
      code: `got = _ref_pairs(train_bpe("aaaa bbb bbb", 2))
want, _ = _ref_train("aaaa bbb bbb", 2)
assert got == want, f"expected {want}, got {got}: count overlapping pairs, then merge left to right"`,
    },
    {
      name: "training stops once no pair repeats",
      code: `got = train_bpe("abcdef", 10)
assert len(got) == 0, "no pair occurs twice in 'abcdef', so there should be no merges"
got = train_bpe("abab", 10)
assert len(got) == 1, f"'abab' allows one merge before no pair repeats, got {len(got)}"`,
    },
    {
      name: "encode applies merges in the order they were learned",
      code: `merges, final = _ref_train(_ref_corpus, 40)
got = list(encode(_ref_corpus, merges))
assert got == final, "encoding the training text should reproduce the final training sequence"
text = "the tokeniser sat on the dog. \\u0928\\u092e\\u0938\\u094d\\u0924\\u0947 \\U0001F600"
assert list(encode(text, merges)) == _ref_encode(text, merges), "encode differs from the reference on new text: always merge the earliest-learned pair present"`,
    },
    {
      name: "decode inverts encode on any text",
      code: `merges, _ = _ref_train(_ref_corpus, 40)
for text in [_ref_corpus, "", "unseen words \\u2603 and \\U0001F680\\U0001F680", "the the the"]:
    assert decode(encode(text, merges), merges) == text, f"decode(encode(text)) should give back {text!r}"`,
    },
    {
      name: "decode handles partial UTF-8 sequences",
      code: `merges, _ = _ref_train(_ref_corpus, 10)
got = decode([0xF0, 0x9F], merges)
assert got == "\\ufffd", f"a broken byte sequence should decode with errors='replace', got {got!r}"`,
    },
  ],
};
