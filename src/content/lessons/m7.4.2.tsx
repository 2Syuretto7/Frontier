import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { JensenViz } from "@/components/viz/JensenViz";
import type { LessonContent } from "@/lib/types";

const TAILS = `import numpy as np

def markov_check(x, a):
    return float(np.mean(x >= a)), float(np.mean(x) / a)

def chebyshev_check(x, k):
    mu, sd = np.mean(x), np.std(x)
    return float(np.mean(np.abs(x - mu) >= k * sd)), 1 / k ** 2`;

const JENSEN = `import math

def jensen_gap(f, xs, ps):
    mean = sum(p * x for x, p in zip(xs, ps))
    return sum(p * f(x) for x, p in zip(xs, ps)) - f(mean)

def kl(p, q):
    return sum(pi * math.log(pi / qi) for pi, qi in zip(p, q) if pi > 0)`;

export const lesson: LessonContent = {
  id: "m7.4.2",
  minutes: 55,
  links: {
    requires: ["m7.4.1", "m2.5.2"],
    revisits: ["m7.2.4"],
    foreshadows: ["m7.7.1", "m12.1.2", "m15.1.1"],
  },

  puzzle: (
    <>
      <p>
        The average salary in a company is ₹50,000. Without knowing anything else, what can you say about the fraction of
        employees earning ₹5,00,000 or more? And a second question that machine learning asks constantly: the log of an
        average versus the average of a log. Which is larger, always?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Three inequalities turn a little information about a distribution into guaranteed statements. Markov: a non-negative
        variable cannot often be much larger than its mean, or the mean would be bigger. Chebyshev: Markov applied to the
        squared deviation, so the variance limits how often X strays from its mean. Jensen: for a convex function, the
        average of the function is at least the function of the average, because chords lie above convex curves.
      </p>
      <JensenViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="Markov's inequality">
        <p>If X ≥ 0 and a &gt; 0, then <M>{"P(X \\ge a) \\le E[X]/a"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          <M>{"X \\ge a\\,\\mathbf{1}[X \\ge a]"}</M> pointwise, since X ≥ 0. Taking expectations,{" "}
          <M>{"E[X] \\ge a\\,P(X \\ge a)"}</M>.
        </p>
      </Proof>
      <p>
        For the puzzle, at most a tenth of employees earn ten times the mean or more. The bound is attained by a variable
        taking only the values 0 and a, so it cannot be improved without more information.
      </p>

      <Theorem title="Chebyshev's inequality">
        <p>
          If X has mean μ and variance σ² &gt; 0, then for every k &gt; 0,{" "}
          <M>{"P(|X - \\mu| \\ge k\\sigma) \\le 1/k^2"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Apply Markov to the non-negative <M>{"(X - \\mu)^2"}</M> with threshold <M>{"k^2\\sigma^2"}</M>:{" "}
          <M>{"P((X - \\mu)^2 \\ge k^2\\sigma^2) \\le \\sigma^2/(k^2\\sigma^2)"}</M>.
        </p>
        <Code>{TAILS}</Code>
      </Proof>
      <Remark title="tight but pessimistic">
        <p>
          Chebyshev is attained by a variable equal to μ ± kσ with probability <M>{"1/(2k^2)"}</M> each and μ otherwise. For
          any particular well-behaved distribution it is very loose: at k = 3 it allows 11%, while a normal has 0.27%. Its
          value is that it needs only a variance, which makes it the key step in the weak law of large numbers.
        </p>
      </Remark>

      <Theorem title="Jensen's inequality">
        <p>
          If φ is convex and X and φ(X) have finite means, then <M>{"\\varphi(E[X]) \\le E[\\varphi(X)]"}</M>. For concave φ
          the inequality reverses.
        </p>
      </Theorem>
      <Proof>
        <p>
          A convex function has a supporting line at every interior point m: there is a slope c with{" "}
          <M>{"\\varphi(x) \\ge \\varphi(m) + c(x - m)"}</M> for all x (for differentiable φ, c = φ′(m)). Take m = E[X] and
          substitute X: <M>{"\\varphi(X) \\ge \\varphi(E[X]) + c(X - E[X])"}</M>. Taking expectations, the last term has mean
          0, leaving <M>{"E[\\varphi(X)] \\ge \\varphi(E[X])"}</M>.
        </p>
      </Proof>

      <Example title="consequences">
        <p>
          With φ(x) = x²: <M>{"E[X]^2 \\le E[X^2]"}</M>, the gap being the variance. With the concave log:{" "}
          <M>{"E[\\log X] \\le \\log E[X]"}</M>, which gives the arithmetic–geometric mean inequality and is the step that
          makes the evidence lower bound (ELBO) of variational inference a lower bound. With φ(x) = 1/x on positive values:{" "}
          <M>{"E[1/X] \\ge 1/E[X]"}</M>.
        </p>
      </Example>

      <Theorem title="Gibbs' inequality">
        <p>
          For pmfs p and q on the same finite set with q &gt; 0 wherever p &gt; 0, the Kullback–Leibler divergence{" "}
          <M>{"D(p \\| q) = \\sum_i p_i\\log(p_i/q_i)"}</M> is at least 0, with equality only when p = q.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let X take the value <M>{"q_i/p_i"}</M> with probability <M>{"p_i"}</M> (over i with <M>{"p_i > 0"}</M>). By Jensen
          for the concave log,{" "}
          <M>{"-D(p \\| q) = E[\\log X] \\le \\log E[X] = \\log\\sum_{p_i > 0}q_i \\le \\log 1 = 0"}</M>. Since log is strictly
          concave, equality needs X constant, so <M>{"q_i = cp_i"}</M>, and then the sums force c = 1.
        </p>
        <Code>{JENSEN}</Code>
      </Proof>
      <p>
        KL divergence is not symmetric: <M>{"D(p \\| q) \\ne D(q \\| p)"}</M> in general. Minimising one or the other
        direction gives different behaviour, mode-covering or mode-seeking, a distinction that runs through variational
        inference and distillation.
      </p>
    </>
  ),

  practice: [
    {
      key: "markov",
      rung: "check",
      prompt: <p>X ≥ 0 has mean 3. What upper bound does Markov&apos;s inequality give for P(X ≥ 12)?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
    {
      key: "cheb",
      rung: "check",
      prompt: <p>X has mean 50 and standard deviation 5. What upper bound does Chebyshev give for P(|X − 50| ≥ 15)? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.1111, tolerance: 0.0001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which inequality is a consequence of Jensen&apos;s inequality, for every random variable X for which the quantities exist?</p>,
      answer: {
        kind: "choice",
        options: ["E[log X] ≤ log E[X] for positive X", "E[X²] ≤ E[X]²", "E[1/X] ≤ 1/E[X] for positive X", "E[√X] ≥ √E[X] for non-negative X"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def markov_check(x, a):
    return float(np.mean(x >= a)), float(np.mean(x) / a)

def chebyshev_check(x, k):
    mu, sd = np.mean(x), np.std(x)
    return float(np.mean(np.abs(x - mu) >= k * sd)), 1 / k ** 2

x = np.array([0.0, 0.0, 0.0, 1.0, 1.0, 2.0, 10.0])
print(markov_check(x, 2.0), markov_check(x, 10.0))
y = np.array([-1.0, -1.0, 1.0, 1.0])
print(chebyshev_check(y, 1.0), chebyshev_check(np.array([0.0] * 98 + [-10.0, 10.0]), 7.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0.2857142857142857, 1.0) (0.14285714285714285, 0.2)\n(1.0, 1.0) (0.02, 0.02040816326530612)",
          "(0.14285714285714285, 1.0) (0.14285714285714285, 0.2)\n(1.0, 1.0) (0.02, 0.02040816326530612)",
          "(0.2857142857142857, 2.0) (0.14285714285714285, 0.2)\n(1.0, 1.0) (0.02, 0.02040816326530612)",
          "(0.2857142857142857, 1.0) (0.14285714285714285, 0.2)\n(0.0, 1.0) (0.02, 0.02040816326530612)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def jensen_gap(f, xs, ps):
    mean = sum(p * x for x, p in zip(xs, ps))
    return sum(p * f(x) for x, p in zip(xs, ps)) - f(mean)

def kl(p, q):
    return sum(pi * math.log(pi / qi) for pi, qi in zip(p, q) if pi > 0)

print(jensen_gap(lambda t: t * t, [0, 2], [0.5, 0.5]), round(jensen_gap(math.exp, [0, 1], [0.5, 0.5]), 4))
print(round(kl([0.5, 0.5], [0.9, 0.1]), 4), round(kl([0.9, 0.1], [0.5, 0.5]), 4), kl([1, 0], [0.5, 0.5]) == math.log(2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.0 0.2104\n0.5108 0.3681 True", "1.0 0.2104\n0.3681 0.5108 True", "2.0 0.2104\n0.5108 0.3681 True", "1.0 0.2104\n0.5108 0.5108 True"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>markov_check(x, a)</C>, returning (empirical P(X ≥ a), the Markov bound mean/a) for an array of non-negative
          samples, and <C>chebyshev_check(x, k)</C>, returning (empirical P(|X − mean| ≥ k·sd), 1/k²), with the population
          standard deviation. Return Python floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def markov_check(x, a):
    return 0.0, 0.0

def chebyshev_check(x, k):
    return 0.0, 0.0
`,
        solution: TAILS,
        tests: [
          { name: "markov", code: `x = np.array([0.0, 0.0, 0.0, 1.0, 1.0, 2.0, 10.0])
e, b = markov_check(x, 2.0)
assert abs(e - 2 / 7) < 1e-12 and abs(b - 1.0) < 1e-12 and isinstance(e, float)
z = np.random.default_rng(0).exponential(1.0, 100000)
for a in (0.5, 1.0, 3.0):
    e, b = markov_check(z, a)
    assert e <= b` },
          { name: "chebyshev", code: `e, b = chebyshev_check(np.array([0.0] * 98 + [-10.0, 10.0]), 7.0)
assert abs(e - 0.02) < 1e-12 and abs(b - 1 / 49) < 1e-12
z = np.random.default_rng(1).normal(size=100000)
e, b = chebyshev_check(z, 2.0)
assert 0.04 < e < 0.05 and b == 0.25` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>jensen_gap(f, xs, ps)</C>, the value E[f(X)] − f(E[X]) for a finite distribution, and <C>kl(p, q)</C>, the
          KL divergence in nats, treating terms with p_i = 0 as 0.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def jensen_gap(f, xs, ps):
    return 0.0

def kl(p, q):
    return 0.0
`,
        solution: JENSEN,
        tests: [
          { name: "gap", code: `assert jensen_gap(lambda t: t * t, [0, 2], [0.5, 0.5]) == 1.0
assert abs(jensen_gap(lambda t: t * t, [1, 2, 6], [0.2, 0.5, 0.3]) - 4.0) < 1e-12
assert jensen_gap(math.log, [1, 4], [0.5, 0.5]) < 0 and abs(jensen_gap(lambda t: 3 * t + 1, [1, 5], [0.3, 0.7])) < 1e-12` },
          { name: "kl", code: `assert abs(kl([0.5, 0.5], [0.9, 0.1]) - 0.5108256) < 1e-6
assert kl([0.2, 0.8], [0.2, 0.8]) == 0 and abs(kl([1, 0], [0.5, 0.5]) - math.log(2)) < 1e-12
import random
random.seed(0)
for _ in range(50):
    a = [random.random() for _ in range(4)]; b = [random.random() for _ in range(4)]
    assert kl([v / sum(a) for v in a], [v / sum(b) for v in b]) >= 0` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove Gibbs&apos; inequality: for pmfs p and q on a finite set with all <M>{"q_i > 0"}</M>,{" "}
          <M>{"\\sum_i p_i\\log(p_i/q_i) \\ge 0"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Introduces a random variable X equal to qᵢ/pᵢ with probability pᵢ (over i with pᵢ > 0), so that −D(p‖q) = E[log X].",
          "Applies Jensen's inequality for the concave logarithm: E[log X] ≤ log E[X].",
          "Computes E[X] = Σ_{pᵢ > 0} qᵢ ≤ 1, so log E[X] ≤ 0, and concludes D(p‖q) ≥ 0.",
        ],
      },
    },
    {
      key: "best",
      rung: "stretch",
      prompt: (
        <p>
          X ≥ 0 has E[X] = 2 and E[X²] = 5. Among Markov applied to X, Markov applied to X², and Chebyshev, which gives the
          smallest bound on P(X ≥ 5), and what is it? Give the bound to four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.1111, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend Markov's, Chebyshev's and Jensen's inequalities, how each is proved, when each is tight, and why Jensen makes the KL divergence non-negative.",

  glimpse: (
    <>
      <p>
        Chebyshev applied to an average of n independent variables gives the weak law of large numbers in one line, in the
        chapter on limit theorems. KL divergence and its relatives are the core of information theory, and sharper tail
        bounds than Chebyshev, for sums of independent bounded variables, are the subject of concentration inequalities.
      </p>
    </>
  ),
};
