import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LshCurveViz } from "@/components/viz/LshCurveViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.3.4",
  minutes: 60,
  links: {
    requires: ["e2.3.3"],
    revisits: ["m4.6.1", "m1.4.3"],
    foreshadows: ["e11.4.2", "e11.4.3"],
  },

  puzzle: (
    <>
      <p>
        A web crawl holds a billion documents, and many are near-copies: the same article with a different footer, a forum
        thread quoted in full. Training on duplicates wastes compute and encourages memorisation. Comparing every pair is 5 ×
        10¹⁷ comparisons. Can you find the pairs that overlap by more than, say, 80 per cent without ever looking at most pairs?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Represent each document as the set of its short word sequences, its <strong>shingles</strong>. Similarity of two sets is
        the size of their overlap over the size of their union. Now pick a random ordering of all possible shingles and record,
        for each document, which of its shingles comes first. Two documents record the same shingle exactly when the first
        shingle of their union lies in both, which happens with probability equal to their similarity. Repeat with a hundred
        orderings and you have a short <strong>signature</strong> whose agreements estimate similarity.
      </p>
      <p>
        Signatures are still compared in pairs, though. The last trick, <strong>locality-sensitive hashing</strong>, cuts each
        signature into bands and hashes every band into buckets; only documents sharing a bucket are compared. The chance of
        that rises steeply with similarity, so similar pairs are almost always caught and dissimilar ones almost never.
      </p>
      <LshCurveViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Jaccard similarity and shingles">
        <p>
          The <strong>Jaccard similarity</strong> of finite sets is <M>{"J(A, B) = \\dfrac{|A \\cap B|}{|A \\cup B|}"}</M>,
          between 0 (disjoint) and 1 (equal). A document&rsquo;s <strong>k-shingles</strong> are its runs of k consecutive words
          (or characters); &ldquo;the cat sat on the mat&rdquo; has the word 2-shingles <em>the cat, cat sat, sat on, on the,
          the mat</em>. Reordering paragraphs keeps most shingles; changing a word breaks only the k that contain it.
        </p>
      </Definition>

      <Theorem title="the MinHash property">
        <p>
          Let π be a uniformly random ordering of the universe of shingles, and <M>{"m_\\pi(S)"}</M> the first element of S in
          that ordering. For nonempty A and B, <M>{"P\\big(m_\\pi(A) = m_\\pi(B)\\big) = J(A, B)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let x be the first element of <M>{"A \\cup B"}</M> under π. By symmetry x is equally likely to be any element of the
          union. If x lies in <M>{"A \\cap B"}</M>, it is the minimum of both sets; if it lies in only one, the other set&rsquo;s
          minimum is a different element. So the minima agree exactly when{" "}
          <M>{"x \\in A \\cap B"}</M>, which has probability <M>{"|A \\cap B| / |A \\cup B|"}</M>.
        </p>
      </Proof>

      <Definition title="signatures">
        <p>
          A <strong>MinHash signature</strong> of length k records <M>{"m_{\\pi_1}(S), \\dots, m_{\\pi_k}(S)"}</M> for k
          independent orderings. The fraction of positions where two signatures agree is an unbiased estimate of J with
          standard deviation <M>{"\\sqrt{J(1-J)/k}"}</M>: 128 positions estimate J to within about ±0.04. In practice a random
          ordering is replaced by a random hash function, <M>{"h(x) = (a x + b) \\bmod p"}</M> applied to a 64-bit hash of the
          shingle, and the signature stores the minimum hash value rather than the shingle.
        </p>
        <Code>{`P = (1 << 61) - 1
params = [(rng.randrange(1, P), rng.randrange(P)) for _ in range(k)]
sig = [min((a * x + b) % P for x in shingle_hashes) for a, b in params]`}</Code>
      </Definition>

      <Theorem title="banding">
        <p>
          Split each signature of length br into b bands of r values, and call two documents a <strong>candidate pair</strong>{" "}
          if they agree on every value of at least one band. For documents with similarity J, the probability of becoming
          candidates is <M>{"1 - (1 - J^r)^b"}</M>, an S-shaped curve whose steepest rise is near{" "}
          <M>{"J \\approx (1/b)^{1/r}"}</M>.
        </p>
      </Theorem>
      <Example title="20 bands of 5">
        <p>
          A 100-value signature as 20 bands of 5 rows has its threshold near <M>{"(1/20)^{1/5} \\approx 0.55"}</M>. A pair at
          J = 0.8 becomes a candidate with probability <M>{"1 - (1 - 0.8^5)^{20} \\approx 0.9996"}</M>; a pair at J = 0.3 with
          probability about 0.047. Each band is a hash table from the tuple of r values to document ids, so finding candidates
          costs about one bucket insertion per band per document, plus the candidates themselves.
        </p>
      </Example>

      <Remark title="a first look">
        <p>
          This is a taste. Data engineering for foundation models returns to MinHash at the scale of trillions of tokens: how to
          choose shingles, how to tune bands against the cost of false positives and false negatives, and how semantic
          de-duplication with embeddings finds paraphrases that share no shingles at all.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "jaccard",
      rung: "check",
      prompt: <p>What is the Jaccard similarity of <C>{"{a, b, c, d}"}</C> and <C>{"{c, d, e}"}</C>?</p>,
      answer: { kind: "numeric", value: 0.4 },
    },
    {
      key: "property",
      rung: "check",
      prompt: <p>For a random ordering, the probability that two sets have the same first element is:</p>,
      answer: { kind: "choice", options: ["their Jaccard similarity", "|A ∩ B| / |A|", "1/|A ∪ B|", "the cosine of the angle between them"], correct: [0] },
    },
    {
      key: "shingles",
      rung: "apply",
      prompt: <p>How many distinct word 2-shingles does &ldquo;the cat sat on the mat&rdquo; have?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "stderr",
      rung: "apply",
      prompt: <p>Two documents have J = 0.5. What is the standard deviation of the MinHash estimate from a signature of 100 values?</p>,
      answer: { kind: "numeric", value: 0.05 },
    },
    {
      key: "band",
      rung: "apply",
      prompt: <p>With 20 bands of 5 rows, what is the probability that a pair with J = 0.8 becomes a candidate? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.9996, tolerance: 0.0001 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`A = {"a", "b", "c", "d"}
B = {"c", "d", "e"}
orders = ["dcbae", "ebdca", "abcde", "cadeb"]

def first(S, order):
    return min(S, key=order.index)

sig_a = [first(A, o) for o in orders]
sig_b = [first(B, o) for o in orders]
agree = sum(x == y for x, y in zip(sig_a, sig_b))
print(sig_a, sig_b, agree / len(orders), len(A & B) / len(A | B))`}</Code>
          <p>MinHash with four explicit orderings. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['d', 'b', 'a', 'c'] ['d', 'e', 'c', 'c'] 0.5 0.4",
          "['d', 'b', 'a', 'c'] ['d', 'e', 'c', 'c'] 0.4 0.4",
          "['d', 'e', 'a', 'c'] ['d', 'e', 'c', 'c'] 0.75 0.4",
          "['a', 'b', 'a', 'a'] ['c', 'e', 'c', 'c'] 0.0 0.4",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`b, r = 8, 4
for J in (0.2, 0.5, 0.8):
    print(J, round(1 - (1 - J**r) ** b, 3), end="; ")
print(round((1 / b) ** (1 / r), 3))`}</Code>
          <p>The banding curve for 8 bands of 4 rows. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.2 0.013; 0.5 0.403; 0.8 0.985; 0.595", "0.2 0.002; 0.5 0.0625; 0.8 0.41; 0.595", "0.2 0.013; 0.5 0.5; 0.8 0.985; 0.5", "0.2 0.987; 0.5 0.597; 0.8 0.015; 0.595"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>shingles(text, k)</C> (the set of tuples of k consecutive lower-cased words; empty if there are fewer than
            k words), <C>jaccard(a, b)</C> (1.0 for two empty sets), <C>signature(sh, num_perm, seed=0)</C> and{" "}
            <C>estimate(s1, s2)</C>. For the signature, hash each shingle to a 64-bit integer with{" "}
            <C>{`hashlib.blake2b(" ".join(sh).encode(), digest_size=8)`}</C>, draw <C>num_perm</C> pairs (a, b) with{" "}
            <C>random.Random(seed)</C>, a from [1, P) and b from [0, P) with P = 2⁶¹ − 1, and record the minimum of{" "}
            <C>(a * x + b) % P</C> over the shingle hashes x for each pair. Raise <C>ValueError</C> for an empty set.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def shingles(text, k):
    return set(text.split())

def jaccard(a, b):
    return 0.0

def signature(sh, num_perm, seed=0):
    return [0] * num_perm

def estimate(s1, s2):
    return 1.0
`,
        solution: `import hashlib
import random

P = (1 << 61) - 1

def shingles(text, k):
    w = text.lower().split()
    return {tuple(w[i:i + k]) for i in range(len(w) - k + 1)}

def jaccard(a, b):
    u = a | b
    return len(a & b) / len(u) if u else 1.0

def _h64(sh):
    return int.from_bytes(hashlib.blake2b(' '.join(sh).encode(), digest_size=8).digest(), 'big')

def signature(sh, num_perm, seed=0):
    if not sh:
        raise ValueError('empty set')
    rng = random.Random(seed)
    params = [(rng.randrange(1, P), rng.randrange(P)) for _ in range(num_perm)]
    xs = [_h64(s) for s in sh]
    return [min((a * x + b) % P for x in xs) for a, b in params]

def estimate(s1, s2):
    return sum(x == y for x, y in zip(s1, s2)) / len(s1)
`,
        tests: [
          { name: "shingles", code: `assert shingles("The cat sat on the mat", 2) == {('the', 'cat'), ('cat', 'sat'), ('sat', 'on'), ('on', 'the'), ('the', 'mat')}
assert shingles("one two", 3) == set() and jaccard(set(), set()) == 1.0
assert jaccard({1, 2, 3, 4}, {3, 4, 5}) == 0.4` },
          { name: "signature", code: `a = shingles("a b c d e f g h", 2)
s = signature(a, 64, 3)
assert len(s) == 64 and s == signature(set(a), 64, 3), 'The signature depends only on the set and the seed.'
assert s != signature(a, 64, 4)
assert all(0 <= v < (1 << 61) - 1 for v in s)
try:
    signature(set(), 8)
    assert False, 'An empty set must raise ValueError.'
except ValueError:
    pass` },
          { name: "estimates", code: `import random, math
rng = random.Random(11)
vocab = [f"w{i}" for i in range(5000)]
for share in (0.0, 0.3, 0.6, 0.9, 1.0):
    base = [rng.choice(vocab) for _ in range(400)]
    other = [w if rng.random() < share else rng.choice(vocab) for w in base]
    A, B = shingles(" ".join(base), 3), shingles(" ".join(other), 3)
    J = jaccard(A, B)
    est = estimate(signature(A, 256, 1), signature(B, 256, 1))
    assert abs(est - J) <= 3 * math.sqrt(J * (1 - J) / 256) + 0.02, f'J={J:.3f}, estimate {est:.3f}'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>lsh_candidates(sigs, b, r)</C>, where <C>sigs</C> maps document ids to signatures of length b·r (raise{" "}
            <C>ValueError</C> otherwise). Put each document into one bucket per band, keyed by the band number and the tuple of
            its r values, and return the set of candidate pairs <C>(i, j)</C> with i &lt; j that share at least one bucket.
            Then write <C>near_duplicates(docs, k, b, r, threshold, seed=0)</C> for a dict of id to text: shingle, sign with b·r
            permutations, take LSH candidates, and return the sorted list of candidate pairs whose exact Jaccard similarity of
            shingles is at least the threshold.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        setup: `import hashlib
import random

P = (1 << 61) - 1

def shingles(text, k):
    w = text.lower().split()
    return {tuple(w[i:i + k]) for i in range(len(w) - k + 1)}

def jaccard(a, b):
    u = a | b
    return len(a & b) / len(u) if u else 1.0

def signature(sh, num_perm, seed=0):
    rng = random.Random(seed)
    params = [(rng.randrange(1, P), rng.randrange(P)) for _ in range(num_perm)]
    xs = [int.from_bytes(hashlib.blake2b(' '.join(s).encode(), digest_size=8).digest(), 'big') for s in sh]
    return [min((a * x + b) % P for x in xs) for a, b in params]
`,
        starter: `# shingles, jaccard and signature are already defined.

def lsh_candidates(sigs, b, r):
    return set()

def near_duplicates(docs, k, b, r, threshold, seed=0):
    return []
`,
        solution: `# shingles, jaccard and signature are already defined.
from itertools import combinations

def lsh_candidates(sigs, b, r):
    buckets = {}
    for doc, sig in sigs.items():
        if len(sig) != b * r:
            raise ValueError('signature length must be b * r')
        for band in range(b):
            key = (band, tuple(sig[band * r:(band + 1) * r]))
            buckets.setdefault(key, []).append(doc)
    pairs = set()
    for ids in buckets.values():
        for i, j in combinations(sorted(ids), 2):
            pairs.add((i, j))
    return pairs

def near_duplicates(docs, k, b, r, threshold, seed=0):
    sh = {d: shingles(t, k) for d, t in docs.items()}
    sigs = {d: signature(s, b * r, seed) for d, s in sh.items()}
    return sorted(p for p in lsh_candidates(sigs, b, r) if jaccard(sh[p[0]], sh[p[1]]) >= threshold)
`,
        tests: [
          { name: "bands", code: `sigs = {1: [1, 2, 3, 4, 5, 6], 2: [1, 2, 9, 9, 9, 9], 3: [7, 7, 3, 4, 8, 8], 4: [0, 0, 0, 0, 0, 0]}
assert lsh_candidates(sigs, 3, 2) == {(1, 2), (1, 3)}
assert lsh_candidates(sigs, 2, 3) == set()
assert lsh_candidates(sigs, 6, 1) == {(1, 2), (1, 3)}
try:
    lsh_candidates(sigs, 4, 2)
    assert False, 'Length must equal b * r.'
except ValueError:
    pass` },
          { name: "brute force", code: `import random
from itertools import combinations
rng = random.Random(6)
for _ in range(30):
    sigs = {i: [rng.randint(0, 2) for _ in range(6)] for i in range(8)}
    want = {(i, j) for i, j in combinations(range(8), 2) if any(sigs[i][2 * q:2 * q + 2] == sigs[j][2 * q:2 * q + 2] for q in range(3))}
    assert lsh_candidates(sigs, 3, 2) == want` },
          { name: "near duplicates", code: `import random
rng = random.Random(2)
vocab = [f"w{i}" for i in range(3000)]
base = [[rng.choice(vocab) for _ in range(200)] for _ in range(6)]
docs = {f"d{i}": " ".join(b) for i, b in enumerate(base)}
edit = list(base[2]); edit[100] = "changed"
docs["copy2"] = " ".join(edit)
docs["copy4"] = " ".join(base[4][:190])
got = near_duplicates(docs, 3, 20, 5, 0.8, seed=1)
assert got == [("copy2", "d2"), ("copy4", "d4")], got` },
        ],
      },
    },
    {
      key: "minhash-proof",
      rung: "prove",
      prompt: <p>Prove that for a uniformly random ordering of the universe, the first elements of nonempty sets A and B coincide with probability J(A, B). Where does uniformity enter?</p>,
      answer: {
        kind: "written",
        rubric: [
          "Considers x, the first element of A ∪ B under the ordering.",
          "Uniformity: every element of A ∪ B is equally likely to come first among them, so P(x ∈ A ∩ B) = |A ∩ B| / |A ∪ B|.",
          "If x ∈ A ∩ B it is the first element of both A and B.",
          "If x is in only one set, the other set's first element differs from x, so the minima differ; hence the probability is exactly J.",
        ],
      },
    },
    {
      key: "length",
      rung: "stretch",
      prompt: (
        <p>
          You want MinHash estimates within ±0.05 of the true similarity with probability about 95 per cent, for any J. How long
          must the signature be? Then choose b and r for a 128-value signature so that the LSH threshold is near 0.7, and say
          what happens to pairs at J = 0.5 and J = 0.9.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "The estimate is a mean of k Bernoulli(J) indicators, with standard deviation √(J(1 − J)/k), largest at J = 1/2, giving 0.5/√k.",
          "Requires 1.96 · 0.5/√k ≤ 0.05, so k ≥ about 385.",
          "Picks b·r = 128 with (1/b)^{1/r} ≈ 0.7, such as b = 16, r = 8, giving (1/16)^{1/8} ≈ 0.71.",
          "Computes 1 − (1 − J⁸)¹⁶ ≈ 0.06 at J = 0.5 and ≈ 0.9999 at J = 0.9, so mostly dissimilar pairs are excluded and similar pairs kept.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why the chance two sets share their first element under a random ordering equals their Jaccard similarity, and how banding finds similar documents without comparing every pair.",

  glimpse: (
    <p>
      Data engineering for foundation models scales this to web corpora, where de-duplication changes what a model memorises and
      how well it generalises. The same idea, hashing so that similar inputs collide, underlies approximate nearest-neighbour
      search over embeddings, the retrieval step in retrieval-augmented generation.
    </p>
  ),
};
