import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SigmaAtomsViz } from "@/components/viz/SigmaAtomsViz";
import type { LessonContent } from "@/lib/types";

const CLOSURE = `def generate(omega, gens):
    full = frozenset(omega)
    sets = {frozenset(), full} | {frozenset(g) for g in gens}
    while True:
        new = {full - s for s in sets} | {a | b for a in sets for b in sets}
        if new <= sets:
            return sets
        sets |= new

def is_sigma_algebra(omega, F):
    full = frozenset(omega)
    return full in F and all(full - s in F for s in F) and all(a | b in F for a in F for b in F)

def atoms(omega, F):
    return {frozenset.intersection(*[s for s in F if w in s]) for w in omega}`;

const ATOMS = `def atoms_from_generators(omega, gens):
    groups = {}
    for w in omega:
        key = tuple(w in g for g in gens)
        groups.setdefault(key, set()).add(w)
    return sorted(sorted(g) for g in groups.values())

def count_events(omega, gens):
    return 2 ** len(atoms_from_generators(omega, gens))

def is_pi_system(C):
    return all(a & b in C for a in C for b in C)`;

export const lesson: LessonContent = {
  id: "m18.1.1",
  minutes: 40,
  links: {
    requires: ["m7.1.1", "m8.1.3"],
    revisits: ["m8.4.1"],
    foreshadows: ["m18.1.2", "m18.5.1"],
  },

  puzzle: (
    <>
      <p>
        Pick a point uniformly from [0, 1]. The probability of landing in an interval should be its length, and probability
        should add up over disjoint pieces, even countably many. It is a theorem that no such assignment exists on every
        subset of [0, 1]. Something has to give. Which subsets should count as events, and what rules must the collection of
        events obey?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An event is a question you can answer yes or no after the experiment. If you can answer A, you can answer
        &quot;not A&quot;; if you can answer each of a sequence of questions, you can answer &quot;is any of them yes?&quot;. The
        events you can decide therefore form a collection closed under complements and countable unions: a σ-algebra.
        On a finite set it is described completely by its atoms, the finest distinctions it can make.
      </p>
      <SigmaAtomsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="σ-algebra">
        <p>A collection 𝓕 of subsets of a set Ω is a σ-algebra if</p>
        <ul>
          <li>Ω ∈ 𝓕;</li>
          <li>A ∈ 𝓕 implies <M>{"A^c \\in \\mathcal F"}</M>;</li>
          <li><M>{"A_1, A_2, \\ldots \\in \\mathcal F"}</M> implies <M>{"\\bigcup_n A_n \\in \\mathcal F"}</M>.</li>
        </ul>
        <p>
          The pair (Ω, 𝓕) is a measurable space and the members of 𝓕 are measurable sets, or events. By De Morgan&apos;s laws a
          σ-algebra is also closed under countable intersections, and it contains ∅ = Ω<sup>c</sup>.
        </p>
      </Definition>

      <Example title="first examples">
        <p>
          The trivial σ-algebra {"{∅, Ω}"} knows nothing; the power set knows everything. On ℝ, the sets that are countable or
          have countable complement form a σ-algebra: complements swap the two kinds, and a countable union is countable
          unless some member is co-countable, in which case the union is co-countable. It does not contain [0, 1].
        </p>
      </Example>

      <Theorem title="generated σ-algebras">
        <p>
          Any intersection of σ-algebras on Ω is a σ-algebra. Hence for any collection 𝒞 of subsets there is a smallest
          σ-algebra containing it, <M>{"\\sigma(\\mathcal C)"}</M>, the intersection of all σ-algebras containing 𝒞.
        </p>
      </Theorem>
      <Proof>
        <p>
          If every <M>{"\\mathcal F_i"}</M> contains Ω, is closed under complements and contains every countable union of its
          members, then so does their intersection, since each condition is checked inside each <M>{"\\mathcal F_i"}</M>. The power
          set contains 𝒞, so the intersection is over a non-empty family. On a finite set, <M>{"\\sigma(\\mathcal C)"}</M> can be computed
          by repeatedly adding complements and unions until nothing new appears (<C>generate</C>, <C>is_sigma_algebra</C>).
        </p>
        <Code>{CLOSURE}</Code>
      </Proof>

      <Theorem title="finite σ-algebras are partitions">
        <p>
          Let 𝓕 be a σ-algebra on a finite set Ω. The atoms <M>{"a(\\omega) = \\bigcap\\{A \\in \\mathcal F : \\omega \\in A\\}"}</M> partition Ω, and
          every member of 𝓕 is a union of atoms. So if there are k atoms, <M>{"|\\mathcal F| = 2^k"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each atom is a finite intersection of members, so it is in 𝓕 (<C>atoms</C>). If <M>{"\\omega' \\in a(\\omega)"}</M> but{" "}
          <M>{"\\omega \\notin a(\\omega')"}</M>, then <M>{"a(\\omega) \\setminus a(\\omega')"}</M> is a member containing ω but not ω′, contradicting the
          minimality of <M>{"a(\\omega)"}</M>; so atoms are equal or disjoint. A member A is the union of the atoms of its points,
          and conversely any union of atoms is in 𝓕. For σ(𝒞) with 𝒞 = {"{C₁, …, C_r}"} the atoms are found directly: two
          points share an atom exactly when every <M>{"C_j"}</M> contains both or neither (<C>atoms_from_generators</C>,{" "}
          <C>count_events</C>).
        </p>
        <Code>{ATOMS}</Code>
      </Proof>

      <Definition title="Borel sets">
        <p>
          The Borel σ-algebra <M>{"\\mathcal B(\\mathbb R)"}</M> is generated by the open sets of ℝ (m8.4.1). It is also generated by the
          half-lines <M>{"(-\\infty, a]"}</M>: each open set is a countable union of open intervals with rational endpoints, and{" "}
          <M>{"(a, b) = \\bigcup_n (-\\infty, b - 1/n] \\setminus (-\\infty, a]"}</M>. Every set you are likely to write down is Borel, yet
          there are only continuum many Borel sets, fewer than the <M>{"2^{\\mathfrak c}"}</M> subsets of ℝ (m8.1.3).
        </p>
      </Definition>

      <Theorem title="Dynkin's π-λ theorem">
        <p>
          A π-system is a collection closed under finite intersections (<C>is_pi_system</C>). A λ-system contains Ω and is
          closed under complements and countable disjoint unions. If a λ-system contains a π-system 𝒫, it contains σ(𝒫).
        </p>
      </Theorem>
      <Proof>
        <p>
          Let λ(𝒫) be the smallest λ-system containing 𝒫. One checks that for fixed A ∈ λ(𝒫) the sets B with A ∩ B ∈ λ(𝒫)
          form a λ-system, first for A ∈ 𝒫 and then for all A, so λ(𝒫) is a π-system. A λ-system that is also a π-system is
          a σ-algebra, because any countable union can be rewritten as a disjoint union{" "}
          <M>{"\\bigcup_n (A_n \\cap A_1^c \\cap \\cdots \\cap A_{n-1}^c)"}</M>. Hence σ(𝒫) ⊆ λ(𝒫). The theorem is the workhorse of uniqueness
          proofs: two probability measures that agree on the half-lines agree on every Borel set.
        </p>
      </Proof>

      <Remark title="σ-algebras as information">
        <p>
          A coarser σ-algebra models less information: knowing only whether a die roll is at most 3 cannot distinguish 1
          from 2. An increasing sequence of σ-algebras, a filtration, models information accumulating over time, and
          conditional expectation given a σ-algebra (m18.5.1) is the best prediction from that information.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "events",
      rung: "check",
      prompt: <p>On Ω = {"{1, 2, 3, 4}"}, how many sets are in the σ-algebra generated by {"{1, 2}"} and {"{2, 3}"}?</p>,
      answer: { kind: "numeric", value: 16, tolerance: 0 },
    },
    {
      key: "partition",
      rung: "check",
      prompt: <p>A σ-algebra on a ten-point set has three atoms. How many events does it contain?</p>,
      answer: { kind: "numeric", value: 8, tolerance: 0 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which of these collections of subsets of ℝ is a σ-algebra?</p>,
      answer: {
        kind: "choice",
        options: [
          "The sets that are countable or have countable complement",
          "The open sets",
          "The finite unions of intervals",
          "The finite sets together with ℝ",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def generate(omega, gens):
    full = frozenset(omega)
    sets = {frozenset(), full} | {frozenset(g) for g in gens}
    while True:
        new = {full - s for s in sets} | {a | b for a in sets for b in sets}
        if new <= sets:
            return sets
        sets |= new

def is_sigma_algebra(omega, F):
    full = frozenset(omega)
    return full in F and all(full - s in F for s in F) and all(a | b in F for a in F for b in F)

def atoms(omega, F):
    return {frozenset.intersection(*[s for s in F if w in s]) for w in omega}

F = generate({1, 2, 3, 4}, [{1}]); print(len(F), is_sigma_algebra({1, 2, 3, 4}, F), is_sigma_algebra({1, 2, 3}, {frozenset(), frozenset({1}), frozenset({1, 2, 3})}))
print(sorted(sorted(a) for a in atoms({1, 2, 3, 4}, generate({1, 2, 3, 4}, [{1, 2}, {2, 3}]))), len(generate(range(5), [])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4 True False\n[[1], [2], [3], [4]] 2",
          "3 True False\n[[1], [2], [3], [4]] 2",
          "4 True True\n[[1], [2, 3], [4]] 2",
          "4 True False\n[[1], [2], [3], [4]] 1",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def atoms_from_generators(omega, gens):
    groups = {}
    for w in omega:
        key = tuple(w in g for g in gens)
        groups.setdefault(key, set()).add(w)
    return sorted(sorted(g) for g in groups.values())

def count_events(omega, gens):
    return 2 ** len(atoms_from_generators(omega, gens))

def is_pi_system(C):
    return all(a & b in C for a in C for b in C)

print(atoms_from_generators(range(1, 7), [{1, 2, 3}, {2, 4, 6}]), count_events(range(1, 7), [{6}, {5, 6}]))
print(is_pi_system([{1}, {1, 2}, {1, 2, 3}]), is_pi_system([{1, 2}, {2, 3}]), count_events(range(4), []))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1, 3], [2], [4, 6], [5]] 8\nTrue False 2",
          "[[1, 3], [2], [4, 6], [5]] 4\nTrue False 2",
          "[[1, 2, 3], [4, 5, 6]] 8\nTrue False 2",
          "[[1, 3], [2], [4, 6], [5]] 8\nTrue True 1",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>generate(omega, gens)</C> returning σ(gens) on a finite set as a set of frozensets,{" "}
          <C>is_sigma_algebra(omega, F)</C>, and <C>atoms(omega, F)</C> returning the set of atoms.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def generate(omega, gens):
    return {frozenset(), frozenset(omega)}

def is_sigma_algebra(omega, F):
    return True

def atoms(omega, F):
    return {frozenset(omega)}
`,
        solution: CLOSURE,
        tests: [
          { name: "generate", code: `F = generate({1, 2, 3, 4, 5}, [{1, 2}, {2, 3}])
assert len(F) == 16 and frozenset({1, 3}) in F and frozenset({4, 5}) in F and frozenset({4}) not in F and len(generate({1, 2, 3}, [{1, 2, 3}])) == 2` },
          { name: "check and atoms", code: `assert not is_sigma_algebra({1, 2, 3}, {frozenset(), frozenset({1}), frozenset({1, 2, 3})}) and not is_sigma_algebra({1, 2}, {frozenset(), frozenset({1}), frozenset({2})})
assert is_sigma_algebra({1, 2, 3}, generate({1, 2, 3}, [{2}])) and atoms({1, 2, 3, 4}, generate({1, 2, 3, 4}, [{1, 2}])) == {frozenset({1, 2}), frozenset({3, 4})}` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>atoms_from_generators(omega, gens)</C> returning the atoms of σ(gens) as a sorted list of sorted lists,{" "}
          <C>count_events(omega, gens)</C>, and <C>is_pi_system(C)</C> for a list of sets.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def atoms_from_generators(omega, gens):
    return [sorted(omega)]

def count_events(omega, gens):
    return 2

def is_pi_system(C):
    return True
`,
        solution: ATOMS,
        tests: [
          { name: "atoms", code: `assert atoms_from_generators(range(1, 9), [{1, 2, 3, 4}, {3, 4, 5, 6}]) == [[1, 2], [3, 4], [5, 6], [7, 8]] and atoms_from_generators([3, 1, 2], []) == [[1, 2, 3]] and count_events(range(10), [{0}, {1}, {2}]) == 16` },
          { name: "pi system", code: `assert is_pi_system([set(), {1}, {1, 2}]) and not is_pi_system([{1, 2}, {2, 3}]) and is_pi_system([{1, 2}, {2, 3}, {2}])` },
        ],
      },
    },
    {
      key: "bell",
      rung: "stretch",
      prompt: <p>How many different σ-algebras are there on a set with five points?</p>,
      answer: { kind: "numeric", value: 52, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        A σ-algebra says which sets can be measured. The next lesson says how: a measure assigns sizes that add up over
        countable disjoint unions, and outer measure shows how to build one from lengths of intervals.
      </p>
    </>
  ),
};
