import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LevyConstructionViz } from "@/components/viz/LevyConstructionViz";
import type { LessonContent } from "@/lib/types";

const WALK = `import numpy as np

def scaled_walk(steps, n):
    return np.concatenate([[0.0], np.cumsum(steps)]) / np.sqrt(n)   # value at time k/n is S_k / sqrt(n)

def increments(path):
    return np.diff(path)

def empirical_cov(paths, i, j):
    return float(np.mean(paths[:, i] * paths[:, j]))   # paths start at 0 and have mean zero`;

const LEVY = `import numpy as np

def bridge_var(s, t, u):
    return (u - s) * (t - u) / (t - s)                  # variance of B_u given B_s and B_t

def refine(path, dt, z):
    mid = (path[:-1] + path[1:]) / 2 + np.sqrt(dt) / 2 * z   # midpoint: average plus N(0, dt/4)
    out = np.empty(2 * len(path) - 1)
    out[0::2], out[1::2] = path, mid
    return out

def levy_path(zs):
    path, dt = np.array([0.0, zs[0][0]]), 1.0             # B_0 = 0 and B_1 ~ N(0, 1)
    for z in zs[1:]:
        path, dt = refine(path, dt, z), dt / 2
    return path`;

export const lesson: LessonContent = {
  id: "m19.1.1",
  minutes: 55,
  links: {
    requires: ["m13.5.2", "m18.3.3"],
    revisits: ["m13.5.3", "m18.6.3"],
    foreshadows: ["m19.1.2"],
  },

  puzzle: (
    <>
      <p>
        Brownian motion is easy to describe: start at 0, take independent Gaussian increments whose variance equals the elapsed time,
        and draw the path without lifting the pen. But it is not obvious that such an object exists. There are uncountably many times,
        and specifying the distribution at every finite set of times says nothing, by itself, about whether the path can be chosen
        continuous. A random walk sped up and shrunk looks right on a screen, but a picture is not a proof. How can one actually build
        a random continuous function with exactly these properties?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Build the path coarse to fine. Draw <M>{"B(1)"}</M>. Given the values at the ends of an interval, the value at its midpoint is
        Gaussian with mean the average of the ends and variance a quarter of the interval&apos;s length; draw it, and repeat on each
        half. Every level adds detail at a finer scale without moving the points already placed. The added detail at level n has size
        about <M>{"2^{-n/2}"}</M>, and even the largest of the <M>{"2^{n}"}</M> corrections shrinks fast enough to sum, so the
        piecewise linear paths converge uniformly and the limit is continuous.
      </p>
      <LevyConstructionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Brownian motion">
        <p>
          A standard Brownian motion is a process <M>{"(B_t)_{t \\ge 0}"}</M> with <M>{"B_0 = 0"}</M>, independent increments{" "}
          <M>{"B_{t_1} - B_{t_0}, \\dots, B_{t_k} - B_{t_{k-1}}"}</M> for <M>{"t_0 < \\dots < t_k"}</M>, increments{" "}
          <M>{"B_t - B_s \\sim N(0, t - s)"}</M>, and continuous paths. Equivalently it is a continuous Gaussian process with mean zero and
          covariance <M>{"\\mathbb{E}[B_s B_t] = \\min(s, t)"}</M>. Scaled random walks (m13.5.3) converge in distribution to it by
          Donsker&apos;s theorem, the functional form of the central limit theorem (m18.6.3); <C>scaled_walk</C> builds one,{" "}
          <C>increments</C> recovers its steps, and <C>empirical_cov</C> estimates the covariance at two times from many paths.
        </p>
        <Code>{WALK}</Code>
      </Definition>

      <Theorem title="the Brownian bridge midpoint">
        <p>
          For <M>{"s < u < t"}</M>, given <M>{"B_s = a"}</M> and <M>{"B_t = b"}</M>, the value <M>{"B_u"}</M> is Gaussian with
        </p>
        <MD>{"\\mathbb{E}[B_u \\mid B_s = a, B_t = b] = a + \\frac{u - s}{t - s}(b - a), \\qquad \\operatorname{Var} = \\frac{(u - s)(t - u)}{t - s}."}</MD>
        <p>
          At the midpoint the mean is <M>{"(a+b)/2"}</M> and the variance <M>{"(t-s)/4"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"X = B_u - B_s"}</M> and <M>{"Y = B_t - B_u"}</M>, independent with variances <M>{"u - s"}</M> and{" "}
          <M>{"t - u"}</M>, and condition on <M>{"X + Y = b - a"}</M>. For jointly Gaussian variables the conditional law is Gaussian with
          mean <M>{"\\frac{\\operatorname{Cov}(X, X+Y)}{\\operatorname{Var}(X+Y)}(b - a) = \\frac{u - s}{t - s}(b - a)"}</M> and variance{" "}
          <M>{"\\operatorname{Var}X - \\frac{\\operatorname{Cov}(X,X+Y)^2}{\\operatorname{Var}(X+Y)} = (u-s) - \\frac{(u-s)^2}{t-s} = \\frac{(u-s)(t-u)}{t-s}"}</M>
          . Adding <M>{"B_s = a"}</M> gives the mean. By the independence of increments, conditioning additionally on values outside{" "}
          <M>{"[s, t]"}</M> changes nothing.
        </p>
      </Proof>

      <Definition title="Lévy's construction">
        <p>
          <C>levy_path</C> takes standard normals level by level: one for <M>{"B_1"}</M>, then <M>{"2^{n-1}"}</M> at level n.{" "}
          <C>refine</C> inserts each midpoint as the average of its neighbours plus <M>{"\\sqrt{\\Delta t}/2"}</M> times a fresh
          normal, where <M>{"\\Delta t"}</M> is the current spacing, so its conditional variance is <M>{"\\Delta t/4"}</M>, as the bridge
          theorem requires. <C>bridge_var</C> is the bridge variance at a general time.
        </p>
        <Code>{LEVY}</Code>
      </Definition>

      <Theorem title="Brownian motion exists">
        <p>
          Let <M>{"B^{(n)}"}</M> be the piecewise linear interpolation of Lévy&apos;s construction after n levels. Almost surely{" "}
          <M>{"B^{(n)}"}</M> converges uniformly on <M>{"[0, 1]"}</M>, and the limit is a standard Brownian motion on <M>{"[0, 1]"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the bridge theorem and induction, the values on the dyadic grid of level n have the joint law of Brownian motion there:
          each new midpoint has the correct conditional law given all earlier points. The difference <M>{"B^{(n)} - B^{(n-1)}"}</M> is
          piecewise linear with peaks at the new midpoints of height <M>{"2^{-(n+1)/2} |Z|"}</M> for standard normals Z, so its sup is{" "}
          <M>{"2^{-(n+1)/2} M_n"}</M> where <M>{"M_n"}</M> is the largest of <M>{"2^{n-1}"}</M> values <M>{"|Z|"}</M>. Using{" "}
          <M>{"P(|Z| > x) \\le e^{-x^2/2}"}</M> for <M>{"x \\ge 1"}</M>,
        </p>
        <MD>{"P(M_n > 2\\sqrt{n}) \\le 2^{n-1} e^{-2n} \\le e^{-n},"}</MD>
        <p>
          which is summable, so by Borel–Cantelli (m18.3.3) <M>{"M_n \\le 2\\sqrt n"}</M> for all large n almost surely. Then{" "}
          <M>{"\\sum_n 2^{-(n+1)/2} M_n < \\infty"}</M>, the sequence is uniformly Cauchy, and the uniform limit B of continuous functions
          is continuous. B agrees with the construction on every dyadic time, so its finite-dimensional laws on dyadic times are
          Brownian; for general times approximate by dyadic ones, using continuity of paths and the fact that Gaussian laws with
          converging covariances converge. Independent copies on <M>{"[k, k+1]"}</M>, joined end to end, extend B to all{" "}
          <M>{"t \\ge 0"}</M>.
        </p>
      </Proof>

      <Example title="covariance and scaling">
        <p>
          For <M>{"s \\le t"}</M>, <M>{"\\mathbb{E}[B_s B_t] = \\mathbb{E}[B_s^2] + \\mathbb{E}[B_s(B_t - B_s)] = s"}</M>, which gives
          the covariance <M>{"\\min(s,t)"}</M>. For c &gt; 0, <M>{"c^{-1/2} B_{ct}"}</M> is again a standard Brownian motion: it is
          continuous, Gaussian and has covariance <M>{"c^{-1}\\min(cs, ct) = \\min(s,t)"}</M>. Zooming in by a factor c in time and{" "}
          <M>{"\\sqrt c"}</M> in space reproduces the same picture, which is why the path has no tangent anywhere.
        </p>
      </Example>

      <Remark title="why diffusion models care">
        <p>
          Diffusion models add Gaussian noise over a continuous time interval, and the noise is a Brownian motion. Lévy&apos;s
          construction is also how samplers see it: a coarse discretisation draws increments on a grid, and refining the grid adds
          independent detail between existing points without changing them. The bridge formula reappears when interpolating between
          noise and data in later chapters.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bridge",
      rung: "check",
      prompt: (
        <p>
          Given <M>{"B_0 = 0"}</M> and <M>{"B_2 = 1"}</M>, what is the conditional variance of <M>{"B_{0.5}"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.375, tolerance: 0.0005 },
    },
    {
      key: "var",
      rung: "check",
      prompt: (
        <p>
          What is <M>{"\\operatorname{Var}(B_{0.8} - 2B_{0.3})"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.8, tolerance: 0.0005 },
    },
    {
      key: "fixed",
      rung: "apply",
      prompt: <p>Why does each level of Lévy&apos;s construction leave the earlier grid points unchanged?</p>,
      answer: {
        kind: "choice",
        options: [
          "New points are drawn from their conditional law given the existing ones, so the joint law on the old grid is already correct and nothing there needs to be redrawn",
          "Brownian paths are constant between dyadic times",
          "The new noise has mean zero, so it cancels at the old points",
          "The construction rescales the whole path at each level to keep its variance fixed",
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

def scaled_walk(steps, n):
    return np.concatenate([[0.0], np.cumsum(steps)]) / np.sqrt(n)   # value at time k/n is S_k / sqrt(n)

def increments(path):
    return np.diff(path)

def empirical_cov(paths, i, j):
    return float(np.mean(paths[:, i] * paths[:, j]))   # paths start at 0 and have mean zero

p = scaled_walk(np.array([1, 1, -1, 1]), 4)
print(p.tolist(), increments(p).tolist(), empirical_cov(np.array([[1.0, 2.0], [-1.0, 0.0]]), 0, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 0.5, 1.0, 0.5, 1.0] [0.5, 0.5, -0.5, 0.5] 1.0",
          "[0.0, 0.25, 0.5, 0.25, 0.5] [0.25, 0.25, -0.25, 0.25] 1.0",
          "[0.5, 1.0, 0.5, 1.0] [0.5, -0.5, 0.5] 1.0",
          "[0.0, 0.5, 1.0, 0.5, 1.0] [0.5, 0.5, -0.5, 0.5] 0.5",
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

def bridge_var(s, t, u):
    return (u - s) * (t - u) / (t - s)                  # variance of B_u given B_s and B_t

def refine(path, dt, z):
    mid = (path[:-1] + path[1:]) / 2 + np.sqrt(dt) / 2 * z   # midpoint: average plus N(0, dt/4)
    out = np.empty(2 * len(path) - 1)
    out[0::2], out[1::2] = path, mid
    return out

def levy_path(zs):
    path, dt = np.array([0.0, zs[0][0]]), 1.0             # B_0 = 0 and B_1 ~ N(0, 1)
    for z in zs[1:]:
        path, dt = refine(path, dt, z), dt / 2
    return path

path = levy_path([np.array([2.0]), np.array([1.0]), np.array([0.0, -2.0])])
print(np.round(path, 4).tolist(), bridge_var(0, 1, 0.25))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 0.75, 1.5, 1.0429, 2.0] 0.1875",
          "[0.0, 0.75, 1.5, 0.75, 2.0] 0.1875",
          "[0.0, 0.5, 1.0, 1.5, 2.0] 0.25",
          "[0.0, 0.75, 1.5, 1.0429, 2.0] 0.25",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>scaled_walk(steps, n)</C>, <C>increments(path)</C> and <C>empirical_cov(paths, i, j)</C>, returning a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def scaled_walk(steps, n):
    return np.cumsum(steps) / n

def increments(path):
    return path

def empirical_cov(paths, i, j):
    return 0.0
`,
        solution: WALK,
        tests: [
          { name: "walk", code: `p = scaled_walk(np.array([1, -1, -1]), 9)\nassert p.shape == (4,) and np.allclose(p, [0, 1 / 3, 0, -1 / 3]) and np.allclose(increments(p), [1 / 3, -1 / 3, -1 / 3])` },
          { name: "cov", code: `P = np.array([[2.0, 3.0, 1.0], [0.0, -1.0, 4.0]])\nassert empirical_cov(P, 0, 1) == 3.0 and empirical_cov(P, 1, 2) == -0.5` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bridge_var(s, t, u)</C>, <C>refine(path, dt, z)</C> and <C>levy_path(zs)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def bridge_var(s, t, u):
    return u - s

def refine(path, dt, z):
    return path

def levy_path(zs):
    return np.array([0.0, zs[0][0]])
`,
        solution: LEVY,
        tests: [
          { name: "bridge", code: `assert bridge_var(1, 5, 2) == 0.75 and bridge_var(0, 4, 2) == 1.0\nassert np.allclose(refine(np.array([0.0, 2.0, 0.0]), 4.0, np.array([1.0, 0.0])), [0.0, 2.0, 2.0, 1.0, 0.0])` },
          { name: "levy", code: `p = levy_path([np.array([1.0]), np.array([2.0]), np.array([0.0, 0.0])])\nassert p.shape == (5,) and np.allclose(p, [0.0, 0.75, 1.5, 1.25, 1.0])` },
        ],
      },
    },
    {
      key: "fourth",
      rung: "stretch",
      prompt: (
        <p>
          Compute <M>{"\\mathbb{E}[B_{0.5}^2 B_2^2]"}</M>. (Hint: write <M>{"B_2 = B_{0.5} + (B_2 - B_{0.5})"}</M> and use{" "}
          <M>{"\\mathbb{E}[Z^4] = 3"}</M> for a standard normal.)
        </p>
      ),
      answer: { kind: "numeric", value: 1.5, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        The sum of squared increments in the visualisation settled near 1 at every fine level. The next lesson proves that the
        quadratic variation of Brownian motion over <M>{"[0, t]"}</M> is exactly t, the fact that makes stochastic calculus differ from
        ordinary calculus.
      </p>
    </>
  ),
};
