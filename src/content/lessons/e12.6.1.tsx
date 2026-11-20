import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RolloutStragglerViz } from "@/components/viz/RolloutStragglerViz";
import type { LessonContent } from "@/lib/types";

const GROUPS = `import numpy as np

def group_advantages(rewards):
    r = np.asarray(rewards, dtype=float)                 # one row of G samples per prompt
    mean = r.mean(axis=1, keepdims=True)
    std = r.std(axis=1, keepdims=True)
    return (r - mean) / (std + 1e-6)                     # each sample judged against its own group

def informative(rewards):
    r = np.asarray(rewards, dtype=float)
    return r.max(axis=1) > r.min(axis=1)                 # equal rewards give zero advantages and no gradient

def signal_prob(p, G):
    return 1 - p ** G - (1 - p) ** G                     # pass/fail rewards that are not all equal`;

const ROUNDS = `def sync_utilisation(lengths):
    return sum(lengths) / (len(lengths) * max(lengths))  # every slot is held until the longest finishes

def first_k_done(lengths, k):
    return sorted(lengths)[k - 1]                        # steps until k responses have finished

def partial_rollout(lengths, budget):
    done = [n for n in lengths if n <= budget]
    carried = [n - budget for n in lengths if n > budget]   # resumed in the next round
    return done, carried`;

export const lesson: LessonContent = {
  id: "e12.6.1",
  minutes: 50,
  links: {
    requires: ["l9.7.2", "e12.5.1"],
    revisits: ["e12.2.1", "e11.7.2"],
    foreshadows: ["e12.6.2"],
  },

  puzzle: (
    <>
      <p>
        A team trains a reasoning model with GRPO (l9.7.2) on maths problems with checkable answers. Each step samples eight responses
        for each of 512 prompts, scores them, and updates the policy. Profiling shows the GPUs spend over three quarters of each step
        generating, and during much of that most sequences have already finished. Worse, as the model improves, the gradient from each
        step gets weaker even though the batch is the same size. What is wasting the generation time, and why does the signal fade?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In reinforcement learning for language models, the policy writes its own training data, so generation is usually most of the
        cost, and it runs on an inference engine. Two effects dominate at scale. Response lengths are heavy-tailed: a few responses run
        to thousands of tokens while most stop early. If a round waits for all of them, the longest sets its length and the other slots
        sit idle. And group-relative methods learn only from groups whose rewards differ: if all eight responses to a prompt are right,
        or all wrong, every advantage is zero and the prompt is wasted generation. As the model improves, more groups are all right.
        Rollout systems therefore cut rounds short, carry long responses over, and choose or filter prompts to keep groups
        informative.
      </p>
      <RolloutStragglerViz />
    </>
  ),

  theory: (
    <>
      <Definition title="groups and their signal">
        <p>
          <C>rewards</C> has one row per prompt and one column per sample. <C>group_advantages</C> standardises each row, as in GRPO;{" "}
          <C>informative</C> marks the rows whose rewards are not all equal; <C>signal_prob</C> is the chance that a group of G pass/fail
          rewards is informative when each sample passes independently with probability p.
        </p>
        <Code>{GROUPS}</Code>
      </Definition>

      <Theorem title="where the signal is">
        <p>
          For pass/fail rewards, the probability that a group of G samples is informative is <M>{"1 - p^G - (1-p)^G"}</M>. For fixed{" "}
          <M>{"G \\ge 2"}</M> it is largest at <M>{"p = 1/2"}</M>, is symmetric about it, and tends to 0 as p tends to 0 or 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          A group gives no signal exactly when all samples pass, with probability <M>{"p^G"}</M>, or all fail, with probability{" "}
          <M>{"(1-p)^G"}</M>; these are disjoint. Let <M>{"f(p) = p^G + (1-p)^G"}</M>. It is unchanged by <M>{"p \\mapsto 1-p"}</M> and
          convex for <M>{"G \\ge 2"}</M>, so a symmetric convex function is smallest at <M>{"p = 1/2"}</M>; hence <M>{"1 - f"}</M> is
          largest there. At <M>{"p = 0"}</M> or 1, <M>{"f = 1"}</M>. So prompts the model always solves, or never solves, cost
          generation and teach nothing, and the useful batch shrinks as accuracy rises.
        </p>
      </Proof>

      <Definition title="ending a round">
        <p>
          A round generates responses in parallel slots. <C>sync_utilisation</C> is the fraction of slot time used if every slot is held
          until the longest response ends. <C>first_k_done</C> is how many decode steps pass before k responses have finished, which is
          how long a round lasts if it starts more prompts than it needs and keeps the first k. <C>partial_rollout</C> stops a round
          after <C>budget</C> tokens, returning the finished lengths and the tokens still owed by the rest, which resume in the next
          round.
        </p>
        <Code>{ROUNDS}</Code>
      </Definition>

      <Theorem title="the cost of waiting for the longest">
        <p>
          If n slots each generate one response with lengths <M>{"\\ell_1, \\dots, \\ell_n"}</M> and the round lasts until all finish,
          the fraction of slot time used is <M>{"\\bar\\ell / \\max_i \\ell_i"}</M>, where <M>{"\\bar\\ell"}</M> is the mean length.
        </p>
      </Theorem>
      <Proof>
        <p>
          Slot i does useful work for <M>{"\\ell_i"}</M> steps and the round has <M>{"\\max_i \\ell_i"}</M> steps, so the used fraction
          is <M>{"\\sum_i \\ell_i / (n \\max_i \\ell_i) = \\bar\\ell / \\max_i \\ell_i"}</M>. With heavy-tailed lengths the maximum of
          many samples grows far faster than the mean, so larger batches are used less efficiently. A decode step also costs less when
          fewer sequences remain, which softens but does not remove this, since the weights are still read every step (e12.1.1).
        </p>
      </Proof>

      <Remark title="rollouts in practice">
        <p>
          Generation runs on inference engines such as vLLM or SGLang with continuous batching (e12.2.1), and frameworks such as
          OpenRLHF, veRL and others arrange them alongside the trainer. DAPO&apos;s dynamic sampling drops groups with equal rewards and
          samples more prompts to refill the batch; curricula pick prompts the model solves sometimes but not always, as in filtering by
          verification (e11.7.2). Kimi k1.5 and others use partial rollouts with a token budget per round, which leaves some responses
          generated by more than one version of the policy, a mismatch the next two lessons deal with.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The idle generation time was stragglers: each round waited for its longest responses while most slots were empty. A token budget
          with carried-over responses, or oversampling and keeping those that finish first, recovers most of it. The fading signal came
          from groups whose eight samples were all correct, which give zero advantages; filtering them, or choosing harder prompts, keeps
          the effective batch full.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "signal",
      rung: "check",
      prompt: (
        <p>
          A model solves a problem with probability 0.9, and GRPO samples 8 responses. What is the probability that the group is
          informative? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.57, tolerance: 0.005 },
    },
    {
      key: "util",
      rung: "check",
      prompt: (
        <p>
          A round generates 8 responses together: seven of 500 tokens and one of 4,000. If every slot is held until the round ends,
          what fraction of slot time does useful work? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.23, tolerance: 0.005 },
    },
    {
      key: "zero",
      rung: "apply",
      prompt: <p>Why does a GRPO group in which every response gets the same reward contribute no gradient?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each advantage is the reward minus the group mean, which is zero for every response",
          "The verifier refuses to score groups with equal rewards",
          "Equal rewards make the policy ratio exactly one, which is clipped",
          "The responses are deduplicated before the update",
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

def group_advantages(rewards):
    r = np.asarray(rewards, dtype=float)                 # one row of G samples per prompt
    mean = r.mean(axis=1, keepdims=True)
    std = r.std(axis=1, keepdims=True)
    return (r - mean) / (std + 1e-6)                     # each sample judged against its own group

def informative(rewards):
    r = np.asarray(rewards, dtype=float)
    return r.max(axis=1) > r.min(axis=1)                 # equal rewards give zero advantages and no gradient

def signal_prob(p, G):
    return 1 - p ** G - (1 - p) ** G                     # pass/fail rewards that are not all equal

adv = group_advantages([[1, 0, 0, 1], [1, 1, 1, 1]])
print(np.round(adv, 2).tolist(), informative([[1, 0, 0, 1], [1, 1, 1, 1]]).tolist(), round(signal_prob(0.5, 4), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1.0, -1.0, -1.0, 1.0], [0.0, 0.0, 0.0, 0.0]] [True, False] 0.875",
          "[[0.5, -0.5, -0.5, 0.5], [0.0, 0.0, 0.0, 0.0]] [True, False] 0.875",
          "[[1.0, -1.0, -1.0, 1.0], [0.0, 0.0, 0.0, 0.0]] [True, True] 0.875",
          "[[1.0, -1.0, -1.0, 1.0], [1.0, 1.0, 1.0, 1.0]] [True, False] 0.9375",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def sync_utilisation(lengths):
    return sum(lengths) / (len(lengths) * max(lengths))  # every slot is held until the longest finishes

def first_k_done(lengths, k):
    return sorted(lengths)[k - 1]                        # steps until k responses have finished

def partial_rollout(lengths, budget):
    done = [n for n in lengths if n <= budget]
    carried = [n - budget for n in lengths if n > budget]   # resumed in the next round
    return done, carried

L = [100, 300, 200, 1000]
print(round(sync_utilisation(L), 2), first_k_done(L, 3), partial_rollout(L, 250))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.4 300 ([100, 200], [50, 750])",
          "0.4 200 ([100, 200], [50, 750])",
          "0.4 300 ([100, 200], [300, 1000])",
          "0.25 300 ([100, 200], [50, 750])",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>group_advantages(rewards)</C>, standardising each row with 1e-6 added to its standard deviation,{" "}
          <C>informative(rewards)</C>, returning a boolean array, and <C>signal_prob(p, G)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def group_advantages(rewards):
    r = np.asarray(rewards, dtype=float)
    return r - r.mean()

def informative(rewards):
    return np.ones(len(rewards), dtype=bool)

def signal_prob(p, G):
    return 1 - p ** G
`,
        solution: GROUPS,
        tests: [
          { name: "adv", code: `a = group_advantages([[2.0, 0.0], [5.0, 5.0]])\nassert np.allclose(a, [[1.0, -1.0], [0.0, 0.0]], atol=1e-5)\nassert informative([[1, 1], [0, 1], [0, 0]]).tolist() == [False, True, False]` },
          { name: "prob", code: `assert abs(signal_prob(0.5, 2) - 0.5) < 1e-12 and abs(signal_prob(0.2, 3) - 0.48) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sync_utilisation(lengths)</C>, <C>first_k_done(lengths, k)</C> and <C>partial_rollout(lengths, budget)</C>, keeping
          the input order in both returned lists.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def sync_utilisation(lengths):
    return 1.0

def first_k_done(lengths, k):
    return max(lengths)

def partial_rollout(lengths, budget):
    return list(lengths), []
`,
        solution: ROUNDS,
        tests: [
          { name: "sync", code: `assert sync_utilisation([1, 3]) == 2 / 3 and first_k_done([9, 2, 5, 7], 2) == 5` },
          { name: "partial", code: `assert partial_rollout([5, 20, 10, 30], 10) == ([5, 10], [10, 20])\nassert partial_rollout([3], 3) == ([3], [])` },
        ],
      },
    },
    {
      key: "useful",
      rung: "stretch",
      prompt: (
        <p>
          A batch has 1,024 prompts: the model solves half of them with probability 0.1 and the other half with probability 0.6, each
          sample independently. GRPO samples 8 responses per prompt. On average, how many groups are informative? Give the nearest whole
          number.
        </p>
      ),
      answer: { kind: "numeric", value: 795, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        The generator and the trainer hold separate copies of the policy. After each update the trainer&apos;s new weights must reach
        the generator, which may run on different GPUs with a different layout; the next lesson moves them quickly and checks that both
        copies agree.
      </p>
    </>
  ),
};
