import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RiskCurveViz } from "@/components/viz/RiskCurveViz";
import type { LessonContent } from "@/lib/types";

const LOTTERY = `def expected_utility(lottery, u):
    return sum(p * u(x) for p, x in lottery)

def certainty_equivalent(lottery, u, u_inv):
    return u_inv(expected_utility(lottery, u))                 # the sure amount with the same utility

def best_action(actions, u):
    return max(actions, key=lambda a: expected_utility(actions[a], u))`;

const INFO = `def eu_decide(p, U):
    eu = {a: sum(pi * ui for pi, ui in zip(p, U[a])) for a in U}
    best = max(eu, key=eu.get)
    return best, eu[best]

def evpi(p, U):
    informed = sum(pi * max(U[a][s] for a in U) for s, pi in enumerate(p))   # choose after seeing the state
    return informed - eu_decide(p, U)[1]

def evsi(p, U, lik):
    total = 0.0
    for o in range(len(lik[0])):
        joint = [p[s] * lik[s][o] for s in range(len(p))]
        po = sum(joint)
        if po > 0:
            total += po * eu_decide([j / po for j in joint], U)[1]          # act on the posterior
    return total - eu_decide(p, U)[1]`;

export const lesson: LessonContent = {
  id: "m22.5.1",
  minutes: 55,
  links: {
    requires: ["m22.1.3", "m7.6.1"],
    revisits: ["m9.2.3", "m7.4.1"],
    foreshadows: ["m22.5.2"],
  },

  puzzle: (
    <>
      <p>
        Offered a sure 4.5 lakh rupees or a coin flip between 1 lakh and 9 lakh, most people take the sure amount, though the
        flip is worth 5 lakh on average. Is that irrational? And is there any principled way to choose under uncertainty at
        all, or is maximising an expectation just a convenient habit? A small set of consistency conditions on preferences
        answers both questions.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If preferences over gambles are complete, transitive, continuous, and unaffected by mixing both options with the same
        third gamble, then there is a utility function such that one gamble is preferred to another exactly when its expected
        utility is higher. The utility need not be the money. A concave utility values each extra rupee less than the last, so
        a gamble is worth less than its expected value: the gap is the price of risk. The same framework values information
        by how much it improves the decision, and that value is never negative.
      </p>
      <RiskCurveViz />
    </>
  ),

  theory: (
    <>
      <Definition title="lotteries and the axioms">
        <p>
          A lottery is a probability distribution over a finite set of outcomes, and <M>{"pL + (1 - p)L'"}</M> is the compound
          lottery. A preference <M>{"\\succeq"}</M> on lotteries satisfies the von Neumann–Morgenstern axioms if it is complete
          and transitive; continuous (if <M>{"L \\succ L' \\succ L''"}</M> then{" "}
          <M>{"L' \\sim pL + (1 - p)L''"}</M> for some p in [0, 1]); and independent (<M>{"L \\succeq L'"}</M> if and only if{" "}
          <M>{"pL + (1 - p)L'' \\succeq pL' + (1 - p)L''"}</M> for every L″ and p in (0, 1]).
        </p>
      </Definition>

      <Theorem title="expected utility (von Neumann and Morgenstern)">
        <p>
          A preference satisfies the axioms if and only if there is <M>{"u"}</M> on outcomes with{" "}
          <M>{"L \\succeq L' \\iff \\sum_x L(x)u(x) \\ge \\sum_x L'(x)u(x)"}</M> (<C>expected_utility</C>, <C>best_action</C>). The
          function u is unique up to <M>{"u \\mapsto au + b"}</M> with a &gt; 0.
        </p>
        <Code>{LOTTERY}</Code>
      </Theorem>
      <Proof>
        <p>
          Let B and W be a best and a worst outcome, with <M>{"B \\succ W"}</M> (otherwise all are indifferent and any constant
          works). For each outcome x, continuity gives a <M>{"u(x)"}</M> with <M>{"x \\sim u(x)B + (1 - u(x))W"}</M>. By
          independence, replacing each outcome of L by its equivalent gamble between B and W, one at a time, does not change
          its standing, and the result is the lottery giving B with probability <M>{"\\sum_x L(x)u(x)"}</M> and W otherwise.
          Independence also shows that between two such lotteries the one with the larger chance of B is preferred: write the
          better as a mixture of the worse and B. So L is ranked by its expected utility. For uniqueness, any other
          representation v must give <M>{"v(x) = u(x)v(B) + (1 - u(x))v(W)"}</M>, an increasing affine function of u. The converse
          is a direct check.
        </p>
      </Proof>

      <Definition title="risk attitude">
        <p>
          For money outcomes, the certainty equivalent of L is the sure amount c with <M>{"u(c) = \\mathbb{E}_L[u(X)]"}</M>{" "}
          (<C>certainty_equivalent</C>), and the risk premium is <M>{"\\mathbb{E}_L[X] - c"}</M>. By Jensen&apos;s inequality, a
          concave u gives a nonnegative premium for every lottery, and a convex u a nonpositive one. Near a point, the premium
          for a small risk of variance <M>{"\\sigma^2"}</M> is about <M>{"\\tfrac12\\sigma^2(-u''/u')"}</M>, the Arrow–Pratt
          measure of risk aversion. In the puzzle, <M>{"u = \\sqrt{x}"}</M> gives expected utility 2 and certainty equivalent 4,
          so the sure 4.5 is better.
        </p>
      </Definition>

      <Example title="the Allais paradox">
        <p>
          Many people prefer a sure 1 million to a lottery giving 5 million with probability 0.10, 1 million with 0.89 and
          nothing with 0.01; and also prefer 5 million with probability 0.10 to 1 million with probability 0.11. Writing u for
          utilities, the first says <M>{"0.11u(1) > 0.10u(5) + 0.01u(0)"}</M> and the second says the opposite. Both pairs differ
          only by a common 0.89 chance of 1 million, or of nothing, so the choices violate independence. Whether this is an
          error or a reason to weaken the axiom is debated; for a designed agent, independence is what makes plans consistent
          over time.
        </p>
      </Example>

      <Theorem title="information never hurts an expected utility maximiser">
        <p>
          With states s of prior probability p(s), actions a and utilities U(a, s), let the decision be made after seeing a signal
          o with likelihood p(o | s). The expected value of sample information{" "}
          <M>{"\\sum_o p(o)\\max_a \\mathbb{E}[U(a, S) \\mid o] - \\max_a \\mathbb{E}[U(a, S)]"}</M> (<C>evsi</C>) is nonnegative,
          and is largest, equal to the expected value of perfect information (<C>evpi</C>), when o reveals s.
        </p>
        <Code>{INFO}</Code>
      </Theorem>
      <Proof>
        <p>
          For any fixed action a,{" "}
          <M>{"\\sum_o p(o)\\max_{a'}\\mathbb{E}[U(a', S) \\mid o] \\ge \\sum_o p(o)\\,\\mathbb{E}[U(a, S) \\mid o] = \\mathbb{E}[U(a, S)]"}</M>{" "}
          by the tower property (m7.6.1); take a to be the best uninformed action (<C>eu_decide</C>). Any signal is a coarsening
          of the state, so by the same argument conditioning on s gives at least as much as conditioning on o.
        </p>
      </Proof>

      <Remark title="decisions in machine learning">
        <p>
          Bayes decision rules (m9.2.3) are expected utility maximisers with utility minus loss, which is why calibrated
          probabilities matter: thresholds are chosen from utilities, not from accuracy. Reinforcement learning maximises
          expected return, an expected utility over trajectories. The theorem says nothing about which outcomes an agent should
          value, or about how its actions affect the probabilities it conditions on. The next lesson shows that this second gap
          is where decision theories part ways.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ce",
      rung: "check",
      prompt: <p>With utility <M>{"u(x) = \\sqrt{x}"}</M>, what is the certainty equivalent of a 50% chance of 100 and a 50% chance of 0?</p>,
      answer: { kind: "numeric", value: 25, tolerance: 0.0005 },
    },
    {
      key: "evpi",
      rung: "check",
      prompt: (
        <p>
          Two states have probabilities 0.3 and 0.7. Action A pays 100 in the first state and 0 in the second; action B pays 20
          and 40. With utility equal to payoff, what is the expected value of perfect information?
        </p>
      ),
      answer: { kind: "numeric", value: 24, tolerance: 0.0005 },
    },
    {
      key: "affine",
      rung: "apply",
      prompt: <p>Two analysts describe the same preferences with utilities u and 3u + 7. Which statement is right?</p>,
      answer: {
        kind: "choice",
        options: [
          "They rank every pair of lotteries the same way, since the representation is unique only up to positive affine maps",
          "The second analyst is more risk averse",
          "Their certainty equivalents differ by 7",
          "The second analyst violates the independence axiom",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def expected_utility(lottery, u):
    return sum(p * u(x) for p, x in lottery)

def certainty_equivalent(lottery, u, u_inv):
    return u_inv(expected_utility(lottery, u))                 # the sure amount with the same utility

def best_action(actions, u):
    return max(actions, key=lambda a: expected_utility(actions[a], u))

import math; L = [(0.5, 1.0), (0.5, 9.0)]
print(expected_utility(L, math.sqrt), certainty_equivalent(L, math.sqrt, lambda v: v * v), best_action({"sure": [(1.0, 4.5)], "bet": L}, math.sqrt), best_action({"sure": [(1.0, 4.5)], "bet": L}, lambda x: x))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.0 4.0 sure bet",
          "2.0 5.0 sure bet",
          "2.0 4.0 bet bet",
          "2.236 5.0 bet bet",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def eu_decide(p, U):
    eu = {a: sum(pi * ui for pi, ui in zip(p, U[a])) for a in U}
    best = max(eu, key=eu.get)
    return best, eu[best]

def evpi(p, U):
    informed = sum(pi * max(U[a][s] for a in U) for s, pi in enumerate(p))   # choose after seeing the state
    return informed - eu_decide(p, U)[1]

def evsi(p, U, lik):
    total = 0.0
    for o in range(len(lik[0])):
        joint = [p[s] * lik[s][o] for s in range(len(p))]
        po = sum(joint)
        if po > 0:
            total += po * eu_decide([j / po for j in joint], U)[1]          # act on the posterior
    return total - eu_decide(p, U)[1]

p, U = [0.5, 0.5], {"go": [6, -2], "stay": [1, 1]}
print(eu_decide(p, U), evpi(p, U), evsi(p, U, [[0.5, 0.5], [0.5, 0.5]]), evsi(p, U, [[1, 0], [0, 1]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "('go', 2.0) 1.5 0.0 1.5",
          "('go', 2.0) 1.5 1.5 1.5",
          "('stay', 1.0) 2.5 0.0 2.5",
          "('go', 2.0) 3.5 0.0 3.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          A lottery is a list of (probability, outcome) pairs. Write <C>expected_utility(lottery, u)</C>,{" "}
          <C>certainty_equivalent(lottery, u, u_inv)</C> and <C>best_action(actions, u)</C> for a dict of named lotteries.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def expected_utility(lottery, u):
    return u(sum(p * x for p, x in lottery))

def certainty_equivalent(lottery, u, u_inv):
    return sum(p * x for p, x in lottery)

def best_action(actions, u):
    return max(actions, key=lambda a: sum(p * x for p, x in actions[a]))
`,
        solution: LOTTERY,
        tests: [
          { name: "eu", code: `import math\nL = [(0.25, 0.0), (0.75, 64.0)]\nassert abs(expected_utility(L, math.sqrt) - 6) < 1e-12 and abs(certainty_equivalent(L, math.sqrt, lambda v: v * v) - 36) < 1e-9` },
          { name: "best", code: `import math\nA = {"safe": [(1.0, 40.0)], "risky": [(0.5, 0.0), (0.5, 100.0)]}\nassert best_action(A, math.sqrt) == "safe" and best_action(A, lambda x: x) == "risky"` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With a list p of state probabilities and a dict U from action to its list of utilities by state, write{" "}
          <C>eu_decide(p, U)</C> returning (best action, its expected utility), <C>evpi(p, U)</C> and <C>evsi(p, U, lik)</C> where{" "}
          <C>lik[s][o]</C> is the probability of signal o in state s.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def eu_decide(p, U):
    a = next(iter(U))
    return a, 0.0

def evpi(p, U):
    return 0.0

def evsi(p, U, lik):
    return 0.0
`,
        solution: INFO,
        tests: [
          { name: "evpi", code: `U = {"a": [10, 0], "b": [0, 8]}\nassert eu_decide([0.5, 0.5], U) == ("a", 5.0) and abs(evpi([0.5, 0.5], U) - 4) < 1e-12` },
          { name: "evsi", code: `U = {"a": [10, 0], "b": [0, 8]}\nassert abs(evsi([0.5, 0.5], U, [[0.8, 0.2], [0.2, 0.8]]) - 2.2) < 1e-9 and abs(evsi([0.5, 0.5], U, [[1, 0], [0, 1]]) - 4) < 1e-9` },
        ],
      },
    },
    {
      key: "log",
      rung: "stretch",
      prompt: (
        <p>
          With utility <M>{"u(x) = \\ln x"}</M>, what is the risk premium of a lottery paying 25 or 400 with equal probability?
        </p>
      ),
      answer: { kind: "numeric", value: 112.5, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Expected utility needs probabilities of outcomes given actions. Should those be conditional probabilities, which treat
        one&apos;s own choice as evidence, or interventional ones, which treat it as a cause? Usually the two agree. The next
        lesson studies problems where they do not, beginning with Newcomb&apos;s.
      </p>
    </>
  ),
};
