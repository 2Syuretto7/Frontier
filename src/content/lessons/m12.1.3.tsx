import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CondEntropyViz } from "@/components/viz/CondEntropyViz";
import type { LessonContent } from "@/lib/types";

const JC = `import numpy as np

def H(p):
    p = np.asarray(p, dtype=float).ravel(); p = p[p > 0]
    return float(-(p * np.log2(p)).sum()) + 0.0

def conditional_entropy(P):
    px = P.sum(axis=1)
    return float(sum(px[i] * H(P[i] / px[i]) for i in range(len(px)) if px[i] > 0))

def specific_entropies(P):
    return [H(row / row.sum()) for row in P]`;

const DT = `import numpy as np

def counts_table(x, y, kx, ky):
    T = np.zeros((kx, ky))
    np.add.at(T, (x, y), 1)
    return T

def cond_entropy_from_data(x, y, kx, ky):
    T = counts_table(x, y, kx, ky); n = T.sum(); total = 0.0
    for row in T[T.sum(axis=1) > 0]:
        q = row[row > 0] / row.sum()
        total += row.sum() / n * float(-(q * np.log2(q)).sum())
    return float(total)

def best_feature(X, y, k, ky):
    scores = [cond_entropy_from_data(X[:, j], y, k, ky) for j in range(X.shape[1])]
    return int(np.argmin(scores)), scores`;

export const lesson: LessonContent = {
  id: "m12.1.3",
  minutes: 45,
  links: {
    requires: ["m12.1.2", "m7.5.1"],
    revisits: ["m7.1.5"],
    foreshadows: ["m12.1.4", "m12.2.3"],
  },

  puzzle: (
    <>
      <p>
        A quarter of patients have a condition, so before any test your uncertainty about a patient is 0.81 bits. A test
        comes back positive for half of all patients, including everyone who has the condition. After a negative result
        the uncertainty drops to 0, but after a positive result the odds are even and it rises to a full bit. Learning something made you less sure. Is that a paradox, and is there a sense in which
        information can never hurt? Decision trees choose their questions by exactly this calculation, so the answer
        matters.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        For two variables the joint entropy H(X, Y) measures the uncertainty in the pair. The conditional entropy H(Y | X)
        is what is left about Y once X is known, averaged over the values X might take. A particular value can leave you more
        uncertain than before, but on average knowing X can only help: H(Y | X) ≤ H(Y), with equality exactly when X tells
        you nothing about Y. And Y is a function of X precisely when no uncertainty is left.
      </p>
      <CondEntropyViz />
    </>
  ),

  theory: (
    <>
      <Definition title="joint and conditional entropy">
        <p>For a pair (X, Y) with joint probabilities <M>{"p(x, y)"}</M>,</p>
        <MD>{"H(X, Y) = -\\sum_{x, y} p(x, y)\\log_2 p(x, y), \\qquad H(Y \\mid X) = \\sum_x p(x)\\,H(Y \\mid X = x) = -\\sum_{x, y} p(x, y)\\log_2 p(y \\mid x)."}</MD>
        <p>
          Here <M>{"H(Y \\mid X = x)"}</M> is the entropy of the conditional distribution <M>{"p(\\cdot \\mid x)"}</M>, the
          specific conditional entropy. The two forms of H(Y | X) agree because <M>{"p(x, y) = p(x)p(y \\mid x)"}</M>.
        </p>
      </Definition>

      <Theorem title="conditioning reduces entropy on average">
        <p>
          <M>{"H(Y \\mid X) \\le H(Y)"}</M>, with equality if and only if X and Y are independent.
        </p>
      </Theorem>
      <Proof>
        <p>Summing over pairs with <M>{"p(x, y) > 0"}</M> and using Jensen&apos;s inequality for the concave log,</p>
        <MD>{"H(Y \\mid X) - H(Y) = \\sum_{x, y} p(x, y)\\log_2\\frac{p(y)}{p(y \\mid x)} \\le \\log_2\\sum_{x, y} p(x, y)\\frac{p(y)}{p(y \\mid x)} = \\log_2\\sum_{x, y} p(x)p(y) \\le \\log_2 1 = 0."}</MD>
        <p>
          The first line uses <M>{"H(Y) = -\\sum_{x, y} p(x, y)\\log_2 p(y)"}</M>. Equality needs{" "}
          <M>{"p(y)/p(y \\mid x)"}</M> to be a constant c on the support and the support to carry all of the mass of{" "}
          <M>{"p(x)p(y)"}</M>; summing <M>{"p(x)p(y) = c\\,p(x, y)"}</M> over the support then gives c = 1, which is
          independence. Conversely, independence makes every term 0.
        </p>
      </Proof>

      <Remark title="a particular value can increase uncertainty">
        <p>
          With <M>{"P = \\begin{pmatrix} 1/4 & 1/4 \\\\ 1/2 & 0 \\end{pmatrix}"}</M> (rows x, columns y), H(Y) = 0.811 bits,
          but <M>{"H(Y \\mid X = 0) = 1"}</M> and <M>{"H(Y \\mid X = 1) = 0"}</M>, averaging to 0.5. The theorem is about
          the average, which is what a decision you make before seeing X depends on.
        </p>
      </Remark>

      <Theorem title="zero conditional entropy means a function">
        <p>
          <M>{"H(Y \\mid X) = 0"}</M> if and only if, for every x with p(x) &gt; 0, Y takes a single value with probability
          1 given X = x; that is, Y = f(X) with probability 1. Also <M>{"H(X, Y) \\le H(X) + H(Y)"}</M>, with equality exactly
          under independence.
        </p>
      </Theorem>
      <Proof>
        <p>
          H(Y | X) is a sum of nonnegative terms <M>{"p(x)H(Y \\mid X = x)"}</M>, so it is 0 exactly when each{" "}
          <M>{"H(Y \\mid X = x)"}</M> with p(x) &gt; 0 is 0, which by the previous lesson means the conditional distribution
          is a point mass. For the second claim, the same Jensen argument gives{" "}
          <M>{"H(X, Y) - H(X) - H(Y) = \\sum p(x, y)\\log_2\\frac{p(x)p(y)}{p(x, y)} \\le \\log_2\\sum p(x)p(y) \\le 0"}</M>, with
          the same equality condition. The code also checks numerically that{" "}
          <M>{"H(X, Y) = H(X) + H(Y \\mid X)"}</M>, the chain rule of the next lesson.
        </p>
        <Code>{JC}</Code>
      </Proof>

      <Remark title="choosing questions: decision trees and the loss floor">
        <p>
          A decision tree splits on the feature that leaves the least conditional entropy of the label, equivalently the
          one with the largest information gain <M>{"H(Y) - H(Y \\mid X_j)"}</M>. The code estimates H(Y | X_j) from counts
          for three binary features: a copy of the label flipped 10% of the time (about h(0.1) = 0.47 bits), pure noise
          (about 1 bit) and a copy flipped 30% of the time (about 0.88 bits), and picks the first. H(Y | X) is also the
          smallest expected log loss, in bits, that any model predicting Y from X can achieve, a fact proved with the KL
          divergence in the next chapter.
        </p>
        <Code>{DT}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "hxy",
      rung: "check",
      prompt: (
        <p>
          For the joint table with rows x = 0, 1 and columns y = 0, 1 given by (1/4, 1/4) and (1/2, 0), what is H(X | Y) in
          bits? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.6887, tolerance: 0.0001 },
    },
    {
      key: "mod",
      rung: "check",
      prompt: <p>X is uniform on {"{"}0, 1, 2, 3{"}"} and Y = X mod 2. What is H(X | Y) in bits?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "avg",
      rung: "apply",
      prompt: <p>H(Y | X = x) can be larger than H(Y) for a particular x. Why does this not contradict H(Y | X) ≤ H(Y)?</p>,
      answer: {
        kind: "choice",
        options: [
          "The theorem bounds the average of H(Y | X = x) weighted by p(x); other values of x reduce the uncertainty by more",
          "H(Y | X = x) is not a valid entropy",
          "The theorem only holds when X and Y are independent",
          "H(Y | X = x) is always measured in nats rather than bits",
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

def H(p):
    p = np.asarray(p, dtype=float).ravel(); p = p[p > 0]
    return float(-(p * np.log2(p)).sum()) + 0.0

def conditional_entropy(P):
    px = P.sum(axis=1)
    return float(sum(px[i] * H(P[i] / px[i]) for i in range(len(px)) if px[i] > 0))

def specific_entropies(P):
    return [H(row / row.sum()) for row in P]

P = np.array([[0.25, 0.25], [0.5, 0.0]])
print(H(P), round(H(P.sum(axis=0)), 4), conditional_entropy(P), specific_entropies(P))
print(np.isclose(H(P), H(P.sum(axis=1)) + conditional_entropy(P)), conditional_entropy(np.eye(3) / 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.5 0.8113 0.5 [1.0, 0.0]\nTrue 0.0",
          "1.5 0.8113 1.0 [1.0, 0.0]\nTrue 0.0",
          "1.5 0.8113 0.5 [1.0, 0.0]\nTrue 1.585",
          "2.0 1.0 0.5 [0.5, 0.5]\nFalse 0.0",
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

def counts_table(x, y, kx, ky):
    T = np.zeros((kx, ky))
    np.add.at(T, (x, y), 1)
    return T

def cond_entropy_from_data(x, y, kx, ky):
    T = counts_table(x, y, kx, ky); n = T.sum(); total = 0.0
    for row in T[T.sum(axis=1) > 0]:
        q = row[row > 0] / row.sum()
        total += row.sum() / n * float(-(q * np.log2(q)).sum())
    return float(total)

def best_feature(X, y, k, ky):
    scores = [cond_entropy_from_data(X[:, j], y, k, ky) for j in range(X.shape[1])]
    return int(np.argmin(scores)), scores

rng = np.random.default_rng(0); y = rng.integers(0, 2, size=2000)
X = np.stack([y ^ (rng.random(2000) < 0.1), rng.integers(0, 2, size=2000), y ^ (rng.random(2000) < 0.3)], axis=1)
j, scores = best_feature(X.astype(int), y, 2, 2)
print(j, [round(s, 1) for s in scores], cond_entropy_from_data(y, y, 2, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0 [0.5, 1.0, 0.9] 0.0", "1 [0.5, 1.0, 0.9] 0.0", "0 [0.1, 0.5, 0.3] 0.0", "2 [0.9, 1.0, 0.5] 1.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For a joint probability table P with rows x and columns y, write <C>H(p)</C> for any array of probabilities,{" "}
          <C>conditional_entropy(P)</C> = H(Y | X), and <C>specific_entropies(P)</C>, the list of H(Y | X = x), all in bits
          as floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def H(p):
    return 0.0

def conditional_entropy(P):
    return 0.0

def specific_entropies(P):
    return []
`,
        solution: JC,
        tests: [
          { name: "basic", code: `assert np.isclose(H(np.full((2, 2), 0.25)), 2.0) and H([1.0, 0.0]) == 0.0
P = np.array([[0.4, 0.1], [0.1, 0.4]])
assert np.isclose(conditional_entropy(P), -(0.8 * np.log2(0.8) + 0.2 * np.log2(0.2)))
assert np.allclose(specific_entropies(P), [0.7219280948873623] * 2)` },
          { name: "cases", code: `assert np.isclose(conditional_entropy(np.outer([0.5, 0.5], [0.25, 0.75])), H([0.25, 0.75]))
P = np.array([[0.0, 0.3], [0.7, 0.0]]); assert conditional_entropy(P) == 0.0
P = np.array([[0.2, 0.1, 0.1], [0.0, 0.0, 0.0], [0.3, 0.2, 0.1]])
assert np.isclose(H(P), H(P.sum(axis=1)) + conditional_entropy(P))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>counts_table(x, y, kx, ky)</C>, the kx × ky table of counts of pairs; <C>cond_entropy_from_data(x, y, kx,
          ky)</C>, the plug-in estimate of H(Y | X) in bits as a float; and <C>best_feature(X, y, k, ky)</C>, returning the
          index of the column of X with the smallest estimate and the list of estimates.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def counts_table(x, y, kx, ky):
    return np.zeros((kx, ky))

def cond_entropy_from_data(x, y, kx, ky):
    return 0.0

def best_feature(X, y, k, ky):
    return 0, []
`,
        solution: DT,
        tests: [
          { name: "table", code: `T = counts_table(np.array([0, 0, 1, 2]), np.array([1, 1, 0, 1]), 3, 2)
assert np.allclose(T, [[0, 2], [1, 0], [0, 1]])
assert np.isclose(cond_entropy_from_data(np.array([0, 0, 1, 1]), np.array([0, 1, 0, 0]), 2, 2), 0.5)` },
          { name: "best", code: `y = np.array([0, 1, 0, 1, 0, 1, 0, 1]); X = np.stack([np.zeros(8, int), y, np.array([0, 0, 1, 1, 0, 0, 1, 1])], axis=1)
j, s = best_feature(X, y, 2, 2)
assert j == 1 and np.allclose(s, [1.0, 0.0, 1.0]) and isinstance(s[0], float)` },
        ],
      },
    },
    {
      key: "bsc",
      rung: "stretch",
      prompt: (
        <p>
          X is a fair bit and Y equals X except that it is flipped with probability 0.1. What is H(X, Y) in bits? Give four
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.469, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The code found that H(X, Y) = H(X) + H(Y | X): the uncertainty in a pair is the uncertainty in the first plus what
        remains about the second. The next lesson proves this chain rule and extends it to any number of variables.
      </p>
    </>
  ),
};
