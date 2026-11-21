import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DdpmChainViz } from "@/components/viz/DdpmChainViz";
import type { LessonContent } from "@/lib/types";

const FORWARD = `import math

def linear_betas(T, lo, hi):
    return [lo + (hi - lo) * t / (T - 1) for t in range(T)]

def alpha_bars(betas):
    out, a = [], 1.0
    for b in betas:
        a *= 1 - b; out.append(a)                              # abar_t = product of (1 - beta_s) for s <= t
    return out

def q_sample(x0, abar, eps):
    return math.sqrt(abar) * x0 + math.sqrt(1 - abar) * eps   # jump straight from x_0 to x_t`;

const REVERSE = `import math

def posterior(x0, xt, beta, abar, abar_prev):
    c0 = math.sqrt(abar_prev) * beta / (1 - abar)
    ct = math.sqrt(1 - beta) * (1 - abar_prev) / (1 - abar)
    return c0 * x0 + ct * xt, (1 - abar_prev) / (1 - abar) * beta

def x0_from_eps(xt, eps, abar):
    return (xt - math.sqrt(1 - abar) * eps) / math.sqrt(abar)

def ddpm_step(xt, eps_hat, beta, abar, abar_prev, z):
    mean, var = posterior(x0_from_eps(xt, eps_hat, abar), xt, beta, abar, abar_prev)
    return mean + math.sqrt(var) * z                           # z is fresh N(0, 1) noise, 0 at the last step`;

export const lesson: LessonContent = {
  id: "l12.1.1",
  minutes: 60,
  links: {
    requires: ["l7.6.2", "l7.3.1"],
    revisits: ["m19.4.3", "l7.6.3"],
    foreshadows: ["l12.1.2"],
  },

  puzzle: (
    <>
      <p>
        Destroying an image is easy: add a little Gaussian noise, then a little more, a thousand times, and any photograph
        becomes indistinguishable from static. Undoing one small step of that is also easy in a sense, because a slightly noisy
        image is almost the clean one. Can a chain of a thousand small, learnable clean-up steps turn pure static into a
        new photograph, and what single training objective teaches every step at once?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Fix the destruction process in advance, so it needs no learning. Because every step adds Gaussian noise, the noisy
        image at any step is the clean image shrunk a little plus one Gaussian draw, so training examples at any noise level
        can be made in one jump. The reverse of a tiny noising step is, to good approximation, Gaussian too, and its mean is a
        known blend of the current noisy image and the clean image it came from. The network only has to guess that clean
        image, or equivalently the noise that was added. Sampling then runs the chain backwards, guessing and re-noising a
        little less at every step.
      </p>
      <DdpmChainViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the forward process">
        <p>
          Choose a variance schedule <M>{"\\beta_1, \\dots, \\beta_T \\in (0, 1)"}</M> and set{" "}
          <M>{"q(x_t \\mid x_{t-1}) = \\mathcal{N}(\\sqrt{1 - \\beta_t}\\, x_{t-1}, \\beta_t I)"}</M>, starting from a data point{" "}
          <M>{"x_0"}</M>. Write <M>{"\\alpha_t = 1 - \\beta_t"}</M> and <M>{"\\bar\\alpha_t = \\prod_{s \\le t} \\alpha_s"}</M>{" "}
          (<C>linear_betas</C>, <C>alpha_bars</C>). The shrink factor <M>{"\\sqrt{1-\\beta_t}"}</M> is chosen so that data with
          unit variance keep unit variance: this is the discretised variance-preserving SDE of m19.4.1.
        </p>
      </Definition>

      <Theorem title="noising in one jump">
        <p>
          <M>{"q(x_t \\mid x_0) = \\mathcal{N}(\\sqrt{\\bar\\alpha_t}\\, x_0, (1 - \\bar\\alpha_t) I)"}</M>, so{" "}
          <M>{"x_t = \\sqrt{\\bar\\alpha_t}\\, x_0 + \\sqrt{1 - \\bar\\alpha_t}\\, \\varepsilon"}</M> with{" "}
          <M>{"\\varepsilon \\sim \\mathcal{N}(0, I)"}</M> (<C>q_sample</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          Induction on t; the case t = 1 is the definition. If{" "}
          <M>{"x_{t-1} = \\sqrt{\\bar\\alpha_{t-1}}\\, x_0 + \\sqrt{1 - \\bar\\alpha_{t-1}}\\, \\varepsilon'"}</M>, then{" "}
          <M>{"x_t = \\sqrt{\\bar\\alpha_t}\\, x_0 + \\sqrt{\\alpha_t (1 - \\bar\\alpha_{t-1})}\\, \\varepsilon' + \\sqrt{\\beta_t}\\, \\varepsilon''"}</M>{" "}
          with independent standard Gaussians. A sum of independent centred Gaussians is Gaussian with the summed covariance,{" "}
          <M>{"\\alpha_t - \\bar\\alpha_t + 1 - \\alpha_t = 1 - \\bar\\alpha_t"}</M> times I.
        </p>
        <Code>{FORWARD}</Code>
      </Proof>

      <Theorem title="the forward posterior">
        <p>
          For t ≥ 2,{" "}
          <M>{"q(x_{t-1} \\mid x_t, x_0) = \\mathcal{N}(\\tilde\\mu_t, \\tilde\\beta_t I)"}</M> with
        </p>
        <MD>{"\\tilde\\mu_t = \\frac{\\sqrt{\\bar\\alpha_{t-1}}\\, \\beta_t}{1 - \\bar\\alpha_t}\\, x_0 + \\frac{\\sqrt{\\alpha_t}\\,(1 - \\bar\\alpha_{t-1})}{1 - \\bar\\alpha_t}\\, x_t, \\qquad \\tilde\\beta_t = \\frac{1 - \\bar\\alpha_{t-1}}{1 - \\bar\\alpha_t}\\, \\beta_t"}</MD>
        <p>(<C>posterior</C>).</p>
      </Theorem>
      <Proof>
        <p>
          By the Markov property and Bayes&apos; rule,{" "}
          <M>{"q(x_{t-1} \\mid x_t, x_0) \\propto q(x_t \\mid x_{t-1})\\, q(x_{t-1} \\mid x_0)"}</M>. As a function of{" "}
          <M>{"x_{t-1}"}</M>, the logarithm is{" "}
          <M>{"-\\tfrac{1}{2}\\big[\\|x_t - \\sqrt{\\alpha_t} x_{t-1}\\|^2 / \\beta_t + \\|x_{t-1} - \\sqrt{\\bar\\alpha_{t-1}} x_0\\|^2 / (1 - \\bar\\alpha_{t-1})\\big]"}</M>,
          a quadratic, so the posterior is Gaussian. Its precision is the coefficient of <M>{"\\|x_{t-1}\\|^2"}</M>:{" "}
          <M>{"\\alpha_t / \\beta_t + 1/(1 - \\bar\\alpha_{t-1}) = (1 - \\bar\\alpha_t) / (\\beta_t (1 - \\bar\\alpha_{t-1}))"}</M>,
          using <M>{"\\alpha_t(1 - \\bar\\alpha_{t-1}) + \\beta_t = 1 - \\bar\\alpha_t"}</M>. Its mean is the variance times the
          linear coefficient <M>{"\\sqrt{\\alpha_t}\\, x_t / \\beta_t + \\sqrt{\\bar\\alpha_{t-1}}\\, x_0 / (1 - \\bar\\alpha_{t-1})"}</M>,
          which gives the two weights stated.
        </p>
      </Proof>

      <Theorem title="the variational bound">
        <p>
          Let the model be a Markov chain{" "}
          <M>{"p_\\theta(x_{0:T}) = p(x_T) \\prod_{t=1}^{T} p_\\theta(x_{t-1} \\mid x_t)"}</M> with{" "}
          <M>{"p(x_T) = \\mathcal{N}(0, I)"}</M>. Then <M>{"-\\log p_\\theta(x_0) \\le"}</M>
        </p>
        <MD>{"\\mathrm{KL}\\big(q(x_T \\mid x_0) \\,\\|\\, p(x_T)\\big) + \\sum_{t=2}^{T} \\mathbb{E}_q\\, \\mathrm{KL}\\big(q(x_{t-1} \\mid x_t, x_0) \\,\\|\\, p_\\theta(x_{t-1} \\mid x_t)\\big) - \\mathbb{E}_q \\log p_\\theta(x_0 \\mid x_1)."}</MD>
      </Theorem>
      <Proof>
        <p>
          The ELBO of l7.3.1 with the forward chain as the encoder reads{" "}
          <M>{"-\\log p_\\theta(x_0) \\le \\mathbb{E}_q[-\\log p_\\theta(x_{0:T}) + \\log q(x_{1:T} \\mid x_0)]"}</M>. Write{" "}
          <M>{"q(x_{1:T} \\mid x_0) = \\prod_t q(x_t \\mid x_{t-1}, x_0)"}</M> and, for t ≥ 2, use Bayes&apos; rule{" "}
          <M>{"q(x_t \\mid x_{t-1}, x_0) = q(x_{t-1} \\mid x_t, x_0)\\, q(x_t \\mid x_0) / q(x_{t-1} \\mid x_0)"}</M>. The ratios{" "}
          <M>{"q(x_t \\mid x_0)/q(x_{t-1} \\mid x_0)"}</M> telescope to <M>{"q(x_T \\mid x_0)/q(x_1 \\mid x_0)"}</M>, and the
          remaining <M>{"q(x_1 \\mid x_0)"}</M> cancels it. Grouping each factor of <M>{"q"}</M> with the matching factor of{" "}
          <M>{"p_\\theta"}</M> and taking expectations turns each log ratio into the stated KL divergence.
        </p>
      </Proof>

      <Theorem title="noise prediction">
        <p>
          Take <M>{"p_\\theta(x_{t-1} \\mid x_t) = \\mathcal{N}(\\mu_\\theta(x_t, t), \\sigma_t^2 I)"}</M> with{" "}
          <M>{"\\mu_\\theta = (x_t - \\beta_t \\hat\\varepsilon_\\theta(x_t, t) / \\sqrt{1 - \\bar\\alpha_t}) / \\sqrt{\\alpha_t}"}</M>.
          Then for x<sub>t</sub> built from <M>{"(x_0, \\varepsilon)"}</M>, the t-th KL term equals{" "}
          <M>{"\\frac{\\beta_t^2}{2 \\sigma_t^2 \\alpha_t (1 - \\bar\\alpha_t)} \\|\\varepsilon - \\hat\\varepsilon_\\theta(x_t, t)\\|^2"}</M>{" "}
          plus a constant independent of θ.
        </p>
      </Theorem>
      <Proof>
        <p>
          The KL divergence from <M>{"\\mathcal{N}(\\tilde\\mu_t, \\tilde\\beta_t I)"}</M> to{" "}
          <M>{"\\mathcal{N}(\\mu_\\theta, \\sigma_t^2 I)"}</M> with <M>{"\\sigma_t"}</M> fixed is{" "}
          <M>{"\\|\\tilde\\mu_t - \\mu_\\theta\\|^2 / (2 \\sigma_t^2)"}</M> plus terms in the variances alone. Substitute{" "}
          <M>{"x_0 = (x_t - \\sqrt{1 - \\bar\\alpha_t}\\, \\varepsilon)/\\sqrt{\\bar\\alpha_t}"}</M> (<C>x0_from_eps</C>) into{" "}
          <M>{"\\tilde\\mu_t"}</M>. The coefficient of <M>{"x_t"}</M> becomes{" "}
          <M>{"(\\beta_t + \\alpha_t(1 - \\bar\\alpha_{t-1})) / (\\sqrt{\\alpha_t}(1 - \\bar\\alpha_t)) = 1/\\sqrt{\\alpha_t}"}</M> and
          the coefficient of <M>{"\\varepsilon"}</M> becomes <M>{"-\\beta_t / (\\sqrt{\\alpha_t}\\sqrt{1 - \\bar\\alpha_t})"}</M>, so{" "}
          <M>{"\\tilde\\mu_t - \\mu_\\theta = \\beta_t (\\hat\\varepsilon_\\theta - \\varepsilon) / (\\sqrt{\\alpha_t}\\sqrt{1 - \\bar\\alpha_t})"}</M>.
          Squaring gives the result.
        </p>
      </Proof>

      <Definition title="training and ancestral sampling">
        <p>
          Ho, Jain and Abbeel drop the weights and train on the simple loss{" "}
          <M>{"\\mathbb{E}_{t, x_0, \\varepsilon} \\|\\varepsilon - \\hat\\varepsilon_\\theta(\\sqrt{\\bar\\alpha_t} x_0 + \\sqrt{1 - \\bar\\alpha_t}\\, \\varepsilon, t)\\|^2"}</M>
          with t uniform: one jump per example, no simulation of the chain. To sample, draw <M>{"x_T \\sim \\mathcal{N}(0, I)"}</M>{" "}
          and for t = T, …, 1 set{" "}
          <M>{"x_{t-1} = \\tilde\\mu_t(\\hat x_0, x_t) + \\sqrt{\\tilde\\beta_t}\\, z"}</M>, where{" "}
          <M>{"\\hat x_0"}</M> is the clean point implied by <M>{"\\hat\\varepsilon_\\theta"}</M> and z is fresh noise, zero at the
          last step (<C>ddpm_step</C>). The figure runs this sampler with the exact noise predictor of its data.
        </p>
        <Code>{REVERSE}</Code>
      </Definition>

      <Example title="the schedules">
        <p>
          The original schedule takes T = 1000 and β rising linearly from <M>{"10^{-4}"}</M> to 0.02, which leaves{" "}
          <M>{"\\bar\\alpha_T \\approx 4 \\times 10^{-5}"}</M>, close enough to pure noise. Its{" "}
          <M>{"\\bar\\alpha_t"}</M> falls fast, so the last few hundred steps are spent on images that are already almost all
          noise. Nichol and Dhariwal&apos;s cosine schedule{" "}
          <M>{"\\bar\\alpha_t = f(t)/f(0)"}</M>, <M>{"f(t) = \\cos^2\\big(\\tfrac{t/T + s}{1 + s} \\cdot \\tfrac{\\pi}{2}\\big)"}</M>{" "}
          with s = 0.008, makes the log signal-to-noise ratio{" "}
          <M>{"\\log(\\bar\\alpha_t / (1 - \\bar\\alpha_t))"}</M> fall almost linearly in t through the middle of the chain, which
          spreads the work more evenly; the figure shows both.
        </p>
      </Example>

      <Remark title="what the simple loss changes">
        <p>
          Dropping the weights is not the bound any more: it down-weights small t, where the bound&apos;s weight is largest,
          and gives better samples but worse likelihoods. m19.4.3 showed the same loss is denoising score matching, with{" "}
          <M>{"-\\hat\\varepsilon_\\theta / \\sqrt{1 - \\bar\\alpha_t}"}</M> estimating the score of the noisy data, so the
          sampler is a cousin of annealed Langevin dynamics from l7.6.3. The choice of weights, schedule and parameterisation is
          a design space, and the next lessons make it continuous and then systematic.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "abar",
      rung: "check",
      prompt: <p>A three-step schedule has β = 0.1, 0.2, 0.5. What is <M>{"\\bar\\alpha_3"}</M>?</p>,
      answer: { kind: "numeric", value: 0.36, tolerance: 0.0005 },
    },
    {
      key: "postvar",
      rung: "check",
      prompt: (
        <p>
          With <M>{"\\bar\\alpha_{t-1} = 0.9"}</M> and <M>{"\\beta_t = 0.5"}</M>, what is the forward posterior variance{" "}
          <M>{"\\tilde\\beta_t"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.0909, tolerance: 0.0005 },
    },
    {
      key: "start",
      rung: "apply",
      prompt: <p>Sampling starts from <M>{"x_T \\sim \\mathcal{N}(0, I)"}</M>. Which condition on the schedule makes this start correct?</p>,
      answer: {
        kind: "choice",
        options: [
          "ᾱ_T is close to 0, so q(x_T | x_0) is close to N(0, I) whatever x_0 is",
          "β_T is close to 0, so the last step adds little noise",
          "The β_t sum to 1",
          "ᾱ_T is close to 1, so the signal survives to the end",
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

def linear_betas(T, lo, hi):
    return [lo + (hi - lo) * t / (T - 1) for t in range(T)]

def alpha_bars(betas):
    out, a = [], 1.0
    for b in betas:
        a *= 1 - b; out.append(a)                              # abar_t = product of (1 - beta_s) for s <= t
    return out

def q_sample(x0, abar, eps):
    return math.sqrt(abar) * x0 + math.sqrt(1 - abar) * eps   # jump straight from x_0 to x_t

b = linear_betas(5, 0.1, 0.5); ab = alpha_bars(b)
print([round(x, 2) for x in b[:2]], round(ab[2], 4), round(q_sample(2.0, 0.64, -1.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.1, 0.2] 0.504 1.0",
          "[0.1, 0.2] 0.72 1.0",
          "[0.1, 0.2] 0.504 0.6",
          "[0.1, 0.1] 0.504 1.0",
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

def posterior(x0, xt, beta, abar, abar_prev):
    c0 = math.sqrt(abar_prev) * beta / (1 - abar)
    ct = math.sqrt(1 - beta) * (1 - abar_prev) / (1 - abar)
    return c0 * x0 + ct * xt, (1 - abar_prev) / (1 - abar) * beta

def x0_from_eps(xt, eps, abar):
    return (xt - math.sqrt(1 - abar) * eps) / math.sqrt(abar)

def ddpm_step(xt, eps_hat, beta, abar, abar_prev, z):
    mean, var = posterior(x0_from_eps(xt, eps_hat, abar), xt, beta, abar, abar_prev)
    return mean + math.sqrt(var) * z                           # z is fresh N(0, 1) noise, 0 at the last step

m, v = posterior(1.0, 0.5, 0.2, 0.6, 0.75)
print(round(m, 4), round(v, 4), round(x0_from_eps(1.9, 0.5, 0.64), 4), round(ddpm_step(1.6, 0.0, 0.2, 0.6, 0.75, 0.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.7125 0.125 2.0 1.7889",
          "0.7125 0.2 2.0 1.7889",
          "0.7125 0.125 1.6 1.6",
          "0.5 0.125 2.0 1.7889",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>linear_betas(T, lo, hi)</C> returning T values evenly spaced from lo to hi, <C>alpha_bars(betas)</C>{" "}
          returning the list of <M>{"\\bar\\alpha_t"}</M>, and <C>q_sample(x0, abar, eps)</C> for scalars.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def linear_betas(T, lo, hi):
    return [lo] * T

def alpha_bars(betas):
    return [1 - b for b in betas]

def q_sample(x0, abar, eps):
    return x0 + eps
`,
        solution: FORWARD,
        tests: [
          { name: "sched", code: `b = linear_betas(3, 0.2, 0.4)\nassert len(b) == 3 and abs(b[1] - 0.3) < 1e-12 and abs(b[2] - 0.4) < 1e-12\nab = alpha_bars([0.5, 0.5, 0.2])\nassert all(abs(x - y) < 1e-12 for x, y in zip(ab, [0.5, 0.25, 0.2])) and len(ab) == 3` },
          { name: "jump", code: `assert abs(q_sample(3.0, 0.64, 2.0) - 3.6) < 1e-12 and abs(q_sample(-1.0, 1.0, 5.0) + 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For scalars, write <C>posterior(x0, xt, beta, abar, abar_prev)</C> returning the mean and variance of{" "}
          <M>{"q(x_{t-1} \\mid x_t, x_0)"}</M>, <C>x0_from_eps(xt, eps, abar)</C>, and{" "}
          <C>ddpm_step(xt, eps_hat, beta, abar, abar_prev, z)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def posterior(x0, xt, beta, abar, abar_prev):
    return x0, beta

def x0_from_eps(xt, eps, abar):
    return xt

def ddpm_step(xt, eps_hat, beta, abar, abar_prev, z):
    return xt - eps_hat + z
`,
        solution: REVERSE,
        tests: [
          { name: "post", code: `m, v = posterior(2.0, 1.0, 0.5, 0.4, 0.8)\nassert abs(v - 1 / 6) < 1e-12 and abs(m - (0.8 ** 0.5 * 0.5 / 0.6 * 2 + 0.5 ** 0.5 * 0.2 / 0.6)) < 1e-12` },
          { name: "invert", code: `assert abs(x0_from_eps(0.64 ** 0.5 * 2.5 + 0.6 * -1.5, -1.5, 0.64) - 2.5) < 1e-12` },
          { name: "step", code: `xt = 0.4 ** 0.5 * 2.0 + 0.6 ** 0.5 * 0.7\nm = 0.8 ** 0.5 * 0.5 / 0.6 * 2 + 0.5 ** 0.5 * 0.2 / 0.6 * xt\nassert abs(ddpm_step(xt, 0.7, 0.5, 0.4, 0.8, 0.0) - m) < 1e-9 and abs(ddpm_step(xt, 0.7, 0.5, 0.4, 0.8, 1.0) - m - (1 / 6) ** 0.5) < 1e-9` },
        ],
      },
    },
    {
      key: "steps",
      rung: "stretch",
      prompt: (
        <p>
          With a constant schedule <M>{"\\beta_t = 0.02"}</M>, what is the smallest T for which{" "}
          <M>{"\\bar\\alpha_T < 0.01"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 228, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        As the steps shrink, the chain becomes a stochastic differential equation, and the network&apos;s output becomes an
        estimate of the score along it. That view, next, unifies diffusion models with score matching and opens the door to
        deterministic samplers.
      </p>
    </>
  ),
};
