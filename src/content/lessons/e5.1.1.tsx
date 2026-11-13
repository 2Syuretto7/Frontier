import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ValueGraphBuildViz } from "@/components/viz/ValueGraphBuildViz";
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
`;

export const lesson: LessonContent = {
  id: "e5.1.1",
  minutes: 60,
  links: {
    requires: ["m5.3.3", "e1.3.3"],
    revisits: ["e1.3.2", "m5.3.1"],
    foreshadows: ["e5.1.2", "e5.2.1"],
  },

  puzzle: (
    <>
      <p>
        In PyTorch you write <C>loss = (w * x + b - y) ** 2</C>, call <C>loss.backward()</C>, and every parameter has a
        gradient. Nobody wrote a derivative. The arithmetic itself must have left a trail.
      </p>
      <p>What would a number need to remember, so that derivatives can be recovered after the arithmetic is done?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Wrap each number in an object. When two wrapped numbers are added or multiplied, the result remembers which objects
        produced it and how to send a gradient back to them. Ordinary-looking Python code then builds the computational graph of
        the previous course as a side effect.
      </p>
      <ValueGraphBuildViz />
      <p>
        This lesson builds the forward half: the <C>Value</C> class, its graph, and a closure per operation holding the local
        chain rule. The next lesson walks the graph backwards.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="a Value">
        <p>
          A <C>Value</C> holds a float <C>data</C>, a gradient <C>grad</C> (the adjoint ∂L/∂self, initially 0), the set{" "}
          <C>_prev</C> of Values it was computed from, a label <C>_op</C>, and a function <C>_backward</C> that, once{" "}
          <C>out.grad</C> is known, adds each input&rsquo;s share to that input&rsquo;s <C>grad</C>.
        </p>
        <Code>{VALUE}</Code>
      </Definition>

      <Remark title="three design decisions">
        <ul>
          <li>
            <strong>Closures.</strong> Each <C>_backward</C> is defined inside the operation, so it captures <C>self</C>,{" "}
            <C>other</C> and <C>out</C>: exactly the values the local derivative needs, saved from the forward pass. This is the
            memory that reverse mode costs.
          </li>
          <li>
            <strong>Accumulate with +=.</strong> A Value used twice, as in <C>a * b + a</C>, receives gradient along both
            paths, and the multivariable chain rule adds them. Assigning with = would keep only the last.
          </li>
          <li>
            <strong>Wrap plain numbers.</strong> <C>other if isinstance(other, Value) else Value(other)</C> lets{" "}
            <C>x * 2</C> work. For <C>2 * x</C>, Python tries <C>int.__mul__</C> first, fails, and then calls{" "}
            <C>x.__rmul__(2)</C>, so we add <C>__rmul__</C> and <C>__radd__</C> that delegate.
          </li>
        </ul>
      </Remark>

      <Example title="calling the closures by hand">
        <Code>{`a, b = Value(2.0), Value(-3.0)
c = a * b              # data -6.0
c.grad = 1.0           # pretend c is the loss
c._backward()
print(a.grad, b.grad)  # -3.0 2.0: dc/da = b, dc/db = a`}</Code>
        <p>
          For a deeper graph, each node&rsquo;s <C>_backward</C> must run after the <C>grad</C> of its output is complete. Getting
          that order right is the next lesson.
        </p>
      </Example>

      <Remark title="other operations">
        <p>
          Every operation follows the same pattern: compute <C>out</C>, then a closure applying the local derivative. For{" "}
          <C>tanh</C>, with t = tanh(x), the closure is <C>self.grad += (1 - t ** 2) * out.grad</C>; for a power{" "}
          <C>x ** n</C> with constant n, <C>self.grad += n * self.data ** (n - 1) * out.grad</C>. Subtraction and division can be
          built from these: a − b = a + (−1)·b, a / b = a · b<sup>−1</sup>.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "prev",
      rung: "check",
      prompt: <p>After <C>c = a * b</C>, what is <C>c._prev</C>?</p>,
      answer: { kind: "choice", options: ["{a, b}", "{c}", "An empty set", "[a.data, b.data]"], correct: [0] },
    },
    {
      key: "same",
      rung: "check",
      prompt: <p>After <C>e = d * d</C>, how many elements does <C>e._prev</C> have?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "data",
      rung: "apply",
      prompt: <p>With <C>a = Value(2.0)</C> and <C>b = Value(-3.0)</C>, what is <C>(a * b + a).data</C>?</p>,
      answer: { kind: "numeric", value: -4 },
    },
    {
      key: "plus",
      rung: "apply",
      prompt: <p>Why does <C>_backward</C> use <C>+=</C> rather than <C>=</C>?</p>,
      answer: {
        kind: "choice",
        options: [
          "A Value used in several places must receive the sum of the gradients from every use",
          "Because += is faster in Python",
          "So that grad stays at 0 for leaves",
          "Because floats are immutable",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${VALUE}
a, b = Value(2.0), Value(-3.0)
c = a * b
d = c + a
d.grad = 1.0
d._backward()
c._backward()
print(a.grad, b.grad, c.grad)`}</Code>
          <p>Calling two closures by hand, in the right order. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["-2.0 2.0 1.0", "-3.0 2.0 1.0", "1.0 2.0 1.0", "-2.0 2.0 0.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${VALUE}
a, b = Value(2.0), Value(-3.0)
c = a * b
d = c + a
d.grad = 1.0
c._backward()
d._backward()
print(a.grad, b.grad)`}</Code>
          <p>The same closures in the wrong order. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1.0 0.0", "-2.0 2.0", "-3.0 2.0", "0.0 0.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write the class <C>Value</C> from the lesson with <C>data</C>, <C>grad</C>, <C>_prev</C>, <C>_op</C> and{" "}
          <C>_backward</C>, supporting <C>+</C> and <C>*</C> with Values or plain numbers on either side (add{" "}
          <C>__radd__</C> and <C>__rmul__</C>), and a method <C>tanh()</C> whose closure applies{" "}
          <C>(1 - t ** 2) * out.grad</C>. Use <C>math.tanh</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

class Value:
    def __init__(self, data, _prev=(), _op=""):
        self.data = data
        self.grad = 0.0
        self._prev = set(_prev)
        self._op = _op
        self._backward = lambda: None
`,
        solution: `import math

class Value:
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

    def tanh(self):
        t = math.tanh(self.data)
        out = Value(t, (self,), "tanh")
        def _backward():
            self.grad += (1 - t ** 2) * out.grad
        out._backward = _backward
        return out
`,
        tests: [
          { name: "forward and graph", code: `a, b = Value(2.0), Value(-3.0)
c = a * b + a
assert c.data == -4.0 and c._op == "+"
assert len(c._prev) == 2
d = 2 * a + 1
assert d.data == 5.0, 'Numbers on the left need __radd__ and __rmul__.'` },
          { name: "closures", code: `import math
a, b = Value(2.0), Value(-3.0)
c = a * b
c.grad = 1.0
c._backward()
assert (a.grad, b.grad) == (-3.0, 2.0)
x = Value(0.5)
y = x.tanh()
y.grad = 2.0
y._backward()
assert abs(x.grad - 2 * (1 - math.tanh(0.5) ** 2)) < 1e-12
z = Value(3.0)
w = z * z
w.grad = 1.0
w._backward()
assert z.grad == 6.0, 'z * z sends two contributions to z: use +=.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With the lesson&rsquo;s <C>Value</C> already defined, write <C>trace(root)</C>, which returns the pair (set of all
          Values reachable from root through <C>_prev</C>, set of edges <C>(child, parent)</C> meaning child is in{" "}
          parent&rsquo;s <C>_prev</C>), and <C>op_counts(root)</C>, a dict from each non-empty <C>_op</C> to how many nodes in
          the graph have it.
        </p>
      ),
      answer: {
        kind: "code",
        setup: VALUE,
        starter: `# Value is already defined.

def trace(root):
    return {root}, set()

def op_counts(root):
    return {}
`,
        solution: `def trace(root):
    nodes, edges = set(), set()
    stack = [root]
    while stack:
        v = stack.pop()
        if v in nodes:
            continue
        nodes.add(v)
        for p in v._prev:
            edges.add((p, v))
            stack.append(p)
    return nodes, edges

def op_counts(root):
    counts = {}
    for v in trace(root)[0]:
        if v._op:
            counts[v._op] = counts.get(v._op, 0) + 1
    return counts
`,
        tests: [
          { name: "small graph", code: `a, b = Value(2.0), Value(-3.0)
c = a * b
d = c + a
nodes, edges = trace(d)
assert nodes == {a, b, c, d}
assert edges == {(a, c), (b, c), (c, d), (a, d)}
assert op_counts(d) == {"*": 1, "+": 1}` },
          { name: "shared subgraphs are visited once", code: `x = Value(1.0)
y = x
for _ in range(30):
    y = y * y + x
nodes, edges = trace(y)
assert len(nodes) == 61, len(nodes)
assert op_counts(y) == {"*": 30, "+": 30}` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          For L = a · b + a, show from the multivariable chain rule that ∂L/∂a = b + 1, and explain why the{" "}
          <C>+=</C> in the closures produces exactly this sum, while <C>=</C> would not.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes L = c + a with c = a·b, so ∂L/∂a = ∂L/∂c · ∂c/∂a + (direct term) = 1 · b + 1.",
          "Notes a appears in the graph along two paths, through c and directly into the sum.",
          "Explains that each closure adds one path's contribution to a.grad, so with += they sum to b + 1; with = the later closure would overwrite the earlier one.",
        ],
      },
    },
    {
      key: "nodes",
      rung: "stretch",
      prompt: (
        <p>
          Starting from <C>x = Value(1.0)</C> and <C>y = x</C>, the loop <C>y = y * y + x</C> runs 10 times. How many distinct
          Values are reachable from the final y (count every leaf created for constants too, but there are none here)?
        </p>
      ),
      answer: { kind: "numeric", value: 21 },
    },
  ],

  teachBack:
    "Explain to a friend how wrapping numbers in a Value class lets ordinary arithmetic build a computational graph, and what each operation's _backward closure stores.",

  glimpse: (
    <p>
      Calling the closures by hand works only in the right order. Next, a topological sort finds that order automatically, and{" "}
      <C>backward()</C> becomes one method call.
    </p>
  ),
};
