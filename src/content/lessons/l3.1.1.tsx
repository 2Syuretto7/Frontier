import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PerceptronStepViz } from "@/components/viz/PerceptronStepViz";
import type { LessonContent } from "@/lib/types";

const PERC = `import numpy as np

def add_bias(X):
    return np.hstack([X, np.ones((len(X), 1))])

def perceptron(X, y, epochs):
    Xb = add_bias(X)
    w = np.zeros(Xb.shape[1])
    mistakes = []
    for _ in range(epochs):
        m = 0
        for x, t in zip(Xb, y):
            if t * (w @ x) <= 0:
                w = w + t * x
                m += 1
        mistakes.append(m)
        if m == 0:
            break
    return w, mistakes

def predict(w, X):
    return np.where(add_bias(X) @ w > 0, 1, -1)
`;

const FEAT = `def margin(w, X, y):
    Xb = add_bias(X)
    return float(np.min(y * (Xb @ w)) / np.linalg.norm(w[:-1]))

def xor_features(X):
    return np.hstack([X, (X[:, 0] * X[:, 1])[:, None]])
`;

export const lesson: LessonContent = {
  id: "l3.1.1",
  minutes: 50,
  links: {
    requires: ["l0.4.2", "l1.2.4"],
    revisits: ["l0.3.4"],
    parallels: ["e5.1.3"],
    foreshadows: ["l3.1.2", "l3.1.4"],
  },

  puzzle: (
    <>
      <p>
        A machine sees points labelled +1 or −1 and must find a line with all the +1s on one side. Its only rule: whenever it
        gets a point wrong, nudge the line towards that point. Will the nudging ever stop? And is there data for which no
        amount of nudging can work?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The perceptron keeps a weight vector <M>{"w"}</M> and predicts <M>{"\\operatorname{sign}(w \\cdot x)"}</M>. On a
        mistake it adds <M>{"y\\,x"}</M> to <M>{"w"}</M>, which raises <M>{"y\\,(w \\cdot x)"}</M> by{" "}
        <M>{"\\lVert x \\rVert^2"}</M>, so the same point is now closer to being right. If some line separates the data with
        room to spare, every mistake moves <M>{"w"}</M> measurably towards it, and the mistakes must run out.
      </p>
      <PerceptronStepViz />
      <p>
        XOR has no separating line at all, and the perceptron then keeps making mistakes forever. That one example, pointed out
        by Minsky and Papert in 1969, is why single neurons are not enough.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="the perceptron">
        <p>
          Append a constant 1 to every input so that the bias is the last weight. Start from <M>{"w = 0"}</M>. Visit the
          examples in order; whenever <M>{"y_i\\,(w \\cdot x_i) \\le 0"}</M>, set <M>{"w \\leftarrow w + y_i x_i"}</M>. Stop
          after an epoch with no mistakes.
        </p>
        <Code>{PERC}</Code>
      </Definition>

      <Theorem title="perceptron convergence (Novikoff)">
        <p>
          Suppose <M>{"\\lVert x_i \\rVert \\le R"}</M> for all i, and some unit vector <M>{"u"}</M> satisfies{" "}
          <M>{"y_i\\,(u \\cdot x_i) \\ge \\gamma > 0"}</M> for all i. Then the perceptron makes at most{" "}
          <M>{"(R/\\gamma)^2"}</M> mistakes, whatever the order of the examples.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"w_k"}</M> be the weights after k mistakes. Each mistake adds <M>{"y_i x_i"}</M>, so{" "}
          <M>{"u \\cdot w_{k} = u \\cdot w_{k-1} + y_i\\,(u \\cdot x_i) \\ge u \\cdot w_{k-1} + \\gamma"}</M>, giving{" "}
          <M>{"u \\cdot w_k \\ge k\\gamma"}</M>. Also{" "}
          <M>{"\\lVert w_k \\rVert^2 = \\lVert w_{k-1} \\rVert^2 + 2y_i\\,(w_{k-1} \\cdot x_i) + \\lVert x_i \\rVert^2 \\le \\lVert w_{k-1} \\rVert^2 + R^2"}</M>,
          because the middle term is at most 0 on a mistake; so <M>{"\\lVert w_k \\rVert^2 \\le kR^2"}</M>. By Cauchy–Schwarz,{" "}
          <M>{"k\\gamma \\le u \\cdot w_k \\le \\lVert w_k \\rVert \\le \\sqrt{k}\\,R"}</M>, hence <M>{"k \\le (R/\\gamma)^2"}</M>.
        </p>
      </Proof>

      <Theorem title="XOR is not linearly separable">
        <p>
          No <M>{"w_1, w_2, b"}</M> satisfy <M>{"w_1 x_1 + w_2 x_2 + b > 0"}</M> exactly on the XOR-true points (0, 1) and (1,
          0) and not on (0, 0) and (1, 1).
        </p>
      </Theorem>
      <Proof>
        <p>
          The two true points require <M>{"w_2 + b > 0"}</M> and <M>{"w_1 + b > 0"}</M>; adding gives{" "}
          <M>{"w_1 + w_2 + 2b > 0"}</M>. The two false points require <M>{"b \\le 0"}</M> and <M>{"w_1 + w_2 + b \\le 0"}</M>;
          adding gives <M>{"w_1 + w_2 + 2b \\le 0"}</M>. Both cannot hold.
        </p>
      </Proof>

      <Example title="a feature rescues XOR">
        <p>
          With inputs coded as ±1, XOR is the sign of <M>{"-x_1 x_2"}</M>. Adding the product <M>{"x_1 x_2"}</M> as a third
          feature makes the data separable, and the perceptron finds it at once. Choosing such features by hand does not
          scale; a hidden layer learns them, which is the subject of the next lesson.
        </p>
        <Code>{FEAT}</Code>
      </Example>

      <Remark title="the margin">
        <p>
          The quantity <M>{"\\min_i y_i\\,(w \\cdot x_i) / \\lVert w \\rVert"}</M>, with the bias left out of the norm, is the
          distance from the line to the closest point. The bound <M>{"(R/\\gamma)^2"}</M> says that data separable with a wide
          margin is learned quickly. The same quantity returns in support vector machines and in theories of generalisation.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "update",
      rung: "check",
      prompt: <p>The perceptron misclassifies an example x with label y ∈ {"{−1, +1}"}. What is the update?</p>,
      answer: { kind: "choice", options: ["w ← w + y·x", "w ← w − y·x", "w ← w + x", "w ← y·x"], correct: [0] },
    },
    {
      key: "bound",
      rung: "check",
      prompt: <p>All inputs have norm at most R = 2, and the data are separable with margin γ = 0.5. What is Novikoff&rsquo;s bound on the number of mistakes?</p>,
      answer: { kind: "numeric", value: 16 },
    },
    {
      key: "xor",
      rung: "apply",
      prompt: <p>Which of these labellings of the four corners of the unit square can a single perceptron represent?</p>,
      answer: {
        kind: "choice",
        options: ["AND, OR and NAND, but not XOR", "All sixteen labellings", "Only AND", "XOR, but not AND"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${PERC}
X = np.array([[2.0, 1.0], [1.0, 3.0], [-1.0, -1.0], [-2.0, 1.0]])
y = np.array([1, 1, -1, -1])
w, m = perceptron(X, y, 10)
print(w.tolist(), m, predict(w, X).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.0, 1.0, 1.0] [1, 0] [1, 1, -1, -1]",
          "[2.0, 1.0, 0.0] [1, 0] [1, 1, -1, -1]",
          "[2.0, 1.0, 1.0] [1] [1, 1, -1, -1]",
          "[0.0, 0.0, 0.0] [0] [-1, -1, -1, -1]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${PERC}
X = np.array([[0.0, 0.0], [0.0, 1.0], [1.0, 0.0], [1.0, 1.0]])
y = np.array([-1, 1, 1, -1])
w, m = perceptron(X, y, 6)
print(m)`}</Code>
          <p>The perceptron on XOR. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[4, 4, 4, 4, 4, 4]", "[4, 2, 0]", "[2, 2, 2, 2, 2, 2]", "[4, 0]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>add_bias(X)</C>, which appends a column of ones; <C>perceptron(X, y, epochs)</C>, which starts from zero
          weights, applies the update on every example with <M>{"y\\,(w \\cdot x) \\le 0"}</M>, records the number of mistakes in
          each epoch, stops after an epoch with none, and returns (w, list of mistake counts); and <C>predict(w, X)</C>,
          returning +1 where <M>{"w \\cdot x > 0"}</M> and −1 elsewhere.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def add_bias(X):
    return X

def perceptron(X, y, epochs):
    return np.zeros(X.shape[1] + 1), []

def predict(w, X):
    return np.ones(len(X))
`,
        solution: PERC,
        tests: [
          { name: "separable data", code: `rng = np.random.default_rng(0)
X = rng.normal(size=(200, 2))
y = np.where(X @ np.array([1.0, -2.0]) + 0.3 > 0, 1, -1)
keep = np.abs(X @ np.array([1.0, -2.0]) + 0.3) > 0.2
X, y = X[keep], y[keep]
w, m = perceptron(X, y, 1000)
assert m[-1] == 0 and len(m) < 1000 and np.all(predict(w, X) == y), m[-5:]
assert add_bias(np.zeros((3, 2))).shape == (3, 3)` },
          { name: "exact trace", code: `X = np.array([[2.0, 1.0], [1.0, 3.0], [-1.0, -1.0], [-2.0, 1.0]])
w, m = perceptron(X, np.array([1, -1, 1, -1]), 50)
assert np.allclose(w, [3.0, -4.0, 2.0]) and m == [2, 2, 2, 0], (w, m)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With <C>add_bias</C>, <C>perceptron</C> and <C>predict</C> defined, write <C>margin(w, X, y)</C>, the smallest{" "}
          <M>{"y_i\\,(w \\cdot \\tilde x_i)"}</M> divided by the norm of w without its bias entry (as a float), and{" "}
          <C>xor_features(X)</C>, which appends the product of the two input columns as a third column.
        </p>
      ),
      answer: {
        kind: "code",
        setup: PERC,
        starter: `# add_bias, perceptron and predict are already defined.

def margin(w, X, y):
    return 0.0

def xor_features(X):
    return X
`,
        solution: FEAT,
        tests: [
          { name: "margin", code: `X = np.array([[1.0, 0.0], [-1.0, 0.0], [3.0, 1.0]])
y = np.array([1, -1, 1])
assert abs(margin(np.array([2.0, 0.0, 0.0]), X, y) - 1.0) < 1e-12
assert abs(margin(np.array([1.0, 0.0, -0.5]), X, y) - 0.5) < 1e-12` },
          { name: "XOR becomes separable", code: `X = np.array([[-1.0, -1.0], [-1.0, 1.0], [1.0, -1.0], [1.0, 1.0]])
y = np.array([-1, 1, 1, -1])
F = xor_features(X)
assert F.shape == (4, 3) and F[:, 2].tolist() == [1.0, -1.0, -1.0, 1.0]
w, m = perceptron(F, y, 20)
assert m[-1] == 0 and np.all(predict(w, F) == y) and margin(w, F, y) > 0.9` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that no single linear threshold unit computes XOR on the four points (0, 0), (0, 1), (1, 0), (1, 1).</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes the four strict or non-strict inequalities a separating (w₁, w₂, b) would need: w₂ + b > 0 and w₁ + b > 0 for the true points, b ≤ 0 and w₁ + w₂ + b ≤ 0 for the false points.",
          "Adds the two true-point inequalities and the two false-point inequalities to get w₁ + w₂ + 2b > 0 and w₁ + w₂ + 2b ≤ 0.",
          "Concludes the contradiction (or gives an equivalent convexity argument: the midpoint (½, ½) lies on both segments joining the true points and the false points).",
        ],
      },
    },
    {
      key: "updates",
      rung: "stretch",
      prompt: <p>Each update raises y·(w·x) for the misclassified point by how much, in terms of x?</p>,
      answer: {
        kind: "choice",
        options: ["By ‖x‖², the squared length of the input", "By 1", "By ‖w‖", "It may go down"],
        correct: [0],
      },
    },
  ],

  teachBack:
    "Explain to a friend how the perceptron learns, why it must stop on separable data, and why XOR defeats it.",

  glimpse: (
    <p>
      XOR needed a new feature. A hidden layer of neurons can learn such features itself, and with a smooth activation it can
      be trained by gradient descent. Next: the multilayer perceptron.
    </p>
  ),
};
