import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LaplaceViz } from "@/components/viz/LaplaceViz";
import type { LessonContent } from "@/lib/types";

const LAPLACE = `import math

def sigmoid(z):
    return 1 / (1 + math.exp(-z))

def laplace_1d(xs, ys, prior_prec, steps=50):
    w = 0.0
    for _ in range(steps):
        g = prior_prec * w + sum((sigmoid(w * x) - y) * x for x, y in zip(xs, ys))
        h = prior_prec + sum(sigmoid(w * x) * (1 - sigmoid(w * x)) * x * x for x in xs)
        w -= g / h
    return w, 1 / h

def predictive(x, w, var):
    return sigmoid(w * x / math.sqrt(1 + math.pi * var * x * x / 8))`;

const SAMPLERS = `import math

def gaussian_kl(mu, var, prior_var):
    r = var / prior_var
    return 0.5 * (r + mu * mu / prior_var - 1 - math.log(r))

def sgld_step(w, grad_u, step, z):
    return w - 0.5 * step * grad_u + math.sqrt(step) * z

def dropout_forward(weights, x, mask, p):
    return sum(w * xi * m for w, xi, m in zip(weights, x, mask)) / (1 - p)`;

export const lesson: LessonContent = {
  id: "l7.7.3",
  minutes: 45,
  links: {
    requires: ["l7.7.1", "l2.5.3", "l7.6.3"],
    revisits: ["l3.7.2", "l7.7.2", "m13.4.1"],
    foreshadows: ["l7.7.4"],
  },

  puzzle: (
    <>
      <p>
        A logistic regression is fitted to points between −2 and 2. Asked about x = 6, the fitted model answers 0.995: it has
        never seen anything there, yet it is all but certain. The data are compatible with many weight vectors, some steep,
        some shallow, and they disagree sharply at x = 6. Averaging over them would give a humbler answer. But the posterior
        over the millions of weights of a real network has no closed form. Which approximations are good enough, and what do
        they cost?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Bayesian inference predicts by averaging over weights in proportion to how well they explain the data,{" "}
        <M>{"p(y \\mid x, \\mathcal D) = \\int p(y \\mid x, \\theta)\\, p(\\theta \\mid \\mathcal D)\\, d\\theta"}</M>. Every
        practical method replaces the posterior with something tractable: a Gaussian centred on the trained weights, a
        family of distributions fitted by optimisation, the random sub-networks produced by dropout, or a Markov chain that
        wanders through weight space. Even a crude posterior can fix the worst failure, overconfidence far from the data.
      </p>
      <LaplaceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the Laplace approximation">
        <p>
          Find the MAP weights <M>{"\\theta^*"}</M> and approximate the posterior by{" "}
          <M>{"\\mathcal N(\\theta^*, H^{-1})"}</M>, where H is the Hessian of the negative log-posterior at{" "}
          <M>{"\\theta^*"}</M>. It is the second-order Taylor expansion of the log-posterior around its mode, so it needs no
          change to training: only a curvature estimate afterwards (<C>laplace_1d</C>).
        </p>
      </Definition>

      <Theorem title="the probit approximation">
        <p>
          If the logit <M>{"a = \\theta^\\top x"}</M> is Gaussian with mean μ and variance <M>{"s^2"}</M>, then
        </p>
        <MD>{"\\mathbb E[\\sigma(a)] \\approx \\sigma\\!\\left(\\frac{\\mu}{\\sqrt{1 + \\pi s^2 / 8}}\\right)."}</MD>
      </Theorem>
      <Proof>
        <p>
          The logistic function is close to a scaled Gaussian cumulative distribution, <M>{"\\sigma(a) \\approx \\Phi(\\lambda a)"}</M>{" "}
          with <M>{"\\lambda^2 = \\pi / 8"}</M>, chosen so the slopes agree at 0. For Gaussian a,{" "}
          <M>{"\\mathbb E[\\Phi(\\lambda a)] = \\Phi\\big(\\lambda\\mu / \\sqrt{1 + \\lambda^2 s^2}\\big)"}</M> exactly, because{" "}
          <M>{"\\Phi(\\lambda a)"}</M> is the probability that a standard normal variable is below <M>{"\\lambda a"}</M>. Converting
          back with <M>{"\\Phi(\\lambda u) \\approx \\sigma(u)"}</M> gives the result (<C>predictive</C>). Under the Laplace
          posterior the logit variance is <M>{"s^2 = x^\\top H^{-1} x"}</M>, which grows with the distance from the data, so
          the prediction is pulled towards 1/2 there. MacKay used this in 1992; for networks it is applied to the last layer or
          with a generalised Gauss-Newton approximation to H.
        </p>
        <Code>{LAPLACE}</Code>
      </Proof>

      <Definition title="variational inference over weights">
        <p>
          Choose a family <M>{"q_\\phi(\\theta)"}</M>, usually a Gaussian with a diagonal covariance, and maximise the ELBO
          (l2.5.3), <M>{"\\mathbb E_{q}[\\log p(\\mathcal D \\mid \\theta)] - \\mathrm{KL}(q_\\phi \\,\\|\\, p)"}</M>, with the
          reparameterisation trick. For a Gaussian per weight and prior <M>{"\\mathcal N(0, s_0^2)"}</M> the penalty has a closed
          form (<C>gaussian_kl</C>). This is Bayes by Backprop (Blundell et al., 2015). Mean-field Gaussians are known to
          underestimate uncertainty between separated regions of data, since the reverse KL prefers to cover one mode.
        </p>
      </Definition>

      <Theorem title="dropout as approximate inference">
        <p>
          Gal and Ghahramani (2016) showed that training with dropout and weight decay maximises an ELBO for a posterior whose
          samples are the network with random units removed. Keeping dropout on at test time and averaging T stochastic forward
          passes (Monte Carlo dropout) approximates the predictive distribution.
        </p>
      </Theorem>
      <Proof>
        <p>
          Sketch: take q to put each row of a weight matrix either at a learned value or at zero, with the dropout
          probability, scaled so the expectation matches (<C>dropout_forward</C>, l3.7.2). The expected log-likelihood term
          of the ELBO is the usual training loss evaluated with a random mask, and the KL to a Gaussian prior reduces, up to
          constants, to an L2 penalty on the learned values. A forward pass with a fresh mask is a sample from q.
        </p>
      </Proof>

      <Definition title="stochastic-gradient Langevin dynamics">
        <p>
          Run Langevin dynamics (l7.6.3) on the potential <M>{"U(\\theta) = -\\log p(\\theta \\mid \\mathcal D)"}</M>, with a
          minibatch estimate of <M>{"\\nabla U"}</M>:{" "}
          <M>{"\\theta \\leftarrow \\theta - \\tfrac{\\epsilon}{2} \\nabla U + \\sqrt{\\epsilon}\\, z"}</M> (<C>sgld_step</C>).
          As the step shrinks, the injected noise dominates the minibatch noise and the iterates sample the posterior
          (Welling and Teh, 2011). Unlike Metropolis-Hastings (m13.4.1) there is no accept step, so a finite step size leaves
          a bias.
        </p>
        <Code>{SAMPLERS}</Code>
      </Definition>

      <Remark title="what works in practice">
        <p>
          On large networks, deep ensembles (l7.7.2) usually beat single-mode methods in accuracy and in uncertainty under
          distribution shift, because they cover several modes. Laplace on the last layer is the cheapest retrofit. A puzzle
          remains: with SG-MCMC, raising the posterior to a power, a &ldquo;cold&rdquo; posterior{" "}
          <M>{"p(\\theta \\mid \\mathcal D)^{1/T}"}</M> with T &lt; 1, often predicts better than the true one (Wenzel et al.,
          2020), which suggests that the usual priors or likelihoods are misspecified, for instance by ignoring data
          augmentation.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "kl",
      rung: "check",
      prompt: <p>A weight has variational posterior N(1, 0.5) and prior N(0, 1). What is the KL penalty for this weight? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.5966, tolerance: 0.0001 },
    },
    {
      key: "probit",
      rung: "check",
      prompt: <p>Under a Laplace posterior, the logit at an input has mean 3 and variance 1. Use the probit approximation to give the predictive probability, to four decimals.</p>,
      answer: { kind: "numeric", value: 0.927, tolerance: 0.0001 },
    },
    {
      key: "retro",
      rung: "apply",
      prompt: <p>A large network has already been trained, without dropout. Which method adds uncertainty estimates without retraining it?</p>,
      answer: {
        kind: "choice",
        options: [
          "The Laplace approximation, which needs only the trained weights and a curvature estimate at them",
          "Monte Carlo dropout, by switching dropout on at test time",
          "Mean-field variational inference, by reading off the variances of the weights",
          "Stochastic-gradient Langevin dynamics with zero step size",
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

def sigmoid(z):
    return 1 / (1 + math.exp(-z))

def laplace_1d(xs, ys, prior_prec, steps=50):
    w = 0.0
    for _ in range(steps):
        g = prior_prec * w + sum((sigmoid(w * x) - y) * x for x, y in zip(xs, ys))
        h = prior_prec + sum(sigmoid(w * x) * (1 - sigmoid(w * x)) * x * x for x in xs)
        w -= g / h
    return w, 1 / h

def predictive(x, w, var):
    return sigmoid(w * x / math.sqrt(1 + math.pi * var * x * x / 8))

w, v = laplace_1d([1, -1], [1, 0], 1.0); print(round(w, 4), round(v, 4))
print(round(predictive(0, 5, 2), 4), round(predictive(2, 1, 0), 4), round(predictive(2, 1, 8), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.6748 0.691\n0.5 0.8808 0.6325",
          "0.6748 0.691\n0.5 0.8808 0.8808",
          "0.6748 1.4472\n0.5 0.8808 0.6325",
          "0.6748 0.691\n0.9933 0.8808 0.6325",
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

def gaussian_kl(mu, var, prior_var):
    r = var / prior_var
    return 0.5 * (r + mu * mu / prior_var - 1 - math.log(r))

def sgld_step(w, grad_u, step, z):
    return w - 0.5 * step * grad_u + math.sqrt(step) * z

def dropout_forward(weights, x, mask, p):
    return sum(w * xi * m for w, xi, m in zip(weights, x, mask)) / (1 - p)

print(round(gaussian_kl(0, 1, 1), 4), round(gaussian_kl(1, 2, 2), 4), sgld_step(1.0, 2.0, 0.25, 0.0), sgld_step(0.0, 0.0, 0.04, -1.0))
print(dropout_forward([1, 2, 3], [1, 1, 1], [1, 0, 1], 0.5), dropout_forward([2, 2], [1, 3], [0, 0], 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 0.25 0.75 -0.2\n8.0 0.0",
          "0.0 0.25 0.75 -0.2\n4.0 0.0",
          "0.0 0.5 0.75 -0.2\n8.0 0.0",
          "0.0 0.25 0.5 -0.2\n8.0 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sigmoid(z)</C>, <C>laplace_1d(xs, ys, prior_prec, steps=50)</C>, which finds the MAP weight of a
          one-weight logistic regression by Newton&apos;s method and returns it with the Laplace variance, and{" "}
          <C>predictive(x, w, var)</C> using the probit approximation.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def sigmoid(z):
    return 1 / (1 + math.exp(-z))

def laplace_1d(xs, ys, prior_prec, steps=50):
    return 0.0, 1 / prior_prec

def predictive(x, w, var):
    return sigmoid(w * x)
`,
        solution: LAPLACE,
        tests: [
          { name: "laplace", code: `w, v = laplace_1d([2.0], [1], 1.0)
assert abs(w - 2 * (1 - sigmoid(2 * w))) < 1e-9 and abs(v - 1 / (1 + 4 * sigmoid(2 * w) * (1 - sigmoid(2 * w)))) < 1e-9
w, v = laplace_1d([1, -1, 1, -1], [1, 1, 0, 0], 2.0); assert abs(w) < 1e-12 and abs(v - 1 / 3) < 1e-12` },
          { name: "predictive", code: `assert abs(predictive(1, 2, 0) - sigmoid(2)) < 1e-12 and abs(predictive(2, 1, 1) - sigmoid(2 / math.sqrt(1 + math.pi / 2))) < 1e-12 and predictive(0, 4, 9) == 0.5` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gaussian_kl(mu, var, prior_var)</C>, the KL divergence from N(mu, var) to N(0, prior_var),{" "}
          <C>sgld_step(w, grad_u, step, z)</C>, one Langevin update with standard normal draw z, and{" "}
          <C>dropout_forward(weights, x, mask, p)</C>, a linear unit with inputs dropped by a 0/1 mask and rescaled for keep
          probability 1 − p.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def gaussian_kl(mu, var, prior_var):
    return 0.0

def sgld_step(w, grad_u, step, z):
    return w - step * grad_u

def dropout_forward(weights, x, mask, p):
    return sum(w * xi for w, xi in zip(weights, x))
`,
        solution: SAMPLERS,
        tests: [
          { name: "kl", code: `assert abs(gaussian_kl(0, 0.25, 1) - 0.5 * (0.25 - 1 + math.log(4))) < 1e-12 and abs(gaussian_kl(3, 4, 4) - 9 / 8) < 1e-12 and gaussian_kl(0, 2, 2) == 0` },
          { name: "langevin and dropout", code: `assert abs(sgld_step(2.0, 4.0, 0.09, 1.0) - (2.0 - 0.18 + 0.3)) < 1e-12 and sgld_step(1.0, 0.0, 0.0, 5.0) == 1.0
assert abs(dropout_forward([1, 1, 1, 1], [1, 2, 3, 4], [1, 1, 0, 0], 0.5) - 6.0) < 1e-12 and abs(dropout_forward([2], [3], [1], 0.25) - 8.0) < 1e-12` },
        ],
      },
    },
    {
      key: "limit",
      rung: "stretch",
      prompt: (
        <p>
          A one-weight logistic model with no bias has Laplace posterior w ~ N(2, 4). Using the probit approximation, what
          predictive probability does it approach as x grows without bound? Give three decimals. (The MAP prediction tends to 1.)
        </p>
      ),
      answer: { kind: "numeric", value: 0.831, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        All of these methods promise probabilities that mean what they say. The last lesson of the course checks that
        promise: how to measure calibration, why modern networks are overconfident, and the simple fixes that work.
      </p>
    </>
  ),
};
