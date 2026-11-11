import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { SubsetViz } from "@/components/viz/SubsetViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.4.2",
  minutes: 60,
  links: {
    revisits: ["m1.1.4", "m1.2.2"],
    foreshadows: ["m1.6.3", "m7.1.1"],
  },

  puzzle: (
    <>
      <p>Consider two sets of whole numbers:</p>
      <MD>{"A = \\{\\, n : n \\text{ is a multiple of } 6 \\,\\}, \\qquad B = \\{\\, n : n \\text{ is even and a multiple of } 3 \\,\\}."}</MD>
      <p>
        They are described differently. Are they the same set? How would you <em>prove</em> that two sets, each with
        infinitely many elements, are the same, when you cannot compare them element by element?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Break the question into two halves. Is every element of A in B? Is every element of B in A? If both answers are yes,
        nothing is in one but not the other, so they are the same set. Each half is a single &ldquo;for all&rdquo; statement,
        which you already know how to prove.
      </p>
      <p>
        Compare some sets of numbers from 1 to 12 below. Look for pairs where one sits inside the other, pairs that overlap,
        pairs with nothing in common, and two different descriptions of the same set.
      </p>
      <SubsetViz />
    </>
  ),

  theory: (
    <>
      <Definition title="subset">
        <p>
          A is a <strong>subset</strong> of B, written <M>{"A \\subseteq B"}</M>, if every element of A is an element of B:
        </p>
        <MD>{"A \\subseteq B \\iff \\forall x\\, (x \\in A \\to x \\in B)."}</MD>
        <p>
          If also <M>{"A \\ne B"}</M>, A is a <strong>proper</strong> subset, written <M>{"A \\subsetneq B"}</M>. To show{" "}
          <M>{"A \\not\\subseteq B"}</M>, give one element of A that is not in B.
        </p>
      </Definition>

      <Definition title="equality of sets">
        <p>
          The <strong>axiom of extensionality</strong> says that sets with the same elements are equal. Equivalently,
        </p>
        <MD>{"A = B \\iff A \\subseteq B \\text{ and } B \\subseteq A."}</MD>
        <p>Proving each inclusion in turn is called a <strong>double inclusion</strong> proof, and it is the standard way to prove two sets equal.</p>
      </Definition>

      <Theorem title="the puzzle">
        <p>The multiples of 6 are exactly the integers that are even and multiples of 3.</p>
      </Theorem>
      <Proof>
        <p>
          (<M>{"\\subseteq"}</M>) Let n be a multiple of 6, so <M>{"n = 6k"}</M>. Then <M>{"n = 2(3k)"}</M> is even and{" "}
          <M>{"n = 3(2k)"}</M> is a multiple of 3.
        </p>
        <p>
          (<M>{"\\supseteq"}</M>) Let n be even and a multiple of 3, so <M>{"n = 3m"}</M>. If m were odd, then 3m would be odd
          (a product of odd numbers), but n is even; so m is even, say <M>{"m = 2j"}</M>, and <M>{"n = 6j"}</M>.
        </p>
        <p>Both inclusions hold, so the sets are equal.</p>
      </Proof>

      <Remark title="∈ is not ⊆">
        <p>
          <M>{"x \\in A"}</M> says x is one of the things in A. <M>{"X \\subseteq A"}</M> says every thing in X is in A. So{" "}
          <M>{"1 \\in \\{1, 2\\}"}</M> and <M>{"\\{1\\} \\subseteq \\{1, 2\\}"}</M>, but <M>{"\\{1\\} \\notin \\{1, 2\\}"}</M>. In
          the box picture: an element is a thing in the box; a subset is a smaller box made from some of the things.
        </p>
      </Remark>

      <Theorem title="three basic facts">
        <p>For all sets A, B, C:</p>
        <ul>
          <li><M>{"A \\subseteq A"}</M>;</li>
          <li>if <M>{"A \\subseteq B"}</M> and <M>{"B \\subseteq C"}</M>, then <M>{"A \\subseteq C"}</M>;</li>
          <li><M>{"\\varnothing \\subseteq A"}</M>.</li>
        </ul>
      </Theorem>
      <Proof>
        <p>
          The first two follow directly from the definition. For the third, we must show{" "}
          <M>{"\\forall x\\,(x \\in \\varnothing \\to x \\in A)"}</M>. Since <M>{"x \\in \\varnothing"}</M> is always false, each
          instance of the conditional is true: the empty set is a subset of every set <em>vacuously</em>.
        </p>
      </Proof>

      <Example title="a set with no elements is unique">
        <p>
          If <M>{"E_1"}</M> and <M>{"E_2"}</M> both have no elements, then each is a subset of the other by the third fact, so{" "}
          <M>{"E_1 = E_2"}</M>. That is why we may speak of <em>the</em> empty set.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "subset",
      rung: "check",
      prompt: <p>Which of these are true?</p>,
      answer: { kind: "choice", options: ["{1, 2} ⊆ {1, 2, 3}", "{1, 4} ⊆ {1, 2, 3}", "∅ ⊆ {1, 2}", "{1, 2} ⊆ {1, 2}"], correct: [0, 2, 3] },
    },
    {
      key: "in-vs-sub",
      rung: "check",
      prompt: <p>Let <M>{"A = \\{1, \\{2\\}\\}"}</M>. Which are true?</p>,
      answer: { kind: "choice", options: ["{2} ∈ A", "{2} ⊆ A", "{1} ⊆ A", "2 ∈ A"], correct: [0, 2] },
    },
    {
      key: "count-subsets",
      rung: "apply",
      prompt: <p>How many subsets does <M>{"\\{a, b, c\\}"}</M> have, including the empty set and itself?</p>,
      answer: { kind: "numeric", value: 8 },
    },
    {
      key: "witness",
      rung: "apply",
      prompt: (
        <p>
          To show that the set of odd numbers is not a subset of the set of primes, which number from 1 to 10 is the smallest
          witness?
        </p>
      ),
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "double",
      rung: "apply",
      prompt: <p>To prove <M>{"A = B"}</M> by double inclusion, you prove&hellip;</p>,
      answer: {
        kind: "choice",
        options: ["A ⊆ B only", "A ⊆ B and B ⊆ A", "A ∈ B and B ∈ A", "that A and B have the same number of elements"],
        correct: [1],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`A = {1, 2, 3}
B = {3, 2, 1, 1}
print(A == B, A <= {1, 2, 3, 4}, A < A)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True True False", "False True False", "True True True", "True False False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>is_subset(A, B)</C> using only a loop and <C>in</C>, and <C>equal(A, B)</C> using <C>is_subset</C> both ways.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def is_subset(A, B):
    return True

def equal(A, B):
    return True
`,
        solution: `def is_subset(A, B):
    for x in A:
        if x not in B:
            return False
    return True

def equal(A, B):
    return is_subset(A, B) and is_subset(B, A)
`,
        tests: [
          { name: "subset", code: `assert is_subset({1, 2}, {1, 2, 3}) and not is_subset({1, 4}, {1, 2, 3}), 'Every element of A must be in B.'` },
          { name: "empty", code: `assert is_subset(set(), {1}), 'The empty set is a subset of every set.'` },
          { name: "equal", code: `assert equal({1, 2}, {2, 1}) and not equal({1}, {1, 2}), 'Equal means each is a subset of the other.'` },
        ],
      },
    },
    {
      key: "transitive",
      rung: "prove",
      prompt: <p>Prove that if <M>{"A \\subseteq B"}</M> and <M>{"B \\subseteq C"}</M>, then <M>{"A \\subseteq C"}</M>.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Takes an arbitrary element x of A.",
          "Uses A ⊆ B to get x ∈ B, then B ⊆ C to get x ∈ C.",
          "Concludes that every element of A is in C, so A ⊆ C.",
        ],
      },
    },
    {
      key: "four-six",
      rung: "stretch",
      prompt: (
        <p>
          Let A be the set of multiples of 4 and B the set of multiples of 6, among the integers. Prove that{" "}
          <M>{"\\{\\, n : 4 \\mid n \\text{ and } 6 \\mid n \\,\\}"}</M> equals the set of multiples of 12.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Proves that every multiple of 12 is a multiple of both 4 and 6.",
          "For the other inclusion, takes n divisible by 4 and 6, writes n = 4a, and uses 3 | n (from 6 | n) to deduce 3 | a, since 3 does not divide 4.",
          "Concludes n = 12b for some integer b.",
          "States that both inclusions hold, so the sets are equal.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how to prove that two infinite sets are equal, and the difference between 'is an element of' and 'is a subset of'.",

  glimpse: (
    <p>
      Next come the operations that build new sets from old: union, intersection, difference and complement. The subset
      relation is the first example of a partial order, studied later in this course. In Probability, events are subsets of
      the space of outcomes, and &ldquo;A implies B&rdquo; becomes <M>{"A \\subseteq B"}</M>.
    </p>
  ),
};
