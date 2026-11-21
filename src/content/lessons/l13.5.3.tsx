import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CascadeCostViz } from "@/components/viz/CascadeCostViz";
import type { LessonContent } from "@/lib/types";

const RETRY = `def retry_stats(p, c, k, reach=1.0):
    s_k = 1 - (1 - p) ** k                                 # solved within k tries, if within reach
    attempts = reach * (s_k / p if p > 0 else k) + (1 - reach) * k
    return reach * s_k, c * attempts                       # (success, expected cost per task)

def cost_per_success(p, c, k, reach=1.0):
    s, cost = retry_stats(p, c, k, reach)
    return cost / s

def cascade(p1, c1, q2, c2):
    return p1 + (1 - p1) * q2, c1 + (1 - p1) * c2          # escalate only the cheap model's failures`;

const VALUE = `def run_cost(tokens_in, tokens_cached, tokens_out, prices):
    p_in, p_cached, p_out = prices                         # dollars per million tokens
    return (tokens_in * p_in + tokens_cached * p_cached + tokens_out * p_out) / 1e6

def net_value(p, value, harm, cost):
    return p * value - (1 - p) * harm - cost               # an unnoticed failure does harm

def break_even(value, harm, cost):
    return (harm + cost) / (value + harm)                  # the success rate at which net value is zero`;

export const lesson: LessonContent = {
  id: "l13.5.3",
  minutes: 45,
  links: {
    requires: ["l13.5.2", "l13.3.1"],
    revisits: ["l13.1.3", "l9.7.4"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        A team can run its coding agent on a cheap model at ten cents an attempt, which fixes 30% of their issues, or on a
        strong model at a dollar an attempt, which fixes 60%. Their tests can tell a correct fix from a wrong one. Should
        they retry the cheap model until it succeeds, pay for the strong one, or try the cheap one first and escalate? And
        at what success rate is the agent worth running at all?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The number that matters is the cost of a success, not the cost of an attempt. A checker lets an agent stop at its
        first success, so retries are cheap on tasks it can eventually solve, and wasted on those it cannot. A cascade
        sends each task to the cheap model first and pays for the strong one only when needed, which works when the strong
        model can solve what the cheap one could not. Whether any of this is worth it depends on what a success is worth,
        and on what a failure that nobody notices costs.
      </p>
      <CascadeCostViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="retrying with a checker">
        <p>
          Let each attempt at a task cost c and succeed independently with probability p &gt; 0, and let an exact checker
          stop the run at the first success, after at most k attempts. The run succeeds with probability{" "}
          <M>{"s_k = 1 - (1 - p)^k"}</M>, its expected cost is <M>{"c\\,s_k/p"}</M>, and the cost per success is c/p for
          every k. If only a share w of tasks is within reach, the others never being solved, the cost per success becomes
        </p>
        <MD>{"\\frac{c\\,\\big(w\\,s_k/p + (1 - w)\\,k\\big)}{w\\,s_k}"}</MD>
        <p>which grows with k whenever w &lt; 1 (<C>retry_stats</C>, <C>cost_per_success</C>).</p>
      </Theorem>
      <Proof>
        <p>
          The run fails only if all k attempts fail, which gives <M>{"s_k"}</M>. The number of attempts is{" "}
          <M>{"\\min(G, k)"}</M> for G geometric with parameter p, and{" "}
          <M>{"\\mathbb{E}[\\min(G, k)] = \\sum_{j=0}^{k-1} \\Pr(G > j) = \\sum_{j=0}^{k-1} (1 - p)^j = s_k/p"}</M>. Dividing the
          expected cost by <M>{"s_k"}</M> leaves c/p. A task out of reach uses all k attempts and never succeeds, which adds{" "}
          <M>{"(1 - w)ck"}</M> to the cost and nothing to the successes. The cost per success is then{" "}
          <M>{"c/p + c(1 - w)k/(w\\,s_k)"}</M>, and <M>{"k/s_k"}</M> increases with k because{" "}
          <M>{"s_k/k = \\tfrac1k\\sum_{j<k}p(1 - p)^j"}</M> is an average of decreasing terms. The independence assumption is the weak point in practice; attempts at the
          same task by the same model are correlated, which behaves like a reach below 1.
        </p>
        <Code>{RETRY}</Code>
      </Proof>

      <Definition title="cascades and routing">
        <p>
          A cascade tries a cheap model first and escalates to a stronger one when a check fails. If the cheap model succeeds
          with probability <M>{"p_1"}</M> at cost <M>{"c_1"}</M>, and the strong one, at cost <M>{"c_2"}</M>, solves a share{" "}
          <M>{"q_2"}</M> of the tasks the cheap one failed, the cascade succeeds with probability{" "}
          <M>{"p_1 + (1 - p_1)q_2"}</M> at expected cost <M>{"c_1 + (1 - p_1)c_2"}</M> (<C>cascade</C>). Here{" "}
          <M>{"q_2"}</M> is a conditional rate and is usually below the strong model&apos;s overall rate, because the tasks the
          cheap model fails are the harder ones. A router instead predicts each task&apos;s difficulty in advance and sends it
          to one model, saving the cheap model&apos;s wasted attempt but risking misroutes. Both need a signal of success,
          which is easy with tests and hard without them.
        </p>
      </Definition>

      <Definition title="what a run costs, and what it is worth">
        <p>
          The cost of an agentic run is mostly tokens: input tokens, repeatedly reread as the agent loop lesson showed,
          cached input at a fraction of the price, and output, priced higher (<C>run_cost</C>). Tool calls, sandboxes and the
          time of the person who reviews the result add to it. On the other side, a success has some value V, and a failure
          that is not noticed can do harm H, a wrong fix shipped or a wrong answer acted on. An agent with success rate p and
          cost C per task has net value
        </p>
        <MD>{"pV - (1 - p)H - C"}</MD>
        <p>
          (<C>net_value</C>), positive exactly when <M>{"p > (H + C)/(V + H)"}</M> (<C>break_even</C>). Harm raises the bar:
          when failures are caught and cost nothing beyond the run, the bar is C/V; when they are not, reliability is worth
          more than cheapness.
        </p>
        <Code>{VALUE}</Code>
      </Definition>

      <Example title="a run, priced">
        <p>
          A software agent takes 60 steps; across them it reads 2 million fresh input tokens and 8 million cached ones and
          writes 100 thousand. At $3, $0.30 and $15 per million, that is $6 + $2.40 + $1.50 = $9.90. If it resolves half the
          issues it is given, a resolved issue costs about $20 in tokens, which can be cheap compared with an engineer&apos;s
          time, or expensive compared with a cheaper model in a cascade. Caching, shorter contexts and stopping early on
          tasks out of reach usually save more than a cheaper price per token.
        </p>
      </Example>

      <Remark title="reporting cost">
        <p>
          A score without its cost is incomplete: any agent can be made to look better with more attempts, longer thinking
          or a stronger model behind it, as the lessons on test-time compute showed. Comparisons should be made at matched
          cost, or as curves of success against cost, where only systems not beaten on both axes are worth considering. This
          course has followed reasoning, tools, agents, their training and their evaluation; in every part the same
          question recurs, what a unit of compute buys, and the answer keeps changing as models and prices do.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "retry",
      rung: "check",
      prompt: (
        <p>
          Each attempt costs $0.40 and succeeds independently with probability 0.25. Tests stop the run at the first
          success, with at most 4 attempts. What is the expected cost per task, in dollars?
        </p>
      ),
      answer: { kind: "numeric", value: 1.0938, tolerance: 0.001 },
    },
    {
      key: "cascade",
      rung: "check",
      prompt: (
        <p>
          A cheap model costs $0.10 and succeeds on half the tasks. Failures are escalated to a strong model costing $1.00,
          which solves 40% of them. What is the cascade&apos;s cost per successful task, in dollars?
        </p>
      ),
      answer: { kind: "numeric", value: 0.8571, tolerance: 0.001 },
    },
    {
      key: "q2",
      rung: "apply",
      prompt: (
        <p>
          A strong model solves 60% of all tasks. Why might it solve far fewer than 60% of the tasks a cheap model failed?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The cheap model's failures are concentrated on harder tasks, so the strong model's rate on them is a conditional rate, usually lower",
          "The strong model is charged more per token",
          "Escalated tasks have longer prompts, which always lowers accuracy",
          "Because retries are independent",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def retry_stats(p, c, k, reach=1.0):
    s_k = 1 - (1 - p) ** k                                 # solved within k tries, if within reach
    attempts = reach * (s_k / p if p > 0 else k) + (1 - reach) * k
    return reach * s_k, c * attempts                       # (success, expected cost per task)

def cost_per_success(p, c, k, reach=1.0):
    s, cost = retry_stats(p, c, k, reach)
    return cost / s

def cascade(p1, c1, q2, c2):
    return p1 + (1 - p1) * q2, c1 + (1 - p1) * c2          # escalate only the cheap model's failures

print(retry_stats(0.5, 1.0, 2), cost_per_success(0.5, 1.0, 3), retry_stats(0.5, 1.0, 1, reach=0.5))
print(cascade(0.5, 0.1, 0.4, 1.0), round(cost_per_success(0.5, 1.0, 2, reach=0.5), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0.75, 1.5) 2.0 (0.25, 1.0)\n(0.7, 0.6) 4.6667",
          "(0.75, 2.0) 2.0 (0.25, 1.0)\n(0.7, 0.6) 4.6667",
          "(0.75, 1.5) 2.0 (0.25, 1.0)\n(0.7, 0.6) 2.0",
          "(0.75, 1.5) 2.6667 (0.25, 1.0)\n(0.7, 1.1) 4.6667",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def run_cost(tokens_in, tokens_cached, tokens_out, prices):
    p_in, p_cached, p_out = prices                         # dollars per million tokens
    return (tokens_in * p_in + tokens_cached * p_cached + tokens_out * p_out) / 1e6

def net_value(p, value, harm, cost):
    return p * value - (1 - p) * harm - cost               # an unnoticed failure does harm

def break_even(value, harm, cost):
    return (harm + cost) / (value + harm)                  # the success rate at which net value is zero

print(run_cost(2_000_000, 8_000_000, 100_000, (3.0, 0.3, 15.0)), net_value(0.5, 10, 2, 1))
print(break_even(20, 15, 2), break_even(10, 0, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "9.9 3.0\n0.4857142857142857 0.1",
          "9.9 4.0\n0.4857142857142857 0.1",
          "8.4 3.0\n0.4857142857142857 0.1",
          "9.9 3.0\n0.5428571428571428 0.1",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>retry_stats(p, c, k, reach=1.0)</C>, returning the success probability and expected cost per task when a
          share reach of tasks can be solved and the rest use all k attempts; <C>cost_per_success(p, c, k, reach=1.0)</C>;
          and <C>cascade(p1, c1, q2, c2)</C>, returning success and expected cost.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def retry_stats(p, c, k, reach=1.0):
    return 1 - (1 - p) ** k, c * k

def cost_per_success(p, c, k, reach=1.0):
    return c / p

def cascade(p1, c1, q2, c2):
    return max(p1, q2), c1 + c2
`,
        solution: RETRY,
        tests: [
          { name: "retry", code: `s, c = retry_stats(0.5, 2.0, 2)\nassert abs(s - 0.75) < 1e-12 and abs(c - 3.0) < 1e-12 and abs(cost_per_success(0.5, 1.0, 1, reach=0.5) - 4.0) < 1e-12 and abs(cost_per_success(0.5, 1.0, 2, reach=0.5) - 1.75 / 0.375) < 1e-12` },
          { name: "cascade", code: `s, c = cascade(0.2, 1.0, 0.5, 4.0)\nassert abs(s - 0.6) < 1e-12 and abs(c - 4.2) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>run_cost(tokens_in, tokens_cached, tokens_out, prices)</C>, with prices in dollars per million tokens for
          the three kinds; <C>net_value(p, value, harm, cost)</C>; and <C>break_even(value, harm, cost)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def run_cost(tokens_in, tokens_cached, tokens_out, prices):
    return 0.0

def net_value(p, value, harm, cost):
    return p * value

def break_even(value, harm, cost):
    return cost / value
`,
        solution: VALUE,
        tests: [
          { name: "cost", code: `assert abs(run_cost(1_000_000, 0, 1_000_000, (2.0, 0.2, 10.0)) - 12.0) < 1e-9 and abs(run_cost(0, 5_000_000, 0, (2.0, 0.2, 10.0)) - 1.0) < 1e-9` },
          { name: "value", code: `assert abs(net_value(0.5, 10, 4, 1) - 2.0) < 1e-12 and abs(break_even(10, 4, 1) - 5 / 14) < 1e-12 and abs(net_value(break_even(7, 3, 2), 7, 3, 2)) < 1e-12` },
        ],
      },
    },
    {
      key: "reach",
      rung: "stretch",
      prompt: (
        <p>
          A cheap model costs $0.10 an attempt and succeeds with probability 0.5 per attempt on the 60% of tasks within its
          reach, and never on the rest. Tests stop at the first success, with at most 3 attempts. What is the cost per
          successful task, in dollars?
        </p>
      ),
      answer: { kind: "numeric", value: 0.4286, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        This course has taken language models from answering to acting: reasoning at length, calling tools, running as
        agents over many steps, trained in environments with checkers and measured for success, reliability and cost.
        Later courses put these agents to work in science, robotics and the design of the systems that train them.
      </p>
    </>
  ),
};
