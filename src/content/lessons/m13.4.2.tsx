import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GibbsZigzagViz } from "@/components/viz/GibbsZigzagViz";
import type { LessonContent } from "@/lib/types";

const GB = `import numpy as np

def gibbs_bvn(rho, n, seed=0):
    rng, s = np.random.default_rng(seed), np.sqrt(1 - rho ** 2)
    x = y = 0.0; out = np.empty((n, 2))
    for i in range(n):
        x = rho * y + s * rng.normal()
        y = rho * x + s * rng.normal()
        out[i] = x, y
    return out

def gibbs_normal(data, n, m0=0.0, s0=10.0, a0=1.0, b0=1.0, seed=0):
    rng, x = np.random.default_rng(seed), np.asarray(data, float)
    mu, lam, out = x.mean(), 1.0, np.empty((n, 2))
    for i in range(n):
        prec = 1 / s0 ** 2 + len(x) * lam
        mu = rng.normal((m0 / s0 ** 2 + lam * x.sum()) / prec, 1 / np.sqrt(prec))
        lam = rng.gamma(a0 + len(x) / 2, 1 / (b0 + 0.5 * ((x - mu) ** 2).sum()))
        out[i] = mu, lam
    return out`;

const DA = `import numpy as np

def t_gibbs(x, nu, n, seed=0):
    rng, x = np.random.default_rng(seed), np.asarray(x, float)
    mu, out = np.median(x), np.empty(n)
    for i in range(n):
        w = rng.gamma((nu + 1) / 2, 2 / (nu + (x - mu) ** 2))
        mu = rng.normal((w * x).sum() / w.sum(), 1 / np.sqrt(w.sum()))
        out[i] = mu
    return out

def lag_corr(z, k=1):
    return float(np.corrcoef(z[:-k], z[k:])[0, 1])`;

export const lesson: LessonContent = {
  id: "m13.4.2",
  minutes: 55,
  links: {
    requires: ["m13.4.1"],
    revisits: ["l2.7.2", "m13.3.2"],
    foreshadows: ["m13.4.3"],
  },

  puzzle: (
    <>
      <p>
        A posterior over a hundred parameters is hopeless to sample jointly, but the distribution of any one parameter given
        all the others is often a textbook density you can draw from directly. Cycling through the parameters, redrawing each
        from its conditional, needs no step size and never rejects anything. Why does it target the right joint distribution,
        and why can it still be painfully slow?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each update replaces one coordinate with a fresh draw from exactly where it should be, given the rest. That cannot
        disturb the joint distribution, so the whole sweep preserves it. The weakness is that moves are always parallel to the
        axes. If two parameters are strongly correlated the conditional of one given the other is a thin slice, and the
        sampler creeps along the ridge in tiny steps. The remedies are to update correlated parameters together, to change
        coordinates, or to add auxiliary variables that make the conditionals easy.
      </p>
      <GibbsZigzagViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Gibbs sampling">
        <p>
          For <M>{"x = (x_1, \\dots, x_d)"}</M> with target π, a Gibbs update of coordinate i replaces{" "}
          <M>{"x_i"}</M> by a draw from <M>{"\\pi(x_i \\mid x_{-i})"}</M>. A systematic scan applies the updates in order 1, …, d;
          a random scan picks i uniformly each step. Coordinates may be blocks of variables.
        </p>
      </Definition>

      <Theorem title="Gibbs is Metropolis-Hastings that always accepts">
        <p>
          A Gibbs update of coordinate i is a Metropolis-Hastings step with proposal{" "}
          <M>{"q(x, y) = \\pi(y_i \\mid x_{-i})"}</M> for <M>{"y_{-i} = x_{-i}"}</M>, and its acceptance probability is 1. Each
          update is therefore reversible with respect to π, the random scan is reversible, and the systematic scan, a product
          of reversible kernels, leaves π stationary but is in general not reversible.
        </p>
      </Theorem>
      <Proof>
        <p>
          With <M>{"y_{-i} = x_{-i}"}</M>, write <M>{"\\pi(y) = \\pi(y_i \\mid x_{-i})\\pi(x_{-i})"}</M> and likewise for x. The
          Hastings ratio is
        </p>
        <MD>{"\\frac{\\pi(y)\\,\\pi(x_i \\mid x_{-i})}{\\pi(x)\\,\\pi(y_i \\mid x_{-i})} = \\frac{\\pi(y_i \\mid x_{-i})\\pi(x_{-i})\\,\\pi(x_i \\mid x_{-i})}{\\pi(x_i \\mid x_{-i})\\pi(x_{-i})\\,\\pi(y_i \\mid x_{-i})} = 1."}</MD>
        <p>
          A mixture of reversible kernels is reversible. The product <M>{"P_1P_2"}</M> of reversible kernels preserves π because
          each factor does, but its time reversal is <M>{"P_2P_1"}</M>, which is usually different.
        </p>
      </Proof>

      <Example title="the correlated normal">
        <p>
          For a standard bivariate normal with correlation ρ the conditionals are{" "}
          <M>{"x \\mid y \\sim N(\\rho y, 1 - \\rho^2)"}</M> and symmetrically. One systematic sweep gives{" "}
          <M>{"x' = \\rho y + \\dots = \\rho^2x + \\text{noise}"}</M>, so the x-chain is AR(1) with coefficient{" "}
          <M>{"\\rho^2"}</M> and integrated autocorrelation time <M>{"(1 + \\rho^2)/(1 - \\rho^2)"}</M>. At ρ = 0.99 that is
          about 100. Rotating to the coordinates x + y and x − y, or drawing (x, y) jointly as one block, makes the draws
          independent. The code also runs the semi-conjugate normal model, with a normal prior on the mean μ and a gamma prior
          on the precision λ: each conditional is again normal or gamma, though the joint posterior is neither.
        </p>
        <Code>{GB}</Code>
      </Example>

      <Theorem title="data augmentation">
        <p>
          If <M>{"\\pi(\\theta) = \\int \\pi(\\theta, w)\\,dw"}</M>, a Gibbs sampler on <M>{"(\\theta, w)"}</M> has the θ-marginal
          π. In particular a Student-t likelihood with ν degrees of freedom is a normal likelihood with a hidden precision{" "}
          <M>{"w_i \\sim \\mathrm{Gamma}(\\nu/2, \\nu/2)"}</M> per observation, and given μ,
        </p>
        <MD>{"w_i \\mid \\mu \\sim \\mathrm{Gamma}\\left(\\frac{\\nu + 1}{2},\\ \\frac{\\nu + (x_i - \\mu)^2}{2}\\right)."}</MD>
      </Theorem>
      <Proof>
        <p>
          The joint chain targets <M>{"\\pi(\\theta, w)"}</M> by the previous theorem, and marginalising a stationary chain gives
          a stationary marginal. For the conditional,{" "}
          <M>{"p(w_i \\mid \\mu, x_i) \\propto w_i^{1/2}e^{-w_i(x_i - \\mu)^2/2}\\cdot w_i^{\\nu/2 - 1}e^{-\\nu w_i/2}"}</M>, a gamma
          kernel with the stated shape and rate. An outlier gets a large residual and hence a small expected weight{" "}
          <M>{"(\\nu + 1)/(\\nu + r^2)"}</M>, so the conditional for μ, a precision-weighted mean, all but ignores it: the
          augmented sampler is a randomised version of iteratively reweighted least squares.
        </p>
        <Code>{DA}</Code>
      </Proof>

      <Remark title="when Gibbs fails">
        <p>
          Gibbs needs the conditionals to connect the support. On the uniform distribution over two squares that touch only at a
          corner, or are separated, axis-parallel moves can never cross, and the chain is reducible. Close to that, with two
          modes offset diagonally, it is irreducible but has a severe bottleneck. Collapsing, integrating a variable out
          analytically instead of sampling it, never hurts in variance terms and often helps a great deal; it is the basis of
          collapsed samplers for topic models.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ar",
      rung: "check",
      prompt: <p>A systematic-scan Gibbs sampler runs on a standard bivariate normal with ρ = 0.95. What is the lag-one autocorrelation of the x-chain?</p>,
      answer: { kind: "numeric", value: 0.9025, tolerance: 0.0001 },
    },
    {
      key: "tau",
      rung: "check",
      prompt: <p>For the same sampler with ρ = 0.9, what is the integrated autocorrelation time of the x-chain?</p>,
      answer: { kind: "numeric", value: 9.526, tolerance: 0.01 },
    },
    {
      key: "squares",
      rung: "apply",
      prompt: (
        <p>
          The target is uniform on the union of the squares [0, 1]² and [2, 3]². What goes wrong with Gibbs sampling started in
          the first square?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Every conditional draw stays in the first square, so the chain is reducible and never visits the second",
          "Nothing: Gibbs always accepts, so it is always correct",
          "The conditionals are not uniform, so they cannot be sampled",
          "The chain alternates between the squares and is periodic",
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

def gibbs_bvn(rho, n, seed=0):
    rng, s = np.random.default_rng(seed), np.sqrt(1 - rho ** 2)
    x = y = 0.0; out = np.empty((n, 2))
    for i in range(n):
        x = rho * y + s * rng.normal()
        y = rho * x + s * rng.normal()
        out[i] = x, y
    return out

def gibbs_normal(data, n, m0=0.0, s0=10.0, a0=1.0, b0=1.0, seed=0):
    rng, x = np.random.default_rng(seed), np.asarray(data, float)
    mu, lam, out = x.mean(), 1.0, np.empty((n, 2))
    for i in range(n):
        prec = 1 / s0 ** 2 + len(x) * lam
        mu = rng.normal((m0 / s0 ** 2 + lam * x.sum()) / prec, 1 / np.sqrt(prec))
        lam = rng.gamma(a0 + len(x) / 2, 1 / (b0 + 0.5 * ((x - mu) ** 2).sum()))
        out[i] = mu, lam
    return out

o = gibbs_bvn(0.9, 20000); r1 = np.corrcoef(o[:-1, 0], o[1:, 0])[0, 1]; print(abs(r1 - 0.81) < 0.03, round(float(np.corrcoef(o.T)[0, 1]), 1))
g = gibbs_normal(np.random.default_rng(5).normal(2.0, 0.5, size=40), 5000)[500:]; print(round(float(g[:, 0].mean()), 1), round(float(1 / np.sqrt(g[:, 1].mean())), 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["True 0.9\n1.8 0.5", "False 0.9\n1.8 0.5", "True 0.8\n1.8 0.5", "True 0.9\n2.0 0.2"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def t_gibbs(x, nu, n, seed=0):
    rng, x = np.random.default_rng(seed), np.asarray(x, float)
    mu, out = np.median(x), np.empty(n)
    for i in range(n):
        w = rng.gamma((nu + 1) / 2, 2 / (nu + (x - mu) ** 2))
        mu = rng.normal((w * x).sum() / w.sum(), 1 / np.sqrt(w.sum()))
        out[i] = mu
    return out

def lag_corr(z, k=1):
    return float(np.corrcoef(z[:-k], z[k:])[0, 1])

x = [-0.3, 0.1, 0.4, -0.2, 0.0, 12.0]; t = t_gibbs(x, 3, 20000)[1000:]
print(abs(t.mean()) < 0.2, float(np.mean(x)), lag_corr(t) < 0.2)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["True 2.0 True", "False 2.0 True", "True 0.0 True", "True 2.0 False"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gibbs_bvn(rho, n, seed)</C>, a systematic-scan Gibbs sampler for the standard bivariate normal with
          correlation rho returning an n × 2 array, and <C>gibbs_normal(data, n, m0, s0, a0, b0, seed)</C> for the model{" "}
          <M>{"x_i \\sim N(\\mu, 1/\\lambda)"}</M>, <M>{"\\mu \\sim N(m_0, s_0^2)"}</M>,{" "}
          <M>{"\\lambda \\sim \\mathrm{Gamma}(a_0, \\text{rate } b_0)"}</M>, returning rows (μ, λ).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gibbs_bvn(rho, n, seed=0):
    return np.zeros((n, 2))

def gibbs_normal(data, n, m0=0.0, s0=10.0, a0=1.0, b0=1.0, seed=0):
    return np.ones((n, 2))
`,
        solution: GB,
        tests: [
          { name: "bvn", code: `o = gibbs_bvn(0.6, 20000, 2); c = np.corrcoef(o[:-1, 0], o[1:, 0])[0, 1]
assert abs(np.corrcoef(o.T)[0, 1] - 0.6) < 0.03 and abs(c - 0.36) < 0.03 and abs(o[:, 0].var() - 1) < 0.05` },
          { name: "normal", code: `d = np.random.default_rng(7).normal(-1, 2, size=200); g = gibbs_normal(d, 4000, seed=1)[400:]
assert abs(g[:, 0].mean() - d.mean()) < 0.05 and abs(1 / np.sqrt(g[:, 1].mean()) - d.std()) < 0.1 and g[:, 0].std() > 0.05` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>t_gibbs(x, nu, n, seed)</C>, the data-augmentation sampler for the location μ of a Student-t model with unit
          scale and a flat prior, returning the μ draws, and <C>lag_corr(z, k)</C>, the lag-k sample autocorrelation.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def t_gibbs(x, nu, n, seed=0):
    return np.zeros(n)

def lag_corr(z, k=1):
    return 0.0
`,
        solution: DA,
        tests: [
          { name: "lag", code: `assert abs(lag_corr(np.arange(10.0)) - 1) < 1e-9 and abs(lag_corr(np.array([1.0, -1.0] * 50))+ 1) < 1e-9` },
          { name: "robust", code: `z = np.random.default_rng(4).normal(5, 1, size=30); a = t_gibbs(z, 4, 5000, 1)[500:].mean(); b = t_gibbs(list(z) + [60.0], 4, 5000, 1)[500:].mean()
assert abs(a - z.mean()) < 0.1 and abs(b - z.mean()) < 0.15` },
        ],
      },
    },
    {
      key: "weight",
      rung: "stretch",
      prompt: (
        <p>
          In the t sampler with ν = 3, an observation has residual <M>{"x_i - \\mu = 2"}</M>. What is the conditional mean of its
          weight <M>{"w_i"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5714, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Both random walks and Gibbs sampling move diffusively, one small step at a time. Hamiltonian Monte Carlo uses the
        gradient of log π to make long, directed moves that still keep detailed balance, the subject of the next lesson.
      </p>
    </>
  ),
};
