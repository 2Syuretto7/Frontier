import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { StepRecoveryViz } from "@/components/viz/StepRecoveryViz";
import type { LessonContent } from "@/lib/types";

const RELIABLE = `from math import comb

def pass_hat_k(n, c, k):
    return comb(c, k) / comb(n, k)                         # chance that k trials drawn from the n all succeeded

def benchmark_pass_hat(trials, k):
    return sum(pass_hat_k(n, c, k) for n, c in trials) / len(trials)

def chain_success(eps, r, m):
    step = (1 - eps) / (1 - eps * r)                       # a step succeeds unless an error goes unnoticed
    return step ** m`;

const HORIZON = `import math

def success_prob(t, h50, beta):
    return 1 / (1 + math.exp(beta * (math.log2(t) - math.log2(h50))))

def horizon(q, h50, beta):
    return h50 * 2 ** (math.log((1 - q) / q) / beta)      # the task length completed with probability q

def months_to(h_now, h_target, doubling):
    return doubling * math.log2(h_target / h_now)`;

export const lesson: LessonContent = {
  id: "l13.5.2",
  minutes: 45,
  links: {
    requires: ["l13.5.1", "l13.3.1"],
    revisits: ["l9.7.1", "l13.1.2"],
    foreshadows: ["l13.5.3"],
  },

  puzzle: (
    <>
      <p>
        A customer-service agent resolves 80% of requests in testing. Deployed, it handles each customer&apos;s request
        several times over a week, as the customer returns with follow-ups, and complaints show that most customers met
        at least one failure. Another agent with the same 80% does much better in deployment. What does a single success
        rate leave out, and what should be measured instead?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A success rate is an average over tasks and over chances. Two agents with the same average can differ in how that
        average is spread: one succeeds on most tasks most of the time, another always on some tasks and never on others.
        When a task is repeated, or a long task is a chain of steps that must all go right, what matters is the chance of
        succeeding every time. That chance falls quickly with repetition and with length, unless the agent can notice and
        undo its own mistakes.
      </p>
      <StepRecoveryViz />
    </>
  ),

  theory: (
    <>
      <Definition title="pass^k">
        <p>
          For a task attempted k times independently, pass@k from the reasoning course asks whether at least one attempt
          succeeds, which suits settings where a checker can choose. pass^k, reported by the τ-bench agent benchmark (Yao
          et al., 2024), asks whether all k succeed, which suits settings where every attempt is used. For a task with
          success probability p it is <M>{"p^k"}</M>; over a benchmark, it is the average of <M>{"p_i^k"}</M> over tasks{" "}
          (<C>benchmark_pass_hat</C>).
        </p>
        <Code>{RELIABLE}</Code>
      </Definition>

      <Theorem title="an unbiased estimate of pass^k">
        <p>
          From n independent trials of a task with c successes, <M>{"\\binom{c}{k} / \\binom{n}{k}"}</M> is an unbiased
          estimate of <M>{"p^k"}</M> for k ≤ n (<C>pass_hat_k</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\binom{c}{k}"}</M> counts the k-element sets of trials that all succeeded. Each of the{" "}
          <M>{"\\binom{n}{k}"}</M> sets of k trials succeeds entirely with probability <M>{"p^k"}</M>, by independence, so by
          linearity of expectation <M>{"\\mathbb{E}\\big[\\binom{c}{k}\\big] = \\binom{n}{k}p^k"}</M>. Dividing by{" "}
          <M>{"\\binom{n}{k}"}</M> gives the claim. The naive estimate <M>{"(c/n)^k"}</M> is biased: for k = 2 its expectation
          is <M>{"p^2 + p(1 - p)/n"}</M>.
        </p>
      </Proof>

      <Theorem title="recovery changes the rate that compounds">
        <p>
          Let a task need m steps. Each attempt at a step fails with probability ε; a failure is noticed with probability r
          and the step is retried, and otherwise it ruins the task. Then each step eventually succeeds with probability
        </p>
        <MD>{"\\frac{1 - \\varepsilon}{1 - \\varepsilon r}"}</MD>
        <p>
          the task succeeds with that to the power m (<C>chain_success</C>), and a step takes{" "}
          <M>{"1/(1 - \\varepsilon r)"}</M> attempts on average.
        </p>
      </Theorem>
      <Proof>
        <p>
          A step succeeds on attempt j + 1 after j noticed failures with probability <M>{"(\\varepsilon r)^j(1 - \\varepsilon)"}</M>;
          summing the geometric series over j ≥ 0 gives <M>{"(1 - \\varepsilon)/(1 - \\varepsilon r)"}</M>. Each attempt
          continues the step with probability εr and ends it otherwise, so the number of attempts is geometric with mean{" "}
          <M>{"1/(1 - \\varepsilon r)"}</M>. Steps are independent, so their probabilities multiply. The per-step loss is{" "}
          <M>{"\\varepsilon(1 - r)/(1 - \\varepsilon r)"}</M>, close to the rate of unnoticed errors <M>{"\\varepsilon(1 - r)"}</M>{" "}
          when ε is small; so noticing errors helps long tasks as much as making fewer of them.
        </p>
      </Proof>

      <Example title="same average, different reliability">
        <p>
          Agent A succeeds on every task with probability 0.8, so its pass^4 is <M>{"0.8^4 \\approx 0.41"}</M>. Agent B always
          solves 80% of the tasks and never solves the rest: pass@1 is again 0.8, but pass^4 is 0.8. In general the
          benchmark&apos;s pass^k is the mean of <M>{"p_i^k"}</M>, and since <M>{"x \\mapsto x^k"}</M> is convex, Jensen&apos;s
          inequality makes it at least <M>{"\\bar p^{\\,k}"}</M>, with equality when every task has the same p. Consistency is
          worth more than it seems: an agent that knows which tasks it can do, and declines the rest, is more useful than
          one that tries everything with a coin toss.
        </p>
      </Example>

      <Definition title="the time horizon">
        <p>
          Kwa et al. (2025), at METR, measured how long tasks take skilled humans and fitted each model&apos;s chance of
          success as a logistic function of the logarithm of that time (<C>success_prob</C>). A model&apos;s 50% time
          horizon is the human time of the tasks it completes half the time; horizons at other levels follow from the fit
          (<C>horizon</C>). Across the models they studied, from 2019 to 2025, the 50% horizon doubled roughly every seven
          months, which makes extrapolation easy to state (<C>months_to</C>) and uncertain to trust. The 80% horizon was
          several times shorter than the 50% one: reliability lags capability.
        </p>
        <Code>{HORIZON}</Code>
      </Definition>

      <Remark title="failing safely">
        <p>
          Reliability also concerns how an agent fails. Claiming success it did not achieve, taking an irreversible action
          after a misunderstanding, or looping until a budget runs out are worse than stopping to ask. Evaluations
          therefore check the final state as well as the agent&apos;s report, count actions that cannot be undone, and test
          whether the agent asks for confirmation when the request is ambiguous.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "hat",
      rung: "check",
      prompt: <p>A task was attempted 10 times with 8 successes. What is the unbiased estimate of pass^3?</p>,
      answer: { kind: "numeric", value: 0.4667, tolerance: 0.001 },
    },
    {
      key: "chain",
      rung: "check",
      prompt: (
        <p>
          A task needs 100 steps. Each attempt at a step fails with probability 0.02, and 90% of failures are noticed and
          retried. What is the chance of completing the task?
        </p>
      ),
      answer: { kind: "numeric", value: 0.8156, tolerance: 0.001 },
    },
    {
      key: "consistent",
      rung: "apply",
      prompt: (
        <p>
          Two agents have the same pass@1 on a benchmark. Agent A&apos;s per-task success probabilities are all near the
          average; agent B&apos;s are near 0 or 1. Which has the higher pass^8?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Agent B, because the mean of p to the eighth power is larger when the probabilities are spread out",
          "Agent A, because it is more consistent across tasks",
          "They are equal, since pass^k depends only on pass@1",
          "It cannot be determined without knowing k",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from math import comb

def pass_hat_k(n, c, k):
    return comb(c, k) / comb(n, k)                         # chance that k trials drawn from the n all succeeded

def benchmark_pass_hat(trials, k):
    return sum(pass_hat_k(n, c, k) for n, c in trials) / len(trials)

def chain_success(eps, r, m):
    step = (1 - eps) / (1 - eps * r)                       # a step succeeds unless an error goes unnoticed
    return step ** m

print(pass_hat_k(4, 3, 2), pass_hat_k(4, 1, 2), benchmark_pass_hat([(4, 4), (4, 2)], 2))
print(round(chain_success(0.1, 0.0, 2), 4), round(chain_success(0.1, 1.0, 50), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.0 0.5833333333333334\n0.81 1.0",
          "0.5625 0.0625 0.5833333333333334\n0.81 1.0",
          "0.5 0.0 0.5833333333333334\n0.81 0.0052",
          "0.5 0.0 0.625\n0.81 1.0",
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

def success_prob(t, h50, beta):
    return 1 / (1 + math.exp(beta * (math.log2(t) - math.log2(h50))))

def horizon(q, h50, beta):
    return h50 * 2 ** (math.log((1 - q) / q) / beta)      # the task length completed with probability q

def months_to(h_now, h_target, doubling):
    return doubling * math.log2(h_target / h_now)

print(success_prob(30, 30, 1.0), round(success_prob(60, 30, 1.0), 4), horizon(0.5, 30, 2.0))
print(round(horizon(0.8, 64, math.log(4)), 4), months_to(15, 120, 7))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.2689 30.0\n32.0 21.0",
          "0.5 0.7311 30.0\n32.0 21.0",
          "0.5 0.2689 30.0\n128.0 21.0",
          "0.5 0.2689 60.0\n32.0 21.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pass_hat_k(n, c, k)</C>; <C>benchmark_pass_hat(trials, k)</C>, the mean over (n, c) pairs;{" "}
          and <C>chain_success(eps, r, m)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from math import comb

def pass_hat_k(n, c, k):
    return (c / n) ** k

def benchmark_pass_hat(trials, k):
    return 0.0

def chain_success(eps, r, m):
    return (1 - eps) ** m
`,
        solution: RELIABLE,
        tests: [
          { name: "hat", code: `assert abs(pass_hat_k(5, 3, 2) - 0.3) < 1e-12 and abs(benchmark_pass_hat([(3, 3), (3, 0)], 2) - 0.5) < 1e-12` },
          { name: "chain", code: `assert abs(chain_success(0.2, 0.5, 2) - (0.8 / 0.9) ** 2) < 1e-12 and chain_success(0.3, 0.0, 0) == 1.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>success_prob(t, h50, beta)</C>, the logistic model in the base-2 logarithm of task time with natural
          exponent; <C>horizon(q, h50, beta)</C>, the task time at which success probability is q; and{" "}
          <C>months_to(h_now, h_target, doubling)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def success_prob(t, h50, beta):
    return 0.5

def horizon(q, h50, beta):
    return h50

def months_to(h_now, h_target, doubling):
    return doubling
`,
        solution: HORIZON,
        tests: [
          { name: "logit", code: `assert abs(success_prob(8, 2, 1.0) - 1 / (1 + math.exp(2))) < 1e-12 and abs(success_prob(horizon(0.9, 10, 0.7), 10, 0.7) - 0.9) < 1e-9` },
          { name: "months", code: `assert abs(months_to(1, 16, 6) - 24) < 1e-12 and abs(horizon(0.2, 10, math.log(4)) - 20) < 1e-9` },
        ],
      },
    },
    {
      key: "h80",
      rung: "stretch",
      prompt: (
        <p>
          A model&apos;s fitted 50% time horizon is 60 minutes, with β = 0.6 in the logistic model above. What is its 80%
          time horizon, in minutes?
        </p>
      ),
      answer: { kind: "numeric", value: 12.0955, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        Retries, repeated attempts and long tasks all buy reliability with tokens. Whether an agent is worth deploying
        depends on what each success costs, which is the last measure.
      </p>
    </>
  ),
};
