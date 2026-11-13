import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ModuleTreeViz } from "@/components/viz/ModuleTreeViz";
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

const MOD = `class Module:
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
`;

const MOD2 = `class ReLU(Module):
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

export const lesson: LessonContent = {
  id: "e5.3.1",
  minutes: 50,
  links: {
    requires: ["e5.2.4", "e1.3.3"],
    revisits: ["e5.1.3", "e5.1.2"],
    foreshadows: ["e5.3.2", "e5.3.4"],
  },

  puzzle: (
    <>
      <p>
        In the scalar MLP every class wrote its own <C>parameters()</C> by hand, listing its weights and asking its children.
        A real network has dozens of kinds of layer, nested inside each other. How can one base class find every parameter of
        any model, without each layer listing them?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Python can list an object&rsquo;s attributes with <C>vars(obj)</C>. A Module base class can walk them: every Tensor
        it finds is a parameter, every Module it finds is searched in turn, and lists are searched entry by entry. A new
        layer then only stores its tensors as attributes and writes <C>forward</C>; finding parameters, zeroing gradients and
        calling the layer come from the base class.
      </p>
      <ModuleTreeViz />
      <p>
        This is the design of PyTorch&rsquo;s <C>nn.Module</C>, which registers parameters and submodules as they are
        assigned, for the same purpose.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="Module and Linear">
        <p>
          <C>parameters()</C> walks the attributes recursively, with a set of ids so that a tensor reachable twice is listed
          once. <C>zero_grad()</C> resets every parameter&rsquo;s grad, and <C>__call__</C> forwards to <C>forward</C>, so a
          module is called like a function. Linear stores its weight and bias as attributes and does nothing else.
        </p>
        <Code>{MOD}</Code>
      </Definition>

      <Definition title="ReLU and Sequential">
        <p>
          A module need not have parameters: ReLU only has a forward. Sequential keeps a list of modules, and since
          <C>parameters()</C> searches lists, it finds the parameters of all of them.
        </p>
        <Code>{MOD2}</Code>
      </Definition>

      <Theorem title="each parameter exactly once">
        <p>
          If the modules form no cycle, <C>parameters()</C> terminates and returns every Tensor reachable through attributes,
          lists and submodules, each exactly once.
        </p>
      </Theorem>
      <Proof>
        <p>
          Every recursive call descends one step into an attribute, a list entry or a submodule. With no cycles, each path
          down is finite, so the recursion ends. Any reachable Tensor lies at the end of some such path and is visited; the
          first visit appends it and records its id, and every later visit finds the id in the set and skips it.
        </p>
      </Proof>

      <Example title="a training step with modules">
        <Code>{`net = Sequential(Linear(784, 128), ReLU(), Linear(128, 10))
loss = cross_entropy(net(x), y)
net.zero_grad()
loss.backward()
for p in net.parameters():
    p.data -= 0.1 * p.grad`}</Code>
        <p>The loop no longer knows anything about the architecture, which is what lets an optimiser be written once.</p>
      </Example>

      <Remark title="shared parameters">
        <p>
          The id set matters when one module is used in two places, as in weight tying, where a language model&rsquo;s input
          embedding and output layer share a matrix. Listing it twice would make the optimiser update it twice per step.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "count",
      rung: "check",
      prompt: <p>How many tensors does <C>Sequential(Linear(784, 128), ReLU(), Linear(128, 10)).parameters()</C> return?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "numbers",
      rung: "check",
      prompt: <p>How many numbers do the parameters of <C>Linear(784, 128)</C> hold in total?</p>,
      answer: { kind: "numeric", value: 100480 },
    },
    {
      key: "find",
      rung: "apply",
      prompt: <p>A new layer stores its weight in <C>self.W</C>. What must it do so that the base class&rsquo;s <C>parameters()</C> finds W?</p>,
      answer: {
        kind: "choice",
        options: [
          "Nothing: W is a Tensor attribute, so the walk over vars(self) finds it",
          "Override parameters() to return [self.W]",
          "Call a register function for W",
          "Store W in a global list",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${ENGINE}

${MOD}
${MOD2}
net = Sequential(Linear(3, 4), ReLU(), Linear(4, 1))
print(len(net.parameters()), count_params(net), [p.data.shape for p in net.parameters()])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4 21 [(3, 4), (4,), (4, 1), (1,)]",
          "5 21 [(3, 4), (4,), (4, 1), (1,)]",
          "4 19 [(3, 4), (4,), (4, 1), (1,)]",
          "4 21 [(4, 3), (4,), (1, 4), (1,)]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${ENGINE}

${MOD}
shared = Linear(2, 2)
shared.W.data = np.array([[1.0, 0.0], [0.0, 2.0]])

class Twice(Module):
    def __init__(self):
        self.first = shared
        self.second = shared

    def forward(self, x):
        return self.second(self.first(x))

t = Twice()
t(Tensor(np.ones((1, 2)))).sum().backward()
print(len(t.parameters()), shared.b.grad.tolist())`}</Code>
          <p>One Linear used twice. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["2 [2.0, 3.0]", "4 [2.0, 3.0]", "2 [1.0, 1.0]", "4 [1.0, 1.0]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          The Tensor engine (with <C>+</C>, <C>*</C>, <C>@</C>, <C>sum()</C>, <C>relu()</C> and <C>backward()</C>) is
          already defined. Write the base class <C>Module</C> with <C>parameters()</C> (recursive over attributes, lists and
          submodules, each Tensor once), <C>zero_grad()</C> and <C>__call__</C>, and <C>Linear(nin, nout)</C> with W of shape
          (nin, nout) drawn as <C>np.random.randn(nin, nout) / np.sqrt(nin)</C> and b zeros.
        </p>
      ),
      answer: {
        kind: "code",
        setup: ENGINE,
        starter: `# Tensor and cross_entropy are already defined.

class Module:
    def parameters(self):
        return []

class Linear(Module):
    def __init__(self, nin, nout):
        pass
`,
        solution: MOD,
        tests: [
          { name: "nested modules", code: `np.random.seed(0)
class Block(Module):
    def __init__(self):
        self.parts = [Linear(3, 4), Linear(4, 2)]
        self.scale = Tensor(np.ones(2))
    def forward(self, x):
        return self.parts[1](self.parts[0](x)) * self.scale
m = Block()
ps = m.parameters()
assert len(ps) == 5 and sorted(p.data.size for p in ps) == [2, 2, 4, 8, 12], [p.data.shape for p in ps]
y = m(Tensor(np.ones((2, 3)))).sum()
y.backward()
assert np.allclose(m.parts[1].b.grad, [2.0, 2.0])
m.zero_grad()
assert all(np.all(p.grad == 0) for p in ps)` },
          { name: "shared tensors once", code: `np.random.seed(1)
lin = Linear(2, 2)
class Tied(Module):
    def __init__(self):
        self.a = lin
        self.b = [lin, lin]
        self.W = lin.W
t = Tied()
assert len(t.parameters()) == 2
assert lin.W.data.shape == (2, 2) and np.all(lin.b.data == 0)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With Module and Linear defined, write <C>ReLU</C> (a module with no parameters), <C>Sequential(*layers)</C>, and{" "}
          <C>count_params(m)</C>, which returns the total number of numbers in m&rsquo;s parameters.
        </p>
      ),
      answer: {
        kind: "code",
        setup: `${ENGINE}

${MOD}`,
        starter: `# Tensor, cross_entropy, Module and Linear are already defined.

class ReLU(Module):
    pass

class Sequential(Module):
    pass

def count_params(m):
    return 0
`,
        solution: MOD2,
        tests: [
          { name: "the scalar MLP's shape", code: `np.random.seed(0)
net = Sequential(Linear(3, 4), ReLU(), Linear(4, 4), ReLU(), Linear(4, 1))
assert count_params(net) == 41 and len(net.parameters()) == 6
assert count_params(Sequential(Linear(784, 128), ReLU(), Linear(128, 10))) == 101770` },
          { name: "trains", code: `np.random.seed(2)
X = np.random.randn(64, 2)
y = (X[:, 0] * X[:, 1] > 0).astype(int)
net = Sequential(Linear(2, 16), ReLU(), Linear(16, 2))
first = None
for step in range(300):
    loss = cross_entropy(net(Tensor(X)), y)
    first = loss.data if first is None else first
    net.zero_grad()
    loss.backward()
    for p in net.parameters():
        p.data -= 0.5 * p.grad
assert loss.data < 0.5 * first, (first, loss.data)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Explain why <C>parameters()</C>, walking attributes, lists and submodules with a set of seen ids, terminates and
          lists every reachable Tensor exactly once, provided no module contains itself.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Argues termination: each recursive call goes one level down the containment structure, which has no cycles, so every path is finite.",
          "Argues completeness: every reachable Tensor is at the end of some path of attributes, list entries and submodules, so the walk visits it.",
          "Argues no duplicates: the first visit records the id and appends; any later visit sees the id and skips.",
        ],
      },
    },
    {
      key: "mlp",
      rung: "stretch",
      prompt: <p>How many numbers do the parameters of <C>Sequential(Linear(3, 4), ReLU(), Linear(4, 4), ReLU(), Linear(4, 1))</C> hold?</p>,
      answer: { kind: "numeric", value: 41 },
    },
  ],

  teachBack:
    "Explain to a friend how a Module base class finds every parameter of a nested model, why it keeps a set of ids, and what a new layer has to write.",

  glimpse: (
    <p>
      With parameters() in place, the update rule can leave the training loop. Next: optimisers as objects, from plain SGD to
      momentum and Adam, each holding its own state per parameter.
    </p>
  ),
};
