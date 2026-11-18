import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GreedyScheduleViz } from "@/components/viz/GreedyScheduleViz";
import type { LessonContent } from "@/lib/types";

const OPT = `import numpy as np

def greedy_schedule(h, m0, sigma2, T):
    m, lrs, ms = m0, [], []
    for _ in range(T):
        lr = h * m / (h * h * m + sigma2)
        m = (1 - lr * h) ** 2 * m + lr ** 2 * sigma2
        lrs.append(lr)
        ms.append(m)
    return lrs, ms

def closed_form_m(h, m0, sigma2, t):
    return 1 / (1 / m0 + t * h * h / sigma2)

def run_m(h, m0, sigma2, lrs):
    m, out = m0, []
    for lr in lrs:
        m = (1 - lr * h) ** 2 * m + lr ** 2 * sigma2
        out.append(m)
    return out`;

const CLIFF = `import numpy as np

def floor_loss(h, sigma2, lr):
    return 0.5 * float(np.sum(lr * sigma2 / (2 - lr * np.asarray(h, float))))

def after_step_drop(h, sigma2, lr_hi, lr_lo, steps):
    h = np.asarray(h, float)
    m = lr_hi * sigma2 / (h * (2 - lr_hi * h))
    out = []
    for _ in range(steps):
        m = (1 - lr_lo * h) ** 2 * m + lr_lo ** 2 * sigma2
        out.append(0.5 * float(np.sum(h * m)))
    return out

def cliff_fraction(h, sigma2, lr_hi, lr_lo, steps):
    before, after, end = floor_loss(h, sigma2, lr_hi), after_step_drop(h, sigma2, lr_hi, lr_lo, steps), floor_loss(h, sigma2, lr_lo)
    return (before - after[-1]) / (before - end)`;

export const lesson: LessonContent = {
  id: "m14.4.5",
  minutes: 45,
  links: {
    requires: ["m14.4.2", "m14.4.4"],
    revisits: ["m14.4.3", "m14.4.1"],
    foreshadows: ["m14.5.2", "m14.5.3"],
  },

  puzzle: (
    <>
      <p>
        Old image-classification runs dropped the learning rate by ten at fixed epochs, and each drop produced a sudden
        cliff in the loss within a few hundred steps, followed by a slow drift. Is there a best schedule, at least in a
        model simple enough to solve? And does the answer explain both the cliff and the drift, or does decay also do
        something no quadratic can show?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Think of one coordinate, its squared error, and the noise in its gradient. Early on the error is large compared
        with the noise, and the best step is the Newton step 1/h, which removes the error in one go. Once the error is down
        to the noise level, every gradient is mostly noise, and the best thing to do with a new noisy gradient is to give
        it the weight a running mean gives its t-th sample, 1/t. So the optimal rate is flat, then falls like 1/t, with
        the switch where the remaining error meets the noise. With several curvatures at once there is no single optimal
        schedule, and practical schedules are compromises; and real losses add effects of the landscape that this model
        leaves out.
      </p>
      <GreedyScheduleViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the one-coordinate problem">
        <p>
          SGD on <M>{"\\tfrac12hx^2"}</M> with gradient noise of variance <M>{"\\sigma^2"}</M> has{" "}
          <M>{"m_t = E[x_t^2]"}</M> obeying <M>{"m_t = F_{\\eta_t}(m_{t-1})"}</M> with{" "}
          <M>{"F_\\eta(m) = (1-\\eta h)^2m + \\eta^2\\sigma^2"}</M>. A schedule is optimal if it minimises{" "}
          <M>{"m_T"}</M>.
        </p>
      </Definition>

      <Theorem title="the optimal schedule">
        <p>
          The rates <M>{"\\eta_t = hm_{t-1}/(h^2m_{t-1} + \\sigma^2)"}</M> minimise <M>{"m_T"}</M> for every T at once, and
          give
        </p>
        <MD>{"\\frac{1}{m_t} = \\frac{1}{m_0} + \\frac{th^2}{\\sigma^2},\\qquad \\eta_t = \\frac{1}{h\\,(t + \\sigma^2/(h^2m_0))}."}</MD>
      </Theorem>
      <Proof>
        <p>
          <M>{"F_\\eta(m)"}</M> is a convex quadratic in η with derivative{" "}
          <M>{"-2h(1-\\eta h)m + 2\\eta\\sigma^2"}</M>, which vanishes at <M>{"\\eta^* = hm/(h^2m + \\sigma^2)"}</M>. There{" "}
          <M>{"1 - \\eta^*h = \\sigma^2/(h^2m + \\sigma^2)"}</M>, and substituting gives{" "}
          <M>{"F_{\\eta^*}(m) = m\\sigma^2/(h^2m + \\sigma^2)"}</M>, so <M>{"1/F_{\\eta^*}(m) = 1/m + h^2/\\sigma^2"}</M>, and
          the formula for <M>{"m_t"}</M> follows by induction. Substituting it into <M>{"\\eta^*"}</M> gives{" "}
          <M>{"\\eta_t"}</M>. For optimality, every <M>{"F_\\eta"}</M> is increasing in m. If some other schedule has{" "}
          <M>{"m'_{t-1} \\ge m_{t-1}"}</M>, then{" "}
          <M>{"m'_t = F_{\\eta'_t}(m'_{t-1}) \\ge F_{\\eta'_t}(m_{t-1}) \\ge F_{\\eta^*}(m_{t-1}) = m_t"}</M>, so by induction
          no schedule beats the greedy one at any step. For large t, <M>{"m_t \\approx \\sigma^2/(th^2)"}</M>, the same rate
          that iterate averaging achieved.
        </p>
        <Code>{OPT}</Code>
      </Proof>

      <Theorem title="the cliff after a step drop">
        <p>
          If every coordinate sits at the floor of rate η and the rate drops to η′, the share of coordinate i&apos;s loss
          reduction completed after s steps is <M>{"1 - (1-\\eta'h_i)^{2s}"}</M>. Stiff coordinates finish within a few{" "}
          <M>{"1/(\\eta'h_i)"}</M> steps, flat ones take correspondingly longer.
        </p>
      </Theorem>
      <Proof>
        <p>
          This is the relaxation formula of the warmup-stable-decay lesson, with each coordinate&apos;s excess over its new
          floor shrinking by <M>{"(1-\\eta'h_i)^2"}</M> per step. Because every coordinate&apos;s floor contributes about{" "}
          <M>{"\\eta\\sigma^2/4"}</M> to the loss whatever its curvature, the stiff coordinates deliver their share of the
          drop at once, which is the cliff, and the flat ones deliver theirs slowly, which is the drift that follows.
        </p>
        <Code>{CLIFF}</Code>
      </Proof>

      <Remark title="beyond the quadratic">
        <p>
          With many curvatures the optimal rates <M>{"1/(h_it)"}</M> differ by coordinate, and one schedule must respect the
          stability limit of the stiffest while serving the flattest, which is why practical schedules hold a large rate
          and then decay over a long stretch. In the figure a tuned cosine comes within a factor of two of the optimum
          for a single coordinate; a constant rate does worse. Real networks add two effects this model cannot show. A
          large rate keeps the run in flatter regions, through the instabilities met in the warmup lesson, and
          decaying too early can lock in a sharper solution that generalises worse. And the loss of a long valley is
          mostly distance along its floor, so the stable phase can make progress that only becomes visible once a decay
          removes the noise. The next chapter studies those landscape effects directly.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "eta",
      rung: "check",
      prompt: <p>For h = 2, m₀ = 1 and σ² = 4, what is the optimal rate at step t = 10? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0455, tolerance: 0.00006 },
    },
    {
      key: "m",
      rung: "check",
      prompt: <p>For h = 0.5, m₀ = 2 and σ² = 1, what is the optimal E[x²] after T = 100 steps? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0392, tolerance: 0.00006 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does the optimal rate eventually fall like 1/t?</p>,
      answer: {
        kind: "choice",
        options: [
          "Once the error is at the noise level, each new gradient is mostly noise, and weighting it by 1/t is how a running mean combines t noisy measurements",
          "Because the curvature grows like t during training",
          "Because the gradient becomes exactly zero after 1/h steps",
          "Because larger rates are unstable once t exceeds 2/h",
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

def greedy_schedule(h, m0, sigma2, T):
    m, lrs, ms = m0, [], []
    for _ in range(T):
        lr = h * m / (h * h * m + sigma2)
        m = (1 - lr * h) ** 2 * m + lr ** 2 * sigma2
        lrs.append(lr)
        ms.append(m)
    return lrs, ms

def closed_form_m(h, m0, sigma2, t):
    return 1 / (1 / m0 + t * h * h / sigma2)

def run_m(h, m0, sigma2, lrs):
    m, out = m0, []
    for lr in lrs:
        m = (1 - lr * h) ** 2 * m + lr ** 2 * sigma2
        out.append(m)
    return out

lrs, ms = greedy_schedule(1.0, 1.0, 1.0, 4)
print([round(v, 4) for v in lrs], [round(v, 4) for v in ms], round(closed_form_m(1.0, 1.0, 1.0, 4), 4))
print([round(v, 4) for v in run_m(1.0, 1.0, 1.0, [0.5] * 4)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 0.3333, 0.25, 0.2] [0.5, 0.3333, 0.25, 0.2] 0.2\n[0.5, 0.375, 0.3438, 0.3359]",
          "[0.5, 0.25, 0.125, 0.0625] [0.5, 0.3333, 0.25, 0.2] 0.2\n[0.5, 0.375, 0.3438, 0.3359]",
          "[0.5, 0.3333, 0.25, 0.2] [0.5, 0.3333, 0.25, 0.2] 0.25\n[0.5, 0.375, 0.3438, 0.3359]",
          "[0.5, 0.3333, 0.25, 0.2] [0.5, 0.3333, 0.25, 0.2] 0.2\n[0.5, 0.25, 0.125, 0.0625]",
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

def floor_loss(h, sigma2, lr):
    return 0.5 * float(np.sum(lr * sigma2 / (2 - lr * np.asarray(h, float))))

def after_step_drop(h, sigma2, lr_hi, lr_lo, steps):
    h = np.asarray(h, float)
    m = lr_hi * sigma2 / (h * (2 - lr_hi * h))
    out = []
    for _ in range(steps):
        m = (1 - lr_lo * h) ** 2 * m + lr_lo ** 2 * sigma2
        out.append(0.5 * float(np.sum(h * m)))
    return out

def cliff_fraction(h, sigma2, lr_hi, lr_lo, steps):
    before, after, end = floor_loss(h, sigma2, lr_hi), after_step_drop(h, sigma2, lr_hi, lr_lo, steps), floor_loss(h, sigma2, lr_lo)
    return (before - after[-1]) / (before - end)

print(round(floor_loss([1.0, 0.01], 0.2, 1.0), 5), round(floor_loss([1.0, 0.01], 0.2, 0.1), 5))
print(round(cliff_fraction([1.0], 0.2, 1.0, 0.1, 20), 3), round(cliff_fraction([0.01], 0.2, 1.0, 0.1, 20), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.15025 0.01027\n0.985 0.039", "0.15025 0.01027\n0.039 0.985", "0.2 0.02\n0.985 0.039", "0.15025 0.01027\n1.0 0.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>greedy_schedule(h, m0, sigma2, T)</C>, returning the lists of optimal rates and of E[x²] after each step;{" "}
          <C>closed_form_m(h, m0, sigma2, t)</C>; and <C>run_m(h, m0, sigma2, lrs)</C>, the list of E[x²] under any
          schedule.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def greedy_schedule(h, m0, sigma2, T):
    return [1 / h] * T, [m0] * T

def closed_form_m(h, m0, sigma2, t):
    return m0

def run_m(h, m0, sigma2, lrs):
    return []
`,
        solution: OPT,
        tests: [
          { name: "greedy", code: `l, m = greedy_schedule(2.0, 1.0, 4.0, 12); assert abs(l[10] - 1 / 24) < 1e-12 and abs(m[-1] - 1 / 13) < 1e-12 and abs(closed_form_m(2.0, 1.0, 4.0, 12) - 1 / 13) < 1e-12
assert np.allclose(run_m(2.0, 1.0, 4.0, l), m)` },
          { name: "optimal", code: `rng = np.random.default_rng(0); l, m = greedy_schedule(1.0, 3.0, 0.5, 20)
for _ in range(30):
    other = list(rng.random(20) * 1.5); assert run_m(1.0, 3.0, 0.5, other)[-1] >= m[-1] - 1e-12
assert np.allclose(run_m(1.0, 1.0, 1.0, [0.5] * 2), [0.5, 0.375])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>floor_loss(h, sigma2, lr)</C>, the constant-rate loss floor summed over coordinates;{" "}
          <C>after_step_drop(h, sigma2, lr_hi, lr_lo, steps)</C>, the expected loss after each step at lr_lo starting from
          the floor of lr_hi; and <C>cliff_fraction(h, sigma2, lr_hi, lr_lo, steps)</C>, the share of the total drop
          achieved by the last of those steps.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def floor_loss(h, sigma2, lr):
    return 0.0

def after_step_drop(h, sigma2, lr_hi, lr_lo, steps):
    return []

def cliff_fraction(h, sigma2, lr_hi, lr_lo, steps):
    return 0.0
`,
        solution: CLIFF,
        tests: [
          { name: "floor", code: `assert abs(floor_loss([1.0, 0.01], 0.2, 1.0) - 0.5 * (0.2 + 0.2 / 1.99)) < 1e-12 and np.allclose(after_step_drop([1.0, 0.5], 0.3, 0.8, 0.2, 2), [0.13375, 0.1054375])
assert np.allclose(after_step_drop([0.7], 0.3, 0.4, 0.4, 3), [floor_loss([0.7], 0.3, 0.4)] * 3)` },
          { name: "cliff", code: `assert abs(cliff_fraction([0.01], 0.2, 1.0, 0.1, 500) - (1 - 0.999 ** 1000)) < 1e-9 and abs(cliff_fraction([1.0], 0.2, 1.0, 0.1, 20) - (1 - 0.9 ** 40)) < 1e-9` },
        ],
      },
    },
    {
      key: "slow",
      rung: "stretch",
      prompt: <p>The rate drops from 1 to 0.1. What share of a coordinate with h = 0.01 has completed its drop after 500 steps? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.632, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        This chapter treated the loss as a fixed bowl with noise on top. The next asks what the landscape of a real
        network looks like: where gradient descent stalls, how flat or sharp the regions it settles in are, and why
        training so often hovers right at the edge of stability.
      </p>
    </>
  ),
};
