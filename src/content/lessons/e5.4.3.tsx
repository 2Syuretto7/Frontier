import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EdgeCaseViz } from "@/components/viz/EdgeCaseViz";
import type { LessonContent } from "@/lib/types";

const ENGINE = `import numpy as np

def unbroadcast(g, shape):
    while g.ndim > len(shape):
        g = g.sum(axis=0)
    for i, n in enumerate(shape):
        if n == 1:
            g = g.sum(axis=i, keepdims=True)
    return g

class Tensor:
    def __init__(self, data, _prev=()):
        self.data = np.asarray(data, dtype=float)
        self.grad = np.zeros_like(self.data)
        self._prev = _prev
        self._backward = lambda: None

    def _make(self, data, prev, backward):
        out = Tensor(data, prev)
        out._backward = lambda: backward(out.grad)
        return out

    def __add__(self, o):
        def bw(g):
            self.grad += unbroadcast(g, self.data.shape)
            o.grad += unbroadcast(g, o.data.shape)
        return self._make(self.data + o.data, (self, o), bw)

    def __mul__(self, o):
        def bw(g):
            self.grad += unbroadcast(o.data * g, self.data.shape)
            o.grad += unbroadcast(self.data * g, o.data.shape)
        return self._make(self.data * o.data, (self, o), bw)

    def __matmul__(self, o):
        def bw(g):
            self.grad += g @ o.data.T
            o.grad += self.data.T @ g
        return self._make(self.data @ o.data, (self, o), bw)

    def sum(self):
        def bw(g):
            self.grad += np.ones_like(self.data) * g
        return self._make(self.data.sum(), (self,), bw)

    def relu(self):
        def bw(g):
            self.grad += (self.data > 0) * g
        return self._make(np.maximum(self.data, 0), (self,), bw)

    def backward(self):
        topo, seen, stack = [], set(), [(self, False)]
        while stack:
            v, done = stack.pop()
            if done:
                topo.append(v)
            elif v not in seen:
                seen.add(v)
                stack.append((v, True))
                stack.extend((p, False) for p in v._prev)
        self.grad = np.ones_like(self.data)
        for v in reversed(topo):
            v._backward()

def cross_entropy(logits, y):
    z, n = logits.data, len(y)
    m = z.max(axis=1, keepdims=True)
    lse = m[:, 0] + np.log(np.exp(z - m).sum(axis=1))
    def bw(g):
        p = np.exp(z - lse[:, None])
        p[np.arange(n), y] -= 1
        logits.grad += p / n * g
    return logits._make((lse - z[np.arange(n), y]).mean(), (logits,), bw)
`;

const STABLE = `def sigmoid(x):
    e = np.exp(-np.abs(x))
    return np.where(x >= 0, 1 / (1 + e), e / (1 + e))

def softplus(x):
    return np.maximum(x, 0) + np.log1p(np.exp(-np.abs(x)))

def log_sigmoid(x):
    return -softplus(-x)
`;

const BCE = `def bce_with_logits(z, y):
    x, n = z.data, z.data.size
    loss = (softplus(x) - y * x).mean()
    def bw(g):
        z.grad += (sigmoid(x) - y) / n * g
    return z._make(loss, (z,), bw)
`;

export const lesson: LessonContent = {
  id: "e5.4.3",
  minutes: 50,
  links: {
    requires: ["e5.4.2", "e5.2.4"],
    revisits: ["e3.1.2", "m5.4.4"],
    foreshadows: ["e5.5.1", "e5.5.2"],
  },

  puzzle: (
    <>
      <p>
        A training run goes well for ten thousand steps. Then one loss value prints as nan, and from the next step on every
        weight in the network is nan. Nothing in the code changed. What single value could have done this, and how does one
        nan reach every parameter in one step?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Floating point has special values: ±inf from overflow or division by zero, nan from 0 · inf, inf − inf or 0/0, and a
        signed zero. Any arithmetic with nan gives nan, so one bad gradient entry, passed through a matmul in the backward pass,
        contaminates a whole gradient matrix, and the optimiser writes it into the weights. The defences are to compute every
        function in a form that cannot overflow, to fuse operations whose separate pieces can produce inf, and to test at the
        extremes.
      </p>
      <EdgeCaseViz />
    </>
  ),

  theory: (
    <>
      <Definition title="stable elementwise functions">
        <p>
          Each form below exponentiates only non-positive numbers, so nothing overflows, and uses <C>log1p</C> so that log(1 +
          t) keeps its precision when t is tiny.
        </p>
        <Code>{STABLE}</Code>
      </Definition>

      <Theorem title="the stable softplus is exact">
        <p>For every real x, log(1 + eˣ) = max(x, 0) + log(1 + e^(−|x|)).</p>
      </Theorem>
      <Proof>
        <p>
          If x ≤ 0, then max(x, 0) = 0 and −|x| = x, so the right side is log(1 + eˣ). If x &gt; 0, then log(1 + eˣ) = log(eˣ(e⁻ˣ
          + 1)) = x + log(1 + e⁻ˣ), and max(x, 0) = x, −|x| = −x. In both cases e^(−|x|) ≤ 1, so the exponential cannot
          overflow, and log1p of a number in [0, 1] is accurate.
        </p>
      </Proof>

      <Example title="binary cross-entropy from logits">
        <p>
          For a logit z and a label y in {"{0, 1}"}, the loss −y log σ(z) − (1 − y) log(1 − σ(z)) simplifies to softplus(z) − yz,
          and its gradient to σ(z) − y. Computed through σ and log separately, a confident wrong prediction takes log(0) =
          −inf and the chained gradient (1/σ)·σ(1 − σ) becomes (1/0)·0 = nan. Fused, both stay finite at any z. This is
          PyTorch&rsquo;s <C>BCEWithLogitsLoss</C>.
        </p>
        <Code>{BCE}</Code>
      </Example>

      <Remark title="nan does not compare">
        <p>
          nan == nan is False, and Python&rsquo;s <C>max</C> and sorting give answers that depend on argument order when nan is
          present. Test for it with <C>np.isnan</C> or <C>np.isfinite</C>. A cheap guard in a training loop checks{" "}
          <C>np.isfinite(loss)</C> before stepping, and skips or stops instead of writing nan into the weights.
        </p>
      </Remark>

      <Remark title="signed zero">
        <p>
          −0.0 == 0.0 is True, but 1/−0.0 is −inf and <C>str(-0.0)</C> is "-0.0", so printed outputs and bit-exact comparisons
          can differ even when values are equal. A read-out that must print 0 can add 0.0, since −0.0 + 0.0 = +0.0.
        </p>
      </Remark>

      <Remark title="testing at the extremes">
        <p>
          Run each operation inside <C>np.errstate(over="raise", invalid="raise", divide="raise")</C> on inputs like ±1000,
          ±1e-300, 0 and −0.0. Any overflow, invalid operation or division by zero then fails the test loudly, instead of
          appearing as a nan ten thousand steps later. Underflow to 0 is usually harmless and can be left alone.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "zeroinf",
      rung: "check",
      prompt: <p>In IEEE floating point, what is 0 · inf?</p>,
      answer: { kind: "choice", options: ["nan", "0", "inf", "It raises an exception"], correct: [0] },
    },
    {
      key: "sqrt",
      rung: "check",
      prompt: <p>The derivative of √x is 1/(2√x). What is it at x = 10⁻¹²?</p>,
      answer: { kind: "numeric", value: 500000 },
    },
    {
      key: "sigmoid",
      rung: "apply",
      prompt: <p>For x = −1000, which form of σ(x) computes without overflow?</p>,
      answer: {
        kind: "choice",
        options: ["eˣ / (1 + eˣ)", "1 / (1 + e⁻ˣ)", "Both overflow", "Neither form matters"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

print(np.nan == np.nan, max(np.nan, 1.0), max(1.0, np.nan), np.maximum(1.0, np.nan))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["False nan 1.0 nan", "True nan nan nan", "False 1.0 1.0 1.0", "False nan nan 1.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

print(-0.0 == 0.0, np.copysign(1.0, -0.0), str(-0.0), np.sqrt(-0.0))`}</Code>
          <p>Signed zero. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["True -1.0 -0.0 -0.0", "False -1.0 -0.0 nan", "True 1.0 0.0 0.0", "True -1.0 -0.0 nan"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write NumPy functions <C>sigmoid(x)</C>, <C>softplus(x)</C> = log(1 + eˣ) and <C>log_sigmoid(x)</C> that never
          overflow, never divide by zero and keep full relative precision for tiny results. The tests run them under{" "}
          <C>np.errstate(over="raise", invalid="raise", divide="raise")</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def softplus(x):
    return np.log(1 + np.exp(x))

def log_sigmoid(x):
    return np.log(sigmoid(x))
`,
        solution: `import numpy as np

${STABLE}`,
        tests: [
          { name: "extremes without warnings", code: `x = np.array([-1000.0, -40.0, 0.0, 40.0, 1000.0])
with np.errstate(over="raise", invalid="raise", divide="raise", under="ignore"):
    s, sp, ls = sigmoid(x), softplus(x), log_sigmoid(x)
assert np.allclose(s, [0, np.exp(-40), 0.5, 1, 1], rtol=1e-12, atol=0)
assert np.allclose(sp, [0, np.exp(-40), np.log(2), 40, 1000], rtol=1e-12, atol=0)
assert np.allclose(ls, [-1000, -40, -np.log(2), -np.exp(-40), 0], rtol=1e-12, atol=0)` },
          { name: "identities", code: `rng = np.random.default_rng(0)
x = rng.normal(size=1000) * 20
with np.errstate(over="raise", invalid="raise", divide="raise", under="ignore"):
    assert np.allclose(sigmoid(x) + sigmoid(-x), 1.0)
    assert np.allclose(softplus(x) - softplus(-x), x)
    assert np.allclose(np.exp(log_sigmoid(x)), sigmoid(x))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          The engine and the stable functions are already defined. Write <C>bce_with_logits(z, y)</C>, a fused Tensor
          operation returning the mean of softplus(z) − y·z over all entries, whose closure adds (σ(z) − y)/n times the incoming
          gradient. Build the node with <C>z._make(data, (z,), backward)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        setup: `${ENGINE}
${STABLE}`,
        starter: `# The engine, sigmoid, softplus and log_sigmoid are already defined.

def bce_with_logits(z, y):
    x = z.data
    p = 1 / (1 + np.exp(-x))
    return Tensor((-(y * np.log(p) + (1 - y) * np.log(1 - p))).mean())
`,
        solution: BCE,
        tests: [
          { name: "confident and wrong", code: `z = Tensor(np.array([1000.0, -1000.0, 0.0]))
with np.errstate(over="raise", invalid="raise", divide="raise", under="ignore"):
    L = bce_with_logits(z, np.array([1.0, 1.0, 0.0]))
    L.backward()
assert abs(L.data - (1000 + np.log(2)) / 3) < 1e-9, L.data
assert np.allclose(z.grad, [0.0, -1 / 3, 1 / 6]), z.grad` },
          { name: "matches the textbook formula", code: `rng = np.random.default_rng(1)
Z = rng.normal(size=(4, 3)) * 3
Y = (rng.uniform(size=(4, 3)) > 0.5).astype(float)
z = Tensor(Z)
L = bce_with_logits(z, Y)
L.backward()
P = 1 / (1 + np.exp(-Z))
assert abs(L.data - np.mean(-(Y * np.log(P) + (1 - Y) * np.log(1 - P)))) < 1e-12
assert np.allclose(z.grad, (P - Y) / 12)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Show that for y in {"{0, 1}"}, −y log σ(z) − (1 − y) log(1 − σ(z)) = softplus(z) − yz, where σ(z) = 1/(1 + e⁻ᶻ) and
          softplus(z) = log(1 + eᶻ), and that its derivative in z is σ(z) − y.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses log σ(z) = −log(1 + e⁻ᶻ) = z − softplus(z) and log(1 − σ(z)) = −softplus(z) (or equivalent identities).",
          "Substitutes and simplifies: −y(z − softplus(z)) + (1 − y)softplus(z) = softplus(z) − yz.",
          "Differentiates: softplus′(z) = eᶻ/(1 + eᶻ) = σ(z), so the derivative is σ(z) − y.",
        ],
      },
    },
    {
      key: "normal",
      rung: "stretch",
      prompt: <p>The smallest positive normal float32 is 2ᵏ. What is k?</p>,
      answer: { kind: "numeric", value: -126 },
    },
  ],

  teachBack:
    "Explain to a friend how one nan can reach every weight in a single step, which special floating-point values cause it, and how stable forms and fused operations like BCE with logits prevent it.",

  glimpse: (
    <p>
      The framework is correct and robust, but every array operation is NumPy&rsquo;s. Next: building the array itself, a
      strided buffer in C, and what a view, a transpose and a broadcast look like in memory.
    </p>
  ),
};
