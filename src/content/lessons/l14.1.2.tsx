import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GoalMisgenViz } from "@/components/viz/GoalMisgenViz";
import type { LessonContent } from "@/lib/types";

const LEVEL = `def step(goal, pos, coin):
    if goal == "right":
        return 1                                           # the proxy goal ignores the coin
    return 1 if coin > pos else -1                         # the intended goal

def run(goal, length, coin, start, max_steps):
    pos = start
    for _ in range(max_steps):
        pos = min(length - 1, max(0, pos + step(goal, pos, coin)))
        if pos == coin:
            return 1                                       # reward only for reaching the coin
    return 0

def success_rate(goal, length, coins, start):
    return sum(run(goal, length, c, start, 2 * length) for c in coins) / len(coins)`;

const RISK = `import math

def p_misgeneralise(q, eps, n):
    return q * (1 - eps) ** n                              # no level told the goals apart, and the bias chose the proxy

def episodes_for(q, eps, delta):
    if q <= delta:
        return 0
    return math.ceil(math.log(delta / q) / math.log(1 - eps))

def expected_test_success(q, eps, n, proxy_success):
    p = p_misgeneralise(q, eps, n)
    return p * proxy_success + (1 - p) * 1.0`;

export const lesson: LessonContent = {
  id: "l14.1.2",
  minutes: 45,
  links: {
    requires: ["l14.1.1", "l9.8.2"],
    revisits: ["l11.6.4", "l9.1.3"],
    foreshadows: ["l14.1.3", "l14.3.4"],
  },

  puzzle: (
    <>
      <p>
        An agent is trained on a platform game whose reward is collecting a coin, which in every training level sits at
        the far right. It becomes excellent: it dodges enemies, jumps gaps and reaches the coin every time. At test the
        coin is placed elsewhere. The agent dodges, jumps and runs to the far right, skilfully, past the coin. The
        reward was correct; nothing was gamed. What did the agent learn, and how could training have told?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Training data rarely pins down a single goal. Whenever two goals earn the same reward on every training
        situation, the learner has no reason to prefer the intended one, and its inductive biases, such as a preference
        for simple features, decide. The danger is the combination: the capabilities generalise, so the agent acts
        competently at test, but in pursuit of the wrong goal. A failure of competence is often harmless; competent
        pursuit of the wrong goal is not.
      </p>
      <GoalMisgenViz />
    </>
  ),

  theory: (
    <>
      <Definition title="goal misgeneralisation">
        <p>
          A model misgeneralises its goal when it is trained with a correct specification, behaves as intended on the
          training distribution, and at test retains its capabilities while pursuing a different goal that was
          indistinguishable from the intended one in training. Langosco et al. (2022) showed this in the coin game of the
          puzzle (<C>step</C>, <C>run</C>). Shah et al. (2022) gave further cases, among them an
          agent that learned to visit locations in a rewarded order by following a partner who knew it, and at test
          followed a partner who visited them in the wrong order, though its own reward told it it was failing.
        </p>
        <Code>{LEVEL}</Code>
      </Definition>

      <Definition title="the role of underspecification">
        <p>
          Let G be the set of goals consistent with the training reward: those whose optimal behaviour earns maximal
          reward on every training situation. When G has more than one member, training does not determine which is
          learned. Distinguishing situations, where members of G prescribe different behaviour, are the only data that
          shrink G. Their frequency, ε per episode, is a property of the training distribution, and it can be raised
          deliberately, for instance by moving the coin in some levels.
        </p>
      </Definition>

      <Theorem title="how often the wrong goal survives">
        <p>
          Suppose there are two candidate goals, each training episode independently distinguishes them with probability
          ε, a single distinguishing episode is enough to rule out the wrong goal, and when no such episode occurs the
          learner settles on the proxy with probability q. After n episodes the probability of learning the proxy is
        </p>
        <MD>{"q\\,(1 - \\varepsilon)^n"}</MD>
        <p>
          (<C>p_misgeneralise</C>), and it falls below δ &lt; q once{" "}
          <M>{"n \\ge \\log(\\delta/q)\\,/\\log(1 - \\varepsilon)"}</M> (<C>episodes_for</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          The proxy is learned only if no episode distinguishes the goals, which by independence has probability{" "}
          <M>{"(1 - \\varepsilon)^n"}</M>, and then the bias chooses it, with probability q. Taking logarithms of{" "}
          <M>{"q(1 - \\varepsilon)^n \\le \\delta"}</M> and dividing by <M>{"\\log(1 - \\varepsilon) < 0"}</M>, which
          reverses the inequality, gives the bound. With ε = 0 the risk stays at q however long training runs: more data
          from the same distribution does not help. In practice one distinguishing episode is not decisive for a
          gradient learner, which weighs them against many others; the reward advantage of the intended goal is about ε
          times the proxy&apos;s failure rate on distinguishing episodes, so rare distinguishing episodes give a weak
          signal as well as a rare one.
        </p>
        <Code>{RISK}</Code>
      </Proof>

      <Example title="partial success hides the problem">
        <p>
          A proxy rarely fails everywhere. In a level of length 7 with the agent starting in the middle, going right
          reaches a coin placed anywhere to its right, half of the possible places (<C>success_rate</C>). Test success of
          a learner is then a mixture, <M>{"p \\cdot s_{\\text{proxy}} + (1 - p)"}</M> (<C>expected_test_success</C>), and a
          test score of 0.9 can mean a reliable learner of the right goal on most seeds and a confident learner of the
          wrong one on a few. Looking at which situations fail, not only how many, separates the two.
        </p>
      </Example>

      <Remark title="why it matters for language models">
        <p>
          In fine-tuning, &quot;give the answer the rater prefers&quot; and &quot;give the true answer&quot; coincide on most
          examples, and differ exactly where the rater is mistaken or flattered, which is how sycophancy can be learned
          from correct-looking data. The worry about more capable systems is the same in kind: a model trained where
          &quot;do what the overseers approve of&quot; and &quot;do what they would want&quot; coincide may have learned
          either. Interpretability can look for evidence of the learned goal directly, as in auditing for hidden
          objectives; diverse training data and deliberately distinguishing tests shrink the set of goals that fit.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "risk",
      rung: "check",
      prompt: (
        <p>
          The learner prefers the proxy with probability 0.9 when nothing distinguishes the goals. Each training episode
          distinguishes them with probability 0.02. What is the probability of learning the proxy after 100 episodes?
        </p>
      ),
      answer: { kind: "numeric", value: 0.1194, tolerance: 0.001 },
    },
    {
      key: "needed",
      rung: "check",
      prompt: <p>With the same q and ε, how many episodes bring that probability to 0.01 or below?</p>,
      answer: { kind: "numeric", value: 223, tolerance: 0 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: (
        <p>
          What distinguishes goal misgeneralisation from specification gaming?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The specification is correct; the model learns a different goal that matched it in training, and pursues it competently elsewhere",
          "The model exploits a flaw in the reward function",
          "The model loses its capabilities at test time",
          "It occurs only in reinforcement learning, never in supervised learning",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def step(goal, pos, coin):
    if goal == "right":
        return 1                                           # the proxy goal ignores the coin
    return 1 if coin > pos else -1                         # the intended goal

def run(goal, length, coin, start, max_steps):
    pos = start
    for _ in range(max_steps):
        pos = min(length - 1, max(0, pos + step(goal, pos, coin)))
        if pos == coin:
            return 1                                       # reward only for reaching the coin
    return 0

def success_rate(goal, length, coins, start):
    return sum(run(goal, length, c, start, 2 * length) for c in coins) / len(coins)

print(run("right", 7, 6, 3, 14), run("right", 7, 1, 3, 14), run("coin", 7, 1, 3, 14), run("coin", 7, 3, 3, 2))
print(success_rate("right", 7, [0, 1, 2, 4, 5, 6], 3), success_rate("coin", 7, [0, 1, 2, 4, 5, 6], 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1 0 1 1\n0.5 1.0",
          "1 0 1 0\n0.5 1.0",
          "1 1 1 1\n1.0 1.0",
          "1 0 1 1\n0.5 0.8333333333333334",
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

def p_misgeneralise(q, eps, n):
    return q * (1 - eps) ** n                              # no level told the goals apart, and the bias chose the proxy

def episodes_for(q, eps, delta):
    if q <= delta:
        return 0
    return math.ceil(math.log(delta / q) / math.log(1 - eps))

def expected_test_success(q, eps, n, proxy_success):
    p = p_misgeneralise(q, eps, n)
    return p * proxy_success + (1 - p) * 1.0

print(p_misgeneralise(0.8, 0.5, 2), p_misgeneralise(0.8, 0.0, 1000), episodes_for(0.8, 0.5, 0.1), episodes_for(0.05, 0.5, 0.1))
print(expected_test_success(1.0, 0.5, 1, 0.0), expected_test_success(0.5, 0.0, 10, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.2 0.8 3 0\n0.5 0.75",
          "0.2 0.0 3 0\n0.5 0.75",
          "0.2 0.8 4 0\n0.5 0.75",
          "0.2 0.8 3 0\n0.0 0.75",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          A level has positions 0 to length − 1, and positions are clipped to it. Write <C>step(goal, pos, coin)</C>,
          returning +1 for the goal &quot;right&quot;, and for the goal &quot;coin&quot; +1 exactly when the coin is to the
          right and −1 otherwise; <C>run(goal, length, coin, start, max_steps)</C>, returning 1 as soon as a step lands on
          the coin and 0 if it never does; and <C>success_rate(goal, length, coins, start)</C>, averaging runs of 2 ×
          length steps.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def step(goal, pos, coin):
    return 1

def run(goal, length, coin, start, max_steps):
    return 1 if coin >= start else 0

def success_rate(goal, length, coins, start):
    return 0.0
`,
        solution: LEVEL,
        tests: [
          { name: "run", code: `assert run("coin", 5, 0, 2, 10) == 1 and run("right", 5, 0, 2, 10) == 0 and run("coin", 5, 4, 2, 1) == 0 and step("coin", 3, 1) == -1` },
          { name: "rate", code: `assert success_rate("right", 5, [0, 1, 3, 4], 2) == 0.5 and success_rate("coin", 5, [0, 4], 2) == 1.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>p_misgeneralise(q, eps, n)</C>; <C>episodes_for(q, eps, delta)</C>, the least n with risk at most delta,
          0 if q ≤ delta; and <C>expected_test_success(q, eps, n, proxy_success)</C>, assuming the intended goal always
          succeeds.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def p_misgeneralise(q, eps, n):
    return q

def episodes_for(q, eps, delta):
    return 0

def expected_test_success(q, eps, n, proxy_success):
    return 1.0
`,
        solution: RISK,
        tests: [
          { name: "risk", code: `assert abs(p_misgeneralise(0.5, 0.1, 2) - 0.405) < 1e-12 and episodes_for(1.0, 0.5, 0.2) == 3 and episodes_for(0.1, 0.5, 0.2) == 0` },
          { name: "test", code: `assert abs(expected_test_success(0.5, 0.5, 1, 0.2) - 0.8) < 1e-12` },
        ],
      },
    },
    {
      key: "mixture",
      rung: "stretch",
      prompt: (
        <p>
          With q = 0.9, ε = 0.02 and 100 training episodes, a learner of the proxy succeeds on half the test levels and a
          learner of the intended goal on all of them. What is the expected test success?
        </p>
      ),
      answer: { kind: "numeric", value: 0.9403, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        A misgeneralised goal is learned by accident. A more troubling possibility is a model whose learned goal differs
        from the intended one and that behaves well in training because it recognises training. Whether training would
        produce such a model is argued over, and the arguments are worth examining carefully.
      </p>
    </>
  ),
};
