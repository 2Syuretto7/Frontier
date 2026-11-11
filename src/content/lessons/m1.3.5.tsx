import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { BisectionViz } from "@/components/viz/BisectionViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.3.5",
  minutes: 70,
  links: {
    revisits: ["m0.3.3", "m1.2.2"],
    foreshadows: ["m2.3.2"],
  },

  puzzle: (
    <>
      <p>Is there a real number x with <M>{"x^3 + x = 1"}</M>?</p>
      <p>
        You cannot easily solve it: there is a formula for cubic equations, but it is long and few people remember it. Yet it
        is possible to prove, in a few lines and without finding x, that there is <em>exactly one</em> such number. How can
        you know a number exists, and that there is only one, without ever writing it down?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Let <M>{"f(x) = x^3 + x - 1"}</M>. Then <M>{"f(0) = -1"}</M> is below zero and <M>{"f(1) = 1"}</M> is above. A
        smooth, unbroken graph that starts below the axis and ends above it must cross the axis somewhere in between. That
        proves <strong>existence</strong>. And f is increasing everywhere, so once it has crossed it can never come back:
        that proves <strong>uniqueness</strong>.
      </p>
      <p>
        Below, you can also close in on the root by repeatedly halving the interval and keeping the half where the sign
        changes. Halving never finds the root exactly, but it traps it as tightly as you like.
      </p>
      <BisectionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="existence and uniqueness">
        <p>
          <M>{"\\exists!\\, x\\, P(x)"}</M>, read &ldquo;there exists a unique x such that P(x)&rdquo;, means
        </p>
        <MD>{"\\exists x\\, P(x) \\quad \\text{and} \\quad \\forall x\\, \\forall y\\, \\big( (P(x) \\wedge P(y)) \\to x = y \\big)."}</MD>
        <p>
          So it is proved in two parts. <strong>Existence:</strong> show that some x works. <strong>Uniqueness:</strong>{" "}
          suppose x and y both work, and show <M>{"x = y"}</M>.
        </p>
      </Definition>

      <Theorem title="a unique solution">
        <p>For real numbers a and b with <M>{"a \\ne 0"}</M>, the equation <M>{"ax + b = 0"}</M> has exactly one solution.</p>
      </Theorem>
      <Proof>
        <p>
          <em>Existence.</em> Let <M>{"x = -b/a"}</M>, which makes sense as <M>{"a \\ne 0"}</M>. Then{" "}
          <M>{"ax + b = -b + b = 0"}</M>.
        </p>
        <p>
          <em>Uniqueness.</em> Suppose <M>{"ax + b = 0"}</M> and <M>{"ay + b = 0"}</M>. Subtracting, <M>{"a(x - y) = 0"}</M>.
          Since <M>{"a \\ne 0"}</M>, we can divide by a to get <M>{"x - y = 0"}</M>, so <M>{"x = y"}</M>.
        </p>
      </Proof>

      <Definition title="constructive and non-constructive proofs">
        <p>
          A <strong>constructive</strong> existence proof exhibits a witness, as above. A{" "}
          <strong>non-constructive</strong> proof shows that something exists without saying which thing it is. The cubic in
          the puzzle is half-way: the sign-change argument does not name the root, though bisection lets you compute it to any
          accuracy you like.
        </p>
      </Definition>

      <Theorem title="an irrational power can be rational">
        <p>There are irrational numbers a and b such that <M>{"a^b"}</M> is rational.</p>
      </Theorem>
      <Proof>
        <p>
          Consider <M>{"\\sqrt 2^{\\sqrt 2}"}</M>. It is either rational or irrational. If it is rational, take{" "}
          <M>{"a = b = \\sqrt 2"}</M>. If it is irrational, take <M>{"a = \\sqrt 2^{\\sqrt 2}"}</M> and{" "}
          <M>{"b = \\sqrt 2"}</M>; then
        </p>
        <MD>{"a^b = \\big(\\sqrt 2^{\\sqrt 2}\\big)^{\\sqrt 2} = \\sqrt 2^{\\sqrt 2 \\cdot \\sqrt 2} = \\sqrt 2^{\\,2} = 2."}</MD>
        <p>Either way, the required pair exists.</p>
      </Proof>

      <Remark title="a proof some mathematicians reject">
        <p>
          The proof above is complete, yet at its end you still do not know which pair works. (In fact{" "}
          <M>{"\\sqrt 2^{\\sqrt 2}"}</M> is irrational, but that needs a deep theorem proved in the 1930s.) The Dutch mathematician
          L. E. J. Brouwer held that such proofs, which rely on &ldquo;either P or not P&rdquo; without knowing which, do not
          really establish existence. His school, <strong>intuitionism</strong>, accepts an existence claim only when a
          witness can be constructed. Most mathematicians accept non-constructive proofs, but the debate shaped modern logic
          and computer science.
        </p>
      </Remark>

      <Remark title="why uniqueness matters">
        <p>
          Uniqueness is what lets us say <em>the</em> solution, and give it a name. When we write <M>{"\\sqrt 2"}</M>, we rely
          on there being exactly one positive number whose square is 2. In the theory of differential equations, a theorem of
          exactly this shape tells you when an equation of motion has one and only one future.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "unique",
      rung: "check",
      prompt: <p>What does <M>{"\\exists!\\, x\\, P(x)"}</M> say?</p>,
      answer: {
        kind: "choice",
        options: ["At least one x satisfies P.", "Exactly one x satisfies P.", "At most one x satisfies P.", "Every x satisfies P."],
        correct: [1],
      },
    },
    {
      key: "between",
      rung: "check",
      prompt: <p>Which number is a constructive witness for &ldquo;there is a rational number strictly between 1/3 and 1/2&rdquo;?</p>,
      answer: { kind: "choice", options: ["5/12", "1/2", "√2/3", "2/3"], correct: [0] },
    },
    {
      key: "bisect",
      rung: "apply",
      prompt: (
        <p>
          Starting from the interval [0, 1] for <M>{"f(x) = x^3 + x - 1"}</M>, halve twice, each time keeping the half where
          the sign changes. What is the right-hand end of the interval after two halvings?
        </p>
      ),
      answer: { kind: "numeric", value: 0.75 },
    },
    {
      key: "count",
      rung: "apply",
      prompt: <p>How many real solutions does <M>{"x^3 + x - 1 = 0"}</M> have?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "excluded-middle",
      rung: "apply",
      prompt: <p>Which principle makes the proof about <M>{"\\sqrt 2^{\\sqrt 2}"}</M> non-constructive?</p>,
      answer: {
        kind: "choice",
        options: [
          "That every number is rational or irrational, used without knowing which.",
          "That √2 is irrational.",
          "That powers multiply when nested.",
          "That 2 is rational.",
        ],
        correct: [0],
      },
    },
    {
      key: "identity",
      rung: "prove",
      prompt: (
        <p>
          Prove that there is exactly one real number e such that <M>{"e \\cdot x = x"}</M> for every real number x.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Existence: gives e = 1 and checks 1 · x = x for every x.",
          "Uniqueness: supposes e and e′ both have the property.",
          "Applies the property to a suitable x, for instance x = 1, to get e = e′ (or uses e = e · e′ = e′).",
        ],
      },
    },
    {
      key: "at-most-one",
      rung: "stretch",
      prompt: <p>Prove, without calculus, that <M>{"x^3 + x = 1"}</M> has at most one real solution.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Supposes two different solutions, or shows that a < b implies a³ + a < b³ + b.",
          "Justifies that a < b implies a³ < b³, for instance by factoring b³ − a³ = (b − a)(a² + ab + b²) and showing the second factor is positive, or by cases on signs.",
          "Concludes that two different numbers cannot both give 1, so there is at most one solution.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how you can be sure that x³ + x = 1 has exactly one real solution, without ever solving it.",

  glimpse: (
    <p>
      The step &ldquo;an unbroken graph from below to above must cross&rdquo; is the intermediate value theorem, which Real Analysis proves from the completeness of the real numbers. Bisection is the simplest root-finding method in Numerical Linear Algebra and Scientific Computing, and existence-and-uniqueness theorems tell Convex Optimisation when a problem has exactly one best answer. Next: how to write all of this up so that a reader can follow it.
    </p>
  ),
};
