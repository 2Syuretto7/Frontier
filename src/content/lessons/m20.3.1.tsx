import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CdfAreaViz } from "@/components/viz/CdfAreaViz";
import type { LessonContent } from "@/lib/types";

const LINE = `import numpy as np

def w_p_empirical(x, y, p):
    d = np.abs(np.sort(x) - np.sort(y))               # equal sizes: the sorted matching is optimal
    return float(np.mean(d ** p) ** (1 / p))

def w1_cdf(grid, F, G):
    return float(np.sum(np.abs(F - G)) * (grid[1] - grid[0]))   # area between distribution functions

def w2_gauss_1d(m1, s1, m2, s2):
    return float(np.sqrt((m1 - m2) ** 2 + (s1 - s2) ** 2))`;

const GAUSS = `import numpy as np

def sqrtm_psd(S):
    w, V = np.linalg.eigh(S)
    return V @ np.diag(np.sqrt(np.clip(w, 0, None))) @ V.T

def w2_gauss(m1, S1, m2, S2):
    r = sqrtm_psd(S2)
    cross = sqrtm_psd(r @ S1 @ r)
    return float(np.sqrt(np.sum((m1 - m2) ** 2) + np.trace(S1 + S2 - 2 * cross)))

def gauss_map_1d(x, m1, s1, m2, s2):
    return m2 + s2 / s1 * (x - m1)                    # Brenier map between N(m1, s1^2) and N(m2, s2^2)`;

export const lesson: LessonContent = {
  id: "m20.3.1",
  minutes: 55,
  links: {
    requires: ["m20.2.2", "m20.1.2"],
    revisits: ["m18.4.3", "m7.5.5"],
    foreshadows: ["m20.3.2"],
  },

  puzzle: (
    <>
      <p>
        Two distributions of images, one shifted slightly from the other, have disjoint supports. The KL divergence between them is
        infinite and the total variation distance is 1, the same as for two distributions that have nothing to do with each
        other. Neither notices that one is a small perturbation of the other. Is there a distance between distributions that
        measures how far mass must move, so that small shifts give small distances, and can it be computed?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Use the cheapest transport plan as the distance: the minimal average of <M>{"|x - y|^p"}</M>, raised to the power 1/p so
        that it has the units of x. Shifting a distribution by t moves every grain by t, so the distance is t, however little the
        supports overlap. On the line the cheapest plan is the monotone one, so the distance compares quantiles, and for p = 1 it
        is the area between the distribution functions. For the squared distance in any dimension, the optimal plan moves each
        point along the gradient of a convex function.
      </p>
      <CdfAreaViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Wasserstein distances">
        <p>
          For p ≥ 1 and probability measures on <M>{"\\mathbb{R}^d"}</M> with finite p-th moments,
        </p>
        <MD>{"W_p(\\mu, \\nu) = \\Big( \\min_{\\pi \\in \\Pi(\\mu, \\nu)} \\int |x - y|^p \\, d\\pi(x, y) \\Big)^{1/p} ."}</MD>
        <p>
          <M>{"W_p"}</M> is a metric on this set of measures: symmetric, zero only when μ = ν, and satisfying the triangle
          inequality. For the triangle inequality, take optimal plans from μ to ν and from ν to ρ, glue them along ν into a joint
          law of (X, Y, Z), and apply Minkowski&apos;s inequality to{" "}
          <M>{"\\|X - Z\\|_{L^p} \\le \\|X - Y\\|_{L^p} + \\|Y - Z\\|_{L^p}"}</M>.
        </p>
      </Definition>

      <Theorem title="the line">
        <p>
          On <M>{"\\mathbb{R}"}</M>, with quantile functions <M>{"F^{-1}, G^{-1}"}</M>,
        </p>
        <MD>{"W_p^p(\\mu, \\nu) = \\int_0^1 |F^{-1}(u) - G^{-1}(u)|^p\\, du , \\qquad W_1(\\mu, \\nu) = \\int_{\\mathbb{R}} |F(x) - G(x)|\\, dx ."}</MD>
      </Theorem>
      <Proof>
        <p>
          For empirical measures with n equally weighted points each, the sorted matching is optimal for the convex cost{" "}
          <M>{"|y - x|^p"}</M> (m20.1.1), and its cost is the integral of the first formula for the step quantile functions.
          General measures are limits of empirical ones, and both sides are continuous along such approximations. For p = 1, the
          area between the graphs of <M>{"F^{-1}"}</M> and <M>{"G^{-1}"}</M> on [0, 1] is the area between the graphs of F and G,
          the same region measured in the other direction. <C>w_p_empirical</C>, <C>w1_cdf</C> and <C>w2_gauss_1d</C> implement these.
        </p>
        <Code>{LINE}</Code>
      </Proof>

      <Theorem title="Brenier">
        <p>
          Let μ have a density and both measures finite second moments. Then there is a unique optimal plan for{" "}
          <M>{"|x - y|^2"}</M>, and it is induced by the map <M>{"T = \\nabla u"}</M> for a convex function u, unique μ-almost
          everywhere. Conversely, the gradient of any convex u is the optimal map from μ to <M>{"(\\nabla u)_\\# \\mu"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Since <M>{"|x - y|^2 = |x|^2 + |y|^2 - 2\\langle x, y \\rangle"}</M>, minimising the cost means maximising{" "}
          <M>{"\\int \\langle x, y \\rangle\\, d\\pi"}</M>, so the optimal plans are those for <M>{"\\tfrac12|x - y|^2"}</M>. By m20.2.2 that dual has optimal c-concave potentials{" "}
          <M>{"(\\tfrac12|x|^2 - u, \\tfrac12|y|^2 - u^*)"}</M> with u convex. Complementary slackness (m20.2.1) says an optimal π
          lives on the set where <M>{"u(x) + u^*(y) = \\langle x, y \\rangle"}</M>, which is where y is a subgradient of u at x. A
          convex function is differentiable almost everywhere, so for μ-almost every x the only such y is{" "}
          <M>{"\\nabla u(x)"}</M>, and π is the plan of the map <M>{"\\nabla u"}</M>. For the converse, the same identity shows{" "}
          <M>{"(\\tfrac12|x|^2 - u, \\tfrac12|y|^2 - u^*)"}</M> is feasible and tight on the graph of <M>{"\\nabla u"}</M>.
        </p>
      </Proof>

      <Example title="Gaussians">
        <p>
          The map <M>{"x \\mapsto m_2 + A(x - m_1)"}</M> with A symmetric positive definite is the gradient of a convex quadratic, so
          by Brenier it is optimal from <M>{"N(m_1, \\Sigma_1)"}</M> to its image. Choosing A so that{" "}
          <M>{"A\\Sigma_1 A = \\Sigma_2"}</M> gives
        </p>
        <MD>{"W_2^2 = |m_1 - m_2|^2 + \\operatorname{tr}\\Big(\\Sigma_1 + \\Sigma_2 - 2\\big(\\Sigma_2^{1/2}\\Sigma_1\\Sigma_2^{1/2}\\big)^{1/2}\\Big) ,"}</MD>
        <p>
          which in one dimension is <M>{"(m_1 - m_2)^2 + (s_1 - s_2)^2"}</M> with optimal map{" "}
          <M>{"m_2 + (s_2/s_1)(x - m_1)"}</M>. <C>sqrtm_psd</C>, <C>w2_gauss</C> and <C>gauss_map_1d</C> compute these; the formula
          underlies the Fréchet inception distance used to evaluate image generators.
        </p>
        <Code>{GAUSS}</Code>
      </Example>

      <Remark title="what W sees that KL does not">
        <p>
          <M>{"W_1(\\delta_0, \\delta_t) = |t|"}</M>, while the KL divergence (m18.4.3) is infinite for every t ≠ 0 and the total
          variation distance is 1. More generally, on a bounded set, <M>{"W_p(\\mu_n, \\mu) \\to 0"}</M> exactly when{" "}
          <M>{"\\mu_n"}</M> converges weakly to μ. This is why Wasserstein distances suit distributions supported on thin sets, such
          as the outputs of a generator, and why they respect the geometry of the space the data live in.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "unif",
      rung: "check",
      prompt: (
        <p>
          What is <M>{"W_2"}</M> between the uniform distributions on [0, 1] and on [0, 3]? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.155, tolerance: 0.0006 },
    },
    {
      key: "gauss",
      rung: "check",
      prompt: (
        <p>
          What is <M>{"W_2"}</M> between <M>{"N(1, 4)"}</M> and <M>{"N(-1, 1)"}</M> on the real line, where the second parameter is
          the variance? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.236, tolerance: 0.0006 },
    },
    {
      key: "shift",
      rung: "apply",
      prompt: <p>Why is the Wasserstein distance better suited than the KL divergence to comparing two distributions with disjoint supports?</p>,
      answer: {
        kind: "choice",
        options: [
          "It measures how far mass must move, so it shrinks continuously as one distribution slides onto the other, whereas KL is infinite whenever the supports do not overlap",
          "It is always smaller than the KL divergence",
          "It does not depend on the distance between points",
          "It is easier to compute in high dimensions",
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

def w_p_empirical(x, y, p):
    d = np.abs(np.sort(x) - np.sort(y))               # equal sizes: the sorted matching is optimal
    return float(np.mean(d ** p) ** (1 / p))

def w1_cdf(grid, F, G):
    return float(np.sum(np.abs(F - G)) * (grid[1] - grid[0]))   # area between distribution functions

def w2_gauss_1d(m1, s1, m2, s2):
    return float(np.sqrt((m1 - m2) ** 2 + (s1 - s2) ** 2))

x, y = np.array([0.0, 1.0, 3.0]), np.array([2.0, 0.0, 1.0])
print(round(w_p_empirical(x, y, 1), 4), round(w_p_empirical(x, y, 2), 4), w1_cdf(np.arange(4.0), np.array([0.5, 1, 1, 1]), np.array([0, 0.5, 1, 1])), round(w2_gauss_1d(0, 1, 3, 2), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.3333 0.5774 1.0 3.1623", "1.3333 0.5774 1.0 3.1623", "0.3333 0.3333 1.0 3.1623", "0.3333 0.5774 1.0 3.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def sqrtm_psd(S):
    w, V = np.linalg.eigh(S)
    return V @ np.diag(np.sqrt(np.clip(w, 0, None))) @ V.T

def w2_gauss(m1, S1, m2, S2):
    r = sqrtm_psd(S2)
    cross = sqrtm_psd(r @ S1 @ r)
    return float(np.sqrt(np.sum((m1 - m2) ** 2) + np.trace(S1 + S2 - 2 * cross)))

def gauss_map_1d(x, m1, s1, m2, s2):
    return m2 + s2 / s1 * (x - m1)                    # Brenier map between N(m1, s1^2) and N(m2, s2^2)

I = np.eye(2)
print(sqrtm_psd(np.diag([4.0, 9.0])).round(4).tolist(), round(w2_gauss(np.zeros(2), I, np.array([3.0, 4.0]), I), 4), gauss_map_1d(2.0, 1.0, 1.0, 0.0, 3.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[2.0, 0.0], [0.0, 3.0]] 5.0 3.0",
          "[[4.0, 0.0], [0.0, 9.0]] 5.0 3.0",
          "[[2.0, 0.0], [0.0, 3.0]] 7.0 3.0",
          "[[2.0, 0.0], [0.0, 3.0]] 5.0 6.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>w_p_empirical(x, y, p)</C> for two samples of equal size, <C>w1_cdf(grid, F, G)</C> on a uniform grid, and{" "}
          <C>w2_gauss_1d(m1, s1, m2, s2)</C> with s the standard deviations.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def w_p_empirical(x, y, p):
    return float(np.mean(np.abs(x - y) ** p) ** (1 / p))

def w1_cdf(grid, F, G):
    return float(np.max(np.abs(F - G)))

def w2_gauss_1d(m1, s1, m2, s2):
    return float(abs(m1 - m2))
`,
        solution: LINE,
        tests: [
          { name: "emp", code: `assert abs(w_p_empirical(np.array([0.0, 4.0]), np.array([5.0, 1.0]), 2) - 1.0) < 1e-12 and abs(w_p_empirical(np.array([0.0, 1.0]), np.array([2.0, 4.0]), 1) - 2.5) < 1e-12` },
          { name: "cdf", code: `assert abs(w1_cdf(np.array([0.0, 0.5, 1.0]), np.array([1.0, 1.0, 1.0]), np.array([0.0, 0.5, 1.0])) - 0.75) < 1e-12 and abs(w2_gauss_1d(1.0, 2.0, 1.0, 5.0) - 3.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sqrtm_psd(S)</C>, <C>w2_gauss(m1, S1, m2, S2)</C> by the formula above, and <C>gauss_map_1d(x, m1, s1, m2, s2)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sqrtm_psd(S):
    return np.sqrt(S)

def w2_gauss(m1, S1, m2, S2):
    return float(np.sqrt(np.sum((m1 - m2) ** 2)))

def gauss_map_1d(x, m1, s1, m2, s2):
    return x - m1 + m2
`,
        solution: GAUSS,
        tests: [
          { name: "sqrtm", code: `S = np.array([[2.0, 1.0], [1.0, 2.0]]); R = sqrtm_psd(S)\nassert R.shape == (2, 2)\nassert np.allclose(R @ R, S)` },
          { name: "w2", code: `assert abs(w2_gauss(np.zeros(2), np.diag([1.0, 1.0]), np.zeros(2), np.diag([4.0, 9.0])) - np.sqrt(5.0)) < 1e-9 and abs(gauss_map_1d(1.0, 0.0, 2.0, 1.0, 4.0) - 3.0) < 1e-12` },
        ],
      },
    },
    {
      key: "diag",
      rung: "stretch",
      prompt: (
        <p>
          What is <M>{"W_2"}</M> between the centred Gaussians in two dimensions with covariances diag(1, 4) and diag(4, 1)? Give
          three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.414, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        A metric invites geometry. The next lesson asks what the straight line between two distributions looks like in{" "}
        <M>{"W_2"}</M>: not the average of their densities, but the distribution obtained by moving every point part of the way
        along its optimal path.
      </p>
    </>
  ),
};
