import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SaliencyMethodsViz } from "@/components/viz/SaliencyMethodsViz";
import type { LessonContent } from "@/lib/types";

const METHODS = `def num_grad(f, x, eps=1e-5):
    return [(f(x[:i] + [x[i] + eps] + x[i + 1:]) - f(x[:i] + [x[i] - eps] + x[i + 1:])) / (2 * eps) for i in range(len(x))]

def grad_x_input(f, x, base):
    return [g * (a - b) for g, a, b in zip(num_grad(f, x), x, base)]

def integrated_gradients(f, x, base, steps=100):
    total = [0.0] * len(x)
    for k in range(steps):
        t = (k + 0.5) / steps
        g = num_grad(f, [b + t * (a - b) for a, b in zip(x, base)])
        total = [s + gi / steps for s, gi in zip(total, g)]
    return [s * (a - b) for s, a, b in zip(total, x, base)]`;

const CHECKS = `import random

def completeness_gap(attr, f, x, base):
    return sum(attr) - (f(x) - f(base))

def spearman(a, b):
    rank = lambda v: [sorted(v).index(t) for t in v]
    ra, rb, n = rank(a), rank(b), len(a)
    return 1 - 6 * sum((p - q) ** 2 for p, q in zip(ra, rb)) / (n * (n * n - 1))

def smooth_grad(grad, x, sigma, n, seed):
    rng = random.Random(seed)
    total = [0.0] * len(x)
    for _ in range(n):
        g = grad([v + rng.gauss(0, sigma) for v in x])
        total = [s + gi / n for s, gi in zip(total, g)]
    return total`;

export const lesson: LessonContent = {
  id: "l11.1.4",
  minutes: 50,
  links: {
    requires: ["l11.1.3", "m5.2.5"],
    revisits: ["l4.1.4", "l10.7.2", "m2.4.3"],
    foreshadows: ["l11.2.4", "l11.5.1"],
  },

  puzzle: (
    <>
      <p>
        A saliency map for an image classifier highlights the edges of the bird it has recognised, which looks convincing. Then the
        classifier&apos;s weights are replaced with random values, so it can no longer recognise anything, and the saliency map looks
        almost the same. What was the map showing?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Attribution methods assign each input feature a share of credit for an output. The simplest uses the gradient: how much the
        output would change if the feature moved a little. But gradients are local, so they miss features whose effect has saturated,
        and maps built from them can reflect the input more than the model. Integrated gradients fixes the first problem by averaging
        the gradient along a path from a baseline, at the cost of depending on that baseline. Sanity checks catch the second.
      </p>
      <SaliencyMethodsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="gradient-based attribution">
        <p>
          For a scalar output f and input x, gradient saliency is <M>{"\\partial f/\\partial x_i"}</M> (<C>num_grad</C>, here by central
          differences). Gradient times input multiplies by the displacement from a baseline b,{" "}
          <M>{"(x_i - b_i)\\,\\partial f/\\partial x_i"}</M> (<C>grad_x_input</C>). Integrated gradients averages the gradient along the
          straight path from b to x: <M>{"\\mathrm{IG}_i = (x_i - b_i)\\int_0^1 \\partial_i f(b + t(x-b))\\,dt"}</M>, approximated by a
          midpoint sum (<C>integrated_gradients</C>).
        </p>
        <Code>{METHODS}</Code>
      </Definition>

      <Theorem title="completeness">
        <p>
          If f is continuously differentiable along the path, integrated gradients satisfies{" "}
          <M>{"\\sum_i \\mathrm{IG}_i = f(x) - f(b)"}</M>. Plain gradients and gradient times input do not in general.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"\\gamma(t) = b + t(x - b)"}</M>. By the chain rule (m2.4.3),{" "}
          <M>{"\\frac{d}{dt} f(\\gamma(t)) = \\sum_i \\partial_i f(\\gamma(t))\\,(x_i - b_i)"}</M>. Integrating from 0 to 1 gives{" "}
          <M>{"f(x) - f(b) = \\sum_i (x_i - b_i)\\int_0^1 \\partial_i f(\\gamma(t))\\,dt = \\sum_i \\mathrm{IG}_i"}</M>. For gradient times
          input, take <M>{"f(x) = \\min(1, x)"}</M> with <M>{"b = 0, x = 2"}</M>: the gradient at x is 0, so the attribution is 0, while{" "}
          <M>{"f(x) - f(b) = 1"}</M>. This is saturation: a feature can matter a great deal and have zero gradient at the input.
        </p>
      </Proof>

      <Remark title="baselines and paths">
        <p>
          Integrated gradients answers &quot;why this output rather than the baseline&apos;s output?&quot;, so the baseline is part of the
          question. A black image, a blurred image, the dataset mean and a random input give different, all complete, attributions; the
          visualisation shows the mean baseline flipping the sign of one. Different paths also give different answers, and averaging over
          random orders of switching features from baseline to input gives Shapley values (l10.7.2). The completeness gap (
          <C>completeness_gap</C>) is a cheap check that an implementation and its step count are adequate.
        </p>
      </Remark>

      <Remark title="sanity checks and smoothing">
        <p>
          A method that explains the model should change when the model changes. The model-randomisation check re-initialises the
          weights and compares attributions before and after by rank correlation (<C>spearman</C>); a high correlation means the map
          reflects the input, such as its edges, more than what the model learned. A data-randomisation check retrains on shuffled
          labels. Gradient maps are also noisy, because the gradient of a ReLU network jumps between linear regions; SmoothGrad averages
          gradients over noisy copies of the input (<C>smooth_grad</C>), which gives cleaner maps but does not fix saturation.
        </p>
        <Code>{CHECKS}</Code>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The map was dominated by the input&apos;s structure: for some methods, notably those that multiply by the input or propagate
          only positive signals, edges show up whatever the weights are. The randomisation test exposes this, and a method should pass
          it before its maps are trusted as explanations of the model.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "ig",
      rung: "check",
      prompt: (
        <p>
          For <M>{"f(x_1, x_2) = x_1^2 x_2"}</M>, input (1, 2) and baseline (0, 0), what is the integrated-gradients attribution to{" "}
          <M>{"x_1"}</M>? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.333, tolerance: 0.001 },
    },
    {
      key: "sanity",
      rung: "check",
      prompt: (
        <p>
          Attributions to four features are 0.9, 0.1, 0.5 and 0.3 for the trained model and 0.8, 0.2, 0.3 and 0.6 after randomising its
          weights. What is the Spearman rank correlation?
        </p>
      ),
      answer: { kind: "numeric", value: 0.8, tolerance: 0.001 },
    },
    {
      key: "flat",
      rung: "apply",
      prompt: (
        <p>
          A sentiment model outputs 0.99 for a strongly positive review, and gradient saliency assigns almost nothing to the word
          &quot;excellent&quot;. Deleting the word drops the output to 0.6. What best explains the saliency map?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The output is saturated, so local gradients are small even for words with large effects; use a path method or an ablation",
          "The word does not matter to the model",
          "The gradient was computed incorrectly",
          "Deleting a word is not a valid test",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def num_grad(f, x, eps=1e-5):
    return [(f(x[:i] + [x[i] + eps] + x[i + 1:]) - f(x[:i] + [x[i] - eps] + x[i + 1:])) / (2 * eps) for i in range(len(x))]

def grad_x_input(f, x, base):
    return [g * (a - b) for g, a, b in zip(num_grad(f, x), x, base)]

def integrated_gradients(f, x, base, steps=100):
    total = [0.0] * len(x)
    for k in range(steps):
        t = (k + 0.5) / steps
        g = num_grad(f, [b + t * (a - b) for a, b in zip(x, base)])
        total = [s + gi / steps for s, gi in zip(total, g)]
    return [s * (a - b) for s, a, b in zip(total, x, base)]

f = lambda x: x[0] * x[1]
print([round(v, 3) for v in num_grad(f, [2.0, 3.0])], [round(v, 3) for v in grad_x_input(f, [2.0, 3.0], [0.0, 0.0])], [round(v, 3) for v in integrated_gradients(f, [2.0, 3.0], [0.0, 0.0])])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[3.0, 2.0] [6.0, 6.0] [3.0, 3.0]",
          "[3.0, 2.0] [6.0, 6.0] [6.0, 6.0]",
          "[2.0, 3.0] [6.0, 6.0] [3.0, 3.0]",
          "[3.0, 2.0] [3.0, 3.0] [3.0, 3.0]",
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

def completeness_gap(attr, f, x, base):
    return sum(attr) - (f(x) - f(base))

def spearman(a, b):
    rank = lambda v: [sorted(v).index(t) for t in v]
    ra, rb, n = rank(a), rank(b), len(a)
    return 1 - 6 * sum((p - q) ** 2 for p, q in zip(ra, rb)) / (n * (n * n - 1))

def smooth_grad(grad, x, sigma, n, seed):
    rng = random.Random(seed)
    total = [0.0] * len(x)
    for _ in range(n):
        g = grad([v + rng.gauss(0, sigma) for v in x])
        total = [s + gi / n for s, gi in zip(total, g)]
    return total

print(round(completeness_gap([3, 3], lambda x: x[0] * x[1], [2, 3], [0, 0]), 3), spearman([1, 2, 3], [3, 2, 1]), smooth_grad(lambda x: [1.0, 2.0], [5.0, 5.0], 0.3, 4, 0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0 -1.0 [1.0, 2.0]",
          "6 -1.0 [1.0, 2.0]",
          "0 1.0 [1.0, 2.0]",
          "0 -1.0 [5.0, 5.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Inputs are lists. Write <C>num_grad(f, x, eps=1e-5)</C> by central differences; <C>grad_x_input(f, x, base)</C>; and{" "}
          <C>integrated_gradients(f, x, base, steps=100)</C>, using the gradient at the midpoints t = (k + 0.5)/steps of the straight
          path.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def num_grad(f, x, eps=1e-5):
    return [0.0] * len(x)

def grad_x_input(f, x, base):
    return [0.0] * len(x)

def integrated_gradients(f, x, base, steps=100):
    return [0.0] * len(x)
`,
        solution: METHODS,
        tests: [
          { name: "local", code: `import math\nq = lambda x: math.sin(x[0]) + x[0] * x[1] ** 2\ng = num_grad(q, [0.5, -1.0])\nassert abs(g[0] - 1.8775825619) < 1e-6 and abs(g[1] + 1.0) < 1e-6\na = grad_x_input(q, [0.5, -1.0], [0.5, 1.0])\nassert abs(a[0]) < 1e-9 and abs(a[1] - 2.0) < 1e-6` },
          { name: "path", code: `import math\nq = lambda x: math.sin(x[0]) + x[0] * x[1] ** 2\nig = integrated_gradients(q, [1.0, 2.0], [0.0, 1.0])\nassert abs(sum(ig) - (q([1.0, 2.0]) - q([0.0, 1.0]))) < 1e-3 and abs(ig[1] - 1.66665) < 1e-3\nh = lambda x: min(1.0, x[0] + 2 * x[1])\nig = integrated_gradients(h, [1.0, 1.0], [0.0, 0.0], steps=300)\nassert abs(ig[0] - 1 / 3) < 1e-3 and abs(ig[1] - 2 / 3) < 1e-3` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>completeness_gap(attr, f, x, base)</C>; <C>spearman(a, b)</C> for lists without ties, using{" "}
          <M>{"1 - 6\\sum d^2 / (n(n^2-1))"}</M>; and <C>smooth_grad(grad, x, sigma, n, seed)</C>, averaging grad over n copies of x
          with independent noise drawn by <C>random.Random(seed).gauss(0, sigma)</C>, coordinate by coordinate.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import random

def completeness_gap(attr, f, x, base):
    return 0.0

def spearman(a, b):
    return 0.0

def smooth_grad(grad, x, sigma, n, seed):
    return grad(x)
`,
        solution: CHECKS,
        tests: [
          { name: "checks", code: `import math\nq = lambda x: math.sin(x[0]) + x[0] * x[1] ** 2\nassert abs(completeness_gap([0.2, 0.3], q, [1.0, 2.0], [0.0, 1.0]) + 4.3414709848) < 1e-9\nassert abs(spearman([10, 30, 20, 40, 50], [1, 2, 3, 4, 5]) - 0.9) < 1e-12` },
          { name: "smooth", code: `assert abs(smooth_grad(lambda x: [x[0] ** 2], [0.0], 1.0, 2, 1)[0] - 1.8801562654) < 1e-9\ns = smooth_grad(lambda x: [2 * x[0], 3.0], [1.0, 0.0], 0.5, 1000, 3)\nassert abs(s[0] - 1.9915879660) < 1e-9 and abs(s[1] - 3.0) < 1e-12` },
        ],
      },
    },
    {
      key: "saturate",
      rung: "stretch",
      prompt: (
        <p>
          For <M>{"f(x_1, x_2) = \\min(1, x_1 + x_2)"}</M>, input (1, 3) and baseline (0, 0), what is the integrated-gradients attribution
          to <M>{"x_2"}</M>? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.75, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        Attribution treats the network as a black box with gradients. The next chapter opens the box, starting with the residual stream
        through which every layer of a transformer communicates.
      </p>
    </>
  ),
};
