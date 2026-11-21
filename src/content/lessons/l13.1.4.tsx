import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { StepLabelViz } from "@/components/viz/StepLabelViz";
import type { LessonContent } from "@/lib/types";

const LABELS = `def mc_value(outcomes):
    return sum(outcomes) / len(outcomes)                   # fraction of rollouts from this prefix that succeed

def hard_labels(values):
    return [1 if v > 0 else 0 for v in values]             # good if any rollout succeeded

def progress(values, v0):
    prev, out = v0, []
    for v in values:
        out.append(v - prev)                               # how much the step changed the chance of success
        prev = v
    return out`;

const SCORE = `import math

def agg(scores, how):
    if how == "min":
        return min(scores)
    if how == "prod":
        return math.prod(scores)
    return scores[-1]                                      # "last"

def best_of_n(cands, how):
    vals = [agg(s, how) for s in cands]
    return vals.index(max(vals))

def first_bad(scores, thr):
    return next((i for i, s in enumerate(scores) if s < thr), -1)`;

export const lesson: LessonContent = {
  id: "l13.1.4",
  minutes: 50,
  links: {
    requires: ["l13.1.3", "l9.7.1"],
    revisits: ["l9.3.3", "l9.6.3"],
    foreshadows: ["l13.1.5", "l13.4.3"],
  },

  puzzle: (
    <>
      <p>
        A model writes a twenty-step solution whose seventh step divides by a quantity that can be zero; the remaining
        thirteen steps are impeccable and the final answer happens to be right. A checker that looks only at the final
        answer rewards it. Another solution has one arithmetic slip in step nineteen and is marked wrong. To choose between
        solutions, or to guide a search through possible next steps, it would help to score each step. But who labels
        millions of steps, and what should a step&apos;s score even mean?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A natural meaning for a step&apos;s score is the chance that a good solver, continuing from that step, still reaches
        the right answer. A correct step keeps that chance high; a mistake makes it drop. The chance can be estimated without
        any human by letting the model itself finish the solution several times from each step and counting successes. The
        estimates are noisy, and when rollouts are few the label can land on the wrong step.
      </p>
      <StepLabelViz />
    </>
  ),

  theory: (
    <>
      <Definition title="outcome and process reward models">
        <p>
          An outcome reward model scores a whole solution by the probability that its final answer is right, trained on
          answer correctness. A process reward model (PRM) scores each step. To rank solutions, the step scores are
          aggregated, usually by their minimum or product, sometimes by the last step&apos;s score (<C>agg</C>), and best-of-n
          keeps the highest (<C>best_of_n</C>). Lightman et al. collected 800,000 human labels on steps of model-written
          solutions to competition problems; reranking 1,860 samples per problem, their PRM solved 78% of a test set against
          72% for an outcome model and 70% for majority voting.
        </p>
        <Code>{SCORE}</Code>
      </Definition>

      <Definition title="Monte Carlo step labels">
        <p>
          Math-Shepherd removed the human labels. From the prefix ending at step t, sample n completions with a solver and
          check their final answers; the fraction correct estimates the prefix&apos;s value (<C>mc_value</C>). A hard label
          marks the step good if any completion succeeded (<C>hard_labels</C>); a soft label keeps the fraction. A PRM trained
          on these labels predicts the value of a prefix directly, with no rollouts at use time.
        </p>
      </Definition>

      <Theorem title="what the labels estimate">
        <p>
          Let <M>{"V(s_t)"}</M> be the probability that the solver, continuing from prefix <M>{"s_t"}</M>, reaches a correct
          answer. The Monte Carlo label from n independent rollouts is unbiased for <M>{"V(s_t)"}</M> with variance{" "}
          <M>{"V(1-V)/n"}</M>. If the step <M>{"a_t"}</M> is itself drawn from the same solver, then
        </p>
        <MD>{"V(s_t) = \\mathbb{E}_{a_t}\\big[V(s_t a_t)\\big],"}</MD>
        <p>so the expected change in value from one of the solver&apos;s own steps is zero.</p>
      </Theorem>
      <Proof>
        <p>
          Each rollout succeeds independently with probability <M>{"V(s_t)"}</M>, so the number of successes is binomial and
          the fraction has mean V and variance <M>{"V(1-V)/n"}</M>. For the second claim, a rollout from <M>{"s_t"}</M> first
          draws <M>{"a_t"}</M> from the solver and then continues from <M>{"s_t a_t"}</M>; conditioning on <M>{"a_t"}</M> and
          applying the tower property gives the identity. The values along a chain therefore form a martingale under the
          solver, and a step&apos;s progress <M>{"V(s_t a_t) - V(s_t)"}</M> (<C>progress</C>) is an advantage in the sense of
          reinforcement learning: it says whether the step did better or worse than the solver typically does from there.
        </p>
        <Code>{LABELS}</Code>
      </Proof>

      <Remark title="noise and the location of errors">
        <p>
          A step after which success is rare but possible, say V = 0.05, gets a hard label of zero from 8 rollouts with
          probability <M>{"0.95^8 \\approx 0.66"}</M>, and a mistake that leaves a little chance is often blamed on a later
          step. More rollouts cost more compute per label; labelling only the steps near the first estimated drop, by binary
          search, saves most of it. Values also depend on the solver: a step that a strong solver can recover from may be
          fatal for a weak one, so progress measured under a somewhat different solver from the policy being trained can be
          more informative than its own values.
        </p>
      </Remark>

      <Example title="using a PRM">
        <p>
          At test time a PRM reranks samples, flags the first suspicious step (<C>first_bad</C>) so the model can revise from
          there, or scores partial solutions to steer a search, as the next lesson shows. In training, it can give dense
          rewards for reinforcement learning. DeepSeek-R1 chose not to, reporting that a neural reward model invited reward
          hacking at scale and that defining and labelling steps was hard; outcome rewards from verifiable answers were
          simpler and sufficed. PRMs are therefore used more as judges at inference than as training rewards.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "se",
      rung: "check",
      prompt: (
        <p>
          A prefix has true value 0.25. What is the standard error of its Monte Carlo label from 16 rollouts?
        </p>
      ),
      answer: { kind: "numeric", value: 0.1083, tolerance: 0.001 },
    },
    {
      key: "miss",
      rung: "check",
      prompt: (
        <p>
          A correct step leaves a value of 0.05. With 8 rollouts, what is the probability that its hard label wrongly says
          the step is bad?
        </p>
      ),
      answer: { kind: "numeric", value: 0.6634, tolerance: 0.001 },
    },
    {
      key: "martingale",
      rung: "apply",
      prompt: <p>Why is the expected progress of a step zero when the step comes from the same solver used for the rollouts?</p>,
      answer: {
        kind: "choice",
        options: [
          "A rollout from the prefix already draws its next step from that solver, so averaging the next prefix's value over the step gives back the prefix's value",
          "Because rewards are only given at the end",
          "Because Monte Carlo estimates are unbiased",
          "Because correct and incorrect steps are equally likely",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def mc_value(outcomes):
    return sum(outcomes) / len(outcomes)                   # fraction of rollouts from this prefix that succeed

def hard_labels(values):
    return [1 if v > 0 else 0 for v in values]             # good if any rollout succeeded

def progress(values, v0):
    prev, out = v0, []
    for v in values:
        out.append(v - prev)                               # how much the step changed the chance of success
        prev = v
    return out

v = [mc_value(o) for o in [[1, 1, 0, 1], [1, 0, 0, 0], [0, 0, 0, 0]]]; print(v, hard_labels(v))
print(progress(v, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.75, 0.25, 0.0] [1, 1, 0]\n[0.25, -0.5, -0.25]",
          "[0.75, 0.25, 0.0] [1, 0, 0]\n[0.25, -0.5, -0.25]",
          "[0.75, 0.25, 0.0] [1, 1, 0]\n[0.75, 0.25, 0.0]",
          "[0.75, 0.25, 0.0] [1, 1, 0]\n[-0.25, 0.5, 0.25]",
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

def agg(scores, how):
    if how == "min":
        return min(scores)
    if how == "prod":
        return math.prod(scores)
    return scores[-1]                                      # "last"

def best_of_n(cands, how):
    vals = [agg(s, how) for s in cands]
    return vals.index(max(vals))

def first_bad(scores, thr):
    return next((i for i, s in enumerate(scores) if s < thr), -1)

c = [[0.9, 0.95, 0.4], [0.6, 0.6, 0.6]]; print([round(agg(s, "prod"), 3) for s in c], best_of_n(c, "prod"), best_of_n(c, "min"))
print(first_bad([0.9, 0.8, 0.3, 0.9], 0.5), first_bad([0.9], 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.342, 0.216] 0 1\n2 -1",
          "[0.342, 0.216] 0 0\n2 -1",
          "[0.342, 0.216] 1 1\n2 -1",
          "[0.342, 0.216] 0 1\n3 -1",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mc_value(outcomes)</C> for a list of 0/1 rollout results, <C>hard_labels(values)</C>, and{" "}
          <C>progress(values, v0)</C>, the change in value at each step starting from the value v0 of the empty prefix.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def mc_value(outcomes):
    return outcomes[0]

def hard_labels(values):
    return [1] * len(values)

def progress(values, v0):
    return values
`,
        solution: LABELS,
        tests: [
          { name: "mc", code: `assert mc_value([1, 0]) == 0.5 and hard_labels([0.0, 0.3]) == [0, 1]` },
          { name: "prog", code: `assert progress([0.25, 0.75], 0.5) == [-0.25, 0.5]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>agg(scores, how)</C> for &quot;min&quot;, &quot;prod&quot; and &quot;last&quot;,{" "}
          <C>best_of_n(cands, how)</C> returning the index of the best candidate (the first on ties), and{" "}
          <C>first_bad(scores, thr)</C>, the first index scoring below thr, or -1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def agg(scores, how):
    return scores[-1]

def best_of_n(cands, how):
    return 0

def first_bad(scores, thr):
    return -1
`,
        solution: SCORE,
        tests: [
          { name: "agg", code: `assert agg([0.5, 0.2, 0.8], "min") == 0.2 and agg([0.5, 0.5], "prod") == 0.25 and agg([0.1, 0.9], "last") == 0.9` },
          { name: "pick", code: `assert best_of_n([[0.9, 0.1], [0.5, 0.5]], "min") == 1 and first_bad([0.6, 0.4], 0.5) == 1` },
        ],
      },
    },
    {
      key: "rollouts",
      rung: "stretch",
      prompt: (
        <p>
          How many rollouts are needed so that a step with value 0.1 receives a good hard label with probability at least
          0.95?
        </p>
      ),
      answer: { kind: "numeric", value: 29, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        A step scorer can do more than rank finished solutions. It can prune partial ones early and spend the saved compute
        expanding the promising branches, turning sampling into search.
      </p>
    </>
  ),
};
