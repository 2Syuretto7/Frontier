import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EstimatorCrossoverViz } from "@/components/viz/EstimatorCrossoverViz";
import type { LessonContent } from "@/lib/types";

const VS = `import numpy as np

def both_estimates(f, f_prime, mu, sigma, eps):
    x = mu + sigma * eps
    return f_prime(x), f(x) * eps / sigma

def sin_variances(k, mu, sigma):
    c2, e2 = np.cos(2 * k * mu), np.exp(-2 * k ** 2 * sigma ** 2)
    g = k * np.cos(k * mu) * np.exp(-k ** 2 * sigma ** 2 / 2)
    v_path = k ** 2 * 0.5 * (1 + c2 * e2) - g ** 2
    v_score = 0.5 * (1 - c2 * e2 * (1 - 4 * k ** 2 * sigma ** 2)) / sigma ** 2 - g ** 2
    return float(v_path), float(v_score)`;

const CB = `import numpy as np

def combine(a, b):
    C = np.cov(a, b); va, vb, c = C[0, 0], C[1, 1], C[0, 1]
    w = (vb - c) / (va + vb - 2 * c)
    return float(w), float(w ** 2 * va + (1 - w) ** 2 * vb + 2 * w * (1 - w) * c)

def score_var_sum(d, n, seed=0):
    eps = np.random.default_rng(seed).normal(size=(n, d))
    return float(np.var(eps.sum(axis=1) * eps[:, 0]))`;

export const lesson: LessonContent = {
  id: "m13.6.3",
  minutes: 55,
  links: {
    requires: ["m13.6.1", "m13.6.2"],
    revisits: ["m13.1.2", "m13.1.1"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        Folklore says the pathwise estimator always beats the score function, and in variational autoencoders it does, by
        orders of magnitude. Yet for some perfectly smooth integrands the score function wins, and by a wide margin. Both are
        unbiased, so the whole contest is about variance. What property of f decides the winner, how does the answer change
        with dimension, and can you do better than picking one?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The pathwise estimate is built from the slope of f, so it is quiet when f changes gently and loud when f wiggles. The
        score-function estimate is built from the size of f, times a random direction, so it does not care how f wiggles but is
        loud when f is large, and every coordinate of a high-dimensional x adds its own share of noise. Neither dominates. And
        because they estimate the same thing, a weighted average of the two is still unbiased, often with less variance than
        either.
      </p>
      <EstimatorCrossoverViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the two estimates for a Gaussian">
        <p>
          For <M>{"X = \\mu + \\sigma\\varepsilon"}</M> and the derivative of <M>{"\\mathbb E f(X)"}</M> in μ, the one-sample
          pathwise estimate is <M>{"f'(X)"}</M> and the score-function estimate is <M>{"f(X)\\varepsilon/\\sigma"}</M>, the score of{" "}
          <M>{"N(\\mu, \\sigma^2)"}</M> in μ being <M>{"(x - \\mu)/\\sigma^2"}</M>. Both have mean{" "}
          <M>{"\\mathbb E f'(X)"}</M>, by Stein&apos;s identity <M>{"\\mathbb E[f(X)(X - \\mu)] = \\sigma^2\\mathbb E f'(X)"}</M>.
        </p>
      </Definition>

      <Theorem title="oscillation favours the score function">
        <p>
          For <M>{"f(x) = \\sin(kx)"}</M>, with <M>{"c = \\cos(2k\\mu)"}</M>, <M>{"e = e^{-2k^2\\sigma^2}"}</M> and true gradient g,
        </p>
        <MD>{"V_{path} = \\tfrac{k^2}{2}(1 + ce) - g^2, \\qquad V_{score} = \\frac{1 - ce(1 - 4k^2\\sigma^2)}{2\\sigma^2} - g^2."}</MD>
        <p>
          As k grows, <M>{"V_{path} \\approx k^2/2"}</M> while <M>{"V_{score} \\to 1/2\\sigma^2"}</M>; as k → 0 the pathwise
          variance vanishes much faster than the score-function one.
        </p>
      </Theorem>
      <Proof>
        <p>
          Use <M>{"\\cos^2 = \\tfrac12(1 + \\cos 2\\cdot)"}</M> and <M>{"\\sin^2 = \\tfrac12(1 - \\cos 2\\cdot)"}</M>, and the
          Gaussian characteristic function: <M>{"\\mathbb E\\cos(2kX) = \\cos(2k\\mu)e^{-2k^2\\sigma^2}"}</M>, while{" "}
          <M>{"\\mathbb E[\\cos(2kX)\\varepsilon^2] = \\cos(2k\\mu)e^{-2k^2\\sigma^2}(1 - 4k^2\\sigma^2)"}</M>, obtained by differentiating{" "}
          <M>{"\\mathbb E e^{it\\varepsilon} = e^{-t^2/2}"}</M> twice in t. The true gradient is{" "}
          <M>{"g = k\\cos(k\\mu)e^{-k^2\\sigma^2/2}"}</M>, which is tiny for large k: the pathwise estimate is then averaging a
          large, rapidly alternating slope to get almost nothing. The crossover is near <M>{"k\\sigma \\approx 1"}</M>, about
          k = 1.1 for σ = 1.
        </p>
        <Code>{VS}</Code>
      </Proof>

      <Theorem title="dimension favours the pathwise estimator">
        <p>
          Let <M>{"f(x) = \\sum_{i=1}^d x_i"}</M> with <M>{"X \\sim N(\\mu, I_d)"}</M>. For the derivative in <M>{"\\mu_1"}</M>, at
          μ = 0, the pathwise estimate is exactly 1, with no variance, while the score-function estimate{" "}
          <M>{"f(X)\\varepsilon_1"}</M> has variance d + 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          The pathwise estimate is <M>{"\\partial f/\\partial x_1 = 1"}</M>. For the other,{" "}
          <M>{"\\mathbb E[(\\sum_i\\varepsilon_i)^2\\varepsilon_1^2] = \\mathbb E\\varepsilon_1^4 + \\sum_{i \\ge 2}\\mathbb E\\varepsilon_i^2\\,\\mathbb E\\varepsilon_1^2 = 3 + (d - 1)"}</M>,
          cross terms vanishing by independence, and subtracting <M>{"g^2 = 1"}</M> leaves d + 1. Every coordinate that f depends
          on contributes noise to every coordinate of the score-function gradient, even those it has nothing to do with; the
          pathwise estimate isolates each coordinate&apos;s own effect. This is why variational autoencoders with thousands of
          latent dimensions are trained pathwise.
        </p>
      </Proof>

      <Theorem title="combining unbiased estimators">
        <p>
          If A and B are unbiased for the same quantity with variances <M>{"v_A, v_B"}</M> and covariance c, then{" "}
          <M>{"wA + (1 - w)B"}</M> is unbiased for every w, and its variance is minimised at
        </p>
        <MD>{"w^* = \\frac{v_B - c}{v_A + v_B - 2c}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Unbiasedness is linearity of expectation. The variance{" "}
          <M>{"w^2v_A + (1 - w)^2v_B + 2w(1 - w)c"}</M> is a quadratic in w with derivative{" "}
          <M>{"2wv_A - 2(1 - w)v_B + 2(1 - 2w)c"}</M>, which vanishes at <M>{"w^*"}</M>. For uncorrelated estimators this is
          inverse-variance weighting. The two gradient estimates computed from the same draw are usually correlated, and the
          gain can be large: for <M>{"f = \\sin"}</M>, μ = 0.3 and σ = 1, the variances 0.22 and 0.33 combine to about 0.023.
          In practice <M>{"w^*"}</M> is estimated from the samples, introducing a small bias that is usually ignored or removed by
          estimating it on separate draws.
        </p>
        <Code>{CB}</Code>
      </Proof>

      <Remark title="a practical guide">
        <p>
          Use the pathwise estimator when f and the sampler are differentiable and f varies on scales larger than the noise,
          which covers most continuous latent-variable models. Use the score function for discrete choices, black-box or
          discontinuous f, and whenever the sampling path contains accept-reject or argmax steps, and always give it a baseline.
          Between the two sit hybrids, such as REBAR and RELAX, that use a relaxed pathwise gradient as a control variate for the
          score function, keeping unbiasedness while borrowing the lower variance. Above all, measure: the variance of a gradient
          estimator is itself easy to estimate, and comparing estimators on the problem at hand settles questions that
          folklore cannot.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dim",
      rung: "check",
      prompt: <p>For f(x) = x₁ + … + x₅₀ and X ~ N(0, I), what is the variance of the one-sample score-function estimate of the derivative in μ₁?</p>,
      answer: { kind: "numeric", value: 51, tolerance: 0.0001 },
    },
    {
      key: "weight",
      rung: "check",
      prompt: <p>Two uncorrelated unbiased estimators have variances 1 and 3. What weight should the first receive in the best combination?</p>,
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0001 },
    },
    {
      key: "choose",
      rung: "apply",
      prompt: <p>You need the derivative in μ of E sin(20X), with X ~ N(μ, 1). Which single-sample estimator has lower variance, and why?</p>,
      answer: {
        kind: "choice",
        options: [
          "The score function: its variance stays near 1/2, while the pathwise estimate 20 cos(20X) has variance near 200",
          "The pathwise estimator, because it always has lower variance for smooth f",
          "They have equal variance, since both are unbiased",
          "The pathwise estimator, because the score function cannot handle periodic functions",
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

def both_estimates(f, f_prime, mu, sigma, eps):
    x = mu + sigma * eps
    return f_prime(x), f(x) * eps / sigma

def sin_variances(k, mu, sigma):
    c2, e2 = np.cos(2 * k * mu), np.exp(-2 * k ** 2 * sigma ** 2)
    g = k * np.cos(k * mu) * np.exp(-k ** 2 * sigma ** 2 / 2)
    v_path = k ** 2 * 0.5 * (1 + c2 * e2) - g ** 2
    v_score = 0.5 * (1 - c2 * e2 * (1 - 4 * k ** 2 * sigma ** 2)) / sigma ** 2 - g ** 2
    return float(v_path), float(v_score)

e = np.random.default_rng(0).normal(size=400000); p, s = both_estimates(lambda x: np.sin(3 * x), lambda x: 3 * np.cos(3 * x), 0.3, 1.0, e)
print(abs(p.var() - 4.5) < 0.1, abs(s.var() - 0.5) < 0.02, [round(v, 2) for v in sin_variances(0.25, 0.3, 1.0)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["True True [0.0, 0.11]", "True True [0.11, 0.0]", "False True [0.0, 0.11]", "True False [0.0, 0.11]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def combine(a, b):
    C = np.cov(a, b); va, vb, c = C[0, 0], C[1, 1], C[0, 1]
    w = (vb - c) / (va + vb - 2 * c)
    return float(w), float(w ** 2 * va + (1 - w) ** 2 * vb + 2 * w * (1 - w) * c)

def score_var_sum(d, n, seed=0):
    eps = np.random.default_rng(seed).normal(size=(n, d))
    return float(np.var(eps.sum(axis=1) * eps[:, 0]))

print([round(score_var_sum(d, 20000), -1) for d in (10, 100)])
a = np.array([1.0, 2.0, 3.0, 4.0]); w, v = combine(a, 5 - a); print(w, round(v, 6) + 0.0)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[10.0, 100.0]\n0.5 0.0", "[0.0, 0.0]\n0.5 0.0", "[10.0, 100.0]\n1.0 1.667", "[10.0, 100.0]\n0.5 0.833"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>both_estimates(f, f_prime, mu, sigma, eps)</C>, returning the arrays of pathwise and score-function estimates
          of the μ-derivative of <M>{"\\mathbb E f(X)"}</M> for <M>{"X = \\mu + \\sigma\\varepsilon"}</M>, and{" "}
          <C>sin_variances(k, mu, sigma)</C>, their exact variances for f(x) = sin(kx).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def both_estimates(f, f_prime, mu, sigma, eps):
    return np.zeros_like(eps), np.zeros_like(eps)

def sin_variances(k, mu, sigma):
    return 0.0, 0.0
`,
        solution: VS,
        tests: [
          { name: "unbiased", code: `e = np.random.default_rng(3).normal(size=300000); p, s = both_estimates(lambda x: np.exp(0.5 * x), lambda x: 0.5 * np.exp(0.5 * x), 0.2, 0.8, e); g = 0.5 * np.exp(0.1 + 0.08)
assert abs(p.mean() - g) < 0.005 and abs(s.mean() - g) < 0.01 and p.var() < s.var()` },
          { name: "formula", code: `e = np.random.default_rng(0).normal(size=400000)
for k, mu, sg in ((0.7, -0.4, 1.5), (2.5, 0.1, 0.6)):
    p, s = both_estimates(lambda x: np.sin(k * x), lambda x: k * np.cos(k * x), mu, sg, e); vp, vs = sin_variances(k, mu, sg)
    assert abs(p.var() - vp) < 0.03 * max(vp, 0.01) + 1e-3 and abs(s.var() - vs) < 0.03 * vs + 1e-3` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>combine(a, b)</C>, returning the variance-minimising weight on a and the variance of the combination, using
          sample variances and covariance, and <C>score_var_sum(d, n, seed)</C>, the sample variance of the score-function
          estimate for f(x) = x₁ + … + x_d at μ = 0, σ = 1, from n draws.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def combine(a, b):
    return 0.5, 0.0

def score_var_sum(d, n, seed=0):
    return 1.0
`,
        solution: CB,
        tests: [
          { name: "combine", code: `r = np.random.default_rng(4); a = r.normal(size=50000); b = r.normal(size=50000) * np.sqrt(3); w, v = combine(a, b)
assert abs(w - 0.75) < 0.02 and abs(v - 0.75) < 0.03 and abs(combine(a, 2 - a)[0] - 0.5) < 1e-9 and abs(combine(a, 2 - a)[1]) < 1e-9` },
          { name: "dim", code: `assert abs(score_var_sum(1, 40000, 1) - 2) < 0.15 and abs(score_var_sum(30, 40000, 2) - 31) < 1.5` },
        ],
      },
    },
    {
      key: "cv",
      rung: "stretch",
      prompt: <p>For the same two uncorrelated estimators with variances 1 and 3, what variance does the best combination achieve?</p>,
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        This closes the course. You can now estimate expectations and their gradients, sample from distributions known only up
        to a constant, judge how quickly a chain mixes, and model randomness unfolding in continuous time. These tools return
        throughout the machine learning courses, wherever an integral is too hard to compute and a sample has to stand in for
        it.
      </p>
    </>
  ),
};
