import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MleLimitViz } from "@/components/viz/MleLimitViz";
import type { LessonContent } from "@/lib/types";

const SE = `import math

def exp_mle(xs):
    lam = len(xs) / sum(xs)
    return lam, lam / math.sqrt(len(xs))

def wald(est, se, z=1.96):
    return round(est - z * se, 4), round(est + z * se, 4)`;

const SIM = `import numpy as np

def standardised(lam, n, reps=50000, seed=0):
    X = np.random.default_rng(seed).exponential(1 / lam, size=(reps, n))
    lh = 1 / X.mean(axis=1)
    return np.sqrt(n) * (lh - lam) / lam

def coverage(lam, n, reps=50000, seed=0):
    X = np.random.default_rng(seed).exponential(1 / lam, size=(reps, n))
    lh = 1 / X.mean(axis=1)
    return float(np.mean(np.abs(lh - lam) <= 1.96 * lh / np.sqrt(n)))`;

export const lesson: LessonContent = {
  id: "m9.3.5",
  minutes: 60,
  links: {
    requires: ["m9.3.4", "m7.7.2"],
    revisits: ["m5.5.1", "m9.2.2"],
    foreshadows: ["m9.5.1", "m9.4.3"],
  },

  puzzle: (
    <>
      <p>
        Fitting a model by maximum likelihood gives a number, but a report needs an error bar too. For most models the
        MLE has no closed form and its exact distribution is hopeless to compute. Yet statistical software prints a
        standard error next to every fitted coefficient. Where do those standard errors come from?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Near its peak, the log-likelihood looks like a parabola. The location of the peak is driven by the score, a sum of
        n independent terms, so the central limit theorem makes it approximately normal. The curvature, the Fisher
        information, converts the spread of the score into the spread of the peak.
      </p>
      <MleLimitViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="asymptotic normality of the MLE">
        <p>
          Under regularity conditions (identifiability, a support not depending on θ, smooth log-density, θ in the interior
          of the parameter space, and finite positive I(θ)), the MLE is consistent and
        </p>
        <MD>{"\\sqrt{n}\\,(\\hat\\theta_n - \\theta) \\xrightarrow{d} N\\big(0,\\, 1/I(\\theta)\\big)."}</MD>
      </Theorem>
      <Proof>
        <p>
          We take consistency as given and sketch the rest. Let <M>{"S_n(\\theta) = \\sum_i s(\\theta; X_i)"}</M>. Since{" "}
          <M>{"S_n(\\hat\\theta) = 0"}</M>, a Taylor expansion about θ gives, for some <M>{"\\tilde\\theta"}</M> between them,
        </p>
        <MD>{"0 = S_n(\\theta) + (\\hat\\theta - \\theta)\\,S_n'(\\tilde\\theta), \\quad\\text{so}\\quad \\sqrt{n}(\\hat\\theta - \\theta) = \\frac{S_n(\\theta)/\\sqrt{n}}{-S_n'(\\tilde\\theta)/n}."}</MD>
        <p>
          The numerator is a normalised sum of iid terms with mean 0 and variance I(θ), so by the central limit theorem it
          converges to N(0, I). The denominator converges in probability to −E[s′] = I(θ), by the law of large numbers and
          consistency of <M>{"\\tilde\\theta"}</M>. By Slutsky&apos;s theorem the ratio converges to N(0, I)/I, which is N(0, 1/I).
        </p>
      </Proof>

      <Example title="standard errors and Wald intervals">
        <p>
          The theorem says <M>{"\\hat\\theta"}</M> is approximately normal with standard error{" "}
          <M>{"1/\\sqrt{nI(\\hat\\theta)}"}</M>, or <M>{"1/\\sqrt{-\\ell''(\\hat\\theta)}"}</M> using the observed information.
          An approximate 95% interval is <M>{"\\hat\\theta \\pm 1.96\\,\\mathrm{SE}"}</M>. For an exponential rate,{" "}
          <M>{"\\hat\\lambda = 1/\\bar X"}</M>, I(λ) = 1/λ², and the standard error is <M>{"\\hat\\lambda/\\sqrt n"}</M>.
        </p>
        <Code>{SE}</Code>
      </Example>

      <Theorem title="delta method">
        <p>
          If <M>{"\\sqrt n(T_n - \\theta) \\xrightarrow{d} N(0, \\sigma^2)"}</M> and g is differentiable at θ, then{" "}
          <M>{"\\sqrt n(g(T_n) - g(\\theta)) \\xrightarrow{d} N(0, g'(\\theta)^2\\sigma^2)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"g(T_n) - g(\\theta) = (g'(\\theta) + r_n)(T_n - \\theta)"}</M>, where <M>{"r_n \\to 0"}</M> as{" "}
          <M>{"T_n \\to \\theta"}</M> by differentiability. Since <M>{"T_n \\to \\theta"}</M> in probability, r_n → 0 in
          probability. Multiply by √n and apply Slutsky: the limit is g′(θ) times N(0, σ²).
        </p>
      </Proof>

      <Example title="how fast is asymptotic?">
        <p>
          The simulation shows the standardised exponential MLE for n = 5, 50 and 500: its mean (bias) and standard
          deviation approach 0 and 1, and the coverage of the Wald interval approaches 0.95. Coverage happens to be good
          even at n = 5 here, but the bias and skew show the normal approximation is rough for small samples.
        </p>
        <Code>{SIM}</Code>
      </Example>

      <Remark title="misspecification and machine learning">
        <p>
          If the model is wrong, the MLE still converges, to the parameter minimising the KL divergence from the truth, but
          its variance becomes the &quot;sandwich&quot; <M>{"J^{-1} K J^{-1}"}</M>, with J the expected negative Hessian and
          K the variance of the score; robust standard errors estimate this. The same expansion underlies the Laplace
          approximation of a posterior by a normal with covariance equal to the inverse Hessian, used for uncertainty in
          neural networks. For overparameterised networks the regularity conditions fail, so these formulas should not be
          trusted blindly there.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "se",
      rung: "check",
      prompt: <p>An exponential sample of size 100 gives λ̂ = 2. What is the asymptotic standard error of λ̂?</p>,
      answer: { kind: "numeric", value: 0.2, tolerance: 0.0001 },
    },
    {
      key: "bern",
      rung: "check",
      prompt: <p>A Bernoulli sample of size 400 gives p̂ = 0.3. What is the estimated standard error √(p̂(1 − p̂)/n)? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.0229, tolerance: 0.0001 },
    },
    {
      key: "delta",
      rung: "apply",
      prompt: <p>If θ̂ is approximately N(θ, 1/(nI(θ))), what is the approximate variance of g(θ̂) by the delta method?</p>,
      answer: { kind: "choice", options: ["g′(θ)²/(nI(θ))", "g(θ)²/(nI(θ))", "1/(n I(g(θ)))", "g′(θ)/(nI(θ))"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def exp_mle(xs):
    lam = len(xs) / sum(xs)
    return lam, lam / math.sqrt(len(xs))

def wald(est, se, z=1.96):
    return round(est - z * se, 4), round(est + z * se, 4)

xs = [0.5, 1.0, 0.25, 0.25]
print(exp_mle(xs), wald(*exp_mle(xs)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(2.0, 1.0) (0.04, 3.96)", "(0.5, 0.25) (0.01, 0.99)", "(2.0, 0.5) (1.02, 2.98)", "(2.0, 1.0) (1.0, 3.0)"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def standardised(lam, n, reps=50000, seed=0):
    X = np.random.default_rng(seed).exponential(1 / lam, size=(reps, n))
    lh = 1 / X.mean(axis=1)
    return np.sqrt(n) * (lh - lam) / lam

def coverage(lam, n, reps=50000, seed=0):
    X = np.random.default_rng(seed).exponential(1 / lam, size=(reps, n))
    lh = 1 / X.mean(axis=1)
    return float(np.mean(np.abs(lh - lam) <= 1.96 * lh / np.sqrt(n)))

for n in (5, 50, 500):
    z = standardised(2.0, n)
    print(n, round(float(z.mean()), 2), round(float(z.std()), 2), round(coverage(2.0, n), 3))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["5 0.56 1.61 0.956\n50 0.15 1.04 0.951\n500 0.05 1.0 0.949", "5 0.0 1.0 0.95\n50 0.0 1.0 0.95\n500 0.0 1.0 0.95", "5 -0.56 1.61 0.956\n50 -0.15 1.04 0.951\n500 -0.05 1.0 0.949", "5 0.56 0.62 0.956\n50 0.15 0.96 0.951\n500 0.05 1.0 0.949"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>exp_mle(xs)</C>, returning the exponential rate MLE n/Σx and its standard error λ̂/√n, and{" "}
          <C>wald(est, se, z=1.96)</C>, returning the interval endpoints rounded to 4 places.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def exp_mle(xs):
    return 1.0, 1.0

def wald(est, se, z=1.96):
    return est, est
`,
        solution: SE,
        tests: [
          { name: "mle", code: `lam, se = exp_mle([0.1] * 25)
assert abs(lam - 10) < 1e-9 and abs(se - 2) < 1e-9` },
          { name: "wald", code: `assert wald(5, 1) == (3.04, 6.96)
assert wald(0, 2, z=1) == (-2, 2)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>standardised(lam, n, reps=50000, seed=0)</C>, returning the array of √n(λ̂ − λ)/λ over simulated
          exponential samples (default_rng(seed).exponential with scale 1/λ), and{" "}
          <C>coverage(lam, n, reps=50000, seed=0)</C>, the fraction of Wald intervals λ̂ ± 1.96λ̂/√n containing λ.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def standardised(lam, n, reps=50000, seed=0):
    return np.zeros(reps)

def coverage(lam, n, reps=50000, seed=0):
    return 0.0
`,
        solution: SIM,
        tests: [
          { name: "std", code: `z = standardised(1.0, 400, reps=20000)
assert abs(z.mean()) < 0.1 and abs(z.std() - 1) < 0.05` },
          { name: "cov", code: `c = coverage(3.0, 200, reps=20000)
assert abs(c - 0.95) < 0.01` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove the delta method: if √n(Tₙ − θ) converges in distribution to N(0, σ²) and g is differentiable at θ, then √n(g(Tₙ) − g(θ)) converges to N(0, g′(θ)²σ²). You may use Slutsky&apos;s theorem.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes g(Tₙ) − g(θ) = (g′(θ) + rₙ)(Tₙ − θ) with rₙ → 0 as Tₙ → θ, from the definition of the derivative or a mean value argument.",
          "Shows Tₙ → θ in probability (since √n(Tₙ − θ) is bounded in probability), so rₙ → 0 in probability.",
          "Applies Slutsky to √n(g(Tₙ) − g(θ)) = (g′(θ) + rₙ)·√n(Tₙ − θ) to get the N(0, g′(θ)²σ²) limit.",
        ],
      },
    },
    {
      key: "mean",
      rung: "stretch",
      prompt: <p>An exponential sample of size 25 has rate λ = 2. Using the delta method on μ = 1/λ, what is the asymptotic standard error of the MLE 1/λ̂ of the mean?</p>,
      answer: { kind: "numeric", value: 0.1, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why the maximum likelihood estimate is approximately normal with variance 1/(nI), how that gives standard errors and Wald intervals, how the delta method transfers them to functions of the parameter, and when the approximation can fail.",

  glimpse: (
    <>
      <p>
        With approximate distributions for estimators in hand, we can ask yes-or-no questions of data. The next chapter
        builds hypothesis tests, starting from what it means to control the rate of false alarms.
      </p>
    </>
  ),
};
