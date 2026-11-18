import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AdamSnrViz } from "@/components/viz/AdamSnrViz";
import type { LessonContent } from "@/lib/types";

const STEP = `import numpy as np

def adam_ratios(grads, b1=0.9, b2=0.999):
    m = v = 0.0
    out = []
    for t, g in enumerate(grads, 1):
        m = b1 * m + (1 - b1) * g
        v = b2 * v + (1 - b2) * g * g
        out.append((m / (1 - b1 ** t)) / np.sqrt(v / (1 - b2 ** t)))
    return out

def snr_step(mu, sigma):
    return mu / np.sqrt(mu ** 2 + sigma ** 2)

def momentum_sd(sigma, b1):
    return sigma * np.sqrt((1 - b1) / (1 + b1))`;

const SIM = `import numpy as np

def spike_ratio(b1, b2):
    return (1 - b1) / np.sqrt(1 - b2)

def simulate_steps(mu, sigma, b1, b2, steps, seed=0):
    g = mu + sigma * np.random.default_rng(seed).standard_normal(steps)
    m = v = 0.0
    out = []
    for t, gt in enumerate(g, 1):
        m = b1 * m + (1 - b1) * gt
        v = b2 * v + (1 - b2) * gt * gt
        out.append((m / (1 - b1 ** t)) / np.sqrt(v / (1 - b2 ** t)))
    return np.array(out)

def tail_stats(r, burn):
    r = np.asarray(r)[burn:]
    return float(r.mean()), float(r.std())`;

export const lesson: LessonContent = {
  id: "m14.2.3",
  minutes: 45,
  links: {
    requires: ["m14.2.2", "m10.6.1"],
    revisits: ["l3.6.2"],
    foreshadows: ["m14.2.4", "m14.2.5", "m14.6.2"],
  },

  puzzle: (
    <>
      <p>
        Log the size of Adam&apos;s update to one weight, divided by the learning rate. Early in training it sits near 1;
        late in training it has fallen to 0.05, though nobody touched the learning rate. On another weight it is still
        near 1. And once in a while, after a quiet stretch, a single update jumps to 3. All three readings come from one
        formula, and each says something about the gradient that produced it.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Adam is RMSProp with momentum: the numerator is a moving average of gradients, the denominator the root of a moving
        average of squared gradients, both corrected for starting at zero. If the gradient is steady, numerator and
        denominator agree and the step is η. If it is mostly noise, the numerator averages towards the small mean while the
        denominator keeps the full size of the noise, so the step shrinks in proportion to the signal-to-noise ratio. Adam
        therefore takes confident steps where the gradient is consistent and timid ones where it is not, without being
        told which is which. The rare large step is the denominator&apos;s memory lagging behind a sudden change.
      </p>
      <AdamSnrViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Adam">
        <MD>{"m_t = \\beta_1 m_{t-1} + (1-\\beta_1)g_t,\\quad v_t = \\beta_2 v_{t-1} + (1-\\beta_2)g_t^2,\\quad x_{t+1} = x_t - \\eta\\,\\frac{\\hat m_t}{\\sqrt{\\hat v_t} + \\epsilon},"}</MD>
        <p>
          with <M>{"\\hat m_t = m_t/(1-\\beta_1^t)"}</M> and <M>{"\\hat v_t = v_t/(1-\\beta_2^t)"}</M>, elementwise. Write{" "}
          <M>{"r_t = \\hat m_t/\\sqrt{\\hat v_t}"}</M> for the step in units of η.
        </p>
      </Definition>

      <Theorem title="the step measures the signal-to-noise ratio">
        <p>
          Let the gradients of one coordinate be independent with mean μ and variance <M>{"\\sigma^2"}</M>, and let{" "}
          <M>{"\\beta_2"}</M> be close enough to 1 that <M>{"\\hat v_t \\approx \\mu^2 + \\sigma^2"}</M>. Then after the
          start-up transient,
        </p>
        <MD>{"E[r_t] \\approx \\frac{\\mu}{\\sqrt{\\mu^2+\\sigma^2}},\\qquad \\operatorname{sd}(r_t) \\approx \\sqrt{\\frac{1-\\beta_1}{1+\\beta_1}}\;\\frac{\\sigma}{\\sqrt{\\mu^2+\\sigma^2}}."}</MD>
      </Theorem>
      <Proof>
        <p>
          With the denominator treated as the constant <M>{"\\sqrt{\\mu^2+\\sigma^2}"}</M>, everything rests on{" "}
          <M>{"m_t = (1-\\beta_1)\\sum_{s\\ge 0}\\beta_1^s g_{t-s}"}</M>. Its mean is μ because the weights sum to 1 (the
          bias correction handles the finite sum). Its variance is{" "}
          <M>{"\\sigma^2(1-\\beta_1)^2\\sum_s\\beta_1^{2s} = \\sigma^2(1-\\beta_1)^2/(1-\\beta_1^2) = \\sigma^2(1-\\beta_1)/(1+\\beta_1)"}</M>.
          Dividing by the denominator gives both formulas. For μ = 0 the mean step is zero and its spread is{" "}
          <M>{"\\sqrt{(1-\\beta_1)/(1+\\beta_1)}"}</M>, about 0.23 for <M>{"\\beta_1 = 0.9"}</M>.
        </p>
        <Code>{STEP}</Code>
      </Proof>

      <Theorem title="the largest single step">
        <p>
          After a long stretch of gradients near zero, a single gradient g gives{" "}
          <M>{"|r_t| \\to (1-\\beta_1)/\\sqrt{1-\\beta_2}"}</M> as t grows. For the defaults this is{" "}
          <M>{"0.1/\\sqrt{0.001} \\approx 3.16"}</M>. Ignoring the bias corrections, every step obeys
        </p>
        <MD>{"|r_t| \\le \\frac{1-\\beta_1}{\\sqrt{(1-\\beta_2)(1-\\beta_1^2/\\beta_2)}}\\quad\\text{when } \\beta_1^2 < \\beta_2."}</MD>
        <p>
          So the step is bounded by a constant times η, though the constant (about 7.3 for the defaults) is larger than the
          spike.
        </p>
      </Theorem>
      <Proof>
        <p>
          Before the spike m and v are essentially zero. The spike gives <M>{"m_t = (1-\\beta_1)g"}</M> and{" "}
          <M>{"v_t = (1-\\beta_2)g^2"}</M>; for large t the bias corrections tend to 1, so{" "}
          <M>{"r_t = (1-\\beta_1)g/(\\sqrt{1-\\beta_2}|g|)"}</M>. In general, write <M>{"\\beta_1^s = (\\beta_1/\\sqrt{\\beta_2})^s\\sqrt{\\beta_2}^{\\,s}"}</M> and apply
          Cauchy–Schwarz:{" "}
          <M>{"|m_t| \\le (1-\\beta_1)\\sqrt{\\textstyle\\sum_s(\\beta_1^2/\\beta_2)^s}\\sqrt{\\textstyle\\sum_s\\beta_2^s g_{t-s}^2}"}</M>.
          The first sum is at most <M>{"1/(1-\\beta_1^2/\\beta_2)"}</M> and the second is{" "}
          <M>{"v_t/(1-\\beta_2)"}</M>, which gives the bound.
        </p>
        <Code>{SIM}</Code>
      </Proof>

      <Remark title="reading the logs">
        <p>
          The puzzle&apos;s three numbers now read directly. A ratio near 1 is a consistent gradient; 0.05 means the
          gradient&apos;s mean is about a twentieth of its noise, so that weight is near equilibrium; a 3 is a spike after
          calm. The last is how Adam can turn a single bad batch into a large step, and it is one route into the loss spikes
          of a later chapter. Raising <M>{"\\beta_2"}</M> lengthens the memory of v and makes such spikes larger, which is
          why large runs often lower it to 0.95.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "snr",
      rung: "check",
      prompt: <p>A coordinate&apos;s gradients have mean 0.05 and standard deviation 0.12. What is Adam&apos;s mean step in units of η? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.385, tolerance: 0.0006 },
    },
    {
      key: "spike",
      rung: "check",
      prompt: <p>With β₁ = 0.95 and β₂ = 0.9999, how many times η is the step after a single gradient that follows a long stretch of zeros?</p>,
      answer: { kind: "numeric", value: 5, tolerance: 0.0001 },
    },
    {
      key: "small",
      rung: "apply",
      prompt: <p>Late in training, Adam&apos;s updates to a layer average 0.05η in size, though η has not changed. What is the best reading?</p>,
      answer: {
        kind: "choice",
        options: [
          "That layer's gradients are dominated by noise: their mean is roughly a twentieth of their standard deviation",
          "The second-moment estimate has overflowed",
          "The gradients of that layer have become very small in absolute terms",
          "Adam's bias correction has switched off",
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

def adam_ratios(grads, b1=0.9, b2=0.999):
    m = v = 0.0
    out = []
    for t, g in enumerate(grads, 1):
        m = b1 * m + (1 - b1) * g
        v = b2 * v + (1 - b2) * g * g
        out.append((m / (1 - b1 ** t)) / np.sqrt(v / (1 - b2 ** t)))
    return out

def snr_step(mu, sigma):
    return mu / np.sqrt(mu ** 2 + sigma ** 2)

def momentum_sd(sigma, b1):
    return sigma * np.sqrt((1 - b1) / (1 + b1))

print([round(float(r), 3) for r in adam_ratios([2.0, 2.0, -2.0], 0.5, 0.5)])
print(round(float(snr_step(3.0, 4.0)), 3), round(float(momentum_sd(1.0, 0.9)), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 1.0, -0.143]\n0.6 0.2294",
          "[1.0, 1.0, -1.0]\n0.6 0.2294",
          "[1.0, 1.0, -0.143]\n0.75 0.2294",
          "[1.0, 1.0, -0.143]\n0.6 0.3162",
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

def spike_ratio(b1, b2):
    return (1 - b1) / np.sqrt(1 - b2)

def simulate_steps(mu, sigma, b1, b2, steps, seed=0):
    g = mu + sigma * np.random.default_rng(seed).standard_normal(steps)
    m = v = 0.0
    out = []
    for t, gt in enumerate(g, 1):
        m = b1 * m + (1 - b1) * gt
        v = b2 * v + (1 - b2) * gt * gt
        out.append((m / (1 - b1 ** t)) / np.sqrt(v / (1 - b2 ** t)))
    return np.array(out)

def tail_stats(r, burn):
    r = np.asarray(r)[burn:]
    return float(r.mean()), float(r.std())

print(round(float(spike_ratio(0.9, 0.999)), 3), round(float(spike_ratio(0.9, 0.99)), 3))
r = simulate_steps(0.0, 1.0, 0.9, 0.999, 20000)
print([round(s, 2) for s in tail_stats(r, 2000)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["3.162 1.0\n[0.01, 0.23]", "3.162 1.0\n[0.01, 1.0]", "0.316 1.0\n[0.01, 0.23]", "3.162 0.1\n[0.01, 0.23]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>adam_ratios(grads, b1=0.9, b2=0.999)</C>, the list of bias-corrected ratios <C>m̂/√v̂</C> for a list of
          scalar gradients (no ε); <C>snr_step(mu, sigma)</C>, the predicted mean ratio; and <C>momentum_sd(sigma, b1)</C>,
          the standard deviation of the moving average m in the steady state.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def adam_ratios(grads, b1=0.9, b2=0.999):
    return [np.sign(g) for g in grads]

def snr_step(mu, sigma):
    return mu / sigma

def momentum_sd(sigma, b1):
    return sigma
`,
        solution: STEP,
        tests: [
          { name: "ratios", code: `assert np.allclose(adam_ratios([2.0, 2.0, -2.0], 0.5, 0.5), [1, 1, -1 / 7])
g = [0.3, -1.2, 2.5, 0.1, -0.4]; assert np.allclose(adam_ratios(g), adam_ratios([1000 * x for x in g])) and np.allclose(adam_ratios([4.0] * 6), [1.0] * 6)
assert abs(adam_ratios([1.0, -1.0], 0.9, 0.999)[1] - (-0.01 / 0.19) / np.sqrt(1)) < 1e-9` },
          { name: "theory", code: `assert abs(snr_step(3.0, 4.0) - 0.6) < 1e-12 and abs(snr_step(-1.0, 0.0) + 1) < 1e-12
assert abs(momentum_sd(2.0, 0.0) - 2) < 1e-12 and abs(momentum_sd(1.0, 0.9) - np.sqrt(0.1 / 1.9)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>spike_ratio(b1, b2)</C>; <C>simulate_steps(mu, sigma, b1, b2, steps, seed=0)</C>, which draws{" "}
          <C>g = mu + sigma * np.random.default_rng(seed).standard_normal(steps)</C> and returns the array of ratios{" "}
          <C>m̂/√v̂</C>; and <C>tail_stats(r, burn)</C>, the mean and (population) standard deviation of r after dropping the
          first burn entries.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def spike_ratio(b1, b2):
    return 1.0

def simulate_steps(mu, sigma, b1, b2, steps, seed=0):
    return np.zeros(steps)

def tail_stats(r, burn):
    return 0.0, 0.0
`,
        solution: SIM,
        tests: [
          { name: "spike", code: `assert abs(spike_ratio(0.95, 0.9999) - 5) < 1e-9 and abs(spike_ratio(0.9, 0.99) - 1) < 1e-9
m, s = tail_stats([5, 1, 3, -1], 1); assert abs(m - 1) < 1e-12 and abs(s - np.sqrt(8 / 3)) < 1e-12` },
          { name: "simulate", code: `r = simulate_steps(1.0, 1.0, 0.9, 0.999, 20000, 5); assert r.shape == (20000,) and abs(r[0] - np.sign(r[0])) < 1e-12
m, s = tail_stats(r, 2000); assert abs(m - 0.7071) < 0.02 and abs(s - 0.1622) < 0.01
m, s = tail_stats(simulate_steps(0.1, 1.0, 0.0, 0.999, 20000, 2), 2000); assert abs(m - 0.0995) < 0.03 and abs(s - 0.995) < 0.02` },
        ],
      },
    },
    {
      key: "beta1",
      rung: "stretch",
      prompt: (
        <p>
          For pure-noise gradients (μ = 0), what β₁ makes the standard deviation of Adam&apos;s step one tenth of its value at
          β₁ = 0? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.98, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Adam divides every part of its update by √v̂. That is harmless for the gradient of the loss, but not for an L2
        penalty added to it: the penalty gets rescaled too, differently for every weight. The next lesson shows what goes
        wrong and how decoupling weight decay from the gradient fixes it.
      </p>
    </>
  ),
};
