import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { HilbertViz } from "@/components/viz/HilbertViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.8.2",
  minutes: 65,
  links: {
    revisits: ["m1.4.5", "m1.7.3"],
    foreshadows: ["m8.1.3"],
  },

  puzzle: (
    <>
      <p>
        A hotel has infinitely many rooms, numbered 1, 2, 3, &hellip;, and every room is occupied. A new guest arrives. The
        manager is not worried, and asks every guest to move from room n to room <M>{"n + 1"}</M>. Room 1 is now free.
      </p>
      <p>
        Then a coach arrives with infinitely many new guests. Can the full hotel still take them all? And what about
        infinitely many coaches, each carrying infinitely many guests?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        For the coach, move each guest from room n to room 2n; the odd-numbered rooms are now free for the newcomers. The
        story, told by David Hilbert in the 1920s, makes the point of Galileo&rsquo;s paradox vivid: an infinite set can be
        matched with a part of itself.
      </p>
      <p>
        A set that can be listed as a first, second, third element, and so on, with every element appearing somewhere, is
        called countable. Below are four such lists. The last two need a trick, and the trick also solves the problem of
        infinitely many coaches.
      </p>
      <HilbertViz />
    </>
  ),

  theory: (
    <>
      <Definition title="countable sets">
        <p>
          A set A is <strong>countably infinite</strong> if there is a bijection <M>{"\\mathbb{N} \\to A"}</M>, where{" "}
          <M>{"\\mathbb{N} = \\{0, 1, 2, \\dots\\}"}</M>. Such a bijection lists A as <M>{"a_0, a_1, a_2, \\dots"}</M> without
          repetition. A set is <strong>countable</strong> if it is finite or countably infinite.
        </p>
      </Definition>

      <Example title="the integers">
        <p>The function</p>
        <MD>{"f(n) = \\begin{cases} (n + 1)/2 & n \\text{ odd} \\\\ -n/2 & n \\text{ even} \\end{cases}"}</MD>
        <p>lists the integers as 0, 1, <M>{"-1"}</M>, 2, <M>{"-2"}</M>, &hellip; and is a bijection <M>{"\\mathbb{N} \\to \\mathbb{Z}"}</M>.</p>
      </Example>

      <Theorem title="pairs of natural numbers">
        <p><M>{"\\mathbb{N} \\times \\mathbb{N}"}</M> is countable.</p>
      </Theorem>
      <Proof>
        <p>
          List the pairs <M>{"(m, n)"}</M> by the diagonals <M>{"m + n = 0, 1, 2, \\dots"}</M>, and within each diagonal by
          increasing m. The diagonal <M>{"m + n = s"}</M> has <M>{"s + 1"}</M> pairs, and the diagonals before it have{" "}
          <M>{"1 + 2 + \\cdots + s = s(s + 1)/2"}</M> pairs in all. So <M>{"(m, n)"}</M> is in position
        </p>
        <MD>{"\\pi(m, n) = \\frac{(m + n)(m + n + 1)}{2} + m,"}</MD>
        <p>
          counting from 0. Every pair has a position, and different pairs have different positions, so this is a bijection{" "}
          <M>{"\\mathbb{N} \\times \\mathbb{N} \\to \\mathbb{N}"}</M>, with inverse listing the pairs.
        </p>
      </Proof>

      <Theorem title="useful facts">
        <ol>
          <li>Every subset of a countable set is countable.</li>
          <li>If there is a surjection from a countable set onto A, then A is countable.</li>
          <li>The rational numbers are countable.</li>
        </ol>
      </Theorem>
      <Proof>
        <p>
          (1) List the countable set and delete the elements not in the subset; what remains is a finite list or an infinite
          list without repeats. (2) If <M>{"g : C \\to A"}</M> is onto, list C and replace each element c by{" "}
          <M>{"g(c)"}</M>; deleting repeats lists A. (3) The map <M>{"(p, q) \\mapsto p/(q + 1)"}</M> from{" "}
          <M>{"\\mathbb{Z} \\times \\mathbb{N}"}</M> onto <M>{"\\mathbb{Q}"}</M> is surjective, and{" "}
          <M>{"\\mathbb{Z} \\times \\mathbb{N}"}</M> is countable by the theorem on pairs, since <M>{"\\mathbb{Z}"}</M> is.
        </p>
      </Proof>

      <Remark title="infinitely many coaches">
        <p>
          Put the guest in seat n of coach m into room <M>{"\\pi(m, n)"}</M> after moving the residents to the even rooms, and
          everyone fits. The same idea shows that a countable union of countable sets is countable, though for infinitely many
          sets the proof must choose a listing of each one at once: a first appearance of the axiom of choice.
        </p>
      </Remark>

      <Remark title="dense yet countable">
        <p>
          The rationals are packed densely on the number line: between any two lies a third. Yet they can be listed, one after
          another, as the visualisation shows. How crowded a set looks says nothing about how many elements it has. That raises
          the obvious question: is every infinite set countable?
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "hotel",
      rung: "check",
      prompt: <p>In the full hotel, 5 new guests arrive. Every guest in room n moves to which room?</p>,
      answer: { kind: "expression", value: "n+5", variables: ["n"] },
    },
    {
      key: "which-countable",
      rung: "check",
      prompt: <p>Which of these sets are countable?</p>,
      answer: {
        kind: "choice",
        options: ["the multiples of 7", "ℤ × ℤ", "the positive rational numbers", "the prime numbers"],
        correct: [0, 1, 2, 3],
      },
    },
    {
      key: "int-list",
      rung: "apply",
      prompt: <p>In the list 0, 1, −1, 2, −2, 3, &hellip; of the integers, counting positions from 0, which integer is in position 10?</p>,
      answer: { kind: "numeric", value: -5 },
    },
    {
      key: "pairing",
      rung: "apply",
      prompt: <p>Using <M>{"\\pi(m, n) = \\tfrac{(m + n)(m + n + 1)}{2} + m"}</M>, what is <M>{"\\pi(2, 3)"}</M>?</p>,
      answer: { kind: "numeric", value: 17 },
    },
    {
      key: "unpair",
      rung: "apply",
      prompt: <p>Which pair <M>{"(m, n)"}</M> has <M>{"\\pi(m, n) = 12"}</M>?</p>,
      answer: { kind: "choice", options: ["(2, 2)", "(2, 3)", "(3, 1)", "(1, 3)"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def z(n):
    return n // 2 if n % 2 == 0 else -(n + 1) // 2
print([z(n) for n in range(7)])`}</Code>
          <p>This lists the integers without repetition, proving ℤ is countable. What is z(5)?</p>
        </>
      ),
      answer: { kind: "numeric", value: -3 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>pair(k)</C>, which returns the k-th pair (a, b) of non-negative integers in Cantor&rsquo;s diagonal order (0, 0), (0, 1), (1, 0), (0, 2), (1, 1), (2, 0), …, showing ℕ × ℕ is countable.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def pair(k):
    return (k, 0)
`,
        solution: `def pair(k):
    d = 0
    while (d + 1) * (d + 2) // 2 <= k:
        d += 1
    i = k - d * (d + 1) // 2
    return (i, d - i)
`,
        tests: [
          { name: "start", code: `assert [pair(k) for k in range(6)] == [(0, 0), (0, 1), (1, 0), (0, 2), (1, 1), (2, 0)], 'Walk each diagonal a + b = d with a increasing.'` },
          { name: "covers", code: `assert {pair(k) for k in range(55)} == {(a, b) for a in range(10) for b in range(10) if a + b < 10}, 'The first 55 pairs cover every diagonal up to d = 9 exactly once.'` },
        ],
      },
    },
    {
      key: "finite-strings",
      rung: "prove",
      prompt: (
        <p>
          Prove that the set of all finite strings of letters from the English alphabet is countable. (Hint: list the strings
          by length.)
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes there are 26ᵏ strings of length k, a finite number.",
          "Lists all strings of length 0, then of length 1, then of length 2, and so on, each block in alphabetical order.",
          "Argues that every string appears at a finite position, exactly once.",
          "Concludes the set is countable.",
        ],
      },
    },
    {
      key: "union",
      rung: "stretch",
      prompt: (
        <p>
          Prove that if A and B are countably infinite, then <M>{"A \\cup B"}</M> is countable. Then prove that{" "}
          <M>{"A \\times B"}</M> is countable.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Lists A as a₀, a₁, … and B as b₀, b₁, ….",
          "For the union, interleaves the lists a₀, b₀, a₁, b₁, … and deletes repeats, or gives a surjection from ℕ.",
          "For the product, uses (aₘ, bₙ) ↦ (m, n) as a bijection with ℕ × ℕ.",
          "Uses the countability of ℕ × ℕ to conclude.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how a full hotel with infinitely many rooms can take in a coach of infinitely many new guests, and why the fractions can be listed even though they are packed so densely.",

  glimpse: (
    <p>
      Is every infinite set countable? The next lesson gives Cantor&rsquo;s famous answer: no, and the real numbers are the first example. Countability returns in Real Analysis, and in Measure-Theoretic Probability, where countable unions are exactly what probability is allowed to add up.
    </p>
  ),
};
