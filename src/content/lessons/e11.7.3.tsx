import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CollapseViz } from "@/components/viz/CollapseViz";
import type { LessonContent } from "@/lib/types";

const GAUSS = `from statistics import mean, pvariance

def fit_gaussian(xs):
    return mean(xs), pvariance(xs)                # maximum-likelihood fit: divides by n, not n - 1

def expected_var(var0, n, g):
    return var0 * ((n - 1) / n) ** g              # variance expected after g refits on n samples each

def generations_to_halve(n):
    g, f = 0, 1.0
    while f > 0.5:
        g, f = g + 1, f * (n - 1) / n
    return g`;

const TAILS = `def empirical(counts):
    total = sum(counts.values())
    return {k: c / total for k, c in counts.items()}

def lost_mass(probs, counts):
    return sum(p for k, p in probs.items() if counts.get(k, 0) == 0)   # categories that drew no samples vanish

def survive(p, n, g):
    return (1 - (1 - p) ** n) ** g                # seen at least once in each of g generations, p held fixed`;

export const lesson: LessonContent = {
  id: "e11.7.3",
  minutes: 50,
  links: {
    requires: ["e11.7.2", "m9.2.4"],
    revisits: ["m7.6.1", "e11.1.4"],
    foreshadows: ["e11.8.1"],
  },

  puzzle: (
    <>
      <p>
        Train a language model, use it to write a corpus, train the next model on that corpus alone, and repeat. Experiments of this kind
        found that rare words and unusual topics thin out within a few generations, and that after many generations the outputs become
        narrow and repetitive. Yet many strong models are trained partly on synthetic data without visible harm. What exactly goes
        wrong in the recursive loop, and what prevents it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each generation fits a model to a finite sample from the previous model. Two errors compound. Statistical error: a finite
        sample under-represents the tails, so a fitted model is slightly narrower than its source, and rare events that happen not to be
        sampled get probability zero and never return. Approximation error: the model family cannot represent the source exactly. Each
        generation inherits the previous generation&apos;s losses and adds its own. Keeping the original data in the training set, and
        adding synthetic data to it rather than replacing it, anchors every generation to the real distribution.
      </p>
      <CollapseViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the Gaussian loop">
        <p>
          <C>fit_gaussian</C> returns the maximum-likelihood mean and variance, which divides by n. <C>expected_var</C> gives the
          expected variance after g generations of n samples each, and <C>generations_to_halve</C> the smallest g for which that
          expectation is at most half the original.
        </p>
        <Code>{GAUSS}</Code>
      </Definition>

      <Theorem title="variance shrinks in expectation">
        <p>
          If generation g + 1 fits a Gaussian by maximum likelihood to n independent samples from generation g&apos;s fit, then{" "}
          <M>{"\\mathbb{E}[\\sigma^2_{g}] = \\big(\\tfrac{n - 1}{n}\\big)^g \\sigma^2_0"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Given <M>{"\\sigma^2_g"}</M>, the maximum-likelihood variance of n samples has expectation{" "}
          <M>{"\\tfrac{n - 1}{n}\\sigma^2_g"}</M>, since it is the unbiased estimate scaled by <M>{"(n - 1)/n"}</M> (m9.2.4). By the
          tower property (m7.6.1), <M>{"\\mathbb{E}[\\sigma^2_{g+1}] = \\tfrac{n - 1}{n}\\mathbb{E}[\\sigma^2_g]"}</M>, and induction on
          g gives the result. The typical chain is worse than the expectation: each step multiplies the variance by an independent random
          factor, so its logarithm is a random walk with negative drift, and almost every chain collapses towards zero, as the
          visualisation shows.
        </p>
      </Proof>

      <Definition title="losing the tails">
        <p>
          <C>empirical</C> refits category probabilities from counts. <C>lost_mass</C> is the original probability of the categories that
          received no samples, which the refitted model assigns zero. <C>survive</C> is the probability that a category with probability
          p is sampled at least once in each of g generations of n samples, treating p as fixed.
        </p>
        <Code>{TAILS}</Code>
      </Definition>

      <Theorem title="rare categories are lost">
        <p>
          A category with probability p receives no samples among n with probability <M>{"(1 - p)^n \\le e^{-np}"}</M>. Once it receives
          none, every later generation assigns it probability zero.
        </p>
      </Theorem>
      <Proof>
        <p>
          The n samples are independent, each missing the category with probability <M>{"1 - p"}</M>, and{" "}
          <M>{"1 - p \\le e^{-p}"}</M>. A refitted categorical model gives an unseen category probability zero, so later samples never
          contain it, and later fits keep it at zero. Categories with <M>{"np"}</M> below about 1, the tail, are each likely to be lost,
          and the loss is permanent; the support of the distribution can only shrink.
        </p>
      </Proof>

      <Remark title="model collapse in practice">
        <p>
          Studies that replaced each generation&apos;s data with the previous model&apos;s outputs observed exactly these effects in
          language models, image models and simple estimators. Studies that accumulated data, keeping the real data and adding each
          generation&apos;s outputs, found that error stays bounded. The practical lessons: keep human-written data in every mixture,
          prefer synthetic data that a verifier has checked (e11.7.2) or that is grounded in real documents, track diversity measures
          across releases, and remember that new web crawls increasingly contain model output (e11.1.4), so provenance matters.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The recursive loop discards the real data and refits on finite samples, so variance shrinks and the tails vanish, and nothing
          restores them. Production pipelines use synthetic data as an addition to real data, checked and diversified, rather than as a
          replacement, which removes the mechanism.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "shrink",
      rung: "check",
      prompt: (
        <p>
          Starting from variance 1, each generation fits a Gaussian by maximum likelihood to 100 samples from the previous fit. What is
          the expected variance after 50 generations? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.605, tolerance: 0.001 },
    },
    {
      key: "lose",
      rung: "check",
      prompt: (
        <p>
          A word has probability 0.001 and each generation draws 1,000 tokens. What is the probability that it is not sampled at all in
          one generation? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.368, tolerance: 0.001 },
    },
    {
      key: "prevent",
      rung: "apply",
      prompt: <p>Which practice most directly prevents model collapse?</p>,
      answer: {
        kind: "choice",
        options: [
          "Keeping the real data and adding synthetic data to it, rather than replacing it",
          "Sampling the synthetic data at temperature zero",
          "Training each generation for more epochs on its own outputs",
          "Using a larger tokeniser vocabulary",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from statistics import mean, pvariance

def fit_gaussian(xs):
    return mean(xs), pvariance(xs)                # maximum-likelihood fit: divides by n, not n - 1

def expected_var(var0, n, g):
    return var0 * ((n - 1) / n) ** g              # variance expected after g refits on n samples each

def generations_to_halve(n):
    g, f = 0, 1.0
    while f > 0.5:
        g, f = g + 1, f * (n - 1) / n
    return g

m, v = fit_gaussian([1.0, 2.0, 3.0, 6.0])
print(m, v, round(expected_var(4.0, 5, 2), 2), generations_to_halve(10))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["3.0 3.5 2.56 7", "3.0 4.67 2.56 7", "3.0 3.5 3.2 7", "3.0 3.5 2.56 6"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def empirical(counts):
    total = sum(counts.values())
    return {k: c / total for k, c in counts.items()}

def lost_mass(probs, counts):
    return sum(p for k, p in probs.items() if counts.get(k, 0) == 0)   # categories that drew no samples vanish

def survive(p, n, g):
    return (1 - (1 - p) ** n) ** g                # seen at least once in each of g generations, p held fixed

c = {"the": 6, "cat": 3, "zyx": 0, "qua": 1}
print(empirical(c), round(lost_mass({"the": 0.5, "cat": 0.3, "zyx": 0.15, "qua": 0.05}, c), 2), round(survive(0.5, 1, 2), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'the': 0.6, 'cat': 0.3, 'zyx': 0.0, 'qua': 0.1} 0.15 0.25",
          "{'the': 0.6, 'cat': 0.3, 'qua': 0.1} 0.15 0.25",
          "{'the': 0.6, 'cat': 0.3, 'zyx': 0.0, 'qua': 0.1} 0.85 0.25",
          "{'the': 0.6, 'cat': 0.3, 'zyx': 0.0, 'qua': 0.1} 0.15 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fit_gaussian(xs)</C>, returning the mean and the maximum-likelihood variance; <C>expected_var(var0, n, g)</C>; and{" "}
          <C>generations_to_halve(n)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from statistics import mean, pvariance

def fit_gaussian(xs):
    return mean(xs), 1.0

def expected_var(var0, n, g):
    return var0

def generations_to_halve(n):
    return n
`,
        solution: GAUSS,
        tests: [
          { name: "fit", code: `m, v = fit_gaussian([2.0, 4.0, 4.0, 6.0])\nassert m == 4.0 and v == 2.0\nassert abs(expected_var(9.0, 3, 2) - 4.0) < 1e-12 and expected_var(1.0, 7, 0) == 1.0` },
          { name: "halve", code: `assert generations_to_halve(2) == 1 and generations_to_halve(4) == 3 and generations_to_halve(20) == 14` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>empirical(counts)</C>, <C>lost_mass(probs, counts)</C>, treating a category missing from <C>counts</C> as unseen, and{" "}
          <C>survive(p, n, g)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def empirical(counts):
    return dict(counts)

def lost_mass(probs, counts):
    return 0.0

def survive(p, n, g):
    return 1.0
`,
        solution: TAILS,
        tests: [
          { name: "refit", code: `assert empirical({"x": 1, "y": 3}) == {"x": 0.25, "y": 0.75}\nassert abs(lost_mass({"x": 0.2, "y": 0.3, "z": 0.5}, {"x": 0, "z": 4}) - 0.5) < 1e-12` },
          { name: "survive", code: `assert abs(survive(0.5, 2, 1) - 0.75) < 1e-12 and abs(survive(0.2, 1, 3) - 0.008) < 1e-12 and survive(1.0, 1, 9) == 1` },
        ],
      },
    },
    {
      key: "halflife",
      rung: "stretch",
      prompt: (
        <p>
          With 50 samples per generation, after how many generations does the expected variance first fall to at most half its starting
          value?
        </p>
      ),
      answer: { kind: "numeric", value: 35, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        The data is now chosen, cleaned, deduplicated, tokenised, mixed and supplemented. The final chapter turns to the engineering of
        delivering it: storing trillions of tokens in shards that thousands of accelerators can read in a reproducible order.
      </p>
    </>
  ),
};
