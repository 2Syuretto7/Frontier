import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FisherCircleViz } from "@/components/viz/FisherCircleViz";
import type { LessonContent } from "@/lib/types";

const SIMPLEX = `import numpy as np

def sqrt_embed(p):
    return 2 * np.sqrt(p)                                      # an isometry onto part of the sphere of radius 2

def fisher_length(path):
    d = np.diff(path, axis=0)
    mid = (path[1:] + path[:-1]) / 2
    return float(np.sum(np.sqrt(np.sum(d ** 2 / mid, axis=1))))    # speed^2 = sum_i (dp_i)^2 / p_i

def fisher_rao_dist(p, q):
    return float(2 * np.arccos(np.clip(np.sum(np.sqrt(p * q)), -1.0, 1.0)))   # great-circle distance on that sphere`;

const GAUSS = `import numpy as np

def gauss_fisher(mu, sigma):
    return np.diag([1 / sigma ** 2, 2 / sigma ** 2])           # Fisher metric of N(mu, sigma^2) in coordinates (mu, sigma)

def nll_grad(x, mu, sigma):
    return np.array([-(np.mean(x) - mu) / sigma ** 2, 1 / sigma - np.mean((x - mu) ** 2) / sigma ** 3])

def natural_step(x, mu, sigma, lr):
    g = np.linalg.solve(gauss_fisher(mu, sigma), nll_grad(x, mu, sigma))
    return mu - lr * g[0], sigma - lr * g[1]`;

export const lesson: LessonContent = {
  id: "m21.4.3",
  minutes: 55,
  links: {
    requires: ["m21.4.2", "m9.3.3"],
    revisits: ["l6.7.1", "m12.2.1"],
    foreshadows: ["m21.5.1"],
  },

  puzzle: (
    <>
      <p>
        Moving a coin&apos;s probability of heads from 0.5 to 0.51 is almost undetectable from data, while moving it from 0.001
        to 0.011 multiplies the rate of heads by eleven. The parameter changed by 0.01 both times, so the Euclidean distance in
        parameter space misjudges how far apart the two models are. Which metric on a space of probability distributions
        measures distance by distinguishability, what shape does the space take in that metric, and what does steepest descent
        look like in it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The Fisher information measures how sharply the log-likelihood responds to a change of parameter, which is how easily data
        tell two nearby models apart. Used as a Riemannian metric, it makes the space of distributions on finitely many outcomes
        into a piece of a sphere, and the space of Gaussians into the hyperbolic plane of the previous lesson. Steepest descent in
        this metric, the natural gradient, takes steps of equal statistical size, whatever the parametrisation.
      </p>
      <FisherCircleViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the Fisher metric">
        <p>
          For a smooth family of densities <M>{"p_\\theta"}</M>, the Fisher information{" "}
          <M>{"G(\\theta) = \\mathbb{E}_{p_\\theta}[\\nabla_\\theta \\log p_\\theta(X)\\, \\nabla_\\theta \\log p_\\theta(X)^\\top]"}</M>{" "}
          of m9.3.3, when positive definite, is the Fisher metric. Its squared length element is twice the local KL divergence:{" "}
          <M>{"\\mathrm{KL}(p_\\theta \\,\\|\\, p_{\\theta + d\\theta}) = \\tfrac12 d\\theta^\\top G(\\theta)\\, d\\theta + o(|d\\theta|^2)"}</M>{" "}
          (l6.7.1, m12.2.1). The Fisher-Rao distance is the distance of this metric.
        </p>
      </Definition>

      <Theorem title="the Fisher metric does not depend on the parametrisation">
        <p>
          If θ = φ(η) with Jacobian J, the Fisher information in η is <M>{"J^\\top G(\\theta)J"}</M>, the pullback of m21.4.2. So
          lengths, distances and natural gradient directions are properties of the family of distributions, not of the coordinates.
        </p>
      </Theorem>
      <Proof>
        <p>
          The score in η is <M>{"\\nabla_\\eta \\log p = J^\\top\\nabla_\\theta \\log p"}</M> by the chain rule, so its outer product
          has expectation <M>{"J^\\top G J"}</M>. The invariance statements then follow from the theorem of m21.4.2.
        </p>
      </Proof>

      <Theorem title="the simplex is a piece of a sphere">
        <p>
          For distributions p on k outcomes, the Fisher metric on tangent vectors v with <M>{"\\sum_i v_i = 0"}</M> is{" "}
          <M>{"\\sum_i v_i^2/p_i"}</M>. The map <M>{"p \\mapsto 2\\sqrt{p}"}</M> (<C>sqrt_embed</C>), taken entrywise, is an isometry
          onto the part of the sphere of radius 2 with nonnegative coordinates, and the Fisher-Rao distance is{" "}
          <M>{"2\\arccos\\big(\\sum_i \\sqrt{p_iq_i}\\big)"}</M> (<C>fisher_rao_dist</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          The score of outcome i in direction v is <M>{"v_i/p_i"}</M>, so the Fisher form is{" "}
          <M>{"\\sum_i p_i (v_i/p_i)^2 = \\sum_i v_i^2/p_i"}</M> (<C>fisher_length</C> integrates its square root). With{" "}
          <M>{"u_i = 2\\sqrt{p_i}"}</M>, <M>{"du_i = dp_i/\\sqrt{p_i}"}</M>, so{" "}
          <M>{"\\sum du_i^2 = \\sum dp_i^2/p_i"}</M>: lengths agree, and <M>{"\\sum u_i^2 = 4"}</M>. Shortest paths on a sphere are
          great-circle arcs, of length 2 times the angle between the endpoints, whose cosine is{" "}
          <M>{"u\\cdot u'/4 = \\sum_i\\sqrt{p_iq_i}"}</M>. The arc between two points with nonnegative coordinates is made of
          normalised nonnegative combinations of them, so it stays in the image of the simplex.
        </p>
        <Code>{SIMPLEX}</Code>
      </Proof>

      <Theorem title="Gaussians form a hyperbolic plane">
        <p>
          For <M>{"N(\\mu, \\sigma^2)"}</M> in coordinates (μ, σ) the Fisher metric is{" "}
          <M>{"(d\\mu^2 + 2\\,d\\sigma^2)/\\sigma^2"}</M> (<C>gauss_fisher</C>). With <M>{"\\mu = \\sqrt2 u"}</M> it is{" "}
          <M>{"2(du^2 + d\\sigma^2)/\\sigma^2"}</M>, twice the metric of the hyperbolic upper half-plane of m21.4.2.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"Z = (X - \\mu)/\\sigma"}</M>, standard normal. The scores are <M>{"Z/\\sigma"}</M> for μ and{" "}
          <M>{"(Z^2 - 1)/\\sigma"}</M> for σ. Then <M>{"\\mathbb{E}Z^2 = 1"}</M>, <M>{"\\mathbb{E}(Z^2 - 1)^2 = 3 - 2 + 1 = 2"}</M> and{" "}
          <M>{"\\mathbb{E}Z(Z^2 - 1) = 0"}</M>, giving the diagonal entries <M>{"1/\\sigma^2"}</M> and <M>{"2/\\sigma^2"}</M>. A
          change of mean by one standard deviation is a fixed distance at every scale, as distinguishability demands.
        </p>
      </Proof>

      <Example title="natural gradient for a Gaussian">
        <p>
          The natural gradient step is <M>{"\\theta \\leftarrow \\theta - \\eta\\, G(\\theta)^{-1}\\nabla L(\\theta)"}</M>
          (<C>natural_step</C>). For the mean negative log-likelihood of data with mean <M>{"\\bar x"}</M> (<C>nll_grad</C>), the
          μ-component of <M>{"G^{-1}\\nabla L"}</M> is <M>{"\\sigma^2 \\cdot (\\mu - \\bar x)/\\sigma^2 = \\mu - \\bar x"}</M>, so the
          step moves μ a fraction η of the way to <M>{"\\bar x"}</M> whatever σ is, while the plain gradient step is scaled by{" "}
          <M>{"1/\\sigma^2"}</M> and crawls when σ is large.
        </p>
        <Code>{GAUSS}</Code>
      </Example>

      <Remark title="natural gradients in deep learning">
        <p>
          For a network defining <M>{"p_\\theta(y \\mid x)"}</M>, the Fisher matrix has one row per parameter and cannot be formed,
          so practical methods approximate it: K-FAC by Kronecker products of per-layer factors (m6.6.5), Shampoo-type methods by
          related matrix preconditioners. The empirical Fisher, built from gradients at the observed labels instead of labels
          sampled from the model, is a different matrix, and Kunstner and colleagues showed it can give poor search directions.
          Adam&apos;s second-moment estimate resembles a diagonal empirical Fisher, but the square root it takes means it is not a
          natural gradient method.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "coin",
      rung: "check",
      prompt: (
        <p>
          What is the Fisher-Rao distance between the coin distributions (0.5, 0.5) and (0.9, 0.1)? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.927, tolerance: 0.0006 },
    },
    {
      key: "scale",
      rung: "check",
      prompt: (
        <p>
          With μ fixed, what is the Fisher length of the path from <M>{"N(\\mu, 1)"}</M> to <M>{"N(\\mu, e^2)"}</M>, that is, σ from
          1 to e? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.414, tolerance: 0.0006 },
    },
    {
      key: "nat",
      rung: "apply",
      prompt: <p>Why does a natural gradient step on the mean of a Gaussian not slow down when σ is large, while a plain gradient step does?</p>,
      answer: {
        kind: "choice",
        options: [
          "The gradient in μ is divided by σ², and the inverse Fisher metric multiplies it back by σ², so the step depends only on how far μ is from the data mean",
          "Because the natural gradient ignores σ entirely",
          "Because the Fisher metric is the identity in (μ, σ)",
          "Because the learning rate is rescaled by hand at every step",
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

def sqrt_embed(p):
    return 2 * np.sqrt(p)                                      # an isometry onto part of the sphere of radius 2

def fisher_length(path):
    d = np.diff(path, axis=0)
    mid = (path[1:] + path[:-1]) / 2
    return float(np.sum(np.sqrt(np.sum(d ** 2 / mid, axis=1))))    # speed^2 = sum_i (dp_i)^2 / p_i

def fisher_rao_dist(p, q):
    return float(2 * np.arccos(np.clip(np.sum(np.sqrt(p * q)), -1.0, 1.0)))   # great-circle distance on that sphere

p = np.array([0.25, 0.75]); q = np.array([0.75, 0.25])
print(sqrt_embed(p).round(3).tolist(), round(fisher_rao_dist(p, p), 3), round(fisher_rao_dist(np.array([1.0, 0.0]), np.array([0.0, 1.0])), 3), round(fisher_rao_dist(p, q), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 1.732] 0.0 3.142 1.047",
          "[0.5, 0.866] 0.0 3.142 1.047",
          "[1.0, 1.732] 0.0 1.571 0.524",
          "[1.0, 1.732] 0.0 3.142 0.524",
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

def gauss_fisher(mu, sigma):
    return np.diag([1 / sigma ** 2, 2 / sigma ** 2])           # Fisher metric of N(mu, sigma^2) in coordinates (mu, sigma)

def nll_grad(x, mu, sigma):
    return np.array([-(np.mean(x) - mu) / sigma ** 2, 1 / sigma - np.mean((x - mu) ** 2) / sigma ** 3])

def natural_step(x, mu, sigma, lr):
    g = np.linalg.solve(gauss_fisher(mu, sigma), nll_grad(x, mu, sigma))
    return mu - lr * g[0], sigma - lr * g[1]

x = np.array([1.0, 3.0])
print(gauss_fisher(0.0, 2.0).tolist(), nll_grad(x, 0.0, 1.0).tolist(), natural_step(x, 0.0, 1.0, 1.0)[0], natural_step(x, 0.0, 10.0, 1.0)[0])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.25, 0.0], [0.0, 0.5]] [-2.0, -4.0] 2.0 2.0",
          "[[0.25, 0.0], [0.0, 0.5]] [-2.0, -4.0] 2.0 0.02",
          "[[0.25, 0.0], [0.0, 0.125]] [-2.0, -4.0] 2.0 2.0",
          "[[0.25, 0.0], [0.0, 0.5]] [-2.0, 4.0] 2.0 2.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sqrt_embed(p)</C>, <C>fisher_length(path)</C> for a polygonal path of probability vectors using midpoints, and{" "}
          <C>fisher_rao_dist(p, q)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sqrt_embed(p):
    return np.sqrt(p)

def fisher_length(path):
    return float(np.sum(np.linalg.norm(np.diff(path, axis=0), axis=1)))

def fisher_rao_dist(p, q):
    return float(np.linalg.norm(p - q))
`,
        solution: SIMPLEX,
        tests: [
          { name: "dist", code: `assert np.allclose(sqrt_embed(np.array([0.25, 0.75])), [1.0, np.sqrt(3)])\nassert abs(fisher_rao_dist(np.array([1.0, 0.0]), np.array([0.5, 0.5])) - np.pi / 2) < 1e-12` },
          { name: "length", code: `t = np.linspace(0, 1, 2001)[:, None]; p, q = np.array([0.2, 0.8]), np.array([0.7, 0.3])\nL = fisher_length((1 - t) * p + t * q)\nassert abs(L - 2 * np.arccos(np.sqrt(0.14) + np.sqrt(0.24))) < 1e-3` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For <M>{"N(\\mu, \\sigma^2)"}</M> in coordinates (μ, σ), write <C>gauss_fisher(mu, sigma)</C>,{" "}
          <C>nll_grad(x, mu, sigma)</C>, the gradient of the mean negative log-likelihood of the data x, and{" "}
          <C>natural_step(x, mu, sigma, lr)</C> returning the new (mu, sigma).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gauss_fisher(mu, sigma):
    return np.eye(2)

def nll_grad(x, mu, sigma):
    return np.zeros(2)

def natural_step(x, mu, sigma, lr):
    return mu, sigma
`,
        solution: GAUSS,
        tests: [
          { name: "fisher", code: `assert np.allclose(gauss_fisher(1.0, 0.5), np.diag([4.0, 8.0])) and np.allclose(nll_grad(np.array([0.0, 2.0]), 1.0, 1.0), [0.0, 0.0])` },
          { name: "step", code: `mu, s = natural_step(np.array([4.0, 6.0]), 0.0, 3.0, 1.0)\nassert abs(mu - 5.0) < 1e-12 and natural_step(np.array([1.0, 3.0]), 0.0, 1.0, 0.5)[1] > 1.0` },
        ],
      },
    },
    {
      key: "hyp",
      rung: "stretch",
      prompt: (
        <p>
          Using the hyperbolic picture, find the Fisher-Rao distance between <M>{"N(0, 1)"}</M> and <M>{"N(2, 1)"}</M>. Give three
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.862, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        The last chapter returns to symmetry in the physical world. Molecules and proteins are point clouds in three dimensions
        whose properties do not change under rotation, translation and relabelling of atoms, and the next lesson builds networks
        that respect all three at once.
      </p>
    </>
  ),
};
