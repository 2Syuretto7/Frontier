import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AdamOvershootViz } from "@/components/viz/AdamOvershootViz";
import type { LessonContent } from "@/lib/types";

const RATIO = `import numpy as np

def adam_ratio(grads, b1, b2):
    m = v = 0.0
    out = []
    for g in grads:
        m = b1 * m + (1 - b1) * g
        v = b2 * v + (1 - b2) * g * g
        out.append(float(m / np.sqrt(v)) if v > 0 else 0.0)
    return out

def switch_on(b1, b2, k):
    return (1 - b1 ** k) / np.sqrt(1 - b2 ** k)

def ratio_bound(b1, b2):
    return (1 - b1) / np.sqrt((1 - b2) * (1 - b1 * b1 / b2))`;

const ALIGN = `import numpy as np

def noise_ratio(b1):
    return float(np.sqrt((1 - b1) / (1 + b1)))

def aligned_update(q, a):
    return a * np.sign(np.asarray(q, float))

def mc_random_energy(q, a, n, seed):
    q = np.asarray(q, float)
    signs = np.random.default_rng(seed).choice([-1.0, 1.0], size=(n, len(q)))
    return float(np.mean((a * signs @ q) ** 2))`;

export const lesson: LessonContent = {
  id: "m14.6.2",
  minutes: 45,
  links: {
    requires: ["m14.6.1", "m14.2.3"],
    revisits: ["m14.5.3"],
    foreshadows: ["m14.6.3"],
  },

  puzzle: (
    <>
      <p>
        Large training runs sometimes show a loss curve that has been falling smoothly for days and then, within a few
        steps, jumps up by an order of magnitude. Often it recovers; sometimes it does not, and the run is restarted from a
        checkpoint with the offending batches skipped. The learning rate did not change, the data did not change much, and
        Adam normalises every coordinate&apos;s step. So where does a sudden, huge step come from?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Adam divides a running mean of gradients, m, by the square root of a running mean of squared gradients, v. The
        two averages forget at different speeds: m over about ten steps, v over about a thousand. When gradients have been
        small or noisy for a while and then change character, the ratio m/√v can be far from its usual size. Noise makes
        m small relative to √v, so the usual update is only a quarter of η per coordinate and points in random directions.
        When the gradients turn coherent, every coordinate&apos;s update grows towards η at once, and they all agree in
        sign. If v had also shrunk during a quiet stretch, the update overshoots well past η. A large, coherent update
        along a sharp direction is exactly what the edge-of-stability lesson said cannot be absorbed.
      </p>
      <AdamOvershootViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the Adam ratio">
        <p>
          With <M>{"m_0 = v_0 = 0"}</M>, <M>{"m_t = \\beta_1m_{t-1} + (1-\\beta_1)g_t"}</M> and{" "}
          <M>{"v_t = \\beta_2v_{t-1} + (1-\\beta_2)g_t^2"}</M> for one coordinate, the Adam update is η times{" "}
          <M>{"m_t/\\sqrt{v_t}"}</M>, ignoring ε and bias correction. Bias correction divides m and v by{" "}
          <M>{"1-\\beta^t"}</M> with t the global step, so late in training it is close to 1 and changes nothing below:
          it does not restart when a coordinate&apos;s gradients change.
        </p>
        <Code>{RATIO}</Code>
      </Definition>

      <Theorem title="the update is bounded, but not by 1">
        <p>
          If <M>{"\\beta_1^2 < \\beta_2"}</M> then for every gradient sequence{" "}
          <M>{"|m_t|/\\sqrt{v_t} \\le \\dfrac{1-\\beta_1}{\\sqrt{(1-\\beta_2)(1-\\beta_1^2/\\beta_2)}}"}</M>, which is about
          7.27 for <M>{"\\beta_1 = 0.9,\\ \\beta_2 = 0.999"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Unrolling, <M>{"m_t = (1-\\beta_1)\\sum_k\\beta_1^kg_{t-k}"}</M> and{" "}
          <M>{"v_t = (1-\\beta_2)\\sum_k\\beta_2^kg_{t-k}^2"}</M>, sums over 0 ≤ k &lt; t. Write{" "}
          <M>{"\\beta_1^kg_{t-k} = (\\beta_1^k\\beta_2^{-k/2})(\\beta_2^{k/2}g_{t-k})"}</M> and apply the Cauchy–Schwarz
          inequality: <M>{"|\\sum_k\\beta_1^kg_{t-k}| \\le (\\sum_k(\\beta_1^2/\\beta_2)^k)^{1/2}(\\sum_k\\beta_2^kg_{t-k}^2)^{1/2}"}</M>.
          The first factor is at most <M>{"(1-\\beta_1^2/\\beta_2)^{-1/2}"}</M> and the second is{" "}
          <M>{"\\sqrt{v_t/(1-\\beta_2)}"}</M>. Multiplying by <M>{"1-\\beta_1"}</M> and dividing by{" "}
          <M>{"\\sqrt{v_t}"}</M> gives the bound.
        </p>
      </Proof>

      <Theorem title="switching on after silence">
        <p>
          If a coordinate&apos;s gradient is zero up to some step and equals a constant c ≠ 0 for the k steps after it,
          then the ratio is <M>{"\\mathrm{sign}(c)(1-\\beta_1^k)/\\sqrt{1-\\beta_2^k}"}</M>. The first step has size{" "}
          <M>{"(1-\\beta_1)/\\sqrt{1-\\beta_2}"}</M>, about 3.16 for β₂ = 0.999, and the largest, at k = 12, is about 6.57.
        </p>
      </Theorem>
      <Proof>
        <p>
          The zero gradients leave m = v = 0. After k constant gradients the sums are geometric:{" "}
          <M>{"m = (1-\\beta_1)c\\sum_{j<k}\\beta_1^j = c(1-\\beta_1^k)"}</M> and <M>{"v = c^2(1-\\beta_2^k)"}</M>. Divide.
          The numerical maximum follows from evaluating the formula for k = 1, 2, …; for small β₂ the denominator catches
          up within a few steps and the overshoot almost disappears (about 1.10 for β₂ = 0.95).
        </p>
      </Proof>

      <Theorem title="noise makes updates small; signal makes them large">
        <p>
          If the gradients are independent with mean 0 and variance σ², then as t → ∞,{" "}
          <M>{"\\mathbb E[m_t^2] \\to \\sigma^2(1-\\beta_1)/(1+\\beta_1)"}</M> and <M>{"\\mathbb E[v_t] \\to \\sigma^2"}</M>.
          If the gradients are a constant c, then <M>{"m_t/\\sqrt{v_t} \\to \\mathrm{sign}(c)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By independence, <M>{"\\mathbb E[m_t^2] = (1-\\beta_1)^2\\sigma^2\\sum_{k<t}\\beta_1^{2k} \\to (1-\\beta_1)^2\\sigma^2/(1-\\beta_1^2)"}</M>,
          which simplifies to the claim, and <M>{"\\mathbb E[v_t] = (1-\\beta_2)\\sigma^2\\sum_{k<t}\\beta_2^k \\to \\sigma^2"}</M>.
          For constant gradients take k → ∞ in the previous theorem. So the root-mean-square ratio in the noise regime is
          about <M>{"\\sqrt{(1-\\beta_1)/(1+\\beta_1)}"}</M>, 0.23 for β₁ = 0.9, against 1 in the signal regime.
        </p>
      </Proof>

      <Theorem title="coherent signs pile energy into one direction">
        <p>
          Let q be a unit vector in <M>{"\\mathbb R^d"}</M> and δ an update with <M>{"|\\delta_i| = a"}</M> for every i. If
          the signs of δ are independent and fair, <M>{"\\mathbb E[(q^\\top\\delta)^2] = a^2"}</M>. If{" "}
          <M>{"\\delta_i = a\\,\\mathrm{sign}(q_i)"}</M>, then <M>{"(q^\\top\\delta)^2 = a^2\\|q\\|_1^2"}</M>, which lies between{" "}
          <M>{"a^2"}</M> and <M>{"a^2d"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          With random signs <M>{"s_i"}</M>, <M>{"\\mathbb E[(\\sum_iq_is_ia)^2] = a^2\\sum_{i,j}q_iq_j\\mathbb E[s_is_j] = a^2\\sum_iq_i^2 = a^2"}</M>.
          With aligned signs <M>{"q^\\top\\delta = a\\sum_i|q_i| = a\\|q\\|_1"}</M>, and{" "}
          <M>{"1 = \\|q\\|_2 \\le \\|q\\|_1 \\le \\sqrt d\\|q\\|_2"}</M>. Near a minimum with curvature λ along q, the loss
          rises by about <M>{"\\tfrac12\\lambda(q^\\top\\delta)^2"}</M>, so coherence alone can multiply it by up to d.
        </p>
        <Code>{ALIGN}</Code>
      </Proof>

      <Remark title="anatomy of a spike">
        <p>
          Put the pieces together. A stretch of noisy or vanishing gradients leaves the updates small and random, and lets
          v shrink: if a coordinate&apos;s gradient vanishes for T steps, v falls by <M>{"\\beta_2^T"}</M> and the effective
          learning rate <M>{"\\eta/\\sqrt v"}</M> rises by <M>{"\\beta_2^{-T/2}"}</M>. Then the gradients turn coherent, from
          a rare token, a shift in the data, or slow growth of some logit. Per-coordinate updates jump by a factor of four
          or more, their signs align, and the energy along the sharpest direction jumps by far more. The preconditioned
          sharpness passes the edge of stability, the oscillation grows, and the loss spikes. The large gradients then
          inflate v, the effective step shrinks, and the run usually recovers, unless the step has pushed some quantity,
          such as attention or output logits, into a region it cannot leave, which is the subject of the next lesson.
        </p>
      </Remark>

      <Remark title="what practitioners do">
        <p>
          Many language-model recipes use β₂ = 0.95 instead of 0.999, so that v follows changes within tens of steps;
          they clip the global gradient norm; some clip the update itself, as Adafactor does with its root-mean-square
          limit; and they choose ε small relative to typical gradient magnitudes, since a large ε silently damps updates
          once gradients shrink. When a spike still happens, a common response is to rewind to a checkpoint and skip the
          batches around it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "first",
      rung: "check",
      prompt: <p>After a long stretch of zero gradients, a coordinate&apos;s gradient becomes a positive constant. With β₁ = 0.9 and β₂ = 0.9999, what is the first update ratio m/√v?</p>,
      answer: { kind: "numeric", value: 10, tolerance: 0.0001 },
    },
    {
      key: "stale",
      rung: "check",
      prompt: <p>A coordinate&apos;s gradient is zero for 2000 steps with β₂ = 0.999. By what factor does its effective learning rate η/√v grow? Give two decimals.</p>,
      answer: { kind: "numeric", value: 2.72, tolerance: 0.006 },
    },
    {
      key: "beta2",
      rung: "apply",
      prompt: <p>Why do many large language-model recipes use β₂ = 0.95 rather than the default 0.999?</p>,
      answer: {
        kind: "choice",
        options: [
          "v then tracks sudden changes in gradient scale within tens of steps, so updates overshoot far less when gradients change character",
          "A smaller β₂ makes the update ratio exactly 1 at every step",
          "It removes the need for bias correction",
          "It makes v larger on average, which lowers the learning rate",
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

def adam_ratio(grads, b1, b2):
    m = v = 0.0
    out = []
    for g in grads:
        m = b1 * m + (1 - b1) * g
        v = b2 * v + (1 - b2) * g * g
        out.append(float(m / np.sqrt(v)) if v > 0 else 0.0)
    return out

def switch_on(b1, b2, k):
    return (1 - b1 ** k) / np.sqrt(1 - b2 ** k)

def ratio_bound(b1, b2):
    return (1 - b1) / np.sqrt((1 - b2) * (1 - b1 * b1 / b2))

print([round(r, 3) for r in adam_ratio([0.0, 0.0, 1.0, 1.0, 1.0], 0.9, 0.999)])
print(round(switch_on(0.9, 0.999, 1), 3), round(ratio_bound(0.9, 0.999), 3), round(switch_on(0.9, 0.95, 1), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 0.0, 3.162, 4.25, 4.95]\n3.162 7.27 0.447",
          "[0.0, 0.0, 1.0, 1.0, 1.0]\n3.162 7.27 0.447",
          "[0.0, 0.0, 3.162, 4.25, 4.95]\n3.162 7.27 1.0",
          "[0.0, 0.0, 3.162, 2.236, 1.826]\n3.162 7.27 0.447",
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

def noise_ratio(b1):
    return float(np.sqrt((1 - b1) / (1 + b1)))

def aligned_update(q, a):
    return a * np.sign(np.asarray(q, float))

def mc_random_energy(q, a, n, seed):
    q = np.asarray(q, float)
    signs = np.random.default_rng(seed).choice([-1.0, 1.0], size=(n, len(q)))
    return float(np.mean((a * signs @ q) ** 2))

q = np.array([0.6, -0.8]); d = aligned_update(q, 0.5)
print(d.tolist(), round(float(q @ d) ** 2, 3), round(noise_ratio(0.9), 3), round(mc_random_energy(q, 0.5, 20000, 0), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, -0.5] 0.49 0.229 0.25",
          "[0.5, -0.5] 0.01 0.229 0.25",
          "[0.5, 0.5] 0.01 0.229 0.25",
          "[0.5, -0.5] 0.49 0.229 0.49",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>adam_ratio(grads, b1, b2)</C>, the list of m/√v after each gradient, starting from m = v = 0, with 0.0
          while v = 0; <C>switch_on(b1, b2, k)</C>, the ratio k steps after a constant positive gradient switches on; and{" "}
          <C>ratio_bound(b1, b2)</C>, the bound from the first theorem.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def adam_ratio(grads, b1, b2):
    return [float(np.sign(g)) for g in grads]

def switch_on(b1, b2, k):
    return 1.0

def ratio_bound(b1, b2):
    return 1.0
`,
        solution: RATIO,
        tests: [
          { name: "ratios", code: `assert np.allclose(adam_ratio([0.0, 0.0, 1.0, 1.0, 1.0], 0.9, 0.999), [0, 0, 3.16227766, 4.24959169, 4.95023535])
r = adam_ratio([2.0] * 3000, 0.9, 0.99); assert abs(r[-1] - 1) < 1e-9 and np.allclose(r[:20], [switch_on(0.9, 0.99, k) for k in range(1, 21)])` },
          { name: "bound", code: `assert abs(ratio_bound(0.9, 0.999) - 7.2702918) < 1e-6 and abs(switch_on(0.9, 0.95, 1) - 0.4472136) < 1e-6
rng = np.random.default_rng(0)
for _ in range(20):
    g = rng.standard_normal(300) * rng.exponential(1, 300); assert max(abs(x) for x in adam_ratio(g, 0.9, 0.99)) <= ratio_bound(0.9, 0.99) + 1e-9
assert max(switch_on(0.9, 0.999, k) for k in range(1, 200)) < ratio_bound(0.9, 0.999)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>noise_ratio(b1)</C>, the root-mean-square ratio in the pure-noise regime;{" "}
          <C>aligned_update(q, a)</C>, the update of size a per coordinate with signs matching q; and{" "}
          <C>mc_random_energy(q, a, n, seed)</C>, a Monte Carlo estimate of <M>{"\\mathbb E[(q^\\top\\delta)^2]"}</M> over
          n random-sign updates of size a, drawing the signs with{" "}
          <C>np.random.default_rng(seed).choice([-1.0, 1.0], size=(n, len(q)))</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def noise_ratio(b1):
    return 1.0

def aligned_update(q, a):
    return a * np.ones(len(q))

def mc_random_energy(q, a, n, seed):
    return 0.0
`,
        solution: ALIGN,
        tests: [
          { name: "regimes", code: `assert abs(noise_ratio(0.9) - np.sqrt(0.1 / 1.9)) < 1e-12 and abs(noise_ratio(0.0) - 1) < 1e-12
assert np.allclose(aligned_update([0.6, -0.8, 0.0], 0.5), [0.5, -0.5, 0.0])` },
          { name: "energy", code: `q = np.array([0.48, 0.6, -0.64]); assert abs(mc_random_energy(q, 0.5, 40000, 1) - 0.25) < 0.01
s = np.random.default_rng(4).choice([-1.0, 1.0], size=(10, 3)); assert abs(mc_random_energy(q, 2.0, 10, 4) - np.mean((2.0 * s @ q) ** 2)) < 1e-12
assert abs(float(q @ aligned_update(q, 1.0)) ** 2 - 1.72 ** 2) < 1e-12` },
        ],
      },
    },
    {
      key: "pile",
      rung: "stretch",
      prompt: (
        <p>
          The sharpest direction is q = (0.48, 0.6, 0.64). How many times larger is <M>{"(q^\\top\\delta)^2"}</M> for an
          update with signs aligned to q than its expectation under random signs, for the same per-coordinate size? Give
          two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.96, tolerance: 0.006 },
    },
  ],

  glimpse: (
    <>
      <p>
        One quantity that can drift slowly and then turn a recoverable spike into a lasting failure is the size of the
        logits. The next lesson follows logit growth in the output and in attention, and the small auxiliary loss that
        holds it back.
      </p>
    </>
  ),
};
