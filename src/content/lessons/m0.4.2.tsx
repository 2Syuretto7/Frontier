import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark, Theorem } from "@/components/lesson/Blocks";
import { ExpLogViz } from "@/components/viz/ExpLogViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.4.2",
  minutes: 70,
  links: {
    revisits: ["m0.1.5", "m0.3.5"],
    foreshadows: ["m2.2.1", "m8.2.1"],
  },

  puzzle: (
    <>
      <p>
        A colony of bacteria triples every hour. At noon there are 1000. How many are there at half past twelve? At a
        quarter past?
      </p>
      <p>
        And here is the deeper question. You know what <M>{"3^2"}</M> and <M>{"3^{1/2}"}</M> mean. What could{" "}
        <M>{"3^{\\pi}"}</M> possibly mean, when <M>{"\\pi"}</M> is not a fraction at all?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If the colony triples every hour, it multiplies by the same factor <M>c</M> in each half hour, and two half hours
        make an hour, so <M>{"c^2 = 3"}</M> and <M>{"c = \\sqrt3 = 3^{1/2}"}</M>. At half past twelve there are about{" "}
        <M>{"1000 \\times 1.732 = 1732"}</M>. The same reasoning gives <M>{"3^{1/4} \\approx 1.316"}</M> per quarter hour,
        so about 1316 at a quarter past. Fractional powers are exactly what continuous growth needs.
      </p>
      <p>
        For <M>{"3^\\pi"}</M>, approximate. Since <M>{"3.14 < \\pi < 3.15"}</M>, and larger exponents give larger powers of
        3, the number <M>{"3^\\pi"}</M> must lie between <M>{"3^{3.14}"}</M> and <M>{"3^{3.15}"}</M>, both of which are
        powers with fractional exponents. Narrowing the interval narrows the answer, and the nested intervals close on a
        single real number. Explore the graphs that result.
      </p>
      <ExpLogViz />
    </>
  ),

  theory: (
    <>
      <p>
        Fix a base <M>{"b > 0"}</M>. From the lesson on exponents, <M>{"b^{m/n} = \\sqrt[n]{b^m}"}</M> is defined for
        every fraction <M>{"\\tfrac{m}{n}"}</M>, and the laws of exponents hold. Suppose <M>{"b > 1"}</M>. Then bigger
        fractional exponents give bigger powers, and this is what lets us fill the gaps.
      </p>

      <Definition title="real exponents">
        <p>
          For <M>{"b > 1"}</M> and a real number <M>x</M>, <M>{"b^x"}</M> is the unique real number that lies between{" "}
          <M>{"b^p"}</M> and <M>{"b^q"}</M> for every pair of fractions <M>{"p \\le x \\le q"}</M>. For{" "}
          <M>{"0 < b < 1"}</M>, define <M>{"b^x = (1/b)^{-x}"}</M>, and set <M>{"1^x = 1"}</M>.
        </p>
      </Definition>
      <p>
        That exactly one such number exists comes from the completeness of the real line: the intervals{" "}
        <M>{"[b^p, b^q]"}</M> are nested and their widths shrink to zero as <M>p</M> and <M>q</M> close in on <M>x</M>. We
        take this on trust here; Analysis proves it, and Calculus gives a slicker definition through the exponential series.
      </p>

      <Definition title="exponential function">
        <p>
          For a fixed base <M>{"b > 0"}</M> with <M>{"b \\neq 1"}</M>, the <strong>exponential function</strong> with base{" "}
          <M>b</M> is <M>{"x \\mapsto b^x"}</M>, from all real numbers to the positive reals.
        </p>
      </Definition>

      <Theorem title="properties">
        <p>For <M>{"b > 0"}</M>, <M>{"b \\neq 1"}</M>, and all real <M>x</M> and <M>y</M>:</p>
        <ol>
          <li><M>{"b^{x+y} = b^x b^y"}</M>, <M>{"(b^x)^y = b^{xy}"}</M> and <M>{"b^{-x} = \\tfrac{1}{b^x}"}</M>;</li>
          <li><M>{"b^x > 0"}</M> and <M>{"b^0 = 1"}</M>;</li>
          <li>if <M>{"b > 1"}</M>, then <M>{"x < y"}</M> implies <M>{"b^x < b^y"}</M>; if <M>{"0 < b < 1"}</M>, the inequality reverses;</li>
          <li>so <M>{"x \\mapsto b^x"}</M> is one-to-one, and its range is all the positive reals.</li>
        </ol>
      </Theorem>
      <p>
        The laws pass from fractional exponents to real ones by approximation; we accept them here. The third property, for
        whole-number exponents, you can prove now.
      </p>

      <Proposition title="bigger exponent, bigger power">
        <p>If <M>{"b > 1"}</M> and <M>{"m < n"}</M> are whole numbers, then <M>{"b^m < b^n"}</M>.</p>
      </Proposition>
      <Proof>
        <p>
          <M>{"b^n = b^m \\cdot b^{n-m}"}</M>, and <M>{"b^{n-m}"}</M> is a product of <M>{"n - m \\ge 1"}</M> factors each
          greater than 1, so it is greater than 1. Multiplying the positive number <M>{"b^m"}</M> by something greater than 1
          makes it larger.
        </p>
      </Proof>

      <Remark title="the shape of the graph">
        <p>
          Every graph <M>{"y = b^x"}</M> passes through <M>{"(0, 1)"}</M> and <M>{"(1, b)"}</M>. For <M>{"b > 1"}</M> it
          rises ever more steeply to the right and hugs the <M>x</M>-axis to the left, getting as close as you like without
          touching: the <M>x</M>-axis is a <strong>horizontal asymptote</strong>. Since{" "}
          <M>{"(1/b)^x = b^{-x}"}</M>, the graph for base <M>{"1/b"}</M> is the reflection in the <M>y</M>-axis, a
          transformation from the last chapter.
        </p>
      </Remark>

      <Example title="fitting an exponential model">
        <p>
          A model <M>{"N(t) = A b^t"}</M> is fixed by two observations. Suppose <M>{"N(0) = 500"}</M> and{" "}
          <M>{"N(2) = 4500"}</M>. Then <M>{"A = 500"}</M> and <M>{"500 b^2 = 4500"}</M>, so <M>{"b^2 = 9"}</M> and, since{" "}
          <M>{"b > 0"}</M>, <M>{"b = 3"}</M>. The model predicts <M>{"N(3.5) = 500 \\cdot 3^{3.5} \\approx 23{,}383"}</M>.
        </p>
        <MD>{"\\frac{N(t + 1)}{N(t)} = \\frac{A b^{t+1}}{A b^t} = b"}</MD>
        <p>for every real <M>t</M>, not only whole numbers: the growth factor over any interval of length 1 is the same.</p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "fraction-power",
      rung: "check",
      prompt: <p>Evaluate <M>{"8^{2/3}"}</M>.</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "negative-power",
      rung: "check",
      prompt: <p>Evaluate <M>{"16^{-1/2}"}</M>.</p>,
      answer: { kind: "numeric", value: 0.25 },
    },
    {
      key: "fit",
      rung: "apply",
      prompt: <p>A model <M>{"N(t) = A b^t"}</M> has <M>{"N(0) = 200"}</M> and <M>{"N(3) = 1600"}</M>. What is <M>b</M>?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "equation",
      rung: "apply",
      prompt: <p>Solve <M>{"2^{x + 1} = 32"}</M>.</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "properties",
      rung: "apply",
      prompt: <p>Select every statement that is true for <strong>every</strong> base <M>{"b > 0"}</M> with <M>{"b \\neq 1"}</M>.</p>,
      answer: {
        kind: "choice",
        options: ["b^x > 0 for all real x", "the graph of y = b^x passes through (0, 1)", "b^x increases as x increases", "b^x = b^y only when x = y"],
        correct: [0, 1, 3],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`print([2 ** x for x in range(-2, 4)])`}</Code>
          <p>Negative exponents give reciprocals. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.25, 0.5, 1, 2, 4, 8]", "[-4, -2, 1, 2, 4, 8]", "[0.25, 0.5, 0, 2, 4, 8]", "[4, 2, 1, 2, 4, 8]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
a, b = 3, 2

def f(x):
    return a * b ** x

print(f(0), f(3), f(-1), round(f(1) / f(0), 3) == round(f(5) / f(4), 3))`}</Code>
          <p>An exponential multiplies by the same factor at every step. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3 24 1.5 True", "3 24 -6 True", "1 24 1.5 True", "3 18 1.5 False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            An exponential f(x) = a · bˣ passes through (0, y₀) and (1, y₁). Write <C>fit_exp(y0, y1)</C>, which returns (a, b).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def fit_exp(y0, y1):
    return (y0, y1 - y0)
`,
        solution: `def fit_exp(y0, y1):
    return (y0, y1 / y0)
`,
        tests: [
          { name: "growth", code: `a, b = fit_exp(3, 6)
assert abs(a - 3) < 1e-9 and abs(b - 2) < 1e-9, 'f(0) = a and f(1) = ab.'` },
          { name: "decay", code: `a, b = fit_exp(100, 80)
assert abs(b - 0.8) < 1e-9, 'A ratio below 1 is decay.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Exponential data lie on a straight line after taking logarithms. Write <C>fit_exponential(xs, ys)</C>, which fits y = a·bˣ to positive data by least squares on (x, ln y): with X = xs and Y = ln ys, the slope is m = Σ(X − X̄)(Y − Ȳ)/Σ(X − X̄)² and the intercept c = Ȳ − mX̄. Return (a, b) = (eᶜ, eᵐ). Use only <C>math</C>, not numpy.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def fit_exponential(xs, ys):
    return (ys[0], ys[1] / ys[0])
`,
        solution: `import math

def fit_exponential(xs, ys):
    Y = [math.log(y) for y in ys]
    n = len(xs)
    xb, yb = sum(xs) / n, sum(Y) / n
    m = sum((x - xb) * (y - yb) for x, y in zip(xs, Y)) / sum((x - xb) ** 2 for x in xs)
    c = yb - m * xb
    return (math.exp(c), math.exp(m))
`,
        tests: [
          { name: "exact", code: `a, b = fit_exponential([0, 1, 2, 3], [3, 6, 12, 24])
assert abs(a - 3) < 1e-9 and abs(b - 2) < 1e-9, 'Exact exponential data are fitted exactly.'` },
          { name: "unspaced", code: `a, b = fit_exponential([1, 4, 5, 9], [5 * 0.8 ** x for x in [1, 4, 5, 9]])
assert abs(a - 5) < 1e-9 and abs(b - 0.8) < 1e-9, 'x need not start at 0 or be evenly spaced.'` },
          { name: "noisy", code: `import random
random.seed(1)
xs = list(range(20))
ys = [2 * 1.3 ** x * math.exp(random.gauss(0, 0.05)) for x in xs]
a, b = fit_exponential(xs, ys)
assert abs(b - 1.3) < 0.02 and abs(a - 2) < 0.3, 'Least squares on the logs averages out the noise.'` },
          { name: "least squares", code: `a, b = fit_exponential([0, 1, 2], [1, 3, 4])
assert abs(b - math.exp(math.log(4) / 2)) < 1e-9, 'Use the least-squares slope, not just the first two points.'` },
        ],
      },
    },
    {
      key: "decreasing",
      rung: "prove",
      prompt: (
        <p>
          Prove that if <M>{"0 < b < 1"}</M> and <M>{"m < n"}</M> are whole numbers, then <M>{"b^m > b^n"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes bⁿ = bᵐ · bⁿ⁻ᵐ, or an equivalent factorisation.",
          "Argues that bⁿ⁻ᵐ is a product of at least one factor between 0 and 1, so it lies between 0 and 1.",
          "Uses that bᵐ is positive, so multiplying it by a number less than 1 makes it smaller.",
          "Concludes bᵐ > bⁿ.",
        ],
      },
    },
    {
      key: "compare",
      rung: "stretch",
      prompt: <p>Without a calculator, which is larger: <M>{"2^{300}"}</M> or <M>{"3^{200}"}</M>?</p>,
      answer: { kind: "choice", options: ["2³⁰⁰", "3²⁰⁰", "they are equal"], correct: [1] },
    },
  ],

  teachBack:
    "Explain to a friend what 3 to the power π means, using the idea of trapping it between powers with fractional exponents. Then say why the bacteria at half past twelve number about 1732.",

  glimpse: (
    <p>
      Next, logarithms: the inverse of the exponential function, which answers &ldquo;what power gives this number?&rdquo;.
      In Calculus, limits make the definition of <M>{"b^x"}</M> rigorous, and the exponential function is rebuilt from its
      power series. Analysis proves the nested-interval argument used here from the completeness of the reals.
    </p>
  ),
};
