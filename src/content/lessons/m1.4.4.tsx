import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { FamilyViz } from "@/components/viz/FamilyViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.4.4",
  minutes: 65,
  links: {
    revisits: ["m0.1.5", "m1.2.4"],
    foreshadows: ["m8.4.1", "m18.1.1"],
  },

  puzzle: (
    <>
      <p>Picture the intervals</p>
      <MD>{"(0, 1), \\quad (0, \\tfrac12), \\quad (0, \\tfrac13), \\quad (0, \\tfrac14), \\quad \\dots"}</MD>
      <p>
        Each one sits inside the one before, and each one contains infinitely many numbers. What numbers lie in <em>all</em>{" "}
        of them at once? Is there at least one? Decide before reading on.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Take any candidate x. It must be greater than 0, since every interval is open at 0. But then, however small x is, some{" "}
        <M>{"\\tfrac1n"}</M> is smaller still, and x is left out of <M>{"(0, \\tfrac1n)"}</M>. So no number lies in all of them:
        the intersection of infinitely many nested, non-empty intervals is empty.
      </p>
      <p>
        Change one detail, closing the intervals, and the answer changes. Explore several families below, watching what the
        union and intersection do as more sets are added.
      </p>
      <FamilyViz />
    </>
  ),

  theory: (
    <>
      <Definition title="indexed family">
        <p>
          An <strong>indexed family</strong> of sets is a collection <M>{"\\{A_i : i \\in I\\}"}</M> with one set{" "}
          <M>{"A_i"}</M> for each index i in an <strong>index set</strong> I. Often <M>{"I = \\{1, 2, 3, \\dots\\}"}</M>, giving a
          sequence of sets <M>{"A_1, A_2, A_3, \\dots"}</M>.
        </p>
      </Definition>

      <Definition title="union and intersection of a family">
        <MD>{"\\bigcup_{i \\in I} A_i = \\{\\, x : \\exists i \\in I,\\ x \\in A_i \\,\\}, \\qquad \\bigcap_{i \\in I} A_i = \\{\\, x : \\forall i \\in I,\\ x \\in A_i \\,\\}."}</MD>
        <p>
          The union collects everything in at least one of the sets; the intersection keeps only what is in every one. The
          quantifiers do all the work.
        </p>
      </Definition>

      <Theorem title="the puzzle">
        <p><M>{"\\displaystyle\\bigcap_{n=1}^{\\infty} \\left(0, \\tfrac1n\\right) = \\varnothing"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Suppose, for contradiction, that x lies in every interval. Then <M>{"x \\in (0, 1)"}</M>, so <M>{"x > 0"}</M>. Choose
          a whole number n with <M>{"n > 1/x"}</M>; then <M>{"\\tfrac1n < x"}</M>, so <M>{"x \\notin (0, \\tfrac1n)"}</M>, a
          contradiction.
        </p>
      </Proof>

      <Example title="closed intervals behave differently">
        <p>
          <M>{"\\bigcap_{n} [-\\tfrac1n, \\tfrac1n] = \\{0\\}"}</M>: 0 is in every one, and any <M>{"x \\ne 0"}</M> is excluded
          once <M>{"\\tfrac1n < |x|"}</M>. And <M>{"\\bigcup_n [\\tfrac1n, 2] = (0, 2]"}</M>: a union of closed intervals need
          not be closed. Infinite operations can produce sets unlike any of the sets you started with.
        </p>
      </Example>

      <Theorem title="De Morgan's laws for families">
        <MD>{"\\Big(\\bigcup_{i \\in I} A_i\\Big)^c = \\bigcap_{i \\in I} A_i^c, \\qquad \\Big(\\bigcap_{i \\in I} A_i\\Big)^c = \\bigcup_{i \\in I} A_i^c."}</MD>
      </Theorem>
      <Proof>
        <p>
          <M>{"x \\notin \\bigcup A_i"}</M> means <M>{"\\neg \\exists i\\, (x \\in A_i)"}</M>, which by the quantifier laws is{" "}
          <M>{"\\forall i\\, (x \\notin A_i)"}</M>, that is, <M>{"x \\in \\bigcap A_i^c"}</M>. The second law is the same with
          the quantifiers swapped.
        </p>
      </Proof>

      <Remark title="why the order of limits matters">
        <p>
          The puzzle shows something unsettling: a property that holds at every finite stage (the intersection of the first N
          intervals is non-empty) can fail &ldquo;at infinity&rdquo;. Zeno of Elea built paradoxes on such surprises. Much of
          Real Analysis is about knowing when finite truths survive the passage to the infinite. The completeness of the real
          numbers guarantees, for instance, that nested <em>closed</em> bounded intervals always share a point.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "union-finite",
      rung: "check",
      prompt: <p>With <M>{"A_n = \\{n, n + 1\\}"}</M> for n = 1, 2, 3, how many elements does <M>{"A_1 \\cup A_2 \\cup A_3"}</M> have?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "intersect-finite",
      rung: "check",
      prompt: <p>With the same sets, how many elements does <M>{"A_1 \\cap A_2 \\cap A_3"}</M> have?</p>,
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "closed",
      rung: "apply",
      prompt: <p>What is <M>{"\\bigcap_{n=1}^{\\infty} [0, \\tfrac1n]"}</M>?</p>,
      answer: { kind: "choice", options: ["∅", "{0}", "[0, 1]", "(0, 1]"], correct: [1] },
    },
    {
      key: "union-inf",
      rung: "apply",
      prompt: <p>What is <M>{"\\bigcup_{n=1}^{\\infty} [\\tfrac1n, 1]"}</M>?</p>,
      answer: { kind: "choice", options: ["[0, 1]", "(0, 1]", "{1}", "∅"], correct: [1] },
    },
    {
      key: "multiples",
      rung: "apply",
      prompt: (
        <p>
          For each prime p, let <M>{"M_p"}</M> be the set of positive multiples of p. Which positive integer is in no{" "}
          <M>{"M_p"}</M> at all?
        </p>
      ),
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`A = {n: set(range(n, 2 * n + 1)) for n in range(1, 5)}
print(sorted(set.intersection(*A.values())))`}</Code>
          <p>An indexed family Aₙ = {"{n, …, 2n}"} for n = 1 to 4. What is the intersection?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[]", "[4]", "[2]", "[1, 2, 3, 4]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`family = [set(range(k, 3 * k + 1)) for k in range(1, 5)]
print(sorted(set.intersection(*family)), len(set.union(*family)))`}</Code>
          <p>The family A_k = {'{k, …, 3k}'} for k = 1 … 4. What do the big intersection and big union give?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[] 12", "[3, 4] 12", "[3] 12", "[] 9"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>big_union(family)</C> and <C>big_intersection(family)</C> for a non-empty list of sets.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def big_union(family):
    return set()

def big_intersection(family):
    return set()
`,
        solution: `def big_union(family):
    out = set()
    for S in family:
        out |= S
    return out

def big_intersection(family):
    out = set(family[0])
    for S in family[1:]:
        out &= S
    return out
`,
        tests: [
          { name: "nested", code: `F = [set(range(n, 10)) for n in range(5)]
assert big_union(F) == set(range(10)) and big_intersection(F) == set(range(4, 10)), 'For the nested family {n, …, 9} the intersection starts at 4.'` },
          { name: "intervals", code: `F = [set(range(n, 2 * n + 1)) for n in range(1, 5)]
assert big_intersection(F) == set(), 'The sets {n, …, 2n} for n = 1 to 4 have nothing in common.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>limsup(family)</C> and <C>liminf(family)</C> for a finite list of sets A₁, …, Aₙ, treating it as one period of an infinitely repeating sequence: the lim sup is the set of points in infinitely many Aₖ (here: in at least one), and the lim inf is the set of points in all but finitely many (here: in all). The starter gives <C>tail_union(family, m)</C>, the union of Aₘ, Aₘ₊₁, …, Aₙ (1-based); write <C>tail_intersection(family, m)</C>, their intersection, and use the two for the limits. Do not change the sets you are given. The tests also check that the lim inf ⊆ lim sup.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def tail_union(family, m):
    out = set()
    for A in family[m - 1:]:
        out |= A
    return out

def tail_intersection(family, m):
    return set()

def limsup(family):
    return set()

def liminf(family):
    return set()
`,
        solution: `def tail_union(family, m):
    out = set()
    for A in family[m - 1:]:
        out |= A
    return out

def tail_intersection(family, m):
    tail = family[m - 1:]
    out = set(tail[0])
    for A in tail[1:]:
        out &= A
    return out

def limsup(family):
    return tail_union(family, 1)

def liminf(family):
    return tail_intersection(family, 1)
`,
        tests: [
          { name: "tails", code: `F = [{1, 2, 3}, {2, 3, 4}, {3, 4, 5}]
assert tail_union(F, 2) == {2, 3, 4, 5} and tail_intersection(F, 2) == {3, 4} and tail_intersection(F, 3) == {3, 4, 5}, 'Start from Aₘ.'` },
          { name: "limits", code: `F = [{0, 1}, {0, 2}, {0, 1, 3}]
assert limsup(F) == {0, 1, 2, 3} and liminf(F) == {0}, 'Only 0 is in every set of the period.'` },
          { name: "nested", code: `import random
random.seed(9)
for _ in range(30):
    F = [{random.randint(0, 9) for _ in range(6)} for _ in range(random.randint(1, 6))]
    assert liminf(F) <= limsup(F) and all(tail_intersection(F, m) <= tail_union(F, m) for m in range(1, len(F) + 1))` },
          { name: "copies", code: `F = [{1, 2}, {2, 3}]
tail_intersection(F, 1)
tail_union(F, 1)
assert F == [{1, 2}, {2, 3}], 'Do not change the sets you were given.'` },
        ],
      },
    },
    {
      key: "de-morgan-fam",
      rung: "prove",
      prompt: <p>Prove that <M>{"\\big(\\bigcap_{i \\in I} A_i\\big)^c = \\bigcup_{i \\in I} A_i^c"}</M>.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes x ∉ ∩Aᵢ as ¬∀i (x ∈ Aᵢ).",
          "Uses the quantifier negation law to get ∃i (x ∉ Aᵢ).",
          "Recognises this as x ∈ ∪Aᵢᶜ, and concludes the sets are equal.",
        ],
      },
    },
    {
      key: "union-proof",
      rung: "stretch",
      prompt: <p>Prove that <M>{"\\bigcup_{n=1}^{\\infty} [\\tfrac1n, 2] = (0, 2]"}</M>.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Shows ⊆: each [1/n, 2] is contained in (0, 2] since 1/n > 0.",
          "Shows ⊇: for x in (0, 2], chooses n with 1/n ≤ x (possible since x > 0), so x ∈ [1/n, 2].",
          "Concludes by double inclusion.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why infinitely many nested intervals (0, 1/n), none of them empty, have nothing in common.",

  glimpse: (
    <p>
      The last lesson on sets builds two new kinds of set from old: the set of all subsets, and the set of all ordered pairs. Unions and intersections of families are the language of open and closed sets in Real Analysis, and of sigma-algebras in Measure-Theoretic Probability.
    </p>
  ),
};
