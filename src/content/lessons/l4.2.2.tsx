import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SgnsOptimumViz } from "@/components/viz/SgnsOptimumViz";
import type { LessonContent } from "@/lib/types";

const PAIRS = `import numpy as np

def skipgram_pairs(tokens, window):
    pairs = []
    for i, w in enumerate(tokens):
        for j in range(max(0, i - window), min(len(tokens), i + window + 1)):
            if j != i:
                pairs.append((w, tokens[j]))
    return pairs

def pmi_matrix(pairs, V):
    N = np.zeros((V, V))
    for w, c in pairs:
        N[w, c] += 1
    total, rw, rc = N.sum(), N.sum(axis=1, keepdims=True), N.sum(axis=0, keepdims=True)
    with np.errstate(divide="ignore", invalid="ignore"):
        return N, np.log(N * total / (rw * rc))`;

const SGNS = `import numpy as np

def noise_dist(counts, alpha=0.75):
    p = np.asarray(counts, float) ** alpha
    return p / p.sum()

def sgns_fit(N, k, steps, lr=0.5):
    sig = lambda z: 1 / (1 + np.exp(-z))
    total, rw, rc = N.sum(), N.sum(axis=1, keepdims=True), N.sum(axis=0, keepdims=True)
    neg = k * rw * rc / total
    X = np.zeros(N.shape)
    for _ in range(steps):
        X += lr * (N * sig(-X) - neg * sig(X)) / (N + neg)
    return X`;

export const lesson: LessonContent = {
  id: "l4.2.2",
  minutes: 55,
  links: {
    requires: ["l4.2.1", "l3.3.2"],
    revisits: ["m12.2.1"],
    foreshadows: ["l4.2.4", "l4.3.1"],
  },

  puzzle: (
    <>
      <p>
        Train a tiny network to guess which words appear near a given word in a few billion words of text. Throw the network
        away and keep only its input vectors. Then compute king − man + woman, and the nearest word vector is queen. No one
        defined royalty or gender. What objective produces such regular geometry, and what exactly are these vectors
        computing?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        &quot;You shall know a word by the company it keeps.&quot; Word2vec turns that slogan into a prediction task: from a word,
        predict its neighbours. Doing this with a full softmax over the vocabulary is expensive, so the practical version asks
        a cheaper binary question: is this (word, context) pair real, or a random pair? The answer turns out to be clean. At
        the optimum, the dot product of a word vector and a context vector is the pointwise mutual information of the pair,
        how much more often they meet than chance, shifted by a constant. Word vectors are a compressed PMI table.
      </p>
      <SgnsOptimumViz />
    </>
  ),

  theory: (
    <>
      <Definition title="skip-gram">
        <p>
          Every word w has an input vector <M>{"v_w"}</M> and an output, or context, vector <M>{"u_w"}</M>. For each position in
          the corpus and each word c within a window of the centre word w, skip-gram models{" "}
          <M>{"p(c \\mid w) = \\exp(u_c^\\top v_w)/\\sum_{c'}\\exp(u_{c'}^\\top v_w)"}</M> and maximises the log-likelihood of the
          observed pairs. The normalising sum costs O(V) per pair.
        </p>
      </Definition>

      <Definition title="negative sampling">
        <p>
          Skip-gram with negative sampling instead maximises, for each observed pair,
        </p>
        <MD>{"\\log\\sigma(u_c^\\top v_w) + \\sum_{j=1}^{k}\\log\\sigma(-u_{n_j}^\\top v_w), \\qquad n_j \\sim P_n,"}</MD>
        <p>
          a logistic regression separating real pairs from k noise pairs. The noise distribution is the unigram distribution
          raised to the power 3/4 and renormalised, which samples rare words more often than their raw frequency.
        </p>
      </Definition>

      <Theorem title="word2vec factorises shifted PMI">
        <p>
          With noise drawn from the unigram distribution of contexts, and vectors free enough that each dot product{" "}
          <M>{"x_{wc} = u_c^\\top v_w"}</M> can be set independently, the expected objective is maximised at
        </p>
        <MD>{"x_{wc} = \\log\\frac{\\#(w, c)\\,|D|}{\\#(w)\\,\\#(c)} - \\log k = \\mathrm{PMI}(w, c) - \\log k,"}</MD>
        <p>
          where #(w, c) counts co-occurrences, #(w) and #(c) are marginal counts and |D| is the number of pairs.
        </p>
      </Theorem>
      <Proof>
        <p>
          Collect all terms involving the cell (w, c). It is a positive pair #(w, c) times, and among the{" "}
          <M>{"k\\,\\#(w)"}</M> negatives drawn for w, an expected fraction <M>{"\\#(c)/|D|"}</M> are c. So its contribution is{" "}
          <M>{"\\ell(x) = \\#(w,c)\\log\\sigma(x) + k\\,\\#(w)\\#(c)/|D|\\cdot\\log\\sigma(-x)"}</M>. This is concave, and since{" "}
          <M>{"\\tfrac{d}{dx}\\log\\sigma(x) = \\sigma(-x)"}</M>, setting the derivative to zero gives{" "}
          <M>{"\\#(w,c)\\sigma(-x) = k\\#(w)\\#(c)/|D|\\cdot\\sigma(x)"}</M>, that is,{" "}
          <M>{"e^x = \\#(w,c)|D|/(k\\#(w)\\#(c))"}</M>. With dimension d much smaller than the vocabulary, the cells cannot all
          be set independently, and SGNS performs a weighted low-rank factorisation of this shifted PMI matrix, weighting
          frequent pairs more. Pairs never seen together have PMI of minus infinity, which no finite vectors reach; their
          negative-sample term just pushes them apart.
        </p>
        <Code>{PAIRS}</Code>
      </Proof>

      <Example title="checking the optimum">
        <p>
          The code runs gradient ascent directly on the dot products of a two-word count table, with the expected positive and
          negative weights. It converges to PMI − log k to three decimals. In practice α = 3/4 replaces the unigram noise
          distribution, which changes #(c) in the formula to a smoothed count and reduces the large PMI values of rare contexts.
        </p>
        <Code>{SGNS}</Code>
      </Example>

      <Remark title="analogies, and their limits">
        <p>
          If PMI with every context word decomposes into additive parts, for example a royalty part and a gender part, then the
          difference <M>{"v_{king} - v_{man}"}</M> isolates royalty, and adding <M>{"v_{woman}"}</M> lands near{" "}
          <M>{"v_{queen}"}</M>. The famous results excluded the three query words from the candidates, which flatters the
          method, and analogies fail on many relations. Word2vec also gives one vector per word type, so the river bank and the
          savings bank share a vector; the contextual embeddings of transformers remove that limitation.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "pairs",
      rung: "check",
      prompt: <p>How many (word, context) pairs does skip-gram extract from a 10-word sentence with a window of 2 on each side?</p>,
      answer: { kind: "numeric", value: 34, tolerance: 0.0001 },
    },
    {
      key: "opt",
      rung: "check",
      prompt: <p>A word and a context co-occur four times as often as chance. With k = 5 negatives, what dot product does SGNS converge to?</p>,
      answer: { kind: "numeric", value: -0.2231, tolerance: 0.0005 },
    },
    {
      key: "alpha",
      rung: "apply",
      prompt: <p>What does raising the unigram counts to the power 3/4 in the noise distribution achieve?</p>,
      answer: {
        kind: "choice",
        options: [
          "Rare words are drawn as negatives more often than their frequency, and very common words less often",
          "It makes the noise distribution exactly uniform",
          "It removes the need for negative samples",
          "It makes frequent words more likely as negatives",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def skipgram_pairs(tokens, window):
    pairs = []
    for i, w in enumerate(tokens):
        for j in range(max(0, i - window), min(len(tokens), i + window + 1)):
            if j != i:
                pairs.append((w, tokens[j]))
    return pairs

def pmi_matrix(pairs, V):
    N = np.zeros((V, V))
    for w, c in pairs:
        N[w, c] += 1
    total, rw, rc = N.sum(), N.sum(axis=1, keepdims=True), N.sum(axis=0, keepdims=True)
    with np.errstate(divide="ignore", invalid="ignore"):
        return N, np.log(N * total / (rw * rc))

print(skipgram_pairs([0, 1, 2, 1], 1), len(skipgram_pairs(list(range(10)), 2)))
N, P = pmi_matrix([(0, 1), (1, 0), (0, 0), (1, 1), (0, 1), (1, 0)], 2); print(N.tolist(), np.round(P, 3).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(0, 1), (1, 0), (1, 2), (2, 1), (2, 1), (1, 2)] 34\n[[1.0, 2.0], [2.0, 1.0]] [[-0.405, 0.288], [0.288, -0.405]]",
          "[(0, 1), (1, 0), (1, 2), (2, 1), (2, 1), (1, 2)] 36\n[[1.0, 2.0], [2.0, 1.0]] [[-0.405, 0.288], [0.288, -0.405]]",
          "[(0, 1), (1, 2), (2, 1)] 34\n[[1.0, 2.0], [2.0, 1.0]] [[-0.405, 0.288], [0.288, -0.405]]",
          "[(0, 1), (1, 0), (1, 2), (2, 1), (2, 1), (1, 2)] 34\n[[1.0, 2.0], [2.0, 1.0]] [[0.405, -0.288], [-0.288, 0.405]]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def noise_dist(counts, alpha=0.75):
    p = np.asarray(counts, float) ** alpha
    return p / p.sum()

def sgns_fit(N, k, steps, lr=0.5):
    sig = lambda z: 1 / (1 + np.exp(-z))
    total, rw, rc = N.sum(), N.sum(axis=1, keepdims=True), N.sum(axis=0, keepdims=True)
    neg = k * rw * rc / total
    X = np.zeros(N.shape)
    for _ in range(steps):
        X += lr * (N * sig(-X) - neg * sig(X)) / (N + neg)
    return X

print(noise_dist([100, 10, 1]).round(3).tolist(), noise_dist([1, 1]).tolist())
N = np.array([[8.0, 2.0], [2.0, 8.0]]); X = sgns_fit(N, 2, 3000); print(np.round(X, 3).tolist(), np.round(np.log(N * 20 / 100) - np.log(2), 3).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.827, 0.147, 0.026] [0.5, 0.5]\n[[-0.223, -1.609], [-1.609, -0.223]] [[-0.223, -1.609], [-1.609, -0.223]]",
          "[0.901, 0.09, 0.009] [0.5, 0.5]\n[[-0.223, -1.609], [-1.609, -0.223]] [[-0.223, -1.609], [-1.609, -0.223]]",
          "[0.827, 0.147, 0.026] [0.5, 0.5]\n[[0.47, -0.916], [-0.916, 0.47]] [[-0.223, -1.609], [-1.609, -0.223]]",
          "[0.827, 0.147, 0.026] [1.0, 1.0]\n[[-0.223, -1.609], [-1.609, -0.223]] [[-0.223, -1.609], [-1.609, -0.223]]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>skipgram_pairs(tokens, window)</C>, listing (centre, context) pairs in order of position, and{" "}
          <C>pmi_matrix(pairs, V)</C>, returning the count matrix and the PMI matrix (minus infinity where a pair never occurs, and undefined for a context that never occurs).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def skipgram_pairs(tokens, window):
    return []

def pmi_matrix(pairs, V):
    return np.zeros((V, V)), np.zeros((V, V))
`,
        solution: PAIRS,
        tests: [
          { name: "pairs", code: `assert skipgram_pairs([5, 6, 7], 2) == [(5, 6), (5, 7), (6, 5), (6, 7), (7, 5), (7, 6)] and len(skipgram_pairs(list(range(10)), 3)) == 48 and skipgram_pairs([1], 2) == []` },
          { name: "pmi", code: `N, P = pmi_matrix([(0, 0), (0, 1), (1, 1), (1, 1), (2, 1)], 3)
assert N.tolist() == [[1, 1, 0], [0, 2, 0], [0, 1, 0]] and abs(P[0, 0] - np.log(5 / 2)) < 1e-9 and abs(P[1, 1] - np.log(10 / 8)) < 1e-9 and np.isneginf(P[1, 0]) and np.isnan(P[2, 2])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>noise_dist(counts, alpha)</C> and <C>sgns_fit(N, k, steps, lr)</C>, which runs gradient ascent directly on a
          matrix of dot products using the expected SGNS objective for the count matrix N, with unigram noise.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def noise_dist(counts, alpha=0.75):
    return np.ones(len(counts)) / len(counts)

def sgns_fit(N, k, steps, lr=0.5):
    return np.zeros(N.shape)
`,
        solution: SGNS,
        tests: [
          { name: "noise", code: `p = noise_dist([16, 1], 0.5); assert np.allclose(p, [0.8, 0.2]) and np.allclose(noise_dist([3, 3, 3]), 1 / 3) and np.allclose(noise_dist([2, 1], 1.0), [2 / 3, 1 / 3])` },
          { name: "fit", code: `N = np.array([[5.0, 1.0, 2.0], [1.0, 3.0, 1.0], [2.0, 1.0, 4.0]]); X = sgns_fit(N, 3, 4000); T = np.log(N * N.sum() / (N.sum(1, keepdims=True) * N.sum(0, keepdims=True))) - np.log(3)
assert np.allclose(X, T, atol=1e-3)` },
        ],
      },
    },
    {
      key: "sq",
      rung: "stretch",
      prompt: <p>With counts (100, 10, 1) and α = 1/2, what probability does the noise distribution give the second word?</p>,
      answer: { kind: "numeric", value: 0.2233, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Word2vec learns vectors by predicting neighbours. Autoencoders, next, learn vectors by predicting the input itself
        through a bottleneck, and the question becomes what the bottleneck forces them to keep.
      </p>
    </>
  ),
};
