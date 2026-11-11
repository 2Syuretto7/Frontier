import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { ProductRuleViz } from "@/components/viz/ProductRuleViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.4.2",
  minutes: 85,
  links: {
    revisits: ["m2.2.3", "m0.7.5"],
    foreshadows: ["m2.7.1"],
  },

  puzzle: (
    <>
      <p>
        A rectangular garden is growing. Its length is 4 m and increasing at 1 m per year; its width is 2.5 m and increasing
        at 0.8 m per year. How fast is its area growing right now?
      </p>
      <p>
        A tempting answer is the product of the rates, <M>{"1 \\times 0.8 = 0.8"}</M> square metres per year. Try it with a
        rectangle that is not growing in width at all. Does the tempting answer still make sense?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Working every derivative out from the definition would be slow. Instead, we prove a few rules once, for sums,
        products and quotients, and then differentiate any formula built from simple pieces. The product rule is the
        surprising one. The derivative of a product is not the product of the derivatives, as the garden shows: if the width
        stays fixed, the area still grows, because the length does.
      </p>
      <ProductRuleViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="sums and constant multiples">
        <p>
          If f and g are differentiable at x and c is a constant, then <M>{"(f + g)' = f' + g'"}</M> and{" "}
          <M>{"(cf)' = cf'"}</M>.
        </p>
      </Theorem>
      <p>These follow at once from the limit laws applied to the difference quotients.</p>

      <Theorem title="the power rule">
        <p>
          For every whole number <M>{"n \\ge 1"}</M>, <M>{"\\dfrac{d}{dx} x^n = n x^{n-1}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>By the binomial theorem,</p>
        <MD>{"(x + h)^n = x^n + n x^{n-1} h + \\binom{n}{2} x^{n-2} h^2 + \\cdots + h^n."}</MD>
        <p>
          Subtract <M>{"x^n"}</M> and divide by h: the result is <M>{"n x^{n-1}"}</M> plus terms each containing a factor of h,
          which tend to 0.
        </p>
      </Proof>

      <Theorem title="the product rule">
        <p>
          If f and g are differentiable at x, so is fg, and <M>{"(fg)' = f'g + fg'"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>Add and subtract <M>{"f(x + h) g(x)"}</M> in the numerator, which is the picture&rsquo;s split into two strips:</p>
        <MD>{"\\frac{f(x+h)g(x+h) - f(x)g(x)}{h} = f(x + h)\\,\\frac{g(x+h) - g(x)}{h} + g(x)\\,\\frac{f(x+h) - f(x)}{h}."}</MD>
        <p>
          As <M>{"h \\to 0"}</M>, <M>{"f(x + h) \\to f(x)"}</M> because differentiable functions are continuous, and the two
          quotients tend to <M>{"g'(x)"}</M> and <M>{"f'(x)"}</M>. The corner in the picture is hidden in the difference
          between <M>{"f(x + h)"}</M> and <M>{"f(x)"}</M>, and it disappears in the limit.
        </p>
      </Proof>

      <Theorem title="the quotient rule">
        <p>
          If f and g are differentiable at x and <M>{"g(x) \\ne 0"}</M>, then
        </p>
        <MD>{"\\left(\\frac{f}{g}\\right)' = \\frac{f'g - fg'}{g^2}."}</MD>
      </Theorem>
      <p>
        First show <M>{"(1/g)' = -g'/g^2"}</M> from the definition, as for <M>{"1/x"}</M> in the last lesson, then apply the
        product rule to <M>{"f \\cdot (1/g)"}</M>. With it, the power rule extends to negative powers:{" "}
        <M>{"\\dfrac{d}{dx} x^{-n} = -n x^{-n-1}"}</M>.
      </p>

      <Theorem title="sine and cosine">
        <p>
          With x in radians, <M>{"\\dfrac{d}{dx} \\sin x = \\cos x"}</M> and <M>{"\\dfrac{d}{dx} \\cos x = -\\sin x"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>By the addition formula,</p>
        <MD>{"\\frac{\\sin(x + h) - \\sin x}{h} = \\sin x \\cdot \\frac{\\cos h - 1}{h} + \\cos x \\cdot \\frac{\\sin h}{h}."}</MD>
        <p>
          We know <M>{"\\sin h / h \\to 1"}</M>. And{" "}
          <M>{"\\dfrac{\\cos h - 1}{h} = -\\dfrac{\\sin^2 h}{h(\\cos h + 1)} = -\\dfrac{\\sin h}{h} \\cdot \\dfrac{\\sin h}{\\cos h + 1} \\to -1 \\cdot 0 = 0"}</M>.
          So the quotient tends to <M>{"\\cos x"}</M>. Cosine is similar.
        </p>
      </Proof>

      <Remark title="why radians">
        <p>
          The limit <M>{"\\sin h / h \\to 1"}</M> holds only when angles are measured in radians. In degrees, the derivative of{" "}
          <M>{"\\sin x"}</M> would be <M>{"\\tfrac{\\pi}{180} \\cos x"}</M>. Radians are the units in which calculus is simple,
          which is why mathematicians use them.
        </p>
      </Remark>

      <Example title="putting the rules together">
        <p>
          <M>{"\\dfrac{d}{dx}\\left(3x^4 - 5x + 2\\right) = 12x^3 - 5"}</M>. <M>{"\\dfrac{d}{dx}(x^2 \\sin x) = 2x \\sin x + x^2 \\cos x"}</M>.
          And
        </p>
        <MD>{"\\frac{d}{dx} \\tan x = \\frac{d}{dx}\\frac{\\sin x}{\\cos x} = \\frac{\\cos x \\cos x - \\sin x(-\\sin x)}{\\cos^2 x} = \\frac{1}{\\cos^2 x}."}</MD>
      </Example>

      <Remark title="the garden">
        <p>
          With length 4 growing at 1, and width 2.5 growing at 0.8, the area grows at{" "}
          <M>{"1 \\times 2.5 + 4 \\times 0.8 = 5.7"}</M> square metres per year, not 0.8. The exponential function, which is its
          own derivative, must wait until it is defined properly in a later chapter.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "poly",
      rung: "check",
      prompt: (
        <p>
          Differentiate <M>{"4x^3 - 2x^2 + 7"}</M>.
        </p>
      ),
      answer: { kind: "expression", value: "12x^2 - 4x", variables: ["x"] },
    },
    {
      key: "neg-power",
      rung: "check",
      prompt: (
        <p>
          What is the derivative of <M>{"x^{-2}"}</M> at <M>{"x = 1"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: -2 },
    },
    {
      key: "product",
      rung: "apply",
      prompt: (
        <p>
          Differentiate <M>{"x^3 \\cos x"}</M>.
        </p>
      ),
      answer: { kind: "expression", value: "3x^2 cos(x) - x^3 sin(x)", variables: ["x"] },
    },
    {
      key: "quotient",
      rung: "apply",
      prompt: (
        <p>
          Let <M>{"f(x) = \\dfrac{x}{x^2 + 1}"}</M>. What is <M>{"f'(0)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "garden",
      rung: "apply",
      prompt: (
        <p>
          A rectangle has length 6 m, growing at 2 m per second, and width 3 m, shrinking at 1 m per second. At what rate is
          its area changing, in square metres per second?
        </p>
      ),
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import sympy as sp
x = sp.symbols('x')
print(sp.diff(x ** 2 * sp.sin(x), x))`}</Code>
          <p>Which rule produced this output?</p>
        </>
      ),
      answer: { kind: "choice", options: ["The product rule", "The quotient rule", "The chain rule only", "The power rule only"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def deriv(c):
    return [k * c[k] for k in range(1, len(c))]
p = [5, 0, -3, 0, 1]
print(deriv(p), deriv(deriv(p)), deriv([7]))`}</Code>
          <p>Differentiating x⁴ − 3x² + 5 as a coefficient list, lowest power first. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0, -6, 0, 4] [-6, 0, 12] []", "[0, -6, 0, 4] [-6, 0, 12] [0]", "[-6, 0, 4] [-6, 12] []", "[0, -3, 0, 1] [-3, 0, 1] []"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            A polynomial is a list of coefficients, lowest power first: [c₀, c₁, c₂, …]. Write <C>poly_derivative(c)</C>, which returns the coefficients of its derivative by the power rule.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def poly_derivative(c):
    return c
`,
        solution: `def poly_derivative(c):
    return [k * c[k] for k in range(1, len(c))]
`,
        tests: [
          { name: "cubic", code: `assert list(poly_derivative([1, 2, 3, 4])) == [2, 6, 12], '1 + 2x + 3x² + 4x³ has derivative 2 + 6x + 12x².'` },
          { name: "constant", code: `assert list(poly_derivative([5])) == [], 'A constant has derivative 0 (the empty list).'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a small forward-mode automatic differentiation class <C>Dual</C>, holding a value and a derivative, with <C>+</C>, <C>-</C>, <C>*</C>, <C>/</C> (and their reflected forms, so numbers mix with Duals), <C>**</C> for an integer or float exponent, and unary minus, each implementing the sum, product, quotient and power rules. Then write <C>derivative(f, x)</C>, which returns f′(x) by evaluating f at <C>Dual(x, 1)</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class Dual:
    def __init__(self, v, d=0.0):
        self.v, self.d = v, d

def derivative(f, x):
    return 0.0
`,
        solution: `class Dual:
    def __init__(self, v, d=0.0):
        self.v, self.d = v, d
    @staticmethod
    def lift(o):
        return o if isinstance(o, Dual) else Dual(o, 0.0)
    def __add__(self, o):
        o = Dual.lift(o)
        return Dual(self.v + o.v, self.d + o.d)
    __radd__ = __add__
    def __sub__(self, o):
        o = Dual.lift(o)
        return Dual(self.v - o.v, self.d - o.d)
    def __rsub__(self, o):
        return Dual.lift(o) - self
    def __mul__(self, o):
        o = Dual.lift(o)
        return Dual(self.v * o.v, self.d * o.v + self.v * o.d)
    __rmul__ = __mul__
    def __truediv__(self, o):
        o = Dual.lift(o)
        return Dual(self.v / o.v, (self.d * o.v - self.v * o.d) / (o.v * o.v))
    def __rtruediv__(self, o):
        return Dual.lift(o) / self
    def __pow__(self, n):
        return Dual(self.v ** n, n * self.v ** (n - 1) * self.d)
    def __neg__(self):
        return Dual(-self.v, -self.d)

def derivative(f, x):
    return f(Dual(x, 1.0)).d
`,
        tests: [
          { name: "polynomial", code: `assert derivative(lambda x: 3 * x ** 4 - 2 * x + 7, 2.0) == 94.0 and derivative(lambda x: x * 0 + 5, 1.0) == 0, '12x³ − 2 at 2 is 94.'` },
          { name: "quotient", code: `f = lambda x: (x * x + 1) / (x - 3)
d = derivative(f, 1.0)
assert abs(d - ((2 * 1) * (1 - 3) - (1 + 1)) / (1 - 3) ** 2) < 1e-12, 'Quotient rule.'` },
          { name: "mixed", code: `f = lambda x: 1 / x - x / 2 + 4 - x ** 0.5 * x
h = 1e-6
num = (f(2 + h) - f(2 - h)) / (2 * h)
assert abs(derivative(f, 2.0) - num) < 1e-6, 'Reflected operators and powers.'` },
          { name: "negation", code: `assert derivative(lambda x: -x * x, 3.0) == -6.0, 'Unary minus.'` },
          { name: "exact", code: `f = lambda x: ((x - 1) * (x + 2)) ** 3
assert derivative(f, 0.5) == 3 * ((0.5 - 1) * (0.5 + 2)) ** 2 * (2 * 0.5 + 1), 'Chain of products and a power.'` },
        ],
      },
    },
    {
      key: "recip",
      rung: "prove",
      prompt: (
        <p>
          Prove from the definition that if g is differentiable at x and <M>{"g(x) \\ne 0"}</M>, then{" "}
          <M>{"(1/g)'(x) = -g'(x)/g(x)^2"}</M>. Then deduce the quotient rule.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes the difference quotient as −(g(x + h) − g(x)) / (h g(x + h) g(x)).",
          "Uses continuity of g at x to get g(x + h) → g(x), noting g(x + h) ≠ 0 for small h.",
          "Takes the limit to get −g′(x)/g(x)².",
          "Applies the product rule to f · (1/g) and simplifies to (f′g − fg′)/g².",
        ],
      },
    },
    {
      key: "leibniz",
      rung: "stretch",
      prompt: (
        <p>
          Find and prove a formula for <M>{"(fg)''"}</M>, the second derivative of a product, and then guess the formula for
          the n-th derivative. What does it resemble?
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Differentiates f′g + fg′ with the product rule to get f″g + 2f′g′ + fg″.",
          "Guesses the general Leibniz rule with binomial coefficients.",
          "Notes the resemblance to the binomial theorem, and ideally sketches an induction.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend the product rule, using the picture of a growing rectangle, and why the derivative of a product is not the product of the derivatives.",

  glimpse: (
    <p>
      Next, the chain rule, which differentiates one function applied to another, and is the most important rule of all for machine learning. Every rule here also runs backwards later in the course: the product rule becomes integration by parts. And the functions missing from this lesson, the exponential and the logarithm, get a lesson of their own after the chain rule.
    </p>
  ),
};
