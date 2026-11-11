import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark } from "@/components/lesson/Blocks";
import { TruthTableViz } from "@/components/viz/TruthTableViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.1.2",
  minutes: 60,
  links: {
    revisits: ["m0.7.4"],
    foreshadows: ["m4.5.4"],
  },

  puzzle: (
    <>
      <p>Consider the statement</p>
      <MD>{"(P \\to Q) \\vee (Q \\to R)."}</MD>
      <p>
        Can you find statements P, Q and R that make it false? Try &ldquo;it is raining&rdquo;, &ldquo;I am in
        Delhi&rdquo;, anything you like. Before searching for long, how many cases would you need to check to be
        <em> certain</em> of the answer?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A compound statement&rsquo;s truth depends only on the truth values of its letters, not on what they say. Three
        letters, each true or false, give <M>{"2 \\times 2 \\times 2 = 8"}</M> cases, by the multiplication principle.
        Check all eight and you know for certain. That is a <strong>truth table</strong>: a complete, mechanical survey.
      </p>
      <p>
        For the puzzle, the answer is that nothing makes it false. If Q is true, <M>{"P \\to Q"}</M> is true; if Q is false,{" "}
        <M>{"Q \\to R"}</M> is true. It is true in every row: a tautology. Build the table below and see.
      </p>
      <TruthTableViz />
    </>
  ),

  theory: (
    <>
      <Definition title="truth table">
        <p>
          A <strong>truth table</strong> for a formula lists every assignment of truth values to its letters, one per row,
          and computes the value of the formula in each row, working outwards from the innermost parts. A formula with{" "}
          <M>n</M> letters has <M>{"2^n"}</M> rows.
        </p>
      </Definition>

      <Definition title="tautology, contradiction, contingency">
        <p>
          A formula is a <strong>tautology</strong> if it is true in every row, a <strong>contradiction</strong> if it is
          false in every row, and <strong>contingent</strong> otherwise. For example <M>{"P \\vee \\neg P"}</M> is a
          tautology, the law of the excluded middle, and <M>{"P \\wedge \\neg P"}</M> is a contradiction.
        </p>
      </Definition>

      <Proposition title="negation swaps the two">
        <p>A formula is a tautology exactly when its negation is a contradiction.</p>
      </Proposition>
      <Proof>
        <p>
          In each row, <M>{"\\neg A"}</M> has the opposite value to <M>A</M>. So <M>A</M> is true in every row exactly when{" "}
          <M>{"\\neg A"}</M> is false in every row.
        </p>
      </Proof>

      <Example title="modus ponens is a tautology">
        <p>
          The formula <M>{"((P \\to Q) \\wedge P) \\to Q"}</M> has four rows. The only way for it to be false is for{" "}
          <M>{"(P \\to Q) \\wedge P"}</M> to be true and Q false. But then P is true, and <M>{"P \\to Q"}</M> with Q false
          forces P false, a contradiction. So no row makes it false. This tautology is the logical form of the most common
          step in any proof: from &ldquo;if P then Q&rdquo; and &ldquo;P&rdquo;, conclude &ldquo;Q&rdquo;.
        </p>
      </Example>

      <Definition title="valid argument">
        <p>
          An argument with premises <M>{"A_1, \\ldots, A_k"}</M> and conclusion <M>C</M> is <strong>valid</strong> when
          every row that makes all the premises true also makes <M>C</M> true; equivalently, when{" "}
          <M>{"(A_1 \\wedge \\cdots \\wedge A_k) \\to C"}</M> is a tautology.
        </p>
      </Definition>

      <Remark title="the cost of certainty">
        <p>
          Truth tables always give an answer, but the work doubles with every new letter: 10 letters need 1024 rows, and 100
          letters need so many that a computer checking a billion rows a second would not finish in the age of the universe. Whether some cleverer method can decide every
          formula quickly is the famous P versus NP problem, one of the great open questions of mathematics. A prize of a
          million dollars awaits its solver.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rows",
      rung: "check",
      prompt: <p>How many rows does the truth table of a formula with 5 different letters have?</p>,
      answer: { kind: "numeric", value: 32 },
    },
    {
      key: "classify",
      rung: "check",
      prompt: <p>Which of these are tautologies?</p>,
      answer: {
        kind: "choice",
        options: ["P → P", "P → ¬P", "(P ∧ Q) → P", "P → (P ∧ Q)"],
        correct: [0, 2],
      },
    },
    {
      key: "false-rows",
      rung: "apply",
      prompt: <p>In how many rows of its truth table is <M>{"(P \\vee Q) \\to R"}</M> false?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "contradiction",
      rung: "apply",
      prompt: <p>Which of these is a contradiction?</p>,
      answer: {
        kind: "choice",
        options: ["(P → Q) ∧ (P ∧ ¬Q)", "(P → Q) ∧ ¬P", "P ↔ ¬P", "P ∨ (Q ∧ ¬Q)"],
        correct: [0, 2],
      },
    },
    {
      key: "valid",
      rung: "apply",
      prompt: <p>Which arguments are valid?</p>,
      answer: {
        kind: "choice",
        options: [
          "P → Q, Q; therefore P",
          "P → Q, ¬Q; therefore ¬P",
          "P ∨ Q, ¬P; therefore Q",
          "P → Q; therefore Q → P",
        ],
        correct: [1, 2],
      },
    },
    {
      key: "puzzle-proof",
      rung: "prove",
      prompt: <p>Prove, without writing out all eight rows, that <M>{"(P \\to Q) \\vee (Q \\to R)"}</M> is a tautology.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Splits into two cases according to whether Q is true or false.",
          "If Q is true, shows P → Q is true, so the disjunction is true.",
          "If Q is false, shows Q → R is true, so the disjunction is true.",
          "Concludes that the formula is true in every row.",
        ],
      },
    },
    {
      key: "count-formulas",
      rung: "stretch",
      prompt: (
        <p>
          Two formulas in P and Q &ldquo;behave the same&rdquo; if they have the same final column. How many genuinely
          different final columns are possible for formulas in the two letters P and Q?
        </p>
      ),
      answer: { kind: "numeric", value: 16 },
    },
  ],

  teachBack:
    "Explain to a friend how a truth table decides whether a formula is a tautology, and why the number of rows doubles with each new letter.",

  glimpse: (
    <p>
      Next, logical equivalence: when two different formulas say the same thing. In Discrete Mathematics, the question of how fast tautologies can be recognised leads to the famous problem of P and NP.
    </p>
  ),
};
