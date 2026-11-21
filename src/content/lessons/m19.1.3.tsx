import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ReflectionViz } from "@/components/viz/ReflectionViz";
import type { LessonContent } from "@/lib/types";

const SEMI = `import numpy as np

def heat_kernel(x, y, t):
    return float(np.exp(-(y - x) ** 2 / (2 * t)) / np.sqrt(2 * np.pi * t))   # density of B_t at y, started at x

def chapman_kolmogorov(x, z, s, t, grid):
    dy = grid[1] - grid[0]
    p = np.exp(-(grid - x) ** 2 / (2 * s)) / np.sqrt(2 * np.pi * s)
    q = np.exp(-(z - grid) ** 2 / (2 * t)) / np.sqrt(2 * np.pi * t)
    return float(np.sum(p * q) * dy)                  # go to y by time s, then on to z in time t

def expect_f(f, x, t, grid):
    dy = grid[1] - grid[0]
    p = np.exp(-(grid - x) ** 2 / (2 * t)) / np.sqrt(2 * np.pi * t)
    return float(np.sum(f(grid) * p) * dy)            # the semigroup: E[f(B_t) | B_0 = x]`;

const REFLECT = `import numpy as np
from math import erf, sqrt

def max_tail(a, t):
    return 1 - erf(a / sqrt(2 * t))                   # P(max of B on [0, t] >= a) = 2 P(B_t >= a), for a > 0

def first_hit(path, a):
    hits = np.nonzero(path >= a)[0]
    return int(hits[0]) if len(hits) else -1

def reflect(path, a):
    k, out = first_hit(path, a), path.copy()
    if k >= 0:
        out[k + 1:] = 2 * a - path[k + 1:]            # mirror the path in the level after it first reaches it
    return out`;

export const lesson: LessonContent = {
  id: "m19.1.3",
  minutes: 55,
  links: {
    requires: ["m19.1.2", "m18.5.3"],
    revisits: ["m18.5.1", "m13.3.1"],
    foreshadows: ["m19.3.3"],
  },

  puzzle: (
    <>
      <p>
        A Brownian motion starts at 0 and runs for one unit of time. The chance that it ends above 1 is about 16%. What is the chance
        that it reaches 1 at some moment, even if it falls back afterwards? Simulation suggests almost exactly twice as much, and
        the factor of two is no accident. Where does it come from, and what does it require of the process?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Brownian motion forgets: given its value now, its future does not depend on how it got there. This holds not only at fixed
        times but at random times that are decided by the path so far, such as the first moment it reaches a level a. From that
        moment, the path is a fresh Brownian motion started at a, as likely to end above a as below it. Mirroring the part after the
        hitting time pairs each path that reaches a and ends below it with one that ends above it. So reaching a is exactly twice as
        likely as ending above a.
      </p>
      <ReflectionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="transition density and semigroup">
        <p>
          The transition density of Brownian motion is the heat kernel{" "}
          <M>{"p_t(x, y) = (2\\pi t)^{-1/2} e^{-(y-x)^2/(2t)}"}</M> (<C>heat_kernel</C>), the density of <M>{"x + B_t"}</M> at y. It
          defines operators <M>{"P_t f(x) = \\mathbb{E}[f(x + B_t)] = \\int f(y) p_t(x, y)\\, dy"}</M> (<C>expect_f</C>). The
          Chapman–Kolmogorov identity <M>{"\\int p_s(x, y) p_t(y, z)\\, dy = p_{s+t}(x, z)"}</M> (<C>chapman_kolmogorov</C>, computed
          on a grid) says <M>{"P_s P_t = P_{s+t}"}</M>: going to an intermediate point and on from there is the same as going directly.
        </p>
        <Code>{SEMI}</Code>
      </Definition>

      <Theorem title="the Markov property">
        <p>
          Let <M>{"\\mathcal{F}_s = \\sigma(B_r : r \\le s)"}</M>. For every <M>{"s \\ge 0"}</M>, the process{" "}
          <M>{"W_t = B_{s+t} - B_s"}</M> is a standard Brownian motion independent of <M>{"\\mathcal{F}_s"}</M>. Consequently, for
          bounded measurable f,
        </p>
        <MD>{"\\mathbb{E}[f(B_{s+t}) \\mid \\mathcal{F}_s] = P_t f(B_s)."}</MD>
      </Theorem>
      <Proof>
        <p>
          W starts at 0, has continuous paths, and its increments are increments of B over times after s, so they are independent,
          Gaussian with the right variances, and independent of every increment before s; since <M>{"\\mathcal{F}_s"}</M> is generated
          by those earlier increments, W is independent of it. Then <M>{"f(B_{s+t}) = f(B_s + W_t)"}</M> with <M>{"B_s"}</M> known
          given <M>{"\\mathcal{F}_s"}</M> and <M>{"W_t \\sim N(0, t)"}</M> independent of it, so the conditional expectation (m18.5.1)
          is <M>{"\\int f(B_s + w) p_t(0, w)\\, dw = P_t f(B_s)"}</M>.
        </p>
      </Proof>

      <Theorem title="the strong Markov property">
        <p>
          Let τ be a stopping time (m18.5.3), finite almost surely. Then <M>{"W_t = B_{\\tau+t} - B_\\tau"}</M> is a standard Brownian
          motion independent of <M>{"\\mathcal{F}_\\tau"}</M>, the information up to time τ.
        </p>
      </Theorem>
      <Proof>
        <p>
          First let τ take values in a countable set <M>{"\\{s_j\\}"}</M>. For an event A in <M>{"\\mathcal{F}_\\tau"}</M> and a bounded
          continuous functional F of a path,{" "}
          <M>{"\\mathbb{E}[F(W) 1_A] = \\sum_j \\mathbb{E}[F(B_{s_j + \\cdot} - B_{s_j}) 1_{A \\cap \\{\\tau = s_j\\}}]"}</M>. Each{" "}
          <M>{"A \\cap \\{\\tau = s_j\\}"}</M> lies in <M>{"\\mathcal{F}_{s_j}"}</M>, so by the Markov property each term is{" "}
          <M>{"\\mathbb{E}[F(B)] P(A \\cap \\{\\tau = s_j\\})"}</M>, and the sum is <M>{"\\mathbb{E}[F(B)] P(A)"}</M>. For general τ,
          the times <M>{"\\tau_n = \\lceil 2^n \\tau \\rceil / 2^n"}</M> are stopping times with countably many values that decrease to
          τ, and <M>{"\\mathcal{F}_\\tau \\subseteq \\mathcal{F}_{\\tau_n}"}</M>. The identity holds for each <M>{"\\tau_n"}</M>; by
          continuity of paths <M>{"B_{\\tau_n + \\cdot} - B_{\\tau_n} \\to B_{\\tau + \\cdot} - B_\\tau"}</M> uniformly on compact
          intervals, and bounded convergence passes the identity to the limit.
        </p>
      </Proof>

      <Definition title="hitting and reflecting">
        <p>
          <C>first_hit</C> finds the first index at which a sampled path reaches a, and <C>reflect</C> mirrors the path in a after that
          index. <C>max_tail</C> is the probability, given by the next theorem, that the maximum on [0, t] reaches a.
        </p>
        <Code>{REFLECT}</Code>
      </Definition>

      <Theorem title="the reflection principle">
        <p>
          For a &gt; 0 and t &gt; 0, with <M>{"M_t = \\max_{s \\le t} B_s"}</M>,
        </p>
        <MD>{"P(M_t \\ge a) = 2P(B_t \\ge a) = 2\\left(1 - \\Phi(a/\\sqrt t)\\right)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"\\tau_a = \\inf\\{s : B_s = a\\}"}</M>, a stopping time; by continuity <M>{"M_t \\ge a"}</M> exactly when{" "}
          <M>{"\\tau_a \\le t"}</M>. On that event the strong Markov property makes <M>{"B_t - a = W_{t - \\tau_a}"}</M> with W a
          Brownian motion independent of <M>{"\\tau_a"}</M>, and by symmetry of W,{" "}
          <M>{"P(B_t > a, \\tau_a \\le t) = P(B_t < a, \\tau_a \\le t)"}</M>. The two add to <M>{"P(\\tau_a \\le t)"}</M>, since{" "}
          <M>{"P(B_t = a) = 0"}</M>. And <M>{"\\{B_t > a\\} \\subseteq \\{\\tau_a \\le t\\}"}</M> by continuity, so{" "}
          <M>{"P(B_t > a) = \\tfrac12 P(\\tau_a \\le t)"}</M>.
        </p>
      </Proof>

      <Example title="consequences">
        <p>
          Letting t → ∞ gives <M>{"P(\\tau_a < \\infty) = 1"}</M>: Brownian motion reaches every level. Differentiating{" "}
          <M>{"P(\\tau_a \\le t)"}</M> in t gives the hitting-time density{" "}
          <M>{"\\frac{a}{\\sqrt{2\\pi t^3}} e^{-a^2/(2t)}"}</M>, whose tail decays like <M>{"t^{-3/2}"}</M>, so{" "}
          <M>{"\\mathbb{E}\\tau_a = \\infty"}</M>: the level is reached for sure, but the expected wait is infinite. The maximum{" "}
          <M>{"M_t"}</M> has the same law as <M>{"|B_t|"}</M>.
        </p>
      </Example>

      <Remark title="Markov processes and generators">
        <p>
          The semigroup <M>{"P_t"}</M> is the continuous-time analogue of the transition matrix of a Markov chain (m13.3.1). Its
          derivative at t = 0 is the generator, which for Brownian motion is <M>{"\\tfrac12 \\frac{d^2}{dx^2}"}</M>: the heat kernel
          solves <M>{"\\partial_t p = \\tfrac12 \\partial_y^2 p"}</M>. Every SDE later in the course defines a Markov process with its
          own semigroup and generator, and the Fokker–Planck equation describes how its densities evolve.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "max",
      rung: "check",
      prompt: (
        <p>
          What is the probability that a Brownian motion started at 0 reaches 1 at some time in [0, 4]? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.617, tolerance: 0.0005 },
    },
    {
      key: "moment",
      rung: "check",
      prompt: (
        <p>
          Given <M>{"B_0 = 1"}</M>, what is <M>{"\\mathbb{E}[B_3^4]"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 46, tolerance: 0.001 },
    },
    {
      key: "stopping",
      rung: "apply",
      prompt: (
        <p>
          The strong Markov property fails at the time of the last zero of B before time 1. Why does the theorem not apply there?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "It is not a stopping time: deciding whether a zero is the last one requires seeing the path after it",
          "It is not finite almost surely",
          "B is not continuous at its zeros",
          "The strong Markov property holds only at fixed times",
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

def heat_kernel(x, y, t):
    return float(np.exp(-(y - x) ** 2 / (2 * t)) / np.sqrt(2 * np.pi * t))   # density of B_t at y, started at x

def chapman_kolmogorov(x, z, s, t, grid):
    dy = grid[1] - grid[0]
    p = np.exp(-(grid - x) ** 2 / (2 * s)) / np.sqrt(2 * np.pi * s)
    q = np.exp(-(z - grid) ** 2 / (2 * t)) / np.sqrt(2 * np.pi * t)
    return float(np.sum(p * q) * dy)                  # go to y by time s, then on to z in time t

def expect_f(f, x, t, grid):
    dy = grid[1] - grid[0]
    p = np.exp(-(grid - x) ** 2 / (2 * t)) / np.sqrt(2 * np.pi * t)
    return float(np.sum(f(grid) * p) * dy)            # the semigroup: E[f(B_t) | B_0 = x]

grid = np.linspace(-10, 10, 4001)
print(round(heat_kernel(0.0, 0.0, 0.5), 4), round(chapman_kolmogorov(0.0, 1.0, 0.3, 0.7, grid), 4), round(heat_kernel(0.0, 1.0, 1.0), 4), round(expect_f(lambda y: y ** 2, 1.0, 2.0, grid), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.5642 0.242 0.242 3.0", "0.5642 0.1468 0.242 3.0", "0.3989 0.242 0.242 3.0", "0.5642 0.242 0.242 2.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
from math import erf, sqrt

def max_tail(a, t):
    return 1 - erf(a / sqrt(2 * t))                   # P(max of B on [0, t] >= a) = 2 P(B_t >= a), for a > 0

def first_hit(path, a):
    hits = np.nonzero(path >= a)[0]
    return int(hits[0]) if len(hits) else -1

def reflect(path, a):
    k, out = first_hit(path, a), path.copy()
    if k >= 0:
        out[k + 1:] = 2 * a - path[k + 1:]            # mirror the path in the level after it first reaches it
    return out

path = np.array([0.0, 0.5, 1.2, 0.8, 1.5])
print(first_hit(path, 1.0), reflect(path, 1.0).tolist(), round(max_tail(1.0, 1.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2 [0.0, 0.5, 1.2, 1.2, 0.5] 0.3173",
          "2 [0.0, 0.5, 0.8, 1.2, 0.5] 0.3173",
          "3 [0.0, 0.5, 1.2, 0.8, 0.5] 0.3173",
          "2 [0.0, 0.5, 1.2, 1.2, 0.5] 0.1587",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>heat_kernel(x, y, t)</C>, and <C>chapman_kolmogorov(x, z, s, t, grid)</C> and <C>expect_f(f, x, t, grid)</C> as
          Riemann sums over an evenly spaced grid. All return floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def heat_kernel(x, y, t):
    return float(np.exp(-(y - x) ** 2 / 2))

def chapman_kolmogorov(x, z, s, t, grid):
    return heat_kernel(x, z, s * t)

def expect_f(f, x, t, grid):
    return float(f(x))
`,
        solution: SEMI,
        tests: [
          { name: "kernel", code: `assert abs(heat_kernel(1.0, 3.0, 2.0) - np.exp(-1) / np.sqrt(4 * np.pi)) < 1e-12\ng = np.linspace(-12, 12, 6001)\nassert abs(chapman_kolmogorov(0.5, -1.0, 1.0, 2.0, g) - heat_kernel(0.5, -1.0, 3.0)) < 1e-6` },
          { name: "semigroup", code: `g = np.linspace(-12, 12, 6001)\nassert abs(expect_f(lambda y: y ** 4, 0.0, 1.5, g) - 3 * 1.5 ** 2) < 1e-6 and abs(expect_f(lambda y: y, 2.0, 1.0, g) - 2.0) < 1e-6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>max_tail(a, t)</C>, <C>first_hit(path, a)</C>, returning -1 if the path never reaches a, and{" "}
          <C>reflect(path, a)</C>, returning a new array.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np
from math import erf, sqrt

def max_tail(a, t):
    return (1 - erf(a / sqrt(2 * t))) / 2

def first_hit(path, a):
    return 0

def reflect(path, a):
    return path
`,
        solution: REFLECT,
        tests: [
          { name: "tail", code: `assert abs(max_tail(2.0, 4.0) - (1 - erf(1 / sqrt(2)))) < 1e-12 and first_hit(np.array([0.0, 0.3, 0.2]), 1.0) == -1` },
          { name: "reflect", code: `p = np.array([0.0, -1.0, -2.5, -1.0])\nassert first_hit(-p, 2.0) == 2 and reflect(p, 1.0).tolist() == p.tolist()\nr = reflect(np.array([0.0, 2.0, 1.0, 3.0]), 2.0)\nassert r.tolist() == [0.0, 2.0, 3.0, 1.0]` },
        ],
      },
    },
    {
      key: "median",
      rung: "stretch",
      prompt: (
        <p>
          Let <M>{"\\tau_1"}</M> be the first time a Brownian motion started at 0 reaches 1. What is its median? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.2, tolerance: 0.006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Brownian paths have infinite length, so <M>{"\\int f\\, dB"}</M> cannot be defined path by path as an ordinary integral. The
        next chapter builds it anyway, as a limit in mean square, starting from integrands that are constant on intervals.
      </p>
    </>
  ),
};
