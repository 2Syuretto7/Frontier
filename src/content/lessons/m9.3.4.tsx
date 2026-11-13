import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CramerRaoViz } from "@/components/viz/CramerRaoViz";
import type { LessonContent } from "@/lib/types";

const BOUND = `def cr_bound(dpsi, info, n):
    return dpsi * dpsi / (n * info)

def efficiency(var, dpsi, info, n):
    return cr_bound(dpsi, info, n) / var`;

const SIM = `import numpy as np

def var_s2(n, reps=200000, seed=0):
    X = np.random.default_rng(seed).normal(size=(reps, n))
    return float(X.var(axis=1, ddof=1).var())

def rb_eff(lam, n):
    var = np.exp(-2 * lam) * (np.exp(lam / n) - 1)
    bound = lam * np.exp(-2 * lam) / n
    return float(bound / var)`;

export const lesson: LessonContent = {
  id: "m9.3.4",
  minutes: 55,
  links: {
    requires: ["m9.3.3", "m7.5.2"],
    revisits: ["m9.2.4", "m9.3.1"],
    foreshadows: ["m9.3.5", "m9.8.4"],
  },

  puzzle: (
    <>
      <p>
        You have found an unbiased estimator. Could a cleverer one, with the same lack of bias, have a smaller variance? If
        you could prove that nothing does better, you could stop searching. For many models there is such a proof, and the
        floor it gives depends only on the Fisher information.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An unbiased estimator must move with θ: its mean tracks θ exactly. The only part of the data that moves with θ is
        the score. So the estimator must be correlated with the score, and a random variable strongly correlated with
        something of variance nI cannot have a tiny variance itself, by Cauchy-Schwarz.
      </p>
      <CramerRaoViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="Cramér-Rao lower bound">
        <p>
          Let T be an unbiased estimator of ψ(θ) from n iid observations, under regularity conditions (the support does not
          depend on θ, and differentiation under the integral is allowed). Then
        </p>
        <MD>{"\\mathrm{Var}_\\theta(T) \\geq \\frac{\\psi'(\\theta)^2}{nI(\\theta)}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let S be the score of the whole sample, with mean 0 and variance nI(θ). Differentiating{" "}
          <M>{"\\psi(\\theta) = \\int T(x) f(x; \\theta)\\,dx"}</M> under the integral gives{" "}
          <M>{"\\psi'(\\theta) = \\int T S f\\,dx = \\mathbb{E}[TS] = \\mathrm{Cov}(T, S)"}</M>, the last step because E[S] = 0.
          By Cauchy-Schwarz, <M>{"\\mathrm{Cov}(T, S)^2 \\leq \\mathrm{Var}(T)\\mathrm{Var}(S)"}</M>, that is,{" "}
          <M>{"\\psi'(\\theta)^2 \\leq \\mathrm{Var}(T)\\, nI(\\theta)"}</M>.
        </p>
      </Proof>

      <Definition title="efficiency">
        <p>
          The efficiency of an unbiased estimator is the bound divided by its variance, a number in (0, 1]. An estimator
          with efficiency 1 is efficient.
        </p>
        <Code>{BOUND}</Code>
      </Definition>

      <Example title="attained and not attained">
        <p>
          Bernoulli: p̂ = X̄ has variance p(1 − p)/n = 1/(nI), so it is efficient. Normal variance with μ unknown:
          for ψ = σ² the information per observation is 1/(2σ⁴), the bound is 2σ⁴/n, but S² has variance 2σ⁴/(n − 1), so its
          efficiency is (n − 1)/n. No unbiased estimator does better than S² here, so the bound is simply not attainable;
          it is a floor, not always a target. Equality in Cauchy-Schwarz requires the score to be a linear function of T,
          which happens essentially only in exponential families with T their sufficient statistic.
        </p>
        <Code>{SIM}</Code>
      </Example>

      <Example title="when the conditions fail">
        <p>
          For Uniform(0, θ) the support depends on θ, so the derivation breaks. Indeed the unbiased estimator{" "}
          <M>{"\\tfrac{n+1}{n}\\max X_i"}</M> has variance <M>{"\\theta^2/(n(n+2))"}</M>, shrinking like 1/n², faster than any
          regular bound allows.
        </p>
      </Example>

      <Theorem title="the multiparameter bound">
        <p>
          For an unbiased estimator T of the vector θ, <M>{"\\mathrm{Cov}(T) - (nI(\\theta))^{-1}"}</M> is positive semidefinite.
          In particular, the variance of each coordinate is at least the matching diagonal entry of{" "}
          <M>{"(nI)^{-1}"}</M>, which is at least the reciprocal of the matching diagonal entry of nI: not knowing the other
          parameters can only hurt.
        </p>
      </Theorem>

      <Remark title="what the bound does not say">
        <p>
          The bound restricts unbiased estimators only. Biased estimators, like the shrinkage estimators of earlier lessons,
          can have smaller mean squared error. In experiments, the bound gives a quick sample size calculation: to measure an
          accuracy near 0.9 with standard error 0.005, you need at least 0.9 · 0.1/0.005² = 3600 test examples, whatever
          estimator you use.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bern",
      rung: "check",
      prompt: <p>What is the Cramér-Rao bound for unbiased estimators of a Bernoulli p = 0.4 from n = 24 observations?</p>,
      answer: { kind: "numeric", value: 0.01, tolerance: 0.00001 },
    },
    {
      key: "norm",
      rung: "check",
      prompt: <p>For a normal mean with known σ = 2 and n = 16 observations, what is the Cramér-Rao bound on the variance of an unbiased estimator of μ?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
    {
      key: "unif",
      rung: "apply",
      prompt: <p>Why does the Cramér-Rao bound not apply to Uniform(0, θ)?</p>,
      answer: {
        kind: "choice",
        options: ["The support of the distribution depends on θ", "The uniform has infinite variance", "There is no unbiased estimator of θ", "The Fisher information is 0"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def cr_bound(dpsi, info, n):
    return dpsi * dpsi / (n * info)

def efficiency(var, dpsi, info, n):
    return cr_bound(dpsi, info, n) / var

print(round(cr_bound(1, 1 / 0.21, 10), 4), round(efficiency(0.021, 1, 1 / 0.21, 10), 4))
print(cr_bound(1, 0.5, 5), efficiency(2 / 4, 1, 0.5, 5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.021 1.0\n0.4 0.8", "0.021 1.0\n0.4 1.25", "0.0021 0.1\n0.4 0.8", "0.021 1.0\n2.5 0.8"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def var_s2(n, reps=200000, seed=0):
    X = np.random.default_rng(seed).normal(size=(reps, n))
    return float(X.var(axis=1, ddof=1).var())

def rb_eff(lam, n):
    var = np.exp(-2 * lam) * (np.exp(lam / n) - 1)
    bound = lam * np.exp(-2 * lam) / n
    return float(bound / var)

print(round(var_s2(5), 3), 2 / 4)
print([round(rb_eff(1.0, n), 4) for n in (1, 10, 100)])`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.505 0.5\n[0.582, 0.9508, 0.995]", "0.4 0.5\n[0.582, 0.9508, 0.995]", "0.505 0.5\n[1.0, 1.0, 1.0]", "0.505 0.5\n[0.995, 0.9508, 0.582]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cr_bound(dpsi, info, n)</C>, the bound ψ′²/(n·I), and <C>efficiency(var, dpsi, info, n)</C>, the bound
          divided by the estimator&apos;s variance.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def cr_bound(dpsi, info, n):
    return 0.0

def efficiency(var, dpsi, info, n):
    return 0.0
`,
        solution: BOUND,
        tests: [
          { name: "bound", code: `assert abs(cr_bound(2, 0.5, 4) - 2) < 1e-12` },
          { name: "eff", code: `assert abs(efficiency(4, 2, 0.5, 4) - 0.5) < 1e-12
assert abs(efficiency(0.25 / 10, 1, 4, 10) - 1) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>var_s2(n, reps=200000, seed=0)</C>, the simulated variance of the sample variance S² (ddof 1) of standard
          normal samples of size n, and <C>rb_eff(lam, n)</C>, the efficiency of ((n − 1)/n)^T for e^(−λ), using its variance
          e^(−2λ)(e^(λ/n) − 1) and the bound λe^(−2λ)/n.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def var_s2(n, reps=200000, seed=0):
    return 0.0

def rb_eff(lam, n):
    return 1.0
`,
        solution: SIM,
        tests: [
          { name: "s2", code: `v = var_s2(11, reps=50000)
assert abs(v - 0.2) < 0.01` },
          { name: "eff", code: `import math
assert abs(rb_eff(2.0, 1) - 2 / (math.e ** 2 - 1)) < 1e-12
assert rb_eff(1.0, 50) > rb_eff(1.0, 5)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove the Cramér-Rao bound Var(T) ≥ ψ′(θ)²/(nI(θ)) for an unbiased estimator T of ψ(θ), assuming differentiation under the integral sign is allowed.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Lets S be the sample score and notes E[S] = 0 and Var(S) = nI(θ).",
          "Differentiates E[T] = ψ(θ) under the integral to obtain ψ′(θ) = E[TS] = Cov(T, S).",
          "Applies Cauchy-Schwarz, Cov(T, S)² ≤ Var(T) Var(S), and rearranges to the bound.",
        ],
      },
    },
    {
      key: "s2eff",
      rung: "stretch",
      prompt: <p>For a normal sample of size n = 11 with both parameters unknown, what is the efficiency of S² for σ²? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.9091, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what the Cramér-Rao bound says, how Cauchy-Schwarz and the score prove it, which estimators attain it, and why it does not apply to biased estimators or to the uniform distribution.",

  glimpse: (
    <>
      <p>
        Few estimators are exactly efficient for finite n, but the next lesson shows that maximum likelihood is efficient
        in the limit: as n grows its distribution becomes normal with variance 1/(nI), the bound itself.
      </p>
    </>
  ),
};
