import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LshCurveViz } from "@/components/viz/LshCurveViz";
import type { LessonContent } from "@/lib/types";

const FILTER = `import hashlib

def norm(text):
    return " ".join(text.lower().split())                  # case and whitespace do not make a new document

def flags(text, min_words=50):
    words = text.split()
    out = []
    if len(words) < min_words:
        out.append("short")
    if words and not 3 <= sum(map(len, words)) / len(words) <= 10:
        out.append("word_length")
    if words and sum(any(ch.isalpha() for ch in w) for w in words) / len(words) < 0.8:
        out.append("symbols")
    return out

def clean(docs, min_words=50):
    seen, kept, stats = set(), [], {"duplicate": 0, "filtered": 0}
    for d in docs:
        h = hashlib.sha1(norm(d).encode()).hexdigest()
        if h in seen:
            stats["duplicate"] += 1
        elif flags(d, min_words):
            stats["filtered"] += 1
        else:
            kept.append(d)
        seen.add(h)
    return kept, stats`;

const NEAR = `import zlib

def shingles(text, k):
    w = text.split()
    return {" ".join(w[i:i + k]) for i in range(len(w) - k + 1)}

def minhash(sh, seeds):
    return [min(zlib.crc32(f"{s}:{x}".encode()) for x in sh) for s in seeds]

def candidate_prob(s, bands, rows):
    return 1 - (1 - s ** rows) ** bands                   # some band of r rows agrees completely`;

export const lesson: LessonContent = {
  id: "e15.2.1",
  minutes: 50,
  links: {
    requires: ["e15.1.3"],
    revisits: ["e11.3.1", "e11.4.1", "e11.4.2", "e11.6.1", "l8.1.2"],
    foreshadows: ["e15.2.2", "e15.3.3"],
  },

  puzzle: (
    <>
      <p>
        The budget calls for a few billion training tokens. A single snapshot of a web crawl offers hundreds of billions,
        most of them navigation menus, spam, boilerplate, machine-generated pages and copies of copies. Training on it
        raw wastes most of the budget and teaches the model to reproduce junk. Which steps turn that crawl, plus some
        code and mathematics, into a corpus worth the compute?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A corpus pipeline is a sequence of cheap filters followed by expensive ones. Extract text from HTML, identify
        the language, drop exact duplicates by hashing, drop documents that fail simple heuristics, then remove near
        duplicates with MinHash, and finally keep the documents a quality classifier scores highly. The resulting
        sources are mixed in chosen proportions. Each stage is measured: how many documents and tokens it removes, and
        a sample of what it removed, read by a person.
      </p>
      <LshCurveViz />
    </>
  ),

  theory: (
    <>
      <Definition title="heuristic filters and exact deduplication">
        <p>
          Rules in the style of the Gopher and C4 filters, as in e11.3.1, reject documents that are too short, whose
          mean word length is outside 3 to 10 characters, or in which fewer than 80% of words contain a letter{" "}
          (<C>flags</C>). Exact duplicates are found by hashing a normalised form of the text, lowercased with whitespace
          collapsed, and keeping the first occurrence (<C>norm</C>, <C>clean</C>), as in e11.4.1. Deduplicating before
          filtering lets the counts say which copies were removed for which reason.
        </p>
        <Code>{FILTER}</Code>
      </Definition>

      <Definition title="near-duplicates">
        <p>
          Two documents are near-duplicates if the Jaccard similarity of their sets of k-word shingles{" "}
          (<C>shingles</C>) is high. Comparing all pairs is impossible at scale. MinHash summarises each set by the
          minimum of each of several hash functions over its elements (<C>minhash</C>), and locality-sensitive hashing
          splits the signature into b bands of r rows, treating two documents as candidates if any band matches
          exactly (<C>candidate_prob</C>), as in e11.4.2.
        </p>
        <Code>{NEAR}</Code>
      </Definition>

      <Theorem title="MinHash estimates Jaccard similarity">
        <p>
          For a hash function h that orders the elements of <M>{"A \\cup B"}</M> uniformly at random,
        </p>
        <MD>{"\\Pr\\left[\\min_{x \\in A} h(x) = \\min_{x \\in B} h(x)\\right] = \\frac{|A \\cap B|}{|A \\cup B|}"}</MD>
        <p>
          and with b bands of r independent hashes, a pair of similarity s becomes a candidate with probability{" "}
          <M>{"1 - (1 - s^r)^b"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The element of <M>{"A \\cup B"}</M> with the smallest hash is equally likely to be any of its elements. The two
          minima agree exactly when that element lies in both sets, which has probability{" "}
          <M>{"|A \\cap B| / |A \\cup B| = s"}</M>. With independent hash functions, all r rows of a band agree with
          probability <M>{"s^r"}</M>, a band fails with probability <M>{"1 - s^r"}</M>, all b bands fail with probability{" "}
          <M>{"(1 - s^r)^b"}</M>, and the pair becomes a candidate otherwise. The curve rises steeply around{" "}
          <M>{"(1/b)^{1/r}"}</M>, so b and r set the similarity at which documents count as duplicates. Candidates are then
          checked by their estimated similarity, the fraction of agreeing signature entries.
        </p>
      </Proof>

      <Example title="the capstone pipeline">
        <p>
          A few crawl snapshots, extracted with a main-content extractor and filtered to English by a fastText
          classifier, then exact and near-duplicate removal with 5-word shingles and 20 bands of 5 rows, then the
          heuristics, then a classifier trained to score educational value, keeping the top fraction, as FineWeb-Edu did.
          Permissively licensed code, deduplicated in the same way, and a mathematics web corpus. Mixture weights start
          from published recipes and are adjusted by small ablations, as in e11.6.1 and l8.1.2.
        </p>
      </Example>

      <Remark title="what to record">
        <p>
          The data card records, for each source and stage, the documents and tokens in and out, the thresholds and
          classifier versions, samples of removed text and the final mixture with its number of epochs per source. A
          filter that removes 40% of documents should be read before it is trusted: heuristics designed for English
          prose quietly delete code, tables and mathematics, which is why those sources get their own pipelines.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cand",
      rung: "check",
      prompt: (
        <p>
          With 20 bands of 5 rows, what is the probability that two documents with Jaccard similarity 0.6 become a
          candidate pair? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.8019, tolerance: 0.0002 },
    },
    {
      key: "jacc",
      rung: "check",
      prompt: (
        <p>
          Using 2-word shingles, what is the Jaccard similarity of &quot;the cat sat on the mat&quot; and &quot;the cat sat
          on a mat&quot;? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.4286, tolerance: 0.0002 },
    },
    {
      key: "order",
      rung: "apply",
      prompt: <p>Why do pipelines run cheap filters such as exact deduplication before a model-based quality classifier?</p>,
      answer: {
        kind: "choice",
        options: [
          "The classifier is the most expensive step per document, so it should see only what the cheap steps keep",
          "The classifier cannot read duplicated text",
          "Exact deduplication changes the language of documents",
          "Filters must always run in alphabetical order",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import hashlib

def norm(text):
    return " ".join(text.lower().split())                  # case and whitespace do not make a new document

def flags(text, min_words=50):
    words = text.split()
    out = []
    if len(words) < min_words:
        out.append("short")
    if words and not 3 <= sum(map(len, words)) / len(words) <= 10:
        out.append("word_length")
    if words and sum(any(ch.isalpha() for ch in w) for w in words) / len(words) < 0.8:
        out.append("symbols")
    return out

def clean(docs, min_words=50):
    seen, kept, stats = set(), [], {"duplicate": 0, "filtered": 0}
    for d in docs:
        h = hashlib.sha1(norm(d).encode()).hexdigest()
        if h in seen:
            stats["duplicate"] += 1
        elif flags(d, min_words):
            stats["filtered"] += 1
        else:
            kept.append(d)
        seen.add(h)
    return kept, stats

print(norm("  A  b\\nC "), flags("ab cd ef", 2), flags("a b c", 5), flags("x1 22 33 44 abc", 1))
print(clean(["one two three", "One  two three", "x"], 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "a b c ['word_length'] ['short', 'word_length'] ['word_length', 'symbols']\n(['one two three'], {'duplicate': 1, 'filtered': 1})",
          "a b c [] ['short', 'word_length'] ['word_length', 'symbols']\n(['one two three'], {'duplicate': 1, 'filtered': 1})",
          "a b c ['word_length'] ['short'] ['word_length', 'symbols']\n(['one two three'], {'duplicate': 1, 'filtered': 1})",
          "a b c ['word_length'] ['short', 'word_length'] ['word_length', 'symbols']\n(['one two three', 'One  two three'], {'duplicate': 0, 'filtered': 1})",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import zlib

def shingles(text, k):
    w = text.split()
    return {" ".join(w[i:i + k]) for i in range(len(w) - k + 1)}

def minhash(sh, seeds):
    return [min(zlib.crc32(f"{s}:{x}".encode()) for x in sh) for s in seeds]

def candidate_prob(s, bands, rows):
    return 1 - (1 - s ** rows) ** bands                   # some band of r rows agrees completely

a, b = shingles("a b c d", 2), shingles("a b c e", 2); print(sorted(a), len(a & b) / len(a | b))
print(minhash({"q"}, [1, 2]) == minhash({"q"}, [1, 2]), candidate_prob(0.5, 2, 1), candidate_prob(1, 3, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['a b', 'b c', 'c d'] 0.5\nTrue 0.75 1",
          "['a b', 'b c', 'c d'] 0.6666666666666666\nTrue 0.75 1",
          "['a b', 'b c', 'c d'] 0.5\nTrue 0.5 1",
          "['a b', 'b c', 'c d'] 0.5\nFalse 0.75 1",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>norm(text)</C>; <C>flags(text, min_words=50)</C>, returning the failed rules among
          &quot;short&quot;, &quot;word_length&quot; and &quot;symbols&quot; in that order; and{" "}
          <C>clean(docs, min_words=50)</C>, returning the kept documents and counts of duplicates and filtered documents.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import hashlib

def norm(text):
    return text

def flags(text, min_words=50):
    return []

def clean(docs, min_words=50):
    return docs, {"duplicate": 0, "filtered": 0}
`,
        solution: FILTER,
        tests: [
          { name: "flags", code: `assert norm("X\\tY  z") == "x y z" and flags("hello there friend", 3) == [] and flags("$$$ ### hello", 1) == ["symbols"] and flags("", 1) == ["short"]` },
          { name: "clean", code: `kept, st = clean(["alpha beta", "x", "ALPHA beta", "x", "gamma delta"], 2); assert kept == ["alpha beta", "gamma delta"] and st == {"duplicate": 2, "filtered": 1}` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>shingles(text, k)</C>; <C>minhash(sh, seeds)</C>, using <C>zlib.crc32</C> of &quot;seed:shingle&quot; as
          the hash; and <C>candidate_prob(s, bands, rows)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import zlib

def shingles(text, k):
    return set(text.split())

def minhash(sh, seeds):
    return [0 for s in seeds]

def candidate_prob(s, bands, rows):
    return s
`,
        solution: NEAR,
        tests: [
          { name: "sh", code: `assert shingles("a b c", 3) == {"a b c"} and shingles("a b", 3) == set() and minhash({"u", "v"}, [7]) == [min(zlib.crc32(b"7:u"), zlib.crc32(b"7:v"))]` },
          { name: "prob", code: `assert abs(candidate_prob(0.5, 1, 1) - 0.5) < 1e-12 and abs(candidate_prob(0.5, 2, 2) - 0.4375) < 1e-12 and candidate_prob(0, 9, 3) == 0` },
        ],
      },
    },
    {
      key: "threshold",
      rung: "stretch",
      prompt: (
        <p>
          With 20 bands of 5 rows, at what Jaccard similarity is a pair exactly as likely as not to become a candidate?
          Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.5087, tolerance: 0.0002 },
    },
  ],

  glimpse: (
    <>
      <p>
        The corpus is text. The model reads tokens. The next lesson trains the tokeniser on this corpus and measures how
        well it compresses each part of the mixture.
      </p>
    </>
  ),
};
