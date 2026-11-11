import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TraceViz } from "@/components/viz/TraceViz";
import { code, steps } from "@/content/traces/e1.3.3";
import type { LessonContent } from "@/lib/types";

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
        <Code>{`class Module:
    def __call__(self, *args):
        # run hooks, record what is needed for gradients, then:
        return self.forward(*args)

class Linear(Module):
    def __init__(self, w, b):
        self.w, self.b = w, b
    def forward(self, x):
        return self.w * x + self.b

layer = Linear(2.0, 1.0)
print(layer(3.0))   # 7.0`}</Code>
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
