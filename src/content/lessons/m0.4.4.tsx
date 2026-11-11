import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { SlideRuleViz } from "@/components/viz/SlideRuleViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.4.4",
  minutes: 70,
  links: {
    revisits: ["m0.2.5"],
    foreshadows: ["m0.4.5", "m2.4.2"],
  },

  puzzle: (
    <>
      <p>
        Before calculators, astronomers spent weeks multiplying long numbers by hand: <M>{"3{,}782{,}511 \\times 6{,}409{,}327"}</M>,
        over and over, to predict where the planets would be. Adding such numbers is quick; multiplying them is slow and
        error-prone.
      </p>
      <p>
        Is there a way to turn multiplication into addition? Look at the powers of 2: 2, 4, 8, 16, 32, 64, 128. Multiply 8
        by 16. What do you notice about the exponents?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        <M>{"8 \\times 16 = 2^3 \\times 2^4 = 2^7 = 128"}</M>. To multiply two powers, add their exponents. So if every
        number could be written as a power of one fixed base, multiplication would become addition of exponents, and a
        table of exponents would replace long multiplication. The exponents are logarithms.
      </p>
      <p>
        In 1614 John Napier published the first tables of logarithms, and within a few years Henry Briggs had produced
        tables to base 10. Johannes Kepler used them for his planetary calculations. The slide rule, invented soon after, puts
        the idea into a ruler: mark each number at a distance equal to its logarithm, and sliding one scale along another adds
        lengths, which multiplies numbers. Try it.
      </p>
      <SlideRuleViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the laws of logarithms">
        <p>Let <M>{"b > 0"}</M>, <M>{"b \\neq 1"}</M>. For all <M>{"x, y > 0"}</M> and every real <M>r</M>:</p>
        <MD>{"\\log_b(xy) = \\log_b x + \\log_b y, \\qquad \\log_b \\frac{x}{y} = \\log_b x - \\log_b y, \\qquad \\log_b(x^r) = r \\log_b x."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"u = \\log_b x"}</M> and <M>{"v = \\log_b y"}</M>, so <M>{"x = b^u"}</M> and <M>{"y = b^v"}</M>. Then{" "}
          <M>{"xy = b^u b^v = b^{u + v}"}</M>, so <M>{"\\log_b(xy) = u + v"}</M>. Similarly{" "}
          <M>{"\\tfrac{x}{y} = b^{u - v}"}</M>, and <M>{"x^r = (b^u)^r = b^{ru}"}</M>, so{" "}
          <M>{"\\log_b(x^r) = ru"}</M>. Each law of logarithms is a law of exponents, read backwards.
        </p>
      </Proof>

      <Theorem title="change of base">
        <p>For bases <M>b</M> and <M>c</M> (positive, not 1) and every <M>{"x > 0"}</M>,</p>
        <MD>{"\\log_b x = \\frac{\\log_c x}{\\log_c b}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"u = \\log_b x"}</M>, so <M>{"b^u = x"}</M>. Take <M>{"\\log_c"}</M> of both sides and use the power law:{" "}
          <M>{"u \\log_c b = \\log_c x"}</M>. Since <M>{"b \\neq 1"}</M>, <M>{"\\log_c b \\neq 0"}</M>, and we can divide.
        </p>
      </Proof>
      <p>So one table, or one calculator button, gives logarithms to every base.</p>

      <Example title="solving exponential equations">
        <p>Solve <M>{"3^x = 20"}</M>. Take common logarithms of both sides:</p>
        <MD>{"x \\log 3 = \\log 20, \\qquad x = \\frac{\\log 20}{\\log 3} \\approx \\frac{1.3010}{0.4771} \\approx 2.727."}</MD>
        <p>
          Check: <M>{"3^{2.727}"}</M> lies between <M>{"3^2 = 9"}</M> and <M>{"3^3 = 27"}</M>, nearer the top, as it should.
        </p>
      </Example>

      <Example title="doubling time">
        <p>
          Money growing at <M>p</M> percent a year doubles after <M>n</M> years, where <M>{"(1 + \\tfrac{p}{100})^n = 2"}</M>.
          So <M>{"n = \\dfrac{\\log 2}{\\log(1 + p/100)}"}</M>. At 7 percent, <M>{"n = \\tfrac{0.3010}{0.0294} \\approx 10.2"}</M>{" "}
          years. Bankers&rsquo; rule of thumb, &ldquo;divide 70 by the percentage&rdquo;, gives 10; the end of this chapter
          explains why it works.
        </p>
      </Example>

      <Definition title="what logarithms do not do">
        <p>There is no law for the logarithm of a sum. In general</p>
        <MD>{"\\log(x + y) \\neq \\log x + \\log y, \\qquad \\log(x)\\log(y) \\neq \\log(xy), \\qquad \\frac{\\log x}{\\log y} \\neq \\log \\frac{x}{y}."}</MD>
        <p>Test with <M>{"x = y = 10"}</M>: <M>{"\\log 20 \\approx 1.30"}</M>, but <M>{"\\log 10 + \\log 10 = 2"}</M>.</p>
      </Definition>

      <Remark title="an early isomorphism">
        <p>
          The first law says that the logarithm turns the positive numbers under multiplication into all real numbers under
          addition, matching one structure exactly with the other. Mathematicians call such a structure-preserving
          correspondence an isomorphism, and this is the first example most of them ever meet.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sum",
      rung: "check",
      prompt: <p>Evaluate <M>{"\\log_{10} 2 + \\log_{10} 50"}</M>.</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "difference",
      rung: "check",
      prompt: <p>Evaluate <M>{"\\log_2 48 - \\log_2 3"}</M>.</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "expand",
      rung: "apply",
      prompt: (
        <p>
          Let <M>{"a = \\log x"}</M> and <M>{"b = \\log y"}</M>. Write <M>{"\\log(x^3 y^2)"}</M> in terms of <M>a</M> and{" "}
          <M>b</M>.
        </p>
      ),
      answer: { kind: "expression", value: "3a + 2b", variables: ["a", "b"] },
    },
    {
      key: "identities",
      rung: "apply",
      prompt: <p>Select every statement that is true for all positive <M>x</M> and <M>y</M>.</p>,
      answer: {
        kind: "choice",
        options: ["log(x²) = 2 log x", "log(x + y) = log x + log y", "log(1/x) = −log x", "log(xy) = log x · log y"],
        correct: [0, 2],
      },
    },
    {
      key: "double",
      rung: "apply",
      prompt: (
        <p>
          Money grows by 7 percent each year, compounded yearly. What is the least whole number of years after which it has
          at least doubled?
        </p>
      ),
      answer: { kind: "numeric", value: 11 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
a, b = 8, 32
print(math.log2(a * b), math.log2(a) + math.log2(b), math.log2(b / a))`}</Code>
          <p>Logarithms turn products into sums. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["8.0 8.0 2.0", "8.0 15.0 2.0", "256.0 8.0 4.0", "8.0 8.0 -2.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
x, y = 8, 32
print(math.log2(x * y), math.log2(x) + math.log2(y), math.log(y, x), math.log10(1000) * 2)`}</Code>
          <p>Product rule, change of base, and a power. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["8.0 8.0 1.6666666666666667 6.0", "8.0 8.0 4.0 6.0", "8.0 8.0 1.6666666666666667 2000.0", "256.0 8.0 1.6666666666666667 6.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>log_base(x, b)</C> using only <C>math.log</C> and the change-of-base law, and <C>digits(n)</C>, the number of decimal digits of a positive integer n, using <C>math.log10</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def log_base(x, b):
    return math.log(x) * math.log(b)

def digits(n):
    return round(math.log10(n))
`,
        solution: `import math

def log_base(x, b):
    return math.log(x) / math.log(b)

def digits(n):
    return math.floor(math.log10(n)) + 1
`,
        tests: [
          { name: "change of base", code: `assert abs(log_base(81, 3) - 4) < 1e-9 and abs(log_base(0.5, 4) + 0.5) < 1e-9, 'log_b x = ln x / ln b.'` },
          { name: "digits", code: `assert digits(1) == 1 and digits(999) == 3 and digits(1000) == 4 and digits(2 ** 100) == 31, 'A number with d digits has log₁₀ between d − 1 and d.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Logarithms turn huge products into sums. Write <C>log10_factorial(n)</C>, log₁₀ n! as a sum of logarithms, and <C>leading_digits(n, k)</C>, the first k digits of n! as an integer, found from the fractional part of log₁₀ n! (10 raised to the fraction, times 10ᵏ⁻¹, rounded down). Also write <C>num_digits(n)</C>, the number of digits of n!. Do not compute n! itself: the tests use n up to 10⁵.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def log10_factorial(n):
    return math.log10(math.factorial(n))

def num_digits(n):
    return len(str(math.factorial(n)))

def leading_digits(n, k):
    return int(str(math.factorial(n))[:k])
`,
        solution: `import math

def log10_factorial(n):
    return math.fsum(math.log10(i) for i in range(2, n + 1))

def num_digits(n):
    return math.floor(log10_factorial(n)) + 1

def leading_digits(n, k):
    L = log10_factorial(n)
    return int(10 ** (L - math.floor(L) + k - 1))
`,
        tests: [
          { name: "small", code: `import math
assert abs(log10_factorial(10) - math.log10(3628800)) < 1e-12 and num_digits(10) == 7 and num_digits(1) == 1 and num_digits(0) == 1, '10! = 3628800 has 7 digits.'` },
          { name: "leading", code: `assert leading_digits(10, 3) == 362 and leading_digits(20, 4) == 2432 and leading_digits(100, 5) == 93326, '100! starts 93326…'` },
          { name: "large", code: `assert num_digits(1000) == 2568 and leading_digits(1000, 4) == 4023, '1000! has 2568 digits and starts 4023.'` },
          { name: "fast", code: `import time, math
real = math.factorial
def no(*a):
    raise AssertionError('Do not compute n! itself.')
math.factorial = no
try:
    t = time.time()
    d = num_digits(100000)
    assert d == 456574 and time.time() - t < 5, d
finally:
    math.factorial = real` },
        ],
      },
    },
    {
      key: "product-law",
      rung: "prove",
      prompt: <p>Prove that <M>{"\\log_b(x^r) = r\\log_b x"}</M> for every <M>{"x > 0"}</M> and real <M>r</M>, using only the definition of the logarithm and the laws of exponents.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Sets u = log_b x, so that bᵘ = x.",
          "Computes xʳ = (bᵘ)ʳ = b^(ru) using a law of exponents.",
          "Concludes from the definition that log_b(xʳ) = ru = r log_b x.",
        ],
      },
    },
    {
      key: "chain",
      rung: "stretch",
      prompt: <p>Evaluate <M>{"\\log_2 3 \\cdot \\log_3 4 \\cdot \\log_4 5 \\cdot \\log_5 6 \\cdot \\log_6 7 \\cdot \\log_7 8"}</M>.</p>,
      answer: { kind: "numeric", value: 3 },
    },
  ],

  teachBack:
    "Explain to a friend how a slide rule multiplies by adding lengths, and which law of logarithms makes it work.",

  glimpse: (
    <p>
      Next, the number <M>e</M> and continuous growth, where a natural base for logarithms appears from compound interest.
      In Calculus, the laws of logarithms make differentiation of products and powers easy, through logarithmic
      differentiation. In machine learning, the same law turns a product of many small probabilities into a sum of their
      logarithms, the log-likelihood that models are trained to maximise.
    </p>
  ),
};
