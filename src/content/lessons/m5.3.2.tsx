import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AutodiffGraphViz } from "@/components/viz/AutodiffGraphViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.3.2",
  minutes: 55,
  links: {
    requires: ["m5.3.1"],
    revisits: ["m5.2.5", "m2.4.3"],
    foreshadows: ["m5.3.4", "m5.5.4"],
  },

  puzzle: (
    <>
      <p>
        Finite differences give derivatives with only a few correct digits, and symbolic algebra produces enormous expressions.
        Yet a program that computes f(x) can be made to compute f&prime;(x) exactly, to machine precision, at about the cost of
        running it twice.
      </p>
      <p>How can a program compute an exact derivative without doing any algebra?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Let every value carry a second number: how fast it changes as the input moves in a chosen direction. Each elementary
        operation knows how to update that rate from the rates of its inputs, by its own small chain rule. Run the program once
        and the output's rate is the derivative.
      </p>
      <AutodiffGraphViz mode="forward" />
      <p>
        One sweep gives the derivative along one input direction. To get both partials of f(x, y) you need two sweeps, seeding x
        and then y. That is cheap for few inputs and expensive for many.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="tangent, and forward mode">
        <p>
          Fix an input direction <M>{"\\dot x \\in \\mathbb R^n"}</M>. Along the line <M>{"x + t\\dot x"}</M>, every node is a
          function of t, and its <em>tangent</em> is <M>{"\\dot v_i = \\frac{d}{dt} v_i \\big|_{t=0}"}</M>. Forward mode
          computes, in topological order,
        </p>
        <MD>{"\\dot v_i = \\sum_{j \\in \\mathrm{pa}(i)} \\frac{\\partial \\phi_i}{\\partial v_j} \\, \\dot v_j,"}</MD>
        <p>starting from the inputs&rsquo; tangents, which are the entries of <M>{"\\dot x"}</M>.</p>
      </Definition>

      <Theorem title="forward mode computes a Jacobian-vector product">
        <p>
          After one forward sweep the outputs&rsquo; tangents are <M>{"J_f(x)\\, \\dot x"}</M>. The cost is a constant multiple
          of the cost of evaluating f.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction along the topological order: if every parent&rsquo;s tangent is its true derivative in t, the chain rule
          for <M>{"v_i = \\phi_i(v_j : j \\in \\mathrm{pa}(i))"}</M> says the formula above gives the true derivative of{" "}
          <M>{"v_i"}</M>. At the outputs, the derivative of <M>{"f(x + t \\dot x)"}</M> at t = 0 is <M>{"J_f(x) \\dot x"}</M>. Each
          operation does a fixed amount of extra work (a few multiplications), so the total cost is a constant times the cost of
          the forward pass.
        </p>
      </Proof>

      <Definition title="dual numbers">
        <p>
          A dual number is <M>{"a + b\\varepsilon"}</M> with <M>{"\\varepsilon^2 = 0"}</M>. Arithmetic gives{" "}
          <M>{"(a + b\\varepsilon)(c + d\\varepsilon) = ac + (ad + bc)\\varepsilon"}</M>, which is the product rule, and for a
          smooth g we define <M>{"g(a + b\\varepsilon) = g(a) + g'(a) b\\,\\varepsilon"}</M>. Then{" "}
          <M>{"f(x + \\varepsilon) = f(x) + f'(x)\\varepsilon"}</M> for any f built from these operations.
        </p>
      </Definition>

      <Example title="by hand">
        <p>
          For <M>{"f(x) = x^2 \\sin x"}</M> at <M>{"x = \\pi"}</M>: <M>{"(\\pi + \\varepsilon)^2 = \\pi^2 + 2\\pi\\varepsilon"}</M>,{" "}
          <M>{"\\sin(\\pi + \\varepsilon) = 0 - \\varepsilon"}</M>, and the product is <M>{"0 - \\pi^2 \\varepsilon"}</M>. So{" "}
          <M>{"f'(\\pi) = -\\pi^2"}</M>, with no rounding beyond that of the arithmetic itself.
        </p>
      </Example>

      <Remark title="when forward mode is the right tool">
        <p>
          Forward mode costs one sweep per input direction. It is ideal for functions with few inputs and many outputs, for a
          single directional derivative, and as a building block for Hessian-vector products later in this course. For a loss
          with millions of parameters it would need millions of sweeps; the next lesson fixes that.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sweeps",
      rung: "check",
      prompt: <p>How many forward-mode sweeps give the full gradient of a function from <M>{"\\mathbb R^{100}"}</M> to ℝ?</p>,
      answer: { kind: "numeric", value: 100 },
    },
    {
      key: "dual",
      rung: "check",
      prompt: <p>Expand <M>{"(3 + \\varepsilon)^2"}</M> with <M>{"\\varepsilon^2 = 0"}</M>. What is the coefficient of ε?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "tan",
      rung: "apply",
      prompt: (
        <p>
          In the graph of <M>{"f(x, y) = (xy + \\sin x)\\,y"}</M>, seed x with tangent 1 and y with 0. What is the output tangent
          at x = 1, y = 2?
        </p>
      ),
      answer: { kind: "numeric", value: 4 + 2 * Math.cos(1), tolerance: 1e-4 },
    },
    {
      key: "rule",
      rung: "apply",
      prompt: <p>For a node c = a · b, what is the forward-mode rule for its tangent?</p>,
      answer: { kind: "choice", options: ["ċ = ȧ·b + a·ḃ", "ċ = ȧ·ḃ", "ċ = ȧ + ḃ", "ċ = a·b·(ȧ + ḃ)"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`class D:
    def __init__(self, v, d):
        self.v, self.d = v, d
    def __add__(self, o):
        return D(self.v + o.v, self.d + o.d)
    def __mul__(self, o):
        return D(self.v * o.v, self.d * o.v + self.v * o.d)

x = D(3.0, 1.0)
y = x * x + x
z = y * y
print(y.v, y.d, z.v, z.d)`}</Code>
          <p>A tiny dual-number class. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["12.0 7.0 144.0 168.0", "12.0 7.0 144.0 49.0", "12.0 6.0 144.0 144.0", "12.0 7.0 144.0 84.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`tape = [("a", "mul", ["x", "y"]), ("f", "add", ["a", "y"])]
val = {"x": 2.0, "y": 5.0}
tan = {"x": 0.0, "y": 1.0}
for name, op, (p, q) in tape:
    if op == "mul":
        val[name] = val[p] * val[q]
        tan[name] = tan[p] * val[q] + val[p] * tan[q]
    else:
        val[name] = val[p] + val[q]
        tan[name] = tan[p] + tan[q]
print(val["f"], tan["f"])`}</Code>
          <p>Forward mode over a tape, seeding y. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["15.0 3.0", "15.0 6.0", "15.0 1.0", "10.0 3.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write a class <C>Dual</C> with attributes <C>val</C> and <C>dot</C>, supporting <C>+</C> and <C>*</C> with other
          Duals and with plain numbers on either side (a number c behaves as Dual(c, 0)). Write <C>dsin(u)</C> returning the
          Dual sine, and <C>derivative(f, x)</C>, which returns f&prime;(x) by running f on <C>Dual(x, 1.0)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

class Dual:
    def __init__(self, val, dot=0.0):
        self.val, self.dot = val, dot

def dsin(u):
    return u

def derivative(f, x):
    return 0.0
`,
        solution: `import math

class Dual:
    def __init__(self, val, dot=0.0):
        self.val, self.dot = val, dot
    def __add__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(self.val + o.val, self.dot + o.dot)
    __radd__ = __add__
    def __mul__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(self.val * o.val, self.dot * o.val + self.val * o.dot)
    __rmul__ = __mul__

def dsin(u):
    return Dual(math.sin(u.val), math.cos(u.val) * u.dot)

def derivative(f, x):
    return f(Dual(x, 1.0)).dot
`,
        tests: [
          { name: "polynomials", code: `assert derivative(lambda x: x * x * x + 2 * x + 1, 2.0) == 14.0
d = Dual(3.0, 1.0) * 2 + 1
assert (d.val, d.dot) == (7.0, 2.0)
e = 1 + 2 * Dual(3.0, 1.0)
assert (e.val, e.dot) == (7.0, 2.0), 'Numbers on the left need __radd__ and __rmul__.'` },
          { name: "sine", code: `import math
g = lambda x: x * x * dsin(x)
assert abs(derivative(g, math.pi) + math.pi ** 2) < 1e-12
h = lambda x: dsin(dsin(x))
assert abs(derivative(h, 0.4) - math.cos(math.sin(0.4)) * math.cos(0.4)) < 1e-15` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>jvp_tape(tape, inputs, tangents)</C> for tapes of <C>(name, op, args)</C> with ops <C>&quot;add&quot;</C>,{" "}
          <C>&quot;mul&quot;</C>, <C>&quot;sin&quot;</C> and <C>&quot;exp&quot;</C>. Return two dicts: the values and the
          tangents of every node, inputs included.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def jvp_tape(tape, inputs, tangents):
    return dict(inputs), dict(tangents)
`,
        solution: `import math

def jvp_tape(tape, inputs, tangents):
    val, tan = dict(inputs), dict(tangents)
    for name, op, args in tape:
        a = args[0]
        if op == "add":
            val[name] = val[a] + val[args[1]]
            tan[name] = tan[a] + tan[args[1]]
        elif op == "mul":
            b = args[1]
            val[name] = val[a] * val[b]
            tan[name] = tan[a] * val[b] + val[a] * tan[b]
        elif op == "sin":
            val[name] = math.sin(val[a])
            tan[name] = math.cos(val[a]) * tan[a]
        else:
            val[name] = math.exp(val[a])
            tan[name] = val[name] * tan[a]
    return val, tan
`,
        tests: [
          { name: "the lesson's graph", code: `import math
tape = [("a", "mul", ["x", "y"]), ("b", "sin", ["x"]), ("c", "add", ["a", "b"]), ("f", "mul", ["c", "y"])]
v, t = jvp_tape(tape, {"x": 1.0, "y": 2.0}, {"x": 1.0, "y": 0.0})
assert abs(t["f"] - (4 + 2 * math.cos(1))) < 1e-12
v, t = jvp_tape(tape, {"x": 1.0, "y": 2.0}, {"x": 0.0, "y": 1.0})
assert abs(t["f"] - (4 + math.sin(1))) < 1e-12, 'y feeds two nodes; both contributions arrive through the tangents.'` },
          { name: "exp and a direction", code: `import math
tape = [("s", "exp", ["x"]), ("f", "mul", ["s", "y"])]
v, t = jvp_tape(tape, {"x": 0.0, "y": 3.0}, {"x": 1.0, "y": 2.0})
assert abs(v["f"] - 3.0) < 1e-12 and abs(t["f"] - (3.0 + 2.0)) < 1e-12, t` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that if <M>{"f(x + \\varepsilon) = f(x) + f'(x)\\varepsilon"}</M> and{" "}
          <M>{"g(x + \\varepsilon) = g(x) + g'(x)\\varepsilon"}</M> hold in dual arithmetic, then the same identity holds for{" "}
          <M>{"fg"}</M> and for <M>{"\\sin \\circ f"}</M>. Explain why this gives forward mode&rsquo;s correctness for any
          program built from these operations.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Multiplies (f + f′ε)(g + g′ε) = fg + (f′g + fg′)ε using ε² = 0, and recognises the product rule.",
          "Applies the definition sin(a + bε) = sin a + (cos a) b ε with a = f(x), b = f′(x) to get (sin ∘ f)′ = cos(f) f′, the chain rule.",
          "Concludes by induction over the operations of the program (or the tape) that every intermediate value carries its own derivative.",
        ],
      },
    },
    {
      key: "tall",
      rung: "stretch",
      prompt: (
        <p>
          How many forward-mode sweeps compute the full Jacobian of a map from <M>{"\\mathbb R^3"}</M> to{" "}
          <M>{"\\mathbb R^{1000}"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 3 },
    },
  ],

  teachBack:
    "Explain to a friend how dual numbers compute exact derivatives, and why one forward sweep gives the derivative along only one input direction.",

  glimpse: (
    <p>
      Forward mode pushes a tangent from the inputs to the outputs. Next, pull a sensitivity from the output back to all the
      inputs at once: reverse mode, the mathematics of backpropagation.
    </p>
  ),
};
