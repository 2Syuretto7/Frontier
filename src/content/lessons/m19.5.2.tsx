import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DensityTransportViz } from "@/components/viz/DensityTransportViz";
import type { LessonContent } from "@/lib/types";

const DIV = `import numpy as np

def divergence(v, x, h):
    d = 0.0
    for i in range(len(x)):
        e = np.zeros(len(x)); e[i] = h
        d += (v(x + e)[i] - v(x - e)[i]) / (2 * h)    # dv_i / dx_i by central differences
    return float(d)

def hutchinson(J, zs):
    return float(np.mean([z @ J @ z for z in zs]))    # unbiased for trace(J) when E[z z^T] = I

def log_density_change(divs, dt):
    return -float(np.sum(divs)) * dt                  # d/dt log p(x_t) = -div v along the path`;

const GRID = `import numpy as np

def upwind_step(p, v, dx, dt):
    return p - v * dt / dx * (p - np.roll(p, 1))      # constant v > 0, periodic grid

def total_mass(p, dx):
    return float(np.sum(p) * dx)

def cfl(v, dx, dt):
    return abs(v) * dt / dx                           # the scheme is stable when this is at most 1`;

export const lesson: LessonContent = {
  id: "m19.5.2",
  minutes: 50,
  links: {
    requires: ["m19.5.1", "m5.7.3"],
    revisits: ["m11.6.4", "l7.4.3"],
    foreshadows: ["m19.5.3"],
  },

  puzzle: (
    <>
      <p>
        Pour a crowd of particles into a velocity field and let each one follow its arrow. Where the arrows converge the crowd
        thickens, where they spread it thins, and no particle is ever created or destroyed. Can the evolution of the density be
        written down without tracking a single particle, and how fast does the density at a moving particle change?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Mass in a small box changes only by what flows through its walls, and the flow through a wall is density times velocity.
        In the limit this bookkeeping is a partial differential equation, the continuity equation: the rate of change of density
        equals minus the divergence of the flux <M>{"p v"}</M>. Following a single particle instead, its neighbourhood is
        stretched or squeezed at a rate given by the divergence of v, and its density changes at minus that rate. The visualisation
        solves the equation on a grid and moves particles separately; the two pictures agree.
      </p>
      <DensityTransportViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the continuity equation">
        <p>
          Let <M>{"v_t"}</M> be a smooth, bounded, Lipschitz velocity field on <M>{"\\mathbb{R}^d"}</M>, let{" "}
          <M>{"\\dot X_t = v_t(X_t)"}</M> with <M>{"X_0 \\sim p_0"}</M>, and suppose <M>{"X_t"}</M> has a smooth density{" "}
          <M>{"p_t"}</M>. Then
        </p>
        <MD>{"\\partial_t p_t + \\nabla \\cdot (p_t v_t) = 0 ."}</MD>
      </Theorem>
      <Proof>
        <p>
          Take a smooth test function φ with compact support. By the chain rule,{" "}
          <M>{"\\frac{d}{dt}\\mathbb{E}\\varphi(X_t) = \\mathbb{E}[\\nabla\\varphi(X_t) \\cdot v_t(X_t)] = \\int \\nabla\\varphi \\cdot v_t\\, p_t\\, dx"}</M>
          , and integrating by parts, with no boundary terms because φ vanishes outside a bounded set, this is{" "}
          <M>{"-\\int \\varphi\\, \\nabla \\cdot (p_t v_t)\\, dx"}</M>. The left side is also{" "}
          <M>{"\\int \\varphi\\, \\partial_t p_t\\, dx"}</M>. So{" "}
          <M>{"\\int \\varphi\\,(\\partial_t p_t + \\nabla \\cdot (p_t v_t))\\, dx = 0"}</M> for every φ, and a continuous function
          with zero integral against every test function is zero.
        </p>
      </Proof>

      <Theorem title="the instantaneous change of variables">
        <p>
          Along a trajectory, <M>{"\\frac{d}{dt}\\log p_t(X_t) = -\\nabla \\cdot v_t(X_t)"}</M>. Conversely, the density carried by
          the flow is the only smooth solution of the continuity equation with initial value <M>{"p_0"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Expand the equation as <M>{"\\partial_t p + v \\cdot \\nabla p + p\\, \\nabla \\cdot v = 0"}</M>. The first two terms are{" "}
          <M>{"\\frac{d}{dt} p_t(X_t)"}</M>, so dividing by p gives the formula. It says that p along each trajectory is determined
          by its starting value: <M>{"p_t(X_t) = p_0(X_0)\\exp(-\\int_0^t \\nabla \\cdot v_s(X_s)\\, ds)"}</M>. Any smooth solution
          q satisfies the same linear equation along the same trajectories, which fill space because the flow map is a bijection,
          so <M>{"q = p"}</M>. This is the method of characteristics, and it completes the proof in m19.5.1.
        </p>
      </Proof>

      <Definition title="divergences in practice">
        <p>
          <C>divergence</C> computes <M>{"\\nabla \\cdot v = \\sum_i \\partial v_i/\\partial x_i"}</M> by central differences, which
          costs 2d evaluations of v. For a neural network in high dimension, continuous normalising flows use Hutchinson&apos;s
          estimator (m11.6.4): <M>{"\\nabla \\cdot v = \\operatorname{tr} J"}</M> and{" "}
          <M>{"\\operatorname{tr} J = \\mathbb{E}[z^\\top J z]"}</M> for any random z with{" "}
          <M>{"\\mathbb{E}[z z^\\top] = I"}</M>, and each <M>{"z^\\top J z"}</M> is one vector-Jacobian product.{" "}
          <C>hutchinson</C> averages it over probes; <C>log_density_change</C> integrates minus the divergence along a path by
          Euler&apos;s method.
        </p>
        <Code>{DIV}</Code>
      </Definition>

      <Example title="a conservative grid scheme">
        <p>
          On a periodic grid with constant velocity <M>{"v > 0"}</M>, the upwind scheme updates each cell by the difference of the
          fluxes through its walls, <M>{"p_i \\leftarrow p_i - \\frac{v\\,\\Delta t}{\\Delta x}(p_i - p_{i-1})"}</M>. The sum over
          cells telescopes, so <C>total_mass</C> is exactly conserved, and when the Courant number <C>cfl</C> is at most 1 the new
          values are convex combinations of the old, so they stay non-negative. The visualisation uses the same scheme with a
          velocity that varies in space.
        </p>
        <Code>{GRID}</Code>
      </Example>

      <Remark title="many fields, one density path">
        <p>
          The continuity equation determines <M>{"p_t"}</M> from v, but not v from <M>{"p_t"}</M>: adding to v any field w with{" "}
          <M>{"\\nabla \\cdot (p_t w) = 0"}</M>, such as a rotation around the mean of a radially symmetric density, leaves the
          density unchanged. The probability flow ODE is one choice of velocity for the diffusion&apos;s density path. Flow matching
          exploits the freedom: it picks a density path and a velocity that are easy to learn.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "linear",
      rung: "check",
      prompt: (
        <p>
          The velocity field on <M>{"\\mathbb{R}^2"}</M> is <M>{"v(x) = A x"}</M> with{" "}
          <M>{"A = \\begin{pmatrix} 1 & 2 \\\\ 0 & -3 \\end{pmatrix}"}</M>. By how much does{" "}
          <M>{"\\log p_t(X_t)"}</M> change along any trajectory between t = 0 and t = 1.5?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0.0005 },
    },
    {
      key: "uniform",
      rung: "check",
      prompt: (
        <p>
          <M>{"X_0"}</M> is uniform on (0, 1) and <M>{"\\dot X = X"}</M>. What is the density of <M>{"X_t"}</M> at x = 1 when{" "}
          <M>{"t = \\log 3"}</M>? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.333, tolerance: 0.0006 },
    },
    {
      key: "unique",
      rung: "apply",
      prompt: <p>A density path is given. Which statement about velocity fields that produce it is true?</p>,
      answer: {
        kind: "choice",
        options: [
          "There are many: any field w with zero divergence of p times w can be added without changing the densities",
          "There is exactly one, because the continuity equation can be solved for v",
          "There is none unless the path is Gaussian",
          "The velocity must be the score of the density",
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

def divergence(v, x, h):
    d = 0.0
    for i in range(len(x)):
        e = np.zeros(len(x)); e[i] = h
        d += (v(x + e)[i] - v(x - e)[i]) / (2 * h)    # dv_i / dx_i by central differences
    return float(d)

def hutchinson(J, zs):
    return float(np.mean([z @ J @ z for z in zs]))    # unbiased for trace(J) when E[z z^T] = I

def log_density_change(divs, dt):
    return -float(np.sum(divs)) * dt                  # d/dt log p(x_t) = -div v along the path

v = lambda x: np.array([-x[1], x[0]]) + 0.5 * x; J = np.array([[1.0, 2.0], [0.0, 3.0]])
print(round(divergence(v, np.array([1.0, 2.0]), 1e-4), 4), hutchinson(J, np.array([[1.0, 1.0], [1.0, -1.0]])), round(log_density_change([1.0, 1.0, 0.5], 0.1), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.0 4.0 -0.25", "3.0 4.0 -0.25", "1.0 6.0 -0.25", "1.0 4.0 0.25"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def upwind_step(p, v, dx, dt):
    return p - v * dt / dx * (p - np.roll(p, 1))      # constant v > 0, periodic grid

def total_mass(p, dx):
    return float(np.sum(p) * dx)

def cfl(v, dx, dt):
    return abs(v) * dt / dx                           # the scheme is stable when this is at most 1

q = upwind_step(np.array([0.0, 1.0, 0.0, 0.0]), 1.0, 1.0, 0.5)
print(q.tolist(), total_mass(q, 0.5), cfl(-2.0, 0.5, 0.1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 0.5, 0.5, 0.0] 0.5 0.4",
          "[0.5, 0.5, 0.0, 0.0] 0.5 0.4",
          "[0.0, 0.5, 0.5, 0.0] 1.0 0.4",
          "[0.0, 0.5, 0.5, 0.0] 0.5 -0.4",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>divergence(v, x, h)</C> by central differences, <C>hutchinson(J, zs)</C>, the mean of{" "}
          <M>{"z^\\top J z"}</M> over the rows z of zs, and <C>log_density_change(divs, dt)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def divergence(v, x, h):
    return float(np.sum(v(x + h) - v(x)) / h)

def hutchinson(J, zs):
    return float(np.mean([z @ z for z in zs]))

def log_density_change(divs, dt):
    return float(np.sum(divs)) * dt
`,
        solution: DIV,
        tests: [
          { name: "div", code: `v = lambda x: np.array([x[0] ** 2, 3 * x[1], x[0] * x[1]])\nassert abs(divergence(v, np.array([1.0, 2.0, 5.0]), 1e-4) - 5.0) < 1e-6` },
          { name: "trace", code: `J = np.array([[2.0, 5.0], [1.0, -1.0]])\nassert abs(hutchinson(J, np.array([[1.0, 1.0]])) - 7.0) < 1e-12 and abs(log_density_change([2.0, 3.0], 0.5) + 2.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>upwind_step(p, v, dx, dt)</C> for constant v &gt; 0 on a periodic grid, <C>total_mass(p, dx)</C> and{" "}
          <C>cfl(v, dx, dt)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def upwind_step(p, v, dx, dt):
    return p - v * dt / dx * (np.roll(p, -1) - p)

def total_mass(p, dx):
    return float(np.sum(p))

def cfl(v, dx, dt):
    return v * dx / dt
`,
        solution: GRID,
        tests: [
          { name: "step", code: `q = upwind_step(np.array([1.0, 0.0, 0.0]), 2.0, 1.0, 0.25)\nassert q.shape == (3,)\nassert np.allclose(q, [0.5, 0.5, 0.0])` },
          { name: "mass", code: `assert abs(total_mass(np.array([1.0, 3.0]), 0.5) - 2.0) < 1e-12 and abs(cfl(-3.0, 0.5, 0.1) - 0.6) < 1e-12` },
        ],
      },
    },
    {
      key: "var",
      rung: "stretch",
      prompt: (
        <p>
          Hutchinson&apos;s estimator <M>{"z^\\top J z"}</M> uses one Rademacher probe z (entries ±1, independent, equally likely)
          for <M>{"J = \\begin{pmatrix} 2 & 3 \\\\ 1 & -1 \\end{pmatrix}"}</M>. What is its variance?
        </p>
      ),
      answer: { kind: "numeric", value: 16, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        If many velocity fields carry the same densities, we may choose the path of densities first and then a velocity that
        carries it. The next lesson does this for a path that interpolates between noise and data, and shows that the velocity can
        be learned by regression, exactly as the score was.
      </p>
    </>
  ),
};
