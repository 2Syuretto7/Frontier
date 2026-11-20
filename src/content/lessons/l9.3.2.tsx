import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BradleyTerryViz } from "@/components/viz/BradleyTerryViz";
import type { LessonContent } from "@/lib/types";

const BT = `import math

def bt_prob(r_a, r_b):
    return 1 / (1 + math.exp(-(r_a - r_b)))

def bt_loss(r_w, r_l, margin=0.0):
    return math.log(1 + math.exp(-(r_w - r_l - margin)))

def fit_bt(n_items, comparisons, lr=0.5, steps=500):
    s = [0.0] * n_items
    for _ in range(steps):
        g = [0.0] * n_items
        for w, l in comparisons:
            d = 1 - bt_prob(s[w], s[l])
            g[w] += d
            g[l] -= d
        s = [si + lr * gi / len(comparisons) for si, gi in zip(s, g)]
        mean = sum(s) / n_items
        s = [si - mean for si in s]
    return s`;

const EVAL = `import math

def pairwise_accuracy(rewards_w, rewards_l):
    return sum(w > l for w, l in zip(rewards_w, rewards_l)) / len(rewards_w)

def plackett_luce_logprob(scores, ranking):
    total = 0.0
    for i, item in enumerate(ranking):
        rest = ranking[i:]
        total += scores[item] - math.log(sum(math.exp(scores[j]) for j in rest))
    return total

def centre(rewards):
    m = sum(rewards) / len(rewards)
    return [r - m for r in rewards]`;

export const lesson: LessonContent = {
  id: "l9.3.2",
  minutes: 50,
  links: {
    requires: ["l9.3.1", "l2.2.4"],
    revisits: ["m9.8.1", "m14.1.1"],
    foreshadows: ["l9.3.3", "l9.5.1", "l10.2.2"],
  },

  puzzle: (
    <>
      <p>
        Chess ratings, chatbot leaderboards and the reward models that steer RLHF all rest on one assumption: that each
        competitor has a hidden strength, and the chance one beats another depends only on the difference. From a pile of
        &quot;A beat B&quot; records, the strengths can be estimated. For a reward model the competitors are responses, there are
        infinitely many, and the strength must be predicted by a network from the text. How does that work, and what does
        the network actually learn?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If response a has reward <M>{"r_a"}</M> and b has <M>{"r_b"}</M>, Bradley and Terry&apos;s model says a is preferred with probability{" "}
        <M>{"\\sigma(r_a - r_b)"}</M>, a logistic function of the gap. Fitting is logistic regression on differences. A reward model
        replaces the table of scores with a language model that reads a prompt and response and outputs one number, trained so
        that the preferred response in each pair scores higher. Only differences are learned, so the scale and offset of the
        rewards carry no meaning by themselves.
      </p>
      <BradleyTerryViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the Bradley–Terry model and its loss">
        <p>
          <M>{"P(a \\succ b) = \\sigma(r_a - r_b)"}</M> (<C>bt_prob</C>). For a comparison where w won and l lost, the negative log-likelihood is
        </p>
        <MD>{"\\ell = -\\log\\sigma(r_w - r_l - m)"}</MD>
        <p>
          with margin <M>{"m = 0"}</M> in the plain model; Llama 2 used a positive m for comparisons labelled as clearly better (<C>bt_loss</C>).
          Given only comparisons among a fixed set of items, the scores are fitted by gradient ascent on the log-likelihood,
          re-centred after each step (<C>fit_bt</C>).
        </p>
        <Code>{BT}</Code>
      </Definition>

      <Theorem title="shape of the likelihood">
        <p>
          The Bradley–Terry negative log-likelihood is convex in the scores and unchanged by adding a constant to all of them.
          Its gradient for one comparison is <M>{"\\partial\\ell/\\partial r_w = -(1 - \\sigma(r_w - r_l))"}</M> and <M>{"\\partial\\ell/\\partial r_l = 1 - \\sigma(r_w - r_l)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"f(x) = -\\log\\sigma(x) = \\log(1 + e^{-x})"}</M> has <M>{"f'(x) = -(1 - \\sigma(x))"}</M> and <M>{"f''(x) = \\sigma(x)(1-\\sigma(x)) > 0"}</M>, so it is convex, and
          composing with the linear map <M>{"r \\mapsto r_w - r_l"}</M> keeps convexity; a sum of convex functions is convex. Adding c to every
          score leaves every difference unchanged. The gradient follows from <M>{"f'"}</M> by the chain rule. A pair the model already orders
          confidently contributes almost nothing; learning concentrates on pairs it gets wrong or is unsure of.
        </p>
      </Proof>

      <Definition title="reward models and their evaluation">
        <p>
          A reward model is usually the fine-tuned language model with its output layer replaced by a linear head on the final
          token&apos;s hidden state, trained for about one epoch on comparisons, since a second epoch overfits. It is scored by pairwise
          accuracy on held-out comparisons (<C>pairwise_accuracy</C>), which for chat preferences typically lands between 65% and
          75%, close to the ceiling set by annotator noise (l9.3.1). Rankings of K responses can be used directly with the
          Plackett–Luce model, which picks the best from those remaining at each step (<C>plackett_luce_logprob</C>). Because only
          differences matter, rewards are centred, for example so that reference responses average zero (<C>centre</C>), before
          they are used in RL.
        </p>
        <Code>{EVAL}</Code>
      </Definition>

      <Remark title="what the assumption leaves out">
        <p>
          Bradley–Terry assumes preferences are transitive and come from one scalar. Real preferences mix helpfulness, harmlessness,
          style and length, and different annotators weigh them differently, so Llama 2 trained separate helpfulness and safety
          reward models. Ties are handled by extensions such as Davidson&apos;s. Benchmarks such as RewardBench test reward models on
          curated pairs in chat, reasoning and safety, and accuracy there predicts downstream RLHF quality only loosely.
        </p>
      </Remark>

      <Example title="leaderboards use the same model">
        <p>
          Chatbot Arena collects head-to-head votes between anonymous models and fits Bradley–Terry scores, reported on the Elo
          scale, with confidence intervals by bootstrap. A 100-point Elo gap corresponds to a win probability of about 64%. The
          same caveats apply: the scores depend on who votes and on which prompts, a topic of l10.2.2.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "prob",
      rung: "check",
      prompt: <p>A reward model scores two responses 1.2 and 0.4. Under Bradley–Terry, with what probability is the first preferred? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.69, tolerance: 0.001 },
    },
    {
      key: "margin",
      rung: "check",
      prompt: <p>The preferred response scores 0.5 above the other, and the comparison has margin 1. What is the loss? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.974, tolerance: 0.001 },
    },
    {
      key: "offset",
      rung: "apply",
      prompt: <p>A reward model gives every response to a prompt a score near 40. What can be concluded?</p>,
      answer: {
        kind: "choice",
        options: [
          "Nothing from the level alone: the Bradley–Terry loss depends only on differences, so the offset is arbitrary and only gaps between responses carry information",
          "All the responses are excellent",
          "The reward model is broken, since rewards must lie between 0 and 1",
          "The responses must be identical",
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

def bt_prob(r_a, r_b):
    return 1 / (1 + math.exp(-(r_a - r_b)))

def bt_loss(r_w, r_l, margin=0.0):
    return math.log(1 + math.exp(-(r_w - r_l - margin)))

def fit_bt(n_items, comparisons, lr=0.5, steps=500):
    s = [0.0] * n_items
    for _ in range(steps):
        g = [0.0] * n_items
        for w, l in comparisons:
            d = 1 - bt_prob(s[w], s[l])
            g[w] += d
            g[l] -= d
        s = [si + lr * gi / len(comparisons) for si, gi in zip(s, g)]
        mean = sum(s) / n_items
        s = [si - mean for si in s]
    return s

print(bt_prob(2.0, 2.0), round(bt_loss(1.0, 1.0), 3), round(bt_loss(3.0, 1.0, 2.0), 3))
s = fit_bt(2, [(0, 1), (0, 1), (0, 1), (1, 0)], 2.0, 2000); print(round(s[0] - s[1], 2), round(s[0] + s[1], 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.693 0.693\n1.1 0.0",
          "0.5 0.693 0.127\n1.1 0.0",
          "0.5 0.0 0.693\n0.75 0.0",
          "0.5 0.693 0.693\n1.1 1.1",
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

def pairwise_accuracy(rewards_w, rewards_l):
    return sum(w > l for w, l in zip(rewards_w, rewards_l)) / len(rewards_w)

def plackett_luce_logprob(scores, ranking):
    total = 0.0
    for i, item in enumerate(ranking):
        rest = ranking[i:]
        total += scores[item] - math.log(sum(math.exp(scores[j]) for j in rest))
    return total

def centre(rewards):
    m = sum(rewards) / len(rewards)
    return [r - m for r in rewards]

print(pairwise_accuracy([1.0, 0.0, 2.0], [0.5, 0.5, 2.0]), round(plackett_luce_logprob([0.0, 0.0], [1, 0]), 3))
print(centre([1.0, 2.0, 6.0]), plackett_luce_logprob([5.0], [0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.3333333333333333 -0.693\n[-2.0, -1.0, 3.0] 0.0",
          "0.6666666666666666 -0.693\n[-2.0, -1.0, 3.0] 0.0",
          "0.3333333333333333 -1.386\n[-2.0, -1.0, 3.0] 0.0",
          "0.3333333333333333 -0.693\n[1.0, 2.0, 6.0] 5.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bt_prob(r_a, r_b)</C>, <C>bt_loss(r_w, r_l, margin=0.0)</C> and <C>fit_bt(n_items, comparisons, lr=0.5, steps=500)</C>, which
          averages the gradient over comparisons and centres the scores after each step.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def bt_prob(r_a, r_b):
    return r_a / (r_a + r_b)

def bt_loss(r_w, r_l, margin=0.0):
    return max(0.0, margin - (r_w - r_l))

def fit_bt(n_items, comparisons, lr=0.5, steps=500):
    return [0.0] * n_items
`,
        solution: BT,
        tests: [
          { name: "loss", code: `assert abs(bt_prob(math.log(3), 0.0) - 0.75) < 1e-12 and abs(bt_loss(0.0, math.log(3)) - math.log(4)) < 1e-12 and abs(bt_loss(2.0, 0.0, 2.0) - math.log(2)) < 1e-12` },
          { name: "fit", code: `c = [(0, 1)] * 4 + [(1, 0)] + [(1, 2)] * 4 + [(2, 1)]\ns = fit_bt(3, c, 2.0, 3000)\nassert abs(sum(s)) < 1e-9 and abs((s[0] - s[1]) - math.log(4)) < 1e-3 and abs((s[1] - s[2]) - math.log(4)) < 1e-3` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pairwise_accuracy(rewards_w, rewards_l)</C>, counting ties as wrong, <C>plackett_luce_logprob(scores, ranking)</C> and{" "}
          <C>centre(rewards)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def pairwise_accuracy(rewards_w, rewards_l):
    return 0.5

def plackett_luce_logprob(scores, ranking):
    return sum(scores[i] for i in ranking)

def centre(rewards):
    return list(rewards)
`,
        solution: EVAL,
        tests: [
          { name: "acc", code: `assert pairwise_accuracy([1, 2, 3, 4], [0, 2, 5, 1]) == 0.5 and centre([0.0, 4.0]) == [-2.0, 2.0]` },
          { name: "pl", code: `s = [0.0, math.log(2), math.log(3)]\nassert abs(plackett_luce_logprob(s, [2, 1, 0]) - (math.log(3 / 6) + math.log(2 / 3))) < 1e-12` },
        ],
      },
    },
    {
      key: "pl",
      rung: "stretch",
      prompt: (
        <p>
          Three responses have scores 2, 1 and 0. Under Plackett–Luce, what is the log-probability of the ranking that puts them in
          that order? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: -0.721, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        A reward model is a learned proxy for what people want. The next lesson asks what happens when a policy is optimised hard
        against that proxy.
      </p>
    </>
  ),
};
