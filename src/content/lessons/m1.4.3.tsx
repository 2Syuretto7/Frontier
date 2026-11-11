import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { SetOpsViz } from "@/components/viz/SetOpsViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.4.3",
  minutes: 65,
  links: {
    revisits: ["m1.1.3", "m1.4.1"],
    foreshadows: ["m4.1.1", "m7.1.1", "m18.1.1"],
  },

  puzzle: (
    <>
      <p>
        In a class of 40 students, 25 study music, 18 study art, and 7 study both. How many study neither?
      </p>
      <p>
        Adding 25 and 18 gives 43, more than the whole class, so something has been counted twice. What exactly, and how do
        you correct for it? The answer is easy once you see the right picture, and the picture is the subject of this
        lesson.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The 7 students who study both were counted once among the musicians and again among the artists. So the number who
        study at least one is <M>{"25 + 18 - 7 = 36"}</M>, and <M>{"40 - 36 = 4"}</M> study neither. The picture is a Venn
        diagram: two overlapping circles inside a box. Each way of combining sets shades a region.
      </p>
      <p>
        The connectives of logic have exact counterparts here: &ldquo;or&rdquo; is union, &ldquo;and&rdquo; is
        intersection, &ldquo;not&rdquo; is complement. So the laws of logic become laws of sets. Test some below with three
        sets.
      </p>
      <SetOpsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the operations">
        <p>For sets A and B inside a universe U:</p>
        <ul>
          <li><strong>union</strong> <M>{"A \\cup B = \\{x : x \\in A \\text{ or } x \\in B\\}"}</M>;</li>
          <li><strong>intersection</strong> <M>{"A \\cap B = \\{x : x \\in A \\text{ and } x \\in B\\}"}</M>;</li>
          <li><strong>difference</strong> <M>{"A \\setminus B = \\{x : x \\in A \\text{ and } x \\notin B\\}"}</M>;</li>
          <li><strong>complement</strong> <M>{"A^c = U \\setminus A"}</M>;</li>
          <li><strong>symmetric difference</strong> <M>{"A \\mathbin{\\triangle} B = (A \\setminus B) \\cup (B \\setminus A)"}</M>, the elements in exactly one.</li>
        </ul>
        <p>A and B are <strong>disjoint</strong> if <M>{"A \\cap B = \\varnothing"}</M>.</p>
      </Definition>

      <Theorem title="laws of set algebra">
        <p>For all sets A, B, C:</p>
        <MD>{"A \\cap (B \\cup C) = (A \\cap B) \\cup (A \\cap C), \\qquad A \\cup (B \\cap C) = (A \\cup B) \\cap (A \\cup C),"}</MD>
        <MD>{"(A \\cup B)^c = A^c \\cap B^c, \\qquad (A \\cap B)^c = A^c \\cup B^c."}</MD>
        <p>The first two are the <strong>distributive laws</strong>; the last two are <strong>De Morgan&rsquo;s laws</strong>.</p>
      </Theorem>
      <Proof>
        <p>
          Take the first distributive law. For any x, <M>{"x \\in A \\cap (B \\cup C)"}</M> means{" "}
          <M>{"x \\in A \\wedge (x \\in B \\vee x \\in C)"}</M>. By the distributive law of logic this is equivalent to{" "}
          <M>{"(x \\in A \\wedge x \\in B) \\vee (x \\in A \\wedge x \\in C)"}</M>, which means{" "}
          <M>{"x \\in (A \\cap B) \\cup (A \\cap C)"}</M>. So the two sets have the same elements. The other laws follow the
          same way from their logical counterparts.
        </p>
      </Proof>

      <Remark title="the Venn diagram as a proof">
        <p>
          Two circles cut the box into 4 regions and three circles into 8, one for each row of a truth table in two or three
          letters. A law about two or three sets holds exactly when both sides shade the same regions, so for these sizes the
          diagram is a complete proof, not just an illustration. For four or more sets, circles can no longer show every
          region, and other shapes are needed.
        </p>
      </Remark>

      <Theorem title="counting a union">
        <p>For finite sets A and B, <M>{"|A \\cup B| = |A| + |B| - |A \\cap B|"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          <M>{"|A| + |B|"}</M> counts each element of <M>{"A \\cap B"}</M> twice and every other element of{" "}
          <M>{"A \\cup B"}</M> once. Subtracting <M>{"|A \\cap B|"}</M> corrects the double count.
        </p>
      </Proof>

      <Example title="three sets">
        <p>
          For three sets the correction has three stages: add the sizes, subtract the pairwise overlaps, then add back the
          triple overlap, which was added three times and subtracted three times:
        </p>
        <MD>{"|A \\cup B \\cup C| = |A| + |B| + |C| - |A \\cap B| - |A \\cap C| - |B \\cap C| + |A \\cap B \\cap C|."}</MD>
        <p>This is the start of the <strong>inclusion-exclusion principle</strong>.</p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "compute",
      rung: "check",
      prompt: <p>With <M>{"A = \\{1, 2, 3, 4\\}"}</M> and <M>{"B = \\{3, 4, 5\\}"}</M>, which is <M>{"A \\setminus B"}</M>?</p>,
      answer: { kind: "choice", options: ["{1, 2}", "{5}", "{3, 4}", "{1, 2, 5}"], correct: [0] },
    },
    {
      key: "symmetric",
      rung: "check",
      prompt: <p>With the same A and B, how many elements does <M>{"A \\mathbin{\\triangle} B"}</M> have?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "neither",
      rung: "apply",
      prompt: <p>In the puzzle, how many students study neither music nor art?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "de-morgan",
      rung: "apply",
      prompt: <p>Which set equals <M>{"(A \\cap B)^c"}</M>?</p>,
      answer: { kind: "choice", options: ["Aᶜ ∩ Bᶜ", "Aᶜ ∪ Bᶜ", "A ∪ B", "A ∖ B"], correct: [1] },
    },
    {
      key: "three-sets",
      rung: "apply",
      prompt: (
        <p>
          Of 100 people, 50 read English newspapers, 40 Hindi, 30 Tamil; 15 read English and Hindi, 10 English and Tamil, 8
          Hindi and Tamil, and 3 read all three. How many read at least one?
        </p>
      ),
      answer: { kind: "numeric", value: 90 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`A, B = {1, 2, 3, 4}, {3, 4, 5}
print(sorted(A - B), sorted(A ^ B))`}</Code>
          <p>Difference and symmetric difference. How many elements does A ^ B have?</p>
        </>
      ),
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>union(A, B)</C>, <C>intersection(A, B)</C> and <C>difference(A, B)</C> with comprehensions, without the operators <C>|</C>, <C>&amp;</C> and <C>-</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def union(A, B):
    return set()

def intersection(A, B):
    return set()

def difference(A, B):
    return set()
`,
        solution: `def union(A, B):
    return {x for S in (A, B) for x in S}

def intersection(A, B):
    return {x for x in A if x in B}

def difference(A, B):
    return {x for x in A if x not in B}
`,
        tests: [
          { name: "operations", code: `A, B = {1, 2, 3, 4}, {3, 4, 5}
assert union(A, B) == {1, 2, 3, 4, 5} and intersection(A, B) == {3, 4} and difference(A, B) == {1, 2}, 'Check each operation on A = {1, 2, 3, 4}, B = {3, 4, 5}.'` },
          { name: "De Morgan", code: `U = set(range(10)); A, B = {1, 2, 3}, {3, 4}
assert difference(U, union(A, B)) == intersection(difference(U, A), difference(U, B)), 'The complement of a union is the intersection of the complements.'` },
        ],
      },
    },
    {
      key: "diff-law",
      rung: "prove",
      prompt: <p>Prove that <M>{"A \\setminus (B \\cup C) = (A \\setminus B) \\cap (A \\setminus C)"}</M>.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes membership of the left side as x ∈ A and not (x ∈ B or x ∈ C).",
          "Uses De Morgan's law to rewrite it as x ∈ A and x ∉ B and x ∉ C.",
          "Shows this is the same as x ∈ A ∖ B and x ∈ A ∖ C, so the sets are equal (or argues by double inclusion).",
        ],
      },
    },
    {
      key: "not-assoc",
      rung: "stretch",
      prompt: (
        <p>
          Show that set difference is not associative: find sets A, B, C with{" "}
          <M>{"A \\setminus (B \\setminus C) \\ne (A \\setminus B) \\setminus C"}</M>, and prove that{" "}
          <M>{"(A \\setminus B) \\setminus C \\subseteq A \\setminus (B \\setminus C)"}</M> always holds.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Gives a concrete example, such as A = B = C = {1}, where the two sides differ, and computes both.",
          "For the inclusion, takes x in (A ∖ B) ∖ C, so x ∈ A, x ∉ B and x ∉ C.",
          "Notes that x ∉ B implies x ∉ B ∖ C, so x ∈ A ∖ (B ∖ C).",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why |A ∪ B| = |A| + |B| − |A ∩ B|, using the music and art class.",

  glimpse: (
    <p>
      Next, unions and intersections of whole families of sets, even infinitely many at once. Inclusion-exclusion is a basic tool of counting in Discrete Mathematics, and in Probability the same formula reads{" "}
      <M>{"P(A \\cup B) = P(A) + P(B) - P(A \\cap B)"}</M>. Measure-Theoretic Probability begins from families of sets closed under these operations.
    </p>
  ),
};
