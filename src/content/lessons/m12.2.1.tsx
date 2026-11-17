import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { KlFitViz } from "@/components/viz/KlFitViz";
import type { LessonContent } from "@/lib/types";

const KL = `import numpy as np

def kl(p, q):
    p, q = np.asarray(p, dtype=float), np.asarray(q, dtype=float); m = p > 0
    if np.any(q[m] == 0):
        return float("inf")
    return float(np.sum(p[m] * np.log2(p[m] / q[m])))

def gauss_kl(m1, s1, m2, s2):
    return float(np.log(s2 / s1) + (s1 ** 2 + (m1 - m2) ** 2) / (2 * s2 ** 2) - 0.5)

def mc_kl(logp, logq, x):
    lr = logq(x) - logp(x)
    return float(np.mean(-lr)), float(np.mean(np.exp(lr) - 1 - lr))`;

const FT = `import numpy as np

GRID = np.linspace(-8, 8, 1601); DX = GRID[1] - GRID[0]

def normal_pdf(x, m, s):
    return np.exp(-0.5 * ((x - m) / s) ** 2) / (s * np.sqrt(2 * np.pi))

def kl_grid(p, q):
    m = p > 1e-300
    return float(np.sum(p[m] * np.log(p[m] / np.maximum(q[m], 1e-300))) * DX)

def fit_gaussian(p, reverse):
    best = None
    for m in np.linspace(-4, 4, 81):
        for s in np.linspace(0.2, 4, 39):
            q = normal_pdf(GRID, m, s)
            d = kl_grid(q, p) if reverse else kl_grid(p, q)
            if best is None or d < best[0]:
                best = (d, m, s)
    return round(float(best[1]), 2) + 0.0, round(float(best[2]), 2)`;

export const lesson: LessonContent = {
  id: "m12.2.1",
  minutes: 50,
  links: {
    requires: ["m12.1.4", "m7.4.2"],
    revisits: ["m7.3.2"],
    foreshadows: ["m12.2.2", "m12.2.5", "l9.4.1"],
  },

  puzzle: (
    <>
      <p>
        You fit a single bell curve to data that actually has two well-separated bumps. One reasonable recipe gives a wide
        curve straddling both bumps, putting most of its mass in the empty valley between them. Another, equally reasonable,
        gives a narrow curve sitting on one bump and ignoring the other entirely. Both recipes minimise &quot;the KL divergence
        between the data and the model&quot;. How can the same quantity give such different answers, and which one is your
        favourite training method secretly using?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The KL divergence D(p‖q) is the average extra surprise you suffer if outcomes really come from p but you predict
        them with q. It is never negative and is zero only when q = p, so it behaves like a distance, except that it is not
        symmetric. D(p‖q) punishes q for missing places where p has mass, so minimising it over q spreads q out to cover
        everything. D(q‖p) punishes q for putting mass where p has none, so minimising it shrinks q onto one safe region.
        Maximum likelihood minimises the first; variational inference and many policy penalties use the second.
      </p>
      <KlFitViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the Kullback–Leibler divergence">
        <p>For distributions p and q on the same set,</p>
        <MD>{"D(p\\,\\|\\,q) = \\sum_x p(x)\\log\\frac{p(x)}{q(x)} = \\mathbb{E}_{X \\sim p}\\left[\\log\\frac{p(X)}{q(X)}\\right],"}</MD>
        <p>
          in bits with <M>{"\\log_2"}</M> or nats with ln, with <M>{"0\\log(0/q) = 0"}</M> and{" "}
          <M>{"p\\log(p/0) = \\infty"}</M> for p &gt; 0. For densities the sum becomes an integral.
        </p>
      </Definition>

      <Theorem title="Gibbs' inequality">
        <p>
          <M>{"D(p\\,\\|\\,q) \\ge 0"}</M>, with equality if and only if p = q.
        </p>
      </Theorem>
      <Proof>
        <p>If q(x) = 0 for some x with p(x) &gt; 0 the divergence is ∞. Otherwise, by Jensen&apos;s inequality for the concave log,</p>
        <MD>{"-D(p\\,\\|\\,q) = \\sum_{p(x) > 0} p(x)\\log\\frac{q(x)}{p(x)} \\le \\log\\sum_{p(x) > 0} q(x) \\le \\log 1 = 0."}</MD>
        <p>
          Equality needs q/p constant on the support of p and q to put no mass outside it; the constant is then 1, so q = p.
        </p>
      </Proof>

      <Remark title="extra bits, asymmetry and infinity">
        <p>
          If you encode outcomes from p with codewords of length <M>{"-\\log_2 q(x)"}</M>, the average length is{" "}
          <M>{"\\sum p(x)(-\\log_2 q(x)) = H(p) + D(p\\,\\|\\,q)"}</M>: the divergence is exactly the waste caused by the wrong
          model. It is not a metric. In the code, D(½, ½ ‖ 0.9, 0.1) = 0.737 bits but the reverse is 0.531, and a model that
          gives probability 0 to something that happens has infinite divergence, however good it is elsewhere.
        </p>
      </Remark>

      <Theorem title="KL between Gaussians">
        <p>In nats,</p>
        <MD>{"D\\big(N(\\mu_1, \\sigma_1^2)\\,\\|\\,N(\\mu_2, \\sigma_2^2)\\big) = \\log\\frac{\\sigma_2}{\\sigma_1} + \\frac{\\sigma_1^2 + (\\mu_1 - \\mu_2)^2}{2\\sigma_2^2} - \\frac12."}</MD>
      </Theorem>
      <Proof>
        <p>
          With X ~ N(μ₁, σ₁²),{" "}
          <M>{"\\log\\frac{p(X)}{q(X)} = \\log\\frac{\\sigma_2}{\\sigma_1} - \\frac{(X - \\mu_1)^2}{2\\sigma_1^2} + \\frac{(X - \\mu_2)^2}{2\\sigma_2^2}"}</M>.
          Take expectations: <M>{"\\mathbb{E}(X - \\mu_1)^2 = \\sigma_1^2"}</M> and{" "}
          <M>{"\\mathbb{E}(X - \\mu_2)^2 = \\sigma_1^2 + (\\mu_1 - \\mu_2)^2"}</M>, which gives the formula. Equal variances
          leave <M>{"(\\mu_1 - \\mu_2)^2/(2\\sigma^2)"}</M>, half a squared standardised distance.
        </p>
      </Proof>

      <Theorem title="Monte Carlo estimates">
        <p>
          With samples <M>{"x_i \\sim p"}</M> and <M>{"r = q(x)/p(x)"}</M>, both <M>{"k_1 = -\\log r"}</M> and{" "}
          <M>{"k_3 = (r - 1) - \\log r"}</M> are unbiased for D(p‖q) in nats, and <M>{"k_3 \\ge 0"}</M> for every sample.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathbb{E}_p[-\\log r] = D(p\\,\\|\\,q)"}</M> by definition. Where q is positive only where p is,{" "}
          <M>{"\\mathbb{E}_p[r] = \\sum_x p(x)\\,q(x)/p(x) = 1"}</M>, so <M>{"\\mathbb{E}[k_3] = 0 + \\mathbb{E}[k_1]"}</M>.
          Finally <M>{"\\log r \\le r - 1"}</M> for r &gt; 0 (the tangent line of the concave log at 1), so{" "}
          <M>{"k_3 \\ge 0"}</M>. This is the estimator many RLHF implementations use for the penalty keeping a fine-tuned
          policy close to its reference model: k₁ can be negative on individual samples, k₃ cannot, and it usually has
          lower variance. For N(0, 1) against N(1, 1) both average about 0.5 nats, the exact value.
        </p>
        <Code>{KL}</Code>
      </Proof>

      <Remark title="mode covering and mode seeking">
        <p>
          Fitting q from a family to p by <M>{"\\min_q D(p\\,\\|\\,q)"}</M> is equivalent to maximising{" "}
          <M>{"\\mathbb{E}_p[\\log q]"}</M>, which is maximum likelihood when p is the data; within Gaussians the solution
          matches p&apos;s mean and variance, here mean 0 and standard deviation √(0.25 + 4) ≈ 2.06. Minimising{" "}
          <M>{"D(q\\,\\|\\,p)"}</M> instead needs only samples or evaluations under q, as in variational inference, and
          for well-separated bumps it locks onto one of them, here mean −2 and standard deviation 0.5. The code searches a
          grid of means and widths for each.
        </p>
        <Code>{FT}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "kl1",
      rung: "check",
      prompt: <p>What is D(p‖q) in bits for p = (½, ½) and q = (¼, ¾)? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.2075, tolerance: 0.0001 },
    },
    {
      key: "gk",
      rung: "check",
      prompt: <p>What is the KL divergence in nats from N(0, 1) to N(2, 1)?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "dir",
      rung: "apply",
      prompt: (
        <p>
          A density p has two separated bumps and q ranges over single Gaussians. Which statement describes the minimisers?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Minimising D(p‖q) gives a wide q covering both bumps; minimising D(q‖p) gives a narrow q on one bump",
          "Minimising D(p‖q) gives a narrow q on one bump; minimising D(q‖p) gives a wide q covering both",
          "Both give the same q, because KL is symmetric",
          "Both give a q centred in the valley between the bumps with small variance",
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

def kl(p, q):
    p, q = np.asarray(p, dtype=float), np.asarray(q, dtype=float); m = p > 0
    if np.any(q[m] == 0):
        return float("inf")
    return float(np.sum(p[m] * np.log2(p[m] / q[m])))

def gauss_kl(m1, s1, m2, s2):
    return float(np.log(s2 / s1) + (s1 ** 2 + (m1 - m2) ** 2) / (2 * s2 ** 2) - 0.5)

def mc_kl(logp, logq, x):
    lr = logq(x) - logp(x)
    return float(np.mean(-lr)), float(np.mean(np.exp(lr) - 1 - lr))

p, q = [0.5, 0.5], [0.9, 0.1]
print(round(kl(p, q), 4), round(kl(q, p), 4), kl([0.5, 0.5], [1.0, 0.0]), kl(q, q))
print(gauss_kl(0, 1, 1, 1), round(gauss_kl(0, 1, 0, 2), 4))
x = np.random.default_rng(0).normal(size=200000)
lp = lambda t: -0.5 * t ** 2; lq = lambda t: -0.5 * (t - 1) ** 2
print([round(v, 2) for v in mc_kl(lp, lq, x)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.737 0.531 inf 0.0\n0.5 0.3181\n[0.5, 0.5]",
          "0.737 0.737 inf 0.0\n0.5 0.3181\n[0.5, 0.5]",
          "0.737 0.531 1.0 0.0\n0.5 0.3181\n[0.5, 0.5]",
          "0.531 0.737 inf 0.0\n1.0 0.3181\n[0.5, -0.5]",
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

GRID = np.linspace(-8, 8, 1601); DX = GRID[1] - GRID[0]

def normal_pdf(x, m, s):
    return np.exp(-0.5 * ((x - m) / s) ** 2) / (s * np.sqrt(2 * np.pi))

def kl_grid(p, q):
    m = p > 1e-300
    return float(np.sum(p[m] * np.log(p[m] / np.maximum(q[m], 1e-300))) * DX)

def fit_gaussian(p, reverse):
    best = None
    for m in np.linspace(-4, 4, 81):
        for s in np.linspace(0.2, 4, 39):
            q = normal_pdf(GRID, m, s)
            d = kl_grid(q, p) if reverse else kl_grid(p, q)
            if best is None or d < best[0]:
                best = (d, m, s)
    return round(float(best[1]), 2) + 0.0, round(float(best[2]), 2)

p = 0.5 * normal_pdf(GRID, -2, 0.5) + 0.5 * normal_pdf(GRID, 2, 0.5)
print(fit_gaussian(p, reverse=False), fit_gaussian(p, reverse=True))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["(0.0, 2.1) (-2.0, 0.5)", "(-2.0, 0.5) (0.0, 2.1)", "(0.0, 0.5) (0.0, 2.1)", "(0.0, 2.1) (0.0, 2.1)"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kl(p, q)</C> in bits, returning <C>float(&quot;inf&quot;)</C> when q is 0 where p is positive;{" "}
          <C>gauss_kl(m1, s1, m2, s2)</C> in nats; and <C>mc_kl(logp, logq, x)</C>, returning the averages of k₁ and k₃
          over samples x from p, given functions for the two log densities.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def kl(p, q):
    return 0.0

def gauss_kl(m1, s1, m2, s2):
    return 0.0

def mc_kl(logp, logq, x):
    return 0.0, 0.0
`,
        solution: KL,
        tests: [
          { name: "discrete", code: `assert np.isclose(kl([0.5, 0.5], [0.25, 0.75]), 0.2075187496394219) and kl([0.3, 0.7], [0.3, 0.7]) == 0.0
assert kl([0.5, 0.5], [0.0, 1.0]) == float("inf") and np.isclose(kl([0.0, 1.0], [0.5, 0.5]), 1.0)` },
          { name: "gauss", code: `assert np.isclose(gauss_kl(0, 1, 2, 1), 2.0) and np.isclose(gauss_kl(1, 2, 1, 2), 0.0)
assert np.isclose(gauss_kl(0, 1, 0, 2), np.log(2) + 1 / 8 - 0.5)
k1, k3 = mc_kl(lambda t: np.log(0.5) + 0 * t, lambda t: np.where(t == 0, np.log(0.25), np.log(0.75)), np.array([0, 1, 0, 1]))
assert np.isclose(k1, 0.5 * np.log(2) + 0.5 * np.log(2 / 3)) and np.isclose(k3, k1)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          On the grid <C>GRID</C> with spacing <C>DX</C>, write <C>normal_pdf(x, m, s)</C>; <C>kl_grid(p, q)</C>, the
          Riemann-sum KL in nats between densities on the grid; and <C>fit_gaussian(p, reverse)</C>, searching means
          −4, −3.9, …, 4 and standard deviations 0.2, 0.3, …, 4 for the Gaussian minimising D(p‖q), or D(q‖p) if reverse,
          returning (mean, sd) rounded to 2 decimals and keeping the first minimum found.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

GRID = np.linspace(-8, 8, 1601); DX = GRID[1] - GRID[0]

def normal_pdf(x, m, s):
    return 0 * x

def kl_grid(p, q):
    return 0.0

def fit_gaussian(p, reverse):
    return 0.0, 1.0
`,
        solution: FT,
        tests: [
          { name: "pdf", code: `assert np.isclose(normal_pdf(0.0, 0.0, 1.0), 1 / np.sqrt(2 * np.pi)) and np.isclose(np.sum(normal_pdf(GRID, 1.0, 0.7)) * DX, 1.0)
assert np.isclose(kl_grid(normal_pdf(GRID, 0, 1), normal_pdf(GRID, 1, 1)), 0.5, atol=1e-4)` },
          { name: "fit", code: `p = normal_pdf(GRID, 1.0, 0.8)
assert fit_gaussian(p, False) == (1.0, 0.8) and fit_gaussian(p, True) == (1.0, 0.8)
p = 0.3 * normal_pdf(GRID, -2, 0.5) + 0.7 * normal_pdf(GRID, 2, 0.5)
assert fit_gaussian(p, True) == (2.0, 0.5) and abs(fit_gaussian(p, False)[0] - 0.8) < 0.11` },
        ],
      },
    },
    {
      key: "k3",
      rung: "stretch",
      prompt: <p>A single sample has ratio r = q(x)/p(x) = 2. What is its k₃ estimate (r − 1) − ln r? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.3069, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The extra-bits identity splits <M>{"\\mathbb{E}_p[-\\log q]"}</M> into entropy plus divergence. That expectation is
        the cross-entropy, the loss almost every classifier and language model is trained on, and the next lesson shows why
        minimising it is the right thing to do.
      </p>
    </>
  ),
};
