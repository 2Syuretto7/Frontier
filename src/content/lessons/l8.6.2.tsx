import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RollbackViz } from "@/components/viz/RollbackViz";
import type { LessonContent } from "@/lib/types";

const DETECT = `import math

def spike_steps(losses, window, k):
    out = []
    for i in range(window, len(losses)):
        prev = losses[i - window:i]
        mu = sum(prev) / window
        sd = math.sqrt(sum((x - mu) ** 2 for x in prev) / window)
        if losses[i] > mu + k * sd:
            out.append(i)
    return out

def rollback_point(checkpoints, spike, margin):
    ok = [c for c in checkpoints if c <= spike - margin]
    return max(ok) if ok else -1

def data_order(restart, n_skip, n):
    return list(range(restart + n_skip, restart + n_skip + n))`;

const COST = `import math

def norm_ratio(norms, window):
    recent = sum(norms[-window:]) / window
    before = sum(norms[-2 * window:-window]) / window
    return recent / before

def wasted_steps(events):
    return sum(spike - restart for spike, restart in events)

def goodput(final_step, events):
    return final_step / (final_step + wasted_steps(events))`;

export const lesson: LessonContent = {
  id: "l8.6.2",
  minutes: 50,
  links: {
    requires: ["l8.6.1", "m14.6.2", "m14.6.3"],
    revisits: ["m14.6.1", "l8.2.3", "e6.3.3"],
    foreshadows: ["l8.6.3", "e10.8.1", "e13.4.2"],
  },

  puzzle: (
    <>
      <p>
        The PaLM report describes about twenty loss spikes during its largest run, despite gradient clipping. When the team
        replayed the exact batches that preceded a spike, starting from an earlier state of the model, the spike did not occur.
        So the cause was neither the data alone nor the model alone. What should a team running a months-long job do when
        the loss jumps, and what can it change so that it jumps less often?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The mechanics of a spike were the subject of m14.6.2 and m14.6.3: Adam&apos;s second-moment estimate lags behind a sudden
        rise in gradient size, so the update grows far beyond its usual scale, and logits can drift until a softmax saturates.
        At scale the question is operational. A spike is detected against the recent noise level, the run is rolled back to a
        checkpoint taken before the trouble, the data that came next is skipped, and training continues. Every rollback costs
        the steps that are recomputed, so detection speed and checkpoint spacing both matter.
      </p>
      <RollbackViz />
    </>
  ),

  theory: (
    <>
      <Definition title="detecting a spike and planning a restart">
        <p>
          A step is a spike if its loss exceeds the mean of the previous w losses by more than k of their standard deviations
          (<C>spike_steps</C>); the same test is applied to the gradient norm, which often moves first. The restart point is the
          latest checkpoint at least m steps before the spike, so that it predates whatever state led to it (<C>rollback_point</C>).
          PaLM restarted about 100 steps before each spike and skipped 200 to 500 batches (<C>data_order</C>).
        </p>
        <Code>{DETECT}</Code>
      </Definition>

      <Theorem title="the expected cost of a rollback">
        <p>
          Let checkpoints be taken every c steps and the run restart from the latest checkpoint at or before the spike step minus
          m. If the spike step is uniformly placed relative to the checkpoint grid, the expected number of recomputed steps is{" "}
          <M>{"m + c/2"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"t - m = jc + u"}</M> with j an integer and u in <M>{"[0, c)"}</M>. The restart is at <M>{"jc"}</M>, so the steps recomputed
          are <M>{"t - jc = m + u"}</M>. By assumption u is uniform on <M>{"[0, c)"}</M>, with mean <M>{"c/2"}</M>, so the expectation is{" "}
          <M>{"m + c/2"}</M>.
        </p>
      </Proof>

      <Definition title="slow divergence and goodput">
        <p>
          Not every failure is sudden. A slow divergence shows as a gradient norm that keeps rising over thousands of steps,
          measured by the ratio of its recent mean to the mean before (<C>norm_ratio</C>), with the loss flattening and then
          creeping up. The cost of all interventions is summarised by goodput: the fraction of executed steps that survive into
          the final model (<C>wasted_steps</C>, <C>goodput</C>).
        </p>
        <Code>{COST}</Code>
      </Definition>

      <Remark title="why skipping data works">
        <p>
          A spike needs both a vulnerable state, such as a direction with a stale second moment or an attention logit near
          saturation, and a batch that pushes on it. Rolling back changes neither on its own, since the replayed state is close to
          the one that failed, but skipping the next few hundred batches changes the sequence of pushes so the vulnerable state
          is not triggered in the same way. It is a workaround, not a cure, and teams that see repeated spikes change the recipe.
        </p>
      </Remark>

      <Example title="changes that made spikes rarer">
        <p>
          The OPT-175B logbook records dozens of manual restarts, learning-rate cuts and changes of optimiser settings over two
          months. Later open runs report prevention instead. OLMo 2 combined QK-norm (l8.2.3), z-loss (m14.6.3), norms after
          rather than before each sublayer&apos;s output, no weight decay on embeddings and an initialisation scaled for depth, and
          also filtered documents with long runs of repeated n-grams, which it linked to spikes. Gradient clipping (m14.6.1)
          remains standard but cannot stop Adam&apos;s update from growing when the gradient grows faster than its second moment.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "recompute",
      rung: "check",
      prompt: (
        <p>
          Checkpoints are saved every 250 steps. A spike is detected at step 14,180, and the run restarts from the latest checkpoint
          at least 100 steps earlier. How many steps are recomputed to get back to step 14,180?
        </p>
      ),
      answer: { kind: "numeric", value: 180, tolerance: 0.5 },
    },
    {
      key: "goodput",
      rung: "check",
      prompt: <p>A run reaches step 100,000 after 12 rollbacks that each recomputed 350 steps. What is its goodput? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.9597, tolerance: 0.0002 },
    },
    {
      key: "replay",
      rung: "apply",
      prompt: <p>The PaLM team replayed the batches that preceded a spike from an earlier checkpoint, and no spike occurred. What does this suggest?</p>,
      answer: {
        kind: "choice",
        options: [
          "Spikes come from an interaction between particular batches and a particular model state, so neither removing those batches nor changing the state alone explains them",
          "The batches before the spike were corrupted",
          "Spikes are caused only by hardware faults",
          "The learning rate was too low before the spike",
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

def spike_steps(losses, window, k):
    out = []
    for i in range(window, len(losses)):
        prev = losses[i - window:i]
        mu = sum(prev) / window
        sd = math.sqrt(sum((x - mu) ** 2 for x in prev) / window)
        if losses[i] > mu + k * sd:
            out.append(i)
    return out

def rollback_point(checkpoints, spike, margin):
    ok = [c for c in checkpoints if c <= spike - margin]
    return max(ok) if ok else -1

def data_order(restart, n_skip, n):
    return list(range(restart + n_skip, restart + n_skip + n))

print(spike_steps([1.0, 1.0, 1.0, 1.0, 3.0, 1.0], 2, 3.0), spike_steps([1.0, 2.0, 1.0, 2.0, 2.4], 4, 1.5))
print(rollback_point([0, 100, 200, 300], 250, 60), rollback_point([500], 520, 50), data_order(200, 3, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[4] [4]\n100 -1 [203, 204]",
          "[4] []\n100 -1 [203, 204]",
          "[4, 5] [4]\n200 500 [203, 204]",
          "[4] [4]\n100 -1 [200, 201]",
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

def norm_ratio(norms, window):
    recent = sum(norms[-window:]) / window
    before = sum(norms[-2 * window:-window]) / window
    return recent / before

def wasted_steps(events):
    return sum(spike - restart for spike, restart in events)

def goodput(final_step, events):
    return final_step / (final_step + wasted_steps(events))

print(norm_ratio([1.0, 1.0, 2.0, 4.0], 2), wasted_steps([(130, 100), (420, 400)]))
print(goodput(950, [(130, 100), (420, 400)]), goodput(10, []))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3.0 50\n0.95 1.0",
          "3.0 -50\n0.95 1.0",
          "2.0 50\n0.95 1.0",
          "3.0 50\n0.05 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>spike_steps(losses, window, k)</C> using the population standard deviation, <C>rollback_point(checkpoints, spike, margin)</C>{" "}
          returning -1 if no checkpoint qualifies, and <C>data_order(restart, n_skip, n)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def spike_steps(losses, window, k):
    return [i for i in range(1, len(losses)) if losses[i] > losses[i - 1]]

def rollback_point(checkpoints, spike, margin):
    return max(checkpoints)

def data_order(restart, n_skip, n):
    return list(range(restart, restart + n))
`,
        solution: DETECT,
        tests: [
          { name: "spikes", code: `assert spike_steps([2.0, 2.2, 2.0, 2.2, 2.1, 2.2, 3.0], 4, 2.0) == [6]\nassert spike_steps([1.0, 1.2, 1.0, 1.2], 2, 1.5) == []` },
          { name: "restart", code: `assert rollback_point([0, 400, 800, 1200], 1250, 100) == 800 and rollback_point([300], 320, 30) == -1 and data_order(800, 300, 3) == [1100, 1101, 1102]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>norm_ratio(norms, window)</C>, <C>wasted_steps(events)</C> for a list of (spike, restart) pairs and{" "}
          <C>goodput(final_step, events)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def norm_ratio(norms, window):
    return norms[-1] / norms[0]

def wasted_steps(events):
    return len(events)

def goodput(final_step, events):
    return 1.0
`,
        solution: COST,
        tests: [
          { name: "ratio", code: `assert abs(norm_ratio([9.0, 1.0, 1.0, 2.0, 2.0, 3.0, 3.0], 3) - 8 / 4) < 1e-12 and wasted_steps([(1000, 750), (2100, 2000), (5000, 4990)]) == 360` },
          { name: "goodput", code: `assert abs(goodput(640, [(300, 200), (700, 640)]) - 0.8) < 1e-12 and goodput(5, []) == 1.0` },
        ],
      },
    },
    {
      key: "interval",
      rung: "stretch",
      prompt: (
        <p>
          Spikes occur at a rate of one per 10,000 steps, each rollback recomputes m + c/2 steps on average, and saving a checkpoint
          costs as much time as 20 training steps. Which checkpoint interval c minimises the expected overhead per training step?
          Give the nearest whole number of steps.
        </p>
      ),
      answer: { kind: "numeric", value: 632, tolerance: 1 },
    },
  ],

  glimpse: (
    <>
      <p>
        A smooth loss is not the only thing people watch. The next lesson turns to downstream abilities that seem to appear
        suddenly at some scale, and asks whether the jump is in the model or in the way it is measured.
      </p>
    </>
  ),
};
