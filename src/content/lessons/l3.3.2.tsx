import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CeVsMseViz } from "@/components/viz/CeVsMseViz";
import type { LessonContent } from "@/lib/types";

const CE = `import numpy as np

def log_softmax(z):
    m = z.max(axis=-1, keepdims=True)
    s = z - m
    return s - np.log(np.exp(s).sum(axis=-1, keepdims=True))

def cross_entropy(z, labels):
    lp = log_softmax(z)
    return float(-lp[np.arange(len(labels)), labels].mean())

def ce_grad(z, labels):
    p = np.exp(log_softmax(z))
    p[np.arange(len(labels)), labels] -= 1
    return p / len(labels)
`;

const BCE = `def bce_with_logits(z, y):
    return float(np.mean(np.maximum(z, 0) - z * y + np.log1p(np.exp(-np.abs(z)))))

def bce_grad(z, y):
    return (0.5 * (1 + np.tanh(z / 2)) - y) / len(z)
`;

export const lesson: LessonContent = {
  id: "l3.3.2",
  minutes: 50,
  links: {
    requires: ["l3.3.1", "m5.4.4"],
    revisits: ["l1.3.1", "e5.2.4"],
    foreshadows: ["l3.3.3", "m12.2.2", "l2.8.2"],
  },

  puzzle: (
    <>
      <p>
        A classifier outputs probabilities, so why not train it with squared error between the probability vector and the
        one-hot label? It is a perfectly good distance. Yet a network that starts out confidently wrong, trained this way, can
        sit almost still for thousands of steps. Cross-entropy does not have this problem. Where does the difference come from?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The gradient reaching the logit is what moves the network. With a sigmoid or softmax output, squared error on the
        probabilities picks up a factor of the output's slope, p(1 − p), which vanishes when the model is very sure. The
        logarithm in cross-entropy cancels that factor exactly, leaving the gradient p − y: large when wrong, small when right.
      </p>
      <CeVsMseViz />
    </>
  ),

  theory: (
    <>
      <Definition title="softmax and cross-entropy">
        <p>
          For logits <M>{"z \\in \\mathbb{R}^K"}</M>, <M>{"p_k = \\operatorname{softmax}(z)_k = e^{z_k} / \\sum_j e^{z_j}"}</M>.
          The cross-entropy loss for true class y is the negative log-probability of that class:
        </p>
        <MD>{"\\ell(z, y) = -\\log p_y = -z_y + \\log \\sum_j e^{z_j}."}</MD>
        <p>
          Averaged over a dataset it is the negative log-likelihood of a categorical model, so minimising it is maximum
          likelihood, just as squared error was for Gaussian noise.
        </p>
      </Definition>

      <Theorem title="the gradient is p − y">
        <p>
          With y written as a one-hot vector, <M>{"\\nabla_z \\ell = p - y"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Differentiate <M>{"-z_y + \\log\\sum_j e^{z_j}"}</M> with respect to <M>{"z_k"}</M>. The first term gives{" "}
          <M>{"-[k = y]"}</M>. The second gives <M>{"e^{z_k} / \\sum_j e^{z_j} = p_k"}</M>. So the k-th component is{" "}
          <M>{"p_k - y_k"}</M>. The softmax Jacobian never has to be formed: the log has absorbed it.
        </p>
      </Proof>

      <Remark title="why squared error stalls">
        <p>
          With one output <M>{"p = \\sigma(z)"}</M> and label 1, squared error <M>{"(p - 1)^2"}</M> has{" "}
          <M>{"\\partial/\\partial z = 2(p - 1)\\,p(1 - p)"}</M>. At z = −6, p ≈ 0.0025 and the gradient is about −0.005,
          two hundred times smaller than cross-entropy's −0.998. The worse the mistake, the slower the correction.
        </p>
      </Remark>

      <Definition title="computing it stably">
        <p>
          Softmax is unchanged by adding a constant to every logit, so subtract the maximum before exponentiating and work
          with <M>{"\\log p = z - \\max z - \\log\\sum_j e^{z_j - \\max z}"}</M>. For two classes the same idea gives binary
          cross-entropy with logits, <M>{"\\max(z, 0) - zy + \\log(1 + e^{-|z|})"}</M>, which never takes the log of 0.
        </p>
        <Code>{CE}</Code>
        <Code>{BCE}</Code>
      </Definition>

      <Example title="a number to remember">
        <p>
          A model that knows nothing outputs uniform probabilities, and its loss is <M>{"\\log K"}</M>: 2.303 for ten
          classes. A first training loss far from <M>{"\\log K"}</M> means the initial logits are too large.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "uniform",
      rung: "check",
      prompt: <p>A 4-class model outputs probability 0.25 for every class. What is its cross-entropy loss (natural log)?</p>,
      answer: { kind: "numeric", value: 1.3862944, tolerance: 1e-4 },
    },
    {
      key: "gradk",
      rung: "check",
      prompt: <p>Softmax outputs are p = (0.7, 0.2, 0.1) and the true class is the second. What is ∂ℓ/∂z for the second logit?</p>,
      answer: { kind: "numeric", value: -0.8, tolerance: 1e-9 },
    },
    {
      key: "shift",
      rung: "apply",
      prompt: <p>Adding 5 to every logit changes the cross-entropy loss by how much?</p>,
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

sig = lambda z: 1 / (1 + np.exp(-z))
for z in [-6.0, 0.0, 2.0]:
    p = sig(z)
    print(round(p - 1, 3), round(2 * (p - 1) * p * (1 - p), 3))`}</Code>
          <p>Gradients on the logit of a positive example, cross-entropy first, squared error second. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-0.998 -0.005\n-0.5 -0.25\n-0.119 -0.025",
          "-0.998 -0.998\n-0.5 -0.5\n-0.119 -0.119",
          "-0.005 -0.998\n-0.25 -0.5\n-0.025 -0.119",
          "-0.998 -0.249\n-0.5 -0.25\n-0.119 -0.025",
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

def log_softmax(z):
    m = z.max(axis=-1, keepdims=True)
    s = z - m
    return s - np.log(np.exp(s).sum(axis=-1, keepdims=True))

def cross_entropy(z, labels):
    lp = log_softmax(z)
    return float(-lp[np.arange(len(labels)), labels].mean())

def ce_grad(z, labels):
    p = np.exp(log_softmax(z))
    p[np.arange(len(labels)), labels] -= 1
    return p / len(labels)

z = np.array([[1000.0, 1001.0, 1002.0], [0.0, 1.0, 2.0]])
print(np.allclose(log_softmax(z)[0], log_softmax(z)[1]))
print(round(cross_entropy(z, np.array([2, 0])), 3))
print(ce_grad(np.zeros((2, 4)), np.array([0, 3])).sum(axis=1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["True\n1.408\n[0. 0.]", "False\n1.408\n[0. 0.]", "True\n0.408\n[0. 0.]", "True\n1.408\n[-0.5 -0.5]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For logits <C>z</C> of shape (N, K) and integer labels of shape (N,), write <C>log_softmax(z)</C> (stable for huge
          logits), <C>cross_entropy(z, labels)</C>, the mean loss as a float, and <C>ce_grad(z, labels)</C>, the gradient of
          that mean with respect to z.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def log_softmax(z):
    return z - np.log(np.exp(z).sum(axis=-1, keepdims=True))

def cross_entropy(z, labels):
    return 0.0

def ce_grad(z, labels):
    return np.zeros_like(z)
`,
        solution: CE,
        tests: [
          { name: "stable", code: `z = np.array([[1000.0, 1001.0, 1002.0], [0.0, 1.0, 2.0]])
lp = log_softmax(z)
assert np.all(np.isfinite(lp)) and np.allclose(lp[0], lp[1]) and np.allclose(np.exp(lp).sum(axis=1), 1)
assert abs(cross_entropy(z, np.array([2, 0])) - 1.4076059644443803) < 1e-9
assert abs(cross_entropy(np.zeros((3, 10)), np.array([0, 4, 9])) - np.log(10)) < 1e-12` },
          { name: "gradient", code: `rng = np.random.default_rng(1)
z = rng.normal(size=(4, 3)); lab = np.array([0, 2, 1, 2])
g = ce_grad(z, lab)
num = np.zeros_like(z)
for i in range(4):
    for j in range(3):
        d = np.zeros_like(z); d[i, j] = 1e-6
        num[i, j] = (cross_entropy(z + d, lab) - cross_entropy(z - d, lab)) / 2e-6
assert np.allclose(g, num, atol=1e-7) and np.allclose(g.sum(axis=1), 0)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bce_with_logits(z, y)</C>, the mean binary cross-entropy for logits z and labels y in {"{0, 1}"} as a float,
          finite even for |z| = 800, and <C>bce_grad(z, y)</C>, the gradient of that mean with respect to z, with no overflow
          warnings.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def bce_with_logits(z, y):
    p = 1 / (1 + np.exp(-z))
    return float(np.mean(-y * np.log(p) - (1 - y) * np.log(1 - p)))

def bce_grad(z, y):
    return np.zeros_like(z)
`,
        solution: `import numpy as np

${BCE}`,
        tests: [
          { name: "extreme logits", code: `import warnings
warnings.simplefilter("error")
z = np.array([-800.0, 0.0, 3.0, 800.0]); y = np.array([1.0, 0.0, 1.0, 0.0])
assert abs(bce_with_logits(z, y) - np.mean([800, np.log(2), np.log1p(np.exp(-3)), 800])) < 1e-9
assert np.allclose(bce_grad(z, y), [-0.25, 0.125, (1 / (1 + np.exp(-3)) - 1) / 4, 0.25])` },
          { name: "matches softmax", code: `rng = np.random.default_rng(2)
z = rng.normal(size=6); y = (rng.random(6) < 0.5).astype(float)
p = 1 / (1 + np.exp(-z))
assert abs(bce_with_logits(z, y) - np.mean(-y * np.log(p) - (1 - y) * np.log(1 - p))) < 1e-12
assert np.allclose(bce_grad(z, y), (p - y) / 6)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that the gradient of −log softmax(z)_y with respect to z is p − e_y, where e_y is the one-hot vector of y.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Rewrites the loss as −z_y + log Σⱼ exp(z_j), or uses the softmax Jacobian ∂p_y/∂z_k = p_y([k = y] − p_k).",
          "Differentiates correctly: −[k = y] from the first term and exp(z_k)/Σⱼ exp(z_j) = p_k from the second (or −(1/p_y)·p_y([k = y] − p_k)).",
          "Concludes the k-th component is p_k − [k = y], i.e. the gradient is p − e_y.",
        ],
      },
    },
    {
      key: "stall",
      rung: "stretch",
      prompt: <p>With p = σ(z), label 1 and loss (p − 1)², what is ∂loss/∂z at z = 0?</p>,
      answer: { kind: "numeric", value: -0.25, tolerance: 1e-9 },
    },
  ],

  teachBack:
    "Explain to a friend why classifiers use cross-entropy rather than squared error on probabilities, what its gradient is, and how to compute it without overflow.",

  glimpse: (
    <p>
      Cross-entropy keeps pushing the right class's probability towards 1, which means pushing logits towards infinity. Next:
      label smoothing, which gives the model a finite target to aim for.
    </p>
  ),
};
