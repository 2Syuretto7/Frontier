import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OptimiserPathViz } from "@/components/viz/OptimiserPathViz";
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
`;

const SGD = `class SGD:
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

const ADAM = `class Adam:
    def __init__(self, params, lr=0.001, betas=(0.9, 0.999), eps=1e-8):
        self.params, self.lr, self.eps = list(params), lr, eps
        self.b1, self.b2 = betas
        self.m = [np.zeros_like(p.data) for p in self.params]
        self.s = [np.zeros_like(p.data) for p in self.params]
        self.t = 0

    def zero_grad(self):
        for p in self.params:
            p.grad = np.zeros_like(p.data)

    def step(self):
        self.t += 1
        for p, m, s in zip(self.params, self.m, self.s):
            m *= self.b1
            m += (1 - self.b1) * p.grad
            s *= self.b2
            s += (1 - self.b2) * p.grad ** 2
            m_hat = m / (1 - self.b1 ** self.t)
            s_hat = s / (1 - self.b2 ** self.t)
            p.data -= self.lr * m_hat / (np.sqrt(s_hat) + self.eps)
`;

const TRAIN = `def fit(net, X, y, opt, steps):
    for _ in range(steps):
        loss = cross_entropy(net(Tensor(X)), y)
        opt.zero_grad()
        loss.backward()
        opt.step()
    return loss.data`;

export const lesson: LessonContent = {
  id: "e5.3.2",
  minutes: 55,
  links: {
    requires: ["e5.3.1", "l1.2.4"],
    revisits: ["e5.1.3", "m5.5.2"],
    foreshadows: ["e5.3.4", "e5.4.2"],
  },

  puzzle: (
    <>
      <p>
        Plain gradient descent uses one learning rate for every parameter and forgets each gradient as soon as it is used. On
        a loss that is steep in one direction and flat in another, that is a bad trade: a rate small enough for the steep
        direction is far too small for the flat one. What should an optimiser remember between steps, and where should that
        memory live?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An optimiser is an object that holds the list of parameters and, for each one, some state of the same shape.
        Momentum keeps a running sum of past gradients, a velocity, so that steps that keep agreeing add up and steps that
        keep flipping cancel. Adam keeps two running averages, of the gradient and of its square, and divides one by the
        square root of the other, so each coordinate gets a step of roughly the learning rate whatever its gradient&rsquo;s
        scale.
      </p>
      <OptimiserPathViz />
    </>
  ),

  theory: (
    <>
      <Definition title="SGD with momentum">
        <p>
          With velocity v (zero at the start), each step does v ← μv + g and then p ← p − lr·v. With μ = 0 this is plain
          gradient descent. The update is the one PyTorch&rsquo;s <C>torch.optim.SGD</C> uses.
        </p>
        <Code>{SGD}</Code>
      </Definition>

      <Definition title="Adam">
        <p>
          With m and s zero at the start and t counting steps: m ← β₁m + (1 − β₁)g, s ← β₂s + (1 − β₂)g², m̂ = m / (1 − β₁ᵗ), ŝ
          = s / (1 − β₂ᵗ), and p ← p − lr·m̂ / (√ŝ + ε). The defaults are β₁ = 0.9, β₂ = 0.999, ε = 10⁻⁸.
        </p>
        <Code>{ADAM}</Code>
      </Definition>

      <Theorem title="bias correction">
        <p>
          If every gradient equals the same g, then after t steps m = (1 − β₁ᵗ)g exactly, so m̂ = g. The same holds for s and
          g².
        </p>
      </Theorem>
      <Proof>
        <p>
          Unrolling the recursion from m = 0 gives m = (1 − β₁)(g + β₁g + … + β₁ᵗ⁻¹g) = (1 − β₁)·(1 − β₁ᵗ)/(1 − β₁)·g = (1 −
          β₁ᵗ)g, by the geometric sum. Dividing by 1 − β₁ᵗ gives g. Without the correction, the first steps would use an m
          shrunk towards its zero start, by a factor 1 − β₁ = 0.1 at t = 1.
        </p>
      </Proof>

      <Example title="the loop, once and for all">
        <Code>{TRAIN}</Code>
        <p>
          The training loop now names no layer and no update rule. Swapping <C>SGD(net.parameters(), 0.1)</C> for{" "}
          <C>Adam(net.parameters(), 0.01)</C> changes one line.
        </p>
      </Example>

      <Remark title="state is updated in place">
        <p>
          <C>v *= self.mu</C> changes the array stored in <C>self.v</C>. Writing <C>v = self.mu * v + p.grad</C> instead
          would bind the loop variable to a new array and leave the stored state at zero, a silent bug that turns momentum
          back into plain SGD.
        </p>
      </Remark>

      <Remark title="memory">
        <p>
          Momentum stores one extra array per parameter and Adam two. For a model with N parameters, Adam&rsquo;s state alone
          is 2N numbers, which is why optimiser state is a large share of the memory of training a big model.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "momentum",
      rung: "check",
      prompt: <p>Which update is SGD with momentum μ, as written in this lesson?</p>,
      answer: {
        kind: "choice",
        options: ["v ← μv + g, then p ← p − lr·v", "p ← p − lr·g − μ", "v ← μg, then p ← p − lr·v", "p ← μp − lr·g"],
        correct: [0],
      },
    },
    {
      key: "first",
      rung: "check",
      prompt: <p>Without bias correction, β₁ = 0.9 and a first gradient g = 5, what is m after the first step?</p>,
      answer: { kind: "numeric", value: 0.5 },
    },
    {
      key: "adamstep",
      rung: "apply",
      prompt: <p>Adam with lr = 0.01 and bias correction takes its first step on a parameter whose gradient is 250. Ignoring ε, how far does the parameter move?</p>,
      answer: { kind: "numeric", value: 0.01 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${ENGINE}
${SGD}
p = Tensor(0.0)
opt = SGD([p], lr=0.1, momentum=0.9)
for _ in range(3):
    p.grad = np.array(1.0)
    opt.step()
print(round(float(p.data), 4))`}</Code>
          <p>A constant gradient of 1 for three steps. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["-0.561", "-0.3", "-0.271", "-0.6"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${ENGINE}
${ADAM}
a, b = Tensor(0.0), Tensor(0.0)
opt = Adam([a, b], lr=0.1)
a.grad, b.grad = np.array(1000.0), np.array(0.001)
opt.step()
print(round(float(a.data), 4), round(float(b.data), 4))`}</Code>
          <p>Two parameters with gradients a million times apart. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["-0.1 -0.1", "-100.0 -0.0001", "-0.01 -0.01", "-0.1 -0.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          The engine, Module, Linear, ReLU and Sequential are already defined. Write <C>SGD(params, lr, momentum=0.0)</C> with{" "}
          <C>zero_grad()</C> and <C>step()</C>, keeping one velocity array per parameter and updating it in place.
        </p>
      ),
      answer: {
        kind: "code",
        setup: ENGINE,
        starter: `# Tensor, cross_entropy, Module, Linear, ReLU and Sequential are already defined.

class SGD:
    def __init__(self, params, lr, momentum=0.0):
        self.params, self.lr = list(params), lr

    def zero_grad(self):
        pass

    def step(self):
        pass
`,
        solution: SGD,
        tests: [
          { name: "momentum arithmetic", code: `p = Tensor([0.0, 0.0])
opt = SGD([p], lr=0.1, momentum=0.9)
for g in ([1.0, -1.0], [1.0, 1.0]):
    opt.zero_grad()
    assert np.all(p.grad == 0)
    p.grad = p.grad + np.array(g)
    opt.step()
assert np.allclose(p.data, [-0.29, 0.09]), p.data` },
          { name: "trains a network", code: `np.random.seed(0)
X = np.random.randn(64, 2)
y = (X[:, 0] * X[:, 1] > 0).astype(int)
net = Sequential(Linear(2, 16), ReLU(), Linear(16, 2))
opt = SGD(net.parameters(), lr=0.2, momentum=0.9)
first = cross_entropy(net(Tensor(X)), y).data
for _ in range(150):
    loss = cross_entropy(net(Tensor(X)), y)
    opt.zero_grad()
    loss.backward()
    opt.step()
assert loss.data < 0.3 * first, (first, loss.data)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>Adam(params, lr=0.001, betas=(0.9, 0.999), eps=1e-8)</C> with <C>zero_grad()</C> and <C>step()</C>, with
          bias correction and a step counter shared by all parameters.
        </p>
      ),
      answer: {
        kind: "code",
        setup: ENGINE,
        starter: `# Tensor, cross_entropy, Module, Linear, ReLU and Sequential are already defined.

class Adam:
    def __init__(self, params, lr=0.001, betas=(0.9, 0.999), eps=1e-8):
        self.params, self.lr = list(params), lr

    def zero_grad(self):
        pass

    def step(self):
        pass
`,
        solution: ADAM,
        tests: [
          { name: "matches the formulas", code: `p = Tensor([1.0, -2.0])
opt = Adam([p], lr=0.01)
grads = [np.array([3.0, -0.5]), np.array([1.0, 0.25]), np.array([-2.0, 4.0])]
q, m, s = np.array([1.0, -2.0]), np.zeros(2), np.zeros(2)
for t, g in enumerate(grads, 1):
    opt.zero_grad()
    p.grad = p.grad + g
    opt.step()
    m = 0.9 * m + 0.1 * g
    s = 0.999 * s + 0.001 * g * g
    q = q - 0.01 * (m / (1 - 0.9 ** t)) / (np.sqrt(s / (1 - 0.999 ** t)) + 1e-8)
assert np.allclose(p.data, q, rtol=0, atol=1e-12), (p.data, q)` },
          { name: "trains a network", code: `np.random.seed(1)
X = np.random.randn(64, 2)
y = (X[:, 0] * X[:, 1] > 0).astype(int)
net = Sequential(Linear(2, 16), ReLU(), Linear(16, 2))
opt = Adam(net.parameters(), lr=0.03)
first = cross_entropy(net(Tensor(X)), y).data
for _ in range(150):
    loss = cross_entropy(net(Tensor(X)), y)
    opt.zero_grad()
    loss.backward()
    opt.step()
assert loss.data < 0.3 * first, (first, loss.data)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          In Adam, m starts at 0 and m ← β₁m + (1 − β₁)g. Prove that if every gradient equals the same g, then after t steps
          m = (1 − β₁ᵗ)g, and explain what bias correction does with this.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Unrolls the recursion (or uses induction): m_t = (1 − β₁) Σ_{k=0}^{t−1} β₁ᵏ g.",
          "Evaluates the geometric sum to get m_t = (1 − β₁ᵗ) g (an induction step m_{t+1} = β₁(1 − β₁ᵗ)g + (1 − β₁)g = (1 − β₁ᵗ⁺¹)g also counts).",
          "Explains that dividing by 1 − β₁ᵗ removes the shrinkage towards the zero initial value, so m̂ = g, which matters most in early steps.",
        ],
      },
    },
    {
      key: "memory",
      rung: "stretch",
      prompt: <p>A model has 10⁹ parameters stored in float32 (4 bytes each). How many gigabytes (10⁹ bytes) does Adam&rsquo;s m and s state need, if stored in float32 too?</p>,
      answer: { kind: "numeric", value: 8 },
    },
  ],

  teachBack:
    "Explain to a friend what state SGD with momentum and Adam keep for each parameter, what bias correction fixes, and why the training loop no longer needs to know the update rule.",

  glimpse: (
    <p>
      Training so far has used the whole dataset at every step. Next: data loaders, which shuffle the examples and hand them
      out in mini-batches, and what that does to the gradient.
    </p>
  ),
};
