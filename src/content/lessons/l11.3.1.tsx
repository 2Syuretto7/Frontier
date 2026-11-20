import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SuperpositionToyViz } from "@/components/viz/SuperpositionToyViz";
import type { LessonContent } from "@/lib/types";

const TOY = `import math

def reconstruct(W, b, x):
    h = [sum(w * v for w, v in zip(row, x)) for row in W]
    return [max(0.0, sum(W[k][i] * h[k] for k in range(len(W))) + b[i]) for i in range(len(x))]

def weighted_loss(W, b, xs, imp):
    return sum(sum(c * (y - v) ** 2 for c, y, v in zip(imp, reconstruct(W, b, x), x)) for x in xs) / len(xs)

def feature_norms(W):
    return [math.sqrt(sum(row[i] ** 2 for row in W)) for i in range(len(W[0]))]`;

const MEASURES = `import math

def interference(W, i):
    col = lambda j: [row[j] for row in W]
    wi = col(i)
    ni = math.sqrt(sum(v * v for v in wi))
    return sum(sum(a * b for a, b in zip(wi, col(j))) ** 2 for j in range(len(W[0])) if j != i) / ni ** 2

def dims_per_feature(W):
    return len(W) / sum(v * v for row in W for v in row)

def represented(W, thresh):
    return sum(math.sqrt(sum(row[i] ** 2 for row in W)) > thresh for i in range(len(W[0])))`;

export const lesson: LessonContent = {
  id: "l11.3.1",
  minutes: 55,
  links: {
    requires: ["l11.2.4", "l11.2.1"],
    revisits: ["m6.4.3", "l4.2.3"],
    foreshadows: ["l11.3.2", "l11.3.3", "l11.4.1"],
  },

  puzzle: (
    <>
      <p>
        A linear autoencoder that squeezes five features through two dimensions can do no better than keep the two most important and
        discard the rest. Add a ReLU at the output and train on features that are usually zero, and the trained model represents all
        five, in two dimensions, with low error. How can five things fit in two dimensions, and why does it depend on how often they are
        zero?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If features rarely occur together, they can share dimensions: write each in its own direction, accept that the directions are
        not orthogonal, and clean up the small cross-talk when only one is active. This is superposition. It is a good trade when
        features are sparse, because collisions are rare, and a bad one when they are dense. A tiny model trained on synthetic data
        shows the whole story, from dropping features, to antipodal pairs, to a pentagon.
      </p>
      <SuperpositionToyViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the toy model">
        <p>
          Features <M>{"x \\in [0,1]^n"}</M> are each zero with probability S, the sparsity, and otherwise uniform. A hidden layer of
          width <M>{"m < n"}</M> computes <M>{"h = Wx"}</M>, and the output is <M>{"x' = \\operatorname{ReLU}(W^\\top h + b)"}</M> (
          <C>reconstruct</C>). Training minimises <M>{"\\sum_i I_i (x_i - x_i')^2"}</M> with importances <M>{"I_i"}</M> (
          <C>weighted_loss</C>). Column i of W is the direction feature i is written in; its length (<C>feature_norms</C>) shows whether
          the feature is represented at all.
        </p>
        <Code>{TOY}</Code>
      </Definition>

      <Theorem title="without the ReLU, there is no superposition">
        <p>
          If the output is linear, <M>{"x' = W^\\top W x + b"}</M>, and features are uncorrelated with equal variance, the best W keeps at
          most m features, and the optimum is reached by the m most important ones on orthogonal directions.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"W^\\top W"}</M> has rank at most m. With uncorrelated, equal-variance features, after choosing b to fix the means, the loss
          is <M>{"\\sigma^2 \\sum_i I_i \\|e_i - (W^\\top W)_{:,i}\\|^2"}</M>, a weighted distance from the identity to a matrix of rank
          at most m. Scaling rows by <M>{"\\sqrt{I_i}"}</M>, the Eckart-Young theorem (m6.4.3) says the best rank-m approximation keeps the m
          largest singular values of <M>{"\\operatorname{diag}(\\sqrt{I})"}</M>, the m most important features, and zeroes the rest. Any
          interference between two kept features would add to the loss with nothing to remove it, so the kept ones are orthogonal.
        </p>
      </Proof>

      <Remark title="why the ReLU changes the answer">
        <p>
          When only feature i is active, a feature j written at an angle produces <M>{"(W_j \\cdot W_i) x_i"}</M> in output j. If that
          interference is negative, the ReLU removes it; a small negative bias removes small positive interference too. So the cost of
          superposition is paid only when several features are active at once, which happens with probability of order{" "}
          <M>{"(1-S)^2"}</M>, while the benefit, representing an extra feature, is earned with probability <M>{"1-S"}</M>. As S rises the
          trade favours superposition. Antipodal pairs, with <M>{"W_j = -W_i"}</M>, are the cheapest arrangement, since each one&apos;s
          interference on the other is always negative.
        </p>
      </Remark>

      <Definition title="measuring superposition">
        <p>
          The interference on feature i is <M>{"\\sum_{j \\ne i} (\\hat W_i \\cdot W_j)^2"}</M>, where <M>{"\\hat W_i"}</M> is the unit
          vector along <M>{"W_i"}</M> (<C>interference</C>). Dimensions per feature, <M>{"m / \\|W\\|_F^2"}</M> (<C>dims_per_feature</C>),
          is 1 when features get a dimension each and falls below 1 in superposition. Counting columns longer than a threshold (
          <C>represented</C>) gives the number of features the model keeps.
        </p>
        <Code>{MEASURES}</Code>
      </Definition>

      <Example title="the visualisation, read">
        <p>
          At S = 0 the model keeps features 1 and 2 orthogonally, as the theorem predicts for the linear case. At S = 0.7 it keeps four, as
          two antipodal pairs. From S = 0.9 all five sit at roughly 72 degrees apart, each with a bias near −0.2, and the loss falls by an
          order of magnitude. Superposition in real models is why individual neurons often respond to several unrelated things, the
          subject of the next lesson.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "dims",
      rung: "check",
      prompt: (
        <p>
          Five features are written as unit vectors forming a regular pentagon in two dimensions. How many dimensions per feature does
          the model use?
        </p>
      ),
      answer: { kind: "numeric", value: 0.4, tolerance: 0.001 },
    },
    {
      key: "interf",
      rung: "check",
      prompt: (
        <p>
          In that regular pentagon of unit vectors, what is the interference on one feature, the sum of squared dot products with the
          other four?
        </p>
      ),
      answer: { kind: "numeric", value: 1.5, tolerance: 0.001 },
    },
    {
      key: "dense",
      rung: "apply",
      prompt: (
        <p>
          A toy model compresses 20 features into 5 dimensions. Which change to the training data is most likely to reduce the number of
          features it represents?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Making the features active more often, so several are usually active together",
          "Making the features active less often",
          "Making all features equally important",
          "Training for longer",
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

def reconstruct(W, b, x):
    h = [sum(w * v for w, v in zip(row, x)) for row in W]
    return [max(0.0, sum(W[k][i] * h[k] for k in range(len(W))) + b[i]) for i in range(len(x))]

def weighted_loss(W, b, xs, imp):
    return sum(sum(c * (y - v) ** 2 for c, y, v in zip(imp, reconstruct(W, b, x), x)) for x in xs) / len(xs)

def feature_norms(W):
    return [math.sqrt(sum(row[i] ** 2 for row in W)) for i in range(len(W[0]))]

W = [[1, 0, -1], [0, 1, 0]]
print(reconstruct(W, [0, 0, 0], [1, 0, 0]), weighted_loss(W, [0, 0, 0], [[1, 0, 0], [0, 0, 1]], [1, 1, 1]), feature_norms(W))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 0.0, 0.0] 0.0 [1.0, 1.0, 1.0]",
          "[1, 0.0, -1] 0.0 [1.0, 1.0, 1.0]",
          "[1, 0.0, 0.0] 0.5 [1.0, 1.0, 1.0]",
          "[1, 0.0, 0.0] 0.0 [1.0, 1.0, 0.0]",
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

def interference(W, i):
    col = lambda j: [row[j] for row in W]
    wi = col(i)
    ni = math.sqrt(sum(v * v for v in wi))
    return sum(sum(a * b for a, b in zip(wi, col(j))) ** 2 for j in range(len(W[0])) if j != i) / ni ** 2

def dims_per_feature(W):
    return len(W) / sum(v * v for row in W for v in row)

def represented(W, thresh):
    return sum(math.sqrt(sum(row[i] ** 2 for row in W)) > thresh for i in range(len(W[0])))

W = [[1, 0, -1], [0, 1, 0]]
print(interference(W, 0), round(dims_per_feature(W), 3), represented(W, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 0.667 3",
          "0.0 0.667 3",
          "1.0 1.5 3",
          "1.0 0.667 2",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          W is a list of m rows of length n. Write <C>reconstruct(W, b, x)</C>, computing <M>{"\\operatorname{ReLU}(W^\\top W x + b)"}</M>;{" "}
          <C>weighted_loss(W, b, xs, imp)</C>, the mean over inputs of the importance-weighted squared error; and{" "}
          <C>feature_norms(W)</C>, the length of each column.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def reconstruct(W, b, x):
    return list(x)

def weighted_loss(W, b, xs, imp):
    return 0.0

def feature_norms(W):
    return [1.0] * len(W[0])
`,
        solution: TOY,
        tests: [
          { name: "reconstruct", code: `W = [[0.5, 1.0, 0.0], [1.0, 0.0, 0.1]]\nout = reconstruct(W, [-0.2, 0.1, 0.0], [1.0, 0.5, 0.0])\nassert all(abs(a - b) < 1e-12 for a, b in zip(out, [1.3, 1.1, 0.1]))` },
          { name: "loss", code: `W = [[0.5, 1.0, 0.0], [1.0, 0.0, 0.1]]\nassert abs(weighted_loss(W, [-0.2, 0.1, 0.0], [[1.0, 0.5, 0.0], [0.0, 0.0, 1.0]], [1.0, 0.9, 0.81]) - 0.6124905) < 1e-9\nn = feature_norms(W)\nassert abs(n[0] - 1.1180339887) < 1e-9 and abs(n[2] - 0.1) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>interference(W, i)</C>, the sum over other features j of the squared dot product of the unit vector along column i with
          column j; <C>dims_per_feature(W)</C>; and <C>represented(W, thresh)</C>, the number of columns longer than thresh.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def interference(W, i):
    return 0.0

def dims_per_feature(W):
    return 1.0

def represented(W, thresh):
    return len(W[0])
`,
        solution: MEASURES,
        tests: [
          { name: "interference", code: `W = [[0.5, 1.0, 0.0], [1.0, 0.0, 0.1]]\nassert abs(interference(W, 0) - 0.208) < 1e-12` },
          { name: "counts", code: `W = [[0.5, 1.0, 0.0], [1.0, 0.0, 0.1]]\nassert abs(dims_per_feature(W) - 0.8849557522) < 1e-9 and represented(W, 0.5) == 2 and represented([[3.0, 0.0]], 1.0) == 1` },
        ],
      },
    },
    {
      key: "single",
      rung: "stretch",
      prompt: (
        <p>
          Five unit feature vectors form a regular pentagon, every bias is −0.3, and only feature 1 is active, with value 1. What is the
          total squared reconstruction error over all five outputs, unweighted? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.09, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        If features are packed more densely than dimensions, no basis direction, including a single neuron, can correspond to a single
        feature. The next lesson looks at what that means for reading neurons.
      </p>
    </>
  ),
};
