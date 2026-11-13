import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ExplainAwayViz } from "@/components/viz/ExplainAwayViz";
import type { LessonContent } from "@/lib/types";

const INDEP = `from itertools import combinations

def prob(event, pmf):
    return sum(p for w, p in pmf.items() if w in event)

def mutually_independent(pmf, events):
    for k in range(2, len(events) + 1):
        for group in combinations(events, k):
            lhs = prob(set.intersection(*group), pmf)
            rhs = 1
            for E in group:
                rhs *= prob(E, pmf)
            if abs(lhs - rhs) > 1e-12:
                return False
    return True`;

const AWAY = `from itertools import product

def independent_joint(ps):
    pmf = {}
    for w in product((0, 1), repeat=len(ps)):
        p = 1.0
        for bit, q in zip(w, ps):
            p *= q if bit else 1 - q
        pmf[w] = p
    return pmf

def explain_away(pb, pe):
    pmf = independent_joint([pb, pe])
    alarm = [w for w in pmf if w[0] or w[1]]
    pa = sum(pmf[w] for w in alarm)
    pb_a = sum(pmf[w] for w in alarm if w[0]) / pa
    pb_ae = sum(pmf[w] for w in alarm if w[0] and w[1]) / sum(pmf[w] for w in alarm if w[1])
    return pb_a, pb_ae`;

export const lesson: LessonContent = {
  id: "m7.1.5",
  minutes: 60,
  links: {
    requires: ["m7.1.4"],
    revisits: ["m4.6.2"],
    foreshadows: ["m7.2.2", "m7.5.1", "m7.7.1"],
  },

  puzzle: (
    <>
      <p>
        Burglaries and earthquakes have nothing to do with each other, and either one sets off your alarm. The alarm goes
        off, and the radio then reports an earthquake. Should that news change how likely you think a burglary is? If the two
        were independent, surely not. Yet it plainly should.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Independence says that learning one event tells you nothing about another: P(A | B) = P(A). It is a property of the
        probabilities, not of physical causation, and it can be created or destroyed by conditioning. Two independent causes
        become dependent once you know their common effect, and two dependent tosses of an unknown coin become independent
        once you know which coin it is.
      </p>
      <ExplainAwayViz />
    </>
  ),

  theory: (
    <>
      <Definition title="independence">
        <p>
          Events A and B are independent if <M>{"P(A \\cap B) = P(A)P(B)"}</M>. A family of events is (mutually) independent
          if for every finite subfamily <M>{"A_{i_1}, \\dots, A_{i_k}"}</M>,{" "}
          <M>{"P(A_{i_1} \\cap \\cdots \\cap A_{i_k}) = P(A_{i_1})\\cdots P(A_{i_k})"}</M>.
        </p>
      </Definition>

      <Example title="pairwise is not enough">
        <p>
          Toss two fair coins. Let A = &ldquo;first is heads&rdquo;, B = &ldquo;second is heads&rdquo;, C = &ldquo;they
          differ&rdquo;. Each has probability 1/2 and each pair meets with probability 1/4, so they are pairwise independent.
          But A ∩ B ∩ C is empty, while the product is 1/8: any two of them determine the third.
        </p>
        <Code>{INDEP}</Code>
      </Example>

      <Theorem title="complements">
        <p>
          If A and B are independent, so are A and Bᶜ, and Aᶜ and Bᶜ. More generally, replacing any members of an
          independent family by their complements leaves it independent. Hence for independent{" "}
          <M>{"A_1, \\dots, A_n"}</M>, <M>{"P(\\bigcup A_i) = 1 - \\prod(1 - P(A_i))"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"P(A \\cap B^c) = P(A) - P(A \\cap B) = P(A) - P(A)P(B) = P(A)P(B^c)"}</M>. Applying this again with the roles
          swapped gives Aᶜ and Bᶜ. For a family, the same subtraction works one event at a time inside any finite
          subfamily: <M>{"P(A_1^c \\cap D) = P(D) - P(A_1 \\cap D)"}</M> with D an intersection of the others. The union
          formula is the complement of <M>{"\\bigcap A_i^c"}</M>.
        </p>
      </Proof>

      <Definition title="conditional independence">
        <p>
          A and B are conditionally independent given C (with P(C) &gt; 0) if{" "}
          <M>{"P(A \\cap B \\mid C) = P(A \\mid C)P(B \\mid C)"}</M>: independence under the probability{" "}
          <M>{"P(\\cdot \\mid C)"}</M>.
        </p>
      </Definition>

      <Remark title="neither implies the other">
        <p>
          A coin is drawn from a bag holding a fair coin and one with P(heads) = 0.9, then tossed twice. Given the coin, the
          tosses are independent. Without knowing the coin they are not: a first head makes the biased coin more likely and so
          raises the chance of a second head from 0.7 to about 0.757. In the other direction, burglary and earthquake are
          independent, but given the alarm they are dependent, as the figure shows. Graphical models are a systematic
          bookkeeping of exactly these two effects.
        </p>
        <Code>{AWAY}</Code>
      </Remark>

      <Theorem title="Borel–Cantelli">
        <p>
          Let <M>{"\\{A_n \\text{ i.o.}\\} = \\bigcap_m \\bigcup_{n \\ge m}A_n"}</M>, the event that infinitely many of the{" "}
          <M>{"A_n"}</M> occur. (1) If <M>{"\\sum P(A_n) < \\infty"}</M> then <M>{"P(A_n \\text{ i.o.}) = 0"}</M>. (2) If the{" "}
          <M>{"A_n"}</M> are independent and <M>{"\\sum P(A_n) = \\infty"}</M> then <M>{"P(A_n \\text{ i.o.}) = 1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          (1) The sets <M>{"U_m = \\bigcup_{n \\ge m}A_n"}</M> decrease to the event, so by continuity and the union bound its
          probability is <M>{"\\lim_m P(U_m) \\le \\lim_m \\sum_{n \\ge m}P(A_n) = 0"}</M>, the tail of a convergent series.
        </p>
        <p>
          (2) The complement is <M>{"\\bigcup_m \\bigcap_{n \\ge m}A_n^c"}</M>, so it suffices that each{" "}
          <M>{"\\bigcap_{n \\ge m}A_n^c"}</M> has probability 0. By continuity and independence of the complements, its
          probability is <M>{"\\lim_N \\prod_{n=m}^{N}(1 - P(A_n)) \\le \\lim_N \\exp(-\\sum_{n=m}^{N}P(A_n)) = 0"}</M>.
        </p>
      </Proof>
      <p>
        With independent trials, an event of fixed positive probability therefore happens infinitely often: a random
        typist produces any given sentence, again and again. Without independence the second half fails: if every{" "}
        <M>{"A_n"}</M> is the same event A with P(A) = 1/2, the sum diverges but the probability is 1/2.
      </p>
    </>
  ),

  practice: [
    {
      key: "union",
      rung: "check",
      prompt: <p>A and B are independent with P(A) = 0.3 and P(B) = 0.5. What is P(A ∪ B)?</p>,
      answer: { kind: "numeric", value: 0.65, tolerance: 0.0001 },
    },
    {
      key: "coin",
      rung: "check",
      prompt: (
        <p>
          A coin is drawn at random from a fair coin and a coin with P(heads) = 0.9, and tossed twice. What is P(second is heads
          | first is heads)? Give four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.7571, tolerance: 0.0001 },
    },
    {
      key: "disjoint",
      rung: "apply",
      prompt: <p>A and B are disjoint and each has positive probability. Which is true?</p>,
      answer: {
        kind: "choice",
        options: ["They are dependent.", "They are independent.", "They may or may not be independent.", "They are independent given A ∪ B."],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import combinations

def prob(event, pmf):
    return sum(p for w, p in pmf.items() if w in event)

def mutually_independent(pmf, events):
    for k in range(2, len(events) + 1):
        for group in combinations(events, k):
            lhs = prob(set.intersection(*group), pmf)
            rhs = 1
            for E in group:
                rhs *= prob(E, pmf)
            if abs(lhs - rhs) > 1e-12:
                return False
    return True

pmf = {(a, b): 0.25 for a in (0, 1) for b in (0, 1)}
A, B, C = {(1, 0), (1, 1)}, {(0, 1), (1, 1)}, {(0, 1), (1, 0)}
print(mutually_independent(pmf, [A, B]), mutually_independent(pmf, [B, C]), mutually_independent(pmf, [A, B, C]))
print(prob(A & B & C, pmf), prob(A, pmf) * prob(B, pmf) * prob(C, pmf))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["True True False\n0 0.125", "True True True\n0 0.125", "True True False\n0.25 0.125", "False False False\n0 0.125"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import product

def independent_joint(ps):
    pmf = {}
    for w in product((0, 1), repeat=len(ps)):
        p = 1.0
        for bit, q in zip(w, ps):
            p *= q if bit else 1 - q
        pmf[w] = p
    return pmf

def explain_away(pb, pe):
    pmf = independent_joint([pb, pe])
    alarm = [w for w in pmf if w[0] or w[1]]
    pa = sum(pmf[w] for w in alarm)
    pb_a = sum(pmf[w] for w in alarm if w[0]) / pa
    pb_ae = sum(pmf[w] for w in alarm if w[0] and w[1]) / sum(pmf[w] for w in alarm if w[1])
    return pb_a, pb_ae

j = independent_joint([0.1, 0.5, 0.2])
print(len(j), round(j[(1, 0, 1)], 4), round(sum(j.values()), 6))
print([round(x, 4) for x in explain_away(0.1, 0.2)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["8 0.01 1.0\n[0.3571, 0.1]", "8 0.016 1.0\n[0.3571, 0.1]", "8 0.01 1.0\n[0.3571, 0.3571]", "6 0.01 1.0\n[0.1, 0.1]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>prob(event, pmf)</C> and <C>mutually_independent(pmf, events)</C>, which checks the product rule for every
          subfamily of two or more events (with tolerance 1e-12).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from itertools import combinations

def prob(event, pmf):
    return sum(p for w, p in pmf.items() if w in event)

def mutually_independent(pmf, events):
    return True
`,
        solution: INDEP,
        tests: [
          { name: "pairwise but not mutual", code: `pmf = {(a, b): 0.25 for a in (0, 1) for b in (0, 1)}
A, B, C = {(1, 0), (1, 1)}, {(0, 1), (1, 1)}, {(0, 1), (1, 0)}
assert mutually_independent(pmf, [A, B]) and mutually_independent(pmf, [A, C])
assert not mutually_independent(pmf, [A, B, C])` },
          { name: "three dice", code: `pmf = {(a, b, c): 1 / 216 for a in range(6) for b in range(6) for c in range(6)}
E = [{w for w in pmf if w[i] < 2} for i in range(3)]
assert mutually_independent(pmf, E)
F = E + [{w for w in pmf if w[0] + w[1] < 2}]
assert not mutually_independent(pmf, F)
pmf2 = {(0, 0): 0.3, (0, 1): 0.2, (1, 0): 0.3, (1, 1): 0.2}
assert mutually_independent(pmf2, [{(1, 0), (1, 1)}, {(0, 1), (1, 1)}])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>independent_joint(ps)</C>, the joint pmf over 0/1 tuples of independent events with probabilities ps, and{" "}
          <C>explain_away(pb, pe)</C>, which, for independent causes with these probabilities and alarm = either cause, returns
          (P(B | alarm), P(B | alarm and E)) computed from that joint pmf.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from itertools import product

def independent_joint(ps):
    return {}

def explain_away(pb, pe):
    return pb, pb
`,
        solution: AWAY,
        tests: [
          { name: "joint", code: `j = independent_joint([0.1, 0.5, 0.2])
assert len(j) == 8 and abs(sum(j.values()) - 1) < 1e-12
assert abs(j[(1, 0, 1)] - 0.01) < 1e-12 and abs(j[(0, 0, 0)] - 0.36) < 1e-12
assert abs(sum(p for w, p in j.items() if w[2]) - 0.2) < 1e-12` },
          { name: "explaining away", code: `a, b = explain_away(0.1, 0.2)
assert abs(a - 0.1 / 0.28) < 1e-12 and abs(b - 0.1) < 1e-12
a, b = explain_away(0.3, 0.6)
assert abs(a - 0.3 / 0.72) < 1e-12 and abs(b - 0.3) < 1e-12 and a > 0.3` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove the first Borel–Cantelli lemma: if <M>{"\\sum_n P(A_n) < \\infty"}</M>, then the probability that infinitely
          many of the <M>{"A_n"}</M> occur is 0.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes the event as ∩ₘ Uₘ with Uₘ = ∪_{n ≥ m} Aₙ, or otherwise notes it is contained in every Uₘ.",
          "Bounds P(Uₘ) ≤ Σ_{n ≥ m} P(Aₙ) by the union bound.",
          "Notes the tail of a convergent series tends to 0, and concludes (by monotonicity or continuity) that the probability is 0.",
        ],
      },
    },
    {
      key: "none",
      rung: "stretch",
      prompt: (
        <p>
          Independent events <M>{"A_1, A_2, \\dots"}</M> have <M>{"P(A_n) = 1/(n+1)^2"}</M>. What is the probability that none
          of them occurs?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what independence of several events means, why pairwise independence is not enough, how conditioning can create or destroy independence, and what the Borel–Cantelli lemmas say.",

  glimpse: (
    <>
      <p>
        Independence of events extends to independence of random variables, the assumption behind the binomial and
        geometric distributions of the next chapter and behind every i.i.d. sample in statistics. The second Borel–Cantelli
        lemma is the first taste of the limit theorems at the end of the course, where independence makes averages settle
        down.
      </p>
    </>
  ),
};
