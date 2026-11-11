import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem } from "@/components/lesson/Blocks";
import { PerceptronViz } from "@/components/viz/PerceptronViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l0.4.2",
  minutes: 50,
  links: {
    revisits: ["l0.3.4"],
    foreshadows: ["l3.1.1", "l3.2.1"],
  },

  puzzle: (
    <>
      <p>
        In July 1958, a newspaper reported that the US Navy had revealed the embryo of an electronic computer that it
        expected would be able to &ldquo;walk, talk, see, write, reproduce itself and be conscious of its existence.&rdquo;
        The machine was a single layer of artificial neurons that learned to tell simple shapes apart.
      </p>
      <p>
        Eleven years later, a book proved that such machines could not even tell whether the number of black squares in a
        pattern was odd or even. Who was right about neural networks: the newspaper, the book, or neither?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Frank Rosenblatt&rsquo;s perceptron was the neuron of the last chapter with one new idea: a rule for learning its
        weights from examples, with no human setting them. Show it an example. If it answers correctly, do nothing. If it
        answers wrongly, nudge the weights so the boundary moves towards getting that example right. Step through it below.
      </p>
      <PerceptronViz />
      <p>
        On separable data, the line settles after a few passes and never moves again. On the XOR pattern it never settles,
        because no line can be right about every point. The newspaper overpromised; the book proved a real limit. But the
        limit was for <em>one</em> layer, and the lesson that layers fix it took decades to sink in.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="the perceptron learning rule">
        <p>
          Label the classes <M>{"y = +1"}</M> and <M>{"y = -1"}</M>. The perceptron predicts the sign of{" "}
          <M>{"w_1 x_1 + w_2 x_2 + b"}</M>. Visit the training examples in turn. Whenever one is misclassified, update
        </p>
        <MD>{"w_1 \\leftarrow w_1 + \\eta\\, y\\, x_1, \\quad w_2 \\leftarrow w_2 + \\eta\\, y\\, x_2, \\quad b \\leftarrow b + \\eta\\, y,"}</MD>
        <p>where <M>{"\\eta"}</M>, the <strong>learning rate</strong>, is a small positive number. Correct examples change nothing.</p>
      </Definition>

      <p>
        Why does this help? After the update, the sum for that same example grows by{" "}
        <M>{"\\eta(x_1^2 + x_2^2 + 1)"}</M> in the direction of <M>y</M>: positive if it should have been positive, negative
        if negative. The example is pushed towards the right side of the line.
      </p>

      <Theorem title="perceptron convergence">
        <p>
          If the training data are linearly separable, the perceptron learning rule makes only finitely many updates and then
          classifies every training example correctly.
        </p>
      </Theorem>

      <Example title="the history, briefly">
        <p>
          Warren McCulloch and Walter Pitts described artificial neurons in 1943. Rosenblatt&rsquo;s perceptron followed in
          1958, built as a machine with a camera of 400 light sensors. In 1969 Marvin Minsky and Seymour Papert&rsquo;s book{" "}
          <em>Perceptrons</em> proved carefully what single-layer perceptrons cannot compute, including XOR and parity. Funding
          for neural network research largely dried up, and by the mid-1970s, after critical government reviews such as the
          British Lighthill report of 1973, AI in general entered its first <strong>winter</strong>.
        </p>
      </Example>

      <Definition title="backpropagation">
        <p>
          Multi-layer networks could compute XOR, but nobody had a practical way to train the hidden layers. In 1986 David
          Rumelhart, Geoffrey Hinton and Ronald Williams popularised <strong>backpropagation</strong>, a way to compute how
          every weight in every layer should change to reduce the loss. It remains the method by which all large neural
          networks are trained.
        </p>
      </Definition>

      <Remark title="cycles of hype">
        <p>
          AI has gone through repeated cycles: bold predictions, generous funding, disappointment, winter. Each time, the
          overpromise came from extrapolating early success on easy problems. That history is a reason to read today&rsquo;s
          claims carefully, in either direction: the 1958 prediction was wildly early, and the 1970s pessimism turned out to
          be wrong too.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "year",
      rung: "check",
      prompt: <p>In what year did Rosenblatt introduce the perceptron?</p>,
      answer: { kind: "numeric", value: 1958 },
    },
    {
      key: "no-change",
      rung: "check",
      prompt: <p>The perceptron classifies an example correctly. What does the learning rule do?</p>,
      answer: { kind: "choice", options: ["Nothing", "Moves the line towards the example", "Doubles the learning rate"], correct: [0] },
    },
    {
      key: "update",
      rung: "apply",
      prompt: (
        <p>
          Weights are <M>{"w_1 = 1, w_2 = -1, b = 0"}</M>, and the learning rate is 1. The example <M>{"(2, 3)"}</M> with label{" "}
          <M>{"+1"}</M> is misclassified. What is <M>{"w_2"}</M> after the update?
        </p>
      ),
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "after",
      rung: "apply",
      prompt: <p>After that update, what is the new sum <M>{"w_1 x_1 + w_2 x_2 + b"}</M> for the example (2, 3)?</p>,
      answer: { kind: "numeric", value: 13 },
    },
    {
      key: "never",
      rung: "apply",
      prompt: <p>On which data will the perceptron rule keep making updates for ever?</p>,
      answer: { kind: "choice", options: ["Data that no straight line separates", "Data that a straight line separates", "Any data with more than 10 points"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`w, b = [0.0, 0.0], 0.0
data = [((0, 0), 0), ((0, 1), 0), ((1, 0), 0), ((1, 1), 1)]
for _ in range(10):
    for x, y in data:
        pred = 1 if w[0] * x[0] + w[1] * x[1] + b > 0 else 0
        w = [w[0] + (y - pred) * x[0], w[1] + (y - pred) * x[1]]
        b += y - pred
print(all((1 if w[0] * x[0] + w[1] * x[1] + b > 0 else 0) == y for x, y in data))`}</Code>
          <p>The perceptron learning rule on AND. Does it end up classifying all four points correctly?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True", "False"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`w, b = [0, 0], 0
data = [((1, 1), 1), ((0, 0), -1), ((1, 0), -1)]
for x, y in data:
    if y * (w[0] * x[0] + w[1] * x[1] + b) <= 0:
        w = [w[0] + y * x[0], w[1] + y * x[1]]
        b += y
print(w, b)`}</Code>
          <p>One pass of the perceptron rule over three points. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0, 1] -1", "[1, 1] 0", "[1, 1] 1", "[0, 1] 0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>perceptron(data, epochs)</C>, which starts from zero weights and bias and applies the update w ← w + (y − ŷ)x, b ← b + (y − ŷ) for each example in order, for the given number of epochs, and returns (w, b). Data is a list of (x, y) with x a tuple and y 0 or 1. On XOR it cannot succeed, which helped cause the first AI winter.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def perceptron(data, epochs):
    n = len(data[0][0])
    return [0.0] * n, 0.0
`,
        solution: `def perceptron(data, epochs):
    n = len(data[0][0])
    w, b = [0.0] * n, 0.0
    for _ in range(epochs):
        for x, y in data:
            pred = 1 if sum(wi * xi for wi, xi in zip(w, x)) + b > 0 else 0
            w = [wi + (y - pred) * xi for wi, xi in zip(w, x)]
            b += y - pred
    return w, b
`,
        tests: [
          { name: "or", code: `data = [((0, 0), 0), ((0, 1), 1), ((1, 0), 1), ((1, 1), 1)]
w, b = perceptron(data, 10)
assert all((sum(a * c for a, c in zip(w, x)) + b > 0) == bool(y) for x, y in data), 'OR is linearly separable, so the perceptron learns it.'` },
          { name: "xor", code: `data = [((0, 0), 0), ((0, 1), 1), ((1, 0), 1), ((1, 1), 0)]
w, b = perceptron(data, 100)
assert not all((sum(a * c for a, c in zip(w, x)) + b > 0) == bool(y) for x, y in data) and (w, b) != ([0.0, 0.0], 0.0), 'Apply the updates; XOR still cannot be learned by one neuron.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>train_perceptron(data, max_epochs)</C> for points with labels ±1, starting from zero and passing over the data in order with the update w ← w + yx, b ← b + y whenever y(w·x + b) ≤ 0. Return (w, b, mistakes, converged), where converged is <C>True</C> if some epoch made no mistakes. Then write <C>margin(w, b, data)</C>, the smallest y(w·x + b)/‖w‖ over the data (negative if some point is misclassified).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def train_perceptron(data, max_epochs):
    return [0.0] * len(data[0][0]), 0.0, 0, True

def margin(w, b, data):
    return 0.0
`,
        solution: `import math

def train_perceptron(data, max_epochs):
    w = [0.0] * len(data[0][0])
    b = 0.0
    mistakes = 0
    for _ in range(max_epochs):
        clean = True
        for x, y in data:
            if y * (sum(wi * xi for wi, xi in zip(w, x)) + b) <= 0:
                w = [wi + y * xi for wi, xi in zip(w, x)]
                b += y
                mistakes += 1
                clean = False
        if clean:
            return w, b, mistakes, True
    return w, b, mistakes, False

def margin(w, b, data):
    nw = math.sqrt(sum(wi * wi for wi in w))
    return min(y * (sum(wi * xi for wi, xi in zip(w, x)) + b) / nw for x, y in data)
`,
        tests: [
          { name: "and", code: `data = [((0, 0), -1), ((0, 1), -1), ((1, 0), -1), ((1, 1), 1)]
w, b, m, ok = train_perceptron(data, 100)
assert ok and margin(w, b, data) > 0, 'AND is linearly separable.'` },
          { name: "xor", code: `data = [((0, 0), -1), ((0, 1), 1), ((1, 0), 1), ((1, 1), -1)]
w, b, m, ok = train_perceptron(data, 100)
assert not ok and m >= 100, 'XOR never converges.'` },
          { name: "margin", code: `assert abs(margin([3, 4], -5, [((3, 4), 1), ((0, 0), -1)]) - 1) < 1e-12 and margin([1, 0], 0, [((-1, 0), 1)]) == -1` },
          { name: "novikoff", code: `import random, math
random.seed(5)
for _ in range(20):
    data = []
    while len(data) < 60:
        x = (random.uniform(-1, 1), random.uniform(-1, 1))
        s = x[0] + 2 * x[1] - 0.3
        if abs(s) > 0.2:
            data.append(((x[0], x[1], 1.0), 1 if s > 0 else -1))
    w, b, m, ok = train_perceptron([((x[0], x[1]), y) for x, y in data], 1000)
    gamma = margin([1, 2, -0.3], 0, data)
    Rr = max(math.sqrt(sum(t * t for t in x)) for x, _ in data)
    assert ok and m <= (Rr / gamma) ** 2, 'Novikoff: at most (R/γ)² mistakes.'` },
        ],
      },
    },
    {
      key: "why-push",
      rung: "prove",
      prompt: (
        <p>
          Show that after an update on a misclassified example <M>{"(x_1, x_2)"}</M> with label <M>y</M>, the sum{" "}
          <M>{"w_1 x_1 + w_2 x_2 + b"}</M> for that example changes by <M>{"\\eta\\, y\\,(x_1^2 + x_2^2 + 1)"}</M>, and explain
          why this moves the example towards being classified correctly.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Substitutes the updated weights into the sum for the same example.",
          "Collects the extra terms: η y x₁·x₁ + η y x₂·x₂ + η y = η y (x₁² + x₂² + 1).",
          "Notes that x₁² + x₂² + 1 > 0 and η > 0, so the change has the sign of y.",
          "Concludes the sum moves towards positive for y = +1 and towards negative for y = −1, the correct side.",
        ],
      },
    },
    {
      key: "parity",
      rung: "stretch",
      prompt: (
        <p>
          Parity on three inputs outputs 1 when an odd number of the inputs are 1. Of the 8 possible inputs, how many should
          output 1?
        </p>
      ),
      answer: { kind: "numeric", value: 4 },
    },
  ],

  teachBack:
    "Explain to a friend how the perceptron learns from its mistakes, what it can and cannot learn, and how that limit shaped the history of AI.",

  glimpse: (
    <p>
      Next, the deep learning revolution, when many-layered networks, trained by backpropagation on large data with fast
      hardware, suddenly overtook every other method. In Neural Networks from Scratch you will derive backpropagation
      yourself and use it to train a network that solves XOR.
    </p>
  ),
};
