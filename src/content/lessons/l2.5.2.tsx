import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EmStepViz } from "@/components/viz/EmStepViz";
import type { LessonContent } from "@/lib/types";

const EM = `import numpy as np

def e_step(x, pis, mus, sds):
    logp = np.array([np.log(p) - 0.5 * ((x - m) / s) ** 2 - np.log(s) for p, m, s in zip(pis, mus, sds)])
    R = np.exp(logp - logp.max(axis=0))
    return R / R.sum(axis=0)

def m_step(x, R):
    Nk = R.sum(axis=1)
    mus = (R @ x) / Nk
    sds = np.sqrt((R * (x[None, :] - mus[:, None]) ** 2).sum(axis=1) / Nk)
    return Nk / len(x), mus, sds

def em(x, pis, mus, sds, iters):
    for _ in range(iters):
        pis, mus, sds = m_step(x, e_step(x, pis, mus, sds))
    return pis, mus, sds`;

const KM = `import numpy as np

def loglik(x, pis, mus, sds):
    dens = sum(p * np.exp(-0.5 * ((x - m) / s) ** 2) / (s * np.sqrt(2 * np.pi)) for p, m, s in zip(pis, mus, sds))
    return float(np.log(dens).sum())

def hard_assign(x, mus):
    return np.argmin(np.abs(x[None, :] - np.asarray(mus)[:, None]), axis=0)

def kmeans_1d(x, mus, iters):
    mus = np.array(mus, dtype=float)
    for _ in range(iters):
        z = hard_assign(x, mus)
        mus = np.array([x[z == k].mean() for k in range(len(mus))])
    return mus`;

export const lesson: LessonContent = {
  id: "l2.5.2",
  minutes: 60,
  links: {
    requires: ["l2.5.1", "m7.4.2"],
    revisits: ["l1.6.1", "m9.2.2"],
    foreshadows: ["l2.5.3", "l2.5.4"],
  },

  puzzle: (
    <>
      <p>
        Fitting a mixture is a chicken-and-egg problem. If you knew which component produced each point, you would fit each
        Gaussian to its own points. If you knew the Gaussians, you would know how likely each point is to belong to each.
        Alternating between the two guesses sounds like a heuristic that might wander forever. Why does it reliably climb
        the likelihood?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        At the current parameters, build a lower bound on the log-likelihood that touches it exactly there, using the
        responsibilities as weights. The lower bound is easy to maximise: it is a weighted version of the fully observed
        problem. Moving to its maximum raises the bound, and because the bound sits below the true log-likelihood and
        touched it at the old point, the true log-likelihood rises at least as much.
      </p>
      <EmStepViz />
    </>
  ),

  theory: (
    <>
      <Definition title="EM for a Gaussian mixture">
        <p>Repeat until the log-likelihood stops changing:</p>
        <ul>
          <li>
            E-step: <M>{"r_{ik} = \\pi_kN(x_i; \\mu_k, \\sigma_k^2)\\big/\\sum_j\\pi_jN(x_i; \\mu_j, \\sigma_j^2)"}</M> at the
            current parameters;
          </li>
          <li>
            M-step: with <M>{"N_k = \\sum_i r_{ik}"}</M>, set <M>{"\\pi_k = N_k/n"}</M>,{" "}
            <M>{"\\mu_k = \\sum_i r_{ik}x_i/N_k"}</M> and <M>{"\\sigma_k^2 = \\sum_i r_{ik}(x_i - \\mu_k)^2/N_k"}</M>.
          </li>
        </ul>
      </Definition>

      <Theorem title="the M-step maximises the expected complete-data log-likelihood">
        <p>
          For fixed responsibilities, the M-step parameters maximise{" "}
          <M>{"Q(\\theta) = \\sum_i\\sum_k r_{ik}\\big[\\log\\pi_k + \\log N(x_i; \\mu_k, \\sigma_k^2)\\big]"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Q separates. The terms in <M>{"\\mu_k, \\sigma_k"}</M> are a weighted Gaussian log-likelihood with weights{" "}
          <M>{"r_{ik}"}</M>, maximised by the weighted mean and weighted variance exactly as in the unweighted case. The
          terms in π are <M>{"\\sum_k N_k\\log\\pi_k"}</M> subject to <M>{"\\sum_k\\pi_k = 1"}</M>; a Lagrange multiplier gives{" "}
          <M>{"N_k/\\pi_k = \\lambda"}</M>, and summing gives λ = n.
        </p>
        <Code>{EM}</Code>
      </Proof>

      <Theorem title="EM never decreases the likelihood">
        <p>
          If <M>{"\\theta'"}</M> is obtained from θ by one E-step and one M-step, then{" "}
          <M>{"\\ell(\\theta') \\geq \\ell(\\theta)"}</M>, where <M>{"\\ell(\\theta) = \\sum_i\\log p(x_i \\mid \\theta)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For any distributions <M>{"q_i"}</M> over components with positive entries, Jensen&apos;s inequality for the
          concave log gives
        </p>
        <MD>{"\\log p(x_i \\mid \\phi) = \\log\\sum_k q_{ik}\\frac{p(x_i, k \\mid \\phi)}{q_{ik}} \\geq \\sum_k q_{ik}\\log\\frac{p(x_i, k \\mid \\phi)}{q_{ik}}"}</MD>
        <p>
          for every φ. Call the sum of the right-hand sides B(φ; q). With <M>{"q_{ik} = r_{ik}"}</M> computed at θ, the ratio{" "}
          <M>{"p(x_i, k \\mid \\theta)/r_{ik} = p(x_i \\mid \\theta)"}</M> does not depend on k, so the inequality is an
          equality at φ = θ: <M>{"B(\\theta; r) = \\ell(\\theta)"}</M>. B(φ; r) differs from Q(φ) by a term free of φ, so
          the M-step maximises B. Hence{" "}
          <M>{"\\ell(\\theta') \\geq B(\\theta'; r) \\geq B(\\theta; r) = \\ell(\\theta)"}</M>.
        </p>
      </Proof>
      <Example title="watching it climb">
        <p>
          On 500 points from 0.4·N(−2, 0.7²) + 0.6·N(2, 1), starting from means ±1 and unit variances, the log-likelihood over
          the first iterations is −1256.7, −978.9, −959.6, −953.4, −951.1, −950.4: always up, with shrinking steps. After 100
          iterations the estimates are weights 0.36 and 0.64, means −2.08 and 2.05, and standard deviations 0.62 and 1.03.
        </p>
      </Example>

      <Remark title="local maxima, and k-means as a limit">
        <p>
          Monotone does not mean global: EM converges to a stationary point that depends on the start, so practical code
          runs several starts, often seeded by k-means, and keeps the best. Convergence can be slow when components overlap.
          If all components share a variance σ² that is driven to 0, each responsibility becomes 1 for the nearest mean and 0
          otherwise, and EM turns into k-means: hard assignment, then means of the assigned points.
        </p>
        <Code>{KM}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "pi",
      rung: "check",
      prompt: <p>The responsibilities of component 1 for four points are 0.9, 0.8, 0.2 and 0.1. What is its updated weight π₁?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "mu",
      rung: "check",
      prompt: <p>With those responsibilities and data 0, 1, 4, 5, what is the updated mean μ₁?</p>,
      answer: { kind: "numeric", value: 1.05, tolerance: 0.0001 },
    },
    {
      key: "guar",
      rung: "apply",
      prompt: <p>What does EM guarantee?</p>,
      answer: {
        kind: "choice",
        options: [
          "The log-likelihood never decreases from one iteration to the next",
          "It always finds the global maximum of the likelihood",
          "It converges in at most K iterations",
          "The responsibilities become exactly 0 or 1",
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

def e_step(x, pis, mus, sds):
    logp = np.array([np.log(p) - 0.5 * ((x - m) / s) ** 2 - np.log(s) for p, m, s in zip(pis, mus, sds)])
    R = np.exp(logp - logp.max(axis=0))
    return R / R.sum(axis=0)

def m_step(x, R):
    Nk = R.sum(axis=1)
    mus = (R @ x) / Nk
    sds = np.sqrt((R * (x[None, :] - mus[:, None]) ** 2).sum(axis=1) / Nk)
    return Nk / len(x), mus, sds

def em(x, pis, mus, sds, iters):
    for _ in range(iters):
        pis, mus, sds = m_step(x, e_step(x, pis, mus, sds))
    return pis, mus, sds

rng = np.random.default_rng(0); z = rng.random(500) < 0.4
x = np.where(z, rng.normal(-2, 0.7, 500), rng.normal(2, 1.0, 500))
pis, mus, sds = em(x, [0.5, 0.5], [-1.0, 1.0], [1.0, 1.0], 100)
print(np.round(pis, 2), np.round(mus, 2), np.round(sds, 2))
p, m, s = m_step(np.array([0.0, 2.0, 5.0]), np.array([[1.0, 1.0, 0.0], [0.0, 0.0, 1.0]]))
print(np.round(p, 3), m, s)`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.36 0.64] [-2.08  2.05] [0.62 1.03]\n[0.667 0.333] [1. 5.] [1. 0.]", "[0.5 0.5] [-1.  1.] [1. 1.]\n[0.667 0.333] [1. 5.] [1. 0.]", "[0.36 0.64] [-2.08  2.05] [0.62 1.03]\n[0.5 0.5] [1. 5.] [1. 0.]", "[0.36 0.64] [-2.08  2.05] [0.62 1.03]\n[0.667 0.333] [1. 5.] [1.414 0.   ]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def loglik(x, pis, mus, sds):
    dens = sum(p * np.exp(-0.5 * ((x - m) / s) ** 2) / (s * np.sqrt(2 * np.pi)) for p, m, s in zip(pis, mus, sds))
    return float(np.log(dens).sum())

def hard_assign(x, mus):
    return np.argmin(np.abs(x[None, :] - np.asarray(mus)[:, None]), axis=0)

def kmeans_1d(x, mus, iters):
    mus = np.array(mus, dtype=float)
    for _ in range(iters):
        z = hard_assign(x, mus)
        mus = np.array([x[z == k].mean() for k in range(len(mus))])
    return mus

x = np.array([-2.1, -1.9, -2.0, 1.0, 3.0, 2.0])
print(kmeans_1d(x, [0.0, 0.5], 10), hard_assign(x, [-2.0, 2.0]))
print(round(loglik(x, [0.5, 0.5], [-2.0, 2.0], [0.1, 1.0]), 2), round(loglik(x, [0.5, 0.5], [0.0, 0.0], [2.0, 2.0]), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[-2.  2.] [0 0 0 1 1 1]\n-4.76 -12.93", "[0.  0.5] [0 0 0 1 1 1]\n-4.76 -12.93", "[-2.  2.] [0 0 0 1 1 1]\n-12.93 -4.76", "[-2.  2.] [1 1 1 0 0 0]\n-4.76 -12.93"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>e_step(x, pis, mus, sds)</C>, returning the (K, n) responsibilities computed in log space,{" "}
          <C>m_step(x, R)</C>, returning the new weights, means and standard deviations, and{" "}
          <C>em(x, pis, mus, sds, iters)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def e_step(x, pis, mus, sds):
    return np.full((len(pis), len(x)), 1 / len(pis))

def m_step(x, R):
    K = R.shape[0]
    return np.full(K, 1 / K), np.zeros(K), np.ones(K)

def em(x, pis, mus, sds, iters):
    return pis, mus, sds
`,
        solution: EM,
        tests: [
          { name: "steps", code: `x = np.array([0.0, 1.0, 4.0, 5.0]); R = np.array([[0.9, 0.8, 0.2, 0.1], [0.1, 0.2, 0.8, 0.9]])
p, m, s = m_step(x, R)
assert np.allclose(p, [0.5, 0.5]) and np.allclose(m, [1.05, 3.95]) and abs(s[0] ** 2 - 2.1475) < 1e-9 and np.allclose(e_step(np.array([0.0]), [0.3, 0.7], [-2.0, 2.0], [1.0, 1.0])[:, 0], [0.3, 0.7])` },
          { name: "em", code: `rng = np.random.default_rng(3); x = np.r_[rng.normal(-5, 1, 300), rng.normal(5, 1, 300)]
p, m, s = em(x, [0.5, 0.5], [-1.0, 1.0], [2.0, 2.0], 50)
assert np.allclose(sorted(m), [-5, 5], atol=0.2) and np.allclose(p, 0.5, atol=0.02)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>loglik(x, pis, mus, sds)</C> for a one-dimensional mixture, <C>hard_assign(x, mus)</C>, the index of the
          nearest mean for each point, and <C>kmeans_1d(x, mus, iters)</C>, alternating hard assignment and mean updates.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def loglik(x, pis, mus, sds):
    return 0.0

def hard_assign(x, mus):
    return np.zeros(len(x), dtype=int)

def kmeans_1d(x, mus, iters):
    return np.array(mus, dtype=float)
`,
        solution: KM,
        tests: [
          { name: "ll", code: `assert abs(loglik(np.array([0.0]), [1.0], [0.0], [1.0]) + 0.5 * np.log(2 * np.pi)) < 1e-12` },
          { name: "km", code: `x = np.array([0.0, 1.0, 9.0, 11.0])
assert list(hard_assign(x, [0.0, 10.0])) == [0, 0, 1, 1] and np.allclose(kmeans_1d(x, [0.0, 1.0], 5), [0.5, 10.0])` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that one iteration of EM (E-step then M-step) never decreases the log-likelihood of a mixture model.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Uses Jensen's inequality to show that for any distribution q over components, log p(x | φ) ≥ Σ_k q_k log(p(x, k | φ)/q_k) for every φ.",
          "Shows that with q equal to the responsibilities at the current θ the bound is an equality at φ = θ.",
          "Argues the M-step maximises this bound over φ, so ℓ(θ′) ≥ B(θ′) ≥ B(θ) = ℓ(θ).",
        ],
      },
    },
    {
      key: "var",
      rung: "stretch",
      prompt: <p>With responsibilities 0.9, 0.8, 0.2, 0.1 for data 0, 1, 4, 5, what is the updated variance σ₁²? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 2.1475, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend the E-step and M-step of EM for a Gaussian mixture, why the M-step formulas are weighted maximum-likelihood estimates, why the log-likelihood never decreases, and how k-means arises as a limit.",

  glimpse: (
    <>
      <p>
        The lower bound in the proof has a name, the evidence lower bound, and a decomposition: log-likelihood minus a KL
        divergence. The next lesson makes it the central object, which leads to variational inference when the exact
        posterior is out of reach.
      </p>
    </>
  ),
};
