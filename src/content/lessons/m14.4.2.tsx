import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CosineHorizonViz } from "@/components/viz/CosineHorizonViz";
import type { LessonContent } from "@/lib/types";

const SCHED = `import numpy as np

def cosine(t, T, lr_max, lr_min=0.0):
    return float(lr_min + 0.5 * (lr_max - lr_min) * (1 + np.cos(np.pi * min(t, T) / T)))

def schedule_loss(h, x0sq, sigma2, lrs):
    h, m = np.asarray(h, float), np.asarray(x0sq, float)
    out = []
    for lr in lrs:
        m = (1 - lr * h) ** 2 * m + lr ** 2 * sigma2
        out.append(0.5 * float(np.sum(h * m)))
    return out

def area_fraction(T, start, stop):
    lrs = [cosine(t, T, 1.0) for t in range(T)]
    return float(sum(lrs[start:stop]) / sum(lrs))`;

const SPLIT = `import numpy as np

def bias_term(h, x0sq, lrs):
    h = np.asarray(h, float)
    keep = np.prod([(1 - lr * h) ** 2 for lr in lrs], axis=0)
    return 0.5 * float(np.sum(h * keep * np.asarray(x0sq, float)))

def variance_term(h, sigma2, lrs):
    h, total = np.asarray(h, float), 0.0
    for t, lr in enumerate(lrs):
        later = np.prod([(1 - s * h) ** 2 for s in lrs[t + 1:]], axis=0) if t + 1 < len(lrs) else 1.0
        total += 0.5 * float(np.sum(h * lr ** 2 * sigma2 * later))
    return total

def stationary_floor(h, sigma2, lr):
    h = np.asarray(h, float)
    return 0.5 * float(np.sum(lr * sigma2 / (2 - lr * h)))`;

export const lesson: LessonContent = {
  id: "m14.4.2",
  minutes: 40,
  links: {
    requires: ["m14.4.1", "l3.6.3"],
    revisits: ["m14.1.3"],
    foreshadows: ["m14.4.3", "m14.4.5"],
  },

  puzzle: (
    <>
      <p>
        A team trains with a cosine schedule planned for 100,000 steps. At step 50,000 they evaluate and find the model
        noticeably worse than a separate run that used a 50,000-step cosine schedule and has just finished. Both runs saw
        the same data in the same order up to that point. Why is the half-finished long run behind, and what does that
        say about what the end of a cosine schedule is for?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The loss of noisy SGD has two parts. The bias part, the distance still to travel, shrinks with the total amount of
        learning rate spent, the area under the schedule. The noise part, the jitter the steps themselves cause, depends
        mostly on the current learning rate, because noise injected long ago has been forgotten. Cosine decay spends most
        of its area early and ends near zero, so at its end both parts are small. Halfway through, the rate is still half
        its peak and the noise part is large. The final stretch of a cosine schedule travels almost nowhere; its job is
        to anneal the noise away.
      </p>
      <CosineHorizonViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the noisy quadratic and its schedule">
        <p>
          Run SGD on <M>{"\\tfrac12\\sum_i h_ix_i^2"}</M> with gradient noise of variance <M>{"\\sigma^2"}</M> per coordinate
          and rates <M>{"\\eta_1, \\dots, \\eta_T"}</M>. The expected squares obey{" "}
          <M>{"m_i \\leftarrow (1-\\eta_th_i)^2m_i + \\eta_t^2\\sigma^2"}</M>, and the expected loss is{" "}
          <M>{"\\tfrac12\\sum_ih_im_i"}</M>. The cosine schedule is{" "}
          <M>{"\\eta_t = \\eta_{\\min} + \\tfrac12(\\eta_{\\max} - \\eta_{\\min})(1 + \\cos(\\pi t/T))"}</M>.
        </p>
      </Definition>

      <Theorem title="bias and variance">
        <p>The expected loss after the schedule is exactly</p>
        <MD>{"\\tfrac12\\sum_ih_i\\Big[\\prod_{t=1}^T(1-\\eta_th_i)^2\\,m_i(0) + \\sigma^2\\sum_{t=1}^T\\eta_t^2\\prod_{s>t}(1-\\eta_sh_i)^2\\Big]."}</MD>
        <p>
          With a constant rate η the variance part tends to{" "}
          <M>{"\\tfrac12\\sum_i\\eta\\sigma^2/(2-\\eta h_i) \\approx d\\,\\eta\\sigma^2/4"}</M>, a floor proportional to the
          rate. With a slowly varying rate, each coordinate tracks the floor of its current rate.
        </p>
      </Theorem>
      <Proof>
        <p>
          The recursion is linear in m, so unroll it: the initial value is multiplied by every factor{" "}
          <M>{"(1-\\eta_th_i)^2"}</M>, and the noise injected at step t by the factors of the later steps only. For a
          constant rate the fixed point of <M>{"m = (1-\\eta h)^2m + \\eta^2\\sigma^2"}</M> is{" "}
          <M>{"m = \\eta\\sigma^2/(h(2-\\eta h))"}</M>, and <M>{"\\tfrac12hm = \\eta\\sigma^2/(2(2-\\eta h))"}</M>. The weights{" "}
          <M>{"\\prod_{s>t}(1-\\eta_sh)^2"}</M> decay geometrically in the number of later steps, so the noise term is
          dominated by the last <M>{"O(1/(\\eta h))"}</M> steps, and if η hardly changes over that window the term is close
          to the floor of the current rate.
        </p>
        <Code>{SPLIT}</Code>
      </Proof>

      <Theorem title="where cosine spends its area">
        <p>
          With <M>{"\\eta_{\\min} = 0"}</M>, the fraction of the total area <M>{"\\sum_t\\eta_t"}</M> spent in the final
          fraction q of the run tends, as T grows, to <M>{"q - \\sin(\\pi q)/\\pi"}</M>. For q = 0.1 that is about 0.0016,
          and stopping at the midpoint leaves the rate at <M>{"\\eta_{\\max}/2"}</M> after spending 82% of the area.
        </p>
      </Theorem>
      <Proof>
        <p>
          The sum is a Riemann sum for <M>{"T\\eta_{\\max}\\int_0^1\\tfrac12(1+\\cos\\pi p)\\,dp = T\\eta_{\\max}/2"}</M>. The
          last fraction q contributes{" "}
          <M>{"\\tfrac12\\int_{1-q}^1(1+\\cos\\pi p)\\,dp = \\tfrac12\\big(q - \\sin(\\pi(1-q))/\\pi\\big) = \\tfrac12\\big(q - \\sin(\\pi q)/\\pi\\big)"}</M>,
          and dividing by ½ gives the fraction. The first half contributes{" "}
          <M>{"\\tfrac12(\\tfrac12 + 1/\\pi)"}</M> out of ½, which is about 0.818.
        </p>
        <Code>{SCHED}</Code>
      </Proof>

      <Remark title="what this implies">
        <p>
          The bias part is driven down by area, of which cosine&apos;s tail contributes almost none; the variance part is
          driven down by a small current rate, which only the tail provides. Cosine therefore does two jobs in sequence,
          but it fixes the switch-over in advance through T. To compare checkpoints of different lengths, or to extend a
          run, you either rerun with a new T or accept checkpoints that are still in their noisy phase. Decoupling the two
          jobs is the idea of the next lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "tail",
      rung: "check",
      prompt: <p>For a long cosine schedule decaying to zero, what fraction of the total area falls in the last 20% of the run? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.013, tolerance: 0.0006 },
    },
    {
      key: "floor",
      rung: "check",
      prompt: <p>One coordinate has h = 1, the noise variance is σ² = 0.2 and the rate is held at η = 0.1. What expected loss does it settle at? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0053, tolerance: 0.00006 },
    },
    {
      key: "stop",
      rung: "apply",
      prompt: <p>Why is the midpoint checkpoint of a long cosine run worse than the final checkpoint of a run half as long?</p>,
      answer: {
        kind: "choice",
        options: [
          "At its midpoint the long run is still at half its peak rate, so its noise floor is high; the short run has annealed its rate to zero",
          "The long run has spent less learning-rate area by its midpoint than the short run has in total",
          "The long run's warmup was longer",
          "Cosine schedules make the loss increase in their first half",
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

def cosine(t, T, lr_max, lr_min=0.0):
    return float(lr_min + 0.5 * (lr_max - lr_min) * (1 + np.cos(np.pi * min(t, T) / T)))

def schedule_loss(h, x0sq, sigma2, lrs):
    h, m = np.asarray(h, float), np.asarray(x0sq, float)
    out = []
    for lr in lrs:
        m = (1 - lr * h) ** 2 * m + lr ** 2 * sigma2
        out.append(0.5 * float(np.sum(h * m)))
    return out

def area_fraction(T, start, stop):
    lrs = [cosine(t, T, 1.0) for t in range(T)]
    return float(sum(lrs[start:stop]) / sum(lrs))

print([round(cosine(t, 4, 1.0), 3) for t in range(5)], round(area_fraction(1000, 900, 1000), 4), round(area_fraction(1000, 0, 500), 3))
print([round(v, 4) for v in schedule_loss([1.0], [1.0], 0.1, [0.5, 0.5])], round(schedule_loss([1.0], [1.0], 0.1, [0.5] * 200)[-1], 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 0.854, 0.5, 0.146, 0.0] 0.0017 0.818\n[0.1375, 0.0469] 0.0167",
          "[1.0, 0.75, 0.5, 0.25, 0.0] 0.0017 0.818\n[0.1375, 0.0469] 0.0167",
          "[1.0, 0.854, 0.5, 0.146, 0.0] 0.1 0.5\n[0.1375, 0.0469] 0.0167",
          "[1.0, 0.854, 0.5, 0.146, 0.0] 0.0017 0.818\n[0.125, 0.0312] 0.0",
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

def bias_term(h, x0sq, lrs):
    h = np.asarray(h, float)
    keep = np.prod([(1 - lr * h) ** 2 for lr in lrs], axis=0)
    return 0.5 * float(np.sum(h * keep * np.asarray(x0sq, float)))

def variance_term(h, sigma2, lrs):
    h, total = np.asarray(h, float), 0.0
    for t, lr in enumerate(lrs):
        later = np.prod([(1 - s * h) ** 2 for s in lrs[t + 1:]], axis=0) if t + 1 < len(lrs) else 1.0
        total += 0.5 * float(np.sum(h * lr ** 2 * sigma2 * later))
    return total

def stationary_floor(h, sigma2, lr):
    h = np.asarray(h, float)
    return 0.5 * float(np.sum(lr * sigma2 / (2 - lr * h)))

lrs = [0.5, 0.25]
print(round(bias_term([1.0, 2.0], [1.0, 1.0], lrs), 5), round(variance_term([1.0, 2.0], 0.1, lrs), 5), round(stationary_floor([1.0], 0.1, 0.5), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.07031 0.02266 0.0167", "0.0 0.02266 0.0167", "0.07031 0.0125 0.0167", "0.07031 0.02266 0.025"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cosine(t, T, lr_max, lr_min=0.0)</C>, held at lr_min for t ≥ T and returned as a float;{" "}
          <C>schedule_loss(h, x0sq, sigma2, lrs)</C>, the expected loss after each step of the recursion; and{" "}
          <C>area_fraction(T, start, stop)</C>, the share of <C>Σ cosine(t, T, 1)</C> over t &lt; T that falls in{" "}
          <C>start ≤ t &lt; stop</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def cosine(t, T, lr_max, lr_min=0.0):
    return lr_max

def schedule_loss(h, x0sq, sigma2, lrs):
    return []

def area_fraction(T, start, stop):
    return (stop - start) / T
`,
        solution: SCHED,
        tests: [
          { name: "cosine", code: `assert np.allclose([cosine(t, 4, 1.0) for t in range(6)], [1, 0.8535533905932737, 0.5, 0.14644660940672624, 0, 0])
assert abs(cosine(2, 4, 0.1, 0.02) - 0.06) < 1e-12 and isinstance(cosine(1, 4, 1.0), float)
assert abs(area_fraction(100, 80, 100) - 0.013735095747969918) < 1e-12 and abs(area_fraction(10, 0, 10) - 1) < 1e-12` },
          { name: "loss", code: `assert np.allclose(schedule_loss([1.0], [1.0], 0.1, [0.5, 0.5]), [0.1375, 0.046875])
out = schedule_loss([1.0, 0.1], [2.0, 3.0], 0.0, [0.3] * 3); assert np.allclose(out[-1], 0.5 * (1 * 2 * 0.7 ** 6 + 0.1 * 3 * 0.97 ** 6))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bias_term(h, x0sq, lrs)</C> and <C>variance_term(h, sigma2, lrs)</C>, the two parts of the final expected
          loss from the theorem, and <C>stationary_floor(h, sigma2, lr)</C>, the constant-rate floor summed over
          coordinates.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def bias_term(h, x0sq, lrs):
    return 0.0

def variance_term(h, sigma2, lrs):
    return 0.0

def stationary_floor(h, sigma2, lr):
    return 0.0
`,
        solution: SPLIT,
        tests: [
          { name: "split", code: `assert abs(bias_term([1.0, 2.0], [1.0, 1.0], [0.5, 0.25]) - 0.0703125) < 1e-12 and abs(variance_term([1.0, 2.0], 0.1, [0.5, 0.25]) - 0.02265625) < 1e-12
rng = np.random.default_rng(0); h = rng.random(4) + 0.1; x = rng.random(4); lrs = list(rng.random(6))
assert abs(bias_term(h, x, lrs) + variance_term(h, 0.3, lrs) - 0.27909902275766546) < 1e-12` },
          { name: "floor", code: `assert abs(stationary_floor([1.0], 0.2, 0.1) - 0.005263157894736844) < 1e-12 and abs(stationary_floor([1.0, 0.5], 0.4, 0.5) - 0.5 * (0.2 / 1.5 + 0.2 / 1.75)) < 1e-12
assert abs(variance_term([1.0], 0.2, [0.1] * 400) - stationary_floor([1.0], 0.2, 0.1)) < 1e-6` },
        ],
      },
    },
    {
      key: "late",
      rung: "stretch",
      prompt: <p>A cosine schedule decaying to zero is stopped at 80% of its planned length. What fraction of its peak rate is it at? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.095, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        If the end of a schedule is for annealing and the middle for travelling, the two can be separated: hold the rate
        constant for as long as you like, and decay it only when you want a finished model. That is the
        warmup-stable-decay schedule.
      </p>
    </>
  ),
};
