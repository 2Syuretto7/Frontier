import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RrfFusionViz } from "@/components/viz/RrfFusionViz";
import type { LessonContent } from "@/lib/types";

const BM25 = `import math

def idf(N, df):
    return math.log((N - df + 0.5) / (df + 0.5) + 1)

def bm25(query, doc, docs, k1=1.5, b=0.75):
    avgdl = sum(len(d) for d in docs) / len(docs)
    score = 0.0
    for t in query:
        tf = doc.count(t)
        df = sum(t in d for d in docs)
        score += idf(len(docs), df) * tf * (k1 + 1) / (tf + k1 * (1 - b + b * len(doc) / avgdl))   # saturates in tf
    return score

def top_k(query, docs, k):
    order = sorted(range(len(docs)), key=lambda i: -bm25(query, docs[i], docs))
    return order[:k]`;

const FUSE = `def rrf(rankings, k=60):
    score = {}
    for ranking in rankings:
        for r, d in enumerate(ranking, 1):
            score[d] = score.get(d, 0) + 1 / (k + r)       # only ranks matter, not raw scores
    return sorted(score, key=lambda d: -score[d])

def recall_at_k(retrieved, relevant, k):
    return len(set(retrieved[:k]) & relevant) / len(relevant)

def mrr(retrieved_lists, relevant_sets):
    total = 0.0
    for ret, rel in zip(retrieved_lists, relevant_sets):
        total += next((1 / r for r, d in enumerate(ret, 1) if d in rel), 0.0)
    return total / len(retrieved_lists)`;

export const lesson: LessonContent = {
  id: "l13.2.3",
  minutes: 50,
  links: {
    requires: ["l13.2.1"],
    revisits: ["l8.7.3", "l8.7.2"],
    foreshadows: ["l13.3.2"],
  },

  puzzle: (
    <>
      <p>
        A company wants its assistant to answer questions from ten thousand internal documents written after the
        model&apos;s training ended. Fine-tuning on them is slow, must be redone whenever they change, and does not let the
        model cite a source. Putting all of them in the context window is impossible. The alternative is to search the
        documents for each question and show the model only what it needs. Which search, keyword or embedding, finds the
        right passage, how should their results be combined, and does the model use a passage just because it is there?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Retrieval-augmented generation splits the work. A retriever narrows millions of passages to a handful, and the model
        reads them and answers. Keyword search excels at exact names, codes and rare words; embedding search finds
        paraphrases that share no words with the question. Their scores live on different scales, so the robust way to
        combine them uses only the ranks. The model, finally, has to find the relevant passage among the retrieved ones, and
        where it sits in the context turns out to matter.
      </p>
      <RrfFusionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the pipeline">
        <p>
          Documents are split into chunks of a few hundred tokens, each indexed for keyword search and embedded as a vector.
          For a question, the retriever returns the top k chunks (<C>top_k</C>), optionally reordered by a slower reranker
          that reads question and chunk together, and the chunks are placed in the prompt with instructions to answer from
          them and cite them. Retrieval quality is measured by recall@k, the fraction of relevant chunks among the top k{" "}
          (<C>recall_at_k</C>), and mean reciprocal rank, the average of one over the rank of the first relevant result{" "}
          (<C>mrr</C>).
        </p>
      </Definition>

      <Definition title="BM25">
        <p>
          For a query of terms t, a document d of length |d| in a collection of N documents with average length{" "}
          <M>{"\\bar\\ell"}</M>, BM25 scores
        </p>
        <MD>{"\\sum_{t} \\mathrm{idf}(t)\\, \\frac{f_{t,d}(k_1 + 1)}{f_{t,d} + k_1\\big(1 - b + b\\,|d|/\\bar\\ell\\big)}, \\qquad \\mathrm{idf}(t) = \\ln\\Big(\\frac{N - n_t + 0.5}{n_t + 0.5} + 1\\Big),"}</MD>
        <p>
          where <M>{"f_{t,d}"}</M> counts t in d and <M>{"n_t"}</M> is the number of documents containing t (<C>idf</C>,{" "}
          <C>bm25</C>). Typical values are <M>{"k_1 \\in [1.2, 2]"}</M> and b = 0.75.
        </p>
        <Code>{BM25}</Code>
      </Definition>

      <Theorem title="saturation and length normalisation">
        <p>
          For fixed idf, a term&apos;s BM25 contribution increases with <M>{"f_{t,d}"}</M> but never exceeds{" "}
          <M>{"(k_1 + 1)\\,\\mathrm{idf}(t)"}</M>; for b &gt; 0 it decreases with document length, and for b = 0 it does not
          depend on length.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"K = k_1(1 - b + b|d|/\\bar\\ell) > 0"}</M>. The contribution is <M>{"\\mathrm{idf}\\,(k_1+1) f/(f + K)"}</M>,
          and <M>{"f/(f+K)"}</M> has derivative <M>{"K/(f+K)^2 > 0"}</M> in f and tends to 1 as f grows, which gives the
          monotonicity and the bound. K increases with |d| exactly when b &gt; 0, and the contribution decreases in K. So the
          tenth mention of a word adds little, unlike raw term counts, and a long document must mention a word more often to
          score as highly as a short one.
        </p>
      </Proof>

      <Definition title="dense retrieval and fusion">
        <p>
          A dense retriever embeds questions and chunks with encoders trained contrastively on matching pairs and ranks by
          cosine similarity, using an approximate nearest-neighbour index. It matches meaning across different wording but
          can miss exact identifiers that BM25 finds easily. Reciprocal rank fusion combines rankings by scoring each document{" "}
          <M>{"\\sum_r 1/(k + \\mathrm{rank}_r)"}</M> (<C>rrf</C>), usually with k = 60. It ignores raw scores, which are not
          comparable across retrievers, and k sets how much a single first place counts against consistent good ranks.
        </p>
        <Code>{FUSE}</Code>
      </Definition>

      <Example title="lost in the middle">
        <p>
          When the one relevant passage was placed among twenty retrieved ones, models answered multi-document questions best
          when it was first or last and markedly worse when it was in the middle, a U-shaped curve, and sometimes worse than
          with no passages at all. More retrieved chunks raise recall but add distraction, so k trades the two. Rerankers that
          put the best chunk first, and training on long contexts with relevant material in varied positions, reduce the
          effect.
        </p>
      </Example>

      <Remark title="retrieval as a tool">
        <p>
          Fixed retrieve-then-read fails on questions that need several hops, such as finding a company&apos;s founder and
          then the founder&apos;s university. Giving the model a search tool lets it issue a query, read, and issue the next
          query based on what it learned, the pattern of the agents in the next chapter. Retrieved text is untrusted input
          like any tool result.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sat",
      rung: "check",
      prompt: (
        <p>
          A term appears 3 times in a document of average length, with <M>{"k_1 = 1.5"}</M>. By what factor does BM25
          multiply the term&apos;s idf?
        </p>
      ),
      answer: { kind: "numeric", value: 1.6667, tolerance: 0.001 },
    },
    {
      key: "rrf",
      rung: "check",
      prompt: (
        <p>
          With k = 60, what is the reciprocal rank fusion score of a document ranked first by one retriever and third by
          another?
        </p>
      ),
      answer: { kind: "numeric", value: 0.03227, tolerance: 0.00005 },
    },
    {
      key: "hybrid",
      rung: "apply",
      prompt: <p>Why combine keyword and embedding retrieval?</p>,
      answer: {
        kind: "choice",
        options: [
          "Keyword search finds exact rare terms such as identifiers, embeddings find paraphrases, and each misses what the other finds",
          "Embedding search is too slow to use alone",
          "BM25 scores and cosine similarities can be added directly",
          "Using two retrievers doubles recall at every k",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def idf(N, df):
    return math.log((N - df + 0.5) / (df + 0.5) + 1)

def bm25(query, doc, docs, k1=1.5, b=0.75):
    avgdl = sum(len(d) for d in docs) / len(docs)
    score = 0.0
    for t in query:
        tf = doc.count(t)
        df = sum(t in d for d in docs)
        score += idf(len(docs), df) * tf * (k1 + 1) / (tf + k1 * (1 - b + b * len(doc) / avgdl))   # saturates in tf
    return score

def top_k(query, docs, k):
    order = sorted(range(len(docs)), key=lambda i: -bm25(query, docs[i], docs))
    return order[:k]

D = [["cat", "sat", "mat"], ["dog", "sat"], ["cat", "cat", "cat", "dog"]]; print(round(idf(3, 2), 4), round(bm25(["cat"], D[0], D), 4), top_k(["cat", "dog"], D, 2))
print(round(bm25(["cat"], D[2], D), 4), round(bm25(["fish"], D[0], D), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.47 0.47 [2, 1]\n0.7231 0.0",
          "0.47 0.47 [2, 0]\n0.7231 0.0",
          "0.47 0.47 [2, 1]\n1.41 0.0",
          "0.47 1.175 [2, 1]\n0.7231 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def rrf(rankings, k=60):
    score = {}
    for ranking in rankings:
        for r, d in enumerate(ranking, 1):
            score[d] = score.get(d, 0) + 1 / (k + r)       # only ranks matter, not raw scores
    return sorted(score, key=lambda d: -score[d])

def recall_at_k(retrieved, relevant, k):
    return len(set(retrieved[:k]) & relevant) / len(relevant)

def mrr(retrieved_lists, relevant_sets):
    total = 0.0
    for ret, rel in zip(retrieved_lists, relevant_sets):
        total += next((1 / r for r, d in enumerate(ret, 1) if d in rel), 0.0)
    return total / len(retrieved_lists)

print(rrf([["a", "b", "c"], ["c", "a", "d"]], 60), rrf([["x", "y"], ["y", "x"]], 1))
print(recall_at_k(["d1", "d4", "d2"], {"d2", "d3"}, 2), recall_at_k(["d1", "d4", "d2"], {"d2", "d3"}, 3), mrr([["a", "b"], ["c", "d"]], [{"b"}, {"x"}]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['a', 'c', 'b', 'd'] ['x', 'y']\n0.0 0.5 0.25",
          "['c', 'a', 'b', 'd'] ['x', 'y']\n0.0 0.5 0.25",
          "['a', 'c', 'b', 'd'] ['y', 'x']\n0.0 0.5 0.25",
          "['a', 'c', 'b', 'd'] ['x', 'y']\n0.5 0.5 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Documents are lists of tokens. Write <C>idf(N, df)</C>, <C>bm25(query, doc, docs, k1=1.5, b=0.75)</C>, and{" "}
          <C>top_k(query, docs, k)</C>, returning document indices by descending score, earlier documents first on ties.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def idf(N, df):
    return 0.0

def bm25(query, doc, docs, k1=1.5, b=0.75):
    return float(sum(doc.count(t) for t in query))

def top_k(query, docs, k):
    return list(range(k))
`,
        solution: BM25,
        tests: [
          { name: "bm25", code: `import math\nassert abs(idf(10, 0) - math.log(22)) < 1e-12 and bm25(["z"], ["a"], [["a"]]) == 0.0` },
          { name: "rank", code: `assert top_k(["b"], [["a"], ["b"], ["b", "b"]], 2) == [2, 1]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rrf(rankings, k=60)</C>, returning document ids by descending fused score with ties in order of first
          appearance; <C>recall_at_k(retrieved, relevant, k)</C>; and <C>mrr(retrieved_lists, relevant_sets)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def rrf(rankings, k=60):
    return rankings[0]

def recall_at_k(retrieved, relevant, k):
    return 1.0

def mrr(retrieved_lists, relevant_sets):
    return 0.0
`,
        solution: FUSE,
        tests: [
          { name: "rrf", code: `assert rrf([["p", "q"], ["q"]], 0) == ["q", "p"]` },
          { name: "metrics", code: `assert recall_at_k(["a"], {"a", "b"}, 1) == 0.5 and mrr([["x", "y", "z"]], [{"z"}]) == 1 / 3` },
        ],
      },
    },
    {
      key: "cap",
      rung: "stretch",
      prompt: (
        <p>
          In a collection of 1000 documents, a term appears in 10. With <M>{"k_1 = 1.5"}</M>, what is the largest
          contribution the term can make to a BM25 score?
        </p>
      ),
      answer: { kind: "numeric", value: 11.3934, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Tools so far are called once or a few times per question. An agent calls them in a loop, deciding after each
        observation what to do next, for as many steps as the task needs, and that loop is where the next chapter begins.
      </p>
    </>
  ),
};
