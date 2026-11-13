import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BackwardOrderViz } from "@/components/viz/BackwardOrderViz";
import type { LessonContent } from "@/lib/types";

const VALUE = `class Value:
    def __init__(self, data, _prev=(), _op=""):
        self.data = data
        self.grad = 0.0
        self._prev = set(_prev)
        self._op = _op
        self._backward = lambda: None

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data + other.data, (self, other), "+")
        def _backward():
            self.grad += out.grad
            other.grad += out.grad
        out._backward = _backward
        return out

    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data * other.data, (self, other), "*")
        def _backward():
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad
        out._backward = _backward
        return out

    __radd__ = __add__
    __rmul__ = __mul__
`;

const BACKWARD = `    def backward(self):
        topo, seen = [], set()
        def build(v):
            if v not in seen:
                seen.add(v)
                for p in v._prev:
                    build(p)
                topo.append(v)
        build(self)
        self.grad = 1.0
        for v in reversed(topo):
            v._backward()`;

export const lesson: LessonContent = {
  id: "e5.1.2",
  minutes: 55,
  links: {
    requires: ["e5.1.1", "e2.6.2"],
    revisits: ["m5.3.3", "m4.3.4"],
    foreshadows: ["e5.1.3", "e5.2.1"],
  },

  puzzle: (
    <>
      <p>
        Every Value now knows how to pass its gradient to its inputs. But a node may only do so once its own gradient is
        final, after every node that uses it has passed its share back.
      </p>
      <p>In what order should the closures run, and how can a program find that order in a graph it has never seen?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        A topological order lists every node after all of its inputs. Reversed, it lists every node after all of the nodes
        that use it, which is exactly the condition for its gradient to be complete. A depth-first search produces such an
        order in one pass.
      </p>
      <BackwardOrderViz />
      <p>
        Breadth-first order looks plausible and is wrong: it can process a node that is used both directly by the output and
        further down, before the further-down contribution arrives.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="backward()">
        <p>
          Collect the nodes reachable from the output in post-order (each node appended after all its inputs), set the
          output&rsquo;s grad to 1, and call <C>_backward</C> on the nodes in reverse.
        </p>
        <Code>{BACKWARD}</Code>
      </Definition>

      <Theorem title="reverse topological order is correct">
        <p>
          If every node&rsquo;s <C>_backward</C> runs after those of all nodes that have it in their <C>_prev</C>, then at the
          end every <C>grad</C> equals the derivative of the output with respect to that node.
        </p>
      </Theorem>
      <Proof>
        <p>
          The post-order puts each node after its inputs, so in reverse each node comes before its inputs, that is, after every
          node that uses it. When node v runs, all its consumers have already added their contributions, so{" "}
          <C>v.grad</C> is the full sum over consumers of (consumer&rsquo;s grad × local derivative), which is the reverse-mode
          recursion of the previous course. By induction along the order, every grad passed on is complete.
        </p>
      </Proof>

      <Example title="gradients accumulate across calls">
        <Code>{`x = Value(3.0)
y = x * x
y.backward(); print(x.grad)   # 6.0
y.backward(); print(x.grad)   # 18.0, not 6.0`}</Code>
        <p>
          The second call starts by setting <C>y.grad = 1</C>, but <C>x.grad</C> still holds 6 and the closures add to it, and
          the intermediate grads were not reset either. Training loops therefore zero every gradient before each backward pass:
          PyTorch&rsquo;s <C>optimizer.zero_grad()</C>.
        </p>
      </Example>

      <Remark title="recursion depth">
        <p>
          The recursive <C>build</C> calls itself once per level of the graph. Python&rsquo;s default recursion limit is about
          1000, so a chain of a few thousand operations, such as an unrolled recurrent network, crashes it. An explicit stack
          avoids the limit; the first coding exercise asks for one.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "order",
      rung: "check",
      prompt: <p>In which order must the <C>_backward</C> closures run?</p>,
      answer: {
        kind: "choice",
        options: [
          "Reverse topological order: each node after every node that uses it",
          "The order the Values were created",
          "Breadth-first from the output",
          "Any order",
        ],
        correct: [0],
      },
    },
    {
      key: "seed",
      rung: "check",
      prompt: <p>What does <C>backward()</C> set the output&rsquo;s own grad to before running the closures?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "b",
      rung: "apply",
      prompt: (
        <p>
          With a = 2, b = −3, c = a·b, d = c + a, e = d·c, what is b.grad after <C>e.backward()</C>?
        </p>
      ),
      answer: { kind: "numeric", value: -20 },
    },
    {
      key: "twice",
      rung: "apply",
      prompt: <p>What happens to the leaves&rsquo; grads if <C>backward()</C> is called twice on the same graph without resetting?</p>,
      answer: {
        kind: "choice",
        options: [
          "They accumulate, and are no longer the derivatives of one pass",
          "They are recomputed from scratch and stay correct",
          "They become 0",
          "Python raises an error",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`class N:
    def __init__(self, name, *prev):
        self.name, self._prev = name, list(prev)

a, b = N("a"), N("b")
c = N("c", a, b)
d = N("d", c, a)
e = N("e", d, c)
topo, seen = [], set()
def build(v):
    if v not in seen:
        seen.add(v)
        for p in v._prev:
            build(p)
        topo.append(v)
build(e)
print(" ".join(v.name for v in topo), "|", " ".join(v.name for v in reversed(topo)))`}</Code>
          <p>A post-order depth-first search. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["a b c d e | e d c b a", "e d c b a | a b c d e", "a b c a d c e | e c d a c b a", "c d e a b | b a e d c"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${VALUE}
${BACKWARD}

x = Value(3.0)
y = x * x + x
y.backward()
first = x.grad
y.backward()
print(first, x.grad)`}</Code>
          <p>Calling backward twice. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["7.0 20.0", "7.0 14.0", "7.0 7.0", "6.0 12.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          With the lesson&rsquo;s <C>Value</C> already defined (without <C>backward</C>), write <C>topo_order(root)</C>, which
          returns the post-order list using an explicit stack, no recursion, so that chains of thousands of nodes work; and{" "}
          <C>backward(root)</C>, which seeds <C>root.grad = 1.0</C> and runs the closures in reverse order.
        </p>
      ),
      answer: {
        kind: "code",
        setup: VALUE,
        starter: `# Value is already defined.

def topo_order(root):
    return [root]

def backward(root):
    root.grad = 1.0
    root._backward()
`,
        solution: `def topo_order(root):
    topo, seen = [], set()
    stack = [(root, False)]
    while stack:
        v, expanded = stack.pop()
        if expanded:
            topo.append(v)
        elif v not in seen:
            seen.add(v)
            stack.append((v, True))
            for p in v._prev:
                if p not in seen:
                    stack.append((p, False))
    return topo

def backward(root):
    root.grad = 1.0
    for v in reversed(topo_order(root)):
        v._backward()
`,
        tests: [
          { name: "correct gradients", code: `a, b = Value(2.0), Value(-3.0)
c = a * b
d = c + a
e = d * c
backward(e)
assert (a.grad, b.grad, c.grad, d.grad) == (24.0, -20.0, -10.0, -6.0), (a.grad, b.grad, c.grad, d.grad)
order = topo_order(e)
pos = {v: i for i, v in enumerate(order)}
assert len(order) == 5 and all(pos[p] < pos[v] for v in order for p in v._prev)` },
          { name: "a deep chain", code: `x = Value(1.0)
y = x
for _ in range(5000):
    y = y * 1.0 + 0.0
backward(y)
assert x.grad == 1.0, 'Use an explicit stack: recursion fails at this depth.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With <C>Value</C> (including a working <C>backward()</C> method) already defined, write <C>grad_of(f, xs)</C>: wrap each
          float in xs in a Value, compute <C>out = f(*values)</C>, run <C>out.backward()</C>, and return the pair (out.data,
          list of the inputs&rsquo; grads). Calling it twice must give the same answer, because each call builds fresh Values.
        </p>
      ),
      answer: {
        kind: "code",
        setup: VALUE.replace("    __radd__ = __add__\n    __rmul__ = __mul__\n", `    __radd__ = __add__\n    __rmul__ = __mul__\n\n${BACKWARD}\n`),
        starter: `# Value, with backward(), is already defined.

def grad_of(f, xs):
    return 0.0, [0.0 for _ in xs]
`,
        solution: `def grad_of(f, xs):
    vals = [Value(float(x)) for x in xs]
    out = f(*vals)
    out.backward()
    return out.data, [v.grad for v in vals]
`,
        tests: [
          { name: "polynomial", code: `val, g = grad_of(lambda x, y: x * x * y + 3 * y, [2.0, 5.0])
assert val == 35.0 and g == [20.0, 7.0], (val, g)` },
          { name: "fresh each call", code: `f = lambda a, b: a * b + a
assert grad_of(f, [2, -3]) == grad_of(f, [2, -3]) == (-4.0, [-2.0, 2.0])` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Explain why running the closures in reverse post-order guarantees that, when a node&rsquo;s <C>_backward</C> runs,
          its <C>grad</C> already includes the contribution from every node that uses it.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that post-order DFS appends a node only after all nodes in its _prev, so every input precedes its consumer.",
          "Reverses this: every consumer precedes its inputs, so all consumers of v run before v.",
          "Concludes each consumer has already added its contribution to v.grad, so v.grad is complete when v runs (by induction, the consumers' own grads were complete too).",
        ],
      },
    },
    {
      key: "limit",
      rung: "stretch",
      prompt: <p>What is CPython&rsquo;s default recursion limit, as returned by <C>sys.getrecursionlimit()</C>?</p>,
      answer: { kind: "numeric", value: 1000 },
    },
  ],

  teachBack:
    "Explain to a friend why backward() must run the closures in reverse topological order, how a depth-first search finds that order, and why gradients must be zeroed between passes.",

  glimpse: (
    <p>
      With a working backward pass, a neuron is a few lines: a weighted sum and a tanh. Next, neurons, layers, a small MLP, and
      its first training loop.
    </p>
  ),
};
