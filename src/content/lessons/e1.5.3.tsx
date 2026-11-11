import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BroadcastViz } from "@/components/viz/BroadcastViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.5.3",
  minutes: 50,
  links: {
    requires: ["e1.5.2"],
    revisits: ["e1.5.1"],
    parallels: ["m3.3.2"],
    foreshadows: ["e1.5.5"],
  },

  puzzle: (
    <>
      <p>
        A data matrix <C>X</C> has 10,000 rows (examples) and 8 columns (features). You want to subtract each column&rsquo;s
        mean from that column. <C>X.mean(axis=0)</C> has shape <C>(8,)</C>.
      </p>
      <p>
        Does <C>X - X.mean(axis=0)</C> work, even though the shapes differ? Would you need to build a 10,000 by 8 matrix of
        repeated means first?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        It works, and nothing is copied. NumPy lines the two shapes up from the right, sees that the 8s match, and treats the
        missing axis as if the row of means were repeated 10,000 times, without storing the repeats. This is{" "}
        <strong>broadcasting</strong>. Try pairs of shapes.
      </p>
      <BroadcastViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the broadcasting rule">
        <p>To combine arrays of shapes <C>a</C> and <C>b</C> element by element:</p>
        <ol>
          <li>Pad the shorter shape on the left with 1s until both have the same length.</li>
          <li>On each axis, the sizes must be equal, or one of them must be 1.</li>
          <li>The result takes the larger size on each axis; a size-1 axis is reused along it.</li>
        </ol>
        <p>If any axis fails step 2, NumPy raises <C>ValueError: operands could not be broadcast together</C>.</p>
      </Definition>

      <Example title="standardising columns">
        <Code>{`mu = X.mean(axis=0)            # shape (8,)
sd = X.std(axis=0)             # shape (8,)
Z = (X - mu) / sd              # (10000, 8) with (8,): fine`}</Code>
        <p>
          For rows the same idea needs care. <C>X.sum(axis=1)</C> has shape <C>(10000,)</C>, which lines up with the 8 columns
          and fails. Keep the reduced axis with <C>keepdims=True</C>, giving shape <C>(10000, 1)</C>, and then{" "}
          <C>X / X.sum(axis=1, keepdims=True)</C> divides each row by its own sum.
        </p>
      </Example>

      <Example title="all pairs at once">
        <Code>{`A = np.random.rand(5, 2)       # 5 points in the plane
B = np.random.rand(7, 2)       # 7 more
diff = A[:, None, :] - B[None, :, :]       # (5, 1, 2) - (1, 7, 2) -> (5, 7, 2)
dist = np.sqrt((diff ** 2).sum(axis=-1))   # (5, 7): every distance, no loop`}</Code>
        <p>
          Indexing with <C>None</C> inserts a size-1 axis. Placing the 1s carefully turns &ldquo;every pair&rdquo; into one
          broadcast operation, the trick behind fast nearest-neighbour search and attention scores.
        </p>
      </Example>

      <Remark title="the silent danger">
        <p>
          Broadcasting can also succeed when you did not intend it. Subtracting a <C>(100,)</C> vector of targets from a{" "}
          <C>(100, 1)</C> column of predictions gives a <C>(100, 100)</C> matrix of every difference, not 100 errors, and the
          mean of it is a plausible-looking wrong number. Check shapes with assertions at the boundaries of your functions.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rule",
      rung: "check",
      prompt: <p>Two axes being lined up can be combined when&hellip;</p>,
      answer: { kind: "choice", options: ["their sizes are equal or one of them is 1", "their sizes are both even", "the first array is larger"], correct: [0] },
    },
    {
      key: "fail",
      rung: "check",
      prompt: <p>What happens with arrays of shapes <C>(3, 4)</C> and <C>(3,)</C>?</p>,
      answer: { kind: "choice", options: ["An error: 4 and 3 are compared and differ", "The result has shape (3, 4)", "The result has shape (3, 3, 4)"], correct: [0] },
    },
    {
      key: "size",
      rung: "apply",
      prompt: <p>How many elements does the result of combining shapes <C>(5, 1, 3)</C> and <C>(4, 1)</C> have?</p>,
      answer: { kind: "numeric", value: 60 },
    },
    {
      key: "pairs",
      rung: "apply",
      prompt: <p>How many elements does <C>diff</C> have in the all-pairs example?</p>,
      answer: { kind: "numeric", value: 70 },
    },
    {
      key: "rows",
      rung: "apply",
      prompt: <p>What happens with <C>X / X.sum(axis=1)</C> when <C>X</C> has shape <C>(100, 8)</C>?</p>,
      answer: { kind: "choice", options: ["An error, because (100, 8) and (100,) do not broadcast", "Each row is divided by its sum", "Each column is divided by its sum"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
a = np.ones((3, 1))
b = np.arange(4)
print((a + b).shape, (a * b).sum())`}</Code>
          <p>Broadcasting stretches axes of length 1. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(3, 4) 18.0", "(3, 1) 6.0", "(4, 3) 18.0", "An error"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
a = np.arange(3).reshape(3, 1)
b = np.arange(2)
print((a * 10 + b).tolist(), np.broadcast_shapes((5, 1, 4), (3, 1)))`}</Code>
          <p>Broadcasting a column against a row, and the broadcast shape rule. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[[0, 1], [10, 11], [20, 21]] (5, 3, 4)", "[[0, 10, 20], [1, 11, 21]] (5, 3, 4)", "[[0, 1], [10, 11], [20, 21]] (5, 3, 1)", "[0, 11, 22] (5, 3, 4)"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>standardise(X)</C>, which subtracts each column&rsquo;s mean and divides by each column&rsquo;s standard deviation, using broadcasting. Columns with standard deviation 0 should become all zeros instead of NaN.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def standardise(X):
    return (X - X.mean()) / X.std()
`,
        solution: `import numpy as np

def standardise(X):
    mu = X.mean(axis=0)
    sd = X.std(axis=0)
    sd = np.where(sd == 0, 1, sd)
    return (X - mu) / sd
`,
        tests: [
          { name: "columns", code: `import numpy as np
X = np.array([[1.0, 10.0], [3.0, 30.0], [5.0, 50.0]])
Z = standardise(X)
assert np.allclose(Z.mean(axis=0), 0) and np.allclose(Z.std(axis=0), 1), 'Use axis=0 for per-column statistics.'` },
          { name: "constant", code: `import numpy as np
Z = standardise(np.array([[1.0, 7.0], [2.0, 7.0]]))
assert not np.isnan(Z).any() and np.allclose(Z[:, 1], 0), 'A constant column has standard deviation 0.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>broadcast_shape(*shapes)</C>, the result shape of broadcasting, from the rules alone: align shapes on the right, and in each position the sizes must be equal or 1 (the result takes the larger); raise <C>ValueError</C> otherwise. Then write <C>pairwise(f, X, Y)</C>, which applies an elementwise function to every pair of rows of X (n × d) and Y (m × d) by broadcasting, returning the n × m × d array, and <C>nearest_centre(X, C)</C>, the index of the closest row of C for each row of X, using it.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def broadcast_shape(*shapes):
    return max(shapes, key=len)

def pairwise(f, X, Y):
    return f(X, Y)

def nearest_centre(X, C):
    return np.zeros(len(X), dtype=int)
`,
        solution: `import numpy as np

def broadcast_shape(*shapes):
    n = max((len(s) for s in shapes), default=0)
    out = []
    for i in range(1, n + 1):
        dims = {s[-i] for s in shapes if len(s) >= i} - {1}
        if len(dims) > 1:
            raise ValueError('shapes do not broadcast')
        out.append(dims.pop() if dims else 1)
    return tuple(reversed(out))

def pairwise(f, X, Y):
    return f(X[:, None, :], Y[None, :, :])

def nearest_centre(X, C):
    return (pairwise(np.subtract, X, C) ** 2).sum(-1).argmin(1)
`,
        tests: [
          { name: "rules", code: `assert broadcast_shape((5, 1, 4), (3, 1)) == (5, 3, 4) and broadcast_shape((3,), ()) == (3,) and broadcast_shape() == () and broadcast_shape((1,), (1, 1)) == (1, 1) and broadcast_shape((0,), (1,)) == (0,)` },
          { name: "numpy", code: `import numpy as np
import itertools, random
random.seed(5)
for _ in range(500):
    shapes = [tuple(random.choice([1, 2, 3]) for _ in range(random.randint(0, 3))) for _ in range(random.randint(1, 3))]
    try:
        want = np.broadcast_shapes(*shapes)
    except ValueError:
        want = None
    try:
        got = broadcast_shape(*shapes)
    except ValueError:
        got = None
    assert got == want, f'{shapes}'` },
          { name: "pairwise", code: `import numpy as np
X = np.arange(6.0).reshape(3, 2); Y = np.ones((4, 2))
P = pairwise(np.subtract, X, Y)
assert P.shape == (3, 4, 2) and np.allclose(P[2, 1], X[2] - Y[1])
C = np.array([[0.0, 0.0], [10.0, 10.0]])
assert nearest_centre(np.array([[1.0, 2.0], [9.0, 7.0], [5.0, 6.0]]), C).tolist() == [0, 1, 1]` },
        ],
      },
    },
    {
      key: "trap",
      rung: "prove",
      prompt: (
        <p>
          <C>pred</C> has shape <C>(100, 1)</C> and <C>y</C> has shape <C>(100,)</C>. Explain exactly what{" "}
          <C>((pred - y) ** 2).mean()</C> computes, why no error is raised, and two ways to fix and guard against it.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Aligns the shapes as (100, 1) and (1, 100), which broadcast to (100, 100).",
          "Explains the result is the mean over all 10,000 pairs (pred_i − y_j)², not the mean squared error.",
          "Fixes by reshaping, for example pred.squeeze(-1) or y[:, None], so both have the same shape.",
          "Guards with an assertion such as assert pred.shape == y.shape before computing the loss.",
        ],
      },
    },
    {
      key: "eight",
      rung: "stretch",
      prompt: <p>What is the size of axis 1 in the result of combining shapes <C>(8, 1, 6, 1)</C> and <C>(7, 1, 5)</C>?</p>,
      answer: { kind: "numeric", value: 7 },
    },
  ],

  teachBack:
    "Explain to a friend the broadcasting rule, how keepdims helps, and how broadcasting can silently produce the wrong shape.",

  glimpse: (
    <p>
      Next, indexing, and the difference between a view and a copy. Einsum, later in this chapter, names every axis explicitly,
      which removes most broadcasting mistakes.
    </p>
  ),
};
