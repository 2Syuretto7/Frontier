import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { ImageNetViz } from "@/components/viz/ImageNetViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l0.4.3",
  minutes: 45,
  links: {
    revisits: ["l0.4.2"],
    foreshadows: ["l4.1.1", "e7.1.1"],
  },

  puzzle: (
    <>
      <p>
        Backpropagation was popularised in 1986, and multi-layer neural networks could in principle learn almost anything. Yet
        for the next twenty years most researchers preferred other methods, and neural networks were often considered a dead
        end.
      </p>
      <p>
        Then, around 2012, they suddenly beat everything else at recognising images, then speech, then translation. The core
        algorithm had barely changed. What do you think had?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two things outside the algorithm had changed enormously. The internet had produced vast collections of data: ImageNet,
        assembled from web images and labelled by thousands of paid workers, held over a million training images in a
        thousand categories. And graphics cards, built to draw video games, turned out to be very fast at exactly the
        arithmetic that neural networks need.
      </p>
      <p>
        In 2012 a network called AlexNet, trained on ImageNet with two gaming graphics cards, entered the annual ImageNet
        competition. Click through the years below.
      </p>
      <ImageNetViz />
      <p>
        AlexNet did not edge ahead; it cut the error by about ten percentage points in one year, when progress had been one
        or two. Within three years, every leading entry was a deep network, and the best had fallen below the error of a
        trained human on this task.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="deep learning">
        <p>
          <strong>Deep learning</strong> is machine learning with neural networks of many layers. Each layer transforms the
          output of the one before, so the network builds up its own <strong>features</strong>: early layers of an image
          network respond to edges and colours, middle layers to textures and parts, late layers to whole objects.
        </p>
      </Definition>

      <p>
        Before deep learning, features were designed by hand: researchers spent years engineering ways to describe edges,
        corners and textures, and a simple classifier was trained on top. Deep learning replaced that engineering with
        learning, which is the same move as the first lesson of this course, from rules to examples, applied one level down.
      </p>

      <Definition title="the three ingredients">
        <ul>
          <li><strong>Data:</strong> large labelled collections, such as ImageNet (2009).</li>
          <li><strong>Compute:</strong> graphics processing units, or GPUs, doing thousands of multiplications in parallel.</li>
          <li><strong>Algorithms:</strong> backpropagation, plus practical improvements such as simpler activation functions and ways to stop networks overfitting.</li>
        </ul>
        <p>None of the three was enough on its own.</p>
      </Definition>

      <Example title="beyond images">
        <p>
          Deep networks cut speech recognition errors sharply around 2010 to 2012, and by 2016 they powered the main online
          translation services. In 2016, AlphaGo, combining deep networks with search and reinforcement learning, beat Lee
          Sedol, one of the strongest Go players in the world, a feat many experts had expected to be a decade away. In 2018,
          Geoffrey Hinton, Yann LeCun and Yoshua Bengio received the Turing Award, computing&rsquo;s highest honour, for their
          decades of work on neural networks.
        </p>
      </Example>

      <Remark title="benchmarks drive progress, and mislead">
        <p>
          ImageNet gave the field a shared target, so that improvements were measurable and comparable. That is a large part
          of why progress was so fast. But a benchmark is a narrow slice of a task: models that beat humans on ImageNet could
          still be fooled by a photo taken at an unusual angle. Beating a benchmark and solving a problem are not the same
          thing, a theme of the last lesson in this course.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "year",
      rung: "check",
      prompt: <p>In what year did AlexNet win the ImageNet competition?</p>,
      answer: { kind: "numeric", value: 2012 },
    },
    {
      key: "drop",
      rung: "check",
      prompt: <p>In the visualisation, by how many percentage points did the winning error fall from 2011 to 2012?</p>,
      answer: { kind: "numeric", value: 10.5 },
    },
    {
      key: "ingredients",
      rung: "apply",
      prompt: <p>Select the three ingredients that together made deep learning work around 2012.</p>,
      answer: {
        kind: "choice",
        options: ["Large labelled data sets", "Fast parallel hardware such as GPUs", "Hand-designed image features", "Training algorithms such as backpropagation, with practical improvements"],
        correct: [0, 1, 3],
      },
    },
    {
      key: "features",
      rung: "apply",
      prompt: <p>What did deep learning replace in computer vision?</p>,
      answer: { kind: "choice", options: ["Hand-designed features", "Labelled data", "Computers"], correct: [0] },
    },
    {
      key: "fraction",
      rung: "apply",
      prompt: <p>From 28.2% in 2010 to 3.6% in 2015, by what factor did the winning error fall? Give one decimal place.</p>,
      answer: { kind: "numeric", value: 7.8, tolerance: 0.01 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
relu = lambda z: max(0.0, z)
sig = lambda z: 1 / (1 + math.exp(-z))
d = lambda f, z: (f(z + 1e-6) - f(z - 1e-6)) / 2e-6
print(round(d(sig, 6), 4), round(d(relu, 6), 4))`}</Code>
          <p>Gradients of sigmoid and ReLU at z = 6. Why did ReLU help deep networks train?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.0025 1.0", "0.25 1.0", "0.0025 0.0", "1.0 1.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
s = lambda z: 1 / (1 + math.exp(-z))
g = 1.0
for _ in range(10):
    g *= s(0) * (1 - s(0))
print(g, 0.25 ** 10, 1.0 ** 10)`}</Code>
          <p>Ten sigmoid layers multiply their slopes; ReLU&rsquo;s slope is 1. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["9.5367431640625e-07 9.5367431640625e-07 1.0", "0.25 9.5367431640625e-07 1.0", "9.5367431640625e-07 0.25 1.0", "2.5 2.5 10.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>xor_net(x1, x2)</C>, a two-layer network of step neurons with hand-chosen weights that computes XOR: one hidden neuron for OR, one for AND, and an output that fires for OR and not AND. Use <C>step(z)</C>, which returns 1 when z &gt; 0.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def step(z):
    return 1 if z > 0 else 0

def xor_net(x1, x2):
    return step(x1 + x2 - 0.5)
`,
        solution: `def step(z):
    return 1 if z > 0 else 0

def xor_net(x1, x2):
    h_or = step(x1 + x2 - 0.5)
    h_and = step(x1 + x2 - 1.5)
    return step(h_or - h_and - 0.5)
`,
        tests: [
          { name: "xor", code: `assert [xor_net(a, b) for a, b in [(0, 0), (0, 1), (1, 0), (1, 1)]] == [0, 1, 1, 0], 'A hidden layer makes XOR possible.'` },
          { name: "step", code: `assert step(0) == 0 and step(0.1) == 1 and step(-3) == 0, 'step fires only for z > 0.'` },
          { name: "ints", code: `assert all(isinstance(xor_net(a, b), int) for a in (0, 1) for b in (0, 1)), 'The network outputs 0 or 1.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Backpropagation by hand for a network with one hidden layer of tanh units: h = tanh(W₁x + b₁), ŷ = W₂·h + b₂ (one output), loss L = ½(ŷ − y)². Write <C>forward(x, W1, b1, W2, b2)</C>, returning (h, ŷ), and <C>backward(x, y, W1, b1, W2, b2)</C>, returning the gradients (dW1, db1, dW2, db2) with the same shapes as the parameters (lists and lists of lists), using the chain rule and tanh′(z) = 1 − tanh²(z). No NumPy.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def forward(x, W1, b1, W2, b2):
    return [0.0] * len(b1), 0.0

def backward(x, y, W1, b1, W2, b2):
    return [[0.0] * len(x) for _ in b1], [0.0] * len(b1), [0.0] * len(b1), 0.0
`,
        solution: `import math

def forward(x, W1, b1, W2, b2):
    h = [math.tanh(sum(w * xi for w, xi in zip(row, x)) + b) for row, b in zip(W1, b1)]
    return h, sum(w * hi for w, hi in zip(W2, h)) + b2

def backward(x, y, W1, b1, W2, b2):
    h, yhat = forward(x, W1, b1, W2, b2)
    d = yhat - y
    dW2 = [d * hi for hi in h]
    db2 = d
    dz = [d * w * (1 - hi * hi) for w, hi in zip(W2, h)]
    dW1 = [[g * xi for xi in x] for g in dz]
    return dW1, dz, dW2, db2
`,
        tests: [
          { name: "forward", code: `h, y = forward([1.0, 2.0], [[0.0, 0.0], [1.0, 0.0]], [0.0, 0.0], [2.0, 3.0], 0.5)
import math
assert h[0] == 0 and abs(h[1] - math.tanh(1)) < 1e-12 and abs(y - (3 * math.tanh(1) + 0.5)) < 1e-12` },
          { name: "output layer", code: `dW1, db1, dW2, db2 = backward([1.0, 2.0], 1.0, [[0.0, 0.0], [1.0, 0.0]], [0.0, 0.0], [2.0, 3.0], 0.5)
import math
d = 3 * math.tanh(1) + 0.5 - 1
assert abs(db2 - d) < 1e-12 and abs(dW2[1] - d * math.tanh(1)) < 1e-12 and dW2[0] == 0, 'dL/dW₂ = (ŷ − y)·h.'` },
          { name: "finite differences", code: `import random, copy
random.seed(6)
for _ in range(10):
    x = [random.uniform(-1, 1) for _ in range(3)]; y = random.uniform(-1, 1)
    W1 = [[random.uniform(-1, 1) for _ in range(3)] for _ in range(4)]; b1 = [random.uniform(-1, 1) for _ in range(4)]
    W2 = [random.uniform(-1, 1) for _ in range(4)]; b2 = random.uniform(-1, 1)
    L = lambda W1, b1, W2, b2: 0.5 * (forward(x, W1, b1, W2, b2)[1] - y) ** 2
    dW1, db1, dW2, db2 = backward(x, y, W1, b1, W2, b2)
    e = 1e-6
    for i in range(4):
        for j in range(3):
            P = copy.deepcopy(W1); P[i][j] += e; M = copy.deepcopy(W1); M[i][j] -= e
            assert abs((L(P, b1, W2, b2) - L(M, b1, W2, b2)) / (2 * e) - dW1[i][j]) < 1e-7, 'dW1 disagrees with finite differences.'
        P = b1[:]; P[i] += e; M = b1[:]; M[i] -= e
        assert abs((L(W1, P, W2, b2) - L(W1, M, W2, b2)) / (2 * e) - db1[i]) < 1e-7, 'db1 disagrees.'
        P = W2[:]; P[i] += e; M = W2[:]; M[i] -= e
        assert abs((L(W1, b1, P, b2) - L(W1, b1, M, b2)) / (2 * e) - dW2[i]) < 1e-7, 'dW2 disagrees.'
    assert abs((L(W1, b1, W2, b2 + e) - L(W1, b1, W2, b2 - e)) / (2 * e) - db2) < 1e-7` },
          { name: "shapes", code: `dW1, db1, dW2, db2 = backward([1.0, 2.0, 3.0], 0.0, [[0.1] * 3] * 2, [0.0] * 2, [1.0] * 2, 0.0)
assert len(dW1) == 2 and all(len(r) == 3 for r in dW1) and len(db1) == 2 and len(dW2) == 2 and isinstance(db2, float)` },
        ],
      },
    },
    {
      key: "why-now",
      rung: "prove",
      prompt: (
        <p>
          Backpropagation was known in 1986, but deep learning took off only around 2012. Give a careful explanation of why,
          naming what changed and why each change mattered.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that large networks need large data to avoid overfitting, and that large labelled data sets such as ImageNet appeared only around 2009.",
          "Notes that training large networks needs enormous amounts of arithmetic, and that GPUs made this fast and cheap.",
          "Mentions algorithmic and practical improvements that made deep networks easier to train.",
          "Concludes that the combination, not any one change, was decisive.",
        ],
      },
    },
    {
      key: "errors",
      rung: "stretch",
      prompt: (
        <p>
          The ImageNet test set used in the competition had 100,000 images. At the 2015 error of 3.6%, how many more images
          per 100,000 did the winner get wrong than a human with an error of 5.1%? Give a negative number if it got fewer
          wrong.
        </p>
      ),
      answer: { kind: "numeric", value: -1500 },
    },
  ],

  teachBack:
    "Explain to a friend why neural networks, known since the 1980s, suddenly took over around 2012, naming the three ingredients that came together.",

  glimpse: (
    <p>
      Next, transformers and scale: the architecture behind today&rsquo;s language models, and the discovery that performance
      improves predictably as models grow. In Deep Learning Architectures you will build the convolutional networks that won
      ImageNet, and in Computer Architecture and Accelerators you will see exactly why GPUs suit neural networks so well.
    </p>
  ),
};
