import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { StepScheduleViz } from "@/components/viz/StepScheduleViz";
import type { LessonContent } from "@/lib/types";

const GRID = `import numpy as np

def geometric_sigmas(smax, smin, n):
    return smax * (smin / smax) ** (np.arange(n) / (n - 1))

def edm_sigmas(smax, smin, n, rho):
    u = np.arange(n) / (n - 1)                       # equal steps in sigma ** (1 / rho)
    return (smax ** (1 / rho) + u * (smin ** (1 / rho) - smax ** (1 / rho))) ** rho

def euler_sigma(x, sigmas, slope):
    for s, s_next in zip(sigmas[:-1], sigmas[1:]):
        x = x + (s_next - s) * slope(x, s)
    return x`;

const ERR = `import numpy as np

def curvature_gauss(sigma, s2, A):
    return A * s2 / (s2 + sigma ** 2) ** 1.5           # |x''(sigma)| on the path x = m + A sqrt(s2 + sigma^2)

def local_error(c, h):
    return 0.5 * c * h ** 2                             # Euler's error over one step of size h

def optimal_widths(cs, L):
    w = 1 / np.sqrt(cs)                                 # equal local error in every cell
    return L * w / np.sum(w)`;

export const lesson: LessonContent = {
  id: "m19.6.3",
  minutes: 50,
  links: {
    requires: ["m19.6.2", "m19.6.1"],
    revisits: ["m19.4.3", "m11.8.1"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        A sampler runs the probability flow ODE from σ = 80 down to σ = 0.002 in a budget of, say, 18 steps. Spaced evenly, 17 of
        them fall above σ = 4 and one step must cover everything below, where all the fine detail of an image is decided. Spaced
        evenly in log σ, they crowd towards zero. Practical samplers use neither, but a grid with steps equal in{" "}
        <M>{"\\sigma^{1/7}"}</M>. Where should the steps go, and is there a principle that picks the grid?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each Euler step makes an error proportional to the square of its length times how sharply the path bends there. Where the
        path is nearly straight, long steps are cheap; where it bends, they are expensive. For a fixed number of steps the total
        error is smallest when every step makes the same error, which means short steps where the curvature is high. For diffusion
        paths the curvature is small at high noise, where the data look like a single blob, and large at the noise levels where
        clusters and details appear.
      </p>
      <StepScheduleViz />
    </>
  ),

  theory: (
    <>
      <Definition title="noise schedules">
        <p>
          A schedule is a decreasing grid <M>{"\\sigma_0 > \\sigma_1 > \\dots > \\sigma_{n-1}"}</M> from{" "}
          <M>{"\\sigma_{\\max}"}</M> to <M>{"\\sigma_{\\min}"}</M>. The geometric schedule has equal ratios. The schedule of Karras
          and others has equal steps in <M>{"\\sigma^{1/\\rho}"}</M>:
        </p>
        <MD>{"\\sigma_i = \\Big(\\sigma_{\\max}^{1/\\rho} + \\tfrac{i}{n-1}\\big(\\sigma_{\\min}^{1/\\rho} - \\sigma_{\\max}^{1/\\rho}\\big)\\Big)^{\\rho} ,"}</MD>
        <p>
          which is uniform for ρ = 1 and tends to geometric as <M>{"\\rho \\to \\infty"}</M>; ρ = 7 is the common choice.{" "}
          <C>geometric_sigmas</C>, <C>edm_sigmas</C> and <C>euler_sigma</C>, which runs Euler along any grid, implement them.
        </p>
        <Code>{GRID}</Code>
      </Definition>

      <Theorem title="local error of Euler">
        <p>
          If the solution x(σ) is twice continuously differentiable, an Euler step of length h from the exact solution errs by{" "}
          <M>{"\\tfrac12 h^2 |x''(\\sigma)| + O(h^3)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Taylor&apos;s theorem gives <M>{"x(\\sigma + h) = x(\\sigma) + h x'(\\sigma) + \\tfrac12 h^2 x''(\\sigma) + O(h^3)"}</M>, and
          the Euler step keeps the first two terms. If the steps do not amplify each other much, the global error is roughly the sum
          of the local errors, so we write <M>{"c(\\sigma) = \\tfrac12 |x''(\\sigma)|"}</M> and take{" "}
          <M>{"E = \\sum_i c(\\sigma_i) h_i^2"}</M> as the cost of a grid.
        </p>
      </Proof>

      <Theorem title="equidistribution">
        <p>
          Describe a grid of n steps on an interval I by a density ρ with <M>{"\\int_I \\rho = 1"}</M>, so that near σ the steps
          have length <M>{"h = 1/(n\\rho(\\sigma))"}</M>. Then{" "}
          <M>{"E \\approx \\frac1n \\int_I \\frac{c}{\\rho}\\, d\\sigma \\ge \\frac1n \\Big(\\int_I \\sqrt c\\, d\\sigma\\Big)^2"}</M>,
          with equality exactly when <M>{"\\rho \\propto \\sqrt c"}</M>, that is when every step makes the same local error.
        </p>
      </Theorem>
      <Proof>
        <p>
          The <M>{"n\\rho\\,d\\sigma"}</M> steps in <M>{"d\\sigma"}</M> each cost <M>{"c h^2 = c/(n\\rho)^2"}</M>, a total of{" "}
          <M>{"c/(n\\rho)\\, d\\sigma"}</M>. By the Cauchy-Schwarz inequality,{" "}
          <M>{"\\int \\sqrt c = \\int \\sqrt{c/\\rho}\\, \\sqrt\\rho \\le (\\int c/\\rho)^{1/2} (\\int \\rho)^{1/2}"}</M>, with
          equality when <M>{"\\sqrt{c/\\rho}"}</M> is proportional to <M>{"\\sqrt \\rho"}</M>. Then <M>{"c h^2"}</M> is constant. On
          a fixed set of cells, <C>optimal_widths</C> applies the same rule, widths proportional to <M>{"c^{-1/2}"}</M>.
        </p>
        <Code>{ERR}</Code>
      </Proof>

      <Example title="Gaussian data">
        <p>
          For data <M>{"N(m, s^2)"}</M> the paths are <M>{"x(\\sigma) = m + A\\sqrt{s^2 + \\sigma^2}"}</M> (m19.6.2), so{" "}
          <M>{"|x''| = A s^2/(s^2 + \\sigma^2)^{3/2}"}</M> (<C>curvature_gauss</C>). For <M>{"\\sigma \\ll s"}</M> the curvature is
          nearly constant and uniform steps are right. For <M>{"\\sigma \\gg s"}</M> it decays like <M>{"\\sigma^{-3}"}</M>, the
          optimal density like <M>{"\\sigma^{-3/2}"}</M>, and the steps grow like <M>{"\\sigma^{3/2}"}</M>, faster than the geometric
          grid&apos;s <M>{"h \\propto \\sigma"}</M>. Real data have structure at every scale, a mixture of Gaussians of many widths,
          so the curvature is spread over many noise levels; the ρ = 7 grid, with <M>{"h \\propto \\sigma^{6/7}"}</M>, is a
          compromise found to work well across datasets.
        </p>
      </Example>

      <Remark title="the same question in training">
        <p>
          Training faces the same allocation problem: which noise levels to sample and how to weight their losses (m19.4.3). Both
          answers aim to spend effort where the denoiser&apos;s output changes most with σ. The pieces of this course fit together
          here: Brownian motion and Itô calculus define the noising process, the Fokker-Planck and continuity equations show which
          reverse dynamics reproduce it, score matching and flow matching learn the required drift by regression, and numerical
          analysis decides how few evaluations of that drift suffice.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "geo",
      rung: "check",
      prompt: (
        <p>
          A geometric schedule has 5 noise levels from 10 down to 0.1. What is the second level? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 3.162, tolerance: 0.0006 },
    },
    {
      key: "ratio",
      rung: "check",
      prompt: (
        <p>
          The curvature term c is 1 in one region and 9 in another. With an optimal grid, how many times longer are the steps in the
          first region than in the second?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0.0005 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why do good schedules for diffusion samplers take short steps at low noise levels?</p>,
      answer: {
        kind: "choice",
        options: [
          "The paths bend most at the noise levels where clusters and details form, and the optimal grid makes every step's error equal, so steps must be short where the curvature is large",
          "The network is less accurate at high noise",
          "The noise level must decrease by a constant amount per step",
          "Low noise levels matter more, so more steps are spent there regardless of the error",
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

def geometric_sigmas(smax, smin, n):
    return smax * (smin / smax) ** (np.arange(n) / (n - 1))

def edm_sigmas(smax, smin, n, rho):
    u = np.arange(n) / (n - 1)                       # equal steps in sigma ** (1 / rho)
    return (smax ** (1 / rho) + u * (smin ** (1 / rho) - smax ** (1 / rho))) ** rho

def euler_sigma(x, sigmas, slope):
    for s, s_next in zip(sigmas[:-1], sigmas[1:]):
        x = x + (s_next - s) * slope(x, s)
    return x

s = edm_sigmas(16.0, 1.0, 3, 2.0)
print(s.tolist(), geometric_sigmas(8.0, 0.5, 3).tolist(), euler_sigma(1.0, [2.0, 1.0, 0.0], lambda x, s: 0.5 * x))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[16.0, 6.25, 1.0] [8.0, 2.0, 0.5] 0.25",
          "[16.0, 8.5, 1.0] [8.0, 2.0, 0.5] 0.25",
          "[16.0, 6.25, 1.0] [8.0, 4.25, 0.5] 0.25",
          "[16.0, 6.25, 1.0] [8.0, 2.0, 0.5] 2.25",
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

def curvature_gauss(sigma, s2, A):
    return A * s2 / (s2 + sigma ** 2) ** 1.5           # |x''(sigma)| on the path x = m + A sqrt(s2 + sigma^2)

def local_error(c, h):
    return 0.5 * c * h ** 2                             # Euler's error over one step of size h

def optimal_widths(cs, L):
    w = 1 / np.sqrt(cs)                                 # equal local error in every cell
    return L * w / np.sum(w)

print(curvature_gauss(0.0, 1.0, 2.0), local_error(4.0, 0.5), optimal_widths(np.array([1.0, 4.0]), 3.0).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["2.0 0.5 [2.0, 1.0]", "2.0 0.5 [2.4, 0.6]", "2.0 1.0 [2.0, 1.0]", "1.0 0.5 [2.0, 1.0]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>geometric_sigmas(smax, smin, n)</C>, <C>edm_sigmas(smax, smin, n, rho)</C>, both returning arrays of n levels
          from smax to smin, and <C>euler_sigma(x, sigmas, slope)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def geometric_sigmas(smax, smin, n):
    return np.linspace(smax, smin, n)

def edm_sigmas(smax, smin, n, rho):
    return np.linspace(smax, smin, n) ** (1 / rho)

def euler_sigma(x, sigmas, slope):
    return x + (sigmas[-1] - sigmas[0]) * slope(x, sigmas[0])
`,
        solution: GRID,
        tests: [
          { name: "grids", code: `g = geometric_sigmas(100.0, 1.0, 3)\nassert g.shape == (3,)\nassert np.allclose(g, [100.0, 10.0, 1.0]) and np.allclose(edm_sigmas(81.0, 1.0, 3, 4.0), [81.0, 16.0, 1.0])` },
          { name: "euler", code: `assert abs(euler_sigma(1.0, [3.0, 2.0, 1.0], lambda x, s: x) - 0.0) < 1e-12 and abs(euler_sigma(2.0, [1.0, 0.5, 0.0], lambda x, s: x) - 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>curvature_gauss(sigma, s2, A)</C>, <C>local_error(c, h)</C> and <C>optimal_widths(cs, L)</C>, which splits a
          length L among cells with curvatures cs so that each cell&apos;s local error is the same.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def curvature_gauss(sigma, s2, A):
    return A / (s2 + sigma ** 2)

def local_error(c, h):
    return c * h

def optimal_widths(cs, L):
    return L * cs / np.sum(cs)
`,
        solution: ERR,
        tests: [
          { name: "curv", code: `assert abs(curvature_gauss(1.0, 3.0, 2.0) - 0.75) < 1e-12 and abs(local_error(2.0, 0.1) - 0.01) < 1e-12` },
          { name: "widths", code: `w = optimal_widths(np.array([4.0, 1.0, 1.0]), 5.0)\nassert w.shape == (3,)\nassert np.allclose(w, [1.0, 2.0, 2.0])` },
        ],
      },
    },
    {
      key: "frac",
      rung: "stretch",
      prompt: (
        <p>
          Steps are placed with density proportional to <M>{"\\sigma^{-3/2}"}</M> between σ = 1 and σ = 10000. What fraction of them
          lie below σ = 100? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.909, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        This completes the course. The tools built here, stochastic integrals, generators, the Fokker-Planck and continuity
        equations, and the numerical analysis of their solvers, are the mathematics underneath every modern diffusion and
        flow-based generative model, and they reappear wherever randomness evolves in continuous time.
      </p>
    </>
  ),
};
