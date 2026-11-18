import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CutoffViz } from "@/components/viz/CutoffViz";
import type { LessonContent } from "@/lib/types";

const RT = `import numpy as np

def relaxation(P, pi):
    d = np.sqrt(pi); ev = np.sort(np.linalg.eigvalsh(d[:, None] * P / d[None, :]))
    return 1 / (1 - max(abs(ev[0]), ev[-2]))

def tmix(P, pi, eps=0.25, tmax=100000):
    M = np.eye(len(P))
    for t in range(tmax + 1):
        if 0.5 * np.abs(M - pi).sum(axis=1).max() <= eps:
            return t
        M = M @ P
    return None

def bounds(t_rel, pi_min, eps=0.25):
    return (t_rel - 1) * np.log(1 / (2 * eps)), t_rel * np.log(1 / (eps * pi_min))`;

const HC = `import numpy as np
from math import comb

def ehrenfest(n):
    P = np.zeros((n + 1, n + 1))
    for k in range(n + 1):
        P[k, k] += 0.5
        if k > 0: P[k, k - 1] += 0.5 * k / n
        if k < n: P[k, k + 1] += 0.5 * (n - k) / n
    return P

def hypercube_tv(n, ts):
    P, pi = ehrenfest(n), np.array([comb(n, k) / 2 ** n for k in range(n + 1)])
    d, t, out = np.eye(n + 1)[0], 0, []
    for T in ts:
        while t < T:
            d = d @ P; t += 1
        out.append(round(0.5 * float(np.abs(d - pi).sum()), 3))
    return out`;

export const lesson: LessonContent = {
  id: "m13.3.3",
  minutes: 55,
  links: {
    requires: ["m13.3.2"],
    revisits: ["m7.8.3", "m13.3.1"],
    foreshadows: ["m13.4.1"],
  },

  puzzle: (
    <>
      <p>
        Shuffle a deck by repeatedly taking a random card and either leaving it or flipping it over. How many moves before the
        pattern of face-up cards looks random? Watch the distance to uniform and something odd happens: for a long time it
        barely moves from its maximum, and then within a comparatively short burst it collapses to nearly zero. Why should a
        random process wait and then switch, rather than settle gradually?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Convergence theorems say a chain eventually forgets where it started; mixing times ask how soon. There are three
        complementary tools. Coupling runs two copies until they meet. The spectral gap measures how fast the slowest mode of
        the transition operator dies. Conductance looks for a bottleneck, a set the chain finds hard to leave. For many
        high-dimensional chains the answers line up into a sharp threshold, the cutoff, and the threshold sits at the time by
        which every coordinate has been randomised often enough to wash out the start.
      </p>
      <CutoffViz />
    </>
  ),

  theory: (
    <>
      <Definition title="mixing time">
        <p>
          For a chain with stationary distribution π, let <M>{"d(t) = \\max_x \\lVert P^t(x, \\cdot) - \\pi\\rVert_{TV}"}</M> and{" "}
          <M>{"\\bar d(t) = \\max_{x, y} \\lVert P^t(x, \\cdot) - P^t(y, \\cdot)\\rVert_{TV}"}</M>. The mixing time is{" "}
          <M>{"t_{mix}(\\varepsilon) = \\min\\{t : d(t) \\le \\varepsilon\\}"}</M>, and by convention{" "}
          <M>{"t_{mix} = t_{mix}(1/4)"}</M>.
        </p>
      </Definition>

      <Theorem title="submultiplicativity">
        <p>
          <M>{"d(t) \\le \\bar d(t) \\le 2d(t)"}</M> and <M>{"\\bar d(s + t) \\le \\bar d(s)\\bar d(t)"}</M>. Consequently{" "}
          <M>{"t_{mix}(\\varepsilon) \\le \\lceil \\log_2(1/\\varepsilon)\\rceil\\, t_{mix}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first pair follow from the triangle inequality and from writing π as an average of rows. For the product, run
          an optimal coupling of the chains from x and y for s steps; they disagree with probability{" "}
          <M>{"\\bar d(s)"}</M> at most, and if they disagree, a fresh optimal coupling for the next t steps fails with
          probability <M>{"\\bar d(t)"}</M> at most. So <M>{"\\bar d(\\ell\\, t_{mix}) \\le \\bar d(t_{mix})^\\ell \\le (2 \\cdot \\tfrac14)^\\ell = 2^{-\\ell}"}</M>, and{" "}
          <M>{"d \\le \\bar d"}</M> finishes it. Once a chain is a quarter mixed, every further block of the same length halves the
          distance: the hard part is reaching ¼.
        </p>
      </Proof>

      <Theorem title="relaxation-time bounds">
        <p>
          Let P be reversible and irreducible with eigenvalues{" "}
          <M>{"1 = \\lambda_1 > \\lambda_2 \\ge \\dots \\ge \\lambda_n \\ge -1"}</M>, absolute gap{" "}
          <M>{"\\gamma_* = 1 - \\max(\\lambda_2, |\\lambda_n|)"}</M> and relaxation time <M>{"t_{rel} = 1/\\gamma_*"}</M>. Then
        </p>
        <MD>{"(t_{rel} - 1)\\log\\frac{1}{2\\varepsilon} \;\\le\; t_{mix}(\\varepsilon) \;\\le\; t_{rel}\\log\\frac{1}{\\varepsilon\\,\\pi_{min}}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Upper bound: expanding in the π-orthonormal eigenbasis from the previous lesson,{" "}
          <M>{"|P^t(x, y)/\\pi(y) - 1| \\le \\lambda_*^t/\\sqrt{\\pi(x)\\pi(y)} \\le e^{-\\gamma_* t}/\\pi_{min}"}</M>, so the total
          variation is below ε once <M>{"t \\ge t_{rel}\\log(1/(\\varepsilon\\pi_{min}))"}</M>. Lower bound: take an eigenfunction f
          for the extreme eigenvalue λ, normalised so <M>{"\\max|f| = |f(x)|"}</M>. Since f has mean zero under π,{" "}
          <M>{"|\\lambda|^t |f(x)| = |P^t f(x) - \\pi f| \\le 2d(t)\\,|f(x)|"}</M>, so{" "}
          <M>{"d(t) \\ge \\tfrac12|\\lambda|^t"}</M> and taking logs gives the bound with{" "}
          <M>{"\\log(1/|\\lambda|) \\le 1/(t_{rel} - 1)"}</M>. For the lazy 20-cycle the code finds{" "}
          <M>{"t_{rel} \\approx 40.9"}</M>, true mixing time 38, and bounds 27.6 and 179.1: the lower bound is close, the upper one
          pays a <M>{"\\log(1/\\pi_{min})"}</M> factor.
        </p>
        <Code>{RT}</Code>
      </Proof>

      <Theorem title="the lazy hypercube">
        <p>
          On <M>{"\\{0, 1\\}^n"}</M>, let each step pick a coordinate uniformly and replace it by a fair random bit. Then{" "}
          <M>{"t_{mix}(\\varepsilon) \\le n\\log n + n\\log(1/\\varepsilon)"}</M>, and the chain has cutoff at{" "}
          <M>{"\\tfrac12 n \\log n"}</M>: for any c &gt; 0,{" "}
          <M>{"d((1 - c)\\tfrac12 n\\log n) \\to 1"}</M> and <M>{"d((1 + c)\\tfrac12 n\\log n) \\to 0"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Coupling: run two copies choosing the same coordinate and the same random bit. Once every coordinate has been chosen
          they agree forever; by the coupon collector bound, a given coordinate is still untouched after t steps with probability{" "}
          <M>{"(1 - 1/n)^t \\le e^{-t/n}"}</M>, and a union bound gives the upper estimate. The coupling is wasteful by a factor of
          two because the right statistic is the Hamming weight W, which is itself a Markov chain (the Ehrenfest urn), and the
          distance to π equals the distance of W to Binomial(n, ½). Its mean relaxes like{" "}
          <M>{"\\tfrac n2(1 - 1/n)^t"}</M> towards n/2 while its spread stays of order{" "}
          <M>{"\\sqrt n"}</M>; the bias falls below <M>{"\\sqrt n"}</M> exactly when{" "}
          <M>{"t \\approx \\tfrac12 n\\log n"}</M>, which is the cutoff. Note that the spectral upper bound here is useless:{" "}
          <M>{"t_{rel} = n"}</M> and <M>{"\\log(1/\\pi_{min}) = n\\log 2"}</M>, giving order <M>{"n^2"}</M>.
        </p>
        <Code>{HC}</Code>
      </Proof>

      <Remark title="bottlenecks and conductance">
        <p>
          The bottleneck ratio is <M>{"\\Phi = \\min_{\\pi(S) \\le 1/2} Q(S, S^c)/\\pi(S)"}</M>, where{" "}
          <M>{"Q(S, S^c) = \\sum_{x \\in S, y \\notin S}\\pi(x)P(x, y)"}</M> is the stationary flow out of S. Started inside S, the
          chain leaves at rate Φ at most, so <M>{"t_{mix} \\ge 1/(4\\Phi)"}</M>. For reversible chains Cheeger&apos;s inequality{" "}
          <M>{"\\Phi^2/2 \\le 1 - \\lambda_2 \\le 2\\Phi"}</M> ties the spectral gap to the worst bottleneck. Two well-separated
          modes of a posterior form exactly such a bottleneck, which is why local samplers stall on multimodal targets.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "boost",
      rung: "check",
      prompt: (
        <p>
          The lazy walk on a 20-cycle has <M>{"t_{mix}(1/4) = 38"}</M>. What upper bound does submultiplicativity give for{" "}
          <M>{"t_{mix}(1/64)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 228, tolerance: 0.5 },
    },
    {
      key: "cut",
      rung: "check",
      prompt: <p>Where is the cutoff of the lazy walk on the 100-dimensional hypercube, to the nearest step?</p>,
      answer: { kind: "numeric", value: 230, tolerance: 1 },
    },
    {
      key: "bottleneck",
      rung: "apply",
      prompt: (
        <p>
          Two complete graphs on 50 vertices each are joined by a single edge, and a lazy random walk runs on the result. Why does
          it mix slowly?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The stationary flow across the single edge is tiny compared with the mass of either half, so the bottleneck ratio is small",
          "The graph is not connected, so the walk is reducible",
          "Complete graphs have small spectral gaps",
          "The walk is periodic because of the joining edge",
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

def relaxation(P, pi):
    d = np.sqrt(pi); ev = np.sort(np.linalg.eigvalsh(d[:, None] * P / d[None, :]))
    return 1 / (1 - max(abs(ev[0]), ev[-2]))

def tmix(P, pi, eps=0.25, tmax=100000):
    M = np.eye(len(P))
    for t in range(tmax + 1):
        if 0.5 * np.abs(M - pi).sum(axis=1).max() <= eps:
            return t
        M = M @ P
    return None

def bounds(t_rel, pi_min, eps=0.25):
    return (t_rel - 1) * np.log(1 / (2 * eps)), t_rel * np.log(1 / (eps * pi_min))

n = 20; P = 0.5 * np.eye(n) + 0.25 * (np.roll(np.eye(n), 1, axis=1) + np.roll(np.eye(n), -1, axis=1)); pi = np.full(n, 1 / n); tr = relaxation(P, pi); print(round(tr, 1), tmix(P, pi))
lo, hi = bounds(tr, 1 / n); print(round(lo, 1), round(hi, 1), lo <= tmix(P, pi) <= hi)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "40.9 38\n27.6 179.1 True",
          "40.9 38\n27.6 179.1 False",
          "20.0 38\n13.2 87.6 True",
          "40.9 179\n27.6 179.1 True",
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
from math import comb

def ehrenfest(n):
    P = np.zeros((n + 1, n + 1))
    for k in range(n + 1):
        P[k, k] += 0.5
        if k > 0: P[k, k - 1] += 0.5 * k / n
        if k < n: P[k, k + 1] += 0.5 * (n - k) / n
    return P

def hypercube_tv(n, ts):
    P, pi = ehrenfest(n), np.array([comb(n, k) / 2 ** n for k in range(n + 1)])
    d, t, out = np.eye(n + 1)[0], 0, []
    for T in ts:
        while t < T:
            d = d @ P; t += 1
        out.append(round(0.5 * float(np.abs(d - pi).sum()), 3))
    return out

print(ehrenfest(4)[1].tolist(), round(float(ehrenfest(4).sum()), 3))
print(hypercube_tv(100, [0, 115, 230, 345]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.125, 0.5, 0.375, 0.0, 0.0] 5.0\n[1.0, 0.904, 0.383, 0.124]",
          "[0.25, 0.5, 0.25, 0.0, 0.0] 5.0\n[1.0, 0.904, 0.383, 0.124]",
          "[0.125, 0.5, 0.375, 0.0, 0.0] 5.0\n[1.0, 0.75, 0.5, 0.25]",
          "[0.125, 0.5, 0.375, 0.0, 0.0] 1.0\n[1.0, 0.904, 0.383, 0.124]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>relaxation(P, pi)</C>, returning <M>{"1/\\gamma_*"}</M> for a reversible P; <C>tmix(P, pi, eps)</C>, the first t
          at which the worst-case total variation distance is at most eps; and <C>bounds(t_rel, pi_min, eps)</C>, the two
          relaxation-time bounds.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def relaxation(P, pi):
    return 1.0

def tmix(P, pi, eps=0.25, tmax=100000):
    return 0

def bounds(t_rel, pi_min, eps=0.25):
    return 0.0, 0.0
`,
        solution: RT,
        tests: [
          { name: "two-state", code: `P = np.array([[0.9, 0.1], [0.2, 0.8]]); pi = np.array([2 / 3, 1 / 3])
assert abs(relaxation(P, pi) - 10 / 3) < 1e-6 and tmix(P, pi) == 3 and tmix(P, pi, 0.01) == 12` },
          { name: "cycle", code: `n = 10; C = 0.5 * np.eye(n) + 0.25 * (np.roll(np.eye(n), 1, 1) + np.roll(np.eye(n), -1, 1)); u = np.full(n, 0.1); tr = relaxation(C, u); lo, hi = bounds(tr, 0.1)
assert abs(tr - 10.472) < 1e-3 and tmix(C, u) == 10 and abs(lo - 6.566) < 1e-3 and abs(hi - 38.630) < 1e-3` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ehrenfest(n)</C>, the transition matrix of the Hamming weight of the lazy hypercube walk, and{" "}
          <C>hypercube_tv(n, ts)</C>, the total variation distance to Binomial(n, ½) at each time in the increasing list ts,
          starting from weight 0 and rounded to three places.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np
from math import comb

def ehrenfest(n):
    return np.eye(n + 1)

def hypercube_tv(n, ts):
    return [0.0 for _ in ts]
`,
        solution: HC,
        tests: [
          { name: "urn", code: `P = ehrenfest(6); b = np.array([comb(6, k) for k in range(7)]) / 64
assert np.allclose(P.sum(axis=1), 1) and np.allclose(b @ P, b) and abs(P[2, 1] - 1 / 6) < 1e-12 and abs(P[2, 3] - 1 / 3) < 1e-12` },
          { name: "tv", code: `assert hypercube_tv(1, [0, 1]) == [0.5, 0.0] and hypercube_tv(3, [1, 2, 5]) == [0.5, 0.333, 0.099]` },
        ],
      },
    },
    {
      key: "spectral",
      rung: "stretch",
      prompt: (
        <p>
          The lazy walk on the 10-dimensional hypercube has <M>{"t_{rel} = 10"}</M> and uniform stationary distribution. What
          upper bound on <M>{"t_{mix}(1/4)"}</M> does the relaxation-time theorem give? (The true value is 16.)
        </p>
      ),
      answer: { kind: "numeric", value: 83.18, tolerance: 0.05 },
    },
  ],

  glimpse: (
    <>
      <p>
        So far the chains have been given. Next we design them: the Metropolis-Hastings recipe turns any proposal into a chain
        reversible with respect to a target known only up to a constant, and the tools of this lesson tell us when it will mix.
      </p>
    </>
  ),
};
