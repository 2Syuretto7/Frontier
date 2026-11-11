import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { DominoViz } from "@/components/viz/DominoViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.5.1",
  minutes: 70,
  links: {
    revisits: ["m0.7.2", "m1.2.2"],
    foreshadows: ["m4.2.2"],
  },

  puzzle: (
    <>
      <p>Add up the first few odd numbers:</p>
      <MD>{"1 = 1, \\quad 1 + 3 = 4, \\quad 1 + 3 + 5 = 9, \\quad 1 + 3 + 5 + 7 = 16."}</MD>
      <p>
        The answers are the square numbers. You met a picture of this in the lesson on sequences. But a picture of five
        layers is not a proof for five million. How can a finite argument establish a fact about <em>every</em> natural
        number, infinitely many of them?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Imagine an endless row of dominoes, one for each natural number. If you push the first, and if every domino is close
        enough to knock over the next, then every domino falls, however far along it is. You do not need to watch each one
        fall; two facts about the row are enough.
      </p>
      <p>
        That is <strong>mathematical induction</strong>. The push is the <strong>base case</strong>: the statement holds for
        the first number. The spacing is the <strong>inductive step</strong>: whenever the statement holds for one number, it
        holds for the next. Try breaking each condition below.
      </p>
      <DominoViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the principle of mathematical induction">
        <p>Let <M>{"P(n)"}</M> be a statement about natural numbers n. Suppose</p>
        <ol>
          <li>(<strong>base case</strong>) <M>{"P(1)"}</M> is true, and</li>
          <li>(<strong>inductive step</strong>) for every <M>{"k \\ge 1"}</M>, if <M>{"P(k)"}</M> is true then <M>{"P(k + 1)"}</M> is true.</li>
        </ol>
        <p>
          Then <M>{"P(n)"}</M> is true for every <M>{"n \\ge 1"}</M>. In the inductive step, the assumption{" "}
          <M>{"P(k)"}</M> is called the <strong>inductive hypothesis</strong>. The base case may start at any number, such as 0
          or 4, and the conclusion then holds from there on.
        </p>
      </Definition>

      <Theorem title="sums of odd numbers">
        <p>For every <M>{"n \\ge 1"}</M>, <M>{"1 + 3 + 5 + \\cdots + (2n - 1) = n^2"}</M>.</p>
      </Theorem>
      <Proof>
        <p><em>Base case.</em> For n = 1 the left side is 1 and the right side is <M>{"1^2 = 1"}</M>.</p>
        <p>
          <em>Inductive step.</em> Let <M>{"k \\ge 1"}</M> and suppose <M>{"1 + 3 + \\cdots + (2k - 1) = k^2"}</M>. The next odd
          number is <M>{"2(k + 1) - 1 = 2k + 1"}</M>, so
        </p>
        <MD>{"1 + 3 + \\cdots + (2k - 1) + (2k + 1) = k^2 + 2k + 1 = (k + 1)^2."}</MD>
        <p>That is the statement for <M>{"k + 1"}</M>. By induction, it holds for every <M>{"n \\ge 1"}</M>.</p>
      </Proof>

      <Remark title="the shape of the step">
        <p>
          In the inductive step you do not prove <M>{"P(k)"}</M>; you assume it, and use it. The art is to find{" "}
          <M>{"P(k)"}</M> inside <M>{"P(k + 1)"}</M>. In sums, the sum up to <M>{"k + 1"}</M> is the sum up to k plus one more
          term. In divisibility, rewrite the <M>{"k + 1"}</M> expression as the k expression plus something visibly divisible.
        </p>
      </Remark>

      <Example title="a divisibility proof">
        <p>
          Claim: 3 divides <M>{"n^3 - n"}</M> for every <M>{"n \\ge 0"}</M>. For n = 0, <M>{"0^3 - 0 = 0"}</M>, and 3 divides 0.
          Suppose 3 divides <M>{"k^3 - k"}</M>. Then
        </p>
        <MD>{"(k + 1)^3 - (k + 1) = k^3 + 3k^2 + 3k + 1 - k - 1 = (k^3 - k) + 3(k^2 + k),"}</MD>
        <p>a sum of two multiples of 3. So 3 divides it, and the claim holds for all n.</p>
      </Example>

      <Remark title="all horses are the same colour">
        <p>
          A famous false &ldquo;proof&rdquo;: in any group of n horses, all have the same colour. Base case: one horse. Step:
          given k + 1 horses, remove one; the remaining k have one colour. Put it back and remove another; again the k left have
          one colour. The two groups overlap, so all k + 1 share a colour. The error is in the step from 1 to 2: with two
          horses, the two groups of one do not overlap. The step must work for <em>every</em> k, including the smallest, which
          is exactly the broken gap in the dominoes.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "parts",
      rung: "check",
      prompt: <p>Which two things must be proved in a proof by induction that P(n) holds for all n ≥ 1?</p>,
      answer: {
        kind: "choice",
        options: [
          "P(1), and P(k) → P(k + 1) for every k ≥ 1.",
          "P(1) and P(2).",
          "P(k + 1) → P(k) for every k.",
          "P(n) for several large n.",
        ],
        correct: [0],
      },
    },
    {
      key: "gauss",
      rung: "check",
      prompt: <p>Using <M>{"1 + 2 + \\cdots + n = \\tfrac{n(n + 1)}{2}"}</M>, what is <M>{"1 + 2 + \\cdots + 100"}</M>?</p>,
      answer: { kind: "numeric", value: 5050 },
    },
    {
      key: "step-term",
      rung: "apply",
      prompt: (
        <p>
          In proving <M>{"1 + 2 + \\cdots + n = \\tfrac{n(n+1)}{2}"}</M> by induction, the step adds the term k + 1 to{" "}
          <M>{"\\tfrac{k(k+1)}{2}"}</M>. Simplify the result as a single expression in k.
        </p>
      ),
      answer: { kind: "expression", value: "(k+1)*(k+2)/2", variables: ["k"] },
    },
    {
      key: "powers",
      rung: "apply",
      prompt: <p>What is <M>{"1 + 2 + 4 + \\cdots + 2^{9}"}</M>? (Guess the pattern from small cases.)</p>,
      answer: { kind: "numeric", value: 1023 },
    },
    {
      key: "horses",
      rung: "apply",
      prompt: <p>In the false proof that all horses are the same colour, for which step k → k + 1 does the argument fail?</p>,
      answer: { kind: "choice", options: ["from 1 to 2", "from 2 to 3", "from 10 to 11", "it fails for every k"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`print(all(sum(range(1, n + 1)) == n * (n + 1) // 2 for n in range(1, 1000)))`}</Code>
          <p>This checks 1 + … + n = n(n + 1)/2 for n below 1000. What does it print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True", "False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            An induction proof has a base case and a step. Write <C>check_step(n)</C>, which returns whether assuming 1 + 3 + … + (2n − 1) = n² gives 1 + 3 + … + (2n + 1) = (n + 1)² — that is, whether n² + (2n + 1) == (n + 1)² — and <C>sum_odds(n)</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def sum_odds(n):
    return n

def check_step(n):
    return False
`,
        solution: `def sum_odds(n):
    return sum(2 * k - 1 for k in range(1, n + 1))

def check_step(n):
    return n * n + (2 * n + 1) == (n + 1) ** 2
`,
        tests: [
          { name: "formula", code: `assert all(sum_odds(n) == n * n for n in range(1, 200)), 'The first n odd numbers add up to n².'` },
          { name: "step", code: `assert all(check_step(n) for n in range(0, 200)), 'Adding the next odd number 2n + 1 to n² gives (n + 1)².'` },
        ],
      },
    },
    {
      key: "squares",
      rung: "prove",
      prompt: <p>Prove by induction that <M>{"1^2 + 2^2 + \\cdots + n^2 = \\tfrac{n(n + 1)(2n + 1)}{6}"}</M> for every <M>{"n \\ge 1"}</M>.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Checks the base case n = 1: both sides equal 1.",
          "States the inductive hypothesis for k.",
          "Adds (k + 1)² to both sides and simplifies to (k + 1)(k + 2)(2k + 3)/6.",
          "Concludes by induction.",
        ],
      },
    },
    {
      key: "inequality",
      rung: "stretch",
      prompt: <p>Prove that <M>{"2^n > n^2"}</M> for every <M>{"n \\ge 5"}</M>. Where exactly does your inductive step use <M>{"k \\ge 5"}</M>?</p>,
      answer: {
        kind: "written",
        rubric: [
          "Checks the base case n = 5: 32 > 25.",
          "Assumes 2ᵏ > k² for some k ≥ 5 and writes 2ᵏ⁺¹ = 2 · 2ᵏ > 2k².",
          "Shows 2k² ≥ (k + 1)², for instance because k² ≥ 2k + 1 when k ≥ 3, and notes where k ≥ 5 (or k ≥ 3) is used.",
          "Concludes by induction.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why proving P(1) and 'P(k) implies P(k + 1)' proves P(n) for every n, using dominoes, and what goes wrong in the horses proof.",

  glimpse: (
    <p>
      Sometimes knowing P(k) alone is not enough to reach P(k + 1), and you need every earlier case at once. That is strong induction, the next lesson. Induction is the main tool for recurrence relations in Discrete Mathematics, and for proving that loops and recursive programs are correct in Data Structures and Algorithms.
    </p>
  ),
};
