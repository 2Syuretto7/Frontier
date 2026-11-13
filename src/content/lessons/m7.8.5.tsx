import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MhChainViz } from "@/components/viz/MhChainViz";
import type { LessonContent } from "@/lib/types";

const DISC = `import numpy as np

def mh_matrix(w):
    k = len(w)
    P = np.zeros((k, k))
    for x in range(k):
        for y in (x - 1, x + 1):
            if 0 <= y < k:
                P[x, y] = 0.5 * min(1.0, w[y] / w[x])
        P[x, x] = 1 - P[x].sum()
    return P

def mh_discrete(rng, w, x0, steps):
    path = [x0]
    for _ in range(steps):
        x = path[-1]
        y = x + (1 if rng.random() < 0.5 else -1)
        ok = 0 <= y < len(w) and rng.random() < min(1.0, w[y] / w[x])
        path.append(y if ok else x)
    return path`;

const CONT = `import numpy as np

def rw_metropolis(rng, logp, x0, step, n):
    x, lp, out, acc = x0, logp(x0), np.empty(n), 0
    for i in range(n):
        y = x + step * rng.normal()
        ly = logp(y)
        if np.log(rng.random()) < ly - lp:
            x, lp, acc = y, ly, acc + 1
        out[i] = x
    return out, acc / n

def autocorr(x, lag):
    return float(np.corrcoef(x[:-lag], x[lag:])[0, 1])`;

export const lesson: LessonContent = {
  id: "m7.8.5",
  minutes: 65,
  links: {
    requires: ["m7.8.2", "m7.8.3"],
    revisits: ["m7.1.4", "m7.7.3"],
    foreshadows: ["m13.4.1", "m13.4.2", "m13.1.4"],
  },

  puzzle: (
    <>
      <p>
        Bayes&apos; rule gives a posterior as prior times likelihood divided by a normalising constant, and that constant is
        an integral nobody can compute in high dimensions. So you can evaluate the posterior density up to an unknown
        factor, but not sample from it. Remarkably, that is enough: a random walk that compares densities at two points
        can be made to spend exactly the right fraction of time everywhere.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Propose a move. If it goes uphill in probability, take it; if downhill, take it only sometimes, with probability
        equal to the ratio of the densities. Uphill moves are always accepted and downhill ones occasionally, so the walker
        lingers where the density is high but still explores. The unknown constant cancels in the ratio.
      </p>
      <MhChainViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the Metropolis–Hastings chain">
        <p>
          Let <M>{"\\tilde\\pi"}</M> be a target known up to a constant, <M>{"\\pi = \\tilde\\pi/Z"}</M>, and q(x, y) a
          proposal distribution of the next point given the current one. From x:
        </p>
        <ol>
          <li>propose y ~ q(x, ·);</li>
          <li>
            accept with probability{" "}
            <M>{"\\alpha(x, y) = \\min\\Big(1, \\frac{\\tilde\\pi(y)\\,q(y, x)}{\\tilde\\pi(x)\\,q(x, y)}\\Big)"}</M>, moving to y;
          </li>
          <li>otherwise stay at x (and count x again).</li>
        </ol>
        <p>
          For a symmetric proposal, q(x, y) = q(y, x), the ratio is just <M>{"\\tilde\\pi(y)/\\tilde\\pi(x)"}</M>: this is the
          original Metropolis algorithm. Z never appears.
        </p>
      </Definition>

      <Theorem title="detailed balance">
        <p>
          The Metropolis–Hastings transition probabilities <M>{"P(x, y) = q(x, y)\\alpha(x, y)"}</M> for y ≠ x satisfy{" "}
          <M>{"\\pi(x)P(x, y) = \\pi(y)P(y, x)"}</M>. Hence π is stationary.
        </p>
      </Theorem>
      <Proof>
        <p>For y ≠ x,</p>
        <MD>{"\\pi(x)q(x, y)\\alpha(x, y) = \\min\\big(\\pi(x)q(x, y),\\ \\pi(y)q(y, x)\\big),"}</MD>
        <p>
          multiplying the min through by <M>{"\\pi(x)q(x, y)"}</M> and using <M>{"\\tilde\\pi(y)/\\tilde\\pi(x) = \\pi(y)/\\pi(x)"}</M>. The right
          side is symmetric in x and y, so it also equals <M>{"\\pi(y)q(y, x)\\alpha(y, x)"}</M>. The case y = x is trivial.
          Detailed balance implies stationarity, as shown two lessons ago.
        </p>
      </Proof>
      <p>
        If the chain is also irreducible and aperiodic, the convergence theorem gives{" "}
        <M>{"X_n \\to \\pi"}</M> in distribution and the ergodic theorem gives{" "}
        <M>{"\\frac1n\\sum_t f(X_t) \\to E_\\pi[f]"}</M>: Monte Carlo with dependent samples. Rejections give self-loops, so
        aperiodicity is usually automatic.
      </p>

      <Example title="a discrete target">
        <p>
          Target proportional to w = (1, 2, 4, 1) on {"{0, 1, 2, 3}"}, proposing ±1 with equal chance and rejecting moves off the
          ends. Building the exact matrix confirms πP = π, and a long run visits the states in proportion 1 : 2 : 4 : 1.
        </p>
        <Code>{DISC}</Code>
      </Example>

      <Example title="random-walk Metropolis and the step size">
        <p>
          On the real line propose <M>{"y = x + s\\,\\varepsilon"}</M> with ε ~ N(0, 1), symmetric. Work with log densities to
          avoid underflow: accept when <M>{"\\log u < \\log\\tilde\\pi(y) - \\log\\tilde\\pi(x)"}</M> for u uniform. The step s
          matters. For a standard normal target, s = 0.1 accepts 97% of moves but the samples are almost perfectly correlated;
          s = 25 accepts 5% and the chain sits still; s = 2.5 accepts about 43% and mixes far better.
        </p>
        <Code>{CONT}</Code>
      </Example>

      <Remark title="using the samples">
        <p>
          Consecutive samples are correlated, so n MCMC samples carry less information than n independent ones; the
          effective sample size corrects for this. Practice discards an initial burn-in, runs several chains from different
          starts and checks they agree, and tunes the proposal so the acceptance rate is moderate, roughly 0.2 to 0.5 for
          random-walk proposals. Multimodal targets, like the two bumps in the figure, are the hard case: a chain can sit in
          one mode for a long time and look converged.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "down",
      rung: "check",
      prompt: <p>With a symmetric proposal, the current point has π̃(x) = 4 and the proposal has π̃(y) = 1. What is the acceptance probability?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
    {
      key: "up",
      rung: "check",
      prompt: <p>Now π̃(x) = 3 and π̃(y) = 6. What is the acceptance probability?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why can Metropolis–Hastings sample a Bayesian posterior without knowing its normalising constant?</p>,
      answer: {
        kind: "choice",
        options: [
          "It only uses ratios of the density, in which the constant cancels.",
          "It estimates the constant by Monte Carlo first.",
          "The constant is always 1 for posteriors.",
          "It samples from the prior instead and reweights.",
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

def mh_matrix(w):
    k = len(w)
    P = np.zeros((k, k))
    for x in range(k):
        for y in (x - 1, x + 1):
            if 0 <= y < k:
                P[x, y] = 0.5 * min(1.0, w[y] / w[x])
        P[x, x] = 1 - P[x].sum()
    return P

def mh_discrete(rng, w, x0, steps):
    path = [x0]
    for _ in range(steps):
        x = path[-1]
        y = x + (1 if rng.random() < 0.5 else -1)
        ok = 0 <= y < len(w) and rng.random() < min(1.0, w[y] / w[x])
        path.append(y if ok else x)
    return path

w = np.array([1.0, 2.0, 4.0, 1.0])
P = mh_matrix(w)
print(P[1], np.allclose((w / w.sum()) @ P, w / w.sum()))
path = mh_discrete(np.random.default_rng(0), w, 0, 80000)
print(np.round(np.bincount(path, minlength=4) / len(path), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.25 0.25 0.5  0.  ] True\n[0.13 0.25 0.5  0.12]",
          "[0.5  0.   0.5  0.  ] True\n[0.13 0.25 0.5  0.12]",
          "[0.25 0.25 0.5  0.  ] False\n[0.13 0.25 0.5  0.12]",
          "[0.25 0.25 0.5  0.  ] True\n[0.25 0.25 0.25 0.25]",
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

def rw_metropolis(rng, logp, x0, step, n):
    x, lp, out, acc = x0, logp(x0), np.empty(n), 0
    for i in range(n):
        y = x + step * rng.normal()
        ly = logp(y)
        if np.log(rng.random()) < ly - lp:
            x, lp, acc = y, ly, acc + 1
        out[i] = x
    return out, acc / n

def autocorr(x, lag):
    return float(np.corrcoef(x[:-lag], x[lag:])[0, 1])

rng = np.random.default_rng(1)
for step in (0.1, 2.5, 25.0):
    s, acc = rw_metropolis(rng, lambda x: -x * x / 2, 0.0, step, 40000)
    print(step, round(acc, 2), round(autocorr(s, 1), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.1 0.97 1.0\n2.5 0.43 0.62\n25.0 0.05 0.93",
          "0.1 0.97 0.0\n2.5 0.43 0.62\n25.0 0.05 0.0",
          "0.1 0.05 1.0\n2.5 0.43 0.62\n25.0 0.97 0.93",
          "0.1 0.97 1.0\n2.5 0.43 0.62\n25.0 0.05 0.05",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For a target proportional to positive weights w on 0, …, k − 1 and the proposal ±1 with probability ½ each (moves off
          the ends rejected), write <C>mh_matrix(w)</C>, the exact k × k Metropolis transition matrix, and{" "}
          <C>mh_discrete(rng, w, x0, steps)</C>, simulating the chain: draw <C>rng.random() &lt; 0.5</C> for the direction (+1
          if true), then, if the proposal is in range, a second <C>rng.random()</C> for acceptance. Return the list of states.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def mh_matrix(w):
    return np.eye(len(w))

def mh_discrete(rng, w, x0, steps):
    return [x0] * (steps + 1)
`,
        solution: DISC,
        tests: [
          { name: "matrix", code: `w = np.array([1.0, 2.0, 4.0, 1.0])
P = mh_matrix(w)
assert np.allclose(P.sum(axis=1), 1) and np.all(P >= 0)
assert np.allclose(P[2], [0, 0.25, 0.625, 0.125])
pi = w / w.sum()
assert np.allclose(pi @ P, pi) and np.allclose(pi[:, None] * P, (pi[:, None] * P).T)` },
          { name: "simulation", code: `w = np.array([3.0, 1.0, 1.0, 3.0, 2.0])
path = mh_discrete(np.random.default_rng(4), w, 2, 60000)
assert len(path) == 60001 and path[0] == 2 and all(abs(a - b) <= 1 for a, b in zip(path, path[1:]))
freq = np.bincount(path, minlength=5) / len(path)
assert np.allclose(freq, w / w.sum(), atol=0.02)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rw_metropolis(rng, logp, x0, step, n)</C>, returning an array of n states of random-walk Metropolis with
          proposal x + step·<C>rng.normal()</C> and acceptance when <C>np.log(rng.random())</C> &lt; logp(y) − logp(x), together
          with the acceptance rate; and <C>autocorr(x, lag)</C>, the correlation between x[:-lag] and x[lag:] as a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rw_metropolis(rng, logp, x0, step, n):
    return np.full(n, x0), 0.0

def autocorr(x, lag):
    return 0.0
`,
        solution: CONT,
        tests: [
          { name: "normal target", code: `s, acc = rw_metropolis(np.random.default_rng(2), lambda x: -(x - 3) ** 2 / 2, 3.0, 2.0, 60000)
assert s.shape == (60000,) and 0.3 < acc < 0.6
assert abs(s.mean() - 3) < 0.08 and abs(s.var() - 1) < 0.1` },
          { name: "autocorr", code: `x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
assert abs(autocorr(x, 1) - 1) < 1e-12 and isinstance(autocorr(x, 2), float)
y = np.array([1.0, -1.0] * 50)
assert abs(autocorr(y, 1) + 1) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that the Metropolis–Hastings chain with proposal q and acceptance probability{" "}
          <M>{"\\alpha(x, y) = \\min(1, \\pi(y)q(y, x)/(\\pi(x)q(x, y)))"}</M> satisfies detailed balance with respect to π, and
          explain why the normalising constant of π is not needed.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes P(x, y) = q(x, y)α(x, y) for y ≠ x and computes π(x)q(x, y)α(x, y) = min(π(x)q(x, y), π(y)q(y, x)).",
          "Observes the right side is symmetric in x and y, so it equals π(y)P(y, x), and notes the case x = y is trivial.",
          "Notes α depends on π only through the ratio π(y)/π(x), in which Z cancels, so π̃ suffices.",
        ],
      },
    },
    {
      key: "stay",
      rung: "stretch",
      prompt: (
        <p>
          In the discrete example, w = (1, 2, 4, 1) with ±1 proposals of probability ½. What is the probability that the chain
          stays at state 2 in one step?
        </p>
      ),
      answer: { kind: "numeric", value: 0.625, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how Metropolis–Hastings proposes and accepts moves, why detailed balance makes the target stationary, why the normalising constant cancels, and how the proposal step size trades acceptance against movement.",

  glimpse: (
    <>
      <p>
        This completes a first course in probability. Later courses build on it: statistics turns samples into estimates
        with error bars, and the Monte Carlo course develops importance sampling, Gibbs sampling and Hamiltonian Monte Carlo,
        which uses gradients to make proposals that are both bold and likely to be accepted.
      </p>
    </>
  ),
};
