import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DecimationViz } from "@/components/viz/DecimationViz";
import type { LessonContent } from "@/lib/types";

const DOWNSAMPLE = `def bucket_mean(xs, k):
    return [sum(xs[i:i + k]) / len(xs[i:i + k]) for i in range(0, len(xs), k)]

def bucket_minmax(xs, k):
    return [(min(xs[i:i + k]), max(xs[i:i + k])) for i in range(0, len(xs), k)]   # keeps every extreme

def hidden_spikes(xs, k, thr):
    means, ranges = bucket_mean(xs, k), bucket_minmax(xs, k)
    return sum(1 for m, (_, hi) in zip(means, ranges) if hi > thr >= m)   # spikes the mean plot hides`;

const ALIGN = `def cumulative_tokens(batches):
    out, total = [], 0
    for b in batches:
        total += b
        out.append(total)                                  # tokens seen after each logged step
    return out

def loss_at_tokens(tokens, losses, t):
    last = None
    for tok, loss in zip(tokens, losses):
        if tok <= t:
            last = loss                                    # the latest point not beyond t
    return last

def compare_at(tok_a, loss_a, tok_b, loss_b, t):
    return round(loss_at_tokens(tok_a, loss_a, t) - loss_at_tokens(tok_b, loss_b, t), 6)`;

export const lesson: LessonContent = {
  id: "e13.2.2",
  minutes: 40,
  links: {
    requires: ["e13.2.1"],
    revisits: ["l8.6.1", "e13.1.3"],
    foreshadows: ["e13.2.3"],
  },

  puzzle: (
    <>
      <p>
        An on-call engineer opens the run&apos;s dashboard and sees a smooth loss curve over three weeks. The run is in
        fact having a three-step loss spike every few thousand steps, each one a symptom of the instability that will end
        it a week later, and they are all in the logs. The dashboard hid them. How, and what should a dashboard for a
        large run show instead?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A screen is a few thousand pixels wide and a run has hundreds of thousands of steps, so every long plot is
        downsampled. Averaging each bucket of steps, the usual default, divides a short spike by the bucket size and
        hides it. Keeping each bucket&apos;s minimum and maximum keeps every extreme. A good dashboard also puts related
        signals on the same time axis, measured in tokens rather than steps when runs differ in batch size, and shows the
        handful of plots that answer &quot;is the run healthy?&quot; before anything else.
      </p>
      <DecimationViz />
    </>
  ),

  theory: (
    <>
      <Definition title="downsampling a series">
        <p>
          Split the series into buckets of k consecutive values. Mean decimation plots each bucket&apos;s average{" "}
          (<C>bucket_mean</C>); min-max decimation plots its smallest and largest values (<C>bucket_minmax</C>). Comparing
          the two counts the buckets whose extremes cross a threshold that their means do not (<C>hidden_spikes</C>).
          Algorithms such as largest-triangle-three-buckets choose one representative point per bucket to preserve the
          visual shape, a compromise between the two.
        </p>
        <Code>{DOWNSAMPLE}</Code>
      </Definition>

      <Theorem title="what each method preserves">
        <p>
          Min-max decimation preserves the maximum and minimum of every bucket, so every value above a threshold appears
          as a plotted value above it. Mean decimation of a bucket of k values at baseline b containing a spike of height h
          lasting d steps plots <M>{"b + hd/k"}</M>, so the spike shrinks by the factor d/k.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first claim is immediate: the plotted points of a bucket include its maximum, which is at least any value
          in it. For the second, the bucket sum is <M>{"kb + hd"}</M>, and dividing by k gives{" "}
          <M>{"b + hd/k"}</M>. Averaging also reduces independent noise of standard deviation σ to{" "}
          <M>{"\\sigma/\\sqrt{k}"}</M>, which is why mean plots look clean: they suppress noise by{" "}
          <M>{"\\sqrt k"}</M> but short events by k, so the longer the bucket the more completely brief events disappear
          relative to noise.
        </p>
      </Proof>

      <Definition title="aligning runs">
        <p>
          Runs with different batch sizes, or with a batch-size ramp, cannot be compared step by step. Convert each
          run&apos;s steps to cumulative tokens (<C>cumulative_tokens</C>), read each loss at a common token count, taking
          the last logged value not beyond it (<C>loss_at_tokens</C>), and compare there (<C>compare_at</C>). For restarts,
          plot all segments of a run on one axis, so a rollback shows as a visible overlap rather than a new run.
        </p>
        <Code>{ALIGN}</Code>
      </Definition>

      <Example title="a first screen">
        <p>
          One screen should answer whether the run is healthy: training loss and held-out loss against tokens with
          min-max decimation; gradient norm and clipping rate; update-to-weight ratios for a few layer groups; maximum
          attention logit; tokens per second and MFU; and a timeline of restarts and checkpoints. Everything else, per-layer
          histograms and per-rank timings, belongs on screens reached from this one. The loss plot needs a log or
          zoomable axis, since late-training improvements are small next to the early drop, as l8.6.1 noted.
        </p>
      </Example>

      <Remark title="dashboards for comparison">
        <p>
          Overlay the current run on the previous run and on the proxy runs of e13.1.3, aligned by tokens, so a deviation
          is visible as a gap between curves rather than as a number to remember. Use the same colours for the same runs
          across all panels. Annotate interventions such as learning-rate changes or data-mixture switches on every panel,
          since a change in one signal is easiest to explain when its cause is marked on the axis.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "shrink",
      rung: "check",
      prompt: (
        <p>
          A loss spike of height 2.0 lasts 3 steps. With mean decimation in buckets of 500 steps, how high above the
          baseline does it appear?
        </p>
      ),
      answer: { kind: "numeric", value: 0.012, tolerance: 0.0001 },
    },
    {
      key: "tokens",
      rung: "check",
      prompt: (
        <p>
          A run uses 1 million tokens per step for its first 1000 steps, 2 million for the next 1000, and 4 million
          afterwards. At which step does it reach 10 billion tokens?
        </p>
      ),
      answer: { kind: "numeric", value: 3750, tolerance: 0.001 },
    },
    {
      key: "axis",
      rung: "apply",
      prompt: <p>Why compare two runs with different batch sizes at equal tokens rather than equal steps?</p>,
      answer: {
        kind: "choice",
        options: [
          "At equal steps the run with larger batches has seen more data, so its lower loss says nothing about the recipe",
          "Steps are not logged by most frameworks",
          "Token counts are always smoother than step counts",
          "Loss is only defined per token",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def bucket_mean(xs, k):
    return [sum(xs[i:i + k]) / len(xs[i:i + k]) for i in range(0, len(xs), k)]

def bucket_minmax(xs, k):
    return [(min(xs[i:i + k]), max(xs[i:i + k])) for i in range(0, len(xs), k)]   # keeps every extreme

def hidden_spikes(xs, k, thr):
    means, ranges = bucket_mean(xs, k), bucket_minmax(xs, k)
    return sum(1 for m, (_, hi) in zip(means, ranges) if hi > thr >= m)   # spikes the mean plot hides

xs = [1, 1, 9, 1, 2, 2, 2, 8]
print(bucket_mean(xs, 4), bucket_minmax(xs, 4), hidden_spikes(xs, 4, 5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[3.0, 3.5] [(1, 9), (2, 8)] 2",
          "[3.0, 3.5] [(1, 9), (2, 8)] 0",
          "[3.0, 3.5] [(1, 9), (2, 8)] 1",
          "[1.0, 2.0] [(1, 9), (2, 8)] 2",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def cumulative_tokens(batches):
    out, total = [], 0
    for b in batches:
        total += b
        out.append(total)                                  # tokens seen after each logged step
    return out

def loss_at_tokens(tokens, losses, t):
    last = None
    for tok, loss in zip(tokens, losses):
        if tok <= t:
            last = loss                                    # the latest point not beyond t
    return last

def compare_at(tok_a, loss_a, tok_b, loss_b, t):
    return round(loss_at_tokens(tok_a, loss_a, t) - loss_at_tokens(tok_b, loss_b, t), 6)

print(cumulative_tokens([2, 2, 4]), loss_at_tokens([2, 4, 8], [3.0, 2.5, 2.0], 5))
print(compare_at([2, 4, 8], [3.0, 2.5, 2.0], [4, 8], [2.8, 2.4], 4), loss_at_tokens([2, 4], [3.0, 2.5], 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2, 4, 8] 2.5\n-0.3 None",
          "[2, 4, 8] 2.0\n-0.3 None",
          "[2, 2, 4] 2.5\n-0.3 None",
          "[2, 4, 8] 2.5\n0.3 3.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bucket_mean(xs, k)</C> and <C>bucket_minmax(xs, k)</C> over consecutive buckets of k values, the last
          possibly shorter, and <C>hidden_spikes(xs, k, thr)</C>, the number of buckets whose maximum exceeds thr while
          their mean does not.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def bucket_mean(xs, k):
    return xs[::k]

def bucket_minmax(xs, k):
    return [(x, x) for x in xs[::k]]

def hidden_spikes(xs, k, thr):
    return 0
`,
        solution: DOWNSAMPLE,
        tests: [
          { name: "buckets", code: `assert bucket_mean([1, 3, 5, 7, 9], 2) == [2.0, 6.0, 9.0] and bucket_minmax([4, 1, 7, 2, 5], 2) == [(1, 4), (2, 7), (5, 5)]` },
          { name: "hidden", code: `assert hidden_spikes([0, 0, 0, 10, 0, 0], 3, 4) == 1 and hidden_spikes([0, 10, 0, 10], 2, 4) == 0 and hidden_spikes([0, 10, 0, 10], 4, 5) == 1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cumulative_tokens(batches)</C>; <C>loss_at_tokens(tokens, losses, t)</C>, the loss at the last point
          with tokens at most t, or None; and <C>compare_at(tok_a, loss_a, tok_b, loss_b, t)</C>, run A minus run B
          rounded to six decimals.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def cumulative_tokens(batches):
    return list(batches)

def loss_at_tokens(tokens, losses, t):
    return losses[-1]

def compare_at(tok_a, loss_a, tok_b, loss_b, t):
    return 0.0
`,
        solution: ALIGN,
        tests: [
          { name: "cum", code: `assert cumulative_tokens([3, 1, 2]) == [3, 4, 6] and cumulative_tokens([]) == [] and loss_at_tokens([1, 5], [2.0, 1.0], 4) == 2.0 and loss_at_tokens([1, 5], [2.0, 1.0], 0) is None` },
          { name: "cmp", code: `assert compare_at([1, 2, 3], [3.0, 2.0, 1.5], [2, 4], [2.5, 1.2], 3) == -1.0 and compare_at([1], [1.25], [1], [1.0], 9) == 0.25` },
        ],
      },
    },
    {
      key: "visible",
      rung: "stretch",
      prompt: (
        <p>
          A spike of height 1 lasting 5 steps sits on a series whose step-to-step noise has standard deviation 0.05.
          Under mean decimation the spike stays visible if its plotted height exceeds three times the standard deviation
          of an averaged bucket. What is the largest bucket size k for which it stays visible?
        </p>
      ),
      answer: { kind: "numeric", value: 1111, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Nobody watches a dashboard for three months. The next lesson turns metrics into alerts that wake someone only
        when it matters.
      </p>
    </>
  ),
};
