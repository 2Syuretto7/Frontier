import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RuleOutViz } from "@/components/viz/RuleOutViz";
import type { LessonContent } from "@/lib/types";

const BOUND = `import math

def binom_cdf(k, n, p):
    return sum(math.comb(n, i) * p ** i * (1 - p) ** (n - i) for i in range(k + 1))

def upper_bound(k, n, alpha=0.05):
    lo, hi = k / n, 1.0
    for _ in range(60):
        mid = (lo + hi) / 2
        if binom_cdf(k, n, mid) > alpha:
            lo = mid
        else:
            hi = mid
    return hi

def trials_to_rule_out(p_max, alpha=0.05):
    return math.ceil(math.log(alpha) / math.log(1 - p_max))`;

const UPLIFT = `import math

def mean_diff_se(treated, control):
    stats = []
    for xs in (treated, control):
        m = sum(xs) / len(xs)
        stats.append((m, sum((x - m) ** 2 for x in xs) / (len(xs) - 1) / len(xs)))
    return stats[0][0] - stats[1][0], math.sqrt(stats[0][1] + stats[1][1])

def uplift_upper(treated, control, z=1.645):
    d, se = mean_diff_se(treated, control)
    return d + z * se

def rules_out(treated, control, max_uplift, z=1.645):
    return uplift_upper(treated, control, z) < max_uplift`;

export const lesson: LessonContent = {
  id: "l10.5.1",
  minutes: 50,
  links: {
    requires: ["l10.4.3", "m9.5.1"],
    revisits: ["l10.2.4", "m9.4.1", "l9.8.3"],
    foreshadows: ["l10.5.2", "l10.5.3", "l14.3.3"],
  },

  puzzle: (
    <>
      <p>
        Before releasing a frontier model, developers test whether it could meaningfully help someone carry out a cyberattack, acquire
        a biological weapon, or operate autonomously beyond human control. These evaluations differ from ordinary benchmarks in one
        crucial way: the decision they inform usually depends on showing that a capability is absent or below a threshold. A model
        that fails 40 attempts at a hard intrusion task has not shown it cannot do it. How much evidence does a safety case need?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A capability evaluation estimates a rate: how often the model succeeds at a dangerous task, or how much it improves a person&apos;s
        chances. For a release decision the relevant number is not the estimate but its upper confidence bound, because the claim to
        defend is &quot;the rate is below the threshold&quot;. Few trials give loose bounds, so claiming absence takes many trials, a
        well-elicited model, and a margin for what the evaluation might have missed.
      </p>
      <RuleOutViz />
    </>
  ),

  theory: (
    <>
      <Definition title="threat models and thresholds">
        <p>
          A dangerous-capability evaluation starts from a threat model: who might misuse the model, for what, and which step the model
          would make easier. Frontier developers&apos; frameworks, such as Anthropic&apos;s Responsible Scaling Policy, OpenAI&apos;s Preparedness
          Framework and Google DeepMind&apos;s Frontier Safety Framework, tie capability thresholds in areas like cyber-offence, biological
          and chemical weapons, and autonomous AI research to required safeguards. Evaluations are tasks standing in for steps of a
          threat model: capture-the-flag challenges for cyber-offence, expert-written questions and protocol troubleshooting for
          biology, and long agentic tasks for autonomy.
        </p>
      </Definition>

      <Theorem title="the exact upper bound">
        <p>
          After k successes in n independent trials, the one-sided <M>{"1-\\alpha"}</M> Clopper–Pearson upper bound is the p at which{" "}
          <M>{"P(X \\le k \\mid n, p) = \\alpha"}</M>. For k = 0 it is <M>{"1 - \\alpha^{1/n} \\approx -\\ln\\alpha / n"}</M>, about 3/n at
          α = 0.05, and ruling out a rate p with no successes needs <M>{"n \\ge \\ln\\alpha / \\ln(1-p)"}</M> trials.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"P(X \\le k \\mid p)"}</M> decreases continuously in p, so the equation has one root, found by bisection (<C>upper_bound</C>,
          with <C>binom_cdf</C>). Any p above it would make k or fewer successes less likely than α, so it is rejected; the bound is the
          largest rate still consistent with the data. With k = 0 the equation is <M>{"(1-p)^n = \\alpha"}</M>, giving the closed form, and{" "}
          <M>{"-\\ln(1-p) \\approx p"}</M> gives the rule of three since <M>{"-\\ln 0.05 \\approx 3.0"}</M>. Requiring the bound to be below p
          and solving for n gives the trial count (<C>trials_to_rule_out</C>).
        </p>
        <Code>{BOUND}</Code>
      </Proof>

      <Definition title="uplift studies">
        <p>
          For misuse, the question is often not whether the model can do a task alone but how much it helps a person. An uplift study
          randomises participants to work with the model or with ordinary resources such as the internet, scores their output, and
          estimates the difference (<C>mean_diff_se</C>). The safety claim is that uplift is below some maximum, so again the upper
          bound matters (<C>uplift_upper</C>, <C>rules_out</C>). Such studies are expensive, with tens of participants, so they are often
          underpowered (l10.2.4): a non-significant result is weak evidence of no uplift.
        </p>
        <Code>{UPLIFT}</Code>
      </Definition>

      <Remark title="margins">
        <p>
          A safety case adds margins on top of the statistics. Evaluations are proxies for real attacks; the model may do better with
          more effort spent on prompting and tooling (l10.5.2) or may deliberately underperform (l10.5.3); and capability grows between
          one evaluation and the next. Frameworks therefore set warning thresholds below the level of real concern and re-evaluate as
          models are scaled up. Reporting should give the trials, the successes, the bound and the elicitation effort, not only a pass
          or fail.
        </p>
      </Remark>

      <Example title="a thin result">
        <p>
          A model solves 0 of 20 expert-level capture-the-flag challenges. The 95% upper bound on its solve rate is{" "}
          <M>{"1 - 0.05^{1/20} \\approx 14\\%"}</M>. If the threshold of concern is a 5% solve rate, the evaluation is inconclusive: it
          cannot rule out a capability several times the threshold.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "bound",
      rung: "check",
      prompt: (
        <p>
          A model succeeds in 0 of 60 attempts at a dangerous task. What is the exact one-sided 95% upper bound on its success rate? Give
          three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.049, tolerance: 0.001 },
    },
    {
      key: "trials",
      rung: "check",
      prompt: (
        <p>
          How many independent trials with no successes are needed to show, at the 95% level, that the success rate is below 1%?
        </p>
      ),
      answer: { kind: "numeric", value: 299, tolerance: 0 },
    },
    {
      key: "null",
      rung: "apply",
      prompt: (
        <p>
          An uplift study with 12 participants per arm finds no statistically significant difference between those using the model and
          those using only the internet. What can be concluded?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Little: the upper confidence bound on uplift is probably wide, so meaningful uplift has not been ruled out",
          "The model provides no uplift",
          "The model provides uplift, but it is too small to matter",
          "The study shows the internet is as useful as the model for every task",
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

def binom_cdf(k, n, p):
    return sum(math.comb(n, i) * p ** i * (1 - p) ** (n - i) for i in range(k + 1))

def upper_bound(k, n, alpha=0.05):
    lo, hi = k / n, 1.0
    for _ in range(60):
        mid = (lo + hi) / 2
        if binom_cdf(k, n, mid) > alpha:
            lo = mid
        else:
            hi = mid
    return hi

def trials_to_rule_out(p_max, alpha=0.05):
    return math.ceil(math.log(alpha) / math.log(1 - p_max))

print(binom_cdf(0, 2, 0.5), binom_cdf(1, 3, 0.5), round(upper_bound(0, 1, 0.25), 3))
print(trials_to_rule_out(0.5, 0.25), trials_to_rule_out(0.5, 0.2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.25 0.5 0.75\n2 3",
          "0.25 0.5 0.25\n2 3",
          "0.25 0.375 0.75\n2 3",
          "0.25 0.5 0.75\n2 2",
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

def mean_diff_se(treated, control):
    stats = []
    for xs in (treated, control):
        m = sum(xs) / len(xs)
        stats.append((m, sum((x - m) ** 2 for x in xs) / (len(xs) - 1) / len(xs)))
    return stats[0][0] - stats[1][0], math.sqrt(stats[0][1] + stats[1][1])

def uplift_upper(treated, control, z=1.645):
    d, se = mean_diff_se(treated, control)
    return d + z * se

def rules_out(treated, control, max_uplift, z=1.645):
    return uplift_upper(treated, control, z) < max_uplift

print(mean_diff_se([1, 3], [0, 0]), uplift_upper([1, 3], [0, 0], z=0.0))
print(rules_out([2, 2], [1, 1], 1.5), rules_out([2, 2], [1, 1], 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(2.0, 1.0) 2.0\nTrue False",
          "(2.0, 1.414) 2.0\nTrue False",
          "(2.0, 1.0) 3.0\nTrue False",
          "(2.0, 1.0) 2.0\nFalse False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>binom_cdf(k, n, p)</C>, <C>upper_bound(k, n, alpha=0.05)</C> by bisection between k/n and 1 for 60 steps, returning the
          upper end, and <C>trials_to_rule_out(p_max, alpha=0.05)</C>, rounded up.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def binom_cdf(k, n, p):
    return 1.0

def upper_bound(k, n, alpha=0.05):
    return 3 / n

def trials_to_rule_out(p_max, alpha=0.05):
    return round(3 / p_max)
`,
        solution: BOUND,
        tests: [
          { name: "bound", code: `assert abs(binom_cdf(1, 4, 0.5) - 0.3125) < 1e-12 and abs(upper_bound(2, 50) - 0.1206141554) < 1e-8 and abs(upper_bound(0, 10) - 0.2588655509) < 1e-8` },
          { name: "trials", code: `assert trials_to_rule_out(0.02) == 149 and trials_to_rule_out(0.1, 0.01) == 44` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mean_diff_se(treated, control)</C>, returning the difference in means and its standard error from n − 1 variances,{" "}
          <C>uplift_upper(treated, control, z=1.645)</C>, and <C>rules_out(treated, control, max_uplift, z=1.645)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def mean_diff_se(treated, control):
    return 0.0, 0.0

def uplift_upper(treated, control, z=1.645):
    return 0.0

def rules_out(treated, control, max_uplift, z=1.645):
    return True
`,
        solution: UPLIFT,
        tests: [
          { name: "diff", code: `d, se = mean_diff_se([3, 5, 4], [1, 2, 3])\nassert abs(d - 2) < 1e-12 and abs(se - 0.8164965809) < 1e-9` },
          { name: "upper", code: `assert abs(uplift_upper([3, 5, 4], [1, 2, 3]) - 3.3431368756) < 1e-9 and not rules_out([3, 5, 4], [1, 2, 3], 3.0) and rules_out([3, 5, 4], [1, 2, 3], 3.5)` },
        ],
      },
    },
    {
      key: "uplift",
      rung: "stretch",
      prompt: (
        <p>
          An uplift study estimates the improvement in task score from using the model as 0.08, with standard error 0.05. What is the
          one-sided 95% upper bound on the uplift (z = 1.645)? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.162, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every bound here assumed the trials showed what the model can do. The next lesson asks how hard evaluators must try, with
        prompting, tools, fine-tuning and sampling, before a failure means anything.
      </p>
    </>
  ),
};
