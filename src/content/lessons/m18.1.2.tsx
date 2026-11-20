import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DyadicCoverViz } from "@/components/viz/DyadicCoverViz";
import type { LessonContent } from "@/lib/types";

const FINITE = `from itertools import combinations

def measure(weights, A):
    return sum(weights.get(w, 0) for w in A)

def union_measure(weights, sets):
    return measure(weights, set().union(*sets))

def inclusion_exclusion(weights, sets):
    total = 0
    for r in range(1, len(sets) + 1):
        for group in combinations(sets, r):
            total += (-1) ** (r + 1) * measure(weights, set.intersection(*map(set, group)))
    return total`;

const DYADIC = `import math

def dyadic_cells(intervals, k):
    N, cells = 2 ** k, set()
    for a, b in intervals:
        cells.update(range(math.floor(a * N), min(N - 1, math.floor(b * N)) + 1))
    return sorted(cells)

def cover_length(intervals, k):
    return len(dyadic_cells(intervals, k)) / 2 ** k

def total_length(intervals):
    return sum(b - a for a, b in intervals)`;

export const lesson: LessonContent = {
  id: "m18.1.2",
  minutes: 45,
  links: {
    requires: ["m18.1.1", "m8.4.2"],
    revisits: ["m8.1.3", "m7.1.1"],
    foreshadows: ["m18.1.3", "m18.2.1"],
  },

  puzzle: (
    <>
      <p>
        Length is obvious for intervals and for finite unions of them. But what is the length of the set of irrational
        numbers in [0, 1], or of a set built by an infinite process of removing pieces? We want a single rule that agrees
        with length on intervals, adds up over countably many disjoint pieces, and applies to as many sets as possible.
        How do you extend a notion of size from simple sets to complicated ones?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Approximate the set from outside. Cover it by countably many intervals, add up their lengths, and take the best
        such cover. This outer measure is defined for every set, but it is only subadditive: for some pathological pairs
        of disjoint sets the sizes do not add. Carathéodory&apos;s idea is to keep exactly the sets that split every other set
        additively; on those, outer measure is a genuine measure.
      </p>
      <DyadicCoverViz />
    </>
  ),

  theory: (
    <>
      <Definition title="measure">
        <p>A measure on a measurable space (Ω, 𝓕) is a function μ: 𝓕 → [0, ∞] with μ(∅) = 0 and</p>
        <MD>{"\\mu\\Big(\\bigcup_{n} A_n\\Big) = \\sum_n \\mu(A_n) \\quad \\text{for pairwise disjoint } A_1, A_2, \\ldots \\in \\mathcal F."}</MD>
        <p>
          A probability measure has μ(Ω) = 1, which recovers Kolmogorov&apos;s axioms (m7.1.1). On a countable set, any
          non-negative weights define a measure by <M>{"\\mu(A) = \\sum_{\\omega \\in A} w(\\omega)"}</M> (<C>measure</C>).
        </p>
      </Definition>

      <Example title="measures to keep in mind">
        <p>
          Counting measure gives each point weight 1, so μ(A) = |A|. The Dirac measure <M>{"\\delta_x"}</M> gives A the value 1 if
          x ∈ A and 0 otherwise. Lebesgue measure, constructed in the next lesson, gives intervals their length.
        </p>
      </Example>

      <Theorem title="basic properties">
        <p>For a measure μ and measurable sets:</p>
        <ul>
          <li>monotonicity: A ⊆ B implies μ(A) ≤ μ(B);</li>
          <li>countable subadditivity: <M>{"\\mu(\\bigcup_n A_n) \\le \\sum_n \\mu(A_n)"}</M>;</li>
          <li>continuity from below: if <M>{"A_n \\uparrow A"}</M> then <M>{"\\mu(A_n) \\to \\mu(A)"}</M>;</li>
          <li>continuity from above: if <M>{"A_n \\downarrow A"}</M> and <M>{"\\mu(A_1) < \\infty"}</M> then <M>{"\\mu(A_n) \\to \\mu(A)"}</M>.</li>
        </ul>
      </Theorem>
      <Proof>
        <p>
          Disjointify: <M>{"B_1 = A_1"}</M>, <M>{"B_n = A_n \\setminus (A_1 \\cup \\cdots \\cup A_{n-1})"}</M>. The <M>{"B_n"}</M> are disjoint, have the
          same union, and <M>{"B_n \\subseteq A_n"}</M>, giving subadditivity. If the <M>{"A_n"}</M> increase, <M>{"\\mu(A_n) = \\sum_{k \\le n} \\mu(B_k)"}</M>,
          whose limit is μ(A). For decreasing sets apply this to <M>{"A_1 \\setminus A_n"}</M>, which needs <M>{"\\mu(A_1)"}</M> finite to subtract.
          The condition matters: for counting measure on ℕ, <M>{"\\{n, n+1, \\ldots\\}"}</M> all have measure ∞ yet decrease to ∅. For
          finitely many sets, inclusion–exclusion follows from additivity on the atoms of the sets
          (<C>inclusion_exclusion</C>, <C>union_measure</C>).
        </p>
        <Code>{FINITE}</Code>
      </Proof>

      <Definition title="outer measure">
        <p>
          An outer measure on Ω is a function μ* on all subsets with μ*(∅) = 0, monotone and countably subadditive. Lebesgue
          outer measure on ℝ is
        </p>
        <MD>{"\\lambda^*(A) = \\inf\\Big\\{\\sum_n |I_n| : A \\subseteq \\bigcup_n I_n,\\ I_n \\text{ intervals}\\Big\\}."}</MD>
        <p>
          Restricting to dyadic cells <M>{"[j2^{-k}, (j+1)2^{-k})"}</M> gives upper bounds that, for a finite union of intervals,
          decrease to its length (<C>dyadic_cells</C>, <C>cover_length</C>, <C>total_length</C>). Every countable set has outer
          measure 0: cover its n-th point by an interval of length <M>{"\\varepsilon 2^{-n}"}</M>.
        </p>
      </Definition>

      <Theorem title="outer measure of an interval">
        <p><M>{"\\lambda^*([a, b]) = b - a"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Covering by [a, b] itself gives ≤. For ≥, take a cover by intervals <M>{"I_n"}</M>, enlarge each to an open interval of
          length <M>{"|I_n| + \\varepsilon 2^{-n}"}</M>, and use compactness (m8.4.2) to keep finitely many that still cover [a, b]. A finite
          cover of [a, b] by open intervals has total length more than b − a, by induction on the number of intervals:
          the one containing a reaches some c &gt; a, and the rest cover [c, b]. Hence <M>{"\\sum |I_n| + \\varepsilon > b - a"}</M> for every ε.
        </p>
        <Code>{DYADIC}</Code>
      </Proof>

      <Theorem title="Carathéodory">
        <p>Call A measurable for an outer measure μ* if for every E ⊆ Ω</p>
        <MD>{"\\mu^*(E) = \\mu^*(E \\cap A) + \\mu^*(E \\cap A^c)."}</MD>
        <p>The measurable sets form a σ-algebra, and μ* restricted to it is a measure.</p>
      </Theorem>
      <Proof>
        <p>
          The definition is symmetric in A and <M>{"A^c"}</M>, and ≤ always holds by subadditivity. For a finite union one checks
          the splitting condition by applying it to each set in turn. For a disjoint sequence with union A, the finite
          case gives <M>{"\\mu^*(E) \\ge \\sum_{k \\le n} \\mu^*(E \\cap A_k) + \\mu^*(E \\cap A^c)"}</M>; let n → ∞ and use subadditivity again to get
          both measurability of A and, with E = A, countable additivity. General countable unions are disjointified as
          above.
        </p>
      </Proof>

      <Remark title="why not all sets">
        <p>
          Using the axiom of choice, pick one point from each class of [0, 1) under x ~ y when x − y is rational. The
          countably many rational translates of this Vitali set V tile [0, 1) and all have the same outer measure. If V were
          measurable, its measure would be 0 (the total is at most 1) or positive (the total is infinite), both impossible.
          So <M>{"\\lambda^*"}</M> is not additive on all subsets, and Carathéodory&apos;s restriction is essential.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "union",
      rung: "check",
      prompt: <p>Three events have probabilities 0.5 each, every pair intersects with probability 0.2, and all three with probability 0.1. What is the probability of their union?</p>,
      answer: { kind: "numeric", value: 1.0, tolerance: 0.0001 },
    },
    {
      key: "countable",
      rung: "check",
      prompt: <p>The rationals in [0, 1] are listed as q₁, q₂, …, and qₙ is covered by an interval of length 0.01 · 2⁻ⁿ. What is the largest possible total length of the cover?</p>,
      answer: { kind: "numeric", value: 0.01, tolerance: 0.000001 },
    },
    {
      key: "above",
      rung: "apply",
      prompt: <p>For counting measure on ℕ, the sets Aₙ = {"{n, n + 1, …}"} decrease to ∅ but μ(Aₙ) = ∞ for every n. Which hypothesis of continuity from above fails?</p>,
      answer: {
        kind: "choice",
        options: [
          "μ(A₁) must be finite",
          "The sets must be disjoint",
          "The sets must be intervals",
          "The measure must be a probability measure on a finite set",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import combinations

def measure(weights, A):
    return sum(weights.get(w, 0) for w in A)

def union_measure(weights, sets):
    return measure(weights, set().union(*sets))

def inclusion_exclusion(weights, sets):
    total = 0
    for r in range(1, len(sets) + 1):
        for group in combinations(sets, r):
            total += (-1) ** (r + 1) * measure(weights, set.intersection(*map(set, group)))
    return total

w = {1: 0.5, 2: 0.25, 3: 0.25}; print(measure(w, {1, 3}), measure(w, {4}), union_measure(w, [{1}, {1, 2}]), inclusion_exclusion(w, [{1}, {1, 2}]))
print(inclusion_exclusion({'a': 1, 'b': 2, 'c': 4}, [{'a', 'b'}, {'b', 'c'}, {'a', 'c'}]), union_measure({}, [{1}]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.75 0 0.75 0.75\n7 0",
          "0.75 0 1.25 0.75\n7 0",
          "0.75 0 0.75 0.75\n14 0",
          "0.75 0 0.75 1.25\n7 1",
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

def dyadic_cells(intervals, k):
    N, cells = 2 ** k, set()
    for a, b in intervals:
        cells.update(range(math.floor(a * N), min(N - 1, math.floor(b * N)) + 1))
    return sorted(cells)

def cover_length(intervals, k):
    return len(dyadic_cells(intervals, k)) / 2 ** k

def total_length(intervals):
    return sum(b - a for a, b in intervals)

print(dyadic_cells([(0.25, 0.5)], 3), dyadic_cells([(0.6, 0.6)], 2), cover_length([(0.0, 1.0)], 4))
print(cover_length([(0.1, 0.2)], 1), total_length([(0.0, 0.25), (0.5, 0.75)]), cover_length([(0.25, 0.25), (0.75, 0.75)], 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2, 3, 4] [2] 1.0\n0.5 0.5 0.5",
          "[2, 3] [2] 1.0\n0.5 0.5 0.0",
          "[2, 3, 4] [2] 1.0\n0.1 0.5 0.5",
          "[2, 3, 4] [] 0.9375\n0.5 0.5 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          A measure on a finite set is given by a dict of weights. Write <C>measure(weights, A)</C>, treating missing points
          as weight 0, <C>union_measure(weights, sets)</C>, and <C>inclusion_exclusion(weights, sets)</C>, which must compute
          the same number from measures of intersections only.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from itertools import combinations

def measure(weights, A):
    return 0

def union_measure(weights, sets):
    return 0

def inclusion_exclusion(weights, sets):
    return sum(measure(weights, s) for s in sets)
`,
        solution: FINITE,
        tests: [
          { name: "measure", code: `w = {1: 1, 2: 2, 3: 4, 4: 8}
assert measure(w, {1, 4, 9}) == 9 and union_measure(w, [{1, 2}, {2, 3}]) == 7 and union_measure(w, [set()]) == 0` },
          { name: "inclusion exclusion", code: `w = {1: 1, 2: 2, 3: 4, 4: 8}
S = [{1, 2}, {2, 3}, {3, 4}, {1, 4}]
assert inclusion_exclusion(w, S) == 15 and inclusion_exclusion(w, [{1, 2}, {1, 2}]) == 3 and inclusion_exclusion(w, [{2, 3, 4}]) == 14` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Intervals are closed pairs (a, b) inside [0, 1]. Write <C>dyadic_cells(intervals, k)</C> returning the sorted indices
          j of cells [j/2ᵏ, (j+1)/2ᵏ) that meet the union (use cell 2ᵏ − 1 for the point 1), <C>cover_length(intervals, k)</C>{" "}
          and <C>total_length(intervals)</C> for disjoint intervals.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def dyadic_cells(intervals, k):
    return list(range(2 ** k))

def cover_length(intervals, k):
    return 1.0

def total_length(intervals):
    return 0.0
`,
        solution: DYADIC,
        tests: [
          { name: "cells", code: `assert dyadic_cells([(0.0, 0.1), (0.9, 1.0)], 2) == [0, 3] and dyadic_cells([(0.5, 0.5)], 3) == [4] and dyadic_cells([(0.1, 0.2), (0.15, 0.3)], 3) == [0, 1, 2]` },
          { name: "lengths", code: `assert cover_length([(0.3, 0.3)], 5) == 1 / 32 and cover_length([(0.0, 1.0)], 6) == 1.0 and abs(total_length([(0.1, 0.2), (0.5, 0.9)]) - 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "cells",
      rung: "stretch",
      prompt: (
        <p>
          The set {"{1/3}"} ∪ [0.5, 0.75] is covered by the dyadic cells [j/2¹⁰, (j+1)/2¹⁰) that meet it. What is the total
          length of these cells? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.252, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Carathéodory&apos;s theorem turns Lebesgue outer measure into Lebesgue measure. The next lesson shows that every Borel
        set is measurable, that the measure is translation invariant, and that some measurable sets, like the Cantor set,
        are large in one sense and negligible in another.
      </p>
    </>
  ),
};
