import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MixtureViz } from "@/components/viz/MixtureViz";
import type { LessonContent } from "@/lib/types";

const MIX = `import numpy as np

def normal_pdf(x, mu, s):
    return np.exp(-0.5 * ((x - mu) / s) ** 2) / (s * np.sqrt(2 * np.pi))

def mixture_pdf(x, pis, mus, sds):
    return sum(p * normal_pdf(x, m, s) for p, m, s in zip(pis, mus, sds))

def responsibilities(x, pis, mus, sds):
    num = np.array([p * normal_pdf(x, m, s) for p, m, s in zip(pis, mus, sds)])
    return num / num.sum(axis=0)`;

const SAMP = `import numpy as np

def sample_mixture(n, pis, mus, sds, seed=0):
    rng = np.random.default_rng(seed)
    z = rng.choice(len(pis), size=n, p=pis)
    return rng.normal(np.asarray(mus)[z], np.asarray(sds)[z]), z

def mixture_loglik(x, pis, mus, sds):
    logs = np.array([np.log(p) - 0.5 * ((x - m) / s) ** 2 - np.log(s * np.sqrt(2 * np.pi))
                     for p, m, s in zip(pis, mus, sds)])
    mx = logs.max(axis=0)
    return float(np.sum(mx + np.log(np.exp(logs - mx).sum(axis=0))))`;

export const lesson: LessonContent = {
  id: "l2.5.1",
  minutes: 50,
  links: {
    requires: ["l2.1.1", "m7.5.4", "l1.6.1"],
    revisits: ["m7.1.4", "l2.2.3"],
    foreshadows: ["l2.5.2"],
  },

  puzzle: (
    <>
      <p>
        The heights of adults in a survey form a histogram with a single broad hump, a little flat on top. You suspect it
        is two overlapping bell curves, one per sex, but the sex column is missing. Can you recover the two curves, their
        proportions and, for each person, how likely they are to belong to each group? And why does maximising the
        likelihood naively lead to nonsense?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A mixture model tells a two-step story: first pick a component at random with fixed probabilities, then draw the
        point from that component. The component is a hidden variable. Given a point, Bayes&apos; rule turns the story
        around into soft memberships, the responsibilities, which play the role that hard cluster assignments play in
        k-means.
      </p>
      <MixtureViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Gaussian mixture model">
        <p>
          With weights <M>{"\\pi_1, \\dots, \\pi_K \\geq 0"}</M> summing to 1, draw <M>{"z \\sim \\mathrm{Categorical}(\\pi)"}</M>{" "}
          and then <M>{"x \\mid z = k \\sim N(\\mu_k, \\Sigma_k)"}</M>. Summing out z, the density of x is
        </p>
        <MD>{"p(x) = \\sum_{k=1}^K \\pi_k\\, N(x; \\mu_k, \\Sigma_k)."}</MD>
      </Definition>

      <Theorem title="responsibilities">
        <p>The posterior probability that x came from component k is</p>
        <MD>{"r_k(x) = P(z = k \\mid x) = \\frac{\\pi_kN(x; \\mu_k, \\Sigma_k)}{\\sum_j \\pi_jN(x; \\mu_j, \\Sigma_j)}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Bayes&apos; rule: <M>{"P(z = k \\mid x) = P(z = k)p(x \\mid z = k)/p(x)"}</M>, with the prior <M>{"\\pi_k"}</M>, the
          component density, and p(x) from the definition. With a shared covariance the log ratio of two numerators is
          linear in x, so the responsibilities are a softmax of linear functions, the same form as the posterior in the
          Gaussian-classes derivation of logistic regression; the difference is that here the labels are never observed.
        </p>
        <Code>{MIX}</Code>
      </Proof>

      <Example title="the log-likelihood">
        <p>
          For data <M>{"x_1, \\dots, x_n"}</M>, the log-likelihood is <M>{"\\sum_i \\log\\sum_k \\pi_kN(x_i; \\mu_k, \\Sigma_k)"}</M>.
          The log of a sum does not split into separate terms per component, so setting gradients to zero gives coupled
          equations with no closed-form solution. Computing it needs the log-sum-exp trick, since component densities far
          from a point underflow.
        </p>
        <Code>{SAMP}</Code>
      </Example>

      <Theorem title="the likelihood is unbounded">
        <p>
          For a one-dimensional mixture with K ≥ 2 and free variances, the log-likelihood of any dataset with at least two
          distinct points has supremum +∞.
        </p>
      </Theorem>
      <Proof>
        <p>
          Put <M>{"\\mu_1 = x_1"}</M>, keep <M>{"\\pi_1 = \\pi_2 = \\tfrac12"}</M>, and fix component 2 at any mean and
          variance, say <M>{"N(0, 1)"}</M>. For every point, the inner sum is at least its component-2 term, so{" "}
          <M>{"\\log p(x_i) \\geq \\log(\\tfrac12N(x_i; 0, 1))"}</M>, a finite constant not depending on{" "}
          <M>{"\\sigma_1"}</M>. For <M>{"x_1"}</M> the inner sum is also at least{" "}
          <M>{"\\tfrac12N(x_1; x_1, \\sigma_1) = \\tfrac12(\\sigma_1\\sqrt{2\\pi})^{-1}"}</M>, whose log tends to +∞ as{" "}
          <M>{"\\sigma_1 \\to 0"}</M>. Adding the bounds, the log-likelihood tends to +∞.
        </p>
      </Proof>
      <Remark title="what to do about it, and label switching">
        <p>
          The useful estimate is a local maximum in the interior, not the global supremum. In practice one puts a floor
          under the variances, adds a small prior on them, or restarts when a component collapses onto a point. Separately,
          permuting the component labels leaves the likelihood unchanged, so every maximum comes with K! copies. This
          does not matter for density estimation or clustering, but it means &quot;component 1&quot; has no meaning across
          different runs.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dens",
      rung: "check",
      prompt: <p>A mixture puts weight ½ on N(−1, 1) and ½ on N(1, 1). What is its density at x = 0? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.242, tolerance: 0.0001 },
    },
    {
      key: "resp",
      rung: "check",
      prompt: <p>Weights 0.3 and 0.7, means −2 and 2, both variances 1. What is the responsibility of the first component at x = 0?</p>,
      answer: { kind: "numeric", value: 0.3, tolerance: 0.0001 },
    },
    {
      key: "closed",
      rung: "apply",
      prompt: <p>Why is there no closed-form maximum-likelihood estimate for a Gaussian mixture?</p>,
      answer: {
        kind: "choice",
        options: [
          "The log-likelihood contains the log of a sum over components, which couples the parameters",
          "Gaussian densities have no derivative with respect to their mean",
          "The number of data points must equal the number of components",
          "The weights must be integers",
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

def normal_pdf(x, mu, s):
    return np.exp(-0.5 * ((x - mu) / s) ** 2) / (s * np.sqrt(2 * np.pi))

def mixture_pdf(x, pis, mus, sds):
    return sum(p * normal_pdf(x, m, s) for p, m, s in zip(pis, mus, sds))

def responsibilities(x, pis, mus, sds):
    num = np.array([p * normal_pdf(x, m, s) for p, m, s in zip(pis, mus, sds)])
    return num / num.sum(axis=0)

P = ([0.3, 0.7], [-2.0, 2.0], [1.0, 1.0]); xs = np.array([-2.0, 0.0, 2.0])
print(np.round(mixture_pdf(xs, *P), 4))
print(np.round(responsibilities(xs, *P), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.1198 0.054  0.2793]\n[[0.999 0.3   0.   ]\n [0.001 0.7   1.   ]]", "[0.1198 0.054  0.2793]\n[[0.999 0.5   0.   ]\n [0.001 0.5   1.   ]]", "[0.3989 0.054  0.3989]\n[[0.999 0.3   0.   ]\n [0.001 0.7   1.   ]]", "[0.1198 0.054  0.2793]\n[[0.3 0.3 0.3]\n [0.7 0.7 0.7]]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def sample_mixture(n, pis, mus, sds, seed=0):
    rng = np.random.default_rng(seed)
    z = rng.choice(len(pis), size=n, p=pis)
    return rng.normal(np.asarray(mus)[z], np.asarray(sds)[z]), z

def mixture_loglik(x, pis, mus, sds):
    logs = np.array([np.log(p) - 0.5 * ((x - m) / s) ** 2 - np.log(s * np.sqrt(2 * np.pi))
                     for p, m, s in zip(pis, mus, sds)])
    mx = logs.max(axis=0)
    return float(np.sum(mx + np.log(np.exp(logs - mx).sum(axis=0))))

P = ([0.3, 0.7], [-2.0, 2.0], [1.0, 1.0]); xs = np.array([-2.0, 0.0, 2.0])
x, z = sample_mixture(10000, *P)
print(round(float(np.mean(z == 0)), 2), round(float(x.mean()), 2), round(mixture_loglik(x, *P) / len(x), 3))
print([round(mixture_loglik(x[:50], [0.5, 0.5], [x[0], 0.0], [s, 2.0]), 1) for s in (1.0, 1e-10, 1e-100)])`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.3 0.8 -1.969\n[-100.0, -122.8, 84.4]", "0.7 -0.8 -1.969\n[-100.0, -122.8, 84.4]", "0.3 0.8 -1.969\n[-100.0, -122.8, -230.3]", "0.3 0.0 -1.969\n[-100.0, -122.8, 84.4]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For one-dimensional data, write <C>normal_pdf(x, mu, s)</C>, <C>mixture_pdf(x, pis, mus, sds)</C> and{" "}
          <C>responsibilities(x, pis, mus, sds)</C>, the last returning an array of shape (K, len(x)) whose columns sum to 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def normal_pdf(x, mu, s):
    return np.zeros_like(x)

def mixture_pdf(x, pis, mus, sds):
    return np.zeros_like(x)

def responsibilities(x, pis, mus, sds):
    return np.zeros((len(pis), len(x)))
`,
        solution: MIX,
        tests: [
          { name: "pdf", code: `x = np.array([0.0])
assert np.allclose(normal_pdf(x, 0.0, 1.0), [1 / np.sqrt(2 * np.pi)]) and np.allclose(mixture_pdf(x, [0.5, 0.5], [-1.0, 1.0], [1.0, 1.0]), normal_pdf(x, 1.0, 1.0))` },
          { name: "resp", code: `R = responsibilities(np.array([0.0, 5.0]), [0.25, 0.75], [-1.0, 1.0], [1.0, 1.0])
assert R.shape == (2, 2) and np.allclose(R.sum(axis=0), 1) and np.allclose(R[0, 0], 0.25) and R[1, 1] > 0.999` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sample_mixture(n, pis, mus, sds, seed=0)</C>, returning samples and their component labels, and{" "}
          <C>mixture_loglik(x, pis, mus, sds)</C>, the total log-likelihood computed stably with log-sum-exp, as a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sample_mixture(n, pis, mus, sds, seed=0):
    return np.zeros(n), np.zeros(n, dtype=int)

def mixture_loglik(x, pis, mus, sds):
    return 0.0
`,
        solution: SAMP,
        tests: [
          { name: "sample", code: `x, z = sample_mixture(20000, [0.2, 0.8], [0.0, 10.0], [1.0, 1.0])
assert abs(np.mean(z == 0) - 0.2) < 0.02 and abs(x[z == 1].mean() - 10) < 0.05` },
          { name: "ll", code: `x = np.array([0.0, 1.0])
assert abs(mixture_loglik(x, [1.0], [0.0], [1.0]) - (-np.log(2 * np.pi) - 0.5)) < 1e-12 and np.isfinite(mixture_loglik(np.array([1000.0]), [0.5, 0.5], [0.0, 1.0], [1.0, 1.0]))` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that for a one-dimensional mixture of two Gaussians with free variances, the log-likelihood of a dataset x₁, …, xₙ can be made arbitrarily large.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Places one component's mean at a data point x₁ and fixes the other component with positive weight at finite parameters.",
          "Bounds every point's log-density below by the log of the fixed component's contribution, a finite constant independent of σ₁.",
          "Shows the extra contribution at x₁ is at least log(π₁/(σ₁√(2π))), which tends to +∞ as σ₁ → 0, so the total does too.",
        ],
      },
    },
    {
      key: "perm",
      rung: "stretch",
      prompt: <p>A mixture with 4 distinct components has how many parameter settings that give exactly the same likelihood by relabelling?</p>,
      answer: { kind: "numeric", value: 24, tolerance: 0.001 },
    },
  ],

  teachBack:
    "Explain to a friend the generative story of a Gaussian mixture, how responsibilities follow from Bayes' rule, why the likelihood has no closed-form maximiser and is unbounded with free variances, and what label switching means.",

  glimpse: (
    <>
      <p>
        If we knew which component produced each point, fitting would be easy: one Gaussian per group. If we knew the
        parameters, the responsibilities would be easy. Expectation-maximisation alternates between the two, and the next
        lesson proves that each round can only increase the likelihood.
      </p>
    </>
  ),
};
