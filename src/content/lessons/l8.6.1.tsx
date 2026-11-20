import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TrainingCurveViz } from "@/components/viz/TrainingCurveViz";
import type { LessonContent } from "@/lib/types";

const SMOOTH = `import math

def ema(xs, beta=0.9):
    out, m = [], 0.0
    for t, x in enumerate(xs, 1):
        m = beta * m + (1 - beta) * x
        out.append(m / (1 - beta ** t))
    return out

def slope_per_decade(steps, losses):
    xs = [math.log10(s) for s in steps]
    mx, my = sum(xs) / len(xs), sum(losses) / len(losses)
    num = sum((x - mx) * (y - my) for x, y in zip(xs, losses))
    den = sum((x - mx) ** 2 for x in xs)
    return num / den

def first_plateau(xs, window, tol):
    for i in range(window, len(xs)):
        if xs[i - window] - xs[i] < tol:
            return i
    return -1`;

const COMPARE = `import math

def bits_per_byte(loss_nats, n_tokens, n_bytes):
    return loss_nats * n_tokens / (n_bytes * math.log(2))

def gap(train, val):
    return [v - t for t, v in zip(train, val)]

def diff_noise(xs):
    d = [xs[i] - xs[i - 1] for i in range(1, len(xs))]
    m = sum(d) / len(d)
    return math.sqrt(sum((x - m) ** 2 for x in d) / len(d) / 2)`;

export const lesson: LessonContent = {
  id: "l8.6.1",
  minutes: 45,
  links: {
    requires: ["l8.5.3", "l8.4.1"],
    revisits: ["l8.2.4", "l8.1.1", "l8.1.3"],
    foreshadows: ["l8.6.2", "l8.6.3"],
  },

  puzzle: (
    <>
      <p>
        A pretraining run is a single experiment that costs months. Its main instrument is a curve that wobbles by a tenth of a
        nat from step to step and moves by a hundredth over a day. Engineers watching it must decide whether the run is healthy,
        whether yesterday&apos;s change helped, and whether the final model will land where the scaling law said. What can such a
        curve be trusted to say?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each training step reports the loss on a fresh batch. In a single pass over the data, that batch has never been seen, so
        the training loss is an honest estimate of the held-out loss, but a noisy one. Smoothing removes the noise and adds a
        lag. A log step axis spreads out the early phase where most change happens. And because the loss falls roughly as a
        power law, the right question is rarely &quot;is it still going down?&quot; but &quot;is it going down as fast as the fit predicted?&quot;
      </p>
      <TrainingCurveViz />
    </>
  ),

  theory: (
    <>
      <Definition title="smoothing with a debiased moving average">
        <p>
          The exponential moving average <M>{"m_t = \\beta m_{t-1} + (1-\\beta)x_t"}</M> with <M>{"m_0 = 0"}</M> is biased towards zero early on;
          dividing by <M>{"1 - \\beta^t"}</M> corrects it, the same correction Adam applies to its moments (<C>ema</C>). Its effective window is
          about <M>{"1/(1-\\beta)"}</M> steps, and on a falling curve it lags by about <M>{"\\beta/(1-\\beta)"}</M> steps. Progress is best read as the
          least-squares slope of loss against <M>{"\\log_{10}"}</M> of the step: the loss change per tenfold increase in
          training (<C>slope_per_decade</C>). A simple stall detector reports the first step whose improvement over a window falls below a
          tolerance (<C>first_plateau</C>).
        </p>
        <Code>{SMOOTH}</Code>
      </Definition>

      <Theorem title="the debiased average of a constant is that constant">
        <p>
          If <M>{"x_t = c"}</M> for all t, then <M>{"m_t/(1-\\beta^t) = c"}</M> for every t.
        </p>
      </Theorem>
      <Proof>
        <p>
          Unrolling, <M>{"m_t = (1-\\beta)\\sum_{i=1}^{t}\\beta^{t-i}x_i"}</M>. With <M>{"x_i = c"}</M> the sum is a geometric series,{" "}
          <M>{"m_t = c(1-\\beta)(1-\\beta^t)/(1-\\beta) = c(1-\\beta^t)"}</M>. Dividing by <M>{"1 - \\beta^t"}</M> gives c. The weights on the{" "}
          <M>{"x_i"}</M> after correction therefore sum to one at every step.
        </p>
      </Proof>

      <Definition title="comparing runs fairly">
        <p>
          Loss in nats per token depends on the tokeniser: a tokeniser with longer tokens has fewer, harder predictions. Bits per
          byte divides out both, <M>{"\\text{bpb} = L\\,N_{\\text{tok}}/(N_{\\text{bytes}}\\ln 2)"}</M> (<C>bits_per_byte</C>), and is the
          compression rate of l8.1.1. Validation losses on fixed held-out sets, ideally one per data source, sit beside the
          training loss; the gap between them (<C>gap</C>) is near zero in a single epoch and grows with repetition (l8.1.3) or
          a mismatch between training and held-out data. The noise level sets what difference is visible: for independent noise,
          the standard deviation of successive differences is <M>{"\\sqrt{2}"}</M> times the per-step noise (<C>diff_noise</C>), and the
          trend cancels to first order.
        </p>
        <Code>{COMPARE}</Code>
      </Definition>

      <Remark title="what else to plot">
        <p>
          The gradient norm, the update-to-weight ratio per layer, the largest attention logit (l8.2.3) and the learning rate
          itself. Many failures show in these first: a growing gradient norm or attention logit often precedes a loss spike by
          hundreds of steps, which is the subject of l8.6.2. Under a warmup-stable-decay schedule the loss in the stable phase
          understates the final model (l8.5.3), so it should be compared with the stable phase of earlier runs, not with their
          finished curves.
        </p>
      </Remark>

      <Example title="checking a run against its forecast">
        <p>
          Before a large run, small runs fix a law such as <M>{"L(D) = E + B D^{-\\beta}"}</M>. During the run, the observed smoothed loss at
          each token count is compared with the forecast. A curve that tracks it within the seed noise of l8.2.4 is healthy; one
          that drifts steadily above it has a problem that will not cure itself, such as a data-loader bug that repeats shards,
          a learning rate that is too high for the new scale, or a numerical issue in a new kernel.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "ema",
      rung: "check",
      prompt: <p>Training losses 3.0, 2.0 and 2.5 arrive at steps 1, 2 and 3. What is the debiased moving average with β = 0.9 after step 3? Give three decimals.</p>,
      answer: { kind: "numeric", value: 2.483, tolerance: 0.001 },
    },
    {
      key: "bpb",
      rung: "check",
      prompt: <p>A model has validation loss 2.0 nats per token with a tokeniser that averages 4.2 bytes per token. What is its loss in bits per byte? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.687, tolerance: 0.001 },
    },
    {
      key: "gapq",
      rung: "apply",
      prompt: <p>In a run meant to see each document once, the training loss has started to fall below the validation loss, and the gap widens each day. What is the most likely cause?</p>,
      answer: {
        kind: "choice",
        options: [
          "The model is seeing repeated training data, for example from a data-loader bug or duplicated shards, and is starting to memorise it",
          "The learning rate is too low",
          "The validation set is too large",
          "The model has entered the decay phase of its schedule",
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

def ema(xs, beta=0.9):
    out, m = [], 0.0
    for t, x in enumerate(xs, 1):
        m = beta * m + (1 - beta) * x
        out.append(m / (1 - beta ** t))
    return out

def slope_per_decade(steps, losses):
    xs = [math.log10(s) for s in steps]
    mx, my = sum(xs) / len(xs), sum(losses) / len(losses)
    num = sum((x - mx) * (y - my) for x, y in zip(xs, losses))
    den = sum((x - mx) ** 2 for x in xs)
    return num / den

def first_plateau(xs, window, tol):
    for i in range(window, len(xs)):
        if xs[i - window] - xs[i] < tol:
            return i
    return -1

print([round(v, 3) for v in ema([1.0, 3.0], 0.5)], first_plateau([5.0, 4.0, 3.5, 3.4, 3.35], 1, 0.2))
print(round(slope_per_decade([10, 100, 1000], [3.0, 2.5, 2.0]), 3), first_plateau([3.0, 2.0, 1.0], 1, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 2.333] 3\n-0.5 -1",
          "[0.5, 1.75] 3\n-0.5 -1",
          "[1.0, 2.333] 2\n-0.5 -1",
          "[1.0, 2.0] 3\n-1.0 2",
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

def bits_per_byte(loss_nats, n_tokens, n_bytes):
    return loss_nats * n_tokens / (n_bytes * math.log(2))

def gap(train, val):
    return [v - t for t, v in zip(train, val)]

def diff_noise(xs):
    d = [xs[i] - xs[i - 1] for i in range(1, len(xs))]
    m = sum(d) / len(d)
    return math.sqrt(sum((x - m) ** 2 for x in d) / len(d) / 2)

print(round(bits_per_byte(math.log(2), 1, 1), 3), round(bits_per_byte(2.0, 100, 400), 3))
print([round(g, 2) for g in gap([2.0, 1.9], [2.1, 2.2])], diff_noise([1.0, 1.0, 1.0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 0.721\n[0.1, 0.3] 0.0",
          "0.693 0.721\n[0.1, 0.3] 0.0",
          "1.0 2.885\n[0.1, 0.3] 0.0",
          "1.0 0.721\n[-0.1, -0.3] 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ema(xs, beta=0.9)</C> with bias correction, <C>slope_per_decade(steps, losses)</C> and{" "}
          <C>first_plateau(xs, window, tol)</C>, which returns -1 if there is no such step.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def ema(xs, beta=0.9):
    out, m = [], 0.0
    for x in xs:
        m = beta * m + (1 - beta) * x
        out.append(m)
    return out

def slope_per_decade(steps, losses):
    return (losses[-1] - losses[0]) / (steps[-1] - steps[0])

def first_plateau(xs, window, tol):
    return -1
`,
        solution: SMOOTH,
        tests: [
          { name: "ema", code: `out = ema([4.0, 4.0, 4.0, 1.0], 0.8)\nassert all(abs(v - 4.0) < 1e-12 for v in out[:3]) and abs(out[3] - (0.2 * 4 * (1 + 0.8 + 0.64) * 0.8 + 0.2) / (1 - 0.8 ** 4)) < 1e-12` },
          { name: "slope", code: `assert abs(slope_per_decade([1, 10, 100, 1000], [4.0, 3.6, 3.2, 2.8]) + 0.4) < 1e-12\nassert first_plateau([9.0, 7.0, 6.0, 5.5, 5.4], 2, 1.0) == 4 and first_plateau([4.0, 3.0, 2.0], 1, 0.5) == -1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bits_per_byte(loss_nats, n_tokens, n_bytes)</C>, <C>gap(train, val)</C> and <C>diff_noise(xs)</C>, the population
          standard deviation of successive differences divided by <M>{"\\sqrt{2}"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def bits_per_byte(loss_nats, n_tokens, n_bytes):
    return loss_nats

def gap(train, val):
    return [t - v for t, v in zip(train, val)]

def diff_noise(xs):
    return 0.0
`,
        solution: COMPARE,
        tests: [
          { name: "bpb", code: `assert abs(bits_per_byte(3.0, 50, 150) - 1 / math.log(2)) < 1e-12 and [round(g, 9) for g in gap([1.5, 1.0], [2.0, 1.75])] == [0.5, 0.75]` },
          { name: "noise", code: `assert abs(diff_noise([0.0, 1.0, 0.0, 1.0, 0.0]) - 1 / math.sqrt(2)) < 1e-12 and abs(diff_noise([5.0, 4.0, 3.0, 2.0])) < 1e-12` },
        ],
      },
    },
    {
      key: "steps",
      rung: "stretch",
      prompt: (
        <p>
          Two runs have independent per-step loss noise with standard deviation 0.05. You compare them by the difference of their
          mean losses over the last n steps, treating the expected loss as constant over that window. What is the smallest n for
          which the standard deviation of that difference is at most 0.005?
        </p>
      ),
      answer: { kind: "numeric", value: 200, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        A healthy curve is smooth after averaging and tracks its forecast. The next lesson is about the curves that are not:
        sudden spikes, slow divergences, and the interventions large runs use to survive them.
      </p>
    </>
  ),
};
