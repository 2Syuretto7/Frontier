import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ExpFamilyViz } from "@/components/viz/ExpFamilyViz";
import type { LessonContent } from "@/lib/types";

const LOGPART = `import math

def bern_A(eta):
    return math.log1p(math.exp(eta))

def num_moments(A, eta, h=1e-4):
    d1 = (A(eta + h) - A(eta - h)) / (2 * h)
    d2 = (A(eta + h) - 2 * A(eta) + A(eta - h)) / (h * h)
    return d1, d2`;

const SOFTMAX = `import numpy as np

def log_partition(eta):
    m = eta.max()
    return m + np.log(np.exp(eta - m).sum())

def fit_categorical(counts, steps=500, lr=1.0):
    counts = np.asarray(counts, dtype=float)
    freq = counts / counts.sum()
    eta = np.zeros(len(counts))
    for _ in range(steps):
        eta -= lr * (np.exp(eta - log_partition(eta)) - freq)
    return eta - eta[0]`;

export const lesson: LessonContent = {
  id: "m9.3.2",
  minutes: 55,
  links: {
    requires: ["m9.3.1", "m9.2.2"],
    revisits: ["m5.4.4", "m7.4.1"],
    foreshadows: ["m9.3.3", "m9.7.2"],
  },

  puzzle: (
    <>
      <p>
        The Bernoulli, Poisson, normal, exponential, gamma, beta and categorical distributions look unrelated. Yet in each,
        the maximum likelihood estimate comes from setting a model mean equal to a sample mean, and a sufficient statistic
        of fixed size exists. Is there one shape that all of them share?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Write the log-density as a linear function of a parameter, minus a normaliser. Everything else follows from that
        normaliser: its derivatives give the mean and variance, its convexity makes the likelihood easy to maximise.
      </p>
      <ExpFamilyViz />
    </>
  ),

  theory: (
    <>
      <Definition title="exponential family">
        <p>A family of densities or mass functions is an exponential family in canonical form if</p>
        <MD>{"f(x; \\eta) = h(x)\\exp\\big(\\eta^\\top T(x) - A(\\eta)\\big),"}</MD>
        <p>
          with natural parameter η, sufficient statistic T(x) and log-partition function{" "}
          <M>{"A(\\eta) = \\log \\int h(x) e^{\\eta^\\top T(x)}\\,dx"}</M>. By factorisation, T is sufficient.
        </p>
      </Definition>

      <Example title="familiar members">
        <p>
          Bernoulli: <M>{"p^x(1-p)^{1-x} = \\exp(x \\log\\tfrac{p}{1-p} - \\log\\tfrac{1}{1-p})"}</M>, so η is the logit of p,
          T(x) = x and <M>{"A(\\eta) = \\log(1 + e^\\eta)"}</M>. Poisson: <M>{"\\eta = \\log\\lambda"}</M>,{" "}
          <M>{"A = e^\\eta"}</M>, h(x) = 1/x!. Normal with known σ = 1: T(x) = x, η = μ, A = η²/2. Categorical with K
          classes: T(x) is the one-hot vector, and A(η) = log Σ e^(η_k) is log-sum-exp, whose gradient is the softmax.
        </p>
      </Example>

      <Theorem title="derivatives of the log-partition">
        <p>Where A is finite and differentiable,</p>
        <MD>{"\\nabla A(\\eta) = \\mathbb{E}_\\eta[T(X)], \\qquad \\nabla^2 A(\\eta) = \\mathrm{Cov}_\\eta(T(X))."}</MD>
        <p>In particular A is convex.</p>
      </Theorem>
      <Proof>
        <p>
          Differentiate <M>{"e^{A(\\eta)} = \\int h(x) e^{\\eta^\\top T(x)}\\,dx"}</M> under the integral:{" "}
          <M>{"e^{A}\\nabla A = \\int T h e^{\\eta^\\top T}\\,dx"}</M>; dividing by <M>{"e^A"}</M> gives{" "}
          <M>{"\\nabla A = \\mathbb{E}[T]"}</M>. Differentiating{" "}
          <M>{"\\nabla A = \\int T\\, h e^{\\eta^\\top T - A}\\,dx"}</M> once more gives{" "}
          <M>{"\\nabla^2 A = \\mathbb{E}[T T^\\top] - \\mathbb{E}[T]\\mathbb{E}[T]^\\top"}</M>, a covariance matrix, which is
          positive semidefinite.
        </p>
        <Code>{LOGPART}</Code>
      </Proof>

      <Theorem title="maximum likelihood is moment matching">
        <p>
          For an iid sample the log-likelihood is <M>{"\\ell(\\eta) = \\eta^\\top \\sum T(x_i) - nA(\\eta) + \\text{const}"}</M>,
          which is concave. Its stationary points, which are therefore maxima, solve
        </p>
        <MD>{"\\nabla A(\\hat\\eta) = \\frac1n \\sum_{i=1}^n T(x_i)."}</MD>
      </Theorem>
      <Proof>
        <p>
          The first term is linear in η and −nA is concave by the previous theorem, so ℓ is concave. Its gradient is{" "}
          <M>{"\\sum T(x_i) - n\\nabla A(\\eta)"}</M>, and a stationary point of a concave function is a global maximum.
        </p>
      </Proof>

      <Example title="fitting a categorical by its natural parameters">
        <p>
          The gradient of the average negative log-likelihood is softmax(η) minus the observed frequencies, exactly the
          familiar gradient of softmax cross-entropy. Gradient descent drives softmax(η) to the frequencies, so η converges
          to the log frequencies up to an additive constant; subtracting η₀ removes it. The log-partition is computed by
          subtracting the maximum first, so large η do not overflow.
        </p>
        <Code>{SOFTMAX}</Code>
      </Example>

      <Remark title="why the shape matters">
        <p>
          Exponential families are exactly the maximum entropy distributions under moment constraints, they have conjugate
          priors (a later chapter), and generalised linear models make η a linear function of features: logistic regression
          is the Bernoulli case and Poisson regression the Poisson case. The final softmax layer of a classifier is a
          categorical exponential family whose natural parameters are the logits.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "logit",
      rung: "check",
      prompt: <p>A Bernoulli distribution has p = 0.8. What is its natural parameter η = log(p/(1 − p))? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 1.3863, tolerance: 0.0001 },
    },
    {
      key: "pois",
      rung: "check",
      prompt: <p>For the Poisson family with A(η) = e^η, what is the variance of X when η = log 5?</p>,
      answer: { kind: "numeric", value: 5, tolerance: 0.0001 },
    },
    {
      key: "grad",
      rung: "apply",
      prompt: <p>For the categorical family with natural parameters η, what is the gradient of the log-partition A(η) = log Σ e^(η_k)?</p>,
      answer: { kind: "choice", options: ["softmax(η), the vector of class probabilities", "η itself", "The vector of all ones", "exp(η)"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def bern_A(eta):
    return math.log1p(math.exp(eta))

def num_moments(A, eta, h=1e-4):
    d1 = (A(eta + h) - A(eta - h)) / (2 * h)
    d2 = (A(eta + h) - 2 * A(eta) + A(eta - h)) / (h * h)
    return d1, d2

print(round(bern_A(0.0), 4), [round(v, 4) for v in num_moments(bern_A, 0.0)])
print([round(v, 4) for v in num_moments(math.exp, math.log(3))])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.6931 [0.5, 0.25]\n[3.0, 3.0]", "0.6931 [0.5, 0.5]\n[3.0, 9.0]", "0.0 [0.5, 0.25]\n[3.0, 3.0]", "0.6931 [0.25, 0.5]\n[3.0, 3.0]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def log_partition(eta):
    m = eta.max()
    return m + np.log(np.exp(eta - m).sum())

def fit_categorical(counts, steps=500, lr=1.0):
    counts = np.asarray(counts, dtype=float)
    freq = counts / counts.sum()
    eta = np.zeros(len(counts))
    for _ in range(steps):
        eta -= lr * (np.exp(eta - log_partition(eta)) - freq)
    return eta - eta[0]

print(round(float(log_partition(np.array([1000.0, 1000.0]))), 4))
print([round(float(v), 4) for v in fit_categorical([2, 3, 5])])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1000.6931\n[0.0, 0.4055, 0.9163]", "inf\n[0.0, 0.4055, 0.9163]", "1000.6931\n[0.2, 0.3, 0.5]", "1000.0\n[0.0, 0.4055, 0.9163]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bern_A(eta)</C>, the Bernoulli log-partition log(1 + e^η), and <C>num_moments(A, eta, h=1e-4)</C>,
          returning central finite difference estimates of A′(η) and A″(η).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def bern_A(eta):
    return 0.0

def num_moments(A, eta, h=1e-4):
    return 0.0, 0.0
`,
        solution: LOGPART,
        tests: [
          { name: "A", code: `import math
assert abs(bern_A(1.0) - math.log(1 + math.e)) < 1e-12` },
          { name: "moments", code: `import math
m, v = num_moments(bern_A, 1.0)
p = 1 / (1 + math.exp(-1))
assert abs(m - p) < 1e-6 and abs(v - p * (1 - p)) < 1e-5
m, v = num_moments(lambda e: e * e / 2, 0.7)
assert abs(m - 0.7) < 1e-6 and abs(v - 1) < 1e-4` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>log_partition(eta)</C>, a numerically stable log Σ exp(η_k), and{" "}
          <C>fit_categorical(counts, steps=500, lr=1.0)</C>, which starts at η = 0, runs gradient descent with gradient
          softmax(η) − frequencies, and returns η − η₀.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def log_partition(eta):
    return float(np.log(np.exp(eta).sum()))

def fit_categorical(counts, steps=500, lr=1.0):
    return np.zeros(len(counts))
`,
        solution: SOFTMAX,
        tests: [
          { name: "lse", code: `import numpy as np
assert abs(log_partition(np.array([800.0, 0.0])) - 800) < 1e-9
assert abs(log_partition(np.array([0.0, 0.0, 0.0])) - np.log(3)) < 1e-12` },
          { name: "fit", code: `import numpy as np
eta = fit_categorical([1, 1, 2])
assert np.allclose(eta, [0, 0, np.log(2)], atol=1e-4)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>For a one-parameter exponential family f(x; η) = h(x) exp(ηT(x) − A(η)), prove that A′(η) = E[T(X)]. You may differentiate under the integral sign.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Uses normalisation: ∫ h(x) exp(ηT(x) − A(η)) dx = 1, or equivalently e^(A(η)) = ∫ h(x) e^(ηT(x)) dx.",
          "Differentiates with respect to η under the integral, obtaining ∫ (T(x) − A′(η)) f(x; η) dx = 0 or the equivalent.",
          "Concludes E[T(X)] − A′(η) = 0, using ∫ f = 1.",
        ],
      },
    },
    {
      key: "exp",
      rung: "stretch",
      prompt: <p>The exponential distribution λe^(−λx) has T(x) = x, η = −λ and A(η) = −log(−η). Using A″, what is Var X when λ = 0.5?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what an exponential family is, how the Bernoulli, Poisson and categorical distributions fit the form, why the derivatives of the log-partition function give the mean and variance, and why maximum likelihood for these models reduces to matching means.",

  glimpse: (
    <>
      <p>
        The curvature of the log-partition, the variance of T, measured how sharply the likelihood peaks. The next lesson
        turns that curvature into a general quantity for any model, the Fisher information.
      </p>
    </>
  ),
};
