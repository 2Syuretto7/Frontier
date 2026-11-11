import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { GrowthRateViz } from "@/components/viz/GrowthRateViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.9.4",
  minutes: 55,
  links: {
    requires: ["m2.9.1", "m2.5.5"],
    revisits: ["m0.4.1"],
    foreshadows: ["m4.5.2", "e2.1.1", "m17.5.1"],
  },

  puzzle: (
    <>
      <p>
        Two algorithms solve the same problem. One takes <M>{"n^{10}"}</M> steps on an input of size n; the other takes{" "}
        <M>{"2^n"}</M>. For <M>{"n = 10"}</M>, the first takes ten billion steps and the second about a thousand, so the second
        looks far better.
      </p>
      <p>
        Which would you choose for an input of size 100? Is there a size beyond which the answer never changes again, and can
        you find it without trying every n?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Growth rates form a ladder. Each rung eventually leaves the one below it behind, however large the constants in
        front. The plot uses logarithmic scales on both axes, which is the only way to fit them on one page. Move n and read off
        how long each would take on a fast computer.
      </p>
      <GrowthRateViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the ladder">
        <p>As <M>{"x \\to \\infty"}</M>, for all constants <M>{"a > 0"}</M>, <M>{"b > 1"}</M> and <M>{"k > 0"}</M>,</p>
        <MD>{"(\\ln x)^k = o(x^a), \\qquad x^k = o(b^x), \\qquad b^n = o(n!), \\qquad n! = o(n^n)."}</MD>
        <p>Logarithms lose to every power, powers to every exponential, exponentials to the factorial.</p>
      </Theorem>
      <Proof>
        <p>
          For the first, with <M>{"k = 1"}</M>: <M>{"\\ln x / x^a"}</M> has the form <M>{"\\infty/\\infty"}</M>, and
          L&rsquo;Hôpital&rsquo;s rule gives <M>{"\\frac{1/x}{a x^{a-1}} = \\frac{1}{a x^a} \\to 0"}</M>. A power k follows by
          applying this with <M>{"a/k"}</M> and raising to the k-th power. For the second, apply L&rsquo;Hôpital repeatedly
          until the power of x is used up; the exponential stays in the denominator. For the third, the ratio of consecutive
          terms <M>{"b/(n + 1)"}</M> eventually falls below <M>{"\\tfrac12"}</M>. The last follows from Stirling&rsquo;s
          formula, or directly from <M>{"n!/n^n \\le 1/n"}</M>.
        </p>
      </Proof>

      <Example title="the puzzle">
        <p>
          <M>{"n^{10} < 2^n"}</M> exactly when <M>{"10 \\log_2 n < n"}</M>. Taking logarithms turns the comparison into one
          between a slowly growing and a linearly growing function: the inequality first holds at <M>{"n = 59"}</M> and then
          holds for ever. At <M>{"n = 100"}</M>, <M>{"2^{100}"}</M> is more than ten billion times larger than <M>{"100^{10}"}</M>.
        </p>
      </Example>

      <Remark title="reading log plots">
        <p>
          Taking logarithms is the universal tool for comparing growth. On a plot with a log vertical axis, exponentials{" "}
          <M>{"y = Cb^x"}</M> become straight lines, with slope <M>{"\\log b"}</M>. On a plot with both axes logarithmic, power
          laws <M>{"y = Cx^k"}</M> become straight lines, with slope k, because <M>{"\\log y = \\log C + k\\log x"}</M>. This is
          how scaling laws are found: plot a model&rsquo;s loss against its training compute on log-log axes, and the points
          fall close to a straight line, so loss falls as a power of compute.
        </p>
      </Remark>

      <Remark title="constants still matter">
        <p>
          Asymptotic comparison says what happens eventually, not when. An algorithm with cost <M>{"1000n"}</M> beats one with
          cost <M>{"n^2"}</M> only for <M>{"n > 1000"}</M>. Data Structures and Algorithms uses big-O to choose an approach,
          then measures to choose an implementation.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "order",
      rung: "check",
      prompt: <p>Which list goes from slowest-growing to fastest-growing as n grows?</p>,
      answer: {
        kind: "choice",
        options: ["ln n, √n, n ln n, n², 2ⁿ, n!", "√n, ln n, n², n ln n, n!, 2ⁿ", "ln n, n ln n, √n, 2ⁿ, n², n!"],
        correct: [0],
      },
    },
    {
      key: "loglog",
      rung: "check",
      prompt: <p>Which kind of function appears as a straight line on a plot with both axes logarithmic?</p>,
      answer: { kind: "choice", options: ["A power law, y = Cxᵏ", "An exponential, y = Cbˣ", "A logarithm, y = ln x"], correct: [0] },
    },
    {
      key: "limit",
      rung: "apply",
      prompt: <p>Find <M>{"\\lim_{n \\to \\infty} n^{10}/2^n"}</M>.</p>,
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "slope",
      rung: "apply",
      prompt: <p>On log-log axes, what is the slope of the line for <M>{"y = 5x^{-0.3}"}</M>?</p>,
      answer: { kind: "numeric", value: -0.3 },
    },
    {
      key: "crossover",
      rung: "apply",
      prompt: <p>What is the smallest whole number n ≥ 2 for which <M>{"2^n > n^{10}"}</M>?</p>,
      answer: { kind: "numeric", value: 59 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
n = 50
print(sorted(['n^3', '2^n', 'n log n', 'n!'], key=lambda s: {'n^3': 3 * math.log(n), '2^n': n * math.log(2), 'n log n': math.log(n * math.log(n)), 'n!': math.lgamma(n + 1)}[s]))`}</Code>
          <p>This sorts four functions by their size at n = 50, comparing logarithms. What order does it print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["n log n, n^3, 2^n, n!", "n log n, 2^n, n^3, n!", "n^3, n log n, 2^n, n!", "n log n, n^3, n!, 2^n"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
n = 2
while 2 ** n <= n ** 10:
    n += 1
print(n, 2 ** n > n ** 10)`}</Code>
          <p>Exponentials beat polynomials eventually. For n ≥ 2, when does 2ⁿ first exceed n¹⁰ (after the early region)?</p>
        </>
      ),
      answer: { kind: "numeric", value: 59 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>crossover(logf, logg)</C>, given the logarithms of two functions f and g, which returns the first whole number n ≥ 2 from which on f(n) &gt; g(n) for every n up to 10 000.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def crossover(logf, logg):
    return 2
`,
        solution: `def crossover(logf, logg):
    last = None
    for n in range(2, 10001):
        if logf(n) <= logg(n):
            last = n
    return 2 if last is None else last + 1
`,
        tests: [
          { name: "exp beats cube", code: `import math
assert crossover(lambda n: n * math.log(2), lambda n: 3 * math.log(n)) == 10, '2ⁿ > n³ for every n ≥ 10.'` },
          { name: "exp beats tenth power", code: `import math
assert crossover(lambda n: n * math.log(2), lambda n: 10 * math.log(n)) == 59, '2ⁿ overtakes n¹⁰ for good at 59.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>sort_by_growth(fs)</C>, which orders a dict of named functions from slowest to fastest growing by comparing log f(n) at n = 10¹⁰⁰, where each function is given by its logarithm <C>logf(n)</C> (so huge values never appear), and <C>dominates(logf, logg, n0)</C>, which checks that log f − log g is increasing and positive at n = n0, 2n0, 4n0, …, 2²⁰n0. The tests sort functions such as n!, 2ⁿ, n¹⁰⁰, n^(log n), (log n)¹⁰⁰⁰ and n log n.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def sort_by_growth(fs):
    return sorted(fs)

def dominates(logf, logg, n0):
    return True
`,
        solution: `def sort_by_growth(fs):
    N = 10.0 ** 100
    return sorted(fs, key=lambda name: fs[name](N))

def dominates(logf, logg, n0):
    ds = [logf(n0 * 2.0 ** k) - logg(n0 * 2.0 ** k) for k in range(21)]
    return all(d > 0 for d in ds) and all(b > a for a, b in zip(ds, ds[1:]))
`,
        tests: [
          { name: "sort", code: `import math
fs = {'n!': lambda n: n * math.log(n) - n, '2^n': lambda n: n * math.log(2), 'n^100': lambda n: 100 * math.log(n), 'n^log n': lambda n: math.log(n) ** 2, '(log n)^1000': lambda n: 1000 * math.log(math.log(n)), 'n log n': lambda n: math.log(n) + math.log(math.log(n))}
assert sort_by_growth(fs) == ['n log n', '(log n)^1000', 'n^100', 'n^log n', '2^n', 'n!'], 'Compare logarithms far out.'` },
          { name: "dominates", code: `import math
assert dominates(lambda n: n * math.log(2), lambda n: 10 * math.log(n), 64) and not dominates(lambda n: n * math.log(2), lambda n: 10 * math.log(n), 2), '2ⁿ beats n¹⁰ from n = 59 on, not from n = 2.'` },
          { name: "equal rate", code: `import math
assert not dominates(lambda n: math.log(3) + 2 * math.log(n), lambda n: 2 * math.log(n), 10), '3n² does not dominate n² in growth.'` },
        ],
      },
    },
    {
      key: "lnpower",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"\\ln x / x^a \\to 0"}</M> as <M>{"x \\to \\infty"}</M> for every <M>{"a > 0"}</M>, and deduce that{" "}
          <M>{"x^{1/x} \\to 1"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes the ratio has the form ∞/∞, so L'Hôpital's rule applies.",
          "Differentiates top and bottom to get (1/x)/(a x^(a−1)) = 1/(a xᵃ), which tends to 0.",
          "Writes x^(1/x) = e^((ln x)/x) and uses the result with a = 1.",
          "Uses continuity of the exponential to conclude the limit is e⁰ = 1.",
        ],
      },
    },
    {
      key: "scaling",
      rung: "stretch",
      prompt: (
        <p>
          Suppose a model&rsquo;s loss follows <M>{"L(C) = 2C^{-0.05}"}</M>, where C is training compute. By what factor must
          compute grow to halve the loss?
        </p>
      ),
      answer: { kind: "numeric", value: 1048576, tolerance: 0.000001 },
    },
  ],

  teachBack:
    "Explain to a friend the ladder of growth rates from ln n to n!, why each rung eventually beats the one below, and how log plots make growth rates visible.",

  glimpse: (
    <p>
      This completes Calculus. Its ideas run through everything that follows: Multivariable and Matrix Calculus extends
      derivatives to many variables and to backpropagation, Probability turns integrals into expectations, and Discrete
      Mathematics and Data Structures and Algorithms use the growth ladder to measure the cost of algorithms. Theory of Deep
      Learning asks why loss falls as a power of compute in the first place.
    </p>
  ),
};
