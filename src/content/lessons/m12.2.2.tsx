import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CrossEntViz } from "@/components/viz/CrossEntViz";
import type { LessonContent } from "@/lib/types";

const CE = `import numpy as np

def cross_entropy(p, q):
    p, q = np.asarray(p, dtype=float), np.asarray(q, dtype=float); m = p > 0
    return float(-(p[m] * np.log2(q[m])).sum())

def log_softmax(z):
    z = np.asarray(z, dtype=float); m = z.max(axis=-1, keepdims=True)
    return z - m - np.log(np.exp(z - m).sum(axis=-1, keepdims=True))

def ce_loss_and_grad(logits, y):
    lp = log_softmax(logits); n = len(y)
    loss = -lp[np.arange(n), y].mean()
    g = np.exp(lp); g[np.arange(n), y] -= 1
    return float(loss), g / n`;

const LS = `import numpy as np

def smooth_targets(y, k, eps):
    T = np.full((len(y), k), eps / k)
    T[np.arange(len(y)), y] += 1 - eps
    return T

def soft_ce(logits, T):
    z = logits - logits.max(axis=1, keepdims=True)
    lp = z - np.log(np.exp(z).sum(axis=1, keepdims=True))
    return float(-(T * lp).sum(axis=1).mean())

def optimal_logit_gap(k, eps):
    return float(np.log((1 - eps + eps / k) / (eps / k)))`;

export const lesson: LessonContent = {
  id: "m12.2.2",
  minutes: 45,
  links: {
    requires: ["m12.2.1", "m11.2.3"],
    revisits: ["m9.2.2"],
    foreshadows: ["m12.4.1", "m12.4.2"],
  },

  puzzle: (
    <>
      <p>
        Nearly every classifier and language model is trained by minimising cross-entropy, the average of −log q(true
        label). Why that loss and not, say, the fraction of wrong answers or the squared distance between the predicted
        probabilities and the one-hot label? A related puzzle: a popular trick, label smoothing, trains against targets of
        0.9 instead of 1. If cross-entropy rewards confident correct answers, why would anyone deliberately aim lower?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Cross-entropy is the average number of bits you pay to encode outcomes from p using the code that q implies. It
        splits as the entropy of p, which no model can avoid, plus the divergence D(p‖q), which is the price of being wrong.
        So the loss is minimised exactly by telling the truth, q = p: it is a proper scoring rule. Averaged over a data set
        it is the negative log-likelihood, and its gradient with respect to the logits is the simplest possible: predicted
        minus target. Label smoothing changes p, and with it the logits the model is pushed towards.
      </p>
      <CrossEntViz />
    </>
  ),

  theory: (
    <>
      <Definition title="cross-entropy">
        <MD>{"H(p, q) = -\\sum_x p(x)\\log q(x) = \\mathbb{E}_{X \\sim p}[-\\log q(X)] = H(p) + D(p\\,\\|\\,q)."}</MD>
        <p>
          The last equality is <M>{"-\\log q = -\\log p + \\log(p/q)"}</M> averaged over p. With a one-hot p on the true label
          y, H(p, q) = −log q(y), the log loss.
        </p>
      </Definition>

      <Theorem title="cross-entropy is a proper scoring rule">
        <p>
          For fixed p, <M>{"H(p, q) \\ge H(p)"}</M> with equality exactly when q = p. For prediction from features,{" "}
          <M>{"\\mathbb{E}[-\\log q(Y \\mid X)] \\ge H(Y \\mid X)"}</M>, with equality exactly when q(· | x) is the true
          conditional distribution for every x of positive probability.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first claim is Gibbs&apos; inequality applied to <M>{"H(p, q) - H(p) = D(p\\,\\|\\,q)"}</M>. For the second,
          condition on X = x: the expected loss given x is{" "}
          <M>{"H(p(\\cdot \\mid x), q(\\cdot \\mid x)) \\ge H(Y \\mid X = x)"}</M>, with equality iff the two conditionals
          agree; averaging over x gives the bound H(Y | X), which the previous chapter promised as the floor on log loss.
        </p>
      </Proof>

      <Theorem title="minimising cross-entropy is maximum likelihood">
        <p>
          For data <M>{"(x_i, y_i)_{i=1}^n"}</M> and a model <M>{"q_\\theta"}</M>, the average loss{" "}
          <M>{"\\frac1n\\sum_i -\\log q_\\theta(y_i \\mid x_i)"}</M> is the cross-entropy between the empirical distribution
          of the data and the model, and minimising it maximises the likelihood{" "}
          <M>{"\\prod_i q_\\theta(y_i \\mid x_i)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The empirical distribution puts mass 1/n on each data point, so its cross-entropy with <M>{"q_\\theta"}</M> is the
          average above. That average is −1/n times the log-likelihood, and −log and scaling by 1/n are decreasing and
          increasing in the right ways, so the minimiser of one is the maximiser of the other.
        </p>
      </Proof>

      <Theorem title="the gradient of softmax cross-entropy">
        <p>
          For logits z, <M>{"q = \\mathrm{softmax}(z)"}</M> and a target distribution t,{" "}
          <M>{"\\nabla_z\\left(-\\sum_k t_k\\log q_k\\right) = q - t"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\log q_k = z_k - \\log\\sum_j e^{z_j}"}</M>, so <M>{"\\partial \\log q_k/\\partial z_m = [k = m] - q_m"}</M>.
          Hence <M>{"\\partial/\\partial z_m\\left(-\\sum_k t_k\\log q_k\\right) = -t_m + q_m\\sum_k t_k = q_m - t_m"}</M>{" "}
          since the targets sum to 1. Computing log q by subtracting the largest logit first (log-sum-exp) avoids overflow,
          so logits of 1000 cause no trouble. The code checks the gradient against a finite difference.
        </p>
        <Code>{CE}</Code>
      </Proof>

      <Remark title="why not accuracy or squared error, and label smoothing">
        <p>
          Accuracy is a step function of the logits with zero gradient almost everywhere, and it ignores how confident a
          prediction is. Squared error on probabilities is also proper, but its gradient through the softmax vanishes when
          the model is confidently wrong, while cross-entropy&apos;s q − t stays large exactly then. Under a one-hot target the
          loss keeps falling as the true logit grows, so a model can push logits without bound and become overconfident.
          Label smoothing trains on <M>{"(1 - \\varepsilon)\\,\\text{one-hot} + \\varepsilon/K"}</M>; by the proper-scoring
          property the optimum is q equal to that target, which fixes the gap between the true logit and the others at{" "}
          <M>{"\\log\\frac{1 - \\varepsilon + \\varepsilon/K}{\\varepsilon/K}"}</M>, about 2.08 for K = 3 and ε = 0.3.
        </p>
        <Code>{LS}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "onehot",
      rung: "check",
      prompt: <p>A model gives the true label probability 0.25. What is its cross-entropy loss on this example, in bits?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "hpq",
      rung: "check",
      prompt: <p>What is H(p, q) in bits for p = (½, ½) and q = (¼, ¾)? Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.2075, tolerance: 0.0001 },
    },
    {
      key: "grad",
      rung: "apply",
      prompt: <p>What is the gradient of the softmax cross-entropy loss with respect to the logits, for target distribution t?</p>,
      answer: {
        kind: "choice",
        options: [
          "softmax(z) − t",
          "t − softmax(z)",
          "−t / softmax(z)",
          "softmax(z)(1 − softmax(z)) − t",
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

def cross_entropy(p, q):
    p, q = np.asarray(p, dtype=float), np.asarray(q, dtype=float); m = p > 0
    return float(-(p[m] * np.log2(q[m])).sum())

def log_softmax(z):
    z = np.asarray(z, dtype=float); m = z.max(axis=-1, keepdims=True)
    return z - m - np.log(np.exp(z - m).sum(axis=-1, keepdims=True))

def ce_loss_and_grad(logits, y):
    lp = log_softmax(logits); n = len(y)
    loss = -lp[np.arange(n), y].mean()
    g = np.exp(lp); g[np.arange(n), y] -= 1
    return float(loss), g / n

print(round(cross_entropy([0.5, 0.5], [0.25, 0.75]), 4), log_softmax([1000.0, 0.0]))
L = np.array([[2.0, 0.0, 0.0]]); loss, g = ce_loss_and_grad(L, np.array([0]))
num = (ce_loss_and_grad(L + np.array([[1e-6, 0, 0]]), np.array([0]))[0] - loss) / 1e-6
print(round(loss, 4), np.round(g, 4), bool(abs(num - g[0, 0]) < 1e-5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.2075 [    0. -1000.]\n0.2395 [[-0.213   0.1065  0.1065]] True",
          "0.2075 [    0. -1000.]\n0.2395 [[-0.213   0.1065  0.1065]] True",
          "1.2075 [nan nan]\n0.2395 [[-0.213   0.1065  0.1065]] True",
          "1.2075 [    0. -1000.]\n0.2395 [[ 0.787  0.1065  0.1065]] False",
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

def smooth_targets(y, k, eps):
    T = np.full((len(y), k), eps / k)
    T[np.arange(len(y)), y] += 1 - eps
    return T

def soft_ce(logits, T):
    z = logits - logits.max(axis=1, keepdims=True)
    lp = z - np.log(np.exp(z).sum(axis=1, keepdims=True))
    return float(-(T * lp).sum(axis=1).mean())

def optimal_logit_gap(k, eps):
    return float(np.log((1 - eps + eps / k) / (eps / k)))

T = smooth_targets(np.array([1]), 3, 0.3); gap = optimal_logit_gap(3, 0.3)
f = lambda d: soft_ce(np.array([[0.0, d, 0.0]]), T)
print(T, round(soft_ce(np.zeros((1, 3)), T), 4), round(gap, 4), f(gap) < min(f(gap - 0.5), f(gap + 0.5)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.1 0.8 0.1]] 1.0986 2.0794 True",
          "[[0.15 0.7  0.15]] 1.0986 2.0794 True",
          "[[0.1 0.8 0.1]] 0.0 2.0794 True",
          "[[0.1 0.8 0.1]] 1.0986 inf False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cross_entropy(p, q)</C> in bits; a numerically stable <C>log_softmax(z)</C> over the last axis; and{" "}
          <C>ce_loss_and_grad(logits, y)</C>, returning the mean loss in nats over the rows and its gradient with respect
          to the logits.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def cross_entropy(p, q):
    return 0.0

def log_softmax(z):
    return np.asarray(z, dtype=float)

def ce_loss_and_grad(logits, y):
    return 0.0, np.zeros_like(logits)
`,
        solution: CE,
        tests: [
          { name: "values", code: `assert np.isclose(cross_entropy([1.0, 0.0], [0.25, 0.75]), 2.0) and np.isclose(cross_entropy([0.5, 0.5], [0.5, 0.5]), 1.0)
lp = log_softmax(np.array([[1000.0, 1000.0], [0.0, np.log(3.0)]]))
assert np.allclose(lp, np.log([[0.5, 0.5], [0.25, 0.75]]))` },
          { name: "grad", code: `Z = np.array([[0.0, 0.0], [1.0, -1.0]]); loss, g = ce_loss_and_grad(Z, np.array([1, 1]))
q = 1 / (1 + np.exp(-2.0))
assert np.isclose(loss, (np.log(2) - np.log(1 - q)) / 2) and np.allclose(g, [[0.25, -0.25], [q / 2, -q / 2]])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>smooth_targets(y, k, eps)</C>, the rows (1 − ε)·one-hot + ε/k; <C>soft_ce(logits, T)</C>, the mean
          cross-entropy in nats against soft targets; and <C>optimal_logit_gap(k, eps)</C>, the gap between the true logit
          and each other logit at the optimum.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def smooth_targets(y, k, eps):
    return np.zeros((len(y), k))

def soft_ce(logits, T):
    return 0.0

def optimal_logit_gap(k, eps):
    return 0.0
`,
        solution: LS,
        tests: [
          { name: "targets", code: `T = smooth_targets(np.array([0, 2]), 4, 0.2)
assert np.allclose(T, [[0.85, 0.05, 0.05, 0.05], [0.05, 0.05, 0.85, 0.05]]) and np.allclose(smooth_targets(np.array([1]), 2, 0.0), [[0, 1]])` },
          { name: "optimum", code: `T = smooth_targets(np.array([0]), 4, 0.2); d = optimal_logit_gap(4, 0.2)
assert np.isclose(d, np.log(0.85 / 0.05)) and np.isclose(soft_ce(np.array([[d, 0, 0, 0]]), T), -(T * np.log(T)).sum())
assert np.isclose(soft_ce(np.zeros((2, 5)), smooth_targets(np.array([0, 3]), 5, 0.1)), np.log(5))` },
        ],
      },
    },
    {
      key: "gap",
      rung: "stretch",
      prompt: (
        <p>
          With K = 10 classes and label smoothing ε = 0.1, what logit gap between the true class and each other class
          minimises the loss? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 4.5109, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        KL compares two distributions of one variable. Comparing the joint distribution of two variables with the product
        of their marginals measures how much one tells you about the other. That is mutual information, the subject of the
        next lesson.
      </p>
    </>
  ),
};
