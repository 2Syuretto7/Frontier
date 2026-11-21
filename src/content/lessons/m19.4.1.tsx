import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ReverseSdeViz } from "@/components/viz/ReverseSdeViz";
import type { LessonContent } from "@/lib/types";

const MARG = `import numpy as np

def vp_marginal(m, s2, beta, t):
    a = np.exp(-beta * t / 2)
    return a * m, a ** 2 * s2 + 1 - a ** 2            # Gaussian data N(m, s2) after time t of the VP SDE

def gauss_score(x, mean, var):
    return -(x - mean) / var                          # gradient of log N(mean, var) at x

def reverse_drift(x, t, m, s2, beta):
    mean, var = vp_marginal(m, s2, beta, t)
    return -beta * x / 2 - beta * gauss_score(x, mean, var)   # f - g^2 * score, in forward time`;

const SAMPLER = `import numpy as np

def reverse_sample(x, zs, m, s2, beta, T, n):
    dt = T / n
    for k in range(n):
        t = T - k * dt
        a = np.exp(-beta * t / 2)
        mean, var = a * m, a ** 2 * s2 + 1 - a ** 2
        drift = -beta * x / 2 + beta * (x - mean) / var       # f - g^2 * score
        x = x - drift * dt + np.sqrt(beta * dt) * zs[k]       # step backwards in time
    return x

def sample_stats(xs):
    return float(np.mean(xs)), float(np.var(xs))

def kl_gauss(m1, v1, m2, v2):
    return 0.5 * (np.log(v2 / v1) + (v1 + (m1 - m2) ** 2) / v2 - 1)`;

export const lesson: LessonContent = {
  id: "m19.4.1",
  minutes: 55,
  links: {
    requires: ["m19.3.3", "m19.3.2"],
    revisits: ["m19.1.1", "m18.4.3"],
    foreshadows: ["m19.4.2"],
  },

  puzzle: (
    <>
      <p>
        Adding noise is easy and destroys information: run the variance-preserving SDE long enough and every dataset becomes the same
        Gaussian. Running a film of this process backwards would turn noise into data, but noise has no memory of where it came
        from. Reversing the drift and keeping the noise does not work: paths fly apart. Yet there is a stochastic process, starting
        from pure noise, whose law at every time matches the forward process run backwards. What does its drift have to know?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Watch the forward process backwards in time. The noise term still looks like noise, since Brownian motion reversed is Brownian
        motion in law. But the drift changes: as well as undoing the forward drift, the reversed process must undo the spreading
        caused by noise, which means moving mass back up the density gradient, towards places where the noised data are more
        likely. The correction is <M>{"g^2 \\nabla \\log p_t"}</M>, the noise strength times the score of the density at that time.
        Knowing the score at every noise level is enough to reverse the whole process.
      </p>
      <ReverseSdeViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the reverse-time SDE">
        <p>
          Let <M>{"dX = f(X, t)\\, dt + g(t)\\, dB"}</M> on [0, T] have smooth positive marginal densities <M>{"p_t"}</M>. Define, in
          reverse time <M>{"s = T - t"}</M>,
        </p>
        <MD>{"dY_s = \\left[-f(Y_s, T - s) + g(T - s)^2\\, \\nabla \\log p_{T-s}(Y_s)\\right] ds + g(T - s)\\, dW_s,"}</MD>
        <p>
          with W a Brownian motion and <M>{"Y_0 \\sim p_T"}</M>. Then <M>{"Y_s"}</M> has density <M>{"p_{T-s}"}</M> for every s; in
          particular <M>{"Y_T \\sim p_0"}</M>, the data distribution.
        </p>
      </Theorem>
      <Proof>
        <p>
          We check it in one dimension through Fokker–Planck (m19.3.3). Let <M>{"q(s, x) = p(T - s, x)"}</M>. The forward equation
          gives <M>{"\\partial_s q = -\\partial_t p = \\partial_x(f p) - \\tfrac12 g^2 \\partial_x^2 p"}</M>. The Fokker–Planck equation of
          Y, with drift <M>{"\\bar b = -f + g^2 \\partial_x \\log p"}</M> and the same g, has right side
        </p>
        <MD>{"-\\partial_x\\left((-f + g^2 \\tfrac{\\partial_x p}{p})p\\right) + \\tfrac12 g^2 \\partial_x^2 p = \\partial_x(f p) - g^2\\partial_x^2 p + \\tfrac12 g^2 \\partial_x^2 p,"}</MD>
        <p>
          which equals <M>{"\\partial_x(f p) - \\tfrac12 g^2 \\partial_x^2 p"}</M>. So q solves the Fokker–Planck equation of Y with
          the right initial density, and by uniqueness of its solutions the law of <M>{"Y_s"}</M> is <M>{"q(s, \\cdot)"}</M>. Half of
          the extra drift cancels the forward spreading, and the other half supplies the reverse process&apos;s own spreading. Anderson
          (1982) proved the stronger statement that the whole path of Y has the law of the reversed forward path.
        </p>
      </Proof>

      <Definition title="Gaussian data under the VP SDE">
        <p>
          For data <M>{"N(m, s^2)"}</M> and the VP SDE with constant β, the marginals are Gaussian (m19.3.2), with mean{" "}
          <M>{"\\alpha_t m"}</M> and variance <M>{"\\alpha_t^2 s^2 + 1 - \\alpha_t^2"}</M> (<C>vp_marginal</C>), and the score is
          linear (<C>gauss_score</C>). <C>reverse_drift</C> is <M>{"f - g^2 \\nabla\\log p_t"}</M> in forward time; a step of the reverse
          SDE moves by minus this times dt, plus noise.
        </p>
        <Code>{MARG}</Code>
      </Definition>

      <Definition title="sampling by reversal">
        <p>
          <C>reverse_sample</C> starts from a noise sample at time T and takes n Euler–Maruyama steps backwards with the exact score,
          given the standard normals for each step. <C>sample_stats</C> summarises a batch, and <C>kl_gauss</C> is the KL divergence
          (m18.4.3) between two Gaussians, to compare the result with the data.
        </p>
        <Code>{SAMPLER}</Code>
      </Definition>

      <Example title="reversing Brownian motion from a point">
        <p>
          Take <M>{"f = 0"}</M>, <M>{"g = 1"}</M> and data at the single point 0, so <M>{"p_t = N(0, t)"}</M> and{" "}
          <M>{"\\nabla \\log p_t(x) = -x/t"}</M>. The reverse SDE is <M>{"dY = -\\frac{Y}{T - s} ds + dW"}</M>, the Brownian bridge
          (m19.1.1) pinned to 0 at s = T. Its mean decays linearly, <M>{"\\mathbb{E}[Y_s] = Y_0 (T - s)/T"}</M>, and the drift grows
          without bound near the end, forcing every path to the data point. For real data the score likewise becomes large as t → 0,
          which is why samplers stop at a small positive time.
        </p>
      </Example>

      <Remark title="from theory to a generative model">
        <p>
          Everything in the reverse SDE is known except the score <M>{"\\nabla \\log p_t"}</M>. The data density is unknown, so the
          score of its noised versions is too; but the next two lessons show that the score can be learned from samples by regression,
          without ever evaluating a density. A network trained this way, plugged into the reverse SDE, is a score-based diffusion
          model.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "drift",
      rung: "check",
      prompt: (
        <p>
          Forward process <M>{"dX = dB"}</M> with data <M>{"N(0, 1)"}</M>, so <M>{"p_t = N(0, 1 + t)"}</M>. What is{" "}
          <M>{"f - g^2 \\nabla \\log p_t(x)"}</M> at t = 3 and x = 2?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0005 },
    },
    {
      key: "var",
      rung: "check",
      prompt: (
        <p>
          Data <M>{"N(0, 4)"}</M> are noised by the VP SDE with β = 1. What is the variance of <M>{"p_2"}</M>? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.406, tolerance: 0.0006 },
    },
    {
      key: "naive",
      rung: "apply",
      prompt: <p>Why does reversing only the drift, without the score term, fail to recover the data?</p>,
      answer: {
        kind: "choice",
        options: [
          "Noise spreads mass in both time directions, so something must pull mass back towards likely regions, and only the score knows where they are",
          "The forward drift is zero on average, so reversing it changes nothing",
          "The reverse process must have no noise at all",
          "The score term is needed only for numerical stability, not for the right distribution",
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

def vp_marginal(m, s2, beta, t):
    a = np.exp(-beta * t / 2)
    return a * m, a ** 2 * s2 + 1 - a ** 2            # Gaussian data N(m, s2) after time t of the VP SDE

def gauss_score(x, mean, var):
    return -(x - mean) / var                          # gradient of log N(mean, var) at x

def reverse_drift(x, t, m, s2, beta):
    mean, var = vp_marginal(m, s2, beta, t)
    return -beta * x / 2 - beta * gauss_score(x, mean, var)   # f - g^2 * score, in forward time

m, v = vp_marginal(2.0, 0.25, 2.0, 1.0)
print(round(m, 4), round(v, 4), round(gauss_score(1.0, m, v), 4), round(reverse_drift(1.0, 1.0, 2.0, 0.25, 2.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.7358 0.8985 -0.2941 -0.4118",
          "0.7358 0.8985 0.2941 -1.5882",
          "0.7358 0.25 -1.0566 -0.4118",
          "1.2131 0.8985 -0.2941 -0.4118",
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

def reverse_sample(x, zs, m, s2, beta, T, n):
    dt = T / n
    for k in range(n):
        t = T - k * dt
        a = np.exp(-beta * t / 2)
        mean, var = a * m, a ** 2 * s2 + 1 - a ** 2
        drift = -beta * x / 2 + beta * (x - mean) / var       # f - g^2 * score
        x = x - drift * dt + np.sqrt(beta * dt) * zs[k]       # step backwards in time
    return x

def sample_stats(xs):
    return float(np.mean(xs)), float(np.var(xs))

def kl_gauss(m1, v1, m2, v2):
    return 0.5 * (np.log(v2 / v1) + (v1 + (m1 - m2) ** 2) / v2 - 1)

x = reverse_sample(0.0, np.zeros(100), 2.0, 0.25, 2.0, 4.0, 100)
print(round(x, 3), kl_gauss(0.0, 1.0, 0.0, 1.0), round(kl_gauss(1.0, 1.0, 0.0, 1.0), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.99 0.0 0.5", "0.0 0.0 0.5", "1.99 0.0 1.0", "2.5 0.0 0.5"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>vp_marginal(m, s2, beta, t)</C>, returning the mean and variance, <C>gauss_score(x, mean, var)</C> and{" "}
          <C>reverse_drift(x, t, m, s2, beta)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def vp_marginal(m, s2, beta, t):
    return m, s2

def gauss_score(x, mean, var):
    return x - mean

def reverse_drift(x, t, m, s2, beta):
    return -beta * x / 2
`,
        solution: MARG,
        tests: [
          { name: "marg", code: `mean, var = vp_marginal(1.0, 0.0, 2.0, np.log(2))\nassert abs(mean - 0.5) < 1e-12 and abs(var - 0.75) < 1e-12 and gauss_score(3.0, 1.0, 4.0) == -0.5` },
          { name: "drift", code: `assert abs(reverse_drift(1.0, np.log(2), 0.0, 1.0, 2.0) - 1.0) < 1e-12 and abs(reverse_drift(0.0, 1.0, 0.0, 1.0, 2.0)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>reverse_sample(x, zs, m, s2, beta, T, n)</C>, evaluating the drift at <M>{"t = T - k\\,dt"}</M> in step k,{" "}
          <C>sample_stats(xs)</C>, returning the mean and variance as floats, and <C>kl_gauss(m1, v1, m2, v2)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def reverse_sample(x, zs, m, s2, beta, T, n):
    return x

def sample_stats(xs):
    return 0.0, 1.0

def kl_gauss(m1, v1, m2, v2):
    return (m1 - m2) ** 2
`,
        solution: SAMPLER,
        tests: [
          { name: "sample", code: `x = reverse_sample(1.0, np.zeros(1), 3.0, 1.0, 2.0, 1.0, 1)\nassert abs(x - 6 / np.e) < 1e-12\nassert sample_stats(np.array([1.0, 3.0])) == (2.0, 1.0)` },
          { name: "kl", code: `assert abs(kl_gauss(0.0, 1.0, 0.0, np.e) - 0.5 * (1 + 1 / np.e - 1)) < 1e-12 and abs(kl_gauss(2.0, 1.0, 0.0, 1.0) - 2.0) < 1e-12` },
        ],
      },
    },
    {
      key: "bridge",
      rung: "stretch",
      prompt: (
        <p>
          For the reverse of Brownian motion from the point 0 with T = 5, the reverse process starts at <M>{"Y_0 = 2"}</M>. What is{" "}
          <M>{"\\mathbb{E}[Y_1]"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 1.6, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        The reverse SDE needs the score <M>{"\\nabla \\log p_t"}</M> at every noise level. The next lesson studies score functions:
        what they are, why they do not need a normalising constant, and how they combine with Langevin dynamics to sample.
      </p>
    </>
  ),
};
