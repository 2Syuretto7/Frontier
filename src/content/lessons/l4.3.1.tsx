import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { InterpLambdaViz } from "@/components/viz/InterpLambdaViz";
import type { LessonContent } from "@/lib/types";

const COUNTS = `import numpy as np
from collections import Counter

def ngram_counts(tokens, n):
    return Counter(tuple(tokens[i:i + n]) for i in range(len(tokens) - n + 1))

def add_k_bigram(tokens, V, k):
    c2, c1 = ngram_counts(tokens, 2), Counter(tokens[:-1])
    return lambda v, w: (c2[(v, w)] + k) / (c1[v] + k * V)

def perplexity(prob, tokens):
    logs = [np.log(prob(v, w)) for v, w in zip(tokens[:-1], tokens[1:])]
    return float(np.exp(-np.mean(logs)))`;

const SMOOTH = `from collections import Counter

def interpolated(tokens, V, lam):
    c2, c1, cu = Counter(zip(tokens[:-1], tokens[1:])), Counter(tokens[:-1]), Counter(tokens)
    uni = lambda w: (cu[w] + 1) / (len(tokens) + V)
    return lambda v, w: lam * (c2[(v, w)] / c1[v] if c1[v] else 0.0) + (1 - lam) * uni(w)

def kneser_ney(tokens, V, d=0.75):
    c2, c1 = Counter(zip(tokens[:-1], tokens[1:])), Counter(tokens[:-1])
    follow, precede = Counter(v for v, _ in c2), Counter(w for _, w in c2)
    def prob(v, w):
        pc = (precede[w] + 1) / (len(c2) + V)
        if c1[v] == 0:
            return pc
        return max(c2[(v, w)] - d, 0) / c1[v] + d * follow[v] / c1[v] * pc
    return prob`;

export const lesson: LessonContent = {
  id: "l4.3.1",
  minutes: 50,
  links: {
    requires: ["l4.2.1", "m12.4.2"],
    revisits: ["m12.4.1", "l0.2.4"],
    foreshadows: ["l4.3.2"],
  },

  puzzle: (
    <>
      <p>
        A bigram model trained on a large newspaper corpus has seen the word &quot;Francisco&quot; thousands of times, nearly
        always after &quot;San&quot;. Asked which word is likely to follow a context it has never seen before, a naive model
        happily suggests &quot;Francisco&quot;, because it is frequent. Yet &quot;glasses&quot;, which is rarer overall but follows
        dozens of different words, is a far better guess. What should a model count instead of raw frequency?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An n-gram model predicts the next word from only the previous n − 1 words, and estimates each conditional
        probability by counting. The trouble is that almost every possible n-gram never appears in training, so counting
        alone gives most test sentences probability zero. Every practical n-gram model is therefore a recipe for moving some
        probability from things it has seen to things it has not. The recipes differ in how much they move and where they put
        it. Mixing the bigram estimate with a unigram one, with the weight chosen on held-out text, already does well; how
        much to trust the bigram counts depends on how much data you have.
      </p>
      <InterpLambdaViz />
    </>
  ),

  theory: (
    <>
      <Definition title="n-gram model and its maximum likelihood estimate">
        <p>
          An n-gram model makes the Markov assumption{" "}
          <M>{"p(w_t \\mid w_{1:t-1}) = p(w_t \\mid w_{t-n+1:t-1})"}</M>. Maximising the likelihood of a training corpus gives
          the relative frequencies
        </p>
        <MD>{"\\hat p(w \\mid v) = \\frac{c(v, w)}{c(v)},"}</MD>
        <p>
          where v is the context of n − 1 words, c(v, w) counts the n-gram and c(v) counts the context in positions that have a
          successor. With a vocabulary of V words there are <M>{"V^n"}</M> possible n-grams; a corpus of T tokens contains at
          most T of them, so for large V and n almost all estimates are zero.
        </p>
        <Code>{COUNTS}</Code>
      </Definition>

      <Definition title="add-k smoothing and perplexity">
        <p>
          Add-k smoothing pretends every n-gram was seen k extra times:{" "}
          <M>{"p_k(w \\mid v) = (c(v, w) + k)/(c(v) + kV)"}</M>, which sums to 1 over w. Models are compared by perplexity on
          held-out text, <M>{"\\exp\\bigl(-\\tfrac1T\\sum_t \\log p(w_t \\mid v_t)\\bigr)"}</M>, the effective number of equally
          likely choices at each step. A single zero-probability test n-gram makes it infinite, which is why unsmoothed MLE is
          unusable. Add-one gives too much mass to unseen events when V is large: each unseen word after v gets as much as a
          word seen once.
        </p>
      </Definition>

      <Definition title="interpolation and Kneser-Ney">
        <p>
          Linear interpolation mixes orders:{" "}
          <M>{"p_\\lambda(w \\mid v) = \\lambda\\,\\hat p(w \\mid v) + (1 - \\lambda)\\,p_{\\text{uni}}(w)"}</M>, with λ chosen on
          held-out data. Kneser-Ney instead subtracts a fixed discount d from every seen count and gives the freed mass to a
          continuation distribution,
        </p>
        <MD>{"p_{\\text{KN}}(w \\mid v) = \\frac{\\max(c(v, w) - d, 0)}{c(v)} + \\frac{d\\,N_{1+}(v\\,\\bullet)}{c(v)}\\,p_{\\text{cont}}(w), \\qquad p_{\\text{cont}}(w) \\propto N_{1+}(\\bullet\\,w),"}</MD>
        <p>
          where <M>{"N_{1+}(v\\,\\bullet)"}</M> is the number of distinct words seen after v and{" "}
          <M>{"N_{1+}(\\bullet\\,w)"}</M> the number of distinct words seen before w. The continuation probability asks how
          many contexts w completes, not how often it occurs, which answers the Francisco puzzle.
        </p>
        <Code>{SMOOTH}</Code>
      </Definition>

      <Theorem title="Kneser-Ney is normalised">
        <p>
          If every seen count is at least d and <M>{"p_{\\text{cont}}"}</M> sums to 1, then{" "}
          <M>{"\\sum_w p_{\\text{KN}}(w \\mid v) = 1"}</M> for every seen context v.
        </p>
      </Theorem>
      <Proof>
        <p>
          Exactly <M>{"N_{1+}(v\\,\\bullet)"}</M> words have positive count after v, and for each of them{" "}
          <M>{"\\max(c - d, 0) = c - d"}</M>. Summing the first term over w gives{" "}
          <M>{"(c(v) - d\\,N_{1+}(v\\,\\bullet))/c(v)"}</M>. The second term sums to{" "}
          <M>{"d\\,N_{1+}(v\\,\\bullet)/c(v)"}</M> because the continuation distribution sums to 1. The two add to 1. In the code
          the continuation distribution has an added one per word, (N₁₊(• w) + 1)/(number of distinct bigrams + V), so that it
          too sums to 1 over the vocabulary and no word gets probability zero; an unseen context falls back to it entirely.
        </p>
      </Proof>

      <Example title="what the right weight depends on">
        <p>
          In the figure, text comes from a known bigram model over 40 words whose perplexity is 5.30. With 200 training tokens
          the best interpolation weight is about 0.6, giving perplexity 13.1, and Kneser-Ney reaches 11.4. With 2000 tokens the
          best λ rises to 0.9 (perplexity 6.4, Kneser-Ney 6.3), and with 20000 tokens it is 0.99, both methods ending close to the
          truth at 5.5. Trusting the counts too much is disastrous with little data: λ = 0.99 on 200 tokens gives 35.6. A held-out
          set is what lets you choose.
        </p>
      </Example>

      <Remark title="why n-grams gave way to neural models">
        <p>
          Count tables grow with the number of distinct n-grams seen, and nothing learned about &quot;the cat sat&quot; tells
          the model anything about &quot;a dog sat&quot;: each context is estimated separately. Smoothing shares strength only
          by backing off to shorter contexts. Neural language models replace the table with a function of word embeddings, so
          that similar contexts make similar predictions, and they can use contexts far longer than any n-gram table could
          hold.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "space",
      rung: "check",
      prompt: <p>With a vocabulary of 50 words, how many distinct 4-grams are possible?</p>,
      answer: { kind: "numeric", value: 6250000, tolerance: 0.5 },
    },
    {
      key: "addk",
      rung: "check",
      prompt: (
        <p>
          A bigram (v, w) was seen 3 times, the context v was seen 10 times, and the vocabulary has 10 words. What is the add-one
          estimate of p(w | v)?
        </p>
      ),
      answer: { kind: "numeric", value: 0.2, tolerance: 0.0001 },
    },
    {
      key: "cont",
      rung: "apply",
      prompt: <p>Why does Kneser-Ney use the number of distinct preceding words, rather than the frequency, for its lower-order distribution?</p>,
      answer: {
        kind: "choice",
        options: [
          "Because it guarantees the model never assigns probability zero to a seen bigram",
          "Because it is only used when the bigram is novel, and words that appear in many contexts are the ones likely to appear in a new one",
          "Because counting distinct predecessors is cheaper than counting frequencies",
          "Because it makes the discount d unnecessary",
        ],
        correct: [1],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
from collections import Counter

def ngram_counts(tokens, n):
    return Counter(tuple(tokens[i:i + n]) for i in range(len(tokens) - n + 1))

def add_k_bigram(tokens, V, k):
    c2, c1 = ngram_counts(tokens, 2), Counter(tokens[:-1])
    return lambda v, w: (c2[(v, w)] + k) / (c1[v] + k * V)

def perplexity(prob, tokens):
    logs = [np.log(prob(v, w)) for v, w in zip(tokens[:-1], tokens[1:])]
    return float(np.exp(-np.mean(logs)))

t = "the cat sat on the mat the cat ate the rat".split(); V = len(set(t)); print(ngram_counts(t, 2).most_common(1), len(ngram_counts(t, 3)), V)
p = add_k_bigram(t, V, 1); print(round(p("the", "cat"), 4), round(sum(p("the", w) for w in set(t)), 6), round(perplexity(add_k_bigram(t, V, 0), t), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(('the', 'cat'), 2)] 9 7\n0.2727 1.0 1.741",
          "[(('the', 'cat'), 2)] 9 7\n0.5 1.0 1.741",
          "[(('the', 'cat'), 2)] 10 7\n0.2727 1.0 1.741",
          "[(('the', 'cat'), 2)] 9 7\n0.2727 1.0 inf",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from collections import Counter

def interpolated(tokens, V, lam):
    c2, c1, cu = Counter(zip(tokens[:-1], tokens[1:])), Counter(tokens[:-1]), Counter(tokens)
    uni = lambda w: (cu[w] + 1) / (len(tokens) + V)
    return lambda v, w: lam * (c2[(v, w)] / c1[v] if c1[v] else 0.0) + (1 - lam) * uni(w)

def kneser_ney(tokens, V, d=0.75):
    c2, c1 = Counter(zip(tokens[:-1], tokens[1:])), Counter(tokens[:-1])
    follow, precede = Counter(v for v, _ in c2), Counter(w for _, w in c2)
    def prob(v, w):
        pc = (precede[w] + 1) / (len(c2) + V)
        if c1[v] == 0:
            return pc
        return max(c2[(v, w)] - d, 0) / c1[v] + d * follow[v] / c1[v] * pc
    return prob

t = "the cat sat on the mat the cat ate the rat".split(); V = len(set(t))
q = kneser_ney(t, V); print(round(q("the", "cat"), 4), round(sum(q("the", w) for w in set(t)), 6), round(sum(q("dog", w) for w in set(t)), 6))
r = interpolated(t, V, 0.7); print(round(r("cat", "mat"), 4), r("cat", "mat") > 0, interpolated(t, V, 1.0)("cat", "mat"))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.3828 1.0 1.0\n0.0333 True 0.0",
          "0.3828 1.0 0.0\n0.0333 True 0.0",
          "0.5 1.0 1.0\n0.0333 True 0.0",
          "0.3828 1.0 1.0\n0.0 False 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ngram_counts(tokens, n)</C> returning a Counter of n-gram tuples, <C>add_k_bigram(tokens, V, k)</C> returning a
          function p(v, w), and <C>perplexity(prob, tokens)</C> over the bigrams of a token list.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np
from collections import Counter

def ngram_counts(tokens, n):
    return Counter()

def add_k_bigram(tokens, V, k):
    return lambda v, w: 0.0

def perplexity(prob, tokens):
    return 0.0
`,
        solution: COUNTS,
        tests: [
          { name: "counts", code: `c = ngram_counts(list("abab"), 2); assert c[("a", "b")] == 2 and c[("b", "a")] == 1 and len(ngram_counts(list("abc"), 3)) == 1` },
          { name: "smoothing", code: `t = list("aabab"); p = add_k_bigram(t, 2, 1); assert abs(p("a", "b") - 0.6) < 1e-12 and abs(sum(p("b", w) for w in "ab") - 1) < 1e-12 and abs(perplexity(lambda v, w: 0.5, t) - 2) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>interpolated(tokens, V, lam)</C>, mixing the bigram MLE with an add-one unigram, and{" "}
          <C>kneser_ney(tokens, V, d)</C> with the add-one continuation distribution described in the proof. Both return a
          function p(v, w).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from collections import Counter

def interpolated(tokens, V, lam):
    return lambda v, w: 0.0

def kneser_ney(tokens, V, d=0.75):
    return lambda v, w: 0.0
`,
        solution: SMOOTH,
        tests: [
          { name: "interpolated", code: `t = list("aabab"); r = interpolated(t, 2, 0.5); assert abs(r("a", "b") - (0.5 * 2 / 3 + 0.5 * 3 / 7)) < 1e-12 and abs(sum(r("b", w) for w in "ab") - 1) < 1e-12` },
          { name: "kneser-ney", code: `t = "the cat sat on the mat the cat ate the rat".split(); W = set(t) | {"dog"}; q = kneser_ney(t, 8)
assert all(abs(sum(q(v, w) for w in W) - 1) < 1e-9 for v in W) and q("the", "dog") > 0 and abs(kneser_ney(t, 7)("the", "cat") - 0.3828125) < 1e-9` },
        ],
      },
    },
    {
      key: "kn",
      rung: "stretch",
      prompt: (
        <p>
          On the corpus &quot;the cat sat on the mat the cat ate the rat&quot; (V = 7, d = 0.75, continuation distribution with
          add-one as in the code), what is the Kneser-Ney probability of &quot;sat&quot; after &quot;the&quot;?
        </p>
      ),
      answer: { kind: "numeric", value: 0.0703125, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Count tables treat every context as unrelated to every other. The next lesson replaces the table with a small neural
        network over word embeddings, so that what is learned about one context transfers to similar ones.
      </p>
    </>
  ),
};
