import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AsyncPipelineViz } from "@/components/viz/AsyncPipelineViz";
import type { LessonContent } from "@/lib/types";

const PIPE = `def sync_iter(gen, train, sync):
    return gen + sync + train                        # each side waits for the other

def async_iter(gen, train, sync):
    return max(gen, train + sync)                    # the generator samples with the previous weights meanwhile

def staleness(versions, current):
    return [current - v for v in versions]           # updates made since each sample's policy`;

const CORRECT = `import numpy as np

def importance_weights(logp_new, logp_old, clip):
    return np.minimum(np.exp(logp_new - logp_old), clip)    # truncated: bounded weights, slight bias

def effective_sample_size(w):
    return w.sum() ** 2 / (w ** 2).sum()

def clipped_objective(ratio, adv, eps):
    return float(np.mean(np.minimum(ratio * adv, np.clip(ratio, 1 - eps, 1 + eps) * adv)))`;

export const lesson: LessonContent = {
  id: "e12.6.3",
  minutes: 50,
  links: {
    requires: ["e12.6.2", "l6.7.3"],
    revisits: ["m13.1.3", "e12.6.1"],
    foreshadows: ["e12.6.4"],
  },

  puzzle: (
    <>
      <p>
        In a synchronous RL loop the generator takes 90 seconds per batch, the trainer 40, and the weight sync 5, and each waits for the
        other. Overlapping them, so the generator samples the next batch while the trainer learns from the last, cuts the step to 90
        seconds. But now each batch comes from a policy one update old. Training is stable with one step of lag; with four, a team sees
        rewards collapse. Separately, even the synchronous loop shows the ratio of trainer to generator probabilities drifting far from
        one on some tokens. How should training account for samples that come from a slightly different policy?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Asynchronous RL decouples generation from training: generators keep sampling with whatever weights they have, and the trainer
        learns from a buffer of recent samples. Throughput approaches that of the slower side alone, rather than the sum of both. The
        cost is that samples come from a behaviour policy μ that lags the policy π being trained. The policy gradient is an expectation
        under π, so samples from μ need importance weights <M>{"\\pi/\\mu"}</M> (m13.1.3). Weights far from one make the estimate noisy,
        so they are truncated or the update is clipped as in PPO (l6.7.3), and the lag is kept small. Even without lag, the generator&apos;s
        kernels and precision differ from the trainer&apos;s, so μ and π differ a little on every token, and the same correction helps.
      </p>
      <AsyncPipelineViz />
    </>
  ),

  theory: (
    <>
      <Definition title="overlapping generation and training">
        <p>
          <C>sync_iter</C> is the time per step when generation, sync and training run in turn. <C>async_iter</C> is the steady-state
          time when the generator samples the next batch with the previous weights while the trainer trains and syncs. <C>staleness</C>{" "}
          gives, for samples drawn with policy versions <C>versions</C>, how many updates the trainer at version <C>current</C> has made
          since.
        </p>
        <Code>{PIPE}</Code>
      </Definition>

      <Theorem title="overlap at most halves the step">
        <p>
          For non-negative times g, t and s,{" "}
          <M>{"\\max(g, t+s) \\le g + t + s \\le 2\\max(g, t+s)"}</M>, so one step of overlap speeds training up by a factor between 1
          and 2, reaching 2 when <M>{"g = t + s"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Both g and <M>{"t+s"}</M> are at most their maximum m, so their sum is at most 2m; and the sum is at least each term, hence at
          least m. Equality on the right needs both terms equal to m. More lag does not raise the bound: once the slower side is busy all
          the time, extra lag only makes samples staler, as in the visualisation.
        </p>
      </Proof>

      <Definition title="correcting for the behaviour policy">
        <p>
          <C>importance_weights</C> returns <M>{"\\min(\\pi/\\mu, c)"}</M> per token from the log probabilities of the current and the
          behaviour policy. <C>effective_sample_size</C> measures how many equally weighted samples a weighted batch is worth.{" "}
          <C>clipped_objective</C> is PPO&apos;s clipped surrogate for ratios <C>ratio</C> and advantages <C>adv</C>.
        </p>
        <Code>{CORRECT}</Code>
      </Definition>

      <Theorem title="importance weights and their cost">
        <p>
          If μ is positive wherever π is, then <M>{"\\mathbb{E}_{x \\sim \\mu}[(\\pi(x)/\\mu(x)) f(x)] = \\mathbb{E}_{x \\sim \\pi}[f(x)]"}</M>.
          For n samples with weights <M>{"w_i \\ge 0"}</M>, not all zero, the effective sample size{" "}
          <M>{"(\\sum_i w_i)^2 / \\sum_i w_i^2"}</M> lies between 1 and n, and equals n exactly when all weights are equal.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\sum_x \\mu(x) \\frac{\\pi(x)}{\\mu(x)} f(x) = \\sum_x \\pi(x) f(x)"}</M>. By the Cauchy–Schwarz inequality,{" "}
          <M>{"(\\sum_i w_i \\cdot 1)^2 \\le n \\sum_i w_i^2"}</M>, with equality when the weights are proportional to the ones vector;
          and <M>{"(\\sum_i w_i)^2 \\ge \\sum_i w_i^2"}</M> since the cross terms are non-negative, with equality when one weight carries
          everything. As μ drifts from π the weights spread out and the effective batch shrinks; truncating at c bounds every weight,
          trading a little bias for much lower variance.
        </p>
      </Proof>

      <Remark title="asynchronous RL in practice">
        <p>
          IMPALA introduced truncated importance weights (V-trace) for actors running behind a learner. For language models, systems such
          as AReaL, PipelineRL and others run generators continuously and update their weights between or even during responses, keeping
          the lag to one or a few versions; partial rollouts (e12.6.1) mix versions within a single response, which per-token weights handle
          naturally. Truncated importance sampling on the generator&apos;s own log probabilities corrects for kernel and precision
          differences even in synchronous training. The ratio in PPO&apos;s clipped objective is computed against the behaviour
          policy&apos;s log probabilities, recorded by the generator as it samples.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Overlap hid training and the sync behind generation. With one step of lag, π and μ stay close and clipped, truncated
          importance weights keep the gradient nearly unbiased with a small loss of effective batch. With four, the weights spread out,
          many tokens are clipped or dominate the batch, and training becomes unstable. The drifting ratios in synchronous training came
          from numerical differences between the engines, which the same correction absorbs.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "speedup",
      rung: "check",
      prompt: (
        <p>
          Generation takes 80 s, training 50 s and the weight sync 10 s. By what factor does one step of overlap speed up each step?
        </p>
      ),
      answer: { kind: "numeric", value: 1.75, tolerance: 0.001 },
    },
    {
      key: "ess",
      rung: "check",
      prompt: (
        <p>
          A batch of four tokens has importance weights 1, 1, 1 and 4. What is its effective sample size? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.58, tolerance: 0.005 },
    },
    {
      key: "lag",
      rung: "apply",
      prompt: <p>Why do asynchronous RL systems usually cap the lag between generator and trainer at one or a few versions?</p>,
      answer: {
        kind: "choice",
        options: [
          "Once the slower side is always busy, more lag adds no speed but makes the behaviour policy differ more, spreading importance weights and adding variance or bias",
          "The generator cannot store more than one set of weights",
          "Importance weights are exactly one when the lag is at most one",
          "Weight syncs fail when the lag exceeds one version",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def sync_iter(gen, train, sync):
    return gen + sync + train                        # each side waits for the other

def async_iter(gen, train, sync):
    return max(gen, train + sync)                    # the generator samples with the previous weights meanwhile

def staleness(versions, current):
    return [current - v for v in versions]           # updates made since each sample's policy

v = [3, 4, 4, 5]
print(sync_iter(60, 30, 5), async_iter(60, 30, 5), async_iter(20, 30, 5), staleness(v, 5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["95 60 35 [2, 1, 1, 0]", "95 60 30 [2, 1, 1, 0]", "95 65 35 [2, 1, 1, 0]", "90 60 35 [3, 4, 4, 5]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def importance_weights(logp_new, logp_old, clip):
    return np.minimum(np.exp(logp_new - logp_old), clip)    # truncated: bounded weights, slight bias

def effective_sample_size(w):
    return w.sum() ** 2 / (w ** 2).sum()

def clipped_objective(ratio, adv, eps):
    return float(np.mean(np.minimum(ratio * adv, np.clip(ratio, 1 - eps, 1 + eps) * adv)))

w = importance_weights(np.log([0.5, 0.2, 0.9]), np.log([0.25, 0.4, 0.3]), 2.5)
print(np.round(w, 2).tolist(), round(effective_sample_size(w), 2), round(clipped_objective(np.array([1.5, 0.5]), np.array([1.0, -1.0]), 0.2), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.0, 0.5, 2.5] 2.38 0.2",
          "[2.0, 0.5, 3.0] 2.25 0.2",
          "[2.0, 0.5, 2.5] 2.38 0.5",
          "[0.5, 2.0, 0.33] 2.38 0.2",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sync_iter(gen, train, sync)</C>, <C>async_iter(gen, train, sync)</C> and <C>staleness(versions, current)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def sync_iter(gen, train, sync):
    return gen + train

def async_iter(gen, train, sync):
    return gen

def staleness(versions, current):
    return [0 for v in versions]
`,
        solution: PIPE,
        tests: [
          { name: "times", code: `assert sync_iter(3, 4, 1) == 8 and async_iter(3, 4, 1) == 5 and async_iter(9, 4, 1) == 9` },
          { name: "stale", code: `assert staleness([7, 9, 10], 10) == [3, 1, 0] and staleness([], 4) == []` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>importance_weights(logp_new, logp_old, clip)</C>, <C>effective_sample_size(w)</C> and{" "}
          <C>clipped_objective(ratio, adv, eps)</C>, returning a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def importance_weights(logp_new, logp_old, clip):
    return np.exp(logp_new - logp_old)

def effective_sample_size(w):
    return float(len(w))

def clipped_objective(ratio, adv, eps):
    return float(np.mean(ratio * adv))
`,
        solution: CORRECT,
        tests: [
          { name: "weights", code: `w = importance_weights(np.log(np.array([0.6, 0.1])), np.log(np.array([0.1, 0.2])), 3.0)\nassert np.allclose(w, [3.0, 0.5])\nassert abs(effective_sample_size(np.array([2.0, 2.0, 0.0])) - 2.0) < 1e-12` },
          { name: "clip", code: `assert abs(clipped_objective(np.array([2.0, 0.5, 1.0]), np.array([1.0, 1.0, -2.0]), 0.25) - (1.25 + 0.5 - 2.0) / 3) < 1e-12` },
        ],
      },
    },
    {
      key: "half",
      rung: "stretch",
      prompt: (
        <p>
          In a large batch, half the tokens have importance weight 2 and half have weight 0.5. What fraction of the batch size is its
          effective sample size? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.74, tolerance: 0.005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Rewards so far came from a checker of final answers. Agents that write and run code, browse or use tools need environments that
        execute untrusted actions safely, thousands at a time. The last lesson builds those sandboxes.
      </p>
    </>
  ),
};
