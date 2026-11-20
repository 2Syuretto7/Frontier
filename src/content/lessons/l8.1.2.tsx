import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TemperatureMixViz } from "@/components/viz/TemperatureMixViz";
import type { LessonContent } from "@/lib/types";

const MIX = `import math

def temperature_mix(sizes, T):
    w = [n ** (1 / T) for n in sizes]
    s = sum(w)
    return [x / s for x in w]

def epochs(sizes, weights, budget):
    return [w * budget / n for n, w in zip(sizes, weights)]

def mixing_law_loss(r, c, k, t):
    return c + k * math.exp(sum(tj * rj for tj, rj in zip(t, r)))`;

const DEDUP = `import hashlib

def shingles(text, k):
    words = text.split()
    return {" ".join(words[i:i + k]) for i in range(len(words) - k + 1)}

def jaccard(a, b):
    return len(a & b) / len(a | b)

def minhash(sh, n):
    h = lambda seed, s: int(hashlib.md5(f"{seed}:{s}".encode()).hexdigest()[:8], 16)
    return [min(h(seed, s) for s in sh) for seed in range(n)]`;

export const lesson: LessonContent = {
  id: "l8.1.2",
  minutes: 55,
  links: {
    requires: ["l8.1.1", "l5.1.1"],
    revisits: ["m12.2.2", "m9.8.5"],
    foreshadows: ["l8.1.3", "l8.7.1"],
  },

  puzzle: (
    <>
      <p>
        The raw web holds hundreds of trillions of tokens, most of them boilerplate, spam, machine-generated lists and the
        same page copied a thousand times. A pretraining run can afford perhaps fifteen trillion. Two teams with the same
        architecture and the same compute can end up with models a whole generation apart, purely through which tokens they
        kept and how they weighted the sources. How do you decide what a model should read?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If the loss is the code length of the training distribution, then the training distribution is the thing being
        modelled. Filtering removes text whose structure is not worth learning, deduplication stops the model spending
        capacity on memorising copies, and the mixture weights decide how much of the model&apos;s finite capacity each source
        gets. Small sources pose the sharpest trade: give them a fair share and their few tokens must be repeated many times.
      </p>
      <TemperatureMixViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the filtering pipeline">
        <p>
          A modern web pipeline runs, in order: text extraction from HTML; language identification; heuristic filters, such as
          the Gopher rules on document length, mean word length, the fraction of lines ending in punctuation and the ratio of
          symbols to words; deduplication, exact and approximate; and model-based quality filtering, in which a small
          classifier, often a fastText linear model on n-gram features, scores each document by how much it resembles a
          reference set. FineWeb-Edu trains that classifier on labels from a large model asked to rate educational value;
          DCLM trains it on instruction-style text. Keeping only the top few percent by such a score improves knowledge and
          reasoning benchmarks at a fixed token budget by margins that architecture changes rarely match.
        </p>
      </Definition>

      <Theorem title="MinHash estimates Jaccard similarity">
        <p>
          Represent a document by its set of word k-grams, its shingles (<C>shingles</C>), and compare two documents by the Jaccard
          similarity <M>{"J(A, B) = |A \\cap B| / |A \\cup B|"}</M> (<C>jaccard</C>). For a random hash function h with no collisions,
        </p>
        <MD>{"\\Pr\\big[\\min_{a \\in A} h(a) = \\min_{b \\in B} h(b)\\big] = J(A, B)"}</MD>
        <p>
          so the fraction of n independent hashes on which the two minima agree is an unbiased estimate of J with standard
          error at most <M>{"1/(2\\sqrt n)"}</M> (<C>minhash</C>). Each document is reduced to n numbers once, and comparisons no longer
          touch the text.
        </p>
        <Code>{DEDUP}</Code>
      </Theorem>
      <Proof>
        <p>
          The element of <M>{"A \\cup B"}</M> with the smallest hash is equally likely to be any of its <M>{"|A \\cup B|"}</M> elements. The two
          minima agree exactly when that element lies in both sets, which has probability <M>{"|A \\cap B| / |A \\cup B|"}</M>. The
          agreements are independent Bernoulli(J) trials, with variance <M>{"J(1-J)/n \\le 1/(4n)"}</M>.
        </p>
      </Proof>

      <Remark title="finding pairs without comparing all pairs">
        <p>
          Comparing every pair of a billion documents is impossible. Locality-sensitive hashing splits the n hashes into b bands
          of r rows and calls two documents candidates if any band matches exactly, which happens with probability{" "}
          <M>{"1 - (1 - J^r)^b"}</M>. This is an S-shaped curve in J with its steep part near <M>{"(1/b)^{1/r}"}</M>, so with 20 bands of 5 rows a pair
          at similarity 0.7 becomes a candidate 97 percent of the time and a pair at 0.3 only 5 percent of the time.
        </p>
      </Remark>

      <Definition title="mixture weights and temperature sampling">
        <p>
          With sources of sizes <M>{"n_1, \\dots, n_m"}</M> tokens, sample source i with probability
        </p>
        <MD>{"r_i = \\frac{n_i^{1/T}}{\\sum_j n_j^{1/T}}"}</MD>
        <p>
          (<C>temperature_mix</C>). T = 1 samples by size, and large T approaches uniform; multilingual models such as mT5 used about
          T = 3.3. Over a budget of D tokens, source i is seen <M>{"r_i D / n_i"}</M> times (<C>epochs</C>), which is the quantity the next
          lesson shows must stay small.
        </p>
      </Definition>

      <Definition title="choosing the mixture by experiment">
        <p>
          Mixtures are now chosen by fitting small runs. Data mixing laws model the loss on target domain i as{" "}
          <M>{"L_i(r) = c_i + k_i \\exp\\big(\\sum_j t_{ij} r_j\\big)"}</M> (<C>mixing_law_loss</C>), fitted on a few dozen small models trained on
          different mixtures and then optimised; RegMix fits a regression over hundreds of tiny runs; DoReMi trains a small proxy
          with a minimax objective that up-weights the domains where it lags a reference model most. The bet in each case is
          that the best mixture at small scale stays good at large scale, which holds roughly but not exactly.
        </p>
        <Code>{MIX}</Code>
      </Definition>

      <Example title="a published mixture">
        <p>
          The Llama 3 report gives its final pretraining mixture as roughly half general knowledge, a quarter mathematics and
          reasoning, 17 percent code and 8 percent multilingual text, chosen by scaling-law experiments of exactly this kind on
          small models. Code and mathematics are far above their share of the web, because they help reasoning on other
          domains, a point taken up in l8.1.4.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "temp",
      rung: "check",
      prompt: <p>Three sources hold 800, 150 and 50 billion tokens. With temperature sampling at T = 3, what share of the mixture does the smallest source get? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.2015, tolerance: 0.0002 },
    },
    {
      key: "jac",
      rung: "check",
      prompt: <p>With word 2-gram shingles, what is the Jaccard similarity of &ldquo;the cat sat on the mat&rdquo; and &ldquo;the cat sat on a mat&rdquo;? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.4286, tolerance: 0.0002 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does raising the sampling temperature not simply make the mixture better for small languages?</p>,
      answer: {
        kind: "choice",
        options: [
          "Their share grows but their supply does not, so their tokens are repeated many times and the value of each repetition falls",
          "Temperature sampling removes the large languages entirely",
          "Higher temperature makes the model's predictions more random at inference time",
          "Small languages cannot be tokenised at higher temperature",
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

def temperature_mix(sizes, T):
    w = [n ** (1 / T) for n in sizes]
    s = sum(w)
    return [x / s for x in w]

def epochs(sizes, weights, budget):
    return [w * budget / n for n, w in zip(sizes, weights)]

def mixing_law_loss(r, c, k, t):
    return c + k * math.exp(sum(tj * rj for tj, rj in zip(t, r)))

print([round(x, 3) for x in temperature_mix([9, 1], 1)], [round(x, 3) for x in temperature_mix([9, 1], 2)])
print(epochs([100, 10], [0.5, 0.5], 40), round(mixing_law_loss([0.5, 0.5], 2.0, 1.0, [-1.0, 0.0]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.9, 0.1] [0.75, 0.25]\n[0.2, 2.0] 2.6065",
          "[0.9, 0.1] [0.964, 0.036]\n[0.2, 2.0] 2.6065",
          "[0.9, 0.1] [0.75, 0.25]\n[5.0, 0.5] 2.6065",
          "[0.9, 0.1] [0.75, 0.25]\n[0.2, 2.0] 1.6065",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import hashlib

def shingles(text, k):
    words = text.split()
    return {" ".join(words[i:i + k]) for i in range(len(words) - k + 1)}

def jaccard(a, b):
    return len(a & b) / len(a | b)

def minhash(sh, n):
    h = lambda seed, s: int(hashlib.md5(f"{seed}:{s}".encode()).hexdigest()[:8], 16)
    return [min(h(seed, s) for s in sh) for seed in range(n)]

print(sorted(shingles("a b c a b", 2)), jaccard({1, 2, 3}, {2, 3, 4}))
m = minhash(shingles("x y z", 2), 3); print(len(m), m == minhash({"y z", "x y"}, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['a b', 'b c', 'c a'] 0.5\n3 True",
          "['a b', 'a b', 'b c', 'c a'] 0.5\n3 True",
          "['a b', 'b c', 'c a'] 0.6667\n3 True",
          "['a b', 'b c', 'c a'] 0.5\n3 False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>temperature_mix(sizes, T)</C>, <C>epochs(sizes, weights, budget)</C> and{" "}
          <C>mixing_law_loss(r, c, k, t)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def temperature_mix(sizes, T):
    return [n / sum(sizes) for n in sizes]

def epochs(sizes, weights, budget):
    return [budget / n for n in sizes]

def mixing_law_loss(r, c, k, t):
    return c + k
`,
        solution: MIX,
        tests: [
          { name: "mix", code: `w = temperature_mix([4, 1], 2)\nassert abs(w[0] - 2 / 3) < 1e-12 and abs(w[1] - 1 / 3) < 1e-12 and abs(sum(temperature_mix([5, 7, 9], 100)) - 1) < 1e-12` },
          { name: "epochs", code: `e = epochs([10, 20], [0.25, 0.75], 80)\nassert abs(e[0] - 2) < 1e-12 and abs(e[1] - 3) < 1e-12 and abs(mixing_law_loss([1, 2], 1.0, 2.0, [0.5, -0.25]) - 3) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>shingles(text, k)</C>, the set of word k-grams joined by spaces, <C>jaccard(a, b)</C>, and <C>minhash(sh, n)</C>, the list
          of minima over the set of <M>{"h_s"}</M> for seeds s = 0, …, n − 1, where <M>{"h_s(x)"}</M> is the integer value of the first eight hex
          digits of the MD5 digest of the string &ldquo;s:x&rdquo;.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import hashlib

def shingles(text, k):
    return set(text.split())

def jaccard(a, b):
    return len(a & b) / max(len(a), len(b))

def minhash(sh, n):
    return [0] * n
`,
        solution: DEDUP,
        tests: [
          { name: "jaccard", code: `a = shingles("the cat sat on the mat", 2)\nb = shingles("the cat sat on a mat", 2)\nassert a == {"the cat", "cat sat", "sat on", "on the", "the mat"} and abs(jaccard(a, b) - 3 / 7) < 1e-12` },
          { name: "minhash", code: `h = lambda s, x: int(hashlib.md5(f"{s}:{x}".encode()).hexdigest()[:8], 16)\nassert minhash({"p", "q"}, 2) == [min(h(0, "p"), h(0, "q")), min(h(1, "p"), h(1, "q"))]\nA = shingles(" ".join(map(str, range(200))), 3)\nB = shingles(" ".join(map(str, range(50, 250))), 3)\nest = sum(x == y for x, y in zip(minhash(A, 200), minhash(B, 200))) / 200\nassert abs(est - jaccard(A, B)) < 0.08` },
        ],
      },
    },
    {
      key: "law",
      rung: "stretch",
      prompt: (
        <p>
          Two domains share a mixture, with code share r and web share 1 − r. Fitted mixing laws give{" "}
          <M>{"L_{\\text{code}} = 2 + 0.8e^{-3r}"}</M> and <M>{"L_{\\text{web}} = 2.2 + 0.6e^{-2(1-r)}"}</M>. Which r minimises the sum of the two
          losses? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.5386, tolerance: 0.0002 },
    },
  ],

  glimpse: (
    <>
      <p>
        The viz showed that a generous share of a small source means many epochs of it. The next lesson asks how much
        repetition costs, and what to do when the high-quality text runs out.
      </p>
    </>
  ),
};
