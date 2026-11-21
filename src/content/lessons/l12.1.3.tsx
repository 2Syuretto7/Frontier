import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DdimViz } from "@/components/viz/DdimViz";
import type { LessonContent } from "@/lib/types";

const DDIM = `import math

def ddim_sigma(abar, abar_prev, eta):
    return eta * math.sqrt((1 - abar_prev) / (1 - abar) * (1 - abar / abar_prev))

def ddim_step(xt, eps_hat, abar, abar_prev, eta, z):
    x0 = (xt - math.sqrt(1 - abar) * eps_hat) / math.sqrt(abar)
    s = ddim_sigma(abar, abar_prev, eta)
    return math.sqrt(abar_prev) * x0 + math.sqrt(1 - abar_prev - s * s) * eps_hat + s * z

def ddim_sample(x, abars, eps_fn, eta, noise):
    for a, ap in zip(abars, abars[1:]):                        # abars run from the noisiest level up to 1.0
        x = ddim_step(x, eps_fn(x, a), a, ap, eta, noise())
    return x`;

const FLOW = `import math

def to_ode(x, abar):
    return x / math.sqrt(abar), math.sqrt((1 - abar) / abar)   # scaled state and noise level sigma

def euler_flow(xbar, sigmas, eps_fn):
    for s, s_next in zip(sigmas, sigmas[1:]):
        xbar = xbar + (s_next - s) * eps_fn(xbar, s)           # Euler step of d xbar / d sigma = eps
    return xbar

def exact_flow_gauss(xbar, s, s_next, v):
    return xbar * math.sqrt((v + s_next ** 2) / (v + s ** 2))  # exact flow when the data are N(0, v)`;

export const lesson: LessonContent = {
  id: "l12.1.3",
  minutes: 55,
  links: {
    requires: ["l12.1.2"],
    revisits: ["m19.5.1", "l12.1.1"],
    foreshadows: ["l12.1.4"],
  },

  puzzle: (
    <>
      <p>
        A DDPM trained with a thousand noise levels needs a thousand network evaluations per sample, because its sampler
        undoes the forward chain one step at a time. Yet the training loss never simulated that chain: it only ever saw single
        jumps from clean data to one noise level. If the network knows nothing about the chain&apos;s individual steps, why
        must sampling take them? Could the same network, untouched, produce images in twenty steps, deterministically, so
        that each image has a fixed noise code from which it can be recovered?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Many different forward processes share the same one-jump marginals. Because the loss sees only those marginals, a
        network trained for one of them is trained for all of them. Among the family is one whose reverse steps add no noise
        at all: each step predicts the clean image, then moves to the next noise level by re-adding exactly the noise it
        just predicted, scaled down. That deterministic sampler is a plain Euler method for an ODE, and an ODE tolerates big
        steps far better than a sampler that injects fresh randomness at every step.
      </p>
      <DdimViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a family of forward processes">
        <p>
          For any <M>{"\\sigma_t \\ge 0"}</M> with <M>{"\\sigma_t^2 \\le 1 - \\bar\\alpha_{t-1}"}</M>, define{" "}
          <M>{"q_\\sigma(x_T \\mid x_0) = \\mathcal{N}(\\sqrt{\\bar\\alpha_T}\\, x_0, (1 - \\bar\\alpha_T) I)"}</M> and, for{" "}
          <M>{"t \\ge 2"}</M>,
        </p>
        <MD>{"q_\\sigma(x_{t-1} \\mid x_t, x_0) = \\mathcal{N}\\Big(\\sqrt{\\bar\\alpha_{t-1}}\\, x_0 + \\sqrt{1 - \\bar\\alpha_{t-1} - \\sigma_t^2}\; \\frac{x_t - \\sqrt{\\bar\\alpha_t}\\, x_0}{\\sqrt{1 - \\bar\\alpha_t}},\\ \\sigma_t^2 I\\Big)."}</MD>
        <p>
          The joint process runs backwards from <M>{"x_T"}</M>; it is not Markov in the forward direction, hence the name of
          denoising diffusion implicit models (Song, Meng and Ermon).
        </p>
      </Definition>

      <Theorem title="the marginals do not depend on σ">
        <p>
          For every t, <M>{"q_\\sigma(x_t \\mid x_0) = \\mathcal{N}(\\sqrt{\\bar\\alpha_t}\\, x_0, (1 - \\bar\\alpha_t) I)"}</M>, the
          DDPM marginal of l12.1.1.
        </p>
      </Theorem>
      <Proof>
        <p>
          Downward induction from t = T, where it holds by definition. Suppose it holds at t and write{" "}
          <M>{"x_t = \\sqrt{\\bar\\alpha_t}\\, x_0 + \\sqrt{1 - \\bar\\alpha_t}\\, \\varepsilon"}</M>. Then{" "}
          <M>{"x_{t-1} = \\sqrt{\\bar\\alpha_{t-1}}\\, x_0 + \\sqrt{1 - \\bar\\alpha_{t-1} - \\sigma_t^2}\\, \\varepsilon + \\sigma_t z"}</M>{" "}
          with z independent of <M>{"\\varepsilon"}</M>. This is Gaussian with mean <M>{"\\sqrt{\\bar\\alpha_{t-1}}\\, x_0"}</M>{" "}
          and covariance <M>{"(1 - \\bar\\alpha_{t-1} - \\sigma_t^2 + \\sigma_t^2) I"}</M>.
        </p>
      </Proof>

      <Remark title="one network for the whole family">
        <p>
          The simple loss <M>{"\\mathbb{E}\\|\\varepsilon - \\hat\\varepsilon_\\theta(x_t, t)\\|^2"}</M> depends only on these
          marginals, so its minimiser is the same for every σ. The family can even be defined on any decreasing subsequence{" "}
          <M>{"\\tau_1 < \\dots < \\tau_S"}</M> of the original times, with the same <M>{"\\bar\\alpha"}</M> values, so the trained
          network can be sampled along any such subsequence.
        </p>
      </Remark>

      <Definition title="the DDIM sampler">
        <p>
          Replace <M>{"x_0"}</M> by <M>{"\\hat x_0 = (x_t - \\sqrt{1 - \\bar\\alpha_t}\\, \\hat\\varepsilon) / \\sqrt{\\bar\\alpha_t}"}</M>{" "}
          and the normalised residual by <M>{"\\hat\\varepsilon"}</M>:{" "}
          <M>{"x_{t'} = \\sqrt{\\bar\\alpha_{t'}}\\, \\hat x_0 + \\sqrt{1 - \\bar\\alpha_{t'} - \\sigma^2}\\, \\hat\\varepsilon + \\sigma z"}</M>{" "}
          for the next time t&apos; of the subsequence (<C>ddim_step</C>, <C>ddim_sample</C>), with{" "}
          <M>{"\\sigma = \\eta \\sqrt{(1 - \\bar\\alpha_{t'})/(1 - \\bar\\alpha_t)}\\, \\sqrt{1 - \\bar\\alpha_t/\\bar\\alpha_{t'}}"}</M>{" "}
          (<C>ddim_sigma</C>). η = 0 gives a deterministic map from <M>{"x_T"}</M> to <M>{"x_0"}</M>.
        </p>
        <Code>{DDIM}</Code>
      </Definition>

      <Theorem title="η = 1 is DDPM">
        <p>With t&apos; = t − 1 and η = 1, the DDIM step is the ancestral sampling step of l12.1.1.</p>
      </Theorem>
      <Proof>
        <p>
          Here <M>{"1 - \\bar\\alpha_t / \\bar\\alpha_{t-1} = \\beta_t"}</M>, so <M>{"\\sigma^2 = \\tilde\\beta_t"}</M>. Next,{" "}
          <M>{"1 - \\bar\\alpha_{t-1} - \\tilde\\beta_t = (1 - \\bar\\alpha_{t-1})(\\alpha_t - \\bar\\alpha_t)/(1 - \\bar\\alpha_t) = \\alpha_t (1 - \\bar\\alpha_{t-1})^2 / (1 - \\bar\\alpha_t)"}</M>.
          Substituting <M>{"\\hat\\varepsilon = (x_t - \\sqrt{\\bar\\alpha_t}\\, \\hat x_0)/\\sqrt{1 - \\bar\\alpha_t}"}</M>, the
          coefficient of <M>{"x_t"}</M> is <M>{"\\sqrt{\\alpha_t}(1 - \\bar\\alpha_{t-1})/(1 - \\bar\\alpha_t)"}</M> and that of{" "}
          <M>{"\\hat x_0"}</M> is{" "}
          <M>{"\\sqrt{\\bar\\alpha_{t-1}}\\,[1 - \\alpha_t (1 - \\bar\\alpha_{t-1})/(1 - \\bar\\alpha_t)] = \\sqrt{\\bar\\alpha_{t-1}}\\, \\beta_t / (1 - \\bar\\alpha_t)"}</M>,
          the two weights of the posterior mean <M>{"\\tilde\\mu_t"}</M>.
        </p>
      </Proof>

      <Theorem title="DDIM is Euler on the probability flow">
        <p>
          Let <M>{"\\bar x = x / \\sqrt{\\bar\\alpha}"}</M> and <M>{"s = \\sqrt{(1 - \\bar\\alpha)/\\bar\\alpha}"}</M> (<C>to_ode</C>),
          and regard <M>{"\\hat\\varepsilon"}</M> as a function of <M>{"(\\bar x, s)"}</M>. The η = 0 DDIM step is exactly the
          Euler step <M>{"\\bar x' = \\bar x + (s' - s)\\, \\hat\\varepsilon(\\bar x, s)"}</M> (<C>euler_flow</C>) for the ODE{" "}
          <M>{"d\\bar x / ds = \\hat\\varepsilon(\\bar x, s)"}</M>, and with the exact noise predictor this ODE is the probability
          flow ODE of m19.5.1.
        </p>
      </Theorem>
      <Proof>
        <p>
          Divide the η = 0 update by <M>{"\\sqrt{\\bar\\alpha_{t'}}"}</M>: <M>{"\\bar x' = \\hat x_0 + s' \\hat\\varepsilon"}</M>.
          Rearranging the definition of <M>{"\\hat x_0"}</M> and dividing by <M>{"\\sqrt{\\bar\\alpha_t}"}</M> gives{" "}
          <M>{"\\hat x_0 = \\bar x - s \\hat\\varepsilon"}</M>, and subtracting yields the Euler step. In the scaled variables{" "}
          <M>{"\\bar x = x_0 + s \\varepsilon"}</M>: the data plus noise of standard deviation s, a VE process. Its probability
          flow is <M>{"d\\bar x/ds = -s\\, \\nabla \\log p_s(\\bar x)"}</M>, and by Tweedie&apos;s formula (l7.6.2){" "}
          <M>{"-s\\, \\nabla \\log p_s(\\bar x) = \\mathbb{E}[\\varepsilon \\mid \\bar x]"}</M>, which is what the exact noise
          predictor returns.
        </p>
        <Code>{FLOW}</Code>
      </Proof>

      <Example title="Gaussian data">
        <p>
          If the data are <M>{"\\mathcal{N}(0, v)"}</M>, then <M>{"\\mathbb{E}[\\varepsilon \\mid \\bar x] = s \\bar x/(v + s^2)"}</M>{" "}
          and the flow is solved exactly by <M>{"\\bar x(s') = \\bar x(s) \\sqrt{(v + s'^2)/(v + s^2)}"}</M>{" "}
          (<C>exact_flow_gauss</C>). Euler with a few steps shrinks the state too much, because along this flow the slope is
          largest at the noisy end of each step, which is where Euler measures it. That gap is pure discretisation error, which is why higher-order solvers
          help: the next lesson uses Heun&apos;s method.
        </p>
      </Example>

      <Remark title="what determinism buys">
        <p>
          A deterministic sampler is an invertible map between noise and data. Running the ODE forwards encodes a real image
          into its noise, which makes image editing possible: encode, change the conditioning, decode. Interpolating between
          two noise vectors gives a smooth path of images. Its sample quality at few steps is much better: on CIFAR-10 at ten
          steps, the DDIM paper reports FID 13.4 for η = 0 against 41.1 for η = 1. Solvers that exploit the semi-linear form of
          the ODE, such as DPM-Solver, push this to around ten to twenty evaluations.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "step",
      rung: "check",
      prompt: (
        <p>
          A deterministic DDIM step goes from <M>{"\\bar\\alpha = 0.36"}</M> to <M>{"\\bar\\alpha = 0.64"}</M> at{" "}
          <M>{"x_t = 1"}</M> with predicted noise 0.5. What is the new x?
        </p>
      ),
      answer: { kind: "numeric", value: 1.1, tolerance: 0.0005 },
    },
    {
      key: "sig",
      rung: "check",
      prompt: <p>For the same two levels, what is the standard deviation σ of the injected noise when η = 1?</p>,
      answer: { kind: "numeric", value: 0.4961, tolerance: 0.0005 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why can a network trained with the DDPM loss be sampled with DDIM without retraining?</p>,
      answer: {
        kind: "choice",
        options: [
          "The loss only involves the one-jump marginals q(x_t | x_0), and every member of the DDIM family has the same marginals",
          "DDIM retrains the last layer of the network on the fly",
          "The DDPM loss is the ELBO, which is the same for every forward process",
          "DDIM only uses the network at t = T",
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

def ddim_sigma(abar, abar_prev, eta):
    return eta * math.sqrt((1 - abar_prev) / (1 - abar) * (1 - abar / abar_prev))

def ddim_step(xt, eps_hat, abar, abar_prev, eta, z):
    x0 = (xt - math.sqrt(1 - abar) * eps_hat) / math.sqrt(abar)
    s = ddim_sigma(abar, abar_prev, eta)
    return math.sqrt(abar_prev) * x0 + math.sqrt(1 - abar_prev - s * s) * eps_hat + s * z

def ddim_sample(x, abars, eps_fn, eta, noise):
    for a, ap in zip(abars, abars[1:]):                        # abars run from the noisiest level up to 1.0
        x = ddim_step(x, eps_fn(x, a), a, ap, eta, noise())
    return x

ef = lambda x, a: math.sqrt(1 - a) * x; xs = [ddim_sample(1.0, [0.2, 0.5, 1.0], ef, eta, lambda: 0.0) for eta in (0.0, 1.0)]
print(round(ddim_sigma(0.5, 0.8, 1.0), 4), round(ddim_sigma(0.5, 0.8, 0.0), 4), [round(v, 4) for v in xs])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.3873 0.0 [0.6708, 0.4472]",
          "0.3873 0.0 [0.6708, 0.6708]",
          "0.3873 0.3873 [0.6708, 0.4472]",
          "0.5477 0.0 [0.6708, 0.4472]",
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

def to_ode(x, abar):
    return x / math.sqrt(abar), math.sqrt((1 - abar) / abar)   # scaled state and noise level sigma

def euler_flow(xbar, sigmas, eps_fn):
    for s, s_next in zip(sigmas, sigmas[1:]):
        xbar = xbar + (s_next - s) * eps_fn(xbar, s)           # Euler step of d xbar / d sigma = eps
    return xbar

def exact_flow_gauss(xbar, s, s_next, v):
    return xbar * math.sqrt((v + s_next ** 2) / (v + s ** 2))  # exact flow when the data are N(0, v)

xb, s = to_ode(0.6, 0.36); g = lambda x, s: s * x / (1 + s * s)
print(round(xb, 4), round(s, 4), round(euler_flow(2.0, [2.0, 1.0, 0.0], g), 4), round(exact_flow_gauss(2.0, 2.0, 0.0, 1.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 1.3333 0.6 0.8944",
          "1.0 1.3333 0.8944 0.8944",
          "0.6 1.3333 0.6 0.8944",
          "1.0 0.6667 0.6 0.8944",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ddim_sigma(abar, abar_prev, eta)</C>, <C>ddim_step(xt, eps_hat, abar, abar_prev, eta, z)</C>, and{" "}
          <C>ddim_sample(x, abars, eps_fn, eta, noise)</C> where <C>abars</C> runs from the noisiest level up to 1.0 and{" "}
          <C>eps_fn(x, abar)</C> is the noise predictor.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def ddim_sigma(abar, abar_prev, eta):
    return eta

def ddim_step(xt, eps_hat, abar, abar_prev, eta, z):
    return xt - eps_hat

def ddim_sample(x, abars, eps_fn, eta, noise):
    return x
`,
        solution: DDIM,
        tests: [
          { name: "sigma", code: `assert abs(ddim_sigma(0.25, 0.5, 1.0) - (0.5 / 0.75 * 0.5) ** 0.5) < 1e-12 and ddim_sigma(0.25, 0.5, 0.0) == 0\nassert abs(ddim_step(0.9, 0.4, 0.25, 1.0, 0.0, 0.0) - (0.9 - 0.75 ** 0.5 * 0.4) / 0.5) < 1e-12` },
          { name: "sample", code: `ef = lambda x, a: (1 - a) ** 0.5 * x\nx = ddim_sample(1.5, [0.36, 0.64, 1.0], ef, 0.0, lambda: 0.0)\nassert abs(x - 1.152) < 1e-12 and abs(ddim_sample(1.5, [0.36], ef, 0.0, lambda: 0.0) - 1.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>to_ode(x, abar)</C> returning the scaled state and noise level, <C>euler_flow(xbar, sigmas, eps_fn)</C>{" "}
          running Euler steps of <M>{"d\\bar x/ds = \\hat\\varepsilon(\\bar x, s)"}</M> through the listed levels, and{" "}
          <C>exact_flow_gauss(xbar, s, s_next, v)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def to_ode(x, abar):
    return x, 1 - abar

def euler_flow(xbar, sigmas, eps_fn):
    return xbar

def exact_flow_gauss(xbar, s, s_next, v):
    return xbar * s_next / s
`,
        solution: FLOW,
        tests: [
          { name: "vars", code: `xb, s = to_ode(1.0, 0.2)\nassert abs(xb - 5 ** 0.5) < 1e-12 and abs(s - 2.0) < 1e-12\nassert abs(exact_flow_gauss(3.0, 2.0, 1.0, 4.0) - 3.0 * (5 / 8) ** 0.5) < 1e-12` },
          { name: "euler", code: `g = lambda x, s: s * x / (4 + s * s)\nassert abs(euler_flow(5.0, [4.0, 2.0, 0.0], g) - 5.0 * 0.6 * 0.5) < 1e-12 and euler_flow(5.0, [4.0], g) == 5.0` },
        ],
      },
    },
    {
      key: "exact",
      rung: "stretch",
      prompt: (
        <p>
          The data are <M>{"\\mathcal{N}(0, 1)"}</M> under the VP process. One deterministic DDIM step from{" "}
          <M>{"\\bar\\alpha = 0.1"}</M> straight to <M>{"\\bar\\alpha = 1"}</M> maps <M>{"x = 2"}</M> to about 0.63. Where does the
          exact probability flow map it?
        </p>
      ),
      answer: { kind: "numeric", value: 2, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        DDIM showed that the sampler is a free choice once the network is trained. EDM, next, makes every other choice free
        too: the noise schedule, the scaling of inputs and outputs, the loss weighting and the ODE solver, each chosen on its
        own merits.
      </p>
    </>
  ),
};
