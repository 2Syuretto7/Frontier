import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { HoeffdingBernsteinViz } from "@/components/viz/HoeffdingBernsteinViz";
import type { LessonContent } from "@/lib/types";

const HOEFF = `import math

def hoeffding_bound(n, t, a, b):
    return math.exp(-2 * n * t * t / (b - a) ** 2)

def hoeffding_n(t, delta, a, b):
    return math.ceil((b - a) ** 2 * math.log(1 / delta) / (2 * t * t))

def hoeffding_radius(n, delta, a, b):
    return (b - a) * math.sqrt(math.log(1 / delta) / (2 * n))`;

const BERN = `import math

def bernstein_bound(n, t, var, c):
    return math.exp(-n * t * t / (2 * (var + c * t / 3)))

def bernstein_n(t, delta, var, c):
    return math.ceil(2 * (var + c * t / 3) * math.log(1 / delta) / (t * t))

def coverage(trials, n, p, delta, rng):
    radius = math.sqrt(math.log(2 / delta) / (2 * n))
    hits = 0
    for _ in range(trials):
        mean = sum(rng.random() < p for _ in range(n)) / n
        hits += abs(mean - p) <= radius
    return hits / trials`;

export const lesson: LessonContent = {
  id: "m15.1.2",
  minutes: 55,
  links: {
    requires: ["m15.1.1"],
    revisits: ["m7.7.1"],
    foreshadows: ["m15.1.3", "m15.3.1"],
  },

  puzzle: (
    <>
      <p>
        You want to estimate a click-through rate to within half a percentage point with 99% confidence. A bound that uses
        only the fact that each click is 0 or 1 says you need about 92 000 impressions. But you know the rate is around 1%,
        and with that knowledge about 4300 impressions suffice. What extra information makes a twentyfold difference, and
        how does an inequality use it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An average of bounded variables cannot stray far from its mean, because every variable has a bounded effect.
        Hoeffding&apos;s inequality makes this exact using only the range. But a variable that is almost always 0 and rarely
        1 varies much less than its range suggests: its variance is small. Bernstein&apos;s inequality uses the variance as
        well, and gives a Gaussian-type bound with the true variance for moderate deviations.
      </p>
      <HoeffdingBernsteinViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="Hoeffding’s lemma">
        <p>
          If <M>{"a \\le X \\le b"}</M> and <M>{"\\mathbb{E}X = 0"}</M>, then{" "}
          <M>{"\\mathbb{E}e^{\\lambda X} \\le e^{\\lambda^2(b-a)^2/8}"}</M> for all λ: X is sub-Gaussian with variance proxy{" "}
          <M>{"(b-a)^2/4"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"\\psi(\\lambda) = \\log\\mathbb{E}e^{\\lambda X}"}</M>. Then <M>{"\\psi(0) = 0"}</M> and{" "}
          <M>{"\\psi'(0) = \\mathbb{E}X = 0"}</M>. Differentiating twice, <M>{"\\psi''(\\lambda)"}</M> is the variance of X under
          the tilted distribution with density proportional to <M>{"e^{\\lambda x}"}</M>, which is still supported in{" "}
          <M>{"[a, b]"}</M>. Any variable Y in <M>{"[a, b]"}</M> has{" "}
          <M>{"\\operatorname{Var} Y \\le \\mathbb{E}(Y - \\tfrac{a+b}{2})^2 \\le (\\tfrac{b-a}{2})^2"}</M>. So{" "}
          <M>{"\\psi'' \\le (b-a)^2/4"}</M> everywhere, and Taylor&apos;s theorem with remainder gives{" "}
          <M>{"\\psi(\\lambda) \\le \\lambda^2(b-a)^2/8"}</M>.
        </p>
      </Proof>

      <Theorem title="Hoeffding’s inequality">
        <p>
          If <M>{"X_1, \\dots, X_n"}</M> are independent with <M>{"a \\le X_i \\le b"}</M> and mean μ, their average satisfies
        </p>
        <MD>{"P(\\bar X - \\mu \\ge t) \\le \\exp\\Bigl(-\\frac{2nt^2}{(b-a)^2}\\Bigr)."}</MD>
        <p>
          Hence <M>{"n \\ge (b-a)^2\\log(1/\\delta)/(2t^2)"}</M> samples make this at most δ, and with probability at least 1 − δ,{" "}
          <M>{"\\bar X - \\mu < (b-a)\\sqrt{\\log(1/\\delta)/(2n)}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each <M>{"(X_i - \\mu)/n"}</M> lies in an interval of length <M>{"(b-a)/n"}</M>, so by the lemma it is sub-Gaussian with
          variance proxy <M>{"(b-a)^2/(4n^2)"}</M>. By independence (m15.1.1) the average minus μ is sub-Gaussian with variance
          proxy <M>{"(b-a)^2/(4n)"}</M>, and the sub-Gaussian tail bound gives <M>{"\\exp(-t^2 \\cdot 4n/(2(b-a)^2))"}</M>, which
          is the claim. Setting it equal to δ and solving for n or for t gives the other two statements.
        </p>
        <Code>{HOEFF}</Code>
      </Proof>

      <Theorem title="Bernstein’s inequality">
        <p>
          If <M>{"X_1, \\dots, X_n"}</M> are independent with mean μ, variance <M>{"\\sigma^2"}</M> and{" "}
          <M>{"|X_i - \\mu| \\le c"}</M>, then
        </p>
        <MD>{"P(\\bar X - \\mu \\ge t) \\le \\exp\\Bigl(-\\frac{nt^2}{2(\\sigma^2 + ct/3)}\\Bigr)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"Y = X_i - \\mu"}</M>. Since <M>{"|Y|^k \\le c^{k-2}Y^2"}</M> and <M>{"k! \\ge 2 \\cdot 3^{k-2}"}</M> for k ≥ 2, for{" "}
          <M>{"0 < \\lambda < 3/c"}</M>,
        </p>
        <MD>{"\\mathbb{E}e^{\\lambda Y} \\le 1 + \\sum_{k \\ge 2}\\frac{\\lambda^k c^{k-2}\\sigma^2}{k!} \\le 1 + \\frac{\\lambda^2\\sigma^2}{2}\\sum_{j \\ge 0}\\Bigl(\\frac{\\lambda c}{3}\\Bigr)^j = 1 + \\frac{\\lambda^2\\sigma^2}{2(1 - \\lambda c/3)},"}</MD>
        <p>
          which is at most <M>{"\\exp\\bigl(\\lambda^2\\sigma^2/(2(1 - \\lambda c/3))\\bigr)"}</M>. Markov&apos;s inequality for{" "}
          <M>{"e^{\\lambda n(\\bar X - \\mu)}"}</M> and independence give{" "}
          <M>{"P(\\bar X - \\mu \\ge t) \\le \\exp\\bigl(n(-\\lambda t + \\lambda^2\\sigma^2/(2(1-\\lambda c/3)))\\bigr)"}</M>. Put{" "}
          <M>{"D = \\sigma^2 + ct/3"}</M> and <M>{"\\lambda = t/D"}</M>, which is below 3/c. Then <M>{"1 - \\lambda c/3 = \\sigma^2/D"}</M>,
          the second term in the exponent is <M>{"\\lambda^2 D/2 = t^2/(2D)"}</M>, and the exponent is{" "}
          <M>{"n(-t^2/D + t^2/(2D)) = -nt^2/(2D)"}</M>.
        </p>
        <Code>{BERN}</Code>
      </Proof>

      <Example title="the click-through rate">
        <p>
          For a rate near p = 1% measured to <M>{"t = 0.005"}</M> with <M>{"\\delta = 0.01"}</M>, Hoeffding with range [0, 1] needs{" "}
          <M>{"\\log(100)/(2 \\cdot 0.005^2) \\approx 92\\,104"}</M> samples. Bernstein, with <M>{"\\sigma^2 = 0.0099"}</M> and{" "}
          <M>{"c = 0.99"}</M>, needs <M>{"2(\\sigma^2 + ct/3)\\log(100)/t^2 \\approx 4256"}</M>. The ratio is roughly{" "}
          <M>{"(b-a)^2/(4\\sigma^2)"}</M> when t is small compared with <M>{"\\sigma^2/c"}</M>: the range squared over four
          times the variance.
        </p>
      </Example>

      <Remark title="two regimes again">
        <p>
          For <M>{"t \\ll \\sigma^2/c"}</M> the Bernstein exponent is about <M>{"nt^2/(2\\sigma^2)"}</M>, the Gaussian tail with
          the true variance that the central limit theorem suggests; for <M>{"t \\gg \\sigma^2/c"}</M> it is about{" "}
          <M>{"3nt/(2c)"}</M>, an exponential tail. This is the sub-exponential picture of m15.1.1, and it is the right
          answer: no bound with the true variance can stay Gaussian at large deviations for all bounded variables.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "n",
      rung: "check",
      prompt: <p>By Hoeffding, how many samples in [0, 1] make <M>{"P(\\bar X - \\mu \\ge 0.02) \\le 0.01"}</M>?</p>,
      answer: { kind: "numeric", value: 5757, tolerance: 0 },
    },
    {
      key: "radius",
      rung: "check",
      prompt: <p>With 2500 samples in [0, 1] and δ = 0.05, what is the one-sided Hoeffding radius? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0245, tolerance: 0.00006 },
    },
    {
      key: "when",
      rung: "apply",
      prompt: <p>When does Bernstein&apos;s inequality give a much smaller sample size than Hoeffding&apos;s?</p>,
      answer: {
        kind: "choice",
        options: [
          "When the variance is much smaller than the square of the range, as for rare events",
          "When the variables are not independent",
          "When the deviation t is very large compared with the range",
          "When the variables are Gaussian rather than bounded",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def hoeffding_bound(n, t, a, b):
    return math.exp(-2 * n * t * t / (b - a) ** 2)

def hoeffding_n(t, delta, a, b):
    return math.ceil((b - a) ** 2 * math.log(1 / delta) / (2 * t * t))

def hoeffding_radius(n, delta, a, b):
    return (b - a) * math.sqrt(math.log(1 / delta) / (2 * n))

print(round(hoeffding_bound(100, 0.1, 0, 1), 4), hoeffding_n(0.01, 0.05, 0, 1), round(hoeffding_radius(10000, 0.05, 0, 1), 4))
print(hoeffding_n(0.1, 0.05, -1, 1), round(hoeffding_radius(100, 0.01, 0, 10), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.1353 14979 0.0122\n600 1.517", "0.1353 14978 0.0122\n600 1.517", "0.1353 14979 0.0122\n150 1.517", "0.3679 14979 0.0122\n600 0.152"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def bernstein_bound(n, t, var, c):
    return math.exp(-n * t * t / (2 * (var + c * t / 3)))

def bernstein_n(t, delta, var, c):
    return math.ceil(2 * (var + c * t / 3) * math.log(1 / delta) / (t * t))

def coverage(trials, n, p, delta, rng):
    radius = math.sqrt(math.log(2 / delta) / (2 * n))
    hits = 0
    for _ in range(trials):
        mean = sum(rng.random() < p for _ in range(n)) / n
        hits += abs(mean - p) <= radius
    return hits / trials

print(round(-math.log(bernstein_bound(100, 0.1, 0.01, 1)), 3), round(bernstein_bound(100, 0.1, 0.25, 1), 4), bernstein_n(0.01, 0.05, 0.0099, 1))
import random; print(coverage(2000, 50, 0.3, 0.1, random.Random(1)) >= 0.9, bernstein_n(0.1, 0.05, 0.25, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["11.538 0.1712 793\nTrue 170", "11.538 0.1353 793\nTrue 170", "2.0 0.1712 793\nTrue 170", "11.538 0.1712 14979\nTrue 600"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>hoeffding_bound(n, t, a, b)</C>, <C>hoeffding_n(t, delta, a, b)</C>, the smallest whole n that makes the
          bound at most delta, and <C>hoeffding_radius(n, delta, a, b)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def hoeffding_bound(n, t, a, b):
    return 1.0

def hoeffding_n(t, delta, a, b):
    return 1

def hoeffding_radius(n, delta, a, b):
    return b - a
`,
        solution: HOEFF,
        tests: [
          { name: "bound", code: `import math
assert abs(hoeffding_bound(100, 0.1, 0, 1) - math.exp(-2)) < 1e-15 and abs(hoeffding_bound(50, 1, -1, 3) - math.exp(-100 / 16)) < 1e-15
assert hoeffding_n(0.01, 0.05, 0, 1) == 14979 and hoeffding_n(0.1, 0.05, -1, 1) == 600 and hoeffding_n(0.02, 0.01, 0, 1) == 5757
for t, d in [(0.03, 0.1), (0.05, 0.001)]:
    n = hoeffding_n(t, d, 0, 1)
    assert hoeffding_bound(n, t, 0, 1) <= d < hoeffding_bound(n - 1, t, 0, 1)` },
          { name: "radius", code: `import math
assert abs(hoeffding_radius(10000, 0.05, 0, 1) - math.sqrt(math.log(20) / 20000)) < 1e-15 and abs(hoeffding_radius(100, 0.01, 0, 10) - 10 * math.sqrt(math.log(100) / 200)) < 1e-12
r = hoeffding_radius(400, 0.2, 2, 5)
assert abs(hoeffding_bound(400, r, 2, 5) - 0.2) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bernstein_bound(n, t, var, c)</C>; <C>bernstein_n(t, delta, var, c)</C>; and{" "}
          <C>coverage(trials, n, p, delta, rng)</C>, which repeats trials times: draw n Bernoulli(p) samples with{" "}
          <C>rng.random() &lt; p</C>, and count whether the mean is within the two-sided Hoeffding radius{" "}
          <M>{"\\sqrt{\\log(2/\\delta)/(2n)}"}</M> of p, returning the fraction that are.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def bernstein_bound(n, t, var, c):
    return 1.0

def bernstein_n(t, delta, var, c):
    return 1

def coverage(trials, n, p, delta, rng):
    return 0.0
`,
        solution: BERN,
        tests: [
          { name: "bernstein", code: `import math
assert abs(bernstein_bound(100, 0.1, 0.25, 1) - math.exp(-1 / (2 * (0.25 + 1 / 30)))) < 1e-15 and bernstein_n(0.01, 0.05, 0.0099, 1) == 793
assert bernstein_n(0.1, 0.05, 0.25, 1) == 170 and bernstein_n(0.005, 0.01, 0.0099, 0.99) == 4256
n = bernstein_n(0.02, 0.01, 0.05, 1)
assert bernstein_bound(n, 0.02, 0.05, 1) <= 0.01 < bernstein_bound(n - 1, 0.02, 0.05, 1)` },
          { name: "coverage", code: `import random
c = coverage(2000, 50, 0.3, 0.1, random.Random(1))
assert 0.9 <= c <= 1.0 and coverage(10, 20, 0.0, 0.5, random.Random(0)) == 1.0
class Fixed:
    def __init__(self): self.i = 0
    def random(self):
        self.i += 1
        return 0.0 if self.i % 2 else 0.99
assert coverage(3, 10, 0.5, 0.5, Fixed()) == 1.0 and coverage(3, 10, 0.9, 0.5, Fixed()) == 0.0` },
        ],
      },
    },
    {
      key: "ratio",
      rung: "stretch",
      prompt: (
        <p>
          For a Bernoulli rate p = 0.01 (so σ² = 0.0099 and c = 0.99), how many samples does Bernstein&apos;s inequality need
          to make <M>{"P(\\bar X - p \\ge 0.002) \\le 0.05"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 15818, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Averages are one function of many independent variables. The next lesson extends concentration to any function
        that no single variable can change much, by the method of bounded differences.
      </p>
    </>
  ),
};
