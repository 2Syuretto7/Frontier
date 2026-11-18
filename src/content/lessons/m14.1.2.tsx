import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BatchGainViz } from "@/components/viz/BatchGainViz";
import type { LessonContent } from "@/lib/types";

const VAR = `import numpy as np

def minibatch_var(G, B, replace=True):
    N = len(G)
    tr = float(np.sum(np.var(G, axis=0)))
    return tr / B if replace else tr / B * (N - B) / (N - 1)

def empirical_var(G, B, trials, seed=0, replace=True):
    rng, g = np.random.default_rng(seed), G.mean(axis=0)
    devs = [np.sum((G[rng.choice(len(G), B, replace=replace)].mean(axis=0) - g) ** 2) for _ in range(trials)]
    return float(np.mean(devs))

def noise_scale(G):
    return float(np.sum(np.var(G, axis=0)) / np.sum(G.mean(axis=0) ** 2))`;

const GAIN = `def best_step(g2, tr_sigma, L, B):
    return g2 / (L * (g2 + tr_sigma / B))

def improvement(g2, tr_sigma, L, B):
    eta = best_step(g2, tr_sigma, L, B)
    return eta * g2 - 0.5 * L * eta ** 2 * (g2 + tr_sigma / B)

def relative_gain(B, b_noise):
    return 1 / (1 + b_noise / B)`;

export const lesson: LessonContent = {
  id: "m14.1.2",
  minutes: 45,
  links: {
    requires: ["m14.1.1"],
    revisits: ["e5.3.3"],
    foreshadows: ["m14.1.3", "m14.1.4"],
  },

  puzzle: (
    <>
      <p>
        Doubling the batch size halves the variance of the gradient estimate and doubles the cost of each step. Is that a
        good trade? Sometimes it is nearly free progress, and sometimes it is pure waste, and the same model can be in
        either regime at different points in training. What decides which?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A minibatch gradient is a sample mean of per-example gradients, so it points in the right direction on average
        and scatters around it with variance proportional to 1/B. The size of a useful step is limited by two things:
        curvature, which punishes long steps even with exact gradients, and noise, which makes long steps go confidently
        in wrong directions. When noise dominates, a bigger batch buys a proportionally bigger safe step. When curvature
        dominates, the step was already as long as it could be, and a bigger batch buys little. The ratio of noise to
        signal, the noise scale, marks the boundary.
      </p>
      <BatchGainViz />
    </>
  ),

  theory: (
    <>
      <Definition title="per-example gradients and their covariance">
        <p>
          For a loss <M>{"L(\\theta) = \\frac1N\\sum_i \\ell_i(\\theta)"}</M>, let <M>{"g_i = \\nabla\\ell_i"}</M>,{" "}
          <M>{"g = \\frac1N\\sum_i g_i"}</M> and{" "}
          <M>{"\\Sigma = \\frac1N\\sum_i (g_i - g)(g_i - g)^\\top"}</M>. A minibatch gradient{" "}
          <M>{"\\hat g_B"}</M> averages B of the <M>{"g_i"}</M>. The simple noise scale is{" "}
          <M>{"B_{\\text{noise}} = \\operatorname{tr}\\Sigma / \\|g\\|^2"}</M>.
        </p>
      </Definition>

      <Theorem title="minibatch variance">
        <p>
          <M>{"\\hat g_B"}</M> is unbiased, and{" "}
          <M>{"\\mathbb E\\|\\hat g_B - g\\|^2 = \\operatorname{tr}\\Sigma / B"}</M> when examples are drawn with
          replacement, and <M>{"\\frac{\\operatorname{tr}\\Sigma}{B}\\cdot\\frac{N - B}{N - 1}"}</M> without.
        </p>
      </Theorem>
      <Proof>
        <p>
          With replacement the B draws are independent with mean g and total variance <M>{"\\operatorname{tr}\\Sigma"}</M>,
          and the variance of a mean of B independent terms is 1/B of one term&apos;s. Without replacement, distinct draws
          are negatively correlated: since the deviations <M>{"g_i - g"}</M> sum to zero, the covariance between two distinct
          draws is <M>{"-\\Sigma/(N - 1)"}</M>, and adding the B(B − 1) cross terms to the B diagonal ones gives the factor{" "}
          <M>{"(N - B)/(N - 1)"}</M>, which is zero for the full batch.
        </p>
        <Code>{VAR}</Code>
      </Proof>

      <Theorem title="the best step and its value">
        <p>
          If L is L-smooth, a step <M>{"\\theta - \\eta\\hat g_B"}</M> lowers the expected loss by at least{" "}
          <M>{"\\eta\\|g\\|^2 - \\frac{L\\eta^2}{2}\\big(\\|g\\|^2 + \\operatorname{tr}\\Sigma/B\\big)"}</M>. The best η and the
          resulting decrease are
        </p>
        <MD>{"\\eta^*(B) = \\frac{\\eta_{\\max}}{1 + B_{\\text{noise}}/B},\\qquad \\Delta L^*(B) = \\frac{\\Delta L_{\\max}}{1 + B_{\\text{noise}}/B},"}</MD>
        <p>
          where <M>{"\\eta_{\\max} = 1/L"}</M> and <M>{"\\Delta L_{\\max} = \\|g\\|^2/(2L)"}</M> are the full-batch values.
        </p>
      </Theorem>
      <Proof>
        <p>
          Smoothness gives{" "}
          <M>{"L(\\theta - \\eta\\hat g) \\le L(\\theta) - \\eta g^\\top \\hat g + \\tfrac{L\\eta^2}{2}\\|\\hat g\\|^2"}</M>.
          Taking expectations, <M>{"\\mathbb E[g^\\top\\hat g] = \\|g\\|^2"}</M> and{" "}
          <M>{"\\mathbb E\\|\\hat g\\|^2 = \\|g\\|^2 + \\operatorname{tr}\\Sigma/B"}</M>. The bound is a concave quadratic in η,
          maximised at <M>{"\\eta^* = \\|g\\|^2 / (L(\\|g\\|^2 + \\operatorname{tr}\\Sigma/B))"}</M> with value{" "}
          <M>{"\\eta^*\\|g\\|^2/2"}</M>; dividing numerator and denominator by <M>{"\\|g\\|^2"}</M> gives the stated forms.
        </p>
        <Code>{GAIN}</Code>
      </Proof>

      <Remark title="reading the noise scale">
        <p>
          For <M>{"B \\ll B_{\\text{noise}}"}</M>, <M>{"\\Delta L^* \\approx \\Delta L_{\\max} B/B_{\\text{noise}}"}</M>: progress
          is proportional to the batch, so examples are used as efficiently as possible and the optimal learning rate grows
          linearly with B. For <M>{"B \\gg B_{\\text{noise}}"}</M>, progress saturates at the full-batch value. Because{" "}
          <M>{"\\|g\\|"}</M> shrinks as training proceeds while Σ does not, <M>{"B_{\\text{noise}}"}</M> usually grows during
          training, so larger batches become useful later. Using the curvature H instead of L·I gives the refined scale{" "}
          <M>{"\\operatorname{tr}(H\\Sigma)/(g^\\top H g)"}</M>.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "var",
      rung: "check",
      prompt: <p>Per-example gradients have total variance tr Σ = 800. What is the expected squared error of a batch-32 gradient drawn with replacement?</p>,
      answer: { kind: "numeric", value: 25, tolerance: 0.001 },
    },
    {
      key: "gain",
      rung: "check",
      prompt: <p>With B_noise = 300 and B = 100, what fraction of the full-batch decrease does one optimally tuned step achieve?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
    {
      key: "late",
      rung: "apply",
      prompt: <p>Why does the noise scale typically grow as training progresses?</p>,
      answer: {
        kind: "choice",
        options: [
          "The mean gradient ‖g‖ shrinks as the model approaches a minimum while the per-example spread Σ stays roughly constant, so their ratio grows",
          "Per-example gradients become more similar late in training",
          "The learning rate is decayed",
          "Larger models have smaller gradient noise",
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

def minibatch_var(G, B, replace=True):
    N = len(G)
    tr = float(np.sum(np.var(G, axis=0)))
    return tr / B if replace else tr / B * (N - B) / (N - 1)

def empirical_var(G, B, trials, seed=0, replace=True):
    rng, g = np.random.default_rng(seed), G.mean(axis=0)
    devs = [np.sum((G[rng.choice(len(G), B, replace=replace)].mean(axis=0) - g) ** 2) for _ in range(trials)]
    return float(np.mean(devs))

def noise_scale(G):
    return float(np.sum(np.var(G, axis=0)) / np.sum(G.mean(axis=0) ** 2))

G = np.array([[1.0, 0.0], [3.0, 2.0], [2.0, -2.0], [2.0, 4.0]]); print(G.mean(axis=0).tolist(), minibatch_var(G, 1), minibatch_var(G, 2), minibatch_var(G, 4, replace=False), noise_scale(G))
print(abs(empirical_var(G, 2, 20000) - minibatch_var(G, 2)) < 0.1, abs(empirical_var(G, 2, 20000, replace=False) - minibatch_var(G, 2, False)) < 0.1)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.0, 1.0] 5.5 2.75 0.0 1.1\nTrue True",
          "[2.0, 1.0] 5.5 2.75 1.375 1.1\nTrue True",
          "[2.0, 1.0] 7.333 3.667 0.0 1.467\nTrue True",
          "[2.0, 1.0] 5.5 2.75 0.0 0.909\nTrue True",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def best_step(g2, tr_sigma, L, B):
    return g2 / (L * (g2 + tr_sigma / B))

def improvement(g2, tr_sigma, L, B):
    eta = best_step(g2, tr_sigma, L, B)
    return eta * g2 - 0.5 * L * eta ** 2 * (g2 + tr_sigma / B)

def relative_gain(B, b_noise):
    return 1 / (1 + b_noise / B)

print(best_step(4.0, 8.0, 2.0, 2), improvement(4.0, 8.0, 2.0, 2), improvement(4.0, 0.0, 2.0, 2))
print([round(relative_gain(B, 100), 3) for B in [10, 100, 1000]], relative_gain(50, 0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.25 0.5 1.0\n[0.091, 0.5, 0.909] 1.0",
          "0.5 0.5 1.0\n[0.091, 0.5, 0.909] 1.0",
          "0.25 0.25 1.0\n[0.091, 0.5, 0.909] 1.0",
          "0.25 0.5 1.0\n[0.909, 0.5, 0.091] 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For per-example gradients G of shape (N, d), write <C>minibatch_var(G, B, replace=True)</C>, the expected squared
          error of a batch-B mean from the theorem, <C>empirical_var(G, B, trials, seed=0, replace=True)</C>, estimating it
          by drawing batches with <C>rng.choice(len(G), B, replace=replace)</C>, and <C>noise_scale(G)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def minibatch_var(G, B, replace=True):
    return 0.0

def empirical_var(G, B, trials, seed=0, replace=True):
    return 0.0

def noise_scale(G):
    return 0.0
`,
        solution: VAR,
        tests: [
          { name: "exact", code: `G = np.array([[0.0, 1.0], [2.0, 1.0], [4.0, 4.0], [2.0, 2.0], [2.0, 2.0]])
tr = float(np.sum(np.var(G, axis=0))); assert abs(minibatch_var(G, 2) - tr / 2) < 1e-12 and abs(minibatch_var(G, 2, False) - tr / 2 * 3 / 4) < 1e-12 and minibatch_var(G, 5, False) == 0.0
assert abs(noise_scale(G) - tr / 8) < 1e-12` },
          { name: "empirical", code: `G = np.random.default_rng(3).normal(size=(30, 3)) + 1.0
for rep in [True, False]:
    assert abs(empirical_var(G, 6, 30000, 1, rep) / minibatch_var(G, 6, rep) - 1) < 0.05
assert empirical_var(G, 30, 5, replace=False) < 1e-20` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>best_step(g2, tr_sigma, L, B)</C>, <C>improvement(g2, tr_sigma, L, B)</C>, the guaranteed decrease at
          that step from the bound, and <C>relative_gain(B, b_noise)</C>, where g2 is ‖g‖².
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def best_step(g2, tr_sigma, L, B):
    return 1 / L

def improvement(g2, tr_sigma, L, B):
    return g2 / (2 * L)

def relative_gain(B, b_noise):
    return 1.0
`,
        solution: GAIN,
        tests: [
          { name: "step", code: `assert abs(best_step(2.0, 6.0, 4.0, 3) - 0.125) < 1e-12 and abs(improvement(2.0, 6.0, 4.0, 3) - 0.125) < 1e-12 and abs(improvement(2.0, 0.0, 4.0, 1) - 0.25) < 1e-12` },
          { name: "gain", code: `for B in [1, 7, 50]:
    assert abs(improvement(3.0, 12.0, 5.0, B) / improvement(3.0, 0.0, 5.0, B) - relative_gain(B, 4.0)) < 1e-12
assert relative_gain(8, 8) == 0.5 and abs(relative_gain(1, 99) - 0.01) < 1e-12` },
        ],
      },
    },
    {
      key: "ex",
      rung: "stretch",
      prompt: (
        <p>
          With B_noise = 1000, how many times more examples per unit of progress does B = 4000 use than a very small batch?
        </p>
      ),
      answer: { kind: "numeric", value: 5, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        If small batches use examples best and large batches use steps best, there is a whole curve of trade-offs between
        training time and compute. The next lesson draws it and locates its knee, the critical batch size.
      </p>
    </>
  ),
};
