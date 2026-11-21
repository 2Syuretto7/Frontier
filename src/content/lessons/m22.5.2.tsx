import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { NewcombViz } from "@/components/viz/NewcombViz";
import type { LessonContent } from "@/lib/types";

const RULES = `def edt_eu(joint, payoff, a):
    pa = sum(p for (b, s), p in joint.items() if b == a)
    return sum(p / pa * payoff(a, s) for (b, s), p in joint.items() if b == a)    # my act is evidence about s

def cdt_eu(joint, payoff, a):
    states = {s for _, s in joint}
    ps = {s: sum(p for (_, t), p in joint.items() if t == s) for s in states}
    return sum(ps[s] * payoff(a, s) for s in states)          # s is not downstream of the act: P(s | do(a)) = P(s)

def decide(joint, payoff, rule):
    acts = sorted({a for a, _ in joint})
    return max(acts, key=lambda a: rule(joint, payoff, a))`;

const POLICY = `def newcomb_joint(acc, p_one):
    return {("one", "full"): p_one * acc, ("one", "empty"): p_one * (1 - acc),
            ("two", "full"): (1 - p_one) * (1 - acc), ("two", "empty"): (1 - p_one) * acc}

def crossover_accuracy(big, small):
    return (big + small) / (2 * big)                           # above this, conditioning favours one box

def policy_value(p_one, acc, big, small):
    return p_one * acc * big + (1 - p_one) * ((1 - acc) * big + small)   # the predictor reads the policy`;

export const lesson: LessonContent = {
  id: "m22.5.2",
  minutes: 55,
  links: {
    requires: ["m22.5.1", "m22.1.3"],
    revisits: ["m22.3.2", "m22.1.4"],
    foreshadows: ["m22.5.3"],
  },

  puzzle: (
    <>
      <p>
        Two boxes sit on a table. The transparent one holds 1,000 rupees. The opaque one holds 10 lakh rupees if, and only if, a
        predictor who has been right 99% of the time foresaw that you would take only the opaque box. The prediction was made
        yesterday and the boxes are already filled. Taking both boxes gives 1,000 more whatever is inside; yet those who take
        one box almost always walk away rich. Which choice maximises expected utility?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Expected utility needs the probabilities of outcomes given an act, and there are two candidates. Conditioning treats
        your act as evidence: people who one-box are mostly people the predictor expected to one-box, so one-boxing correlates
        with a full box. Intervening treats your act as a cause: nothing you do now changes what is in the box, so the extra
        1,000 is free. In most problems the two agree. Newcomb&apos;s problem is built so that the act and the outcome share a
        cause, your disposition, which is exactly where conditioning and intervening come apart.
      </p>
      <NewcombViz />
    </>
  ),

  theory: (
    <>
      <Definition title="evidential and causal decision theory">
        <p>
          With acts a, states s and utility U(a, s), evidential decision theory (EDT) chooses the act maximising{" "}
          <M>{"\\sum_s P(s \\mid a)U(a, s)"}</M> (<C>edt_eu</C>), and causal decision theory (CDT) the act maximising{" "}
          <M>{"\\sum_s P(s \\mid \\mathrm{do}(a))U(a, s)"}</M> (<C>cdt_eu</C>). When s is not a descendant of the act, as when the
          state was fixed before the choice, <M>{"P(s \\mid \\mathrm{do}(a)) = P(s)"}</M> (m22.1.3).
        </p>
        <Code>{RULES}</Code>
      </Definition>

      <Theorem title="when the theories agree">
        <p>
          If the act is d-separated from the state in the graph with the act&apos;s outgoing arrows removed, that is, the act
          and the state have no common cause, then EDT and CDT assign every act the same expected utility.
        </p>
      </Theorem>
      <Proof>
        <p>
          This is the condition of rule 2 of m22.1.4 with an empty conditioning set, which gives{" "}
          <M>{"P(s \\mid \\mathrm{do}(a)) = P(s \\mid a)"}</M> for every s. The two sums are then term by term equal. A randomised
          choice satisfies the condition, which is why the theories differ only when something else influences both what one
          does and what happens.
        </p>
      </Proof>

      <Example title="Newcomb's problem">
        <p>
          Let D be the agent&apos;s disposition, with arrows from D to the act and to the prediction, and from the prediction to
          the box contents. With predictor accuracy q, big prize B and small prize b, EDT gives one-boxing <M>{"qB"}</M> and
          two-boxing <M>{"(1 - q)B + b"}</M>, so it one-boxes when <M>{"q > (B + b)/(2B)"}</M> (<C>crossover_accuracy</C>, from the
          joint table of <C>newcomb_joint</C>). CDT holds P(full) fixed at whatever it believes, and two-boxing is better by b in
          every case, the dominance argument. CDT agents predictably leave poorer, and they reply that the predictor rewarded
          irrationality, punishing nothing about the choice itself.
        </p>
      </Example>

      <Example title="the smoking lesion">
        <p>
          Suppose a lesion L causes both a desire to smoke and cancer, and smoking itself is harmless and pleasant. Smoking is
          evidence of the lesion, so EDT advises against it; CDT notes that smoking does not cause cancer and advises smoking,
          which most people find correct. The tickle defence answers for EDT: if the lesion acts only through a desire that the
          agent can feel, then conditioning on the felt desire screens off the lesion, and given it the act carries no further
          evidence, so the theories agree again. Newcomb&apos;s problem resists this defence because the predictor reads the
          decision procedure itself, not just a feeling.
        </p>
      </Example>

      <Theorem title="choosing a policy">
        <p>
          If the predictor simulates the agent&apos;s policy, then committing in advance to one-box with probability π yields{" "}
          <M>{"\\pi qB + (1 - \\pi)((1 - q)B + b)"}</M> (<C>policy_value</C>), which is linear in π and maximised at π = 1 exactly when
          q exceeds the crossover accuracy.
        </p>
        <Code>{POLICY}</Code>
      </Theorem>
      <Proof>
        <p>
          With probability π the policy one-boxes, and an accurate prediction then fills the box with probability q; otherwise
          it two-boxes and the box is full with probability 1 − q. The coefficient of π is <M>{"qB - (1 - q)B - b = (2q - 1)B - b"}</M>,
          positive exactly when <M>{"q > (B + b)/(2B)"}</M>.
        </p>
      </Proof>

      <Remark title="functional decision theory and AI">
        <p>
          The policy view treats the decision as the output of a function that may be computed in several places, in the agent
          and in the predictor&apos;s simulation of it. Functional and updateless decision theories (Yudkowsky and Soares, and
          others) make this the definition: intervene on the output of one&apos;s own algorithm everywhere it appears. They
          one-box in Newcomb&apos;s problem and smoke in the smoking lesion, though how to formalise &quot;the same
          function&quot; is unsettled. These questions are concrete for AI systems, which can be copied, run in simulation,
          inspected by others, and placed against copies of themselves, as in a prisoner&apos;s dilemma between twins.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "two",
      rung: "check",
      prompt: (
        <p>
          With prizes 10,00,000 and 1,000 and a predictor that is right 90% of the time, what is the evidential expected payoff of
          taking both boxes?
        </p>
      ),
      answer: { kind: "numeric", value: 101000, tolerance: 0.5 },
    },
    {
      key: "cross",
      rung: "check",
      prompt: <p>With the same prizes, above what predictor accuracy does EDT prefer one box? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.5005, tolerance: 0.00005 },
    },
    {
      key: "agree",
      rung: "apply",
      prompt: <p>An agent chooses between two medicines by flipping a fair coin, then observes the outcome. Why do EDT and CDT assign the same expected utilities to the two medicines here?</p>,
      answer: {
        kind: "choice",
        options: [
          "The coin is the act's only cause, so the act shares no cause with the outcome and conditioning on it equals intervening",
          "Because medicines have no side effects",
          "Because both theories ignore probabilities when a coin is used",
          "Because the outcome is fixed before the choice",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def edt_eu(joint, payoff, a):
    pa = sum(p for (b, s), p in joint.items() if b == a)
    return sum(p / pa * payoff(a, s) for (b, s), p in joint.items() if b == a)    # my act is evidence about s

def cdt_eu(joint, payoff, a):
    states = {s for _, s in joint}
    ps = {s: sum(p for (_, t), p in joint.items() if t == s) for s in states}
    return sum(ps[s] * payoff(a, s) for s in states)          # s is not downstream of the act: P(s | do(a)) = P(s)

def decide(joint, payoff, rule):
    acts = sorted({a for a, _ in joint})
    return max(acts, key=lambda a: rule(joint, payoff, a))

J = {("one", "full"): 0.45, ("one", "empty"): 0.05, ("two", "full"): 0.05, ("two", "empty"): 0.45}; pay = lambda a, s: (100 if s == "full" else 0) + (10 if a == "two" else 0)
print(edt_eu(J, pay, "one"), edt_eu(J, pay, "two"), cdt_eu(J, pay, "two") - cdt_eu(J, pay, "one"), decide(J, pay, edt_eu), decide(J, pay, cdt_eu))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "90.0 20.0 10.0 one two",
          "90.0 20.0 10.0 one one",
          "45.0 10.0 10.0 one two",
          "90.0 20.0 -70.0 one two",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def newcomb_joint(acc, p_one):
    return {("one", "full"): p_one * acc, ("one", "empty"): p_one * (1 - acc),
            ("two", "full"): (1 - p_one) * (1 - acc), ("two", "empty"): (1 - p_one) * acc}

def crossover_accuracy(big, small):
    return (big + small) / (2 * big)                           # above this, conditioning favours one box

def policy_value(p_one, acc, big, small):
    return p_one * acc * big + (1 - p_one) * ((1 - acc) * big + small)   # the predictor reads the policy

print(round(newcomb_joint(0.8, 1.0)[("one", "empty")], 3), crossover_accuracy(100, 10), policy_value(1.0, 0.8, 100, 10), round(policy_value(0.0, 0.8, 100, 10), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.2 0.55 80.0 30.0",
          "0.8 0.55 80.0 30.0",
          "0.2 0.5 80.0 30.0",
          "0.2 0.55 80.0 20.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          A joint table maps (act, state) pairs to probabilities, and the state is not a descendant of the act. Write{" "}
          <C>edt_eu(joint, payoff, a)</C>, <C>cdt_eu(joint, payoff, a)</C> and <C>decide(joint, payoff, rule)</C>, returning the
          best act with ties broken by sorted order.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def edt_eu(joint, payoff, a):
    return sum(p * payoff(a, s) for (b, s), p in joint.items())

def cdt_eu(joint, payoff, a):
    return sum(p * payoff(a, s) for (b, s), p in joint.items() if b == a)

def decide(joint, payoff, rule):
    return sorted({a for a, _ in joint})[0]
`,
        solution: RULES,
        tests: [
          { name: "edt", code: `J = {("one", "full"): 0.45, ("one", "empty"): 0.05, ("two", "full"): 0.05, ("two", "empty"): 0.45}\npay = lambda a, s: (100 if s == "full" else 0) + (1 if a == "two" else 0)\nassert abs(edt_eu(J, pay, "one") - 90) < 1e-9 and abs(edt_eu(J, pay, "two") - 11) < 1e-9` },
          { name: "cdt", code: `J = {("one", "full"): 0.45, ("one", "empty"): 0.05, ("two", "full"): 0.05, ("two", "empty"): 0.45}\npay = lambda a, s: (100 if s == "full" else 0) + (1 if a == "two" else 0)\nassert abs(cdt_eu(J, pay, "two") - cdt_eu(J, pay, "one") - 1) < 1e-9 and abs(cdt_eu(J, pay, "one") - 50) < 1e-9\nassert decide(J, pay, cdt_eu) == "two" and decide(J, pay, edt_eu) == "one"` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>newcomb_joint(acc, p_one)</C> over (act, state) with acts one and two and states full and empty,{" "}
          <C>crossover_accuracy(big, small)</C> and <C>policy_value(p_one, acc, big, small)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def newcomb_joint(acc, p_one):
    return {(a, s): 0.25 for a in ("one", "two") for s in ("full", "empty")}

def crossover_accuracy(big, small):
    return 0.5

def policy_value(p_one, acc, big, small):
    return p_one * big
`,
        solution: POLICY,
        tests: [
          { name: "joint", code: `J = newcomb_joint(0.7, 0.4)\nexp = {("one", "full"): 0.28, ("one", "empty"): 0.12, ("two", "full"): 0.18, ("two", "empty"): 0.42}\nassert all(abs(J[k] - v) < 1e-12 for k, v in exp.items())` },
          { name: "policy", code: `assert abs(crossover_accuracy(1000, 100) - 0.55) < 1e-12 and abs(policy_value(0.5, 0.9, 1000, 100) - 550) < 1e-9` },
        ],
      },
    },
    {
      key: "lesion",
      rung: "stretch",
      prompt: (
        <p>
          In the smoking lesion, P(lesion) = 0.2; P(smoke | lesion) = 0.9 and P(smoke | no lesion) = 0.2; P(cancer | lesion) = 0.8
          and P(cancer | no lesion) = 0.05, whatever one smokes. Smoking is worth 10 and cancer −100. By how much does the
          evidential expected utility of not smoking exceed that of smoking? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 27.433, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Decision theory asks what an agent should do. The last lesson asks what a trained agent will be pushed to do: drawing
        the agent&apos;s decision, its objective and the world as one causal graph shows which variables it has an incentive to
        observe, to influence and to manipulate.
      </p>
    </>
  ),
};
