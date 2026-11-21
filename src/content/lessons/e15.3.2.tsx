import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WsdScheduleViz } from "@/components/viz/WsdScheduleViz";
import type { LessonContent } from "@/lib/types";

const RUN = `def wsd_lr(step, peak, warmup, total, decay_frac):
    decay_start = total - int(decay_frac * total)
    if step < warmup:
        return peak * (step + 1) / warmup                  # linear warmup
    if step < decay_start:
        return peak                                        # stable phase
    return peak * (total - step) / (total - decay_start)   # linear decay to zero

def mfu(tokens_per_s, flops_per_token, peak):
    return tokens_per_s * flops_per_token / peak

def eta_hours(done, total, sec_per_step):
    return (total - done) * sec_per_step / 3600`;

const WATCH = `def ema(xs, alpha):
    out, m = [], None
    for x in xs:
        m = x if m is None else alpha * m + (1 - alpha) * x
        out.append(m)
    return out

def spikes(losses, alpha, k):
    smooth = ema(losses, alpha)
    return [i for i in range(1, len(losses)) if losses[i] > smooth[i - 1] * (1 + k)]   # compare with the trend so far

def rewind(spike, ckpt_every, margin):
    resume = spike // ckpt_every * ckpt_every              # last checkpoint at or before the spike
    return resume, (resume, spike + margin)                # restart there and skip these batches`;

export const lesson: LessonContent = {
  id: "e15.3.2",
  minutes: 45,
  links: {
    requires: ["e15.3.1"],
    revisits: ["l8.5.3", "l8.6.1", "e13.3.1", "e13.4.2", "e13.2.3"],
    foreshadows: ["e15.3.3"],
  },

  puzzle: (
    <>
      <p>
        The main run starts. For the next day or two it will produce a loss every few seconds, a checkpoint every hour,
        and occasionally a spike, a slowdown or a crash. Each of these demands a decision: carry on, roll back, skip data,
        change something. Decisions made at three in the morning are poor ones. What should be decided before launch, and
        what should be watched once it is running?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Fix the schedule and the response to every expected event in advance. A warmup-stable-decay schedule keeps the
        learning rate flat for most of the run, so any stable checkpoint can be decayed into a usable model, and the run
        can be extended or cut short without restarting. Track throughput as model FLOPs utilisation, which reveals
        slow nodes and data stalls. Compare the smoothed loss with the ladder&apos;s prediction, flag spikes relative to
        the recent trend, and when one does not recover, roll back to a checkpoint before it and skip the batches around
        it.
      </p>
      <WsdScheduleViz />
    </>
  ),

  theory: (
    <>
      <Definition title="schedule and throughput">
        <p>
          The warmup-stable-decay schedule of l8.5.3 rises linearly to its peak, stays there, and decays linearly to zero
          over the final fraction of steps (<C>wsd_lr</C>). Model FLOPs utilisation is achieved FLOPs over peak, using the
          FLOPs per token of the design document rather than whatever the kernels happen to execute (<C>mfu</C>); with the
          time per step, it gives the time remaining (<C>eta_hours</C>).
        </p>
        <Code>{RUN}</Code>
      </Definition>

      <Definition title="smoothing and spikes">
        <p>
          An exponential moving average <M>{"m_t = \\alpha m_{t-1} + (1 - \\alpha)x_t"}</M>, started at the first value,
          tracks the trend of a noisy loss (<C>ema</C>). A step is a spike if its loss exceeds the average up to the
          previous step by more than a relative margin k (<C>spikes</C>), which, unlike a fixed threshold, keeps working as
          the loss falls. A spike that persists triggers a rewind to the last checkpoint at or before it, skipping the
          batches from there to a margin past the spike (<C>rewind</C>), the response that e13.3.1&apos;s postmortems
          found to work.
        </p>
        <Code>{WATCH}</Code>
      </Definition>

      <Theorem title="the lag of a moving average">
        <p>
          The EMA started at <M>{"x_0"}</M> is a weighted average,{" "}
          <M>{"m_t = \\alpha^t x_0 + \\sum_{i=1}^{t} (1-\\alpha)\\alpha^{t-i} x_i"}</M>, whose weights sum to one. For a long
          series, the weighted mean age of its inputs is <M>{"\\alpha/(1-\\alpha)"}</M> steps.
        </p>
      </Theorem>
      <Proof>
        <p>
          The formula holds for t = 0, and substituting it into <M>{"m_t = \\alpha m_{t-1} + (1-\\alpha)x_t"}</M>{" "}
          multiplies every earlier weight by α and gives <M>{"x_t"}</M> the weight 1 − α, which extends it to t. The weights
          sum to <M>{"\\alpha^t + (1-\\alpha)(1 + \\alpha + \\dots + \\alpha^{t-1}) = \\alpha^t + 1 - \\alpha^t = 1"}</M>. As t
          grows, the input of age j has weight <M>{"(1-\\alpha)\\alpha^j"}</M>, a geometric distribution with mean{" "}
          <M>{"\\alpha/(1-\\alpha)"}</M>. With α = 0.99 the average reflects the loss of about 99 steps ago, so it lags a
          falling loss, which is why spikes are compared with it only by a relative margin.
        </p>
      </Proof>

      <Example title="the capstone run sheet">
        <p>
          Before launch the run sheet lists: the schedule, with the decay starting at 80% of steps; the expected loss in
          bits per byte at five points, from the ladder; the expected throughput and MFU; checkpoints every 1000 steps,
          keeping the last three and every tenth, as in e13.4.2; spike alerts at a 10% relative margin over an EMA with α =
          0.98, routed as in e13.2.3; and the rule that a spike not recovered within 200 steps is rolled back. Every event
          during the run is logged against this sheet.
        </p>
      </Example>

      <Remark title="when to deviate">
        <p>
          The loss curves of l8.6.1 have a typical shape: a fast fall, a long slow decline, and a sharp drop during decay.
          A run that sits persistently above the ladder&apos;s prediction band during the stable phase has a problem the
          ladder did not have, often a data-loading bug or a different effective batch size, and is worth stopping to
          investigate. A run within the band should be left alone, however tempting it is to adjust it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "lr",
      rung: "check",
      prompt: (
        <p>
          A run of 100000 steps has peak learning rate 3 × 10⁻³, 2000 warmup steps, and decays over its final 20%. What is
          the learning rate at step 85000, in units of 10⁻³?
        </p>
      ),
      answer: { kind: "numeric", value: 2.25, tolerance: 0.001 },
    },
    {
      key: "mfu",
      rung: "check",
      prompt: (
        <p>
          A GPU with a peak of 989 TFLOP/s processes 180000 tokens per second for a model needing 1.686 × 10⁹ training
          FLOPs per token. What is the model FLOPs utilisation, to four decimals?
        </p>
      ),
      answer: { kind: "numeric", value: 0.3069, tolerance: 0.0001 },
    },
    {
      key: "wsd",
      rung: "apply",
      prompt: <p>What does a warmup-stable-decay schedule allow that a cosine schedule over the whole run does not?</p>,
      answer: {
        kind: "choice",
        options: [
          "Decaying from any stable checkpoint to get a finished model, and extending the run without restarting",
          "Training without a learning rate",
          "Skipping warmup entirely",
          "Avoiding all loss spikes",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def wsd_lr(step, peak, warmup, total, decay_frac):
    decay_start = total - int(decay_frac * total)
    if step < warmup:
        return peak * (step + 1) / warmup                  # linear warmup
    if step < decay_start:
        return peak                                        # stable phase
    return peak * (total - step) / (total - decay_start)   # linear decay to zero

def mfu(tokens_per_s, flops_per_token, peak):
    return tokens_per_s * flops_per_token / peak

def eta_hours(done, total, sec_per_step):
    return (total - done) * sec_per_step / 3600

print([wsd_lr(s, 1.0, 2, 10, 0.5) for s in (0, 3, 6, 9)], mfu(10, 30, 600))
print(eta_hours(1000, 4600, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0.5, 1.0, 0.8, 0.2] 0.5\n2.0", "[0.0, 1.0, 0.8, 0.2] 0.5\n2.0", "[0.5, 1.0, 1.0, 0.2] 0.5\n2.0", "[0.5, 1.0, 0.8, 0.2] 0.5\n2.5"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ema(xs, alpha):
    out, m = [], None
    for x in xs:
        m = x if m is None else alpha * m + (1 - alpha) * x
        out.append(m)
    return out

def spikes(losses, alpha, k):
    smooth = ema(losses, alpha)
    return [i for i in range(1, len(losses)) if losses[i] > smooth[i - 1] * (1 + k)]   # compare with the trend so far

def rewind(spike, ckpt_every, margin):
    resume = spike // ckpt_every * ckpt_every              # last checkpoint at or before the spike
    return resume, (resume, spike + margin)                # restart there and skip these batches

print(ema([4, 2, 2], 0.5), spikes([3.0, 2.9, 3.4, 2.8, 2.9], 0.5, 0.1))
print(rewind(2350, 500, 20), rewind(1000, 500, 0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[4, 3.0, 2.5] [2]\n(2000, (2000, 2370)) (1000, (1000, 1000))",
          "[4, 3.0, 2.5] [2, 4]\n(2000, (2000, 2370)) (1000, (1000, 1000))",
          "[4, 3.0, 2.5] [2]\n(2500, (2500, 2370)) (1000, (1000, 1000))",
          "[4, 3.0, 2.5] [2]\n(2000, (2000, 2370)) (500, (500, 1000))",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>wsd_lr(step, peak, warmup, total, decay_frac)</C>, with warmup giving peak × (step + 1) / warmup and the
          decay starting at total minus int(decay_frac × total); <C>mfu(tokens_per_s, flops_per_token, peak)</C>; and{" "}
          <C>eta_hours(done, total, sec_per_step)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def wsd_lr(step, peak, warmup, total, decay_frac):
    return peak

def mfu(tokens_per_s, flops_per_token, peak):
    return 1.0

def eta_hours(done, total, sec_per_step):
    return 0.0
`,
        solution: RUN,
        tests: [
          { name: "lr", code: `assert [wsd_lr(s, 4.0, 4, 20, 0.25) for s in (0, 3, 10, 15, 18)] == [1.0, 4.0, 4.0, 4.0, 1.6] and mfu(2, 5, 40) == 0.25` },
          { name: "eta", code: `assert eta_hours(10, 3610, 1) == 1.0 and eta_hours(5, 5, 9) == 0 and wsd_lr(20, 4.0, 4, 20, 0.25) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ema(xs, alpha)</C>, started at the first value; <C>spikes(losses, alpha, k)</C>, the indices whose loss
          exceeds the previous average by more than a factor 1 + k; and <C>rewind(spike, ckpt_every, margin)</C>, returning
          the resume step and the range of batches to skip.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ema(xs, alpha):
    return list(xs)

def spikes(losses, alpha, k):
    return []

def rewind(spike, ckpt_every, margin):
    return 0, (0, spike)
`,
        solution: WATCH,
        tests: [
          { name: "ema", code: `assert ema([], 0.5) == [] and ema([8, 0, 0], 0.75) == [8, 6.0, 4.5] and spikes([2, 2, 3, 2, 2.1], 0.5, 0.25) == [2]` },
          { name: "rewind", code: `assert rewind(999, 1000, 5) == (0, (0, 1004)) and rewind(3001, 1000, 10) == (3000, (3000, 3011)) and spikes([5], 0.9, 0) == []` },
        ],
      },
    },
    {
      key: "skip",
      rung: "stretch",
      prompt: (
        <p>
          A spike at step 41730 does not recover. Checkpoints are every 1000 steps, the skip margin is 200 batches, and
          each batch holds half a million tokens. How many million tokens of data are skipped after the rewind?
        </p>
      ),
      answer: { kind: "numeric", value: 465, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        The main run ends its stable phase. The next lesson uses the decay for more than lowering the learning rate:
        mid-training changes the data to high-quality and longer-context sources while the model anneals.
      </p>
    </>
  ),
};
