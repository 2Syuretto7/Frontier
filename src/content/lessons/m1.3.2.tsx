import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { OddSquareViz } from "@/components/viz/OddSquareViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.3.2",
  minutes: 60,
  links: {
    revisits: ["m1.1.4", "m1.2.3"],
    foreshadows: ["m1.3.3", "m4.4.3"],
  },

  puzzle: (
    <>
      <p>Prove: if <M>{"n^2"}</M> is even, then n is even.</p>
      <p>
        Try it directly. Assume <M>{"n^2"}</M> is even, so <M>{"n^2 = 2k"}</M> for some integer k. Then{" "}
        <M>{"n = \\sqrt{2k}"}</M>&hellip; and now what? There is no obvious way to show that <M>{"\\sqrt{2k}"}</M> is even, or
        even an integer. Where did the direct method go wrong, and is there a way round?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The hypothesis &ldquo;<M>{"n^2"}</M> is even&rdquo; gives you information about <M>{"n^2"}</M>, but you want to
        conclude something about n, and square roots are hard to compute with. Turn the problem round. A conditional is
        equivalent to its contrapositive, so it is enough to prove: <em>if n is odd, then <M>{"n^2"}</M> is odd</em>. Now
        the hypothesis is about n, which is easy to unpack, and the conclusion is about <M>{"n^2"}</M>, which is easy to
        compute.
      </p>
      <p>
        Below, an n by n square is cut up to show why an odd n gives an odd <M>{"n^2"}</M>. Step through odd and even values
        of n.
      </p>
      <OddSquareViz />
    </>
  ),

  theory: (
    <>
      <Definition title="proof by contrapositive">
        <p>
          To prove <M>{"P \\to Q"}</M> by <strong>contrapositive</strong>, give a direct proof of{" "}
          <M>{"\\neg Q \\to \\neg P"}</M>: assume Q is false and deduce that P is false. This is valid because the two
          conditionals are logically equivalent, as you saw in the lesson on conditionals.
        </p>
      </Definition>

      <Theorem title="even squares">
        <p>For every integer n, if <M>{"n^2"}</M> is even, then n is even.</p>
      </Theorem>
      <Proof>
        <p>
          We prove the contrapositive: if n is odd, then <M>{"n^2"}</M> is odd. Let n be odd, so <M>{"n = 2k + 1"}</M> for
          some integer k. Then
        </p>
        <MD>{"n^2 = 4k^2 + 4k + 1 = 2(2k^2 + 2k) + 1,"}</MD>
        <p>
          and <M>{"2k^2 + 2k"}</M> is an integer, so <M>{"n^2"}</M> is odd. (Here &ldquo;not even&rdquo; and &ldquo;odd&rdquo;
          mean the same, since every integer is exactly one of the two.)
        </p>
      </Proof>

      <Remark title="when to reach for it">
        <p>
          Try the contrapositive when the conclusion Q is a negative or awkward statement, or when its negation{" "}
          <M>{"\\neg Q"}</M> is easier to unpack than P. Statements of the form &ldquo;if <M>{"x^2"}</M>&hellip; then
          x&hellip;&rdquo;, or &ldquo;if a product&hellip; then a factor&hellip;&rdquo;, are typical. When you write it up,
          say at the start that you are proving the contrapositive and state it, so the reader knows the plan.
        </p>
      </Remark>

      <Example title="a pigeonhole flavour">
        <p>
          Claim: if <M>{"x + y \\ge 100"}</M> for real numbers x and y, then <M>{"x \\ge 50"}</M> or <M>{"y \\ge 50"}</M>.
          The contrapositive is: if <M>{"x < 50"}</M> and <M>{"y < 50"}</M>, then <M>{"x + y < 100"}</M>. That is
          immediate, by adding the two inequalities. Notice how De Morgan&rsquo;s law turned the &ldquo;or&rdquo; into an
          &ldquo;and&rdquo;, which is much easier to use as a hypothesis.
        </p>
      </Example>

      <Example title="a product with a factor">
        <p>
          Claim: for integers a and b, if ab is even then a is even or b is even. Contrapositive: if a and b are both odd,
          then ab is odd. With <M>{"a = 2j + 1"}</M> and <M>{"b = 2k + 1"}</M>,{" "}
          <M>{"ab = 4jk + 2j + 2k + 1 = 2(2jk + j + k) + 1"}</M>, which is odd.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "state",
      rung: "check",
      prompt: <p>To prove &ldquo;if 3n + 2 is odd, then n is odd&rdquo; by contrapositive, what do you assume and what do you show?</p>,
      answer: {
        kind: "choice",
        options: [
          "Assume n is odd; show 3n + 2 is odd.",
          "Assume n is even; show 3n + 2 is even.",
          "Assume 3n + 2 is even; show n is even.",
          "Assume n is even and 3n + 2 is odd; find a contradiction.",
        ],
        correct: [1],
      },
    },
    {
      key: "square",
      rung: "check",
      prompt: <p>If <M>{"n = 2k + 1"}</M>, expand <M>{"n^2"}</M>.</p>,
      answer: { kind: "expression", value: "4*k^2 + 4*k + 1", variables: ["k"] },
    },
    {
      key: "three-n",
      rung: "apply",
      prompt: <p>If <M>{"n = 2k"}</M>, then <M>{"3n + 2 = 2m"}</M> for an integer m. Write m in terms of k.</p>,
      answer: { kind: "expression", value: "3*k + 1", variables: ["k"] },
    },
    {
      key: "de-morgan",
      rung: "apply",
      prompt: <p>What is the contrapositive of &ldquo;if xy is irrational, then x is irrational or y is irrational&rdquo;?</p>,
      answer: {
        kind: "choice",
        options: [
          "If x and y are both rational, then xy is rational.",
          "If x or y is rational, then xy is rational.",
          "If x is irrational or y is irrational, then xy is irrational.",
          "If xy is rational, then x and y are rational.",
        ],
        correct: [0],
      },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>For which of these is a proof by contrapositive the natural choice?</p>,
      answer: {
        kind: "choice",
        options: [
          "If n is even, then n² is even.",
          "If n² is odd, then n is odd.",
          "If a and b are odd, then a + b is even.",
          "If a | b and b | c, then a | c.",
        ],
        correct: [1],
      },
    },
    {
      key: "five",
      rung: "prove",
      prompt: <p>Prove that for every integer n, if <M>{"n^2 - 6n + 5"}</M> is even, then n is odd.</p>,
      answer: {
        kind: "written",
        rubric: [
          "States that the proof is by contrapositive: if n is even, then n² − 6n + 5 is odd.",
          "Writes n = 2k and computes n² − 6n + 5 = 4k² − 12k + 5.",
          "Repacks as 2(2k² − 6k + 2) + 1 and notes the bracket is an integer, so the expression is odd.",
        ],
      },
    },
    {
      key: "three",
      rung: "stretch",
      prompt: (
        <p>
          Prove that if <M>{"n^2"}</M> is divisible by 3, then n is divisible by 3. (Hint: an integer not divisible by 3 is of
          the form <M>{"3k + 1"}</M> or <M>{"3k + 2"}</M>.)
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Proves the contrapositive: if 3 does not divide n, then 3 does not divide n².",
          "Handles the case n = 3k + 1, getting n² = 3(3k² + 2k) + 1.",
          "Handles the case n = 3k + 2, getting n² = 3(3k² + 4k + 1) + 1.",
          "Concludes that n² leaves remainder 1 on division by 3 in both cases, so 3 does not divide n².",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why the direct proof that 'n² even implies n even' gets stuck, and how the contrapositive gets it unstuck.",

  glimpse: (
    <p>
      The result of this lesson, that <M>{"n^2"}</M> even forces n even, is the key step in the most famous proof by
      contradiction in history: that <M>{"\\sqrt 2"}</M> is irrational. That is the next lesson. The stretch exercise, with
      its cases by remainder, is a first taste of modular arithmetic.
    </p>
  ),
};
