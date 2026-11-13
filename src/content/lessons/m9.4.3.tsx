import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WilksViz } from "@/components/viz/WilksViz";
import type { LessonContent } from "@/lib/types";

const LRT = `import math

def xlogy(x, y):
    return 0.0 if x == 0 else x * math.log(y)

def lrt_binom(h, n, p0=0.5):
    ph = h / n
    ll1 = xlogy(h, ph) + xlogy(n - h, 1 - ph)
    ll0 = xlogy(h, p0) + xlogy(n - h, 1 - p0)
    return 2 * (ll1 - ll0)`;

const TWO = `import numpy as np

def ll(h, n, p):
    return h * np.log(p) + (n - h) * np.log(1 - p)

def lrt_two(h1, n1, h2, n2):
    p1, p2, p = h1 / n1, h2 / n2, (h1 + h2) / (n1 + n2)
    return float(2 * (ll(h1, n1, p1) + ll(h2, n2, p2) - ll(h1, n1, p) - ll(h2, n2, p)))

def wilks_rate(n, reps=100000, seed=0):
    h = np.random.default_rng(seed).binomial(n, 0.5, size=reps)
    ph = np.clip(h / n, 1e-12, 1 - 1e-12)
    stat = 2 * (ll(h, n, ph) - ll(h, n, 0.5))
    return float(np.mean(stat > 3.841))`;

export const lesson: LessonContent = {
  id: "m9.4.3",
  minutes: 55,
  links: {
    requires: ["m9.4.2", "m9.3.5"],
    revisits: ["m9.1.2", "m5.5.1"],
    foreshadows: ["m9.4.4", "m9.8.1"],
  },

  puzzle: (
    <>
      <p>
        Model A gets 80 of 100 test questions right, model B gets 70 of a different 100. Is A really better? The null
        hypothesis, &quot;both have the same accuracy&quot;, does not say what that accuracy is, so the Neyman-Pearson
        lemma cannot be applied directly. We need a test for hypotheses that leave parameters unspecified.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Fit the model twice: once freely, once forced to obey the null. If forcing it costs a lot of likelihood, the data
        disagree with the null. Remarkably, the cost, measured as twice the drop in log-likelihood, has a universal
        distribution in large samples.
      </p>
      <WilksViz />
    </>
  ),

  theory: (
    <>
      <Definition title="generalised likelihood ratio">
        <p>For H₀: θ ∈ Θ₀ inside a model Θ, the likelihood ratio statistic is</p>
        <MD>{"\\Lambda = \\frac{\\sup_{\\theta \\in \\Theta_0} L(\\theta)}{\\sup_{\\theta \\in \\Theta} L(\\theta)} \\in [0, 1], \\qquad -2\\log\\Lambda = 2\\big(\\ell(\\hat\\theta) - \\ell(\\hat\\theta_0)\\big),"}</MD>
        <p>where <M>{"\\hat\\theta_0"}</M> is the MLE under the null. The test rejects for large −2 log Λ.</p>
      </Definition>

      <Example title="a coin">
        <p>
          For H₀: p = 1/2 with h heads in n flips,{" "}
          <M>{"-2\\log\\Lambda = 2[h\\log\\hat p + (n - h)\\log(1 - \\hat p) - n\\log\\tfrac12]"}</M>, using 0 log 0 = 0. For 15
          heads in 20 it is 5.23, above the chi-squared 95% point 3.841.
        </p>
        <Code>{LRT}</Code>
      </Example>

      <Theorem title="Wilks">
        <p>
          Under regularity conditions and with θ₀ in the interior, if H₀ fixes d of the parameters (more generally,{" "}
          <M>{"d = \\dim\\Theta - \\dim\\Theta_0"}</M>), then under H₀, <M>{"-2\\log\\Lambda \\xrightarrow{d} \\chi^2_d"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          We sketch the case of one parameter and H₀: θ = θ₀. Expand ℓ about the MLE, where ℓ′ vanishes:{" "}
          <M>{"\\ell(\\theta_0) = \\ell(\\hat\\theta) + \\tfrac12 \\ell''(\\tilde\\theta)(\\theta_0 - \\hat\\theta)^2"}</M>. So
        </p>
        <MD>{"-2\\log\\Lambda = \\frac{-\\ell''(\\tilde\\theta)}{n} \\cdot \\big(\\sqrt n(\\hat\\theta - \\theta_0)\\big)^2."}</MD>
        <p>
          The first factor tends to I(θ₀) in probability and <M>{"\\sqrt n(\\hat\\theta - \\theta_0)"}</M> tends to N(0, 1/I),
          so the product tends to I · Z²/I = Z², a χ²₁ variable, by Slutsky and the continuous mapping theorem.
        </p>
      </Proof>

      <Example title="two accuracies">
        <p>
          With independent test sets, the full model has accuracies p₁, p₂ and the null p₁ = p₂ = p, so d = 1. For 80/100
          against 70/100, −2 log Λ = 2.68 &lt; 3.841: the difference is not significant at 5%. The simulation also shows
          how well the χ²₁ approximation calibrates the coin test: for n = 10, the discrete statistic rejects 11% of the time
          rather than 5%.
        </p>
        <Code>{TWO}</Code>
      </Example>

      <Remark title="relatives and uses">
        <p>
          The Wald test, based on <M>{"(\\hat\\theta - \\theta_0)^2 nI(\\hat\\theta)"}</M>, and the score test, based on the
          score at θ₀, have the same χ² limit; the LRT is usually the most reliable of the three in small samples and does
          not depend on the parametrisation. In model building, −2 log Λ between nested models is the difference in
          deviance; information criteria such as AIC penalise each extra parameter by 2, roughly the χ²₁ mean doubled.
          Wilks fails when the null sits on a boundary, such as testing that a variance component is 0.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "coin",
      rung: "check",
      prompt: <p>For 16 heads in 20 flips, what is −2 log Λ for H₀: p = 1/2? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 7.7098, tolerance: 0.0005 },
    },
    {
      key: "df",
      rung: "check",
      prompt: <p>A full model has 5 free parameters and the null model has 2. How many degrees of freedom does the limiting chi-squared distribution have?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
    {
      key: "limit",
      rung: "apply",
      prompt: <p>Under the null hypothesis and regularity conditions, what is the large-sample distribution of −2 log Λ?</p>,
      answer: {
        kind: "choice",
        options: ["Chi-squared with degrees of freedom equal to the number of parameters the null fixes", "Standard normal", "Chi-squared with n − 1 degrees of freedom", "Uniform on [0, 1]"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def xlogy(x, y):
    return 0.0 if x == 0 else x * math.log(y)

def lrt_binom(h, n, p0=0.5):
    ph = h / n
    ll1 = xlogy(h, ph) + xlogy(n - h, 1 - ph)
    ll0 = xlogy(h, p0) + xlogy(n - h, 1 - p0)
    return 2 * (ll1 - ll0)

print(round(lrt_binom(15, 20), 4), round(lrt_binom(10, 20), 4))
print(round(lrt_binom(20, 20), 4), lrt_binom(15, 20) > 3.841)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["5.2325 0.0\n27.7259 True", "5.2325 0.0\nnan True", "2.6162 0.0\n13.8629 False", "5.2325 1.0\n27.7259 True"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def ll(h, n, p):
    return h * np.log(p) + (n - h) * np.log(1 - p)

def lrt_two(h1, n1, h2, n2):
    p1, p2, p = h1 / n1, h2 / n2, (h1 + h2) / (n1 + n2)
    return float(2 * (ll(h1, n1, p1) + ll(h2, n2, p2) - ll(h1, n1, p) - ll(h2, n2, p)))

def wilks_rate(n, reps=100000, seed=0):
    h = np.random.default_rng(seed).binomial(n, 0.5, size=reps)
    ph = np.clip(h / n, 1e-12, 1 - 1e-12)
    stat = 2 * (ll(h, n, ph) - ll(h, n, 0.5))
    return float(np.mean(stat > 3.841))

print(round(lrt_two(80, 100, 70, 100), 4))
print([round(wilks_rate(n), 3) for n in (10, 100, 1000)])`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2.6807\n[0.11, 0.057, 0.054]", "2.6807\n[0.05, 0.05, 0.05]", "5.3614\n[0.11, 0.057, 0.054]", "2.6807\n[0.011, 0.0057, 0.0054]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>xlogy(x, y)</C>, returning x log y with the convention 0 when x = 0, and <C>lrt_binom(h, n, p0=0.5)</C>,
          returning −2 log Λ for testing p = p0 from h successes in n trials.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def xlogy(x, y):
    return x * math.log(y)

def lrt_binom(h, n, p0=0.5):
    return 0.0
`,
        solution: LRT,
        tests: [
          { name: "xlogy", code: `assert xlogy(0, 0) == 0 and abs(xlogy(2, 3) - 2 * 1.0986122886681098) < 1e-12` },
          { name: "lrt", code: `import math
assert abs(lrt_binom(0, 3) - 6 * math.log(2)) < 1e-12
assert abs(lrt_binom(3, 10, 0.3)) < 1e-12 and abs(lrt_binom(7, 10, 0.3) - 8 * math.log(7 / 3)) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ll(h, n, p)</C>, the binomial log-likelihood without the binomial coefficient, <C>lrt_two(h1, n1, h2, n2)</C>,
          the −2 log Λ statistic for equal success probabilities in two independent samples (assume 0 &lt; hᵢ &lt; nᵢ), and{" "}
          <C>wilks_rate(n, reps=100000, seed=0)</C>, the fraction of fair-coin samples whose single-sample statistic exceeds
          3.841, clipping p̂ to [1e-12, 1 − 1e-12].
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ll(h, n, p):
    return 0.0

def lrt_two(h1, n1, h2, n2):
    return 0.0

def wilks_rate(n, reps=100000, seed=0):
    return 0.0
`,
        solution: TWO,
        tests: [
          { name: "two", code: `assert abs(lrt_two(30, 60, 10, 20)) < 1e-9
assert abs(lrt_two(80, 100, 70, 100) - 2.6807) < 1e-3` },
          { name: "rate", code: `r = wilks_rate(400, reps=40000)
assert abs(r - 0.05) < 0.012` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>For a one-parameter model, assume √n(θ̂ − θ₀) → N(0, 1/I(θ₀)) under H₀ and −ℓ″(θ̃)/n → I(θ₀) in probability for any θ̃ between θ̂ and θ₀. Prove that −2 log Λ → χ²₁.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Taylor expands ℓ(θ₀) about θ̂ using ℓ′(θ̂) = 0, giving ℓ(θ₀) = ℓ(θ̂) + ½ℓ″(θ̃)(θ₀ − θ̂)².",
          "Rewrites −2 log Λ as (−ℓ″(θ̃)/n)·(√n(θ̂ − θ₀))².",
          "Uses Slutsky and continuous mapping: the limit is I·(Z/√I)² = Z² with Z standard normal, which is χ²₁.",
        ],
      },
    },
    {
      key: "exp",
      rung: "stretch",
      prompt: <p>An exponential sample of size 10 has mean X̄ = 2. What is −2 log Λ = 2n(X̄ − 1 − log X̄) for H₀: λ = 1? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 6.1371, tolerance: 0.0005 },
    },
  ],

  teachBack:
    "Explain to a friend how the generalised likelihood ratio test compares a free fit with a constrained one, why −2 log Λ is approximately chi-squared by Wilks' theorem, how to count its degrees of freedom, and how it applies to comparing two accuracies.",

  glimpse: (
    <>
      <p>
        So far a test returns only reject or not. Reporting how extreme the statistic was, the p-value, is more
        informative but also much misunderstood; the next lesson defines it carefully and lists the ways it is misused.
      </p>
    </>
  ),
};
