import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { CountViz } from "@/components/viz/CountViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.8.1",
  minutes: 60,
  links: {
    revisits: ["m0.1.1", "m1.7.2"],
    foreshadows: ["m4.1.4"],
  },

  puzzle: (
    <>
      <p>
        A shepherd who cannot count past three keeps a pile of pebbles, one for each sheep. In the evening, as each sheep
        comes home, the shepherd moves one pebble to a second pile. If pebbles are left over, a sheep is missing.
      </p>
      <p>
        The shepherd knows whether the flock is complete without any numbers at all. What is counting, then, underneath the
        numbers? And how do you know that counting the same flock in a different order could never give a different answer?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The pebbles and the sheep are matched one to one: a bijection. Counting is the same thing, with the numbers 1, 2, 3,
        &hellip; in place of pebbles. To say a set has 7 elements is to say it can be matched perfectly with{" "}
        <M>{"\\{1, 2, \\dots, 7\\}"}</M>.
      </p>
      <p>
        Count the objects below, then count them again in a new order. The numbers land on different objects each time, but
        the last number never changes. That is not obvious: it is a theorem, and this lesson proves it.
      </p>
      <CountViz />
    </>
  ),

  theory: (
    <>
      <Definition title="finite sets and their size">
        <p>
          For <M>{"n \\ge 1"}</M> write <M>{"[n] = \\{1, 2, \\dots, n\\}"}</M>, and let <M>{"[0] = \\varnothing"}</M>. A set
          A is <strong>finite</strong> with <M>{"|A| = n"}</M> if there is a bijection <M>{"[n] \\to A"}</M>. A set that is not
          finite is <strong>infinite</strong>.
        </p>
      </Definition>

      <Theorem title="the size of a finite set is well defined">
        <p>If there is a bijection <M>{"[m] \\to [n]"}</M>, then <M>{"m = n"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          It is enough to prove, by induction on n, that every injection <M>{"[m] \\to [n]"}</M> has{" "}
          <M>{"m \\le n"}</M>; applying this to a bijection and to its inverse gives <M>{"m \\le n"}</M> and{" "}
          <M>{"n \\le m"}</M>.
        </p>
        <p>
          For <M>{"n = 0"}</M>, a function into the empty set must have empty domain, so <M>{"m = 0"}</M>. Suppose the claim
          holds for n, and let <M>{"f : [m] \\to [n + 1]"}</M> be injective with <M>{"m \\ge 1"}</M>. Swap values if necessary
          so that no element other than possibly m is sent to <M>{"n + 1"}</M>: if <M>{"f(i) = n + 1"}</M> for some{" "}
          <M>{"i < m"}</M>, exchange <M>{"f(i)"}</M> and <M>{"f(m)"}</M>, which keeps f injective. Now f restricted to{" "}
          <M>{"[m - 1]"}</M> is an injection into <M>{"[n]"}</M>, so <M>{"m - 1 \\le n"}</M> by the hypothesis, and{" "}
          <M>{"m \\le n + 1"}</M>.
        </p>
      </Proof>
      <p>
        The contrapositive is the pigeonhole principle: there is no injection from <M>{"[n + 1]"}</M> to <M>{"[n]"}</M>. Two
        sets have the same size exactly when there is a bijection between them, which is the shepherd&rsquo;s method.
      </p>

      <Example title="counting rules, proved by bijections">
        <p>For finite sets A and B,</p>
        <MD>{"|A \\cup B| = |A| + |B| - |A \\cap B|, \\qquad |A \\times B| = |A| \\cdot |B|, \\qquad |\\mathcal{P}(A)| = 2^{|A|}."}</MD>
        <p>
          The last, for instance, comes from a bijection between subsets of <M>{"[n]"}</M> and strings of n zeros and ones:
          put a 1 in position i exactly when i is in the subset.
        </p>
      </Example>

      <Theorem title="no finite set matches a proper part of itself">
        <p>If A is finite and <M>{"B \\subsetneq A"}</M>, then there is no bijection from A to B.</p>
      </Theorem>
      <Proof>
        <p>
          Choose <M>{"a \\in A"}</M> with <M>{"a \\notin B"}</M>. Then B is a subset of <M>{"A \\setminus \\{a\\}"}</M>, which
          has <M>{"|A| - 1"}</M> elements, so B is finite with <M>{"|B| \\le |A| - 1"}</M> (this is the last exercise below). A
          bijection <M>{"A \\to B"}</M> would then give an injection <M>{"[|A|] \\to [|B|]"}</M>, which the theorem above
          forbids.
        </p>
      </Proof>

      <Remark title="Galileo's paradox">
        <p>
          In his <cite>Two New Sciences</cite> (1638), Galileo noticed that the squares 1, 4, 9, 16, &hellip; can be matched one
          to one with all the positive integers, <M>{"n \\leftrightarrow n^2"}</M>, although most numbers are not squares. He
          concluded that &ldquo;equal&rdquo;, &ldquo;greater&rdquo; and &ldquo;less&rdquo; do not apply to infinite
          quantities. Richard Dedekind turned the paradox into a definition: a set is infinite exactly when it can be matched
          with a proper part of itself. The rest of this chapter takes Galileo&rsquo;s matching seriously.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "union",
      rung: "check",
      prompt: <p>If <M>{"|A| = 12"}</M>, <M>{"|B| = 9"}</M> and <M>{"|A \\cap B| = 4"}</M>, what is <M>{"|A \\cup B|"}</M>?</p>,
      answer: { kind: "numeric", value: 17 },
    },
    {
      key: "power",
      rung: "check",
      prompt: <p>How many subsets does a set with 6 elements have?</p>,
      answer: { kind: "numeric", value: 64 },
    },
    {
      key: "product",
      rung: "apply",
      prompt: <p>How many elements does <M>{"\\mathcal{P}(\\{a, b\\}) \\times \\{1, 2, 3\\}"}</M> have?</p>,
      answer: { kind: "numeric", value: 12 },
    },
    {
      key: "bijections",
      rung: "apply",
      prompt: <p>In how many different orders can 6 objects be counted, that is, how many bijections are there from [6] to a 6-element set?</p>,
      answer: { kind: "numeric", value: 720 },
    },
    {
      key: "three-sets",
      rung: "apply",
      prompt: (
        <p>
          In a class of 40, 22 study Sanskrit, 18 study French, and 7 study both. How many study neither?
        </p>
      ),
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "galileo",
      rung: "prove",
      prompt: (
        <p>
          Prove that the set of positive integers is infinite, by showing that <M>{"n \\mapsto n + 1"}</M> is a bijection onto a
          proper subset and using the theorems of this lesson.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows n ↦ n + 1 is injective.",
          "Identifies its image as the positive integers other than 1, a proper subset, and shows every such integer is hit.",
          "Notes that a finite set has no bijection onto a proper subset.",
          "Concludes that the positive integers are not finite.",
        ],
      },
    },
    {
      key: "subset-finite",
      rung: "stretch",
      prompt: <p>Prove by induction on n that every subset of <M>{"[n]"}</M> is finite, with at most n elements.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Handles n = 0: the only subset of ∅ is ∅, with 0 elements.",
          "For S ⊆ [n + 1], considers S ∖ {n + 1}, a subset of [n].",
          "Applies the hypothesis to S ∖ {n + 1}, then adds back n + 1 if it is in S.",
          "Concludes |S| ≤ n + 1, completing the induction.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how a shepherd with a pile of pebbles is really building a bijection, and why counting in a different order cannot give a different answer.",

  glimpse: (
    <p>
      Galileo&rsquo;s matching of numbers with squares is the doorway to infinite sets. The next lesson asks which infinite sets can be matched with the natural numbers, and finds that surprisingly many can. The pigeonhole principle has its own lesson in Discrete Mathematics.
    </p>
  ),
};
