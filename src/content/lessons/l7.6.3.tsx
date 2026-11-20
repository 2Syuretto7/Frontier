import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AnnealedLangevinViz } from "@/components/viz/AnnealedLangevinViz";
import type { LessonContent } from "@/lib/types";

const LANGEVIN = `import math

def langevin_step(x, score, eps, xi):
    return x + eps * score(x) + math.sqrt(2 * eps) * xi

def run_langevin(x, score, eps, xis):
    for xi in xis:
        x = langevin_step(x, score, eps, xi)
    return x

def annealed_langevin(x, score_at, sigmas, eps0, n_each, xis):
    k = 0
    for s in sigmas:
        eps = eps0 * (s / sigmas[-1]) ** 2
        for _ in range(n_each):
            x = langevin_step(x, lambda y: score_at(y, s), eps, xis[k])
            k += 1
    return x`;

const MALA = `import math

def log_q(x_new, x, score, eps):
    return -(x_new - x - eps * score(x)) ** 2 / (4 * eps)

def mala_accept_prob(x, y, logp, score, eps):
    a = logp(y) - logp(x) + log_q(x, y, score, eps) - log_q(y, x, score, eps)
    return min(1.0, math.exp(a))

def ula_stationary_var(eps, s2=1.0):
    return 2 * s2 / (2 - eps / s2)`;

export const lesson: LessonContent = {
  id: "l7.6.3",
  minutes: 45,
  links: {
    requires: ["l7.6.2", "m13.4.4", "m13.4.1"],
    revisits: ["m13.3.3", "l7.6.1"],
    foreshadows: ["l12.1.2", "l12.1.4"],
  },

  puzzle: (
    <>
      <p>
        A network has learned the score of a distribution of faces: at every point in image space, it says which direction
        makes the image more face-like. Following that direction uphill from random noise would end at the single most
        face-like image, the same every time. How do you turn a direction field into a sampler that produces a different,
        properly distributed face on every run?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Add noise to the climb. Each step moves a little way up the score and then jitters at random by an amount tied to
        the step size. The climb pulls points towards high density, the jitter spreads them out, and with the right balance
        the points settle into exactly the target distribution, as for a particle in a potential well at thermal equilibrium
        (m13.4.4).
      </p>
      <p>
        In practice there are two catches. Discrete steps make the stationary distribution slightly wrong. And a sampler that
        must cross regions of near-zero density, between separated modes, takes astronomically long to do so, so it never
        learns their relative sizes. Starting from heavily blurred scores and sharpening them, <em>annealing</em>, fixes the
        second.
      </p>
      <AnnealedLangevinViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the unadjusted Langevin algorithm">
        <p>
          With step size ε and independent standard normal <M>{"\\xi_k"}</M>,
        </p>
        <MD>{"x_{k+1} = x_k + \\varepsilon\\, \\nabla \\log p(x_k) + \\sqrt{2\\varepsilon}\\, \\xi_k"}</MD>
        <p>
          (<C>langevin_step</C>, <C>run_langevin</C>), the Euler-Maruyama discretisation of the Langevin diffusion{" "}
          <M>{"dX = \\nabla \\log p(X)\\, dt + \\sqrt 2\\, dW"}</M>, whose stationary distribution is exactly p. Only the score is
          needed, so it works with a learned score or an EBM&apos;s energy gradient.
        </p>
      </Definition>

      <Theorem title="discretisation bias">
        <p>
          For a Gaussian target <M>{"\\mathcal{N}(0, s^2)"}</M> and <M>{"0 < \\varepsilon < 2s^2"}</M>, the unadjusted Langevin chain has
          stationary distribution <M>{"\\mathcal{N}(0, 2s^2/(2 - \\varepsilon/s^2))"}</M>, too wide by a factor that tends to 1 as ε → 0.
        </p>
      </Theorem>
      <Proof>
        <p>
          With score <M>{"-x/s^2"}</M> the update is <M>{"x_{k+1} = (1 - a) x_k + \\sqrt{2\\varepsilon}\\, \\xi_k"}</M> with{" "}
          <M>{"a = \\varepsilon / s^2"}</M>, a linear autoregression that is stable when |1 − a| &lt; 1. A stationary variance v must
          satisfy <M>{"v = (1 - a)^2 v + 2\\varepsilon"}</M>, so <M>{"v = 2\\varepsilon/(2a - a^2) = 2s^2/(2 - a)"}</M> (<C>ula_stationary_var</C>).
        </p>
        <Code>{LANGEVIN}</Code>
      </Proof>

      <Definition title="the Metropolis-adjusted Langevin algorithm">
        <p>
          MALA treats the Langevin step as a proposal y with density{" "}
          <M>{"q(y \\mid x) \\propto \\exp(-\\|y - x - \\varepsilon \\nabla \\log p(x)\\|^2 / 4\\varepsilon)"}</M> (<C>log_q</C>) and accepts it
          with the Metropolis-Hastings probability{" "}
          <M>{"\\min\\big(1, \\frac{p(y)\\, q(x \\mid y)}{p(x)\\, q(y \\mid x)}\\big)"}</M> (m13.4.1, <C>mala_accept_prob</C>). The chain then has
          p as its exact stationary distribution for any ε. It needs log p up to a constant, so it suits EBMs but not a bare
          learned score, which is one reason score-based samplers use small steps and accept the bias.
        </p>
        <Code>{MALA}</Code>
      </Definition>

      <Remark title="why modes get the wrong weights">
        <p>
          The chain mixes quickly within a mode but crosses a region of tiny density at a rate that falls exponentially with
          the height of the energy barrier (m13.3.3). Started from a broad distribution, points fall into whichever mode is
          nearer, and their proportions reflect the starting distribution, not the target. Worse, a learned score is
          unreliable exactly in those empty regions (l7.6.2).
        </p>
      </Remark>

      <Definition title="annealed Langevin dynamics">
        <p>
          With scores <M>{"\\nabla \\log p_{\\sigma_i}"}</M> learned at decreasing noise levels{" "}
          <M>{"\\sigma_1 > \\dots > \\sigma_L"}</M>, run a few Langevin steps at each level, starting each from where the last ended,
          with step size <M>{"\\varepsilon_i = \\varepsilon_0\\, \\sigma_i^2/\\sigma_L^2"}</M> so that every level moves by a similar
          fraction of its own width (<C>annealed_langevin</C>). At large σ the modes merge into one smooth hill whose shape
          reflects their weights, and the score is accurate everywhere; as σ falls, each point is guided into a mode in the
          right proportions. This is the sampler of noise-conditional score networks (Song and Ermon, 2019), and the
          predictor-corrector samplers of score-based diffusion (l12.1.2) still use Langevin steps as the corrector.
        </p>
      </Definition>
    </>
  ),

  practice: [
    {
      key: "bias",
      rung: "check",
      prompt: <p>Unadjusted Langevin with step size 0.5 targets N(0, 1). What variance does its stationary distribution have? Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.3333, tolerance: 0.0001 },
    },
    {
      key: "steps",
      rung: "check",
      prompt: <p>Annealed Langevin uses ε₀ = 2 × 10⁻⁵ at the final noise level σ = 0.01 and scales the step with σ². What step size does it use at σ = 1?</p>,
      answer: { kind: "numeric", value: 0.2, tolerance: 0.0001 },
    },
    {
      key: "anneal",
      rung: "apply",
      prompt: <p>Why does annealing over noise levels recover the relative weights of well-separated modes when plain Langevin does not?</p>,
      answer: {
        kind: "choice",
        options: [
          "At high noise the modes merge, so points move freely between them and distribute by weight before the modes separate",
          "Annealing uses larger steps, which always reduce discretisation bias",
          "Annealing rejects samples that land in the wrong mode",
          "Plain Langevin cannot use the score of a mixture",
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

def langevin_step(x, score, eps, xi):
    return x + eps * score(x) + math.sqrt(2 * eps) * xi

def run_langevin(x, score, eps, xis):
    for xi in xis:
        x = langevin_step(x, score, eps, xi)
    return x

def annealed_langevin(x, score_at, sigmas, eps0, n_each, xis):
    k = 0
    for s in sigmas:
        eps = eps0 * (s / sigmas[-1]) ** 2
        for _ in range(n_each):
            x = langevin_step(x, lambda y: score_at(y, s), eps, xis[k])
            k += 1
    return x

print(round(langevin_step(1.0, lambda x: -x, 0.1, 0.0), 4), langevin_step(0.0, lambda x: -x, 0.5, 1.0), run_langevin(2.0, lambda x: -x, 0.5, [0, 0, 0]))
print(round(annealed_langevin(4.0, lambda x, s: -x / (1 + s * s), [2, 1], 0.1, 1, [0, 0]), 4), round(annealed_langevin(4.0, lambda x, s: -x / (1 + s * s), [1], 0.1, 2, [0, 0]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.9 1.0 0.25\n3.496 3.61",
          "0.9 0.5 0.25\n3.496 3.61",
          "0.9 1.0 1.0\n3.496 3.61",
          "0.9 1.0 0.25\n3.61 3.496",
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

def log_q(x_new, x, score, eps):
    return -(x_new - x - eps * score(x)) ** 2 / (4 * eps)

def mala_accept_prob(x, y, logp, score, eps):
    a = logp(y) - logp(x) + log_q(x, y, score, eps) - log_q(y, x, score, eps)
    return min(1.0, math.exp(a))

def ula_stationary_var(eps, s2=1.0):
    return 2 * s2 / (2 - eps / s2)

print(log_q(1.0, 0.0, lambda x: -x, 0.25), round(mala_accept_prob(0.0, 1.0, lambda x: -x * x / 2, lambda x: -x, 0.25), 4))
print(mala_accept_prob(1.0, 0.0, lambda x: -x * x / 2, lambda x: -x, 0.25), round(ula_stationary_var(0.1), 4), ula_stationary_var(1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-1.0 0.9394\n1.0 1.0526 2.0",
          "-1.0 1.0\n1.0 1.0526 2.0",
          "-1.0 0.9394\n0.9394 1.0526 2.0",
          "-1.0 0.9394\n1.0 0.9524 2.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>langevin_step(x, score, eps, xi)</C>, <C>run_langevin(x, score, eps, xis)</C> using one noise value per step, and{" "}
          <C>annealed_langevin(x, score_at, sigmas, eps0, n_each, xis)</C>, taking <C>n_each</C> steps at each noise level with
          score <C>score_at(x, sigma)</C> and step <M>{"\\varepsilon_0 \\sigma^2 / \\sigma_L^2"}</M>, consuming the noise values in order.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def langevin_step(x, score, eps, xi):
    return x + eps * score(x)

def run_langevin(x, score, eps, xis):
    return x

def annealed_langevin(x, score_at, sigmas, eps0, n_each, xis):
    return x
`,
        solution: LANGEVIN,
        tests: [
          { name: "steps", code: `assert langevin_step(1.0, lambda x: 2.0, 0.5, 1.0) == 3.0 and run_langevin(1.0, lambda x: 0.0, 2.0, [1.0, -0.5]) == 2.0 and run_langevin(8.0, lambda x: -x, 0.5, [0, 0]) == 2.0` },
          { name: "annealed", code: `v = annealed_langevin(0.0, lambda x, s: s, [2.0, 1.0], 0.5, 1, [0.0, 0.0]); assert abs(v - (2.0 * 2.0 + 0.5 * 1.0)) < 1e-12
v = annealed_langevin(0.0, lambda x, s: 0.0, [1.0], 0.5, 2, [1.0, 1.0]); assert abs(v - 2.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>log_q(x_new, x, score, eps)</C>, the log of the Langevin proposal density up to a constant;{" "}
          <C>mala_accept_prob(x, y, logp, score, eps)</C>; and <C>ula_stationary_var(eps, s2=1.0)</C> for the target N(0, s2).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def log_q(x_new, x, score, eps):
    return 0.0

def mala_accept_prob(x, y, logp, score, eps):
    return 1.0

def ula_stationary_var(eps, s2=1.0):
    return s2
`,
        solution: MALA,
        tests: [
          { name: "proposal and bias", code: `assert log_q(3.0, 1.0, lambda x: 2.0, 0.5) == -0.5 and abs(ula_stationary_var(0.5, 2.0) - 4 / 1.75) < 1e-12 and abs(ula_stationary_var(0.1) - 2 / 1.9) < 1e-12` },
          { name: "acceptance", code: `lp = lambda x: -x * x / 2; sc = lambda x: -x
a = mala_accept_prob(2.0, 0.0, lp, sc, 0.5); assert a == 1.0
b = mala_accept_prob(0.0, 2.0, lp, sc, 0.5); assert abs(b - math.exp(-2 + log_q(0.0, 2.0, sc, 0.5) - log_q(2.0, 0.0, sc, 0.5))) < 1e-12 and b < 1` },
        ],
      },
    },
    {
      key: "wide",
      rung: "stretch",
      prompt: <p>Unadjusted Langevin with step size 1 targets N(0, 4). What is the variance of its stationary distribution? Give three decimals.</p>,
      answer: { kind: "numeric", value: 4.571, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Generative models describe uncertainty about data. The last part turns to uncertainty about the model itself: what a
        network does not know, how to measure it, and whether its stated confidence can be trusted.
      </p>
    </>
  ),
};
