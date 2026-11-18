import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { McEnvelopeViz } from "@/components/viz/McEnvelopeViz";
import type { LessonContent } from "@/lib/types";

const MC = `import numpy as np

def mc_mean(fx):
    m = float(np.mean(fx)); se = float(np.std(fx, ddof=1) / np.sqrt(len(fx)))
    return m, se

def interval(fx, z=1.96):
    m, se = mc_mean(fx)
    return m - z * se, m + z * se

def coverage(f, sample, truth, n, reps, rng):
    hits = 0
    for _ in range(reps):
        lo, hi = interval(f(sample(rng, n))); hits += lo <= truth <= hi
    return hits / reps`;

const AN = `import numpy as np

def rel_error(p, n):
    return float(np.sqrt((1 - p) / (n * p)))

def samples_needed(p, rel):
    return int(np.ceil((1 - p) / (p * rel ** 2)))

def antithetic_mean(f, u):
    return float(np.mean((f(u) + f(1 - u)) / 2))`;

export const lesson: LessonContent = {
  id: "m13.1.1",
  minutes: 45,
  links: {
    requires: ["m7.7.3"],
    revisits: ["m7.7.2"],
    foreshadows: ["m13.1.2", "m13.1.3"],
  },

  puzzle: (
    <>
      <p>
        You estimate an integral by averaging a function at 10,000 random points and report 0.333. A colleague asks how
        many of those digits are real. Another asks why anyone would use random points at all, when a grid of 10,000 points
        gives a far more accurate answer in one dimension. Both questions have the same answer: Monte Carlo error is
        governed by a single number, the variance, which shrinks like 1/n whatever the dimension. Control it and you
        control everything.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A Monte Carlo estimate is a sample mean, so it is itself random. Run it again and you get a different answer. Its
        typical error is the standard deviation of one sample divided by √n: to gain one more correct digit you need a
        hundred times as many samples. That is slow, so the practical art is to make the standard deviation of each sample
        smaller, without changing what it estimates. Pairing each random point with its mirror image is the simplest
        example.
      </p>
      <McEnvelopeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="estimators, bias and variance">
        <p>
          An estimator <M>{"\\hat\\theta_n"}</M> of a number θ is a random variable computed from n samples. Its bias is{" "}
          <M>{"\\mathbb E[\\hat\\theta_n] - \\theta"}</M>, and its mean squared error splits as
        </p>
        <MD>{"\\mathbb E[(\\hat\\theta_n - \\theta)^2] = \\mathrm{bias}^2 + \\mathrm{Var}(\\hat\\theta_n)."}</MD>
        <p>
          The plain Monte Carlo estimator of <M>{"\\theta = \\mathbb E[f(X)]"}</M> is{" "}
          <M>{"\\hat\\theta_n = \\frac1n\\sum_i f(X_i)"}</M> for independent <M>{"X_i"}</M> distributed like X.
        </p>
      </Definition>

      <Theorem title="the plain estimator">
        <p>
          If <M>{"\\sigma^2 = \\mathrm{Var} f(X) < \\infty"}</M>, then <M>{"\\hat\\theta_n"}</M> is unbiased with variance{" "}
          <M>{"\\sigma^2/n"}</M>, and with <M>{"\\hat\\sigma"}</M> the sample standard deviation,{" "}
          <M>{"P(|\\hat\\theta_n - \\theta| \\le 1.96\\,\\hat\\sigma/\\sqrt n) \\to 0.95"}</M>. The rate does not depend on the
          dimension of X.
        </p>
      </Theorem>
      <Proof>
        <p>
          Linearity gives the mean. Independence makes variances add, so{" "}
          <M>{"\\mathrm{Var}(\\hat\\theta_n) = n\\sigma^2/n^2"}</M>. The MSE split comes from expanding{" "}
          <M>{"(\\hat\\theta - \\mathbb E\\hat\\theta + \\mathbb E\\hat\\theta - \\theta)^2"}</M>; the cross term has mean zero.
          The interval follows from the central limit theorem together with <M>{"\\hat\\sigma \\to \\sigma"}</M> (Slutsky). By
          contrast, a product grid of n points in d dimensions has spacing <M>{"n^{-1/d}"}</M>, so a rule of order k has error
          about <M>{"n^{-k/d}"}</M>, which is worse than <M>{"n^{-1/2}"}</M> once d &gt; 2k.
        </p>
        <Code>{MC}</Code>
      </Proof>

      <Theorem title="antithetic variates">
        <p>
          For U uniform on [0, 1] and a monotone f, <M>{"\\mathrm{Cov}(f(U), f(1 - U)) \\le 0"}</M>, so the pair average{" "}
          <M>{"\\tfrac12(f(U) + f(1-U))"}</M> has variance <M>{"\\tfrac12(\\sigma^2 + \\mathrm{Cov}) \\le \\sigma^2/2"}</M>: n pairs beat
          2n independent samples.
        </p>
      </Theorem>
      <Proof>
        <p>
          If g and k are both nondecreasing, then for independent U, V,{" "}
          <M>{"(g(U) - g(V))(k(U) - k(V)) \\ge 0"}</M>; taking expectations gives <M>{"2\\,\\mathrm{Cov}(g(U), k(U)) \\ge 0"}</M>.
          Apply this with g = f and <M>{"k(u) = -f(1 - u)"}</M>, both nondecreasing when f is. The variance of the pair average
          is <M>{"\\tfrac14(\\sigma^2 + \\sigma^2 + 2\\,\\mathrm{Cov})"}</M>. For <M>{"f = e^x"}</M> it falls from 0.242 per sample to
          0.0039 per pair, a factor of about 30 at the same cost.
        </p>
      </Proof>

      <Remark title="when the error bar lies">
        <p>
          Two warnings. For a rare event of probability p, the indicator has <M>{"\\sigma^2 = p(1-p)"}</M>, so the relative error
          is <M>{"\\sqrt{(1-p)/(np)}"}</M>: estimating a probability of 0.00135 to 10% takes about 74,000 samples, and most of
          them say nothing. Importance sampling, two lessons on, fixes that. And if <M>{"\\sigma^2"}</M> is infinite, as for{" "}
          <M>{"f(u) = u^{-0.7}"}</M>, the estimate still converges but slowly and erratically, and <M>{"\\hat\\sigma"}</M> is
          meaningless: an error bar is only as good as the assumption of finite variance.
        </p>
        <Code>{AN}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "se",
      rung: "check",
      prompt: <p>Each sample has standard deviation 2. What is the standard error of the mean of 400 samples?</p>,
      answer: { kind: "numeric", value: 0.1, tolerance: 0.0001 },
    },
    {
      key: "rare",
      rung: "check",
      prompt: <p>How many samples does plain Monte Carlo need to estimate a probability of 0.01 to a relative error of 1%?</p>,
      answer: { kind: "numeric", value: 990000, tolerance: 0 },
    },
    {
      key: "digit",
      rung: "apply",
      prompt: <p>A Monte Carlo estimate has standard error 0.01. To bring it to 0.005 you must</p>,
      answer: {
        kind: "choice",
        options: [
          "use four times as many samples, or reduce the per-sample variance",
          "use twice as many samples",
          "move to a lower-dimensional problem, since the error grows with dimension",
          "report more decimal places",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def mc_mean(fx):
    m = float(np.mean(fx)); se = float(np.std(fx, ddof=1) / np.sqrt(len(fx)))
    return m, se

def interval(fx, z=1.96):
    m, se = mc_mean(fx)
    return m - z * se, m + z * se

def coverage(f, sample, truth, n, reps, rng):
    hits = 0
    for _ in range(reps):
        lo, hi = interval(f(sample(rng, n))); hits += lo <= truth <= hi
    return hits / reps

rng = np.random.default_rng(0); fx = rng.random(10000) ** 2; m, se = mc_mean(fx); print(abs(m - 1 / 3) < 3 * se, round(se, 4))
lo, hi = interval(np.array([1.0, 2.0, 3.0, 4.0])); print(round(lo, 3), round(hi, 3))
print(0.9 < coverage(lambda x: x ** 2, lambda r, n: r.random(n), 1 / 3, 400, 500, np.random.default_rng(1)) < 0.99)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True 0.003\n1.235 3.765\nTrue",
          "True 0.298\n1.235 3.765\nTrue",
          "True 0.003\n1.404 3.596\nTrue",
          "False 0.003\n1.235 3.765\nTrue",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def rel_error(p, n):
    return float(np.sqrt((1 - p) / (n * p)))

def samples_needed(p, rel):
    return int(np.ceil((1 - p) / (p * rel ** 2)))

def antithetic_mean(f, u):
    return float(np.mean((f(u) + f(1 - u)) / 2))

print(round(rel_error(0.5, 100), 3), samples_needed(0.00135, 0.1))
u = np.random.default_rng(2).random(1000); print(abs(antithetic_mean(np.exp, u) - (np.e - 1)) < 0.005, round(float(np.mean(np.exp(u))), 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.1 73975\nTrue 1.7", "0.1 740\nTrue 1.7", "0.05 73975\nTrue 1.7", "0.1 73975\nFalse 1.7"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mc_mean(fx)</C> returning the mean and its standard error (sample standard deviation with ddof = 1);{" "}
          <C>interval(fx, z)</C>; and <C>coverage(f, sample, truth, n, reps, rng)</C>, the fraction of reps whose interval
          contains the truth, where <C>sample(rng, n)</C> draws n inputs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def mc_mean(fx):
    return float(np.mean(fx)), 0.0

def interval(fx, z=1.96):
    m = float(np.mean(fx))
    return m, m

def coverage(f, sample, truth, n, reps, rng):
    return 0.0
`,
        solution: MC,
        tests: [
          { name: "mean", code: `m, se = mc_mean(np.array([1.0, 2.0, 3.0, 4.0])); assert m == 2.5 and abs(se - np.sqrt(5 / 3) / 2) < 1e-12
lo, hi = interval(np.array([1.0, 2.0, 3.0, 4.0]), z=2.0); assert abs(lo - (2.5 - np.sqrt(5 / 3))) < 1e-12 and abs(hi + lo - 5.0) < 1e-12` },
          { name: "coverage", code: `c = coverage(lambda x: x, lambda r, n: r.random(n), 0.5, 200, 400, np.random.default_rng(3)); assert 0.9 < c < 0.99
assert coverage(lambda x: x, lambda r, n: r.random(n), 0.6, 2000, 50, np.random.default_rng(4)) == 0.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rel_error(p, n)</C>, the relative standard error of a plain estimate of a probability p from n samples;{" "}
          <C>samples_needed(p, rel)</C>, the smallest n reaching relative error rel; and <C>antithetic_mean(f, u)</C>, the mean of
          the pair averages over uniform draws u.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rel_error(p, n):
    return 0.0

def samples_needed(p, rel):
    return 1

def antithetic_mean(f, u):
    return float(np.mean(f(u)))
`,
        solution: AN,
        tests: [
          { name: "rare", code: `assert abs(rel_error(0.5, 100) - 0.1) < 1e-12 and samples_needed(0.01, 0.1) == 9900 and samples_needed(0.2, 0.5) == 16` },
          { name: "antithetic", code: `u = np.array([0.1, 0.7, 0.25]); assert abs(antithetic_mean(lambda x: 3 * x + 1, u) - 2.5) < 1e-12
assert abs(antithetic_mean(lambda x: x ** 2, np.array([0.0])) - 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "antivar",
      rung: "stretch",
      prompt: (
        <p>
          For f(u) = u² and U uniform, the variance of one sample is 4/45. What is the variance of the antithetic pair average{" "}
          <M>{"\\tfrac12(U^2 + (1-U)^2)"}</M>? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0056, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Antithetic pairs exploit a known symmetry. Control variates exploit a known integral: subtract something correlated
        with f whose mean you already know, and the variance can drop by the squared correlation.
      </p>
    </>
  ),
};
