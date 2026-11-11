import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { StirlingViz } from "@/components/viz/StirlingViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.9.3",
  minutes: 60,
  links: {
    requires: ["m2.9.1", "m2.6.2"],
    revisits: ["m2.7.1"],
    foreshadows: ["m12.1.2", "m4.1.2"],
  },

  puzzle: (
    <>
      <p>
        A deck of 52 cards can be shuffled into 52! orders. How big is that? Multiplying out 52 numbers is tedious, and the
        answer has 68 digits. Yet a quick estimate, good to a fraction of a percent, takes one line.
      </p>
      <p>
        More useful still: how many ways can 1,000 coin flips land with exactly 500 heads? The exact answer is a 300-digit
        number. What simple formula is it close to?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The logarithm turns the product <M>{"n! = 1 \\cdot 2 \\cdots n"}</M> into a sum, <M>{"\\ln 1 + \\ln 2 + \\dots + \\ln n"}</M>,
        and a sum of values of a smooth function is close to its integral. So <M>{"\\ln n!"}</M> is close to{" "}
        <M>{"\\int_1^n \\ln x\\,dx = n\\ln n - n + 1"}</M>. A more careful version of this argument gives Stirling&rsquo;s
        formula. Move n below: both numbers explode, but their ratio settles on 1.
      </p>
      <StirlingViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="bounds from the integral">
        <p>For every whole number <M>{"n \\ge 1"}</M>,</p>
        <MD>{"n\\ln n - n + 1 \\ \\le\\ \\ln n! \\ \\le\\ (n + 1)\\ln(n + 1) - n."}</MD>
        <p>In particular <M>{"\\ln n! = n \\ln n - n + O(\\ln n)"}</M>, and <M>{"\\ln n! \\sim n \\ln n"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          ln is increasing, so on <M>{"[k - 1, k]"}</M>, <M>{"\\ln x \\le \\ln k"}</M>, and on <M>{"[k, k + 1]"}</M>,{" "}
          <M>{"\\ln x \\ge \\ln k"}</M>. Summing over k, <M>{"\\int_1^n \\ln x\\,dx \\le \\sum_{k=2}^n \\ln k \\le \\int_1^{n+1} \\ln x\\,dx"}</M>.
          Evaluate the integrals with <M>{"\\int \\ln x\\,dx = x\\ln x - x"}</M>, found by parts; the upper one is{" "}
          <M>{"(n + 1)\\ln(n + 1) - n"}</M>.
        </p>
      </Proof>

      <Theorem title="Stirling's formula">
        <MD>{"n! \\sim \\sqrt{2\\pi n}\\,\\left(\\frac{n}{e}\\right)^n, \\quad \\text{that is,} \\quad \\frac{n!}{\\sqrt{2\\pi n}\\,(n/e)^n} \\to 1."}</MD>
        <p>The ratio is in fact about <M>{"1 + \\frac{1}{12n}"}</M>, so the relative error is under 1% from n = 9 on.</p>
      </Theorem>
      <Remark title="where the √(2πn) comes from">
        <p>
          The proof writes <M>{"n! = \\Gamma(n + 1) = \\int_0^\\infty x^n e^{-x}\\,dx"}</M>. The integrand peaks at{" "}
          <M>{"x = n"}</M>, and near the peak it looks like a bell curve of width <M>{"\\sqrt n"}</M>. The Gaussian integral of
          that bell is where <M>{"\\sqrt{2\\pi n}"}</M> comes from. This &ldquo;approximate the peak by a Gaussian&rdquo; idea,
          Laplace&rsquo;s method, recurs throughout statistics.
        </p>
      </Remark>

      <Example title="binomial coefficients">
        <p>Stirling gives the size of the central binomial coefficient:</p>
        <MD>{"\\binom{2n}{n} = \\frac{(2n)!}{(n!)^2} \\sim \\frac{4^n}{\\sqrt{\\pi n}}."}</MD>
        <p>
          So among <M>{"2^{1000}"}</M> sequences of 1,000 coin flips, a fraction of about{" "}
          <M>{"1/\\sqrt{500\\pi} \\approx 2.5\\%"}</M> have exactly 500 heads.
        </p>
      </Example>

      <Remark title="entropy">
        <p>
          With the cruder <M>{"\\ln n! \\approx n\\ln n - n"}</M>, the number of ways to choose k items from n, with{" "}
          <M>{"k = pn"}</M>, satisfies
        </p>
        <MD>{"\\ln \\binom{n}{pn} \\approx n\\bigl(-p\\ln p - (1 - p)\\ln(1 - p)\\bigr) = n\\,H(p)."}</MD>
        <p>
          The quantity <M>{"H(p)"}</M> is the entropy of a coin with probability p of heads. Counting arrangements with
          Stirling is how entropy first entered physics, and it is how Information Theory measures how many bits a message
          really needs.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "crude",
      rung: "check",
      prompt: <p>Which is the leading behaviour of <M>{"\\ln n!"}</M> for large n?</p>,
      answer: { kind: "choice", options: ["n ln n − n", "n²", "eⁿ", "ln n"], correct: [0] },
    },
    {
      key: "ratio",
      rung: "check",
      prompt: <p>As n grows, what happens to <M>{"n!"}</M> and its Stirling approximation <M>{"\\sqrt{2\\pi n}(n/e)^n"}</M>?</p>,
      answer: {
        kind: "choice",
        options: ["Their ratio tends to 1, though their difference grows without bound", "Their difference tends to 0", "Their ratio tends to √(2π)"],
        correct: [0],
      },
    },
    {
      key: "ten",
      rung: "apply",
      prompt: <p>Use Stirling&rsquo;s formula to estimate 10!, to the nearest whole number. (The true value is 3,628,800.)</p>,
      answer: { kind: "numeric", value: 3598696, tolerance: 0.0000005 },
    },
    {
      key: "pct",
      rung: "apply",
      prompt: <p>By what percentage does Stirling&rsquo;s formula underestimate 10!? Give two decimal places.</p>,
      answer: { kind: "numeric", value: 0.83, tolerance: 0.01 },
    },
    {
      key: "lnbinom",
      rung: "apply",
      prompt: (
        <p>
          Using <M>{"\\ln n! \\approx n\\ln n - n"}</M>, estimate <M>{"\\ln \\binom{1000}{500}"}</M>. Give one decimal place.
        </p>
      ),
      answer: { kind: "numeric", value: 693.1, tolerance: 0.0002 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
n = 20
stirling = math.sqrt(2 * math.pi * n) * (n / math.e) ** n
print(round(math.factorial(n) / stirling, 4))`}</Code>
          <p>Stirling's approximation is off by a factor of about 1 + 1/(12n). What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 1.0042, tolerance: 0.0002 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
for n in (1, 10, 100):
    s = math.sqrt(2 * math.pi * n) * (n / math.e) ** n
    print(n, round(math.factorial(n) / s, 5))`}</Code>
          <p>The ratio of n! to Stirling's approximation. What is the last value printed?</p>
        </>
      ),
      answer: { kind: "numeric", value: 1.00083, tolerance: 1e-05 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>log_factorial(n)</C> by Stirling: n ln n − n + ½ ln(2πn). Factorials of large n overflow floats, but their logarithms do not.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def log_factorial(n):
    return n * math.log(n)
`,
        solution: `import math

def log_factorial(n):
    return n * math.log(n) - n + 0.5 * math.log(2 * math.pi * n)
`,
        tests: [
          { name: "twenty", code: `assert abs(log_factorial(20) - math.lgamma(21)) < 0.005, 'At n = 20 Stirling is within 0.005 of ln 20!.'` },
          { name: "huge", code: `assert abs(log_factorial(10 ** 6) - math.lgamma(10 ** 6 + 1)) < 1e-6, 'At n = 10⁶ it is extremely accurate.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>log_gamma_stirling(x)</C>, log Γ(x) for real x &gt; 0 to within 1e−13, using Stirling&rsquo;s series (x − ½)log x − x + ½ log 2π + 1/(12x) − 1/(360x³) + 1/(1260x⁵) − 1/(1680x⁷) after shifting x up to at least 15 with log Γ(x) = log Γ(x + 1) − log x. Then write <C>log_binom(n, k)</C>, the logarithm of C(n, k) for real n, k from it, and <C>binom_prob(n, k, p)</C>, the binomial probability C(n, k)pᵏ(1 − p)ⁿ⁻ᵏ computed in logs so that n = 10⁶ works.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def log_gamma_stirling(x):
    return x * math.log(x) - x

def log_binom(n, k):
    return math.log(math.comb(n, k))

def binom_prob(n, k, p):
    return math.comb(n, k) * p ** k * (1 - p) ** (n - k)
`,
        solution: `import math

def log_gamma_stirling(x):
    shift = 0.0
    while x < 15:
        shift -= math.log(x)
        x += 1
    s = (x - 0.5) * math.log(x) - x + 0.5 * math.log(2 * math.pi)
    s += 1 / (12 * x) - 1 / (360 * x ** 3) + 1 / (1260 * x ** 5) - 1 / (1680 * x ** 7)
    return s + shift

def log_binom(n, k):
    return log_gamma_stirling(n + 1) - log_gamma_stirling(k + 1) - log_gamma_stirling(n - k + 1)

def binom_prob(n, k, p):
    return math.exp(log_binom(n, k) + k * math.log(p) + (n - k) * math.log(1 - p))
`,
        tests: [
          { name: "gamma", code: `import math
for x in [0.5, 1, 2.5, 7, 30, 1000.5]:
    assert abs(log_gamma_stirling(x) - math.lgamma(x)) < 1e-13 * max(1, abs(math.lgamma(x))), x` },
          { name: "no lgamma", code: `import inspect
assert 'lgamma' not in inspect.getsource(log_gamma_stirling) and 'factorial' not in inspect.getsource(log_gamma_stirling), 'Use Stirling.'` },
          { name: "binom", code: `import math
assert abs(log_binom(50, 20) - math.log(math.comb(50, 20))) < 1e-10, 'log C(50, 20).'` },
          { name: "huge", code: `import math
v = binom_prob(10 ** 6, 500000, 0.5)
assert abs(v - 1 / math.sqrt(math.pi * 5e5)) < 1e-9, 'The central probability is about 1/√(πn/2).'` },
        ],
      },
    },
    {
      key: "bounds",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"n\\ln n - n + 1 \\le \\ln n! \\le (n + 1)\\ln(n + 1) - n"}</M> by comparing the sum{" "}
          <M>{"\\sum_{k=2}^n \\ln k"}</M> with integrals of ln x. Deduce that <M>{"\\ln n! \\sim n\\ln n"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses that ln is increasing to compare each ln k with the integral over [k − 1, k] (from below) and over [k, k + 1] (from above).",
          "Sums to get ∫₁ⁿ ln x dx ≤ ln n! ≤ ∫₁ⁿ⁺¹ ln x dx.",
          "Evaluates the integrals as n ln n − n + 1 and (n + 1) ln(n + 1) − n.",
          "Divides both bounds by n ln n and shows both tend to 1, so ln n! ∼ n ln n.",
        ],
      },
    },
    {
      key: "bits",
      rung: "stretch",
      prompt: (
        <p>
          Using the full Stirling formula, <M>{"\\binom{2n}{n} \\approx 4^n/\\sqrt{\\pi n}"}</M>, estimate{" "}
          <M>{"\\log_2 \\binom{1000}{500}"}</M>. Give one decimal place.
        </p>
      ),
      answer: { kind: "numeric", value: 994.7, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how turning n! into a sum of logarithms gives Stirling's formula, and how it estimates binomial coefficients and entropy.",

  glimpse: (
    <p>
      Next, the last lesson of the course: a ladder of growth rates, from log n to n!, and how to compare any two of them.
      Information Theory builds entropy on the counting estimate of this lesson, and Discrete Mathematics uses Stirling to
      size the counting problems that arise in algorithms and probability.
    </p>
  ),
};
