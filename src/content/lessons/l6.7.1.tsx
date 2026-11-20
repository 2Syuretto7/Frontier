import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { NaturalGradientViz } from "@/components/viz/NaturalGradientViz";
import type { LessonContent } from "@/lib/types";

const FISHER = `import math

def fisher(probs, scores):
    k = len(scores[0])
    return [[sum(p * s[i] * s[j] for p, s in zip(probs, scores)) for j in range(k)] for i in range(k)]

def natural_gradient(F, g, damping=0.0):
    n = len(g)
    M = [[F[i][j] + (damping if i == j else 0.0) for j in range(n)] + [g[i]] for i in range(n)]
    for c in range(n):
        piv = max(range(c, n), key=lambda r: abs(M[r][c]))
        M[c], M[piv] = M[piv], M[c]
        for r in range(n):
            if r != c:
                f = M[r][c] / M[c][c]
                M[r] = [a - f * b for a, b in zip(M[r], M[c])]
    return [M[i][n] / M[i][i] for i in range(n)]

def kl(p, q):
    return sum(a * math.log(a / b) for a, b in zip(p, q) if a > 0)`;

const GAUSS = `import math

def gaussian_fisher(sigma):
    return [[1 / sigma ** 2, 0.0], [0.0, 2 / sigma ** 2]]

def kl_gaussian(mu1, s1, mu2, s2):
    return math.log(s2 / s1) + (s1 ** 2 + (mu1 - mu2) ** 2) / (2 * s2 ** 2) - 0.5

def natural_gaussian_step(mu, sigma, g_mu, g_sigma, alpha):
    return mu + alpha * sigma ** 2 * g_mu, sigma + alpha * sigma ** 2 / 2 * g_sigma`;

export const lesson: LessonContent = {
  id: "l6.7.1",
  minutes: 55,
  links: {
    requires: ["l6.6.1", "l6.6.3"],
    revisits: ["m9.3.3", "m12.2.1"],
    foreshadows: ["l6.7.2", "m21.4.3"],
  },

  puzzle: (
    <>
      <p>
        A policy that is 99% sure of the wrong action has a tiny policy gradient, because the score of a softmax shrinks as the
        policy becomes certain. Gradient ascent therefore creeps exactly where a big correction is needed. Yet the same policy
        written with a different parametrisation would have a different gradient. Is there a direction of steepest ascent
        that belongs to the policy itself rather than to the way it happens to be parametrised?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The ordinary gradient is steepest ascent when the size of a step is measured by the Euclidean length of the change in
        θ. Measure it instead by how much the policy&apos;s action distributions change, the KL divergence. Near the current
        policy that divergence is a quadratic form whose matrix is the Fisher information, and steepest ascent under it is the
        gradient multiplied by the inverse Fisher matrix. Where the policy is nearly certain, a large change in θ is only a
        small change in behaviour, so the natural gradient takes a much larger step there.
      </p>
      <NaturalGradientViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the Fisher information of a policy">
        <p>
          With states drawn from the policy&apos;s state distribution d,
        </p>
        <MD>{"F(\\theta) = \\mathbb{E}_{s \\sim d,\\,a \\sim \\pi_\\theta}\\bigl[\\nabla\\log\\pi_\\theta(a \\mid s)\\,\\nabla\\log\\pi_\\theta(a \\mid s)^\\top\\bigr],"}</MD>
        <p>
          the covariance of the score (m9.3.3), which is positive semi-definite. For a single state with action probabilities{" "}
          <C>probs</C> and score vectors <C>scores</C>, it is <C>fisher</C>. For a logistic policy p = σ(θ), F = p(1 − p).
        </p>
      </Definition>

      <Theorem title="KL divergence is locally a Fisher quadratic form">
        <p>
          For each state,{" "}
          <M>{"\\mathrm{KL}\\bigl(\\pi_\\theta(\\cdot \\mid s)\\,\\|\\,\\pi_{\\theta + d}(\\cdot \\mid s)\\bigr) = \\tfrac12d^\\top F_s(\\theta)d + O(\\|d\\|^3)"}</M>, where{" "}
          <M>{"F_s"}</M> is the Fisher matrix at s. Averaging over d gives <M>{"\\tfrac12d^\\top Fd"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"\\mathrm{KL} = \\mathbb{E}_{a \\sim \\pi_\\theta}[\\log\\pi_\\theta(a) - \\log\\pi_{\\theta + d}(a)]"}</M> (m12.2.1) and expand{" "}
          <M>{"\\log\\pi_{\\theta + d}"}</M> to second order in d. The constant terms cancel. The linear term is{" "}
          <M>{"-d^\\top\\mathbb{E}[\\nabla\\log\\pi]"}</M>, which is 0 because the score has mean zero (l6.6.2). The quadratic term is{" "}
          <M>{"-\\tfrac12d^\\top\\mathbb{E}[\\nabla^2\\log\\pi]d"}</M>, and{" "}
          <M>{"-\\mathbb{E}[\\nabla^2\\log\\pi] = \\mathbb{E}[\\nabla\\log\\pi\\nabla\\log\\pi^\\top]"}</M>, the information identity, which follows from
          differentiating <M>{"\\sum_a\\pi\\nabla\\log\\pi = 0"}</M> once more.
        </p>
      </Proof>

      <Theorem title="the natural gradient">
        <p>
          (Amari, 1998; Kakade, 2001.) Among steps with <M>{"\\tfrac12d^\\top Fd \\le \\varepsilon"}</M>, the one that maximises the first-order
          gain <M>{"g^\\top d"}</M>, with <M>{"g = \\nabla J"}</M>, is
        </p>
        <MD>{"d^* = \\sqrt{\\frac{2\\varepsilon}{g^\\top F^{-1}g}}\\;F^{-1}g."}</MD>
        <p>
          The direction <M>{"\\tilde g = F^{-1}g"}</M> is the <em>natural gradient</em> (<C>natural_gradient</C>, which solves{" "}
          <M>{"(F + \\lambda I)x = g"}</M> by elimination with pivoting; the damping λ guards against a singular F).
        </p>
      </Theorem>
      <Proof>
        <p>
          With a multiplier ν, stationarity of <M>{"g^\\top d - \\nu(\\tfrac12d^\\top Fd - \\varepsilon)"}</M> gives g = νFd, so{" "}
          <M>{"d = F^{-1}g/\\nu"}</M>. The constraint is tight at the optimum because the gain is linear, so{" "}
          <M>{"\\tfrac12g^\\top F^{-1}g/\\nu^2 = \\varepsilon"}</M>, which fixes ν. Since F is positive definite, the objective is concave on
          the convex feasible set, so this stationary point is the maximum.
        </p>
        <Code>{FISHER}</Code>
      </Proof>

      <Theorem title="invariance to parametrisation">
        <p>
          If θ = φ(η) with invertible Jacobian J, the natural gradient step computed in η, mapped through J, equals the natural
          gradient step computed in θ. The ordinary gradient does not have this property.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the chain rule the score in η is <M>{"J^\\top\\nabla_\\theta\\log\\pi"}</M>, so <M>{"F_\\eta = J^\\top F_\\theta J"}</M> and{" "}
          <M>{"g_\\eta = J^\\top g_\\theta"}</M>. Then{" "}
          <M>{"J\\tilde g_\\eta = J(J^\\top F_\\theta J)^{-1}J^\\top g_\\theta = JJ^{-1}F_\\theta^{-1}J^{-\\top}J^\\top g_\\theta = F_\\theta^{-1}g_\\theta"}</M>. The ordinary
          gradient maps to <M>{"JJ^\\top g_\\theta"}</M>, which differs unless J is orthogonal.
        </p>
      </Proof>

      <Theorem title="compatible function approximation">
        <p>
          (Sutton et al., 2000; Kakade, 2001.) Fit the advantage by a linear function of the score,{" "}
          <M>{"\\hat A_w(s, a) = w^\\top\\nabla\\log\\pi(a \\mid s)"}</M>, by least squares under the policy&apos;s distribution. Then the
          minimiser is <M>{"w = F^{-1}\\nabla J"}</M>: the natural gradient is the weight vector of the best compatible critic.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write ψ for the score. The normal equations of <M>{"\\mathbb{E}[(w^\\top\\psi - a_\\pi)^2]"}</M> are{" "}
          <M>{"\\mathbb{E}[\\psi\\psi^\\top]w = \\mathbb{E}[\\psi\\,a_\\pi]"}</M>. The left matrix is F, and by the policy gradient theorem with the
          advantage (l6.6.3) the right side is ∇J. This is the basis of natural actor-critic methods.
        </p>
      </Proof>

      <Remark title="a Gaussian policy">
        <p>
          For actions drawn from <M>{"\\mathcal{N}(\\mu, \\sigma^2)"}</M>, the Fisher matrix in (μ, σ) is{" "}
          <M>{"\\mathrm{diag}(1/\\sigma^2, 2/\\sigma^2)"}</M> (<C>gaussian_fisher</C>), so the natural step scales the μ-gradient by{" "}
          <M>{"\\sigma^2"}</M> and the σ-gradient by <M>{"\\sigma^2/2"}</M> (<C>natural_gaussian_step</C>). A wide policy may move its mean a long
          way, since that changes its distribution little; a narrow one must move carefully. <C>kl_gaussian</C> gives the exact
          divergence to check the quadratic estimate. With k parameters F has <M>{"k^2"}</M> entries, so for networks it is never
          formed: TRPO (l6.7.2) multiplies vectors by it inside conjugate gradient.
        </p>
        <Code>{GAUSS}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "f",
      rung: "check",
      prompt: <p>What is the Fisher information of a logistic policy p = σ(θ) at p = 0.5?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
    {
      key: "ng",
      rung: "check",
      prompt: (
        <p>
          In a one-step task, action 1 is worth 3 more than action 0 and π(1) = σ(θ) = 0.1. What is the natural gradient of the
          expected reward with respect to θ?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does the natural gradient escape the plateau in the picture when the vanilla gradient does not?</p>,
      answer: {
        kind: "choice",
        options: [
          "Near a certain policy a large change in θ is a small change in the action distribution, and dividing by the Fisher information takes that into account",
          "It uses a larger fixed step size",
          "It adds noise that helps it escape",
          "It uses second derivatives of the reward with respect to the action",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def fisher(probs, scores):
    k = len(scores[0])
    return [[sum(p * s[i] * s[j] for p, s in zip(probs, scores)) for j in range(k)] for i in range(k)]

def natural_gradient(F, g, damping=0.0):
    n = len(g)
    M = [[F[i][j] + (damping if i == j else 0.0) for j in range(n)] + [g[i]] for i in range(n)]
    for c in range(n):
        piv = max(range(c, n), key=lambda r: abs(M[r][c]))
        M[c], M[piv] = M[piv], M[c]
        for r in range(n):
            if r != c:
                f = M[r][c] / M[c][c]
                M[r] = [a - f * b for a, b in zip(M[r], M[c])]
    return [M[i][n] / M[i][i] for i in range(n)]

def kl(p, q):
    return sum(a * math.log(a / b) for a, b in zip(p, q) if a > 0)

print([[round(x, 4) for x in row] for row in fisher([0.2, 0.8], [[0.8], [-0.2]])], natural_gradient([[2.0, 0.0], [0.0, 0.5]], [1.0, 1.0]), natural_gradient([[2.0, 0.0], [0.0, 0.5]], [1.0, 1.0], 0.5))
print(natural_gradient([[0.0, 1.0], [1.0, 0.0]], [3.0, 5.0]), kl([0.5, 0.5], [0.5, 0.5]), round(kl([1.0, 0.0], [0.5, 0.5]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.16]] [0.5, 2.0] [0.4, 1.0]\n[5.0, 3.0] 0.0 0.6931",
          "[[0.16]] [2.0, 0.5] [0.4, 1.0]\n[5.0, 3.0] 0.0 0.6931",
          "[[0.16]] [0.5, 2.0] [0.4, 1.0]\n[3.0, 5.0] 0.0 0.6931",
          "[[0.68]] [0.5, 2.0] [0.5, 2.5]\n[5.0, 3.0] 0.0 0.3466",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def gaussian_fisher(sigma):
    return [[1 / sigma ** 2, 0.0], [0.0, 2 / sigma ** 2]]

def kl_gaussian(mu1, s1, mu2, s2):
    return math.log(s2 / s1) + (s1 ** 2 + (mu1 - mu2) ** 2) / (2 * s2 ** 2) - 0.5

def natural_gaussian_step(mu, sigma, g_mu, g_sigma, alpha):
    return mu + alpha * sigma ** 2 * g_mu, sigma + alpha * sigma ** 2 / 2 * g_sigma

print(gaussian_fisher(2.0), kl_gaussian(0.0, 1.0, 1.0, 1.0), round(kl_gaussian(0.0, 1.0, 0.0, 2.0), 4))
print(natural_gaussian_step(0.0, 2.0, 1.0, 1.0, 0.5), natural_gaussian_step(1.0, 1.0, -2.0, 0.0, 0.25))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.25, 0.0], [0.0, 0.5]] 0.5 0.3181\n(2.0, 3.0) (0.5, 1.0)",
          "[[0.25, 0.0], [0.0, 0.5]] 0.5 0.3181\n(2.0, 4.0) (0.5, 1.0)",
          "[[4.0, 0.0], [0.0, 8.0]] 0.5 0.3181\n(2.0, 3.0) (0.5, 1.0)",
          "[[0.25, 0.0], [0.0, 0.5]] 1.0 0.6931\n(2.0, 3.0) (1.5, 1.0)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fisher(probs, scores)</C>; <C>natural_gradient(F, g, damping=0.0)</C>, solving <M>{"(F + \\lambda I)x = g"}</M> by
          Gaussian elimination with partial pivoting; and <C>kl(p, q)</C> for categorical distributions, skipping zero entries
          of p.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def fisher(probs, scores):
    return [[0.0]]

def natural_gradient(F, g, damping=0.0):
    return list(g)

def kl(p, q):
    return 0.0
`,
        solution: FISHER,
        tests: [
          { name: "fisher", code: `F = fisher([0.2, 0.8], [[0.8], [-0.2]])
assert len(F) == 1 and abs(F[0][0] - 0.16) < 1e-12
F2 = fisher([0.5, 0.3, 0.2], [[0.5, -0.3, -0.2], [-0.5, 0.7, -0.2], [-0.5, -0.3, 0.8]])
assert all(abs(F2[i][j] - ((0.5, 0.3, 0.2)[i] * (i == j) - (0.5, 0.3, 0.2)[i] * (0.5, 0.3, 0.2)[j])) < 1e-12 for i in range(3) for j in range(3))
assert abs(kl([1.0, 0.0], [0.5, 0.5]) - math.log(2)) < 1e-12 and kl([0.3, 0.7], [0.3, 0.7]) == 0 and kl([0.5, 0.5], [0.9, 0.1]) > 0` },
          { name: "solve", code: `close = lambda u, v: all(abs(a - b) < 1e-9 for a, b in zip(u, v))
assert close(natural_gradient([[2.0, 0.0], [0.0, 0.5]], [1.0, 1.0]), [0.5, 2.0]) and close(natural_gradient([[2.0, 0.0], [0.0, 0.5]], [1.0, 1.0], 0.5), [0.4, 1.0])
assert close(natural_gradient([[0.0, 1.0], [1.0, 0.0]], [3.0, 5.0]), [5.0, 3.0])
F, x = [[4.0, 1.0, 0.0], [1.0, 3.0, 1.0], [0.0, 1.0, 2.0]], [1.0, -2.0, 0.5]
g = [sum(F[i][j] * x[j] for j in range(3)) for i in range(3)]
assert close(natural_gradient(F, g), x) and F == [[4.0, 1.0, 0.0], [1.0, 3.0, 1.0], [0.0, 1.0, 2.0]]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For a Gaussian policy, write <C>gaussian_fisher(sigma)</C> in the parameters (μ, σ); <C>kl_gaussian(mu1, s1, mu2, s2)</C>, the
          divergence of the second distribution from the first; and <C>natural_gaussian_step(mu, sigma, g_mu, g_sigma, alpha)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def gaussian_fisher(sigma):
    return [[1.0, 0.0], [0.0, 1.0]]

def kl_gaussian(mu1, s1, mu2, s2):
    return 0.0

def natural_gaussian_step(mu, sigma, g_mu, g_sigma, alpha):
    return mu + alpha * g_mu, sigma + alpha * g_sigma
`,
        solution: GAUSS,
        tests: [
          { name: "kl", code: `assert gaussian_fisher(2.0) == [[0.25, 0.0], [0.0, 0.5]] and gaussian_fisher(0.5) == [[4.0, 0.0], [0.0, 8.0]]
assert abs(kl_gaussian(0.0, 1.0, 1.0, 1.0) - 0.5) < 1e-12 and abs(kl_gaussian(0.0, 1.0, 0.0, 2.0) - (math.log(2) - 0.375)) < 1e-12 and kl_gaussian(1.0, 2.0, 1.0, 2.0) == 0
mu, s, d = 0.3, 1.5, 1e-3
assert abs(kl_gaussian(mu, s, mu + d, s + d) - 0.5 * (d * d / s ** 2 + 2 * d * d / s ** 2)) < 1e-8` },
          { name: "step", code: `assert natural_gaussian_step(0.0, 2.0, 1.0, 1.0, 0.5) == (2.0, 3.0) and natural_gaussian_step(1.0, 1.0, -2.0, 0.0, 0.25) == (0.5, 1.0)
m, s = natural_gaussian_step(0.0, 0.1, 1.0, 1.0, 1.0)
assert abs(m - 0.01) < 1e-12 and abs(s - 0.105) < 1e-12` },
        ],
      },
    },
    {
      key: "trust",
      rung: "stretch",
      prompt: (
        <p>
          For a logistic policy at p = σ(θ) = 0.2, how large a change in θ makes the quadratic estimate{" "}
          <M>{"\\tfrac12F\\,\\delta\\theta^2"}</M> of the KL divergence equal to 0.01? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.3536, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        The natural gradient says which direction to go and, through ε, how far. But the KL estimate is only quadratic, and
        the improvement only first order, so a step can still overshoot. TRPO (l6.7.2) bounds the true improvement, takes the
        natural step with conjugate gradient, and checks it with a line search.
      </p>
    </>
  ),
};
