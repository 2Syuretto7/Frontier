import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { UnionRangeViz } from "@/components/viz/UnionRangeViz";
import type { LessonContent } from "@/lib/types";

const IE = `from itertools import combinations

def prob(event, pmf):
    return sum(pmf[w] for w in event)

def inclusion_exclusion(events, pmf):
    total = 0.0
    for k in range(1, len(events) + 1):
        for group in combinations(events, k):
            inter = set.intersection(*map(set, group))
            total += (-1) ** (k + 1) * prob(inter, pmf)
    return total`;

const MATCH = `from fractions import Fraction
from math import factorial, prod

def no_match_prob(n):
    return sum(Fraction((-1) ** k, factorial(k)) for k in range(n + 1))

def union_range(ps):
    lo = max(ps)
    hi = min(1.0, sum(ps))
    indep = 1 - prod(1 - p for p in ps)
    return lo, indep, hi`;

export const lesson: LessonContent = {
  id: "m7.1.1",
  minutes: 55,
  links: {
    requires: ["m4.6.1", "m1.8.4"],
    revisits: ["m0.8.3"],
    foreshadows: ["m7.1.2", "m7.1.3", "m7.3.1"],
  },

  puzzle: (
    <>
      <p>
        Toss a fair coin until the first head. What is the probability that this takes an even number of tosses? There are
        infinitely many outcomes, none of them equally likely, so counting favourable cases cannot work. What rules is a
        probability allowed to follow, and which answers do those rules force?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Think of probability as mass spread over the outcomes, a total of 1. An event is a region, and its probability is the
        mass it holds. Mass adds over disjoint regions, including countably many of them, and that single rule produces
        everything else: complements, overlaps, the union bound, and the answer to the puzzle. But the rules do not decide
        how events overlap, so they often give only a range.
      </p>
      <UnionRangeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="probability space">
        <p>
          A probability space is a triple (Ω, 𝓕, P). Ω is the sample space. 𝓕 is a collection of subsets of Ω, the events,
          which contains Ω and is closed under complements and countable unions (a σ-algebra). P: 𝓕 → [0, 1] satisfies the
          Kolmogorov axioms: P(Ω) = 1, and for pairwise disjoint events <M>{"A_1, A_2, \\dots"}</M>,
        </p>
        <MD>{"P\\Big(\\bigcup_{n=1}^{\\infty}A_n\\Big) = \\sum_{n=1}^{\\infty}P(A_n)."}</MD>
      </Definition>

      <Remark title="why 𝓕 and not every subset">
        <p>
          When Ω is countable, 𝓕 can be every subset and P is just a list of non-negative masses <M>{"p(\\omega)"}</M> adding
          to 1. For Ω = [0, 1] with &ldquo;length&rdquo; as probability, no countably additive P can be defined on every
          subset, as the earlier lesson on uncountable sets showed, so events must be restricted. In practice every set you
          can describe is an event.
        </p>
      </Remark>

      <Theorem title="first consequences">
        <p>
          P(∅) = 0. Finite additivity holds. <M>{"P(A^c) = 1 - P(A)"}</M>. If A ⊆ B then P(A) ≤ P(B). And{" "}
          <M>{"P(A \\cup B) = P(A) + P(B) - P(A \\cap B)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Taking every <M>{"A_n = \\varnothing"}</M> gives <M>{"P(\\varnothing) = \\sum P(\\varnothing)"}</M>, which forces
          P(∅) = 0; then padding a finite disjoint family with empty sets gives finite additivity. A and{" "}
          <M>{"A^c"}</M> are disjoint with union Ω, so their probabilities add to 1. If A ⊆ B then B is the disjoint union of A
          and B \ A, so P(B) = P(A) + P(B \ A) ≥ P(A). Finally A ∪ B is the disjoint union of A and B \ A, while B is the
          disjoint union of A ∩ B and B \ A; subtracting gives the last formula.
        </p>
      </Proof>

      <Theorem title="union bound and continuity">
        <p>
          For any events, <M>{"P(\\bigcup_n A_n) \\le \\sum_n P(A_n)"}</M>. If <M>{"A_1 \\subseteq A_2 \\subseteq \\cdots"}</M>{" "}
          then <M>{"P(\\bigcup_n A_n) = \\lim_n P(A_n)"}</M>, and if <M>{"A_1 \\supseteq A_2 \\supseteq \\cdots"}</M> then{" "}
          <M>{"P(\\bigcap_n A_n) = \\lim_n P(A_n)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"B_n = A_n \\setminus (A_1 \\cup \\dots \\cup A_{n-1})"}</M>. The <M>{"B_n"}</M> are disjoint, have the same
          union as the <M>{"A_n"}</M>, and <M>{"B_n \\subseteq A_n"}</M>. So{" "}
          <M>{"P(\\bigcup A_n) = \\sum P(B_n) \\le \\sum P(A_n)"}</M>. If the <M>{"A_n"}</M> increase, then{" "}
          <M>{"A_N = B_1 \\cup \\dots \\cup B_N"}</M>, so <M>{"P(A_N) = \\sum_{n \\le N}P(B_n)"}</M>, whose limit is{" "}
          <M>{"\\sum_n P(B_n) = P(\\bigcup A_n)"}</M>. For decreasing events apply this to the increasing complements.
        </p>
      </Proof>

      <Example title="the puzzle">
        <p>
          The event &ldquo;first head on toss k&rdquo; has probability <M>{"2^{-k}"}</M>, and these events are disjoint. So
          the probability of an even number of tosses is{" "}
          <M>{"\\sum_{j \\ge 1}2^{-2j} = \\tfrac{1/4}{1 - 1/4} = \\tfrac{1}{3}"}</M>, by countable additivity. The event
          &ldquo;never a head&rdquo; is the decreasing intersection of &ldquo;no head in the first n tosses&rdquo;, so by
          continuity it has probability <M>{"\\lim 2^{-n} = 0"}</M>.
        </p>
      </Example>

      <Theorem title="inclusion–exclusion">
        <p>For events <M>{"A_1, \\dots, A_n"}</M>,</p>
        <MD>{"P\\Big(\\bigcup_{i=1}^{n}A_i\\Big) = \\sum_{k=1}^{n}(-1)^{k+1}\\sum_{|S| = k}P\\Big(\\bigcap_{i \\in S}A_i\\Big)."}</MD>
      </Theorem>
      <Proof>
        <p>
          The events cut Ω into at most <M>{"2^n"}</M> disjoint atoms, each the intersection of every <M>{"A_i"}</M> or its
          complement, and every probability in the formula is a sum of atom probabilities. So it is enough to check that each
          atom is counted the right number of times. An atom lying in exactly m ≥ 1 of the events lies in{" "}
          <M>{"\\binom{m}{k}"}</M> of the k-fold intersections, so it is counted{" "}
          <M>{"\\sum_{k=1}^{m}(-1)^{k+1}\\binom{m}{k} = 1 - (1 - 1)^m = 1"}</M> time, as on the left. An atom in none of the
          events is counted 0 times on both sides.
        </p>
        <Code>{IE}</Code>
      </Proof>

      <Example title="the matching problem">
        <p>
          n letters go into n addressed envelopes at random. Let <M>{"A_i"}</M> be &ldquo;letter i is in its own
          envelope&rdquo;. Any k of them hold together with probability <M>{"(n-k)!/n!"}</M>, and there are{" "}
          <M>{"\\binom{n}{k}"}</M> such groups, so the k-th term of inclusion–exclusion is <M>{"1/k!"}</M>. The probability
          of no match is <M>{"\\sum_{k=0}^{n}(-1)^k/k!"}</M>, which tends to <M>{"1/e \\approx 0.368"}</M> and barely
          depends on n.
        </p>
        <Code>{MATCH}</Code>
      </Example>
    </>
  ),

  practice: [
    {
      key: "evenodd",
      rung: "check",
      prompt: <p>A fair coin is tossed until the first head. What is the probability that this takes an odd number of tosses? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.6667, tolerance: 0.0001 },
    },
    {
      key: "overlap",
      rung: "check",
      prompt: <p>P(A) = 0.5, P(B) = 0.4 and P(A ∪ B) = 0.7. What is P(A ∩ B)?</p>,
      answer: { kind: "numeric", value: 0.2, tolerance: 0.0001 },
    },
    {
      key: "possible",
      rung: "apply",
      prompt: <p>P(A) = 0.6 and P(B) = 0.7. Which range contains exactly the possible values of P(A ∩ B)?</p>,
      answer: { kind: "choice", options: ["[0.3, 0.6]", "[0, 0.6]", "[0.42, 0.6]", "[0.3, 0.7]"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import combinations

def prob(event, pmf):
    return sum(pmf[w] for w in event)

def inclusion_exclusion(events, pmf):
    total = 0.0
    for k in range(1, len(events) + 1):
        for group in combinations(events, k):
            inter = set.intersection(*map(set, group))
            total += (-1) ** (k + 1) * prob(inter, pmf)
    return total

pmf = {w: 1 / 6 for w in range(1, 7)}
A, B, C = {2, 4, 6}, {4, 5, 6}, {1, 2}
print(round(prob(A | B, pmf), 4), round(inclusion_exclusion([A, B], pmf), 4))
print(round(inclusion_exclusion([A, B, C], pmf), 4), round(prob(A | B | C, pmf), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.6667 0.6667\n0.8333 0.8333", "0.6667 0.8333\n0.8333 0.8333", "0.6667 0.6667\n1.0 0.8333", "0.8333 0.6667\n0.8333 0.8333"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from fractions import Fraction
from math import factorial, prod

def no_match_prob(n):
    return sum(Fraction((-1) ** k, factorial(k)) for k in range(n + 1))

def union_range(ps):
    lo = max(ps)
    hi = min(1.0, sum(ps))
    indep = 1 - prod(1 - p for p in ps)
    return lo, indep, hi

print(no_match_prob(3), no_match_prob(4), float(no_match_prob(10)) > 0.3678)
lo, ind, hi = union_range([0.1, 0.2, 0.3])
print(lo, round(ind, 3), round(hi, 3))
print(union_range([0.5, 0.6, 0.7])[2])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1/3 3/8 True\n0.3 0.496 0.6\n1.0",
          "1/3 3/8 True\n0.3 0.504 0.6\n1.0",
          "2/3 5/8 True\n0.3 0.496 0.6\n1.0",
          "1/3 3/8 True\n0.3 0.496 0.6\n1.8",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Outcomes have masses in a dict <C>pmf</C>. Write <C>prob(event, pmf)</C>, the mass of a set of outcomes, and{" "}
          <C>inclusion_exclusion(events, pmf)</C>, which computes the probability of the union of a list of sets using only
          probabilities of intersections, by the inclusion–exclusion formula.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from itertools import combinations

def prob(event, pmf):
    return 0.0

def inclusion_exclusion(events, pmf):
    return sum(prob(e, pmf) for e in events)
`,
        solution: IE,
        tests: [
          { name: "dice", code: `pmf = {w: 1 / 6 for w in range(1, 7)}
assert abs(prob({1, 2, 3}, pmf) - 0.5) < 1e-12 and prob(set(), pmf) == 0
A, B, C = {2, 4, 6}, {4, 5, 6}, {1, 2}
assert abs(inclusion_exclusion([A, B], pmf) - 4 / 6) < 1e-12
assert abs(inclusion_exclusion([A, B, C], pmf) - 5 / 6) < 1e-12` },
          { name: "random weights", code: `import random
random.seed(1)
w = [random.random() for _ in range(10)]
pmf = {i: x / sum(w) for i, x in enumerate(w)}
events = [set(random.sample(range(10), 4)) for _ in range(5)]
assert abs(inclusion_exclusion(events, pmf) - prob(set().union(*events), pmf)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>no_match_prob(n)</C>, the exact probability (a Fraction) that a random permutation of n items has no fixed
          point, by the inclusion–exclusion sum; and <C>union_range(ps)</C>, which for events with probabilities ps returns
          (the smallest possible probability of their union, its value if they are independent, the union bound capped at 1).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from fractions import Fraction
from math import factorial, prod

def no_match_prob(n):
    return Fraction(0)

def union_range(ps):
    return 0.0, 0.0, 0.0
`,
        solution: MATCH,
        tests: [
          { name: "derangements", code: `from itertools import permutations
assert no_match_prob(1) == 0 and no_match_prob(2) == Fraction(1, 2)
for n in (3, 4, 5):
    perms = list(permutations(range(n)))
    count = sum(all(p[i] != i for i in range(n)) for p in perms)
    assert no_match_prob(n) == Fraction(count, len(perms))
assert abs(float(no_match_prob(15)) - 0.36787944117) < 1e-10` },
          { name: "union range", code: `lo, ind, hi = union_range([0.1, 0.2, 0.3])
assert abs(lo - 0.3) < 1e-12 and abs(ind - 0.496) < 1e-12 and abs(hi - 0.6) < 1e-12
lo, ind, hi = union_range([0.5, 0.6, 0.7])
assert lo == 0.7 and hi == 1.0 and abs(ind - 0.94) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove from the axioms that if <M>{"A_1 \\supseteq A_2 \\supseteq \\cdots"}</M> then{" "}
          <M>{"P(\\bigcap_n A_n) = \\lim_n P(A_n)"}</M>. You may use continuity for increasing sequences.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Passes to complements: the sets Aₙᶜ increase, and by De Morgan their union is (∩ Aₙ)ᶜ.",
          "Applies continuity from below: P(∪ Aₙᶜ) = lim P(Aₙᶜ).",
          "Uses P(Eᶜ) = 1 − P(E) on both sides to conclude 1 − P(∩ Aₙ) = 1 − lim P(Aₙ), hence the claim.",
        ],
      },
    },
    {
      key: "fourcards",
      rung: "stretch",
      prompt: (
        <p>
          Four cards are dealt from a well-shuffled deck. What is the probability that at least one suit is missing? Give four
          decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.8945, tolerance: 0.0002 },
    },
  ],

  teachBack:
    "Explain to a friend what the axioms of probability say, why countable additivity is needed for problems like tossing until a head, and how inclusion–exclusion and the union bound follow from the axioms.",

  glimpse: (
    <>
      <p>
        With equally likely outcomes, the axioms turn into counting, and the next lesson sharpens the counting tools.
        Conditional probability then asks how the mass should be redistributed once you learn that an event has happened.
      </p>
      <p>
        On continuous spaces the mass is spread by a density instead of sitting on points, and the restriction to a
        σ-algebra of events is what makes that possible; the course on measure-theoretic probability builds it in full.
      </p>
    </>
  ),
};
