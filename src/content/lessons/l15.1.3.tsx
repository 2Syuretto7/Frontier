import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CitationRankViz } from "@/components/viz/CitationRankViz";
import type { LessonContent } from "@/lib/types";

const RANK = `def in_degree(cites):
    deg = {p: 0 for p in cites}
    for refs in cites.values():
        for q in refs:
            deg[q] += 1
    return deg

def pagerank(cites, d=0.85, iters=100):
    n = len(cites)
    r = {p: 1 / n for p in cites}
    for _ in range(iters):
        dangling = sum(r[p] for p in cites if not cites[p])     # papers that cite nothing spread evenly
        new = {p: (1 - d) / n + d * dangling / n for p in cites}
        for p, refs in cites.items():
            for q in refs:
                new[q] += d * r[p] / len(refs)                  # a paper passes its rank to what it cites
        r = new
    return r

def top_k(scores, k):
    return sorted(scores, key=lambda p: (-scores[p], p))[:k]`;

const SIMILAR = `def coupling(refs, a, b):
    return len(set(refs[a]) & set(refs[b]))                     # references the two papers share

def cocitation(refs, x, y):
    return sum(1 for r in refs.values() if x in r and y in r)   # papers that cite both

def most_similar(refs, a):
    others = [p for p in refs if p != a]
    return max(sorted(others), key=lambda p: coupling(refs, a, p))`;

export const lesson: LessonContent = {
  id: "l15.1.3",
  minutes: 45,
  links: {
    requires: ["l15.1.1"],
    revisits: ["l15.1.2"],
    foreshadows: ["l15.2.1"],
  },

  puzzle: (
    <>
      <p>
        You want to start research on sparse autoencoders, or on test-time compute, or any area you have not worked in.
        A search returns two thousand papers. You can read perhaps thirty properly. Which thirty, and how would you know
        when you have seen the shape of the field: its foundational papers, its rival approaches, and the questions
        nobody has answered yet?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Papers cite each other, and the citations form a directed graph. A paper is central if central papers cite it,
        a circular definition that PageRank makes precise. Papers that cite the same earlier work tend to be on the same
        problem, and papers that are often cited together tend to be related ideas; both give a way to cluster a field
        into its threads. A map built this way tells you where to start reading, and the places where threads ought to
        connect but do not are candidates for open problems.
      </p>
      <CitationRankViz />
    </>
  ),

  theory: (
    <>
      <Definition title="PageRank on a citation graph">
        <p>
          With n papers and damping d, a reader follows a random citation of the current paper with probability d and
          jumps to a uniformly random paper otherwise; from a paper that cites nothing, the reader jumps uniformly. The
          rank of a paper is the long-run share of time spent on it:
        </p>
        <MD>{"r_q = \\frac{1-d}{n} + d\\left(\\sum_{p \\to q} \\frac{r_p}{\\mathrm{out}(p)} + \\frac{1}{n}\\sum_{p:\\,\\mathrm{out}(p) = 0} r_p\\right)"}</MD>
        <p>
          (<C>pagerank</C>). Brin and Page introduced it for the web in 1998; for papers it corrects citation counts{" "}
          (<C>in_degree</C>) by weighting each citation by the importance of the citing paper (<C>top_k</C> lists the
          leaders).
        </p>
        <Code>{RANK}</Code>
      </Definition>

      <Theorem title="PageRank exists, is unique, and iteration finds it">
        <p>
          For <M>{"0 \\le d < 1"}</M>, the map T defined by the right-hand side has exactly one fixed point among
          probability vectors, and the iterates <M>{"T^t r^{(0)}"}</M> converge to it with{" "}
          <M>{"\\|T^t r^{(0)} - r^*\\|_1 \\le d^t \\|r^{(0)} - r^*\\|_1 \\le 2d^t"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          T maps probability vectors to probability vectors: each paper&apos;s rank is passed on in full, either along its
          citations or spread evenly, so the total stays 1. Write <M>{"T r = \\frac{1-d}{n}\\mathbf{1} + d P r"}</M>, where
          the matrix P moves the mass of each paper to its citations or uniformly, so every column of P is a probability
          vector. For probability vectors x and y,{" "}
          <M>{"\\|Tx - Ty\\|_1 = d\\|P(x - y)\\|_1 \\le d\\|x - y\\|_1"}</M>, since a matrix whose columns are probability
          vectors does not increase the <M>{"\\ell_1"}</M> norm: <M>{"\\sum_q |\\sum_p P_{qp} v_p| \\le \\sum_p |v_p| \\sum_q P_{qp} = \\|v\\|_1"}</M>. T is a
          contraction on a complete set, so by the Banach fixed-point theorem it has a unique fixed point and the iterates
          converge at rate d. Two probability vectors are at most 2 apart in <M>{"\\ell_1"}</M>, giving the last bound.
        </p>
      </Proof>

      <Definition title="coupling and co-citation">
        <p>
          Two papers are bibliographically coupled by the number of references they share (<C>coupling</C>), a measure
          Kessler proposed in 1963; it is fixed once both are published and groups papers working on the same problem.
          Two papers are co-cited by the number of later papers citing both (<C>cocitation</C>), Small&apos;s measure of
          1973; it grows over time and reflects how the field comes to see them as related. The paper most coupled to
          one you know is a natural next read (<C>most_similar</C>).
        </p>
        <Code>{SIMILAR}</Code>
      </Definition>

      <Theorem title="both are matrix products">
        <p>
          Let <M>{"A_{pq} = 1"}</M> when paper p cites q. Then the coupling of p and p&apos; is{" "}
          <M>{"(AA^\\top)_{pp'}"}</M> and the co-citation of q and q&apos; is <M>{"(A^\\top A)_{qq'}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"(AA^\\top)_{pp'} = \\sum_q A_{pq}A_{p'q}"}</M>, and each term is 1 exactly when both p and p&apos; cite q,
          so the sum counts shared references. Likewise{" "}
          <M>{"(A^\\top A)_{qq'} = \\sum_p A_{pq}A_{pq'}"}</M> counts the papers p citing both q and q&apos;. Clustering
          either matrix, or embedding papers with its leading eigenvectors, gives the threads of a field.
        </p>
      </Proof>

      <Example title="a three-paper check">
        <p>
          Papers x and z each cite y, and y cites nothing. By symmetry x and z share a rank a and y has rank 1 − 2a; at
          d = 0.85 the fixed-point equation for x is{" "}
          <M>{"a = 0.05 + 0.85(1 - 2a)/3"}</M>, giving a = 1/4.7 ≈ 0.213. The cited paper has about 0.574, under three
          times the rank of its citers, because the uniform jumps keep every paper above <M>{"(1-d)/n = 0.05"}</M>.
        </p>
      </Example>

      <Remark title="from graph to map">
        <p>
          Citation measures favour old papers, which have had time to collect citations, and fields that cite heavily;
          compare papers of similar age, and use co-citation for older work and coupling for recent work. Tools such as
          Connected Papers and the Semantic Scholar graph compute these maps for you. A useful written map lists, for each
          thread, its founding papers, its strongest current result, its standard benchmark and its unresolved
          disagreements; the gaps in that list feed the choice of problem in the next lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "iters",
      rung: "check",
      prompt: (
        <p>
          With damping 0.85 and starting from any probability vector, how many iterations does the bound{" "}
          <M>{"2d^t"}</M> require to guarantee an <M>{"\\ell_1"}</M> error of at most <M>{"10^{-6}"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 90, tolerance: 0.001 },
    },
    {
      key: "small",
      rung: "check",
      prompt: (
        <p>
          Papers A and C each cite B, and B cites nothing. With damping 0.7, what is B&apos;s PageRank? Give four
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.5455, tolerance: 0.0005 },
    },
    {
      key: "measure",
      rung: "apply",
      prompt: <p>Which measure is fixed as soon as two papers are published?</p>,
      answer: {
        kind: "choice",
        options: [
          "Bibliographic coupling, the number of references they share",
          "Co-citation, the number of later papers citing both",
          "PageRank",
          "Citation count",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def in_degree(cites):
    deg = {p: 0 for p in cites}
    for refs in cites.values():
        for q in refs:
            deg[q] += 1
    return deg

def pagerank(cites, d=0.85, iters=100):
    n = len(cites)
    r = {p: 1 / n for p in cites}
    for _ in range(iters):
        dangling = sum(r[p] for p in cites if not cites[p])     # papers that cite nothing spread evenly
        new = {p: (1 - d) / n + d * dangling / n for p in cites}
        for p, refs in cites.items():
            for q in refs:
                new[q] += d * r[p] / len(refs)                  # a paper passes its rank to what it cites
        r = new
    return r

def top_k(scores, k):
    return sorted(scores, key=lambda p: (-scores[p], p))[:k]

cites = {"a": ["b", "c"], "b": ["c"], "c": [], "d": ["c"]}
print(in_degree(cites), top_k(pagerank(cites), 2), round(sum(pagerank(cites).values()), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'a': 0, 'b': 1, 'c': 3, 'd': 0} ['c', 'b'] 1.0",
          "{'a': 2, 'b': 1, 'c': 0, 'd': 1} ['a', 'b'] 1.0",
          "{'a': 0, 'b': 1, 'c': 3, 'd': 0} ['c', 'a'] 1.0",
          "{'a': 0, 'b': 1, 'c': 3, 'd': 0} ['c', 'b'] 0.85",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def coupling(refs, a, b):
    return len(set(refs[a]) & set(refs[b]))                     # references the two papers share

def cocitation(refs, x, y):
    return sum(1 for r in refs.values() if x in r and y in r)   # papers that cite both

def most_similar(refs, a):
    others = [p for p in refs if p != a]
    return max(sorted(others), key=lambda p: coupling(refs, a, p))

refs = {"p": ["a", "b", "c"], "q": ["b", "c"], "r": ["a", "d"]}
print(coupling(refs, "p", "q"), coupling(refs, "q", "r"), cocitation(refs, "b", "c"), cocitation(refs, "a", "d"), most_similar(refs, "p"))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["2 0 2 1 q", "2 0 1 1 q", "2 1 2 1 r", "3 0 2 1 q"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          A graph maps each paper to the list of papers it cites; every cited paper is a key. Write{" "}
          <C>in_degree(cites)</C>; <C>pagerank(cites, d=0.85, iters=100)</C>, starting uniform and spreading the rank of
          papers that cite nothing evenly; and <C>top_k(scores, k)</C>, highest first with ties by name.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def in_degree(cites):
    return {p: len(r) for p, r in cites.items()}

def pagerank(cites, d=0.85, iters=100):
    return {p: 1 / len(cites) for p in cites}

def top_k(scores, k):
    return list(scores)[:k]
`,
        solution: RANK,
        tests: [
          { name: "degree", code: `g = {"x": ["y", "z"], "y": ["z"], "z": []}\nassert in_degree(g) == {"x": 0, "y": 1, "z": 2} and top_k({"a": 1, "b": 3, "c": 3}, 2) == ["b", "c"]` },
          { name: "rank", code: `g = {"x": ["y"], "y": [], "z": ["y"]}\nr = pagerank(g)\nassert abs(r["y"] - 0.574468) < 1e-5 and abs(sum(r.values()) - 1) < 1e-9 and abs(pagerank({"u": ["v"], "v": ["u"]}, 0.5)["u"] - 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>coupling(refs, a, b)</C>, <C>cocitation(refs, x, y)</C>, and <C>most_similar(refs, a)</C>, the other
          paper with the largest coupling to a, the alphabetically first on ties.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def coupling(refs, a, b):
    return 0

def cocitation(refs, x, y):
    return 0

def most_similar(refs, a):
    return a
`,
        solution: SIMILAR,
        tests: [
          { name: "counts", code: `refs = {"p": ["a", "b"], "q": ["a", "b", "c"], "r": ["c"]}\nassert coupling(refs, "p", "q") == 2 and coupling(refs, "p", "r") == 0 and cocitation(refs, "a", "b") == 2 and cocitation(refs, "a", "c") == 1` },
          { name: "similar", code: `refs = {"p": ["a"], "q": ["b"], "r": ["b"], "s": ["a", "b"]}\nassert most_similar(refs, "q") == "r" and most_similar(refs, "p") == "s" and most_similar({"m": [], "n": [], "o": []}, "o") == "m"` },
        ],
      },
    },
    {
      key: "damp",
      rung: "stretch",
      prompt: (
        <p>
          Paper A cites B and C, B cites C, and C cites nothing. With damping 0.5, what is C&apos;s PageRank? Give four
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.4545, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        A map of a field shows where its open questions are. The next chapter turns to doing research, starting with how
        to choose which of those questions to work on.
      </p>
    </>
  ),
};
