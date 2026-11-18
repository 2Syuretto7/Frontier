import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OuDensityViz } from "@/components/viz/OuDensityViz";
import type { LessonContent } from "@/lib/types";

const EM = `import numpy as np

def euler_maruyama(rng, mu, sigma, x0, T, n, m):
    h, x = T / n, np.full(m, float(x0))
    for _ in range(n):
        x = x + mu(x) * h + sigma(x) * np.sqrt(h) * rng.normal(size=m)
    return x

def scaled_walk(rng, n, m, p=0.5):
    steps = np.where(rng.random((m, n)) < p, 1.0, -1.0)
    return steps.sum(axis=1) / np.sqrt(n)`;

const FP = `import numpy as np

def stationary_density(mu, sig2, xs):
    f = 2 * mu(xs) / sig2(xs)
    F = np.concatenate([[0.0], np.cumsum(0.5 * (f[1:] + f[:-1]) * np.diff(xs))])
    p = np.exp(F - F.max()) / sig2(xs)
    return p / (p * np.gradient(xs)).sum()

def hit_upper(mu, x, a, b):
    if mu == 0:
        return float((x - a) / (b - a))
    return float((1 - np.exp(-2 * mu * (x - a))) / (1 - np.exp(-2 * mu * (b - a))))`;

export const lesson: LessonContent = {
  id: "m13.5.3",
  minutes: 60,
  links: {
    requires: ["m13.5.2", "m7.7.2"],
    revisits: ["m13.3.3", "m13.4.4"],
    foreshadows: ["m13.6.2"],
  },

  puzzle: (
    <>
      <p>
        An urn holds a thousand balls split between two chambers, and each second one ball chosen at random switches sides.
        A population of genes drifts by random sampling each generation. A share price moves by many small trades. These are
        different discrete processes, yet zoomed out each looks like a continuous jittering curve pulled towards some level.
        Why do such different mechanisms produce the same kind of limit, and how do you find the equation for its density?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A Markov chain that takes small steps is, to a first approximation, described by just two numbers at each state: the
        average step and the variance of the step. Everything else washes out in the limit, much as the central limit theorem
        forgets all but the mean and variance of the summands. The limit is a diffusion, written{" "}
        <M>{"dX = \\mu(X)\\,dt + \\sigma(X)\\,dB"}</M>: drift μ plus Brownian jitter of local size σ. Its density flows
        according to the Fokker-Planck equation, and its stationary density and hitting probabilities come from ordinary
        differential equations.
      </p>
      <OuDensityViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="random walks converge to Brownian motion (Donsker)">
        <p>
          Let <M>{"S_k"}</M> be a sum of k independent steps with mean 0 and variance 1, and{" "}
          <M>{"W^{(n)}_t = S_{\\lfloor nt\\rfloor}/\\sqrt n"}</M>. Then <M>{"W^{(n)}"}</M> converges in distribution, as a random path,
          to standard Brownian motion.
        </p>
      </Theorem>
      <Proof>
        <p>
          For fixed times <M>{"t_1 < \\dots < t_k"}</M> the increments of <M>{"W^{(n)}"}</M> are sums over disjoint blocks of
          steps, hence independent, and by the central limit theorem each is approximately{" "}
          <M>{"N(0, t_{i+1} - t_i)"}</M>; so the finite-dimensional laws converge to those of Brownian motion. Upgrading this to
          convergence of whole paths needs a tightness argument, which we omit. With steps ±1 taken with probabilities{" "}
          <M>{"\\tfrac12 \\pm c/(2\\sqrt n)"}</M>, the mean step is <M>{"c/\\sqrt n"}</M> and the limit is Brownian motion with
          drift c.
        </p>
      </Proof>

      <Definition title="diffusion and Euler-Maruyama">
        <p>
          The diffusion with drift μ and volatility σ is the limit as h → 0 of the Euler-Maruyama scheme{" "}
          <M>{"X_{t+h} = X_t + \\mu(X_t)h + \\sigma(X_t)\\sqrt h\\,Z"}</M>, Z standard normal. Equivalently, its increments
          satisfy <M>{"E[\\Delta X \\mid X = x] = \\mu(x)h + o(h)"}</M> and{" "}
          <M>{"\\mathrm{Var}[\\Delta X \\mid X = x] = \\sigma^2(x)h + o(h)"}</M>. A Markov chain with these two local moments and
          negligible higher ones converges to the diffusion when time is measured in units of h.
        </p>
        <Code>{EM}</Code>
      </Definition>

      <Example title="the Ehrenfest urn becomes Ornstein-Uhlenbeck">
        <p>
          With N balls and k in the left chamber, one random ball moves per step, so k goes up with probability (N − k)/N and
          down otherwise. Let <M>{"Y = (k - N/2)/\\sqrt N"}</M> and let each step last h = 1/N. Then{" "}
          <M>{"E[\\Delta Y] = (N - 2k)/N^{3/2} = -2Yh"}</M> and <M>{"\\mathrm{Var}[\\Delta Y] \\approx 1/N = h"}</M>, so the
          limit is the Ornstein-Uhlenbeck process <M>{"dY = -2Y\\,dt + dB"}</M>. Its stationary variance, 1/4 by the next
          theorem, matches the variance of Binomial(N, ½)/√N, as it must. The hypercube walk of the mixing-times lesson is a
          lazy version of the same urn.
        </p>
      </Example>

      <Theorem title="the Fokker-Planck equation">
        <p>
          The density p(x, t) of a diffusion satisfies
        </p>
        <MD>{"\\partial_t p = -\\partial_x(\\mu p) + \\tfrac12\\partial_x^2(\\sigma^2p)."}</MD>
        <p>
          A density with zero probability flux, <M>{"\\mu p - \\tfrac12(\\sigma^2p)' = 0"}</M>, is stationary; it is{" "}
          <M>{"p(x) \\propto \\sigma^{-2}(x)\\exp\\int^x 2\\mu/\\sigma^2"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For a smooth test function f, Taylor expansion of one Euler-Maruyama step gives{" "}
          <M>{"E[f(X_{t+h}) - f(X_t) \\mid X_t = x] = (\\mu f' + \\tfrac12\\sigma^2f'')h + o(h)"}</M>, the variance term surviving
          because <M>{"(\\sqrt h Z)^2"}</M> is of order h. So <M>{"\\tfrac{d}{dt}\\int fp = \\int(\\mu f' + \\tfrac12\\sigma^2f'')p"}</M>,
          and integrating by parts to move the derivatives onto p gives the equation, since f is arbitrary. For the stationary
          form, set <M>{"q = \\sigma^2p"}</M>; zero flux reads <M>{"q' = (2\\mu/\\sigma^2)q"}</M>, a linear first-order equation.
          For Ornstein-Uhlenbeck, <M>{"\\mu = -\\theta x"}</M> and constant σ, this gives{" "}
          <M>{"N(0, \\sigma^2/2\\theta)"}</M>; for Langevin, μ = (log π)′ and σ² = 2, it gives π, as the earlier lesson showed.
        </p>
        <Code>{FP}</Code>
      </Proof>

      <Theorem title="hitting probabilities">
        <p>
          For a &lt; x &lt; b, <M>{"u(x) = P_x(\\text{hit } b \\text{ before } a)"}</M> solves{" "}
          <M>{"\\mu u' + \\tfrac12\\sigma^2u'' = 0"}</M> with u(a) = 0, u(b) = 1. For Brownian motion with drift μ,{" "}
          <M>{"u(x) = (1 - e^{-2\\mu(x - a)})/(1 - e^{-2\\mu(b - a)})"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Condition on the first short step: <M>{"u(x) = E[u(x + \\Delta X)] + o(h)"}</M>, and the Taylor expansion above turns
          this into <M>{"(\\mu u' + \\tfrac12\\sigma^2u'')h = o(h)"}</M>. With constant coefficients and σ = 1, the solutions of{" "}
          <M>{"u'' = -2\\mu u'"}</M> are <M>{"A + Be^{-2\\mu x}"}</M>, and the boundary conditions fix the formula. It is the
          limit of the gambler&apos;s ruin probability for a slightly biased random walk; with μ = 0 it is linear, the fair-game
          answer.
        </p>
      </Proof>

      <Remark title="diffusions everywhere">
        <p>
          The Wright-Fisher model of genetic drift has the diffusion limit <M>{"dX = \\sqrt{X(1 - X)}\\,dB"}</M>; geometric
          Brownian motion <M>{"dS = \\mu S\\,dt + \\sigma S\\,dB"}</M> is the Black-Scholes model; and score-based generative
          models run an Ornstein-Uhlenbeck process forward to turn data into noise, then a learned reverse-time diffusion to turn
          noise back into data. A rigorous treatment of <M>{"\\sigma\\,dB"}</M> as an integral is Itô calculus, beyond this
          course; the Euler-Maruyama limit is all we have used.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ou",
      rung: "check",
      prompt: <p>What is the stationary variance of <M>{"dX = -0.5X\\,dt + dB"}</M>?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "hit",
      rung: "check",
      prompt: <p>Brownian motion with drift 0.5 starts at 0. What is the probability it reaches 1 before −1?</p>,
      answer: { kind: "numeric", value: 0.7311, tolerance: 0.0005 },
    },
    {
      key: "limit",
      rung: "apply",
      prompt: (
        <p>
          At state x, a Markov chain&apos;s step has mean −0.01x and variance 0.01, and its higher moments are negligible. Measuring
          time in units of 100 steps, which diffusion approximates it?
        </p>
      ),
      answer: {
        kind: "choice",
        options: ["dX = −X dt + dB", "dX = −0.01X dt + 0.1 dB", "dX = −X dt + 0.1 dB", "dX = −100X dt + 10 dB"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def euler_maruyama(rng, mu, sigma, x0, T, n, m):
    h, x = T / n, np.full(m, float(x0))
    for _ in range(n):
        x = x + mu(x) * h + sigma(x) * np.sqrt(h) * rng.normal(size=m)
    return x

def scaled_walk(rng, n, m, p=0.5):
    steps = np.where(rng.random((m, n)) < p, 1.0, -1.0)
    return steps.sum(axis=1) / np.sqrt(n)

rng = np.random.default_rng(0); x = euler_maruyama(rng, lambda x: -2 * x, lambda x: np.ones_like(x), 2.0, 0.5, 200, 20000)
print(abs(x.mean() - 2 * np.exp(-1)) < 0.02, abs(x.var() - (1 - np.exp(-2)) / 4) < 0.01)
w = scaled_walk(rng, 400, 20000, 0.55); print(round(float(w.mean()), 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["True True\n2.0", "True True\n0.1", "True False\n2.0", "True True\n0.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def stationary_density(mu, sig2, xs):
    f = 2 * mu(xs) / sig2(xs)
    F = np.concatenate([[0.0], np.cumsum(0.5 * (f[1:] + f[:-1]) * np.diff(xs))])
    p = np.exp(F - F.max()) / sig2(xs)
    return p / (p * np.gradient(xs)).sum()

def hit_upper(mu, x, a, b):
    if mu == 0:
        return float((x - a) / (b - a))
    return float((1 - np.exp(-2 * mu * (x - a))) / (1 - np.exp(-2 * mu * (b - a))))

xs = np.linspace(-4, 4, 801); p = stationary_density(lambda x: x - x ** 3, lambda x: np.ones_like(x), xs); print(abs(float(xs[p.argmax()])), round(float(p[400] / p.max()), 3))
print(round(hit_upper(0.5, 0, -1, 1), 3), hit_upper(0, 0.25, 0, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.0 0.607\n0.731 0.25", "0.0 0.607\n0.731 0.25", "1.0 0.368\n0.731 0.25", "1.0 0.607\n0.5 0.25"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>euler_maruyama(rng, mu, sigma, x0, T, n, m)</C>, returning the values at time T of m independent paths
          simulated with n steps, and <C>scaled_walk(rng, n, m, p)</C>, returning m values of{" "}
          <M>{"S_n/\\sqrt n"}</M> for walks stepping +1 with probability p and −1 otherwise.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def euler_maruyama(rng, mu, sigma, x0, T, n, m):
    return np.full(m, float(x0))

def scaled_walk(rng, n, m, p=0.5):
    return np.zeros(m)
`,
        solution: EM,
        tests: [
          { name: "em", code: `x = euler_maruyama(np.random.default_rng(1), lambda x: 0.3 + 0 * x, lambda x: 2 + 0 * x, 0.0, 2.0, 50, 20000); assert x.shape == (20000,) and abs(x.mean() - 0.6) < 0.05 and abs(x.var() - 8) < 0.3` },
          { name: "walk", code: `w = scaled_walk(np.random.default_rng(2), 900, 10000); assert abs(w.var() - 1) < 0.05 and np.isin(np.round(w * 30), np.arange(-900, 901, 2)).all()
assert abs(scaled_walk(np.random.default_rng(3), 400, 10000, 0.55).mean() - 2) < 0.05` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>stationary_density(mu, sig2, xs)</C>, the normalised zero-flux stationary density on a grid xs, and{" "}
          <C>hit_upper(mu, x, a, b)</C>, the probability that Brownian motion with constant drift mu started at x hits b before
          a.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def stationary_density(mu, sig2, xs):
    return np.ones_like(xs) / (xs[-1] - xs[0])

def hit_upper(mu, x, a, b):
    return 0.5
`,
        solution: FP,
        tests: [
          { name: "density", code: `xs = np.linspace(1e-3, 15, 3000); p = stationary_density(lambda x: 2 - x, lambda x: x, xs); assert abs((p * xs * np.gradient(xs)).sum() - 2) < 0.01
ys = np.linspace(-4, 4, 801); q = stationary_density(lambda x: -x, lambda x: np.full_like(x, 2.0), ys); assert abs((q * ys ** 2 * np.gradient(ys)).sum() - 1) < 0.01` },
          { name: "hit", code: `assert abs(hit_upper(-1, 0, -1, 1) - 0.11920) < 1e-4 and abs(hit_upper(0, 0.25, 0, 1) - 0.25) < 1e-12 and abs(hit_upper(2.0, 0.5, 0, 1) - 0.88080) < 1e-4` },
        ],
      },
    },
    {
      key: "well",
      rung: "stretch",
      prompt: (
        <p>
          For <M>{"dX = (X - X^3)\\,dt + dB"}</M>, what is the ratio of the stationary density at 0 to its value at 1?
        </p>
      ),
      answer: { kind: "numeric", value: 0.6065, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Writing a sample as a deterministic function of noise, as Euler-Maruyama does, is exactly what makes it possible to
        differentiate through a simulation. The last section compares that pathwise route to gradients with the
        score-function alternative.
      </p>
    </>
  ),
};
