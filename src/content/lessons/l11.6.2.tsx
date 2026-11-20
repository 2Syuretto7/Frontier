import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ReadWriteDirectionViz } from "@/components/viz/ReadWriteDirectionViz";
import type { LessonContent } from "@/lib/types";

const MONITOR = `def score(h, v):
    return sum(x * y for x, y in zip(h, v)) / sum(y * y for y in v) ** 0.5

def accuracy(pos, neg, t):
    return (sum(s > t for s in pos) + sum(s <= t for s in neg)) / (len(pos) + len(neg))

def best_threshold(pos, neg):
    s = sorted(pos + neg)
    cands = [(a + b) / 2 for a, b in zip(s, s[1:])]
    return max(cands, key=lambda t: (accuracy(pos, neg, t), -t))`;

const EXTRACT = `def pair_diffs(pos, neg):
    return [[a - b for a, b in zip(p, q)] for p, q in zip(pos, neg)]

def top_component(X, iters=200):
    v = [1.0] * len(X[0])
    for _ in range(iters):
        proj = [sum(a * b for a, b in zip(x, v)) for x in X]
        w = [sum(p * x[j] for p, x in zip(proj, X)) for j in range(len(v))]
        n = sum(t * t for t in w) ** 0.5
        v = [t / n for t in w]
    return v

def sign_align(v, pos, neg):
    gap = sum(sum(a * b for a, b in zip(p, v)) for p in pos) / len(pos) - sum(sum(a * b for a, b in zip(q, v)) for q in neg) / len(neg)
    return v if gap >= 0 else [-t for t in v]`;

export const lesson: LessonContent = {
  id: "l11.6.2",
  minutes: 50,
  links: {
    requires: ["l11.6.1"],
    revisits: ["l11.1.2", "l2.6.1"],
    foreshadows: ["l11.6.4"],
  },

  puzzle: (
    <>
      <p>
        A logistic regression probe separates a model&apos;s activations on true and false statements with 95% accuracy. Adding its weight
        vector to the activations of false statements barely changes whether the model treats them as true. Adding the plain difference
        between the two class means, a worse classifier, does change it. How can the better detector be the worse lever?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Representation engineering treats a concept such as honesty as a direction to be found, read and written. Reading asks which
        direction best tells the classes apart, and that direction discounts dimensions where activations vary a lot for unrelated
        reasons. Writing asks which shift turns one class into the other, and that is simply the difference of means. When the unrelated
        variation is lopsided the two answers differ, so a good monitor and a good control vector are found in different ways.
      </p>
      <ReadWriteDirectionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="reading vectors">
        <p>
          Zou and colleagues (2023) proposed a recipe. Design stimuli that elicit the concept and its opposite, such as the same
          statement made under an instruction to be honest and under an instruction to lie. Record activations at a layer, take the
          difference within each pair with the order of every pair swapped at random, and take the top principal component of the
          differences (l2.6.1), which is the dominant axis along which pairs differ (<C>pair_diffs</C>, <C>top_component</C>). The
          component&apos;s sign is arbitrary, so orient it so that the concept scores higher (<C>sign_align</C>).
        </p>
        <Code>{EXTRACT}</Code>
        <p>
          The vector can then monitor, by projecting each token&apos;s activation onto it and thresholding (<C>score</C>,{" "}
          <C>accuracy</C>, <C>best_threshold</C>), or control, by adding it as in the previous lesson or by training a low-rank adapter
          that moves representations along it.
        </p>
        <Code>{MONITOR}</Code>
      </Definition>

      <Theorem title="reading and writing directions">
        <p>
          Suppose activations of the two classes are Gaussian with means <M>{"\\mu_+, \\mu_-"}</M> and a shared covariance{" "}
          <M>{"\\Sigma"}</M>, with equal prior probability. (1) The most accurate classifier thresholds{" "}
          <M>{"h \\cdot \\Sigma^{-1}(\\mu_+ - \\mu_-)"}</M>, the Fisher direction. (2) Adding a vector v to every negative activation turns the
          negative distribution into the positive one if and only if <M>{"v = \\mu_+ - \\mu_-"}</M>. The two directions coincide when{" "}
          <M>{"\\mu_+ - \\mu_-"}</M> is an eigenvector of <M>{"\\Sigma"}</M>, for instance when <M>{"\\Sigma"}</M> is a multiple of the identity.
        </p>
      </Theorem>
      <Proof>
        <p>
          (1) The most accurate rule picks the class with the larger density. The log ratio of the two Gaussian densities is{" "}
          <M>{"-\\tfrac12 (h - \\mu_+)^\\top \\Sigma^{-1} (h - \\mu_+) + \\tfrac12 (h - \\mu_-)^\\top \\Sigma^{-1} (h - \\mu_-)"}</M>; the
          quadratic terms in h cancel, leaving <M>{"h^\\top \\Sigma^{-1} (\\mu_+ - \\mu_-)"}</M> plus a constant. (2) Adding v maps{" "}
          <M>{"N(\\mu_-, \\Sigma)"}</M> to <M>{"N(\\mu_- + v, \\Sigma)"}</M>, and two Gaussians with the same covariance are equal exactly
          when their means are. Finally <M>{"\\Sigma^{-1} \\Delta"}</M> is parallel to <M>{"\\Delta"}</M> exactly when{" "}
          <M>{"\\Sigma \\Delta"}</M> is, that is when <M>{"\\Delta"}</M> is an eigenvector.
        </p>
      </Proof>

      <Remark title="what the evidence says">
        <p>
          Marks and Tegmark (2023) compared probes for truth in language models and found that difference-of-means probes, though no
          better at classifying, were more causally implicated: steering along them changed the model&apos;s treatment of statements more
          than steering along logistic regression directions. The theorem explains why. A reading vector inherits the confounds of its
          stimuli too. A vector extracted from statements made under an instruction to lie may track the instruction rather than the lie,
          so test monitors on cases built differently from the training stimuli, in the spirit of the probing controls of l11.1.2.
          Later work turned the same idea into a training method, rerouting the representations of harmful requests so that the model
          cannot complete them.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The logistic regression weights approximate the Fisher direction, which leans away from directions of large unrelated variance
          to classify well. Adding it moves activations partly along those unrelated directions and only partly along the concept. The
          difference of means classifies worse but is exactly the shift that carries one class onto the other, so it is the better lever.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "angle",
      rung: "check",
      prompt: (
        <p>
          Two classes share the covariance diag(4, 1), and their means differ by (2, 1). What is the cosine of the angle between the mean
          difference and the Fisher direction?
        </p>
      ),
      answer: { kind: "numeric", value: 0.8, tolerance: 0.001 },
    },
    {
      key: "monitor",
      rung: "check",
      prompt: (
        <p>
          At its threshold, a lie monitor flags 18 of 20 false statements and 3 of 30 honest ones. What is its accuracy over all 50?
        </p>
      ),
      answer: { kind: "numeric", value: 0.9, tolerance: 0.001 },
    },
    {
      key: "confound",
      rung: "apply",
      prompt: (
        <p>
          An honesty vector was extracted from statements made under instructions to be honest or to lie. Which test best checks that it
          tracks lying rather than the instruction?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Score cases where the model states falsehoods without being told to, such as when it has an incentive to deceive",
          "Re-extract the vector from twice as many instructed pairs",
          "Check that the top principal component explains most of the variance of the differences",
          "Measure the monitor's accuracy on held-out instructed pairs",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def score(h, v):
    return sum(x * y for x, y in zip(h, v)) / sum(y * y for y in v) ** 0.5

def accuracy(pos, neg, t):
    return (sum(s > t for s in pos) + sum(s <= t for s in neg)) / (len(pos) + len(neg))

def best_threshold(pos, neg):
    s = sorted(pos + neg)
    cands = [(a + b) / 2 for a, b in zip(s, s[1:])]
    return max(cands, key=lambda t: (accuracy(pos, neg, t), -t))

pos, neg = [2.0, 3.5, 1.0], [0.5, 1.5, -1.0]
print(score([3, 4], [0, 2]), round(accuracy(pos, neg, 1.2), 3), best_threshold(pos, neg))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4.0 0.667 0.75",
          "8.0 0.667 0.75",
          "4.0 0.667 1.75",
          "4.0 0.5 0.75",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def pair_diffs(pos, neg):
    return [[a - b for a, b in zip(p, q)] for p, q in zip(pos, neg)]

def top_component(X, iters=200):
    v = [1.0] * len(X[0])
    for _ in range(iters):
        proj = [sum(a * b for a, b in zip(x, v)) for x in X]
        w = [sum(p * x[j] for p, x in zip(proj, X)) for j in range(len(v))]
        n = sum(t * t for t in w) ** 0.5
        v = [t / n for t in w]
    return v

def sign_align(v, pos, neg):
    gap = sum(sum(a * b for a, b in zip(p, v)) for p in pos) / len(pos) - sum(sum(a * b for a, b in zip(q, v)) for q in neg) / len(neg)
    return v if gap >= 0 else [-t for t in v]

d = pair_diffs([[3, 1], [1, 2]], [[1, 1], [2, 2]])
print(d, [round(t, 3) for t in top_component([[2, 0], [-1, 0], [0, 0.5]])], sign_align([0, -1], [[0, 2]], [[0, 1]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[2, 0], [-1, 0]] [1.0, 0.0] [0, 1]",
          "[[2, 0], [-1, 0]] [1.0, 0.0] [0, -1]",
          "[[2, 0], [-1, 0]] [0.707, 0.707] [0, 1]",
          "[[-2, 0], [1, 0]] [1.0, 0.0] [0, 1]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>score(h, v)</C>, the projection of h onto the unit vector along v; <C>accuracy(pos, neg, t)</C>, the fraction of scores
          classified correctly when a score above t means positive; and <C>best_threshold(pos, neg)</C>, the most accurate threshold among
          the midpoints of consecutive sorted scores, the smallest on ties.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def score(h, v):
    return 0.0

def accuracy(pos, neg, t):
    return 0.5

def best_threshold(pos, neg):
    return 0.0
`,
        solution: MONITOR,
        tests: [
          { name: "readout", code: `assert abs(score([1, 2, 2], [0, 3, 4]) - 2.8) < 1e-12\nassert abs(accuracy([1, 2], [0, 1.5], 1.5) - 0.75) < 1e-12` },
          { name: "threshold", code: `assert best_threshold([2, 3, 0.5], [1, -1, 0]) == 0.25\nassert best_threshold([1, 4], [0, 2, 3]) == 3.5` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pair_diffs(pos, neg)</C>, the differences of corresponding vectors; <C>top_component(X, iters=200)</C>, the unit
          eigenvector of <M>{"X^\\top X"}</M> with the largest eigenvalue, by power iteration from the all-ones vector; and{" "}
          <C>sign_align(v, pos, neg)</C>, v or its negation, whichever gives pos a mean projection at least as large as neg&apos;s.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def pair_diffs(pos, neg):
    return pos

def top_component(X, iters=200):
    return [1.0] * len(X[0])

def sign_align(v, pos, neg):
    return v
`,
        solution: EXTRACT,
        tests: [
          { name: "extract", code: `assert pair_diffs([[1, 2]], [[3, 1]]) == [[-2, 1]]\nv = top_component([[2, 0], [0, 1], [-3, 0]])\nassert abs(v[0] - 1) < 1e-9 and abs(v[1]) < 1e-9\nv = top_component([[1, 1], [2, 2], [-1, -1]])\nassert all(abs(t - 0.5 ** 0.5) < 1e-9 for t in v)` },
          { name: "sign", code: `assert sign_align([1, 0], [[0, 5]], [[0, 1]]) == [1, 0]\nassert sign_align([0.6, -0.8], [[0, 2]], [[0, 1]]) == [-0.6, 0.8]` },
        ],
      },
    },
    {
      key: "bayes",
      rung: "stretch",
      prompt: (
        <p>
          Two equally likely Gaussian classes share the covariance diag(4, 1), with means (1, 0.5) and (-1, -0.5). What accuracy does the
          best possible classifier achieve? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.760, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Reading and steering act on one model. To ask what fine-tuning changed, compare two models feature by feature. That is model
        diffing.
      </p>
    </>
  ),
};
