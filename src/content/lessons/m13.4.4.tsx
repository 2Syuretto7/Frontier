import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LangevinBiasViz } from "@/components/viz/LangevinBiasViz";
import type { LessonContent } from "@/lib/types";

const LG = `import numpy as np

def ula(rng, grad_logp, x0, h, n):
    x, out = np.asarray(x0, float), []
    for _ in range(n):
        x = x + h * grad_logp(x) + np.sqrt(2 * h) * rng.normal(size=x.shape)
        out.append(x)
    return np.array(out)

def mala(rng, logp, grad_logp, x0, h, n):
    x, out, acc = np.asarray(x0, float), [], 0
    logq = lambda a, b: -((b - a - h * grad_logp(a)) ** 2).sum() / (4 * h)
    for _ in range(n):
        y = x + h * grad_logp(x) + np.sqrt(2 * h) * rng.normal(size=x.shape)
        if np.log(rng.random()) < logp(y) - logp(x) + logq(y, x) - logq(x, y):
            x, acc = y, acc + 1
        out.append(x)
    return np.array(out), acc / n`;

const BIAS = `import numpy as np

def ula_var(sigma2, h):
    a = 1 - h / sigma2
    return 2 * h / (1 - a ** 2) if abs(a) < 1 else float("inf")

def ula_particles(grad_logp, h, steps, m, seed=0):
    rng = np.random.default_rng(seed); x = np.zeros(m)
    for _ in range(steps):
        x = x + h * grad_logp(x) + np.sqrt(2 * h) * rng.normal(size=m)
    return x`;

export const lesson: LessonContent = {
  id: "m13.4.4",
  minutes: 55,
  links: {
    requires: ["m13.4.3"],
    revisits: ["m13.4.1", "m13.3.2"],
    foreshadows: ["m13.5.2", "m13.5.3"],
  },

  puzzle: (
    <>
      <p>
        Gradient descent on −log π walks to the mode and stops. Add just the right amount of Gaussian noise at every step and,
        remarkably, the iterates stop converging to a point and start sampling the whole distribution. What is the right
        amount, why is it right, and why does the recipe that works in continuous time produce subtly wrong samples once you
        take finite steps?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The drift <M>{"\\nabla\\log\\pi"}</M> pushes particles towards high density and the noise spreads them out. In
        continuous time the two balance exactly at π: wherever particles pile up too much, diffusion carries the excess away
        faster than the drift brings it in. A finite step size h upsets the balance by an amount of order h. You can either
        accept the bias and make h small, or treat each step as a proposal and let a Metropolis test clean up, which is the
        Metropolis-adjusted Langevin algorithm.
      </p>
      <LangevinBiasViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the Langevin diffusion">
        <p>
          The overdamped Langevin diffusion for a density π on <M>{"\\mathbb R^d"}</M> is
        </p>
        <MD>{"dX_t = \\nabla\\log\\pi(X_t)\\,dt + \\sqrt 2\\,dW_t,"}</MD>
        <p>
          where W is a Brownian motion, studied properly in the next section. Its generator, the rate of change of{" "}
          <M>{"E f(X_t)"}</M>, is <M>{"\\mathcal Lf = \\nabla\\log\\pi\\cdot\\nabla f + \\Delta f"}</M>.
        </p>
      </Definition>

      <Theorem title="π is stationary, and the diffusion is reversible">
        <p>
          For smooth, rapidly decaying f and g,{" "}
          <M>{"\\int g\\,\\mathcal Lf\\,\\pi\\,dx = -\\int \\nabla f\\cdot\\nabla g\\,\\pi\\,dx"}</M>. In particular{" "}
          <M>{"\\int \\mathcal Lf\\,\\pi\\,dx = 0"}</M>, so π is stationary, and <M>{"\\mathcal L"}</M> is symmetric in{" "}
          <M>{"L^2(\\pi)"}</M>, the continuous analogue of detailed balance.
        </p>
      </Theorem>
      <Proof>
        <p>
          Since <M>{"\\pi\\nabla\\log\\pi = \\nabla\\pi"}</M>,{" "}
          <M>{"\\int g\\,\\mathcal Lf\\,\\pi = \\int g\\,\\nabla\\pi\\cdot\\nabla f + \\int g\\pi\\,\\Delta f"}</M>. Integrating the
          second term by parts gives{" "}
          <M>{"-\\int \\nabla(g\\pi)\\cdot\\nabla f = -\\int \\pi\\nabla g\\cdot\\nabla f - \\int g\\nabla\\pi\\cdot\\nabla f"}</M>, and
          the terms with <M>{"\\nabla\\pi"}</M> cancel. The result is symmetric in f and g, and taking g = 1 gives stationarity.
          The factor √2 matters: with noise <M>{"\\sqrt{2T}"}</M> the stationary law would be <M>{"\\pi^{1/T}"}</M>, a tempered
          version of π.
        </p>
      </Proof>

      <Theorem title="the unadjusted Langevin algorithm is biased">
        <p>
          The Euler discretisation <M>{"x' = x + h\\nabla\\log\\pi(x) + \\sqrt{2h}\\,\\xi"}</M> applied to{" "}
          <M>{"\\pi = N(0, \\sigma^2)"}</M> is stable if and only if <M>{"h < 2\\sigma^2"}</M>, and then its stationary
          distribution is normal with variance <M>{"\\sigma^2/(1 - h/2\\sigma^2)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Here <M>{"x' = (1 - h/\\sigma^2)x + \\sqrt{2h}\\,\\xi"}</M>, an AR(1) recursion with coefficient{" "}
          <M>{"a = 1 - h/\\sigma^2"}</M>. It is stable when |a| &lt; 1, that is 0 &lt; h &lt; 2σ², and the stationary variance v
          solves <M>{"v = a^2v + 2h"}</M>, so{" "}
          <M>{"v = 2h/(1 - a^2) = 2h/(2h/\\sigma^2 - h^2/\\sigma^4) = \\sigma^2/(1 - h/2\\sigma^2)"}</M>. The relative error is
          about <M>{"h/2\\sigma^2"}</M>, first order in h; in general ULA is consistent only as h → 0.
        </p>
        <Code>{BIAS}</Code>
      </Proof>

      <Theorem title="MALA is one-step HMC">
        <p>
          The Metropolis-adjusted Langevin algorithm proposes{" "}
          <M>{"y \\sim N(x + h\\nabla\\log\\pi(x), 2hI)"}</M> and accepts with the Hastings ratio. It is exactly HMC with a single
          leapfrog step of size <M>{"\\varepsilon = \\sqrt{2h}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          One leapfrog step from (x, p) with <M>{"U = -\\log\\pi"}</M> gives{" "}
          <M>{"y = x + \\varepsilon p - \\tfrac{\\varepsilon^2}{2}\\nabla U(x) = x + h\\nabla\\log\\pi(x) + \\sqrt{2h}\\,p"}</M>,
          which with <M>{"p \\sim N(0, I)"}</M> is the MALA proposal. The HMC acceptance{" "}
          <M>{"\\exp(-\\Delta H)"}</M> equals the MALA Hastings ratio after expressing the final momentum q through y, a direct
          if tedious calculation. For product targets the step can scale as <M>{"h \\propto d^{-1/3}"}</M>, between random-walk
          Metropolis and long-trajectory HMC, with optimal acceptance about 0.574. The proposal is not symmetric, so the
          Hastings term from the Metropolis-Hastings lesson is essential.
        </p>
        <Code>{LG}</Code>
      </Proof>

      <Remark title="beyond the textbook case">
        <p>
          When the gradient grows faster than linearly, as for <M>{"\\pi \\propto e^{-(x^2 - 1)^2}"}</M>, ULA with a fixed step is
          not merely biased but can be transient: one unlucky large step lands where the gradient is huge, and the next step
          overshoots further. Tamed or Metropolis-adjusted schemes fix this. Stochastic gradient Langevin dynamics replaces the
          full gradient with a minibatch estimate and lets h decrease, turning stochastic gradient descent into an approximate
          posterior sampler. And if <M>{"\\nabla\\log\\pi"}</M> is not known but learned from data, the score of a family of
          noised distributions, running Langevin dynamics with it is the sampling engine of score-based diffusion models.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "var",
      rung: "check",
      prompt: <p>ULA with h = 1 targets N(0, 2). What is the variance of its stationary distribution?</p>,
      answer: { kind: "numeric", value: 2.6667, tolerance: 0.001 },
    },
    {
      key: "stable",
      rung: "check",
      prompt: <p>What is the largest step size h for which ULA on N(0, 0.25) is stable?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "temp",
      rung: "apply",
      prompt: (
        <p>
          A colleague runs <M>{"x' = x + h\\nabla\\log\\pi(x) + \\sqrt h\\,\\xi"}</M>, forgetting the factor 2 under the root. For
          small h, what do the samples approximate?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "π², a sharpened version of π with half the temperature",
          "π itself, since the noise level only changes the speed",
          "√π, a flattened version of π",
          "The mode of π, since the noise vanishes as h → 0",
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

def ula(rng, grad_logp, x0, h, n):
    x, out = np.asarray(x0, float), []
    for _ in range(n):
        x = x + h * grad_logp(x) + np.sqrt(2 * h) * rng.normal(size=x.shape)
        out.append(x)
    return np.array(out)

def mala(rng, logp, grad_logp, x0, h, n):
    x, out, acc = np.asarray(x0, float), [], 0
    logq = lambda a, b: -((b - a - h * grad_logp(a)) ** 2).sum() / (4 * h)
    for _ in range(n):
        y = x + h * grad_logp(x) + np.sqrt(2 * h) * rng.normal(size=x.shape)
        if np.log(rng.random()) < logp(y) - logp(x) + logq(y, x) - logq(x, y):
            x, acc = y, acc + 1
        out.append(x)
    return np.array(out), acc / n

g = lambda x: -x / 4; o = ula(np.random.default_rng(0), g, np.zeros(1), 4.0, 20000); m, a = mala(np.random.default_rng(0), lambda x: -(x @ x) / 8, g, np.zeros(1), 4.0, 20000)
print(abs(o.var() - 8) < 0.5, abs(m.var() - 4) < 0.3, round(a, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["True True 0.78", "False True 0.78", "True False 0.78", "True True 1.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def ula_var(sigma2, h):
    a = 1 - h / sigma2
    return 2 * h / (1 - a ** 2) if abs(a) < 1 else float("inf")

def ula_particles(grad_logp, h, steps, m, seed=0):
    rng = np.random.default_rng(seed); x = np.zeros(m)
    for _ in range(steps):
        x = x + h * grad_logp(x) + np.sqrt(2 * h) * rng.normal(size=m)
    return x

print([round(ula_var(1.0, h), 3) for h in (0.5, 1.0, 1.5)], ula_var(1.0, 2.5))
p = ula_particles(lambda x: -x, 0.5, 200, 20000); print(abs(p.var() - 4 / 3) < 0.05)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.333, 2.0, 4.0] inf\nTrue",
          "[1.333, 2.0, 4.0] inf\nFalse",
          "[1.0, 1.0, 1.0] 1.0\nTrue",
          "[0.75, 0.5, 0.25] inf\nTrue",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ula(rng, grad_logp, x0, h, n)</C>, returning the n iterates, and{" "}
          <C>mala(rng, logp, grad_logp, x0, h, n)</C>, returning the states and acceptance rate of the Metropolis-adjusted
          version.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ula(rng, grad_logp, x0, h, n):
    return np.zeros((n, len(x0)))

def mala(rng, logp, grad_logp, x0, h, n):
    return np.zeros((n, len(x0))), 1.0
`,
        solution: LG,
        tests: [
          { name: "ula", code: `o = ula(np.random.default_rng(2), lambda x: -x, np.zeros(1), 0.5, 40000); assert o.shape == (40000, 1) and abs(o.var() - 4 / 3) < 0.08` },
          { name: "mala", code: `m, a = mala(np.random.default_rng(2), lambda x: -0.5 * (x @ x), lambda x: -x, np.zeros(1), 0.5, 40000); assert abs(m.var() - 1) < 0.08 and 0.8 < a < 0.99` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ula_var(sigma2, h)</C>, the stationary variance of ULA on <M>{"N(0, \\sigma^2)"}</M> (infinite when unstable),
          and <C>ula_particles(grad_logp, h, steps, m, seed)</C>, running m independent one-dimensional ULA chains from 0 in
          parallel and returning their final positions.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ula_var(sigma2, h):
    return sigma2

def ula_particles(grad_logp, h, steps, m, seed=0):
    return np.zeros(m)
`,
        solution: BIAS,
        tests: [
          { name: "formula", code: `assert abs(ula_var(2.0, 1.0) - 8 / 3) < 1e-9 and ula_var(1.0, 2.5) == float("inf") and abs(ula_var(1.0, 0.01) - 1 / 0.995) < 1e-9` },
          { name: "particles", code: `p = ula_particles(lambda x: -x / 2, 1.0, 300, 20000, 3); assert p.shape == (20000,) and abs(p.var() - 8 / 3) < 0.1 and abs(p.mean()) < 0.05` },
        ],
      },
    },
    {
      key: "eps",
      rung: "stretch",
      prompt: <p>MALA with h = 0.08 is the same as HMC with one leapfrog step of what size ε?</p>,
      answer: { kind: "numeric", value: 0.4, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The noise term <M>{"\\sqrt 2\\,dW_t"}</M> has been taken on trust. The next section builds the processes behind it, from
        the Poisson process of random arrivals to Brownian motion as the limit of random walks.
      </p>
    </>
  ),
};
