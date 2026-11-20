import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RandomFeaturesViz } from "@/components/viz/RandomFeaturesViz";
import type { LessonContent } from "@/lib/types";

const FEATURES = `import math, random

def sample_features(D, sigma, seed):
    rng = random.Random(seed)
    return [(rng.gauss(0, 1 / sigma), rng.uniform(0, 2 * math.pi)) for _ in range(D)]

def feature_map(x, feats):
    c = math.sqrt(2 / len(feats))
    return [c * math.cos(w * x + b) for w, b in feats]

def approx_kernel(x, y, feats):
    return sum(u * v for u, v in zip(feature_map(x, feats), feature_map(y, feats)))`;

const BUDGET = `import math

def features_needed(eps, delta):
    return math.ceil(8 * math.log(2 / delta) / eps ** 2)

def pointwise_bound(D, eps):
    return min(1.0, 2 * math.exp(-D * eps ** 2 / 8))

def speedup(m, D):
    return (m ** 3 / 3) / (m * D * D + D ** 3 / 3)`;

export const lesson: LessonContent = {
  id: "m16.5.4",
  minutes: 40,
  links: {
    requires: ["m16.5.3", "m15.1.2"],
    revisits: ["m16.3.3", "m7.4.2"],
    foreshadows: ["m16.7.1", "m17.3.2"],
  },

  puzzle: (
    <>
      <p>
        Kernel ridge regression on a million examples needs a million-by-million Gram matrix: eight terabytes to store and
        about 10¹⁷ operations to solve. Yet the Gaussian kernel is an inner product in an infinite-dimensional feature space.
        Could a few hundred well-chosen coordinates of that space be enough, so that an ordinary linear model on those
        coordinates does nearly the same job?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A shift-invariant kernel is an average of cosine waves of random frequency. Draw D frequencies, evaluate a cosine of
        each at x, and the inner product of two such vectors is a Monte Carlo estimate of the kernel. The error falls like
        1/√D, whatever the number of training points, and the model built on these features is linear in D unknowns.
      </p>
      <RandomFeaturesViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="Bochner">
        <p>
          A continuous function κ on ℝ<sup>d</sup> with κ(0) = 1 gives a positive definite kernel{" "}
          <M>{"k(x, y) = \\kappa(x - y)"}</M> if and only if κ is the Fourier transform of a probability measure p:
        </p>
        <MD>{"\\kappa(\\delta) = \\mathbb E_{w \\sim p}\\, e^{i w^\\top \\delta}."}</MD>
        <p>
          For the Gaussian kernel <M>{"\\kappa(\\delta) = e^{-\\|\\delta\\|^2/2\\sigma^2}"}</M> the measure is{" "}
          <M>{"p = N(0, \\sigma^{-2} I)"}</M>; for the Laplace kernel it is a Cauchy distribution.
        </p>
      </Theorem>
      <Proof>
        <p>
          We prove the easy direction. If κ has this form, then for any points and coefficients{" "}
          <M>{"\\sum_{i,j} c_i c_j \\kappa(x_i - x_j) = \\mathbb E\\big|\\sum_i c_i e^{i w^\\top x_i}\\big|^2 \\ge 0"}</M>. The converse, that
          every such κ arises this way, needs harmonic analysis and we take it as given. Since κ is real, the imaginary part
          averages out and <M>{"\\kappa(\\delta) = \\mathbb E \\cos(w^\\top \\delta)"}</M>.
        </p>
      </Proof>

      <Theorem title="random Fourier features">
        <p>
          Draw <M>{"w_1, \\dots, w_D \\sim p"}</M> and <M>{"b_1, \\dots, b_D \\sim U[0, 2\\pi)"}</M> independently and set
        </p>
        <MD>{"z(x) = \\sqrt{2/D}\\,\\big(\\cos(w_1^\\top x + b_1), \\dots, \\cos(w_D^\\top x + b_D)\\big)."}</MD>
        <p>
          Then <M>{"\\mathbb E\\, z(x)^\\top z(y) = k(x, y)"}</M>, and for each pair{" "}
          <M>{"P(|z(x)^\\top z(y) - k(x, y)| \\ge \\varepsilon) \\le 2 e^{-D\\varepsilon^2/8}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The inner product is the average of <M>{"2\\cos(w^\\top x + b)\\cos(w^\\top y + b) = \\cos(w^\\top(x - y)) + \\cos(w^\\top(x + y) + 2b)"}</M>.
          The second cosine has mean zero over the uniform b, and the first has mean κ(x − y) by Bochner. This is what{" "}
          <C>sample_features</C>, <C>feature_map</C> and <C>approx_kernel</C> compute. Each term lies in [−2, 2], so
          Hoeffding&apos;s inequality (m15.1.2) gives the tail bound.
        </p>
        <Code>{FEATURES}</Code>
      </Proof>

      <Theorem title="uniform approximation">
        <p>
          On a set of diameter R in ℝ<sup>d</sup>, with <M>{"\\sigma_p^2 = \\mathbb E\\|w\\|^2"}</M>,
        </p>
        <MD>{"P\\Big(\\sup_{x, y} |z(x)^\\top z(y) - k(x, y)| \\ge \\varepsilon\\Big) \\le C \\Big(\\frac{\\sigma_p R}{\\varepsilon}\\Big)^2 e^{-D\\varepsilon^2/(4(d + 2))},"}</MD>
        <p>so <M>{"D = O\\big(\\tfrac{d}{\\varepsilon^2}\\log\\tfrac{\\sigma_p R}{\\varepsilon}\\big)"}</M> features suffice for error ε everywhere.</p>
      </Theorem>
      <Proof>
        <p>
          Cover the set of differences by an ε-net (m16.3.3) with <M>{"O((R/r)^d)"}</M> centres and apply the pointwise bound at
          each centre with a union bound. Between centres the error is Lipschitz with a constant whose expected square is at
          most <M>{"2\\sigma_p^2"}</M>, so by Markov&apos;s inequality (m7.4.2) it does not move much within a ball of radius r. Choosing r to
          balance the two terms gives the bound. <C>features_needed</C> inverts the pointwise bound.
        </p>
        <Code>{BUDGET}</Code>
      </Proof>

      <Definition title="ridge regression on random features">
        <p>
          Form the m × D matrix Z with rows <M>{"z(x_i)"}</M> and solve the D-dimensional ridge problem
        </p>
        <MD>{"\\hat w = (Z^\\top Z + \\lambda m I)^{-1} Z^\\top y, \\qquad \\hat f(x) = \\hat w^\\top z(x)."}</MD>
        <p>
          This is exact kernel ridge regression for the kernel <M>{"z(x)^\\top z(y)"}</M>. It costs{" "}
          <M>{"O(mD^2 + D^3)"}</M> time and <M>{"O(mD)"}</M> memory instead of <M>{"O(m^3)"}</M> and <M>{"O(m^2)"}</M>;{" "}
          <C>speedup</C> gives the ratio of the leading operation counts.
        </p>
      </Definition>

      <Remark title="how many features learning needs">
        <p>
          Approximating the kernel uniformly is more than learning requires. Rudi and Rosasco showed that{" "}
          <M>{"D \\approx \\sqrt m \\log m"}</M> features already give the same excess-risk rate as exact kernel ridge regression
          with the usual choice <M>{"\\lambda \\approx 1/\\sqrt m"}</M>, so the cost drops to about <M>{"m^2"}</M>. The Nyström method,
          which uses D sampled columns of K instead of random frequencies, has similar guarantees and adapts to the data.
        </p>
      </Remark>

      <Remark title="a two-layer network with a frozen first layer">
        <p>
          <M>{"\\hat f(x) = \\sum_j \\hat w_j \\sqrt{2/D}\\cos(w_j^\\top x + b_j)"}</M> is a network with one hidden layer whose first-layer weights
          are random and fixed; only the output layer is trained. Varying D through m produces the double descent curve of
          m16.7.1, and wide networks trained in full behave like a related kernel, the neural tangent kernel (m17.3.2).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "speedup",
      rung: "check",
      prompt: <p>Using the leading operation counts m³/3 for kernel ridge regression and mD² + D³/3 for random features, how many times faster is the second with m = 30000 and D = 300? Give the nearest integer.</p>,
      answer: { kind: "numeric", value: 3322, tolerance: 1 },
    },
    {
      key: "budget",
      rung: "check",
      prompt: <p>By the pointwise Hoeffding bound 2exp(−Dε²/8), how many features make the probability of an error of at least 0.05 at a given pair no more than 0.01?</p>,
      answer: { kind: "numeric", value: 16955, tolerance: 1 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>For which kernel does the random Fourier feature construction not apply directly?</p>,
      answer: {
        kind: "choice",
        options: [
          "The polynomial kernel (1 + xᵀy)³, because it is not a function of x − y",
          "The Gaussian kernel, because its feature space is infinite-dimensional",
          "The Laplace kernel exp(−‖x − y‖₁), because its spectral measure has heavy tails",
          "Any kernel on ℝ¹⁰⁰, because the frequencies cannot be sampled in high dimension",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math, random

def sample_features(D, sigma, seed):
    rng = random.Random(seed)
    return [(rng.gauss(0, 1 / sigma), rng.uniform(0, 2 * math.pi)) for _ in range(D)]

def feature_map(x, feats):
    c = math.sqrt(2 / len(feats))
    return [c * math.cos(w * x + b) for w, b in feats]

def approx_kernel(x, y, feats):
    return sum(u * v for u, v in zip(feature_map(x, feats), feature_map(y, feats)))

feats = [(0.0, 0.0), (1.0, 0.0)]; print(feature_map(0.0, feats), feature_map(math.pi, feats))
print(round(approx_kernel(0.0, math.pi, feats), 4), round(approx_kernel(1.0, 1.0, [(2.0, 0.5)]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 1.0] [1.0, -1.0]\n0.0 1.2837",
          "[1.0, 1.0] [1.0, -1.0]\n0.0 1.0",
          "[0.7071, 0.7071] [0.7071, -0.7071]\n0.0 0.6418",
          "[1.0, 1.0] [-1.0, -1.0]\n-2.0 1.2837",
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

def features_needed(eps, delta):
    return math.ceil(8 * math.log(2 / delta) / eps ** 2)

def pointwise_bound(D, eps):
    return min(1.0, 2 * math.exp(-D * eps ** 2 / 8))

def speedup(m, D):
    return (m ** 3 / 3) / (m * D * D + D ** 3 / 3)

print(features_needed(0.5, 0.1), features_needed(1.0, 2.0))
print(round(pointwise_bound(32, 0.5), 4), pointwise_bound(0, 0.5), round(speedup(300, 30), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "96 0\n0.7358 1.0 32.26",
          "96 1\n0.7358 1.0 32.26",
          "48 0\n0.7358 2.0 32.26",
          "96 0\n0.3679 1.0 30.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sample_features(D, sigma, seed)</C> returning D pairs (w, b) with w ~ N(0, 1/σ²) and b ~ U[0, 2π) from{" "}
          <C>random.Random(seed)</C>, <C>feature_map(x, feats)</C> for scalar x, and <C>approx_kernel(x, y, feats)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math, random

def sample_features(D, sigma, seed):
    return []

def feature_map(x, feats):
    return [0.0 for _ in feats]

def approx_kernel(x, y, feats):
    return 0.0
`,
        solution: FEATURES,
        tests: [
          { name: "sampling", code: `F = sample_features(4000, 0.5, 3)
ws = [w for w, b in F]; sd = (sum(w * w for w in ws) / len(ws)) ** 0.5
assert len(F) == 4000 and F == sample_features(4000, 0.5, 3) and all(0 <= b < 2 * math.pi for _, b in F) and abs(sd - 2.0) < 0.15` },
          { name: "estimate", code: `assert all(abs(u - v) < 1e-12 for u, v in zip(feature_map(1.0, [(1.0, -1.0), (0.0, math.pi)]), [1.0, -1.0]))
assert abs(approx_kernel(0.0, 0.0, [(2.0, 0.0)]) - 2.0) < 1e-12 and abs(approx_kernel(0.0, 1.0, sample_features(20000, 1.0, 0)) - math.exp(-0.5)) < 0.05` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>features_needed(eps, delta)</C>, the smallest D with 2exp(−Dε²/8) ≤ δ (as a ceiling),{" "}
          <C>pointwise_bound(D, eps)</C>, that bound capped at 1, and <C>speedup(m, D)</C>, the ratio (m³/3)/(mD² + D³/3).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def features_needed(eps, delta):
    return 1

def pointwise_bound(D, eps):
    return 1.0

def speedup(m, D):
    return 1.0
`,
        solution: BUDGET,
        tests: [
          { name: "budget", code: `assert features_needed(0.25, 0.05) == 473 and features_needed(0.5, 0.1) == 96 and features_needed(2.0, 2.0) == 0` },
          { name: "bound and cost", code: `assert abs(pointwise_bound(8, 1.0) - 2 / math.e) < 1e-12 and pointwise_bound(0, 1.0) == 1.0 and abs(speedup(3, 3) - 9 / 36) < 1e-12 and abs(speedup(100, 10) - 1e6 / (3e4 + 1e3)) < 1e-9` },
        ],
      },
    },
    {
      key: "spread",
      rung: "stretch",
      prompt: (
        <p>
          For the Gaussian kernel with σ = 1 in one dimension, find the standard deviation of the estimate z(x)ᵀz(y) when
          |x − y| = 1 and D = 100. Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.084, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Kernels close the course&apos;s study of learning from a fixed sample. Next the data arrive one at a time, perhaps chosen by
        an adversary, and the question becomes how much worse a learner does than the best fixed rule in hindsight: regret.
      </p>
    </>
  ),
};
