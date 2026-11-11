import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { QuantifierViz } from "@/components/viz/QuantifierViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.2.2",
  minutes: 60,
  links: {
    revisits: ["m0.1.4", "m1.1.1"],
    foreshadows: ["m1.3.5"],
  },

  puzzle: (
    <>
      <p>Work out <M>{"n^2 + n + 41"}</M> for n = 0, 1, 2, 3, 4. You get 41, 43, 47, 53, 61: all prime.</p>
      <p>
        Euler noticed in 1772 that this goes on: every value up to n = 39 is prime. Forty successes in a row. Is{" "}
        <M>{"n^2 + n + 41"}</M> prime for <em>every</em> whole number n? Before reading on, try n = 40, and then n = 41.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        At n = 40 the value is <M>{"1600 + 40 + 41 = 1681 = 41^2"}</M>, which is not prime. Forty examples did not prove
        &ldquo;for every n&rdquo;; one counterexample was enough to refute it. At n = 41 the value is plainly divisible by 41
        too.
      </p>
      <p>
        The previous lesson turned a predicate into a statement by filling in a value. Here is the other way: say how many
        values make it true. &ldquo;<strong>For all</strong> x&rdquo; claims every element works; &ldquo;
        <strong>there exists</strong> an x&rdquo; claims at least one does. Try both below, and watch the domain change the
        verdict.
      </p>
      <QuantifierViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the quantifiers">
        <p>For a predicate <M>{"P(x)"}</M> over a domain D:</p>
        <ul>
          <li>
            <M>{"\\forall x \\in D,\\ P(x)"}</M>, &ldquo;for all x in D, P(x)&rdquo;, is true when every element of D is in
            the truth set. The symbol <M>{"\\forall"}</M> is the <strong>universal quantifier</strong>.
          </li>
          <li>
            <M>{"\\exists x \\in D,\\ P(x)"}</M>, &ldquo;there exists x in D such that P(x)&rdquo;, is true when at least one
            element is in the truth set. The symbol <M>{"\\exists"}</M> is the <strong>existential quantifier</strong>.
          </li>
        </ul>
        <p>
          A quantified variable is <strong>bound</strong>: <M>{"\\forall x\\, P(x)"}</M> is a statement, with no hole left.
          The letter does not matter; <M>{"\\forall y\\, P(y)"}</M> says exactly the same.
        </p>
      </Definition>

      <Remark title="how each is proved and refuted">
        <p>The puzzle shows an asymmetry worth memorising:</p>
        <ul>
          <li>to prove <M>{"\\forall x\\, P(x)"}</M>, take an <em>arbitrary</em> x and show P(x) using nothing special about it;</li>
          <li>to refute it, produce one <strong>counterexample</strong>;</li>
          <li>to prove <M>{"\\exists x\\, P(x)"}</M>, produce one <strong>witness</strong>;</li>
          <li>to refute it, show every x fails, which is a &ldquo;for all&rdquo; statement.</li>
        </ul>
        <p>No pile of examples, however tall, proves a universal statement over an infinite domain.</p>
      </Remark>

      <Definition title="restricted quantifiers">
        <p>
          &ldquo;Every square is a rectangle&rdquo; and &ldquo;some prime is even&rdquo; talk about only part of the domain.
          They are written
        </p>
        <MD>{"\\forall x\\,\\big(S(x) \\to R(x)\\big) \\qquad \\text{and} \\qquad \\exists x\\,\\big(P(x) \\wedge E(x)\\big)."}</MD>
        <p>
          Universal goes with <M>{"\\to"}</M>, existential goes with <M>{"\\wedge"}</M>. Swapping them is a classic error:{" "}
          <M>{"\\forall x\\,(S(x) \\wedge R(x))"}</M> says everything is a square, and{" "}
          <M>{"\\exists x\\,(P(x) \\to E(x))"}</M> is made true by anything that is not prime at all.
        </p>
      </Definition>

      <Example title="vacuous truth">
        <p>
          &ldquo;Every elephant in this room is pink&rdquo; is <M>{"\\forall x\\,(E(x) \\to P(x))"}</M>. If there are no
          elephants in the room, then <M>{"E(x)"}</M> is false for every x, so every instance of the conditional is true, and
          so is the statement. A universal claim about nothing is <strong>vacuously true</strong>, while the matching
          existential claim, &ldquo;some elephant in this room is pink&rdquo;, is false.
        </p>
      </Example>

      <Example title="a counterexample that took ninety years">
        <p>
          Fermat believed, and wrote in 1640, that every number <M>{"2^{2^n} + 1"}</M> is prime. The values for n = 0 to 4
          are 3, 5, 17, 257 and 65537, all prime. In 1732 Euler found the counterexample: for n = 5,
        </p>
        <MD>{"2^{32} + 1 = 4\\,294\\,967\\,297 = 641 \\times 6\\,700\\,417."}</MD>
      </Example>
    </>
  ),

  practice: [
    {
      key: "verdicts",
      rung: "check",
      prompt: <p>Over the domain 1 to 10, with P(x) being <M>{"x^2 > 50"}</M>, which is right?</p>,
      answer: {
        kind: "choice",
        options: ["∀x P(x) is true and ∃x P(x) is true.", "∀x P(x) is false and ∃x P(x) is true.", "∀x P(x) is true and ∃x P(x) is false.", "Both are false."],
        correct: [1],
      },
    },
    {
      key: "domain",
      rung: "check",
      prompt: <p>Which of these statements are true?</p>,
      answer: {
        kind: "choice",
        options: ["∃x ∈ ℤ, x² = 2", "∃x ∈ ℝ, x² = 2", "∀x ∈ ℤ, x² ≥ x", "∀x ∈ ℝ, x² ≥ x"],
        correct: [1, 2],
      },
    },
    {
      key: "euler",
      rung: "apply",
      prompt: <p>What is the value of <M>{"n^2 + n + 41"}</M> at n = 40?</p>,
      answer: { kind: "numeric", value: 1681 },
    },
    {
      key: "squares",
      rung: "apply",
      prompt: <p>With S(x) for &ldquo;x is a square&rdquo; and R(x) for &ldquo;x is a rectangle&rdquo;, symbolise &ldquo;Every square is a rectangle&rdquo;.</p>,
      answer: { kind: "choice", options: ["∀x (S(x) → R(x))", "∀x (S(x) ∧ R(x))", "∃x (S(x) ∧ R(x))", "∀x (R(x) → S(x))"], correct: [0] },
    },
    {
      key: "some",
      rung: "apply",
      prompt: <p>With P(x) for &ldquo;x is prime&rdquo; and E(x) for &ldquo;x is even&rdquo;, symbolise &ldquo;Some prime is even&rdquo;.</p>,
      answer: { kind: "choice", options: ["∃x (P(x) → E(x))", "∃x (P(x) ∧ E(x))", "∀x (P(x) → E(x))", "∃x P(x) ∧ ∀x E(x)"], correct: [1] },
    },
    {
      key: "square-proof",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"\\forall x \\in \\mathbb{R},\\ x^2 - 2x + 1 \\ge 0"}</M>, and that{" "}
          <M>{"\\exists x \\in \\mathbb{R},\\ x^2 - 2x + 1 = 0"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Takes an arbitrary real x rather than checking examples.",
          "Rewrites x² − 2x + 1 as (x − 1)² and notes that a square of a real number is never negative.",
          "Gives the witness x = 1 for the existential statement and checks it.",
        ],
      },
    },
    {
      key: "fermat",
      rung: "stretch",
      prompt: <p>Euler found that 641 divides <M>{"2^{32} + 1 = 4\\,294\\,967\\,297"}</M>. What is the other factor?</p>,
      answer: { kind: "numeric", value: 6700417 },
    },
  ],

  teachBack:
    "Explain to a friend why a thousand examples cannot prove a statement about every whole number, while one counterexample can refute it, and why the opposite holds for 'there exists'.",

  glimpse: (
    <p>
      To use quantifiers in proofs you must be able to deny them, and that is the next lesson: what is the opposite of
      &ldquo;every&rdquo;? After that come statements with several quantifiers, where order matters a great deal. Existence
      proofs, and Euclid&rsquo;s proof that there are infinitely many primes, are built on these foundations.
    </p>
  ),
};
