import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OptimalCriticViz } from "@/components/viz/OptimalCriticViz";
import type { LessonContent } from "@/lib/types";

const CRITIC = `import numpy as np

def kr_objective(f, real, fake):
    return float(np.mean(f(real)) - np.mean(f(fake)))     # a lower bound on W1 for any 1-Lipschitz f

def optimal_critic_1d(grid, F_real, F_fake):
    slope = np.sign(F_fake - F_real)                       # +1 where generated mass is ahead
    dx = grid[1] - grid[0]
    return np.concatenate([[0.0], np.cumsum(slope[:-1]) * dx])

def gradient_penalty(grad_norms, lam):
    return float(lam * np.mean((grad_norms - 1) ** 2))`;

const LIP = `import numpy as np

def w1_samples(x, y):
    return float(np.mean(np.abs(np.sort(x) - np.sort(y))))

def clip_weights(w, c):
    return np.clip(w, -c, c)                               # the original WGAN constraint

def lipschitz_bound(weights):
    return float(np.prod([np.linalg.norm(W, 2) for W in weights]))   # 1-Lipschitz activations assumed`;

export const lesson: LessonContent = {
  id: "m20.5.1",
  minutes: 55,
  links: {
    requires: ["m20.2.2", "m20.3.1"],
    revisits: ["l7.5.3", "m10.4.4"],
    foreshadows: ["m20.5.2"],
  },

  puzzle: (
    <>
      <p>
        A generator network maps noise to images, and we want its output distribution to match the data. Early GANs measured the
        mismatch with a Jensen-Shannon divergence, which is constant whenever the two distributions do not overlap, so the
        generator received no useful gradient. The Wasserstein GAN replaced it with <M>{"W_1"}</M>, estimated by a second network
        called a critic. Which theorem makes a neural network the right tool for estimating a transport distance, what exactly is
        the gradient the generator receives, and why must the critic be kept Lipschitz?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        By Kantorovich-Rubinstein duality (m20.2.2), <M>{"W_1"}</M> is the largest gap{" "}
        <M>{"\\mathbb{E} f(\\text{real}) - \\mathbb{E} f(\\text{fake})"}</M> over functions f whose slope never exceeds 1. A critic
        network searching over such functions estimates the distance from below. Once the critic is good, the generator improves by
        moving its samples uphill on f, and because the slope of the optimal f is exactly 1 wherever mass needs to move, this signal
        never vanishes, however far apart the distributions are.
      </p>
      <OptimalCriticViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the Wasserstein GAN objective">
        <p>
          A generator <M>{"g_\\theta"}</M> pushes a latent law <M>{"p_Z"}</M> forward to <M>{"\\mu_\\theta = (g_\\theta)_\\# p_Z"}</M>.
          With data distribution <M>{"\\mu"}</M>, the objective is
        </p>
        <MD>{"\\min_\\theta W_1(\\mu, \\mu_\\theta) = \\min_\\theta \\max_{\\|f\\|_{\\mathrm{Lip}} \\le 1} \\mathbb{E}_{X \\sim \\mu} f(X) - \\mathbb{E}_{Z} f(g_\\theta(Z)) ,"}</MD>
        <p>
          where the inner maximisation is over a parametrised family of critics. For any 1-Lipschitz f the gap (<C>kr_objective</C>)
          is a lower bound on <M>{"W_1"}</M>. In one dimension the optimal critic has derivative{" "}
          <M>{"\\operatorname{sign}(F_{\\mathrm{fake}} - F_{\\mathrm{real}})"}</M>, since the gap equals{" "}
          <M>{"\\int f'(x)(F_{\\mathrm{fake}}(x) - F_{\\mathrm{real}}(x))\\, dx"}</M> after integrating by parts
          (<C>optimal_critic_1d</C>).
        </p>
        <Code>{CRITIC}</Code>
      </Definition>

      <Theorem title="W₁ is continuous in the generator's parameters">
        <p>
          If <M>{"|g_\\theta(z) - g_{\\theta'}(z)| \\le L(z)|\\theta - \\theta'|"}</M> with <M>{"\\mathbb{E}L(Z) < \\infty"}</M>, then{" "}
          <M>{"|W_1(\\mu, \\mu_\\theta) - W_1(\\mu, \\mu_{\\theta'})| \\le \\mathbb{E}L(Z)\\, |\\theta - \\theta'|"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The pair <M>{"(g_\\theta(Z), g_{\\theta'}(Z))"}</M> couples <M>{"\\mu_\\theta"}</M> and <M>{"\\mu_{\\theta'}"}</M>, so{" "}
          <M>{"W_1(\\mu_\\theta, \\mu_{\\theta'}) \\le \\mathbb{E}|g_\\theta(Z) - g_{\\theta'}(Z)|"}</M>, and the triangle inequality
          for <M>{"W_1"}</M> bounds the change in distance to μ by this. The Jensen-Shannon divergence has no such bound: it jumps
          from log 2 to a smaller value the moment supports start to overlap (l7.5.3).
        </p>
      </Proof>

      <Theorem title="the generator's gradient">
        <p>
          Let <M>{"f^*"}</M> be an optimal critic at θ. If <M>{"W(\\theta) = W_1(\\mu, \\mu_\\theta)"}</M> is differentiable at θ and
          the expressions below are smooth, then{" "}
          <M>{"\\nabla_\\theta W(\\theta) = -\\mathbb{E}\\big[ \\partial_\\theta g_\\theta(Z)^\\top \\nabla f^*(g_\\theta(Z)) \\big]"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The function <M>{"h(\\theta') = \\mathbb{E} f^*(X) - \\mathbb{E} f^*(g_{\\theta'}(Z))"}</M> satisfies{" "}
          <M>{"h \\le W"}</M> everywhere, because <M>{"f^*"}</M> is one candidate critic, and <M>{"h(\\theta) = W(\\theta)"}</M>. So{" "}
          <M>{"W - h"}</M> has a minimum at θ, and if both are differentiable their gradients agree there. The gradient of h is the
          formula, by differentiating under the expectation. This is the envelope theorem, the same reasoning that reads dual
          variables as sensitivities (m10.4.4): the optimal critic does not need to be differentiated with respect to θ.
        </p>
      </Proof>

      <Theorem title="optimal critics have unit slope along transport paths">
        <p>
          If π is an optimal plan for <M>{"W_1"}</M> and <M>{"f^*"}</M> an optimal 1-Lipschitz critic, then{" "}
          <M>{"f^*(x) - f^*(y) = |x - y|"}</M> for π-almost every (x, y), so <M>{"f^*"}</M> increases at rate exactly 1 along the
          segment from y to x.
        </p>
      </Theorem>
      <Proof>
        <p>
          With the potentials <M>{"(f^*, -f^*)"}</M> of m20.2.2, complementary slackness (m20.2.1) says{" "}
          <M>{"f^*(x) - f^*(y) = |x - y|"}</M> on the support of π. For a point{" "}
          <M>{"z = y + t(x - y)"}</M> on the segment, the Lipschitz bound gives <M>{"f^*(z) - f^*(y) \\le t|x - y|"}</M> and{" "}
          <M>{"f^*(x) - f^*(z) \\le (1 - t)|x - y|"}</M>; they add to equality, so both are equalities.
        </p>
      </Proof>

      <Example title="enforcing the constraint">
        <p>
          The original WGAN clipped every weight to [−c, c] (<C>clip_weights</C>), which bounds the Lipschitz constant crudely
          through the product of layer norms (<C>lipschitz_bound</C>) and wastes capacity. Spectral normalisation divides each weight
          matrix by its largest singular value, making that bound 1. The gradient penalty adds{" "}
          <M>{"\\lambda\\, \\mathbb{E}(|\\nabla f(\\hat x)| - 1)^2"}</M> at random points <M>{"\\hat x"}</M> on segments between real
          and generated samples (<C>gradient_penalty</C>), motivated by the previous theorem: there the optimal critic has slope
          exactly 1. <C>w1_samples</C> gives the exact value in one dimension for comparison.
        </p>
        <Code>{LIP}</Code>
      </Example>

      <Remark title="what the critic really estimates">
        <p>
          A finite network trained for finitely many steps finds a lower bound on <M>{"W_1"}</M>, a distance relative to the critic
          class rather than the true transport distance. This is often an advantage, since the true <M>{"W_1"}</M> between empirical
          samples in high dimension is dominated by sampling noise. In practice WGANs gave stabler training, and their critic loss
          tracked sample quality, which the original GAN loss did not.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "emp",
      rung: "check",
      prompt: (
        <p>
          The real samples are {"{0, 2, 4}"} and the generated samples are {"{1, 1, 1}"}. What is <M>{"W_1"}</M> between the two
          empirical distributions? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.667, tolerance: 0.0006 },
    },
    {
      key: "gp",
      rung: "check",
      prompt: (
        <p>
          At three interpolated points the critic&apos;s gradient norms are 0.5, 1.5 and 2. What is the gradient penalty with λ = 10?
        </p>
      ),
      answer: { kind: "numeric", value: 5, tolerance: 0.0005 },
    },
    {
      key: "grad",
      rung: "apply",
      prompt: <p>Why does the generator not need the derivative of the optimal critic with respect to θ?</p>,
      answer: {
        kind: "choice",
        options: [
          "The critic is optimal, so by the envelope theorem the change in the optimal critic contributes nothing to first order; only the explicit dependence through the generated samples matters",
          "The critic does not depend on θ at all",
          "Because the critic is Lipschitz, its derivative is zero",
          "Because the gradient is estimated by the critic's loss alone",
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

def kr_objective(f, real, fake):
    return float(np.mean(f(real)) - np.mean(f(fake)))     # a lower bound on W1 for any 1-Lipschitz f

def optimal_critic_1d(grid, F_real, F_fake):
    slope = np.sign(F_fake - F_real)                       # +1 where generated mass is ahead
    dx = grid[1] - grid[0]
    return np.concatenate([[0.0], np.cumsum(slope[:-1]) * dx])

def gradient_penalty(grad_norms, lam):
    return float(lam * np.mean((grad_norms - 1) ** 2))

f = optimal_critic_1d(np.arange(4.0), np.array([0.5, 1, 1, 1]), np.array([0, 0.5, 1, 1]))
print(kr_objective(lambda x: 2 * x, np.array([1.0, 3.0]), np.array([0.0, 1.0])), f.tolist(), round(gradient_penalty(np.array([1.0, 3.0, 0.0]), 10), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3.0 [0.0, -1.0, -2.0, -2.0] 16.6667",
          "3.0 [0.0, 1.0, 2.0, 2.0] 16.6667",
          "1.5 [0.0, -1.0, -2.0, -2.0] 16.6667",
          "3.0 [0.0, -1.0, -2.0, -2.0] 50.0",
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

def w1_samples(x, y):
    return float(np.mean(np.abs(np.sort(x) - np.sort(y))))

def clip_weights(w, c):
    return np.clip(w, -c, c)                               # the original WGAN constraint

def lipschitz_bound(weights):
    return float(np.prod([np.linalg.norm(W, 2) for W in weights]))   # 1-Lipschitz activations assumed

print(w1_samples(np.array([0.0, 4.0]), np.array([5.0, 1.0])), clip_weights(np.array([-0.3, 0.05, 0.2]), 0.1).tolist(), lipschitz_bound([np.diag([2.0, 0.5]), np.array([[3.0, 4.0]])]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.0 [-0.1, 0.05, 0.1] 10.0", "4.0 [-0.1, 0.05, 0.1] 10.0", "1.0 [-0.1, 0.1, 0.1] 10.0", "1.0 [-0.1, 0.05, 0.1] 7.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kr_objective(f, real, fake)</C>, <C>optimal_critic_1d(grid, F_real, F_fake)</C> returning the critic on the grid
          with value 0 at the first point, and <C>gradient_penalty(grad_norms, lam)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def kr_objective(f, real, fake):
    return float(np.mean(f(fake)) - np.mean(f(real)))

def optimal_critic_1d(grid, F_real, F_fake):
    return F_real - F_fake

def gradient_penalty(grad_norms, lam):
    return float(lam * np.mean(grad_norms ** 2))
`,
        solution: CRITIC,
        tests: [
          { name: "kr", code: `assert kr_objective(lambda x: -x, np.array([0.0]), np.array([2.0])) == 2.0 and abs(gradient_penalty(np.array([1.0, 2.0]), 4.0) - 2.0) < 1e-12` },
          { name: "critic", code: `f = optimal_critic_1d(np.array([0.0, 0.5, 1.0]), np.array([0.0, 1.0, 1.0]), np.array([1.0, 1.0, 1.0]))\nassert f.shape == (3,)\nassert np.allclose(f, [0.0, 0.5, 0.5])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>w1_samples(x, y)</C> for equal-sized samples, <C>clip_weights(w, c)</C> and <C>lipschitz_bound(weights)</C>, the
          product of the spectral norms of a list of weight matrices.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def w1_samples(x, y):
    return float(np.mean(np.abs(x - y)))

def clip_weights(w, c):
    return w / np.max(np.abs(w)) * c

def lipschitz_bound(weights):
    return float(np.prod([np.max(np.abs(W)) for W in weights]))
`,
        solution: LIP,
        tests: [
          { name: "w1", code: `assert abs(w1_samples(np.array([3.0, 0.0]), np.array([1.0, 2.0])) - 1.0) < 1e-12 and np.allclose(clip_weights(np.array([0.5, -2.0]), 1.0), [0.5, -1.0])` },
          { name: "lip", code: `assert abs(lipschitz_bound([np.array([[1.0, 1.0], [1.0, 1.0]]), np.array([[2.0, 0.0]])]) - 4.0) < 1e-9` },
        ],
      },
    },
    {
      key: "bound",
      rung: "stretch",
      prompt: (
        <p>
          A critic has layers <M>{"W_1 = \\operatorname{diag}(3, 1)"}</M> and <M>{"W_2 = (1\;\; 1)"}</M> with 1-Lipschitz
          activations between them. What upper bound on its Lipschitz constant does the product of spectral norms give? Give three
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 4.243, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Here transport gave a loss. The next lesson uses optimal transport inside training instead: pairing noise with data by an
        optimal plan within each minibatch straightens the paths that flow matching must learn.
      </p>
    </>
  ),
};
