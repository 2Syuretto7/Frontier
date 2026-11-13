import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MinibatchNoiseViz } from "@/components/viz/MinibatchNoiseViz";
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

class Module:
    def parameters(self):
        params, seen = [], set()
        def visit(x):
            if isinstance(x, Tensor):
                if id(x) not in seen:
                    seen.add(id(x))
                    params.append(x)
            elif isinstance(x, Module):
                for v in vars(x).values():
                    visit(v)
            elif isinstance(x, (list, tuple)):
                for v in x:
                    visit(v)
        visit(self)
        return params

    def zero_grad(self):
        for p in self.parameters():
            p.grad = np.zeros_like(p.data)

    def __call__(self, *args):
        return self.forward(*args)

class Linear(Module):
    def __init__(self, nin, nout):
        self.W = Tensor(np.random.randn(nin, nout) / np.sqrt(nin))
        self.b = Tensor(np.zeros(nout))

    def forward(self, x):
        return x @ self.W + self.b

class ReLU(Module):
    def forward(self, x):
        return x.relu()

class Sequential(Module):
    def __init__(self, *layers):
        self.layers = list(layers)

    def forward(self, x):
        for layer in self.layers:
            x = layer(x)
        return x

def count_params(m):
    return sum(p.data.size for p in m.parameters())

class SGD:
    def __init__(self, params, lr, momentum=0.0):
        self.params, self.lr, self.mu = list(params), lr, momentum
        self.v = [np.zeros_like(p.data) for p in self.params]

    def zero_grad(self):
        for p in self.params:
            p.grad = np.zeros_like(p.data)

    def step(self):
        for p, v in zip(self.params, self.v):
            v *= self.mu
            v += p.grad
            p.data -= self.lr * v
`;

const LOADER = `class DataLoader:
    def __init__(self, X, y, batch_size, shuffle=False, drop_last=False, seed=0):
        self.X, self.y, self.bs = X, y, batch_size
        self.shuffle, self.drop_last = shuffle, drop_last
        self.rng = np.random.default_rng(seed)

    def __len__(self):
        n = len(self.X)
        return n // self.bs if self.drop_last else (n + self.bs - 1) // self.bs

    def __iter__(self):
        n = len(self.X)
        idx = self.rng.permutation(n) if self.shuffle else np.arange(n)
        for k in range(len(self)):
            j = idx[k * self.bs:(k + 1) * self.bs]
            yield self.X[j], self.y[j]
`;

const LOOP = `def train_epochs(net, opt, loader, epochs):
    history = []
    for _ in range(epochs):
        total, count = 0.0, 0
        for xb, yb in loader:
            loss = cross_entropy(net(Tensor(xb)), yb)
            opt.zero_grad()
            loss.backward()
            opt.step()
            total += float(loss.data) * len(xb)
            count += len(xb)
        history.append(total / count)
    return history

def accuracy(net, X, y):
    return float((net(Tensor(X)).data.argmax(axis=1) == y).mean())
`;

export const lesson: LessonContent = {
  id: "e5.3.3",
  minutes: 50,
  links: {
    requires: ["e5.3.2", "e1.3.4"],
    revisits: ["e5.1.3", "l1.2.4"],
    foreshadows: ["e5.3.4", "e5.4.2"],
  },

  puzzle: (
    <>
      <p>
        With a million training examples, computing the exact gradient means a full pass over all of them for every single
        step. Taking a step after every 64 examples is 15 000 times cheaper per step. But that gradient is computed from a
        different, random 64 each time. In what sense is it still the right gradient, and how should the examples be handed
        out?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A random mini-batch&rsquo;s gradient is a noisy estimate of the full gradient: right on average, wrong by a random
        amount each time. Larger batches average away more noise, with the spread shrinking like one over the square root of
        the batch size. A data loader shuffles the indices once per epoch and hands out consecutive slices, so every example
        is used exactly once per epoch, in a new order each time.
      </p>
      <MinibatchNoiseViz />
    </>
  ),

  theory: (
    <>
      <Definition title="DataLoader">
        <p>
          A DataLoader holds the arrays, a batch size, and a random generator. <C>len(loader)</C> is the number of batches per
          epoch. Iterating over it draws a fresh permutation when shuffling and yields one (inputs, targets) pair per batch.
          With <C>drop_last</C>, a final short batch is skipped.
        </p>
        <Code>{LOADER}</Code>
      </Definition>

      <Theorem title="a random batch gives an unbiased gradient">
        <p>
          Let the loss be L = (1/n) Σᵢ ℓᵢ with per-example gradients gᵢ and full gradient g = (1/n) Σᵢ gᵢ. If a batch B of size
          b is a uniformly random subset of the examples, then ĝ = (1/b) Σ_{"{i ∈ B}"} gᵢ satisfies E[ĝ] = g.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write ĝ = (1/b) Σᵢ 1[i ∈ B] gᵢ, summing over all n examples. By symmetry each example is in B with probability b/n,
          so E[ĝ] = (1/b) Σᵢ (b/n) gᵢ = (1/n) Σᵢ gᵢ = g. The consecutive slices of a uniformly random permutation are such
          subsets.
        </p>
      </Proof>

      <Example title="an epoch loop">
        <Code>{LOOP}</Code>
        <p>
          The epoch&rsquo;s loss is weighted by batch size, so a short final batch counts for its real share. Accuracy uses
          the network on the whole set at once, with no backward pass.
        </p>
      </Example>

      <Remark title="the noise is not all bad">
        <p>
          If per-example gradients have variance σ² around g, a batch of b drawn with replacement has variance σ²/b. Larger
          batches give cleaner steps but cost more per step, and past some size the extra cleanliness buys little. The noise
          of small batches is also widely thought to help generalisation, by keeping the parameters out of sharp minima.
        </p>
      </Remark>

      <Remark title="a generator is used once">
        <p>
          <C>__iter__</C> is a generator function, so every <C>for</C> loop over the loader calls it again and starts a fresh
          epoch. A bare generator object, by contrast, is exhausted after one pass: looping over it a second time yields
          nothing, and a training loop over it silently trains for one epoch.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "count",
      rung: "check",
      prompt: <p>1000 examples, batch size 32, no drop_last. How many batches per epoch?</p>,
      answer: { kind: "numeric", value: 32 },
    },
    {
      key: "why",
      rung: "check",
      prompt: <p>Why does the loader draw a new permutation every epoch?</p>,
      answer: {
        kind: "choice",
        options: [
          "So each epoch's batches are different random subsets, keeping each batch gradient an unbiased, fresh estimate",
          "To make the loss decrease monotonically",
          "Because NumPy arrays cannot be read in order twice",
          "To use each example several times per epoch",
        ],
        correct: [0],
      },
    },
    {
      key: "noise",
      rung: "apply",
      prompt: <p>Going from batch size 16 to 64, by what factor does the standard deviation of the mini-batch gradient shrink (sampling with replacement)?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

${LOADER}
X, y = np.arange(20.0).reshape(10, 2), np.arange(10)
a = DataLoader(X, y, 4)
b = DataLoader(X, y, 4, drop_last=True)
print(len(a), [xb.shape[0] for xb, yb in a], len(b), [yb.tolist() for xb, yb in b])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3 [4, 4, 2] 2 [[0, 1, 2, 3], [4, 5, 6, 7]]",
          "2 [4, 4] 2 [[0, 1, 2, 3], [4, 5, 6, 7]]",
          "3 [4, 4, 2] 3 [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9]]",
          "3 [4, 4, 4] 2 [[0, 1, 2, 3], [4, 5, 6, 7]]",
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

def batches(y, bs):
    for k in range(0, len(y), bs):
        yield y[k:k + bs]

g = batches(np.arange(10), 4)
print(len(list(g)), len(list(g)))`}</Code>
          <p>A generator looped over twice. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3 0", "3 3", "2 2", "3 2"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>DataLoader(X, y, batch_size, shuffle=False, drop_last=False, seed=0)</C> with <C>__len__</C> and a
          generator <C>__iter__</C>. Use <C>np.random.default_rng(seed)</C> once in the constructor and draw a new{" "}
          <C>permutation</C> from it at the start of every epoch.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

class DataLoader:
    def __init__(self, X, y, batch_size, shuffle=False, drop_last=False, seed=0):
        self.X, self.y, self.bs = X, y, batch_size

    def __len__(self):
        return 0

    def __iter__(self):
        yield self.X, self.y
`,
        solution: `import numpy as np

${LOADER}`,
        tests: [
          { name: "batch sizes and order", code: `X, y = np.arange(14.0).reshape(7, 2), np.arange(7)
a = DataLoader(X, y, 3)
assert len(a) == 3 and [yb.tolist() for _, yb in a] == [[0, 1, 2], [3, 4, 5], [6]]
b = DataLoader(X, y, 3, drop_last=True)
assert len(b) == 2 and [len(yb) for _, yb in b] == [3, 3]
xb, yb = next(iter(a))
assert np.array_equal(xb, X[:3])` },
          { name: "shuffled epochs", code: `X, y = np.arange(40.0).reshape(20, 2), np.arange(20)
d = DataLoader(X, y, 6, shuffle=True, seed=3)
e1 = np.concatenate([yb for _, yb in d])
e2 = np.concatenate([yb for _, yb in d])
assert sorted(e1.tolist()) == list(range(20)) and sorted(e2.tolist()) == list(range(20))
assert not np.array_equal(e1, e2), 'Draw a new permutation each epoch.'
assert all(np.array_equal(xb[:, 0] / 2, yb) for xb, yb in d), 'Inputs and targets must stay paired.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With the engine, modules, SGD and DataLoader defined, write <C>train_epochs(net, opt, loader, epochs)</C>, returning
          one mean loss per epoch weighted by batch size, and <C>accuracy(net, X, y)</C>, the fraction of rows whose largest
          logit is at the target.
        </p>
      ),
      answer: {
        kind: "code",
        setup: `${ENGINE}
${LOADER}`,
        starter: `# The engine, Module, Linear, ReLU, Sequential, SGD and DataLoader are already defined.

def train_epochs(net, opt, loader, epochs):
    return []

def accuracy(net, X, y):
    return 0.0
`,
        solution: LOOP,
        tests: [
          { name: "weighted epoch loss", code: `np.random.seed(0)
X = np.random.randn(10, 2)
y = np.array([0, 1] * 5)
net = Sequential(Linear(2, 2))
opt = SGD(net.parameters(), lr=0.0)
h = train_epochs(net, opt, DataLoader(X, y, 4), 2)
full = cross_entropy(net(Tensor(X)), y).data
assert len(h) == 2 and abs(h[0] - full) < 1e-12 and abs(h[1] - full) < 1e-12, (h, full)` },
          { name: "learns", code: `np.random.seed(1)
X = np.random.randn(200, 2)
y = (X[:, 0] + X[:, 1] > 0).astype(int)
net = Sequential(Linear(2, 8), ReLU(), Linear(8, 2))
opt = SGD(net.parameters(), lr=0.1, momentum=0.9)
h = train_epochs(net, opt, DataLoader(X, y, 16, shuffle=True), 10)
assert h[-1] < h[0] and accuracy(net, X, y) > 0.95, (h, accuracy(net, X, y))
assert accuracy(net, X, 1 - y) < 0.05` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          A batch B of size b is a uniformly random subset of n examples. Prove that the batch gradient (1/b) Σ_{"{i ∈ B}"} gᵢ
          has expectation equal to the full gradient (1/n) Σᵢ gᵢ.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Rewrites the batch gradient as (1/b) Σᵢ 1[i ∈ B] gᵢ over all n examples.",
          "Shows P(i ∈ B) = b/n for every i (by symmetry, or by counting C(n−1, b−1)/C(n, b)).",
          "Uses linearity of expectation to get (1/b) Σᵢ (b/n) gᵢ = (1/n) Σᵢ gᵢ.",
        ],
      },
    },
    {
      key: "variance",
      rung: "stretch",
      prompt: <p>Per-example gradients have variance 4 around the full gradient. Sampling 16 examples with replacement, what is the variance of the batch-mean gradient?</p>,
      answer: { kind: "numeric", value: 0.25 },
    },
  ],

  teachBack:
    "Explain to a friend what a data loader does each epoch, why a mini-batch gradient is an unbiased estimate of the full gradient, and how batch size trades noise against cost.",

  glimpse: (
    <p>
      Every Linear so far started with weights scaled by 1/√nin, without saying why. Next: initialisation, and what happens to
      activations and gradients in a deep network when that scale is wrong.
    </p>
  ),
};
