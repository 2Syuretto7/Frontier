import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CapabilityEvidenceViz } from "@/components/viz/CapabilityEvidenceViz";
import type { LessonContent } from "@/lib/types";

const RULEOUT = `import math

def binom_cdf(s, n, p):
    return sum(math.comb(n, i) * p**i * (1 - p)**(n - i) for i in range(s + 1))

def rules_out(s, n, p0, alpha=0.05):
    return binom_cdf(s, n, p0) <= alpha                    # so few successes would be unlikely at rate p0

def tasks_needed(p0, alpha=0.05):
    return math.ceil(math.log(alpha) / math.log(1 - p0))   # zero successes in n tasks rules out p0`;

const UPLIFT = `import math

def uplift(ts, tn, cs, cn):
    return ts / tn - cs / cn                               # treatment success rate minus control

def z_stat(ts, tn, cs, cn):
    p = (ts + cs) / (tn + cn)                              # pooled rate under no uplift
    se = math.sqrt(p * (1 - p) * (1 / tn + 1 / cn))
    return (ts / tn - cs / cn) / se

def group_size(p1, p2, za=1.645, zb=0.842):
    var = p1 * (1 - p1) + p2 * (1 - p2)
    return math.ceil((za + zb) ** 2 * var / (p1 - p2) ** 2)`;

export const lesson: LessonContent = {
  id: "l14.5.2",
  minutes: 45,
  links: {
    requires: ["l14.5.1", "l14.3.3"],
    revisits: ["l14.1.3", "l14.4.1"],
    foreshadows: ["l14.5.3"],
  },

  puzzle: (
    <>
      <p>
        A model is given twenty expert-written tasks on synthesising a dangerous pathogen and solves one of them. The
        developer&apos;s policy says the model must not be deployed without extra safeguards if it can solve such tasks
        15% of the time. One in twenty is 5%. Is the model below the threshold, and what would it take to say so with
        confidence?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A capability threshold is only useful if an evaluation can tell which side of it a model is on. The burden of proof
        matters: a responsible scaling policy needs evidence that a model is below a threshold, not merely an absence of
        evidence that it is above. A low score on a small task set is weak evidence, because a model exactly at the
        threshold would often score that low by chance. And the score is a lower bound on capability only if the
        evaluators tried hard to elicit it and the model did not hold back.
      </p>
      <CapabilityEvidenceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="capability thresholds">
        <p>
          Frontier safety frameworks name a small set of domains where a capability could cause severe harm: chemical and
          biological weapons, where the concern is uplift to people who could not otherwise build them; cyber offence;
          autonomous operation, such as acquiring resources and copying itself; and automating AI research, which could
          speed up everything else. Each threshold is stated as a capability, such as substantially helping a novice
          through the steps of producing a known biological threat, and then made operational by evaluations: question
          sets such as WMDP, published in 2024 as a proxy for hazardous knowledge, task suites such as capture-the-flag
          challenges and long agentic tasks, and human uplift trials. Google DeepMind calls its thresholds critical
          capability levels; OpenAI&apos;s Preparedness Framework rates each tracked category against High and Critical
          thresholds.
        </p>
      </Definition>

      <Theorem title="ruling out a threshold">
        <p>
          Suppose the model solves each of n independent tasks with probability p and solves s of them. Reject the
          hypothesis that <M>{"p \\ge p_0"}</M> when
        </p>
        <MD>{"P(\\mathrm{Bin}(n, p_0) \\le s) \\le \\alpha"}</MD>
        <p>
          (<C>binom_cdf</C>, <C>rules_out</C>). This wrongly declares a model below the threshold with probability at most
          α, whatever its true rate is above <M>{"p_0"}</M>. With zero successes the test rejects exactly when{" "}
          <M>{"(1 - p_0)^n \\le \\alpha"}</M>, so the number of tasks needed is{" "}
          <M>{"\\lceil \\ln\\alpha / \\ln(1 - p_0) \\rceil"}</M>, about <M>{"\\ln(1/\\alpha)/p_0"}</M> (<C>tasks_needed</C>).
        </p>
        <Code>{RULEOUT}</Code>
      </Theorem>
      <Proof>
        <p>
          For fixed n and s, <M>{"P(\\mathrm{Bin}(n, p) \\le s)"}</M> is non-increasing in p: couple the two binomials by
          drawing a uniform number per task and counting a success when it falls below p, so raising p can only add
          successes. Hence if the true p is at least <M>{"p_0"}</M>, the chance of seeing s or fewer is at most{" "}
          <M>{"P(\\mathrm{Bin}(n, p_0) \\le s) \\le \\alpha"}</M>. For s = 0 the tail is <M>{"(1 - p_0)^n"}</M>, and{" "}
          <M>{"(1 - p_0)^n \\le \\alpha"}</M> is <M>{"n \\ge \\ln\\alpha / \\ln(1 - p_0)"}</M> since{" "}
          <M>{"\\ln(1 - p_0) < 0"}</M>; finally <M>{"-\\ln(1 - p_0) \\ge p_0"}</M> gives the approximation, which
          slightly overstates n. At α = 0.05 it is the rule of three: zero successes in n tasks bounds the rate by about
          3/n.
        </p>
      </Proof>

      <Example title="the puzzle">
        <p>
          One success in twenty tasks against a threshold of 0.15: a model exactly at the threshold scores one or fewer
          with probability about 0.18, so the evaluation cannot rule the threshold out at the 5% level. Its 95% upper bound
          on the true rate is about 0.22, above the threshold. The viz starts at this case; more tasks, not a better point
          estimate, is what settles it.
        </p>
      </Example>

      <Definition title="uplift trials">
        <p>
          Some thresholds are about people, not models: does access to the model make a novice more likely to complete a
          dangerous task? An uplift trial randomises participants between a control group with ordinary resources, such as
          the internet, and a treatment group that also has the model, and compares success rates (<C>uplift</C>). The
          pooled two-proportion z statistic tests whether the difference could be chance (<C>z_stat</C>), and the usual
          normal approximation gives the group size needed to detect a difference from <M>{"p_1"}</M> to{" "}
          <M>{"p_2"}</M> with one-sided level set by <M>{"z_\\alpha"}</M> and power by <M>{"z_\\beta"}</M>:
        </p>
        <MD>{"n = \\left\\lceil \\frac{(z_\\alpha + z_\\beta)^2\\,[p_1(1-p_1) + p_2(1-p_2)]}{(p_1 - p_2)^2} \\right\\rceil"}</MD>
        <p>
          per group (<C>group_size</C>). Trials of this kind run by RAND and by OpenAI on earlier models found no
          statistically significant uplift, but with groups of tens of participants they could detect only large effects,
          which is the same burden-of-proof problem as before.
        </p>
        <Code>{UPLIFT}</Code>
      </Definition>

      <Remark title="elicitation and sandbagging">
        <p>
          The test above bounds the rate at which the model solved tasks as it was run, not what it can do. Weak prompting,
          no tools or too few samples understate capability, which is why policies require serious elicitation. A worse
          worry is a model that underperforms on purpose. Van der Weij and colleagues showed in 2024 that frontier models
          could be prompted to score lower on hazardous-knowledge questions while keeping their general scores, and could
          be fine-tuned to hide a capability unless given a password; Greenblatt and colleagues found that a little
          fine-tuning on demonstrations usually recovered such locked capabilities. Fine-tuning on the task is therefore a
          standard part of elicitation for models whose weights the evaluator controls, and the deceptive-alignment
          arguments of l14.1.3 are why the question is asked at all.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "tasks",
      rung: "check",
      prompt: (
        <p>
          An evaluator wants zero successes to rule out a success rate of 0.02 at the 1% level. How many independent tasks
          are needed?
        </p>
      ),
      answer: { kind: "numeric", value: 228, tolerance: 0.001 },
    },
    {
      key: "trial",
      rung: "check",
      prompt: (
        <p>
          An uplift trial expects 10% of the control group and 30% of the treatment group to succeed. With{" "}
          <M>{"z_\\alpha = 1.645"}</M> and <M>{"z_\\beta = 0.842"}</M>, how many participants does each group need?
        </p>
      ),
      answer: { kind: "numeric", value: 47, tolerance: 0.001 },
    },
    {
      key: "burden",
      rung: "apply",
      prompt: <p>Why is a low score on a small evaluation weak evidence that a model is below a threshold?</p>,
      answer: {
        kind: "choice",
        options: [
          "A model exactly at the threshold would often score that low by chance, and the score only bounds what was elicited, not what the model can do",
          "Small evaluations always overestimate capability",
          "A low score proves the model is sandbagging",
          "Thresholds are defined on training loss, not on task success",
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

def binom_cdf(s, n, p):
    return sum(math.comb(n, i) * p**i * (1 - p)**(n - i) for i in range(s + 1))

def rules_out(s, n, p0, alpha=0.05):
    return binom_cdf(s, n, p0) <= alpha                    # so few successes would be unlikely at rate p0

def tasks_needed(p0, alpha=0.05):
    return math.ceil(math.log(alpha) / math.log(1 - p0))   # zero successes in n tasks rules out p0

print(round(binom_cdf(1, 3, 0.5), 4), rules_out(0, 10, 0.3), rules_out(1, 10, 0.3))
print(tasks_needed(0.5), tasks_needed(0.1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 True False\n5 29",
          "0.5 True True\n5 29",
          "0.5 False False\n5 29",
          "0.5 True False\n4 28",
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

def uplift(ts, tn, cs, cn):
    return ts / tn - cs / cn                               # treatment success rate minus control

def z_stat(ts, tn, cs, cn):
    p = (ts + cs) / (tn + cn)                              # pooled rate under no uplift
    se = math.sqrt(p * (1 - p) * (1 / tn + 1 / cn))
    return (ts / tn - cs / cn) / se

def group_size(p1, p2, za=1.645, zb=0.842):
    var = p1 * (1 - p1) + p2 * (1 - p2)
    return math.ceil((za + zb) ** 2 * var / (p1 - p2) ** 2)

print(round(uplift(30, 50, 10, 50), 2), round(z_stat(30, 50, 10, 50), 3))
print(group_size(0.2, 0.4), group_size(0.2, 0.4, 2.0, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.4 4.082\n62 90",
          "0.4 4.082\n62 62",
          "-0.4 -4.082\n62 90",
          "0.4 4.082\n31 45",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>binom_cdf(s, n, p)</C>; <C>rules_out(s, n, p0, alpha=0.05)</C>, true when s or fewer successes would
          have probability at most alpha at rate p0; and <C>tasks_needed(p0, alpha=0.05)</C>, the fewest tasks for which
          zero successes rules out p0.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def binom_cdf(s, n, p):
    return 0.0

def rules_out(s, n, p0, alpha=0.05):
    return s == 0

def tasks_needed(p0, alpha=0.05):
    return math.ceil(3 / p0)
`,
        solution: RULEOUT,
        tests: [
          { name: "cdf", code: `assert abs(binom_cdf(0, 2, 0.5) - 0.25) < 1e-12 and abs(binom_cdf(2, 2, 0.3) - 1) < 1e-12 and abs(binom_cdf(1, 4, 0.5) - 0.3125) < 1e-12` },
          { name: "ruleout", code: `assert rules_out(0, 5, 0.5) and not rules_out(0, 4, 0.5) and not rules_out(2, 20, 0.2) and tasks_needed(0.5) == 5 and tasks_needed(0.2, 0.01) == 21` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>uplift(ts, tn, cs, cn)</C>, the treatment success rate minus the control rate;{" "}
          <C>z_stat(ts, tn, cs, cn)</C>, the pooled two-proportion z statistic; and{" "}
          <C>group_size(p1, p2, za=1.645, zb=0.842)</C>, the per-group size from the formula above, rounded up.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def uplift(ts, tn, cs, cn):
    return ts - cs

def z_stat(ts, tn, cs, cn):
    return 0.0

def group_size(p1, p2, za=1.645, zb=0.842):
    return 0
`,
        solution: UPLIFT,
        tests: [
          { name: "uplift", code: `assert abs(uplift(5, 10, 1, 4) - 0.25) < 1e-12 and abs(z_stat(10, 20, 10, 20)) < 1e-12 and abs(z_stat(15, 20, 5, 20) - 10 / math.sqrt(10)) < 1e-9` },
          { name: "size", code: `assert group_size(0.3, 0.5) == 72 and group_size(0.1, 0.3, 2, 1) == 68` },
        ],
      },
    },
    {
      key: "tail",
      rung: "stretch",
      prompt: (
        <p>
          A model solves 2 of 40 independent tasks. If its true rate were exactly 0.15, what would be the probability of 2
          or fewer successes? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0486, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Thresholds, evaluations and schedules each give part of an argument that a model is safe to deploy. The last
        lesson asks how to assemble those parts into one explicit, reviewable argument: a safety case.
      </p>
    </>
  ),
};
