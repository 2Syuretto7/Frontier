import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CholeskySampleViz } from "@/components/viz/CholeskySampleViz";
import type { LessonContent } from "@/lib/types";

const RP = `import numpy as np

def mvn_sample(mu, Sigma, eps):
    L = np.linalg.cholesky(Sigma)
    return mu + eps @ L.T

def reparam_grad(f_prime, mu, sigma, eps):
    x = mu + sigma * eps; g = f_prime(x)
    return float(np.mean(g)), float(np.mean(g * eps))

def score_grad(f, mu, sigma, eps):
    x = mu + sigma * eps; fx = f(x)
    return float(np.mean(fx * eps / sigma)), float(np.mean(fx * (eps ** 2 - 1) / sigma))`;

const CV = `import numpy as np

def lognormal_logpdf(y, mu, s):
    x = np.log(y)
    return -0.5 * ((x - mu) / s) ** 2 - np.log(s * np.sqrt(2 * np.pi)) - x

def affine_flow_logpdf(y, A, b):
    z = np.linalg.solve(A, (y - b).T).T; d = A.shape[0]
    return -0.5 * np.sum(z ** 2, axis=1) - 0.5 * d * np.log(2 * np.pi) - np.log(abs(np.linalg.det(A)))`;

export const lesson: LessonContent = {
  id: "m13.2.4",
  minutes: 50,
  links: {
    requires: ["m13.2.1"],
    revisits: ["m7.3.4", "m13.2.3"],
    foreshadows: ["m13.6.1", "m13.6.2"],
  },

  puzzle: (
    <>
      <p>
        A variational autoencoder must adjust the mean and spread of a Gaussian so that samples drawn from it decode well.
        But a sample is random: how do you differentiate a random draw with respect to the parameters of the distribution
        it came from? The answer is to stop treating the sample as an opaque draw and write it as a fixed function of the
        parameters and some noise that does not depend on them. Then the chain rule just works.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Draw standard normal noise ε once, and form <M>{"x = \\mu + \\sigma\\varepsilon"}</M>. The randomness lives entirely in
        ε; the parameters act through an ordinary, differentiable formula. Change σ slightly and every sample moves slightly,
        in a predictable direction. The same idea builds correlated Gaussians from independent ones, and, run with an
        invertible map and its Jacobian, gives the density of the transformed variable, which is how normalising flows are
        built.
      </p>
      <CholeskySampleViz />
    </>
  ),

  theory: (
    <>
      <Definition title="reparameterisation">
        <p>
          A family <M>{"p_\\theta"}</M> is reparameterised by a fixed base distribution r and a map{" "}
          <M>{"g_\\theta"}</M> when <M>{"X = g_\\theta(\\varepsilon)"}</M> with <M>{"\\varepsilon \\sim r"}</M> has law{" "}
          <M>{"p_\\theta"}</M> for every θ. The location-scale map <M>{"\\mu + \\sigma\\varepsilon"}</M> and inversion{" "}
          <M>{"F_\\theta^{-1}(U)"}</M> are the basic examples.
        </p>
      </Definition>

      <Theorem title="correlated Gaussians from independent ones">
        <p>
          If <M>{"\\Sigma = LL^\\top"}</M> (for instance its Cholesky factorisation) and <M>{"\\varepsilon \\sim N(0, I)"}</M>, then{" "}
          <M>{"X = \\mu + L\\varepsilon \\sim N(\\mu, \\Sigma)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          An affine image of a Gaussian vector is Gaussian, with mean μ and covariance{" "}
          <M>{"\\mathbb E[L\\varepsilon\\varepsilon^\\top L^\\top] = LIL^\\top = \\Sigma"}</M>. For{" "}
          <M>{"\\Sigma = \\begin{pmatrix} 4 & 2 \\\\ 2 & 3\\end{pmatrix}"}</M>, <M>{"L_{11} = 2"}</M>, <M>{"L_{21} = 1"}</M> and{" "}
          <M>{"L_{22} = \\sqrt 2"}</M>. With samples stored as rows, the map is <C>eps @ L.T</C>.
        </p>
      </Proof>

      <Theorem title="pathwise gradients">
        <p>
          If f is differentiable and dominated convergence applies, then{" "}
          <M>{"\\nabla_\\theta\\, \\mathbb E[f(g_\\theta(\\varepsilon))] = \\mathbb E\\bigl[\\nabla f(g_\\theta(\\varepsilon))^\\top \\partial_\\theta g_\\theta(\\varepsilon)\\bigr]"}</M>.
          For <M>{"x = \\mu + \\sigma\\varepsilon"}</M> the two derivatives are <M>{"\\mathbb E[f'(x)]"}</M> and{" "}
          <M>{"\\mathbb E[f'(x)\\,\\varepsilon]"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Because the law of ε does not depend on θ, the expectation is an integral against a fixed measure, and
          differentiating under the integral sign is the chain rule applied pointwise. The alternative, the score-function
          form <M>{"\\mathbb E[f(X)\\nabla_\\theta \\log p_\\theta(X)]"}</M>, is also unbiased and needs no derivative of f, but for{" "}
          <M>{"f(x) = x^2"}</M>, μ = 1, σ = 2 its standard deviation over 1,000 samples is two to three times larger. The full
          comparison comes at the end of the course.
        </p>
        <Code>{RP}</Code>
      </Proof>

      <Theorem title="change of variables">
        <p>
          If <M>{"Y = T(Z)"}</M> with T a smooth bijection with smooth inverse, then{" "}
          <M>{"\\log p_Y(y) = \\log p_Z(T^{-1}(y)) + \\log\\bigl|\\det J_{T^{-1}}(y)\\bigr|"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For any region A, <M>{"P(Y \\in A) = P(Z \\in T^{-1}(A)) = \\int_{T^{-1}(A)} p_Z(z)\\,dz"}</M>; substituting{" "}
          <M>{"z = T^{-1}(y)"}</M> multiplies the integrand by the absolute Jacobian determinant. For{" "}
          <M>{"Y = e^Z"}</M>, <M>{"T^{-1} = \\log"}</M> with derivative 1/y, giving the lognormal density with its extra{" "}
          <M>{"-\\log y"}</M>. For an affine map <M>{"y = Az + b"}</M> the correction is <M>{"-\\log|\\det A|"}</M>. A normalising
          flow composes many such maps chosen so that inverses and determinants are cheap.
        </p>
        <Code>{CV}</Code>
      </Proof>

      <Remark title="what cannot be reparameterised directly">
        <p>
          Discrete variables have no useful pathwise derivative: a small change in θ either changes the sample by a jump or not
          at all. The Gumbel-softmax relaxation of the last lesson trades exactness for a gradient. Gamma, beta and Dirichlet
          distributions have no simple location-scale form; implicit reparameterisation differentiates the inverse CDF
          relation <M>{"F_\\theta(x) = u"}</M> to get <M>{"\\partial x/\\partial\\theta = -\\partial_\\theta F / p_\\theta(x)"}</M> without
          inverting F. In a variational autoencoder, the reparameterised Gaussian is what lets the encoder be trained by
          ordinary backpropagation.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "chol",
      rung: "check",
      prompt: (
        <p>
          The Cholesky factor of <M>{"\\begin{pmatrix} 4 & 2 \\\\ 2 & 3\\end{pmatrix}"}</M> is lower triangular. What is its bottom-right entry?
          Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.414, tolerance: 0.001 },
    },
    {
      key: "lognorm",
      rung: "check",
      prompt: <p>Y = e^Z with Z standard normal. What is the density of Y at y = e? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.089, tolerance: 0.0001 },
    },
    {
      key: "fixed",
      rung: "apply",
      prompt: <p>What makes the pathwise gradient valid for x = μ + σε?</p>,
      answer: {
        kind: "choice",
        options: [
          "The distribution of ε does not depend on μ or σ, so the derivative can pass inside the expectation",
          "The function f must be linear",
          "ε must be uniform",
          "μ and σ must be estimated from data first",
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

def mvn_sample(mu, Sigma, eps):
    L = np.linalg.cholesky(Sigma)
    return mu + eps @ L.T

def reparam_grad(f_prime, mu, sigma, eps):
    x = mu + sigma * eps; g = f_prime(x)
    return float(np.mean(g)), float(np.mean(g * eps))

def score_grad(f, mu, sigma, eps):
    x = mu + sigma * eps; fx = f(x)
    return float(np.mean(fx * eps / sigma)), float(np.mean(fx * (eps ** 2 - 1) / sigma))

eps = np.random.default_rng(0).normal(size=(100000, 2)); x = mvn_sample(np.array([1.0, -1.0]), np.array([[4.0, 2.0], [2.0, 3.0]]), eps)
print(np.round(np.cov(x.T), 1).tolist(), np.round(x.mean(axis=0), 1).tolist())
e = eps[:, 0]; print([round(v, 1) for v in reparam_grad(lambda t: 2 * t, 1.0, 2.0, e)], [round(v, 1) for v in score_grad(lambda t: t ** 2, 1.0, 2.0, e)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[4.0, 2.0], [2.0, 3.0]] [1.0, -1.0]\n[2.0, 4.0] [2.0, 4.1]",
          "[[2.0, 1.0], [1.0, 1.4]] [1.0, -1.0]\n[2.0, 4.0] [2.0, 4.1]",
          "[[4.0, 2.0], [2.0, 3.0]] [0.0, 0.0]\n[2.0, 4.0] [2.0, 4.1]",
          "[[4.0, 2.0], [2.0, 3.0]] [1.0, -1.0]\n[2.0, 2.0] [2.0, 4.1]",
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

def lognormal_logpdf(y, mu, s):
    x = np.log(y)
    return -0.5 * ((x - mu) / s) ** 2 - np.log(s * np.sqrt(2 * np.pi)) - x

def affine_flow_logpdf(y, A, b):
    z = np.linalg.solve(A, (y - b).T).T; d = A.shape[0]
    return -0.5 * np.sum(z ** 2, axis=1) - 0.5 * d * np.log(2 * np.pi) - np.log(abs(np.linalg.det(A)))

print(round(float(np.exp(lognormal_logpdf(np.array([1.0]), 0.0, 1.0))[0]), 4), round(float(np.sum(np.exp(lognormal_logpdf(np.linspace(1e-6, 60, 200001), 0.0, 1.0))) * 60 / 200000), 3))
print(round(float(affine_flow_logpdf(np.array([[3.0, 1.0]]), np.array([[2.0, 0.0], [0.0, 0.5]]), np.array([3.0, 1.0]))[0]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.3989 1.0\n-1.8379", "0.3989 1.0\n-0.9189", "0.242 1.0\n-1.8379", "0.3989 0.5\n-1.8379"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mvn_sample(mu, Sigma, eps)</C> for noise stored as rows; <C>reparam_grad(f_prime, mu, sigma, eps)</C>, the
          pathwise estimates of the derivatives of <M>{"\\mathbb E f(\\mu + \\sigma\\varepsilon)"}</M> in μ and σ; and{" "}
          <C>score_grad(f, mu, sigma, eps)</C>, the score-function estimates of the same two derivatives.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def mvn_sample(mu, Sigma, eps):
    return mu + eps

def reparam_grad(f_prime, mu, sigma, eps):
    return 0.0, 0.0

def score_grad(f, mu, sigma, eps):
    return 0.0, 0.0
`,
        solution: RP,
        tests: [
          { name: "mvn", code: `S = np.array([[4.0, 2.0], [2.0, 3.0]]); x = mvn_sample(np.zeros(2), S, np.eye(2)); assert np.allclose(x.T @ x, S) and np.allclose(mvn_sample(np.array([1.0, 2.0]), S, np.zeros((3, 2))), [[1, 2]] * 3)` },
          { name: "grads", code: `e = np.array([-1.0, 1.0]); assert np.allclose(reparam_grad(lambda t: 2 * t, 1.5, 0.5, e), [3.0, 1.0])
assert np.allclose(score_grad(lambda t: t, 1.5, 0.5, e), [1.0, 0.0]) and np.allclose(score_grad(lambda t: t ** 2, 0.0, 1.0, e), [0.0, 0.0])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Using the change of variables formula, write <C>lognormal_logpdf(y, mu, s)</C> and{" "}
          <C>affine_flow_logpdf(y, A, b)</C> for rows y = A z + b with z standard normal.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def lognormal_logpdf(y, mu, s):
    return -0.5 * ((y - mu) / s) ** 2

def affine_flow_logpdf(y, A, b):
    return np.zeros(len(y))
`,
        solution: CV,
        tests: [
          { name: "lognormal", code: `assert np.isclose(lognormal_logpdf(np.array([np.e]), 0.0, 1.0)[0], -0.5 - 0.5 * np.log(2 * np.pi) - 1)` },
          { name: "flow", code: `A = np.array([[2.0, 0.0], [1.0, 1.0]]); b = np.array([1.0, -1.0]); y = np.array([[1.0, -1.0], [2.0, 0.5]]); S = A @ A.T
d = y - b; ref = -0.5 * np.einsum("ij,jk,ik->i", d, np.linalg.inv(S), d) - np.log(2 * np.pi) - 0.5 * np.log(np.linalg.det(S))
assert np.allclose(affine_flow_logpdf(y, A, b), ref)` },
        ],
      },
    },
    {
      key: "expgrad",
      rung: "stretch",
      prompt: (
        <p>
          For <M>{"f(x) = e^x"}</M> and <M>{"x = \\mu + \\sigma\\varepsilon"}</M>, what is the exact derivative of{" "}
          <M>{"\\mathbb E f(x)"}</M> with respect to σ at μ = 0, σ = 1? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.6487, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Independent samples are a luxury. The next section builds samplers from Markov chains, which wander in a way that
        eventually visits each region in proportion to its probability. First, what it means for a chain to forget its
        starting point: ergodicity.
      </p>
    </>
  ),
};
