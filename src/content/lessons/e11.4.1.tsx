import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CollisionViz } from "@/components/viz/CollisionViz";
import type { LessonContent } from "@/lib/types";

const DOCS = `import hashlib, re

def doc_key(text):
    norm = " ".join(re.sub(r"[^\\w\\s]", "", text.lower()).split())   # ignore case, punctuation and spacing
    return hashlib.sha1(norm.encode()).hexdigest()[:16]               # 64 bits of the hash

def dedup_docs(docs):
    seen, kept = set(), []
    for i, d in enumerate(docs):
        k = doc_key(d)
        if k not in seen:                         # the first copy wins
            seen.add(k); kept.append(i)
    return kept

def shard_dedup(docs, n_shards):
    shards = [[] for _ in range(n_shards)]
    for i, d in enumerate(docs):
        shards[int(doc_key(d), 16) % n_shards].append(i)   # copies share a key, so they share a shard
    kept = []
    for idx in shards:
        kept += [idx[j] for j in dedup_docs([docs[i] for i in idx])]
    return sorted(kept)`;

const SUBSTR = `def suffix_array(tokens):
    return sorted(range(len(tokens)), key=lambda i: tokens[i:])

def lcp_array(tokens, sa):
    out = []
    for a, b in zip(sa, sa[1:]):                  # common prefix of neighbouring suffixes
        k = 0
        while a + k < len(tokens) and b + k < len(tokens) and tokens[a + k] == tokens[b + k]:
            k += 1
        out.append(k)
    return out

def longest_repeat(tokens):
    sa = suffix_array(tokens)
    lcp = lcp_array(tokens, sa)
    if not lcp or max(lcp) == 0:
        return []
    j = lcp.index(max(lcp))
    return tokens[sa[j]:sa[j] + lcp[j]]           # a repeat is a common prefix of two suffixes`;

export const lesson: LessonContent = {
  id: "e11.4.1",
  minutes: 45,
  links: {
    requires: ["e11.3.1", "e2.3.3"],
    revisits: ["e2.3.1", "e8.4.1"],
    foreshadows: ["e11.4.2", "e11.8.3"],
  },

  puzzle: (
    <>
      <p>
        A filtered crawl of ten billion documents contains the same licence text, the same news wire story and the same forum
        signature thousands of times. A model trained on it memorises these passages and repeats them word for word. Comparing every
        pair of documents would take on the order of <M>{"10^{20}"}</M> comparisons. How can exact copies, of whole documents and of
        long passages inside documents, be found in near-linear time on a cluster?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two documents are exact copies if their normalised text is equal, and equal texts have equal hashes. So hash each document once
        and keep the first document with each hash: one pass, with a set or a Bloom filter. Across machines, send each hash to the
        machine its value selects, so copies always meet. Repeated passages inside different documents need another tool: sort all
        suffixes of the corpus, and long repeats appear as long common prefixes of neighbouring suffixes.
      </p>
      <CollisionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="document-level deduplication">
        <p>
          <C>doc_key</C> normalises a document, ignoring case, punctuation and spacing, and keeps 64 bits of its SHA-1 hash.{" "}
          <C>dedup_docs</C> keeps the first document with each key. <C>shard_dedup</C> partitions documents by key across shards,
          deduplicates each shard independently, and merges the results, which is how the job runs as a map-reduce (e8.4.1).
        </p>
        <Code>{DOCS}</Code>
      </Definition>

      <Theorem title="sharding by key is exact">
        <p>
          For any number of shards, <C>shard_dedup</C> keeps exactly the documents that <C>dedup_docs</C> keeps.
        </p>
      </Theorem>
      <Proof>
        <p>
          Documents with the same key go to the same shard, and within a shard indices stay in their original order. So in each shard
          the first document with a given key is the first in the whole corpus with that key, and documents with different keys never
          interact. The union over shards is the global result, and sorting restores the order.
        </p>
      </Proof>

      <Theorem title="the birthday bound">
        <p>
          For n distinct documents with independent uniform b-bit hashes, the expected number of colliding pairs is{" "}
          <M>{"\\binom n2 2^{-b}"}</M>, and the probability of at least one collision is at most that, and close to{" "}
          <M>{"1 - e^{-n(n-1)/2^{b+1}}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each of the <M>{"\\binom n2"}</M> pairs collides with probability <M>{"2^{-b}"}</M>; linearity of expectation gives the mean,
          and the union bound gives the upper bound on the probability. Treating the pairs as nearly independent events gives the
          exponential form. A collision wrongly removes a distinct document, so the hash size is chosen so that the expected number
          of such losses is negligible.
        </p>
      </Proof>

      <Definition title="repeated substrings">
        <p>
          The suffix array of a token sequence lists the starting positions of its suffixes in sorted order (<C>suffix_array</C>,
          here by direct sorting; linear-time constructions exist). <C>lcp_array</C> gives the length of the longest common prefix of
          each pair of neighbours. Every repeated substring is a common prefix of two suffixes, and the longest one is the largest
          entry of the LCP array (<C>longest_repeat</C>).
        </p>
        <Code>{SUBSTR}</Code>
      </Definition>

      <Remark title="exact deduplication in practice">
        <p>
          Document hashing is the first deduplication step in nearly every pipeline, sometimes with a Bloom filter (e2.3.3) to stream
          through a corpus in fixed memory at a small false-positive rate. CCNet deduplicated paragraphs by hash across a snapshot,
          removing boilerplate that appears on many sites. Lee et al. built a suffix array over C4 and removed every repeated span of
          50 tokens or more, which reduced verbatim memorisation; the same machinery finds overlaps between training data and
          benchmarks (e11.8.3). Exact methods miss copies that differ by a timestamp or a typo, which is the job of the next lesson.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          One hash per document, partitioned by hash value across machines, removes exact copies in a single shuffle. A suffix array over
          the corpus, built in parallel and merged, finds the licence texts and signatures repeated inside otherwise distinct
          documents, and they can be cut out while the rest of each document is kept.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "pairs",
      rung: "check",
      prompt: (
        <p>
          A billion distinct documents get 64-bit hashes. About how many colliding pairs are expected? Give three significant figures.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0271, tolerance: 0.0001 },
    },
    {
      key: "first",
      rung: "check",
      prompt: <p>In the suffix array of the six characters of &quot;banana&quot;, numbered from 0, which position comes first?</p>,
      answer: { kind: "numeric", value: 5, tolerance: 0 },
    },
    {
      key: "shard",
      rung: "apply",
      prompt: <p>Why must documents be sent to shards by their hash rather than at random?</p>,
      answer: {
        kind: "choice",
        options: [
          "Copies have equal hashes, so partitioning by hash puts all copies of a document on the same shard where they can be compared",
          "Random partitions are slower to compute",
          "Hashes make documents shorter",
          "Shards cannot store documents whose hash they do not own",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import hashlib, re

def doc_key(text):
    norm = " ".join(re.sub(r"[^\\w\\s]", "", text.lower()).split())   # ignore case, punctuation and spacing
    return hashlib.sha1(norm.encode()).hexdigest()[:16]               # 64 bits of the hash

def dedup_docs(docs):
    seen, kept = set(), []
    for i, d in enumerate(docs):
        k = doc_key(d)
        if k not in seen:                         # the first copy wins
            seen.add(k); kept.append(i)
    return kept

def shard_dedup(docs, n_shards):
    shards = [[] for _ in range(n_shards)]
    for i, d in enumerate(docs):
        shards[int(doc_key(d), 16) % n_shards].append(i)   # copies share a key, so they share a shard
    kept = []
    for idx in shards:
        kept += [idx[j] for j in dedup_docs([docs[i] for i in idx])]
    return sorted(kept)

docs = ["Hello, World!", "hello world", "Hello  world.", "Hello there"]
print(dedup_docs(docs), shard_dedup(docs, 3) == dedup_docs(docs), doc_key("A b") == doc_key("a  B!"))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0, 3] True True", "[0, 1, 2, 3] True True", "[0, 2, 3] True True", "[0, 3] False True"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def suffix_array(tokens):
    return sorted(range(len(tokens)), key=lambda i: tokens[i:])

def lcp_array(tokens, sa):
    out = []
    for a, b in zip(sa, sa[1:]):                  # common prefix of neighbouring suffixes
        k = 0
        while a + k < len(tokens) and b + k < len(tokens) and tokens[a + k] == tokens[b + k]:
            k += 1
        out.append(k)
    return out

def longest_repeat(tokens):
    sa = suffix_array(tokens)
    lcp = lcp_array(tokens, sa)
    if not lcp or max(lcp) == 0:
        return []
    j = lcp.index(max(lcp))
    return tokens[sa[j]:sa[j] + lcp[j]]           # a repeat is a common prefix of two suffixes

t = list("abracadabra")
print(suffix_array(t)[:4], max(lcp_array(t, suffix_array(t))), "".join(longest_repeat(t)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[10, 7, 0, 3] 4 abra", "[0, 7, 10, 3] 4 abra", "[10, 7, 0, 3] 3 abr", "[10, 7, 3, 0] 4 abra"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>doc_key(text)</C>, removing characters that are neither word characters nor whitespace after lower-casing; and{" "}
          <C>dedup_docs(docs)</C> and <C>shard_dedup(docs, n_shards)</C>, each returning kept indices in increasing order.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import hashlib, re

def doc_key(text):
    return text

def dedup_docs(docs):
    return list(range(len(docs)))

def shard_dedup(docs, n_shards):
    return list(range(len(docs)))
`,
        solution: DOCS,
        tests: [
          { name: "key", code: `assert doc_key(" It's  OK ") == doc_key("its ok") == hashlib.sha1(b"its ok").hexdigest()[:16] and doc_key("a b") != doc_key("ab")\nassert dedup_docs(["x", "y", "X.", "z", " y"]) == [0, 1, 3]` },
          { name: "shard", code: `d = [f"doc {i % 7}" for i in range(30)] + ["Doc 3!"]\nassert all(shard_dedup(d, n) == list(range(7)) for n in (1, 2, 5))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>suffix_array(tokens)</C>; <C>lcp_array(tokens, sa)</C>; and <C>longest_repeat(tokens)</C>, returning an empty list
          when nothing repeats and the first longest repeat in suffix-array order otherwise.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def suffix_array(tokens):
    return list(range(len(tokens)))

def lcp_array(tokens, sa):
    return [0] * max(len(sa) - 1, 0)

def longest_repeat(tokens):
    return []
`,
        solution: SUBSTR,
        tests: [
          { name: "sa", code: `t = [3, 1, 3, 1, 2]\nassert suffix_array(t) == [3, 1, 4, 2, 0] and lcp_array(t, [3, 1, 4, 2, 0]) == [1, 0, 0, 2]` },
          { name: "repeat", code: `assert longest_repeat(list("mississippi")) == list("issi") and longest_repeat([1, 2, 3]) == [] and longest_repeat([]) == []` },
        ],
      },
    },
    {
      key: "bits",
      rung: "stretch",
      prompt: (
        <p>
          Using <M>{"p \\approx n^2/2^{b+1}"}</M>, what is the smallest number of hash bits b for which ten billion documents have
          collision probability at most one in a million?
        </p>
      ),
      answer: { kind: "numeric", value: 86, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Hashes match only identical text. Pages that differ by a date, an advert or a few edited words need a hash that agrees on
        similar inputs: MinHash with locality-sensitive hashing, next.
      </p>
    </>
  ),
};
