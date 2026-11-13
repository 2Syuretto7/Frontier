import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LrScheduleViz } from "@/components/viz/LrScheduleViz";
import type { LessonContent } from "@/lib/types";

const SCHED = `import numpy as np

def warmup_cosine(step, total, warmup, lr_max, lr_min=0.0):
    if step < warmup:
        return lr_max * (step + 1) / warmup
    p = (step - warmup) / max(1, total - warmup)
    return float(lr_min + 0.5 * (lr_max - lr_min) * (1 + np.cos(np.pi * p)))

def step_decay(step, lr0, drop, every):
    return lr0 * drop ** (step // every)`;

const NOISE = `def sgd_noise_var(lr, lam, sigma):
    return lr * sigma ** 2 / (lam * (2 - lr * lam))

def simulate_sgd(lr_fn, lam, sigma, x0, steps, rng):
    x = np.full(np.shape(x0), x0, dtype=float)
    for t in range(steps):
        g = lam * x + sigma * rng.normal(size=x.shape)
        x = x - lr_fn(t) * g
    return x`;

export const lesson: LessonContent = {
  id: "l3.6.3",
  minutes: 45,
  links: {
    requires: ["l3.6.2"],
    revisits: ["l3.6.1"],
    foreshadows: ["l3.6.4", "l3.8.2"],
  },

  puzzle: (
    <>
      <p>
        Plots of training loss for image classifiers used to look like staircases: long flat stretches, then a sudden drop
        at exactly the epochs where the learning rate was divided by ten. Nothing about the data or the model changed at
        those epochs. And large language models are almost never trained without first warming the learning rate up from
        near zero. What is a schedule actually buying?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Stochastic gradients are noisy, and each step adds noise in proportion to the learning rate. A large learning rate
        makes fast progress but leaves the parameters bouncing around the minimum; a small one bounces less but moves slowly.
        So use large steps early, when the gradient's signal dominates, and small steps late, when the noise does. Warmup
        handles the opposite end: the first few steps, when the network and the optimiser's statistics are least settled.
      </p>
      <LrScheduleViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the noise floor">
        <p>
          Run SGD on <M>{"\\tfrac12\\lambda x^2"}</M> with noisy gradients <M>{"\\lambda x + \\sigma\\xi"}</M>,{" "}
          <M>{"\\xi"}</M> independent with mean 0 and variance 1, and learning rate <M>{"\\eta < 2/\\lambda"}</M>. The variance
          of x converges to
        </p>
        <MD>{"\\operatorname{Var}_\\infty = \\frac{\\eta\\,\\sigma^2}{\\lambda(2 - \\eta\\lambda)} \\approx \\frac{\\eta\\,\\sigma^2}{2\\lambda} \\text{ for small } \\eta\\lambda."}</MD>
      </Theorem>
      <Proof>
        <p>
          <M>{"x_{t+1} = (1 - \\eta\\lambda)x_t - \\eta\\sigma\\xi_t"}</M>, and <M>{"\\xi_t"}</M> is independent of{" "}
          <M>{"x_t"}</M>, so <M>{"V_{t+1} = (1 - \\eta\\lambda)^2 V_t + \\eta^2\\sigma^2"}</M>. This affine recurrence has
          factor <M>{"(1 - \\eta\\lambda)^2 < 1"}</M>, so it converges to its fixed point{" "}
          <M>{"V = \\eta^2\\sigma^2/(1 - (1 - \\eta\\lambda)^2) = \\eta^2\\sigma^2/(\\eta\\lambda(2 - \\eta\\lambda))"}</M>,
          which simplifies to the formula. The expected loss at the floor is <M>{"\\tfrac12\\lambda V"}</M>, proportional to
          η.
        </p>
      </Proof>

      <Definition title="common schedules">
        <p>
          Step decay multiplies η by a factor (often 0.1) every fixed number of steps. Cosine decay goes smoothly from{" "}
          <M>{"\\eta_{\\max}"}</M> to <M>{"\\eta_{\\min}"}</M>:{" "}
          <M>{"\\eta_t = \\eta_{\\min} + \\tfrac12(\\eta_{\\max} - \\eta_{\\min})(1 + \\cos(\\pi t / T))"}</M>. Linear warmup
          raises η from near 0 to <M>{"\\eta_{\\max}"}</M> over the first few hundred or thousand steps.
        </p>
        <Code>{SCHED}</Code>
      </Definition>

      <Remark title="why warm up">
        <p>
          At initialisation the loss surface can be much sharper than later on, and the largest stable learning rate is{" "}
          <M>{"2/\\lambda_{\\max}"}</M>, so a rate that is safe at step 10 000 can diverge at step 0. For Adam there is a
          second reason: early on, v is an average of only a few squared gradients, a noisy estimate, and dividing by a noisy
          small number gives erratic steps. Warming up keeps the steps small until both settle.
        </p>
      </Remark>

      <Example title="checking the formula">
        <p>
          Simulating many independent runs and measuring the spread gives the floor directly, and it matches the formula; ten
          times smaller η, ten times lower floor.
        </p>
        <Code>{NOISE}</Code>
      </Example>
    </>
  ),

  practice: [
    {
      key: "cos",
      rung: "check",
      prompt: <p>Cosine decay from η_max = 0.1 to η_min = 0 over T = 1000 steps, with no warmup. What is η at step 500?</p>,
      answer: { kind: "numeric", value: 0.05, tolerance: 1e-9 },
    },
    {
      key: "warm",
      rung: "check",
      prompt: <p>Linear warmup from 0 to 3e-4 over 1000 steps (η = 3e-4 · t/1000). What is η at t = 250?</p>,
      answer: { kind: "numeric", value: 0.000075, tolerance: 1e-6 },
    },
    {
      key: "floor",
      rung: "apply",
      prompt: <p>Halving the learning rate of SGD near a minimum, with the same gradient noise, roughly does what to the average excess loss once it settles?</p>,
      answer: {
        kind: "choice",
        options: ["Halves it", "Quarters it", "Leaves it unchanged", "Doubles it"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def warmup_cosine(step, total, warmup, lr_max, lr_min=0.0):
    if step < warmup:
        return lr_max * (step + 1) / warmup
    p = (step - warmup) / max(1, total - warmup)
    return float(lr_min + 0.5 * (lr_max - lr_min) * (1 + np.cos(np.pi * p)))

def step_decay(step, lr0, drop, every):
    return lr0 * drop ** (step // every)

print([round(warmup_cosine(s, 1100, 100, 1.0), 2) for s in [0, 49, 99, 100, 600, 1099]])
print([step_decay(s, 0.1, 0.5, 30) for s in [0, 29, 30, 95]])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.01, 0.5, 1.0, 1.0, 0.5, 0.0]\n[0.1, 0.1, 0.05, 0.0125]",
          "[0.0, 0.49, 0.99, 1.0, 0.5, 0.0]\n[0.1, 0.1, 0.05, 0.0125]",
          "[0.01, 0.5, 1.0, 1.0, 0.5, 0.0]\n[0.1, 0.05, 0.05, 0.025]",
          "[0.01, 0.5, 1.0, 1.0, 0.0, 0.5]\n[0.1, 0.1, 0.05, 0.0125]",
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

def sgd_noise_var(lr, lam, sigma):
    return lr * sigma ** 2 / (lam * (2 - lr * lam))

def simulate_sgd(lr_fn, lam, sigma, x0, steps, rng):
    x = np.full(np.shape(x0), x0, dtype=float)
    for t in range(steps):
        g = lam * x + sigma * rng.normal(size=x.shape)
        x = x - lr_fn(t) * g
    return x

rng = np.random.default_rng(0)
x = simulate_sgd(lambda t: 0.1, 1.0, 1.0, np.zeros(20000), 200, rng)
print(round(float(x.var()), 3), round(sgd_noise_var(0.1, 1.0, 1.0), 3))
x = simulate_sgd(lambda t: 0.01, 1.0, 1.0, np.zeros(20000), 2000, rng)
print(round(float(x.var()), 3), round(sgd_noise_var(0.01, 1.0, 1.0), 3))`}</Code>
          <p>Twenty thousand independent noisy runs. Which output is closest to what this prints?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.053 0.053\n0.005 0.005", "0.053 0.053\n0.053 0.005", "0.0 0.053\n0.0 0.005", "0.1 0.1\n0.01 0.01"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>warmup_cosine(step, total, warmup, lr_max, lr_min=0.0)</C>: for step &lt; warmup return{" "}
          <C>lr_max · (step + 1) / warmup</C>; afterwards cosine decay from lr_max to lr_min, with progress{" "}
          <C>p = (step − warmup) / (total − warmup)</C>, as a float. Also write <C>step_decay(step, lr0, drop, every)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def warmup_cosine(step, total, warmup, lr_max, lr_min=0.0):
    return lr_max

def step_decay(step, lr0, drop, every):
    return lr0
`,
        solution: SCHED,
        tests: [
          { name: "warmup cosine", code: `assert abs(warmup_cosine(0, 1100, 100, 1.0) - 0.01) < 1e-12
assert abs(warmup_cosine(99, 1100, 100, 1.0) - 1.0) < 1e-12
assert abs(warmup_cosine(100, 1100, 100, 1.0) - 1.0) < 1e-12
assert abs(warmup_cosine(600, 1100, 100, 1.0) - 0.5) < 1e-12
assert abs(warmup_cosine(600, 1100, 100, 1.0, 0.2) - 0.6) < 1e-12
assert abs(warmup_cosine(1100, 1100, 100, 1.0, 0.1) - 0.1) < 1e-12
assert isinstance(warmup_cosine(500, 1100, 100, 1.0), float)` },
          { name: "step decay", code: `assert [step_decay(s, 0.1, 0.5, 30) for s in [0, 29, 30, 95]] == [0.1, 0.1, 0.05, 0.0125]
assert abs(step_decay(250, 1.0, 0.1, 100) - 0.01) < 1e-15` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sgd_noise_var(lr, lam, sigma)</C>, the stationary variance from the theorem, and{" "}
          <C>simulate_sgd(lr_fn, lam, sigma, x0, steps, rng)</C>, which runs <C>x = x − lr_fn(t)·(lam·x + sigma·ξ)</C> for t
          = 0, …, steps − 1 with ξ drawn by <C>rng.normal</C>, elementwise over an array x0 of independent runs, and returns
          the final array.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sgd_noise_var(lr, lam, sigma):
    return 0.0

def simulate_sgd(lr_fn, lam, sigma, x0, steps, rng):
    return np.array(x0, dtype=float)
`,
        solution: `import numpy as np

${NOISE}`,
        tests: [
          { name: "formula", code: `assert abs(sgd_noise_var(0.1, 1.0, 1.0) - 0.1 / 1.9) < 1e-12
assert abs(sgd_noise_var(0.01, 4.0, 2.0) - 0.04 / (4 * 1.96)) < 1e-12` },
          { name: "simulation", code: `rng = np.random.default_rng(0)
x = simulate_sgd(lambda t: 0.1, 1.0, 1.0, np.zeros(20000), 200, rng)
assert x.shape == (20000,) and abs(x.var() - sgd_noise_var(0.1, 1.0, 1.0)) < 0.004
x = simulate_sgd(lambda t: 0.1, 1.0, 0.0, np.full(3, 2.0), 10, rng)
assert np.allclose(x, 2.0 * 0.9 ** 10)
x = simulate_sgd(lambda t: 0.5 if t < 100 else 0.05, 1.0, 1.0, np.zeros(20000), 300, rng)
assert abs(x.var() - sgd_noise_var(0.05, 1.0, 1.0)) < 0.004` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that SGD on ½λx² with gradient noise of variance σ² and learning rate η (0 &lt; ηλ &lt; 2) has stationary variance ησ²/(λ(2 − ηλ)).</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes the update x_{t+1} = (1 − ηλ)x_t − ησξ_t and uses independence of ξ_t from x_t to get V_{t+1} = (1 − ηλ)²V_t + η²σ².",
          "Notes (1 − ηλ)² < 1 so the recurrence converges to its fixed point (or simply solves for the fixed point as the stationary value).",
          "Solves V = η²σ²/(1 − (1 − ηλ)²) and simplifies to ησ²/(λ(2 − ηλ)).",
        ],
      },
    },
    {
      key: "lrfloor",
      rung: "stretch",
      prompt: <p>With λ = 2 and σ = 1, what learning rate gives a stationary variance of 0.01? Give 6 decimal places.</p>,
      answer: { kind: "numeric", value: 0.03846154, tolerance: 1e-5 },
    },
  ],

  teachBack:
    "Explain to a friend why SGD hovers at a noise floor proportional to the learning rate, why that motivates decaying it, and why training often starts with a warmup.",

  glimpse: (
    <p>
      The noise in each step comes from using a minibatch. Next: how the batch size controls that noise, and how the
      learning rate should change with it.
    </p>
  ),
};
