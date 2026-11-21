import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SafetyCaseViz } from "@/components/viz/SafetyCaseViz";
import type { LessonContent } from "@/lib/types";

const TREE = `import math

def fail_bound(node, indep=False):
    if node[0] == "ev":
        return node[2]                                     # ("ev", name, chance this evidence is wrong)
    bs = [fail_bound(c, indep) for c in node[1]]
    if node[0] == "all":
        return min(1.0, sum(bs))                           # union bound: any failed support breaks the claim
    return math.prod(bs) if indep else min(bs)             # "any": every redundant argument must fail

def set_leaf(node, name, p):
    if node[0] == "ev":
        return ("ev", name, p) if node[1] == name else node
    return (node[0], [set_leaf(c, name, p) for c in node[1]])

def weakest_link(node, indep=False):
    def names(n):
        return [n[1]] if n[0] == "ev" else [x for c in n[1] for x in names(c)]
    base = fail_bound(node, indep)
    return max(names(node), key=lambda nm: base - fail_bound(set_leaf(node, nm, 0.0), indep))`;

const DEPTH = `import math

def both_fail(p1, p2, rho):
    return p1 * p2 + rho * math.sqrt(p1 * (1 - p1) * p2 * (1 - p2))   # correlated misses

def total_risk(p, n):
    return 1 - (1 - p) ** n                                # at least one failure in n independent uses

def max_deployments(p, target):
    return math.floor(math.log(1 - target) / math.log(1 - p))`;

export const lesson: LessonContent = {
  id: "l14.5.3",
  minutes: 45,
  links: {
    requires: ["l14.5.2", "l14.4.2"],
    revisits: ["l14.4.3", "l14.5.1"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        A developer has evaluation results showing its model cannot carry out a cyber attack on its own, two monitors that
        each catch most attempted sabotage, and a security team guarding the weights. A regulator asks a simple question:
        how confident are you that deploying this model is safe, and which piece of evidence, if it turned out wrong, would
        change your answer? Answering requires putting the pieces into one argument that someone else can check.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A safety case is a structured argument, supported by evidence, that a system is acceptably safe for a given use in a
        given setting. Aviation, nuclear power and railways have required them for decades. The argument is a tree: the top
        claim is broken into subclaims until each rests on evidence. Two shapes recur. Some claims need all of their
        supports, so a weakness anywhere weakens the whole; others have redundant supports, so they fail only when every
        support fails, but only if the supports do not fail together.
      </p>
      <SafetyCaseViz />
    </>
  ),

  theory: (
    <>
      <Definition title="safety cases for AI">
        <p>
          Safety engineering writes safety cases as claims, arguments and evidence, often drawn in Goal Structuring
          Notation. Clymer and colleagues proposed in 2024 four kinds of argument for AI systems: inability, that the
          model cannot cause the harm even if it tried, supported by evaluations like those of the last lesson; control,
          that safeguards would stop it even if it tried, supported by control evaluations as in l14.4.2; trustworthiness,
          that it would not try, which needs evidence about its goals that current methods cannot yet give reliably; and
          deference, relying on the judgement of trusted AI systems. The UK AI Security Institute has published templates
          for inability arguments, and responsible scaling policies increasingly ask for safety cases at their higher
          levels.
        </p>
      </Definition>

      <Theorem title="bounding the failure of an argument">
        <p>
          Give each piece of evidence a probability that it is wrong. A claim with all-of supports fails only if at least
          one support fails, so its failure probability is at most the sum of theirs. A claim with any-of supports fails
          only if all supports fail, so its failure probability is at most the smallest of theirs, and equals their
          product when the supports fail independently (<C>fail_bound</C>). Applying these rules from the leaves up bounds
          the failure probability of the top claim, and setting one leaf to zero shows how much that leaf contributes
          (<C>set_leaf</C>, <C>weakest_link</C>).
        </p>
        <Code>{TREE}</Code>
      </Theorem>
      <Proof>
        <p>
          For all-of supports with failure events <M>{"F_1, \\dots, F_m"}</M>, the claim fails only on{" "}
          <M>{"\\bigcup_i F_i"}</M>, and <M>{"P(\\bigcup_i F_i) \\le \\sum_i P(F_i)"}</M> by the union bound. For any-of
          supports, the claim fails only on <M>{"\\bigcap_i F_i"}</M>, which is contained in each <M>{"F_i"}</M>, so its
          probability is at most <M>{"\\min_i P(F_i)"}</M>, and equals <M>{"\\prod_i P(F_i)"}</M> under independence.
          Induction from the leaves upwards, using that each rule is increasing in its inputs, carries the bounds to the
          root. The bound is only as good as the leaf probabilities, which are themselves judgements, and the product rule
          is only as good as the independence assumption.
        </p>
      </Proof>

      <Theorem title="correlated defences">
        <p>
          Let two defences miss an attack with probabilities <M>{"p_1, p_2"}</M>, and let their miss indicators have
          correlation ρ. Then both miss with probability
        </p>
        <MD>{"P(\\text{both miss}) = p_1 p_2 + \\rho\\sqrt{p_1(1-p_1)\\,p_2(1-p_2)}"}</MD>
        <p>
          (<C>both_fail</C>). Over n independent uses with failure probability p each, the chance of at least one failure
          is <M>{"1 - (1-p)^n"}</M> (<C>total_risk</C>), so keeping it below a target bounds the number of uses{" "}
          (<C>max_deployments</C>).
        </p>
        <Code>{DEPTH}</Code>
      </Theorem>
      <Proof>
        <p>
          For indicators X and Y with means <M>{"p_1, p_2"}</M>, <M>{"E[XY] = P(\\text{both miss})"}</M> and{" "}
          <M>{"\\mathrm{Cov}(X, Y) = E[XY] - p_1 p_2 = \\rho\\,\\sigma_X \\sigma_Y"}</M> with{" "}
          <M>{"\\sigma_X^2 = p_1(1-p_1)"}</M> and likewise for Y. Rearranging gives the formula. For the second part,
          independence gives no failure in n uses with probability <M>{"(1-p)^n"}</M>, and{" "}
          <M>{"1 - (1-p)^n \\le t"}</M> is <M>{"n \\le \\ln(1-t)/\\ln(1-p)"}</M>, since both logarithms are negative.
        </p>
      </Proof>

      <Example title="two monitors">
        <p>
          Two monitors each miss 10% of attacks. Independent, they both miss 1%. With correlation 1 they always miss
          together, and the pair is no better than one: 10%. Monitors trained on similar data, or a policy model that
          finds a blind spot both share, sit between these. A safety case that multiplies miss rates without evidence of
          independence overstates its confidence, often by an order of magnitude.
        </p>
      </Example>

      <Remark title="what safety cases can and cannot do">
        <p>
          A safety case makes assumptions explicit, so that reviewers, auditors or regulators can attack the weakest one
          rather than the overall impression. Its known failure modes come from older industries: confirmation bias in
          building the argument, evidence that goes stale as the system or its use changes, and numbers on leaves that
          are guesses dressed as measurements. For frontier models the hardest gap is the trustworthiness argument; until
          interpretability or other methods can support it, cases for the most capable models must rest on inability and
          control, and the monitoring of reasoning in l14.4.3 is one of the few pieces of evidence that bears on intent.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "corr",
      rung: "check",
      prompt: (
        <p>
          One monitor misses 20% of attacks, another misses 10%, and their misses have correlation 0.3. What is the
          probability that both miss? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.056, tolerance: 0.0005 },
    },
    {
      key: "uses",
      rung: "check",
      prompt: (
        <p>
          Each deployment of a system has an independent 0.0001 chance of a catastrophic failure. How many deployments can
          be made while keeping the total chance of at least one failure at or below 5%?
        </p>
      ),
      answer: { kind: "numeric", value: 512, tolerance: 0.001 },
    },
    {
      key: "kinds",
      rung: "apply",
      prompt: <p>Which argument claims that safeguards would stop a model from causing harm even if it tried?</p>,
      answer: {
        kind: "choice",
        options: ["A control argument", "An inability argument", "A trustworthiness argument", "A deference argument"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def fail_bound(node, indep=False):
    if node[0] == "ev":
        return node[2]                                     # ("ev", name, chance this evidence is wrong)
    bs = [fail_bound(c, indep) for c in node[1]]
    if node[0] == "all":
        return min(1.0, sum(bs))                           # union bound: any failed support breaks the claim
    return math.prod(bs) if indep else min(bs)             # "any": every redundant argument must fail

def set_leaf(node, name, p):
    if node[0] == "ev":
        return ("ev", name, p) if node[1] == name else node
    return (node[0], [set_leaf(c, name, p) for c in node[1]])

def weakest_link(node, indep=False):
    def names(n):
        return [n[1]] if n[0] == "ev" else [x for c in n[1] for x in names(c)]
    base = fail_bound(node, indep)
    return max(names(node), key=lambda nm: base - fail_bound(set_leaf(node, nm, 0.0), indep))

tree = ("all", [("ev", "a", 0.01), ("any", [("ev", "b", 0.1), ("ev", "c", 0.3)]), ("ev", "d", 0.04)])
print(round(fail_bound(tree, True), 4), round(fail_bound(tree), 4), weakest_link(tree, True), weakest_link(tree))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.08 0.15 d b", "0.08 0.15 b b", "0.08 0.08 d d", "0.15 0.08 b d"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def both_fail(p1, p2, rho):
    return p1 * p2 + rho * math.sqrt(p1 * (1 - p1) * p2 * (1 - p2))   # correlated misses

def total_risk(p, n):
    return 1 - (1 - p) ** n                                # at least one failure in n independent uses

def max_deployments(p, target):
    return math.floor(math.log(1 - target) / math.log(1 - p))

print(round(both_fail(0.1, 0.1, 0), 4), round(both_fail(0.1, 0.1, 1), 4))
print(round(total_risk(0.01, 10), 4), max_deployments(0.01, 0.1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.01 0.1\n0.0956 10", "0.01 0.19\n0.0956 10", "0.01 0.1\n0.1 10", "0.01 0.1\n0.0956 11"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          A node is (&quot;ev&quot;, name, p), (&quot;all&quot;, children) or (&quot;any&quot;, children). Write{" "}
          <C>fail_bound(node, indep=False)</C>, capping all-of sums at 1; <C>set_leaf(node, name, p)</C>, returning a copy
          with that leaf&apos;s probability replaced; and <C>weakest_link(node, indep=False)</C>, the leaf name whose removal
          most lowers the bound, the first in left-to-right order on ties.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def fail_bound(node, indep=False):
    return 0.0

def set_leaf(node, name, p):
    return node

def weakest_link(node, indep=False):
    return None
`,
        solution: TREE,
        tests: [
          { name: "bound", code: `t = ("all", [("ev", "x", 0.6), ("any", [("ev", "y", 0.5), ("ev", "z", 0.4)])])\nassert abs(fail_bound(t) - 1.0) < 1e-12 and abs(fail_bound(t, True) - 0.8) < 1e-12 and abs(fail_bound(t[1][1]) - 0.4) < 1e-12` },
          { name: "link", code: `t = ("all", [("ev", "x", 0.1), ("any", [("ev", "y", 0.5), ("ev", "z", 0.4)])])\nassert set_leaf(t, "y", 0.2)[1][1][1][0] == ("ev", "y", 0.2) and weakest_link(t) == "y" and weakest_link(t, True) == "y" and weakest_link(set_leaf(t, "z", 0.1)) == "x"` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>both_fail(p1, p2, rho)</C>, <C>total_risk(p, n)</C> and <C>max_deployments(p, target)</C>, the largest
          number of independent uses whose total risk is at most target.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def both_fail(p1, p2, rho):
    return p1 * p2

def total_risk(p, n):
    return p * n

def max_deployments(p, target):
    return int(target / p)
`,
        solution: DEPTH,
        tests: [
          { name: "both", code: `assert abs(both_fail(0.5, 0.5, 0.5) - 0.375) < 1e-12 and abs(both_fail(0.2, 0.2, 0) - 0.04) < 1e-12` },
          { name: "risk", code: `assert abs(total_risk(0.5, 3) - 0.875) < 1e-12 and max_deployments(0.5, 0.8) == 2 and max_deployments(0.1, 0.5) == 6` },
        ],
      },
    },
    {
      key: "case",
      rung: "stretch",
      prompt: (
        <p>
          A safety case needs an inability claim (fails with probability 0.01), a security claim (0.005), and a control
          claim that holds if either of two monitors catches an attack. The monitors miss 10% and 20% of attacks, with
          correlation 0.5. What is the union bound on the failure probability of the whole case? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.095, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        This course has followed the problem of aligning AI systems from its failure modes, through oversight, robustness,
        model organisms and control, to the policies and arguments that decide what is deployed. The research and thesis
        course that follows is where these questions can become a project of your own.
      </p>
    </>
  ),
};
