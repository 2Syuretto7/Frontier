import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PcSamplerViz } from "@/components/viz/PcSamplerViz";
import type { LessonContent } from "@/lib/types";

const SDES = `import math

def vp_marginal(t, bmin, bmax):
    B = bmin * t + 0.5 * (bmax - bmin) * t * t                 # integral of beta(s) = bmin + (bmax - bmin) s over [0, t]
    return math.exp(-0.5 * B), math.sqrt(1 - math.exp(-B))     # mean coefficient and standard deviation of x_t given x_0

def ve_sigma(t, smin, smax):
    return smin * (smax / smin) ** t                           # geometric noise levels

def score_from_eps(eps_hat, std):
    return -eps_hat / std`;

const SAMPLER = `import math

def reverse_step(x, s, s_next, score, z):
    d = s * s - s_next * s_next                                # variance removed in this VE step
    return x + d * score(x, s) + math.sqrt(d) * z

def langevin_step(x, s, score, r, z):
    e = r * s * s                                              # step size scaled to the noise level
    return x + e * score(x, s) + math.sqrt(2 * e) * z

def pc_sample(x, sigmas, score, r, noise):
    for i in range(len(sigmas) - 1):
        z1, z2 = noise()
        x = reverse_step(x, sigmas[i], sigmas[i + 1], score, z1)   # predictor: one step of the reverse SDE
        x = langevin_step(x, sigmas[i + 1], score, r, z2)          # corrector: one Langevin step at the new level
    return x`;

export const lesson: LessonContent = {
  id: "l12.1.2",
  minutes: 55,
  links: {
    requires: ["l12.1.1", "m19.4.1"],
    revisits: ["m19.3.3", "l7.6.3"],
    foreshadows: ["l12.1.3"],
  },

  puzzle: (
    <>
      <p>
        Two families of image generators appeared around 2019 and 2020. One trained a network to predict the noise in images
        corrupted at a thousand fixed levels and sampled by ancestral steps. The other trained a network to estimate scores at
        a few dozen noise levels and sampled by annealed Langevin dynamics. They looked like rival methods with different
        losses, schedules and samplers. Are they? And if each is one way of discretising something, can the discretisation be
        chosen after training?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Take the number of noise levels to infinity. Both corruptions become stochastic differential equations: one shrinks
        the signal while adding noise and keeps the variance fixed, the other only adds noise and lets the variance explode.
        Both can be run backwards in time once the score of every noisy distribution is known, and both networks are score
        estimators in disguise. Training fixes only the score; the sampler is then a numerical method for the reverse
        equation, and like any numerical method it can be swapped, refined, or combined with an MCMC correction at each
        noise level.
      </p>
      <PcSamplerViz />
    </>
  ),

  theory: (
    <>
      <Definition title="forward SDEs">
        <p>
          A forward SDE <M>{"dx = f(x, t)\\, dt + g(t)\\, dw"}</M> on <M>{"t \\in [0, 1]"}</M> carries the data distribution{" "}
          <M>{"p_0"}</M> to a simple <M>{"p_1"}</M>. The variance-preserving (VP) SDE has{" "}
          <M>{"f = -\\tfrac{1}{2}\\beta(t) x"}</M> and <M>{"g = \\sqrt{\\beta(t)}"}</M>, usually with{" "}
          <M>{"\\beta(t) = \\beta_{\\min} + t(\\beta_{\\max} - \\beta_{\\min})"}</M>. The variance-exploding (VE) SDE has{" "}
          <M>{"f = 0"}</M> and <M>{"g = \\sqrt{d\\sigma^2(t)/dt}"}</M>, usually with geometric{" "}
          <M>{"\\sigma(t) = \\sigma_{\\min} (\\sigma_{\\max}/\\sigma_{\\min})^t"}</M> (<C>ve_sigma</C>).
        </p>
      </Definition>

      <Theorem title="DDPM is the VP SDE, discretised">
        <p>
          With <M>{"\\beta_i = \\beta(t_i)\\, \\Delta t"}</M>, the DDPM step{" "}
          <M>{"x_i = \\sqrt{1 - \\beta_i}\\, x_{i-1} + \\sqrt{\\beta_i}\\, z"}</M> agrees with the Euler–Maruyama step of the VP SDE
          up to <M>{"O(\\Delta t^2)"}</M> in the drift. The noise-conditional score network chain{" "}
          <M>{"x_i = x_{i-1} + \\sqrt{\\sigma_i^2 - \\sigma_{i-1}^2}\\, z"}</M> is exactly the VE SDE observed at the levels{" "}
          <M>{"\\sigma_i"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\sqrt{1 - u} = 1 - u/2 + O(u^2)"}</M>, so{" "}
          <M>{"x_i = x_{i-1} - \\tfrac{1}{2}\\beta(t_i) x_{i-1}\\, \\Delta t + \\sqrt{\\beta(t_i) \\Delta t}\\, z + O(\\Delta t^2)\\, x_{i-1}"}</M>,
          which is Euler–Maruyama for <M>{"f = -\\tfrac{1}{2}\\beta x"}</M> and <M>{"g = \\sqrt\\beta"}</M>. For the VE SDE, the
          increment over <M>{"[t_{i-1}, t_i]"}</M> is <M>{"\\int g\\, dw"}</M>, a centred Gaussian with variance{" "}
          <M>{"\\int g^2\\, dt = \\sigma_i^2 - \\sigma_{i-1}^2"}</M>, independent of the past.
        </p>
      </Proof>

      <Theorem title="the VP marginal">
        <p>
          Under the VP SDE, <M>{"x_t \\mid x_0 \\sim \\mathcal{N}(e^{-B(t)/2} x_0, (1 - e^{-B(t)}) I)"}</M> with{" "}
          <M>{"B(t) = \\int_0^t \\beta(s)\\, ds"}</M> (<C>vp_marginal</C>). In particular the continuous analogue of{" "}
          <M>{"\\bar\\alpha_t"}</M> is <M>{"e^{-B(t)}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The SDE is linear with Gaussian increments, so <M>{"x_t"}</M> given <M>{"x_0"}</M> is Gaussian, and each coordinate
          behaves independently. Its mean solves <M>{"m' = -\\tfrac{1}{2}\\beta m"}</M>, so{" "}
          <M>{"m = e^{-B/2} x_0"}</M>. By Itô&apos;s formula its variance solves <M>{"v' = -\\beta v + \\beta"}</M> with{" "}
          <M>{"v(0) = 0"}</M>; then <M>{"(1 - v)' = -\\beta (1 - v)"}</M> and <M>{"1 - v = e^{-B}"}</M>.
        </p>
        <Code>{SDES}</Code>
      </Proof>

      <Definition title="the reverse SDE and the learned score">
        <p>
          By m19.4.1, the time reversal of the forward SDE is{" "}
          <M>{"dx = [f(x, t) - g(t)^2 \\nabla_x \\log p_t(x)]\\, dt + g(t)\\, d\\bar w"}</M>, run from t = 1 to t = 0. A noise
          predictor trained at the marginal of the previous theorem gives the score estimate{" "}
          <M>{"\\nabla \\log p_t(x) \\approx -\\hat\\varepsilon_\\theta(x, t) / \\sqrt{1 - e^{-B(t)}}"}</M> (<C>score_from_eps</C>):
          the noise predictor of l12.1.1 and a score network differ only by this scale.
        </p>
      </Definition>

      <Definition title="predictor-corrector sampling">
        <p>
          A predictor is any numerical step of the reverse SDE from <M>{"t"}</M> to <M>{"t - \\Delta t"}</M>. For the VE SDE the
          reverse-diffusion predictor is{" "}
          <M>{"x \\leftarrow x + (\\sigma_t^2 - \\sigma_{t - \\Delta t}^2)\\, s_\\theta(x, \\sigma_t) + \\sqrt{\\sigma_t^2 - \\sigma_{t - \\Delta t}^2}\\, z"}</M>{" "}
          (<C>reverse_step</C>). A corrector is any MCMC step that leaves <M>{"p_{t - \\Delta t}"}</M> invariant, such as a
          Langevin step <M>{"x \\leftarrow x + \\epsilon\\, s_\\theta(x) + \\sqrt{2\\epsilon}\\, z"}</M> with{" "}
          <M>{"\\epsilon"}</M> proportional to <M>{"\\sigma^2"}</M> (<C>langevin_step</C>). Alternating them gives{" "}
          <C>pc_sample</C>.
        </p>
        <Code>{SAMPLER}</Code>
      </Definition>

      <Theorem title="why a corrector helps">
        <p>
          The Langevin diffusion <M>{"dx = \\nabla \\log p(x)\\, ds + \\sqrt{2}\\, dw"}</M> leaves p invariant. So if the
          predictor&apos;s discretisation error leaves the samples near but not at <M>{"p_t"}</M>, running Langevin dynamics with
          the score of <M>{"p_t"}</M> moves them towards <M>{"p_t"}</M> without moving an exact sample away.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the Fokker–Planck equation of m19.3.3, a density q evolves as{" "}
          <M>{"\\partial_s q = -\\nabla \\cdot (q \\nabla \\log p) + \\Delta q"}</M>. At q = p,{" "}
          <M>{"p \\nabla \\log p = \\nabla p"}</M>, so the right side is <M>{"-\\Delta p + \\Delta p = 0"}</M>. Convergence from
          nearby q, at a rate set by the log-Sobolev constant of p, is the content of l7.6.3; a single discrete step only
          approximates the diffusion, which is why its size must shrink with <M>{"\\sigma"}</M>.
        </p>
      </Proof>

      <Example title="the cost of too few steps">
        <p>
          In the figure the score is exact, so all error comes from discretisation. With five predictor steps the samples land
          with twice the spread of the data; one corrector step after each predictor step removes about a third of the excess,
          and with a hundred steps neither error is visible. Each corrector step costs one network evaluation, so the fair
          comparison is at equal evaluations: ten predictor steps alone beat five predictor-corrector pairs here.
        </p>
      </Example>

      <Remark title="what the continuous view buys">
        <p>
          Training and sampling are now separate choices. The same network can be sampled with any SDE solver, at any number
          of steps, with or without correction, and the same reverse dynamics has a deterministic twin with identical marginals,
          the probability flow ODE of m19.5.1, which the next lesson turns into fast samplers. The VE and VP choices also turn
          out to be one family under a change of variables, an observation the EDM lesson exploits.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "vpsd",
      rung: "check",
      prompt: (
        <p>
          For the VP SDE with <M>{"\\beta(t) = 0.1 + 19.9 t"}</M>, what is the standard deviation of <M>{"x_t"}</M> given{" "}
          <M>{"x_0"}</M> at t = 0.2?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5845, tolerance: 0.0005 },
    },
    {
      key: "vet",
      rung: "check",
      prompt: (
        <p>
          A VE SDE has <M>{"\\sigma_{\\min} = 0.01"}</M> and <M>{"\\sigma_{\\max} = 50"}</M> with geometric levels. At what t is{" "}
          <M>{"\\sigma(t) = 1"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5407, tolerance: 0.0005 },
    },
    {
      key: "corr",
      rung: "apply",
      prompt: <p>Why can a Langevin corrector use the same score network as the predictor without retraining?</p>,
      answer: {
        kind: "choice",
        options: [
          "It needs only the score of the noisy marginal at the current level, which is exactly what the network estimates",
          "It uses the score of the data distribution, which the network learns at t = 0",
          "It does not use the score, only fresh Gaussian noise",
          "It needs the score of the forward transition q(x_t | x_{t-1}), which is known in closed form",
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

def vp_marginal(t, bmin, bmax):
    B = bmin * t + 0.5 * (bmax - bmin) * t * t                 # integral of beta(s) = bmin + (bmax - bmin) s over [0, t]
    return math.exp(-0.5 * B), math.sqrt(1 - math.exp(-B))     # mean coefficient and standard deviation of x_t given x_0

def ve_sigma(t, smin, smax):
    return smin * (smax / smin) ** t                           # geometric noise levels

def score_from_eps(eps_hat, std):
    return -eps_hat / std

m, sd = vp_marginal(1.0, 0.0, 2.0)
print(round(m, 4), round(sd, 4), round(ve_sigma(0.5, 0.01, 100), 4), score_from_eps(1.5, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.6065 0.7951 1.0 -3.0",
          "0.3679 0.6321 1.0 -3.0",
          "0.6065 0.7951 50.005 -3.0",
          "0.6065 0.7951 1.0 3.0",
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

def reverse_step(x, s, s_next, score, z):
    d = s * s - s_next * s_next                                # variance removed in this VE step
    return x + d * score(x, s) + math.sqrt(d) * z

def langevin_step(x, s, score, r, z):
    e = r * s * s                                              # step size scaled to the noise level
    return x + e * score(x, s) + math.sqrt(2 * e) * z

def pc_sample(x, sigmas, score, r, noise):
    for i in range(len(sigmas) - 1):
        z1, z2 = noise()
        x = reverse_step(x, sigmas[i], sigmas[i + 1], score, z1)   # predictor: one step of the reverse SDE
        x = langevin_step(x, sigmas[i + 1], score, r, z2)          # corrector: one Langevin step at the new level
    return x

sc = lambda x, s: -x / (1 + s * s); noise = lambda: (0.0, 1.0)
print(round(reverse_step(2.0, 1.0, 0.0, sc, 0.0), 4), round(langevin_step(2.0, 1.0, sc, 0.5, 0.0), 4), round(pc_sample(3.0, [2.0, 1.0, 0.0], sc, 0.0, noise), 4), round(pc_sample(3.0, [2.0, 1.0], sc, 0.5, noise), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 1.5 0.6 1.9",
          "1.0 1.5 1.6 1.9",
          "1.0 1.5 0.6 0.9",
          "1.0 1.0 0.6 1.9",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>vp_marginal(t, bmin, bmax)</C> returning the mean coefficient and standard deviation of the VP SDE with linear{" "}
          <M>{"\\beta"}</M>, <C>ve_sigma(t, smin, smax)</C> for geometric levels, and <C>score_from_eps(eps_hat, std)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def vp_marginal(t, bmin, bmax):
    return 1.0, t

def ve_sigma(t, smin, smax):
    return smin + (smax - smin) * t

def score_from_eps(eps_hat, std):
    return eps_hat
`,
        solution: SDES,
        tests: [
          { name: "vp", code: `import math\nm, s = vp_marginal(2.0, 1.0, 1.0)\nassert abs(m - math.exp(-1)) < 1e-12 and abs(s - math.sqrt(1 - math.exp(-2))) < 1e-12\nm, s = vp_marginal(1.0, 0.0, 4.0)\nassert abs(m - math.exp(-1)) < 1e-12` },
          { name: "ve", code: `assert abs(ve_sigma(0.5, 0.1, 10.0) - 1.0) < 1e-12 and abs(ve_sigma(1.0, 0.1, 10.0) - 10.0) < 1e-12 and abs(score_from_eps(0.6, 0.3) + 2.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For the VE SDE and scalars, with <C>score(x, s)</C> the score at noise level s, write{" "}
          <C>reverse_step(x, s, s_next, score, z)</C>, <C>langevin_step(x, s, score, r, z)</C> with step size{" "}
          <M>{"r s^2"}</M>, and <C>pc_sample(x, sigmas, score, r, noise)</C> where <C>noise()</C> returns the pair of normals
          used by one predictor and one corrector step.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def reverse_step(x, s, s_next, score, z):
    return x + score(x, s)

def langevin_step(x, s, score, r, z):
    return x

def pc_sample(x, sigmas, score, r, noise):
    return x
`,
        solution: SAMPLER,
        tests: [
          { name: "steps", code: `sc = lambda x, s: -x / (1 + s * s)\nassert abs(reverse_step(4.0, 3.0, 1.0, sc, 0.5) - (4.0 - 8 * 0.4 + 8 ** 0.5 * 0.5)) < 1e-12\nassert abs(langevin_step(4.0, 1.0, sc, 0.5, 2.0) - 5.0) < 1e-12` },
          { name: "pc", code: `sc = lambda x, s: -x / (1 + s * s)\nx = pc_sample(5.0, [3.0, 1.0], sc, 0.5, lambda: (0.0, 0.0))\nassert abs(x - 0.75) < 1e-12\nassert abs(pc_sample(5.0, [3.0], sc, 0.5, lambda: (1.0, 1.0)) - 5.0) < 1e-12` },
        ],
      },
    },
    {
      key: "var",
      rung: "stretch",
      prompt: (
        <p>
          Data have variance 4 in one dimension. Under the VP SDE with constant <M>{"\\beta = 1"}</M>, what is the variance of{" "}
          <M>{"x_1"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 2.1036, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        The reverse SDE injects fresh noise at every step, which limits how large the steps can be. Its deterministic twin,
        the probability flow ODE, has the same marginals and none of that noise. Next: DDIM, which turns a DDPM-trained network
        into a fast deterministic sampler, and why it is a solver for that ODE.
      </p>
    </>
  ),
};
