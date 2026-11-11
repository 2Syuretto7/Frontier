import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { VectoriseViz } from "@/components/viz/VectoriseViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.5.2",
  minutes: 50,
  links: {
    requires: ["e1.5.1"],
    revisits: ["e0.2.2"],
    parallels: ["m3.1.2"],
    foreshadows: ["e1.5.3"],
  },

  puzzle: (
    <>
      <p>Two ways to compute the mean squared error between ten million predictions and targets:</p>
      <Code>{`total = 0.0
for p, t in zip(pred, target):
    total += (p - t) ** 2
mse = total / len(pred)

mse = np.mean((pred - target) ** 2)`}</Code>
      <p>
        They do the same arithmetic. On a typical laptop, the second is around a hundred times faster. Where could that
        difference come from, if not the arithmetic?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In the loop, Python handles each number as a separate object: it fetches it, checks its type, finds the right
        subtraction, builds a new object for the result. The arithmetic is a sliver of the work. A <strong>vectorised</strong>{" "}
        expression hands the whole array to compiled code, which knows the type once and then only does arithmetic, often
        several numbers per instruction.
      </p>
      <VectoriseViz />
    </>
  ),

  theory: (
    <>
      <Definition title="vectorisation">
        <p>
          <strong>Vectorising</strong> means expressing a computation as operations on whole arrays rather than loops over
          elements. Arithmetic and comparison operators work element by element (<C>a * b</C>, <C>a &gt; 0</C>), and{" "}
          <strong>universal functions</strong> such as <C>np.exp</C>, <C>np.sqrt</C> and <C>np.maximum</C> apply to every
          element. <strong>Reductions</strong> such as <C>sum</C>, <C>mean</C>, <C>max</C> and <C>argmax</C> collapse an axis.
        </p>
      </Definition>

      <Example title="replacing branches">
        <Code>{`x = np.array([-2.0, 0.5, 3.0])
relu = np.maximum(x, 0)                 # [0. , 0.5, 3. ]
clipped = np.where(x > 1, 1.0, x)       # [-2. , 0.5, 1. ]
frac_positive = (x > 0).mean()          # True counts as 1: 0.666...`}</Code>
        <p>
          An <C>if</C> inside a loop becomes a boolean array and <C>np.where</C>; a count becomes the sum or mean of a boolean
          array.
        </p>
      </Example>

      <Example title="a stable softmax">
        <Code>{`def softmax(z):
    z = z - z.max()           # subtracting a constant does not change the result
    e = np.exp(z)             # but stops exp from overflowing
    return e / e.sum()`}</Code>
        <p>
          Without the first line, <C>np.exp(1000)</C> overflows to infinity and the answer becomes <C>nan</C>. With it, the
          largest exponent is <C>exp(0) = 1</C>. Vectorised code still needs numerical care.
        </p>
      </Example>

      <Remark title="when loops remain">
        <p>
          Loops over a few items, such as epochs or layers, are fine: the overhead is per trip, and there are few trips. What
          must be vectorised is the inner loop over thousands or millions of numbers. The same principle drives GPUs, which run
          one operation across thousands of numbers at once.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "why",
      rung: "check",
      prompt: <p>Why is <C>a + b</C> on NumPy arrays much faster than a Python loop over the elements?</p>,
      answer: { kind: "choice", options: ["It avoids the interpreter's per-element overhead by running a compiled loop over raw numbers", "NumPy uses a faster kind of addition", "It skips some elements"], correct: [0] },
    },
    {
      key: "which",
      rung: "check",
      prompt: <p>Which of these is vectorised?</p>,
      answer: { kind: "choice", options: ["np.sqrt(x).sum()", "sum(math.sqrt(v) for v in x)", "[math.sqrt(v) for v in x]"], correct: [0] },
    },
    {
      key: "sq",
      rung: "apply",
      prompt: <p>With <C>x = np.arange(5)</C>, what is <C>(x ** 2).sum()</C>?</p>,
      answer: { kind: "numeric", value: 30 },
    },
    {
      key: "where",
      rung: "apply",
      prompt: <p>With <C>x = np.arange(5)</C>, what is <C>np.where(x &gt; 2, x, 0).sum()</C>?</p>,
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "frac",
      rung: "apply",
      prompt: <p>What is <C>np.mean(np.array([1, 5, 3, 8]) &gt; 2)</C>?</p>,
      answer: { kind: "numeric", value: 0.75 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
x = np.array([1.0, 2.0, 3.0, 4.0])
print((x - x.mean()) @ (x - x.mean()) / len(x))`}</Code>
          <p>One vectorised line computes a statistic. What value does it print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 1.25 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
x = np.array([3, 1, 4, 1, 5, 9, 2])
print(np.cumsum(x)[-1], np.diff(x).tolist(), np.where(x > 3, x, 0).tolist(), (x[1:] > x[:-1]).sum())`}</Code>
          <p>Four vectorised one-liners on the same array. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["25 [-2, 3, -3, 4, 4, -7] [0, 0, 4, 0, 5, 9, 0] 3", "25 [2, -3, 3, -4, -4, 7] [0, 0, 4, 0, 5, 9, 0] 3", "25 [-2, 3, -3, 4, 4, -7] [3, 1, 4, 1, 5, 9, 2] 3", "25 [-2, 3, -3, 4, 4, -7] [0, 0, 4, 0, 5, 9, 0] 4"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>pairwise_dist(X)</C>, which returns the n × n matrix of Euclidean distances between the rows of an n × d array, with no Python loops. Use ‖a − b‖² = ‖a‖² + ‖b‖² − 2a·b and clip small negatives to 0 before the square root.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def pairwise_dist(X):
    n = len(X)
    D = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            D[i, j] = np.abs(X[i] - X[j]).sum()
    return D
`,
        solution: `import numpy as np

def pairwise_dist(X):
    sq = (X ** 2).sum(axis=1)
    D2 = sq[:, None] + sq[None, :] - 2 * X @ X.T
    return np.sqrt(np.clip(D2, 0, None))
`,
        tests: [
          { name: "small", code: `import numpy as np
D = pairwise_dist(np.array([[0.0, 0.0], [3.0, 4.0], [6.0, 8.0]]))
assert np.allclose(D, [[0, 5, 10], [5, 0, 5], [10, 5, 0]]), 'Distances are Euclidean, not the sum of absolute differences.'` },
          { name: "random", code: `import numpy as np
rng = np.random.default_rng(0)
X = rng.normal(size=(50, 8))
ref = np.sqrt(((X[:, None, :] - X[None, :, :]) ** 2).sum(-1))
assert np.allclose(pairwise_dist(X), ref, atol=1e-6), 'Check the formula on random data.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            No Python loops over elements in any of these. Write <C>moving_average(x, k)</C>, the means of every window of k consecutive values (length n − k + 1), from one <C>np.cumsum</C>; <C>histogram(x, bins, lo, hi)</C>, the counts in bins equal-width bins over [lo, hi] (values equal to hi go in the last bin; values outside are ignored) using <C>np.floor</C> and <C>np.bincount</C>; and <C>ranks(x)</C>, ranks from 1 with tied values sharing the average of their ranks.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def moving_average(x, k):
    return np.array([x[i:i + k].mean() for i in range(len(x) - k + 1)])

def histogram(x, bins, lo, hi):
    return np.zeros(bins, dtype=int)

def ranks(x):
    return np.argsort(np.argsort(x)) + 1.0
`,
        solution: `import numpy as np

def moving_average(x, k):
    c = np.cumsum(np.concatenate([[0.0], np.asarray(x, float)]))
    return (c[k:] - c[:-k]) / k

def histogram(x, bins, lo, hi):
    x = np.asarray(x, float)
    x = x[(x >= lo) & (x <= hi)]
    idx = np.minimum(np.floor((x - lo) / (hi - lo) * bins).astype(int), bins - 1)
    return np.bincount(idx, minlength=bins)

def ranks(x):
    x = np.asarray(x)
    order = np.argsort(x, kind='stable')
    r = np.empty(len(x)); r[order] = np.arange(1, len(x) + 1)
    vals, inv = np.unique(x, return_inverse=True)
    sums = np.bincount(inv, weights=r); counts = np.bincount(inv)
    return (sums / counts)[inv]
`,
        tests: [
          { name: "moving", code: `import numpy as np
assert np.allclose(moving_average(np.array([1, 2, 3, 4, 5]), 2), [1.5, 2.5, 3.5, 4.5]) and np.allclose(moving_average(np.arange(10.0), 10), [4.5])
rng = np.random.default_rng(0); x = rng.normal(size=10 ** 6)
m = moving_average(x, 50)
assert len(m) == 10 ** 6 - 49 and abs(m[123] - x[123:173].mean()) < 1e-9, 'Fast on a million values.'` },
          { name: "histogram", code: `import numpy as np
rng = np.random.default_rng(1); x = rng.normal(size=5000)
assert np.array_equal(histogram(x, 12, -2.0, 2.0), np.histogram(x, 12, (-2.0, 2.0))[0]), 'Agree with np.histogram.'
assert histogram([0, 1, 1, 2, 5], 2, 0, 2).tolist() == [1, 3], 'hi itself goes in the last bin.'` },
          { name: "ranks", code: `import numpy as np
from scipy.stats import rankdata
rng = np.random.default_rng(2)
for _ in range(20):
    x = rng.integers(0, 6, 30)
    assert np.allclose(ranks(x), rankdata(x)), 'Ties share the average rank.'
assert ranks([10, 30, 20, 20]).tolist() == [1.0, 4.0, 2.5, 2.5]` },
        ],
      },
    },
    {
      key: "acc",
      rung: "prove",
      prompt: (
        <>
          <p>Rewrite this loop without any Python loop, and explain why your version computes the same value.</p>
          <Code>{`correct = 0
for p, t in zip(pred, target):
    if p == t:
        correct += 1
acc = correct / len(pred)`}</Code>
        </>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Assumes pred and target are NumPy arrays of the same length, converting them with np.asarray if needed.",
          "Replaces it with acc = (pred == target).mean(), or np.mean(pred == target).",
          "Explains that pred == target is a boolean array with True exactly where the loop's condition holds.",
          "Explains that the mean of a boolean array counts True as 1 and False as 0 and divides by the length, matching the loop's arithmetic.",
        ],
      },
    },
    {
      key: "softmax",
      rung: "stretch",
      prompt: <p>Using the stable <C>softmax</C> above, what is the first entry of <C>softmax(np.array([1000.0, 1000.0]))</C>?</p>,
      answer: { kind: "numeric", value: 0.5 },
    },
  ],

  teachBack:
    "Explain to a friend why vectorised NumPy code is fast, how to replace an if inside a loop, and why softmax subtracts the maximum first.",

  glimpse: (
    <p>
      Next, broadcasting, which lets arrays of different shapes be combined without copying. On GPUs, vectorised thinking is not
      an optimisation but the only way to work.
    </p>
  ),
};
