import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OptimalScalingViz } from "@/components/viz/OptimalScalingViz";
import type { LessonContent } from "@/lib/types";

const MH = `import numpy as np

def mh(rng, logp, x0, propose, logq, n):
    x, lp, out, acc = x0, logp(x0), np.empty(n), 0
    for i in range(n):
        y = propose(rng, x)
        ly = logp(y)
        if np.log(rng.random()) < ly - lp + logq(y, x) - logq(x, y):
            x, lp, acc = y, ly, acc + 1
        out[i] = x
    return out, acc / n

def mult_proposal(s):
    propose = lambda rng, x: x * np.exp(s * rng.normal())
    logq = lambda x, y: -np.log(y) - 0.5 * (np.log(y / x) / s) ** 2
    return propose, logq`;

const TUNE = `import numpy as np
from math import erfc, sqrt

def iact(x):
    x = np.asarray(x, float) - np.mean(x); n = len(x)
    f = np.fft.rfft(x, 2 * n); ac = np.fft.irfft(f * np.conj(f))[:n]; ac = ac / ac[0]
    tau, m = -1.0, 0
    while 2 * m + 1 < n and ac[2 * m] + ac[2 * m + 1] > 0:
        tau += 2 * (ac[2 * m] + ac[2 * m + 1]); m += 1
    return float(tau)

def rwm_scaling(d, ell, n, seed=0):
    rng = np.random.default_rng(seed); x = rng.normal(size=d); acc, jump = 0, 0.0
    for _ in range(n):
        y = x + ell / np.sqrt(d) * rng.normal(size=d)
        if np.log(rng.random()) < 0.5 * (x @ x - y @ y):
            jump += (y - x) @ (y - x); x, acc = y, acc + 1
    return acc / n, float(jump / n)

def limit(ell):
    a = erfc(ell / (2 * sqrt(2)))
    return a, ell ** 2 * a`;

export const lesson: LessonContent = {
  id: "m13.4.1",
  minutes: 60,
  links: {
    requires: ["m7.8.5", "m13.3.3"],
    revisits: ["m13.1.4", "m13.3.2"],
    foreshadows: ["m13.4.3", "m13.4.4"],
  },

  puzzle: (
    <>
      <p>
        Metropolis-Hastings is correct for any proposal, so the choice of proposal looks like a detail. It is not. Propose too
        timidly and every move is accepted but the chain crawls; too boldly and almost nothing is accepted. In a hundred
        dimensions, what step size should you use, and how would you know if the chain had mixed? Remarkably, the answer to the
        first question is a single universal number: tune the step until roughly one proposal in four is accepted.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The acceptance rule guarantees the right stationary distribution; the proposal decides how quickly you get there. Two
        things go wrong in practice. First, an asymmetric proposal needs the Hastings correction, and forgetting it quietly
        samples a different distribution. Second, even a correct chain produces correlated draws, so a million steps may be
        worth only a few thousand independent samples. The integrated autocorrelation time counts the exchange rate, and
        tuning the step size is about minimising it.
      </p>
      <OptimalScalingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the Hastings ratio">
        <p>
          From x, propose y with density q(x, y) and accept with probability
        </p>
        <MD>{"\\alpha(x, y) = \\min\\left(1, \\frac{\\pi(y)\\,q(y, x)}{\\pi(x)\\,q(x, y)}\\right)."}</MD>
        <p>
          Detailed balance holds for any q, as in the earlier lesson on MCMC. The factor{" "}
          <M>{"q(y, x)/q(x, y)"}</M> disappears only when q is symmetric.
        </p>
      </Definition>

      <Example title="a multiplicative proposal">
        <p>
          For a positive parameter it is natural to propose <M>{"y = x e^{sZ}"}</M>, a symmetric step in log x. In x itself the
          proposal density is log-normal, <M>{"q(x, y) \\propto y^{-1}\\exp(-\\log^2(y/x)/2s^2)"}</M>, so the Hastings factor is{" "}
          <M>{"q(y, x)/q(x, y) = y/x"}</M>. Leave it out and the chain is a Metropolis chain in log x for the density{" "}
          <M>{"\\pi(e^u)"}</M>, which in x is proportional to <M>{"\\pi(x)/x"}</M>. For the Gamma(3, 1) target{" "}
          <M>{"\\pi(x) \\propto x^2e^{-x}"}</M> the corrected chain has mean 3; the uncorrected one converges, perfectly
          happily, to Gamma(2, 1) with mean 2.
        </p>
        <Code>{MH}</Code>
      </Example>

      <Theorem title="the independence sampler">
        <p>
          If the proposal ignores the current state, <M>{"q(x, y) = q(y)"}</M>, and the weights{" "}
          <M>{"w = \\pi/q"}</M> satisfy <M>{"w \\le W"}</M>, then <M>{"d(t) \\le (1 - 1/W)^t"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For y ≠ x, <M>{"P(x, y) = q(y)\\min(1, w(y)/w(x)) = \\pi(y)\\min(1/w(y), 1/w(x)) \\ge \\pi(y)/W"}</M>. So every row of
          P contains a copy of <M>{"\\pi/W"}</M>, and the Doeblin argument from the convergence theorem gives the rate. The
          condition is essentially necessary: if the proposal has lighter tails than π, w is unbounded and the chain gets stuck
          for long stretches in the tails, exactly the failure mode of importance sampling with a bad proposal.
        </p>
      </Proof>

      <Theorem title="optimal scaling (Roberts, Gelman and Gilks)">
        <p>
          For random-walk Metropolis on a product of d identical smooth one-dimensional densities with step{" "}
          <M>{"\\ell/\\sqrt d"}</M>, as d → ∞ the acceptance rate tends to <M>{"a(\\ell) = 2\\Phi(-\\ell\\sqrt I/2)"}</M>, where I is
          the Fisher information of one factor, and each coordinate, sped up by a factor d, behaves like a Langevin diffusion with
          speed <M>{"h(\\ell) = \\ell^2 a(\\ell)"}</M>. The speed is maximised at <M>{"\\ell \\approx 2.38/\\sqrt I"}</M>, where{" "}
          <M>{"a = 0.234"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Only the acceptance formula is sketched. The log acceptance ratio is a sum of d small, nearly independent terms, so
          it is approximately normal, <M>{"Z \\sim N(-\\sigma^2/2, \\sigma^2)"}</M> with <M>{"\\sigma^2 = \\ell^2I"}</M>; the mean is
          minus half the variance because <M>{"E[e^Z] = 1"}</M> under stationarity. For such Z,{" "}
          <M>{"E\\min(1, e^Z) = P(Z > 0) + E[e^Z; Z < 0] = 2\\Phi(-\\sigma/2)"}</M>, the second term by completing the
          square. Maximising <M>{"\\ell^2 \\cdot 2\\Phi(-\\ell/2)"}</M> numerically gives 2.38. The practical
          rule is the second number: whatever the dimension, aim for about a quarter of proposals accepted, and the step must
          shrink like <M>{"d^{-1/2}"}</M>, so the chain needs order d steps to cross the target.
        </p>
      </Proof>

      <Theorem title="the Markov chain central limit theorem">
        <p>
          For a geometrically ergodic chain in stationarity and f with finite variance <M>{"\\sigma^2"}</M> under π,{" "}
          <M>{"\\sqrt n(\\bar f_n - \\pi f) \\to N(0, \\sigma^2\\tau)"}</M>, where{" "}
          <M>{"\\tau = 1 + 2\\sum_{k \\ge 1}\\rho_k"}</M> is the integrated autocorrelation time and{" "}
          <M>{"\\rho_k"}</M> the lag-k autocorrelation of <M>{"f(X_t)"}</M>. The effective sample size is n/τ.
        </p>
      </Theorem>
      <Proof>
        <p>
          The variance of the sum is <M>{"\\sigma^2\\sum_{|j - k| < n}\\rho_{|j-k|} = n\\sigma^2(1 + 2\\sum_{k < n}(1 - k/n)\\rho_k)"}</M>,
          which divided by n tends to <M>{"\\sigma^2\\tau"}</M> when the correlations are summable; the normal limit needs a
          martingale argument we omit. For an AR(1) sequence <M>{"\\rho_k = \\phi^k"}</M>, so{" "}
          <M>{"\\tau = (1 + \\phi)/(1 - \\phi)"}</M>, which is 3 for φ = ½. Estimating τ by summing sample autocorrelations needs
          a stopping rule, since the noisy tail would swamp the sum; Geyer&apos;s initial positive sequence adds consecutive pairs{" "}
          <M>{"\\rho_{2m} + \\rho_{2m+1}"}</M> while they stay positive, which is valid for reversible chains because those pair
          sums are then positive and decreasing.
        </p>
        <Code>{TUNE}</Code>
      </Proof>

      <Remark title="in practice">
        <p>
          Among acceptance rules with the same proposal, Peskun&apos;s theorem says that moving more often off the diagonal can
          only lower τ, so the Metropolis choice <M>{"\\min(1, r)"}</M> beats Barker&apos;s <M>{"r/(1 + r)"}</M> for every f. Run
          several chains from dispersed starting points, discard an initial stretch, and compare between-chain with
          within-chain variance (the R-hat statistic): agreement does not prove convergence, but disagreement proves its absence.
          When even a well-tuned random walk needs order d steps, the cure is to use gradients, the subject of the next lessons.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "tau",
      rung: "check",
      prompt: <p>An MCMC output behaves like an AR(1) sequence with lag-one autocorrelation 0.8. What is its integrated autocorrelation time?</p>,
      answer: { kind: "numeric", value: 9, tolerance: 0.001 },
    },
    {
      key: "indep",
      rung: "check",
      prompt: (
        <p>
          An independence sampler has importance weights bounded by W = 4. What bound does the theorem give on{" "}
          <M>{"d(10)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.0563, tolerance: 0.0005 },
    },
    {
      key: "hastings",
      rung: "apply",
      prompt: (
        <p>
          You sample Gamma(3, 1) with the multiplicative proposal <M>{"y = xe^{sZ}"}</M> but accept with{" "}
          <M>{"\\min(1, \\pi(y)/\\pi(x))"}</M>. What happens?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The chain converges to the density proportional to π(x)/x, here Gamma(2, 1)",
          "The chain is still correct because the step in log x is symmetric",
          "The chain does not converge at all",
          "The chain converges to the density proportional to xπ(x), here Gamma(4, 1)",
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

def mh(rng, logp, x0, propose, logq, n):
    x, lp, out, acc = x0, logp(x0), np.empty(n), 0
    for i in range(n):
        y = propose(rng, x)
        ly = logp(y)
        if np.log(rng.random()) < ly - lp + logq(y, x) - logq(x, y):
            x, lp, acc = y, ly, acc + 1
        out[i] = x
    return out, acc / n

def mult_proposal(s):
    propose = lambda rng, x: x * np.exp(s * rng.normal())
    logq = lambda x, y: -np.log(y) - 0.5 * (np.log(y / x) / s) ** 2
    return propose, logq

logp = lambda x: 2 * np.log(x) - x; pr, lq = mult_proposal(0.8); a, acc = mh(np.random.default_rng(0), logp, 1.0, pr, lq, 20000)
b, _ = mh(np.random.default_rng(0), logp, 1.0, pr, lambda x, y: 0.0, 20000); print(abs(a.mean() - 3) < 0.2, abs(b.mean() - 2) < 0.2, round(acc, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["True True 0.6", "True False 0.6", "False True 0.6", "True True 0.2"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
from math import erfc, sqrt

def iact(x):
    x = np.asarray(x, float) - np.mean(x); n = len(x)
    f = np.fft.rfft(x, 2 * n); ac = np.fft.irfft(f * np.conj(f))[:n]; ac = ac / ac[0]
    tau, m = -1.0, 0
    while 2 * m + 1 < n and ac[2 * m] + ac[2 * m + 1] > 0:
        tau += 2 * (ac[2 * m] + ac[2 * m + 1]); m += 1
    return float(tau)

def rwm_scaling(d, ell, n, seed=0):
    rng = np.random.default_rng(seed); x = rng.normal(size=d); acc, jump = 0, 0.0
    for _ in range(n):
        y = x + ell / np.sqrt(d) * rng.normal(size=d)
        if np.log(rng.random()) < 0.5 * (x @ x - y @ y):
            jump += (y - x) @ (y - x); x, acc = y, acc + 1
    return acc / n, float(jump / n)

def limit(ell):
    a = erfc(ell / (2 * sqrt(2)))
    return a, ell ** 2 * a

rng = np.random.default_rng(1); e = rng.normal(size=100000); x = np.zeros(100000)
for t in range(1, len(x)): x[t] = 0.5 * x[t - 1] + e[t]
print(abs(iact(x) - 3) < 0.2, [round(v, 3) for v in limit(2.38)])
print([round(rwm_scaling(20, ell, 4000)[0], 2) for ell in (0.5, 2.38, 4.0)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True [0.234, 1.326]\n[0.81, 0.26, 0.06]",
          "False [0.234, 1.326]\n[0.81, 0.26, 0.06]",
          "True [0.234, 1.326]\n[0.06, 0.26, 0.81]",
          "True [0.5, 2.832]\n[0.81, 0.26, 0.06]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mh(rng, logp, x0, propose, logq, n)</C>, a Metropolis-Hastings chain that returns its states and acceptance
          rate, where <C>logq(x, y)</C> is the log density of proposing y from x; and <C>mult_proposal(s)</C>, returning the{" "}
          <C>propose</C> and <C>logq</C> functions of the multiplicative proposal <M>{"y = xe^{sZ}"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def mh(rng, logp, x0, propose, logq, n):
    return np.zeros(n), 0.0

def mult_proposal(s):
    return (lambda rng, x: x), (lambda x, y: 0.0)
`,
        solution: MH,
        tests: [
          { name: "normal", code: `o, a = mh(np.random.default_rng(3), lambda x: -0.5 * x * x, 0.0, lambda r, x: x + 2.4 * r.normal(), lambda x, y: 0.0, 20000)
assert abs(o.mean()) < 0.1 and abs(o.var() - 1) < 0.15 and 0.3 < a < 0.6` },
          { name: "hastings", code: `pr, lq = mult_proposal(0.5); assert abs(lq(2.0, 3.0) - lq(3.0, 2.0) - np.log(2 / 3)) < 1e-9
pr, lq = mult_proposal(0.8); o, a = mh(np.random.default_rng(0), lambda x: 2 * np.log(x) - x, 1.0, pr, lq, 20000); assert abs(o[1000:].mean() - 3) < 0.2` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>iact(x)</C>, the integrated autocorrelation time by Geyer&apos;s initial positive sequence, and{" "}
          <C>rwm_scaling(d, ell, n, seed)</C>, running random-walk Metropolis on a d-dimensional standard normal with step{" "}
          <M>{"\\ell/\\sqrt d"}</M> from a draw of the target and returning the acceptance rate and the mean squared jump per
          step.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np
from math import erfc, sqrt

def iact(x):
    return 1.0

def rwm_scaling(d, ell, n, seed=0):
    return 0.0, 0.0

def limit(ell):
    a = erfc(ell / (2 * sqrt(2)))
    return a, ell ** 2 * a
`,
        solution: TUNE,
        tests: [
          { name: "iact", code: `rng = np.random.default_rng(1); e = rng.normal(size=100000); x = np.zeros(100000)
for t in range(1, len(x)): x[t] = 0.5 * x[t - 1] + e[t]
assert abs(iact(x) - 3) < 0.2 and abs(iact(np.random.default_rng(2).normal(size=50000)) - 1) < 0.1` },
          { name: "scaling", code: `a, s = rwm_scaling(20, 2.38, 4000); b, t = rwm_scaling(20, 0.2, 2000)
assert 0.2 < a < 0.32 and 1.0 < s < 1.7 and b > 0.9 and t < 0.1` },
        ],
      },
    },
    {
      key: "accept",
      rung: "stretch",
      prompt: <p>In the high-dimensional limit for a standard normal target, what fraction of proposals is accepted at ℓ = 1?</p>,
      answer: { kind: "numeric", value: 0.617, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Random-walk proposals pick directions blindly. When the target has many coordinates, updating them one at a time from
        their exact conditionals needs no tuning at all; that is Gibbs sampling, the next lesson.
      </p>
    </>
  ),
};
