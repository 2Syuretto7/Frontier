import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { ChainViz } from "@/components/viz/ChainViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.4.3",
  minutes: 80,
  links: {
    revisits: ["m0.3.4", "m2.3.1"],
    foreshadows: ["m2.6.4"],
  },

  puzzle: (
    <>
      <p>
        A car drives at a steady 60 km per hour. Its engine burns 8 litres of fuel per 100 km. How fast is it burning fuel,
        in litres per hour?
      </p>
      <p>
        You will probably multiply without a second thought. Now: how fast is <M>{"\\sin(x^2)"}</M> changing when{" "}
        <M>{"x = 1"}</M>? It is the same question in disguise.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The car turns hours into kilometres at 60 per hour, and kilometres into litres at 0.08 per kilometre. Rates in a chain
        multiply: <M>{"60 \\times 0.08 = 4.8"}</M> litres per hour. A composite function <M>{"f(g(x))"}</M> is a chain of
        the same kind: x is turned into <M>{"u = g(x)"}</M>, and u into <M>{"y = f(u)"}</M>. Near a point, each step
        stretches small intervals by its derivative, and the stretches multiply.
      </p>
      <ChainViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the chain rule">
        <p>
          If g is differentiable at x and f is differentiable at <M>{"g(x)"}</M>, then <M>{"f \\circ g"}</M> is differentiable
          at x, and
        </p>
        <MD>{"(f \\circ g)'(x) = f'(g(x)) \\cdot g'(x)."}</MD>
        <p>
          In Leibniz&rsquo;s notation, with <M>{"y = f(u)"}</M> and <M>{"u = g(x)"}</M>:{" "}
          <M>{"\\dfrac{dy}{dx} = \\dfrac{dy}{du} \\cdot \\dfrac{du}{dx}"}</M>.
        </p>
      </Theorem>

      <Remark title="a tempting proof, and its flaw">
        <p>Write <M>{"k = g(x + h) - g(x)"}</M>. It is tempting to argue</p>
        <MD>{"\\frac{f(g(x + h)) - f(g(x))}{h} = \\frac{f(g(x) + k) - f(g(x))}{k} \\cdot \\frac{k}{h},"}</MD>
        <p>
          and note that <M>{"k \\to 0"}</M> as <M>{"h \\to 0"}</M>, so the first factor tends to <M>{"f'(g(x))"}</M> and the
          second to <M>{"g'(x)"}</M>. The flaw: k might be 0 for some small h (if g is constant near x, or oscillates), and
          then we have divided by zero. Leibniz&rsquo;s notation, which makes the rule look like cancelling fractions, hides
          exactly this problem.
        </p>
      </Remark>

      <Proof>
        <p>
          Define <M>{"\\varphi(k) = \\dfrac{f(g(x) + k) - f(g(x))}{k}"}</M> for <M>{"k \\ne 0"}</M>, and{" "}
          <M>{"\\varphi(0) = f'(g(x))"}</M>. Since f is differentiable at <M>{"g(x)"}</M>, <M>{"\\varphi"}</M> is continuous at
          0. For every k, including 0,
        </p>
        <MD>{"f(g(x) + k) - f(g(x)) = \\varphi(k)\\, k."}</MD>
        <p>Put <M>{"k = g(x + h) - g(x)"}</M> and divide by <M>{"h \\ne 0"}</M>:</p>
        <MD>{"\\frac{f(g(x + h)) - f(g(x))}{h} = \\varphi\\big(g(x + h) - g(x)\\big) \\cdot \\frac{g(x + h) - g(x)}{h}."}</MD>
        <p>
          As <M>{"h \\to 0"}</M>, <M>{"g(x + h) - g(x) \\to 0"}</M> because g is continuous at x, so the first factor tends to{" "}
          <M>{"\\varphi(0) = f'(g(x))"}</M> by continuity of <M>{"\\varphi"}</M>; the second tends to <M>{"g'(x)"}</M>. No
          division by k ever happens.
        </p>
      </Proof>

      <Example title="outside, then inside">
        <p>
          Differentiate the outer function, leaving the inside alone, then multiply by the derivative of the inside:
        </p>
        <ul>
          <li>
            <M>{"\\dfrac{d}{dx}\\sin(x^2) = \\cos(x^2) \\cdot 2x"}</M>. At <M>{"x = 1"}</M> this is <M>{"2\\cos 1 \\approx 1.08"}</M>.
          </li>
          <li>
            <M>{"\\dfrac{d}{dx}(3x + 1)^{10} = 10(3x + 1)^9 \\cdot 3"}</M>.
          </li>
          <li>
            <M>{"\\dfrac{d}{dx}\\sqrt{1 + x^2} = \\dfrac{1}{2\\sqrt{1 + x^2}} \\cdot 2x = \\dfrac{x}{\\sqrt{1 + x^2}}"}</M>.
          </li>
        </ul>
      </Example>

      <Example title="chains of three">
        <p>
          The rule extends to longer chains by applying it repeatedly:{" "}
          <M>{"\\dfrac{d}{dx}\\cos^3(5x) = 3\\cos^2(5x) \\cdot (-\\sin 5x) \\cdot 5"}</M>.
        </p>
      </Example>

      <Remark title="units as a check">
        <p>
          The chain rule is what makes units of measurement work. If y is in litres, u in kilometres and x in hours, then{" "}
          <M>{"dy/du"}</M> is in litres per kilometre and <M>{"du/dx"}</M> in kilometres per hour, and their product is in
          litres per hour. When the units of an answer come out wrong, a factor from the chain rule has usually gone missing.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "fuel",
      rung: "check",
      prompt: <p>A car travels at 80 km per hour and uses 0.05 litres per km. How many litres does it use per hour?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "power",
      rung: "check",
      prompt: (
        <p>
          Differentiate <M>{"(2x + 1)^5"}</M>.
        </p>
      ),
      answer: { kind: "expression", value: "10(2x + 1)^4", variables: ["x"] },
    },
    {
      key: "sin-square",
      rung: "apply",
      prompt: (
        <p>
          Differentiate <M>{"\\sin(x^3)"}</M>.
        </p>
      ),
      answer: { kind: "expression", value: "3x^2 cos(x^3)", variables: ["x"] },
    },
    {
      key: "root",
      rung: "apply",
      prompt: (
        <p>
          Let <M>{"f(x) = \\sqrt{x^2 + 16}"}</M>. What is <M>{"f'(3)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.6 },
    },
    {
      key: "three",
      rung: "apply",
      prompt: (
        <p>
          Differentiate <M>{"\\sin^2(4x)"}</M>, that is, <M>{"(\\sin 4x)^2"}</M>.
        </p>
      ),
      answer: { kind: "expression", value: "8 sin(4x) cos(4x)", variables: ["x"] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
f = lambda x: math.sin(x ** 2)
x, h = 1.0, 1e-6
print(round((f(x + h) - f(x - h)) / (2 * h), 4), round(2 * x * math.cos(x ** 2), 4))`}</Code>
          <p>Both numbers are the derivative of sin(x²) at 1. What is it, to four decimal places?</p>
        </>
      ),
      answer: { kind: "numeric", value: 1.0806, tolerance: 0.0002 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
g = lambda x: x * x
f = math.sin
df_g = lambda x: math.cos(g(x)) * 2 * x
h = 1e-6
num = (f(g(1.5 + h)) - f(g(1.5 - h))) / (2 * h)
print(round(df_g(1.5), 6), abs(num - df_g(1.5)) < 1e-8)`}</Code>
          <p>The chain rule for sin(x²) at 1.5, checked numerically. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["-1.884521 True", "0.778073 True", "-1.884521 False", "-0.628174 True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>compose_derivative(f, df, g, dg)</C>, which returns a function computing the derivative of f(g(x)) by the chain rule, given f, its derivative df, g and its derivative dg.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def compose_derivative(f, df, g, dg):
    return lambda x: df(x) * dg(x)
`,
        solution: `def compose_derivative(f, df, g, dg):
    return lambda x: df(g(x)) * dg(x)
`,
        tests: [
          { name: "sin of square", code: `import math
d = compose_derivative(math.sin, math.cos, lambda x: x * x, lambda x: 2 * x)
assert abs(d(1.0) - 2 * math.cos(1.0)) < 1e-12, 'Evaluate the outer derivative at the inner value g(x).'` },
          { name: "exp of linear", code: `import math
d = compose_derivative(math.exp, math.exp, lambda x: 3 * x, lambda x: 3)
assert abs(d(0.5) - 3 * math.exp(1.5)) < 1e-9, 'd/dx e^(3x) = 3e^(3x).'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Backpropagation is the chain rule run backwards. Write <C>backprop(xs, fs, dfs)</C> for a chain of one-variable functions y = fₖ(…f₂(f₁(x))…): run forward storing each intermediate value, then go backwards multiplying local derivatives, and return (y, dy/dx). Then write <C>grad_check(fs, dfs, x)</C>, the relative error |analytic − numeric| / max(1, |numeric|) against a central difference with h = 10⁻⁶.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def backprop(x, fs, dfs):
    y = x
    for f in fs:
        y = f(y)
    return (y, 1.0)

def grad_check(fs, dfs, x):
    return 0.0
`,
        solution: `def backprop(x, fs, dfs):
    vals = [x]
    for f in fs:
        vals.append(f(vals[-1]))
    g = 1.0
    for k in range(len(fs) - 1, -1, -1):
        g *= dfs[k](vals[k])
    return (vals[-1], g)

def grad_check(fs, dfs, x):
    def run(t):
        for f in fs:
            t = f(t)
        return t
    h = 1e-6
    num = (run(x + h) - run(x - h)) / (2 * h)
    ana = backprop(x, fs, dfs)[1]
    return abs(ana - num) / max(1.0, abs(num))
`,
        tests: [
          { name: "chain", code: `import math
y, d = backprop(1.5, [lambda x: x * x, math.sin], [lambda x: 2 * x, math.cos])
assert abs(y - math.sin(2.25)) < 1e-15 and abs(d - math.cos(2.25) * 3) < 1e-12, 'Multiply the local derivatives at the stored values.'` },
          { name: "deep", code: `import math
fs = [math.tanh] * 20
dfs = [lambda x: 1 - math.tanh(x) ** 2] * 20
y, d = backprop(0.3, fs, dfs)
assert grad_check(fs, dfs, 0.3) < 1e-7 and 0 < d < 1, 'Twenty tanh layers.'` },
          { name: "sigmoid net", code: `import math
s = lambda x: 1 / (1 + math.exp(-x))
ds = lambda x: s(x) * (1 - s(x))
fs = [lambda x: 3 * x - 1, s, lambda x: x * x, math.log]
dfs = [lambda x: 3, ds, lambda x: 2 * x, lambda x: 1 / x]
assert grad_check(fs, dfs, 0.4) < 1e-7, 'Agree with the numerical slope.'` },
          { name: "detects", code: `assert grad_check([lambda x: x ** 3], [lambda x: 2 * x * x], 1.0) > 0.1, 'A wrong derivative must show up.'` },
        ],
      },
    },
    {
      key: "even-odd",
      rung: "prove",
      prompt: (
        <p>
          A function is even if <M>{"f(-x) = f(x)"}</M> for all x, and odd if <M>{"f(-x) = -f(x)"}</M>. Use the chain rule to
          prove that the derivative of a differentiable even function is odd.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Differentiates both sides of f(−x) = f(x).",
          "Applies the chain rule on the left to get −f′(−x).",
          "Concludes f′(−x) = −f′(x), so f′ is odd.",
        ],
      },
    },
    {
      key: "flaw",
      rung: "stretch",
      prompt: (
        <p>
          Give an example of differentiable functions f and g, and a point x, where <M>{"g(x + h) - g(x) = 0"}</M> for
          infinitely many h arbitrarily close to 0, so that the tempting proof of the chain rule breaks down. Does the chain
          rule still hold at your point?
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Gives an example such as g(x) = x² sin(1/x) with g(0) = 0, at x = 0 (or a constant function).",
          "Shows g(h) = 0 at h = 1/(nπ), points arbitrarily close to 0.",
          "Confirms the chain rule still holds there, for example because g′(0) = 0 and the composite's difference quotient tends to 0.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why the derivative of f(g(x)) is f′(g(x)) times g′(x), using the idea of rates multiplying along a chain.",

  glimpse: (
    <p>
      Next, the exponential, the logarithm and the sigmoid, which the chain rule now lets you differentiate. The chain rule also runs backwards as integration by substitution. In Multivariable and Matrix Calculus the derivative becomes a matrix and the chain rule becomes matrix multiplication; backpropagation, in Neural Networks from Scratch and Build a Deep Learning Framework, is that chain rule organised for a computer.
    </p>
  ),
};
