import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { QualityThresholdViz } from "@/components/viz/QualityThresholdViz";
import type { LessonContent } from "@/lib/types";

const CLASSIFIER = `import math, zlib

def features(text, dim=2**16):
    w = text.lower().split()
    grams = w + [a + " " + b for a, b in zip(w, w[1:])]   # words and word pairs
    f = {}
    for g in grams:
        i = zlib.crc32(g.encode()) % dim            # the hashing trick: no vocabulary to store
        f[i] = f.get(i, 0) + 1
    return f

def train_lr(texts, labels, dim=2**16, epochs=5, lr=0.5):
    w, b = [0.0] * dim, 0.0
    feats = [features(t, dim) for t in texts]
    for _ in range(epochs):
        for f, y in zip(feats, labels):
            z = b + sum(w[i] * v for i, v in f.items())
            g = 1 / (1 + math.exp(-z)) - y          # gradient of the log loss with respect to z
            b -= lr * g
            for i, v in f.items():
                w[i] -= lr * g * v
    return w, b

def score(model, text):
    w, b = model
    z = b + sum(w[i] * v for i, v in features(text, len(w)).items())
    return 1 / (1 + math.exp(-z))`;

const SELECT = `import math

def threshold_for(scores, frac):
    s = sorted(scores, reverse=True)
    k = max(1, math.ceil(frac * len(s)))            # keep at least the top fraction
    return s[k - 1]

def pr_at(scores, labels, t):
    kept = [y for s, y in zip(scores, labels) if s >= t]
    tp = sum(kept)
    return tp / max(len(kept), 1), tp / max(sum(labels), 1)   # precision, recall

def perplexity(logprobs):
    return math.exp(-sum(logprobs) / len(logprobs))   # per token, natural logs`;

export const lesson: LessonContent = {
  id: "e11.3.2",
  minutes: 45,
  links: {
    requires: ["e11.3.1", "l1.3.1"],
    revisits: ["e11.2.3", "l4.3.1"],
    foreshadows: ["e11.6.3", "e11.7.2"],
  },

  puzzle: (
    <>
      <p>
        A team asks a large model to rate half a million web pages from 0 to 5 for educational value, trains a small classifier to
        predict the ratings, and keeps only pages it scores 3 or more: about a tenth of the web. Models trained on this tenth beat models
        trained on all of it by a wide margin on knowledge and reasoning benchmarks. Why does a cheap classifier help so much, and what
        is lost when nine tenths of the data are thrown away?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Rules catch text that is broken. A classifier catches text that is merely unhelpful: correct, fluent, and not worth training
        on. It learns from examples of what to keep, such as pages rated highly by a strong model or answers from curated question
        sites, contrasted with random web pages. Because it must score billions of documents, it is small: a linear model over hashed
        words and word pairs, or a light head on sentence embeddings. Keeping the top scores trades quantity and variety for quality.
      </p>
      <QualityThresholdViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a hashed linear classifier">
        <p>
          <C>features</C> maps each word and word pair to one of <C>dim</C> buckets with a hash and counts them, so no vocabulary is
          stored. <C>train_lr</C> fits logistic regression (l1.3.1) by stochastic gradient descent on the log loss, and <C>score</C>{" "}
          returns the predicted probability of the positive class. This is essentially the fastText design used for DCLM.
        </p>
        <Code>{CLASSIFIER}</Code>
      </Definition>

      <Theorem title="the gradient step">
        <p>
          For one example with features x and label y, and <M>{"z = b + w \\cdot x"}</M>, the log loss{" "}
          <M>{"\\ell = -y \\log \\sigma(z) - (1 - y)\\log(1 - \\sigma(z))"}</M> has <M>{"\\partial \\ell/\\partial w = (\\sigma(z) - y)\\,x"}</M>{" "}
          and <M>{"\\partial \\ell/\\partial b = \\sigma(z) - y"}</M>; only the weights of features present in the example change.
        </p>
      </Theorem>
      <Proof>
        <p>
          With <M>{"\\sigma' = \\sigma(1 - \\sigma)"}</M>,{" "}
          <M>{"\\partial \\ell/\\partial z = -y(1 - \\sigma) + (1 - y)\\sigma = \\sigma - y"}</M>. The chain rule with{" "}
          <M>{"\\partial z/\\partial w_i = x_i"}</M> gives the rest, and <M>{"x_i = 0"}</M> for absent features.
        </p>
      </Proof>

      <Theorem title="hash collisions">
        <p>
          If V distinct features are hashed independently and uniformly into D buckets, the expected fraction of features that share a
          bucket with another is <M>{"1 - (1 - 1/D)^{V - 1}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          A given feature avoids each of the other V − 1 features&apos; buckets with probability 1 − 1/D, independently, so it is alone
          with probability <M>{"(1 - 1/D)^{V - 1}"}</M>. Linearity of expectation turns this probability into the expected fraction.
          Colliding features share a weight, which costs a little accuracy and saves the vocabulary.
        </p>
      </Proof>

      <Definition title="selecting documents">
        <p>
          <C>threshold_for</C> returns the score that keeps the top fraction of documents; <C>pr_at</C> gives precision and recall of
          keeping scores at or above a threshold, against held-out labels. An older approach, from CCNet, scores documents by the
          perplexity of an n-gram language model (l4.3.1) trained on Wikipedia: <C>perplexity</C> is{" "}
          <M>{"\\exp(-\\tfrac1T \\sum_t \\log p_t)"}</M>, and documents are bucketed into head, middle and tail by it.
        </p>
        <Code>{SELECT}</Code>
      </Definition>

      <Remark title="classifiers in practice">
        <p>
          FineWeb-Edu used a large model to rate about 450,000 pages for educational value, trained a regression head on text embeddings
          to predict the ratings, and kept pages scoring at least 3, about 1.3 trillion tokens. DCLM trained a fastText classifier with
          instruction-style answers and explanations as positives and random web text as negatives, and kept the top tenth. Both
          gained substantially on knowledge benchmarks. The costs are narrower topics and styles, a bias toward whatever the reference
          set rewards, and the risk of selecting text that resembles benchmarks; selection choices are therefore checked with small
          ablation runs (e11.6.3) and contamination checks.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The classifier distils a slow, expensive judgement into a fast one that can be applied to every page. The kept tenth is denser
          in explanations, which the benchmarks reward. What is lost is breadth: topics, registers and languages that the reference
          judged less educational, which is why mixtures often add back some unfiltered or differently filtered data.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "threshold",
      rung: "check",
      prompt: (
        <p>
          Ten documents score 0.91, 0.15, 0.77, 0.62, 0.88, 0.05, 0.49, 0.33, 0.70 and 0.58. What does <C>threshold_for</C> return for a
          fraction of 0.25?
        </p>
      ),
      answer: { kind: "numeric", value: 0.77, tolerance: 0.0001 },
    },
    {
      key: "ppl",
      rung: "check",
      prompt: (
        <p>
          A language model gives four tokens probabilities 0.5, 0.25, 0.5 and 0.125. What is the perplexity? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 3.364, tolerance: 0.001 },
    },
    {
      key: "cost",
      rung: "apply",
      prompt: <p>What is the main cost of keeping only the top-scoring tenth of a crawl?</p>,
      answer: {
        kind: "choice",
        options: [
          "Less data and less variety, skewed toward the topics and styles the reference examples favour",
          "The classifier must be retrained for every document",
          "Kept documents become longer",
          "It removes all duplicated documents",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math, zlib

def features(text, dim=2**16):
    w = text.lower().split()
    grams = w + [a + " " + b for a, b in zip(w, w[1:])]   # words and word pairs
    f = {}
    for g in grams:
        i = zlib.crc32(g.encode()) % dim            # the hashing trick: no vocabulary to store
        f[i] = f.get(i, 0) + 1
    return f

def train_lr(texts, labels, dim=2**16, epochs=5, lr=0.5):
    w, b = [0.0] * dim, 0.0
    feats = [features(t, dim) for t in texts]
    for _ in range(epochs):
        for f, y in zip(feats, labels):
            z = b + sum(w[i] * v for i, v in f.items())
            g = 1 / (1 + math.exp(-z)) - y          # gradient of the log loss with respect to z
            b -= lr * g
            for i, v in f.items():
                w[i] -= lr * g * v
    return w, b

def score(model, text):
    w, b = model
    z = b + sum(w[i] * v for i, v in features(text, len(w)).items())
    return 1 / (1 + math.exp(-z))

m = train_lr(["the proof of the theorem", "we explain how cells divide", "buy cheap pills now", "click here to win"], [1, 1, 0, 0], 1024, 20)
print(len(features("a b c", 1024)), score(m, "the theorem") > 0.5, score(m, "win cheap pills") > 0.5, score(m, "") == 1 / (1 + math.exp(-m[1])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["5 True False True", "6 True False True", "5 True True True", "5 True False False"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def threshold_for(scores, frac):
    s = sorted(scores, reverse=True)
    k = max(1, math.ceil(frac * len(s)))            # keep at least the top fraction
    return s[k - 1]

def pr_at(scores, labels, t):
    kept = [y for s, y in zip(scores, labels) if s >= t]
    tp = sum(kept)
    return tp / max(len(kept), 1), tp / max(sum(labels), 1)   # precision, recall

def perplexity(logprobs):
    return math.exp(-sum(logprobs) / len(logprobs))   # per token, natural logs

s, y = [0.9, 0.8, 0.7, 0.4, 0.2], [1, 0, 1, 1, 0]
print(threshold_for(s, 0.5), pr_at(s, y, threshold_for(s, 0.5)), round(perplexity([math.log(0.5), math.log(0.125)]), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.7 (0.6666666666666666, 0.6666666666666666) 4.0",
          "0.8 (0.5, 0.3333333333333333) 4.0",
          "0.7 (0.6666666666666666, 0.6666666666666666) 16.0",
          "0.7 (0.6666666666666666, 1.0) 4.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>features(text, dim)</C>, hashing lower-cased words and space-joined word pairs with <C>zlib.crc32</C>;{" "}
          <C>train_lr(texts, labels, dim, epochs, lr)</C>, updating the bias then the weights after each example; and{" "}
          <C>score(model, text)</C>, taking the dimension from the model.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math, zlib

def features(text, dim=2**16):
    return {}

def train_lr(texts, labels, dim=2**16, epochs=5, lr=0.5):
    return [0.0] * dim, 0.0

def score(model, text):
    return 0.5
`,
        solution: CLASSIFIER,
        tests: [
          { name: "features", code: `f = features("A b a", 1000)\nassert sum(f.values()) == 5 and f[zlib.crc32(b"a") % 1000] >= 2 and f[zlib.crc32(b"b a") % 1000] >= 1\nw, b = train_lr(["x"], [1], 8, 1, 1.0)\nassert b == 0.5 and w[zlib.crc32(b"x") % 8] == 0.5 and sum(w) == 0.5` },
          { name: "score", code: `m = train_lr(["good maths proof", "nice proof", "spam offer", "cheap spam"], [1, 1, 0, 0], 4096, 30)\nassert score(m, "a proof") > 0.7 and score(m, "spam") < 0.3\nassert abs(score(([0.0] * 4, 2.0), "") - 1 / (1 + math.exp(-2.0))) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>threshold_for(scores, frac)</C>, keeping at least one document; <C>pr_at(scores, labels, t)</C>, with precision 0.0 when nothing is
          kept and recall 0.0 when nothing is positive; and <C>perplexity(logprobs)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def threshold_for(scores, frac):
    return min(scores)

def pr_at(scores, labels, t):
    return 1.0, 1.0

def perplexity(logprobs):
    return 1.0
`,
        solution: SELECT,
        tests: [
          { name: "threshold", code: `assert threshold_for([3, 1, 2, 5], 0.5) == 3 and threshold_for([3, 1, 2, 5], 0.01) == 5 and threshold_for([3, 1, 2, 5], 0.6) == 2\nassert pr_at([5, 4, 3, 2], [0, 1, 1, 0], 3) == (2 / 3, 1.0) and pr_at([1, 2], [0, 0], 5) == (0.0, 0.0)` },
          { name: "ppl", code: `assert abs(perplexity([math.log(0.25)] * 3) - 4.0) < 1e-12 and abs(perplexity([0.0, -2.0]) - math.e) < 1e-12` },
        ],
      },
    },
    {
      key: "collide",
      rung: "stretch",
      prompt: (
        <p>
          A classifier hashes 100,000 distinct features into <M>{"2^{20}"}</M> buckets. What fraction of the features are expected to
          share a bucket with another? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.091, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Quality filters judge usefulness. Some text must go regardless of quality: toxic content and personal information. The next
        lesson looks at how both are detected, and what removing them does to a corpus.
      </p>
    </>
  ),
};
