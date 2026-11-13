import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LabelSmoothViz } from "@/components/viz/LabelSmoothViz";
import type { LessonContent } from "@/lib/types";

const LSM = `def log_softmax(z):
    m = z.max(axis=-1, keepdims=True)
    s = z - m
    return s - np.log(np.exp(s).sum(axis=-1, keepdims=True))`;

const LS = `def smooth_targets(labels, K, eps):
    q = np.full((len(labels), K), eps / K)
    q[np.arange(len(labels)), labels] += 1 - eps
    return q

def ls_cross_entropy(z, labels, eps):
    q = smooth_targets(labels, z.shape[1], eps)
    return float(-(q * log_softmax(z)).sum(axis=1).mean())`;

const LS2 = `def ls_grad(z, labels, eps):
    p = np.exp(log_softmax(z))
    return (p - smooth_targets(labels, z.shape[1], eps)) / len(labels)

def optimal_gap(K, eps):
    return float(np.log((1 - eps + eps / K) / (eps / K)))`;

export const lesson: LessonContent = {
  id: "l3.3.3",
  minutes: 40,
  links: {
    requires: ["l3.3.2"],
    revisits: ["l3.3.1"],
    foreshadows: ["l3.7.1", "l2.8.2"],
  },

  puzzle: (
    <>
      <p>
        A classifier has reached 100% training accuracy, yet its cross-entropy loss keeps falling, and its weights keep
        growing. Nothing useful is being learnt: the model is simply becoming more certain of answers it already gets right.
        Can the loss itself be told when to stop?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Cross-entropy with a one-hot target can only reach 0 when the right class has probability exactly 1, which needs an
        infinite logit gap. Label smoothing moves a small amount ε of the target's mass onto all K classes. The target is now a
        distribution the softmax can match exactly, at a finite gap, and pushing past it costs loss.
      </p>
      <LabelSmoothViz />
    </>
  ),

  theory: (
    <>
      <Definition title="smoothed targets">
        <p>
          For true class y, K classes and <M>{"0 \\le \\varepsilon < 1"}</M>, the smoothed target is
        </p>
        <MD>{"q = (1 - \\varepsilon)\\,e_y + \\tfrac{\\varepsilon}{K}\\mathbf{1}, \\qquad \\ell = -\\sum_k q_k \\log p_k."}</MD>
        <p>
          It is a probability vector: the true class gets <M>{"1 - \\varepsilon + \\varepsilon/K"}</M> and each other class{" "}
          <M>{"\\varepsilon/K"}</M>. Equivalently, <M>{"\\ell = (1 - \\varepsilon)\\,\\mathrm{CE} + \\varepsilon \\cdot \\tfrac1K\\sum_k(-\\log p_k)"}</M>,
          the ordinary loss plus a pull towards the uniform distribution.
        </p>
        <Code>{LS}</Code>
      </Definition>

      <Theorem title="gradient and optimum">
        <p>
          <M>{"\\nabla_z \\ell = p - q"}</M>. The loss is minimised exactly when p = q, and then the gap between the true
          logit and every other logit is <M>{"\\log\\frac{1 - \\varepsilon + \\varepsilon/K}{\\varepsilon/K}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Since <M>{"\\sum_k q_k = 1"}</M>, <M>{"\\ell = -\\sum_k q_k z_k + \\log\\sum_j e^{z_j}"}</M>, whose gradient is{" "}
          <M>{"-q + p"}</M>. The loss is convex in z (log-sum-exp is convex, the rest is linear), so the gradient vanishing,
          p = q, is the minimum. Then <M>{"p_y/p_k = e^{z_y - z_k} = q_y/q_k"}</M>, and taking logs gives the gap.
        </p>
      </Proof>

      <Example title="ten classes, ε = 0.1">
        <p>
          q gives 0.91 to the true class and 0.01 to each other. The best gap is log 91 ≈ 4.51, and a model whose gap is 8 now
          has a positive gradient on the true logit that pulls it back down.
        </p>
        <Code>{LS2}</Code>
      </Example>

      <Remark title="what it costs">
        <p>
          Smoothing usually improves calibration and sometimes accuracy, and it limits weight growth. But the loss can no
          longer reach 0 (its floor is the entropy of q), predicted probabilities above <M>{"1 - \\varepsilon + \\varepsilon/K"}</M>{" "}
          are never learnt, and teacher models used for distillation tend to transfer less information when trained with it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "target",
      rung: "check",
      prompt: <p>With K = 10 and ε = 0.1, what target probability does the true class get?</p>,
      answer: { kind: "numeric", value: 0.91, tolerance: 1e-9 },
    },
    {
      key: "gap",
      rung: "check",
      prompt: <p>With K = 10 and ε = 0.1, what is the loss-minimising logit gap between the true class and the others?</p>,
      answer: { kind: "numeric", value: 4.5108595, tolerance: 1e-4 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>What does label smoothing change about training once the model classifies every training example correctly?</p>,
      answer: {
        kind: "choice",
        options: [
          "Logits stop growing: confidence beyond the smoothed target is penalised",
          "Training accuracy falls below 100%",
          "The gradient becomes zero for every example",
          "Nothing, the loss is unchanged for correct predictions",
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

def smooth_targets(labels, K, eps):
    q = np.full((len(labels), K), eps / K)
    q[np.arange(len(labels)), labels] += 1 - eps
    return q

print(smooth_targets(np.array([2, 0]), 4, 0.2))
print(smooth_targets(np.array([1]), 3, 0.3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.05 0.05 0.85 0.05]\n [0.85 0.05 0.05 0.05]]\n[[0.1 0.8 0.1]]",
          "[[0.05 0.05 0.8 0.05]\n [0.8 0.05 0.05 0.05]]\n[[0.1 0.7 0.1]]",
          "[[0.05 0.05 0.85 0.05]\n [0.85 0.05 0.05 0.05]]\n[[0.15 0.7 0.15]]",
          "[[0.2 0.2 0.8 0.2]\n [0.8 0.2 0.2 0.2]]\n[[0.3 0.7 0.3]]",
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

def smooth_targets(labels, K, eps):
    q = np.full((len(labels), K), eps / K)
    q[np.arange(len(labels)), labels] += 1 - eps
    return q

def ls_cross_entropy(z, labels, eps):
    q = smooth_targets(labels, z.shape[1], eps)
    return float(-(q * log_softmax(z)).sum(axis=1).mean())

gaps = np.array([0.0, 2.0, 4.0, 6.0, 8.0, 10.0])
L0 = [cross_entropy(np.array([[g, 0.0, 0.0]]), np.array([0])) for g in gaps]
L1 = [ls_cross_entropy(np.array([[g, 0.0, 0.0]]), np.array([0]), 0.1) for g in gaps]
print(gaps[np.argmin(L0)], gaps[np.argmin(L1)])`}</Code>
          <p>Which gap on the grid gives the smallest loss, without and with smoothing? What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["10.0 4.0", "10.0 10.0", "4.0 4.0", "10.0 2.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>smooth_targets(labels, K, eps)</C>, an (N, K) array of smoothed targets, and{" "}
          <C>ls_cross_entropy(z, labels, eps)</C>, the mean label-smoothed cross-entropy as a float. <C>log_softmax</C> is
          given.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

${LSM}

def smooth_targets(labels, K, eps):
    return np.eye(K)[labels]

def ls_cross_entropy(z, labels, eps):
    return 0.0
`,
        solution: `import numpy as np

${LSM}

${LS}`,
        tests: [
          { name: "targets", code: `q = smooth_targets(np.array([2, 0]), 4, 0.2)
assert np.allclose(q, [[0.05, 0.05, 0.85, 0.05], [0.85, 0.05, 0.05, 0.05]]) and np.allclose(q.sum(axis=1), 1)
assert np.allclose(smooth_targets(np.array([1]), 3, 0.0), [[0, 1, 0]])` },
          { name: "loss", code: `rng = np.random.default_rng(3)
z = rng.normal(size=(5, 4)); lab = np.array([0, 3, 1, 1, 2])
lp = log_softmax(z)
ce = -lp[np.arange(5), lab].mean()
assert abs(ls_cross_entropy(z, lab, 0.0) - ce) < 1e-12
assert abs(ls_cross_entropy(z, lab, 0.3) - (0.7 * ce + 0.3 * (-lp.mean(axis=1)).mean())) < 1e-12
assert isinstance(ls_cross_entropy(z, lab, 0.1), float)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          <C>log_softmax</C> and <C>smooth_targets</C> are already defined. Write <C>ls_grad(z, labels, eps)</C>, the gradient
          of the mean smoothed loss with respect to z, and <C>optimal_gap(K, eps)</C>, the loss-minimising gap as a float.
        </p>
      ),
      answer: {
        kind: "code",
        setup: `import numpy as np

${LSM}

${LS}`,
        starter: `import numpy as np

def ls_grad(z, labels, eps):
    return np.zeros_like(z)

def optimal_gap(K, eps):
    return 0.0
`,
        solution: `import numpy as np

${LS2}`,
        tests: [
          { name: "gradient", code: `rng = np.random.default_rng(4)
z = rng.normal(size=(3, 5)); lab = np.array([4, 0, 2])
g = ls_grad(z, lab, 0.2)
num = np.zeros_like(z)
for i in range(3):
    for j in range(5):
        d = np.zeros_like(z); d[i, j] = 1e-6
        num[i, j] = (ls_cross_entropy(z + d, lab, 0.2) - ls_cross_entropy(z - d, lab, 0.2)) / 2e-6
assert np.allclose(g, num, atol=1e-7)` },
          { name: "optimum", code: `assert abs(optimal_gap(10, 0.1) - np.log(91)) < 1e-12
g = optimal_gap(3, 0.1)
assert np.allclose(ls_grad(np.array([[g, 0.0, 0.0]]), np.array([0]), 0.1), 0, atol=1e-12)
assert ls_grad(np.array([[g + 2, 0.0, 0.0]]), np.array([0]), 0.1)[0, 0] > 0` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that the label-smoothed loss with ε &gt; 0 is minimised at a finite logit gap, and find it.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes ℓ = −Σ q_k z_k + log Σ exp(z_j) using Σ q_k = 1, and finds the gradient p − q.",
          "Argues the minimum is where p = q (convexity of log-sum-exp, or the loss tends to +∞ as the gap grows since q_y < 1).",
          "Derives the gap z_y − z_k = log(q_y/q_k) = log((1 − ε + ε/K)/(ε/K)), finite because ε > 0.",
        ],
      },
    },
    {
      key: "floor",
      rung: "stretch",
      prompt: <p>With K = 2 and ε = 0.2, what is the smallest possible label-smoothed loss (natural log)? Hint: it is the entropy of q.</p>,
      answer: { kind: "numeric", value: 0.3250829733914482, tolerance: 1e-4 },
    },
  ],

  teachBack:
    "Explain to a friend why cross-entropy keeps pushing logits up after the model is right, how label smoothing changes the target, and what gap it settles at.",

  glimpse: (
    <p>
      Smoothing limits how large logits get. Before any of that, though, the weights have to start somewhere sensible. Next:
      how to initialise a network so signals neither die nor explode.
    </p>
  ),
};
