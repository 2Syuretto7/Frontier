import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ProbeSelectivityViz } from "@/components/viz/ProbeSelectivityViz";
import type { LessonContent } from "@/lib/types";

const PROBE = `import math

def diff_means(X, y):
    d = len(X[0])
    m1 = [sum(x[i] for x, t in zip(X, y) if t == 1) / sum(y) for i in range(d)]
    m0 = [sum(x[i] for x, t in zip(X, y) if t == 0) / (len(y) - sum(y)) for i in range(d)]
    return [a - b for a, b in zip(m1, m0)]

def accuracy(w, b, X, y):
    return sum((sum(wi * xi for wi, xi in zip(w, x)) + b > 0) == (t == 1) for x, t in zip(X, y)) / len(y)

def train_probe(X, y, lr=0.5, steps=300):
    d, n = len(X[0]), len(X)
    w, b = [0.0] * d, 0.0
    for _ in range(steps):
        gw, gb = [0.0] * d, 0.0
        for x, t in zip(X, y):
            p = 1 / (1 + math.exp(-(sum(wi * xi for wi, xi in zip(w, x)) + b)))
            gw = [g + (p - t) * xi / n for g, xi in zip(gw, x)]
            gb += (p - t) / n
        w = [wi - lr * g for wi, g in zip(w, gw)]
        b -= lr * gb
    return w, b`;

const CONTROL = `import random

def control_labels(types, n_classes, seed):
    rng = random.Random(seed)
    table = {}
    for t in types:
        if t not in table:
            table[t] = rng.randrange(n_classes)
    return [table[t] for t in types]

def majority_baseline(y):
    return max(y.count(c) for c in set(y)) / len(y)

def project_out(X, v):
    vv = sum(a * a for a in v)
    return [[xi - sum(a * b for a, b in zip(x, v)) / vv * vi for xi, vi in zip(x, v)] for x in X]`;

export const lesson: LessonContent = {
  id: "l11.1.2",
  minutes: 50,
  links: {
    requires: ["l11.1.1", "l2.2.3"],
    revisits: ["m6.6.1", "l4.2.1", "m9.6.1"],
    foreshadows: ["l11.1.3", "l11.3.3", "l11.6.1", "l11.6.2"],
  },

  puzzle: (
    <>
      <p>
        A linear classifier trained on a language model&apos;s activations predicts each word&apos;s part of speech with 97% accuracy. A
        second classifier, trained on the same activations, predicts labels that were assigned to words completely at random, and
        reaches 90%. Does the model represent parts of speech?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A probe is a small model trained to read some property from a network&apos;s activations. High probe accuracy shows the property
        is decodable, but a flexible enough probe can decode almost anything by memorising, and decodable does not mean used. Good
        probing keeps the probe simple, compares against a control task that only memorisation can solve, and, to show use, removes
        the decoded information and checks whether the model&apos;s behaviour changes.
      </p>
      <ProbeSelectivityViz />
    </>
  ),

  theory: (
    <>
      <Definition title="linear probes">
        <p>
          Given activations <M>{"x \\in \\mathbb{R}^d"}</M> and binary labels, a linear probe predicts 1 when{" "}
          <M>{"w^\\top x + b > 0"}</M> (<C>accuracy</C>). It is usually trained by logistic regression (<C>train_probe</C>, l2.2.3). A
          simpler probe takes the difference of the class means as the direction (<C>diff_means</C>), with no training at all; it is
          often more robust, and the direction it finds is easier to use for interventions.
        </p>
        <Code>{PROBE}</Code>
      </Definition>

      <Theorem title="when the difference of means is optimal">
        <p>
          If the two classes are Gaussian with means <M>{"\\mu_0, \\mu_1"}</M> and a shared covariance <M>{"\\Sigma"}</M>, the most
          accurate classifier with equal priors is linear with direction <M>{"\\Sigma^{-1}(\\mu_1 - \\mu_0)"}</M>, and its accuracy is{" "}
          <M>{"\\Phi(\\Delta/2)"}</M>, where <M>{"\\Delta^2 = (\\mu_1-\\mu_0)^\\top\\Sigma^{-1}(\\mu_1-\\mu_0)"}</M>. The difference of means
          is optimal exactly when <M>{"\\mu_1 - \\mu_0"}</M> is an eigenvector of <M>{"\\Sigma"}</M>, for example when{" "}
          <M>{"\\Sigma"}</M> is a multiple of the identity.
        </p>
      </Theorem>
      <Proof>
        <p>
          The log-likelihood ratio is{" "}
          <M>{"(\\mu_1-\\mu_0)^\\top\\Sigma^{-1}x - \\tfrac12(\\mu_1^\\top\\Sigma^{-1}\\mu_1 - \\mu_0^\\top\\Sigma^{-1}\\mu_0)"}</M>, because the
          quadratic terms in x cancel; choosing the more likely class is optimal, and that rule is linear with the stated direction.
          Projected onto <M>{"v = \\Sigma^{-1}(\\mu_1-\\mu_0)"}</M>, each class is normal with variance <M>{"v^\\top\\Sigma v = \\Delta^2"}</M> and
          the means differ by <M>{"\\Delta^2"}</M>; thresholding at the midpoint errs with probability{" "}
          <M>{"\\Phi(-\\Delta^2/2 \\big/ \\Delta) = \\Phi(-\\Delta/2)"}</M>. Two directions give the same rule only when they are parallel, and{" "}
          <M>{"\\Sigma^{-1}(\\mu_1-\\mu_0)"}</M> is parallel to <M>{"\\mu_1-\\mu_0"}</M> exactly when the latter is an eigenvector.
        </p>
      </Proof>

      <Definition title="control tasks and selectivity">
        <p>
          A control task assigns each word type a random label, fixed across its occurrences (<C>control_labels</C>). It has no
          relation to the representation, so a probe can solve it only by memorising types. Selectivity is the real accuracy minus the
          control accuracy; a probe with high selectivity reads structure, while one with low selectivity reports its own capacity.
          Compare both with the majority baseline (<C>majority_baseline</C>), the accuracy of always predicting the commonest label.
          Capacity grows with dimension: an affine classifier in d dimensions can fit any labelling of d + 1 points in general position.
        </p>
        <Code>{CONTROL}</Code>
      </Definition>

      <Remark title="decodable is not used">
        <p>
          A probe shows that information is present, not that the model relies on it: the model may compute the property and never read
          it, or the probe may combine features the model keeps separate. To test use, remove the probed direction from the activations
          by projecting it out (<C>project_out</C>, m6.6.1), feed the edited activations onward, and measure the change in the
          model&apos;s behaviour. Repeating the removal until no linear probe succeeds is called iterative nullspace projection. If behaviour
          is unchanged, the information was not being used linearly through that direction.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          A probe that reaches 90% on random labels is memorising word types, so 97% on parts of speech shows little beyond what a lookup
          table would do; selectivity is only 7 points. A lower-capacity probe, such as a difference of means or a linear probe on fewer
          dimensions, with a larger gap to its control would be stronger evidence, and an ablation of the probed direction would show
          whether the model uses it.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "capacity",
      rung: "check",
      prompt: (
        <p>
          A probe is an affine classifier on 768-dimensional activations. What is the largest number of word types, with activations in
          general position, for which it can fit every possible random control labelling?
        </p>
      ),
      answer: { kind: "numeric", value: 769, tolerance: 0 },
    },
    {
      key: "project",
      rung: "check",
      prompt: (
        <p>
          An activation is (3, 1). After projecting out the direction (1, 2), what is the length of what remains? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.236, tolerance: 0.001 },
    },
    {
      key: "use",
      rung: "apply",
      prompt: (
        <p>
          A probe reads whether a statement is true from a layer with 85% accuracy and 30 points of selectivity. Projecting out the probe
          direction leaves the model&apos;s answers to true-or-false questions unchanged. What is the best conclusion?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Truth is linearly decodable there, but the model does not rely on that direction for these answers",
          "The probe is memorising, so truth is not represented",
          "The model represents truth and uses it, since selectivity is high",
          "Projection is too weak an intervention to mean anything",
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

def diff_means(X, y):
    d = len(X[0])
    m1 = [sum(x[i] for x, t in zip(X, y) if t == 1) / sum(y) for i in range(d)]
    m0 = [sum(x[i] for x, t in zip(X, y) if t == 0) / (len(y) - sum(y)) for i in range(d)]
    return [a - b for a, b in zip(m1, m0)]

def accuracy(w, b, X, y):
    return sum((sum(wi * xi for wi, xi in zip(w, x)) + b > 0) == (t == 1) for x, t in zip(X, y)) / len(y)

def train_probe(X, y, lr=0.5, steps=300):
    d, n = len(X[0]), len(X)
    w, b = [0.0] * d, 0.0
    for _ in range(steps):
        gw, gb = [0.0] * d, 0.0
        for x, t in zip(X, y):
            p = 1 / (1 + math.exp(-(sum(wi * xi for wi, xi in zip(w, x)) + b)))
            gw = [g + (p - t) * xi / n for g, xi in zip(gw, x)]
            gb += (p - t) / n
        w = [wi - lr * g for wi, g in zip(w, gw)]
        b -= lr * gb
    return w, b

X, y = [[0, 0], [2, 0], [1, 3], [1, 5]], [0, 0, 1, 1]
print(diff_means(X, y), accuracy([0, 1], -2, X, y), accuracy([1, 0], -1.5, X, y))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 4.0] 1.0 0.25",
          "[0.0, 4.0] 1.0 0.75",
          "[0.0, 8.0] 1.0 0.25",
          "[0.0, 4.0] 0.5 0.25",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import random

def control_labels(types, n_classes, seed):
    rng = random.Random(seed)
    table = {}
    for t in types:
        if t not in table:
            table[t] = rng.randrange(n_classes)
    return [table[t] for t in types]

def majority_baseline(y):
    return max(y.count(c) for c in set(y)) / len(y)

def project_out(X, v):
    vv = sum(a * a for a in v)
    return [[xi - sum(a * b for a, b in zip(x, v)) / vv * vi for xi, vi in zip(x, v)] for x in X]

c = control_labels(["a", "b", "a", "c", "b"], 2, 0)
print(c[0] == c[2] and c[1] == c[4], len(c), majority_baseline([1, 0, 1, 1]), project_out([[2.0, 1.0]], [1.0, 0.0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True 5 0.75 [[0.0, 1.0]]",
          "True 3 0.75 [[0.0, 1.0]]",
          "True 5 0.75 [[2.0, 0.0]]",
          "False 5 0.75 [[0.0, 1.0]]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Labels are 0 or 1. Write <C>diff_means(X, y)</C>, the mean of class 1 minus the mean of class 0;{" "}
          <C>accuracy(w, b, X, y)</C>, predicting 1 when <M>{"w^\\top x + b > 0"}</M>; and{" "}
          <C>train_probe(X, y, lr=0.5, steps=300)</C>, full-batch gradient descent on the mean logistic loss from zero weights and bias,
          returning (w, b).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def diff_means(X, y):
    return [0.0] * len(X[0])

def accuracy(w, b, X, y):
    return 0.0

def train_probe(X, y, lr=0.5, steps=300):
    return [0.0] * len(X[0]), 0.0
`,
        solution: PROBE,
        tests: [
          { name: "means", code: `X = [[1.0, 2.0], [3.0, 0.0], [-1.0, 1.0], [0.0, -2.0]]\ny = [1, 1, 0, 0]\nassert diff_means(X, y) == [2.5, 1.5]\nassert accuracy([1, 1], -1, X, y) == 1.0 and accuracy([1, -1], 0, X, y) == 0.5` },
          { name: "train", code: `X = [[1.0, 2.0], [3.0, 0.0], [-1.0, 1.0], [0.0, -2.0]]\ny = [1, 1, 0, 0]\nw, b = train_probe(X, y, lr=1.0, steps=1)\nassert abs(w[0] - 0.625) < 1e-12 and abs(w[1] - 0.375) < 1e-12 and abs(b) < 1e-12\nw, b = train_probe(X, y)\nassert accuracy(w, b, X, y) == 1.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>control_labels(types, n_classes, seed)</C>, giving each distinct type a label drawn with{" "}
          <C>random.Random(seed).randrange(n_classes)</C> in order of first appearance, the same for every occurrence;{" "}
          <C>majority_baseline(y)</C>; and <C>project_out(X, v)</C>, removing from each row its component along v.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import random

def control_labels(types, n_classes, seed):
    return [0] * len(types)

def majority_baseline(y):
    return 0.0

def project_out(X, v):
    return X
`,
        solution: CONTROL,
        tests: [
          { name: "control", code: `types = [i % 40 for i in range(200)]\nc = control_labels(types, 3, 1)\nassert all(c[i] == c[i % 40] for i in range(200)) and set(c) == {0, 1, 2}\nassert control_labels(list("abcabcdd"), 3, 7) == [1, 0, 1, 1, 0, 1, 2, 2]` },
          { name: "baseline", code: `assert abs(majority_baseline(["N", "V", "N", "D", "N"]) - 0.6) < 1e-12\nP = project_out([[3.0, 1.0], [1.0, 2.0]], [1.0, 2.0])\nassert all(abs(a - b) < 1e-12 for r, s in zip(P, [[2.0, -1.0], [0.0, 0.0]]) for a, b in zip(r, s))` },
        ],
      },
    },
    {
      key: "fisher",
      rung: "stretch",
      prompt: (
        <p>
          Two classes are Gaussian with means (1, 0) and (−1, 0) and shared covariance with unit variances and correlation 0.8. What is
          the accuracy of the best linear probe? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.952, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        A probe trained per layer asks what each layer knows. The next lesson reads every layer through the model&apos;s own output head
        and watches the prediction take shape.
      </p>
    </>
  ),
};
