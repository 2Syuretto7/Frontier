import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MissingMassViz } from "@/components/viz/MissingMassViz";
import type { LessonContent } from "@/lib/types";

const CAMPAIGN = `from collections import Counter

def failure_types(findings):
    return Counter(findings)

def good_turing_new(findings):
    ones = sum(1 for c in failure_types(findings).values() if c == 1)
    return ones / len(findings)                            # estimated chance the next finding is a new kind

def diversity(findings):
    return len(failure_types(findings)) / len(findings)`;

const BOUNDS = `import math

def upper_bound_zero(n, conf=0.95):
    return 1 - (1 - conf) ** (1 / n)                       # largest rate with chance >= 1 - conf of n clean trials

def rule_of_three(n):
    return 3 / n

def trials_for_bound(p, conf):
    return math.ceil(math.log(1 - conf) / math.log(1 - p) - 1e-9)`;

export const lesson: LessonContent = {
  id: "l14.3.3",
  minutes: 45,
  links: {
    requires: ["l14.3.2", "l9.6.3"],
    revisits: ["l9.8.3", "l14.1.3"],
    foreshadows: ["l14.3.4", "l14.5.2"],
  },

  puzzle: (
    <>
      <p>
        Before release, a team spends a month trying to make a model misbehave. They log 2,000 successful attacks, which
        fall into a few hundred distinct kinds; in the last week they were still finding new kinds every day. In a second
        test, they make 1,000 attempts to extract a particular kind of dangerous help and none succeed. What do these
        results say about what remains undiscovered, and how small a failure rate does a clean record prove?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Red-teaming is a search for failures by people, by models, or both, and its results are a sample. Two questions
        follow. How much of the space of failures has been explored? The kinds of failure seen only once are the best
        guide: if many findings are one-offs, the next finding is likely to be new too. How rare must a failure be to
        survive many clean attempts? Not very: n clean attempts only rule out rates much above 3 in n. Red-teaming finds
        problems well; it proves their absence poorly.
      </p>
      <MissingMassViz />
    </>
  ),

  theory: (
    <>
      <Definition title="red-teaming">
        <p>
          Red-teaming is adversarial testing before and after deployment. Ganguli et al. (2022) released tens of thousands
          of human red-team attacks and found that models trained with human feedback became harder to red-team as they
          grew, while other model types did not. Perez et al. (2022) used a language model to generate test inputs and a
          classifier to flag harmful replies, finding tens of thousands of offensive replies in a large chatbot, and showed
          a trade-off: methods that found failures most often found less diverse ones. Frontier developers add domain
          experts who probe specific dangerous capabilities, such as assistance with biological or cyber attacks. A
          campaign&apos;s findings can be grouped by kind (<C>failure_types</C>, <C>diversity</C>).
        </p>
        <Code>{CAMPAIGN}</Code>
      </Definition>

      <Theorem title="the chance of a new kind of failure">
        <p>
          Let findings be independent draws from kinds with probabilities <M>{"p_1, p_2, \\dots"}</M>, let{" "}
          <M>{"M_n"}</M> be the total probability of kinds not seen in the first n findings, and let{" "}
          <M>{"N_1^{(m)}"}</M> be the number of kinds seen exactly once in the first m. Then
        </p>
        <MD>{"\\mathbb{E}[M_n] = \\frac{\\mathbb{E}\\big[N_1^{(n+1)}\\big]}{n + 1}"}</MD>
        <p>
          so the Good–Turing estimate <M>{"N_1/n"}</M>, the share of findings whose kind appeared once, estimates the chance
          that the next finding is a new kind (<C>good_turing_new</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          Kind i is unseen after n findings with probability <M>{"(1 - p_i)^n"}</M>, so by linearity{" "}
          <M>{"\\mathbb{E}[M_n] = \\sum_i p_i(1 - p_i)^n"}</M>. Kind i appears exactly once in n + 1 findings with
          probability <M>{"(n + 1)p_i(1 - p_i)^n"}</M>, so <M>{"\\mathbb{E}[N_1^{(n+1)}] = (n + 1)\\sum_i p_i(1 - p_i)^n"}</M>.
          Dividing gives the identity. Using n rather than n + 1 findings changes the estimate by a term of order 1/n.
          Turing and Good devised it to estimate unseen German cipher settings; here it estimates unseen failure modes.
        </p>
      </Proof>

      <Theorem title="what a clean record proves">
        <p>
          If each of n independent attempts succeeds with probability p and none succeed, the one-sided upper confidence
          bound at level 1 − α is
        </p>
        <MD>{"p_{\\max} = 1 - \\alpha^{1/n} \\le \\frac{\\ln(1/\\alpha)}{n}"}</MD>
        <p>
          which for α = 0.05 is about 3/n, the rule of three (<C>upper_bound_zero</C>, <C>rule_of_three</C>). Showing{" "}
          <M>{"p < p_0"}</M> at that level needs <M>{"n \\ge \\ln\\alpha / \\ln(1 - p_0)"}</M> clean attempts{" "}
          (<C>trials_for_bound</C>).
        </p>
        <Code>{BOUNDS}</Code>
      </Theorem>
      <Proof>
        <p>
          The chance of n clean attempts is <M>{"(1 - p)^n"}</M>. The rates for which this chance is at least α, and which
          therefore the data cannot reject at level α, are those with <M>{"(1 - p)^n \\ge \\alpha"}</M>, that is{" "}
          <M>{"p \\le 1 - \\alpha^{1/n}"}</M>. Writing <M>{"\\alpha^{1/n} = e^{-x}"}</M> with <M>{"x = \\ln(1/\\alpha)/n"}</M>{" "}
          and using <M>{"1 - e^{-x} \\le x"}</M> gives the bound, and <M>{"\\ln 20 \\approx 3.0"}</M>. Solving{" "}
          <M>{"(1 - p_0)^n \\le \\alpha"}</M> for n gives the count. Both assume the attempts are independent and
          representative; a red team that keeps trying variations of one idea has effectively made fewer attempts, and real
          adversaries may try things no red team did.
        </p>
      </Proof>

      <Remark title="red-teaming in practice">
        <p>
          Useful campaigns mix people with different expertise and automated attackers, record findings by kind, track
          how fast new kinds still appear, and feed every finding into training data, classifiers or policy. Their results
          are most informative about capabilities, where one success shows the model can do something, and least
          informative about rare behaviour, where no number of clean attempts shows it never will. This asymmetry is why
          the capability thresholds of the last chapter are usually tested by trying hard to elicit a capability rather than
          by sampling ordinary use.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "gt",
      rung: "check",
      prompt: (
        <p>
          A campaign has 200 successful attacks. Of the kinds of failure found, 30 appeared exactly once. What is the
          estimated chance that the next successful attack is a new kind?
        </p>
      ),
      answer: { kind: "numeric", value: 0.15, tolerance: 0.001 },
    },
    {
      key: "zero",
      rung: "check",
      prompt: (
        <p>
          None of 1,000 independent attempts succeeds. What is the exact 95% upper confidence bound on the per-attempt
          success rate?
        </p>
      ),
      answer: { kind: "numeric", value: 0.002991, tolerance: 0.00001 },
    },
    {
      key: "asym",
      rung: "apply",
      prompt: <p>Why is red-teaming better at showing a model can do something than that it never will?</p>,
      answer: {
        kind: "choice",
        options: [
          "One success demonstrates a capability, while n clean attempts only bound the failure rate at about 3/n",
          "Red teams are biased toward finding capabilities",
          "Failures are always common",
          "Confidence bounds do not apply to language models",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from collections import Counter

def failure_types(findings):
    return Counter(findings)

def good_turing_new(findings):
    ones = sum(1 for c in failure_types(findings).values() if c == 1)
    return ones / len(findings)                            # estimated chance the next finding is a new kind

def diversity(findings):
    return len(failure_types(findings)) / len(findings)

f = ["bio", "cyber", "bio", "self-harm", "bio", "fraud"]; print(failure_types(f).most_common(2), good_turing_new(f), round(diversity(f), 4))
print(good_turing_new(["a", "a", "b", "b"]), diversity(["x"]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[('bio', 3), ('cyber', 1)] 0.5 0.6667\n0.0 1.0",
          "[('bio', 3), ('cyber', 1)] 0.6667 0.5\n0.0 1.0",
          "[('bio', 3), ('fraud', 1)] 0.5 0.6667\n0.0 1.0",
          "[('bio', 3), ('cyber', 1)] 0.5 0.6667\n0.5 1.0",
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

def upper_bound_zero(n, conf=0.95):
    return 1 - (1 - conf) ** (1 / n)                       # largest rate with chance >= 1 - conf of n clean trials

def rule_of_three(n):
    return 3 / n

def trials_for_bound(p, conf):
    return math.ceil(math.log(1 - conf) / math.log(1 - p) - 1e-9)

print(round(upper_bound_zero(100), 4), rule_of_three(100), round(upper_bound_zero(1, 0.5), 4))
print(trials_for_bound(0.5, 0.75), trials_for_bound(0.01, 0.95))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0295 0.03 0.5\n2 299",
          "0.0295 0.03 0.5\n2 298",
          "0.03 0.03 0.5\n2 299",
          "0.0295 0.03 0.25\n2 299",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>failure_types(findings)</C>, a Counter of kinds; <C>good_turing_new(findings)</C>; and{" "}
          <C>diversity(findings)</C>, the number of distinct kinds per finding.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from collections import Counter

def failure_types(findings):
    return Counter()

def good_turing_new(findings):
    return 0.0

def diversity(findings):
    return 1.0
`,
        solution: CAMPAIGN,
        tests: [
          { name: "types", code: `assert failure_types(["a", "b", "a"]) == Counter({"a": 2, "b": 1}) and diversity(["a", "b", "a", "a"]) == 0.5` },
          { name: "gt", code: `assert good_turing_new(["a", "b", "c", "c"]) == 0.5 and good_turing_new(["z", "z"]) == 0.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>upper_bound_zero(n, conf=0.95)</C>, <C>rule_of_three(n)</C>, and <C>trials_for_bound(p, conf)</C>, the
          fewest clean attempts that rule out a rate of p or more at confidence conf.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def upper_bound_zero(n, conf=0.95):
    return 0.0

def rule_of_three(n):
    return 1 / n

def trials_for_bound(p, conf):
    return 1
`,
        solution: BOUNDS,
        tests: [
          { name: "bound", code: `assert abs(upper_bound_zero(2, 0.75) - 0.5) < 1e-12 and rule_of_three(30) == 0.1` },
          { name: "trials", code: `assert trials_for_bound(0.5, 0.875) == 3 and trials_for_bound(0.1, 0.0) == 0` },
        ],
      },
    },
    {
      key: "many",
      rung: "stretch",
      prompt: (
        <p>
          How many clean, independent attempts are needed to show at 99% confidence that a failure rate is below 1 in
          10,000?
        </p>
      ),
      answer: { kind: "numeric", value: 46050, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every failure red-teaming finds is a training example. Adversarial training folds the attacks back into training,
        which makes models harder to break; whether it ever makes them unbreakable is the question of the next lesson.
      </p>
    </>
  ),
};
