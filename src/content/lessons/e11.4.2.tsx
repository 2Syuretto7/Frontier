import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LshCurveViz } from "@/components/viz/LshCurveViz";
import type { LessonContent } from "@/lib/types";

const MINHASH = `import random, zlib

P = (1 << 61) - 1                                 # a prime larger than any 32-bit value

def shingles(text, k=3):
    w = text.lower().split()
    return {tuple(w[i:i + k]) for i in range(len(w) - k + 1)}

def minhash(sh, num_perm=64, seed=0):
    rng = random.Random(seed)
    coef = [(rng.randrange(1, P), rng.randrange(P)) for _ in range(num_perm)]
    xs = [zlib.crc32(" ".join(s).encode()) for s in sh]
    return [min((a * x + b) % P for x in xs) for a, b in coef]   # one random hash function per row

def jaccard_est(s1, s2):
    return sum(a == b for a, b in zip(s1, s2)) / len(s1)   # each row agrees with probability J`;

const LSH = `def lsh_candidates(sigs, b, r):
    pairs, buckets = set(), {}
    for i, sig in enumerate(sigs):
        for band in range(b):
            key = (band, tuple(sig[band * r:(band + 1) * r]))
            for j in buckets.get(key, []):        # anyone sharing this whole band is a candidate
                pairs.add((j, i))
            buckets.setdefault(key, []).append(i)
    return pairs

def p_candidate(s, b, r):
    return 1 - (1 - s ** r) ** b

def keep_one(n, pairs):
    parent = list(range(n))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for i, j in pairs:
        a, c = find(i), find(j)
        parent[max(a, c)] = min(a, c)             # the smallest index represents each cluster
    return [i for i in range(n) if find(i) == i]`;

export const lesson: LessonContent = {
  id: "e11.4.2",
  minutes: 50,
  links: {
    requires: ["e11.4.1", "e2.3.4"],
    revisits: ["m4.4.4", "e11.1.2"],
    foreshadows: ["e11.4.3"],
  },

  puzzle: (
    <>
      <p>
        After exact deduplication, a crawl still holds thousands of versions of the same news story, each with a different date line,
        advert or comment count, and template pages that differ only in a product name. No two are identical, so hashing whole
        documents misses them all. Comparing every pair for similarity is out of the question at billions of documents. How can
        near-duplicates be found without comparing pairs?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Describe each document by its set of overlapping word sequences, its shingles, and measure similarity as the overlap of the
        sets. A MinHash signature is a short list of numbers, each the minimum of a random hash over the set; two signatures agree in a
        given position with probability equal to the sets&apos; similarity. Cutting signatures into bands and hashing each band sends
        similar documents to the same bucket in at least one band with high probability, and dissimilar ones rarely. Only documents
        sharing a bucket are ever compared.
      </p>
      <LshCurveViz />
    </>
  ),

  theory: (
    <>
      <Definition title="shingles and MinHash">
        <p>
          <C>shingles</C> is the set of k-word sequences of a document. The Jaccard similarity of sets A and B is{" "}
          <M>{"J(A, B) = |A \\cap B| / |A \\cup B|"}</M>. <C>minhash</C> applies n random hash functions{" "}
          <M>{"h_i(x) = (a_i x + b_i) \\bmod p"}</M> to a 32-bit hash of each shingle and keeps each function&apos;s minimum over the set;{" "}
          <C>jaccard_est</C> is the fraction of positions where two signatures agree.
        </p>
        <Code>{MINHASH}</Code>
      </Definition>

      <Theorem title="MinHash agrees with probability J">
        <p>
          If h is a random injective function, <M>{"\\Pr[\\min h(A) = \\min h(B)] = J(A, B)"}</M>, so <C>jaccard_est</C> with n
          independent functions is an unbiased estimate of J with variance <M>{"J(1 - J)/n"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The minimum of h over <M>{"A \\cup B"}</M> is attained at one element, equally likely to be any of the{" "}
          <M>{"|A \\cup B|"}</M> elements. The minima over A and over B are equal exactly when that element lies in both sets, which
          happens with probability <M>{"|A \\cap B|/|A \\cup B|"}</M>. The estimate is a mean of n independent Bernoulli(J) indicators,
          hence the variance. Linear hashes modulo a prime are only approximately such random functions, which is adequate in practice.
        </p>
      </Proof>

      <Definition title="locality-sensitive hashing">
        <p>
          With signatures of length br, <C>lsh_candidates</C> cuts each into b bands of r rows and puts each band in a bucket keyed by
          its values; documents sharing any bucket form a candidate pair. <C>keep_one</C> merges candidate pairs with union-find and
          keeps the smallest index of each cluster. In practice candidates are often verified with the estimated or exact similarity
          before merging.
        </p>
        <Code>{LSH}</Code>
      </Definition>

      <Theorem title="the S-curve">
        <p>
          Two documents with similarity s become a candidate pair with probability{" "}
          <M>{"1 - (1 - s^r)^b"}</M> (<C>p_candidate</C>). The curve rises steeply around{" "}
          <M>{"s \\approx (1/b)^{1/r}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          A band of r rows matches only if all its rows agree, with probability <M>{"s^r"}</M> by the previous theorem, independently
          across rows. The pair is missed only if all b bands fail, with probability <M>{"(1 - s^r)^b"}</M>. At{" "}
          <M>{"s^r = 1/b"}</M>, the expected number of matching bands is 1, which is where the curve turns; larger r sharpens it.
        </p>
      </Proof>

      <Remark title="near-deduplication in practice">
        <p>
          Gopher, RefinedWeb, FineWeb and DCLM all use MinHash with LSH; FineWeb used 5-word shingles and 112 hashes in 14 bands of 8,
          giving a threshold around 0.72. Clusters can chain, A similar to B and B to C, so union-find may merge documents that are not
          similar to each other; verification and cluster size limits keep this in check. FineWeb found that deduplicating each snapshot
          separately worked better than deduplicating across all snapshots, because global deduplication removed many good documents and
          left more low-quality ones. Code needs it most, since forks and vendored files are everywhere (e11.1.2). Documents that say
          the same thing in different words are the subject of the next lesson.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Each version of the story shares most of its shingles with the others, so its MinHash signature agrees with theirs in most
          positions and shares at least one band with them with high probability. Bucketing by band touches each document b times, not
          once per pair, and union-find collapses each family to one representative.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "jaccard",
      rung: "check",
      prompt: <p>What is the Jaccard similarity of the 2-word shingle sets of &quot;a b c d&quot; and &quot;b c d e&quot;? Give a decimal.</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "band",
      rung: "check",
      prompt: (
        <p>
          Signatures are cut into 20 bands of 5 rows. What is the probability that two documents with Jaccard similarity 0.5 become a
          candidate pair? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.47, tolerance: 0.001 },
    },
    {
      key: "rows",
      rung: "apply",
      prompt: <p>What does increasing the rows per band, with the number of bands fixed, do?</p>,
      answer: {
        kind: "choice",
        options: [
          "It raises the similarity needed to become a candidate and makes the transition sharper",
          "It lowers the similarity threshold",
          "It makes MinHash estimates unbiased",
          "It removes the need for shingles",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import random, zlib

P = (1 << 61) - 1                                 # a prime larger than any 32-bit value

def shingles(text, k=3):
    w = text.lower().split()
    return {tuple(w[i:i + k]) for i in range(len(w) - k + 1)}

def minhash(sh, num_perm=64, seed=0):
    rng = random.Random(seed)
    coef = [(rng.randrange(1, P), rng.randrange(P)) for _ in range(num_perm)]
    xs = [zlib.crc32(" ".join(s).encode()) for s in sh]
    return [min((a * x + b) % P for x in xs) for a, b in coef]   # one random hash function per row

def jaccard_est(s1, s2):
    return sum(a == b for a, b in zip(s1, s2)) / len(s1)   # each row agrees with probability J

a, b = shingles("the quick brown fox jumps", 2), shingles("the quick brown dog jumps", 2)
print(len(a & b), len(a | b), len(minhash(a, 16)), jaccard_est(minhash(a), minhash(a)), jaccard_est([1, 2, 3, 4], [1, 5, 3, 6]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["2 6 16 1.0 0.5", "2 8 16 1.0 0.5", "2 6 64 1.0 0.5", "2 6 16 1.0 0.25"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def lsh_candidates(sigs, b, r):
    pairs, buckets = set(), {}
    for i, sig in enumerate(sigs):
        for band in range(b):
            key = (band, tuple(sig[band * r:(band + 1) * r]))
            for j in buckets.get(key, []):        # anyone sharing this whole band is a candidate
                pairs.add((j, i))
            buckets.setdefault(key, []).append(i)
    return pairs

def p_candidate(s, b, r):
    return 1 - (1 - s ** r) ** b

def keep_one(n, pairs):
    parent = list(range(n))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for i, j in pairs:
        a, c = find(i), find(j)
        parent[max(a, c)] = min(a, c)             # the smallest index represents each cluster
    return [i for i in range(n) if find(i) == i]

sigs = [[1, 2, 3, 4], [1, 2, 9, 9], [7, 7, 3, 4], [5, 6, 7, 8]]
print(sorted(lsh_candidates(sigs, 2, 2)), round(p_candidate(0.5, 2, 2), 4), keep_one(5, {(1, 3), (0, 3), (2, 4)}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(0, 1), (0, 2)] 0.4375 [0, 2]",
          "[(0, 1), (0, 2), (1, 2)] 0.4375 [0, 2]",
          "[(0, 1), (0, 2)] 0.25 [0, 2]",
          "[(0, 1), (0, 2)] 0.4375 [0, 1, 2]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>shingles(text, k=3)</C> as a set of tuples of lower-cased words; <C>minhash(sh, num_perm=64, seed=0)</C>, drawing
          each (a, b) pair as shown from <C>random.Random(seed)</C> and hashing each shingle&apos;s space-joined words with{" "}
          <C>zlib.crc32</C>; and <C>jaccard_est(s1, s2)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import random, zlib

P = (1 << 61) - 1

def shingles(text, k=3):
    return set(text.split())

def minhash(sh, num_perm=64, seed=0):
    return [0] * num_perm

def jaccard_est(s1, s2):
    return 1.0
`,
        solution: MINHASH,
        tests: [
          { name: "shingles", code: `assert shingles("A b A b", 2) == {("a", "b"), ("b", "a")} and shingles("x", 2) == set()\nassert jaccard_est([1, 2, 3, 4], [1, 0, 3, 0]) == 0.5` },
          { name: "minhash", code: `rng = random.Random(3)\na, b = rng.randrange(1, P), rng.randrange(P)\nx = zlib.crc32(b"p q")\nassert minhash({("p", "q")}, 1, 3) == [(a * x + b) % P]\ns1, s2 = shingles(" ".join(map(str, range(100))), 3), shingles(" ".join(map(str, range(20, 120))), 3)\nassert abs(jaccard_est(minhash(s1, 256), minhash(s2, 256)) - 78 / 118) < 0.1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lsh_candidates(sigs, b, r)</C>, a set of (i, j) pairs with i &lt; j; <C>p_candidate(s, b, r)</C>; and{" "}
          <C>keep_one(n, pairs)</C>, the sorted smallest index of each connected cluster.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def lsh_candidates(sigs, b, r):
    return set()

def p_candidate(s, b, r):
    return s

def keep_one(n, pairs):
    return list(range(n))
`,
        solution: LSH,
        tests: [
          { name: "bands", code: `s = [[1, 1, 2, 2], [1, 1, 3, 3], [0, 0, 2, 2], [1, 1, 2, 2]]\nassert lsh_candidates(s, 2, 2) == {(0, 1), (0, 2), (0, 3), (1, 3), (2, 3)} and lsh_candidates(s, 1, 4) == {(0, 3)}\nassert abs(p_candidate(0.9, 3, 2) - (1 - 0.19 ** 3)) < 1e-12` },
          { name: "clusters", code: `assert keep_one(6, {(4, 5), (3, 4), (0, 1)}) == [0, 2, 3] and keep_one(3, set()) == [0, 1, 2]` },
        ],
      },
    },
    {
      key: "half",
      rung: "stretch",
      prompt: (
        <p>
          With 14 bands of 8 rows, at what Jaccard similarity is a pair exactly as likely as not to become a candidate? Give three
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.685, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Shingles see wording, not meaning. Paraphrases, translations and templated pages that say the same thing in different words need
        embeddings and clustering, the subject of semantic deduplication.
      </p>
    </>
  ),
};
