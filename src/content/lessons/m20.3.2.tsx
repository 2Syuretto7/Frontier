import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DisplacementViz } from "@/components/viz/DisplacementViz";
import type { LessonContent } from "@/lib/types";

const INTERP = `import numpy as np

def displacement_interp(x, y, t):
    return (1 - t) * np.sort(x) + t * np.sort(y)      # move each quantile part of the way

def mixture_mean_var(m0, v0, m1, v1, t):
    mean = (1 - t) * m0 + t * m1
    return mean, (1 - t) * (v0 + m0 ** 2) + t * (v1 + m1 ** 2) - mean ** 2

def gauss_geodesic_1d(m0, s0, m1, s1, t):
    return (1 - t) * m0 + t * m1, (1 - t) * s0 + t * s1   # mean and standard deviation`;

const ACTION = `import numpy as np

def w2_sorted(x, y):
    return float(np.sqrt(np.mean((np.sort(x) - np.sort(y)) ** 2)))

def velocities(x, y):
    return np.sort(y) - np.sort(x)                    # constant speed of each particle on [0, 1]

def bb_action(path):
    K = len(path) - 1                                 # path[k] holds all positions at time k / K
    return float(np.sum(np.mean(np.diff(path, axis=0) ** 2, axis=1)) * K)`;

export const lesson: LessonContent = {
  id: "m20.3.2",
  minutes: 50,
  links: {
    requires: ["m20.3.1", "m19.5.2"],
    revisits: ["m19.5.3", "m20.1.1"],
    foreshadows: ["m20.3.3"],
  },

  puzzle: (
    <>
      <p>
        Halfway between a photograph of a cat on the left of the frame and the same cat on the right, the average of the two
        images shows two faint cats. Averaging probability densities behaves the same way: the midpoint of two bumps is two half
        bumps, not one bump in the middle. Is there a notion of the midpoint between two distributions that moves the mass, and
        is it a straight line in the geometry of the Wasserstein distance?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Take the optimal plan from the first distribution to the second, and stop every grain part of the way along its straight
        path. At time t each grain has covered a fraction t of its trip, so the whole distribution has covered a fraction t of the
        transport distance, and the remaining fraction 1 − t is still to go. That is what it means to be a straight line, a
        geodesic, in <M>{"W_2"}</M>. It is also the cheapest way to move mass continuously in time, if moving fast costs the square
        of the speed.
      </p>
      <DisplacementViz />
    </>
  ),

  theory: (
    <>
      <Definition title="displacement interpolation">
        <p>
          Let π be an optimal plan for <M>{"W_2(\\mu_0, \\mu_1)"}</M> and <M>{"p_t(x, y) = (1 - t)x + ty"}</M>. McCann&apos;s
          displacement interpolation is <M>{"\\mu_t = (p_t)_\\# \\pi"}</M> for t in [0, 1]. When π comes from a map T, it is{" "}
          <M>{"\\mu_t = ((1 - t)\\,\\mathrm{id} + tT)_\\# \\mu_0"}</M>. On the line, it interpolates quantile functions:{" "}
          <M>{"F_t^{-1} = (1 - t)F_0^{-1} + tF_1^{-1}"}</M> (<C>displacement_interp</C> for samples). Between{" "}
          <M>{"N(m_0, s_0^2)"}</M> and <M>{"N(m_1, s_1^2)"}</M> it is the Gaussian with mean and standard deviation interpolated
          linearly (<C>gauss_geodesic_1d</C>), whereas the mixture <M>{"(1 - t)\\mu_0 + t\\mu_1"}</M> has the variance computed by{" "}
          <C>mixture_mean_var</C>.
        </p>
        <Code>{INTERP}</Code>
      </Definition>

      <Theorem title="a constant-speed geodesic">
        <p>
          For 0 ≤ s ≤ t ≤ 1, <M>{"W_2(\\mu_s, \\mu_t) = (t - s)\\, W_2(\\mu_0, \\mu_1)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The law of <M>{"(p_s, p_t)"}</M> under π couples <M>{"\\mu_s"}</M> and <M>{"\\mu_t"}</M>, and{" "}
          <M>{"|p_t - p_s| = (t - s)|x - y|"}</M>, so <M>{"W_2(\\mu_s, \\mu_t) \\le (t - s) W"}</M> with{" "}
          <M>{"W = W_2(\\mu_0, \\mu_1)"}</M>. If the inequality were strict for some s &lt; t, the triangle inequality would give{" "}
          <M>{"W \\le W_2(\\mu_0, \\mu_s) + W_2(\\mu_s, \\mu_t) + W_2(\\mu_t, \\mu_1) < sW + (t - s)W + (1 - t)W = W"}</M>, a
          contradiction.
        </p>
      </Proof>

      <Theorem title="Benamou-Brenier">
        <p>
          Over all curves of densities <M>{"\\rho_t"}</M> from <M>{"\\mu_0"}</M> to <M>{"\\mu_1"}</M> and velocity fields{" "}
          <M>{"v_t"}</M> satisfying the continuity equation <M>{"\\partial_t \\rho + \\nabla \\cdot (\\rho v) = 0"}</M> (m19.5.2),
        </p>
        <MD>{"W_2^2(\\mu_0, \\mu_1) = \\min \\int_0^1 \\!\\! \\int |v_t(x)|^2 \\, d\\rho_t(x)\\, dt ,"}</MD>
        <p>and the minimum is attained by the displacement interpolation.</p>
      </Theorem>
      <Proof>
        <p>
          Lower bound: if <M>{"(\\rho, v)"}</M> is admissible with a well-defined flow, let <M>{"X_t"}</M> follow{" "}
          <M>{"\\dot X = v_t(X)"}</M> from <M>{"X_0 \\sim \\mu_0"}</M>, so <M>{"X_t \\sim \\rho_t"}</M>. By the Cauchy-Schwarz
          inequality, <M>{"|X_1 - X_0|^2 = |\\int_0^1 \\dot X_t\\, dt|^2 \\le \\int_0^1 |v_t(X_t)|^2 dt"}</M>; taking expectations,
          the action is at least <M>{"\\mathbb{E}|X_1 - X_0|^2 \\ge W_2^2"}</M>, since <M>{"(X_0, X_1)"}</M> is a coupling. Upper
          bound: in the displacement interpolation each grain moves in a straight line at constant velocity y − x, so the action is{" "}
          <M>{"\\int |y - x|^2 d\\pi = W_2^2"}</M>. <C>velocities</C>, <C>w2_sorted</C> and <C>bb_action</C>, which discretises the
          action of a path of particle positions, check this numerically.
        </p>
        <Code>{ACTION}</Code>
      </Proof>

      <Example title="mixture versus displacement">
        <p>
          Between <M>{"N(0, 1)"}</M> and <M>{"N(6, 1)"}</M>, the displacement midpoint is <M>{"N(3, 1)"}</M>: the bump slides. The
          mixture midpoint has two bumps at 0 and 6 and variance 1 + 9 = 10. In W₂ the mixture path is not a geodesic: as the
          visualisation shows, at half time it has already covered well over half the distance.
        </p>
      </Example>

      <Remark title="where this geometry is used">
        <p>
          A functional is displacement convex if it is convex along these geodesics; McCann showed that the entropy{" "}
          <M>{"\\int \\rho \\log \\rho"}</M> is, which underlies the gradient-flow view of the next lesson. Flow matching with an
          optimal transport coupling (m20.5.2) trains a network to follow displacement interpolations, whose straight particle paths
          are easy to integrate, unlike the crossing paths of an independent coupling (m19.5.3).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "var",
      rung: "check",
      prompt: (
        <p>
          The displacement interpolation runs from <M>{"N(0, 1)"}</M> to <M>{"N(6, 9)"}</M> (variances). What is the variance at
          t = 1/3? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.778, tolerance: 0.0006 },
    },
    {
      key: "mix",
      rung: "check",
      prompt: (
        <p>
          What is the variance of the mixture <M>{"\\tfrac14 N(0, 1) + \\tfrac34 N(4, 1)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 4, tolerance: 0.0005 },
    },
    {
      key: "geo",
      rung: "apply",
      prompt: <p>Why is the distance from μ₀ to the displacement interpolant at time t exactly t times W₂(μ₀, μ₁)?</p>,
      answer: {
        kind: "choice",
        options: [
          "Moving each grain a fraction t along its optimal path gives a coupling of cost t² W₂², and the triangle inequality rules out anything cheaper",
          "Because the densities are averaged with weights 1 − t and t",
          "Because W₂ is linear in the measures",
          "Because the optimal plan is the independent coupling",
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

def displacement_interp(x, y, t):
    return (1 - t) * np.sort(x) + t * np.sort(y)      # move each quantile part of the way

def mixture_mean_var(m0, v0, m1, v1, t):
    mean = (1 - t) * m0 + t * m1
    return mean, (1 - t) * (v0 + m0 ** 2) + t * (v1 + m1 ** 2) - mean ** 2

def gauss_geodesic_1d(m0, s0, m1, s1, t):
    return (1 - t) * m0 + t * m1, (1 - t) * s0 + t * s1   # mean and standard deviation

x, y = np.array([0.0, 2.0, 1.0]), np.array([4.0, 3.0, 5.0])
print(displacement_interp(x, y, 0.5).tolist(), mixture_mean_var(0.0, 1.0, 4.0, 1.0, 0.5), gauss_geodesic_1d(0.0, 1.0, 4.0, 3.0, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.5, 2.5, 3.5] (2.0, 5.0) (2.0, 2.0)",
          "[2.0, 2.5, 3.0] (2.0, 5.0) (2.0, 2.0)",
          "[1.5, 2.5, 3.5] (2.0, 1.0) (2.0, 2.0)",
          "[1.5, 2.5, 3.5] (2.0, 5.0) (2.0, 1.732)",
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

def w2_sorted(x, y):
    return float(np.sqrt(np.mean((np.sort(x) - np.sort(y)) ** 2)))

def velocities(x, y):
    return np.sort(y) - np.sort(x)                    # constant speed of each particle on [0, 1]

def bb_action(path):
    K = len(path) - 1                                 # path[k] holds all positions at time k / K
    return float(np.sum(np.mean(np.diff(path, axis=0) ** 2, axis=1)) * K)

straight, detour = np.array([[0.0, 1.0], [1.0, 2.0], [2.0, 3.0]]), np.array([[0.0, 1.0], [3.0, 4.0], [2.0, 3.0]])
print(w2_sorted(np.array([0.0, 1.0]), np.array([3.0, 2.0])), velocities(np.array([0.0, 1.0]), np.array([3.0, 2.0])).tolist(), bb_action(straight), bb_action(detour))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["2.0 [2.0, 2.0] 4.0 20.0", "2.0 [3.0, 1.0] 4.0 20.0", "2.0 [2.0, 2.0] 2.0 10.0", "1.0 [2.0, 2.0] 4.0 20.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>displacement_interp(x, y, t)</C> for equal-sized samples on the line, <C>mixture_mean_var(m0, v0, m1, v1, t)</C>{" "}
          and <C>gauss_geodesic_1d(m0, s0, m1, s1, t)</C> returning the mean and standard deviation.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def displacement_interp(x, y, t):
    return (1 - t) * x + t * y

def mixture_mean_var(m0, v0, m1, v1, t):
    return (1 - t) * m0 + t * m1, (1 - t) * v0 + t * v1

def gauss_geodesic_1d(m0, s0, m1, s1, t):
    return (1 - t) * m0 + t * m1, np.sqrt((1 - t) * s0 ** 2 + t * s1 ** 2)
`,
        solution: INTERP,
        tests: [
          { name: "interp", code: `r = displacement_interp(np.array([1.0, 0.0]), np.array([0.0, 4.0]), 0.25)\nassert r.shape == (2,)\nassert np.allclose(r, [0.0, 1.75])` },
          { name: "gauss", code: `m, v = mixture_mean_var(0.0, 1.0, 2.0, 1.0, 0.5)\nassert abs(m - 1.0) < 1e-12 and abs(v - 2.0) < 1e-12\nm, s = gauss_geodesic_1d(0.0, 1.0, 0.0, 3.0, 0.5)\nassert abs(s - 2.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>w2_sorted(x, y)</C>, <C>velocities(x, y)</C> and <C>bb_action(path)</C> for an array whose row k holds all
          particle positions at time k/K.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def w2_sorted(x, y):
    return float(np.sqrt(np.mean((x - y) ** 2)))

def velocities(x, y):
    return y - x

def bb_action(path):
    return float(np.sum(np.mean(np.diff(path, axis=0) ** 2, axis=1)))
`,
        solution: ACTION,
        tests: [
          { name: "w2", code: `assert abs(w2_sorted(np.array([0.0, 2.0]), np.array([3.0, 1.0])) - 1.0) < 1e-12 and np.allclose(velocities(np.array([0.0, 2.0]), np.array([3.0, 1.0])), [1.0, 1.0])` },
          { name: "action", code: `p = np.array([[0.0], [1.0], [2.0], [3.0]])\nassert abs(bb_action(p) - 9.0) < 1e-12` },
        ],
      },
    },
    {
      key: "seg",
      rung: "stretch",
      prompt: (
        <p>
          Along the displacement interpolation from <M>{"N(0, 1)"}</M> to <M>{"N(3, 16)"}</M> (variances), what is{" "}
          <M>{"W_2(\\mu_{0.2}, \\mu_{0.7})"}</M>? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.121, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        With straight lines come slopes. The next lesson asks how to run gradient descent on the space of distributions, moving a
        density downhill on a functional such as entropy, and finds that the heat equation and Langevin dynamics are exactly such
        gradient flows in <M>{"W_2"}</M>.
      </p>
    </>
  ),
};
