import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark, Theorem } from "@/components/lesson/Blocks";
import { InverseMirrorViz } from "@/components/viz/InverseMirrorViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.3.4",
  minutes: 75,
  links: {
    revisits: ["m0.3.1", "m0.2.2"],
    foreshadows: ["m0.4.3", "m1.7.2", "m1.7.3", "m3.3.3"],
  },

  puzzle: (
    <>
      <p>
        To turn degrees Celsius into Fahrenheit, multiply by <M>{"\\tfrac95"}</M> and then add 32. A friend says that to
        turn Fahrenheit back into Celsius you should divide by <M>{"\\tfrac95"}</M> and then take away 32. Try it on
        100&deg;C. What went wrong, and what is the right rule?
      </p>
      <p>
        And here is a harder one: the squaring function turns 3 into 9. Is there a function that turns every square back
        into the number it came from?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        100&deg;C becomes <M>{"100 \\cdot \\tfrac95 + 32 = 212"}</M>&deg;F. The friend&rsquo;s rule gives{" "}
        <M>{"212 \\div \\tfrac95 - 32 \\approx 85.8"}</M>, which is wrong. To undo a sequence of steps, undo them in{" "}
        <em>reverse order</em>, as you take off your shoes before your socks: first take away 32, then divide by{" "}
        <M>{"\\tfrac95"}</M>. That gives <M>{"180 \\cdot \\tfrac59 = 100"}</M>.
      </p>
      <p>
        Squaring is harder to undo, because 3 and <M>{"-3"}</M> both go to 9: from 9 alone you cannot tell which one you
        started with. A function can be undone only if it never sends two inputs to the same output. On a graph, undoing
        swaps the roles of <M>x</M> and <M>y</M>, which is reflection in the line <M>{"y = x"}</M>. Watch what the
        reflection does to a function that is one-to-one, and to one that is not.
      </p>
      <InverseMirrorViz />
    </>
  ),

  theory: (
    <>
      <Definition title="composition">
        <p>
          If <M>{"f : A \\to B"}</M> and <M>{"g : B \\to C"}</M>, the <strong>composite</strong>{" "}
          <M>{"g \\circ f : A \\to C"}</M> is the function
        </p>
        <MD>{"(g \\circ f)(x) = g(f(x)),"}</MD>
        <p>
          read &ldquo;<M>g</M> after <M>f</M>&rdquo;. It applies <M>f</M> first. More generally, <M>{"g \\circ f"}</M> is
          defined at <M>x</M> only when <M>x</M> is in the domain of <M>f</M> and <M>{"f(x)"}</M> is in the domain of{" "}
          <M>g</M>.
        </p>
      </Definition>

      <Example title="order matters">
        <p>
          Let <M>{"f(x) = x + 1"}</M> and <M>{"g(x) = x^2"}</M>. Then <M>{"(g \\circ f)(x) = (x + 1)^2"}</M> but{" "}
          <M>{"(f \\circ g)(x) = x^2 + 1"}</M>. At <M>{"x = 1"}</M> these are 4 and 2. Composition is not commutative.
          It is, however, associative: <M>{"h \\circ (g \\circ f)"}</M> and <M>{"(h \\circ g) \\circ f"}</M> both send{" "}
          <M>x</M> to <M>{"h(g(f(x)))"}</M>, so brackets can be dropped.
        </p>
      </Example>

      <Definition title="identity, one-to-one, inverse">
        <ul>
          <li>The <strong>identity</strong> on a set <M>A</M> is <M>{"\\mathrm{id}_A(x) = x"}</M>.</li>
          <li>
            A function <M>f</M> is <strong>one-to-one</strong> (or <strong>injective</strong>) if different inputs always
            give different outputs: <M>{"f(x_1) = f(x_2)"}</M> implies <M>{"x_1 = x_2"}</M>.
          </li>
          <li>
            Let <M>R</M> be the range of <M>{"f : A \\to B"}</M>. A function <M>{"g : R \\to A"}</M> is an{" "}
            <strong>inverse</strong> of <M>f</M> if <M>{"g(f(x)) = x"}</M> for every <M>x</M> in <M>A</M> and{" "}
            <M>{"f(g(y)) = y"}</M> for every <M>y</M> in <M>R</M>. We write <M>{"g = f^{-1}"}</M>.
          </li>
        </ul>
      </Definition>

      <Theorem title="when an inverse exists">
        <p>A function has an inverse exactly when it is one-to-one. The inverse, when it exists, is unique.</p>
      </Theorem>
      <Proof>
        <p>
          Suppose <M>f</M> has an inverse <M>g</M>. If <M>{"f(x_1) = f(x_2)"}</M>, apply <M>g</M> to both sides:{" "}
          <M>{"x_1 = g(f(x_1)) = g(f(x_2)) = x_2"}</M>. So <M>f</M> is one-to-one.
        </p>
        <p>
          Conversely, suppose <M>f</M> is one-to-one. Each <M>y</M> in the range is <M>{"f(x)"}</M> for some <M>x</M>,
          and for only one <M>x</M>, since two would contradict being one-to-one. Define <M>{"g(y)"}</M> to be that{" "}
          <M>x</M>. Then <M>{"g(f(x)) = x"}</M> and <M>{"f(g(y)) = y"}</M> by construction. Uniqueness: any inverse must
          send <M>{"f(x)"}</M> to <M>x</M>, so it agrees with <M>g</M> everywhere.
        </p>
      </Proof>

      <p>
        To find a formula for an inverse, write <M>{"y = f(x)"}</M> and solve for <M>x</M> in terms of <M>y</M>. If
        there is exactly one solution for each <M>y</M> in the range, that solution is <M>{"f^{-1}(y)"}</M>.
      </p>

      <Example title="Celsius and Fahrenheit">
        <p>
          <M>{"F = \\tfrac95 C + 32"}</M>. Solving: <M>{"F - 32 = \\tfrac95 C"}</M>, so{" "}
          <M>{"C = \\tfrac59(F - 32)"}</M>. The steps of the inverse are the steps of the original, each undone, in
          reverse order.
        </p>
      </Example>

      <Proposition title="shoes and socks">
        <p>
          If <M>f</M> and <M>g</M> both have inverses and <M>{"g \\circ f"}</M> is defined, then{" "}
          <M>{"(g \\circ f)^{-1} = f^{-1} \\circ g^{-1}"}</M>.
        </p>
      </Proposition>
      <Proof>
        <p>
          <M>{"(f^{-1} \\circ g^{-1})((g \\circ f)(x)) = f^{-1}(g^{-1}(g(f(x)))) = f^{-1}(f(x)) = x"}</M>, and the same
          calculation in the other order gives <M>{"(g \\circ f)(f^{-1}(g^{-1}(y))) = y"}</M>. By uniqueness of inverses,{" "}
          <M>{"f^{-1} \\circ g^{-1}"}</M> is the inverse.
        </p>
      </Proof>

      <Remark title="making a function invertible">
        <p>
          Squaring on all the reals is not one-to-one, so it has no inverse. Restrict its domain to <M>{"x \\ge 0"}</M> and
          it becomes one-to-one, with inverse <M>{"\\sqrt{y}"}</M>. This is why <M>{"\\sqrt{9}"}</M> means 3, never{" "}
          <M>{"-3"}</M>: the square root is the inverse of a <em>restricted</em> squaring function, and{" "}
          <M>{"\\sqrt{x^2} = |x|"}</M>, not <M>x</M>. Logarithms and the inverse trigonometric functions are built the same
          way. Note also that <M>{"f^{-1}(x)"}</M> means the inverse, not <M>{"\\tfrac{1}{f(x)}"}</M>; the notation is
          unfortunate but universal.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "compose",
      rung: "check",
      prompt: <p>Let <M>{"f(x) = 2x + 1"}</M> and <M>{"g(x) = x^2"}</M>. What is <M>{"(g \\circ f)(2)"}</M>?</p>,
      answer: { kind: "numeric", value: 25 },
    },
    {
      key: "compose-other",
      rung: "check",
      prompt: <p>With the same <M>f</M> and <M>g</M>, what is <M>{"(f \\circ g)(2)"}</M>?</p>,
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "inverse-linear",
      rung: "apply",
      prompt: <p>Find <M>{"f^{-1}(x)"}</M> for <M>{"f(x) = \\dfrac{x - 3}{5}"}</M>.</p>,
      answer: { kind: "expression", value: "5x + 3", variables: ["x"] },
    },
    {
      key: "one-to-one",
      rung: "apply",
      prompt: <p>Select every function that is one-to-one on the whole real line.</p>,
      answer: {
        kind: "choice",
        options: ["f(x) = 3x − 7", "f(x) = x²", "f(x) = x³", "f(x) = |x|"],
        correct: [0, 2],
      },
    },
    {
      key: "undo",
      rung: "apply",
      prompt: (
        <p>
          A function multiplies by 4, then subtracts 3, then halves. Its inverse sends 10 to which number?
        </p>
      ),
      answer: { kind: "numeric", value: 5.75 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def f(x):
    return 2 * x + 3

def g(x):
    return (x - 3) / 2

print(f(g(11)), g(f(11)), f(f(1)))`}</Code>
          <p>g undoes f. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["11.0 11.0 13", "11.0 11.0 5", "25 4.0 13", "11 11 13"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def f(x):
    return x + 1

def g(x):
    return 2 * x

def h(x):
    return x - 3

print(f(g(h(5))), h(g(f(5))))`}</Code>
          <p>Composition applies the innermost function first, so the order matters. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["5 9", "9 5", "5 5", "13 9"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>compose_at(f, g, x)</C>, the value (f ∘ g)(x) = f(g(x)), and <C>inverse_linear(m, c, y)</C>, the value at y of the inverse of x ↦ mx + c (m ≠ 0).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def compose_at(f, g, x):
    return g(f(x))

def inverse_linear(m, c, y):
    return m * y + c
`,
        solution: `def compose_at(f, g, x):
    return f(g(x))

def inverse_linear(m, c, y):
    return (y - c) / m
`,
        tests: [
          { name: "compose", code: `def f(x):
    return x + 1
def g(x):
    return x * x
assert compose_at(f, g, 3) == 10 and compose_at(g, f, 3) == 16, 'f ∘ g applies g first: 3² + 1 = 10.'` },
          { name: "inverse", code: `assert all(abs(inverse_linear(2, 3, 2 * x + 3) - x) < 1e-9 for x in range(-5, 6)) and inverse_linear(-1, 4, 0) == 4, 'Undo the steps in reverse order: subtract c, then divide by m.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>inverse_at(f, lo, hi, y)</C> for a continuous, strictly increasing f on [lo, hi] and f(lo) ≤ y ≤ f(hi): it returns x with f(x) ≈ y, found by bisection until the interval is shorter than 1e−12. Also write <C>iterate(f, n, x)</C>, the value of f applied n times to x (just x when n = 0).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def inverse_at(f, lo, hi, y):
    return y

def iterate(f, n, x):
    return f(x)
`,
        solution: `def inverse_at(f, lo, hi, y):
    a, b = lo, hi
    while b - a > 1e-12:
        m = (a + b) / 2
        if f(m) < y:
            a = m
        else:
            b = m
    return (a + b) / 2

def iterate(f, n, x):
    for _ in range(n):
        x = f(x)
    return x
`,
        tests: [
          { name: "cube root", code: `def cube(x):
    return x ** 3
assert abs(inverse_at(cube, 0, 10, 27) - 3) < 1e-9 and abs(inverse_at(cube, 0, 10, 2) - 2 ** (1 / 3)) < 1e-9, 'Bisect on x until f(x) = y.'` },
          { name: "undoes f", code: `import math
def f(x):
    return x + math.exp(x)
assert all(abs(f(inverse_at(f, -5, 5, y)) - y) < 1e-9 for y in [-4, 0, 1, 2.5, 100]), 'f of the answer should be y.'` },
          { name: "iterate", code: `def double(x):
    return 2 * x
assert iterate(double, 0, 3) == 3 and iterate(double, 5, 1) == 32, 'Apply f again and again, n times.'` },
        ],
      },
    },
    {
      key: "compose-injective",
      rung: "prove",
      prompt: (
        <p>
          Prove that if <M>f</M> and <M>g</M> are both one-to-one, and <M>{"g \\circ f"}</M> is defined, then{" "}
          <M>{"g \\circ f"}</M> is one-to-one.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Starts from g(f(x₁)) = g(f(x₂)).",
          "Uses that g is one-to-one to deduce f(x₁) = f(x₂).",
          "Uses that f is one-to-one to deduce x₁ = x₂.",
          "Concludes that g ∘ f is one-to-one.",
        ],
      },
    },
    {
      key: "inverse-rational",
      rung: "stretch",
      prompt: (
        <p>
          Find the inverse of <M>{"f(x) = \\dfrac{2x + 1}{x - 3}"}</M> (defined for <M>{"x \\neq 3"}</M>), as a formula in{" "}
          <M>x</M>.
        </p>
      ),
      answer: { kind: "expression", value: "(3x + 1)/(x - 2)", variables: ["x"] },
    },
  ],

  teachBack:
    "Explain to a friend why undoing 'multiply by 9/5 then add 32' means subtracting 32 first. Then explain why squaring cannot be undone on all numbers, and what we do about it.",

  glimpse: (
    <p>
      Next, transforming graphs: shifting, stretching and reflecting are compositions with very simple functions. The
      logarithm arrives as the inverse of an exponential function, and the inverse trigonometric functions by restricting
      domains, exactly as here. In Proof and Logic, one-to-one is paired with onto, and functions with both properties, the
      bijections, are exactly those with two-sided inverses. Calculus finds the slope of an inverse function, and Linear
      Algebra asks which matrices can be undone.
    </p>
  ),
};
