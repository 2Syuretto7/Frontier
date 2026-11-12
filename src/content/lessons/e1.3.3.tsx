import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TraceViz } from "@/components/viz/TraceViz";
import { code, steps } from "@/content/traces/e1.3.3";
import type { LessonContent } from "@/lib/types";
import { Playground } from "@/components/code/Playground";

export const lesson: LessonContent = {
  id: "e1.3.3",
  minutes: 55,
  links: {
    requires: ["e1.3.1"],
    revisits: ["e1.3.2"],
    parallels: ["m3.1.1"],
    foreshadows: ["e1.3.5", "e1.5.1"],
  },

  puzzle: (
    <>
      <p>
        In PyTorch you write <C>loss = criterion(model(x), y)</C>, and <C>model</C> is an object you built from a class, not a
        function. Tensors can be added with <C>+</C>, indexed with <C>[ ]</C> and printed sensibly.
      </p>
      <p>
        How can an object you defined yourself be called like a function, or added with <C>+</C>? Who decides what{" "}
        <C>+</C> means for it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A <strong>class</strong> defines a new type: what data its objects hold and what they can do. Python&rsquo;s syntax is
        wired to <strong>special methods</strong> with double-underscore names. Write <C>__add__</C> and <C>+</C> works;
        write <C>__call__</C> and the object can be called; write <C>__repr__</C> and it prints well. Step through a small
        vector class and see each piece of syntax turn into a method call.
      </p>
      <TraceViz code={code} steps={steps} />
    </>
  ),

  theory: (
    <>
      <Definition title="classes and instances">
        <p>
          A class is a blueprint; calling it creates an <strong>instance</strong>. Python first makes an empty object, then
          calls <C>__init__(self, ...)</C> on it, where <C>self</C> is the new object. Values stored as <C>self.x</C> are
          that instance&rsquo;s <strong>attributes</strong>. A method is a function defined in the class; <C>u.norm()</C> is
          the same as <C>Vec.norm(u)</C>.
        </p>
      </Definition>

      <Definition title="special methods">
        <p>Some of the most useful hooks:</p>
        <ul>
          <li><C>__repr__</C>: the text shown by <C>print</C> and in the debugger.</li>
          <li><C>__eq__</C>: <C>==</C>. Without it, <C>==</C> falls back to identity, like <C>is</C>.</li>
          <li><C>__add__</C>, <C>__mul__</C>, <C>__matmul__</C>: <C>+</C>, <C>*</C>, <C>@</C>.</li>
          <li><C>__len__</C> and <C>__getitem__</C>: <C>len(x)</C> and <C>x[i]</C>, which together make a sequence.</li>
          <li><C>__call__</C>: <C>x(...)</C>.</li>
        </ul>
      </Definition>

      <Example title="why you call model(x), not model.forward(x)">
        <Playground code={`class Module:
    def __call__(self, *args):
        # run hooks, record what is needed for gradients, then:
        return self.forward(*args)

class Linear(Module):
    def __init__(self, w, b):
        self.w, self.b = w, b
    def forward(self, x):
        return self.w * x + self.b

layer = Linear(2.0, 1.0)
print(layer(3.0))   # 7.0`} />
        <p>
          <C>Linear</C> <strong>inherits</strong> from <C>Module</C>: it gets <C>__call__</C> for free and supplies its own{" "}
          <C>forward</C>. PyTorch&rsquo;s <C>nn.Module</C> works this way, which is why you define <C>forward</C> but call the
          module itself.
        </p>
      </Example>

      <Remark title="inheritance and super">
        <p>
          A subclass can override a method and still reach the parent&rsquo;s version with <C>super()</C>. A typical{" "}
          <C>__init__</C> in a PyTorch model starts with <C>super().__init__()</C> so the parent can set itself up. Prefer
          composition, objects holding other objects, over deep chains of inheritance: they are easier to follow.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "add",
      rung: "check",
      prompt: <p>For instances of a class, what does <C>u + v</C> call?</p>,
      answer: { kind: "choice", options: ["u.__add__(v)", "v.__add__(u)", "Vec.__init__(u, v)", "u.__eq__(v)"], correct: [0] },
    },
    {
      key: "noeq",
      rung: "check",
      prompt: <p>If <C>Vec</C> had no <C>__eq__</C>, what would <C>Vec(1, 2) == Vec(1, 2)</C> give?</p>,
      answer: { kind: "choice", options: ["False, because two different objects are compared by identity", "True", "An error"], correct: [0] },
    },
    {
      key: "unchanged",
      rung: "apply",
      prompt: <p>After <C>w = u + v</C> in the traced program, what is <C>u.x</C>?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "seq",
      rung: "apply",
      prompt: (
        <>
          <Code>{`class Squares:
    def __len__(self):
        return 4
    def __getitem__(self, i):
        return i * i

s = Squares()
print(sum(s[k] for k in range(len(s))))`}</Code>
          <p>What is printed?</p>
        </>
      ),
      answer: { kind: "numeric", value: 14 },
    },
    {
      key: "super",
      rung: "apply",
      prompt: (
        <>
          <Code>{`class A:
    def f(self):
        return 1

class B(A):
    def f(self):
        return super().f() + 10

print(B().f())`}</Code>
          <p>What is printed?</p>
        </>
      ),
      answer: { kind: "numeric", value: 11 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`class Money:
    def __init__(self, paise):
        self.paise = paise
    def __add__(self, other):
        return Money(self.paise + other.paise)
    def __repr__(self):
        return f"Rs {self.paise // 100}.{self.paise % 100:02d}"
print(Money(250) + Money(1075))`}</Code>
          <p>Special methods make + and printing work. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["Rs 13.25", "Rs 1325", "Rs 13.025", "<Money object>"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`class A:
    count = 0
    def __init__(self):
        A.count += 1
        self.items = []
class B(A):
    def __repr__(self):
        return f"B({len(self.items)})"
x, y = A(), B()
y.items.append(1)
print(A.count, x.items, y, isinstance(y, A), B.__mro__[1].__name__)`}</Code>
          <p>A class attribute, instance attributes and inheritance. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2 [] B(1) True A", "1 [] B(1) True A", "2 [1] B(1) True A", "2 [] B(1) False object"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a class <C>Vec</C> for 2D vectors with <C>__init__(self, x, y)</C>, <C>__add__</C>, <C>__mul__</C> by a number, <C>__eq__</C>, <C>__abs__</C> (the length) and <C>__repr__</C> giving <C>Vec(3, 4)</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class Vec:
    def __init__(self, x, y):
        self.x, self.y = x, y
`,
        solution: `import math

class Vec:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def __add__(self, o):
        return Vec(self.x + o.x, self.y + o.y)
    def __mul__(self, k):
        return Vec(self.x * k, self.y * k)
    def __eq__(self, o):
        return isinstance(o, Vec) and (self.x, self.y) == (o.x, o.y)
    def __abs__(self):
        return math.hypot(self.x, self.y)
    def __repr__(self):
        return f'Vec({self.x}, {self.y})'
`,
        tests: [
          { name: "arithmetic", code: `assert Vec(1, 2) + Vec(3, 4) == Vec(4, 6) and Vec(1, 2) * 3 == Vec(3, 6), 'Define __add__, __mul__ and __eq__.'` },
          { name: "length and repr", code: `assert abs(Vec(3, 4)) == 5 and repr(Vec(3, 4)) == 'Vec(3, 4)', 'abs() calls __abs__; repr() calls __repr__.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a class <C>Poly</C> for polynomials, with coefficients stored lowest power first and trailing zeros removed (the zero polynomial has an empty list). Give it <C>__call__</C> (evaluate by Horner&rsquo;s rule), <C>__add__</C> and <C>__mul__</C> for two polynomials, <C>__eq__</C>, <C>__repr__</C> giving <C>Poly([1, 0, 2])</C>, and methods <C>degree()</C> (−1 for zero) and <C>derivative()</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class Poly:
    def __init__(self, coeffs):
        self.coeffs = list(coeffs)
`,
        solution: `class Poly:
    def __init__(self, coeffs):
        c = list(coeffs)
        while c and c[-1] == 0:
            c.pop()
        self.coeffs = c
    def __call__(self, x):
        r = 0
        for c in reversed(self.coeffs):
            r = r * x + c
        return r
    def __add__(self, other):
        n = max(len(self.coeffs), len(other.coeffs))
        a = self.coeffs + [0] * (n - len(self.coeffs))
        b = other.coeffs + [0] * (n - len(other.coeffs))
        return Poly([x + y for x, y in zip(a, b)])
    def __mul__(self, other):
        out = [0] * (len(self.coeffs) + len(other.coeffs))
        for i, x in enumerate(self.coeffs):
            for j, y in enumerate(other.coeffs):
                out[i + j] += x * y
        return Poly(out)
    def __eq__(self, other):
        return isinstance(other, Poly) and self.coeffs == other.coeffs
    def __repr__(self):
        return f'Poly({self.coeffs})'
    def degree(self):
        return len(self.coeffs) - 1
    def derivative(self):
        return Poly([i * c for i, c in enumerate(self.coeffs)][1:])
`,
        tests: [
          { name: "basics", code: `p = Poly([1, 0, 2, 0, 0])
assert p.coeffs == [1, 0, 2] and repr(p) == 'Poly([1, 0, 2])' and p.degree() == 2 and p(3) == 19 and Poly([0, 0]).degree() == -1 and Poly([]) == Poly([0])` },
          { name: "arithmetic", code: `p, q = Poly([1, 1]), Poly([-1, 1])
assert p * q == Poly([-1, 0, 1]) and p + q == Poly([0, 2]) and (p + Poly([-1, -1])).degree() == -1, '(1 + x)(x − 1) = x² − 1.'
assert p * Poly([]) == Poly([]) and Poly([2]) * p == Poly([2, 2])` },
          { name: "derivative", code: `p = Poly([5, 3, 0, 4])
assert p.derivative() == Poly([3, 0, 12]) and Poly([7]).derivative() == Poly([]) and p.derivative().derivative()(1) == 24` },
        ],
      },
    },
    {
      key: "design",
      rung: "prove",
      prompt: (
        <p>
          Design a class <C>RunningMean</C> that you can call with a number to add it, that reports how many numbers it has
          seen through <C>len</C>, and that prints as <C>RunningMean(mean=..., n=...)</C>. Name the special methods you need and
          say what each does.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Stores a running total and a count as attributes, set in __init__.",
          "Defines __call__(self, x) to add x to the total and increase the count.",
          "Defines __len__ to return the count, and __repr__ to return the formatted text with the mean.",
          "Handles the case of no numbers yet, for example by showing the mean as None or 0 without dividing by zero.",
        ],
      },
    },
    {
      key: "three",
      rung: "stretch",
      prompt: <p>With the traced <C>Vec</C> class, what is the <C>x</C> coordinate of <C>Vec(1, 2) + Vec(3, 4) + Vec(5, 6)</C>?</p>,
      answer: { kind: "numeric", value: 9 },
    },
  ],

  teachBack:
    "Explain to a friend what self is, how u + v ends up calling a method, and why PyTorch models are called like functions.",

  glimpse: (
    <p>
      Next, iterators and generators, the protocol behind every for loop, and context managers, the protocol behind with.
      NumPy&rsquo;s arrays, later in this course, are a class whose special methods make <C>a + b</C> add millions of numbers
      at once.
    </p>
  ),
};
