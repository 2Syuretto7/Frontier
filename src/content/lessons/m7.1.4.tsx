import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OddsUpdateViz } from "@/components/viz/OddsUpdateViz";
import type { LessonContent } from "@/lib/types";

const BAYES = `def posterior(prior, lik):
    joint = {h: prior[h] * lik[h] for h in prior}
    z = sum(joint.values())
    return {h: v / z for h, v in joint.items()}

def update_seq(prior, lik_fn, data):
    post = dict(prior)
    for x in data:
        post = posterior(post, {h: lik_fn(x, h) for h in post})
    return post`;

const NB = `import math
from collections import Counter

def train_nb(docs, labels, alpha=1.0):
    vocab = sorted({w for d in docs for w in d.split()})
    model = {}
    for c in sorted(set(labels)):
        words = [w for d, l in zip(docs, labels) if l == c for w in d.split()]
        counts = Counter(words)
        total = len(words) + alpha * len(vocab)
        logp = {w: math.log((counts[w] + alpha) / total) for w in vocab}
        model[c] = (math.log(labels.count(c) / len(labels)), logp)
    return model

def predict_nb(model, doc):
    scores = {c: lp + sum(logp[w] for w in doc.split() if w in logp)
              for c, (lp, logp) in model.items()}
    return max(scores, key=scores.get), scores`;

export const lesson: LessonContent = {
  id: "m7.1.4",
  minutes: 60,
  links: {
    requires: ["m7.1.3"],
    revisits: ["m4.6.2"],
    foreshadows: ["m7.1.5", "m9.2.1"],
  },

  puzzle: (
    <>
      <p>
        A bag holds 100 coins, one of them double-headed. You pick one at random and toss it: heads, again and again. After
        how many heads in a row should you believe, more likely than not, that you hold the double-headed coin? And what
        single number does each toss contribute to that belief?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Bayes&apos; rule turns &ldquo;how likely is the evidence under each hypothesis&rdquo; into &ldquo;how likely is each
        hypothesis given the evidence&rdquo;. In odds form it is a multiplication: the prior odds times the likelihood ratio
        of the evidence. On a log scale the multiplication becomes addition, so independent pieces of evidence simply add
        their weights. Each head here doubles the odds for the double-headed coin, and the prior odds are 1 to 99.
      </p>
      <OddsUpdateViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="Bayes' rule">
        <p>
          If <M>{"H_1, H_2, \\dots"}</M> is a partition into events of positive probability and P(E) &gt; 0, then
        </p>
        <MD>{"P(H_i \\mid E) = \\frac{P(E \\mid H_i)P(H_i)}{\\sum_j P(E \\mid H_j)P(H_j)}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Both <M>{"P(H_i \\mid E)P(E)"}</M> and <M>{"P(E \\mid H_i)P(H_i)"}</M> equal <M>{"P(H_i \\cap E)"}</M>, and the law of
          total probability gives the denominator <M>{"P(E)"}</M>.
        </p>
      </Proof>
      <p>
        The names: <M>{"P(H)"}</M> is the prior, <M>{"P(E \\mid H)"}</M> as a function of H is the likelihood, and{" "}
        <M>{"P(H \\mid E)"}</M> is the posterior. The posterior is proportional to prior times likelihood; the denominator only
        normalises.
      </p>

      <Theorem title="odds form">
        <p>
          For a hypothesis H and its complement, with odds O(H) = P(H)/P(Hᶜ),
        </p>
        <MD>{"O(H \\mid E) = \\frac{P(E \\mid H)}{P(E \\mid H^c)}\\,O(H), \\qquad \\log O(H \\mid E) = \\log O(H) + \\log \\mathrm{LR}(E)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Write Bayes&apos; rule for H and for Hᶜ and divide. The common denominator P(E) cancels.
        </p>
      </Proof>

      <Example title="the puzzle">
        <p>
          Prior odds are 1 : 99 and each head has likelihood ratio 1 / (1/2) = 2. After k heads the odds are{" "}
          <M>{"2^k : 99"}</M>, which exceed 1 first at k = 7, giving <M>{"P = 128/227 \\approx 0.56"}</M>. One tail sends the
          posterior to 0 at once: a likelihood of zero can never be undone.
        </p>
      </Example>

      <Theorem title="sequential updating">
        <p>
          Suppose evidence <M>{"E_1, E_2"}</M> is conditionally independent given each hypothesis:{" "}
          <M>{"P(E_1 \\cap E_2 \\mid H_i) = P(E_1 \\mid H_i)P(E_2 \\mid H_i)"}</M>. Then updating the prior on{" "}
          <M>{"E_1"}</M>, and then using that posterior as the prior for an update on <M>{"E_2"}</M>, gives{" "}
          <M>{"P(H_i \\mid E_1 \\cap E_2)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The two-step result is proportional to{" "}
          <M>{"P(E_2 \\mid H_i)\\cdot P(E_1 \\mid H_i)P(H_i) = P(E_1 \\cap E_2 \\mid H_i)P(H_i)"}</M>, which is proportional to
          the one-step posterior. Both are normalised over i, so they are equal.
        </p>
        <Code>{BAYES}</Code>
      </Proof>

      <Example title="learning a coin's bias">
        <p>
          Let the hypotheses be the possible biases θ ∈ {"{0, 0.25, 0.5, 0.75, 1}"}, equally likely. Tosses are independent
          given θ, with likelihood θ for heads. After H, H, T the posterior is proportional to <M>{"\\theta^2(1-\\theta)"}</M>:
          0, 0.15, 0.40, 0.45, 0. With a fine grid this becomes the Bayesian estimate of a probability, and with a continuum
          of θ it needs densities, which come later.
        </p>
      </Example>

      <Example title="naive Bayes">
        <p>
          To classify a document, take the classes as hypotheses and pretend its words are independent given the class.
          Then <M>{"\\log P(c \\mid \\text{doc}) = \\log P(c) + \\sum_{w}\\log P(w \\mid c) + \\text{const}"}</M>. The word
          probabilities are estimated by counting, with α added to every count (Laplace smoothing) so that an unseen word
          does not zero out a class, the trap from the puzzle. Summing logs avoids the underflow that multiplying hundreds of
          small probabilities would cause.
        </p>
        <Code>{NB}</Code>
      </Example>

      <Remark title="the prosecutor's fallacy">
        <p>
          &ldquo;The chance of this DNA match if the defendant is innocent is one in a million&rdquo; is{" "}
          <M>{"P(E \\mid H^c)"}</M>, not <M>{"P(H^c \\mid E)"}</M>. In a city of ten million, about ten innocent people would
          match too; without other evidence the prior odds of guilt are about 1 : 10⁷, and the likelihood ratio of 10⁶ leaves
          posterior odds of only about 1 : 10.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "test",
      rung: "check",
      prompt: (
        <p>
          A condition has prevalence 1%. A test detects it 90% of the time and gives a false positive 5% of the time. What is
          P(condition | positive)? Give four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.1538, tolerance: 0.0001 },
    },
    {
      key: "lr",
      rung: "check",
      prompt: <p>Prior odds are 1 : 4 and the evidence has likelihood ratio 6. What is the posterior probability of the hypothesis?</p>,
      answer: { kind: "numeric", value: 0.6, tolerance: 0.0001 },
    },
    {
      key: "two",
      rung: "apply",
      prompt: (
        <p>
          The test in the first question is applied twice, and the two results are independent given the true state. Both are
          positive. What are the posterior odds of the condition?
        </p>
      ),
      answer: { kind: "choice", options: ["324 : 99", "18 : 99", "324 : 9801", "36 : 99"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from fractions import Fraction

def posterior(prior, lik):
    joint = {h: prior[h] * lik[h] for h in prior}
    z = sum(joint.values())
    return {h: v / z for h, v in joint.items()}

def update_seq(prior, lik_fn, data):
    post = dict(prior)
    for x in data:
        post = posterior(post, {h: lik_fn(x, h) for h in post})
    return post

prior = {'fair': Fraction(99, 100), 'double': Fraction(1, 100)}
lik = lambda x, h: Fraction(1, 2) if h == 'fair' else Fraction(int(x == 'H'))
print(update_seq(prior, lik, 'HHHHHHH')['double'], update_seq(prior, lik, 'HHT')['double'])
grid = {t: 0.2 for t in (0.0, 0.25, 0.5, 0.75, 1.0)}
post = update_seq(grid, lambda x, t: t if x == 'H' else 1 - t, 'HHT')
print([round(v, 3) + 0.0 for v in post.values()])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "128/227 0\n[0.0, 0.15, 0.4, 0.45, 0.0]",
          "128/227 1/100\n[0.0, 0.15, 0.4, 0.45, 0.0]",
          "1/100 0\n[0.0, 0.15, 0.4, 0.45, 0.0]",
          "128/227 0\n[0.0, 0.047, 0.125, 0.141, 0.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
from collections import Counter

def train_nb(docs, labels, alpha=1.0):
    vocab = sorted({w for d in docs for w in d.split()})
    model = {}
    for c in sorted(set(labels)):
        words = [w for d, l in zip(docs, labels) if l == c for w in d.split()]
        counts = Counter(words)
        total = len(words) + alpha * len(vocab)
        logp = {w: math.log((counts[w] + alpha) / total) for w in vocab}
        model[c] = (math.log(labels.count(c) / len(labels)), logp)
    return model

def predict_nb(model, doc):
    scores = {c: lp + sum(logp[w] for w in doc.split() if w in logp)
              for c, (lp, logp) in model.items()}
    return max(scores, key=scores.get), scores

docs = ['win money now', 'meeting at noon', 'win a prize now', 'lunch meeting today']
model = train_nb(docs, ['spam', 'ham', 'spam', 'ham'])
print(len(model['ham'][1]), round(math.exp(model['spam'][1]['win']), 4))
print(predict_nb(model, 'win lunch now')[0], predict_nb(model, 'meeting now')[0], predict_nb(model, 'hello')[0])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["10 0.1765\nspam ham ham", "10 0.2857\nspam ham ham", "10 0.1765\nspam spam ham", "10 0.1765\nspam ham spam"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>posterior(prior, lik)</C>, where both are dicts over the same hypotheses, returning the normalised posterior;
          and <C>update_seq(prior, lik_fn, data)</C>, which updates one observation at a time using lik_fn(x, h).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def posterior(prior, lik):
    return dict(prior)

def update_seq(prior, lik_fn, data):
    return dict(prior)
`,
        solution: BAYES,
        tests: [
          { name: "single update", code: `p = posterior({'D': 0.01, 'N': 0.99}, {'D': 0.9, 'N': 0.05})
assert abs(p['D'] - 0.009 / (0.009 + 0.0495)) < 1e-12 and abs(sum(p.values()) - 1) < 1e-12` },
          { name: "sequence", code: `from fractions import Fraction
prior = {'fair': Fraction(99, 100), 'double': Fraction(1, 100)}
lik = lambda x, h: Fraction(1, 2) if h == 'fair' else Fraction(int(x == 'H'))
assert update_seq(prior, lik, 'HHHHHHH')['double'] == Fraction(128, 227)
assert update_seq(prior, lik, 'HHHHHH')['double'] < Fraction(1, 2)
grid = {t: 0.2 for t in (0.0, 0.25, 0.5, 0.75, 1.0)}
f = lambda x, t: t if x == 'H' else 1 - t
a, b = update_seq(grid, f, 'HHTH'), update_seq(update_seq(grid, f, 'HH'), f, 'TH')
assert all(abs(a[t] - b[t]) < 1e-12 for t in grid) and abs(a[0.75] - 0.75 ** 3 * 0.25 / sum(t ** 3 * (1 - t) for t in grid)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>train_nb(docs, labels, alpha=1.0)</C>, returning for each class (log prior, dict of smoothed log word
          probabilities over the whole vocabulary), and <C>predict_nb(model, doc)</C>, returning (best class, dict of scores),
          where a score is the log prior plus the log probabilities of the document&apos;s known words.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math
from collections import Counter

def train_nb(docs, labels, alpha=1.0):
    return {}

def predict_nb(model, doc):
    return None, {}
`,
        solution: NB,
        tests: [
          { name: "training", code: `docs = ['win money now', 'meeting at noon', 'win a prize now', 'lunch meeting today']
m = train_nb(docs, ['spam', 'ham', 'spam', 'ham'])
assert set(m) == {'spam', 'ham'} and len(m['ham'][1]) == 10
assert abs(m['spam'][0] - math.log(0.5)) < 1e-12
assert abs(math.exp(m['spam'][1]['win']) - 3 / 17) < 1e-12 and abs(math.exp(m['ham'][1]['win']) - 1 / 16) < 1e-12
assert abs(sum(math.exp(v) for v in m['ham'][1].values()) - 1) < 1e-12` },
          { name: "prediction", code: `docs = ['win money now', 'meeting at noon', 'win a prize now', 'lunch meeting today', 'noon lunch']
m = train_nb(docs, ['spam', 'ham', 'spam', 'ham', 'ham'], alpha=0.5)
c, s = predict_nb(m, 'win prize')
assert c == 'spam' and set(s) == {'spam', 'ham'}
assert predict_nb(m, 'noon meeting unknownword')[0] == 'ham'
assert abs(s['ham'] - (m['ham'][0] + m['ham'][1]['win'] + m['ham'][1]['prize'])) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove the odds form of Bayes&apos; rule: if 0 &lt; P(H) &lt; 1 and P(E) &gt; 0, then{" "}
          <M>{"\\frac{P(H \\mid E)}{P(H^c \\mid E)} = \\frac{P(E \\mid H)}{P(E \\mid H^c)}\\cdot\\frac{P(H)}{P(H^c)}"}</M>, whenever
          the denominators are non-zero.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes P(H | E) = P(E | H)P(H)/P(E), from the definition of conditional probability applied both ways.",
          "Writes the same for Hᶜ: P(Hᶜ | E) = P(E | Hᶜ)P(Hᶜ)/P(E).",
          "Divides the two, noting that P(E) cancels, to obtain the stated identity.",
        ],
      },
    },
    {
      key: "heads",
      rung: "stretch",
      prompt: (
        <p>
          A bag holds 1000 coins, one of them double-headed. A coin drawn at random shows heads on every one of 10 tosses. What
          is the probability that it is the double-headed coin? Give four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.5062, tolerance: 0.0002 },
    },
  ],

  teachBack:
    "Explain to a friend how Bayes' rule turns likelihoods into posteriors, why in odds form each independent piece of evidence just multiplies the odds by its likelihood ratio, and why the naive Bayes classifier works in log space with smoothing.",

  glimpse: (
    <>
      <p>
        Sequential updating needed the evidence to be conditionally independent given the hypothesis. Independence, and its
        conditional version, is the next lesson, along with the ways it fails. Bayesian inference proper, with continuous
        parameters and conjugate priors, is built in the statistics course.
      </p>
    </>
  ),
};
