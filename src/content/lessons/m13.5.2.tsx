import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BrownianRefineViz } from "@/components/viz/BrownianRefineViz";
import type { LessonContent } from "@/lib/types";

const BM = `import numpy as np

def bm_paths(rng, m, n, T=1.0):
    dB = rng.normal(0, np.sqrt(T / n), size=(m, n))
    return np.hstack([np.zeros((m, 1)), np.cumsum(dB, axis=1)])

def levy_refine(rng, path, T=1.0):
    dt = T / (len(path) - 1)
    mid = 0.5 * (path[:-1] + path[1:]) + rng.normal(0, np.sqrt(dt / 4), size=len(path) - 1)
    out = np.empty(2 * len(path) - 1)
    out[0::2], out[1::2] = path, mid
    return out`;

const VAR = `import numpy as np

def variations(path):
    d = np.diff(path)
    return float(np.abs(d).sum()), float((d ** 2).sum())

def max_exceeds(paths, a):
    return float((paths.max(axis=1) >= a).mean())`;

export const lesson: LessonContent = {
  id: "m13.5.2",
  minutes: 60,
  links: {
    requires: ["m7.5.5", "m13.5.1"],
    revisits: ["m13.4.4"],
    foreshadows: ["m13.5.3"],
  },

  puzzle: (
    <>
      <p>
        Pollen grains in water jitter endlessly. Model the position as a curve and ask how long it is between two times. Zoom
        in and the wiggles never smooth out; each doubling of resolution reveals more of them, and the measured length grows
        without bound. Yet one quantity built from the same wiggles, the sum of squared displacements, settles down to exactly
        the elapsed time. What kind of curve has infinite length but a perfectly predictable sum of squares?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Brownian motion is the continuous-time limit of a random walk with small, frequent, independent steps. Over a time
        interval of length Δt it moves by about <M>{"\\sqrt{\\Delta t}"}</M>, much more than Δt when Δt is small. That
        square-root scaling explains everything strange about it: the path is continuous, since steps shrink, but nowhere
        smooth, since slopes <M>{"\\sqrt{\\Delta t}/\\Delta t"}</M> blow up; its length is infinite, but squared steps add up to
        elapsed time. It is the noise term in the Langevin equation and the raw material of stochastic calculus.
      </p>
      <BrownianRefineViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Brownian motion">
        <p>
          A standard Brownian motion is a process <M>{"(B_t)_{t \\ge 0}"}</M> with <M>{"B_0 = 0"}</M>, independent increments,{" "}
          <M>{"B_t - B_s \\sim N(0, t - s)"}</M> for s &lt; t, and continuous paths.
        </p>
      </Definition>

      <Theorem title="a Gaussian process with covariance min(s, t)">
        <p>
          Every finite collection <M>{"(B_{t_1}, \\dots, B_{t_k})"}</M> is jointly normal with mean 0 and{" "}
          <M>{"\\mathrm{Cov}(B_s, B_t) = \\min(s, t)"}</M>. Consequently, for c &gt; 0,{" "}
          <M>{"(c^{-1/2}B_{ct})_{t \\ge 0}"}</M> is again a standard Brownian motion.
        </p>
      </Theorem>
      <Proof>
        <p>
          The values are linear functions of independent normal increments, hence jointly normal. For s ≤ t,{" "}
          <M>{"\\mathrm{Cov}(B_s, B_t) = \\mathrm{Cov}(B_s, B_s + (B_t - B_s)) = \\mathrm{Var}(B_s) = s"}</M>. The rescaled process
          is continuous, centred and Gaussian with covariance <M>{"c^{-1}\\min(cs, ct) = \\min(s, t)"}</M>, and the
          finite-dimensional laws of a Gaussian process are fixed by its covariance.
        </p>
      </Proof>

      <Theorem title="Lévy's midpoint construction">
        <p>
          Given <M>{"B_s = a"}</M> and <M>{"B_t = b"}</M>, the midpoint <M>{"B_{(s+t)/2}"}</M> is{" "}
          <M>{"N((a + b)/2, (t - s)/4)"}</M>, independent of the path outside [s, t]. Refining dyadically from{" "}
          <M>{"B_0 = 0"}</M>, <M>{"B_1 \\sim N(0, 1)"}</M> produces, in the limit, a continuous path with the law of Brownian motion.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let h = t − s and let X, Y be the two half-interval increments, independent <M>{"N(0, h/2)"}</M>. Then X and X + Y are
          jointly normal with <M>{"\\mathrm{Cov}(X, X + Y) = h/2"}</M> and <M>{"\\mathrm{Var}(X + Y) = h"}</M>, so by Gaussian
          conditioning <M>{"X \\mid X + Y = b - a"}</M> has mean <M>{"(b - a)/2"}</M> and variance{" "}
          <M>{"h/2 - (h/2)^2/h = h/4"}</M>. Independence of increments makes the outside irrelevant. That the refinements
          converge uniformly, giving continuity, follows from a Borel-Cantelli bound on the largest correction at each level,
          which we omit. The code draws paths both by summing increments and by refining.
        </p>
        <Code>{BM}</Code>
      </Proof>

      <Theorem title="quadratic and total variation">
        <p>
          Split [0, t] into n intervals of length t/n. Then{" "}
          <M>{"Q_n = \\sum (\\Delta B)^2"}</M> has mean t and variance <M>{"2t^2/n"}</M>, so <M>{"Q_n \\to t"}</M>; while{" "}
          <M>{"V_n = \\sum |\\Delta B|"}</M> has mean <M>{"\\sqrt{2nt/\\pi}"}</M>, which tends to infinity.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each increment is <M>{"\\sqrt{t/n}\\,Z_i"}</M> with independent standard normal <M>{"Z_i"}</M>. So{" "}
          <M>{"Q_n = (t/n)\\sum Z_i^2"}</M>, with mean t and variance <M>{"(t/n)^2 \\cdot 2n"}</M>; and{" "}
          <M>{"E V_n = n\\sqrt{t/n}\\,E|Z| = \\sqrt{nt}\\sqrt{2/\\pi}"}</M>. A continuously differentiable path f has{" "}
          <M>{"\\sum(\\Delta f)^2 \\le \\max|f'|^2 t^2/n \\to 0"}</M>, so a path with quadratic variation t &gt; 0 cannot be
          smooth on any interval. Heuristically <M>{"(dB)^2 = dt"}</M>, the rule that makes stochastic calculus differ from the
          ordinary kind.
        </p>
        <Code>{VAR}</Code>
      </Proof>

      <Theorem title="the reflection principle">
        <p>
          For a &gt; 0, <M>{"P(\\max_{s \\le t}B_s \\ge a) = 2P(B_t \\ge a)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let τ be the first time the path reaches a. After τ the path is a fresh Brownian motion started at a, which is
          equally likely to end above or below a; reflecting the part after τ in the level a is a bijection between paths that
          hit a and end below it and paths that end above it. So{" "}
          <M>{"P(\\max \\ge a) = P(B_t \\ge a) + P(\\max \\ge a, B_t < a) = 2P(B_t \\ge a)"}</M>. Making the restart at a random
          time rigorous is again the strong Markov property.
        </p>
      </Proof>

      <Example title="monitoring a path discretely">
        <p>
          For t = 1 and a = 1 the formula gives <M>{"2(1 - \\Phi(1)) \\approx 0.317"}</M>. Twenty thousand simulated paths with
          1000 steps each give about 0.307: a path checked only at grid points can cross the level and come back between them,
          so discrete maxima are biased low, by an amount of order <M>{"\\sqrt{\\Delta t}"}</M> rather than Δt. This matters
          when pricing barrier options or estimating hitting probabilities by simulation.
        </p>
      </Example>

      <Remark title="where this goes">
        <p>
          The next lesson shows why Brownian motion is universal: any random walk with finite-variance steps, rescaled, converges
          to it, and a random walk with state-dependent drift converges to a diffusion. Brownian motion is also the noise in the
          Langevin dynamics of the previous section, which is why the noise there was scaled by <M>{"\\sqrt{2h}"}</M> and not
          by h.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cov",
      rung: "check",
      prompt: <p>What is the covariance of <M>{"B_2"}</M> and <M>{"B_5"}</M>?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "max",
      rung: "check",
      prompt: <p>What is the probability that a standard Brownian motion reaches level 1 at some time in [0, 1]?</p>,
      answer: { kind: "numeric", value: 0.3173, tolerance: 0.0005 },
    },
    {
      key: "smooth",
      rung: "apply",
      prompt: <p>Why does the sum of squared increments of a Brownian path converge to t while that of a smooth path converges to 0?</p>,
      answer: {
        kind: "choice",
        options: [
          "Brownian increments over a step of length Δt are of size √Δt, so their squares are of size Δt and add up to t, while smooth increments are of size Δt",
          "Brownian motion has larger variance than a smooth path",
          "Brownian increments are independent, while smooth increments are not",
          "The sum of squares of a smooth path also converges to t; only total variation differs",
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

def bm_paths(rng, m, n, T=1.0):
    dB = rng.normal(0, np.sqrt(T / n), size=(m, n))
    return np.hstack([np.zeros((m, 1)), np.cumsum(dB, axis=1)])

def levy_refine(rng, path, T=1.0):
    dt = T / (len(path) - 1)
    mid = 0.5 * (path[:-1] + path[1:]) + rng.normal(0, np.sqrt(dt / 4), size=len(path) - 1)
    out = np.empty(2 * len(path) - 1)
    out[0::2], out[1::2] = path, mid
    return out

rng = np.random.default_rng(0); P = bm_paths(rng, 20000, 1000)
print(abs(P[:, -1].var() - 1) < 0.05, abs(np.cov(P[:, 300], P[:, 700])[0, 1] - 0.3) < 0.03)
p = levy_refine(rng, np.array([0.0, 1.0, 0.5])); print(len(p), p[0::2].tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True True\n5 [0.0, 1.0, 0.5]",
          "True False\n5 [0.0, 1.0, 0.5]",
          "True True\n3 [0.0, 1.0, 0.5]",
          "True True\n5 [0.0, 0.5, 1.0]",
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

def variations(path):
    d = np.diff(path)
    return float(np.abs(d).sum()), float((d ** 2).sum())

def max_exceeds(paths, a):
    return float((paths.max(axis=1) >= a).mean())

print(variations(np.array([0.0, 0.5, -0.5, 0.0])))
P = np.array([[0.0, 0.4, 1.2, 0.9], [0.0, -0.3, 0.2, 0.8], [0.0, 1.0, 0.1, 0.0]]); print(round(max_exceeds(P, 1.0), 3), max_exceeds(P, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["(2.0, 1.5)\n0.667 1.0", "(0.0, 1.5)\n0.667 1.0", "(2.0, 1.5)\n0.333 1.0", "(2.0, 0.5)\n0.667 0.667"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bm_paths(rng, m, n, T)</C>, returning an m × (n + 1) array of Brownian paths on [0, T] at n + 1 equally
          spaced times, and <C>levy_refine(rng, path, T)</C>, which inserts a conditionally correct midpoint between each pair of
          consecutive values.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def bm_paths(rng, m, n, T=1.0):
    return np.zeros((m, n + 1))

def levy_refine(rng, path, T=1.0):
    return path
`,
        solution: BM,
        tests: [
          { name: "paths", code: `P = bm_paths(np.random.default_rng(4), 5000, 200, T=3.0); assert P.shape == (5000, 201) and np.all(P[:, 0] == 0)
assert abs(P[:, -1].var() - 3) < 0.15 and abs(P[:, 100].var() - 1.5) < 0.1 and abs(np.cov(P[:, 50], P[:, 150])[0, 1] - 0.75) < 0.07` },
          { name: "refine", code: `rng = np.random.default_rng(3); m = np.array([levy_refine(rng, np.array([0.0, 0.0]))[1] for _ in range(20000)]); q = levy_refine(rng, np.array([0.0, 2.0, 1.0]), T=2.0)
assert abs(m.var() - 0.25) < 0.015 and len(q) == 5 and q[0::2].tolist() == [0.0, 2.0, 1.0]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>variations(path)</C>, returning the sums of absolute and of squared increments, and{" "}
          <C>max_exceeds(paths, a)</C>, the fraction of rows of an array of paths whose maximum is at least a.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def variations(path):
    return 0.0, 0.0

def max_exceeds(paths, a):
    return 0.0
`,
        solution: VAR,
        tests: [
          { name: "variations", code: `tv, qv = variations(np.array([0.0, 1.0, -1.0, 0.0, 2.0])); assert abs(tv - 6) < 1e-12 and abs(qv - 10) < 1e-12` },
          { name: "max", code: `P = np.array([[0.0, 0.2, 0.3], [0.0, 0.5, -1.0], [0.0, -0.1, 0.6], [0.0, 0.0, 0.0]]); assert max_exceeds(P, 0.5) == 0.5 and max_exceeds(P, 0.0) == 1.0 and max_exceeds(P, 0.7) == 0.0` },
        ],
      },
    },
    {
      key: "length",
      rung: "stretch",
      prompt: <p>A Brownian path on [0, 1] is sampled at 101 equally spaced times. What is the expected sum of absolute increments?</p>,
      answer: { kind: "numeric", value: 7.979, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Brownian motion appeared here by fiat. The next lesson derives it as the limit of rescaled random walks, then lets the
        walk&apos;s drift and step size depend on its position, arriving at general diffusions and the equation that governs
        their densities.
      </p>
    </>
  ),
};
