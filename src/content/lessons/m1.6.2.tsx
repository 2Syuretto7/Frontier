import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { PartitionViz } from "@/components/viz/PartitionViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.6.2",
  minutes: 65,
  links: {
    revisits: ["m1.5.3", "m1.1.3"],
    foreshadows: ["m4.4.3"],
  },

  puzzle: (
    <>
      <p>
        The fractions <M>{"\\tfrac12"}</M>, <M>{"\\tfrac24"}</M> and <M>{"\\tfrac{3}{6}"}</M> are written differently, yet we
        call them the same number. Monday this week and Monday next week are different days, yet we call them the same day of
        the week. 3 o&rsquo;clock and 15 o&rsquo;clock are the same on a clock face.
      </p>
      <p>
        In each case, things that differ are treated as &ldquo;the same in some respect&rdquo;. What must such a notion of
        sameness satisfy? And what are the new objects we have quietly created, such as &ldquo;Monday&rdquo; or &ldquo;one
        half&rdquo;?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Any sensible notion of &ldquo;the same in some respect&rdquo; must have three features. Everything is the same as
        itself. If a is the same as b, then b is the same as a. And sameness passes along chains. These are the reflexive,
        symmetric and transitive properties of the last lesson.
      </p>
      <p>
        Such a relation sorts the set into groups of things that are all the same as one another, with no overlaps and no
        leftovers. Below, the numbers 1 to 24 are sorted by two different notions of sameness. Watch the groups change as n
        changes.
      </p>
      <PartitionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="equivalence relation and class">
        <p>
          An <strong>equivalence relation</strong> on A is a relation <M>{"\\sim"}</M> that is reflexive, symmetric and
          transitive. The <strong>equivalence class</strong> of <M>{"a \\in A"}</M> is
        </p>
        <MD>{"[a] = \\{\\, x \\in A : x \\sim a \\,\\}."}</MD>
      </Definition>

      <Definition title="partition">
        <p>
          A <strong>partition</strong> of A is a collection of non-empty subsets of A, called <strong>blocks</strong>, such
          that every element of A lies in exactly one block.
        </p>
      </Definition>

      <Theorem title="equivalence classes partition the set">
        <p>
          If <M>{"\\sim"}</M> is an equivalence relation on A, then its equivalence classes form a partition of A. Moreover{" "}
          <M>{"[a] = [b]"}</M> if and only if <M>{"a \\sim b"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each class is non-empty, and every a lies in some class, since <M>{"a \\in [a]"}</M> by reflexivity. Next, suppose{" "}
          <M>{"a \\sim b"}</M>. If <M>{"x \\in [a]"}</M>, then <M>{"x \\sim a"}</M> and <M>{"a \\sim b"}</M>, so{" "}
          <M>{"x \\sim b"}</M> by transitivity, and <M>{"x \\in [b]"}</M>. So <M>{"[a] \\subseteq [b]"}</M>, and by symmetry the
          same argument gives <M>{"[b] \\subseteq [a]"}</M>. Conversely, if <M>{"[a] = [b]"}</M> then{" "}
          <M>{"a \\in [b]"}</M>, so <M>{"a \\sim b"}</M>.
        </p>
        <p>
          Finally, if two classes <M>{"[a]"}</M> and <M>{"[b]"}</M> share an element x, then <M>{"x \\sim a"}</M> and{" "}
          <M>{"x \\sim b"}</M>, so <M>{"a \\sim b"}</M> by symmetry and transitivity, and <M>{"[a] = [b]"}</M>. So two classes
          are either equal or disjoint, and every element lies in exactly one.
        </p>
      </Proof>
      <p>
        The converse also holds: given a partition, &ldquo;lies in the same block as&rdquo; is an equivalence relation whose
        classes are the blocks. Equivalence relations and partitions are two descriptions of one thing.
      </p>

      <Example title="congruence modulo n">
        <p>
          Fix <M>{"n \\ge 1"}</M>. Say <M>{"a \\equiv b \\pmod n"}</M> if n divides <M>{"a - b"}</M>. This is an equivalence
          relation on the integers: n divides 0; if n divides <M>{"a - b"}</M> it divides <M>{"b - a"}</M>; and if n divides{" "}
          <M>{"a - b"}</M> and <M>{"b - c"}</M>, it divides their sum <M>{"a - c"}</M>. By the division algorithm, every
          integer is congruent to exactly one of <M>{"0, 1, \\dots, n - 1"}</M>, so there are exactly n classes.
        </p>
      </Example>

      <Remark title="making new objects">
        <p>
          The set of equivalence classes is written <M>{"A/\\!\\sim"}</M> and called the <strong>quotient</strong>. This is how
          mathematics manufactures new objects from old. A rational number can be defined as a class of pairs of integers{" "}
          <M>{"(p, q)"}</M> with <M>{"q \\ne 0"}</M>, where <M>{"(p, q) \\sim (r, s)"}</M> when <M>{"ps = qr"}</M>: the
          number one half <em>is</em> the class containing <M>{"(1, 2)"}</M>, <M>{"(2, 4)"}</M>, <M>{"(3, 6)"}</M> and so on.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "is-equiv",
      rung: "check",
      prompt: <p>Which of these are equivalence relations on the set of all people?</p>,
      answer: {
        kind: "choice",
        options: ["was born in the same year as", "is taller than", "has the same first letter of their name as", "is a friend of"],
        correct: [0, 2],
      },
    },
    {
      key: "classes-5",
      rung: "check",
      prompt: <p>How many equivalence classes does congruence modulo 5 have on the integers?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "class-of",
      rung: "apply",
      prompt: <p>Which of these lie in the same class as 17 under congruence modulo 6?</p>,
      answer: { kind: "choice", options: ["5", "11", "23", "−1", "12"], correct: [0, 1, 2, 3] },
    },
    {
      key: "partitions-3",
      rung: "apply",
      prompt: <p>How many different equivalence relations are there on <M>{"\\{a, b, c\\}"}</M>? (Count the partitions.)</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "fractions",
      rung: "apply",
      prompt: (
        <p>
          With <M>{"(p, q) \\sim (r, s)"}</M> when <M>{"ps = qr"}</M>, for which value of r is <M>{"(r, 21) \\sim (2, 7)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "fraction-trans",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"(p, q) \\sim (r, s) \\iff ps = qr"}</M> is transitive on pairs of integers with non-zero second
          entry.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Assumes ps = qr and ru = st, aiming for pu = qt.",
          "Multiplies to combine the equations, for instance psu = qru = qst.",
          "Cancels the non-zero s to get pu = qt, noting why s ≠ 0 is needed.",
          "Concludes that the relation is transitive.",
        ],
      },
    },
    {
      key: "partition-to-relation",
      rung: "stretch",
      prompt: (
        <p>
          Given a partition of A, define <M>{"a \\sim b"}</M> when a and b lie in the same block. Prove that{" "}
          <M>{"\\sim"}</M> is an equivalence relation whose classes are exactly the blocks.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Proves reflexivity using that every element lies in some block.",
          "Proves symmetry directly from the definition.",
          "Proves transitivity using that b lies in exactly one block.",
          "Shows the class of a is the block containing a.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why 'has the same remainder on division by 3' sorts the integers into three groups with no overlaps, and how 'one half' can be thought of as a whole class of fractions.",

  glimpse: (
    <p>
      An equivalence relation forgets differences; an order keeps track of which comes first. Partial and total orders come next. Congruence modulo n becomes modular arithmetic in Discrete Mathematics, and Geometry and Symmetry in Deep Learning studies networks whose outputs depend only on the equivalence class of their input.
    </p>
  ),
};
