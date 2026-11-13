import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { InitScaleViz } from "@/components/viz/InitScaleViz";
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

const INIT = `def he_init(nin, nout, rng):
    return rng.normal(0.0, np.sqrt(2.0 / nin), size=(nin, nout))

def xavier_init(nin, nout, rng):
    bound = np.sqrt(6.0 / (nin + nout))
    return rng.uniform(-bound, bound, size=(nin, nout))

def activation_stds(Ws, x):
    stds = []
    for W in Ws:
        x = np.maximum(x @ W, 0)
        stds.append(float(x.std()))
    return stds
`;

const REINIT = `GAINS = {"linear": 1.0, "relu": np.sqrt(2.0), "tanh": 5.0 / 3.0}

def fan_in_std(nin, nonlinearity):
    return GAINS[nonlinearity] / np.sqrt(nin)

def reinit(net, nonlinearity, seed):
    rng = np.random.default_rng(seed)
    for layer in net.layers:
        if isinstance(layer, Linear):
            nin, nout = layer.W.data.shape
            layer.W.data = rng.normal(0.0, fan_in_std(nin, nonlinearity), size=(nin, nout))
            layer.b.data = np.zeros(nout)
`;

export const lesson: LessonContent = {
  id: "e5.3.4",
  minutes: 50,
  links: {
    requires: ["e5.3.3", "m4.6.3"],
    revisits: ["e5.3.1", "e5.1.3"],
    foreshadows: ["e5.4.1", "e5.4.3"],
  },

  puzzle: (
    <>
      <p>
        Every Linear so far drew its weights as randn(nin, nout) / √nin. Why that scale? Draw them with standard deviation
        0.01 instead, a common guess, and a 20-layer network outputs numbers around 10⁻¹⁹. Draw them with standard deviation
        1 and it outputs numbers around 10¹⁵. What is the right scale, and why does it depend on the activation function?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each output of a layer adds up nin products wᵢxᵢ. With independent, zero-mean weights, the variances add, so the
        output&rsquo;s variance is nin times Var(w) times the input&rsquo;s second moment. Unless nin·Var(w) is just right, the
        scale is multiplied by the same wrong factor at every layer, and depth turns a modest factor into an astronomical one.
      </p>
      <InitScaleViz />
      <p>ReLU zeroes about half of its inputs, halving the second moment, so it needs twice the variance a linear layer needs.</p>
    </>
  ),

  theory: (
    <>
      <Theorem title="variance through a layer">
        <p>
          Let y = Σᵢ wᵢxᵢ over nin inputs, with the wᵢ independent of each other and of the xᵢ, each with mean 0 and variance
          σ². Then E[y] = 0 and Var(y) = nin·σ²·E[x²], where E[x²] is the mean of the inputs&rsquo; second moments. If y is
          symmetric about 0, then E[relu(y)²] = Var(y)/2.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each term has E[wᵢxᵢ] = E[wᵢ]E[xᵢ] = 0, and distinct terms are uncorrelated because E[wᵢxᵢwⱼxⱼ] = E[wᵢ]E[wⱼxᵢxⱼ] = 0
          for i ≠ j. So Var(y) = Σᵢ E[wᵢ²xᵢ²] = Σᵢ σ²E[xᵢ²] = nin·σ²·E[x²]. For symmetric y, relu(y)² equals y² on the half
          where y &gt; 0 and 0 on the other half, so E[relu(y)²] = E[y²]/2 = Var(y)/2.
        </p>
      </Proof>

      <Definition title="He and Xavier initialisation">
        <p>
          Combining the two facts, a ReLU layer keeps E[x²] unchanged when nin·σ²/2 = 1, that is σ² = 2/nin: He (or Kaiming)
          initialisation. For tanh, which is close to linear near 0, σ² = 1/nin keeps the scale; Xavier (Glorot)
          initialisation uses 2/(nin + nout) to balance the forward and backward passes, often as a uniform distribution on
          [−a, a] with a = √(6/(nin + nout)).
        </p>
        <Code>{INIT}</Code>
      </Definition>

      <Example title="the same argument for gradients">
        <p>
          In the backward pass, a layer multiplies the incoming gradient by Wᵀ, a sum over nout terms. The same calculation
          gives a factor nout·σ² per layer (times 1/2 for ReLU). Xavier&rsquo;s 2/(nin + nout) is a compromise between keeping
          the forward and the backward scale fixed; when nin = nout the two agree.
        </p>
      </Example>

      <Remark title="gains">
        <p>
          Frameworks write the scale as gain/√nin, with gain √2 for ReLU, 1 for linear layers and 5/3 for tanh, the values
          used by <C>torch.nn.init.calculate_gain</C>. Biases start at zero.
        </p>
        <Code>{REINIT}</Code>
      </Remark>

      <Remark title="what normalisation changes">
        <p>
          Later architectures add normalisation layers and residual connections, which rescale activations as they go and make
          networks far less sensitive to the initial scale. They reduce the problem; they do not remove it, and the very first
          steps of training still depend on a sensible start.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "he",
      rung: "check",
      prompt: <p>He initialisation for a ReLU layer with nin = 512. What is the standard deviation of the weights?</p>,
      answer: { kind: "numeric", value: 0.0625 },
    },
    {
      key: "var",
      rung: "check",
      prompt: <p>y = Σᵢ wᵢxᵢ over n inputs, with independent zero-mean weights of variance σ², independent of the inputs. What is Var(y)?</p>,
      answer: { kind: "choice", options: ["n·σ²·E[x²]", "σ²·E[x²]", "n²·σ²·E[x²]", "σ²·E[x²] / n"], correct: [0] },
    },
    {
      key: "explode",
      rung: "apply",
      prompt: <p>A 10-layer ReLU network of width 100 has weights of standard deviation 1. By roughly what factor does the activation scale change per layer?</p>,
      answer: {
        kind: "choice",
        options: ["Grows by about √50 ≈ 7", "Shrinks by about √2", "Stays about the same", "Grows by about 100"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def activation_stds(Ws, x):
    stds = []
    for W in Ws:
        x = np.maximum(x @ W, 0)
        stds.append(float(x.std()))
    return stds

rng = np.random.default_rng(0)
x = rng.normal(size=(256, 256))
out = []
for std in (0.01, np.sqrt(2 / 256), 1.0):
    Ws = [rng.normal(0, std, size=(256, 256)) for _ in range(30)]
    s = activation_stds(Ws, x)[-1]
    out.append(s)
print(out[0] < 1e-20, round(out[1], 1), out[2] > 1e20)`}</Code>
          <p>Thirty ReLU layers of width 256 with three weight scales. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True 0.7 True", "False 0.7 False", "True 1.0 True", "True 0.7 False"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

rng = np.random.default_rng(1)
x = rng.normal(size=(500, 100))
sat = []
for std in (1.0, 1 / np.sqrt(100)):
    h = x
    for _ in range(5):
        h = np.tanh(h @ rng.normal(0, std, size=(100, 100)))
    sat.append(round(float((np.abs(h) > 0.99).mean()), 2))
print(*sat)`}</Code>
          <p>Five tanh layers, and the fraction of outputs saturated near ±1. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.78 0.0", "0.0 0.78", "0.78 0.78", "0.0 0.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>he_init(nin, nout, rng)</C> (normal, variance 2/nin), <C>xavier_init(nin, nout, rng)</C> (uniform on [−a,
          a] with a = √(6/(nin + nout))), and <C>activation_stds(Ws, x)</C>, which applies x ← relu(x @ W) for each W in turn
          and returns the list of the activations&rsquo; standard deviations as floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def he_init(nin, nout, rng):
    return rng.normal(size=(nin, nout))

def xavier_init(nin, nout, rng):
    return rng.normal(size=(nin, nout))

def activation_stds(Ws, x):
    return []
`,
        solution: `import numpy as np

${INIT}`,
        tests: [
          { name: "distributions", code: `rng = np.random.default_rng(0)
W = he_init(800, 400, rng)
assert W.shape == (800, 400) and abs(W.std() - np.sqrt(2 / 800)) < 0.002 and abs(W.mean()) < 0.002
V = xavier_init(300, 300, rng)
assert V.shape == (300, 300) and np.abs(V).max() <= 0.1 and np.abs(V).max() > 0.099` },
          { name: "He keeps the scale", code: `rng = np.random.default_rng(1)
x = rng.normal(size=(128, 256))
s = activation_stds([he_init(256, 256, rng) for _ in range(20)], x)
assert len(s) == 20 and all(isinstance(v, float) for v in s)
assert all(0.3 < v < 2.0 for v in s), s
t = activation_stds([xavier_init(256, 256, rng) for _ in range(20)], x)
assert t[-1] < 0.01, 'Xavier is too small for ReLU: the scale should shrink.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With the engine and modules defined, write <C>fan_in_std(nin, nonlinearity)</C> returning gain/√nin with gains 1,
          √2 and 5/3 for "linear", "relu" and "tanh", and <C>reinit(net, nonlinearity, seed)</C>, which redraws the weights of
          every Linear in a Sequential from a normal distribution with that standard deviation (using one{" "}
          <C>np.random.default_rng(seed)</C>) and sets the biases to zero.
        </p>
      ),
      answer: {
        kind: "code",
        setup: ENGINE,
        starter: `# Tensor, Module, Linear, ReLU and Sequential are already defined.

def fan_in_std(nin, nonlinearity):
    return 1.0

def reinit(net, nonlinearity, seed):
    pass
`,
        solution: REINIT,
        tests: [
          { name: "gains", code: `assert abs(fan_in_std(100, "relu") - np.sqrt(2) / 10) < 1e-12
assert abs(fan_in_std(25, "tanh") - 1 / 3) < 1e-12 and fan_in_std(4, "linear") == 0.5` },
          { name: "reinitialises every Linear", code: `net = Sequential(Linear(400, 300), ReLU(), Linear(300, 10))
for p in net.parameters():
    p.data = p.data + 5.0
reinit(net, "relu", 0)
W1, b1, W2, b2 = [p.data for p in net.parameters()]
assert W1.shape == (400, 300) and W2.shape == (300, 10)
assert np.all(b1 == 0) and np.all(b2 == 0)
assert abs(W1.std() - np.sqrt(2 / 400)) < 0.002 and abs(W2.std() - np.sqrt(2 / 300)) < 0.01
reinit(net, "relu", 0)
assert np.array_equal(net.parameters()[0].data, W1), 'Use the seed so reinit is repeatable.'` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          A ReLU layer computes y = W x and then relu(y), with independent zero-mean weights of variance σ² and nin inputs.
          Show that the second moment of the activations is preserved from layer to layer exactly when σ² = 2/nin.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows Var(yⱼ) = nin·σ²·E[x²] using independence and zero mean (cross terms vanish).",
          "Shows E[relu(y)²] = Var(y)/2 using that y is symmetric about 0.",
          "Combines them: the new second moment is nin·σ²·E[x²]/2, which equals E[x²] iff σ² = 2/nin.",
        ],
      },
    },
    {
      key: "bound",
      rung: "stretch",
      prompt: <p>Xavier uniform initialisation for a layer with nin = nout = 300 draws from [−a, a]. What is a?</p>,
      answer: { kind: "numeric", value: 0.1 },
    },
  ],

  teachBack:
    "Explain to a friend why the scale of the initial weights matters more as networks get deeper, where the 2 in He initialisation comes from, and when Xavier is the right choice instead.",

  glimpse: (
    <p>
      The framework can now build, initialise and train networks. How do we know its gradients are right? Next: gradient
      checking with finite differences, and how to read its results.
    </p>
  ),
};
