import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EmptyBinsViz } from "@/components/viz/EmptyBinsViz";
import type { LessonContent } from "@/lib/types";

const BD = `import math

def empty_bins(assignment, m):
    return m - len(set(assignment))

def max_change(f, x, alphabet):
    base, worst = f(x), 0
    for i in range(len(x)):
        for a in alphabet:
            y = list(x)
            y[i] = a
            worst = max(worst, abs(f(y) - base))
    return worst

def mcdiarmid_bound(t, cs):
    return math.exp(-2 * t * t / sum(c * c for c in cs))`;

const APPS = `import math

def ks_stat(samples):
    xs, n = sorted(samples), len(samples)
    return max(max((i + 1) / n - x, x - i / n) for i, x in enumerate(xs))

def expected_empty(n, m):
    return m * (1 - 1 / m) ** n

def mcdiarmid_t(delta, cs):
    return math.sqrt(sum(c * c for c in cs) * math.log(1 / delta) / 2)`;

export const lesson: LessonContent = {
  id: "m15.1.3",
  minutes: 55,
  links: {
    requires: ["m15.1.2"],
    revisits: ["m7.7.1"],
    foreshadows: ["m15.4.2"],
  },

  puzzle: (
    <>
      <p>
        Throw 100 balls into 100 bins at random. The number of empty bins is a complicated function of the throws: whether
        a bin is empty depends on every ball. The counts for different bins are not independent, so Hoeffding&apos;s
        inequality does not apply. Yet in simulation the count is almost always within a few of 37. Is there a general
        reason, one that does not require computing the distribution?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Moving a single ball can change the number of empty bins by at most one. A function of many independent inputs, none
        of which can move it much, cannot itself move much: to change it a lot, many inputs would have to conspire, and
        independent inputs rarely do. The proof reveals the inputs one at a time and treats the running conditional
        expectation as a sum of bounded steps.
      </p>
      <EmptyBinsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="bounded differences">
        <p>
          A function <M>{"f(x_1, \\dots, x_n)"}</M> has <em>bounded differences</em> with constants <M>{"c_1, \\dots, c_n"}</M> if{" "}
          <M>{"|f(x) - f(x')| \\le c_i"}</M> whenever x and x&prime; differ only in coordinate i. <C>max_change</C> measures the
          largest change at one point by trying every replacement.
        </p>
        <Code>{BD}</Code>
      </Definition>

      <Theorem title="McDiarmid’s inequality">
        <p>
          If <M>{"X_1, \\dots, X_n"}</M> are independent and f has bounded differences <M>{"c_i"}</M>, then{" "}
          <M>{"f(X) - \\mathbb{E}f(X)"}</M> is sub-Gaussian with variance proxy <M>{"\\tfrac14\\sum_i c_i^2"}</M>, so
        </p>
        <MD>{"P\\bigl(f(X) - \\mathbb{E}f(X) \\ge t\\bigr) \\le \\exp\\Bigl(-\\frac{2t^2}{\\sum_i c_i^2}\\Bigr)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"Z_k = \\mathbb{E}[f(X) \\mid X_1, \\dots, X_k]"}</M>, so <M>{"Z_0 = \\mathbb{E}f(X)"}</M> and{" "}
          <M>{"Z_n = f(X)"}</M>, and write <M>{"f(X) - \\mathbb{E}f(X) = \\sum_k D_k"}</M> with <M>{"D_k = Z_k - Z_{k-1}"}</M>. Fix{" "}
          <M>{"X_1, \\dots, X_{k-1}"}</M>. By independence, <M>{"Z_k = g(X_k)"}</M> where g(x) averages f over the later
          coordinates with the first k − 1 fixed and the k-th equal to x, and <M>{"Z_{k-1} = \\mathbb{E}g(X_k)"}</M>. Changing x
          changes every term of that average by at most <M>{"c_k"}</M>, so g varies over an interval of length at most{" "}
          <M>{"c_k"}</M>, and <M>{"D_k"}</M> has conditional mean 0 and lies in such an interval. Hoeffding&apos;s lemma (m15.1.2)
          gives <M>{"\\mathbb{E}[e^{\\lambda D_k} \\mid X_1, \\dots, X_{k-1}] \\le e^{\\lambda^2c_k^2/8}"}</M>. Conditioning step by step
          from k = n down to 1,{" "}
          <M>{"\\mathbb{E}e^{\\lambda\\sum_k D_k} \\le e^{\\lambda^2\\sum_k c_k^2/8}"}</M>, which is the variance proxy claimed, and
          the sub-Gaussian tail bound finishes.
        </p>
      </Proof>

      <Example title="empty bins">
        <p>
          With n balls in m bins, a bin is empty with probability <M>{"(1 - 1/m)^n"}</M>, so the expected number of empty bins is{" "}
          <M>{"m(1 - 1/m)^n"}</M>, about 36.6 for n = m = 100. Moving one ball changes the count by at most 1, so{" "}
          <M>{"c_i = 1"}</M> and{" "}
          <M>{"P(|E - \\mathbb{E}E| \\ge t) \\le 2e^{-2t^2/n}"}</M>: with probability 95% the count is within{" "}
          <M>{"\\sqrt{n\\log 40/2} \\approx 13.6"}</M> of its mean. The bound ignores the dependence between bins entirely,
          and pays for it with a constant a few times too large.
        </p>
      </Example>

      <Theorem title="uniform deviations concentrate">
        <p>
          Let <M>{"\\mathcal{F}"}</M> be any class of functions with values in [0, 1] and{" "}
          <M>{"\\Delta = \\sup_{h \\in \\mathcal{F}} \\bigl(\\tfrac1n\\sum_i h(X_i) - \\mathbb{E}h(X)\\bigr)"}</M> for independent
          identically distributed <M>{"X_i"}</M>. Then <M>{"P(\\Delta - \\mathbb{E}\\Delta \\ge t) \\le e^{-2nt^2}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Replacing <M>{"X_i"}</M> changes each average <M>{"\\tfrac1n\\sum h(X_j)"}</M> by at most 1/n, since one term in [0, 1]
          is swapped for another, and if every member of a family of numbers moves by at most 1/n, so does their supremum. McDiarmid with <M>{"c_i = 1/n"}</M> gives <M>{"\\exp(-2t^2/(n \\cdot n^{-2}))"}</M>.
          With the indicators <M>{"h = \\mathbf{1}[x \\le s]"}</M> this covers the Kolmogorov-Smirnov statistic{" "}
          <M>{"\\sup_s |F_n(s) - F(s)|"}</M>, computed by <C>ks_stat</C>: it is within about{" "}
          <M>{"\\sqrt{\\log(1/\\delta)/(2n)}"}</M> of its mean. What that mean is, for a rich class, is the subject of chaining
          (m15.4.2).
        </p>
        <Code>{APPS}</Code>
      </Proof>

      <Remark title="what the method needs">
        <p>
          Independence of the inputs, and a worst-case bound on each input&apos;s influence. The bound is in terms of worst
          cases, so like Hoeffding it ignores variances; where typical influences are much smaller than the worst case,
          sharper tools such as the Efron-Stein inequality for the variance, or Talagrand&apos;s inequalities, do better.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bound",
      rung: "check",
      prompt: <p>A function of 150 independent inputs has bounded differences <M>{"c_i = 1"}</M>. Bound the probability that it exceeds its mean by 15. Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0498, tolerance: 0.00006 },
    },
    {
      key: "empty",
      rung: "check",
      prompt: <p>What is the expected number of empty bins when 200 balls are thrown into 100 bins? Give three decimals.</p>,
      answer: { kind: "numeric", value: 13.398, tolerance: 0.0006 },
    },
    {
      key: "ks",
      rung: "apply",
      prompt: <p>Why does McDiarmid&apos;s inequality apply to the Kolmogorov-Smirnov statistic <M>{"\\sup_s |F_n(s) - F(s)|"}</M> with <M>{"c_i = 1/n"}</M>?</p>,
      answer: {
        kind: "choice",
        options: [
          "Changing one sample changes the empirical CDF by at most 1/n at every point, so the supremum moves by at most 1/n",
          "The samples are bounded between 0 and 1",
          "The empirical CDF is a sum of independent terms",
          "The statistic is always at most 1/n",
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

def empty_bins(assignment, m):
    return m - len(set(assignment))

def max_change(f, x, alphabet):
    base, worst = f(x), 0
    for i in range(len(x)):
        for a in alphabet:
            y = list(x)
            y[i] = a
            worst = max(worst, abs(f(y) - base))
    return worst

def mcdiarmid_bound(t, cs):
    return math.exp(-2 * t * t / sum(c * c for c in cs))

print(empty_bins([0, 2, 2, 5], 6), max_change(lambda y: empty_bins(y, 4), [0, 0, 1, 2], range(4)), max_change(sum, [1, 2, 3], [0, 5]))
print(round(mcdiarmid_bound(10, [1] * 100), 4), round(mcdiarmid_bound(0.1, [1 / 50] * 50), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["3 1 4\n0.1353 0.3679", "3 1 3\n0.1353 0.3679", "3 2 4\n0.1353 0.3679", "2 1 4\n0.1353 0.0067"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def ks_stat(samples):
    xs, n = sorted(samples), len(samples)
    return max(max((i + 1) / n - x, x - i / n) for i, x in enumerate(xs))

def expected_empty(n, m):
    return m * (1 - 1 / m) ** n

def mcdiarmid_t(delta, cs):
    return math.sqrt(sum(c * c for c in cs) * math.log(1 / delta) / 2)

print(ks_stat([0.5]), round(ks_stat([0.1, 0.4, 0.8]), 4), round(expected_empty(100, 100), 3), expected_empty(0, 7))
print(round(mcdiarmid_t(0.05, [1] * 100), 3), round(mcdiarmid_t(0.01, [0.01] * 10000), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.2667 36.603 7.0\n12.239 1.5174",
          "0.5 0.2333 36.603 7.0\n12.239 1.5174",
          "1.0 0.2667 36.603 7.0\n12.239 1.5174",
          "0.5 0.2667 36.788 7.0\n12.239 0.0152",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>empty_bins(assignment, m)</C>, the number of the m bins that no ball was assigned to;{" "}
          <C>max_change(f, x, alphabet)</C>, the largest <M>{"|f(y) - f(x)|"}</M> over all y that differ from the list x in one
          position, the new value taken from alphabet; and <C>mcdiarmid_bound(t, cs)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def empty_bins(assignment, m):
    return 0

def max_change(f, x, alphabet):
    return 0

def mcdiarmid_bound(t, cs):
    return 1.0
`,
        solution: BD,
        tests: [
          { name: "bins", code: `assert empty_bins([0, 2, 2, 5], 6) == 3 and empty_bins([], 4) == 4 and empty_bins([1, 1, 1], 2) == 1
assert max_change(lambda y: empty_bins(y, 4), [0, 0, 1, 2], range(4)) == 1 and max_change(sum, [1, 2, 3], [0, 5]) == 4
assert max_change(max, [3, 1], [0, 1, 2, 3]) == 2 and max_change(len, [1, 2], [7]) == 0
import random
r = random.Random(2)
for _ in range(20):
    x = [r.randrange(5) for _ in range(6)]
    assert max_change(lambda y: empty_bins(y, 5), x, range(5)) <= 1` },
          { name: "bound", code: `import math
assert abs(mcdiarmid_bound(10, [1] * 100) - math.exp(-2)) < 1e-15 and abs(mcdiarmid_bound(0.1, [1 / 50] * 50) - math.exp(-1)) < 1e-12
assert abs(mcdiarmid_bound(15, [1] * 150) - math.exp(-3)) < 1e-15 and abs(mcdiarmid_bound(1, [1, 2]) - math.exp(-0.4)) < 1e-15` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ks_stat(samples)</C>, <M>{"\\sup_s |F_n(s) - s|"}</M> for samples in [0, 1] compared with the uniform
          distribution; <C>expected_empty(n, m)</C>; and <C>mcdiarmid_t(delta, cs)</C>, the deviation t at which the
          one-sided McDiarmid bound equals delta.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def ks_stat(samples):
    return 0.0

def expected_empty(n, m):
    return 0.0

def mcdiarmid_t(delta, cs):
    return 0.0
`,
        solution: APPS,
        tests: [
          { name: "ks", code: `assert ks_stat([0.5]) == 0.5 and abs(ks_stat([0.1, 0.4, 0.8]) - 0.8 / 3) < 1e-12 and abs(ks_stat([0.25, 0.75]) - 0.25) < 1e-12
assert abs(ks_stat([0.9, 0.95, 0.99]) - 0.9) < 1e-12
import random
r = random.Random(0); xs = [r.random() for _ in range(500)]
grid = max(abs(sum(x <= s for x in xs) / 500 - s) for s in [i / 5000 for i in range(5001)])
assert grid <= ks_stat(xs) + 1e-12 and ks_stat(xs) - grid < 0.003` },
          { name: "expectations", code: `import math
assert abs(expected_empty(100, 100) - 100 * 0.99 ** 100) < 1e-12 and expected_empty(0, 7) == 7 and expected_empty(5, 1) == 0
assert abs(mcdiarmid_t(0.05, [1] * 100) - math.sqrt(50 * math.log(20))) < 1e-12 and abs(mcdiarmid_t(0.01, [1 / 1000] * 1000) - math.sqrt(math.log(100) / 2000)) < 1e-12` },
        ],
      },
    },
    {
      key: "ksn",
      rung: "stretch",
      prompt: (
        <p>
          The Kolmogorov-Smirnov statistic of 1000 samples exceeds its mean by t with probability at most 0.01 when t is at
          least what value, by McDiarmid&apos;s inequality? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.048, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Concentration has a geometric face. The next chapter looks at random points in high dimensions, starting with the
        surprising fact that the length of a random vector is almost a constant.
      </p>
    </>
  ),
};
