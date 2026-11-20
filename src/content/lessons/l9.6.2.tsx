import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LabelBudgetViz } from "@/components/viz/LabelBudgetViz";
import type { LessonContent } from "@/lib/types";

const SCORE = `import math

def expected_score(score_logps, scores):
    m = max(score_logps)
    w = [math.exp(l - m) for l in score_logps]
    return sum(wi * s for wi, s in zip(w, scores)) / sum(w)

def to_reward(score, lo, hi):
    return 2 * (score - lo) / (hi - lo) - 1

def label_cost(n_pairs, tokens_per_call, price_per_mtok, both_orders):
    calls = n_pairs * (2 if both_orders else 1)
    return calls * tokens_per_call / 1e6 * price_per_mtok`;

const EVAL = `import math

def pairs_from_scores(scores):
    out = []
    for i in range(len(scores)):
        for j in range(i + 1, len(scores)):
            if scores[i] > scores[j]:
                out.append((i, j))
            elif scores[j] > scores[i]:
                out.append((j, i))
    return out

def win_rate_ci(wins, n):
    p = wins / n
    return p, 1.96 * math.sqrt(p * (1 - p) / n)

def vote_share(answers):
    return answers.count("A") / len(answers)`;

export const lesson: LessonContent = {
  id: "l9.6.2",
  minutes: 45,
  links: {
    requires: ["l9.6.1"],
    revisits: ["l9.3.2", "l9.5.3"],
    foreshadows: ["l9.6.3", "l10.2.2"],
  },

  puzzle: (
    <>
      <p>
        A human preference label takes a trained annotator a minute or more, and a large set takes weeks to collect. An AI label
        costs a small fraction of that and arrives in seconds. If a language model can stand in for the
        annotator, preference data becomes almost free and can be collected online for every batch. Lee et al. (2023) compared
        the two directly and found policies trained on AI labels were preferred about as often as those trained on human labels.
        When is that substitution safe, and what does it quietly change?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An AI labeller makes two kinds of error. Some are random, varying from pair to pair like a distracted annotator; with
        enough labels these average out. Others are systematic: a lean towards longer answers, towards its own style, towards
        the first response shown. More labels do not remove those; a reward model trained on them learns the bias faithfully,
        and the policy then exploits it. RLAIF therefore wins when the labeller&apos;s systematic error is small relative to what
        the cheaper labels buy, and it needs checks against human judgement to know which case it is in.
      </p>
      <LabelBudgetViz />
    </>
  ),

  theory: (
    <>
      <Definition title="RLAIF">
        <p>
          Reinforcement learning from AI feedback replaces human preference labels by labels from an off-the-shelf language model,
          prompted with a description of the task and what makes a response good, then follows the RLHF pipeline: train a reward
          model on the labels, then optimise the policy against it. Labels are soft (l9.6.1), taken in both orders to cancel
          position bias, and often preceded by chain-of-thought reasoning.
        </p>
      </Definition>

      <Definition title="direct RLAIF">
        <p>
          Skipping the reward model, the labeller scores each response on a scale, say 1 to 10, and its probabilities over the score
          tokens give an expected score (<C>expected_score</C>), mapped to a reward in [−1, 1] (<C>to_reward</C>). This avoids the reward
          model going stale as the policy drifts, since the labeller sees every new sample, but costs a labeller call per sample
          throughout RL (<C>label_cost</C>).
        </p>
        <Code>{SCORE}</Code>
      </Definition>

      <Theorem title="systematic labeller bias survives any amount of data">
        <p>
          If labels follow Bradley–Terry with reward <M>{"r_{\\text{AI}} = r + b"}</M>, a well-specified reward model trained by maximum
          likelihood on n labelled pairs converges to <M>{"r + b"}</M> up to a constant as n grows, not to r.
        </p>
      </Theorem>
      <Proof>
        <p>
          The labels are drawn exactly from the Bradley–Terry model with scores <M>{"r + b"}</M>. Maximum likelihood is consistent for
          a well-specified model, so the estimate converges to the generating scores, which are identified only up to a shared
          constant (l9.3.2). Nothing in the data distinguishes the part b from the part r. Random label noise, by contrast, is
          already part of the Bradley–Terry likelihood and only slows convergence.
        </p>
      </Proof>

      <Remark title="what the experiments showed">
        <p>
          On summarisation and helpful dialogue, Lee et al. found RLAIF and RLHF policies preferred over the SFT baseline at similar
          rates by human raters, and for harmlessness RLAIF scored higher. A labeller the same size as the policy still improved it,
          a form of self-improvement. Larger labellers agreed more with people, and detailed instructions and chain of thought
          helped, while few-shot examples did not always. Comparisons of this kind rest on win rates with confidence intervals
          (<C>win_rate_ci</C>); scores for several responses can be converted to preference pairs (<C>pairs_from_scores</C>), and repeated
          sampled judgements to a soft label (<C>vote_share</C>).
        </p>
        <Code>{EVAL}</Code>
      </Remark>

      <Example title="a self-reinforcing bias">
        <p>
          A labeller slightly prefers bulleted answers regardless of content. The reward model learns the preference, RL makes the
          policy use bullets everywhere, and if the policy is then used as the next labeller, as in self-rewarding schemes, the taste
          compounds. Holding out a set of human comparisons and tracking agreement each round catches the drift.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "score",
      rung: "check",
      prompt: (
        <p>
          On a 1 to 10 scale, a judge gives the score tokens 6, 7 and 8 probabilities 0.2, 0.5 and 0.3. What reward in [−1, 1] does
          direct RLAIF assign? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.356, tolerance: 0.001 },
    },
    {
      key: "ci",
      rung: "check",
      prompt: (
        <p>
          A policy beats its baseline in 540 of 1,000 judged comparisons. What is the half-width of the normal-approximation 95%
          confidence interval for its win rate? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.031, tolerance: 0.001 },
    },
    {
      key: "bias",
      rung: "apply",
      prompt: (
        <p>
          A team doubles its AI-labelled preference data and sees no gain in agreement with a held-out set of human comparisons.
          What does this suggest?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The labeller's remaining errors are mostly systematic, so more labels will not help; better prompts, a stronger labeller or some human labels are needed",
          "The reward model is too small to fit more data",
          "Human comparisons are less reliable than AI labels",
          "The data should be doubled again",
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

def expected_score(score_logps, scores):
    m = max(score_logps)
    w = [math.exp(l - m) for l in score_logps]
    return sum(wi * s for wi, s in zip(w, scores)) / sum(w)

def to_reward(score, lo, hi):
    return 2 * (score - lo) / (hi - lo) - 1

def label_cost(n_pairs, tokens_per_call, price_per_mtok, both_orders):
    calls = n_pairs * (2 if both_orders else 1)
    return calls * tokens_per_call / 1e6 * price_per_mtok

print(expected_score([0.0, 0.0], [4, 8]), to_reward(10, 1, 10), to_reward(1, 1, 10))
print(label_cost(1000, 500, 2.0, True), label_cost(1000, 500, 2.0, False))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "6.0 1.0 -1.0\n2.0 1.0",
          "6.0 1.0 0.0\n2.0 1.0",
          "4.0 1.0 -1.0\n2.0 1.0",
          "6.0 1.0 -1.0\n1.0 1.0",
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

def pairs_from_scores(scores):
    out = []
    for i in range(len(scores)):
        for j in range(i + 1, len(scores)):
            if scores[i] > scores[j]:
                out.append((i, j))
            elif scores[j] > scores[i]:
                out.append((j, i))
    return out

def win_rate_ci(wins, n):
    p = wins / n
    return p, 1.96 * math.sqrt(p * (1 - p) / n)

def vote_share(answers):
    return answers.count("A") / len(answers)

print(pairs_from_scores([2, 5, 2]), vote_share(["A", "B", "A", "A"]))
print(win_rate_ci(50, 100)[0], round(win_rate_ci(50, 100)[1], 3), win_rate_ci(100, 100))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(1, 0), (1, 2)] 0.75\n0.5 0.098 (1.0, 0.0)",
          "[(1, 0), (1, 2), (0, 2)] 0.75\n0.5 0.098 (1.0, 0.0)",
          "[(0, 1), (2, 1)] 0.75\n0.5 0.098 (1.0, 0.0)",
          "[(1, 0), (1, 2)] 0.75\n0.5 0.05 (1.0, 0.0)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>expected_score(score_logps, scores)</C>, normalising the probabilities over the listed scores,{" "}
          <C>to_reward(score, lo, hi)</C>, mapping [lo, hi] linearly onto [−1, 1], and <C>label_cost(n_pairs, tokens_per_call, price_per_mtok, both_orders)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def expected_score(score_logps, scores):
    return scores[score_logps.index(max(score_logps))]

def to_reward(score, lo, hi):
    return (score - lo) / (hi - lo)

def label_cost(n_pairs, tokens_per_call, price_per_mtok, both_orders):
    return n_pairs * price_per_mtok
`,
        solution: SCORE,
        tests: [
          { name: "score", code: `assert abs(expected_score([math.log(1), math.log(3)], [2, 6]) - 5.0) < 1e-12 and abs(expected_score([-900.0, -900.0], [1, 3]) - 2.0) < 1e-12 and to_reward(3, 1, 5) == 0.0` },
          { name: "cost", code: `assert abs(label_cost(2000, 250, 4.0, True) - 4.0) < 1e-12 and abs(label_cost(2000, 250, 4.0, False) - 2.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pairs_from_scores(scores)</C>, returning (winner, loser) index pairs in order of i then j for i &lt; j and skipping ties,{" "}
          <C>win_rate_ci(wins, n)</C> and <C>vote_share(answers)</C>, the share of answers equal to &quot;A&quot;.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def pairs_from_scores(scores):
    return []

def win_rate_ci(wins, n):
    return wins / n, 0.0

def vote_share(answers):
    return 0.5
`,
        solution: EVAL,
        tests: [
          { name: "pairs", code: `assert pairs_from_scores([1, 3, 3, 0]) == [(1, 0), (2, 0), (0, 3), (1, 3), (2, 3)] and vote_share(["B", "A", "B", "B"]) == 0.25` },
          { name: "ci", code: `p, h = win_rate_ci(30, 120)\nassert p == 0.25 and abs(h - 1.96 * math.sqrt(0.25 * 0.75 / 120)) < 1e-12` },
        ],
      },
    },
    {
      key: "n",
      rung: "stretch",
      prompt: (
        <p>
          For a win rate near 50%, how many judged comparisons are needed, at least, for the normal-approximation 95% interval to
          have half-width at most 0.02?
        </p>
      ),
      answer: { kind: "numeric", value: 2401, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        Here the AI labeller fed a reward model. The next lesson looks at language models used directly as judges, for
        evaluation and as rewards, and at the ways they fail.
      </p>
    </>
  ),
};
