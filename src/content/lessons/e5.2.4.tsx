import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { StableSoftmaxViz } from "@/components/viz/StableSoftmaxViz";
import type { LessonContent } from "@/lib/types";

const TENSOR = `import numpy as np

class Tensor:
    def __init__(self, data, _prev=(), _op=""):
        self.data = np.asarray(data, dtype=float)
        self.grad = np.zeros_like(self.data)
        self._prev = set(_prev)
        self._op = _op
        self._backward = lambda: None

    def backward(self):
        topo, seen = [], set()
        def build(v):
            if v not in seen:
                seen.add(v)
                for p in v._prev:
                    build(p)
                topo.append(v)
        build(self)
        self.grad = np.ones_like(self.data)
        for v in reversed(topo):
            v._backward()
`;

const CE = `def logsumexp(z):
    m = z.max(axis=1, keepdims=True)
    return m[:, 0] + np.log(np.exp(z - m).sum(axis=1))

def cross_entropy(logits, y):
    z, n = logits.data, len(y)
    lse = logsumexp(z)
    out = Tensor((lse - z[np.arange(n), y]).mean(), (logits,), "ce")
    def _backward():
        p = np.exp(z - lse[:, None])
        p[np.arange(n), y] -= 1
        logits.grad += p / n * out.grad
    out._backward = _backward
    return out
`;

const LSM = `def log_softmax(a):
    z = a.data
    m = z.max(axis=1, keepdims=True)
    lp = z - m - np.log(np.exp(z - m).sum(axis=1, keepdims=True))
    out = Tensor(lp, (a,), "log_softmax")
    def _backward():
        g = out.grad
        a.grad += g - np.exp(lp) * g.sum(axis=1, keepdims=True)
    out._backward = _backward
    return out

def nll(logp, y):
    n = len(y)
    out = Tensor(-logp.data[np.arange(n), y].mean(), (logp,), "nll")
    def _backward():
        g = np.zeros_like(logp.data)
        g[np.arange(n), y] = -out.grad / n
        logp.grad += g
    out._backward = _backward
    return out
`;

export const lesson: LessonContent = {
  id: "e5.2.4",
  minutes: 55,
  links: {
    requires: ["e5.2.3", "m5.4.4"],
    revisits: ["e5.2.2", "e5.1.3"],
    foreshadows: ["e5.3.1", "e5.4.3"],
  },

  puzzle: (
    <>
      <p>
        A classifier outputs logits z, softmax turns them into probabilities, and the loss is −log of the probability of the
        right class. Built from exp, sum, divide and log, the engine can already differentiate it. Yet with logits around 1000,
        the loss comes out as nan. Why, and what should a framework do instead?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        exp(1000) does not fit in a float64, so it becomes inf, and inf / inf is nan. Softmax does not change if every logit is
        shifted by the same amount, so subtract the largest logit first: every exponent is then at most exp(0) = 1, and
        nothing overflows.
      </p>
      <StableSoftmaxViz />
      <p>
        The backward pass simplifies too. Through all the exps, sums and logs, the gradient of the loss with respect to the
        logits collapses to p − onehot(y): the predicted probabilities, minus 1 at the right class. One fused operation can
        compute that directly.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="log-sum-exp and cross-entropy">
        <p>
          For logits z of one example, lse(z) = log Σⱼ exp(zⱼ) and the cross-entropy loss for target y is lse(z) − z_y. With
          m = maxⱼ zⱼ, lse(z) = m + log Σⱼ exp(zⱼ − m), and every exponent there is at most 0. For a batch, the loss is the
          mean over examples.
        </p>
      </Definition>

      <Theorem title="the fused gradient">
        <p>
          ∂(lse(z) − z_y)/∂zⱼ = pⱼ − [j = y], where p = softmax(z) = exp(z − lse(z)). For the batch mean over n examples, each
          row of the gradient is divided by n.
        </p>
      </Theorem>
      <Proof>
        <p>
          ∂lse/∂zⱼ = exp(zⱼ) / Σₖ exp(zₖ) = pⱼ, and ∂z_y/∂zⱼ is 1 when j = y and 0 otherwise. Subtracting gives pⱼ − [j = y].
          The mean multiplies each example&rsquo;s loss by 1/n, so its gradient row is scaled by 1/n.
        </p>
      </Proof>

      <Definition title="the fused operation">
        <p>
          The forward pass computes lse stably and takes the mean; the closure computes p from the saved lse, subtracts 1 at
          the targets, and scales by 1/n. One node replaces about a dozen, and nothing in it can overflow.
        </p>
        <Code>{CE}</Code>
      </Definition>

      <Example title="a batch of two">
        <Code>{`logits = Tensor([[2.0, 0.0, 0.0], [0.0, 0.0, 0.0]])
L = cross_entropy(logits, np.array([0, 2]))
L.backward()
# L.data ≈ 0.6691
# logits.grad ≈ [[-0.1065, 0.0533, 0.0533],
#                [ 0.1667, 0.1667, -0.3333]]`}</Code>
        <p>
          Each row of the gradient sums to 0, because the probabilities sum to 1 and exactly 1 is subtracted. Raising every
          logit of a row by the same amount changes nothing, so the gradient has no component in that direction.
        </p>
      </Example>

      <Remark title="why PyTorch fuses it">
        <p>
          <C>torch.nn.functional.cross_entropy</C> takes raw logits, not probabilities, for exactly this reason. Passing
          softmax outputs into a separate log loses precision for confident predictions, where p_y rounds to 1 and its log to
          0, or where p_y underflows to 0 and its log is −inf.
        </p>
      </Remark>

      <Remark title="the unfused pieces">
        <p>
          The same loss can be split into a stable log-softmax node and a negative log-likelihood node that picks one entry
          per row. Its closure is the softmax Jacobian applied to the incoming gradient, g − p·Σg along each row.
        </p>
        <Code>{LSM}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "grad",
      rung: "check",
      prompt: <p>For one example with probabilities p = softmax(z) and target y, what is the gradient of the cross-entropy loss with respect to z?</p>,
      answer: { kind: "choice", options: ["p − onehot(y)", "onehot(y) − p", "−1 / p_y at y and 0 elsewhere", "p ⊙ (1 − p)"], correct: [0] },
    },
    {
      key: "uniform",
      rung: "check",
      prompt: <p>Four classes, all logits equal, target class 2, one example. What is the gradient entry for class 2?</p>,
      answer: { kind: "numeric", value: -0.75 },
    },
    {
      key: "overflow",
      rung: "apply",
      prompt: <p>In float64, what does <C>np.exp(1000.0)</C> return?</p>,
      answer: { kind: "choice", options: ["inf, with an overflow warning", "nan", "A very large finite number", "It raises OverflowError"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

z = np.array([1000.0, 0.0, -1000.0])
with np.errstate(all="ignore"):
    naive = -np.log(np.exp(z[0]) / np.exp(z).sum())
m = z.max()
stable = (m + np.log(np.exp(z - m).sum())) - z[0]
print(naive, stable)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["nan 0.0", "inf 0.0", "0.0 0.0", "nan nan"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${TENSOR}
${CE}
logits = Tensor([[2.0, 0.0, 0.0], [0.0, 0.0, 0.0]])
L = cross_entropy(logits, np.array([0, 2]))
L.backward()
print(round(float(L.data), 4), (logits.grad.sum(axis=1).round(6) + 0.0).tolist(), round(float(logits.grad[1, 2]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.6691 [0.0, 0.0] -0.3333", "0.6691 [1.0, 1.0] -0.3333", "1.3382 [0.0, 0.0] -0.6667", "0.6691 [0.0, 0.0] 0.1667"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Tensor and its <C>backward()</C> are already defined. Write <C>logsumexp(z)</C>, which takes a NumPy array of shape
          (n, C) and returns the stable row-wise lse of shape (n,), and <C>cross_entropy(logits, y)</C>, a fused Tensor
          operation returning the mean loss with the closure (p − onehot) / n.
        </p>
      ),
      answer: {
        kind: "code",
        setup: TENSOR,
        starter: `# Tensor and backward() are already defined.

def logsumexp(z):
    return np.log(np.exp(z).sum(axis=1))

def cross_entropy(logits, y):
    z, n = logits.data, len(y)
    return Tensor((logsumexp(z) - z[np.arange(n), y]).mean())
`,
        solution: CE,
        tests: [
          { name: "huge logits stay finite", code: `z = np.array([[1000.0, 0.0, -1000.0], [-5.0, 800.0, 800.0]])
assert np.allclose(logsumexp(z), [1000.0, 800.0 + np.log(2)])
t = Tensor(z)
L = cross_entropy(t, np.array([0, 1]))
L.backward()
assert np.isfinite(L.data) and abs(L.data - np.log(2) / 2) < 1e-12, L.data
assert np.allclose(t.grad, [[0, 0, 0], [0, -0.25, 0.25]], atol=1e-12), t.grad` },
          { name: "against finite differences", code: `rng = np.random.default_rng(0)
Z = rng.normal(size=(4, 5)) * 3
y = np.array([0, 3, 1, 4])
t = Tensor(Z)
cross_entropy(t, y).backward()
f = lambda Z: np.mean(np.log(np.exp(Z).sum(axis=1)) - Z[np.arange(4), y])
h = 1e-6
num = np.zeros_like(Z)
for i in range(4):
    for j in range(5):
        E = np.zeros_like(Z); E[i, j] = h
        num[i, j] = (f(Z + E) - f(Z - E)) / (2 * h)
assert np.allclose(t.grad, num, atol=1e-7)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Now the unfused version. Write <C>log_softmax(a)</C>, a stable row-wise Tensor operation whose closure is g − p·Σg
          (sum along each row), and <C>nll(logp, y)</C>, which returns the mean of −logp[i, y[i]] with its closure.
          Together, <C>nll(log_softmax(z), y)</C> must match the fused loss.
        </p>
      ),
      answer: {
        kind: "code",
        setup: `${TENSOR}
${CE}`,
        starter: `# Tensor, backward() and the fused cross_entropy are already defined.

def log_softmax(a):
    return Tensor(a.data)

def nll(logp, y):
    return Tensor(0.0)
`,
        solution: LSM,
        tests: [
          { name: "matches the fused loss", code: `rng = np.random.default_rng(1)
Z = rng.normal(size=(6, 4)) * 4
y = np.array([0, 1, 2, 3, 0, 1])
a, b = Tensor(Z), Tensor(Z.copy())
L1 = nll(log_softmax(a), y)
L1.backward()
L2 = cross_entropy(b, y)
L2.backward()
assert abs(L1.data - L2.data) < 1e-12 and np.allclose(a.grad, b.grad, atol=1e-12)` },
          { name: "stable, and rows of exp sum to 1", code: `a = Tensor([[1000.0, 0.0], [0.0, -1000.0]])
lp = log_softmax(a)
assert np.all(np.isfinite(lp.data)) and np.allclose(np.exp(lp.data).sum(axis=1), 1.0)
L = nll(lp, np.array([1, 0]))
L.backward()
assert abs(L.data - 500.0) < 1e-9, L.data
assert np.allclose(a.grad, [[0.5, -0.5], [0.0, 0.0]]), a.grad` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that lse(z − c·1) = lse(z) − c for any constant c, and use it to explain why subtracting the maximum logit
          gives the same loss while no exponent exceeds 1.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes log Σ exp(zⱼ − c) = log (e^(−c) Σ exp(zⱼ)) = lse(z) − c.",
          "Applies it with c = max z: lse(z) = m + lse(z − m), and z_y − m shifts the same way, so lse(z) − z_y is unchanged.",
          "Notes every zⱼ − m ≤ 0, so each exp(zⱼ − m) ≤ 1 (and the largest is exactly 1, so the sum is at least 1 and its log is finite).",
        ],
      },
    },
    {
      key: "limit",
      rung: "stretch",
      prompt: <p>What is the largest integer x for which <C>np.exp(float(x))</C> is finite in float64?</p>,
      answer: { kind: "numeric", value: 709 },
    },
  ],

  teachBack:
    "Explain to a friend why naive softmax cross-entropy produces nan for large logits, how subtracting the maximum fixes it, and why the fused gradient is just p minus the one-hot target.",

  glimpse: (
    <p>
      The tensor engine is complete enough to train a real classifier. Next, the structure around it: modules that own their
      parameters, the way PyTorch&rsquo;s nn.Module does.
    </p>
  ),
};
