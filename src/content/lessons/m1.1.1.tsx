import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { ConnectiveViz } from "@/components/viz/ConnectiveViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.1.1",
  minutes: 60,
  links: {
    foreshadows: ["m1.1.4"],
  },

  puzzle: (
    <>
      <p>A shop sign says: &ldquo;Free delivery on orders over Rs 500 or for members.&rdquo;</p>
      <p>
        You are a member and your order is Rs 800. Do you get free delivery? Surely yes. Now a restaurant menu says the thali
        comes &ldquo;with rice or roti&rdquo;, and you ask for both. Will the waiter agree? Probably not. The same little word
        &ldquo;or&rdquo; seems to mean two different things. Before mathematics can prove anything, it has to decide exactly
        what words like &ldquo;or&rdquo;, &ldquo;and&rdquo; and &ldquo;if&rdquo; mean.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Mathematics builds its sentences from simple statements, each either true or false, joined by a handful of words:
        not, and, or, if&hellip;then, if and only if. Ordinary language uses these words loosely, and context fills the gaps.
        Mathematics cannot rely on context, so it fixes each meaning once and for all by saying exactly when the compound
        statement is true, given whether its parts are.
      </p>
      <p>
        The choices are not arbitrary, but some are surprising. Mathematical &ldquo;or&rdquo; is the shop sign&rsquo;s
        &ldquo;or&rdquo;, which allows both. And &ldquo;if P then Q&rdquo; counts as true whenever P is false. Flip P and Q
        below and watch each connective respond.
      </p>
      <ConnectiveViz />
    </>
  ),

  theory: (
    <>
      <Definition title="statement">
        <p>
          A <strong>statement</strong>, or proposition, is a sentence that is either true or false, though we may not know
          which. &ldquo;7 is prime&rdquo; and &ldquo;every even number greater than 2 is a sum of two primes&rdquo; are
          statements; the second is Goldbach&rsquo;s conjecture, and nobody knows its truth value. &ldquo;Close the
          door&rdquo; and &ldquo;<M>{"x > 3"}</M>&rdquo; are not: the first is a command, and the second depends on what{" "}
          <M>x</M> is.
        </p>
      </Definition>

      <Definition title="the connectives">
        <p>For statements <M>P</M> and <M>Q</M>:</p>
        <ul>
          <li><M>{"\\neg P"}</M> (not P) is true exactly when P is false.</li>
          <li><M>{"P \\wedge Q"}</M> (P and Q) is true exactly when both are true.</li>
          <li><M>{"P \\vee Q"}</M> (P or Q) is true exactly when at least one is true.</li>
          <li><M>{"P \\to Q"}</M> (if P then Q) is false exactly when P is true and Q is false, and true otherwise.</li>
          <li><M>{"P \\leftrightarrow Q"}</M> (P if and only if Q) is true exactly when P and Q have the same truth value.</li>
        </ul>
      </Definition>

      <Remark title="inclusive or">
        <p>
          Mathematical <M>{"\\vee"}</M> is <strong>inclusive</strong>: it allows both. The exclusive sense, &ldquo;one or
          the other but not both&rdquo;, as on the menu, can be written <M>{"(P \\vee Q) \\wedge \\neg(P \\wedge Q)"}</M>.
          When a mathematician says &ldquo;<M>{"n"}</M> is even or <M>{"n^2"}</M> is odd&rdquo;, there is no promise that
          only one holds.
        </p>
      </Remark>

      <Remark title="why a false P makes P → Q true">
        <p>
          Think of <M>{"P \\to Q"}</M> as a promise: &ldquo;if you score above 90, I will buy you a cricket bat&rdquo;. The
          promise is broken only if you score above 90 and get no bat. If you score less, the promise is kept whatever
          happens. There is a deeper reason too. We want &ldquo;for every number <M>n</M>, if <M>n</M> is divisible by 4 then{" "}
          <M>n</M> is even&rdquo; to be true, and that requires the instance with <M>{"n = 3"}</M>, &ldquo;if 3 is divisible
          by 4 then 3 is even&rdquo;, false part and all, to be true.
        </p>
      </Remark>

      <Example title="translating">
        <p>Let <M>P</M> be &ldquo;it is raining&rdquo; and <M>Q</M> be &ldquo;the match is cancelled&rdquo;.</p>
        <ul>
          <li>&ldquo;It is raining but the match is on&rdquo; is <M>{"P \\wedge \\neg Q"}</M>: &ldquo;but&rdquo; is &ldquo;and&rdquo; with a tone of contrast.</li>
          <li>&ldquo;The match is cancelled only if it is raining&rdquo; is <M>{"Q \\to P"}</M>.</li>
          <li>&ldquo;The match is on unless it rains&rdquo; is <M>{"\\neg P \\to \\neg Q"}</M>, or equivalently <M>{"\\neg Q \\vee P"}</M>.</li>
        </ul>
        <p>&ldquo;Only if&rdquo; is the most common trap: &ldquo;P only if Q&rdquo; means <M>{"P \\to Q"}</M>, not <M>{"Q \\to P"}</M>.</p>
      </Example>

      <Remark title="a language of thought">
        <p>
          The Stoic logician Chrysippus, in the third century BCE, already studied compound statements and argued about the
          truth conditions of &ldquo;if&rdquo;. Logic in today&rsquo;s symbolic form comes from George Boole, whose{" "}
          <cite>Laws of Thought</cite> (1854) treated &ldquo;and&rdquo; and &ldquo;or&rdquo; like multiplication and
          addition. In 1937 Claude Shannon noticed that Boole&rsquo;s algebra describes electrical switching
          circuits; every digital computer is built from it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "statement",
      rung: "check",
      prompt: <p>Select every sentence that is a statement.</p>,
      answer: {
        kind: "choice",
        options: ["17 is a prime number.", "Is 17 prime?", "There are infinitely many primes.", "x + 1 = 5"],
        correct: [0, 2],
      },
    },
    {
      key: "evaluate",
      rung: "check",
      prompt: <p>P is true and Q is false. Which of these are true?</p>,
      answer: {
        kind: "choice",
        options: ["P ∧ Q", "P ∨ Q", "P → Q", "Q → P", "P ↔ Q"],
        correct: [1, 3],
      },
    },
    {
      key: "only-if",
      rung: "apply",
      prompt: <p>With R for &ldquo;you may vote&rdquo; and A for &ldquo;you are 18 or older&rdquo;, symbolise &ldquo;You may vote only if you are 18 or older&rdquo;.</p>,
      answer: { kind: "choice", options: ["R → A", "A → R", "R ∧ A", "R ↔ A"], correct: [0] },
    },
    {
      key: "unless",
      rung: "apply",
      prompt: <p>With W for &ldquo;we win&rdquo; and T for &ldquo;we train&rdquo;, which symbolises &ldquo;We will not win unless we train&rdquo;?</p>,
      answer: { kind: "choice", options: ["¬T → ¬W", "T → W", "W ∧ T", "¬W ∨ T"], correct: [0, 3] },
    },
    {
      key: "count-true",
      rung: "apply",
      prompt: <p>Of the four combinations of truth values for P and Q, in how many is <M>{"P \\to Q"}</M> true?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "vacuous",
      rung: "prove",
      prompt: (
        <p>
          A friend says it is absurd that &ldquo;if 2 + 2 = 5, then the moon is made of paneer&rdquo; counts as true. Explain,
          as convincingly as you can, why mathematicians nevertheless define <M>{"P \\to Q"}</M> to be true when P is false.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that the conditional is only broken when P is true and Q is false.",
          "Gives the promise analogy, or a similar everyday case.",
          "Explains the role of general statements: 'for every n, if P(n) then Q(n)' needs instances with false P(n) to be true.",
          "Acknowledges the oddity, noting that the material conditional does not claim a connection between P and Q.",
        ],
      },
    },
    {
      key: "xor",
      rung: "stretch",
      prompt: <p>Which formula is true exactly when one, but not both, of P and Q is true?</p>,
      answer: { kind: "choice", options: ["¬(P ↔ Q)", "(P ∨ Q) ∧ ¬(P ∧ Q)", "P ∨ Q", "(P ∧ ¬Q) ∨ (¬P ∧ Q)"], correct: [0, 1, 3] },
    },
  ],

  teachBack:
    "Explain to a friend what the five connectives mean, and why 'if P then Q' counts as true whenever P is false.",

  glimpse: (
    <p>
      Next, truth tables, which work out the truth value of any compound statement mechanically. The same connectives are the bitwise operations of Computer Systems, and the conditions of every if statement you wrote in Programming from Zero.
    </p>
  ),
};
